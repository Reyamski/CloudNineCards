/**
 * Vercel Serverless Function — /api/analyze-card
 *
 * Accepts POST { imageBase64, mediaType } or { imageUrl }
 * Calls Claude Vision API → returns parsed TCG card details as JSON.
 *
 * Requires env var: ANTHROPIC_API_KEY
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });

  const body = req.body ?? {};
  const { imageUrl, imageBase64, mediaType = 'image/jpeg' } = body;

  if (!imageUrl && !imageBase64) {
    return res.status(400).json({ error: 'imageUrl or imageBase64 required' });
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
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: imageSource },
            {
              type: 'text',
              text: `You are a TCG card expert for One Piece, Pokemon, Dragon Ball, and Yu-Gi-Oh!.
Analyze this card image and return ONLY valid JSON — no explanation, no markdown, just the JSON object:
{
  "card_name": "exact name printed on card",
  "set_name": "full set name (e.g. 'EB-03 Heroines Edition', 'Scarlet & Violet—Stellar Crown')",
  "set_code": "short set code (e.g. 'EB-03', 'OP-15', 'SV7')",
  "card_number": "full card number as printed (e.g. 'EB03-018', 'OP15-001', '25/142')",
  "game": "one of exactly: One Piece, Pokemon, Dragon Ball, Yu-Gi-Oh!",
  "language": "one of exactly: English, Japanese",
  "condition": "one of exactly: NM, LP, MP, HP, D — default NM if no damage visible",
  "rarity": "rarity (e.g. Common, Uncommon, Rare, Super Rare, Secret Rare, Leader Rare, Special Rare)"
}`,
            },
          ],
        }],
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    return res.status(500).json({ error: `Claude API request failed: ${err.message}` });
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    console.error('[analyze-card] Anthropic error', claudeRes.status, errText);
    let detail = errText;
    try { detail = JSON.parse(errText)?.error?.message ?? errText; } catch { /* keep raw */ }
    return res.status(500).json({ error: `Claude API ${claudeRes.status}`, detail: detail.slice(0, 500) });
  }

  const data = await claudeRes.json();
  const text = (data.content?.[0]?.text ?? '').trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return res.json(parsed);
  } catch {
    return res.status(500).json({ error: 'Could not parse AI response', raw: text.slice(0, 400) });
  }
}
