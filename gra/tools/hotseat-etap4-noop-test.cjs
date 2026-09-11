'use strict';
/**
 * hotseat-etap4-noop-test.cjs — R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1.
 *
 * Bramka-narzędzie dowodu no-op dla przyszłego rozcięcia `triggerPlayerEndTurn()`
 * (Etap 4 planu hot-seat), zgodnie z rekomendacją §6.2
 * `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`.
 *
 * TA RUNDA NIE ROZCINA `triggerPlayerEndTurn()` — wyłącznie buduje i dowodzi samej
 * bramki na DZISIEJSZYM (nierozciętym) kodzie: dwa niezależne uruchomienia (A i B) tego
 * samego testu, na tym samym kodzie, muszą dać IDENTYCZNĄ listę 30 hashy SHA-256 (jeden
 * per turę, tury 1..30, `endTurn()` bez żadnych innych rozkazów gracza).
 *
 * MECHANIZM (dokładnie wg §6.2, ze ZNALEZISKIEM tej rundy w punkcie 1):
 *  1. Wejście: PIERWOTNIE próba użycia `?playtest=mapa` (2-cywilizacyjny sandbox pod
 *     bitwę) -- ODRZUCONA po żywym uruchomieniu (debug run, HOTSEAT_NOOP_TURNS=2):
 *     ten sandbox kończy się realnym `[Victory] ZWYCIĘSTWO — dominacja (tura 2)`
 *     (zaprojektowany pod POJEDYNCZĄ bitwę 2 cywilizacji, nie pod 30 tur ciągłej gry) --
 *     po zwycięstwie `canPlayerInitiateEndTurn=false` i KAŻDY kolejny `endTurn()` jest
 *     odrzucany, więc 30-turowa pętla jest tam strukturalnie niewykonalna. Użyty
 *     zamiast tego: PRAWDZIWY `doStartGame(params)` (main.ts, ta sama funkcja co klik
 *     "Start" w kreatorze nowej gry) przez istniejący hak `__cityStateStartUnitsTestDebug`
 *     (main.ts ~22239, już używany przez `city-state-start-units-live-test.cjs`) --
 *     `startNewGame('normal', N)` (seed=778899 stały w kodzie hooka) + `foundPlayerStartCity()`
 *     (REALNE `tryFoundPlayerCityAt`, ta sama funkcja co klik gracza w startowy heks) --
 *     dopiero to daje stabilną, wieloturową rozgrywkę bez natychmiastowego zwycięstwa.
 *     main.ts nie jest modułem (cała logika żyje w domknięciu wewnątrz jednej funkcji),
 *     więc `tools/logic-test.cjs` (esbuild bundle czystych funkcji) NIE pokrywa pełnego
 *     silnika/EOT; jedyny sposób odpalenia PRAWDZIWEGO `triggerPlayerEndTurn()` to realny
 *     `vite build` + realny headless Chromium (C-001, komenda dozwolona).
 *  2. Pętla: `window.__eraTestDebug.endTurn()` (main.ts ~21498, `endTurn: () =>
 *     triggerPlayerEndTurn()` — TEN SAM hak, którego używają inne testy Playwright wg
 *     komentarzy w main.ts) wywołany 30 razy pod rząd, bez żadnych innych rozkazów gracza.
 *  3. Hash stanu po KAŻDEJ turze: NIE MA istniejącego test-hooka zwracającego
 *     `buildSaveGameSnapshot()` do window (funkcja żyje jako domknięcie main.ts, nie jest
 *     eksportowana) — a ta runda ma zakaz zmiany main.ts. Zamiast reimplementacji: po
 *     każdym `endTurn()` wysyłamy prawdziwy skrót klawiszowy Ctrl+S (main.ts ~33075,
 *     `doQuickSave(true)` → `persistSaveToSlot(AUTOSAVE_SLOT_ID, ...)` →
 *     `saveToLocal('autosave', buildSaveGameSnapshot(...))`) — DOKŁADNIE ta sama funkcja
 *     gry, którą woła gracz. Po zapisie czytamy surowy JSON wprost z IndexedDB
 *     (`thegame-saves`/`kv`/klucz `thegame.save.autosave` — stałe z
 *     `src/game/idb-storage.ts` i `src/game/save.ts::SAVE_PREFIX`/`AUTOSAVE_SLOT_ID`,
 *     IndexedDB to natywne globalne API przeglądarki, dostępne bez importu modułu).
 *     Jedyne pole normalizowane przed hashem: `meta.savedAt` (`new Date().toISOString()`,
 *     main.ts:27805 — jedyny zegar ścienny w całym `buildSaveGameSnapshot`, potwierdzony
 *     świeżym grepem `Date.now()|new Date()` w main.ts: dwa pozostałe trafienia to
 *     `endTurnStartedAt`, licznik zawieszenia EOT, NIE serializowany do zapisu). Reszta
 *     obiektu hashowana `JSON.stringify` z kluczami posortowanymi rekurencyjnie.
 *  4. Determinizm: `page.addInitScript` podmienia `Math.random` na mulberry32(SEED) PRZED
 *     załadowaniem JAKIEGOKOLWIEK skryptu strony (Playwright: init script biegnie przed
 *     modułami strony) — eliminuje niedeterminizm 11 wystąpień `Math.random()` w main.ts
 *     (6 generatorów id jednostek + `pickVillageReward`, plan §H3 pkt 2). Zero zmiany w
 *     main.ts — podmiana żyje wyłącznie w tym pliku testowym.
 *  5. Dwa niezależne uruchomienia (A, B): ten sam seed PRNG, ta sama sekwencja komend,
 *     świeży `browser.newPage()` (świeży profil, pusty IndexedDB) każdorazowo.
 *  6. PASS = 30/30 identycznych hashy A vs B. Jakakolwiek rozbieżność → FAIL z numerem
 *     tury pierwszej rozbieżności.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU: jeśli hak testowy końca tury nie działa headless (np.
 * DOM/Chromium niedostępne), bramka kończy się BLOCK z jawnym komunikatem błędu — nie
 * redukuje liczby tur, nie pomija patcha determinizmu.
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap4-noop-test.cjs — exit 0 = zielona.
 *
 * OBRONA runda 1 (Evaluator `02-evaluator-runda1.md`, zarzuty 1-2): 3/3 prób Evaluatora
 * pokazały Uruchomienie B padające w środku pętli (crash headless Chromium, różne miejsca)
 * ORAZ jedną próbę zawisającą zamiast szybkiego BLOCK. Naprawa: `runOnceWithRetry`
 * (do 3 prób na uruchomienie, świeży `browser.launch()` za każdym razem -- kryterium
 * sukcesu 30/30 A vs B BEZ ZMIAN) + `closeBrowserSafely` (wyścig z limitem 8s + SIGKILL
 * jako ostatnia linia obrony, żeby `browser.close()` na martwym uchwycie nigdy nie zawiesił
 * procesu).
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TURNS = 30; // BINARNE KRYTERIUM SUKCESU (dispatch) -- dokładnie 30, bez trybu debug/override
const RNG_SEED = 424242; // dowolna, stała wartość -- ten sam seed w obu uruchomieniach (A i B)

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-etap4-noop-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const CITY_STATES_COUNT = 2; // parametr hooka startNewGame -- wartość dowolna, spójna A/B

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-etap4-noop-test] ' + msg); }

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

// Init script wstrzykiwany PRZED jakimkolwiek skryptem strony (Playwright:
// addInitScript biegnie przed modułami strony, więc podmiana Math.random obowiązuje
// od pierwszej linii boot() -- zero zmiany w main.ts, patrz docstring pkt 4).
function mulberry32InitScript(seed) {
  return `(() => {
    let s = ${seed} | 0;
    Math.random = function() {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();`;
}

// Kanoniczny, stabilny stringifier -- klucze posortowane REKURENCYJNIE (nie tylko na
// najwyższym poziomie, §6.2 pkt 3 wymaga "deterministycznego, kanonicznego" zrzutu; obiekt
// SaveGame ma zagnieżdżone słowniki, np. cityProd/diploRelations).
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
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
    () => !!(window).__cityStateStartUnitsTestDebug && !!(window).__eraTestDebug,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
}

// Prawdziwy `doStartGame(params)` (main.ts, ta sama funkcja co klik "Start" w kreatorze
// nowej gry) przez istniejący hak `__cityStateStartUnitsTestDebug.startNewGame` (main.ts
// ~22239, seed=778899 stały w kodzie hooka -- ten sam "ustalony seed mapy" wymagany przez
// §6.2 pkt 1) + REALNE założenie stolicy gracza (`foundPlayerStartCity()` ->
// `tryFoundPlayerCityAt`, ta sama funkcja co klik gracza w podświetlony startowy heks).
//
// ZNALEZISKO tej rundy (debug run HOTSEAT_NOOP_TURNS=2, patrz docstring pkt 1): pierwotna
// próba `?playtest=mapa` kończyła się realnym `[Victory] ZWYCIĘSTWO — dominacja (tura 2)`
// (sandbox zaprojektowany pod pojedynczą bitwę 2 cywilizacji) -- KAŻDY kolejny `endTurn()`
// po zwycięstwie jest odrzucany (`canPlayerInitiateEndTurn=false`), więc 30-turowa pętla
// była tam strukturalnie niewykonalna. `startNewGame`/`foundPlayerStartCity` daje zamiast
// tego stabilną, wieloturową rozgrywkę (ten sam bootstrap co
// `city-state-start-units-live-test.cjs`, tam dowiedziony jako stabilny).
async function startRealNewGame(page) {
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
  }, 360000, 'world-generated');

  const founded = await page.evaluate(() => (window).__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error('foundPlayerStartCity() zwróciło false -- stolica gracza nie założona');

  await pollUntil(page, () => {
    const dbg = (window).__cityStateStartUnitsTestDebug;
    const st = dbg.dumpState();
    const playerHasCity = st.cities.some((c) => c.ownerId === 0);
    return { ready: st.awaitingFirstPlayerCity === false && playerHasCity, playerHasCity };
  }, 30000, 'city-founded');

  await wait(400);

  const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
  if (!(world0.citiesLen > 0 && world0.unitsLen > 0 && world0.turn === 1)) {
    throw new Error(`startRealNewGame: bootstrap niekompletny: ${JSON.stringify(world0)}`);
  }
}

async function endTurnAndSettle(page) {
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  let settled = false;
  while (Date.now() - t0 < 60000) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) { settled = true; break; }
    await wait(100);
  }
  if (!settled) throw new Error('endTurn() nie osiadło (endTurnInProgress nigdy nie wróciło na false)');
  await wait(300);
}

// Realny zapis (Ctrl+S -> doQuickSave -> buildSaveGameSnapshot -> IndexedDB) + odczyt
// surowego JSON wprost z IndexedDB (globalne API przeglądarki, patrz docstring pkt 3).
async function saveAndReadSnapshot(page, expectedTurn) {
  await page.keyboard.press('Control+s');
  const deadline = Date.now() + 20000;
  let lastRaw = null;
  while (Date.now() < deadline) {
    const raw = await page.evaluate(async () => {
      return await new Promise((resolve) => {
        const req = indexedDB.open('thegame-saves', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        };
        req.onerror = () => resolve(null);
        req.onsuccess = () => {
          const db = req.result;
          try {
            const tx = db.transaction('kv', 'readonly');
            const getReq = tx.objectStore('kv').get('thegame.save.autosave');
            getReq.onsuccess = () => resolve(typeof getReq.result === 'string' ? getReq.result : null);
            getReq.onerror = () => resolve(null);
          } catch { resolve(null); }
        };
      });
    });
    lastRaw = raw;
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.tura === expectedTurn) return parsed;
      } catch { /* jeszcze niekompletny zapis -- ponów */ }
    }
    await wait(150);
  }
  throw new Error(
    `saveAndReadSnapshot: timeout czekania na zapis tury ${expectedTurn} w IndexedDB` +
    (lastRaw === null ? ' (klucz wciąż pusty)' : ' (ostatni odczyt: ' + lastRaw.slice(0, 200) + '...)'),
  );
}

