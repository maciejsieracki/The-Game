'use strict';
/** FALA 199: Pangea — rzeki w głębokim interiorze (nie tylko opaska przybrzeżna). */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.pangea-river-interior-entry.ts');
const BUNDLE = path.join(__dirname, '.pangea-river-interior-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { buildSeaDistanceField } from '../src/map/gen-helpers';
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
const TB = M.TerenBazowy;
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const SEEDS = [42, 123, 777, 2026, 5555];

function riverSeaDistBins(hexes, riverPaths, seaDist) {
  const bins = { '0-5': 0, '6-10': 0, '11-20': 0, '21+': 0 };
  const seen = new Set();
  for (const path of riverPaths ?? []) {
    for (const p of path ?? []) {
      const k = `${p.q},${p.r}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const d = seaDist.get(k) ?? 0;
      if (d <= 5) bins['0-5']++;
      else if (d <= 10) bins['6-10']++;
      else if (d <= 20) bins['11-20']++;
      else bins['21+']++;
    }
  }
  return bins;
}

let fail = 0;
console.log('=== Pangea interior rzeki (FALA 199, Standard) ===\n');

for (const seed of SEEDS) {
  const map = M.generujSwiat(seed, 'standardowy', 'pangea', { worldDensity: DENSITY });
  const seaDist = M.buildSeaDistanceField(map.hexes);
  const bins = riverSeaDistBins(map.hexes, map.riverPaths, seaDist);
  const total = bins['0-5'] + bins['6-10'] + bins['11-20'] + bins['21+'];
  const interiorShare = total > 0 ? bins['21+'] / total : 0;
  const coastDense = bins['0-5'] + bins['6-10'];
  const interiorOk = bins['21+'] >= 8 && interiorShare >= 0.06;
  const notCoastOnly = total === 0 || bins['21+'] > 0 || coastDense < total * 0.95;
  const ok = total >= 40 && interiorOk && notCoastOnly;
  if (!ok) fail++;
  console.log(
    `  seed ${seed}: total=${total} bins=${JSON.stringify(bins)} `
    + `interiorShare=${(100 * interiorShare).toFixed(1)}% → ${ok ? 'PASS' : 'FAIL'}`,
  );
}

console.log(`\n=== AC ===`);
console.log(`  5 seedów interior rzek >0: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} fail)`);
process.exit(fail > 0 ? 1 : 0);
