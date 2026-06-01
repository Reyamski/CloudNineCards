// Survey every table for image columns and where they're hosted.
import { supa, SUPABASE_HOST } from './_supa.mjs';

const TABLES = ['singles', 'products', 'preorders', 'community_feed', 'stock', 'config'];
const looksImageCol = (c) => /img|image|photo|url|thumb|art|banner|hero|avatar|cover/i.test(c);

for (const t of TABLES) {
  const { data, error } = await supa.from(t).select('*').limit(500);
  if (error) { console.log(`${t}: ERR ${error.message}`); continue; }
  if (!data.length) { console.log(`${t}: (empty)`); continue; }
  const cols = Object.keys(data[0]).filter(looksImageCol);
  const stats = {};
  for (const r of data) for (const c of cols) {
    const v = r[c];
    if (typeof v !== 'string' || !/^https?:\/\//.test(v)) continue;
    stats[c] ??= { ibb: 0, supa: 0, other: 0 };
    if (/ibb\.co/.test(v)) stats[c].ibb++;
    else if (v.includes(SUPABASE_HOST)) stats[c].supa++;
    else stats[c].other++;
  }
  const summary = Object.entries(stats)
    .map(([c, s]) => `${c}{ibb:${s.ibb} supa:${s.supa} other:${s.other}}`)
    .join('  ') || '(no http image cols)';
  console.log(`${t}: ${data.length} rows  ${summary}`);
}
