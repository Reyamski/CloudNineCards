import { BellRing, ChevronRight, Zap, AlertTriangle, Truck, Globe, CreditCard, Camera, Loader2, Calculator, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import DPCalculator from '../components/DPCalculator';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

// ── Pre-order window config ──────────────────────────────────────────────────
const PO_OPEN_DATE  = new Date('2025-11-01T00:00:00');
const PO_CLOSE_DATE = new Date('2026-12-31T23:59:59');
const isOpen = () => { const now = new Date(); return now >= PO_OPEN_DATE && now <= PO_CLOSE_DATE; };
// True once an individual item's deadline has passed. Null/invalid deadline
// (no deadline set) never counts as past.
const isPast = (deadline) => deadline instanceof Date && !isNaN(deadline.getTime()) && deadline.getTime() <= Date.now();

const WISE_HANDLE = '@cloudninecards';
const CONTACT_EMAIL = 'papspective@gmail.com';
const DP_PERCENT = 0.30;

// ── SEED DATA (reference copy — now managed via Supabase Admin > Pre-Orders) ──
// const SEED_PREORDERS = [
//   { id: 'op17jp', title: 'One Piece Card Game OP-17 Booster Box [Japanese]', subtitle: '4th Anniversary Set – "World\'s Strongest Warrior"', soldOut: true, priceTba: false, price: 93, usdPrice: 68, audPrice: 96, currency: 'CAD', eta: 'Est. Aug 31, 2026', deadline: new Date('2026-04-13T11:00:00'), image: '/OP-17-JP.png', hype: '4th Anniversary Set', notes: ['Per Box — Case (12 Boxes): CAD $1,113 | USD $810 | AUD $1,148.', 'Pre-orders are not guaranteed and subject to allocation.', 'If allocation is cut, down payment will be refunded.', 'Buyer shoulders shipping fees, taxes, and import duties.'] },
//   { id: 'ygo-cg2122ae', title: 'Yu-Gi-Oh! Creation Pack 12 [CG2122AE]', subtitle: 'Asian English · Per Case (24 Boxes)', soldOut: true, priceTba: false, price: 1650.55, usdPrice: 1196.08, audPrice: 1718.31, currency: 'CAD', eta: 'Est. July 11, 2026', deadline: new Date('2026-03-28T18:00:00'), image: '/Yu-Gi-Oh! Creation Pack 12.webp', hype: 'Limited Allocation', notes: ['Limited allocation only. Pre-orders may be cut.', 'Orders released only after full payment cleared.', 'Buyer shoulders shipping fees, taxes, and import duties.'] },
//   { id: 'test-dummy', title: '[TEST ITEM — DO NOT ORDER]', subtitle: 'For internal testing only', soldOut: false, priceTba: false, price: 1.00, usdPrice: 0.73, audPrice: 1.10, currency: 'CAD', eta: 'N/A', deadline: new Date('2026-12-31T23:59:59'), image: 'https://placehold.co/400x560/1a0030/ff0000?text=TEST+ITEM%0ADO+NOT+ORDER&font=montserrat', hype: 'Internal test only', notes: ['This is a test item. Do not submit a real order.'] },
//   { id: 'op17eng', title: 'One Piece Card Game OP-17 Booster Box [English]', subtitle: '4th Anniversary Set – "World\'s Strongest Warrior"', soldOut: true, priceTba: false, price: 130, usdPrice: 94, audPrice: 138, currency: 'CAD', eta: 'Est. Oct 31, 2026', deadline: new Date('2026-09-01T23:59:59'), image: '/OP-17-JP.png', hype: 'Open — Limited Slots', notes: ['Per Box. Case (12 Boxes): CAD $1,560 | USD $1,128 | AUD $1,656.', 'Pre-orders are not guaranteed and subject to allocation.', 'If allocation is cut, down payment will be refunded in full.', 'Buyer shoulders shipping fees, taxes, and import duties.'] },
//   { id: 'op16eng', title: 'One Piece Card Game OP-16 Booster Box', subtitle: 'English',  soldOut: true, priceTba: false, currency: 'CAD', eta: 'TBD', image: 'https://placehold.co/400x560/0d0020/9333ea?text=OP-16%0AEnglish%0ABooster+Box&font=montserrat', hype: 'Stay tuned for updates.' },
//   { id: 'op16jp',  title: 'One Piece Card Game OP-16 Booster Box', subtitle: 'Japanese', soldOut: true, priceTba: false, currency: 'CAD', eta: 'TBD', image: 'https://placehold.co/400x560/0d0020/c084fc?text=OP-16%0AJapanese%0ABooster+Box&font=montserrat', hype: 'Stay tuned for updates.' },
// ];

// ── Normalize a Supabase preorders row to the shape the UI expects ─────────
function normalizeDbPreorder(row) {
  return {
    id:       row.id,
    title:    row.title,
    subtitle: row.subtitle ?? '',
    soldOut:  row.sold_out,
    priceTba: row.price_tba,
    price:    row.price ?? 0,
    usdPrice: row.usd_price ?? null,
    audPrice: row.aud_price ?? null,
    eurPrice: row.eur_price ?? null,
    currency: row.currency ?? 'CAD',
    eta:      row.eta ?? '',
    deadline: row.deadline ? new Date(row.deadline) : null,
    image:    row.image_url ?? '',
    hype:     row.hype ?? '',
    notes:    Array.isArray(row.notes) ? row.notes : [],
  };
}

// ── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState(() => deadline ? Math.max(0, deadline - Date.now()) : 0);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setTimeLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return timeLeft;
}

