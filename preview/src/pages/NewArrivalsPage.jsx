import { Flame, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';

const newArrivals = [
  {
    title: 'One Piece Two Legends OP-08 Booster Box',
    subtitle: 'English • Just Dropped',
    price: '$50.00',
    badge: 'New',
    daysAgo: '2 days ago',
    image: 'https://cloudninecards.ca/cdn/shop/files/71qBWvl1uRL._AC_SL1500.jpg?v=1771572122&width=3840',
  },
  {
    title: 'One Piece Heroines Edition EB-03 Booster Box',
    subtitle: 'Japanese • Just Dropped',
    price: '$131.00',
    badge: 'New',
    daysAgo: '3 days ago',
    image: 'https://cloudninecards.ca/cdn/shop/files/61X1xcYYFCL._AC_SL1088.jpg?v=1771571570&width=500',
  },
  {
    title: 'Dragon Ball Super Fusion World FB-04 Booster Box',
    subtitle: 'English • This Week',
    price: '$109.99',
    badge: 'Fresh',
    daysAgo: '5 days ago',
    image: 'https://cloudninecards.ca/cdn/shop/files/61VDeW8QgNL._AC_SL1200.jpg?v=1771571417&width=500',
  },
  {
    title: 'Pokémon TCG Prismatic Evolutions Booster Bundle',
    subtitle: 'English • This Week',
    price: '$44.99',
    badge: 'Fresh',
    daysAgo: '6 days ago',
    image: 'https://cloudninecards.ca/cdn/shop/files/61_FxpqROpL._AC_SL1200.jpg?v=1771571401&width=500',
  },
  {
    title: 'One Piece OP-11 Fist of God Speed Booster Box',
    subtitle: 'Japanese • This Month',
    price: '$139.28',
    badge: 'Hot',
    daysAgo: '10 days ago',
    image: 'https://cloudninecards.ca/cdn/shop/files/61X1xcYYFCL._AC_SL1088.jpg?v=1771571570&width=500',
  },
  {
    title: 'Dragon Ball Super Fusion World FS06 Starter Deck',
    subtitle: 'English • This Month',
    price: '$24.99',
    badge: 'Hot',
    daysAgo: '12 days ago',
    image: 'https://cloudninecards.ca/cdn/shop/files/71qBWvl1uRL._AC_SL1500.jpg?v=1771572122&width=3840',
  },
];

export default function NewArrivalsPage() {
  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-yellow-400/15 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-yellow-100">
              <Flame className="h-4 w-4" /> Fresh drops
            </div>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
              New
              <span className="block bg-gradient-to-r from-yellow-300 to-cyan-300 bg-clip-text text-transparent">
                Arrivals
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/65">
              Latest sets and singles just landed. Updated every week — bookmark this page.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {newArrivals.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-300 via-cyan-300 to-fuchsia-400" />
              <div className="relative overflow-hidden">
                <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[240px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-yellow-300/25 bg-black/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-yellow-200 backdrop-blur">
                  {item.badge}
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] font-black text-white/60 backdrop-blur">
                  {item.daysAgo}
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-yellow-300/75">{item.subtitle}</div>
                <div className="mt-2 text-lg font-black leading-snug">{item.title}</div>
                <div className="mt-4 text-3xl font-black">{item.price}</div>
                <Link
                  to="/shop"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-cyan-300 to-fuchsia-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95"
                >
                  View Product <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
