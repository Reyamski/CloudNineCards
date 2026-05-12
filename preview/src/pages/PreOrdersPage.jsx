import { BellRing, ChevronRight, Zap, X, Copy, Check, AlertTriangle, Truck, Globe, CreditCard, Camera, Mail, Loader2, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';

// ── EmailJS config ───────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_PREORDER;
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

// ── Pre-order window config ──────────────────────────────────────────────────
const PO_OPEN_DATE  = new Date('2025-11-01T00:00:00');
const PO_CLOSE_DATE = new Date('2026-09-30T23:59:59'); // TODO: confirm actual OP-17 JP deadline
const now = new Date();
const isOpen = now >= PO_OPEN_DATE && now <= PO_CLOSE_DATE;

const WISE_HANDLE = '@cloudninecards';
const CONTACT_EMAIL = 'papspective@gmail.com';
const DP_PERCENT = 0.30;

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

// ── Shipping (pre-orders ship per case = 12 booster boxes) ───────────────────
const WEIGHT_PER_CASE = 22.92; // kg — 12 boxes × 1.91kg each
const PO_SHIP_RATES = [
  { maxKg:  2.0, domestic: 15,  usa: 35,  asia: 65,  europe: 70,  other: 75  },
  { maxKg:  4.0, domestic: 22,  usa: 50,  asia: 85,  europe: 90,  other: 100 },
  { maxKg:  6.0, domestic: 30,  usa: 65,  asia: 105, europe: 115, other: 125 },
  { maxKg:  8.0, domestic: 38,  usa: 80,  asia: 125, europe: 135, other: 150 },
  { maxKg: 10.0, domestic: 45,  usa: 95,  asia: 145, europe: 155, other: 175 },
  { maxKg: 15.0, domestic: 55,  usa: 115, asia: 175, europe: 190, other: 210 },
  { maxKg: 20.0, domestic: 65,  usa: 135, asia: 205, europe: 220, other: 245 },
];
const PO_COUNTRY_ZONE = {
  'Canada':                         'domestic',
  'United States':                  'usa',
  'Japan / Korea / HK / Singapore': 'asia',
  'Australia / NZ / SE Asia':       'asia',
  'Europe / Middle East':           'europe',
  'Other International':            'other',
};
function calcPoShipping(country, qty) {
  if (!country) return 0;
  const totalWeight = qty * WEIGHT_PER_CASE;
  const zone = PO_COUNTRY_ZONE[country] || 'other';
  const tier = PO_SHIP_RATES.find(t => totalWeight <= t.maxKg) ?? PO_SHIP_RATES[PO_SHIP_RATES.length - 1];
  return Math.ceil(tier[zone] * 1.10); // +10% buffer, rounded up
}

const preorders = [
  {
    id: 'op17jp',
    title: 'One Piece Card Game OP-17 Booster Box [Japanese]',
    subtitle: '4th Anniversary Set – "World\'s Strongest Warrior"',
    soldOut: true,
    priceTba: false,
    price: 93,
    usdPrice: 68,
    audPrice: 96,
    currency: 'CAD',
    eta: 'Est. Aug 31, 2026',
    deadline: new Date('2026-04-13T11:00:00'),
    image: '/OP-17-JP.png',
    hype: '4th Anniversary Set',
    notes: [
      'Per Box — Case (12 Boxes): CAD $1,113 | USD $810 | AUD $1,148.',
      'Pre-orders are not guaranteed and subject to allocation.',
      'If allocation is cut, down payment will be refunded.',
      'Buyer shoulders shipping fees, taxes, and import duties.',
    ],
  },
  {
    id: 'ygo-cg2122ae',
    title: 'Yu-Gi-Oh! Creation Pack 12 [CG2122AE]',
    subtitle: 'Asian English · Per Case (24 Boxes)',
    soldOut: true,
    priceTba: false,
    price: 1650.55,
    usdPrice: 1196.08,
    audPrice: 1718.31,
    currency: 'CAD',
    eta: 'Est. July 11, 2026',
    deadline: new Date('2026-03-28T18:00:00'),
    image: '/Yu-Gi-Oh! Creation Pack 12.png',
    hype: 'Limited Allocation',
    notes: [
      'Limited allocation only. Pre-orders may be cut.',
      'Orders released only after full payment cleared.',
      'Buyer shoulders shipping fees, taxes, and import duties.',
    ],
  },
  {id: 'op17eng', title: 'One Piece Card Game OP-17 Booster Box',  subtitle: 'English',  soldOut: true,  priceTba: false, currency: 'CAD', eta: 'TBD', image: 'https://placehold.co/400x560/0d0020/9333ea?text=OP-17%0AEnglish%0ABooster+Box&font=montserrat', hype: 'Stay tuned for updates.'},
  {id: 'op16eng', title: 'One Piece Card Game OP-16 Booster Box',  subtitle: 'English',  soldOut: true,  priceTba: false, currency: 'CAD', eta: 'TBD', image: 'https://placehold.co/400x560/0d0020/9333ea?text=OP-16%0AEnglish%0ABooster+Box&font=montserrat', hype: 'Stay tuned for updates.'},
  {id: 'op16jp',  title: 'One Piece Card Game OP-16 Booster Box',  subtitle: 'Japanese', soldOut: true,  priceTba: false, currency: 'CAD', eta: 'TBD', image: 'https://placehold.co/400x560/0d0020/c084fc?text=OP-16%0AJapanese%0ABooster+Box&font=montserrat', hype: 'Stay tuned for updates.'},
];

// ── Modal ────────────────────────────────────────────────────────────────────
function PreOrderModal({ item, onClose }) {
  const dp = ((item.price ?? 0) * DP_PERCENT).toFixed(2);
  const remaining = ((item.price ?? 0) * (1 - DP_PERCENT)).toFixed(2);
  const [step, setStep] = useState(1); // 1=terms, 2=payment, 3=confirm
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentB64, setPaymentB64]   = useState('');
  const [orderNumber] = useState(() => {
    const n = parseInt(localStorage.getItem('cnc_order_counter') || '0', 10) + 1;
    return `CNC-${String(n).padStart(6, '0')}`;
  });

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

  const subtotal       = (item.price ?? 0) * qty;
  const taxRate        = country === 'Canada' && province ? (PROVINCE_TAX[province]?.rate ?? 0) : 0;
  const taxLabel       = country === 'Canada' && province ? (PROVINCE_TAX[province]?.label ?? '') : '';
  const taxAmount      = subtotal * taxRate;
  const shippingFee    = calcPoShipping(country, qty); // includes 10% buffer
  const grandTotal     = subtotal + taxAmount + shippingFee;
  const totalPrice     = grandTotal.toFixed(2);
  const totalDp        = (grandTotal * DP_PERCENT).toFixed(2);
  const totalRemaining = (grandTotal * (1 - DP_PERCENT)).toFixed(2);

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
      let proofHtml = 'Not provided';
      if (paymentB64) {
        try {
          const imgUrl = await uploadProofImage(paymentB64);
          proofHtml = `<img src="${imgUrl}" style="max-width:320px;border-radius:8px;">`;
        } catch {
          proofHtml = '(Screenshot could not be uploaded — buyer will email separately)';
        }
      }
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          order_number:  orderNumber,
          buyer_name:    name,
          buyer_email:   email,
          buyer_phone:   phone,
          buyer_address: address,
          item_title:    item.title,
          item_subtitle: item.subtitle,
          quantity:      qty,
          full_price:    `CAD $${totalPrice}`,
          dp_amount:     `CAD $${totalDp}`,
          balance_due:   `CAD $${totalRemaining}`,
          eta:           item.eta,
          payment_proof: proofHtml,
          wise_handle:   WISE_HANDLE,
          to_email:      CONTACT_EMAIL,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      const next = parseInt(localStorage.getItem('cnc_order_counter') || '0', 10) + 1;
      localStorage.setItem('cnc_order_counter', String(next));
      setSubmitted(true);
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
          { order_number: orderNumber, buyer_name: name, buyer_email: email, buyer_phone: phone, buyer_address: address, item_title: item.title, item_subtitle: item.subtitle, quantity: qty, full_price: `CAD $${totalPrice}`, dp_amount: `CAD $${totalDp}`, balance_due: `CAD $${totalRemaining}`, eta: item.eta, payment_proof: proofHtml, wise_handle: WISE_HANDLE, to_email: email },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      } catch (buyerErr) { console.warn('Buyer copy failed:', buyerErr); }
    } catch (err) {
      setSendError('Failed to send. Please email us directly at ' + CONTACT_EMAIL);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg rounded-[32px] border border-fuchsia-400/20 bg-[#0d0520] overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300" />

        <div className="p-6">
          {/* Close */}
          <button onClick={onClose} className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 transition">
            <X className="h-4 w-4 text-white/60" />
          </button>

          {submitted ? (
            // ── Success ──
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
                <Check className="h-10 w-10 text-cyan-300" />
              </div>
              <div className="text-2xl font-black uppercase">Pre-Order Submitted!</div>
              <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/8 px-5 py-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300/60 mb-0.5">Order Number</div>
                <div className="text-lg font-black text-fuchsia-200 tracking-widest">{orderNumber}</div>
              </div>
              <p className="max-w-xs text-sm text-white/60 leading-6">
                We'll verify your Wise payment and send a confirmation to <span className="text-cyan-300">{email}</span> within 24 hours.
              </p>
              <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/65 space-y-1">
                <div><span className="text-white/40">Order #:</span> <span className="text-white/80 font-bold">{orderNumber}</span></div>
                <div><span className="text-white/40">Item:</span> {item.title}</div>
                <div><span className="text-white/40">Qty:</span> {qty}</div>
                <div><span className="text-white/40">DP Sent:</span> CAD ${totalDp}</div>
                <div><span className="text-white/40">Remaining on delivery:</span> CAD ${totalRemaining}</div>
              </div>
              <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-white/75 hover:bg-white/10">
                Done
              </button>
            </motion.div>

          ) : step === 1 ? (
            // ── Step 1: Terms ──
            <>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300/70 mb-1">Pre-order</div>
                <div className="text-xl font-black leading-snug">{item.title}</div>
                <div className="mt-1 text-sm text-white/50">{item.subtitle}</div>
              </div>

              {/* Qty */}
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40 mb-2">Quantity</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-lg font-black hover:bg-white/10">−</button>
                  <span className="text-2xl font-black w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-lg font-black hover:bg-white/10">+</button>
                </div>
              </div>

              {/* Country / Province */}
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40 mb-2">Shipping Destination</div>
                <select
                  value={country}
                  onChange={e => { setCountry(e.target.value); setProvince(''); }}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-300/40 appearance-none"
                >
                  <option value="" disabled>Select destination…</option>
                  <option>Canada</option>
                  <option>United States</option>
                  <option>Japan / Korea / HK / Singapore</option>
                  <option>Australia / NZ / SE Asia</option>
                  <option>Europe / Middle East</option>
                  <option>Other International</option>
                </select>
                {country === 'Canada' && (
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-300/40 appearance-none"
                  >
                    <option value="" disabled>Select province / territory…</option>
                    {Object.keys(PROVINCE_TAX).map(p => (
                      <option key={p} value={p}>{p} — {PROVINCE_TAX[p].label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price breakdown */}
              <div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Unit price</span>
                  <span className="font-bold">CAD ${(item.price ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Qty</span>
                  <span className="font-bold">× {qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Subtotal</span>
                  <span className="font-bold">CAD ${subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>Tax ({taxLabel})</span>
                    <span>CAD ${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {shippingFee > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>Est. Shipping <span className="text-white/35 text-[10px]">(+10% buffer)</span></span>
                    <span>CAD ${shippingFee.toFixed(2)}</span>
                  </div>
                )}
                {!country && <div className="text-xs text-white/35 text-center pt-1">Select destination to see shipping</div>}
                <div className="border-t border-white/8 pt-2 flex justify-between">
                  <span className="text-white/50">Total order</span>
                  <span className="font-bold">CAD ${country ? totalPrice : '—'}</span>
                </div>
                <div className="flex justify-between text-fuchsia-300 font-black">
                  <span>30% DP due now</span>
                  <span>CAD ${country ? totalDp : '—'}</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Remaining on arrival</span>
                  <span>CAD ${country ? totalRemaining : '—'}</span>
                </div>
              </div>

              {/* Terms */}
              <div className="mb-5 space-y-2">
                {[
                  { icon: Globe, text: 'International shipping — all shipping fees and customs/import taxes are shouldered by the buyer.' },
                  { icon: CreditCard, text: 'Payment via Wise only. 30% downpayment required to secure your pre-order.' },
                  { icon: Truck, text: 'Balance (70%) is due before item ships. We will contact you when ready.' },
                  { icon: AlertTriangle, text: 'Pre-orders are non-refundable once the DP is received.' },
                  { icon: AlertTriangle, text: 'Allocation is not guaranteed. In case of allocation cut by the publisher, a full refund will be issued.' },
                  ...(item.notes ?? []).map(text => ({ icon: AlertTriangle, text })),
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex gap-3 rounded-xl border border-white/8 bg-white/4 p-3">
                    <Icon className="h-4 w-4 text-fuchsia-300/70 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60 leading-5">{text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!country || (country === 'Canada' && !province)}
                className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-white hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                I agree — Proceed to Payment
              </button>
            </>

          ) : step === 2 ? (
            // ── Step 2: Payment ──
            <>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Step 1 of 2 — Send Payment</div>
                <div className="text-xl font-black">Pay via Wise</div>
              </div>

              {/* Amount to send */}
              <div className="mb-4 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/8 p-4 text-center">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-300/70 mb-1">Amount to send</div>
                <div className="text-4xl font-black text-fuchsia-200">CAD ${totalDp}</div>
                <div className="text-xs text-white/40 mt-1">30% downpayment · {qty}× {item.title.split(' ').slice(0, 4).join(' ')}...</div>
              </div>

              {/* Wise handle */}
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40 mb-2">Send to Wise account</div>
                <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                  <div className="flex-1">
                    <div className="text-2xl font-black text-cyan-200">{WISE_HANDLE}</div>
                    <div className="text-xs text-white/40 mt-0.5">Cloud Nine Cards — Wise</div>
                  </div>
                  <button onClick={copyWise} className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 transition">
                    {copied ? <Check className="h-4 w-4 text-cyan-300" /> : <Copy className="h-4 w-4 text-white/50" />}
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="mb-5 space-y-2">
                {[
                  { n: '1', text: `Open Wise and send CAD $${totalDp} to ${WISE_HANDLE}` },
                  { n: '2', text: 'In the Wise reference/note, include your name and order item.' },
                  { n: '3', text: 'Take a screenshot of the completed transaction.' },
                  { n: '4', text: `Email the screenshot to ${CONTACT_EMAIL} — we confirm within 24h.` },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3 items-start rounded-xl border border-white/8 bg-white/4 p-3">
                    <div className="h-5 w-5 rounded-full bg-fuchsia-500/60 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{n}</div>
                    <p className="text-xs text-white/65 leading-5">{text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white/60 hover:bg-white/10">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 py-3 text-sm font-black uppercase tracking-[0.1em] text-white hover:opacity-95 transition">
                  I've Sent the Payment →
                </button>
              </div>
            </>

          ) : (
            // ── Step 3: Confirm form ──
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Step 2 of 2 — Confirm Your Order</div>
                <div className="text-xl font-black">Tell us who you are</div>
                <p className="text-xs text-white/50 mt-1 leading-5">We'll cross-reference your details with the Wise transaction and email your confirmation.</p>
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Full name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name used on Wise payment"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40"
                />
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Confirmation will be sent here"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40"
                />
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Phone / WhatsApp</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40"
                />
              </div>

              {country === 'Canada' && (
                <div className="mb-3 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-xs text-white/50">
                  Shipping to: <span className="text-white/80 font-bold">{country}{province ? ` — ${province}` : ''}</span>
                </div>
              )}

              {country === 'Canada' && !province && (
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Province / Territory</label>
                  <select
                    required
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                  >
                    <option value="" disabled>Select province…</option>
                    {Object.keys(PROVINCE_TAX).map(p => (
                      <option key={p} value={p}>{p} — {PROVINCE_TAX[p].label}</option>
                    ))}
                  </select>
                  {province && taxAmount > 0 && (
                    <div className="mt-1.5 text-xs text-white/40">Tax ({taxLabel}): CAD ${taxAmount.toFixed(2)} added to total</div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Full delivery address (street, city, province/state, country, postal code)"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-300/40 resize-none"
                />
              </div>

              {/* Summary reminder */}
              {/* Payment screenshot */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">
                  Payment Screenshot <span className="normal-case font-normal text-white/25">(optional · max 2MB)</span>
                </label>
                <div className="flex items-center gap-3 w-full rounded-2xl border border-dashed border-white/10 bg-white/2 px-4 py-3 opacity-40 cursor-not-allowed select-none">
                  <Paperclip className="h-4 w-4 text-white/40 shrink-0" />
                  <span className="text-sm text-white/45 truncate">Reply to your confirmation email instead</span>
                </div>
              </div>

              <div className="mb-4 flex gap-2.5 rounded-2xl border border-yellow-400/20 bg-yellow-400/6 px-4 py-3">
                <span className="text-yellow-300 text-sm shrink-0">📸</span>
                <p className="text-xs text-yellow-200/80 leading-5">
                  After submitting, <strong>reply to your confirmation email within 24 hours</strong> with your Wise payment screenshot. We cannot process your order without proof of payment.
                </p>
              </div>

              <div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-4 text-xs text-white/55 space-y-1.5">
                <div className="font-black text-white/75 uppercase tracking-[0.12em] text-[10px] mb-2">Order Summary</div>
                <div className="flex justify-between"><span>{item.title}</span><span>× {qty}</span></div>
                <div className="flex justify-between text-fuchsia-300 font-bold"><span>DP sent via Wise</span><span>CAD ${totalDp}</span></div>
                <div className="flex justify-between"><span>Remaining (pay on arrival)</span><span>CAD ${totalRemaining}</span></div>
                <div className="border-t border-white/8 pt-2 flex items-start gap-2 text-white/40">
                  <Camera className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Don't forget to email your Wise screenshot to <span className="text-cyan-300">{CONTACT_EMAIL}</span></span>
                </div>
              </div>

              {sendError && (
                <div className="mb-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">{sendError}</div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} disabled={sending} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white/60 hover:bg-white/10 disabled:opacity-40">
                  Back
                </button>
                <button type="submit" disabled={sending} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3 text-sm font-black uppercase tracking-[0.1em] text-black hover:opacity-95 transition disabled:opacity-60">
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PreOrdersPage() {
  const [selected, setSelected] = useState(null);

  useEffect(() => { document.title = 'Pre-Orders | CloudNineCards'; }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <AnimatePresence>
        {selected && <PreOrderModal item={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* Header */}
      <section className="relative overflow-hidden border-b border-fuchsia-500/20 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.25),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100">
              <BellRing className="h-4 w-4" />
              {isOpen ? 'Pre-orders Open' : 'Pre-orders Closed'}
            </div>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
              Pre-orders
              <span className="block bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                incoming.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/65">
              Lock in your sets before they sell out. Reserve with 30% downpayment via Wise — balance due before shipment.
            </p>

            {/* Status bar */}
            <div className="mt-6 inline-flex flex-wrap gap-4">
              <div className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${isOpen ? 'border-green-400/30 bg-green-400/10 text-green-300' : 'border-red-400/30 bg-red-400/10 text-red-300'}`}>
                {isOpen ? '● Open now' : '● Closed'}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/55">
                {isOpen ? 'Window: Nov 2025 – Apr 2026' : 'Next window: Coming soon'}
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                Payment: Wise · @cloudninecards
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { n: '01', icon: BellRing, label: 'Reserve', desc: 'Pick your item & qty. Agree to terms.' },
            { n: '02', icon: CreditCard, label: 'Pay 30% DP', desc: `Send via Wise to ${WISE_HANDLE}` },
            { n: '03', icon: Camera, label: 'Send Screenshot', desc: `Email proof to ${CONTACT_EMAIL}` },
            { n: '04', icon: Truck, label: 'Ships on release', desc: 'Pay remaining 70% before we ship.' },
          ].map(({ n, icon: Icon, label, desc }) => (
            <div key={n} className="rounded-[22px] border border-white/8 bg-white/4 p-4 flex gap-3">
              <div className="text-2xl font-black text-white/15 shrink-0">{n}</div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-fuchsia-300" />
                  <div className="text-sm font-black uppercase tracking-[0.1em]">{label}</div>
                </div>
                <p className="text-xs text-white/45 leading-5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* International shipping notice */}
      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-yellow-400/20 bg-yellow-400/6 p-4">
          <Globe className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
          <p className="text-sm text-white/65 leading-6">
            <span className="font-black text-yellow-200">International Shipping Notice —</span> All pre-orders are shipped internationally. Shipping fees, customs duties, and import taxes are fully shouldered by the buyer and are not included in the product price. You will be quoted actual shipping cost before your balance payment is collected.
          </p>
        </div>
      </section>

      {/* Pre-order cards */}
      <section className="mx-auto max-w-7xl px-6 py-8 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {preorders.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="group relative overflow-hidden rounded-[32px] border border-fuchsia-400/20 bg-[linear-gradient(180deg,#0d0520,#14081d)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300" />
              <div className="relative overflow-hidden">
                <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[260px] w-full object-cover saturate-[1.3] transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-black/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200 backdrop-blur">
                  <Zap className="h-3 w-3" /> {item.hype}
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-fuchsia-300/75">{item.subtitle}</div>
                <div className="mt-2 text-lg font-black leading-snug">{item.title}</div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-[0.12em]">Full price</div>
                    {item.soldOut ? (
                      <div className="text-2xl font-black text-white/30">Sold Out</div>
                    ) : item.priceTba ? (
                      <div className="text-3xl font-black text-fuchsia-300">TBA</div>
                    ) : (
                      <div className="text-3xl font-black">CAD ${item.price.toFixed(2)}</div>
                    )}
                  </div>
                  {!item.soldOut && !item.priceTba && (
                    <div className="text-right">
                      <div className="text-xs text-white/40 uppercase tracking-[0.12em]">30% DP</div>
                      <div className="text-xl font-black text-fuchsia-300">${(item.price * DP_PERCENT).toFixed(2)}</div>
                    </div>
                  )}
                </div>

                <div className="mt-1 text-xs text-white/35">+ international shipping & taxes (buyer's account)</div>

                {(item.usdPrice || item.audPrice) && (
                  <div className="mt-1.5 flex gap-3 text-[11px] text-white/30">
                    {item.usdPrice && <span>USD ${item.usdPrice.toFixed(2)}</span>}
                    {item.audPrice && <span>AUD ${item.audPrice.toFixed(2)}</span>}
                  </div>
                )}

                {item.deadline && (() => {
                  const msLeft = item.deadline - new Date();
                  const daysLeft = Math.ceil(msLeft / 86400000);
                  const urgent = daysLeft <= 7 && daysLeft > 0;
                  const expired = msLeft <= 0;
                  return !expired ? (
                    <div className={`mt-3 rounded-xl border px-3 py-2 ${urgent ? 'border-amber-400/30 bg-amber-400/8' : 'border-white/10 bg-white/4'}`}>
                      <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${urgent ? 'text-amber-300/80' : 'text-white/40'}`}>
                        Deadline — {urgent ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!` : ''}
                      </div>
                      <div className={`text-xs font-bold mt-0.5 ${urgent ? 'text-amber-200' : 'text-white/55'}`}>
                        {item.deadline.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })} · 6:00 PM
                      </div>
                      <div className="text-[10px] text-white/35 mt-0.5">Limited allocation — pre-orders may be cut</div>
                    </div>
                  ) : null;
                })()}

                {(() => {
                  const canReserve = isOpen && !item.soldOut && !item.priceTba;
                  return (
                    <button
                      disabled={!canReserve}
                      onClick={() => setSelected(item)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.08em] transition ${
                        canReserve
                          ? 'bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 text-white hover:opacity-95'
                          : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {item.soldOut ? 'Sold Out' : item.priceTba ? 'Price TBA' : !isOpen ? 'Pre-orders Closed' : <>Reserve Now <ChevronRight className="h-4 w-4" /></>}
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Policy footer */}
        <div className="mt-10 rounded-[22px] border border-white/8 bg-white/4 p-5 text-sm text-white/45 leading-6 space-y-1">
          <div className="font-black text-white/65 uppercase tracking-[0.12em] text-xs mb-2">Pre-order Policy</div>
          <p>· <strong className="text-white/55">Downpayment:</strong> 30% of the total order price, sent via Wise to {WISE_HANDLE}. DP is non-refundable.</p>
          <p>· <strong className="text-white/55">Balance:</strong> Remaining 70% is collected before your order ships. We'll email you when ready.</p>
          <p>· <strong className="text-white/55">Shipping:</strong> International shipping, customs duties, and import taxes are the buyer's responsibility.</p>
          <p>· <strong className="text-white/55">Confirmation:</strong> Email your payment screenshot to {CONTACT_EMAIL} with your name and order details.</p>
          <p>· <strong className="text-white/55">Delays:</strong> If a set release is delayed by the publisher, your pre-order is automatically held until the new date.</p>
        </div>
      </section>
    </div>
  );
}
