# Project State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Customers can order TCG products with clear CAD pricing and the owner can confirm paid orders before stock is deducted.
**Current focus:** Auth schema designed for customer accounts. Branch `feature/user-auth-schema` is ready for implementation. Security hardened — .env untracked from git.

## Current Position

Phase: 2 of 3
Status: Live and operational — auth schema phase starting
Last activity: 2026-03-19 - removed hardcoded secrets, untracked .env from git; auth/account schema fully designed on `feature/user-auth-schema`

Progress: [█████████░] 90%

## Accumulated Context

### Decisions

- Vercel `preview/` app is the real production app
- Hydrogen workspace is legacy/stale, not current production
- Supabase is the source of truth for stock, homepage video config, and on-hand pending orders
- On-hand orders should not deduct stock immediately on submit
- Stock only decreases when the owner confirms the order in `/admin`
- External image hosts are unreliable on some devices/networks, so local fallbacks are now in place
- Homepage spotlight should show in-stock products only
- Homepage stock cards now deep-link to `/shop?product=...`
- New standard workflow is branch first, local QA/build first, push branch first, then `main` only after approval
- .env is now gitignored — secrets live only in Vercel env vars and local .env

### Deployment

- Live Vercel URL: `https://cloud-nine-cards.vercel.app`
- Public working URL: `https://www.cloudninecards.ca`
- Root domain: `https://cloudninecards.ca` may still vary by ISP cache, but DNS configuration is now correct
- GitHub: `https://github.com/Reyamski/CloudNineCards`
- Latest shipped commit: `6d92808e` (security: remove hardcoded secrets and untrack .env)
- Current branch: `feature/user-auth-schema` — not yet merged to main

### Database

- Supabase project: `fxbrjlzgczwxeiiraudy.supabase.co`
- Tables in active use:
  - `stock`
  - `config`
  - `orders`
- Orders schema: `scripts/supabase-orders-schema.sql`
- Auth/account schema (pending SQL run): `scripts/supabase-customer-auth-schema.sql`
- Schema doc: `docs/AUTH_ACCOUNT_SCHEMA.md`

### Auth Schema (designed, not yet applied)

New tables to create in Supabase:
- `public.customer_profiles` — one row per auth.users account
- `public.customer_addresses` — saved shipping/billing addresses per customer

New columns to add to `public.orders`:
- `customer_id`, `customer_email`, `account_order`
- `payment_status` (awaiting_payment / payment_submitted / payment_verified / payment_rejected)
- `fulfillment_status`, payment timestamps, `payment_notes`, `cancelled_at`, `updated_at`

MVP build order (from `docs/AUTH_ACCOUNT_SCHEMA.md`):
1. Run `scripts/supabase-customer-auth-schema.sql` in Supabase dashboard
2. Add signup/login UI
3. Auto-create `customer_profiles` on signup
4. Add account page with order history
5. Attach logged-in orders to `customer_id`

### Live Features Confirmed

- `/admin` stock updates reflect on `/shop`
- New on-hand orders save as pending
- Admin shows pending orders with payment verification workflow
- `Confirm Order` deducts stock
- Buy modal refreshes live stock before order submit
- New Arrivals now reflects actual in-stock products
- Favicon updated to Cloud Nine Cards logo
- Remote image failures fall back to a local placeholder
- Homepage is customer-facing again with no admin CTA exposure
- Homepage video section is restored
- Homepage stock cards are clickable and open the matching product modal from the shop route
- Admin payment verification: status columns (payment_submitted / payment_verified / payment_rejected)

## Pending Tasks

- [ ] Run `scripts/supabase-customer-auth-schema.sql` in Supabase dashboard to apply auth schema
- [ ] Build signup/login UI on `feature/user-auth-schema`
- [ ] Auto-create `customer_profiles` row on signup
- [ ] Build account page — show customer-owned orders
- [ ] Consider localizing critical product images instead of relying on third-party hosts
- [ ] Decide whether Hydrogen should be retired, archived, or kept for future use
- [ ] Add branch-preview deployment flow if a shareable QA URL is needed before production

## Blockers / Concerns

- Auth schema SQL not yet applied in Supabase — UI build is blocked until this is run
- RLS must be tightened carefully on `public.orders` before launch — current client-side inserts will conflict with account-scoped reads
- Some users may still hit stale ISP DNS cache on the root domain

## Session Continuity

Last session: 2026-03-19
Stopped at: Auth schema designed + docs written, .env secured, branch `feature/user-auth-schema` ready for UI implementation
Resume file: None
