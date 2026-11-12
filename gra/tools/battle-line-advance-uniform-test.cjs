'use strict';
/**
 * R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1 regression (headless engine, production turn loop).
 * A line of infantry (rank 0) + archers (rank 1) advances under the Atak (steady) doctrine across
 * open ground and past impassable obstacles. Per round we record the front spread of the line:
 * spread = max(q) - min(q) over rank-0 melee units (attacker side, advance axis = +q).
 * Run from gra/: node tools/battle-line-advance-uniform-test.cjs   (MEASURE=1 prints the tables;
 * SCENE_FILE=battleScene.orig-before.ts runs the same scenarios against a copy of the pre-fix scene = mutation check)
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadBattleScene() {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/" + (process.env.SCENE_FILE || 'battleScene.ts') + "'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-line-advance-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub-nonlogic-battle-assets', setup(build) {
      const stubs = [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ];
      for (const [filter, namespace, contents] of stubs) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function unit(id, side, q, r, o = {}) {
  const ranged = !!o.ranged;
  return {
    bu: { id, nazwa: o.nazwa ?? (ranged ? 'Łucznik' : 'Wojownik'), kategoria: ranged ? 'lucznik' : 'miecznik',
      stats: o.stats ?? {}, hp: 100, maxHp: 100 },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    mounted: false, rangedBase: ranged, primaryRanged: ranged, ranged,
    range: ranged ? 4 : 0, rangeBase: ranged ? 4 : 0, ammoLeft: ranged ? 10 : 0, ammoMax: ranged ? 10 : 0, moveLeft: 2,
    acted: false, morale: 100, moraleMax: 100, playerOrder: { type: 'none' },
    attackDirection: 'front', facing: side === 'atk' ? 'E' : 'W',
    groupId: `${side}-line`, formationRank: o.rank ?? 0,
  };
}

function runLine(BattleScene, cfg) {
  const { n = 9, rank0Q = 4, enemyQ = 60, rowStart = 20, obstacles = new Set(), rounds = 12,
    withRanged = true, speedOf = () => ({}), frozenIds = [] } = cfg;
  const atk = [];
  for (let i = 0; i < n; i++) atk.push(unit(`atk-w-${i}`, 'atk', rank0Q, rowStart + i, { rank: 0, stats: speedOf(i) }));
  if (withRanged) for (let i = 0; i < n; i++) atk.push(unit(`atk-a-${i}`, 'atk', rank0Q - 2, rowStart + i, { rank: 1, ranged: true }));
  const def = [];
  for (let i = 0; i < n; i++) def.push(unit(`def-w-${i}`, 'def', enemyQ, rowStart + i, { rank: 0, stats: speedOf(i) }));
  if (withRanged) for (let i = 0; i < n; i++) def.push(unit(`def-a-${i}`, 'def', enemyQ + 2, rowStart + i, { rank: 1, ranged: true }));
  const queue = [];
  const frames = [];
  const snapshot = () => [...atk, ...def].map(u => ({ id: u.bu.id, side: u.side, q: u.q, r: u.r, rank: u.formationRank }));
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk, def, finished: false, started: true, busy: false, _battleAwaitingOrders: false,
    _manualMode: false, siegeWallCol: -1, roundNo: 0, activeSide: 'atk', turnOrder: [], turnIdx: 0,
    _deployPlayerSideOpt: 'atk', _autoBattleSuspended: false, _stallTurns: 0, _stallSig: '',
    _counterBudget: { beginTurn() {}, canCounter() { return true; }, spend() {}, consume() {} },
    _generalSettings: { blockadeActive: false, blockadeCol: null },
    _groupMeta: new Map(), _groups: new Map(), _selectedUnits: new Set(),
    _queuedOrderUnitIds: new Set(), log: [], vTimers: [], engaged: new Set(), routedUnits: [],
    _autoBatchResolutions: [], _autoBatchPending: 0, _autoBatchToken: 0, _autoBatchPhase: null,
    occByKey: new Map([...atk, ...def].map(u => [`${u.q},${u.r}`, u])),
    terrainMap: { passable: (c, r) => !obstacles.has(`${c},${r}`), moveCost: () => 1, at: () => 0 },
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
      if (frozenIds.includes(u.bu.id)) { u.moveLeft = 0; done(); return; }   // permanently stuck unit
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

/** Front (rank 0) spread of one side in one frame: max(q) - min(q). */
function metrics(frame, side) {
  const qs = frame.filter(u => u.rank === 0 && u.side === side).map(u => u.q);
  const max = Math.max(...qs), min = Math.min(...qs);
  return { spread: max - min, min, max, qs };
}

