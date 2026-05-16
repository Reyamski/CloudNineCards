import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BellRing, CreditCard, Camera, Truck, AlertTriangle, Globe } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const WISE_HANDLE   = '@cloudninecards';
const CONTACT_EMAIL = 'papspective@gmail.com';

// Worked example numbers — kept simple so the math is obvious.
const EXAMPLE_BOX_PRICE = 200;
const EXAMPLE_DEPOSIT   = EXAMPLE_BOX_PRICE * 0.30; // 60
const EXAMPLE_BALANCE   = EXAMPLE_BOX_PRICE - EXAMPLE_DEPOSIT; // 140

const STEPS = [
  { n: '01', icon: BellRing,   label: 'Place your pre-order', desc: 'Add the set to your cart and check out. You agree to the pre-order terms before you pay.' },
  { n: '02', icon: CreditCard, label: 'Pay the 30% deposit',  desc: `Send 30% of the order total via Wise to ${WISE_HANDLE}. This reserves your allocation.` },
  { n: '03', icon: Camera,     label: 'Send your screenshot', desc: `Email your payment proof to ${CONTACT_EMAIL} with your name and order number.` },
  { n: '04', icon: Truck,      label: 'Pay the balance, we ship', desc: 'When the set is released we email you the remaining 70% plus the actual shipping cost. Pay that, and it ships.' },
];

