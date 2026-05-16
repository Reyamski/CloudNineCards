# Competitor Audit — eurussshub.store

Date: 2026-05-16
Auditor: Claude (Playwright walkthrough)
Screenshots: `docs/screenshots/eurussshub/`

## Site overview

Eurusss Hub is a Philippines-based brick-and-mortar TCG/collectibles shop in Prenza, Marilao, Bulacan that runs a custom-built e-commerce site (Clerk auth, localStorage cart, multi-currency display). They sell sealed Pokemon, One Piece and Riftbound product, plus pre-orders, PSA/raw singles, and offer paid PSA/TAG/Beckett grading concierge. The vibe is "trusted local hobby store gone online" — heavy on Messenger/Facebook trust signals, manual bank-transfer payments (OTC/BPI/BDO/Maribank), and a thoughtful pre-order workflow with down-payment + allocation flows.

Stack signals: cookies `__client_uat_*` (Clerk), localStorage keys `eurusss-cart-quantities`, `eurusss-preorder-cart`, `eurusss-theme`, `eurusss-visitor-session`. Cart is fully no-auth (saved locally) — auth is only required at order submit.

## User flow walkthrough

### 1. Landing / homepage
Screenshot: `01-home-fullpage.png`, `01-home-viewport.png`

The above-the-fold gives you a lot at once: logo + "TCG - Collectibles" tagline, theme toggle, currency selector (PHP/USD/CAD/AUD/JPY/BAHT/SGD/BTC/USDT — yes, crypto), cart icon, Messenger CTA, sign-in button, and a 7-item tab nav (Home/Pre-Orders/On Hand/Cards/Grading/Tournaments/Profile). Hero: "Collect, Play, Pre-Order with Confidence" with sub-copy emphasizing fast replies, secure packaging, and a physical-store address. A live "**4 browsing now**" social-proof counter sits next to the CTA. Primary CTAs: "Shop On Hand" / "View Pre-Orders" / "Visit Store" (Google Maps link) / "Message Us" (Messenger).

Below the hero, the page stacks: trust badges (100% Legit Seller / Secure Packaging / Fast Support), an email-capture for pre-order alerts, a public voucher claim widget (auth-gated to claim, plus a private-code input for influencer/exclusive codes), a featured-product carousel, an "Upcoming tournaments" widget, a community-photos gallery (5-page carousel), an embedded **PokéBeach RSS news feed** (5 latest headlines), a 7-step "How Pre-Orders Work" explainer, a "Why Buyers Choose Us" section, and a storefront photo with "Get Directions."

What works:
- Single homepage answers every visitor type (shopper / pre-orderer / grader / tournament player / local walk-in) in under one scroll.
- 9-currency display selector — huge for a shop with international buyers.
- Live browse counter creates implicit social proof.
- Embedded TCG news feed = reason to bookmark the homepage.
- The pre-order how-it-works strip (7 numbered steps) sets expectations very clearly.

What doesn't:
- "Sign out" button shown to guests is misleading — should say "Sign in."
- A LOT of widgets above any actual product cards. First-time shopper has to scroll past 6+ sections before seeing inventory beyond the featured carousel.

### 2. Browse / catalog (On Hand)
Screenshot: `02-onhand.png`

URL: `/on-hand`. Each card has: zoom button on the image, **category tag**, **live stock badge** ("Available: 4" / "Low Stock: 2 left" / "Sold Out"), name, price, an "In cart: N" counter, a short description blurb, a "View product" link, an inline qty stepper (`-` `+`) bound to live stock max, and an inline "Add" button. Top of page: search box, sort dropdown (8 options including by stock asc/desc), category filter pills (All / Accessories / One Piece / Pokemon / Riftbound). No pagination visible — appears to be a single grid load.

What works:
- **Inline add-to-cart on the catalog tile** — you don't need to click into the PDP to buy. Big speed win.
- Live stock count on the tile, AND "In cart: N" reflecting what's already in your local cart. Very transparent.
- Eight sort options including "Stock: Low to High" — useful for FOMO-driven shoppers.
- Sold-out tiles stay visible (not hidden) and the qty stepper is properly disabled.

