'use strict';
/**
 * fsa-autosave-test.cjs
 *
 * R-AUTOZAPIS-QUOTA-STORAGE-Q1 (ECHO A) -- File System Access rotating
 * autosave (src/game/fsa-autosave.ts). Bez prawdziwej przeglądarki nie da
 * się przetestować showDirectoryPicker()/prawdziwego IndexedDB E2E -- ten
 * test pokrywa to, co jest realnie testowalne pod plain Node (konwencja jak
 * autosave-quota-fail-test.cjs / save-label-test.cjs):
 *
 *   1. detectFsaAvailability() -- czysta decyzja środowiska: wszystkie
 *      gałęzie braku wsparcia (no-window / file-protocol / insecure-context
 *      / no-api) + ścieżka pełnego wsparcia.
 *   2. autosaveFileName(idx) -- nazewnictwo plików rotacji 1..10, zawijanie
 *      modulo (idx=10 -> plik 1, idx=-1 -> plik 10).
 *   3. shouldUseFsaAutosave(state) -- decyzja FSA vs fallback dla każdej
 *      kombinacji (availability/handle/permission).
 *   4. fsaUnavailableMessage(reason) -- string niepusty dla KAŻDEJ przyczyny
 *      (w tym spoza FsaUnavailableReason: 'error'/'permission-denied'/
 *      'picker-cancelled'/undefined) -- funkcja nigdy nie zwraca "".
 *   5. Bez window (plain Node) -- getFsaReadinessState()/ensureFsaAutosave-
 *      Ready()/fsaRotatingAutosaveWrite() degradują bezpiecznie (nigdy nie
 *      rzucają, zawsze { ok:false, reason }).
 *   6. Zgodność stałej rotacji: FSA_AUTOSAVE_ROT_COUNT (fsa-autosave.ts)
 *      MUSI być równe main.ts::AUTOSAVE_ROT_COUNT -- inaczej zapis na dysk
 *      i zapis do localStorage rotowałyby po innej liczbie slotów.
 *
 * Usage (z gra/): node tools/fsa-autosave-test.cjs
 */

