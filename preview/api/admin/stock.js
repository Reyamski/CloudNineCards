/**
 * /api/admin/stock — upsert for the legacy `stock` table (inventory tab).
 *
 * POST { rows: [{ id, in_stock, quantity }] } → upsert on conflict (id).
 *
 * The `stock` table is the original key→qty map used by the Inventory tab.
 * Keep it routable so when RLS flips on, the Reset/Save Changes flow still
 * works.
 */
import { getServiceClient } from '../_lib/db.js';
import { verifyAdminRequest } from '../_lib/admin-auth-verify.js';

export default async function handler(req, res) {
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ data: null, error: { message: 'Method not allowed' } });
    return;
  }

  const auth = verifyAdminRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ data: null, error: { message: auth.msg } });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const rows = Array.isArray(body?.rows) ? body.rows : null;
  if (!rows) {
    res.status(400).json({ data: null, error: { message: 'rows[] required' } });
    return;
  }

  try {
    const db = getServiceClient();
    const { data, error } = await db.from('stock').upsert(rows, { onConflict: 'id' }).select();
    res.status(error ? 400 : 200).json({ data: data ?? null, error: error ? { message: error.message } : null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
