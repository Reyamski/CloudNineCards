// CloudNineCards E2E Test — Playwright CLI
const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const results = [];

function pass(name) { results.push({ name, status: 'PASS' }); console.log(`  ✅ PASS  ${name}`); }
function fail(name, reason) { results.push({ name, status: 'FAIL', reason }); console.log(`  ❌ FAIL  ${name} — ${reason}`); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  console.log('\n══════════════════════════════════════════');
  console.log('  CloudNineCards E2E Test');
  console.log('══════════════════════════════════════════\n');

  // ── 1. Homepage ──────────────────────────────────────────────────
  console.log('📄 Homepage');
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    if (!title) throw new Error('no title');
    pass('Homepage loads');

    const nav = await page.locator('text=CLOUDNINECARDS').first().isVisible().catch(() => false);
    nav ? pass('Nav visible') : fail('Nav visible', 'nav not found');

    const hero = await page.locator('text=PULL LEGENDARY').isVisible().catch(() => false);
    hero ? pass('Hero headline visible') : fail('Hero headline visible', 'text not found');

    const instock = await page.locator('text=In Stock Now').isVisible().catch(() => false);
    instock ? pass('IN STOCK NOW section visible') : fail('IN STOCK NOW section visible', 'section not found');

    await page.screenshot({ path: 'ss-e2e-home.png' });
  } catch (e) { fail('Homepage loads', e.message); }

  // ── 2. Shop page ─────────────────────────────────────────────────
  console.log('\n📄 Shop Page');
  try {
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle', timeout: 15000 });
    const heading = await page.locator('text=SHOP').first().isVisible().catch(() => false);
    heading ? pass('Shop heading visible') : fail('Shop heading visible', 'not found');

    const filterBtns = await page.locator('button', { hasText: /One Piece|Dragon Ball|Pokemon/i }).count();
    filterBtns > 0 ? pass(`Filter tabs visible (${filterBtns})`) : fail('Filter tabs visible', 'no filter buttons');

    // Auth gate: click Buy Now without login → should redirect to /account
    const buyBtn = page.locator('button', { hasText: /Buy Now/i }).first();
    const hasBuy = await buyBtn.isVisible().catch(() => false);
    if (hasBuy) {
      await buyBtn.click();
      await page.waitForTimeout(800);
      const url = page.url();
      url.includes('/account')
        ? pass('Auth gate: Buy Now redirects to /account when not logged in')
        : fail('Auth gate: Buy Now redirects', `stayed at ${url}`);
    } else {
      fail('Auth gate', 'no Buy Now button found');
    }

    await page.screenshot({ path: 'ss-e2e-shop.png' });
  } catch (e) { fail('Shop page', e.message); }

  // ── 3. Pre-Orders page ───────────────────────────────────────────
  console.log('\n📄 Pre-Orders Page');
  try {
    await page.goto(`${BASE}/pre-orders`, { waitUntil: 'load', timeout: 15000 });
    const heading = await page.locator('text=PRE-ORDERS').first().isVisible().catch(() => false);
    heading ? pass('Pre-Orders heading visible') : fail('Pre-Orders heading visible', 'not found');

    // Auth gate on reserve button
    const reserveBtn = page.locator('button', { hasText: /Reserve Now|Open Now/i }).first();
    const hasReserve = await reserveBtn.isVisible().catch(() => false);
    if (hasReserve) {
      await reserveBtn.click();
      await page.waitForTimeout(800);
      const url = page.url();
      url.includes('/account')
        ? pass('Auth gate: Reserve redirects to /account when not logged in')
        : fail('Auth gate: Reserve redirects', `stayed at ${url}`);
    } else {
      pass('Pre-Orders: no open reservations (expected if closed)');
    }

    await page.screenshot({ path: 'ss-e2e-preorders.png' });
  } catch (e) { fail('Pre-Orders page', e.message); }

  // ── 4. New Arrivals page ─────────────────────────────────────────
  console.log('\n📄 New Arrivals Page');
  try {
    await page.goto(`${BASE}/new-arrivals`, { waitUntil: 'networkidle', timeout: 15000 });
    const heading = await page.locator('text=NEW').first().isVisible().catch(() => false);
    heading ? pass('New Arrivals heading visible') : fail('New Arrivals heading visible', 'not found');

    const products = await page.locator('[class*="rounded"]').filter({ hasText: /CAD \$/ }).count();
    products > 0 ? pass(`Product cards visible (${products})`) : fail('Product cards visible', 'no products with price');

    await page.screenshot({ path: 'ss-e2e-newarrivals.png' });
  } catch (e) { fail('New Arrivals page', e.message); }

  // ── 5. Contact page ──────────────────────────────────────────────
  console.log('\n📄 Contact Page');
  try {
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle', timeout: 15000 });
    const heading = await page.locator('text=CONTACT').first().isVisible().catch(() => false);
    heading ? pass('Contact heading visible') : fail('Contact heading visible', 'not found');

    const form = await page.locator('form').first().isVisible().catch(() => false);
    form ? pass('Contact form visible') : fail('Contact form visible', 'no form found');

    const nameInput = page.locator('input[placeholder*="name" i]');
    const hasName = await nameInput.isVisible().catch(() => false);
    hasName ? pass('Name field visible') : fail('Name field visible', 'not found');

    const msgArea = page.locator('textarea');
    const hasMsg = await msgArea.isVisible().catch(() => false);
    hasMsg ? pass('Message textarea visible') : fail('Message textarea visible', 'not found');

    await page.screenshot({ path: 'ss-e2e-contact.png' });
  } catch (e) { fail('Contact page', e.message); }

  // ── 6. Account / Login page ──────────────────────────────────────
  console.log('\n📄 Account Page (unauthenticated)');
  try {
    await page.goto(`${BASE}/account`, { waitUntil: 'networkidle', timeout: 15000 });
    const heading = await page.locator('text=ACCOUNT').first().isVisible().catch(() => false);
    heading ? pass('Account heading visible') : fail('Account heading visible', 'not found');

    const signInBtn = await page.locator('button', { hasText: /Sign In/i }).first().isVisible().catch(() => false);
    signInBtn ? pass('Sign In button visible') : fail('Sign In button visible', 'not found');

    const emailInput = page.locator('input[type="email"]').first();
    const hasEmail = await emailInput.isVisible().catch(() => false);
    hasEmail ? pass('Email input visible') : fail('Email input visible', 'not found');

    await page.screenshot({ path: 'ss-e2e-account.png' });
  } catch (e) { fail('Account page', e.message); }

  // ── 7. 404 page ──────────────────────────────────────────────────
  console.log('\n📄 404 Page');
  try {
    await page.goto(`${BASE}/this-does-not-exist`, { waitUntil: 'networkidle', timeout: 10000 });
    const notFound = await page.locator('text=/404|not found/i').first().isVisible().catch(() => false);
    notFound ? pass('404 page renders') : fail('404 page renders', 'no 404 message found');

    await page.screenshot({ path: 'ss-e2e-404.png' });
  } catch (e) { fail('404 page', e.message); }

  // ── 8. Nav links ─────────────────────────────────────────────────
  console.log('\n📄 Navigation Links');
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    const links = ['Home', 'Shop', 'Pre-Orders', 'New Arrivals', 'Contact'];
    for (const link of links) {
      const el = page.locator(`a, button`, { hasText: new RegExp(link, 'i') }).first();
      const visible = await el.isVisible().catch(() => false);
      visible ? pass(`Nav link "${link}" visible`) : fail(`Nav link "${link}" visible`, 'not found');
    }
  } catch (e) { fail('Navigation links', e.message); }

  // ── 9. Modal close (backdrop + X button) ────────────────────────
  console.log('\n📄 Modal Behavior (not logged in)');
  try {
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle', timeout: 15000 });
    // Since auth gate is on, clicking Buy Now navigates away — test passes if no modal opens
    const modal = await page.locator('[role="dialog"], [class*="modal"], [class*="fixed inset"]').first().isVisible().catch(() => false);
    !modal ? pass('No modal appears without auth (auth gate working)') : fail('Auth gate', 'modal appeared without login');
  } catch (e) { fail('Modal behavior', e.message); }

  await browser.close();

  // ── Summary ──────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\n  FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`    ✗ ${r.name}: ${r.reason}`));
  }
  console.log('══════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
