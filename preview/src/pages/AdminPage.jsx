import {useEffect, useState} from 'react';
import {ShieldCheck, Save, RotateCcw, Eye, EyeOff, Youtube, Loader2} from 'lucide-react';
import {supabase, supabaseEnabled} from '../lib/supabase';
import PriceChecker from '../components/PriceChecker';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const DEFAULT_VIDEO_ID = 'OcLL44cDh7k';

const PAYMENT_STATUS_META = {
  awaiting_payment: {
    label: 'Awaiting Payment',
    badge: 'border-white/15 bg-white/5 text-white/70',
    button: 'border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10',
  },
  payment_submitted: {
    label: 'Payment Submitted',
    badge: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200',
    button: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200 hover:bg-yellow-400/15',
  },
  payment_verified: {
    label: 'Paid Verified',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    button: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15',
  },
  payment_rejected: {
    label: 'Payment Rejected',
    badge: 'border-red-400/30 bg-red-400/10 text-red-200',
    button: 'border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/15',
  },
};

const PAYMENT_STATUS_OPTIONS = [
  'awaiting_payment',
  'payment_submitted',
  'payment_verified',
  'payment_rejected',
];

const BASE_PRODUCTS = [
  {id: 'op15jp', title: "OP-15 Adventure on Kami's Island", subtitle: 'Japanese', price: 129.00, inStock: true, stock: 12},
  {id: 'eb03jp', title: 'EB-03 Extra Booster Heroines Edition', subtitle: 'Japanese', price: 259.00, inStock: true, stock: 7},
  {id: 'ac1', title: 'AC-01 Admirable Collection Vinsmoke Reiju', subtitle: 'Japanese', price: 279.00, inStock: true, stock: 5},
  {id: 'poke-ah', title: 'Pokemon Mega Evolution Ascended Heroes ETB', subtitle: 'English', price: 279.00, inStock: true, stock: 10},
  {id: 'op01eng', title: 'OP-01 Romance Dawn', subtitle: 'English', price: 850.00, inStock: false},
  {id: 'op02eng', title: 'OP-02 Paramount War', subtitle: 'English', price: 280.00, inStock: false},
  {id: 'op03eng', title: 'OP-03 Pillars of Strength', subtitle: 'English', price: 240.00, inStock: false},
  {id: 'op04eng', title: 'OP-04 Kingdoms of Intrigue', subtitle: 'English', price: 190.00, inStock: false},
  {id: 'op05eng', title: 'OP-05 Awakening of the New Era', subtitle: 'English', price: 650.00, inStock: false},
  {id: 'op06eng', title: 'OP-06 Wings of the Captain', subtitle: 'English', price: 210.00, inStock: false},
  {id: 'op07eng', title: 'OP-07 500 Years in the Future', subtitle: 'English', price: 180.00, inStock: false},
  {id: 'op08eng', title: 'OP-08 Two Legends', subtitle: 'English', price: 150.00, inStock: false},
  {id: 'op09eng', title: 'OP-09 Emperors in the New World', subtitle: 'English', price: 150.00, inStock: false},
  {id: 'op10eng', title: 'OP-10 Royal Blood', subtitle: 'English', price: 140.00, inStock: false},
  {id: 'op11eng', title: 'OP-11 A Fist of Divine Speed', subtitle: 'English', price: 140.00, inStock: false},
  {id: 'op12eng', title: 'OP-12 Legacy of the Master', subtitle: 'English', price: 135.00, inStock: false},
  {id: 'op13eng', title: 'OP-13 Carrying on His Will', subtitle: 'English', price: 135.00, inStock: false},
  {id: 'op14eng', title: "OP-14 The Azure Sea's Seven", subtitle: 'English', price: 130.00, inStock: false},
  {id: 'eb01eng', title: 'EB-01 Extra Booster Memorial Collection', subtitle: 'English', price: 140.00, inStock: false},
  {id: 'eb02eng', title: 'EB-02 Extra Booster Anime 25th Collection', subtitle: 'English', price: 300.00, inStock: false},
  {id: 'prb01eng', title: 'PRB-01 Premium Best Collection', subtitle: 'English', price: 200.00, inStock: false},
  {id: 'prb02eng', title: 'PRB-02 Premium Best Collection Vol.2', subtitle: 'English', price: 250.00, inStock: false},
];

