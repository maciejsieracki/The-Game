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
  const { classifyInitialBattleRole, initialBattleFormation, initialBattleSlots, compactLineAllowsAdvance } = await loadRules();
  const roster = [
    { id: 'infantry', category: 'miecznik', name: 'Wojownik' },
    { id: 'javelin', category: 'oszczepnik', name: 'Oszczepnik' },
    { id: 'slinger', category: 'procarz', name: 'Procarz' },
    { id: 'catapult', category: 'maszyna', name: 'Katapulta', type: 'Siege' },
    { id: 'horse', category: 'konnica', name: 'Jeździec' },
    { id: 'archer', category: 'lucznik', name: 'Łucznik' },
    { id: 'general', category: 'dowodca', name: 'Wódz', commander: true },
    { id: 'chariot', category: 'rydwan', name: 'Rydwan (woły)' },
  ];
  const roleOf = unit => classifyInitialBattleRole(unit);
  assert.deepStrictEqual(roster.map(roleOf), [
    'melee', 'javelin', 'slinger', 'siege', 'mounted', 'archer', 'commander', 'mounted',
  ], 'the production role classifier recognizes BattleUnit-like categories, names, types, and commanders');
  assert.strictEqual(classifyInitialBattleRole({ category: 'jednostka', name: 'Łucznik egipski' }), 'archer',
    'name fallback normalizes Polish diacritics for an archer with a generic category');
  assert.strictEqual(classifyInitialBattleRole({ category: 'jednostka', name: 'Jeździec konny' }), 'mounted',
    'name fallback classifies mounted units even when the source category is generic');
  assert.strictEqual(classifyInitialBattleRole({ category: 'jednostka', name: 'Wieża oblężnicza' }), 'siege',
    'name fallback normalizes Polish diacritics for siege units with generic categories');
  assert.strictEqual(classifyInitialBattleRole({ category: 'jednostka', name: 'Lekki strzelec', primaryRanged: true }), 'ranged',
    'generic ranged units retain a ranged band when the production shooter predicate identifies them');
  const formation = initialBattleFormation(roster, roleOf);
  const slots = initialBattleSlots(formation, { rankWidth: 20, midRow: 78, playRow0: 23, playRow1: 132 });
  const slotById = new Map(slots.map(slot => [slot.unit.id, slot]));
  assert.strictEqual(slotById.get('infantry').rank, 0, 'infantry holds the forward rank');
  assert.strictEqual(slotById.get('javelin').rank, 1, 'javelins form the second rank');
  assert.strictEqual(slotById.get('archer').rank, 2, 'archers form the third rank');
  assert.strictEqual(slotById.get('slinger').rank, 3, 'slingers form the fourth rank');
  assert.strictEqual(slotById.get('catapult').rank, 4, 'siege sits behind ranged troops');
  assert.strictEqual(slotById.get('general').rank, 5, 'commander remains behind siege');
  assert.strictEqual(slotById.get('horse').rank, 0);
  assert.strictEqual(slotById.get('chariot').rank, 0);
  assert(slotById.get('horse').row < 68 && slotById.get('chariot').row > 88,
    'mounted units occupy opposite outer wings');

  const crowded = [
    ...Array.from({ length: 45 }, (_, i) => ({ id: `inf-${i}`, category: 'miecznik', name: `Wojownik ${i}` })),
    { id: 'javelin-line', category: 'oszczepnik', name: 'Oszczepnik' },
    { id: 'archer-line', category: 'lucznik', name: 'Łucznik' },
    { id: 'slinger-line', category: 'procarz', name: 'Procarz' },
    ...Array.from({ length: 500 }, (_, i) => ({ id: `cav-${i}`, category: 'konnica', name: `Jeździec ${i}` })),
  ];
  const crowdedFormation = initialBattleFormation(crowded, roleOf);
  const crowdedSlots = initialBattleSlots(crowdedFormation, { rankWidth: 20, midRow: 78, playRow0: 23, playRow1: 132 });
  const crowdedById = new Map(crowdedSlots.map(slot => [slot.unit.id, slot]));
  assert.strictEqual(crowdedById.get('inf-44').rank, 2, 'large infantry roster fills its own ranks first');
  assert.strictEqual(crowdedById.get('javelin-line').rank, 3, 'next role begins behind infantry overflow');
  const mounted = crowdedSlots.filter(slot => roleOf(slot.unit) === 'mounted');
  assert.strictEqual(mounted.length, 500, 'large mounted roster is fully assigned');
  assert(mounted.every(slot => slot.rank >= 0 && (slot.row < 68 || slot.row > 88)),
    'large cavalry/chariot rosters remain on the wings and are not squeezed into the center ranks');
  assert.strictEqual(new Set(crowdedSlots.map(slot => `${slot.rank}:${slot.row}`)).size, crowdedSlots.length,
    'large deployment has no duplicate planned slots');

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
  assert.match(scene, /function initialBattleRoleOf\(bu: BattleUnit\): InitialBattleRole \{\s*const stats = \(bu\.stats as Record<string, unknown>\) \?\? \{\};\s*return classifyInitialBattleRole\(\{/,
    'production BattleUnit adapter delegates role selection to the tested classifier');
  assert.match(scene, /if \(manhattan\(ru\.q, ru\.r, e\.q, e\.r\) <= ru\.range\) \{ this\._rangedAction\(ru, done\); return; \}/,
    'ranged units fire on the same activation that puts them in range');
  assert.match(scene, /this\._effectiveMetaForUnit\(ru\)\.doctrine !== 'steady'/,
    'line pacing applies to Attack doctrine while Charge retains the prior movement path');
  assert.strictEqual((scene.match(/initialBattleSlots\(formation,/g) || []).length, 2,
    'the same role-based initial slot layout is used for battle setup and deploy reset');
  assert.strictEqual((scene.match(/const mountedWing = initialBattleRoleOf\(bu\) === 'mounted';/g) || []).length, 2,
    'terrain/collision fallback keeps mounted units inside wing bands in setup and deploy reset');

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
