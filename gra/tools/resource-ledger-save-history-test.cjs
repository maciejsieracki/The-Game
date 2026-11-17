'use strict';
/**
 * resource-ledger-save-history-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 3b, kryterium b).
 *
 * Sprawdza zapis pamięci N tur w zapisie gry (czyste funkcje, bundle esbuild w node):
 *  (1) zapis -> JSON -> odczyt zachowuje dziennik (≥1 surowiec z ≥2 źródłami, dwóch właścicieli);
 *  (2) stary zapis bez pola (undefined) = pusty dziennik, bez wyjątku;
 *  (3) złe kształty (null, string, zła tura, zły przepływ) są pomijane, bez wyjątku;
 *  (4) odczyt przycina do ostatnich N ticków (najnowsze zostają);
 *  (5) kopia do zapisu jest niezależna od późniejszych mutacji rekordów (zapis = migawka);
 *  (6) mutacja: usunięcie źródła z zapisanego dziennika zmienia sumę odczytaną (wykrywalne).
 *
 * Uruchom z gra/: node tools/resource-ledger-save-history-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-save-history-test] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-save-history-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-save-history-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  createLedgerTurn,
  recordLedgerFlow,
  commitLedgerHistoryTick,
  resetLedgerHistory,
  ledgerHistoryLength,
  ledgerHistoryForOwner,
  ledgerSourceLinesForResource,
  ledgerHistoryToSave,
  restoreLedgerHistoryFromSave,
} from '../src/game/resource-ledger';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[resource-ledger-save-history-test] bundle failed:', e.message || e);
  process.exit(1);
}

const L = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ok   ${msg}`); }
  else { failed++; console.log(`  FAIL ${msg}`); }
}

function turnWith(entries) {
  const t = L.createLedgerTurn();
  for (const e of entries) L.recordLedgerFlow(t, e.res, e.key, { kind: e.kind, label: e.label }, e.amount);
  return t;
}

/** Dwie tury z dwoma źródłami soli u właściciela 1 i jednym u właściciela 2. */
function buildRecords(turnIdx) {
  const m = new Map();
  m.set(1, turnWith([
    { res: 'sol', key: `warzelnia|1|${turnIdx}`, kind: 'warzelnia', label: 'Warzelnia (Rzym)', amount: 12 + turnIdx },
    { res: 'sol', key: `umowa|1|${turnIdx}`, kind: 'umowa_wymiany', label: 'Umowa wymiany z Asyria', amount: 30 },
    { res: 'sol', key: `obywatele|1`, kind: 'obywatele', label: 'Obywatele', amount: -20 },
  ]));
  m.set(2, turnWith([
    { res: 'drewno', key: `wycinka|2`, kind: 'wycinka', label: 'Wycinka (Ateny)', amount: 8 },
  ]));
  return m;
}

const SOURCE_KEY_LABELS = (turns) => {
  const out = {};
  for (const t of turns) for (const [res, bySource] of Object.entries(t.byResource)) {
    for (const [k, f] of Object.entries(bySource)) out[`${res}|${k}`] = f.label + ':' + f.amount;
  }
  return out;
};

console.log('\n== (1) zapis -> JSON -> odczyt zachowuje dziennik ==');
L.resetLedgerHistory();
for (let i = 0; i < 3; i++) L.commitLedgerHistoryTick(buildRecords(i), 10);
const before = L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(1), 'sol');
const saved = JSON.parse(JSON.stringify(L.ledgerHistoryToSave()));
const savedBytes = Buffer.byteLength(JSON.stringify(saved), 'utf8');
console.log(`  info rozmiar pola resourceLedgerHistory (3 tury, 2 właścicieli): ${savedBytes} B`);
L.restoreLedgerHistoryFromSave(saved, 10);
assert(L.ledgerHistoryLength() === 3, 'po odczycie: 3 tury w dzienniku');
const after = L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(1), 'sol');
assert(JSON.stringify(before) === JSON.stringify(after), 'linie źródeł soli identyczne przed zapisem i po wczytaniu');
assert(after.filter(l => l.gain).length >= 2, 'sól ma co najmniej dwa źródła przyrostu (≥2 źródła)');
assert(after.some(l => !l.gain && l.label === 'Obywatele'), 'ubytek „Obywatele” zachowany');
const ownerTwo = L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(2), 'drewno');
assert(ownerTwo.length === 1 && ownerTwo[0].label === 'Wycinka (Ateny)' && ownerTwo[0].amount === 24,
  'drugi właściciel: wycinka zachowana (suma 3 tur = 24)');

