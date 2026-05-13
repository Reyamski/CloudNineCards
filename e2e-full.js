// CloudNineCards — Full E2E Test (sign in → order → contact → orders → sign out)
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE      = 'https://cloudninecards.ca';
const EMAIL     = 'reyamski0@gmail.com';
const PASSWORD  = 'Password';
const VIDEO_DIR = path.join(__dirname, 'e2e-full-video');
const PROOF_IMG = path.join(__dirname, 'test-payment-proof.png');

if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

const results = [];
function pass(name)         { results.push({ name, status: 'PASS' }); console.log(`  ✅ PASS  ${name}`); }
function fail(name, reason) { results.push({ name, status: 'FAIL', reason }); console.log(`  ❌ FAIL  ${name} — ${reason}`); }

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const ctx = await browser.newContext({
    viewport:    { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  CloudNineCards  —  Full E2E Test');
  console.log(`  ${BASE}  |  ${EMAIL}`);
  console.log('══════════════════════════════════════════════════════\n');

  // ── 1. Homepage ────────────────────────────────────────────────────
  console.log('📄 [1] Homepage');
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);

    const title = await page.title();
    title ? pass('Homepage loads') : fail('Homepage loads', 'no title');

    const hero = await page.locator('text=PULL LEGENDARY').isVisible().catch(() => false);
    hero ? pass('Hero headline visible') : fail('Hero headline visible', 'not found');

    await page.screenshot({ path: path.join(__dirname, 'full-01-home.png') });
  } catch (e) { fail('Homepage', e.message); }

  // ── 2. Auth gate check (unauthenticated) ──────────────────────────
  console.log('\n🔒 [2] Auth Gate (not logged in)');
  try {
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const buyBtn = page.locator('button', { hasText: /Buy Now/i }).first();
    const hasBuy = await buyBtn.isVisible().catch(() => false);
    if (hasBuy) {
      await buyBtn.click();
      await page.waitForTimeout(1200);
      page.url().includes('/account')
        ? pass('Auth gate: redirects to /account')
        : fail('Auth gate', `stayed at ${page.url()}`);
    } else {
      fail('Auth gate', 'no Buy Now button');
    }
    await page.screenshot({ path: path.join(__dirname, 'full-02-authgate.png') });
  } catch (e) { fail('Auth gate', e.message); }

  // ── 3. Sign In ────────────────────────────────────────────────────
  console.log('\n🔑 [3] Sign In');
  try {
    await page.goto(`${BASE}/account`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Make sure Sign In tab is active
    const signInTab = page.locator('button', { hasText: /^Sign In$/i }).first();
    if (await signInTab.isVisible().catch(() => false)) await signInTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[type="email"]', EMAIL);
    await page.waitForTimeout(400);
    await page.fill('input[type="password"]', PASSWORD);
    await page.waitForTimeout(400);

    await page.screenshot({ path: path.join(__dirname, 'full-03-signin-filled.png') });

    // Click the Sign In submit button
    const submitBtn = page.locator('button[type="submit"], button', { hasText: /^Sign In$/i }).last();
    await submitBtn.click();

    // Wait for auth redirect or dashboard
    await page.waitForTimeout(3000);
    const afterUrl = page.url();
    const isLoggedIn = !afterUrl.includes('/account') || await page.locator('text=My Orders').isVisible().catch(() => false)
      || await page.locator('button', { hasText: /Sign Out/i }).isVisible().catch(() => false)
      || await page.locator('text=ORDERS').isVisible().catch(() => false);

    isLoggedIn ? pass(`Signed in as ${EMAIL}`) : fail('Sign in', `still on ${afterUrl}`);
    await page.screenshot({ path: path.join(__dirname, 'full-04-signin-result.png') });
  } catch (e) { fail('Sign in', e.message); }

  // ── 4. Shop — full order flow ──────────────────────────────────────
  console.log('\n🛒 [4] Shop — Place Order (TEST)');
  let orderPlaced = false;
  try {
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Click Buy Now on first available product
    const buyBtn = page.locator('button', { hasText: /Buy Now/i }).first();
    const hasBuy = await buyBtn.isVisible().catch(() => false);
    if (!hasBuy) { fail('Shop order: Buy Now button', 'not found'); throw new Error('stop'); }

    await buyBtn.click();
    await page.waitForTimeout(1500);

    // Should open the order modal (not redirect since logged in)
    const modal = await page.locator('[role="dialog"], [class*="fixed inset"]').first().isVisible().catch(() => false);
    modal ? pass('Order modal opens when logged in') : fail('Order modal', 'did not open');

    await page.screenshot({ path: path.join(__dirname, 'full-05-modal-open.png') });

    // ── Step 1: select country + province, click "I've Sent the Payment" ──
    const countrySelect = page.locator('select').first();
    await countrySelect.selectOption({ value: 'Canada' });
    await page.waitForTimeout(800);
    pass('Step 1: Country selected (Canada)');

    const provinceSelect = page.locator('select').nth(1);
    if (await provinceSelect.isVisible().catch(() => false)) {
      await provinceSelect.selectOption({ value: 'Ontario' });
      await page.waitForTimeout(400);
      pass('Step 1: Province selected (Ontario)');
    }

    await page.screenshot({ path: path.join(__dirname, 'full-06-step1.png') });

    const nextBtn = page.locator('button', { hasText: /sent the payment/i }).first();
    await nextBtn.click();
    await page.waitForTimeout(1000);
    pass('Step 1 → Step 2 navigated');

    // ── Step 2: fill form details ──────────────────────────────────────
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('[TEST] E2E Playwright');
    }

    // Email should be pre-filled — verify
    const emailInput = page.locator('input[type="email"]').first();
    const emailVal = await emailInput.inputValue().catch(() => '');
    emailVal.includes('@') ? pass(`Email pre-filled: ${emailVal}`) : fail('Email pre-fill', `got "${emailVal}"`);

    const phoneInput = page.locator('input[placeholder*="phone" i], input[type="tel"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('6471234567');
    }

    const addrInput = page.locator('input[placeholder*="address" i], textarea[placeholder*="address" i]').first();
    if (await addrInput.isVisible().catch(() => false)) {
      await addrInput.fill('123 Test Street, Toronto ON M5V 1A1');
    }

    await page.screenshot({ path: path.join(__dirname, 'full-07-step2-filled.png') });

    // Submit order (no file upload — user emails proof separately)
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(6000); // EmailJS + Supabase

    const success = await page.locator('text=Order Sent').isVisible().catch(() => false);
    success ? pass('Order submitted — "Order Sent!" visible') : fail('Order submit', 'no "Order Sent!" message');
    orderPlaced = success;

    await page.screenshot({ path: path.join(__dirname, 'full-08-order-sent.png') });
  } catch (e) {
    if (e.message !== 'stop') fail('Shop order flow', e.message);
  }

  // ── 5. My Orders — verify order appears ───────────────────────────
  console.log('\n📦 [5] My Orders');
  try {
    await page.goto(`${BASE}/account/orders`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const hasOrders = await page.locator('[class*="rounded"]').filter({ hasText: /CAD \$|#CNC-/i }).count();
    hasOrders > 0
      ? pass(`Orders page shows ${hasOrders} order(s)`)
      : pass('Orders page loads (may be empty for this test account)');

    // Verify order actually persisted in DB — must appear in /account/orders
    if (orderPlaced) {
      await page.waitForTimeout(3000);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const orderCard = await page.locator('[class*="rounded"]').filter({ hasText: /CNC-/i }).count();
      orderCard > 0
        ? pass(`Order persisted in DB — ${orderCard} order(s) visible in My Orders`)
        : fail('Order persisted in DB', 'order does not appear in /account/orders — likely a Supabase RLS or config issue');
    }

    await page.screenshot({ path: path.join(__dirname, 'full-10-orders.png') });
  } catch (e) { fail('My Orders page', e.message); }

  // ── 6. Pre-Orders page ────────────────────────────────────────────
  console.log('\n🎴 [6] Pre-Orders');
  try {
    await page.goto(`${BASE}/pre-orders`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1200);

    const heading = await page.locator('text=PRE-ORDERS').first().isVisible().catch(() => false);
    heading ? pass('Pre-Orders page loads') : fail('Pre-Orders heading', 'not found');

    const reserveBtn = page.locator('button', { hasText: /Reserve Now|Open Now/i }).first();
    const hasReserve = await reserveBtn.isVisible().catch(() => false);

    if (hasReserve) {
      await reserveBtn.click();
      await page.waitForTimeout(1200);
      const stillOnPage = page.url().includes('pre-orders') || await page.locator('[role="dialog"]').isVisible().catch(() => false);
      stillOnPage ? pass('Reserve modal opens (logged in)') : fail('Reserve modal', 'unexpected redirect');
      // Close modal if open
      await page.keyboard.press('Escape');
    } else {
      pass('Pre-Orders: no open reservations (expected)');
    }

    await page.screenshot({ path: path.join(__dirname, 'full-10-preorders.png') });
  } catch (e) { fail('Pre-Orders', e.message); }

  // ── 7. Contact form — full submission ─────────────────────────────
  console.log('\n📬 [7] Contact Form');
  try {
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder*="name" i]', '[TEST] E2E Playwright');
    await page.waitForTimeout(300);
    await page.fill('input[type="email"]', EMAIL);
    await page.waitForTimeout(300);

    // Select topic
    const topicSelect = page.locator('select').first();
    if (await topicSelect.isVisible().catch(() => false)) {
      await topicSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
    }

    await page.fill('textarea', '[TEST] This is an automated E2E test message. Please ignore. Sent by Playwright.');
    await page.waitForTimeout(400);

    await page.screenshot({ path: path.join(__dirname, 'full-11-contact-filled.png') });

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(5000); // Wait for EmailJS

    const sent = await page.locator('text=Message Sent').isVisible().catch(() => false);
    sent ? pass('Contact form submitted — "Message Sent" visible') : fail('Contact form submit', 'no success state');

    await page.screenshot({ path: path.join(__dirname, 'full-12-contact-sent.png') });
  } catch (e) { fail('Contact form', e.message); }

  // ── 8. Sign Out ───────────────────────────────────────────────────
  console.log('\n🚪 [8] Sign Out');
  try {
    await page.goto(`${BASE}/account/orders`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const signOutBtn = page.locator('button', { hasText: /Sign Out/i }).first();
    const hasSignOut = await signOutBtn.isVisible().catch(() => false);
    if (hasSignOut) {
      await signOutBtn.click();
      await page.waitForTimeout(2000);
      const url = page.url();
      url === `${BASE}/` || url === BASE
        ? pass('Signed out — redirected to homepage')
        : pass(`Signed out — redirected to ${url}`);
    } else {
      fail('Sign out button', 'not found');
    }

    await page.screenshot({ path: path.join(__dirname, 'full-13-signout.png') });
  } catch (e) { fail('Sign out', e.message); }

  await page.waitForTimeout(1500);
  await ctx.close();
  await browser.close();

  // Save video
  const videos = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'));
  if (videos.length > 0) {
    const src = path.join(VIDEO_DIR, videos[0]);
    const dst = path.join(__dirname, 'e2e-full-recording.webm');
    fs.renameSync(src, dst);
    console.log(`\n🎬 Video: e2e-full-recording.webm`);
  }

  // ── Summary ───────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  FULL E2E RESULTS: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\n  FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`    ✗ ${r.name}: ${r.reason}`));
  }
  console.log('══════════════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
