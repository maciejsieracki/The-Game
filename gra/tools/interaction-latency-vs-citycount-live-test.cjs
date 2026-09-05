'use strict';
/**
 * interaction-latency-vs-citycount-live-test.cjs — P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1
 * (Operator Sonnet 5, effort=high, RECON/POMIAR, worktree izolowany).
 *
 * ZGŁOSZENIE (właściciel, dyspozycje/PYTANIA-OTWARTE.md, 3 doprecyzowania 2026-08-16/17):
 * "problemem jest, że w trakcie gry bardzo długo czeka się [...] żeby wejść do miasta,
 * zmienić miasto lub cokolwiek zrobić [...] Przełączanie między jednostkami [...] Każda
 * zmiana, każde kliknięcie działa bardzo powoli [...] Podejrzewam, że tutaj jest kwestia
 * ilości miast [...] im więcej miast, tym większe obciążenie".
 *
 * CO TA BRAMKA MIERZY (żywo, headless Chromium, performance.now() w STRONIE — nie w
 * procesie Playwright, żeby uniknąć narzutu IPC): czas między dispatchem realnego klicku
 * DOM a momentem, w którym główny wątek wraca do przeglądarki na tyle, by 2 kolejne
 * requestAnimationFrame zdążyły odpalić. To bezpośrednio łapie DŁUGI SYNCHRONICZNY handler
 * blokujący wątek (dokładnie ten rodzaj przyczyny, jakiego szuka ten dispatch) — polling
 * przez rAF fizycznie nie może odpalić się wcześniej niż handler klawisza/klika zwróci
 * sterowanie. Mierzone akcje (realne DOM, realne handlery main.ts — zero reimplementacji):
 *   1. otwarcie listy miast (toolbar [data-act="cities"])
 *   2. otwarcie panelu KONKRETNEGO miasta (klik pierwszego wiersza listy -> openCityPanelForPlayer)
 *   3. otwarcie listy armii (toolbar [data-act="army"])
 *   4. przełączenie zaznaczonej jednostki (klik drugiego wiersza listy armii -> selectPlayerUnit)
 * "ruch jednostką" (3. przykład dispatchu) NIE jest tu klikany na mapie 3D (kliknięcie
 * heksu wymagałoby rzutowania ekran->hex przez kamerę WebGL, poza budżetem tej rundy) —
 * ale (4) selectPlayerUnit() jest DOKŁADNIE tą samą funkcją main.ts, która przelicza
 * `reachable` (zbiór osiągalnych heksów) na potrzeby ruchu, więc mierzy tę samą ścieżkę
 * kosztu co pierwszy krok ruchu jednostką. Jeśli hipoteza WSPÓLNEGO, kosztownego handlera
 * odpalanego po KAŻDEJ akcji gracza (RECON dispatchu) jest prawdziwa, urośnie identycznie
 * we wszystkich 4 pomiarach niezależnie od tego, który dokładnie click je wyzwolił.
 *
 * SETUP STANU GRY (bez ŻADNEJ zmiany main.ts — allowlista tej rundy pozwala WYŁĄCZNIE na
 * nowy plik narzędzia): scenariusze NISKI (2 miasta gracza) i WYSOKI (12 miast gracza) na
 * TEJ SAMEJ wygenerowanej mapie (ten sam seed, ta sama liczba heksów — rozmiar mapy jest
 * TRZYMANY STAŁY między scenariuszami, żeby nie mylić kosztu renderu mapy z kosztem liczby
 * miast), przez realny SAVE/LOAD main.ts (game/save.ts::SaveGame, restoreGameFromSave) —
 * NIE przez playtest-sandbox (za mały, sztywno 1 miasto gracza) i NIE przez fabrykowanie
 * struktur na pałę: miasta pochodzą z PRAWDZIWEGO `foundCityAt` (game/cities.ts, ta sama
 * funkcja co realne założenie miasta), mapa z PRAWDZIWEGO `generujSwiat` +
 * `serializeMapForSave` (żeby load NIE regenerował mapy z ziarna innymi parametrami niż
 * użyte tu — patrz komentarz przy MAP_SNAPSHOT niżej). Save trafia do IndexedDB pod
 * DOKŁADNIE takim kluczem, jakiego oczekuje game/save.ts (thegame-saves/kv,
 * 'thegame.save.'+slot), plus wskaźnik 'thegame.save._lastPlayed' w localStorage — menu
 * główne wczytuje go przyciskiem "Kontynuuj" (REALNA ścieżka gracza, main.ts::onContinue),
 * zero nowych/tymczasowych okien wejścia.
 *
 * Bramka (z katalogu gra/): node tools/interaction-latency-vs-citycount-live-test.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[interaction-latency] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_DIR = path.resolve(__dirname, '..');
// IZOLACJA (00-dispatch.md): budowa WYŁĄCZNIE poza drzewem repo (/tmp), nigdy do gra/dist ani
// jakiegokolwiek katalogu wewnątrz gra/ (git status/diff tej rundy musi zostać czysty).
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const OUT_DIR = path.join(os.tmpdir(), `civ-dist-perf-interaction-latency-${TMPDIR_RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const FIXTURE_ENTRY = path.join(__dirname, '.il-fixture-entry.ts');
const FIXTURE_BUNDLE = path.join(__dirname, '.il-fixture-bundle.cjs');

const SEED = 424242;
const N_LOW = 2;
const N_HIGH = 12;

// ---------------------------------------------------------------------------
// A. Fixture builder (Node, esbuild) — REALNE funkcje silnika, zero fabrykacji.
// ---------------------------------------------------------------------------

function buildFixtureBundle() {
  fs.writeFileSync(
    FIXTURE_ENTRY,
    `export { generujSwiat } from '../src/map/generator';\n` +
    `export { computeStartPositions } from '../src/map/gen-helpers';\n` +
    `export { foundCityAt } from '../src/game/cities';\n` +
    `export { loadGameData } from '../src/data/loader';\n` +
    `export { categoryOf } from '../src/units/setup';\n` +
    `export { serializeMapForSave } from '../src/map/mapSnapshot';\n`,
    'utf8',
  );
  esbuild.buildSync({
    entryPoints: [FIXTURE_ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: FIXTURE_BUNDLE,
    absWorkingDir: GRA_DIR,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
  });
  return require(FIXTURE_BUNDLE);
}

/** Zwraca { low: SaveGame, high: SaveGame } — TA SAMA mapa (mapSnapshot), różna liczba
 *  miast gracza. Miasta 0..N_LOW-1 są IDENTYCZNE (id/q/r) w obu — porównanie mierzy więc
 *  DOKŁADNIE ten sam byt (city0, u0/u1) w dwóch stanach świata różniących się WYŁĄCZNIE
 *  liczbą pozostałych miast gracza. */
