-- ── Wave 3c-1 — E2E test cleanup (FINAL pass) ────────────────────────────
-- Run in Supabase SQL editor after E2E run is reviewed. Removes the test
-- orders created during the Wave 3c-1 verification passes and restores
-- stock that was decremented by the (now fully working) RPC.
--
-- Test orders created (2026-05-16):
--
--   First pass (earlier in day, partial RPC bug):
--     - CNC-NMUETUP8        anon cart, 2 in-stock (poke-ah ×1, single ×1)
--     - CNC-NRNWEPWG-A      customer in-stock leg (poke-ah ×1)
--     - CNC-NRNWEYBU-B      customer preorder leg (preorder ×1)
--
--   FINAL pass (Wave 3c-1 final E2E after fix re-run):
--     - CNC-OVMZXZOT        anon cart, 2 in-stock
--                             - product poke-ah × 2 (stock decremented)
--                             - single (first in singles list) × 1 (decremented)
--     - CNC-P4IM2HLZ-A      customer mixed-cart in-stock leg
--                             - single "Tashigi" × 1 (stock decremented)
--     - CNC-P4IM2Q82-B      customer mixed-cart preorder leg
--                             - preorder "Shyarotto Brule" × 1 (no decrement)
--
-- Net stock to restore (FINAL pass + earlier passes, cumulative):
--   - products.poke-ah   += 4   (× across both passes; 2 from first, 2 from final)
--   - singles for first anon cart: NOT decremented in earlier pass (legacy bug)
--   - singles for final pass: 1 single (Perona OP06-093) × 1
--                             1 single (Tashigi EB03-018) × 1
--                             1 single (first singles row added to anon cart) × 1
--   Inspect singles by source table id after the final pass and += 1 each.

BEGIN;

-- 1. Delete order_items first to avoid FK cascade surprises
DELETE FROM order_items
WHERE order_id IN (
  SELECT id FROM orders WHERE order_number IN (
    'CNC-NMUETUP8',
    'CNC-NRNWEPWG-A',
    'CNC-NRNWEYBU-B',
    'CNC-OVMZXZOT',
    'CNC-P4IM2HLZ-A',
    'CNC-P4IM2Q82-B'
  )
);

-- 2. Delete parent orders
DELETE FROM orders
WHERE order_number IN (
  'CNC-NMUETUP8',
  'CNC-NRNWEPWG-A',
  'CNC-NRNWEYBU-B',
  'CNC-OVMZXZOT',
  'CNC-P4IM2HLZ-A',
  'CNC-P4IM2Q82-B'
);

-- 3. Restore product stock (poke-ah was hit 4 total across both passes).
UPDATE products
SET    stock      = stock + 4,
       in_stock   = true,
       badge      = 'In Stock'
WHERE  id = 'poke-ah';

-- 4. Restore singles stock for the FINAL E2E pass (cart RPC + stock decrement
--    now works for singles too, per Wave 3c-1 RPC re-run). Restore by name:
--      - Tashigi EB03-018  (mixed-cart in-stock leg)
--      - Perona  OP06-093  (anon cart in-stock leg)
UPDATE singles SET stock = stock + 1, in_stock = true
WHERE  card_name = 'Tashigi' AND card_number = 'EB03-018';

UPDATE singles SET stock = stock + 1, in_stock = true
WHERE  card_name = 'Perona'  AND card_number = 'OP06-093';

-- 5. Sanity check
SELECT id, stock, in_stock, badge FROM products WHERE id = 'poke-ah';
SELECT card_name, card_number, stock, in_stock FROM singles
WHERE (card_name='Tashigi' AND card_number='EB03-018')
   OR (card_name='Perona'  AND card_number='OP06-093');

COMMIT;
