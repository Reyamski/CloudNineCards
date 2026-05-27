/**
 * /api/admin/singles — admin CRUD for the `singles` table.
 *
 * POST   → insert
 * PATCH  → { id, patch }   → update (only allow-listed columns are written)
 * DELETE → { id }          → delete
 *
 * All methods require a valid bearer token (see /api/admin-auth).
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

// Allow-listed columns the admin UI is permitted to PATCH on a singles row.
// Any other key is silently dropped to keep the write surface tight (extra
// hardening on top of the bearer-token check).
const ALLOWED = new Set([
  'card_name', 'set_name', 'set_code', 'card_number', 'game', 'language',
  'condition', 'rarity', 'price', 'php_price', 'stock', 'in_stock', 'image_url',
  'updated_at',
]);

function whitelistPatch(patch) {
  const out = {};
  for (const k of Object.keys(patch || {})) {
    if (!ALLOWED.has(k)) continue;
    let v = patch[k];
    if (k === 'price' || k === 'php_price') v = v === '' || v == null ? null : Number(v);
    else if (k === 'stock') v = Number(v) || 0;
    else if (k === 'in_stock') v = !!v;
    out[k] = v;
  }
  return out;
}

export default makeAdminTableHandler({ table: 'singles', transformPatch: whitelistPatch });
