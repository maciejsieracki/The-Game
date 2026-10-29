'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function loadBattleScene({ restoreWideFallback = false } = {}) {
  const sourcePath = path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts');
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: path.join(__dirname, '..'), sourcefile: 'battle-initial-placement-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stub-render-only-unit-models',
      setup(build) {
        build.onResolve({ filter: /render\/units/ }, () => ({ path: 'unit-model-stub', namespace: 'unit-model-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'unit-model-stub' }, () => ({
          contents: "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();",
          loader: 'js',
        }));
        build.onResolve({ filter: /brandAssets/ }, () => ({ path: 'brand-stub', namespace: 'brand-stub' }));
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
        if (restoreWideFallback) {
          build.onLoad({ filter: /battleScene\.ts$/ }, args => {
            if (path.resolve(args.path) !== path.resolve(sourcePath)) return null;
            let contents = fs.readFileSync(args.path, 'utf8');
            const narrow = `const wingRowLo = topWing
          ? Math.max(PLAY_ROW0 + 1, idealRow[idx]! - 3)
          : Math.max(PLAY_MID_ROW + 1, idealRow[idx]! - 3);
        const wingRowHi = topWing
          ? Math.min(PLAY_MID_ROW - 1, idealRow[idx]! + 3)
          : Math.min(PLAY_ROW1 - 1, idealRow[idx]! + 3);`;
            const wide = `const wingRowLo = topWing ? PLAY_ROW0 + 1 : PLAY_MID_ROW + Math.ceil(RANK_WIDTH / 2) + 1;
        const wingRowHi = topWing ? PLAY_MID_ROW - Math.ceil(RANK_WIDTH / 2) - 2 : PLAY_ROW1 - 1;`;
            assert.equal(contents.split(narrow).length - 1, 2, 'mutation locates both production fallback blocks');
            contents = contents.split(narrow).join(wide);
            return { contents, loader: 'ts' };
          });
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

async function loadFormationRules() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'src', 'battle', 'formationRules.ts')],
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require }, { filename: 'formationRules.ts' });
  return module.exports;
}

function unit(id, category, name, extra = {}) {
  return {
    id, nazwa: name, kategoria: category, ownerColor: '#4488cc',
    hp: 100, maxHp: 100, morale: 100,
    stats: { Jednostka: name, Atak: 8, Obrona: 8, Pancerz: 2, Ruch: 4, ...(extra.stats ?? {}) },
    ...(extra.isArmyCommander ? { isArmyCommander: true } : {}),
  };
}

