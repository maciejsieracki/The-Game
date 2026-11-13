'use strict';
/**
 * ai-major-absorb-test.cjs — P-AI-MAJOR-ABSORB policy guard
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
    turn: 25,
    aggressorId: 3,
    victimId: 5,
    sameCiv: true,
    powerRatio: 10,
    aggressorIsMajor: true,
    victimIsMajor: true,
    victimEliminated: false,
    sameOwner: false,
    ...overrides,
  };
}

console.log('--- T1: current thresholds ---');
eq(AI_MAJOR_ABSORB_POWER_RATIO_MIN, 10, 'T1a: power ratio min');
eq(AI_MAJOR_ABSORB_MIN_TURN, 25, 'T1b: min turn');

console.log('\n--- T2: hard + turn 25 + ratio 10 allows existing absorption result ---');
const happy = decideAiMajorAbsorb(baseInput({ sameCiv: false }));
eq(happy.action, 'instant_annex', 'T2a: threshold major→major annex');
eq(happy.reason, 'hard_any_civ_ratio', 'T2b: threshold reason');

console.log('\n--- T3: same-civ compatibility gate remains available ---');
const sameCivGate = decideAiMajorAbsorb(baseInput({ requireSameCiv: true }));
eq(sameCivGate.action, 'instant_annex', 'T3a: same-civ gate allows same civ');
eq(sameCivGate.reason, 'hard_same_civ_ratio', 'T3b: same-civ reason');
const f1Gate = decideAiMajorAbsorb(baseInput({ sameCiv: false, requireSameCiv: true }));
eq(f1Gate.action, null, 'T3c: same-civ gate blocks different civ');
eq(f1Gate.reason, 'different_civ', 'T3d: same-civ gate reason');

console.log('\n--- T4: major→major rejected on easy and normal ---');
for (const difficulty of ['easy', 'normal', 'hard']) {
  if (difficulty === 'hard') continue;
  const result = decideAiMajorAbsorb(baseInput({ difficulty, sameCiv: false }));
  eq(result.action, null, `T4-${difficulty}a: major→major no annex`);
  eq(result.reason, 'not_hard', `T4-${difficulty}b: non-hard reason`);
}

console.log('\n--- T5: hard before turn 25 is rejected ---');
const early = decideAiMajorAbsorb(baseInput({ turn: 24 }));
eq(early.action, null, 'T5a: early hard major no annex');
eq(early.reason, 'too_early', 'T5b: early hard reason');

console.log('\n--- T6: hard turn 25 with ratio below 10 is rejected ---');
const weak = decideAiMajorAbsorb(baseInput({ powerRatio: 9.99 }));
eq(weak.action, null, 'T6a: weak ratio no annex');
eq(weak.reason, 'insufficient_power', 'T6b: weak ratio reason');

console.log('\n--- T7: hard turn 25 with ratio 10 is accepted for different civ ---');
const differentCiv = decideAiMajorAbsorb(baseInput({ sameCiv: false }));
eq(differentCiv.action, 'instant_annex', 'T7a: different civ threshold annex');
eq(differentCiv.reason, 'hard_any_civ_ratio', 'T7b: different civ threshold reason');

console.log('\n--- T8: negacja — victimId 0 (gracz) → null ---');
const playerVictim = decideAiMajorAbsorb(baseInput({ victimId: 0 }));
eq(playerVictim.action, null, 'T8a: player victim no annex');
eq(playerVictim.reason, 'player_involved', 'T8b: player victim reason');

console.log('\n--- T9: parity — aggressorId 0 też null (filtr nie-gracz) ---');
const playerAgg = decideAiMajorAbsorb(baseInput({ aggressorId: 0, victimId: 5 }));
eq(playerAgg.action, null, 'T9a: player aggressor no annex');

console.log('\n--- T10: negacja — not major (MP) → null ---');
const mpVictim = decideAiMajorAbsorb(baseInput({ victimIsMajor: false }));
eq(mpVictim.action, null, 'T10a: MP victim no annex');
eq(mpVictim.reason, 'not_both_major', 'T10b: MP victim reason');

console.log('\n--- T11: negacja — city-state cannot be a major target ---');
const cityStateVictim = decideAiMajorAbsorb(baseInput({
  victimIsMajor: false,
  victimIsCityState: true,
}));
eq(cityStateVictim.action, null, 'T11a: city-state target no annex');
eq(cityStateVictim.reason, 'city_state_target', 'T11b: city-state target reason');

console.log('\n--- T12: negacja — barbarian victim/aggressor → null ---');
const barbarianVictim = decideAiMajorAbsorb(baseInput({
  victimId: -1,
  victimIsBarbarian: true,
}));
eq(barbarianVictim.action, null, 'T12a: barbarian victim no annex');
eq(barbarianVictim.reason, 'barbarian_involved', 'T12b: barbarian victim reason');
const barbarianAggressor = decideAiMajorAbsorb(baseInput({
  aggressorId: -1,
  aggressorIsBarbarian: true,
}));
eq(barbarianAggressor.action, null, 'T12c: barbarian aggressor no annex');
eq(barbarianAggressor.reason, 'barbarian_involved', 'T12d: barbarian aggressor reason');

console.log('\n--- T13: negacja — same owner and eliminated victim ---');
const sameOwner = decideAiMajorAbsorb(baseInput({ sameOwner: true }));
eq(sameOwner.action, null, 'T13a: same owner no annex');
eq(sameOwner.reason, 'same_owner', 'T13b: same owner reason');
const eliminated = decideAiMajorAbsorb(baseInput({ victimEliminated: true }));
eq(eliminated.action, null, 'T13c: eliminated victim no annex');
eq(eliminated.reason, 'victim_eliminated', 'T13d: eliminated victim reason');

console.log('\n--- T14: negacja — non-major owner pair ---');
const nonMajor = decideAiMajorAbsorb(baseInput({ victimIsMajor: false }));
eq(nonMajor.action, null, 'T14a: non-major pair no annex');
eq(nonMajor.reason, 'not_both_major', 'T14b: non-major pair reason');

console.log(`\n=== ai-major-absorb-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