function buildFixtures(M) {
  console.log('[interaction-latency] generowanie mapy (generujSwiat, realny generator, ~13s)...');
  const data = M.loadGameData();
  const map = M.generujSwiat(SEED, 'standardowy', 'kontynenty', {
    landFraction: 0.5,
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  });
  const starts = M.computeStartPositions(map.hexes, SEED, { minCount: N_HIGH + 2, minDist: 5, absMinDist: 2 });
  if (starts.length < N_HIGH) {
    throw new Error(`computeStartPositions: za mało pozycji (${starts.length} < ${N_HIGH})`);
  }
  const citiesAll = [];
  for (let i = 0; i < N_HIGH; i++) {
    const p = starts[i];
    const c = M.foundCityAt(p.q, p.r, 0, citiesAll, map, 'Miasto' + (i + 1));
    if (!c) throw new Error(`foundCityAt nie powiódł się dla pozycji ${i}: ${JSON.stringify(p)}`);
    citiesAll.push(c);
  }
  const unitDef = data.units.find((u) => u.Jednostka === 'Wojownik');
  if (!unitDef) throw new Error('brak jednostki "Wojownik" w data.units');
  const ruch = typeof unitDef.Ruch === 'number' && unitDef.Ruch > 0 ? unitDef.Ruch : 2;
  const category = M.categoryOf(
    'Wojownik',
    unitDef['Rola (linia)'] ?? '',
    unitDef['Super-jednostka'] === 'TAK',
    unitDef['Typ'],
  );
  const home = citiesAll[0];
  const units = [
    { id: 'u0', ownerId: 0, typeId: 'Wojownik', category, q: home.q, r: home.r, ruch, ruchLeft: ruch },
    { id: 'u1', ownerId: 0, typeId: 'Wojownik', category, q: home.q, r: home.r, ruch, ruchLeft: ruch },
  ];
  const explored = Object.keys(map.hexes);
  // MAP_SNAPSHOT: zapis niesie PEŁNĄ siatkę heksów (game/save.ts::SaveGame.mapSnapshot) —
  // load buduje mapę WPROST stąd (game/load-map-source.ts::loadMapForSave), BEZ wołania
  // generatora. Bez tego pola load regenerowałby mapę z `seed` przez
  // newGameParamsForLoad()'s fallback (main.ts) — którego domyślne parametry
  // (landFractionPercent=30, worldDensity 'Średnia' na WSZYSTKICH osiach) NIE pokrywają
  // się z tym, czego użyto tu (landFraction 0.5) -- inna mapa, współrzędne miast
  // wylosowane na tej mapie mogłyby wylądować w morzu na regenerowanej. mapSnapshot
  // eliminuje całe to ryzyko rozjazdu: load używa DOKŁADNIE tej mapy, na której founded
  // miasta.
  const mapSnapshot = M.serializeMapForSave(map);

  const makeSave = (n) => ({
    wersja: 2,
    tura: 1,
    seed: SEED,
    units,
    cities: citiesAll.slice(0, n),
    explored,
    mapSnapshot,
    // game/save.ts::checkSaveIntegrity() odrzuca zapis bez parametrów mapy w `meta`
    // (kod 'no_map_meta') JAKO FATALNY -- main.ts::loadGameFromSlot() wtedy w ogóle NIE
    // dochodzi do hideMainMenu()/restoreGameFromSave(), tylko pokazuje hint i wraca do
    // menu (złapane ŻYWO w tej rundzie -- "Kontynuuj" wyglądał klikalnie, ale load cicho
    // odbijał się o tę bramkę integralności, patrz raport Operatora). Legacy pola
    // (loadTypSwiata/loadMapSize), NIE meta.newGameParams pełny -- main.ts::
    // newGameParamsForLoad() ma już DOBRZE PRZETESTOWANY fallback budujący z nich
    // kompletny NewGameParams (reszta pól: difficulty/speed/mapQuality/... z sensownymi
    // domyślnymi); ręczne sklejenie WŁASNEGO częściowego NewGameParams ryzykowałoby
    // brakujące pola, na których dalszy kod polega bezwarunkowo. mapSnapshot i tak
    // omija generator (loadMapForSave/usedSnapshot) -- landFraction w fallbacku (30%)
    // nie ma znaczenia, bo generator nigdy się nie odpala.
    meta: {
      loadTypSwiata: 'kontynenty',
      loadMapSize: 'Standardowy',
      loadCivId: 'grecy',
    },
  });
  return { low: makeSave(N_LOW), high: makeSave(N_HIGH) };
}

