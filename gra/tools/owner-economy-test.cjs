'use strict';
/** node tools/owner-economy-test.cjs — izolacja ekonomii per ownerId (HUD vs map total) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.owner-economy-entry.ts');
const bundle = path.join(__dirname, '.owner-economy-bundle.cjs');

fs.writeFileSync(entry, `
export { advanceCityEconomy, sumEconomyForOwner, sumEconomyForPlayerCities } from '../src/game/turn-economy';
export { freshWealthState } from '../src/game/wealth';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');
const econParams = require('../data/econ-params.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('owner-economy-test (per-owner isolation)\n');

const map = M.generateMap(40, 40, 7777, 'kontynenty');
const data = { civs, econParams, societyParams, buildings, units, tech };

function landHexList() {
  const out = [];
  for (const h of Object.values(map.hexes)) {
    const c = { q: h.coords.q, r: h.coords.r };
    if (M.canFoundCity(c.q, c.r, [], map).ok) out.push(c);
  }
  return out;
}

function hexDist(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

function pickSpreadHexes(all, count, minDist) {
  const picked = [];
  for (const c of all) {
    if (picked.every(p => hexDist(c.q, c.r, p.q, p.r) >= minDist)) {
      picked.push(c);
      if (picked.length >= count) break;
    }
  }
  return picked;
}

const coords = pickSpreadHexes(landHexList(), 3, 6);
if (coords.length < 3) {
  console.error('FAIL: not enough land hexes');
  process.exit(1);
}

const cities = [];
const playerCity = M.foundCityAt(coords[0].q, coords[0].r, 0, cities, map, 'Ateny');
if (playerCity) cities.push(playerCity);
const aiCity1 = M.foundCityAt(coords[1].q, coords[1].r, 1, cities, map, 'Sparta');
if (aiCity1) cities.push(aiCity1);
const aiCity2 = M.foundCityAt(coords[2].q, coords[2].r, 2, cities, map, 'Qin');
if (aiCity2) cities.push(aiCity2);
if (!playerCity || !aiCity1 || !aiCity2) {
  console.error('FAIL: could not found test cities', {
    player: !!playerCity, ai1: !!aiCity1, ai2: !!aiCity2, coords,
  });
  process.exit(1);
}

const ownerCivMap = new Map([[0, 'grecy'], [1, 'grecy'], [2, 'chinczycy']]);
const econ = M.advanceCityEconomy(
  cities, map, data, 'normal', [], new Map(), new Map(), 1, new Set(), ownerCivMap, new Map(),
);

const playerSum = M.sumEconomyForOwner(econ, 0);
const playerByCity = M.sumEconomyForPlayerCities(econ, cities);
const ai1Sum = M.sumEconomyForOwner(econ, 1);
const ai2Sum = M.sumEconomyForOwner(econ, 2);

assert(econ.perCity.length === 3, '3 miasta w perCity');
assert(
  Math.abs(playerSum.pieniadz + ai1Sum.pieniadz + ai2Sum.pieniadz - econ.totalPieniadz) < 0.01,
  'suma per-owner pieniadz = total mapy',
);
assert(
  Math.abs(playerSum.doPuli + ai1Sum.doPuli + ai2Sum.doPuli - econ.totalPracaPula) < 0.01,
  'suma per-owner doPuli = totalPracaPula',
);

assert(playerSum.pieniadz < econ.totalPieniadz, 'gracz dostaje mniej niz suma calej mapy');
assert(
  Math.abs(playerByCity.pieniadz - playerSum.pieniadz) < 0.01,
  'sumEconomyForPlayerCities = sumEconomyForOwner(0)',
);
assert(ai1Sum.pieniadz < econ.totalPieniadz, 'AI1 dostaje mniej niz suma calej mapy');
assert(
  playerSum.pieniadz !== econ.totalPieniadz || econ.totalPieniadz === 0,
  'gracz NIE dostaje calej mapy (chyba ze wszystko zero)',
);

// Symulacja bledu HUD: total* przypisane graczowi
const wrongPlayerIncome = econ.totalPieniadz;
const correctPlayerIncome = playerSum.pieniadz;
assert(
  wrongPlayerIncome >= correctPlayerIncome,
  'totalPieniadz >= playerSum (regresja gdy rowne i >0 = leak)',
);
if (econ.totalPieniadz > 0) {
  assert(
    wrongPlayerIncome > correctPlayerIncome * 1.5,
    'przy 3 miastach total >> player (wykrywalny leak)',
  );
}

console.log('\n  player pieniadz/t:', Math.round(playerSum.pieniadz));
console.log('  AI1 pieniadz/t:   ', Math.round(ai1Sum.pieniadz));
console.log('  AI2 pieniadz/t:   ', Math.round(ai2Sum.pieniadz));
console.log('  MAP total/t:      ', Math.round(econ.totalPieniadz));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
