'use strict';
/**
 * budynek-civ-bonus-u17-test.cjs — PYTANIE-84 U-17 / R5+D2
 * Warsztat kamieniarski: +10% Kamienia/szt. na wpływie z mapy (addytywnie, jak Stolarnia).
 *
 * Run from gra/: node tools/budynek-civ-bonus-u17-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[budynek-civ-bonus-u17-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.budynek-civ-bonus-u17-entry.ts');
const BUNDLE = path.join(__dirname, '.budynek-civ-bonus-u17-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { advanceCityEconomy, computeTerritoryResourceYieldByCity } from '../src/game/turn-economy';
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

function makeMapWithQuarry(q, r) {
  const key = `${q},${r}`;
  return {
    hexes: {
      [key]: {
        coords: { q, r },
        terenBazowy: 1,
        nakladka: 0,
        rzeka: null,
        ulepszenia: ['kamieniolom'],
      },
    },
  };
}

function makeCity(overrides = {}) {
  return {
    id: 'city0',
    ownerId: 0,
    q: 0,
    r: 0,
    name: 'Kamienowo',
    population: 3,
    magazynZywnosci: 10,
    surowce: {},
    ...overrides,
  };
}

function runTick(city, builtIds) {
  const map = makeMapWithQuarry(city.q, city.r);
  const builtByCity = new Map([[city.id, builtIds]]);
  const c = makeCity({ ...city, surowce: { ...(city.surowce ?? {}) } });
  M.advanceCityEconomy([c], map, DATA, 'normal', [], new Map(), builtByCity);
  return c.surowce?.kamien ?? 0;
}

console.log('\n-- PYTANIE-84 U-17: Warsztat kamieniarski +10% Kamienia (civ-wide, addytywnie) --\n');

// Sanity: kamieniolom produkuje kamien w terytorium miasta
{
  const city = makeCity();
  const map = makeMapWithQuarry(0, 0);
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const yields = M.computeTerritoryResourceYieldByCity([city], map, nodes);
  const row = yields.get(city.id);
  ok(row && (row.kamien ?? 0) > 0, 'kamieniolom w terytorium daje kamien > 0');
  const baseKamien = row.kamien;
  eq(runTick(city, []), baseKamien, 'bez Warsztatu: kamien = baza z mapy');
  eq(runTick(city, ['kamieniarski']), Math.floor(baseKamien * 1.1), '1 Warsztat: kamien ×1.10 (floor)');
  eq(runTick(city, ['kamieniarski', 'kamieniarski']), Math.floor(baseKamien * 1.2), '2 Warsztaty: kamien ×1.20 (floor, addytywnie)');
}

// Parytet ze Stolarnią: ten sam wzorzec mnoznika drewno/kamien
{
  const city = makeCity();
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: 1,
        nakladka: 0,
        rzeka: null,
        ulepszenia: ['tartak', 'kamieniolom'],
      },
    },
  };
  const builtByCityStolarnia = new Map([[city.id, ['stolarnia']]]);
  const builtByCityKamien = new Map([[city.id, ['kamieniarski']]]);
  const cWood = makeCity({ surowce: {} });
  const cStone = makeCity({ surowce: {} });
  M.advanceCityEconomy([cWood], map, DATA, 'normal', [], new Map(), builtByCityStolarnia);
  M.advanceCityEconomy([cStone], map, DATA, 'normal', [], new Map(), builtByCityKamien);
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const yields = M.computeTerritoryResourceYieldByCity([city], map, nodes);
  const base = yields.get(city.id) ?? {};
  eq(cWood.surowce?.drewno ?? 0, Math.floor((base.drewno ?? 0) * 1.1), 'Stolarnia: drewno ×1.10');
  eq(cStone.surowce?.kamien ?? 0, Math.floor((base.kamien ?? 0) * 1.1), 'Warsztat kamieniarski: kamien ×1.10 (analog Stolarni)');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
