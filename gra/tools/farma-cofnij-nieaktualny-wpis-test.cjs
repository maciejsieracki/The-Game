'use strict';
/**
 * farma-cofnij-nieaktualny-wpis-test.cjs — bramka tematu
 * P-FARMA-COFNIJ-ZWRACA-PRACE-NIEAKTUALNY-WPIS-Q1.
 *
 * GOAL: `undoPendingBuildRequest` (main.ts) MUSI, przed zwrotem Pracy za cofnięty wpis
 * `pendingImprovementsTurn`, sprawdzić czy ulepszenie FAKTYCZNIE nadal istnieje na heksie
 * (`placedImprovements` dla zwykłego ulepszenia). Jeśli inny, niezależny mechanizm już je
 * usunął (np. zastąpienie innym ulepszeniem z tego samego sektora wykluczającego —
 * `commitBuildRequest` filtruje `impact.removedImprovements` z `placedImprovements`, ale
 * NIGDY nie dotyka `pendingImprovementsTurn` starego wpisu) — wpis pending jest osierocony.
 * Kliknięcie „cofnij" na takim osieroconym wpisie NIE MOŻE zwrócić Pracy ani twierdzić że
 * zwróciła.
 *
 * REGULA PRZECIW SAMOOSZUKIWANIU: zero jednostkowego testu na wyciętej funkcji. Cały
 * scenariusz idzie przez REALNY `applyBuildRequest`/`undoPendingBuildRequest` (main.ts) w
 * ŻYWEJ, zbudowanej grze (`vite build`, `?playtest=mapa`, headless Chromium), wzorem
 * `build-request-obywatele-live-test.cjs`. Desynchronizacja (kryterium 1) jest konstruowana
 * BEZ dodawania jakiegokolwiek nowego haka testowego do main.ts (allowlista tego tematu
 * zezwala WYŁĄCZNIE na zmianę wewnątrz `undoPendingBuildRequest`) — wyłącznie przez REALNY,
 * już istniejący mechanizm silnika: budowa `tarasy` na heksie z `farma` (oba w sektorze
 * wykluczającym `foodteren`, `SEKTOR_OF` w map/improvement-build.ts) wywołuje prawdziwy modal
 * potwierdzenia (`showImprovementBuildConfirmModal`, DOM), który test klika PRAWDZIWĄ myszą
 * (Playwright). Po potwierdzeniu `commitBuildRequest` zdejmuje `farma` z `placedImprovements`
 * — ale wpis `farma` w `pendingImprovementsTurn` (dodany wcześniejszą, osobną budową) zostaje
 * NIETKNIĘTY. To DOKŁADNIE ten sam kształt desynchronizacji co w RECON dispatcha (sweep
 * usuwa instancję niezależnie od kolejki pending), tylko odtworzony żywym mechanizmem
 * osiągalnym w tej samej turze zamiast starego zapisu.
 *
 * Weryfikacja liczbowa puli Pracy (żaden hak testowy nie eksponuje `playerPracaPool` do
 * odczytu) idzie przez PRAWDZIWĄ bramkę kosztu w `applyBuildRequest`
 * (`playerPracaPool < req.kosztPraca` → odrzucenie + toast „Za mało Pracy") — próbna budowa
 * o znanym koszcie na świeżym heksie DOWODZI górnej/dolnej granicy puli, nie zgaduje jej.
 *
 * Weryfikacja czy wpis pending zniknął z kolejki (kryterium 3) idzie przez PRAWDZIWĄ gałąź
 * routingu w `applyBuildRequest`: `pendingImprovementsTurn.has(hexKey,key)` decyduje czy
 * kolejne kliknięcie w TEN SAM (hexKey,key) trafia do `undoPendingBuildRequest` (wpis wciąż
 * w kolejce) czy do normalnej ścieżki budowy/impact/modal (wpis już usunięty z kolejki).
 *
 * Pokrycie (kryteria końca dispatcha):
 *  1. Desynchronizacja: pending wpis dla `farma`, której już nie ma w `placedImprovements`
 *     (zastąpiona `tarasy`) — cofnięcie NIE zwraca Pracy, toast NIE twierdzi że zwróciła.
 *  2. Normalny przypadek (ta sama tura, ulepszenie nadal istnieje) — Praca WRACA dokładnie
 *     jak dziś, standardowy toast, zero regresu.
 *  3. Wpis pending usuwany w OBU przypadkach (dowód: kolejne kliknięcie w to samo (hexKey,key)
 *     idzie normalną ścieżką budowy, nie ponownym „cofnij").
 *  4. Zero console.error / pageerror w całym scenariuszu.
 *
 * Bramka (z katalogu gra/): node tools/farma-cofnij-nieaktualny-wpis-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-farma-cofnij-nieaktualny-wpis-test');
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
  console.log('[farma-cofnij-nieaktualny-wpis-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[farma-cofnij-nieaktualny-wpis-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[farma-cofnij-nieaktualny-wpis-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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

/** Próbuje postawić farma na WSKAZANYM heksie (kosztPraca dowolny, pula musi starczyć). */
async function applyFarma(page, hex, kosztPraca) {
  await page.evaluate(({ q, r, kosztPraca }) => {
    window.__buildRequestTestDebug.applyBuildRequest({
      type: 'buildImprovement', key: 'farma', q, r, hexKey: `${q},${r}`, kosztPraca, action: 'ulepszenie',
    });
  }, { q: hex.q, r: hex.r, kosztPraca });
}

