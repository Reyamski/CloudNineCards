/**
 * /api/admin/preorders — admin CRUD for the `preorders` table.
 *
 * POST   → insert
 * PATCH  → { id, patch }   → update (only allow-listed columns are written)
 * DELETE → { id }          → delete
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

// preorders.id is the primary key. It is never in this allow-list so it
// cannot be mutated through PATCH.
const ALLOWED = new Set([
  'title', 'subtitle', 'sold_out', 'price_tba', 'price', 'php_price',
  'usd_price', 'aud_price', 'eur_price', 'currency', 'eta', 'deadline',
  'image_url', 'hype', 'notes', 'display_order',
]);

function whitelistPatch(patch) {
  const out = {};
  for (const k of Object.keys(patch || {})) {
    if (!ALLOWED.has(k)) continue;
    let v = patch[k];
    if (k === 'price' || k === 'php_price' || k === 'usd_price' || k === 'aud_price' || k === 'eur_price') {
      v = v === '' || v == null ? null : Number(v);
    } else if (k === 'display_order') {
      v = Number(v) || 0;
    } else if (k === 'sold_out' || k === 'price_tba') {
      v = !!v;
    }
    out[k] = v;
  }
  return out;
}

export default makeAdminTableHandler({ table: 'preorders', transformPatch: whitelistPatch });
