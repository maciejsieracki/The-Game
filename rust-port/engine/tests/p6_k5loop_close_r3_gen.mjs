// P6 SIEGE K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, DODATEK r3, Operator): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs): `_rangedAction` (`:6656-6741`) z KITE
// (`_nearestEnemyMelee`, `_bestKiteShotStep`), strzalem (`_rangedTargetInRange`, `_doAttack` -> `_doRangedAttack`) i
// marszem `_rangedForwardStep` (`_bestForwardStep`, `lineAllowsRangedStep`); galaz `primaryRanged` bez amunicji (U7.6,
// `:6250-6273`) z `_fallBackStep` (`:7228-7243`, `_bestFallBackStep`); `_phalanxAction` (`:6546-6578`, `_phalanxStep`,
// `_phalanxLineFront`). Kazdy krok przez `_doMove` (`_updateFacing`).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_close_r3_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_close_vectors/vectors_r3.json (+ vectors_r3_nan.json). Ziarno 5309. Pliki r1/r2
// NIE sa zmieniane.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show). Wycinki r2 (naglowek + koniec + SHA-256 calosci) plus:
// MELEE_SAFE_GAP (968), RANGED_FLY_MS/RANGED_GAP_MS (1012-1013), PHALANX_LEAD_TOLERANCE (1168), canShoot (1457),
// _phalanxLineFront (6519), _advanceCoord (6537), _phalanxAdvanceOf (6542), _phalanxAction (6546), _phalanxStep (6588),
// _rangedAction (6656), _rangedForwardStep (6776), _bestForwardStep (6822), _bestKiteShotStep (6959),
// _rangedTargetInRange (7041), _bestFallBackStep (7186), _fallBackStep (7228), _rangedFiringStepStaysBehindMelee (8175),
// _nearestEnemyMelee (8315), _doAttack (8787), _doRangedAttack (9179).
//
// STUBY jak w r2, poza portowanymi wyzej (teraz tekst pinu). `_doMeleeAttack(a, d, done)`: zapis celu i `done()` (cios w
// zwarciu pokrywaja `p6_siege_tactics_loop_body_pin`/`p6_k5loop_outcome_pin`). `_singleBlow(a, d, ranged)`: zapis
// trafienia (cel, `ranged`, czas, luk `relativeHit` z tekstu pinu, facing strzelca) i `0` obrazen (sama formula ciosu jest
// pokryta wektorami K5I; tu sprawdzany jest WYBOR celu, czas i luk). THREE / pocisk / dzwiek / pasek amunicji: atrapy bez
// logiki gry. Okrazenie (`_updateMoraleBar`) poza zakresem: scenariusz je wywolujacy jest odrzucany (nie liczony).

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SCENE = 'gra/src/battle/battleScene.ts';
const FORM = 'gra/src/battle/formationRules.ts';
const COMBAT = 'gra/src/game/combat.ts';
const PARAMS = 'gra/data/combat-params.json';
const TERRAIN = 'gra/data/terrain-combat.json';
const SEED = 5309;
const N_RANGED = 480;
const N_FALLBACK = 260;
const N_PHALANX = 300;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = { [SCENE]: gitShow(SCENE).split('\n'), [FORM]: gitShow(FORM).split('\n'), [COMBAT]: gitShow(COMBAT).split('\n') };
const params = JSON.parse(gitShow(PARAMS));
const terrainData = JSON.parse(gitShow(TERRAIN));
const L = (file, a, b) => lines[file].slice(a - 1, b).join('\n');
const expectLine = (file, n, needle) => {
  if (!lines[file][n - 1].includes(needle)) throw new Error(`pin ${file}:${n} nie zawiera "${needle}"`);
};
const methodEnd = (start) => {
  for (let n = start + 1; n < start + 400; n++) if (lines[SCENE][n - 1] === '  }') return n;
  throw new Error(`brak konca metody od ${start}`);
};
const fnEnd = (file, start) => {
  let n = start;
  while (lines[file][n - 1] !== '}') n += 1;
  return n;
};
const findLine = (file, prefix) => {
  const i = lines[file].findIndex((l) => l.startsWith(prefix));
  if (i < 0) throw new Error(`pin ${file}: brak "${prefix}"`);
  return i + 1;
};

