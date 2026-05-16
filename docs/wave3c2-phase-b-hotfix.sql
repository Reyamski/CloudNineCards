-- Wave 3c-2 Phase B Hotfix — drop legacy "Allow all operations..." policies
-- that survived Phase B because they weren't named in the original drop list.
-- RLS evaluates policies as OR, so as long as this permit policy exists, anon
-- can still INSERT/UPDATE/DELETE on these tables regardless of the new
-- restrictive policies. Proof: production anon successfully inserted
-- HACK-ATTEMPT into singles, updated Trafalgar Law price 20 → 0.99, and
-- deleted rows.
--
-- Safe to re-run (IF EXISTS).
--
-- After running this, run the verification block at the bottom and confirm:
--   * no rows with policyname = 'Allow all operations (public shop + anon-key admin)'
--     remain on singles / products / preorders
--   * anon attempts to write to these tables return RLS errors
--
-- Owner runs this manually in the Supabase SQL editor. DO NOT auto-apply.

-- singles ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.singles;

-- products ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.products;

-- preorders ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.preorders;

-- subscribers ────────────────────────────────────────────────────────────────
-- Intentionally LEFT IN PLACE. HomePage newsletter signup uses direct anon
-- INSERT and a future wave will migrate it to a dedicated endpoint. Do NOT
-- drop the permit policy here without first updating that code path.
-- DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.subscribers;

-- ── Verification ────────────────────────────────────────────────────────────
-- Should return zero rows after the above:
-- SELECT schemaname, tablename, policyname
--   FROM pg_policies
--  WHERE schemaname = 'public'
--    AND policyname = 'Allow all operations (public shop + anon-key admin)'
--    AND tablename IN ('singles', 'products', 'preorders');
--
-- Full policy snapshot for the affected tables:
-- SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN ('singles', 'products', 'preorders')
--  ORDER BY tablename, policyname;
--
-- Live anon write attempts (use anon key in PostgREST / supabase-js):
--   POST /rest/v1/singles      → expect 401/403 / "violates row-level security"
--   PATCH /rest/v1/singles?id=eq.<x>  → expect 401/403
--   DELETE /rest/v1/singles?id=eq.<x> → expect 401/403
--   ...repeat for products and preorders.
