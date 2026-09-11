'use strict';
/**
 * hotseat-etap8-dyplomacja-ui-test.cjs — bramka R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1
 * (Etap 8 część ii, UI dopięte do warstwy danych części i).
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU tego dispatchu: zakaz uznania tematu za
 * zamknięty na podstawie samego czytania kodu LUB samych haków `*ForTest`.
 * Ten test klika REALNY DOM nowego UI:
 *  - fotel A OTWIERA nowy przycisk HUD (`.tb.inter-human`, dowód że jest w DOM —
 *    hot-seat-gating działa) i WYPEŁNIA formularz (`.ihd-new-type`/`.ihd-f-*`),
 *    SKŁADA propozycję (pakt nieagresji) przez klik `.ihd-new-submit`;
 *  - kończy turę REALNIE (`__eraTestDebug.endTurn()`) -> fotel B aktywny;
 *  - DOWÓD: badge na przycisku HUD fotela B pokazuje 1 (`.tb.inter-human .badge`);
 *  - fotel B OTWIERA ekran, WIDZI propozycję (`.civ-ihd-item`, treść zgodna z tym
 *    co złożył fotel A), KLIKA Akceptuj (`.ihd-accept`);
 *  - DOWÓD WYNIKU (hak, nie zamiennik kliknięcia): `countActiveDealsForTest`
 *    0 -> 1 i/lub `getDiploRelationForTest` zmieniona.
 *  Osobny scenariusz: fotel B zamiast akceptować KLIKA Kontrpropozycję
 *  (`.ihd-counter-toggle` -> zmiana pola w `.civ-ihd-counter-form` ->
 *  `.ihd-counter-submit`) -> kończy turę -> fotel A widzi kontrpropozycję
 *  (warunki zmienione, kierunek odwrócony) w swojej skrzynce.
 *  Osobny scenariusz REGRESJI: gra jednoosobowa — `.tb.inter-human` CAŁKOWICIE
 *  NIEOBECNY w DOM (querySelectorAll.length === 0, nie tylko niewidoczny).
 *
 * Wzorzec buildBundle()/launchBrowser()/closeBrowserSafely()/pollUntil()/
 * gotoMainMenu()/waitForWorldGenerated()/startHotSeatGame()/runWithRetry()
 * przejęty 1:1 z `hotseat-etap8-dyplomacja-dane-test.cjs`.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap8-dyplomacja-ui-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap8-dyplomacja-ui-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const DOWODY_DIR = path.join(GRA_DIR, '..', 'dowody');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-etap8-dyplomacja-ui-test] ' + msg); }

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

async function startSinglePlayerGame(page) {
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
}

function snapshotHumanSeats() {
  return (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
}

/**
 * Przy dystansie „Blisko" pierwszy kontakt dyplomatyczny (`diplomacyAudience.ts`,
 * `.civ-diplo-aud`) potrafi wyskoczyć automatycznie po założeniu miasta i
 * PRZESŁANIA kliknięcia (`.da-credbreak-foot` przechwytuje wskaźnik) — zamyka
 * się realnym klikiem `.civ-diplo-aud-back` (ten sam przycisk co
 * `R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs`), pętla na wypadek kilku
 * kart z rzędu (kolejne pierwsze kontakty).
 */
async function dismissDiplomacyAudienceIfOpen(page) {
  for (let i = 0; i < 5; i++) {
    const open = await page.evaluate(() => !!document.querySelector('.civ-diplo-aud'));
    if (!open) return;
    await page.locator('.civ-diplo-aud-back').first().click({ timeout: 5000 }).catch(() => {});
    await wait(150);
  }
}

async function ensureDowodyDir() {
  try { fs.mkdirSync(DOWODY_DIR, { recursive: true }); } catch { /* best-effort */ }
}

/**
 * SCENARIUSZ GŁÓWNY: fotel A klika przycisk HUD -> wypełnia formularz -> składa
 * propozycję (pakt nieagresji) -> kończy turę -> fotel B widzi badge=1 -> otwiera
 * ekran -> widzi propozycję -> KLIKA Akceptuj -> DOWÓD realnego wpisu w activeDeals.
 */
