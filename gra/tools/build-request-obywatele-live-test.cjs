'use strict';
/**
 * build-request-obywatele-live-test.cjs — R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1
 * (Operator Sonnet 5, runda 1, kryterium końca 5: REALNA weryfikacja w headless Chromium).
 *
 * KONTEKST: Final Control rundy 5 `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` złapał, że ręczny
 * przycisk „buduj" gracza (`applyBuildRequest`, main.ts) NIE był zabramkowany do heksów z
 * obywatelami — działał wszędzie. Ta runda dodaje bramkę (`isCitizenOrDepositHexForBuild`,
 * main.ts, tuż przed `applyBuildRequest`) wołającą DOKŁADNIE te same funkcje co Zasada 2
 * automatu AI (`workedHexCoordsForCity` z game/turn-economy.ts, `hexHasDepositReserve` /
 * `depositAllowsPlayerImprovement` z map/improvement-build.ts — patrz dowód w komentarzu
 * przy definicji `isCitizenOrDepositHexForBuild` w main.ts).
 *
 * REGULA PRZECIW SAMOOSZUKIWANIU tego tematu zakazuje wprost uznania testu jednostkowego
 * za wystarczający dowód (dokładnie ten sam tryb luki, co `R-MUZYKA-ERA-LIVE-E2E-Q1"). TA
 * bramka woła REALNY `applyBuildRequest` (ten sam, pod tym samym przyciskiem „buduj" w
 * panelu budowy) w ŻYWEJ, zbudowanej grze (`vite build`, `?playtest=mapa`, headless
 * Chromium) — wzorem `era-change-toast-live-test.cjs`. Jedyne co hak testowy
 * (`window.__buildRequestTestDebug`, main.ts) "oszukuje": (a) dobór współrzędnych heksa
 * Z/BEZ obywateli — przez te same REALNE funkcje co bramka pod testem, nie zgadywanie;
 * (b) odblokowanie technologii/puli Pracy, żeby zmierzyć WYŁĄCZNIE bramkę Zasady 2, nie
 * inne, niezwiązane bramki (koszt/technologia), które i tak stoją PRZED nią w kodzie.
 *
 * Pokrycie (kryteria końca 2/3/4 dispatchu, na REALNYM `applyBuildRequest`):
 *  A. Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
 *  B. Heks BEZ obywateli, bez złoża: `applyBuildRequest('farma')` NIE stawia ulepszenia
 *     (placedLayers puste PRZED i PO) — kryterium 2.
 *  C. Heks Z obywatelami: TA SAMA `applyBuildRequest('farma')` STAWIA ulepszenie
 *     (regres brak) — kryterium 3.
 *  D. Heks BEZ obywateli, ZE złożem miedzi (wymuszonym hakiem): `applyBuildRequest`
 *     z kluczem `kopalnia_miedzi` STAWIA ulepszenie mimo braku obywateli — wyjątek złożowy
 *     Zasady 2 zachowany — kryterium 4.
 *  E. Zero console.error / pageerror w trakcie scenariusza.
 *
 * Bramka (z katalogu gra/): node tools/build-request-obywatele-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-build-request-obywatele-live-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function buildBundle() {
  console.log('[build-request-obywatele-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[build-request-obywatele-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[build-request-obywatele-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  // Wzorem era-change-toast-live-test.cjs: czekaj TWARDO na cities.length>0 && turn===1
  // (bootstrap realnie dobiegł końca), nie tylko na zniknięcie overlayu.
  await page.waitForFunction(
    () => !!window.__buildRequestTestDebug && window.__buildRequestTestDebug.getWorldState().citiesLen > 0
      && window.__buildRequestTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[build-request-obywatele-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Bootstrap ?playtest=mapa dobiega końca (miasta+jednostki, tura=1) --');
    await gotoPlaytestMapa(page);
    const world0 = await page.evaluate(() => window.__buildRequestTestDebug.getWorldState());
    assert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);
    assert('bootstrap zakończony: unitsLen>0', world0.unitsLen > 0, world0);
    assert('bootstrap zakończony: turn===1', world0.turn === 1, world0);

    console.log('\n-- przygotowanie: odblokuj technologie + pulę Pracy (wyłącznie żeby zmierzyć Zasadę 2, nie inne bramki) --');
    await page.evaluate(() => {
      window.__buildRequestTestDebug.unlockAllTech();
      window.__buildRequestTestDebug.setPlayerPracaPool(100000);
    });

    console.log('\n-- znajdź REALNE heksy Z/BEZ obywateli (te same funkcje co bramka pod testem) --');
    const hexes = await page.evaluate(() => window.__buildRequestTestDebug.findTestHexes());
    assert('znaleziono heks Z obywatelami (workedHex)', !!hexes.workedHex, hexes);
    assert('znaleziono heks BEZ obywateli, bez złoża (unworkedHex)', !!hexes.unworkedHex, hexes);

    if (hexes.workedHex && hexes.unworkedHex) {
      console.log('\n-- B. Heks BEZ obywateli, bez złoża: applyBuildRequest("farma") NIE stawia ulepszenia (kryterium 2) --');
      const { q, r } = hexes.unworkedHex;
      const before = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q, r });
      assert('przed próbą: heks pusty', before.length === 0, before);
      await page.evaluate(({ q, r }) => {
        window.__buildRequestTestDebug.applyBuildRequest({
          type: 'buildImprovement', key: 'farma', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
        });
      }, { q, r });
      const afterReject = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q, r });
      assert('PO próbie: heks nadal pusty — budowa ODRZUCONA', afterReject.length === 0, afterReject);
      const toastAfterReject = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
      assert('komunikat UI po odrzuceniu jest widoczny (informacja zwrotna dla gracza)',
        !!toastAfterReject && toastAfterReject.display === 'block', toastAfterReject);

      console.log('\n-- C. Heks Z obywatelami: TA SAMA applyBuildRequest("farma") STAWIA ulepszenie (kryterium 3, brak regresu) --');
      const { q: wq, r: wr } = hexes.workedHex;
      const beforeWorked = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q: wq, r: wr });
      assert('przed próbą: heks z obywatelami pusty', beforeWorked.length === 0, beforeWorked);
      await page.evaluate(({ q, r }) => {
        window.__buildRequestTestDebug.applyBuildRequest({
          type: 'buildImprovement', key: 'farma', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
        });
      }, { q: wq, r: wr });
      const afterAccept = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q: wq, r: wr });
      assert('PO próbie: farma faktycznie postawiona na heksie z obywatelami', afterAccept.includes('farma'), afterAccept);

      console.log('\n-- D. Heks BEZ obywateli, ZE złożem miedzi (wymuszonym): kopalnia_miedzi STAWIANA mimo braku obywateli (kryterium 4) --');
      const forced = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.forceCopperDeposit(q, r), { q, r });
      assert('złoże miedzi wymuszone na heksie bez obywateli', forced === true, { forced });
      await page.evaluate(({ q, r }) => {
        window.__buildRequestTestDebug.applyBuildRequest({
          type: 'buildImprovement', key: 'kopalnia_miedzi', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
        });
      }, { q, r });
      const afterDeposit = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q, r });
      assert('kopalnia_miedzi postawiona na złożu mimo braku obywateli — wyjątek złożowy zachowany',
        afterDeposit.includes('kopalnia_miedzi'), afterDeposit);
    }

    console.log('\n-- E. Konsola czysta --');
    assert('zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[build-request-obywatele-live-test] BŁĄD:', e);
  process.exit(1);
});
