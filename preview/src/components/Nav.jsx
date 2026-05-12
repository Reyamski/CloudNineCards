import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../lib/useAuth';

export default function Nav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'Pre-orders', to: '/pre-orders' },
    { label: 'New Arrivals', to: '/new-arrivals' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <Link to="/">
          <div>
            <div className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-2xl font-black tracking-[0.28em] text-transparent md:text-3xl">
              CLOUDNINECARDS
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.34em] text-white/45">
              full hype anime • premium tcg drops • sealed madness
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-[0.14em] text-white/75 md:flex">
          {links.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`transition hover:text-cyan-300 ${(to === '/' ? pathname === '/' : pathname.startsWith(to)) ? 'text-cyan-300' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Account link */}
        <Link
          to={user ? '/account/orders' : '/account'}
          className={`hidden items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition md:flex ${
            pathname.startsWith('/account') ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-300' : 'border-white/15 bg-white/5 text-white/65 hover:border-white/25 hover:text-white/85'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          {user ? 'My Orders' : 'Login'}
        </Link>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/75 hover:text-cyan-300 transition"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mt-4 flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:hidden"
          >
            {links.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-[0.14em] transition hover:bg-white/10 hover:text-cyan-300 ${
                  (to === '/' ? pathname === '/' : pathname.startsWith(to)) ? 'text-cyan-300' : 'text-white/75'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to={user ? '/account/orders' : '/account'}
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-[0.14em] transition hover:bg-white/10 hover:text-cyan-300 ${
                pathname.startsWith('/account') ? 'text-cyan-300' : 'text-white/75'
              }`}
            >
              {user ? 'My Orders' : 'Login'}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
