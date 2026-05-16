/**
 * /api/admin/products — admin CRUD for the `products` table.
 *
 * POST   → insert
 * PATCH  → { id, patch }   → update
 * DELETE → { id }          → delete
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

export default makeAdminTableHandler({ table: 'products' });