What doesn't:
- Sort default is "Category" which isn't great for browsing — should default to Featured.
- No image lazy-loading badge / no skeleton states visible.
- No filter by language or by price range.

### 3. Product detail page
Screenshot: `03-product-detail.png`, `03b-product-qty1.png`, `04-added-to-cart.png`

URL: `/products/{slug}`. Single-photo PDP (no gallery). Shows category tag + live stock badge + "On Hand" tag, name, price, "In cart: N" counter, description, qty stepper, **Add to Cart** (disabled until qty >= 1), **View Cart** button. There's a "Back to On Hand" breadcrumb and a "Copy or share product link" share icon.

After adding to cart, the header cart icon updates with a counter badge AND shows the running cart subtotal in PHP next to it — a nice persistent reassurance. Stock badge on the PDP refreshes immediately ("Available: 4" → "Low Stock: 3 left").

What works:
- Cart subtotal next to the cart icon is a small but high-signal UX touch.
- Live stock decrement after add — no page refresh needed.
- Share-link button = encourages buyer-to-buyer WhatsApp/Messenger forwarding.

What doesn't:
- Only one product image. No alternate angles, no card-back, no sealed-product-photo gallery.
- No related products, no cross-sells, no recently viewed.
- No reviews/ratings.

### 4. Cart + Checkout (merged)
Screenshot: `05-cart-page.png`

THIS IS THE BIG ONE. Cart is **not a drawer** — it's a full `/cart` page that doubles as the checkout. One scroll: line items, shipping form, payment method picker, receipt reference field, delivery mode picker, and submit.

Line items show: image, category tag, name, unit price, "Remaining after order: 3" stock projection, qty stepper, line total, Remove.

The shipping form is PH-specific: Country (defaulted Philippines) / Region / First+Family Name / Street / Province / City / Barangay / Postcode / Phone / Email / Notes / "Save shipping info to my profile" checkbox (disabled because guest).

The **right rail** is a sticky order summary: line items, Items count, Total, Discounted Total, **Due Now** (this terminology is reused from the pre-order workflow even for on-hand items), Discount Voucher input (auth-gated), Payment Method radios (OTC / BPI / BDO / Maribank — all manual bank rails), Receipt Reference Number text field, Mode of Delivery radios (DHL international / Store pick-up / TikTok checkout / SDD same-day Lalamove/Grab / LBC with COD shipping fee), a "must sign in before placing order" gate, **Submit Order** (auth-required), a "**Message Us**" mailto-style deeplink to Messenger with the entire cart contents pre-filled as a URL-encoded message (`m.me/Eurusss16?text=Hi%20Eurusss%20Hub!%20I%20would%20like%20to%20order%3A%0A...`), a "send receipt to FB after checkout" reminder, and a Clear Cart button.

What works:
- **Merged cart+checkout on one page** removes a click. For low-volume sellers this is a power move.
- **Manual bank transfer + receipt reference number field** is the local-PH reality (Wise + GCash equivalent) — they made it native rather than hiding it.
- **Messenger fallback** with the cart pre-encoded into the message — if anything fails, customer still gets to a salesperson with zero re-typing. Brilliant.
- "Remaining after order: N" stock-projection messaging — reduces buyer anxiety about phantom inventory.
- Cart persists in localStorage between sessions even pre-auth.
- Empty-state language: "Your cart is saved locally while you browse and will stay available after sign in." Sets expectations correctly.

