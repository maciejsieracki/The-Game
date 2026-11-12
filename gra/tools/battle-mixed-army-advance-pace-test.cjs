'use strict';
/**
 * R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1 regression (headless engine, production turn loop).
 *
 * Checks (runda 4/5, zarzuty FC rundy 1):
 *  A. Approach pace of the mixed attacker army (melee rank 0, archers + siege machines rank 1, cavalry
 *     outside the pace rule). Melee spread <= TOL, machines spread <= TOL_RANK1 (ABC: TOL=2, TOL_RANK1=2).
 *     Zarzut 2: the archer spread does NOT distinguish the base 81e357dee from the fix in this scenario
 *     (both 0); the archer check is kept as a regression only, the mutation proof is machines-only.
 *  B. Post-contact kite (zarzut 1): an archer adjacent to a melee foe must step away (RANGED KITE forced
 *     in isolation). MUTATE_KITE=1 disables kite on the archer -> check must FAIL.
 *  C. Group without infantry (zarzut 4): a group of archers + machines with no melee unit of its own
 *     keeps its pace while another group is already in melee contact (contact is group-scoped).
 *
 * Run from gra/: node tools/battle-mixed-army-advance-pace-test.cjs
 *   MEASURE=1 prints per-round data; SCENE_FILE=<file in src/battle/> runs an alternative scene (mutation).
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadBattleScene, metrics } = require('./battle-line-advance-uniform-test.cjs');

const ROWS = 9;
const TOL = 2;       // piechota rangi 0 (decyzja ABC 2026-11-12: TOL = 2, zmierzona wartosc)
const TOL_RANK1 = 2; // strzelcy+machiny rangi 1 (decyzja ABC 2026-11-12: TOL_RANK1 = 2, zapas o jedno pole)
const MELEE_SAFE_GAP = 2;

function unit(id, side, q, r, o = {}) {
  const ranged = !!o.ranged;
  const siege = !!o.siege;
  const mounted = !!o.mounted;
  let nazwa = 'Wojownik';
  let kategoria = 'miecznik';
  if (ranged) { nazwa = 'Łucznik'; kategoria = 'lucznik'; }
  if (siege) { nazwa = 'Taran'; kategoria = 'oblezniczy'; }
  if (mounted) { nazwa = 'Jeździec'; kategoria = 'konny'; }
  const stats = siege ? { Typ: 'Siege', Jednostka: 'Taran' } : (o.stats ?? {});
  return {
    bu: { id, nazwa, kategoria, stats, hp: 100, maxHp: 100 },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    mounted, rangedBase: ranged, primaryRanged: ranged, ranged,
    range: ranged ? 4 : 0, rangeBase: ranged ? 4 : 0, ammoLeft: ranged ? 10 : 0, ammoMax: ranged ? 10 : 0, moveLeft: 2,
    acted: false, morale: 100, moraleMax: 100, playerOrder: { type: 'none' },
    attackDirection: 'front', facing: side === 'atk' ? 'E' : 'W',
    groupId: o.groupId ?? `${side}-mixed`, formationRank: o.rank ?? 0,
  };
}

function buildArmies() {
  const atk = [];
  const def = [];
  const r0 = 20;
  for (let i = 0; i < ROWS; i++) atk.push(unit(`atk-w-${i}`, 'atk', 4, r0 + i, { rank: 0, stats: { __mp: i % 3 === 0 ? 3 : 2 } }));
  for (let i = 0; i < ROWS; i++) atk.push(unit(`atk-a-${i}`, 'atk', 2, r0 + i, { rank: 1, ranged: true, stats: { __mp: i % 3 === 0 ? 3 : 2 } }));
  for (let i = 0; i < 3; i++) atk.push(unit(`atk-m-${i}`, 'atk', 2, r0 + 3 * i + 1, { rank: 1, siege: true, stats: { Typ: 'Siege', Jednostka: 'Taran', __mp: i === 0 ? 1 : 3 } }));
  for (let i = 0; i < 4; i++) atk.push(unit(`atk-c-${i}`, 'atk', 0, r0 + 2 * i, { rank: 2, mounted: true }));
  for (let i = 0; i < ROWS; i++) def.push(unit(`def-w-${i}`, 'def', 60, r0 + i, { rank: 0 }));
  for (let i = 0; i < ROWS; i++) def.push(unit(`def-a-${i}`, 'def', 62, r0 + i, { rank: 1, ranged: true }));
  return { atk, def };
}

/**
 * Headless turn loop on a stubbed scene. onMove(u, fromQ, fromR, toQ, toR, scene) is called for every
 * real (non-planning) move, BEFORE the unit is relocated, so the caller sees the pre-move position.
 */
