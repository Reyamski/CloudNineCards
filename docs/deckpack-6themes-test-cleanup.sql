-- ── Deck Builder Packs 6-theme e2e — test order cleanup ─────────────────────
-- Removes the single local Playwright test order placed while verifying the
-- cart → order → stock-decrement → reject → stock-restore pipeline for the
-- restructured Deck Builder Packs.
--
-- Test order: CNC-BOOI13V7  (id 0419ed38-7b72-4b0e-a158-ec169f974438)
--   - 1 × dbp-red-premium, placed then payment_rejected.
--   - Stock was decremented (50 → 49) then restored (49 → 50) by the
--     reject-order path, so dbp-red-premium.stock is already back to 50.
--     NO stock adjustment is needed here — deleting the order must NOT
--     touch products.stock (the reject already reconciled it).
--
-- Owner runs this in the Supabase SQL editor. Safe / idempotent.

DELETE FROM public.order_items
 WHERE order_id = '0419ed38-7b72-4b0e-a158-ec169f974438';

DELETE FROM public.orders
 WHERE id = '0419ed38-7b72-4b0e-a158-ec169f974438';

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT count(*) FROM public.orders      WHERE order_number = 'CNC-BOOI13V7'; -- expect 0
--   SELECT id, stock  FROM public.products  WHERE id = 'dbp-red-premium';        -- expect stock = 50
