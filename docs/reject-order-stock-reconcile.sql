-- =============================================================================
-- REJECT-ORDER STOCK RECONCILIATION  (owner-run, MANUAL — do NOT auto-apply)
-- Created 2026-05-17
--
-- WHY THIS EXISTS
-- ---------------
-- `preview/api/admin/reject-order.js` used to stamp orders.stock_restored_at
-- UNCONDITIONALLY whenever an order was marked payment_rejected — even if zero
-- items were actually restored or the per-item update silently failed. Once
-- stock_restored_at is set, the endpoint's idempotent guard
-- (`alreadyRestored`) skips the restore on every future retry, so the stock
-- that was decremented at order-submit time is PERMANENTLY lost. This caused
-- the recurring "order rejected but stock never came back" reports
-- (singles previously, products now).
--
-- The code fix (this same branch) stops stamping on partial/failed restores
-- so NEW rejections are retryable. But orders ALREADY corrupted by the old
-- code have stock_restored_at set with stock never returned — the guard now
-- blocks the auto-fix path, so they must be reconciled by hand here.
--
-- You cannot reliably detect "stamped but not actually restored" purely in
-- SQL (the stamp says it happened; the stock count doesn't prove it didn't).
-- So this file is deliberately MANUAL:
--   1. Run the AUDIT query (section A) to list every payment_rejected order
--      with its line items + current stock.
--   2. For each order, eyeball whether stock looks like it came back. Compare
--      against email/Wise records of what was actually sold.
--   3. Run the specific +qty UPDATE for any order confirmed NOT restored.
--   4. The two KNOWN-bad orders (section B) have ready-made statements.
--
-- Every mutating statement is wrapped in its own BEGIN/COMMIT and has a
-- verification SELECT. Run ONE block at a time, read the result, then COMMIT
-- or ROLLBACK. Re-running an UPDATE adds qty AGAIN — only run each once,
-- deliberately, after confirming via the audit it has not already been fixed.
-- =============================================================================


-- =============================================================================
-- SECTION A — AUDIT: list all payment_rejected orders + their items + stock
-- =============================================================================
-- Read-only. Safe to run any time. Use this to decide which orders below
-- still need a manual restore. Pay attention to:
--   - stock_restored_at IS NOT NULL  (guard tripped — auto-fix blocked)
--   - whether `current_stock` looks like the qty was added back
--   - is_preorder = true lines NEVER decrement, so they need NO restore

SELECT
    o.order_number,
    o.id                AS order_id,
    o.payment_status,
    o.stock_restored_at,
    oi.source_table,
    oi.item_id,
    oi.qty,
    oi.is_preorder,
    CASE oi.source_table
        WHEN 'singles'  THEN (SELECT s.stock FROM public.singles  s WHERE s.id::text = oi.item_id)
        WHEN 'products' THEN (SELECT p.stock FROM public.products p WHERE p.id::text = oi.item_id)
        ELSE NULL
    END                 AS current_stock,
    CASE oi.source_table
        WHEN 'singles'  THEN (SELECT s.card_name   FROM public.singles  s WHERE s.id::text = oi.item_id)
        WHEN 'products' THEN (SELECT p.title       FROM public.products p WHERE p.id::text = oi.item_id)
        ELSE NULL
    END                 AS item_name
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.payment_status = 'payment_rejected'
ORDER BY o.created_at DESC, o.order_number, oi.source_table;

-- Optional: only the ones the bug could have corrupted (stamped already):
-- ... WHERE o.payment_status = 'payment_rejected' AND o.stock_restored_at IS NOT NULL


-- =============================================================================
-- SECTION B — KNOWN-BAD ORDERS (confirmed by owner; run each deliberately)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- B1) CNC-AT5SN6NE  — products / poke-ah, qty 1, NOT restored
--     stock_restored_at was stamped by the old code; poke-ah stock was never
--     incremented. Add the 1 unit back.
--     >>> Run ONLY if Section A shows poke-ah stock is still short by 1. <<<
-- -----------------------------------------------------------------------------
BEGIN;

-- Show the order + item + current stock BEFORE the fix:
SELECT o.order_number, o.stock_restored_at, oi.source_table, oi.item_id, oi.qty,
       p.title, p.stock AS stock_before
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
JOIN public.products p ON p.id::text = oi.item_id
WHERE o.order_number = 'CNC-AT5SN6NE' AND oi.source_table = 'products';

-- Restore +1 to poke-ah (and keep in_stock / badge consistent):
UPDATE public.products
SET    stock    = COALESCE(stock, 0) + 1,
       in_stock = (COALESCE(stock, 0) + 1) > 0,
       badge    = CASE WHEN (COALESCE(stock, 0) + 1) > 0 THEN 'In Stock' ELSE 'Sold Out' END
WHERE  id = 'poke-ah';

-- Verify stock went up by exactly 1 vs the SELECT above:
SELECT id, title, stock, in_stock, badge FROM public.products WHERE id = 'poke-ah';

