-- ── Deck Builder Packs — seed 12 products (6 themes × Standard / Premium) ────
-- Structured deck-building bundles for beginners. NOT a mystery / loot-box /
-- gambling product. Each pack is a fixed-size, single-color set of
-- deck-building cards at a fixed price.
--
-- DO NOT auto-apply — the site owner runs this in the Supabase SQL editor.
-- After this runs, the 12 packs back the 6 theme cards on /deck-builder-packs
-- (theme card opens a Standard / Premium picker) and each tier still resolves
-- at /shop/<id> via the existing products fetch.
--
-- Schema = public.products (see docs/preorders-migration.sql).
-- Note: usd_price / aud_price / eur_price were removed earlier — not set here.
-- `stock` column added by the idempotent ALTER in preorders-migration.sql.
--
-- Safe to re-run: ON CONFLICT (id) DO NOTHING. The owner already seeded the
-- original 8 (red/green/purple/black × 2); this re-run is a no-op for those
-- and only inserts the 4 new yellow/blue rows.
--
-- RUN ORDER:
--   1. docs/deck-builder-packs-seed.sql            (this file)
--   2. docs/deck-builder-packs-copy-update.sql     (plain titles/subtitles)
--   3. docs/deck-builder-packs-onepiece-images.sql (self-hosted art)
--
-- NOTE: image_url below uses placehold.co for first-seed only. After seeding,
-- run docs/deck-builder-packs-onepiece-images.sql to repoint all 12 rows to
-- the self-hosted One Piece art already in preview/public/ (no hotlink, no
-- new IP). Titles/subtitles here already match
-- docs/deck-builder-packs-copy-update.sql.

INSERT INTO public.products
  (id, title, subtitle, language, price, badge, in_stock, stock, image_url, tag)
VALUES
  ('dbp-red-standard',     'Red Aggression Standard Pack',  'Deck Builder Standard', 'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/2a0a0a/f87171?text=Red+Aggression%0AStandard',    'Deck Builder'),
  ('dbp-red-premium',      'Red Aggression Premium Pack',   'Deck Builder Premium',  'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/2a0a0a/f87171?text=Red+Aggression%0APremium',     'Deck Builder'),
  ('dbp-green-standard',   'Green Fortress Standard Pack',  'Deck Builder Standard', 'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/072a13/4ade80?text=Green+Fortress%0AStandard',    'Deck Builder'),
  ('dbp-green-premium',    'Green Fortress Premium Pack',   'Deck Builder Premium',  'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/072a13/4ade80?text=Green+Fortress%0APremium',     'Deck Builder'),
  ('dbp-purple-standard',  'Purple Chaos Standard Pack',    'Deck Builder Standard', 'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/1f0a2e/c084fc?text=Purple+Chaos%0AStandard',      'Deck Builder'),
  ('dbp-purple-premium',   'Purple Chaos Premium Pack',     'Deck Builder Premium',  'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/1f0a2e/c084fc?text=Purple+Chaos%0APremium',       'Deck Builder'),
  ('dbp-black-standard',   'Black Control Standard Pack',   'Deck Builder Standard', 'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/0a0a0a/9ca3af?text=Black+Control%0AStandard',     'Deck Builder'),
  ('dbp-black-premium',    'Black Control Premium Pack',    'Deck Builder Premium',  'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/0a0a0a/9ca3af?text=Black+Control%0APremium',      'Deck Builder'),
  ('dbp-yellow-standard',  'Yellow Destiny Standard Pack',  'Deck Builder Standard', 'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/2a2207/fde047?text=Yellow+Destiny%0AStandard',    'Deck Builder'),
  ('dbp-yellow-premium',   'Yellow Destiny Premium Pack',   'Deck Builder Premium',  'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/2a2207/fde047?text=Yellow+Destiny%0APremium',     'Deck Builder'),
  ('dbp-blue-standard',    'Blue Strategy Standard Pack',   'Deck Builder Standard', 'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/07202a/38bdf8?text=Blue+Strategy%0AStandard',     'Deck Builder'),
  ('dbp-blue-premium',     'Blue Strategy Premium Pack',    'Deck Builder Premium',  'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/07202a/38bdf8?text=Blue+Strategy%0APremium',      'Deck Builder')
ON CONFLICT (id) DO NOTHING;

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT id, title, price, tag, stock FROM public.products
--   WHERE tag = 'Deck Builder' ORDER BY id;
-- Expected: 12 rows, 6 × 9.99 (Standard) + 6 × 19.99 (Premium).
