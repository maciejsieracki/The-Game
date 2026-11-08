'use strict';
/**
 * autosave-quota-fail-test.cjs
 *
 * P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA (2026-08-09) -- gdy saveToLocal()
 * nie moze zapisac (typowo QuotaExceededError bo localStorage jest pelny),
 * doRotatingAutosave() w main.ts:
 *   (a) milczal calkowicie -- brak console.warn/console.error, brak
 *       komunikatu dla gracza (showHintMessage) -- naprawione tutaj;
 *   (b) NIE przesuwal AUTOSAVE_ROT_IDX_KEY w galezi bledu -- to jest
 *       ZAMIERZONE (kolejna proba celuje ponownie w ten sam slot zamiast po
 *       cichu przeskoczyc dalej i zostawic go zamrozonym) i MUSI zostac tak.
 *
 * Zakres testu (main.ts nie da sie zbundlowac w izolacji -- caly silnik
 * gry/DOM -- konwencja jak mur-paradoks-test.cjs / structure-defense-bonus-
 * test.cjs: prawdziwe cegielki uruchamiane naprawde (save.ts::saveToLocal),
 * + literalne asercje zrodlowe na main.ts::doRotatingAutosave/persistSaveToSlot):
 *
 *   1. save.ts::saveToLocal() -- kontrakt {ok, reason}:
 *      1a. sukces -> { ok: true }, bez reason;
 *      1b. storage.setItem rzuca QuotaExceededError (DOMException-like,
 *          name='QuotaExceededError') -> { ok: false, reason: 'quota' };
 *      1c. storage.setItem rzuca inny blad -> { ok: false, reason: 'other' };
 *      1d. legacy code=22 (stary DOMException) i code=1014 (Firefox przed
 *          Quantum) tez rozpoznawane jako 'quota'.
 *   2. main.ts zrodlo -- doRotatingAutosave():
 *      2a. destrukturyzuje { ok, reason } z saveToLocal (nie samo bool);
 *      2b. w galezi niepowodzenia woal console.warn ORAZ showHintMessage
 *          (gracz jest informowany -- dzis milczy);
 *      2c. komunikat dla reason==='quota' wprost mowi o braku miejsca;
 *      2d. AUTOSAVE_ROT_IDX_KEY setItem wystepuje WYLACZNIE w galezi sukcesu
 *          (if (ok) { ... }) -- w galezi else go NIE MA, wiec kolejna proba
 *          rotacji nie "przeskakuje" cicho na kolejny slot.
 *   3. main.ts zrodlo -- persistSaveToSlot() (uzywana przez doQuickSave i
 *      reczny zapis) zwraca PELNY wynik { ok, reason } z saveToLocal (nie
 *      goly boolean) -- P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT (2026-08-10):
 *      wolajacy (doQuickSave, openSaveGameDialog onSave) musieli znac reason
 *      zeby przy 'quota' pokazac prawdziwy komunikat "brak miejsca w zapisie
 *      przegladarki" zamiast mylacego ogolnika "brak localStorage?"
 *      (regresja sygnatury zlapana na tsc, ale pinujemy tu explicite).
 *
 * Usage (z gra/): node tools/autosave-quota-fail-test.cjs
 */

const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');

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

// ---------------------------------------------------------------------------
// 1. save.ts::saveToLocal -- prawdziwy kod, uruchomiony naprawde.
// ---------------------------------------------------------------------------
console.log('--- 1. save.ts::saveToLocal kontrakt {ok, reason} ---');

