-- ── Wave 3c-2 — Restore stock RPC (payment_rejected flow) ───────────────────
-- Run in Supabase SQL editor. Safe to re-run (CREATE OR REPLACE).
--
-- Mirrors `decrement_item_stock` but adds qty back. Used when admin marks an
-- order's payment_status to `payment_rejected` — the decrement that happened
-- at order submit needs to be reversed so the item isn't stuck "sold out".
--
-- No GREATEST cap because we're incrementing (negative qty is rejected up
-- front). The stock decrement RPC already clamped to 0 on the way down, so
-- restoring `qty` may overshoot the pre-order baseline if admin manually
-- raised stock in between — that's acceptable, owner can correct after.
--
-- Granted to anon + authenticated. SECURITY DEFINER bypasses RLS so the
-- caller doesn't need direct UPDATE perms on singles/products.

CREATE OR REPLACE FUNCTION restore_item_stock(
  source     text,
  item_id    text,
  qty        integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_stock integer;
BEGIN
  IF qty <= 0 THEN
    RAISE EXCEPTION 'qty must be positive';
  END IF;

  IF source = 'singles' THEN
    UPDATE singles
    SET    stock      = stock + qty,
           in_stock   = ((stock + qty) > 0),
           updated_at = now()
    WHERE  id::text = item_id
    RETURNING stock INTO result_stock;
  ELSIF source = 'products' THEN
    UPDATE products
    SET    stock     = stock + qty,
           in_stock  = ((stock + qty) > 0),
           badge     = CASE WHEN ((stock + qty) > 0) THEN 'In Stock' ELSE 'Sold Out' END
    WHERE  id::text = item_id
    RETURNING stock INTO result_stock;
  ELSE
    RAISE EXCEPTION 'invalid source: %', source;
  END IF;

  IF result_stock IS NULL THEN
    RAISE EXCEPTION 'item not found: % in %', item_id, source;
  END IF;

  RETURN jsonb_build_object('item_id', item_id, 'source', source, 'remaining', result_stock);
END;
$$;

GRANT EXECUTE ON FUNCTION restore_item_stock(text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION restore_item_stock(text, text, integer) TO authenticated;

-- ── Idempotency column on orders ────────────────────────────────────────────
-- Tracks when restoration ran so re-toggling payment_status doesn't
-- double-restore stock. Cleared if admin moves the order out of
-- payment_rejected (handled in app code, not here).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_restored_at timestamptz;
