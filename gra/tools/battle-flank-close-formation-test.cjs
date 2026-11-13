'use strict';

const assert = require('assert');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function loadRules() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'src', 'battle', 'formationRules.ts')],
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require }, { filename: 'formationRules.ts' });
  return module.exports;
}

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: path.join(__dirname, '..'), sourcefile: 'battle-flank-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stub-battle-browser-services',
      setup(build) {
        const stubs = [
          [/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";'],
          [/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";'],
          [/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};'],
        ];
        for (const [filter, contents] of stubs) {
          const namespace = `battle-stub-${stubs.indexOf(stubs.find(item => item[0] === filter))}`;
          build.onResolve({ filter }, () => ({ path: namespace, namespace }));
          build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
        }
      },
    }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function makeRoster({ infantry = 20, ranged = 8, mounted = 6, commander = true }) {
  return [
    ...Array.from({ length: infantry }, (_, i) => ({ id: `inf-${i}`, role: 'infantry' })),
    ...Array.from({ length: ranged }, (_, i) => ({ id: `range-${i}`, role: 'archer' })),
    ...Array.from({ length: mounted }, (_, i) => ({ id: `mount-${i}`, role: 'mounted' })),
    ...(commander ? [{ id: 'leader', role: 'commander' }] : []),
  ];
}

async function main() {
  const { classifyInitialBattleRole, initialBattleFormation, initialBattleSlots } = await loadRules();
  const roleOf = unit => unit.role;
  const boundsCases = [
    { rankWidth: 4, midRow: 40, playRow0: 10, playRow1: 70, meleeLines: 1, archerLines: 1 },
    { rankWidth: 20, midRow: 78, playRow0: 23, playRow1: 132, meleeLines: 1, archerLines: 1 },
    { rankWidth: 35, midRow: 80, playRow0: 12, playRow1: 148, meleeLines: 1, archerLines: 1 },
  ];
  let checks = 0;
  for (const bounds of boundsCases) {
    const rosters = [
      makeRoster({ mounted: 2 }),
      makeRoster({ infantry: 35, ranged: 20, mounted: 12 }),
      makeRoster({ infantry: 0, ranged: 0, mounted: 10, commander: false }),
      makeRoster({ infantry: 45, ranged: 15, mounted: 80 }),
    ];
    for (const roster of rosters) {
      const formation = initialBattleFormation(roster, roleOf);
      const slots = initialBattleSlots(formation, bounds);
      assert.strictEqual(slots.length, roster.length, 'every unit gets a slot');
      checks++;
      assert.strictEqual(new Set(slots.map(slot => `${slot.rank}:${slot.row}`)).size, slots.length,
        'the roster has no colliding planned slots');
      checks++;
      const core = slots.filter(slot => slot.unit.role !== 'mounted');
      const cavalry = slots.filter(slot => slot.unit.role === 'mounted');
      const coreRows = core.length ? core.map(slot => slot.row) : [bounds.midRow];
      const minCore = Math.min(...coreRows);
      const maxCore = Math.max(...coreRows);
      const wingLimit = Math.min(5, Math.floor(bounds.rankWidth / 2) + 1);
      for (const slot of cavalry) {
        assert(slot.row >= bounds.playRow0 + 1 && slot.row <= bounds.playRow1 - 1,
          'mounted unit remains inside the playable battlefield margin');
        checks++;
        const onUpperFlank = slot.row < minCore;
        const onLowerFlank = slot.row > maxCore;
        assert(onUpperFlank || onLowerFlank,
          'mounted unit is outside the main body rather than mixed into its center');
        checks++;
        const gap = onUpperFlank ? minCore - slot.row : slot.row - maxCore;
        assert(gap <= wingLimit, `mounted unit is close to the main formation (${gap} rows)`);
        checks++;
      }
      // The production scene applies the same row slots to both armies and
      // offsets rank depth in opposite directions for attacker and defender.
      for (const side of ['atk', 'def']) {
        const mapped = cavalry.map(slot => ({
          col: (side === 'atk' ? 28 : 34) + slot.rank * (side === 'atk' ? -1 : 1),
          row: slot.row,
        }));
        assert(mapped.every(slot => slot.row >= bounds.playRow0 + 1 && slot.row <= bounds.playRow1 - 1),
          `${side} mounted units retain the same bounded flank layout`);
        checks++;
      }
    }
  }

  // Audit the production deployment row-count path as well. A homogeneous
  // archer band stays in the requested one rank even when individual units
  // have different reaches. A distinct javelin band remains an intentional
  // second role band; it is not a split of the homogeneous archer rank.
  const BattleScene = await loadBattleScene();
  const linePlanner = Object.create(BattleScene.prototype);
  linePlanner._deployArcherLines = 1;
  linePlanner._deployMeleeLines = 1;
  const rangedUnit = (id, category, reach) => ({
    bu: {
      id, nazwa: category === 'oszczepnik' ? 'Oszczepnik' : 'Łucznik', kategoria: category,
      stats: { 'Jednostka': category === 'oszczepnik' ? 'Oszczepnik' : 'Łucznik', 'Atak dystansowy': 5, 'Zasięg ataku (hex)': reach },
    },
    mounted: false,
  });
  const homogeneousArchers = [2, 3, 2, 3, 4].map((reach, i) => rangedUnit(`archer-${i}`, 'lucznik', reach));
  const homogeneousPlan = linePlanner._deployFormationPlan(homogeneousArchers, 'F2', 'flanks');
  assert.strictEqual(homogeneousPlan.main.length, 1, 'same ranged unit category stays in one formation band');
  checks++;
  const archerRanks = linePlanner._splitUnitsIntoRanks(
    homogeneousPlan.main[0].units, linePlanner._deployLinesForRole(homogeneousPlan.main[0].role),
  );
  assert.strictEqual(archerRanks.length, 1, 'selected one archer line remains one row across mixed reaches');
  checks++;
  const mixedRanged = [
    ...Array.from({ length: 3 }, (_, i) => rangedUnit(`javelin-${i}`, 'oszczepnik', 2)),
    ...homogeneousArchers,
  ];
  const mixedPlan = linePlanner._deployFormationPlan(mixedRanged, 'F2', 'flanks');
  const intentionalGroups = mixedPlan.main.filter(band => band.role === 'javelin' || band.role === 'archer');
  assert.strictEqual(Array.from(intentionalGroups, band => band.role).join(','), 'javelin,archer',
    'different ranged roles remain predictably separated into their own formation bands');
  checks++;
  for (const band of intentionalGroups) {
    assert.strictEqual(linePlanner._splitUnitsIntoRanks(
      band.units, linePlanner._deployLinesForRole(band.role),
    ).length, 1, `the ${band.role} role respects its configured one-line setting`);
    checks++;
  }

  const manyArchers = Array.from({ length: 25 }, (_, i) => ({
    id: `large-archer-${i}`, category: 'lucznik', name: 'Łucznik',
    reach: [2, 3, 4][i % 3],
  }));
  const productionRoleOf = unit => classifyInitialBattleRole({
    category: unit.category, name: unit.name, primaryRanged: true,
  });
  const manyArcherSlots = initialBattleSlots(
    initialBattleFormation(manyArchers, productionRoleOf),
    { rankWidth: 20, midRow: 78, playRow0: 23, playRow1: 132, archerLines: 1 },
  );
  assert.strictEqual(new Set(manyArcherSlots.map(slot => slot.rank)).size, 1,
    'the selected one-line setting overrides default rank-width overflow for one ranged category with varying reach');
  checks++;
  const oneLineRows = manyArcherSlots.map(slot => slot.row);
  assert(Math.min(...oneLineRows) >= 24 && Math.max(...oneLineRows) <= 131,
    'the requested 25-unit line fits the legal 108-row battlefield span without widening beyond bounds');
  checks++;
  const capacityArchers = Array.from({ length: 109 }, (_, i) => ({
    id: `capacity-archer-${i}`, category: 'lucznik', name: 'Łucznik',
  }));
  const capacitySlots = initialBattleSlots(
    initialBattleFormation(capacityArchers, productionRoleOf),
    { rankWidth: 20, midRow: 78, playRow0: 23, playRow1: 132, archerLines: 1 },
  );
  assert.strictEqual(new Set(capacitySlots.map(slot => slot.rank)).size, 2,
    'only a roster larger than the 108 legal row cells overflows the selected one-line request');
  checks++;
  assert(capacitySlots.every(slot => slot.row >= 24 && slot.row <= 131),
    'capacity overflow ranks never place units outside legal battlefield rows');
  checks++;
  const formationSource = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts'), 'utf8');
  assert.strictEqual((formationSource.match(/meleeLines: this\._deployMeleeLines, archerLines: this\._deployArcherLines/g) || []).length, 2,
    'both initial deployment and reset pass the selected line counts to the production slot planner');
  checks++;
  console.log(`PASS: mounted units stay in close, bounded flanks (${checks} checks)`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
