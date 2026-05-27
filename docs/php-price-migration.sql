-- ── PHP source-price migration ────────────────────────────────────────────────
-- Adds an OPTIONAL `php_price` column to singles / products / preorders.
--
-- WHY: Owner sources stock from the Philippines and wants to type the PHP cost
-- once. The admin UI then auto-derives CAD/USD/AUD/EUR via a fixed markup
-- formula (PHP × FX × 1.40 for CAD, × 1.68 for the others). The PHP figure is
-- INTERNAL ONLY — it is never rendered to customers. It's stored so that
-- (a) the admin can edit a row later and re-derive the 4 currencies from the
-- same source number, and (b) the team has an audit trail of original cost.
--
-- SAFETY:
--   • Column is NULLABLE — every existing row keeps `php_price = NULL` and the
--     existing manually-set CAD / USD / AUD / EUR continue to be the source of
--     truth (admin can keep editing those by hand).
--   • Uses ADD COLUMN IF NOT EXISTS so the script is idempotent.
--   • No RLS / grant changes — these tables are already anon-readable via
--     SELECT *. The application layer is responsible for never rendering
--     php_price to customers (see preview/src/pages/AdminPage.jsx).
--
-- HOW TO RUN: Paste into Supabase SQL editor → Run. Then verify with the
-- SELECT block at the bottom.

ALTER TABLE public.singles
  ADD COLUMN IF NOT EXISTS php_price NUMERIC(10,2);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS php_price NUMERIC(10,2);

ALTER TABLE public.preorders
  ADD COLUMN IF NOT EXISTS php_price NUMERIC(10,2);

COMMENT ON COLUMN public.singles.php_price IS
  'Optional Philippine-peso source cost. Internal only — never shown to customers. Admin UI derives CAD/USD/AUD/EUR from this value via a fixed markup formula.';
COMMENT ON COLUMN public.products.php_price IS
  'Optional Philippine-peso source cost. Internal only — never shown to customers. Admin UI derives CAD/USD/AUD/EUR from this value via a fixed markup formula.';
COMMENT ON COLUMN public.preorders.php_price IS
  'Optional Philippine-peso source cost. Internal only — never shown to customers. Admin UI derives CAD/USD/AUD/EUR from this value via a fixed markup formula.';

-- ── Verification ─────────────────────────────────────────────────────────────
-- Should return one row per table with data_type = 'numeric'.
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'php_price'
  AND table_name IN ('singles', 'products', 'preorders')
ORDER BY table_name;
