import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { X, Copy, Check, Camera, Loader2, Package, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { allProducts } from '../data/products';
import { useAuth } from '../lib/useAuth';

// ── EmailJS — reuse same service, separate template for on-hand orders ───────
const EMAILJS_SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID  = import.meta.env.VITE_EMAILJS_TEMPLATE_ONHAND;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ── imgbb — free image hosting so payment proof renders in email ──────────────
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

async function uploadProofImage(base64DataUrl) {
  const base64 = base64DataUrl.split(',')[1];
  const body = new FormData();
  body.append('image', base64);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body });
  const json = await res.json();
  if (!json.success) throw new Error('imgbb upload failed');
  return json.data.url;
}

const WISE_HANDLE    = '@cloudninecards';
const CONTACT_EMAIL  = 'papspective@gmail.com';

const FX_RATES = { USD: 1.37, AUD: 0.91, EUR: 1.50 };
const INTL_CURRENCIES = ['USD', 'AUD', 'EUR'];
const CURRENCY_SYMBOLS = { CAD: 'CAD $', USD: 'USD $', AUD: 'AUD $', EUR: 'EUR €' };
function cadToFx(cadAmt, cur) {
  if (cur === 'CAD') return cadAmt;
  return Math.ceil(cadAmt / FX_RATES[cur] * 1.03 * 100) / 100;
}

const tags = ['All', 'One Piece', 'Dragon Ball', 'Pokemon', 'Pre-orders', 'Accessories'];
const langFilters = ['All', 'Japanese', 'English'];

// ── Province tax rates (Canada) ───────────────────────────────────────────────
const PROVINCE_TAX = {
  'Alberta':                  { rate: 0.05,    label: 'GST'       },
  'British Columbia':         { rate: 0.12,    label: 'GST + PST' },
  'Manitoba':                 { rate: 0.12,    label: 'GST + PST' },
  'New Brunswick':            { rate: 0.15,    label: 'HST'       },
  'Newfoundland & Labrador':  { rate: 0.15,    label: 'HST'       },
  'Nova Scotia':              { rate: 0.15,    label: 'HST'       },
  'Ontario':                  { rate: 0.13,    label: 'HST'       },
  'Prince Edward Island':     { rate: 0.15,    label: 'HST'       },
  'Quebec':                   { rate: 0.14975, label: 'GST + QST' },
  'Saskatchewan':             { rate: 0.11,    label: 'GST + PST' },
  'Northwest Territories':    { rate: 0.05,    label: 'GST'       },
  'Nunavut':                  { rate: 0.05,    label: 'GST'       },
  'Yukon':                    { rate: 0.05,    label: 'GST'       },
};

// ── Canada-origin shipping rates (CAD) ───────────────────────────────────────
// Ships from Vancouver, BC via Canada Post / DHL
// On-hand items ship from Canadian stock

const WEIGHT_PER_BOX = 1.91; // kg — DHL volumetric weight: 29×22×15cm ÷ 5000

const CANADA_SHIP_RATES = [
  { maxKg:  2.0, domestic: 15,  usa: 35,  asia: 65,  europe: 70,  other: 75  },
  { maxKg:  4.0, domestic: 22,  usa: 50,  asia: 85,  europe: 90,  other: 100 },
  { maxKg:  6.0, domestic: 30,  usa: 65,  asia: 105, europe: 115, other: 125 },
  { maxKg:  8.0, domestic: 38,  usa: 80,  asia: 125, europe: 135, other: 150 },
  { maxKg: 10.0, domestic: 45,  usa: 95,  asia: 145, europe: 155, other: 175 },
  { maxKg: 15.0, domestic: 55,  usa: 115, asia: 175, europe: 190, other: 210 },
  { maxKg: 20.0, domestic: 65,  usa: 135, asia: 205, europe: 220, other: 245 },
];

const COUNTRY_ZONE = {
  'Canada':                         'domestic',
  'United States':                  'usa',
  'Japan / Korea / HK / Singapore': 'asia',
  'Australia / NZ / SE Asia':       'asia',
  'Europe / Middle East':           'europe',
  'Other International':            'other',
};