function mergeProducts(overrides) {
  return BASE_PRODUCTS.map((product) => {
    const row = overrides.find((item) => item.id === product.id);
    return {
      ...product,
      inStock: row ? row.in_stock : product.inStock,
      stock: row ? row.quantity : (product.stock ?? 0),
    };
  });
}

function formatMoney(value) {
  return `CAD $${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return 'Not set';

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function normalizeOrder(order) {
  return {
    ...order,
    payment_status: order.payment_status || 'payment_submitted',
  };
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('cnc_admin') === '1');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('pending');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [products, setProducts] = useState(() => mergeProducts([]));
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);
  const [videoSaved, setVideoSaved] = useState(false);
  const [dbError, setDbError] = useState('');
  const [orders, setOrders] = useState([]);
  const [confirmingId, setConfirmingId] = useState('');
  const [paymentUpdatingId, setPaymentUpdatingId] = useState('');

  useEffect(() => {
    async function load() {
      if (!supabaseEnabled || !supabase) {
        setDbError('Supabase is not configured for this deployment yet.');
        setLoading(false);
        return;
      }

      const {data, error} = await supabase.from('stock').select('*');
      if (error) {
        setDbError(`Stock load failed: ${error.message}`);
      } else if (data) {
        setProducts(mergeProducts(data));
      }

      const {data: orderRows, error: orderError} = await supabase
        .from('orders')
        .select('*')
        .eq('order_type', 'on_hand')
        .order('created_at', {ascending: false});

      if (orderError) {
        setDbError((prev) => prev || `Orders load failed: ${orderError.message}`);
      } else if (orderRows) {
        setOrders(orderRows.map(normalizeOrder));
      }

      const {data: vid, error: videoError} = await supabase
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

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId('');
      return;
    }

    const nextVisibleOrders = orders.filter((order) => {
      if (orderFilter === 'pending') return order.status === 'pending';
      if (orderFilter === 'confirmed') return order.status === 'confirmed';
      return true;
    });

    if (!nextVisibleOrders.length) {
      setSelectedOrderId('');
      return;
    }

    const stillVisible = nextVisibleOrders.some((order) => order.id === selectedOrderId);
    if (!stillVisible) {
      setSelectedOrderId(nextVisibleOrders[0].id);
    }
  }, [orders, orderFilter, selectedOrderId]);

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
    setProducts((prev) => prev.map((product) => (
      product.id === id ? {...product, inStock: !product.inStock} : product
    )));
  }

  function setStock(id, value) {
    const next = Math.max(0, parseInt(value, 10) || 0);
    setProducts((prev) => prev.map((product) => (
      product.id === id ? {...product, stock: next} : product
    )));
  }

  async function save() {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }

    const rows = products.map((product) => ({
      id: product.id,
      in_stock: product.inStock,
      quantity: product.stock,
    }));

    const {error} = await supabase.from('stock').upsert(rows, {onConflict: 'id'});
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

    const rows = BASE_PRODUCTS.map((product) => ({
      id: product.id,
      in_stock: product.inStock,
      quantity: product.stock ?? 0,
    }));

    const {error} = await supabase.from('stock').upsert(rows, {onConflict: 'id'});
    if (error) {
      setDbError(`Reset failed: ${error.message}`);
      return;
    }

    setDbError('');
    setProducts(mergeProducts(rows));
  }

  async function saveVideo() {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }

    const trimmedId = videoId.trim();
    const {error} = await supabase
      .from('config')
      .upsert({key: 'video_id', value: trimmedId}, {onConflict: 'key'});

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
      const existingProduct = products.find((product) => product.id === order.product_id);
      const fallbackQty = existingProduct?.stock ?? 0;

      const {data: stockRow, error: stockError} = await supabase
        .from('stock')
        .select('*')
        .eq('id', order.product_id)
        .maybeSingle();

      if (stockError) throw stockError;

      const currentQty = stockRow?.quantity ?? fallbackQty;
      const nextQty = Math.max(0, currentQty - order.quantity);
      const nextInStock = nextQty > 0;

      const {error: upsertError} = await supabase
        .from('stock')
        .upsert({id: order.product_id, quantity: nextQty, in_stock: nextInStock}, {onConflict: 'id'});

      if (upsertError) throw upsertError;

      const confirmedAt = new Date().toISOString();
      const {error: orderUpdateError} = await supabase
        .from('orders')
        .update({status: 'confirmed', confirmed_at: confirmedAt, updated_at: confirmedAt})
        .eq('id', order.id);

      if (orderUpdateError) throw orderUpdateError;

      setProducts((prev) => prev.map((product) => (
        product.id === order.product_id
          ? {...product, stock: nextQty, inStock: nextInStock}
          : product
      )));

      setOrders((prev) => prev.map((item) => (
        item.id === order.id
          ? {...item, status: 'confirmed', confirmed_at: confirmedAt, updated_at: confirmedAt}
          : item
      )));
    } catch (error) {
      setDbError(`Confirm failed: ${error.message}`);
    } finally {
      setConfirmingId('');
    }
  }

  async function updatePaymentStatus(order, nextStatus) {
    if (!supabaseEnabled || !supabase) {
      setDbError('Supabase is not configured for this deployment yet.');
      return;
    }

    if (order.payment_status === nextStatus) return;

    setPaymentUpdatingId(order.id);
    setDbError('');

    const now = new Date().toISOString();
    const updatePayload = {
      payment_status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === 'awaiting_payment') {
      updatePayload.payment_submitted_at = null;
      updatePayload.payment_verified_at = null;
      updatePayload.payment_rejected_at = null;
      updatePayload.paid_at = null;
    }

    if (nextStatus === 'payment_submitted') {
      updatePayload.payment_submitted_at = order.payment_submitted_at || now;
      updatePayload.payment_verified_at = null;
      updatePayload.payment_rejected_at = null;
      updatePayload.paid_at = null;
    }

    if (nextStatus === 'payment_verified') {
      updatePayload.payment_submitted_at = order.payment_submitted_at || now;
      updatePayload.payment_verified_at = now;
      updatePayload.payment_rejected_at = null;
      updatePayload.paid_at = now;
    }

    if (nextStatus === 'payment_rejected') {
      updatePayload.payment_submitted_at = order.payment_submitted_at || now;
      updatePayload.payment_verified_at = null;
      updatePayload.payment_rejected_at = now;
      updatePayload.paid_at = null;
    }

    try {
      const {error} = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (error) throw error;

      setOrders((prev) => prev.map((item) => (
        item.id === order.id
          ? normalizeOrder({...item, ...updatePayload})
          : item
      )));
    } catch (error) {
      setDbError(`Payment update failed: ${error.message}`);
    } finally {
      setPaymentUpdatingId('');
    }
  }

  function extractVideoId(input) {
    const match = input.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : input.trim();
  }

  function renderPaymentControls(order) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Payment</span>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${PAYMENT_STATUS_META[order.payment_status].badge}`}>
            {PAYMENT_STATUS_META[order.payment_status].label}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {PAYMENT_STATUS_OPTIONS.map((status) => {
            const active = order.payment_status === status;
            return (
              <button
                key={status}
                onClick={() => updatePaymentStatus(order, status)}
                disabled={paymentUpdatingId === order.id || active}
                className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active ? PAYMENT_STATUS_META[status].button : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {PAYMENT_STATUS_META[status].label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-1 text-xs text-white/45">
          <div>Submitted: {formatDate(order.payment_submitted_at)}</div>
          <div>Verified: {formatDate(order.payment_verified_at)}</div>
          <div>Rejected: {formatDate(order.payment_rejected_at)}</div>
          <div>Paid At: {formatDate(order.paid_at)}</div>
          {order.payment_proof ? <div className="text-cyan-200/80">Payment proof attached on order record</div> : null}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#05010c] text-sm text-white/40">Loading...</div>;
  }

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
          <div className="relative mt-6">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(event) => {
                setPw(event.target.value);
                setPwError(false);
              }}
              onKeyDown={(event) => event.key === 'Enter' && login()}
              placeholder="Password"
              className={`w-full rounded-2xl border ${pwError ? 'border-red-400/60' : 'border-white/15'} bg-black/30 px-4 py-3 pr-10 text-sm text-white outline-none focus:border-cyan-300/50`}
            />
            <button onClick={() => setShowPw((value) => !value)} className="absolute right-3 top-3 text-white/40 hover:text-white/70">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwError ? <p className="mt-2 text-xs text-red-400">Wrong password.</p> : null}
          <button onClick={login} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3 text-sm font-black uppercase tracking-[0.08em] text-black">
            Enter
          </button>
        </div>
      </div>
    );
  }

  const inStockProducts = products.filter((product) => product.inStock);
  const soldOutProducts = products.filter((product) => !product.inStock);
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const confirmedOrders = orders.filter((order) => order.status === 'confirmed');
  const visibleOrders = orders.filter((order) => {
    if (orderFilter === 'pending') return order.status === 'pending';
    if (orderFilter === 'confirmed') return order.status === 'confirmed';
    return true;
  });
  const selectedOrder = visibleOrders.find((order) => order.id === selectedOrderId) || visibleOrders[0] || null;

  function renderOrderRow(order) {
    const paymentMeta = PAYMENT_STATUS_META[order.payment_status] || PAYMENT_STATUS_META.payment_submitted;
    const orderMeta = order.status === 'confirmed'
      ? {label: 'Confirmed', className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'}
      : {label: 'Pending', className: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200'};
    const selected = selectedOrder?.id === order.id;

    return (
      <button
        key={order.id}
        onClick={() => setSelectedOrderId(order.id)}
        className={`w-full rounded-[22px] border p-4 text-left transition ${
          selected
            ? 'border-cyan-300/45 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
            : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black uppercase tracking-[0.08em] text-white">
              {order.order_number}
            </div>
            <div className="mt-1 line-clamp-2 text-sm text-white/80">
              {order.product_title}
            </div>
            <div className="mt-2 text-xs text-white/45">
              {order.buyer_name} | Qty {order.quantity} | {formatMoney(order.total_price)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${orderMeta.className}`}>
              {orderMeta.label}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${paymentMeta.badge}`}>
              {paymentMeta.label}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.24em]">Admin Panel</span>
            </div>
            <h1 className="mt-1 text-3xl font-black uppercase">Store Operations</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('orders')}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${
                activeTab === 'orders' ? 'bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 text-black' : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${
                activeTab === 'inventory' ? 'bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 text-black' : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('homepage')}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${
                activeTab === 'homepage' ? 'bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 text-black' : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Homepage
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${
                activeTab === 'prices' ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 text-black' : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Price Research
            </button>
          </div>
        </div>

        {activeTab === 'inventory' ? (
          <div className="mb-6 flex flex-wrap gap-3">
            <button onClick={reset} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white/70 hover:bg-white/10">
              <RotateCcw className="h-4 w-4" /> Reset All
            </button>
            <button onClick={save} className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${saved ? 'bg-green-400 text-black' : 'bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 text-black'}`}>
              <Save className="h-4 w-4" /> {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        ) : null}

        {dbError ? (
          <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {dbError}
          </div>
        ) : null}

        {activeTab === 'orders' ? (
          <>
            <div className="mb-6 rounded-[24px] border border-cyan-400/15 bg-cyan-400/5 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Orders Workspace</div>
              <div className="mt-2 grid gap-3 text-sm text-white/65 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">All Orders</div>
                  <div className="mt-1 text-2xl font-black text-white">{orders.length}</div>
                </div>
                <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200/70">Pending</div>
                  <div className="mt-1 text-2xl font-black text-white">{pendingOrders.length}</div>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200/70">Confirmed</div>
                  <div className="mt-1 text-2xl font-black text-white">{confirmedOrders.length}</div>
                </div>
                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-200/70">Payment Review</div>
                  <div className="mt-1 text-xs leading-5 text-white/70">
                    Keep payment review in the detail pane, not on every order card.
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              {[
                {id: 'pending', label: `Pending (${pendingOrders.length})`},
                {id: 'confirmed', label: `Confirmed (${confirmedOrders.length})`},
                {id: 'all', label: `All (${orders.length})`},
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setOrderFilter(filter.id)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${
                    orderFilter === filter.id ? 'bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 text-black' : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {visibleOrders.length ? (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  {visibleOrders.map(renderOrderRow)}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  {selectedOrder ? (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300/75">
                            {selectedOrder.order_number} | {selectedOrder.status === 'confirmed' ? 'Confirmed Order' : 'Pending Order'}
                          </div>
                          <div className="mt-2 text-2xl font-black leading-tight">{selectedOrder.product_title}</div>
                          <div className="mt-2 text-sm text-white/55">
                            {selectedOrder.product_variant} | Qty {selectedOrder.quantity} | {formatMoney(selectedOrder.total_price)}
                          </div>
                        </div>
                        {selectedOrder.status === 'pending' ? (
                          <button
                            onClick={() => confirmOrder(selectedOrder)}
                            disabled={confirmingId === selectedOrder.id}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black disabled:opacity-60"
                          >
                            {confirmingId === selectedOrder.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Confirming
                              </>
                            ) : (
                              'Confirm Order'
                            )}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Buyer</div>
                          <div className="mt-2 text-sm font-black text-white">{selectedOrder.buyer_name}</div>
                          <div className="mt-1 text-sm text-white/65">{selectedOrder.buyer_email}</div>
                          <div className="mt-1 text-xs text-white/45">{selectedOrder.buyer_phone}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Shipping</div>
                          <div className="mt-2 text-sm text-white/70">
                            {selectedOrder.delivery_country || 'No country'}{selectedOrder.delivery_province ? ` | ${selectedOrder.delivery_province}` : ''}
                          </div>
                          <div className="mt-1 text-xs text-white/45">{selectedOrder.buyer_address}</div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="grid gap-2 text-xs text-white/45 md:grid-cols-2">
                          <div>Created: {formatDate(selectedOrder.created_at)}</div>
                          <div>Confirmed: {formatDate(selectedOrder.confirmed_at)}</div>
                        </div>
                      </div>

                      {renderPaymentControls(selectedOrder)}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-8 text-center text-sm text-white/40">
                      Select an order from the list to manage payment and fulfillment details.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/45">
                No orders found for the current filter.
              </div>
            )}
          </>
        ) : null}

        {activeTab === 'inventory' ? (
          <>
            <div className="mb-8">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">In Stock ({inStockProducts.length})</div>
              <div className="space-y-2">
                {inStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-4">
                    <div className="flex-1">
                      <div className="text-sm font-black">{product.title}</div>
                      <div className="text-xs text-white/45">{product.subtitle} | CAD ${product.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-white/50">Stock</span>
                      <input
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={(event) => setStock(product.id, event.target.value)}
                        className="w-16 rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-center text-sm font-black text-white outline-none focus:border-cyan-300/50"
                      />
                    </div>
                    <button onClick={() => toggleInStock(product.id)} className="rounded-2xl border border-cyan-400/30 bg-cyan-400/20 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-cyan-200 transition hover:border-red-400/30 hover:bg-red-400/20 hover:text-red-200">
                      Mark Sold Out
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/40">Sold Out ({soldOutProducts.length})</div>
              <div className="space-y-2">
                {soldOutProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 opacity-60">
                    <div className="flex-1">
                      <div className="text-sm font-black text-white/70">{product.title}</div>
                      <div className="text-xs text-white/35">{product.subtitle} | CAD ${product.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-white/30">Stock</span>
                      <input
                        type="number"
                        min="0"
                        value={product.stock || 0}
                        onChange={(event) => setStock(product.id, event.target.value)}
                        className="w-16 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-center text-sm font-black text-white/50 outline-none focus:border-cyan-300/50"
                      />
                    </div>
                    <button onClick={() => toggleInStock(product.id)} className="rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white/50 transition hover:border-cyan-400/25 hover:bg-cyan-400/15 hover:text-cyan-200">
                      Mark In Stock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {activeTab === 'homepage' ? (
          <div className="mt-2">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-300/75">
              <Youtube className="h-4 w-4" /> Homepage Video
            </div>
            <div className="rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-400/5 p-5">
              <p className="mb-3 text-xs text-white/50">Paste a YouTube URL or video ID below. It will appear on the homepage.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={videoId}
                  onChange={(event) => setVideoId(extractVideoId(event.target.value))}
                  placeholder="e.g. OcLL44cDh7k or full YouTube URL"
                  className="flex-1 rounded-2xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-fuchsia-300/50"
                />
                <button onClick={saveVideo} className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition ${videoSaved ? 'bg-green-400 text-black' : 'border border-fuchsia-400/40 bg-fuchsia-500/30 text-fuchsia-200 hover:bg-fuchsia-500/45'}`}>
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
        ) : null}

        {activeTab === 'prices' ? (
          <div className="mt-2">
            <PriceChecker />
            <p className="mt-4 text-center text-xs text-white/25">
              eBay + TCGPlayer auto-fetch requires <code className="text-yellow-300">EBAY_APP_ID</code> in .env and running via <code className="text-cyan-300">vercel dev</code>. Mercari/Collectr/FB — use manual entry.
            </p>
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-white/25">Changes apply to the live shop only when this deployment can read and write Supabase successfully.</p>
      </div>
    </div>
  );
}
