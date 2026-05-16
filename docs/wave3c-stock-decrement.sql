-- ── Wave 3c-1 — Atomic stock-decrement RPC ─────────────────────────────────
-- Run in Supabase SQL editor. Safe to re-run (CREATE OR REPLACE).
--
-- Once RLS is enabled (Wave 3c-2) the anon key cannot UPDATE singles/products.
-- The cart flow still needs to decrement stock after a successful order
-- submit, so we expose a SECURITY DEFINER function that performs the update
-- on the caller's behalf. The function:
--   - whitelists the source table to 'singles' | 'products'
--   - clamps stock at 0 (no negatives)
--   - returns the remaining stock so the caller can log / surface "sold out"
--   - raises EXCEPTION on bad inputs so anon callers can't probe the schema
--
-- Granted to anon + authenticated. The RPC itself is the security boundary;
-- callers cannot do arbitrary writes.

CREATE OR REPLACE FUNCTION decrement_item_stock(
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
    -- singles.id is UUID; cast to text on both sides so the RPC accepts a
    -- text item_id from the cart payload without 42883 type errors.
    UPDATE singles
    SET    stock     = GREATEST(0, stock - qty),
           in_stock  = (GREATEST(0, stock - qty) > 0),
           updated_at = now()
    WHERE  id::text = item_id
    RETURNING stock INTO result_stock;
  ELSIF source = 'products' THEN
    -- products.id is TEXT; comparison works as-is.
    UPDATE products
    SET    stock     = GREATEST(0, stock - qty),
           in_stock  = (GREATEST(0, stock - qty) > 0),
           badge     = CASE WHEN (GREATEST(0, stock - qty) > 0) THEN 'In Stock' ELSE 'Sold Out' END
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

GRANT EXECUTE ON FUNCTION decrement_item_stock(text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION decrement_item_stock(text, text, integer) TO authenticated;
