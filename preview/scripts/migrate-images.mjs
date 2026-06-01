// Generic image migration: shrink oversized photos and move off i.ibb.co (or
// any non-Supabase http host) into the Supabase Storage `card-images` bucket.
//
// Downscales each image to fit 600×800 WebP q82 (cards/boxes display small) and
// rewrites the row's image column to the new public URL. Idempotent: rows
// already on Supabase Storage, or pointing at intentional placeholders
// (placehold.co), are skipped. Originals on the source host stay untouched.
//
// Usage:
//   node scripts/migrate-images.mjs --table=singles --test
//   node scripts/migrate-images.mjs --table=products --all
//   node scripts/migrate-images.mjs --table=preorders --all --dry
//
// Optional: --col=image_url (default), --max=600x800 (default).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { supa, SUPABASE_HOST } from './_supa.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=')[1] : d;
};
const has = (k) => process.argv.includes(`--${k}`);

const TABLE = arg('table');
const COL   = arg('col', 'image_url');
const [MAXW, MAXH] = arg('max', '600x800').split('x').map(Number);
const TEST  = has('test');
const DRY   = has('dry');
const LIMIT = TEST ? 3 : Infinity;
const BUCKET = 'card-images';

if (!TABLE) { console.error('Missing --table=<name>'); process.exit(1); }

const KB = (n) => Math.round(n / 1024);
// Hosts we must NOT migrate: already-Supabase, or intentional placeholders.
const SKIP = (u) =>
  !u || !/^https?:\/\//.test(u) || u.includes(SUPABASE_HOST) || /placehold\.co/.test(u);

async function ensureBucket() {
  const { data: buckets } = await supa.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  if (DRY) { console.log(`[dry] would create bucket ${BUCKET}`); return; }
  const { error } = await supa.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '5MB' });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(`Created public bucket ${BUCKET}`);
}

async function main() {
  await ensureBucket();

  const { data: rows, error } = await supa.from(TABLE).select(`id, ${COL}`);
  if (error) throw error;

  const todo = rows.filter((r) => !SKIP(r[COL]));
  console.log(`[${TABLE}.${COL}] ${rows.length} rows, ${todo.length} to migrate` +
    (TEST ? ` (TEST cap ${LIMIT})` : '') + (DRY ? ' [DRY]' : ''));
  if (!todo.length) { console.log('Nothing to do.'); return; }

  // Backup current URLs (append-only per table).
  if (!DRY) {
    const bp = path.join(__dirname, `image-backup-${TABLE}.json`);
    const ex = fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, 'utf8')) : {};
    for (const r of todo) if (!(r.id in ex)) ex[r.id] = r[COL];
    fs.writeFileSync(bp, JSON.stringify(ex, null, 2));
    console.log(`Backed up ${Object.keys(ex).length} URLs → image-backup-${TABLE}.json`);
  }

  let done = 0, failed = 0, before = 0, after = 0;
  for (const r of todo.slice(0, LIMIT)) {
    try {
      const res = await fetch(r[COL], { cache: 'no-store' });
      if (!res.ok) throw new Error(`download ${res.status}`);
      const src = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(src).metadata();
      const out = await sharp(src)
        .rotate()
        .resize({ width: MAXW, height: MAXH, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 })
        .toBuffer();
      before += src.length; after += out.length;

      const key = `${TABLE}/${r.id}.webp`;
      if (DRY) { console.log(`[dry] ${r.id}: ${meta.width}x${meta.height} ${KB(src.length)}→${KB(out.length)}KB`); done++; continue; }

      const up = await supa.storage.from(BUCKET).upload(key, out, { contentType: 'image/webp', upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(key);
      const upd = await supa.from(TABLE).update({ [COL]: pub.publicUrl }).eq('id', r.id);
      if (upd.error) throw upd.error;

      done++;
      console.log(`✓ ${r.id}: ${meta.width}x${meta.height} ${KB(src.length)}→${KB(out.length)}KB`);
    } catch (e) {
      failed++;
      console.warn(`✗ ${r.id}: ${e.message}`);
    }
  }

  console.log('────────────');
  console.log(`Done ${done}  Failed ${failed}` +
    (before ? `  Weight ${KB(before)}→${KB(after)}KB (${Math.round((1 - after / before) * 100)}% smaller)` : ''));
  if (TEST) console.log('TEST only — re-run with --all');
}

main().catch((e) => { console.error(e); process.exit(1); });
