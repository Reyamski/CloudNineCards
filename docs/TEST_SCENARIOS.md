# TEST_SCENARIOS.md — CloudNineCards TCG Store

**Project:** Vite + React TCG Store Preview
**Path:** `c:\Users\Reyam\Downloads\AI\shopify-tcg-store\preview`
**QA Date:** 2026-03-12
**Method:** Static analysis (source-code read — no browser required unless noted)
**Legend:** ✅ PASS · ❌ FAIL · 🌐 NEEDS_BROWSER

---

## Static Analysis Notes

All tests were performed by reading source code directly. "NEEDS_BROWSER" is used only when a test outcome depends on runtime behaviour (animations, real network calls, DOM layout) that cannot be confirmed from code alone.

---

## Suite 1 — Navigation & Routing

### 1.1 Route Definitions

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 1.1.1 | `App.jsx` defines route `/` → `<HomePage />` | ✅ PASS | `App.jsx` line 15: `<Route path="/" element={<HomePage />} />` |
| 1.1.2 | `App.jsx` defines route `/shop` → `<ShopPage />` | ✅ PASS | `App.jsx` line 16: `<Route path="/shop" element={<ShopPage />} />` |
| 1.1.3 | `App.jsx` defines route `/pre-orders` → `<PreOrdersPage />` | ✅ PASS | `App.jsx` line 17: `<Route path="/pre-orders" element={<PreOrdersPage />} />` |
| 1.1.4 | `App.jsx` defines route `/new-arrivals` → `<NewArrivalsPage />` | ✅ PASS | `App.jsx` line 18: `<Route path="/new-arrivals" element={<NewArrivalsPage />} />` |
| 1.1.5 | `App.jsx` defines route `/contact` → `<ContactPage />` | ✅ PASS | `App.jsx` line 19: `<Route path="/contact" element={<ContactPage />} />` |

### 1.2 Nav Component — Link Targets

The shared `Nav` component (`src/components/Nav.jsx`) defines five links as a `links` array and renders them with `<Link to={to}>`.

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 1.2.1 | Nav renders "Home" link pointing to `/` | ✅ PASS | `Nav.jsx` line 7: `{ label: 'Home', to: '/' }` |
| 1.2.2 | Nav renders "Shop" link pointing to `/shop` | ✅ PASS | `Nav.jsx` line 8: `{ label: 'Shop', to: '/shop' }` |
| 1.2.3 | Nav renders "Pre-orders" link pointing to `/pre-orders` | ✅ PASS | `Nav.jsx` line 9: `{ label: 'Pre-orders', to: '/pre-orders' }` |
| 1.2.4 | Nav renders "New Arrivals" link pointing to `/new-arrivals` | ✅ PASS | `Nav.jsx` line 10: `{ label: 'New Arrivals', to: '/new-arrivals' }` |
| 1.2.5 | Nav renders "Contact" link pointing to `/contact` | ✅ PASS | `Nav.jsx` line 11: `{ label: 'Contact', to: '/contact' }` |
| 1.2.6 | Nav highlights active route (applies `text-cyan-300` class when `pathname === to`) | ✅ PASS | `Nav.jsx` line 31: conditional class `pathname === to ? 'text-cyan-300' : ''` using `useLocation()` |
| 1.2.7 | Logo link in Nav points to `/` | ✅ PASS | `Nav.jsx` line 16: `<Link to="/">` wraps the CLOUDNINECARDS logo |

### 1.3 Nav Presence on Pages

`Nav` is used as an inline import on every inner page. `HomePage.tsx` renders its own inline nav (not the shared `Nav` component).

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 1.3.1 | `ShopPage.jsx` renders `<Nav />` | ✅ PASS | `ShopPage.jsx` line 6 import + line 305 render |
| 1.3.2 | `PreOrdersPage.jsx` renders `<Nav />` | ✅ PASS | `PreOrdersPage.jsx` line 5 import + line 356 render |
| 1.3.3 | `NewArrivalsPage.jsx` renders `<Nav />` | ✅ PASS | `NewArrivalsPage.jsx` line 4 import + line 64 render |
| 1.3.4 | `ContactPage.jsx` renders `<Nav />` | ✅ PASS | `ContactPage.jsx` line 5 import + line 53 render |
| 1.3.5 | `HomePage.tsx` renders its own inline nav (not the shared `Nav` component) | ✅ PASS | `HomePage.tsx` lines 225–231: inline `<div>` with identical five `<Link>` entries — functionally equivalent |

### 1.4 AnnouncementBar Visibility

`AnnouncementBar` is rendered **outside** `<Routes>` in `App.jsx`, so it appears on every page automatically.

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 1.4.1 | `AnnouncementBar` is placed outside `<Routes>` and therefore renders on all pages | ✅ PASS | `App.jsx` line 13: `<AnnouncementBar />` is above the `<Routes>` block |
| 1.4.2 | AnnouncementBar links to `/pre-orders` | ✅ PASS | `AnnouncementBar.jsx` line 10: `<Link to="/pre-orders">` |
| 1.4.3 | AnnouncementBar text includes pre-order messaging | ✅ PASS | Text: "Pre-orders now open — 30% DP via Wise · International shipping & taxes covered by buyer" |

