/**
 * /api/subscribe — public newsletter signup endpoint (F1).
 *
 * POST { email }  → upserts the email into the `subscribers` table on the
 *                   server side using the service-role key. RLS on the
 *                   table can drop the legacy "allow all" anon policy —
 *                   anon callers can't INSERT directly anymore, they go
 *                   through this endpoint instead.
 *
 * - No auth required (public homepage form).
 * - Validates email format server-side.
 * - Deduplicates via UPSERT on the email column.
 * - Always returns 200 on a successful upsert. Errors return 400/500 with
 *   a brief message — never leak DB internals to the client.
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
  const email = String(body.email || '').trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ data: null, error: { message: 'Valid email required.' } });
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
      .from('subscribers')
      .upsert(
        { email, subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    if (error) {
      res.status(400).json({ data: null, error: { message: error.message } });
      return;
    }
    res.status(200).json({ data: { email }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