What doesn't:
- No promo/discount visible without an account.
- No shipping cost calculation surfaced before submit — the LBC option literally says "Shipping fee will be cash on delivery." International (DHL) cost is opaque.
- Receipt-reference UX assumes the buyer pays BEFORE submitting the order (otherwise they wouldn't have a ref number) — unusual flow.
- Forced sign-in to submit (despite cart being no-auth) is friction at the worst possible moment.

### 5. Pre-Orders
Screenshot: `06-preorders.png`, `06b-dp-calculator.png`

URL: `/pre-orders`. Distinct from On Hand. Each pre-order card shows: image, category tag, status badge ("Coming Soon" / "Closed"), name, **Unit Price**, **Down Payment (30%)** , Release Date, pack/box/case breakdown, Language, View product, and a status-aware CTA ("Get Notified" / "Closed").

Above the grid are three buttons that open modals: **Open Down Payment Calculator** (pick products + qty → instantly shows Order Total + 30% Down Payment), **Allocation** (tied to actual pre-order allocations once stock lands), **Allocation History**.

Sort options unique to pre-orders: Coming Soon / Ending Soon / Latest Deadline / Release: Soonest + the usual.

What works:
- **Down Payment Calculator** is a brilliant pre-purchase tool — buyers know what they need to fund right now.
- "Get Notified" CTA for Coming-Soon items captures intent without forcing a wishlist account.
- Status taxonomy is explicit: Coming Soon → Open → Closed.
- Each card shows the case/box/pack breakdown — critical for sealed-product buyers who want to know what they're committing to.

What doesn't:
- Pre-orders that are "Closed" still show in the default grid — could be filtered out for cleanliness.
- "Get Notified" doesn't open a form inline; I couldn't safely test where it leads.

### 6. Cards (Singles + Slabs)
Screenshot: `07-cards.png`

URL: `/cards`. Same tile layout as On Hand. Filters: Dragon Ball / Pokemon. Visible inventory was tiny (2 PSA10 slabs). Treated as a separate product type rather than a category inside On Hand — which makes sense given different fulfillment expectations.

### 7. Grading service
Screenshot: `08-grading.png`

URL: `/grading`. **This is a full service page, not a product.** PSA tier table (Value Bulk ₱2,300 / Regular ₱6,500 / Express ₱12,500 with ETA + value coverage), TAG ₱2,500, Beckett ₱2,500. Free assessment + basic cleaning included.

The killer feature: an interactive **Card Centering Tool**. Upload a card image, drag a red border and blue artwork points, get a real-time PSA-target (55:45) and BGS-target (50:50) centering reading. Front/Back tabs. Even has a "Tool notes" sidebar explaining it's a guide, not final grading.

Primary CTA: "Grade My Card" → Messenger deeplink with a pre-filled inquiry message.

What works:
- Service productized clearly: price table + ETA + coverage limit. No hidden surprises.
- Centering tool is genuinely useful and a sticky reason to revisit the site.
- Messenger deeplink (no form to fill, no email back-and-forth) = highest conversion path for a high-touch service.

### 8. Tournaments
Screenshot: `09-tournaments-loaded.png`

URL: `/tournaments`. Showed only "Loading…" placeholder during audit — likely a tournament directory rendered from a DB. No active tournaments listed (homepage also said "No upcoming tournaments yet").

### 9. Profile (Guest)
Screenshot: `10-profile-guest.png`

URL: `/profile`. Even as a guest, you see: an account avatar, "Guest" label, shipping/contact preferences form (Country / Region / Province / City / Barangay / Postal / Street / Phone) with a Save Preferences button, "My vouchers (0)" widget, and an order-history search that's gated behind sign-in. Letting unauthenticated users see and fill prefs (even if they can't save) is a nice "what you'll get" preview.

### 10. Inquiry / Contact
There's no `/contact` page — Messenger is the universal channel. The Messenger CTA appears in: top nav (icon), homepage hero, every product (via cart's "Message Us" fallback with pre-filled cart contents), grading page, footer. They also reference "send your receipt to our Facebook page after checkout" — so FB Page is the secondary inquiry surface.

No FAQ page, no policy pages, no Terms / Privacy / Returns visible from primary nav. This is a gap.

### 11. Sign-in / Sign-up
Screenshots: `11-signin.png`, `12-signup.png`. URLs: `/sign-in` and `/sign-up` — Clerk-hosted forms. Standard email + social, no surprises.

