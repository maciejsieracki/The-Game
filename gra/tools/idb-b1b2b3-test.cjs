'use strict';
/**
 * idb-b1b2b3-test.cjs
 *
 * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Evaluator, runda 2 -- werdykt FAIL na
 * migracji zapisow na IndexedDB). Pokrywa trzy naprawy z tej rundy:
 *
 *   B1 -- brak straznika re-entrancy w ui/saveLoadDialog.ts::renderList()
 *         (dokladniej: renderListOnce() opakowane teraz przez renderList()).
 *         Dwa nakladajace sie wywolania (np. dwa szybkie kliknienia na rozne
 *         wiersze) osobno czyscily `list.innerHTML=''` PRZED swoim await i
 *         osobno DOPISYWALY wiersze PO await -- 3 zapisy dawaly 6 wierszy w
 *         UI (dowod Evaluatora). Naprawa: flaga `renderInFlight` + kolejka
 *         `renderQueued` -- nakladajace sie wywolanie NIE duplikuje pracy,
 *         tylko oznacza "jeszcze jeden przebieg" i wraca od razu; trwajacy
 *         render sam odpala doganiajacy przebieg na koncu.
 *
 *   B2 -- game/idb-storage.ts::openDb() cache'owal PORAZKE `indexedDB.open()`
 *         NA STALE (module-scoped `dbPromise` ustawiany raz i nigdy nie
 *         resetowany po odrzuceniu) -- jedna przejsciowa awaria (lock, quota)
 *         wylaczala zapis/odczyt IDB do konca zycia karty. Naprawa:
 *         cache'ujemy WYLACZNIE sukces; porazka czysci `dbPromise`, wiec
 *         nastepne wywolanie probuje otworzyc baze OD NOWA.
 *
 *   B3 -- (konsekwencja B2) gdy gra faktycznie czyta z legacy localStorage
 *         (bo IDB niedostepne), UI nie ostrzegalo gracza, ze widziane dane
 *         moga byc PRZESTARZALE (dowod Evaluatora: slot "Rzym" pokazuje ture
 *         200 zamiast 5). Naprawa: baner `.civ-sl-idbwarn` w dialogu "Wczytaj
 *         gre", widoczny dokladnie wtedy, gdy `isIdbAvailable()===false`.
 *
 * Metoda (wzorem idb-storage-migration-test.cjs / idb-menu-continue-boot-
 * refresh-test.cjs): esbuild bundluje NAPRAWDE zrodlo (bez mockowania logiki
 * pod testem -- tylko `indexedDB`/`localStorage`/DOM sa fakowane), jsdom
 * dostarcza `document`/`window` do prawdziwych document.createElement/
 * dispatchEvent. DWA OSOBNE bundle'e (patrz komentarz przy BUNDLE_MAIN/
 * BUNDLE_IDB nizej): B1+B3 potrzebuja pelnego stosu UI (saveLoadDialog.ts +
 * save.ts, ktory ciagnie za soba TAKZE fsa-autosave.ts), B2 testuje
 * idb-storage.ts W IZOLACJI -- inaczej pre-istniejacy, niezwiazany z tym
 * zadaniem eager-preload w fsa-autosave.ts (`preloadedIdbHandlePromise`,
 * wywolywany przy KAZDYM zaladowaniu modulu) zjadalby jeden z budzetowanych
 * `indexedDB.open()` w liczniku B2, zanim test zdazy cokolwiek zawolac.
 *
 * Usage (z gra/): node tools/idb-b1b2b3-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[idb-b1b2b3-test] jsdom missing -- npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');

// Dwa OSOBNE bundle'e, celowo:
//   BUNDLE_MAIN (B1 + B3) -- saveLoadDialog.ts + save.ts. Ciagnie za soba
//     TAKZE fsa-autosave.ts (import w saveLoadDialog.ts), ktory ma WLASNY,
//     PRE-ISTNIEJACY (niezwiazany z tym zadaniem) top-level eager odczyt IDB
//     przy KAZDYM zaladowaniu modulu (`preloadedIdbHandlePromise =
//     idbGetHandle()`, fsa-autosave.ts) -- wywoluje WLASNE `indexedDB.open()`
//     natychmiast po `require()`, ZANIM test zdazy cokolwiek zawolac.
//   BUNDLE_IDB (B2) -- WYLACZNIE idb-storage.ts, bez save.ts/UI/fsa-autosave.ts
//     -- zeby ten pre-istniejacy eager-preload NIE zjadal budzetu "failTimes"
//     licznika `_opens()` testu B2 (ktory MUSI precyzyjnie policzyc, ile razy
//     `indexedDB.open()` zostalo wywolane, zeby udowodnic retry).
const ENTRY_MAIN = path.resolve(__dirname, '.idb-b1b2b3-entry-main.ts');
const BUNDLE_MAIN = path.resolve(__dirname, '.idb-b1b2b3-bundle-main.cjs');
const ENTRY_IDB = path.resolve(__dirname, '.idb-b1b2b3-entry-idb.ts');
const BUNDLE_IDB = path.resolve(__dirname, '.idb-b1b2b3-bundle-idb.cjs');

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

fs.writeFileSync(
  ENTRY_MAIN,
  [
    "export { showLoadGameDialog, hideSaveLoadDialog, isSaveLoadDialogOpen } from '../src/ui/saveLoadDialog.ts';",
    "export { saveToLocal, isIdbAvailable, SAVE_PREFIX } from '../src/game/save.ts';",
    '',
  ].join('\n'),
  'utf8',
);
fs.writeFileSync(
  ENTRY_IDB,
  "export { idbSetItem, idbGetItem, idbIsAvailable } from '../src/game/idb-storage.ts';\n",
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_MAIN],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_MAIN,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
  esbuild.buildSync({
    entryPoints: [ENTRY_IDB],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_IDB,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[idb-b1b2b3-test] esbuild failed:', e.message || e);
  try { fs.unlinkSync(ENTRY_MAIN); } catch (_) { /* noop */ }
  try { fs.unlinkSync(ENTRY_IDB); } catch (_) { /* noop */ }
  process.exit(1);
}
fs.unlinkSync(ENTRY_MAIN);
fs.unlinkSync(ENTRY_IDB);

