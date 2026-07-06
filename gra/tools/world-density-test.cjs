'use strict';
/** MAPA E2 — gęstość świata (AC-7): tiery Mało/Normalnie/Dużo, determinism, hodowla≠Gory. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.world-density-entry.ts');
const BUNDLE = path.resolve(__dirname, '.world-density-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export {
  resolveWorldGenNumbers,
  DEFAULT_WORLD_DENSITY,
} from '../src/map/newGameMapDefaults';
export { mapGenResourceMult } from '../src/data/map-gen-params-loader';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const preset = (resources, rivers, desert, forest, relief = 'medium') => ({
  resources, rivers, desert, forest, relief,
});

const genOpts = (tierPack) => ({
  worldDensity: tierPack,
  mapSizeMenuLabel: 'Mały',
});

function mapFingerprint(map) {
  const parts = [];
  for (const k of Object.keys(map.hexes).sort()) {
    const h = map.hexes[k];
    parts.push(`${k}:${h.terenBazowy}:${h.nakladka}:${h.zloze ?? ''}`);
  }
  return parts.join('|');
}

function countDeposits(map) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.zloze) n++;
    else if (h.nakladka !== M.Nakladka.Brak && h.nakladka !== M.Nakladka.Las) n++;
  }
  return n;
}

function countTerrain(map, teren) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.terenBazowy === teren) n++;
  }
  return n;
}

function countForest(map) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.nakladka === M.Nakladka.Las) n++;
  }
  return n;
}

function countRiverPaths(map) {
  return map.riverPaths?.length ?? 0;
}

function livestockOnGory(map) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.terenBazowy !== M.TerenBazowy.Gory) continue;
    if (h.nakladka === M.Nakladka.ZlozeBydla || h.nakladka === M.Nakladka.ZlozeOwiec) n++;
    if (h.zloze === 'bydlo' || h.zloze === 'owce') n++;
  }
  return n;
}

// Panel-A JSON → loader
ok(M.mapGenResourceMult('low') === 0.6, 'JSON surowce mult low=0.6');
ok(M.mapGenResourceMult('medium') === 1.0, 'JSON surowce mult medium=1.0');
ok(M.mapGenResourceMult('high') === 1.4, 'JSON surowce mult high=1.4');

const wgnLow = M.resolveWorldGenNumbers(genOpts(preset('low', 'low', 'low', 'low', 'low')));
const wgnMed = M.resolveWorldGenNumbers(genOpts(preset('medium', 'medium', 'medium', 'medium', 'medium')));
const wgnHigh = M.resolveWorldGenNumbers(genOpts(preset('high', 'high', 'high', 'high', 'high')));

ok(wgnLow.resourceMult < wgnMed.resourceMult && wgnMed.resourceMult < wgnHigh.resourceMult, 'resourceMult low<med<high');
ok(wgnLow.maxRivers < wgnMed.maxRivers && wgnMed.maxRivers <= wgnHigh.maxRivers, 'maxRivers low<med<=high (Mały)');
ok(wgnHigh.desertThreshold < wgnMed.desertThreshold && wgnMed.desertThreshold < wgnLow.desertThreshold, 'desert threshold high=więcej pustyni');
ok(wgnHigh.forestThreshold < wgnMed.forestThreshold && wgnMed.forestThreshold < wgnLow.forestThreshold, 'forest threshold high=więcej lasu');
ok(wgnHigh.mountainThreshold < wgnMed.mountainThreshold && wgnMed.mountainThreshold < wgnLow.mountainThreshold, 'mountain threshold high=więcej gór');
ok(wgnHigh.highlandThreshold < wgnMed.highlandThreshold && wgnMed.highlandThreshold < wgnLow.highlandThreshold, 'highland threshold high=więcej wzgórz');
ok(wgnMed.resourceBaseline === 1.35, 'baseline rarity gdy preset z kreatora');

// Determinism
const detOpts = genOpts(M.DEFAULT_WORLD_DENSITY);
const a = M.generujSwiat(424242, 'maly', 'kontynenty', detOpts);
const b = M.generujSwiat(424242, 'maly', 'kontynenty', detOpts);
ok(mapFingerprint(a) === mapFingerprint(b), 'determinism seed=424242 + preset');

// Monotonicność tierów (suma po seedach)
const seeds = [1, 7, 42, 99, 2026];
let sumDepLow = 0, sumDepMed = 0, sumDepHigh = 0;
let sumRivLow = 0, sumRivMed = 0, sumRivHigh = 0;
let sumDesLow = 0, sumDesMed = 0, sumDesHigh = 0;
let sumForLow = 0, sumForMed = 0, sumForHigh = 0;

for (const seed of seeds) {
  const low = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('low', 'low', 'low', 'low', 'medium')));
  const med = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('medium', 'medium', 'medium', 'medium', 'medium')));
  const high = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('high', 'high', 'high', 'high', 'medium')));

  sumDepLow += countDeposits(low);
  sumDepMed += countDeposits(med);
  sumDepHigh += countDeposits(high);
  sumRivLow += countRiverPaths(low);
  sumRivMed += countRiverPaths(med);
  sumRivHigh += countRiverPaths(high);
  sumDesLow += countTerrain(low, M.TerenBazowy.Pustynia);
  sumDesMed += countTerrain(med, M.TerenBazowy.Pustynia);
  sumDesHigh += countTerrain(high, M.TerenBazowy.Pustynia);
  sumForLow += countForest(low);
  sumForMed += countForest(med);
  sumForHigh += countForest(high);

  ok(livestockOnGory(low) === 0, `seed=${seed} low: bydło/owce nie na Gory`);
  ok(livestockOnGory(med) === 0, `seed=${seed} med: bydło/owce nie na Gory`);
  ok(livestockOnGory(high) === 0, `seed=${seed} high: bydło/owce nie na Gory`);
}

ok(sumDepLow <= sumDepMed && sumDepMed <= sumDepHigh, `złoża sum low=${sumDepLow} med=${sumDepMed} high=${sumDepHigh}`);
ok(sumRivLow <= sumRivMed && sumRivMed <= sumRivHigh, `rzeki sum low=${sumRivLow} med=${sumRivMed} high=${sumRivHigh}`);
ok(sumDesLow <= sumDesMed && sumDesMed <= sumDesHigh, `pustynia sum low=${sumDesLow} med=${sumDesMed} high=${sumDesHigh}`);
ok(sumForLow <= sumForMed && sumForMed <= sumForHigh, `las sum low=${sumForLow} med=${sumForMed} high=${sumForHigh}`);

let sumMtnLowR = 0, sumMtnMedR = 0, sumMtnHighR = 0;
for (const seed of seeds) {
  const rl = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('medium', 'medium', 'medium', 'medium', 'low')));
  const rm = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('medium', 'medium', 'medium', 'medium', 'medium')));
  const rh = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('medium', 'medium', 'medium', 'medium', 'high')));
  sumMtnLowR += countTerrain(rl, M.TerenBazowy.Gory) + countTerrain(rl, M.TerenBazowy.Wzgorza);
  sumMtnMedR += countTerrain(rm, M.TerenBazowy.Gory) + countTerrain(rm, M.TerenBazowy.Wzgorza);
  sumMtnHighR += countTerrain(rh, M.TerenBazowy.Gory) + countTerrain(rh, M.TerenBazowy.Wzgorza);
}
ok(sumMtnLowR <= sumMtnMedR && sumMtnMedR <= sumMtnHighR, `góry+wzg relief tier low=${sumMtnLowR} med=${sumMtnMedR} high=${sumMtnHighR}`);

console.log(`world-density-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
