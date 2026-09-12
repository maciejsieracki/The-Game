'use strict';
/**
 * hotseat-etap6c-lastpraca-per-fotel-test.cjs — bramka
 * P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1.
 *
 * Dowodzi (recon §5/§6, dispatch kryteria 3-4): klaster cache HUD Praca (`_lastPraca`/
 * `_lastPracaRate`/...) jest TERAZ per-fotel, nie globalnym singletonem aliasowanym do
 * fotela 0 — konkretny mechanizm regresji z reconu: `setOwnerPracaPool(ownerId, value)`
 * PRZED naprawą zawsze pisał `_lastPraca = playerPracaPool` (singleton fotela 0)
 * niezależnie od `ownerId`, więc operacja fotela B nadpisywała czip "Praca" wartością
 * fotela 0.
 *
 * Scenariusz (żywy Chromium/Playwright, real DOM, REALNE funkcje produkcyjne — zero
 * reimplementacji logiki):
 *  (a) hot-seat 2 fotele włączony REALNYM kreatorem (ten sam wzorzec co
 *      `hotseat-drugi-fotel-tura-test.cjs`), oba fotele zakładają pierwsze miasto
 *      REALNĄ ścieżką (`__hotSeatTestDebug.foundPlayerCityForActiveSeat()`);
 *  (b) fotel 1 aktywny: `setOwnerPracaPoolForTest(fotel1, 55)` -- woła DOKŁADNIE
 *      `setOwnerPracaPool()`, tę samą funkcję, którą wołają realna transakcja handlowa
 *      Pracą i pętla auto-ulepszeń (Klaster F, main.ts ok. 31897-32061) na końcu
 *      swojego bloku (`setOwnerPracaPool(hOid, playerPracaPool)`) -- symuluje "fotel 1
 *      zrobił auto-ulepszenie kosztem Pracy, kończąc z pulą 55";
 *  (c) DOWÓD #1 (zrzut ekranu): czip "Praca" fotela 1 pokazuje 55;
 *  (d) `switchActiveHuman(fotel2)` (REALNA funkcja produkcyjna); fotel 2:
 *      `setOwnerPracaPoolForTest(fotel2, 91)` -- symuluje "fotel 2 zrobił transakcję
 *      handlową Pracą";
 *  (e) DOWÓD #2 (zrzut ekranu): czip "Praca" fotela 2 pokazuje 91 (NIE 55 fotela 1);
 *  (f) `switchActiveHuman(fotel1)` z powrotem — DOWÓD kluczowy dla regresji: czip
 *      fotela 1 WCIĄŻ pokazuje 55 (operacja fotela 2 go NIE nadpisała globalnym
 *      singletonem — dokładnie mechanizm regresji z reconu §5);
 *  (g) odczyt bezpośredni `hudPracaSnapshotForTest(ownerId)` dla OBU foteli
 *      jednocześnie (bez przełączania aktywnego fotela) -- potwierdza że
 *      `buildHudState(ownerId)` per-fotel jest źródłem prawdy, nie efekt uboczny
 *      renderowania DOM.
 * Osobny SCENARIUSZ REGRESJI (kryterium #2): gra jednoosobowa — `hudPracaSnapshotForTest(0)`
 * po `grantTestPraca()` pokazuje dokładnie oczekiwaną wartość (bit-identyczne z dawnym
 * czytaniem singletonu, bo fotel 0 jest aliasem, nie kopią — patrz `_lastPracaSlot` przy
 * `pracaPoolByHuman`, main.ts).
 *
 * SCENARIUSZ RÓŻNEGO UTRZYMANIA (runda 2, ZADANIE 3, Final Control rundy 1 -- wada
 * `pracaUpkeepPreview` = `.get(0)` zaszyte na fotel 0 zamiast `.get(ME())`): fotel 1
 * (owner 0) dostaje REALNY hex z ulepszeniem `tartak` (`RESOURCE_UPKEEP_IMPROVEMENT_KEYS`,
 * `setHexImprovementForTest`) -- `computePracaUpkeepByOwner()` (REALNY silnik) liczy dla
 * niego niezerowe utrzymanie Pracy; fotel 2 nie ma ŻADNEGO ulepszenia płatnego -- utrzymanie
 * 0. Asercja na `hudPracaSnapshotForTest(ownerId).pracaRate`/`.pracaUpkeep` dla OBU foteli:
 * przed naprawą `.get(0)` przeciekało niezerowe utrzymanie fotela 1 do podglądu fotela 2
 * (mimo że fotel 2 nie ma żadnego ulepszenia), obniżając jego `pracaRate` o cudzy koszt.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (C-031/CLAUDE.md §9 pkt 6b): `--assert-mutant` odtwarza
 * dosłownie DWA kody regresji w skopiowanym drzewie źródłowym -- (1) sprzed naprawy rundy 1
 * (`_lastPraca = playerPracaPool` zamiast zapisu per-owner) i (2) sprzed naprawy rundy 2
 * (`pracaUpkeepPreview` czytane przez `.get(0)` i pisane surowo `_lastPracaUpkeep = ...`
 * zamiast `.get(ME())`/`setOwnerLastPracaUpkeep(ME(), ...)`) -- i dowodzi, że scenariusz
 * główny (b)-(f) ORAZ scenariusz różnego utrzymania WTEDY CZERWIENIEJĄ — nietautologiczność.
 *
 * Wzorzec buildBundle()/launchBrowser()/closeBrowserSafely/pollUntil/openWizardToSettingsStep
 * przejęty 1:1 z `hotseat-drugi-fotel-tura-test.cjs` (ten sam mechanizm, nie budowa od zera).
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6c-lastpraca-per-fotel-test.cjs
 * Dowód mutacyjny (z katalogu gra/): node tools/hotseat-etap6c-lastpraca-per-fotel-test.cjs --assert-mutant
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ASSERT_MUTANT = process.argv.includes('--assert-mutant');

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-lastpraca-per-fotel-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const MUTANT_GRA_DIR = path.join(os.tmpdir(), `civ-hotseat-lastpraca-mutant-src-${RUN_ID}`);
const SHOT_DIR = path.resolve(REPO_ROOT, 'dowody');
const BUILD_DIR = ASSERT_MUTANT ? MUTANT_GRA_DIR : GRA_DIR;

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
  try { fs.rmSync(MUTANT_GRA_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-etap6c-lastpraca-per-fotel-test] ' + msg); }

/** REGUŁA PRZECIW SAMOOSZUKIWANIU: kopiuje `gra/` do katalogu scratch i cofa DOKŁADNIE
 *  jedną linię naprawy (`setOwnerLastPraca(ownerId, v)` -> stary buggy zapis
 *  `_lastPraca = playerPracaPool`) — bramka uruchomiona na tej mutacji MUSI zaczerwienić
 *  krok (f), inaczej test jest tautologiczny. */
