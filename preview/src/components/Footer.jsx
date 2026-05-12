import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-[#07030f] px-6 py-10 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

          {/* Brand */}
          <div className="max-w-xs">
            <Link to="/">
              <div className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-xl font-black tracking-[0.28em] text-transparent">
                CLOUDNINECARDS
              </div>
            </Link>
            <p className="mt-2 text-xs leading-5 text-white/40">
              Premium TCG sealed product shipped from Canada. One Piece · Pokémon · Dragon Ball · Yu-Gi-Oh.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                Payment via Wise · @cloudninecards
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 text-xs font-black uppercase tracking-[0.16em] text-white/45">
            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] text-white/25 mb-1">Shop</div>
              <Link to="/shop" className="transition hover:text-cyan-300">All Products</Link>
              <Link to="/pre-orders" className="transition hover:text-cyan-300">Pre-orders</Link>
              <Link to="/new-arrivals" className="transition hover:text-cyan-300">New Arrivals</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] text-white/25 mb-1">Account</div>
              <Link to="/account" className="transition hover:text-cyan-300">My Orders</Link>
              <Link to="/contact" className="transition hover:text-cyan-300">Contact Us</Link>
            </div>
          </div>

          {/* Social / contact */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Connect</div>
            <a
              href="https://www.instagram.com/cloudninecards"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-fuchsia-300"
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
            <a
              href="mailto:papspective@gmail.com"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-cyan-300"
            >
              <Mail className="h-3.5 w-3.5" /> papspective@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/25">
          <span>© {year} CloudNineCards. All rights reserved.</span>
          <span>Prices in CAD · Shipped from Canada · Powered by Wise</span>
        </div>
      </div>
    </footer>
  );
}
