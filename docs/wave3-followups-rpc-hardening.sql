-- ── Wave 3 follow-ups — submit_cart_orders_v2 row-shape hardening (F5) ─────
-- Run in Supabase SQL editor. Safe to re-run (CREATE OR REPLACE).
--
-- The original RPC trusted whatever shape the client sent via
-- jsonb_populate_record. An anon caller could forge fields like
-- `status='confirmed'` or `payment_status='paid'` or claim another user's
-- `customer_user_id` and it would land in admin as already-paid /
-- attributed to the wrong account.
--
-- This version explicitly overwrites the security-sensitive fields server
-- side, regardless of payload contents. Anon callers cannot escalate.
--
-- Fields enforced:
--   - id              → freshly minted UUID
--   - created_at      → now()
--   - status          → 'pending'         (cart flow's pre-payment value)
--   - payment_status  → 'awaiting_payment'
--   - customer_user_id → auth.uid() if logged in, NULL otherwise
--
-- All other payload fields (buyer details, totals, items, etc.) pass through
-- as before. The order_items inserts are unchanged.

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
  caller_uid  text;
  enforced    jsonb;
BEGIN
  -- Stamp customer_user_id from session, not from payload. Casts to text so
  -- jsonb_build_object accepts it; column type is uuid and jsonb_populate_record
  -- handles the cast back.
  caller_uid := CASE WHEN auth.uid() IS NOT NULL THEN auth.uid()::text ELSE NULL END;

  IF in_stock_payload IS NOT NULL AND in_stock_payload <> 'null'::jsonb THEN
    in_stock_id := gen_random_uuid();
    enforced := in_stock_payload || jsonb_build_object(
      'id',               in_stock_id::text,
      'created_at',       now(),
      'status',           'pending',
      'payment_status',   'awaiting_payment',
      'customer_user_id', caller_uid
    );
    INSERT INTO orders
    SELECT * FROM jsonb_populate_record(NULL::orders, enforced);

    FOR item IN SELECT * FROM jsonb_array_elements(in_stock_items) LOOP
      INSERT INTO order_items
      SELECT * FROM jsonb_populate_record(
        NULL::order_items,
        item || jsonb_build_object(
          'id',          gen_random_uuid()::text,
          'order_id',    in_stock_id::text,
          'created_at',  now()
        )
      );
    END LOOP;
  END IF;

  IF preorder_payload IS NOT NULL AND preorder_payload <> 'null'::jsonb THEN
    preorder_id := gen_random_uuid();
    enforced := preorder_payload || jsonb_build_object(
      'id',               preorder_id::text,
      'created_at',       now(),
      'status',           'pending',
      'payment_status',   'awaiting_payment',
      'customer_user_id', caller_uid
    );
    INSERT INTO orders
    SELECT * FROM jsonb_populate_record(NULL::orders, enforced);

    FOR item IN SELECT * FROM jsonb_array_elements(preorder_items) LOOP
      INSERT INTO order_items
      SELECT * FROM jsonb_populate_record(
        NULL::order_items,
        item || jsonb_build_object(
          'id',         gen_random_uuid()::text,
          'order_id',   preorder_id::text,
          'created_at', now()
        )
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

-- ── Verification ────────────────────────────────────────────────────────────
-- After running, attempt to submit a cart with forged status from the anon
-- client. Expected result: the order lands with status='pending' and
-- payment_status='awaiting_payment' regardless of payload contents.
