'use strict';
/** node gra/tools/post-battle-map-test.cjs */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.post-battle-entry.ts');
const BUNDLE = path.join(__dirname, '.post-battle-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `
import {
  pickRetreatTargetAwayFromAttacker,
  pickRetreatTargetTowardAttackerSide,
  applyPostBattleMap,
} from '../src/game/post-battle-map';
export { pickRetreatTargetAwayFromAttacker, pickRetreatTargetTowardAttackerSide, applyPostBattleMap };
`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  pickRetreatTargetAwayFromAttacker,
  pickRetreatTargetTowardAttackerSide,
  applyPostBattleMap,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const passable = new Set(['10,21', '11,21', '12,21', '10,22', '11,22', '12,22', '10,23', '11,23', '12,23']);
const isPassableHex = (q, r) => passable.has(q + ',' + r);

const baseInput = {
  battleQ: 11,
  battleR: 22,
  atkRoster: [
    { id: 'u0', q: 10, r: 23 },
    { id: 'u1', q: 11, r: 23 },
    { id: 'u2', q: 12, r: 23 },
  ],
  isPassableHex,
};

// Atak z południa → obrońca ucieka na północ (r-1), nie w stronę atakujących (r+1)
const away = pickRetreatTargetAwayFromAttacker(baseInput);
assert(away.r === 21, 'def retreat north, got ' + away.q + ',' + away.r);
assert(away.r < baseInput.battleR, 'def retreat away from atk (lower r)');

const toward = pickRetreatTargetTowardAttackerSide(baseInput);
assert(toward.r === 23, 'atk side retreat south, got ' + toward.q + ',' + toward.r);
assert(toward.r > baseInput.battleR, 'remis atk step toward own side');

// Morze nie przechodzi — tylko ląd w passable
const seaBlocked = pickRetreatTargetAwayFromAttacker({
  ...baseInput,
  isPassableHex: (q, r) => r !== 21 && isPassableHex(q, r),
});
assert(seaBlocked.r !== 21 || !passable.has(seaBlocked.q + ',21'), 'no retreat onto blocked sea row');

// Auto szturm: brak manualSurvivors (undefined) — atakujący NIE znikają przy wygranej
const units = [
  { id: 'u0', ownerId: 0, typeId: 'Hastati', q: 10, r: 22, ruchLeft: 2 },
  { id: 'u1', ownerId: 0, typeId: 'Hastati', q: 11, r: 21, ruchLeft: 2 },
  { id: 'e0', ownerId: 1, typeId: 'Lucznik', q: 12, r: 22, ruchLeft: 2 },
];
const city = { id: 'c1', ownerId: 1, q: 11, r: 22, name: 'Ateny' };
applyPostBattleMap({
  units,
  map: { hexes: {} },
  cities: [city],
  battleQ: 11,
  battleR: 22,
  atkAnchor: units[0],
  atkRoster: [units[0], units[1]],
  defRoster: [units[2]],
  atkStart: new Map([['u0', { q: 10, r: 22 }], ['u1', { q: 11, r: 21 }]]),
  winner: 'atakujacy',
  lossAtkPct: 0,
  lossDefPct: 1,
  getDef: () => ({ Health: 100 }),
  maxHpOf: () => 100,
  isPassableHex,
  isUnitAt: () => false,
  cityOnBattleHex: city,
});
assert(units.filter(u => u.ownerId === 0).length === 2, 'auto win: both atk units remain');
assert(units.find(u => u.id === 'u0')?.q === 11 && units.find(u => u.id === 'u0')?.r === 22, 'lead on city hex');
assert(units.find(u => u.id === 'u1')?.q === 11 && units.find(u => u.id === 'u1')?.r === 22, 'stacked atk on city hex');

// Pole P×W+: połączona armia ATK zostaje razem na heksie zwycięstwa
const stackedAtk = [
  { id: 'a0', ownerId: 0, typeId: 'Oszczepnik', q: 96, r: 53, ruchLeft: 1 },
  { id: 'a1', ownerId: 0, typeId: 'Wojownik', q: 96, r: 53, ruchLeft: 1 },
  { id: 'e0', ownerId: 1, typeId: 'Wojownik', q: 95, r: 53, ruchLeft: 1 },
];
applyPostBattleMap({
  units: stackedAtk,
  map: { hexes: {} },
  cities: [],
  battleQ: 95,
  battleR: 53,
  atkAnchor: stackedAtk[0],
  atkRoster: [stackedAtk[0], stackedAtk[1]],
  defRoster: [stackedAtk[2]],
  atkStart: new Map([['a0', { q: 96, r: 53 }], ['a1', { q: 96, r: 53 }]]),
  winner: 'atakujacy',
  manualSurvivors: [{ id: 'a0', hp: 80 }, { id: 'a1', hp: 60 }],
  getDef: () => ({ Health: 100 }),
  maxHpOf: () => 100,
  isPassableHex: () => true,
  isUnitAt: (q, r, exceptId) =>
    stackedAtk.some(u => u.id !== exceptId && u.q === q && u.r === r),
});
const a0 = stackedAtk.find(u => u.id === 'a0');
const a1 = stackedAtk.find(u => u.id === 'a1');
const e0 = stackedAtk.find(u => u.id === 'e0');
assert(a0?.q === 95 && a0?.r === 53, 'stack win: spearman on battle hex');
assert(a1?.q === 95 && a1?.r === 53, 'stack win: warrior stacked on battle hex');
assert(!e0, 'stack win: enemy removed');

// Miasto M×W+ (Maciej B 2026-06-26): pierścień odskakuje −1 heks jak na polu
const widePassable = (q, r) => q >= 9 && q <= 14 && r >= 20 && r <= 24;
const ringUnits = [
  { id: 'u0', ownerId: 0, typeId: 'Hastati', q: 11, r: 23, ruchLeft: 2 },
  { id: 'e0', ownerId: 1, typeId: 'Lucznik', q: 12, r: 22, ruchLeft: 2 },
  { id: 'e1', ownerId: 1, typeId: 'Lucznik', q: 10, r: 22, ruchLeft: 2 },
];
applyPostBattleMap({
  units: ringUnits,
  map: { hexes: {} },
  cities: [city],
  battleQ: 11,
  battleR: 22,
  atkAnchor: ringUnits[0],
  atkRoster: [ringUnits[0]],
  defRoster: [ringUnits[1], ringUnits[2]],
  atkStart: new Map([['u0', { q: 11, r: 23 }]]),
  winner: 'atakujacy',
  lossAtkPct: 0,
  lossDefPct: 0,
  getDef: () => ({ Health: 100 }),
  maxHpOf: () => 100,
  isPassableHex: widePassable,
  isUnitAt: () => false,
  cityOnBattleHex: city,
});
const e0City = ringUnits.find(u => u.id === 'e0');
const e1City = ringUnits.find(u => u.id === 'e1');
assert(e0City && (e0City.q !== 12 || e0City.r !== 22), 'city win: ring def e0 fan-out');
assert(e1City && (e1City.q !== 10 || e1City.r !== 22), 'city win: ring def e1 fan-out');

// Pole P×W+: obrońca w pierścieniu odskakuje o 1 heks
const fieldUnits = [
  { id: 'u0', ownerId: 0, typeId: 'Hastati', q: 10, r: 23, ruchLeft: 2 },
  { id: 'e0', ownerId: 1, typeId: 'Lucznik', q: 11, r: 22, ruchLeft: 2 },
  { id: 'e1', ownerId: 1, typeId: 'Lucznik', q: 12, r: 22, ruchLeft: 2 },
];
applyPostBattleMap({
  units: fieldUnits,
  map: { hexes: {} },
  cities: [],
  battleQ: 11,
  battleR: 22,
  atkAnchor: fieldUnits[0],
  atkRoster: [fieldUnits[0]],
  defRoster: [fieldUnits[1], fieldUnits[2]],
  atkStart: new Map([['u0', { q: 10, r: 23 }]]),
  winner: 'atakujacy',
  lossAtkPct: 0,
  lossDefPct: 0,
  getDef: () => ({ Health: 100 }),
  maxHpOf: () => 100,
  isPassableHex,
  isUnitAt: () => false,
});
const e0After = fieldUnits.find(u => u.id === 'e0');
assert(e0After && (e0After.q !== 11 || e0After.r !== 22), 'field win: def e0 moved off battle hex');

// Scout sąsiad NIE w atkRoster — po wygranej zostaje na swoim hexie (Teby x3 fix)
const scoutSideUnits = [
  { id: 'a0', ownerId: 0, typeId: 'Hastati', q: 10, r: 22, ruchLeft: 2 },
  { id: 'a1', ownerId: 0, typeId: 'Hastati', q: 11, r: 21, ruchLeft: 2 },
  { id: 'scout', ownerId: 0, typeId: 'Zwiadowca', category: 'zwiadowca', q: 10, r: 21, ruchLeft: 3 },
  { id: 'e0', ownerId: 1, typeId: 'Falanga', q: 11, r: 22, ruchLeft: 0 },
];
const scoutCity = { id: 'c2', ownerId: 1, q: 11, r: 22, name: 'Teby' };
applyPostBattleMap({
  units: scoutSideUnits,
  map: { hexes: {} },
  cities: [scoutCity],
  battleQ: 11,
  battleR: 22,
  atkAnchor: scoutSideUnits[0],
  atkRoster: [scoutSideUnits[0], scoutSideUnits[1]],
  defRoster: [scoutSideUnits[3]],
  atkStart: new Map([
    ['a0', { q: 10, r: 22 }],
    ['a1', { q: 11, r: 21 }],
  ]),
  winner: 'atakujacy',
  lossAtkPct: 0,
  lossDefPct: 1,
  getDef: () => ({ Health: 100 }),
  maxHpOf: () => 100,
  isPassableHex,
  isUnitAt: () => false,
  cityOnBattleHex: scoutCity,
});
const scoutAfter = scoutSideUnits.find(u => u.id === 'scout');
assert(scoutAfter?.q === 10 && scoutAfter?.r === 21, 'scout neighbor stays on original hex after city win');

console.log('post-battle-map-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
