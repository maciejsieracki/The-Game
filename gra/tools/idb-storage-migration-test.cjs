'use strict';
/**
 * idb-storage-migration-test.cjs
 *
 * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Maciej, decyzja właściciela): pełna
 * migracja magazynu zapisów (w tym mapSnapshot) z localStorage na
 * IndexedDB + navigator.storage.persist(). Ten test pokrywa dwie warstwy:
 *
 *   1. src/game/idb-storage.ts (cienki Promise-based wrapper) w izolacji --
 *      roundtrip set/get/remove/listKeys + kontrakt niedostępności
 *      (idbGetItem/idbListKeys ciche, idbSetItem rzuca, idbRemoveItem ciche).
 *   2. src/game/save.ts::saveToLocal/loadFromLocal/listSaves/deleteLocal/
 *      loadSaveSlotMeta -- integracja z prawdziwym kodem: NOWE zapisy idą
 *      WYŁĄCZNIE do IndexedDB (localStorage pozostaje nietknięty), a ODCZYT
 *      sprawdza IndexedDB i spada na localStorage TYLKO gdy IDB nie ma
 *      klucza (wsteczna zgodność dla zapisów sprzed migracji).
 *
 * `fake-indexeddb` NIE jest w package.json (sprawdzone) -- zamiast dodawać
 * zależność npm, ten plik implementuje ręczny, minimalny fake IndexedDB,
 * pokrywający WYŁĄCZNIE API, którego realnie używa idb-storage.ts:
 * indexedDB.open (z onupgradeneeded/onsuccess/onerror), db.transaction,
 * objectStore.{get,put,delete,getAllKeys}. Brak kursorów/indeksów/wielu
 * object store'ów -- YAGNI, idb-storage.ts ich nie używa.
 *
 * UWAGA ARCHITEKTONICZNA (ważna dla czytania testów niżej): idb-storage.ts
 * memoizuje połączenie do bazy w module-scoped `dbPromise` -- raz otwarta
 * (lub raz "niedostępna"), zostaje tak na całe życie tej instancji modułu.
 * Kiedy kolejny podtest musi zobaczyć INNY global.indexedDB (inna fake baza,
 * albo jego brak), require.cache dla zbundlowanego modułu jest czyszczony,
 * żeby `dbPromise` wystartował od zera -- patrz freshModule() niżej. Bez
 * tego drugi i kolejne podtesty cicho czytałyby/pisały do PIERWSZEJ
 * zamockowanej bazy, ignorując swój własny mock.
 *
 * Usage (z gra/): node tools/idb-storage-migration-test.cjs
 */

const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.idb-storage-migration-entry.ts');
const BUNDLE = path.join(__dirname, '.idb-storage-migration-bundle.cjs');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

fs.writeFileSync(
  ENTRY,
  [
    "export { idbGetItem, idbSetItem, idbRemoveItem, idbListKeys } from '../src/game/idb-storage.ts';",
    "export { saveToLocal, loadFromLocal, listSaves, deleteLocal, loadSaveSlotMeta, SAVE_PREFIX, serializeGame, deserializeGame, SAVE_VERSION } from '../src/game/save.ts';",
    '',
  ].join('\n'),
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: GRA_DIR,
  logLevel: 'silent',
});
fs.unlinkSync(ENTRY);

/** Świeży require -- patrz "UWAGA ARCHITEKTONICZNA" w nagłówku pliku. */
function freshModule() {
  delete require.cache[require.resolve(BUNDLE)];
  return require(BUNDLE);
}

// ---------------------------------------------------------------------------
// Fake IndexedDB -- minimalny, pokrywa wyłącznie API użyte przez idb-storage.ts.
// ---------------------------------------------------------------------------