// ---------------------------------------------------------------------------
// B. vite build (jedyna dozwolona komenda budowy z CLAUDE.md/IZOLACJA tego dispatchu).
// ---------------------------------------------------------------------------

function buildBundle() {
  console.log('[interaction-latency] budowanie bundla (vite build, wyłącznie dozwolona komenda)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[interaction-latency] build OK.');
}

// ---------------------------------------------------------------------------
// C. Playwright driver
// ---------------------------------------------------------------------------

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[interaction-latency] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Zapisuje `saveGame` do IndexedDB pod kluczem realnym dla game/save.ts (thegame-saves/kv,
 *  'thegame.save.'+slot) i ustawia wskaźnik "ostatnio grane" w localStorage — DOKŁADNIE ten
 *  sam magazyn/klucze, jakich menu główne ("Kontynuuj") oczekuje (patrz save.ts,
 *  idb-storage.ts). Zero reimplementacji formatu — value to JSON.stringify(saveGame) z
 *  wersja:2 (identyczne z serializeGame()). */
async function injectSaveAndSetLastPlayed(page, slot, saveGame) {
  await page.evaluate(async ({ slot, json }) => {
    function openDb() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('thegame-saves', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(json, 'thegame.save.' + slot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.setItem('thegame.save._lastPlayed', slot);
  }, { slot, json: JSON.stringify(saveGame) });
}

/** Generyczny pomiar "czas do odblokowania wątku głównego po kliku" — patrz nagłówek pliku.
 *  Listener capture=true na `selector` łapie moment PRZED realnym handlerem main.ts (który
 *  jest zarejestrowany bez capture, na bubble) -- t0 to moment startu dyspatchu zdarzenia,
 *  t1 to 2 klatki (rAF) po synchronicznym powrocie sterowania. */
async function measureClickLatency(page, selector) {
  // Delegacja na `document` (capture) zamiast listenera na konkretnym elemencie -- odporne
  // na wymianę węzła DOM między `page.evaluate` (podpięcie) a `page.click` (dyspatch); złapane
  // żywo w tej rundzie jako źródło fałszywych zawieszeń przy HUD-zie wciąż się przebudowującym
  // tuż po wczytaniu.
  await page.evaluate((sel) => {
    window.__ilT0 = null;
    window.__ilT1 = null;
    const handler = (ev) => {
      if (!(ev.target instanceof Element) || !ev.target.closest(sel)) return;
      document.removeEventListener('click', handler, true);
      window.__ilT0 = performance.now();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { window.__ilT1 = performance.now(); });
      });
    };
    document.addEventListener('click', handler, true);
  }, selector);
  await page.click(selector);
  await page.waitForFunction(() => window.__ilT1 !== null, undefined, { timeout: 30000 });
  return page.evaluate(() => window.__ilT1 - window.__ilT0);
}

