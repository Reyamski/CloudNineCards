# Competitor UX Audit — Luka's Corner (lukascorner.com)

**Audited:** 2026-05-16
**Method:** Full customer-journey walkthrough with Playwright (homepage → catalog → product detail → cart → checkout (aborted before payment) → contact/sourcing → mobile @390px)
**For:** CloudNineCards (cloudninecards.ca) competitive benchmarking
**Screenshots:** `docs/screenshots/lukascorner/` (01–14)

---

## 1. Site Overview

- **Platform:** WordPress.com + WooCommerce ("Storefront" theme) with a heavy custom skin layered on top. Versioned footer (`v2026.04.08.2000`).
- **Market:** Philippines-based multi-game TCG shop — Pokémon, One Piece, Dragon Ball, Yu-Gi-Oh!. Currency ₱ (PHP), Wise/USD for international.
- **Catalog size:** ~42 SKUs at audit time (24 singles, 15 sealed, 3 slabs). Small but tightly curated — high-value singles (₱2k–₱140k) plus sealed boxes and pre-orders.
- **Positioning:** "Your Corner for Every Card and Every Pull." Strong dark, card-game-inspired visual identity with per-game accent colors.
- **Business model:** Mirrors CNC closely — split in-stock vs pre-order, downpayment-based pre-orders, allocation-cut refunds, manual bank transfer + Wise, Facebook/Messenger fallback, multi-game catalog. They are effectively a direct analog in a different region. Where they differ is the focus of this audit.

**Key structural difference vs CNC:** Luka's runs on real WooCommerce with a working **integrated card/GCash payment processor (PayMongo)** alongside manual bank transfer — CNC is Wise-manual-only. They also have **WooCommerce account/order infrastructure** (login, My Orders, order emails) out of the box.

---

## 2. Per-Stage Walkthrough

### Stage 1 — Homepage (`01-homepage-full.png`, mobile `10-mobile-home.png`)

**Does well:**
- Clear dual CTA above the fold: "BROWSE PRE-ORDERS →" and "BROWSE IN STOCK →" — splits the two buyer intents immediately (CNC has this concept but not as the primary hero action).
- "Shop by Title" game tiles (Pokémon / One Piece / Dragon Ball / Others) with game-colored art — instant orientation for a multi-game shop.
- "What's New" changelog section — humanizes the shop, signals active development ("We rebuilt everything from the ground up"), builds trust for a manual-payment store.
- "Coming Soon" roadmap cards (Sourcing, TCG Schedule, Rewards, International Hub) — sets expectations and teases retention features.
- Footer doubles as a trust/logistics panel: named shipping hubs (Laguna, Greenhills, Cavite), physical cabinet/consignment locations (Hobby Kaikan Alabang), expansion cities. Concrete physical presence = legitimacy for a manual-payment shop.

**Weak:**
- "See what's new" button and several roadmap cards link to pages that are placeholders ("Coming Soon"). Lots of promise, thinner delivery.
- No social proof on the homepage (no reviews, no order count, no testimonials, no IG feed).
- Hero is text-heavy; no featured product / hot card / countdown to anchor urgency.

### Stage 2 — Catalog / Browse (`02-shop-catalog.png`, `03-filter-sort-panel.png`, mobile `11-mobile-shop.png`)

**Does well:**
- **Products grouped into labeled sections with counts** — "Singles (24)", "Sealed (15)", "Slabs (3)" — on the single combined shop page. Reduces cognitive load vs one flat grid.
- **Single unified Filter/Sort modal** for the entire catalog: STATUS (All / In Stock / Pre-Order / Sold Out), TYPE (Singles / Slabs / Sealed), LANGUAGE (All / JP / EN / KR), SORT (Default / Price ↑ / Price ↓ / Name A-Z), with "Reset All" + "Done". Clean, one mental model across all product types.
- **Game-themed product card frames** with at-a-glance metadata: set code (e.g. `OP14-112`), language pill (EN/JP), type icon (🃏 Single / 📦 Sealed / 🏆 PSA 10), stock status, price.
- **Sold-out items stay listed** with a "Sold Out" overlay and "Read more" instead of "Add to cart" — keeps SEO/discovery and signals demand/history.
- Pre-order and variant products show "Add to Cart" → routes to product page ("This product has multiple variants…") instead of failing.
- Sealed product images carry a repeated "LUKA'S CORNER" watermark + ⚡ — anti-scrape / anti-reposting brand protection on photographed stock.
- Category chip bar (All / Pokémon / One Piece / Dragon Ball / Others) is horizontally scrollable on mobile.

