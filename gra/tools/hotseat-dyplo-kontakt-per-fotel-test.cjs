'use strict';
/**
 * hotseat-dyplo-kontakt-per-fotel-test.cjs — bramka R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU tego dispatchu: zakaz uznania tematu za zamknięty na
 * podstawie samego czytania kodu. Ten test:
 *  (a) startuje hot-seat REALNYM kreatorem (`newGameFlow.ts`, kliknięcia DOM — ten sam
 *      wzorzec `openWizardToSettingsStep`/`gotoMainMenu` co `hotseat-drugi-fotel-tura-test.cjs`),
 *      NIE ustawia `humanSeats` ręcznie;
 *  (b) fotel 1 zakłada pierwsze miasto REALNĄ ścieżką (`__hotSeatTestDebug.
 *      foundPlayerCityForActiveSeat()` → `tryFoundPlayerCityAt`, ta sama funkcja co realny
 *      klik/skrót "B") — wymagane, żeby `advanceSeat()` (krok d) mógł przełączyć fotel;
 *  (c) fotel 1 REALNIE nawiązuje kontakt z AI(X) przez wojnę — `__eraTestDebug.
 *      forceBronzeForcedWarOnPlayer()` (main.ts, hak WYŁĄCZNIE steruje wejściem: który AI,
 *      zerowanie wojen — sam EFEKT "gracz poznał AI(X)" idzie DOKŁADNIE tą samą ścieżką
 *      (`diplomaticallyDiscoveredOwnersSet(ME()).add(attackerId)`) co realne odkrycie na
 *      mapie/audiencja z obcym miastem, main.ts `offerForeignCityInteraction`) — ten sam
 *      hak i to samo uzasadnienie co zaakceptowany `forced-war-player-no-contact-live-test.cjs`;
 *  (d) DOWÓD (nie deklaracja): `isDiplomaticallyDiscovered(attackerId)` (main.ts,
 *      `__eraTestDebug`, alias dokładnie tego samego Seta który zasila
 *      `diplomacyLayerForOwner`/`getDiplomaticContacts()`) zwraca `true` DLA FOTELA 1;
 *  (e) fotel 1 kończy turę realnym `__eraTestDebug.endTurn()` (`advanceSeat()`, ta sama
 *      funkcja co przycisk "Zakończ turę"/skrót "N") → aktywny fotel = fotel 2, numer tury
 *      BEZ ZMIANY (świat jeszcze nie przeszedł — ten sam dowód co
 *      `hotseat-drugi-fotel-tura-test.cjs` krok (d));
 *  (f) SEDNO tego tematu: `isDiplomaticallyDiscovered(attackerId)` DLA FOTELA 2 (teraz
 *      aktywnego, więc `ME()`-domyślny odczyt haka celuje we WŁAŚCIWY fotel) zwraca
 *      `false` — fotel 2 NIE odziedziczył kontaktu fotela 1 (PRZED tą migracją: globalny
 *      `Set<number>` sprawiłby, że zwróciłby `true` tutaj — dokładnie regresja z
 *      00-dispatch.md);
 *  (g) fotel 2 zakłada własne pierwsze miasto (jak (b)) i SAM nawiązuje kontakt z TYM
 *      SAMYM AI(X) (`forceBronzeForcedWarOnPlayer()` ponownie — kryteria wyboru celu
 *      deterministyczne, niezmienione od (c), wybierają tego samego `attackerId`) —
 *      DOWÓD że TERAZ `isDiplomaticallyDiscovered(attackerId)` zwraca `true` DLA FOTELA 2;
 *  (h) REGRESJA IZOLACJI: fotel 1 nadal widzi AI(X) jako odkryte (własny kontakt z (c) nie
 *      zniknął pod wpływem zapisu fotela 2) — przełącznik `advanceSeat()` wraca do fotela 1
 *      dopiero po końcu tury fotela 2, więc weryfikujemy przez bezpośredni odczyt z jawnym
 *      `humanOwnerId` (drugi parametr haka, R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1) zamiast
 *      przełączać fotel ponownie.
 *
 * SCENARIUSZ REGRESJI (osobna strona): gra JEDNOOSOBOWA — kontakt przez wojnę działa
 * DOKŁADNIE jak dziś (jeden fotel = jedyny obserwator, natychmiast `true` po haku, bez
 * dodatkowego kroku).
 *
 * Wzorzec buildBundle()/launchBrowser()/closeBrowserSafely/pollUntil/gotoMainMenu/
 * openWizardToSettingsStep przejęty 1:1 z `hotseat-drugi-fotel-tura-test.cjs` (ten sam
 * mechanizm, nie budowa od zera).
 *
 * Bramka (z katalogu gra/): node tools/hotseat-dyplo-kontakt-per-fotel-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-dyplo-kontakt-per-fotel-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-dyplo-kontakt-per-fotel-test] ' + msg); }

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
  }, 180000, 'world-generated');
  await wait(300);
}

/** Realne przejście kreatora Intro -> Epoka -> Cywilizacja -> Ustawienia (REALNE
 *  kliknięcia DOM, ta sama ścieżka co gracz). Wzorzec 1:1 z hotseat-drugi-fotel-tura-test. */
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