COMMIT;
-- ROLLBACK;  -- use instead of COMMIT if the before/after doesn't look right


-- -----------------------------------------------------------------------------
-- B2) CNC-VLGU1PY7  — singles id b5409ef4-5c9f-4d92-9e3d-5bdc14f0799d, qty 1
--     This one is OLDER: per investigation its stock_restored_at is NULL
--     (restore guard NOT tripped). If stock_restored_at is still NULL the
--     proper fix is to simply re-trigger the rejection from the Admin UI
--     (re-select Payment Rejected) — the fixed endpoint will restore it
--     cleanly and stamp it. Only use the manual UPDATE below if re-triggering
--     from the UI is not possible AND Section A confirms the unit is missing.
--     >>> Run ONLY if you are NOT re-triggering via the admin UI. <<<
-- -----------------------------------------------------------------------------
BEGIN;

-- Show order + item + current stock BEFORE:
SELECT o.order_number, o.stock_restored_at, oi.source_table, oi.item_id, oi.qty,
       s.card_name, s.stock AS stock_before
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
JOIN public.singles s ON s.id::text = oi.item_id
WHERE o.order_number = 'CNC-VLGU1PY7' AND oi.source_table = 'singles';

-- Restore +1 to the single:
UPDATE public.singles
SET    stock      = COALESCE(stock, 0) + 1,
       in_stock   = (COALESCE(stock, 0) + 1) > 0,
       updated_at = now()
WHERE  id = 'b5409ef4-5c9f-4d92-9e3d-5bdc14f0799d';

-- Verify:
SELECT id, card_name, stock, in_stock FROM public.singles
WHERE id = 'b5409ef4-5c9f-4d92-9e3d-5bdc14f0799d';

COMMIT;
-- ROLLBACK;


-- =============================================================================
-- SECTION C — TEMPLATE for any OTHER order found in Section A
-- =============================================================================
-- Copy this block per affected order. Fill in <ORDER_NUMBER>. It restores
-- every non-preorder in-stock line of that order by its qty. Inspect the
-- BEFORE/AFTER SELECTs; only COMMIT if the order genuinely was NOT restored.
-- After fixing, OPTIONALLY clear the bad stamp so the order's state is honest
-- (it does NOT re-enable auto-restore on its own — restore is already done):
--
-- BEGIN;
--
-- -- BEFORE: what we're about to add back
-- SELECT o.order_number, oi.source_table, oi.item_id, oi.qty,
--        CASE oi.source_table
--          WHEN 'singles'  THEN (SELECT stock FROM public.singles  WHERE id::text = oi.item_id)
--          WHEN 'products' THEN (SELECT stock FROM public.products WHERE id::text = oi.item_id)
--        END AS stock_before
-- FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
-- WHERE o.order_number = '<ORDER_NUMBER>' AND oi.is_preorder = false
--   AND oi.source_table IN ('singles','products');
--
-- -- Singles lines:
-- UPDATE public.singles s
-- SET    stock = COALESCE(s.stock,0) + oi.qty,
--        in_stock = (COALESCE(s.stock,0) + oi.qty) > 0,
--        updated_at = now()
-- FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
-- WHERE o.order_number = '<ORDER_NUMBER>'
--   AND oi.source_table = 'singles' AND oi.is_preorder = false
--   AND s.id::text = oi.item_id;
--
-- -- Products lines:
-- UPDATE public.products p
-- SET    stock = COALESCE(p.stock,0) + oi.qty,
--        in_stock = (COALESCE(p.stock,0) + oi.qty) > 0,
--        badge = CASE WHEN (COALESCE(p.stock,0) + oi.qty) > 0 THEN 'In Stock' ELSE 'Sold Out' END
-- FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
-- WHERE o.order_number = '<ORDER_NUMBER>'
--   AND oi.source_table = 'products' AND oi.is_preorder = false
--   AND p.id::text = oi.item_id;
--
-- -- (optional) keep the stamp accurate now that stock IS restored:
-- -- UPDATE public.orders SET stock_restored_at = now()
-- -- WHERE order_number = '<ORDER_NUMBER>' AND stock_restored_at IS NULL;
--
-- -- AFTER: confirm each line's stock rose by exactly its qty
-- SELECT o.order_number, oi.source_table, oi.item_id, oi.qty,
--        CASE oi.source_table
--          WHEN 'singles'  THEN (SELECT stock FROM public.singles  WHERE id::text = oi.item_id)
--          WHEN 'products' THEN (SELECT stock FROM public.products WHERE id::text = oi.item_id)
--        END AS stock_after
-- FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
-- WHERE o.order_number = '<ORDER_NUMBER>' AND oi.is_preorder = false
--   AND oi.source_table IN ('singles','products');
--
-- COMMIT;
-- -- ROLLBACK;  -- if anything looks off
-- =============================================================================
