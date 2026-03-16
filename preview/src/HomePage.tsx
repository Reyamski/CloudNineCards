import { Link } from 'react-router-dom';

const spotlightCards = [
  {
    badge: 'New Arc',
    title: 'Two Legends OP-08',
    body: 'Fast shipping, clean packaging, and reliable stock updates from the actual live inventory.',
    image: '/home-drop-card.svg',
  },
  {
    badge: 'Featured Release',
    title: 'Royal Blood OP-10',
    body: 'Critical homepage visuals now live locally in the app, so they load even when third-party CDNs do not.',
    image: '/home-feature-card.svg',
  },
];

const homepageSignals = [
  'Live stock sync connected to admin confirmations',
  'Pending orders wait for DP confirmation before stock deduction',
  'Critical homepage art served locally for better reliability',
];

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Pre-Orders', to: '/pre-orders' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Contact', to: '/contact' },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        .cnc-home {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(88, 221, 255, 0.16), transparent 28%),
            radial-gradient(circle at bottom right, rgba(255, 96, 214, 0.12), transparent 24%),
            #08030f;
          color: #f7f5ff;
        }

        .cnc-shell {
          width: min(1200px, calc(100% - 32px));
          margin: 0 auto;
        }

        .cnc-topbar {
          padding: 12px 0;
          text-align: center;
          font-size: 0.95rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fff5fc;
          background: linear-gradient(90deg, #cf1ecc 0%, #f1459d 50%, #ff5aad 100%);
        }

        .cnc-subbar {
          padding: 14px 0;
          text-align: center;
          font-size: 0.95rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ffe48b;
          background: rgba(95, 18, 131, 0.78);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .cnc-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 0 22px;
        }

        .cnc-brand {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-decoration: none;
          color: inherit;
        }

        .cnc-brand-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: linear-gradient(90deg, #67e8ff 0%, #b7c0ff 45%, #ffa0e7 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .cnc-brand-tagline {
          font-size: 0.82rem;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: rgba(235, 236, 255, 0.5);
        }

        .cnc-nav-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 18px;
        }

        .cnc-nav-links a {
          color: rgba(255, 255, 255, 0.88);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .cnc-hero {
          border: 1px solid rgba(111, 210, 255, 0.2);
          border-radius: 34px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(9, 12, 28, 0.92), rgba(35, 14, 57, 0.72)),
            url('/home-hero-backdrop.svg') center/cover no-repeat;
          box-shadow: 0 34px 80px rgba(0, 0, 0, 0.36);
        }

        .cnc-hero-inner {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
          gap: 28px;
          padding: 34px;
        }

        .cnc-hero-copy {
          display: flex;
          flex-direction: column;
          gap: 22px;
          justify-content: flex-end;
          min-width: 0;
        }

        .cnc-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cnc-chip {
          display: inline-flex;
          align-items: center;
          padding: 12px 18px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(24, 14, 46, 0.6);
          border-radius: 999px;
          color: #f4f1ff;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.78rem;
          font-weight: 700;
          backdrop-filter: blur(12px);
        }

        .cnc-hero-title {
          margin: 0;
          font-size: clamp(3.4rem, 8vw, 6.7rem);
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
          max-width: 9ch;
        }

        .cnc-hero-title span {
          display: block;
          background: linear-gradient(90deg, #65e6ff 0%, #ff8ddd 80%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .cnc-hero-copy p {
          margin: 0;
          max-width: 56ch;
          color: rgba(238, 239, 255, 0.82);
          font-size: 1.05rem;
          line-height: 1.7;
        }

        .cnc-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .cnc-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: 0 22px;
          border-radius: 999px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 800;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }

        .cnc-button:hover {
          transform: translateY(-2px);
        }

        .cnc-button-primary {
          background: linear-gradient(90deg, #56dcff 0%, #d66cff 100%);
          color: #09111c;
          box-shadow: 0 16px 40px rgba(95, 200, 255, 0.22);
        }

        .cnc-button-secondary {
          border: 1px solid rgba(162, 204, 255, 0.24);
          background: rgba(20, 16, 37, 0.6);
          color: #eff2ff;
        }

        .cnc-signal-list {
          display: grid;
          gap: 12px;
          margin: 8px 0 0;
          padding: 0;
          list-style: none;
        }

        .cnc-signal-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(236, 239, 255, 0.8);
          font-size: 0.98rem;
        }

        .cnc-signal-list li::before {
          content: '';
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(90deg, #55ddff, #ff79df);
          box-shadow: 0 0 20px rgba(94, 224, 255, 0.4);
        }

        .cnc-hero-cards {
          display: grid;
          gap: 18px;
          align-content: center;
        }

        .cnc-spotlight-card {
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr);
          gap: 18px;
          padding: 18px;
          border-radius: 26px;
          border: 1px solid rgba(105, 222, 255, 0.16);
          background: rgba(8, 12, 25, 0.76);
          backdrop-filter: blur(18px);
          min-width: 0;
        }

        .cnc-spotlight-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
        }

        .cnc-spotlight-card strong {
          display: inline-flex;
          margin-bottom: 10px;
          color: #ffe88a;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.72rem;
        }

        .cnc-spotlight-card h3 {
          margin: 0 0 8px;
          font-size: 1.2rem;
        }

        .cnc-spotlight-card p {
          margin: 0;
          color: rgba(236, 239, 255, 0.7);
          line-height: 1.6;
          font-size: 0.96rem;
        }

        .cnc-section {
          padding: 42px 0 0;
        }

        .cnc-section-title {
          margin: 0 0 16px;
          color: #64e4ff;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .cnc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }

        .cnc-panel {
          padding: 24px;
          border-radius: 26px;
          background: linear-gradient(180deg, rgba(14, 18, 33, 0.9), rgba(11, 9, 20, 0.96));
          border: 1px solid rgba(101, 224, 255, 0.14);
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.22);
        }

        .cnc-panel h3 {
          margin: 0 0 12px;
          font-size: 1.2rem;
        }

        .cnc-panel p {
          margin: 0;
          color: rgba(236, 239, 255, 0.74);
          line-height: 1.7;
        }

        .cnc-teaser {
          margin-top: 42px;
          border-radius: 34px;
          overflow: hidden;
          border: 1px solid rgba(109, 222, 255, 0.18);
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.3);
          background: #0e0a17;
        }

        .cnc-teaser img {
          display: block;
          width: 100%;
          height: auto;
        }

        .cnc-footer-cta {
          margin-top: 42px;
          padding: 34px;
          border-radius: 34px;
          border: 1px solid rgba(107, 224, 255, 0.14);
          background:
            linear-gradient(135deg, rgba(14, 18, 33, 0.88), rgba(34, 12, 54, 0.74)),
            url('/home-hero-backdrop.svg') center/cover no-repeat;
          display: grid;
          gap: 18px;
        }

        .cnc-footer-cta h2 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.2rem);
          max-width: 12ch;
          line-height: 1;
        }

        .cnc-footer-cta p {
          margin: 0;
          max-width: 60ch;
          color: rgba(236, 239, 255, 0.78);
          line-height: 1.7;
        }

        @media (max-width: 920px) {
          .cnc-nav {
            flex-direction: column;
            align-items: flex-start;
          }

          .cnc-nav-links {
            justify-content: flex-start;
          }

          .cnc-hero-inner {
            grid-template-columns: 1fr;
            padding: 24px;
          }
        }

        @media (max-width: 640px) {
          .cnc-home {
            padding-bottom: 28px;
          }

          .cnc-shell {
            width: min(100% - 24px, 1200px);
          }

          .cnc-topbar,
          .cnc-subbar {
            font-size: 0.72rem;
            letter-spacing: 0.12em;
          }

          .cnc-spotlight-card {
            grid-template-columns: 1fr;
          }

          .cnc-spotlight-card img {
            height: 220px;
          }

          .cnc-footer-cta,
          .cnc-panel {
            padding: 22px;
          }
        }
      `}</style>

      <main className="cnc-home">
        <div className="cnc-topbar">Pre-orders now open - 30% DP via Wise - international shipping and taxes covered by buyer</div>
        <div className="cnc-subbar">One Piece OP-17 Japanese - pre-orders opening soon</div>

        <div className="cnc-shell">
          <header className="cnc-nav">
            <Link className="cnc-brand" to="/">
              <span className="cnc-brand-title">CloudNineCards</span>
              <span className="cnc-brand-tagline">Full hype anime premium TCG drops</span>
            </Link>

            <nav className="cnc-nav-links" aria-label="Primary">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>

          <section className="cnc-hero">
            <div className="cnc-hero-inner">
              <div className="cnc-hero-copy">
                <div className="cnc-chip-row">
                  <span className="cnc-chip">New season drop</span>
                  <span className="cnc-chip">Live stock</span>
                  <span className="cnc-chip">Admin synced</span>
                </div>

                <h1 className="cnc-hero-title">
                  Pull Legendary.
                  <span>Own The Arc.</span>
                </h1>

                <p>
                  One Piece, Pokemon, and Dragon Ball sealed drops for buyers who want clean stock tracking, fast updates,
                  and a storefront that stays reliable even when third-party image hosts do not.
                </p>

                <div className="cnc-cta-row">
                  <Link className="cnc-button cnc-button-primary" to="/shop">
                    Enter The Shop
                  </Link>
                  <Link className="cnc-button cnc-button-secondary" to="/pre-orders">
                    See Pre-Orders
                  </Link>
                </div>

                <ul className="cnc-signal-list">
                  {homepageSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>

              <div className="cnc-hero-cards">
                {spotlightCards.map((card) => (
                  <article key={card.title} className="cnc-spotlight-card">
                    <img alt={card.title} src={card.image} />
                    <div>
                      <strong>{card.badge}</strong>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="cnc-section">
            <p className="cnc-section-title">Storefront Signals</p>
            <div className="cnc-grid">
              <article className="cnc-panel">
                <h3>Pending orders stay pending</h3>
                <p>
                  On-hand orders now land in admin first. Stock only moves after you confirm the order, which matches your DP workflow.
                </p>
              </article>
              <article className="cnc-panel">
                <h3>New arrivals follow real stock</h3>
                <p>
                  The arrivals section now follows items that are actually in inventory instead of stale static cards.
                </p>
              </article>
              <article className="cnc-panel">
                <h3>Critical visuals are local</h3>
                <p>
                  Homepage hero and banner visuals are bundled with the app, so users do not lose the look of the site when remote hosts fail.
                </p>
              </article>
            </div>
          </section>

          <section className="cnc-teaser" aria-label="Upcoming OP-17 teaser">
            <img alt="One Piece OP-17 teaser banner" src="/home-op17-banner.svg" />
          </section>

          <section className="cnc-footer-cta">
            <p className="cnc-section-title">Built For Reliable Drops</p>
            <h2>Use the live admin, confirm orders, and keep your storefront clean.</h2>
            <p>
              The shop now runs on Vercel plus Supabase with stock-aware admin confirmations and local homepage visuals for better cross-network reliability.
            </p>
            <div className="cnc-cta-row">
              <Link className="cnc-button cnc-button-primary" to="/admin">
                Open Admin
              </Link>
              <Link className="cnc-button cnc-button-secondary" to="/new-arrivals">
                Browse New Arrivals
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
