-- ── Wave 3 follow-ups — waitlist RLS lockdown (F2) ─────────────────────────
-- Run AFTER deploying the /api/waitlist endpoint (preview/api/waitlist.js)
-- and the ShopPage NotifyMeModal change that posts to it.
--
-- After this script:
--   - Anon (browser) can NO LONGER insert into `waitlist` directly via
--     /rest/v1/waitlist — that path returns 401.
--   - The new /api/waitlist endpoint uses the service-role key, which
--     bypasses RLS — so the restock-notify modal keeps working.

DROP POLICY IF EXISTS "Allow all operations on waitlist" ON waitlist;
DROP POLICY IF EXISTS "waitlist_allow_all"               ON waitlist;
DROP POLICY IF EXISTS "Public insert waitlist"           ON waitlist;
DROP POLICY IF EXISTS "Enable insert for everyone"       ON waitlist;

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- ── Verification ───────────────────────────────────────────────────────────
-- From a browser console (no admin token):
--   await supabase.from('waitlist').insert({ email:'x@y.com', product_id:'op15jp' })
-- Expected: error 42501 / RLS policy violation.
--
-- Posting to /api/waitlist with same payload should still succeed.
