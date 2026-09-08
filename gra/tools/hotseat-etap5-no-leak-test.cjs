'use strict';
/**
 * hotseat-etap5-no-leak-test.cjs — R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1.
 *
 * Bramka dowodu "no leak" dla `switchActiveHuman()`/`ui/hotSeatHandoff.ts`, wg planu
 * `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/01-operator-runda1-analiza.md`
 * §4. Reużywa `buildBundle()`/`launchBrowser()`/`runOnceWithRetry`-owy wzorzec/
 * `closeBrowserSafely` z `hotseat-etap4-noop-test.cjs` (ten sam mechanizm, nie budowa od
 * zera — recon §4.1: main.ts nie jest modułem, DOM/THREE.js część zakresu wymaga
 * realnego Chromium, nie samego esbuild/Node).
 *
 * DWA SCENARIUSZE (recon §4.2), NIEZALEŻNE strony przeglądarki:
 *  - SCENARIUSZ A: fotel A ma już miasto (`startNewGame` + `foundPlayerStartCity`) —
 *    ćwiczy normalną ścieżkę handoff, `exitBuildMode()` bez guarda
 *    (`isAwaitingFirstPlayerCity()===false`). 8 kategorii asercji z recon §4.2 + dowód
 *    "brak migotania" (punkt 8).
 *  - SCENARIUSZ B: fotel A jest W TRAKCIE `isAwaitingFirstPlayerCity()===true` (świeży
 *    `startNewGame`, `foundPlayerStartCity()` CELOWO NIEWOŁANE) — ćwiczy gałąź guard-true
 *    KROKU 1c `switchActiveHuman()`, w której `exitBuildMode()` jest no-opem (main.ts,
 *    invariant R-PIERWSZE-MIASTO). Rozstrzygnięcie TODO z dispatchu pkt 5: `startNewGame`
 *    NIE daje automatycznie miasta startowego — `beginOnboardingFoundCity()` (main.ts)
 *    ustawia `foundCityMode=true`/`buildModeOpen=true` od razu po generacji świata, PRZED
 *    jakimkolwiek kliknięciem gracza — więc Scenariusz B nie potrzebuje osobnego haka
 *    czyszczącego `cities`/`playerEverOwnedCity`: wystarczy PO PROSTU nie wołać
 *    `foundPlayerStartCity()`.
 *
 * Każda realna akcja fotela A (zaznaczenie jednostki, otwarcie panelu miasta, kamera,
 * hint, build-mode) idzie PRAWDZIWĄ ścieżką silnika (`selectPlayerUnit` przez istniejący
 * hak `__mglaSciezkaTestDebug.selectUnit`, `openCityPanelForPlayer` przez własny hak
 * niżej, `focusCameraOnOwnerCapital` przez własny hak, toolbar/build-panel przez REALNE
 * kliknięcia DOM) — REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu zakazuje sztucznego stanu.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap5-no-leak-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_STATES_COUNT = 2;

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap5-noleak-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-etap5-no-leak-test] ' + msg); }

function buildBundle() {
  log('budowanie bundla (vite build, jedyna dozwolona komenda buildu, C-001)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  log('build OK -> ' + OUT_DIR);
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

// Zamknięcie przeglądarki z twardym limitem czasu (naprawa Evaluatora Etapu 4, wzorzec
// 1:1 przejęty z `hotseat-etap4-noop-test.cjs`) — `browser.close()` na martwym uchwycie
// potrafi nigdy się nie rozstrzygnąć.
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
    await wait(400);
  }
  throw new Error(`pollUntil(${label}): timeout, ostatni stan = ${JSON.stringify(last)}`);
}

async function gotoMainMenu(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!(window).__cityStateStartUnitsTestDebug && !!(window).__hotSeatTestDebug
      && !!(window).__mglaSciezkaTestDebug,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
}

// Świeży bootstrap: REALNY doStartGame (main.ts, ta sama funkcja co klik "Start" w
// kreatorze) przez `__cityStateStartUnitsTestDebug.startNewGame` — wzorzec 1:1 przejęty z
// `hotseat-etap4-noop-test.cjs::startRealNewGame` (bez `foundPlayerStartCity`, wołane
// osobno przez wywołującego, bo Scenariusz B CELOWO go pomija).
async function startWorldOnly(page) {
  await gotoMainMenu(page);
  await page.evaluate(({ n }) => {
    (window).__cityStateStartUnitsTestDebug.startNewGame('normal', n);
  }, { n: CITY_STATES_COUNT });

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
  }, 180000, 'world-generated');
  await wait(300);
}

async function foundCapital(page) {
  const founded = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error('foundPlayerStartCity() zwróciło false -- stolica gracza nie założona');
  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    const st = dbg.dumpState();
    const playerHasCity = st.cities.some((c) => c.ownerId === 0);
    return { ready: st.awaitingFirstPlayerCity === false && playerHasCity, playerHasCity };
  }, 30000, 'city-founded');
  await wait(400);
}

// -----------------------------------------------------------------------------------
// SCENARIUSZ A -- owner 0 ma już miasto (exitBuildMode() gałąź guard-false).
// -----------------------------------------------------------------------------------
async function runScenarioA(chromium) {
  const browser = await launchBrowser(chromium);
  const jsExceptions = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => jsExceptions.push(String(e)));
    if (process.env.HOTSEAT_NOLEAK_DEBUG) {
      page.on('console', (m) => console.log('[page:A:' + m.type() + ']', m.text()));
    }

    log('[A] świeży startNewGame + foundPlayerStartCity...');
    await startWorldOnly(page);
    await foundCapital(page);

    const st0 = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2 (Evaluator Zarzut #1, potwierdzone niezależnym
    // debug-dumpem): ta gra NIE nadaje graczowi (ownerId===0) ŻADNEJ jednostki automatycznie
    // po foundPlayerStartCity() -- `st0.units.find(u => u.ownerId === 0)` byłoby zawsze
    // `undefined`. Jedyna REALNA droga do pierwszej jednostki gracza to kolejka produkcji
    // miasta po wielu turach (poza zakresem tej bramki -- dotyka triggerPlayerEndTurn(),
    // zakazanego allowlistą). Zamiast tego: `spawnTestUnitForPlayer` (nowy hak, main.ts)
    // klonuje istniejący szablon jednostki wojskowej z ownerId=0 -- jedyna sztuczność jest w
    // SPAWNIE, samo ZAZNACZENIE niżej idzie REALNĄ selectPlayerUnit() (ta sama ścieżka co
    // klik gracza).
    const myCity = st0.cities.find((c) => c.ownerId === 0);
    if (!myCity) throw new Error('Scenariusz A: brak miasta ownera 0');
    // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2b (diagnoza po naprawie build-panel): fotel B
    // hijackuje ownerId=1 (seedSecondSeat(1, ...) niżej) -- ISTNIEJĄCY owner z REALNEJ
    // generacji świata (AI/city-state), który już WCZEŚNIEJ mógł mieć WŁASNE miasto/miasta.
    // Pierwsza wersja tego testu wybierała `rivalCity` jako "dowolne miasto ownera !== 0" i
    // PRZYPISYWAŁA je do ownera 1 (reassignCityId) -- gdy `rivalCity.ownerId` było czymś
    // INNYM niż 1 (np. 3), owner 1 kończył z DWOMA miastami: swoim oryginalnym (z generacji
    // świata) PLUS reassignowanym `rivalCity`. To NIE jest wyciek `switchActiveHuman()` --
    // to legalna, ale niezamierzona konsekwencja hijackowania ownera z realnym majątkiem:
    // widoczność fotela B (ownPlayerVisibleHexes() filtruje `cities.filter(c => c.ownerId
    // === ME())`) słusznie objęła OBA miasta, dając ~2× więcej odkrytych heksów niż seedowany
    // zestaw -- FAŁSZYWY "wyciek" w asercji exploredKeysForActive (potwierdzone żywym
    // uruchomieniem: dwa rozłączne skupiska heksów w wyniku, drugie odpowiadające
    // oryginalnemu miastu ownera 1 sprzed hijacku). Naprawa: użyj miasta, które owner 1 JUŻ
    // POSIADA z generacji świata -- zero reassignCityId, zero drugiego miasta, KROK 6 nadal
    // ma realną stolicę do skoku (to samo miasto).
    const rivalCity = st0.cities.find((c) => c.ownerId === 1);
    if (!rivalCity) throw new Error('Scenariusz A: brak miasta ownera 1 do przejęcia przez fotel B (cityStatesCount=' + CITY_STATES_COUNT + ')');
    const expectedCapitalB = await page.evaluate(({ q, r }) => (window).__sidePanelLinkTestDebug.hexToWorld(q, r), { q: rivalCity.q, r: rivalCity.r });

    // 1) Realne zaznaczenie jednostki fotela A (REALNA selectPlayerUnit, istniejący hak) --
    //    jednostka spawnowana testowo (spawnTestUnitForPlayer, patrz komentarz wyżej), bo
    //    gra nie nadaje jej graczowi automatycznie.
    const myUnitId = await page.evaluate(
      ({ q, r }) => (window).__hotSeatTestDebug.spawnTestUnitForPlayer(q, r),
      { q: myCity.q, r: myCity.r },
    );
    if (!myUnitId) throw new Error('Scenariusz A: spawnTestUnitForPlayer nie znalazło szablonu jednostki wojskowej w tym świecie');
    await page.evaluate((id) => { (window).__mglaSciezkaTestDebug.selectUnit(id); }, myUnitId);
    // 2) Realne otwarcie panelu miasta fotela A.
    const opened = await page.evaluate((cityId) => (window).__hotSeatTestDebug.openCityPanelForTest(cityId), myCity.id);
    if (!opened) throw new Error('Scenariusz A: openCityPanelForTest nie znalazło miasta');
    // 2b) Realne zamknięcie panelu miasta -- `openCityPanelForPlayer` woła
    //     `setMapHudChromeSuppressed(true)`, co ukrywa `.civ-map-toolbar` (hud.ts); bez
    //     zamknięcia panelu TERAZ, przycisk „Budowa ulepszeń" w kroku 5 byłby realnie
    //     niewidoczny/nieklikalny dla PRAWDZIWEGO gracza też -- zamknięcie tutaj odzwierciedla
    //     dokładnie to, co musiałby zrobić realny gracz przed wejściem w build-mode.
    await page.evaluate(() => (window).__hotSeatTestDebug.closeCityPanelForTest());
    await wait(200);
    // 2c) Zamknięcie panelu miasta (2b) legalnie odpala w RAF pierwszą kartę pierwszego
    //     kontaktu z rywalem/miastem-państwem widocznym od startu tej mapy
    //     (`closeCityPanelIfOpen()` -> `tryOpenNextFirstContactCard()`, main.ts) -- REALNA
    //     karta audiencji dyplomatycznej (`.civ-diplo-aud`, z-index:400) przykrywa toolbar.
    //     Realny gracz musi ją odprawić (przycisk „Wyjście"/`onBack`), zanim dotknie
    //     czegokolwiek pod spodem -- test robi dokładnie to samo, REALNYM klikiem.
    for (let guard = 0; guard < 5; guard++) {
      const audBack = page.locator('.civ-diplo-aud-back');
      if (await audBack.count() === 0 || !(await audBack.first().isVisible())) break;
      await audBack.first().click();
      await wait(200);
    }
    // 3) Realny ruch kamery na stolicę fotela A (ta sama funkcja co KROK 6 switchActiveHuman,
    //    inny argument -- weryfikuje że handoff faktycznie ZMIENIA fokus, nie że zastaje pusty).
    await page.evaluate(() => (window).__hotSeatTestDebug.focusCameraOnOwnerCapitalForTest(0));
    // 4) Realny hint fotela A: druga próba founda tego samego startHexa -- REALNA
    //    `tryFoundPlayerCityAt` odrzuca (hex już zajęty) i woła showHintMessage(...).
    await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    const toastAfterHint = await page.evaluate(() => {
      const el = document.getElementById('civ-hint-toast');
      return el ? el.style.display : null;
    });
    if (toastAfterHint !== 'block') {
      throw new Error('Scenariusz A: hint fotela A nie zapalił się przed testem właściwym (display=' + toastAfterHint + ')');
    }
    // 4b) Diagnoza rundy 2b (checkpoint 2268cee7), potwierdzona żywym zrzutem HTML panelu:
    //     pierwsza hipoteza ("brak zbadanej technologii") była błędna -- ta gra startuje w
    //     epoce Brąz i nadaje z góry WSZYSTKIE technologie Epoki Kamień (w tym Rolnictwo/
    //     Oswojenie zwierząt), więc każda pozycja terenowa MA już odblokowaną technologię.
    //     Prawdziwa przyczyna: `.locked` z hintem "Za mało Pracy" -- `playerPracaPool`
    //     startuje od zera, a KAŻDE ulepszenie terenu ma koszt Pracy > 0
    //     (terrain-improvements.json + scaleImprovementWorkCost ×2), więc na prawdziwym
    //     turze 1, zaraz po założeniu stolicy, ŻADNA pozycja nie jest klikalna dla
    //     PRAWDZIWEGO gracza też -- trzeba poczekać na akumulację Pracy z miasta (poza
    //     zakresem tej bramki, dotyka triggerPlayerEndTurn(), zakazanego allowlistą).
    //     `grantTestPraca` (nowy hak, main.ts) dodaje Pracę do TEJ SAMEJ zmiennej, którą
    //     odejmuje realny `applyBuildRequest` przy budowie -- odpowiednik kilku
    //     przepracowanych tur, jedyna sztuczność jest w wysokości startowej puli, samo
    //     odjęcie kosztu przy kliknięciu idzie dalej REALNĄ ścieżką silnika. 200 P > 2×
    //     najdroższe ulepszenie terenu (irygacja/posterunek, 30 P bazowo × mnożnik ×2 = 60 P).
    await page.evaluate(() => { (window).__hotSeatTestDebug.grantTestPraca(200); });
    // 5) Realny build-mode: klik toolbara "Budowa ulepszeń" + klik pierwszego chipa
    //    ulepszenia (REALNE `onOpenBuild`/`onSelectType` main.ts) -- BEZ zamykania przed
    //    handoffem, dokładnie recon §4.2 krok 3.
    await page.click('.civ-map-toolbar .tb[data-act="build"]');
    // `.civ-build-item[data-key]:not(.locked)` -- buildModeHud.ts oznacza `.locked` pozycje
    // niedostępne (tech niezbadany LUB niewystarczająca Praca, klik jest tam blokowany przez
    // sam handler -- nie samą CSS-ową szarością); PIERWSZA pozycja na liście może być taka
    // (zależnie od dostępnych technologii na starcie), więc test celuje w PIERWSZĄ NAPRAWDĘ
    // klikalną, żeby realnie ustawić `activeImprovementKey`, nie trafić w no-op.
    await page.waitForSelector('.civ-build-panel .civ-build-item[data-key]:not(.locked)', { timeout: 10000 });
    await page.click('.civ-build-panel .civ-build-item[data-key]:not(.locked)');
    const preSwitchBuild = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotVisibleState());
    if (preSwitchBuild.buildModeOpen !== true || preSwitchBuild.activeImprovementKey === null) {
      throw new Error('Scenariusz A: build-mode fotela A nie wystartował przed testem właściwym: '
        + JSON.stringify({ buildModeOpen: preSwitchBuild.buildModeOpen, activeImprovementKey: preSwitchBuild.activeImprovementKey }));
    }

    // Seed fotela B -- rozłączny, rozpoznawalny stan. `rivalCity` to WŁASNE miasto ownera 1
    // z generacji świata (patrz komentarz wyżej) -- zero `reassignCityId`, więc owner 1 ma
    // TYLKO to jedno miasto (nie dwa), i KROK 6 ma mimo to realną stolicę do skoku.
    const exploredKeysB = ['99,99', '99,100', '100,99'];
    await page.evaluate(({ keys }) => {
      (window).__hotSeatTestDebug.seedSecondSeat(1, { exploredKeys: keys, skarbiec: 12345 });
    }, { keys: exploredKeysB });

    // DOWÓD "brak migotania" (recon §4.2 pkt 8): showHotSeatHandoff + switchActiveHuman
    // W JEDNYM `evaluate` (jeden task przeglądarki), odczyt geometrii/z-index BEZ `await`
    // między -- zero szansy na niekontrolowany paint pomiędzy.
    const flicker = await page.evaluate(() => {
      (window).__hotSeatTestDebug.showHotSeatHandoff('Gracz 1', 'Gracz 2');
      (window).__hotSeatTestDebug.switchActiveHuman(1);
      const el = document.querySelector('.hot-seat-handoff-overlay');
      if (!el) return { found: false };
      const rect = el.getBoundingClientRect();
      const z = getComputedStyle(el).zIndex;
      return {
        found: true,
        coversViewport: rect.width >= window.innerWidth - 1 && rect.height >= window.innerHeight - 1,
        zIndex: Number(z),
      };
    });
    if (!flicker.found) throw new Error('Scenariusz A: brak migotania: .hot-seat-handoff-overlay nie zamontowany');
    if (!flicker.coversViewport) throw new Error('Scenariusz A: brak migotania: overlay nie pokrywa viewportu: ' + JSON.stringify(flicker));
    if (!(flicker.zIndex > 9950)) throw new Error('Scenariusz A: brak migotania: z-index zbyt niski: ' + flicker.zIndex);

    await page.evaluate(() => (window).__hotSeatTestDebug.hideHotSeatHandoff());

    // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2b: KROK 7 switchActiveHuman() woła refreshFog()
    // dla fotela B, który (poprawnie, żywy dowód) liczy widoczność z JEGO WŁASNEGO miasta
    // (rivalCity) -- to może PIERWSZY RAZ z perspektywy fotela B odkryć sąsiednią cywilizację
    // (checkNewDiplomaticContacts() -> pendingFirstContactCards -> requestAnimationFrame ->
    // tryOpenNextFirstContactCard(), main.ts) i auto-otworzyć kartę audiencji -- REALNE,
    // LEGALNE pierwsze zetknięcie fotela B z sąsiadem (analogiczne do tego, co fotel A
    // dostał w kroku 2c), NIE wyciek fotela A. Asynchroniczne (rAF), więc może wylądować
    // między tym `evaluate` a poniższym snapshotem -- odczekaj i odpraw dokładnie jak w
    // kroku 2c, zanim sprawdzisz "no leak" (inaczej test myliłby legalne onboardowanie
    // fotela B z realnym wyciekiem panelu fotela A).
    await wait(300);
    for (let guard = 0; guard < 5; guard++) {
      const audBack = page.locator('.civ-diplo-aud-back');
      if (await audBack.count() === 0 || !(await audBack.first().isVisible())) break;
      await audBack.first().click();
      await wait(200);
    }
    // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2b: `.civ-diplo-aud-back` na audiencji otwartej
    // BEZ zaznaczonej jednostki (dokładnie stan fotela B tutaj -- KROK 2 wyczyścił
    // `selectedId`) legalnie NAWIGUJE do listy dyplomacji zamiast całkiem zamykać (main.ts
    // `onBack`: "Powrót do listy tylko gdy gracz wszedł z listy (brak zaznaczonej
    // jednostki)" -- etykieta przycisku wtedy to „Wróć", nie „Wyjście"). To REALNE zachowanie
    // gry dla gracza bez zaznaczenia, nie wyciek -- odpraw też tę listę REALNYM przyciskiem
    // zamknięcia (`.dip-close-btn`, main.ts/diploListHud.ts, "Zamknij listę (Esc)").
    const diploListClose = page.locator('.civ-diplo-list-hud .dip-close-btn');
    if (await diploListClose.count() > 0 && await diploListClose.first().isVisible()) {
      await diploListClose.first().click();
      await wait(200);
    }

    const snap = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotVisibleState());

    const failures = [];
    const check = (cond, label) => { if (!cond) failures.push(label); };
    check(snap.activeHumanOwnerId === 1, `activeHumanOwnerId===1 (got ${snap.activeHumanOwnerId})`);
    check(snap.selectedId === null, `selectedId===null (got ${JSON.stringify(snap.selectedId)})`);
    check(snap.plannedMarchesSize === 0, `plannedMarchesSize===0 (got ${snap.plannedMarchesSize})`);
    // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2b: `rivalCity` (miasto WŁASNE ownera 1) daje
    // fotelowi B REALNĄ widoczność wokół swojej stolicy -- LEGALNE nowe klucze ponad zestaw
    // wstrzyknięty (nie "wyciek", tylko naturalny wynik posiadania miasta). Prawdziwy test
    // "no leak" to: (a) każdy wstrzyknięty klucz PRZETRWAŁ (KROK 0/7 go nie zgubiły), (b) ANI
    // JEDEN klucz z EKSPLORACJI FOTELA A (`preSwitchBuild.exploredKeysForActive`, zebrane
    // wyżej, gdy ME()===0) nie pojawia się u fotela B -- to jest DOKŁADNIE ten sam wyciek,
    // który złapał Evaluator rundy 1 (Zarzut #2, fallback `playerStartHex`).
    const activeKeysAfter = new Set(snap.exploredKeysForActive);
    const seededSurvived = exploredKeysB.every((k) => activeKeysAfter.has(k));
    check(seededSurvived, `exploredKeysForActive zawiera wszystkie wstrzyknięte klucze (got ${JSON.stringify(snap.exploredKeysForActive)})`);
    const leakedFromA = (preSwitchBuild.exploredKeysForActive || []).filter((k) => activeKeysAfter.has(k));
    check(leakedFromA.length === 0, `exploredKeysForActive nie zawiera kluczy fotela A (wyciekło: ${JSON.stringify(leakedFromA)})`);
    check(snap.warEventLogLen === 0, `warEventLogLen===0 (got ${snap.warEventLogLen})`);
    check(snap.villageEventLogLen === 0, `villageEventLogLen===0 (got ${snap.villageEventLogLen})`);
    check(snap.tradeRouteEventLogLen === 0, `tradeRouteEventLogLen===0 (got ${snap.tradeRouteEventLogLen})`);
    check(snap.rationAutoEventLogLen === 0, `rationAutoEventLogLen===0 (got ${snap.rationAutoEventLogLen})`);
    check(snap.borderMarchEventLogLen === 0, `borderMarchEventLogLen===0 (got ${snap.borderMarchEventLogLen})`);
    for (const [k, v] of Object.entries(snap.openPanels)) {
      check(v === false, `openPanels.${k}===false (got ${v})`);
    }
    // R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2b: KROK 6 (`focusCameraOnOwnerCapital`)
    // BEZWARUNKOWO woła `showHintMessage(...)` -- "Stolica: X" gdy fotel ma stolicę (jak tu),
    // "Brak stolicy..." gdy nie ma (Scenariusz B). Toast widoczny PO switchu jest więc
    // LEGALNY i ZAMIERZONY (KROK 1b czyści hint fotela A PRZED tym wywołaniem) -- prawdziwy
    // test "no leak" to TREŚĆ: hint fotela A z kroku 4 ("Nie można założyć: ...") NIE MOŻE
    // przetrwać w treści widocznej fotelowi B.
    check(
      !snap.hintToastText || !snap.hintToastText.includes('Nie można założyć'),
      `hintToastText nie zawiera hinta fotela A (got ${JSON.stringify(snap.hintToastText)})`,
    );
    check(snap.buildModeOpen === false, `buildModeOpen===false (got ${snap.buildModeOpen})`);
    check(snap.foundCityMode === false, `foundCityMode===false (got ${snap.foundCityMode})`);
    check(snap.activeImprovementKey === null, `activeImprovementKey===null (got ${JSON.stringify(snap.activeImprovementKey)})`);
    check(snap.activeWonderId === null, `activeWonderId===null (got ${JSON.stringify(snap.activeWonderId)})`);
    check(snap.ghostChipVisible === false, `ghostChipVisible===false (got ${snap.ghostChipVisible})`);
    check(snap.escapeOverlayTopId !== 'build-mode', `escapeOverlayTopId!=='build-mode' (got ${snap.escapeOverlayTopId})`);
    check(snap.hotSeatHandoffOpen === false, `hotSeatHandoffOpen===false po hideHotSeatHandoff() (got ${snap.hotSeatHandoffOpen})`);
    // Kamera: KROK 6 switchActiveHuman() woła focusCameraOnOwnerCapital(1) -- musi
    // wylądować na stolicy fotela B (rivalCity, przypisane wyżej), NIE zostać na pozycji
    // fotela A ustawionej krokiem 3 (focusCameraOnOwnerCapitalForTest(0)).
    const CAMERA_EPS = 0.5;
    const cf = snap.cameraFocus;
    check(
      Math.abs(cf.x - expectedCapitalB.x) < CAMERA_EPS && Math.abs(cf.z - expectedCapitalB.z) < CAMERA_EPS,
      `cameraFocus === stolica fotela B (got ${JSON.stringify(cf)}, expected ~${JSON.stringify(expectedCapitalB)})`,
    );
    check(jsExceptions.length === 0, `zero jsExceptions (got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')})`);

    return { pass: failures.length === 0, failures, snap };
  } finally {
    await closeBrowserSafely(browser);
  }
}

// -----------------------------------------------------------------------------------
// SCENARIUSZ B -- owner 0 W TRAKCIE isAwaitingFirstPlayerCity()===true (exitBuildMode()
// gałąź guard-true, no-op -- KROK 1c wymuszonego resetu switchActiveHuman()).
// -----------------------------------------------------------------------------------
async function runScenarioB(chromium) {
  const browser = await launchBrowser(chromium);
  const jsExceptions = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => jsExceptions.push(String(e)));
    if (process.env.HOTSEAT_NOLEAK_DEBUG) {
      page.on('console', (m) => console.log('[page:B:' + m.type() + ']', m.text()));
    }

    log('[B] świeży startNewGame BEZ foundPlayerStartCity (isAwaitingFirstPlayerCity musi zostać true)...');
    await startWorldOnly(page);

    // B3: potwierdź gałąź PRZED testem właściwym -- bez tego Scenariusz B mógłby po cichu
    // wykonać się w złej gałęzi (recon §4.2 B3).
    const awaiting = await page.evaluate(() => (window).__hotSeatTestDebug.isAwaitingFirstPlayerCity());
    if (awaiting !== true) throw new Error('Scenariusz B: isAwaitingFirstPlayerCity() !== true po świeżym startNewGame (got ' + awaiting + ')');

    // beginOnboardingFoundCity() (main.ts, wołane od razu po generacji świata) już ustawiło
    // foundCityMode=true/buildModeOpen=true -- potwierdź, zamiast zakładać po cichu.
    const preState = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotVisibleState());
    if (preState.buildModeOpen !== true || preState.foundCityMode !== true) {
      throw new Error('Scenariusz B: build-mode/found-city-mode nie aktywny po generacji świata: '
        + JSON.stringify({ buildModeOpen: preState.buildModeOpen, foundCityMode: preState.foundCityMode }));
    }

    // B4: przesuń kursor nad heks startowy gracza -- kamera jest już na nim wycentrowana
    // (beginOnboardingFoundCity -> camCtrl.focusAt(playerStartHex, dist=22)), więc środek
    // canvasu realnie hoveruje ten heks przez REALNY handler mousemove main.ts (dokładnie
    // ten sam, którego używa gracz), NIE syntetyczne ustawienie ghostChipHex.
    const canvas = page.locator('body > canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Scenariusz B: canvas mapy nie znaleziony/niewidoczny');
    await canvas.hover({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2 + 1); // wymuś "ruch" po hover
    await wait(200);
    const ghostBefore = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotVisibleState()).then((s) => s.ghostChipVisible);
    if (ghostBefore !== true) {
      throw new Error('Scenariusz B: ghostChipVisible nie zapaliło się po hoverze nad heksem startowym (test nic by nie dowodził) -- got ' + ghostBefore);
    }

    // Seed fotela B.
    const exploredKeysB = ['77,77', '77,78'];
    await page.evaluate(({ keys }) => {
      (window).__hotSeatTestDebug.seedSecondSeat(1, { exploredKeys: keys, skarbiec: 999 });
    }, { keys: exploredKeysB });

    await page.evaluate(() => (window).__hotSeatTestDebug.switchActiveHuman(1));
    const snap = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotVisibleState());

    const failures = [];
    const check = (cond, label) => { if (!cond) failures.push(label); };
    // Regresyjne (przechodziły zielono już od rundy 2 recon) -- ta gałąź jest teraz
    // ćwiczona po raz pierwszy w tej bramce.
    check(snap.buildModeOpen === false, `buildModeOpen===false (got ${snap.buildModeOpen})`);
    check(snap.foundCityMode === false, `foundCityMode===false (got ${snap.foundCityMode})`);
    check(snap.activeImprovementKey === null, `activeImprovementKey===null (got ${JSON.stringify(snap.activeImprovementKey)})`);
    check(snap.activeWonderId === null, `activeWonderId===null (got ${JSON.stringify(snap.activeWonderId)})`);
    // NOWE (recon runda 3, Evaluator runda 2 zarzut #2) -- łapią dokładnie lukę znalezioną
    // w rundzie 2 (4 zmienne wyzerowane, ale duszek/Escape-wpis nie sprzątnięte).
    check(snap.ghostChipVisible === false, `ghostChipVisible===false (got ${snap.ghostChipVisible})`);
    check(snap.escapeOverlayTopId !== 'build-mode', `escapeOverlayTopId!=='build-mode' (got ${snap.escapeOverlayTopId})`);
    check(
      JSON.stringify([...snap.exploredKeysForActive].sort()) === JSON.stringify([...exploredKeysB].sort()),
      `exploredKeysForActive === seeded set (got ${JSON.stringify(snap.exploredKeysForActive)})`,
    );
    check(snap.activeHumanOwnerId === 1, `activeHumanOwnerId===1 (got ${snap.activeHumanOwnerId})`);
    check(jsExceptions.length === 0, `zero jsExceptions (got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')})`);

    return { pass: failures.length === 0, failures, snap };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function runWithRetry(fn, chromium, label, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(chromium);
    } catch (e) {
      lastErr = e;
      log(`[${label}] próba ${attempt}/${maxAttempts} padła (${e && e.message ? e.message : e}) -- `
        + (attempt < maxAttempts ? 'ponawiam ze świeżym browser.launch()...' : 'wyczerpano próby.'));
    }
  }
  throw lastErr;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[hotseat-etap5-no-leak-test] BLOCK: playwright nie znaleziony w node_modules.');
    process.exit(2);
  }

  try {
    buildBundle();
  } catch (e) {
    console.error('[hotseat-etap5-no-leak-test] BLOCK: vite build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  let resA;
  let resB;
  try {
    resA = await runWithRetry(runScenarioA, chromium, 'A');
    resB = await runWithRetry(runScenarioB, chromium, 'B');
  } catch (e) {
    console.error('[hotseat-etap5-no-leak-test] BLOCK: hak testowy/no-leak nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== SCENARIUSZ A ===');
  console.log('PASS:', resA.pass);
  if (!resA.pass) resA.failures.forEach((f) => console.log('  FAIL: ' + f));

  console.log('\n=== SCENARIUSZ B ===');
  console.log('PASS:', resB.pass);
  if (!resB.pass) resB.failures.forEach((f) => console.log('  FAIL: ' + f));

  const pass = resA.pass && resB.pass;
  console.log(`\nhotseat-etap5-no-leak-test: ${pass ? 'PASS' : 'FAIL'} (A=${resA.pass ? 'PASS' : 'FAIL'}, B=${resB.pass ? 'PASS' : 'FAIL'})`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap5-no-leak-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
