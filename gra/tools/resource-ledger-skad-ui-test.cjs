'use strict';
/**
 * resource-ledger-skad-ui-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 4).
 *
 * Sprawdza warstwę danych i markup karty „Skąd zapasy” (czyste funkcje, bundle esbuild w node):
 *  (1) pamięć N tur: przycięcie do N, reset, późna mutacja rekordu tego samego ticku jest widoczna;
 *  (2) brak rekordu właściciela w ticku = pusta tura (nie błąd);
 *  (3) agregacja: jedna linia na (kierunek + etykieta), scalanie dwóch kluczy o tej samej etykiecie
 *      (dwie Warzelnie tego samego miasta), sortowanie przyrostów i ubytków po |suma|;
 *  (4) sól: „Warzelnia (<miasto>)” +, „Umowa wymiany z <civ>” +, „Obywatele” − jako osobne linie;
 *  (5) markup: jedna linia na źródło, znaki +/−, klasy gain/loss, escapowanie HTML, open dla soli;
 *  (6) etykiety bez surowych ID (brak znaku „|” w wyjściu HTML).
 *  (7) mutacja: pominięcie jednego ticku w oknie zmienia sumy (wykrywalne przez test 3).
 *
 * NIE obejmuje: realnego DOM panelu (empireDetailPanel.ts) ani zrzutu Chromium — patrz raport.
 * Uruchom z gra/: node tools/resource-ledger-skad-ui-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-skad-ui-test] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-skad-ui-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-skad-ui-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  createLedgerTurn,
  recordLedgerFlow,
  commitLedgerHistoryTick,
  resetLedgerHistory,
  ledgerHistoryLength,
  ledgerHistoryForOwner,
  ledgerSourceLinesForResource,
  readLedgerHistoryTurns,
} from '../src/game/resource-ledger';
export { resourceSourceLedgerDetailsHtml } from '../src/ui/resourceSourceLedgerHtml';
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
  console.error('[resource-ledger-skad-ui-test] bundle failed:', e.message || e);
  process.exit(1);
}

const L = require(BUNDLE_FILE);
const econ = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'econ-params.json'), 'utf8'));

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

function tickMap(ownerId, turn) {
  const m = new Map();
  if (turn) m.set(ownerId, turn);
  return m;
}

// ---------- (1) pamięć N tur ----------
console.log('(1) pamięć N tur');
L.resetLedgerHistory();
for (let i = 0; i < 25; i++) L.commitLedgerHistoryTick(new Map(), 10);
assert(L.ledgerHistoryLength() === 10, 'po 25 tickach z N=10 w pamięci jest 10 tur');
L.resetLedgerHistory();
assert(L.ledgerHistoryLength() === 0, 'reset czyści pamięć (nowa gra / wczytanie)');

const late = L.createLedgerTurn();
const mapTick = new Map([[0, late]]);
L.commitLedgerHistoryTick(mapTick, 10);
// późna mutacja tego samego ticku (np. utrzymanie po commicie) musi być widoczna przy odczycie
L.recordLedgerFlow(late, 'sol', 'obywatele|0', { kind: 'obywatele', label: 'Obywatele' }, -3);
const viewLate = L.ledgerHistoryForOwner(0);
assert(viewLate.length === 1 && viewLate[0].byResource.sol && viewLate[0].byResource.sol['obywatele|0'].amount === -3,
  'późny zapis do rekordu tego samego ticku jest widoczny w historii');

// ---------- (2) brak rekordu = pusta tura ----------
console.log('(2) brak rekordu właściciela');
L.resetLedgerHistory();
L.commitLedgerHistoryTick(new Map(), 10);
const emptyView = L.ledgerHistoryForOwner(0);
assert(emptyView.length === 1 && Object.keys(emptyView[0].byResource).length === 0,
  'owner bez rekordu w ticku = pusta tura (bez wyjątku)');

// ---------- (3) agregacja ----------
console.log('(3) agregacja źródeł');
const t1 = turnWith([
  { res: 'sol', key: 'warzelnia|11', kind: 'warzelnia', label: 'Warzelnia (Rzym)', amount: 12 },
  { res: 'sol', key: 'umowa|asyria', kind: 'umowa_wymiany', label: 'Umowa wymiany z Asyria', amount: 30 },
  { res: 'sol', key: 'obywatele|0', kind: 'obywatele', label: 'Obywatele', amount: -20 },
  { res: 'drewno', key: 'wycinka|0', kind: 'wycinka', label: 'Wycinka lasu', amount: 5 },
]);
const t2 = turnWith([
  { res: 'sol', key: 'warzelnia|12', kind: 'warzelnia', label: 'Warzelnia (Rzym)', amount: 8 },
]);
const t3 = turnWith([]);
const lines = L.ledgerSourceLinesForResource([t1, t2, t3], 'sol');
const summary = lines.map(l => `${l.gain ? '+' : '-'}${Math.abs(l.amount)} ${l.label}`);
assert(JSON.stringify(summary) === JSON.stringify([
  '+30 Umowa wymiany z Asyria',
  '+20 Warzelnia (Rzym)',
  '-20 Obywatele',
]), `sól: przyrosty malejąco, dwie Warzelnie scalone, ubytek osobno — got ${JSON.stringify(summary)}`);
assert(L.ledgerSourceLinesForResource([t1, t2], 'ceramika').length === 0, 'surowiec bez wpisów = pusta lista');
assert(L.ledgerSourceLinesForResource([t1], 'drewno').length === 1, 'drewno: jedna linia (wycinka)');

// (7) mutacja: pominięcie t2 zmienia sumę Warzelni z 20 na 12 (test wykrywa rozjazd)
const mutated = L.ledgerSourceLinesForResource([t1, t3], 'sol').find(l => l.label === 'Warzelnia (Rzym)');
assert(mutated && mutated.amount === 12, 'mutacja (pominięty tick) daje inną sumę — test czerwieni się przy pominięciu');

// ---------- (4)/(5)/(6) markup ----------
console.log('(5) markup karty');
const html = L.resourceSourceLedgerDetailsHtml(lines, 10, true);
assert(html.includes('<details class="civ-emp-res-skad" open>'), 'sól: blok domyślnie otwarty');
assert(html.includes('Skąd zapasy (ostatnie 10 tur)'), 'podpis z liczbą tur');
assert(html.includes('<span class="v">+30</span>') && html.includes('<span class="v">+20</span>'), 'przyrosty z plusem');
assert(html.includes('<span class="v">−20</span>'), 'ubytek z minusem');
assert(html.includes('civ-emp-res-skad-row gain') && html.includes('civ-emp-res-skad-row loss'), 'klasy gain/loss');
assert(!html.includes('|'), '(6) bez surowych ID w wyjściu HTML');

const closed = L.resourceSourceLedgerDetailsHtml(lines, 10, false);
assert(!closed.includes(' open'), 'pozostałe surowce: blok zwinięty');

const xss = L.resourceSourceLedgerDetailsHtml([{ gain: true, label: '<img src=x onerror=1> & "q"', kind: 'teren', amount: 1 }], 3, false);
assert(!xss.includes('<img') && xss.includes('&lt;img') && xss.includes('&amp;') && xss.includes('&quot;q&quot;'),
  'etykieta escapowana (brak wstrzyknięcia HTML)');

// ---------- (N) parametr N z econ-params ----------
console.log('(N) parametr N');
assert(L.readLedgerHistoryTurns(econ, 'normal') === 10, 'N z econ-params = 10');
assert(L.readLedgerHistoryTurns(undefined, 'hard') === 10, 'brak parametru = domyślne 10');

// ---------- cleanup ----------
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }

console.log(`\nresource-ledger-skad-ui-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
