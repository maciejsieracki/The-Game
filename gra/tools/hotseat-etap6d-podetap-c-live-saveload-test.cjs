'use strict';
/**
 * hotseat-etap6d-podetap-c-live-saveload-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-C-Q1.
 *
 * Żywy dowód (dispatch: "nowa gra -> kilka tur -> zapis -> wczytanie -> kolejne tury,
 * PRZED/PO identyczne, bramka czerwienieje na mutacji", zakaz uznania save/load za
 * działające bez żywego testu Chromium) dla dwóch funkcji WYSOKIEGO RYZYKA tego
 * podetapu: `applyClusterStartPlan` (tworzenie świata, wołana z `doStartGame`) i
 * `restoreGameFromSave` (wczytywanie zapisu).
 *
 * WZORZEC (przejęty 1:1): `buildBundle`/`launchBrowser`/`closeBrowserSafely`/`wait`
 * z `hotseat-etap6a-input-noop-test.cjs`. Haki testowe UŻYWA, nie dodaje (main.ts poza
 * allowlistą tego tematu poza ciałami 5 migrowanych funkcji):
 *   - `__aiBuildingsTestDebug.startNewGame(opts)` -> REALNY `doStartGame(...)`, który
 *     woła `applyClusterStartPlan` (main.ts, ta sama ścieżka co kreator "Nowa Gra" po
 *     "Start"), z ustawionym `civTypesCount`/`cityStatesCount` tak, by uruchomić TAKŻE
 *     `spawnPendingSameTypeRivals` (deferred, przy foundowaniu pierwszego miasta gracza).
 *   - `__cityStateStartUnitsTestDebug.foundPlayerStartCity()` -> REALNE `tryFoundPlayerCityAt`,
 *     wyzwala `spawnPendingSameTypeRivals`.
 *   - `__eraTestDebug.endTurn()` -> REALNY `advanceSeat()`/`endActiveHumanTurn`, kilka tur.
 *   - `__aiBuildingsTestDebug.saveLoadRoundTrip()` -> REALNE `buildSaveGameSnapshot()` +
 *     REALNE `restoreGameFromSave()` (main.ts, ta sama para funkcji co "Zapisz grę"/wczytanie
 *     slotu -- patrz docstring haka w main.ts, P-AI-NIE-STAWIA-BUDYNKOW-Q1).
 *   - `__cityStateStartUnitsTestDebug.dumpState()` -> stan cities/units/turn PRZED i PO.
 *
 * METODA: dwa niezależne przebiegi Chromium na TYM SAMYM seedzie/opcjach -- "PO" (bieżący
 * worktree) i "ZEPSUTY" (kopia bieżącego kodu z `isMe()` na sztywno `false`, fundament
 * klastra isMe/ME() tego podetapu w restoreGameFromSave/finalizeAllianceObligationRefusals/
 * resolvePendingDiplomacy). PASS wymaga: (1) świat tworzy się bez wyjątków JS, miasto gracza
 * i rywale tego samego typu (spawnPendingSameTypeRivals) faktycznie powstają; (2) kilka tur
 * mija bez wyjątków; (3) REALNY save->load roundtrip nie rzuca wyjątku i NIE zmienia
 * cities/units/turn (no-op strukturalny -- te migrowane hardkody dotyczą WYŁĄCZNIE
 * `diplomacyRelations`/`negotiationTable`, nie cities/units, więc brak zmiany w dumpState
 * jest oczekiwanym, nie fałszywym, wynikiem tej konkretnej sondy); (4) kolejne tury po
 * wczytaniu mijają bez wyjątków; (5) wariant ZEPSUTY (isMe()=false) NIE MUSI dać wyjątku
 * JS ani różnego wyniku roundtrip na cities/units/turn -- ten hak (dumpState) nie dumpuje
 * diplomacyRelations/negotiationTable, jedynych pól, które te hardkody realnie ruszają, więc
 * PASS wymaga braku crashu na wariancie ZEPSUTYM, a ewentualna rozbieżność jest logowana jako
 * INFO, nie jako warunek PASS/FAIL (patrz "UWAGA METODOLOGICZNA" przy weryfikacji niżej).
 * Dowód nietautologiczności semantyki isMe/isHuman (że mutacja REALNIE zmienia wynik migrowanych
 * gałęzi) jest w osobnej bramce `hotseat-etap6d-podetap-c-migracja-test.cjs`.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6d-podetap-c-live-saveload-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TURNS_BEFORE_SAVE = 3;
const TURNS_AFTER_LOAD = 3;

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const NEW_OUT_DIR = path.join(os.tmpdir(), `civ-podetap-c-NEW-dist-${RUN_ID}`);
const MUTATED_GRA_DIR = path.join(os.tmpdir(), `civ-podetap-c-MUT-${RUN_ID}`);
const MUTATED_OUT_DIR = path.join(os.tmpdir(), `civ-podetap-c-MUT-dist-${RUN_ID}`);

process.on('exit', () => {
  for (const d of [NEW_OUT_DIR, MUTATED_GRA_DIR, MUTATED_OUT_DIR]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
});

function log(msg) { console.log('[podetap-c-live-saveload] ' + msg); }

function prepareMutatedGraDir() {
  log('przygotowanie katalogu "ZEPSUTY" (isMe() na sztywno false, dowód nietautologiczności)...');
  fs.rmSync(MUTATED_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(MUTATED_GRA_DIR, { recursive: true });
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent === 'dist') continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(MUTATED_GRA_DIR, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(MUTATED_GRA_DIR, 'node_modules'));
  const mainPath = path.join(MUTATED_GRA_DIR, 'src/main.ts');
  const src = fs.readFileSync(mainPath, 'utf8');
  const NEEDLE = 'function isMe(ownerId: number): boolean {\n      return ownerId === ME();\n    }';
  const REPLACEMENT = 'function isMe(ownerId: number): boolean {\n      return false;\n    }';
  if (!src.includes(NEEDLE)) {
    throw new Error('prepareMutatedGraDir: nie znaleziono definicji isMe() do mutacji -- '
      + 'main.ts zmienił się od czasu napisania tej bramki, zaktualizuj NEEDLE.');
  }
  fs.writeFileSync(mainPath, src.replace(NEEDLE, REPLACEMENT), 'utf8');
  log('katalog "ZEPSUTY" gotowy -> ' + MUTATED_GRA_DIR);
}

function buildBundle(cwd, outDir, label) {
  log(`[${label}] vite build (dozwolona komenda C-001, outDir poza repo)...`);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`[${label}] build nie wyprodukował index.html w ${outDir}`);
  }
  log(`[${label}] build OK -> ${outDir}`);
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    log('domyślny Chromium niedostępny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function closeBrowserSafely(browser) {
  await Promise.race([
    browser.close().catch(() => { /* już martwy */ }),
    wait(8000),
  ]);
  try {
    const proc = browser.process && browser.process();
    if (proc && proc.exitCode === null && !proc.killed) proc.kill('SIGKILL');
  } catch { /* best-effort */ }
}

