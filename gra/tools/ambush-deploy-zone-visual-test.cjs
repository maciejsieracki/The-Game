'use strict';
// R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 (r2, pkt 9 / zarzut Evaluatora 1):
// strefa GRAFICZNA rozstawienia (_buildDeployZone) ma pokrywac DOKLADNIE strefe LOGICZNA
// (_inDeployPlayerZone). Test buduje realna wizualizacje na prototypie BattleScene (THREE z bundla)
// i porownuje kafle (meshe y=0.045) z regula logiczna dla zastawiajacego, zaskoczonego i zwyklej bitwy.
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: path.join(__dirname, '..'), sourcefile: 'ambush-deploy-zone-visual-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stub-battle-deps',
      setup(build) {
        let seq = 0;
        const stub = (re, contents) => {
          const ns = 'stub-' + (seq++);
          build.onResolve({ filter: re }, () => ({ path: ns, namespace: ns }));
          build.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents, loader: 'js' }));
        };
        stub(/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();");
        stub(/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";');
        stub(/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";');
        stub(/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};');
        stub(/brandTokenVars/, 'export const CIV_BRAND_SCOPE_VARS = {}; export const ensureBrandRootTokens = () => {};');
      },
    }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function makeScene(BattleScene, { control, surprised }) {
  const scene = Object.create(BattleScene.prototype);
  scene.terrainMap = { passable: () => true, at: () => 'plains' };
  scene.occByKey = new Map();
  scene._deployPlayerSideOpt = control;
  if (surprised !== undefined) scene._ambushSurprisedSide = surprised;
  scene.scene = { add() {} };
  scene.ownedGeos = [];
  scene.ownedMats = [];
  scene._deployZoneMeshes = [];
  return scene;
}

// Zbiera komorki kafli strefy z realnie zbudowanej wizualizacji (kafel = PlaneGeometry 0.94*TILE_S, y=0.045).
function tileCells(scene) {
  const tiles = scene._deployZoneMeshes.filter(m => Math.abs(m.position.y - 0.045) < 1e-9);
  const width = tiles[0] ? tiles[0].geometry.parameters.width : 1;
  const ts = width / 0.94;
  const cells = new Set(tiles.map(m => Math.round(m.position.x / ts) + ',' + Math.round(m.position.z / ts)));
  return { cells, count: tiles.length, hasFog: scene._deployZoneMeshes.some(m => Math.abs(m.position.y - 0.055) < 1e-9) };
}

// Oczekiwane komorki = passable && logiczna strefa gracza, po calym zakresie kolumn klampu i wierszy 0..200.
function logicCells(scene) {
  const colMin = scene._clampDeployPlayerCol(-100000);
  const colMax = scene._clampDeployPlayerCol(100000);
  const out = new Set();
  for (let c = colMin; c <= colMax; c++) {
    for (let r = 0; r <= 200; r++) {
      if (scene.terrainMap.passable(c, r) && scene._inDeployPlayerZone(c, r)) out.add(c + ',' + r);
    }
  }
  return { cells: out, colMin, colMax };
}

let checks = 0;
function ok(cond, msg) { assert.ok(cond, msg); checks++; console.log('  OK   ' + msg); }

async function main() {
  const BattleScene = await loadBattleScene();

  // (A) Zastawiajacy-gracz (control=def, zaskoczony=atk): kafle = cale pole, takze polowa wroga; brak mgly.
  const amb = makeScene(BattleScene, { control: 'def', surprised: 'atk' });
  amb._buildDeployZone();
  const va = tileCells(amb), la = logicCells(amb);
  ok(va.cells.size > 0, 'zastawiajacy: wizualizacja ma kafle strefy');
  ok(va.cells.size === la.cells.size && [...la.cells].every(k => va.cells.has(k)),
    `zastawiajacy: kafle graficzne (${va.cells.size}) = strefa logiczna (${la.cells.size})`);
  const fieldMid = Math.floor((la.colMin + la.colMax) / 2);
  ok([...va.cells].some(k => Number(k.split(',')[0]) > fieldMid),
    'zastawiajacy: kafle graficzne siegaja polowy wroga (prawa strona pola)');
  ok(va.hasFog === false, 'zastawiajacy: brak zaslony mgly na polowie wroga');

  // (B) Zaskoczony-gracz (control=atk, zaskoczony=atk): kafle tylko w paśmie linii i w zwyklej strefie kolumn.
  const sur = makeScene(BattleScene, { control: 'atk', surprised: 'atk' });
  sur._buildDeployZone();
  const vs = tileCells(sur), ls = logicCells(sur);
  const [bandLo, bandHi] = sur._ambushLineRowBand();
  ok(vs.cells.size > 0, 'zaskoczony: wizualizacja ma kafle strefy');
  ok(vs.cells.size === ls.cells.size && [...ls.cells].every(k => vs.cells.has(k)),
    `zaskoczony: kafle graficzne (${vs.cells.size}) = strefa logiczna (${ls.cells.size})`);
  ok([...vs.cells].every(k => { const r = Number(k.split(',')[1]); return r >= bandLo && r <= bandHi; }),
    `zaskoczony: wszystkie kafle w paśmie linii (wiersze ${bandLo}..${bandHi})`);
  ok(vs.hasFog === true, 'zaskoczony: zaslona mgly na polowie wroga pozostaje');

  // (C) Regresja zwyklej bitwy (pole surprised nieustawione): zaslona mgly jest, kafle tylko w zwyklej polowie.
  const plain = makeScene(BattleScene, { control: 'atk', surprised: undefined });
  plain._buildDeployZone();
  const vp = tileCells(plain);
  ok(vp.hasFog === true, 'zwykla bitwa: zaslona mgly na polowie wroga (bez zmian)');
  ok(vp.cells.size > 0, 'zwykla bitwa: kafle strefy istnieja');
  const plainMax = Math.max(...[...vp.cells].map(k => Number(k.split(',')[0])));
  ok(plainMax <= fieldMid, 'zwykla bitwa: kafle nie wychodza na polowe wroga');

  console.log(`\nWYNIK: ${checks} OK / 0 FAIL`);
}

main().catch(e => { console.error('FAIL', e && e.message ? e.message : e); process.exit(1); });