// Zamknięcie przeglądarki z twardym limitem czasu -- naprawa ZARZUTU 2 (Evaluator,
// runda 1, `02-evaluator-runda1.md`): gdy proces Chromium już padł w trakcie pętli
// (patrz `runOnceWithRetry` niżej), `browser.close()` na martwym uchwycie potrafi nigdy
// się nie rozstrzygnąć -- Evaluator zaobserwował to bezpośrednio (Uruchomienie 3: `timeout
// 590` musiał ubić proces, `EXIT=124`, zamiast szybkiego `BLOCK`/`exit(2)`). Wyścig z
// twardym limitem (8s) gwarantuje, że `runOnce` zawsze wraca -- albo z wynikiem, albo z
// wyjątkiem -- i proces NIGDY nie zawiśnie na `finally`.
async function closeBrowserSafely(browser) {
  await Promise.race([
    browser.close().catch(() => { /* już martwy -- nic do zrobienia */ }),
    wait(8000),
  ]);
  // Jeśli po limicie proces OS wciąż żyje (close() nie zdążył/nie zadziałał), dobij go
  // bezpośrednio -- ostatnia linia obrony przed zawiśnięciem całej bramki.
  try {
    const proc = browser.process && browser.process();
    if (proc && proc.exitCode === null && !proc.killed) proc.kill('SIGKILL');
  } catch { /* best-effort */ }
}

