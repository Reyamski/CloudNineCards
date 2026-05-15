-- ── Wave 3a Fix 4 — Atomic cart order submission (v2) ───────────────────────
-- Run this in your Supabase SQL editor. Safe to re-run — CREATE OR REPLACE.
--
-- v2 (this revision): explicitly inject server-side `id` + `created_at` for
-- both `orders` and `order_items` because `jsonb_populate_record` bypasses
-- column DEFAULTs — it returns NULL for any field missing from the payload,
-- and the subsequent INSERT writes that NULL, triggering 23502 NOT NULL
-- violations on `orders.id` / `order_items.id` / `order_id` / `created_at`.
-- The fix is to merge those keys onto the payload via `jsonb_build_object`
-- before populating the record.
--
-- (v1 also relied on this RPC for atomicity: orders + order_items insert in a
-- single transaction so a partial failure rolls everything back rather than
-- leaving an orphan orders row.)
--
-- The function is SECURITY DEFINER so it can be called with the anon key and
-- still bypass RLS. EXECUTE is granted to anon + authenticated only.
--
-- Stock decrement is intentionally LEFT OUT of this RPC: it runs after the
-- order is committed (CartPage.jsx step 3) so admins can reconcile by hand
-- when a decrement fails — same trade-off as the existing single-buy flow.

CREATE OR REPLACE FUNCTION submit_cart_order(
  order_payload  jsonb,    -- entire orders row as JSON (no id / created_at)
  items_payload  jsonb     -- array of order_items rows as JSON
)
RETURNS uuid                -- returns the new orders.id
LANGUAGE plpgsql
SECURITY DEFINER            -- runs with the function owner's privileges
AS $$
DECLARE
  new_id uuid := gen_random_uuid();
  item   jsonb;
BEGIN
  -- Inject server-side id + created_at. These override any payload values to
  -- prevent client-forged ids/timestamps and to satisfy NOT NULL constraints
  -- that jsonb_populate_record would otherwise blow past (it ignores column
  -- DEFAULTs and writes NULL for any key the JSON omits).
  INSERT INTO orders
  SELECT * FROM jsonb_populate_record(
    NULL::orders,
    order_payload || jsonb_build_object(
      'id', new_id,
      'created_at', now()
    )
  );

  -- Insert each order_items row tied to new_id, with its own generated id +
  -- created_at injected the same way.
  FOR item IN SELECT * FROM jsonb_array_elements(items_payload)
  LOOP
    INSERT INTO order_items
    SELECT * FROM jsonb_populate_record(
      NULL::order_items,
      item || jsonb_build_object(
        'id', gen_random_uuid(),
        'order_id', new_id,
        'created_at', now()
      )
    );
  END LOOP;

  RETURN new_id;
END;
$$;

-- Allow anon role to call this function (since cart submits use anon key)
GRANT EXECUTE ON FUNCTION submit_cart_order(jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION submit_cart_order(jsonb, jsonb) TO authenticated;
