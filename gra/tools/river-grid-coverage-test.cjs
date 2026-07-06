'use strict';
/** Siatka rzek: w każdej komórce N×N lądu min. 1 źródło → morze (Maciej 2026-07-04). */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-grid-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-grid-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  groupLandMassKeys,
  assertRiverGridCoverage,
  riverGridCoverageRatio,
  riverCoverageCellSize,
  buildSeaDistanceField,
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
  const cellSize = M.riverCoverageCellSize('medium');
  const seaDist = M.buildSeaDistanceField(map.hexes);
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
  const kinds = map.riverPathKinds;
  const mains = kinds.filter((k) => k === 'main').length;
  const minPaths = typ === 'ziemia' ? 35 : 40;
  ok(mains >= minPaths, `${label}: ≥${minPaths} głównych rzek (${mains})`);
  ok(map.riverPaths.length >= minPaths, `${label}: ≥${minPaths} tras łącznie (${map.riverPaths.length})`);

  let okMasses = 0;
  let total = 0;
  for (const mass of masses) {
    if (mass.length < 150) continue;
    total++;
    const ratio = M.riverGridCoverageRatio(mass, map.riverPaths, cellSize, seaDist, 80, kinds, 25);
    if (ratio >= 0.75) okMasses++;
    else console.log(`  ${label} mass ${mass.length} hex: pokrycie ${(ratio * 100).toFixed(0)}%`);
  }
  ok(total === 0 || okMasses === total, `${label}: siatka ${cellSize}×${cellSize} ≥75% (${okMasses}/${total} mas ≥150 hex)`);

  let short = 0;
  let mainCount = 0;
  const minMainLen = 12;
  for (let i = 0; i < map.riverPaths.length; i++) {
    if (kinds[i] !== 'main') continue;
    mainCount++;
    const len = map.riverPaths[i]?.length ?? 0;
    if (len < minMainLen) short++;
  }
  ok(mainCount === 0 || short === 0, `${label}: główne rzeki ≥${minMainLen} hex (${short}/${mainCount} za krótkie)`);
}

console.log(`\nriver-grid-coverage-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