async function runOnce(chromium, label) {
  const browser = await launchBrowser(chromium);
  const hashes = [];
  // Rozróżnienie: `jsExceptions` (pageerror -- NIEPRZECHWYCONY wyjątek JS, prawdziwy
  // sygnał zepsucia silnika) vs `consoleErrorLogs` (console.error() wywołane ŚWIADOMIE
  // przez kod gry, np. "[Wojna wymuszona] DECISION_REQUIRED: ..." main.ts:30703 --
  // udokumentowany w kodzie brzegowy przypadek mechaniki, NIE crash). Bramka gasi się
  // tylko na `jsExceptions` -- traktowanie KAŻDEGO console.error jako FAIL byłoby
  // fałszywym czerwonym na tym deterministycznym, ale świadomie logowanym przypadku
  // (potwierdzone: identyczne 7 wystąpień w obu uruchomieniach, patrz raport).
  const jsExceptions = [];
  const consoleErrorLogs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrorLogs.push(msg.text());
      if (process.env.HOTSEAT_NOOP_DEBUG) console.log(`[page:${label}:${msg.type()}]`, msg.text());
    });
    page.on('pageerror', (e) => jsExceptions.push(String(e)));
    await page.addInitScript(mulberry32InitScript(RNG_SEED));

    log(`[${label}] start realnej nowej gry (startNewGame + foundPlayerStartCity)...`);
    await startRealNewGame(page);

    for (let i = 1; i <= TURNS; i++) {
      await endTurnAndSettle(page);
      const world = await page.evaluate(() => window.__eraTestDebug.getWorldState());
      const snapshot = await saveAndReadSnapshot(page, world.turn);
      // Normalizacja JEDYNEGO zegara ściennego w snapshotcie (main.ts:27805) -- patrz
      // docstring pkt 3. Bez tego 30/30 identycznych hashy jest strukturalnie
      // niemożliwe między dwoma osobnymi uruchomieniami procesu.
      if (snapshot.meta && typeof snapshot.meta === 'object') snapshot.meta.savedAt = '<normalized>';
      const canon = stableStringify(snapshot);
      hashes.push(sha256(canon));
      log(`[${label}] tura ${i} (turn=${world.turn}): hash=${hashes[hashes.length - 1].slice(0, 12)}...`);
    }

    if (jsExceptions.length > 0) {
      log(`[${label}] UWAGA: ${jsExceptions.length} NIEPRZECHWYCONYCH wyjątków JS (pageerror):`);
      for (const e of jsExceptions.slice(0, 10)) log('  ' + e);
    }
    if (consoleErrorLogs.length > 0) {
      log(`[${label}] informacyjnie: ${consoleErrorLogs.length} console.error() (świadome logi gry, nie crash):`);
      for (const e of consoleErrorLogs.slice(0, 10)) log('  ' + e);
    }
  } finally {
    await closeBrowserSafely(browser);
  }
  return { hashes, jsExceptions, consoleErrorLogs };
}

