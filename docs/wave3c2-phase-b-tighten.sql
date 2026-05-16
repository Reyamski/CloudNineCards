-- ── Wave 3c-2 Phase B — tighten policies from Phase A's permissive baseline.
-- Run AFTER:
--   1. docs/wave3c2-phase-a-permissive.sql              (RLS on, all-permit)
--   2. docs/wave3c2-mark-order-status-rpc.sql           (cart fallback RPC)
--   3. Frontend deploy with /api/admin/orders GET +
--      /api/admin/order-items endpoints                 (admin reads moved)
--
-- Rollback: re-run wave3c2-phase-a-permissive.sql (re-creates permissive
-- policies on top of the tightened ones — DROP IF EXISTS handles overlap).
-- For a full kill-switch back to pre-RLS behavior:
-- wave3c2-phase-a-rollback.sql (DISABLE ROW LEVEL SECURITY).
--
-- Each block follows the same pattern: drop Phase A's anon-permit policies
-- AND any legacy policies left over from before this wave, then create the
-- tightened replacements. All policies are CREATE (not CREATE OR REPLACE)
-- so each block is self-contained; idempotency comes from the leading
-- DROP IF EXISTS lines.

-- ─── Catalog tables: anon SELECT only, no writes ────────────────────
-- Anon writes are denied at the policy level; admin writes go through
-- service-role /api/admin/* (service role bypasses RLS).

DROP POLICY IF EXISTS "singles_select_anon"  ON public.singles;
DROP POLICY IF EXISTS "singles_insert_anon"  ON public.singles;
DROP POLICY IF EXISTS "singles_update_anon"  ON public.singles;
DROP POLICY IF EXISTS "singles_delete_anon"  ON public.singles;
DROP POLICY IF EXISTS "singles_select_public" ON public.singles;
CREATE POLICY "singles_select_public" ON public.singles FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy → anon denied; service-role bypasses RLS.

DROP POLICY IF EXISTS "products_select_anon" ON public.products;
DROP POLICY IF EXISTS "products_insert_anon" ON public.products;
DROP POLICY IF EXISTS "products_update_anon" ON public.products;
DROP POLICY IF EXISTS "products_delete_anon" ON public.products;
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "preorders_select_anon" ON public.preorders;
DROP POLICY IF EXISTS "preorders_insert_anon" ON public.preorders;
DROP POLICY IF EXISTS "preorders_update_anon" ON public.preorders;
DROP POLICY IF EXISTS "preorders_delete_anon" ON public.preorders;
DROP POLICY IF EXISTS "preorders_select_public" ON public.preorders;
CREATE POLICY "preorders_select_public" ON public.preorders FOR SELECT USING (true);

-- ─── orders / order_items: own-record SELECT, no anon write ─────────
-- Cart submit goes through submit_cart_orders_v2 (SECURITY DEFINER, bypass
-- RLS). Stock-check-failed UPDATE goes through mark_order_stock_check_failed
-- RPC (also SECURITY DEFINER). Admin reads/writes go through /api/admin/*
-- (service-role, bypass RLS). This block locks down direct anon access while
-- still permitting authenticated buyers to see their own orders for the
-- AccountOrdersPage + CartPage checkout-prefill flows.

DROP POLICY IF EXISTS "orders_select_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_update_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_anon" ON public.orders;
-- Drop any legacy hand-rolled policies that may be lingering from before
-- this wave (names harvested from the inspect-schema output earlier in the
-- audit). Safe no-op if they don't exist on the live DB.
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.orders;
DROP POLICY IF EXISTS "allow anon insert" ON public.orders;
DROP POLICY IF EXISTS "users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;

CREATE POLICY "orders_select_own" ON public.orders FOR SELECT
USING (
  customer_user_id = auth.uid()
  OR lower(buyer_email) = lower(auth.email())
);
-- No INSERT/UPDATE/DELETE policy → anon cannot directly write;
-- cart RPC + admin-API + stock-check-failed RPC bypass RLS via service-role
-- or SECURITY DEFINER.

DROP POLICY IF EXISTS "order_items_select_anon" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_anon" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_anon" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_anon" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_own"  ON public.order_items;
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.customer_user_id = auth.uid()
        OR lower(o.buyer_email) = lower(auth.email())
      )
  )
);

-- ─── profiles: own row only ──────────────────────────────────────────
-- Only meaningful if the table exists on the live DB. If inspect-schema
-- showed no `profiles` table, comment this block out before running.

DROP POLICY IF EXISTS "profiles_select_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_anon" ON public.profiles;
-- Drop legacy own-row policies that may already exist from earlier signup
-- migrations; we recreate them with consistent names below.
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- No DELETE policy → users cannot delete their profile.

-- ─── stock / config: public read, admin-only write ──────────────────
-- Catalog-style: anon SELECT stays so HomePage / NewArrivals / Shop /
-- AnnouncementBar keep working with the anon key. All admin writes go
-- through service-role /api/admin/stock and /api/admin/config.

DROP POLICY IF EXISTS "stock_select_anon"  ON public.stock;
DROP POLICY IF EXISTS "stock_insert_anon"  ON public.stock;
DROP POLICY IF EXISTS "stock_update_anon"  ON public.stock;
DROP POLICY IF EXISTS "stock_delete_anon"  ON public.stock;
DROP POLICY IF EXISTS "public write stock" ON public.stock;
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.stock;
DROP POLICY IF EXISTS "stock_select_public" ON public.stock;
CREATE POLICY "stock_select_public" ON public.stock FOR SELECT USING (true);

DROP POLICY IF EXISTS "config_select_anon"  ON public.config;
DROP POLICY IF EXISTS "config_insert_anon"  ON public.config;
DROP POLICY IF EXISTS "config_update_anon"  ON public.config;
DROP POLICY IF EXISTS "config_delete_anon"  ON public.config;
DROP POLICY IF EXISTS "public write config" ON public.config;
DROP POLICY IF EXISTS "Allow all operations (public shop + anon-key admin)" ON public.config;
DROP POLICY IF EXISTS "config_select_public" ON public.config;
CREATE POLICY "config_select_public" ON public.config FOR SELECT USING (true);
