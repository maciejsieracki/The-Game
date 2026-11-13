'use strict';
/**
 * Targeted AUTO doctrine evaluation through the current BattleScene prototype.
 * Uses a deterministic animation/terrain seam; the production turn kickoff,
 * doctrine, snapshot planner, and path-resolution methods remain under test.
 * Run from gra/: node tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs
 */
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = process.env.THE_GAME_NODE_MODULES || path.join(ROOT, 'node_modules');
const esbuild = require(path.join(MODULE_ROOT, 'esbuild'));
const SCENE = path.join(ROOT, 'src/battle/battleScene.ts');

let passed = 0;
let failed = 0;
function assert(ok, message) {
  if (ok) { passed++; console.log('  [OK]', message); }
  else { failed++; console.error('  [FAIL]', message); }
}

async function loadBattleScene() {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT,
      sourcefile: 'bitwa-auto-atak-wielojednostkowy-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(MODULE_ROOT, 'three/build/three.cjs') },
    plugins: [{ name: 'stub-nonlogic-battle-assets', setup(build) {
      const entries = [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ];
      for (const [filter, namespace, contents] of entries) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: SCENE });
  return module.exports.BattleScene;
}

function unit(id, side, q, r, role, groupId = null, formationOffset = null, doctrine = null) {
  const ranged = role === 'archer';
  return {
    bu: {
      id, nazwa: id,
      kategoria: ranged ? 'Łucznik' : 'Wojownik',
      stats: { 'Ruch w bitwie (heksy)': 1 }, hp: 100, maxHp: 100,
    },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    acted: false, moveLeft: 1, morale: 100, moraleMax: 100,
    groupId, formationOffset, unitDoctrine: doctrine,
    playerOrder: { type: 'none' }, primaryRanged: ranged, rangedBase: ranged,
    ranged, range: ranged ? 3 : 1, ammoLeft: 0, ammoMax: 0, shootingEnabled: false,
    mounted: false, siege: false, onWallWalkway: false, surroundApplied: false,
    neverRout: false, attackDirection: 'front',
  };
}

function sceneFixture(BattleScene, atk, def, meta = {}) {
  const all = [...atk, ...def];
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk, def,
    occByKey: new Map(all.map(ru => [`${ru.q},${ru.r}`, ru])),
    started: true, finished: false, busy: false, deployPhase: false,
    _manualMode: false, _battleAwaitingOrders: false, _autoBattleSuspended: false,
    _queuedOrderUnitIds: new Set(), _selectedUnits: new Set(), _autoBatchPlanning: null,
    _autoBatchPhase: null, _autoBatchResolutions: [], _autoBatchPending: 0, _autoBatchToken: 0,
    siegeWallCol: -1, roundNo: 0, turnOrder: [], turnIdx: 0,
    _counterBudget: { beginTurn() {} }, vTimers: [], log: [], routedUnits: [],
    _groups: new Map(), _groupMeta: new Map(),
    _targetPriorities: { mounted: ['mounted', 'ranged', 'melee'], ranged: ['ranged', 'mounted', 'melee'], melee: ['melee', 'ranged', 'mounted'] },
    terrainMap: { at: () => 'plains' },
    _manualBtn: null, _orderLinesGroup: null, _rosterBar: null, hint: { textContent: '' },
  });
  for (const ru of all) if (ru.groupId) {
    if (!scene._groups.has(ru.groupId)) scene._groups.set(ru.groupId, new Set());
    scene._groups.get(ru.groupId).add(ru.bu.id);
  }
  for (const [gid, groupMeta] of Object.entries(meta)) scene._groupMeta.set(gid, groupMeta);
  for (const name of [
    '_updateStallWatch', '_updateBattlePhaseBanner', '_applyTerrainRange', '_updateFacing',
    '_refreshQueuedOrderVisuals', '_disposeQueuedOrderArrows', '_clearAllSelection',
  ]) scene[name] = () => {};
  scene._playerRoster = () => scene.atk;
  scene._enemyRoster = () => scene.def;
  scene._findUnitById = id => all.find(ru => ru.bu.id === id) || null;
  scene._checkEnd = () => false;
  scene._movementPointsFor = () => 1;
  scene._moveCostForUnit = () => 1;
  scene._passableForUnit = () => true;
  scene._destAllowedByBlockade = () => true;
  scene._isFordTile = () => false;
  scene._refreshQueuedOrderVisuals = () => {};
  scene._launchAutoBatchResolution = resolution => scene.testIntents.push(resolution);
  scene.testIntents = [];
  return scene;
}

function commitResolution(scene, units, resolutions) {
  // Keep the production collision and path resolver; replace only the visual
  // animation commit with a deterministic position/occupancy update.
  scene._doMove = (ru, col, row, done) => {
    scene.occByKey.delete(`${ru.q},${ru.r}`);
    ru.q = col;
    ru.r = row;
    scene.occByKey.set(`${col},${row}`, ru);
    done();
  };
  for (const resolution of resolutions) {
    const ru = units.find(candidate => candidate.bu.id === resolution.unitId);
    if (ru) scene._resolveAutoBatchMovement(ru, resolution, 0, () => {});
  }
}

