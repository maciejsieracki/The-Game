'use strict';
// R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 (kryterium b / zarzut 3): zwykla bitwa (bez zasadzki) --
// rozstawienie IDENTYCZNE jak na bazie. Porownanie pozycji kazdej jednostki (id -> kolumna,wiersz)
// miedzy produkcyjna BattleScene z bazy (commit 1c452ec35, katalog podawany przez AMBUSH_BASE_GRA)
// a biezaca wersja, dla tych samych skladow i terenow; sciezki: _placeUnits (start) i _placeUnitsOneSide (Reset).
// Uruchomienie: AMBUSH_BASE_GRA=<katalog gra/ bazy z src/ i tools/> node tools/ambush-deploy-identity-test.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const BASE_GRA = process.env.AMBUSH_BASE_GRA;
if (!BASE_GRA || !fs.existsSync(path.join(BASE_GRA, 'src', 'battle', 'battleScene.ts'))) {
  console.error('SKIP: ustaw AMBUSH_BASE_GRA na katalog gra/ bazy (1c452ec35) z src/battle/battleScene.ts');
  process.exit(2);
}

async function load(graDir) {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: graDir, sourcefile: 'ident.ts' },
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
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'ident.ts' });
  return module.exports.BattleScene;
}

const unit = (id, cat, name, st = {}) => ({ id, nazwa: name, kategoria: cat, ownerColor: '#48c', hp: 100, maxHp: 100, morale: 100, stats: { Jednostka: name, Atak: 8, Obrona: 8, Pancerz: 2, Ruch: 4, ...st } });

function makeTerrain(kind) {
  let seed = 4242; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cache = new Map();
  const at = (c, r) => {
    const k = c * 1000 + r; if (cache.has(k)) return cache.get(k);
    let v = 0;
    if (kind === 'scattered') { const x = rnd(); v = x < 0.2 ? 1 : x < 0.3 ? 2 : x < 0.35 ? 3 : 0; }
    cache.set(k, v); return v;
  };
  return { at, passable: (c, r) => at(c, r) !== 3 };
}

function makeScene(BS, control, terrain) {
  const scene = Object.create(BS.prototype);
  scene.scene = { add() {} };
  scene.terrainMap = terrain;
  scene.occByKey = new Map(); scene.ownedGeos = []; scene.ownedMats = [];
  scene._deployMode = true; scene.deployPhase = false; scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1; scene._deployArcherLines = 1;
  scene._deployPlayerSideOpt = control;
  scene._playerControlSide = () => control;
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => []; scene._savedAtkBUs = scene._savedDefBUs = [];
  return scene;
}

// Mieszany sklad: piechota, lucznicy, oszczepnicy, konnica, rydwany, wodz (jak w produkcji).
function roster(n, prefix) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const m = i % 6;
    if (m === 0) out.push(unit(prefix + 'i' + i, 'miecznik', 'Wojownik'));
    else if (m === 1) out.push(unit(prefix + 'a' + i, 'lucznik', 'Łucznik', { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 4 }));
    else if (m === 2) out.push(unit(prefix + 'j' + i, 'oszczepnik', 'Oszczepnik', { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 2 }));
    else if (m === 3) out.push(unit(prefix + 'm' + i, 'konnica', 'Konnica', { Typ: 'Mount' }));
    else if (m === 4) out.push(unit(prefix + 'r' + i, 'rydwan', 'Rydwan (woły)', { Typ: 'Mount' }));
    else out.push(unit(prefix + 'i' + i, 'miecznik', 'Wojownik'));
  }
  out.push(unit(prefix + 'leader', 'dowodca', 'Wódz', { isArmyCommander: true }));
  return out;
}

function positions(scene) {
  const m = {};
  for (const side of ['atk', 'def']) {
    for (const u of scene[side]) m[side + ':' + u.bu.id] = [u.q, u.r];
  }
  return m;
}

const SIZES = [5, 12, 30, 60];
(async () => {
  const BaseBS = await load(BASE_GRA);
  const NewBS = await load(path.join(__dirname, '..'));
  let checks = 0;
  for (const terr of ['plains', 'scattered']) {
    for (const N of SIZES) {
      for (const control of ['atk', 'def']) {
        const atkR = roster(N, 'a'), defR = roster(N, 'd');
        const baseScene = makeScene(BaseBS, control, makeTerrain(terr));
        const newScene = makeScene(NewBS, control, makeTerrain(terr));
        BaseBS.prototype._placeUnits.call(baseScene, atkR, defR);
        NewBS.prototype._placeUnits.call(newScene, atkR, defR);
        const pb = positions(baseScene), pn = positions(newScene);
        assert.deepEqual(Object.keys(pn).sort(), Object.keys(pb).sort(), `${terr} N=${N} ${control} start: te same jednostki`);
        assert.deepEqual(pn, pb, `${terr} N=${N} ${control} start: pozycje zwyklej bitwy identyczne jak na bazie`);
        checks += Object.keys(pb).length;
        // Reset (_placeUnitsOneSide) na obu wersjach, po tych samych danych zapisanych.
        const saveA = atkR.map(u => ({ ...u, stats: { ...u.stats } })), saveD = defR.map(u => ({ ...u, id: 'd' + u.id, stats: { ...u.stats } }));
        for (const [BS, sc] of [[BaseBS, baseScene], [NewBS, newScene]]) {
          sc._savedAtkBUs = saveA.map(u => ({ ...u, stats: { ...u.stats } }));
          sc._savedDefBUs = saveD.map(u => ({ ...u, stats: { ...u.stats } }));
          for (const side of ['atk', 'def']) { sc.occByKey.clear(); BS.prototype._placeUnitsOneSide.call(sc, side, false); }
        }
        const rb = positions(baseScene), rn = positions(newScene);
        assert.deepEqual(rn, rb, `${terr} N=${N} ${control} reset: pozycje Reset identyczne jak na bazie`);
        checks += Object.keys(rb).length;
      }
    }
  }
  console.log(`PASS: zwykla bitwa (bez zasadzki) rozstawienie identyczne z baza 1c452ec35 (start + Reset) (${checks} porownanych pozycji)`);
})().catch(e => { console.error('FAIL', e.message || e); process.exitCode = 1; });
