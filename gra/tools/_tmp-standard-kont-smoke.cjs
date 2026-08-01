'use strict';
/** Szybki smoke: tylko Standard kontynenty seed 42. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-grid-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-grid-bundle.cjs');

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
const { MAX_DRY_LOWLAND_PATCH_HEXES } = M;
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('PASS:', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

const w = 168, h = 120, typ = 'kontynenty', seed = 42, label = 'Standard kontynenty';
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
const proxHard = Math.min(
  M.riverProximityMaxDist(cellSize) + 5,
  Math.max(M.riverProximityMaxDist(cellSize), Math.ceil(cellSize * 2)),
);
ok(maxDry <= MAX_DRY_LOWLAND_PATCH_HEXES + 5, `${label}: max suchy płat ≤${MAX_DRY_LOWLAND_PATCH_HEXES + 5} (${maxDry})`);
ok(maxProx <= proxHard, `${label}: max dystans ląd→rzeka ≤${proxHard} (${maxProx})`);
console.log(`\nstandard-kontynenty-smoke: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
