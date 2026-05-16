-- ── Vuln hardening — fold stock mutation into submit RPC + revoke anon ────
-- Audit 2026-05-16 found decrement_item_stock / restore_item_stock /
-- mark_order_stock_check_failed are anon-callable → inventory & order
-- griefing. Fix: the cart's stock decrement now happens INSIDE
-- submit_cart_orders_v2 (already SECURITY DEFINER + F5-hardened), in the
-- same transaction as the order insert. Then we REVOKE anon/authenticated
-- EXECUTE on the three standalone mutation RPCs so they can no longer be
-- invoked directly from the bundled anon key.
--
-- Run order:
--   1. Deploy the code change first (CartPage stops calling decrement /
--      mark-failed separately; AdminPage reject goes through
--      /api/admin/reject-order). Brief window where the OLD submit RPC
--      doesn't decrement is acceptable (admin reconciles; reversible).
--   2. Run this SQL.
--
-- Rollback: re-run docs/wave3-followups-rpc-hardening.sql (F5 version
-- without inlined decrement) + re-GRANT the three RPCs to anon.

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
  src         text;
  iid         text;
  iqty        integer;
  newstock    integer;
  decr_failed boolean := false;
BEGIN
  caller_uid := CASE WHEN auth.uid() IS NOT NULL THEN auth.uid()::text ELSE NULL END;

  -- ── In-stock order ──────────────────────────────────────────────────
  IF in_stock_payload IS NOT NULL AND in_stock_payload <> 'null'::jsonb THEN
    in_stock_id := gen_random_uuid();
    enforced := in_stock_payload || jsonb_build_object(
      'id',               in_stock_id::text,
      'created_at',       now(),
      'status',           'pending',
      'payment_status',   'awaiting_payment',
      'customer_user_id', caller_uid
    );
    INSERT INTO orders SELECT * FROM jsonb_populate_record(NULL::orders, enforced);

    FOR item IN SELECT * FROM jsonb_array_elements(in_stock_items) LOOP
      INSERT INTO order_items
      SELECT * FROM jsonb_populate_record(
        NULL::order_items,
        item || jsonb_build_object(
          'id',         gen_random_uuid()::text,
          'order_id',   in_stock_id::text,
          'created_at', now()
        )
      );

      -- Inline stock decrement (was the standalone decrement_item_stock RPC).
      -- Runs in THIS transaction; no separate anon-callable surface.
      src  := item->>'source_table';
      iid  := item->>'item_id';
      iqty := COALESCE((item->>'qty')::integer, 0);

      IF iqty > 0 AND iid IS NOT NULL THEN
        IF src = 'singles' THEN
          UPDATE singles
          SET    stock      = GREATEST(0, stock - iqty),
                 in_stock   = (GREATEST(0, stock - iqty) > 0),
                 updated_at = now()
          WHERE  id::text = iid
          RETURNING stock INTO newstock;
          IF newstock IS NULL THEN decr_failed := true; END IF;
        ELSIF src = 'products' THEN
          UPDATE products
          SET    stock    = GREATEST(0, stock - iqty),
                 in_stock = (GREATEST(0, stock - iqty) > 0),
                 badge    = CASE WHEN (GREATEST(0, stock - iqty) > 0)
                                 THEN 'In Stock' ELSE 'Sold Out' END
          WHERE  id::text = iid
          RETURNING stock INTO newstock;
          IF newstock IS NULL THEN decr_failed := true; END IF;
        ELSE
          -- preorder lines (or unknown source) don't decrement; not a failure
          NULL;
        END IF;
      END IF;
    END LOOP;

    -- If any in-stock line couldn't be decremented (item missing), flag the
    -- order for admin reconciliation. Replaces the anon mark_* RPC call.
    IF decr_failed THEN
      UPDATE orders SET status = 'stock_check_failed' WHERE id = in_stock_id;
    END IF;
  END IF;

  -- ── Pre-order order (no stock decrement — preorders aren't stocked) ──
  IF preorder_payload IS NOT NULL AND preorder_payload <> 'null'::jsonb THEN
    preorder_id := gen_random_uuid();
    enforced := preorder_payload || jsonb_build_object(
      'id',               preorder_id::text,
      'created_at',       now(),
      'status',           'pending',
      'payment_status',   'awaiting_payment',
      'customer_user_id', caller_uid
    );
    INSERT INTO orders SELECT * FROM jsonb_populate_record(NULL::orders, enforced);

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

-- ── Revoke anon access to the standalone mutation RPCs ──────────────────
-- They stay callable by service_role (admin reconciliation / the new
-- /api/admin/reject-order endpoint uses service-role).
REVOKE EXECUTE ON FUNCTION decrement_item_stock(text, text, integer)        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION restore_item_stock(text, text, integer)          FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION mark_order_stock_check_failed(uuid)              FROM anon, authenticated;

-- ── Verification ────────────────────────────────────────────────────────
-- 1. Anon direct RPC calls now blocked:
--    POST /rest/v1/rpc/decrement_item_stock        → 401/403/404 (no EXECUTE)
--    POST /rest/v1/rpc/restore_item_stock          → blocked
--    POST /rest/v1/rpc/mark_order_stock_check_failed→ blocked
-- 2. Cart submit still decrements in-stock items (verify stock drops after
--    a real /cart order).
-- 3. Admin payment_rejected still restores stock (via /api/admin/reject-order).
