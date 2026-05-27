# Cloudflare Setup Runbook — `cloudninecards.ca`

**Audience:** owner of the domain registrar account and the Vercel project.
**Time required:** ~30 min hands-on + DNS propagation wait (5 min – 48 hr, usually under 2 hr).
**Cost:** $0 (free tier covers everything in this runbook).
**Goal:** put Cloudflare in front of the existing Vercel deploy so we get:

- Free WAF (Web Application Firewall) on a managed ruleset
- Bot Fight Mode (cheap signal against scraper / brute-force traffic)
- Rate-limiting on `/api/*` (Layer-7 backstop to the in-memory per-instance limiter that already lives in the API server)
- "Always Use HTTPS" and "Automatic HTTPS Rewrites" for any stray HTTP traffic
- Faster TLS handshakes via Cloudflare's edge

This runbook is **owner-run**. It is not automated by the codebase. After cutover, the site should function identically — Cloudflare is a transparent reverse proxy.

---

## 1. Sign up for Cloudflare

1. Go to <https://www.cloudflare.com/> and click **Sign Up**.
2. Use a real owner email — Cloudflare sends important alerts (cert expiry, attack notifications, billing) here.
3. Confirm the email link.
4. Select the **Free** plan when prompted ("Pro" / "Business" upgrades can come later if needed).

---

## 2. Add the site

1. From the Cloudflare dashboard, click **Add a Site**.
2. Type `cloudninecards.ca` (apex only — no `www.`, no protocol).
3. Pick the **Free** plan again on the plan-selection screen.
4. Click **Continue**.

---

## 3. Verify DNS scan

Cloudflare automatically scans the existing DNS for `cloudninecards.ca` and shows the records it found. Confirm both rows are present:

- **Apex** `cloudninecards.ca` — type **CNAME** (or **A**, depending on how it was originally configured) pointing at a Vercel target like `cname.vercel-dns.com` or a Vercel-assigned IP.
- **`www`** subdomain — typically a **CNAME** to `cname.vercel-dns.com`.

If either is missing, click **Add Record** and re-create from your Vercel project's **Domains** tab (Vercel shows the exact value to paste).

**Important:** leave the orange-cloud proxy toggle **ON** (orange) for both rows. Orange = proxied through Cloudflare. Gray = DNS-only (Cloudflare just resolves, traffic skips the proxy — we don't want that).

Click **Continue**.

---

## 4. Update nameservers at the registrar

Cloudflare now displays **two assigned nameservers**, e.g.:

```
bob.ns.cloudflare.com
alice.ns.cloudflare.com
```

(Your exact names will differ — Cloudflare assigns them per account.)

Go to the registrar where `cloudninecards.ca` was purchased (e.g. Namecheap, GoDaddy, Cloudflare Registrar itself, Porkbun, etc.):

1. Find the domain's management page.
2. Locate **Nameservers** (sometimes under "DNS" or "Advanced DNS").
3. Switch from **Default / Custom (current registrar nameservers)** to **Custom Nameservers**.
4. Paste the two Cloudflare-assigned nameservers, save.

**Propagation wait:** typically 30 min – 2 hr. In rare cases 24–48 hr. Cloudflare will email when activation completes; the dashboard status flips from "Pending" to **"Active"**.

While waiting, the site continues to resolve through the old nameservers — there is no downtime.

---

## 5. Once Cloudflare shows "Active" — configure security knobs

### 5a. DNS tab

- Confirm both records (apex + `www`) still show the orange cloud (proxied).

### 5b. SSL/TLS tab

- **Encryption mode:** set to **Full (strict)**.
  - Why: Vercel has a valid public TLS cert, so origin-side validation is enforceable. "Full" (non-strict) still works but skips the cert-validity check; "strict" is the right default.
- **Edge Certificates →** verify Cloudflare's Universal SSL is **active** (will say "Active Certificate" with an issuer like Google Trust Services or Let's Encrypt).
- **Edge Certificates → Always Use HTTPS:** toggle **ON**.
- **Edge Certificates → Automatic HTTPS Rewrites:** toggle **ON**.
- **Edge Certificates → Minimum TLS Version:** set to **TLS 1.2** (block legacy 1.0/1.1 clients). 1.3 is too aggressive — some older devices break.

### 5c. Security → Bots

- **Bot Fight Mode:** toggle **ON**. Free tier. Light heuristics that block obvious bots while letting Googlebot through.

### 5d. Security → WAF (Web Application Firewall)

- Find **Managed Rules** (free tier: one managed ruleset is included).
- Click **Deploy** on **Cloudflare Managed Ruleset** if not already deployed.
- Default action: **Block**. (You can switch to **Log** first for 48 hr to make sure nothing legitimate is flagged, then flip to Block. For a small TCG store, default Block is usually fine — the ruleset is conservative.)

### 5e. Security → WAF → Rate Limiting Rules

This is the **biggest single security win** Cloudflare gives us — a Layer-7 hammer that backstops the in-memory per-instance limiter in `api-server.js` / Vercel functions (which is per-instance and resets on cold start).

Click **Create rule**:

