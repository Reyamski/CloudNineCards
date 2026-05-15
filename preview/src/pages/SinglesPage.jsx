import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Search, SlidersHorizontal, Package, Globe, ShieldCheck, Copy } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ONHAND;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const WISE_HANDLE    = '@cloudninecards';
const CONTACT_EMAIL  = 'papspective@gmail.com';

const GAMES      = ['All', 'One Piece', 'Pokemon', 'Dragon Ball', 'Yu-Gi-Oh!', 'Union Arena'];
const LANGS      = ['All', 'English', 'Japanese'];
const CONDITIONS = ['All', 'NM', 'LP', 'MP', 'HP', 'D'];
const SORTS      = [
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc',   label: 'Name A → Z' },
  { value: 'newest',     label: 'Newest First' },
];

const CONDITION_COLOR = {
  NM: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  LP: 'border-cyan-400/40    bg-cyan-400/10    text-cyan-300',
  MP: 'border-yellow-400/40  bg-yellow-400/10  text-yellow-300',
  HP: 'border-orange-400/40  bg-orange-400/10  text-orange-300',
  D:  'border-red-400/40     bg-red-400/10     text-red-300',
};

// CAD → foreign currency rates + 3% buffer to cover Wise transfer fees
const FX_RATES = { USD: 1.37, AUD: 0.91, EUR: 1.50 }; // 1 foreign unit = X CAD
const INTL_CURRENCIES = ['USD', 'AUD', 'EUR'];
const CURRENCY_SYMBOLS = { CAD: 'CAD $', USD: 'USD $', AUD: 'AUD $', EUR: 'EUR €' };
function cadToFx(cadAmount, currency) {
  if (currency === 'CAD') return cadAmount;
  return Math.ceil(cadAmount / FX_RATES[currency] * 1.03 * 100) / 100;
}

// Flat per-shipment shipping (singles ship light in toploader)
const SINGLES_SHIP = {
  'Canada':                          6,
  'United States':                  15,
  'Japan / Korea / HK / Singapore': 22,
  'Australia / NZ / SE Asia':       22,
  'Europe / Middle East':           25,
  'Other International':            28,
};

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