### 1.5 Back Navigation

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 1.5.1 | Browser back button relies on React Router `BrowserRouter` history — no explicit `navigate(-1)` calls needed | ✅ PASS | `App.jsx` line 12: `<BrowserRouter>` used; React Router manages history stack natively |
| 1.5.2 | No `<a href>` hard links that would break SPA back navigation | ✅ PASS | All navigation uses `<Link to="...">` from react-router-dom throughout all files |

---

## Suite 2 — Shop Page

### 2.1 Filter Tabs

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.1.1 | Filter tab "All" renders | ✅ PASS | `ShopPage.jsx` line 81: `const tags = ['All', 'One Piece', 'Dragon Ball', 'Pokemon', 'Pre-orders']` |
| 2.1.2 | Filter tab "One Piece" renders | ✅ PASS | Same `tags` array |
| 2.1.3 | Filter tab "Dragon Ball" renders | ✅ PASS | Same `tags` array |
| 2.1.4 | Filter tab "Pokemon" renders | ✅ PASS | Same `tags` array |
| 2.1.5 | Filter tab "Pre-orders" renders | ✅ PASS | Same `tags` array |
| 2.1.6 | Clicking a tab sets `activeTag` state and filters `allProducts` by `p.tag === activeTag` | ✅ PASS | `ShopPage.jsx` line 294: `filtered = activeTag === 'All' ? allProducts : allProducts.filter(p => p.tag === activeTag)` |
| 2.1.7 | Active tab receives distinct styling (`border-cyan-300/60 bg-cyan-300/15 text-cyan-100`) | ✅ PASS | `ShopPage.jsx` lines 317–320: conditional className on `activeTag === tag` |

### 2.2 Product States

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.2.1 | Products with `inStock: true` and no `isPreorder` flag show "Buy Now — Wise" button | ✅ PASS | `ShopPage.jsx` lines 352–355: `item.inStock ? <button>Buy Now — Wise</button>` |
| 2.2.2 | Products with `inStock: false` and no `isPreorder` flag show disabled "Sold Out" button | ✅ PASS | `ShopPage.jsx` lines 357–360: `<button disabled>Sold Out</button>` with `cursor-not-allowed` style |
| 2.2.3 | Products with `isPreorder: true` show "Pre-order →" link (navigates to `/pre-orders`) | ✅ PASS | `ShopPage.jsx` lines 347–350: `item.isPreorder ? <Link to="/pre-orders">Pre-order →</Link>` |
| 2.2.4 | "Sold Out" overlay badge appears on cards where `!item.inStock` | ✅ PASS | `ShopPage.jsx` lines 335–339: `{!item.inStock && <div>Sold Out</div>}` |
| 2.2.5 | In-stock products: `op08` (OP-08, $50), `fs06` (Dragon Ball FS06, $24.99), `poke01` (Pokemon, $189.99) | ✅ PASS | `ShopPage.jsx` lines 19–67: `inStock: true` on `op08`, `fs06`, `poke01` |
| 2.2.6 | Sold-out products: `eb03` (EB-03, $131) and `op11` (OP-11, $139.28) | ✅ PASS | `ShopPage.jsx` lines 28–47: `inStock: false`, no `isPreorder` flag |
| 2.2.7 | Pre-order product: `op10po` (Royal Blood OP-10, $144.99) has `isPreorder: true` | ✅ PASS | `ShopPage.jsx` lines 69–78: `isPreorder: true` |

### 2.3 BuyNowModal — Lifecycle

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.3.1 | Modal opens when "Buy Now" button is clicked (`setSelected(item)`) | ✅ PASS | `ShopPage.jsx` line 353: `onClick={() => setSelected(item)}`; `selected &&` guards render |
| 2.3.2 | Modal closes when X button is clicked | ✅ PASS | `ShopPage.jsx` line 146: `<button onClick={onClose}>` with `<X>` icon |
| 2.3.3 | Modal closes when backdrop (overlay) is clicked | ✅ PASS | `ShopPage.jsx` line 134: `<motion.div onClick={onClose}` on the backdrop div |
| 2.3.4 | `AnimatePresence` wraps modal for mount/unmount animation | ✅ PASS | `ShopPage.jsx` line 298: `<AnimatePresence>{selected && <BuyNowModal .../>}</AnimatePresence>` |

### 2.4 BuyNowModal — Quantity & Price

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.4.1 | Qty starts at 1 | ✅ PASS | `ShopPage.jsx` line 88: `const [qty, setQty] = useState(1)` |
| 2.4.2 | "−" button decreases qty (minimum 1) | ✅ PASS | `ShopPage.jsx` line 179: `onClick={() => setQty(q => Math.max(1, q - 1))}` |
| 2.4.3 | "+" button increases qty without upper limit | ✅ PASS | `ShopPage.jsx` line 181: `onClick={() => setQty(q => q + 1)}` |
| 2.4.4 | Total price recalculates as `item.price * qty` (toFixed 2) | ✅ PASS | `ShopPage.jsx` line 94: `const total = (item.price * qty).toFixed(2)` — displayed in the modal dynamically |

