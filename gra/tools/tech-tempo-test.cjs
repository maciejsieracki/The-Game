'use strict';
/**
 * tech-tempo-test.cjs -- standalone Node test for src/game/tech-tempo.ts.
 * Run from gra/:  node tools/tech-tempo-test.cjs
 *
 * Self-contained: bundles tech-tempo.ts with esbuild to a temp CJS file,
 * then requires it and runs assertions. No DOM, no THREE.
 *
 * Covers:
 *   - szybka = x0.2 (round)
 *   - dluga = x5.0 (round)
 *   - standardowa = x1.0 (no change)
 *   - mnoznik liczbowy (numeric tempo arg)
 *   - zaokraglanie (Math.round)
 *   - minimum 1 (even for tiny base cost * small multiplier)
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[tech-tempo-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.tt-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.tt-bundle.cjs');

// Allow override via TT_SRC_DIR (OneDrive sandbox workaround: fresh-copy path).
const SRC = process.env.TT_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export { TEMPO_GRY, applyTempoKoszt } from ${JSON.stringify(SRC + '/game/tech-tempo')};
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
  console.error('[tech-tempo-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const { TEMPO_GRY, applyTempoKoszt } = B;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg}  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// --- tests -----------------------------------------------------------------
console.log('\n[tech-tempo-test] Uruchamiam testy...\n');

// 1. szybka = divide by 5 (x0.2)
eq(applyTempoKoszt(100, 'szybka'), 20, 'szybka x0.2: 100 -> 20');

// 2. dluga = multiply by 5 (x5.0)
eq(applyTempoKoszt(100, 'dluga'), 500, 'dluga x5.0: 100 -> 500');

// 3. standardowa = x1.0, no change
eq(applyTempoKoszt(100, 'standardowa'), 100, 'standardowa x1.0: 100 -> 100');

// 4. mnoznik liczbowy (numeric tempo arg)
eq(applyTempoKoszt(50, 2.5), 125, 'mnoznik liczbowy 2.5: 50 -> 125');

// 5. zaokraglanie (Math.round): 45 * 0.2 = 9.0, 48 * 0.2 = 9.6 -> 10
eq(applyTempoKoszt(48, 'szybka'), 10, 'zaokraglanie: round(48*0.2=9.6) -> 10');

// 6. minimum 1: very small cost * szybka
eq(applyTempoKoszt(1, 'szybka'), 1, 'minimum 1: round(1*0.2=0.2) -> min 1');

// Extra: verify TEMPO_GRY constants
eq(TEMPO_GRY.szybka, 0.2, 'TEMPO_GRY.szybka === 0.2');
eq(TEMPO_GRY.standardowa, 1.0, 'TEMPO_GRY.standardowa === 1.0');
eq(TEMPO_GRY.dluga, 5.0, 'TEMPO_GRY.dluga === 5.0');

// --- summary ---------------------------------------------------------------
console.log(`\n[tech-tempo-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) {
  console.error('[tech-tempo-test] FAIL -- testy nie przeszly');
  process.exit(1);
} else {
  console.log('[tech-tempo-test] ZIELONY -- wszystkie testy OK');
  process.exit(0);
}
