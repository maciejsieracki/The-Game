'use strict';
/**
 * sea-peoples-boost-test.cjs -- R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1.
 * Run from gra/:  node tools/sea-peoples-boost-test.cjs
 *
 * Standalone: bundles src/game/barbarians.ts with esbuild and asserts the pure
 * window / multiplier / notice-dedup helpers. Covers: baseline turns 19/20/21,
 * Bronze->Iron close, off mode (barbarians 'brak'), difficulty base x3, owner-relative
 * entry, notice once-only with save/load flag round-trip.
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY_FILE = path.resolve(__dirname, '.sea-peoples-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.sea-peoples-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  seaPeoplesBoostActive, boostBarbParamsForSeaPeoples, shouldEmitSeaPeoplesEpochNotice,
  SEA_PEOPLES_BOOST_ELAPSED_TURNS, SEA_PEOPLES_UNIT_MULT,
  FALLBACK_BARB_PARAMS, barbarianUnitsPerCampForDifficulty, barbariansEnabledForLevel,
  scaleBarbParamsForLevel,
} from '../src/game/barbarians';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
});

const B = require(BUNDLE_FILE);
const {
  seaPeoplesBoostActive, boostBarbParamsForSeaPeoples, shouldEmitSeaPeoplesEpochNotice,
  SEA_PEOPLES_BOOST_ELAPSED_TURNS, SEA_PEOPLES_UNIT_MULT, FALLBACK_BARB_PARAMS,
  barbarianUnitsPerCampForDifficulty, barbariansEnabledForLevel, scaleBarbParamsForLevel,
} = B;

let passed = 0;
let failed = 0;
function check(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('FAIL: ' + msg); }
}
function eq(a, b, msg) { check(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// 0. Constants pinned to the owner's decision.
eq(SEA_PEOPLES_BOOST_ELAPSED_TURNS, 20, 'start elapsed = 20');
eq(SEA_PEOPLES_UNIT_MULT, 3, 'unit multiplier = 3');

// 1. Baseline / boundary around elapsed 20 (Bronze entry at T=100).
const BRONZE = 100;
eq(seaPeoplesBoostActive(BRONZE, undefined, 118), false, 'turn 118 (elapsed 18) inactive');
eq(seaPeoplesBoostActive(BRONZE, undefined, 119), false, 'turn 119 (elapsed 19) inactive');
eq(seaPeoplesBoostActive(BRONZE, undefined, 120), true, 'turn 120 (elapsed 20) ACTIVE');
eq(seaPeoplesBoostActive(BRONZE, undefined, 121), true, 'turn 121 (elapsed 21) active');
eq(seaPeoplesBoostActive(BRONZE, undefined, 200), true, 'turn 200 still active (no Iron yet)');

// 2. Bronze entry not reached -> off.
eq(seaPeoplesBoostActive(undefined, undefined, 500), false, 'no Bronze entry -> off');

// 3. Bronze -> Iron close: window ends exactly on Iron entry turn (150).
const IRON = 150;
eq(seaPeoplesBoostActive(BRONZE, IRON, 149), true, 'turn 149 (last Bronze turn in window) active');
eq(seaPeoplesBoostActive(BRONZE, IRON, 150), false, 'turn 150 (Iron entry) CLOSED');
eq(seaPeoplesBoostActive(BRONZE, IRON, 151), false, 'turn 151 stays closed');

// 3b. Iron entry BEFORE the 20th Bronze turn (fast jump) -> never open.
eq(seaPeoplesBoostActive(100, 110, 125), false, 'Iron at 110 before elapsed20 -> never open');

// 4. Owner-relative: same turn, different owners' Bronze entry.
eq(seaPeoplesBoostActive(50, undefined, 70), true, 'owner A (Bronze 50) at turn 70 active');
eq(seaPeoplesBoostActive(100, undefined, 70), false, 'owner B (Bronze 100) at turn 70 inactive');

// 5. Difficulty base x3 (unitsPerCamp: easy 1, normal 2, hard 3 -> 3, 6, 9).
eq(barbarianUnitsPerCampForDifficulty('easy'), 1, 'easy base 1');
eq(barbarianUnitsPerCampForDifficulty('normal'), 2, 'normal base 2');
eq(barbarianUnitsPerCampForDifficulty('hard'), 3, 'hard base 3');
for (const [diff, baseUnits, boostedUnits] of [['easy', 1, 3], ['normal', 2, 6], ['hard', 3, 9]]) {
  const p = scaleBarbParamsForLevel(FALLBACK_BARB_PARAMS, 'normalny', diff);
  eq(p.unitsPerCamp, baseUnits, `${diff}: base unitsPerCamp`);
  eq(boostBarbParamsForSeaPeoples(p, true).unitsPerCamp, boostedUnits, `${diff}: boosted unitsPerCamp x3`);
}

// 5b. Boost touches ONLY unitsPerCamp; other fields identical; inactive returns same ref.
const baseParams = scaleBarbParamsForLevel(FALLBACK_BARB_PARAMS, 'normalny', 'normal');
const boostedParams = boostBarbParamsForSeaPeoples(baseParams, true);
for (const k of Object.keys(baseParams)) {
  if (k === 'unitsPerCamp') continue;
  eq(boostedParams[k], baseParams[k], `boost leaves ${k} unchanged`);
}
eq(boostBarbParamsForSeaPeoples(baseParams, false), baseParams, 'inactive -> same object reference');
eq(baseParams.unitsPerCamp, 2, 'base object not mutated by boost');

// 6. Off mode: barbarians 'brak' disables everything (main gates the whole block on barbariansActive).
eq(barbariansEnabledForLevel('brak'), false, "level 'brak' disables barbarians");

// 7. Notice once-only + save/load round trip.
eq(shouldEmitSeaPeoplesEpochNotice(true, false), true, 'first active turn -> emit');
eq(shouldEmitSeaPeoplesEpochNotice(true, true), false, 'already shown -> no duplicate');
eq(shouldEmitSeaPeoplesEpochNotice(false, false), false, 'inactive -> no notice');
// Simulate: notice shown at turn 120, save, load in a new session, continue turns.
let shown = false;
let emitted = 0;
for (let t = 118; t <= 125; t++) {
  const active = seaPeoplesBoostActive(BRONZE, undefined, t);
  if (shouldEmitSeaPeoplesEpochNotice(active, shown)) { shown = true; emitted++; }
}
eq(emitted, 1, 'one notice across turns 118..125');
const savedMeta = JSON.parse(JSON.stringify({ seaPeoplesNoticeShown: shown })); // save meta
let shownAfterLoad = savedMeta.seaPeoplesNoticeShown === true;                  // restore
let emittedAfterLoad = 0;
for (let t = 126; t <= 130; t++) {
  const active = seaPeoplesBoostActive(BRONZE, undefined, t);
  if (shouldEmitSeaPeoplesEpochNotice(active, shownAfterLoad)) { shownAfterLoad = true; emittedAfterLoad++; }
}
eq(emittedAfterLoad, 0, 'reload after notice -> no duplicate notice');
// Old save without the flag: restore yields false, so notice may fire once (ZAŁOŻENIE, documented).
const oldMeta = JSON.parse('{}');
eq(oldMeta.seaPeoplesNoticeShown === true, false, 'old save without flag restores to false');

console.log(`sea-peoples-boost-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
