import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, ChevronDown, ChevronUp, MessageCircle, Copy, Check } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../lib/useAuth';
import { useToast } from '../components/Toast';
import { supabase, supabaseEnabled } from '../lib/supabase';

// ── Constants pulled from existing modal logic so cart checkout matches ──────
// Shipping schedule per spec: Canada $6, USA $15, International $22+, free CA $100+.
const SHIP_RATES = {
  'Canada':                          6,
  'United States':                  15,
  'Japan / Korea / HK / Singapore': 22,
  'Australia / NZ / SE Asia':       22,
  'Europe / Middle East':           25,
  'Other International':            28,
};
const FREE_SHIP_CANADA_THRESHOLD = 100;

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

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ONHAND;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function calcShipping(country, inStockSubtotal) {
  if (!country) return 0;
  if (country === 'Canada' && inStockSubtotal >= FREE_SHIP_CANADA_THRESHOLD) return 0;
  return SHIP_RATES[country] ?? 28;
}

function newOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CNC-${ts.slice(-5)}${rand}`;
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

  const hasPreorder = useMemo(() => items.some(it => it.isPreorder), [items]);
  const inStockSubtotal = totals.subtotalInStock;
  const preorderSubtotal = totals.subtotalPreorder;
  const shippingFee = calcShipping(country, inStockSubtotal);
  const taxRate = country === 'Canada' && province ? (PROVINCE_TAX[province]?.rate ?? 0) : 0;
  const taxLabel = country === 'Canada' && province ? (PROVINCE_TAX[province]?.label ?? '') : '';
  // Tax applied to in-stock subtotal + shipping (matches existing modal logic).
  const taxAmount = country === 'Canada' && province ? (inStockSubtotal + shippingFee) * taxRate : 0;
  const dueNow = inStockSubtotal + shippingFee + taxAmount;
  const freeShipApplied = country === 'Canada' && inStockSubtotal >= FREE_SHIP_CANADA_THRESHOLD;

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
    if (!validate()) {
      // Scroll to first error if there is one.
      const firstErrEl = document.querySelector('[data-form-error="true"]');
      firstErrEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSending(true);

    const orderNumber = newOrderNumber();
    let orderId = null;

    try {
      if (!supabaseEnabled || !supabase) throw new Error('Live orders are not configured yet.');

      // ── 1. Insert the parent orders row ───────────────────────────────
      // Multi-item carts populate legacy columns with sensible placeholders.
      // total_price tracks "due now" (in-stock + shipping + tax) only — the
      // pre-order portion is collected later, line-by-line, by the owner.
      const placeholderTitle = items.length === 1
        ? items[0].title
        : `${items.length} items — see order_items`;

      const orderPayload = {
        order_number:     orderNumber,
        order_type:       'cart',
        status:           'pending',
        payment_status:   'awaiting_payment',
        product_id:       items.length === 1 ? items[0].id : 'MULTI',
        product_title:    placeholderTitle,
        item_title:       placeholderTitle,
        quantity:         totals.itemCount,
        buyer_name:       name,
        buyer_email:      email.trim().toLowerCase(),
        buyer_phone:      phone,
        buyer_address:    [address, postal].filter(Boolean).join(', '),
        delivery_country: country,
        delivery_province: province || null,
        subtotal:         inStockSubtotal + preorderSubtotal,
        tax_amount:       taxAmount,
        delivery_fee:     shippingFee,
        total_price:      dueNow,
        full_price:       dueNow,
        wise_handle:      WISE_HANDLE,
      };

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();
      if (orderError) throw orderError;
      orderId = insertedOrder?.id;
      if (!orderId) throw new Error('Order insert returned no id.');

      // ── 2. Insert order_items batch ────────────────────────────────────
      const orderItemsPayload = items.map(it => ({
        order_id:       orderId,
        source_table:   it.source,
        item_id:        it.id,
        qty:            it.qty,
        unit_price:     it.price,
        title_snapshot: it.title,
        image_snapshot: it.image ?? null,
        is_preorder:    !!it.isPreorder,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      // ── 3. Decrement stock for in-stock lines only ─────────────────────
      // Mirrors the per-item pattern in AdminPage.confirmOrder (commit
      // ecc5989c). Failures are non-fatal: order still goes through, but we
      // flag it so the admin can reconcile.
      let stockCheckFailed = false;
      for (const it of items) {
        if (it.isPreorder) continue;
        try {
          const { data: row } = await supabase
            .from(it.source)
            .select('stock,in_stock')
            .eq('id', it.id)
            .maybeSingle();
          if (!row) { stockCheckFailed = true; continue; }
          const nextQty = Math.max(0, (row.stock ?? 0) - it.qty);
          const nextInStock = nextQty > 0;
          const update = { stock: nextQty, in_stock: nextInStock };
          if (it.source === 'singles') update.updated_at = new Date().toISOString();
          if (it.source === 'products') update.badge = nextInStock ? 'In Stock' : 'Sold Out';
          await supabase.from(it.source).update(update).eq('id', it.id);
        } catch (decErr) {
          console.warn('Stock decrement failed for', it.key, decErr);
          stockCheckFailed = true;
        }
      }
      if (stockCheckFailed) {
        // Mark the order so admin knows to reconcile by hand.
        try {
          await supabase.from('orders').update({ status: 'stock_check_failed' }).eq('id', orderId);
        } catch { /* non-blocking */ }
      }

      // ── 4. EmailJS receipt — owner copy + buyer copy ───────────────────
      const itemsHtml = buildItemsHtml(items);
      const orderSummaryLines = items.map(it => `${it.title} × ${it.qty} — CAD $${(it.price * it.qty).toFixed(2)}${it.isPreorder ? ' [PRE-ORDER]' : ''}`).join('\n');
      const baseTemplateVars = {
        order_number:     orderNumber,
        buyer_name:       name,
        buyer_email:      email,
        buyer_phone:      phone,
        buyer_address:    [address, postal].filter(Boolean).join(', '),
        item_title:       placeholderTitle,
        item_subtitle:    `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        quantity:         totals.itemCount,
        items_html:       itemsHtml,
        items_text:       orderSummaryLines,
        has_preorder:     hasPreorder ? 'YES' : 'NO',
        preorder_note:    hasPreorder
          ? 'Cart contains pre-order items — those ship when released and may incur separate shipping.'
          : '',
        subtotal:         `CAD $${(inStockSubtotal + preorderSubtotal).toFixed(2)}`,
        instock_subtotal: `CAD $${inStockSubtotal.toFixed(2)}`,
        preorder_subtotal:`CAD $${preorderSubtotal.toFixed(2)}`,
        tax_amount:       taxAmount > 0 ? `CAD $${taxAmount.toFixed(2)} (${taxLabel})` : 'N/A',
        delivery_fee:     freeShipApplied ? 'FREE (Canada $100+)' : `CAD $${shippingFee.toFixed(2)}`,
        delivery_country: country,
        delivery_province: province || 'N/A',
        total_price:      `CAD $${dueNow.toFixed(2)}`,
        due_on_release:   preorderSubtotal > 0 ? `CAD $${preorderSubtotal.toFixed(2)}` : 'N/A',
        payment_proof:    'Not provided — buyer will email separately',
        wise_handle:      WISE_HANDLE,
        notes:            notes || '(none)',
      };

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
          { ...baseTemplateVars, to_email: CONTACT_EMAIL },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      } catch (mailErr) {
        console.warn('Owner email failed (non-blocking):', mailErr);
      }
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
          { ...baseTemplateVars, to_email: email.trim() },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      } catch (buyerErr) {
        console.warn('Buyer email failed (non-blocking):', buyerErr);
      }

      // ── 5. Hand off to confirmation page ──────────────────────────────
      const linesForConfirmation = items.map(it => ({
        title: it.title, qty: it.qty, price: it.price, isPreorder: !!it.isPreorder,
      }));
      clear();
      navigate('/order-confirmation', {
        state: {
          orderNumber,
          email,
          total: dueNow,
          inStockTotal: dueNow,
          preorderTotal: preorderSubtotal,
          hasPreorder,
          lines: linesForConfirmation,
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
                items={items}
                country={country}
                province={province}
                shippingFee={shippingFee}
                taxAmount={taxAmount}
                taxLabel={taxLabel}
                inStockSubtotal={inStockSubtotal}
                preorderSubtotal={preorderSubtotal}
                dueNow={dueNow}
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
            <div className="rounded-[24px] border border-white/10 bg-[#0a061a] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 text-xs font-black uppercase tracking-[0.14em] text-white/60">
                Line Items
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
                          {it.isPreorder ? (
                            <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-300">PRE-ORDER</span>
                          ) : (
                            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">IN STOCK</span>
                          )}
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
                  <span>I understand pre-order items ship when they're released and may incur separate shipping.</span>
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
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] text-white/55">
                  No account needed — we'll send the confirmation to your email. <Link to="/account" className="text-cyan-300 hover:underline">Sign in</Link> if you'd like your order saved to your profile.
                </div>
              )}

              <button type="submit" disabled={sending || items.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : 'Place Order'}
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
                items={items}
                country={country}
                province={province}
                shippingFee={shippingFee}
                taxAmount={taxAmount}
                taxLabel={taxLabel}
                inStockSubtotal={inStockSubtotal}
                preorderSubtotal={preorderSubtotal}
                dueNow={dueNow}
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

