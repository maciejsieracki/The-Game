// P6 BATTLE-SETUP T5b (dispatch R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1, runda 1, Operator): generator wektorow dla
// `rust-port/engine/src/domain/battle_setup_units*.rs` (rozstawienie jednostek: _placeUnits / _placeSiegeDefenders /
// _repositionSiegeAttackers).
//
// Uruchomienie: node rust-port/engine/tests/p6_battle_setup_units_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_battle_setup_units_vectors/{vectors,renderer_parity}.json. Ziarno 7205.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show), straznik SHA-256 kazdego pliku/wycinka:
// * `gra/src/battle/battle-terrain.ts`, `gra/src/game/city-towers.ts`, `gra/src/game/city-fortification.ts`,
//   `gra/src/battle/formationRules.ts` CALE pliki (battle-terrain z jednym dopisanym wierszem eksportu jak w T5a).
// * `gra/src/battle/battleScene.ts` wycinki T5a (pole bitwy, mur, wiezyczki - te same zakresy i ten sam SHA co
//   `p6_battle_setup_gen.mjs`) oraz wycinki T5b: enum Dir (315-320), DEPLOY_* (839-845, 937-941),
//   DEFAULT_RANGED_REACH (949), norm/statField (1315-1326), attackRange/isRanged (1410-1422), isPrimaryRanged
//   (1474-1487), initialBattleRoleOf (1490-1499), isMounted (1502-1511), isSiegeUnit (1552-1558), normName (1648-1650),
//   cellKey (1797), pola klasy (2157, 2159, 2236-2237, 2421-2423), konstruktor 3478-3486 (z wywolaniem _placeUnits,
//   bez dekoru _buildSiegeInteriorBuildings), metody _repositionSiegeAttackers (4427-4434), _placeSiegeDefenders
//   (4442-4744), _placeUnits (5276-5553), _isCatapult (7408-7411), _playerControlSide (12396-12398).
//
// STUBY (bez logiki rozstawienia): model 3D (`buildUnitModel`, `makeFallbackAvatar`, `tileTopY`, `dirYaw`, `scene`),
// paski (`makeUnitBars`, `sideColor`, `_update*Bar`), statystyki runtime nieczytane przy wyborze pola (`ammoCount`,
// `movementPoints`, `isAntiCavSpear`, `isPhalanx`, `moraleBaseFor`, `isNeverRout`, `fleeMoraleFor`,
// `_movementPointsFor`, `_attackRangeFor`, `_applyTerrainRange`), `cloneBattleUnitsForReplay`,
// `_debugRecordSiegeColumns`. Math.random podmieniony na funkcje rzucajaca wyjatek (D-BS-3: brak RNG w rozstawieniu).
//
// Fikstura renderera: `rust-port/renderer/src/battle/field.rs` - tylko odczyt linii `MAX_PER_SIDE` (renderer: 120,
// pin: 500); test silnika porownuje sie z pinem, rozbieznosc renderera jest dlugiem DTO-BRIDGE.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const TERRAIN_TS = 'gra/src/battle/battle-terrain.ts';
const SCENE = 'gra/src/battle/battleScene.ts';
const TOWERS = 'gra/src/game/city-towers.ts';
const FORT = 'gra/src/game/city-fortification.ts';
const FORMATION = 'gra/src/battle/formationRules.ts';
const SEED = 7205;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// ---------------------------------------------------------------- straznicy SHA-256 calych plikow pinu
const terrainText = gitShow(TERRAIN_TS);
const towersText = gitShow(TOWERS);
const fortText = gitShow(FORT);
const formationText = gitShow(FORMATION);
const FILE_SHA = {
  [TERRAIN_TS]: 'a17735ed3ef7b20277cfba3aee9e9aa478c5a0e71481f747dc04cd365fb8f00d',
  [TOWERS]: 'cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4',
  [FORT]: '52fd18e913d1e59fdfed5874e9b56323d25058a39a55cbae2f0abfd2f6af4610',
  [FORMATION]: '800ffb600b4443210def79662f0b7f53b9959e602a130ce4687c77d9ea9fc48c',
};
const fileShaNow = {
  [TERRAIN_TS]: sha256(terrainText), [TOWERS]: sha256(towersText), [FORT]: sha256(fortText), [FORMATION]: sha256(formationText),
};

const sceneLines = gitShow(SCENE).split('\n');
const L = (lines, a, b) => lines.slice(a - 1, b).join('\n');
const expectLine = (lines, file, n, needle) => {
  if (!lines[n - 1].includes(needle)) throw new Error(`pin ${file}:${n} nie zawiera "${needle}"`);
};
const checkFrags = (lines, file, frags) =>
  frags.map(([a, b, first, last]) => {
    expectLine(lines, file, a, first);
    expectLine(lines, file, b, last);
    return L(lines, a, b);
  });

