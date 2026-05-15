-- ── Cart / multi-item orders migration ────────────────────────────────────────
-- Run this in your Supabase SQL editor after pulling the `feat/cart-and-ux`
-- branch. Backfill is idempotent — safe to re-run.
--
-- Adds an `order_items` table so a single `orders` row can hold multiple
-- products. Existing single-item orders are backfilled into the new table so
-- the admin UI keeps showing them correctly.
--
-- Schema notes:
--   • `orders.id` is the Supabase-default UUID primary key on the existing
--     `orders` table. `order_items.order_id` matches that type so we can FK to
--     it. (Adjust to TEXT below if your `orders.id` is text — column type can
--     be inspected with: `\d orders` or `select column_name, data_type from
--     information_schema.columns where table_name = 'orders';`)
--   • `source_table` is one of `'singles'`, `'products'`, `'preorders'`.
--   • `is_preorder` lets the admin UI label and ETA-flag rows without joining
--     to source tables.
--   • `title_snapshot` / `image_snapshot` preserve item identity at order
--     time — even if the product is later deleted, the order line still
--     renders.

CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  source_table    TEXT NOT NULL,   -- 'singles' | 'products' | 'preorders'
  item_id         TEXT NOT NULL,
  qty             INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price      NUMERIC(10,2) NOT NULL,
  title_snapshot  TEXT NOT NULL,   -- preserve at order time
  image_snapshot  TEXT,
  is_preorder     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

-- ── Backfill: synthesize order_items rows for existing single-item orders ────
-- Maps the legacy single-item columns on `orders` into per-line rows.
-- The existing `orders` table uses:
--   product_id      → item_id
--   order_type      → source_table (mapped: 'single'→'singles',
--                     'on_hand'→'products', 'pre_order'→'preorders')
--   quantity        → qty
--   total_price OR subtotal OR full_price → unit_price (best-available;
--                     falls back to 0 if nothing exists)
--   product_title OR item_title → title_snapshot (falls back to product_id)
--   (no image column on orders) → image_snapshot left NULL; admin UI falls
--                     back to the source-table image when expanding a row.

INSERT INTO order_items (
  order_id, source_table, item_id, qty, unit_price,
  title_snapshot, image_snapshot, is_preorder
)
SELECT
  o.id,
  CASE
    WHEN o.order_type = 'single'    THEN 'singles'
    WHEN o.order_type = 'pre_order' THEN 'preorders'
    ELSE 'products'
  END                                                       AS source_table,
  COALESCE(o.product_id, '')                                AS item_id,
  COALESCE(o.quantity, 1)                                   AS qty,
  COALESCE(
    NULLIF(o.total_price, 0),
    NULLIF(o.subtotal,    0),
    NULLIF(o.full_price,  0),
    0
  )                                                         AS unit_price,
  COALESCE(
    NULLIF(o.product_title, ''),
    NULLIF(o.item_title,    ''),
    COALESCE(o.product_id, '(legacy order — title not stored)')
  )                                                         AS title_snapshot,
  NULL                                                      AS image_snapshot,
  (o.order_type = 'pre_order')                              AS is_preorder
FROM orders o
WHERE o.product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
  );

-- ── Optional: relax legacy single-item columns on `orders` ───────────────────
-- The cart-driven submit path inserts placeholder values (`product_id = MULTI`,
-- `order_type = 'cart'`, `quantity = total qty`, `total_price = order total`)
-- while the per-line truth lives in `order_items`. The columns stay populated
-- for backward compatibility with the existing admin UI; no schema change is
-- strictly required, but if your environment has NOT NULL on any of these,
-- relax them with the lines below:
--
-- ALTER TABLE orders ALTER COLUMN product_id    DROP NOT NULL;
-- ALTER TABLE orders ALTER COLUMN product_title DROP NOT NULL;
-- ALTER TABLE orders ALTER COLUMN quantity      DROP NOT NULL;
