// Migrate hardcoded i.ibb.co image URLs in source files: download → resize to
// WebP → upload to Supabase Storage `card-images/static/<hash>.webp` → rewrite
// every occurrence in the listed source files to the new public URL.
// Idempotent: a URL already on Supabase is left alone. Run with --dry to preview.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { supa, SUPABASE_HOST } from './_supa.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const BUCKET = 'card-images';
const KB = (n) => Math.round(n / 1024);

const FILES = [
  'src/HomePage.tsx',
  'src/data/products.js',
  'src/pages/NewArrivalsPage.jsx',
];
const URL_RE = /https:\/\/i\.ibb\.co\/[A-Za-z0-9]+\/[A-Za-z0-9._-]+/g;

// Collect unique ibb URLs across all files.
const texts = Object.fromEntries(FILES.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
const urls = [...new Set(Object.values(texts).flatMap((t) => t.match(URL_RE) || []))];
console.log(`Found ${urls.length} unique ibb URLs across ${FILES.length} files` + (DRY ? ' [DRY]' : ''));

const map = {};
let before = 0, after = 0, failed = 0;
for (const u of urls) {
  const hash = u.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
  try {
    const res = await fetch(u, { cache: 'no-store' });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const src = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(src).metadata();
    const out = await sharp(src).rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 }).toBuffer();
    before += src.length; after += out.length;
    const key = `static/${hash}.webp`;
    if (DRY) { console.log(`[dry] ${hash}: ${meta.width}x${meta.height} ${KB(src.length)}→${KB(out.length)}KB`); continue; }
    const up = await supa.storage.from(BUCKET).upload(key, out, { contentType: 'image/webp', upsert: true });
    if (up.error) throw up.error;
    map[u] = supa.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    console.log(`✓ ${hash}: ${meta.width}x${meta.height} ${KB(src.length)}→${KB(out.length)}KB`);
  } catch (e) { failed++; console.warn(`✗ ${hash}: ${e.message}`); }
}

if (!DRY && Object.keys(map).length) {
  for (const f of FILES) {
    let t = texts[f], n = 0;
    for (const [oldU, newU] of Object.entries(map)) {
      const parts = t.split(oldU); n += parts.length - 1; t = parts.join(newU);
    }
    if (n) { fs.writeFileSync(path.join(ROOT, f), t); console.log(`Rewrote ${n} URL(s) in ${f}`); }
  }
}

console.log('────────────');
console.log(`URLs ${urls.length}  Failed ${failed}` +
  (before ? `  Weight ${KB(before)}→${KB(after)}KB (${Math.round((1 - after / before) * 100)}% smaller)` : ''));
