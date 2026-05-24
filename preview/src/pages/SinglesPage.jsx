import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Globe, ShieldCheck, X, Plus } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';
import CardRequestModal from '../components/CardRequestModal';
import { ControlsBar, RequestCardBanner } from '../components/CatalogControls';

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
        <div className="text-sm font-black leading-snug text-white">{card.card_name}</div>
        <div className="mt-1 text-xs text-white/40">{card.set_name}{card.card_number ? ` · ${card.card_number}` : ''}</div>
        <div className="mt-auto pt-3 flex items-end justify-between">
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

// Shared filter+sort pipeline so the page grid and the modal's live "Show N"
// count stay in sync. Pure function — no React state.
function applyFilters(list, { game, lang, cond, status, search, sort }) {
  let out = list;
  if (game !== 'All')   out = out.filter(c => c.game === game);
  if (lang !== 'All')   out = out.filter(c => c.language === lang);
  if (cond !== 'All')   out = out.filter(c => c.condition === cond);
  if (status === 'in')  out = out.filter(c => c.in_stock);
  if (status === 'out') out = out.filter(c => !c.in_stock);
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter(c =>
      c.card_name.toLowerCase().includes(q) ||
      c.set_name.toLowerCase().includes(q) ||
      (c.card_number ?? '').toLowerCase().includes(q)
    );
  }
  return [...out].sort((a, b) => {
    if (sort === 'price_asc')  return Number(a.price) - Number(b.price);
    if (sort === 'price_desc') return Number(b.price) - Number(a.price);
    if (sort === 'name_asc')   return a.card_name.localeCompare(b.card_name);
    return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
  });
}

