// P6 BATTLE-SETUP (dispatch R-RUSTPORT-P6-BATTLE-SETUP-Q1, runda 1 = T5a: teren + mur, Operator): generator wektorow
// dla `rust-port/engine/src/domain/battle_setup*.rs`.
//
// Uruchomienie: node rust-port/engine/tests/p6_battle_setup_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS; `rustc` w PATH dla fikstury renderera). Wynik: tests/p6_battle_setup_vectors/{vectors,renderer_parity}.json.
// Ziarno 7101.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show), strażnik SHA-256 każdego pliku/wycinka:
// * `gra/src/battle/battle-terrain.ts` CALY plik (generateBattleTerrain, presetForWorldTerrain, tileJitter, xmur3,
//   mulberry32, makeRng, pickFromRanges); na koncu dopisany JEDEN wiersz eksportu prywatnych funkcji
//   (`export { xmur3, mulberry32, makeRng, pickFromRanges }`), zeby wektory RNG mialy wejscie bez zmian logiki.
// * `gra/src/battle/battleScene.ts` wycinki: DIR_DELTA/DIRS4 (326-337), BT_DEBUG_PRESETS + debugWorldTerrainOverride
//   (613-634; w Node `window` nie istnieje -> undefined, jak w produkcji bez `?bt=`), stale pola (661-672),
//   inPlayable (674-676), MAX_PER_SIDE..DEF_COL_STEP (721-767), deployClearRanksFor/battleClearRanks/battleSafeCols
//   (793-836), clampEra (922-925), cellToWorld (1780-1782), isFordTile (1897-1899), pola klasy (2439-2461, 2501, 2507),
//   konstruktor: fortKind/brickWallRed/_siegeDefCiv (2741-2743), _defenderEra (2770), teren + wyciecia (2776-2817),
//   mur w scenie (3478-3483 bez _buildBattlefield i _buildSiegeInteriorBuildings - dekor), metody _carveBattleBox
//   (3917-3998), _fencePlayableZone (4004-4013), _carveWallTiles (4026-4065), _placeSiegeWall (4075-4148),
//   _placeSiegeTowers (4158-4191).
// * `gra/src/game/city-towers.ts`, `gra/src/game/city-fortification.ts` CALE pliki.
// * `gra/src/game/combat.ts` normTerrain (620-624), findTerrainEntry (706-710), cavalryTerrainMultiplier (756-772).
// * dane pinu: `gra/data/miasto-params.json`, `gra/data/units.json`, `gra/data/terrain-combat.json`.
//
// STUBY (bez logiki gry): THREE/scena (`buildSiegeWall`, `attachRowBreachPanels`, `buildWallTower`, `mountSiegeHud1E`,
// `document`, `requestAnimationFrame`, `this.scene.add`, `this.overlay`, metody HUD). Math.random: tekst ustawienia
// pola (wycinki wyzej) NIE wola Math.random - generator podmienia Math.random na funkcje rzucajaca wyjatek na czas
// wykonania scenariuszy (D-BS-3: brak Math.random w ustawieniu, sprawdzone wykonaniem).
//
// Fikstura renderera (D-BS-4 / GOAL p.4): `rust-port/renderer/src/battle/field.rs` - wycinki `tile_jitter`,
// `carve_wall_tiles`, `TerrainGrid::set_index` i stale; generator sklada z nich samodzielny plik Rust, kompiluje `rustc`
// i zapisuje wyniki renderera dla wejsc scenariuszy do `renderer_parity.json` (z FNV-1a 64 tekstu wycinkow). Test
// silnika porownuje sie z fikstura i sprawdza FNV wycinkow w biezacym pliku renderera (tylko odczyt tekstu, bez crate).

