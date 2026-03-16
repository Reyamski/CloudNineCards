import { useState, useEffect } from 'react';
import { ShieldCheck, Save, RotateCcw, Eye, EyeOff, Youtube, Loader2 } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase';

const ADMIN_PASSWORD = 'REDACTED_ADMIN_PASS';
const DEFAULT_VIDEO_ID = 'OcLL44cDh7k';

const BASE_PRODUCTS = [
  { id: 'op15jp',  title: "OP-15 Adventure on Kami's Island", subtitle: 'Japanese', price: 129.00, inStock: true,  stock: 12 },
  { id: 'eb03jp',  title: 'EB-03 Extra Booster Heroines Edition', subtitle: 'Japanese', price: 259.00, inStock: true,  stock: 7 },
  { id: 'ac1',     title: 'AC-01 Admirable Collection Vinsmoke Reiju', subtitle: 'Japanese', price: 279.00, inStock: true,  stock: 5 },
  { id: 'poke-ah', title: 'Pokemon Mega Evolution Ascended Heroes ETB', subtitle: 'English', price: 279.00, inStock: true,  stock: 10 },
  { id: 'op01eng', title: 'OP-01 Romance Dawn', subtitle: 'English', price: 850.00, inStock: false },
  { id: 'op02eng', title: 'OP-02 Paramount War', subtitle: 'English', price: 280.00, inStock: false },
  { id: 'op03eng', title: 'OP-03 Pillars of Strength', subtitle: 'English', price: 240.00, inStock: false },
  { id: 'op04eng', title: 'OP-04 Kingdoms of Intrigue', subtitle: 'English', price: 190.00, inStock: false },
  { id: 'op05eng', title: 'OP-05 Awakening of the New Era', subtitle: 'English', price: 650.00, inStock: false },
  { id: 'op06eng', title: 'OP-06 Wings of the Captain', subtitle: 'English', price: 210.00, inStock: false },
  { id: 'op07eng', title: 'OP-07 500 Years in the Future', subtitle: 'English', price: 180.00, inStock: false },
  { id: 'op08eng', title: 'OP-08 Two Legends', subtitle: 'English', price: 150.00, inStock: false },
  { id: 'op09eng', title: 'OP-09 Emperors in the New World', subtitle: 'English', price: 150.00, inStock: false },
  { id: 'op10eng', title: 'OP-10 Royal Blood', subtitle: 'English', price: 140.00, inStock: false },
  { id: 'op11eng', title: 'OP-11 A Fist of Divine Speed', subtitle: 'English', price: 140.00, inStock: false },
  { id: 'op12eng', title: 'OP-12 Legacy of the Master', subtitle: 'English', price: 135.00, inStock: false },
  { id: 'op13eng', title: 'OP-13 Carrying on His Will', subtitle: 'English', price: 135.00, inStock: false },
  { id: 'op14eng', title: "OP-14 The Azure Sea's Seven", subtitle: 'English', price: 130.00, inStock: false },
  { id: 'eb01eng', title: 'EB-01 Extra Booster Memorial Collection', subtitle: 'English', price: 140.00, inStock: false },
  { id: 'eb02eng', title: 'EB-02 Extra Booster Anime 25th Collection', subtitle: 'English', price: 300.00, inStock: false },
  { id: 'prb01eng', title: 'PRB-01 Premium Best Collection', subtitle: 'English', price: 200.00, inStock: false },
  { id: 'prb02eng', title: 'PRB-02 Premium Best Collection Vol.2', subtitle: 'English', price: 250.00, inStock: false },
];

function mergeProducts(overrides) {
  return BASE_PRODUCTS.map(p => {
    const row = overrides.find(r => r.id === p.id);
    return {
      ...p,
      inStock: row ? row.in_stock : p.inStock,
      stock:   row ? row.quantity  : (p.stock ?? 0),
    };
  });
}

function formatMoney(value) {
  return `CAD $${Number(value || 0).toFixed(2)}`;
}