// --- wycinki T5a (identyczne zakresy jak p6_battle_setup_gen.mjs; ten sam SHA wycinkow T5a bez wycinkow combat.ts)
const T5A_TOP = [
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
const T5A_FIELDS = [
  [2439, 2461, 'private _siegeDefCiv', 'private siegeWallRowHi'],
  [2501, 2501, 'private wallTileHp = new Map', 'private wallTileHp = new Map'],
  [2507, 2507, 'private static readonly WALL_TILE_HP = 640;', 'WALL_TILE_HP = 640;'],
];
const T5A_CTOR = [
  [2741, 2743, 'this.fortKind = cityFortificationKind(opts.siege?.builtBuildingIds);', 'this._siegeDefCiv ='],
  [2770, 2770, 'this._defenderEra = clampEra(opts.defenderEra);', 'clampEra'],
  [2776, 2817, '// World-hex-derived terrain preset', '}'],
];
const T5A_METHODS = [
  [3917, 3998, 'private _carveBattleBox(presetActive: boolean, sideCap: number): void {', '  }'],
  [4004, 4013, 'private _fencePlayableZone(): void {', '  }'],
  [4026, 4065, 'private _carveWallTiles(): void {', '  }'],
  [4075, 4148, 'private _placeSiegeWall(civ:', '  }'],
  [4158, 4191, 'private _placeSiegeTowers(wallCol: number, rLo: number, rHi: number): void {', '  }'],
];
// --- wycinki T5b
const T5B_TOP = [
  [315, 320, 'export const enum Dir {', '}'],
  [839, 845, 'const DEPLOY_MID_COL', 'const DEPLOY_MAX_ROW'],
  [937, 941, 'const DEPLOY_DEF_MIN_COL', 'const DEPLOY_DEF_COL_STEP'],
  [949, 949, 'const DEFAULT_RANGED_REACH = 2;', 'DEFAULT_RANGED_REACH'],
  [1315, 1319, 'function norm(v: unknown, fallback: number): number {', '}'],
  [1322, 1326, 'function statField(', '}'],
  [1410, 1417, 'function attackRange(bu: BattleUnit): number {', '}'],
  [1420, 1422, 'function isRanged(bu: BattleUnit): boolean {', '}'],
  [1474, 1487, 'function isPrimaryRanged(bu: BattleUnit): boolean {', '}'],
  [1490, 1499, 'function initialBattleRoleOf(bu: BattleUnit): InitialBattleRole {', '}'],
  [1502, 1511, 'function isMounted(bu: BattleUnit): boolean {', '}'],
  [1552, 1558, 'function isSiegeUnit(bu: BattleUnit): boolean {', '}'],
  [1648, 1650, 'function normName(s: string): string {', '}'],
  [1797, 1797, 'function cellKey(col: number, row: number): string', 'cellKey'],
];
const T5B_FIELDS = [
  [2157, 2157, 'private _deployMode = false;', '_deployMode'],
  [2159, 2159, "private _deployPlayerSideOpt: 'atk' | 'def' = 'atk';", '_deployPlayerSideOpt'],
  [2236, 2237, 'private _deployMeleeLines: DeployLineCount = 1;', 'private _deployArcherLines: DeployLineCount = 1;'],
  [2421, 2423, 'private atk: RuntimeBattleUnit[] = [];', 'private occByKey = new Map'],
];
const T5B_CTOR = [[3478, 3486, 'if (opts.siege) {', 'this._placeUnits(opts.attacker, opts.defender, opts.siege != null);']];
const T5B_METHODS = [
  [4427, 4434, 'private _repositionSiegeAttackers(): void {', '  }'],
  [4442, 4744, 'private _placeSiegeDefenders(defenders: BattleUnit[]): RuntimeBattleUnit[] {', '  }'],
  [5276, 5553, 'private _placeUnits(attackers: BattleUnit[], defenders: BattleUnit[], siegeMode: boolean = false): void {', '  }'],
  [7408, 7411, 'private _isCatapult(bu: BattleUnit): boolean {', '  }'],
  [12396, 12398, "private _playerControlSide(): 'atk' | 'def' {", '  }'],
];
const t5aTop = checkFrags(sceneLines, SCENE, T5A_TOP);
const t5aFields = checkFrags(sceneLines, SCENE, T5A_FIELDS);
const t5aCtor = checkFrags(sceneLines, SCENE, T5A_CTOR);
const t5aMethods = checkFrags(sceneLines, SCENE, T5A_METHODS);
const t5bTop = checkFrags(sceneLines, SCENE, T5B_TOP);
const t5bFields = checkFrags(sceneLines, SCENE, T5B_FIELDS);
const t5bCtor = checkFrags(sceneLines, SCENE, T5B_CTOR);
const t5bMethods = checkFrags(sceneLines, SCENE, T5B_METHODS);
// Dekor 3D (_buildSiegeInteriorBuildings) usuwany jawnie z wycinka konstruktora 3478-3486 (dokladnie jeden wiersz).
const ctorLines = t5bCtor[0].split('\n');
const decorIdx = ctorLines.findIndex((l) => l.includes('this._buildSiegeInteriorBuildings();'));
if (decorIdx < 0) throw new Error('pin: brak _buildSiegeInteriorBuildings w 3478-3486');
ctorLines.splice(decorIdx, 1);
t5bCtor[0] = ctorLines.join('\n');
const fragText = [...t5aTop, ...t5aFields, ...t5aCtor, ...t5aMethods, ...t5bTop, ...t5bFields, ...t5bCtor, ...t5bMethods]
  .join('\n----\n');
const FRAG_SHA = '5c9ce1504295cf84c1c4c584302913d7777a2b079d61345d0552cb6d0afe5c66';
const fragShaNow = sha256(fragText);
for (const [f, want] of Object.entries(FILE_SHA)) {
  if (want !== fileShaNow[f]) throw new Error(`SHA-256 ${f}: ${fileShaNow[f]} != ${want}`);
}
if (FRAG_SHA !== fragShaNow) throw new Error(`SHA-256 wycinkow: ${fragShaNow} != ${FRAG_SHA}`);

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
const FORM = loadModule(formationText);
const miastoParams = JSON.parse(gitShow('gra/data/miasto-params.json'));
const unitsData = JSON.parse(gitShow('gra/data/units.json'));

// ---------------------------------------------------------------- harness sceny
const stub3d = () => ({ position: { set() {} }, rotation: {}, userData: {}, traverse() {} });
const sceneStubs = {
  generateBattleTerrain: BT.generateBattleTerrain,
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
  classifyInitialBattleRole: FORM.classifyInitialBattleRole,
  initialBattleFormation: FORM.initialBattleFormation,
  initialBattleSlots: FORM.initialBattleSlots,
  // --- atrapy 3D / statystyk runtime (bez logiki rozstawienia) ---
  buildSiegeWall: () => ({ rotation: {}, position: { set() {} }, traverse() {} }),
  attachRowBreachPanels: () => {},
  buildWallTower: () => ({ clone: () => ({ position: { set() {} }, traverse() {} }) }),
  mountSiegeHud1E: () => {},
  document: { createElement: () => ({ style: {} }) },
  requestAnimationFrame: () => 0,
  buildUnitModel: stub3d,
  makeFallbackAvatar: stub3d,
  tileTopY: () => 0,
  dirYaw: () => 0,
  HPBAR_Y: 1,
  ammoCount: () => 0,
  makeUnitBars: () => ({ hpBarGroup: { position: { set() {} }, traverse() {} } }),
  sideColor: () => 0,
  movementPoints: () => 0,
  isAntiCavSpear: () => false,
  isPhalanx: () => false,
  moraleBaseFor: () => 1,
  isNeverRout: () => false,
  fleeMoraleFor: () => 0,
  cloneBattleUnitsForReplay: (a) => a.slice(),
};
const stubNames = Object.keys(sceneStubs);
const harnessSrc = [
  ...t5aTop,
  ...t5bTop,
  'class BattleScene {',
  ...t5aFields,
  ...t5bFields,
  '  scene = { add() {} };',
  '  overlay = { appendChild() {} };',
  '  ownedGeos = []; ownedMats = [];',
  '  _battleData = {};',
  '  _updateSiegeHud() {} _syncSiegeHudChromeVisibility() {} _syncSiegeHudLayout() {}',
  '  _updateHpBar() {} _updateMoraleBar() {} _updateAmmoBar() {} _applyTerrainRange() {} _debugRecordSiegeColumns() {}',
  '  _movementPointsFor() { return 0; } _attackRangeFor() { return 0; }',
  '  constructor(opts) {',
  ...t5aCtor,
  ...t5bCtor,
  '  }',
  ...t5aMethods,
  ...t5bMethods,
  '}',
  'module.exports = { Harness: BattleScene, isRanged, isPrimaryRanged, isMounted, isSiegeUnit, initialBattleRoleOf,',
  '  consts: { MAX_PER_SIDE, BATTLE_MAX_PER_SIDE, PLAY_MID_ROW, PLAY_ROW0, PLAY_ROW1, DEPLOY_ATK_FRONT_COL, DEPLOY_DEF_FRONT_COL } };',
].join('\n');
const harnessJs = transpile(harnessSrc);
const hmod = { exports: {} };
new Function('module', 'exports', ...stubNames, harnessJs)(hmod, hmod.exports, ...stubNames.map((k) => sceneStubs[k]));
const H = hmod.exports;

// ---------------------------------------------------------------- kodowanie / RNG
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

// ---------------------------------------------------------------- pula jednostek (dane pinu + syntetyczne)
const KATEGORIE = ['wojownik', 'lucznik', 'procarz', 'oszczepnik', 'konnica', 'rydwan', 'falanga', 'wlocznik', 'legionista',
  'miecznik', 'maczuga', 'topor', 'super', 'oblezenie', '', 'Łucznik', 'KONNICA', 'Rydwan', null];
const SYNTH = [
  { Jednostka: 'Katapulta', Typ: 'Siege', 'Zasięg ataku (hex)': 5 },
  { Jednostka: 'Taran', Typ: 'Siege' },
  { Jednostka: 'Wieża oblężnicza', Typ: 'Siege' },
  { Jednostka: 'Balista', Typ: 'Distance', 'Zasięg ataku (hex)': 4 },
  { Jednostka: 'Balista oblężnicza', Typ: 'Siege', 'Zasięg ataku (hex)': 5 },
  { Jednostka: 'Onager', Typ: 'Offensive', missileAttack: 6 },
  { Jednostka: 'Konna katapulta', Typ: 'Mount', 'Zasięg ataku (hex)': 5 },
  { Jednostka: 'Kusznik', Typ: 'Distance', 'Zasieg ataku (hex)': '3' },
  { Jednostka: 'Jeździec z łukiem', Typ: 'Mount', missileAttack: 3 },
  { Jednostka: 'Horse archer', Typ: '', missileAttack: '2' },
  { Jednostka: 'Slinger band', Typ: 'Slinger', 'Atak dystansowy': 4 },
  { Jednostka: 'Estólica', missileAttack: 2 },
  { Jednostka: 'Atlatl', missileAttack: '---' },
  { Jednostka: 'Battering ram', Typ: ' Siege ' },
  { Jednostka: 'Siege Tower' },
  { Jednostka: 'Chariot', Typ: 'mount' },
  { Jednostka: 'Wojownik', Typ: 'Offensive' },
  { Jednostka: 'Kawalerzysta' },
  { Jednostka: 'Ścigacz', 'Zasięg ataku (hex)': 2.6 },
];
const pool = [
  ...unitsData.map((u) => ({
    Jednostka: u.Jednostka, Typ: u.Typ, missileAttack: u.missileAttack, 'Atak dystansowy': u['Atak dystansowy'],
    'Zasięg ataku (hex)': u['Zasięg ataku (hex)'],
  })),
  ...SYNTH,
];
let unitSerial = 0;
const makeUnit = (opts = {}) => {
  const base = opts.base ?? pick(pool);
  const stats = R() < 0.04 ? null : { ...base };
  if (stats && R() < 0.08) delete stats.Typ;
  const nazwa = R() < 0.1 ? undefined : (R() < 0.7 ? base.Jednostka : (base.Jednostka + ' EN'));
  const kategoria = opts.kategoria !== undefined ? opts.kategoria : pick(KATEGORIE);
  const bu = { id: 'u' + unitSerial++, kategoria: kategoria === null ? undefined : kategoria, stats, nazwa };
  if (opts.commander ?? R() < 0.03) bu.isArmyCommander = true;
  return bu;
};
const byName = (name) => pool.find((p) => p.Jednostka === name) ?? SYNTH.find((p) => p.Jednostka === name);
const named = (name, kategoria, n) => Array.from({ length: n }, () => makeUnit({ base: byName(name), kategoria }));
const randomArmy = (n) => Array.from({ length: n }, () => makeUnit());
const unitJson = (bu) => {
  const s = bu.stats;
  const str = (v) => (v === undefined || v === null ? null : String(v));
  // [kategoria, Typ, Jednostka, nazwa, isArmyCommander, isRanged | kontrolnie: isMounted, isPrimaryRanged, isSiegeUnit, rola]
  return [
    str(bu.kategoria), s ? str(s.Typ) : null, s ? str(s.Jednostka) : null, str(bu.nazwa),
    bu.isArmyCommander === true, H.isRanged(bu),
    H.isMounted(bu), H.isPrimaryRanged(bu), H.isSiegeUnit(bu), H.initialBattleRoleOf(bu),
  ];
};

// ---------------------------------------------------------------- Math.random zablokowany w wykonaniu pinu
const realRandom = Math.random;
let randomCalls = 0;
Math.random = () => {
  randomCalls++;
  throw new Error('Math.random w rozstawieniu jednostek (D-BS-3)');
};

// ---------------------------------------------------------------- pola bitwy (konstruktor pinu, _placeUnits pomijany)
const fields = {};
const army = (n) => ({ length: n, slice() { return []; } });
const buildField = (id, spec) => {
  if (fields[id]) return fields[id];
  const opts = { attacker: army(spec.atk), defender: army(spec.def), teren: spec.teren };
  if (spec.wt) opts.worldTerrain = spec.wt;
  if (spec.siege) opts.siege = spec.siege;
  const orig = H.Harness.prototype._placeUnits;
  H.Harness.prototype._placeUnits = function () {};
  const h = new H.Harness(opts);
  H.Harness.prototype._placeUnits = orig;
  const f = {
    spec: {
      teren: spec.teren,
      attackers: Number.isNaN(spec.atk) ? 'NaN' : spec.atk === Infinity ? 'Infinity' : spec.atk,
      defenders: Number.isNaN(spec.def) ? 'NaN' : spec.def === Infinity ? 'Infinity' : spec.def,
      worldTerrain: spec.wt ? { baza: spec.wt.baza, las: spec.wt.las ?? null, rzeka: spec.wt.rzeka ?? null } : null,
      siege: spec.siege ? { builtBuildingIds: spec.siege.builtBuildingIds } : null,
    },
    tiles: rle(h.terrainMap.tiles),
    wall: h.siegeWallCol >= 0 ? { wallCol: h.siegeWallCol, rowLo: h.siegeWallRowLo, rowHi: h.siegeWallRowHi, gateRow: h.siegeGateRow } : null,
    synthetic: false,
  };
  fields[id] = { json: f, h };
  return fields[id];
};
// Pole syntetyczne: siatka pola `base` z kaflami podmienionymi (las/brod/wzgorza/skaly/rzeka) w strefie gry.
const buildSynthetic = (id, baseId, density) => {
  const base = fields[baseId];
  const tiles = Uint8Array.from(base.h.terrainMap.tiles);
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === 6 || tiles[i] === 7) continue; // mur/brama zostaja
    const c = i % 68;
    if (c < 10 || c > 57) continue; // poza strefa gry zostaje rzeka z _fencePlayableZone
    if (R() < density) tiles[i] = pick([1, 1, 2, 3, 4, 4, 5, 0]);
  }
  fields[id] = {
    json: { ...base.json, tiles: rle(tiles), synthetic: true, spec: null },
    h: base.h,
    tiles,
  };
  return fields[id];
};

