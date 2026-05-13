-- Run this in Supabase SQL Editor
-- Creates the singles table for individual card listings

CREATE TABLE IF NOT EXISTS singles (
  id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  card_name    TEXT          NOT NULL,
  set_name     TEXT          NOT NULL,
  set_code     TEXT,                          -- e.g. 'OP-01', 'SV08'
  card_number  TEXT,                          -- e.g. 'OP01-001', '001/198'
  game         TEXT          NOT NULL DEFAULT 'One Piece',
  language     TEXT          NOT NULL DEFAULT 'English',
  condition    TEXT          NOT NULL DEFAULT 'NM',
  rarity       TEXT,                          -- 'Common','Uncommon','Rare','Super Rare','Secret Rare','Leader'
  price        NUMERIC(10,2) NOT NULL,
  stock        INTEGER       NOT NULL DEFAULT 1,
  in_stock     BOOLEAN       NOT NULL DEFAULT TRUE,
  image_url    TEXT,
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- Disable RLS (same pattern as other CNC tables)
ALTER TABLE singles DISABLE ROW LEVEL SECURITY;

-- Optional: index for common filter queries
CREATE INDEX IF NOT EXISTS singles_game_idx      ON singles (game);
CREATE INDEX IF NOT EXISTS singles_in_stock_idx  ON singles (in_stock);

-- Sample data to get started
INSERT INTO singles (card_name, set_name, set_code, card_number, game, language, condition, rarity, price, stock) VALUES
  ('Monkey D. Luffy',   'Romance Dawn',    'OP-01', 'OP01-060', 'One Piece', 'English',  'NM', 'Secret Rare', 85.00, 2),
  ('Roronoa Zoro',      'Romance Dawn',    'OP-01', 'OP01-001', 'One Piece', 'English',  'NM', 'Leader',       25.00, 5),
  ('Nami',              'Paramount War',   'OP-02', 'OP02-001', 'One Piece', 'Japanese', 'LP', 'Super Rare',   12.00, 3),
  ('Trafalgar Law',     'Pillars of Strength','OP-03','OP03-099','One Piece','English',  'NM', 'Secret Rare', 55.00, 1),
  ('Charizard ex',      'Obsidian Flames', 'OBF',   '125/197',  'Pokemon',  'English',  'NM', 'Special Rare',180.00, 1),
  ('Pikachu VMAX',      'Vivid Voltage',   'VIV',   '044/185',  'Pokemon',  'English',  'LP', 'VMAX Rare',    18.00, 4);
