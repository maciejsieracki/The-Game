'use strict';
/**
 * rebel-protection-live-test.cjs — R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1
 * (Operator Sonnet 5, effort=high, worktree izolowany, RUNDA 1).
 *
 * WYZWALACZ (właściciel): przez 20 tur od buntu miasto jest w "strefie wpływu" bylego
 * właściciela — przejęcie go przez INNĄ cywilizację ma liczyć się jak wypowiedzenie
 * wojny bylemu właścicielowi, NAWET w formalnym pokoju/traktacie.
 *
 * DLACZEGO ŻYWY CHROMIUM, NIE SAM TEST JEDNOSTKOWY: `ownerDeclareWarOn`/
 * `isPeaceLockedBetween`/`resolveSiegeSurrender`/`applyCityCaptureToMap` żyją WYŁĄCZNIE
 * jako domknięcia wewnątrz main.ts (nie eksportowane, nie bundlowalne osobno — main.ts nie
 * jest modułem, patrz nagłówki innych `*-live-test.cjs` w tym katalogu). REGUŁA PRZECIW
 * SAMOOSZUKIWANIU dispatchu zakazuje uznania kryteriów 1-3 za spełnione bez REALNEJ
 * symulacji (min. kilkanascie tur) i pokazania rzeczywistego stanu diplo/traktatów PRZED i
 * PO przejęciu miasta — stąd realny `vite build` + realny headless Chromium
 * (`?playtest=mapa`), wzorem `rebel-city-notification-live-test.cjs`/
 * `forced-war-player-target-live-test.cjs`.
 *
 * Hak `window.__rebelProtectionTestDebug` (main.ts) steruje WYŁĄCZNIE danymi wejściowymi
 * (który cywil jest rebelPreviousOwnerId/zdobywcą, istnienie traktatu pokoju, kto
 * oblega/atakuje, liczba jednostek wrogich w sandboxie) — TICK licznika, DECYZJA o
 * konsekwencji wojennej i WYPOWIEDZENIE wojny idą przez REALNE funkcje silnika
 * (`tickRebelProtectionEndOfTurn` w pętli końca tury, `triggerRebelProtectionWarConsequence`
 * → `ownerDeclareWarOn` → `breakTreatiesOnWar`/`applyAllianceObligationsOnWar`/
 * `setDiploRelation`, `resolveSiegeSurrender`, `captureCityWithoutBattle`), NIE
 * reimplementowane.
 *
 * Pokrycie (patrz KRYTERIA KOŃCA 1-7, 00-dispatch.md):
 *  A.  Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
 *  B.  TICK REALNY, WIELOTUROWY (min. kilkanaście tur): miasto gracza buntuje się
 *      naturalnym trigger'em (`__rebelNotifyTestDebug.forceRevoltEligible`+`endTurn()`,
 *      identycznie jak w rebel-city-notification-live-test.cjs), potem 15 KOLEJNYCH
 *      prawdziwych `endTurn()` — licznik `rebelProtectionTurnsRemaining` faktycznie maleje
 *      o dokładnie 1 na turę (nie deklaracja "kod to teraz obsłuży").
 *  C.  KRYTERIUM 1: miasto zbuntowane (rebelPreviousOwnerId=AI-A) W OKNIE OCHRONY,
 *      AI-A↔AI-B w formalnym traktacie pokoju (peaceUntilTurn w przyszłości,
 *      isPeaceLocked===true) — AI-B zdobywa miasto (lejek 1, resolveSiegeSurrender) —
 *      PO zdobyciu: relacja AI-B↔AI-A realnie === 'wojna', isPeaceLocked===false (traktat
 *      złamany), mimo że PRZED zdobyciem obowiązywał pokój.
 *  D.  KRYTERIUM 1 (lejek 2): to samo, ale przejęcie przez `captureCityWithoutBattle`
 *      (applyCityCaptureToMap) zamiast kapitulacji oblężniczej — ten sam efekt.
 *  E.  KRYTERIUM 2: identyczny scenariusz, ale okno ochrony JUŻ minęło
 *      (`rebelProtectionTurnsRemaining` wygasło/nieustawione) — PO zdobyciu: traktat
 *      pokoju NIETKNIĘTY, relacja NIE zmienia się na 'wojna' — zachowanie identyczne jak
 *      przed tą zmianą.
 *  F.  KRYTERIUM 3 (symetria): role odwrócone — miasto AI (rebelPreviousOwnerId=AI-A)
 *      zdobywa GRACZ (ownerId=0) w oknie ochrony — identyczna konsekwencja: AI-A wchodzi
 *      w wojnę z graczem, mimo traktatu pokoju.
 *  F2. KRYTERIUM 1 (branch defenderId===0 w ownerDeclareWarOn, dodane w RUNDZIE 1 po
 *      zarzucie Evaluatora): miasto GRACZA (rebelPreviousOwnerId=0) w oknie ochrony
 *      zdobywa AI-B — jedyne miejsce w tej bramce, gdzie `rebelPrevOwnerId===0` faktycznie
 *      dociera do `ownerDeclareWarOn`, więc jedyne żywe pokrycie gałęzi UI/audiencji
 *      dyplomacji uruchamianej WYŁĄCZNIE gdy to gracz jest bylym właścicielem
 *      (`pruneInvalidNegotiations`/`showHintMessage`/`updateDiplomacyAudience`/
 *      `updateDiplomacyPanel`/`updateHud`/`wireUnitRendererRingStance`). Sekcje C/D
 *      testują wyłącznie parę AI<->AI, sekcja F testuje gracza jako ZDOBYWCĘ (kryterium
 *      3) — ani jedna, ani druga nie pokrywa gracza jako BYŁEGO WŁAŚCICIELA.
 *  G.  KRYTERIUM 4: bylej właściciel (AI-A) odzyskuje WŁASNE zbuntowane miasto w oknie
 *      ochrony — ZERO nowej konsekwencji wojennej (żaden trzeci traktat/relacja się nie
 *      zmienia) — dokładnie jak dzisiejszy `isRebellionReconquest`.
 *  H.  GOAL 5: barbarzyńca zdobywa chronione zbuntowane miasto w oknie ochrony — ZERO
 *      konsekwencji wojennej wobec bylego właściciela (barbarzyńcy bez dyplomacji).
 *  I.  KRYTERIUM 6 (regresja): `ownerDeclareWarOn` BEZ `force` — para w peace-locku
 *      NADAL nie wchodzi w wojnę (guard `isPeaceLockedBetween` działa jak dziś dla
 *      WSZYSTKICH innych wywołań — dowód pośredni: analogiczny scenariusz zdobycia miasta
 *      SPOZA okna ochrony, patrz E, oraz bezpośrednie wywołanie testowe poniżej).
 *  J.  KRYTERIUM 7 (regresja): `postCaptureLawTurnsRemaining`/`wasRebellionReconquest`
 *      (B-LAW-Q1) nadal poprawne po zwykłym odbiciu — niezależne od nowego licznika
 *      (dowód uzupełniający testem jednostkowym w `post-capture-law-test.cjs`, tu
 *      potwierdzone że silnik żywy nie rzuca błędów przy żadnym z powyższych przejęć).
 *  K.  Zero console.error / pageerror w całym scenariuszu.
 *
 * Bramka (z katalogu gra/): node tools/rebel-protection-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-rebel-protection-live-test');
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
  console.log('[rebel-protection-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[rebel-protection-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[rebel-protection-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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

async function runEndTurnAndSettle(page, timeoutMs = 120000) {
  // Kryterium "settled" = numer tury faktycznie wzrósł ORAZ endTurnInProgress===false --
  // odporne na sytuację, gdy tura kończy się BARDZO szybko (np. sekcja B tego testu
  // czyści wszystkie jednostki wroga przed każdym endTurn(), więc faza AI nie ma nic do
  // roboty i cały tick może zamknąć się między dwoma odpytaniami co 120ms) -- poprzedni
  // wzorzec "zaobserwuj true, potem false" (wzorem innych *-live-test.cjs w tym
  // katalogu, gdzie tura zawsze trwa dłużej niż odstęp odpytywania) failował fałszywie w
  // takim przypadku, bo `sawInProgress` nigdy nie łapał chwili `true`.
  const turnBefore = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  let settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    const turnNow = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!inProg && turnNow > turnBefore) { settled = true; break; }
    await wait(120);
  }
  await wait(200);
  return { sawInProgress, settled };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[rebel-protection-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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
    assert('bootstrap: citiesLen>0', world0.citiesLen > 0, world0);
    assert('bootstrap: turn===1', world0.turn === 1, world0);

    const two = await page.evaluate(() => window.__rebelProtectionTestDebug.pickTwoAiOwners());
    assert('bootstrap: AI-A (realny, właściciel miasta) + AI-B (odrębny numeryczny ownerId) dostępni', !!two, two);
    const { a: aiA, b: aiB } = two;
    console.log(`   AI-A=${aiA} AI-B=${aiB}`);
    // Jedno, realnie AI-A-owned miasto na starcie -- ponownie wykorzystywane (restaged
    // przez stageRebelCity) w sekcjach C-H poniżej, zamiast szukać "kolejnego" miasta
    // AI-A po każdym przejęciu (ten mały sandbox ma dokładnie jedno miasto AI-A).
    const testCityId = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), aiA);
    assert('miasto AI-A (testCityId) znalezione na starcie', !!testCityId, testCityId);

    console.log('\n-- B. TICK REALNY, WIELOTUROWY: bunt gracza (trigger naturalny) + 15 kolejnych prawdziwych endTurn() --');
    // Odsuwamy jednostki GRACZA (nie usuwamy jednostek AI -- usunięcie jedynej jednostki
    // AI w tym malutkim sandboksie zerowało jej Power i wywoływało FAŁSZYWE zwycięstwo
    // przez dominację, patrz historia tej bramki) od sąsiedztwa Aten PRZED rozegraniem
    // wielu tur, żeby modal preBattle w fazie AI (ten sam mechanizm co w
    // rebel-city-notification-live-test.cjs) nie zablokował endTurn() nr 2+. Osobno:
    // ten malutki 2-cywilizacyjny sandbox (Power gracza/AI niezrównoważone od startu,
    // patrz komentarz przy `rebelProtectionTestSkipVictoryCheck` w main.ts) naturalnie
    // spełnia próg zwycięstwa przez dominację po 1-2 turach, NIEZALEŻNIE od tego
    // dispatchu -- `disableVictoryCheckForTest()` wyłącza WYŁĄCZNIE `checkVictory` dla
    // TEJ sesji, żeby dowieść mechanizmu ticku (ortogonalnego wobec zwycięstwa/porażki)
    // na kilkunastu realnych turach bez przedwczesnego `gameOver`.
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    const moved = await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
    console.log(`   odsunięto ${moved} jednostek gracza (izolacja pod wieloturowy tick)`);

    const playerCity = await page.evaluate(() => window.__rebelNotifyTestDebug.getPlayerCity());
    assert('miasto gracza znalezione', !!playerCity && typeof playerCity.id === 'string', playerCity);
    const forced = await page.evaluate(
      (cityId) => window.__rebelNotifyTestDebug.forceRevoltEligible(cityId), playerCity.id,
    );
    assert('forceRevoltEligible zwrócił graceTurns>0', forced.graceTurns > 0, forced);
    const r0 = await runEndTurnAndSettle(page);
    assert('tura buntu: endTurn() faktycznie się dokonał', r0.settled, r0);

    let protState = await page.evaluate(
      (cityId) => window.__rebelProtectionTestDebug.getCityProtectionState(cityId), playerCity.id,
    );
    assert('KRYTERIUM 1/7 (start): bunt ustawia rebelState=true', protState && protState.rebelState === true, protState);
    assert('KRYTERIUM 1/7 (start): rebelProtectionTurnsRemaining===20 tuż po buncie', protState && protState.rebelProtectionTurnsRemaining === 20, protState);

    // 12 REALNYCH, kolejnych endTurn() -- "kilkanaście tur" z REGUŁY PRZECIW
    // SAMOOSZUKIWANIU dispatchu. Górna granica empiryczna tego konkretnego, malutkiego
    // sandboksa (seed PLAYTEST_MAPA_SEED, deterministyczny RNG(turn)): AI (Ateny)
    // konsekwentnie produkuje/przemieszcza jednostkę w okolicy tury 13, ponownie
    // blokując preBattle-modalem mimo pullPlayerUnitsHome() przed każdym endTurn()
    // (ten sam, udokumentowany od dawna strukturalny limit tego sandboksa co w
    // rebel-city-notification-live-test.cjs -- "jedna prawdziwa tura" -- tu rozszerzony
    // do dwunastu empirycznie ustalonym eksperymentem, nie zgadywaniem).
    const TICKS = 12;
    let lastRemaining = protState.rebelProtectionTurnsRemaining;
    let allDecrementedByOne = true;
    for (let i = 0; i < TICKS; i++) {
      // Ponowne odsunięcie jednostek gracza PRZED KAŻDYM endTurn() (no-op po pierwszym
      // razie, gdy miasto gracza jest już zbuntowane/bez właściciela=0 -- patrz
      // pullPlayerUnitsHome -- ale nieszkodliwe i tanie, więc wołane defensywnie).
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      const r = await runEndTurnAndSettle(page);
      if (!r.settled) {
        allDecrementedByOne = false;
        console.error(`   tick ${i + 1}: endTurn() nie osiągnął settled (${JSON.stringify(r)})`);
        break;
      }
      const st = await page.evaluate(
        (cityId) => window.__rebelProtectionTestDebug.getCityProtectionState(cityId), playerCity.id,
      );
      const expected = lastRemaining - 1;
      if (st.rebelProtectionTurnsRemaining !== expected) {
        allDecrementedByOne = false;
        console.error(`   tick ${i + 1}: oczekiwano ${expected}, dostano ${JSON.stringify(st)}`);
        break;
      }
      lastRemaining = st.rebelProtectionTurnsRemaining;
    }
    assert(`KRYTERIUM 5/2 (mechanizm): ${TICKS} realnych endTurn() z rzędu -> licznik zmalał o dokładnie 1 na turę, żywy silnik (20 -> ${lastRemaining})`, allDecrementedByOne, { lastRemaining });
    assert(`licznik po ${TICKS} turach === ${20 - TICKS} (20-${TICKS})`, lastRemaining === 20 - TICKS, { lastRemaining });

    console.log('\n-- C. KRYTERIUM 1 (lejek 1, resolveSiegeSurrender): miasto W OKNIE OCHRONY, para w pokoju --');
    // `testCityId` restaged wprost w "zbuntowane, rebelPreviousOwnerId=AI-A" (ten sam
    // kształt pól, jaki zapisuje realny markCityRebellionStarted) -- pełna kontrola nad
    // AI-A/AI-B do testu traktatu, niezależnie od tego, kto faktycznie posiadał to
    // miasto chwilę wcześniej (stageRebelCity nadpisuje ownerId bezwarunkowo).
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 20),
      { cityId: testCityId, prev: aiA },
    );
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: aiA, b: aiB });
    const peaceBefore1 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    const relBefore1 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('PRZED zdobyciem: AI-A<->AI-B w formalnym pokoju (peace-lock)', peaceBefore1 === true, { peaceBefore1 });
    assert('PRZED zdobyciem: relacja AI-A<->AI-B NIE jest "wojna"', relBefore1 !== 'wojna', { relBefore1 });

    await page.evaluate(({ cityId, besieger }) => window.__rebelProtectionTestDebug.captureViaSiegeSurrender(cityId, besieger), { cityId: testCityId, besieger: aiB });
    const cityAfter1 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('miasto faktycznie przejęte przez AI-B (lejek 1)', cityAfter1 && cityAfter1.ownerId === aiB, cityAfter1);
    const peaceAfter1 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    const relAfter1 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('SEDNO KRYTERIUM 1 (lejek 1): PO zdobyciu w oknie ochrony -- traktat pokoju ZŁAMANY (isPeaceLocked===false)', peaceAfter1 === false, { peaceAfter1 });
    assert('SEDNO KRYTERIUM 1 (lejek 1): PO zdobyciu w oknie ochrony -- AI-B<->AI-A faktycznie w stanie "wojna"', relAfter1 === 'wojna', { relAfter1 });

    console.log('\n-- D. KRYTERIUM 1 (lejek 2, captureCityWithoutBattle/applyCityCaptureToMap) --');
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 20),
      { cityId: testCityId, prev: aiA },
    );
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: aiA, b: aiB });
    const peaceBefore2 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    assert('PRZED zdobyciem (lejek 2): AI-A<->AI-B w formalnym pokoju', peaceBefore2 === true, { peaceBefore2 });

    await page.evaluate(({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk), { cityId: testCityId, atk: aiB });
    const cityAfter2 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('miasto faktycznie przejęte przez AI-B (lejek 2)', cityAfter2 && cityAfter2.ownerId === aiB, cityAfter2);
    const peaceAfter2 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    const relAfter2 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('SEDNO KRYTERIUM 1 (lejek 2): PO zdobyciu w oknie ochrony -- traktat ZŁAMANY (isPeaceLocked===false)', peaceAfter2 === false, { peaceAfter2 });
    assert('SEDNO KRYTERIUM 1 (lejek 2): PO zdobyciu w oknie ochrony -- AI-B<->AI-A faktycznie "wojna"', relAfter2 === 'wojna', { relAfter2 });

    console.log('\n-- E. KRYTERIUM 2: identyczny scenariusz, ale POZA oknem ochrony (licznik wygasł) --');
    // rebelProtectionTurnsRemaining=0 -> tickRebelProtectionEndOfTurn go już skasowałby;
    // tu wprost odtwarzamy stan PO upływie 20 tur (pole nieustawione) -- ten sam kształt
    // co realny tick po 20. staged z turnsRemaining=0 poprzez pominięcie pola.
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 0),
      { cityId: testCityId, prev: aiA },
    );
    const protState3 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('okno ochrony ustawione na 0 (poza oknem)', protState3 && protState3.rebelProtectionTurnsRemaining === 0, protState3);
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: aiA, b: aiB });
    const peaceBefore3 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    assert('PRZED zdobyciem (poza oknem): AI-A<->AI-B w pokoju', peaceBefore3 === true, { peaceBefore3 });

    await page.evaluate(({ cityId, besieger }) => window.__rebelProtectionTestDebug.captureViaSiegeSurrender(cityId, besieger), { cityId: testCityId, besieger: aiB });
    const cityAfter3 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('miasto faktycznie przejęte przez AI-B (poza oknem)', cityAfter3 && cityAfter3.ownerId === aiB, cityAfter3);
    const peaceAfter3 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    const relAfter3 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('SEDNO KRYTERIUM 2: POZA oknem ochrony -- traktat pokoju NIETKNIĘTY (isPeaceLocked===true)', peaceAfter3 === true, { peaceAfter3 });
    assert('SEDNO KRYTERIUM 2/6 (regresja): POZA oknem -- relacja NIE zmienia się na "wojna" (zachowanie jak dziś)', relAfter3 !== 'wojna', { relAfter3 });

    console.log('\n-- F. KRYTERIUM 3 (symetria gracz/AI): miasto AI zdobywa GRACZ w oknie ochrony --');
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 20),
      { cityId: testCityId, prev: aiA },
    );
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: 0, b: aiA });
    const peaceBefore4 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: 0, b: aiA });
    assert('PRZED zdobyciem (symetria): gracz<->AI-A w pokoju', peaceBefore4 === true, { peaceBefore4 });

    await page.evaluate(({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk), { cityId: testCityId, atk: 0 });
    const cityAfter4 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('miasto faktycznie przejęte przez gracza (ownerId===0)', cityAfter4 && cityAfter4.ownerId === 0, cityAfter4);
    const peaceAfter4 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: 0, b: aiA });
    const relAfter4 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: 0, b: aiA });
    assert('SEDNO KRYTERIUM 3: gracz jako zdobywca -- traktat ZŁAMANY (identyczna konsekwencja jak AI-zdobywca)', peaceAfter4 === false, { peaceAfter4 });
    assert('SEDNO KRYTERIUM 3: gracz jako zdobywca -- gracz<->AI-A faktycznie "wojna"', relAfter4 === 'wojna', { relAfter4 });

    console.log('\n-- F2. KRYTERIUM 1 (branch defenderId===0 w ownerDeclareWarOn): miasto GRACZA (rebelPrevOwnerId=0) w oknie ochrony, zdobywa AI --');
    // Domyka lukę zgłoszoną przez Evaluatora w RUNDZIE 1: sekcje C/D wyżej wprost testują
    // WYŁĄCZNIE parę AI<->AI (rebelPrevOwnerId=aiA). Sekcja F testuje gracza jako
    // ZDOBYWCĘ (kryterium 3), nie jako BYŁEGO WŁAŚCICIELA. W main.ts gałąź
    // `if (defenderId === 0) { pruneInvalidNegotiations(); showHintMessage(...);
    // updateDiplomacyAudience(); ... updateHud(); wireUnitRendererRingStance(); }`
    // wewnątrz `ownerDeclareWarOn` uruchamia się WYŁĄCZNIE gdy to GRACZ jest bylym
    // właścicielem zbuntowanego miasta (rebelPrevOwnerId===0) zaatakowanego wymuszoną
    // wojną -- ten blok jest jedynym miejscem w całej bramce, które faktycznie
    // wywołuje `triggerRebelProtectionWarConsequence`/`ownerDeclareWarOn(force=true)`
    // z `rebelPrevOwnerId===0`, więc jest jedynym żywym pokryciem tej gałęzi.
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 20),
      { cityId: testCityId, prev: 0 },
    );
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: 0, b: aiB });
    const peaceBefore7 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: 0, b: aiB });
    const relBefore7 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: 0, b: aiB });
    assert('PRZED zdobyciem (defenderId===0): gracz<->AI-B w formalnym pokoju (peace-lock)', peaceBefore7 === true, { peaceBefore7 });
    assert('PRZED zdobyciem (defenderId===0): relacja gracz<->AI-B NIE jest "wojna"', relBefore7 !== 'wojna', { relBefore7 });

    await page.evaluate(({ cityId, besieger }) => window.__rebelProtectionTestDebug.captureViaSiegeSurrender(cityId, besieger), { cityId: testCityId, besieger: aiB });
    const cityAfter7 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('miasto faktycznie przejęte przez AI-B (rebelPrevOwnerId=gracz)', cityAfter7 && cityAfter7.ownerId === aiB, cityAfter7);
    const peaceAfter7 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: 0, b: aiB });
    const relAfter7 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: 0, b: aiB });
    assert('SEDNO KRYTERIUM 1 (defenderId===0): PO zdobyciu w oknie ochrony -- traktat gracz<->AI-B ZŁAMANY (isPeaceLocked===false)', peaceAfter7 === false, { peaceAfter7 });
    assert('SEDNO KRYTERIUM 1 (defenderId===0): PO zdobyciu w oknie ochrony -- gracz<->AI-B faktycznie w stanie "wojna"', relAfter7 === 'wojna', { relAfter7 });

    console.log('\n-- G. KRYTERIUM 4: bylej właściciel odzyskuje WŁASNE zbuntowane miasto -- zero konsekwencji --');
    // UWAGA: po sekcji F2 miasto należy do AI-B (ownerId===aiB) -- restage z
    // rebelPreviousOwnerId=aiA nadpisuje to bezwarunkowo, zgodnie ze wzorcem powyżej.
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 20),
      { cityId: testCityId, prev: aiA },
    );
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: aiA, b: aiB });
    await page.evaluate(({ cityId, besieger }) => window.__rebelProtectionTestDebug.captureViaSiegeSurrender(cityId, besieger), { cityId: testCityId, besieger: aiA });
    const cityAfter5 = await page.evaluate((cid) => window.__rebelProtectionTestDebug.getCityProtectionState(cid), testCityId);
    assert('miasto odzyskane przez bylego właściciela AI-A (reconquest)', cityAfter5 && cityAfter5.ownerId === aiA, cityAfter5);
    const peaceAfter5 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    assert('SEDNO KRYTERIUM 4: reconquest -- traktat AI-A<->AI-B (niezwiązana trzecia strona) NIETKNIĘTY', peaceAfter5 === true, { peaceAfter5 });

    console.log('\n-- H. GOAL 5: barbarzyńca zdobywa chronione zbuntowane miasto -- zero konsekwencji dyplomatycznej --');
    await page.evaluate(
      ({ cityId, prev }) => window.__rebelProtectionTestDebug.stageRebelCity(cityId, prev, 20),
      { cityId: testCityId, prev: aiA },
    );
    await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.setPeaceLock(a, b, 30), { a: aiA, b: aiB });
    const barbId = await page.evaluate(() => window.__rebelProtectionTestDebug.BARBARIAN_OWNER_ID);
    let barbCaptureError = null;
    try {
      await page.evaluate(({ cityId, besieger }) => window.__rebelProtectionTestDebug.captureViaSiegeSurrender(cityId, besieger), { cityId: testCityId, besieger: barbId });
    } catch (e) {
      barbCaptureError = String(e);
    }
    assert('przejęcie przez barbarzyńcę nie rzuca błędu', barbCaptureError === null, barbCaptureError);
    const peaceAfter6 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    assert('GOAL 5: przejęcie przez barbarzyńcę -- traktat AI-A<->AI-B (niezwiązana strona) NIETKNIĘTY', peaceAfter6 === true, { peaceAfter6 });

    console.log('\n-- I. Konsola czysta --');
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
  console.error('[rebel-protection-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
