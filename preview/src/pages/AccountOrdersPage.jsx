import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, LogOut, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

const STATUS_META = {
  awaiting_payment:   { label: 'Awaiting Payment',  color: 'border-white/15 bg-white/5 text-white/60',          icon: Clock },
  payment_submitted:  { label: 'Payment Submitted', color: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300', icon: AlertCircle },
  payment_verified:   { label: 'Paid & Verified',   color: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', icon: CheckCircle },
  payment_rejected:   { label: 'Payment Rejected',  color: 'border-red-400/30 bg-red-400/10 text-red-300',       icon: XCircle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.awaiting_payment;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${meta.color}`}>
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function OrderTypeBadge({ type }) {
  return type === 'pre_order'
    ? <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-300">Pre-Order</span>
    : <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">On Hand</span>;
}

export default function AccountOrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { document.title = 'My Orders | CloudNineCards'; }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/account', { replace: true }); return; }

    if (!supabase) { setFetching(false); return; }

    supabase
      .from('orders')
      .select('order_number, item_title, product_title, quantity, full_price, total_price, dp_amount, balance_due, payment_status, status, order_type, eta, delivery_country, delivery_fee, tax_amount, buyer_address, buyer_name, created_at')
      .ilike('buyer_email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setFetching(false);
      });
  }, [user, loading, navigate]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05010c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-fuchsia-500/15 bg-[#07030f] px-6 pb-12 pt-6 min-h-[420px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_40%)]" />
        <img
          src="/zoro.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-[520px] w-auto select-none"
          style={{ opacity: 0.42, filter: 'drop-shadow(0 0 40px rgba(52,211,153,0.6)) drop-shadow(0 0 80px rgba(52,211,153,0.25))', zIndex: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <div className="mt-6 flex items-end justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100">
                <Package className="h-4 w-4" /> {user?.email}
              </div>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
                My
                <span className="block bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Orders
                </span>
              </h1>
            </motion.div>
            <button
              onClick={handleSignOut}
              className="mb-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white/80"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📦</div>
            <div className="text-xl font-black uppercase">No orders yet</div>
            <p className="mt-2 text-sm text-white/50">Orders placed with this email will appear here.</p>
            <Link to="/shop" className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-7 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:opacity-95">
              Browse the Shop
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.order_number ?? idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-6"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-white/40">#{order.order_number ?? '—'}</span>
                      <OrderTypeBadge type={order.order_type} />
                    </div>
                    <div className="mt-1.5 text-xl font-black leading-snug">{order.item_title ?? order.product_title}</div>
                    <div className="mt-1 text-sm text-white/45">Qty: {order.quantity} · {order.delivery_country ?? 'Canada'}</div>
                    {order.eta && <div className="mt-1 text-xs font-black text-cyan-300/70">ETA: {order.eta}</div>}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.payment_status ?? order.status} />
                    <div className="mt-2 text-3xl font-black">CAD ${Number(order.full_price ?? order.total_price ?? 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-white/5 pt-4 text-sm sm:grid-cols-3">
                  {order.dp_amount > 0 && <>
                    <div className="text-white/40">Down payment</div>
                    <div className="text-right font-black text-emerald-300">CAD ${Number(order.dp_amount).toFixed(2)}</div>
                    <div className="hidden sm:block" />
                    <div className="text-white/40">Balance due</div>
                    <div className="text-right font-black text-yellow-300">CAD ${Number(order.balance_due ?? 0).toFixed(2)}</div>
                    <div className="hidden sm:block" />
                  </>}
                  {order.delivery_fee > 0 && <>
                    <div className="text-white/40">Shipping</div>
                    <div className="text-right text-white/70">CAD ${Number(order.delivery_fee).toFixed(2)}</div>
                    <div className="hidden sm:block" />
                  </>}
                  {order.tax_amount > 0 && <>
                    <div className="text-white/40">Tax</div>
                    <div className="text-right text-white/70">CAD ${Number(order.tax_amount).toFixed(2)}</div>
                    <div className="hidden sm:block" />
                  </>}
                  {order.buyer_address && <>
                    <div className="text-white/40">Ship to</div>
                    <div className="col-span-1 text-right text-white/60 sm:col-span-2">{order.buyer_address}</div>
                  </>}
                </div>

                {/* Payment instructions if awaiting */}
                {(order.payment_status === 'awaiting_payment' || order.status === 'awaiting_payment') && (
                  <div className="mt-4 rounded-2xl border border-yellow-400/25 bg-yellow-400/8 px-4 py-3">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-yellow-300">Action required — send payment via Wise</div>
                    <div className="mt-1 text-sm text-white/60">
                      Send <span className="font-black text-white">CAD ${Number(order.balance_due ?? order.full_price ?? order.total_price ?? 0).toFixed(2)}</span> to{' '}
                      <span className="font-black text-yellow-300">@cloudninecards</span> on Wise, then submit your payment screenshot in the shop.
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                  <span className="text-xs text-white/30">
                    Ordered {new Date(order.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <a href="mailto:papspective@gmail.com" className="text-xs font-black uppercase tracking-[0.1em] text-cyan-400/70 hover:text-cyan-300 transition">
                    Contact Support →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
