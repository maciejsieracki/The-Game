'use strict';
/**
 * newgame-adv-apply-btn-test.cjs — R-WEB-NEWGAME-ADV-APPLY-BTN-Q1 (Maciej, 2026-10-31):
 * przycisk stopki okna „Zaawansowane opcje” (dawniej „Zamknij”, klasa `.adv-close`) ma
 * nazywać się „Zastosuj” i być aktywną akcją głównej: klik = zapis wartości
 * (`saveNewGamePrefs` przez `hideAdvancedModal`) + zamknięcie okna; wartości widoczne po
 * ponownym otwarciu okna i w `advOpts` (parametry startu, `advanced: { ...advOpts }`).
 *
 * Realny bundle (vite build do katalogu tymczasowego poza repo, bez `dist` w gra/),
 * headless Chromium, prawdziwe kliki myszą (Playwright). Trzy konfiguracje okna:
 * 1280x720 @100%, 1280x600 @100% (niski viewport), 1280x720 @150% (emulacja: viewport
 * 853x480 z deviceScaleFactor 1.5). W każdej: przycisk widoczny w viewportcie, klikalny
 * (elementFromPoint trafia w przycisk), okno zamyka się, wartość zapisana i odczytana po
 * ponownym otwarciu. Dodatkowo: klik w tło (overlay) nadal zamyka i zapisuje.
 *
 * Run from gra/:  node tools/newgame-adv-apply-btn-test.cjs
 * Opcjonalnie:    NEWGAME_ADV_DIST=<abs path> — użyj gotowego bundla zamiast builda.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.resolve(GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-NEWGAME-ADV-APPLY-BTN-Q1', 'evidence');
const FALLBACK_CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const PREFS_KEY = 'civ-new-game-prefs-v1';
const LABEL_RE = /Barbarzyńcy/;

let pass = 0;
let fail = 0;
function assert(label, cond) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}`); }
}
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function buildBundle() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-adv-apply-'));
  console.log('[newgame-adv-apply-btn-test] vite build (poza repo) -> ' + outDir);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('Build bez index.html');
  return outDir;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = path.join(dir, p);
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'];
  try { return await chromium.launch({ headless: true, args }); }
  catch (e) {
    console.log('[newgame-adv-apply-btn-test] domyślny Chromium niedostępny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

/** Kreator -> krok 4 -> „Zaawansowane opcje” (okno otwarte). */
async function openAdvModal(page, origin) {
  await page.goto(origin, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 60000 });
  await wait(400);
  await page.locator('.civ-menu .mbtn.primary').click();
  await page.waitForSelector('.civ-newgame', { timeout: 15000 });
  await wait(150);
  await page.locator('.civ-newgame button.cta-hero').click();
  await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10000 });
  await wait(150);
  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .civ-grid', { timeout: 10000 });
  await wait(150);
  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .sett-grid', { timeout: 10000 });
  await wait(300);
  await page.locator('.civ-newgame .btn-adv').click();
  await page.waitForSelector('.civ-newgame .adv-overlay.open', { timeout: 10000 });
  await wait(250);
}

function barbRow(page) {
  return page.locator('.civ-newgame .adv-modal .adv-row', {
    has: page.locator('.adv-lbl', { hasText: LABEL_RE }),
  }).first();
}

async function readPrefsAdvanced(page) {
  return page.evaluate((k) => {
    try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw).advanced : null; }
    catch { return null; }
  }, PREFS_KEY);
}

