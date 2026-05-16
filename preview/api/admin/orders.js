/**
 * /api/admin/orders — admin orders endpoint.
 *
 * GET    → returns ALL orders sorted by created_at desc.
 *          Service-role read; mirrors what the admin UI previously fetched
 *          with the anon key. Required by Wave 3c-2 Phase B: tightening the
 *          orders SELECT policy blocks anon-key reads from the browser, so
 *          the admin list now flows through this endpoint instead.
 * PATCH  → { id, patch }   → update status / payment_status / confirmed_at etc.
 *
 * No POST/DELETE — orders are created by the cart RPC and never hard-deleted
 * from the admin UI. (Cancellation is a status change, not a row removal.)
 */
import { getServiceClient } from '../_lib/db.js';
import { verifyAdminRequest } from '../_lib/admin-auth-verify.js';
import { makeAdminTableHandler } from '../_lib/admin-route.js';

const patchHandler = makeAdminTableHandler({ table: 'orders', methods: ['PATCH'] });

function setCors(req, res, methods) {
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
  res.setHeader('Access-Control-Allow-Methods', methods.join(', ') + ', OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    setCors(req, res, ['GET', 'PATCH']);
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
    try {
      const { data, error } = await db
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      res.status(error ? 400 : 200).json({
        data: data ?? null,
        error: error ? { message: error.message, code: error.code } : null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
    return;
  }
  return patchHandler(req, res);
}
