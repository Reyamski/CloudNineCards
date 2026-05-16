/**
 * /api/card-request — public "Source an Item / Card Request" endpoint (F3).
 *
 * POST { email, card_name, set_or_details, notes } → INSERT into card_requests
 *                                                     on the server with the
 *                                                     service-role key. Anon
 *                                                     callers cannot write to
 *                                                     the card_requests table
 *                                                     directly once
 *                                                     docs/card-requests-table.sql
 *                                                     is run (RLS on, no anon
 *                                                     policies).
 *
 * - No auth required (guest demand-capture modal on /singles and /shop).
 * - Validates email format and that card_name is a non-empty string.
 * - set_or_details and notes are optional free-text.
 *
 * Mirrors preview/api/waitlist.js exactly: same CORS, same { data, error }
 * response shape as the Supabase JS client.
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
  const email          = String(body.email || '').trim().toLowerCase();
  const card_name      = String(body.card_name || '').trim();
  const set_or_details = String(body.set_or_details || '').trim() || null;
  const notes          = String(body.notes || '').trim() || null;

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ data: null, error: { message: 'Valid email required.' } });
    return;
  }
  if (!card_name) {
    res.status(400).json({ data: null, error: { message: 'card_name required.' } });
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
      .from('card_requests')
      .insert({
        email,
        card_name,
        set_or_details,
        notes,
        created_at: new Date().toISOString(),
      });
    if (error) {
      res.status(400).json({ data: null, error: { message: error.message } });
      return;
    }
    res.status(200).json({ data: { email, card_name }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
