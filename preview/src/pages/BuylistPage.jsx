import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, DollarSign, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ONHAND;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const CONTACT_EMAIL = 'papspective@gmail.com';

const CONDITIONS = ['Near Mint (NM)', 'Lightly Played (LP)', 'Moderately Played (MP)', 'Heavily Played (HP)', 'Damaged (D)'];
const GAMES = ['One Piece TCG', 'Pokémon TCG', 'Dragon Ball SCG', 'Yu-Gi-Oh!', 'Magic: The Gathering', 'Other'];

export default function BuylistPage() {
  useEffect(() => { document.title = 'Sell Your Cards | CloudNineCards'; }, []);

  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState('');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [game, setGame]         = useState('');
  const [condition, setCondition] = useState('');
  const [cardList, setCardList] = useState('');
  const [qty, setQty]           = useState('');
  const [notes, setNotes]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const body = `BUYLIST SUBMISSION\n\nGame: ${game}\nCondition: ${condition}\nEstimated Qty: ${qty}\n\nCard List:\n${cardList}\n\nAdditional Notes:\n${notes || 'None'}`;
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        buyer_name:    name,
        buyer_email:   email,
        item_title:    `[BUYLIST] ${game} — ${condition}`,
        item_subtitle: `Qty: ${qty} | Game: ${game}`,
        buyer_phone:   `Condition: ${condition} | Qty: ${qty}`,
        buyer_address: cardList,
        quantity:      qty,
        full_price:    'BUYLIST',
        total_price:   'BUYLIST',
        dp_amount:     body,
        balance_due:   body,
        eta:           game,
        wise_handle:   CONTACT_EMAIL,
        to_email:      CONTACT_EMAIL,
      }, { publicKey: EMAILJS_PUBLIC_KEY });
      setSent(true);
    } catch {
      setSendError('Failed to send. Email us directly at ' + CONTACT_EMAIL);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-yellow-400/15 bg-[#07030f] px-6 pb-12 pt-6 min-h-[420px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_40%)]" />
        <img
          src="/pikachu.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="pointer-events-none absolute right-0 bottom-0 h-[480px] w-auto select-none"
          style={{ opacity: 0.38, filter: 'drop-shadow(0 0 40px rgba(250,204,21,0.55)) drop-shadow(0 0 80px rgba(250,204,21,0.2))', zIndex: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/35 bg-yellow-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-yellow-100">
              <DollarSign className="h-4 w-4" /> We Buy Singles & Sealed
            </div>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
              Sell Your
              <span className="block bg-gradient-to-r from-yellow-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Cards
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/65">
              Selling sealed product, singles, or a collection? Send your list and we'll reply with a quote within 24–48h.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_1.8fr]">
          {/* Info side */}
          <div className="flex flex-col gap-5">
            {[
              { icon: DollarSign, accent: 'yellow',  title: 'Fair Offers',    desc: 'We check current market prices and pay fair. No lowballs.' },
              { icon: Clock,      accent: 'cyan',    title: 'Fast Response',  desc: 'Quote within 24–48h. If we want it, we move fast.' },
              { icon: ShieldCheck,accent: 'fuchsia', title: 'Safe & Simple',  desc: 'Paid via Wise or e-Transfer. We cover shipping on accepted offers over $100.' },
              { icon: Sparkles,   accent: 'yellow',  title: 'What We Buy',    desc: 'One Piece (JP & EN), Pokémon, Dragon Ball. Sealed boxes, singles, full collections.' },
            ].map(({ icon: Icon, accent, title, desc }) => {
              const colors = {
                yellow:  { border: 'border-yellow-400/20',  bg: 'bg-yellow-400/8',  icon: 'text-yellow-300' },
                cyan:    { border: 'border-cyan-400/20',    bg: 'bg-cyan-400/8',    icon: 'text-cyan-300'   },
                fuchsia: { border: 'border-fuchsia-400/20', bg: 'bg-fuchsia-400/8', icon: 'text-fuchsia-300'},
              }[accent];
              return (
                <div key={title} className={`rounded-[20px] border ${colors.border} ${colors.bg} p-5`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${colors.icon}`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.1em]">{title}</div>
                      <p className="mt-1 text-xs text-white/50 leading-5">{desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form side */}
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-8">
            {sent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 py-10 text-center">
                <div className="rounded-full border border-yellow-400/30 bg-yellow-400/10 p-5">
                  <Check className="h-10 w-10 text-yellow-300" />
                </div>
                <div className="text-2xl font-black uppercase">List Received!</div>
                <p className="max-w-xs text-sm text-white/60 leading-6">
                  We'll review and email <span className="text-yellow-300">{email}</span> with a quote within 24–48h.
                </p>
                <button
                  onClick={() => { setSent(false); setName(''); setEmail(''); setGame(''); setCondition(''); setCardList(''); setQty(''); setNotes(''); }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-black uppercase text-white/65 hover:bg-white/10"
                >
                  Submit Another
                </button>
              </motion.div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300/70 mb-1">Buylist Submission</div>
                  <div className="text-2xl font-black">What are you selling?</div>
                  <p className="mt-1 text-xs text-white/45 leading-5">Fill in the details below. Be as specific as possible for a faster quote.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Your Name</label>
                      <input required value={name} onChange={e => setName(e.target.value)}
                        placeholder="Full name"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-yellow-400/40" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Email</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-yellow-400/40" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Game</label>
                      <select required value={game} onChange={e => setGame(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none focus:border-yellow-400/40 appearance-none">
                        <option value="" disabled>Select game…</option>
                        {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Condition</label>
                      <select required value={condition} onChange={e => setCondition(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none focus:border-yellow-400/40 appearance-none">
                        <option value="" disabled>Select condition…</option>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Estimated Quantity</label>
                    <input required value={qty} onChange={e => setQty(e.target.value)}
                      placeholder="e.g. 50 singles, 3 booster boxes, 1 full collection"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-yellow-400/40" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Card / Product List</label>
                    <textarea required rows={6} value={cardList} onChange={e => setCardList(e.target.value)}
                      placeholder={"List each card or item on a new line. Include set name, card number, and quantity if possible.\n\nExample:\n- Monkey D. Luffy (OP01-001) Secret Rare ×2\n- Roronoa Zoro (OP01-024) Super Rare ×5\n- OP-07 Sealed Booster Box ×3"}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-yellow-400/40 resize-none leading-6" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-white/40">Additional Notes (optional)</label>
                    <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Any extra info — photos available, location (for local pickup), price expectations, etc."
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-yellow-400/40 resize-none" />
                  </div>

                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/8 px-4 py-3 text-xs text-yellow-100/70 leading-5">
                    <strong className="text-yellow-300">Heads up:</strong> Submitting this doesn't lock anything in. We'll review and reply within 48h with a quote or a pass. No obligation either way.
                  </div>

                  {sendError && <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">{sendError}</div>}

                  <button type="submit" disabled={sending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-fuchsia-400 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-95 disabled:opacity-60">
                    {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Submit for Quote →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
