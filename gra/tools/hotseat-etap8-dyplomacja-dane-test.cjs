'use strict';
/**
 * hotseat-etap8-dyplomacja-dane-test.cjs — bramka R-HOTSEAT-ETAP8-DYPLOMACJA-DANE-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU tego dispatchu: zakaz uznania tematu za zamknięty na
 * podstawie samego czytania kodu. Ten test:
 *  (a) startuje hot-seat REALNYM kreatorem (kliknięcia DOM — wzorzec 1:1 z
 *      `hotseat-dyplo-kontakt-per-fotel-test.cjs`), NIE ustawia `humanSeats` ręcznie;
 *  (b) fotel 1 zakłada pierwsze miasto REALNĄ ścieżką (`foundPlayerCityForActiveSeat()`),
 *      wymagane, żeby `advanceSeat()` (koniec tury) mógł przełączyć fotel;
 *  (c) fotel 1 (aktywny) SKŁADA propozycję paktu nieagresji (`RodzajTraktatu.PaktNieagresji`
 *      — istniejący typ 1:1, ABC-Q3: zero nowych wariantów) do fotela 2 przez
 *      `__hotSeatTestDebug.proposeToHumanForTest()` (woła DOKŁADNIE produkcyjny
 *      `proposeToHuman()`);
 *  (d) fotel 1 kończy turę REALNIE (`__eraTestDebug.endTurn()` -> `advanceSeat()`, ta sama
 *      funkcja co przycisk "Zakończ turę"/skrót "N") -> aktywny fotel = fotel 2;
 *  (e) DOWÓD: fotel 2 widzi propozycję ZAADRESOWANĄ DO NIEGO przez
 *      `getInterHumanProposalsForTest(seat2)` (jawny `toOwnerId===seat2`, W PRZECIWIEŃSTWIE
 *      do `pendingDiplomacyInbox` gdzie odbiorca jest niejawnie ME());
 *  (f) fotel 2 AKCEPTUJE (`respondToHumanProposalForTest(id, 'accept')`) -> DOWÓD realnego
 *      wpisu w `activeDeals` (`countActiveDealsForTest(seat1, seat2)` przechodzi 0 -> 1),
 *      TA SAMA struktura co dla istniejących traktatów AI/gracz (recon §1: `ActiveDeal.strony`
 *      generyczne na dowolną parę);
 *  (g) OSOBNY SCENARIUSZ (fresh browser, ta sama bramka): fotel 1 proponuje pakt fotelowi 2,
 *      kończy turę, fotel 2 zamiast akceptować składa KONTRPROPOZYCJĘ
 *      (`respondToHumanProposalForTest(id, 'counter', counterCmd)`, `turns` ZMIENIONE) ->
 *      kończy turę (fotel 2 -> fotel 1) -> DOWÓD: fotel 1 widzi kontrpropozycję
 *      (`getInterHumanProposalsForTest(seat1)`): `fromOwnerId===seat2`, `toOwnerId===seat1`
 *      (kierunek ODWRÓCONY), `cmd.turns` ZMIENIONE względem oryginału.
 *
 * SCENARIUSZ REGRESJI (osobna strona): gra JEDNOOSOBOWA — `pendingDiplomacyInbox`/dyplomacja
 * AI działa DOKŁADNIE jak dziś (`interHumanDiplomacyInbox` istnieje, ale pusta i bez wpływu).
 *
 * Wzorzec buildBundle()/launchBrowser()/closeBrowserSafely/pollUntil/gotoMainMenu/
 * openWizardToSettingsStep przejęty 1:1 z `hotseat-dyplo-kontakt-per-fotel-test.cjs`.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap8-dyplomacja-dane-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap8-dyplomacja-dane-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-etap8-dyplomacja-dane-test] ' + msg); }

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

/** Bezpośrednie dzieci danego PID przez /proc/<pid>/task/<tid>/children (Linux). */
function getChildPids(pid) {
  const out = [];
  let taskDirs;
  try { taskDirs = fs.readdirSync(`/proc/${pid}/task`); } catch { return out; }
  for (const tid of taskDirs) {
    try {
      const raw = fs.readFileSync(`/proc/${pid}/task/${tid}/children`, 'utf8').trim();
      if (raw) out.push(...raw.split(/\s+/).map(Number));
    } catch { /* proces/wątek zniknął w międzyczasie — pomijamy */ }
  }
  return out;
}

