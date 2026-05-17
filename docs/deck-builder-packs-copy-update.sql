-- ── Deck Builder Packs — plain-text copy update (12 rows) ───────────────────
-- Rewrites the 12 pack titles and subtitles to natural plain text, removing
-- any AI-looking em-dash (—) from titles and middle-dot (·) from subtitles.
-- "Standard" vs "Premium" distinction is kept clear; no trailing "Plus".
--
--   title:    'Red Aggression Pack — Premium'  →  'Red Aggression Premium Pack'
--   subtitle: 'Deck Builder · Premium'         →  'Deck Builder Premium'
--
-- RUN ORDER: run AFTER docs/deck-builder-packs-seed.sql, BEFORE
-- docs/deck-builder-packs-onepiece-images.sql. Owner runs this in the
-- Supabase SQL editor. Idempotent — safe to re-run (plain UPDATE by id;
-- a missing yellow/blue row simply updates 0 rows until the seed is run).

UPDATE public.products SET title = 'Red Aggression Standard Pack',  subtitle = 'Deck Builder Standard' WHERE id = 'dbp-red-standard';
UPDATE public.products SET title = 'Red Aggression Premium Pack',   subtitle = 'Deck Builder Premium'  WHERE id = 'dbp-red-premium';
UPDATE public.products SET title = 'Green Fortress Standard Pack',  subtitle = 'Deck Builder Standard' WHERE id = 'dbp-green-standard';
UPDATE public.products SET title = 'Green Fortress Premium Pack',   subtitle = 'Deck Builder Premium'  WHERE id = 'dbp-green-premium';
UPDATE public.products SET title = 'Purple Chaos Standard Pack',    subtitle = 'Deck Builder Standard' WHERE id = 'dbp-purple-standard';
UPDATE public.products SET title = 'Purple Chaos Premium Pack',     subtitle = 'Deck Builder Premium'  WHERE id = 'dbp-purple-premium';
UPDATE public.products SET title = 'Black Control Standard Pack',   subtitle = 'Deck Builder Standard' WHERE id = 'dbp-black-standard';
UPDATE public.products SET title = 'Black Control Premium Pack',    subtitle = 'Deck Builder Premium'  WHERE id = 'dbp-black-premium';
UPDATE public.products SET title = 'Yellow Destiny Standard Pack',  subtitle = 'Deck Builder Standard' WHERE id = 'dbp-yellow-standard';
UPDATE public.products SET title = 'Yellow Destiny Premium Pack',   subtitle = 'Deck Builder Premium'  WHERE id = 'dbp-yellow-premium';
UPDATE public.products SET title = 'Blue Strategy Standard Pack',   subtitle = 'Deck Builder Standard' WHERE id = 'dbp-blue-standard';
UPDATE public.products SET title = 'Blue Strategy Premium Pack',    subtitle = 'Deck Builder Premium'  WHERE id = 'dbp-blue-premium';

-- ── Verification ───────────────────────────────────────────────────────────
--   SELECT id, title, subtitle FROM public.products WHERE tag = 'Deck Builder' ORDER BY id;
-- Expected: 12 rows, no '—' in title, no '·' in subtitle.
