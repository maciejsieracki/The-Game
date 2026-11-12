'use strict';
/**
 * R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1 regression (headless engine, production turn loop).
 * Mixed attacker army (melee infantry rank 0, archers + siege machines rank 1, cavalry rank 2)
 * advances under the Atak (steady) doctrine. Before the first melee contact, every non-mounted
 * unit of one formation rank must keep the pace of the slowest unit of that rank (spread <= 2),
 * archers and machines included. Cavalry is outside the pace rule.
 * Run from gra/: node tools/battle-mixed-army-advance-pace-test.cjs
 *   MEASURE=1 prints per-round spreads; SCENE_FILE=battleScene.orig-before.ts runs the pre-fix scene (mutation check).
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadBattleScene, metrics } = require('./battle-line-advance-uniform-test.cjs');

const ROWS = 9;
const TOL = 2;      // piechota rangi 0: najmniejsza pula ruchu = 2 (mp 2/3)
const TOL_RANK1 = 1; // strzelcy+machiny rangi 1: najmniejsza pula ruchu = 1 (taran mp 1), sufit = tempo najwolniejszej jednostki

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
    groupId: `${side}-mixed`, formationRank: o.rank ?? 0,
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

function runMixed(BattleScene, rounds) {
  const { atk, def } = buildArmies();
  const queue = [];
  const frames = [];
  const snapshot = () => [...atk, ...def].map(u => ({
    id: u.bu.id, side: u.side, q: u.q, r: u.r, rank: u.formationRank,
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

async function main() {
  const BattleScene = await loadBattleScene();
  const rounds = Number(process.env.ROUNDS || 30);
  const { frames } = runMixed(BattleScene, rounds);
  const win = preContactFrames(frames);
  const checks = [];
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
  checks.push([`approach: melee rank spread ${maxMelee} <= ${TOL}`, maxMelee <= TOL]);
  checks.push([`approach: archers spread ${maxShooters} <= ${TOL_RANK1} (pace of the slowest rank-1 unit)`, maxShooters <= TOL_RANK1]);
  checks.push([`approach: machines spread ${maxMachines} <= ${TOL_RANK1} (pace of the slowest rank-1 unit)`, maxMachines <= TOL_RANK1]);
  // Paced units must actually advance (no permanent freeze of the mixed line).
  const last = win[win.length - 1] ?? frames[frames.length - 1];
  const advanced = last.filter(u => u.side === 'atk' && !u.mounted && u.rank === 1 && u.id.startsWith('atk-a'));
  const startQ = 2;
  const minAdv = Math.min(...advanced.map(u => u.q));
  checks.push([`approach: archers advance (min q ${minAdv} > start ${startQ})`, minAdv > startQ]);
  let failed = 0;
  for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
  assert.equal(failed, 0, `${failed} mixed-army pace check(s) failed`);
}
if (require.main === module) main().catch(e => { console.error(e.stack); process.exit(1); });
module.exports = { buildArmies, runMixed, preContactFrames, rankSpread, path };
