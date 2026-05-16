-- ── Wave 3 follow-ups — F1 + F4 HOTFIX ───────────────────────────────────
-- Live Playwright verify showed F1 (subscribers) + F4 (storage) anon writes
-- were STILL OPEN after the original scripts. Root cause: both scripts
-- dropped *guessed* policy names that don't match the real ones.
--
-- Real names (confirmed from inspect-schema + the original
-- preorders-migration.sql):
--   subscribers      → "Allow all operations (public shop + anon-key admin)"
--   storage.objects  → "Anon upload singles" / "Anon upload products"
--                       / "Anon upload preorders"
--
-- Safe to re-run.

-- ── F1: subscribers — drop the REAL legacy permit policy ─────────────────
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.subscribers;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
-- No anon policies → anon REST insert returns 401/42501.
-- /api/subscribe (service-role) bypasses RLS and keeps working.

-- ── F4: storage.objects — drop the REAL anon upload policies ─────────────
DROP POLICY IF EXISTS "Anon upload singles"   ON storage.objects;
DROP POLICY IF EXISTS "Anon upload products"  ON storage.objects;
DROP POLICY IF EXISTS "Anon upload preorders" ON storage.objects;
-- Public read policies ("Public read singles/products/preorders") are LEFT
-- in place so catalog images keep loading on the storefront.
-- /api/admin/upload (service-role) bypasses RLS for admin uploads.

-- ── Verification ─────────────────────────────────────────────────────────
-- 1. List remaining policies (should show NO anon INSERT on either):
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE (schemaname='public'  AND tablename='subscribers')
   OR (schemaname='storage' AND tablename='objects' AND policyname ILIKE 'Anon upload%')
ORDER BY tablename, policyname;
-- Expected: subscribers has no permit-all row; no "Anon upload *" rows.
--
-- 2. Live anon attack (browser console, no admin token):
--    POST /rest/v1/subscribers           → 401/42501
--    POST /storage/v1/object/singles/x   → 401/403
--    GET  existing catalog image          → 200 (still public)
--    POST /api/subscribe                  → 200 (service-role path intact)
