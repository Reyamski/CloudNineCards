# CloudNineCards UX Optimization Audit

Research-only review of the live React/Vite preview app (`preview/src/`). Each item is one sentence problem, one sentence fix, and the exact file path(s) to touch. Bias is toward shippable in under a day.

---

## Top 5 high-impact, low-effort wins

1. **Shop page has no sort or price filter — only auto-sorts in-stock first, hidden from the user.**
   Add a `<select>` with Price asc/desc, Name A–Z, Newest (mirror the `SORTS` array already used in `SinglesPage.jsx` lines 20–25) and run it in the existing `.sort()` chain.
   File: `E:\AI\shopify-tcg-store\preview\src\pages\ShopPage.jsx` (sort/filter block lines 751–757, render around line 819).

2. **Auth gate forces login *before* the user can even open the buy modal or product detail — kills first-touch conversion.**
   Allow `/shop/:id` and the BuyNowModal to render anonymously; only require login at the "Submit Order" step, prefilling email from the form (auth gate currently in `ShopPage.jsx` line 687 `openProduct` and `SinglesPage.jsx` line 513 `handleBuy`).
   Files: `E:\AI\shopify-tcg-store\preview\src\pages\ShopPage.jsx`, `E:\AI\shopify-tcg-store\preview\src\pages\SinglesPage.jsx`, `E:\AI\shopify-tcg-store\preview\src\pages\PreOrdersPage.jsx` (line 965).

3. **Product detail page is hardcoded against the `allProducts` static array — DB-added products 404 their detail URL.**
   Replace `allProducts.find()` with a Supabase fetch on `products` table (matches the pattern already used in `ShopPage.jsx` lines 726–731) so admin-created items have real PDPs.
   File: `E:\AI\shopify-tcg-store\preview\src\pages\ProductPage.jsx` (line 12).

4. **Singles grid renders 5 columns of full-resolution imgbb images at 340px tall with no `loading="lazy"` — slow LCP and scroll jank on mid-range phones.**
   Add `loading="lazy"` and `decoding="async"` to the card images, and a `width`/`height` attr to reserve layout space.
   Files: `E:\AI\shopify-tcg-store\preview\src\pages\SinglesPage.jsx` (line 399), `E:\AI\shopify-tcg-store\preview\src\pages\ShopPage.jsx` (line 865), `E:\AI\shopify-tcg-store\preview\src\pages\PreOrdersPage.jsx` (line 926).

5. **The `BuyNowModal` has 4 steps with shipping/currency/Wise QR all on step 1 and a separate buyer-info step — long scroll, no progress indicator, easy to abandon.**
   Add a 2-dot step indicator at the top and collapse the "Terms" + "Steps" + "Wise handle" blocks into a single expandable summary so the price/destination/CTA fit above the fold.
   File: `E:\AI\shopify-tcg-store\preview\src\pages\ShopPage.jsx` (BuyNowModal lines 95–550).

---

## Medium wins — sorting, filtering, search, browse

