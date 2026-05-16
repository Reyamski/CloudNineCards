# Security follow-ups backlog

Branch: `feat/security-followups`

Wave 1-3c-2 shipped + verified live. None of the items below block production. They're hardenings + nice-to-haves found during the security audit. Tackle when there's bandwidth.

## P1 — Real risk, deferred but should ship soon

### F1. `subscribers` table — newsletter still anon-insert with no policy
- File: `preview/src/pages/HomePage.jsx:71` (or wherever newsletter signup posts)
- Risk: spam INSERTs against the subscribers table. Anon can spam the table indefinitely.
- Fix: move signup through a dedicated `/api/subscribe.js` endpoint that rate-limits + dedupes by email. Then drop the `"Allow all operations..."` policy on `subscribers` and add `subscribers_select_admin_only` + `subscribers_insert_via_api_only` policies (or just no anon policy, since the endpoint uses service-role).
- Verify: anon POST to `/rest/v1/subscribers` returns 401/RLS error.

### F2. `waitlist` table — same shape as subscribers
- File: `preview/src/pages/ShopPage.jsx:34` (restock notify form)
- Same plan as F1. New endpoint `/api/waitlist.js`, drop the permit policy after migration.

### F3. Email-collision risk on `orders` SELECT
- Current policy: `lower(buyer_email) = lower(auth.email())` matches by email — so if someone signs up with a buyer's email AFTER the buyer placed an order, they retroactively see the original buyer's orders.
- Fix path: enforce email confirmation on signup. Supabase Auth has this via Auth Settings → "Confirm email" toggle.
- Alt fix: tighten the policy to `customer_user_id = auth.uid()` ONLY (drop the email fallback). But this breaks the guest-then-signed-up flow — guests who later sign up lose visibility to their pre-signup orders unless we also backfill `customer_user_id` on signup by matching email.
- Recommend: enable email confirmation in Supabase Auth dashboard + keep the dual-match policy. Combined effect: only the real email owner can claim the orders.

## P2 — Hardening / nice-to-have

### F4. Storage bucket policies — currently public-write
- Buckets `singles`, `products`, `preorders` accept anon uploads.
- Risk: anyone can upload arbitrary images to the shop's CDN (storage abuse, hosting illegal content under your bandwidth bill).
- Fix:
  - Drop public INSERT policy on `storage.objects` for these buckets.
  - Implement `/api/admin/upload` properly (the endpoint exists from Wave 3c-1, just need to wire admin UI image uploads through it instead of direct supabase-js calls).
  - Files: `preview/src/pages/AdminPage.jsx` — search for `supabase.storage.from(...)` and migrate to `adminFetch('/api/admin/upload', 'POST', formData)`.
- Verify: anon attempt to upload to storage REST returns 401.

### F5. `submit_cart_orders_v2` row-shape validation
- Currently the RPC uses `jsonb_populate_record(NULL::orders, payload)` which trusts whatever shape the client sends, including potentially malicious values for fields like `status`, `payment_status`, `customer_user_id`.
- Risk: anon caller could submit a cart with `status='confirmed'` and `payment_status='paid'` and it'd land in admin as already-paid.
- Fix: inside the RPC, explicitly overwrite security-sensitive fields:
  ```sql
  order_payload := order_payload || jsonb_build_object(
    'id', new_id,
    'created_at', now(),
    'status', 'awaiting_payment',
    'payment_status', 'awaiting_payment',
    'customer_user_id', CASE
      WHEN auth.uid() IS NOT NULL THEN auth.uid()::text
      ELSE NULL
    END
  );
  ```
- Verify: try submitting cart with `status='confirmed'` — RPC overwrites to `awaiting_payment`.

### F6. Bundle size — 820 kB JS chunk
- Pre-existing warning, no longer blocking but bad for first-load.
- Fix: add `build.rollupOptions.output.manualChunks` config in `preview/vite.config.js` to split vendor (react, react-dom, react-router) into a separate chunk.
- Or lazy-load admin route (`React.lazy(() => import('./pages/AdminPage'))`).

### F7. Mobile minor overflows
- `/account/orders` overflows ~119px at 390px viewport (header logo + tagline forces 421px)
- `/singles` filters bar ~38px overflow at 390px
- `/cart` header cluster ~26px overflow at 390px
- Pure cosmetic, but visible to mobile customers.
- Fix: shrink header logo size or hide tagline below 480px; tighten filter bar gap.

### F8. Admin "On Hand" tab — already fixed pero verify on live
- Cart-flow orders (`order_type='cart'`) now appear in On Hand tab per Wave 3c-1 fix.
- Just a verify item — visit /admin Orders tab → On Hand filter → confirm cart orders visible.

### F9. AccountLoginPage doesn't consume `?next=` redirect hint
- Wave 1 added auth gate redirect with `state.redirect` set to original page.
- AccountLoginPage always sends user to `/account/orders` after login regardless of where they were.
- Fix: read the redirect hint and route accordingly post-login.

## P3 — Bookkeeping / cosmetic

### F10. Cleanup test screenshots from repo root
- Repo root has 40+ `e2e-*.png`, `full-test-*.png`, `test-*.png` files committed accidentally.
- Add to `.gitignore` + `git rm --cached` them.

### F11. Audit `decks`/`games`/`player_*` policies (One Piece TCG project sharing this DB)
- Per memory: separate One Piece battle game project shares this Supabase. Their RLS is independent of CloudNineCards.
- Not our concern — flagged only for awareness when working in the other repo.

### F12. ADMIN_SESSION_SECRET rotation
- The secret is currently `knx8WQIZtIiA5v3mun4LUmDvNC2bR6e5CKzofuOrJ8HFKvhgkqsMoI51wWHLig1R` — included in conversation history.
- Rotation = generate new secret, update Vercel + local .env, redeploy.
- Effect: forces all current admin sessions to re-login.
- Trivial to do; user-facing impact = zero (admin reauth only).

## Suggested order

1. F3 (email confirmation) — single Supabase Auth setting toggle, 1 min
2. F12 (rotate session secret) — 5 min
3. F5 (submit_cart_orders_v2 hardening) — 15 min, SQL only
4. F4 (storage buckets) — 30 min, needs admin upload migration
5. F1 + F2 (subscribers + waitlist endpoints) — 30 min each
6. F7 (mobile overflows) — cosmetic, when bored
7. F6 (bundle splitting) — perf, when bored
8. F8/F9/F10 — bookkeeping batch

Total: 2-3 hours to fully close.

## Verification approach per item

After each fix, before marking done:
- Local build green (`cd preview && npm run build`)
- Playwright smoke on the affected surface (admin / customer flow)
- If new RLS policy: direct REST attack from anon → verify blocked

## Rollback

Each item is independently rollback-able. SQL changes have `DROP POLICY IF EXISTS` patterns. Code changes are reversible via `git revert <sha>`.
