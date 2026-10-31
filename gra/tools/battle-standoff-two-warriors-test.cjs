'use strict';
/**
 * R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1 regression.
 *
 * Two small armies face each other across a gap. Player = atk, AI = def.
 * Drives the PRODUCTION turn loop (_beginTurn -> _beginAutoBatchPhase -> _launchAutoBatchResolution
 * -> _activateUnit -> _executeGroupDoctrineStep), not a hand-written activation loop.
 * Stubs only rendering, timers (synchronous queue) and the live melee/move side effects.
 *
 * Scenarios:
 *   A. AUTO from start (manual=false): 1v1 and 2v2 at gaps 0/1/3 must strike within 6 rounds.
 *   B. Owner path: manual battle, then "rozegraj automatycznie" mid-battle (_toggleManualMode
 *      equivalent: _beginAutoBatchTurnFromCurrentState) must still strike.
 *
 * Measured (this worktree): fails on 682a6b9a0 (AUTO: zero blows at every gap, the
 * "stand opposite and do not attack" symptom), fixed by 0d31bc4ec, passes at HEAD.
 * Root cause of the symptom (682a6b9a0 battleScene.ts:7672): _advanceStep returned done()
 * without striking when _canAttackFrom() was true, so adjacent melee units never attacked.
 * Fixed at HEAD battleScene.ts:7721-7726 (adjacent strike). Mutation check (re-inserting the
 * 682a6b9a0 early exit at 7721) turns all 6 checks red.
 * Parent 7fdc191ac: AUTO 1v1 passes; AUTO 2v2 gap 3 makes contact with 6 blows (< 10 threshold):
 * slow, not zero, so that check is red there for a threshold reason only.
 *
 * R3 (owner's latest-build report, reproduced in real Chromium on the ROBOCZA bundle): scenario C drives the
 * production START WALKI entry (_startBattle). Without a general/commander (manualControlAllowed=false, e.g. two
 * Wojownik) _startBattle picks AUTO but set _battleAwaitingOrders = _manualMode (false), so _kickoffBattleTurn
 * returned at once and round 1 never began ("Tura 0", armies facing each other). Introduced by e06ad53c8,
 * fixed in battleScene.ts _startBattle (_battleAwaitingOrders = true). Stubs here are rendering/UI only; the
 * turn gate itself (_startBattle -> _kickoffBattleTurn -> _beginTurn) is the production code.
 *
 * Run from gra/: node tools/battle-standoff-two-warriors-test.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadBattleScene() {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-standoff-entry.ts',
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

function unit(id, side, q, r) {
  return {
    bu: { id, nazwa: 'Wojownik', kategoria: 'miecznik', stats: {}, hp: 100, maxHp: 100 },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    mounted: false, rangedBase: false, primaryRanged: false, ranged: false,
    range: 0, rangeBase: 0, ammoLeft: 0, ammoMax: 0, moveLeft: 2,
    acted: false, morale: 100, moraleMax: 100, playerOrder: { type: 'none' },
    attackDirection: 'front', facing: side === 'atk' ? 'E' : 'W',
    groupId: `${side}-line`, formationRank: 0,
  };
}

async function runBattle(BattleScene, { n, gap, manual, maxRounds = 6, switchToAutoAfter = null, viaStart = null }) {
  const atk = Array.from({ length: n }, (_, i) => unit(`atk-warrior-${i + 1}`, 'atk', 10, 5 + i));
  const def = Array.from({ length: n }, (_, i) => unit(`def-warrior-${i + 1}`, 'def', 10 + gap + 1, 5 + i));
  const events = [];
  const queue = [];
  let limit = switchToAutoAfter != null ? switchToAutoAfter : maxRounds;
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk, def, finished: false, started: !viaStart, busy: false, _battleAwaitingOrders: false,
    _manualMode: manual, siegeWallCol: -1, roundNo: 0, activeSide: 'atk', turnOrder: [], turnIdx: 0,
    _deployPlayerSideOpt: 'atk', _autoBattleSuspended: false, _stallTurns: 0, _stallSig: '',
    _counterBudget: { beginTurn() {}, canCounter() { return true; }, spend() {}, consume() {} },
    _generalSettings: { blockadeActive: false, blockadeCol: null },
    _groupMeta: new Map(), _groups: new Map(), _selectedUnits: new Set(),
    _queuedOrderUnitIds: new Set(), log: [], vTimers: [], engaged: new Set(), routedUnits: [],
    _autoBatchResolutions: [], _autoBatchPending: 0, _autoBatchToken: 0, _autoBatchPhase: null,
    occByKey: new Map([...atk, ...def].map(u => [`${u.q},${u.r}`, u])),
    terrainMap: { passable: () => true, moveCost: () => 1, at: () => 0 },
    _targetPriorities: { mounted: ['melee'], ranged: ['melee'], melee: ['melee'] },
    _applyTerrainRange() {}, _updateFacing() {}, _updateMoraleBar() {}, _updateAmmoBar() {},
    _refreshQueuedOrderVisuals() {}, _updateBattlePhaseBanner() {}, _updateStallWatch() {},
    _disposeQueuedOrderArrows() {}, _syncAllGroupFrameMarkers() {}, hint: { textContent: '' },
    _priorityScore() { return 0; },
    // R3: UI-only collaborators of the real _startBattle (no game logic; the turn gate is NOT stubbed).
    vNow: 0, _battleStartVNow: 0, _manualCommanderGate: !!viaStart, _manualBtn: null, _rosterBar: null,
    _orderLinesGroup: null, _applyStartingMoralePowerPenalty() {}, _disposeAllOrderLines() {},
    _syncManualRailHighlight() {}, _buildRosterBar() {}, _initDeployGhostLayer() {}, _ensureGroupSelectorBar() {},
    _updateBattleRosterHeader() {}, _updateBattleQuickSelectBar() {}, _rebuildBattleRosterGrid() {},
    _syncMinimapPosition() {}, _syncBattleToolbarMode() {}, _clearOrderPreview() {},
    _destAllowedByBlockade() { return true; },
    _checkEnd() { return this.roundNo > limit; },
    // Production _schedule runs planning continuations synchronously; mirror that.
    _schedule(_delay, callback) { if (this._autoBatchPlanning) callback(); else queue.push(callback); },
    // Live-only side effects; planning (_autoBatchPlanning) defers to production methods.
    _doMove(u, q, r, done) {
      if (this._autoBatchPlanning) return BattleScene.prototype._doMove.call(this, u, q, r, done);
      events.push({ type: 'move', round: this.roundNo, id: u.bu.id, from: [u.q, u.r], to: [q, r] });
      this.occByKey.delete(`${u.q},${u.r}`);
      u.q = q; u.r = r; u.moveLeft--;
      this.occByKey.set(`${q},${r}`, u);
      done();
    },
    _doAttack(u, target, done) {
      if (this._autoBatchPlanning) return BattleScene.prototype._doAttack.call(this, u, target, done);
      const distance = Math.abs(u.q - target.q) + Math.abs(u.r - target.r);
      const legal = distance === 1;
      events.push({ type: legal ? 'melee-attack' : 'illegal-attack', round: this.roundNo, id: u.bu.id, targetId: target.bu.id, distance });
      if (legal) target.bu.hp -= 10;
      done();
    },
  });
  if (viaStart) {
    // Production entry (START WALKI): _startBattle decides manual vs AUTO from the commander gate and,
    // for AUTO, must kick the first turn off itself (_kickoffBattleTurn -> _beginTurn).
    atk[0].isArmyCommander = !!viaStart.commander;
    scene._startBattle();
  } else {
    queue.push(() => scene._beginTurn());
  }
  let steps = 0;
  const drain = () => { while (queue.length && steps < 200000) { steps++; queue.shift()(); } };
  drain();
  if (switchToAutoAfter != null) {
    // Owner path: manual battle, then AUTO chosen mid-battle (_toggleManualMode -> _beginAutoBatchTurnFromCurrentState).
    limit = maxRounds;
    scene._manualMode = false;
    scene._attackMoveMode = false;
    scene._queuedOrderUnitIds.clear();
    scene._battleAwaitingOrders = false;
    scene._beginAutoBatchTurnFromCurrentState();
    drain();
  }
  const hits = events.filter(e => e.type === 'melee-attack').length;
  const moves = events.filter(e => e.type === 'move').length;
  const minDist = Math.min(...atk.flatMap(a => def.map(d => Math.abs(a.q - d.q) + Math.abs(a.r - d.r))));
  return { n, gap, manual, switchToAutoAfter, viaStart, rounds: scene.roundNo, hits, moves, minDist, sceneManual: scene._manualMode, awaiting: scene._battleAwaitingOrders };
}

async function main() {
  const BattleScene = await loadBattleScene();
  const rows = [];
  const checks = [];
  for (const gap of [0, 1, 3]) {
    const r = await runBattle(BattleScene, { n: 1, gap, manual: false });
    rows.push(r);
    checks.push([`AUTO 1v1 gap ${gap}: blows`, r.hits >= 5 && r.minDist === 1]);
  }
  const twoGap3 = await runBattle(BattleScene, { n: 2, gap: 3, manual: false });
  rows.push(twoGap3);
  checks.push(['AUTO 2v2 gap 3: blows and contact', twoGap3.hits >= 10 && twoGap3.minDist === 1]);
  const switched = await runBattle(BattleScene, { n: 2, gap: 3, manual: true, switchToAutoAfter: 2 });
  rows.push(switched);
  checks.push(['manual 2 rounds -> AUTO 2v2 gap 3: blows and contact', switched.hits >= 10 && switched.minDist === 1]);
  const switchedOne = await runBattle(BattleScene, { n: 1, gap: 3, manual: true, switchToAutoAfter: 2 });
  rows.push(switchedOne);
  checks.push(['manual 2 rounds -> AUTO 1v1 gap 3: blows and contact', switchedOne.hits >= 5 && switchedOne.minDist === 1]);

  // C. Production start without a commander/general (the owner's two Wojownik case): manualControlAllowed=false
  //    forces AUTO in _startBattle; the first turn must begin on its own (regression: round 0 forever).
  for (const n of [1, 2]) {
    const noCmd = await runBattle(BattleScene, { n, gap: 3, manual: false, viaStart: { commander: false } });
    rows.push(noCmd);
    checks.push([`_startBattle without commander ${n}v${n} gap 3: auto turn begins, blows and contact`,
      noCmd.rounds >= 1 && noCmd.hits >= 5 * n && noCmd.minDist === 1]);
  }
  // C2. With a commander the battle starts MANUAL and waits for orders (no turn until the player kicks it off).
  const withCmd = await runBattle(BattleScene, { n: 1, gap: 3, manual: true, viaStart: { commander: true } });
  rows.push(withCmd);
  checks.push(['_startBattle with commander: stays manual, waits for orders (round 0, no blows)',
    withCmd.sceneManual === true && withCmd.awaiting === true && withCmd.rounds === 0 && withCmd.hits === 0]);

  console.log(JSON.stringify(rows, null, 1));
  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
    if (!ok) failed++;
  }
  assert.equal(failed, 0, `${failed} standoff check(s) failed`);
}

main().catch(err => { console.error(err); process.exit(1); });
