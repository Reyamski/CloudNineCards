-- ── Deck Builder Packs — repoint to self-hosted One Piece sample images ─────
-- Replaces the themed placeholders with One Piece character art that is
-- ALREADY shipped and live in preview/public/ (reused, not newly downloaded
-- or hotlinked — zero new IP exposure). Both tiers of a theme share that
-- theme's image (6 images, 12 rows). Thematic pairing:
--   Red Aggression  → /luffy.png   (aggressive lead)
--   Green Fortress  → /zoro.png    (sturdy defender)
--   Purple Chaos    → /robin.png   (arcane / chaotic flair)
--   Black Control   → /nami.png    (tactical control)
--   Yellow Destiny  → /op15.webp   (high-stakes fate)
--   Blue Strategy   → /ac1.webp    (calculated tempo)
--
-- RUN ORDER: run LAST — after docs/deck-builder-packs-seed.sql and
-- docs/deck-builder-packs-copy-update.sql. Owner runs this in the Supabase
-- SQL editor. Idempotent — safe to re-run (plain UPDATE by id; a missing
-- yellow/blue row simply updates 0 rows until the seed is run).
--
-- Owner can later swap any pack's real photo via Admin → Products.

UPDATE public.products SET image_url = '/luffy.png'  WHERE id IN ('dbp-red-standard','dbp-red-premium');
UPDATE public.products SET image_url = '/zoro.png'   WHERE id IN ('dbp-green-standard','dbp-green-premium');
UPDATE public.products SET image_url = '/robin.png'  WHERE id IN ('dbp-purple-standard','dbp-purple-premium');
UPDATE public.products SET image_url = '/nami.png'   WHERE id IN ('dbp-black-standard','dbp-black-premium');
UPDATE public.products SET image_url = '/op15.webp'  WHERE id IN ('dbp-yellow-standard','dbp-yellow-premium');
UPDATE public.products SET image_url = '/ac1.webp'   WHERE id IN ('dbp-blue-standard','dbp-blue-premium');

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT id, image_url FROM public.products WHERE tag = 'Deck Builder' ORDER BY id;
-- Expected: 12 rows, image_url = /{luffy|zoro|robin|nami}.png or
-- /{op15|ac1}.webp by theme.
