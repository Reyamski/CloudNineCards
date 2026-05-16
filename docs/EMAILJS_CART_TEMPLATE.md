# EmailJS Cart Receipt Templates — Setup

The cart checkout (`preview/src/pages/CartPage.jsx`) sends a separate
receipt **per business flow** — one email for the in-stock half, one for
the pre-order half. A mixed cart yields TWO orders rows and TWO receipt
emails (each delivered to both owner and buyer, so up to four sends total).

Two EmailJS templates are wired in:

| Env var                            | Used by                              |
| ---------------------------------- | ------------------------------------ |
| `VITE_EMAILJS_TEMPLATE_ONHAND`     | In-stock receipts (singles + sealed) |
| `VITE_EMAILJS_TEMPLATE_PREORDER`   | Pre-order receipts                   |

If `VITE_EMAILJS_TEMPLATE_PREORDER` is unset, the code falls back to the
ONHAND template and logs a console warning. Both env vars already live
in `preview/.env.example` so a fresh checkout doesn't need any new keys.

## ONHAND template — required dashboard change

The in-stock receipt is the same shape the cart used pre-Wave-3b:
itemized table + Canadian shipping/tax breakdown.

1. Open EmailJS dashboard → the template bound to
   `VITE_EMAILJS_TEMPLATE_ONHAND`.
2. In the **HTML body**, render the itemized table:

   ```html
   <h3>Items</h3>
   {{{items_html}}}
   ```

   Triple braces (`{{{items_html}}}`) — double braces escape the HTML
   into a literal `&lt;table&gt;` blob.

3. Plain-text fallback:

   ```text
   Items:
   {{items_text}}
   ```

4. Surface totals (all standard `{{var}}` interpolation):

   ```html
   <p>Subtotal: {{subtotal}}</p>
   <p>Shipping ({{delivery_country}}): {{delivery_fee}}</p>
   <p>Tax: {{tax_amount}}</p>
   <p><strong>Paid now: {{total_price}}</strong></p>
   ```

## PREORDER template — required dashboard change

The pre-order receipt has its own slot set so the buyer sees the
deposit + balance breakdown clearly.

1. Open the template bound to `VITE_EMAILJS_TEMPLATE_PREORDER`.
2. Render the items table the same way:

   ```html
   <h3>Pre-order items</h3>
   {{{items_html}}}
   ```

3. Surface the deposit / balance pair:

   ```html
   <p><strong>Pre-order subtotal:</strong> {{full_price}}</p>
   <p><strong>30% deposit paid now:</strong> {{dp_amount}}</p>
   <p><strong>70% balance + intl shipping due on release:</strong> {{balance_due}}</p>
   <p><strong>ETA:</strong> {{eta}}</p>
   <p style="color:#a855f7;">{{preorder_note}}</p>
   ```

   `delivery_fee` and `tax_amount` are sent as the literal strings
   `"Intl rates — calculated at release"` / `"Calculated at release"`
   for the pre-order receipt — no shipping or tax is charged at
   checkout time.

## Full variable list

### ONHAND receipt (in-stock items)

| Variable             | Example                                                |
| -------------------- | ------------------------------------------------------ |
| `order_number`       | `CNC-9XK4R5Q2`                                         |
| `buyer_name` / `buyer_email` / `buyer_phone` / `buyer_address` | buyer info |
| `delivery_country` / `delivery_province` | shipping target |
| `item_title`         | `3 items` (placeholder for legacy single-item rows)    |
| `quantity`           | Sum of in-stock qtys                                   |
| `items_html`         | `<table>...</table>` — **render with triple braces**   |
| `items_text`         | Plain-text fallback                                    |
| `subtotal`           | `CAD $75.00`                                           |
| `instock_subtotal`   | Same as subtotal for ONHAND receipt                    |
| `tax_amount`         | `CAD $8.45 (GST + PST)` or `N/A`                       |
| `delivery_fee`       | `CAD $6.00` or `FREE (Canada $100+)`                   |
| `total_price`        | `CAD $89.45` — total paid now                          |
| `has_preorder`       | `NO`                                                   |
| `preorder_note`      | empty                                                  |
| `due_on_release`     | `N/A`                                                  |
| `wise_handle` / `notes` / `payment_proof` | as before                          |
| `to_email`           | owner or buyer, routes the message                     |

### PREORDER receipt (pre-order items)

| Variable             | Example                                                |
| -------------------- | ------------------------------------------------------ |
| `order_number`       | `CNC-9XK4R5Q2-B` (suffix for split carts)              |
| Buyer / shipping fields | same as ONHAND                                      |
| `item_title`         | `2 pre-orders` (placeholder)                           |
| `items_html` / `items_text` | as before                                       |
| `full_price`         | `CAD $200.00` — full pre-order subtotal                |
| `dp_amount`          | `CAD $60.00` — 30% deposit paid now                    |
| `balance_due`        | `CAD $140.00 + intl shipping`                          |
| `eta`                | Item ETA string, `Multiple ETAs — see items`, or `TBA` |
| `tax_amount`         | `Calculated at release`                                |
| `delivery_fee`       | `Intl rates — calculated at release`                   |
| `total_price`        | `CAD $60.00 (30% deposit)`                             |
| `has_preorder`       | `YES`                                                  |
| `preorder_note`      | `Pre-order items ship internationally when released. 70% balance + shipping due at that time.` |
| `due_on_release`     | `CAD $140.00 + intl shipping`                          |
| `wise_handle` / `notes` / `payment_proof` | as before                          |

## Verification checklist

1. Place an in-stock-only cart order → exactly **2 emails** arrive
   (owner + buyer), both rendered from the ONHAND template, items
   table populated correctly.
2. Place a pre-order-only cart order → exactly **2 emails** from the
   PREORDER template; deposit / balance / ETA fields populated.
3. Place a **mixed cart** (in-stock + pre-order) → exactly **4 emails**:
   2 from ONHAND (paid-now half) + 2 from PREORDER (deposit half),
   each linking to its own `CNC-…-A` / `CNC-…-B` order number.
4. Temporarily unset `VITE_EMAILJS_TEMPLATE_PREORDER` → pre-order receipt
   should still send (using the ONHAND template) and the browser console
   should log `VITE_EMAILJS_TEMPLATE_PREORDER not set — falling back to
   ONHAND template…`.