import { writeFileSync, readFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const TERRAIN_TS = 'gra/src/battle/battle-terrain.ts';
const SCENE = 'gra/src/battle/battleScene.ts';
const TOWERS = 'gra/src/game/city-towers.ts';
const FORT = 'gra/src/game/city-fortification.ts';
const COMBAT = 'gra/src/game/combat.ts';
const SEED = 7101;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// ---------------------------------------------------------------- straznicy SHA-256 calych plikow pinu
const terrainText = gitShow(TERRAIN_TS);
const towersText = gitShow(TOWERS);
const fortText = gitShow(FORT);
const FILE_SHA = {
  [TERRAIN_TS]: 'a17735ed3ef7b20277cfba3aee9e9aa478c5a0e71481f747dc04cd365fb8f00d',
  [TOWERS]: 'cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4',
  [FORT]: '52fd18e913d1e59fdfed5874e9b56323d25058a39a55cbae2f0abfd2f6af4610',
};
const fileShaNow = { [TERRAIN_TS]: sha256(terrainText), [TOWERS]: sha256(towersText), [FORT]: sha256(fortText) };

const sceneLines = gitShow(SCENE).split('\n');
const combatLines = gitShow(COMBAT).split('\n');
const L = (lines, a, b) => lines.slice(a - 1, b).join('\n');
const expectLine = (lines, file, n, needle) => {
  if (!lines[n - 1].includes(needle)) throw new Error(`pin ${file}:${n} nie zawiera "${needle}"`);
};

// [od, do, pierwszy wiersz zawiera, ostatni wiersz zawiera]
const SCENE_TOP = [
  [326, 331, 'const DIR_DELTA', '];'],
  [337, 337, 'const DIRS4', 'DIR_DELTA;'],
  [613, 622, 'const BT_DEBUG_PRESETS', '};'],
  [625, 634, 'function debugWorldTerrainOverride', '}'],
  [661, 672, 'const BF_COLS = 68', 'const PLAY_MID_ROW'],
  [674, 676, 'function inPlayable(', '}'],
  [721, 767, 'const MAX_PER_SIDE = 500', 'const DEF_COL_STEP'],
  [793, 836, 'function deployClearRanksFor(', '}'],
  [922, 925, 'function clampEra(', '}'],
  [1780, 1782, 'function cellToWorld(', '}'],
  [1897, 1899, 'function isFordTile(', '}'],
];
const SCENE_FIELDS = [
  [2439, 2461, 'private _siegeDefCiv', 'private siegeWallRowHi'],
  [2501, 2501, 'private wallTileHp = new Map', 'private wallTileHp = new Map'],
  [2507, 2507, 'private static readonly WALL_TILE_HP = 640;', 'WALL_TILE_HP = 640;'],
];
const SCENE_CTOR = [
  [2741, 2743, 'this.fortKind = cityFortificationKind(opts.siege?.builtBuildingIds);', 'this._siegeDefCiv ='],
  [2770, 2770, 'this._defenderEra = clampEra(opts.defenderEra);', 'clampEra'],
  [2776, 2817, '// World-hex-derived terrain preset', '}'],
  [3478, 3483, 'if (opts.siege) {', '}'],
];
const SCENE_METHODS = [
  [3917, 3998, 'private _carveBattleBox(presetActive: boolean, sideCap: number): void {', '  }'],
  [4004, 4013, 'private _fencePlayableZone(): void {', '  }'],
  [4026, 4065, 'private _carveWallTiles(): void {', '  }'],
  [4075, 4148, 'private _placeSiegeWall(civ:', '  }'],
  [4158, 4191, 'private _placeSiegeTowers(wallCol: number, rLo: number, rHi: number): void {', '  }'],
];
const COMBAT_FRAG = [
  [620, 624, 'export function normTerrain(', '}'],
  [706, 710, 'function findTerrainEntry(', '}'],
  [756, 772, 'export function cavalryTerrainMultiplier(', '}'],
];
const checkFrags = (lines, file, frags) =>
  frags.map(([a, b, first, last]) => {
    expectLine(lines, file, a, first);
    expectLine(lines, file, b, last);
    return L(lines, a, b);
  });
const sceneTop = checkFrags(sceneLines, SCENE, SCENE_TOP);
const sceneFields = checkFrags(sceneLines, SCENE, SCENE_FIELDS);
const sceneCtor = checkFrags(sceneLines, SCENE, SCENE_CTOR);
const sceneMethods = checkFrags(sceneLines, SCENE, SCENE_METHODS);
const combatFrags = checkFrags(combatLines, COMBAT, COMBAT_FRAG);
// _buildBattlefield (3477) i _buildSiegeInteriorBuildings (3482) to dekor sceny 3D: w wycinku 3478-3483 zostaje tylko
// wywolanie _placeSiegeWall; wiersz dekoru jest usuwany jawnie (strażnik niżej sprawdza, że jest dokładnie jeden).
const ctorSiege = sceneCtor[3].split('\n');
const decorIdx = ctorSiege.findIndex((l) => l.includes('this._buildSiegeInteriorBuildings();'));
if (decorIdx < 0) throw new Error('pin: brak _buildSiegeInteriorBuildings w 3478-3483');
ctorSiege.splice(decorIdx, 1);
sceneCtor[3] = ctorSiege.join('\n');
const fragText = [...sceneTop, ...sceneFields, ...sceneCtor, ...sceneMethods, ...combatFrags].join('\n----\n');
const FRAG_SHA = '21984ff20c8d13b0446a3e01f655453b50efc9d80ee4f73d8488e95622c3a6d3';
const fragShaNow = sha256(fragText);

const shaOk = (want, now) => want === now;
for (const [f, want] of Object.entries(FILE_SHA)) {
  if (!shaOk(want, fileShaNow[f])) throw new Error(`SHA-256 ${f}: ${fileShaNow[f]} != ${want}`);
}
if (!shaOk(FRAG_SHA, fragShaNow)) throw new Error(`SHA-256 wycinkow: ${fragShaNow} != ${FRAG_SHA}`);

// ---------------------------------------------------------------- transpilacja
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const req = createRequire(import.meta.url);
const tsLib = req(TS_JS);
const transpile = (src) =>
  tsLib.transpileModule(src, {
    compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
  }).outputText;
const loadModule = (src, deps = {}) => {
  const mod = { exports: {} };
  const requireStub = (name) => {
    if (name in deps) return deps[name];
    throw new Error(`require(${name}) niedozwolone w wykonaniu pinu`);
  };
  new Function('module', 'exports', 'require', transpile(src))(mod, mod.exports, requireStub);
  return mod.exports;
};

const BT = loadModule(terrainText + '\nexport { xmur3, mulberry32, makeRng, pickFromRanges };\n');
const FORTM = loadModule(fortText);
const TOWERM = loadModule(towersText, { './city-fortification': FORTM });
const miastoParams = JSON.parse(gitShow('gra/data/miasto-params.json'));
const unitsData = JSON.parse(gitShow('gra/data/units.json'));
const terrainData = JSON.parse(gitShow('gra/data/terrain-combat.json'));

const COMBAT_SRC = combatFrags.join('\n') + '\nmodule.exports = { normTerrain, findTerrainEntry, cavalryTerrainMultiplier };\n';
const COMBATM = loadModule(COMBAT_SRC);

// ---------------------------------------------------------------- harness sceny
let genCapture = null;
const genWrapped = (opts) => {
  const tm = BT.generateBattleTerrain(opts);
  genCapture = { opts, tiles: Uint8Array.from(tm.tiles) };
  return tm;
};
const sceneStubs = {
  generateBattleTerrain: genWrapped,
  presetForWorldTerrain: BT.presetForWorldTerrain,
  BTerrain: BT.BTerrain,
  cityFortificationKind: FORTM.cityFortificationKind,
  towerMaterialFor: TOWERM.towerMaterialFor,
  towerRows: TOWERM.towerRows,
  strongestRangedUnitForEra: TOWERM.strongestRangedUnitForEra,
  towerRangeFor: TOWERM.towerRangeFor,
  DEFAULT_TOWER_SPACING: TOWERM.DEFAULT_TOWER_SPACING,
  DEFAULT_TOWER_MIN_RANGE: TOWERM.DEFAULT_TOWER_MIN_RANGE,
  miastoParamsData: miastoParams,
  unitsDataForTowers: unitsData,
  // --- atrapy 3D (bez logiki gry) ---
  buildSiegeWall: () => ({ rotation: {}, position: { set() {} }, traverse() {} }),
  attachRowBreachPanels: () => {},
  buildWallTower: () => ({ clone: () => ({ position: { set() {} }, traverse() {} }) }),
  mountSiegeHud1E: () => {},
  document: { createElement: () => ({ style: {} }) },
  requestAnimationFrame: () => 0,
};
const stubNames = Object.keys(sceneStubs);
const harnessSrc = [
  ...sceneTop,
  'class BattleScene {',
  ...sceneFields,
  '  scene = { add() {} };',
  '  overlay = { appendChild() {} };',
  '  ownedGeos = []; ownedMats = [];',
  '  _battleData = {};',
  '  _updateSiegeHud() {} _syncSiegeHudChromeVisibility() {} _syncSiegeHudLayout() {}',
  '  constructor(opts) {',
  ...sceneCtor,
  '  }',
  ...sceneMethods,
  '}',
  'module.exports = { Harness: BattleScene, battleClearSideCap, battleClearRanks, battleSafeCols, deployClearRanksFor, isFordTile,',
  '  consts: { BF_COLS, BF_ROWS, PLAYABLE_COLS, PLAYABLE_ROWS, PLAY_COL0, PLAY_ROW0, PLAY_COL1, PLAY_ROW1, PLAY_MID_COL,',
  '    PLAY_MID_ROW, MAX_PER_SIDE, RANK_WIDTH, CLEAR_DEPTH_BASE_CAP, DEPLOY_MARGIN, FRONT_GAP, ATK_FRONT_COL,',
  '    DEF_FRONT_COL, ATK_COL_STEP, DEF_COL_STEP } };',
].join('\n');
const harnessJs = transpile(harnessSrc);
const hmod = { exports: {} };
new Function('module', 'exports', ...stubNames, harnessJs)(hmod, hmod.exports, ...stubNames.map((k) => sceneStubs[k]));
const H = hmod.exports;

// Snapshoty po kazdym etapie (wrap metod klasy pinu; tekst metod bez zmian).
const snaps = {};
for (const m of ['_carveBattleBox', '_fencePlayableZone', '_carveWallTiles']) {
  const orig = H.Harness.prototype[m];
  H.Harness.prototype[m] = function (...a) {
    const r = orig.apply(this, a);
    snaps[m] = Uint8Array.from(this.terrainMap.tiles);
    return r;
  };
}

// ---------------------------------------------------------------- kodowanie
const rle = (tiles) => {
  const out = [];
  let i = 0;
  while (i < tiles.length) {
    let j = i;
    while (j < tiles.length && tiles[j] === tiles[i]) j++;
    out.push(`${tiles[i]}*${j - i}`);
    i = j;
  }
  return out.join('.');
};
const num = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : Object.is(x, -0) ? '-0' : x);
const f64hex = (x) => Buffer.from(new Float64Array([x]).buffer).reverse().toString('hex');
const presetJson = (p) => ({
  forestBlobsMul: num(p.forestBlobsMul),
  hillBlobsMul: num(p.hillBlobsMul),
  rockCountMul: num(p.rockCountMul),
  hillRadiusBoost: num(p.hillRadiusBoost),
  riverMode: p.riverMode,
  fordCount: p.fordCount === undefined ? null : p.fordCount,
  lakeCount: p.lakeCount === undefined ? null : [...p.lakeCount],
  edgeRocks: p.edgeRocks,
  noForest: p.noForest,
  desertPalette: p.desertPalette,
  biasSafeCols: p.biasSafeCols,
  isMountain: p.isMountain,
});

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = mulberry(SEED);
const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
const pick = (a) => a[Math.floor(R() * a.length)];

