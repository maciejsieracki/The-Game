'use strict';
/**
 * difficulty-cost-test.cjs — test asymetrii kosztow wg trudnosci.
 * Run from gra/:  node tools/difficulty-cost-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[difficulty-cost-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.difficulty-cost-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.difficulty-cost-bundle.cjs');

const SRC = process.env.DC_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export {
  getCostMultiplierForOwner,
  applyDifficultyCostMultiplier,
  scaledResearchCost,
  getPopulationGrowthDifficultyMultiplier,
  getPopulationGrowthThresholdMultiplier,
  applyPopulationGrowthThreshold,
} from ${JSON.stringify(SRC + '/game/difficulty-cost')};
export { applyBuildingCostPace } from ${JSON.stringify(SRC + '/game/building-cost-tempo')};
export { applyGrowthThresholdPace } from ${JSON.stringify(SRC + '/game/population-growth-tempo')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[difficulty-cost-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const {
  getCostMultiplierForOwner,
  applyDifficultyCostMultiplier,
  scaledResearchCost,
  getPopulationGrowthDifficultyMultiplier,
  getPopulationGrowthThresholdMultiplier,
  applyPopulationGrowthThreshold,
  applyBuildingCostPace,
  applyGrowthThresholdPace,
} = B;

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}

console.log('\n[difficulty-cost-test] Uruchamiam testy...\n');

// Mnozniki trudnosci
eq(getCostMultiplierForOwner(0, 'normal'), 1, 'normal gracz x1');
eq(getCostMultiplierForOwner(5, 'normal'), 1, 'normal AI x1');
eq(getCostMultiplierForOwner(0, 'easy'), 1, 'easy gracz x1');
eq(getCostMultiplierForOwner(3, 'easy'), 2, 'easy AI/miasto-panstwo x2');
eq(getCostMultiplierForOwner(0, 'hard'), 2, 'hard gracz x2');
eq(getCostMultiplierForOwner(7, 'hard'), 1, 'hard AI x1');

// applyDifficultyCostMultiplier
eq(applyDifficultyCostMultiplier(50, 0, 'hard'), 100, 'hard gracz: 50 -> 100');
eq(applyDifficultyCostMultiplier(50, 2, 'easy'), 100, 'easy AI: 50 -> 100');

// Przyklad Macieja: latwa + normalny tempo budynkow (baza 10)
// gracz: 10 x2 (tempo) x1 (trudnosc) = 20
// AI:    10 x2 (tempo) x2 (trudnosc) = 40
const baseBuilding = 10;
const playerCost = applyDifficultyCostMultiplier(
  applyBuildingCostPace(baseBuilding, 'normalny'),
  0,
  'easy',
);
const aiCost = applyDifficultyCostMultiplier(
  applyBuildingCostPace(baseBuilding, 'normalny'),
  5,
  'easy',
);
eq(playerCost, 20, 'easy + normalny tempo budynkow: gracz 2x bazy (20)');
eq(aiCost, 40, 'easy + normalny tempo budynkow: AI 4x bazy (40)');

// Badania: tempo standardowa x2 + GLOBAL=2 (R-STAWKI-STROJENIE) + trudna gracz x2
eq(scaledResearchCost(24, 'standardowa', 0, 'hard'), 192, 'hard gracz: tech JSON 24 -> 192');

// Wzrost ludnosci — trudnosc
eq(getPopulationGrowthDifficultyMultiplier(0, 'hard'), 2, 'hard gracz prog x2');
eq(getPopulationGrowthDifficultyMultiplier(5, 'hard'), 0.5, 'hard AI prog x0.5');
eq(getPopulationGrowthDifficultyMultiplier(3, 'easy'), 2, 'easy AI prog x2');
eq(getPopulationGrowthDifficultyMultiplier(0, 'easy'), 1, 'easy gracz prog x1');

// Przyklad Macieja: normalny tempo (x2) + trudna + AI miasto
// baza 10+3*8=34 → x2 tempo x0.5 trudnosc = x1 efektywnie (34)
eq(
  getPopulationGrowthThresholdMultiplier(5, 'normalny', 'hard'),
  1,
  'hard AI + normalny tempo: laczny mnoznik x1',
);
// gracz: x2 tempo x2 trudnosc = x4 (136 z bazy 34)
eq(
  applyPopulationGrowthThreshold(34, 0, 'normalny', 'hard'),
  136,
  'hard gracz + normalny tempo: prog 34 -> 136',
);
// easy + normalny: gracz 68, AI 136
eq(applyPopulationGrowthThreshold(34, 0, 'normalny', 'easy'), 68, 'easy gracz + normalny: 68');
eq(applyPopulationGrowthThreshold(34, 7, 'normalny', 'easy'), 136, 'easy AI + normalny: 136');

// Tempo kreatora (bez trudnosci)
eq(applyGrowthThresholdPace(34, 'wysoki'), 34, 'wysoki tempo x1');
eq(applyGrowthThresholdPace(34, 'normalny'), 68, 'normalny tempo x2');
eq(applyGrowthThresholdPace(34, 'wolny'), 136, 'wolny tempo x4');

console.log(`\n[difficulty-cost-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) {
  console.error('[difficulty-cost-test] FAIL');
  process.exit(1);
}
console.log('[difficulty-cost-test] ZIELONY');
process.exit(0);
