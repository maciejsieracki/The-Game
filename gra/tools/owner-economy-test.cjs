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
export { executeManualWorkTaxConversion, ownerCanConvertWorkToTax, restorePendingWorkTax, serializePendingWorkTax } from '../src/game/work-tax';
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

// Manual Work conversion enters the ordinary city tax/tax-slider pipeline on the
// next tick. Compare equivalent city states with and without the selected tax.
const marketByCity = new Map([[playerCity.id, ['targowisko']]]);
assert(M.ownerCanConvertWorkToTax(0, true, cities, marketByCity), 'human owner with an empire Market can convert');
assert(!M.ownerCanConvertWorkToTax(1, false, cities, marketByCity), 'AI cannot use manual conversion');
assert(!M.ownerCanConvertWorkToTax(0, true, cities, new Map()), 'conversion requires a Market somewhere in the owner empire');
const ownerWorkPools = new Map([[0, 120]]);
const pendingWorkTax = new Map();
const selected = M.executeManualWorkTaxConversion(0, 40, 1,
  M.ownerCanConvertWorkToTax(0, true, cities, marketByCity), {
    getWorkPool: ownerId => ownerWorkPools.get(ownerId) ?? 0,
    setWorkPool: (ownerId, value) => ownerWorkPools.set(ownerId, value),
    queueTax: (ownerId, tax) => pendingWorkTax.set(ownerId, (pendingWorkTax.get(ownerId) ?? 0) + tax),
  });
assert(JSON.stringify(selected) === JSON.stringify({ workRemaining: 80, workSpent: 40, taxGained: 40 })
  && ownerWorkPools.get(0) === 80 && pendingWorkTax.get(0) === 40,
'selected Work decreases and tax aggregate is queued at 1:1');
const normalCity = { ...playerCity, wealthState: { ...playerCity.wealthState } };
const taxedCity = { ...playerCity, wealthState: { ...playerCity.wealthState } };
const split = { procentNauka: 20, procentPieniadz: 30, procentLuksus: 50 };
normalCity.podzialHandlu = split;
taxedCity.podzialHandlu = split;
normalCity.podzialHandluOverride = true;
taxedCity.podzialHandluOverride = true;
const taxTick = (city, manualTax, built = marketByCity, hasMint = false) => M.advanceCityEconomy(
  [city], map, data, 'normal', [], new Map(), built, 1, new Set(hasMint ? ['Waluta'] : []), new Map(), new Map(),
  undefined, undefined, 'wysoki', new Map(), new Map(), new Map(), new Map(), () => hasMint,
  undefined, undefined, new Map([[0, split]]), undefined, new Map(), new Map(),
  manualTax ? new Map([[city.id, manualTax]]) : new Map(),
);
const ordinary = taxTick(normalCity, 0).perCity[0];
const persistedPendingTax = M.serializePendingWorkTax(pendingWorkTax);
const restoredPendingTax = M.restorePendingWorkTax(JSON.parse(JSON.stringify(persistedPendingTax)));
assert(restoredPendingTax.get(0) === 40, 'queued Work tax survives a save/load metadata round-trip');
const converted = taxTick(taxedCity, restoredPendingTax.get(0)).perCity[0];
const noMarketCity = { ...playerCity, wealthState: { ...playerCity.wealthState }, podzialHandlu: split, podzialHandluOverride: true };
const noMarketTaxCity = { ...noMarketCity, wealthState: { ...noMarketCity.wealthState } };
const noMarketBase = taxTick(noMarketCity, 0, new Map()).perCity[0];
const noMarketTax = taxTick(noMarketTaxCity, restoredPendingTax.get(0), new Map()).perCity[0];
assert(converted.pieniadz > ordinary.pieniadz, 'manual tax reaches the money share of normal city tax');
assert(converted.nauka > ordinary.nauka, 'manual tax reaches the science share of normal city tax');
assert(converted.luksus > ordinary.luksus, 'manual tax reaches the wealth share of normal city tax');
assert(Math.abs((converted.pieniadz - ordinary.pieniadz) - (noMarketTax.pieniadz - noMarketBase.pieniadz)) <= 1,
  'Market gross-trade bonus is not applied to converted Work tax');
const mintBuilt = new Map([[playerCity.id, ['targowisko', 'mennica']]]);
const noMintBaseCity = { ...playerCity, wealthState: { ...playerCity.wealthState }, podzialHandlu: split, podzialHandluOverride: true };
const noMintTaxCity = { ...noMintBaseCity, wealthState: { ...noMintBaseCity.wealthState } };
const mintBaseCity = { ...noMintBaseCity, wealthState: { ...noMintBaseCity.wealthState } };
const mintTaxCity = { ...noMintBaseCity, wealthState: { ...noMintBaseCity.wealthState } };
const noMintBase = taxTick(noMintBaseCity, 0, marketByCity).perCity[0];
const noMintTax = taxTick(noMintTaxCity, restoredPendingTax.get(0), marketByCity).perCity[0];
const mintBase = taxTick(mintBaseCity, 0, mintBuilt, true).perCity[0];
const mintTax = taxTick(mintTaxCity, restoredPendingTax.get(0), mintBuilt, true).perCity[0];
assert(mintTax.pieniadz - mintBase.pieniadz > noMintTax.pieniadz - noMintBase.pieniadz,
  'manual tax passes through Currency and Mint modifier before allocation');
assert(converted.pieniadzZTras === ordinary.pieniadzZTras, 'manual tax does not masquerade as route income');

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
