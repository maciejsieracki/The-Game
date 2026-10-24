'use strict';
/**
 * load-game-regression-test.cjs
 *
 * R-WEB-LOAD-GAME-REGRESSION-Q1 -- „Wczytaj grę" w menu pauzy było wyszarzone
 * z „Brak zapisu" mimo trwającej gry z aktywnym autozapisem (zgłoszenie
 * właściciela 2026-10-24).
 *
 * Przyczyna: hasAnySaveSlot() / openLoadGameDialog() w main.ts sprawdzały
 * WYŁĄCZNIE listSaves() (IndexedDB + legacy localStorage). Autozapis w trybie
 * File System Access pisze rotację civ-autosave-N.json NA DYSK i nic nie
 * dopisuje do IDB, więc "Wczytaj" widziało zero zapisów.
 *
 * Zakres:
 *   1. Logika: gra/src/game/save-presence.ts::anySavePresent (prawdziwy kod,
 *      zbundlowany esbuildem) -- przypadki: tylko IDB, tylko plik FSA (regresja),
 *      nic, błąd źródła, oba źródła.
 *   2. Mutacja: wersja „stara" (tylko listSlots) MUSI oblać przypadek FSA-only.
 *   3. Źródło main.ts: listing używa anySavePresent z listFsaAutosaveFiles;
 *      openLoadGameDialog nie woła już samego listSaves().length; udany
 *      autozapis (obie gałęzie) ustawia cachedHasAnySaveSlot = true; onLoad
 *      czeka na bootstrap FSA przed listowaniem.
 *
 * Uruchomienie: node gra/tools/load-game-regression-test.cjs  (z katalogu gra/,
 * po `npm ci --ignore-scripts`).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const SRC_PRESENCE = path.join(GRA, 'src', 'game', 'save-presence.ts');
const SRC_MAIN = path.join(GRA, 'src', 'main.ts');

let passed = 0;
let failed = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('PASS  ' + name); })
    .catch((e) => { failed++; console.log('FAIL  ' + name + '\n      ' + (e && e.message)); });
}

function loadModule(file) {
  const out = esbuild.buildSync({
    entryPoints: [file],
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

const { anySavePresent } = loadModule(SRC_PRESENCE);

// Stara (zepsuta) logika z main.ts przed poprawką: tylko listSaves().
async function oldHasAnySave(listSlots) {
  return (await listSlots()).length > 0;
}

const none = async () => [];
const throws = async () => { throw new Error('boom'); };
const idbSlots = async () => ['autosave-1', 'manual-1'];
const fsaFiles = async () => [{ fileName: 'civ-autosave-3.json', idx: 2 }];

(async () => {
  await check('1a. tylko slot IDB -> true', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: idbSlots, listFsaFiles: none }), true);
  });

  await check('1b. tylko plik FSA na dysku -> true (regresja: autozapis na dysk)', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: none, listFsaFiles: fsaFiles }), true);
  });

  await check('1c. nic nigdzie -> false', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: none, listFsaFiles: none }), false);
  });

  await check('1d. oba zrodla bledne -> false, bez rzucania', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: throws, listFsaFiles: throws }), false);
  });

  await check('1e. IDB blad, FSA ma plik -> true', async () => {
    assert.strictEqual(await anySavePresent({ listSlots: throws, listFsaFiles: fsaFiles }), true);
  });

  await check('2. mutacja: stara logika (tylko listSaves) oblewa przypadek FSA-only', async () => {
    const oldResult = await oldHasAnySave(none);
    assert.strictEqual(oldResult, false, 'stara logika powinna zwracac false przy samym pliku FSA');
    const newResult = await anySavePresent({ listSlots: none, listFsaFiles: fsaFiles });
    assert.notStrictEqual(newResult, oldResult, 'poprawka musi zmieniac wynik dla FSA-only');
  });

  await check('3a. main.ts: listing zapisów obejmuje pliki FSA (anySavePresent + listFsaAutosaveFiles)', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    assert.ok(/anySavePresent\(\{\s*listSlots:\s*listSaves,\s*listFsaFiles:\s*listFsaAutosaveFiles\s*\}\)/.test(src),
      'brak wywolania anySavePresent z listFsaAutosaveFiles w main.ts');
  });

  await check('3b. main.ts: openLoadGameDialog nie liczy zapisów samym listSaves()', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    const start = src.indexOf('async function openLoadGameDialog(');
    assert.ok(start > 0, 'nie znaleziono openLoadGameDialog');
    const body = src.slice(start, start + 600);
    assert.ok(!/listSaves\(\)\)\.length/.test(body), 'openLoadGameDialog nadal uzywa samego listSaves()');
    assert.ok(/anySaveAvailable\(\)/.test(body), 'openLoadGameDialog nie korzysta z anySaveAvailable()');
  });

  await check('3c. main.ts: udany autozapis (dysk i localStorage) ustawia cache na true', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    const n = (src.match(/cachedHasAnySaveSlot = true;/g) || []).length;
    assert.ok(n >= 3, 'oczekiwano >=3 ustawien cachedHasAnySaveSlot = true (zapis reczny, autozapis FSA, autozapis localStorage), jest ' + n);
  });

  await check('3d. main.ts: onLoad czeka na bootstrap FSA przed listowaniem', async () => {
    const src = fs.readFileSync(SRC_MAIN, 'utf8');
    assert.ok(!/onLoad: \(\) => \{ void triggerFsaAutosaveBootstrap\(\); void openLoadGameDialog/.test(src),
      'onLoad nadal odpala listowanie bez czekania na bootstrap');
    assert.ok(/await triggerFsaAutosaveBootstrap\(\);\s*await openLoadGameDialog\(false\);/.test(src),
      'brak await triggerFsaAutosaveBootstrap() przed openLoadGameDialog(false)');
  });

  console.log('\nload-game-regression: ' + passed + ' PASS / ' + failed + ' FAIL');
  process.exit(failed === 0 ? 0 : 1);
})();
