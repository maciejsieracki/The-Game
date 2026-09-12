'use strict';
/**
 * hotseat-drugi-fotel-tura-test.cjs — bramka R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU tego dispatchu: zakaz uznania tematu za zamknięty na
 * podstawie samego czytania kodu lub testu, który buduje stan RĘCZNIE (np. przez
 * bezpośrednie przypisanie `humanSeats.activeHumanOwnerId`) zamiast przejść PRAWDZIWY
 * scenariusz end-to-end. Ten test:
 *  (a) startuje hot-seat REALNYM kreatorem (`newGameFlow.ts`, kliknięcia DOM — ten sam
 *      wzorzec `openWizardToSettingsStep` co `hotseat-etap6f-part2-ui-test.cjs`), NIE
 *      ustawia `humanSeats` ręcznie;
 *  (b) fotel 1 zakłada pierwsze miasto przez `__hotSeatTestDebug.foundPlayerCityForActiveSeat()`
 *      — hak WOŁA DOKŁADNIE `tryFoundPlayerCityAt(q, r)`, tę samą funkcję, którą wywołuje
 *      realny klik na mapie / skrót `B` (zero reimplementacji logiki foundowania — ten sam,
 *      już zaakceptowany wzorzec co starszy `foundPlayerStartCity()` w main.ts);
 *  (c) fotel 1 kończy turę przez `__eraTestDebug.endTurn()` — WOŁA DOKŁADNIE `advanceSeat()`,
 *      tę samą funkcję, którą woła przycisk HUD "Zakończ turę" i skrót klawiszowy "N";
 *  (d) DOWÓD zrzutem stanu silnika, że aktywny fotel zmienił się na fotel 2 i numer tury
 *      SIĘ NIE ZMIENIŁ (świat/AI jeszcze nie przeszedł);
 *  (e) DOWÓD że fotel 2 jest w `isAwaitingFirstPlayerCity()===true` przy WŁASNYM heksie
 *      startowym (innym niż fotel 1);
 *  (f) fotel 2 zakłada miasto (ten sam hak co (b), teraz dla aktywnego fotela 2) i kończy
 *      turę;
 *  (g) DOWÓD że DOPIERO TERAZ numer tury wzrósł ORAZ aktywny fotel wrócił na fotel 1.
 * Osobny SCENARIUSZ REGRESJI: gra jednoosobowa (bez dotknięcia hot-seat) kończy turę i
 * przechodzi świat/AI PRZY PIERWSZYM kliknięciu "Zakończ turę" — zero dodatkowego kroku.
 *
 * Wzorzec buildBundle()/launchBrowser()/closeBrowserSafely/pollUntil/openWizardToSettingsStep
 * przejęty 1:1 z `hotseat-etap5-no-leak-test.cjs`/`hotseat-etap6f-part2-ui-test.cjs` (ten sam
 * mechanizm, nie budowa od zera).
 *
 * Bramka (z katalogu gra/): node tools/hotseat-drugi-fotel-tura-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = process.env.HOTSEAT_CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-drugi-fotel-tura-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-drugi-fotel-tura-test] ' + msg); }

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

async function gotoMainMenu(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!(window).__cityStateStartUnitsTestDebug && !!(window).__hotSeatTestDebug
      && !!(window).__eraTestDebug,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
}

async function waitForWorldGenerated(page) {
  await pollUntil(page, () => {
    const overlayVisible = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie świata') && (el).offsetParent !== null,
    );
    const st = (window).__cityStateStartUnitsTestDebug.dumpState();
    return {
      ready: !overlayVisible && st.playerStartHex !== null,
      overlayVisible, awaitingFirstPlayerCity: st.awaitingFirstPlayerCity, turn: st.turn,
    };
  }, 360000, 'world-generated');
  await wait(300);
}

/** Realne przejście kreatora Intro -> Epoka -> Cywilizacja -> Ustawienia (REALNE
 *  kliknięcia DOM, ta sama ścieżka co gracz). Wzorzec 1:1 z hotseat-etap6f-part2-ui-test. */
