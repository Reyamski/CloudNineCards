/**
 * Admin session token verifier.
 *
 * Validates the HMAC signature on the bearer token issued by /api/admin-auth.
 * Token format (from preview/api/admin-auth.js):
 *   base64url(JSON.stringify({ exp: <ms> })).base64url(hmac-sha256(payloadB64, ADMIN_SESSION_SECRET))
 *
 * Usage:
 *   import { verifyAdminRequest } from './_lib/admin-auth-verify.js';
 *   const check = verifyAdminRequest(req);
 *   if (!check.ok) return res.status(check.status).json({ error: check.msg });
 */
import crypto from 'crypto';

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function fromBase64Url(b64) {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4);
  return Buffer.from(padded, 'base64');
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function verifyAdminRequest(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return { ok: false, status: 500, msg: 'Admin session secret not configured.' };
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, msg: 'Missing bearer token.' };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || !token.includes('.')) {
    return { ok: false, status: 401, msg: 'Malformed token.' };
  }

  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) {
    return { ok: false, status: 401, msg: 'Malformed token.' };
  }

  // Recompute the HMAC over the payload portion and compare.
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest();
  const expectedSigB64 = base64url(expectedSig);
  if (!timingSafeEqualStr(sigB64, expectedSigB64)) {
    return { ok: false, status: 401, msg: 'Bad signature.' };
  }

  // Decode payload and check exp.
  let payload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64).toString('utf8'));
  } catch {
    return { ok: false, status: 401, msg: 'Unreadable payload.' };
  }
  if (typeof payload?.exp !== 'number' || payload.exp < Date.now()) {
    return { ok: false, status: 401, msg: 'Session expired.' };
  }

  return { ok: true };
}
