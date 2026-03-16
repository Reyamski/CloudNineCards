# HANDOFF DOCUMENT - Cloud Nine Cards
# shopify-tcg-store

_Last updated: 2026-03-17_
_Updated by: Codex (GPT-5)_

---

## Current Truth

- **Live production app:** Vite + React on Vercel
- **Primary live URLs:** `https://www.cloudninecards.ca` and `https://cloud-nine-cards.vercel.app`
- **Root domain:** `https://cloudninecards.ca` is configured correctly in Vercel/Shopify, but some ISPs still cache old Shopify DNS answers
- **Shopify Hydrogen:** legacy/stale workspace only, not current production path
- **Database:** Supabase is now active for live stock, admin updates, homepage video config, and pending on-hand orders
- **Admin URL:** `/admin`
- **Admin password:** `REDACTED_ADMIN_PASS`

## Store Info

- **Store:** Cloud Nine Cards
- **Domain:** `cloudninecards.ca`
- **Market:** Canada (Vancouver BC)
- **Products:** One Piece TCG + Pokemon TCG sealed products
- **GitHub:** `https://github.com/Reyamski/CloudNineCards`
- **Vercel project:** `cloud-nine-cards`
- **Supabase project:** `fxbrjlzgczwxeiiraudy.supabase.co`

## Working Directory

```txt
C:/Users/Reyam/Downloads/AI/shopify-tcg-store/
```

Important paths:

- `preview/src/pages/ShopPage.jsx` - live on-hand shop page
- `preview/src/pages/PreOrdersPage.jsx` - live pre-orders page
- `preview/src/pages/AdminPage.jsx` - live admin stock/order dashboard
- `preview/src/pages/NewArrivalsPage.jsx` - live new arrivals, now synced to real in-stock items
- `preview/src/HomePage.tsx` - live homepage
- `preview/src/lib/supabase.js` - Supabase client wiring
- `preview/public/cnc-logo.png` - browser favicon source
- `preview/public/product-fallback.svg` - local fallback when external image hosts fail
- `scripts/supabase-orders-schema.sql` - SQL for `orders` table
- `preview/.env` - local env reference

## Production Architecture

### Active app

- `preview/` is the production app and current source of truth
- Vercel auto-deploys from GitHub `main`
- The owner uses the live admin page for stock updates

### Legacy app

- `hydrogen-quickstart/` exists in the repo but is no longer the active production deployment
- Do not assume Hydrogen/Oxygen is live
- If future work is for the real website, prioritize `preview/` unless the owner explicitly asks to revive Hydrogen

## Current Product State

### On-hand products

22 products remain in the catalog.

Current in-stock SKUs:

- `op15jp`
- `eb03jp`
- `ac1`
- `poke-ah`

Stock is no longer hardcoded operationally. Final live stock now comes from Supabase `stock` rows and can change through `/admin`.

Image state:

- Most products use `i.ibb.co`
- Some sold-out products still use `placehold.co`
- One image uses `.avif`
- Because some users/networks fail to load these external hosts/formats, the app now falls back to `/product-fallback.svg` instead of showing broken images

### Pre-orders

Pre-orders remain hardcoded in `preview/src/pages/PreOrdersPage.jsx`.

Current entries:

- `op17eng` - sold out
- `op16eng` - sold out
- `op16jp` - sold out
- `op17jp` - price TBA

### Homepage

- OP-17 JP teaser banner is still present and should not be removed
- Homepage video is now admin-configurable through Supabase `config`

### New Arrivals

- `preview/src/pages/NewArrivalsPage.jsx` was updated to show the products that are actually in stock
- It reads live stock from Supabase and filters to active in-stock items only

## Admin + Order Workflow

### Working admin features

- Manual stock editing
- Mark in stock / sold out
- Save homepage YouTube video
- View pending on-hand orders
- Confirm on-hand orders

### On-hand order flow

New live behavior:

