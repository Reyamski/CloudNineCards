-- Wave 3b E2E Test Cleanup (updated 2026-05-16 after retry)
-- Generated: 2026-05-16 by Playwright MCP runs (original + retry after delivery_fee fix 520de75e)
--
-- ORIGINAL RUN orders (only the in-stock ones succeeded; preorder/mixed rows failed):
--   Test 1 (auth jejem0127):       CNC-K3YNMOCS  in_stock_order_id = 478f0bb2-c0fc-429a-97ca-90ef46f46c54
--   Test 6 (anon in-stock leg):    CNC-KOJM02BL  in_stock_order_id = 8bd8834b-4781-4ef4-ab7b-80536a036da5
--
-- RETRY RUN orders (after delivery_fee fix — all succeeded):
--   T2 retry (auth jejem0127, preorder only):
--      preorder_order_id  = 3602d243-0c78-453c-a048-77d06658a894    order_number CNC-KZ40RBWN
--   T3 retry (auth jejem0127, mixed cart):
--      in_stock_order_id  = dfaea3f2-80b9-4c7f-b21f-8556b74b7b3a    order_number CNC-L2RFL3QK-A
--      preorder_order_id  = 8643774d-ee91-461d-9d9c-30d79a275732    order_number CNC-L2RFLZYK-B
--   T6 retry (anon mixed cart, customer_user_id=null):
--      in_stock_order_id  = a0655f0c-7740-4a19-8f03-4fb3b7ab8da2    order_number CNC-L60JO9VX-A
--      preorder_order_id  = 6a67c16d-3218-4eee-8eda-d69a2c9740fa    order_number CNC-L60JOEVZ-B
--
-- Stock changes to restore:
--   singles b5409ef4 (Kikunojo):           -1 → +1   (Test 1 original)
--   singles 70d32021 (Perona):             -1 → +1   (Test 1 original)
--   singles 93d353f9 (Sabo):               -1 → +1   (Test 6 original anon in-stock substitute)
--   singles dc857246 (Enel):               -1 → +1   (T3 retry mixed)
--   singles a1ec7bb4 (Wyper):              -1 → +1   (T6 retry mixed)
--   products poke-ah (Pokemon Mega ETB):   -1 → +1   (T3 retry mixed)
--   preorders po-1778692308860 (Shyarotto): no decrement (preorder rows never decrement stock)
--
-- Run this in Supabase SQL Editor with the service role.

BEGIN;

-- 1) Delete order_items rows linked to all test orders, then the orders themselves
DELETE FROM order_items
 WHERE order_id IN (
   -- original run
   '478f0bb2-c0fc-429a-97ca-90ef46f46c54', -- CNC-K3YNMOCS  (orig T1)
   '8bd8834b-4781-4ef4-ab7b-80536a036da5', -- CNC-KOJM02BL  (orig T6 anon in-stock)
   -- retry run
   '3602d243-0c78-453c-a048-77d06658a894', -- CNC-KZ40RBWN  (retry T2 preorder)
   'dfaea3f2-80b9-4c7f-b21f-8556b74b7b3a', -- CNC-L2RFL3QK-A (retry T3 in-stock)
   '8643774d-ee91-461d-9d9c-30d79a275732', -- CNC-L2RFLZYK-B (retry T3 preorder)
   'a0655f0c-7740-4a19-8f03-4fb3b7ab8da2', -- CNC-L60JO9VX-A (retry T6 in-stock anon)
   '6a67c16d-3218-4eee-8eda-d69a2c9740fa'  -- CNC-L60JOEVZ-B (retry T6 preorder anon)
 );

DELETE FROM orders
 WHERE id IN (
   '478f0bb2-c0fc-429a-97ca-90ef46f46c54',
   '8bd8834b-4781-4ef4-ab7b-80536a036da5',
   '3602d243-0c78-453c-a048-77d06658a894',
   'dfaea3f2-80b9-4c7f-b21f-8556b74b7b3a',
   '8643774d-ee91-461d-9d9c-30d79a275732',
   'a0655f0c-7740-4a19-8f03-4fb3b7ab8da2',
   '6a67c16d-3218-4eee-8eda-d69a2c9740fa'
 );

-- Belt-and-suspenders by order_number in case the IDs above shifted
DELETE FROM orders
 WHERE order_number IN (
   'CNC-K3YNMOCS', 'CNC-KOJM02BL',
   'CNC-KZ40RBWN',
   'CNC-L2RFL3QK-A', 'CNC-L2RFLZYK-B',
   'CNC-L60JO9VX-A', 'CNC-L60JOEVZ-B'
 );

-- 2) Restore decremented singles stock
UPDATE singles SET stock = stock + 1
 WHERE id = 'b5409ef4-5c9f-4d92-9e3d-5bdc14f0799d'; -- Kikunojo (orig T1)

UPDATE singles SET stock = stock + 1
 WHERE id = '70d32021-630e-420e-8ebf-5a772f39762b'; -- Perona (orig T1)

UPDATE singles SET stock = stock + 1
 WHERE id = '93d353f9-87e2-4d2a-b10b-64bc8b917055'; -- Sabo (orig T6 anon)

UPDATE singles SET stock = stock + 1
 WHERE id = 'dc857246-8dff-4825-bdc1-b704ab7dbce9'; -- Enel (retry T3)

UPDATE singles SET stock = stock + 1
 WHERE id = 'a1ec7bb4-ecef-4055-bd14-255948b20a81'; -- Wyper (retry T6)

-- 3) Restore decremented products stock (Pokemon Mega Evolution ETB from retry T3)
UPDATE products SET stock = stock + 1
 WHERE id = 'poke-ah';

-- 4) Preorders po-1778692308860 (Shyarotto): no decrement to restore (preorder rows don't touch stock)

-- Verify
SELECT id, order_number, buyer_email, status FROM orders
 WHERE order_number IN (
   'CNC-K3YNMOCS','CNC-KOJM02BL',
   'CNC-KZ40RBWN',
   'CNC-L2RFL3QK-A','CNC-L2RFLZYK-B',
   'CNC-L60JO9VX-A','CNC-L60JOEVZ-B'
 );
-- expect: 0 rows

SELECT id, card_name, stock FROM singles
 WHERE id IN (
   'b5409ef4-5c9f-4d92-9e3d-5bdc14f0799d',
   '70d32021-630e-420e-8ebf-5a772f39762b',
   '93d353f9-87e2-4d2a-b10b-64bc8b917055',
   'dc857246-8dff-4825-bdc1-b704ab7dbce9',
   'a1ec7bb4-ecef-4055-bd14-255948b20a81'
 );
-- expect: stock = 1 on all five

SELECT id, title, stock FROM products WHERE id = 'poke-ah';
-- expect: stock restored by +1 from pre-test value

COMMIT;
