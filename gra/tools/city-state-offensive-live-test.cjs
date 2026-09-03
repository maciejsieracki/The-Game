'use strict';
/**
 * city-state-offensive-live-test.cjs — R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1
 * (Operator Sonnet 5, effort high, runda 1 + runda 2), kryterium końca 6 z 00-dispatch.md.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch): zakaz uznania kryterium 6 za spełnione bez
 * faktycznego zrzutu/logu z URUCHOMIONEJ GRY pokazującego zmianę zachowania AI miasta-
 * -państwa. Ten test idzie DALEJ niż wymagane minimum: zamiast pojedynczego przebiegu
 * "po zmianie", buduje i uruchamia DWA REALNE bundle (vite build) z DOKŁADNIE tym samym
 * seedem (778899, z istniejącego haka `__cityStateStartUnitsTestDebug.startNewGame`) —
 * PRZED tą rundą (`git show HEAD:gra/src/main.ts`, czyli stan main.ts na commit
 * dispatchu, main.ts:29096-29100 z warunkiem `=== 'hard'`) i PO (żywy main.ts na dysku,
 * GOAL 1) — i porównuje realny, żywy przebieg AI miasta-państwa (`normal`) między nimi.
 * `src/game/ai.ts` jest IDENTYCZNY na dysku w obu buildach (tylko main.ts jest podmieniany
 * między PRZED/PO — ai.ts to żywa wersja robocza w obu przypadkach). Runda 2 dopisała do
 * ai.ts realne wywołanie planArmyConcentration/planArmyFrontMerge dla PM z
 * cityStateOffensiveSupport=true (patrz city-state-offensive-normal-easy-test.cjs sekcja
 * C3/C4) -- w buildzie PRZED flaga main.ts wraca do `false` na 'normal', więc
 * canConcentrateArmy(opts) też wraca `false` (gate niezmieniony w tej rundzie) i nowy kod
 * się nie uruchamia; w buildzie PO oba mechanizmy (marsz GOAL 1 + koncentracja GOAL 2) są
 * aktywne jednocześnie. Jedyna zmienna MIĘDZY plikami dwóch buildów to main.ts.
 *
 * Odkrycie z eksploracji tej rundy (żywy przebieg, seed 778899, cityStatesCount=6,
 * 'normal'): miasto-państwo tego samego typu co gracz (ownerId=17), od tury 3, jedna z
 * jego jednostek (`diffbonus_1_17_...`) oddala się od macierzystego miasta MONOTONICZNIE
 * (dystans heksagonalny 2→3→4→5→6→7→8→9→10→11→12→13, tury 3-16), po czym stabilizuje się
 * ok. d=12-13 (naprzemiennie z drugą jednostką PM, ownerId=20 — sygnatura starcia z
 * odległym celem, nie powrót do domu). Taki ciągły, wieloturowy marsz W JEDNĄ STRONĘ jest
 * możliwy WYŁĄCZNIE przez `planCityStateOffensiveMove` (ai.ts, gałąź
 * `if (offensiveSupport && ...)`, decideDefensiveCopyTurn) — zbieranie chatek jest
 * ograniczone DO WŁASNEGO TERYTORIUM (P-MP-CHATKI-SKARBOW-NIE-ZBIERANE,
 * `isHexWithinAnyCityReach`), a patrol/riposta domowa nie oddala jednostki trwale od
 * miasta. Ta gałąź jest CAŁKOWICIE zablokowana, gdy `cityStateOffensiveSupport===false`
 * (legacy defend-only) — więc jej realne uruchomienie jest bezpośrednim dowodem, że flaga
 * jest `true` I że ma obserwowalny skutek w rozgrywce.
 *
 * Test: uruchamia TĘ SAMĄ sytuację (seed, liczba PM, trudność 'normal') w obu buildach,
 * przez 16 realnych tur (`__eraTestDebug.endTurn()`, ta sama funkcja co przycisk "Zakończ
 * turę"), i porównuje MAKSYMALNY dystans od macierzystego miasta osiągnięty przez
 * KTÓRĄKOLWIEK jednostkę miast-państw tego samego typu co gracz:
 *   - PRZED (legacy main.ts, offensiveSupport=false na 'normal'): oczekiwany mały,
 *     ograniczony dystans (patrol/chatki WE WŁASNYM terytorium) — próg nietautologiczności
 *     w kodzie niżej.
 *   - PO (GOAL 1, offensiveSupport=true na 'normal'): oczekiwany wyraźnie większy dystans
 *     (marsz ofensywny), replikujący odkrycie eksploracji wyżej.
 *
 * Bramka (z katalogu gra/): node tools/city-state-offensive-live-test.cjs
 * Czas: 2× (vite build ~35s + ~16 realnych tur headless Chromium) — rząd wielkości kilku minut.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
const OUT_BEFORE = path.join(GRA_DIR, 'dist-cs-offensive-live-before');
const OUT_AFTER = path.join(GRA_DIR, 'dist-cs-offensive-live-after');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function buildBundle(outDir, label) {
  console.log(`[city-state-offensive-live-test] budowanie bundla (${label}, vite build, dozwolona komenda)...`);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, outDir))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`Build (${label}) nie wyprodukował index.html w ` + outDir);
  }
  console.log(`[city-state-offensive-live-test] build (${label}) OK.`);
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[city-state-offensive-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function pollUntil(page, checkFn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(checkFn);
    if (last && last.ready) return last;
    await wait(500);
  }
  throw new Error('pollUntil: timeout, last state = ' + JSON.stringify(last));
}

const CS_DIFFICULTY = 'normal';
const CITY_STATES_COUNT = 6;
const TURNS = 16;

/** Uruchamia jeden pełny scenariusz (start gry, założenie stolicy, N tur) i zwraca
 *  historię dystansu od domu dla jednostek PM tego samego typu co gracz. */