const fs = require('fs');
const path = require('path');
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
// Bundlowanie fsa-autosave.ts do CJS (prawdziwy kod źródłowy, uruchomiony
// naprawdę -- nie reimplementacja logiki w teście).
// ---------------------------------------------------------------------------
const ENTRY = path.join(__dirname, '.fsa-autosave-entry.ts');
const BUNDLE = path.join(__dirname, '.fsa-autosave-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  [
    "export {",
    "  detectFsaAvailability, detectFsaAvailabilityFromWindow, fsaUnavailableMessage,",
    "  autosaveFileName, FSA_AUTOSAVE_ROT_COUNT,",
    "  shouldUseFsaAutosave, getFsaReadinessState,",
    "  ensureFsaAutosaveReady, fsaRotatingAutosaveWrite,",
    "  listFsaAutosaveFiles, readFsaAutosaveFile, loadFsaAutosaveFile,",
    "  _resetFsaStateForTests, _setFsaStateForTests,",
    "} from '../src/game/fsa-autosave.ts';",
    "",
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
const fsa = require(BUNDLE);
fs.unlinkSync(ENTRY);

// ---------------------------------------------------------------------------
// 1. detectFsaAvailability -- czysta decyzja środowiska.
// ---------------------------------------------------------------------------
console.log('--- 1. detectFsaAvailability(env) ---');

{
  const r = fsa.detectFsaAvailability({ hasWindow: false, hasShowDirectoryPicker: false, protocol: '', isSecureContext: false });
  assert(r.available === false && r.reason === 'no-window', "brak window -> {available:false, reason:'no-window'} (got " + JSON.stringify(r) + ')');
}
{
  const r = fsa.detectFsaAvailability({ hasWindow: true, hasShowDirectoryPicker: true, protocol: 'file:', isSecureContext: true });
  assert(r.available === false && r.reason === 'file-protocol', "protokol file:// -> {available:false, reason:'file-protocol'} (got " + JSON.stringify(r) + ') -- FSA nie dziala pod file://, wymagany http://localhost');
}
{
  const r = fsa.detectFsaAvailability({ hasWindow: true, hasShowDirectoryPicker: true, protocol: 'http:', isSecureContext: false });
  assert(r.available === false && r.reason === 'insecure-context', "http: bez secure context -> {available:false, reason:'insecure-context'} (got " + JSON.stringify(r) + ')');
}
{
  const r = fsa.detectFsaAvailability({ hasWindow: true, hasShowDirectoryPicker: false, protocol: 'http:', isSecureContext: true });
  assert(r.available === false && r.reason === 'no-api', "brak showDirectoryPicker (Firefox/Safari) -> {available:false, reason:'no-api'} (got " + JSON.stringify(r) + ')');
}
{
  const r = fsa.detectFsaAvailability({ hasWindow: true, hasShowDirectoryPicker: true, protocol: 'http:', isSecureContext: true });
  assert(r.available === true && r.reason === undefined, 'http://localhost + Chrome/Edge -> {available:true} (got ' + JSON.stringify(r) + ')');
}
{
  const r = fsa.detectFsaAvailability({ hasWindow: true, hasShowDirectoryPicker: true, protocol: 'https:', isSecureContext: true });
  assert(r.available === true, 'https: + Chrome/Edge -> {available:true} (got ' + JSON.stringify(r) + ')');
}
{
  // file:// bywa raportowany jako "secure context" przez przeglądarkę mimo to --
  // sprawdzenie protokołu MUSI wygrywać z isSecureContext (patrz komentarz w
  // źródle), inaczej ta gałąź nigdy by się nie uruchomiła.
  const r = fsa.detectFsaAvailability({ hasWindow: true, hasShowDirectoryPicker: true, protocol: 'file:', isSecureContext: true });
  assert(r.reason === 'file-protocol', "file:// z isSecureContext=true nadal daje reason:'file-protocol' (got " + JSON.stringify(r) + ')');
}

console.log('');

// ---------------------------------------------------------------------------
// 2. autosaveFileName(idx) -- nazewnictwo + zawijanie modulo.
// ---------------------------------------------------------------------------
console.log('--- 2. autosaveFileName(idx) ---');

assert(fsa.autosaveFileName(0) === 'civ-autosave-1.json', 'idx=0 -> civ-autosave-1.json (got ' + fsa.autosaveFileName(0) + ')');
assert(fsa.autosaveFileName(9) === 'civ-autosave-10.json', 'idx=9 -> civ-autosave-10.json (got ' + fsa.autosaveFileName(9) + ')');
assert(fsa.autosaveFileName(10) === 'civ-autosave-1.json', 'idx=10 zawija sie do civ-autosave-1.json (got ' + fsa.autosaveFileName(10) + ')');
assert(fsa.autosaveFileName(-1) === 'civ-autosave-10.json', 'idx=-1 zawija sie do civ-autosave-10.json (got ' + fsa.autosaveFileName(-1) + ')');
assert(fsa.FSA_AUTOSAVE_ROT_COUNT === 10, 'FSA_AUTOSAVE_ROT_COUNT === 10 (got ' + fsa.FSA_AUTOSAVE_ROT_COUNT + ')');

// Dodatkowo (Evaluator runda 1): idx nie-skonczone (NaN/Infinity) -- zamiast
// doslownego "civ-autosave-NaN.json" na dysku, bezpieczna degradacja do slotu 0.
assert(fsa.autosaveFileName(NaN) === 'civ-autosave-1.json', 'idx=NaN degraduje do civ-autosave-1.json, NIE "civ-autosave-NaN.json" (got ' + fsa.autosaveFileName(NaN) + ')');
assert(fsa.autosaveFileName(Infinity) === 'civ-autosave-1.json', 'idx=Infinity degraduje do civ-autosave-1.json (got ' + fsa.autosaveFileName(Infinity) + ')');
assert(fsa.autosaveFileName(-Infinity) === 'civ-autosave-1.json', 'idx=-Infinity degraduje do civ-autosave-1.json (got ' + fsa.autosaveFileName(-Infinity) + ')');

// Wszystkie 10 nazw sa unikalne (zaden kolizja rotacji).
{
  const names = new Set();
  for (let i = 0; i < 10; i++) names.add(fsa.autosaveFileName(i));
  assert(names.size === 10, '10 kolejnych idx daje 10 unikalnych nazw plikow (got ' + names.size + ')');
}

console.log('');

// ---------------------------------------------------------------------------
// 3. shouldUseFsaAutosave(state) -- decyzja FSA vs fallback.
// ---------------------------------------------------------------------------
console.log('--- 3. shouldUseFsaAutosave(state) ---');

const AVAIL_OK = { available: true };
const AVAIL_NO = { available: false, reason: 'no-api' };

assert(
  fsa.shouldUseFsaAutosave({ availability: AVAIL_OK, hasDirectoryHandle: true, permissionGranted: true }) === true,
  'dostepne + handle + zgoda -> true (uzyj FSA)',
);
assert(
  fsa.shouldUseFsaAutosave({ availability: AVAIL_NO, hasDirectoryHandle: true, permissionGranted: true }) === false,
  'niedostepne srodowisko (mimo handle+zgoda z poprzedniej sesji) -> false (fallback)',
);
assert(
  fsa.shouldUseFsaAutosave({ availability: AVAIL_OK, hasDirectoryHandle: false, permissionGranted: true }) === false,
  'brak wybranego katalogu -> false (fallback, gracz nie kliknal jeszcze startu sesji)',
);
assert(
  fsa.shouldUseFsaAutosave({ availability: AVAIL_OK, hasDirectoryHandle: true, permissionGranted: false }) === false,
  'zgoda nieudzielona/wycofana -> false (fallback)',
);
assert(
  fsa.shouldUseFsaAutosave({ availability: AVAIL_NO, hasDirectoryHandle: false, permissionGranted: false }) === false,
  'nic gotowe -> false (stan domyslny na starcie procesu)',
);

console.log('');

// ---------------------------------------------------------------------------
// 4. fsaUnavailableMessage(reason) -- string niepusty dla kazdej przyczyny.
// ---------------------------------------------------------------------------
console.log('--- 4. fsaUnavailableMessage(reason) ---');

const REASONS = ['no-window', 'file-protocol', 'insecure-context', 'no-api', 'permission-denied', 'picker-cancelled', 'error', undefined];
for (const r of REASONS) {
  const msg = fsa.fsaUnavailableMessage(r);
  assert(typeof msg === 'string' && msg.length > 0, 'reason=' + JSON.stringify(r) + ' -> string niepusty (got ' + JSON.stringify(msg) + ')');
}
assert(/localhost/.test(fsa.fsaUnavailableMessage('file-protocol')), "reason='file-protocol' wspomina http://localhost (naprowadza gracza jak wlaczyc funkcje)");
assert(/Chrome|Edge/.test(fsa.fsaUnavailableMessage('no-api')), "reason='no-api' wymienia wspierane przegladarki (Chrome/Edge)");

console.log('');

// ---------------------------------------------------------------------------
// 5. Plain Node (brak window) -- bezpieczna degradacja, zero wyjatkow.
// ---------------------------------------------------------------------------
console.log('--- 5. Brak window (plain Node) -- bezpieczna degradacja ---');

(async () => {
  fsa._resetFsaStateForTests();

  assert(fsa.detectFsaAvailabilityFromWindow().available === false, 'detectFsaAvailabilityFromWindow() bez window -> available:false');

  const state0 = fsa.getFsaReadinessState();
  assert(
    state0.availability.available === false && state0.hasDirectoryHandle === false && state0.permissionGranted === false,
    'getFsaReadinessState() domyslnie: niedostepne, brak handle, brak zgody (got ' + JSON.stringify(state0) + ')',
  );
  assert(fsa.shouldUseFsaAutosave(state0) === false, 'shouldUseFsaAutosave(stan domyslny) === false -- main.ts od razu idzie na localStorage');

  let readyResult;
  let threw = false;
  try {
    readyResult = await fsa.ensureFsaAutosaveReady();
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'ensureFsaAutosaveReady() pod plain Node NIGDY nie rzuca');
  assert(
    readyResult && readyResult.ok === false && readyResult.reason === 'no-window',
    "ensureFsaAutosaveReady() pod plain Node -> {ok:false, reason:'no-window'} (got " + JSON.stringify(readyResult) + ')',
  );

  let writeResult;
  let writeThrew = false;
  try {
    writeResult = await fsa.fsaRotatingAutosaveWrite(0, { wersja: 1, tura: 1, seed: 1, units: [], cities: [], explored: [] });
  } catch (e) {
    writeThrew = true;
  }
  assert(!writeThrew, 'fsaRotatingAutosaveWrite() bez gotowego katalogu NIGDY nie rzuca');
  assert(
    writeResult && writeResult.ok === false && writeResult.reason === 'not-ready',
    "fsaRotatingAutosaveWrite() bez gotowego katalogu -> {ok:false, reason:'not-ready'} (got " + JSON.stringify(writeResult) + ')',
  );

  console.log('');

  // -------------------------------------------------------------------------
  // 6. Zgodnosc stalej rotacji z main.ts::AUTOSAVE_ROT_COUNT.
  // -------------------------------------------------------------------------
  console.log('--- 6. Zgodnosc FSA_AUTOSAVE_ROT_COUNT z main.ts::AUTOSAVE_ROT_COUNT ---');

  const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');
  const m = mainTsSrc.match(/const AUTOSAVE_ROT_COUNT = (\d+);/);
  assert(!!m, 'main.ts::AUTOSAVE_ROT_COUNT znaleziony zrodlowo');
  if (m) {
    const mainCount = parseInt(m[1], 10);
    assert(
      mainCount === fsa.FSA_AUTOSAVE_ROT_COUNT,
      'main.ts::AUTOSAVE_ROT_COUNT (' + mainCount + ') === fsa-autosave.ts::FSA_AUTOSAVE_ROT_COUNT (' + fsa.FSA_AUTOSAVE_ROT_COUNT + ') -- zapis na dysk i do localStorage rotuja po tej samej liczbie slotow',
    );
  }

  // main.ts faktycznie importuje i uzywa nowego modulu (wpiecie, nie martwy kod).
  assert(/from '\.\/game\/fsa-autosave'/.test(mainTsSrc), "main.ts importuje z './game/fsa-autosave'");
  assert(/shouldUseFsaAutosave\(getFsaReadinessState\(\)\)/.test(mainTsSrc), 'main.ts::doRotatingAutosave uzywa shouldUseFsaAutosave(getFsaReadinessState()) do wyboru sciezki zapisu');
  assert(/triggerFsaAutosaveBootstrap\(\)/.test(mainTsSrc), 'main.ts wola triggerFsaAutosaveBootstrap() (co za kulisami woa ensureFsaAutosaveReady()) z klikniecia startu sesji');

  console.log('');

  // -------------------------------------------------------------------------
  // 7. BLOKER B2 (Evaluator runda 1) -- zrodlo main.ts: galaz FSA w
  //    doRotatingAutosave() NIE woa juz setLastPlayedSlotId(slot) z kluczem-
  //    klamstwem localStorage (dysk nic nie zapisal do localStorage), tylko
  //    wskaznik FSA_SLOT_PREFIX + autosaveFileName(idx) ktory prawdziwie
  //    odroznia plik na dysku od slotu localStorage.
  // -------------------------------------------------------------------------
  console.log('--- 7. BLOKER B2: galaz FSA nie klamie w setLastPlayedSlotId ---');

  const fsaBranchMatch = mainTsSrc.match(
    /shouldUseFsaAutosave\(getFsaReadinessState\(\)\)\) \{([\s\S]*?)const \{ ok, reason \} = saveToLocal\(slot, snapshot\);/,
  );
  assert(!!fsaBranchMatch, 'galaz FSA w doRotatingAutosave znaleziona (miedzy shouldUseFsaAutosave(...) a saveToLocal(slot, snapshot))');
  if (fsaBranchMatch) {
    const fsaBody = fsaBranchMatch[1];
    // Komentarze (PL+EN, wymóg CLAUDE.md §9) w tej gałęzi CELOWO opisują
    // słowami starą, usuniętą linię `setLastPlayedSlotId(slot)` -- surowy
    // regex na fsaBody złapałby więc TE komentarze, nie kod. Usuwamy
    // `/* ... */` i `// ...` przed asercją, żeby sprawdzać wyłącznie
    // rzeczywiście wykonywalny kod tej gałęzi.
    const fsaBodyCodeOnly = fsaBody
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    assert(
      !/setLastPlayedSlotId\(slot\)/.test(fsaBodyCodeOnly),
      'B2: galaz FSA NIE woa juz (w wykonywalnym kodzie, poza komentarzami) setLastPlayedSlotId(slot) z kluczem-klamstwem localStorage (dysk nic nie zapisal do localStorage) -- kod bez komentarzy: ' + JSON.stringify(fsaBodyCodeOnly.trim()),
    );
    assert(
      /setLastPlayedSlotId\(FSA_SLOT_PREFIX \+ autosaveFileName\(idx\)\)/.test(fsaBodyCodeOnly),
      'B2: galaz FSA woa setLastPlayedSlotId(FSA_SLOT_PREFIX + autosaveFileName(idx)) -- wskaznik prawdziwie odroznia plik na dysku od slotu localStorage',
    );
  }

  // -------------------------------------------------------------------------
  // 8. N2 -- jedyny call site doRotatingAutosave() ma .catch().
  // -------------------------------------------------------------------------
  console.log('--- 8. N2: .catch() na jedynym call site doRotatingAutosave() ---');
  assert(
    /doRotatingAutosave\(\)\.catch\(/.test(mainTsSrc),
    'N2: void doRotatingAutosave().catch(...) -- wyjatek, ktory mimo wewnetrznych try/catch/finally przecieklby, nie konczy sie unhandled rejection',
  );

  console.log('');

  // -------------------------------------------------------------------------
  // 9. BLOKER B1 -- mock odczytu z katalogu FSA: plik zapisany na dysku
  //    trafia z powrotem do listy zapisow do wczytania (bez prawdziwej
  //    przegladarki nie da sie przetestowac prawdziwego showDirectoryPicker/
  //    IndexedDB -- to pokrywa produkcyjny kod odczytu az do
  //    saveLoadDialog.ts::summarizeFsaSaveSlots(), ktora tylko owija te
  //    funkcje + saveContextLine()/DOM, poza zasiegiem testu pod plain Node).
  // -------------------------------------------------------------------------
  console.log('--- 9. BLOKER B1: mock odczytu katalogu FSA (plik -> lista zapisow) ---');
  {
    const files = {
      'civ-autosave-3.json': JSON.stringify({
        wersja: 2, tura: 42, seed: 7, units: [], cities: [], explored: [],
        meta: { label: 'Test dysk', savedAt: '2026-08-10T10:00:00.000Z' },
      }),
      'civ-autosave-7.json': JSON.stringify({ wersja: 2, tura: 10, seed: 3, units: [], cities: [], explored: [] }),
      'notes.txt': 'plik spoza konwencji nazw rotacji -- powinien byc pominiety',
    };
    const fakeDirHandle = {
      async *keys() {
        for (const name of Object.keys(files)) yield name;
      },
      async getFileHandle(name) {
        if (!(name in files)) throw new Error('brak pliku: ' + name);
        return { async getFile() { return { async text() { return files[name]; } }; } };
      },
    };
    fsa._setFsaStateForTests({ dirHandle: fakeDirHandle, permissionGranted: true });

    const listed = await fsa.listFsaAutosaveFiles();
    assert(listed.length === 2, 'listFsaAutosaveFiles() pomija plik spoza konwencji (notes.txt), zwraca 2 (got ' + listed.length + ')');
    assert(
      listed.some((f) => f.fileName === 'civ-autosave-3.json' && f.idx === 2),
      'listFsaAutosaveFiles() zwraca civ-autosave-3.json z idx=2 (0-based, odwrotnosc autosaveFileName)',
    );
    assert(
      listed.some((f) => f.fileName === 'civ-autosave-7.json' && f.idx === 6),
      'listFsaAutosaveFiles() zwraca civ-autosave-7.json z idx=6 (0-based)',
    );

    const raw = await fsa.readFsaAutosaveFile('civ-autosave-3.json');
    assert(raw === files['civ-autosave-3.json'], 'readFsaAutosaveFile() zwraca surowa tresc pliku z dysku');

    const loaded = await fsa.loadFsaAutosaveFile('civ-autosave-3.json');
    assert(
      !!loaded && loaded.tura === 42,
      'loadFsaAutosaveFile() deserializuje SaveGame z pliku (tura=42) -- ten sam ksztalt, ktory saveLoadDialog.ts::summarizeFsaSaveSlots() wstawia do listy zapisow do wczytania (got ' + JSON.stringify(loaded) + ')',
    );
    assert(
      !!loaded && loaded.meta && loaded.meta.label === 'Test dysk',
      'loadFsaAutosaveFile() zachowuje meta.label z pliku na dysku (etykieta widoczna w dialogu Wczytaj)',
    );

    const missing = await fsa.loadFsaAutosaveFile('civ-autosave-9.json');
    assert(missing === null, 'loadFsaAutosaveFile() dla nieistniejacego pliku -> null (nigdy nie rzuca, main.ts::loadGameFromSlot ma bezpieczny fallback)');

    fsa._resetFsaStateForTests();
    const listedAfterReset = await fsa.listFsaAutosaveFiles();
    assert(listedAfterReset.length === 0, 'po _resetFsaStateForTests() listFsaAutosaveFiles() znow zwraca [] (brak katalogu/zgody -- stan jak przed mockiem)');
  }

  console.log('');
  console.log('=== fsa-autosave-test: ' + pass + ' pass, ' + fail + ' fail ===');
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
})();
