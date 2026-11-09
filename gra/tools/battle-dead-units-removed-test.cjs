'use strict';

/** Regression for R-WEB-BATTLE-DEAD-UNITS-NOT-REMOVED-FROM-FIELD-Q1.
 * Exercises the production BattleScene lifecycle methods with real BattleScene
 * code and scene/resource doubles. A killed unit must be detached immediately;
 * a routed unit must remain present and distinct until it exits the field.
 */
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-dead-units-removed-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub-browser-services', setup(build) {
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
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis,
    setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function makeUnit(id, side, q, r, hp, morale, fleeMorale) {
  const group = { visible: true, parent: {}, rotation: { y: 0 } };
  const hpBarGroup = { visible: true, parent: {} };
  return {
    bu: { id, nazwa: 'Wojownik-' + id, kategoria: 'miecznik', hp, maxHp: 100, stats: {} },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false,
    isArmyCommander: false, primaryRanged: false, acted: false, mounted: false,
    morale, fleeMorale, facing: 0, group, hpBarGroup,
    mats: [{ dispose() {} }], perTokenGeos: [{ dispose() {} }],
  };
}

function makeScene(BattleScene, units) {
  const removedFromScene = new Set();
  const scene = Object.create(BattleScene.prototype);
  const occ = new Map(units.map(u => [`${u.q},${u.r}`, u]));
  Object.assign(scene, {
    atk: units.filter(u => u.side === 'atk'), def: units.filter(u => u.side === 'def'),
    fadingUnits: [], occByKey: occ,
    scene: { remove(o) { removedFromScene.add(o); o.parent = null; } },
    log: [], routedUnits: [], _autoBatchPlanning: null,
    _sfxDeath() {}, _sfxRout() {}, _updateHpBar() {}, _updateMoraleBar() {},
    _pushClash() {}, _gainMorale() {}, _shakeAlliesOnLoss() {}, _boostEnemiesOnBreak() {},
    _removeCommanderMoraleBonus() {}, _disableManualIfCommanderLost() {},
    _checkMeleeScreenLost() {},
    _applyMoraleDamage(u, dmg) { u.morale -= 100 * dmg / u.bu.maxHp; if (u.morale <= u.fleeMorale) this._startRout(u); },
  });
  return { scene, removedFromScene };
}

async function main() {
  const BattleScene = await loadBattleScene();
  const alive = (scene, side) => scene[side].filter(u => !u.dead && !u.removed && !u.routed).length;

  // 1) Lethal blow on a unit that WOULD have broken morale: it must DIE (removed), not
  //    survive with hp=1 and flee with an empty bar (the reported bug).
  {
    const atk = makeUnit('a1', 'atk', 3, 3, 100, 100, 20);
    const def = makeUnit('d1', 'def', 4, 3, 0, 5, 40); // hp already 0 after the blow, morale about to break
    const { scene, removedFromScene } = makeScene(BattleScene, [atk, def]);
    scene._resolveBlowOutcome(atk, def, 30, 0);
    assert.strictEqual(def.bu.hp, 0, 'lethal blow must NOT revive the defender to hp=1');
    assert.strictEqual(def.dead, true, 'defender dead');
    assert.strictEqual(def.removed, true, 'defender removed from the field');
    assert.strictEqual(def.routed, false, 'killed unit is not a fleeing unit');
    assert.strictEqual(def.group.visible, false, 'model hidden');
    assert.strictEqual(def.hpBarGroup.visible, false, 'hp bar hidden');
    assert.ok(removedFromScene.has(def.group) && removedFromScene.has(def.hpBarGroup), 'detached from scene graph');
    assert.strictEqual(scene.occByKey.has('4,3'), false, 'tile released');
    assert.strictEqual(alive(scene, 'def'), 0, 'no living defenders left');
    assert.strictEqual(scene.routedUnits.length, 0, 'not recorded as routed');
  }

  // 2) Non-lethal blow breaking morale: still routs (separate rule), keeps its HP, stays visible.
  {
    const atk = makeUnit('a2', 'atk', 3, 3, 100, 100, 20);
    const def = makeUnit('d2', 'def', 4, 3, 60, 5, 40);
    const { scene } = makeScene(BattleScene, [atk, def]);
    scene._resolveBlowOutcome(atk, def, 10, 0);
    assert.strictEqual(def.routed, true, 'non-lethal morale break routs');
    assert.strictEqual(def.dead, false, 'routing unit is not dead');
    assert.strictEqual(def.removed, false, 'routing unit remains on field until it exits');
    assert.strictEqual(def.bu.hp, 60, 'routing unit keeps its HP');
    assert.strictEqual(def.group.visible, true);
  }

  // 3) Already routed unit hit down to 0 HP: dies and vanishes (no empty-bar runner left on field).
  {
    const atk = makeUnit('a3', 'atk', 3, 3, 100, 100, 20);
    const def = makeUnit('d3', 'def', 6, 3, 0, 0, 40);
    def.routed = true;
    const { scene, removedFromScene } = makeScene(BattleScene, [atk, def]);
    scene._resolveBlowOutcome(atk, def, 5, 0);
    assert.strictEqual(def.dead, true);
    assert.strictEqual(def.removed, true, 'routed unit at 0 HP is removed');
    assert.ok(removedFromScene.has(def.group) && removedFromScene.has(def.hpBarGroup));
  }

  // 4) neverRout unit at 0 HP dies as before; a healthy unit hit non-lethally is neither dead nor routed.
  {
    const atk = makeUnit('a4', 'atk', 3, 3, 100, 100, 20);
    const bers = makeUnit('d4', 'def', 4, 3, 0, 100, 0); bers.neverRout = true;
    const ok = makeUnit('d5', 'def', 4, 4, 70, 100, 20);
    const { scene } = makeScene(BattleScene, [atk, bers, ok]);
    scene._resolveBlowOutcome(atk, bers, 30, 0);
    scene._resolveBlowOutcome(atk, ok, 30, 0);
    assert.strictEqual(bers.removed, true, 'neverRout unit dies at 0 HP');
    assert.strictEqual(ok.removed || ok.dead || ok.routed, false, 'healthy unit stays');
    assert.strictEqual(alive(scene, 'def'), 1, 'exactly one defender alive (stack count consistent)');
  }

  // 5) Death helper itself (merge/wall paths): immediate, idempotent, no fade queue.
  {
    const u = makeUnit('x', 'atk', 1, 1, 0, 50, 20);
    const { scene } = makeScene(BattleScene, [u]);
    scene._startFade(u); scene._startFade(u);
    assert.ok(u.removed && u.dead && !u.fadingOut && scene.fadingUnits.length === 0);
  }

  console.log('battle-dead-units-removed-test: PASS — HP<=0 (also routed) removed at once; non-lethal rout kept');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
