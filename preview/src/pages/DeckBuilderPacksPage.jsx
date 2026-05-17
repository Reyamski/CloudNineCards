import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck, BookOpen, Sparkles, X, Check } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

// ── Theme styling ──────────────────────────────────────────────────────────
// Color-coded per theme, consistent with the accent classes used across the
// existing storefront (cyan / fuchsia / red / green / purple / etc).
const THEMES = {
  red: {
    label: 'Red Aggression',
    blurb: 'Fast, aggressive red. Apply pressure early and close games quickly.',
    keywords: ['Aggression', 'Fire', 'Speed'],
    image: '/luffy.png',
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
    image: '/zoro.png',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-400/30',
    accentBg: 'bg-emerald-400/10',
    bar: 'from-emerald-500 via-green-400 to-lime-400',
    cardBg: 'bg-[linear-gradient(180deg,#04140b,#072a13)]',
    btn: 'bg-gradient-to-r from-emerald-500 to-lime-400',
  },
  purple: {
    label: 'Purple Chaos',
    blurb: 'Ramp and resource purple. Build power, then unload bigger threats.',
    keywords: ['Power', 'Ramp', 'DON Manipulation'],
    image: '/robin.png',
    accentText: 'text-purple-300',
    accentBorder: 'border-purple-400/30',
    accentBg: 'bg-purple-400/10',
    bar: 'from-purple-500 via-fuchsia-400 to-violet-400',
    cardBg: 'bg-[linear-gradient(180deg,#120626,#1f0a2e)]',
    btn: 'bg-gradient-to-r from-purple-500 to-fuchsia-400',
  },
  black: {
    label: 'Black Control',
    blurb: 'Removal and tactical black. Pick apart their board and dictate the game.',
    keywords: ['Removal', 'Tactics', 'Shadow'],
    image: '/nami.png',
    accentText: 'text-zinc-300',
    accentBorder: 'border-zinc-400/30',
    accentBg: 'bg-zinc-400/10',
    bar: 'from-zinc-500 via-slate-400 to-zinc-300',
    cardBg: 'bg-[linear-gradient(180deg,#070707,#141414)]',
    btn: 'bg-gradient-to-r from-zinc-600 to-slate-400',
  },
  yellow: {
    label: 'Yellow Destiny',
    blurb: 'Life-control yellow. Swing the game on fate and big-payoff moments.',
    keywords: ['Life Control', 'Fate', 'Lightning'],
    image: '/op15.webp',
    accentText: 'text-yellow-300',
    accentBorder: 'border-yellow-400/30',
    accentBg: 'bg-yellow-400/10',
    bar: 'from-yellow-500 via-amber-400 to-yellow-300',
    cardBg: 'bg-[linear-gradient(180deg,#1a1404,#2a2207)]',
    btn: 'bg-gradient-to-r from-yellow-500 to-amber-400',
  },
  blue: {
    label: 'Blue Strategy',
    blurb: 'Tempo and control blue. Outpace and outthink the opponent turn by turn.',
    keywords: ['Tempo', 'Intelligence', 'Battlefield Manipulation'],
    image: '/ac1.webp',
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

// id slug → theme key + tier. Drives card styling + badges. Prices/titles come
// from the live `products` row so the DB stays the source of truth.
const PACK_META = {
  'dbp-red-standard':    { theme: 'red',    tier: 'standard' },
  'dbp-red-premium':     { theme: 'red',    tier: 'premium'  },
  'dbp-green-standard':  { theme: 'green',  tier: 'standard' },
  'dbp-green-premium':   { theme: 'green',  tier: 'premium'  },
  'dbp-purple-standard': { theme: 'purple', tier: 'standard' },
  'dbp-purple-premium':  { theme: 'purple', tier: 'premium'  },
  'dbp-black-standard':  { theme: 'black',  tier: 'standard' },
  'dbp-black-premium':   { theme: 'black',  tier: 'premium'  },
  'dbp-yellow-standard': { theme: 'yellow', tier: 'standard' },
  'dbp-yellow-premium':  { theme: 'yellow', tier: 'premium'  },
  'dbp-blue-standard':   { theme: 'blue',   tier: 'standard' },
  'dbp-blue-premium':    { theme: 'blue',   tier: 'premium'  },
};
const PACK_ORDER = Object.keys(PACK_META);

// Tier model. Each tier is still its own products row (id below) — the cart,
// order, stock-decrement, admin and reject-restore pipeline are unchanged.
const TIER_INFO = {
  standard: {
    name: 'Standard',
    price: 9.99,
    idSuffix: 'standard',
    contents: '25 same-color commons & uncommons, chosen for deck-building. Max 4 copies of any card.',
    badges: ['Great for Beginners', 'Build Your First Deck', 'Casual Friendly'],
    // Difference-table rows, keyed by feature label.
    diff: {
      'Card count': '25 cards',
      'Rarities': 'Commons and uncommons',
      'Focus': 'Deck-building basics',
      'Copy limit': 'Up to 4 copies of a card',
      'Best for': 'A first deck on a budget',
    },
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    idSuffix: 'premium',
    contents: '40 same-color cards with rares & staples when available, picked for stronger synergy.',
    badges: ['Starter Upgrade Pack', 'Casual Friendly'],
    diff: {
      'Card count': '40 cards',
      'Rarities': 'Includes rares and staples when available',
      'Focus': 'Better synergy, stronger starter upgrade',
      'Copy limit': 'Up to 4 copies of a card',
      'Best for': 'Pushing a theme further',
    },
  },
};
const DIFF_ROWS = ['Card count', 'Rarities', 'Focus', 'Copy limit', 'Best for'];

const DISCLAIMERS = [
  'Cards are randomly selected from current single-color inventory within the listed theme.',
  'This is a structured deck-building bundle — it is not a gambling, mystery, or loot-box product.',
  'No specific card is guaranteed unless it is explicitly stated in the listing.',
  'Duplicate cards are limited to playable quantities (no more than 4 copies of the same card).',
  'Card condition is Near Mint to Lightly Played unless otherwise stated.',
  'Product images are for reference and are samples only — they do not show the exact cards you receive.',
];

const FAQS = [
  {
    q: 'Are these mystery or gambling packs?',
    a: 'No. A Deck Builder Pack is a fixed-size, single-color set of cards put together to help you build a real deck. There are no jackpot odds, no chase mechanic, and nothing to "pull". You pay one fixed price and get a known quantity of playable cards for that theme.',
  },
  {
    q: 'What exactly do I get?',
    a: 'The Standard pack is 25 same-color commons and uncommons selected for deck-building, with a maximum of 4 copies of any card. The Premium Plus pack is 40 same-color cards that include rares and staples when available, picked for stronger synergy. Card condition is Near Mint to Lightly Played unless stated otherwise.',
  },
  {
    q: 'Can I choose specific cards?',
    a: 'Not in a pack — packs are themed bundles, so the exact cards are selected from current single-color inventory. If you want specific named cards, browse the Singles page instead, or use the Request a Card form on the Shop page.',
  },
  {
    q: 'What condition are the cards?',
    a: 'Near Mint to Lightly Played unless the listing says otherwise. These are real, playable cards meant to go straight into a deck — they are graded for play, not for slabbing.',
  },
  {
    q: 'What is the difference between Standard and Premium Plus?',
    a: 'Standard (CAD $9.99) is the affordable entry point: 25 cards to get a first deck off the ground. Premium Plus (CAD $19.99) is 40 cards with rares and staples when available and tighter synergy — a solid upgrade once you know you enjoy the theme.',
  },
  {
    q: 'Is this good for a total beginner?',
    a: 'Yes — that is exactly who these are for. Pick a theme that sounds fun, start with the Standard pack, and you will have enough same-color cards to learn deck-building without spending a lot. Add a Premium Plus pack later if you want to push the deck further.',
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
  // Tier-picker modal: holds the theme key currently open, plus the chosen tier.
  const [pickerTheme, setPickerTheme] = useState(null);
  const [pickerTier, setPickerTier] = useState('standard');
  const { addItem } = useCart();
  const { showToast } = useToast();

  // Lock background scroll while the tier picker is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = pickerTheme ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [pickerTheme]);

  // Close the picker on Escape for keyboard / mobile-back friendliness.
  useEffect(() => {
    if (!pickerTheme) return;
    function onKey(e) { if (e.key === 'Escape') setPickerTheme(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerTheme]);

  // Live products row for a given theme + tier (may be undefined until the
  // owner runs the seed SQL — the picker handles that case gracefully).
  function rowFor(themeKey, tier) {
    const id = `dbp-${themeKey}-${TIER_INFO[tier].idSuffix}`;
    return packs.find(p => p.id === id);
  }

  function openPicker(themeKey) {
    setPickerTheme(themeKey);
    // Default to a tier that's actually buyable if possible.
    const std = rowFor(themeKey, 'standard');
    setPickerTier(std && std.in_stock ? 'standard' : 'premium');
  }

  useEffect(() => {
    document.title = 'Deck Builder Packs — Build Your First Deck | CloudNineCards';
    setMetaDescription(
      'Structured single-color deck-building bundles for beginners. Fixed price, fixed contents — not a mystery or gambling pack. Standard CAD $9.99, Premium Plus CAD $19.99.'
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
        setLoadError('Packs could not be loaded — check back soon.');
        return;
      }
      const ordered = (data ?? [])
        .filter(r => PACK_META[r.id])
        .sort((a, b) => {
          // Primary: in-stock packs before sold-out ones
          const stockDiff = (a.in_stock ? 0 : 1) - (b.in_stock ? 0 : 1);
          if (stockDiff !== 0) return stockDiff;
          // Secondary: stable theme/tier order
          return PACK_ORDER.indexOf(a.id) - PACK_ORDER.indexOf(b.id);
        });
      setPacks(ordered);
      if (ordered.length === 0) {
        setLoadError('Deck Builder Packs are not seeded yet — they will appear once stock is added.');
      } else {
        setLoadError('');
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  function addToCart(row) {
    const result = addItem({
      key:        `products:${row.id}`,
      source:     'products',
      id:         row.id,
      title:      row.title,
      image:      row.image_url ?? '/product-fallback.svg',
      price:      Number(row.price) || 0,
      qty:        1,
      isPreorder: false,
      maxStock:   Number(row.stock) || 0,
      currency:   'CAD',
    });
    if (!result.ok && result.reason === 'stock') {
      showToast(result.available > 0 ? `Only ${result.available} more available` : 'Already at stock limit');
      return;
    }
    showToast(`Added to cart — ${row.title}`, { actionTo: '/cart', actionLabel: 'View Cart' });
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
            A simple, affordable way to start building a deck. Pick a theme, get a fixed set of
            same-color cards chosen for deck-building, and learn the game without spending a lot.
            One fixed price, known contents — no mystery, no chase.
          </p>
        </div>
      </section>

      {/* What these are */}
      <section className="mx-auto max-w-7xl px-6 pt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: 'Built to learn', text: 'Each pack is one color, so you learn how a single strategy actually plays before mixing things up.' },
            { icon: Sparkles, title: 'Affordable start', text: 'Standard packs are CAD $9.99 — a low-cost way to try a theme before committing to a full deck.' },
            { icon: ShieldCheck, title: 'Known contents', text: 'Fixed card counts at a fixed price. This is a structured bundle, not a gambling or mystery product.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[22px] border border-white/8 bg-white/4 p-5">
              <Icon className="h-5 w-5 text-cyan-300" />
              <div className="mt-3 text-sm font-black uppercase tracking-[0.08em]">{title}</div>
              <p className="mt-1.5 text-xs text-white/45 leading-5">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Theme cards — one per color. Click opens the tier picker. */}
      <section className="mx-auto max-w-7xl px-6 pt-12">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            {loadError}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_ORDER.map((themeKey) => {
            const t = THEMES[themeKey];
            const std = rowFor(themeKey, 'standard');
            const prem = rowFor(themeKey, 'premium');
            const anySeeded = !!(std || prem);
            const anyInStock = !!((std && std.in_stock) || (prem && prem.in_stock));
            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => openPicker(themeKey)}
                className={`group relative flex flex-col overflow-hidden rounded-[28px] border ${t.accentBorder} ${t.cardBg} text-left transition hover:border-white/30`}
              >
                <div className={`absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r ${t.bar}`} />
                <div className="relative overflow-hidden">
                  <img
                    src={t.image}
                    alt={t.label}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }}
                    className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  {!anyInStock && anySeeded && (
                    <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                      Sold Out
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className={`text-xl font-black uppercase tracking-[0.06em] ${t.accentText}`}>
                    {t.label}
                  </div>
                  <p className="mt-2 text-xs text-white/55 leading-5">{t.blurb}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.keywords.map((k) => (
                      <span
                        key={k}
                        className={`rounded-full border ${t.accentBorder} ${t.accentBg} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${t.accentText}`}
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2 text-xs text-white/45">
                    <span className="text-base font-black text-white">CAD $9.99</span>
                    <span>Standard</span>
                    <span className="text-white/25">/</span>
                    <span className="text-base font-black text-white">CAD $19.99</span>
                    <span>Premium</span>
                  </div>

                  <div
                    className={`mt-auto pt-4 inline-flex w-full items-center justify-center rounded-2xl ${t.btn} px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition group-hover:opacity-95`}
                  >
                    Choose a Pack
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tier picker — Standard vs Premium for the chosen theme. */}
      <AnimatePresence>
        {pickerTheme && (() => {
          const t = THEMES[pickerTheme];
          const stdRow = rowFor(pickerTheme, 'standard');
          const premRow = rowFor(pickerTheme, 'premium');
          const selectedRow = pickerTier === 'standard' ? stdRow : premRow;
          const selectedTier = TIER_INFO[pickerTier];
          const expectedId = `dbp-${pickerTheme}-${selectedTier.idSuffix}`;
          const canBuy = !!(selectedRow && selectedRow.in_stock);
          return (
            <motion.div
              className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setPickerTheme(null)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={`${t.label} pack options`}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border ${t.accentBorder} ${t.cardBg} sm:rounded-[28px]`}
              >
                <div className={`sticky top-0 z-10 h-1 bg-gradient-to-r ${t.bar}`} />
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`text-2xl font-black uppercase tracking-[0.06em] ${t.accentText}`}>
                        {t.label}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.keywords.map((k) => (
                          <span
                            key={k}
                            className={`rounded-full border ${t.accentBorder} ${t.accentBg} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${t.accentText}`}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerTheme(null)}
                      aria-label="Close"
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Tier toggle */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {['standard', 'premium'].map((tierKey) => {
                      const ti = TIER_INFO[tierKey];
                      const row = tierKey === 'standard' ? stdRow : premRow;
                      const active = pickerTier === tierKey;
                      return (
                        <button
                          key={tierKey}
                          type="button"
                          onClick={() => setPickerTier(tierKey)}
                          aria-pressed={active}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? `${t.accentBorder} ${t.accentBg}`
                              : 'border-white/10 bg-white/4 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-black uppercase tracking-[0.1em] ${active ? t.accentText : 'text-white/70'}`}>
                              {ti.name}
                            </span>
                            {active && <Check className={`h-4 w-4 ${t.accentText}`} />}
                          </div>
                          <div className="mt-1 text-2xl font-black text-white">CAD ${ti.price.toFixed(2)}</div>
                          {row && !row.in_stock && (
                            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Sold Out</div>
                          )}
                          {!row && (
                            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Coming soon</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Difference table — Standard vs Premium side by side */}
                  <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-white/5 text-white/45">
                          <th className="px-4 py-3 font-black uppercase tracking-[0.1em]"> </th>
                          <th className={`px-4 py-3 font-black uppercase tracking-[0.1em] ${pickerTier === 'standard' ? t.accentText : 'text-white/55'}`}>
                            Standard
                          </th>
                          <th className={`px-4 py-3 font-black uppercase tracking-[0.1em] ${pickerTier === 'premium' ? t.accentText : 'text-white/55'}`}>
                            Premium
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {DIFF_ROWS.map((label, i) => (
                          <tr key={label} className={i % 2 ? 'bg-white/[0.02]' : ''}>
                            <td className="px-4 py-3 font-black uppercase tracking-[0.08em] text-white/40">{label}</td>
                            <td className={`px-4 py-3 leading-5 ${pickerTier === 'standard' ? 'text-white/85' : 'text-white/55'}`}>
                              {TIER_INFO.standard.diff[label]}
                            </td>
                            <td className={`px-4 py-3 leading-5 ${pickerTier === 'premium' ? 'text-white/85' : 'text-white/55'}`}>
                              {TIER_INFO.premium.diff[label]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-xs text-white/40 leading-5">{selectedTier.contents}</p>
                  <div className="mt-1 text-xs text-white/30">+ shipping and tax calculated at checkout</div>

                  {/* Add to cart for the selected tier's products row */}
                  <div className="mt-6">
                    {canBuy ? (
                      <button
                        type="button"
                        onClick={() => { addToCart(selectedRow); setPickerTheme(null); }}
                        className={`w-full rounded-2xl ${t.btn} px-4 py-4 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95`}
                      >
                        Add {selectedTier.name} to Cart — CAD ${selectedTier.price.toFixed(2)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm font-black uppercase tracking-[0.08em] text-white/30"
                      >
                        {selectedRow ? `${selectedTier.name} Sold Out` : `${selectedTier.name} Coming Soon`}
                      </button>
                    )}
                    {selectedRow && (
                      <Link
                        to={`/shop/${selectedRow.id}`}
                        className="mt-3 block text-center text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-white/70"
                      >
                        View full product page
                      </Link>
                    )}
                    {!selectedRow && (
                      <div className="mt-3 text-center text-[11px] text-white/30">
                        Item id: {expectedId}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Disclaimers */}
      <section className="mx-auto max-w-7xl px-6 pb-2">
        <div className="rounded-[24px] border border-cyan-300/25 bg-[linear-gradient(180deg,#0c0820,#100426)] p-6 md:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-200">
              How these packs work — please read
            </div>
          </div>
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