function calcDeliveryFee(country, qty) {
  if (!country) return 0;
  const totalWeight = qty * WEIGHT_PER_BOX;
  const zone = COUNTRY_ZONE[country] || 'other';
  const tier = CANADA_SHIP_RATES.find(t => totalWeight <= t.maxKg) ?? CANADA_SHIP_RATES[CANADA_SHIP_RATES.length - 1];
  return Math.ceil(tier[zone] * 1.10); // +10% buffer, rounded up
}

// ── Buy Now Modal ─────────────────────────────────────────────────────────────
function BuyNowModal({ item, onClose, userEmail }) {
  const [step, setStep]           = useState(1);
  const [qty, setQty]             = useState(1);
  const [liveStock, setLiveStock] = useState(item.stock ?? 0);
  const [country, setCountry]     = useState('');
  const [province, setProvince]   = useState('');
  const [currency, setCurrency]   = useState('CAD');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [address, setAddress]     = useState('');
  const [email, setEmail]         = useState(userEmail ?? '');
  const [copied, setCopied]       = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentB64, setPaymentB64]   = useState('');
  const [orderNumber] = useState(() => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `CNC-${ts.slice(-5)}${rand}`;
  });

  useEffect(() => {
    let ignore = false;

    async function loadLiveStock() {
      if (!supabaseEnabled || !supabase) return;

      const { data, error } = await supabase
        .from('stock')
        .select('quantity,in_stock')
        .eq('id', item.id)
        .maybeSingle();

      if (ignore || error || !data) return;

      const nextStock = data.in_stock ? Math.max(0, data.quantity ?? 0) : 0;
      setLiveStock(nextStock);
      setQty((currentQty) => Math.max(1, Math.min(currentQty, nextStock || 1)));
    }

    loadLiveStock();

    return () => {
      ignore = true;
    };
  }, [item.id]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setSendError('Screenshot must be under 2MB.'); return; }
    setPaymentFile(file);
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        // Reduce quality until base64 fits under EmailJS 50KB variable limit
        let quality = 0.5;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 36000 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        setPaymentB64(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  const subtotal      = item.price * qty;
  const freeShipping  = country === 'Canada' && subtotal >= 300;
  const deliveryFee   = freeShipping ? 0 : calcDeliveryFee(country, qty);
  const taxRate     = country === 'Canada' && province ? (PROVINCE_TAX[province]?.rate ?? 0) : 0;
  const taxLabel    = country === 'Canada' && province ? (PROVINCE_TAX[province]?.label ?? '') : '';
  const taxAmount   = subtotal * taxRate;
  const grandTotal  = subtotal + taxAmount + deliveryFee;
  const total       = grandTotal.toFixed(2);
  const fxTotal     = cadToFx(grandTotal, currency);
  const sym         = CURRENCY_SYMBOLS[currency] ?? 'CAD $';

  function copyWise() {
    navigator.clipboard.writeText(WISE_HANDLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Live orders are not configured yet.');
      }
      if (qty > liveStock) {
        throw new Error(`Only ${liveStock} box${liveStock === 1 ? '' : 'es'} left in stock.`);
      }
      let proofHtml = 'Not provided';
      if (paymentB64) {
        try {
          const imgUrl = await uploadProofImage(paymentB64);
          proofHtml = `<img src="${imgUrl}" style="max-width:320px;border-radius:8px;">`;
        } catch {
          proofHtml = '(Screenshot could not be uploaded — buyer will email separately)';
        }
      }
      const orderPayload = {
        order_number: orderNumber,
        order_type: 'on_hand',
        status: 'pending',
        product_id: item.id,
        product_title: item.title,
        product_variant: item.subtitle,
        quantity: qty,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        buyer_address: address,
        delivery_country: country,
        delivery_province: province || null,
        subtotal,
        tax_amount: taxAmount,
        delivery_fee: deliveryFee,
        total_price: grandTotal,
        payment_proof: proofHtml,
        wise_handle: WISE_HANDLE,
      };

      const { error: orderError } = await supabase.from('orders').insert(orderPayload);
      if (orderError) throw orderError;

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          order_number:      orderNumber,
          buyer_name:        name,
          buyer_email:       email,
          buyer_phone:       phone,
          buyer_address:     address,
          item_title:        item.title,
          item_variant:      item.subtitle,
          quantity:          qty,
          subtotal:          `CAD $${subtotal.toFixed(2)}`,
          tax_amount:        taxAmount > 0 ? `CAD $${taxAmount.toFixed(2)} (${taxLabel})` : 'N/A',
          delivery_fee:      freeShipping ? 'FREE (Canada $300+)' : `CAD $${deliveryFee.toFixed(2)} (Canada Post / DHL)`,
          delivery_country:  country,
          delivery_province: province || 'N/A',
          total_price:       `CAD $${total}`,
          payment_proof:     proofHtml,
          wise_handle:       WISE_HANDLE,
          to_email:          CONTACT_EMAIL,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      setSubmitted(true);
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
          { order_number: orderNumber, buyer_name: name, buyer_email: email, buyer_phone: phone, buyer_address: address, item_title: item.title, item_variant: item.subtitle, quantity: qty, subtotal: `CAD $${subtotal.toFixed(2)}`, tax_amount: taxAmount > 0 ? `CAD $${taxAmount.toFixed(2)} (${taxLabel})` : 'N/A', delivery_fee: freeShipping ? 'FREE (Canada $300+)' : `CAD $${deliveryFee.toFixed(2)} (Canada Post / DHL)`, delivery_country: country, delivery_province: province || 'N/A', total_price: `CAD $${total}`, payment_proof: proofHtml, wise_handle: WISE_HANDLE, to_email: email },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      } catch (buyerErr) { console.warn('Buyer copy failed:', buyerErr); }
    } catch (error) {
      console.error('Order submit failed:', error);
      setSendError(error?.message || ('Failed to send. Email us directly at ' + CONTACT_EMAIL));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.28 }}
        className="relative w-full max-w-md rounded-[32px] border border-cyan-400/20 bg-[#07030f] overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="h-1 w-full bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400" />
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
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/8 px-5 py-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/60 mb-0.5">Order Number</div>
                <div className="text-lg font-black text-cyan-200 tracking-widest">{orderNumber}</div>
              </div>
              <p className="max-w-xs text-sm text-white/60 leading-6">
                We'll verify your Wise payment and confirm to <span className="text-cyan-300">{email}</span> within 24h.
              </p>
              <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/60 space-y-1">
                <div><span className="text-white/35">Order #:</span> <span className="text-white/80 font-bold">{orderNumber}</span></div>
                <div><span className="text-white/35">Item:</span> {item.title}</div>
                <div><span className="text-white/35">Qty:</span> {qty}</div>
                {taxAmount > 0 && <div><span className="text-white/35">Tax:</span> CAD ${taxAmount.toFixed(2)}</div>}
                <div><span className="text-white/35">Delivery:</span> CAD ${deliveryFee.toFixed(2)}</div>
                <div><span className="text-white/35">Total paid via Wise:</span> <span className="text-cyan-300 font-bold">CAD ${total}</span></div>
              </div>
              <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-black uppercase text-white/65 hover:bg-white/10">Done</button>
            </motion.div>

          ) : step === 1 ? (
            <>
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Buy Now — On Hand</div>
                <div className="text-xl font-black leading-snug">{item.title}</div>
                <div className="mt-1 text-sm text-white/45">{item.subtitle}</div>
              </div>

              {/* Qty */}
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">Quantity</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-lg font-black hover:bg-white/10">−</button>
                  <span className="text-2xl font-black w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(liveStock, q + 1))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-lg font-black hover:bg-white/10">+</button>
                </div>
                <div className="mt-2 text-xs text-white/35">Live stock available: {liveStock}</div>
              </div>

              {/* Country / Province */}
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">Shipping Destination</div>
                <select
                  value={country}
                  onChange={e => { const c = e.target.value; setCountry(c); setProvince(''); setCurrency(c === 'Canada' ? 'CAD' : 'USD'); }}
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none focus:border-cyan-300/40 appearance-none"
                >
                  <option value="" disabled>Select destination…</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="Japan / Korea / HK / Singapore">🇯🇵 Japan / Korea / HK / Singapore</option>
                  <option value="Australia / NZ / SE Asia">🇦🇺 Australia / NZ / SE Asia</option>
                  <option value="Europe / Middle East">🌍 Europe / Middle East</option>
                  <option value="Other International">🌏 Other International</option>
                </select>
                {country === 'Canada' && (
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none focus:border-cyan-300/40 appearance-none"
                  >
                    <option value="" disabled>Select province / territory…</option>
                    {Object.keys(PROVINCE_TAX).map(p => (
                      <option key={p} value={p}>{p} — {PROVINCE_TAX[p].label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Currency selector — non-Canada only */}
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

              {/* Price Breakdown */}
              <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/6 p-4 space-y-1.5">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300/60 mb-2">Price Breakdown</div>
                <div className="flex justify-between text-sm text-white/70">
                  <span>Subtotal ({qty}×)</span>
                  <span>{sym}{cadToFx(subtotal, currency).toFixed(2)}</span>
                </div>
                {country === 'Canada' && province && (
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Tax ({taxLabel} — {province})</span>
                    <span>{sym}{cadToFx(taxAmount, currency).toFixed(2)}</span>
                  </div>
                )}
                {country && (
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Delivery — {freeShipping ? 'FREE Shipping 🎉' : `Canada Post / DHL (${(qty * WEIGHT_PER_BOX).toFixed(2)}kg)`}</span>
                    <span className={freeShipping ? 'text-green-400 font-bold' : ''}>{freeShipping ? 'FREE' : `${sym}${cadToFx(deliveryFee, currency).toFixed(2)}`}</span>
                  </div>
                )}
                {freeShipping && (
                  <div className="text-xs text-green-400 font-black text-center py-1">FREE SHIPPING on Canadian orders over CAD $300</div>
                )}
                <div className="border-t border-cyan-300/20 pt-2 flex justify-between items-end">
                  <span className="font-black text-sm">Total — send via Wise</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-cyan-200">{country ? `${sym}${fxTotal.toFixed(2)}` : '—'}</div>
                    {currency !== 'CAD' && country && (
                      <div className="text-xs text-white/30 mt-0.5">≈ CAD ${total} · rate incl. 3% Wise fee</div>
                    )}
                  </div>
                </div>
                {!country && <div className="text-xs text-white/35 text-center">Select destination to see total</div>}
              </div>

              {/* Wise handle */}
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/40 mb-2">Send to</div>
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&format=png&bgcolor=ffffff&data=https%3A%2F%2Fwise.com%2Fpay%2Fme%2Fcloudninecards"
                      alt="Scan to pay on Wise"
                      className="h-[80px] w-[80px] rounded-xl flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/40 mb-1">Send to Wise account</div>
                      <div className="text-xl font-black text-cyan-200">{WISE_HANDLE}</div>
                      <div className="text-xs text-white/35 mt-0.5">Cloud Nine Cards — Wise</div>
                      <div className="text-[10px] text-white/30 mt-1">Or scan QR code with your Wise app</div>
                    </div>
                    <button onClick={copyWise} className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 transition flex-shrink-0">
                      {copied ? <Check className="h-4 w-4 text-cyan-300" /> : <Copy className="h-4 w-4 text-white/50" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="mb-4 space-y-2">
                {[
                  { n: '1', text: country ? `Send ${sym}${fxTotal.toFixed(2)} to ${WISE_HANDLE} via Wise.` : `Select your destination above, then send the total via Wise.` },
                  { n: '2', text: 'Include your name + item in the Wise reference/note.' },
                  { n: '3', text: 'Take a screenshot of the completed payment.' },
                  { n: '4', text: `Fill in the next step — we'll confirm within 24h.` },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3 items-start rounded-xl border border-white/8 bg-white/4 p-3">
                    <div className="h-5 w-5 rounded-full bg-cyan-500/50 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{n}</div>
                    <p className="text-xs text-white/60 leading-5">{text}</p>
                  </div>
                ))}
              </div>

              {/* Terms */}
              <div className="mb-5 space-y-2">
                {[
                  { icon: Globe,       text: 'International buyers cover shipping & customs — not included in price.' },
                  { icon: Package,     text: 'Ships 3–5 business days after payment clears. Photos on request.' },
                  { icon: ShieldCheck, text: 'Every item is checked before it goes out. Something wrong? We fix it.' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex gap-2.5 rounded-xl border border-white/8 bg-white/4 p-3">
                    <Icon className="h-4 w-4 text-cyan-300/60 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/55 leading-5">{text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!country || (country === 'Canada' && !province)}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-black hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                I've Sent the Payment →
              </button>
            </>

          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Confirm Your Order</div>
                <div className="text-xl font-black">Tell us who you are</div>
                <p className="text-xs text-white/45 mt-1 leading-5">We'll match your details with the Wise payment and send confirmation.</p>
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Full name</label>
                <input required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Name used on Wise" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  readOnly={!!userEmail}
                  placeholder="Confirmation sent here"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${userEmail ? 'border-white/5 bg-white/5 text-white/50 cursor-default' : 'border-white/10 bg-black/30 text-white focus:border-cyan-300/40'} placeholder-white/25`} />
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Phone / WhatsApp</label>
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40" />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Delivery Address</label>
                <textarea required rows={3} value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Full delivery address (street, city, province/state, country, postal code)"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40 resize-none" />
              </div>

              <div className="mb-4 flex gap-3 rounded-2xl border border-yellow-400/25 bg-yellow-400/8 px-4 py-4">
                <Camera className="h-4 w-4 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-yellow-200 mb-1">Payment Screenshot Required</div>
                  <p className="text-xs text-yellow-100/70 leading-5">
                    After submitting, <strong>email your Wise screenshot to <span className="text-cyan-300">{CONTACT_EMAIL}</span></strong> with your name and order details. Orders cannot be processed without proof of payment.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-4 text-xs text-white/50 space-y-1.5">
                <div className="font-black text-white/70 uppercase tracking-[0.12em] text-[10px] mb-2">Order Summary</div>
                <div className="flex justify-between"><span>{item.title}</span><span>× {qty}</span></div>
                <div className="flex justify-between"><span>Subtotal</span><span>{sym}{cadToFx(subtotal, currency).toFixed(2)}</span></div>
                {taxAmount > 0 && <div className="flex justify-between"><span>Tax ({taxLabel})</span><span>{sym}{cadToFx(taxAmount, currency).toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Delivery {freeShipping ? '(Free!)' : `(Canada Post / DHL — ${country})`}</span><span className={freeShipping ? 'text-green-400' : ''}>{freeShipping ? 'FREE' : `${sym}${cadToFx(deliveryFee, currency).toFixed(2)}`}</span></div>
                <div className="flex justify-between text-cyan-300 font-bold border-t border-white/8 pt-1.5"><span>Total sent via Wise</span><span>{sym}{fxTotal.toFixed(2)}</span></div>
                <div className="flex items-start gap-2 text-white/35 border-t border-white/8 pt-2">
                  <Camera className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Email your Wise screenshot to <span className="text-cyan-300">{CONTACT_EMAIL}</span></span>
                </div>
              </div>

              {sendError && <div className="mb-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">{sendError}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} disabled={sending}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase text-white/55 hover:bg-white/10 disabled:opacity-40">Back</button>
                <button type="submit" disabled={sending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3 text-sm font-black uppercase tracking-[0.1em] text-black hover:opacity-95 disabled:opacity-60">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : 'Submit Order'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Notify Me Modal ───────────────────────────────────────────────────────────
function NotifyMeModal({ item, onClose }) {
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      if (supabaseEnabled && supabase) {
        const { error } = await supabase.from('waitlist').insert({
          email: email.trim().toLowerCase(),
          product_id: item.id,
          product_title: item.title,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Waitlist insert failed:', err);
      setSendError(err?.message || 'Something went wrong — try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#07030f] overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" />
        <div className="p-6">
          <button onClick={onClose} className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 hover:bg-white/10">
            <X className="h-4 w-4 text-white/60" />
          </button>

          {submitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 p-5">
                <Check className="h-10 w-10 text-fuchsia-300" />
              </div>
              <div className="text-2xl font-black uppercase">You're on the list!</div>
              <p className="max-w-xs text-sm text-white/60 leading-6">
                We'll email <span className="text-fuchsia-300">{email}</span> as soon as <span className="text-white/80">{item.title}</span> is back in stock.
              </p>
              <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-black uppercase text-white/65 hover:bg-white/10">
                Close
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300/70 mb-1">Get Notified</div>
                <div className="text-xl font-black leading-snug">{item.title}</div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none"
                />
                {sendError && <p className="text-xs text-red-400">{sendError}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? 'Saving…' : 'Notify Me'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Normalize a Supabase products row to the shape the UI expects
function normalizeDbProduct(row) {
  return {
    id:       row.id,
    title:    row.title,
    subtitle: row.subtitle ?? '',
    language: row.language ?? 'English',
    price:    Number(row.price) || 0,
    badge:    row.badge ?? (row.in_stock ? 'In Stock' : 'Sold Out'),
    inStock:  row.in_stock,
    stock:    row.stock ?? 0,
    image:    row.image_url ?? '/product-fallback.svg',
    tag:      row.tag ?? 'One Piece',
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTag, setActiveTag] = useState('All');
  const [langFilter, setLangFilter] = useState('All');
  const [selected, setSelected]   = useState(null);
  const [notifyItem, setNotifyItem] = useState(null);
  const [products, setProducts]   = useState([]);
  const [stockSyncError, setStockSyncError] = useState('');

  useEffect(() => { document.title = 'Shop | CloudNineCards'; }, []);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (!productId) return;

    const match = products.find((product) => product.id === productId);
    if (!match || !match.inStock) return;

    setSelected((current) => (current?.id === match.id ? current : match));
  }, [products, searchParams]);

  function openProduct(item) {
    if (!user) { navigate('/account', { state: { redirect: `/shop?product=${item.id}` } }); return; }
    setSelected(item);
    setSearchParams({product: item.id});
  }

  function closeProduct() {
    setSelected(null);
    setSearchParams({});
  }

  useEffect(() => {
    if (!supabaseEnabled || !supabase) {
      setStockSyncError('Live stock sync is not configured for this deployment yet.');
      return;
    }

    async function loadAll() {
      // Load preorders from DB (always, regardless of products source)
      const { data: poData } = await supabase
        .from('preorders')
        .select('*')
        .order('display_order', { ascending: true });
      const preorderProducts = (poData ?? []).map(po => ({
        id:        po.id,
        title:     po.title,
        subtitle:  po.subtitle ?? '',
        language:  null,
        price:     Number(po.price) || 0,
        priceTba:  po.price_tba || false,
        badge:     po.sold_out ? 'Sold Out' : po.price_tba ? 'Price TBA' : 'Pre-order',
        inStock:   !po.sold_out,
        stock:     0,
        image:     po.image_url ?? '/product-fallback.svg',
        tag:       'Pre-orders',
        isPreorder: true,
        eta:       po.eta,
      }));

      // Try loading on-hand products from `products` table; fall back to `stock` overlay
      const { data: prodData, error: prodError } = await supabase.from('products').select('*');
      if (!prodError && prodData && prodData.length > 0) {
        setStockSyncError('');
        setProducts([...prodData.map(normalizeDbProduct), ...preorderProducts]);
        return;
      }
      // Fall back: overlay stock table onto hardcoded allProducts
      const { data, error } = await supabase.from('stock').select('*');
      if (error) {
        setStockSyncError('Inventory may not be current — check back soon.');
        setProducts(prev => [...prev.filter(p => !p.isPreorder), ...preorderProducts]);
        return;
      }
      setStockSyncError('');
      const merged = allProducts.map(p => {
        const row = (data ?? []).find(r => r.id === p.id);
        if (!row) return p;
        return { ...p, inStock: row.in_stock, stock: row.quantity, badge: row.in_stock ? 'In Stock' : 'Sold Out' };
      });
      setProducts([...merged, ...preorderProducts]);
    }

    loadAll();
  }, []);

  const filtered = products
    .filter(p => activeTag === 'All' || p.tag === activeTag)
    .filter(p => langFilter === 'All' || !p.language || p.language === langFilter)
    .sort((a, b) => {
      const score = p => p.inStock ? 0 : p.isPreorder ? 1 : 2;
      return score(a) - score(b);
    });

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <AnimatePresence>
        {selected && <BuyNowModal item={selected} onClose={closeProduct} userEmail={user?.email ?? ''} />}
      </AnimatePresence>
      <AnimatePresence>
        {notifyItem && <NotifyMeModal item={notifyItem} onClose={() => setNotifyItem(null)} />}
      </AnimatePresence>

      <style>{`
        @keyframes floatDeco {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-18px) rotate(-6deg); }
        }
        .deco-float { animation: floatDeco 7s ease-in-out infinite; }
      `}</style>

      <section className="relative border-b border-fuchsia-500/20 bg-[#07030f] px-6 pb-6 pt-6 overflow-hidden min-h-[420px] flex flex-col justify-center">
        {/* existing radial bg */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.15),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_40%)]" />
        {/* bottom-center radial burst — purple/cyan */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[220px] bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.22)_0%,rgba(34,211,238,0.10)_45%,transparent_70%)] pointer-events-none" />
        {/* Zoro character art */}
        <img
          src="/zoro.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-[520px] w-auto select-none"
          style={{ opacity: 0.45, filter: 'drop-shadow(0 0 40px rgba(52,211,153,0.6)) drop-shadow(0 0 80px rgba(52,211,153,0.25))', zIndex: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <div className="mt-4">
            <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300/75">All products</div>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Shop</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {stockSyncError && (
          <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            {stockSyncError}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <button key={tag} onClick={() => { setActiveTag(tag); setLangFilter('All'); }}
              className={`rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                activeTag === tag
                  ? 'border-purple-400/60 bg-purple-500/15 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                  : 'border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:text-white/85'
              }`}>
              {tag}
            </button>
          ))}
        </div>

        {/* Language sub-filter — hidden for Accessories */}
        {activeTag !== 'Accessories' && activeTag !== 'Pre-orders' && (
          <div className="mb-8 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Language:</span>
            {langFilters.map((lang) => (
              <button key={lang} onClick={() => setLangFilter(lang)}
                className={`rounded-full border px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                  langFilter === lang
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/8 bg-white/3 text-white/40 hover:border-white/15 hover:text-white/60'
                }`}>
                {lang === 'Japanese' ? '🇯🇵 JP' : lang === 'English' ? '🇺🇸 EN' : 'All'}
              </button>
            ))}
          </div>
        )}

        {/* ── Section header — anime style ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">
              In Stock Now
            </h2>
          </div>
          <p className="mt-1 text-xs text-white/35 uppercase tracking-[0.16em]">Sealed product · shipped from Canada</p>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📦</div>
            <div className="text-xl font-black uppercase">No {activeTag} stock right now</div>
            <p className="mt-2 text-sm text-white/50">Nothing here right now — follow us on Instagram to catch the next drop.</p>
            <button onClick={() => setActiveTag('All')} className="mt-6 rounded-2xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-white/75 hover:bg-white/10">
              View all products
            </button>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className={`group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] hover:scale-[1.02] transition-transform duration-300${!item.inStock ? ' grayscale-[0.4]' : ''}`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300" />
              {/* diagonal shine sweep on hover */}
              <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[32px]">
                <div className="absolute -inset-full top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[350%] transition-all duration-700 ease-in-out" />
              </div>
              <Link to={`/shop/${item.id}`} className="relative overflow-hidden block">
                <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[260px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/72 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                  {item.badge}
                </div>
              </Link>
              <div className="p-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300/75">{item.subtitle}</div>
                <Link to={`/shop/${item.id}`} className="mt-2 block text-lg font-black leading-snug hover:text-cyan-200 transition">{item.title}</Link>
                <div className="mt-4 text-3xl font-black">{item.priceTba ? 'Price TBA' : `CAD $${item.price.toFixed(2)}`}</div>
                <div className="mt-1 text-xs text-white/30">+ shipping & tax calculated at checkout</div>
                <div className="mt-4">
                  {item.isPreorder ? (
                    <Link to="/pre-orders"
                      className="flex w-full items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-fuchsia-200 transition hover:bg-fuchsia-400/15">
                      Pre-order →
                    </Link>
                  ) : item.inStock ? (
                    <button onClick={() => openProduct(item)}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95">
                      Buy Now — Wise
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button disabled className="w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white/25 cursor-not-allowed">
                        Sold Out
                      </button>
                      <button
                        onClick={() => setNotifyItem(item)}
                        className="w-full rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/8 px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-fuchsia-300 transition hover:bg-fuchsia-400/15"
                      >
                        Notify Me
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ── Follow the Drop CTA banner ── */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="relative overflow-hidden rounded-[28px] border border-transparent bg-gradient-to-r from-cyan-400/20 to-fuchsia-400/20 p-px">
          <div className="rounded-[27px] bg-[#08020f] px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* left — text block */}
            <div>
              <div className="text-2xl font-black uppercase tracking-[0.08em] bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">
                Follow us on Instagram
              </div>
              <p className="mt-1.5 text-sm text-white/45 max-w-sm">
                New sealed product, restocks, and pre-orders — announced on Instagram first. Don't miss the next wave.
              </p>
            </div>
            {/* right — CTA button */}
            <a
              href="https://www.instagram.com/cloudninecards"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-90 hover:scale-[1.03] duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @cloudninecards
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