// Pole przeksztalcone deterministycznie (bez RNG): `fn(tiles, c, r)` zwraca nowy kod kafla.
const buildMapped = (id, baseId, fn) => {
  const base = fields[baseId];
  const tiles = Uint8Array.from(base.h.terrainMap.tiles);
  for (let i = 0; i < tiles.length; i++) tiles[i] = fn(tiles[i], i % 68, Math.floor(i / 68));
  fields[id] = { json: { ...base.json, tiles: rle(tiles), synthetic: true, spec: null }, h: base.h, tiles };
  return fields[id];
};

// ---------------------------------------------------------------- wykonanie _placeUnits pinu
const cases = [];
const runCase = (id, fieldId, attackers, defenders, siegeMode, params = {}) => {
  const f = fields[fieldId];
  const h = f.h;
  const savedTiles = Uint8Array.from(h.terrainMap.tiles);
  if (f.tiles) h.terrainMap.tiles.set(f.tiles);
  h.occByKey = new Map();
  h.atk = [];
  h.def = [];
  h._deployMode = params.deploy === true;
  h._deployPlayerSideOpt = params.playerSide ?? 'atk';
  h._deployMeleeLines = params.meleeLines ?? 1;
  h._deployArcherLines = params.archerLines ?? 1;
  h._placeUnits(attackers, defenders, siegeMode);
  const atkIdx = new Map(attackers.map((u, i) => [u, i]));
  const defIdx = new Map(defenders.map((u, i) => [u, i]));
  const enc = (ru) => [
    ru.side === 'atk' ? atkIdx.get(ru.bu) : defIdx.get(ru.bu),
    ru.q, ru.r, ru.facing,
    ru.formationRank === undefined ? null : ru.formationRank,
    ru.onWallWalkway,
  ];
  const out = {
    id,
    field: fieldId,
    siegeMode,
    deploy: params.deploy === true,
    playerSide: params.playerSide ?? 'atk',
    meleeLines: params.meleeLines ?? 1,
    archerLines: params.archerLines ?? 1,
    attackers: attackers.map(unitJson),
    defenders: defenders.map(unitJson),
    atk: h.atk.map(enc),
    def: h.def.map(enc),
    occ: [...h.occByKey.entries()].map(([k, ru]) => {
      const [c, r] = k.split(',').map(Number);
      return [c, r, ru.side, ru.side === 'atk' ? atkIdx.get(ru.bu) : defIdx.get(ru.bu)];
    }),
  };
  h.terrainMap.tiles.set(savedTiles);
  cases.push(out);
};