function runMixed(BattleScene, rounds, armies = buildArmies(), onMove = null) {
  const { atk, def } = armies;
  const queue = [];
  const frames = [];
  const snapshot = () => [...atk, ...def].map(u => ({
    id: u.bu.id, side: u.side, q: u.q, r: u.r, rank: u.formationRank, group: u.groupId,
    mounted: u.mounted, shooter: u.rangedBase || (u.bu.stats && u.bu.stats.Typ === 'Siege'),
  }));
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk, def, terrainData: [], finished: false, started: true, busy: false, _battleAwaitingOrders: false,
    _manualMode: false, siegeWallCol: -1, roundNo: 0, activeSide: 'atk', turnOrder: [], turnIdx: 0,
    _deployPlayerSideOpt: 'atk', _autoBattleSuspended: false, _stallTurns: 0, _stallSig: '',
    _counterBudget: { beginTurn() {}, canCounter() { return true; }, spend() {}, consume() {} },
    _generalSettings: { blockadeActive: false, blockadeCol: null },
    _groupMeta: new Map(), _groups: new Map(), _selectedUnits: new Set(),
    _queuedOrderUnitIds: new Set(), log: [], vTimers: [], engaged: new Set(), routedUnits: [],
    _autoBatchResolutions: [], _autoBatchPending: 0, _autoBatchToken: 0, _autoBatchPhase: null,
    occByKey: new Map([...atk, ...def].map(u => [`${u.q},${u.r}`, u])),
    terrainMap: { passable: () => true, moveCost: () => 1, at: () => 0, combatTerrainName: () => 'Plains' },
    _targetPriorities: { mounted: ['melee'], ranged: ['melee'], melee: ['melee'] },
    _applyTerrainRange() {}, _updateFacing() {}, _updateMoraleBar() {}, _updateAmmoBar() {},
    _refreshQueuedOrderVisuals() {}, _updateBattlePhaseBanner() {}, _updateStallWatch() {},
    _disposeQueuedOrderArrows() {}, _syncAllGroupFrameMarkers() {}, hint: { textContent: '' },
    _priorityScore() { return 0; },
    vNow: 0, _battleStartVNow: 0, _destAllowedByBlockade() { return true; },
    _movementPointsFor(bu) { return (bu.stats && bu.stats.__mp) || 2; },
    _checkEnd() { if (frames.length <= this.roundNo) frames.push(snapshot()); return this.roundNo >= rounds; },
    _schedule(_d, cb) { if (this._autoBatchPlanning) cb(); else queue.push(cb); },
    _doMove(u, q, r, done) {
      if (this._autoBatchPlanning) return BattleScene.prototype._doMove.call(this, u, q, r, done);
      if (onMove) onMove(u, u.q, u.r, q, r, this);
      this.occByKey.delete(`${u.q},${u.r}`);
      u.q = q; u.r = r; u.moveLeft--;
      this.occByKey.set(`${q},${r}`, u);
      done();
    },
    _doAttack(u, target, done) { done(); },
  });
  queue.push(() => scene._beginTurn());
  let steps = 0;
  while (queue.length && steps < 800000) { steps++; queue.shift()(); }
  return { frames };
}

