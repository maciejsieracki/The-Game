'use strict';
/**
 * warehouse-state-cap-20pct-test.cjs -- R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1 (decyzja wlasciciela 2026-11-05):
 *
 *   "Każdy magazyn zwiększa pojemność globalnego magazynu państwa o 20%, bo zwiększenie o 500,
 *    jeżeli baza państwa wynosi 50 [tysięcy], to z 50 tysięcy jest żadne zwiększenie."
 *
 * Formuła po zmianie:
 *   cap(typ) = magazyn_baza_surowce × (1 + magazyn_bonus_surowce_proc_na_budynek × N) × magazynEraMultiplier(era)
 *   proc = 0,2 (easy/normal/hard), N = liczba Magazynów ownera, addytywnie (nie składane).
 *
 * Pokrywa:
 *   A. Wartości N=0/1/3 w epokach 1–3 (ownerResourceCapacityPerType) na REALNYM econ-params.json.
 *   B. Rozbicie UI (ownerStorageParamsForEra): capBase + capBonusPerMagazyn × N == cap.
 *   C. econ-params.json: nowy klucz z proc=0,2, stary klucz (500) usunięty.
 *   D. Mutacja: stałe +500 (stara semantyka) daje INNE cap niż wymagane -- test by to wykrył.
 *   E. Opis Magazynu w buildings.json zawiera +20%.
 *
 * Run from gra/:  node tools/warehouse-state-cap-20pct-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[warehouse-state-cap-20pct-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.warehouse-cap-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.warehouse-cap-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_OWNER_STORAGE_PARAMS, loadOwnerStorageParams,
  ownerResourceCapacityPerType, ownerStorageParamsForEra,
} from '../src/game/economy-upkeep';
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
  console.error('[warehouse-state-cap-20pct-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const buildings = require('../data/buildings.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. Wartosci capu: baza 50000 x (1 + 0,2 x N) x mnoznik epoki
// ===========================================================================
console.log('\n-- A. cap = 50000 x (1 + 0,2 x N) x 2^(epoka-1) --');
for (const d of ['easy', 'normal', 'hard']) {
  const p = M.loadOwnerStorageParams(econParamsRaw, d);
  eq(p.bazaSurowcePanstwo, 50000, `${d}: baza = 50000 (plasko)`);
  eq(p.bonusProcNaBudynek, 0.2, `${d}: proc za Magazyn = 0,2 (+20%)`);
  eq(M.ownerResourceCapacityPerType(0, p, 1), 50000, `${d} era1 N=0 -> 50000`);
  eq(M.ownerResourceCapacityPerType(1, p, 1), 60000, `${d} era1 N=1 -> 60000 (x1,2)`);
  eq(M.ownerResourceCapacityPerType(3, p, 1), 80000, `${d} era1 N=3 -> 80000 (x1,6)`);
  eq(M.ownerResourceCapacityPerType(0, p, 2), 100000, `${d} era2 N=0 -> 100000`);
  eq(M.ownerResourceCapacityPerType(1, p, 2), 120000, `${d} era2 N=1 -> 120000`);
  eq(M.ownerResourceCapacityPerType(3, p, 2), 160000, `${d} era2 N=3 -> 160000`);
  eq(M.ownerResourceCapacityPerType(0, p, 3), 200000, `${d} era3 N=0 -> 200000`);
  eq(M.ownerResourceCapacityPerType(1, p, 3), 240000, `${d} era3 N=1 -> 240000`);
  eq(M.ownerResourceCapacityPerType(3, p, 3), 320000, `${d} era3 N=3 -> 320000`);
}
// addytywnie, nie skladane: 2 Magazyny = x1,4, nie x1,44
const pNorm = M.loadOwnerStorageParams(econParamsRaw, 'normal');
eq(M.ownerResourceCapacityPerType(2, pNorm, 1), 70000, 'N=2 -> 70000 (addytywnie x1,4, NIE x1,44)');
eq(M.ownerResourceCapacityPerType(-4, pNorm, 1), 50000, 'ujemny N traktowany jako 0');

// ===========================================================================
// B. Rozbicie UI sumuje sie dokladnie do capu
// ===========================================================================
console.log('\n-- B. ownerStorageParamsForEra: capBase + capBonusPerMagazyn x N == cap --');
for (const era of [1, 2, 3]) {
  const br = M.ownerStorageParamsForEra(pNorm, era);
  for (const n of [0, 1, 3]) {
    const sum = br.bazaSurowcePanstwo + br.bonusSurowceNaBudynek * n;
    const cap = M.ownerResourceCapacityPerType(n, pNorm, era);
    eq(sum, cap, `era${era} N=${n}: rozbicie UI == cap`);
  }
}
eq(M.ownerStorageParamsForEra(pNorm, 1).bonusSurowceNaBudynek, 10000, 'era1: capBonusPerMagazyn = 50000 x 0,2 = 10000');
eq(M.ownerStorageParamsForEra(pNorm, 3).bonusSurowceNaBudynek, 40000, 'era3: capBonusPerMagazyn = 200000 x 0,2 = 40000');

// ===========================================================================
// C. econ-params.json: nowy klucz, stary usuniety
// ===========================================================================
console.log('\n-- C. econ-params.json: magazyn_bonus_surowce_proc_na_budynek (0,2), stary klucz usuniety --');
const g = econParamsRaw.globalne;
assert(g.magazyn_bonus_surowce_proc_na_budynek !== undefined, 'klucz magazyn_bonus_surowce_proc_na_budynek istnieje');
eq(g.magazyn_bonus_surowce_proc_na_budynek && g.magazyn_bonus_surowce_proc_na_budynek.normal, 0.2, 'normal = 0,2');
eq(g.magazyn_bonus_surowce_proc_na_budynek && g.magazyn_bonus_surowce_proc_na_budynek.easy, 0.2, 'easy = 0,2');
eq(g.magazyn_bonus_surowce_proc_na_budynek && g.magazyn_bonus_surowce_proc_na_budynek.hard, 0.2, 'hard = 0,2');
eq(g.magazyn_bonus_surowce_na_budynek, undefined, 'stary klucz magazyn_bonus_surowce_na_budynek (500) usuniety');

// ===========================================================================
// D. Mutacja: stala +500 za Magazyn (stara semantyka) lamie pinowane wartosci
// ===========================================================================
console.log('\n-- D. mutacja: +500 zamiast +20% musi dac wynik ROZNY od pinowanego --');
{
  const mutantOld = (n) => 50000 + 500 * n;   // stara formula (era1)
  assert(mutantOld(1) !== M.ownerResourceCapacityPerType(1, pNorm, 1), 'mutacja +500: N=1 rozni sie od 60000');
  assert(mutantOld(3) !== M.ownerResourceCapacityPerType(3, pNorm, 1), 'mutacja +500: N=3 rozni sie od 80000');
  // mutacja: proc przypadkiem 0,02 (zla skala) rowniez musi zostac wykryta
  const mutantTenth = 50000 * (1 + 0.02 * 1);
  assert(mutantTenth !== M.ownerResourceCapacityPerType(1, pNorm, 1), 'mutacja proc 0,02: N=1 rozni sie od 60000');
}

// ===========================================================================
// E. Opis Magazynu w buildings.json mowi o +20%
// ===========================================================================
console.log('\n-- E. buildings.json: opis Magazynu wspomina +20% pojemnosci panstwa --');
{
  const mag = Object.values(buildings).find(b => b && b.nazwa === 'Magazyn');
  const opis = mag ? String(mag.opis || '') : '';
  assert(!!mag, 'wpis Magazyn znaleziony w buildings.json');
  assert(opis.includes('+20%'), `opis Magazynu zawiera "+20%" (got: ${JSON.stringify(opis.slice(0, 120))})`);
}

// --- summary ---------------------------------------------------------------
console.log(`\nwarehouse-state-cap-20pct-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