// --- pola
const FIELD_SPECS = {
  'mur-wzgorza': { teren: 'Wzgórza', atk: 60, def: 35, siege: { builtBuildingIds: ['mury'] } },
  'palisada-laka': { teren: 'Łąka', atk: 10, def: 12, wt: { baza: 'laka' }, siege: { builtBuildingIds: ['palisada'] } },
  'cytadela-500': { teren: 'Wzgórza', atk: 520, def: 510, wt: { baza: 'wzgorza' }, siege: { builtBuildingIds: ['mury', 'fort'] } },
  'bez-obwarowan-gory': { teren: 'Góry', atk: 1, def: 1, wt: { baza: 'gory' }, siege: { builtBuildingIds: [] } },
  'mury-kamienne-pustynia': { teren: 'Pustynia', atk: 80, def: 80, wt: { baza: 'pustynia' }, siege: { builtBuildingIds: ['mury_kamienne'] } },
  'rzeka-palisada': { teren: 'Góry', atk: 250, def: 100, wt: { baza: 'gory', rzeka: true }, siege: { builtBuildingIds: ['palisada'] } },
  'nan-liczebnosc-mur': { teren: 'Równina', atk: NaN, def: 40, wt: { baza: 'laka' }, siege: { builtBuildingIds: ['mury'] } },
  'inf-liczebnosc-mur': { teren: 'Równina', atk: Infinity, def: 3, siege: { builtBuildingIds: ['fort'] } },
  'polowa-40': { teren: 'Równina', atk: 40, def: 40 },
  'polowa-rzeka': { teren: 'Równina', atk: 50, def: 70, wt: { baza: 'rownina', rzeka: true } },
  'polowa-500': { teren: 'Las', atk: 500, def: 500, wt: { baza: 'laka', las: true } },
  'polowa-wzgorza-las': { teren: 'Wzgórza', atk: 70, def: 20, wt: { baza: 'wzgorza', las: true, rzeka: true } },
};
for (const [id, spec] of Object.entries(FIELD_SPECS)) buildField(id, spec);
buildSynthetic('synt-mur-gesty', 'mur-wzgorza', 0.55);
buildSynthetic('synt-mur-rzadki', 'mury-kamienne-pustynia', 0.2);
buildSynthetic('synt-polowa-gesty', 'polowa-40', 0.6);
buildSynthetic('synt-polowa-rzadki', 'polowa-rzeka', 0.25);

