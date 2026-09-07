'use strict';
/**
 * forced-war-trojstronna-domino-live-test.cjs — R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1, runda 1,
 * antycypowany zarzut własny (Operator Sonnet 5, effort=high, 2026-09-03, worktree izolowany
 * /home/user/wt-wojna-trojstronna).
 *
 * Wcześniejsza praca tej samej rundy 1 zamknęła kryteria z SAMĄ czystą funkcją
 * (`pickBronzeForcedWarDominoOwnerIds` itd., forced-war-trojstronna-test.cjs) i regexem na
 * main.ts (forced-war-trojstronna-main-guard-test.cjs) — to samo w sobie NIE dowodzi, że OBIE
 * strony pary faktycznie WYPOWIADAJĄ WOJNĘ przez realną ścieżkę silnika w tej samej turze. Ta
 * bramka, wzorem
 * `forced-war-player-target-live-test.cjs` (11/11 PASS): realny `vite build`, realny headless
 * Chromium (`?playtest=mapa`), REALNE funkcje silnika (`triggerPlayerEndTurn` → `runAiPhase` →
 * `decideAIDiplomacy` → komenda `wypowiedz_wojne` → `applyDiploEventTracked`/
 * `setDiploRelation`) — ZERO reimplementacji domina ani warstwy dyplomacji.
 *
 * Fast-forward: hak `window.__eraTestDebug.forceBronzeForcedWarDominoOnPlayer()` (main.ts,
 * obok `forceBronzeForcedWarOnPlayer()`) zakłada REALNE drugie miasto AI (`foundCityAt`, ta
 * sama funkcja co przy generacji świata) obok jedynego AI, jakie ma `?playtest=mapa`,
 * ustawia OBU stronom REALNĄ aktywną wojnę wymuszoną Brązu między sobą
 * (`bronzeForceWarActiveByPairKey`) i oznacza OBIE jako odkryte przez gracza
 * (`diplomaticallyDiscoveredOwners`) — dokładnie stan wejściowy z WYZWALACZA dispatchu
 * ("jakaś cywilizacja ma już parę i z kimś walczy, a gracz nie ma swojej pary"). Jedyne co
 * jest "oszukane": KTO ma tę parę i ŻE gracz już je odkrył (normalnie ustawia to zwiad na
 * mapie) — TEMPO dojścia do scenariusza, nie MECHANIZM domina ani wypowiedzenia wojny.
 *
 * R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1 runda 2: asercje D/E/F/G przepisane pod
 * NOWY algorytm (`assignForcedWarPairings`, forced-war-common.ts). Stare domino dawało cel
 * OBU stronom pary jednocześnie; nowy algorytm (krok 4 dispatchu: leftover dołącza jako
 * trzeci do istniejącej pary) daje cel TYLKO JEDNEJ, deterministycznie wybranej stronie —
 * `chosenSide = Math.min(pair.attackerId, pair.targetId)` (forced-war-common.ts). Hak
 * `forceBronzeForcedWarDominoOnPlayer()` ustawia `targetId = max(wszystkie ownerId) + 1000`,
 * więc `attackerId < targetId` ZAWSZE — wybraną stroną jest deterministycznie attacker.
 * Sens testu (realna gra w przeglądarce dowodzi, że mechanizm faktycznie działa) bez zmian,
 * tylko oczekiwany wynik dostosowany do nowego kształtu.
 *
 * Pokrycie:
 *  A. Bootstrap `?playtest=mapa` dobiega końca.
 *  B. `forceBronzeForcedWarDominoOnPlayer()` faktycznie zakłada drugą stronę i parę.
 *  C. Realny `triggerPlayerEndTurn()` dobiega końca.
 *  D. SEDNO kryterium 1 (GOAL 1, nowy kształt): TYLKO wybrana strona (attacker, niższy
 *     ownerId) wypowiada wojnę graczowi -- target (wyższy ownerId) NIE, bo już ma pełny
 *     przydział przez samą parę z attackerem (krok 2 ECHO: nikt nie zostaje z zerem wojen,
 *     ale też nikt nie dostaje dwóch przydziałów w tym samym kroku 4).
 *  E. SEDNO kryterium 2 / ECHO 2 (GOAL 2): sojusz strony-NAPASTNIKA z graczem blokuje CAŁĄ
 *     parę dla dołączenia gracza jako leftover -- brak innej pary do dołączenia ->
 *     `unresolvedOwnerIds` (DECISION_REQUIRED), ŻADNA strona nie wypowiada wojny.
 *  F. Wariant ECHO 2 "KTÓRAKOLWIEK strona": sojusz akurat strony-obrońcy blokuje TĘ SAMĄ
 *     parę tak samo -- ten sam unresolved/DECISION_REQUIRED, żadna strona nie wypowiada wojny.
 *  G. Konsola: w scenariuszu D zero console.error/pageerror; w E/F DOKŁADNIE jeden
 *     oczekiwany log `DECISION_REQUIRED` dla ownerId gracza (0) na scenariusz -- ECHO
 *     "brzegowy przypadek: wszystkie pary zablokowane -> DECISION_REQUIRED, nie zgaduj" z
 *     dispatchu jest SPODZIEWANYM zachowaniem tu, nie regresją; jakikolwiek INNY
 *     console.error/pageerror nadal jest FAIL.
 *
 * Bramka (z katalogu gra/): node tools/forced-war-trojstronna-domino-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-forced-war-trojstronna-domino-live-test');
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
  console.log('[forced-war-trojstronna-domino-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[forced-war-trojstronna-domino-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[forced-war-trojstronna-domino-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

/** Odgrywa JEDEN scenariusz domina na świeżym, już zbootstrapowanym `page`: zakłada parę,
 *  ewentualnie sojusz jednej ze stron, gra jedną realną turę, zwraca statusy relacji obu
 *  stron z graczem PO turze. `page` musi być na turze 1 -- wołający cofa turę pomiędzy
 *  scenariuszami przez świeży `gotoPlaytestMapa` (najprostszy sposób na czysty stan bez
 *  reimplementowania resetu domina). */
