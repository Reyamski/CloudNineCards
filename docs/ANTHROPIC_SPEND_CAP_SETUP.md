# Anthropic API Spend-Cap Setup Runbook

**Audience:** owner of the Anthropic Console account whose API key is wired into `/api/analyze-card` (the AI-assisted card-data parser in the admin panel).
**Time required:** ~10 min.
**Cost:** $0 (spend caps are a free account feature).
**Goal:** bound the blast radius of any cost-abuse scenario — credential leak, runaway loop, malicious admin session, or unexpected upstream pricing change — so the worst case is a bounded monthly bill, not an unbounded one.

This is **owner-run**. It does not require any code change.

---

## 1. Why this matters

The `/api/analyze-card` endpoint takes an uploaded card image plus owner-typed metadata, calls Claude (Anthropic) to OCR / extract structured fields, and returns the result for the admin to confirm. Each call costs cents at most. Normal owner usage:

- ~30 new singles added per month via AI-parse
- ~$0.005 per call (current Claude pricing for a small image + small response)
- Expected monthly bill: **~$0.15 / month**

The threat model:

- **Stolen API key.** If the `ANTHROPIC_API_KEY` env var ever leaks (committed accidentally, logged somewhere, exfiltrated from Vercel), an attacker can pound the API directly. Anthropic bills by usage with no default cap, so a leaked key can theoretically run up thousands of dollars before you notice.
- **Runaway loop.** A bug in code that calls Claude in a retry loop without exponential backoff.
- **Malicious admin session.** Someone who guessed `cnc2026` and sits in the admin panel auto-uploading garbage to burn the budget.

A spend cap puts a hard ceiling on the damage from any of these.

---

## 2. Set the cap

1. Log into <https://console.anthropic.com/>.
2. Top-right account menu → **Settings**.
3. Left sidebar → **Plans & Billing** (sometimes labelled **Billing & Limits** depending on your account age).
4. Find the **Monthly Spend Limit** (or **Usage Limit** / **Spend Cap**) section.
5. Set:
   - **Monthly hard cap:** suggested **$20 / month**.
     - Rationale: at $0.005/call, $20 = 4000 abusive calls before the API auto-stops. That's 130x normal usage — enough headroom for a busy month while still capping the leak scenario at ~$20.
     - Adjust to your taste: $5 if you want a very tight cap (still 1000 calls), $50 if you anticipate heavier usage.
   - **Daily soft alert:** suggested **$2 / day** (about 10% of monthly).
     - This sends an email when daily spend crosses $2. Acts as an early-warning siren before the monthly hard cap triggers.
6. Add the **billing email** to the alert recipients. Use the same email that gets the Anthropic invoice — owner inbox, ideally one you check daily.
7. **Save.**

---

## 3. (Optional) Per-key spend cap

Anthropic's Console lets you create multiple API keys, each scoped to a workspace. On the free / single-workspace plan, you typically have one workspace and one key.

If you want extra defense-in-depth:

1. **Settings → Workspaces → API Keys.**
2. Create a new key named e.g. `vercel-prod-card-analyzer`.
3. Set a **per-key spend limit** on this key (e.g. $10/month — half the workspace limit, so even if this specific key is compromised, blast radius is half).
4. Rotate the env var `ANTHROPIC_API_KEY` in Vercel → Project Settings → Environment Variables to the new key.
5. Revoke the old key.

This is **optional**. The workspace-level cap from Section 2 already protects you; per-key caps just give per-surface isolation in case you later add more Anthropic-powered features.

---

## 4. Verification

After saving the cap, sanity-check that it's actually in place:

1. **Dashboard.** Go to <https://console.anthropic.com/> → **Usage**. You should see a progress bar showing **$X.YZ of $20** (or whatever cap you set).
2. **Manual trigger (optional).** From the admin panel on the live site, run an AI-parse on a real card image. Watch the **Usage** counter tick up by a few cents within ~1 min.

---

## 5. What happens when the cap is hit

Anthropic stops accepting new requests on the key as soon as the cap is exceeded. The response code from upstream becomes **`429 Too Many Requests`** (with a body indicating "spend limit reached") or in some cases **`402 Payment Required`** — the exact code depends on Anthropic's current behaviour.

In the codebase, `/api/analyze-card` currently catches any upstream non-200 and returns **HTTP 500** to the admin browser with the upstream error message in the response body. The admin sees a generic "AI parse failed — try again" message.

This is **acceptable behaviour for now**. If you want a nicer UX (e.g. a banner saying "AI quota exceeded — contact owner"), that's a future code change in `preview/api/analyze-card.js` — detect the specific upstream 429/402 and surface a cleaner client-side message.

---

## 6. Resetting the cap

If you legitimately hit the cap and want to keep operating mid-month:

1. **Settings → Billing → Monthly Spend Limit.**
2. Raise the cap or remove it temporarily.
3. Save. Calls resume within ~1 min.

Caution: only raise the cap if you trust the source of the spend. If you don't know **why** you hit the cap, leave it tripped and investigate first.

---

## 7. Audit log (optional)

Anthropic's Console also has an **Audit Log** (Settings → Audit Log on paid plans, limited on free). Periodically check it for:

- Unfamiliar IP addresses making API calls
- Spikes in call volume
- Calls outside of normal admin hours (e.g. 3 AM bursts)

Anything weird → rotate the API key immediately (Settings → API Keys → Revoke).

---

## 8. Related security guardrails

This runbook is one of several layered defenses:

- **In-code rate limit** — `preview/api/_lib/rate-limit.js` caps `/api/analyze-card` calls per-IP per-window. Bounds abuse from a single attacker IP.
- **Cloudflare edge rate limit** — see `docs/CLOUDFLARE_SETUP.md` Section 5e. Bounds abuse before it reaches Vercel.
- **Anthropic spend cap (this doc)** — bounds the cost ceiling regardless of how much abuse slips through the above two.

If all three are in place, the worst-case Anthropic bill from a key leak or admin-session compromise is **~$20 / month plus whatever was burned before you notice**.