async function runScenarioProposeAcceptUi(chromium) {
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
    check(seat2 !== undefined, `(a) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap0.humanOwnerIds)}`);

    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(b) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    // (c) DOWÓD hot-seat-gating: przycisk HUD JEST w DOM dla fotela 1.
    const btnCountSeat1 = await page.evaluate(() => document.querySelectorAll('.tb.inter-human').length);
    check(btnCountSeat1 === 1, `(c) przycisk .tb.inter-human OBECNY w DOM (hot-seat) — got ${btnCountSeat1}`);

    // (d) Fotel 1 KLIKA przycisk HUD -> otwiera ekran.
    await dismissDiplomacyAudienceIfOpen(page);
    await page.locator('.tb.inter-human').click();
    await page.waitForSelector('.civ-ihd-overlay', { timeout: 10000 });

    // (e) Fotel 1 WYPEŁNIA formularz nowej propozycji: typ = pakt nieagresji, powód, turns.
    await page.locator('.ihd-new-type').selectOption('zaproponuj_pakt');
    await wait(80);
    await page.locator('.ihd-new-fields .ihd-f-powod').fill('Chcemy spokoju — test UI');
    await page.locator('.ihd-new-fields .ihd-f-turns').fill('20');

    // (f) Fotel 1 SKŁADA propozycję klikiem.
    await page.locator('.ihd-new-submit').click();
    await wait(150);

    // Zamyka ekran KLIKIEM przycisku X w modalu (overlay pełnoekranowy — sam
    // przycisk toolbara jest POD nim, re-klik go jest niemożliwy w realnej
    // przeglądarce, dokładnie tak jak nie da się kliknąć elementu pod modalem).
    await page.locator('.civ-ihd-overlay .dip-close-btn').click();
    await wait(80);

    const seat1SeesOwn = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat1,
    );
    check(seat1SeesOwn.length === 0, `(f) fotel 1 NIE widzi własnej propozycji jako adresowanej do siebie — got ${JSON.stringify(seat1SeesOwn)}`);

    const dealsBefore = await page.evaluate(
      ([a, b]) => (window).__hotSeatTestDebug.countActiveDealsForTest(a, b),
      [seat1, seat2],
    );
    check(dealsBefore === 0, `(przed) zero activeDeals między seat1/seat2 — got ${dealsBefore}`);

    // (g) Fotel 1 kończy turę REALNIE.
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);

    const snap1 = await page.evaluate(snapshotHumanSeats);
    check(snap1.activeHumanOwnerId === seat2, `(g) po końcu tury fotela 1: aktywny fotel = fotel 2 — got ${snap1.activeHumanOwnerId}`);

    // (h) DOWÓD: badge na przycisku HUD fotela 2 pokazuje 1.
    const badgeText = await page.locator('.tb.inter-human .badge').textContent();
    check(badgeText !== null && badgeText.trim() === '1', `(h) badge .tb.inter-human pokazuje 1 — got ${JSON.stringify(badgeText)}`);

    // (i) Fotel 2 OTWIERA ekran, WIDZI propozycję adresowaną do siebie.
    await dismissDiplomacyAudienceIfOpen(page);
    await page.locator('.tb.inter-human').click();
    await page.waitForSelector('.civ-ihd-item', { timeout: 10000 });
    const itemCount = await page.evaluate(() => document.querySelectorAll('.civ-ihd-item').length);
    check(itemCount === 1, `(i) fotel 2 widzi DOKŁADNIE 1 pozycję w skrzynce — got ${itemCount}`);
    const itemDetail = await page.locator('.civ-ihd-item .civ-ihd-detail').first().textContent();
    check(
      itemDetail !== null && itemDetail.includes('Chcemy spokoju — test UI') && itemDetail.includes('20'),
      `(i) treść propozycji zgodna z tym co złożył fotel 1 (powód+turns) — got ${JSON.stringify(itemDetail)}`,
    );

    // (j) Fotel 2 KLIKA Akceptuj.
    await page.locator('.civ-ihd-item .ihd-accept').first().click();
    await wait(150);

    // DOWÓD WYNIKU (hak — weryfikacja wyniku, NIE zamiennik kliknięcia).
    const dealsAfter = await page.evaluate(
      ([a, b]) => (window).__hotSeatTestDebug.countActiveDealsForTest(a, b),
      [seat1, seat2],
    );
    check(dealsAfter === 1, `(j) DOWÓD: activeDeals między seat1/seat2 przeszło 0 -> 1 po kliknięciu Akceptuj — got ${dealsAfter}`);

    const seat2ProposalsAfter = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat2,
    );
    check(seat2ProposalsAfter.length === 0, `(j) kolejka fotela 2 pusta po akceptacji — got ${seat2ProposalsAfter.length}`);

    await ensureDowodyDir();
    await page.screenshot({ path: path.join(DOWODY_DIR, 'hotseat-etap8-ui-propose-accept.png') }).catch(() => {});

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ KONTRPROPOZYCJA: fotel B KLIKA Kontrpropozycję zamiast Akceptuj,
 * zmienia warunek w formularzu, wysyła -> kończy turę -> fotel A widzi
 * kontrpropozycję (warunki zmienione, kierunek odwrócony) w swojej skrzynce.
 */
