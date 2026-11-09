'use strict';
// R-WEB-ARMY-CAVALRY-FLANK-NOT-APPLIED-DEFAULT-Q1: default start placement (plains + rough terrain) keeps
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


// terrain kinds as in BTerrain: 0 Plains, 1 Forest, 2 Hills, 3 River(impassable), 4 Ford, 5 Rocks
function makeTerrain(kind) {
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cache = new Map();
  const at = (c, r) => {
    const k = c * 1000 + r; if (cache.has(k)) return cache.get(k);
    let v = 0;
    if (kind === 'forest-wings') v = 1;                 // everything is forest ...
    else if (kind === 'scattered') { const x = rnd(); v = x < 0.25 ? 1 : x < 0.35 ? 2 : x < 0.40 ? 3 : x < 0.45 ? 5 : 0; }
    else if (kind === 'river-flanks') v = 0;
    cache.set(k, v); return v;
  };
  return { at, passable: (c, r) => at(c, r) !== 3 && !(kind === 'river-flanks' && at(c, r) === 0 && false) };
}
function makeScene(BS, deployMode, terrain) {
  const scene = Object.create(BS.prototype);
  scene.scene = { add() {} };
  scene.terrainMap = terrain;
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
    // mixed real unit names / categories (Typ Mount; super units carry category "super")
    ...rep(mounted, i => [
      unit('m' + i, 'konnica', 'Konnica', { Typ: 'Mount' }),
      unit('m' + i, 'rydwan', 'Rydwan konny', { Typ: 'Mount' }),
      unit('m' + i, 'super', 'Rydwan egipski', { Typ: 'Mount' }),
      unit('m' + i, 'super', 'Jeździec chiński', { Typ: 'Mount' }),
      unit('m' + i, 'lucznik', 'Konnica łucznicza asyryjska', { Typ: 'Mount', 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 4 }),
    ][i % 5]),
    ...(leader ? [unit('leader', 'dowodca', 'Wódz', { isArmyCommander: true })] : []),
  ];
}
const CASES = [
  { name: 'few infantry, many archers', inf: 4, arch: 20, mounted: 4 },
  { name: 'many horse', inf: 3, arch: 24, jav: 3, mounted: 10 },
  { name: 'infantry widest', inf: 30, arch: 8, mounted: 6 },
  { name: 'infantry + horse only', inf: 12, arch: 0, mounted: 4, leader: false },
  { name: 'javelins widest', inf: 5, jav: 18, arch: 6, mounted: 6 },
];
(async () => {
  const BS = await load();
  let checks = 0;
  for (const terr of ['plains', 'forest-wings', 'scattered']) {
    for (const deployMode of [false, true]) {
      for (const c of CASES) {
        const r = roster(c);
        const scene = makeScene(BS, deployMode, makeTerrain(terr));
        BS.prototype._placeUnits.call(scene, r, r.map(u => ({ ...u, id: 'd' + u.id })));
        for (const side of ['atk', 'def']) {
          const us = scene[side]; const sign = side === 'atk' ? 1 : -1;
          const mounted = us.filter(u => u.mounted), core = us.filter(u => !u.mounted);
          const tag = `${c.name} [${terr}, ${side}, deploy=${deployMode}]`;
          assert.equal(mounted.length, c.mounted, `${tag}: all mounted units deployed and flagged mounted`);
          const minRow = Math.min(...core.map(u => u.r)), maxRow = Math.max(...core.map(u => u.r));
          const frontProg = Math.max(...core.map(u => sign * u.q));
          for (const m of mounted) {
            // never in front of the whole body (the reported symptom)
            assert(sign * m.q <= frontProg, `${tag}: ${m.bu.id} at col ${m.q} is ahead of the body front`);
            checks++;
          }
          // wings: horse on the outer rows of the line, on both sides when >= 2
          const wing = mounted.filter(u => u.r < minRow || u.r > maxRow);
          assert(wing.length >= Math.ceil(mounted.length * 0.7), `${tag}: >=70% of horse on a wing (${wing.length}/${mounted.length}), body rows ${minRow}..${maxRow}; horse ${mounted.map(m => m.bu.id + '@' + m.q + ',' + m.r).join(' ')}`);
          checks++;
          if (mounted.length >= 2) {
            assert(mounted.some(u => u.r < minRow) && mounted.some(u => u.r > maxRow), `${tag}: both wings used`);
            checks++;
          }
        }
      }
    }
  }
  console.log(`PASS: cavalry/chariots default to the wings on plains and on rough terrain, never ahead of the body (${checks} checks)`);
})().catch(e => { console.error(e.message || e); process.exitCode = 1; });
