/**
 * battle-hp-display-test.cjs
 * Regression: HP bar ratio / clamp logic (map → battle spawn sync).
 *
 * Usage (from gra/):
 *   node tools/battle-hp-display-test.cjs
 */

'use strict';

function hpBarRatio(hp, maxHp) {
  if (maxHp <= 0) return 0;
  const clamped = clampUnitHp(hp, maxHp);
  return Math.max(0, Math.min(1, clamped.hp / clamped.maxHp));
}

/** Mirrors runtimeToBattleUnit / preBattleUnitFromRuntime HP clamp. */
function clampUnitHp(hp, maxHp) {
  const resolvedHp = hp != null ? Math.min(maxHp, Math.max(0, hp)) : maxHp;
  return { hp: resolvedHp, maxHp };
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    console.error('FAIL:', label, '— expected', expected, 'got', actual);
    process.exit(1);
  }
}

let passed = 0;

function test(label, fn) {
  fn();
  passed++;
  console.log('  OK:', label);
}

console.log('battle-hp-display-test.cjs\n');

test('full HP → ratio 1', () => {
  assertEq(hpBarRatio(100, 100), 1, 'full');
  const c = clampUnitHp(100, 100);
  assertEq(c.hp, 100, 'full hp');
  assertEq(c.maxHp, 100, 'full maxHp');
});

test('half HP → ratio 0.5', () => {
  assertEq(hpBarRatio(50, 100), 0.5, 'half');
  const c = clampUnitHp(50, 100);
  assertEq(c.hp, 50, 'half hp');
});

test('zero HP → ratio 0', () => {
  assertEq(hpBarRatio(0, 100), 0, 'zero');
  const c = clampUnitHp(0, 100);
  assertEq(c.hp, 0, 'zero hp');
});

test('null/undefined hp → max', () => {
  const cNull = clampUnitHp(null, 80);
  assertEq(cNull.hp, 80, 'null → max');
  assertEq(hpBarRatio(null, 80), 1, 'null ratio');

  const cUndef = clampUnitHp(undefined, 60);
  assertEq(cUndef.hp, 60, 'undefined → max');
  assertEq(hpBarRatio(undefined, 60), 1, 'undefined ratio');
});

test('hp > max → clamped to max', () => {
  const c = clampUnitHp(150, 100);
  assertEq(c.hp, 100, 'over max');
  assertEq(hpBarRatio(150, 100), 1, 'over max ratio');
});

test('hp < 0 → clamped to 0', () => {
  const c = clampUnitHp(-5, 100);
  assertEq(c.hp, 0, 'under zero');
  assertEq(hpBarRatio(-5, 100), 0, 'under zero ratio');
});

test('maxHp 0 → ratio 0', () => {
  assertEq(hpBarRatio(10, 0), 0, 'zero maxHp ratio');
});

console.log('\nPASS —', passed, '/', passed);
