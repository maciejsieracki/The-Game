'use strict';
/**
 * idb-menu-continue-boot-refresh-test.cjs
 *
 * P-INDEXEDDB-MENU-KONTYNUUJ-MARTWE (Evaluator, 2026-08-12) — KRYTYCZNA regresja na
 * już WDROŻONYM bundlu ROBOCZA: po migracji zapisów na IndexedDB przyciski
 * "Kontynuuj"/"Wczytaj grę" w menu startowym są ZAWSZE wyszarzone/martwe, nawet gdy
 * zapisy istnieją.
 *
 * PRZYCZYNA: main.ts wołał `void refreshHasAnySaveSlotCache();` (fire-and-forget,
 * async odczyt IndexedDB) i `openStartupMainMenu()` w TYM SAMYM synchronicznym ticku
 * bootu — odczyt IDB nie mógł się rozwiązać przed pierwszym renderem menu.
 * `mainMenu.build()` czyta `cfg.hasSave()` RAZ przy budowie i zawsze widzi
 * `cachedHasAnySaveSlot === false`. `btn()` w mainMenu.ts (src/ui/mainMenu.ts) w ogóle
 * NIE PODPINA handlera kliknięcia, gdy `enabled=false` przy budowie — przycisk jest
 * REALNIE martwy (nie tylko wizualnie wyszarzony), a menu zbudowane raz się samo nie
 * naprawia.
 *
 * NAPRAWA F1 (main.ts, ~linia 28624): `void refreshHasAnySaveSlotCache();` zamienione
 * na `.then(() => { if (isMainMenuOpen()) showMainMenu(); refreshGamePauseMenuLoadState(); })`
 * — gdy cache się rozwiąże, menu startowe (jeśli gracz wciąż na nim stoi) przebudowuje
 * się i czyta świeżą wartość cache'a; menu pauzy (jeśli akurat otwarte — rzadki wyścig
 * przy trybach playtest z auto-startem gry) dostaje odświeżony stan przycisku "Wczytaj
 * grę" bez pełnej przebudowy (refreshGamePauseMenuLoadState() jest no-op, gdy menu
 * pauzy zamknięte).
 *
 * NAPRAWA F2 (game/save.ts::saveToLocal, catch bloku zapisu meta): po nieudanym
 * zapisie nagłówka (meta) do IndexedDB, kod czyścił WYŁĄCZNIE klucz meta w IDB —
 * zostawiając stary klucz `thegame.savemeta.<slot>` w legacy localStorage nietknięty.
 * loadSaveSlotMeta() spada na ten stary wpis (IDB puste -> fallback na localStorage),
 * więc dialog "Wczytaj grę" pokazywał STARĄ etykietę/turę dla NOWSZEGO zapisu (treść
 * samego zapisu w IDB jest poprawna, tylko wyświetlane metadane są przestarzałe).
 * Naprawa: catch czyści RÓWNIEŻ legacy klucz localStorage (ten sam wzorzec co
 * deleteLocal() w tym samym pliku).
 *
 * Ten test pokrywa trzy warstwy:
 *   A. main.ts (strukturalnie, regex po stripLineComments — main.ts jest jedną
 *      wielką funkcją, nie da się jej zbundlować/uruchomić bez ciężkich stubów całej
 *      gry, wzorem load-fail-toast-zindex-test.cjs): dokładne miejsce i kształt
 *      naprawy F1, PLUS regresyjny strażnik na sąsiednie wywołanie
 *      refreshHasAnySaveSlotCache() wewnątrz hasAnySaveSlot() (musi ZOSTAĆ bez
 *      `.then(...)` — inaczej każdy render menu wywołujący hasSave() odpalałby
 *      kolejną przebudowę menu, w nieskończoność).
 *   B. mainMenu.ts NAPRAWDĘ zbundlowany (esbuild + jsdom, wzorem
 *      army-merge-dismiss-bounce-test.cjs / side-panel-unit-cycle-arrows-test.cjs):
 *      wykonywalny dowód, że (1) budowa z hasSave()=false daje disabled=true I klik
 *      fizycznie nic nie robi (brak podpiętego handlera — nie tylko atrybut), (2)
 *      rebuild przez showMainMenu() po "rozwiązaniu cache" daje disabled=false I klik
 *      NAPRAWDĘ woła callback, (3) rebuild nie duplikuje DOM/nie tworzy dwóch
 *      przycisków "Kontynuuj".
 *   C. game/save.ts NAPRAWDĘ zbundlowany (esbuild + fake IndexedDB, wzorem
 *      idb-storage-migration-test.cjs): wykonywalny dowód na F2 — porażka zapisu meta
 *      do IDB przy ISTNIEJĄCYM starym wpisie w legacy localStorage NIE prowadzi do
 *      "zmartwychwstania" starych danych w loadSaveSlotMeta().
 *
 * Usage (z gra/): node tools/idb-menu-continue-boot-refresh-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[idb-menu-continue-boot-refresh-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass++;
    console.log('  OK: ' + label);
  } else {
    fail++;
    console.log('  FAIL: ' + label);
  }
}

/** Usuwa komentarze `// ...` (do końca linii) -- wzorem load-fail-toast-zindex-test.cjs:
 *  komentarze PL+EN w main.ts cytują słownie nazwy wywołań w prozie, co fałszywie
 *  zaliczyłoby się jako obecność/kolejność realnego kodu. */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

