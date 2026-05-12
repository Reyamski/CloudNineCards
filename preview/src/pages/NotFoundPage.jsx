import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';

export default function NotFoundPage() {
  useEffect(() => { document.title = '404 | CloudNineCards'; }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-fuchsia-500/15 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-[120px] font-black leading-none tracking-[-0.06em] md:text-[180px]">
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">
              404
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-black uppercase tracking-[-0.03em] md:text-4xl">
            Page Not Found
          </h1>
          <p className="mt-4 max-w-md text-base text-white/55">
            This page doesn't exist. Maybe the link is wrong or the product was removed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/shop"
              className="rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_14px_40px_rgba(34,211,238,0.25)] transition hover:opacity-95"
            >
              Go to Shop
            </Link>
            <Link
              to="/"
              className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white backdrop-blur transition hover:border-fuchsia-300/50 hover:bg-white/10"
            >
              Home
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
