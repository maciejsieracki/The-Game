'use strict';
/**
 * tech-tempo-test.cjs -- standalone Node test for src/game/tech-tempo.ts.
 * Run from gra/:  node tools/tech-tempo-test.cjs
 *
 * Self-contained: bundles tech-tempo.ts with esbuild to a temp CJS file,
 * then requires it and runs assertions. No DOM, no THREE.
 *
 * Maciej 2026-07-07: szybka x1, standardowa x2, dluga x4 (bazowy koszt = szybki).
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

// Przyklad tech JSON=24 (B-RESEARCH-COST-MODEL: global x2 w JSON, GLOBAL_MULT=1)
eq(applyTempoKoszt(24, 'szybka'), 24, 'szybka x1: 24 -> 24');
eq(applyTempoKoszt(24, 'standardowa'), 48, 'standardowa x2: 24 -> 48');
eq(applyTempoKoszt(24, 'dluga'), 96, 'dluga x4: 24 -> 96');

// Obróbka drewna / Murarstwo — JSON=5 PN (Maciej 2026-07-24)
eq(applyTempoKoszt(5, 'szybka'), 5, 'early tech szybka: 5 -> 5');
eq(applyTempoKoszt(5, 'standardowa'), 10, 'early tech standardowa: 5 -> 10');
eq(applyTempoKoszt(5, 'dluga'), 20, 'early tech dluga: 5 -> 20');

// Ogolne progi
eq(applyTempoKoszt(100, 'szybka'), 100, 'szybka x1: 100 -> 100');
eq(applyTempoKoszt(100, 'standardowa'), 200, 'standardowa x2: 100 -> 200');
eq(applyTempoKoszt(100, 'dluga'), 400, 'dluga x4: 100 -> 400');

// mnoznik liczbowy
eq(applyTempoKoszt(50, 2.5), 125, 'mnoznik liczbowy 2.5: 50 -> 125');

// zaokraglanie
eq(applyTempoKoszt(7, 'standardowa'), 14, 'zaokraglanie: round(7*2) -> 14');

// minimum 1
eq(applyTempoKoszt(1, 'szybka'), 1, 'minimum 1: 1*1 -> 1');

// Extra: verify TEMPO_GRY constants
eq(TEMPO_GRY.szybka, 1.0, 'TEMPO_GRY.szybka === 1.0');
eq(TEMPO_GRY.standardowa, 2.0, 'TEMPO_GRY.standardowa === 2.0');
eq(TEMPO_GRY.dluga, 4.0, 'TEMPO_GRY.dluga === 4.0');

// --- summary ---------------------------------------------------------------
console.log(`\n[tech-tempo-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) {
  console.error('[tech-tempo-test] FAIL -- testy nie przeszly');
  process.exit(1);
} else {
  console.log('[tech-tempo-test] ZIELONY -- wszystkie testy OK');
  process.exit(0);
}