console.log('\n== (2) stary zapis bez pola = pusty dziennik ==');
L.commitLedgerHistoryTick(buildRecords(9), 10);
L.restoreLedgerHistoryFromSave(undefined, 10);
assert(L.ledgerHistoryLength() === 0, 'undefined -> pusty dziennik');
L.commitLedgerHistoryTick(buildRecords(9), 10);
L.restoreLedgerHistoryFromSave(null, 10);
assert(L.ledgerHistoryLength() === 0, 'null -> pusty dziennik');

console.log('\n== (3) złe kształty pomijane bez wyjątku ==');
let threw = false;
try {
  L.restoreLedgerHistoryFromSave([
    null,
    'nie-obiekt',
    { '1': null, 'x': { byResource: {} }, '2': { byResource: { sol: { a: { kind: 'x', label: 'Y', amount: 'nie-liczba' } } } } },
    { '3': { byResource: { sol: { ok: { kind: 'warzelnia', label: 'Warzelnia (Rzym)', amount: 5 } } } } },
  ], 10);
} catch (e) { threw = true; }
assert(!threw, 'złe kształty nie rzucają wyjątku');
assert(L.ledgerHistoryLength() === 2, 'dwa ticki w dzienniku (null i string pominięte; tick z samymi błędnymi wpisami = pusta tura)');
const onlyValid = L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(3), 'sol');
assert(onlyValid.length === 1 && onlyValid[0].amount === 5, 'poprawny przepływ właściciela 3 odczytany (5)');
assert(L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(2), 'sol').length === 0,
  'przepływ z amount nie-liczbą odrzucony');

console.log('\n== (4) przycięcie do N ticków (najnowsze zostają) ==');
const many = [];
for (let i = 0; i < 15; i++) many.push({ '1': { byResource: { sol: { k: { kind: 'warzelnia', label: 'Tura ' + i, amount: i + 1 } } } } });
L.restoreLedgerHistoryFromSave(many, 10);
assert(L.ledgerHistoryLength() === 10, 'po odczycie z N=10: 10 ticków');
const lines = L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(1), 'sol');
const sumKept = lines.reduce((s, l) => s + l.amount, 0);
assert(sumKept === (6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15), 'zostały tury 6..15 (suma 105)');

console.log('\n== (5) migawka zapisu niezależna od późniejszych mutacji ==');
L.resetLedgerHistory();
const live = buildRecords(0);
L.commitLedgerHistoryTick(live, 10);
const snap = L.ledgerHistoryToSave();
L.recordLedgerFlow(live.get(1), 'sol', 'warzelnia|1|0', { kind: 'warzelnia', label: 'Warzelnia (Rzym)' }, 1000);
const snapSum = L.ledgerSourceLinesForResource([snap[0]['1']], 'sol').reduce((s, l) => s + l.amount, 0);
assert(snapSum === 12 + 30 - 20, 'migawka nie widzi późniejszej mutacji (suma 22, nie 1022)');

console.log('\n== (6) mutacja: pominięcie źródła w zapisie zmienia odczyt ==');
L.resetLedgerHistory();
L.commitLedgerHistoryTick(buildRecords(0), 10);
const mutated = JSON.parse(JSON.stringify(L.ledgerHistoryToSave()));
delete mutated[0]['1'].byResource.sol['umowa|1|0'];
L.restoreLedgerHistoryFromSave(mutated, 10);
const mutSum = L.ledgerSourceLinesForResource(L.ledgerHistoryForOwner(1), 'sol').reduce((s, l) => s + l.amount, 0);
assert(mutSum !== 22, `mutacja (brak źródła „Umowa wymiany”) zmienia sumę soli (${mutSum} != 22)`);

L.resetLedgerHistory();
try { fs.unlinkSync(ENTRY_FILE); fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }

console.log(`\nresource-ledger-save-history-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
