'use strict';
/**
 * load-game-regression-test.cjs
 *
 * R-WEB-LOAD-GAME-REGRESSION-Q1 -- „Wczytaj grę" w menu pauzy/głównym było
 * wyszarzone z „Brak zapisu" mimo istniejących zapisów (autozapis na dysk przez
 * File System Access, zgłoszenie właściciela 2026-10-24).
 *
 * Przyczyna: hasAnySaveSlot() / openLoadGameDialog() sprawdzały WYŁĄCZNIE
 * listSaves() (IndexedDB + localStorage). Autozapis FSA pisze civ-autosave-N.json
 * na dysk. Po przeładowaniu strony lista plików FSA jest pusta, dopóki gracz nie
 * kliknie (bootstrap FSA wymaga gestu), więc trzecim źródłem jest zapamiętany
 * uchwyt katalogu (IndexedDB).
 *
 * Zakres (wszystko poza sekcją 4 działa na PRAWDZIWYM kodzie, zbundlowanym esbuildem):
 *   1. save-presence.ts::anySavePresent -- źródła i błędy.
 *   2. fsa-autosave.ts (listFsaAutosaveFiles, hasRememberedFsaDirectory) z fałszywym
 *      uchwytem katalogu -- w tym stan „po przeładowaniu" (uchwyt jest, zgody nie ma).
 *   3. save-presence.ts::createSavePresenceCache -- stan, wyścigi generacji.
 *   4. Mutacje: zmodyfikowana kopia PRAWDZIWEGO źródła MUSI oblać test
 *      (stara logika; usunięty cache-guard; zamieniony wiring w main.ts).
 *   5. main.ts -- wiring (źródło): tylko ta część jest sprawdzana regexem;
 *      zachowania przeglądarki (klik, render menu) NIE są tu zmierzone.
 *
 * Uruchomienie: node tools/load-game-regression-test.cjs  (z katalogu gra/,
 * po `npm ci --ignore-scripts`).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const SRC_PRESENCE = path.join(GRA, 'src', 'game', 'save-presence.ts');
const SRC_FSA = path.join(GRA, 'src', 'game', 'fsa-autosave.ts');
const SRC_MAIN = path.join(GRA, 'src', 'main.ts');

let passed = 0;
let failed = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('PASS  ' + name); })
    .catch((e) => { failed++; console.log('FAIL  ' + name + '\n      ' + (e && e.message)); });
}

function bundleSource(sourceText, file) {
  const out = esbuild.buildSync({
    stdin: { contents: sourceText, resolveDir: path.dirname(file), sourcefile: file, loader: 'ts' },
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', out.outputFiles[0].text)(m, m.exports);
  return m.exports;
}
function loadModule(file) {
  return bundleSource(fs.readFileSync(file, 'utf8'), file);
}

function replaceOnce(src, from, to) {
  const n = src.split(from).length - 1;
  if (n !== 1) throw new Error('mutacja: oczekiwano 1 wystapienia, jest ' + n + ': ' + from.slice(0, 60));
  return src.replace(from, to);
}

const presence = loadModule(SRC_PRESENCE);
const fsa = loadModule(SRC_FSA);
const { anySavePresent, createSavePresenceCache } = presence;

const none = async () => [];
const throws = async () => { throw new Error('boom'); };
const idbSlots = async () => ['autosave-1', 'manual-1'];
const fsaFiles = async () => [{ fileName: 'civ-autosave-3.json', idx: 2 }];
const noDir = async () => false;
const hasDir = async () => true;

/** Fałszywy uchwyt katalogu FSA (keys/getFileHandle jak w fsa-autosave-test.cjs). */
function fakeDirHandle(names) {
  return {
    async *keys() { for (const n of names) yield n; },
    async getFileHandle(name) {
      if (!names.includes(name)) throw new Error('brak pliku: ' + name);
      return { async getFile() { return { async text() { return '{}'; } }; } };
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

(async () => {
  // ---- 1. Źródła i błędy (prawdziwe anySavePresent) ----
  await check('1a. tylko slot IDB -> true', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: idbSlots, listFsaFiles: none, hasRememberedFsaDir: noDir }), true);
  });
  await check('1b. tylko plik FSA na dysku -> true (regresja: autozapis na dysk)', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: none, listFsaFiles: fsaFiles, hasRememberedFsaDir: noDir }), true);
  });
  await check('1c. tylko zapamiętany katalog FSA (po przeładowaniu) -> true', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: none, listFsaFiles: none, hasRememberedFsaDir: hasDir }), true);
  });
  await check('1d. nic nigdzie -> false', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: none, listFsaFiles: none, hasRememberedFsaDir: noDir }), false);
  });
  await check('1e. wszystkie źródła rzucają -> false, bez rzucania, każde zgłoszone', async () => {
    const seen = [];
    const r = await anySavePresent({
      listSlots: throws, listFsaFiles: throws, hasRememberedFsaDir: throws,
      onSourceError: (src) => seen.push(src),
    });
    assert.strictEqual(r, false);
    assert.deepStrictEqual(seen, ['slots', 'fsa-files', 'fsa-dir']);
  });
  await check('1f. IDB rzuca, plik FSA jest -> true, błąd IDB zgłoszony (nie milczy)', async () => {
    const seen = [];
    const r = await anySavePresent({
      listSlots: throws, listFsaFiles: fsaFiles, hasRememberedFsaDir: noDir,
      onSourceError: (src) => seen.push(src),
    });
    assert.strictEqual(r, true);
    assert.deepStrictEqual(seen, ['slots']);
  });
  await check('1g. onSourceError rzucający nie psuje wyniku', async () => {
    const r = await anySavePresent({
      listSlots: throws, listFsaFiles: fsaFiles, hasRememberedFsaDir: noDir,
      onSourceError: () => { throw new Error('raport'); },
    });
    assert.strictEqual(r, true);
  });

  // ---- 2. Prawdziwy fsa-autosave.ts z fałszywym uchwytem ----
  await check('2a. bez stanu FSA (brak IDB w Node) -> brak uchwytu, lista pusta', async () => {
    assert.strictEqual(await fsa.hasRememberedFsaDirectory(), false);
    assert.deepStrictEqual(await fsa.listFsaAutosaveFiles(), []);
  });
  await check('2b. katalog żywy + zgoda -> listing widzi 2 pliki rotacji, pomija notes.txt', async () => {
    fsa._setFsaStateForTests({ dirHandle: fakeDirHandle(['civ-autosave-3.json', 'civ-autosave-7.json', 'notes.txt']), permissionGranted: true });
    const listed = await fsa.listFsaAutosaveFiles();
    assert.strictEqual(listed.length, 2);
    assert.strictEqual(await fsa.hasRememberedFsaDirectory(), true);
  });
  await check('2c. PO PRZELADOWANIU: uchwyt zapamiętany, zgody brak -> lista pusta, ale anySavePresent = true', async () => {
    // Stan po reloadzie: uchwyt jest w IDB (tu symulowany jako liveDirHandle bez zgody),
    // listFsaAutosaveFiles() zwraca [] bo nie ma livePermissionGranted.
    fsa._setFsaStateForTests({ dirHandle: fakeDirHandle(['civ-autosave-3.json']), permissionGranted: false });
    assert.deepStrictEqual(await fsa.listFsaAutosaveFiles(), []);
    const r = await anySavePresent({
      listSlots: none,
      listFsaFiles: fsa.listFsaAutosaveFiles,
      hasRememberedFsaDir: fsa.hasRememberedFsaDirectory,
    });
    assert.strictEqual(r, true, 'po przeladowaniu przycisk musi byc aktywny');
  });
  await check('2d. brak uchwytu i brak zgody -> false', async () => {
    fsa._setFsaStateForTests({ dirHandle: null, permissionGranted: false });
    const r = await anySavePresent({
      listSlots: none,
      listFsaFiles: fsa.listFsaAutosaveFiles,
      hasRememberedFsaDir: fsa.hasRememberedFsaDirectory,
    });
    assert.strictEqual(r, false);
  });

  // ---- 2e-2g. Zapamiętany uchwyt po przeładowaniu (gałąź perm !== 'granted' || !keys) ----
  const remembered = (perm, names) => ({
    queryPermission: async () => perm,
    keys: names ? async function* () { for (const n of names) yield n; } : undefined,
  });
  await check('2e. zapamiętany uchwyt, zgody brak (prompt) -> true (ZAŁOŻENIE; regresja: przycisk po przeładowaniu)', async () => {
    fsa._setFsaStateForTests({ dirHandle: null, permissionGranted: false });
    fsa._setPreloadedIdbHandleForTests(remembered('prompt', ['civ-autosave-1.json']));
    assert.strictEqual(await fsa.hasRememberedFsaDirectory(), true);
  });
  await check('2f. zapamiętany uchwyt z zgodą, ale katalog bez plików rotacji -> false (pusty katalog wyszarzony)', async () => {
    fsa._setFsaStateForTests({ dirHandle: null, permissionGranted: false });
    fsa._setPreloadedIdbHandleForTests(remembered('granted', ['notes.txt']));
    assert.strictEqual(await fsa.hasRememberedFsaDirectory(), false);
  });
  await check('2g. zapamiętany uchwyt, queryPermission rzuca -> true (jak prompt, bez zgadywania zgody)', async () => {
    fsa._setFsaStateForTests({ dirHandle: null, permissionGranted: false });
    fsa._setPreloadedIdbHandleForTests({ queryPermission: async () => { throw new Error('x'); }, keys: async function* () {} });
    assert.strictEqual(await fsa.hasRememberedFsaDirectory(), true);
  });
  fsa._setPreloadedIdbHandleForTests(null);

  // ---- 3. Cache (prawdziwy createSavePresenceCache) ----
  await check('3a. start: get() = false; po refresh z zapisem IDB = true', async () => {
    const c = createSavePresenceCache({ listSlots: idbSlots, listFsaFiles: none, hasRememberedFsaDir: noDir });
    assert.strictEqual(c.get(), false);
    assert.strictEqual(await c.refresh(), true);
    assert.strictEqual(c.get(), true);
  });
  await check('3b. wyścig: wolne przeliczenie (false) kończy się PO markPresent() -> cache nadal true', async () => {
    const gate = deferred();
    const c = createSavePresenceCache({
      listSlots: async () => { await gate.promise; return []; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    const slow = c.refresh();          // startuje, czeka na bramkę
    c.markPresent();                   // udany autozapis w międzyczasie
    gate.resolve();
    assert.strictEqual(await slow, false, 'wynik przeliczenia zwraca swój wynik');
    assert.strictEqual(c.get(), true, 'starsze przeliczenie NIE może nadpisać markPresent()');
  });
  await check('3c. wyścig: starsze wolne przeliczenie (true) nie nadpisuje nowszego (false)', async () => {
    const gateA = deferred();
    let call = 0;
    const c = createSavePresenceCache({
      listSlots: async () => { call++; if (call === 1) { await gateA.promise; return ['x']; } return []; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    const a = c.refresh();             // stary, wolny (true)
    const b = c.refresh();             // nowszy, szybki (false)
    assert.strictEqual(await b, false);
    assert.strictEqual(c.get(), false);
    gateA.resolve();
    assert.strictEqual(await a, true);
    assert.strictEqual(c.get(), false, 'stare przeliczenie nie moze wygrac z nowszym');
  });

  // ---- 4. Mutacje PRAWDZIWEGO kodu muszą oblewać testy ----
  const presenceSrc = fs.readFileSync(SRC_PRESENCE, 'utf8');
  await check('4a. mutacja: usunięty krok plików FSA -> przypadek 1b MUSI oblać', async () => {
    const mutSrc = replaceOnce(
      presenceSrc,
      'if ((await deps.listFsaFiles()).length > 0) return true;',
      '',
    );
    const mut = bundleSource(mutSrc, SRC_PRESENCE);
    const r = await mut.anySavePresent({ listSlots: none, listFsaFiles: fsaFiles, hasRememberedFsaDir: noDir });
    assert.strictEqual(r, false, 'mutant powinien zwracac false (to jest blad, ktory test lapie)');
    // Sam test 1b na prawdziwym kodzie daje true -- rozbieżność = czerwień.
    assert.notStrictEqual(r, await anySavePresent({ listSlots: none, listFsaFiles: fsaFiles, hasRememberedFsaDir: noDir }));
  });
  await check('4b. mutacja: usunięty krok „zapamiętany katalog" -> przypadek 1c MUSI oblać', async () => {
    const mutSrc = replaceOnce(
      presenceSrc,
      'if (await deps.hasRememberedFsaDir()) return true;',
      '',
    );
    const mut = bundleSource(mutSrc, SRC_PRESENCE);
    const r = await mut.anySavePresent({ listSlots: none, listFsaFiles: none, hasRememberedFsaDir: hasDir });
    assert.notStrictEqual(r, true, 'mutant bez kroku katalogu musi dac false w przypadku 1c');
  });
  await check('3d. regresja S2 (Chromium): startowe przeliczenie (true) zastosowane, mimo że nowsze trwa', async () => {
    const gateB = deferred();
    let call = 0;
    const c = createSavePresenceCache({
      listSlots: async () => { call++; if (call === 2) { await gateB.promise; return []; } return ['x']; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    const a = c.refresh();             // startowy, szybki (true)
    const b = c.refresh();             // nowszy, wolny (wstrzymany)
    assert.strictEqual(await a, true);
    assert.strictEqual(c.get(), true, 'startowy wynik true MUSI być widoczny od razu (przebudowa menu czyta get())');
    gateB.resolve();
    await b;
  });
  await check('3e. wyścig (zarzut 7): przeliczenie wystartowane PO markPresent czyta stary listing (false) -> cache nadal true', async () => {
    const gate = deferred();
    const c = createSavePresenceCache({
      listSlots: async () => { await gate.promise; return []; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    c.markPresent();
    const late = c.refresh();          // startuje po zapisie, listing jeszcze nie sfinalizowany
    gate.resolve();
    assert.strictEqual(await late, false, 'przeliczenie samo widzi false');
    assert.strictEqual(c.get(), true, 'zapis MUSI wygrać: false z przeliczenia nie wyszarza przycisku');
  });
  await check('4e. mutacja: markPresent nie jest trwały -> przypadek 3e MUSI oblać', async () => {
    const presenceSrc = fs.readFileSync(SRC_PRESENCE, 'utf8');
    const mutSrc = replaceOnce(presenceSrc, 'value = result || pinnedByWrite;', 'value = result;');
    const mut = bundleSource(mutSrc, SRC_PRESENCE);
    const gate = deferred();
    const c = mut.createSavePresenceCache({
      listSlots: async () => { await gate.promise; return []; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    c.markPresent();
    const late = c.refresh();
    gate.resolve();
    await late;
    assert.strictEqual(c.get(), false, 'mutant wyszarza przycisk -- blad lapany przez 3e');
  });
  await check('4f. mutacja: hasRememberedFsaDirectory bez zgody -> false (gałąź perm !== granted) -> przypadek 2e MUSI oblać', async () => {
    const fsaSrc = fs.readFileSync(SRC_FSA, 'utf8');
    const mutSrc = replaceOnce(fsaSrc, "if (perm !== 'granted' || typeof handle.keys !== 'function') return true;", "if (perm !== 'granted' || typeof handle.keys !== 'function') return false;");
    const mut = bundleSource(mutSrc, SRC_FSA);
    mut._setFsaStateForTests({ dirHandle: null, permissionGranted: false });
    mut._setPreloadedIdbHandleForTests(remembered('prompt', ['civ-autosave-1.json']));
    assert.notStrictEqual(await mut.hasRememberedFsaDirectory(), true, 'mutant -- blad lapany przez 2e');
  });
  await check('4c. mutacja: cache bez ochrony kolejności (starsze przeliczenie nadpisuje) -> przypadek 3c MUSI oblać', async () => {
    const mutSrc = replaceOnce(presenceSrc, 'if (my > appliedRefresh && epochAtStart === presenceEpoch) {', 'if (true) {');
    const mut = bundleSource(mutSrc, SRC_PRESENCE);
    const gateA = deferred();
    let call = 0;
    const c = mut.createSavePresenceCache({
      listSlots: async () => { call++; if (call === 1) { await gateA.promise; return ['x']; } return []; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    const a = c.refresh();
    const b = c.refresh();
    await b;
    gateA.resolve();
    await a;
    assert.notStrictEqual(c.get(), false, 'mutant pozwala staremu wynikowi nadpisac nowszy (prawdziwy kod daje false) -- blad lapany przez 3c');
  });
  await check('4d. mutacja: bootstrap-cache zamieniony na listSaves() -> wiring main.ts MUSI oblać', async () => {
    const mainSrc = fs.readFileSync(SRC_MAIN, 'utf8');
    assert.strictEqual(mainWiringOk(mainSrc), true, 'prawdziwy main.ts musi przejsc wiring');
    const mutMain = replaceOnce(mainSrc, 'await savePresence.refresh();\n    }\n    function hasAnySaveSlot', 'cachedX = (await listSaves()).length > 0;\n    }\n    function hasAnySaveSlot');
    assert.strictEqual(mainWiringOk(mutMain), false, 'wiring musi wykryc obejscie cache');
  });

  // ---- 5. Wiring main.ts (tylko źródło; zachowania przeglądarki NIE są tu mierzone) ----
  function mainWiringOk(src) {
    const cacheStart = src.indexOf('const savePresence = createSavePresenceCache({');
    const cacheEnd = src.indexOf('function openSaveGameDialog(');
    if (cacheStart < 0 || cacheEnd < 0 || cacheEnd < cacheStart) return false;
    const block = src.slice(cacheStart, cacheEnd);
    if (!/listFsaFiles:\s*listFsaAutosaveFiles/.test(block)) return false;
    if (!/hasRememberedFsaDir:\s*hasRememberedFsaDirectory/.test(block)) return false;
    if (!/await savePresence\.refresh\(\);/.test(block)) return false;
    if (/listSaves\(\)\)\.length/.test(block)) return false;
    return true;
  }
  await check('5a. main.ts: cache zasilany listSlots + listFsaAutosaveFiles + hasRememberedFsaDirectory', async () => {
    assert.ok(mainWiringOk(fs.readFileSync(SRC_MAIN, 'utf8')), 'wiring cache w main.ts niepoprawny');
  });
  await check('5b. main.ts: openLoadGameDialog liczy zapisy przez savePresence, nie samym listSaves()', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    const start = src.indexOf('async function openLoadGameDialog(');
    assert.ok(start > 0, 'nie znaleziono openLoadGameDialog');
    const body = src.slice(start, start + 600);
    assert.ok(!/listSaves\(\)\)\.length/.test(body), 'openLoadGameDialog nadal uzywa samego listSaves()');
    assert.ok(/savePresence\.refresh\(\)/.test(body), 'openLoadGameDialog nie korzysta z savePresence.refresh()');
  });
  await check('5c. main.ts: udane zapisy (ręczny, autozapis dysk, autozapis localStorage) -> savePresence.markPresent()', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    const n = (src.match(/savePresence\.markPresent\(\)/g) || []).length;
    assert.ok(n >= 3, 'oczekiwano >=3 wywolan markPresent(), jest ' + n);
    assert.ok(!/cachedHasAnySaveSlot/.test(src), 'zostala stara zmienna cachedHasAnySaveSlot');
  });
  await check('5d. main.ts: onLoad czeka na bootstrap FSA przed listowaniem', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    assert.ok(!/onLoad: \(\) => \{ void triggerFsaAutosaveBootstrap\(\); void openLoadGameDialog/.test(src),
      'onLoad nadal odpala listowanie bez czekania na bootstrap');
    assert.ok(/await triggerFsaAutosaveBootstrap\(\);\s*await openLoadGameDialog\(false\);/.test(src),
      'brak await triggerFsaAutosaveBootstrap() przed openLoadGameDialog(false)');
  });

  // ---- 6. (r5) Mutacja hasAnySaveSlot / cache w PRAWDZIWYM main.ts (wiring + zachowanie) ----
  function hasAnySaveSlotWiringOk(src) {
    const start = src.indexOf('function hasAnySaveSlot(): boolean {');
    if (start < 0) return false;
    const body = src.slice(start, start + 200);
    return /void refreshHasAnySaveSlotCache\(\);\s*return savePresence\.get\(\);/.test(body);
  }
  await check('6a. mutacja: hasAnySaveSlot zwraca stałe false zamiast cache -> wiring MUSI oblać', async () => {
    const mainSrc = fs.readFileSync(SRC_MAIN, 'utf8');
    assert.strictEqual(hasAnySaveSlotWiringOk(mainSrc), true, 'prawdziwy hasAnySaveSlot musi przejsc');
    const mutMain = replaceOnce(mainSrc, 'function hasAnySaveSlot(): boolean {\n      void refreshHasAnySaveSlotCache();\n      return savePresence.get();',
      'function hasAnySaveSlot(): boolean {\n      void refreshHasAnySaveSlotCache();\n      return false;');
    assert.strictEqual(hasAnySaveSlotWiringOk(mutMain), false, 'wiring musi wykryc stale false');
  });
  await check('6b. mutacja: cache presence zawsze false (get) -> przypadek 3a MUSI oblać', async () => {
    const mutSrc = replaceOnce(presenceSrc, 'get: () => value,', 'get: () => false,');
    const mut = bundleSource(mutSrc, SRC_PRESENCE);
    const c = mut.createSavePresenceCache({ listSlots: idbSlots, listFsaFiles: none, hasRememberedFsaDir: noDir });
    await c.refresh();
    assert.notStrictEqual(c.get(), true, 'mutant z get()=false -- blad lapany przez 3a');
  });

  // ---- 7. (r5) Jednorazowy komunikat o nieudanym autozapisie (notifyAutosaveFailureOnce) ----
  function extractNotifyOnce(src) {
    const start = src.indexOf('function notifyAutosaveFailureOnce(msg: string): void {');
    if (start < 0) return null;
    const end = src.indexOf('\n    }\n', start);
    if (end < 0) return null;
    return src.slice(start, end + '\n    }\n'.length - 1);
  }
  function runNotifyOnce(fnText) {
    const decl = 'let autosaveFailureNotified = false;\n';
    const prog = 'function __mk(showHintMessage: (m: string, ms: number) => void) {\n' + decl + fnText + '\n  return notifyAutosaveFailureOnce;\n}';
    const js = esbuild.transformSync(prog, { loader: 'ts' }).code;
    return new Function(js + '\nreturn __mk;')();
  }
  await check('7a. notifyAutosaveFailureOnce: prawdziwa funkcja z main.ts pokazuje komunikat RAZ na sesję', async () => {
    const fnText = extractNotifyOnce(fs.readFileSync(SRC_MAIN, 'utf8'));
    assert.ok(fnText, 'nie znaleziono notifyAutosaveFailureOnce w main.ts');
    const calls = [];
    const notify = runNotifyOnce(fnText)((m, ms) => calls.push([m, ms]));
    notify('Autozapis nieudany (blad zapisu)'); notify('Autozapis nieudany — brak miejsca'); notify('x');
    assert.strictEqual(calls.length, 1, 'komunikat musi pojawic sie dokladnie raz, jest ' + calls.length);
    assert.strictEqual(calls[0][0], 'Autozapis nieudany (blad zapisu)', 'pierwszy komunikat zostaje');
  });
  await check('7b. mutacja: bez strażnika jednorazowości -> przypadek 7a MUSI oblać', async () => {
    const fnText = extractNotifyOnce(fs.readFileSync(SRC_MAIN, 'utf8'));
    const mutText = replaceOnce(fnText, 'if (autosaveFailureNotified) return;', '');
    const calls = [];
    const notify = runNotifyOnce(mutText)((m, ms) => calls.push([m, ms]));
    notify('a'); notify('b');
    assert.notStrictEqual(calls.length, 1, 'mutant pokazuje wielokrotnie -- blad lapany przez 7a');
  });
  await check('7c. main.ts: nieudany autozapis nie wywołuje już showHintMessage wprost (3 miejsca przez notifyAutosaveFailureOnce)', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    assert.ok(!/showHintMessage\('Autozapis nieudany \(blad zapisu\)', 3000\)/.test(src), 'zostalo bezposrednie showHintMessage autozapisu');
    const n = (src.match(/notifyAutosaveFailureOnce\(/g) || []).length;
    assert.ok(n >= 4, 'oczekiwano >=4 wywolan (deklaracja + 4 miejsca), jest ' + n);
  });

  console.log('\nload-game-regression: ' + passed + ' PASS / ' + failed + ' FAIL');
  process.exit(failed === 0 ? 0 : 1);
})();