// ── Unified Filter / Sort modal (F5) ──────────────────────────────────────────
// Consolidates the previously scattered game / language / condition / in-stock
// / sort controls into a single drawer. Uses a draft state so changes only
// apply when "Apply" is pressed (the count preview updates live).
function FilterModal({
  open, onClose,
  game, lang, cond, status, sort,
  onApply, sourceList, search,
}) {
  const [dGame, setDGame]     = useState(game);
  const [dLang, setDLang]     = useState(lang);
  const [dCond, setDCond]     = useState(cond);
  const [dStatus, setDStatus] = useState(status); // 'all' | 'in' | 'out'
  const [dSort, setDSort]     = useState(sort);

  // Re-sync drafts whenever the modal re-opens with the live values.
  useEffect(() => {
    if (open) { setDGame(game); setDLang(lang); setDCond(cond); setDStatus(status); setDSort(sort); }
  }, [open, game, lang, cond, status, sort]);

  // Live preview of how many cards the *draft* selection yields.
  const resultCount = useMemo(
    () => applyFilters(sourceList, { game: dGame, lang: dLang, cond: dCond, status: dStatus, search, sort: dSort }).length,
    [sourceList, dGame, dLang, dCond, dStatus, search, dSort]
  );

  if (!open) return null;

  const Pill = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition ${
        active
          ? 'border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-200'
          : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  );

  const Section = ({ label, children }) => (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

  function reset() {
    setDGame('All'); setDLang('All'); setDCond('All'); setDStatus('all'); setDSort('price_asc');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#07030f] overflow-hidden max-h-[88vh] flex flex-col"
      >
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="text-sm font-black uppercase tracking-[0.16em] text-white">Filter & Sort</div>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-1.5 hover:bg-white/10">
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <Section label="Status">
            <Pill active={dStatus === 'all'} onClick={() => setDStatus('all')}>All</Pill>
            <Pill active={dStatus === 'in'}  onClick={() => setDStatus('in')}>In Stock</Pill>
            <Pill active={dStatus === 'out'} onClick={() => setDStatus('out')}>Sold Out</Pill>
          </Section>

          <Section label="Game">
            {GAMES.map(g => (
              <Pill key={g} active={dGame === g} onClick={() => setDGame(g)}>{g}</Pill>
            ))}
          </Section>

          <Section label="Language">
            {LANGS.map(l => (
              <Pill key={l} active={dLang === l} onClick={() => setDLang(l)}>
                {l === 'Japanese' ? '🇯🇵 JP' : l === 'English' ? '🇺🇸 EN' : 'All'}
              </Pill>
            ))}
          </Section>

          <Section label="Condition">
            {CONDITIONS.map(c => (
              <Pill key={c} active={dCond === c} onClick={() => setDCond(c)}>{c}</Pill>
            ))}
          </Section>

          <Section label="Sort by">
            {SORTS.map(s => (
              <Pill key={s.value} active={dSort === s.value} onClick={() => setDSort(s.value)}>{s.label}</Pill>
            ))}
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60 hover:bg-white/10"
          >
            Reset
          </button>
          <button
            onClick={() => onApply({ game: dGame, lang: dLang, cond: dCond, status: dStatus, sort: dSort })}
            className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:opacity-90"
          >
            Show {resultCount} {resultCount === 1 ? 'card' : 'cards'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SinglesPage() {
  const [singles, setSingles]         = useState(STATIC_SINGLES);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [search, setSearch]           = useState('');
  const [gameFilter, setGameFilter]   = useState('All');
  const [langFilter, setLangFilter]   = useState('All');
  const [condFilter, setCondFilter]   = useState('All');
  // status: 'all' | 'in' | 'out' — replaces the old inStockOnly toggle so the
  // unified modal can also surface sold-out-only.
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort]               = useState('price_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

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

  const filtered = useMemo(
    () => applyFilters(singles, {
      game: gameFilter, lang: langFilter, cond: condFilter,
      status: statusFilter, search, sort,
    }),
    [singles, gameFilter, langFilter, condFilter, statusFilter, search, sort]
  );

  const activeFilterCount =
    (gameFilter !== 'All' ? 1 : 0) +
    (langFilter !== 'All' ? 1 : 0) +
    (condFilter !== 'All' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0);

  const { addItem } = useCart();
  const { showToast } = useToast();

  function handleBuy(card) {
    // Add-to-cart replaces the legacy buy modal. Buyer reviews and submits
    // on /cart (the merged checkout page).
    const result = addItem({
      key:        `singles:${card.id}`,
      source:     'singles',
      id:         card.id,
      title:      card.card_name,
      image:      card.image_url,
      price:      Number(card.price) || 0,
      qty:        1,
      isPreorder: false,
      maxStock:   card.in_stock ? Number(card.stock) || 0 : 0,
      currency:   'CAD',
    });
    if (!result.ok && result.reason === 'stock') {
      showToast(
        result.available > 0
          ? `Only ${result.available} more available`
          : `Already at stock limit`
      );
      return;
    }
    showToast(`Added — ${card.card_name}`, { actionTo: '/cart', actionLabel: 'View Cart' });
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cyan-500/15 bg-[#07030f] px-6 pb-10 pt-6 min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_40%)]" />
        <img src="/pikachu.webp" alt="" aria-hidden="true"
          decoding="async"
          fetchPriority="low"
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

      <AnimatePresence>
        {showRequest && (
          <CardRequestModal
            onClose={() => setShowRequest(false)}
            onSuccess={() => showToast('Request received — we\'ll email you')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <FilterModal
          open={showFilters}
          onClose={() => setShowFilters(false)}
          game={gameFilter}
          lang={langFilter}
          cond={condFilter}
          status={statusFilter}
          sort={sort}
          sourceList={singles}
          search={search}
          onApply={({ game, lang, cond, status, sort: s }) => {
            setGameFilter(game);
            setLangFilter(lang);
            setCondFilter(cond);
            setStatusFilter(status);
            setSort(s);
            setShowFilters(false);
          }}
        />
      </AnimatePresence>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Search + Filter & Sort, then a clearly explained request CTA */}
        <div className="mb-5 flex flex-col gap-3">
          <ControlsBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by card name, set, or number…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setShowFilters(true)}
          />

          <RequestCardBanner onRequest={() => setShowRequest(true)} />

          {/* Result count + active filter chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/35 font-black uppercase tracking-[0.14em]">{filtered.length} card{filtered.length !== 1 ? 's' : ''}</span>
            {gameFilter !== 'All' && <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-black text-purple-300">{gameFilter}</span>}
            {langFilter !== 'All' && <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black text-cyan-300">{langFilter}</span>}
            {condFilter !== 'All' && <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black ${CONDITION_COLOR[condFilter] ?? ''}`}>{condFilter}</span>}
            {statusFilter === 'in'  && <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">In Stock</span>}
            {statusFilter === 'out' && <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-black text-white/50">Sold Out</span>}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setGameFilter('All'); setLangFilter('All'); setCondFilter('All'); setStatusFilter('all'); }}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/45 hover:text-white/70"
              >
                Clear
              </button>
            )}
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
            <p className="mt-2 text-sm text-white/50">Try adjusting your filters, or ask us to source the card for you.</p>
            <button
              onClick={() => setShowRequest(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Request a Card
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(card => <SingleCard key={card.id} card={card} onBuy={handleBuy} />)}
          </div>
        )}

        {!loading && (
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Package,     title: 'Tracked Shipping',    desc: 'Sleeved in toploader, tracked mail. Canada $10 singles and deck packs, $15 sealed. USA $15+. International from $22.' },
              { icon: Globe,       title: 'Ships Worldwide',     desc: 'Free shipping in Canada on in-stock orders $300+.' },
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
