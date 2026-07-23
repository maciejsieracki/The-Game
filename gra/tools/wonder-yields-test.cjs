'use strict';
/**
 * node tools/wonder-yields-test.cjs — CUDA-EKON-01: bonusy.miasto cudów świata
 * realnie doliczone w cityYieldPerTurn/advanceCityEconomy (× każde miasto ownera),
 * z bramką absolut (wygasają po epoce 6 — Średniowiecze).
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-yields-entry.ts');
const bundle = path.join(__dirname, '.wonder-yields-bundle.cjs');

fs.writeFileSync(entry, `
export { advanceCityEconomy, sumEconomyForOwner } from '../src/game/turn-economy';
export { sumWonderCityYieldsForOwner, hasAnyWonderCityYield, getWonderById } from '../src/game/wonders-data';
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

console.log('wonder-yields-test (CUDA-EKON-01)\n');

// --- 1. sumWonderCityYieldsForOwner: reads bonusy.miasto straight from JSON ---
const piramidy = M.getWonderById('piramidy');
assert(!!piramidy, 'piramidy istnieje w wonders.json');
const sumEra1 = M.sumWonderCityYieldsForOwner(['piramidy'], 1);
assert(sumEra1.pieniadz === 3 && sumEra1.praca === 3, `piramidy era1 -> pieniadz=3,praca=3 (got ${JSON.stringify(sumEra1)})`);

// absolut=6 dla piramid -> era 7 (po Sredniowieczu) bonusy miasta wygasaja
const sumEra7 = M.sumWonderCityYieldsForOwner(['piramidy'], 7);
assert(sumEra7.pieniadz === 0 && sumEra7.praca === 0, `piramidy era7 (po absolut) -> 0 (got ${JSON.stringify(sumEra7)})`);

// suma dwoch cudow tego samego wlasciciela -- addytywnie
const sumTwo = M.sumWonderCityYieldsForOwner(['piramidy', 'ziggurat'], 1);
assert(sumTwo.kultura === 6 && sumTwo.pieniadz === 3 && sumTwo.nauka === 3,
  `piramidy+ziggurat era1 -> kultura=6,pieniadz=3,nauka=3 (got ${JSON.stringify(sumTwo)})`);

assert(M.hasAnyWonderCityYield(sumEra1) === true, 'hasAnyWonderCityYield true gdy niezerowe');
assert(M.hasAnyWonderCityYield(sumEra7) === false, 'hasAnyWonderCityYield false gdy wszystko 0');

// --- 2. advanceCityEconomy: wonderCityYieldsByOwner dolicza FLAT do KAZDEGO miasta ownera ---
const map = M.generateMap(40, 40, 8888, 'kontynenty');
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
const playerCity1 = M.foundCityAt(coords[0].q, coords[0].r, 0, cities, map, 'Ateny');
if (playerCity1) cities.push(playerCity1);
const playerCity2 = M.foundCityAt(coords[1].q, coords[1].r, 0, cities, map, 'Sparta');
if (playerCity2) cities.push(playerCity2);
const aiCity1 = M.foundCityAt(coords[2].q, coords[2].r, 1, cities, map, 'Qin');
if (aiCity1) cities.push(aiCity1);
if (!playerCity1 || !playerCity2 || !aiCity1) {
  console.error('FAIL: could not found test cities', {
    p1: !!playerCity1, p2: !!playerCity2, ai1: !!aiCity1, coords,
  });
  process.exit(1);
}

const ownerCivMap = new Map([[0, 'egipt'], [1, 'chinczycy']]);

const baseline = M.advanceCityEconomy(
  cities, map, data, 'normal', [], new Map(), new Map(), 1, new Set(), ownerCivMap, new Map(),
);

// Owner 0 (gracz, Egipt) ma "piramidy" ukonczone; Owner 1 (AI, Chinczycy) nic.
const wonderMap = new Map([[0, M.sumWonderCityYieldsForOwner(['piramidy'], 1)]]);
const withWonder = M.advanceCityEconomy(
  cities, map, data, 'normal', [], new Map(), new Map(), 1, new Set(), ownerCivMap, new Map(),
  undefined, undefined, 'wysoki', new Map(), new Map(), new Map(), wonderMap,
);

const p1Base = baseline.perCity.find(t => t.cityId === playerCity1.id);
const p2Base = baseline.perCity.find(t => t.cityId === playerCity2.id);
const aiBase = baseline.perCity.find(t => t.cityId === aiCity1.id);
const p1With = withWonder.perCity.find(t => t.cityId === playerCity1.id);
const p2With = withWonder.perCity.find(t => t.cityId === playerCity2.id);
const aiWith = withWonder.perCity.find(t => t.cityId === aiCity1.id);

assert(!!p1Base && !!p2Base && !!aiBase && !!p1With && !!p2With && !!aiWith, '3 tickle znalezione w obu przebiegach');

// pieniadzBrutto = yld.pieniadz PRZED mnoznikiem Wealth -- to tu dolicza sie wonder bonus 1:1.
assert(
  Math.abs((p1With.pieniadzBrutto - p1Base.pieniadzBrutto) - 3) < 0.01,
  `miasto1 gracza: +3 pieniadz z Piramid (got delta=${p1With.pieniadzBrutto - p1Base.pieniadzBrutto})`,
);
assert(
  Math.abs((p2With.pieniadzBrutto - p2Base.pieniadzBrutto) - 3) < 0.01,
  `miasto2 gracza: +3 pieniadz z Piramid TEZ (x kazde miasto ownera, got delta=${p2With.pieniadzBrutto - p2Base.pieniadzBrutto})`,
);
assert(
  Math.abs((p1With.praca - p1Base.praca) - 3) < 0.01,
  `miasto1 gracza: +3 praca z Piramid (got delta=${p1With.praca - p1Base.praca})`,
);
assert(
  Math.abs(aiWith.pieniadzBrutto - aiBase.pieniadzBrutto) < 0.01,
  `miasto AI (owner 1, bez cudu) bez zmian (got delta=${aiWith.pieniadzBrutto - aiBase.pieniadzBrutto})`,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
