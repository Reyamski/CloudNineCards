/**
 * Vercel Serverless Function — /api/admin-auth
 *
 * POST { password } → { token } on match, or 401 on mismatch.
 *
 * The admin password used to be a VITE_-prefixed env var, which Vite
 * inlines into the client bundle. Anyone could grep the JS for the
 * password. This endpoint moves the check server-side so the password
 * never reaches the browser.
 *
 * Token format: base64url(payload).base64url(hmac-sha256(payload, secret))
 *   payload = JSON { exp: <unix-ms> }
 *
 * Required env vars (server-only, no VITE_ prefix):
 *   - ADMIN_PASSWORD          plaintext admin password to check against
 *   - ADMIN_SESSION_SECRET    HMAC secret used to sign the session token
 *
 * NOTE: The actual DB writes from the admin panel still go through the
 * Supabase anon key (RLS disabled). This endpoint hides the password from
 * the bundle but does NOT prevent a determined attacker with the anon key
 * from writing directly via Supabase REST. Full hardening requires RLS
 * policies + service-role auth — tracked as Wave 2 work.
 */
import crypto from 'crypto';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// ── Brute-force throttle ────────────────────────────────────────────────
// Per-IP sliding window. Serverless memory is per-instance so this is a
// speed-bump, not a hard guarantee — for strong protection back it with
// Vercel KV / Upstash. Still raises cost of a guessing attack substantially.
const MAX_FAILS   = 5;
const WINDOW_MS   = 15 * 60 * 1000; // 15 min
const fails = new Map(); // ip -> number[] (timestamps of recent failures)

function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}
function recentFails(ip) {
  const now = Date.now();
  const arr = (fails.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (arr.length) fails.set(ip, arr); else fails.delete(ip);
  return arr;
}
function noteFail(ip) {
  const arr = recentFails(ip);
  arr.push(Date.now());
  fails.set(ip, arr);
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export default async function handler(req, res) {
  // Same-origin only — no wildcard. Mirrors the other /api endpoints.
  const origin = req.headers?.origin || '';
  const host   = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  if (!origin || origin === `https://${host}` || origin === `http://${host}`) {
    res.setHeader('Access-Control-Allow-Origin', origin || `https://${host}`);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const ip = clientIp(req);
  if (recentFails(ip).length >= MAX_FAILS) {
    res.setHeader('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
    res.status(429).json({ error: 'Too many attempts. Try again later.' });
    return;
  }

  const adminPassword  = process.env.ADMIN_PASSWORD;
  const sessionSecret  = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    res.status(500).json({ error: 'Admin auth not configured on server.' });
    return;
  }

  // Body may already be parsed by Vercel; defensively support raw string too.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = body?.password;

  if (typeof password !== 'string' || !timingSafeEqualStr(password, adminPassword)) {
    noteFail(ip);
    // Generic message — don't leak whether the password is set, malformed, etc.
    res.status(401).json({ error: 'Invalid password.' });
    return;
  }
  fails.delete(ip); // success clears the counter

  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = base64url(payload);
  const sig = crypto.createHmac('sha256', sessionSecret).update(payloadB64).digest();
  const sigB64 = base64url(sig);
  const token = `${payloadB64}.${sigB64}`;

  res.status(200).json({ token, expiresAt: JSON.parse(payload).exp });
}
