'use strict';
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const fs = require('fs');
const BUNDLE = path.resolve(__dirname, '.river-density-diag.cjs');
fs.writeFileSync(path.resolve(__dirname, '.river-density-diag-e.ts'), `export { generateMap } from '../src/map/generator';
export {
  groupLandMassKeys,
  buildSeaDistanceField,
  landHexesByCoverageCell,
  riverCoverageCellSize,
  minLandHexesForRiverCell,
  riverGridCoverageRatio,
  traceRiver,
} from '../src/map/gen-helpers';
export { resolveWorldGenNumbers, resolveRiverTraceForMap } from '../src/map/newGameMapDefaults';`, 'utf8');
esbuild.buildSync({ entryPoints: [path.resolve(__dirname, '.river-density-diag-e.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);

const opts = { mapSizeMenuLabel: 'Standardowy', worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' } };
const map = M.generateMap(168, 120, 42, 'ziemia', opts);
const wgn = M.resolveWorldGenNumbers(opts);
const trace = M.resolveRiverTraceForMap('Standardowy', 'medium');

let land = 0;
for (const h of Object.values(map.hexes)) {
  if (h.terenBazowy !== 'morze' && h.terenBazowy !== 'wybrzeze') land++;
}

const cellSize = M.riverCoverageCellSize('medium');
const minLand = M.minLandHexesForRiverCell(cellSize);
const seaDist = M.buildSeaDistanceField(map.hexes);
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
const kinds = map.riverPathKinds;

let totalCells = 0;
let eligibleCells = 0;
for (const mass of masses) {
  const massSet = new Set(mass);
  for (const land of M.landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    totalCells++;
    const reachable = land.some(([q, r]) => {
      const d = seaDist.get(`${q},${r}`) ?? 999;
      return d >= 2 && d <= trace.maxLen + 8;
    });
    if (reachable) eligibleCells++;
  }
}
const coveredCells = Math.round(eligibleCells * M.riverGridCoverageRatio(
  masses.flat(), map.riverPaths, cellSize, seaDist, trace.maxLen, kinds, trace.minLen,
));

console.log('=== Ziemia seed 42 ===');
console.log('land hexes:', land);
console.log('river trace minLen/maxLen:', trace.minLen, trace.maxLen);
console.log('cellSize:', cellSize, 'minLand/cell:', minLand);
console.log('paths:', map.riverPaths.length, 'mains:', kinds.filter((k) => k === 'main').length);
console.log('theoretical cells (land/100):', Math.floor(land / (cellSize * cellSize)));
console.log('grid cells with enough land:', totalCells);
console.log('eligible (reachable inland):', eligibleCells);
console.log('covered by main river:', coveredCells, `(${(100 * coveredCells / Math.max(1, eligibleCells)).toFixed(0)}%)`);

for (const mass of masses) {
  const ratio = M.riverGridCoverageRatio(mass, map.riverPaths, cellSize, seaDist, trace.maxLen, kinds, trace.minLen);
  console.log(`mass ${mass.length} hex: grid coverage ${(ratio * 100).toFixed(0)}%`);
}

// why traces fail: sample failed cells
let failShort = 0;
let failEmpty = 0;
let failOk = 0;
const massSet = new Set(masses[1]); // Americas ~1424
for (const land of M.landHexesByCoverageCell(massSet, cellSize).values()) {
  if (land.length < minLand) continue;
  const has = map.riverPaths.some((path, i) => {
    if (kinds[i] !== 'main') return false;
    const s = new Set(land.map(([q, r]) => `${q},${r}`));
    return path.some((p) => s.has(`${p.q},${p.r}`));
  });
  if (has) continue;
  const best = land.reduce((a, [q, r]) => {
    const d = seaDist.get(`${q},${r}`) ?? 0;
    return d > (a?.d ?? 0) ? { q, r, d } : a;
  }, null);
  if (!best || best.d < 2) continue;
  const p = M.traceRiver(map.hexes, best.q, best.r, trace.maxLen, { seaDist, rand: () => 0.5, minLen: trace.minLen });
  if (p.length === 0) failEmpty++;
  else if (p.length < trace.minLen) failShort++;
  else failOk++;
}
console.log('\nSample mass 1424 — uncovered cells trace test:');
console.log('  empty trace:', failEmpty, 'short (<minLen):', failShort, 'ok:', failOk);

let cellsPass = 0;
let cellsNoSource = 0;
for (const mass of masses) {
  for (const cell of M.landHexesByCoverageCell(new Set(mass), cellSize).values()) {
    if (cell.length < minLand) continue;
    const set = new Set(cell.map(([q, r]) => `${q},${r}`));
    let hasSource = false;
    let hasPass = false;
    for (let i = 0; i < map.riverPaths.length; i++) {
      if (kinds[i] !== 'main') continue;
      const path = map.riverPaths[i];
      if (path[0] && set.has(`${path[0].q},${path[0].r}`)) hasSource = true;
      if (path.some((p) => set.has(`${p.q},${p.r}`))) hasPass = true;
    }
    if (hasPass) cellsPass++;
    if (!hasSource) cellsNoSource++;
  }
}
console.log('\nPer-cell (10x10): pass-through:', cellsPass, '| brak wlasnego zrodla:', cellsNoSource);