// ── Order summary panel ────────────────────────────────────────────────────
function OrderSummary({
  items, country, province, shippingFee, taxAmount, taxLabel,
  inStockSubtotal, preorderSubtotal, dueNow, hasPreorder, freeShipApplied,
  compact,
}) {
  return (
    <div className={`rounded-[24px] border border-cyan-300/25 bg-[linear-gradient(180deg,#0c0820,#100426)] p-5 ${compact ? 'mt-3' : ''}`}>
      <div className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300/70 mb-3">Order Summary</div>

      <div className="space-y-1.5 text-sm">
        <Row label={`In-stock (${items.filter(i => !i.isPreorder).reduce((s, i) => s + i.qty, 0)}×)`}
             value={`CAD $${inStockSubtotal.toFixed(2)}`} />
        {preorderSubtotal > 0 && (
          <Row label={`Pre-order (${items.filter(i => i.isPreorder).reduce((s, i) => s + i.qty, 0)}×)`}
               value={`CAD $${preorderSubtotal.toFixed(2)}`} accent="fuchsia" />
        )}
        {country ? (
          <Row label={`Shipping — ${country}`}
               value={freeShipApplied ? 'FREE' : `CAD $${shippingFee.toFixed(2)}`}
               valueClass={freeShipApplied ? 'text-green-400 font-black' : ''} />
        ) : (
          <Row label="Shipping" value="Select country" muted />
        )}
        {freeShipApplied && (
          <div className="text-[11px] text-green-400 font-black">Free shipping on Canadian orders $100+</div>
        )}
        {country === 'Canada' && province && taxAmount > 0 && (
          <Row label={`Tax (${taxLabel} — ${province})`} value={`CAD $${taxAmount.toFixed(2)}`} />
        )}

        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-end">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Due Now</span>
          <span className="text-2xl font-black text-cyan-200 tabular-nums">CAD ${dueNow.toFixed(2)}</span>
        </div>

        {hasPreorder && (
          <div className="mt-3 rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/8 p-3 text-[11px] text-fuchsia-100/85 space-y-1">
            <div className="font-black uppercase tracking-[0.12em] text-fuchsia-300 text-[10px]">Pre-order Notes</div>
            <div>Pre-order shipping is calculated when items ship — additional charges may apply.</div>
            {preorderSubtotal > 0 && (
              <div className="flex justify-between pt-1">
                <span>Due on release</span>
                <span className="tabular-nums font-black">CAD ${preorderSubtotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
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