- **Rule name:** `Rate-limit /api/*`
- **Match:** `URI Path` matches `^/api/`
- **When rate exceeds:** `30` requests per `1 minute` per `IP address`
- **Action:** **Block** (or "Managed Challenge" if you prefer a softer first-strike — block is simpler)
- **Duration:** `1 hour`

Save. This means any single IP hammering `/api/*` more than 30 times in a minute gets blocked at the edge for an hour, before the request ever hits Vercel.

**Tune later:** if you find legit users tripping it (e.g. an admin doing bulk uploads), bump to 60/min or scope the rule to only specific paths like `/api/subscribe` and `/api/card-request`.

### 5f. (Optional, follow-up) Turnstile widget

Cloudflare Turnstile is a free CAPTCHA replacement that the contact form, buylist form, and `/api/card-request` endpoint could integrate. It is **out of scope for this runbook** because it requires a JS snippet drop and a backend validation call.

If you decide to add it later:

1. Cloudflare dashboard → **Turnstile** → **Add Widget**.
2. Domain: `cloudninecards.ca`. Widget mode: **Managed** (recommended).
3. Copy the **Site Key** (public) and **Secret Key** (server).
4. Code changes (developer task): add `<div class="cf-turnstile" data-sitekey="..."></div>` to each form, validate the resulting token on the server with the Secret Key. Layered with our existing honeypots, this kills nearly all form spam.

---

## 6. Post-cutover verification

Run these from a terminal **after** Cloudflare shows "Active":

```bash
# Should show Cloudflare in the response chain:
curl -sI https://cloudninecards.ca/ | grep -iE 'server|cf-ray'
# Expected output includes:
#   server: cloudflare
#   cf-ray: <some-hex>-<airport-code>

# Site should load identically:
curl -s https://cloudninecards.ca/ | head -20
# Expected: same HTML head as before (title, meta tags, etc.)

# API still works:
curl -sI https://cloudninecards.ca/api/subscribe -X OPTIONS
# Expected: 204 No Content with CORS headers, NOT a Cloudflare block.

# Admin still works (just hits the gate):
open https://cloudninecards.ca/admin   # macOS, or browser-load on Windows
# Expected: admin gate renders. Enter the password — should still log in.
```

Then click through the site in a browser:

- [ ] Home loads (hero, carousel, video, news cards)
- [ ] Shop loads, product cards render
- [ ] Singles loads with filters working
- [ ] Pre-orders loads, countdown ticks
- [ ] Cart works, checkout modal opens
- [ ] Admin gate accepts the password
- [ ] Contact form submits (without actually sending — at least click through to the EmailJS step)

If anything is broken at this point, **rollback** (next section). If not, you are done.

---

## 7. Rollback plan

If something is irreversibly broken (rare — Cloudflare's edge is generally transparent):

1. Log into the **registrar** (where you bought `cloudninecards.ca`).
2. Open the domain's nameserver settings.
3. **Switch back** to the original nameservers (you may need to dig them up from registrar history or from Vercel's recommended setup):
   - Default registrar nameservers, **or**
   - Vercel's nameservers (if the domain was originally pointed there).
4. Save. Propagation: ~30 min – 2 hr.

During the rollback wait, traffic continues to hit Cloudflare → Vercel until DNS caches expire, then flips back to direct.

**Note:** rollback only changes the routing path. Cloudflare's configuration (WAF rules, rate-limit rules, etc.) stays saved in the dashboard, so re-enabling later is a 5-minute nameserver swap, not a re-do.

---

## 8. What this does NOT cover

These are deliberate omissions — handle in separate runbooks if needed:

- **DNSSEC.** Cloudflare supports it, but enabling DNSSEC at the registrar is a separate step with its own gotchas (TLD-specific DS record format). Skip unless asked.
- **CAA records.** Cloudflare auto-issues from a small set of CAs; if you have a CAA record pinning a specific CA, review compatibility.
- **Apex redirect to `www` (or vice versa).** Pick one canonical and use Cloudflare **Page Rules** or **Bulk Redirects** to enforce. Currently the codebase canonical is `https://cloudninecards.ca/` (bare apex) per `<link rel="canonical">` in `preview/index.html`.
- **Turnstile widget integration** (form-side CAPTCHA — see 5f).
- **Argo Smart Routing / Workers / R2** — paid features, not needed for this site's scale.
- **Custom origin certificate** — not needed because Vercel's edge cert is already trusted.

---

## 9. Verification this matches the in-code rate limiter

For reference, the existing rate-limit code lives in `preview/api/_lib/rate-limit.js` (and is consumed by `subscribe.js`, `card-request.js`, `analyze-card.js`, `admin-auth.js`). That limiter is **per-instance, in-memory** — it resets on every Vercel function cold start, and an attacker hitting from many IPs can still get through. The Cloudflare edge rate limit in **5e** is the durable backstop: it sees every request before it ever reaches Vercel, and its counters live at the edge across all Cloudflare PoPs.

Together they form belt-and-suspenders: in-code limiter for fine-grained UX messaging, Cloudflare for hard blocking.
