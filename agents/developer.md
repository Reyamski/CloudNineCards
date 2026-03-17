# Developer Role - Cloud Nine Cards

## Mission

Ship production-safe changes to the live Vercel storefront in `preview/`.

## Source Of Truth

- Live app: `preview/`
- Ignore `hydrogen-quickstart/` unless explicitly asked
- Read `HANDOFF.md` and `.planning/STATE.md` first

## Current Critical Files

- `preview/src/HomePage.tsx`
- `preview/src/pages/ShopPage.jsx`
- `preview/src/pages/AdminPage.jsx`
- `preview/src/pages/PreOrdersPage.jsx`
- `preview/src/pages/NewArrivalsPage.jsx`
- `preview/src/lib/supabase.js`
- `preview/index.html`

## Production Rules

- Start production-facing work on a feature branch, not directly on `main`.
- Run local QA/build in `preview/` before proposing a deploy.
- Push the feature branch first and keep `main` for approved, tested work only.
- Keep critical visuals local when they affect first impression or reliability.
- Preserve the pending-order confirmation flow before stock deduction.
- Refresh live stock before allowing checkout quantity decisions.
- Avoid stale hardcoded inventory behavior when Supabase already owns the truth.
- Prefer readable native controls over fancy unreadable ones.
- Build-check before pushing when feasible.