// ===========================================================================
// A. main.ts -- asercje strukturalne (regex) na dokładne miejsce naprawy F1.
// ===========================================================================
console.log('--- A. main.ts: przebudowa naprawy F1 (boot -> cache -> menu) ---');
{
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

  ok(
    /import\s*\{[^}]*\bisMainMenuOpen\b[^}]*\}\s*from\s*'\.\/ui\/mainMenu';/.test(mainSrc),
    "main.ts importuje isMainMenuOpen z './ui/mainMenu'",
  );
  ok(
    /import\s*\{[^}]*\bshowMainMenu\b[^}]*\}\s*from\s*'\.\/ui\/mainMenu';/.test(mainSrc),
    "main.ts importuje showMainMenu z './ui/mainMenu'",
  );
  ok(
    /import\s*\{[^}]*\brefreshGamePauseMenuLoadState\b[^}]*\}\s*from\s*'\.\/ui\/gamePauseMenu';/.test(mainSrc),
    "main.ts importuje refreshGamePauseMenuLoadState z './ui/gamePauseMenu'",
  );

  // Miejsce naprawy: pierwsze wypełnienie cache'a przy boocie, unikalna kotwica
  // (persist() best-effort tuż przed nim) do końca -- najbliższy `if (demoUlepszeniaUrl)`.
  const anchorStart = "try { void navigator.storage?.persist?.(); } catch { /* ignore -- best-effort */ }";
  const startIdx = mainSrc.indexOf(anchorStart);
  ok(startIdx >= 0, 'znaleziono kotwicę startową (navigator.storage.persist best-effort, tuż przed cache boota)');

  const anchorEnd = 'if (demoUlepszeniaUrl) {';
  const endIdx = startIdx >= 0 ? mainSrc.indexOf(anchorEnd, startIdx) : -1;
  ok(endIdx > startIdx, 'znaleziono kotwicę końcową (if (demoUlepszeniaUrl) {) po kotwicy startowej');

  const bootRegionRaw = startIdx >= 0 && endIdx > startIdx ? mainSrc.slice(startIdx, endIdx) : '';
  const bootRegion = stripLineComments(bootRegionRaw);

  // Dokładnie JEDNO wystąpienie refreshHasAnySaveSlotCache w tym regionie (miejsce
  // naprawy F1) -- jeśli region kiedyś urośnie o drugie, marker ma przestać być
  // jednoznaczny zamiast po cichu dopasować się do złego.
  const occurrences = (bootRegion.match(/refreshHasAnySaveSlotCache/g) || []).length;
  ok(occurrences === 1, 'region boota zawiera refreshHasAnySaveSlotCache DOKŁADNIE raz (got ' + occurrences + ')');

  ok(
    /void\s+refreshHasAnySaveSlotCache\(\)\s*\.\s*then\s*\(\s*\(\s*\)\s*=>\s*\{/.test(bootRegion),
    "F1: `void refreshHasAnySaveSlotCache().then(() => {` -- NIE fire-and-forget goły, callback po rozwiązaniu cache'a",
  );
  ok(
    /if\s*\(\s*isMainMenuOpen\(\)\s*\)\s*showMainMenu\(\)\s*;/.test(bootRegion),
    'F1: wewnątrz .then(...) jest `if (isMainMenuOpen()) showMainMenu();` -- przebudowa TYLKO gdy gracz wciąż na menu',
  );
  ok(
    /refreshGamePauseMenuLoadState\(\)\s*;/.test(bootRegion),
    'F1: wewnątrz .then(...) jest wywołanie refreshGamePauseMenuLoadState() -- pkt 1b, analogiczna naprawa menu pauzy',
  );

  // Regresyjny strażnik: DRUGIE (odrębne) wywołanie refreshHasAnySaveSlotCache -- to
  // wewnątrz hasAnySaveSlot() (stale-while-revalidate, main.ts ~linia 16815) -- MUSI
  // zostać bez .then(...). Ono jest wołane przy KAŻDYM renderze menu (cfg.hasSave()),
  // więc gdyby też przebudowywało menu w .then(...), powstałaby nieskończona pętla
  // przebudowy (build() -> hasSave() -> refresh().then(rebuild) -> build() -> ...).
  const hasAnySaveSlotFnMarker = 'function hasAnySaveSlot(): boolean {';
  const hasAnySaveSlotStart = mainSrc.indexOf(hasAnySaveSlotFnMarker);
  ok(hasAnySaveSlotStart >= 0, 'znaleziono function hasAnySaveSlot(): boolean {');
  const hasAnySaveSlotEnd = hasAnySaveSlotStart >= 0
    ? mainSrc.indexOf('}', mainSrc.indexOf('return cachedHasAnySaveSlot;', hasAnySaveSlotStart))
    : -1;
  const hasAnySaveSlotBody = hasAnySaveSlotStart >= 0 && hasAnySaveSlotEnd > hasAnySaveSlotStart
    ? stripLineComments(mainSrc.slice(hasAnySaveSlotStart, hasAnySaveSlotEnd + 1))
    : '';
  ok(
    /void\s+refreshHasAnySaveSlotCache\(\)\s*;/.test(hasAnySaveSlotBody),
    'hasAnySaveSlot(): `void refreshHasAnySaveSlotCache();` gołe (bez .then) -- stale-while-revalidate na KAŻDYM odczycie',
  );
  ok(
    !/refreshHasAnySaveSlotCache\(\)\s*\.\s*then/.test(hasAnySaveSlotBody),
    'REGRESJA-STRAŻNIK: hasAnySaveSlot() NIE ma .then(...) doczepionego do refreshHasAnySaveSlotCache() '
    + '-- gdyby ktoś "naprawił" i to miejsce tym samym wzorcem co F1, każdy render menu '
    + '(cfg.hasSave() w mainMenu.build()) odpaliłby kolejną przebudowę menu -> pętla',
  );
}

// ===========================================================================
// B. mainMenu.ts NAPRAWDĘ zbundlowany -- wykonywalny dowód mechanizmu naprawy F1.
// ===========================================================================
const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_BRAND_ASSETS = path.resolve(STUB_DIR, 'idb-menu-continue-brandAssets-stub.ts');
const STUB_BRAND_TOKENS = path.resolve(STUB_DIR, 'idb-menu-continue-brandTokenVars-stub.ts');
const STUB_HERO_URL = path.resolve(STUB_DIR, 'idb-menu-continue-hero-url-stub.ts');
const MENU_ENTRY = path.resolve(__dirname, '.idb-menu-continue-entry.ts');
const MENU_BUNDLE = path.resolve(__dirname, '.idb-menu-continue-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
// icons/brandAssets.ts robi Vite-owe `import X from '*.svg?raw'` + `import.meta.glob(...)`
// -- esbuild w trybie node/cjs tego nie obsługuje (wzorem army-merge-dismiss-bounce-test.cjs /
// side-panel-unit-cycle-arrows-test.cjs); treść ikon jest tu bez znaczenia (test nie
// asercjonuje wyglądu, tylko disabled/handler kliknięcia).
fs.writeFileSync(STUB_BRAND_ASSETS, [
  "export function brandMenuEmblemSvg() { return ''; }",
  "export const brandMenuBackgroundCss = '';",
  "export const brandMenuComponentsCss = '';",
  "export const brandMotionCss = '';",
  "export function menuIconSvg(_id, _size) { return ''; }",
  '',
].join('\n'), 'utf8');
fs.writeFileSync(STUB_BRAND_TOKENS, [
  'export function ensureBrandRootTokens() {}',
  "export const CIV_BRAND_SCOPE_VARS = '';",
  '',
].join('\n'), 'utf8');
// heroMenuUrl from './assets/hero/hero-menu.png?url' -- Vite url-import, esbuild/node nie
// zna sufiksu ?url; treść bez znaczenia dla tego testu (nigdy nie asercjonujemy <img src>).
fs.writeFileSync(STUB_HERO_URL, "export default '';\n", 'utf8');

fs.writeFileSync(
  MENU_ENTRY,
  "export { showMainMenu, hideMainMenu, isMainMenuOpen } from '../src/ui/mainMenu.ts';\n",
  'utf8',
);

const stubMenuPlugin = {
  name: 'stub-idb-menu-continue',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_BRAND_ASSETS }));
    build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: STUB_BRAND_TOKENS }));
    build.onResolve({ filter: /hero-menu\.png\?url$/ }, () => ({ path: STUB_HERO_URL }));
  },
};

