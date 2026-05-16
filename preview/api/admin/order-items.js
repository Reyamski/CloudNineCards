/**
 * /api/admin/order-items — admin order_items read endpoint.
 *
 * GET ?order_id=<uuid>  → returns order_items rows for that order,
 *                          sorted by created_at asc.
 * GET (no query)        → returns ALL order_items rows.
 *
 * Service-role read; required by Wave 3c-2 Phase B because the tightened
 * order_items SELECT policy blocks anon-key reads from the admin UI.
 *
 * No writes — order_items rows are inserted by submit_cart_orders_v2 (RPC,
 * SECURITY DEFINER) and never modified by the admin UI.
 *
 * Response shape mirrors the Supabase JS client: { data, error }.
 */
import { getServiceClient } from '../_lib/db.js';
import { verifyAdminRequest } from '../_lib/admin-auth-verify.js';

function setCors(req, res) {
  const origin = req.headers?.origin || '';
  const host   = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const expected = `https://${host}`;
  const expectedHttp = `http://${host}`;
  let allowOrigin = '';
  if (origin && (origin === expected || origin === expectedHttp)) {
    allowOrigin = origin;
  } else if (!origin) {
    allowOrigin = expected;
  }
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') {
    res.status(405).json({ data: null, error: { message: `Method ${req.method} not allowed` } });
    return;
  }

  const auth = verifyAdminRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ data: null, error: { message: auth.msg } });
    return;
  }

  let db;
  try { db = getServiceClient(); }
  catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
    return;
  }

  // order_id may arrive via req.query (Vercel) or be parsed from req.url
  // (local dev server, which just hands us the raw URL).
  let orderId = null;
  try {
    if (req.query && typeof req.query.order_id === 'string') {
      orderId = req.query.order_id;
    } else if (req.url) {
      const u = new URL(req.url, 'http://localhost');
      orderId = u.searchParams.get('order_id');
    }
  } catch { /* leave orderId null → return all */ }

  try {
    let query = db
      .from('order_items')
      .select('*')
      .order('created_at', { ascending: true });
    if (orderId) query = query.eq('order_id', orderId);
    const { data, error } = await query;
    res.status(error ? 400 : 200).json({
      data: data ?? null,
      error: error ? { message: error.message, code: error.code } : null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
