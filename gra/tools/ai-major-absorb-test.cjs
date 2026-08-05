'use strict';
/**
 * ai-major-absorb-test.cjs — P-AI-MAJOR-ABSORB Faza 2
 * Run from gra/:  node tools/ai-major-absorb-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-major-absorb-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-major-absorb-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-major-absorb-bundle.cjs');

const ENTRY_TS = `
export {
  decideAiMajorAbsorb,
  AI_MAJOR_ABSORB_POWER_RATIO_MIN,
  AI_MAJOR_ABSORB_MIN_TURN,
} from ${JSON.stringify(AI_SRC + '/game/ai-major-absorb')};
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
  console.error('[ai-major-absorb-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  decideAiMajorAbsorb,
  AI_MAJOR_ABSORB_POWER_RATIO_MIN,
  AI_MAJOR_ABSORB_MIN_TURN,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function baseInput(overrides = {}) {
  return {
    difficulty: 'hard',
    turn: 15,
    aggressorId: 3,
    victimId: 5,
    sameCiv: true,
    powerRatio: 1.3,
    aggressorIsMajor: true,
    victimIsMajor: true,
    victimEliminated: false,
    sameOwner: false,
    ...overrides,
  };
}

console.log('--- T1: constants ---');
eq(AI_MAJOR_ABSORB_POWER_RATIO_MIN, 1.25, 'T1a: power ratio min');
eq(AI_MAJOR_ABSORB_MIN_TURN, 10, 'T1b: min turn');

console.log('\n--- T2: happy path — hard + sameCiv + ratio 1.3 + turn 15 ---');
const happy = decideAiMajorAbsorb(baseInput());
eq(happy.action, 'instant_annex', 'T2a: instant_annex');
eq(happy.reason, 'hard_any_civ_ratio', 'T2b: reason (F2 any-civ default)');

console.log('\n--- T2b: Faza 1 gate — requireSameCiv + different civ → null ---');
const f1Gate = decideAiMajorAbsorb(baseInput({ sameCiv: false, requireSameCiv: true }));
eq(f1Gate.action, null, 'T2b-a: F1 gate blocks different civ');
eq(f1Gate.reason, 'different_civ', 'T2b-b: F1 gate reason');

console.log('\n--- T3: edge — easy → null ---');
const easy = decideAiMajorAbsorb(baseInput({ difficulty: 'easy' }));
eq(easy.action, null, 'T3a: easy no annex');
eq(easy.reason, 'not_hard', 'T3b: easy reason');

console.log('\n--- T4: Faza 2 — different civ + hard + ratio → instant_annex ---');
const diffCiv = decideAiMajorAbsorb(baseInput({ sameCiv: false }));
eq(diffCiv.action, 'instant_annex', 'T4a: different civ annex (F2)');
eq(diffCiv.reason, 'hard_any_civ_ratio', 'T4b: different civ reason');

console.log('\n--- T5: edge — ratio 1.1 → null ---');
const weak = decideAiMajorAbsorb(baseInput({ powerRatio: 1.1 }));
eq(weak.action, null, 'T5a: weak ratio no annex');
eq(weak.reason, 'insufficient_power', 'T5b: weak ratio reason');

console.log('\n--- T6: edge — turn 5 → null ---');
const early = decideAiMajorAbsorb(baseInput({ turn: 5 }));
eq(early.action, null, 'T6a: early turn no annex');
eq(early.reason, 'too_early', 'T6b: early turn reason');

console.log('\n--- T7: negacja — victimId 0 (gracz) → null ---');
const playerVictim = decideAiMajorAbsorb(baseInput({ victimId: 0 }));
eq(playerVictim.action, null, 'T7a: player victim no annex');
eq(playerVictim.reason, 'player_involved', 'T7b: player victim reason');

console.log('\n--- T8: parity — aggressorId 0 też null (filtr nie-gracz) ---');
const playerAgg = decideAiMajorAbsorb(baseInput({ aggressorId: 0, victimId: 5 }));
eq(playerAgg.action, null, 'T8a: player aggressor no annex');

console.log('\n--- T9: edge — not major (MP) → null ---');
const mpVictim = decideAiMajorAbsorb(baseInput({ victimIsMajor: false }));
eq(mpVictim.action, null, 'T9a: MP victim no annex');
eq(mpVictim.reason, 'not_both_major', 'T9b: MP victim reason');

console.log('\n--- T10: edge — ratio exactly at threshold ---');
const atThreshold = decideAiMajorAbsorb(baseInput({ powerRatio: 1.25 }));
eq(atThreshold.action, 'instant_annex', 'T10a: ratio 1.25 passes');

console.log(`\n=== ai-major-absorb-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
