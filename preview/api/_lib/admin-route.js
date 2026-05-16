/**
 * Shared dispatch for admin CRUD endpoints.
 *
 * Each route file picks one whitelisted table and delegates to this helper.
 * The helper:
 *  - Sets tight CORS (same-origin only — header echoed from the request when
 *    it matches the deploy host).
 *  - Verifies the bearer token via verifyAdminRequest().
 *  - Routes POST/PATCH/DELETE to insert/update/delete on the table.
 *
 * Bodies the frontend sends (all JSON):
 *   POST   → row payload                                  → insert + select().single()
 *   PATCH  → { id, patch }                                → update(patch).eq('id', id)
 *   DELETE → { id }                                       → delete().eq('id', id)
 *
 * The response shape mirrors the Supabase JS client: `{ data, error }` so the
 * frontend can swap `supabase.from(...).insert(...)` for `adminFetch(...)`
 * mechanically.
 */
import { getServiceClient } from './db.js';
import { verifyAdminRequest } from './admin-auth-verify.js';

function setCors(req, res, methods) {
  // Echo origin only if it matches the request's host — same-origin in
  // practice. Vercel forwards x-forwarded-host; fall back to host.
  const origin = req.headers?.origin || '';
  const host   = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const expected = `https://${host}`;
  const expectedHttp = `http://${host}`;
  let allowOrigin = '';
  if (origin && (origin === expected || origin === expectedHttp)) {
    allowOrigin = origin;
  } else if (!origin) {
    // No Origin header (e.g. server-side curl, same-origin XHR in some
    // browsers). Treat as same-origin — admin token is still required.
    allowOrigin = expected;
  }
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods.join(', ') + ', OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body ?? {};
}

/**
 * @param {object} opts
 * @param {string} opts.table        — whitelisted table name
 * @param {string[]} [opts.methods]  — allowed methods (default: POST, PATCH, DELETE)
 * @param {(row:object)=>object} [opts.transformInsert]  — optional shape massage before insert
 * @param {(patch:object)=>object} [opts.transformPatch] — optional shape massage before update
 */
export function makeAdminTableHandler({ table, methods = ['POST', 'PATCH', 'DELETE'], transformInsert, transformPatch }) {
  return async function handler(req, res) {
    setCors(req, res, methods);
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (!methods.includes(req.method)) {
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

    const body = parseBody(req);

    try {
      if (req.method === 'POST') {
        const payload = transformInsert ? transformInsert(body) : body;
        const { data, error } = await db.from(table).insert(payload).select().single();
        res.status(error ? 400 : 200).json({ data: data ?? null, error: error ? { message: error.message, code: error.code } : null });
        return;
      }
      if (req.method === 'PATCH') {
        const { id, patch } = body;
        if (!id || !patch || typeof patch !== 'object') {
          res.status(400).json({ data: null, error: { message: 'PATCH requires { id, patch }' } });
          return;
        }
        const finalPatch = transformPatch ? transformPatch(patch) : patch;
        const { data, error } = await db.from(table).update(finalPatch).eq('id', id).select().maybeSingle();
        res.status(error ? 400 : 200).json({ data: data ?? null, error: error ? { message: error.message, code: error.code } : null });
        return;
      }
      if (req.method === 'DELETE') {
        const { id } = body;
        if (!id) {
          res.status(400).json({ data: null, error: { message: 'DELETE requires { id }' } });
          return;
        }
        const { error } = await db.from(table).delete().eq('id', id);
        res.status(error ? 400 : 200).json({ data: null, error: error ? { message: error.message, code: error.code } : null });
        return;
      }
    } catch (err) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  };
}
