'use strict';
/**
 * hex-plony-magazyn-test.cjs — R-HEX-PLONY-MAGAZYN (Maciej 2026-07-29, B)
 * Plony terenu (tileYield) z obrabianych heksów → magazyn państwa + ulepszenia addytywnie.
 *
 * Run from gra/: node tools/hex-plony-magazyn-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[hex-plony-magazyn-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.hex-plony-magazyn-entry.ts');
const BUNDLE = path.join(__dirname, '.hex-plony-magazyn-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  advanceCityEconomy,
  computeTerritoryResourceYieldByCity,
  computeWorkedMagazynYieldsByCity,
} from '../src/game/turn-economy';
export { tileYield } from '../src/game/economy';
export { buildTerritoryNodesFromCities } from '../src/map/territory-work';
export { territoryResourceYieldForImprovement } from '../src/game/terrain-improvements';
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
    name: 'Test',
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
  return c.surowce ?? {};
}

console.log('\n-- R-HEX-PLONY-MAGAZYN B: tileYield z 👤 → magazyn + ulepszenia addytywnie --\n');

// Równina bez lasu/Tartaku — minimalna produkcja z terenu (centrum miasta)
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        rzeka: null,
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const worked = M.computeWorkedMagazynYieldsByCity([city], map, nodes);
  const w = worked.get(city.id);
  ok(w && w.drewno === 10 && w.kamien === 5, 'Równina centrum: worked drewno=10 kamien=5');
  const stock = runTick(city, [], map);
  eq(stock.drewno, 10, 'magazyn: Równina bez Tartaku → 10 drewna');
  eq(stock.kamien, 5, 'magazyn: Równina bez Kamieniołomu → 5 kamień');
}

// Tartak + las na obrabianym heksie — drewno > sam Tartak
{
  const tartakAmt = M.territoryResourceYieldForImprovement('tartak').amount;
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'laka',
        nakladka: 'las',
        rzeka: null,
        ulepszenia: ['tartak'],
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes);
  const worked = M.computeWorkedMagazynYieldsByCity([city], map, nodes);
  const terrDrewno = terr.get(city.id)?.drewno ?? 0;
  const workedDrewno = worked.get(city.id)?.drewno ?? 0;
  ok(terrDrewno === tartakAmt, `Tartak terrYield = ${tartakAmt}`);
  ok(workedDrewno > 0, 'Las na centrum: worked drewno > 0');
  const expected = terrDrewno + workedDrewno;
  ok(expected > tartakAmt, 'Tartak + las: suma > sam Tartak');
  const stock = runTick(city, [], map);
  eq(stock.drewno, expected, 'magazyn: Tartak + plony lasu addytywnie');
}

// Rzeka +2 glina (szt./turę) — tileYield, potem magazyn przy 👤
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'laka',
        nakladka: 'brak',
        rzeka: { obecna: true },
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const worked = M.computeWorkedMagazynYieldsByCity([city], map, nodes);
  const w = worked.get(city.id);
  ok(w && w.glina === 10, 'Rzeka na centrum: worked glina=10');
  const stock = runTick(city, [], map);
  eq(stock.glina, 10, 'magazyn: heks przy rzece → +10 glina/t');
}

// Sąsiad z 👤 (tryb ręczny) — Łąka +1 drewno, nie tylko centrum miasta
{
  const city = makeCity({
    population: 1,
    okolicaTryb: 'reczny',
    okolicaReczne: { '1,0': 1 },
  });
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        rzeka: null,
      },
      '1,0': {
        coords: { q: 1, r: 0 },
        terenBazowy: 'laka',
        nakladka: 'brak',
        rzeka: null,
      },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const worked = M.computeWorkedMagazynYieldsByCity([city], map, nodes);
  const w = worked.get(city.id);
  ok(w && w.drewno === 15, 'centrum+👤 Łąka: drewno 10+5=15');
  const stock = runTick(city, [], map);
  eq(stock.drewno, 15, 'magazyn: plony z obrabianego sąsiada addytywnie');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
