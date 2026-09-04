'use strict';
/**
 * dyplo-sojusz-widocznosc-ciagla-live-test.cjs — R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1.
 *
 * Żywy dowód w headless Chromium (R-PROC-AUTOBOT.md §9 pkt 6a, dispatch REGUŁA PRZECIW
 * SAMOOSZUKIWANIU): realny `vite build`, realny `?playtest=mapa`, REALNA wieloturowa
 * symulacja z realnym zawarciem i zerwaniem sojuszu. Hak testowy
 * `__sojuszWidocznoscTestDebug` (main.ts, obok `__dyploMapaOdkrycieTestDebug`) steruje
 * WYŁĄCZNIE danymi wejściowymi (czy `activeDeals` zawiera traktat sojuszu gracz↔ownerId —
 * dokładnie ten sam kształt wpisu co realny sojusz zawarty przez UI, wzorem istniejącego
 * `__audienceRelTestDebug.setupThirdParties`) — sam EFEKT tematu (unia widoczności co turę,
 * natychmiastowy zanik po zerwaniu) powstaje WYŁĄCZNIE przez `currentVisible()`/`refreshFog()`
 * wołane z realnego `endTurn()` (`__eraTestDebug.endTurn`, ta sama funkcja co przycisk
 * „Zakończ turę") i realne `breakTreatyVoluntarily` (ta sama funkcja co przycisk „Zerwij").
 *
 * Pokrycie (kryteria końca 00-dispatch.md):
 *  1. Heksy widoczne WYŁĄCZNIE dla sojusznika (poza zasięgiem jednostek/miast gracza) STAJĄ
 *     SIĘ widoczne dla gracza po zawarciu sojuszu, i to na WIELU kolejnych turach z rzędu
 *     (nie jednorazowo) — dowód: `endTurn()` trzy razy, widoczność ally-only sprawdzona po
 *     każdej.
 *  2. Zerwanie sojuszu (tu: zerwanie jednostronne, „dowolnym mechanizmem" wg dispatchu) —
 *     dodatkowa widoczność znika NATYCHMIAST, bez rozegrania kolejnej tury.
 *  3. Kontrola negatywna „przed": PRZED zawarciem sojuszu heks widoczny wyłącznie sojusznikowi
 *     NIE jest widoczny graczowi (dowód, że unia faktycznie coś dokłada, nie że heks i tak był
 *     widoczny z innego powodu).
 *  4. Zero błędów konsoli/JS podczas całego przebiegu.
 *
 * RUNDA 2 (ECHO właściciela: "Tak, zrob to tez dla AI (obustronnie)") dokłada kryteria
 * ANALOGICZNE, symetryczne, po stronie AI — `currentVisibleForOwner(ownerId)` (dokładnie to,
 * co main.ts zasila do `aiVisibleHexes`/`aiCityCaptureAllowed`, czyli realne wejście decyzji
 * AI, patrz komentarz w main.ts nad tą funkcją):
 *  5. Kontrola negatywna „przed": heks widoczny WYŁĄCZNIE dalekiej jednostce GRACZA (poza
 *     zasięgiem sojusznika) NIE jest w `currentVisibleForOwner(ownerId)` przed sojuszem.
 *  6. Po zawarciu sojuszu + turze: ten sam heks JEST w `currentVisibleForOwner(ownerId)`,
 *     na WIELU kolejnych turach (ciągłość, nie jednorazowo).
 *  7. Po zerwaniu sojuszu (bez nowej tury): heks znika z `currentVisibleForOwner(ownerId)`
 *     natychmiast.
 *
 * Kryteria 3–6 (regres pakt/handel/granice, regres testów AI, regres bramek fog/dyplomacji,
 * tsc/5 bramek referencyjnych) pokryte osobno przez ISTNIEJĄCE bramki jednostkowe/regresyjne
 * (ai-fog-test.cjs, river-fog-visibility-test.cjs, alliance-war-obligation-test.cjs,
 * city-state-alliance-test.cjs, dyplo-mapa-odkrycie-live-test.cjs, ai-test.cjs, 5 bramek
 * referencyjnych R-PROC-AUTOBOT.md §6) — patrz raport Operatora rundy 1/2, wszystkie zielone
 * bez zmiany liczby PASS/FAIL względem baseline sprzed tego tematu (C-058: `ai-test.cjs`
 * 287/8-fail, identyczne nazwy asercji, pre-istniejąca czerwień niezwiązana z tym tematem).
 *
 * Bramka (z katalogu gra/): node tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs
 * — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-dyplo-sojusz-widocznosc-ciagla-live-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs',
  'R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1', 'dowody',
);

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
  console.log('[dyplo-sojusz-widocznosc-ciagla-live-test] budowanie bundla (vite build, dozwolona komenda)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[dyplo-sojusz-widocznosc-ciagla-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[dyplo-sojusz-widocznosc-ciagla-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[dyplo-sojusz-widocznosc-ciagla-live-test] zrzut: ' + p);
}

/**
 * Wzorzec z tools/rebel-city-notification-live-test.cjs + tools/perf-long-session-live-test.cjs:
 * `triggerPlayerEndTurn()` jest async (faza AI trwa realny czas) — czekaj na
 * `isEndTurnInProgress()===false` PO tym, jak faktycznie widzieliśmy `true`, zamiast stałego
 * opóźnienia (flaky przy wolniejszym CI). `?playtest=mapa` stawia jednostkę gracza CELOWO
 * przy wrogim mieście (sandbox pod bitwę) — bez `pullPlayerUnitsHome()` (main.ts,
 * `__rebelProtectionTestDebug`, już-istniejący hak z R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1,
 * ten sam wzorzec co perf-long-session-live-test.cjs) druga+ prawdziwa tura otwiera modal
 * preBattle i BLOKUJE dalsze `endTurn()` na stałe (odtworzone empirycznie w rundzie 1 tego
 * tematu — patrz raport Operatora) — steruje WYŁĄCZNIE pozycją jednostek GRACZA, mechanizm
 * bitwy/widoczności nietknięty.
 */
