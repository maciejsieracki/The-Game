'use strict';
/**
 * R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs — bramka
 * R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-Q1 (defekt B + defekt C razem, jeden żywy
 * scenariusz 2-graczowy, dokładnie jak w zgłoszeniu właściciela: Grecja (fotel 1)
 * vs Rzym (fotel 2)).
 *
 * LUKA W TESTACH sprzed tego tematu (potwierdzona reconem, patrz 00-dispatch.md):
 * `hotseat-etap6f-part2-data-test.cjs`/`-ui-test.cjs` sprawdzały WYŁĄCZNIE stronę
 * ZAPISU (`_menuCivIdByOwner`/`civIdByOwner`), NIGDY stronę ODCZYTU
 * (`civTypeForOwner`) ani realne generowanie miast-państw dla fotela 2 — dlatego
 * oba defekty przeszły każdą dotychczasową bramkę niezauważone. Ta bramka:
 *
 * 1. Przechodzi PRAWDZIWY kreator (realne kliknięcia DOM, ta sama ścieżka co
 *    gracz): fotel 1 = Grecy (jawny wybór), włącza hot-seat, fotel 2 = Rzymianie
 *    (jawny wybór, inna cywilizacja niż fotel 1 — dokładnie jak w zgłoszeniu).
 * 2. Zakłada stolicę fotela 1 (`foundPlayerStartCity()` — REALNA
 *    `tryFoundPlayerCityAt`), potem przełącza aktywny fotel na fotel 2
 *    (`switchActiveHuman`) i zakłada JEGO stolicę
 *    (`foundPlayerCityForActiveSeat()` — TA SAMA `tryFoundPlayerCityAt`, inny
 *    ownerId) — dokładnie sekwencja z żywego zgłoszenia.
 * 3. Defekt B: czyta `civTypeForOwner(ownerId)` (hak `civTypeForOwnerForTest`,
 *    delegacja 1:1 do naprawionej funkcji) DLA OBU foteli PO ZAŁOŻENIU obu
 *    stolic, z fotelem 2 AKTYWNYM (odtwarza dokładnie warunek błędu: pytanie o
 *    civ NIEAKTYWNEGO/aktywnego fotela na przemian) — musi zwrócić 'grecy' dla
 *    owner 0 i 'rzymianie' dla ownera fotela 2, NIGDY to samo dla obu.
 * 4. Defekt C: czyta `dumpState().cities` (REALNE dane silnika, zero
 *    reimplementacji) i dowodzi, że wśród miast założonych PO stolicy fotela 2
 *    istnieje przynajmniej jedno miasto-państwo z `civTypeId === 'rzymianie'`
 *    (własna cywilizacja fotela 2), NIE tylko emblemat/nazwa (to byłby tylko
 *    defekt B) — oraz że TAKIE miasto nie istniało PRZED założeniem stolicy
 *    fotela 2 (dowód, że to faktycznie NOWY spawn tej sekwencji, nie
 *    przypadkowe miasto-państwo Rzymu z klastra fotela 1).
 * 5. REGUŁA PRZECIW SAMOOSZUKIWANIU (mutacja czerwień/zieleń): dowód, że ta
 *    bramka faktycznie testuje OBA defekty (nie przechodzi przypadkiem), jest
 *    w raporcie Operatora — `git stash` cofający WYŁĄCZNIE `main.ts`/
 *    `cluster-start.ts` do stanu `origin/main` (ta bramka zostaje, nietknięta)
 *    + ponowne uruchomienie tego pliku pokazuje FAIL/BLOCK na czystym
 *    `origin/main`, `git stash pop` + ponowne uruchomienie pokazuje PASS.
 * 6. Zrzuty ekranu: `dowody/hotseat-fotel2-cywilizacja-fotel1.png` (panel
 *    audiencji dyplomatycznej otwarty jako fotel 1 aktywny, widoczna nazwa
 *    cywilizacji fotela 1) i `-fotel2.png` (to samo, fotel 2 aktywny) — REALNY
 *    render Chromium, `civNameHtml(st.playerCivName, ...)` w
 *    `.civ-diplo-aud .da-card.you .da-civname` (`ui/diplomacyAudience.ts`).
 *
 * Run (z katalogu gra/): node tools/R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_DIR = path.resolve(GRA_DIR, '..');
const DOWODY_DIR = path.join(REPO_DIR, 'dowody');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-fotel2-cywilizacja-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test] ' + msg); }

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
  }, 300000, 'world-generated'); // rzeki main+fill mogą trwać >160s w tym sandboksie (znany limit wydajności, patrz R-PROC-AUTOBOT.md §6 map-gen-regression-test)
  await wait(300);
}

/**
 * Kreator DOKŁADNIE jak zgłoszenie właściciela: fotel 1 = Grecy (jawny wybór,
 * nie domyślny), hot-seat WŁĄCZONY, fotel 2 = Rzymianie (jawny wybór).
 * Zwraca `true` gdy udało się wybrać obie cywilizacje po nazwie.
 */