**Weak:**
- 42 items on one page with no pagination/lazy-load concerns yet, but won't scale to hundreds without it.
- Duplicate-looking SKUs visible in catalog ("N's Zoroark 286 [EN] – Copy 1", "– Copy 2") — internal data hygiene leaking to customers.
- "Canari 291 [EN]" titled EN but tagged JP — metadata inconsistency erodes trust on high-value singles.

### Stage 3 — Product Detail (`04-product-detail-single.png`, `05-product-detail-preorder.png`, mobile `13-mobile-product.png`)

**Does well:**
- **Structured spec block**: Card / Number / Language / Condition (NM-M, Factory Sealed) as a labeled grid — reads like a card-grading sheet, exactly what TCG buyers want.
- **Breadcrumb + contextual "← Back to Singles"** (back link is category-aware, not generic).
- **Full-screen image gallery** with thumbnails; watermarked photos of actual stock.
- **"BUY NOW" express button beside "Add to Cart"** — one-tap straight to checkout, skipping the cart. Strong for single-item high-intent buyers (most TCG single purchases).
- **Honest microcopy under price**: "Full payment required · No cancellations" (in-stock) vs the pre-order variant.
- **Pre-order page is the standout:**
  - Variant selector with per-variant pricing ("with Manga Book ₱1,799" / "Promo Card Only ₱1,599").
  - **ETA shown prominently next to price** ("3rd–4th Week of May 2026") — not buried.
  - Dedicated **"Downpayment" section** with the exact peso amount ("Both options (Bank Transfer): ₱999").
  - Long-form **Payment Terms + allocation-cut policy** ("If allocation cuts occur, unfulfilled orders will be fully refunded"), PayPal 5% non-refundable disclosure, DHL international note.
- Related products carousel keeps browsing alive.

**Weak:**
- Description is a wall of repeated boilerplate (payment terms / shipping / important notes pasted on every product) — same legal text on the dedicated policy page; redundant and pushes real product info down.
- No condition photos called out per-copy for high-value singles (₱12k Zoroark) beyond two gallery images.
- No "notify me when back in stock" on sold-out product pages — pure dead end.

### Stage 4 — Cart (`06-cart.png`)

**Does well:**
- Per-line **handling-time badge ("1–3 days")** right on each cart row — sets fulfillment expectations before checkout.
- Line items show type label ("Single") and selected variant ("Promo Card Only").
- Coupon support ("Add coupons"), clean "Estimated total", single clear "Proceed to Checkout".

**Weak / behind CNC:**
- **Cart does NOT split or visually separate pre-order vs in-stock items**, and does not surface the deposit-vs-full-payment math at the cart stage. A mixed cart (the pre-order ₱1,599 + in-stock ₱4,900 I tested) just shows a flat ₱6,499 total. The deposit logic only resolves later. **CNC's split in-stock/pre-order order handling + 30% deposit shown pre-checkout is materially better here.**
- No stock-reservation / "items in your cart aren't reserved" messaging.

### Stage 5 — Checkout (`07-checkout.png`, mobile `14-mobile-checkout.png`) — aborted before payment

**Does well:**
- **Guest checkout** — "Create an account?" is an optional checkbox, not a gate. (Lower friction than forcing accounts.)
- **Integrated payment processing**: Credit/Debit card (PayMongo, inline card fields), GCash via PayMongo (+2%), Direct bank transfer — all selectable at checkout. This is the biggest capability gap vs CNC's manual-only Wise flow.
- Fee transparency: "Processing Fee (5%)" appears as an explicit line item in the order summary, recomputed by payment method (+5% card / +2% GCash / 0% bank).
- **Region-appropriate shipping options with prices**: Lalamove (buyer shoulders fee), "LBC N-Pack Sakto — Home Delivery ₱100", "LBC — Branch Pick-up ₱80". Branch pickup is a cheaper option that matches local buyer behavior.
- Inline warning on card option: "Foreign credit cards may not work here. International customers should pay via PayPal." — proactively prevents a common failed-payment support ticket.
- Order notes field + "Ship to a different address?" + returning-customer login link.