/** Zbiera CAŁE drzewo procesów (root + potomni rekurencyjnie: renderer/gpu/utility). */
function collectProcessTree(rootPid) {
  const all = [rootPid];
  const queue = [rootPid];
  while (queue.length) {
    const p = queue.shift();
    for (const child of getChildPids(p)) {
      if (!all.includes(child)) { all.push(child); queue.push(child); }
    }
  }
  return all;
}

/**
 * Naprawa diagnozy poprzedniej rundy: `browser.close()` bywa raced-away po 8s, a
 * zabicie WYŁĄCZNIE głównego PID przeglądarki zostawia osierocone podprocesy
 * (renderer/gpu/utility) żywe — kumulują się w ramach jednego procesu node przy
 * 3 sekwencyjnych uruchomieniach i powodują kontencję CPU pod swiftshaderem przy
 * 3. scenariuszu. Fix: zbierz CAŁE drzewo PID-ów PRZED próbą zamknięcia (dopóki
 * proces żyje i drzewo jest znane), a po próbie `browser.close()` dobij SIGKILL-em
 * każdy PID z drzewa — plus drugie, świeże zebranie z głównego PID na wypadek
 * procesów które zdążyły dospawnować się między pierwszym zebraniem a zabiciem.
 */
async function closeBrowserSafely(browser) {
  const proc = browser.process && browser.process();
  const rootPid = proc && proc.pid;
  let treePids = [];
  if (rootPid) {
    try { treePids = collectProcessTree(rootPid); } catch { /* best-effort */ }
  }

  await Promise.race([
    browser.close().catch(() => { /* już martwy */ }),
    wait(8000),
  ]);

  const killAll = (pids) => {
    for (const pid of pids) {
      try { process.kill(pid, 'SIGKILL'); } catch { /* już martwy */ }
    }
  };
  killAll(treePids);
  if (rootPid) {
    let secondPass = [];
    try { secondPass = collectProcessTree(rootPid); } catch { /* best-effort */ }
    killAll(secondPass);
  }
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

/** Realne przejście kreatora Intro -> Epoka -> Cywilizacja -> Ustawienia + WŁĄCZENIE
 *  hot-seatu (drugi fotel) + wybór dystansu "Blisko" + start. Wzorzec 1:1 z
 *  `hotseat-dyplo-kontakt-per-fotel-test.cjs`. */
async function startHotSeatGame(page) {
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
}

function snapshotHumanSeats() {
  return (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
}

/** Buduje `AIDiplomacyCommand` typu 'zaproponuj_pakt' (Pakt Nieagresji — istniejący
 *  RodzajTraktatu, ABC-Q3: zero nowych wariantów). */
function napCmd(toOwnerId, turns) {
  return { type: 'zaproponuj_pakt', targetId: String(toOwnerId), powod: 'test', turns };
}

/**
 * SCENARIUSZ GŁÓWNY (a)-(f): propozycja -> akceptacja, dowód realnego wpisu w activeDeals.
 */
async function runScenarioProposeAccept(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await startHotSeatGame(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 2,
      `(a) po starcie z hot-seatem: DWÓCH ludzi — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );
    const seat1 = 0;
    const seat2 = (snap0.humanOwnerIds || []).find((id) => id !== seat1);
    check(seat2 !== undefined, `(a) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap0.humanOwnerIds)}`);
    check(snap0.activeHumanOwnerId === seat1, `(a) aktywny fotel PO starcie to fotel 1 — got ${snap0.activeHumanOwnerId}`);

    const dealsBefore = await page.evaluate(
      ([a, b]) => (window).__hotSeatTestDebug.countActiveDealsForTest(a, b),
      [seat1, seat2],
    );
    check(dealsBefore === 0, `(przed) zero activeDeals między seat1/seat2 — got ${dealsBefore}`);

    // (b) Fotel 1 zakłada pierwsze miasto — REALNA ścieżka silnika (wymagane, żeby
    // advanceSeat() krok (d) mógł przełączyć fotel).
    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(b) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    // (c) Fotel 1 (aktywny) SKŁADA propozycję do fotela 2.
    const proposalId = await page.evaluate(
      ([from, to]) => (window).__hotSeatTestDebug.proposeToHumanForTest(
        from, to, { type: 'zaproponuj_pakt', targetId: String(to), powod: 'test', turns: 15 }, 'Pakt nieagresji — test',
      ),
      [seat1, seat2],
    );
    check(typeof proposalId === 'string' && proposalId.length > 0, `(c) proposeToHumanForTest zwraca id — got ${JSON.stringify(proposalId)}`);

    // Regresja: fotel 1 sam NIE widzi swojej propozycji jako zaadresowanej do siebie.
    const seat1SeesOwn = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat1,
    );
    check(seat1SeesOwn.length === 0, `(c) fotel 1 NIE widzi własnej propozycji jako adresowanej do siebie — got ${JSON.stringify(seat1SeesOwn)}`);

    // (d) Fotel 1 kończy turę — REALNA ścieżka (advanceSeat() przez ten sam hak co HUD/"N").
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);

    const snap1 = await page.evaluate(snapshotHumanSeats);
    check(
      snap1.activeHumanOwnerId === seat2,
      `(d) po końcu tury fotela 1: aktywny fotel = fotel 2 (${seat2}) — got ${snap1.activeHumanOwnerId}`,
    );

    // (e) DOWÓD: fotel 2 widzi propozycję ZAADRESOWANĄ DO NIEGO.
    const seat2Proposals = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat2,
    );
    check(seat2Proposals.length === 1, `(e) fotel 2 widzi DOKŁADNIE 1 propozycję adresowaną do siebie — got ${seat2Proposals.length}`);
    check(
      seat2Proposals[0] && seat2Proposals[0].fromOwnerId === seat1 && seat2Proposals[0].toOwnerId === seat2,
      `(e) propozycja: fromOwnerId===seat1, toOwnerId===seat2 — got ${JSON.stringify(seat2Proposals[0])}`,
    );
    check(seat2Proposals[0].id === proposalId, `(e) to TA SAMA propozycja co (c) — got ${seat2Proposals[0].id} vs ${proposalId}`);

    // (f) Fotel 2 AKCEPTUJE.
    const accepted = await page.evaluate(
      (id) => (window).__hotSeatTestDebug.respondToHumanProposalForTest(id, 'accept'),
      proposalId,
    );
    check(accepted === true, `(f) respondToHumanProposalForTest(accept) zwraca true — got ${accepted}`);

    const dealsAfter = await page.evaluate(
      ([a, b]) => (window).__hotSeatTestDebug.countActiveDealsForTest(a, b),
      [seat1, seat2],
    );
    check(dealsAfter === 1, `(f) DOWÓD: activeDeals między seat1/seat2 przeszło 0 -> 1 — got ${dealsAfter}`);

    const seat2ProposalsAfter = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat2,
    );
    check(seat2ProposalsAfter.length === 0, `(f) kolejka fotela 2 pusta po akceptacji — got ${seat2ProposalsAfter.length}`);

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ (g): propozycja -> KONTRPROPOZYCJA (warunki zmienione, kierunek odwrócony).
 */
async function runScenarioCounterProposal(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await startHotSeatGame(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    const seat1 = 0;
    const seat2 = (snap0.humanOwnerIds || []).find((id) => id !== seat1);
    check(seat2 !== undefined, `(g-a) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap0.humanOwnerIds)}`);

    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(g-b) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    const proposalId = await page.evaluate(
      ([from, to]) => (window).__hotSeatTestDebug.proposeToHumanForTest(
        from, to, { type: 'zaproponuj_pakt', targetId: String(to), powod: 'test', turns: 15 }, 'Pakt nieagresji — test',
      ),
      [seat1, seat2],
    );
    check(typeof proposalId === 'string' && proposalId.length > 0, `(g-c) proposeToHumanForTest zwraca id — got ${JSON.stringify(proposalId)}`);

    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);
    const snap1 = await page.evaluate(snapshotHumanSeats);
    check(snap1.activeHumanOwnerId === seat2, `(g-d) aktywny fotel = fotel 2 — got ${snap1.activeHumanOwnerId}`);

    // Fotel 2 zamiast akceptować SKŁADA KONTRPROPOZYCJĘ — warunki zmienione (turns: 15 -> 30).
    const countered = await page.evaluate(
      ([id, to]) => (window).__hotSeatTestDebug.respondToHumanProposalForTest(
        id, 'counter', { type: 'zaproponuj_pakt', targetId: String(to), powod: 'kontra-test', turns: 30 }, 'Kontrpropozycja — test',
      ),
      [proposalId, seat1],
    );
    check(countered === true, `(g-e) respondToHumanProposalForTest(counter) zwraca true — got ${countered}`);

    // Oryginalna propozycja zniknęła z kolejki fotela 2.
    const seat2ProposalsAfterCounter = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat2,
    );
    check(seat2ProposalsAfterCounter.length === 0, `(g-f) kolejka fotela 2 pusta po kontrpropozycji — got ${seat2ProposalsAfterCounter.length}`);

    // Zanim fotel 2 skończy turę, MUSI założyć własne miasto (jak fotel 1 w (b)),
    // inaczej advanceSeat() nie przełączy z powrotem na fotel 1.
    const founded2 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded2 === true, '(g-g) fotel 2: foundPlayerCityForActiveSeat() zwraca true');

    // (g-h) Fotel 2 jest OSTATNIM nieprzetworzonym fotelem tej rundy -- `advanceSeat()`
    // woła TU `endActiveHumanTurn()`, czyli REALNE, ASYNCHRONICZNE przejście świata
    // (`runWorldEndTurn`, main.ts), a dopiero PO nim `switchActiveHuman(humanOwnerIds[0])`
    // wraca na fotel 1 (main.ts ok. 34430-34441). Stały `wait(200)` (jak przy (g-d) wyżej,
    // gdzie `advanceSeat()` bierze gałąź "następny fotel" -- CZYSTO SYNCHRONICZNY
    // `switchActiveHuman()`, bez przejścia świata) jest tu ZA KRÓTKI i czyta stan
    // SPRZED zakończenia przejścia świata -- widziany fałszywy `activeHumanOwnerId`
    // to wciąż fotel 2 (49), NIE fotel AI. Wzorzec identyczny do `pollUntil` w
    // `hotseat-drugi-fotel-tura-test.cjs` (tam gdzie ta sama gałąź "ostatni fotel rundy"
    // jest sprawdzana) -- ta bramka miała TĘ SAMĄ asercję na `wait(200)` zamiast
    // `pollUntil`, więc zamiast REALNEGO defektu logiki `advanceSeat()`/`respondToHumanProposal`
    // to była wyścig-warunkowa (race) fałszywa czerwień samej bramki testowej.
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    const snap2 = await pollUntil(page, () => {
      // UWAGA: `checkFn` biegnie W PRZEGLĄDARCE (Playwright serializuje TYLKO ciało
      // funkcji) -- BEZ domknięcia na zmienne Node (`seat1`), dokładnie jak istniejący
      // wzorzec `hotseat-drugi-fotel-tura-test.cjs` (tam też literał `0`, nie zmienna).
      // Bezpieczne: `seat1` w tym pliku jest ZAWSZE literałem `0` (linia wyżej).
      const snap = (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
      return { ready: snap.activeHumanOwnerId === 0, activeHumanOwnerId: snap.activeHumanOwnerId };
    }, 60000, 'world-end-turn-after-seat2-counter');
    check(snap2.activeHumanOwnerId === seat1, `(g-h) po końcu tury fotela 2: aktywny fotel = fotel 1 — got ${snap2.activeHumanOwnerId}`);

    // DOWÓD SEDNA: fotel 1 widzi kontrpropozycję — kierunek ODWRÓCONY, warunki ZMIENIONE.
    const seat1Proposals = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat1,
    );
    check(seat1Proposals.length === 1, `(g-i) fotel 1 widzi DOKŁADNIE 1 propozycję (kontrpropozycję) — got ${seat1Proposals.length}`);
    const counterEntry = seat1Proposals[0];
    check(
      counterEntry && counterEntry.fromOwnerId === seat2 && counterEntry.toOwnerId === seat1,
      `(g-i) SEDNO: kierunek ODWRÓCONY — fromOwnerId===seat2, toOwnerId===seat1 — got ${JSON.stringify(counterEntry)}`,
    );
    check(
      counterEntry && counterEntry.cmd && counterEntry.cmd.turns === 30,
      `(g-i) SEDNO: warunki ZMIENIONE — cmd.turns===30 (oryginał: 15) — got ${JSON.stringify(counterEntry && counterEntry.cmd)}`,
    );
    check(
      counterEntry && counterEntry.id !== proposalId,
      `(g-i) kontrpropozycja ma NOWY id (nie ten sam co oryginał) — got ${counterEntry && counterEntry.id} vs ${proposalId}`,
    );

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ REGRESJI: gra JEDNOOSOBOWA — brak zmiany zachowania; kolejka
 * `interHumanDiplomacyInbox` istnieje, ale nikt jej nie używa (zero UI, zero API
 * wołanego przez normalny przebieg gry jednoosobowej).
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
    // BEZ dotknięcia przełącznika hot-seat — domyślnie jeden fotel.
    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 1 && snap0.humanOwnerIds[0] === 0,
      `regresja: dokładnie jeden człowiek (owner 0) — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );

    const proposalsForMe = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      0,
    );
    check(proposalsForMe.length === 0, `regresja: brak propozycji międzyludzkich w grze jednoosobowej — got ${proposalsForMe.length}`);

    const founded = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded === true, 'regresja: foundPlayerCityForActiveSeat() zwraca true');

    check(jsExceptions.length === 0, `regresja: zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/** Wzorzec 1:1 z `hotseat-dyplo-kontakt-per-fotel-test.cjs` — world-gen w headless
 *  swiftshader bywa wolniejszy niż jeden `pollUntil` timeout; ponawiamy ze świeżym
 *  `browser.launch()` zamiast raportować BLOCK po pierwszej próbie. */
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
    console.error('[hotseat-etap8-dyplomacja-dane-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  let accept1;
  let counter1;
  let reg1;
  try {
    log('\n=== SCENARIUSZ GŁÓWNY: propozycja -> akceptacja ===');
    accept1 = await runWithRetry(runScenarioProposeAccept, chromium, 'propozycja-akceptacja');
    log('\n=== SCENARIUSZ: propozycja -> kontrpropozycja ===');
    counter1 = await runWithRetry(runScenarioCounterProposal, chromium, 'kontrpropozycja');
    log('\n=== SCENARIUSZ REGRESJI: gra jednoosobowa ===');
    reg1 = await runWithRetry(runScenarioSinglePlayerRegression, chromium, 'regresja');
  } catch (e) {
    console.error('[hotseat-etap8-dyplomacja-dane-test] BLOCK: scenariusz nie zadziałał headless:', e);
    process.exit(2);
  }

  if (accept1.pass) log('SCENARIUSZ PROPOZYCJA->AKCEPTACJA: PASS');
  else { log('SCENARIUSZ PROPOZYCJA->AKCEPTACJA: FAIL'); accept1.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  if (counter1.pass) log('SCENARIUSZ KONTRPROPOZYCJA: PASS');
  else { log('SCENARIUSZ KONTRPROPOZYCJA: FAIL'); counter1.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  if (reg1.pass) log('SCENARIUSZ REGRESJI: PASS');
  else { log('SCENARIUSZ REGRESJI: FAIL'); reg1.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  const allPass = accept1.pass && counter1.pass && reg1.pass;
  log('\n' + (allPass ? 'WSZYSTKIE SCENARIUSZE ZIELONE' : 'CO NAJMNIEJ JEDEN SCENARIUSZ CZERWONY'));
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
