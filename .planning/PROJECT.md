# Cloud Nine Cards — Shopify TCG Store

## What This Is

A redesigned storefront for cloudninecards.ca — a Canadian TCG card shop (One Piece, Dragon Ball Super, Pokémon). Built as a Vite + React preview app with "Dark & Epic" anime TCG theme. Customers browse on-hand products and pre-orders, pay via Wise, and submit payment proof through an order modal. Will be ported to Shopify Hydrogen.

## Core Value

Customers can order TCG products with clear CAD pricing (tax + shipping shown upfront) and submit Wise payment proof without emailing manually.

## Requirements

### Validated

- ✓ Dark & Epic anime TCG theme — Vite + React + Tailwind CSS v4 + framer-motion
- ✓ ShopPage — on-hand Buy Now modal, Wise payment flow, country/province selector
- ✓ PreOrdersPage — 30% DP flow, 3-step modal
- ✓ EmailJS notifications — store owner + buyer copy (both templates)
- ✓ Sequential order numbers: CNC-000001 format via localStorage
- ✓ Canada-origin shipping (Vancouver BC, Canada Post / DHL, 7-tier weight table)
- ✓ WEIGHT_PER_BOX = 1.91kg (DHL volumetric: 29×22×15cm ÷ 5000)
- ✓ Free shipping for Canada orders ≥ CAD $300
- ✓ Provincial tax (GST/HST/PST/QST) per province — shown as label, not raw %
- ✓ Canvas image compression (MAX=300px, iterative quality until <36KB)
- ✓ imgbb upload for payment proof — bypasses Gmail base64 block

### Active

- [ ] imgbb API key — plug into IMGBB_API_KEY constant in ShopPage.jsx + PreOrdersPage.jsx (get at api.imgbb.com)
- [ ] EmailJS templates — confirm `{{{payment_proof}}}` triple braces + `{{to_email}}` in To field
- [ ] Shopify Hydrogen integration — port preview into hydrogen-quickstart/
- [ ] Shopify Admin API agent — product/order management via GraphQL

### Out of Scope

- Philippine DHL rates — store ships from Vancouver, not Philippines
- Mock DB tests — always hit live EmailJS API in QA
- Shopify Admin password apps — use Storefront API / Hydrogen instead

## Context

- **Stack:** Vite + React 19, Tailwind CSS v4, framer-motion, lucide-react, react-router-dom v7
- **EmailJS:** service_495o229 | keys in preview/.env (VITE_EMAILJS_PUBLIC_KEY / VITE_EMAILJS_PRIVATE_KEY)
  - Pass `{ publicKey, privateKey }` as 4th param — "Use Private Key" is ON
  - template_3ickzxu = on-hand (ShopPage) | template_cp3un7s = pre-orders (PreOrdersPage)
- **Payment:** Wise @cloudninecards | Contact: papspective@gmail.com
- **Shopify:** cloudninecards.myshopify.com | hydrogen-quickstart/ ready, needs `shopify hydrogen link`
- **Agents:** C:/Users/Reyam/inbox/*.md — run with `claude --dangerously-skip-permissions`
- **GSD:** installed locally at .claude/ (v1.22.4)

## Constraints

- **EmailJS 50KB limit:** compress image first, upload to imgbb, send URL only
- **Tailwind v4:** no tailwind.config.js — config lives in CSS
- **Windows shell:** inbox file writes use Windows paths, not /mnt/c/

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vite + React preview before Hydrogen | No Shopify credentials at start | ✓ Good |
| EmailJS private key mode | Security — public key alone is exposed | ✓ Good |
| imgbb for payment proof images | Gmail blocks base64 data URLs in img tags | — Pending test |
| Canada Post / DHL from Vancouver | Store ships from Canada, not Philippines | ✓ Good |
| Province label not % in dropdown | Users shouldn't see raw tax numbers | ✓ Good |

---
*Last updated: 2026-03-16 — Phase 2 in progress: Hydrogen scaffolded, agent team set up, inbox tasks ready for data-engineer + developer agents*
