/**
 * /api/admin/products — admin CRUD for the `products` table.
 *
 * POST   → insert
 * PATCH  → { id, patch }   → update (only allow-listed columns are written)
 * DELETE → { id }          → delete
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

// products.id is the primary key (string slug like "op15jp"). It is never
// included in this allow-list so it cannot be mutated through PATCH.
const ALLOWED = new Set([
  'title', 'subtitle', 'language', 'price', 'usd_price', 'aud_price',
  'eur_price', 'stock', 'badge', 'in_stock', 'image_url', 'tag',
]);

function whitelistPatch(patch) {
  const out = {};
  for (const k of Object.keys(patch || {})) {
    if (!ALLOWED.has(k)) continue;
    let v = patch[k];
    if (k === 'price' || k === 'usd_price' || k === 'aud_price' || k === 'eur_price') {
      v = v === '' || v == null ? null : Number(v);
    } else if (k === 'stock') {
      v = Number(v) || 0;
    } else if (k === 'in_stock') {
      v = !!v;
    }
    out[k] = v;
  }
  return out;
}

export default makeAdminTableHandler({ table: 'products', transformPatch: whitelistPatch });
