'use strict';
/**
 * Macierz pojemności: ile typów cywilizacji × ile miast-państw na klaster
 * przy regułach spawnu (3 hex w klastrze gracza, 5 hex obce + od stolicy).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-capacity-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-capacity-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { computeClusters } from '../src/map/clusters';
export { countLandSeaHexes } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);

const MAPS = [
  ['Malenki', 'malenki'],
  ['Mały', 'maly'],
  ['Standardowy', 'standardowy'],
  ['Duży', 'duzy'],
  ['Ogromny', 'ogromny'],
  ['Super Huge', 'superogromny'],
];

const SEEDS = [1, 42, 2026];
const TYP = 'kontynenty';

function spawnableLand(map) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    const t = h.terenBazowy;
    if (t !== M.TerenBazowy.Morze && t !== M.TerenBazowy.Gory) n++;
  }
  return n;
}

/** Max miast (stolica + państwa) tak, by KAŻDY klaster miał >= target. */
function maxCitiesPerCluster(map, nTypow, seeds) {
  let best = 1;
  for (let target = 2; target <= 24; target++) {
    let okAllSeeds = true;
    for (const seed of seeds) {
      const cp = M.computeClusters(map, {
        seed,
        aktywneTypy: nTypow,
        rywaleNaKlaster: target - 1,
        minDystansKlastrow: 12,
      });
      const minGot = Math.min(...cp.klastry.map(k => k.miasta.length));
      if (minGot < target) {
        okAllSeeds = false;
        break;
      }
    }
    if (okAllSeeds) best = target;
    else break;
  }
  return best;
}

/** Teoretyczny sufit: region Voronoi ~ land/N, poisson min d → ~ region / (3*d*(d+1)+1) */
function theoryCap(regionHex, minDist) {
  const block = 1 + 3 * minDist * (minDist + 1);
  return Math.max(1, Math.floor(regionHex / block));
}

console.log('=== POJEMNOŚĆ MAP (typ: Kontynenty, ląd ~30%, spawn bez Gór) ===');
console.log('Reguły: mp min 3 hex (gracz + obcy klaster) | obce od stolicy gracza min 5 hex | centra klastrów min 12 hex');
console.log('');

for (const [label, rozmiar] of MAPS) {
  const landBySeed = [];
  let mapRef = null;
  for (const seed of SEEDS) {
    const map = M.generujSwiat(seed, rozmiar, TYP);
    landBySeed.push(spawnableLand(map));
    if (seed === 42) mapRef = map;
  }
  const landAvg = Math.round(landBySeed.reduce((a, b) => a + b, 0) / landBySeed.length);
  const total = mapRef ? Object.keys(mapRef.hexes).length : 0;

  console.log(`--- ${label} (${total} hex, ląd spawn ~${landAvg}) ---`);
  console.log('Typów (gracz+AI) | max mp/klaster (symulacja 3 seed) | teoria/player d=3 | teoria/obcy d=5');
  console.log('-----------------|----------------------------------|-------------------|------------------');

  for (let nTypow = 1; nTypow <= 10; nTypow++) {
    const maxMp = maxCitiesPerCluster(mapRef, nTypow, SEEDS);
    const regionAvg = Math.floor(landAvg / nTypow);
    const thPlayer = theoryCap(regionAvg, 3);
    const thForeign = theoryCap(regionAvg, 5);
    const aiCount = nTypow - 1;
    const labelTyp = nTypow === 1 ? '1 (sam gracz)' : `${nTypow} (AI: ${aiCount})`;
    console.log(
      `${String(labelTyp).padEnd(17)}| ${String(maxMp).padStart(32)} | ${String(thPlayer).padStart(17)} | ${String(thForeign).padStart(16)}`,
    );
  }
  console.log('');
}

console.log('Legenda: mp = miasta-państwa + stolica w klastrze (każdy typ ma własny klaster).');
console.log('Symulacja = computeClusters na mapie seed 42, weryfikacja seed 1+2026.');
