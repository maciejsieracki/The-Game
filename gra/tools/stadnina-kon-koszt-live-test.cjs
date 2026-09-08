'use strict';
/**
 * stadnina-kon-koszt-live-test.cjs — P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1 (runda 3, ZADANIE pkt 1).
 *
 * KONTEKST: Evaluator rundy 2 (06-evaluator-runda2.md, Zarzut 1) złapał, że
 * `stadnina-kon-koszt-test.cjs` dowodzi punkt (c) binarnego kryterium ("realne odjęcie 50 'kon'
 * przy potwierdzeniu budowy") WYŁĄCZNIE przez równoległą symulację — woła
 * `deductBuildingStockCostAcrossCities` bezpośrednio, z ręcznie odtworzonym warunkiem bramki, nie
 * przez rzeczywisty `main.ts::commitBuildRequest`. Decyzja orkiestratora rundy 3 (08-dispatch-
 * runda3.md): dopisać do `window.__buildRequestTestDebug` (main.ts, obiekt już scalony z
 * P-AI-PRZYCISK-BUDUJ-REGRES-OBYWATELE-Q1) DOKŁADNIE dwie metody testowe — `setCityKonStock`
 * (setter magazynu 'kon' imperium) i `forceHorseDeposit`/`forceNoHorseDeposit` (forser złoża
 * konia na heksie) — i tym hakiem wołać REALNY `applyBuildRequest`→`commitBuildRequest` w
 * zbudowanej grze (vite build + headless Chromium), wzorem `era-change-toast-live-test.cjs` /
 * `build-request-obywatele-live-test.cjs`.
 *
 * Ten plik NIE reimplementuje bramki kosztu — jedyne co hak testowy "oszukuje" to (a) ustawienie
 * magazynu 'kon' imperium na wybraną wartość (`setCityKonStock`, ten sam odczyt sumujący co
 * `citySurowceSumForOwner` czyta z powrotem), (b) wymuszenie obecności/braku złoża konia na
 * WSKAZANYM heksie (`forceHorseDeposit`/`forceNoHorseDeposit`), (c) odblokowanie technologii/puli
 * Pracy, żeby zmierzyć WYŁĄCZNIE zachowanie bramki kosztu 'kon', nie inne, niezwiązane bramki. Sam
 * przycisk "buduj" (`applyBuildRequest`) i mutacja magazynu (`commitBuildRequest` →
 * `deductBuildingStockCostAcrossCities`) są REALNE, niezmodyfikowane przez ten test.
 *
 * Pokrycie (ZADANIE pkt 1 dispatchu rundy 3, na REALNYM `commitBuildRequest`):
 *  A. Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
 *  B. POZA złożem, magazyn 10 (< 50): `applyBuildRequest('stadnina')` NIE stawia ulepszenia —
 *     realna bramka kosztu blokuje, toast czytelny ("masz 10").
 *  C. TEN SAM heks, magazyn podniesiony do DOKŁADNIE 50: `applyBuildRequest('stadnina')` STAWIA
 *     ulepszenie — budowa się udaje na progu >=50.
 *  D. NOWY heks POZA złożem, magazyn NIETKNIĘTY od kroku C: `applyBuildRequest('stadnina')` NIE
 *     stawia ulepszenia — dowód, że krok C odjął DOKŁADNIE 50 (50→0), nie mniej/więcej: toast
 *     czyta aktualny magazyn ("masz 0"), nie starą wartość 50 i nie wartość ujemną.
 *  E. NOWY heks ZE złożem konia (wymuszonym), magazyn=0: `applyBuildRequest('stadnina')` STAWIA
 *     ulepszenie mimo magazynu 0 — na złożu koszt nigdy nie obowiązuje (bez zmian).
 *  F. Zero console.error / pageerror w trakcie scenariusza.
 *
 * Bramka (z katalogu gra/): node tools/stadnina-kon-koszt-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-stadnina-kon-koszt-live-test');
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
  console.log('[stadnina-kon-koszt-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[stadnina-kon-koszt-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[stadnina-kon-koszt-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
    console.error('[stadnina-kon-koszt-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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

    console.log('\n-- przygotowanie: odblokuj technologie + pulę Pracy (mierzymy WYŁĄCZNIE bramkę kosztu \'kon\') --');
    await page.evaluate(() => {
      window.__buildRequestTestDebug.unlockAllTech();
      window.__buildRequestTestDebug.setPlayerPracaPool(100000);
    });

    const hexes = await page.evaluate(() => window.__buildRequestTestDebug.findTestHexes());
    assert('znaleziono heks BEZ obywateli, bez złoża (unworkedHex) do sekcji B/C', !!hexes.unworkedHex, hexes);

    if (hexes.unworkedHex) {
      const { q, r } = hexes.unworkedHex;

      console.log('\n-- B. POZA złożem, magazyn 10 (<50): applyBuildRequest("stadnina") NIE stawia ulepszenia --');
      const forcedNoDeposit1 = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.forceNoHorseDeposit(q, r), { q, r });
      assert('złoże konia wymuszone-BRAK na heksie testowym', forcedNoDeposit1 === true, { forcedNoDeposit1 });
      const setStock10 = await page.evaluate(() => window.__buildRequestTestDebug.setCityKonStock(0, 10));
      assert('setCityKonStock(0, 10) OK (miasto ownera 0 istnieje)', setStock10 === true, { setStock10 });
      const beforeB = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q, r });
      assert('przed próbą B: heks pusty', beforeB.length === 0, beforeB);
      await page.evaluate(({ q, r }) => {
        window.__buildRequestTestDebug.applyBuildRequest({
          type: 'buildImprovement', key: 'stadnina', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
        });
      }, { q, r });
      const afterB = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q, r });
      assert('PO próbie B: stadnina NIE postawiona (magazyn 10 < 50) — realna bramka commitBuildRequest blokuje',
        !afterB.includes('stadnina'), afterB);
      const toastB = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
      assert('toast B czytelny: wspomina "50" (wymagany koszt) i "10" (aktualny magazyn)',
        !!toastB && typeof toastB.html === 'string' && toastB.html.includes('50') && toastB.html.includes('10'), toastB);

      console.log('\n-- C. TEN SAM heks, magazyn podniesiony do DOKŁADNIE 50: applyBuildRequest("stadnina") STAWIA ulepszenie --');
      const setStock50 = await page.evaluate(() => window.__buildRequestTestDebug.setCityKonStock(0, 50));
      assert('setCityKonStock(0, 50) OK', setStock50 === true, { setStock50 });
      await page.evaluate(({ q, r }) => {
        window.__buildRequestTestDebug.applyBuildRequest({
          type: 'buildImprovement', key: 'stadnina', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
        });
      }, { q, r });
      const afterC = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), { q, r });
      assert('PO próbie C: stadnina POSTAWIONA (magazyn DOKŁADNIE 50 >= 50) — próg >=, nie >',
        afterC.includes('stadnina'), afterC);

      console.log('\n-- D. NOWY heks POZA złożem, magazyn NIETKNIĘTY od kroku C: applyBuildRequest("stadnina") NIE stawia ulepszenia --');
      const freshHex1 = await page.evaluate(() => window.__buildRequestTestDebug.findFreshUnworkedHex());
      assert('znaleziono NOWY, świeży heks BEZ obywateli dla sekcji D', !!freshHex1, freshHex1);
      if (freshHex1) {
        const forcedNoDeposit2 = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.forceNoHorseDeposit(q, r), freshHex1);
        assert('złoże konia wymuszone-BRAK na NOWYM heksie testowym', forcedNoDeposit2 === true, { forcedNoDeposit2 });
        await page.evaluate(({ q, r }) => {
          window.__buildRequestTestDebug.applyBuildRequest({
            type: 'buildImprovement', key: 'stadnina', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
          });
        }, freshHex1);
        const afterD = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), freshHex1);
        assert('PO próbie D: stadnina NIE postawiona na NOWYM heksie (magazyn spadł do 0 po kroku C) — dowód realnego odjęcia',
          !afterD.includes('stadnina'), afterD);
        const toastD = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
        assert('toast D czyta AKTUALNY magazyn — "masz 0" (DOKŁADNIE 50 odjęte w kroku C, nie mniej/więcej)',
          !!toastD && typeof toastD.html === 'string' && toastD.html.includes('masz 0'), toastD);
      }

      console.log('\n-- E. NOWY heks ZE złożem konia (wymuszonym), magazyn=0: applyBuildRequest("stadnina") STAWIA ulepszenie mimo magazynu 0 --');
      const freshHex2 = await page.evaluate(() => window.__buildRequestTestDebug.findFreshUnworkedHex());
      assert('znaleziono NOWY, świeży heks dla sekcji E', !!freshHex2, freshHex2);
      if (freshHex2) {
        const forcedDeposit = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.forceHorseDeposit(q, r), freshHex2);
        assert('złoże konia wymuszone-OBECNE na heksie testowym E', forcedDeposit === true, { forcedDeposit });
        await page.evaluate(({ q, r }) => {
          window.__buildRequestTestDebug.applyBuildRequest({
            type: 'buildImprovement', key: 'stadnina', q, r, hexKey: `${q},${r}`, kosztPraca: 10, action: 'ulepszenie',
          });
        }, freshHex2);
        const afterE = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), freshHex2);
        assert('PO próbie E: stadnina POSTAWIONA na złożu mimo magazynu 0 — koszt nigdy nie dotyczy złoża (bez zmian)',
          afterE.includes('stadnina'), afterE);
      }
    }

    console.log('\n-- F. Konsola czysta --');
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
  console.error('[stadnina-kon-koszt-live-test] BŁĄD:', e);
  process.exit(1);
});
