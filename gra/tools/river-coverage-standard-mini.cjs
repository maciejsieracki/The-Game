'use strict';
/** Mini bramka: tylko Standard kontynenty seed 42 (dry patch + proximity). Max ~3 min. */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-coverage-mini-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-coverage-mini-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
export {
  groupLandMassKeys,
  maxDryLowlandPatchSize,
  maxLandHexDistanceToRiver,
  riverProximityMaxDist,
  MAX_DRY_LOWLAND_PATCH_HEXES,
} from '../src/map/gen-helpers';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const t0 = Date.now();
const w = 168;
const h = 120;
const seed = 42;
const typ = 'kontynenty';

const map = M.generateMap(w, h, seed, typ, {
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const params = M.resolveRiverMapParams('medium', w, h);
const cellSize = params.mainCell;
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);

let maxDry = 0;
let maxProx = 0;
for (const mass of masses) {
  if (mass.length < 150) continue;
  maxDry = Math.max(maxDry, M.maxDryLowlandPatchSize(mass, map.hexes));
  maxProx = Math.max(maxProx, M.maxLandHexDistanceToRiver(mass, map.hexes));
}

const proxLimit = M.riverProximityMaxDist(cellSize);
const proxHard = Math.min(proxLimit + 5, Math.max(proxLimit, Math.ceil(cellSize * 2)));
const dryHard = M.MAX_DRY_LOWLAND_PATCH_HEXES + 5;
const dryOk = maxDry <= dryHard;
const proxOk = maxProx <= proxHard;
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`river-coverage-standard-mini: ${elapsed}s`);
console.log(`  dry patch max=${maxDry} (limit ${dryHard}) ${dryOk ? 'OK' : 'FAIL'}`);
console.log(`  proximity max=${maxProx} (limit ${proxHard}) ${proxOk ? 'OK' : 'FAIL'}`);

process.exit(dryOk && proxOk ? 0 : 1);