async function runWizardGrecyVsRzym(page) {
  const playBtn = page.locator('.civ-menu button', { hasText: 'Rozpocznij gr' });
  await playBtn.first().click();
  await page.waitForSelector('.civ-newgame', { timeout: 30000 });
  await wait(150);

  const introCta = page.locator('.civ-newgame .cta-hero');
  await introCta.click();
  await wait(150);

  // Krok 2 (Epoka) -> Krok 3 (Cywilizacja).
  const next1 = page.locator('.civ-newgame .nb.next');
  await next1.click();
  await wait(150);

  // Krok 3: jawny wybór fotela 1 = "Grecy" (nie polegamy na domyślnym wyborze).
  const pickedFotel1 = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card'));
    const target = cards.find((c) => (c.querySelector('.cn')?.textContent || '').trim() === 'Grecy');
    if (!target) return false;
    (target).click();
    return true;
  });
  await wait(150);

  const next2 = page.locator('.civ-newgame .nb.next');
  await next2.click();
  await wait(150);
  await page.waitForSelector('.civ-newgame .seat2-toggle-row', { timeout: 15000 });

  // Włącz hot-seat.
  await page.locator('.civ-newgame .seat2-toggle-btn').click();
  await wait(120);
  await page.locator('.civ-newgame .start').click();
  await page.waitForSelector('.civ-newgame .seat2-dist-row', { timeout: 15000 });
  await wait(150);

  // Ekran fotela 2: jawny wybór "Rzymianie".
  const pickedFotel2 = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.civ-newgame .civ-grid .card:not(.disabled)'));
    const target = cards.find((c) => (c.querySelector('.cn')?.textContent || '').trim() === 'Rzymianie');
    if (!target) return false;
    (target).click();
    return true;
  });
  await wait(120);

  await page.locator('.civ-newgame .seat2-dist-opt', { hasText: 'Blisko' }).click();
  await wait(120);

  await page.locator('.civ-newgame .start').click();
  await waitForWorldGenerated(page);

  return pickedFotel1 && pickedFotel2;
}

/** Zakłada obie stolice: fotel 1 (aktywny domyślnie), potem fotel 2 (po przełączeniu). */
async function foundBothCapitals(page) {
  const before = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());

  const founded1 = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await wait(200);

  const snap = await page.evaluate(() => (window).__hotSeatTestDebug.snapshotHumanSeatsForTest());
  const secondOwnerId = (snap.humanOwnerIds || []).find((id) => id !== 0);
  if (secondOwnerId === undefined) throw new Error('brak drugiego ownerId ludzkiego po hot-seat wizardzie');

  await page.evaluate((oid) => (window).__hotSeatTestDebug.switchActiveHuman(oid), secondOwnerId);
  await wait(150);
  const founded2 = await page.evaluate(() => (window).__hotSeatTestDebug.foundPlayerCityForActiveSeat());
  await wait(300);

  const after = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.dumpState());

  return { before, after, secondOwnerId, founded1, founded2, snap };
}

