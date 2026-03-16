# Project State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Customers can order TCG products with clear CAD pricing and the owner can confirm paid orders before stock is deducted.
**Current focus:** Production Vercel storefront is live, admin is connected to Supabase, and the pending-order workflow is active.

## Current Position

Phase: 2 of 3  
Status: Live and operational  
Last activity: 2026-03-17 - added pending order confirmation flow, live modal stock refresh, image fallbacks, and in-stock-driven New Arrivals

Progress: [█████████░] 90%

## Accumulated Context

### Decisions

- Vercel `preview/` app is the real production app
- Hydrogen workspace is legacy/stale, not current production
- Supabase is the source of truth for stock, homepage video config, and on-hand pending orders
- On-hand orders should not deduct stock immediately on submit
- Stock only decreases when the owner confirms the order in `/admin`
- External image hosts are unreliable on some devices/networks, so local fallbacks are now in place

### Deployment

- Live Vercel URL: `https://cloud-nine-cards.vercel.app`
- Public working URL: `https://www.cloudninecards.ca`
- Root domain: `https://cloudninecards.ca` may still vary by ISP cache, but DNS configuration is now correct
- GitHub: `https://github.com/Reyamski/CloudNineCards`
- Latest shipped work includes commits through `dda62411`

### Database

- Supabase project: `fxbrjlzgczwxeiiraudy.supabase.co`
- Tables in active use:
  - `stock`
  - `config`
  - `orders`
- Orders schema lives in `scripts/supabase-orders-schema.sql`

### Live Features Confirmed

- `/admin` stock updates reflect on `/shop`
- New on-hand orders save as pending
- Admin shows pending orders
- `Confirm Order` deducts stock
- Buy modal refreshes live stock before order submit
- New Arrivals now reflects actual in-stock products
- Favicon updated to Cloud Nine Cards logo
- Remote image failures fall back to a local placeholder

## Pending Tasks

- [ ] Consider localizing critical product images instead of relying on third-party hosts
- [ ] Add richer admin order states if needed (cancelled / shipped / paid)
- [ ] Decide whether Hydrogen should be retired, archived, or kept for future use
- [ ] Wait for any remaining ISP DNS caches on `cloudninecards.ca` to expire naturally

## Blockers / Concerns

- Some users may still hit stale ISP DNS cache on the root domain
- Third-party image hosts can still fail, though cards now have safe fallback images

## Session Continuity

Last session: 2026-03-17  
Stopped at: Handoff + memory refresh after live storefront fixes and pending-order workflow rollout  
Resume file: None
