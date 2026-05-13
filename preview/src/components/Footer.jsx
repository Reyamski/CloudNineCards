import { Link } from 'react-router-dom';
import { Instagram, Youtube, Mail } from 'lucide-react';

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/>
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

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
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Follow Us</div>
            <a
              href="https://www.instagram.com/papspective"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-fuchsia-300"
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
            <a
              href="https://www.tiktok.com/@papspective"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-cyan-300"
            >
              <TikTokIcon className="h-3.5 w-3.5" /> TikTok
            </a>
            <a
              href="https://www.youtube.com/@papspective"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-red-400"
            >
              <Youtube className="h-3.5 w-3.5" /> YouTube
            </a>
            <a
              href="https://www.facebook.com/papspective"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-blue-400"
            >
              <FacebookIcon className="h-3.5 w-3.5" /> Facebook
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
