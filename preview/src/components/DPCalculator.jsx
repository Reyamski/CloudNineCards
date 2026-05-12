import { X, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DP_PERCENT = 0.30;
const CALC_ITEMS = [
  { id: 'op17jp',       title: 'OP-17 JP Booster Box',           price: 93,      soldOut: true },
  { id: 'ygo-cg2122ae', title: 'Yu-Gi-Oh! CP12 Case (24 Boxes)', price: 1650.55, soldOut: true },
  { id: 'op17eng',      title: 'OP-17 English Booster Box',      price: null,    soldOut: true },
  { id: 'op16eng',      title: 'OP-16 English Booster Box',      price: null,    soldOut: true },
  { id: 'op16jp',       title: 'OP-16 Japanese Booster Box',     price: null,    soldOut: true },
];

export default function DPCalculator({ onClose }) {
  const navigate = useNavigate();
  const [qtys, setQtys] = useState(() =>
    Object.fromEntries(CALC_ITEMS.map(item => [item.id, 0]))
  );

  function setQty(id, delta) {
    setQtys(prev => ({
      ...prev,
      [id]: Math.min(12, Math.max(0, (prev[id] ?? 0) + delta)),
    }));
  }

  const totalDp = CALC_ITEMS.reduce((sum, item) => {
    if (item.price == null) return sum;
    return sum + (qtys[item.id] ?? 0) * item.price * DP_PERCENT;
  }, 0);

  const hasTba = CALC_ITEMS.some(item => item.price == null && (qtys[item.id] ?? 0) > 0);

  function handleViewPreOrders() {
    onClose();
    navigate('/pre-orders');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md rounded-[32px] border border-fuchsia-400/20 bg-[#0d0520] overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 transition"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>

          {/* Header */}
          <div className="mb-5 pr-8">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-fuchsia-300" />
              <div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300/70">
                Budget Tool
              </div>
            </div>
            <div className="text-xl font-black">DP Calculator</div>
            <p className="mt-1 text-xs text-white/45 leading-5">
              Estimate your total 30% downpayment across multiple pre-orders before committing.
            </p>
          </div>

          {/* Item rows */}
          <div className="space-y-2 mb-5">
            {CALC_ITEMS.map(item => {
              const qty = qtys[item.id] ?? 0;
              const itemDp = item.price != null ? qty * item.price * DP_PERCENT : null;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/8 bg-white/4 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-snug truncate">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/45">
                          {item.price != null ? `CAD $${item.price.toFixed(2)}` : 'TBA'}
                        </span>
                        {item.soldOut && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/30">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                    {/* DP for this row */}
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-white/35 uppercase tracking-[0.1em] mb-0.5">DP</div>
                      <div className="text-sm font-black text-fuchsia-300">
                        {itemDp != null
                          ? qty === 0 ? '—' : `$${itemDp.toFixed(2)}`
                          : qty === 0 ? '—' : 'TBA'}
                      </div>
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(item.id, -1)}
                      disabled={qty === 0}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-base font-black text-white/70 hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-black tabular-nums">{qty}</span>
                    <button
                      onClick={() => setQty(item.id, +1)}
                      disabled={qty >= 12}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-base font-black text-white/70 hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-white/25 ml-1">max 12</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mb-5 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/8 p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-300/70">
                Total DP (30%)
              </div>
              <div className="text-2xl font-black text-fuchsia-200">
                {totalDp > 0 ? `CAD $${totalDp.toFixed(2)}` : '—'}
              </div>
            </div>
            {hasTba && (
              <p className="text-[11px] text-white/40 leading-5 mt-1">
                Items marked TBA are not included — final DP may be higher.
              </p>
            )}
            {totalDp === 0 && !hasTba && (
              <p className="text-[11px] text-white/35 leading-5">
                Set quantities above to calculate your estimated DP.
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleViewPreOrders}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-white hover:opacity-95 transition"
          >
            View Pre-Orders
          </button>
        </div>
      </motion.div>
    </div>
  );
}
