'use strict';
/** Siatka reliefu: 15×15 min 4× Góry/Wzgórza (tier Normalnie, Maciej 2026-07-29). */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.relief-grid-entry.ts');
const BUNDLE = path.resolve(__dirname, '.relief-grid-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  groupLandMassKeys,
  ironGridCoverageRatio,
  copperGridCoverageRatio,
  ironCoverageCellSize,
  copperCoverageCellSize,
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

const cases = [
  { w: 168, h: 120, typ: 'kontynenty', seed: 42, label: 'Standard kontynenty' },
  { w: 168, h: 120, typ: 'ziemia', seed: 7, label: 'Standard Ziemia' },
  { w: 336, h: 238, typ: 'ziemia', seed: 99, label: 'Ogromny Ziemia' },
];

for (const { w, h, typ, seed, label } of cases) {
  const map = M.generateMap(w, h, seed, typ, {
    mapSizeMenuLabel: w >= 300 ? 'Ogromny' : 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const ironSize = M.ironCoverageCellSize('medium');
  const copperSize = M.copperCoverageCellSize('medium');
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);

  let okIron = 0;
  let okCopper = 0;
  let total = 0;
  for (const mass of masses) {
    if (mass.length < 150) continue;
    total++;
    const iron = M.ironGridCoverageRatio(mass, map.hexes, ironSize);
    const copper = M.copperGridCoverageRatio(mass, map.hexes, copperSize);
    if (iron >= 0.85) okIron++;
    else console.log(`  ${label} mass ${mass.length}: żelazo ${(iron * 100).toFixed(0)}%`);
    if (copper >= 0.85) okCopper++;
    else console.log(`  ${label} mass ${mass.length}: miedź/wzg ${(copper * 100).toFixed(0)}%`);
  }
  ok(total === 0 || okIron === total, `${label}: żelazo ${ironSize}×${ironSize} ≥85% (${okIron}/${total})`);
  ok(total === 0 || okCopper === total, `${label}: miedź ${copperSize}×${copperSize} ≥85% (${okCopper}/${total})`);
}

console.log(`\nrelief-grid-coverage-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