async function runScenarioCounterProposalUi(chromium) {
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
    check(seat2 !== undefined, `(a) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap0.humanOwnerIds)}`);

    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(b) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    await dismissDiplomacyAudienceIfOpen(page);
    await page.locator('.tb.inter-human').click();
    await page.waitForSelector('.civ-ihd-overlay', { timeout: 10000 });
    await page.locator('.ihd-new-type').selectOption('zaproponuj_pakt');
    await wait(80);
    await page.locator('.ihd-new-fields .ihd-f-powod').fill('Test kontrpropozycji');
    await page.locator('.ihd-new-fields .ihd-f-turns').fill('15');
    await page.locator('.ihd-new-submit').click();
    await wait(150);
    // Zamyka ekran KLIKIEM X w modalu (overlay pełnoekranowy zasłania toolbar).
    await page.locator('.civ-ihd-overlay .dip-close-btn').click();
    await wait(80);

    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);
    const snap1 = await page.evaluate(snapshotHumanSeats);
    check(snap1.activeHumanOwnerId === seat2, `(c) aktywny fotel = fotel 2 — got ${snap1.activeHumanOwnerId}`);

    // (d) Fotel 2 otwiera ekran, KLIKA Kontrpropozycję (nie Akceptuj).
    await dismissDiplomacyAudienceIfOpen(page);
    await page.locator('.tb.inter-human').click();
    await page.waitForSelector('.civ-ihd-item', { timeout: 10000 });
    await page.locator('.civ-ihd-item .ihd-counter-toggle').first().click();
    await page.waitForSelector('.civ-ihd-item .civ-ihd-counter-form:not([hidden])', { timeout: 5000 });

    // (e) Zmienia warunek (turns 15 -> 45) w formularzu kontrpropozycji.
    await page.locator('.civ-ihd-item .civ-ihd-counter-form .ihd-f-turns').fill('45');
    await page.locator('.civ-ihd-item .civ-ihd-counter-form .ihd-f-powod').fill('Kontra — test UI');
    await page.locator('.civ-ihd-item .ihd-counter-submit').first().click();
    await wait(150);

    const seat2ProposalsAfterCounter = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat2,
    );
    check(seat2ProposalsAfterCounter.length === 0, `(f) kolejka fotela 2 pusta po kontrpropozycji — got ${seat2ProposalsAfterCounter.length}`);

    // Zamyka ekran KLIKIEM X w modalu (overlay pełnoekranowy zasłania toolbar).
    await page.locator('.civ-ihd-overlay .dip-close-btn').click();
    await wait(80);

    // Fotel 2 zakłada własne miasto (wymagane, żeby advanceSeat() przełączył z powrotem).
    const founded2 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded2 === true, '(g) fotel 2: foundPlayerCityForActiveSeat() zwraca true');

    // Fotel 2 jest OSTATNIM nieprzetworzonym fotelem tej rundy — advanceSeat() woła
    // endActiveHumanTurn() (REALNE, ASYNCHRONICZNE przejście świata) — pollUntil,
    // nie stały wait (wzorzec 1:1 z hotseat-etap8-dyplomacja-dane-test.cjs (g-h)).
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    const snap2 = await pollUntil(page, () => {
      const snap = (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
      return { ready: snap.activeHumanOwnerId === 0, activeHumanOwnerId: snap.activeHumanOwnerId };
    }, 60000, 'world-end-turn-after-seat2-counter');
    check(snap2.activeHumanOwnerId === seat1, `(h) po końcu tury fotela 2: aktywny fotel = fotel 1 — got ${snap2.activeHumanOwnerId}`);

    // (i) DOWÓD SEDNA: fotel 1 WIDZI kontrpropozycję w swojej skrzynce przez UI —
    // kierunek odwrócony (fromLabel = drugi fotel), warunki zmienione (turns=45).
    await dismissDiplomacyAudienceIfOpen(page);
    await page.locator('.tb.inter-human').click();
    await page.waitForSelector('.civ-ihd-item', { timeout: 10000 });
    const itemCountA = await page.evaluate(() => document.querySelectorAll('.civ-ihd-item').length);
    check(itemCountA === 1, `(i) fotel 1 widzi DOKŁADNIE 1 pozycję (kontrpropozycję) — got ${itemCountA}`);
    const detailA = await page.locator('.civ-ihd-item .civ-ihd-detail').first().textContent();
    check(
      detailA !== null && detailA.includes('45') && detailA.includes('Kontra — test UI'),
      `(i) SEDNO: warunki ZMIENIONE widoczne w UI (turns=45, powód kontry) — got ${JSON.stringify(detailA)}`,
    );

    // DOWÓD WYNIKU strukturalny (hak — uzupełnienie, nie zamiennik kliknięć powyżej).
    const seat1Proposals = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.getInterHumanProposalsForTest(oid),
      seat1,
    );
    check(seat1Proposals.length === 1, `(i) hak: fotel 1 ma 1 propozycję — got ${seat1Proposals.length}`);
    const counterEntry = seat1Proposals[0];
    check(
      counterEntry && counterEntry.fromOwnerId === seat2 && counterEntry.toOwnerId === seat1,
      `(i) SEDNO: kierunek ODWRÓCONY — fromOwnerId===seat2, toOwnerId===seat1 — got ${JSON.stringify(counterEntry)}`,
    );
    check(
      counterEntry && counterEntry.cmd && counterEntry.cmd.turns === 45,
      `(i) SEDNO: cmd.turns===45 (oryginał: 15) — got ${JSON.stringify(counterEntry && counterEntry.cmd)}`,
    );

    await ensureDowodyDir();
    await page.screenshot({ path: path.join(DOWODY_DIR, 'hotseat-etap8-ui-counter-proposal.png') }).catch(() => {});

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ REGRESJI: gra JEDNOOSOBOWA — nowy przycisk HUD MUSI BYĆ CAŁKOWICIE
 * NIEOBECNY w DOM (nie tylko disabled/display:none — sprawdzone jawnie licznikiem).
 */
