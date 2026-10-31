'use strict';
/**
 * sawmill-quarry-50-economy-test.cjs — R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1
 * Ścieżka turn-economy (computeTerritoryResourceYieldByCity + computeWorkedMagazynYieldsByCity
 * + advanceCityEconomy) dla Tartaku i Kamieniołomu w epoce 1 (baza 50/turę).
 *
 * Run from gra/: node tools/sawmill-quarry-50-economy-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.sawmill-quarry-50-economy-entry.ts');
const BUNDLE = path.join(__dirname, '.sawmill-quarry-50-economy-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  advanceCityEconomy,
  computeTerritoryResourceYieldByCity,
  computeWorkedMagazynYieldsByCity,
} from '../src/game/turn-economy';
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
process.on('exit', () => {
  if (fs.existsSync(ENTRY)) fs.unlinkSync(ENTRY);
  if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
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

console.log('\n-- R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1: ekonomia tury, epoka 1 --\n');

// A. Jedno miasto: Tartak (drewno) + Kamieniołom (kamień) w terytorium, epoka 1.
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak', rzeka: null,
        ulepszenia: ['tartak'] },
      '1,0': { coords: { q: 1, r: 0 }, terenBazowy: 'wzgorza', nakladka: 'brak', rzeka: null,
        ulepszenia: ['kamieniolom'] },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes, () => 1).get(city.id) ?? {};
  eq(terr.drewno, 50, 'terytorium: Tartak epoka 1 = drewno +50');
  eq(terr.kamien, 50, 'terytorium: Kamieniołom epoka 1 = kamień +50 (jednocześnie z Tartakiem)');
}

// B. Dwa Tartaki w jednym mieście = 100 (stawka per ulepszenie).
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', rzeka: null,
        ulepszenia: ['tartak'] },
      '1,0': { coords: { q: 1, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', rzeka: null,
        ulepszenia: ['tartak'] },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes, () => 1).get(city.id) ?? {};
  eq(terr.drewno, 100, 'terytorium: dwa Tartaki epoka 1 = drewno +100');
}

// C. Start gry: centrum Równina+Las z Tartakiem. Karta Drewno = tartak 50 + heks centrum.
//    Składowe: Równina Drewno 5 (terrain_types) + Las (nakładka) Drewno 15 (terrain_modifiers) = 20.
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'las', rzeka: null,
        ulepszenia: ['tartak'] },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes, () => 1).get(city.id) ?? {};
  const worked = M.computeWorkedMagazynYieldsByCity([city], map, nodes).get(city.id) ?? {};
  eq(terr.drewno, 50, 'start: Tartak epoka 1 = 50 (terytorium)');
  eq(worked.drewno, 20, 'start: heks centrum Równina+Las = drewno 20 (5 teren + 15 las)');
  const stock = runTick(city, [], map);
  eq(stock.drewno, 70, 'start: magazyn drewna po turze = 50 + 20 = 70');
}

// D. Kamieniołom + Tartak na centrum z ulepszeniami: produkcja kamienia z ulepszenia = 50.
{
  const city = makeCity({ population: 1 });
  const map = {
    hexes: {
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak', rzeka: null,
        ulepszenia: ['kamieniolom'] },
    },
  };
  const nodes = M.buildTerritoryNodesFromCities([city]);
  const terr = M.computeTerritoryResourceYieldByCity([city], map, nodes, () => 1).get(city.id) ?? {};
  eq(terr.kamien, 50, 'kamieniołom na centrum epoka 1 = kamień +50');
}

console.log(`\n${passed} PASS, ${failed} FAIL`);
process.exitCode = failed ? 1 : 0;