// Naprawa ZARZUTU 1 (Evaluator, runda 1): w 3/3 niezależnych prób Evaluatora
// Uruchomienie B padało w środku pętli (`Target page, context or browser has been
// closed`), za każdym razem w INNYM miejscu (tura 27, 16, 6) -- niestabilność
// procesu headless Chromium pod długą, ciężką sesją JS, NIE niedeterminizm samej gry
// (potwierdzenie: wszystkie hashe, które zdążyły powstać przed crashem, były bajt-w-bajt
// identyczne z listą Operatora -- Ustalenie pozytywne Evaluatora). Ponieważ crash jest
// czysto infrastrukturalny (miejsce niestabilne, sam mechanizm hashowania nie), retry ze
// świeżym `browser.launch()` jest właściwą naprawą -- bramka NADAL wymaga 30/30
// identycznych hashy A vs B (patrz `main`, kryterium sukcesu niezmienione); retry tylko
// chroni przed fałszywym BLOCK-iem z powodu spontanicznego zniknięcia procesu
// przeglądarki, niezwiązanego z kodem gry.
async function runOnceWithRetry(chromium, label, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runOnce(chromium, label);
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
    console.error('[hotseat-etap4-noop-test] BLOCK: playwright nie znaleziony w node_modules.');
    process.exit(2);
  }

  try {
    buildBundle();
  } catch (e) {
    console.error('[hotseat-etap4-noop-test] BLOCK: vite build nie powiódł się:', e.message || e);
    process.exit(2);
  }

  let runA;
  let runB;
  try {
    runA = await runOnceWithRetry(chromium, 'A');
    runB = await runOnceWithRetry(chromium, 'B');
  } catch (e) {
    console.error('[hotseat-etap4-noop-test] BLOCK: hak testowy end-turn/save nie zadziałał headless:', e && e.stack ? e.stack : e);
    process.exit(2);
  }

  console.log('\n=== Uruchomienie A -- 30 hashy ===');
  runA.hashes.forEach((h, idx) => console.log(`  tura ${idx + 1}: ${h}`));
  console.log('\n=== Uruchomienie B -- 30 hashy ===');
  runB.hashes.forEach((h, idx) => console.log(`  tura ${idx + 1}: ${h}`));

  let firstMismatch = -1;
  let matchCount = 0;
  const n = Math.max(runA.hashes.length, runB.hashes.length);
  for (let i = 0; i < n; i++) {
    if (runA.hashes[i] === runB.hashes[i] && runA.hashes[i] !== undefined) {
      matchCount++;
    } else if (firstMismatch === -1) {
      firstMismatch = i + 1;
    }
  }

  console.log(`\n=== Porównanie A vs B: ${matchCount}/${TURNS} identycznych hashy ===`);
  if (firstMismatch !== -1) {
    console.log(`Pierwsza rozbieżność: tura ${firstMismatch}`);
    console.log(`  A[${firstMismatch - 1}] = ${runA.hashes[firstMismatch - 1]}`);
    console.log(`  B[${firstMismatch - 1}] = ${runB.hashes[firstMismatch - 1]}`);
  }

  // Informacyjnie (NIE gasi PASS -- patrz komentarz przy `consoleErrorLogs` w runOnce):
  // czy świadome console.error() gry (np. "[Wojna wymuszona] DECISION_REQUIRED: ...")
  // wystąpiły w IDENTYCZNEJ liczbie w obu uruchomieniach -- dodatkowy, nieobowiązkowy
  // sygnał determinizmu poza samym hashem stanu.
  const sameErrCount = runA.consoleErrorLogs.length === runB.consoleErrorLogs.length;
  console.log(`\n=== console.error() gry (informacyjnie, NIE część kryterium PASS) ===`);
  console.log(`A: ${runA.consoleErrorLogs.length} · B: ${runB.consoleErrorLogs.length} ·`
    + ` liczby ${sameErrCount ? 'IDENTYCZNE' : 'RÓŻNE'}`);

  // BINARNE KRYTERIUM SUKCESU (dispatch, §6.2 pkt 7): WYŁĄCZNIE 30/30 identycznych hashy
  // na obu uruchomieniach. `jsExceptions` (pageerror, nieprzechwycony wyjątek JS) gasi
  // bramkę -- to jest prawdziwy sygnał zepsucia silnika, nie świadomy log.
  const pass = matchCount === TURNS
    && runA.hashes.length === TURNS
    && runB.hashes.length === TURNS
    && runA.jsExceptions.length === 0
    && runB.jsExceptions.length === 0;

  console.log(`\nhotseat-etap4-noop-test: ${pass ? 'PASS' : 'FAIL'} (${matchCount}/${TURNS} identycznych, ` +
    `jsExcA=${runA.jsExceptions.length}, jsExcB=${runB.jsExceptions.length}, ` +
    `consErrA=${runA.consoleErrorLogs.length}, consErrB=${runB.consoleErrorLogs.length})`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('[hotseat-etap4-noop-test] BLOCK: nieoczekiwany wyjątek:', e && e.stack ? e.stack : e);
  process.exit(2);
});
