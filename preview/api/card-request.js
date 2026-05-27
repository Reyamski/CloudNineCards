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
import { createRateLimiter, clientIp } from './_lib/rate-limit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-IP rate limit — card request is a deliberate human action, not
// something legit buyers do in rapid succession. 3 / 15min / IP is
// conservative. Mirrors /api/analyze-card pattern; rate limit runs AFTER the
// honeypot so bots get fake-success 200 without burning the IP budget.
const limiter = createRateLimiter({
  maxHits: 3,
  windowMs: 15 * 60 * 1000,
  label: 'card-request',
});

export function __resetRateLimitForTests() { limiter.reset(); }

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

  // Honeypot — `website` is a hidden off-screen input in the modal that humans
  // never see. Non-empty value = bot. Return a fake 200 success (don't 4xx —
  // a 4xx tells the bot to mutate and retry). Nothing is written to the DB.
  // ORDER MATTERS: honeypot runs BEFORE the rate limiter so bot spam doesn't
  // count against the per-IP budget (and so bots stay convinced they "won").
  if (String(body.website || '').trim() !== '') {
    res.status(200).json({ data: { email, card_name }, error: null });
    return;
  }

  // Per-IP rate limit. Excess → 429 with Retry-After + JSON body. We do NOT
  // fake-success here (unlike honeypot) — card_requests table pollution risk
  // is real, and legit buyers rarely hit 3+ requests in 15 min.
  const ip = clientIp(req);
  const rl = limiter.check(ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({
      error: 'Too many requests',
      retry_after_seconds: rl.retryAfterSec,
    });
    return;
  }

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