const TOP = [
  [315, 320, 'export const enum Dir {'],
  [326, 331, 'const DIR_DELTA'],
  [337, 337, 'const DIRS4'],
  [661, 662, 'const BF_COLS'],
  [968, 968, 'const MELEE_SAFE_GAP'],
  [983, 983, 'const BROD_RUCH_MULT'],
  [998, 998, 'const FORD_AI_AVOID_PENALTY'],
  [1010, 1013, 'const MOVE_STEP_MS'],
  [1142, 1143, 'const MORALE_SURROUND_HIT'],
  [1161, 1161, 'const FALLBACK_TILES'],
  [1168, 1168, 'const PHALANX_LEAD_TOLERANCE'],
  [1457, 1459, 'function canShoot('],
  [1797, 1797, 'function cellKey('],
  [1897, 1899, 'function isFordTile('],
  [1917, 1919, 'function manhattan('],
  [1956, 1960, 'function desiredHitForDirection('],
];
expectLine(SCENE, 1011, 'const STEP_GAP_MS');
expectLine(SCENE, 1012, 'const RANGED_FLY_MS');
expectLine(SCENE, 1013, 'const RANGED_GAP_MS');
// Inicjalizator pola `_targetPriorities` (`:2328-2332`): obiekt literalny wykonywany w konstruktorze Harness.
expectLine(SCENE, 2328, 'private _targetPriorities: Record<BattleUnitClass, BattleUnitClass[]> = {');
expectLine(SCENE, 2332, '};');
const TOP_FN = [
  [347, 'export function facingToward('],
  [359, 'export function facingFromTo('],
  [370, 'export function oppositeDir('],
  [385, 'export function relativeHit('],
];
const COMBAT_FN = [
  [620, 'export function normTerrain('],
  [706, 'function findTerrainEntry('],
  [756, 'export function cavalryTerrainMultiplier('],
];
const METHODS = [
  [6048, 'private _activateUnit(ru: RuntimeBattleUnit, done: () => void): void {'],
  [6313, 'private _cavPriority('],
  [6326, 'private _cavalryTarget('],
  [6351, 'private _cavAdjacentNonSpear('],
  [6372, 'private _cavalryAction('],
  [6426, 'private _cavDirectedManeuverStep('],
  [6457, 'private _cavManeuverStep('],
  [6519, 'private _phalanxLineFront('],
  [6537, 'private _advanceCoord('],
  [6542, 'private _phalanxAdvanceOf('],
  [6546, 'private _phalanxAction('],
  [6588, 'private _phalanxStep('],
  [6656, 'private _rangedAction('],
  [6743, 'private _advanceDir('],
  [6748, 'private _forwardCol('],
  [6776, 'private _rangedForwardStep('],
  [6822, 'private _bestForwardStep('],
  [6959, 'private _bestKiteShotStep('],
  [7041, 'private _rangedTargetInRange('],
  [7186, 'private _bestFallBackStep('],
  [7228, 'private _fallBackStep('],
  [7436, 'private _moveCostForUnit('],
  [7446, 'private _passableForUnit('],
  [8139, 'private _compactAttackAllowsStep('],
  [8175, 'private _rangedFiringStepStaysBehindMelee('],
  [8191, 'private _shouldAvoidAutoBacktrack('],
  [8198, 'private _advanceStep('],
  [8291, 'private _enemiesOf('],
  [8296, 'private _nearestEnemy('],
  [8315, 'private _nearestEnemyMelee('],
  [8334, 'private _updateFacing('],
  [8361, 'private _meleeBlockedByWall('],
  [8373, 'private _targetInRange('],
  [8413, 'private _stepToward('],
  [8436, 'private _canAttackFrom('],
  [8454, 'private _makeCanAttackFromTest('],
  [8487, 'private _canStrikeTargetFrom('],
  [8509, 'private _firstStepTowardDirectedAttack('],
  [8565, 'private _firstStepAlongPathToAttack('],
  [8685, 'private _doMove('],
  [8787, 'private _doAttack('],
  [9179, 'private _doRangedAttack('],
  [9783, 'private _checkRout('],
  [17486, 'private _unitBattleClass('],
  [17496, 'private _prefsForUnit('],
  [17512, 'private _priorityScore('],
  [17523, 'private _pickTargetByPriority('],
  [17586, 'private _ensureGroupMeta('],
  [17612, 'private _getEffectiveDoctrine('],
  [17621, 'private _isUnitDoctrineAuto('],
  [17633, 'private _effectiveMetaForUnit('],
  [17736, 'private _bestChargeStepKey('],
];
for (const [a, , head] of TOP) expectLine(SCENE, a, head);
for (const [a, head] of TOP_FN) expectLine(SCENE, a, head);
for (const [a, head] of COMBAT_FN) expectLine(COMBAT, a, head);
for (const [a, head] of METHODS) expectLine(SCENE, a, head);
if (methodEnd(6048) !== 6299) throw new Error('koniec _activateUnit != 6299');
if (methodEnd(6372) !== 6412) throw new Error('koniec _cavalryAction != 6412');
if (methodEnd(8198) !== 8285) throw new Error('koniec _advanceStep != 8285');
if (methodEnd(8685) !== 8776) throw new Error('koniec _doMove != 8776');
if (methodEnd(6656) !== 6739) throw new Error('koniec _rangedAction != 6739');
if (methodEnd(6546) !== 6578) throw new Error('koniec _phalanxAction != 6578');
if (methodEnd(7228) !== 7244) throw new Error('koniec _fallBackStep != 7244');
const formStart = findLine(FORM, 'export function compactLineAllowsAdvance(');