function CountdownBlock({ deadline }) {
  const msLeft = useCountdown(deadline);
  if (msLeft <= 0) return null;

  const totalSecs = Math.floor(msLeft / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;
  const pad   = (n) => String(n).padStart(2, '0');
  const urgent = days <= 7;

  return (
    <div className={`mt-3 rounded-xl border px-3 py-2 ${urgent ? 'border-amber-400/30 bg-amber-400/8' : 'border-white/10 bg-white/4'}`}>
      <div className={`text-[10px] font-black uppercase tracking-[0.16em] mb-1.5 ${urgent ? 'text-amber-300/80' : 'text-white/40'}`}>
        {urgent ? '⚡ Closing Soon' : 'Deadline'}
      </div>
      <div className="flex items-center gap-2">
        {days > 0 && (
          <div className="text-center">
            <div className={`text-xl font-black tabular-nums ${urgent ? 'text-amber-200' : 'text-white/80'}`}>{days}</div>
            <div className="text-[9px] text-white/35 uppercase tracking-wider">days</div>
          </div>
        )}
        <div className="text-center">
          <div className={`text-xl font-black tabular-nums ${urgent ? 'text-amber-200' : 'text-white/80'}`}>{pad(hours)}</div>
          <div className="text-[9px] text-white/35 uppercase tracking-wider">hrs</div>
        </div>
        <div className={`text-lg font-black ${urgent ? 'text-amber-300/60' : 'text-white/25'}`}>:</div>
        <div className="text-center">
          <div className={`text-xl font-black tabular-nums ${urgent ? 'text-amber-200' : 'text-white/80'}`}>{pad(mins)}</div>
          <div className="text-[9px] text-white/35 uppercase tracking-wider">min</div>
        </div>
        <div className={`text-lg font-black ${urgent ? 'text-amber-300/60' : 'text-white/25'}`}>:</div>
        <div className="text-center">
          <div className={`text-xl font-black tabular-nums ${urgent ? 'text-amber-200' : 'text-white/80'}`}>{pad(secs)}</div>
          <div className="text-[9px] text-white/35 uppercase tracking-wider">sec</div>
        </div>
      </div>
      <div className="text-[10px] text-white/30 mt-1.5">Limited allocation — pre-orders may be cut</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PreOrdersPage() {
  const [showCalc, setShowCalc] = useState(false);
  const [preorders, setPreorders] = useState([]);
  const [preordersLoading, setPreordersLoading] = useState(true);
  const { addItem } = useCart();
  const { showToast } = useToast();

  function addPreorderToCart(item) {
    // Hard stop: never add a closed/expired/sold-out item even if the button
    // was reached via a stale render or programmatic call.
    if (!isOpen() || isPast(item.deadline) || item.soldOut || item.priceTba) {
      showToast('Pre-order window for this item has closed.');
      return;
    }
    // Prefer the human-written eta string; fall back to a "closes <date>"
    // derived from the deadline so the cart line still surfaces a useful
    // hint when an admin forgot to fill the eta column.
    const deadlineStr = item.deadline instanceof Date && !isNaN(item.deadline)
      ? `Closes ${item.deadline.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : '';
    const etaText = (item.eta && String(item.eta).trim()) || deadlineStr;
    addItem({
      key:        `preorders:${item.id}`,
      source:     'preorders',
      id:         item.id,
      title:      item.title,
      image:      item.image,
      price:      Number(item.price) || 0,
      qty:        1,
      isPreorder: true,
      etaText,
      currency:   'CAD',
    });
    showToast(`Pre-order added — ${item.title.length > 40 ? item.title.slice(0, 40) + '…' : item.title}`, {
      actionTo: '/cart', actionLabel: 'View Cart',
    });
  }

  useEffect(() => { document.title = 'Pre-Orders | CloudNineCards'; }, []);

  // Load from Supabase; gracefully fall back to empty list if unavailable
  useEffect(() => {
    async function load() {
      if (!supabase) { setPreordersLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('preorders')
          .select('*')
          .order('sold_out', { ascending: true })
          .order('created_at', { ascending: false });
        if (!error && data) {
          setPreorders(data.map(normalizeDbPreorder));
        }
      } catch {
        // silently fail — shop stays functional, just no preorders shown
      } finally {
        setPreordersLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      {/* Anime keyframe animations */}
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-18px) rotate(-6deg); }
        }
        @keyframes glowRingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,121,249,0.55), 0 0 12px 2px rgba(232,121,249,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(232,121,249,0), 0 0 22px 6px rgba(232,121,249,0.4); }
        }
        @keyframes redDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes stepGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(34,211,238,0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(232,121,249,0.7)); }
        }
      `}</style>

      <AnimatePresence>
        {showCalc && <DPCalculator onClose={() => setShowCalc(false)} />}
      </AnimatePresence>

      {/* Header */}
      <section className="relative overflow-hidden border-b border-fuchsia-500/20 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.25),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        {/* Goku character art */}
        <img
          src="/goku.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="pointer-events-none absolute right-0 bottom-0 h-[520px] w-auto select-none"
          style={{ opacity: 0.38, filter: 'drop-shadow(0 0 40px rgba(250,204,21,0.6)) drop-shadow(0 0 80px rgba(251,146,60,0.3))', zIndex: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            {/* Hero badge — pulsing glow ring when open, red dot when closed */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.24em] ${
                isOpen()
                  ? 'border-fuchsia-400/50 bg-fuchsia-400/12 text-fuchsia-100'
                  : 'border-red-400/40 bg-red-400/10 text-red-200'
              }`}
              style={isOpen() ? { animation: 'glowRingPulse 2.4s ease-in-out infinite' } : undefined}
            >
              {isOpen() ? (
                <BellRing className="h-4 w-4" />
              ) : (
                <span
                  className="inline-block h-2 w-2 rounded-full bg-red-400"
                  style={{ animation: 'redDotPulse 1.3s ease-in-out infinite' }}
                />
              )}
              {isOpen() ? 'Pre-orders Open' : 'Pre-orders Closed'}
            </div>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
              Pre-orders
              <span className="block bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                incoming.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/65">
              {isOpen()
                ? 'Lock in your sets before they sell out. Reserve with 30% downpayment via Wise — balance due before shipment.'
                : 'Pre-orders are currently closed. Join the email list on the homepage to be notified when the next window opens.'}
            </p>

            {/* Status bar */}
            <div className="mt-6 inline-flex flex-wrap gap-4">
              <div className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${isOpen() ? 'border-green-400/30 bg-green-400/10 text-green-300' : 'border-red-400/30 bg-red-400/10 text-red-300'}`}>
                {isOpen() ? '● Open now' : '● Closed'}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/55">
                {isOpen() ? 'Window: Nov 2025 – Apr 2026' : 'Next window: Coming soon'}
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                Payment: Wise · @cloudninecards
              </div>
              <button
                onClick={() => setShowCalc(true)}
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/60 bg-gradient-to-r from-fuchsia-500/20 to-cyan-400/20 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-200 shadow-[0_0_16px_rgba(232,121,249,0.3)] transition hover:shadow-[0_0_24px_rgba(232,121,249,0.5)] hover:from-fuchsia-500/30 hover:to-cyan-400/30"
              >
                <Calculator className="h-3.5 w-3.5" /> DP Calculator
              </button>
              <Link
                to="/how-preorders-work"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/8 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/15"
              >
                <HelpCircle className="h-3.5 w-3.5" /> How Pre-Orders Work
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        {/* Dashed connecting line between steps */}
        <div className="hidden md:block relative mb-0">
          <div className="absolute top-[2.1rem] left-[12.5%] right-[12.5%] border-t border-dashed border-cyan-400/20 z-0" />
        </div>
        <div className="grid gap-3 md:grid-cols-4 relative z-10">
          {[
            { n: '01', icon: BellRing, label: 'Reserve', desc: 'Pick your item & qty. Agree to terms.' },
            { n: '02', icon: CreditCard, label: 'Pay 30% DP', desc: `Send via Wise to ${WISE_HANDLE}` },
            { n: '03', icon: Camera, label: 'Send Screenshot', desc: `Email proof to ${CONTACT_EMAIL}` },
            { n: '04', icon: Truck, label: 'Ships on release', desc: 'Pay remaining 70% before we ship.' },
          ].map(({ n, icon: Icon, label, desc }) => (
            <div key={n} className="rounded-[22px] border border-white/8 bg-white/4 p-4 flex gap-3">
              <div
                className="text-3xl font-black shrink-0 bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent"
                style={{ animation: 'stepGlow 3s ease-in-out infinite' }}
              >{n}</div>
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

      {/* Cancellation / DP policy — prominent callout */}
      <section className="mx-auto max-w-7xl px-6 pt-6 pb-2">
        <div className="rounded-[22px] border border-red-400/35 bg-red-400/8 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-xs font-black uppercase tracking-[0.18em] text-red-300">DP Policy</span>
          </div>
          <p className="text-xs text-white/65 leading-5">
            <strong className="text-red-300">30% downpayment is non-refundable</strong> once received. Balance (70%) is due before shipment.
            Allocation is not guaranteed — if a publisher cuts your set, we issue a <strong className="text-white/80">full refund</strong> including DP.
            Pre-orders cannot be cancelled after DP is paid unless publisher allocation is cut.
          </p>
        </div>
      </section>

      {/* International shipping notice */}
      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-yellow-400/20 bg-yellow-400/6 p-4">
          <Globe className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
          <p className="text-sm text-white/65 leading-6">
            <span className="font-black text-yellow-200">Shipping heads up —</span> You cover shipping, customs, and import taxes. None of that is in the listed price. We'll quote you the actual shipping cost before the balance is due.
          </p>
        </div>
      </section>

      {/* Pre-order cards */}
      <section className="mx-auto max-w-7xl px-6 py-8 pb-20">
        {preordersLoading && (
          <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading pre-orders…
          </div>
        )}
        {!preordersLoading && preorders.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">📦</div>
            <div className="text-lg font-black uppercase text-white/60">No pre-orders available</div>
            <p className="mt-1 text-sm text-white/35">Nothing open right now — follow us on Instagram for the next drop.</p>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          {preorders.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="group relative overflow-hidden rounded-[32px] border border-fuchsia-400/20 bg-[linear-gradient(180deg,#0d0520,#14081d)] transition-all duration-300 hover:border-fuchsia-400/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] flex flex-col h-full"
            >
              {/* Energy slash decorative element */}
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  transform: 'rotate(45deg) scaleX(2)',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.06) 50%, transparent 100%)',
                  top: '-40%',
                  left: '-30%',
                  width: '60%',
                  height: '180%',
                }}
              />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300" />
              <div className="relative overflow-hidden">
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[260px] w-full object-cover saturate-[1.3] transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-black/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200 backdrop-blur">
                  <Zap className="h-3 w-3" /> {item.hype}
                </div>
              </div>
              <div className="p-5 flex flex-1 flex-col">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-fuchsia-300/75">{item.subtitle}</div>
                <div className="mt-2 text-lg font-black leading-snug">{item.title}</div>

                <div className="mt-auto pt-4 flex items-end justify-between">
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

                <div className="mt-1 text-xs text-white/35">+ shipping & taxes (buyer's account)</div>


                {item.deadline && !item.soldOut && <CountdownBlock deadline={item.deadline} />}

                {(() => {
                  // Per-item deadline gate: a passed deadline closes ordering
                  // even while the global window is open. Without this, expired
                  // items stayed reservable (the global isOpen() runs to 2026).
                  const expired = isPast(item.deadline);
                  const canReserve = isOpen() && !expired && !item.soldOut && !item.priceTba;
                  return (
                    <button
                      disabled={!canReserve}
                      onClick={() => addPreorderToCart(item)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.08em] transition ${
                        canReserve
                          ? 'bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 text-white hover:opacity-95'
                          : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {item.soldOut ? 'Sold Out' : item.priceTba ? 'Price TBA' : (!isOpen() || expired) ? 'Pre-orders Closed' : <>Add to Cart <ChevronRight className="h-4 w-4" /></>}
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Policy footer */}
        <div className="mt-10 rounded-[22px] border border-white/8 bg-white/4 p-5 text-sm text-white/45 leading-6 space-y-1">
          <div className="font-black text-white/65 uppercase tracking-[0.12em] text-xs mb-2 pl-3 border-l-2 border-fuchsia-400" style={{ textShadow: '0 0 12px rgba(232,121,249,0.5)' }}>Pre-order Policy</div>
          <p>· <strong className="text-white/55">Downpayment:</strong> 30% of the total order price, sent via Wise to {WISE_HANDLE}. DP is non-refundable.</p>
          <p>· <strong className="text-white/55">Balance:</strong> Remaining 70% is collected before your order ships. We'll email you when ready.</p>
          <p>· <strong className="text-white/55">Shipping:</strong> Shipping, customs duties (international orders), and import taxes are the buyer's responsibility.</p>
          <p>· <strong className="text-white/55">Confirmation:</strong> Email your payment screenshot to {CONTACT_EMAIL} with your name and order details.</p>
          <p>· <strong className="text-white/55">Delays:</strong> If a set release is delayed by the publisher, your pre-order is automatically held until the new date.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
