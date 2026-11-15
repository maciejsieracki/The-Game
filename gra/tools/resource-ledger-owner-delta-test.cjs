'use strict';
/**
 * resource-ledger-owner-delta-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 3c).
 *
 * Test czystych helperów księgi dla zmian posiadania / zwrotów (łup, zwrot rekrutacji i rozwiązania,
 * zdobycie / oddanie / bunt miasta, dar): snapshotOwnersStock + recordOwnersStockDeltaToPending.
 * Zakres: test NIE dowodzi, że wpięcia w main.ts są wywoływane na realnej ścieżce gry; to pokrywa
 * tools/resource-ledger-live-measure.cjs, a tylko dla źródeł, które w danym przebiegu wystąpiły.
 *
 * Uruchomienie (z gra/): node tools/resource-ledger-owner-delta-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-owner-delta-test] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-owner-delta-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-owner-delta-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  drainPendingLedgerInto,
  resetPendingLedger,
  peekPendingLedger,
  snapshotOwnersStock,
  recordOwnersStockDeltaToPending,
} from '../src/game/resource-ledger';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
const L = require(BUNDLE_FILE);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }

let pass = 0;
let fail = 0;
const check = (name, ok) => {
  if (ok) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

// Stan symulowany: dwa właściciele, zapasy per właściciel.
const stock = { 1: { drewno: 100, sol: 10, ruda: 0 }, 2: { drewno: 50, sol: 0, ruda: 0 } };
const stockOf = o => stock[o] || {};

// 1) Zdobycie miasta: 40 drewna przechodzi od 1 do 2 (etykiety per właściciel).
L.resetPendingLedger();
const snap = L.snapshotOwnersStock([1, 2], stockOf);
stock[1].drewno -= 40;
stock[2].drewno += 40;
L.recordOwnersStockDeltaToPending(snap, stockOf, 'przejecie-miasta|c1',
  o => (o === 2 ? { kind: 'przejecie_miasta', label: 'Zdobycie miasta' } : { kind: 'przejecie_miasta', label: 'Oddanie miasta' }));
const pend = L.peekPendingLedger();
const d1 = (pend.get(1) && pend.get(1).byResource.drewno) || {};
const d2 = (pend.get(2) && pend.get(2).byResource.drewno) || {};
check('zdobycie: właściciel 1 ma ubytek -40 z etykietą „Oddanie miasta”',
  d1['przejecie-miasta|c1|1'] && d1['przejecie-miasta|c1|1'].amount === -40 && d1['przejecie-miasta|c1|1'].label === 'Oddanie miasta');
check('zdobycie: właściciel 2 ma przyrost +40 z etykietą „Zdobycie miasta”',
  d2['przejecie-miasta|c1|2'] && d2['przejecie-miasta|c1|2'].amount === 40 && d2['przejecie-miasta|c1|2'].label === 'Zdobycie miasta');
const sumAll = Object.values(d1).concat(Object.values(d2)).reduce((s, f) => s + f.amount, 0);
check('zdobycie: suma zmian obu właścicieli = 0 (przeniesienie, nie kreacja)', sumAll === 0);

// 2) Drain do rekordu tury: okno trafia do tury, okno czyszczone.
const turns = new Map();
L.drainPendingLedgerInto(turns);
const t2 = turns.get(2);
check('drain: rekord tury właściciela 2 zawiera źródło zdobycia',
  !!t2 && !!t2.byResource.drewno && t2.byResource.drewno['przejecie-miasta|c1|2'] && t2.byResource.drewno['przejecie-miasta|c1|2'].amount === 40);
check('drain: okno pending opróżnione', L.peekPendingLedger().size === 0);

// 3) Brak zmiany magazynu = brak wpisu w rekordzie (zero nie jest księgowane).
L.resetPendingLedger();
const snap2 = L.snapshotOwnersStock([1], stockOf);
L.recordOwnersStockDeltaToPending(snap2, stockOf, 'lup-bitwy', { kind: 'lup_bitwy', label: 'Łup z bitwy' });
const p3 = L.peekPendingLedger().get(1);
check('brak zmiany magazynu = brak wpisu w oknie', !p3 || Object.keys(p3.byResource).length === 0);

// 4) Łup: przyrost zwycięzcy trafia z etykietą łupu i rodzajem lup_bitwy.
const snap3 = L.snapshotOwnersStock([1], stockOf);
stock[1].ruda = (stock[1].ruda || 0) + 15;
L.recordOwnersStockDeltaToPending(snap3, stockOf, 'lup-bitwy', { kind: 'lup_bitwy', label: 'Łup z bitwy' });
const lup = L.peekPendingLedger().get(1).byResource.ruda['lup-bitwy|1'];
check('łup: wpis +15 z etykietą „Łup z bitwy” i rodzajem lup_bitwy',
  !!lup && lup.amount === 15 && lup.label === 'Łup z bitwy' && lup.kind === 'lup_bitwy');

// 5) Snapshot jest kopią: późniejsza mutacja magazynu nie zmienia migawki.
L.resetPendingLedger();
const snap4 = L.snapshotOwnersStock([2], stockOf);
stock[2].sol += 5;
check('migawka jest kopią (zmiana po migawce nie zmienia snap)', snap4.get(2).sol === 0);

L.resetPendingLedger();
console.log('RESULT ' + pass + ' passed, ' + fail + ' failed');
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