const parts = [
  ...TOP.map(([a, b]) => L(SCENE, a, b)),
  L(SCENE, 2328, 2332),
  ...TOP_FN.map(([a]) => L(SCENE, a, fnEnd(SCENE, a))),
  ...COMBAT_FN.map(([a]) => L(COMBAT, a, fnEnd(COMBAT, a))),
  L(FORM, formStart, fnEnd(FORM, formStart)),
  ...METHODS.map(([a]) => L(SCENE, a, methodEnd(a))),
];
const PIN_SHA256 = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
console.error(`sha256 wycinkow pinu = ${PIN_SHA256}`);
const EXPECTED_SHA256 = '2bba6a05f81e66287314361878b2fbc510dc598664ef729c2ef71f02e8c2cebd';
if (EXPECTED_SHA256 !== PIN_SHA256) throw new Error('SHA wycinkow pinu zmieniony');

const stripExport = (t) => t.replace(/^export /gm, '');
const priv = (t) => t.replace(/^(\s*)private /, '$1');
const methodText = (a) => priv(L(SCENE, a, methodEnd(a)));
const rename = (t, from, to) => {
  if (!t.includes(from)) throw new Error(`brak ${from}`);
  return t.replace(from, to);
};
const prioInit = L(SCENE, 2329, 2331);