(async () => {
  const BattleScene = await loadBattleScene();
  assert(typeof BattleScene === 'function', 'current candidate BattleScene prototype bundles');

  // Atak line: infantry occupies the front tile; archers are one tile behind,
  // with matching row and formation offsets. The archer's first step collides
  // with the currently occupied infantry tile and must wait instead of sidestep.
  const infantry = unit('infantry', 'atk', 3, 3, 'melee', 'front', { dc: 0, dr: 0 });
  infantry.formationRank = 0;
  const archer = unit('archer', 'atk', 2, 3, 'archer', 'front', { dc: -1, dr: 0 });
  archer.formationRank = 1;
  const distantEnemy = unit('distant-enemy', 'def', 12, 3, 'melee');
  const attack = sceneFixture(BattleScene, [infantry, archer], [distantEnemy], {
    front: { doctrine: 'steady', autoPlay: true, formation: 'F1', rallyCol: 10, rallyRow: 3 },
  });
  attack._canAttackFrom = () => false;
  attack._pickRangedTargetByPriority = () => null;
  attack._pickAdjacentTargetByPriority = () => null;
  attack._beginAutoBatchPhase('atk', attack.atk);
  const attackRound1 = [...attack.testIntents];
  assert(attackRound1.find(i => i.unitId === 'infantry')?.kind === 'move'
    && attackRound1.find(i => i.unitId === 'infantry')?.steps[0]?.col === 4,
  'Atak moves the front infantry one forward tile');
  assert(attackRound1.find(i => i.unitId === 'archer')?.kind === 'hold',
    'Atak keeps the archer behind infantry when the front tile is occupied');
  assert(attackRound1.find(i => i.unitId === 'archer')?.steps.length === 0,
    'Blocked Atak archer does not take a lateral detour or overtake');
  commitResolution(attack, attack.atk, attackRound1);
  assert(infantry.q === 4 && archer.q === 2 && infantry.r === archer.r,
    'After first attack step, infantry leads and archer remains behind in same lane');

  attack.testIntents.length = 0;
  attack._beginAutoBatchPhase('atk', attack.atk);
  const attackRound2 = [...attack.testIntents];
  assert(attackRound2.find(i => i.unitId === 'archer')?.kind === 'move'
    && attackRound2.find(i => i.unitId === 'archer')?.steps[0]?.col === 3,
  'Atak advances the archer into the tile vacated by the infantry on the next step');
  commitResolution(attack, attack.atk, attackRound2);
  assert(infantry.q === 4 && archer.q === 3 && infantry.r === archer.r,
    'Second attack step preserves infantry lead and ranged rear rank without sideways movement');

  // Defense with a non-adjacent enemy.
  const defender = unit('defender', 'atk', 4, 5, 'melee', 'def', { dc: 0, dr: 0 });
  const farEnemy = unit('far-enemy', 'def', 11, 5, 'melee');
  const defense = sceneFixture(BattleScene, [defender], [farEnemy], {
    def: { doctrine: 'defensive', autoPlay: true, formation: 'F2' },
  });
  defense._pickAdjacentTargetByPriority = () => null;
  defense._beginAutoBatchPhase('atk', defense.atk);
  const defenseResolution = defense.testIntents[0];
  assert(defenseResolution?.kind === 'hold' && defenseResolution.steps.length === 0,
    'Obrona holds without an adjacent enemy');

  // Szturm: two attackers should independently resolve the nearest of two
  // targets and take the first step returned by the production charge planner
  // and its unmodified BFS implementation.
  const chargerA = unit('charger-a', 'atk', 1, 2, 'melee', null, null, 'aggressive');
  const chargerB = unit('charger-b', 'atk', 10, 8, 'melee', null, null, 'aggressive');
  const enemyA = unit('enemy-a', 'def', 4, 2, 'melee');
  const enemyB = unit('enemy-b', 'def', 8, 8, 'melee');
  const enemyC = unit('enemy-c', 'def', 10, 3, 'melee');
  const charge = sceneFixture(BattleScene, [chargerA, chargerB], [enemyA, enemyB, enemyC]);
  // Exercise the production target selector and the full Szturm destination
  // method. The fixture keeps the nearest target as the unique shortest BFS
  // destination, so a step toward a different enemy cannot satisfy the checks.
  const targetA = charge._pickTargetByPriority(chargerA);
  const targetB = charge._pickTargetByPriority(chargerB);
  const destA = charge._chargeMoveDest(chargerA);
  const destB = charge._chargeMoveDest(chargerB);
  assert(targetA?.bu.id === 'enemy-a', 'Production Szturm target selector chooses attacker A nearest enemy');
  assert(targetB?.bu.id === 'enemy-b', 'Production Szturm target selector chooses attacker B different nearest enemy');
  assert(destA?.col === 2 && destA?.row === 2 && destB?.col === 9 && destB?.row === 8,
    'Production _chargeMoveDest returns independent first steps toward each selected Szturm target');
  assert(Math.abs(destA.col - targetA.q) + Math.abs(destA.row - targetA.r)
      < Math.abs(chargerA.q - targetA.q) + Math.abs(chargerA.r - targetA.r)
    && Math.abs(destB.col - targetB.q) + Math.abs(destB.row - targetB.r)
      < Math.abs(chargerB.q - targetB.q) + Math.abs(chargerB.r - targetB.r),
  'Each production Szturm destination strictly reduces distance to that attacker’s selected target');

  console.log(`\nCurrent-candidate AUTO multi-unit evaluation: ${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
