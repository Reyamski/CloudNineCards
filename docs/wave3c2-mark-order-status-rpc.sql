-- ── Wave 3c-2 — mark_order_stock_check_failed RPC ─────────────────────
-- Prerequisite for Phase B (docs/wave3c2-phase-b-tighten.sql).
--
-- Why: CartPage.jsx falls back to flagging an order as
-- 'stock_check_failed' when decrement_item_stock fails after the cart RPC
-- has already created the order row. Before Phase B this was a direct
-- anon UPDATE on `orders` — Phase B blocks that. Move the flip to a
-- SECURITY DEFINER RPC bounded to a single column + a single status
-- transition so the anon caller can't abuse it.
--
-- Run BEFORE Phase B. Idempotent (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION mark_order_stock_check_failed(order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders
  SET status = 'stock_check_failed', updated_at = now()
  WHERE id = order_id
    AND status IN ('awaiting_payment', 'pending');
  -- Guard: only flip from a known pre-payment status. Prevents the cart
  -- from clobbering admin-set statuses (e.g. 'confirmed', 'cancelled')
  -- if this RPC fires late or is replayed.
END;
$$;

GRANT EXECUTE ON FUNCTION mark_order_stock_check_failed(uuid) TO anon;
GRANT EXECUTE ON FUNCTION mark_order_stock_check_failed(uuid) TO authenticated;