const classSrc = [
  `const BROD = ${JSON.stringify(params.brod)};`,
  ...TOP.map(([a, b]) => stripExport(L(SCENE, a, b))),
  ...TOP_FN.map(([a]) => stripExport(L(SCENE, a, fnEnd(SCENE, a)))),
  ...COMBAT_FN.map(([a]) => stripExport(L(COMBAT, a, fnEnd(COMBAT, a)))),
  stripExport(L(FORM, formStart, fnEnd(FORM, formStart))),
  'const BTerrain = { Ford: "Ford" };',
  'const HPBAR_Y = 0;',
  'function cellToWorld(c, r) { return { x: c, z: r }; }',
  'function tileTopY() { return 0; }',
  'function easeOut(p) { return p; }',
  'function lerp(a, b, t) { return a + (b - a) * t; }',
  'function dirYaw() { return 0; }',
  'function isSiegeUnit() { return false; }',
  'function meleeBlockedByWall() { throw new Error("mur poza zakresem"); }',
  'function toCombatUnit() { throw new Error("_checkRout poza zakresem (brak okrazenia)"); }',
  'function terrainDefenseMultiplier() { throw new Error("_checkRout poza zakresem"); }',
  'class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }',
  '  subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; } lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; } normalize() { return this; } }',
  'const THREE = { Vector3: V3, Quaternion: class { setFromUnitVectors() { return this; } } };',
  'function projectileKind() { return "arrow"; }',
  'function makeProjectileMesh() { return { group: { position: new V3(), quaternion: { copy() {} } }, geos: [], mats: [] }; }',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1;',
  '    this.wallEverBreached = false; this.occByKey = new Map(); this._groupMeta = new Map(); this._autoBatchPlanning = null;',
  '    this._autoBattleSuspended = false; this.busy = false; this.vNow = 0; this.__q = []; this.__trace = []; this.__inMove = 0;',
  '    this.__advStarted = false; this.__steps = []; this.__facing = []; this.__attack = null; this.terrainMap = null; this.terrainData = [];',
  '    this.__blows = []; this.__rangedStarted = false; this.__fbStarted = false; this.__phStarted = false; this.__inPhalanx = 0; this.__phalanxAdvance = false;',
  '    this.projectiles = []; this.scene = { add() {} };',
  `    this._targetPriorities = {\n${prioInit}\n    }; }`,
  '  _now() { return this.vNow; }',
  '  _raf(cb) { this.__q.push({ kind: "raf", cb }); }',
  '  _schedule(ms, cb) { this.__q.push({ kind: "sched", ms, cb }); }',
  '  _applyTerrainRange(ru) { this.__trace.push("terrainRange"); }',
  '  _isPlayerSide(side) { return false; }',
  '  _performPlayerOrder() { throw new Error("tryb reczny poza zakresem"); }',
  '  _executeGroupDoctrineStep() { throw new Error("doktryna poza zakresem (autoPlay=false)"); }',
  '  _fleeStep() { throw new Error("ucieczka poza zakresem"); }',
  '  _updateMoraleBar() { throw new Error("okrazenie poza zakresem"); }',
  '  _startRout() { throw new Error("rout poza zakresem"); }',
  '  _trySiegeTowerClimb(ru, done) { this.__trace.push("towerClimb"); return false; }',
  '  _siegeInfantryToTowerStep(ru, done) { this.__trace.push("infToTower"); return false; }',
  '  _siegeRamTowerStep() { throw new Error("taran poza zakresem"); }',
  '  _isCatapult() { return false; }',
  '  _isRam() { return false; }',
  '  _sfxShot() {}',
  '  _updateAmmoBar() {}',
  '  _spawnDamageLabel() { throw new Error("etykieta: _singleBlow atrapa zwraca 0"); }',
  // `_singleBlow`: zapis trafienia (luk z tekstu pinu `relativeHit`, jak `:8880`), 0 obrazen (formula poza tym generatorem).
  '  _singleBlow(a, d, ranged) { const list = d.side === "atk" ? this.atk : this.def; this.__blows.push({ target: list.indexOf(d), ranged, t: this.vNow, hitArc: relativeHit(d.facing, a.q, a.r, d.q, d.r), facing: a.facing }); return 0; }',
  '  _phalanxAction(ru, done) { if (!this.__phStarted) { this.__phStarted = true; this.__trace.push("phalanxAction"); } this.__inPhalanx += 1; try { return this._phalanxActionPin(ru, done); } finally { this.__inPhalanx -= 1; } }',
  '  _rangedAction(ru, done) { if (!this.__rangedStarted) { this.__rangedStarted = true; this.__trace.push("rangedAction"); } return this._rangedActionPin(ru, done); }',
  '  _fallBackStep(ru, done) { if (!this.__fbStarted) { this.__fbStarted = true; this.__trace.push("fallBackStep"); } return this._fallBackStepPin(ru, done); }',
  '  _pickAdjacentTargetByPriority() { throw new Error("atak z _advanceStep: galaz nieosiagalna"); }',
  // `_doMeleeAttack`: zapis celu (indeks w liscie strony przeciwnej) i czasu; cios w zwarciu poza tym generatorem.
  '  _doMeleeAttack(ru, e, done) { if (this.__attack) throw new Error("drugi atak"); const list = e.side === "atk" ? this.atk : this.def; this.__attack = { target: list.indexOf(e), t: this.vNow }; done(); }',
  '  _cavalryAction(ru, done) { this.__trace.push("cavalryAction"); return this._cavalryActionPin(ru, done); }',
  '  _updateFacing(ru) { if (!this.__inMove) this.__trace.push("facing"); const f0 = ru.facing; this._updateFacingPin(ru); if (ru.facing !== f0) this.__facing.push({ t: this.vNow, dir: ru.facing }); }',
  // Samotna falanga -> `_advanceStep` (`:6556`, takze kolejne kroki z `_schedule`): bez wpisu w sladzie (to nie jest
  // zdarzenie `_activateUnit`), flaga `phalanxAdvance`.
  '  _advanceStep(ru, done) { if (this.__inPhalanx || this.__phalanxAdvance) this.__phalanxAdvance = true; else if (!this.__advStarted) { this.__advStarted = true; this.__trace.push("advanceStep"); } return this._advanceStepPin(ru, done); }',
  '  _doMove(ru, c, r, done) { const t = this.vNow; this.__inMove += 1; try { this._doMovePin(ru, c, r, done); } finally { this.__inMove -= 1; } this.__steps.push({ col: ru.q, row: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, t }); }',
  ...METHODS.map(([a]) => {
    let t = methodText(a);
    if (a === 8334) t = rename(t, '_updateFacing(', '_updateFacingPin(');
    if (a === 8198) t = rename(t, '_advanceStep(ru: RuntimeBattleUnit', '_advanceStepPin(ru: RuntimeBattleUnit');
    if (a === 8685) t = rename(t, '_doMove(', '_doMovePin(');
    if (a === 6372) t = rename(t, '_cavalryAction(', '_cavalryActionPin(');
    if (a === 6546) t = rename(t, '_phalanxAction(ru: RuntimeBattleUnit', '_phalanxActionPin(ru: RuntimeBattleUnit');
    if (a === 6656) t = rename(t, '_rangedAction(ru: RuntimeBattleUnit', '_rangedActionPin(ru: RuntimeBattleUnit');
    if (a === 7228) t = rename(t, '_fallBackStep(ru: RuntimeBattleUnit', '_fallBackStepPin(ru: RuntimeBattleUnit');
    return t;
  }),
  '}',
  'module.exports.Harness = Harness; module.exports.cavalryTerrainMultiplier = cavalryTerrainMultiplier;',
].join('\n');