1. Buyer submits an on-hand order from `/shop`
2. Order is saved to Supabase `orders` table with status `pending`
3. Stock does **not** decrease yet
4. Order appears in `/admin`
5. Owner clicks `Confirm Order`
6. Only then does stock decrease in Supabase `stock`
7. Shop reflects updated quantity

This was added to avoid deducting stock before payment is actually confirmed.

### Important note

- Old orders submitted before the `orders` table workflow was added will not magically appear in admin
- Only new orders after the feature rollout are tracked there

## Supabase

### Active tables in use

- `stock`
- `config`
- `orders`

### `orders` schema

Created via:

- `scripts/supabase-orders-schema.sql`

Used for:

- pending on-hand orders
- confirmed on-hand orders
- stock deduction on confirmation

## Shipping / Tax / Payment Logic

- Shipping origin: Vancouver BC, Canada
- `WEIGHT_PER_BOX = 1.91kg`
- Free shipping for Canada orders >= CAD $300
- Province tax shown as label, not raw percentage
- Wise handle: `@cloudninecards`
- EmailJS still sends order emails for both owner and buyer copy

## Env / Integrations

### Vercel env vars now expected live

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_EMAILJS_PRIVATE_KEY`
- `VITE_EMAILJS_TEMPLATE_ONHAND`
- `VITE_EMAILJS_TEMPLATE_PREORDER`

### EmailJS

- Service: `service_495o229`
- On-hand template: `template_3ickzxu`
- Pre-order template: `template_cp3un7s`
- Public key: `REDACTED_EMAILJS_PUBLIC`

## Domain / DNS Status

### Current status

- `www.cloudninecards.ca` is working on Vercel
- `cloud-nine-cards.vercel.app` is working on Vercel
- `cloudninecards.ca` itself is correctly configured but may still show the old site on some ISP caches

### Shopify DNS intended state

- `A @ -> 216.198.79.1`
- `CNAME www -> cname.vercel-dns.com`
- no `AAAA @`

### Important diagnosis already confirmed

- Public resolver `1.1.1.1` returned the correct Vercel IP for root
- Some local ISP resolvers still returned old Shopify answers
- This means the root-domain issue is now mostly ISP cache propagation, not app config

## Recent Git / Deploy Milestones

Recent live commits pushed to `main`:

- `cea8543e` - surface Supabase sync errors in preview admin and shop
- `5aa3d42c` - update preview favicon to Cloud Nine Cards logo
- `f7f593f4` - add pending order confirmation workflow
- `71000d29` - refresh live stock in buy modal
- `8285ea4c` - improve shipping select readability
- `fd0970c8` - add local fallback for remote product images
- `dda62411` - sync new arrivals with live in-stock products

## Current Known Issues

- Some users may still see old root-domain content on `cloudninecards.ca` because of ISP DNS cache
- Some remote image hosts can fail on specific devices/networks, but fallback images now prevent broken cards
- Product source images are still externally hosted; localizing them later would be more reliable

## Next Suggested Steps

- Localize critical product images into project/Vercel-hosted assets if external host reliability becomes a bigger issue
- Add richer order management to admin if needed:
  - cancel order
  - mark paid / shipped
  - search / filter orders
- Optionally add pre-order tracking into admin as a separate workflow

## Resume Instructions For Any AI

1. Read this file first
2. Treat `preview/` as the active production app
3. Check `preview/src/pages/AdminPage.jsx` and `preview/src/pages/ShopPage.jsx` before changing stock/order logic
4. Check `scripts/supabase-orders-schema.sql` before proposing DB changes
5. Verify latest deployed state from Vercel GitHub `main`
6. If user reports root-domain inconsistency, remember ISP cache was already confirmed as a real factor

## Rules For Future AI Work

- Do not assume Hydrogen is live
- For production website changes, prioritize `preview/`
- Do not remove the OP-17 JP teaser banner unless explicitly asked
- Keep province tax labels human-readable
- Preserve the pending-order -> confirm-order stock workflow
- Update `HANDOFF.md`, `.planning/STATE.md`, and external project memory after major changes
