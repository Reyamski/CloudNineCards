/**
 * Service-role Supabase client — server-side only.
 *
 * This client uses SUPABASE_SERVICE_ROLE_KEY (NOT the anon key) and bypasses
 * RLS. Treat as privileged: only callable from serverless functions that have
 * already verified the request is from a trusted admin / cart flow.
 *
 * Env vars required:
 *   - SUPABASE_URL              (same value as VITE_SUPABASE_URL, but server-side)
 *   - SUPABASE_SERVICE_ROLE_KEY (NEVER expose to client; Vercel Prod/Preview/Dev)
 *
 * Usage:
 *   import { getServiceClient } from './_lib/db.js';
 *   const db = getServiceClient();
 *   const { data, error } = await db.from('singles').insert(payload).select().single();
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getServiceClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server. ' +
      'See .env.example.'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
