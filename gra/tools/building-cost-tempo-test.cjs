'use strict';
/**
 * building-cost-tempo-test.cjs — test src/game/building-cost-tempo.ts
 * Run: node tools/building-cost-tempo-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[building-cost-tempo-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.building-cost-tempo-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.building-cost-tempo-bundle.cjs');
const SRC = process.env.BCT_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export { KOSZT_BUDYNKOW_PACE, applyBuildingCostPace } from ${JSON.stringify(SRC + '/game/building-cost-tempo')};
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
  console.error('[building-cost-tempo-test] esbuild failed:\n', e.message || e);
  process.exit(1);
}

const { KOSZT_BUDYNKOW_PACE, applyBuildingCostPace } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, `(got ${a}, want ${b})`); }
}

console.log('\n[building-cost-tempo-test] Uruchamiam testy...\n');

// Swiatynia — bazowy koszt 25 Pracy (Maciej 2026-07-07)
eq(applyBuildingCostPace(25, 'niski'), 25, 'niski x1: Swiatynia 25 -> 25');
eq(applyBuildingCostPace(25, 'normalny'), 50, 'normalny x2: Swiatynia 25 -> 50');
eq(applyBuildingCostPace(25, 'wysoki'), 100, 'wysoki x4: Swiatynia 25 -> 100');

eq(applyBuildingCostPace(100, 'normalny'), 200, 'normalny x2: 100 -> 200');
eq(applyBuildingCostPace(1, 'wysoki'), 4, 'minimum po zaokragleniu: 1*4 -> 4');
eq(KOSZT_BUDYNKOW_PACE.niski, 1.0, 'KOSZT_BUDYNKOW_PACE.niski === 1.0');

console.log(`\n[building-cost-tempo-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
process.exit(failed > 0 ? 1 : 0);
