'use strict';
/**
 * newgame-bottom-navigation-test.cjs — R-KREATOR-DOLNA-NAWIGACJA-Q1.
 *
 * Real-browser regression for the new-game wizard's lower navigation. The
 * reported failure was that selecting opponent civilizations pushed the lower
 * controls below the visible viewport. This test uses the real Vite bundle,
 * Chromium at device scale 100%, and measures the actual DOM rectangles before
 * exercising the Back/Next/Start controls.
 *
 * Run from gra/: node tools/newgame-bottom-navigation-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-newgame-bottom-navigation-test');
let OUT_HTML = '';
const EPS = 1;
const VIEWPORTS = [
  { label: 'desktop', width: 1770, height: 970 },
  { label: 'mały ekran', width: 1365, height: 768 },
  // Approximation of a 150% desktop-zoom CSS viewport on a 1770×970 display.
  { label: '150% zoom — viewport CSS', width: 1180, height: 647 },
  { label: '2K DCI', width: 2048, height: 1080 },
  { label: '4K UHD', width: 3840, height: 2160 },
];

let pass = 0;
let fail = 0;

function assert(label, condition) {
  if (condition) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}`);
  }
}

function buildBundle() {
  console.log('[newgame-bottom-navigation-test] budowanie bundla (vite build)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[newgame-bottom-navigation-test] build OK.');
}

async function serveBundleOverHttp() {
  const htmlPath = path.join(OUT_DIR, 'index.html');
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (pathname === '/favicon.ico') {
      response.writeHead(204).end();
      return;
    }
    if (pathname !== '/') {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(htmlPath).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  OUT_HTML = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

function browserCandidates() {
  const explicit = process.env.CIV_CHROME_PATH || process.env.CHROME_PATH;
  const candidates = explicit ? [explicit] : [];
  candidates.push('/usr/bin/chromium');
  const roots = [];
  const playwrightRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (playwrightRoot && playwrightRoot !== '0') roots.push(playwrightRoot);
  roots.push(path.join(os.homedir(), '.cache', 'ms-playwright'));
  roots.push('/opt/pw-browsers');

  for (const root of roots) {
    let entries;
    try { entries = fs.readdirSync(root).sort().reverse(); } catch (_) { continue; }
    for (const entry of entries) {
      if (!entry.startsWith('chromium')) continue;
      for (const relative of [
        path.join('chrome-linux64', 'chrome'),
        path.join('chrome-linux', 'chrome'),
      ]) {
        candidates.push(path.join(root, entry, relative));
      }
    }
  }
  return [...new Set(candidates)].filter((candidate) => fs.existsSync(candidate));
}

async function launchBrowser(chromium) {
  let defaultError;
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    defaultError = error;
  }
  for (const executablePath of browserCandidates()) {
    try {
      console.log('[newgame-bottom-navigation-test] fallback Chromium:', executablePath);
      return await chromium.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
      });
    } catch (_) {
      // Try the next verified executable, retaining the default error for context.
    }
  }
  throw new Error('Nie udało się uruchomić Chromium. Domyślny błąd: ' + defaultError.message);
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gotoWizard(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 60000 });
  await wait(400);
  await page.locator('.civ-menu .mbtn.primary').click();
  await page.waitForSelector('.civ-newgame .cta-hero', { timeout: 15000 });
  await wait(120);
}

async function readState(page, selector) {
  return page.evaluate((targetSelector) => {
    const node = document.querySelector(targetSelector);
    const root = document.querySelector('.civ-newgame');
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      selector: targetSelector,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      display: style.display,
      visibility: style.visibility,
      disabled: !!node.disabled,
      fullyInViewport: rect.width > 0 && rect.height > 0
        && rect.left >= -1 && rect.top >= -1
        && rect.right <= window.innerWidth + 1
        && rect.bottom <= window.innerHeight + 1,
      hitByCenter: hit === node || node.contains(hit),
      rootScrollTop: root ? root.scrollTop : null,
      rootScrollHeight: root ? root.scrollHeight : null,
      rootClientHeight: root ? root.clientHeight : null,
      devicePixelRatio: window.devicePixelRatio,
    };
  }, selector);
}

function printState(label, state) {
  console.log('  MEASURE ' + label + ': ' + JSON.stringify(state));
}

async function assertUsable(page, selector, label) {
  const state = await readState(page, selector);
  printState(label, state);
  assert(`${label}: istnieje, ma rozmiar, jest w całości w viewport`,
    !!state && state.display !== 'none' && state.visibility !== 'hidden'
      && !state.disabled && state.fullyInViewport);
  assert(`${label}: środek nie jest zasłonięty i trafia w element`, !!state && state.hitByCenter);
  return state;
}

async function assertStepLabel(page, expected, label) {
  const actual = await page.locator('.civ-newgame .stepbar .si.active .si-l').textContent();
  assert(`${label}: aktywny krok = ${expected}`, actual?.trim() === expected);
}

async function exerciseViewport(browser, viewport) {
  console.log(`\n== ${viewport.label} (${viewport.width}x${viewport.height}, deviceScaleFactor=1) ==`);
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push('[pageerror] ' + error.message));

  try {
    await gotoWizard(page);
    assert(`${viewport.label}: devicePixelRatio = 1 (skala 100%)`,
      await page.evaluate(() => window.devicePixelRatio === 1));

    await assertStepLabel(page, 'Intro', `${viewport.label}/intro`);
    await assertUsable(page, '.civ-newgame .cta-hero', `${viewport.label}/intro CTA konfiguracji`);
    assert(`${viewport.label}/intro: dolna nawigacja nie pojawia się przed krokiem 2`,
      await page.locator('.civ-newgame .nav').count() === 0);

    await page.locator('.civ-newgame .cta-hero').click();
    await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10000 });
    await wait(100);
    await assertStepLabel(page, 'Epoka', `${viewport.label}/epoka`);
    await assertUsable(page, '.civ-newgame .nav .nb.back', `${viewport.label}/epoka Wstecz`);
    await assertUsable(page, '.civ-newgame .nav .nb.next', `${viewport.label}/epoka Dalej`);

    // Back on step 2 must return to the intro, then the normal forward path.
    await page.locator('.civ-newgame .nav .nb.back').click();
    await page.waitForSelector('.civ-newgame .cta-hero', { timeout: 10000 });
    assert(`${viewport.label}: Wstecz z epoki wraca do Intro`,
      await page.locator('.civ-newgame .stepbar .si.active .si-l').textContent() === 'Intro');
    await page.locator('.civ-newgame .cta-hero').click();
    await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10000 });
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .civ-layout', { timeout: 10000 });
    await wait(100);

    await assertStepLabel(page, 'Cywilizacja', `${viewport.label}/cywilizacja`);
    await assertUsable(page, '.civ-newgame .nav .nb.back', `${viewport.label}/cywilizacja Wstecz`);
    await assertUsable(page, '.civ-newgame .nav .nb.next', `${viewport.label}/cywilizacja Dalej`);

    const profileToggle = page.locator('.civ-newgame .civ-profile-toggle');
    assert(`${viewport.label}/cywilizacja: uchwyt zwijania profilu jest dostępny`, await profileToggle.count() === 1);
    const detailPanel = page.locator('.civ-newgame #civ-profile-detail-panel');
    assert(`${viewport.label}/cywilizacja: parametry są domyślnie zwinięte`,
      await profileToggle.getAttribute('aria-expanded') === 'false' && !(await detailPanel.isVisible()));
    assert(`${viewport.label}/cywilizacja: sekcja ma nazwę Parametry cywilizacji`,
      (await detailPanel.locator('.dlbl').textContent())?.trim() === 'Parametry cywilizacji');
    await profileToggle.click();
    assert(`${viewport.label}/cywilizacja: uchwyt rozwija szczegóły`,
      await profileToggle.getAttribute('aria-expanded') === 'true' && await detailPanel.isVisible());
    await profileToggle.click();
    assert(`${viewport.label}/cywilizacja: uchwyt ponownie zwija profil`,
      await profileToggle.getAttribute('aria-expanded') === 'false' && !(await detailPanel.isVisible()));
    const collapsedNext = await assertUsable(page, '.civ-newgame .nav .nb.next', `${viewport.label}/cywilizacja Dalej po zwinięciu`);
    assert(`${viewport.label}/cywilizacja: Dalej mieści się w ekranie bez przewijania głównego kontenera`,
      !!collapsedNext && collapsedNext.rootScrollTop === 0);

    // Back on step 3 must return to the epoch without losing the route.
    await page.locator('.civ-newgame .nav .nb.back').click();
    await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10000 });
    assert(`${viewport.label}: Wstecz z cywilizacji wraca do Epoki`,
      await page.locator('.civ-newgame .stepbar .si.active .si-l').textContent() === 'Epoka');
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .civ-layout', { timeout: 10000 });
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .sett-layout', { timeout: 10000 });
    await wait(120);

    await assertStepLabel(page, 'Ustawienia', `${viewport.label}/ustawienia`);
    await assertUsable(page, '.civ-newgame .nav .nb.back', `${viewport.label}/ustawienia Wstecz`);
    assert(`${viewport.label}/ustawienia: końcowa akcja znajduje się w stałej nawigacji`,
      await page.locator('.civ-newgame .nav .nb.next').count() === 1
        && (await page.locator('.civ-newgame .nav .nb.next').textContent()).includes('Rozpocznij grę'));
    assert(`${viewport.label}/ustawienia: nie ma duplikatu Start w przewijanej treści`,
      await page.locator('.civ-newgame .content .sett-actions .start').count() === 0);

    const aiCards = page.locator('.civ-newgame .ai-civ-grid .card');
    const candidateCount = await aiCards.count();
    assert(`${viewport.label}/ustawienia: co najmniej 5 kandydatów AI do scenariusza`, candidateCount >= 5);
    for (let i = 0; i < Math.min(5, candidateCount); i++) {
      await page.locator('.civ-newgame .ai-civ-grid .card').nth(i).click();
      await wait(50);
    }
    await wait(120);
    const selectedCount = await page.locator('.civ-newgame .ai-civ-grid .card.sel').count();
    assert(`${viewport.label}/ustawienia: scenariusz 5/5 faktycznie zaznaczył 5 cywilizacji`, selectedCount === 5);

    const navState = await assertUsable(page, '.civ-newgame .nav', `${viewport.label}/ustawienia dolna nawigacja`);
    const startState = await readState(page, '.civ-newgame .nav .nb.next');
    printState(`${viewport.label}/ustawienia Start`, startState);
    const advancedReachable = await page.evaluate(() => {
      const content = document.querySelector('.civ-newgame .content');
      const advanced = document.querySelector('.civ-newgame .sett-actions .btn-adv');
      if (!(content instanceof HTMLElement) || !(advanced instanceof HTMLElement)) return false;
      content.scrollTop = content.scrollHeight;
      const rect = advanced.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0
        && rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    assert(`${viewport.label}/ustawienia: Zaawansowane jest osiągalne w wewnętrznym przewijaniu treści`,
      advancedReachable);
    printState(`${viewport.label}/ustawienia root overflow`, navState);
    assert(`${viewport.label}/ustawienia: dolna nawigacja jest stale widoczna bez przewijania root`,
      !!navState && navState.rootScrollTop === 0
        && navState.rootScrollHeight <= navState.rootClientHeight + EPS);
    const startReachable = await page.evaluate(() => {
      const content = document.querySelector('.civ-newgame .content');
      const start = document.querySelector('.civ-newgame .nav .nb.next');
      if (!(content instanceof HTMLElement) || !(start instanceof HTMLElement)) return false;
      content.scrollTop = content.scrollHeight;
      const rect = start.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0
        && rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    assert(`${viewport.label}/ustawienia: Start pozostaje widoczny bez przewijania treści`,
      !!startState && startState.fullyInViewport && startState.rootScrollTop === 0 && startReachable);

    // Mutation proof: if the lower navigation is hidden, the same viewport
    // oracle must detect it. Restore the live DOM before continuing the flow.
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = '__newgame_bottom_navigation_mutation__';
      style.textContent = '.civ-newgame .nav{display:none !important;}';
      document.head.appendChild(style);
    });
    const brokenNavState = await readState(page, '.civ-newgame .nav');
    assert(`${viewport.label}/mutacja: ukrycie .nav jest wykrywane jako niewidoczne`,
      !!brokenNavState && !brokenNavState.fullyInViewport);
    await page.evaluate(() => {
      document.getElementById('__newgame_bottom_navigation_mutation__')?.remove();
    });
    const restoredNavState = await readState(page, '.civ-newgame .nav');
    assert(`${viewport.label}/mutacja: po usunięciu mutacji .nav wraca do viewport`,
      !!restoredNavState && restoredNavState.fullyInViewport);

    // Click Back again after the crowded 5/5 state and prove the wizard returns.
    await page.locator('.civ-newgame .nav .nb.back').click();
    await page.waitForSelector('.civ-newgame .civ-layout', { timeout: 10000 });
    assert(`${viewport.label}: dolna nawigacja Wstecz działa po scenariuszu 5/5`,
      await page.locator('.civ-newgame .stepbar .si.active .si-l').textContent() === 'Cywilizacja');

    // Re-enter settings and click Start. The real menu callback hides the wizard
    // synchronously, so this checks the active click path without waiting for map generation.
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .sett-layout', { timeout: 10000 });
    await page.locator('.civ-newgame .seat2-toggle-btn').click();
    assert(`${viewport.label}/ustawienia hot-seat: akcja stopki zmienia się na Dalej`,
      (await page.locator('.civ-newgame .nav .nb.next').textContent()).includes('Dalej'));
    await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForSelector('.civ-newgame .seat2-dist', { timeout: 10000 });
    assert(`${viewport.label}/fotel 2: Start znajduje się w prawej nawigacji`,
      (await page.locator('.civ-newgame .nav .nb.next').textContent()).includes('Rozpocznij grę')
        && await page.locator('.civ-newgame .content .sett-actions .start').count() === 0);
    const seat2Toggle = page.locator('.civ-newgame .civ-profile-toggle');
    const seat2Detail = page.locator('.civ-newgame .detail');
    assert(`${viewport.label}/fotel 2: parametry domyślnie zwinięte`,
      await seat2Toggle.getAttribute('aria-expanded') === 'false' && !(await seat2Detail.isVisible()));
    await seat2Toggle.click();
    assert(`${viewport.label}/fotel 2: parametry można rozwinąć`,
      await seat2Toggle.getAttribute('aria-expanded') === 'true' && await seat2Detail.isVisible());
    await page.locator('.civ-newgame .nav .nb.next').click();
    await wait(120);
    const rootAfterStart = await page.evaluate(() => {
      const root = document.querySelector('.civ-newgame');
      return root ? { display: root.style.display, present: true } : { display: null, present: false };
    });
    assert(`${viewport.label}: kliknięcie Start uruchamia ścieżkę startu i ukrywa kreator`,
      rootAfterStart.present && rootAfterStart.display === 'none');

    assert(`${viewport.label}: zero console.error/pageerror przed i podczas przejścia Start`, consoleErrors.length === 0);
    if (consoleErrors.length > 0) console.error('  console:', consoleErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    throw new Error('playwright nie znaleziony; uruchom test z gra/ po instalacji zależności: ' + error.message);
  }

  buildBundle();
  const server = await serveBundleOverHttp();
  let browser = null;
  try {
    browser = await launchBrowser(chromium);
    for (const viewport of VIEWPORTS) await exerciseViewport(browser, viewport);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* cleanup best effort */ }
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('[newgame-bottom-navigation-test] błąd:', error);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* cleanup best effort */ }
  process.exit(1);
});
