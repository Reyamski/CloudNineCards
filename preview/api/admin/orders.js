/**
 * /api/admin/orders — admin PATCH for the `orders` table.
 *
 * PATCH  → { id, patch }   → update status / payment_status / confirmed_at etc.
 *
 * No POST/DELETE — orders are created by the cart RPC and never hard-deleted
 * from the admin UI. (Cancellation is a status change, not a row removal.)
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

export default makeAdminTableHandler({ table: 'orders', methods: ['PATCH'] });
