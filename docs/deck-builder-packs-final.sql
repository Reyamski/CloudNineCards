-- ════════════════════════════════════════════════════════════════════════════
-- Deck Builder Packs — FINAL canonical seed (Standard only, Premium removed)
-- ════════════════════════════════════════════════════════════════════════════
-- THIS FILE SUPERSEDES the three older docs:
--   docs/deck-builder-packs-seed.sql
--   docs/deck-builder-packs-copy-update.sql
--   docs/deck-builder-packs-onepiece-images.sql
-- Run THIS ONE only. The old three are kept for history but are no longer
-- canonical (each now carries a header note pointing here).
--
-- WHAT CHANGED:
--   - The owner removed the Premium tier. Deck packs are now 6 products,
--     Standard only (one per color). There is no tier picker.
--   - Titles drop the "Standard" qualifier (no Premium to contrast) and match
--     the pack-art titles burned into the optimized images.
--   - image_url points at the optimized self-hosted One Piece pack art at
--     /deck-builder/{color}.webp (~130–240 KB each, was ~2.3–3 MB PNG).
--
-- DO NOT auto-apply — the site owner runs this in the Supabase SQL editor.
-- Safe to re-run: premium DELETE is a no-op once gone; the 6 Standard rows
-- UPSERT via ON CONFLICT DO UPDATE so a re-run refreshes title/img/price/etc.
--
-- Schema = public.products (see docs/preorders-migration.sql). NOTE: the
-- products table has NO description column — the "includes 2 rare cards"
-- contents copy lives in the `subtitle` here and prominently on the page
-- (preview/src/pages/DeckBuilderPacksPage.jsx). Do not invent a column.
--
-- HISTORICAL ORDERS: order_items snapshot product title/price at purchase
-- time, so deleting the discontinued premium product rows does NOT alter any
-- past order. We intentionally do NOT touch orders / order_items here.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Remove the 6 discontinued Premium product rows ──────────────────────
-- Idempotent: deletes 0 rows on a re-run once they're gone. Historical orders
-- keep their own snapshot of these items and are intentionally left intact.
DELETE FROM public.products
 WHERE id IN (
   'dbp-red-premium',
   'dbp-green-premium',
   'dbp-purple-premium',
   'dbp-black-premium',
   'dbp-yellow-premium',
   'dbp-blue-premium'
 );

-- ── 2. Upsert the 6 Standard rows ──────────────────────────────────────────
-- price 9.99, tag 'Deck Builder', stock 50, in_stock TRUE. Titles match the
-- pack-art image titles. subtitle is plain "Deck Builder" + the 2-rares line
-- (no description column exists; no decorative — / · / • characters).
INSERT INTO public.products
  (id, title, subtitle, language, price, badge, in_stock, stock, image_url, tag)
VALUES
  ('dbp-red-standard',     'Red Aggression Pack',     'Deck Builder. Includes 2 rare cards.', 'English', 9.99, 'Great for Beginners', TRUE, 50, '/deck-builder/red.webp',     'Deck Builder'),
  ('dbp-green-standard',   'Green Fortress Pack',     'Deck Builder. Includes 2 rare cards.', 'English', 9.99, 'Great for Beginners', TRUE, 50, '/deck-builder/green.webp',   'Deck Builder'),
  ('dbp-purple-standard',  'Purple Dominance Pack',   'Deck Builder. Includes 2 rare cards.', 'English', 9.99, 'Great for Beginners', TRUE, 50, '/deck-builder/purple.webp',  'Deck Builder'),
  ('dbp-black-standard',   'Black Strategy Pack',     'Deck Builder. Includes 2 rare cards.', 'English', 9.99, 'Great for Beginners', TRUE, 50, '/deck-builder/black.webp',   'Deck Builder'),
  ('dbp-yellow-standard',  'Yellow Dominion Pack',    'Deck Builder. Includes 2 rare cards.', 'English', 9.99, 'Great for Beginners', TRUE, 50, '/deck-builder/yellow.webp',  'Deck Builder'),
  ('dbp-blue-standard',    'Blue Flair Pack',         'Deck Builder. Includes 2 rare cards.', 'English', 9.99, 'Great for Beginners', TRUE, 50, '/deck-builder/blue.webp',    'Deck Builder')
ON CONFLICT (id) DO UPDATE SET
  title     = EXCLUDED.title,
  subtitle  = EXCLUDED.subtitle,
  language  = EXCLUDED.language,
  price     = EXCLUDED.price,
  badge     = EXCLUDED.badge,
  in_stock  = EXCLUDED.in_stock,
  -- Refresh stock to 50 on re-run so the seed is a true reset. (If you have
  -- already taken real orders against these and do NOT want stock reset,
  -- remove the next line before running.)
  stock     = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  tag       = EXCLUDED.tag;

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT id, title, subtitle, price, tag, stock, in_stock, image_url
--     FROM public.products WHERE tag = 'Deck Builder' ORDER BY id;
-- Expected: exactly 6 rows, all 9.99, stock 50, in_stock TRUE,
-- image_url = /deck-builder/{color}.webp, NO '-premium' ids, NO '—'/'·'/'•'.
--   SELECT count(*) FROM public.products WHERE id LIKE 'dbp-%-premium'; -- 0
