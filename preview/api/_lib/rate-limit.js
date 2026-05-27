/**
 * Shared per-IP sliding-window rate limiter for /api endpoints.
 *
 * Extracted from /api/analyze-card (commit d057600d) so /api/subscribe and
 * /api/card-request can reuse the same pattern. /api/admin-auth is NOT
 * migrated — it counts only failed attempts (not all hits), which is a
 * different semantic; forcing it onto this shape would change its behavior.
 *
 * Pattern:
 *   In-memory Map<ip, number[]>  → array of recent hit timestamps.
 *   Every check filters out timestamps older than `windowMs`. If the
 *   remaining count is >= `maxHits`, the request is denied and we report
 *   the seconds until the OLDEST surviving hit expires (sliding window —
 *   the window moves with each accepted hit, not a fixed 15-min bucket).
 *
 * Caveats:
 *   - Per-instance memory. Vercel may run multiple serverless instances in
 *     parallel; each has its own Map. This is a speed-bump not a hard cap.
 *     For absolute caps, back with Vercel KV / Upstash Redis.
 *   - No IP available (proxy misconfig, edge case) → ALLOW the request.
 *     Logged once via console.warn(label, ...). Defensive: better to let a
 *     legit caller through than block everyone.
 *
 * Usage:
 *   import { createRateLimiter, clientIp } from './_lib/rate-limit.js';
 *   const rl = createRateLimiter({ maxHits: 5, windowMs: 15*60*1000, label: 'subscribe' });
 *   ...
 *   const r = rl.check(clientIp(req));
 *   if (!r.allowed) {
 *     res.setHeader('Retry-After', String(r.retryAfterSec));
 *     return res.status(429).json({ error: 'Too many requests', retry_after_seconds: r.retryAfterSec });
 *   }
 */

export function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || '';
}

/**
 * @param {object} opts
 * @param {number} opts.maxHits   Max requests within windowMs before 429.
 * @param {number} opts.windowMs  Sliding window length in ms.
 * @param {string} [opts.label]   Tag used in console.warn when IP is missing.
 * @returns {{ check: (ip: string) => { allowed: boolean, retryAfterSec: number, count: number }, reset: () => void }}
 */
export function createRateLimiter({ maxHits, windowMs, label = 'rate-limit' }) {
  const hits = new Map(); // ip -> number[] (timestamps)

  function check(ip) {
    if (!ip) {
      console.warn(`[${label}] no client IP available — skipping rate limit`);
      return { allowed: true, retryAfterSec: 0, count: 0 };
    }
    const now = Date.now();
    const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (arr.length >= maxHits) {
      if (arr.length) hits.set(ip, arr);
      const retryAfterMs = windowMs - (now - arr[0]);
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        count: arr.length,
      };
    }
    arr.push(now);
    hits.set(ip, arr);
    return { allowed: true, retryAfterSec: 0, count: arr.length };
  }

  // Test-only helper to reset state between unit tests / between rapid local
  // verification runs. Not invoked by any production code path.
  function reset() {
    hits.clear();
  }

  return { check, reset };
}
