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
  await check('4c. mutacja: cache bez ochrony generacji -> przypadek 3b MUSI oblać', async () => {
    const mutSrc = replaceOnce(presenceSrc, 'if (my > appliedRefresh && epochAtStart === presenceEpoch) {', 'if (true) {');
    const mut = bundleSource(mutSrc, SRC_PRESENCE);
    const gate = deferred();
    const c = mut.createSavePresenceCache({
      listSlots: async () => { await gate.promise; return []; },
      listFsaFiles: none, hasRememberedFsaDir: noDir,
    });
    const slow = c.refresh();
    c.markPresent();
    gate.resolve();
    await slow;
    assert.strictEqual(c.get(), false, 'mutant nadpisuje markPresent() -- to jest blad lapany przez 3b');
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

  console.log('\nload-game-regression: ' + passed + ' PASS / ' + failed + ' FAIL');
  process.exit(failed === 0 ? 0 : 1);
})();
