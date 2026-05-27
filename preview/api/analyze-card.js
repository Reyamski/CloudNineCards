/**
 * Vercel Serverless Function — /api/analyze-card
 *
 * Accepts POST { imageBase64, mediaType } or { imageUrl }
 * Calls Claude Vision API → returns parsed TCG card details as JSON.
 * If mediaType is image/heic or image/heif, converts to JPEG via sharp first.
 *
 * Security (2026-05-27):
 *   - Per-IP rate limit: 10 requests / 15 min sliding window. Mirrors the
 *     pattern in /api/admin-auth — in-memory Map<ip, timestamps[]>. Serverless
 *     instances may have separate memory, so this is a speed-bump not a hard
 *     cap; still raises the cost of cost-abuse attacks substantially. Returns
 *     429 + Retry-After header on excess.
 *   - CORS tightened from wildcard `*` to the request's same-origin (matches
 *     the other /api endpoints). Endpoint is admin-only in practice — there's
 *     no legitimate cross-origin caller. Defensive: if neither Origin nor
 *     forwarded-host is available, allow the call (don't lock out legit admin
 *     from a misconfigured proxy).
 *
 * Manual-upload mode (2026-05-22):
 *   Body flag `skip_parse: true` → handler does imgbb upload only (still
 *   handles HEIC conversion), skips the Claude vision call entirely, and
 *   returns `{ image_url }` 200. If imgbb upload fails in this mode → 500
 *   with the imgbb error. Used by the admin add forms when uploading
 *   non-card images (sealed sets, bundles) where the owner wants to type
 *   the product details by hand. Default behavior (no flag) unchanged.
 *
 * Behavior notes (2026-05 update):
 *   - Markdown-fenced and array-shaped Claude responses are tolerated.
 *     The parser strips ```json fences and, if the model returns an array
 *     of cards, picks the first object (Claude is prompted to return one,
 *     but multi-card photos sometimes coerce it into an array anyway).
 *   - imgbb upload runs sequentially BEFORE the Claude call, so the
 *     resulting public image_url is available on every return path —
 *     including parse failures. (Sequential, not parallel: simpler error
 *     handling and the extra latency vs the slow vision call is trivial.)
 *   - On Claude/parse failure, if imgbb succeeded, the handler returns
 *     HTTP 200 with a partial body { image_url, _parse_error } so the
 *     admin still gets the image attached and can fill the other fields
 *     manually. Total failure (Claude err AND no imgbb url) still 500s.
 *
 * Requires env var: ANTHROPIC_API_KEY
 * Optional env var: VITE_IMGBB_API_KEY or IMGBB_API_KEY (for image hosting)
 */

// ── Per-IP rate limit ──────────────────────────────────────────────────────
// Sliding window: at most MAX_HITS requests per WINDOW_MS per source IP.
// In-memory Map keyed by IP → array of recent hit timestamps. Older entries
// are filtered out on each access. Serverless instances may have separate
// memory across invocations, so this is a strong speed-bump rather than a
// hard guarantee — back with Vercel KV / Upstash for absolute caps.
const RL_MAX_HITS  = 10;
const RL_WINDOW_MS = 15 * 60 * 1000; // 15 min
const rlHits = new Map(); // ip -> number[] (timestamps)

function rlClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || '';
}

/**
 * Returns { allowed, retryAfterSec, count }.
 * - If allowed, records the hit and returns count after recording.
 * - If denied, returns retryAfterSec = how long until the OLDEST hit expires.
 * Defensive: if no IP could be derived, allow the call (don't block legit
 * admin behind a misconfigured proxy) — log once.
 */
function rlCheck(ip) {
  if (!ip) {
    console.warn('[analyze-card] no client IP available — skipping rate limit');
    return { allowed: true, retryAfterSec: 0, count: 0 };
  }
  const now = Date.now();
  const arr = (rlHits.get(ip) || []).filter(t => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX_HITS) {
    if (arr.length) rlHits.set(ip, arr);
    const retryAfterMs = RL_WINDOW_MS - (now - arr[0]);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)), count: arr.length };
  }
  arr.push(now);
  rlHits.set(ip, arr);
  return { allowed: true, retryAfterSec: 0, count: arr.length };
}

// Test-only helper to reset state between unit tests. Not exported to clients.
export function __resetRateLimitForTests() { rlHits.clear(); }

async function convertHeicToJpeg(base64Data) {
  const { default: convert } = await import('heic-convert');
  const inputBuffer = Buffer.from(base64Data, 'base64');
  const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.85 });
  return Buffer.from(outputBuffer).toString('base64');
}

