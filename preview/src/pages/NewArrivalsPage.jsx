import {useEffect, useState} from 'react';
import {Flame, ChevronRight} from 'lucide-react';
import {motion} from 'framer-motion';
import {Link} from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import {supabase, supabaseEnabled} from '../lib/supabase';
import {useCart} from '../contexts/CartContext';
import {useToast} from '../components/Toast';

const BASE_NEW_ARRIVALS = [
  {
    id: 'op15jp',
    title: "One Piece Card Game Adventure on Kami's Island OP-15 Booster Box",
    subtitle: 'Japanese',
    price: 129.0,
    badge: 'In Stock',
    daysAgo: 'Live now',
    image: 'https://i.ibb.co/4R6DL8Vt/8cc175339fbf.webp',
  },
  {
    id: 'eb03jp',
    title: 'One Piece Card Game Extra Booster Heroines Edition EB-03',
    subtitle: 'Japanese',
    price: 259.0,
    badge: 'In Stock',
    daysAgo: 'Live now',
    image: 'https://i.ibb.co/cS1CLgXf/259dbef5f466.webp',
  },
  {
    id: 'ac1',
    title: 'One Piece Card Game Admirable Collection Vol.1 Vinsmoke Reiju AC-01',
    subtitle: 'Japanese',
    price: 279.0,
    badge: 'In Stock',
    daysAgo: 'Live now',
    image: 'https://i.ibb.co/ZzmyRcFX/aac4c203bf03.webp',
  },
  {
    id: 'poke-ah',
    title: 'Pokemon TCG Mega Evolution Ascended Heroes Elite Trainer Box',
    subtitle: 'English',
    price: 279.0,
    badge: 'In Stock',
    daysAgo: 'Live now',
    image: 'https://i.ibb.co/5WbMqZTR/41faa72453fe.jpg',
  },
];

export default function NewArrivalsPage() {
  const [items, setItems] = useState(BASE_NEW_ARRIVALS);
  const {addItem} = useCart();
  const {showToast} = useToast();

  useEffect(() => { document.title = 'New Arrivals | CloudNineCards'; }, []);

  useEffect(() => {
    async function loadLiveStock() {
      if (!supabaseEnabled || !supabase) return;

      const {data, error} = await supabase.from('stock').select('*');
      if (error || !data?.length) return;

      const nextItems = BASE_NEW_ARRIVALS
        .map((item) => {
          const row = data.find((stock) => stock.id === item.id);
          const quantity = row?.quantity ?? 0;
          const inStock = row?.in_stock ?? true;
          return {
            ...item,
            quantity,
            inStock,
          };
        })
        .filter((item) => item.inStock && item.quantity > 0);

      if (nextItems.length) setItems(nextItems);
    }

    loadLiveStock();
  }, []);

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-yellow-400/15 bg-[#07030f] px-6 pb-12 pt-6 min-h-[420px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        {/* Nami character art */}
        <img
          src="/nami.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-auto select-none"
          style={{ opacity: 0.42, filter: 'drop-shadow(0 0 40px rgba(250,204,21,0.65)) drop-shadow(0 0 80px rgba(250,204,21,0.25))', zIndex: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}} className="mt-6">
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
              Showing the products that are actually in stock right now. This page follows your live inventory.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.45, delay: idx * 0.08}}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] flex flex-col h-full"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-300 via-cyan-300 to-fuchsia-400" />
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/product-fallback.svg';
                  }}
                  className="h-[240px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-yellow-300/25 bg-black/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-yellow-200 backdrop-blur">
                  {item.badge}
                </div>
                {item.quantity != null && (
                  <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] font-black text-white/75 backdrop-blur">
                    {item.quantity} left
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-1 flex-col">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-yellow-300/75">{item.subtitle}</div>
                <div className="mt-2 text-lg font-black leading-snug">{item.title}</div>
                <div className="mt-4 text-3xl font-black">CAD ${item.price.toFixed(2)}</div>
                <div className="mt-1 text-xs text-white/35">{item.daysAgo}</div>
                <div className="mt-auto pt-5 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const result = addItem({
                        key:        `products:${item.id}`,
                        source:     'products',
                        id:         item.id,
                        title:      item.title,
                        image:      item.image,
                        price:      Number(item.price) || 0,
                        qty:        1,
                        isPreorder: false,
                        maxStock:   Number(item.quantity) || 0,
                        currency:   'CAD',
                      });
                      if (!result.ok && result.reason === 'stock') {
                        showToast(
                          result.available > 0
                            ? `Only ${result.available} more available`
                            : `Already at stock limit`
                        );
                        return;
                      }
                      showToast(`Added — ${item.title.length > 40 ? item.title.slice(0, 40) + '…' : item.title}`, {actionTo: '/cart', actionLabel: 'View Cart'});
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-cyan-300 to-fuchsia-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95"
                  >
                    Add to Cart
                  </button>
                  <Link
                    to={`/shop/${item.id}`}
                    className="flex w-full items-center justify-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/45 hover:text-cyan-300 transition"
                  >
                    View product <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