function obstacleWall(cols, rows) {
  const s = new Set();
  for (const c of cols) for (const r of rows) s.add(`${c},${r}`);
  return s;
}

function union(...sets) { const s = new Set(); for (const x of sets) for (const v of x) s.add(v); return s; }

/** approach window = frames where the lines are still >= 8 columns apart (no contact behaviour). */
function approachFrames(frames) {
  const out = [];
  for (const f of frames) {
    const a = metrics(f, 'atk'), d = metrics(f, 'def');
    if (d.min - a.max >= 8) out.push(f); else break;
  }
  return out;
}

const SCENARIOS = {
  open: { obstacles: new Set() },
  rocks: { obstacles: union(obstacleWall([7, 8], [22, 23]), obstacleWall([56, 57], [22, 23])), clearCol: 8, clearDef: 56 },
  wall: { obstacles: union(obstacleWall([8], [20, 21, 22, 23, 24]), obstacleWall([56], [20, 21, 22, 23, 24])), clearCol: 8, clearDef: 56 },
  frozen: { obstacles: new Set(), frozenIds: ['atk-w-4', 'def-w-4'], progressRound: 14 },
  mixedSpeed: { obstacles: new Set(), speedOf: i => ({ __mp: i % 3 === 0 ? 3 : 2 }) },
};

module.exports = { loadBattleScene, runLine, metrics, obstacleWall, approachFrames, SCENARIOS };

const TOLERANCE = 2;      // max spread = smallest movement-point pool of the rank (measured: 2)
const FROZEN_MIN_Q = 14;   // anti-freeze threshold, measured with K=10 stall rounds (round 14: q=14)
const RECOVER_STEPS = 3;  // after the front clears the obstacle, spread <= 1 within this many rounds (measured: 1)

async function main() {
  const BattleScene = await loadBattleScene();
  const checks = [];
  for (const [name, cfg] of Object.entries(SCENARIOS)) {
    const { frames } = runLine(BattleScene, { ...cfg, rounds: Number(process.env.ROUNDS || 30) });
    const win = approachFrames(frames);
    if (cfg.progressRound != null) {
      // anti-freeze: one permanently stuck unit must not hold the rest of the line forever
      const f = frames[cfg.progressRound];
      const others = f.filter(u => u.rank === 0 && u.side === 'atk' && u.bu === undefined && !cfg.frozenIds.includes(u.id));
      const maxQ = Math.max(...others.map(u => u.q));
      if (process.env.MEASURE) console.log(`\n== ${name}: round ${cfg.progressRound} advance front q=${maxQ}`);
      checks.push([`${name}: rest of the line advances past q=${FROZEN_MIN_Q} by round ${cfg.progressRound} (q=${maxQ})`, maxQ >= FROZEN_MIN_Q]);
      continue;
    }
    for (const side of ['atk', 'def']) {
      const ms = win.map(f => metrics(f, side));
      const maxSpread = Math.max(...ms.map(m => m.spread));
      if (process.env.MEASURE) {
        console.log(`\n== ${name} / ${side}  (approach window: ${win.length} rounds, max spread ${maxSpread})`);
        ms.forEach((m, i) => console.log(`krok ${i}: rozrzut=${m.spread} q=${m.qs.join(',')}`));
      }
      checks.push([`${name}/${side}: max front spread ${maxSpread} <= ${TOLERANCE}`, maxSpread <= TOLERANCE]);
      if (cfg.clearCol != null) {
        const clearAt = ms.findIndex(m => (side === 'atk' ? m.min > cfg.clearCol : m.max < cfg.clearDef));
        const idx = clearAt < 0 ? ms.length - 1 : clearAt;
        const recovered = ms.slice(idx, idx + RECOVER_STEPS + 1).some(m => m.spread <= 1);
        const end = ms[ms.length - 1];
        checks.push([`${name}/${side}: front regains cohesion (spread <= 1) within ${RECOVER_STEPS} rounds of clearing the obstacle`, recovered]);
        checks.push([`${name}/${side}: end of approach window spread ${end.spread} <= 1`, end.spread <= 1]);
      }
    }
  }
  let failed = 0;
  for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
  assert.equal(failed, 0, `${failed} line-advance check(s) failed`);
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
