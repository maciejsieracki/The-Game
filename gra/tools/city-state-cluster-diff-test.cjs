'use strict';
/**
 * city-state-cluster-diff-test.cjs — AI-CS-CLUSTER-DIFF-2026-07-30
 * Run from gra/:  node tools/city-state-cluster-diff-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[city-state-cluster-diff-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.city-state-cluster-diff-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.city-state-cluster-diff-bundle.cjs');

const ENTRY_TS = `
export {
  cityStateDifficultyFromGameDifficulty,
  isClusterConquestDeadlineActive,
  pickClusterCityStateWarTargetId,
  shouldCityStateRollWarOnPlayer,
  CITY_STATE_PLAYER_WAR_CHANCE,
  CITY_STATE_PLAYER_WAR_MIN_TURN,
  CLUSTER_CS_WAR_MIN_TURN,
  CLUSTER_CS_CONQUEST_DEADLINE_TURN,
} from ${JSON.stringify(AI_SRC + '/game/city-state-difficulty')};
export { decideAIDiplomacy } from ${JSON.stringify(AI_SRC + '/game/ai')};
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
  console.error('[city-state-cluster-diff-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  cityStateDifficultyFromGameDifficulty,
  isClusterConquestDeadlineActive,
  pickClusterCityStateWarTargetId,
  shouldCityStateRollWarOnPlayer,
  CITY_STATE_PLAYER_WAR_CHANCE,
  CITY_STATE_PLAYER_WAR_MIN_TURN,
  CLUSTER_CS_WAR_MIN_TURN,
  CLUSTER_CS_CONQUEST_DEADLINE_TURN,
  decideAIDiplomacy,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

console.log('--- T1: cityStateDifficultyFromGameDifficulty ---');
eq(cityStateDifficultyFromGameDifficulty('easy'), 'hard', 'T1a: easy→hard');
eq(cityStateDifficultyFromGameDifficulty('normal'), 'normal', 'T1b: normal→normal');
eq(cityStateDifficultyFromGameDifficulty('hard'), 'easy', 'T1c: hard→easy');

console.log('\n--- T2: isClusterConquestDeadlineActive ---');
assert(isClusterConquestDeadlineActive(50, [{ ownerId: 2, q: 0, r: 0 }]), 'T2a: t.50 + cele → active');
assert(!isClusterConquestDeadlineActive(101, [{ ownerId: 2, q: 0, r: 0 }]), 'T2b: t.101 → inactive');
assert(!isClusterConquestDeadlineActive(50, []), 'T2c: brak celów → inactive');
eq(CLUSTER_CS_CONQUEST_DEADLINE_TURN, 100, 'T2d: deadline turn = 100');

console.log('\n--- T3: pickClusterCityStateWarTargetId (tura 20) ---');
const targets = [
  { ownerId: 2, q: 10, r: 10 },
  { ownerId: 3, q: 5, r: 5 },
];
const atWarEmpty = new Set();
eq(
  pickClusterCityStateWarTargetId(19, targets, atWarEmpty, { q: 0, r: 0 }),
  null,
  'T3a: tura 19 → brak wymuszenia',
);
eq(
  pickClusterCityStateWarTargetId(CLUSTER_CS_WAR_MIN_TURN, targets, atWarEmpty, { q: 0, r: 0 }),
  3,
  'T3b: tura 20 → nearest CS (owner 3)',
);
eq(
  pickClusterCityStateWarTargetId(25, targets, new Set([2]), { q: 0, r: 0 }),
  3,
  'T3c: deadline → wymuszenie wojny z pozostałym CS',
);

console.log('\n--- T4: pickClusterCityStateWarTargetId (deadline) ---');
eq(
  pickClusterCityStateWarTargetId(80, targets, new Set([2]), { q: 0, r: 0 }),
  3,
  'T4a: deadline + CS 3 bez wojny → wymuszenie',
);
eq(
  pickClusterCityStateWarTargetId(150, targets, new Set([2]), { q: 0, r: 0 }),
  null,
  'T4b: po deadline → brak wymuszenia',
);

console.log('\n--- T5: decideAIDiplomacy clusterForceWarTargetId ---');
const relStub = {
  partnerId: '3',
  relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
  respektWzgledny: 0.6,
  stanWojny: false,
};
const dipCmds = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [relStub],
  agresja: 0.3,
  currentTurn: 25,
  clusterForceWarTargetId: 3,
});
assert(dipCmds.length === 1 && dipCmds[0].type === 'wypowiedz_wojne', 'T5a: forced war command');
eq(dipCmds[0].targetId, '3', 'T5b: target owner 3');

const dipNoForce = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{ ...relStub, stanWojny: true }],
  agresja: 0.3,
  currentTurn: 25,
  clusterForceWarTargetId: 3,
});
assert(!dipNoForce.some(c => c.type === 'wypowiedz_wojne'), 'T5c: already at war → no forced war');

console.log('\n--- T6: shouldCityStateRollWarOnPlayer ---');
eq(CITY_STATE_PLAYER_WAR_CHANCE, 0.6, 'T6a: chance 60%');
eq(CITY_STATE_PLAYER_WAR_MIN_TURN, 20, 'T6b: min turn 20');
assert(
  !shouldCityStateRollWarOnPlayer('normal', 25, false, false, () => 0),
  'T6c: normal PM difficulty → never',
);
assert(
  !shouldCityStateRollWarOnPlayer('hard', 19, false, false, () => 0),
  'T6d: before turn 20 → never',
);
assert(
  !shouldCityStateRollWarOnPlayer('hard', 25, true, false, () => 0),
  'T6e: already at war → never',
);
assert(
  !shouldCityStateRollWarOnPlayer('hard', 25, false, true, () => 0),
  'T6f: trade treaty → never',
);
assert(
  shouldCityStateRollWarOnPlayer('hard', 25, false, false, () => 0.59),
  'T6g: hard + t.25 + roll 0.59 → war',
);
assert(
  !shouldCityStateRollWarOnPlayer('hard', 25, false, false, () => 0.60),
  'T6h: roll 0.60 → no war (strict <)',
);

console.log('\n--- T7: miasto-państwo nie generuje trybutu (Maciej 2026-08-02) ---');
const dipCsTribute = decideAIDiplomacy({
  myPlayerId: '7',
  relacje: [{
    partnerId: '0',
    relation: { status: 'wojna', zaufanie: 10, respekt: 20 },
    respektWzgledny: 0.15,
    stanWojny: true,
  }],
  agresja: 0.5,
  skarbiecGold: 100,
  isMinorCivSelf: true,
});
assert(
  !dipCsTribute.some(c => c.type === 'oferuj_trybut_za_pokoj' || c.type === 'zadaj_trybut'),
  'T7a: CS w wojnie nie oferuje trybutu',
);
const dipMajorTribute = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{
    partnerId: '0',
    relation: { status: 'wojna', zaufanie: 10, respekt: 20 },
    respektWzgledny: 0.15,
    stanWojny: true,
  }],
  agresja: 0.5,
  skarbiecGold: 100,
  isMinorCivSelf: false,
});
assert(
  dipMajorTribute.some(c => c.type === 'oferuj_trybut_za_pokoj'),
  'T7b: pełne AI w wojnie nadal może oferować trybut za pokój',
);

console.log(`\n=== city-state-cluster-diff-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