- **No global product search on Shop page.** Add the same `Search` input pattern from `SinglesPage.jsx` lines 561–566; filter on `title`, `subtitle`, `tag`. — `ShopPage.jsx` line 806.
- **Singles sort defaults to `price_asc` which puts all "$0 TBD" placeholders first; looks broken.** Default to `newest`, or push price=0 to the end of the price sort. — `SinglesPage.jsx` line 462 and 505.
- **Game filter pills on Shop only support 5 hardcoded tags ("All", "One Piece", "Dragon Ball", "Pokemon", "Pre-orders", "Accessories"); Yu-Gi-Oh!/Union Arena are absent though Singles has them.** Sync the games list across pages and source from a constant or DB. — `ShopPage.jsx` line 41 vs `SinglesPage.jsx` line 17.
- **No price-range filter on Singles** (the user actually offers cards ranging from $0 to $850-class boxes — a $10–$50 slider would help). Add a min/max price input inside the existing filters panel. — `SinglesPage.jsx` lines 573–614.
- **`filtered.length` count is the only result feedback; no pagination or virtualized scroll.** For now, add a "Show more" button after every 60 cards; defer real pagination until catalog grows. — `SinglesPage.jsx` line 638.
- **Active-filter chips are read-only** (lines 616–622 of `SinglesPage.jsx`) — let users click them to clear that one filter.
- **No URL state on filters** — refreshing or sharing a filtered link resets everything. Sync `gameFilter`/`langFilter`/`condFilter`/`search`/`sort` into `useSearchParams`. — `SinglesPage.jsx` lines 457–463.
- **"Pre-orders" is buried as a tag inside the Shop grid, then duplicated as a top-nav route.** Either remove the tag from Shop filters or make the pill route to `/pre-orders` instead of filtering inline. — `ShopPage.jsx` line 41 + 807.
- **Shop tag pills reset language filter (`setLangFilter('All')`) on every click** — feels buggy when narrowing. Only reset language when switching to Accessories/Pre-orders. — `ShopPage.jsx` line 808.

---

## Bigger bets — cart, reviews, recommendations

- **One-item-per-order via modal is the biggest single conversion killer.** A cart will fix multi-item orders, but the modal-based flow also breaks back-button navigation, can't be bookmarked, and shows shipping math per-item instead of once. When you add cart: persist to `localStorage`, then collapse all three modals (`ShopPage`/`SinglesPage`/`PreOrdersPage`) into one shared `<CheckoutPage>` route so country/tax/currency/Wise QR live in one place. Affected duplication: `ShopPage.jsx:94-550`, `SinglesPage.jsx:82-387`, `PreOrdersPage.jsx:181-700`.
- **No "you might also like" or related-items section on product detail.** Add a 4-tile grid below the buy button filtered by `tag === product.tag` (excluding current id). — `ProductPage.jsx` line 109.
- **Reviews section is faked with hardcoded `vouches` testimonials on the homepage** (`HomePage.tsx:62-104`). Replace with a `reviews` Supabase table you can append to from confirmed orders (status = shipped); even 10 real ones with order numbers will beat 6 anonymous quotes.
- **No "saved items" / wishlist.** Singles in particular are one-of-one — give logged-in users a heart icon that writes to a `wishlist` table; you can email them when stock returns.
- **"Notify Me" modal exists on Shop sold-out products** (`ShopPage.jsx:553-644`) — extend the same hook to Singles sold-out cards (`SinglesPage.jsx:407-411` currently has no Notify CTA).
- **Pre-order DP Calculator is a separate modal users have to discover** (`PreOrdersPage.jsx:824-828`). Inline the calculator under each pre-order card price.

---

## Quick mobile fixes

- **`Nav` desktop link bar is hidden under 768px and replaced with a hamburger** (`Nav.jsx:35`); on small phones the brand tagline `one piece · pokémon · dragon ball · shipped from canada` (line 29) wraps to 3 lines and pushes content. Drop the tagline on `< sm`.
- **Buy modal's bottom buttons on mobile sit under iOS Safari URL bar** — modal uses `items-end justify-center sm:items-center` (`ShopPage.jsx:275`) but no safe-area inset. Add `pb-[env(safe-area-inset-bottom)]`.
- **Filter button on Singles** (line 567) **is full-width on phone only when combined with search; on iOS the touch target is the 44px minimum but the chip filters (px-3 py-1, line 582) are below 44px.** Bump filter pill padding to `px-3.5 py-2` on mobile.
- **Pre-order card image is `h-[260px] object-cover`** (`PreOrdersPage.jsx:926`) — cuts off box art top/bottom on portrait phones. Use `object-contain` with a fixed bg color.
- **Shop hero has a 520px `Zoro` PNG fixed at top-right** (`ShopPage.jsx:782-789`) **— covers the page title on phones < 380px.** Hide character art below `md`: add `hidden md:block`. Same applies to Goku (`PreOrdersPage.jsx:771`), Pikachu (`SinglesPage.jsx:526`), Robin (`ContactPage.jsx:74`).
- **Country `<select>` in modals uses native dropdown with emoji flags** — works but is jarring on Android. Acceptable for now; do not invest in a custom picker.
- **Announcement bar text is `tracking-[0.18em]` uppercase 12px** (`AnnouncementBar.jsx:24`) — on a 360px phone the message clips. Reduce tracking on mobile or shorten the open-state copy.

