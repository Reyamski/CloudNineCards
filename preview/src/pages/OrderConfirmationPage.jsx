import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function OrderConfirmationPage() {
  const location = useLocation();
  const state = location.state || {};

  // ── Wave 3b — preferred multi-order shape ────────────────────────────
  // CartPage hands off `orders: [{ kind, orderNumber, lines, ... }, ...]`.
  // Legacy single-order hand-offs still pass flat `orderNumber` / `lines` —
  // we down-convert them into a one-element `orders` array so the render
  // path stays single.
  const orders = Array.isArray(state.orders) && state.orders.length > 0
    ? state.orders
    : state.orderNumber || (Array.isArray(state.lines) && state.lines.length > 0)
      ? [legacyToOrder(state)]
      : [];

  const email   = state.email || '';
  const dueNow  = typeof state.dueNow === 'number'
    ? state.dueNow
    : orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const country = state.country;

  useEffect(() => { document.title = 'Order Confirmed | CloudNineCards'; }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
        <div className="mx-auto max-w-7xl"><Nav /></div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-[32px] border border-cyan-400/25 bg-[#07030f] p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
              <Check className="h-10 w-10 text-cyan-300" />
            </div>
            <h1 className="mt-4 text-3xl font-black uppercase">Order Sent</h1>
            {email && (
              <p className="mt-5 text-sm text-white/65 leading-6">
                We'll verify your Wise payment and confirm to{' '}
                <span className="text-cyan-300">{email}</span> within 24h.
              </p>
            )}
          </div>

          {/* ── One card per order ─────────────────────────────────────── */}
          {orders.length > 0 && (
            <div className="mt-7 space-y-4">
              {orders.map((order, idx) => (
                <OrderCard key={order.orderNumber || idx} order={order} country={country} />
              ))}
            </div>
          )}

          {/* ── Combined total summary ────────────────────────────────── */}
          {orders.length > 0 && (
            <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-300/8 p-5 text-sm">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300/70">Total Paid Now</span>
                <span className="text-2xl font-black text-cyan-200 tabular-nums">CAD ${dueNow.toFixed(2)}</span>
              </div>
              {orders.some(o => o.kind === 'pre_order') && (
                <div className="mt-2 flex justify-between text-[11px] text-fuchsia-300/85">
                  <span>Pending balance (pre-orders)</span>
                  <span className="tabular-nums">
                    CAD ${orders
                      .filter(o => o.kind === 'pre_order')
                      .reduce((s, o) => s + (Number(o.balanceDue) || 0), 0)
                      .toFixed(2)} + intl shipping
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shop" className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-white/75 hover:bg-white/10">
              Keep Browsing
            </Link>
            <Link to="/account/orders" className="rounded-2xl bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-black">
              My Orders
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── Adapter for the pre-Wave-3b single-order navigate() payload ──────────
function legacyToOrder(state) {
  return {
    kind:           state.hasPreorder ? 'pre_order' : 'in_stock',
    orderNumber:    state.orderNumber,
    lines:          state.lines || [],
    subtotal:       state.inStockSubtotal ?? state.subtotal,
    shippingFee:    state.shippingFee,
    freeShipApplied: state.freeShipApplied,
    taxAmount:      state.taxAmount,
    taxLabel:       state.taxLabel,
    total:          state.inStockTotal ?? state.total,
  };
}

function OrderCard({ order, country }) {
  const isPreorder = order.kind === 'pre_order';
  const borderColor = isPreorder ? 'border-fuchsia-400/30' : 'border-cyan-400/25';
  const accentText = isPreorder ? 'text-fuchsia-300' : 'text-cyan-300';
  const labelText  = isPreorder ? 'Pre-Order' : 'In-Stock Order';

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white/3 p-5`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${accentText}/70`}>{labelText}</div>
          {order.orderNumber && (
            <div className="text-base font-black text-white tracking-widest">{order.orderNumber}</div>
          )}
        </div>
        <span className={`rounded-full border ${borderColor} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${accentText}`}>
          {isPreorder ? 'PRE-ORDER' : 'IN STOCK'}
        </span>
      </div>

      {/* Items */}
      {Array.isArray(order.lines) && order.lines.length > 0 && (
        <div className="space-y-1.5 text-sm text-white/70">
          {order.lines.map((line, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="truncate">
                {line.title}
                <span className="text-white/30"> × {line.qty}</span>
              </span>
              <span className="tabular-nums text-white/80">CAD ${(Number(line.price) * line.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Totals breakdown */}
      <div className="mt-3 border-t border-white/10 pt-3 space-y-1 text-sm">
        {!isPreorder ? (
          <>
            <Row label="Subtotal" value={`CAD $${(Number(order.subtotal) || 0).toFixed(2)}`} />
            <Row
              label={`Shipping${country ? ` (${country})` : ''}`}
              value={order.freeShipApplied
                ? 'FREE'
                : `CAD $${(Number(order.shippingFee) || 0).toFixed(2)}`}
              valueClass={order.freeShipApplied ? 'text-green-400 font-black' : ''}
            />
            <Row
              label={`Tax${order.taxLabel ? ` (${order.taxLabel})` : ''}`}
              value={typeof order.taxAmount === 'number' && order.taxAmount > 0
                ? `CAD $${order.taxAmount.toFixed(2)}`
                : 'Not applicable'}
            />
            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
              <span className="font-black text-white/90">Paid now</span>
              <span className="tabular-nums text-cyan-200 font-black">CAD ${(Number(order.total) || 0).toFixed(2)}</span>
            </div>
          </>
        ) : (
          <>
            <Row label="Pre-order subtotal" value={`CAD $${(Number(order.subtotal) || 0).toFixed(2)}`} />
            <div className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/8 px-3 py-2 mt-1 text-[11px] text-fuchsia-100/85">
              <div className="flex justify-between">
                <span className="font-black uppercase tracking-[0.12em] text-fuchsia-300/80 text-[10px]">30% deposit paid</span>
                <span className="tabular-nums font-black">CAD ${(Number(order.dpAmount) || 0).toFixed(2)}</span>
              </div>
              <div className="mt-1 flex justify-between text-fuchsia-200/80">
                <span>70% balance + intl shipping</span>
                <span className="tabular-nums">CAD ${(Number(order.balanceDue) || 0).toFixed(2)} + ship</span>
              </div>
              <div className="mt-1 text-fuchsia-300/70 text-[10px]">Due on release{order.eta ? ` · ${order.eta}` : ''}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = '' }) {
  return (
    <div className="flex justify-between gap-3 text-white/70">
      <span>{label}</span>
      <span className={`tabular-nums ${valueClass || 'text-white/80'}`}>{value}</span>
    </div>
  );
}
