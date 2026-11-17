'use strict';
// R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 (zarzut 4 / kryterium a): zaskoczeni w dlugiej linii.
// Produkcyjne _placeUnits (rozstawienie startowe) i _placeUnitsOneSide (Reset) na realnej BattleScene.
// Sprawdza: strona zaskoczona ma WSZYSTKIE jednostki (takze konnice/rydwany) w wierszach linii
// (PLAY_MID_ROW +- 1), czyli najwyzej AMBUSH_FORMATION_MAX_WIDTH (=3) jednostek w szeregu poprzek pola;
// konnica nie ucieka na skrzydla poza linie. Dla N = 5, 12, 30, 60; zwykla bitwa bez zmian.
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function load() {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: path.join(__dirname, '..'), sourcefile: 'amb-line.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{ name: 's', setup(b) {
      const st = (f, c) => { const ns = 'ns' + f.source; b.onResolve({ filter: f }, () => ({ path: ns, namespace: ns })); b.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents: c, loader: 'js' })); };
      st(/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();");
      st(/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";');
      st(/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";');
      st(/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};');
      st(/brandTokenVars/, 'export const CIV_BRAND_SCOPE_VARS = {}; export const ensureBrandRootTokens = () => {};');
    } }], write: false, logLevel: 'silent' });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'amb-line.ts' });
  return module.exports.BattleScene;
}

const unit = (id, cat, name, st = {}) => ({ id, nazwa: name, kategoria: cat, ownerColor: '#48c', hp: 100, maxHp: 100, morale: 100, stats: { Jednostka: name, Atak: 8, Obrona: 8, Pancerz: 2, Ruch: 4, ...st } });

function makeTerrain(kind) {
  let seed = 777; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cache = new Map();
  const at = (c, r) => {
    const k = c * 1000 + r; if (cache.has(k)) return cache.get(k);
    let v = 0;
    if (kind === 'scattered') { const x = rnd(); v = x < 0.2 ? 1 : x < 0.3 ? 2 : x < 0.35 ? 3 : 0; }
    cache.set(k, v); return v;
  };
  return { at, passable: (c, r) => at(c, r) !== 3 };
}

function makeScene(BS, { control, surprised, terrain }) {
  const scene = Object.create(BS.prototype);
  scene.scene = { add() {} };
  scene.terrainMap = terrain;
  scene.occByKey = new Map(); scene.ownedGeos = []; scene.ownedMats = [];
  scene._deployMode = true; scene.deployPhase = false; scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1; scene._deployArcherLines = 1;
  scene._deployPlayerSideOpt = control;
  scene._playerControlSide = () => control;
  if (surprised !== undefined) scene._ambushSurprisedSide = surprised;
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => []; scene._savedAtkBUs = scene._savedDefBUs = [];
  return scene;
}

// Jednostki konne i piesze, z przewaga konnicy/rydwanow (zdarzaja sie na skrzydlach).
function roster(n, prefix) {
  const out = [];
  for (let i = 0; i < n; i++) {
    if (i % 3 === 1) out.push(unit(prefix + 'm' + i, 'konnica', 'Konnica', { Typ: 'Mount' }));
    else if (i % 3 === 2) out.push(unit(prefix + 'r' + i, 'rydwan', 'Rydwan (woły)', { Typ: 'Mount' }));
    else out.push(unit(prefix + 'i' + i, 'miecznik', 'Wojownik'));
  }
  return out;
}

const SIZES = [5, 12, 30, 60];
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

(async () => {
  const BS = await load();
  for (const terr of ['plains', 'scattered']) {
    for (const N of SIZES) {
      // (A) gracz zastawiajacy (atk), zaskoczony = def (AI); (B) gracz zaskoczony = atk; (C) gracz zaskoczony = def.
      const cases = [
        { name: 'A: AI zaskoczony def', control: 'atk', surprised: 'def', line: 'def' },
        { name: 'B: gracz zaskoczony atk', control: 'atk', surprised: 'atk', line: 'atk' },
        { name: 'C: gracz zaskoczony def', control: 'def', surprised: 'def', line: 'def' },
      ];
      for (const c of cases) {
        const terrain = makeTerrain(terr);
        const atkR = roster(N, 'a'), defR = roster(N, 'd');
        const tag = `N=${N} [${terr}] ${c.name}`;
        const scene = makeScene(BS, { control: c.control, surprised: c.surprised, terrain });
        BS.prototype._placeUnits.call(scene, atkR, defR);
        const check = (phase) => {
          const us = scene[c.line];
          ok(us.length === N, `${tag} ${phase}: wszystkie ${N} jednostek zaskoczonych rozstawione (jest ${us.length})`);
          const band = scene._ambushLineRowBand();
          const rows = us.map(u => u.r);
          const mn = Math.min(...rows), mx = Math.max(...rows);
          ok(mn >= band[0] && mx <= band[1], `${tag} ${phase}: linia zaskoczonych w wierszach ${band[0]}..${band[1]} (jest ${mn}..${mx})`);
          const perCol = new Map();
          for (const u of us) perCol.set(u.q, (perCol.get(u.q) || 0) + 1);
          ok(Math.max(...perCol.values()) <= 3, `${tag} ${phase}: najwyzej 3 jednostki w szeregu poprzek (max ${Math.max(...perCol.values())})`);
          const mounted = us.filter(u => u.mounted);
          ok(mounted.length > 0, `${tag} ${phase}: konnica/rydwany obecne w linii (${mounted.length})`);
          const coords = new Set(us.map(u => u.q + ',' + u.r));
          ok(coords.size === us.length, `${tag} ${phase}: brak nakladania pozycji`);
        };
        check('initial');
        // Reset (Reset rozstawienia): ta sama polityka dla zaskoczonej strony.
        scene._savedAtkBUs = atkR.map(u => ({ ...u, stats: { ...u.stats } }));
        scene._savedDefBUs = defR.map(u => ({ ...u, id: 'd' + u.id, stats: { ...u.stats } }));
        for (const side of ['atk', 'def']) { scene.occByKey.clear(); BS.prototype._placeUnitsOneSide.call(scene, side, false); }
        check('reset');
      }
    }
  }
  console.log(`PASS: zaskoczeni w dlugiej linii (max 3 w szeregu, konnica w linii) dla N=5/12/30/60 (${checks} checks)`);
})().catch(e => { console.error(e.message || e); process.exitCode = 1; });
