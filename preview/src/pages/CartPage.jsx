import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, ChevronDown, ChevronUp, MessageCircle, Copy, Check } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../lib/useAuth';
import { useToast } from '../components/Toast';
import { supabase, supabaseEnabled } from '../lib/supabase';

// ── Shipping schedule — MUST mirror the published policy ─────────────────────
// Canonical published copy (HomePage.tsx "Tracked Shipping" card):
//   "Every order ships tracked. Canada $24.99 flat (singles, deck packs,
//    sealed). USA $34.99. International from $22. Free shipping in Canada on
//    in-stock orders $300+. Pre-orders pay actual shipping at release."
//
// Final policy (2026-05): ONE unified CA flat rate of $24.99 for ALL in-stock
// items (singles, decks, sealed — same), free at $300+. Empirical BC→Manitoba
// ship cost ~$25 (Canada Post Expedited zone-3 + 37% fuel surcharge); the
// prior $10 singles+decks tier was still losing on heavier deck-pack orders.
// The singles-vs-sealed partitioner is kept as a no-op (function signature
// preserved for future re-introduction of tiered pricing if needed) but the
// returned fee is the same for both buckets below the free-ship threshold.
// Pre-order line items never count toward the free-ship threshold — preorders
// pay actual shipping when released (already filtered to in-stock-only here
// via the singlesDecks/sealed split in CartPage's useMemo).
// USA ($34.99 flat) covers real Canada Post Expedited Parcel USA cost (~$34
// with $100 insurance + tracking) + Wise $3 + packaging $1 ≈ $38 real per
// order; prior $15 was losing ~$23 per US sealed order. Sealed dominates
// for a small-shop flat tier so a single US rate applies to all categories.
// International ($22/$22/$25/$28) flat per the copy and unchanged here.
// Non-Canada destinations never get free shipping.
const SHIP_RATES = {
  'United States':                  34.99,
  'Japan / Korea / HK / Singapore': 22,
  'Australia / NZ / SE Asia':       22,
  'Europe / Middle East':           25,
  'Other International':            28,
};
const CANADA_RATE               = 24.99; // unified flat rate for all in-stock CA carts
const FREE_SHIP_CA_THRESHOLD    = 300;   // any Canadian in-stock cart $300+ ships free
const PREORDER_DEPOSIT_RATE = 0.30; // 30% down at checkout, 70% on release

const COUNTRIES = [
  'Canada',
  'United States',
  'Japan / Korea / HK / Singapore',
  'Australia / NZ / SE Asia',
  'Europe / Middle East',
  'Other International',
];

const PROVINCE_TAX = {
  'Alberta':                 { rate: 0.05,    label: 'GST'       },
  'British Columbia':        { rate: 0.12,    label: 'GST + PST' },
  'Manitoba':                { rate: 0.12,    label: 'GST + PST' },
  'New Brunswick':           { rate: 0.15,    label: 'HST'       },
  'Newfoundland & Labrador': { rate: 0.15,    label: 'HST'       },
  'Nova Scotia':             { rate: 0.15,    label: 'HST'       },
  'Ontario':                 { rate: 0.13,    label: 'HST'       },
  'Prince Edward Island':    { rate: 0.15,    label: 'HST'       },
  'Quebec':                  { rate: 0.14975, label: 'GST + QST' },
  'Saskatchewan':            { rate: 0.11,    label: 'GST + PST' },
  'Northwest Territories':   { rate: 0.05,    label: 'GST'       },
  'Nunavut':                 { rate: 0.05,    label: 'GST'       },
  'Yukon':                   { rate: 0.05,    label: 'GST'       },
};

const WISE_HANDLE   = '@cloudninecards';
const CONTACT_EMAIL = 'papspective@gmail.com';

// Facebook page username discovered from Footer (NoypiPlaya). FB Page usernames
// map to Messenger via m.me/<username>. If the page doesn't have Messenger
// enabled, this opens m.me which gracefully degrades to a "page not found"
// state — at which point the mailto fallback button still works.
const FB_PAGE_USERNAME = 'NoypiPlaya';
const MESSENGER_URL = `https://m.me/${FB_PAGE_USERNAME}`;

const EMAILJS_SERVICE_ID    = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ONHAND   = import.meta.env.VITE_EMAILJS_TEMPLATE_ONHAND;
const EMAILJS_TEMPLATE_PREORDER = import.meta.env.VITE_EMAILJS_TEMPLATE_PREORDER;
const EMAILJS_PUBLIC_KEY    = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Pure/deterministic. `singlesDecksSubtotal` and `sealedSubtotal` are the
// in-stock (non-preorder) line totals split by category:
//   - singles+decks → source==='singles' OR (source==='products' AND
//     id startsWith 'dbp-'). Light-parcel friendly.
//   - sealed        → every other source==='products' (booster boxes, ETBs,
//     accessories — heavy parcel).
// Both are >= 0 numbers using the same price*qty basis as
// totals.subtotalInStock so the math stays consistent. Returns a non-negative
// number (never NaN/undefined).
function calcShipping(country, singlesDecksSubtotal, sealedSubtotal) {
  if (!country) return 0;
  const singlesDecks = Number(singlesDecksSubtotal) || 0;
  const sealed       = Number(sealedSubtotal)        || 0;
  const inStockSubtotal = singlesDecks + sealed;
  if (inStockSubtotal <= 0) return 0; // only pre-orders (or empty) → no shipping

  // Non-Canada: flat per tier from SHIP_RATES, no free-ship.
  if (country !== 'Canada') return SHIP_RATES[country] ?? 28;

  // Canada: ONE unified free-ship threshold across all in-stock categories.
  // Pre-order line items are already excluded upstream (singlesDecksSubtotal
  // and sealedSubtotal only sum !isPreorder items) so they never contribute
  // toward the threshold and never trigger free shipping.
  if (inStockSubtotal >= FREE_SHIP_CA_THRESHOLD) return 0;

  // Below threshold: unified $24.99 flat for ALL in-stock CA carts (singles,
  // decks, sealed — same). The partitioner is kept above as a no-op so the
  // tiered path can be reintroduced later without re-plumbing call sites.
  return CANADA_RATE;
}

