import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Truck, Globe, Package } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { allProducts } from '../data/products';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';

// Normalize a Supabase products row to the shape this page expects.
// Mirrors ShopPage's normalizeDbProduct so the two stay in sync.
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

// Normalize a preorders row → product shape used here
function normalizePreorder(po) {
  return {
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
  };
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { showToast } = useToast();

  // Shared add-to-cart so the main button and the sticky mobile bar behave
  // identically.
  function handleAddToCart() {
    if (!product) return;
    const result = addItem({
      key:        `${product.isPreorder ? 'preorders' : 'products'}:${product.id}`,
      source:     product.isPreorder ? 'preorders' : 'products',
      id:         product.id,
      title:      product.title,
      image:      product.image,
      price:      Number(product.price) || 0,
      qty,
      isPreorder: !!product.isPreorder,
      etaText:    product.eta ?? '',
      maxStock:   product.isPreorder ? undefined : (Number(product.stock) || 0),
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
    showToast(`Added × ${qty} to cart`, { actionTo: '/cart', actionLabel: 'View Cart' });
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      // 1. Try Supabase `products` table (DB-only items added via admin panel).
      if (supabaseEnabled && supabase) {
        const { data: row } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!ignore && row) {
          setProduct(normalizeDbProduct(row));
          setLoading(false);
          return;
        }
        // 2. Try `preorders` table for pre-order items.
        const { data: poRow } = await supabase
          .from('preorders')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!ignore && poRow) {
          setProduct(normalizePreorder(poRow));
          setLoading(false);
          return;
        }
      }

      // 3. Fall back to hardcoded allProducts (legacy in-stock + accessories + sold-out).
      const fallback = allProducts.find(p => p.id === id);
      if (!ignore) {
        setProduct(fallback ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [id]);

  useEffect(() => {
    if (loading) return;
    document.title = product
      ? `${product.title} | CloudNineCards`
      : 'Product Not Found | CloudNineCards';
  }, [product, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05010c] text-white flex flex-col">
        <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
          <div className="mx-auto max-w-7xl"><Nav /></div>
        </section>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#05010c] text-white flex flex-col">
        <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
          <div className="mx-auto max-w-7xl"><Nav /></div>
        </section>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="text-5xl mb-2">📦</div>
          <div className="text-2xl font-black uppercase">Product Not Found</div>
          <Link to="/shop" className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-7 py-3 text-sm font-black uppercase tracking-[0.12em] text-black">Browse Shop</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white flex flex-col">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#07030f] px-6 pb-10 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.10),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <Link to="/shop" className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-cyan-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
          </Link>
        </div>
      </section>

      {/* Product */}
      <section className="mx-auto max-w-7xl px-6 py-12 flex-1">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] items-start">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="overflow-hidden rounded-[28px] border border-white/10">
              <img
                src={product.image}
                alt={product.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }}
                className="w-full object-cover"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300/75">{product.subtitle}</div>
            <h1 className="mt-2 text-3xl font-black leading-snug md:text-4xl">{product.title}</h1>

            <div className="mt-6 flex items-end gap-4">
              <div className="text-4xl font-black">
                {product.priceTba ? 'Price TBA' : `CAD $${Number(product.price).toFixed(2)}`}
              </div>
              {!product.inStock && (
                <span className="mb-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/40">Sold Out</span>
              )}
            </div>
            <div className="mt-1 text-xs text-white/35">+ shipping & tax calculated at checkout</div>

            <div className="mt-6 grid gap-2">
              {[
                { icon: ShieldCheck, text: 'Verified sealed product — shrink-wrap intact on all items' },
                { icon: Truck,       text: 'Ships from Canada — tracked via Canada Post or DHL' },
                { icon: Globe,       text: 'International shipping available — buyer pays shipping & duties' },
                { icon: Package,     text: 'Payment via Wise only — @cloudninecards' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                  <Icon className="h-4 w-4 text-cyan-300/70 shrink-0 mt-0.5" />
                  <span className="text-xs text-white/60 leading-5">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {product.inStock && !product.priceTba ? (
                <div className="space-y-3">
                  {/* Qty stepper — clamps to live stock for in-stock items, defaults to 1 for preorders */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Qty</span>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-base font-black text-white hover:bg-white/10"
                        aria-label="Decrease quantity"
                      >−</button>
                      <input
                        type="number" min={1}
                        max={product.isPreorder ? 99 : Math.max(1, product.stock || 99)}
                        value={qty}
                        onChange={e => {
                          const max = product.isPreorder ? 99 : Math.max(1, product.stock || 99);
                          const next = Math.max(1, Math.min(max, Number(e.target.value) || 1));
                          setQty(next);
                        }}
                        className="w-14 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-center text-base font-black text-white outline-none focus:border-cyan-300/40"
                      />
                      <button
                        onClick={() => {
                          const max = product.isPreorder ? 99 : Math.max(1, product.stock || 99);
                          setQty(q => Math.min(max, q + 1));
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-base font-black text-white hover:bg-white/10"
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                    {!product.isPreorder && typeof product.stock === 'number' && product.stock > 0 && (
                      <span className="text-[11px] text-white/35">{product.stock} in stock</span>
                    )}
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-4 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_10px_30px_rgba(34,211,238,0.25)] transition hover:opacity-95"
                  >
                    {product.isPreorder ? 'Pre-order — Add to Cart' : 'Add to Cart'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/8 bg-white/4 py-4 text-center text-sm font-black uppercase tracking-[0.1em] text-white/25">
                  {product.priceTba ? 'Price TBA' : 'Currently Sold Out'}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Sticky mobile buy bar (<=640px). Desktop unchanged. The tab bar is
          hidden on this route so this is the only fixed bottom element. */}
      {product.inStock && !product.priceTba && (
        <div
          className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07030f]/97 backdrop-blur px-4 py-3 flex items-center gap-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
              {product.isPreorder ? 'Pre-order' : 'Price'}
            </div>
            <div className="text-lg font-black text-white tabular-nums truncate">
              CAD ${Number(product.price).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="ml-auto shrink-0 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:opacity-95"
          >
            {product.isPreorder ? 'Pre-order' : 'Add to Cart'}
          </button>
        </div>
      )}
    </div>
  );
}