/**
 * SCENARIUSZ GŁÓWNY (a)-(h): hot-seat REALNIE włączony przez kreator, kontakt
 * dyplomatyczny per-fotel dowiedziony haczykami produkcyjnymi (nie reimplementacją).
 */
async function runScenarioHotSeat(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    // (a) Włącz hot-seat REALNYM klikiem — NIE ustawiamy humanSeats ręcznie.
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
      `(a) po starcie z hot-seatem: DWÓCH ludzi — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );
    const seat1 = 0;
    const seat2 = (snap0.humanOwnerIds || []).find((id) => id !== seat1);
    check(seat2 !== undefined, `(a) istnieje drugi ownerId != 0 — got ${JSON.stringify(snap0.humanOwnerIds)}`);
    check(snap0.activeHumanOwnerId === seat1, `(a) aktywny fotel PO starcie to fotel 1 — got ${snap0.activeHumanOwnerId}`);

    // (b) Fotel 1 zakłada pierwsze miasto — REALNA ścieżka silnika.
    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, '(b) fotel 1: foundPlayerCityForActiveSeat() zwraca true');

    // (c) Fotel 1 REALNIE nawiązuje kontakt z AI(X) przez wojnę wymuszoną epoki.
    const forced1 = await page.evaluate(() => (window).__eraTestDebug.forceBronzeForcedWarOnPlayer());
    check(
      typeof forced1.attackerId === 'number' && forced1.attackerId > 0,
      `(c) forceBronzeForcedWarOnPlayer() zwraca realnego AI ownera — got ${JSON.stringify(forced1)}`,
    );
    const attackerId = forced1.attackerId;

    // (d) DOWÓD (stan, nie deklaracja): fotel 1 WIDZI AI(X) jako odkryte.
    const discoveredSeat1 = await page.evaluate(
      (oid) => (window).__eraTestDebug.isDiplomaticallyDiscovered(oid),
      attackerId,
    );
    check(discoveredSeat1 === true, `(d) fotel 1: isDiplomaticallyDiscovered(attackerId)===true — got ${discoveredSeat1}`);

    // (e) Fotel 1 kończy turę — REALNA ścieżka (advanceSeat() przez ten sam hak co HUD/"N").
    await page.evaluate(() => (window).__eraTestDebug.endTurn());
    await wait(200);

    const snap1 = await page.evaluate(snapshotHumanSeats);
    check(
      snap1.activeHumanOwnerId === seat2,
      `(e) po końcu tury fotela 1: aktywny fotel = fotel 2 (${seat2}) — got ${snap1.activeHumanOwnerId}`,
    );
    const dumpAfterSwitch = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());
    check(
      dumpAfterSwitch.turn === 1,
      `(e) numer tury NIE wzrósł po przełączeniu na fotel 2 — got ${dumpAfterSwitch.turn}`,
    );

    // (f) SEDNO: fotel 2 (teraz aktywny, ME()===seat2) NIE widzi AI(X) jako odkryte —
    // PRZED migracją (Set globalny) to byłoby true (regresja z 00-dispatch.md).
    const discoveredSeat2Before = await page.evaluate(
      (oid) => (window).__eraTestDebug.isDiplomaticallyDiscovered(oid),
      attackerId,
    );
    check(
      discoveredSeat2Before === false,
      `(f) SEDNO: fotel 2 PRZED własnym odkryciem: isDiplomaticallyDiscovered(attackerId)===false — got ${discoveredSeat2Before}`,
    );

    // (g) Fotel 2 zakłada własne miasto i SAM nawiązuje kontakt z TYM SAMYM AI(X).
    const founded2 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded2 === true, '(g) fotel 2: foundPlayerCityForActiveSeat() zwraca true');

    const forced2 = await page.evaluate(() => (window).__eraTestDebug.forceBronzeForcedWarOnPlayer());
    check(
      forced2.attackerId === attackerId,
      `(g) forceBronzeForcedWarOnPlayer() (kryteria deterministyczne) wybiera TEGO SAMEGO AI(X) — got ${forced2.attackerId} vs ${attackerId}`,
    );

    const discoveredSeat2After = await page.evaluate(
      (oid) => (window).__eraTestDebug.isDiplomaticallyDiscovered(oid),
      attackerId,
    );
    check(
      discoveredSeat2After === true,
      `(g) DOWÓD: fotel 2 PO własnym odkryciu: isDiplomaticallyDiscovered(attackerId)===true — got ${discoveredSeat2After}`,
    );

    // (h) REGRESJA IZOLACJI: fotel 1 nadal widzi AI(X) jako odkryte -- odczyt z JAWNYM
    // humanOwnerId (drugi, opcjonalny parametr haka), bez przełączania fotela ponownie.
    const discoveredSeat1StillTrue = await page.evaluate(
      ([oid, hid]) => (window).__eraTestDebug.isDiplomaticallyDiscovered(oid, hid),
      [attackerId, seat1],
    );
    check(
      discoveredSeat1StillTrue === true,
      `(h) REGRESJA IZOLACJI: fotel 1 nadal widzi AI(X) jako odkryte (zapis fotela 2 go nie skasował) — got ${discoveredSeat1StillTrue}`,
    );

    check(jsExceptions.length === 0, `zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * SCENARIUSZ REGRESJI: gra JEDNOOSOBOWA — kontakt przez wojnę wymuszoną działa DOKŁADNIE
 * jak dziś (jeden fotel = jedyny obserwator, natychmiast `true` po haku).
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
    // BEZ dotknięcia przełącznika hot-seat — domyślnie jeden fotel.
    await page.locator('.civ-newgame .start').click();
    await waitForWorldGenerated(page);

    const snap0 = await page.evaluate(snapshotHumanSeats);
    check(
      Array.isArray(snap0.humanOwnerIds) && snap0.humanOwnerIds.length === 1 && snap0.humanOwnerIds[0] === 0,
      `regresja: dokładnie jeden człowiek (owner 0) — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );

    const founded = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded === true, 'regresja: foundPlayerCityForActiveSeat() zwraca true');

    const forced = await page.evaluate(() => (window).__eraTestDebug.forceBronzeForcedWarOnPlayer());
    check(
      typeof forced.attackerId === 'number' && forced.attackerId > 0,
      `regresja: forceBronzeForcedWarOnPlayer() zwraca realnego AI ownera — got ${JSON.stringify(forced)}`,
    );

    const discovered = await page.evaluate(
      (oid) => (window).__eraTestDebug.isDiplomaticallyDiscovered(oid),
      forced.attackerId,
    );
    check(
      discovered === true,
      `regresja: jednoosobowa gra -- isDiplomaticallyDiscovered(attackerId)===true natychmiast, bez dodatkowego kroku — got ${discovered}`,
    );

    check(jsExceptions.length === 0, `regresja: zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * OBRONA R1 zarzut 3: wsteczna kompatybilność save/load STAREGO, płaskiego formatu
 * (number[]) -> HUMAN_OWNER_PRIMARY, dowiedziona na ŚCIEŻCE WCZYTANIA ZAPISU (REALNE
 * `buildSaveGameSnapshot()`/`restoreGameFromSave()` przez hak `saveLoadLegacyDiplomaticFormat`),
 * NIE deklaracją ani czytaniem kodu. Hot-seat DWÓCH foteli — dowodzi też, że stary,
 * jednoosobowy zapis nie "przecieka" do drugiego, nowo dodanego fotela.
 */
async function runScenarioLegacySaveCompat(chromium) {
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    const failures = [];
    const check = (cond, msg) => { if (!cond) failures.push(msg); };

    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    // Hot-seat WŁĄCZONY (jak scenariusz główny) -- drugi fotel musi istnieć, żeby
    // sprawdzić, że stary format do niego NIE trafia.
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
      `legacy: hot-seat DWÓCH ludzi — got ${JSON.stringify(snap0.humanOwnerIds)}`,
    );

    const founded1 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
    check(founded1 === true, 'legacy: fotel 1 foundPlayerCityForActiveSeat() zwraca true');

    const forced1 = await page.evaluate(() => (window).__eraTestDebug.forceBronzeForcedWarOnPlayer());
    check(
      typeof forced1.attackerId === 'number' && forced1.attackerId > 0,
      `legacy: forceBronzeForcedWarOnPlayer() zwraca realnego AI ownera — got ${JSON.stringify(forced1)}`,
    );
    const attackerId = forced1.attackerId;

    // REALNY save->load roundtrip z meta.* w STARYM, płaskim formacie (number[]),
    // dokładnie tak jak wyglądałby zapis sprzed tej migracji.
    const result = await page.evaluate(
      (oid) => (window).__eraTestDebug.saveLoadLegacyDiplomaticFormat([oid]),
      attackerId,
    );
    check(
      Array.isArray(result.primaryContact) && result.primaryContact.includes(attackerId),
      `legacy: stary format -> diplomaticContactEstablished trafia do HUMAN_OWNER_PRIMARY — got ${JSON.stringify(result.primaryContact)}`,
    );
    check(
      Array.isArray(result.primaryDiscovered) && result.primaryDiscovered.includes(attackerId),
      `legacy: stary format -> diplomaticallyDiscoveredOwners trafia do HUMAN_OWNER_PRIMARY — got ${JSON.stringify(result.primaryDiscovered)}`,
    );
    check(
      Array.isArray(result.primaryPopupShown) && result.primaryPopupShown.includes(attackerId),
      `legacy: stary format -> diplomaticDiscoveryPopupShown trafia do HUMAN_OWNER_PRIMARY — got ${JSON.stringify(result.primaryPopupShown)}`,
    );
    check(
      result.otherHumansHaveAny === false,
      `legacy: REGRESJA IZOLACJI -- stary format NIE przecieka do drugiego fotela — got otherHumansHaveAny=${result.otherHumansHaveAny}`,
    );

    check(jsExceptions.length === 0, `legacy: zero jsExceptions — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/** Wzorzec 1:1 z `hotseat-drugi-fotel-tura-test.cjs`/`hotseat-etap6f-part2-ui-test.cjs` —
 *  world-gen w headless swiftshare bywa wolniejszy niż jeden `pollUntil` timeout; ponawiamy
 *  ze świeżym `browser.launch()` zamiast raportować BLOCK po pierwszej próbie. */
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
    console.error('[hotseat-dyplo-kontakt-per-fotel-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  let main1;
  let reg1;
  let legacy1;
  try {
    log('\n=== SCENARIUSZ GŁÓWNY: hot-seat, kontakt dyplomatyczny per-fotel ===');
    main1 = await runWithRetry(runScenarioHotSeat, chromium, 'glowny');
    log('\n=== SCENARIUSZ REGRESJI: gra jednoosobowa ===');
    reg1 = await runWithRetry(runScenarioSinglePlayerRegression, chromium, 'regresja');
    log('\n=== SCENARIUSZ OBRONA R1 zarzut 3: wsteczna kompatybilność save/load (stary format) ===');
    legacy1 = await runWithRetry(runScenarioLegacySaveCompat, chromium, 'legacy-saveload');
  } catch (e) {
    console.error('[hotseat-dyplo-kontakt-per-fotel-test] BLOCK: scenariusz nie zadziałał headless:', e);
    process.exit(2);
  }

  if (main1.pass) log('SCENARIUSZ GŁÓWNY: PASS');
  else { log('SCENARIUSZ GŁÓWNY: FAIL'); main1.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  if (reg1.pass) log('SCENARIUSZ REGRESJI: PASS');
  else { log('SCENARIUSZ REGRESJI: FAIL'); reg1.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  if (legacy1.pass) log('SCENARIUSZ LEGACY SAVE/LOAD: PASS');
  else { log('SCENARIUSZ LEGACY SAVE/LOAD: FAIL'); legacy1.failures.forEach((f) => console.error('  FAIL: ' + f)); }

  const allPass = main1.pass && reg1.pass && legacy1.pass;
  log('\n' + (allPass ? 'WSZYSTKIE SCENARIUSZE ZIELONE' : 'CO NAJMNIEJ JEDEN SCENARIUSZ CZERWONY'));
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