// ---------------------------------------------------------------- Math.random zablokowany w wykonaniu pinu
const realRandom = Math.random;
let randomCalls = 0;
Math.random = () => {
  randomCalls++;
  throw new Error('Math.random w ustawieniu pola bitwy (D-BS-3)');
};

// ---------------------------------------------------------------- 1) stale i funkcje pola
const consts = H.consts;
const SIDE_INPUTS = [0, 1, 40, 119, 120, 121, 130.5, 240, 499, 500, 501, 600, 1e9, -5, -Infinity, Infinity, NaN, -0, 0.5];
const sideCap = [];
for (const a of SIDE_INPUTS) for (const b of [0, 60, 120, 250, 500, 700, NaN, Infinity]) {
  sideCap.push({ a: num(a), b: num(b), cap: num(H.battleClearSideCap(a, b)) });
}
const clearRanks = [];
for (const presetActive of [false, true]) for (const cap of [120, 121, 130, 200, 240, 241, 499, 500, NaN, Infinity, 0, -1]) {
  const sc = H.battleSafeCols(presetActive, cap);
  clearRanks.push({
    presetActive,
    cap: num(cap),
    ranks: num(H.battleClearRanks(presetActive, cap)),
    deploy: num(H.deployClearRanksFor(presetActive, cap)),
    safeCols: sc.map(([lo, hi]) => [num(lo), num(hi)]),
  });
}
// Obrona r1 (zarzut Evaluatora E11): przemiatanie sideCap 0..520 (co 1) i polowki - obejmuje glebokosc 21 (zakresy
// jednokolumnowe [10,10] i [57,57], filtr `hi >= lo`) oraz glebokosci > 31 (k = 31 daje kolumny 0 i 67).
for (const presetActive of [false, true]) for (let cap = 0; cap <= 520; cap += 0.5) {
  const sc = H.battleSafeCols(presetActive, cap);
  clearRanks.push({
    presetActive,
    cap: num(cap),
    ranks: num(H.battleClearRanks(presetActive, cap)),
    deploy: num(H.deployClearRanksFor(presetActive, cap)),
    safeCols: sc.map(([lo, hi]) => [num(lo), num(hi)]),
  });
}

