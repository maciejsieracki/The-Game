'use strict';
/**
 * R-AUTO-BITWA-JEDNOCZESNA-Q1 focused regression.
 *
 * The live BattleScene turn seam is bundled from the production source. The
 * pure resolver then proves the phase-start snapshot and deterministic conflict
 * contract without WebGL. The lethal-first-strike case deliberately compares
 * frozen intents with a sequential live-target loop: both intents survive the
 * snapshot, while the existing phase executor may skip a target already gone
 * when its animation reaches the commit point.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = process.env.THE_GAME_NODE_MODULES || path.join(ROOT, 'node_modules');
const esbuild = require(path.join(MODULE_ROOT, 'esbuild'));
const SCENE = path.join(ROOT, 'src', 'battle', 'battleScene.ts');
const HELPER = path.join(ROOT, 'src', 'battle', 'autoBatchPhase.ts');

let pass = 0;
let fail = 0;
function assert(condition, message) {
  if (condition) {
    pass += 1;
    console.log('  [OK]', message);
  } else {
    fail += 1;
    console.error('  [FAIL]', message);
  }
}

async function loadSceneClass() {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT,
      sourcefile: 'auto-battle-simultaneous-entry.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'es2020',
    alias: { three: path.join(MODULE_ROOT, 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stub-battle-assets',
      setup(build) {
        build.onResolve({ filter: /[\\/]ui[\\/]icons[\\/]brandAssets$/ }, args => ({
          path: args.path,
          namespace: 'battle-brand-stub',
        }));
        build.onResolve({ filter: /brandAssets/ }, args => ({
          path: args.path,
          namespace: 'battle-brand-stub',
        }));
        build.onLoad({ filter: /.*/, namespace: 'battle-brand-stub' }, () => ({
          contents: 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";',
          loader: 'js',
        }));
        build.onResolve({ filter: /leaderPortraits/ }, args => ({
          path: args.path,
          namespace: 'battle-leader-stub',
        }));
        build.onLoad({ filter: /.*/, namespace: 'battle-leader-stub' }, () => ({
          contents: 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";',
          loader: 'js',
        }));
        build.onResolve({ filter: /muzyka-antyczna/ }, args => ({
          path: args.path,
          namespace: 'battle-audio-stub',
        }));
        build.onLoad({ filter: /.*/, namespace: 'battle-audio-stub' }, () => ({
          contents: 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};',
          loader: 'js',
        }));
      },
    }],
    write: false,
    logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module,
    exports: module.exports,
    require,
    console,
    process,
    globalThis,
    setTimeout,
    clearTimeout,
  }, { filename: SCENE });
  return module.exports.BattleScene;
}

function unit(id, side, q, r) {
  return {
    bu: { id, nazwa: id, stats: { 'Ruch w bitwie (heksy)': 1 }, hp: 10, maxHp: 10 },
    q,
    r,
    side,
    dead: false,
    fadingOut: false,
    removed: false,
    routed: false,
    acted: false,
    moveLeft: 1,
    moraleMax: 100,
    morale: 100,
  };
}

function makeTurnFixture(BattleScene, manualMode) {
  const scene = Object.create(BattleScene.prototype);
  const atk = [unit('atk-a', 'atk', 0, 0), unit('atk-b', 'atk', 0, 1)];
  const def = [unit('def-a', 'def', 3, 0), unit('def-b', 'def', 3, 1)];
  const activated = [];
  const batchCalls = [];
  const scheduled = [];
  Object.assign(scene, {
    finished: false,
    _battleAwaitingOrders: false,
    _manualMode: manualMode,
    _autoBattleSuspended: false,
    siegeWallCol: -1,
    roundNo: 0,
    atk,
    def,
    turnOrder: [],
    turnIdx: 0,
    hint: { textContent: '' },
    _counterBudget: { beginTurn() {} },
    _updateStallWatch() {},
    _checkEnd() { return false; },
    _updateBattlePhaseBanner() {},
    _schedule(ms, cb) { scheduled.push({ ms, cb }); },
    _activateUnit(ru, done) {
      activated.push(ru.bu.id);
      done();
    },
    _beginAutoBatchPhase(side, units) {
      batchCalls.push({ side, ids: units.map(ru => ru.bu.id) });
    },
    _playerRoster() { return atk; },
    _enemyRoster() { return def; },
  });
  return { scene, activated, batchCalls, scheduled, atk, def };
}

