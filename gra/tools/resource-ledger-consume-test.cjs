'use strict';
/**
 * resource-ledger-consume-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partia 2, ZUŻYCIE).
 *
 * Sprawdza:
 *  (1) allocateTakenToLedgerParts: suma części = faktycznie pobrana ilość (per surowiec);
 *  (2) deductBuildingStockCostAcrossCities z dziennikiem: zmiana magazynu = suma wpisów księgi,
 *      różnica 0, 30 tur, 3 surowce, z przypadkami częściowego pokrycia (koszt > zapas);
 *  (3) mutacja: pominięcie zapisu utrzymania daje rozjazd (różnica != 0);
 *  (4) brak wpływu na stan: magazyn miast identyczny z księgą i bez księgi (30 tur);
 *  (5) ledgerSinkForUpkeep / ledgerSinkForCitizens zwracają undefined bez rekordu tury.
 *
 * Zakres: helpery silnika + ta sama sekwencja mutacji co tura (przychód, utrzymanie, obywatele).
 * NIE obejmuje main.ts (pętla gry nie jest uruchamialna w node) -- patrz raport tematu.
 *
 * Uruchom z gra/: node tools/resource-ledger-consume-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-consume-test] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-consume-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-consume-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { deductBuildingStockCostAcrossCities, creditOwnerResourceStock } from '../src/game/building-stock-cost';
export {
  createLedgerTurn,
  recordLedgerFlow,
  ledgerResourceNet,
  allocateTakenToLedgerParts,
  upkeepLedgerParts,
  citizenLedgerParts,
  recordTakenToLedger,
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
  console.error('[resource-ledger-consume-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  deductBuildingStockCostAcrossCities,
  creditOwnerResourceStock,
  createLedgerTurn,
  recordLedgerFlow,
  ledgerResourceNet,
  allocateTakenToLedgerParts,
  upkeepLedgerParts,
  citizenLedgerParts,
  recordTakenToLedger,
} = M;

let pass = 0;
let fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; }
  else { fail++; console.log('FAIL:', label, detail !== undefined ? JSON.stringify(detail) : ''); }
}

// Deterministyczny generator (LCG) -- bez Math.random.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const KEYS = ['drewno', 'kamien', 'sol'];

function makeCities() {
  return [
    { id: 'c1', ownerId: 0, surowce: { drewno: 40, kamien: 10, sol: 5 } },
    { id: 'c2', ownerId: 0, surowce: { drewno: 25, kamien: 0, sol: 12 } },
    { id: 'c3', ownerId: 0, surowce: { drewno: 0, kamien: 30, sol: 3 } },
  ];
}

function ownerTotals(cities) {
  const out = {};
  for (const k of KEYS) out[k] = 0;
  for (const c of cities) {
    if (c.ownerId !== 0) continue;
    for (const k of KEYS) out[k] += c.surowce[k] ?? 0;
  }
  return out;
}

function snapshot(cities) {
  return JSON.stringify(cities.map(c => ({ id: c.id, s: c.surowce })));
}

// ---------------------------------------------------------------------------
// (1) allocateTakenToLedgerParts
// ---------------------------------------------------------------------------
{
  const parts = [
    { kind: 'utrzymanie_budynkow', sourceKey: 'b', label: 'B', cost: { drewno: 4, kamien: 2 } },
    { kind: 'utrzymanie_jednostek', sourceKey: 'u', label: 'U', cost: { drewno: 3, kamien: 1, sol: 2 } },
  ];
  // Pełne pokrycie: części = koszty.
  const full = allocateTakenToLedgerParts({ drewno: 7, kamien: 3, sol: 2 }, parts);
  const sum = (kind, res) => full.filter(e => e.kind === kind && e.resourceKey === res).reduce((a, e) => a + e.amount, 0);
  check('alloc: budynki drewno = 4', sum('utrzymanie_budynkow', 'drewno') === 4, sum('utrzymanie_budynkow', 'drewno'));
  check('alloc: jednostki drewno = 3', sum('utrzymanie_jednostek', 'drewno') === 3, sum('utrzymanie_jednostek', 'drewno'));
  check('alloc: jednostki sol = 2', sum('utrzymanie_jednostek', 'sol') === 2, sum('utrzymanie_jednostek', 'sol'));
  // Częściowe pokrycie: pobrano 5 drewna przy koszcie 7 -> budynki 4, jednostki 1.
  const partial = allocateTakenToLedgerParts({ drewno: 5 }, parts);
  const pb = partial.find(e => e.kind === 'utrzymanie_budynkow')?.amount;
  const pu = partial.find(e => e.kind === 'utrzymanie_jednostek')?.amount;
  check('alloc: częściowe -> budynki 4', pb === 4, pb);
  check('alloc: częściowe -> jednostki 1', pu === 1, pu);
  // Nadwyżka ponad koszty trafia do ostatniej części.
  const over = allocateTakenToLedgerParts({ kamien: 4 }, parts);
  check('alloc: nadwyżka do ostatniej części', over.find(e => e.kind === 'utrzymanie_jednostek')?.amount === 2, over);
  check('alloc: brak części -> pusto', allocateTakenToLedgerParts({ drewno: 5 }, []).length === 0);
}

// ---------------------------------------------------------------------------
// (5) brak rekordu tury = brak księgi
// ---------------------------------------------------------------------------
{
  // recordTakenToLedger bez tury = no-op (brak księgi nie zmienia nic i nie rzuca).
  let threw = false;
  try { recordTakenToLedger(undefined, { drewno: 3 }, upkeepLedgerParts(0, { drewno: 3 }, {})); }
  catch (_) { threw = true; }
  check('record: bez tury = no-op (bez wyjątku)', threw === false);
  // Parametr sink w deductBuildingStockCostAcrossCities: ten sam stan co bez parametru.
  const a = makeCities();
  const b2 = makeCities();
  const t = createLedgerTurn();
  deductBuildingStockCostAcrossCities(a, 0, { drewno: 60, sol: 4 });
  deductBuildingStockCostAcrossCities(b2, 0, { drewno: 60, sol: 4 }, {
    turn: t, parts: citizenLedgerParts(0, { drewno: 60, sol: 4 }),
  });
  check('sink: stan identyczny z sink i bez sink', snapshot(a) === snapshot(b2), { a: snapshot(a), b: snapshot(b2) });
  // Zapas drewna = 65, koszt 60 -> pobrane 60; sól zapas 20, koszt 4 -> pobrane 4.
  check('sink: księga drewna = -60 (pobrane)', ledgerResourceNet(t, 'drewno').net === -60, ledgerResourceNet(t, 'drewno'));
  check('sink: księga soli = -4 (pobrane)', ledgerResourceNet(t, 'sol').net === -4, ledgerResourceNet(t, 'sol'));
}

// ---------------------------------------------------------------------------
// (2)(3)(4) 30 tur: przychód + utrzymanie budynków/jednostek + obywatele
// ---------------------------------------------------------------------------
function runSim({ withLedger, skipUpkeepRecord, seed }) {
  const rng = makeRng(seed);
  const cities = makeCities();
  const history = [];
  let maxDiff = 0;
  for (let turn = 1; turn <= 30; turn++) {
    const before = ownerTotals(cities);
    const rec = withLedger ? createLedgerTurn() : undefined;
    // Przychód z mapy (księgowany jako teren).
    for (const k of KEYS) {
      const amt = Math.floor(rng() * 9);
      const got = creditOwnerResourceStock(cities, 0, k, amt);
      if (rec && got > 0) recordLedgerFlow(rec, k, `teren|${k}`, { kind: 'teren', label: 'Teren' }, got);
    }
    // Utrzymanie: część budynków i jednostek; czasem koszt > zapas (częściowe pokrycie).
    const b = {}; const u = {};
    for (const k of KEYS) {
      b[k] = Math.floor(rng() * 12);
      u[k] = Math.floor(rng() * 6);
    }
    const combined = {};
    for (const k of KEYS) combined[k] = b[k] + u[k];
    // Ten sam kształt wywołania co main.ts: pobranie -> zwrócone `taken` -> zapis do księgi.
    const takenUp = deductBuildingStockCostAcrossCities(cities, 0, combined);
    if (!skipUpkeepRecord) recordTakenToLedger(rec, takenUp, upkeepLedgerParts(0, b, u));
    // Obywatele: losowe zużycie (może przekraczać zapas).
    const cit = {};
    for (const k of KEYS) cit[k] = Math.floor(rng() * 4);
    const takenCit = deductBuildingStockCostAcrossCities(cities, 0, cit);
    recordTakenToLedger(rec, takenCit, citizenLedgerParts(0, cit));
    const after = ownerTotals(cities);
    if (rec) {
      for (const k of KEYS) {
        const diff = Math.abs((after[k] - before[k]) - ledgerResourceNet(rec, k).net);
        if (diff > maxDiff) maxDiff = diff;
      }
    }
    history.push(snapshot(cities));
  }
  return { maxDiff, history, final: snapshot(cities) };
}

{
  const seeds = [7, 2024, 99991];
  for (const seed of seeds) {
    const r = runSim({ withLedger: true, skipUpkeepRecord: false, seed });
    check(`(2) seed ${seed}: 30 tur, różnica księgi = 0`, r.maxDiff === 0, r.maxDiff);
    const mut = runSim({ withLedger: true, skipUpkeepRecord: true, seed });
    check(`(3) seed ${seed}: mutacja (brak zapisu utrzymania) -> rozjazd`, mut.maxDiff > 0, mut.maxDiff);
    const plain = runSim({ withLedger: false, skipUpkeepRecord: false, seed });
    const withL = runSim({ withLedger: true, skipUpkeepRecord: false, seed });
    check(`(4) seed ${seed}: stan miast identyczny z księgą i bez księgi (30 tur)`,
      plain.final === withL.final && plain.history.join('|') === withL.history.join('|'));
  }
}

console.log(`resource-ledger-consume-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