// Obrona r1 (zarzut Evaluatora E7): `_carveBattleBox` pinu wykonany na syntetycznej siatce, w ktorej kazdy kafel
// rodzaju innego niz Plains (takze kolumny 0 i 67, poza strefa gry) - widac kazda kolumne pasma, takze k >= 31.
const boxes = [];
{
  const synth = () => {
    const t = new Uint8Array(consts.BF_COLS * consts.BF_ROWS);
    for (let r = 0; r < consts.BF_ROWS; r++) for (let c = 0; c < consts.BF_COLS; c++) {
      t[r * consts.BF_COLS + c] = 1 + ((c * 5 + r * 3 + ((c * r) % 7)) % 7);
    }
    return t;
  };
  const input = synth();
  for (const presetActive of [false, true]) for (const cap of [0, 120, 150, 210, 240, 380, 500, 1e6, NaN, -1]) {
    const tiles = Uint8Array.from(input);
    H.Harness.prototype._carveBattleBox.call({ terrainMap: { tiles } }, presetActive, cap);
    boxes.push({ presetActive, cap: num(cap), tiles: rle(tiles) });
  }
  for (const k of Object.keys(snaps)) delete snaps[k];
  boxes.unshift({ input: rle(input) });
}

// ---------------------------------------------------------------- 2) presetForWorldTerrain
const BAZY = ['laka', 'rownina', 'wzgorza', 'gory', 'pustynia', 'plytkie_morze', 'tundra', '', 'LAKA', '  Gory ',
  ' rownina﻿', 'GÓRY', 'Łąka', 'wzgorza ', 'plytkie_morze ', 'Pustynia\t', 'las', 'rzeka', 'gory​'];
const presets = [{ wt: null, preset: presetJson(BT.presetForWorldTerrain(undefined)) }];
for (const baza of BAZY) for (const las of [undefined, false, true]) for (const rzeka of [undefined, false, true]) {
  const wt = { baza };
  if (las !== undefined) wt.las = las;
  if (rzeka !== undefined) wt.rzeka = rzeka;
  presets.push({ wt: { baza, las: las ?? null, rzeka: rzeka ?? null }, preset: presetJson(BT.presetForWorldTerrain(wt)) });
}

// ---------------------------------------------------------------- 3) RNG, tileJitter, pickFromRanges
const SEEDS = ['battle', 'bf:Równina:68x156', 'bf:Wzgórza:68x156', '', 'a', 'bf:Łąka ŻÓŁW:68x156', 'emoji \u{1F600} x',
  'bf:Góry:68x156', 'x'.repeat(300), 'bf:plytkie_morze:20x30'];
const rngVec = SEEDS.map((s) => {
  const g = BT.makeRng(s);
  return { seed: s, first: Array.from({ length: 12 }, () => f64hex(g())) };
});
const jitter = [];
for (let k = 0; k < 400; k++) {
  const c = k < 40 ? k - 5 : ri(-3000, 3000);
  const r = k < 40 ? 155 - k : ri(-3000, 3000);
  const s = pick([0, 1, 2, 3, 5, 50, 811, 812, 813, 814, 815, 2147483646, -7]);
  jitter.push([c, r, s, f64hex(BT.tileJitter(c, r, s))]);
}
const pfr = [];
for (let k = 0; k < 200; k++) {
  const n = ri(0, 4);
  const ranges = Array.from({ length: n }, () => {
    const lo = ri(-3, 40);
    return [lo, lo + ri(-3, 12)];
  });
  const seed = 'pfr:' + k;
  const g = BT.makeRng(seed);
  let used = 0;
  const counting = () => { used++; return g(); };
  const v = BT.pickFromRanges(counting, ranges);
  pfr.push({ seed, ranges, value: v, used });
}

