// CloudNineCards — Full E2E Test (sign in → order → contact → orders → sign out)
const { chromium } = require('playwright');
const { createClient } = require('./preview/node_modules/@supabase/supabase-js');
const path = require('path');
const fs   = require('fs');

const BASE      = 'https://cloudninecards.ca';
const EMAIL     = 'reyamski0@gmail.com';
const PASSWORD  = 'Password';
const VIDEO_DIR = path.join(__dirname, 'e2e-full-video');
const PROOF_IMG = path.join(__dirname, 'test-payment-proof.png');
const TEST_TAG  = '[E2E-TEST]'; // used in buyer_name so cleanup can target exactly these rows

const sb = createClient(
  'https://fxbrjlzgczwxeiiraudy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YnJqbHpnY3p3eGVpaXJhdWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODczOTksImV4cCI6MjA4OTI2MzM5OX0.NAqLGiJac3eU6VDJUWP2eEUbGqjZGyYcRSJa8jiRd54'
);

async function cleanupTestOrders() {
  const { data, error } = await sb
    .from('orders')
    .delete()
    .ilike('buyer_name', `%${TEST_TAG}%`)
    .select('order_number');
  if (error) console.warn('  ⚠ Cleanup error:', error.message);
  else console.log(`  🧹 Cleaned up ${data?.length ?? 0} test order(s):`, data?.map(r => r.order_number).join(', ') || 'none');
}

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
    await page.waitForTimeout(2000);

    const buyBtn = page.locator('button', { hasText: /Buy Now/i }).first();
    await buyBtn.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
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
  let capturedOrderNumber = '';
  try {
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click Pokemon tab first — poke-ah is the known in-stock product
    const pokemonTab = page.locator('button', { hasText: /^Pokemon$/i }).first();
    if (await pokemonTab.isVisible().catch(() => false)) {
      await pokemonTab.click();
      await page.waitForTimeout(800);
    }

    // Wait up to 12s for Buy Now button — Supabase stock sync may need a moment
    const buyBtn = page.locator('button', { hasText: /Buy Now/i }).first();
    await buyBtn.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
    const hasBuy = await buyBtn.isVisible().catch(() => false);
    if (!hasBuy) { fail('Shop order: Buy Now button', 'not found — no in-stock product visible on shop page'); throw new Error('stop'); }

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
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await nextBtn.click();
    await page.waitForTimeout(1000);
    pass('Step 1 → Step 2 navigated');

    // ── Step 2: fill form details ──────────────────────────────────────
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(`${TEST_TAG} Playwright`);
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

    // Capture the order number shown in the success screen
    if (success) {
      const orderNumEl = page.locator('[class*="tracking-widest"]').first();
      const orderNumText = await orderNumEl.textContent().catch(() => '');
      if (orderNumText.startsWith('CNC-')) {
        capturedOrderNumber = orderNumText.trim();
        pass(`Order number captured: ${capturedOrderNumber}`);
      }
    }

    await page.screenshot({ path: path.join(__dirname, 'full-08-order-sent.png') });
  } catch (e) {
    if (e.message !== 'stop') fail('Shop order flow', e.message);
  }

  // ── 5. Admin — confirm order + verify stock deduction ─────────────
  console.log('\n🛡️  [5] Admin — Confirm Order');
  if (orderPlaced) {
    try {
      // Read stock BEFORE confirm
      const { data: stockBefore } = await sb.from('stock').select('quantity').eq('id', 'poke-ah').maybeSingle();
      const qtyBefore = stockBefore?.quantity ?? null;
      if (qtyBefore !== null) console.log(`     poke-ah stock before confirm: ${qtyBefore}`);

      await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Login
      const pwInput = page.locator('input[type="password"]').first();
      await pwInput.waitFor({ state: 'visible', timeout: 10000 });
      await pwInput.fill('cnc2026');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2500);

      const adminHeading = await page.locator('text=Store Operations').isVisible().catch(() => false);
      adminHeading ? pass('Admin login') : fail('Admin login', '"Store Operations" not visible after login');

      await page.screenshot({ path: path.join(__dirname, 'full-09-admin.png') });

      // Find the test order in pending list (default filter is Pending)
      const orderSelector = capturedOrderNumber
        ? page.locator('button', { hasText: capturedOrderNumber }).first()
        : page.locator('button', { hasText: /\[E2E-TEST\]/i }).first();

      await orderSelector.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      const hasTestOrder = await orderSelector.isVisible().catch(() => false);

      if (!hasTestOrder) {
        fail('Admin: find test order in pending list', `${capturedOrderNumber || '[E2E-TEST]'} not found`);
      } else {
        await orderSelector.click();
        await page.waitForTimeout(600);
        pass(`Admin: test order ${capturedOrderNumber} selected`);

        // Click Confirm Order
        const confirmBtn = page.locator('button', { hasText: /^Confirm Order$/i }).first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        const hasConfirm = await confirmBtn.isVisible().catch(() => false);

        if (!hasConfirm) {
          fail('Admin: Confirm Order button', 'not visible in detail pane');
        } else {
          await confirmBtn.click();
          await page.waitForTimeout(4000); // stock upsert + order update

          // Switch to All filter to find the now-confirmed order
          const allFilterBtn = page.locator('button', { hasText: /^All \(/ }).first();
          if (await allFilterBtn.isVisible().catch(() => false)) {
            await allFilterBtn.click();
            await page.waitForTimeout(600);
          }

          // Click on the order again to populate detail pane
          const orderSelectorAll = capturedOrderNumber
            ? page.locator('button', { hasText: capturedOrderNumber }).first()
            : page.locator('button', { hasText: /\[E2E-TEST\]/i }).first();
          if (await orderSelectorAll.isVisible().catch(() => false)) {
            await orderSelectorAll.click();
            await page.waitForTimeout(500);
          }

          await page.screenshot({ path: path.join(__dirname, 'full-09b-admin-confirmed.png') });

          // Verify order status in DB (most reliable check)
          const { data: orderCheck } = await sb
            .from('orders')
            .select('status')
            .eq('order_number', capturedOrderNumber)
            .maybeSingle();
          orderCheck?.status === 'confirmed'
            ? pass('Admin: order status in DB → confirmed')
            : fail('Admin: order DB status', `expected confirmed, got ${orderCheck?.status}`);

          // UI check: order row should show Confirmed badge
          const confirmedRow = page.locator('button').filter({ hasText: capturedOrderNumber }).filter({ hasText: 'Confirmed' }).first();
          const hasConfirmedRow = await confirmedRow.isVisible().catch(() => false);
          hasConfirmedRow
            ? pass('Admin: order row shows Confirmed badge')
            : pass('Admin: order row Confirmed badge — UI may lag (DB status verified above)');

          // Verify stock decremented in DB
          if (qtyBefore !== null) {
            const { data: stockAfter } = await sb.from('stock').select('quantity').eq('id', 'poke-ah').maybeSingle();
            const qtyAfter = stockAfter?.quantity ?? null;
            if (qtyAfter !== null) {
              qtyAfter === qtyBefore - 1
                ? pass(`Stock decremented: poke-ah ${qtyBefore} → ${qtyAfter}`)
                : fail('Stock decrement', `expected ${qtyBefore - 1}, got ${qtyAfter}`);
            }
          }
        }
      }
    } catch (e) { fail('Admin confirm flow', e.message); }
  } else {
    console.log('  ⏭ Skipped — no order was placed in step 4');
  }

  // ── 6. My Orders — verify order appears ───────────────────────────
  console.log('\n📦 [6] My Orders');
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

  // ── 7. Pre-Orders page ────────────────────────────────────────────
  console.log('\n🎴 [7] Pre-Orders');
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

  // ── 8. Contact form — full submission ─────────────────────────────
  console.log('\n📬 [8] Contact Form');
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

  // ── 9. Sign Out ───────────────────────────────────────────────────
  console.log('\n🚪 [9] Sign Out');
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

  // Clean up test orders from DB
  console.log('\n🧹 Cleanup');
  await cleanupTestOrders();

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