async function main() {
  const BattleScene = await loadBattleScene();
  const { classifyInitialBattleRole, initialBattleFormation, initialBattleSlots } = await loadFormationRules();
  const boardCols = 68, boardRows = 156;
  const playableRows = Math.round(boardRows * Math.SQRT1_2);
  const playRow0 = Math.floor((boardRows - playableRows) / 2);
  const playRow1 = playRow0 + playableRows - 1;
  const midRow = playRow0 + Math.floor((playableRows - 1) / 2);
  const rankWidth = 20;
  const playableCols = Math.round(boardCols * Math.SQRT1_2);
  const playCol0 = Math.floor((boardCols - playableCols) / 2);
  const frontGap = 5;
  const atkFront = playCol0 + Math.floor((playableCols - frontGap) / 2);
  const defFront = atkFront + frontGap;
  const scene = Object.create(BattleScene.prototype);
  scene.scene = { add() {} };
  const blockedTiles = new Set();
  scene.terrainMap = { passable: (col, row) => !blockedTiles.has(`${col},${row}`), at: () => 'plains' };
  scene.occByKey = new Map();
  scene.ownedGeos = [];
  scene.ownedMats = [];
  scene._deployMode = false;
  scene.deployPhase = false;
  scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1;
  scene._deployArcherLines = 1;
  scene._playerControlSide = () => 'atk';
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => [];
  scene._savedAtkBUs = scene._savedDefBUs = [];

  const roster = [
    ...Array.from({ length: 4 }, (_, i) => unit(`inf-${i}`, 'miecznik', 'Wojownik')),
    ...Array.from({ length: 3 }, (_, i) => unit(`jav-${i}`, 'oszczepnik', 'Oszczepnik', { stats: { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 2 } })),
    ...Array.from({ length: 3 }, (_, i) => unit(`arch-${i}`, 'lucznik', 'Łucznik', { stats: { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 4 } })),
    ...Array.from({ length: 2 }, (_, i) => unit(`sling-${i}`, 'procarz', 'Procarz', { stats: { 'Atak dystansowy': 4, 'Zasięg ataku (hex)': 5 } })),
    unit('siege', 'maszyna', 'Katapulta', { stats: { Typ: 'Siege', 'Atak dystansowy': 8, 'Zasięg ataku (hex)': 6 } }),
    ...Array.from({ length: 4 }, (_, i) => unit(`mounted-${i}`, i % 2 ? 'rydwan' : 'konnica', i % 2 ? 'Rydwan (woły)' : 'Jeździec')),
    unit('leader', 'dowodca', 'Wódz', { isArmyCommander: true }),
  ];

  const roleOf = bu => classifyInitialBattleRole({
    commander: bu.isArmyCommander === true,
    category: bu.kategoria,
    name: bu.nazwa,
    type: bu.stats?.Typ,
    primaryRanged: Number(bu.stats?.['Atak dystansowy'] ?? 0) > 0,
  });
  const formation = initialBattleFormation(roster, roleOf);
  const idealSlots = initialBattleSlots(formation, {
    rankWidth, midRow, playRow0, playRow1, meleeLines: 1, archerLines: 1,
  });
  for (const side of ['atk', 'def']) {
    for (const slot of idealSlots.filter(candidate => roleOf(candidate.unit) === 'mounted')) {
      const frontCol = side === 'atk' ? atkFront : defFront;
      const rankStep = side === 'atk' ? -1 : 1;
      const idealCol = frontCol + slot.rank * rankStep;
      blockedTiles.add(`${idealCol},${slot.row}`);
    }
  }

  function assertSidePlacement(units, side, phase) {
    assert.equal(units.length, roster.length, `${phase}/${side} deploys the full fixture`);
    assert.equal(new Set(units.map(u => `${u.q},${u.r}`)).size, units.length, `${phase}/${side} resolves collisions`);
    assert(units.every(u => u.q >= 0 && u.q < boardCols && u.r >= 0 && u.r < boardRows), `${phase}/${side} stays inside board bounds`);
    const core = units.filter(u => roleOf(u.bu) !== 'mounted');
    const coreRows = core.map(u => u.r);
    const mounted = units.filter(u => u.mounted);
    assert(mounted.length > 0 && mounted.every(u => Math.min(...coreRows.map(row => Math.abs(u.r - row))) <= 5),
      `${phase}/${side} keeps fallback cavalry/chariots within five rows of the army (mounted=${mounted.map(u => u.r).join(',')}; core=${Math.min(...coreRows)}..${Math.max(...coreRows)})`);
    assert(mounted.every(u => u.r < Math.min(...coreRows) || u.r > Math.max(...coreRows)), `${phase}/${side} keeps mounted units on the flanks`);
  }

  BattleScene.prototype._placeUnits.call(scene, roster, roster);
  const placed = scene.atk;
  assertSidePlacement(placed, 'atk', 'initial placement');
  assertSidePlacement(scene.def, 'def', 'initial placement');

  const at = id => placed.find(u => u.bu.id === id);
  const front = Math.min(...placed.filter(u => ['miecznik'].includes(u.bu.kategoria)).map(u => u.q));
  const javelin = at('jav-0');
  const archer = at('arch-0');
  const slinger = at('sling-0');
  const siege = at('siege');
  const leader = at('leader');
  assert(javelin.formationRank > 0 && javelin.formationRank > at('inf-0').formationRank, 'javelins deploy behind infantry');
  assert(archer.formationRank > javelin.formationRank, 'archers deploy behind javelins');
  assert(slinger.formationRank > archer.formationRank, 'slingers deploy behind archers');
  assert(siege.formationRank > slinger.formationRank, 'siege deploys behind ranged units');
  assert(leader.formationRank > siege.formationRank, 'commander deploys behind the combat ranks');
  const mainRows = placed.filter(u => ['miecznik', 'oszczepnik', 'lucznik', 'procarz', 'maszyna', 'dowodca'].includes(u.bu.kategoria)).map(u => u.r);
  const minRow = Math.min(...mainRows), maxRow = Math.max(...mainRows);
  const mounted = placed.filter(u => u.mounted);
  assert(mounted.every(u => u.r < minRow || u.r > maxRow), 'mounted units flank the deployed main body');
  assert(mounted.every(u => Math.min(...mainRows.map(row => Math.abs(u.r - row))) <= 5),
    `mounted wings remain close to the main body: mounted=${mounted.map(u => u.r).join(',')} core=${minRow}..${maxRow}`);

  // Reset uses the same production placement adapter and must preserve role order.
  scene._savedAtkBUs = roster.map(u => ({ ...u, stats: { ...u.stats } }));
  scene._savedDefBUs = roster.map(u => ({ ...u, stats: { ...u.stats } }));
  scene.occByKey.clear();
  scene.deployPhase = false;
  BattleScene.prototype._placeUnitsOneSide.call(scene, 'atk', false);
  assertSidePlacement(scene.atk, 'atk', 'reset');
  const resetAt = id => scene.atk.find(u => u.bu.id === id);
  assert(resetAt('jav-0').formationRank > resetAt('inf-0').formationRank, 'reset preserves javelins behind infantry');
  assert(resetAt('arch-0').formationRank > resetAt('jav-0').formationRank, 'reset preserves archers behind javelins');
  assert(resetAt('sling-0').formationRank > resetAt('arch-0').formationRank, 'reset preserves slingers behind archers');
  assert(resetAt('leader').formationRank > resetAt('siege').formationRank, 'reset preserves commander behind combat ranks');
  const resetCoreRows = scene.atk.filter(u => u.bu.kategoria !== 'konnica' && u.bu.kategoria !== 'rydwan').map(u => u.r);
  const resetMinRow = Math.min(...resetCoreRows), resetMaxRow = Math.max(...resetCoreRows);
  assert(scene.atk.filter(u => u.mounted).every(u => Math.min(...resetCoreRows.map(row => Math.abs(u.r - row))) <= 5),
    `reset keeps mounted units close to the main body: mounted=${scene.atk.filter(u => u.mounted).map(u => u.r).join(',')} core=${resetMinRow}..${resetMaxRow}`);
  scene.occByKey.clear();
  BattleScene.prototype._placeUnitsOneSide.call(scene, 'def', false);
  assertSidePlacement(scene.def, 'def', 'reset');

  // The exact prior broad midline fallback is a mutation control. It must turn
  // the same forced-blockage scenario red for both initial sides and reset.
  const WideFallbackBattleScene = await loadBattleScene({ restoreWideFallback: true });
  const mutated = Object.create(WideFallbackBattleScene.prototype);
  Object.assign(mutated, scene, {
    occByKey: new Map(),
    _savedAtkBUs: roster.map(u => ({ ...u, stats: { ...u.stats } })),
    _savedDefBUs: roster.map(u => ({ ...u, stats: { ...u.stats } })),
  });
  const errors = [];
  let mutationCaughtCases = 0;
  try {
    WideFallbackBattleScene.prototype._placeUnits.call(mutated, roster, roster);
  }
  catch (error) { errors.push(String(error.message)); }
  for (const side of ['atk', 'def']) {
    try { assertSidePlacement(mutated[side], side, 'mutated initial placement'); }
    catch (error) { errors.push(`${side}: ${error.message}`); }
  }
  assert(errors.some(error => error.startsWith('atk:')), 'old wide fallback mutation is caught in initial attacker placement');
  mutationCaughtCases++;
  assert(errors.some(error => error.startsWith('def:')), 'old wide fallback mutation is caught in initial defender placement');
  mutationCaughtCases++;
  mutated.occByKey.clear();
  for (const side of ['atk', 'def']) {
    mutated.occByKey.clear();
    let resetCaught = false;
    try {
      WideFallbackBattleScene.prototype._placeUnitsOneSide.call(mutated, side, false);
      assertSidePlacement(mutated[side], side, 'mutated reset');
    } catch (_) { resetCaught = true; }
    assert(resetCaught, `old wide fallback mutation is caught in ${side} reset placement`);
    mutationCaughtCases++;
  }

  assert.equal(mutationCaughtCases, 4, 'mutation is caught independently for attacker/defender initial placement and reset');
  console.log('PASS: forced mounted fallback in production initial placement/reset stays close; old wide fallback mutation caught 4/4');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
