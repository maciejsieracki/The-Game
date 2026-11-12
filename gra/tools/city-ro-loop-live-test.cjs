'use strict';
/**
 * city-ro-loop-live-test.cjs
 * R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1 — pomiar NA ŻYWEJ GRZE (pełny index.html, main.ts, realny Chromium).
 * Kroki: nowa gra (test hook) -> miasto startowe -> otwarcie panelu miasta (realna ścieżka hot-seat hook)
 * -> okno 5 s: licznik zdarzeń window 'error' z "ResizeObserver loop" + obecność overlaya BOOT ERROR
 * -> zrzut 1440x900 panelu miasta (jeśli podano EVID_DIR) -> kontrola filtra (zdarzenie RO nie pokazuje
 * overlaya; inny błąd POKAZUJE overlay).
 * Uzycie (z gra/): node tools/city-ro-loop-live-test.cjs [--src <katalog gra>] [--shot <plik.png>]
 *   --src: katalog źródeł gra/ do zbudowania (domyślnie ten plik/../) — do pomiaru PRZED poprawką.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const argVal = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const GRA_DIR = path.resolve(argVal('--src') || path.join(__dirname, '..'));
const SHOT = argVal('--shot');
const LABEL = argVal('--src') ? 'SRC=' + GRA_DIR : 'KOD';
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-ro-live-'));
const URL = 'file://' + path.join(OUT_DIR, 'index.html') + '?civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RO_MSG = 'ResizeObserver loop completed with undelivered notifications';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0; let fail = 0;
const check = (label, ok, detail) => {
  if (ok) { pass++; console.log('PASS: ' + label); }
  else { fail++; console.log('FAIL: ' + label + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
};

async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

// Overlay BOOT ERROR (index.html) albo ERROR (main.ts showErr) widoczny w DOM.
const OVERLAY_JS = () => {
  const boot = document.getElementById('__boot_err__');
  if (boot) return 'BOOT:' + boot.textContent;
  const other = [...document.body.children].find((x) => (x.textContent || '').startsWith('THE GAME — ERROR'));
  if (other) return 'ERROR:' + other.textContent;
  return null;
};

async function main() {
  const { chromium } = require('playwright');
  console.log(`[ro-live] (${LABEL}) vite build -> ${OUT_DIR}`);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
  const browser = await launch(chromium);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pageErrs = [];
  page.on('pageerror', (e) => pageErrs.push(String(e.message)));
  await page.addInitScript(() => {
    window.__roCount = 0;
    window.addEventListener('error', (e) => { if (String(e.message).includes('ResizeObserver loop')) window.__roCount++; });
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__workPoolTestDebug
    && !!window.__hotSeatTestDebug && !!window.__civTest, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await wait(300);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal'));
  await wait(500);
  await wait(1000);
  // Czekaj, aż znika modal „Tworzenie świata” (generowanie mapy), zanim otworzymy panel miasta.
  const genEnd = Date.now() + 180000;
  while (Date.now() < genEnd && await page.evaluate(() => document.body.innerText.includes('Tworzenie świata'))) await wait(500);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await wait(800);
  const cityId = await page.evaluate(() => window.__workPoolTestDebug.state().cities[0].id);
  check('miasto startowe założone', !!cityId, cityId);

  const overlayBeforeOpen = await page.evaluate(OVERLAY_JS);
  check('przed otwarciem panelu miasta: brak overlaya', overlayBeforeOpen === null, overlayBeforeOpen);

  await page.evaluate(() => { window.__roCount = 0; });
  const opened = await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  check('panel miasta otwarty (realna ścieżka)', opened === true, opened);
  await wait(5000);
  const roOpen = await page.evaluate(() => window.__roCount);
  const overlayOpen = await page.evaluate(OVERLAY_JS);
  console.log(`RO w oknie 5 s po otwarciu panelu miasta (${LABEL}): ${roOpen}`);
  console.log(`Overlay po otwarciu panelu miasta (${LABEL}): ${overlayOpen === null ? 'brak' : overlayOpen.slice(0, 160)}`);
  check('panel miasta: RO w 5 s <= 1 (live)', roOpen <= 1, { roOpen });
  check('panel miasta: brak overlaya BOOT/ERROR (live)', overlayOpen === null, overlayOpen);

  if (SHOT) {
    fs.mkdirSync(path.dirname(path.resolve(SHOT)), { recursive: true });
    await page.screenshot({ path: path.resolve(SHOT) });
    console.log('ZRZUT: ' + path.resolve(SHOT));
  }

  // Kontrola filtra: zdarzenie RO nie daje overlaya; inny błąd daje (filtr nie jest wyciszeniem wszystkiego).
  const overlayBeforeCtl = await page.evaluate(OVERLAY_JS);
  await page.evaluate((m) => window.dispatchEvent(new ErrorEvent('error', { message: m, filename: 'ctl', lineno: 1, colno: 1 })), RO_MSG);
  await wait(300);
  const overlayAfterRo = await page.evaluate(OVERLAY_JS);
  check('filtr: syntetyczne zdarzenie RO nie pokazuje overlaya', overlayAfterRo === overlayBeforeCtl, { overlayBeforeCtl, overlayAfterRo });
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'KONTROLA-INNY-BLAD', filename: 'ctl', lineno: 1, colno: 1 })));
  await wait(300);
  const overlayAfterOther = await page.evaluate(OVERLAY_JS);
  check('filtr: inny błąd nadal pokazuje overlay (brak wyciszania wszystkiego)',
    overlayAfterOther !== null && overlayAfterOther.includes('KONTROLA-INNY-BLAD'), overlayAfterOther);

  console.log(`Błędy strony (pageerror, bez RO): ${pageErrs.filter((m) => !m.includes('ResizeObserver')).length}`);
  await browser.close();
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  console.log(`WYNIK (${LABEL}): PASS=${pass} FAIL=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) {} process.exit(2); });