const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(mod, mod.exports, createRequire(import.meta.url));
const { Harness, cavalryTerrainMultiplier } = mod.exports;

// Kanoniczne nazwy terenu walki (battle-terrain.ts COMBAT_NAME): mnoznik jazdy liczy tekst pinu z terrain-combat.json.
const TERRAIN_NAMES = ['Plaskie (rownina/laka)', 'Las', 'Wzgorza', 'Gory', 'Rzeka'];
const DEFAULT_TERRAIN = 'Plaskie (rownina/laka)';
const cavMultOf = (name) => {
  const m = cavalryTerrainMultiplier(name, terrainData);
  return Number.isFinite(m) ? m : 'Infinity';
};

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = mulberry32(SEED);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const MOVE_LEFTS = [0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 1.5, 2.5];
const DOCTRINES = ['steady', 'aggressive', 'defensive', 'skirmish', 'manual'];

// Scenariusz w formacie r1 + pola klas/HP/terenu walki (domyslne r1: brak = false / 100 / rownina).
function makeCase(k, opts) {
  const actSide = rnd() < 0.5 ? 'atk' : 'def';
  const enemySide = actSide === 'atk' ? 'def' : 'atk';
  const nOwn = ri(1, 5);
  const nEnemy = ri(1, 6);
  const tight = rnd() < 0.75;
  const c0 = ri(15, 50);
  const r0 = ri(65, 90);
  const span = tight ? 4 : 10;
  const used = new Set();
  const place = () => {
    for (let t = 0; t < 200; t++) {
      const q = Math.max(0, Math.min(67, c0 + ri(-span, span)));
      const r = Math.max(0, Math.min(155, r0 + ri(-span, span)));
      const key = q + ',' + r;
      if (!used.has(key)) { used.add(key); return [q, r]; }
    }
    throw new Error('brak wolnego pola');
  };
  const groupMeta = [];
  const actSideOf = actSide;
  const mkUnit = (side, i, acting) => {
    const [q, r] = place();
    const u = {
      side, idx: i, q, r, facing: ri(0, 3), moveLeft: pick(MOVE_LEFTS), dead: false, fadingOut: false, routed: false,
      unitDoctrine: null, groupId: null, formationRank: rnd() < 0.35 ? null : ri(0, 3),
      hp: pick([40, 60, 60, 80, 100, 100, 120]), mounted: false, primaryRanged: false, rangedBase: false,
      antiCavSpear: false,
    };
    if (!acting) {
      const x = rnd();
      if (x < 0.08) u.dead = true;
      else if (x < 0.16) u.routed = true;
      else if (x < 0.2) u.fadingOut = true;
      const c = rnd();
      if (c < 0.2) u.mounted = true;
      else if (c < 0.35) { u.primaryRanged = true; u.rangedBase = true; }
      else if (c < 0.42) u.rangedBase = true;
      else if (c < 0.7) u.antiCavSpear = true;
      // Falanga: wlasna strona w rodzinie `phalanx` (linia), wrogowie czasem (bez wplywu na decyzje strzelca).
      if (!u.mounted && !u.rangedBase && rnd() < (opts.kind === 'phalanx' && side === actSideOf ? 0.6 : 0.1)) u.phalanx = true;
    }
    return u;
  };
  const own = [];
  const actIdx = ri(0, nOwn - 1);
  for (let i = 0; i < nOwn; i++) own.push(mkUnit(actSide, i, i === actIdx));
  const enemies = [];
  for (let i = 0; i < nEnemy; i++) enemies.push(mkUnit(enemySide, i, false));
  const me = own[actIdx];
  const mode = ri(0, 3);
  if (mode === 0) me.unitDoctrine = 'manual';
  else if (mode === 1) { me.groupId = 'g1'; groupMeta.push(['g1', 'steady', false]); }
  else if (mode === 2) { me.groupId = 'g2'; groupMeta.push(['g2', pick(DOCTRINES), false]); }
  else { me.groupId = 'g3'; groupMeta.push(['g3', 'manual', rnd() < 0.5]); }
  if (rnd() < 0.3) me.moveLeft = pick([3, 4, 6, 8]);
  const live = (u) => !u.dead && !u.fadingOut && !u.routed;
  const adv = (u) => (u.side === 'atk' ? u.q : -u.q);
  if (opts.kind === 'ranged') {
    // Strzelec z amunicja (U7.5, `canShoot && shootingEnabled !== false`, `:6241`).
    me.rangedBase = true;
    me.primaryRanged = rnd() < 0.85;
    me.ammoLeft = pick(['Infinity', 1, 2, 5]);
    me.range = ri(2, 6);
    me.rangedKite = rnd() < 0.8;
    me.mounted = rnd() < 0.1;
    if (me.moveLeft <= 0 && rnd() < 0.7) me.moveLeft = pick([2, 3, 4]);
  } else if (opts.kind === 'fallback') {
    // `primaryRanged` bez amunicji (U7.6, `:6250-6273`): `dryCol`, sasiad = cios, odwrot `_fallBackStep`.
    me.rangedBase = true;
    me.primaryRanged = true;
    me.ammoLeft = 0;
    me.range = pick([1, 3]);
    me.dryCol = rnd() < 0.5 ? -1 : adv(me) + ri(-1, 3);
    me.heldAfterFallback = rnd() < 0.08;
    if (me.moveLeft <= 0 && rnd() < 0.7) me.moveLeft = pick([2, 3, 4]);
  } else {
    // Falanga (U7.8, `:6290`): linia z sasiadami falangi albo samotna (`_advanceStep`, 'front').
    me.phalanx = true;
    me.mounted = false;
    if (me.moveLeft <= 0 && rnd() < 0.7) me.moveLeft = pick([1, 2, 3]);
  }
  const tiles = [];
  const tileSeen = new Set();
  const nTiles = ri(0, 160);
  for (let t = 0; t < nTiles; t++) {
    const c = Math.max(0, Math.min(67, c0 + ri(-span - 4, span + 4)));
    const r = Math.max(0, Math.min(155, r0 + ri(-span - 4, span + 4)));
    const key = c + ',' + r;
    if (tileSeen.has(key)) continue;
    tileSeen.add(key);
    const x = rnd();
    const name = pick(TERRAIN_NAMES);
    if (x < 0.2) tiles.push([c, r, false, 1, false, name]);
    else if (x < 0.55) tiles.push([c, r, true, pick([2, 3]), false, name]);
    else if (x < 0.75) tiles.push([c, r, true, pick([1, 2, 3]), true, name]);
    else tiles.push([c, r, true, pick([1, 99, 150, 0.5]), false, name]);
  }
  const atk = actSide === 'atk' ? own : enemies;
  const def = actSide === 'atk' ? enemies : own;
  return { acting: { side: actSide, idx: actIdx }, atk, def, groupMeta, tiles };
}

