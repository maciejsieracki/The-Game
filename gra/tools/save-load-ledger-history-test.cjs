'use strict';
/**
 * R-WEB-SAVE-LOAD-LEDGER-HISTORY-LOST-AFTER-LOAD-Q1 — test regresji (statyczny + bundle esbuild w node).
 *
 * Przyczyna (ustalona w kodzie): `deserializeGame()` (gra/src/game/save.ts) składa obiekt zapisu z JAWNEJ listy pól.
 * Pole `resourceLedgerHistory` nie było na tej liście, więc każde wczytanie z magazynu (loadFromLocal ->
 * deserializeGame -> restoreGameFromSave) gubiło dziennik „Skąd zapasy”, choć był w zapisie. Ścieżka tej samej sesji
 * omija deserializację (buildSaveGameSnapshot -> restoreGameFromSave), stąd round-trip 3→3 w tej samej sesji.
 *
 * Sprawdza:
 *  (1) statycznie: deserializeGame przepisuje pole resourceLedgerHistory;
 *  (2) zapis (serializeGame) -> odczyt (deserializeGame) -> restoreLedgerHistoryFromSave zachowuje 3 tury i sumy;
 *  (3) stary zapis bez pola -> undefined -> pusty dziennik, bez wyjątku;
 *  (4) MUTACJA na KOPII save.ts (linia z polem usunięta): asercja (2) MUSI się wtedy nie powieść.
 *
 * Uruchom z gra/: node tools/save-load-ledger-history-test.cjs   (wymaga gra/node_modules: npm ci)
 */

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const SAVE_SRC = path.join(GRA, 'src', 'game', 'save.ts');
const MUT_SRC = path.join(GRA, 'src', 'game', '.save-ledger-history-mutant-tmp.ts');
const FIELD_LINE = 'resourceLedgerHistory: Array.isArray(obj2.resourceLedgerHistory)';
const TMP_DIR = __dirname;

let pass = 0;
let fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('PASS: ' + name); }
  catch (e) { fail++; console.log('FAIL: ' + name + ' -- ' + String(e.message || e).split('\n')[0]); }
}

/** Bundluje entry (w tools/) eksportujący serializer i dziennik; `saveImport` = ścieżka względem tools/. */
async function bundleApi(saveImport, tag) {
  const entry = path.join(TMP_DIR, `.save-ledger-history-${tag}-entry.ts`);
  const outfile = path.join(TMP_DIR, `.save-ledger-history-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, [
    `export { serializeGame, deserializeGame } from '${saveImport}';`,
    `export { restoreLedgerHistoryFromSave, ledgerHistoryLength, ledgerHistoryForOwner, ledgerHistoryToSave,`,
    `  commitLedgerHistoryTick, createLedgerTurn, recordLedgerFlow, resetLedgerHistory } from '../src/game/resource-ledger';`,
  ].join('\n'), 'utf8');
  try {
    await esbuild.build({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile,
      absWorkingDir: GRA, logLevel: 'silent',
    });
    return require(outfile);
  } finally {
    fs.rmSync(entry, { force: true });
    fs.rmSync(outfile, { force: true });
  }
}

/** Dziennik 3 tur, dwóch właścicieli: podatek 5·t i utrzymanie −2 na turę. */
function fillHistory(api) {
  api.resetLedgerHistory();
  for (let t = 1; t <= 3; t++) {
    const m = new Map();
    for (const owner of [0, 1]) {
      const turn = api.createLedgerTurn();
      api.recordLedgerFlow(turn, 'zloto', 'podatek|' + owner, { kind: 'teren', label: 'Podatek' }, 5 * t);
      api.recordLedgerFlow(turn, 'zloto', 'utrzymanie|' + owner, { kind: 'teren', label: 'Utrzymanie' }, -2);
      m.set(owner, turn);
    }
    api.commitLedgerHistoryTick(m, 10);
  }
  return api.ledgerHistoryToSave(() => true);
}

function saveWith(history) {
  return {
    wersja: 3, tura: 4, seed: 9, units: [], cities: [], exploredByHuman: [], gracze: [],
    humanOwnerIds: [0], activeHumanOwnerId: 0, meta: {},
    ...(history === undefined ? {} : { resourceLedgerHistory: history }),
  };
}

/** Sumę zł dla właściciela 0 po odczycie: 3 tury × (5t) = 30 podatek, −6 utrzymanie = 24. */
function ownerZlotoTotal(api, ownerId) {
  return api.ledgerHistoryForOwner(ownerId).reduce(
    (acc, turn) => acc + Object.values(turn.byResource.zloto ?? {}).reduce((a, f) => a + f.amount, 0), 0);
}

/** Wspólna asercja (2): round-trip przez prawdziwy serializer + restore; zwraca błąd albo null. */
function roundTripAssertions(api, history) {
  const back = api.deserializeGame(api.serializeGame(saveWith(history)));
  assert.ok(Array.isArray(back.resourceLedgerHistory), 'resourceLedgerHistory nie jest tablicą po deserializeGame');
  assert.equal(back.resourceLedgerHistory.length, 3, 'liczba tur po odczycie z zapisu');
  api.resetLedgerHistory();
  api.restoreLedgerHistoryFromSave(back.resourceLedgerHistory, 10);
  assert.equal(api.ledgerHistoryLength(), 3, 'liczba tur w pamięci po restore');
  assert.equal(ownerZlotoTotal(api, 0), 24, 'suma zł właściciela 0 po restore');
}

async function main() {
  const src = fs.readFileSync(SAVE_SRC, 'utf8');
  const api = await bundleApi('../src/game/save', 'main');
  const history = fillHistory(api);

  check('(1) deserializeGame przepisuje pole resourceLedgerHistory', () => {
    assert.ok(src.includes(FIELD_LINE), 'brak linii ' + FIELD_LINE + ' w save.ts');
  });

  check('(2) zapis -> odczyt -> restore zachowuje 3 tury i sumy', () => {
    assert.equal(history.length, 3, 'fixture: dziennik ma 3 tury');
    roundTripAssertions(api, history);
  });

  check('(3) stary zapis bez pola -> pusty dziennik, bez wyjątku', () => {
    const back = api.deserializeGame(api.serializeGame(saveWith(undefined)));
    assert.equal(back.resourceLedgerHistory, undefined);
    api.resetLedgerHistory();
    api.restoreLedgerHistoryFromSave(back.resourceLedgerHistory, 10);
    assert.equal(api.ledgerHistoryLength(), 0);
  });

  // (4) mutacja na KOPII: bez linii z polem asercja (2) MUSI się nie powieść.
  const mutSrc = src.split('\n').filter(l => !l.includes(FIELD_LINE)).join('\n');
  if (mutSrc.length === src.length) throw new Error('mutacja nie usunęła linii (wzorzec nieznaleziony)');
  fs.writeFileSync(MUT_SRC, mutSrc, 'utf8');
  let mutantFailed = false;
  let mutantReason = '';
  try {
    const mutApi = await bundleApi('../src/game/.save-ledger-history-mutant-tmp', 'mutant');
    roundTripAssertions(mutApi, fillHistory(mutApi));
  } catch (e) {
    mutantFailed = true;
    mutantReason = String(e.message || e).split('\n')[0];
  } finally {
    fs.rmSync(MUT_SRC, { force: true });
  }
  check('(4) mutacja (bez pola w deserializeGame) jest czerwona', () => {
    assert.equal(mutantFailed, true, 'mutant przeszedl -- test nie wykrywa utraty dziennika');
    console.log('     mutant: ' + mutantReason);
  });

  console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