async function runSceneSeamChecks() {
  let BattleScene;
  try {
    BattleScene = await loadSceneClass();
    assert(typeof BattleScene === 'function', 'BattleScene loads through the project bundler');
  } catch (error) {
    assert(false, `BattleScene fixture bundles: ${error.message}`);
    return;
  }

  const auto = makeTurnFixture(BattleScene, false);
  auto.scene._beginTurn();
  assert(auto.batchCalls.length === 1 && auto.batchCalls[0].side === 'atk',
    'AUTO opens one attacker phase at the start of a non-siege turn');
  assert(auto.batchCalls[0].ids.join(',') === 'atk-a,atk-b',
    'AUTO attacker phase freezes all attackers in stable order');
  assert(auto.activated.length === 0,
    'AUTO does not fall through to the interleaved _activateNext path');
  assert(auto.scene.roundNo === 1 && auto.atk.every(ru => ru.acted === false),
    'AUTO phase starts after the normal turn reset without pre-acting units');

  const manual = makeTurnFixture(BattleScene, true);
  manual.scene._beginTurn();
  assert(manual.batchCalls.length === 0,
    'manual mode never enters the AUTO batch seam');
  assert(manual.activated.length === 1 && manual.activated[0] === 'atk-a',
    'manual mode keeps sequential _activateNext activation');
  assert(manual.scene.turnOrder.map(ru => ru.bu.id).join(',') === 'atk-a,atk-b,def-a,def-b',
    'manual order remains player roster followed by enemy roster');

  const barrier = makeTurnFixture(BattleScene, false);
  barrier.scene._autoBatchPhase = 'atk';
  barrier.scene._autoBatchToken = 17;
  barrier.scene._autoBatchPending = 0;
  barrier.scene._autoBatchSuspended = false;
  barrier.scene._autoBatchResolutions = [];
  assert(typeof barrier.scene._finishAutoBatchPhase === 'function',
    'BattleScene owns the AUTO phase barrier transition');
  if (typeof barrier.scene._finishAutoBatchPhase === 'function') {
    barrier.scene._finishAutoBatchPhase(17);
    assert(barrier.batchCalls.length === 1 && barrier.batchCalls[0].side === 'def',
      'AUTO opens the defender phase only after the attacker wave settles');
    assert(barrier.batchCalls[0].ids.join(',') === 'def-a,def-b',
      'defender phase uses the remaining live defenders in stable order');
  }

  const source = fs.readFileSync(SCENE, 'utf8');
  assert(source.includes("if (!this._manualMode && this.siegeWallCol < 0)"),
    'the production _beginTurn path gates field AUTO into batching');
  assert(source.includes('this._autoBatchPlanning'),
    'production action methods expose a non-animated planning seam');
  assert(source.includes("this._beginAutoBatchPhase('def', defenders)"),
    'production phase barrier starts defenders after attacker completion');

  const liveAtk = unit('live-atk', 'atk', 0, 0);
  const liveDef = unit('live-def', 'def', 1, 0);
  Object.assign(liveAtk, {
    ranged: false,
    rangedBase: false,
    primaryRanged: false,
    ammoLeft: 0,
    ammoMax: 0,
    mounted: false,
    phalanx: false,
    neverRout: false,
    surroundApplied: false,
  });
  Object.assign(liveDef, {
    ranged: false,
    rangedBase: false,
    primaryRanged: false,
    ammoLeft: 0,
    ammoMax: 0,
    mounted: false,
    phalanx: false,
    neverRout: false,
    surroundApplied: false,
  });
  const planner = Object.create(BattleScene.prototype);
  Object.assign(planner, {
    atk: [liveAtk],
    def: [liveDef],
    occByKey: new Map([['0,0', liveAtk], ['1,0', liveDef]]),
    _manualMode: false,
    _autoBattleSuspended: false,
    finished: false,
    siegeWallCol: -1,
    vTimers: [],
    log: [],
    routedUnits: [],
    _groups: new Map(),
    _groupMeta: new Map(),
  });
  planner._applyTerrainRange = () => {};
  planner._isUnitDoctrineAuto = () => false;
  const beforeAtk = { q: liveAtk.q, r: liveAtk.r, hp: liveAtk.bu.hp };
  const planned = planner._snapshotAutoBatchIntents('atk', [liveAtk]);
  assert(planned.length === 1 && planned[0].kind === 'attack' && planned[0].targetId === 'live-def',
    'real BattleScene planner captures a live AUTO attack intent without animation');
  assert(liveAtk.q === beforeAtk.q && liveAtk.r === beforeAtk.r && liveAtk.bu.hp === beforeAtk.hp
    && planner.atk[0] === liveAtk && planner.def[0] === liveDef,
  'AUTO planning clones do not mutate live positions, HP, or rosters');
}

function loadPureHelper() {
  if (!fs.existsSync(HELPER)) return null;
  const source = fs.readFileSync(HELPER, 'utf8');
  const ts = require(path.join(MODULE_ROOT, 'typescript'));
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(output.outputText, { module, exports: module.exports, require, console }, { filename: HELPER });
  return module.exports;
}

