'use strict';

/**
 * diplomacy-sensible-deals-live-test.cjs — R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (R4, pkt 9).
 *
 * WERYFIKACJA W PRZEGLĄDARCE (headless Chromium, zbudowany bundle vite, `?playtest=mapa`):
 *   1. startowa tura bez ofert: koniec tury dozwolony,
 *   2. gate ON + filtr ON: wstrzyknięta oferta AI->gracz (REALNA ścieżka enqueue) BLOKUJE koniec tury,
 *   3. zrzut ekranu z wiszącą ofertą,
 *   4. rozpatrzenie (odrzucenie) oferty ZWALNIA blokadę końca tury,
 *   5. gate OFF: ta sama oferta NIE blokuje końca tury (zachowanie bazowe),
 *   6. zero console.error / pageerror.
 *
 * POMIAR LICZBY OFERT W PEŁNEJ GRZE (N tur, wiele ziaren) NIE jest tu wykonywany — to temat
 * zależny R-WEB-TEST-HOOK-HEADLESS-GAME-Q1 (hak ?testhook=1 z seedem i autorozstrzyganiem bitew).
 *
 * Parametr: DEALS_LIVE_OUT (katalog bundla vite; domyślnie katalog tymczasowy systemu, poza repo),
 * DEALS_LIVE_EVIDENCE (katalog zrzutów ekranu; domyślnie: nie zapisuje).
 *
 * Uruchamianie z gra/: node tools/diplomacy-sensible-deals-live-test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = process.env.DEALS_LIVE_OUT || path.join(os.tmpdir(), 'deals-sensible-live-dist');
const EVIDENCE_DIR = process.env.DEALS_LIVE_EVIDENCE || '';
const URL_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK   ${label}`);
  } else {
    fail++;
    console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildBundle() {
  console.log(`[deals-live] build vite -> ${OUT_DIR}`);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (_) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function shot(page, name) {
  if (!EVIDENCE_DIR) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name) });
  console.log(`  [shot] ${path.join(EVIDENCE_DIR, name)}`);
}

async function bootPlaytest(page) {
  await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__dealsLiveDebug && !!window.__buildRequestTestDebug
      && window.__buildRequestTestDebug.getWorldState().citiesLen > 0
      && window.__dealsLiveDebug.snapshot().turn === 1,
    undefined,
    { timeout: 180000 },
  );
  // Playtest startuje bez miasta gracza (bramka awaitingFirstPlayerCity blokuje koniec tury).
  const founded = await page.evaluate(() => window.__dealsLiveDebug.foundFirstCity());
  if (!founded) throw new Error('Nie udało się założyć pierwszego miasta gracza w sandboxie');
  await wait(300);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (_) {
    console.error('[deals-live] playwright nie znaleziony (uruchom z gra/).');
    process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push('[pageerror] ' + err.message));
    await bootPlaytest(page);
    await page.evaluate(() => {
      window.__dealsLiveDebug.setFilter(true);
      window.__dealsLiveDebug.setGate(true);
    });

    const s0 = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    assert('start: brak ofert na stole, koniec tury dozwolony', s0.pending.length === 0 && s0.canEnd === true, s0);

    const injected = await page.evaluate(() => window.__dealsLiveDebug.injectAiTradeOffer());
    assert('wstrzyknięcie: oferta AI->gracz trafia na stół (realna ścieżka enqueue)', injected === 1, { injected });

    const s1 = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    assert('gate ON: wisząca oferta AI->gracz blokuje koniec tury', s1.pending.length === 1 && s1.canEnd === false, s1);
    assert('oferta niesie uzasadnienie reason (pole widoczne w stanie)', typeof s1.pending[0]?.reason === 'string', s1.pending[0]);
    await shot(page, 'blokada-oferta-wisi.png');

    const rejected = await page.evaluate(() => window.__dealsLiveDebug.rejectAllAiTradeOffers());
    const s2 = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    assert('rozpatrzenie (odrzucenie) oferty: blokada zwolniona', rejected === 1 && s2.pending.length === 0 && s2.canEnd === true, { rejected, s2 });
    await shot(page, 'blokada-zwolniona.png');

    await page.evaluate(() => window.__dealsLiveDebug.setGate(false));
    const inj2 = await page.evaluate(() => window.__dealsLiveDebug.injectAiTradeOffer());
    const s3 = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    assert('gate OFF: oferta wisi, ale NIE blokuje końca tury (zachowanie bazowe)', inj2 === 1 && s3.pending.length === 1 && s3.canEnd === true, { inj2, s3 });
    await page.evaluate(() => window.__dealsLiveDebug.rejectAllAiTradeOffers());

    const realErrors = consoleErrors.filter(e => !/favicon|Failed to load resource/i.test(e));
    assert('zero console.error / pageerror', realErrors.length === 0, realErrors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log(`\ndiplomacy-sensible-deals-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[deals-live] błąd:', err && err.stack ? err.stack : err);
  process.exit(1);
});
