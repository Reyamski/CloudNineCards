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
import { createRateLimiter, clientIp } from './_lib/rate-limit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-IP rate limit — newsletter signup is cheap to abuse (bots can fill the
// subscribers table fast). 5 / 15min / IP is conservative; humans don't
// legitimately hit subscribe 5+ times in 15 min. Mirrors /api/analyze-card.
// IMPORTANT: rate-limit runs AFTER honeypot — bots get a fake-success 200
// without incrementing the counter; only real over-rate scripts hit 429.
const limiter = createRateLimiter({
  maxHits: 5,
  windowMs: 15 * 60 * 1000,
  label: 'subscribe',
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
  const email = String(body.email || '').trim().toLowerCase();

  // Honeypot — `website` is a hidden off-screen input in the homepage form
  // that humans never see. Any value here = bot. Return a fake 200 success
  // so bots don't iterate to find what's being filtered. Nothing is written
  // to the DB. Same pattern in /api/card-request.
  // ORDER MATTERS: honeypot runs BEFORE the rate limiter so bot spam doesn't
  // count against the per-IP budget (and so bots stay convinced they "won").
  if (String(body.website || '').trim() !== '') {
    res.status(200).json({ data: { email }, error: null });
    return;
  }

  // Per-IP rate limit. Excess → 429 with Retry-After + JSON body. We do NOT
  // fake-success here (unlike honeypot) — subscribers-table pollution risk
  // is real and a legit human won't realistically hit this.
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