const FAQS = [
  {
    q: 'Why do you take a deposit instead of full payment?',
    a: `Pre-orders are placed with the distributor months before release, and allocation isn't guaranteed until stock actually lands. A 30% deposit reserves your slot and covers our commitment to the distributor, while you keep most of your money until the set is in hand. International shipping also can't be calculated until release, so it isn't fair to charge it up front.`,
  },
  {
    q: 'What happens if the distributor cuts the allocation?',
    a: `If the publisher or distributor cuts the allocation and we can't fulfil your pre-order, your deposit is refunded in full — every cent. This is the only situation where the deposit comes back, and it's automatic. We email you as soon as we know.`,
  },
  {
    q: 'Can I cancel a pre-order?',
    a: `Pre-orders can't be cancelled once the 30% deposit is received — the deposit is non-refundable except when allocation is cut (see above). Please only pre-order what you're committed to. If you're unsure, message us before you pay.`,
  },
  {
    q: 'What if I miss the balance payment?',
    a: `When the set releases we email you with the remaining 70% plus the shipping quote, and give you a clear window to pay. If we can't reach you or the balance isn't paid within that window, the order is cancelled and the deposit is forfeited (it's already been committed to the distributor). We'll always chase you by email first — payment is never silently dropped.`,
  },
  {
    q: 'How long until the set is released?',
    a: `Every pre-order card on the Pre-Orders page shows an ETA (for example "Est. Aug 31, 2026"). That's the distributor's expected date and can move. If the publisher delays a set, your pre-order is automatically held until the new date — a delay is not grounds for cancellation, and your deposit stays valid.`,
  },
  {
    q: 'How is shipping handled on a pre-order?',
    a: `Shipping, customs, and import taxes are the buyer's responsibility and are not included in the listed price. We can't quote international shipping until the set is physically here, so it's calculated and billed with the 70% balance at release — not at the time you place the pre-order.`,
  },
  {
    q: 'How will I be notified?',
    a: `Everything happens by email. You get a receipt when you place the pre-order, and another email at release with the balance owed and the shipping quote. Use the same email at checkout that you check regularly, and keep an eye on your spam folder.`,
  },
  {
    q: 'What if my pre-order items arrive at different times?',
    a: `If you pre-ordered multiple sets with different release dates, they're handled as separate releases — you pay each balance when that set is ready, and each ships on its own. We'll always tell you which set the email is for.`,
  },
];

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0a061a] overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-black text-white">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-cyan-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm text-white/60 leading-6">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HowPreordersPage() {
  const [openIdx, setOpenIdx] = useState(0);

  useEffect(() => { document.title = 'How Pre-Orders Work | CloudNineCards'; }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-fuchsia-500/20 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.2),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.16),transparent_40%)]" />
        <div className="relative mx-auto max-w-5xl">
          <Nav />
          <Link to="/pre-orders" className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-cyan-300">
            ← Back to Pre-Orders
          </Link>
          <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] md:text-6xl">
            How Pre-Orders
            <span className="block bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Work</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/60 leading-7">
            Pre-ordering reserves a set before it's released. You pay a 30% deposit now to lock in your allocation,
            then the remaining 70% plus shipping when the set is in hand and ready to ship. Here's the whole flow,
            with a worked example.
          </p>
        </div>
      </section>

      {/* The four steps */}
      <section className="mx-auto max-w-5xl px-6 pt-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, icon: Icon, label, desc }) => (
            <div key={n} className="rounded-[22px] border border-white/8 bg-white/4 p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">{n}</span>
                <Icon className="h-4 w-4 text-fuchsia-300" />
              </div>
              <div className="text-sm font-black uppercase tracking-[0.08em]">{label}</div>
              <p className="text-xs text-white/45 leading-5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Worked example */}
      <section className="mx-auto max-w-5xl px-6 pt-10">
        <div className="rounded-[24px] border border-cyan-300/25 bg-[linear-gradient(180deg,#0c0820,#100426)] p-6 md:p-8">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300/70 mb-2">Worked Example</div>
          <h2 className="text-2xl font-black">A CAD ${EXAMPLE_BOX_PRICE.toFixed(2)} booster box</h2>
          <p className="mt-2 text-sm text-white/55 leading-6">
            Say you pre-order one sealed booster box listed at <strong className="text-white/80">CAD ${EXAMPLE_BOX_PRICE.toFixed(2)}</strong>.
            Here's exactly what you pay and when.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/8 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300/70">Due now (deposit)</div>
              <div className="mt-1 text-3xl font-black text-cyan-200 tabular-nums">CAD ${EXAMPLE_DEPOSIT.toFixed(2)}</div>
              <div className="mt-1 text-[11px] text-white/45">30% of ${EXAMPLE_BOX_PRICE.toFixed(2)} — paid via Wise to {WISE_HANDLE}</div>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/8 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300/70">Due on release (balance)</div>
              <div className="mt-1 text-3xl font-black text-fuchsia-200 tabular-nums">CAD ${EXAMPLE_BALANCE.toFixed(2)}</div>
              <div className="mt-1 text-[11px] text-white/45">70% of ${EXAMPLE_BOX_PRICE.toFixed(2)} — paid when the set lands</div>
            </div>
            <div className="rounded-2xl border border-yellow-400/25 bg-yellow-400/8 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-300/80">Plus shipping</div>
              <div className="mt-1 text-3xl font-black text-yellow-200 tabular-nums">Quoted</div>
              <div className="mt-1 text-[11px] text-white/45">Actual shipping + any customs / import taxes, calculated at release</div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-white/65 leading-6">
            <p>
              <strong className="text-cyan-200">Today:</strong> you pay <strong className="text-white">CAD ${EXAMPLE_DEPOSIT.toFixed(2)}</strong> to reserve the box.
            </p>
            <p>
              <strong className="text-fuchsia-200">If the distributor cuts allocation:</strong> we can't get you the box, so your full
              <strong className="text-white"> CAD ${EXAMPLE_DEPOSIT.toFixed(2)}</strong> deposit is refunded — no questions.
            </p>
            <p>
              <strong className="text-yellow-200">At release:</strong> we email you. You pay the remaining
              <strong className="text-white"> CAD ${EXAMPLE_BALANCE.toFixed(2)}</strong> plus the real shipping cost (we quote it then), and the box ships from Canada.
            </p>
            <p className="text-white/45 text-[13px]">
              Total product cost is still CAD ${EXAMPLE_BOX_PRICE.toFixed(2)} — the deposit isn't an extra fee, it's just the first 30% of the same price.
              Shipping is on top because it can't be known until the set physically arrives.
            </p>
          </div>
        </div>
      </section>

      {/* Deposit policy callout — mirrors PreOrdersPage wording */}
      <section className="mx-auto max-w-5xl px-6 pt-8">
        <div className="rounded-[22px] border border-red-400/35 bg-red-400/8 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Deposit Policy</span>
          </div>
          <p className="text-xs text-white/65 leading-5">
            <strong className="text-red-300">The 30% deposit is non-refundable</strong> once received. The only exception is an allocation cut by
            the publisher or distributor — in that case you get a <strong className="text-white/80">full refund</strong>, deposit included.
            Pre-orders can't be cancelled after the deposit is paid.
          </p>
        </div>
      </section>

      {/* Shipping heads-up — mirrors PreOrdersPage */}
      <section className="mx-auto max-w-5xl px-6 pt-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-yellow-400/20 bg-yellow-400/6 p-4">
          <Globe className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
          <p className="text-sm text-white/65 leading-6">
            <span className="font-black text-yellow-200">Shipping heads up —</span> You cover shipping, customs, and import taxes.
            None of that is in the listed price. We quote the actual shipping cost before the balance is due.
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] mb-5">Frequently asked</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              q={f.q}
              a={f.a}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            />
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-cyan-300/20 bg-cyan-300/6 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-black">Ready to reserve a set?</div>
            <p className="mt-1 text-sm text-white/55">Browse what's open and lock it in with a 30% deposit.</p>
          </div>
          <Link
            to="/pre-orders"
            className="shrink-0 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-90"
          >
            Browse Pre-Orders
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
