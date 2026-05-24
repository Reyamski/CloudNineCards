import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, LogOut, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

function safeNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
}

const STATUS_META = {
  awaiting_payment:   { label: 'Awaiting Payment',  color: 'border-white/15 bg-white/5 text-white/60',          icon: Clock },
  payment_submitted:  { label: 'Payment Submitted', color: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300', icon: AlertCircle },
  payment_verified:   { label: 'Paid & Verified',   color: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', icon: CheckCircle },
  payment_rejected:   { label: 'Payment Rejected',  color: 'border-red-400/30 bg-red-400/10 text-red-300',       icon: XCircle },
};

function StatusBadge({ status, compact = false }) {
  const meta = STATUS_META[status] ?? STATUS_META.awaiting_payment;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-black uppercase ${meta.color} ${
      compact
        ? 'px-2 py-0.5 text-[9px] tracking-[0.1em]'
        : 'gap-1.5 px-3 py-1 text-[11px] tracking-[0.14em]'
    }`}>
      <Icon className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} /> {meta.label}
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
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => { document.title = 'My Orders | CloudNineCards'; }, []);

  const loadOrders = useCallback(async (showSpinner = false) => {
    if (!user || !supabase) return;
    if (showSpinner) setRefreshing(true);
    // Match orders by either the linked auth user_id (set on signed-in checkout)
    // OR the buyer email (covers guest-then-signed-up customers).
    const escapedEmail = String(user.email || '').replace(/[(),]/g, '');
    const filterClause = user.id
      ? `customer_user_id.eq.${user.id},buyer_email.ilike.${escapedEmail}`
      : `buyer_email.ilike.${escapedEmail}`;
    const { data } = await supabase
      .from('orders')
      .select('order_number, item_title, product_title, quantity, full_price, total_price, dp_amount, balance_due, payment_status, status, order_type, eta, delivery_country, delivery_fee, tax_amount, buyer_address, buyer_name, created_at, customer_user_id, buyer_email')
      .or(filterClause)
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
    setFetching(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/account', { replace: true }); return; }
    if (!supabase) { setFetching(false); return; }
    loadOrders();
  }, [user, loading, navigate, loadOrders]);

  // Refresh when tab regains focus (catches admin updates from another tab)
  useEffect(() => {
    const onFocus = () => { if (user && supabase) loadOrders(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, loadOrders]);

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
          src="/zoro.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="pointer-events-none absolute right-0 top-0 h-[520px] w-auto select-none"
          style={{ opacity: 0.42, filter: 'drop-shadow(0 0 40px rgba(52,211,153,0.6)) drop-shadow(0 0 80px rgba(52,211,153,0.25))', zIndex: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          {/* F7 mobile fix: stack header pieces under 480px so the email pill +
              action buttons don't push the row past viewport width. */}
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-w-0 max-w-full">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-400/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-100 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.24em]">
                <Package className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">{user?.email}</span>
              </div>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[0.88] tracking-[-0.04em] sm:text-5xl md:text-7xl">
                My
                <span className="block bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Orders
                </span>
              </h1>
            </motion.div>
            <div className="mb-1 flex w-full items-center gap-2 sm:w-auto">
              <button
                onClick={() => loadOrders(true)}
                disabled={refreshing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-300/70 transition hover:bg-cyan-300/15 hover:text-cyan-300 disabled:opacity-40 sm:flex-none sm:px-4 sm:text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white/80 sm:flex-none sm:px-4 sm:text-xs"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
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
        ) : (() => {
          const filtered = orders.filter(o => {
            if (typeFilter !== 'all' && o.order_type !== typeFilter) return false;
            const s = o.payment_status ?? o.status;
            if (statusFilter !== 'all' && s !== statusFilter) return false;
            return true;
          });

          const countOf = (type, status) => orders.filter(o => {
            if (type !== 'all' && o.order_type !== type) return false;
            const s = o.payment_status ?? o.status;
            if (status !== 'all' && s !== status) return false;
            return true;
          }).length;

          const TypePill = ({ value, label }) => {
            const count = countOf(value, statusFilter);
            return (
              <button
                onClick={() => setTypeFilter(value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                  typeFilter === value
                    ? 'border-cyan-300/60 bg-cyan-300/18 text-cyan-200'
                    : 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${typeFilter === value ? 'bg-cyan-300/20 text-cyan-200' : 'bg-white/8 text-white/35'}`}>
                  {count}
                </span>
              </button>
            );
          };

          const StatusPill = ({ value, label, color }) => {
            const count = countOf(typeFilter, value);
            return (
              <button
                onClick={() => setStatusFilter(value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                  statusFilter === value
                    ? `${color} opacity-100`
                    : 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${statusFilter === value ? 'bg-white/20 text-white/90' : 'bg-white/8 text-white/35'}`}>
                  {count}
                </span>
              </button>
            );
          };

          return (
            <>
              {/* Filter bar */}
              <div className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mr-1">Type</span>
                  <TypePill value="all" label="All Orders" />
                  <TypePill value="on_hand" label="On Hand" />
                  <TypePill value="pre_order" label="Pre-Order" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mr-1">Status</span>
                  <StatusPill value="all" label="All" color="border-white/20 bg-white/10 text-white/70" />
                  <StatusPill value="awaiting_payment" label="Awaiting" color="border-white/20 bg-white/8 text-white/60" />
                  <StatusPill value="payment_submitted" label="Submitted" color="border-yellow-400/40 bg-yellow-400/12 text-yellow-300" />
                  <StatusPill value="payment_verified" label="Paid" color="border-emerald-400/40 bg-emerald-400/12 text-emerald-300" />
                  <StatusPill value="payment_rejected" label="Rejected" color="border-red-400/40 bg-red-400/12 text-red-300" />
                </div>
                {(typeFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
                    className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30 hover:text-white/55 transition"
                  >
                    × Clear filters
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-lg font-black uppercase text-white/60">No orders match this filter</div>
                  <button onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }} className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-300/70 hover:text-cyan-300 transition">
                    Clear filters
                  </button>
                </div>
              ) : (() => {
                const sel = filtered[Math.min(selectedIdx, filtered.length - 1)];
                return (
                  <div className="grid gap-4 xl:grid-cols-[340px_1fr] items-start">
                    {/* ── Compact order list ─────────────────────────── */}
                    <div className="space-y-2 xl:max-h-[calc(100vh-260px)] xl:overflow-y-auto xl:pr-1">
                      {filtered.map((order, idx) => {
                        const active = idx === Math.min(selectedIdx, filtered.length - 1);
                        return (
                          <button key={order.order_number ?? idx} onClick={() => setSelectedIdx(idx)}
                            className={`w-full rounded-[18px] border p-4 text-left transition ${active ? 'border-cyan-300/40 bg-cyan-300/8' : 'border-white/8 bg-white/3 hover:bg-white/6'}`}>
                            {/* Row 1: order_number + type badge (left) + price (right) */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/35">#{order.order_number ?? '—'}</span>
                                <OrderTypeBadge type={order.order_type} />
                              </div>
                              <div className="shrink-0 text-sm font-black text-white">CAD ${safeNum(order.full_price ?? order.total_price).toFixed(2)}</div>
                            </div>
                            {/* Row 2: item title */}
                            <div className="truncate text-sm font-black text-white">{order.item_title ?? order.product_title}</div>
                            {/* Row 3: qty/country (left) + status pill (right) */}
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <div className="min-w-0 truncate text-xs text-white/40">Qty {order.quantity} · {order.delivery_country ?? 'Canada'}</div>
                              <div className="shrink-0"><StatusBadge status={order.payment_status ?? order.status} compact /></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Order detail pane ──────────────────────────── */}
                    {sel && (
                      <motion.div key={sel.order_number} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                        className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-6 xl:sticky xl:top-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-[0.18em] text-white/40">#{sel.order_number ?? '—'}</span>
                              <OrderTypeBadge type={sel.order_type} />
                            </div>
                            <div className="mt-1.5 text-xl font-black leading-snug">{sel.item_title ?? sel.product_title}</div>
                            <div className="mt-1 text-sm text-white/45">Qty: {sel.quantity} · {sel.delivery_country ?? 'Canada'}</div>
                            {sel.eta && <div className="mt-1 text-xs font-black text-cyan-300/70">ETA: {sel.eta}</div>}
                          </div>
                          <div className="text-right">
                            <StatusBadge status={sel.payment_status ?? sel.status} />
                            <div className="mt-2 text-3xl font-black">CAD ${safeNum(sel.full_price ?? sel.total_price).toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-white/5 pt-4 text-sm sm:grid-cols-3">
                          {safeNum(sel.dp_amount) > 0 && <>
                            <div className="text-white/40">Down payment (30% DP)</div>
                            <div className="text-right font-black text-emerald-300">CAD ${safeNum(sel.dp_amount).toFixed(2)}</div>
                            <div className="hidden sm:block" />
                            <div className="text-white/40">Balance on delivery (70%)</div>
                            <div className="text-right font-black text-yellow-300">CAD ${safeNum(sel.balance_due).toFixed(2)}</div>
                            <div className="hidden sm:block" />
                          </>}
                          {safeNum(sel.delivery_fee) > 0 && <>
                            <div className="text-white/40">Shipping</div>
                            <div className="text-right text-white/70">CAD ${safeNum(sel.delivery_fee).toFixed(2)}</div>
                            <div className="hidden sm:block" />
                          </>}
                          {safeNum(sel.tax_amount) > 0 && <>
                            <div className="text-white/40">Tax</div>
                            <div className="text-right text-white/70">CAD ${safeNum(sel.tax_amount).toFixed(2)}</div>
                            <div className="hidden sm:block" />
                          </>}
                          {sel.buyer_address && <>
                            <div className="text-white/40">Ship to</div>
                            <div className="col-span-1 text-right text-white/60 sm:col-span-2">{sel.buyer_address}</div>
                          </>}
                        </div>

                        {(() => {
                          const isPreorder = sel.order_type === 'pre_order' || sel.order_type === 'preorder_cart';
                          const awaitingPayment =
                            sel.payment_status === 'awaiting_payment' ||
                            sel.status === 'awaiting_payment';

                          // 1) Preorder, deposit not yet paid → ask for the 30% DP.
                          if (isPreorder && awaitingPayment) {
                            const dp = safeNum(sel.dp_amount ?? sel.total_price);
                            return (
                              <div className="mt-4 rounded-2xl border border-yellow-400/25 bg-yellow-400/8 px-4 py-3">
                                <div className="text-xs font-black uppercase tracking-[0.14em] text-yellow-300">Action required — send 30% deposit via Wise</div>
                                <div className="mt-1 text-sm text-white/60">
                                  Send <span className="font-black text-white">CAD ${dp.toFixed(2)}</span>{' '}
                                  <span className="text-white/40">(30% deposit)</span> to{' '}
                                  <span className="font-black text-yellow-300">@cloudninecards</span> on Wise, then submit your payment screenshot in the shop.
                                </div>
                                {safeNum(sel.balance_due) > 0 && (
                                  <div className="mt-1.5 text-xs text-white/45">
                                    Remaining balance <span className="font-black text-white/70">CAD ${safeNum(sel.balance_due).toFixed(2)}</span> + intl shipping due on release{sel.eta ? ` (${sel.eta})` : ''}.
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // 2) Preorder, deposit verified but order not yet "confirmed/released" → balance reminder.
                          if (isPreorder && sel.payment_status === 'payment_verified' && sel.status !== 'confirmed') {
                            return (
                              <div className="mt-4 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/8 px-4 py-3">
                                <div className="text-xs font-black uppercase tracking-[0.14em] text-fuchsia-300">Deposit received — balance due on release</div>
                                <div className="mt-1 text-sm text-white/60">
                                  Balance <span className="font-black text-white">CAD ${safeNum(sel.balance_due).toFixed(2)}</span>{' '}
                                  <span className="text-white/40">(70%)</span> + intl shipping due on release{sel.eta ? ` (${sel.eta})` : ''}.
                                </div>
                              </div>
                            );
                          }

                          // 3) Preorder confirmed/released → ask for the balance.
                          if (isPreorder && sel.status === 'confirmed' && sel.payment_status !== 'payment_verified') {
                            const bal = safeNum(sel.balance_due);
                            return (
                              <div className="mt-4 rounded-2xl border border-yellow-400/25 bg-yellow-400/8 px-4 py-3">
                                <div className="text-xs font-black uppercase tracking-[0.14em] text-yellow-300">Action required — send balance via Wise</div>
                                <div className="mt-1 text-sm text-white/60">
                                  Send <span className="font-black text-white">CAD ${bal.toFixed(2)}</span>{' '}
                                  <span className="text-white/40">(70% balance + intl shipping)</span> to{' '}
                                  <span className="font-black text-yellow-300">@cloudninecards</span> on Wise to finalize your order.
                                </div>
                              </div>
                            );
                          }

                          // 4) In-stock / cart order awaiting payment → full total.
                          if (awaitingPayment) {
                            const amt = safeNum(sel.total_price ?? sel.full_price);
                            return (
                              <div className="mt-4 rounded-2xl border border-yellow-400/25 bg-yellow-400/8 px-4 py-3">
                                <div className="text-xs font-black uppercase tracking-[0.14em] text-yellow-300">Action required — send payment via Wise</div>
                                <div className="mt-1 text-sm text-white/60">
                                  Send <span className="font-black text-white">CAD ${amt.toFixed(2)}</span> to{' '}
                                  <span className="font-black text-yellow-300">@cloudninecards</span> on Wise, then submit your payment screenshot in the shop.
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                          <span className="text-xs text-white/30">
                            Ordered {new Date(sel.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <a href="mailto:papspective@gmail.com" className="text-xs font-black uppercase tracking-[0.1em] text-cyan-400/70 hover:text-cyan-300 transition">
                            Contact Support →
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })()}
            </>
          );
        })()}
      </section>
      <Footer />
    </div>
  );
}