// ---------------------------------------------------------------- 4) generateBattleTerrain: losowe opcje
const customPreset = () => {
  const p = BT.presetForWorldTerrain(R() < 0.25 ? undefined : { baza: pick(BAZY.slice(0, 8)), las: R() < 0.3, rzeka: R() < 0.4 });
  const q = { ...p };
  if (R() < 0.35) {
    q.riverMode = pick(['winding', 'none', 'wide', 'coast']);
    if (R() < 0.5) q.fordCount = ri(1, 6); else delete q.fordCount;
    if (R() < 0.4) q.lakeCount = [ri(0, 2), ri(2, 5)]; else if (R() < 0.5) delete q.lakeCount;
    q.biasSafeCols = R() < 0.5;
    q.edgeRocks = R() < 0.5;
    q.noForest = R() < 0.2;
    q.isMountain = R() < 0.3;
    q.hillRadiusBoost = ri(0, 2);
    q.forestBlobsMul = pick([0, 0.4, 1, 1.1, 2.2]);
    q.hillBlobsMul = pick([0, 0.3, 1, 3.5, 5]);
    q.rockCountMul = pick([0.6, 1, 1.8, 2.6]);
  }
  return q;
};
const gens = [];
for (let k = 0; k < 220; k++) {
  const big = k % 25 === 0;
  const cols = big ? 68 : ri(-2, 34);
  const rows = big ? 156 : ri(-2, 44);
  const opts = { cols, rows };
  if (R() < 0.85) opts.seed = 'gen:' + k + (R() < 0.3 ? ':Łąka' : '');
  if (R() < 0.7) opts.deployMargin = ri(-2, 12);
  if (R() < 0.6) opts.rowMargin = ri(-2, 30);
  if (R() < 0.6) {
    const n = ri(0, 4);
    opts.safeCols = Array.from({ length: n }, () => {
      const lo = ri(-2, Math.max(1, cols));
      return [lo, lo + ri(-2, 8)];
    });
  }
  if (R() < 0.85) opts.preset = customPreset();
  const tm = BT.generateBattleTerrain(opts);
  gens.push({
    opts: {
      cols, rows,
      seed: opts.seed ?? null,
      deployMargin: opts.deployMargin ?? null,
      rowMargin: opts.rowMargin ?? null,
      safeCols: opts.safeCols ?? null,
      preset: opts.preset ? presetJson(opts.preset) : null,
    },
    cols: tm.cols,
    rows: tm.rows,
    tiles: rle(tm.tiles),
  });
}