// Pole bez strefy rzeki: placeOne stawia jazde bez szukania (galaz `free`); pole z kolumnami 42..46 jako rzeka:
// placeOne nie znajduje miejsca (galaz `!placed` po obu petlach - jednostka zostaje na zajetym/nieprzechodnim polu).
buildMapped('synt-mur-plaski', 'mur-wzgorza', (t) => (t === 6 || t === 7 ? t : 0));
buildMapped('synt-mur-zablokowany', 'mur-wzgorza', (t, c) => (t === 6 || t === 7 ? t : (c >= 42 && c <= 46 ? 3 : 0)));
// Kolumny 42..45 = rzeka, 46 wolna: placeOne znajduje miejsce dopiero w ostatnim kroku petli kolumn (dc = 4).
buildMapped('synt-mur-kolumna-46', 'mur-wzgorza', (t, c) => (t === 6 || t === 7 ? t : (c >= 42 && c <= 45 ? 3 : 0)));
// Pasy rzeki wymuszajace wybor kafla na samej granicy pasma wierszy (mutanty granic `wingRowLo` i rozstawienia gracza):
// * jazda bez korpusu (atak 1 konnica, polowe): slot (31, 76), pasmo skrzydla 70..76; wiersze 71..76 kolumn 22..31 = rzeka.
// * piechota w rozstawieniu gracza (atak 1 wojownik, front 30): pasmo 69..85; wiersze 70..85 kolumn 21..39 = rzeka.
buildMapped('synt-pas-skrzydlo', 'polowa-40', (t, c, r) => (c >= 22 && c <= 31 && r >= 71 && r <= 76 ? 3 : 0));
buildMapped('synt-pas-rozstawienie', 'polowa-40', (t, c, r) => (c >= 21 && c <= 39 && r >= 70 && r <= 85 ? 3 : 0));
// --- scenariusze oblezenia (>= 8, siegeMode = true)
const mixed = (n) => randomArmy(n);
runCase('S1-mur-mieszane', 'mur-wzgorza',
  [...named('Wojownik', 'wojownik', 12), ...named('Łucznik', 'lucznik', 6), ...named('Konnica', 'konnica', 5),
    ...named('Katapulta', 'oblezenie', 3), ...named('Taran', 'oblezenie', 2), ...named('Oszczepnik', 'oszczepnik', 4)],
  [...named('Włócznik', 'wlocznik', 9), ...named('Łucznik', 'lucznik', 5), ...named('Katapulta', 'oblezenie', 2),
    ...named('Konnica', 'konnica', 3), ...named('Taran', 'oblezenie', 1), ...named('Procarz', 'procarz', 2)], true);