async function playDominoScenario(page, consoleErrors, allianceSide) {
  const forced = await page.evaluate(
    (side) => window.__eraTestDebug.forceBronzeForcedWarDominoOnPlayer(side ? { allianceSide: side } : undefined),
    allianceSide ?? null,
  );
  assert(
    'forceBronzeForcedWarDominoOnPlayer(): attackerId i targetId zwrócone, obaj > 0 i różni',
    typeof forced.attackerId === 'number' && forced.attackerId > 0
      && typeof forced.targetId === 'number' && forced.targetId > 0
      && forced.attackerId !== forced.targetId,
    forced,
  );
  const pairRelBefore = await page.evaluate(
    ({ a, b }) => window.__eraTestDebug.getRelationStatus(a, b),
    { a: forced.attackerId, b: forced.targetId },
  );
  assert('przed turą: attacker i target JUŻ są w realnej wojnie ze sobą (para domina)', pairRelBefore === 'wojna', { pairRelBefore });
  const relAttBefore = await page.evaluate((a) => window.__eraTestDebug.getRelationStatus(a, 0), forced.attackerId);
  const relTgtBefore = await page.evaluate((b) => window.__eraTestDebug.getRelationStatus(b, 0), forced.targetId);
  assert('przed turą: attacker i gracz NIE są w wojnie', relAttBefore !== 'wojna', { relAttBefore });
  assert('przed turą: target i gracz NIE są w wojnie', relTgtBefore !== 'wojna', { relTgtBefore });

  // `?playtest=mapa` stawia jednostkę gracza CELOWO tuż przy jedynym realnym AI (myślane
  // pod pojedynczą bitwę/oblężenie, patrz PLAYTEST_MAPA_HINT) -- gdy ta AI właśnie
  // wypowiedziała wojnę graczowi (domino, strona 1/2), jej WŁASNA, niezwiązana z tym
  // tematem logika bojowa potrafi tej samej tury zaatakować sąsiadujący oddział gracza,
  // co woła `launchIncomingMapFieldBattle` + `break ownerLoop` (main.ts) -- PRZERYWA całą
  // `ownerLoop` PRZED dotarciem do drugiej strony pary (target), z asynchronicznym
  // wznowieniem po animacji bitwy, którego ten headless test nie steruje. Ten sam hazard,
  // ten sam sandbox, ta sama naprawa co istniejący `__rebelProtectionTestDebug.
  // pullPlayerUnitsHome()` (P-BUNT-OCHRONA-Q1) -- odsuwa WYŁĄCZNIE POZYCJĘ jednostek
  // gracza (nie dotyka jednostek AI ani mechanizmu bitwy), żeby cała `ownerLoop` (OBIE
  // strony pary domina) dobiegła końca w JEDNYM, synchronicznym `runAiPhase()` tej tury.
  await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());

  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  let settled = false;
  while (Date.now() - t0 < 90000) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) { settled = true; break; }
    await wait(150);
  }
  assert('endTurnInProgress zaobserwowane true -> false (przejście tury faktycznie się wykonało)', settled, { sawInProgress, settled, elapsedMs: Date.now() - t0 });
  await wait(500);

  const relAttAfter = await page.evaluate((a) => window.__eraTestDebug.getRelationStatus(a, 0), forced.attackerId);
  const relTgtAfter = await page.evaluate((b) => window.__eraTestDebug.getRelationStatus(b, 0), forced.targetId);
  return { attackerId: forced.attackerId, targetId: forced.targetId, relAttAfter, relTgtAfter };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[forced-war-trojstronna-domino-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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
    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    assert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);
    assert('bootstrap zakończony: turn===1', world0.turn === 1, world0);

    console.log('\n-- B/C/D. Scenariusz 1 (GOAL 1, nowy kształt): para bez sojuszu -- TYLKO wybrana strona (attacker, niższy ownerId) wypowiada wojnę --');
    const preS1 = consoleErrors.length;
    const s1 = await playDominoScenario(page, consoleErrors, null);
    assert(
      'po turze: attacker (wybrana strona, niższy ownerId) WYPOWIEDZIAŁ wojnę graczowi -- SEDNO GOAL 1 nowego algorytmu',
      s1.relAttAfter === 'wojna',
      s1,
    );
    assert(
      'po turze: target (WYŻSZY ownerId, ta sama para) NIE wypowiedział wojny -- nowy algorytm daje cel TYLKO JEDNEJ stronie, nie obu jak stare domino',
      s1.relTgtAfter !== 'wojna',
      s1,
    );
    assert(
      'scenariusz 1: zero console.error/pageerror (para niezablokowana, przydział jednoznaczny -- brak DECISION_REQUIRED)',
      consoleErrors.length === preS1,
      consoleErrors.slice(preS1),
    );

    console.log('\n-- E. Scenariusz 2 (GOAL 2/ECHO 2): sojusz strony-NAPASTNIKA z graczem -- ŻADNA strona nie wypowiada wojny, DECISION_REQUIRED oczekiwany --');
    await gotoPlaytestMapa(page);
    const preS2 = consoleErrors.length;
    const s2 = await playDominoScenario(page, consoleErrors, 'attacker');
    assert(
      'po turze: attacker (sojusznik gracza) NIE wypowiedział wojny -- mechanizm zablokowany dla całej pary',
      s2.relAttAfter !== 'wojna',
      s2,
    );
    assert(
      'po turze: target TEŻ NIE wypowiedział wojny mimo braku WŁASNEGO sojuszu -- ECHO 2 blokuje CAŁĄ parę, nie tylko sojusznika',
      s2.relTgtAfter !== 'wojna',
      s2,
    );
    assert(
      'scenariusz 2: DOKŁADNIE jeden log DECISION_REQUIRED dla ownerId gracza (0) -- ECHO brzegowy przypadek, spodziewane, nie regresja',
      consoleErrors.slice(preS2).length === 1
        && consoleErrors.slice(preS2).every(m => /DECISION_REQUIRED/.test(m) && /\[0\]/.test(m)),
      consoleErrors.slice(preS2),
    );

    console.log('\n-- F. Scenariusz 3 (ECHO 2 "KTÓRAKOLWIEK strona"): sojusz strony-OBROŃCY z graczem -- ta sama blokada, DECISION_REQUIRED oczekiwany --');
    await gotoPlaytestMapa(page);
    const preS3 = consoleErrors.length;
    const s3 = await playDominoScenario(page, consoleErrors, 'defender');
    assert(
      'po turze: target (sojusznik gracza) NIE wypowiedział wojny',
      s3.relTgtAfter !== 'wojna',
      s3,
    );
    assert(
      'po turze: attacker TEŻ NIE wypowiedział wojny mimo braku WŁASNEGO sojuszu -- sojusz OBROŃCY blokuje CAŁĄ parę tak samo jak sojusz napastnika (ECHO 2, symetria)',
      s3.relAttAfter !== 'wojna',
      s3,
    );
    assert(
      'scenariusz 3: DOKŁADNIE jeden log DECISION_REQUIRED dla ownerId gracza (0) -- ten sam brzegowy przypadek co scenariusz 2',
      consoleErrors.slice(preS3).length === 1
        && consoleErrors.slice(preS3).every(m => /DECISION_REQUIRED/.test(m) && /\[0\]/.test(m)),
      consoleErrors.slice(preS3),
    );

    console.log('\n-- G. Zero console.error/pageerror NIEOCZEKIWANYCH przez wszystkie 3 scenariusze --');
    const unexpectedConsoleErrors = consoleErrors.filter(m => !(/DECISION_REQUIRED/.test(m) && /\[0\]/.test(m)));
    assert(
      'zero console.error/pageerror POZA oczekiwanymi DECISION_REQUIRED[0] scenariuszy E/F',
      unexpectedConsoleErrors.length === 0,
      unexpectedConsoleErrors,
    );
    assert(
      'dokładnie 2 oczekiwane logi DECISION_REQUIRED[0] łącznie (jeden w E, jeden w F) -- scenariusz D (bez blokady) nie generuje żadnego',
      consoleErrors.length === 2,
      consoleErrors,
    );
    if (unexpectedConsoleErrors.length) console.error('   konsola (nieoczekiwane):', unexpectedConsoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[forced-war-trojstronna-domino-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