// ---------------------------------------------------------------- 5) scenariusze pelnego ustawienia (konstruktor pinu)
const army = (n) => (Number.isFinite(n) && n >= 0 && n < 5000 ? new Array(n).fill(null) : { length: n });
const SCEN = [
  { id: 'legacy-40v40', teren: 'Równina', atk: 40, def: 40 },
  { id: 'legacy-siege-mur', teren: 'Wzgórza', atk: 60, def: 35, siege: { builtBuildingIds: ['mury'] } },
  { id: 'laka-palisada', teren: 'Łąka', atk: 10, def: 12, wt: { baza: 'laka' }, siege: { builtBuildingIds: ['palisada'] } },
  { id: 'rownina-130', teren: 'Równina', atk: 130, def: 90, wt: { baza: 'rownina' } },
  { id: 'rownina-rzeka', teren: 'Równina', atk: 50, def: 70, wt: { baza: 'rownina', rzeka: true } },
  { id: 'wzgorza-cytadela-500', teren: 'Wzgórza', atk: 500, def: 600, wt: { baza: 'wzgorza' }, siege: { builtBuildingIds: ['mury', 'fort'] } },
  { id: 'gory-bez-obwarowan', teren: 'Góry', atk: 1, def: 1, wt: { baza: 'gory' }, siege: { builtBuildingIds: [] } },
  { id: 'pustynia-mury-kamienne', teren: 'Pustynia', atk: 80, def: 80, wt: { baza: 'pustynia' }, siege: { builtBuildingIds: ['mury_kamienne'] } },
  { id: 'wybrzeze', teren: 'Wybrzeże / Morze', atk: 20, def: 30, wt: { baza: 'plytkie_morze' } },
  { id: 'laka-las', teren: 'Las', atk: 45, def: 45, wt: { baza: 'laka', las: true } },
  { id: 'gory-rzeka-palisada', teren: 'Góry', atk: 250, def: 100, wt: { baza: 'gory', rzeka: true }, siege: { builtBuildingIds: ['palisada'] } },
  { id: 'nieznana-baza', teren: 'Tundra', atk: 121, def: 3, wt: { baza: 'tundra' } },
  { id: 'wzgorza-las-rzeka', teren: 'Wzgórza', atk: 70, def: 20, wt: { baza: 'wzgorza', las: true, rzeka: true } },
  { id: 'pustynia-rzeka-las', teren: 'Pustynia', atk: 33, def: 77, wt: { baza: 'pustynia', las: true, rzeka: true } },
  { id: 'nan-liczebnosc', teren: 'Równina', atk: NaN, def: 40, wt: { baza: 'laka' }, siege: { builtBuildingIds: ['mury'] } },
  { id: 'inf-liczebnosc', teren: 'Równina', atk: Infinity, def: NaN },
  { id: 'ujemna-liczebnosc', teren: '', atk: -7, def: -Infinity, wt: { baza: 'rownina', rzeka: true } },
  // Odstep wiezyczek z danych (miasto-params.json `wieze_strzeleckie_odstep_kafli`): inne wartosci niz 4 i brak klucza
  // (`?? DEFAULT_TOWER_SPACING`) - rzedy bramy 76-77 trafiaja w siatke wiez tylko przy innych odstepach niz 4.
  { id: 'odstep-wiez-2', teren: 'Równina', atk: 30, def: 30, siege: { builtBuildingIds: ['mury'] }, spacing: 2 },
  { id: 'odstep-wiez-1', teren: 'Równina', atk: 30, def: 30, siege: { builtBuildingIds: ['palisada'] }, spacing: 1 },
  { id: 'odstep-wiez-3', teren: 'Równina', atk: 30, def: 30, siege: { builtBuildingIds: ['fort'] }, spacing: 3 },
  { id: 'odstep-wiez-brak', teren: 'Równina', atk: 30, def: 30, siege: { builtBuildingIds: ['mury'] }, spacing: null },
];
const scenarios = [];
const fenceInputs = [];
for (const s of SCEN) {
  for (const k of Object.keys(snaps)) delete snaps[k];
  genCapture = null;
  const opts = { attacker: army(s.atk), defender: army(s.def), teren: s.teren };
  if (s.wt) opts.worldTerrain = s.wt;
  if (s.siege) opts.siege = s.siege;
  const SPK = 'wieze_strzeleckie_odstep_kafli';
  const savedSpacing = miastoParams[SPK];
  if (s.spacing === null) delete miastoParams[SPK];
  else if (s.spacing !== undefined) miastoParams[SPK] = { ...savedSpacing, wartosc: s.spacing };
  const h = new H.Harness(opts);
  miastoParams[SPK] = savedSpacing;
  const go = genCapture.opts;
  const out = {
    id: s.id,
    input: {
      teren: s.teren,
      attackers: num(s.atk),
      defenders: num(s.def),
      worldTerrain: s.wt ? { baza: s.wt.baza, las: s.wt.las ?? null, rzeka: s.wt.rzeka ?? null } : null,
      siege: s.siege ? { builtBuildingIds: s.siege.builtBuildingIds } : null,
      towerSpacing: s.spacing === undefined ? savedSpacing.wartosc : s.spacing,
    },
    gen: {
      cols: go.cols, rows: go.rows, seed: go.seed, deployMargin: go.deployMargin, rowMargin: go.rowMargin,
      safeCols: go.safeCols.map(([a, b]) => [num(a), num(b)]),
      preset: presetJson(go.preset),
      tiles: rle(genCapture.tiles),
    },
    afterBox: rle(snaps._carveBattleBox),
    afterFence: rle(snaps._fencePlayableZone),
    afterWall: snaps._carveWallTiles ? rle(snaps._carveWallTiles) : null,
    final: rle(h.terrainMap.tiles),
    desertPalette: h._desertPalette,
    fortKind: h.fortKind,
    siegeWallCol: h.siegeWallCol,
    siegeWallRowLo: h.siegeWallRowLo,
    siegeWallRowHi: h.siegeWallRowHi,
    siegeGateCol: h.siegeGateCol,
    siegeGateRow: h.siegeGateRow,
    gateHp: h.gateHp,
    gateOpen: h.gateOpen,
    siegeWallTilesInit: h.siegeWallTilesInit,
    wallTileHp: [...h.wallTileHp.entries()],
    towerRows: h.siegeTowers.map((t) => t.row),
  };
  // Sondy terenu ruchu (MoveTerrain): passable / moveCost / isFordTile / cavalryTerrainMultiplier(combatTerrainName).
  const tm = h.terrainMap;
  const probes = [];
  const probe = (c, r) => {
    const t = tm.at(c, r);
    probes.push({
      c: num(c), r: num(r),
      at: t === undefined ? null : t,
      passable: tm.passable(c, r),
      moveCost: num(tm.moveCost(c, r)),
      ford: H.isFordTile(tm, c, r),
      name: tm.combatTerrainName(c, r),
      cav: num(COMBATM.cavalryTerrainMultiplier(tm.combatTerrainName(c, r), terrainData)),
    });
  };
  for (let k = 0; k < 160; k++) probe(ri(-2, 69), ri(-2, 157));
  for (const [c, r] of [[0.5, 0], [0, 0.5], [3, 0.5], [40, 77], [40, 76], [40, 75], [NaN, 3], [3, NaN], [-0, 5], [67.9999, 1],
    [68, 0], [0, 156], [Infinity, 2], [-1, -1], [1e300, 2], [12.25, 40]]) probe(c, r);
  out.probes = probes;
  scenarios.push(out);
  if (snaps._fencePlayableZone) fenceInputs.push({ id: s.id, tiles: snaps._fencePlayableZone });
}
Math.random = realRandom;
if (randomCalls !== 0) throw new Error('Math.random wywolany');

