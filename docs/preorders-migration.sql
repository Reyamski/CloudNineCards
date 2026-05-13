-- ── Preorders table ──────────────────────────────────────────────────────────
-- Run this in your Supabase SQL editor.
-- RLS is intentionally disabled — this is a public shop with anon key access.

CREATE TABLE IF NOT EXISTS preorders (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  price_tba     BOOLEAN NOT NULL DEFAULT FALSE,
  price         NUMERIC(10,2),
  usd_price     NUMERIC(10,2),
  aud_price     NUMERIC(10,2),
  currency      TEXT NOT NULL DEFAULT 'CAD',
  eta           TEXT,
  deadline      TIMESTAMPTZ,
  image_url     TEXT,
  hype          TEXT,
  notes         TEXT[],
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE preorders DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS preorders_order_idx ON preorders (display_order);

-- ── Products (on-hand) table ─────────────────────────────────────────────────
-- Replaces the hardcoded preview/src/data/products.js as the source of truth.

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  language    TEXT NOT NULL DEFAULT 'English',
  price       NUMERIC(10,2) NOT NULL,
  usd_price   NUMERIC(10,2),
  aud_price   NUMERIC(10,2),
  eur_price   NUMERIC(10,2),
  badge       TEXT DEFAULT 'In Stock',
  in_stock    BOOLEAN NOT NULL DEFAULT TRUE,
  image_url   TEXT,
  tag         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Run this if the table already exists (idempotent):
ALTER TABLE products ADD COLUMN IF NOT EXISTS usd_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS aud_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS eur_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- ── Mark placeholder accessories as TEST ONLY (run after migration) ──────────
-- These are seeded as demo data. Disable them until you have real stock.
UPDATE products SET
  title    = '[TEST] ' || title,
  in_stock = FALSE,
  badge    = 'Sold Out',
  stock    = 0
WHERE id IN ('acc-kmc-inner','acc-dragon-matte','acc-playmat-op','acc-dice-set');

ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ── Seed: existing products from products.js ─────────────────────────────────
-- Copy the existing hardcoded catalogue into the new table.
-- Run once to bootstrap. After this, manage via the Admin > Products tab.

INSERT INTO products (id, title, subtitle, language, price, badge, in_stock, image_url, tag) VALUES
  ('op15jp',       'One Piece Card Game Adventure on Kami''s Island OP-15 Booster Box',           'Japanese',   'Japanese', 129.00, 'In Stock',  TRUE,  'https://i.ibb.co/4R6DL8Vt/8cc175339fbf.webp',     'One Piece'),
  ('eb03jp',       'One Piece Card Game Extra Booster Heroines Edition EB-03',                     'Japanese',   'Japanese', 259.00, 'In Stock',  TRUE,  'https://i.ibb.co/cS1CLgXf/259dbef5f466.webp',     'One Piece'),
  ('ac1',          'One Piece Card Game Admirable Collection Vol.1 Vinsmoke Reiju AC-01',          'Japanese',   'Japanese', 279.00, 'In Stock',  TRUE,  'https://i.ibb.co/ZzmyRcFX/aac4c203bf03.webp',     'One Piece'),
  ('poke-ah',      'Pokemon TCG Mega Evolution Ascended Heroes Elite Trainer Box',                  'English',    'English',  279.00, 'In Stock',  TRUE,  'https://i.ibb.co/5WbMqZTR/41faa72453fe.jpg',      'Pokemon'),
  ('op01eng',      'One Piece Card Game Romance Dawn OP-01 Booster Box',                           'English',    'English',  850.00, 'Sold Out',  FALSE, 'https://i.ibb.co/KjvKb3Vv/28e46fc98ddd.jpg',      'One Piece'),
  ('op02eng',      'One Piece Card Game Paramount War OP-02 Booster Box',                          'English',    'English',  280.00, 'Sold Out',  FALSE, 'https://i.ibb.co/KpXHTFdw/41e98c6cdef5.webp',     'One Piece'),
  ('op03eng',      'One Piece Card Game Pillars of Strength OP-03 Booster Box',                   'English',    'English',  240.00, 'Sold Out',  FALSE, 'https://i.ibb.co/LXq6C0Lm/aea2dc1404bb.jpg',      'One Piece'),
  ('op04eng',      'One Piece Card Game Kingdoms of Intrigue OP-04 Booster Box',                  'English',    'English',  190.00, 'Sold Out',  FALSE, 'https://i.ibb.co/Lhb11tSC/a403f77df496.jpg',      'One Piece'),
  ('op05eng',      'One Piece Card Game Awakening of the New Era OP-05 Booster Box',              'English',    'English',  650.00, 'Sold Out',  FALSE, 'https://i.ibb.co/GQvCdfp6/c9dc9e2d68a2.webp',     'One Piece'),
  ('op06eng',      'One Piece Card Game Wings of the Captain OP-06 Booster Box',                  'English',    'English',  210.00, 'Sold Out',  FALSE, 'https://i.ibb.co/7dG2qR3T/44485c447433.webp',     'One Piece'),
  ('op07eng',      'One Piece Card Game 500 Years in the Future OP-07 Booster Box',               'English',    'English',  180.00, 'Sold Out',  FALSE, 'https://i.ibb.co/wZJ5LnbW/afee0c241bd8.webp',     'One Piece'),
  ('op08eng',      'One Piece Card Game Two Legends OP-08 Booster Box',                           'English',    'English',  150.00, 'Sold Out',  FALSE, 'https://i.ibb.co/WpgmFXMS/98764cd9d974.jpg',      'One Piece'),
  ('op09eng',      'One Piece Card Game Emperors in the New World OP-09 Booster Box',             'English',    'English',  150.00, 'Sold Out',  FALSE, 'https://i.ibb.co/KzxPHrXd/93fa23eebfe9.avif',     'One Piece'),
  ('op10eng',      'One Piece Card Game Royal Blood OP-10 Booster Box',                           'English',    'English',  140.00, 'Sold Out',  FALSE, 'https://i.ibb.co/tTGLk1Hk/30cfe42bbb8e.webp',     'One Piece'),
  ('op11eng',      'One Piece Card Game A Fist of Divine Speed OP-11 Booster Box',                'English',    'English',  140.00, 'Sold Out',  FALSE, 'https://i.ibb.co/BVgRgKMv/64df998b3578.jpg',      'One Piece'),
  ('op12eng',      'One Piece Card Game Legacy of the Master OP-12 Booster Box',                  'English',    'English',  135.00, 'Sold Out',  FALSE, 'https://i.ibb.co/KcQ3VB8s/ba4a3a57ef4b.webp',     'One Piece'),
  ('op13eng',      'One Piece Card Game Carrying on His Will OP-13 Booster Box',                  'English',    'English',  135.00, 'Sold Out',  FALSE, 'https://i.ibb.co/1xvX6R8/c04d97987fe7.webp',      'One Piece'),
  ('op14eng',      'One Piece Card Game The Azure Sea''s Seven OP-14 Booster Box',                'English',    'English',  130.00, 'Sold Out',  FALSE, 'https://i.ibb.co/q3Y2y816/e1d736d3aa3f.webp',     'One Piece'),
  ('eb01eng',      'One Piece Card Game Extra Booster Memorial Collection EB-01',                  'English',    'English',  140.00, 'Sold Out',  FALSE, 'https://placehold.co/400x560/0d0020/555555?text=Photo+Soon', 'One Piece'),
  ('eb02eng',      'One Piece Card Game Extra Booster Anime 25th Collection EB-02',               'English',    'English',  300.00, 'Sold Out',  FALSE, 'https://placehold.co/400x560/0d0020/555555?text=Photo+Soon', 'One Piece'),
  ('prb01eng',     'One Piece Card Game Premium Best Collection PRB-01',                           'English',    'English',  200.00, 'Sold Out',  FALSE, 'https://placehold.co/400x560/0d0020/555555?text=Photo+Soon', 'One Piece'),
  ('prb02eng',     'One Piece Card Game Premium Best Collection Vol.2 PRB-02',                    'English',    'English',  250.00, 'Sold Out',  FALSE, 'https://placehold.co/400x560/0d0020/555555?text=Photo+Soon', 'One Piece'),
  ('acc-kmc-inner',    'KMC Perfect Fit Inner Sleeves (100pk)',             'Accessories', 'English',    8.00, 'In Stock',  TRUE,  'https://placehold.co/400x560/070014/22d3ee?text=KMC+Perfect+Fit',        'Accessories'),
  ('acc-dragon-matte', 'Dragon Shield Matte Black Sleeves (100pk)',         'Accessories', 'English',   12.00, 'In Stock',  TRUE,  'https://placehold.co/400x560/070014/a855f7?text=Dragon+Shield+Matte',    'Accessories'),
  ('acc-playmat-op',   'One Piece TCG Official Playmat — Luffy vs Kaido',  'Accessories', 'English',   45.00, 'In Stock',  TRUE,  'https://placehold.co/400x560/070014/f97316?text=OPTCG+Playmat',          'Accessories'),
  ('acc-dice-set',     'TCG Damage Counter Dice Set (20pcs)',               'Accessories', 'English',   15.00, 'In Stock',  TRUE,  'https://placehold.co/400x560/070014/facc15?text=Dice+%26+Counter+Set',   'Accessories')
ON CONFLICT (id) DO NOTHING;

-- ── Supabase Storage buckets ──────────────────────────────────────────────────
-- Creates public buckets for card/product images uploaded via admin panel.
-- Run AFTER applying this migration.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('singles',   'singles',   true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp']),
  ('preorders', 'preorders', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp']),
  ('products',  'products',  true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on all image buckets
CREATE POLICY "Public read singles"   ON storage.objects FOR SELECT USING (bucket_id = 'singles');
CREATE POLICY "Public read preorders" ON storage.objects FOR SELECT USING (bucket_id = 'preorders');
CREATE POLICY "Public read products"  ON storage.objects FOR SELECT USING (bucket_id = 'products');
-- Allow anon uploads (admin panel uses anon key)
CREATE POLICY "Anon upload singles"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'singles');
CREATE POLICY "Anon upload preorders" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'preorders');
CREATE POLICY "Anon upload products"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');

-- ── Fix: seed default video_id into config table ──────────────────────────────
-- Without this row the admin homepage tab fires 406 on every load.
INSERT INTO config (key, value) VALUES ('video_id', 'OcLL44cDh7k')
ON CONFLICT (key) DO NOTHING;

INSERT INTO config (key, value) VALUES ('po_close_date', '2026-04-30T23:59:59')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE config DISABLE ROW LEVEL SECURITY;
