'use strict';

/** Regression for R-BITWA-DEAD-UNIT-DISAPPEARS-Q1.
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
      resolveDir: ROOT, sourcefile: 'battle-dead-unit-disappearance-entry.ts',
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

function makeUnit(id, q, r) {
  const group = { visible: true, parent: {}, rotation: { y: 0 } };
  const hpBarGroup = { visible: true, parent: {} };
  let materialDisposeCount = 0;
  let geometryDisposeCount = 0;
  return {
    bu: { id, nazwa: 'Wojownik', kategoria: 'miecznik', hp: 0, maxHp: 100, stats: {} },
    q, r, side: 'atk', dead: false, fadingOut: false, removed: false,
    routed: false, isArmyCommander: false, primaryRanged: false, acted: false,
    group, hpBarGroup,
    mats: [{ dispose() { materialDisposeCount += 1; } }],
    perTokenGeos: [{ dispose() { geometryDisposeCount += 1; } }],
    disposedCounts: () => ({ materialDisposeCount, geometryDisposeCount }),
  };
}

function makeScene(BattleScene, unit) {
  const removedFromScene = new Set();
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk: [unit], def: [], fadingUnits: [],
    occByKey: new Map([[`${unit.q},${unit.r}`, unit]]),
    scene: { remove(object) { removedFromScene.add(object); object.parent = null; } },
    log: [], routedUnits: [], _autoBatchPlanning: null,
    _sfxDeath() {}, _sfxRout() {},
    _removeCommanderMoraleBonus() {}, _disableManualIfCommanderLost() {},
    _checkMeleeScreenLost() {}, _boostEnemiesOnBreak() {},
  });
  return { scene, removedFromScene };
}

async function main() {
  const BattleScene = await loadBattleScene();

  // Lethal path uses the same production helper invoked after a killing blow.
  const dead = makeUnit('dead-warrior', 4, 9);
  const death = makeScene(BattleScene, dead);
  death.scene._startFade(dead);
  assert.strictEqual(dead.dead, true, 'killed unit becomes dead immediately');
  assert.strictEqual(dead.removed, true, 'killed unit is removed from the scene immediately');
  assert.strictEqual(dead.fadingOut, false, 'death does not leave a visible fade corpse');
  assert.strictEqual(dead.group.visible, false, 'unit model is hidden');
  assert.strictEqual(dead.hpBarGroup.visible, false, 'unit health bar is hidden');
  assert.strictEqual(death.removedFromScene.has(dead.group), true, 'unit model detached from scene graph');
  assert.strictEqual(death.removedFromScene.has(dead.hpBarGroup), true, 'unit bar detached from scene graph');
  assert.strictEqual(death.scene.occByKey.has('4,9'), false, 'dead unit releases occupied battlefield tile');
  assert.deepStrictEqual(dead.disposedCounts(), { materialDisposeCount: 1, geometryDisposeCount: 1 },
    'dead unit model resources are disposed once');
  assert.strictEqual(death.scene.fadingUnits.length, 0, 'death is not queued for a delayed fade');

  // Morale collapse remains a visible flee and is not marked as a death.
  const routed = makeUnit('routed-warrior', 7, 12);
  routed.bu.hp = 73;
  const rout = makeScene(BattleScene, routed);
  rout.scene._startRout(routed);
  assert.strictEqual(routed.routed, true, 'morale break marks unit routed');
  assert.strictEqual(routed.dead, false, 'morale break is not a kill');
  assert.strictEqual(routed.removed, false, 'routed unit stays on the field while fleeing');
  assert.strictEqual(routed.group.visible, true, 'routed model remains visible while fleeing');
  assert.strictEqual(routed.hpBarGroup.visible, true, 'routed health bar remains visible until exit');
  assert.strictEqual(routed.bu.hp, 73, 'routed unit retains surviving HP');
  assert.strictEqual(rout.scene.occByKey.has('7,12'), false, 'routed unit frees its tile to let allies pass');
  assert.strictEqual(rout.scene.routedUnits.length, 1, 'routed unit remains recorded in routed roster');

  const source = require('fs').readFileSync(path.join(ROOT, 'src/battle/battleScene.ts'), 'utf8');
  const collapseStart = source.indexOf('// ZMIANA 5: obrońca na wyburzonym kaflu');
  const collapseEnd = source.indexOf('\n    this._updateSiegeWallVisuals', collapseStart);
  const collapsePath = source.slice(collapseStart, collapseEnd < 0 ? collapseStart + 1800 : collapseEnd);
  assert.match(collapsePath, /this\._startFade\(u\);/,
    'catapult destroyed by wall collapse uses the same immediate-death path');

  console.log('battle-dead-unit-disappearance-test: PASS — killed unit detached immediately; routed unit still flees visibly');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