const ENTRY = path.join(__dirname, '.autosave-quota-fail-entry.ts');
const BUNDLE = path.join(__dirname, '.autosave-quota-fail-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  "export { saveToLocal } from '../src/game/save.ts';\n",
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

/**
 * MIGRACJA IDB: idb-storage.ts memoizuje jej połączenie do bazy w module-
 * scoped `dbPromise` (celowo -- unika wielokrotnego indexedDB.open() w
 * prawdziwej grze). W tym harnessie to oznacza, że require(BUNDLE) RAZ i
 * używanie tego samego saveToLocal we WSZYSTKICH podtestach 1a-1d
 * zamroziłoby pierwszy fake indexedDB na stałe -- kolejne bloki
 * withMockIndexedDB z INNYM putErrorFactory byłyby cicho ignorowane (druga,
 * trzecia... podmiana global.indexedDB nigdy by nie doszła do głosu).
 * Czyścimy require.cache przed KAŻDYM podtestem, żeby moduł (i jego
 * `dbPromise`) ożył od zera i zobaczył AKTUALNY global.indexedDB.
 * / EN: idb-storage.ts memoizes its DB connection in a module-scoped
 * `dbPromise` (deliberately -- avoids repeated indexedDB.open() in the real
 * game). In this harness that means require(BUNDLE) once and reusing the
 * same saveToLocal across all 1a-1d sub-tests would freeze the first fake
 * indexedDB forever -- later withMockIndexedDB blocks with a DIFFERENT
 * putErrorFactory would be silently ignored. Clear require.cache before
 * EACH sub-test so the module (and its `dbPromise`) starts fresh and picks
 * up the CURRENT global.indexedDB.
 */
function freshSaveToLocal() {
  delete require.cache[require.resolve(BUNDLE)];
  return require(BUNDLE).saveToLocal;
}

/** Minimalny SaveGame legalny dla serializeGame -- pola poza `wersja`/`tura`
 * nie sa uzywane przez ten test (serializeGame robi JSON.stringify calosci). */
function fakeSave() {
  return {
    wersja: 1,
    tura: 7,
    seed: 1,
    units: [],
    cities: [],
    explored: [],
    meta: { label: 'test', savedAtIso: new Date().toISOString() },
  };
}

// ---------------------------------------------------------------------------
// MIGRACJA IDB: saveToLocal() zapisuje dziś do IndexedDB (idb-storage.ts),
// nie do localStorage -- fake musi imitowac minimalny indexedDB.open/
// transaction/objectStore.put, ktorego uzywa idbSetItem(). `fake-indexeddb`
// NIE jest w package.json (sprawdzone) -- zamiast dodawac zaleznosc npm,
// piszemy reczny, minimalny fake pokrywajacy WYLACZNIE to, czego realnie
// uzywa idb-storage.ts (brak kursorow/indeksow -- YAGNI, patrz idb-storage-
// migration-test.cjs po ten sam wzorzec z pelniejszym komentarzem).
// / EN: saveToLocal() now writes to IndexedDB (idb-storage.ts), not
// localStorage -- the fake must mimic the minimal indexedDB.open/
// transaction/objectStore.put surface idbSetItem() actually uses.
// `fake-indexeddb` is NOT in package.json (checked) -- instead of adding an
// npm dependency, we write a manual, minimal fake covering ONLY what
// idb-storage.ts actually uses (no cursors/indexes -- YAGNI, see
// idb-storage-migration-test.cjs for the same pattern with a fuller comment).
// ---------------------------------------------------------------------------
function makeFakeIndexedDB(putErrorFactory) {
  const store = new Map();
  const fakeReq = (getResult) => {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      req.result = getResult();
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  };
  const objectStore = {
    put(value, key) {
      const err = putErrorFactory ? putErrorFactory() : null;
      if (err) {
        // Zaplanuj blad transakcji (patrz tx.put nizej) -- realne IndexedDB
        // odrzuca calą transakcję na blad zapisu, nie pojedynczy request.
        objectStore._pendingError = err;
        return fakeReq(() => undefined);
      }
      store.set(key, value);
      return fakeReq(() => undefined);
    },
    get(key) { return fakeReq(() => store.get(key)); },
    delete(key) { store.delete(key); return fakeReq(() => undefined); },
    getAllKeys() { return fakeReq(() => Array.from(store.keys())); },
  };
  const transaction = {
    objectStore: () => objectStore,
    oncomplete: null, onerror: null, onabort: null, error: null,
  };
  const db = {
    objectStoreNames: { contains: () => true },
    transaction: (_name, _mode) => {
      queueMicrotask(() => {
        if (objectStore._pendingError) {
          const err = objectStore._pendingError;
          objectStore._pendingError = null;
          transaction.error = err;
          if (transaction.onabort) transaction.onabort();
        } else if (transaction.oncomplete) {
          transaction.oncomplete();
        }
      });
      return transaction;
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
  };
}

async function withMockIndexedDB(putErrorFactory, fn) {
  global.indexedDB = makeFakeIndexedDB(putErrorFactory);
  try {
    // Świeży require -- patrz komentarz przy freshSaveToLocal() powyżej.
    return await fn(freshSaveToLocal());
  } finally {
    delete global.indexedDB;
  }
}

(async () => {
  // 1a. sukces
  await withMockIndexedDB(null, async (saveToLocal) => {
    const res = await saveToLocal('autosave-1', fakeSave());
    assert(res.ok === true, '1a. sukces -> { ok: true } (got ' + JSON.stringify(res) + ')');
    assert(res.reason === undefined, '1a. sukces -> bez reason');
  });

  // 1b. QuotaExceededError (DOMException-like -- name)
  await withMockIndexedDB(() => {
    const e = new Error('quota');
    e.name = 'QuotaExceededError';
    return e;
  }, async (saveToLocal) => {
    const res = await saveToLocal('autosave-1', fakeSave());
    assert(res.ok === false, '1b. QuotaExceededError -> ok:false (got ' + JSON.stringify(res) + ')');
    assert(res.reason === 'quota', "1b. QuotaExceededError -> reason:'quota' (got " + JSON.stringify(res) + ')');
  });

  // 1c. Inny blad (nie quota)
  await withMockIndexedDB(() => new TypeError('boom, unrelated failure'), async (saveToLocal) => {
    const res = await saveToLocal('autosave-1', fakeSave());
    assert(res.ok === false, '1c. inny blad -> ok:false (got ' + JSON.stringify(res) + ')');
    assert(res.reason === 'other', "1c. inny blad -> reason:'other' (nie 'quota') (got " + JSON.stringify(res) + ')');
  });

  // 1d. Legacy code=22 / code=1014
  for (const code of [22, 1014]) {
    await withMockIndexedDB(() => {
      const e = new Error('legacy quota code=' + code);
      e.code = code;
      return e;
    }, async (saveToLocal) => {
      const res = await saveToLocal('autosave-1', fakeSave());
      assert(
        res.ok === false && res.reason === 'quota',
        '1d. legacy DOMException code=' + code + " -> reason:'quota' (got " + JSON.stringify(res) + ')',
      );
    });
  }

  console.log('');
  runSourceAssertions();
})().catch((e) => {
  console.error('UNCAUGHT:', e);
  try { fs.unlinkSync(BUNDLE); } catch (e2) { /* ignore */ }
  process.exit(1);
});

function runSourceAssertions() {

// ---------------------------------------------------------------------------
// 2-3. main.ts zrodlo -- literalne asercje tekstowe.
// ---------------------------------------------------------------------------
console.log('--- 2-3. Zrodlo main.ts (doRotatingAutosave / persistSaveToSlot) ---');

const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

// R-AUTOZAPIS-QUOTA-STORAGE-Q1 (ECHO A): funkcja stala sie async (Promise<void>)
// -- dokłada próbę zapisu na dysk (FSA) PRZED dotychczasową ścieżką
// localStorage; sygnatura w regexie dopasowana do tej zmiany.
const rotMatch = mainTsSrc.match(
  /async function doRotatingAutosave\(\): Promise<void> \{([\s\S]*?)\n {4}\}\n\n {4}\/\/ -{10,}\n {4}\/\/ End turn/,
);
assert(!!rotMatch, 'doRotatingAutosave() znaleziona w main.ts (dopasowanie do End turn markera)');
if (rotMatch) {
  const body = rotMatch[1];

  // 2a. destrukturyzacja { ok, reason } -- MIGRACJA IDB: saveToLocal() jest
  // teraz async, wywolanie poprzedzone `await`.
  assert(
    /const \{ ok, reason \} = await saveToLocal\(/.test(body),
    'doRotatingAutosave() destrukturyzuje { ok, reason } z await saveToLocal (nie samo bool)',
  );

  // Wydziel galaz else (niepowodzenie) do osobnych asercji, zeby nie zlapac
  // przypadkiem sukcesu w tych samych regexach.
  const elseMatch = body.match(/\} else \{([\s\S]*?)\n {8}\}\n {6}\} catch \(eRot\)/);
  assert(!!elseMatch, 'doRotatingAutosave() ma galaz else (niepowodzenie zapisu) przed catch(eRot)');
  const elseBody = elseMatch ? elseMatch[1] : '';

  // 2b. console.warn + showHintMessage w galezi niepowodzenia
  assert(
    /console\.warn\(/.test(elseBody),
    'Galaz niepowodzenia woa console.warn (dzis: calkowita cisza) -- body: ' + JSON.stringify(elseBody.trim()),
  );
  assert(
    /showHintMessage\(/.test(elseBody),
    'Galaz niepowodzenia woa showHintMessage (gracz jest informowany, nie milczy jak dzis)',
  );

  // 2c. Komunikat quota wprost mowi o braku miejsca
  assert(
    /reason === 'quota'[\s\S]*?brak miejsca/.test(elseBody),
    "Galaz niepowodzenia rozroznia reason==='quota' i pokazuje komunikat o braku miejsca w zapisie przegladarki",
  );

  // 2d. AUTOSAVE_ROT_IDX_KEY setItem WYLACZNIE w galezi sukcesu (if (ok) {...}),
  // NIE w galezi else -- kolejna proba rotacji nie przeskakuje cicho dalej.
  assert(
    !/AUTOSAVE_ROT_IDX_KEY/.test(elseBody),
    'Galaz niepowodzenia NIE przesuwa AUTOSAVE_ROT_IDX_KEY -- nastepna proba rotacji celuje ponownie w ten sam (nieudany) slot zamiast po cichu przeskoczyc dalej i zamrozic slot bez wiedzy gracza',
  );
  const okMatch = body.match(/if \(ok\) \{([\s\S]*?)\n {8}\} else \{/);
  assert(!!okMatch, 'doRotatingAutosave() ma galaz if (ok) { ... } przed else');
  if (okMatch) {
    assert(
      /AUTOSAVE_ROT_IDX_KEY/.test(okMatch[1]),
      'Galaz sukcesu (if (ok)) nadal przesuwa AUTOSAVE_ROT_IDX_KEY -- zachowanie przy udanym zapisie bez zmian',
    );
    assert(
      /console\.log\(/.test(okMatch[1]),
      'Galaz sukcesu nadal loguje console.log (bez zmian wzgledem stanu przed poprawka)',
    );
  }
}

// 3. persistSaveToSlot() zwraca PELNY wynik { ok, reason } z saveToLocal
//    (nie goly boolean) -- P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT.
//    MIGRACJA IDB: funkcja jest teraz async (Promise<SaveToLocalResult>) --
//    saveToLocal() (IndexedDB) wolane z await.
const persistMatch = mainTsSrc.match(
  /async function persistSaveToSlot\(slotId: string, label: string\): Promise<SaveToLocalResult> \{([\s\S]*?)\n {4}\}/,
);
assert(!!persistMatch, 'persistSaveToSlot() znaleziona w main.ts (async, zwraca Promise<SaveToLocalResult>, nie goly boolean)');
if (persistMatch) {
  const body = persistMatch[1];
  assert(
    /const result = await saveToLocal\(/.test(body) && /return result;/.test(body),
    'persistSaveToSlot() zwraca caly wynik await saveToLocal ({ ok, reason }), nie tylko ok',
  );
}

console.log('');
console.log('=== autosave-quota-fail-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(fail > 0 ? 1 : 0);
}
