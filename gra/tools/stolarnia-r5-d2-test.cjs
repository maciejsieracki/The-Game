'use strict';
/**
 * stolarnia-r5-d2-test.cjs — PYTANIE-84 R5+D2
 * Stolarnia: +10%/szt. drewno z mapy (Las + Tartak), addytywnie na wpływie do magazynu państwa.
 *
 * Run from gra/: node tools/stolarnia-r5-d2-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[stolarnia-r5-d2-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.stolarnia-r5-d2-entry.ts');
const BUNDLE = path.join(__dirname, '.stolarnia-r5-d2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  advanceCityEconomy,
  computeTerritoryResourceYieldByCity,
  computeWorkedDrewnoByCity,
  applyStolarniaDrewnoMapInflow,
} from '../src/game/turn-economy';
export { buildTerritoryNodesFromCities } from '../src/map/territory-work';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const econParams = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

const DATA = { civs, econParams, societyParams, buildings, units, tech };

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

function makeCity(overrides = {}) {
  return {
    id: 'city0',
    ownerId: 0,
    q: 0,
    r: 0,
    name: 'Lasowo',
    population: 1,
    magazynZywnosci: 10,
    surowce: {},
    ...overrides,
  };
}

function runTick(city, builtIds, map) {
  const builtByCity = new Map([[city.id, builtIds]]);
  const c = makeCity({ ...city, surowce: { ...(city.surowce ?? {}) } });
  M.advanceCityEconomy([c], map, DATA, 'normal', [], new Map(), builtByCity);
  return c.surowce?.drewno ?? 0;
}

console.log('\n-- PYTANIE-84 R5+D2: Stolarnia + drewno z mapy (Las + Tartak) --\n');

// Helper sanity
eq(M.applyStolarniaDrewnoMapInflow(20, 1, 0.10), 22, 'helper: 1 Stolarnia ×1.10');
eq(M.applyStolarniaDrewnoMapInflow(20, 2, 0.10), 24, 'helper: 2 Stolarnie ×1.20 addytywnie');

// Tartak — bonus Stolarnii (pełna baza = terrYield + workedDrewno)
{
  const city = makeCity();
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'laka',
        nakladka: 'brak',
        rzeka: null,
        ulepszenia: ['tartak'],
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const yields = M.computeTerritoryResourceYieldByCity([city], map, nodes);
  const worked = M.computeWorkedDrewnoByCity([city], map, nodes);
  const base = (yields.get(city.id)?.drewno ?? 0) + (worked.get(city.id) ?? 0);
  ok(base > 0, 'Tartak + pole miasta produkuje drewno > 0');
  eq(runTick(city, [], map), base, 'bez Stolarnii: drewno = baza mapy');
  eq(runTick(city, ['stolarnia'], map), M.applyStolarniaDrewnoMapInflow(base, 1, 0.10), '1 Stolarnia: drewno ×1.10');
}

// Las (nakładka) na obrabianym polu — wpływ do magazynu państwa
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'laka',
        nakladka: 'las',
        rzeka: null,
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const worked = M.computeWorkedDrewnoByCity([city], map, nodes);
  const lasBase = worked.get(city.id) ?? 0;
  ok(lasBase >= 3, 'Las na centrum: worked drewno ≥ 3/t (łąka + nakładka las)');
  eq(runTick(city, [], map), lasBase, 'bez Stolarnii: Las drewno trafia do magazynu');
  eq(
    runTick(city, ['stolarnia'], map),
    M.applyStolarniaDrewnoMapInflow(lasBase, 1, 0.10),
    '1 Stolarnia: Las drewno z bonusem',
  );
}

// Kumulacja addytywna: 2 Stolarnie w imperium (2 miasta, bez współdzielenia pól)
{
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'laka',
        nakladka: 'brak',
        rzeka: null,
        ulepszenia: ['tartak'],
      },
    },
  };
  const c1 = makeCity({ id: 'c1', q: 0, r: 0, surowce: {} });
  const c2 = makeCity({ id: 'c2', q: 30, r: 30, name: 'Miasto2', surowce: {} });
  const builtByCity = new Map([
    [c1.id, ['stolarnia']],
    [c2.id, ['stolarnia']],
  ]);
  const nodes = M.buildTerritoryNodesFromCities([c1, c2]);
  const yields = M.computeTerritoryResourceYieldByCity([c1], map, nodes);
  const worked = M.computeWorkedDrewnoByCity([c1], map, nodes);
  const base = (yields.get(c1.id)?.drewno ?? 0) + (worked.get(c1.id) ?? 0);
  M.advanceCityEconomy([c1, c2], map, DATA, 'normal', [], new Map(), builtByCity);
  const total = (c1.surowce?.drewno ?? 0) + (c2.surowce?.drewno ?? 0);
  eq(total, M.applyStolarniaDrewnoMapInflow(base, 2, 0.10), '2 Stolarnie (civ-wide): drewno ×1.20');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
