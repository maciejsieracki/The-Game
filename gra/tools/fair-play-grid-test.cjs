'use strict';
/** Fair play: złoża per komórka + brak ogromnych klastrów gór (Maciej 2026-07-04). */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.fair-play-grid-entry.ts');
const BUNDLE = path.resolve(__dirname, '.fair-play-grid-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  groupLandMassKeys,
  depositGridCoverageRatio,
  forestGridCoverageRatio,
  fairPlayResourceCellSize,
  forestCoverageCellSize,
  reliefCoverageCellSize,
  landHexesByCoverageCell,
} from '../src/map/gen-helpers';
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
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const { TerenBazowy } = M;

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

function maxReliefInCell(land, hexes, tb) {
  let n = 0;
  for (const [q, r] of land) {
    if (hexes[`${q},${r}`]?.terenBazowy === tb) n++;
  }
  return n;
}

const cases = [
  { w: 168, h: 120, typ: 'kontynenty', seed: 42, label: 'Standard kontynenty' },
  { w: 168, h: 120, typ: 'ziemia', seed: 7, label: 'Standard Ziemia' },
];

for (const { w, h, typ, seed, label } of cases) {
  const map = M.generateMap(w, h, seed, typ, {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const depositCell = M.fairPlayResourceCellSize('medium');
  const forestCell = M.forestCoverageCellSize('medium');
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 150);

  for (const mass of masses) {
    const ratio = M.depositGridCoverageRatio(mass, map.hexes, depositCell);
    ok(ratio >= 0.85, `${label}: złoża siatka ${depositCell} ≥85% (${(ratio * 100).toFixed(0)}%)`);
    const forestRatio = M.forestGridCoverageRatio(mass, map.hexes, forestCell);
    ok(forestRatio >= 0.85, `${label}: las siatka ${forestCell} ≥85% (${(forestRatio * 100).toFixed(0)}%)`);

    const massSet = new Set(mass);
    let worstMtn = 0;
    let worstHi = 0;
    let worstLand = 0;
    for (const land of M.landHexesByCoverageCell(massSet, depositCell).values()) {
      if (land.length < 8) continue;
      worstLand = Math.max(worstLand, land.length);
      worstMtn = Math.max(worstMtn, maxReliefInCell(land, map.hexes, TerenBazowy.Gory));
      worstHi = Math.max(worstHi, maxReliefInCell(land, map.hexes, TerenBazowy.Wzgorza));
    }
    const maxMtnAllowed = Math.max(3, Math.ceil(worstLand * 0.04));
    const maxHiAllowed = Math.max(3, Math.ceil(worstLand * 0.06));
    ok(
      worstMtn <= maxMtnAllowed,
      `${label}: max gór w komórce ${worstMtn} ≤ ${maxMtnAllowed}`,
    );
    ok(worstHi <= maxHiAllowed, `${label}: max wzgórz w komórce ${worstHi} ≤ ${maxHiAllowed}`);
    break;
  }
}

console.log(`\nfair-play-grid-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