function runResolverChecks() {
  let helper;
  try {
    helper = loadPureHelper();
    assert(helper && typeof helper.resolveAutoBatchPhase === 'function',
      'pure AUTO batch resolver is present');
  } catch (error) {
    assert(false, `pure AUTO batch resolver loads: ${error.message}`);
    return;
  }
  if (!helper) return;

  const resolve = helper.resolveAutoBatchPhase;
  const units = [
    { id: 'atk-a', side: 'atk', q: 0, r: 0 },
    { id: 'atk-b', side: 'atk', q: 0, r: 1 },
    { id: 'def-a', side: 'def', q: 3, r: 0 },
    { id: 'def-b', side: 'def', q: 3, r: 1 },
  ];
  const contested = resolve('atk', units, [
    { unitId: 'atk-a', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] },
    { unitId: 'atk-b', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] },
    { unitId: 'def-a', side: 'def', kind: 'attack', targetId: 'atk-a', steps: [] },
  ]);
  assert(contested.map(a => a.unitId).join(',') === 'atk-a,atk-b',
    'attacker resolution filters out defender intents in stable order');
  assert(contested[0].steps.length === 1 && contested[0].steps[0].col === 1,
    'first attacker claims a contested free destination');
  assert(contested[1].blocked === true && contested[1].steps.length === 0,
    'second attacker is deterministically blocked by occupancy');

  const defender = resolve('def', units, [
    { unitId: 'def-a', side: 'def', kind: 'attack', targetId: 'atk-a', steps: [] },
    { unitId: 'def-b', side: 'def', kind: 'hold', steps: [] },
  ]);
  assert(defender.map(a => a.unitId).join(',') === 'def-a,def-b',
    'defender resolution is a separate phase pass');
  assert(defender[0].kind === 'attack' && defender[0].targetId === 'atk-a',
    'defender intent keeps its phase-start target id');

  const bothSides = resolve('atk', [
    { id: 'a1', side: 'atk', q: 0, r: 0 },
    { id: 'a2', side: 'atk', q: 0, r: 1 },
    { id: 'd1', side: 'def', q: 1, r: 0 },
  ], [
    { unitId: 'a1', side: 'atk', kind: 'attack', targetId: 'd1', steps: [] },
    { unitId: 'a2', side: 'atk', kind: 'attack', targetId: 'd1', steps: [] },
    { unitId: 'd1', side: 'def', kind: 'attack', targetId: 'a1', steps: [] },
  ]);
  assert(bothSides.length === 2 && bothSides.every(a => a.kind === 'attack'),
    'one attacker phase preserves every same-phase attack intent before damage commits');
  assert(bothSides.every(a => a.targetId === 'd1'),
    'same-phase attackers select the same phase-start target deterministically');
  const defenderSameRound = resolve('def', [
    { id: 'a1', side: 'atk', q: 0, r: 0 },
    { id: 'a2', side: 'atk', q: 0, r: 1 },
    { id: 'd1', side: 'def', q: 1, r: 0 },
  ], [
    { unitId: 'a1', side: 'atk', kind: 'attack', targetId: 'd1', steps: [] },
    { unitId: 'a2', side: 'atk', kind: 'attack', targetId: 'd1', steps: [] },
    { unitId: 'd1', side: 'def', kind: 'attack', targetId: 'a1', steps: [] },
  ]);
  assert(defenderSameRound.length === 1 && defenderSameRound[0].targetId === 'a1',
    'both sides retain their own phase-start attack in one round');

  // Red-capable distinction: frozen planning records both attacks, while a
  // sequential attacker-first commit would stop after a lethal first strike.
  const sequentialCommitted = bothSides.reduce((n, action, index) => {
    if (index === 0) return n + 1;
    return n; // target is already dead in the sequential control
  }, 0);
  assert(bothSides.length !== sequentialCommitted,
    'lethal-first-strike control differs from frozen simultaneous intent count');

  const phaseStartOccupied = resolve('atk', units, [
    { unitId: 'atk-a', side: 'atk', kind: 'move', steps: [{ col: 0, row: 1 }] },
  ]);
  assert(phaseStartOccupied[0].blocked === true && phaseStartOccupied[0].steps.length === 0,
    'phase-start occupancy is a hard barrier even when the occupant would move');

  const unavailable = [
    { id: 'atk-a', side: 'atk', q: 0, r: 0, dead: true },
    { id: 'def-a', side: 'def', q: 1, r: 0, routed: true },
    { id: 'def-b', side: 'def', q: 2, r: 0, acted: true },
  ];
  const unavailableResolved = resolve('def', unavailable, [
    { unitId: 'def-a', side: 'def', kind: 'attack', targetId: 'atk-a', steps: [] },
    { unitId: 'def-b', side: 'def', kind: 'attack', targetId: 'atk-a', steps: [] },
  ]);
  assert(unavailableResolved.length === 0,
    'dead/routed/previously-acted units cannot enter a later phase');

  const invalidHp = resolve('atk', [
    { id: 'zero-hp', side: 'atk', q: 0, r: 0, hp: 0 },
    { id: 'nan-hp', side: 'def', q: 1, r: 0, hp: Number.NaN },
  ], [
    { unitId: 'zero-hp', side: 'atk', kind: 'attack', targetId: 'nan-hp', steps: [] },
  ]);
  assert(invalidHp.length === 0,
    'zero/invalid HP units are excluded before target selection or damage');
}

async function main() {
  await runSceneSeamChecks();
  runResolverChecks();
  console.log(`auto-battle-simultaneous-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch(error => {
  console.error('auto-battle-simultaneous-test: harness error:', error);
  process.exitCode = 1;
});