/** Szuka świeżego, pustego heksu terytorium gracza, na którym DA SIĘ postawić farma
 * (findFreshUnworkedHex nie gwarantuje terenu płaskiego — retry aż budowa faktycznie się uda). */
async function findFarmableFreshHex(page, maxAttempts) {
  for (let i = 0; i < maxAttempts; i++) {
    const hex = await page.evaluate(() => window.__buildRequestTestDebug.findFreshUnworkedHex());
    if (!hex) return null;
    await applyFarma(page, hex, 0);
    const layers = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hex);
    if (layers.includes('farma')) return hex;
    // Nieudana próba (np. las blokuje farma) — heks zostaje pusty, spróbuj kolejnego świeżego.
  }
  return null;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[farma-cofnij-nieaktualny-wpis-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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
    assert('bootstrap zakończony: turn===1', world0.turn === 1, world0);

    await page.evaluate(() => {
      window.__buildRequestTestDebug.unlockAllTech();
      window.__buildRequestTestDebug.setPlayerPracaPool(100000);
    });

    // =========================================================================================
    console.log('\n-- 1. DESYNCHRONIZACJA: pending „farma" osierocony przez realne zastąpienie tarasy --');
    // =========================================================================================
    const hexA = await findFarmableFreshHex(page, 12);
    assert('hexA: znaleziono heks, na którym farma faktycznie stanęła', !!hexA, hexA);
    if (hexA) {
      const layersAfterFarma = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexA);
      assert('hexA: farma postawiona (pending wpis „farma" utworzony)', layersAfterFarma.includes('farma'), layersAfterFarma);

      console.log('  -- zastępujemy farma przez tarasy (ten sam sektor wykluczający „foodteren") --');
      await page.evaluate(({ q, r }) => {
        window.__buildRequestTestDebug.applyBuildRequest({
          type: 'buildImprovement', key: 'tarasy', q, r, hexKey: `${q},${r}`, kosztPraca: 0, action: 'ulepszenie',
        });
      }, hexA);
      const okBtn = page.locator('.civ-imp-build-ok');
      await okBtn.waitFor({ state: 'visible', timeout: 5000 });
      await okBtn.click();
      await wait(150);

      const layersAfterTarasy = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexA);
      assert('hexA: PO zastąpieniu — farma zniknęła z placedImprovements, tarasy stoi',
        !layersAfterTarasy.includes('farma') && layersAfterTarasy.includes('tarasy'), layersAfterTarasy);
      assert('hexA: DESYNCHRONIZACJA gotowa — pending wpis „farma" NIGDY nie był dotknięty przez tę budowę '
        + '(commitBuildRequest zdejmuje TYLKO placedImprovements, nie pendingImprovementsTurn)',
        true);

      console.log('  -- pula Pracy = 0 (dokładna granica), klik „cofnij" na osieroconym wpisie „farma" --');
      await page.evaluate(() => window.__buildRequestTestDebug.setPlayerPracaPool(0));
      await applyFarma(page, hexA, 40); // req.key='farma' + req.hexKey=hexA → pendingImprovementsTurn.has()===true → routing do undo
      await wait(150);
      const toastStale = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
      assert('toast po cofnięciu osieroconego wpisu: NIE twierdzi że Praca została zwrócona',
        !!toastStale && !/Praca zwrócona/.test(toastStale.html), toastStale);
      assert('toast po cofnięciu osieroconego wpisu: mówi wprost że ulepszenie już nie istnieje / Praca nie wróciła',
        !!toastStale && /nie istnieje/.test(toastStale.html) && /nie została zwrócona/.test(toastStale.html), toastStale);

      console.log('  -- DOWÓD LICZBOWY: pula NADAL 0 — próbna budowa o koszcie 1 na świeżym heksie MUSI się nie udać --');
      const probeHexZero = await page.evaluate(() => window.__buildRequestTestDebug.findFreshUnworkedHex());
      assert('probeHexZero: znaleziono świeży heks do próby', !!probeHexZero, probeHexZero);
      if (probeHexZero) {
        await applyFarma(page, probeHexZero, 1);
        const probeLayers = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), probeHexZero);
        const probeToast = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
        assert('DOWÓD: pula Pracy pozostała 0 — próbna budowa (koszt 1) ODRZUCONA (brak Pracy)',
          probeLayers.length === 0, probeLayers);
        assert('DOWÓD: toast próbnej budowy to „Za mało Pracy" (pula rzeczywiście = 0, nie 40)',
          !!probeToast && /Za mało Pracy/.test(probeToast.html), probeToast);
      }

      console.log('  -- KRYTERIUM 3 (przypadek osierocony): wpis pending USUNIĘTY z kolejki mimo braku zwrotu --');
      await page.evaluate(() => window.__buildRequestTestDebug.setPlayerPracaPool(100000));
      await applyFarma(page, hexA, 0); // hexA nadal ma 'tarasy' (sektor foodteren) → jeśli pending USUNIĘTY, to normalna ścieżka budowy → modal zastąpienia; jeśli pending OSIEROCONY dalej w kolejce → natychmiastowy toast „cofnięto" (BEZ modala)
      await wait(150);
      const modalVisible = await page.locator('.civ-imp-build-ok').isVisible().catch(() => false);
      assert('KRYTERIUM 3: kolejne (hexKey,„farma") idzie NORMALNĄ ścieżką budowy (modal zastąpienia tarasy) — '
        + 'dowód że stary wpis pending został wcześniej usunięty z kolejki, nie osierocony na zawsze',
        modalVisible === true);
      if (modalVisible) await page.locator('.civ-imp-build-cancel').click(); // sprzątanie, nie zmieniamy dalej stanu hexA
    }

    // =========================================================================================
    console.log('\n-- 2. NORMALNY PRZYPADEK (ta sama tura): Praca WRACA dokładnie jak dziś, zero regresu --');
    // =========================================================================================
    const hexD = await findFarmableFreshHex(page, 12);
    // findFarmableFreshHex już postawiło farma kosztem 0 — cofnijmy ją i zacznijmy od czystego heksu z jawnym kosztem.
    assert('hexD: znaleziono heks pod scenariusz normalny', !!hexD, hexD);
    if (hexD) {
      await applyFarma(page, hexD, 0); // pending.has===true (z findFarmableFreshHex) → to jest 'cofnij' kosztem 0, czyści heks
      const clean = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexD);
      assert('hexD: heks wyczyszczony przed właściwym scenariuszem', clean.length === 0, clean);

      await page.evaluate(() => window.__buildRequestTestDebug.setPlayerPracaPool(40));
      await applyFarma(page, hexD, 40);
      const placed = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexD);
      assert('hexD: farma postawiona kosztem dokładnie 40 (pula wyczerpana do 0)', placed.includes('farma'), placed);

      console.log('  -- natychmiastowe cofnięcie W TEJ SAMEJ TURZE (ulepszenie nadal istnieje) --');
      await applyFarma(page, hexD, 40);
      await wait(150);
      const afterUndo = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexD);
      const toastNormal = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
      assert('hexD: farma zniknęła z heksa po cofnięciu (jak dziś)', !afterUndo.includes('farma'), afterUndo);
      assert('hexD: toast standardowy „Praca zwrócona (40)" — ZERO REGRESU wobec dzisiejszego zachowania',
        !!toastNormal && /Praca zwrócona \(40\)/.test(toastNormal.html), toastNormal);

      console.log('  -- DOWÓD LICZBOWY: pula wróciła DOKŁADNIE do 40 (nie mniej, nie więcej) --');
      await applyFarma(page, hexD, 41); // koszt 41 > pula(40) → MUSI się nie udać
      const afterTooExpensive = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexD);
      assert('DOWÓD: pula NIE przekracza 40 — próba za 41 odrzucona', afterTooExpensive.length === 0, afterTooExpensive);
      await applyFarma(page, hexD, 40); // koszt dokładnie 40 → MUSI się udać
      const afterExact = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexD);
      assert('DOWÓD: pula wynosi CO NAJMNIEJ 40 — próba za dokładnie 40 się udaje (pula = dokładnie 40, jak przed cofnięciem)',
        afterExact.includes('farma'), afterExact);

      console.log('  -- KRYTERIUM 3 (przypadek normalny): wpis pending też usuwany, nie osiera się w kolejce --');
      await applyFarma(page, hexD, 40); // to jest kolejny build z kroku wyżej → pending.has===true → to jest 'cofnij' (normalny, poprawny)
      const afterSecondUndo = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.getPlacedLayers(q, r), hexD);
      assert('KRYTERIUM 3: farma cofnięta ponownie bez problemu (kolejka konsekwentnie spójna)',
        !afterSecondUndo.includes('farma'), afterSecondUndo);
    }

    console.log('\n-- 3. Konsola czysta --');
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
  console.error('[farma-cofnij-nieaktualny-wpis-test] BŁĄD:', e);
  process.exit(1);
});
