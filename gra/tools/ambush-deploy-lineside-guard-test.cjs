'use strict';
// R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1: test behawioralny guarda `&& !lineSide`
// (battleScene.ts: wyliczenie mountedWing w rozstawieniu startowym ~l.5430 i w Resecie ~l.18014).
// Zaskoczona strona w dlugiej linii: konnica/rydwany zostaja W LINII (wiersze linii, <=3 w szeregu),
// a nie na skrzydlach. Bez guarda mountedWing=true dla zaskoczonej strony: kolumny konnicy tylko
// do przodu i nagroda terenu jak dla skrzydla (+6 pole zwykle zamiast +40), wiec konnica wchodzi
// w las. Test sprawdza to na realnej BattleScene (produkcyjne _placeUnits i _placeUnitsOneSide).
// Strona NIE zaskoczona (zwykla bitwa) nadal ma konnice na skrzydlach poza pasmem piechoty.
// Uwaga: mutacja tylko w Resecie (~l.18014) jest zachowaniowo rownowazna (rowLo/rowHi
// rozstrzyga najpierw lineSide, a kolumny Resetu nie czytaja mountedWing) -- patrz raport.
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function load() {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: path.join(__dirname, '..'), sourcefile: 'amb-lineside.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [require('./lib/esbuild-raw-plugin.cjs'), { name: 's', setup(b) {
      const st = (f, c) => { const ns = 'ns' + f.source; b.onResolve({ filter: f }, () => ({ path: ns, namespace: ns })); b.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents: c, loader: 'js' })); };
      st(/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();");
      st(/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";');
      st(/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";');
      st(/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};');
      st(/brandTokenVars/, 'export const CIV_BRAND_SCOPE_VARS = {}; export const ensureBrandRootTokens = () => {};');
    } }], write: false, logLevel: 'silent' });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'amb-lineside.ts' });
  return module.exports.BattleScene;
}

const unit = (id, cat, name, st = {}) => ({ id, nazwa: name, kategoria: cat, ownerColor: '#48c', hp: 100, maxHp: 100, morale: 100, stats: { Jednostka: name, Atak: 8, Obrona: 8, Pancerz: 2, Ruch: 4, ...st } });