runCase('S2-palisada-1v1', 'palisada-laka', named('Wojownik', 'wojownik', 1), named('Łucznik', 'lucznik', 1), true);
runCase('S3-cytadela-0-atak', 'cytadela-500', [], mixed(20), true);
runCase('S4-mur-0-obrona', 'mur-wzgorza', mixed(25), [], true);
runCase('S5-ponad-limit', 'cytadela-500', mixed(520), mixed(510), true);
runCase('S6-katapulty-obrony', 'mury-kamienne-pustynia', mixed(30),
  [...named('Katapulta', 'oblezenie', 12), ...named('Konna katapulta', 'konnica', 2), ...named('Taran', 'oblezenie', 3),
    ...named('Balista', 'oblezenie', 2), ...named('Wojownik', 'wojownik', 4)], true);
runCase('S7-bez-obwarowan', 'bez-obwarowan-gory', mixed(15), mixed(15), true);
runCase('S8-nan-pole', 'nan-liczebnosc-mur', mixed(40), mixed(40), true);
runCase('S9-inf-pole', 'inf-liczebnosc-mur', mixed(8), mixed(3), true);
runCase('S10-korona-przepelniona', 'mur-wzgorza', mixed(10),
  [...named('Wojownik', 'wojownik', 30), ...named('Łucznik', 'lucznik', 20), ...named('Katapulta', 'oblezenie', 7)], true);
runCase('S11-konnica-za-murem', 'rzeka-palisada', mixed(60),
  [...named('Konnica', 'konnica', 170), ...named('Taran', 'oblezenie', 10)], true);
runCase('S12-rozstawienie-atk', 'mur-wzgorza', mixed(50), mixed(30), true, { deploy: true, playerSide: 'atk', meleeLines: 2, archerLines: 3 });
runCase('S13-rozstawienie-def', 'mur-wzgorza', mixed(50), mixed(30), true, { deploy: true, playerSide: 'def', meleeLines: 3, archerLines: 2 });
runCase('S14-wieze-dowodcy', 'mury-kamienne-pustynia',
  [makeUnit({ commander: true }), ...named('Konnica', 'konnica', 7), ...named('Rydwan konny', 'rydwan', 4), ...mixed(10)],
  [makeUnit({ commander: true }), ...mixed(12)], true);
runCase('S15-teren-gesty', 'synt-mur-gesty', mixed(80), mixed(60), true);
runCase('S16-teren-rzadki', 'synt-mur-rzadki', mixed(45), mixed(45), true, { meleeLines: 3, archerLines: 3 });
// pola z murem (siegeMode = true, galaz oblezenia): placeOne bez szukania (S18), bez miejsca (S19), balisty na
// koronie (S20), miejsce dopiero w ostatnim kroku petli kolumn dc = 4 (S22)
runCase('S18-plaski-jazda-bezposrednio', 'synt-mur-plaski', mixed(12),
  [...named('Konnica', 'konnica', 6), ...named('Taran', 'oblezenie', 2), ...named('Wojownik', 'wojownik', 3)], true);
runCase('S19-zablokowane-za-murem', 'synt-mur-zablokowany', mixed(12),
  [...named('Konnica', 'konnica', 4), ...named('Wieża oblężnicza', 'oblezenie', 2), ...named('Łucznik', 'lucznik', 3)], true);
runCase('S20-balista-oblezenia-na-koronie', 'mur-wzgorza', mixed(5),
  [...named('Balista oblężnicza', 'oblezenie', 2), ...named('Balista', 'oblezenie', 1), ...named('Taran', 'oblezenie', 1)], true);
runCase('S22-reszta-kolumna-dc4', 'synt-mur-kolumna-46', mixed(4), [...named('Konnica', 'konnica', 3), ...named('Taran', 'oblezenie', 1)], true);
// siegeMode bez muru (siegeWallCol = -1) -> galaz polowa
runCase('S17-siegeMode-bez-muru', 'polowa-40', mixed(20), mixed(20), true);
// --- scenariusze polowe (galaz wspolna z place())
runCase('F1-polowa-40', 'polowa-40', mixed(40), mixed(40), false);
runCase('F2-polowa-rozstawienie', 'polowa-rzeka', mixed(50), mixed(70), false, { deploy: true, playerSide: 'def' });
runCase('F3-polowa-500', 'polowa-500', mixed(505), mixed(500), false);
runCase('F4-polowa-jazda', 'polowa-wzgorza-las', [...named('Konnica', 'konnica', 40), ...mixed(10)], named('Rydwan konny', 'rydwan', 25), false);
runCase('F5-polowa-teren-gesty', 'synt-polowa-gesty', mixed(90), mixed(90), false);
runCase('F6-polowa-teren-rzadki', 'synt-polowa-rzadki', mixed(35), mixed(35), false, { deploy: true, playerSide: 'atk', meleeLines: 2 });
runCase('F8-jazda-bez-korpusu-granica-skrzydla', 'synt-pas-skrzydlo', named('Konnica', 'konnica', 1), [], false);
runCase('F9-rozstawienie-granica-pasma', 'synt-pas-rozstawienie', named('Wojownik', 'wojownik', 1), [], false, { deploy: true, playerSide: 'atk' });
runCase('F10-ponad-limit-obie-strony', 'polowa-500', mixed(501), mixed(600), false);
runCase('S21-ponad-limit-mur', 'mur-wzgorza', mixed(700), mixed(503), true);
runCase('F7-mur-siegeMode-false', 'mur-wzgorza', mixed(30), mixed(30), false);

