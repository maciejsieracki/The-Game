'use strict';
/**
 * hotseat-etap6f-part2-ui-test.cjs — bramka R-HOTSEAT-ETAP6F-PART2-UI-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU tego dispatchu: zakaz uznania tematu za zamknięty
 * na podstawie samej obecności kodu UI lub testu sprawdzającego tylko WARTOŚĆ
 * `NewGameParams` bez realnego uruchomienia `applyClusterStartPlan`/startu gry na
 * żywym Chromium. Ten test PRZECHODZI PRAWDZIWY kreator (`newGameFlow.ts`) przez
 * realne kliknięcia DOM (krok Intro -> Epoka -> Cywilizacja -> Ustawienia ->
 * [Fotel 2] -> Generowanie), dokładnie tą samą ścieżką co prawdziwy gracz — NIE
 * woła `doStartGame()` bezpośrednio dla scenariuszy (a)-(c). Dowód końcowy to
 * zrzut stanu SILNIKA po starcie (`__hotSeatTestDebug.snapshotHumanSeatsForTest`
 * — WYŁĄCZNIE odczyt, zero mutacji, zero ponownego wołania generatora — patrz
 * uzasadnienie przy tym haku w main.ts), nie deklaracja ani wartość parametrów
 * kreatora.
 *
 * Wzorzec buildBundle()/launchBrowser()/closeBrowserSafely/pollUntil przejęty 1:1
 * z `hotseat-etap5-no-leak-test.cjs` (ten sam mechanizm, nie budowa od zera).
 *
 * Scenariusze (00-dispatch.md):
 *  a) Domyślnie (bez dotknięcia przełącznika hot-seat) — silnik PO starcie ma
 *     dokładnie jednego człowieka (owner 0). Zero regresji.
 *  b) Po włączeniu trybu dwuosobowego + wyborze cywilizacji fotela 2 + trybu
 *     odległości — silnik PO starcie ma DWÓCH ludzi, drugi z inną cywilizacją i
 *     innym heksem startowym niż fotel 1.
 *  c) Kafelek cywilizacji fotela 1 jest niewybieralny/wyszarzony na ekranie
 *     fotela 2 (ABC-Q3) — dowód ze zrzutu DOM (klasa `.disabled`, klik no-op).
 *  d) Regresja dev/quick-start (`__cityStateStartUnitsTestDebug.startNewGame`,
 *     ABC-Q5) — nadal dokładnie jeden człowiek po starcie.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6f-part2-ui-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap6f-part2-ui-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-etap6f-part2-ui-test] ' + msg); }

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
    await wait(400);
  }
  throw new Error(`pollUntil(${label}): timeout, ostatni stan = ${JSON.stringify(last)}`);
}

async function gotoMainMenu(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!(window).__cityStateStartUnitsTestDebug && !!(window).__hotSeatTestDebug,
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
      ready: !overlayVisible && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null,
      overlayVisible,
    };
  }, 360000, 'world-generated');
  await wait(300);
}

/**
 * Realne przejście kreatora Intro -> Epoka -> Cywilizacja -> Ustawienia (REALNE
 * kliknięcia DOM, ta sama ścieżka co gracz). Zatrzymuje się NA kroku 4 (Ustawienia),
 * z gotowym przyciskiem "ROZPOCZNIJ GRE" widocznym — dalszy przebieg zależy od
 * scenariusza (a/d = klik od razu, b/c = najpierw przełącznik hot-seat).
 */
async function openWizardToSettingsStep(page) {
  const playBtn = page.locator('.civ-menu button', { hasText: 'Rozpocznij gr' });
  await playBtn.first().click();
  await page.waitForSelector('.civ-newgame', { timeout: 30000 });
  await wait(150);

  const introCta = page.locator('.civ-newgame .cta-hero');
  await introCta.click();
  await wait(150);

  // Krok 2 (Epoka) -> Krok 3 (Cywilizacja): domyślny wybór jest już poprawny
  // (`ensureSelCivForEpoch`/`DEFAULT_START_EPOCH_ID`), "Dalej" jest od razu aktywny.
  const next1 = page.locator('.civ-newgame .nb.next');
  await next1.click();
  await wait(150);
  const next2 = page.locator('.civ-newgame .nb.next');
  await next2.click();
  await wait(150);

  await page.waitForSelector('.civ-newgame .seat2-toggle-row', { timeout: 15000 });
}