function prepareMutantSourceTree() {
  log('--assert-mutant: kopiowanie gra/ do scratch i cofanie naprawy setOwnerPracaPool...');
  fs.rmSync(MUTANT_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(MUTANT_GRA_DIR, { recursive: true });
  // Brak `rsync` w tym środowisku (sprawdzone) — `fs.cpSync` (Node >=16.7, tu 22.x) z
  // filtrem pomijającym `node_modules`/`dist`, potem symlink node_modules (jak wyżej).
  fs.cpSync(GRA_DIR, MUTANT_GRA_DIR, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      return base !== 'node_modules' && base !== 'dist';
    },
  });
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(MUTANT_GRA_DIR, 'node_modules'));
  const mainTsPath = path.join(MUTANT_GRA_DIR, 'src', 'main.ts');
  let src = fs.readFileSync(mainTsPath, 'utf8');
  // Dopasowanie WYŁĄCZNIE linii zapisu (nie całego bloku z komentarzem wyjaśniającym
  // naprawę) -- odporne na przyszłe redagowanie komentarza, kruche tylko na zmianę nazwy
  // zmiennej `v`/funkcji `setOwnerLastPraca`, co i tak wymagałoby ręcznej korekty testu.
  const FIXED = '        setOwnerLastPraca(ownerId, v);';
  const BUGGY = '        _lastPraca = playerPracaPool;';
  if (!src.includes(FIXED)) {
    throw new Error('--assert-mutant: nie znaleziono naprawionego kodu setOwnerPracaPool w main.ts -- '
      + 'źródło mutacji rozjechało się z bieżącym stanem repo, popraw stałą FIXED w skrypcie.');
  }
  src = src.replace(FIXED, BUGGY);
  // Runda 2 (Final Control rundy 1): cofnięcie NAPRAWY `.get(0)` -> `.get(ME())` +
  // `setOwnerLastPracaUpkeep(ME(), ...)` -> surowy zapis singletonu fotela 0.
  const FIXED2 = '      ).get(ME()) ?? 0;\n'
    + '      // Zapis MUSI iść przez akcesor per-fotel (ten sam powód co `setOwnerLastPracaRate`\n'
    + '      // niżej) -- surowe `_lastPracaUpkeep = ...` pisało zawsze w alias fotela\n'
    + '      // HUMAN_OWNER_PRIMARY (fotel 0), korumpując cache innego aktywnego fotela.\n'
    + '      // To DAJE `setOwnerLastPracaUpkeep` pierwszego realnego wołającego dla\n'
    + '      // ownerId != 0 -- komentarz przy jej deklaracji (main.ts ~10867-10873),\n'
    + '      // twierdzący że funkcja nie ma wołającego, jest od teraz nieaktualny.\n'
    + '      setOwnerLastPracaUpkeep(ME(), pracaUpkeepPreview);';
  const BUGGY2 = '      ).get(0) ?? 0;\n'
    + '      _lastPracaUpkeep = pracaUpkeepPreview;';
  if (!src.includes(FIXED2)) {
    throw new Error('--assert-mutant: nie znaleziono naprawionego kodu pracaUpkeepPreview w main.ts -- '
      + 'źródło mutacji (runda 2) rozjechało się z bieżącym stanem repo, popraw stałą FIXED2 w skrypcie.');
  }
  src = src.replace(FIXED2, BUGGY2);
  fs.writeFileSync(mainTsPath, src, 'utf8');
  log('mutacja wstrzyknięta: setOwnerPracaPool() znów pisze `_lastPraca = playerPracaPool` '
    + '(kod sprzed naprawy rundy 1) ORAZ `pracaUpkeepPreview` znów czyta/pisze WYŁĄCZNIE fotel 0 '
    + '(kod sprzed naprawy rundy 2).');
}