async function runEndTurnAndSettle(page, timeoutMs = 90000) {
  await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  let settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) { settled = true; break; }
    await wait(150);
  }
  await wait(400);
  return { sawInProgress, settled };
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__sojuszWidocznoscTestDebug && !!window.__dyploMapaOdkrycieTestDebug
      && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
  // Sandbox `?playtest=mapa` jest z natury niezrównoważony Power-owo (2 cywilizacje, jedna
  // pod bitwę) — bez tego zwycięstwo/porażka przez dominację mogłoby przerwać test przed
  // rozegraniem kilku KOLEJNYCH tur, ortogonalnie do tego, co ten test dowodzi (ten sam
  // wzorzec co perf-long-session-live-test.cjs / rebel-protection-live-test.cjs).
  await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
}

/** Elementy z `owner`, których NIE MA w `player` (ally-only). */
function setDiff(owner, player) {
  const playerSet = new Set(player);
  return owner.filter(k => !playerSet.has(k));
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[dyplo-sojusz-widocznosc-ciagla-live-test] playwright nie znaleziony.');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  try {
    await gotoPlaytestMapa(page);

    // === Wybór kandydata: AI z jakąkolwiek żywą widocznością (miasto/jednostka na mapie). ===
    const ownerId = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.pickCandidateOwnerId());
    assert('(0) kandydat AI znaleziony w świecie ?playtest=mapa', typeof ownerId === 'number', ownerId);
    if (typeof ownerId !== 'number') { throw new Error('Brak kandydata AI — przerwane.'); }

    // `?playtest=mapa` to malutki sandbox pod bitwę -- jedyny AI startuje TUŻ PRZY graczu
    // (cała jego widoczność jest od razu podzbiorem widoczności gracza). Dokładamy mu
    // dodatkową, geometrycznie odseparowaną jednostkę (patrz main.ts spawnFarAiScout) --
    // bez tego kontrola negatywna „przed" (kryterium 3) nie ma czego dowieść w tym świecie.
    const farPos = await page.evaluate((oid) => window.__sojuszWidocznoscTestDebug.spawnFarAiScout(oid), ownerId);
    assert('(0c) daleka jednostka sojusznika dostawiona (pozycja zwrócona)',
      farPos && typeof farPos.q === 'number' && typeof farPos.r === 'number', farPos);

    // === Kontrola negatywna „przed" (kryterium 3 tego testu): heksy WYŁĄCZNIE widoczne temu
    // AI (jego własne jednostki/miasta) NIE są (jeszcze) w bieżącej widoczności gracza. ===
    const ownerVisBefore = await page.evaluate(
      (oid) => window.__sojuszWidocznoscTestDebug.getOwnerCurrentVisibleKeys(oid), ownerId,
    );
    assert('(0b) kandydat ma niepustą własną widoczność (miasto/jednostka realnie na mapie)',
      Array.isArray(ownerVisBefore) && ownerVisBefore.length > 0, { ownerId, size: ownerVisBefore.length });
    const playerVisBefore = await page.evaluate(
      () => window.__sojuszWidocznoscTestDebug.getPlayerCurrentVisibleKeys(),
    );
    const allyOnlyBefore = setDiff(ownerVisBefore, playerVisBefore);
    assert('(1) PRZED sojuszem: istnieje ≥1 heks widoczny WYŁĄCZNIE sojusznikowi, nie graczowi',
      allyOnlyBefore.length > 0, { ownerId, allyOnlyCount: allyOnlyBefore.length, ownerVisSize: ownerVisBefore.length, playerVisSize: playerVisBefore.length });
    if (allyOnlyBefore.length === 0) { throw new Error('Brak kandydata z ally-only heksami — przerwane (dobierz inny świat/seed).'); }
    // Próbka ally-only heksów śledzona przez cały test (max 5, dla czytelnych asercji).
    const sampleKeys = allyOnlyBefore.slice(0, 5);
    for (const k of sampleKeys) {
      assert(`(1a) PRZED sojuszem: gracz NIE widzi ${k} (kontrola negatywna, per-heks)`,
        !playerVisBefore.includes(k), { k, playerVisBefore: playerVisBefore.includes(k) });
    }

    // === RUNDA 2 (strona AI, symetryczna): daleka jednostka GRACZA, poza zasięgiem `ownerId`,
    // do zbudowania kontroli negatywnej „przed" dla `currentVisibleForOwner(ownerId)` — to,
    // co realnie zasila decyzje AI-sojusznika (aiVisibleHexes/aiCityCaptureAllowed). ===
    const farPlayerPos = await page.evaluate(
      (oid) => window.__sojuszWidocznoscTestDebug.spawnFarPlayerScout(oid), ownerId,
    );
    assert('(0d) daleka jednostka GRACZA dostawiona (pozycja zwrócona)',
      farPlayerPos && typeof farPlayerPos.q === 'number' && typeof farPlayerPos.r === 'number', farPlayerPos);

    const ownerVisBefore2 = await page.evaluate(
      (oid) => window.__sojuszWidocznoscTestDebug.getOwnerCurrentVisibleKeys(oid), ownerId,
    );
    const playerVisBefore2 = await page.evaluate(
      () => window.__sojuszWidocznoscTestDebug.getPlayerCurrentVisibleKeys(),
    );
    const playerOnlyBefore = setDiff(playerVisBefore2, ownerVisBefore2);
    assert('(1b) PRZED sojuszem: istnieje ≥1 heks widoczny WYŁĄCZNIE graczowi, nie sojusznikowi (dowód dla strony AI)',
      playerOnlyBefore.length > 0,
      { ownerId, playerOnlyCount: playerOnlyBefore.length, ownerVisSize: ownerVisBefore2.length, playerVisSize: playerVisBefore2.length });
    if (playerOnlyBefore.length === 0) {
      throw new Error('Brak player-only heksów dla strony AI — przerwane (dobierz inny świat/seed).');
    }
    // Próbka player-only heksów śledzona przez cały test (max 5) — strona AI, symetria z sampleKeys.
    const sampleKeysAi = playerOnlyBefore.slice(0, 5);
    for (const k of sampleKeysAi) {
      assert(`(1c) PRZED sojuszem: sojusznik AI (currentVisibleForOwner) NIE widzi ${k} (kontrola negatywna, per-heks)`,
        !ownerVisBefore2.includes(k), { k, inOwnerVis: ownerVisBefore2.includes(k) });
    }

    await shot(page, '01-przed-sojuszem.png');

    // === Zawarcie REALNEGO sojuszu (aktywny wpis w `activeDeals`, sojusz_pelny). ===
    const dealId = await page.evaluate((oid) => window.__sojuszWidocznoscTestDebug.formAllianceWithOwner(oid), ownerId);
    assert('(2) sojusz zawarty (dealId zwrócony)', typeof dealId === 'string' && dealId.length > 0, dealId);

    // Realna tura (faza AI trwa faktyczny czas — czekaj na ustabilizowanie, patrz
    // runEndTurnAndSettle powyżej, ten sam wzorzec co rebel-city-notification-live-test.cjs).
    const endTurnRes1 = await runEndTurnAndSettle(page);
    assert('(2a) endTurn() faktycznie przeszedł przez fazę „w toku" i ustabilizował się',
      endTurnRes1.settled, endTurnRes1);
    const world1 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    assert('(2b) tura faktycznie postąpiła po endTurn()', world1.turn > 1, world1);

    // === Kryterium 1: PO sojuszu, PO CO NAJMNIEJ JEDNEJ turze — ally-only heksy widoczne. ===
    let playerVisAfter = await page.evaluate(() => window.__sojuszWidocznoscTestDebug.getPlayerCurrentVisibleKeys());
    for (const k of sampleKeys) {
      assert(`(3) PO sojuszu + turze: gracz WIDZI ${k} (unia z sojusznikiem zadziałała)`,
        playerVisAfter.includes(k), { k });
    }
    // === Kryterium 6 (strona AI): PO sojuszu + turze — sojusznik (currentVisibleForOwner)
    // WIDZI heksy widoczne wyłącznie graczowi (unia symetryczna zadziałała). ===
    let ownerVisAfter = await page.evaluate(
      (oid) => window.__sojuszWidocznoscTestDebug.getOwnerCurrentVisibleKeys(oid), ownerId,
    );
    for (const k of sampleKeysAi) {
      assert(`(3b) PO sojuszu + turze: sojusznik AI WIDZI ${k} (unia z widocznością gracza zadziałała)`,
        ownerVisAfter.includes(k), { k });
    }
    await shot(page, '02-po-sojuszu-tura1.png');

    // === Kryterium 1 (ciągłość — nie jednorazowo): jeszcze DWIE kolejne tury, ally-only nadal
    // widoczne KAŻDĄ z nich (nie tylko w turze zawarcia). ===
    for (let i = 2; i <= 3; i++) {
      const res = await runEndTurnAndSettle(page);
      const worldI = await page.evaluate(() => window.__eraTestDebug.getWorldState());
      assert(`(4.${i}a) endTurn() ustabilizowany i tura postąpiła (świat na turze ${worldI.turn})`,
        res.settled && worldI.turn >= i, { res, worldI });
      const vis = await page.evaluate(() => window.__sojuszWidocznoscTestDebug.getPlayerCurrentVisibleKeys());
      const stillAllVisible = sampleKeys.every(k => vis.includes(k));
      assert(`(4.${i}b) tura ${i} po zawarciu sojuszu: WSZYSTKIE próbkowane ally-only heksy nadal widoczne (ciągłość, nie jednorazowy zrzut)`,
        stillAllVisible, { turn: i, sampleKeys, missing: sampleKeys.filter(k => !vis.includes(k)) });
      const visAi = await page.evaluate(
        (oid) => window.__sojuszWidocznoscTestDebug.getOwnerCurrentVisibleKeys(oid), ownerId,
      );
      const stillAllVisibleAi = sampleKeysAi.every(k => visAi.includes(k));
      assert(`(4.${i}c) tura ${i} po zawarciu sojuszu — strona AI: WSZYSTKIE próbkowane player-only heksy nadal widoczne sojusznikowi (ciągłość)`,
        stillAllVisibleAi, { turn: i, sampleKeysAi, missing: sampleKeysAi.filter(k => !visAi.includes(k)) });
    }
    await shot(page, '03-po-trzech-turach.png');

    // === Kryterium 2: zerwanie sojuszu (jednostronne) — dodatkowa widoczność znika
    // NATYCHMIAST, bez rozegrania kolejnej tury. ===
    await page.evaluate((id) => window.__sojuszWidocznoscTestDebug.breakAllianceDeal(id), dealId);
    // ŚWIADOMIE bez endTurn() tutaj — kryterium wprost wymaga "bez opóźnienia o turę".
    const playerVisAfterBreak = await page.evaluate(() => window.__sojuszWidocznoscTestDebug.getPlayerCurrentVisibleKeys());
    const stillAnyVisibleAfterBreak = sampleKeys.some(k => playerVisAfterBreak.includes(k));
    assert('(5) PO zerwaniu sojuszu (BEZ nowej tury): ŻADEN z próbkowanych ally-only heksów nie jest już w bieżącej widoczności gracza',
      !stillAnyVisibleAfterBreak, { sampleKeys, stillVisible: sampleKeys.filter(k => playerVisAfterBreak.includes(k)) });
    // === Kryterium 7 (strona AI): PO zerwaniu (BEZ nowej tury) — sojusznik traci widoczność
    // gracza NATYCHMIAST (dokładnie ten sam mechanizm liczony-od-nowa co strona gracza). ===
    const ownerVisAfterBreak = await page.evaluate(
      (oid) => window.__sojuszWidocznoscTestDebug.getOwnerCurrentVisibleKeys(oid), ownerId,
    );
    const stillAnyVisibleAfterBreakAi = sampleKeysAi.some(k => ownerVisAfterBreak.includes(k));
    assert('(5b) PO zerwaniu sojuszu (BEZ nowej tury): ŻADEN z próbkowanych player-only heksów nie jest już widoczny sojusznikowi',
      !stillAnyVisibleAfterBreakAi, { sampleKeysAi, stillVisible: sampleKeysAi.filter(k => ownerVisAfterBreak.includes(k)) });
    await shot(page, '04-po-zerwaniu.png');

    assert('(E0) zero błędów konsoli/JS podczas całego przebiegu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
  }

  console.log('\ndyplo-sojusz-widocznosc-ciagla-live-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
