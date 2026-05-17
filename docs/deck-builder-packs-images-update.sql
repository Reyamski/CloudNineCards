-- ── Deck Builder Packs — repoint to self-hosted sample images ────────────────
-- Replaces the placehold.co URLs with our own dark themed SVG placeholders
-- shipped in preview/public/deck-builder/ (no hotlink, no third-party IP,
-- crisp/scalable, clearly labelled "SAMPLE IMAGE · ACTUAL CARDS VARY").
-- Both tiers of a theme share that theme's image (4 images, 8 rows).
--
-- Run AFTER docs/deck-builder-packs-seed.sql and AFTER this branch is
-- deployed (so /deck-builder/<color>.svg actually exists on the host).
-- Owner runs this in the Supabase SQL editor. Idempotent.
--
-- Owner can later swap any pack's real photo via Admin → Products.

UPDATE public.products SET image_url = '/deck-builder/red.svg'    WHERE id IN ('dbp-red-standard','dbp-red-premium');
UPDATE public.products SET image_url = '/deck-builder/green.svg'  WHERE id IN ('dbp-green-standard','dbp-green-premium');
UPDATE public.products SET image_url = '/deck-builder/purple.svg' WHERE id IN ('dbp-purple-standard','dbp-purple-premium');
UPDATE public.products SET image_url = '/deck-builder/black.svg'  WHERE id IN ('dbp-black-standard','dbp-black-premium');

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT id, image_url FROM public.products WHERE tag = 'Deck Builder' ORDER BY id;
-- Expected: 8 rows, image_url = /deck-builder/{red|green|purple|black}.svg
