/**
 * /api/waitlist — public restock-notify endpoint (F2).
 *
 * POST { email, product_id, product_title } → INSERT into waitlist table on
 *                                              the server with service-role
 *                                              key. Anon callers can no
 *                                              longer write to the waitlist
 *                                              table directly once
 *                                              docs/wave3-followups-
 *                                              waitlist-rls.sql is run.
 *
 * - No auth required (public modal on /shop and /singles).
 * - Validates email format and that product_id is a non-empty string.
 * - No dedupe constraint: a buyer may want to be notified multiple times
 *   for different products. If the schema later adds a unique constraint
 *   on (email, product_id), we can switch to upsert.
 *
 * Response shape mirrors the Supabase JS client: { data, error }.
 */
import { getServiceClient } from './_lib/db.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ data: null, error: { message: 'POST only' } });
    return;
  }

  const body = req.body ?? {};
  const email         = String(body.email || '').trim().toLowerCase();
  const product_id    = String(body.product_id || '').trim();
  const product_title = String(body.product_title || '').trim() || null;

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ data: null, error: { message: 'Valid email required.' } });
    return;
  }
  if (!product_id) {
    res.status(400).json({ data: null, error: { message: 'product_id required.' } });
    return;
  }

  let db;
  try { db = getServiceClient(); }
  catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
    return;
  }

  try {
    const { error } = await db
      .from('waitlist')
      .insert({
        email,
        product_id,
        product_title,
        created_at: new Date().toISOString(),
      });
    if (error) {
      res.status(400).json({ data: null, error: { message: error.message } });
      return;
    }
    res.status(200).json({ data: { email, product_id }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