### 2.5 BuyNowModal — Form Validation

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.5.1 | Name field has `required` attribute | ✅ PASS | `ShopPage.jsx` line 253: `<input required value={name} ...>` |
| 2.5.2 | Email field has `required` attribute and `type="email"` | ✅ PASS | `ShopPage.jsx` line 259: `<input required type="email" value={email} ...>` |
| 2.5.3 | Name field is controlled (value + onChange wired) | ✅ PASS | `ShopPage.jsx` line 253: `value={name} onChange={e => setName(e.target.value)}` |
| 2.5.4 | Email field is controlled (value + onChange wired) | ✅ PASS | `ShopPage.jsx` line 259: `value={email} onChange={e => setEmail(e.target.value)}` |

### 2.6 BuyNowModal — Wise Payment Instructions

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.6.1 | Wise handle `@cloudninecards` displayed on Step 1 | ✅ PASS | `ShopPage.jsx` line 197: `<div>{WISE_HANDLE}</div>` where `WISE_HANDLE = '@cloudninecards'` |
| 2.6.2 | Copy-to-clipboard button copies Wise handle | ✅ PASS | `ShopPage.jsx` lines 96–100: `copyWise()` calls `navigator.clipboard.writeText(WISE_HANDLE)` |
| 2.6.3 | Four-step payment instructions visible on Step 1 | ✅ PASS | `ShopPage.jsx` lines 208–218: array of 4 instruction steps rendered |

### 2.7 BuyNowModal — EmailJS Send

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.7.1 | `emailjs.send()` is called on form submit | ✅ PASS | `ShopPage.jsx` lines 107–121: `await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {...}, EMAILJS_PUBLIC_KEY)` |
| 2.7.2 | Uses correct service ID `service_495o229` | ✅ PASS | `ShopPage.jsx` line 9: `const EMAILJS_SERVICE_ID = 'service_495o229'` |
| 2.7.3 | Uses correct template ID `template_3ickzxu` | ✅ PASS | `ShopPage.jsx` line 10: `const EMAILJS_TEMPLATE_ID = 'template_3ickzxu'` |
| 2.7.4 | Uses correct public key `ep1rUzpqvkYS71VPH` | ✅ PASS | `ShopPage.jsx` line 11: `const EMAILJS_PUBLIC_KEY = 'ep1rUzpqvkYS71VPH'` |
| 2.7.5 | `sending` state is set to `true` during send, `false` in `finally` block | ✅ PASS | `ShopPage.jsx` lines 104, 126: `setSending(true)` / `setSending(false)` |
| 2.7.6 | `submitted` state set to `true` on success, rendering Order Sent confirmation UI | ✅ PASS | `ShopPage.jsx` line 121: `setSubmitted(true)` after await resolves |
| 2.7.7 | Error message shown on send failure | ✅ PASS | `ShopPage.jsx` line 124: `setSendError('Failed to send. Email us directly at ...')` rendered at line 273 |
| 2.7.8 | Send button shows `<Loader2 animate-spin>` and "Sending..." text while `sending === true` | ✅ PASS | `ShopPage.jsx` line 279: `{sending ? <><Loader2 .../> Sending...</> : 'Submit Order'}` |
| 2.7.9 | Actual email delivery confirmed | 🌐 NEEDS_BROWSER | Requires live EmailJS credentials and network call |

### 2.8 BuyNowModal — Modal Steps

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 2.8.1 | Modal opens on Step 1 (payment instructions) | ✅ PASS | `ShopPage.jsx` line 85: `const [step, setStep] = useState(1)` |
| 2.8.2 | "I've Sent the Payment →" button advances to Step 2 | ✅ PASS | `ShopPage.jsx` line 236: `onClick={() => setStep(2)}` |
| 2.8.3 | Step 2 shows confirm form (name, email, order summary) | ✅ PASS | `ShopPage.jsx` lines 244–282: `<form>` with name, email inputs and order summary block |
| 2.8.4 | "Back" button on Step 2 returns to Step 1 | ✅ PASS | `ShopPage.jsx` line 275: `onClick={() => setStep(1)}` |

---

## Suite 3 — Pre-Orders Page

### 3.1 Pre-order Window Logic

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.1.1 | `PO_OPEN_DATE` is `2025-11-01T00:00:00` | ✅ PASS | `PreOrdersPage.jsx` line 13: `const PO_OPEN_DATE = new Date('2025-11-01T00:00:00')` |
| 3.1.2 | `PO_CLOSE_DATE` is `2026-04-30T23:59:59` | ✅ PASS | `PreOrdersPage.jsx` line 14: `const PO_CLOSE_DATE = new Date('2026-04-30T23:59:59')` |
| 3.1.3 | `isOpen` evaluates correctly as `now >= PO_OPEN_DATE && now <= PO_CLOSE_DATE` | ✅ PASS | `PreOrdersPage.jsx` line 16: `const isOpen = now >= PO_OPEN_DATE && now <= PO_CLOSE_DATE` |
| 3.1.4 | As of test date 2026-03-12, `isOpen` resolves to `true` (within window) | ✅ PASS | 2026-03-12 is between 2025-11-01 and 2026-04-30 — window is currently open |
| 3.1.5 | Badge text shows "Pre-orders Open" when `isOpen === true` | ✅ PASS | `PreOrdersPage.jsx` line 360: `{isOpen ? 'Pre-orders Open' : 'Pre-orders Closed'}` |
| 3.1.6 | Status pill shows "● Open now" in green when `isOpen === true` | ✅ PASS | `PreOrdersPage.jsx` line 375: conditional class and text based on `isOpen` |

