-- ── Deck Builder Packs (Standard-only) e2e — test order cleanup ────────────
-- Removes the single local Playwright test order placed while verifying the
-- cart → order → stock-decrement → reject → stock-restore pipeline for the
-- restructured (Standard-only, no tier picker) Deck Builder Packs.
--
-- Test order: CNC-D2PV5JQE  (id c88d00bd-ef94-4cd8-a3fe-fe0b0d44437a)
--   - 1 × dbp-red-standard, placed then payment_rejected (twice — the retry
--     hit the idempotent already_restored guard and did NOT touch stock).
--   - Stock was decremented (50 → 49) then restored (49 → 50) by the
--     reject-order path, so dbp-red-standard.stock is already back to 50.
--     NO stock adjustment is needed here — deleting the order must NOT
--     touch products.stock (the reject already reconciled it).
--
-- Owner runs this in the Supabase SQL editor. Safe / idempotent.

DELETE FROM public.order_items
 WHERE order_id = 'c88d00bd-ef94-4cd8-a3fe-fe0b0d44437a';

DELETE FROM public.orders
 WHERE id = 'c88d00bd-ef94-4cd8-a3fe-fe0b0d44437a';

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT count(*) FROM public.orders     WHERE order_number = 'CNC-D2PV5JQE'; -- expect 0
--   SELECT id, stock FROM public.products  WHERE id = 'dbp-red-standard';       -- expect stock = 50
