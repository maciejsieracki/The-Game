'use strict';

const assert = require('assert');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function loadRules() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'src', 'battle', 'formationRules.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require }, { filename: 'formationRules.ts' });
  return module.exports;
}

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: path.join(__dirname, '..'),
      sourcefile: 'battle-formation-entry.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stub-battle-browser-services',
      setup(build) {
        build.onResolve({ filter: /brandAssets/ }, () => ({ path: 'brand-assets-stub', namespace: 'brand-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'brand-stub' }, () => ({
          contents: 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";', loader: 'js',
        }));
        build.onResolve({ filter: /leaderPortraits/ }, () => ({ path: 'leader-stub', namespace: 'leader-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'leader-stub' }, () => ({
          contents: 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";', loader: 'js',
        }));
        build.onResolve({ filter: /muzyka-antyczna/ }, () => ({ path: 'audio-stub', namespace: 'audio-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'audio-stub' }, () => ({
          contents: 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};', loader: 'js',
        }));
      },
    }],
    write: false,
    logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

async function main() {
  const { initialBattleLineOrder, compactLineAllowsAdvance } = await loadRules();
  const roster = [
    { id: 'infantry', role: 'melee' },
    { id: 'catapult', role: 'siege' },
    { id: 'horse', role: 'mounted' },
    { id: 'archer', role: 'ranged' },
    { id: 'general', role: 'commander' },
    { id: 'chariot', role: 'mounted' },
  ];
  const ordered = Array.from(initialBattleLineOrder(roster, unit => unit.role, 12), unit => unit.id);
  assert.strictEqual(ordered.join(','), 'horse,general,archer,infantry,chariot,catapult');
  assert(ordered.indexOf('general') < ordered.indexOf('catapult'), 'commander joins the fighting line instead of remaining in the rear');
  assert(ordered.indexOf('horse') < ordered.indexOf('infantry'));
  assert(ordered.indexOf('chariot') < ordered.indexOf('catapult'));
  const crowded = [
    { id: 'cav-north', role: 'mounted' }, { id: 'cav-south', role: 'mounted' },
    ...Array.from({ length: 12 }, (_, i) => ({ id: `archer-${i}`, role: 'ranged' })),
  ];
  const crowdedOrder = Array.from(initialBattleLineOrder(crowded, unit => unit.role, 12), unit => unit.id);
  assert(crowdedOrder.indexOf('cav-north') < 12 && crowdedOrder.indexOf('cav-south') < 12,
    'both cavalry wings stay in the front rank when archers fill the line');

  assert.strictEqual(compactLineAllowsAdvance({
    side: 'atk', candidateCol: 11, lineMinimumProgress: 10, previousLineMinimumProgress: null,
  }), true, 'Attack lets a rank advance one step with its lagging unit');
  assert.strictEqual(compactLineAllowsAdvance({
    side: 'atk', candidateCol: 12, lineMinimumProgress: 10, previousLineMinimumProgress: null,
  }), false, 'Attack prevents one unit from running ahead of its rank');
  assert.strictEqual(compactLineAllowsAdvance({
    side: 'atk', candidateCol: 10, lineMinimumProgress: 10, previousLineMinimumProgress: 9,
  }), false, 'a rear rank cannot overtake the preceding rank');
  assert.strictEqual(compactLineAllowsAdvance({
    side: 'def', candidateCol: 10, lineMinimumProgress: -10, previousLineMinimumProgress: null,
  }), true, 'defender progress is mirrored toward decreasing columns');
  assert.strictEqual(compactLineAllowsAdvance({
    side: 'def', candidateCol: 8, lineMinimumProgress: -10, previousLineMinimumProgress: null,
  }), false, 'defender cannot run ahead of the aligned line');

  const scene = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts'), 'utf8');
  assert.match(scene, /if \(manhattan\(ru\.q, ru\.r, e\.q, e\.r\) <= ru\.range\) \{ this\._rangedAction\(ru, done\); return; \}/,
    'ranged units fire on the same activation that puts them in range');
  assert.match(scene, /this\._effectiveMetaForUnit\(ru\)\.doctrine !== 'steady'/,
    'line pacing applies to Attack doctrine while Charge retains the prior movement path');
  assert.strictEqual((scene.match(/initialBattleLineOrder\(units,/g) || []).length, 2,
    'the same initial line layout is used for battle setup and deploy reset');

  const BattleScene = await loadBattleScene();
  const fakeScene = Object.create(BattleScene.prototype);
  const enemy = { q: 8, r: 0, dead: false, fadingOut: false, routed: false };
  const archer = { q: 0, r: 0, side: 'atk', range: 3, moveLeft: 1, dead: false, fadingOut: false };
  let shots = 0;
  let finished = false;
  fakeScene.finished = false;
  fakeScene._effectiveMetaForUnit = unit => ({ doctrine: unit.doctrine });
  const attackLeader = { q: 10, r: 0, side: 'atk', formationRank: 0, mounted: false, doctrine: 'steady', bu: { stats: {} } };
  const attackMate = { q: 10, r: 1, side: 'atk', formationRank: 0, mounted: false, doctrine: 'steady', bu: { stats: {} } };
  fakeScene.atk = [attackLeader, attackMate];
  fakeScene.def = [];
  assert.strictEqual(BattleScene.prototype._compactAttackAllowsStep.call(fakeScene, attackLeader, 12), false,
    'Attack stops one infantry unit from overtaking its aligned rank');
  attackLeader.doctrine = 'aggressive';
  assert.strictEqual(BattleScene.prototype._compactAttackAllowsStep.call(fakeScene, attackLeader, 15), true,
    'Charge retains its free advance and flanking path');
  fakeScene._nearestEnemy = () => enemy;
  fakeScene._bestForwardStep = () => '6,0';
  fakeScene._compactAttackAllowsStep = () => true;
  fakeScene._doMove = (unit, q, r, done) => { unit.q = q; unit.r = r; unit.moveLeft -= 1; done(); };
  fakeScene._rangedAction = (_unit, done) => { shots += 1; done(); };
  BattleScene.prototype._rangedForwardStep.call(fakeScene, archer, () => { finished = true; });
  assert.strictEqual(shots, 1, 'ranged attacker fires as soon as its opening move enters range');
  assert.strictEqual(finished, true, 'opening ranged action completes on the first turn without a second start');
  console.log('PASS: front ranks, mounted wings, Attack line pacing, and same-activation ranged fire');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