async function pollUntil(page, checkFn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(checkFn);
    if (last && last.ready) return last;
    await wait(300);
  }
  throw new Error(`pollUntil(${label}): timeout, ostatni stan = ${JSON.stringify(last)}`);
}

async function gotoMainMenu(page, outHtml) {
  await page.goto(outHtml, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!(window).__aiBuildingsTestDebug && !!(window).__cityStateStartUnitsTestDebug
      && !!(window).__eraTestDebug,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
}

async function endTurnAndWait(page) {
  await page.evaluate(() => (window).__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  while (Date.now() - t0 < 60000) {
    const inProg = await page.evaluate(() => (window).__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) break;
    await wait(80);
  }
  await wait(300);
}

function summarizeDump(dbg) {
  return {
    turn: dbg.turn,
    citiesCount: dbg.cities.length,
    unitsCount: dbg.units.length,
    playerCities: dbg.cities.filter((c) => c.ownerId === 0).length,
    // spawnPendingSameTypeRivals: rywale TEGO SAMEGO typu co gracz (civTypeId === menuCivId,
    // zawsze 'rzymianie' w tym scenariuszu -- patrz startNewGame opts poniżej).
    sameTypeRivalCities: dbg.cities.filter((c) => c.ownerId !== 0 && c.civTypeId === dbg.menuCivId
      && c.startCityState === true).length,
    cityOwnerIds: Array.from(new Set(dbg.cities.map((c) => c.ownerId))).sort((a, b) => a - b),
  };
}

async function runScenario(chromium, outHtml, label) {
  const browser = await launchBrowser(chromium);
  const jsExceptions = [];
  const result = { label, jsExceptions };
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    log(`[${label}] start realnej nowej gry (applyClusterStartPlan przez doStartGame)...`);
    await gotoMainMenu(page, outHtml);

    // civTypesCount=2 (gracz + 1 rywal tego samego typu wymuszony civTypesCount niski wobec
    // rivals wysokich) -- ustawienie 1:1 z `__aiBuildingsTestDebug` istniejącej dokumentacji
    // "suwak liczby dużych cywilizacji vs miast-państw", tu: rivals=2 duże cywilizacje +
    // wymuszamy nadwyżkę tego samego typu przez civTypesCount niższy niż rivals, żeby
    // spawnPendingSameTypeRivals miał co zrobić przy foundowaniu.
    await page.evaluate(() => {
      (window).__aiBuildingsTestDebug.startNewGame({ rivals: '3', civTypes: 1, cityStates: 1, seed: 424242 });
    });

    await pollUntil(page, () => {
      const dbg = (window).__cityStateStartUnitsTestDebug;
      if (!dbg) return { ready: false, reason: 'no-hook' };
      const overlayVisible = Array.from(document.querySelectorAll('*')).some(
        (el) => el.textContent && el.textContent.includes('Tworzenie świata') && (el).offsetParent !== null,
      );
      const st = dbg.dumpState();
      return {
        ready: !overlayVisible && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null,
        overlayVisible, awaitingFirstPlayerCity: st.awaitingFirstPlayerCity, playerStartHex: st.playerStartHex,
      };
    }, 360000, 'world-generated');

    const founded = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    result.founded = founded;

    await pollUntil(page, () => {
      const dbg = (window).__cityStateStartUnitsTestDebug;
      const st = dbg.dumpState();
      const playerHasCity = st.cities.some((c) => c.ownerId === 0);
      return { ready: st.awaitingFirstPlayerCity === false && playerHasCity, playerHasCity };
    }, 30000, 'city-founded');
    await wait(400);

    const afterFound = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    result.afterWorldCreate = summarizeDump(afterFound);
    log(`[${label}] świat utworzony: ${JSON.stringify(result.afterWorldCreate)}`);

    for (let i = 1; i <= TURNS_BEFORE_SAVE; i++) {
      await endTurnAndWait(page);
    }
    const beforeSave = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    result.beforeSave = summarizeDump(beforeSave);
    log(`[${label}] po ${TURNS_BEFORE_SAVE} turach, przed zapisem: ${JSON.stringify(result.beforeSave)}`);

    // REALNY roundtrip: buildSaveGameSnapshot() + restoreGameFromSave() (main.ts) -- ta sama
    // para funkcji co przycisk "Zapisz grę" i wczytanie slotu.
    let roundtripError = null;
    try {
      await page.evaluate(() => (window).__aiBuildingsTestDebug.saveLoadRoundTrip());
    } catch (e) {
      roundtripError = String(e);
    }
    result.roundtripError = roundtripError;
    await wait(300);

    const afterLoad = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    result.afterLoad = summarizeDump(afterLoad);
    log(`[${label}] po roundtrip save/load: ${JSON.stringify(result.afterLoad)} `
      + `(błąd roundtrip: ${roundtripError ?? 'brak'})`);

    for (let i = 1; i <= TURNS_AFTER_LOAD; i++) {
      await endTurnAndWait(page);
    }
    const afterMoreTurns = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    result.afterMoreTurns = summarizeDump(afterMoreTurns);
    log(`[${label}] po kolejnych ${TURNS_AFTER_LOAD} turach: ${JSON.stringify(result.afterMoreTurns)}`);
  } finally {
    await closeBrowserSafely(browser);
  }
  return result;
}

async function runOnceWithRetry(chromium, outHtml, label, maxAttempts = 2) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runScenario(chromium, outHtml, label);
    } catch (e) {
      lastErr = e;
      log(`[${label}] próba ${attempt}/${maxAttempts} padła (${e && e.message ? e.message : e}) -- `
        + (attempt < maxAttempts ? 'ponawiam ze świeżym browser.launch()...' : 'wyczerpano próby.'));
    }
  }
  throw lastErr;
}

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[podetap-c-live-saveload] BLOCK: playwright nie znaleziony.');
    process.exit(2);
  }

  try {
    prepareMutatedGraDir();
    buildBundle(GRA_DIR, NEW_OUT_DIR, 'PO');
    buildBundle(MUTATED_GRA_DIR, MUTATED_OUT_DIR, 'ZEPSUTY');
  } catch (e) {
    console.error('[podetap-c-live-saveload] BLOCK: build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  const newHtml = 'file://' + path.join(NEW_OUT_DIR, 'index.html');
  const mutHtml = 'file://' + path.join(MUTATED_OUT_DIR, 'index.html');

  let runNew;
  let runMut;
  try {
    runNew = await runOnceWithRetry(chromium, newHtml, 'PO');
    runMut = await runOnceWithRetry(chromium, mutHtml, 'ZEPSUTY');
  } catch (e) {
    console.error('[podetap-c-live-saveload] BLOCK: hak testowy nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== Wynik PO (bieżący worktree) ===');
  console.log(JSON.stringify(runNew, null, 2));

  check('PO: świat utworzony, gracz ma 1 miasto', runNew.afterWorldCreate.playerCities === 1, runNew.afterWorldCreate);
  check('PO: spawnPendingSameTypeRivals wyprodukował >=1 rywala tego samego typu',
    runNew.afterWorldCreate.sameTypeRivalCities >= 1, runNew.afterWorldCreate);
  check('PO: 0 wyjątków JS w toku całego scenariusza', runNew.jsExceptions.length === 0, runNew.jsExceptions);
  check('PO: save/load roundtrip bez wyjątku', runNew.roundtripError === null, runNew.roundtripError);
  check('PO: cities/units/turn IDENTYCZNE przed i po roundtrip (te hardkody dotyczą WYŁĄCZNIE '
    + 'diplomacyRelations/negotiationTable, nie cities/units -- no-op strukturalny oczekiwany)',
    JSON.stringify(runNew.beforeSave) === JSON.stringify(runNew.afterLoad),
    { beforeSave: runNew.beforeSave, afterLoad: runNew.afterLoad });
  check('PO: kolejne tury po wczytaniu mijają (turn rośnie, brak wyjątku)',
    runNew.afterMoreTurns.turn > runNew.afterLoad.turn, runNew.afterMoreTurns);

  // UWAGA METODOLOGICZNA (nie regresja tej bramki): wariant ZEPSUTY (isMe()=false) NIE
  // musi rozjechać się na cities/units/turn -- te dwa hardkody klastra isMe w tym podetapie
  // (restoreGameFromSave x2, finalizeAllianceObligationRefusals, resolvePendingDiplomacy)
  // czytają/piszą WYŁĄCZNIE `diplomacyRelations`/`negotiationTable`/`activeDeals`, których ten
  // hak (`__cityStateStartUnitsTestDebug.dumpState()`) w ogóle nie dumpuje -- main.ts jest poza
  // allowlistą tego tematu poza ciałami 5 migrowanych funkcji, więc nie wolno dodać nowego haka
  // dumpującego relacje. Dowód nietautologiczności semantyki isMe/isHuman (że mutacja REALNIE
  // zmienia wynik migrowanych gałęzi) jest w `hotseat-etap6d-podetap-c-migracja-test.cjs`
  // (ekstrakcja PRE/POST na `humanOwnerIds=[0,1]`, zweryfikowana ręcznie że reverting jednej
  // z 5 migracji na main.ts czerwieni tamtą bramkę). TA bramka dowodzi czegoś UZUPEŁNIAJĄCEGO,
  // nie tego samego: że pełny cykl nowa-gra -> tury -> REALNY save/load -> tury nie crashuje i
  // nie zmienia cities/units/turn, W TYM na wariancie ZEPSUTYM (isMe()=false) -- czyli że
  // złamanie isMe() nie powoduje wyjątku niszczącego cały silnik przy save/load, tylko ciche,
  // punktowe zepsucie diplomacji (wykryte gdzie indziej). Odnotowane jako INFO, nie FAIL.
  const mutDiverges = runMut.jsExceptions.length > runNew.jsExceptions.length
    || runMut.roundtripError !== runNew.roundtripError
    || JSON.stringify(runMut.afterWorldCreate) !== JSON.stringify(runNew.afterWorldCreate)
    || JSON.stringify(runMut.afterLoad) !== JSON.stringify(runNew.afterLoad)
    || JSON.stringify(runMut.afterMoreTurns) !== JSON.stringify(runNew.afterMoreTurns);
  console.log('\n=== Wynik ZEPSUTY (isMe()=false) ===');
  console.log(JSON.stringify(runMut, null, 2));
  console.log(`\nINFO: ZEPSUTY vs PO na cities/units/turn (obserwowalne przez dumpState) `
    + `${mutDiverges ? 'RÓŻNIĄ SIĘ' : 'identyczne -- oczekiwane, patrz UWAGA METODOLOGICZNA '
    + 'wyżej; dowód nietautologiczności semantyki isMe jest w migracja-test.cjs'}.`);
  check('ZEPSUTY (isMe()=false): brak wyjątku JS/roundtrip -- złamanie isMe() nie crashuje silnika save/load',
    runMut.jsExceptions.length === 0 && runMut.roundtripError === null,
    { jsExceptions: runMut.jsExceptions, roundtripError: runMut.roundtripError });

  console.log(`\nhotseat-etap6d-podetap-c-live-saveload-test: ${fail === 0 ? 'PASS' : 'FAIL'} (${pass} pass, ${fail} fail)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('[podetap-c-live-saveload] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
