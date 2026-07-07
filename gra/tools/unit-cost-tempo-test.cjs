'use strict';
/**
 * unit-cost-tempo-test.cjs -- standalone Node test for src/game/unit-cost-tempo.ts.
 * Run from gra/:  node tools/unit-cost-tempo-test.cjs
 *
 * Maciej 2026-07-07: niski x1, normalny x2, wysoki x4 (bazowy koszt = niski).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[unit-cost-tempo-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.unit-cost-tempo-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-cost-tempo-bundle.cjs');

const SRC = process.env.UNIT_COST_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export { KOSZT_JEDNOSTEK_PACE, applyUnitCostPace } from ${JSON.stringify(SRC + '/game/unit-cost-tempo')};
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
  console.error('[unit-cost-tempo-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { KOSZT_JEDNOSTEK_PACE, applyUnitCostPace } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}

console.log('\n[unit-cost-tempo-test] Uruchamiam testy...\n');

eq(applyUnitCostPace(10, 'niski'), 10, 'niski x1: 10 -> 10');
eq(applyUnitCostPace(10, 'normalny'), 20, 'normalny x2: 10 -> 20');
eq(applyUnitCostPace(10, 'wysoki'), 40, 'wysoki x4: 10 -> 40');

eq(applyUnitCostPace(100, 'normalny'), 200, 'normalny x2: 100 -> 200');
eq(applyUnitCostPace(50, 2.5), 125, 'mnoznik liczbowy 2.5: 50 -> 125');
eq(applyUnitCostPace(1, 'wysoki'), 4, 'minimum po zaokragleniu: 1*4 -> 4');

eq(KOSZT_JEDNOSTEK_PACE.niski, 1.0, 'KOSZT_JEDNOSTEK_PACE.niski === 1.0');
eq(KOSZT_JEDNOSTEK_PACE.normalny, 2.0, 'KOSZT_JEDNOSTEK_PACE.normalny === 2.0');
eq(KOSZT_JEDNOSTEK_PACE.wysoki, 4.0, 'KOSZT_JEDNOSTEK_PACE.wysoki === 4.0');

console.log(`\n[unit-cost-tempo-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
process.exit(failed > 0 ? 1 : 0);