/** Rounds before the first melee contact of the attacker side (no infantry adjacent to an enemy). */
function preContactFrames(frames) {
  const out = [];
  for (const f of frames) {
    const a = f.filter(u => u.side === 'atk' && !u.mounted && u.rank === 0);
    const d = f.filter(u => u.side === 'def' && u.rank === 0);
    const gap = Math.min(...d.map(u => u.q)) - Math.max(...a.map(u => u.q));
    if (gap >= 8) out.push(f); else break;
  }
  return out;
}

function rankSpread(frame, rank, filter = () => true) {
  const qs = frame.filter(u => u.side === 'atk' && !u.mounted && u.rank === rank && filter(u)).map(u => u.q);
  if (qs.length === 0) return { spread: 0, max: 0, min: 0 };
  return { spread: Math.max(...qs) - Math.min(...qs), max: Math.max(...qs), min: Math.min(...qs) };
}

function manhattanQR(q1, r1, q2, r2) {
  // axial distance (the engine's manhattan on hex coords used by MELEE_SAFE_GAP)
  const dq = q1 - q2; const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function buildG2() {
  const g2 = [];
  for (let i = 0; i < 3; i++) g2.push(unit(`atk-g2-a${i}`, 'atk', 2, 40 + i, { rank: 1, ranged: true, groupId: 'atk-g2', stats: { __mp: i === 0 ? 3 : 2 } }));
  g2.push(unit('atk-g2-m0', 'atk', 2, 43, { rank: 1, siege: true, groupId: 'atk-g2', stats: { Typ: 'Siege', Jednostka: 'Taran', __mp: 3 } }));
  return g2;
}

function buildD2() {
  return [unit('def-g2-a0', 'def', 60, 40, { rank: 1, ranged: true, groupId: 'def-g2' })];
}

/** A: pace of the mixed army before the first melee contact. */
async function checkApproach(BattleScene, checks) {
  const rounds = Number(process.env.ROUNDS || 30);
  const { frames } = runMixed(BattleScene, rounds);
  const win = preContactFrames(frames);
  if (process.env.MEASURE) console.log(`approach window: ${win.length} rounds`);
  const rows = win.map((f, i) => ({
    i,
    melee: rankSpread(f, 0),
    shooters: rankSpread(f, 1, u => u.shooter && !u.mounted && u.id.startsWith('atk-a')),
    machines: rankSpread(f, 1, u => u.id.startsWith('atk-m')),
  }));
  if (process.env.MEASURE) {
    for (const r of rows) console.log(`krok ${r.i}: piechota=${r.melee.spread} strzelcy=${r.shooters.spread} machiny=${r.machines.spread} (max q piechoty=${r.melee.max})`);
  }
  const maxMelee = Math.max(...rows.map(r => r.melee.spread));
  const maxShooters = Math.max(...rows.map(r => r.shooters.spread));
  const maxMachines = Math.max(...rows.map(r => r.machines.spread));
  checks.push([`A1 approach: melee rank spread ${maxMelee} <= ${TOL}`, maxMelee <= TOL]);
  checks.push([`A2 approach (regresja, NIE rozroznia bazy 81e357dee): archers spread ${maxShooters} <= ${TOL_RANK1}`, maxShooters <= TOL_RANK1]);
  checks.push([`A3 approach: machines spread ${maxMachines} <= ${TOL_RANK1} (pace of the slowest rank-1 unit)`, maxMachines <= TOL_RANK1]);
  const last = win[win.length - 1] ?? frames[frames.length - 1];
  const advanced = last.filter(u => u.side === 'atk' && !u.mounted && u.rank === 1 && u.id.startsWith('atk-a'));
  const startQ = 2;
  const minAdv = Math.min(...advanced.map(u => u.q));
  checks.push([`A4 approach: archers advance (min q ${minAdv} > start ${startQ})`, minAdv > startQ]);
}

/**
 * B: post-contact kite (zarzut 1). One archer next to one melee foe with free ground behind the archer.
 * Every real move of the archer that starts inside MELEE_SAFE_GAP must increase the distance; at least one
 * such kite move must occur (the mechanism is forced in isolation, not left to chance).
 */
async function checkKite(BattleScene, checks) {
  const mutate = !!process.env.MUTATE_KITE;
  const archer = unit('atk-k', 'atk', 10, 20, { rank: 1, ranged: true });
  // 'manual' doctrine routes the archer to _rangedAction (kite branch); the AUTO doctrine path
  // (_executeGroupDoctrineStep) shoots and holds without the kite step.
  archer.unitDoctrine = 'manual';
  if (mutate) archer.rangedKite = false;
  const foe = unit('def-m', 'def', 11, 20, { rank: 0 });
  const kiteMoves = [];
  const { frames } = runMixed(BattleScene, 6, { atk: [archer], def: [foe] }, (u, fq, fr, tq, tr) => {
    if (u.bu.id !== 'atk-k') return;
    const pre = manhattanQR(fq, fr, foe.q, foe.r);
    const post = manhattanQR(tq, tr, foe.q, foe.r);
    if (pre <= MELEE_SAFE_GAP) kiteMoves.push({ pre, post, from: [fq, fr], to: [tq, tr] });
  });
  if (process.env.MEASURE) {
    console.log(`kite frames: ${frames.length}; archer moves inside gap: ${JSON.stringify(kiteMoves)}`);
  }
  const kiteOk = kiteMoves.every(m => m.post > m.pre);
  // Gap restored: from an adjacent foe (pre 1) the step must reach MELEE_SAFE_GAP.
  const restored = kiteMoves.filter(m => m.pre <= 1).every(m => m.post >= MELEE_SAFE_GAP);
  checks.push([`B1 kite: archer in melee gap steps away (${kiteMoves.length} kite move(s), all increase distance)`, kiteMoves.length >= 1 && kiteOk]);
  checks.push([`B2 kite: step from adjacent foe restores gap >= ${MELEE_SAFE_GAP}`, kiteMoves.some(m => m.pre <= 1) && restored]);
}

/**
 * C: group without infantry (zarzut 4). Group g1 (infantry) is already in melee contact with a def foe;
 * group g2 has only archers + one machine (no melee unit). g2 must keep its pace (spread <= TOL_RANK1)
 * during the rounds while g1 is engaged: the first-contact lift is group-scoped.
 */
async function checkGroupWithoutInfantry(BattleScene, checks) {
  const g1 = [unit('atk-g1-w0', 'atk', 4, 20, { rank: 0, groupId: 'atk-g1' }),
    unit('atk-g1-w1', 'atk', 4, 21, { rank: 0, groupId: 'atk-g1' })];
  const d1 = [unit('def-g1-w0', 'def', 5, 20, { rank: 0, groupId: 'def-g1' })];
  const g2 = buildG2();
  const d2 = buildD2();
  const armies = { atk: [...g1, ...g2], def: [...d1, ...d2] };
  const { frames } = runMixed(BattleScene, 12, armies);
  const g2Of = f => f.filter(u => u.side === 'atk' && u.group === 'atk-g2' && !u.mounted);
  const rows = frames.map((f, i) => {
    const qs = g2Of(f).map(u => u.q);
    return { i, spread: Math.max(...qs) - Math.min(...qs) };
  });
  const maxSpread = Math.max(...rows.map(r => r.spread));
  if (process.env.MEASURE) console.log(`group-no-infantry g2 spreads: ${rows.map(r => r.spread).join(',')}`);
  checks.push([`C1 group without infantry (g2 archers+machine, other group in contact): spread ${maxSpread} <= ${TOL_RANK1}`, maxSpread <= TOL_RANK1]);
}

async function main() {
  const BattleScene = await loadBattleScene();
  const checks = [];
  await checkApproach(BattleScene, checks);
  await checkKite(BattleScene, checks);
  await checkGroupWithoutInfantry(BattleScene, checks);
  let failed = 0;
  for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
  assert.equal(failed, 0, `${failed} mixed-army pace check(s) failed`);
}
if (require.main === module) main().catch(e => { console.error(e.stack); process.exit(1); });
module.exports = { buildArmies, runMixed, preContactFrames, rankSpread, path, metrics };