async function waitMainMenuReady(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#cm-buttons button.mbtn', { timeout: 120000 });
}

async function runScenario(chromium, label, saveGame) {
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    // 1) pierwsza nawigacja: tylko po to, żeby origin file:// istniał zanim piszemy do IDB.
    await waitMainMenuReady(page);
    await injectSaveAndSetLastPlayed(page, 'perftest', saveGame);
    // 2) reload: main.ts::refreshHasAnySaveSlotCache() na TYM boot cyklu znajdzie nasz slot
    // -> "Kontynuuj" w menu zbudowanym z hasSave()=true dostaje realny listener.
    await waitMainMenuReady(page);

    const continueBtn = page.locator('#cm-buttons button.mbtn', { hasText: 'Kontynuuj' });
    await continueBtn.waitFor({ state: 'visible', timeout: 30000 });
    const disabled = await continueBtn.getAttribute('disabled');
    if (disabled !== null) {
      throw new Error('"Kontynuuj" nadal disabled po reload -- injekcja zapisu nie została podchwycona przez cache hasAnySaveSlot');
    }
    await continueBtn.click();

    // Boot świata z zapisu (mapSnapshot -> BEZ regeneracji). UWAGA (złapane żywo w tej
    // rundzie, dwa ślepe zaułki po kolei): (a) sam toolbar `[data-act="cities"/"army"]`
    // istnieje w DOM JUŻ na ekranie menu głównego (dekoracyjna scena tła "hero" pod menu
    // montuje ten sam HUD) — jego OBECNOŚĆ jest fałszywie pozytywnym sygnałem gotowości;
    // (b) `.civ-menu` chowa się SYNCHRONICZNIE w `onContinue()` (main.ts, `hideMainMenu()`
    // na samym starcie handlera) -- WIELE MS przed faktycznym zakończeniem
    // `restoreGameFromSave`/`buildScene`, więc też nie jest wiarygodnym sygnałem "świat
    // gotowy". Jedyny sygnał, który naprawdę odpowiada REALNIE wczytanemu stanowi:
    // `window.__eraTestDebug.getWorldState()` (main.ts, hak zawsze obecny, patrz nagłówek
    // pliku) -- czekamy TWARDO na citiesLen równe liczbie miast z wstrzykniętego zapisu,
    // dokładnie jak era-change-toast-live-test.cjs czeka na citiesLen>0&&turn===1.
    const expectedCities = saveGame.cities.length;
    await page.waitForFunction(
      (n) => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen === n,
      expectedCities,
      { timeout: 120000, polling: 200 },
    );
    // Overlay „Wczytywanie zapisanej mapy" (ui/mapLoadingOverlay.ts) też musi zniknąć --
    // dopóki wisi, przechwytuje kliknięcia nad toolbarem (ten sam wzorzec co
    // era-change-toast-live-test.cjs czeka na zniknięcie „Tworzenie świata").
    await page.waitForFunction(
      () => !document.querySelector('.civ-map-load-overlay'),
      undefined, { timeout: 120000 },
    );
    await wait(1000); // osiadanie pierwszej klatki (kamera/scena, HUD rebuild) — poza pomiarem.

    const results = {};

    // (1) otwarcie listy miast.
    results.openCityList = await measureClickLatency(page, '[data-act="cities"]');
    await page.waitForSelector('.civ-city-list-hud.open .sl-item', { timeout: 30000 });

    // (2) otwarcie panelu KONKRETNEGO (pierwszego) miasta. `:first-of-type` -- w scenariuszu
    // WYSOKI jest ich 12, a page.click(selector)/querySelector w measureClickLatency wymaga
    // JEDNOZNACZNEGO selektora (Playwright strict mode rzuciłby na >1 dopasowanie).
    results.openCityPanel = await measureClickLatency(page, '.civ-city-list-hud.open .sl-item:first-of-type');
    await page.waitForFunction(() => {
      const f = document.querySelector('.civ-ux-frame');
      return !!f && (f.textContent || '').includes('Miasto1');
    }, undefined, { timeout: 30000 });

    // Powrót na mapę (Esc — closeCityPanelIfOpen), poza pomiarem.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.civ-ux-frame'), undefined, { timeout: 30000 });
    await wait(200);

    // (3) otwarcie listy armii.
    results.openArmyList = await measureClickLatency(page, '[data-act="army"]');
    await page.waitForSelector('.civ-army-list-hud.open .sl-item', { timeout: 30000 });

    // (4) przełączenie zaznaczonej jednostki (drugi wiersz, jeśli istnieje — inaczej pierwszy).
    const armyRowCount = await page.locator('.civ-army-list-hud.open .sl-item').count();
    const armySelector = armyRowCount > 1
      ? '.civ-army-list-hud.open .sl-item:nth-child(2)'
      : '.civ-army-list-hud.open .sl-item:nth-child(1)';
    results.selectUnit = await measureClickLatency(page, armySelector);

    console.log(`\n[${label}] miast gracza=${saveGame.cities.length} jednostek=${saveGame.units.length}`);
    for (const [k, v] of Object.entries(results)) {
      console.log(`  ${k}: ${v.toFixed(1)} ms`);
    }
    if (consoleErrors.length > 0) {
      console.log(`  [console errors: ${consoleErrors.length}]`, consoleErrors.slice(0, 5));
    }
    return { results, consoleErrors };
  } finally {
    await browser.close();
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[interaction-latency] playwright nie znaleziony. Uruchom z gra/ po npm install.');
    process.exit(1);
  }

  const M = buildFixtureBundle();
  const { low, high } = buildFixtures(M);
  buildBundle();

  const lowRun = await runScenario(chromium, 'NISKI (2 miasta)', low);
  const highRun = await runScenario(chromium, 'WYSOKI (12 miast)', high);

  console.log('\n=== PORÓWNANIE (2 miasta -> 12 miast) ===');
  let anyRegression = false;
  for (const key of Object.keys(lowRun.results)) {
    const a = lowRun.results[key];
    const b = highRun.results[key];
    const ratio = b / a;
    const flag = ratio >= 1.5 ? '  <== ROŚNIE Z LICZBĄ MIAST' : '';
    if (ratio >= 1.5) anyRegression = true;
    console.log(`  ${key}: ${a.toFixed(1)}ms -> ${b.toFixed(1)}ms (x${ratio.toFixed(2)})${flag}`);
  }
  console.log(anyRegression
    ? '\nWNIOSEK: co najmniej jedna interakcja rośnie >=1.5x między 2 a 12 miastami gracza -- hipoteza właściciela POTWIERDZONA żywo.'
    : '\nWNIOSEK: żadna z 4 mierzonych interakcji nie rośnie >=1.5x między 2 a 12 miastami gracza na tym HEAD -- hipoteza NIE potwierdzona w tym oknie pomiaru.');

  const allErrors = [...lowRun.consoleErrors, ...highRun.consoleErrors];
  if (allErrors.length > 0) {
    console.log(`\n[UWAGA] console/page errors zebrane w trakcie (${allErrors.length}):`);
    for (const e of allErrors.slice(0, 10)) console.log('  ' + e);
  }

  process.exitCode = 0;
}

main().catch((e) => {
  console.error('[interaction-latency] BŁĄD:', e);
  process.exitCode = 1;
});