// Teren losowy z ziarnem: 0 rownina, 1 las, 2 wzgorza, 3 rzeka (nieprzechodnia), jak BTerrain.
const BT_PLAINS = 0, BT_FOREST = 1, BT_HILLS = 2, BT_RIVER = 3;
function makeTerrain(kind, seedStart) {
  let seed = seedStart; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cache = new Map();
  const at = (c, r) => {
    const k = c * 1000 + r; if (cache.has(k)) return cache.get(k);
    let v = 0;
    if (kind === 'scattered') { const x = rnd(); v = x < 0.2 ? BT_FOREST : x < 0.3 ? BT_HILLS : x < 0.35 ? BT_RIVER : BT_PLAINS; }
    cache.set(k, v); return v;
  };
  return { at, passable: (c, r) => at(c, r) !== BT_RIVER };
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

// Konnica i rydwany co trzecia jednostka: przewaga jezdnych, zeby ujawnic lazy w linii.
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
const SEEDS = 20;
// Prog udzialu konnicy/rydwanow zaskoczonej linii stojacych w lesie (setup, ziarna 1..SEEDS). Zmierzono na ziarnach 1..40:
// baza 0 / 0 / 1,8 % (N=12/30/60), mutacja bez guarda 0 / 4,0 % / 12,8 % (N=12/30/60).
const FOREST_MOUNTED_SHARE_MAX = 0.03;
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

function unitsOf(scene, side) { return scene[side]; }

(async () => {
  const BS = await load();

  // (1) Zaskoczona strona w dlugiej linii: setup i Reset, wszystkie typy, rowne tempo z pasmem linii.
  for (const terr of ['plains', 'scattered']) {
    for (const N of SIZES) {
      const cases = [
        { name: 'A: AI zaskoczony def', control: 'atk', surprised: 'def', line: 'def' },
        { name: 'B: gracz zaskoczony atk', control: 'atk', surprised: 'atk', line: 'atk' },
        { name: 'C: gracz zaskoczony def', control: 'def', surprised: 'def', line: 'def' },
      ];
      for (const c of cases) {
        for (let seed = 1; seed <= 3; seed++) {
          const terrain = makeTerrain(terr, 777 * seed);
          const atkR = roster(N, 'a'), defR = roster(N, 'd');
          const tag = `N=${N} [${terr}] seed=${seed} ${c.name}`;
          const scene = makeScene(BS, { control: c.control, surprised: c.surprised, terrain });
          BS.prototype._placeUnits.call(scene, atkR, defR);
          const band = scene._ambushLineRowBand();
          const check = (phase) => {
            const us = unitsOf(scene, c.line);
            ok(us.length === N, `${tag} ${phase}: wszystkie ${N} jednostek zaskoczonych rozstawione (jest ${us.length})`);
            const rows = us.map(u => u.r);
            const mn = Math.min(...rows), mx = Math.max(...rows);
            ok(mn >= band[0] && mx <= band[1], `${tag} ${phase}: linia zaskoczonych w wierszach ${band[0]}..${band[1]} (jest ${mn}..${mx})`);
            const perCol = new Map();
            for (const u of us) perCol.set(u.q, (perCol.get(u.q) || 0) + 1);
            const maxCol = Math.max(...perCol.values());
            ok(maxCol <= 3, `${tag} ${phase}: najwyzej 3 jednostki w szeregu poprzek (max ${maxCol})`);
            const mounted = us.filter(u => u.mounted);
            ok(mounted.length > 0, `${tag} ${phase}: konnica/rydwany obecne w linii (${mounted.length})`);
            const coords = new Set(us.map(u => u.q + ',' + u.r));
            ok(coords.size === us.length, `${tag} ${phase}: brak nakladania pozycji`);
          };
          check('initial');
          // Reset: ten sam kontrakt linii dla zaskoczonej strony.
          scene._savedAtkBUs = atkR.map(u => ({ ...u, stats: { ...u.stats } }));
          scene._savedDefBUs = defR.map(u => ({ ...u, id: 'd' + u.id, stats: { ...u.stats } }));
          for (const side of ['atk', 'def']) { scene.occByKey.clear(); BS.prototype._placeUnitsOneSide.call(scene, side, false); }
          check('reset');
        }
      }
    }
  }

  // (2) Dlugosc linii a las: konnica/rydwany zaskoczonej linii nie stoja w lesie ponad prog (setup, ziarna 1..SEEDS).
  // Mutacja bez guarda: mountedWing=true -> brak premii terenu linii, konnica wchodzi w las.
  for (const N of [12, 30, 60]) {
    let mountedTotal = 0, mountedForest = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const terrain = makeTerrain('scattered', seed);
      const atkR = roster(N, 'a'), defR = roster(N, 'd');
      const scene = makeScene(BS, { control: 'atk', surprised: 'def', terrain });
      BS.prototype._placeUnits.call(scene, atkR, defR);
      for (const u of scene.def) {
        if (!u.mounted) continue;
        mountedTotal++;
        if (terrain.at(u.q, u.r) === BT_FOREST) mountedForest++;
      }
    }
    const share = mountedTotal ? mountedForest / mountedTotal : 0;
    console.log(`  zmierzone: N=${N} konnica/rydwany zaskoczonej linii w lesie ${mountedForest}/${mountedTotal} (${(share * 100).toFixed(2)} %)`);
    ok(share <= FOREST_MOUNTED_SHARE_MAX,
      `N=${N} zaskoczona linia: konnica/rydwany w lesie ${mountedForest}/${mountedTotal} = ${(share * 100).toFixed(2)} % (prog <= ${(FOREST_MOUNTED_SHARE_MAX * 100).toFixed(0)} %)`);
  }

  // (3) Strona NIE zaskoczona (zwykla bitwa, takze strona atakujaca): konnica na skrzydlach,
  // poza pasmem wierszy piechoty (rowLo/rowHi skrzydla). Guard nie dotyka tej galezi.
  for (const N of [12, 30, 60]) {
    for (let seed = 1; seed <= 3; seed++) {
      const terrain = makeTerrain('plains', 777 * seed);
      const atkR = roster(N, 'a'), defR = roster(N, 'd');
      const scene = makeScene(BS, { control: 'atk', surprised: undefined, terrain });
      BS.prototype._placeUnits.call(scene, atkR, defR);
      for (const side of ['atk', 'def']) {
        const us = unitsOf(scene, side);
        const body = us.filter(u => !u.mounted).map(u => u.r);
        const mounted = us.filter(u => u.mounted);
        ok(mounted.length > 0 && body.length > 0, `N=${N} seed=${seed} ${side} normalna bitwa: jest piechota i konnica`);
        const bMin = Math.min(...body), bMax = Math.max(...body);
        const onWing = mounted.filter(u => u.r < bMin || u.r > bMax).length;
        ok(onWing === mounted.length, `N=${N} seed=${seed} ${side} normalna bitwa: cala konnica na skrzydlach poza piechota ${bMin}..${bMax} (poza: ${onWing}/${mounted.length})`);
      }
    }
  }

  console.log(`PASS: zaskoczona linia trzyma konnice/rydwany w linii (setup+Reset, N=5/12/30/60, las ${FOREST_MOUNTED_SHARE_MAX * 100} %), normalna bitwa ma konnice na skrzydlach (${checks} checks)`);
})().catch(e => { console.error(e.message || e); process.exitCode = 1; });