// ---------------------------------------------------------------- 5b) Math.sin (V8) na dziedzinie szerokiej rzeki
// Argumenty jak w `riverMode === 'wide'`: ((r - rowMargin) / wavelength) * PI * 2 + phase (oraz wavelength * 0.47,
// phase * 1.7) dla r, rowMargin, wavelength z zakresow generatora i faz z rng; plus losowe z [-60, 60].
const sinVec = [];
for (let k = 0; k < 3000; k++) {
  let x;
  if (k < 2000) {
    const r = ri(0, 160), rm = ri(0, 30), wl = ri(24, 160), ph = R() * Math.PI * 2;
    x = k % 2 === 0 ? ((r - rm) / wl) * Math.PI * 2 + ph : ((r - rm) / (wl * 0.47)) * Math.PI * 2 + ph * 1.7;
  } else {
    x = (R() * 2 - 1) * 60;
  }
  sinVec.push([f64hex(x), f64hex(Math.sin(x))]);
}

// ---------------------------------------------------------------- 6) cavalryTerrainMultiplier na danych pinu i syntetycznych
const CAV_NAMES = ['Plaskie (rownina/laka)', 'Las', 'Wzgorza', 'Gory', 'Rzeka', '', 'las', 'GÓRY', 'Pustynia', 'Wybrzeże / Morze', 'Nieznany'];
const cav = CAV_NAMES.map((n) => ({ name: n, data: 'pin', mult: num(COMBATM.cavalryTerrainMultiplier(n, terrainData)) }));
const RAWS = ['koszt ×2 — mocno', 'x3', 'X 1,5', 'koszt x 　 2.25 ok', 'x', 'x0', 'x 0.0', '×﻿7', 'koszt ×  ', 'NIEDOSTĘPNE',
  'niedostepne x2', 'brak', '', null, 'a x b x 4', 'x1e5', '×12,75,3', 'x 4', 'x\u0085 4', 'xx9', '×' + '9'.repeat(400),
  'x 2.', 'x.5 x 6', 'Ｘ 3', 'x᠎5'];
for (const raw of RAWS) {
  const data = [{ Teren: 'Testowy', 'Kawaleria/Rydwan': raw ?? undefined }];
  if (raw === null) delete data[0]['Kawaleria/Rydwan'];
  cav.push({ name: 'testowy', data: [{ Teren: 'Testowy', kaw: raw }], mult: num(COMBATM.cavalryTerrainMultiplier('testowy', data)) });
}
cav.push({ name: 'Las', data: [], mult: num(COMBATM.cavalryTerrainMultiplier('Las', [])) });

// ---------------------------------------------------------------- zapis wektorow
const outDir = join(here, 'p6_battle_setup_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({
  pin: PIN, seed: SEED, fileSha256: fileShaNow, fragSha256: fragShaNow,
  consts, sideCap, clearRanks, boxes, presets, rng: rngVec, jitter, pickFromRanges: pfr, gens, scenarios, cav, sin: sinVec,
  terrainCombat: terrainData.map((t) => ({ Teren: t.Teren, kaw: t['Kawaleria/Rydwan'] ?? null })),
}) + '\n');

// ---------------------------------------------------------------- 7) fikstura renderera (tylko odczyt field.rs)
const fieldPath = join(repoRoot, 'rust-port/renderer/src/battle/field.rs');
const fieldLines = readFileSync(fieldPath, 'utf8').split('\n');
const fnBlock = (prefix, close) => {
  const i = fieldLines.findIndex((l) => l.startsWith(prefix));
  if (i < 0) throw new Error(`field.rs: brak "${prefix}"`);
  let j = i;
  while (fieldLines[j] !== close) j++;
  return fieldLines.slice(i, j + 1).join('\n');
};
const constLine = (name) => {
  const l = fieldLines.find((x) => x.startsWith(`pub const ${name}:`));
  if (!l) throw new Error(`field.rs: brak stalej ${name}`);
  return l;
};
const R_CONSTS = ['BF_COLS', 'BF_ROWS', 'PLAYABLE_COLS', 'PLAYABLE_ROWS', 'PLAY_COL0', 'PLAY_ROW0', 'PLAY_MID_ROW',
  'FRONT_GAP', 'ATK_FRONT_COL', 'DEF_FRONT_COL', 'WALL_TILE_HP', 'GATE_MAX_HP'];