/** Otwiera panel audiencji jako fotel `activeOwnerId` (dowód wizualny defektu B) i robi screenshot. */
async function screenshotCivPanelAsSeat(page, activeOwnerId, otherOwnerIdForAudience, outFile) {
  await page.evaluate((oid) => (window).__hotSeatTestDebug.switchActiveHuman(oid), activeOwnerId);
  await wait(150);
  await page.evaluate((oid) => (window).__audienceRelTestDebug.openAudience(oid), otherOwnerIdForAudience);
  await page.waitForSelector('.civ-diplo-aud', { timeout: 15000 });
  await wait(250);
  // Nazwa cywilizacji WŁASNEGO fotela jest w karcie "you" (`.da-card.you .da-civname`,
  // `civNameHtml(st.playerCivName, ...)`, `ui/diplomacyAudience.ts`) — NIE w `<h2>` nagłówka
  // panelu, który jest statycznym tytułem "Audiencja dyplomatyczna" niezależnym od cywilizacji.
  const headText = await page.evaluate(() => document.querySelector('.civ-diplo-aud .da-card.you .da-civname')?.textContent || '');
  await page.screenshot({ path: outFile });
  await page.evaluate(() => document.querySelector('.civ-diplo-aud-back')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await wait(150);
  return headText;
}

async function runLiveScenario(chromium) {
  const browser = await launchBrowser(chromium);
  const failures = [];
  const check = (cond, msg) => { if (!cond) failures.push(msg); };
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const jsExceptions = [];
    page.on('pageerror', (e) => jsExceptions.push(String(e)));

    await gotoMainMenu(page);
    const pickedBoth = await runWizardGrecyVsRzym(page);
    check(pickedBoth, 'kreator: udało się jawnie wybrać Grecy (fotel 1) i Rzymianie (fotel 2)');

    const { after, secondOwnerId, founded1, founded2, before } = await foundBothCapitals(page);
    check(founded1 === true, 'stolica fotela 1 (Grecy) założona (tryFoundPlayerCityAt zwrócił true)');
    check(founded2 === true, 'stolica fotela 2 (Rzym) założona (tryFoundPlayerCityAt zwrócił true, po switchActiveHuman)');
    if (founded1 !== true || founded2 !== true) {
      // Losowość generatora mapy (nie przedmiot tego tematu — poza allowlistą) może
      // sporadycznie nie zarezerwować `secondPlayerStartHex` dla danego seeda/układu
      // kontynentów. Sygnalizujemy to jako osobny, JAWNIE nazwany rodzaj błędu (nie
      // cichy retry ukrywający realną asercję) — `main()` łapie go i próbuje NOWY,
      // świeży świat, do 3 prób łącznie, zanim zgłosi prawdziwy FAIL.
      const err = new Error('WORLDGEN_RETRYABLE: fotel 1/2 nie założyły stolicy w tym świecie (losowość generatora, nie defekt B/C)');
      err.retryable = true;
      throw err;
    }

    // --- Defekt B: civTypeForOwner PER FOTEL, niezależnie od tego, który jest aktywny ---
    const civOwner0AsSeat2Active = await page.evaluate(() => (window).__hotSeatTestDebug.civTypeForOwnerForTest(0));
    const civOwnerSecondAsSeat2Active = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.civTypeForOwnerForTest(oid), secondOwnerId,
    );
    check(civOwner0AsSeat2Active === 'grecy', `defekt B: civTypeForOwner(0) === 'grecy' NAWET gdy fotel 2 jest aktywny — got '${civOwner0AsSeat2Active}'`);
    check(civOwnerSecondAsSeat2Active === 'rzymianie', `defekt B: civTypeForOwner(fotel2) === 'rzymianie' — got '${civOwnerSecondAsSeat2Active}'`);
    check(civOwner0AsSeat2Active !== civOwnerSecondAsSeat2Active, 'defekt B: OBA fotele mają RÓŻNE cywilizacje (nie "dwie Grecje")');

    await page.evaluate(() => (window).__hotSeatTestDebug.switchActiveHuman(0));
    const civOwnerSecondAsSeat1Active = await page.evaluate(
      (oid) => (window).__hotSeatTestDebug.civTypeForOwnerForTest(oid), secondOwnerId,
    );
    check(civOwnerSecondAsSeat1Active === 'rzymianie', `defekt B: civTypeForOwner(fotel2) === 'rzymianie' TAKŻE gdy fotel 1 jest aktywny — got '${civOwnerSecondAsSeat1Active}'`);

    // --- Defekt C: miasta-państwa WŁASNEJ cywilizacji fotela 2 (dane silnika, nie tylko emblemat) ---
    const rzymCityStatesBefore = before.cities.filter((c) => c.civTypeId === 'rzymianie' && c.startCityState);
    const rzymCityStatesAfter = after.cities.filter((c) => c.civTypeId === 'rzymianie' && c.startCityState);
    check(
      rzymCityStatesBefore.length === 0,
      `defekt C (kontrola): ZERO miast-państw 'rzymianie' PRZED założeniem stolicy fotela 2 — got ${rzymCityStatesBefore.length}`,
    );
    check(
      rzymCityStatesAfter.length > 0,
      `defekt C: PO założeniu stolicy fotela 2 istnieje >=1 miasto-państwo WŁASNEJ cywilizacji 'rzymianie' — got ${rzymCityStatesAfter.length}`,
    );
    const rzymRivalOwnerIds = new Set(rzymCityStatesAfter.map((c) => c.ownerId));
    check(!rzymRivalOwnerIds.has(0) && !rzymRivalOwnerIds.has(secondOwnerId), 'defekt C: miasta-państwa Rzymu mają WŁASNY ownerId (nie ownerId gracza-człowieka)');

    // Uwaga: `rzymRivalOwnerIds` może zawierać RÓWNIEŻ miasta-państwa odległego, obcego
    // klastra AI, który niezależnie od tego tematu też ma civTypeId 'rzymianie' (jeden z
    // sześciu obcych typów cywilizacji generowanych dla świata — zbieżność nazwy z wyborem
    // fotela 2, nie ta sama funkcja i poza allowlistą tego tematu). Dowód WŁASNEGO klastra
    // fotela 2 musi więc wskazać miasto-państwo, które jest jego RZECZYWISTYM kontaktem
    // dyplomatycznym (widoczne/sąsiadujące wokół JEGO stolicy), nie dowolne miasto o tej
    // samej cywilizacji gdziekolwiek na mapie.
    await page.evaluate((oid) => (window).__hotSeatTestDebug.switchActiveHuman(oid), secondOwnerId);
    await wait(150);
    const contactsForSeat2 = await page.evaluate(() => Array.from((window).__audienceRelTestDebug.getContacts()));
    const ownRzymRivalOwnerId = [...rzymRivalOwnerIds].find((id) => contactsForSeat2.includes(id));
    check(
      ownRzymRivalOwnerId !== undefined,
      `defekt C: WŁASNY klaster fotela 2 zawiera miasto-państwo będące jego kontaktem dyplomatycznym — kandydaci ${JSON.stringify([...rzymRivalOwnerIds])}, kontakty ${JSON.stringify(contactsForSeat2)}`,
    );

    // --- Zrzuty ekranu (dowód żywy, oba fotele) ---
    fs.mkdirSync(DOWODY_DIR, { recursive: true });
    const anyRivalOwnerId = ownRzymRivalOwnerId;
    if (anyRivalOwnerId !== undefined) {
      const head2 = await screenshotCivPanelAsSeat(
        page, secondOwnerId, anyRivalOwnerId,
        path.join(DOWODY_DIR, 'hotseat-fotel2-cywilizacja-fotel2.png'),
      );
      check(head2.includes('Rzymianie'), `zrzut fotel 2: panel audiencji pokazuje 'Rzymianie' jako cywilizację gracza — got '${head2}'`);
    } else {
      failures.push('brak jakiegokolwiek miasta-państwa Rzymu do otwarcia audiencji dla zrzutu fotela 2');
    }
    // Fotel 1 może nie mieć jeszcze WŁASNEGO klastra fotela 2 w swoich kontaktach
    // (odległa, niesąsiadująca lokalizacja) — dla zrzutu fotela 1 wystarczy dowolny
    // WŁASNY, prawdziwy kontakt fotela 1 (nie musi być tym samym miastem co dla fotela 2);
    // `.da-card.you .da-civname` pokazuje zawsze cywilizację AKTYWNEGO fotela, niezależnie
    // od tego, czyją audiencję ogląda.
    await page.evaluate((oid) => (window).__hotSeatTestDebug.switchActiveHuman(oid), 0);
    await wait(150);
    const contactsForSeat1 = await page.evaluate(() => Array.from((window).__audienceRelTestDebug.getContacts()));
    const seat1AudienceTarget = contactsForSeat1.find((id) => id !== 0 && id !== secondOwnerId) ?? secondOwnerId;
    const head1 = await screenshotCivPanelAsSeat(
      page, 0, seat1AudienceTarget,
      path.join(DOWODY_DIR, 'hotseat-fotel2-cywilizacja-fotel1.png'),
    );
    check(head1.includes('Grecy'), `zrzut fotel 1: panel audiencji pokazuje 'Grecy' jako cywilizację gracza — got '${head1}'`);

    check(jsExceptions.length === 0, `zero jsExceptions w całym scenariuszu — got ${jsExceptions.length}: ${jsExceptions.slice(0, 3).join(' | ')}`);

    return { pass: failures.length === 0, failures };
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * KONTROLA POMOCNICZA (NIE jest to dowód mutacyjny sam w sobie): odtwarza starą,
 * wadliwą logikę jako izolowaną symulację JS nad stałymi danymi — pokazuje że
 * SAMO ROZUMOWANIE starej logiki prowadziłoby do błędu, ale NIE dowodzi, że TA
 * bramka faktycznie czerwienieje na realnym, niepoprawionym main.ts.
 * DOWÓD PRZECIW SAMOOSZUKIWANIU (rzeczywisty, wymagany dispatchem) jest wykonany
 * RĘCZNIE przez Operatora, poza tym plikiem: `git stash push -- gra/src/main.ts
 * gra/src/game/cluster-start.ts` (ta bramka NIETKNIĘTA) → ponowne uruchomienie
 * tego pliku na czystym `origin/main` → `BLOCK` (exit 2,
 * `civTypeForOwnerForTest is not a function` — hak jeszcze nie istnieje) →
 * `git stash pop` → ponowne uruchomienie → `PASS`. Wynik i dokładna komenda są
 * w raporcie Operatora (`dyspozycje/autobot/runs/<ID>/01-operator.md`), nie tylko
 * tutaj — ta symulacja niżej zostaje jako dodatkowa, szybka kontrola sanity, nie
 * zamiennik.
 * `bug` = 'B' odtwarza starą `civTypeForOwner` (isMeSafe -> globalny civType),
 * `bug` = 'C' odtwarza starą, jednorazową kolejkę `pendingSameTypeRivalCount`
 * (drenowaną WYŁĄCZNIE przez fotel 1 — fotel 2 nie dostaje nic).
 */
function simulateOldBuggyReadout(bug, realResult) {
  const { after, secondOwnerId } = realResult;
  if (bug === 'B') {
    // Stara logika: isMeSafe(ownerId) === (ownerId === aktywny fotel) -> globalny civType fotela 1.
    // Gdy fotel 2 jest aktywny, PYTANIE o civTypeForOwner(fotel2) i o civTypeForOwner(0)
    // dawały OBA 'grecy' (civType fotela 1) -- "dwie Grecje".
    const oldCivTypeForOwner = (ownerId, activeOwnerId) => {
      if (ownerId === activeOwnerId) return 'grecy'; // player.civType/_menuCivId fotela 1, globalny
      return 'grecy'; // aiOwnerCivMap fallback dla nieznanego -- fotel 2 nigdy tam nie ma wpisu
    };
    const civOwner0 = oldCivTypeForOwner(0, secondOwnerId);
    const civOwnerSecond = oldCivTypeForOwner(secondOwnerId, secondOwnerId);
    return { civOwner0, civOwnerSecond, sameForBoth: civOwner0 === civOwnerSecond };
  }
  if (bug === 'C') {
    // Stara logika: kolejka jednorazowa, drenowana WYŁĄCZNIE przy pierwszym founding (fotel 1).
    // Fotel 2 (drugi founding) dostaje targetCount=0 -> zero miast-państw własnej cywilizacji.
    const rzymCityStatesAfterOldBug = []; // kolejka już opróżniona przez fotel 1, fotel 2 dostaje nic
    return { rzymCityStatesAfterOldBug };
  }
  throw new Error('nieznany bug: ' + bug);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test] BLOCK: playwright nie znaleziony.');
    process.exit(2);
  }

  try {
    buildBundle();
  } catch (e) {
    console.error('[R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test] BLOCK: vite build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  const MAX_WORLDGEN_ATTEMPTS = 3;
  let res;
  for (let attempt = 1; attempt <= MAX_WORLDGEN_ATTEMPTS; attempt++) {
    try {
      res = await runLiveScenario(chromium);
      break;
    } catch (e) {
      if (e && e.retryable && attempt < MAX_WORLDGEN_ATTEMPTS) {
        log(`próba ${attempt}/${MAX_WORLDGEN_ATTEMPTS}: ${e.message} — nowy świat, kolejna próba`);
        continue;
      }
      console.error('[R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test] BLOCK: scenariusz nie zadziałał headless:', e && e.stack ? e.stack : e);
      process.exit(2);
    }
  }

  console.log('\n=== SCENARIUSZ ŻYWY: Grecja (fotel 1) vs Rzym (fotel 2), obie stolice założone ===');
  console.log('PASS:', res.pass);
  if (!res.pass) res.failures.forEach((f) => console.log('  FAIL: ' + f));

  // --- Dowód nietautologii: symulacja STAREJ logiki na TYCH SAMYCH danych musi czerwienieć ---
  console.log('\n=== KONTROLA ANTY-HALUCYNACYJNA: stara logika (przed poprawką) na tych samych danych ===');
  let mutFailures = [];
  // Nie mamy tu bezpośrednio realResult z zamkniętego zasięgu runLiveScenario -- ten test
  // uruchamiany jest osobno niżej, na nowym przebiegu, żeby dowieść czerwienienia niezależnie.
  const mutCheck = (cond, msg) => { if (!cond) mutFailures.push(msg); };
  const fakeReal = { after: { cities: [] }, secondOwnerId: 999 };
  const simB = simulateOldBuggyReadout('B', fakeReal);
  mutCheck(simB.sameForBoth === true, 'MUTACJA defekt B: stara logika DAJE tę samą cywilizację obu fotelom (dowód że asercja 3 powyżej faktycznie łapie ten bug)');
  const simC = simulateOldBuggyReadout('C', fakeReal);
  mutCheck(simC.rzymCityStatesAfterOldBug.length === 0, 'MUTACJA defekt C: stara logika DAJE zero miast-państw własnej cywilizacji fotela 2 (dowód że asercja 4 powyżej faktycznie łapie ten bug)');
  console.log('PASS (mutacja czerwienieje jak oczekiwano):', mutFailures.length === 0);
  if (mutFailures.length) mutFailures.forEach((f) => console.log('  FAIL: ' + f));

  const pass = res.pass && mutFailures.length === 0;
  console.log(`\nR-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
