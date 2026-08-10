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
 *      reczny zapis) tez destrukturyzuje { ok } z nowego ksztaltu zwracanego
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
const { saveToLocal } = require(BUNDLE);
fs.unlinkSync(ENTRY);

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

function withMockStorage(setItemImpl, fn) {
  const store = {};
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: setItemImpl || ((k, v) => { store[k] = v; }),
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
  try {
    return fn(store);
  } finally {
    delete global.localStorage;
  }
}

// 1a. sukces
withMockStorage(undefined, () => {
  const res = saveToLocal('autosave-1', fakeSave());
  assert(res.ok === true, '1a. sukces -> { ok: true } (got ' + JSON.stringify(res) + ')');
  assert(res.reason === undefined, '1a. sukces -> bez reason');
});

// 1b. QuotaExceededError (DOMException-like -- name)
withMockStorage(() => {
  const e = new Error('quota');
  e.name = 'QuotaExceededError';
  throw e;
}, () => {
  const res = saveToLocal('autosave-1', fakeSave());
  assert(res.ok === false, '1b. QuotaExceededError -> ok:false (got ' + JSON.stringify(res) + ')');
  assert(res.reason === 'quota', "1b. QuotaExceededError -> reason:'quota' (got " + JSON.stringify(res) + ')');
});

// 1c. Inny blad (nie quota)
withMockStorage(() => {
  throw new TypeError('boom, unrelated failure');
}, () => {
  const res = saveToLocal('autosave-1', fakeSave());
  assert(res.ok === false, '1c. inny blad -> ok:false (got ' + JSON.stringify(res) + ')');
  assert(res.reason === 'other', "1c. inny blad -> reason:'other' (nie 'quota') (got " + JSON.stringify(res) + ')');
});

// 1d. Legacy code=22 / code=1014
for (const code of [22, 1014]) {
  withMockStorage(() => {
    const e = new Error('legacy quota code=' + code);
    e.code = code;
    throw e;
  }, () => {
    const res = saveToLocal('autosave-1', fakeSave());
    assert(
      res.ok === false && res.reason === 'quota',
      '1d. legacy DOMException code=' + code + " -> reason:'quota' (got " + JSON.stringify(res) + ')',
    );
  });
}

console.log('');

// ---------------------------------------------------------------------------
// 2-3. main.ts zrodlo -- literalne asercje tekstowe.
// ---------------------------------------------------------------------------
console.log('--- 2-3. Zrodlo main.ts (doRotatingAutosave / persistSaveToSlot) ---');

const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

const rotMatch = mainTsSrc.match(
  /function doRotatingAutosave\(\): void \{([\s\S]*?)\n {4}\}\n\n {4}\/\/ -{10,}\n {4}\/\/ End turn/,
);
assert(!!rotMatch, 'doRotatingAutosave() znaleziona w main.ts (dopasowanie do End turn markera)');
if (rotMatch) {
  const body = rotMatch[1];

  // 2a. destrukturyzacja { ok, reason }
  assert(
    /const \{ ok, reason \} = saveToLocal\(/.test(body),
    'doRotatingAutosave() destrukturyzuje { ok, reason } z saveToLocal (nie samo bool)',
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

// 3. persistSaveToSlot() destrukturyzuje { ok } z saveToLocal.
const persistMatch = mainTsSrc.match(
  /function persistSaveToSlot\(slotId: string, label: string\): boolean \{([\s\S]*?)\n {4}\}/,
);
assert(!!persistMatch, 'persistSaveToSlot() znaleziona w main.ts');
if (persistMatch) {
  const body = persistMatch[1];
  assert(
    /const \{ ok \} = saveToLocal\(/.test(body),
    'persistSaveToSlot() destrukturyzuje { ok } z saveToLocal (dostosowane do nowej sygnatury {ok, reason})',
  );
}

console.log('');
console.log('=== autosave-quota-fail-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(fail > 0 ? 1 : 0);
