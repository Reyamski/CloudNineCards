/**
 * /api/admin/singles — admin CRUD for the `singles` table.
 *
 * POST   → insert
 * PATCH  → { id, patch }   → update
 * DELETE → { id }          → delete
 *
 * All methods require a valid bearer token (see /api/admin-auth).
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

export default makeAdminTableHandler({ table: 'singles' });
