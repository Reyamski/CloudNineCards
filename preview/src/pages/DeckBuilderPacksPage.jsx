import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck, BookOpen, Sparkles } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

// ── Theme styling ──────────────────────────────────────────────────────────
// Six packs, one per color, Standard only. The title shown on each card comes
// from the live `products` row (DB is the source of truth); the styling +
// real pack art live here. Art has the pack name burned into the image.
const THEMES = {
  red: {
    label: 'Red Aggression',
    blurb: 'Fast, aggressive red. Apply pressure early and close games quickly.',
    keywords: ['Aggression', 'Fire', 'Speed'],
    image: '/deck-builder/red.webp',
    accentText: 'text-red-300',
    accentBorder: 'border-red-400/30',
    accentBg: 'bg-red-400/10',
    bar: 'from-red-500 via-rose-400 to-orange-400',
    cardBg: 'bg-[linear-gradient(180deg,#1a0808,#2a0a0a)]',
    btn: 'bg-gradient-to-r from-red-500 to-orange-400',
  },
  green: {
    label: 'Green Fortress',
    blurb: 'Defensive board-control green. Stall, stabilize, and grind out the win.',
    keywords: ['Defense', 'Nature', 'Board Control'],
    image: '/deck-builder/green.webp',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-400/30',
    accentBg: 'bg-emerald-400/10',
    bar: 'from-emerald-500 via-green-400 to-lime-400',
    cardBg: 'bg-[linear-gradient(180deg,#04140b,#072a13)]',
    btn: 'bg-gradient-to-r from-emerald-500 to-lime-400',
  },
  purple: {
    label: 'Purple Dominance',
    blurb: 'Ramp and resource purple. Build power, then unload bigger threats.',
    keywords: ['Power', 'Ramp', 'DON Manipulation'],
    image: '/deck-builder/purple.webp',
    accentText: 'text-purple-300',
    accentBorder: 'border-purple-400/30',
    accentBg: 'bg-purple-400/10',
    bar: 'from-purple-500 via-fuchsia-400 to-violet-400',
    cardBg: 'bg-[linear-gradient(180deg,#120626,#1f0a2e)]',
    btn: 'bg-gradient-to-r from-purple-500 to-fuchsia-400',
  },
  black: {
    label: 'Black Strategy',
    blurb: 'Removal and tactical black. Pick apart their board and dictate the game.',
    keywords: ['Removal', 'Tactics', 'Shadow'],
    image: '/deck-builder/black.webp',
    accentText: 'text-zinc-300',
    accentBorder: 'border-zinc-400/30',
    accentBg: 'bg-zinc-400/10',
    bar: 'from-zinc-500 via-slate-400 to-zinc-300',
    cardBg: 'bg-[linear-gradient(180deg,#070707,#141414)]',
    btn: 'bg-gradient-to-r from-zinc-600 to-slate-400',
  },
  yellow: {
    label: 'Yellow Dominion',
    blurb: 'Life-control yellow. Swing the game on fate and big-payoff moments.',
    keywords: ['Life Control', 'Fate', 'Lightning'],
    image: '/deck-builder/yellow.webp',
    accentText: 'text-yellow-300',
    accentBorder: 'border-yellow-400/30',
    accentBg: 'bg-yellow-400/10',
    bar: 'from-yellow-500 via-amber-400 to-yellow-300',
    cardBg: 'bg-[linear-gradient(180deg,#1a1404,#2a2207)]',
    btn: 'bg-gradient-to-r from-yellow-500 to-amber-400',
  },
  blue: {
    label: 'Blue Flair',
    blurb: 'Tempo and control blue. Outpace and outthink the opponent turn by turn.',
    keywords: ['Tempo', 'Intelligence', 'Battlefield Manipulation'],
    image: '/deck-builder/blue.webp',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-400/30',
    accentBg: 'bg-sky-400/10',
    bar: 'from-sky-500 via-cyan-400 to-blue-400',
    cardBg: 'bg-[linear-gradient(180deg,#04101a,#07202a)]',
    btn: 'bg-gradient-to-r from-sky-500 to-cyan-400',
  },
};

// Stable theme display order on the listing.
const THEME_ORDER = ['red', 'green', 'purple', 'black', 'yellow', 'blue'];

// id slug → theme key. Six Standard-only products (Premium tier discontinued).
// Prices/titles come from the live `products` row so the DB stays the source
// of truth; this map only resolves which theme styling to apply.
const PACK_META = {
  'dbp-red-standard':    { theme: 'red'    },
  'dbp-green-standard':  { theme: 'green'  },
  'dbp-purple-standard': { theme: 'purple' },
  'dbp-black-standard':  { theme: 'black'  },
  'dbp-yellow-standard': { theme: 'yellow' },
  'dbp-blue-standard':   { theme: 'blue'   },
};

