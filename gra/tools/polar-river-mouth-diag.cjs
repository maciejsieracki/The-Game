'use strict';
/** Diag: ujścia rzek na heksach Polarny przy brzegu (seaDist 1–2) — BUG-RZEKI-LODOWCE. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.polar-river-mouth-entry.ts');
const BUNDLE = path.join(__dirname, '.polar-river-mouth-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { buildSeaDistanceField, hexKey } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';`,
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
const DIRS = [[1, 0], [-1, 0], [1, -1], [-1, 1], [0, 1], [0, -1]];
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };

function countPolarCoastalRiverMouths(map) {
  const seaDist = M.buildSeaDistanceField(map.hexes);
  let polarCoastHexes = 0;
  let polarRiverHexes = 0;
  let polarCoastalRiverMouths = 0;

  for (const [key, hex] of Object.entries(map.hexes)) {
    if (hex.terenBazowy !== M.TerenBazowy.Polarny) continue;
    const d = seaDist.get(key) ?? 999;
    if (d >= 1 && d <= 2) polarCoastHexes++;
    if (!hex.rzeka?.obecna) continue;
    polarRiverHexes++;
    if (d >= 1 && d <= 2) polarCoastalRiverMouths++;
  }
  return { polarCoastHexes, polarRiverHexes, polarCoastalRiverMouths };
}

const SEEDS = [42, 123, 777, 2026];
const TYPES = ['kontynenty', 'pangea'];
let pass = 0;
let fail = 0;
let anyMouths = 0;

for (const seed of SEEDS) {
  for (const typ of TYPES) {
    const map = M.generujSwiat(seed, 'standardowy', typ, { worldDensity: DENSITY });
    const stats = countPolarCoastalRiverMouths(map);
    console.log(
      `seed=${seed} typ=${typ}: polarCoast=${stats.polarCoastHexes} `
      + `polarRiver=${stats.polarRiverHexes} mouths=${stats.polarCoastalRiverMouths}`,
    );
    if (stats.polarCoastHexes > 0 && stats.polarCoastalRiverMouths > 0) {
      pass++;
      anyMouths += stats.polarCoastalRiverMouths;
    } else if (stats.polarCoastHexes === 0) {
      pass++;
      console.log(`  (skip — brak polarnego brzegu na tej mapie)`);
    } else {
      fail++;
      console.error(`  FAIL — polarny brzeg bez ujść rzek`);
    }
  }
}

console.log(`\npolar-river-mouth-diag: ${fail === 0 ? 'PASS' : 'FAIL'} `
  + `(${pass} OK, ${fail} fail, total mouths=${anyMouths})`);
process.exit(fail > 0 ? 1 : 0);