---

## Admin-side friction — quick wins for the owner

- **Admin auth is a single password stored in `VITE_ADMIN_PASSWORD` and gated only client-side** (`AdminPage.jsx:5, 98`) — anyone reading the bundle sees it. Move to a Supabase Auth role check; not a UX issue but a security one worth bundling with the next admin pass.
- **Admin has no bulk edit** (you just reverted bulk upload). The quickest win that doesn't touch the upload pipeline is inline-editable cells for price/stock with optimistic save — the pattern exists in `editCell`/`editVal` state (line 131) but is wired field-by-field; generalize it. — `AdminPage.jsx` singles/products tables.
- **Stock decrement now hits the right tables** (per commit `ecc5989c`) but there is no "low stock" UI cue on the admin dashboard. Add a red badge when `stock <= 2`. — `AdminPage.jsx` products listing.
- **Pre-order seed data is commented out in `PreOrdersPage.jsx` lines 93–100** but still in the bundle. Move to a `docs/seed/preorders.json` or delete.
- **`STATIC_SINGLES` fallback in `SinglesPage.jsx` lines 72–79 ships placeholder cards with price = 0** when Supabase is unreachable — looks worse than an empty state. Replace with the "No cards found" UI instead.
- **CSV export of orders exists** (per commit `fdaa406e`) but no bulk status update — a "mark selected as shipped" checkbox row would save hours.
- **AI card analyzer is on Sonnet now** (commit `1a4e8942`) — confirm temperature is low and add a 30-second timeout client-side so a stuck request doesn't block the form. — `AdminPage.jsx` `_runAnalyzeUpload` line 228.
- **Image uploads go through `/api/analyze-card` which also uploads to imgbb** (`AdminPage.jsx:258`); there is no way to update an image without re-running AI. Add a "replace image only" button on each row.

---

## Trust signals — gaps

- **No dedicated `/shipping`, `/returns`, or `/faq` page** — terms are scattered across the BuyNowModal and PreOrderModal. Footer (`Footer.jsx`) has no policy links. Add a static `/policies` route with shipping zones, return window, and damaged-card workflow; link from footer.
- **Wise-only payment is unusual; surface it earlier on the homepage** with a 1-line "Why Wise? Lower fees vs Stripe — saves you ~3%". Currently first time most buyers see "Wise" is in the modal (`ShopPage.jsx:417`).
- **Reviews are 6 anonymous quotes on the homepage** (`HomePage.tsx:62-104`) — at minimum tag them with date and order type they already have; eventually replace with Supabase-backed reviews.
- **Contact form's "we reply within 24h" claim is unmeasured** (`ContactPage.jsx:94`). Either track and display median reply time, or soften the language.
- **No "Verified by Instagram" or social-proof link near the buy button** — `@cloudninecards` Instagram link only appears in the announcement bar and at the bottom of Shop. Put a small `@cloudninecards · 2k followers` badge near the Wise handle in the BuyNowModal.
- **No order lookup without login** — `/account/orders` requires auth. Add a public `/track?order=CNC-XXXXX&email=...` so guests who forgot to sign up can find their order.

---

## Performance

