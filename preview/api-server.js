/**
 * Local dev API server — mirrors Vercel serverless functions for `npm run dev`
 * Run: node api-server.js  (port 3001)
 * Vite proxies /api/* → this server
 */
import http from 'http';
import { URL } from 'url';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env into process.env for local dev
const __dir = dirname(fileURLToPath(import.meta.url));
for (const envFile of ['.env', '.env.local']) {
  try {
    const lines = readFileSync(resolve(__dir, envFile), 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* file missing = ok */ }
}

import fetchPricesHandler from './api/fetch-prices.js';
import analyzeCardHandler from './api/analyze-card.js';
import adminAuthHandler from './api/admin-auth.js';

const PORT = 3001;

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  let handler, mockReq;

  if (url.pathname.startsWith('/api/fetch-prices')) {
    const query = Object.fromEntries(url.searchParams.entries());
    handler  = fetchPricesHandler;
    mockReq  = { query, method: req.method, url: req.url };
  } else if (url.pathname.startsWith('/api/analyze-card')) {
    const body = await readBody(req);
    handler  = analyzeCardHandler;
    mockReq  = { body, method: req.method, url: req.url };
  } else if (url.pathname.startsWith('/api/admin-auth')) {
    const body = await readBody(req);
    handler  = adminAuthHandler;
    mockReq  = { body, method: req.method, url: req.url };
  } else {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const mockRes = {
    _status: 200,
    setHeader() {},
    status(code) { this._status = code; return this; },
    end(data) { res.writeHead(this._status); res.end(data ?? ''); },
    json(data) {
      res.writeHead(this._status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(data));
    },
  };

  try {
    await handler(mockReq, mockRes);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
