-- ── Deck Builder Packs — seed 8 products ─────────────────────────────────────
-- Structured deck-building bundles for beginners. NOT a mystery / loot-box /
-- gambling product. Each pack is a fixed-size, single-color set of
-- deck-building cards at a fixed price.
--
-- DO NOT auto-apply — the site owner runs this in the Supabase SQL editor.
-- After this runs, the 8 packs appear on /shop, /deck-builder-packs, and each
-- resolves at /shop/<id> via the existing products fetch.
--
-- Schema = public.products (see docs/preorders-migration.sql).
-- Note: usd_price / aud_price / eur_price were removed earlier — not set here.
-- `stock` column added by the idempotent ALTER in preorders-migration.sql.
--
-- Safe to re-run: ON CONFLICT (id) DO NOTHING.
--
-- NOTE: image_url below uses placehold.co for first-seed only. After seeding,
-- run docs/deck-builder-packs-images-update.sql to repoint all 8 rows to the
-- self-hosted themed SVGs in preview/public/deck-builder/ (no hotlink/IP).

INSERT INTO public.products
  (id, title, subtitle, language, price, badge, in_stock, stock, image_url, tag)
VALUES
  ('dbp-red-standard',     'Red Aggression Pack — Standard',      'Deck Builder · Standard',     'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/2a0a0a/f87171?text=Red+Aggression%0AStandard',     'Deck Builder'),
  ('dbp-red-premium',      'Red Aggression Pack — Premium Plus',  'Deck Builder · Premium Plus', 'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/2a0a0a/f87171?text=Red+Aggression%0APremium+Plus', 'Deck Builder'),
  ('dbp-green-standard',   'Green Fortress Pack — Standard',      'Deck Builder · Standard',     'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/072a13/4ade80?text=Green+Fortress%0AStandard',     'Deck Builder'),
  ('dbp-green-premium',    'Green Fortress Pack — Premium Plus',  'Deck Builder · Premium Plus', 'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/072a13/4ade80?text=Green+Fortress%0APremium+Plus', 'Deck Builder'),
  ('dbp-purple-standard',  'Purple Chaos Pack — Standard',        'Deck Builder · Standard',     'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/1f0a2e/c084fc?text=Purple+Chaos%0AStandard',       'Deck Builder'),
  ('dbp-purple-premium',   'Purple Chaos Pack — Premium Plus',    'Deck Builder · Premium Plus', 'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/1f0a2e/c084fc?text=Purple+Chaos%0APremium+Plus',   'Deck Builder'),
  ('dbp-black-standard',   'Black Control Pack — Standard',       'Deck Builder · Standard',     'English',  9.99, 'Great for Beginners', TRUE, 50, 'https://placehold.co/400x560/0a0a0a/9ca3af?text=Black+Control%0AStandard',      'Deck Builder'),
  ('dbp-black-premium',    'Black Control Pack — Premium Plus',   'Deck Builder · Premium Plus', 'English', 19.99, 'Starter Upgrade Pack', TRUE, 50, 'https://placehold.co/400x560/0a0a0a/9ca3af?text=Black+Control%0APremium+Plus',  'Deck Builder')
ON CONFLICT (id) DO NOTHING;

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT id, title, price, tag, stock FROM public.products
--   WHERE tag = 'Deck Builder' ORDER BY id;
-- Expected: 8 rows, 4 × 9.99 (Standard) + 4 × 19.99 (Premium Plus).
