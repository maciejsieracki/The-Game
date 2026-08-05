/**
 * end-details-hp-test.cjs
 * ZNALEZISKO-86: % HP + pasek w „Szczegóły bitwy" (endDetails1E) — ten sam wzorzec co postBattleSummary.
 *
 * Usage (from gra/):
 *   node tools/end-details-hp-test.cjs
 */

'use strict';

/** Mirrors endDetails1E.ts hpPct / hpPercents / hpText / hpBarHtml. */
function hpPct(hp, maxHp) {
  if (maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
}

function hpPercents(u) {
  const maxHp = Math.max(0, Math.round(u.maxHp));
  const hpBefore = Math.max(0, Math.round(u.hpBefore));
  const hpAfter = u.fate === 'destroyed' ? 0 : Math.max(0, Math.round(u.hpAfter));
  return {
    before: hpPct(hpBefore, maxHp),
    after: hpPct(hpAfter, maxHp),
  };
}

function hpText(u) {
  const { before, after } = hpPercents(u);
  const base = u.fate === 'destroyed'
    ? 'HP ' + before + '% \u2192 0%'
    : 'HP ' + before + '% \u2192 ' + after + '%';
  return u.fate === 'routed' ? base + ' \u00B7 uciekli' : base;
}

function hpBarHtml(u, accentColor) {
  const { before, after } = hpPercents(u);
  const afterWidth = u.fate === 'destroyed' ? 0 : after;
  return (
    '<div style="height:5px;border-radius:3px;overflow:hidden;position:relative;' +
    'background:rgba(255,255,255,0.08);margin-top:4px;">' +
    '<div style="position:absolute;inset:0;width:' + before + '%;background:rgba(255,255,255,0.14);' +
    'border-radius:3px;"></div>' +
    '<div style="position:absolute;left:0;top:0;bottom:0;width:' + afterWidth + '%;' +
    'border-radius:3px;background:' + accentColor + ';"></div>' +
    '</div>'
  );
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    console.error('FAIL:', label, '— expected', JSON.stringify(expected), 'got', JSON.stringify(actual));
    process.exit(1);
  }
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    console.error('FAIL:', label, '— expected to include', JSON.stringify(needle));
    process.exit(1);
  }
}

let passed = 0;

function test(label, fn) {
  fn();
  passed++;
  console.log('  OK:', label);
}

console.log('end-details-hp-test.cjs\n');

test('survived: 100/100 → 62/100 → HP 100% → 62%', () => {
  const u = { hpBefore: 100, hpAfter: 62, maxHp: 100, fate: 'survived' };
  assertEq(hpText(u), 'HP 100% \u2192 62%', 'text');
  const bar = hpBarHtml(u, '#7ad0a0');
  assertIncludes(bar, 'width:100%', 'before bar');
  assertIncludes(bar, 'width:62%', 'after bar');
});

test('destroyed: 80/100 → 0 → HP 80% → 0%', () => {
  const u = { hpBefore: 80, hpAfter: 0, maxHp: 100, fate: 'destroyed' };
  assertEq(hpPercents(u).after, 0, 'after pct');
  assertEq(hpText(u), 'HP 80% \u2192 0%', 'text');
  const bar = hpBarHtml(u, '#ff7b7b');
  assertIncludes(bar, 'width:80%', 'before bar');
  assertIncludes(bar, 'width:0%', 'after bar');
});

test('routed: 50/80 → 20/80 → suffix uciekli', () => {
  const u = { hpBefore: 50, hpAfter: 20, maxHp: 80, fate: 'routed' };
  assertEq(hpPercents(u).before, 63, 'before pct rounded');
  assertEq(hpPercents(u).after, 25, 'after pct rounded');
  assertEq(hpText(u), 'HP 63% \u2192 25% \u00B7 uciekli', 'text');
});

test('maxHp 0 → pct clamped to 0', () => {
  const u = { hpBefore: 10, hpAfter: 5, maxHp: 0, fate: 'survived' };
  assertEq(hpPercents(u).before, 0, 'before');
  assertEq(hpPercents(u).after, 0, 'after');
});

test('hp clamped: negative before → 0%', () => {
  const u = { hpBefore: -5, hpAfter: 30, maxHp: 100, fate: 'survived' };
  assertEq(hpPercents(u).before, 0, 'before clamp');
  assertEq(hpText(u), 'HP 0% \u2192 30%', 'text');
});

console.log('\nPASS —', passed, '/', passed);
