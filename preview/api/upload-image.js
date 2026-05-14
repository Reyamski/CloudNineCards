/**
 * Vercel Serverless Function — /api/upload-image
 * POST { imageBase64, mediaType? }
 * Uploads to imgbb, returns { url }
 */
async function convertHeicToJpeg(base64Data) {
  const { default: convert } = await import('heic-convert');
  const inputBuffer = Buffer.from(base64Data, 'base64');
  const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.85 });
  return Buffer.from(outputBuffer).toString('base64');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const imgbbKey = process.env.VITE_IMGBB_API_KEY ?? process.env.IMGBB_API_KEY;
  if (!imgbbKey) return res.status(500).json({ error: 'IMGBB_API_KEY not configured' });

  let { imageBase64, mediaType = 'image/jpeg' } = req.body ?? {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  // HEIC detection
  const hdr = Buffer.from(imageBase64.substring(0, 20), 'base64');
  const isHeic = hdr.length >= 12
    && hdr[4] === 0x66 && hdr[5] === 0x74 && hdr[6] === 0x79 && hdr[7] === 0x70
    && ['heic','heis','hevc','hevx','heim','heix','hevm','hevs','mif1','msf1']
         .includes(hdr.slice(8, 12).toString('ascii'));
  if (isHeic || mediaType === 'image/heic' || mediaType === 'image/heif') {
    try { imageBase64 = await convertHeicToJpeg(imageBase64); } catch { /* fallthrough */ }
  }

  const body = new FormData();
  body.append('image', imageBase64);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: 'POST', body });
  const json = await r.json();
  if (!json.success) return res.status(500).json({ error: 'imgbb upload failed' });
  return res.status(200).json({ url: json.data.url });
}
