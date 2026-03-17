# TEAM ORCHESTRATION - Cloud Nine Cards

## Current Reality

- Active production app: `preview/`
- Preferred public URL: `https://www.cloudninecards.ca`
- Backup live URL: `https://cloud-nine-cards.vercel.app`
- Root apex `https://cloudninecards.ca` is configured correctly but may still appear stale on some ISP DNS caches
- `hydrogen-quickstart/` is legacy and should not be treated as the live storefront

## Active AI Crew

| Role | File | Main Responsibility |
|------|------|---------------------|
| Developer | `agents/developer.md` | Frontend, admin flow, deployment-safe code changes |
| Data Engineer | `agents/data-engineer.md` | Supabase schema, stock/order data integrity |
| QA Engineer | `agents/qa-engineer.md` | Regressions, risk review, test scenarios |
| GA | `agents/ga.md` | General assistant continuity, handoff quality, owner-facing support |

## Shared Rules

- Treat `preview/` as the source of truth for production work.
- Do not assume Hydrogen is live.
- Create a feature branch before changing production-facing code.
- Run local QA/build in `preview/` before any deploy or `main` push.
- Push the feature branch first; only ship to `main` after approval.
- Keep critical storefront visuals local when reliability matters.
- Keep stock in Supabase as the operational source of truth.
- Preserve the pending-order -> confirm-order -> deduct-stock workflow.
- Prefer `https://www.cloudninecards.ca` when sharing the live site publicly.
- Update `HANDOFF.md`, `.planning/STATE.md`, and external project memory after meaningful production changes.

## Website Best-Practice Baseline

- Critical homepage visuals should be bundled in `preview/public/`, not dependent on third-party hosts.
- Product cards should always have a safe local fallback image.
- Metadata should use a real title, description, and theme color.
- Forms and dropdowns must remain readable against their rendered browser backgrounds.
- Inventory displayed in the buy modal must refresh from live stock before submit.
- Admin actions should map to real business logic, not only local UI state.

## Coordination Pattern

1. GA reads `HANDOFF.md` and `.planning/STATE.md` first.
2. Developer creates or switches to the working feature branch and checks the active UI files in `preview/src/`.
3. Data Engineer checks Supabase-related files and schema scripts.
4. QA Engineer validates the branch locally before anything reaches `main`.
5. GA updates memory and owner-facing notes after changes ship.