- **No image CDN transforms.** Imgbb URLs are full-size — switch to imgbb's `?width=` query (or move to Supabase Storage with `?width` transform) and serve `400w` on tiles, `800w` on detail.
- **No code splitting per route.** `App.jsx:1-15` imports all pages eagerly; admin page is ~2,260 lines and ships to every shop visitor. Convert routes to `React.lazy(() => import(...))`.
- **Framer Motion is imported on every page** — total bundle hit is meaningful. Use `LazyMotion` with `domAnimation`.
- **Live-stock query in BuyNowModal hits `stock` table on open** (`ShopPage.jsx:121-142`) but products are sourced from `products` table now (commit `3643e4af`). This may either fail silently or return stale data — verify and unify.
- **No service worker / PWA manifest** for repeat visitors. Not urgent.

---

## Accessibility & keyboard

- **Modal backdrop on Shop's BuyNowModal does not close on backdrop click** — only the X button works (compare to `SinglesPage.jsx:193` which does `onClick={onClose}` on the backdrop). Inconsistent.
- **No focus trap or `Escape` key handler** on any modal. Add `useEffect` with `keydown` listener for Escape; framer-motion alone doesn't manage focus.
- **Country/province `<select>` has white background + black text** (`ShopPage.jsx:342`) for legibility — good. But error toast `text-red-300` on red bg has poor contrast (line 535).
- **Buttons rely on `font-black uppercase tracking-[0.1em]` styling** — fine visually but `<button>` elements lack `aria-label` where they only contain icons (e.g., Wise copy button `ShopPage.jsx:432`).
- **No skip-to-content link.** Add `<a href="#main">` at top of layout.

---

## What NOT to do (anti-patterns for a TCG shop)

- **Don't add infinite scroll on Singles** — TCG buyers scan for specific cards and want to compare prices; pagination or "Show more" preserves scroll position when navigating away to a product page.
- **Don't auto-translate currency on the listing page** — a buyer scanning Singles in USD then jumping to checkout in CAD loses trust. Show CAD prices everywhere except inside checkout where the conversion is explained (you already do this — keep it that way).
- **Don't add a "deck builder" or "card database" feature** until the cart and reviews ship — every minute spent on that is time not spent on the conversion funnel, and CardMarket/TCGPlayer already do it better.
- **Don't replace the "Notify Me" waitlist with a generic newsletter** — per-product email signup is a strong differentiator for sealed-product flippers.
- **Don't gate the Pre-orders page behind login.** Pre-order browsers are top-of-funnel — currently the Reserve button gates, which is correct; do not move that gate up.
- **Don't add live chat / Intercom widget** — owner is solo-ish; an unanswered chat bubble hurts trust more than no chat at all. Keep email + contact form.
- **Don't auto-rotate hero anime character art** (Zoro/Goku/Pikachu/Robin) — they are page identifiers. Rotating them confuses returning buyers.
- **Don't switch from Wise to a generic Stripe checkout without keeping Wise as an option** — international buyers explicitly chose Wise for the lower FX cost; that is part of the brand.
- **Don't add stars/ratings to individual sealed products** — they are commoditized; reviews belong on the seller, not the box.
- **Don't show "X people are viewing this" or fake urgency banners** — TCG community is small and notices instantly; you'll lose the trust signal you currently have.

---

## Suggested execution order (solo operator, ~5 days)

1. Day 1: Sort dropdown on Shop + product detail Supabase fetch + `loading="lazy"` on all card images (items #1, #3, #4 above).
2. Day 2: Remove auth gate from product browse + add search to Shop + sync games list (#2, medium wins).
3. Day 3: Static `/policies` page + reviews from confirmed orders + Notify Me on Singles (trust + bigger bet #1).
4. Day 4: Mobile fixes (hide hero art under `md`, safe-area inset, filter pills sized up).
5. Day 5: Cart MVP — `localStorage`-backed cart, single `/checkout` route, deduplicate the three checkout modals.

Anything beyond day 5 (reviews schema, route-level code splitting, image CDN transforms, admin bulk status) is a second pass.
