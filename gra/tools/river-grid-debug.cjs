'use strict';
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const entry = path.join(__dirname, '.river-grid-debug-entry.ts');
const bundle = path.join(__dirname, '.river-grid-debug-bundle.cjs');
fs.writeFileSync(entry, `
export { generateMap } from '../src/map/generator';
export {
  groupLandMassKeys, buildSeaDistanceField, riverCoverageCellSize,
  minLandHexesForRiverCell, assertRiverGridCoverage,
} from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: bundle, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});
const M = require(bundle);

function landHexesByCoverageCell(massSet, cellSize) {
  const cells = new Map();
  for (const key of massSet) {
    const [qs, rs] = key.split(',');
    const q = +qs;
    const r = +rs;
    const ck = `${Math.floor(q / cellSize)},${Math.floor(r / cellSize)}`;
    const arr = cells.get(ck) ?? [];
    arr.push([q, r]);
    cells.set(ck, arr);
  }
  return cells;
}

const map = M.generateMap(168, 120, 7, 'ziemia', {
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const cellSize = M.riverCoverageCellSize('medium');
const seaDist = M.buildSeaDistanceField(map.hexes);
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
console.log('paths', map.riverPaths.length, 'cellSize', cellSize, 'masses', masses.length);
for (const mass of masses) {
  const ms = new Set(mass);
  const cells = landHexesByCoverageCell(ms, cellSize);
  let need = 0;
  let miss = 0;
  for (const land of cells.values()) {
    if (land.length < M.minLandHexesForRiverCell(cellSize)) continue;
    const reach = land.some(([q, r]) => {
      const d = seaDist.get(`${q},${r}`) ?? 999;
      return d >= 2 && d <= 88;
    });
    if (!reach) continue;
    need++;
    const has = map.riverPaths.some((p) => {
      const s = p[0];
      return s && land.some(([q, r]) => s.q === q && s.r === r);
    });
    if (!has) miss++;
  }
  console.log('mass', mass.length, 'need', need, 'miss', miss, 'ok', miss === 0);
}
