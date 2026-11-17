'use strict';
// R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 (zarzuty Evaluatora 2, 3, 12 w zakresie sceny):
// testy NA REALNYCH metodach BattleScene (Object.create + prototyp, jak battle-initial-placement-runtime-test),
// nie na samej geometrii. Sprawdza: strefe zastawiajacego (takze pole wroga), clamp, brak nakladania,
// brak jednostek poza mapa, szyk <=3 dla zaskoczonych oraz regresje zwyklej bitwy (pole undefined).
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: path.join(__dirname, '..'), sourcefile: 'ambush-deploy-scene-entry.ts',
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
      },
    }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function makeScene(BattleScene, { control, surprised, hasSurprisedField = true }) {
  const scene = Object.create(BattleScene.prototype);
  scene.terrainMap = { passable: () => true, at: () => 'plains' };
  scene.occByKey = new Map();
  scene._deployPlayerSideOpt = control;
  if (hasSurprisedField) scene._ambushSurprisedSide = surprised;
  return scene;
}

function normalAtkDefault(BattleScene) {
  return makeScene(BattleScene, { control: 'atk', surprised: null });
}

let checks = 0;
function ok(cond, msg) { assert.ok(cond, msg); checks++; console.log('  OK   ' + msg); }

async function main() {
  const BattleScene = await loadBattleScene();
  // Granice pola bierze sama scena (bez eksportu stalych): clamp w skrajnych wartosciach.
  const probe = makeScene(BattleScene, { control: 'atk', surprised: null });
  const colMin = probe._clampDeployPlayerCol(-100000);
  const colMax = probe._clampDeployPlayerCol(100000);
  const midCol = Math.floor((colMin + colMax) / 2);
  const midRow = 80; // wiersz wewnatrz pola (PLAY_ROW0..PLAY_ROW1 obejmuje 80)
  const rowOut = -5;

  // (1) Regresja zwyklej bitwy: pole undefined (Object.create, jak w starych testach) = brak trybu zasadzki.
  const plain = makeScene(BattleScene, { control: 'atk', surprised: undefined, hasSurprisedField: false });
  ok(plain._isAmbushAmbusherPlayer() === false, 'zwykla bitwa (pole undefined): gracz nie jest zastawiajacym');
  const plainDef = makeScene(BattleScene, { control: 'def', surprised: undefined, hasSurprisedField: false });
  ok(plainDef._isAmbushAmbusherPlayer() === false, 'zwykla bitwa, gracz=def: brak trybu zasadzki');
  const sentinelCol = [7, 7], sentinelRow = [9, 9];
  plain._applyAmbushDeployIdeal('atk', [{}, {}], sentinelRow, sentinelCol, midCol, 1);
  ok(sentinelCol.every(v => v === 7) && sentinelRow.every(v => v === 9),
    'zwykla bitwa: _applyAmbushDeployIdeal nie nadpisuje pozycji (regresja)');
  ok(plain._clampDeployPlayerCol(colMin - 9) === colMin, 'zwykla bitwa: clamp gracza bez zmian (klamra do polowy pola)');

  // (2) Gracz = zastawiajacy (zasadzka gracza, zaskoczony = atk): strefa obejmuje CALE pole, takze strone wroga.
  const ambusher = makeScene(BattleScene, { control: 'def', surprised: 'atk' });
  ok(ambusher._isAmbushAmbusherPlayer() === true, 'zastawiajacy-gracz: _isAmbushAmbusherPlayer = true');
  // Pelne granice pola (dla zastawiajacego) -- inne niz polowy z probe.
  const fullMin = ambusher._clampDeployPlayerCol(-100000);
  const fullMax = ambusher._clampDeployPlayerCol(100000);
  ok(fullMin <= colMin && fullMax > colMax, 'zastawiajacy-gracz: pelne pole siega dalej niz polowa (prawa strona = pole wroga)');
  ok(ambusher._inDeployPlayerZone(fullMin, midRow) === true, 'zastawiajacy-gracz: strefa obejmuje lewa krawedz pola');
  ok(ambusher._inDeployPlayerZone(fullMax, midRow) === true, 'zastawiajacy-gracz: strefa obejmuje prawa krawedz (pole wroga)');
  ok(normalAtkDefault(BattleScene)._inDeployPlayerZone(fullMax, midRow) === false,
    'kontrast: zwykly gracz-atk NIE ma strefy na prawej (wrogiej) polowie');
  ok(ambusher._inDeployPlayerZone(midCol, rowOut) === false, 'zastawiajacy-gracz: wiersz poza polem nie jest w strefie');
  ok(ambusher._clampDeployPlayerCol(fullMax + 50) === fullMax, 'zastawiajacy-gracz: clamp kolumny do calego pola (prawo)');
  ok(ambusher._clampDeployPlayerCol(fullMin - 50) === fullMin, 'zastawiajacy-gracz: clamp kolumny do calego pola (lewo)');

  // (3) Gracz = zaskoczony (control atk, surprised atk): strefa to zwykla polowa jak w zwyklej bitwie.
  const surprisedPlayer = makeScene(BattleScene, { control: 'atk', surprised: 'atk' });
  ok(surprisedPlayer._isAmbushAmbusherPlayer() === false, 'zaskoczony-gracz: nie jest zastawiajacym');
  const normalAtk = makeScene(BattleScene, { control: 'atk', surprised: null });
  for (const c of [colMin, colMax]) {
    ok(surprisedPlayer._inDeployPlayerZone(c, midRow) === normalAtk._inDeployPlayerZone(c, midRow),
      `zaskoczony-gracz: strefa w kolumnie ${c} taka sama jak w zwyklej bitwie`);
  }

  // (4) Brak nakladania i brak jednostek poza mapa: AI-zastawiajacy (surprised = atk, AI = def).
  const n = 12;
  const units = Array.from({ length: n }, () => ({}));
  const aiAmb = makeScene(BattleScene, { control: 'atk', surprised: 'atk' });
  const frontAtk = colMin + Math.floor((colMax - colMin) / 3);
  const defCols = new Array(n).fill(-1), defRows = new Array(n).fill(-1);
  aiAmb._applyAmbushDeployIdeal('def', units, defRows, defCols, midCol, 2);
  const keys = new Set(defCols.map((c, i) => c + ',' + defRows[i]));
  ok(keys.size === n, 'AI-zastawiajacy: brak nakladania (12 unikalnych pozycji)');
  const playMin = ambusher._clampDeployPlayerCol(-100000);
  const playMax = ambusher._clampDeployPlayerCol(100000);
  ok(defCols.every(c => c >= playMin && c <= playMax), 'AI-zastawiajacy: kolumny w granicach pola (brak poza mapa)');
  ok(defRows.every(r => r >= 0), 'AI-zastawiajacy: wiersze nieujemne');

  // (5) Zaskoczeni AI (surprised = atk, gracz = def): szyk najwyzej 3 jednostki w szeregu (dluga linia).
  const surpAi = makeScene(BattleScene, { control: 'def', surprised: 'atk' });
  const lineCols = new Array(n).fill(-1), lineRows = new Array(n).fill(-1);
  surpAi._applyAmbushDeployIdeal('atk', units, lineRows, lineCols, frontAtk, -2);
  const perCol = new Map();
  lineCols.forEach(c => perCol.set(c, (perCol.get(c) ?? 0) + 1));
  ok(Math.max(...perCol.values()) <= 3, 'zaskoczeni: w jednym szeregu najwyzej 3 jednostki (n=12)');

  // (6) Strona kontrolowana przez gracza (atk, zastawiajacy AI = def, zaskoczony = atk) nie jest nadpisywana.
  const playerSideScene = makeScene(BattleScene, { control: 'atk', surprised: 'def' });
  const pCols = new Array(n).fill(-1), pRows = new Array(n).fill(-1);
  playerSideScene._applyAmbushDeployIdeal('atk', units, pRows, pCols, midCol, 2);
  ok(pCols.every(v => v === -1) && pRows.every(v => v === -1),
    'strona gracza (control=atk) pozostaje nietknieta przez hak zasadzki');

  console.log(`\nWYNIK: ${checks} OK / 0 FAIL`);
}

main().catch(e => { console.error('FAIL', e && e.message ? e.message : e); process.exit(1); });