export default function AdminPage() {
  const [authed, setAuthed]   = useState(() => sessionStorage.getItem('cnc_admin') === '1');
  const [pw, setPw]           = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [pwError, setPwError] = useState(false);
  const [products, setProducts] = useState(() => mergeProducts([]));
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [videoId, setVideoId]   = useState(DEFAULT_VIDEO_ID);
  const [videoSaved, setVideoSaved] = useState(false);
  const [dbError, setDbError]   = useState('');
  const [orders, setOrders]     = useState([]);
  const [confirmingId, setConfirmingId] = useState('');

  useEffect(() => {
    async function load() {
      if (!supabaseEnabled || !supabase) {
        setDbError('Supabase is not configured for this deployment yet.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('stock').select('*');
      if (error) {
        setDbError(`Stock load failed: ${error.message}`);
      } else if (data) {
        setProducts(mergeProducts(data));
      }

      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_type', 'on_hand')
        .order('created_at', { ascending: false });

      if (orderError) {
        setDbError((prev) => prev || `Orders load failed: ${orderError.message}`);
      } else if (orderRows) {
        setOrders(orderRows);
      }

      const { data: vid, error: videoError } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'video_id')
        .single();

      if (videoError && videoError.code !== 'PGRST116') {
        setDbError((prev) => prev || `Config load failed: ${videoError.message}`);
      } else if (vid) {
        setVideoId(vid.value);
      }

      setLoading(false);
    }
    load();
  }, []);

  function login() {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('cnc_admin', '1');
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  function toggleInStock(id) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));
  }

  function setStock(id, val) {
    const n = Math.max(0, parseInt(val) || 0);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: n } : p));
  }

  async function save() {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }
    const rows = products.map(p => ({ id: p.id, in_stock: p.inStock, quantity: p.stock }));
    const { error } = await supabase.from('stock').upsert(rows, { onConflict: 'id' });
    if (error) {
      setDbError(`Save failed: ${error.message}`);
      return;
    }
    setDbError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function reset() {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }
    const rows = BASE_PRODUCTS.map(p => ({ id: p.id, in_stock: p.inStock, quantity: p.stock ?? 0 }));
    const { error } = await supabase.from('stock').upsert(rows, { onConflict: 'id' });
    if (error) {
      setDbError(`Reset failed: ${error.message}`);
      return;
    }
    setDbError('');
    setProducts(mergeProducts(BASE_PRODUCTS.map(p => ({ id: p.id, in_stock: p.inStock, quantity: p.stock ?? 0 }))));
  }

  async function saveVideo() {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }
    const id = videoId.trim();
    const { error } = await supabase.from('config').upsert({ key: 'video_id', value: id }, { onConflict: 'key' });
    if (error) {
      setDbError(`Video save failed: ${error.message}`);
      return;
    }
    setDbError('');
    setVideoSaved(true);
    setTimeout(() => setVideoSaved(false), 2000);
  }

  async function confirmOrder(order) {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }

    setConfirmingId(order.id);
    setDbError('');

    try {
      const existingProduct = products.find((p) => p.id === order.product_id);
      const fallbackQty = existingProduct?.stock ?? 0;

      const { data: stockRow, error: stockError } = await supabase
        .from('stock')
        .select('*')
        .eq('id', order.product_id)
        .maybeSingle();

      if (stockError) throw stockError;

      const currentQty = stockRow?.quantity ?? fallbackQty;
      const nextQty = Math.max(0, currentQty - order.quantity);
      const nextInStock = nextQty > 0;

      const { error: upsertError } = await supabase
        .from('stock')
        .upsert({ id: order.product_id, quantity: nextQty, in_stock: nextInStock }, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      const confirmedAt = new Date().toISOString();
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed', confirmed_at: confirmedAt })
        .eq('id', order.id);

      if (orderUpdateError) throw orderUpdateError;

      setProducts((prev) =>
        prev.map((product) =>
          product.id === order.product_id
            ? { ...product, stock: nextQty, inStock: nextInStock }
            : product,
        ),
      );

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? { ...item, status: 'confirmed', confirmed_at: confirmedAt }
            : item,
        ),
      );
    } catch (error) {
      setDbError(`Confirm failed: ${error.message}`);
    } finally {
      setConfirmingId('');
    }
  }

  function extractVideoId(input) {
    // Handle full URLs or bare IDs
    const match = input.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : input.trim();
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#05010c] text-white/40 text-sm">Loading...</div>;

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05010c] text-white">
        <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.24em]">Admin Access</span>
          </div>
          <h1 className="text-2xl font-black uppercase">Cloud Nine Cards</h1>
          <p className="mt-1 text-sm text-white/45">Stock Management</p>
          <div className="mt-6 relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Password"
              className={`w-full rounded-2xl border ${pwError ? 'border-red-400/60' : 'border-white/15'} bg-black/30 px-4 py-3 pr-10 text-sm text-white outline-none focus:border-cyan-300/50`}
            />
            <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3 text-white/40 hover:text-white/70">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwError && <p className="mt-2 text-xs text-red-400">Wrong password.</p>}
          <button onClick={login} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3 text-sm font-black uppercase tracking-[0.08em] text-black">
            Enter
          </button>
        </div>
      </div>
    );
  }

  const inStockProducts = products.filter(p => p.inStock);
  const soldOutProducts = products.filter(p => !p.inStock);
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const confirmedOrders = orders.filter((order) => order.status === 'confirmed').slice(0, 8);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.24em]">Admin Panel</span>
            </div>
            <h1 className="mt-1 text-3xl font-black uppercase">Stock Manager</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white/70 hover:bg-white/10">
              <RotateCcw className="h-4 w-4" /> Reset All
            </button>
            <button onClick={save} className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${saved ? 'bg-green-400 text-black' : 'bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 text-black'}`}>
              <Save className="h-4 w-4" /> {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {dbError && (
          <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {dbError}
          </div>
        )}

        <div className="mb-10">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-300">Pending Orders ({pendingOrders.length})</div>
          {pendingOrders.length ? (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-400/5 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200/70">
                        {order.order_number} • Pending
                      </div>
                      <div className="text-lg font-black">{order.product_title}</div>
                      <div className="text-sm text-white/50">
                        {order.product_variant} • Qty {order.quantity} • {formatMoney(order.total_price)}
                      </div>
                      <div className="text-sm text-white/75">
                        {order.buyer_name} • {order.buyer_email}
                      </div>
                      <div className="text-xs text-white/40">
                        {order.delivery_country || 'No country'}{order.delivery_province ? ` • ${order.delivery_province}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => confirmOrder(order)}
                      disabled={confirmingId === order.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black disabled:opacity-60"
                    >
                      {confirmingId === order.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming</> : 'Confirm Order'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/45">
              New on-hand orders will appear here. Stock will only decrease after you click Confirm.
            </div>
          )}
        </div>

        <div className="mb-10">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/40">Recently Confirmed ({confirmedOrders.length})</div>
          {confirmedOrders.length ? (
            <div className="space-y-2">
              {confirmedOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4 text-sm text-white/70">
                  <div className="font-black">{order.order_number} • {order.product_title}</div>
                  <div className="mt-1 text-xs text-white/45">
                    {order.buyer_name} • Qty {order.quantity} • {formatMoney(order.total_price)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4 text-sm text-white/35">
              No confirmed on-hand orders yet.
            </div>
          )}
        </div>

        {/* In Stock */}
        <div className="mb-8">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">In Stock ({inStockProducts.length})</div>
          <div className="space-y-2">
            {inStockProducts.map(p => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-4">
                <div className="flex-1">
                  <div className="font-black text-sm">{p.title}</div>
                  <div className="text-xs text-white/45">{p.subtitle} · CAD ${p.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-white/50">Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={p.stock}
                    onChange={e => setStock(p.id, e.target.value)}
                    className="w-16 rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-center text-sm font-black text-white outline-none focus:border-cyan-300/50"
                  />
                </div>
                <button onClick={() => toggleInStock(p.id)} className="rounded-2xl bg-cyan-400/20 border border-cyan-400/30 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-cyan-200 hover:bg-red-400/20 hover:border-red-400/30 hover:text-red-200 transition">
                  Mark Sold Out
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sold Out */}
        <div>
          <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/40">Sold Out ({soldOutProducts.length})</div>
          <div className="space-y-2">
            {soldOutProducts.map(p => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 opacity-60">
                <div className="flex-1">
                  <div className="font-black text-sm text-white/70">{p.title}</div>
                  <div className="text-xs text-white/35">{p.subtitle} · CAD ${p.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-white/30">Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={p.stock || 0}
                    onChange={e => setStock(p.id, e.target.value)}
                    className="w-16 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-center text-sm font-black text-white/50 outline-none focus:border-cyan-300/50"
                  />
                </div>
                <button onClick={() => toggleInStock(p.id)} className="rounded-2xl bg-white/8 border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white/50 hover:bg-cyan-400/15 hover:border-cyan-400/25 hover:text-cyan-200 transition">
                  Mark In Stock
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── HYPE VIDEO ── */}
        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-300/75">
            <Youtube className="h-4 w-4" /> Homepage Video
          </div>
          <div className="rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-400/5 p-5">
            <p className="mb-3 text-xs text-white/50">Paste a YouTube URL or video ID below. It will appear on the homepage.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={videoId}
                onChange={e => setVideoId(extractVideoId(e.target.value))}
                placeholder="e.g. OcLL44cDh7k or full YouTube URL"
                className="flex-1 rounded-2xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-fuchsia-300/50"
              />
              <button onClick={saveVideo} className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${videoSaved ? 'bg-green-400 text-black' : 'bg-fuchsia-500/30 border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/45'}`}>
                <Save className="h-4 w-4" /> {videoSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-xl">
              <div className="aspect-video w-full">
                <iframe
                  key={videoId}
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title="Homepage Hype Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/25">Changes apply to the live shop only when this deployment can read and write Supabase successfully.</p>
      </div>
    </div>
  );
}