async function runMenuBundleSection() {
  console.log('');
  console.log("--- B. ui/mainMenu.ts (zbundlowany naprawdę): stale -> rebuild -> aktywny przycisk ---");
  try {
    await esbuild.build({
      entryPoints: [MENU_ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: MENU_BUNDLE,
      absWorkingDir: GRA,
      plugins: [stubMenuPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[idb-menu-continue-boot-refresh-test] esbuild (mainMenu) failed:', e.message || e);
    fail++;
    return;
  }

  const { showMainMenu, hideMainMenu, isMainMenuOpen } = require(MENU_BUNDLE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;
  global.MouseEvent = dom.window.MouseEvent;

  function click(el) {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  // Odtwarza dokładnie main.ts::cachedHasAnySaveSlot -- mutowalna zmienna zamknięta w
  // closure, przekazywana jako cfg.hasSave (żywa referencja, czytana NA NOWO przy
  // każdym build()) -- dokładnie ten sam kształt co main.ts (patrz sekcja A).
  let cachedHasAnySaveSlot = false;
  const continueClicks = [];
  const loadClicks = [];

  showMainMenu({
    hasSave: () => cachedHasAnySaveSlot,
    onContinue: () => continueClicks.push(1),
    onLoad: () => loadClicks.push(1),
  });

  ok(isMainMenuOpen() === true, 'B1. isMainMenuOpen() === true zaraz po showMainMenu()');

  // --- Przed rozwiązaniem cache'a (odpowiednik chwili boota, PRZED .then()) ---
  {
    const continueBtn = [...document.querySelectorAll('.mbtn')].find(
      (b) => b.textContent.includes('Kontynuuj'),
    );
    ok(!!continueBtn, 'B2. przycisk "Kontynuuj" istnieje w DOM po pierwszej budowie');
    ok(continueBtn.disabled === true, 'B3. hasSave()=false -> "Kontynuuj" disabled=true (bug: to jest stan, w którym menu utyka BEZ naprawy F1)');

    continueClicks.length = 0;
    click(continueBtn);
    ok(continueClicks.length === 0, 'B4. klik (dispatchEvent) na disabled "Kontynuuj" NIC nie robi -- btn() w mainMenu.ts nie podpina handlera, gdy enabled=false (nie tylko atrybut disabled)');

    // "Wczytaj grę" jest w panelu "Więcej" -- trzeba go otworzyć, żeby dotrzeć do DOM.
    const moreToggle = [...document.querySelectorAll('.mbtn')].find((b) => b.textContent.includes('Więcej'));
    ok(!!moreToggle, 'B5. przycisk "Więcej" istnieje');
    click(moreToggle);
    const loadBtn = [...document.querySelectorAll('.more-panel .mbtn')].find(
      (b) => b.textContent.includes('Wczytaj grę'),
    );
    ok(!!loadBtn, 'B6. przycisk "Wczytaj grę" istnieje w panelu "Więcej"');
    ok(loadBtn.disabled === true, 'B7. hasSave()=false -> "Wczytaj grę" disabled=true');
    loadClicks.length = 0;
    click(loadBtn);
    ok(loadClicks.length === 0, 'B8. klik na disabled "Wczytaj grę" NIC nie robi (handler nie podpięty)');
  }

  // --- Symulacja naprawy F1: cache się rozwiązał (IndexedDB odpowiedział), gracz
  //     WCIĄŻ jest na menu (isMainMenuOpen() === true) -> przebudowa przez showMainMenu(). ---
  cachedHasAnySaveSlot = true;
  ok(isMainMenuOpen() === true, 'B9. (kontrola) menu wciąż otwarte tuż przed przebudową -- odpowiednik `if (isMainMenuOpen())` z main.ts');
  showMainMenu();

  {
    const continueBtnCountAfterRebuild = document.querySelectorAll('.mbtn').length;
    const continueBtns = [...document.querySelectorAll('.mbtn')].filter(
      (b) => b.textContent.includes('Kontynuuj'),
    );
    ok(continueBtns.length === 1, 'B10. po przebudowie DOKŁADNIE JEDEN przycisk "Kontynuuj" w DOM -- rebuild NIE duplikuje (rootEl.innerHTML="" przed każdym build())');

    const continueBtn = continueBtns[0];
    ok(continueBtn.disabled === false, 'B11. NAPRAWA: po przebudowie z hasSave()=true, "Kontynuuj" disabled=false');

    continueClicks.length = 0;
    click(continueBtn);
    ok(continueClicks.length === 1, 'B12. NAPRAWA: klik na aktywny "Kontynuuj" NAPRAWDĘ woła onContinue() (handler podpięty przy budowie z enabled=true)');

    const moreToggle = [...document.querySelectorAll('.mbtn')].find((b) => b.textContent.includes('Więcej'));
    click(moreToggle);
    const loadBtn = [...document.querySelectorAll('.more-panel .mbtn')].find(
      (b) => b.textContent.includes('Wczytaj grę'),
    );
    ok(loadBtn.disabled === false, 'B13. NAPRAWA: po przebudowie "Wczytaj grę" disabled=false');
    loadClicks.length = 0;
    click(loadBtn);
    ok(loadClicks.length === 1, 'B14. NAPRAWA: klik na aktywny "Wczytaj grę" NAPRAWDĘ woła onLoad()');

    ok(continueBtnCountAfterRebuild > 0, 'B15. (sanity) DOM po przebudowie nadal ma przyciski (menu nie zniknęło)');
  }

  // --- Kontrola przeciwna do guarda main.ts: gdy menu jest ZAMKNIĘTE (gracz zdążył
  //     kliknąć coś innego), isMainMenuOpen()===false -- main.ts wtedy NIE woła
  //     showMainMenu() w .then(...) (patrz sekcja A), więc menu nie "wskrzesza się"
  //     samo z siebie w tle. Tu sprawdzamy samą semantykę isMainMenuOpen(), którą ten
  //     guard w main.ts wykorzystuje. ---
  hideMainMenu();
  ok(isMainMenuOpen() === false, 'B16. hideMainMenu() -> isMainMenuOpen()===false -- dokładnie warunek, który w main.ts blokuje niechcianą przebudowę po zamknięciu menu');

  try { fs.unlinkSync(MENU_ENTRY); } catch (_) { /* noop */ }
}

// ===========================================================================
// C. game/save.ts NAPRAWDĘ zbundlowany -- wykonywalny dowód mechanizmu naprawy F2.
// ===========================================================================
const SAVE_ENTRY = path.resolve(__dirname, '.idb-menu-continue-save-entry.ts');
const SAVE_BUNDLE = path.resolve(__dirname, '.idb-menu-continue-save-bundle.cjs');

fs.writeFileSync(
  SAVE_ENTRY,
  "export { saveToLocal, loadSaveSlotMeta, serializeGame, SAVE_PREFIX, SAVE_META_PREFIX } from '../src/game/save.ts';\n",
  'utf8',
);

/**
 * Fake IndexedDB minimalny (podzbiór idb-storage.ts) -- ten sam kształt co
 * makeFakeIndexedDB w idb-storage-migration-test.cjs, skopiowany celowo (P-BRAMKA-
 * STUB-KOLIZJA-WSPOLDZIELONY: każda bramka trzyma własny harness, nie dzieli
 * mutowalnego stanu z innymi plikami testowymi).
 *
 * @param opts.putError (key, value) => Error|null -- gdy zwróci błąd, TEN KONKRETNY
 *   `put` odrzuca całą transakcję (symulacja: zapis meta pada, zapis głównego zapisu
 *   przechodzi -- rozróżniane po prefiksie klucza).
 */
function makeFakeIndexedDB(opts) {
  opts = opts || {};
  const store = new Map();
  const fakeReq = (getResult) => {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      req.result = getResult();
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  };
  function makeObjectStore() {
    let pendingError = null;
    return {
      put(value, key) {
        const err = opts.putError ? opts.putError(key, value) : null;
        if (err) { pendingError = err; return fakeReq(() => undefined); }
        store.set(key, value);
        return fakeReq(() => undefined);
      },
      get(key) { return fakeReq(() => store.get(key)); },
      delete(key) { store.delete(key); return fakeReq(() => undefined); },
      getAllKeys() { return fakeReq(() => Array.from(store.keys())); },
      _takePendingError() { const e = pendingError; pendingError = null; return e; },
    };
  }
  const db = {
    objectStoreNames: { contains: () => true },
    transaction(_name, _mode) {
      const os = makeObjectStore();
      const tx = { objectStore: () => os, oncomplete: null, onerror: null, onabort: null, error: null };
      tx.objectStore = () => os;
      queueMicrotask(() => {
        const err = os._takePendingError();
        if (err) {
          tx.error = err;
          if (tx.onabort) tx.onabort();
        } else if (tx.oncomplete) {
          tx.oncomplete();
        }
      });
      return tx;
    },
  };
  return {
    open() {
      const req = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, result: db };
      queueMicrotask(() => {
        if (req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
    _store: store,
  };
}

function fakeSave(overrides) {
  return Object.assign({
    wersja: 2,
    tura: 3,
    seed: 42,
    units: [],
    cities: [],
    explored: [],
    meta: { label: 'test', savedAt: '2026-08-11T10:00:00.000Z' },
  }, overrides);
}

async function runSaveBundleSection() {
  console.log('');
  console.log('--- C. game/save.ts (zbundlowany naprawdę): meta IDB porażka + stary localStorage NIE zmartwychwstaje ---');
  try {
    esbuild.buildSync({
      entryPoints: [SAVE_ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: SAVE_BUNDLE,
      absWorkingDir: GRA,
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[idb-menu-continue-boot-refresh-test] esbuild (save.ts) failed:', e.message || e);
    fail++;
    return;
  }

  const { saveToLocal, loadSaveSlotMeta, serializeGame, SAVE_META_PREFIX } = require(SAVE_BUNDLE);

  const slot = 'ghostMetaSlot';
  const localStorageStore = {};
  // Stary wpis meta sprzed migracji IDB, wciąż leżący w legacy localStorage pod TYM
  // SAMYM kluczem, którego IDB też używa -- dokładnie scenariusz z nagłówka pliku.
  const staleMeta = { label: 'STARA etykieta', tura: 1, savedAt: '2020-01-01T00:00:00.000Z' };
  localStorageStore[SAVE_META_PREFIX + slot] = JSON.stringify(staleMeta);

  global.localStorage = {
    getItem: (k) => (k in localStorageStore ? localStorageStore[k] : null),
    setItem: (k, v) => { localStorageStore[k] = v; },
    removeItem: (k) => { delete localStorageStore[k]; },
    key: (i) => Object.keys(localStorageStore)[i] ?? null,
    get length() { return Object.keys(localStorageStore).length; },
  };
  // Zapis GŁÓWNY (SAVE_PREFIX) przechodzi; zapis META (SAVE_META_PREFIX) pada -- to
  // odtwarza dokładnie gałąź catch w saveToLocal(), którą naprawia F2.
  global.indexedDB = makeFakeIndexedDB({
    putError: (key) => (typeof key === 'string' && key.startsWith(SAVE_META_PREFIX) ? new Error('meta write boom') : null),
  });

  const res = await saveToLocal(slot, fakeSave({ tura: 42, meta: { label: 'NOWA etykieta', savedAt: '2026-08-12T09:00:00.000Z' } }));
  ok(res.ok === true, 'C1. saveToLocal zwraca ok:true mimo porażki zapisu meta (główny zapis przeszedł, meta jest best-effort)');

  ok(global.localStorage.getItem(SAVE_META_PREFIX + slot) === null, 'C2. NAPRAWA F2: catch po porażce IDB czyści RÓWNIEŻ stary klucz meta w legacy localStorage (nie tylko IDB)');

  const meta = await loadSaveSlotMeta(slot);
  ok(meta === null, 'C3. NAPRAWA F2: loadSaveSlotMeta() zwraca null (brak klucza w OBU backendach) -- NIE "zmartwychwstałą" STARĄ etykietę/turę z legacy localStorage');
  ok(
    !(meta && meta.label === 'STARA etykieta'),
    'C4. (kontrola negatywna, jawnie) meta.label NIGDY nie jest starą wartością "STARA etykieta" -- dokładnie ten symptom zgłoszony w P-INDEXEDDB-MENU-KONTYNUUJ-MARTWE',
  );

  delete global.indexedDB;
  delete global.localStorage;
  try { fs.unlinkSync(SAVE_ENTRY); } catch (_) { /* noop */ }
}

(async () => {
  await runMenuBundleSection();
  await runSaveBundleSection();

  console.log('');
  console.log(`=== idb-menu-continue-boot-refresh-test: ${pass} pass, ${fail} fail ===`);

  for (const f of [MENU_BUNDLE, SAVE_BUNDLE, STUB_BRAND_ASSETS, STUB_BRAND_TOKENS, STUB_HERO_URL]) {
    try { fs.unlinkSync(f); } catch (_) { /* noop */ }
  }

  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('UNCAUGHT:', e);
  process.exit(1);
});
