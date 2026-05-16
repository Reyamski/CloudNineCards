-- ── Wave 3 follow-ups — Storage bucket policies hardening (F4) ─────────────
-- Run in Supabase SQL editor AFTER confirming the admin UI no longer issues
-- direct supabase.storage.from(...).upload() calls. The CloudNineCards
-- preview/src codebase already routes image uploads through imgbb via
-- /api/analyze-card (see preview/api/analyze-card.js), so no admin client
-- code needs the buckets to be public-write today.
--
-- /api/admin/upload (preview/api/admin/upload.js) uses the service-role key
-- + admin auth gate to write to storage when needed, so admin uploads keep
-- working after this change.
--
-- Effect after running:
--   - Anon can still READ public objects from singles / products / preorders
--     buckets (catalog images keep loading on the storefront).
--   - Anon can NO LONGER INSERT (upload) into those buckets — anonymous
--     attempts to PUT to storage REST return 401 / policy violation.
--   - Authenticated normal users also can't upload (admin-only path is via
--     /api/admin/upload).

-- ── Drop public INSERT policies on storage.objects ─────────────────────────
-- Policy names vary depending on how the buckets were created via the
-- dashboard. Drop all common variants for these three buckets. Each DROP is
-- IF EXISTS so missing policies don't error.

-- singles
DROP POLICY IF EXISTS "Allow public uploads to singles"   ON storage.objects;
DROP POLICY IF EXISTS "singles_public_insert"             ON storage.objects;
DROP POLICY IF EXISTS "Public insert singles"             ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to singles"      ON storage.objects;

-- products
DROP POLICY IF EXISTS "Allow public uploads to products"  ON storage.objects;
DROP POLICY IF EXISTS "products_public_insert"            ON storage.objects;
DROP POLICY IF EXISTS "Public insert products"            ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to products"     ON storage.objects;

-- preorders
DROP POLICY IF EXISTS "Allow public uploads to preorders" ON storage.objects;
DROP POLICY IF EXISTS "preorders_public_insert"           ON storage.objects;
DROP POLICY IF EXISTS "Public insert preorders"           ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to preorders"    ON storage.objects;

-- If you have a single permissive "allow all" policy on storage.objects
-- (some old Supabase project bootstraps set this), drop it here as well.
-- Inspect existing policies first via:
--   SELECT policyname, cmd, qual FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects';

-- ── Verify SELECT (public read) still permitted ───────────────────────────
-- Most setups have a "Public Access" or "<bucket>_public_select" policy with
-- USING (true). Leave those in place so the storefront keeps loading images.
-- If you accidentally drop one, re-create with:
--
--   CREATE POLICY "<bucket>_public_select" ON storage.objects
--     FOR SELECT TO public
--     USING (bucket_id IN ('singles','products','preorders'));

-- ── Verification ───────────────────────────────────────────────────────────
-- From a terminal with the anon key:
--
--   curl -X POST 'https://<project>.supabase.co/storage/v1/object/singles/test.png' \
--     -H "apikey: <anon-key>" \
--     -H "Authorization: Bearer <anon-key>" \
--     -H "Content-Type: image/png" --data-binary @small.png
--
-- Expected: HTTP 401 / 403 / policy violation.
--
-- And from the admin UI (logged in via password gate), uploading still works
-- through /api/admin/upload using the service-role client.