/** Swiezy require -- kazdy podtest, ktory potrzebuje wlasnego, nietknietego
 * `dbPromise` (idb-storage.ts module state), czysci require.cache. Bez tego
 * drugi i kolejne podtesty cicho czytalyby dbPromise z PIERWSZEGO scenariusza. */
function freshModule(bundlePath) {
  delete require.cache[require.resolve(bundlePath)];
  return require(bundlePath);
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// ---------------------------------------------------------------------------
// Fake IndexedDB (wzorzec z idb-storage-migration-test.cjs).
// ---------------------------------------------------------------------------
function makeFakeIndexedDB() {
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
    return {
      put(value, key) { store.set(key, value); return fakeReq(() => undefined); },
      get(key) { return fakeReq(() => store.get(key)); },
      delete(key) { store.delete(key); return fakeReq(() => undefined); },
      getAllKeys() { return fakeReq(() => Array.from(store.keys())); },
    };
  }
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore() { /* no-op -- wystarcza dla fsa-autosave.ts::openFsaIdb() */ },
    transaction() {
      const os = makeObjectStore();
      const tx = { objectStore: () => os, oncomplete: null, onerror: null, onabort: null, error: null };
      queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
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

/**
 * Fake IndexedDB, ktorej .open() PADA (onerror) przez pierwsze `failTimes`
 * wywolan, potem sukces na stale -- symulacja przejsciowej awarii (lock,
 * quota) z zadania B2. `_opens()` zwraca liczbe wywolan .open() -- dowod, czy
 * kod faktycznie PROBOWAL PONOWNIE, czy tylko przeczytal zapamietana porazke.
 */
function makeFlakyIndexedDB(failTimes) {
  let opens = 0;
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
    return {
      put(value, key) { store.set(key, value); return fakeReq(() => undefined); },
      get(key) { return fakeReq(() => store.get(key)); },
      delete(key) { store.delete(key); return fakeReq(() => undefined); },
      getAllKeys() { return fakeReq(() => Array.from(store.keys())); },
    };
  }
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore() { /* no-op -- wystarcza dla fsa-autosave.ts::openFsaIdb() */ },
    transaction() {
      const os = makeObjectStore();
      const tx = { objectStore: () => os, oncomplete: null, onerror: null, onabort: null, error: null };
      queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
      return tx;
    },
  };
  return {
    open() {
      opens += 1;
      const thisOpen = opens;
      const req = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, result: undefined };
      queueMicrotask(() => {
        if (thisOpen <= failTimes) {
          if (req.onerror) req.onerror();
        } else {
          req.result = db;
          if (req.onupgradeneeded) req.onupgradeneeded();
          if (req.onsuccess) req.onsuccess();
        }
      });
      return req;
    },
    _opens: () => opens,
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
  }, overrides || {});
}

