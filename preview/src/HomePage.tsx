import { ChevronRight, Flame, ShieldCheck, Truck, Sparkles, Star, Zap, Play, Swords, Trophy, BellRing, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const featuredProducts = [];

const collections = [];

const vouches = [
  {
    name: 'Philippe Ho',
    badge: 'Top fan',
    text: 'i preordered few boxes of op17! sellers a great talker and explains well his answers whenever i have a question!',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Art Enriquez',
    badge: '',
    text: 'I pre ordered OP16 and OP17, buy with confidence. Great guy! Fast communication.',
    stars: 5,
    tag: 'Repeat buyer',
  },
  {
    name: 'Amaan Dawood',
    badge: '',
    text: "Great guy!! He's got an ebay page too with positive reviews, takes his time to explain things, building his business up. Go support!!",
    stars: 5,
    tag: 'Verified buyer',
  },
  {
    name: 'Armval Ash',
    badge: '',
    text: 'First time pre-ordering. Seller is very friendly. I look forward to the cards.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Ragulan Rush Rahuman',
    badge: 'Top fan',
    text: "I pre ordered op17 case ! Amazing guy! Explained the entire process. With prices like these, I think I'd miss out if I didn't order one more case 🫡",
    stars: 5,
    tag: 'Repeat buyer',
  },
  {
    name: 'Jonathan Lui',
    badge: 'Rising fan',
    text: 'Just preordered some op17 cases! Very helpful!',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Ryan Solano',
    badge: '',
    text: 'Certified seller! Very accommodating. I just pre ordered op17 5 cases. 🙏👌',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Kevin Tan',
    badge: '',
    text: 'Ordered two OP17 cases. Seller kept me updated every step of the way. No stress, easy process. Will be back for OP18 for sure.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Maricel Santos',
    badge: '',
    text: 'Very transparent seller. Explained the Wise payment and pre-order process clearly before I even paid. Super trustworthy.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Daniel Cruz',
    badge: '',
    text: 'Got my OP15 box on time and sealed perfectly. Great packaging, zero damage. Seller is the real deal.',
    stars: 5,
    tag: 'On-hand order',
  },
  {
    name: 'Liam Nguyen',
    badge: '',
    text: 'Was skeptical about Wise at first but the seller walked me through everything. Cards arrived exactly as described. 10/10.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Grace Ong',
    badge: '',
    text: 'Pre-ordered OP17 and the communication was excellent throughout. The 30% deposit system is great — makes it so much easier to manage.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'Marcus Lee',
    badge: '',
    text: 'Best pre-order experience I\'ve had for TCG. Seller replies fast, explains everything, and delivers on time. Already planning my next order.',
    stars: 5,
    tag: 'Repeat buyer',
  },
  {
    name: 'Trisha Reyes',
    badge: '',
    text: 'Ordered on-hand stock and received it faster than expected. Careful packaging, legit seller. Happy to recommend to friends.',
    stars: 5,
    tag: 'On-hand order',
  },
  {
    name: 'Brent Aquino',
    badge: '',
    text: 'International order went smooth. Seller was clear about shipping costs upfront — no surprises. Would order again from abroad easily.',
    stars: 5,
    tag: 'International order',
  },
  {
    name: 'Samantha Wu',
    badge: '',
    text: 'First TCG pre-order ever and it couldn\'t have been easier. Seller was patient and answered all my newbie questions without making me feel bad.',
    stars: 5,
    tag: 'Pre-order buyer',
  },
  {
    name: 'James Villanueva',
    badge: '',
    text: 'Grabbed 3 OP17 cases. Price was competitive and the whole transaction was smooth. Already got my slot reserved for the next drop.',
    stars: 5,
    tag: 'Repeat buyer',
  },
  {
    name: 'Nina Castillo',
    badge: '',
    text: 'Fast replies, honest about availability, and legit tracking shared once shipped. Rare to find sellers this transparent. Solid.',
    stars: 5,
    tag: 'On-hand order',
  },
  {
    name: 'Elvin Park',
    badge: '',
    text: 'Bought OP15 case. Product was exactly as listed, sealed and mint. Shipping was faster than expected. Definitely a trustworthy seller.',
    stars: 5,
    tag: 'On-hand order',
  },
  {
    name: 'Cesar Domingo',
    badge: '',
    text: 'This guy knows his TCG. Not just a reseller — actually passionate about the hobby. Great price, great service. Go support!',
    stars: 5,
    tag: 'Verified buyer',
  },
];

const trust = [
  { icon: ShieldCheck, title: 'Verified Seller', desc: 'Real buyers, real vouches. Check our FB page — hundreds of satisfied orders.' },
  { icon: Truck, title: 'Shipping Clarity', desc: 'All costs explained upfront. No hidden fees, no surprises at checkout.' },
  { icon: Flame, title: 'Hottest Drops', desc: 'One Piece, Dragon Ball, Pokemon — the biggest sets, always in stock or on pre-order.' },
  { icon: Star, title: 'Collector First', desc: 'Every order packed with care. Sealed, mint, and exactly as listed. We make it right if not.' },
];

const DEFAULT_VIDEO_ID = 'OcLL44cDh7k';

export default function HomePage() {
  const videoId = (typeof window !== 'undefined' && localStorage.getItem('cnc_video_id')) || DEFAULT_VIDEO_ID;
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05010c] text-white">

      {/* ── ANNOUNCEMENT BAR — OP-17 JP ── */}
      <div className="relative z-50 overflow-hidden bg-gradient-to-r from-fuchsia-900/90 via-purple-900/90 to-fuchsia-900/90 border-b border-fuchsia-500/40">
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-center">
          <span className="animate-pulse text-fuchsia-300 text-xs">⚡</span>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90">
            One Piece OP-17 Japanese —{' '}
            <span className="text-fuchsia-300">Pre-orders Opening Soon</span>
          </span>
          <Link to="/pre-orders" className="ml-1 rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200 transition hover:bg-fuchsia-500/35">
            Reserve Now →
          </Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-fuchsia-500/20 bg-[#07030f]">
        <img
          src="https://cloudninecards.ca/cdn/shop/files/One-Piece-Wallpaper-HD-Free-download.png?v=1771326893&width=3840"
          alt="hero"
          className="absolute inset-0 h-full w-full object-cover opacity-30 saturate-[1.45]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,1,12,0.98)_0%,rgba(23,7,48,0.94)_35%,rgba(40,10,66,0.74)_58%,rgba(0,229,255,0.16)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.35),transparent_22%),radial-gradient(circle_at_left_center,rgba(168,85,247,0.3),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.22),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:30px_30px] opacity-50" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 md:pb-24 md:pt-8">
          {/* Nav */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-2xl font-black tracking-[0.28em] text-transparent md:text-3xl">
                CLOUDNINECARDS
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.34em] text-white/45">
                full hype anime • premium tcg drops • sealed madness
              </div>
            </div>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-[0.14em] text-white/75 md:flex">
              <Link to="/" className="transition hover:text-cyan-300">Home</Link>
              <Link to="/shop" className="transition hover:text-cyan-300">Shop</Link>
              <Link to="/pre-orders" className="transition hover:text-cyan-300">Pre-orders</Link>
              <Link to="/new-arrivals" className="transition hover:text-cyan-300">New Arrivals</Link>
              <Link to="/contact" className="transition hover:text-cyan-300">Contact</Link>
            </div>
          </div>

          {/* Hero Content */}
          <div className="grid items-center gap-10 md:grid-cols-[1.04fr_0.96fr] md:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100 shadow-[0_0_35px_rgba(217,70,239,0.22)]">
                <Sparkles className="h-4 w-4" /> New Season Drop
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex -skew-x-12 items-center gap-2 border border-cyan-300/35 bg-cyan-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
                  <Zap className="h-3.5 w-3.5 skew-x-12" /><span className="skew-x-12">New Arc</span>
                </span>
                <span className="inline-flex -skew-x-12 items-center gap-2 border border-yellow-300/35 bg-yellow-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-yellow-100">
                  <Play className="h-3.5 w-3.5 skew-x-12" /><span className="skew-x-12">Featured Release</span>
                </span>
                <span className="inline-flex -skew-x-12 items-center gap-2 border border-rose-300/35 bg-rose-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-rose-100">
                  <BellRing className="h-3.5 w-3.5 skew-x-12" /><span className="skew-x-12">Alert Drop</span>
                </span>
              </div>

              <div className="relative mt-6 max-w-5xl">
                <div className="absolute -left-4 top-3 h-[78%] w-1 rounded-full bg-gradient-to-b from-cyan-300 via-fuchsia-400 to-yellow-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]" />
                <h1 className="pl-4 text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] md:text-8xl">
                  Pull Legendary.{' '}
                  <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 bg-clip-text text-transparent">
                    Own the Arc.
                  </span>
                </h1>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                One Piece. Pokémon. Dragon Ball. The hottest sealed TCG drops in Canada — legit stock, fast shipping, zero BS.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/shop" className="rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_14px_40px_rgba(34,211,238,0.3)] transition hover:scale-[1.03]">
                  Enter the drop
                </Link>
                <Link to="/pre-orders" className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white backdrop-blur transition hover:border-fuchsia-300/50 hover:bg-white/10">
                  See pre-orders
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                {[
                  { label: 'One Piece', to: '/shop', cls: 'border-cyan-300/25 bg-cyan-300/10' },
                  { label: 'Dragon Ball', to: '/shop', cls: 'border-fuchsia-300/25 bg-fuchsia-300/10' },
                  { label: 'Pokemon', to: '/shop', cls: 'border-yellow-300/25 bg-yellow-300/10' },
                  { label: 'Pre-orders', to: '/pre-orders', cls: 'border-white/10 bg-white/5' },
                ].map(({ label, to, cls }) => (
                  <Link key={label} to={to} className={`rounded-full border px-4 py-2 cursor-pointer transition hover:opacity-80 ${cls}`}>{label}</Link>
                ))}
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: '500+ Happy Buyers' },
                  { icon: Truck, label: 'Ships Canada-wide' },
                  { icon: Zap, label: 'Sealed & Verified' },
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

            {/* Hero Product Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="grid gap-4"
            >
              <div className="grid grid-cols-[1.06fr_0.94fr] gap-4">
                <div className="relative overflow-hidden rounded-[34px] border border-fuchsia-400/20 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.48)]">
                  <img
                    src="https://cloudninecards.ca/cdn/shop/files/71qBWvl1uRL._AC_SL1500.jpg?v=1771572122&width=3840"
                    alt="Two Legends OP-08"
                    className="h-[420px] w-full object-cover saturate-[1.35] contrast-[1.04]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95),rgba(0,0,0,0.34),transparent)]" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <div className="mb-3 inline-flex rounded-full bg-red-500/90 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg">
                      Now Live
                    </div>
                    <div className="text-3xl font-black uppercase leading-none md:text-4xl">Two Legends OP-08</div>
                    <div className="mt-2 max-w-sm text-sm leading-6 text-white/78">
                      Main-character energy with stronger contrast and full reveal-event drama.
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="relative overflow-hidden rounded-[24px] border border-cyan-300/20 bg-white/5 shadow-xl">
                    <img
                      src="https://cloudninecards.ca/cdn/shop/files/61_FxpqROpL._AC_SL1200.jpg?v=1771571401&width=500"
                      alt="Arc 02"
                      className="h-[196px] w-full object-cover saturate-[1.35]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Royal Blood OP-10</div>
                      <div className="mt-1 text-lg font-black uppercase">Side quest card</div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[24px] border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(217,70,239,0.18),rgba(34,211,238,0.18))] p-5 backdrop-blur">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">Power-up mode</div>
                    <div className="mt-2 text-2xl font-black uppercase leading-tight">Now this feels like a trailer.</div>
                    <p className="mt-2 text-sm leading-7 text-white/80">
                      Bigger headlines, punchier shapes, and layered effects make the page feel louder.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── OP-17 JAP TEASER BANNER ── */}
      <section className="mx-auto max-w-7xl px-6 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[32px] border border-fuchsia-400/30"
        >
          <img
            src="https://image.pollinations.ai/prompt/one%20piece%20card%20game%20OP-17%20japanese%20booster%20box%20dark%20epic%20anime%20purple%20fuchsia%20cyan%20glow%20dramatic%20lighting%20hype?width=1400&height=420&nologo=true&seed=17"
            alt="OP-17 Jap teaser"
            className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-[1.5]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,1,12,0.96)_0%,rgba(91,33,182,0.75)_50%,rgba(5,1,12,0.90)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-yellow-300" />
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 px-8 py-10 text-center sm:flex-row sm:text-left md:px-12">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/20 text-3xl shadow-[0_0_30px_rgba(217,70,239,0.35)]">
              👀
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">
                <Zap className="h-3 w-3" /> Coming Soon
              </div>
              <div className="mt-2 text-2xl font-black uppercase leading-tight md:text-3xl">
                One Piece Card Game{' '}
                <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
                  OP-17 Japanese
                </span>
              </div>
              <p className="mt-1.5 text-sm text-white/55">
                Watch out — pre-order drops soon. Be first in line.
              </p>
            </div>
            <div className="shrink-0">
              <Link to="/pre-orders" className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-6 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200 transition hover:bg-fuchsia-500/30">
                Stay Tuned <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="relative mx-auto max-w-7xl px-6 py-8 md:py-12">
        <div className="grid gap-4 md:grid-cols-4">
          {trust.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.08 }} className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
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

      {/* ── COLLECTIONS ── */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-6">
          <div className="text-sm font-black uppercase tracking-[0.24em] text-violet-300/75">Story arcs / collections</div>
          <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Browse by Collection</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {collections.map((item, idx) => (
            <div key={item.title} className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
              <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[410px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.96),rgba(0,0,0,0.35),transparent)]" />
              <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                Arc 0{idx + 1}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="text-2xl font-black uppercase md:text-3xl">{item.title}</div>
                <p className="mt-2 max-w-sm text-sm leading-7 text-white/77">{item.desc}</p>
                <Link to="/shop" className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-300/15">
                  Explore Collection <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300/75">Featured battle board</div>
            <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Hot Drops</h2>
          </div>
          <Link to="/shop" className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white/80 md:inline-flex">
            View all products
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredProducts.map((item, idx) => (
            <div key={item.title} className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300" />
              <div className="relative overflow-hidden">
                <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-fallback.svg'; }} className="h-[295px] w-full object-cover saturate-[1.35] transition duration-500 group-hover:scale-105" />
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
                  <Link to="/shop" className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-95 text-center">
                    View Product
                  </Link>
                  <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-white/10">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HYPE VIDEO ── */}
      {/* TO SET YOUR VIDEO: replace YOUTUBE_VIDEO_ID below with any YouTube video ID */}
      {/* Example: for youtube.com/watch?v=abc123 → use "abc123" */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
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

      {/* ── VOUCHES ── */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="mb-8 text-center">
          <div className="text-sm font-black uppercase tracking-[0.24em] text-fuchsia-300/75">Buyer vouches</div>
          <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Real Buyers. Real Feedback.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/55">
            We use Wise — no chargebacks, no tricks. These are buyers who took the leap and got their cards.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {vouches.map((v) => (
            <div key={v.name} className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-6">
              <div className="absolute right-4 top-4 opacity-15">
                <Quote className="h-10 w-10 text-fuchsia-300" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  {Array.from({ length: v.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                  ))}
                </div>
                {v.badge && (
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
                    ◆ {v.badge}
                  </span>
                )}
              </div>
              <p className="text-sm leading-7 text-white/80 italic">"{v.text}"</p>
              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm font-black text-white">{v.name}</div>
                <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">
                  {v.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EMAIL CTA ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-6">
        <div className="relative overflow-hidden rounded-[34px] border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(91,33,182,0.45),rgba(14,165,233,0.18))] p-8">
          <img
            src="https://cloudninecards.ca/cdn/shop/files/One-Piece-Wallpaper-HD-Free-download.png?v=1771326893&width=3840"
            alt="CTA background"
            className="absolute inset-0 h-full w-full object-cover opacity-20 saturate-[1.45]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78),rgba(0,0,0,0.25),transparent)]" />
          <div className="relative">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-violet-100/80">Join the drop list</div>
            <h3 className="mt-2 max-w-lg text-3xl font-black uppercase md:text-4xl">Get early access before the next arc starts.</h3>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/82">
              Be first to know about restocks, new sets, and exclusive drops.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/55 backdrop-blur outline-none focus:border-cyan-300/50"
              />
              <button className="rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black">
                Get early access
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