function runCase(sc) {
  const h = new Harness();
  h.terrainData = terrainData;
  const tmap = new Map(sc.tiles.map(([c, r, passable, cost, ford, name]) => [c + ',' + r, { passable, cost, ford, name: name ?? DEFAULT_TERRAIN }]));
  const tile = (c, r) => tmap.get(c + ',' + r) ?? { passable: true, cost: 1, ford: false, name: DEFAULT_TERRAIN };
  h.terrainMap = {
    passable: (c, r) => tile(c, r).passable,
    moveCost: (c, r) => tile(c, r).cost,
    at: (c, r) => (tile(c, r).ford ? 'Ford' : 'Plain'),
    combatTerrainName: (c, r) => tile(c, r).name,
  };
  for (const [id, doctrine, autoPlay] of sc.groupMeta) h._groupMeta.set(id, { doctrine, autoPlay });
  const mk = (u) => ({
    bu: { id: u.side + u.idx, nazwa: u.side + u.idx, hp: u.hp ?? 100 }, side: u.side, q: u.q, r: u.r, facing: u.facing,
    moveLeft: u.moveLeft, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.dead,
    surroundApplied: false, neverRout: false, morale: 100, fleeMorale: 0, range: u.range ?? 1, onWallWalkway: false,
    primaryRanged: u.primaryRanged ?? false, rangedBase: u.rangedBase ?? false, mounted: u.mounted ?? false,
    antiCavSpear: u.antiCavSpear ?? false, phalanx: u.phalanx ?? false, shootingEnabled: true,
    ammoLeft: u.ammoLeft === 'Infinity' ? Infinity : (u.ammoLeft ?? 0), ammoMax: 5,
    ...(u.rangedKite === false ? { rangedKite: false } : {}),
    dryCol: u.dryCol ?? -1, heldAfterFallback: u.heldAfterFallback ?? false,
    playerOrder: { type: 'none' }, unitDoctrine: u.unitDoctrine ?? null, groupId: u.groupId ?? null,
    ...(u.formationRank === null || u.formationRank === undefined ? {} : { formationRank: u.formationRank }),
    ...(u.attackDirection ? { attackDirection: u.attackDirection } : {}),
    group: { position: { set() {} }, rotation: { y: 0 } }, hpBarGroup: { position: { set() {} } },
  });
  h.atk = sc.atk.map(mk);
  h.def = sc.def.map(mk);
  for (const ru of [...h.atk, ...h.def]) {
    if (!ru.removed && !ru.routed) h.occByKey.set(ru.q + ',' + ru.r, ru);
  }
  const ru = (sc.acting.side === 'atk' ? h.atk : h.def)[sc.acting.idx];
  let doneAt = null;
  h._activateUnit(ru, () => { doneAt = h.vNow; });
  let guard = 0;
  while (h.__q.length > 0) {
    if (++guard > 10000) throw new Error('petla kolejki');
    const job = h.__q.shift();
    if (job.kind === 'raf') h.vNow += 240; else h.vNow += job.ms;
    job.cb();
  }
  if (doneAt === null) throw new Error('done() nie wywolane');
  const occ = [...h.occByKey.entries()].map(([k, u]) => {
    const [c, r] = k.split(',').map(Number);
    return [c, r, u.side + (u.side === 'atk' ? h.atk : h.def).indexOf(u)];
  }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return {
    trace: h.__trace,
    steps: h.__steps,
    facing: h.__facing,
    attack: h.__attack,
    duration: doneAt,
    final: {
      q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, lastAutoMoveFrom: ru.lastAutoMoveFrom ?? null,
      dryCol: ru.dryCol, heldAfterFallback: ru.heldAfterFallback,
      ammoLeft: Number.isFinite(ru.ammoLeft) ? ru.ammoLeft : 'Infinity',
    },
    blows: h.__blows,
    phalanxAdvance: h.__phalanxAdvance,
    occ,
  };
}

// Odrzucenie scenariusza tylko na jawnym stubie okrazenia (`_updateMoraleBar`, poza zakresem tego tematu).
const tryRun = (sc) => {
  try {
    return runCase(sc);
  } catch (e) {
    if (e.message === 'okrazenie poza zakresem') return null;
    throw e;
  }
};

const cases = [];
let tries = 0;
let k = 0;
// Rodziny losowe: `ranged`, `fallback`, `phalanx` (kazda z wlasnym licznikiem, kolejnosc stala).
function family(kind, n) {
  let got = 0;
  while (got < n) {
    if (++tries > 400000) throw new Error(`za malo scenariuszy ${kind}`);
    const sc = makeCase(k++, { kind });
    if (!sc) continue;
    const expect = tryRun(sc);
    if (!expect) continue;
    const want = { ranged: 'rangedAction', fallback: null, phalanx: 'phalanxAction' }[kind];
    // Scenariusz musi wejsc w galaz rodziny (odwrot: U7.6 w dowolnym wyjsciu -- cios, stoi, odwrot).
    if (want && !expect.trace.includes(want)) continue;
    cases.push({ ...sc, name: `close-r3-${kind}-${got}`, kind, expect });
    got += 1;
  }
}
family('ranged', N_RANGED);
// Odwrot: kwoty wyjsc U7.6 (losowe placowanie daje glownie `heldAfterFallback`): krok odwrotu, cios sasiada, stoi.
{
  const quota = { move: 150, attack: 40, hold: N_FALLBACK - 190 };
  const got = { move: 0, attack: 0, hold: 0 };
  let n = 0;
  while (n < N_FALLBACK) {
    if (++tries > 2000000) throw new Error('za malo scenariuszy fallback');
    const sc = makeCase(k++, { kind: 'fallback' });
    if (!sc) continue;
    const expect = tryRun(sc);
    if (!expect) continue;
    const b = expect.attack ? 'attack' : (expect.steps.length > 0 ? 'move' : 'hold');
    if (got[b] >= quota[b]) continue;
    got[b] += 1;
    cases.push({ ...sc, name: `close-r3-fallback-${n}`, kind: 'fallback', expect });
    n += 1;
  }
}
family('phalanx', N_PHALANX);

const fam = (kind) => cases.filter((c) => c.kind === kind);
const shooterOf = (c) => (c.acting.side === 'atk' ? c.atk : c.def)[c.acting.idx];
const stats = {
  ranged: fam('ranged').length,
  rangedShot: fam('ranged').filter((c) => c.expect.blows.length === 1).length,
  rangedShotInPlace: fam('ranged').filter((c) => c.expect.blows.length === 1 && c.expect.steps.length === 0).length,
  rangedKiteMove: fam('ranged').filter((c) => c.expect.blows.length <= 1 && c.expect.steps.length === 1
    && c.expect.duration !== 240 * 1 + 70 && shooterOf(c).primaryRanged).length,
  rangedForward: fam('ranged').filter((c) => c.expect.steps.length >= 1 && c.expect.blows.length === 0).length,
  rangedForwardThenShot: fam('ranged').filter((c) => c.expect.steps.length >= 1 && c.expect.blows.length === 1).length,
  rangedMulti: fam('ranged').filter((c) => c.expect.steps.length >= 2).length,
  rangedHold: fam('ranged').filter((c) => c.expect.steps.length === 0 && c.expect.blows.length === 0).length,
  fallback: fam('fallback').length,
  fallbackMove: fam('fallback').filter((c) => c.expect.trace.includes('fallBackStep') && c.expect.steps.length > 0).length,
  fallbackMulti: fam('fallback').filter((c) => c.expect.steps.length >= 2).length,
  fallbackAttack: fam('fallback').filter((c) => c.expect.attack).length,
  fallbackHold: fam('fallback').filter((c) => !c.expect.attack && !c.expect.trace.includes('fallBackStep')).length,
  phalanx: fam('phalanx').length,
  phalanxAttack: fam('phalanx').filter((c) => c.expect.attack).length,
  phalanxStep: fam('phalanx').filter((c) => !c.expect.phalanxAdvance && c.expect.steps.length === 1).length,
  phalanxAdvance: fam('phalanx').filter((c) => c.expect.phalanxAdvance).length,
  phalanxHold: fam('phalanx').filter((c) => !c.expect.attack && c.expect.steps.length === 0).length,
};
console.error(JSON.stringify(stats));
const cavMult = Object.fromEntries(TERRAIN_NAMES.map((n) => [n, cavMultOf(n)]));
const outDir = join(here, 'p6_k5loop_close_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors_r3.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats, cases }) + '\n');
console.error(`zapisano ${cases.length} wektorow`);

// Lekcja r2 (a): `ru.moveLeft = NaN` dla strzelca, odwrotu i falangi, w OSOBNYM pliku (bez wywolan `rnd`). Wejscia =
// kopie wszystkich scenariuszy rodzin wyzej z NaN jednostki dzialajacej; oczekiwanie z tekstu pinu. Pin konczy petle
// ruchu przy `ru.moveLeft > 0` falszywym (`:6806`, `:7240`), a preludium `moveLeft <= 0` przepuszcza NaN, wiec kazda
// galaz robi co najwyzej jeden krok marszu/odwrotu (KITE: jeden krok z definicji). NaN w JSON = napis "NaN".
const nanCases = [];
for (const c of cases) {
  const { expect: _old, name, kind, ...sc0 } = c;
  const sc = JSON.parse(JSON.stringify(sc0));
  const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
  own[sc.acting.idx].moveLeft = NaN;
  const expect = tryRun(sc);
  if (!expect) continue;
  if (kind !== 'phalanx' && expect.steps.length > 1) throw new Error(`${name}: NaN, pin wykonal ${expect.steps.length} krokow`);
  nanCases.push({ ...sc, name: name.replace('close-r3-', 'close-r3-nan-'), kind: `${kind}-nan`, expect });
}
const nanStats = {
  nan: nanCases.length,
  nanMoved: nanCases.filter((c) => c.expect.steps.length >= 1).length,
  nanRangedMoved: nanCases.filter((c) => c.kind === 'ranged-nan' && c.expect.steps.length === 1).length,
  nanFallbackMoved: nanCases.filter((c) => c.kind === 'fallback-nan' && c.expect.steps.length === 1).length,
  nanPhalanxMoved: nanCases.filter((c) => c.kind === 'phalanx-nan' && c.expect.steps.length >= 1).length,
};
console.error(JSON.stringify(nanStats));
const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);
writeFileSync(
  join(outDir, 'vectors_r3_nan.json'),
  JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats: nanStats, cases: nanCases }, nanJson) + '\n',
);
console.error(`zapisano ${nanCases.length} wektorow NaN`);