## Top 5 ideas worth stealing for CloudNineCards

| # | Idea | Concrete implementation hint |
|---|------|------------------------------|
| 1 | **No-auth localStorage cart + cart subtotal next to header cart icon** — buyer never gets blocked from adding, and they always see the running spend. | Persist cart in `localStorage` keyed by site ID; render `<HeaderCart>` with both a badge count and a CAD subtotal pill. In `src/components/Header.jsx`. |
| 2 | **Merged cart-and-checkout single page with sticky right-rail Order Summary**. Removes a click; keeps Wise instructions, total, and CTA in view while user fills the shipping form. | New `/checkout` route that merges cart line items + shipping form + Wise payment instructions. Reuse the existing buy-now modal logic. |
| 3 | **Messenger/Instagram deeplink fallback with the cart pre-encoded into the message body**. For buyers who hit ANY friction, they get to a human with zero re-typing. | Generate an `instagram://` or `mailto:papspective@gmail.com?body=...` deeplink with URL-encoded cart contents on the cart page. |
| 4 | **Live stock badges ("Available: 4" / "Low Stock: 2 left" / "Sold Out") with real-time decrement** on tile, PDP, AND cart line ("Remaining after order: N"). Triple reinforcement = trust. | Pull stock from `singles`/`products` tables (you already do for stock decrement in `ecccdc99`); render `<StockBadge value>` in three places. |
| 5 | **Pre-Order Down Payment Calculator + clear "Due Now" terminology** + a "How Pre-Orders Work" 7-step strip on the homepage. | The 7-step strip is just static copy you can paste into the homepage today. The calculator is a `<Dialog>` with a product picker + qty input + a `total * 0.30` reactive readout. Lives at `/pre-orders`. |

## Top 3 anti-patterns to avoid

1. **"Sign out" button shown to guests in the header.** They're using Clerk's default button which doesn't switch label based on auth state. We should always explicitly label by state: "Sign in" / "Account."
2. **Forced sign-in at the Submit Order step**, after the buyer has filled shipping, picked payment method, and pasted a receipt reference. This is the worst possible point to introduce friction. Either gate earlier or allow guest checkout with an email.
3. **No visible Terms / Privacy / Returns / Shipping-policy pages.** Critical trust gap especially for international orders. Even a single `/policies` page would help.

## Mobile notes
Screenshots: `m1-home-mobile.png`, `m2-onhand-mobile.png`, `m3-pdp-mobile.png`, `m4-cart-mobile-v2.png`

At 390 px the site holds up well:
- Header collapses cleanly; cart subtotal still shows.
- Product grid becomes a single column with full-width tile images.
- Qty stepper + Add button stay on one row.
- Cart page stacks shipping form above the order summary; "Message Us" deeplink remains prominent (great for tap-to-Messenger flow on mobile).
- The 7-tab nav row gets crowded at 390 px and wraps to a second row — could become a hamburger.
- "Toggle floating menu" button exists in the corner — probably a quick-jump fab.

Nothing felt broken on mobile; in fact mobile feels MORE coherent than desktop because the page is naturally linear.

## Verdict: would I buy from this site?

Yes, with one caveat. If I were a PH-based collector looking for sealed product or grading, this site does almost everything right: clear stock, fair pricing transparency, multi-currency display, native local payment rails, a Messenger fallback that's always one tap away, and a physical store address I can Google-Maps to. The "Live: 4 browsing now" plus the pre-order down-payment calculator plus the centering tool plus the embedded TCG news feed make it feel like a real shop run by people who play the game, not a dropshipper. The caveat is the forced sign-in at submit and the missing policy pages — those would make me hesitate on my first transaction. But after that first order, I'd probably come back, because the post-purchase workflow (Messenger updates, FB receipt confirmation, store pickup option) is more personal than what Shopify-on-rails gives you. For our CloudNineCards rebuild, the takeaway is: **the cart isn't the goal; the path from "I want this" to "money in your account" is the goal**, and Eurusss Hub optimizes that path more than they optimize the cart object itself.