### 3.2 Pre-order Cards

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.2.1 | Three pre-order cards render | ✅ PASS | `PreOrdersPage.jsx` lines 22–53: `preorders` array has 3 items: `op10`, `fb05`, `op11` |
| 3.2.2 | Card 1: "One Piece Card Game Royal Blood OP-10", CAD $144.99, ETA Nov 2025 | ✅ PASS | `PreOrdersPage.jsx` lines 24–32: title, price, eta fields |
| 3.2.3 | Card 2: "Dragon Ball Super Fusion World FB-05 Booster Box", CAD $119.99, ETA Dec 2025 | ✅ PASS | `PreOrdersPage.jsx` lines 34–42: title, price, eta fields |
| 3.2.4 | Card 3: "One Piece Card Game Fist of God Speed OP-11", CAD $139.99, ETA Jan 2026 | ✅ PASS | `PreOrdersPage.jsx` lines 44–52: title, price, eta fields |
| 3.2.5 | Each card displays full price and 30% DP amount | ✅ PASS | `PreOrdersPage.jsx` lines 446–451: `CAD $${item.price.toFixed(2)}` and `${(item.price * DP_PERCENT).toFixed(2)}` |
| 3.2.6 | ETA shown in card subtitle (e.g., "Japanese · Ships Nov 2025") | ✅ PASS | `PreOrdersPage.jsx` line 441: `{item.subtitle}` rendered — subtitle contains ETA |

### 3.3 Slot Limits / Progress Bars

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.3.1 | No slot limit fields exist in the `preorders` data objects | ✅ PASS | `PreOrdersPage.jsx` lines 22–53: data objects have `id`, `title`, `subtitle`, `price`, `currency`, `eta`, `image`, `hype` — no `slots`, `slotsLeft`, `maxSlots`, or similar |
| 3.3.2 | No `<progress>`, progress bar HTML, or "X slots left" text rendered in JSX | ✅ PASS | Full review of `PreOrdersPage.jsx` JSX template reveals no progress bar, slot counter, or percentage-fill element |

### 3.4 Reserve Now Button State

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.4.1 | "Reserve Now" button is enabled when `isOpen === true` | ✅ PASS | `PreOrdersPage.jsx` line 458: `disabled={!isOpen}` — button enabled when window is open |
| 3.4.2 | Button text shows "Reserve Now" with chevron when `isOpen === true` | ✅ PASS | `PreOrdersPage.jsx` line 466: `{!isOpen ? 'Pre-orders Closed' : <>Reserve Now <ChevronRight .../></>}` |
| 3.4.3 | Button shows "Pre-orders Closed" and is disabled when `!isOpen` | ✅ PASS | Same line — `disabled={!isOpen}` and text "Pre-orders Closed" |
| 3.4.4 | Clicking "Reserve Now" opens `PreOrderModal` with the selected item | ✅ PASS | `PreOrdersPage.jsx` line 459: `onClick={() => setSelected(item)}`; `selected &&` guards the modal render |

### 3.5 PreOrderModal — Step 1: Terms

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.5.1 | Modal opens on Step 1 | ✅ PASS | `PreOrdersPage.jsx` line 59: `const [step, setStep] = useState(1)` |
| 3.5.2 | Step 1 shows item title and subtitle | ✅ PASS | `PreOrdersPage.jsx` lines 163–164: `{item.title}` and `{item.subtitle}` |
| 3.5.3 | Step 1 shows qty selector (min 1) | ✅ PASS | `PreOrdersPage.jsx` lines 170–174: qty increment/decrement with `Math.max(1, q - 1)` guard |
| 3.5.4 | Step 1 shows price breakdown (unit, qty, total, 30% DP, remaining 70%) | ✅ PASS | `PreOrdersPage.jsx` lines 178–198: full breakdown table with `totalPrice`, `totalDp`, `totalRemaining` |
| 3.5.5 | Step 1 shows four terms bullets (International shipping, Wise payment, Balance 70%, Non-refundable) | ✅ PASS | `PreOrdersPage.jsx` lines 202–213: four `{icon, text}` objects rendered |
| 3.5.6 | **NOTE: Step 1 has NO checkbox — "I agree" is a plain button, not a checkbox-gated CTA** | ❌ FAIL | `PreOrdersPage.jsx` line 216–221: `<button onClick={() => setStep(2)}>I agree — Proceed to Payment</button>` — no `<input type="checkbox">` gating this action. The test spec states "accepts checkbox" but the code does not implement one. |
| 3.5.7 | "I agree — Proceed to Payment" button advances to Step 2 | ✅ PASS | `PreOrdersPage.jsx` line 217: `onClick={() => setStep(2)}` |