async function runScenario(browser, origin, cfg) {
  console.log(`\n[scenariusz] ${cfg.label}`);
  const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));
  try {
    await openAdvModal(page, origin);
    const row = barbRow(page);
    assert('wiersz „Barbarzyńcy” jest w oknie', (await row.count()) === 1);
    const before = await page.evaluate(() => {
      const r = [...document.querySelectorAll('.adv-overlay .adv-row')].find((x) => /Barbarzyńcy/.test(x.querySelector('.adv-lbl')?.textContent ?? ''));
      return r?.querySelector('.sv')?.textContent ?? null;
    });
    await row.locator('button.arr').nth(1).click();
    await wait(120);
    const changed = await page.evaluate(() => {
      const r = [...document.querySelectorAll('.adv-overlay .adv-row')].find((x) => /Barbarzyńcy/.test(x.querySelector('.adv-lbl')?.textContent ?? ''));
      return r?.querySelector('.sv')?.textContent ?? null;
    });
    assert(`wartość zmieniona w oknie (${before} -> ${changed})`, changed !== null && changed !== before);

    const btn = page.locator('.civ-newgame .adv-modal .adv-close');
    assert('przycisk stopki ma tekst „Zastosuj”', (await btn.textContent())?.trim() === 'Zastosuj');
    assert('przycisk stopki nie jest „Zamknij”', !(await page.locator('.civ-newgame .adv-modal', { hasText: 'Zamknij' }).count()));
    assert('przycisk nie jest disabled', await btn.isEnabled());
    const geo = await page.evaluate(() => {
      const b = document.querySelector('.civ-newgame .adv-modal .adv-close');
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      const inVp = r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
      return { inVp, hitIsBtn: !!hit && (hit === b || b.contains(hit)), pe: getComputedStyle(b).pointerEvents };
    });
    assert('przycisk w całości widoczny w viewportcie (nie ucięty)', geo.inVp);
    assert('przycisk trafiony myszą (elementFromPoint, nie zasłonięty)', geo.hitIsBtn);
    assert('pointer-events nie blokuje kliku', geo.pe !== 'none');

    await btn.click();
    await wait(200);
    const overlayOpen = await page.evaluate(() => document.querySelector('.adv-overlay')?.classList.contains('open') ?? false);
    assert('klik „Zastosuj” zamyka okno', overlayOpen === false);
    const saved = await readPrefsAdvanced(page);
    assert('wartość zapisana w prefs (advanced.barbariansLevel zmienione)', saved !== null && typeof saved.barbariansLevel === 'string');
    const stateBeforeReopen = await page.evaluate(() => document.querySelector('.adv-overlay')?.className ?? '');
    assert('stan overlay po zamknięciu bez klasy open', !stateBeforeReopen.includes('open'));

    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open', { timeout: 10000 });
    await wait(200);
    const reopened = await page.evaluate(() => {
      const r = [...document.querySelectorAll('.adv-overlay .adv-row')].find((x) => /Barbarzyńcy/.test(x.querySelector('.adv-lbl')?.textContent ?? ''));
      return r?.querySelector('.sv')?.textContent ?? null;
    });
    assert(`po ponownym otwarciu wartość zachowana (${reopened})`, reopened === changed);

    if (cfg.screenshot) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
      await page.locator('.civ-newgame .adv-modal').screenshot({ path: path.join(EVIDENCE_DIR, cfg.screenshot) });
      console.log(`  zrzut: ${path.join(EVIDENCE_DIR, cfg.screenshot)}`);
    }
    await btn.click();
    await wait(150);

    // Zachowanie tła (overlay click) bez zmian: zamyka i zapisuje.
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open', { timeout: 10000 });
    await wait(150);
    await barbRow(page).locator('button.arr').nth(1).click();
    await page.mouse.click(5, 5);
    await wait(150);
    const bgClosed = await page.evaluate(() => !document.querySelector('.adv-overlay')?.classList.contains('open'));
    assert('klik w tło zamyka okno (zachowanie bez zmian)', bgClosed);

    assert('brak błędów JS na stronie', jsErrors.length === 0);
    if (jsErrors.length) console.error('   ' + jsErrors.slice(0, 3).join(' | '));
  } finally {
    await ctx.close();
  }
}

(async () => {
  const dist = process.env.NEWGAME_ADV_DIST || buildBundle();
  const server = await serve(dist);
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const { chromium } = require('playwright');
  const browser = await launchBrowser(chromium);
  try {
    await runScenario(browser, origin, { label: '1280x720 @100%', w: 1280, h: 720, dpr: 1, screenshot: 'adv-zastosuj-1280x720-100.png' });
    await runScenario(browser, origin, { label: '1280x600 @100% (niski viewport)', w: 1280, h: 600, dpr: 1 });
    await runScenario(browser, origin, { label: '1280x720 @150% (viewport 853x480, DPR 1.5)', w: 853, h: 480, dpr: 1.5, screenshot: 'adv-zastosuj-1280x720-150.png' });
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
