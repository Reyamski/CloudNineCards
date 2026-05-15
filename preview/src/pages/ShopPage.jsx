import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { allProducts } from '../data/products';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

const tags = ['All', 'One Piece', 'Dragon Ball', 'Pokemon', 'Pre-orders', 'Accessories'];
const langFilters = ['All', 'Japanese', 'English'];
const SORTS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc',   label: 'Name A → Z' },
];

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
  const [activeTag, setActiveTag] = useState('All');
  const [langFilter, setLangFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [notifyItem, setNotifyItem] = useState(null);
  const [products, setProducts]   = useState([]);
  const [stockSyncError, setStockSyncError] = useState('');
  const { addItem } = useCart();
  const { showToast } = useToast();

  function addToCart(item) {
    addItem({
      key:        `products:${item.id}`,
      source:     'products',
      id:         item.id,
      title:      item.title,
      image:      item.image,
      price:      Number(item.price) || 0,
      qty:        1,
      isPreorder: false,
      currency:   'CAD',
    });
    showToast(`Added to cart — ${item.title.length > 40 ? item.title.slice(0, 40) + '…' : item.title}`, {
      actionTo: '/cart', actionLabel: 'View Cart',
    });
  }

  useEffect(() => { document.title = 'Shop | CloudNineCards'; }, []);

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
      // Primary: in-stock first, then preorder, then sold-out
      const score = p => p.inStock ? 0 : p.isPreorder ? 1 : 2;
      const stockDiff = score(a) - score(b);
      if (stockDiff !== 0) return stockDiff;
      // Secondary: user-chosen sort
      if (sort === 'price_asc')  return Number(a.price) - Number(b.price);
      if (sort === 'price_desc') return Number(b.price) - Number(a.price);
      if (sort === 'name_asc')   return (a.title || '').localeCompare(b.title || '');
      // newest: prefer created_at if present, otherwise leave existing order
      return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
    });

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
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

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-3">
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
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 outline-none focus:border-cyan-300/40">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
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
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[260px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105" />
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
                    <button onClick={() => {
                      addItem({
                        key:        `preorders:${item.id}`,
                        source:     'preorders',
                        id:         item.id,
                        title:      item.title,
                        image:      item.image,
                        price:      Number(item.price) || 0,
                        qty:        1,
                        isPreorder: true,
                        etaText:    item.eta ?? '',
                        currency:   'CAD',
                      });
                      showToast(`Pre-order added — ${item.title.length > 40 ? item.title.slice(0, 40) + '…' : item.title}`, { actionTo: '/cart', actionLabel: 'View Cart' });
                    }}
                      className="w-full rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-fuchsia-200 transition hover:bg-fuchsia-400/15">
                      Pre-order — Add to Cart
                    </button>
                  ) : item.inStock ? (
                    <button onClick={() => addToCart(item)}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95">
                      Add to Cart
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