function buildBundle() {
  log('budowanie bundla (vite build, jedyna dozwolona komenda buildu, C-001)' + (ASSERT_MUTANT ? ' [MUTANT]' : '') + '...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: BUILD_DIR, stdio: 'pipe' },
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
 *  kliknięcia DOM) — 1:1 z hotseat-drugi-fotel-tura-test.cjs. */
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

function snapshotHumanSeats() {
  return (window).__hotSeatTestDebug.snapshotHumanSeatsForTest();
}

/** Czip "Praca" w pasku HUD -- `data-act="praca"` (layout D1B/6C aktywny w realnej grze,
 *  `ui/hudChip6c.ts` `chip6cHtml()`); fallback na markup legacy `.res .lbl` (`ui/hud.ts`
 *  `res()`) dla `useD1BLayout()===false`, na wypadek gdyby test biegł na starszej ścieżce. */
function pracaChipLocator(page) {
  const d1b = page.locator('[data-act="praca"].civ-hud-chip');
  const legacy = page.locator('.res').filter({ has: page.locator('.lbl', { hasText: 'Praca' }) });
  return d1b.or(legacy);
}

async function pracaChipValueText(page) {
  const chip = pracaChipLocator(page).first();
  const valD1b = chip.locator('.civ-hud-chip-val');
  if (await valD1b.count() > 0) return valD1b.innerText();
  return chip.locator('.val').first().innerText();
}

// P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1 (obrona runda 2, Zarzut 3 Evaluatora):
// AI potrafi otworzyć losową "audiencję dyplomatyczną" (pełnoekranowy modal) w dowolnym
// momencie po założeniu drugiego miasta -- niezwiązane z klastrem cache Pracy tego tematu,
// ale zaobserwowane żywo: `.civ-hud` locator screenshot kadruje WEDŁUG bounding-boxa
// elementu, nie chowa nakładających się modali nad nim, więc otwarta audiencja w tym
// momencie potrafi ZASŁONIĆ pasek HUD na zrzucie -- czip pod spodem nadal ma poprawną
// wartość (asercja tekstowa niżej czyta DOM wprost, nie zrzut), ale DOWÓD wizualny byłby
// mylący. Zamykamy KAŻDĄ otwartą audiencję istniejącym hakiem testowym
// `__audienceRelTestDebug.closeAudience()` (main.ts ~23225, hak SPRZED tego dispatchu --
// zero nowego kodu produkcyjnego) tuż przed każdym zrzutem, żeby dowód zawsze pokazywał
// pasek HUD, nie przypadkowy modal.
async function dismissAnyDiplomacyAudience(page) {
  await page.evaluate(() => {
    const dbg = (window).__audienceRelTestDebug;
    if (dbg && typeof dbg.closeAudience === 'function') dbg.closeAudience();
  });
  await wait(50);
}

async function runScenarioMain(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };
    const shots = [];

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    // (a) Hot-seat REALNYM klikiem, oba fotele zakładają pierwsze miasto REALNĄ ścieżką.
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
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 2,
      `(a) hot-seat: DWÓCH ludzi — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );
    const seat1 = 0;
    const seat2 = (snap0.humanOwnerIds || []).find((id) => id !== seat1);
    check(seat2 !== undefined, `(a) istnieje drugi fotel — got ${JSON.stringify(snap0.humanOwnerIds)}`);
    check(snap0.activeHumanOwnerId === seat1, `(a) aktywny fotel PO starcie to fotel 1 — got ${snap0.activeHumanOwnerId}`);

    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(a) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    await page.evaluate((sid) => (window).__hotSeatTestDebug.switchActiveHuman(sid), seat2);
    const founded2 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded2 === true, '(a) fotel 2: foundPlayerCityForActiveSeat() zwraca true');

    // Powrót na fotel 1 -- (b) symuluj koniec auto-ulepszenia (Klaster F): pula=55.
    await page.evaluate((sid) => (window).__hotSeatTestDebug.switchActiveHuman(sid), seat1);
    await page.evaluate(
      ({ oid, v }) => (window).__hotSeatTestDebug.setOwnerPracaPoolForTest(oid, v),
      { oid: seat1, v: 55 },
    );
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);

    // (c) DOWÓD #1: czip fotela 1 = 55.
    const val1 = await pracaChipValueText(page);
    check(val1.trim() === '55', `(c) czip "Praca" fotela 1 pokazuje 55 — got "${val1}"`);
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    // Zrzut CAŁEGO paska HUD (`.civ-hud`), nie tylko czipa -- odporne na niestandardowy
    // tooltip HUD (`installHudTitleTooltips()`, ui/hud.ts) potrafiący nachodzić na ciasny
    // wycinek pojedynczego czipa; mysz w róg PRZED zrzutem, żeby żaden tooltip nie wisiał.
    await dismissAnyDiplomacyAudience(page);
    await page.mouse.move(5, 5);
    await wait(100);
    const shot1 = path.join(SHOT_DIR, 'hotseat-lastpraca-per-fotel-1-fotel1.png');
    await page.locator('.civ-hud').first().screenshot({ path: shot1 });
    shots.push(shot1);

    // (d) fotel 2 aktywny -- symuluj transakcję handlową Pracą: pula=91.
    await page.evaluate((sid) => (window).__hotSeatTestDebug.switchActiveHuman(sid), seat2);
    await page.evaluate(
      ({ oid, v }) => (window).__hotSeatTestDebug.setOwnerPracaPoolForTest(oid, v),
      { oid: seat2, v: 91 },
    );
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);

    // (e) DOWÓD #2: czip fotela 2 = 91 (NIE 55 fotela 1).
    const val2 = await pracaChipValueText(page);
    check(val2.trim() === '91', `(e) czip "Praca" fotela 2 pokazuje 91 — got "${val2}"`);
    await dismissAnyDiplomacyAudience(page);
    await page.mouse.move(5, 5);
    await wait(100);
    const shot2 = path.join(SHOT_DIR, 'hotseat-lastpraca-per-fotel-2-fotel2.png');
    await page.locator('.civ-hud').first().screenshot({ path: shot2 });
    shots.push(shot2);

    // (f) DOWÓD KLUCZOWY: powrót na fotel 1 -- czip WCIĄŻ 55, operacja fotela 2 go NIE
    // nadpisała (dokładnie mechanizm regresji z reconu §5 -- test MUSI się tu czerwienić
    // na kodzie sprzed naprawy, patrz --assert-mutant).
    await page.evaluate((sid) => (window).__hotSeatTestDebug.switchActiveHuman(sid), seat1);
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);
    const val1Again = await pracaChipValueText(page);
    check(
      val1Again.trim() === '55',
      `(f) REGRESJA: czip fotela 1 PO operacji fotela 2 WCIĄŻ pokazuje 55 (nie 91) — got "${val1Again}"`,
    );

    // (g) odczyt bezpośredni buildHudState(ownerId) dla OBU foteli, bez zależności od tego,
    // który jest aktywny w danej chwili -- niezależne od (b)-(f), potwierdza źródło danych.
    const snapPraca1 = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat1,
    );
    const snapPraca2 = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat2,
    );
    check(snapPraca1.praca === 55, `(g) buildHudState(fotel1).praca === 55 — got ${snapPraca1.praca}`);
    check(snapPraca2.praca === 91, `(g) buildHudState(fotel2).praca === 91 — got ${snapPraca2.praca}`);

    // (h) SCENARIUSZ RÓŻNEGO UTRZYMANIA (runda 2, ZADANIE 3, Final Control rundy 1):
    // fotel 1 (owner 0) dostaje REALNY hex z ulepszeniem `tartak` (utrzymanie Pracy > 0),
    // fotel 2 nie dostaje ŻADNEGO -- musi zostać przy utrzymaniu 0. Przed naprawą
    // `.get(0)` przeciekało niezerowe utrzymanie fotela 1 (owner 0) do podglądu fotela 2,
    // mimo że fotel 2 nie ma żadnego ulepszenia płatnego.
    const baseline1 = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat1,
    );
    const baseline2 = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat2,
    );
    check(baseline1.pracaUpkeep === 0, `(h) baseline: fotel 1 utrzymanie 0 przed ulepszeniem — got ${baseline1.pracaUpkeep}`);
    check(baseline2.pracaUpkeep === 0, `(h) baseline: fotel 2 utrzymanie 0 — got ${baseline2.pracaUpkeep}`);

    // fotel 1 jest aktywny (po kroku (f)) -- jego własny startHex dostaje `tartak`.
    const seat1Hex = snap0.startHexByOwner ? snap0.startHexByOwner[seat1] : null;
    check(!!seat1Hex, `(h) startHexByOwner[fotel1] istnieje — got ${JSON.stringify(seat1Hex)}`);
    await page.evaluate(
      ({ q, r }) => (window).__hotSeatTestDebug.setHexImprovementForTest(q, r, 'tartak'),
      seat1Hex,
    );
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);
    const afterImprove1 = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat1,
    );
    check(
      afterImprove1.pracaUpkeep > baseline1.pracaUpkeep,
      `(h) fotel 1 utrzymanie Pracy WZROSŁO po ulepszeniu (tartak) — baseline ${baseline1.pracaUpkeep}, po ${afterImprove1.pracaUpkeep}`,
    );
    // UWAGA: `pracaRate` fotela 1 NIE jest tu porównywany na "<" wprost -- `tartak` na
    // heksie startowym (nadpisanie WPROST przez hak testowy) może dodatkowo zmienić
    // plon PRODUKCJI tego heksu (tileYield zależy od `ulepszenie`), więc sama zmiana
    // `pracaRate` mieszałaby DWA niezależne efekty. Rate = brutto - upkeep z konstrukcji
    // (self-consystent przez `buildHudState`) -- właściwa, izolowana asercja regresji jest
    // niżej, na FOTELU 2 (którego heks NIE został tknięty), gdzie brutto jest z definicji
    // niezmienione.

    // fotel 2 aktywny -- MUSI odczytać WŁASNE (zerowe) utrzymanie, NIE utrzymanie fotela 1.
    await page.evaluate((sid) => (window).__hotSeatTestDebug.switchActiveHuman(sid), seat2);
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);
    const afterImprove2 = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat2,
    );
    check(
      afterImprove2.pracaUpkeep === 0,
      `(h) REGRESJA KLUCZOWA: fotel 2 pracaUpkeep WCIĄŻ 0 (nie przeciekło utrzymanie fotela 1/owner 0) — got ${afterImprove2.pracaUpkeep}`,
    );
    check(
      afterImprove2.pracaRate === baseline2.pracaRate,
      `(h) REGRESJA KLUCZOWA: fotel 2 pracaRate NIEZMIENIONY ulepszeniem fotela 1 — baseline ${baseline2.pracaRate}, po ${afterImprove2.pracaRate}`,
    );

    // powrót na fotel 1 -- jego podgląd MUSI nadal odzwierciedlać WŁASNE utrzymanie.
    await page.evaluate((sid) => (window).__hotSeatTestDebug.switchActiveHuman(sid), seat1);
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);
    const afterImprove1Again = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(oid), seat1,
    );
    check(
      afterImprove1Again.pracaUpkeep === afterImprove1.pracaUpkeep,
      `(h) fotel 1 utrzymanie STABILNE po powrocie — było ${afterImprove1.pracaUpkeep}, jest ${afterImprove1Again.pracaUpkeep}`,
    );

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures, shots };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/** SCENARIUSZ REGRESJI (kryterium #2): gra jednoosobowa -- bit-identyczne z dawnym
 *  singletonem, bo fotel 0 jest ALIASEM (nie kopią) w `_lastPracaSlot`. */
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
    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 1 && snap0.humanOwnerIds[0] === 0,
      `regresja 1P: dokładnie jeden człowiek (owner 0) — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );
    const founded = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded === true, 'regresja 1P: foundPlayerCityForActiveSeat() zwraca true');

    await page.evaluate(() => (window).__hotSeatTestDebug.setOwnerPracaPoolForTest(0, 42));
    await page.evaluate(() => (window).__hotSeatTestDebug.refreshHudForTest());
    await wait(150);
    const val = await pracaChipValueText(page);
    check(val.trim() === '42', `regresja 1P: czip "Praca" pokazuje 42 (fotel 0 = alias singletonu) — got "${val}"`);
    const snapPraca = await page.evaluate(() => (window).__hotSeatTestDebug.hudPracaSnapshotForTest(0));
    check(snapPraca.praca === 42, `regresja 1P: buildHudState(0).praca === 42 — got ${snapPraca.praca}`);

    check(jsExceptions.length === 0, `regresja 1P: zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);
    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function runWithRetry(fn, chromium, label) {
  const maxAttempts = ASSERT_MUTANT ? 1 : 3;
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
    console.error('[hotseat-etap6c-lastpraca-per-fotel-test] BLOCK: playwright nie znaleziony w node_modules.');
    process.exit(2);
  }

  if (ASSERT_MUTANT) {
    try {
      prepareMutantSourceTree();
    } catch (e) {
      console.error('[hotseat-etap6c-lastpraca-per-fotel-test] BLOCK: przygotowanie mutanta nie powiodło się:', e.message || e);
      process.exit(2);
    }
  }

  try {
    buildBundle();
  } catch (e) {
    console.error('[hotseat-etap6c-lastpraca-per-fotel-test] BLOCK: vite build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  let resMain, resRegression;
  try {
    resMain = await runWithRetry(runScenarioMain, chromium, 'main');
    if (!ASSERT_MUTANT) {
      resRegression = await runWithRetry(runScenarioSinglePlayerRegression, chromium, 'regresja-1p');
    }
  } catch (e) {
    console.error('[hotseat-etap6c-lastpraca-per-fotel-test] BLOCK: scenariusz nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== SCENARIUSZ GŁÓWNY (a)-(g): 2 fotele, Praca per-fotel po switchActiveHuman ===' + (ASSERT_MUTANT ? ' [MUTANT]' : ''));
  console.log('PASS:', resMain.pass);
  if (!resMain.pass) resMain.failures.forEach((f) => console.log('  FAIL: ' + f));
  if (resMain.shots) resMain.shots.forEach((s) => console.log('  DOWÓD: ' + s));

  if (!ASSERT_MUTANT) {
    console.log('\n=== SCENARIUSZ REGRESJI 1P: fotel 0 bit-identyczny (alias singletonu) ===');
    console.log('PASS:', resRegression.pass);
    if (!resRegression.pass) resRegression.failures.forEach((f) => console.log('  FAIL: ' + f));
  }

  if (ASSERT_MUTANT) {
    const mutantShouldFail = !resMain.pass;
    console.log(`\nhotseat-etap6c-lastpraca-per-fotel-test --assert-mutant: `
      + `${mutantShouldFail ? 'OK (test poprawnie czerwienieje na kodzie sprzed naprawy)' : 'BŁĄD (test NIE czerwienieje na mutancie -- tautologia!)'}`);
    process.exit(mutantShouldFail ? 0 : 1);
  }

  const pass = resMain.pass && resRegression.pass;
  console.log(`\nhotseat-etap6c-lastpraca-per-fotel-test: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap6c-lastpraca-per-fotel-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
