-- ── Wave 3 follow-ups — subscribers RLS lockdown (F1) ──────────────────────
-- Run AFTER deploying the /api/subscribe endpoint (preview/api/subscribe.js)
-- and the HomePage form change that posts to it. Until the endpoint is
-- live, dropping the legacy permissive policy would break the public
-- newsletter form.
--
-- After this script:
--   - Anon (browser) can NO LONGER insert into `subscribers` directly via
--     /rest/v1/subscribers — that path returns 401.
--   - The new /api/subscribe endpoint uses the service-role key, which
--     bypasses RLS — so the form keeps working.
--   - Admin reads continue to work since admin queries use service-role.

-- Drop the legacy permissive policy. Name varies between bootstraps; common
-- variants are listed. IF EXISTS keeps the script idempotent.
DROP POLICY IF EXISTS "Allow all operations on subscribers" ON subscribers;
DROP POLICY IF EXISTS "subscribers_allow_all"               ON subscribers;
DROP POLICY IF EXISTS "Public insert subscribers"           ON subscribers;
DROP POLICY IF EXISTS "Enable insert for everyone"          ON subscribers;

-- Make sure RLS is on. (If it was off, the policy drops were no-ops anyway.)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- No SELECT / INSERT / UPDATE / DELETE policy for anon/authenticated. The
-- service-role key bypasses RLS entirely, so /api/subscribe still works.

-- ── Verification ───────────────────────────────────────────────────────────
-- From a browser console on the live site (no admin token):
--   await supabase.from('subscribers').insert({ email: 'x@y.com' })
-- Expected: error with code 42501 / message "new row violates row-level
-- security policy for table \"subscribers\"".
--
-- Posting to /api/subscribe with the same email should still succeed.
