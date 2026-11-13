'use strict';
// Scratch equivalence dump: placement positions for a given root (base vs new). Not part of repo.
const path = require('node:path'); const vm = require('node:vm');
const ROOT = process.argv[2];
const NM = '/home/user/The-Game/.claude/worktrees/wf_8d6c992a-330-1/gra/node_modules';
const esbuild = require(path.join(NM, 'esbuild'));
async function loadModules() {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts';\nmodule.exports = { BattleScene };", resolveDir: ROOT, sourcefile: 'entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(NM, 'three', 'build', 'three.cjs') },
    plugins: [{ name: 'stubs', setup(build) {
      const stubs = [
        [/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();"],
        [/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";'],
        [/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";'],
        [/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};'],
      ];
      stubs.forEach(([filter, contents], i) => { const ns = 'stub' + i;
        build.onResolve({ filter }, args => ({ path: args.path, namespace: ns }));
        build.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents, loader: 'js', resolveDir: ROOT })); });
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout, performance }, { filename: 'battleScene.ts' });
  return module.exports;
}
function mkUnit(side, i, kind) {
  const defs = { inf: ['miecznik', 'Wojownik', {}], jav: ['oszczepnik', 'Oszczepnik', { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 2, 'Ilosc pociskow': 6 }],
    arch: ['lucznik', 'Łucznik', { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 4, 'Ilosc pociskow': 12 }], cav: ['konnica', 'Jeździec', {}] }[kind];
  return { id: `${side}-${kind}-${i}`, nazwa: defs[1], kategoria: defs[0], ownerColor: side === 'atk' ? '#4488cc' : '#cc4444', hp: 100, maxHp: 100, morale: 100,
    stats: { Jednostka: defs[1], Atak: 8, Obrona: 5, Pancerz: 1, Ruch: 3, 'Ruch w bitwie (heksy)': 2, ...defs[2] } };
}
function mkRoster(side, n) { return Array.from({ length: n }, (_, i) => { const m = i % 20; return mkUnit(side, i, m < 12 ? 'inf' : m < 15 ? 'jav' : m < 18 ? 'arch' : 'cav'); }); }
const BOARD_COLS = 68, BOARD_ROWS = 156;
(async () => {
  const { BattleScene } = await loadModules();
  const out = {};
  for (const [a, d] of [[10, 10], [40, 40], [120, 120], [120, 37], [60, 120]]) for (const variant of ['plains', 'obstacles']) {
    const blocked = new Set();
    if (variant === 'obstacles') { let seed = 777; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
      for (let c = 0; c < BOARD_COLS; c++) for (let r = 0; r < BOARD_ROWS; r++) if (rnd() < 0.10) blocked.add(`${c},${r}`); }
    const scene = Object.create(BattleScene.prototype);
    scene.scene = { add() {}, remove() {} };
    scene.terrainMap = { passable: (c, r) => c >= 0 && c < BOARD_COLS && r >= 0 && r < BOARD_ROWS && !blocked.has(`${c},${r}`), at: () => 0, moveCost: () => 1, combatTerrainName: () => 'Plaskie (rownina/laka)' };
    scene.occByKey = new Map(); scene.ownedGeos = []; scene.ownedMats = []; scene._deployMode = false; scene.deployPhase = false; scene.siegeWallCol = -1;
    scene._deployMeleeLines = 1; scene._deployArcherLines = 1; scene._playerControlSide = () => 'atk';
    scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
    scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {}; scene._placeSiegeDefenders = () => []; scene._savedAtkBUs = scene._savedDefBUs = [];
    BattleScene.prototype._placeUnits.call(scene, mkRoster('atk', a), mkRoster('def', d));
    const pos = s => s.map(u => [u.bu ? u.bu.id : u.id, u.q, u.r]);
    out[`${a}v${d}-${variant}`] = { atk: pos(scene.atk), def: pos(scene.def) };
  }
  process.stdout.write(JSON.stringify(out, null, 1));
})().catch(e => { console.error('EQ FAIL', (e && e.stack) || e); process.exit(1); });
