'use strict';
/** Skalowanie parametrów rzek z rozmiarem mapy (Maciej 2026-07-28). */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.river-map-scale-entry.ts');
const BUNDLE = path.join(__dirname, '.river-map-scale-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
export { pathEndsAtSea } from '../src/map/gen-helpers';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('PASS:', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };

const sizes = [
  { w: 76, h: 52, label: 'Maleński', menu: 'Maleński' },
  { w: 168, h: 120, label: 'Standard', menu: 'Standardowy' },
  { w: 672, h: 476, label: 'Super', menu: 'Super Ogromny' },
];

const paramsBySize = {};
for (const { w, h, label } of sizes) {
  paramsBySize[label] = M.resolveRiverMapParams('medium', w, h);
}

ok(
  paramsBySize.Maleński.minLen < paramsBySize.Standard.minLen,
  `Maleński minLen (${paramsBySize.Maleński.minLen}) < Standard (${paramsBySize.Standard.minLen})`,
);

ok(
  paramsBySize.Maleński.minLen <= Math.floor(52 * 0.35),
  `Maleński minLen (${paramsBySize.Maleński.minLen}) <= floor(52*0.35)=${Math.floor(52 * 0.35)}`,
);

for (const { w, h, label, menu } of sizes) {
  const map = M.generateMap(w, h, 42, 'kontynenty', {
    mapSizeMenuLabel: menu,
    worldDensity: DENSITY,
  });
  const kinds = map.riverPathKinds ?? [];
  const mains = kinds.filter((k) => k === 'main').length;
  const tribs = kinds.filter((k) => k === 'tributary').length;

  let orphans = 0;
  for (let i = 0; i < kinds.length; i++) {
    if (kinds[i] !== 'main') continue;
    const path = map.riverPaths[i];
    if (!path || path.length === 0) continue;
    if (!M.pathEndsAtSea(map.hexes, path, w, h)) orphans++;
  }
  ok(orphans === 0, `${label}: 0 głównych bez ujścia (${orphans})`);
  ok(tribs > 0, `${label}: dopływy > 0 (${tribs})`);
  ok(mains > 0, `${label}: główne > 0 (${mains})`);
}

console.log(`\nriver-map-scale-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