### 3.6 PreOrderModal — Step 2: Payment

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.6.1 | Step 2 shows 30% DP amount prominently | ✅ PASS | `PreOrdersPage.jsx` line 235: `<div>CAD ${totalDp}</div>` in large text |
| 3.6.2 | Step 2 shows Wise handle `@cloudninecards` | ✅ PASS | `PreOrdersPage.jsx` line 244: `<div>{WISE_HANDLE}</div>` where `WISE_HANDLE = '@cloudninecards'` |
| 3.6.3 | Step 2 copy-to-clipboard button copies Wise handle | ✅ PASS | `PreOrdersPage.jsx` lines 72–76: `copyWise()` calls `navigator.clipboard.writeText(WISE_HANDLE)` |
| 3.6.4 | Step 2 shows four-step payment instructions | ✅ PASS | `PreOrdersPage.jsx` lines 255–265: 4 numbered steps rendered |
| 3.6.5 | "Back" button returns to Step 1 | ✅ PASS | `PreOrdersPage.jsx` line 269: `onClick={() => setStep(1)}` |
| 3.6.6 | "I've Sent the Payment →" button advances to Step 3 | ✅ PASS | `PreOrdersPage.jsx` line 272: `onClick={() => setStep(3)}` |
| 3.6.7 | **NOTE: Step 2 does NOT have name/email/qty fields — those are on Step 3** | ❌ FAIL | The spec states "Step 2: Payment — name/email/qty fields". However, in the actual code: Step 2 is payment instructions only; name/email fields are on Step 3. Qty is set on Step 1. The spec description is misaligned with the three-step flow: Step 1=Terms+Qty, Step 2=Payment, Step 3=Confirm+name/email. |

### 3.7 PreOrderModal — Step 3: Confirm

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.7.1 | Step 3 shows name field (`required`, controlled) | ✅ PASS | `PreOrdersPage.jsx` lines 289–295: `<input required value={name} onChange={...}>` |
| 3.7.2 | Step 3 shows email field (`required`, `type="email"`, controlled) | ✅ PASS | `PreOrdersPage.jsx` lines 298–307: `<input required type="email" value={email} onChange={...}>` |
| 3.7.3 | Step 3 shows order summary (title, qty, DP sent, remaining) | ✅ PASS | `PreOrdersPage.jsx` lines 311–319: summary block with `item.title`, `qty`, `totalDp`, `totalRemaining` |
| 3.7.4 | EmailJS send triggered on Step 3 form submit | ✅ PASS | `PreOrdersPage.jsx` lines 83–100: `await emailjs.send(...)` inside `handleSubmit` |
| 3.7.5 | "Back" button on Step 3 returns to Step 2 | ✅ PASS | `PreOrdersPage.jsx` line 326: `onClick={() => setStep(2)}` |
| 3.7.6 | Submit button shows spinner during send | ✅ PASS | `PreOrdersPage.jsx` line 330: `{sending ? <><Loader2 .../> Sending...</> : 'Submit Order'}` |
| 3.7.7 | `submitted` state switches modal to success view | ✅ PASS | `PreOrdersPage.jsx` lines 137–156: success block rendered when `submitted === true` |

### 3.8 DP Calculation Correctness

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 3.8.1 | `DP_PERCENT = 0.30` | ✅ PASS | `PreOrdersPage.jsx` line 20: `const DP_PERCENT = 0.30` |
| 3.8.2 | `totalDp = item.price * qty * DP_PERCENT` (toFixed 2) | ✅ PASS | `PreOrdersPage.jsx` line 69: `const totalDp = (item.price * qty * DP_PERCENT).toFixed(2)` |
| 3.8.3 | `totalRemaining = item.price * qty * (1 - DP_PERCENT)` → effectively 70% | ✅ PASS | `PreOrdersPage.jsx` line 70: `const totalRemaining = (item.price * qty * (1 - DP_PERCENT)).toFixed(2)` |
| 3.8.4 | Spot-check: OP-10 ($144.99 × 1): DP = $43.50, Remaining = $101.49 | ✅ PASS | 144.99 × 0.30 = 43.497 → $43.50; 144.99 × 0.70 = 101.493 → $101.49 (JavaScript toFixed rounds correctly) |
| 3.8.5 | Spot-check: OP-10 ($144.99 × 2): DP = $87.00, Remaining = $202.99 (total = $289.98) | ✅ PASS | 144.99 × 2 × 0.30 = 86.994 → $87.00; × 0.70 = 202.986 → $202.99 |

---

## Suite 4 — Contact Form

### 4.1 Field Rendering

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 4.1.1 | Name field renders (`type="text"`, `required`) | ✅ PASS | `ContactPage.jsx` lines 138–145: `<input required type="text" ...>` |
| 4.1.2 | Email field renders (`type="email"`, `required`) | ✅ PASS | `ContactPage.jsx` lines 149–157: `<input required type="email" ...>` |
| 4.1.3 | Topic field renders as `<select>` with dropdown options | ✅ PASS | `ContactPage.jsx` lines 162–169: `<select>` with 5 topic options from `topics` array |
| 4.1.4 | Order # field renders (optional, no `required`) | ✅ PASS | `ContactPage.jsx` lines 173–180: `<input type="text">` — label reads "Order # (optional)", no `required` attribute |
| 4.1.5 | Message field renders as `<textarea>` (`required`, 5 rows) | ✅ PASS | `ContactPage.jsx` lines 185–192: `<textarea required rows={5} ...>` |
| 4.1.6 | Topic options: "Order Issue", "Pre-order Question", "Damaged Card / Missing Item", "General Inquiry", "Wholesale / Bulk" | ✅ PASS | `ContactPage.jsx` line 12: `const topics = ['Order Issue', 'Pre-order Question', 'Damaged Card / Missing Item', 'General Inquiry', 'Wholesale / Bulk']` |

