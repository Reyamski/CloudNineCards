-- ── Clean-slate orders truncation (DESTRUCTIVE) ──────────────────────
-- Wipes ALL orders + order_items rows. Use only when you want a fresh
-- testing baseline and there are no real customer orders worth keeping.
--
-- No undo. No rollback. Backup first if unsure.
--
-- TRUNCATE is faster than DELETE for empty-then-refill scenarios:
--   - Resets sequences (if any)
--   - Skips per-row trigger firing
--   - Doesn't write WAL per row
--
-- CASCADE drops dependent order_items rows automatically via the FK.
-- Run as: paste in Supabase SQL Editor.

BEGIN;

-- Truncate transactional tables. CASCADE follows the order_items FK.
TRUNCATE TABLE public.orders CASCADE;

-- Sanity check
SELECT 'orders' AS table_name, COUNT(*) AS remaining FROM public.orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM public.order_items;
-- Expected: both 0

COMMIT;
-- ROLLBACK; -- swap COMMIT for this line if the count looks wrong