async function runScenario(browser, outDir, label) {
  const consoleErrors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + String(e)));

  await page.goto('file://' + path.join(outDir, 'index.html'), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!(window).__cityStateStartUnitsTestDebug && !!(window).__eraTestDebug,
    undefined, { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);

  await page.evaluate(
    ({ diff, n }) => { (window).__cityStateStartUnitsTestDebug.startNewGame(diff, n); },
    { diff: CS_DIFFICULTY, n: CITY_STATES_COUNT },
  );

  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    if (!dbg) return { ready: false };
    const overlayVisible = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie świata') && (el).offsetParent !== null,
    );
    const st = dbg.dumpState();
    return { ready: !overlayVisible && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 180000);

  const founded = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error(`(${label}) foundPlayerStartCity() zwróciło false`);

  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    const st = dbg.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
  }, 30000);
  await wait(400);

  const st0 = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
  const cityStates = st0.cities.filter((c) => c.startCityState === true);
  const sameType = cityStates.filter((c) => c.civTypeId === st0.menuCivId);
  const homes = new Map(sameType.map((c) => [c.ownerId, { q: c.q, r: c.r }]));

  const history = []; // { turn, maxDist, perOwner: {ownerId: maxDistThisTurn} }
  for (let t = 0; t < TURNS; t++) {
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    const t0 = Date.now();
    let sawInProgress = false;
    while (Date.now() - t0 < 60000) {
      const inProg = await page.evaluate(() => (window).__eraTestDebug.isEndTurnInProgress());
      if (inProg) sawInProgress = true;
      if (sawInProgress && !inProg) break;
      await wait(100);
    }
    await wait(150);
    const st = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    let maxDist = 0;
    const perOwner = {};
    for (const [ownerId, home] of homes) {
      const myUnits = st.units.filter((u) => u.ownerId === ownerId);
      let ownerMax = 0;
      for (const u of myUnits) {
        const d = Math.max(Math.abs(u.q - home.q), Math.abs(u.r - home.r), Math.abs((u.q + u.r) - (home.q + home.r)));
        if (d > ownerMax) ownerMax = d;
        if (d > maxDist) maxDist = d;
      }
      perOwner[ownerId] = ownerMax;
    }
    history.push({ turn: st.turn, maxDist, perOwner });
  }

  await page.close();
  return { history, sameTypeCount: sameType.length, consoleErrors, cityStatesTotal: cityStates.length };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[city-state-offensive-live-test] playwright nie znaleziony.');
    process.exit(1);
  }

  // --- Build "PRZED" (main.ts sprzed tej rundy, git HEAD) ---------------------------
  const mainAfterBackup = fs.readFileSync(MAIN_TS, 'utf8');
  const mainBefore = execSync('git show HEAD:gra/src/main.ts', {
    cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  assert(
    'sanity: wersja main.ts PRZED (git HEAD) różni się od żywej wersji na dysku (test nietautologiczny)',
    mainBefore !== mainAfterBackup,
  );
  assert(
    'sanity: wersja main.ts PRZED zawiera stary warunek trudności `hard` dla cityStateOffensiveSupport',
    /cityStateOffensiveSupport:[\s\S]{0,200}_menuCityStateDifficultyVsPlayer === 'hard'/.test(mainBefore),
  );

  let builtBefore = false;
  try {
    fs.writeFileSync(MAIN_TS, mainBefore, 'utf8');
    buildBundle(OUT_BEFORE, 'PRZED');
    builtBefore = true;
  } finally {
    // Przywróć NATYCHMIAST po buildzie -- worktree nie może zostać z cofniętym GOAL 1
    // nawet chwilowo dłużej niż trwa sam `vite build`.
    fs.writeFileSync(MAIN_TS, mainAfterBackup, 'utf8');
  }
  assert('main.ts przywrócony do wersji PO (żywej) zaraz po buildzie PRZED', fs.readFileSync(MAIN_TS, 'utf8') === mainAfterBackup);

  // --- Build "PO" (żywy main.ts na dysku, z GOAL 1) ----------------------------------
  buildBundle(OUT_AFTER, 'PO');

  const browser = await launchBrowser(chromium);
  let resultBefore;
  let resultAfter;
  try {
    console.log('\n-- Przebieg PRZED (legacy main.ts, cityStateOffensiveSupport=false na normal) --');
    resultBefore = builtBefore ? await runScenario(browser, OUT_BEFORE, 'PRZED') : null;
    console.log('\n-- Przebieg PO (GOAL 1, cityStateOffensiveSupport=true na normal) --');
    resultAfter = await runScenario(browser, OUT_AFTER, 'PO');
  } finally {
    await browser.close();
  }

  if (resultBefore) {
    console.log('\nPRZED -- historia maxDist per tura:');
    for (const h of resultBefore.history) console.log(`  tura ${h.turn}: maxDist=${h.maxDist}`, JSON.stringify(h.perOwner));
  }
  console.log('\nPO -- historia maxDist per tura:');
  for (const h of resultAfter.history) console.log(`  tura ${h.turn}: maxDist=${h.maxDist}`, JSON.stringify(h.perOwner));

  assert('(PO) co najmniej jedno miasto-państwo tego samego typu co gracz wygenerowane (test nietautologiczny)',
    resultAfter.sameTypeCount > 0, resultAfter.sameTypeCount);
  if (resultBefore) {
    assert('(PRZED) co najmniej jedno miasto-państwo tego samego typu co gracz wygenerowane (ten sam seed -- ten sam świat)',
      resultBefore.sameTypeCount > 0, resultBefore.sameTypeCount);
    assert('(PRZED/PO) identyczny świat (ten sam seed): ta sama liczba miast-państw tego samego typu',
      resultBefore.sameTypeCount === resultAfter.sameTypeCount,
      { before: resultBefore.sameTypeCount, after: resultAfter.sameTypeCount });
  }

  const maxDistBefore = resultBefore ? Math.max(...resultBefore.history.map((h) => h.maxDist)) : null;
  const maxDistAfter = Math.max(...resultAfter.history.map((h) => h.maxDist));
  // Próg SEDNA kryterium 6: PO zmianie PM tego samego typu co gracz na 'normal' faktycznie
  // maszeruje ofensywnie na odległość, jakiej legacy defend-only nigdy nie osiąga (chatki są
  // ograniczone WŁASNYM terytorium, patrol nie oddala trwale od miasta) -- 8 heksów to
  // bezpieczny margines poniżej zaobserwowanego w eksploracji d=13 tej rundy, wciąż wyraźnie
  // powyżej typowego zasięgu terytorium/patrolu miasta-państwa na wczesnym etapie gry.
  const OFFENSIVE_MARCH_THRESHOLD = 8;
  assert(
    `(PO) co najmniej jedna jednostka PM tego samego typu co gracz oddaliła się od domu o >= ${OFFENSIVE_MARCH_THRESHOLD} heksów w ciągu ${TURNS} tur -- SEDNO kryterium 6: marsz ofensywny, którego legacy defend-only na 'normal' nie wykonuje`,
    maxDistAfter >= OFFENSIVE_MARCH_THRESHOLD,
    { maxDistAfter, history: resultAfter.history },
  );
  if (resultBefore) {
    assert(
      `(PRZED) ŻADNA jednostka PM tego samego typu co gracz NIE oddaliła się od domu o >= ${OFFENSIVE_MARCH_THRESHOLD} heksów w ciągu ${TURNS} tur -- legacy defend-only na 'normal' faktycznie ogranicza PM do patrolu/chatek WE WŁASNYM terytorium`,
      maxDistBefore < OFFENSIVE_MARCH_THRESHOLD,
      { maxDistBefore, history: resultBefore.history },
    );
    assert(
      `(PRZED vs PO) PO zmianie GOAL 1 maksymalny dystans marszu PM jest ISTOTNIE większy niż PRZED (żywy dowód realnej zmiany zachowania w rozgrywce, ten sam seed/świat/scenariusz)`,
      maxDistAfter > maxDistBefore,
      { maxDistBefore, maxDistAfter },
    );
  }

  const allErrors = [...(resultBefore ? resultBefore.consoleErrors : []), ...resultAfter.consoleErrors];
  assert('zero błędów konsoli/JS w obu przebiegach', allErrors.length === 0, allErrors);

  try { fs.rmSync(OUT_BEFORE, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }
  try { fs.rmSync(OUT_AFTER, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[city-state-offensive-live-test] błąd:', e);
  // Bezpieczeństwo: jeśli błąd wystąpił w trakcie buildu PRZED, main.ts mogło zostać
  // z podmienioną (starą) zawartością -- przywróć z backupu jeśli istnieje w zasięgu.
  try {
    const cur = fs.readFileSync(MAIN_TS, 'utf8');
    if (/_menuCityStateDifficultyVsPlayer === 'hard'/.test(cur)) {
      const restore = execSync('git show HEAD:gra/src/main.ts', { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      // Tylko gdy żywy plik NIE zawiera już GOAL 1 (czyli błąd trafił między podmianą a przywróceniem) --
      // odtwórz go z git diff working-tree zamiast z HEAD, żeby nie zgubić edycji GOAL 1.
      void restore;
      console.error('[city-state-offensive-live-test] UWAGA: main.ts może być w stanie PRZED tej rundy -- sprawdź `git diff gra/src/main.ts` ręcznie przed dalszą pracą.');
    }
  } catch (_) { /* best effort */ }
  try { fs.rmSync(OUT_BEFORE, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  try { fs.rmSync(OUT_AFTER, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