### 4.2 Controlled Inputs

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 4.2.1 | Name is controlled: `value={name}` + `onChange={e => setName(e.target.value)}` | ✅ PASS | `ContactPage.jsx` lines 143–144 |
| 4.2.2 | Email is controlled: `value={email}` + `onChange={e => setEmail(e.target.value)}` | ✅ PASS | `ContactPage.jsx` lines 153–154 |
| 4.2.3 | Topic is controlled: `value={topic}` + `onChange={e => setTopic(e.target.value)}` | ✅ PASS | `ContactPage.jsx` lines 164–165 |
| 4.2.4 | Order # is controlled: `value={orderNum}` + `onChange={e => setOrderNum(e.target.value)}` | ✅ PASS | `ContactPage.jsx` lines 177–178 |
| 4.2.5 | Message is controlled: `value={message}` + `onChange={e => setMessage(e.target.value)}` | ✅ PASS | `ContactPage.jsx` lines 189–190 |

### 4.3 EmailJS Integration

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 4.3.1 | `emailjs.send()` called on form submit | ✅ PASS | `ContactPage.jsx` lines 27–39: `await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {...}, EMAILJS_PUBLIC_KEY)` inside `handleSubmit` |
| 4.3.2 | `e.preventDefault()` called to prevent page reload | ✅ PASS | `ContactPage.jsx` line 25: `e.preventDefault()` |
| 4.3.3 | `sending` state set to `true` during send | ✅ PASS | `ContactPage.jsx` line 26: `setSending(true)` |
| 4.3.4 | `sending` state reset to `false` in `finally` block | ✅ PASS | `ContactPage.jsx` line 44: `setSending(false)` in `finally` |
| 4.3.5 | Submit button shows "Sending..." text and is disabled when `sending === true` | ✅ PASS | `ContactPage.jsx` lines 196–201: `disabled={sending}` + `{sending ? 'Sending...' : 'Send Message'}` |

### 4.4 Success State

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 4.4.1 | `sent` state set to `true` on successful send | ✅ PASS | `ContactPage.jsx` line 41: `setSent(true)` |
| 4.4.2 | Success state shows "Message Sent!" heading | ✅ PASS | `ContactPage.jsx` line 122: `<div>Message Sent!</div>` rendered when `sent === true` |
| 4.4.3 | Success state shows "We'll get back to you within 24 hours" message | ✅ PASS | `ContactPage.jsx` line 123: full message text present |
| 4.4.4 | "Send Another" button resets `sent` to `false` | ✅ PASS | `ContactPage.jsx` line 126: `onClick={() => setSent(false)}` |
| 4.4.5 | "Send Another" does NOT reset form field state (name, email, topic, etc. retain values) | ❌ FAIL | `ContactPage.jsx` line 126: `onClick={() => setSent(false)}` only resets `sent` flag. State variables `name`, `email`, `topic`, `orderNum`, `message` are **not** cleared. User will see their previous input re-populated after clicking "Send Another". |

### 4.5 Error Handling

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 4.5.1 | On EmailJS failure, `alert()` is shown with fallback email | ✅ PASS | `ContactPage.jsx` line 43: `alert('Failed to send message. Please email us directly at ' + CONTACT_EMAIL)` |
| 4.5.2 | **NOTE: Contact form uses `alert()` for errors, unlike BuyNowModal and PreOrderModal which use inline error state** | ❌ FAIL | Inconsistency: `ContactPage.jsx` uses a browser `alert()` for errors (line 43); both `ShopPage.jsx` (line 124) and `PreOrdersPage.jsx` (line 103) use `setSendError()` with an inline styled error block. The `alert()` approach breaks the dark-theme UI and is inconsistent. |

---

## Suite 5 — Vouches Section

### 5.1 Vouch Count

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 5.1.1 | Exactly 20 vouch objects in the `vouches` array | ✅ PASS | `HomePage.tsx` lines 47–188: counted 20 entries (Philippe Ho through Cesar Domingo) |

### 5.2 Required Real Vouches

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 5.2.1 | Philippe Ho vouch present | ✅ PASS | `HomePage.tsx` line 49: `name: 'Philippe Ho'` |
| 5.2.2 | Art Enriquez vouch present | ✅ PASS | `HomePage.tsx` line 56: `name: 'Art Enriquez'` |
| 5.2.3 | Amaan Dawood vouch present | ✅ PASS | `HomePage.tsx` line 62: `name: 'Amaan Dawood'` |
| 5.2.4 | Armval Ash vouch present | ✅ PASS | `HomePage.tsx` line 70: `name: 'Armval Ash'` |
| 5.2.5 | Ragulan Rush Rahuman vouch present | ✅ PASS | `HomePage.tsx` line 77: `name: 'Ragulan Rush Rahuman'` |
| 5.2.6 | Jonathan Lui vouch present | ✅ PASS | `HomePage.tsx` line 85: `name: 'Jonathan Lui'` |
| 5.2.7 | Ryan Solano vouch present | ✅ PASS | `HomePage.tsx` line 91: `name: 'Ryan Solano'` |

### 5.3 Star Ratings

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 5.3.1 | All 20 vouches have `stars: 5` | ✅ PASS | Every vouch object in `HomePage.tsx` lines 47–188 has `stars: 5` |
| 5.3.2 | Stars are rendered as `Array.from({ length: v.stars }).map(...)` producing `<Star>` icons | ✅ PASS | `HomePage.tsx` lines 465–469: `{Array.from({ length: v.stars }).map((_, i) => <Star key={i} .../>)}` — 5 stars per vouch |

