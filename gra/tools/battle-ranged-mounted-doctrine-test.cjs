'use strict';
/** Focused regressions for ranged and mounted action dispatch in group doctrines. */
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = process.env.THE_GAME_NODE_MODULES || path.join(ROOT, 'node_modules');
const esbuild = require(path.join(MODULE_ROOT, 'esbuild'));

async function loadBattleScene() {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT,
      sourcefile: 'battle-ranged-mounted-doctrine-entry.ts',
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
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function makeUnit({ id, mounted = false, ranged = false, side = 'atk', q = 3, r = 3 }) {
  return {
    bu: { id, nazwa: id, kategoria: mounted ? 'Rydwan' : ranged ? 'Łucznik' : 'Wojownik', stats: {}, hp: 50 },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    mounted, rangedBase: ranged, primaryRanged: ranged, ranged, range: ranged ? 4 : 1,
    shootingEnabled: true, ammoLeft: ranged ? 5 : 0, ammoMax: ranged ? 5 : 0,
    moveLeft: 1, acted: false, playerOrder: { type: 'none' },
  };
}

async function main() {
  const BattleScene = await loadBattleScene();
  const checks = [];
  const check = (condition, label) => { checks.push(Boolean(condition)); console.log(`  ${condition ? 'PASS' : 'FAIL'} ${label}`); };

  // Defense holds its line but ranged units still fire at enemies in weapon range.
  const defender = makeUnit({ id: 'defender-archer', ranged: true, q: 4, r: 4 });
  const target = makeUnit({ id: 'target', side: 'def', q: 7, r: 4 });
  const defense = Object.create(BattleScene.prototype);
  Object.assign(defense, { finished: false, atk: [defender], def: [target] });
  let defenseShot = null;
  defense._pickRangedTargetByPriority = () => target;
  defense._pickAdjacentTargetByPriority = () => null;
  defense._doAttack = (_attacker, victim, done) => { defenseShot = victim; done(); };
  let defenseDone = false;
  BattleScene.prototype._executeGroupDoctrineStep.call(
    defense, defender, { doctrine: 'defensive', autoPlay: true }, () => { defenseDone = true; },
  );
  check(defenseShot === target && defenseDone,
    'Obrona lets an in-range archer shoot without leaving its position');
  check(defender.q === 4 && defender.r === 4,
    'defensive ranged attack preserves the unit position');

  // Attack has separate roles: a shooter fires when in range; while out of
  // range it uses the ranged lane advance, not the infantry contact path.
  const attackArcher = makeUnit({ id: 'attack-archer', ranged: true, q: 4, r: 4 });
  const attackTarget = makeUnit({ id: 'attack-target', side: 'def', q: 7, r: 4 });
  const rangedAttack = Object.create(BattleScene.prototype);
  Object.assign(rangedAttack, { finished: false, atk: [attackArcher], def: [attackTarget] });
  let attackArcherShot = null;
  let attackArcherMoveCalls = 0;
  rangedAttack._pickRangedTargetByPriority = () => attackTarget;
  rangedAttack._pickAdjacentTargetByPriority = () => null;
  rangedAttack._doctrineMoveDest = () => { attackArcherMoveCalls++; return { col: 6, row: 4 }; };
  rangedAttack._performPlayerOrder = () => { attackArcherMoveCalls++; return true; };
  rangedAttack._doAttack = (_attacker, victim, done) => { attackArcherShot = victim; done(); };
  BattleScene.prototype._executeGroupDoctrineStep.call(
    rangedAttack, attackArcher, { doctrine: 'steady', autoPlay: true }, () => {},
  );
  check(attackArcherShot === attackTarget && attackArcherMoveCalls === 0,
    'Atak archer fires in range and does not retreat or keep marching past a valid shot');

  const approachingArcher = makeUnit({ id: 'approaching-archer', ranged: true, q: 4, r: 5 });
  const distant = makeUnit({ id: 'distant-target', side: 'def', q: 11, r: 5 });
  const approach = Object.create(BattleScene.prototype);
  Object.assign(approach, { finished: false, atk: [approachingArcher], def: [distant] });
  let approachAdvanced = false;
  approach._advanceStep = (_unit, done) => { approachAdvanced = true; done(); };
  let rangedApproachCalled = false;
  approach._rangedAction = (_unit, done) => { rangedApproachCalled = true; done(); };
  approach._pickRangedTargetByPriority = () => null;
  approach._pickAdjacentTargetByPriority = () => null;
  BattleScene.prototype._executeGroupDoctrineStep.call(
    approach, approachingArcher, { doctrine: 'steady', autoPlay: true, rallyCol: 5, rallyRow: 5 }, () => {},
  );
  check(rangedApproachCalled && !approachAdvanced,
    'Out-of-range Atak archer uses ranged approach and does not route around the infantry line');

  // Attack keeps infantry-line movement, but mounted units use the established
  // cavalry/chariot target and flank planner instead of generic rally movement.
  const chariot = makeUnit({ id: 'attack-chariot', mounted: true, q: 4, r: 2 });
  const attack = Object.create(BattleScene.prototype);
  Object.assign(attack, { finished: false, atk: [chariot], def: [target] });
  let cavalryCalls = 0;
  let genericMovementCalls = 0;
  attack._cavalryAction = (_unit, done) => { cavalryCalls++; done(); };
  attack._pickRangedTargetByPriority = () => null;
  attack._pickAdjacentTargetByPriority = () => null;
  attack._doctrineMoveDest = () => { genericMovementCalls++; return { col: 6, row: 2 }; };
  attack._performPlayerOrder = () => { genericMovementCalls++; return true; };
  attack._refreshQueuedOrderVisuals = () => {};
  let attackDone = false;
  BattleScene.prototype._executeGroupDoctrineStep.call(
    attack, chariot, { doctrine: 'steady', autoPlay: true }, () => { attackDone = true; },
  );
  check(cavalryCalls === 1 && attackDone,
    'Atak routes cavalry/chariots through the existing cavalry action planner');
  check(genericMovementCalls === 0,
    'Atak mounted units do not get trapped in the generic infantry formation-rally movement');

  // Defense keeps a mounted reserve in place when no enemy is adjacent.
  const reserveChariot = makeUnit({ id: 'defense-chariot', mounted: true, q: 4, r: 2 });
  const defenseMounted = Object.create(BattleScene.prototype);
  Object.assign(defenseMounted, { finished: false, atk: [reserveChariot], def: [target] });
  defenseMounted._pickAdjacentTargetByPriority = () => null;
  let defenseMountedMoved = false;
  defenseMounted._doMove = () => { defenseMountedMoved = true; };
  let defenseMountedDone = false;
  BattleScene.prototype._executeGroupDoctrineStep.call(
    defenseMounted, reserveChariot, { doctrine: 'defensive', autoPlay: true },
    () => { defenseMountedDone = true; },
  );
  check(defenseMountedDone && !defenseMountedMoved,
    'Obrona keeps a non-adjacent mounted reserve in position');

  // Szturm still uses role-specific combat: ranged troops shoot a valid target,
  // and mounted units go through the cavalry maneuver planner.
  const chargeArcher = makeUnit({ id: 'charge-archer', ranged: true, q: 4, r: 4 });
  const chargeTarget = makeUnit({ id: 'charge-target', side: 'def', q: 7, r: 4 });
  const rangedCharge = Object.create(BattleScene.prototype);
  Object.assign(rangedCharge, { finished: false, atk: [chargeArcher], def: [chargeTarget] });
  let chargeArcherShot = null;
  rangedCharge._pickRangedTargetByPriority = () => chargeTarget;
  rangedCharge._doAttack = (_unit, victim, done) => { chargeArcherShot = victim; done(); };
  rangedCharge._pickAdjacentTargetByPriority = () => null;
  BattleScene.prototype._executeGroupDoctrineStep.call(
    rangedCharge, chargeArcher, { doctrine: 'aggressive', autoPlay: true }, () => {},
  );
  check(chargeArcherShot === chargeTarget,
    'Szturm keeps ranged attacks active when an enemy is already in range');

  const chargeChariot = makeUnit({ id: 'charge-chariot', mounted: true, q: 4, r: 2 });
  const mountedCharge = Object.create(BattleScene.prototype);
  Object.assign(mountedCharge, { finished: false, atk: [chargeChariot], def: [target] });
  let chargeCavalryCalls = 0;
  mountedCharge._cavalryAction = (_unit, done) => { chargeCavalryCalls++; done(); };
  BattleScene.prototype._executeGroupDoctrineStep.call(
    mountedCharge, chargeChariot, { doctrine: 'aggressive', autoPlay: true }, () => {},
  );
  check(chargeCavalryCalls === 1,
    'Szturm sends mounted units through the cavalry maneuver planner');

  console.log(`\nMounted/ranged doctrine regression: ${checks.filter(Boolean).length}/${checks.length}`);
  if (checks.some(ok => !ok)) process.exitCode = 1;
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
