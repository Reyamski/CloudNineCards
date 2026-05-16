import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Layers, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../lib/useAuth';

// App-style bottom tab bar — mobile only (<=640px). Fixed to the bottom of the
// viewport. Desktop keeps the existing top nav (this is `sm:hidden`).
//
// IMPORTANT: do NOT render this on the product detail page — that page shows a
// sticky bottom Add-to-Cart bar, and stacking both fixed bars overlaps. The
// PDP simply doesn't mount <MobileTabBar />.
//
// Safe-area: pads with env(safe-area-inset-bottom) so it clears the iOS home
// indicator without reintroducing the Wave 3c-2 overflow fixes.
export default function MobileTabBar() {
  const { pathname } = useLocation();
  const { totals } = useCart();
  const { user } = useAuth();
  const lines = totals.lineCount;

  // Hide on the product detail page (/shop/:id) — that page has its own
  // sticky bottom buy bar, and two fixed bottom bars would overlap.
  const isProductDetail = /^\/shop\/[^/]+$/.test(pathname);
  if (isProductDetail) return null;

  const tabs = [
    { label: 'Home',    to: '/',        icon: Home,        match: (p) => p === '/' },
    { label: 'Shop',    to: '/shop',    icon: Store,       match: (p) => p.startsWith('/shop') },
    { label: 'Singles', to: '/singles', icon: Layers,      match: (p) => p.startsWith('/singles') },
    { label: 'Cart',    to: '/cart',    icon: ShoppingBag, match: (p) => p.startsWith('/cart'), badge: lines },
    { label: 'Account', to: user ? '/account/orders' : '/account', icon: User, match: (p) => p.startsWith('/account') },
  ];

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07030f]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ label, to, icon: Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                active ? 'text-cyan-300' : 'text-white/45 hover:text-white/70'
              }`}
            >
              <span className="relative inline-flex">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-400 px-1 text-[9px] font-black text-black">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