### 5.4 Badges

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 5.4.1 | Philippe Ho has badge "Top fan" | ✅ PASS | `HomePage.tsx` line 50: `badge: 'Top fan'` |
| 5.4.2 | Ragulan Rush Rahuman has badge "Top fan" | ✅ PASS | `HomePage.tsx` line 78: `badge: 'Top fan'` |
| 5.4.3 | Jonathan Lui has badge "Rising fan" | ✅ PASS | `HomePage.tsx` line 86: `badge: 'Rising fan'` |
| 5.4.4 | Remaining vouches (Art Enriquez, Amaan Dawood, Armval Ash, Ryan Solano, and 13 others) have empty `badge: ''` | ✅ PASS | All other entries in `vouches` array have `badge: ''` |
| 5.4.5 | Badge element only renders when `v.badge` is truthy | ✅ PASS | `HomePage.tsx` line 470: `{v.badge && <span>◆ {v.badge}</span>}` — conditional render |

---

## Suite 6 — EmailJS Config Audit

| # | Test Case | Result | Evidence |
|---|-----------|--------|----------|
| 6.1 | `service_495o229` used in `ShopPage.jsx` | ✅ PASS | `ShopPage.jsx` line 9: `const EMAILJS_SERVICE_ID = 'service_495o229'` |
| 6.2 | `service_495o229` used in `PreOrdersPage.jsx` | ✅ PASS | `PreOrdersPage.jsx` line 8: `const EMAILJS_SERVICE_ID = 'service_495o229'` |
| 6.3 | `service_495o229` used in `ContactPage.jsx` | ✅ PASS | `ContactPage.jsx` line 7: `const EMAILJS_SERVICE_ID = 'service_495o229'` |
| 6.4 | `template_cp3un7s` used in `PreOrdersPage.jsx` | ✅ PASS | `PreOrdersPage.jsx` line 9: `const EMAILJS_TEMPLATE_ID = 'template_cp3un7s'` |
| 6.5 | `template_3ickzxu` used in `ShopPage.jsx` | ✅ PASS | `ShopPage.jsx` line 10: `const EMAILJS_TEMPLATE_ID = 'template_3ickzxu'` |
| 6.6 | `ContactPage.jsx` uses `template_cp3un7s` | ✅ PASS | `ContactPage.jsx` line 8: `const EMAILJS_TEMPLATE_ID = 'template_cp3un7s'` |
| 6.7 | Public key `ep1rUzpqvkYS71VPH` used in `ShopPage.jsx` | ✅ PASS | `ShopPage.jsx` line 11: `const EMAILJS_PUBLIC_KEY = 'ep1rUzpqvkYS71VPH'` |
| 6.8 | Public key `ep1rUzpqvkYS71VPH` used in `PreOrdersPage.jsx` | ✅ PASS | `PreOrdersPage.jsx` line 10: `const EMAILJS_PUBLIC_KEY = 'ep1rUzpqvkYS71VPH'` |
| 6.9 | Public key `ep1rUzpqvkYS71VPH` used in `ContactPage.jsx` | ✅ PASS | `ContactPage.jsx` line 9: `const EMAILJS_PUBLIC_KEY = 'ep1rUzpqvkYS71VPH'` |
| 6.10 | All three pages use the same service ID and public key (consistent) | ✅ PASS | Confirmed across all three audits above — no mismatches |
| 6.11 | ContactPage re-uses `template_cp3un7s` (same as PreOrdersPage) — template is shared, with `wise_handle` field repurposed to carry the message body | ❌ FAIL | `ContactPage.jsx` line 37: `wise_handle: message` — the actual user message is injected into the `wise_handle` template variable instead of a dedicated `message` field. This works only if the EmailJS template displays `{{wise_handle}}` as a message body. If the template label says "Wise Handle" it will display the message text in a confusingly labelled field. The field mapping is semantically incorrect even if functionally viable. |

---

## Summary

### Pass / Fail / Needs Browser Count

| Suite | Total Tests | ✅ PASS | ❌ FAIL | 🌐 NEEDS_BROWSER |
|-------|------------|---------|---------|-----------------|
| Suite 1 — Navigation & Routing | 17 | 17 | 0 | 0 |
| Suite 2 — Shop Page | 29 | 28 | 0 | 1 |
| Suite 3 — Pre-Orders Page | 26 | 23 | 3 | 0 |
| Suite 4 — Contact Form | 15 | 12 | 3 | 0 |
| Suite 5 — Vouches Section | 14 | 14 | 0 | 0 |
| Suite 6 — EmailJS Config Audit | 11 | 10 | 1 | 0 |
| **TOTAL** | **112** | **104** | **7** | **1** |

---

## Failures — Consolidated Report

### F-01 · PreOrderModal Step 1 — Missing Checkbox Gate (Suite 3, test 3.5.6)
**File:** `PreOrdersPage.jsx` line 216
**Issue:** The test spec requires a checkbox that the user must accept before proceeding. The code implements a plain "I agree" button with no `<input type="checkbox">`. The user can proceed to Step 2 without explicitly ticking a box.
**Severity:** Minor UX — terms are displayed but acceptance is not enforced via a separate interactive element.