const PACK_PRICE = 9.99;

// What every pack contains. Surfaced prominently on the page (the products
// table has no description column, so contents live here, in the card subtitle
// from the DB, and in the FAQ).
const PACK_CONTENTS =
  'Every pack includes 2 rare cards plus 25 same-color cards (commons and uncommons) chosen for deck-building. Max 4 copies of any card.';

const DISCLAIMERS = [
  'Cards are randomly selected from current single-color inventory within the listed theme.',
  'This is a structured deck-building bundle. It is not a gambling, mystery, or loot-box product.',
  'Each pack includes 2 rare cards; no specific named card is guaranteed unless the listing states it.',
  'Duplicate cards are limited to playable quantities (no more than 4 copies of the same card).',
  'Card condition is Near Mint to Lightly Played unless otherwise stated.',
  'Product images are for reference and are samples only. They do not show the exact cards you receive.',
];

const FAQS = [
  {
    q: 'Are these mystery or gambling packs?',
    a: 'No. A Deck Builder Pack is a fixed-size, single-color set of cards put together to help you build a real deck. There are no jackpot odds, no chase mechanic, and nothing to "pull". You pay one fixed price and get a known quantity of playable cards for that theme.',
  },
  {
    q: 'What exactly do I get?',
    a: 'Every pack includes 2 rare cards plus 25 same-color commons and uncommons selected for deck-building, with a maximum of 4 copies of any card. Card condition is Near Mint to Lightly Played unless stated otherwise.',
  },
  {
    q: 'Can I choose specific cards?',
    a: 'Not in a pack. Packs are themed bundles, so the exact cards are selected from current single-color inventory. If you want specific named cards, browse the Singles page instead, or use the Request a Card form on the Shop page.',
  },
  {
    q: 'What condition are the cards?',
    a: 'Near Mint to Lightly Played unless the listing says otherwise. These are real, playable cards meant to go straight into a deck. They are graded for play, not for slabbing.',
  },
  {
    q: 'Is this good for a total beginner?',
    a: 'Yes, that is exactly who these are for. Pick a theme that sounds fun, add the pack to your cart, and you will have enough same-color cards (including 2 rares) to learn deck-building without spending a lot.',
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

function setMetaDescription(content) {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function DeckBuilderPacksPage() {
  const [packs, setPacks] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const { addItem } = useCart();
  const { showToast } = useToast();

  // Live products row for a given theme (may be undefined until the owner
  // runs the seed SQL — the card handles that case gracefully).
  function rowFor(themeKey) {
    return packs.find(p => p.id === `dbp-${themeKey}-standard`);
  }

  useEffect(() => {
    document.title = 'Deck Builder Packs — Build Your First Deck | CloudNineCards';
    setMetaDescription(
      'Structured single-color deck-building bundles for beginners. One fixed price of CAD $9.99, fixed contents. Every pack includes 2 rare cards. Not a mystery or gambling pack.'
    );
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!supabaseEnabled || !supabase) {
        setLoadError('Live product sync is not configured for this deployment yet.');
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tag', 'Deck Builder');
      if (ignore) return;
      if (error) {
        setLoadError('Packs could not be loaded. Check back soon.');
        return;
      }
      const ordered = (data ?? []).filter(r => PACK_META[r.id]);
      setPacks(ordered);
      if (ordered.length === 0) {
        setLoadError('Deck Builder Packs are not seeded yet. They will appear once stock is added.');
      } else {
        setLoadError('');
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  function addToCart(themeKey) {
    const row = rowFor(themeKey);
    const t = THEMES[themeKey];
    if (!row) {
      showToast('This pack is not available yet. Check back soon.');
      return;
    }
    if (!row.in_stock || Number(row.stock) <= 0) {
      showToast('This pack is sold out.');
      return;
    }
    const result = addItem({
      key:        `products:${row.id}`,
      source:     'products',
      id:         row.id,
      title:      row.title,
      image:      row.image_url ?? t.image,
      price:      Number(row.price) || PACK_PRICE,
      qty:        1,
      isPreorder: false,
      maxStock:   Number(row.stock) || 0,
      currency:   'CAD',
    });
    if (!result.ok && result.reason === 'stock') {
      showToast(result.available > 0 ? `Only ${result.available} more available` : 'Already at stock limit');
      return;
    }
    showToast(`Added to cart: ${row.title}`, { actionTo: '/cart', actionLabel: 'View Cart' });
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      {/* Collection banner */}
      <section className="relative overflow-hidden border-b border-fuchsia-500/20 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_42%),radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
            <BookOpen className="h-3.5 w-3.5" /> Beginner-friendly
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] md:text-6xl">
            Deck Builder
            <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">
              Packs
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/60 leading-7">
            A simple, affordable way to start building a deck. Pick a theme and get a fixed set of
            same-color cards chosen for deck-building. Every pack includes 2 rare cards. One fixed
            price of CAD $9.99, known contents. No mystery, no chase.
          </p>
        </div>
      </section>

      {/* What these are */}
      <section className="mx-auto max-w-7xl px-6 pt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: 'Built to learn', text: 'Each pack is one color, so you learn how a single strategy actually plays before mixing things up.' },
            { icon: Sparkles, title: '2 rares in every pack', text: 'Every pack includes 2 rare cards plus 25 commons and uncommons. All CAD $9.99, one fixed price.' },
            { icon: ShieldCheck, title: 'Known contents', text: 'Fixed card count at a fixed price. This is a structured bundle, not a gambling or mystery product.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[22px] border border-white/8 bg-white/4 p-5">
              <Icon className="h-5 w-5 text-cyan-300" />
              <div className="mt-3 text-sm font-black uppercase tracking-[0.08em]">{title}</div>
              <p className="mt-1.5 text-xs text-white/45 leading-5">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Theme cards — one per color, Standard only. Click adds to cart. */}
      <section className="mx-auto max-w-7xl px-6 pt-12">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            {loadError}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_ORDER.map((themeKey) => {
            const t = THEMES[themeKey];
            const row = rowFor(themeKey);
            const seeded = !!row;
            const inStock = !!(row && row.in_stock && Number(row.stock) > 0);
            const title = row?.title || `${t.label} Pack`;
            const price = Number(row?.price) || PACK_PRICE;
            return (
              <div
                key={themeKey}
                className={`group relative flex flex-col overflow-hidden rounded-[28px] border ${t.accentBorder} ${t.cardBg} text-left`}
              >
                <div className={`absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r ${t.bar}`} />
                {/* Poster is the hero: self-contained art already carries the pack
                    name, character and keyword line. Use a portrait container
                    sized to the tallest poster ratio (2:3) with object-contain
                    so every poster shows in full — no face/title crop — across
                    the mixed source ratios (2:3 and 4:5). */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
                  <img
                    src={t.image}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }}
                    className="absolute inset-0 h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                  />
                  {!inStock && seeded && (
                    <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                      Sold Out
                    </span>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full border ${t.accentBorder} ${t.accentBg} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${t.accentText}`}>
                    Includes 2 Rares
                  </span>
                </div>
                {/* Pack name + keyword line are baked into the poster above, so
                    the card stays clean here: blurb (not in art), contents,
                    price and CTA only — no duplicate text title/chips. */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-white/55 leading-5">{t.blurb}</p>

                  <p className="mt-3 text-xs text-white/45 leading-5">
                    Includes 2 rare cards plus 25 same-color commons and uncommons.
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">CAD ${price.toFixed(2)}</span>
                    <span className="text-xs text-white/40">one fixed price</span>
                  </div>

                  {inStock ? (
                    <button
                      type="button"
                      onClick={() => addToCart(themeKey)}
                      className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl ${t.btn} px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95`}
                    >
                      Add to Cart at CAD ${price.toFixed(2)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white/30"
                    >
                      {seeded ? 'Sold Out' : 'Coming Soon'}
                    </button>
                  )}
                  {row && (
                    <Link
                      to={`/shop/${row.id}`}
                      className="mt-3 block text-center text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-white/70"
                    >
                      View full product page
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Disclaimers */}
      <section className="mx-auto max-w-7xl px-6 pb-2 pt-12">
        <div className="rounded-[24px] border border-cyan-300/25 bg-[linear-gradient(180deg,#0c0820,#100426)] p-6 md:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-200">
              How these packs work. Please read
            </div>
          </div>
          <p className="mt-3 text-sm text-white/70 leading-6">{PACK_CONTENTS}</p>
          <ul className="mt-4 space-y-2.5">
            {DISCLAIMERS.map((d) => (
              <li key={d} className="flex gap-3 text-sm text-white/65 leading-6">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/70" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Beginner FAQ */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] mb-5">Beginner FAQ</h2>
        <div className="space-y-3 max-w-3xl">
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              q={f.q}
              a={f.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
            />
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-cyan-300/20 bg-cyan-300/6 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-black">Want specific cards instead?</div>
            <p className="mt-1 text-sm text-white/55">Browse singles, or build out a sealed collection on the Shop.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/singles" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-white/80 transition hover:bg-white/10">
              Singles
            </Link>
            <Link to="/shop" className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-90">
              Shop
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
