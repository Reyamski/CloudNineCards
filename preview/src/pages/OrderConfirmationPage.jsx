import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function OrderConfirmationPage() {
  const location = useLocation();
  const state = location.state || {};
  const orderNumber = state.orderNumber || '';
  const email = state.email || '';
  const total = state.total;
  const lines = state.lines || [];
  const hasPreorder = state.hasPreorder;
  const inStockTotal = state.inStockTotal;
  const preorderTotal = state.preorderTotal;

  useEffect(() => { document.title = 'Order Confirmed | CloudNineCards'; }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
        <div className="mx-auto max-w-7xl"><Nav /></div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-[32px] border border-cyan-400/25 bg-[#07030f] p-8 text-center">
          <div className="mx-auto inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
            <Check className="h-10 w-10 text-cyan-300" />
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase">Order Sent</h1>

          {orderNumber && (
            <div className="mx-auto mt-5 inline-block rounded-xl border border-cyan-300/30 bg-cyan-300/8 px-5 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/60 mb-0.5">Order Number</div>
              <div className="text-lg font-black text-cyan-200 tracking-widest">{orderNumber}</div>
            </div>
          )}

          {email && (
            <p className="mt-5 text-sm text-white/65 leading-6">
              We'll verify your Wise payment and confirm to{' '}
              <span className="text-cyan-300">{email}</span> within 24h.
            </p>
          )}

          {(typeof total === 'number' || lines.length > 0) && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-sm text-white/65 space-y-1.5">
              {lines.map((line, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="truncate">
                    {line.title}
                    {line.isPreorder && <span className="ml-2 text-[10px] font-black uppercase text-fuchsia-300">PRE-ORDER</span>}
                    <span className="text-white/30"> × {line.qty}</span>
                  </span>
                  <span className="tabular-nums text-white/80">CAD ${(line.price * line.qty).toFixed(2)}</span>
                </div>
              ))}
              {hasPreorder && typeof inStockTotal === 'number' && (
                <>
                  <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
                    <span>Due now (in-stock + shipping)</span>
                    <span className="tabular-nums text-cyan-200 font-black">CAD ${inStockTotal.toFixed(2)}</span>
                  </div>
                  {typeof preorderTotal === 'number' && preorderTotal > 0 && (
                    <div className="flex justify-between text-fuchsia-300">
                      <span>Due on release (pre-order)</span>
                      <span className="tabular-nums">CAD ${preorderTotal.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {!hasPreorder && typeof total === 'number' && (
                <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
                  <span>Total paid via Wise</span>
                  <span className="tabular-nums text-cyan-200 font-black">CAD ${total.toFixed(2)}</span>
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