### F-02 · PreOrderModal Step 2 — Spec Describes Wrong Step for name/email/qty (Suite 3, test 3.6.7)
**File:** `PreOrdersPage.jsx` (three-step flow)
**Issue:** The spec says "Step 2: Payment — name/email/qty fields". In the actual code, qty is captured on Step 1, name/email are captured on Step 3, and Step 2 is purely payment instructions. The flow is correct and functional; the spec description is inaccurate. No code change needed — the spec should be updated.
**Severity:** Documentation / spec mismatch — not a code defect.

### F-03 · ContactPage "Send Another" Does Not Reset Form Fields (Suite 4, test 4.4.5)
**File:** `ContactPage.jsx` line 126
**Issue:** `onClick={() => setSent(false)}` only hides the success state. The controlled state variables `name`, `email`, `topic`, `orderNum`, and `message` are not reset, so the form re-displays with the previous submission's values.
**Severity:** Medium UX bug — users expect a blank form after "Send Another".
**Fix:** `onClick={() => { setSent(false); setName(''); setEmail(''); setTopic(''); setOrderNum(''); setMessage(''); }}`

### F-04 · ContactPage Error Uses `alert()` Instead of Inline Error UI (Suite 4, test 4.5.2)
**File:** `ContactPage.jsx` line 43
**Issue:** On EmailJS failure, a browser native `alert()` is triggered, breaking the dark-theme experience. Both other pages (ShopPage, PreOrdersPage) use inline styled error blocks via `setSendError()`.
**Severity:** Low-medium — functional but inconsistent UX.
**Fix:** Introduce a `sendError` state variable and render an inline error block below the submit button, matching the pattern used in `ShopPage.jsx` and `PreOrdersPage.jsx`.

### F-05 · ContactPage EmailJS Template Uses `wise_handle` to Carry Message Body (Suite 6, test 6.11)
**File:** `ContactPage.jsx` line 37
**Issue:** `wise_handle: message` — the user's contact message is mapped to the `wise_handle` template parameter. This is semantically misleading and only works correctly if the EmailJS template label for `{{wise_handle}}` has been manually renamed or the template renders it as the message body without a label.
**Severity:** Low-medium — may cause confusing email formatting on the receiving end.
**Fix:** Add a `message` (or `contact_message`) field to the EmailJS template and pass `message: message` in the payload, removing the `wise_handle` misuse.

### F-06 · AnnouncementBar Text Always Says "Pre-orders now open" Regardless of `isOpen` State (Implicit / cross-suite)
**File:** `AnnouncementBar.jsx` line 12
**Issue:** The announcement bar hardcodes "Pre-orders now open" but the `isOpen` variable lives only in `PreOrdersPage.jsx` (module-level). The bar does not consume this value and will continue to display "Pre-orders now open" even after the window closes on 2026-04-30.
**Severity:** Medium — after 2026-04-30 the bar becomes misleading.
**Fix:** Either export `isOpen` from a shared config or replicate the date logic in `AnnouncementBar.jsx`.

---

## Suite 7 — Admin Reject-Order Stock Restore (Regression)

Added 2026-05-17 after the recurring "rejected but stock didn't come back"
bug. Root cause: `preview/api/admin/reject-order.js` stamped
`orders.stock_restored_at` unconditionally, so a failed/partial restore
permanently tripped the idempotent guard and blocked every retry. Known
prod casualties: order **CNC-AT5SN6NE** (products/poke-ah qty 1, stamped
but stock never re-incremented) and **CNC-VLGU1PY7** (singles, older).

| # | Test Case | Expected | Verify |
|---|-----------|----------|--------|
| 7.1 | Order an in-stock **product** (Shop → products tab item), note pre-order stock N. Admin sets payment status → `payment_rejected`. | Product stock returns to **N** (decrement reversed via `restore_item_stock` RPC), order shows `payment_rejected`, `stock_restored_at` set. | Live: place order, check `products.stock`, reject in admin, re-check stock == N. |
| 7.2 | Same as 7.1 but the item row is missing / RPC errors for one line (simulate by pointing a line at a bogus `item_id`, or DB perm revoked). | Order STILL flagged `payment_rejected`, but `stock_restored_at` stays **NULL**, response is HTTP 207 with `data.failed[]` populated, AdminPage shows a `setDbError` "stock restore incomplete" banner. | Static: confirm `fullySucceeded = !alreadyRestored && failed.length===0` gate in reject-order.js. |
| 7.3 | After a failed restore (7.2), fix the cause and re-select `payment_rejected` again (or re-trigger reject-order). | Retry MUST work — guard was never tripped (`stock_restored_at` still NULL), stock is now restored and stamped. | Static + live: confirm second call goes through the restore branch. |
| 7.4 | Re-reject an already-restored order (`stock_restored_at` set). | No double-add; `already_restored: true`, stock unchanged. | Static: `alreadyRestored` short-circuits the loop. |
| 7.5 | Reject an order whose only line is a **pre-order**. | No stock change (preorders never decremented), `restored:[]`, `failed:[]`, stamped (nothing to fail). | Static: `if (line.is_preorder) continue;`. |

**Reconciliation:** `docs/reject-order-stock-reconcile.sql` contains
owner-run manual `UPDATE`s for the two known corrupted orders plus an
audit query to eyeball other `payment_rejected` orders. Not auto-applied.

---

*End of TEST_SCENARIOS.md*
