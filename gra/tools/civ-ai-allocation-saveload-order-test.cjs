'use strict';

/**
 * Regression gate for the owner-aware allocation save/load ordering.
 *
 * `restoreGameFromSave()` applies the current AI envelope once while repairing
 * the roster, then restores saved owner policy maps. The second application is
 * required after BOTH saved maps are restored, otherwise a legacy/current v3
 * save can put AI owners back on the player/legacy caps until end of turn.
 *
 * main.ts keeps this function inside the boot closure, so this gate executes a
 * bounded production-source ordering check and a mutation negative control.
 * It never reimplements the game policy or edits the checkout.
 *
 * Usage (from gra/): node tools/civ-ai-allocation-saveload-order-test.cjs
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
const APPLY_MARKER = 'applyAiAllocationProfiles();';
const RESTORE_MARKER = 'function restoreGameFromSave(saved: SaveGame): void {';
const RESTORE_END_MARKER = '\n    // Show main menu overlay;';

let pass = 0;
let fail = 0;
function check(label, condition) {
  try {
    assert.equal(condition, true);
    pass += 1;
    console.log(`PASS: ${label}`);
  } catch (error) {
    fail += 1;
    console.error(`FAIL: ${label}: ${error.message}`);
  }
}

function stripLineComments(source) {
  return source.split('\n').map((line) => {
    const marker = line.indexOf('//');
    return marker >= 0 ? line.slice(0, marker) : line;
  }).join('\n');
}

function restoreBody(source) {
  const start = source.indexOf(RESTORE_MARKER);
  const end = source.indexOf(RESTORE_END_MARKER, start);
  check('restoreGameFromSave istnieje jako produkcyjna funkcja', start >= 0);
  check('koniec restoreGameFromSave jest jednoznaczny', end > start);
  return start >= 0 && end > start
    ? stripLineComments(source.slice(start, end))
    : '';
}

function applyPositions(body) {
  const positions = [];
  let from = 0;
  while (true) {
    const position = body.indexOf(APPLY_MARKER, from);
    if (position < 0) return positions;
    positions.push(position);
    from = position + APPLY_MARKER.length;
  }
}

function hasCorrectSaveLoadOrdering(body) {
  const applies = applyPositions(body);
  if (applies.length < 2) return false;

  const firstApply = applies[0];
  const postRestoreApply = applies[1];
  const workMapClear = body.indexOf('ownerDefaultPodzialPracy.clear();');
  const workMapRestore = body.indexOf(
    'migratePodzialPracyOnLoad(cities, ownerDefaultPodzialPracy, savedPodzialPracy);',
  );
  const workMapRestoreEnd = body.indexOf('ownerDefaultOkolicaFocus.clear();', workMapRestore);
  const improvementMapClear = body.indexOf('ulepszeniaEmpireByOwner.clear();');
  const improvementSaveRestore = body.indexOf(
    'const savedUlepszenia = saved.meta?.ulepszeniaEmpireByOwner',
    improvementMapClear,
  );
  const improvementMapRestoreEnd = body.indexOf(
    'restoreMennicaZlotoGrace(',
    improvementMapClear,
  );

  return firstApply >= 0
    && workMapClear > firstApply
    && workMapRestore > workMapClear
    && improvementMapClear > workMapRestore
    && improvementSaveRestore > improvementMapClear
    && postRestoreApply > workMapRestoreEnd
    && postRestoreApply > improvementSaveRestore
    && postRestoreApply < improvementMapRestoreEnd;
}

const source = fs.readFileSync(MAIN_TS, 'utf8');
const body = restoreBody(source);
const applies = applyPositions(body);

check(
  'pierwsze zastosowanie koperty pozostaje przed odtworzeniem map polityk',
  applies.length >= 1
    && applies[0] < body.indexOf('ownerDefaultPodzialPracy.clear();')
    && applies[0] < body.indexOf('ulepszeniaEmpireByOwner.clear();'),
);
check(
  'save/load ponownie stosuje kopertę po odtworzeniu ownerDefaultPodzialPracy i ulepszeniaEmpireByOwner',
  hasCorrectSaveLoadOrdering(body),
);

// The negative control proves this gate is not satisfied merely by the old
// pre-load call: deleting the post-restore call must turn the gate red.
if (applies.length >= 2) {
  const mutatedBody = body.slice(0, applies[1]) + body.slice(applies[1] + APPLY_MARKER.length);
  check(
    'mutant usuwający reapply po mapach zapisu jest wykrywany',
    !hasCorrectSaveLoadOrdering(mutatedBody),
  );
} else {
  console.log('SKIP: mutant usuwający reapply po mapach zapisu — brak reapply w kodzie bazowym');
}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail > 0 ? 1 : 0);