/**
 * @param opts.putError  (key, value) => Error|null -- gdy zwróci błąd, ten
 *   konkretny `put` odrzuca całą transakcję (symulacja quota/inny błąd).
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
      const realObjectStore = () => os;
      tx.objectStore = realObjectStore;
      // Owijamy .put, żeby transakcja mogła sprawdzić błąd PO synchronicznym
      // wywołaniu (patrz kolejność w idb-storage.ts: put() -> przypisanie
      // oncomplete/onerror/onabort -> mikrotaska poniżej).
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

function withMockEnv({ idb, localStorageStore }, fn) {
  const fakeIdb = idb === undefined ? makeFakeIndexedDB() : idb;
  if (fakeIdb !== null) global.indexedDB = fakeIdb;
  if (localStorageStore !== undefined) {
    global.localStorage = {
      getItem: (k) => (k in localStorageStore ? localStorageStore[k] : null),
      setItem: (k, v) => { localStorageStore[k] = v; },
      removeItem: (k) => { delete localStorageStore[k]; },
      key: (i) => Object.keys(localStorageStore)[i] ?? null,
      get length() { return Object.keys(localStorageStore).length; },
    };
  }
  const mod = freshModule();
  return Promise.resolve(fn(mod, fakeIdb)).finally(() => {
    delete global.indexedDB;
    delete global.localStorage;
  });
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

(async () => {
  // -------------------------------------------------------------------------
  // 1. idb-storage.ts w izolacji.
  // -------------------------------------------------------------------------
  console.log('--- 1. idb-storage.ts: roundtrip set/get/remove/listKeys ---');

  await withMockEnv({}, async ({ idbGetItem, idbSetItem, idbRemoveItem, idbListKeys }) => {
    assert((await idbGetItem('nope')) === null, '1a. idbGetItem klucza, ktorego nie ma -> null');

    await idbSetItem('k1', 'v1');
    assert((await idbGetItem('k1')) === 'v1', '1b. idbSetItem -> idbGetItem zwraca zapisana wartosc');

    await idbSetItem('k2', 'v2');
    const keys = (await idbListKeys()).sort();
    assert(JSON.stringify(keys) === JSON.stringify(['k1', 'k2']), '1c. idbListKeys zwraca wszystkie zapisane klucze (got ' + JSON.stringify(keys) + ')');

    await idbRemoveItem('k1');
    assert((await idbGetItem('k1')) === null, '1d. idbRemoveItem usuwa klucz -> idbGetItem znow null');
    assert((await idbListKeys()).length === 1, '1e. idbListKeys po usunieciu k1 ma dlugosc 1');

    await idbSetItem('k2', 'v2-nadpisane');
    assert((await idbGetItem('k2')) === 'v2-nadpisane', '1f. idbSetItem na istniejacym kluczu nadpisuje wartosc');
  });

  console.log('');
  console.log('--- 2. idb-storage.ts: guard niedostepnosci IndexedDB (cicha porazka odczytow) ---');

  await withMockEnv({ idb: null }, async ({ idbGetItem, idbSetItem, idbRemoveItem, idbListKeys }) => {
    assert((await idbGetItem('any')) === null, '2a. bez indexedDB: idbGetItem -> null (cicho, bez wyjatku)');
    assert(JSON.stringify(await idbListKeys()) === '[]', '2b. bez indexedDB: idbListKeys -> [] (cicho)');
    let removeThrew = false;
    try { await idbRemoveItem('any'); } catch { removeThrew = true; }
    assert(removeThrew === false, '2c. bez indexedDB: idbRemoveItem nie rzuca (best-effort)');
    let setThrew = false;
    try { await idbSetItem('any', 'v'); } catch { setThrew = true; }
    assert(setThrew === true, '2d. bez indexedDB: idbSetItem RZUCA (saveToLocal musi odroznic sukces od porazki -- patrz naglowek pliku)');
  });

  console.log('');
  console.log('--- 3. idb-storage.ts: idbSetItem propaguje quota-shaped error (reject) ---');

  await withMockEnv({ idb: makeFakeIndexedDB({ putError: () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; return e; } }) }, async ({ idbSetItem }) => {
    let caught = null;
    try { await idbSetItem('k', 'v'); } catch (e) { caught = e; }
    assert(!!caught && caught.name === 'QuotaExceededError', '3a. idbSetItem reject z oryginalnym bledem (name=QuotaExceededError zachowane, dla isQuotaExceededError w save.ts)');
  });

  // -------------------------------------------------------------------------
  // 4. save.ts integracja: NOWE zapisy WYLACZNIE do IndexedDB.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('--- 4. save.ts::saveToLocal zapisuje WYLACZNIE do IndexedDB (localStorage nietkniety) ---');

  await withMockEnv({ localStorageStore: {} }, async ({ saveToLocal, SAVE_PREFIX }, fakeIdb) => {
    const res = await saveToLocal('slotA', fakeSave({ tura: 9 }));
    assert(res.ok === true, '4a. saveToLocal -> ok:true');
    assert(fakeIdb._store.has(SAVE_PREFIX + 'slotA'), '4b. klucz glowny zapisu jest w fake IndexedDB');
    assert(global.localStorage.getItem(SAVE_PREFIX + 'slotA') === null, '4c. saveToLocal NIE pisze do localStorage (migracja: wylacznie IDB)');
  });

  console.log('');
  console.log('--- 5. save.ts::loadFromLocal: IDB pierwsze, fallback na legacy localStorage ---');

  await withMockEnv({ localStorageStore: {} }, async ({ loadFromLocal, serializeGame, SAVE_PREFIX }) => {
    // Slot istnieje WYLACZNIE w localStorage (symulacja zapisu sprzed migracji).
    global.localStorage.setItem(SAVE_PREFIX + 'legacySlot', serializeGame(fakeSave({ tura: 5 })));
    const got = await loadFromLocal('legacySlot');
    assert(!!got && got.tura === 5, '5a. loadFromLocal czyta stary zapis z legacy localStorage, gdy IDB go nie ma (got ' + JSON.stringify(got && got.tura) + ')');
  });

  await withMockEnv({ localStorageStore: {} }, async ({ loadFromLocal, saveToLocal, serializeGame, SAVE_PREFIX }) => {
    // Slot istnieje w OBU -- IDB (przez saveToLocal, wartosc "nowa") i w
    // localStorage (wartosc "stara", reczne ziarno) -- IDB ma wygrac.
    global.localStorage.setItem(SAVE_PREFIX + 'bothSlot', serializeGame(fakeSave({ tura: 1, meta: { label: 'stara-wersja' } })));
    await saveToLocal('bothSlot', fakeSave({ tura: 99, meta: { label: 'nowa-wersja' } }));
    const got = await loadFromLocal('bothSlot');
    assert(!!got && got.tura === 99, '5b. loadFromLocal: gdy slot jest w OBU backendach, IDB (nowszy) wygrywa nad legacy localStorage (got tura=' + (got && got.tura) + ')');
  });

  await withMockEnv({ localStorageStore: {} }, async ({ loadFromLocal }) => {
    const got = await loadFromLocal('brakGdziekolwiek');
    assert(got === null, '5c. loadFromLocal: slot nieobecny w ZADNYM backendzie -> null');
  });

  // -------------------------------------------------------------------------
  // 6. save.ts::listSaves -- unia IDB + legacy localStorage.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('--- 6. save.ts::listSaves: unia slotow z IndexedDB i legacy localStorage ---');

  await withMockEnv({ localStorageStore: {} }, async ({ saveToLocal, listSaves, serializeGame, SAVE_PREFIX }) => {
    await saveToLocal('idbOnly', fakeSave());
    global.localStorage.setItem(SAVE_PREFIX + 'localOnly', serializeGame(fakeSave()));
    const slots = await listSaves();
    assert(
      slots.includes('idbOnly') && slots.includes('localOnly') && slots.length === 2,
      '6a. listSaves zwraca oba sloty (IDB-only + localStorage-only), bez duplikatow (got ' + JSON.stringify(slots) + ')',
    );
  });

  await withMockEnv({ localStorageStore: {} }, async ({ saveToLocal, listSaves, serializeGame, SAVE_PREFIX }) => {
    // Ten sam slot w obu backendach -- listSaves NIE duplikuje.
    await saveToLocal('dupSlot', fakeSave());
    global.localStorage.setItem(SAVE_PREFIX + 'dupSlot', serializeGame(fakeSave()));
    const slots = await listSaves();
    assert(
      slots.filter((s) => s === 'dupSlot').length === 1,
      '6b. listSaves: slot obecny w OBU backendach pojawia sie RAZ (deduplikacja), got ' + JSON.stringify(slots),
    );
  });

  // -------------------------------------------------------------------------
  // 7. save.ts::deleteLocal -- usuwa z OBU backendow.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('--- 7. save.ts::deleteLocal: usuwa slot z OBU backendow ---');

  await withMockEnv({ localStorageStore: {} }, async ({ saveToLocal, deleteLocal, listSaves, serializeGame, SAVE_PREFIX }) => {
    await saveToLocal('toDelete', fakeSave());
    global.localStorage.setItem(SAVE_PREFIX + 'toDelete', serializeGame(fakeSave()));
    const before = await listSaves();
    assert(before.includes('toDelete'), '7a. (setup) slot "toDelete" widoczny przed usunieciem');

    const ok = await deleteLocal('toDelete');
    assert(ok === true, '7b. deleteLocal -> true');
    assert(global.localStorage.getItem(SAVE_PREFIX + 'toDelete') === null, '7c. deleteLocal usuwa z legacy localStorage');
    const after = await listSaves();
    assert(!after.includes('toDelete'), '7d. deleteLocal: slot znika z listSaves() po usunieciu z OBU backendow (got ' + JSON.stringify(after) + ')');
  });

  // -------------------------------------------------------------------------
  // 8. save.ts::loadSaveSlotMeta -- ten sam wzorzec IDB-pierwsze/fallback.
  // -------------------------------------------------------------------------
  console.log('');
  console.log('--- 8. save.ts::loadSaveSlotMeta: IDB pierwsze, fallback na legacy localStorage ---');

  await withMockEnv({ localStorageStore: {} }, async ({ saveToLocal, loadSaveSlotMeta }) => {
    await saveToLocal('metaSlot', fakeSave({ tura: 7, meta: { label: 'Moj zapis', savedAt: '2026-08-11T12:00:00.000Z' } }));
    const meta = await loadSaveSlotMeta('metaSlot');
    assert(!!meta && meta.tura === 7 && meta.label === 'Moj zapis', '8a. loadSaveSlotMeta czyta naglowek zapisany przez saveToLocal (IDB) (got ' + JSON.stringify(meta) + ')');
  });

  await withMockEnv({ localStorageStore: {} }, async ({ loadSaveSlotMeta }) => {
    const meta = await loadSaveSlotMeta('brakMeta');
    assert(meta === null, '8b. loadSaveSlotMeta: brak klucza meta w OBU backendach -> null (wolajacy fallbackuje na pelne loadFromLocal, patrz saveLoadDialog.ts)');
  });

  console.log('');
  console.log('=== idb-storage-migration-test: ' + pass + ' pass, ' + fail + ' fail ===');
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('UNCAUGHT:', e);
  try { fs.unlinkSync(BUNDLE); } catch (e2) { /* ignore */ }
  process.exit(1);
});
