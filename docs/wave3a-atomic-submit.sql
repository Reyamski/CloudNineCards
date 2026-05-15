-- ── Wave 3a Fix 4 — Atomic cart order submission ────────────────────────────
-- Run this in your Supabase SQL editor AFTER `docs/cart-migration.sql` has
-- been applied (the `customer_user_id` column on `orders` must exist).
--
-- Wraps the orders + order_items inserts in a single transaction so a failure
-- partway through (e.g. RLS or schema mismatch on order_items) doesn't leave
-- an orphan orders row. Wave 2 retries confirmed this happened on flaky
-- submits.
--
-- The function is SECURITY DEFINER so it can be called with the anon key and
-- still bypass RLS. EXECUTE is granted to anon + authenticated only.
--
-- Stock decrement is intentionally LEFT OUT of this RPC: it runs after the
-- order is committed (CartPage.jsx step 3) so admins can reconcile by hand
-- when a decrement fails — same trade-off as the existing single-buy flow.

CREATE OR REPLACE FUNCTION submit_cart_order(
  order_payload  jsonb,    -- entire orders row as JSON
  items_payload  jsonb     -- array of order_items rows as JSON
)
RETURNS uuid                -- returns the new orders.id
LANGUAGE plpgsql
SECURITY DEFINER            -- runs with the function owner's privileges
AS $$
DECLARE
  new_id uuid;
  item   jsonb;
BEGIN
  -- Insert orders row, returning the generated id
  INSERT INTO orders SELECT * FROM jsonb_populate_record(NULL::orders, order_payload)
  RETURNING id INTO new_id;

  -- Insert each order_items row tied to new_id
  FOR item IN SELECT * FROM jsonb_array_elements(items_payload)
  LOOP
    INSERT INTO order_items SELECT * FROM jsonb_populate_record(
      NULL::order_items,
      item || jsonb_build_object('order_id', new_id::text)
    );
  END LOOP;

  RETURN new_id;
END;
$$;

-- Allow anon role to call this function (since cart submits use anon key)
GRANT EXECUTE ON FUNCTION submit_cart_order(jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION submit_cart_order(jsonb, jsonb) TO authenticated;