// --- losowe wywolania (>= 100)
const fieldIds = Object.keys(fields);
for (let k = 0; k < 140; k++) {
  const fid = pick(fieldIds);
  const big = k % 23 === 0;
  const na = big ? ri(300, 540) : (R() < 0.08 ? 0 : ri(1, 70));
  const nd = big ? ri(300, 540) : (R() < 0.08 ? 0 : ri(1, 70));
  const siegeMode = R() < 0.75;
  const params = {};
  if (R() < 0.3) { params.deploy = true; params.playerSide = R() < 0.5 ? 'atk' : 'def'; }
  if (R() < 0.35) params.meleeLines = pick([1, 2, 3]);
  if (R() < 0.35) params.archerLines = pick([1, 2, 3]);
  runCase('L' + k, fid, randomArmy(na), randomArmy(nd), siegeMode, params);
}

// --- runda 2 (obrona, zarzuty Evaluatora r1: E16, E12, E32, E27). Dopisane PO petli losowej, zeby nie zmieniac
// strumienia RNG przypadkow S*/F*/L* z rundy 1 (ich wektory pozostaja bajt w bajt te same).
// `exact`: jednostki bez losowego dowodcy (licznosc pasma musi byc dokladna); kontrola rol wykonaniem pinu.
const exact = (name, kategoria, n, commander = false) =>
  Array.from({ length: n }, () => makeUnit({ base: byName(name), kategoria, commander }));
const expectRoles = (id, units, want) => {
  const got = {};
  for (const u of units) { const r = H.initialBattleRoleOf(u); got[r] = (got[r] ?? 0) + 1; }
  for (const [role, n] of Object.entries(want)) {
    if ((got[role] ?? 0) !== n) throw new Error(`${id}: rola ${role} ${got[role] ?? 0} != ${n}`);
  }
};
const runChecked = (id, fieldId, attackers, defenders, siegeMode, params, atkRoles, defRoles) => {
  expectRoles(id + '/atk', attackers, atkRoles);
  expectRoles(id + '/def', defenders, defRoles);
  runCase(id, fieldId, attackers, defenders, siegeMode, params);
};
const L1 = { meleeLines: 1, archerLines: 1 };

// E16: granica `playableRows = PLAY_ROW1 - PLAY_ROW0 - 1 = 108`. Pasmo n z ceil(n/108) > ceil(n/109) i liniami
// skonfigurowanymi < ceil(n/108): 109 (2 linie po 55), 217/218 (3 linie po 73), 325 (4 po 82), 433 (5 po 87).
{
  const a = exact('Wojownik', 'wojownik', 109);
  runChecked('R2-E16-oblezenie-piechota-109', 'mur-wzgorza', a, exact('Wojownik', 'wojownik', 4), true, L1,
    { melee: 109 }, { melee: 4 });
}
{
  const a = [...exact('Łucznik', 'lucznik', 109), ...exact('Wojownik', 'wojownik', 3)];
  runChecked('R2-E16-oblezenie-lucznicy-109', 'mur-wzgorza', a, exact('Łucznik', 'lucznik', 6), true, L1,
    { archer: 109, melee: 3 }, { archer: 6 });
}
{
  const a = [...exact('Wojownik', 'wojownik', 218), ...exact('Łucznik', 'lucznik', 109)];
  runChecked('R2-E16-oblezenie-218-109', 'mury-kamienne-pustynia', a, exact('Wojownik', 'wojownik', 10), true, L1,
    { melee: 218, archer: 109 }, { melee: 10 });
}
{
  const a = exact('Wojownik', 'wojownik', 217);
  const d = exact('Wojownik', 'wojownik', 218);
  runChecked('R2-E16-polowa-piechota-217-218', 'polowa-500', a, d, false, L1, { melee: 217 }, { melee: 218 });
}
{
  const a = exact('Łucznik', 'lucznik', 109);
  const d = exact('Łucznik', 'lucznik', 218);
  runChecked('R2-E16-polowa-lucznicy-109-218', 'polowa-40', a, d, false, L1, { archer: 109 }, { archer: 218 });
}
{
  const a = exact('Wojownik', 'wojownik', 325);
  const d = exact('Wojownik', 'wojownik', 433);
  runChecked('R2-E16-polowa-325-433', 'polowa-500', a, d, false, L1, { melee: 325 }, { melee: 433 });
}

// E12: lustro F8 dla DOLNEGO skrzydla bez korpusu (strona z sama jazda, >= 2 jednostki). Slot dolny = PLAY_MID_ROW+1
// (78), pasmo pinu max(78, ir-3)..; wiersze 78..83 = rzeka na calej szerokosci strefy gry: pin wybiera wiersz 84,
// a dolna granica `PLAY_MID_ROW` (mutant) dopuscilaby wolny wiersz 77 obok slotu.
buildMapped('synt-pas-skrzydlo-dol', 'polowa-40', (t, c, r) => (c >= 10 && c <= 57 && r >= 78 && r <= 83 ? 3 : 0));
runChecked('R2-E12-dol-jazda-2v2', 'synt-pas-skrzydlo-dol', exact('Konnica', 'konnica', 2), exact('Konnica', 'konnica', 2),
  false, L1, { mounted: 2 }, { mounted: 2 });
