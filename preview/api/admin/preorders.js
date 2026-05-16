/**
 * /api/admin/preorders — admin CRUD for the `preorders` table.
 *
 * POST   → insert
 * PATCH  → { id, patch }   → update
 * DELETE → { id }          → delete
 */
import { makeAdminTableHandler } from '../_lib/admin-route.js';

export default makeAdminTableHandler({ table: 'preorders' });