(async () => {
  // jsdom -- wspolny dla calego pliku, dialogi sa zamykane (hideSaveLoadDialog)
  // miedzy scenariuszami zamiast tworzyc nowy dokument za kazdym razem.
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { url: 'https://example.test/' });
  global.window = dom.window;
  global.document = dom.window.document;
  // navigator: NIE nadpisujemy -- Node >=21 ma wlasny wbudowany global
  // `navigator` (tylko-do-odczytu getter, przypisanie rzuca TypeError).
  // Nie szkodzi: kod pod testem (escapeOverlayStack.ts) sprawdza WYLACZNIE
  // `navigator.keyboard`, ktorego wbudowany navigator Node i tak nie ma --
  // ten sam bezpieczny brak-wsparcia co jsdom's navigator bez Keyboard Lock API.
  global.HTMLElement = dom.window.HTMLElement;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  function click(el) {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  // =========================================================================
  // B1 -- strażnik re-entrancy w renderList() (saveLoadDialog.ts)
  // =========================================================================
  console.log('--- B1: strażnik re-entrancy w renderList() (saveLoadDialog.ts) ---');
  {
    global.indexedDB = makeFakeIndexedDB();
    const mod = freshModule(BUNDLE_MAIN);
    await mod.saveToLocal('slotA', fakeSave({ tura: 1, meta: { label: 'Rzym', savedAt: '2026-08-01T00:00:00.000Z' } }));
    await mod.saveToLocal('slotB', fakeSave({ tura: 2, meta: { label: 'Egipt', savedAt: '2026-08-02T00:00:00.000Z' } }));
    await mod.saveToLocal('slotC', fakeSave({ tura: 3, meta: { label: 'Grecja', savedAt: '2026-08-03T00:00:00.000Z' } }));

    await mod.showLoadGameDialog({ onLoad: () => {}, onCancel: () => {} });
    await sleep(30);

    const rowsInitial = [...document.querySelectorAll('.civ-sl-row')];
    ok(rowsInitial.length === 3, '(setup) po pierwszym renderze dokladnie 3 wiersze dla 3 zapisow (got ' + rowsInitial.length + ')');

    // Dwa SZYBKIE kliknięcia w tej samej synchronicznej paczce zdarzeń --
    // dokładnie scenariusz Evaluatora ("dwa szybkie kliknięcia") -- na DWA
    // RÓŻNE wiersze, każdy handler startuje WŁASNE, nakładające się
    // renderList() zanim pierwsze zdąży dopisać swoje wiersze.
    click(rowsInitial[0]);
    click(rowsInitial[1]);
    await sleep(60);

    const rowsAfter = [...document.querySelectorAll('.civ-sl-row')];
    ok(rowsAfter.length === 3, 'B1. NAPRAWA: po DWÓCH nakładających się kliknięciach wciąż dokładnie 3 wiersze, NIE 6 (dowód Evaluatora: bez strażnika 3 zapisy -> 6 wierszy) (got ' + rowsAfter.length + ')');

    // Kolejkowanie działa poprawnie (nie "pierwszy wygrywa"): dokładnie jeden
    // wiersz ma klasę "sel", i jest to wiersz OSTATNIEGO kliknięcia -- dowód,
    // że render dogania najnowszy stan zamiast go gubić.
    const selRows = [...document.querySelectorAll('.civ-sl-row.sel')];
    ok(selRows.length === 1, 'B1. dokładnie JEDEN wiersz ma klasę "sel" po dwóch kliknięciach (got ' + selRows.length + ')');
    const clickedSlotId = rowsInitial[1].dataset.slot;
    ok(
      !!selRows[0] && selRows[0].dataset.slot === clickedSlotId,
      'B1. zaznaczony wiersz to OSTATNIO kliknięty (kolejkowanie widzi najnowszy stan, nie "pierwszy wygrywa") (got ' + (selRows[0] && selRows[0].dataset.slot) + ', chcemy ' + clickedSlotId + ')',
    );

    mod.hideSaveLoadDialog();
    ok(mod.isSaveLoadDialogOpen() === false, '(sprzątanie) dialog zamknięty po hideSaveLoadDialog()');
    delete global.indexedDB;
  }

  // =========================================================================
  // B2 -- openDb() NIE cache'uje trwale porażki
  // =========================================================================
  console.log('');
  console.log("--- B2: openDb() NIE cache'uje trwale porażki -- retry po przejściowej awarii ---");
  {
    const flaky = makeFlakyIndexedDB(1); // pierwsze open() pada, kolejne -- sukces
    global.indexedDB = flaky;
    const mod = freshModule(BUNDLE_IDB);

    // Dwa wywołania CAŁKOWICIE WSPÓŁBIEŻNE (bez await między nimi, ta sama
    // synchroniczna paczka) -- oba trafiają na TĘ SAMĄ, w locie otwieraną
    // próbę (`dbPromise` w openDb()), która akurat pada. To odtwarza
    // realny przypadek: dwa wywołania idb-storage.ts nakładające się w
    // czasie jednej, feralnej próby otwarcia -- OBA muszą zobaczyć porażkę
    // (memoizacja W TRAKCIE otwierania musi zostać -- to NIE jest to, co B2
    // naprawia; B2 naprawia trzymanie porażki NA ZAWSZE PO jej rozstrzygnięciu).
    const availFirstPromise = mod.idbIsAvailable();
    const setFirstPromise = mod.idbSetItem('k1', 'v1').then(() => 'ok').catch(() => 'rejected');
    const [availFirst, setFirstResult] = await Promise.all([availFirstPromise, setFirstPromise]);
    ok(availFirst === false, '(setup) pierwsza próba otwarcia IDB PADA (symulacja przejściowej awarii) -> idbIsAvailable()===false');
    ok(setFirstResult === 'rejected', '(setup) idbSetItem WSPÓŁBIEŻNE z tą samą feralną próbą otwarcia -- też RZUCA (kontrakt idb-storage.ts)');
    ok(flaky._opens() === 1, '(setup) indexedDB.open() wywołane dokładnie raz jak dotąd (got ' + flaky._opens() + ')');

    // Wywołanie SEKWENCYJNE, PO rozstrzygnięciu poprzedniej (feralnej) próby,
    // ta sama instancja modułu (BEZ freshModule między wywołaniami) -- to
    // jest ISTOTA testu B2: przed naprawą `dbPromise` zostawał zapamiętany
    // jako "porażka" NA STAŁE, więc ta próba TEŻ by padła.
    const availSecond = await mod.idbIsAvailable();
    ok(availSecond === true, "B2. NAPRAWA: DRUGA próba (ta sama instancja modułu, PO przejściowej awarii) -> idbIsAvailable()===true -- porażka NIE została zapamiętana na stałe");
    ok(flaky._opens() === 2, 'B2. NAPRAWA: indexedDB.open() wywołane PONOWNIE (retry), nie zwrócono starej odrzuconej obietnicy (got opens=' + flaky._opens() + ')');

    let secondSetThrew = false;
    try { await mod.idbSetItem('k2', 'v2'); } catch { secondSetThrew = true; }
    ok(secondSetThrew === false, 'B2. NAPRAWA: idbSetItem PO retry działa normalnie (baza faktycznie otwarta)');
    ok((await mod.idbGetItem('k2')) === 'v2', 'zapisana po retry wartość jest odczytywalna (idbGetItem)');

    // Kontrola przeciwna: SUKCES zostaje w cache'u -- kolejne wywołanie NIE
    // odpala trzeciego open() (bez tego retry-co-wywołanie byłby "storm").
    await mod.idbIsAvailable();
    ok(flaky._opens() === 2, "(kontrola) SUKCES nadal cache'owany -- KOLEJNE wywołanie NIE odpala trzeciego open() (got opens=" + flaky._opens() + ')');

    delete global.indexedDB;
  }

  // =========================================================================
  // B3 -- baner ostrzegawczy, gdy gra czyta z legacy localStorage
  // =========================================================================
  console.log('');
  console.log('--- B3: baner ostrzegawczy w UI, gdy gra czyta z legacy localStorage (IDB niedostępne) ---');
  {
    // IndexedDB CAŁKOWICIE niedostępne (np. prywatna karta bez wsparcia) --
    // stary zapis leży WYŁĄCZNIE w legacy localStorage, pod tą samą nazwą
    // slotu co w dowodzie Evaluatora (Rzym, stara tura zamiast najnowszej).
    delete global.indexedDB;
    const localStorageStore = {};
    global.localStorage = {
      getItem: (k) => (k in localStorageStore ? localStorageStore[k] : null),
      setItem: (k, v) => { localStorageStore[k] = v; },
      removeItem: (k) => { delete localStorageStore[k]; },
      key: (i) => Object.keys(localStorageStore)[i] ?? null,
      get length() { return Object.keys(localStorageStore).length; },
    };
    const mod = freshModule(BUNDLE_MAIN);
    const staleSave = fakeSave({ tura: 200, meta: { label: 'Rzym', savedAt: '2020-01-01T00:00:00.000Z' } });
    localStorageStore[mod.SAVE_PREFIX + 'rzym'] = JSON.stringify(staleSave);

    ok((await mod.isIdbAvailable()) === false, '(setup) IndexedDB całkowicie niedostępne w tym scenariuszu -> isIdbAvailable()===false');

    await mod.showLoadGameDialog({ onLoad: () => {}, onCancel: () => {} });
    await sleep(30);

    const rows = [...document.querySelectorAll('.civ-sl-row')];
    ok(rows.length === 1, '(setup) mimo braku IDB, stary zapis z legacy localStorage nadal widoczny na liście (got ' + rows.length + ')');

    const warn = document.querySelector('.civ-sl-idbwarn');
    ok(!!warn, 'baner .civ-sl-idbwarn istnieje w DOM dialogu "Wczytaj grę"');
    ok(!!warn && warn.style.display === 'block', 'B3. NAPRAWA: baner WIDOCZNY (display=block), gdy gra czyta z legacy localStorage (IDB niedostępne) -- jawne ostrzeżenie zamiast cichego dryfu (got display=' + (warn && warn.style.display) + ')');
    ok(!!warn && (warn.textContent || '').length > 10, 'baner ma niepustą, czytelną treść ostrzeżenia');

    mod.hideSaveLoadDialog();
    delete global.localStorage;
  }

  console.log('');
  console.log('--- B3 (kontrola): baner UKRYTY, gdy IndexedDB działa normalnie ---');
  {
    global.indexedDB = makeFakeIndexedDB();
    const mod = freshModule(BUNDLE_MAIN);
    await mod.saveToLocal('slotX', fakeSave({ tura: 5, meta: { label: 'Kartagina', savedAt: '2026-08-05T00:00:00.000Z' } }));

    await mod.showLoadGameDialog({ onLoad: () => {}, onCancel: () => {} });
    await sleep(30);

    const warn = document.querySelector('.civ-sl-idbwarn');
    ok(!!warn, '(kontrola) baner istnieje w DOM również gdy IDB działa (element zawsze obecny, tylko ukryty)');
    ok(!!warn && warn.style.display === 'none', '(kontrola) baner UKRYTY (display=none), gdy IndexedDB działa normalnie -- brak fałszywego alarmu (got display=' + (warn && warn.style.display) + ')');

    mod.hideSaveLoadDialog();
    delete global.indexedDB;
  }

  console.log('');
  console.log('=== idb-b1b2b3-test: ' + pass + ' pass, ' + fail + ' fail ===');
  try { fs.unlinkSync(BUNDLE_MAIN); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_IDB); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('UNCAUGHT:', e);
  try { fs.unlinkSync(BUNDLE_MAIN); } catch (e2) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_IDB); } catch (e2) { /* ignore */ }
  process.exit(1);
});
