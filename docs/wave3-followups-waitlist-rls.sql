-- ── Wave 3 follow-ups — create waitlist table + RLS lockdown (F2) ─────────
-- The `waitlist` table didn't exist in the live DB yet (F2 originally assumed
-- it did). This script creates it + locks it down in one shot.
--
-- Schema mirrors what /api/waitlist (preview/api/waitlist.js) expects:
--   email, product_id, product_title, created_at
--
-- After this script:
--   - Table exists with RLS ON and no anon policies → anon REST writes fail.
--   - /api/waitlist endpoint (service-role) inserts successfully.
--   - Optional admin SELECT via /api/admin/waitlist can be added later.
--
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).

BEGIN;

CREATE TABLE IF NOT EXISTS public.waitlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  product_id      text NOT NULL,
  product_title   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_email_idx   ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS waitlist_product_idx ON public.waitlist (product_id);

-- Drop any policies that may have been added by ad-hoc migrations.
DROP POLICY IF EXISTS "Allow all operations on waitlist"     ON public.waitlist;
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_allow_all"                   ON public.waitlist;
DROP POLICY IF EXISTS "Public insert waitlist"               ON public.waitlist;
DROP POLICY IF EXISTS "Enable insert for everyone"           ON public.waitlist;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- No policies created → anon role denied everything.
-- Service role bypasses RLS, so /api/waitlist keeps working.

COMMIT;

-- ── Verification ───────────────────────────────────────────────────────────
-- Anon attempt (browser console):
--   await supabase.from('waitlist').insert({ email:'x@y.com', product_id:'op15jp' })
-- Expected: 42501 / RLS policy violation.
--
-- Endpoint attempt: POST /api/waitlist with {email, product_id} → 200.