// Static fallback singles — shown while Supabase table is being set up.
// Prices set to 0 intentionally; update in DB after migration.
const STATIC_SINGLES = [
  { id: 'eb03-018', card_name: 'Tashigi',           set_name: 'EB-03 Heroines Edition',     card_number: 'EB03-018', rarity: 'Super Rare', condition: 'NM', language: 'Japanese', price: 0, stock: 1, in_stock: true,  image_url: '/singles/EB03-018.jpg',  game: 'One Piece' },
  { id: 'eb03-024', card_name: 'Nefeltari Vivi',    set_name: 'EB-03 Heroines Edition',     card_number: 'EB03-024', rarity: 'Super Rare', condition: 'NM', language: 'Japanese', price: 0, stock: 1, in_stock: true,  image_url: '/singles/EB03-024.jpg',  game: 'One Piece' },
  { id: 'eb03-045', card_name: 'Perona',             set_name: 'EB-03 Heroines Edition',     card_number: 'EB03-045', rarity: 'Super Rare', condition: 'NM', language: 'Japanese', price: 0, stock: 1, in_stock: true,  image_url: '/singles/EB03-045.jpg',  game: 'One Piece' },
  { id: 'eb03-057', card_name: 'Yamato',             set_name: 'EB-03 Heroines Edition',     card_number: 'EB03-057', rarity: 'Super Rare', condition: 'NM', language: 'Japanese', price: 0, stock: 1, in_stock: true,  image_url: '/singles/EB03-057.png',  game: 'One Piece' },
  { id: 'eb03-061', card_name: 'Uta',                set_name: 'EB-03 Heroines Edition',     card_number: 'EB03-061', rarity: 'Secret Rare',condition: 'NM', language: 'Japanese', price: 0, stock: 1, in_stock: true,  image_url: '/singles/EB03-061.webp', game: 'One Piece' },
  { id: 'op13-066', card_name: 'Silvers Rayleigh',   set_name: 'OP-13 Carrying on His Will', card_number: 'OP13-066', rarity: 'Super Rare', condition: 'NM', language: 'English',  price: 0, stock: 1, in_stock: true,  image_url: '/singles/OP13-066.webp', game: 'One Piece' },
];

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function BuySingleModal({ card, onClose, userEmail, user, onRequireAuth }) {
  const [qty, setQty]           = useState(1);
  const [country, setCountry]   = useState('');
  const [province, setProvince] = useState('');
  const [currency, setCurrency] = useState('CAD');

  function handleCountryChange(c) {
    setCountry(c);
    setProvince('');
    if (c === 'Canada') setCurrency('CAD');
    else if (c === 'United States') setCurrency('USD');
    else setCurrency('USD'); // default for international, user can change
  }
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState(userEmail ?? '');
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');
  const [copied, setCopied]     = useState(false);
  const [step, setStep]         = useState(1);
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber] = useState(() => {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `CNC-${ts.slice(-5)}${rand}`;
  });

  const subtotal    = Number(card.price) * qty;
  const shipFee     = country ? (SINGLES_SHIP[country] ?? 28) : 0;
  const freeShip    = country === 'Canada' && subtotal >= 100;
  const deliveryFee = freeShip ? 0 : shipFee;
  const taxRate     = country === 'Canada' && province ? (PROVINCE_TAX[province]?.rate ?? 0) : 0;
  const taxLabel    = country === 'Canada' && province ? (PROVINCE_TAX[province]?.label ?? '') : '';
  const taxAmount   = subtotal * taxRate;
  const grandTotalCAD = subtotal + deliveryFee + taxAmount;
  const grandTotal    = cadToFx(grandTotalCAD, currency);
  const sym           = CURRENCY_SYMBOLS[currency] ?? 'CAD $';
  const step1Ready  = country && (country !== 'Canada' || province);
  const isIntl      = country && country !== 'Canada' && country !== 'United States';

  function copyWise() {
    navigator.clipboard.writeText(WISE_HANDLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Auth gate — anon users can fill the form but must sign in to submit.
    if (!user) {
      onRequireAuth?.();
      return;
    }
    setSending(true);
    setSendError('');
    try {
      if (!supabaseEnabled || !supabase) throw new Error('Live orders not configured.');

      const { error: dbErr } = await supabase.from('orders').insert({
        order_number:     orderNumber,
        order_type:       'single',
        status:           'pending',
        payment_status:   'awaiting_payment',
        product_id:       card.id,
        product_title:    card.card_name,
        product_variant:  `${card.set_name} ${card.card_number ?? ''} · ${card.condition} · ${card.language}`.trim(),
        item_title:       `${card.card_name} — ${card.set_name}`,
        quantity:         qty,
        buyer_name:       name,
        buyer_email:      email.trim().toLowerCase(),
        buyer_phone:      phone,
        buyer_address:    address,
        delivery_country:  country,
        delivery_province: province || null,
        full_price:        grandTotal,
        total_price:       grandTotal,
        delivery_fee:      deliveryFee,
        subtotal:          subtotal,
        tax_amount:        taxAmount,
      });
      if (dbErr) throw dbErr;

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        order_number:     orderNumber,
        buyer_name:       name,
        buyer_email:      email,
        buyer_phone:      phone,
        buyer_address:    address,
        item_title:       `[SINGLE] ${card.card_name}`,
        item_subtitle:    `${card.set_name} · ${card.condition} · ${card.language}`,
        quantity:         qty,
        subtotal:          `CAD $${subtotal.toFixed(2)}`,
        tax_amount:        taxAmount > 0 ? `CAD $${taxAmount.toFixed(2)} (${taxLabel})` : 'N/A',
        delivery_fee:      freeShip ? 'FREE (Canada $100+)' : `CAD $${deliveryFee.toFixed(2)}`,
        delivery_country:  country,
        delivery_province: province || 'N/A',
        total_price:       currency === 'CAD'
          ? `CAD $${grandTotalCAD.toFixed(2)}`
          : `${sym}${grandTotal.toFixed(2)} (≈ CAD $${grandTotalCAD.toFixed(2)})`,
        payment_proof:    'Not provided — buyer will email separately',
        wise_handle:      WISE_HANDLE,
        to_email:         CONTACT_EMAIL,
      }, { publicKey: EMAILJS_PUBLIC_KEY });

      setSubmitted(true);
    } catch (err) {
      setSendError(err?.message || 'Failed to send. Email us directly.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.28 }}
        className="relative w-full max-w-md rounded-[32px] border border-cyan-400/20 bg-[#07030f] overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300" />
        <div className="p-6">
          <button onClick={onClose} className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 hover:bg-white/10">
            <X className="h-4 w-4 text-white/60" />
          </button>

          {submitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
                <Check className="h-10 w-10 text-cyan-300" />
              </div>
              <div className="text-2xl font-black uppercase">Order Sent!</div>
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/8 px-5 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/60 mb-0.5">Order Number</div>
                <div className="text-lg font-black text-cyan-200 tracking-widest">{orderNumber}</div>
              </div>
              <p className="max-w-xs text-sm text-white/60 leading-6">
                Send <strong className="text-cyan-300">CAD ${grandTotal.toFixed(2)}</strong> to{' '}
                <strong className="text-cyan-300">{WISE_HANDLE}</strong> on Wise, then email your screenshot to{' '}
                <span className="text-cyan-300">{CONTACT_EMAIL}</span>.
              </p>
              <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-black uppercase text-white/65 hover:bg-white/10">Done</button>
            </motion.div>

          ) : step === 1 ? (
            <>
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Buy Single — Wise</div>
                <div className="text-xl font-black leading-snug">{card.card_name}</div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  <span className="text-white/45">{card.set_name}</span>
                  {card.card_number && <span className="text-white/30">· {card.card_number}</span>}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${CONDITION_COLOR[card.condition] ?? CONDITION_COLOR.NM}`}>{card.condition}</span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/50">{card.language}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">Quantity</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-lg font-black hover:bg-white/10">−</button>
                  <span className="text-2xl font-black w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(card.stock, q + 1))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-lg font-black hover:bg-white/10">+</button>
                </div>
                <div className="mt-1 text-xs text-white/30">{card.stock} available</div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">Shipping Destination</div>
                <select value={country} onChange={e => handleCountryChange(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none appearance-none">
                  <option value="" disabled>Select destination…</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="Japan / Korea / HK / Singapore">🇯🇵 Japan / Korea / HK / Singapore</option>
                  <option value="Australia / NZ / SE Asia">🇦🇺 Australia / NZ / SE Asia</option>
                  <option value="Europe / Middle East">🌍 Europe / Middle East</option>
                  <option value="Other International">🌏 Other International</option>
                </select>
              </div>

              {country === 'Canada' && (
                <div className="mb-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">Province / Territory</div>
                  <select value={province} onChange={e => setProvince(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none appearance-none">
                    <option value="" disabled>Select province / territory…</option>
                    {Object.keys(PROVINCE_TAX).map(p => (
                      <option key={p} value={p}>{p} — {PROVINCE_TAX[p].label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Currency selector — US auto-selects USD, international gets dropdown */}
              {country && country !== 'Canada' && (
                <div className="mb-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">
                    Payment Currency
                    {country === 'United States' && <span className="ml-2 text-cyan-300/50 normal-case font-normal">(auto-selected)</span>}
                  </div>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    disabled={country === 'United States'}
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none appearance-none disabled:opacity-60">
                    {INTL_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/6 p-4 space-y-1.5">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300/60 mb-2">Price Breakdown</div>
                <div className="flex justify-between text-sm text-white/70"><span>Subtotal ({qty}×)</span><span>{sym}{cadToFx(subtotal, currency).toFixed(2)}</span></div>
                {country && (
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Shipping (tracked) {freeShip ? '🎉' : ''}</span>
                    <span className={freeShip ? 'text-green-400 font-bold' : ''}>{freeShip ? 'FREE' : `${sym}${cadToFx(deliveryFee, currency).toFixed(2)}`}</span>
                  </div>
                )}
                {freeShip && <div className="text-xs text-green-400 font-black text-center">Free shipping on Canadian orders $100+</div>}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Tax ({taxLabel} — {province})</span>
                    <span>{sym}{cadToFx(taxAmount, currency).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-cyan-300/20 pt-2 flex justify-between items-end">
                  <span className="font-black text-sm">Total — send via Wise</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-cyan-200">{step1Ready ? `${sym}${grandTotal.toFixed(2)}` : '—'}</div>
                    {currency !== 'CAD' && step1Ready && (
                      <div className="text-xs text-white/30 mt-0.5">≈ CAD ${grandTotalCAD.toFixed(2)} · rate incl. 3% Wise fee</div>
                    )}
                  </div>
                </div>
                {!country && <div className="text-xs text-white/35 text-center">Select destination to see total</div>}
                {country === 'Canada' && !province && <div className="text-xs text-white/35 text-center">Select province to calculate tax</div>}
              </div>

              <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-0.5">Send payment to</div>
                  <div className="text-xl font-black text-cyan-200">{WISE_HANDLE}</div>
                  <div className="text-xs text-white/30">Cloud Nine Cards · Wise</div>
                </div>
                <button onClick={copyWise} className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 transition">
                  {copied ? <Check className="h-4 w-4 text-cyan-300" /> : <Copy className="h-4 w-4 text-white/50" />}
                </button>
              </div>

              <button onClick={() => setStep(2)} disabled={!step1Ready}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed">
                I've Sent the Payment →
              </button>
            </>

          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Confirm Your Order</div>
                <div className="text-xl font-black">Your details</div>
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Full name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Name used on Wise"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} readOnly={!!userEmail}
                  placeholder="Confirmation sent here"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${userEmail ? 'border-white/5 bg-white/5 text-white/50 cursor-default' : 'border-white/10 bg-black/30 text-white focus:border-cyan-300/40'} placeholder-white/25`} />
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Phone / WhatsApp</label>
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Delivery Address</label>
                <textarea required rows={3} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full delivery address"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40 resize-none" />
              </div>

              <div className="mb-4 rounded-2xl border border-white/8 bg-white/4 p-4 text-xs text-white/50 space-y-1">
                <div className="font-black text-white/70 uppercase tracking-[0.12em] text-[10px] mb-2">Order Summary</div>
                <div className="flex justify-between"><span>{card.card_name} × {qty}</span><span>CAD ${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping ({country})</span><span>{freeShip ? 'FREE' : `CAD $${deliveryFee.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-cyan-300 font-bold border-t border-white/8 pt-1.5"><span>Total via Wise</span><span>CAD ${grandTotal.toFixed(2)}</span></div>
              </div>

              {sendError && <div className="mb-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">{sendError}</div>}
              {!user && (
                <div className="mb-3 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-xs text-cyan-200">
                  Sign in or create an account to place your order — it only takes a sec.
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} disabled={sending}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase text-white/55 hover:bg-white/10 disabled:opacity-40">Back</button>
                <button type="submit" disabled={sending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3 text-sm font-black uppercase text-black hover:opacity-95 disabled:opacity-60">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : (!user ? 'Sign In to Place Order' : 'Submit Order')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Card Tile ─────────────────────────────────────────────────────────────────
function SingleCard({ card, onBuy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`group relative rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] overflow-hidden flex flex-col transition-transform duration-300 hover:scale-[1.02]${!card.in_stock ? ' opacity-55' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300" />
      <div className="relative h-[340px] overflow-hidden bg-black/20">
        {card.image_url ? (
          <img src={card.image_url} alt={card.card_name}
            loading="lazy" decoding="async"
            className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white/20"><div className="text-4xl mb-2">🃏</div><div className="text-xs font-black uppercase tracking-widest">No Image</div></div>
          </div>
        )}
        {!card.in_stock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full border border-white/20 bg-black/80 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/50">Sold Out</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${CONDITION_COLOR[card.condition] ?? CONDITION_COLOR.NM}`}>{card.condition}</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
            {card.language === 'Japanese' ? '🇯🇵 JP' : '🇺🇸 EN'}
          </span>
          {card.rarity && (
            <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/8 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-fuchsia-300/80">{card.rarity}</span>
          )}
        </div>
        <div className="text-sm font-black leading-snug text-white flex-1">{card.card_name}</div>
        <div className="mt-1 text-xs text-white/40">{card.set_name}{card.card_number ? ` · ${card.card_number}` : ''}</div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-2xl font-black text-white">
              {Number(card.price) > 0 ? `CAD $${Number(card.price).toFixed(2)}` : <span className="text-white/40 text-lg">TBD</span>}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">{card.stock > 0 ? `${card.stock} in stock` : 'Out of stock'}</div>
          </div>
          {card.in_stock && Number(card.price) > 0 ? (
            <button onClick={() => onBuy(card)}
              className="rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-black transition hover:opacity-90">
              Add to Cart
            </button>
          ) : (
            <button disabled className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white/25 cursor-not-allowed">
              {!card.in_stock ? 'Sold Out' : 'Price TBD'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SinglesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [singles, setSingles]         = useState(STATIC_SINGLES);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [gameFilter, setGameFilter]   = useState('All');
  const [langFilter, setLangFilter]   = useState('All');
  const [condFilter, setCondFilter]   = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort]               = useState('price_asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { document.title = 'Singles | CloudNineCards'; }, []);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }
    supabase.from('singles').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) {
        setFetchError('Could not load singles — showing preview data. Run migration to enable live data.');
      } else if (data && data.length > 0) {
        setSingles(data);
      }
      setLoading(false);
    });
  }, []);

  // Pre-open from URL ?card=id
  useEffect(() => {
    const id = searchParams.get('card');
    if (!id || !singles.length) return;
    const found = singles.find(s => s.id === id);
    if (found) setSelected(found);
  }, [searchParams, singles]);

  const filtered = useMemo(() => {
    let list = singles;
    if (gameFilter !== 'All')   list = list.filter(c => c.game === gameFilter);
    if (langFilter !== 'All')   list = list.filter(c => c.language === langFilter);
    if (condFilter !== 'All')   list = list.filter(c => c.condition === condFilter);
    if (inStockOnly)            list = list.filter(c => c.in_stock);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.card_name.toLowerCase().includes(q) ||
        c.set_name.toLowerCase().includes(q) ||
        (c.card_number ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'price_asc')  return Number(a.price) - Number(b.price);
      if (sort === 'price_desc') return Number(b.price) - Number(a.price);
      if (sort === 'name_asc')   return a.card_name.localeCompare(b.card_name);
      return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
    });
  }, [singles, gameFilter, langFilter, condFilter, inStockOnly, search, sort]);

  const { addItem } = useCart();
  const { showToast } = useToast();

  function handleBuy(card) {
    // Add-to-cart replaces the legacy buy modal. Buyer reviews and submits
    // on /cart (the merged checkout page).
    addItem({
      key:        `singles:${card.id}`,
      source:     'singles',
      id:         card.id,
      title:      card.card_name,
      image:      card.image_url,
      price:      Number(card.price) || 0,
      qty:        1,
      isPreorder: false,
      currency:   'CAD',
    });
    showToast(`Added — ${card.card_name}`, { actionTo: '/cart', actionLabel: 'View Cart' });
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <AnimatePresence>
        {selected && <BuySingleModal card={selected} onClose={() => setSelected(null)} userEmail={user?.email ?? ''} user={user} onRequireAuth={() => navigate('/account', { state: { redirect: '/singles' } })} />}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cyan-500/15 bg-[#07030f] px-6 pb-10 pt-6 min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_40%)]" />
        <img src="/pikachu.png" alt="" aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 h-[440px] w-auto select-none"
          style={{ opacity: 0.38, filter: 'drop-shadow(0 0 40px rgba(250,204,21,0.55)) drop-shadow(0 0 80px rgba(250,204,21,0.2))', zIndex: 0 }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <div className="mt-4">
            <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300/75">Individual Cards</div>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">
              Singles
              <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">Marketplace</span>
            </h1>
            <p className="mt-2 text-sm text-white/50 max-w-md">Every card ships sleeved in a toploader from Canada. Graded honestly — NM means NM.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Game filter — always visible */}
        <div className="mb-4 flex flex-wrap gap-2">
          {GAMES.map(g => (
            <button key={g} onClick={() => setGameFilter(g)}
              className={`rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                gameFilter === g
                  ? 'border-purple-400/60 bg-purple-500/15 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:text-white/85'
              }`}>
              {g}
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by card name, set, or number…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40" />
            </div>
            <button onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${showFilters ? 'border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'}`}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-[20px] border border-white/8 bg-white/3 p-4 flex flex-wrap gap-5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Language</div>
                    <div className="flex gap-1.5">
                      {LANGS.map(l => (
                        <button key={l} onClick={() => setLangFilter(l)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition ${langFilter === l ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-white/5 text-white/50 hover:text-white/70'}`}>
                          {l === 'Japanese' ? '🇯🇵 JP' : l === 'English' ? '🇺🇸 EN' : l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Condition</div>
                    <div className="flex flex-wrap gap-1.5">
                      {CONDITIONS.map(c => (
                        <button key={c} onClick={() => setCondFilter(c)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition ${condFilter === c ? (CONDITION_COLOR[c] ?? 'border-white/40 bg-white/10 text-white') : 'border-white/10 bg-white/5 text-white/50 hover:text-white/70'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-4 ml-auto">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setInStockOnly(v => !v)}>
                      <div className={`h-5 w-9 rounded-full transition-colors duration-200 flex items-center px-0.5 ${inStockOnly ? 'bg-cyan-400' : 'bg-white/15'}`}>
                        <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${inStockOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-white/55">In Stock Only</span>
                    </label>
                    <select value={sort} onChange={e => setSort(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-white/60 outline-none">
                      {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/35 font-black uppercase tracking-[0.14em]">{filtered.length} card{filtered.length !== 1 ? 's' : ''}</span>
            {gameFilter !== 'All' && <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-black text-purple-300">{gameFilter}</span>}
            {langFilter !== 'All' && <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black text-cyan-300">{langFilter}</span>}
            {condFilter !== 'All' && <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black ${CONDITION_COLOR[condFilter] ?? ''}`}>{condFilter}</span>}
            {inStockOnly && <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">In Stock</span>}
          </div>
        </div>

        {fetchError && <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">{fetchError}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🃏</div>
            <div className="text-xl font-black uppercase">No cards found</div>
            <p className="mt-2 text-sm text-white/50">Try adjusting your filters or check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(card => <SingleCard key={card.id} card={card} onBuy={handleBuy} />)}
          </div>
        )}

        {!loading && (
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Package,     title: 'Tracked Shipping',    desc: 'Sleeved in toploader, tracked mail. Canada $6 · USA $15 · International from $22.' },
              { icon: Globe,       title: 'Ships Worldwide',     desc: 'Free shipping in Canada on orders over $100.' },
              { icon: ShieldCheck, title: 'Condition Guarantee', desc: 'NM means NM. If it shows up worse than described, we fix it.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-[20px] border border-white/8 bg-white/3 p-4 flex gap-3">
                <Icon className="h-5 w-5 text-cyan-300/70 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.1em]">{title}</div>
                  <p className="mt-1 text-xs text-white/45 leading-5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