function newOrderNumber(suffix = '') {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CNC-${ts.slice(-5)}${rand}${suffix}`;
}

// Build a copy-pasteable cart summary used by the Messenger / email fallbacks.
function buildCartSummary(items, totals) {
  const lines = items.map(it => `• ${it.title} × ${it.qty} — CAD $${(it.price * it.qty).toFixed(2)}${it.isPreorder ? ' (pre-order)' : ''}`);
  return [
    'Hi CloudNineCards! I would like to order:',
    '',
    ...lines,
    '',
    `Subtotal: CAD $${totals.subtotal.toFixed(2)}`,
  ].join('\n');
}

// Itemized HTML table for the EmailJS receipt body.
function buildItemsHtml(items) {
  const rows = items.map(it => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(it.title)}${it.isPreorder ? ' <span style=&quot;color:#a855f7;font-weight:700;font-size:11px;&quot;>[PRE-ORDER]</span>' : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">CAD $${(it.price * it.qty).toFixed(2)}</td>
    </tr>
  `).join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Line Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, removeItem, updateQty, clear, totals } = useCart();
  const { showToast } = useToast();

  // Form state — start prefilled from logged-in user if available.
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [phone, setPhone]     = useState('');
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [postal, setPostal]   = useState('');
  const [notes, setNotes]     = useState('');
  const [preorderAck, setPreorderAck] = useState(false);
  const [errors, setErrors]   = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [liveStock, setLiveStock] = useState({}); // id → number
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [copiedWise, setCopiedWise] = useState(false);

  useEffect(() => { document.title = 'Cart | CloudNineCards'; }, []);

  // Re-sync email if user logs in mid-session.
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  // Prefill shipping fields from the user's most recent order (acts as a
  // lightweight profile — no separate profiles table). Only fills fields the
  // buyer hasn't already touched this session, so re-edits aren't blown away
  // on a focus/auth re-render.
  useEffect(() => {
    if (!user?.email || !supabaseEnabled || !supabase) return;
    let cancelled = false;
    async function loadProfile() {
      const { data } = await supabase
        .from('orders')
        .select('buyer_name, buyer_phone, buyer_address, delivery_country, delivery_province')
        .ilike('buyer_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      setName(prev => prev || data.buyer_name || '');
      setPhone(prev => prev || data.buyer_phone || '');
      setCountry(prev => prev || data.delivery_country || '');
      setProvince(prev => prev || data.delivery_province || '');
      // buyer_address shape depends on how the order was placed:
      //   - new cart flow: "<street>, <postal>" (exactly 2 comma parts)
      //   - legacy buy-modal: free-form textarea, often with city/province/
      //     country/postal all mashed in
      // We can only confidently round-trip the cart shape. For anything else
      // we leave both fields blank — empty beats wrong (which previously
      // leaked "Manitoba" / "Canada" into the address field via a too-loose
      // postal regex). Province has its own column, so it still prefills.
      if (data.buyer_address) {
        const parts = String(data.buyer_address).split(',').map(s => s.trim()).filter(Boolean);
        // Canadian (A1A 1A1) or US ZIP (12345 / 12345-6789) — strict.
        const STRICT_POSTAL = /^([A-Z]\d[A-Z][ -]?\d[A-Z]\d|\d{5}(-\d{4})?)$/i;
        if (parts.length === 2 && STRICT_POSTAL.test(parts[1])) {
          setAddress(prev => prev || parts[0]);
          setPostal(prev => prev || parts[1]);
        }
        // else: legacy/ambiguous — leave address + postal blank.
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [user?.email]);

  // Reset province when country changes off Canada.
  useEffect(() => {
    if (country !== 'Canada' && province) setProvince('');
  }, [country, province]);

  // Fetch live stock once on page load for in-stock items so we can show
  // "Only N left" badges and clamp the qty editor's upper bound.
  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    const ids = {
      singles:  items.filter(it => it.source === 'singles').map(it => it.id),
      products: items.filter(it => it.source === 'products').map(it => it.id),
    };
    let cancelled = false;
    async function load() {
      const next = {};
      if (ids.singles.length) {
        const { data } = await supabase.from('singles').select('id,stock,in_stock').in('id', ids.singles);
        (data ?? []).forEach(r => { next[`singles:${r.id}`] = r.in_stock ? (r.stock ?? 0) : 0; });
      }
      if (ids.products.length) {
        const { data } = await supabase.from('products').select('id,stock,in_stock').in('id', ids.products);
        (data ?? []).forEach(r => { next[`products:${r.id}`] = r.in_stock ? (r.stock ?? 0) : 0; });
      }
      if (!cancelled) setLiveStock(next);
    }
    load();
    return () => { cancelled = true; };
    // Only re-fetch when the set of IDs actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(it => it.key).join('|')]);

  // ── Partition cart into the two business flows ────────────────────────────
  const inStockItems  = useMemo(() => items.filter(it => !it.isPreorder), [items]);
  const preorderItems = useMemo(() => items.filter(it =>  it.isPreorder), [items]);
  const hasInStock    = inStockItems.length > 0;
  const hasPreorder   = preorderItems.length > 0;

  const inStockSubtotal   = totals.subtotalInStock;
  const preorderSubtotal  = totals.subtotalPreorder;

  // Split the in-stock subtotal by category for the tiered Canada shipping
  // rule. Deck-builder packs (source='products' with id prefix 'dbp-') bundle
  // with singles into the lighter "singles+decks" tier because they're small
  // enough for the same light-parcel rate. Every other source='products' row
  // (booster boxes, ETBs, accessories) stays on the heavier "sealed" tier.
  // Same price*qty basis as totals.subtotalInStock (CartContext) so the
  // numbers stay consistent. Guard against undefined ids.
  const { singlesDecksSubtotal, sealedSubtotal } = useMemo(() => {
    let singlesDecksS = 0, sealedS = 0;
    for (const it of inStockItems) {
      const line = (Number(it.price) || 0) * (Number(it.qty) || 0);
      const isDeckPack = it.source === 'products'
        && typeof it.id === 'string'
        && it.id.startsWith('dbp-');
      if (it.source === 'singles' || isDeckPack) singlesDecksS += line;
      else sealedS += line;
    }
    return { singlesDecksSubtotal: singlesDecksS, sealedSubtotal: sealedS };
  }, [inStockItems]);

  const shippingFee       = hasInStock ? calcShipping(country, singlesDecksSubtotal, sealedSubtotal) : 0;
  const taxRate           = country === 'Canada' && province ? (PROVINCE_TAX[province]?.rate ?? 0) : 0;
  const taxLabel          = country === 'Canada' && province ? (PROVINCE_TAX[province]?.label ?? '') : '';
  // Tax applied to in-stock subtotal + shipping (matches existing modal logic).
  // Pre-orders are NOT taxed at checkout — that's collected on release.
  const taxAmount         = hasInStock && country === 'Canada' && province ? (inStockSubtotal + shippingFee) * taxRate : 0;
  const inStockTotal      = hasInStock ? inStockSubtotal + shippingFee + taxAmount : 0;
  const preorderDeposit   = preorderSubtotal * PREORDER_DEPOSIT_RATE;
  const preorderBalance   = preorderSubtotal - preorderDeposit;
  const dueNow            = inStockTotal + preorderDeposit;
  // Derive from calcShipping (single source of truth) so the UI label can
  // never disagree with the charged fee: a Canadian in-stock cart whose
  // computed fee is $0 hit the unified $300+ free-shipping threshold.
  const freeShipApplied   = hasInStock && country === 'Canada' && shippingFee === 0;

  function copyWise() {
    navigator.clipboard.writeText(WISE_HANDLE);
    setCopiedWise(true);
    setTimeout(() => setCopiedWise(false), 2000);
  }

  function validate() {
    const next = {};
    if (!name.trim()) next.name = 'Required';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) next.email = 'Valid email required';
    if (!phone.trim()) next.phone = 'Required';
    if (!country) next.country = 'Required';
    if (country === 'Canada' && !province) next.province = 'Required';
    if (!address.trim()) next.address = 'Required';
    if (!postal.trim()) next.postal = 'Required';
    if (hasPreorder && !preorderAck) next.preorderAck = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSendError('');
    if (items.length === 0) return;

    // Login gate: anon users can browse + fill the form, but Submit Order
    // requires a logged-in account so orders are tied to a real user_id.
    // Round-trip via /account with a redirect hint back to /cart.
    if (!user) {
      navigate('/account', {
        state: {
          redirect: '/cart',
          flash: 'Please sign in or create an account to place your order.',
        },
      });
      return;
    }

    if (!validate()) {
      const firstErrEl = document.querySelector('[data-form-error="true"]');
      firstErrEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSending(true);

    // Two order numbers — only used when both branches are present. Single-
    // flow carts use a clean CNC-XXX (no suffix) to match prior UX.
    const orderNumberInStock = hasInStock ? newOrderNumber(hasPreorder ? '-A' : '') : null;
    const orderNumberPreorder = hasPreorder ? newOrderNumber(hasPreorder && hasInStock ? '-B' : '') : null;

    try {
      if (!supabaseEnabled || !supabase) throw new Error('Live orders are not configured yet.');

      const sharedBuyerFields = {
        buyer_name:        name,
        buyer_email:       email.trim().toLowerCase(),
        buyer_phone:       phone,
        buyer_address:     [address, postal].filter(Boolean).join(', '),
        delivery_country:  country,
        delivery_province: province || null,
        wise_handle:       WISE_HANDLE,
        customer_user_id:  user?.id ?? null,
      };

      // ── In-stock order payload (full payment due now) ─────────────────
      let inStockPayload = null;
      let inStockItemsPayload = [];
      if (hasInStock) {
        const placeholderTitle = inStockItems.length === 1
          ? inStockItems[0].title
          : `${inStockItems.length} items — see order_items`;
        const inStockQty = inStockItems.reduce((s, it) => s + it.qty, 0);
        inStockPayload = {
          ...sharedBuyerFields,
          order_number:    orderNumberInStock,
          order_type:      'cart',
          status:          'pending',
          payment_status:  'awaiting_payment',
          product_id:      inStockItems.length === 1 ? inStockItems[0].id : 'MULTI',
          product_title:   placeholderTitle,
          item_title:      placeholderTitle,
          quantity:        inStockQty,
          subtotal:        inStockSubtotal,
          tax_amount:      taxAmount,
          delivery_fee:    shippingFee,
          total_price:     inStockTotal,
          full_price:      inStockTotal,
        };
        inStockItemsPayload = inStockItems.map(it => ({
          source_table:   it.source,
          item_id:        it.id,
          qty:            it.qty,
          unit_price:     it.price,
          title_snapshot: it.title,
          image_snapshot: it.image ?? null,
          is_preorder:    false,
        }));
      }

      // ── Pre-order payload (30% deposit now, 70% + intl shipping on release) ──
      let preorderPayload = null;
      let preorderItemsPayload = [];
      if (hasPreorder) {
        const placeholderTitle = preorderItems.length === 1
          ? preorderItems[0].title
          : `${preorderItems.length} pre-orders — see order_items`;
        const preorderQty = preorderItems.reduce((s, it) => s + it.qty, 0);
        // ETA from items — single item carries its own; mixed shows "Multiple".
        const distinctEtas = Array.from(new Set(preorderItems.map(it => it.etaText).filter(Boolean)));
        const etaValue = distinctEtas.length === 1 ? distinctEtas[0]
                       : distinctEtas.length > 1 ? 'Multiple'
                       : '';
        // NOTE: the `orders` table has NOT NULL constraints on several numeric
        // columns (delivery_fee, tax_amount, etc.). Preorder shipping + tax are
        // genuinely TBD at checkout (computed on release), but the DB still
        // wants a number, so we send `0` placeholders that admin updates when
        // the preorder ships. Do not send `null` for these — RPC will fail
        // with 23502.
        preorderPayload = {
          ...sharedBuyerFields,
          order_number:    orderNumberPreorder,
          order_type:      'pre_order',
          status:          'pending',
          payment_status:  'awaiting_payment',
          product_id:      preorderItems.length === 1 ? preorderItems[0].id : 'MULTI',
          product_title:   placeholderTitle,
          item_title:      placeholderTitle,
          quantity:        preorderQty,
          subtotal:        preorderSubtotal,
          tax_amount:      0,                  // tax billed on release — placeholder
          delivery_fee:    0,                  // intl shipping computed on release — placeholder
          total_price:     preorderDeposit,    // "due now" portion (30% deposit)
          full_price:      preorderSubtotal,
          dp_amount:       preorderDeposit,
          balance_due:     preorderBalance,
          eta:             etaValue,
        };
        preorderItemsPayload = preorderItems.map(it => ({
          source_table:   it.source,
          item_id:        it.id,
          qty:            it.qty,
          unit_price:     it.price,
          title_snapshot: it.title,
          image_snapshot: it.image ?? null,
          is_preorder:    true,
        }));
      }

      // Single atomic RPC inserts both orders + all order_items rows in one
      // transaction (see docs/wave3b-split-orders.sql).
      const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_cart_orders_v2', {
        in_stock_payload: inStockPayload,
        in_stock_items:   inStockItemsPayload,
        preorder_payload: preorderPayload,
        preorder_items:   preorderItemsPayload,
      });
      if (rpcError) throw rpcError;
      const inStockOrderId = rpcResult?.in_stock_order_id || null;
      const preorderOrderId = rpcResult?.preorder_order_id || null;
      if (hasInStock && !inStockOrderId) throw new Error('In-stock order RPC returned no id.');
      if (hasPreorder && !preorderOrderId) throw new Error('Pre-order RPC returned no id.');

      // Stock decrement now happens INSIDE submit_cart_orders_v2 (same
      // transaction as the order insert) and the order is auto-flagged
      // 'stock_check_failed' there if a line can't be decremented. The
      // standalone decrement / mark-failed RPCs are no longer anon-callable
      // (see docs/vuln-rpc-hardening.sql) — nothing to do here.

      // ── EmailJS receipts (one per order, dual templates) ─────────────
      const baseSharedVars = {
        buyer_name:        name,
        buyer_email:       email,
        buyer_phone:       phone,
        buyer_address:     [address, postal].filter(Boolean).join(', '),
        delivery_country:  country,
        delivery_province: province || 'N/A',
        wise_handle:       WISE_HANDLE,
        notes:             notes || '(none)',
        payment_proof:     'Not provided — buyer will email separately',
      };

      // -- In-stock receipt --
      if (hasInStock) {
        const inStockHtml  = buildItemsHtml(inStockItems);
        const inStockText  = inStockItems.map(it => `${it.title} × ${it.qty} — CAD $${(it.price * it.qty).toFixed(2)}`).join('\n');
        const inStockVars  = {
          ...baseSharedVars,
          order_number:      orderNumberInStock,
          item_title:        inStockItems.length === 1 ? inStockItems[0].title : `${inStockItems.length} items`,
          item_subtitle:     `${inStockItems.length} ${inStockItems.length === 1 ? 'item' : 'items'}`,
          quantity:          inStockItems.reduce((s, it) => s + it.qty, 0),
          items_html:        inStockHtml,
          items_text:        inStockText,
          has_preorder:      'NO',
          preorder_note:     '',
          subtotal:          `CAD $${inStockSubtotal.toFixed(2)}`,
          instock_subtotal:  `CAD $${inStockSubtotal.toFixed(2)}`,
          preorder_subtotal: 'N/A',
          tax_amount:        taxAmount > 0 ? `CAD $${taxAmount.toFixed(2)} (${taxLabel})` : 'N/A',
          delivery_fee:      freeShipApplied ? 'FREE (Canada free-ship threshold met)' : `CAD $${shippingFee.toFixed(2)}`,
          total_price:       `CAD $${inStockTotal.toFixed(2)}`,
          due_on_release:    'N/A',
        };
        await sendEmailSafe(EMAILJS_TEMPLATE_ONHAND, { ...inStockVars, to_email: CONTACT_EMAIL });
        await sendEmailSafe(EMAILJS_TEMPLATE_ONHAND, { ...inStockVars, to_email: email.trim() });
      }

      // -- Pre-order receipt (use PREORDER template; fall back to ONHAND) --
      if (hasPreorder) {
        const preorderHtml = buildItemsHtml(preorderItems);
        const preorderText = preorderItems.map(it => `${it.title} × ${it.qty} — CAD $${(it.price * it.qty).toFixed(2)} [PRE-ORDER]`).join('\n');
        const distinctEtas = Array.from(new Set(preorderItems.map(it => it.etaText).filter(Boolean)));
        const etaValue     = distinctEtas.length === 1 ? distinctEtas[0]
                           : distinctEtas.length > 1 ? 'Multiple ETAs — see items'
                           : 'TBA';
        const preorderVars = {
          ...baseSharedVars,
          order_number:      orderNumberPreorder,
          item_title:        preorderItems.length === 1 ? preorderItems[0].title : `${preorderItems.length} pre-orders`,
          item_subtitle:     `${preorderItems.length} ${preorderItems.length === 1 ? 'pre-order' : 'pre-orders'}`,
          quantity:          preorderItems.reduce((s, it) => s + it.qty, 0),
          items_html:        preorderHtml,
          items_text:        preorderText,
          has_preorder:      'YES',
          preorder_note:     'Pre-order items ship when released. 70% balance + actual shipping due at that time.',
          subtotal:          `CAD $${preorderSubtotal.toFixed(2)}`,
          full_price:        `CAD $${preorderSubtotal.toFixed(2)}`,
          dp_amount:         `CAD $${preorderDeposit.toFixed(2)}`,
          balance_due:       `CAD $${preorderBalance.toFixed(2)} + actual shipping`,
          eta:               etaValue,
          tax_amount:        'Calculated at release',
          delivery_fee:      'Calculated at release',
          total_price:       `CAD $${preorderDeposit.toFixed(2)} (30% deposit)`,
          due_on_release:    `CAD $${preorderBalance.toFixed(2)} + actual shipping`,
        };
        const preorderTemplate = EMAILJS_TEMPLATE_PREORDER || EMAILJS_TEMPLATE_ONHAND;
        if (!EMAILJS_TEMPLATE_PREORDER) {
          console.warn('VITE_EMAILJS_TEMPLATE_PREORDER not set — falling back to ONHAND template for preorder receipt.');
        }
        await sendEmailSafe(preorderTemplate, { ...preorderVars, to_email: CONTACT_EMAIL });
        await sendEmailSafe(preorderTemplate, { ...preorderVars, to_email: email.trim() });
      }

      // ── Hand off to confirmation page ────────────────────────────────
      const buildLines = (arr) => arr.map(it => ({
        title: it.title, qty: it.qty, price: it.price, isPreorder: !!it.isPreorder,
      }));
      clear();
      navigate('/order-confirmation', {
        state: {
          // Multi-order hand-off
          orders: [
            hasInStock && {
              kind: 'in_stock',
              orderNumber: orderNumberInStock,
              lines: buildLines(inStockItems),
              subtotal: inStockSubtotal,
              shippingFee,
              freeShipApplied,
              taxAmount,
              taxLabel,
              total: inStockTotal,
            },
            hasPreorder && {
              kind: 'pre_order',
              orderNumber: orderNumberPreorder,
              lines: buildLines(preorderItems),
              subtotal: preorderSubtotal,
              dpAmount: preorderDeposit,
              balanceDue: preorderBalance,
              eta: (() => {
                const d = Array.from(new Set(preorderItems.map(it => it.etaText).filter(Boolean)));
                return d.length === 1 ? d[0] : d.length > 1 ? 'Multiple ETAs' : '';
              })(),
              total: preorderDeposit,
            },
          ].filter(Boolean),
          email,
          country,
          dueNow,
          // Backward-compat fields for older direct visits / shape:
          orderNumber: orderNumberInStock || orderNumberPreorder,
        },
      });
    } catch (err) {
      console.error('Cart submit failed:', err);
      setSendError(err?.message || `Failed to place order. Email us at ${CONTACT_EMAIL}.`);
    } finally {
      setSending(false);
    }
  }

  // ── Empty state ──────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#05010c] text-white">
        <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
          <div className="mx-auto max-w-7xl"><Nav /></div>
        </section>
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-3xl font-black uppercase">Your Cart Is Empty</h1>
          <p className="mt-3 text-sm text-white/55">
            Add singles, sealed boxes, or pre-orders — they'll save here even between visits.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shop" className="rounded-2xl bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-7 py-3 text-sm font-black uppercase tracking-[0.12em] text-black">
              Browse Shop
            </Link>
            <Link to="/singles" className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-black uppercase tracking-[0.12em] text-white/80 hover:bg-white/10">
              View Singles
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const cartSummaryText = buildCartSummary(items, totals);
  const messengerHref = `${MESSENGER_URL}?text=${encodeURIComponent(cartSummaryText)}`;
  const mailtoHref    = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Cart inquiry — CloudNineCards')}&body=${encodeURIComponent(cartSummaryText)}`;

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
        <div className="mx-auto max-w-7xl"><Nav /></div>
      </section>

      {/* Mobile sticky-top summary pill */}
      <div className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-[#07030f]/95 backdrop-blur px-4 py-3">
        <button
          onClick={() => setMobileSummaryOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300/70">Order Summary</div>
            <div className="text-sm font-black text-white">
              {items.length} {items.length === 1 ? 'item' : 'items'} · CAD ${(inStockSubtotal + preorderSubtotal).toFixed(2)}
            </div>
          </div>
          {mobileSummaryOpen ? <ChevronUp className="h-4 w-4 text-white/60" /> : <ChevronDown className="h-4 w-4 text-white/60" />}
        </button>
        <AnimatePresence>
          {mobileSummaryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <OrderSummary
                country={country}
                province={province}
                shippingFee={shippingFee}
                taxAmount={taxAmount}
                taxLabel={taxLabel}
                inStockSubtotal={inStockSubtotal}
                preorderSubtotal={preorderSubtotal}
                preorderDeposit={preorderDeposit}
                preorderBalance={preorderBalance}
                inStockTotal={inStockTotal}
                dueNow={dueNow}
                hasInStock={hasInStock}
                hasPreorder={hasPreorder}
                freeShipApplied={freeShipApplied}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black uppercase md:text-4xl">Your Cart</h1>
          <button
            onClick={() => { if (window.confirm('Clear your cart?')) clear(); }}
            className="text-xs font-black uppercase tracking-[0.14em] text-white/40 hover:text-red-300 transition"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          {/* ── Left column: line items + form ─────────────────────────── */}
          <div className="space-y-6">
            {/* ── Panel A: In-Stock ─────────────────────────────────── */}
            {hasInStock && (
              <CartItemsPanel
                title="In-Stock"
                accent="cyan"
                items={inStockItems}
                liveStock={liveStock}
                updateQty={updateQty}
                removeItem={removeItem}
              />
            )}

            {/* ── Panel B: Pre-Orders ───────────────────────────────── */}
            {hasPreorder && (
              <CartItemsPanel
                title="Pre-Orders"
                accent="fuchsia"
                items={preorderItems}
                liveStock={liveStock}
                updateQty={updateQty}
                removeItem={removeItem}
              />
            )}

            {/* ── Customer info form ─────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/10 bg-[#0a061a] p-5 space-y-4">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-white/60">Your Details</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" error={errors.name} required>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Name used on Wise"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
                </Field>
                <Field label="Email" error={errors.email} required>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="confirmation@you.com"
                    readOnly={!!user?.email}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none placeholder-white/25 ${user?.email ? 'border-white/5 bg-white/5 text-white/55' : 'border-white/10 bg-black/30 text-white focus:border-cyan-300/40'}`} />
                </Field>
                <Field label="Phone / WhatsApp" error={errors.phone} required>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
                </Field>
                <Field label="Country" error={errors.country} required>
                  <select value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm text-black outline-none appearance-none">
                    <option value="">Select…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                {country === 'Canada' && (
                  <Field label="Province / Territory" error={errors.province} required>
                    <select value={province} onChange={e => setProvince(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm text-black outline-none appearance-none">
                      <option value="">Select…</option>
                      {Object.keys(PROVINCE_TAX).map(p => <option key={p} value={p}>{p} — {PROVINCE_TAX[p].label}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Postal / ZIP code" error={errors.postal} required>
                  <input value={postal} onChange={e => setPostal(e.target.value)} placeholder="V5K 1A1"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
                </Field>
              </div>

              <Field label="Delivery address" error={errors.address} required>
                <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, unit, city"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40 resize-none" />
              </Field>

              <Field label="Order notes (optional)">
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything we should know?"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40 resize-none" />
              </Field>

              {hasPreorder && (
                <label className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-xs ${errors.preorderAck ? 'border-red-400/40 bg-red-400/10 text-red-200' : 'border-fuchsia-400/30 bg-fuchsia-400/8 text-fuchsia-100'}`}>
                  <input type="checkbox" checked={preorderAck} onChange={e => setPreorderAck(e.target.checked)} className="mt-0.5" data-form-error={errors.preorderAck ? 'true' : 'false'} />
                  <span>
                    I understand pre-order items ship when released. 70% balance + actual shipping due at that time.{' '}
                    <Link to="/how-preorders-work" className="font-black text-cyan-300 underline hover:text-cyan-200">
                      How pre-orders work
                    </Link>
                    .
                  </span>
                </label>
              )}

              {/* Wise reminder */}
              <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/6 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300/60">Pay via Wise</div>
                  <div className="text-base font-black text-cyan-200">{WISE_HANDLE}</div>
                </div>
                <button type="button" onClick={copyWise} className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10" aria-label="Copy Wise handle">
                  {copiedWise ? <Check className="h-4 w-4 text-cyan-300" /> : <Copy className="h-4 w-4 text-white/60" />}
                </button>
              </div>

              {sendError && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200">
                  {sendError}
                </div>
              )}

              {!user && (
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/8 px-4 py-3 text-[12px] text-cyan-100">
                  Sign in to place your order. We'll save it to your account so you can track payment + delivery. <Link to="/account" state={{ redirect: '/cart' }} className="font-black text-cyan-300 hover:underline">Sign in or create an account</Link>.
                </div>
              )}

              <button type="submit" disabled={sending || items.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : (user ? 'Place Order' : 'Sign In to Place Order')}
              </button>

              {/* Messenger / mailto fallback */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={messengerHref}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/8 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-300/15"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Or chat us on Messenger
                </a>
                <a
                  href={mailtoHref}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/65 hover:bg-white/10"
                >
                  Or email us
                </a>
              </div>
            </form>
          </div>

          {/* ── Right column: sticky order summary ──────────────────── */}
          <aside className="hidden md:block">
            <div className="sticky top-6">
              <OrderSummary
                country={country}
                province={province}
                shippingFee={shippingFee}
                taxAmount={taxAmount}
                taxLabel={taxLabel}
                inStockSubtotal={inStockSubtotal}
                preorderSubtotal={preorderSubtotal}
                preorderDeposit={preorderDeposit}
                preorderBalance={preorderBalance}
                inStockTotal={inStockTotal}
                dueNow={dueNow}
                hasInStock={hasInStock}
                hasPreorder={hasPreorder}
                freeShipApplied={freeShipApplied}
              />
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── Send an EmailJS receipt without bringing the order down on failure ────
async function sendEmailSafe(templateId, vars) {
  if (!templateId) return;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, templateId, vars, { publicKey: EMAILJS_PUBLIC_KEY });
  } catch (err) {
    console.warn('EmailJS send failed (non-blocking):', err);
  }
}

// ── Form field helper ──────────────────────────────────────────────────────
function Field({ label, children, required, error }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
        {label} {required && <span className="text-fuchsia-300">*</span>}
      </span>
      <div data-form-error={error ? 'true' : 'false'}>{children}</div>
      {error && <span className="mt-1 block text-[11px] text-red-300">{error}</span>}
    </label>
  );
}

// ── Cart items panel (one per business flow) ───────────────────────────────
function CartItemsPanel({ title, accent, items, liveStock, updateQty, removeItem }) {
  const isPreorderPanel = accent === 'fuchsia';
  const accentBadge = isPreorderPanel
    ? 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300'
    : 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200';
  const panelQty = items.reduce((s, it) => s + it.qty, 0);
  const panelSubtotal = items.reduce((s, it) => s + Number(it.price) * it.qty, 0);
  return (
    <div className={`rounded-[24px] border ${isPreorderPanel ? 'border-fuchsia-400/20' : 'border-white/10'} bg-[#0a061a] overflow-hidden`}>
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-white/65">
          {title} <span className="text-white/30">· {panelQty} {panelQty === 1 ? 'unit' : 'units'}</span>
        </div>
        <div className="text-sm font-black text-white tabular-nums">CAD ${panelSubtotal.toFixed(2)}</div>
      </div>
      <ul className="divide-y divide-white/8">
        {items.map(it => {
          const stock = liveStock[it.key];
          const lowStock = !it.isPreorder && typeof stock === 'number' && stock > 0 && stock <= 3;
          const overStock = !it.isPreorder && typeof stock === 'number' && it.qty > stock;
          const maxQty = it.isPreorder ? 99 : (typeof stock === 'number' ? Math.max(1, stock) : 99);
          return (
            <li key={it.key} className="flex gap-4 p-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {it.image ? (
                  <img src={it.image} alt={it.title} loading="lazy" decoding="async"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🃏</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${accentBadge}`}>
                    {isPreorderPanel ? 'PRE-ORDER' : 'IN STOCK'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                    {it.source === 'singles' ? 'Single' : it.source === 'products' ? 'Sealed' : 'Pre-order'}
                  </span>
                  {lowStock && (
                    <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-200">
                      Only {stock} left
                    </span>
                  )}
                </div>
                <div className="text-sm font-black leading-snug">{it.title}</div>
                {it.isPreorder && it.etaText && (
                  <div className="mt-0.5 text-[11px] text-fuchsia-300/80">{it.etaText}</div>
                )}
                {overStock && (
                  <div className="mt-1 text-[11px] text-red-300">
                    Only {stock} in stock — reduce qty before checkout.
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(it.key, Math.max(1, it.qty - 1))}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-black hover:bg-white/10"
                      aria-label="Decrease quantity"
                    >−</button>
                    <input
                      type="number" min={1} max={maxQty} value={it.qty}
                      onChange={(e) => updateQty(it.key, Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
                      className="w-12 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-center text-sm font-black text-white outline-none focus:border-cyan-300/40"
                    />
                    <button
                      onClick={() => updateQty(it.key, Math.min(maxQty, it.qty + 1))}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-black hover:bg-white/10"
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white tabular-nums">CAD ${(it.price * it.qty).toFixed(2)}</div>
                    <div className="text-[10px] text-white/35 tabular-nums">CAD ${Number(it.price).toFixed(2)} ea</div>
                  </div>
                  <button
                    onClick={() => removeItem(it.key)}
                    className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/45 hover:bg-red-400/10 hover:text-red-300 transition"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Order summary panel ────────────────────────────────────────────────────
function OrderSummary({
  country, province, shippingFee, taxAmount, taxLabel,
  inStockSubtotal, preorderSubtotal, preorderDeposit, preorderBalance, inStockTotal,
  dueNow, hasInStock, hasPreorder, freeShipApplied, compact,
}) {
  return (
    <div className={`rounded-[24px] border border-cyan-300/25 bg-[linear-gradient(180deg,#0c0820,#100426)] p-5 ${compact ? 'mt-3' : ''}`}>
      <div className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300/70 mb-3">Order Summary</div>

      {hasInStock && (
        <div className="mb-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/60 mb-1.5">In-Stock</div>
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={`CAD $${inStockSubtotal.toFixed(2)}`} />
            {country ? (
              <Row label={`Shipping (${country})`}
                   value={freeShipApplied ? 'FREE' : `CAD $${shippingFee.toFixed(2)}`}
                   valueClass={freeShipApplied ? 'text-green-400 font-black' : ''} />
            ) : (
              <Row label="Shipping" value="Select country" muted />
            )}
            {freeShipApplied && (
              <div className="text-[11px] text-green-400 font-black">Free shipping in Canada on in-stock orders $300+</div>
            )}
            {country === 'Canada' && province && taxAmount > 0 ? (
              <Row label={`Tax (${taxLabel} — ${province})`} value={`CAD $${taxAmount.toFixed(2)}`} />
            ) : country === 'Canada' && !province ? (
              <Row label="Tax" value="Select province" muted />
            ) : null}
            <Row label="In-stock total" value={`CAD $${inStockTotal.toFixed(2)}`} valueClass="font-black text-white" />
          </div>
        </div>
      )}

      {hasPreorder && (
        <div className={`${hasInStock ? 'mt-4 pt-4 border-t border-white/10' : ''}`}>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300/70 mb-1.5">Pre-Orders</div>
          <div className="space-y-1.5 text-sm">
            <Row label="Pre-order subtotal" value={`CAD $${preorderSubtotal.toFixed(2)}`} accent="fuchsia" />
            <Row label="Down payment (30%) — Due Now"
                 value={`CAD $${preorderDeposit.toFixed(2)}`}
                 valueClass="font-black text-fuchsia-200" accent="fuchsia" />
            <div className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/8 px-2.5 py-2 mt-1 text-[11px] text-fuchsia-100/85 space-y-0.5">
              <div className="flex justify-between gap-2">
                <span>70% balance — Due on release</span>
                <span className="tabular-nums font-black">CAD ${preorderBalance.toFixed(2)}</span>
              </div>
              <div className="text-fuchsia-300/60">+ actual shipping at release</div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-white/15 pt-3 mt-4 flex justify-between items-end">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Due Now</span>
        <span className="text-2xl font-black text-cyan-200 tabular-nums">CAD ${dueNow.toFixed(2)}</span>
      </div>
      {hasInStock && hasPreorder && (
        <div className="mt-1 text-[10px] text-white/40">
          (in-stock total + 30% deposit)
        </div>
      )}
      {hasPreorder && (
        <div className="mt-2 flex justify-between text-[11px] text-fuchsia-300/80">
          <span>Due on release</span>
          <span className="tabular-nums">CAD ${preorderBalance.toFixed(2)} + actual shipping</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = '', muted, accent }) {
  return (
    <div className="flex justify-between gap-3 text-white/75">
      <span className={accent === 'fuchsia' ? 'text-fuchsia-200/85' : ''}>{label}</span>
      <span className={`tabular-nums ${valueClass} ${muted ? 'text-white/35' : ''}`}>{value}</span>
    </div>
  );
}
