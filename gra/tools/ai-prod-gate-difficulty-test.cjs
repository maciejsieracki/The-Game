'use strict';
/**
 * ai-prod-gate-difficulty-test.cjs — P-AI-PROD-GATE-Q1=A
 * Run from gra/:  node tools/ai-prod-gate-difficulty-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-prod-gate-difficulty-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-prod-gate-difficulty-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-prod-gate-difficulty-bundle.cjs');

const ENTRY_TS = `
export { effectiveGameDifficultyForOwnerPure } from ${JSON.stringify(AI_SRC + '/game/effective-difficulty-for-owner')};
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
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-prod-gate-difficulty-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { effectiveGameDifficultyForOwnerPure } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

console.log('--- T1: major AI — effective === menu (parity) ---');
const majorOwners = new Set();
eq(
  effectiveGameDifficultyForOwnerPure(3, 'hard', 'easy', majorOwners),
  'hard',
  'T1a: major gets global hard',
);
eq(
  effectiveGameDifficultyForOwnerPure(5, 'normal', 'easy', majorOwners),
  'normal',
  'T1b: major gets global normal',
);

console.log('\n--- T2: MP/city-state — easy slider vs hard global ---');
const mpOwners = new Set([7, 8]);
eq(
  effectiveGameDifficultyForOwnerPure(7, 'hard', 'easy', mpOwners),
  'easy',
  'T2a: MP owner gets city-state easy slider',
);
eq(
  effectiveGameDifficultyForOwnerPure(3, 'hard', 'easy', mpOwners),
  'hard',
  'T2b: major still gets global hard when MP set differs',
);

console.log('\n--- T3: edge — hard MP slider vs easy global ---');
eq(
  effectiveGameDifficultyForOwnerPure(8, 'easy', 'hard', mpOwners),
  'hard',
  'T3a: MP with hard slider gets hard even when global easy',
);
eq(
  effectiveGameDifficultyForOwnerPure(1, 'easy', 'hard', mpOwners),
  'easy',
  'T3b: non-MP major stays on global easy',
);

console.log('\n--- T4: callback parity — same value for isProductionAllowed path ---');
const ownerId = 4;
const menu = 'normal';
const csMenu = 'easy';
const csSet = new Set([2]);
const effective = effectiveGameDifficultyForOwnerPure(ownerId, menu, csMenu, csSet);
eq(effective, menu, 'T4a: major ownerId uses menu for production gate');
const mpEffective = effectiveGameDifficultyForOwnerPure(2, menu, csMenu, csSet);
eq(mpEffective, csMenu, 'T4b: MP ownerId uses city-state slider for production gate');

console.log(`\n=== ai-prod-gate-difficulty-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
