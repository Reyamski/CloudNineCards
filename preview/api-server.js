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
import subscribeHandler   from './api/subscribe.js';
import waitlistHandler    from './api/waitlist.js';
import adminAuthHandler from './api/admin-auth.js';
import adminSinglesHandler   from './api/admin/singles.js';
import adminProductsHandler  from './api/admin/products.js';
import adminPreordersHandler from './api/admin/preorders.js';
import adminOrdersHandler    from './api/admin/orders.js';
import adminOrderItemsHandler from './api/admin/order-items.js';
import adminConfigHandler    from './api/admin/config.js';
import adminStockHandler     from './api/admin/stock.js';
import adminUploadHandler    from './api/admin/upload.js';
import adminRejectOrderHandler from './api/admin/reject-order.js';

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

// Read raw multipart body for /api/admin/upload — we can't JSON-parse it.
function readRawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Adapt a raw IncomingMessage so the admin/upload handler's `for await
// (const chunk of req)` loop sees the bytes. The handler reads req as an
// async iterator; passing the original req works, but we need to ensure
// `req.headers` is the same object.
function passthroughReq(req) {
  return req;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS preflight — permissive in dev, the production handlers tighten it
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  let handler, mockReq;

  // Routing — admin endpoints first so they take precedence over `admin-auth`
  const adminTableMap = {
    '/api/admin/singles':   adminSinglesHandler,
    '/api/admin/products':  adminProductsHandler,
    '/api/admin/preorders': adminPreordersHandler,
    '/api/admin/orders':    adminOrdersHandler,
    '/api/admin/reject-order': adminRejectOrderHandler,
    '/api/admin/config':    adminConfigHandler,
    '/api/admin/stock':     adminStockHandler,
  };

  if (url.pathname === '/api/admin/upload') {
    // Multipart — let the handler read req directly. Pass through Node's
    // IncomingMessage so its for-await iterator works.
    handler = adminUploadHandler;
    mockReq = passthroughReq(req);
  } else if (url.pathname === '/api/admin/order-items') {
    // GET-only — service-role read. Pass query so the handler can read order_id.
    const query = Object.fromEntries(url.searchParams.entries());
    handler = adminOrderItemsHandler;
    mockReq = { query, method: req.method, url: req.url, headers: req.headers };
  } else if (adminTableMap[url.pathname]) {
    // GET on /api/admin/orders has no body; PATCH/POST/DELETE do. readBody is
    // safe either way (returns {} on empty body).
    const body = await readBody(req);
    handler = adminTableMap[url.pathname];
    mockReq = { body, method: req.method, url: req.url, headers: req.headers };
  } else if (url.pathname.startsWith('/api/fetch-prices')) {
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
  } else if (url.pathname.startsWith('/api/subscribe')) {
    const body = await readBody(req);
    handler  = subscribeHandler;
    mockReq  = { body, method: req.method, url: req.url, headers: req.headers };
  } else if (url.pathname.startsWith('/api/waitlist')) {
    const body = await readBody(req);
    handler  = waitlistHandler;
    mockReq  = { body, method: req.method, url: req.url, headers: req.headers };
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
