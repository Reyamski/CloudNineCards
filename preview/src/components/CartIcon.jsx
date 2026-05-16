import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

// Cart icon + subtotal pill for the global nav.
// Count badge = number of distinct line items (cart "lines"), not total qty,
// to match the eurussshub pattern competitors do. Subtotal shows total CAD
// across in-stock + preorder lines, so the buyer always sees their commitment.
export default function CartIcon() {
  const { totals } = useCart();
  const { pathname } = useLocation();
  const isActive = pathname.startsWith('/cart');
  const lines = totals.lineCount;
  const subtotal = totals.subtotal;

  return (
    <Link
      to="/cart"
      aria-label={`Cart — ${lines} ${lines === 1 ? 'item' : 'items'}`}
      className={`relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
        isActive
          ? 'border-cyan-300/60 bg-cyan-300/20 text-cyan-200'
          : 'border-white/15 bg-white/5 text-white/80 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-100'
      }`}
    >
      <span className="relative inline-flex">
        <ShoppingBag className="h-4 w-4" />
        {lines > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-400 px-1 text-[10px] font-black text-black">
            {lines > 9 ? '9+' : lines}
          </span>
        )}
      </span>
      {/* Subtotal pill — hidden on very small screens to avoid cramping */}
      {lines > 0 && (
        <span className="hidden sm:inline tabular-nums text-cyan-200">
          CAD ${subtotal.toFixed(2)}
        </span>
      )}
    </Link>
  );
}
