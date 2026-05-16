/**
 * /api/admin/upload — multipart/form-data upload to Supabase Storage.
 *
 * Form fields:
 *   - file    (Blob, required)
 *   - bucket  ('singles' | 'products' | 'preorders', required)
 *   - path    (optional path/filename inside the bucket; defaults to a
 *             timestamped name from the file's `name`)
 *
 * Returns: { data: { path, publicUrl }, error: null } on success,
 *          { data: null, error: { message } } on failure.
 *
 * NOTE: This codebase currently routes admin card images through imgbb via
 * /api/analyze-card. This endpoint exists so any future Supabase Storage-
 * backed upload path can run through the service-role key + admin auth gate
 * once RLS is enabled in Wave 3c-2. Frontend can swap to it without touching
 * the security model.
 */
import { Buffer } from 'node:buffer';
import { getServiceClient } from '../_lib/db.js';
import { verifyAdminRequest } from '../_lib/admin-auth-verify.js';

export const config = {
  // Disable Vercel's default body parser so we can read raw multipart.
  api: { bodyParser: false },
};

const ALLOWED_BUCKETS = new Set(['singles', 'products', 'preorders']);

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Tiny multipart parser — only handles a single file field + optional text
// fields. Avoids pulling in a dep just for this endpoint.
async function parseMultipart(req) {
  const contentType = req.headers?.['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) throw new Error('Missing multipart boundary');
  const boundary = '--' + (boundaryMatch[1] || boundaryMatch[2]).trim();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const fields = {};
  let file = null;

  // Split on boundary. Each part: \r\nheaders\r\n\r\nbody\r\n
  let idx = 0;
  while (idx < body.length) {
    const start = body.indexOf(boundary, idx);
    if (start === -1) break;
    const partStart = start + boundary.length;
    // If we hit the terminating --boundary--, stop.
    if (body.slice(partStart, partStart + 2).toString() === '--') break;
    const headerEnd = body.indexOf('\r\n\r\n', partStart);
    if (headerEnd === -1) break;
    const headers = body.slice(partStart, headerEnd).toString('utf8');
    const partBodyStart = headerEnd + 4;
    const nextBoundary = body.indexOf(boundary, partBodyStart);
    if (nextBoundary === -1) break;
    const partBody = body.slice(partBodyStart, nextBoundary - 2); // strip trailing \r\n

    const dispMatch = headers.match(/Content-Disposition:[^\n]*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    const ctMatch   = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    if (dispMatch) {
      const name = dispMatch[1];
      const filename = dispMatch[2];
      if (filename) {
        file = {
          field:     name,
          filename,
          mimeType:  ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
          buffer:    partBody,
        };
      } else {
        fields[name] = partBody.toString('utf8');
      }
    }
    idx = nextBoundary;
  }

  return { fields, file };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ data: null, error: { message: 'POST only' } });
    return;
  }

  const auth = verifyAdminRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ data: null, error: { message: auth.msg } });
    return;
  }

  let parsed;
  try { parsed = await parseMultipart(req); }
  catch (err) {
    res.status(400).json({ data: null, error: { message: `Multipart parse failed: ${err.message}` } });
    return;
  }

  const { fields, file } = parsed;
  if (!file) {
    res.status(400).json({ data: null, error: { message: 'file field required' } });
    return;
  }
  const bucket = (fields.bucket || '').trim();
  if (!ALLOWED_BUCKETS.has(bucket)) {
    res.status(400).json({ data: null, error: { message: `bucket must be one of ${[...ALLOWED_BUCKETS].join(', ')}` } });
    return;
  }
  const path = (fields.path || `${Date.now()}-${file.filename || 'upload'}`).replace(/^\/+/, '');

  try {
    const db = getServiceClient();
    const { error: upErr } = await db.storage.from(bucket).upload(path, file.buffer, {
      contentType: file.mimeType,
      upsert: true,
    });
    if (upErr) {
      res.status(400).json({ data: null, error: { message: upErr.message } });
      return;
    }
    const { data: pub } = db.storage.from(bucket).getPublicUrl(path);
    res.status(200).json({ data: { path, publicUrl: pub?.publicUrl ?? null }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
