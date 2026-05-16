/**
 * /api/admin/reject-order — admin marks an order payment-rejected and
 * restores its in-stock units, server-side, with the service-role key.
 *
 * Replaces the old client-side flow where AdminPage looped order_items and
 * called the anon-callable restore_item_stock RPC. That RPC is being
 * revoked from anon (see docs/vuln-rpc-hardening.sql); restoration now
 * happens here behind the admin token + service role.
 *
 * POST { order_id }
 *   - 401 if no/!valid admin token
 *   - Idempotent: if orders.stock_restored_at is already set, the order is
 *     just (re)flagged payment_rejected and stock is NOT restored again.
 *   - Pre-order lines are skipped (they never decremented stock).
 *
 * Response shape mirrors the Supabase client: { data, error }.
 */
import { getServiceClient } from '../_lib/db.js';
import { verifyAdminRequest } from '../_lib/admin-auth-verify.js';

function setCors(req, res) {
  const origin = req.headers?.origin || '';
  const host   = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const expected = `https://${host}`;
  const expectedHttp = `http://${host}`;
  let allowOrigin = '';
  if (origin && (origin === expected || origin === expectedHttp)) allowOrigin = origin;
  else if (!origin) allowOrigin = expected;
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ data: null, error: { message: 'POST only' } });
    return;
  }

  const auth = verifyAdminRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ data: null, error: { message: auth.msg } });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const orderId = body?.order_id;
  if (!orderId) {
    res.status(400).json({ data: null, error: { message: 'order_id required' } });
    return;
  }

  let db;
  try { db = getServiceClient(); }
  catch (err) { res.status(500).json({ data: null, error: { message: err.message } }); return; }

  try {
    const { data: order, error: oErr } = await db
      .from('orders')
      .select('id, payment_status, stock_restored_at')
      .eq('id', orderId)
      .maybeSingle();
    if (oErr)  { res.status(400).json({ data: null, error: { message: oErr.message } }); return; }
    if (!order) { res.status(404).json({ data: null, error: { message: 'order not found' } }); return; }

    const alreadyRestored = !!order.stock_restored_at;
    let restored = [];

    if (!alreadyRestored) {
      const { data: items } = await db
        .from('order_items')
        .select('source_table, item_id, qty, is_preorder')
        .eq('order_id', orderId);

      for (const line of (items || [])) {
        if (line.is_preorder) continue;                 // never decremented
        const src = line.source_table;
        const qty = Number(line.qty) || 0;
        if ((src !== 'singles' && src !== 'products') || qty <= 0 || !line.item_id) continue;

        // Read current stock then write back +qty. Cast id to text so it
        // works whether the table PK is uuid (singles) or text (products).
        const { data: cur } = await db.from(src).select('id, stock').limit(1)
          .filter('id', 'eq', line.item_id);
        const row = Array.isArray(cur) ? cur[0] : cur;
        if (!row) continue;
        const next = (Number(row.stock) || 0) + qty;
        const patch = src === 'products'
          ? { stock: next, in_stock: next > 0, badge: next > 0 ? 'In Stock' : 'Sold Out' }
          : { stock: next, in_stock: next > 0 };
        await db.from(src).update(patch).eq('id', row.id);
        restored.push({ source: src, item_id: line.item_id, qty, remaining: next });
      }
    }

    const patch = { payment_status: 'payment_rejected' };
    if (!alreadyRestored) patch.stock_restored_at = new Date().toISOString();

    const { error: uErr } = await db.from('orders').update(patch).eq('id', orderId);
    if (uErr) { res.status(400).json({ data: null, error: { message: uErr.message } }); return; }

    res.status(200).json({
      data: { order_id: orderId, already_restored: alreadyRestored, restored },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
