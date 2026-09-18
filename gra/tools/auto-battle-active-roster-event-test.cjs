'use strict';
/**
 * Focused RED/GREEN contract test for the active-radius roster event seam.
 * Run from gra/: node tools/auto-battle-active-roster-event-test.cjs
 *
 * The event log is intentionally partial here: only one defender is recorded.
 * A correct post-battle application must not spread the declared loss to the
 * same-roster units that are absent from that log.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SOURCE_DIR = path.resolve(__dirname, '..', 'src');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-auto-battle-active-roster-'));
const ENTRY = path.join(tempDir, 'entry.ts');
const BUNDLE = path.join(tempDir, 'bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `
import { applyPostBattleMap } from ${JSON.stringify(path.join(SOURCE_DIR, 'game/post-battle-map'))};
export { applyPostBattleMap };
`,
);

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) pass++;
  else {
    fail++;
    console.error('FAIL:', message);
  }
}

function unit(id, ownerId, q, r) {
  return {
    id,
    ownerId,
    typeId: 'Hastati',
    category: 'domyslny',
    q,
    r,
    ruchLeft: 1,
    hp: 100,
  };
}

const fieldDef = {
  meleeAttack: 10,
  meleeDefence: 10,
  weaponDamage: 10,
  piercing: 0,
  armor: 0,
  chargeBonus: 0,
  health: 100,
  missileAttack: 0,
  'Rola (linia)': 'Wręcz',
};

function runPartialEvent() {
  const attacker = unit('atk', 1, 0, 0);
  const directTarget = unit('def-direct', 2, 1, 0);
  const reserveA = unit('def-reserve-a', 2, 1, 1);
  const reserveB = unit('def-reserve-b', 2, 0, 1);
  const units = [attacker, directTarget, reserveA, reserveB];

  const result = require(BUNDLE).applyPostBattleMap({
    units,
    map: { hexes: {} },
    cities: [],
    battleQ: 1,
    battleR: 0,
    atkAnchor: attacker,
    atkRoster: [attacker],
    defRoster: [directTarget, reserveA, reserveB],
    atkStart: new Map([['atk', { q: 0, r: 0 }]]),
    winner: 'remis',
    lossAtkPct: 0.05,
    lossDefPct: 0.05,
    battleEventLog: {
      attackerUnitIds: ['atk'],
      defenderUnitIds: ['def-direct'],
    },
    getDef: () => fieldDef,
    maxHpOf: () => 100,
    isPassableHex: () => true,
    isUnitAt: () => false,
  });
  return { units, result };
}

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
  });

  const first = runPartialEvent();
  const find = (units, id) => units.find(u => u.id === id);

  assert(first.result.removedIds.length === 0, 'non-lethal partial-event fixture removes no unit');
  assert(find(first.units, 'atk')?.hp === 95, 'logged attacker receives the declared loss');
  assert(find(first.units, 'def-direct')?.hp === 95, 'logged defender receives the declared loss');
  assert(find(first.units, 'def-reserve-a')?.hp === 100, 'absent defender reserve A receives zero loss');
  assert(find(first.units, 'def-reserve-b')?.hp === 100, 'absent defender reserve B receives zero loss');
  assert(
    first.units.reduce((sum, u) => sum + (100 - (u.hp ?? 100)), 0) === 10,
    'partial event loss is limited to the two explicitly logged units',
  );

  console.log(`auto-battle-active-roster-event-test: ${pass} pass, ${fail} fail`);
} catch (error) {
  console.error('bundle/test failed:', error.message || error);
  fail++;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

process.exit(fail > 0 ? 1 : 0);
