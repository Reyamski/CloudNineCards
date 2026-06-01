// One-time migration: shrink oversized singles photos and move off i.ibb.co.
//
// Pulls each `singles.image_url`, downscales the raw phone photo (≈3024×4032,
// ~1.5MB) to a card-sized WebP (fit 600×800, q82, ~40-70KB), uploads to the
// Supabase Storage `card-images` bucket, and rewrites image_url to the new
// public URL. Idempotent: rows already on Supabase Storage are skipped.
//
// Usage:
//   node scripts/migrate-singles-images.mjs --test   # first 3 only, verify
//   node scripts/migrate-singles-images.mjs --all     # full batch
//   node scripts/migrate-singles-images.mjs --all --dry  # no writes, just report

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Minimal .env loader (no dotenv dep) ──────────────────────────────────
function loadEnv(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim().replace(/^["']|["']$/g, '');
    out[m[1]] = v;
  }
  return out;
}
const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const BUCKET = 'card-images';
const TABLE  = 'singles';
const TEST   = process.argv.includes('--test');
const DRY    = process.argv.includes('--dry');
const LIMIT  = TEST ? 3 : Infinity;

const supa = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const KB = (n) => Math.round(n / 1024);
const sanitize = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function ensureBucket() {
  const { data: buckets } = await supa.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  if (DRY) { console.log(`[dry] would create public bucket ${BUCKET}`); return; }
  const { error } = await supa.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(`Created public bucket ${BUCKET}`);
}

async function main() {
  await ensureBucket();

  const { data: rows, error } = await supa
    .from(TABLE)
    .select('id, card_number, card_name, image_url')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Only rows whose image still lives on ibb (or any non-Supabase http host).
  const hostOf = SUPABASE_URL.replace(/^https?:\/\//, '');
  const todo = rows.filter((r) => {
    const u = r.image_url || '';
    return /^https?:\/\//.test(u) && !u.includes(hostOf);
  });

  console.log(`Rows: ${rows.length} total, ${todo.length} need migration` +
    (TEST ? ` (TEST: capping at ${LIMIT})` : '') + (DRY ? ' [DRY RUN]' : ''));

  // Backup current URLs before any write.
  if (!DRY) {
    const backupPath = path.join(__dirname, 'singles-image-backup.json');
    const existing = fs.existsSync(backupPath) ? JSON.parse(fs.readFileSync(backupPath, 'utf8')) : {};
    for (const r of todo) if (!(r.id in existing)) existing[r.id] = r.image_url;
    fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2));
    console.log(`Backed up ${Object.keys(existing).length} original URLs → ${path.basename(backupPath)}`);
  }

  let done = 0, bytesBefore = 0, bytesAfter = 0, failed = 0;
  for (const r of todo.slice(0, LIMIT)) {
    const label = r.card_number || r.id;
    try {
      const res = await fetch(r.image_url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`download ${res.status}`);
      const srcBuf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(srcBuf).metadata();

      const outBuf = await sharp(srcBuf)
        .rotate() // respect EXIF orientation from phone photos
        .resize({ width: 600, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 })
        .toBuffer();

      bytesBefore += srcBuf.length;
      bytesAfter  += outBuf.length;

      // Key on row id — guaranteed unique + stable across re-runs. card_number
      // can be null/duplicate ("Unknown"), which would collide under upsert.
      const key = `${TABLE}/${r.id}.webp`;
      if (DRY) {
        console.log(`[dry] ${label}: ${meta.width}x${meta.height} ${KB(srcBuf.length)}KB → ${KB(outBuf.length)}KB  ${key}`);
        done++; continue;
      }

      const up = await supa.storage.from(BUCKET).upload(key, outBuf, {
        contentType: 'image/webp', upsert: true,
      });
      if (up.error) throw up.error;

      const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(key);
      const newUrl = pub.publicUrl;

      const upd = await supa.from(TABLE).update({ image_url: newUrl }).eq('id', r.id);
      if (upd.error) throw upd.error;

      done++;
      console.log(`✓ ${label}: ${meta.width}x${meta.height} ${KB(srcBuf.length)}KB → ${KB(outBuf.length)}KB`);
    } catch (e) {
      failed++;
      console.warn(`✗ ${label}: ${e.message}`);
    }
  }

  console.log('────────────');
  console.log(`Done: ${done}  Failed: ${failed}`);
  if (bytesBefore) console.log(`Weight: ${KB(bytesBefore)}KB → ${KB(bytesAfter)}KB  (${Math.round((1 - bytesAfter / bytesBefore) * 100)}% smaller)`);
  if (TEST) console.log('TEST run only — verify, then re-run with --all');
}

main().catch((e) => { console.error(e); process.exit(1); });
