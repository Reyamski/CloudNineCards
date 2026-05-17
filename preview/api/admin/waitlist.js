/**
 * /api/admin/waitlist — admin waitlist read endpoint.
 *
 * GET → returns ALL waitlist rows, newest first.
 *
 * Service-role read; mirrors /api/admin/order-items. The waitlist table has
 * RLS ON with no anon policies (docs/wave3-followups-waitlist-rls.sql), so
 * the admin UI can't read it with the anon key — this endpoint does.
 *
 * No writes — rows are inserted by /api/waitlist and read-only here.
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

  try {
    const { data, error } = await db
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    res.status(error ? 400 : 200).json({
      data: data ?? null,
      error: error ? { message: error.message, code: error.code } : null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
