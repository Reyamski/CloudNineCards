-- =============================================================================
-- BRANCH E2E TEST CLEANUP
-- Branch: feat/deck-builder-packs-and-leads  (local E2E, 2026-05-17)
--
-- Removes the single test order placed during the local end-to-end walkthrough.
--
-- Test order:
--   CNC-W33LKJUO  — product poke-ah (Pokemon Mega Evolution ETB) x1, CAD $312.48
--                   customer: jejem0127@gmail.com / "Branch E2E Test"
--                   Canada / British Columbia (GST + PST)
--
-- STOCK NOTE — IMPORTANT:
--   This order was marked payment_rejected during Step 5 of the test, which
--   triggered /api/admin/reject-order and ALREADY restored the stock
--   server-side (poke-ah: 83 -> 82 on order, 82 -> 83 on reject — verified back
--   at the 83 baseline). The orders.stock_restored_at column is stamped.
--   Therefore this script DOES NOT add stock back again — doing so would
--   over-credit poke-ah to 84. Section 1 only re-asserts the baseline as a
--   guarded safety net (no-op if already 83).
--
-- Run AFTER reviewing each statement. Wrap in a transaction.
-- =============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Stock safety net (NO-OP in the expected/verified state)
--    Expected: poke-ah.stock = 83 already (reject restored it).
--    This statement ONLY fires if the order somehow still holds an
--    un-restored decrement (stock_restored_at IS NULL). In the verified
--    state stock_restored_at is set, so 0 rows are updated.
-- --------------------------------------------------------------------------
UPDATE public.products p
SET stock = COALESCE(p.stock, 0) + 1
WHERE p.id = 'poke-ah'
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.order_number = 'CNC-W33LKJUO'
      AND o.stock_restored_at IS NULL
  );

-- --------------------------------------------------------------------------
-- 2) Delete the test order + its line items
-- --------------------------------------------------------------------------

-- order_items first (FK on order_id)
DELETE FROM public.order_items
WHERE order_id IN (
    SELECT id FROM public.orders
    WHERE order_number = 'CNC-W33LKJUO'
);

DELETE FROM public.orders
WHERE order_number = 'CNC-W33LKJUO';

-- --------------------------------------------------------------------------
-- 3) Sanity checks (run before COMMIT)
-- --------------------------------------------------------------------------

-- Confirm order is gone — expected: 0 rows
SELECT order_number FROM public.orders
WHERE order_number = 'CNC-W33LKJUO';

-- Confirm poke-ah stock is back at the baseline — expected: stock = 83
SELECT id, title, stock, in_stock FROM public.products
WHERE id = 'poke-ah';

COMMIT;
-- ROLLBACK;  -- use this instead of COMMIT if any sanity check fails

-- =============================================================================
-- Notes:
-- - Stock was restored by the in-app reject flow (NEW1 behavior) during the
--   test; this script does not double-restore. Verified baseline = 83.
-- - No test SKUs / products were created by this E2E run.
-- - The 8 dbp-* Deck Builder Pack rows already exist in this Supabase
--   (the seed was previously applied) and are NOT touched here.
-- =============================================================================