**Weak:**
- Mixed pre-order/in-stock checkout doesn't clearly restate "you are paying a deposit of ₱X now, ₱Y on arrival" at the point of payment — the policy is on a separate page but not reinforced in the order summary.
- Long single-column WooCommerce-style form (no multi-step or progress indicator); lots of required fields for what's often an impulse single-card buy.

### Stage 6 — Contact / Inquiry & Sourcing (`09-sourcing.png`)

**Does well:**
- **"Source an Item" feature** — "Can't find a card? Submit a sourcing request and we'll track it down for you — priority for Japan items." Login-gated demand-capture tool. Turns "we don't have it" into a lead instead of a lost customer. Tied to accounts so requests are trackable.
- Multiple contact paths: Facebook Page link recurring throughout (analogous to CNC's Messenger fallback), `hello@lukascorner.com` mailto, order-update emails.

**Weak:**
- Sourcing requires login before you can even see the form — kills spontaneous requests. A guest "what are you looking for + your email" form would capture far more.
- No live chat / no response-time expectation set.

### Stage 7 — "How Pre-Orders Work" policy page (`08-how-preorders-work.png`) — STANDOUT

This is the single best asset on the site and the highest-value steal.

- Accordion sections: Down Payment, Allocation Policy, No Cancellations, Payment Methods, Shipping & Delivery, FAQ.
- **Worked numeric examples** with real peso math:
  - DP example: ₱3,500/box × 2 = ₱7,000 total, 50% DP = ₱3,500 now, ₱3,500 balance.
  - Allocation example: ordered 5 boxes, 60% allocation, −2 boxes cut, receive 3, "Refund Issued ₱7,000 (2 boxes)".
- Refund-timeline specifics ("3–7 business days; Bank Transfer 1–3 days; PayPal/CC 5–10 days").
- FAQ pre-empts the exact friction questions of a deposit/allocation model: "What if my items arrive at different times?" (split-arrival policy), "Can I choose specific variants?" (no — random distribution), "What if the ETA changes?" (not grounds for cancellation), international shipping.
- CTA at the bottom routes straight back to "Browse Pre-Orders".

CNC has the deposit/split mechanics in *software* but (per project context) does not appear to have a polished, example-driven public explainer like this. This page is what makes customers comfortable paying a manual deposit to a small shop.

---

## 3. Top 5 Ideas Worth Stealing (mapped to CNC)

1. **"How Pre-Orders Work" explainer page with worked peso/CAD examples.**
   CNC already has 30% deposit + split orders + allocation logic in code. Wrap it in an accordion page: a 30%-deposit calc example, an allocation-cut refund example with real CAD numbers, and an FAQ ("items arriving separately", "ETA slipped", "can I cancel"). Link it from the pre-order CTA and every pre-order product page. Low effort, high trust ROI — directly de-risks the manual-payment objection.

2. **"Source an Item" / card request form as a demand-capture lead tool.**
   Add a guest-friendly (no login) "Looking for a specific card? Tell us + drop your email/Messenger" form. CNC already has an RLS backend — store requests in a `sourcing_requests` table. Converts "out of stock / not carried" dead ends into a sales pipeline and a free demand-signal dataset for what to pre-order next.

3. **"BUY NOW" express button on product detail (in addition to Add to Cart).**
   TCG singles are mostly single-item impulse buys. A one-tap "Buy Now" that skips the cart and goes straight into CNC's merged /cart+checkout (pre-filling that single item) should measurably lift conversion, especially on mobile.

4. **Sticky bottom action bar on mobile product pages** + **app-style bottom tab bar (Account / Search / Cart)**.
   On Luka's mobile product page, Add to Cart + Buy Now are pinned to the bottom of the viewport at all times; the shop has a persistent bottom nav. CNC's mobile flow should pin its primary buy action so users never scroll back up — cheap conversion win.

5. **Unified Filter/Sort modal covering Status + Type + Language + Sort across the whole catalog, with product sections grouped by type with counts.**
   CNC has sort/filter on singles; extend it to one modal that also filters Sealed/Slabs/Pre-order and adds a **Language facet (EN / JP)** — critical for One Piece/Pokémon buyers who care about print region. Group the results into "Singles (n) / Sealed (n) / Pre-Orders (n)" sections like Luka's does.

**Bonus low-effort steals:** photo watermarking on stock images (anti-scrape brand protection); ETA shown next to price on pre-order cards; per-line handling-time badge ("ships in 1–3 days") in cart; a "What's New" changelog block on the homepage to signal an actively maintained, trustworthy shop.

---

## 4. Top 3 Anti-Patterns to Avoid

1. **Login wall on the sourcing/inquiry form.** Requiring an account before a customer can even ask "do you have X?" kills spontaneous, high-intent leads. CNC should keep its request form guest-accessible (email or Messenger handle only).

2. **Pasting full legal/payment boilerplate into every product description.** Luka's repeats the entire payment-terms + allocation + shipping wall of text on every product, burying the actual product info. CNC should keep the long policy on the dedicated explainer page and put only a one-line summary + a link on the product page.

3. **Data hygiene leaking to customers.** Customer-facing SKUs named "– Copy 1 / – Copy 2", and a card titled `[EN]` but tagged `JP`. On ₱10k+/CAD$200+ singles this directly undermines buyer confidence. CNC should enforce clean titles and a single source of truth for language/condition on high-value singles.

(Watch item, not a clear anti-pattern: a roadmap of "Coming Soon" features that link to empty pages — fine as a teaser, risky if it stays empty for months.)

---

## 5. Mobile Notes (@390px — `10`,`11`,`13`,`14`)

- Hamburger nav + **persistent cart pill with item count + running total** in the header on every page.
- Big game-category banners stack cleanly; category chips scroll horizontally.
- **App-like sticky bottom tab bar**: My Account / Search / Cart — feels like a native app, keeps cart one tap away from anywhere.
- **Product page pins Add to Cart + BUY NOW to the bottom of the screen** — primary action always reachable without scrolling. This is the strongest single mobile pattern to copy.
- Product spec grid, variant selector, and price/ETA block all reflow well to one column.
- Checkout is a long single-column scroll (typical WooCommerce) — functional but not optimized; no step indicator.
- Overall mobile execution is better than the desktop — clearly mobile-first, which is correct for the PH (and CNC's likely social-driven) audience.

---

## 6. "Would I Buy Here?" Verdict

**Yes — with mild reservations.** For a small manual-payment shop, Luka's earns trust the right way: concrete physical hubs/cabinet locations in the footer, an exceptionally clear pre-order/allocation policy with worked money examples, honest fee disclosure as a checkout line item, integrated GCash/card payment as an alternative to bank transfer, and a polished mobile experience. The "Source an Item" service signals they'll go get what you want. I'd be comfortable putting a deposit on a pre-order here.

The reservations are execution-quality, not trust: visible "Copy 1/Copy 2" SKUs and an EN/JP metadata mismatch on expensive singles, lots of "Coming Soon" placeholders, and a sourcing form locked behind login. None are deal-breakers.

**Net for CNC:** Luka's is roughly feature-parity on the *mechanics* (deposit/split/allocation/Messenger fallback) but ahead on **trust packaging** (the explainer page), **payment options** (integrated GCash/card vs CNC's Wise-only), **demand capture** (Source an Item), and **mobile conversion ergonomics** (sticky buy bar, bottom tab nav, Buy Now). CNC is ahead on **cart-stage clarity** (visible split + deposit math before checkout) and on backend security posture. The cheapest, highest-impact moves for CNC are the explainer page, the guest sourcing form, the Buy Now button, and the sticky mobile buy bar — all low effort against CNC's existing backend.
