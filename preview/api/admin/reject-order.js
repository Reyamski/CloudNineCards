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
 *   - stock_restored_at is stamped ONLY if every eligible in-stock line was
 *     restored successfully. If any line fails, the order is still flagged
 *     payment_rejected (the admin did reject it) but stock_restored_at is
 *     left NULL so the idempotent guard isn't tripped and the admin can
 *     retry until restore actually succeeds. The recurring "rejected but
 *     stock didn't come back" bug was caused by stamping unconditionally.
 *
 * Response shape mirrors the Supabase client:
 *   { data: { order_id, already_restored, restored:[...], failed:[...] },
 *     error }
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
    let failed = [];

    if (!alreadyRestored) {
      const { data: items, error: iErr } = await db
        .from('order_items')
        .select('source_table, item_id, qty, is_preorder')
        .eq('order_id', orderId);

      // If we can't even read the lines we don't know what to restore — bail
      // BEFORE stamping so the admin can retry. Order is not flagged here;
      // the AdminPage already PATCHed payment_status separately.
      if (iErr) {
        res.status(400).json({
          data: { order_id: orderId, already_restored: false, restored: [], failed: [] },
          error: { message: `could not read order_items: ${iErr.message}` },
        });
        return;
      }

      for (const line of (items || [])) {
        if (line.is_preorder) continue;                 // never decremented
        const src = line.source_table;
        const qty = Number(line.qty) || 0;
        if ((src !== 'singles' && src !== 'products') || qty <= 0 || !line.item_id) continue;

        // Atomic increment via SECURITY DEFINER RPC (granted to service_role
        // per docs/vuln-rpc-hardening.sql). No read-then-write race; the RPC
        // RAISEs (→ PostgREST error) if the item row is missing, so a silent
        // "item not found" can no longer masquerade as success.
        const { data: rpcData, error: rpcErr } = await db.rpc('restore_item_stock', {
          source:  src,
          item_id: line.item_id,
          qty,
        });

        if (rpcErr) {
          failed.push({
            source: src, item_id: line.item_id, qty,
            error: rpcErr.message || 'restore_item_stock failed',
          });
          continue;
        }

        const remaining = (rpcData && typeof rpcData.remaining === 'number')
          ? rpcData.remaining
          : null;
        restored.push({ source: src, item_id: line.item_id, qty, remaining });
      }
    }

    // Flag the order rejected regardless (the admin DID reject it). Only
    // stamp stock_restored_at when there were NO failures — stamping on a
    // partial/failed restore is exactly the bug that permanently lost stock,
    // because the alreadyRestored guard then blocks every retry.
    const fullySucceeded = !alreadyRestored && failed.length === 0;
    const patch = { payment_status: 'payment_rejected' };
    if (fullySucceeded) patch.stock_restored_at = new Date().toISOString();

    const { error: uErr } = await db.from('orders').update(patch).eq('id', orderId);
    if (uErr) { res.status(400).json({ data: null, error: { message: uErr.message } }); return; }

    const partialFailure = !alreadyRestored && failed.length > 0;
    res.status(partialFailure ? 207 : 200).json({
      data: {
        order_id: orderId,
        already_restored: alreadyRestored,
        restored,
        failed,
      },
      error: partialFailure
        ? { message: `${failed.length} item(s) failed to restore; stock_restored_at NOT set — retry the rejection.` }
        : null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
