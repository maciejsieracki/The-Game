'use strict';
/** Siatka rzek: twardy fill STARTÓW w komórkach N×N (Maciej 2026-07-31). */

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
  assertRiverGridCoverage,
  riverGridCoverageRatio,
  cellHasRiverSourceInCell,
  buildSeaDistanceField,
  minLandHexesForRiverCell,
  landHexesByCoverageCell,
  pathHasValidRiverOutlet,
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
  const params = M.resolveRiverMapParams('medium', w, h);
  const cellSize = params.mainCell;
  const seaDist = M.buildSeaDistanceField(map.hexes);
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
  const kinds = map.riverPathKinds;
  const mains = kinds.filter((k) => k === 'main').length;
  const tribs = kinds.filter((k) => k === 'tributary').length;
  const sources = map.riverPaths.length;

  ok(sources >= 40, `${label}: ≥40 startów rzek (${sources}, main=${mains} trib=${tribs})`);

  let orphanPaths = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    const p = map.riverPaths[i];
    const others = map.riverPaths.filter((_, j) => j !== i);
    const otherKinds = kinds.filter((_, j) => j !== i);
    if (!M.pathHasValidRiverOutlet(map.hexes, p, others, otherKinds, w, h)) orphanPaths++;
  }
  ok(orphanPaths === 0, `${label}: 0 tras bez ujścia (${orphanPaths})`);

  const minLand = M.minLandHexesForRiverCell(cellSize);
  let needCells = 0;
  let hitCells = 0;
  for (const mass of masses) {
    if (mass.length < 80) continue;
    const massSet = new Set(mass);
    for (const land of M.landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;
      const reachable = land.some(([q, r]) => {
        const d = seaDist.get(`${q},${r}`) ?? 999;
        return d >= 2 && d <= params.maxLen + 40;
      });
      if (!reachable) continue;
      needCells++;
      if (M.cellHasRiverSourceInCell(land, map.riverPaths)) hitCells++;
    }
  }
  const srcPct = needCells > 0 ? Math.round((100 * hitCells) / needCells) : 100;
  const srcMin = typ === 'ziemia' ? 55 : 80;
  ok(needCells === 0 || srcPct >= srcMin, `${label}: starty w siatce ${cellSize}×${cellSize} ≥${srcMin}% (${hitCells}/${needCells} = ${srcPct}%)`);

  const hexMin = typ === 'ziemia' ? 0.5 : 0.75;
  let okMasses = 0;
  let total = 0;
  for (const mass of masses) {
    if (mass.length < (typ === 'ziemia' ? 200 : 150)) continue;
    total++;
    const ratio = M.riverGridCoverageRatio(
      mass, map.riverPaths, cellSize, seaDist, params.maxLen, kinds,
      params.minLen, map.hexes, params.minInlandCell,
    );
    if (ratio >= hexMin) okMasses++;
    else console.log(`  ${label} mass ${mass.length} hex: pokrycie ${(ratio * 100).toFixed(0)}%`);
  }
  ok(total === 0 || okMasses === total, `${label}: siatka hex ≥${Math.round(hexMin * 100)}% (${okMasses}/${total} mas)`);
}

console.log(`\nriver-grid-coverage-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
