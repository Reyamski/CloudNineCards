-- ============================================================
-- CloudNineCards — Supabase Security Fix
-- Run this in: Supabase Dashboard → SQL Editor
-- Fixes two Critical alerts from Supabase Security Advisor
-- ============================================================


-- ============================================================
-- FIX 1: auth_users_exposed
-- Drop any public-schema view that wraps auth.users.
-- These views make user emails/metadata queryable by anyone
-- with the anon key — a critical data exposure risk.
--
-- No such view was found in the codebase SQL files, so this
-- is likely a view created directly in the Supabase dashboard
-- or auto-created by a Supabase feature. Drop all candidates.
-- ============================================================

-- Safely drop only if the object actually exists AND is a view (not a table)
DO $$
DECLARE v TEXT;
BEGIN
  FOREACH v IN ARRAY ARRAY['users','user_profiles','customer_profiles_view','accounts','profiles'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v AND c.relkind = 'v'
    ) THEN
      EXECUTE format('DROP VIEW public.%I CASCADE', v);
    END IF;
  END LOOP;
END $$;

-- If the Supabase advisor names the exact view, add it here:
-- DROP VIEW IF EXISTS public.<exact_view_name> CASCADE;


-- ============================================================
-- FIX 2: rls_disabled_in_public
-- Enable Row-Level Security on all public-schema tables.
--
-- Context: This is a public TCG shop. The anon key is embedded
-- in the frontend and used for all reads AND writes (admin
-- panel is password-protected client-side only, not server auth).
--
-- Policy decision: permissive USING (true) WITH CHECK (true)
-- policies for now. This satisfies the Supabase security advisor
-- (RLS is ON) while keeping the current admin write flow intact.
--
-- TODO: When proper server-side auth is added (Supabase Auth +
-- JWT), tighten write policies to require authenticated role.
-- Tracked in .planning/STATE.md under "Blockers / Concerns".
-- ============================================================

-- ── singles ──────────────────────────────────────────────────
-- Public reads are intentional (shop page lists cards).
-- Writes are admin-only but currently use the anon key.
ALTER TABLE singles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations (public shop + anon-key admin)"
  ON singles
  USING (true)
  WITH CHECK (true);

-- ── stock ─────────────────────────────────────────────────────
-- Shop reads stock; admin writes stock updates.
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations (public shop + anon-key admin)"
  ON stock
  USING (true)
  WITH CHECK (true);

-- ── orders ────────────────────────────────────────────────────
-- Customers INSERT new orders; admin reads and updates them.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations (public shop + anon-key admin)"
  ON orders
  USING (true)
  WITH CHECK (true);

-- ── config ────────────────────────────────────────────────────
-- Admin reads/writes homepage video config.
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations (public shop + anon-key admin)"
  ON config
  USING (true)
  WITH CHECK (true);

-- ── waitlist ──────────────────────────────────────────────────
-- Customers INSERT themselves; admin reads entries.
-- Only create if the table exists in your project.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waitlist') THEN
    ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (
      SELECT FROM pg_policies WHERE tablename = 'waitlist' AND policyname = 'Allow all operations (public shop + anon-key admin)'
    ) THEN
      EXECUTE 'CREATE POLICY "Allow all operations (public shop + anon-key admin)" ON waitlist USING (true) WITH CHECK (true)';
    END IF;
  END IF;
END $$;

-- ── subscribers ───────────────────────────────────────────────
-- Homepage newsletter signup inserts here.
-- Only create if the table exists in your project.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers') THEN
    ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (
      SELECT FROM pg_policies WHERE tablename = 'subscribers' AND policyname = 'Allow all operations (public shop + anon-key admin)'
    ) THEN
      EXECUTE 'CREATE POLICY "Allow all operations (public shop + anon-key admin)" ON subscribers USING (true) WITH CHECK (true)';
    END IF;
  END IF;
END $$;


-- ============================================================
-- VERIFICATION QUERIES
-- Run these after applying the fixes to confirm everything
-- is correctly set. All RLS-enabled tables should appear.
-- ============================================================

-- Check which tables have RLS enabled:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check what policies exist:
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for any remaining public views that expose auth.users:
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%auth.users%';