async function runScenarioA(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    // Scenariusz (a): BEZ dotknięcia przełącznika — klik "ROZPOCZNIJ GRE" od razu.
    const startBtn = page.locator('.civ-newgame .start');
    await startBtn.click();

    await waitForWorldGenerated(page);
    const snap = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotHumanSeatsForTest());

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };
    check(
      Array.isArray(snap.humanOwnerIds) && snap.humanOwnerIds.length === 1 && snap.humanOwnerIds[0] === 0,
      `(a) domyślnie dokładnie jeden człowiek (owner 0) — got ${JSON.stringify(snap.humanOwnerIds)}`,
    );
    check(jsExceptions.length === 0, `(a) zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);
    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function runScenarioBC(chromium, civByName) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    // Włącz hot-seat (klik REALNY na przełącznik, dokładnie ten sam handler co dla gracza).
    const toggle = page.locator('.civ-newgame .seat2-toggle-btn');
    await toggle.click();
    await wait(120);

    // "ROZPOCZNIJ GRE" z włączonym hot-seatem prowadzi do ekranu fotela 2, NIE od razu startuje.
    await page.locator('.civ-newgame .start').click();
    await page.waitForSelector('.civ-newgame .seat2-dist-row', { timeout: 15000 });
    await wait(150);

    // --- Scenariusz (c): kafelek fotela 1 wyszarzony/nieklikalny na ekranie fotela 2 ---
    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    const disabledInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card'));
      const disabled = cards.filter((c) => c.classList.contains('disabled'));
      return {
        disabledCount: disabled.length,
        disabledNames: disabled.map((c) => c.querySelector('.cn')?.textContent || ''),
        totalCount: cards.length,
      };
    });
    check(disabledInfo.disabledCount === 1, `(c) dokładnie jeden wyszarzony kafelek (fotel 1) — got ${disabledInfo.disabledCount}`);
    check(disabledInfo.totalCount > disabledInfo.disabledCount, `(c) siatka fotela 2 ma inne, klikalne kafelki poza wyszarzonym — got total=${disabledInfo.totalCount}`);

    // Klik na wyszarzony kafelek (fotel 1) musi być no-opem — brak handlera kliknięcia
    // (obrona w głębi ABC-Q3): stan zaznaczenia fotela 2 nie może się zmienić na fotel 1.
    const selBefore = await page.evaluate(() => {
      const sel = document.querySelector('.civ-newgame .civ-grid .card.sel');
      return sel ? sel.querySelector('.cn')?.textContent || '' : null;
    });
    await page.locator('.civ-newgame .civ-grid .card.disabled').first().click({ force: true });
    await wait(100);
    const selAfterClickDisabled = await page.evaluate(() => {
      const sel = document.querySelector('.civ-newgame .civ-grid .card.sel');
      return sel ? sel.querySelector('.cn')?.textContent || '' : null;
    });
    check(
      selAfterClickDisabled === selBefore,
      `(c) klik na kafelek fotela 1 (wyszarzony) jest no-opem — selekcja przed=${selBefore}, po=${selAfterClickDisabled}`,
    );

    // --- Scenariusz (b): wybierz KONKRETNĄ, inną cywilizację fotela 2 + tryb odległości ---
    const chosenName = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card:not(.disabled)'));
      const target = cards.find((c) => !c.classList.contains('sel')) || cards[0];
      if (!target) return null;
      (target).click();
      return target.querySelector('.cn')?.textContent || null;
    });
    check(!!chosenName, '(b) w siatce fotela 2 istnieje przynajmniej jeden klikalny kafelek');
    await wait(120);

    await page.locator('.civ-newgame .seat2-dist-opt', { hasText: 'Blisko' }).click();
    await wait(120);

    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    const snap = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotHumanSeatsForTest());
    check(
      Array.isArray(snap.humanOwnerIds) && snap.humanOwnerIds.length === 2,
      `(b) po starcie z hot-seatem: DWÓCH ludzi — got ${JSON.stringify(snap.humanOwnerIds)}`,
    );
    const secondOwnerId = (snap.humanOwnerIds || []).find((id) => id !== 0);
    check(secondOwnerId !== undefined, `(b) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap.humanOwnerIds)}`);
    if (secondOwnerId !== undefined) {
      const secondCivId = snap.civIdByOwner ? snap.civIdByOwner[secondOwnerId] : undefined;
      const expectedCivId = chosenName ? civByName[chosenName] : undefined;
      check(
        !!secondCivId && secondCivId !== 'rzymianie',
        `(b) drugi człowiek ma cywilizację różną od fotela 1 (rzymianie) — got ${secondCivId}`,
      );
      check(
        !expectedCivId || secondCivId === expectedCivId,
        `(b) cywilizacja drugiego człowieka w silniku zgadza się z klikniętym kafelkiem (${chosenName}) — oczekiwano ${expectedCivId}, got ${secondCivId}`,
      );
      const hex1 = snap.startHexByOwner ? snap.startHexByOwner[0] : null;
      const hex2 = snap.startHexByOwner ? snap.startHexByOwner[secondOwnerId] : null;
      check(!!hex1 && !!hex2, `(b) oba heksy startowe istnieją — got hex1=${JSON.stringify(hex1)} hex2=${JSON.stringify(hex2)}`);
      check(
        !!hex1 && !!hex2 && (hex1.q !== hex2.q || hex1.r !== hex2.r),
        `(b) heks startowy fotela 2 różni się od fotela 1 — got hex1=${JSON.stringify(hex1)} hex2=${JSON.stringify(hex2)}`,
      );
    }
    check(jsExceptions.length === 0, `(b/c) zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function runScenarioD(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    await gotoMainMenu(page);
    // ABC-Q5: quick-start/dev-shortcut ścieżka — NewGameParams budowany bez civId2,
    // niezmieniony przez ten temat. Woła REALNY doStartGame() (ten sam hak co inne
    // bramki), NIE przechodzi przez kreator (celowo — to jest test regresji tej,
    // odrębnej ścieżki, nie kreatora).
    await page.evaluate(() => { (window).__cityStateStartUnitsTestDebug.startNewGame('normal', 2); });
    await waitForWorldGenerated(page);

    const snap = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotHumanSeatsForTest());
    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };
    check(
      Array.isArray(snap.humanOwnerIds) && snap.humanOwnerIds.length === 1 && snap.humanOwnerIds[0] === 0,
      `(d) quick-start/dev-shortcut: nadal dokładnie jeden człowiek — got ${JSON.stringify(snap.humanOwnerIds)}`,
    );
    check(jsExceptions.length === 0, `(d) zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);
    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function runWithRetry(fn, chromium, label, ...args) {
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(chromium, ...args);
    } catch (e) {
      lastErr = e;
      log(`[${label}] próba ${attempt}/${maxAttempts} padła (${e && e.message ? e.message : e}) -- `
        + (attempt < maxAttempts ? 'ponawiam ze świeżym browser.launch()...' : 'wyczerpano próby.'));
    }
  }
  throw lastErr;
}

function buildCivByNameMap() {
  const civs = require(path.join(GRA_DIR, 'data/civs.json'));
  const out = {};
  for (const c of civs.cywilizacje) {
    if (c && typeof c.Cywilizacja === 'string' && typeof c.ikonaId === 'string') {
      out[c.Cywilizacja] = c.ikonaId;
    }
  }
  return out;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[hotseat-etap6f-part2-ui-test] BLOCK: playwright nie znaleziony w node_modules.');
    process.exit(2);
  }

  try {
    buildBundle();
  } catch (e) {
    console.error('[hotseat-etap6f-part2-ui-test] BLOCK: vite build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  const civByName = buildCivByNameMap();

  let resA, resBC, resD;
  try {
    resA = await runWithRetry(runScenarioA, chromium, 'a');
    resBC = await runWithRetry(runScenarioBC, chromium, 'b/c', civByName);
    resD = await runWithRetry(runScenarioD, chromium, 'd');
  } catch (e) {
    console.error('[hotseat-etap6f-part2-ui-test] BLOCK: scenariusz nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== SCENARIUSZ (a) domyślnie, bez regresji ===');
  console.log('PASS:', resA.pass);
  if (!resA.pass) resA.failures.forEach((f) => console.log('  FAIL: ' + f));

  console.log('\n=== SCENARIUSZE (b)+(c) hot-seat realny + wykluczenie duplikatu ===');
  console.log('PASS:', resBC.pass);
  if (!resBC.pass) resBC.failures.forEach((f) => console.log('  FAIL: ' + f));

  console.log('\n=== SCENARIUSZ (d) quick-start/dev-shortcut bez regresji ===');
  console.log('PASS:', resD.pass);
  if (!resD.pass) resD.failures.forEach((f) => console.log('  FAIL: ' + f));

  const pass = resA.pass && resBC.pass && resD.pass;
  console.log(`\nhotseat-etap6f-part2-ui-test: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap6f-part2-ui-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