async function openWizardToSettingsStep(page) {
  const playBtn = page.locator('.civ-menu button', { hasText: 'Rozpocznij gr' });
  await playBtn.first().click();
  await page.waitForSelector('.civ-newgame', { timeout: 30000 });
  await wait(150);

  const introCta = page.locator('.civ-newgame .cta-hero');
  await introCta.click();
  await wait(150);

  const next1 = page.locator('.civ-newgame .nb.next');
  await next1.click();
  await wait(150);
  const next2 = page.locator('.civ-newgame .nb.next');
  await next2.click();
  await wait(150);

  await page.waitForSelector('.civ-newgame .seat2-toggle-row', { timeout: 15000 });
}

/** Pollowanie snapshotu foteli (evaluate-owa funkcja musi być samowystarczalna — bez
 *  domknięcia po zmiennych z Node, patrz page.evaluate serializacja). */
function snapshotHumanSeats() {
  return (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
}

/**
 * SCENARIUSZ GŁÓWNY (a)-(g) dispatchu: hot-seat REALNIE włączony przez kreator, oba
 * fotele zakładają pierwsze miasto REALNĄ ścieżką silnika, dowód zmiany aktywnego fotela
 * i numeru tury na każdym kroku.
 */
async function runScenarioMain(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    // (a) Włącz hot-seat REALNYM klikiem na przełącznik — NIE ustawiamy humanSeats ręcznie.
    await page.locator('.civ-newgame .seat2-toggle-btn').click();
    await wait(120);
    await page.locator('.civ-newgame .start').click();
    await page.waitForSelector('.civ-newgame .seat2-dist-row', { timeout: 15000 });
    await wait(150);

    // Wybierz dowolną klikalną (nie wyszarzoną) cywilizację fotela 2 + tryb "Blisko".
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card:not(.disabled)'));
      const target = cards.find((c) => !c.classList.contains('sel')) || cards[0];
      if (target) target.click();
    });
    await wait(120);
    await page.locator('.civ-newgame .seat2-dist-opt', { hasText: 'Blisko' }).click();
    await wait(120);
    await page.locator('.civ-newgame .start').click();

    await waitForWorldGenerated(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 2,
      `(a) po starcie z hot-seatem: DWÓCH ludzi — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );
    const seat1 = 0;
    const seat2 = (snap0.humanOwnerIds || []).find((id) => id !== seat1);
    check(seat2 !== undefined, `(a) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap0.humanOwnerIds)}`);
    check(snap0.activeHumanOwnerId === seat1, `(a) aktywny fotel PO starcie to fotel 1 — got ${snap0.activeHumanOwnerId}`);

    const hex1 = snap0.startHexByOwner ? snap0.startHexByOwner[seat1] : null;
    const hex2 = seat2 !== undefined && snap0.startHexByOwner ? snap0.startHexByOwner[seat2] : null;
    check(!!hex1 && !!hex2, `(a) oba heksy startowe istnieją — hex1=${JSON.stringify(hex1)} hex2=${JSON.stringify(hex2)}`);
    check(
      !!hex1 && !!hex2 && (hex1.q !== hex2.q || hex1.r !== hex2.r),
      `(a) heks startowy fotela 2 różni się od fotela 1 — hex1=${JSON.stringify(hex1)} hex2=${JSON.stringify(hex2)}`,
    );

    const dumpBefore = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    check(dumpBefore.turn === 1, `(b) PRZED założeniem miasta: tura 1 — got ${dumpBefore.turn}`);
    check(
      await page.evaluate(() => (window).__hotSeatTestDebug.isAwaitingFirstPlayerCity()),
      '(b) fotel 1 PRZED założeniem miasta: isAwaitingFirstPlayerCity()===true',
    );

    // (b) Fotel 1 zakłada pierwsze miasto — REALNA ścieżka silnika (tryFoundPlayerCityAt).
    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(b) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    const dumpAfterFound1 = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    const city1 = (dumpAfterFound1.cities || []).find((c) => c.ownerId === seat1);
    check(!!city1, `(b) miasto fotela 1 istnieje z ownerId===0 — got cities=${JSON.stringify(dumpAfterFound1.cities)}`);
    check(
      !!city1 && !!hex1 && city1.q === hex1.q && city1.r === hex1.r,
      `(b) miasto fotela 1 na WŁASNYM heksie startowym — got city=${JSON.stringify(city1)} hex1=${JSON.stringify(hex1)}`,
    );

    // (c) Fotel 1 kończy turę — REALNA ścieżka (advanceSeat() przez ten sam hak co HUD/"N").
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);

    // (d) DOWÓD: aktywny fotel = fotel 2, numer tury BEZ ZMIANY (świat jeszcze nie przeszedł).
    const snap1 = await page.evaluate(snapshotHumanSeats);
    check(
      snap1.activeHumanOwnerId === seat2,
      `(d) po końcu tury fotela 1: aktywny fotel = fotel 2 (${seat2}) — got ${snap1.activeHumanOwnerId}`,
    );
    const dumpAfterSwitch = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    check(
      dumpAfterSwitch.turn === 1,
      `(d) numer tury NIE wzrósł po przełączeniu na fotel 2 (świat nie przechodzi między fotelami) — got ${dumpAfterSwitch.turn}`,
    );

    // (e) DOWÓD: fotel 2 w trybie awaiting-first-city, przy WŁASNYM heksie (różnym od fotela 1).
    check(
      await page.evaluate(() => (window).__hotSeatTestDebug.isAwaitingFirstPlayerCity()),
      '(e) fotel 2 aktywny: isAwaitingFirstPlayerCity()===true (własny, nie odziedziczony po fotelu 1)',
    );
    const snap1b = await page.evaluate(snapshotHumanSeats);
    const hex2Active = seat2 !== undefined ? snap1b.startHexByOwner[seat2] : null;
    check(
      !!hex2Active && !!hex1 && (hex2Active.q !== hex1.q || hex2Active.r !== hex1.r),
      `(e) heks startowy fotela 2 (aktywny) różny od fotela 1 — got ${JSON.stringify(hex2Active)} vs ${JSON.stringify(hex1)}`,
    );

    // (f) Fotel 2 zakłada miasto NA WŁASNYM heksie, kończy turę.
    const founded2 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded2 === true, '(f) fotel 2: foundPlayerCityForActiveSeat() zwraca true');

    const dumpAfterFound2 = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    const city2 = (dumpAfterFound2.cities || []).find((c) => c.ownerId === seat2);
    check(
      !!city2,
      `(f) miasto fotela 2 istnieje z ownerId===${seat2} (NIE 0 -- audyt foundCityAt/ME()) — got cities=${JSON.stringify(dumpAfterFound2.cities)}`,
    );
    check(
      !!city2 && !!hex2Active && city2.q === hex2Active.q && city2.r === hex2Active.r,
      `(f) miasto fotela 2 na WŁASNYM heksie startowym — got city=${JSON.stringify(city2)} hex=${JSON.stringify(hex2Active)}`,
    );

    await page.evaluate(() => (window).__eraTestDebug.endTurn());

    // (g) DOWÓD: DOPIERO TERAZ tura rośnie ORAZ aktywny fotel wraca na fotel 1.
    const final = await pollUntil(page, () => {
      const st = (window).__cityStateStartUnitsTestDebug.dumpState();
      const snap = (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
      return {
        ready: st.turn === 2 && snap.activeHumanOwnerId === 0,
        turn: st.turn, activeHumanOwnerId: snap.activeHumanOwnerId,
      };
    }, 60000, 'world-end-turn-after-both-seats');
    check(final.turn === 2, `(g) numer tury wzrósł do 2 DOPIERO po obu fotelach — got ${final.turn}`);
    check(final.activeHumanOwnerId === 0, `(g) aktywny fotel wrócił na fotel 1 (pierwszy fotel nowej rundy) — got ${final.activeHumanOwnerId}`);

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ REGRESJI: gra jednoosobowa (bez dotknięcia hot-seat) — koniec tury i
 * przejście świata/AI PRZY PIERWSZYM kliknięciu "Zakończ turę", zero dodatkowego kroku.
 */
async function runScenarioSinglePlayerRegression(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);
    // BEZ dotknięcia przełącznika hot-seat — klik "ROZPOCZNIJ GRE" od razu (domyślnie 1 fotel).
    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 1 && snap0.humanOwnerIds[0] === 0,
      `regresja: dokładnie jeden człowiek (owner 0) — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );

    const founded = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded === true, 'regresja: foundPlayerCityForActiveSeat() zwraca true');

    const dumpBefore = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    check(dumpBefore.turn === 1, `regresja: tura 1 przed końcem tury — got ${dumpBefore.turn}`);

    // JEDNO kliknięcie "Zakończ turę" — musi przejść świat/AI OD RAZU, bez drugiego kroku.
    await page.evaluate(() => (window).__eraTestDebug.endTurn());

    const final = await pollUntil(page, () => {
      const st = (window).__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.turn === 2, turn: st.turn };
    }, 60000, 'single-player-end-turn');
    check(final.turn === 2, `regresja: tura wzrosła do 2 PO JEDNYM kliknięciu — got ${final.turn}`);

    const snapAfter = await page.evaluate(snapshotHumanSeats);
    check(
      snapAfter.activeHumanOwnerId === 0,
      `regresja: aktywny fotel pozostaje fotelem 1 (jedyny fotel) — got ${snapAfter.activeHumanOwnerId}`,
    );

    check(jsExceptions.length === 0, `regresja: zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ EVALUATOR ZARZUT #1 (runda 2): hot-seat 2-fotelowy, fotel 1 ma
 * `aiTurnAwaitingBattle===true` (REALNA flaga strażnika `canPlayerInitiateEndTurn()`,
 * wymuszona hakiem `forceAiTurnAwaitingBattleForTest` -- BEZ rozgrywania bitwy) i NIE jest
 * ostatnim nieprzetworzonym fotelem rundy -- "N" (`__eraTestDebug.endTurn()` woła DOKŁADNIE
 * `advanceSeat()`, tę samą funkcję co skrót klawiszowy) NIE MOŻE przełączyć fotela ani
 * przejść świata: aktywny fotel i numer tury muszą pozostać BEZ ZMIANY.
 */
async function runScenarioAiTurnAwaitingBattleBlocksAdvance(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    await page.locator('.civ-newgame .seat2-toggle-btn').click();
    await wait(120);
    await page.locator('.civ-newgame .start').click();
    await page.waitForSelector('.civ-newgame .seat2-dist-row', { timeout: 15000 });
    await wait(150);
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card:not(.disabled)'));
      const target = cards.find((c) => !c.classList.contains('sel')) || cards[0];
      if (target) target.click();
    });
    await wait(120);
    await page.locator('.civ-newgame .seat2-dist-opt', { hasText: 'Blisko' }).click();
    await wait(120);
    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    const seat1 = 0;
    const seat2 = (snap0.humanOwnerIds || []).find((id) => id !== seat1);
    check(seat2 !== undefined, `istnieje drugi fotel — got ${JSON.stringify(snap0.humanOwnerIds)}`);
    check(snap0.activeHumanOwnerId === seat1, `aktywny fotel PO starcie to fotel 1 — got ${snap0.activeHumanOwnerId}`);

    // Fotel 1 zakłada miasto REALNĄ ścieżką -- tak, żeby isAwaitingFirstPlayerCity()===false
    // i JEDYNYM strażnikiem, który mógłby zablokować "N", zostaje aiTurnAwaitingBattle.
    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, 'fotel 1: foundPlayerCityForActiveSeat() zwraca true');
    check(
      !(await page.evaluate(() => (window).__hotSeatTestDebug.isAwaitingFirstPlayerCity())),
      'fotel 1 PO założeniu miasta: isAwaitingFirstPlayerCity()===false (jedyny strażnik to aiTurnAwaitingBattle niżej)',
    );

    // Wymuś REALNĄ flagę strażnika -- fotel 1 (NIE ostatni nieprzetworzony fotel rundy: fotel
    // 2 jeszcze nie skończył) "ma otwartą/toczącą się bitwę AI".
    await page.evaluate(() => (window).__hotSeatTestDebug.forceAiTurnAwaitingBattleForTest(true));

    const turnBefore = (await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState())).turn;
    const seatsFinishedBefore = await page.evaluate(
      () => (window).__hotSeatTestDebug.seatsFinishedThisRoundSizeForTest(),
    );

    // "N" -- REALNA ścieżka silnika, jedyny z trzech call-site'ów advanceSeat() bez własnej
    // bramki (dispatch tego tematu, Evaluator zarzut #1).
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(250);

    const snapAfter = await page.evaluate(snapshotHumanSeats);
    const dumpAfter = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    const seatsFinishedAfter = await page.evaluate(
      () => (window).__hotSeatTestDebug.seatsFinishedThisRoundSizeForTest(),
    );

    check(
      snapAfter.activeHumanOwnerId === seat1,
      `"N" z aiTurnAwaitingBattle=true NIE przełącza fotela (blokada canPlayerInitiateEndTurn) — got aktywny=${snapAfter.activeHumanOwnerId}, oczekiwano fotel 1 (${seat1})`,
    );
    check(
      dumpAfter.turn === turnBefore,
      `"N" z aiTurnAwaitingBattle=true NIE przechodzi świata — got tura=${dumpAfter.turn}, przed=${turnBefore}`,
    );
    check(
      seatsFinishedAfter === seatsFinishedBefore,
      `"N" zablokowane PRZED dotknięciem seatsFinishedThisRound — got ${seatsFinishedAfter}, przed=${seatsFinishedBefore}`,
    );

    // Sprzątnij flagę i dowiedź, że "N" DZIAŁA normalnie zaraz potem (blokada nie utknęła).
    await page.evaluate(() => (window).__hotSeatTestDebug.forceAiTurnAwaitingBattleForTest(false));
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);
    const snapAfterUnblock = await page.evaluate(snapshotHumanSeats);
    check(
      snapAfterUnblock.activeHumanOwnerId === seat2,
      `po zdjęciu blokady "N" przełącza normalnie na fotel 2 — got ${snapAfterUnblock.activeHumanOwnerId}`,
    );

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ EVALUATOR ZARZUT #2 (runda 2): `seatsFinishedThisRound` niepuste (fotel 1
 * skończył turę w tej rundzie, fotel 2 aktywny) -- realna ścieżka load
 * (`loadGameFromSlot()`) woła jako PIERWSZY krok `prepareSessionForLoad()`, tu wywołane
 * wprost hakiem `prepareSessionForLoadForTest` (ta sama, jedyna produkcyjna funkcja, zero
 * reimplementacji) -- Set musi wrócić do rozmiaru 0.
 */
async function runScenarioSeatsFinishedResetOnLoad(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);
    await page.locator('.civ-newgame .seat2-toggle-btn').click();
    await wait(120);
    await page.locator('.civ-newgame .start').click();
    await page.waitForSelector('.civ-newgame .seat2-dist-row', { timeout: 15000 });
    await wait(150);
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card:not(.disabled)'));
      const target = cards.find((c) => !c.classList.contains('sel')) || cards[0];
      if (target) target.click();
    });
    await wait(120);
    await page.locator('.civ-newgame .seat2-dist-opt', { hasText: 'Blisko' }).click();
    await wait(120);
    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    // Fotel 1 zakłada miasto i kończy turę -- REALNIE naraża `seatsFinishedThisRound`
    // (advanceSeat() dodaje fotel 1, przełącza na fotel 2, runda NIEKOMPLETNA).
    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, 'fotel 1: foundPlayerCityForActiveSeat() zwraca true');
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);

    const seatsFinishedBeforeLoad = await page.evaluate(
      () => (window).__hotSeatTestDebug.seatsFinishedThisRoundSizeForTest(),
    );
    check(
      seatsFinishedBeforeLoad === 1,
      `PRZED load: seatsFinishedThisRound ma dokładnie 1 wpis (fotel 1 skończył, runda niekompletna) — got ${seatsFinishedBeforeLoad}`,
    );

    // Realna ścieżka load: `loadGameFromSlot()` woła `prepareSessionForLoad()` jako PIERWSZY
    // krok, PRZED odczytem jakiegokolwiek zapisu -- ten hak woła dokładnie tę samą funkcję.
    await page.evaluate(() => (window).__hotSeatTestDebug.prepareSessionForLoadForTest());

    const seatsFinishedAfterLoad = await page.evaluate(
      () => (window).__hotSeatTestDebug.seatsFinishedThisRoundSizeForTest(),
    );
    check(
      seatsFinishedAfterLoad === 0,
      `PO prepareSessionForLoad() (realna funkcja produkcyjna load-path): seatsFinishedThisRound.size===0 — got ${seatsFinishedAfterLoad}`,
    );

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function runWithRetry(fn, chromium, label) {
  const maxAttempts = 3;
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
    console.error('[hotseat-drugi-fotel-tura-test] BLOCK: playwright nie znaleziony w node_modules.');
    process.exit(2);
  }

  try {
    buildBundle();
  } catch (e) {
    console.error('[hotseat-drugi-fotel-tura-test] BLOCK: vite build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  let resMain, resRegression, resAiBattleBlock, resSeatsResetOnLoad;
  try {
    resMain = await runWithRetry(runScenarioMain, chromium, 'main');
    resRegression = await runWithRetry(runScenarioSinglePlayerRegression, chromium, 'regresja');
    resAiBattleBlock = await runWithRetry(
      runScenarioAiTurnAwaitingBattleBlocksAdvance, chromium, 'evaluator-zarzut-1-aiTurnAwaitingBattle',
    );
    resSeatsResetOnLoad = await runWithRetry(
      runScenarioSeatsFinishedResetOnLoad, chromium, 'evaluator-zarzut-2-seatsFinishedThisRound-load',
    );
  } catch (e) {
    console.error('[hotseat-drugi-fotel-tura-test] BLOCK: scenariusz nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== SCENARIUSZ GŁÓWNY (a)-(g): hot-seat, oba fotele zakładają miasto, dowód przełączenia ===');
  console.log('PASS:', resMain.pass);
  if (!resMain.pass) resMain.failures.forEach((f) => console.log('  FAIL: ' + f));

  console.log('\n=== SCENARIUSZ REGRESJI: gra jednoosobowa, zero dodatkowego kliknięcia ===');
  console.log('PASS:', resRegression.pass);
  if (!resRegression.pass) resRegression.failures.forEach((f) => console.log('  FAIL: ' + f));

  console.log('\n=== SCENARIUSZ EVALUATOR ZARZUT #1 (runda 2): "N" podczas aiTurnAwaitingBattle nie przełącza fotela ===');
  console.log('PASS:', resAiBattleBlock.pass);
  if (!resAiBattleBlock.pass) resAiBattleBlock.failures.forEach((f) => console.log('  FAIL: ' + f));

  console.log('\n=== SCENARIUSZ EVALUATOR ZARZUT #2 (runda 2): load resetuje seatsFinishedThisRound ===');
  console.log('PASS:', resSeatsResetOnLoad.pass);
  if (!resSeatsResetOnLoad.pass) resSeatsResetOnLoad.failures.forEach((f) => console.log('  FAIL: ' + f));

  const pass = resMain.pass && resRegression.pass && resAiBattleBlock.pass && resSeatsResetOnLoad.pass;
  console.log(`\nhotseat-drugi-fotel-tura-test: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-drugi-fotel-tura-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