async function uploadToImgbb(base64Data, imgbbKey) {
  const body = new FormData();
  body.append('image', base64Data);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: 'POST', body });
  const json = await res.json();
  return json.success ? json.data.url : null;
}

/**
 * Extract a single card object from Claude's text response.
 *
 * Handles three shapes Claude tends to return:
 *   1. Raw JSON object               → { ...fields }
 *   2. JSON object inside ```json``` → strip fence, parse
 *   3. JSON array of objects         → take the first, add _detected_count
 *
 * Returns null if nothing parseable can be salvaged. Exported as a named
 * export so unit tests can verify behavior without invoking the handler.
 *
 * @param {string} text - raw text from Claude content[0].text
 * @returns {object|null}
 */
export function parseClaudeText(text) {
  if (typeof text !== 'string') return null;
  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  // Match: optional language tag, optional leading newline, body, closing fence.
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```\s*$/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // First attempt: parse the cleaned text directly.
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: hunt for the first {...} or [...] substring. This catches
    // cases where Claude adds prose before/after the JSON despite the prompt.
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    // Prefer whichever appears first (lower index).
    const candidate =
      arrMatch && (!objMatch || arrMatch.index < objMatch.index)
        ? arrMatch[0]
        : objMatch
        ? objMatch[0]
        : null;
    if (!candidate) return null;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  // If array: pick first object, annotate with count for the frontend.
  if (Array.isArray(parsed)) {
    const first = parsed.find((x) => x && typeof x === 'object' && !Array.isArray(x));
    if (!first) return null;
    return { ...first, _detected_count: parsed.length };
  }

  if (parsed && typeof parsed === 'object') return parsed;
  return null;
}

export default async function handler(req, res) {
  // Same-origin CORS — mirrors /api/admin-auth, /api/subscribe, /api/card-request.
  // Replaces the previous wildcard `*` which let any origin call this paid endpoint.
  const origin = req.headers?.origin || '';
  const host   = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  if (!origin || origin === `https://${host}` || origin === `http://${host}`) {
    res.setHeader('Access-Control-Allow-Origin', origin || `https://${host}`);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Per-IP rate limit — admin-only endpoint, ~10 cards/day max in practice,
  // 10/15min is generous slack. Cap above this is treated as cost-abuse.
  const ip = rlClientIp(req);
  const rl = rlCheck(ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({
      error: 'Too many requests',
      retry_after_seconds: rl.retryAfterSec,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });

  const body = req.body ?? {};
  let { imageUrl, imageBase64, mediaType = 'image/jpeg' } = body;
  const skipParse = body.skip_parse === true;

  if (!imageUrl && !imageBase64) {
    return res.status(400).json({ error: 'imageUrl or imageBase64 required' });
  }

  // Detect HEIC by ISO BMFF magic bytes — catches files with wrong .jpg extension
  if (imageBase64) {
    const hdr = Buffer.from(imageBase64.substring(0, 20), 'base64');
    const isHeicContent = hdr.length >= 12
      && hdr[4] === 0x66 && hdr[5] === 0x74 && hdr[6] === 0x79 && hdr[7] === 0x70
      && ['heic','heis','hevc','hevx','heim','heix','hevm','hevs','mif1','msf1']
           .includes(hdr.slice(8, 12).toString('ascii'));
    if (isHeicContent || mediaType === 'image/heic' || mediaType === 'image/heif') {
      try {
        imageBase64 = await convertHeicToJpeg(imageBase64);
        mediaType = 'image/jpeg';
      } catch (err) {
        return res.status(400).json({ error: 'HEIC conversion failed on server', detail: err.message });
      }
    }
  }

  // Upload to imgbb FIRST (sequential, before Claude). This guarantees we
  // have a public image_url available on every subsequent return path,
  // including Claude/parse failures. Sequential keeps error flow simple;
  // the extra ~200ms vs Claude's ~5s vision call is negligible.
  let imageUrlFromImgbb = null;
  let imgbbError = null;
  const imgbbKey = process.env.VITE_IMGBB_API_KEY ?? process.env.IMGBB_API_KEY;
  if (imgbbKey && imageBase64) {
    try {
      imageUrlFromImgbb = await uploadToImgbb(imageBase64, imgbbKey);
    } catch (err) {
      // Non-fatal for AI mode — we still try Claude. Captured here so the
      // manual-upload short-circuit below can surface the real reason if
      // imgbb is the only thing the caller asked for.
      imgbbError = err;
    }
  }

  // Manual-upload mode: skip Claude entirely, return image_url only.
  // If imgbb upload failed (or wasn't configured), this is a hard 500 since
  // the caller's whole purpose was to get a hosted image_url back.
  if (skipParse) {
    if (imageUrlFromImgbb) {
      return res.status(200).json({ image_url: imageUrlFromImgbb });
    }
    const detail = imgbbError?.message
      || (!imgbbKey ? 'IMGBB API key not configured on server' : 'imgbb upload returned no URL');
    return res.status(500).json({ error: 'Image upload failed', detail });
  }

  const imageSource = imageUrl
    ? { type: 'url', url: imageUrl }
    : { type: 'base64', media_type: mediaType, data: imageBase64 };

  let claudeRes;
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: imageSource },
            {
              type: 'text',
              text: `You are a TCG card expert for One Piece, Pokemon, Dragon Ball, and Yu-Gi-Oh!.
Analyze this card image carefully. Look at ALL parts of the card:
- Card name: usually large text at top or bottom
- Card number: small alphanumeric code printed at the bottom-left or bottom-right corner (e.g. OP01-001, EB03-018, 025/198)
- Set code: prefix of the card number (e.g. OP-01, EB-03, SV7) — also on the card back or set symbol
- Rarity: indicated by the symbol/color near the card number, or text like SR, R, C, UC, L, SP

IMPORTANT OUTPUT RULES:
- If multiple cards are visible in the photo, identify ONLY the most prominent / largest / most-centered card. Ignore the rest.
- Return a SINGLE JSON OBJECT — NEVER a JSON array, NEVER markdown code fences (no \`\`\`json), NEVER any text or explanation outside the JSON.

Return ONLY valid JSON — no explanation, no markdown:
{
  "card_name": "card name in English — translate from Japanese/Korean if needed",
  "set_name": "full set name (e.g. 'EB-03 Heroines Edition', 'Scarlet & Violet—Stellar Crown')",
  "set_code": "short set code (e.g. 'EB-03', 'OP-15', 'SV7') — derive from card number prefix if needed",
  "card_number": "full card number as printed at bottom corner (e.g. 'EB03-018', 'OP15-001', '25/142') — look carefully at the bottom corners",
  "game": "one of exactly: One Piece, Pokemon, Dragon Ball, Yu-Gi-Oh!, Union Arena",
  "language": "one of exactly: English, Japanese",
  "condition": "one of exactly: NM, LP, MP, HP, D — default NM if unclear",
  "rarity": "rarity (e.g. Common, Uncommon, Rare, Super Rare, Secret Rare, Leader Rare, Special Rare)"
}
Only use "Unknown" if a field is truly impossible to determine from the image.`,
            },
          ],
        }],
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    // Network/abort failure. Still return image_url if we have one so the
    // admin keeps the upload and can fill fields manually.
    if (imageUrlFromImgbb) {
      return res.status(200).json({
        image_url: imageUrlFromImgbb,
        _parse_error: `Claude API request failed: ${err.message}`,
      });
    }
    return res.status(500).json({ error: `Claude API request failed: ${err.message}` });
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    console.error('[analyze-card] Anthropic error', claudeRes.status, errText);
    let detail = errText;
    try { detail = JSON.parse(errText)?.error?.message ?? errText; } catch { /* keep raw */ }
    if (imageUrlFromImgbb) {
      return res.status(200).json({
        image_url: imageUrlFromImgbb,
        _parse_error: `Claude API ${claudeRes.status}: ${String(detail).slice(0, 200)}`,
      });
    }
    return res.status(500).json({ error: `Claude API ${claudeRes.status}`, detail: String(detail).slice(0, 500) });
  }

  const data = await claudeRes.json();
  const text = (data.content?.[0]?.text ?? '').trim();

  const parsed = parseClaudeText(text);
  if (!parsed) {
    console.error('[analyze-card] parse fail, raw text:', text.slice(0, 400));
    if (imageUrlFromImgbb) {
      // Partial success: frontend already merges result.image_url onto the
      // form; all other fields fall back to existing form values.
      return res.status(200).json({
        image_url: imageUrlFromImgbb,
        _parse_error: 'Could not parse AI response — fill fields manually.',
      });
    }
    return res.status(500).json({ error: 'Could not parse AI response', detail: text.slice(0, 400) });
  }

  // Success path — attach image_url if we got one.
  if (imageUrlFromImgbb) parsed.image_url = imageUrlFromImgbb;

  return res.json(parsed);
}
