'use strict';
/** Diagnostyka: siatka 10×10 vs sufit rzek / masa (Maciej 2026-07-04). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const BUNDLE = path.resolve(__dirname, '.river-cap-diag-bundle.cjs');
const ENTRY = path.resolve(__dirname, '.river-cap-diag-entry.ts');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  groupLandMassKeys,
  riversQuotaForLandMass,
  riverCoverageCellSize,
  landHexesByCoverageCell,
} from '../src/map/gen-helpers';
export { scaleMaxRiversForLand, maxRiversForMapAndDensity, riverMinPathLengthForTier } from '../src/map/newGameMapDefaults';`,
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
});

const M = require(BUNDLE);

function countGridNeed(massSet, cellSize) {
  const minLand = Math.max(8, Math.floor(cellSize * 0.32));
  let n = 0;
  for (const land of M.landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length >= minLand) n++;
  }
  return n;
}

function analyze(label, map, tier) {
  const cellSize = M.riverCoverageCellSize(tier);
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
  let totalLand = 0;
  let totalMains = 0;
  let totalGridNeed = 0;
  let totalQuotaCap = 0;
  const minLen = M.riverMinPathLengthForTier(tier);
  const configuredMax = M.maxRiversForMapAndDensity('Standardowy', tier);
  const scaledMax = M.scaleMaxRiversForLand(configuredMax, totalLand, tier);

  const rows = [];
  for (const mass of masses) {
    totalLand += mass.length;
    const massSet = new Set(mass);
    const gridNeed = countGridNeed(massSet, cellSize);
    totalGridNeed += gridNeed;
    const quota = M.riversQuotaForLandMass(mass.length, tier);
    totalQuotaCap += quota;
    const mainsOnMass = map.riverPathKinds.filter((k, i) => {
      if (k !== 'main') return false;
      const p0 = map.riverPaths[i]?.[0];
      if (!p0) return false;
      return massSet.has(`${p0.q},${p0.r}`);
    }).length;
    totalMains += mainsOnMass;
    rows.push({ land: mass.length, gridNeed, quota, mains: mainsOnMass });
  }

  const scaledMaxFinal = M.scaleMaxRiversForLand(configuredMax, totalLand, tier);
  const effectiveMaxOld = Math.max(Math.ceil(totalGridNeed * 1.2), totalGridNeed + 4, 1);
  const shortMains = map.riverPathKinds.filter((k, i) => k === 'main' && (map.riverPaths[i]?.length ?? 0) < minLen).length;
  const pathLens = map.riverPathKinds
    .map((k, i) => (k === 'main' ? map.riverPaths[i]?.length ?? 0 : 0))
    .filter((n) => n > 0);

  console.log(`\n=== ${label} ===`);
  console.log(`  Ląd razem: ${totalLand} hex (${((100 * totalLand) / (168 * 120)).toFixed(1)}% mapy)`);
  console.log(`  Komórki siatki ${cellSize}×${cellSize} (potrzeba min. 1 źródło): ${totalGridNeed}`);
  console.log(`  effectiveMax (stary limit generatora): ${effectiveMaxOld}`);
  console.log(`  riversQuotaForLandMass (sufit/masa, suma): ${totalQuotaCap}  [liczba RZEK, nie hexów]`);
  console.log(`  maxRivers mapa (JSON+skala): ${configuredMax} → scaleMaxRiversForLand: ${scaledMaxFinal}`);
  console.log(`  Wygenerowano głównych nurtów: ${totalMains} (za krótkie <${minLen}: ${shortMains})`);
  if (pathLens.length) {
    const avg = pathLens.reduce((a, b) => a + b, 0) / pathLens.length;
    console.log(`  Długość głównych: min=${Math.min(...pathLens)} avg=${avg.toFixed(1)} max=${Math.max(...pathLens)} hex`);
  }
  for (const r of rows.slice(0, 5)) {
    console.log(`    masa ${r.land} hex → siatka=${r.gridNeed} quota=${r.quota} wygenerowano=${r.mains}`);
  }
  if (rows.length > 5) console.log(`    … +${rows.length - 5} mas`);
}

const opts = {
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.3,
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
};

for (const typ of ['kontynenty', 'pangea']) {
  const map = M.generateMap(168, 120, 42, typ, opts);
  analyze(`Standard 168×120 · ląd 30% · ${typ} · rzeki Normalnie`, map, 'medium');
}

console.log('\nTeoretycznie (1 masa 6048 hex):');
console.log('  siatka 10×10 ≈', Math.ceil(6048 / 100), '–', Math.ceil(6048 / 80), 'komórek (zależy od kształtu)');
console.log('  sufit quota medium = min(180, 6048/2) = 180 rzek');
console.log('  min długość 25 hex NIE wchodzi w sufit — sufit to liczba nurtów, nie suma hexów trasy');