const R_FRAGS = [
  ...R_CONSTS.map(constLine),
  fnBlock('pub fn tile_jitter(', '}'),
  fnBlock('    fn set_index(', '    }'),
  fnBlock('pub fn carve_wall_tiles(', '}'),
];
const fnv64 = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, 'utf8')) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};
const rendererFnv = fnv64(R_FRAGS.join('\n'));
const rsSrc = [
  '#![allow(dead_code, clippy::all)]',
  'use std::io::Read;',
  'const PLAINS: u8 = 0; const RIVER: u8 = 3; const WALL: u8 = 6; const GATE: u8 = 7;',
  ...R_FRAGS.slice(0, R_CONSTS.length),
  'pub struct TerrainGrid { pub cols: i32, pub rows: i32, pub tiles: Vec<u8> }',
  'impl TerrainGrid {',
  R_FRAGS[R_CONSTS.length + 1],
  '}',
  '#[derive(Debug)] pub struct SiegeLayout { pub wall_col: i32, pub row_lo: i32, pub row_hi: i32, pub gate_col: i32,',
  '  pub gate_row: i32, pub gate_hp: f64, pub gate_open: bool, pub wall_tile_hp: Vec<(i32, f64)> }',
  R_FRAGS[R_CONSTS.length],
  R_FRAGS[R_CONSTS.length + 2],
  'fn main() {',
  '  let mut s = String::new(); std::io::stdin().read_to_string(&mut s).unwrap();',
  '  let mut out = Vec::new();',
  '  for line in s.lines() {',
  '    let mut it = line.split(\' \');',
  '    match it.next().unwrap() {',
  '      "J" => { let v: Vec<i32> = it.map(|x| x.parse().unwrap()).collect();',
  '        out.push(format!("{:016x}", tile_jitter(v[0], v[1], v[2]).to_bits())); }',
  '      "G" => { let cols: i32 = it.next().unwrap().parse().unwrap(); let rows: i32 = it.next().unwrap().parse().unwrap();',
  '        let tiles: Vec<u8> = it.next().unwrap().as_bytes().chunks(2).map(|c| u8::from_str_radix(std::str::from_utf8(c).unwrap(), 16).unwrap()).collect();',
  '        let mut g = TerrainGrid { cols, rows, tiles }; let l = carve_wall_tiles(&mut g);',
  '        let hex: String = g.tiles.iter().map(|b| format!("{:02x}", b)).collect();',
  '        let hp: Vec<String> = l.wall_tile_hp.iter().map(|(r, h)| format!("{}:{:016x}", r, h.to_bits())).collect();',
  '        out.push(format!("{} {} {} {} {} {} {:016x} {} {} {}", hex, l.wall_col, l.row_lo, l.row_hi, l.gate_col, l.gate_row, l.gate_hp.to_bits(), l.gate_open, hp.len(), hp.join(","))); }',
  '      _ => panic!("?"),',
  '    }',
  '  }',
  '  println!("{}", out.join("\\n"));',
  '}',
].join('\n');
const tmp = mkdtempSync(join(tmpdir(), 'bsetup-rparity-'));
let rOut;
try {
  writeFileSync(join(tmp, 'r.rs'), rsSrc);
  execFileSync('rustc', ['-O', '--edition', '2021', '-o', join(tmp, 'r'), join(tmp, 'r.rs')], { stdio: 'inherit' });
  const hex = (t) => Buffer.from(t).toString('hex');
  const jitterIn = jitter.map(([c, r, s]) => [c, r, s]);
  const lines = [
    ...jitterIn.map(([c, r, s]) => `J ${c} ${r} ${s}`),
    ...fenceInputs.map((f) => `G 68 156 ${hex(f.tiles)}`),
    // siatka mniejsza niz BF: renderer (jak pin) indeksuje BF_COLS - zapis poza tablica jest pomijany
    `G 20 30 ${'00'.repeat(600)}`,
  ];
  rOut = execFileSync(join(tmp, 'r'), { input: lines.join('\n') + '\n', encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim().split('\n');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
const rJ = rOut.slice(0, jitter.length);
const rG = rOut.slice(jitter.length);
const parseG = (line) => {
  const [hexTiles, wallCol, rowLo, rowHi, gateCol, gateRow, gateHp, gateOpen, n, hp] = line.split(' ');
  return {
    tiles: rle(Buffer.from(hexTiles, 'hex')),
    wallCol: +wallCol, rowLo: +rowLo, rowHi: +rowHi, gateCol: +gateCol, gateRow: +gateRow, gateHpBits: gateHp,
    gateOpen: gateOpen === 'true', wallTileHpLen: +n,
    wallTileHp: hp ? hp.split(',').map((e) => { const [r, h] = e.split(':'); return [+r, h]; }) : [],
  };
};
const carveCases = fenceInputs.map((f, i) => ({ id: f.id, input: rle(f.tiles), cols: 68, rows: 156, renderer: parseG(rG[i]) }));
carveCases.push({ id: 'siatka-20x30', input: rle(new Uint8Array(600)), cols: 20, rows: 30, renderer: parseG(rG[fenceInputs.length]) });
// Krzyzowe sprawdzenie generatora: renderer == pin dla wszystkich wejsc scenariuszy (inaczej fikstura nie ma sensu).
for (let i = 0; i < fenceInputs.length; i++) {
  const sc = scenarios.find((s) => s.id === fenceInputs[i].id);
  if (sc.afterWall !== null && sc.afterWall !== carveCases[i].renderer.tiles) {
    console.warn(`UWAGA: renderer != pin dla ${sc.id} (mur)`);
  }
}
writeFileSync(join(outDir, 'renderer_parity.json'), JSON.stringify({
  source: 'rust-port/renderer/src/battle/field.rs',
  fragmentsFnv64: rendererFnv,
  constants: R_CONSTS,
  jitter: jitter.map(([c, r, s], i) => [c, r, s, rJ[i]]),
  carve: carveCases,
}) + '\n');

console.log(JSON.stringify({ fileSha256: fileShaNow, fragSha256: fragShaNow, rendererFnv, gens: gens.length, scenarios: scenarios.length }));
