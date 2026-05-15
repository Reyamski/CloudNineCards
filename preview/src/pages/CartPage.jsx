// Placeholder — full cart + merged checkout implementation lands in the next
// commit. Keeps the /cart route addressable so the header CartIcon doesn't
// 404 between commits during incremental review.
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';

export default function CartPage() {
  const { items, totals } = useCart();

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="px-6 pt-6 pb-12 bg-[#07030f] border-b border-white/10">
        <div className="mx-auto max-w-7xl"><Nav /></div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="text-4xl mb-3">🛒</div>
        <h1 className="text-3xl font-black uppercase">Your Cart</h1>
        <p className="mt-3 text-sm text-white/55">
          {items.length === 0
            ? 'Cart is empty.'
            : `${items.length} ${items.length === 1 ? 'line' : 'lines'} · CAD $${totals.subtotal.toFixed(2)}`}
        </p>
        <Link to="/shop" className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-7 py-3 text-sm font-black uppercase tracking-[0.12em] text-black">
          Browse Shop
        </Link>
      </section>
      <Footer />
    </div>
  );
}
