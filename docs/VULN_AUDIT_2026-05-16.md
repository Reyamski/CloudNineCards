# Vulnerability Audit — cloudninecards.ca — 2026-05-16

Manual Playwright + REST probe sweep against live prod (deploy `c7a4d36b` + F1/F4 hotfix). Subagents org-blocked this session; done in main thread.

## Verdict

Core data-security is solid (no theft, no privilege escalation, no secret leak). Two classes of real issues remain: a brute-forceable admin gate (HIGH) and unauthenticated mutation RPCs that enable inventory/order griefing (MEDIUM). Neither lets an attacker read other users' data or gain admin — they're integrity/abuse risks, not confidentiality breaches.

## ✅ Confirmed secure

- Anon table writes: `orders`, `order_items`, `singles`, `products`, `preorders`, `config`, `stock`, `profiles`, `subscribers`, `waitlist` → all **401**.
- Anon reads RLS-scoped: `orders`/`order_items`/`profiles`/`subscribers`/`waitlist` → **0 rows**. Catalog (`singles`/`products`/`preorders`/`config`/`stock`) public-read by design.
- Admin endpoints: no-token / fake-token / no-token-PATCH → all **401**.
- Bundle: no `service_role` / `sb_secret_` / `cnc2026` strings.
- CORS: `/api/*` returns `ACAO: https://cloudninecards.ca` even when `Origin: evil.example.com` — correctly scoped.
- `config` anon-readable but contents are non-sensitive (`video_id`, `po_close_date`).
- Auth errors generic ("Invalid password.") — no account enumeration.
- F5 anti-forgery: forged `status`/`payment_status`/`customer_user_id` overwritten server-side in `submit_cart_orders_v2`.

## 🔴 HIGH-1 — Admin gate brute-forceable

`/api/admin-auth` has no rate-limiting / lockout / backoff. Admin password `cnc2026` is short and guessable. A successful guess yields a session token that the entire `/api/admin/*` surface trusts (service-role-backed → full read/write on all tables, bypasses RLS).

**Fix (do both):**
1. Set a strong `ADMIN_PASSWORD` (20+ random chars) in Vercel + local `.env`. Combine with the pending F12 `ADMIN_SESSION_SECRET` rotation.
2. Add rate-limiting to `preview/api/admin-auth.js`: e.g., in-memory (or Upstash/KV) counter keyed by IP — max 5 failed attempts / 15 min, then 429 with exponential backoff. Minimum viable: a simple per-IP sliding window in the serverless function (note: serverless memory is per-instance; for real protection use Vercel KV / Upstash Redis).

## 🟡 MEDIUM-1 — `decrement_item_stock` anon-abusable

Anon can call it with any real `item_id` + arbitrary `qty` → zero out any product's stock (inventory denial-of-service / competitor griefing).

## 🟡 MEDIUM-2 — `restore_item_stock` anon-abusable

Anon can inflate any item's stock → sold-out items become buyable again → oversell, fulfillment chaos.

## 🟡 MEDIUM-3 — `mark_order_stock_check_failed` anon-abusable

Anon can flip any `awaiting_payment`/`pending` order to `stock_check_failed`. Mitigated by: random v4 order UUIDs (hard to enumerate) + status guard (can't touch confirmed/paid orders) + admin visibility. Still an unauthenticated state mutation.

### Root cause for MEDIUM 1-3

Wave 3c moved writes behind SECURITY DEFINER RPCs and GRANTed EXECUTE to `anon` because, post-RLS, the anon-key cart flow still needs to touch stock. But the RPCs themselves do no caller-legitimacy check — anyone with the (bundled, public) anon key can invoke them directly, not just the cart UI.

### Recommended fix — fold stock mutation into the order RPC, revoke standalone grants

The cleanest model: stock changes should only ever happen as a side-effect of a verified order action, never as a free-standing anon call.

1. **Move the decrement INTO `submit_cart_orders_v2`** (it already runs SECURITY DEFINER and constructs the order). After inserting order + items, decrement stock for in-stock lines in the same function/transaction. Then `REVOKE EXECUTE ON FUNCTION decrement_item_stock(...) FROM anon;` — keep it for `service_role`/admin reconciliation only.
2. **`restore_item_stock`** — only the admin "payment_rejected" path calls it (frontend → but the actual privileged work should move server-side). Better: add a GET-less `/api/admin/reject-order` endpoint that, with the admin token + service-role, both PATCHes the order and restores stock atomically. Then `REVOKE EXECUTE ... FROM anon` on `restore_item_stock`.
3. **`mark_order_stock_check_failed`** — only `submit_cart_orders_v2`'s own failure path needs it; inline that logic into the submit RPC's exception handler and `REVOKE EXECUTE ... FROM anon`.

After this, NO stock/order-status mutation RPC is anon-callable; all paths go through either the verified submit RPC or the admin service-role API.

SQL skeleton: `docs/vuln-rpc-hardening.sql` (written alongside this report — review the inline plan before running; it requires the corresponding CartPage/AdminPage code changes to ship first, same pattern as the F2/F4 sequencing).

## Already tracked (non-blocking, prior backlog)

- F3 — enable Supabase Auth "Confirm email" (signup hardening; blocks email-collision order disclosure)
- F12 — rotate `ADMIN_SESSION_SECRET` (exposed in chat transcript)

## Priority order

1. **HIGH-1** admin password + rate-limit — single biggest exposure, do first
2. F12 secret rotation (pairs with #1)
3. MEDIUM-1/2/3 RPC hardening (needs code + SQL co-deploy, same careful sequencing as Wave 3c)
4. F3 email confirm toggle

## Not in scope

The shared Supabase also hosts the One Piece deck-builder project (`cards`, `decks`, `games`, `player_*`, `user_collection`). Their RLS is independent and was not audited here.
