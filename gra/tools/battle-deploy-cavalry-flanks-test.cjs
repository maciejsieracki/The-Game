'use strict';
// R-WEB-BATTLE-DEPLOY-CAVALRY-FLANKS-AT-START-Q1: default start placement keeps
// cavalry/chariots on the wings, level with (not ahead of) the body they flank.
const assert = require('node:assert/strict');
const path = require('node:path'); const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
async function load() {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: path.join(__dirname, '..'), sourcefile: 'p.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{ name: 's', setup(b) {
      const st = (f, c) => { const ns = 'ns' + f.source; b.onResolve({ filter: f }, () => ({ path: ns, namespace: ns })); b.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents: c, loader: 'js' })); };
      st(/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();");
      st(/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";');
      st(/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";');
      st(/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};');
    } }], write: false, logLevel: 'silent' });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'b.ts' });
  return module.exports.BattleScene;
}
const unit = (id, cat, name, st = {}) => ({ id, nazwa: name, kategoria: cat, ownerColor: '#48c', hp: 100, maxHp: 100, morale: 100, stats: { Jednostka: name, Atak: 8, Obrona: 8, Pancerz: 2, Ruch: 4, ...st } });

function makeScene(BS, deployMode) {
  const scene = Object.create(BS.prototype);
  scene.scene = { add() {} };
  scene.terrainMap = { passable: () => true, at: () => 'plains' };
  scene.occByKey = new Map(); scene.ownedGeos = []; scene.ownedMats = [];
  scene._deployMode = deployMode; scene.deployPhase = false; scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1; scene._deployArcherLines = 1;
  scene._playerControlSide = () => 'atk';
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => []; scene._savedAtkBUs = scene._savedDefBUs = [];
  return scene;
}
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i));
function roster({ inf, arch, jav, mounted, leader = true }) {
  return [
    ...rep(inf, i => unit('inf' + i, 'miecznik', 'Wojownik')),
    ...rep(jav || 0, i => unit('jav' + i, 'oszczepnik', 'Oszczepnik', { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 2 })),
    ...rep(arch, i => unit('arch' + i, 'lucznik', 'Łucznik', { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 4 })),
    ...rep(mounted, i => i % 2 ? unit('m' + i, 'rydwan', 'Rydwan (woły)') : unit('m' + i, 'konnica', 'Jeździec')),
    ...(leader ? [unit('leader', 'dowodca', 'Wódz', { isArmyCommander: true })] : []),
  ];
}
const CASES = [
  { name: 'few infantry, many archers (the reported case)', inf: 4, arch: 20, mounted: 4 },
  { name: 'few infantry, many archers, many horse', inf: 3, arch: 24, jav: 3, mounted: 10 },
  { name: 'infantry widest', inf: 30, arch: 8, mounted: 6 },
  { name: 'infantry + horse only', inf: 12, arch: 0, mounted: 4, leader: false },
  { name: 'archers + horse only', inf: 0, arch: 16, mounted: 2 },
  { name: 'javelins widest', inf: 5, jav: 18, arch: 6, mounted: 6 },
];
(async () => {
  const BS = await load();
  let checks = 0, maxDist = 0;
  for (const deployMode of [false, true]) {
    for (const c of CASES) {
      const r = roster(c);
      const scene = makeScene(BS, deployMode);
      BS.prototype._placeUnits.call(scene, r, r);
      for (const side of ['atk', 'def']) {
        const us = scene[side];
        const sign = side === 'atk' ? 1 : -1;            // progress toward the enemy = sign * col
        const mounted = us.filter(u => u.mounted);
        const core = us.filter(u => !u.mounted);
        const tag = `${c.name} [${side}, deploy=${deployMode}]`;
        assert.equal(mounted.length, c.mounted, `${tag}: all mounted units deployed`);
        const coreRows = core.map(u => u.r);
        const minRow = Math.min(...coreRows), maxRow = Math.max(...coreRows);
        for (const m of mounted) {
          // 1. on a wing: outside the row span of the whole non-mounted body
          assert(m.r < minRow || m.r > maxRow, `${tag}: ${m.bu.id} at row ${m.r} is on a wing (body rows ${minRow}..${maxRow})`);
          checks++;
          // 2. not ahead of the body it flanks: never in a column in front of the
          //    most forward non-mounted unit that is on its side of the field
          const frontProg = Math.max(...core.map(u => sign * u.q));
          assert(sign * m.q <= frontProg, `${tag}: ${m.bu.id} is not ahead of the body`);
          checks++;
          // 3. close to the other units (Chebyshev distance to the nearest non-mounted unit)
          const d = Math.min(...core.map(u => Math.max(Math.abs(u.q - m.q), Math.abs(u.r - m.r))));
          maxDist = Math.max(maxDist, d);
          assert(d <= 4, `${tag}: ${m.bu.id} within 4 tiles of the nearest own unit (got ${d})`);
          checks++;
        }
        // 4. wing symmetry: both sides of the body are used when >= 2 horse
        if (mounted.length >= 2) {
          assert(mounted.some(u => u.r < minRow) && mounted.some(u => u.r > maxRow), `${tag}: both wings used`);
          checks++;
        }
        // 5. THE REPORTED BUG: a wing horse must not stand in a column in front of
        //    the rank of the widest non-mounted band while the front rank is narrower
        const frontCol = Math.max(...core.map(u => sign * u.q));
        const rankCols = new Map();
        for (const u of core) rankCols.set(u.q, (rankCols.get(u.q) || 0) + 1);
        const widestCol = [...rankCols.entries()].sort((a, b) => b[1] - a[1] || sign * (b[0] - a[0]))[0][0];
        for (const m of mounted.filter(u => u.r < minRow || u.r > maxRow)) {
          const gapAhead = sign * (m.q - widestCol);
          assert(gapAhead <= 0 || widestCol === (sign > 0 ? Math.max : Math.min)(...core.map(u => u.q)),
            `${tag}: ${m.bu.id} not ahead of the widest rank (col ${m.q} vs ${widestCol})`);
          checks++;
        }
      }
    }
  }
  console.log(`PASS: default start placement keeps cavalry/chariots on the wings, level with the body (${checks} checks, max distance to own unit ${maxDist})`);
})().catch(e => { console.error(e); process.exitCode = 1; });
