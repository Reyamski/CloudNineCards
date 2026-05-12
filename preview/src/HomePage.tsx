import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {BellRing, ChevronRight, Flame, Quote, ShieldCheck, Sparkles, Star, Truck, Zap} from 'lucide-react';
import {motion} from 'framer-motion';
import {supabase, supabaseEnabled} from './lib/supabase';

const DEFAULT_VIDEO_ID = 'OcLL44cDh7k';

const BASE_STOCK_SPOTLIGHT = [
  {
    id: 'op15jp',
    link: '/shop?product=op15jp',
    badge: 'Live Stock',
    title: "Adventure on Kami's Island OP-15",
    body: 'Fresh One Piece stock that stays aligned with the live storefront inventory.',
    image: '/op15.webp',
    price: 'CAD $129.00',
    subtitle: 'Japanese',
  },
  {
    id: 'eb03jp',
    link: '/shop?product=eb03jp',
    badge: 'Hot Drop',
    title: 'Heroines Edition EB-03',
    body: 'Current on-hand One Piece release, shown here only while inventory is actually available.',
    image: 'https://i.ibb.co/cS1CLgXf/259dbef5f466.webp',
    price: 'CAD $259.00',
    subtitle: 'Japanese',
  },
  {
    id: 'ac1',
    link: '/shop?product=ac1',
    badge: 'Featured',
    title: 'Admirable Collection AC-01',
    body: 'Collector-focused premium stock with live quantity awareness on the storefront.',
    image: '/ac1.webp',
    price: 'CAD $279.00',
    subtitle: 'Japanese',
  },
  {
    id: 'poke-ah',
    link: '/shop?product=poke-ah',
    badge: 'Pokemon',
    title: 'Ascended Heroes ETB',
    body: 'Pokemon stock joins the homepage only when it is really available for buyers.',
    image: '/ascended.jpg',
    price: 'CAD $279.00',
    subtitle: 'English',
  },
];

const trust = [
  {icon: ShieldCheck, title: 'Verified Seller', desc: 'Real buyers, real feedback, and transparent communication before payment.'},
  {icon: Truck, title: 'Shipping Clarity', desc: 'Shipping and tax expectations are surfaced clearly before the order is placed.'},
  {icon: Flame, title: 'Live Inventory', desc: 'The homepage now focuses on products that are actually in stock right now.'},
  {icon: Star, title: 'Collector First', desc: 'Sealed products, careful packaging, and a premium storefront feel from landing to checkout.'},
];

const vouches = [
  {
    name: 'Philippe Ho',
    badge: 'Top fan',
    text: 'I preordered a few boxes of OP17. Seller explains clearly and answers questions fast.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Art Enriquez',
    badge: '',
    text: 'I pre ordered OP16 and OP17, buy with confidence. Great guy and fast communication.',
    stars: 5,
    tag: 'Repeat buyer',
  },
  {
    name: 'Daniel Cruz',
    badge: '',
    text: 'Got my OP15 box on time and sealed perfectly. Great packaging, zero damage.',
    stars: 5,
    tag: 'On-hand order',
  },
  {
    name: 'Liam Nguyen',
    badge: '',
    text: 'Was skeptical about Wise at first but the seller walked me through everything. Cards arrived exactly as described.',
    stars: 5,
    tag: 'Verified buyer',
  },
  {
    name: 'Grace Ong',
    badge: '',
    text: 'Pre-ordered OP17 and the communication was excellent throughout. The 30 percent deposit system is easy to follow.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Trisha Reyes',
    badge: '',
    text: 'Ordered on-hand stock and received it faster than expected. Careful packaging and legit seller.',
    stars: 5,
    tag: 'On-hand order',
  },
];

const navLinks = [
  {label: 'Home', to: '/'},
  {label: 'Shop', to: '/shop'},
  {label: 'Pre-Orders', to: '/pre-orders'},
  {label: 'New Arrivals', to: '/new-arrivals'},
  {label: 'Contact', to: '/contact'},
];

function EmailSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      return;
    }
    if (supabaseEnabled && supabase) {
      await supabase.from('subscribers').upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: 'email' });
    }
    setStatus('success');
    setEmail('');
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Enter your email"
        className={`rounded-2xl border px-4 py-3 text-sm text-white/80 backdrop-blur outline-none focus:border-cyan-300/50 bg-black/30 ${
          status === 'error' ? 'border-red-400/60' : 'border-white/15'
        }`}
      />
      <button
        onClick={handleSubmit}
        className="rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black"
      >
        {status === 'success' ? '✓ Subscribed!' : 'Get early access'}
      </button>
      {status === 'error' && (
        <p className="w-full text-xs text-red-400 sm:col-span-2">Enter a valid email address.</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const [spotlightCards, setSpotlightCards] = useState(BASE_STOCK_SPOTLIGHT);
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);

  useEffect(() => { document.title = 'CloudNineCards | One Piece TCG Canada'; }, []);

  useEffect(() => {
    async function loadHomepageData() {
      if (!supabaseEnabled || !supabase) return;

      const [{data: stockRows}, {data: videoRow}] = await Promise.all([
        supabase.from('stock').select('*'),
        supabase.from('config').select('value').eq('key', 'video_id').maybeSingle(),
      ]);

      if (videoRow?.value) {
        setVideoId(extractYoutubeId(videoRow.value) || DEFAULT_VIDEO_ID);
      }

      if (stockRows?.length) {
        const nextCards = BASE_STOCK_SPOTLIGHT
          .map((card) => {
            const row = stockRows.find((stock) => stock.id === card.id);
            const quantity = row?.quantity ?? 0;
            const inStock = row?.in_stock ?? true;

            return {
              ...card,
              quantity,
              inStock,
            };
          })
          .filter((card) => card.inStock && card.quantity > 0)
          .slice(0, 4);

        if (nextCards.length) {
          setSpotlightCards(nextCards);
        }
      }
    }

    loadHomepageData();
  }, []);

  const heroCard = spotlightCards[0];
  const sideCards = spotlightCards.slice(1, 3);
  const featuredCards = spotlightCards.slice(0, 3);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-fuchsia-500/20 bg-[#07030f]">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,1,12,0.98)_0%,rgba(23,7,48,0.94)_35%,rgba(40,10,66,0.76)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.22),transparent_22%),radial-gradient(circle_at_left_center,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 md:pb-24 md:pt-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-2xl font-black tracking-[0.28em] text-transparent md:text-3xl">
                CLOUDNINECARDS
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.34em] text-white/45">
                full hype anime | premium tcg drops | sealed madness
              </div>
            </div>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-[0.14em] text-white/75 md:flex">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className="transition hover:text-cyan-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid items-center gap-10 md:grid-cols-[1.04fr_0.96fr] md:gap-12">
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6}} className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100 shadow-[0_0_35px_rgba(217,70,239,0.22)]">
                <Sparkles className="h-4 w-4" /> Live Stock Spotlight
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex -skew-x-12 items-center gap-2 border border-cyan-300/35 bg-cyan-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
                  <Zap className="h-3.5 w-3.5 skew-x-12" />
                  <span className="skew-x-12">OP-15 Live</span>
                </span>
                <span className="inline-flex -skew-x-12 items-center gap-2 border border-yellow-300/35 bg-yellow-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-yellow-100">
                  <Flame className="h-3.5 w-3.5 skew-x-12" />
                  <span className="skew-x-12">Fresh Drops</span>
                </span>
                <span className="inline-flex -skew-x-12 items-center gap-2 border border-rose-300/35 bg-rose-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-rose-100">
                  <BellRing className="h-3.5 w-3.5 skew-x-12" />
                  <span className="skew-x-12">OP-18 Coming</span>
                </span>
              </div>

              <div className="relative mt-6 max-w-5xl">
                <div className="absolute -left-4 top-3 h-[78%] w-1 rounded-full bg-gradient-to-b from-cyan-300 via-fuchsia-400 to-yellow-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]" />
                <h1 className="pl-4 text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] md:text-8xl">
                  Pull Legendary.
                  <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">
                    Own The Arc.
                  </span>
                </h1>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                One Piece, Pokemon, and Dragon Ball sealed drops for buyers who want clean stock tracking, fast updates,
                and a storefront that stays reliable.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/shop" className="rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_14px_40px_rgba(34,211,238,0.3)] transition hover:scale-[1.03]">
                  Enter The Shop
                </Link>
                <Link to="/pre-orders" className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white backdrop-blur transition hover:border-fuchsia-300/50 hover:bg-white/10">
                  See Pre-Orders
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                {['One Piece', 'Pokemon', 'Live Stock', 'Pre-Orders'].map((tag, idx) => (
                  <span
                    key={tag}
                    className={`rounded-full border px-4 py-2 ${
                      idx === 0 ? 'border-cyan-300/25 bg-cyan-300/10' :
                      idx === 1 ? 'border-fuchsia-300/25 bg-fuchsia-300/10' :
                      idx === 2 ? 'border-yellow-300/25 bg-yellow-300/10' :
                      'border-white/10 bg-white/5'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                {[
                  {icon: ShieldCheck, label: 'Verified Seller'},
                  {icon: Truck, label: 'Ships Canada-Wide'},
                  {icon: Zap, label: 'Live Stock Sync'},
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur">
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-white">
                        <Icon className="h-4 w-4 text-cyan-300" /> {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{opacity: 0, scale: 0.96}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.65, delay: 0.1}} className="grid gap-4">
              <div className="grid grid-cols-[1.06fr_0.94fr] gap-4">
                {heroCard ? (
                  <Link
                    to={heroCard.link}
                    className="relative block overflow-hidden rounded-[34px] border border-fuchsia-400/20 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.48)] transition hover:scale-[1.01] hover:border-cyan-300/35"
                  >
                    <img src={heroCard.image} alt={heroCard.title} className="h-[420px] w-full object-cover saturate-[1.35] contrast-[1.04]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95),rgba(0,0,0,0.34),transparent)]" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                      <div className="mb-3 inline-flex rounded-full bg-cyan-300/90 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-black shadow-lg">
                        {heroCard.badge}
                      </div>
                      <div className="text-3xl font-black uppercase leading-none md:text-4xl">{heroCard.title}</div>
                      <div className="mt-2 max-w-sm text-sm leading-6 text-white/78">{heroCard.body}</div>
                      <div className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-200">
                        {heroCard.subtitle} | {heroCard.price}
                      </div>
                    </div>
                  </Link>
                ) : null}

                <div className="grid gap-4">
                  {sideCards.map((card) => (
                    <Link
                      key={card.id}
                      to={card.link}
                      className="relative block overflow-hidden rounded-[24px] border border-cyan-300/20 bg-white/5 shadow-xl transition hover:scale-[1.01] hover:border-cyan-300/35"
                    >
                      <img src={card.image} alt={card.title} className="h-[196px] w-full object-cover saturate-[1.35]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">{card.badge}</div>
                        <div className="mt-1 text-lg font-black uppercase leading-tight">{card.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-6 pb-2 pt-6">
        <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.55}} className="relative overflow-hidden rounded-[32px] border border-red-500/30">
          <img
            src="/OP-17-JP.png"
            alt="One Piece OP-17"
            className="absolute inset-0 h-full w-full object-cover opacity-25 saturate-[1.3]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,1,12,0.97)_0%,rgba(80,5,5,0.82)_50%,rgba(5,1,12,0.93)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-600" />
          <div className="relative flex flex-col items-center gap-6 px-8 py-10 text-center sm:flex-row sm:text-left md:px-12">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
              <img src="/OP-17-JP.png" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                  Pre-Order Closed
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Sold Out
                </div>
              </div>
              <div className="mt-2 text-2xl font-black uppercase leading-tight md:text-3xl">
                One Piece <span className="bg-gradient-to-r from-red-400 via-orange-300 to-red-400 bg-clip-text text-transparent">OP-17 Japanese</span>
              </div>
              <p className="mt-1.5 text-sm text-white/55">4th Anniversary Set · "World's Strongest Warrior" · Pre-order window closed. Stay tuned for the next drop.</p>
            </div>
            <div className="shrink-0">
              <Link to="/pre-orders" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white/50 transition hover:bg-white/12">
                View Pre-Orders <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-8 md:py-12">
        <div className="grid gap-4 md:grid-cols-4">
          {trust.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.4, delay: idx * 0.08}} className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
                <div className={`absolute inset-x-0 top-0 h-1 ${idx % 2 === 0 ? 'bg-cyan-300/80' : 'bg-fuchsia-400/80'}`} />
                <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-black/25 p-3">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="text-lg font-black uppercase">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-white/65">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300/75">Live inventory</div>
            <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">In Stock Now</h2>
          </div>
          <Link to="/shop" className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white/80 md:inline-flex">
            View all products
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredCards.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300" />
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/product-fallback.svg';
                  }}
                  className="h-[295px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/72 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                  {item.badge}
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300/75">{item.subtitle}</div>
                <div className="mt-2 text-xl font-black leading-snug">{item.title}</div>
                <div className="mt-4 text-3xl font-black">{item.price}</div>
                <div className="mt-5 flex gap-3">
                  <Link to={item.link} className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95">
                    Buy Now — Wise
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <motion.div initial={{opacity: 0, y: 24}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.6}}>
          <div className="mb-6 text-center">
            <div className="text-sm font-black uppercase tracking-[0.24em] text-fuchsia-300/75">Feel the hype</div>
            <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">The World of One Piece</h2>
          </div>
          <div className="relative overflow-hidden rounded-[32px] border border-fuchsia-400/20 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-yellow-300" />
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                title="One Piece Hype Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="mb-8 text-center">
          <div className="text-sm font-black uppercase tracking-[0.24em] text-fuchsia-300/75">Buyer vouches</div>
          <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Real Buyers. Real Feedback.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/55">
            Buyers keep coming back because the communication is fast, the stock is legit, and the process stays clear.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {vouches.map((vouch) => (
            <div key={vouch.name} className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-6">
              <div className="absolute right-4 top-4 opacity-15">
                <Quote className="h-10 w-10 text-fuchsia-300" />
              </div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({length: vouch.stars}).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                  ))}
                </div>
                {vouch.badge ? (
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
                    Featured {vouch.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-sm italic leading-7 text-white/80">&quot;{vouch.text}&quot;</p>
              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm font-black text-white">{vouch.name}</div>
                <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">
                  {vouch.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-6">
        <div className="relative overflow-hidden rounded-[34px] border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(91,33,182,0.45),rgba(14,165,233,0.18))] p-8">
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78),rgba(0,0,0,0.25),transparent)]" />
          <div className="relative">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-violet-100/80">Join the drop list</div>
            <h3 className="mt-2 max-w-lg text-3xl font-black uppercase md:text-4xl">Get early access before the next arc starts.</h3>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/82">
              Be first to know about restocks, new sets, and exclusive drops.
            </p>
            <EmailSignup />
          </div>
        </div>
      </section>
    </div>
  );
}

function extractYoutubeId(value) {
  if (!value) return '';

  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').slice(0, 11);
    }
    if (url.searchParams.get('v')) {
      return url.searchParams.get('v').slice(0, 11);
    }
    const parts = url.pathname.split('/');
    const embedIndex = parts.findIndex((part) => part === 'embed');
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1].slice(0, 11);
    }
  } catch {
    return '';
  }

  return '';
}
