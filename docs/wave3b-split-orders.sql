-- ── Wave 3b — Atomic split-order RPC (in-stock + preorder) ──────────────────
-- Run in Supabase SQL editor. Safe to re-run (CREATE OR REPLACE).
-- Coexists with the single-order RPC `submit_cart_order` (v2) for backward
-- compatibility. The new CartPage code calls submit_cart_orders_v2.

CREATE OR REPLACE FUNCTION submit_cart_orders_v2(
  in_stock_payload  jsonb,
  in_stock_items    jsonb,
  preorder_payload  jsonb,
  preorder_items    jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  in_stock_id uuid;
  preorder_id uuid;
  item        jsonb;
BEGIN
  IF in_stock_payload IS NOT NULL AND in_stock_payload <> 'null'::jsonb THEN
    in_stock_id := gen_random_uuid();
    INSERT INTO orders
    SELECT * FROM jsonb_populate_record(
      NULL::orders,
      in_stock_payload || jsonb_build_object('id', in_stock_id, 'created_at', now())
    );
    FOR item IN SELECT * FROM jsonb_array_elements(in_stock_items) LOOP
      INSERT INTO order_items
      SELECT * FROM jsonb_populate_record(
        NULL::order_items,
        item || jsonb_build_object('id', gen_random_uuid(), 'order_id', in_stock_id, 'created_at', now())
      );
    END LOOP;
  END IF;

  IF preorder_payload IS NOT NULL AND preorder_payload <> 'null'::jsonb THEN
    preorder_id := gen_random_uuid();
    INSERT INTO orders
    SELECT * FROM jsonb_populate_record(
      NULL::orders,
      preorder_payload || jsonb_build_object('id', preorder_id, 'created_at', now())
    );
    FOR item IN SELECT * FROM jsonb_array_elements(preorder_items) LOOP
      INSERT INTO order_items
      SELECT * FROM jsonb_populate_record(
        NULL::order_items,
        item || jsonb_build_object('id', gen_random_uuid(), 'order_id', preorder_id, 'created_at', now())
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'in_stock_order_id', in_stock_id,
    'preorder_order_id', preorder_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_cart_orders_v2(jsonb, jsonb, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION submit_cart_orders_v2(jsonb, jsonb, jsonb, jsonb) TO authenticated;

-- ── Schema notes ─────────────────────────────────────────────────────────────
-- The preorder payload writes to columns the existing legacy preorder modal
-- (now removed) also wrote to: `dp_amount`, `balance_due`, `full_price`, `eta`.
-- Those columns should already exist on `orders` (they were populated by the
-- legacy /pre-orders modal — see git history pre-1ef814cc). If a fresh
-- environment is missing them, run:
--
--   ALTER TABLE orders ADD COLUMN IF NOT EXISTS dp_amount    numeric;
--   ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_due  numeric;
--   ALTER TABLE orders ADD COLUMN IF NOT EXISTS full_price   numeric;
--   ALTER TABLE orders ADD COLUMN IF NOT EXISTS eta          text;