async function runScenarioSinglePlayerRegressionUi(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await startSinglePlayerGame(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 1 && snap0.humanOwnerIds[0] === 0,
      `regresja: dokładnie jeden człowiek (owner 0) — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );

    const founded = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded === true, 'regresja: foundPlayerCityForActiveSeat() zwraca true');

    // DOWÓD: przycisk CAŁKOWICIE nieobecny w DOM (nie disabled, nie display:none).
    const btnCount = await page.evaluate(() => document.querySelectorAll('.tb.inter-human').length);
    check(btnCount === 0, `regresja: .tb.inter-human CAŁKOWICIE NIEOBECNY w DOM (single-player) — got ${btnCount}`);

    check(jsExceptions.length === 0, `regresja: zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

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
    console.error('[hotseat-etap8-dyplomacja-ui-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  let acceptUi;
  let counterUi;
  let regUi;
  try {
    log('\n=== SCENARIUSZ UI: propozycja -> akceptacja (kliknięcia DOM) ===');
    acceptUi = await runWithRetry(runScenarioProposeAcceptUi, chromium, 'ui-propozycja-akceptacja');
    log('\n=== SCENARIUSZ UI: propozycja -> kontrpropozycja (kliknięcia DOM) ===');
    counterUi = await runWithRetry(runScenarioCounterProposalUi, chromium, 'ui-kontrpropozycja');
    log('\n=== SCENARIUSZ REGRESJI UI: gra jednoosobowa — przycisk nieobecny ===');
    regUi = await runWithRetry(runScenarioSinglePlayerRegressionUi, chromium, 'ui-regresja');
  } catch (e) {
    console.error('[hotseat-etap8-dyplomacja-ui-test] BLOCK: scenariusz nie zadziałał headless:', e);
    process.exit(2);
  }

  if (acceptUi.pass) log('SCENARIUSZ UI PROPOZYCJA->AKCEPTACJA: PASS');
  else { log('SCENARIUSZ UI PROPOZYCJA->AKCEPTACJA: FAIL'); acceptUi.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  if (counterUi.pass) log('SCENARIUSZ UI KONTRPROPOZYCJA: PASS');
  else { log('SCENARIUSZ UI KONTRPROPOZYCJA: FAIL'); counterUi.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  if (regUi.pass) log('SCENARIUSZ REGRESJI UI: PASS');
  else { log('SCENARIUSZ REGRESJI UI: FAIL'); regUi.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  const allPass = acceptUi.pass && counterUi.pass && regUi.pass;
  log('\n' + (allPass ? 'WSZYSTKIE SCENARIUSZE ZIELONE' : 'CO NAJMNIEJ JEDEN SCENARIUSZ CZERWONY'));
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