runChecked('R2-E12-dol-jazda-5v4', 'synt-pas-skrzydlo-dol',
  [...exact('Konnica', 'konnica', 3), ...exact('Rydwan konny', 'rydwan', 2)], exact('Konnica', 'konnica', 4),
  false, L1, { mounted: 5 }, { mounted: 4 });
// to samo pole z siegeMode = true (brak muru -> galaz polowa)
runChecked('R2-E12-dol-jazda-siegeMode-bez-muru', 'synt-pas-skrzydlo-dol', exact('Konnica', 'konnica', 3),
  exact('Konnica', 'konnica', 2), true, L1, { mounted: 3 }, { mounted: 2 });

// E32: pasmo dowodcow najszersze (per = liczba dowodcow <= 20) przy obecnej jezdzie; > 2 jazdy na skrzydlo, zeby
// przesuniecie rzedow skrzydla (topRows/bottomRows z bandWidth) zmienialo wybor pola.
{
  const a = [...exact('Wojownik', 'wojownik', 3, true), ...exact('Wojownik', 'wojownik', 1), ...exact('Konnica', 'konnica', 6)];
  const d = [...exact('Wojownik', 'wojownik', 5, true), ...exact('Łucznik', 'lucznik', 2), ...exact('Konnica', 'konnica', 8)];
  runChecked('R2-E32-dowodcy-najszersi-polowa', 'polowa-40', a, d, false, L1,
    { commander: 3, melee: 1, mounted: 6 }, { commander: 5, archer: 2, mounted: 8 });
}
{
  const a = [...exact('Wojownik', 'wojownik', 4, true), ...exact('Wojownik', 'wojownik', 2), ...exact('Konnica', 'konnica', 7)];
  runChecked('R2-E32-dowodcy-najszersi-oblezenie', 'mur-wzgorza', a, exact('Wojownik', 'wojownik', 3), true, L1,
    { commander: 4, melee: 2, mounted: 7 }, { melee: 3 });
}
{
  const a = [...exact('Wojownik', 'wojownik', 3, true), ...exact('Konnica', 'konnica', 2)];
  const d = [...exact('Wojownik', 'wojownik', 2, true), ...exact('Konnica', 'konnica', 4)];
  runChecked('R2-E32-dowodcy-i-jazda-bez-piechoty', 'polowa-40', a, d, false, L1,
    { commander: 3, mounted: 2 }, { commander: 2, mounted: 4 });
}

// E27: kategoria ZAWIERA slowo kluczowe javelin/archer/slinger, ale != kategorii dokladnej, nazwa bez slowa
// (jednostka bazowa Wojownik) - rola pochodzi wylacznie z dopasowania `haystack` na kategorii.
{
  const KAT_JAV = ['Javelinmen', 'Atlatl band', 'Estólicos', 'Oszczepnik ciężki'];
  const KAT_ARC = ['Łucznicy', 'Archers', 'Kusznik najemny', 'Crossbowmen'];
  const KAT_SLI = ['Procarze', 'slinger corps', 'Balearic Slingers'];
  const mk = (kats) => kats.flatMap((k) => exact('Wojownik', k, 2));
  const a = [...mk(KAT_JAV), ...mk(KAT_ARC), ...mk(KAT_SLI), ...exact('Wojownik', 'wojownik', 3)];
  const d = [...mk(KAT_SLI), ...mk(KAT_ARC), ...mk(KAT_JAV), ...exact('Konnica', 'konnica', 2)];
  runChecked('R2-E27-kategoria-zawiera-polowa', 'polowa-40', a, d, false, L1,
    { javelin: 8, archer: 8, slinger: 6, melee: 3 }, { javelin: 8, archer: 8, slinger: 6, mounted: 2 });
  const a2 = [...mk(KAT_ARC), ...mk(KAT_JAV), ...mk(KAT_SLI)];
  const d2 = [...mk(KAT_JAV), ...mk(KAT_SLI)];
  runChecked('R2-E27-kategoria-zawiera-oblezenie', 'mur-wzgorza', a2, d2, true, { meleeLines: 2, archerLines: 3 },
    { javelin: 8, archer: 8, slinger: 6 }, { javelin: 8, slinger: 6 });
}

Math.random = realRandom;
if (randomCalls !== 0) throw new Error('Math.random wywolany');

// ---------------------------------------------------------------- zapis
const outDir = join(here, 'p6_battle_setup_units_vectors');
mkdirSync(outDir, { recursive: true });
const fieldsJson = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.json]));
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({
  pin: PIN, seed: SEED, fileSha256: fileShaNow, fragSha256: fragShaNow, consts: H.consts, fields: fieldsJson, cases,
}) + '\n');

// fikstura renderera: tylko odczyt stalej MAX_PER_SIDE z field.rs
const fieldRs = readFileSync(join(repoRoot, 'rust-port/renderer/src/battle/field.rs'), 'utf8').split('\n');
const maxLine = fieldRs.find((l) => l.startsWith('pub const MAX_PER_SIDE:'));
if (!maxLine) throw new Error('field.rs: brak MAX_PER_SIDE');
writeFileSync(join(outDir, 'renderer_parity.json'), JSON.stringify({
  source: 'rust-port/renderer/src/battle/field.rs',
  maxPerSideLine: maxLine,
  rendererMaxPerSide: Number(maxLine.match(/=\s*(\d+)/)[1]),
  pinMaxPerSide: H.consts.MAX_PER_SIDE,
}) + '\n');
console.log(JSON.stringify({ fileSha256: fileShaNow, fragSha256: fragShaNow, cases: cases.length, fields: Object.keys(fields).length }));
