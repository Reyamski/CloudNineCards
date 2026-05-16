-- ── Card Requests — create card_requests table + RLS lockdown (F3) ─────────
-- Backs the guest "Source an Item / Card Request" form. Mirrors the waitlist
-- F2 pattern exactly: a service-role endpoint (preview/api/card-request.js)
-- inserts; the table has RLS ON with NO anon policies so anon REST writes are
-- blocked.
--
-- Schema mirrors what /api/card-request expects:
--   email, card_name, set_or_details, notes, created_at
--
-- After this script:
--   - Table exists with RLS ON and no anon policies → anon REST writes fail.
--   - /api/card-request endpoint (service-role) inserts successfully.
--   - Optional admin SELECT view ("Card Requests") can be added later.
--
-- DO NOT auto-apply — the site owner runs this in Supabase SQL editor before
-- the Card Request form works end-to-end on production.
--
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).

BEGIN;

CREATE TABLE IF NOT EXISTS public.card_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  card_name       text NOT NULL,
  set_or_details  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS card_requests_email_idx      ON public.card_requests (email);
CREATE INDEX IF NOT EXISTS card_requests_created_at_idx ON public.card_requests (created_at);

-- Drop any policies that may have been added by ad-hoc migrations.
DROP POLICY IF EXISTS "Allow all operations on card_requests" ON public.card_requests;
DROP POLICY IF EXISTS "card_requests_allow_all"               ON public.card_requests;
DROP POLICY IF EXISTS "Public insert card_requests"           ON public.card_requests;
DROP POLICY IF EXISTS "Enable insert for everyone"            ON public.card_requests;

ALTER TABLE public.card_requests ENABLE ROW LEVEL SECURITY;

-- No policies created → anon role denied everything.
-- Service role bypasses RLS, so /api/card-request keeps working.

COMMIT;

-- ── Verification ───────────────────────────────────────────────────────────
-- Anon attempt (browser console):
--   await supabase.from('card_requests').insert({ email:'x@y.com', card_name:'Luffy' })
-- Expected: 42501 / RLS policy violation.
--
-- Endpoint attempt: POST /api/card-request with {email, card_name} → 200.
