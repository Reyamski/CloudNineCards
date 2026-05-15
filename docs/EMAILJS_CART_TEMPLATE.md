# EmailJS Cart Receipt Template — Setup

The cart checkout (`preview/src/pages/CartPage.jsx`) sends one EmailJS message
per order — to the **owner** and to the **buyer**. Both emails reuse the
existing template (`VITE_EMAILJS_TEMPLATE_ONHAND`), so the template needs to be
updated in the EmailJS dashboard once to render the multi-item receipt
correctly.

## Required dashboard change

1. Open the EmailJS dashboard → Email Templates → the template currently bound
   to `VITE_EMAILJS_TEMPLATE_ONHAND`.
2. In the **HTML body** of the template, replace the previous single-item block
   (e.g. "Item: {{item_title}} — Qty {{quantity}}") with a slot that renders
   the itemized table the app builds for us:

   ```html
   <h3>Items</h3>
   {{{items_html}}}
   ```

   Note the **triple braces** (`{{{items_html}}}`) — EmailJS escapes HTML by
   default with double braces. Triple braces render the value raw. Without the
   triple braces, the table will display as escaped text.

3. (Optional, plain-text fallback for clients that don't render HTML.) In the
   plain-text body, add:

   ```text
   Items:
   {{items_text}}
   ```

4. Below the items, surface the pre-order context if the cart mixed in
   pre-order rows:

   ```html
   {{#if has_preorder}}
   <p style="color:#a855f7;font-weight:700;">{{preorder_note}}</p>
   <p>Due now: {{total_price}}<br>Due on release: {{due_on_release}}</p>
   {{/if}}
   ```

   (Use whatever conditional syntax your EmailJS plan supports — the simplest
   alternative is to always show `{{preorder_note}}` and `{{due_on_release}}`;
   they're populated as `''` / `N/A` when no pre-order is in the cart, so
   leaving them visible only adds two blank rows when irrelevant.)

5. Keep the existing shipping / tax / Wise / contact fields — they're still
   sent unchanged.

## Full variable list (sent by `CartPage.jsx`)

| Variable             | Example                                                | Notes |
| -------------------- | ------------------------------------------------------ | ----- |
| `order_number`       | `CNC-9XK4R5Q2`                                         | |
| `buyer_name`         | `Reyam Castillo`                                       | |
| `buyer_email`        | `buyer@example.com`                                    | |
| `buyer_phone`        | `+1 250 555 0123`                                      | |
| `buyer_address`      | `123 Main St, Vancouver BC, V5K 1A1`                   | |
| `item_title`         | `3 items — see order_items`                            | Placeholder for legacy single-item template lines. |
| `item_subtitle`      | `3 items`                                              | |
| `quantity`           | `5`                                                    | Total qty across all lines. |
| `items_html`         | `<table>...</table>`                                   | **Raw HTML — render with `{{{items_html}}}`.** |
| `items_text`         | `Card A × 2 — CAD $40.00\nCard B × 1 — CAD $25.00`     | Plain-text fallback. |
| `has_preorder`       | `YES` or `NO`                                          | |
| `preorder_note`      | `Cart contains pre-order items …`                      | Empty string when no pre-order in cart. |
| `subtotal`           | `CAD $75.00`                                           | In-stock + pre-order combined. |
| `instock_subtotal`   | `CAD $65.00`                                           | |
| `preorder_subtotal`  | `CAD $10.00`                                           | |
| `tax_amount`         | `CAD $8.45 (GST + PST)` or `N/A`                       | |
| `delivery_fee`       | `CAD $6.00` or `FREE (Canada $100+)`                   | |
| `delivery_country`   | `Canada`                                               | |
| `delivery_province`  | `British Columbia` or `N/A`                            | |
| `total_price`        | `CAD $79.45`                                           | "Due now" — in-stock + shipping + tax. |
| `due_on_release`     | `CAD $10.00` or `N/A`                                  | Pre-order total — billed later. |
| `payment_proof`      | `Not provided — buyer will email separately`           | Cart flow does not collect proof yet. |
| `wise_handle`        | `@cloudninecards`                                      | |
| `notes`              | `(none)` or whatever the buyer typed                   | |
| `to_email`           | `papspective@gmail.com` or buyer's email               | EmailJS routing field. |

## Verification checklist after updating the template

1. Place a test order from `/cart` with **one in-stock item** → confirm the
   email shows a one-row table with the right qty and line total.
2. Place a test order with **two in-stock + one pre-order item** → confirm
   the table shows all three rows, the pre-order line has the `[PRE-ORDER]`
   marker, and the "Due on release" line appears below the table.
3. Confirm the **buyer copy** is delivered to the buyer's email (not just the
   owner's). EmailJS routes by the `to_email` variable.

If anything renders as escaped HTML literal (`&lt;table&gt;`), the template is
still using double braces — switch the `items_html` slot to triple braces.
