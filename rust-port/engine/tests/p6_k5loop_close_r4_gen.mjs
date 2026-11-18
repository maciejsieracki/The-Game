// P6 SIEGE K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, DODATEK r4, Operator): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs):
// 1. ucieczka `_fleeStep` (`:9845-9897`) z `_removeUnitFromScene` (`:9910-9925`) i ripple `_shakeAlliesOnLoss`
//    (`:9743-9754`, dalej `_checkRout`, `_startRout`, `_checkMeleeScreenLost`, `_boostEnemiesOnBreak`, `_gainMorale`),
//    dla jednostki juz rozbitej (`:6055`, rodzina `flee`) i rozbitej okrazeniem w tej aktywacji (`:6105-6118`, `surround`);
// 2. strzelec z amunicja i `shootingEnabled = false` (`nobow`): zasieg strzalu w `_targetInRange` (`:8373-8410`, z
//    kierunkiem natarcia `:8402`), `_canAttackFrom` (`:8436-8444`), `_makeCanAttackFromTest` (`:8454`),
//    `_canStrikeTargetFrom` (`:8487-8493`), `_doAttack` -> `_doRangedAttack` (`:8787-8797`);
// 3. uwagi FC r3: FC-U1 (`ammo2`: dwie aktywacje strzelca z `ammoLeft = 1`, druga idzie U7.6) i FC-U2 (`steady2`:
//    `_rangedFiringStepStaysBehindMelee` z >= 2 sojusznikami wrecz w najblizszym wierszu i roznymi kolumnami).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_close_r4_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_close_vectors/vectors_r4.json (+ vectors_r4_nan.json). Ziarno 5404. Pliki
// r1/r2/r3 NIE sa zmieniane.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show). Wycinki r3 (naglowek + koniec + SHA-256 calosci) plus:
// MORALE_ALLY_DEATH_LOSS (1118), MORALE_DEATH_RADIUS (1129), MORALE_ENEMY_BREAK_GAIN (1141), _gainMorale (9695),
// _boostEnemiesOnBreak (9707), _shakeAlliesOnLoss (9743), _checkMeleeScreenLost (9761), _startRout (9799), _fleeStep
// (9845), _removeUnitFromScene (9910).
//
// STUBY jak w r3, poza portowanymi wyzej (teraz tekst pinu). `_updateMoraleBar`: pasek (THREE) bez logiki gry; generator
// zapisuje wywolania bezposrednio z petli `_shakeAlliesOnLoss` (`:9749`, akcja `Shaken` w Rust). `toCombatUnit` i
// `terrainDefenseMultiplier` w `_checkRout` (`:9789-9791`): atrapa zwraca mnoznik obrony terenu jednostki = wejscie
// adaptera (`terrain_defence_mult` w Rust, pole `tdm` wektora). `_sfxRout`, log, `routedUnits`, scena THREE: atrapy bez
// logiki gry. Dowodca armii (`isArmyCommander`) poza zakresem (pole nieobecne = `false`). FC-U2: wybor scenariuszy
// porownuje wynik pinu z kopia, w ktorej `Math.min` postepu pasa (`:8187`) zamieniono na `Math.max` (tylko do selekcji;
// oczekiwanie = tekst pinu bez zmian).

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
const SEED = 5404;
const N_FLEE = 400;
const N_SURROUND = 200;
const N_NOBOW = 480;
const N_AMMO2 = 60;
const N_STEADY2 = 40;
const N_SURROUND_LEFT = 40;

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
  [1118, 1118, 'const MORALE_ALLY_DEATH_LOSS'],
  [1129, 1129, 'const MORALE_DEATH_RADIUS'],
  [1141, 1141, 'const MORALE_ENEMY_BREAK_GAIN'],
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
  [9695, 'private _gainMorale('],
  [9707, 'private _boostEnemiesOnBreak('],
  [9743, 'private _shakeAlliesOnLoss('],
  [9761, 'private _checkMeleeScreenLost('],
  [9783, 'private _checkRout('],
  [9799, 'private _startRout('],
  [9845, 'private _fleeStep('],
  [9910, 'private _removeUnitFromScene('],
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
if (methodEnd(9845) !== 9898) throw new Error('koniec _fleeStep != 9898');
if (methodEnd(9910) !== 9925) throw new Error('koniec _removeUnitFromScene != 9925');
if (methodEnd(9743) !== 9753) throw new Error('koniec _shakeAlliesOnLoss != 9753');
if (methodEnd(9799) !== 9834) throw new Error('koniec _startRout != 9834');
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
const EXPECTED_SHA256 = '72337be6046fd0541c25dbf2bcd79d10c34e07e6bdf24136c5d6b21d80b92c48';
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
  // `_checkRout` (`:9789-9791`): mnoznik obrony terenu jednostki = wejscie adaptera (`bu.__tdm`).
  'function toCombatUnit(bu) { return { rola: bu.__tdm }; }',
  'function terrainDefenseMultiplier(_terr, rola) { return rola; }',
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
  '    this.projectiles = []; this.scene = { add() {}, remove() {} }; this.log = []; this.routedUnits = [];',
  '    this.__shakeDirect = null; this.__shaken = []; this.__routs = []; this.__leaves = []; this.__order = []; this.__fleeStarted = false;',
  `    this._targetPriorities = {\n${prioInit}\n    }; }`,
  '  _now() { return this.vNow; }',
  '  _raf(cb) { this.__q.push({ kind: "raf", cb }); }',
  '  _schedule(ms, cb) { this.__q.push({ kind: "sched", ms, cb }); }',
  '  _applyTerrainRange(ru) { this.__trace.push("terrainRange"); }',
  '  _isPlayerSide(side) { return false; }',
  '  _performPlayerOrder() { throw new Error("tryb reczny poza zakresem"); }',
  '  _executeGroupDoctrineStep() { throw new Error("doktryna poza zakresem (autoPlay=false)"); }',
  '  __tag(ru) { return ru.side + (ru.side === "atk" ? this.atk : this.def).indexOf(ru); }',
  // Pasek morale (THREE): bez logiki gry. Wywolanie bezposrednio z petli `_shakeAlliesOnLoss` (`:9749`) = akcja `Shaken`.
  '  _updateMoraleBar(ru) { if (this.__shakeDirect) { this.__shaken.push({ unit: this.__tag(ru), fallen: this.__shakeDirect, morale: ru.morale, t: this.vNow }); this.__order.push("S:" + this.__tag(ru)); } }',
  '  _shakeAlliesOnLoss(f) { const s = this.__shakeDirect; this.__shakeDirect = this.__tag(f); try { return this._shakeAlliesOnLossPin(f); } finally { this.__shakeDirect = s; } }',
  '  _checkRout(ru) { const s = this.__shakeDirect; this.__shakeDirect = null; try { return this._checkRoutPin(ru); } finally { this.__shakeDirect = s; } }',
  '  _checkMeleeScreenLost(side) { const s = this.__shakeDirect; this.__shakeDirect = null; try { return this._checkMeleeScreenLostPin(side); } finally { this.__shakeDirect = s; } }',
  // Zapis routu w chwili `_sfxRout()` (`:9801`, poczatek `_startRout`, przed kaskada oslony wrecz), jak akcja `Rout`.
  '  _startRout(ru) { if (!(ru.routed || ru.dead || ru.fadingOut)) { this.__routs.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("R:" + this.__tag(ru)); } const s = this.__shakeDirect; this.__shakeDirect = null; try { this._startRoutPin(ru); } finally { this.__shakeDirect = s; } }',
  '  _removeUnitFromScene(ru) { const was = ru.removed; this._removeUnitFromScenePin(ru); if (!was) { this.__leaves.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("L:" + this.__tag(ru)); } }',
  '  _fleeStep(ru, done) { if (!this.__fleeStarted) { this.__fleeStarted = true; this.__trace.push("flee"); } return this._fleeStepPin(ru, done); }',
  '  _sfxRout() {}',
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
    if (a === 9743) t = rename(t, '_shakeAlliesOnLoss(fallen: RuntimeBattleUnit', '_shakeAlliesOnLossPin(fallen: RuntimeBattleUnit');
    if (a === 9761) t = rename(t, "_checkMeleeScreenLost(side: 'atk' | 'def'", "_checkMeleeScreenLostPin(side: 'atk' | 'def'");
    if (a === 9783) t = rename(t, '_checkRout(ru: RuntimeBattleUnit', '_checkRoutPin(ru: RuntimeBattleUnit');
    if (a === 9799) t = rename(t, '_startRout(ru: RuntimeBattleUnit', '_startRoutPin(ru: RuntimeBattleUnit');
    if (a === 9845) t = rename(t, '_fleeStep(ru: RuntimeBattleUnit', '_fleeStepPin(ru: RuntimeBattleUnit');
    if (a === 9910) t = rename(t, '_removeUnitFromScene(ru: RuntimeBattleUnit', '_removeUnitFromScenePin(ru: RuntimeBattleUnit');
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

// FC-U2 (selekcja): kopia klasy z `Math.max` postepu pasa (`:8187`). Tylko do wyboru scenariuszy, ktore rozrozniaja
// `min`/`max`; oczekiwanie zawsze z tekstu pinu (Harness).
const MIN_LANE = 'const meleeLaneProgress = Math.min(...meleeLane.map(u => progress(u.q)));';
if (!classSrc.includes(MIN_LANE)) throw new Error('brak Math.min postepu pasa w tekscie pinu');
const execJsMax = tsLib.transpileModule(classSrc.replace(MIN_LANE, MIN_LANE.replace('Math.min', 'Math.max')), {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
}).outputText;
const modMax = { exports: {} };
new Function('module', 'exports', 'require', execJsMax)(modMax, modMax.exports, createRequire(import.meta.url));
const HarnessMaxLane = modMax.exports.Harness;

const ATTACK_DIRS = ['front', 'front', 'bok', 'tyl'];

// Scenariusz: format r3 + pola morale (`morale`, `fleeMorale`, `moraleMax`, `neverRout`, `tdm`), `fleeStuck`,
// `shootingEnabled`, `attackDirection` (brak = wartosc spawnu pinu).
function makeCase(kind) {
  const actSide = rnd() < 0.5 ? 'atk' : 'def';
  const enemySide = actSide === 'atk' ? 'def' : 'atk';
  const nOwn = ri(1, 6);
  let nEnemy = ri(1, 6);
  const tight = kind === 'flee' ? rnd() < 0.8 : rnd() < 0.75;
  const nearEdge = kind === 'flee' && rnd() < 0.6;
  const c0 = nearEdge ? (actSide === 'atk' ? ri(0, 6) : ri(61, 67)) : ri(15, 50);
  const r0 = pick([ri(0, 3), ri(65, 90), ri(65, 90), ri(152, 155)]);
  const span = tight ? 3 : 8;
  const used = new Set();
  const free = (q, r) => q >= 0 && q <= 67 && r >= 0 && r <= 155 && !used.has(q + ',' + r);
  const place = () => {
    for (let t = 0; t < 400; t++) {
      const q = Math.max(0, Math.min(67, c0 + ri(-span, span)));
      const r = Math.max(0, Math.min(155, r0 + ri(-span, span)));
      if (free(q, r)) { used.add(q + ',' + r); return [q, r]; }
    }
    throw new Error('brak wolnego pola');
  };
  const groupMeta = [];
  const mkUnit = (side, i, acting, at) => {
    const [q, r] = at ?? place();
    if (at) used.add(q + ',' + r);
    const u = {
      side, idx: i, q, r, facing: ri(0, 3), moveLeft: pick(MOVE_LEFTS), dead: false, fadingOut: false, routed: false,
      unitDoctrine: null, groupId: null, formationRank: rnd() < 0.35 ? null : ri(0, 3),
      hp: pick([40, 60, 60, 80, 100, 100, 120]), mounted: false, primaryRanged: false, rangedBase: false,
      antiCavSpear: false, morale: 100, fleeMorale: 0, moraleMax: 100, neverRout: false, tdm: 1,
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
      if (!u.mounted && !u.rangedBase && rnd() < 0.1) u.phalanx = true;
      // Morale: progi rozbicia blisko straty ripple (12) i polowy oslony wrecz, zeby kaskady rout wystepowaly.
      u.morale = pick([100, 100, 60, 40, 30, 25, 20, 15, 12, 10, 8]);
      u.fleeMorale = pick([0, 0, 5, 10, 15, 20, 30]);
      u.neverRout = rnd() < 0.05;
      u.tdm = rnd() < 0.2 ? 1.5 : 1;
    }
    return u;
  };
  const own = [];
  const actIdx = ri(0, nOwn - 1);
  const enemies = [];
  if (kind === 'surround') {
    // Okrazenie (`:6105-6118`): >= 3 zywych wrogow na polach sasiednich jednostki dzialajacej.
    const me0 = place();
    const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dq, dr]) => [me0[0] + dq, me0[1] + dr]).filter(([q, r]) => free(q, r));
    if (nbrs.length < 3) return null;
    const k = Math.min(nbrs.length, ri(3, 4));
    nEnemy = Math.max(nEnemy, k);
    // Pola okrazenia zarezerwowane przed rozstawieniem reszty (jedna jednostka na pole).
    for (const [q, r] of nbrs.slice(0, k)) used.add(q + ',' + r);
    for (let i = 0; i < nOwn; i++) own.push(mkUnit(actSide, i, i === actIdx, i === actIdx ? me0 : undefined));
    for (let i = 0; i < nEnemy; i++) {
      const e = mkUnit(enemySide, i, false, i < k ? nbrs[i] : undefined);
      if (i < k) { e.dead = false; e.routed = false; e.fadingOut = false; }
      enemies.push(e);
    }
  } else {
    for (let i = 0; i < nOwn; i++) own.push(mkUnit(actSide, i, i === actIdx));
    for (let i = 0; i < nEnemy; i++) enemies.push(mkUnit(enemySide, i, false));
  }
  const me = own[actIdx];
  const mode = ri(0, 3);
  if (mode === 0) me.unitDoctrine = 'manual';
  else if (mode === 1) { me.groupId = 'g1'; groupMeta.push(['g1', 'steady', false]); }
  else if (mode === 2) { me.groupId = 'g2'; groupMeta.push(['g2', pick(DOCTRINES), false]); }
  else { me.groupId = 'g3'; groupMeta.push(['g3', 'manual', rnd() < 0.5]); }
  if (rnd() < 0.3) me.moveLeft = pick([3, 4, 6, 8]);
  const adv = (u) => (u.side === 'atk' ? u.q : -u.q);
  if (kind === 'flee') {
    // Jednostka rozbita na poczatku aktywacji (`:6055`): `_fleeStep`.
    me.routed = true;
    me.moveLeft = pick([0, 1, 1, 2, 2, 3, 4, 6, 1.5, 2.5, 0.5]);
    me.fleeStuck = pick([0, 0, 0, 1, 1]);
    me.primaryRanged = rnd() < 0.3;
    me.rangedBase = me.primaryRanged;
    me.mounted = !me.primaryRanged && rnd() < 0.2;
  } else if (kind === 'surround') {
    me.morale = pick([5, 8, 10, 12, 15, 18, 20, 25]);
    me.fleeMorale = pick([0, 3, 5, 8, 10]);
    me.tdm = rnd() < 0.25 ? 1.5 : 1;
    me.primaryRanged = rnd() < 0.3;
    me.rangedBase = me.primaryRanged;
    me.mounted = !me.primaryRanged && rnd() < 0.15;
    me.fleeStuck = pick([0, 0, 1]);
  } else if (kind === 'nobow') {
    // Strzelec z amunicja i `shootingEnabled = false` (`:6241` nie wchodzi): sciezki wrecz z zasiegiem strzalu.
    me.rangedBase = true;
    me.ammoLeft = pick(['Infinity', 1, 2, 5]);
    me.range = ri(2, 6);
    me.shootingEnabled = false;
    me.primaryRanged = rnd() < 0.45;
    const x = rnd();
    if (x < 0.18) me.mounted = true;
    else if (x < 0.36) me.phalanx = true;
    me.attackDirection = pick(ATTACK_DIRS);
    if (me.primaryRanged) {
      me.dryCol = rnd() < 0.5 ? -1 : adv(me) + ri(-1, 3);
      me.heldAfterFallback = rnd() < 0.08;
    }
    if (me.moveLeft <= 0 && rnd() < 0.7) me.moveLeft = pick([2, 3, 4]);
  } else if (kind === 'ammo2') {
    // FC-U1: strzelec z jednym pociskiem; druga aktywacja idzie U7.6 (`canShoot` falszywe, `:1457`, `:9191`).
    me.rangedBase = true;
    me.primaryRanged = true;
    me.ammoLeft = 1;
    me.range = ri(2, 5);
    me.rangedKite = rnd() < 0.5;
    if (me.moveLeft <= 0) me.moveLeft = pick([2, 3, 4]);
  } else if (kind === 'steady2') {
    // FC-U2: doktryna `steady` (grupa), >= 2 sojusznikow wrecz w jednym wierszu (rozne kolumny), wrogowie poza zasiegiem.
    me.rangedBase = true;
    me.primaryRanged = rnd() < 0.8;
    me.ammoLeft = 'Infinity';
    me.range = ri(2, 4);
    me.unitDoctrine = null;
    me.groupId = 'g1';
    groupMeta.length = 0;
    groupMeta.push(['g1', 'steady', false]);
    me.moveLeft = pick([2, 3, 4, 6]);
  }
  const tiles = [];
  const tileSeen = new Set();
  const nTiles = ri(0, kind === 'flee' || kind === 'surround' ? 60 : 160);
  for (let t = 0; t < nTiles; t++) {
    const c = Math.max(0, Math.min(67, c0 + ri(-span - 4, span + 4)));
    const r = Math.max(0, Math.min(155, r0 + ri(-span - 4, span + 4)));
    const key = c + ',' + r;
    if (tileSeen.has(key)) continue;
    tileSeen.add(key);
    const x = rnd();
    const name = pick(TERRAIN_NAMES);
    if (x < 0.25) tiles.push([c, r, false, 1, false, name]);
    else if (x < 0.55) tiles.push([c, r, true, pick([2, 3]), false, name]);
    else if (x < 0.75) tiles.push([c, r, true, pick([1, 2, 3]), true, name]);
    else tiles.push([c, r, true, pick([1, 99, 150, 0.5]), false, name]);
  }
  const atk = actSide === 'atk' ? own : enemies;
  const def = actSide === 'atk' ? enemies : own;
  return { acting: { side: actSide, idx: actIdx }, atk, def, groupMeta, tiles };
}

// FC-U2: dopisanie sojusznikow linii wrecz w jednym wierszu (gap 0..2 od strzelca), kolumny rozne; wrogowie dalej niz
// zasieg (marsz `_rangedForwardStep`).
function addSteadyLane(sc) {
  const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
  const enemies = sc.acting.side === 'atk' ? sc.def : sc.atk;
  const me = own[sc.acting.idx];
  const used = new Set([...sc.atk, ...sc.def].map((u) => u.q + ',' + u.r));
  const dr = pick([0, 1, -1, 2]);
  const row = me.r + dr;
  if (row < 0 || row > 155) return null;
  const n = ri(2, 3);
  const fwd = me.side === 'atk' ? 1 : -1;
  let added = 0;
  for (let k = 0; k < 8 && added < n; k++) {
    const q = me.q + fwd * ri(-2, 4);
    if (q < 0 || q > 67 || used.has(q + ',' + row) || (q === me.q && row === me.r)) continue;
    used.add(q + ',' + row);
    own.push({
      side: me.side, idx: own.length, q, r: row, facing: ri(0, 3), moveLeft: 2, dead: false, fadingOut: false,
      routed: false, unitDoctrine: null, groupId: null, formationRank: null, hp: 100, mounted: false,
      primaryRanged: false, rangedBase: false, antiCavSpear: false, morale: 100, fleeMorale: 0, moraleMax: 100,
      neverRout: false, tdm: 1,
    });
    added += 1;
  }
  if (added < 2) return null;
  for (const e of enemies) {
    e.q = me.side === 'atk' ? Math.min(67, me.q + ri(8, 14)) : Math.max(0, me.q - ri(8, 14));
  }
  // Jednoznaczne pola po przesunieciu wrogow.
  const seen = new Set();
  for (const u of [...sc.atk, ...sc.def]) {
    const k = u.q + ',' + u.r;
    if (seen.has(k)) return null;
    seen.add(k);
  }
  return sc;
}

function newHarness(sc, HarnessClass = Harness) {
  const h = new HarnessClass();
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
    bu: { id: u.side + u.idx, nazwa: u.side + u.idx, hp: u.hp ?? 100, __tdm: u.tdm ?? 1 }, side: u.side, q: u.q, r: u.r,
    facing: u.facing, moveLeft: u.moveLeft, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.dead,
    surroundApplied: false, neverRout: u.neverRout ?? false, morale: u.morale ?? 100, fleeMorale: u.fleeMorale ?? 0,
    moraleMax: u.moraleMax ?? 100, screenLostApplied: false, fleeStuck: u.fleeStuck ?? 0,
    range: u.range ?? 1, onWallWalkway: false,
    primaryRanged: u.primaryRanged ?? false, rangedBase: u.rangedBase ?? false, mounted: u.mounted ?? false,
    antiCavSpear: u.antiCavSpear ?? false, phalanx: u.phalanx ?? false, shootingEnabled: u.shootingEnabled ?? true,
    ammoLeft: u.ammoLeft === 'Infinity' ? Infinity : (u.ammoLeft ?? 0), ammoMax: 5,
    ...(u.rangedKite === false ? { rangedKite: false } : {}),
    dryCol: u.dryCol ?? -1, heldAfterFallback: u.heldAfterFallback ?? false,
    playerOrder: { type: 'none' }, unitDoctrine: u.unitDoctrine ?? null, groupId: u.groupId ?? null,
    ...(u.formationRank === null || u.formationRank === undefined ? {} : { formationRank: u.formationRank }),
    ...(u.attackDirection ? { attackDirection: u.attackDirection } : {}),
    mats: [], perTokenGeos: [],
    group: { position: { set() {} }, rotation: { y: 0 }, visible: true }, hpBarGroup: { position: { set() {} }, visible: true },
  });
  h.atk = sc.atk.map(mk);
  h.def = sc.def.map(mk);
  for (const ru of [...h.atk, ...h.def]) {
    if (!ru.removed && !ru.routed) h.occByKey.set(ru.q + ',' + ru.r, ru);
  }
  return h;
}

// Jedna aktywacja `_activateUnit` od chwili 0 (czasy wzgledne), z zapisem sladu i efektow.
function activate(h, sc) {
  const ru = (sc.acting.side === 'atk' ? h.atk : h.def)[sc.acting.idx];
  h.vNow = 0;
  h.__trace = []; h.__steps = []; h.__facing = []; h.__attack = null; h.__blows = []; h.__shaken = []; h.__routs = [];
  h.__leaves = []; h.__order = []; h.__advStarted = false; h.__rangedStarted = false; h.__fbStarted = false; h.__phStarted = false;
  h.__phalanxAdvance = false; h.__fleeStarted = false;
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
  const tagOf = (u) => u.side + (u.side === 'atk' ? h.atk : h.def).indexOf(u);
  const occ = [...h.occByKey.entries()].map(([k, u]) => {
    const [c, r] = k.split(',').map(Number);
    return [c, r, tagOf(u)];
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
      fleeStuck: ru.fleeStuck ?? 0,
    },
    blows: h.__blows,
    phalanxAdvance: h.__phalanxAdvance,
    occ,
    shaken: h.__shaken,
    routs: h.__routs,
    leaves: h.__leaves,
    // U1 Evaluatora r4: globalna kolejnosc zdarzen Shaken/Rout/Leave w strumieniu (pin `_updateMoraleBar` przed
    // `_checkRout`, `:9749-9750`; `_removeUnitFromScene` przed ripple, `:9855-9856`).
    order: h.__order,
    // Stan wszystkich jednostek po aktywacji (ripple, kaskady rout, boost wrogow, oslona wrecz).
    units: [...h.atk, ...h.def].map((u) => ({
      tag: tagOf(u), morale: u.morale, routed: !!u.routed, dead: !!u.dead, removed: !!u.removed,
      fadingOut: !!u.fadingOut, acted: !!u.acted, facing: u.facing, screenLostApplied: !!u.screenLostApplied,
    })),
  };
}

function runCase(sc) {
  return activate(newHarness(sc), sc);
}

const cases = [];
let tries = 0;
function family(kind, n, accept) {
  let got = 0;
  while (got < n) {
    if (++tries > 2000000) throw new Error(`za malo scenariuszy ${kind}`);
    let sc = makeCase(kind);
    if (!sc) continue;
    if (kind === 'steady2') sc = addSteadyLane(sc);
    if (!sc) continue;
    const expect = runCase(sc);
    if (!accept(expect, sc)) continue;
    const c = { ...sc, name: `close-r4-${kind}-${got}`, kind, expect };
    if (kind === 'ammo2') {
      // Druga aktywacja tego samego strzelca na stanie po pierwszej: `_beginTurn` odnawia `moveLeft` i zeruje `acted`
      // (`:5650-5660`); reszta stanu (amunicja, `dryCol`, pozycje, facing) zostaje.
      const h = newHarness(sc);
      activate(h, sc);
      const ru = (sc.acting.side === 'atk' ? h.atk : h.def)[sc.acting.idx];
      ru.moveLeft = (sc.acting.side === 'atk' ? sc.atk : sc.def)[sc.acting.idx].moveLeft;
      for (const u of [...h.atk, ...h.def]) u.acted = false;
      c.expect2 = activate(h, sc);
    }
    if (kind === 'steady2') {
      // Tylko scenariusze, w ktorych `Math.max` postepu pasa daje inny wynik niz pin (rozroznia mutanta F3 FC r3).
      const alt = activate(newHarness(sc, HarnessMaxLane), sc);
      if (JSON.stringify(alt.steps) === JSON.stringify(expect.steps)) continue;
    }
    cases.push(c);
    got += 1;
  }
}
// Ucieczka: kwoty wyjsc (zniknieciem z pola, ruch bez znikniecia, zablokowana, bez ruchu).
{
  const quota = { leaveMove: 90, leaveEdge: 50, leaveStuck: 50, move: 120, stuck: 40, none: 50 };
  const got = Object.fromEntries(Object.keys(quota).map((k) => [k, 0]));
  let n = 0;
  while (n < N_FLEE) {
    if (++tries > 2000000) throw new Error('za malo scenariuszy flee');
    const sc = makeCase('flee');
    if (!sc) continue;
    const expect = runCase(sc);
    if (expect.trace.join() !== 'flee') throw new Error(`flee: slad ${expect.trace}`);
    const left = expect.leaves.length > 0;
    const moved = expect.steps.length > 0;
    const me = (sc.acting.side === 'atk' ? sc.atk : sc.def)[sc.acting.idx];
    const stuckNow = expect.final.fleeStuck > (me.fleeStuck ?? 0);
    const b = left ? (moved ? 'leaveMove' : (stuckNow ? 'leaveStuck' : 'leaveEdge'))
      : (moved ? 'move' : (stuckNow ? 'stuck' : 'none'));
    if (got[b] >= quota[b]) continue;
    got[b] += 1;
    cases.push({ ...sc, name: `close-r4-flee-${n}`, kind: 'flee', expect });
    n += 1;
  }
}
family('surround', N_SURROUND, (e) => e.trace.includes('flee'));
family('nobow', N_NOBOW, () => true);
family('ammo2', N_AMMO2, (e) => e.blows.length === 1);
family('steady2', N_STEADY2, (e) => e.trace.includes('rangedAction') && e.steps.length >= 1);
// U3 Evaluatora r4: okrazenie (`:6105-6118`) zakonczone zniknieciem z pola (`_fleeStep` po `_startRout`: krawedz
// wlasna albo `fleeStuck >= 2`, `:9850-9858`). Dopisane NA KONCU (po wszystkich rodzinach), wiec wczesniejsze wektory
// i ich rzuty `rnd` sa bez zmian.
{
  let got = 0;
  while (got < N_SURROUND_LEFT) {
    if (++tries > 4000000) throw new Error('za malo scenariuszy surround-left');
    const sc = makeCase('surround');
    if (!sc) continue;
    const expect = runCase(sc);
    if (!expect.trace.includes('flee') || expect.leaves.length === 0) continue;
    cases.push({ ...sc, name: `close-r4-surround-left-${got}`, kind: 'surround', expect });
    got += 1;
  }
}

const fam = (kind) => cases.filter((c) => c.kind === kind);
const actingOf = (c) => (c.acting.side === 'atk' ? c.atk : c.def)[c.acting.idx];
const stats = {
  flee: fam('flee').length,
  fleeLeft: fam('flee').filter((c) => c.expect.leaves.length > 0).length,
  fleeSteps: fam('flee').filter((c) => c.expect.steps.length > 0).length,
  fleeMultiStep: fam('flee').filter((c) => c.expect.steps.length >= 2).length,
  fleeShaken: fam('flee').filter((c) => c.expect.shaken.length > 0).length,
  fleeCascadeRout: fam('flee').filter((c) => c.expect.routs.length > 0).length,
  surround: fam('surround').length,
  surroundSteps: fam('surround').filter((c) => c.expect.steps.length > 0).length,
  surroundLeft: fam('surround').filter((c) => c.expect.leaves.length > 0).length,
  surroundCascade: fam('surround').filter((c) => c.expect.routs.length > 1).length,
  nobow: fam('nobow').length,
  nobowShot: fam('nobow').filter((c) => c.expect.blows.length === 1).length,
  nobowShotNoStep: fam('nobow').filter((c) => c.expect.blows.length === 1 && c.expect.steps.length === 0).length,
  nobowMove: fam('nobow').filter((c) => c.expect.steps.length > 0).length,
  nobowPrimary: fam('nobow').filter((c) => actingOf(c).primaryRanged).length,
  nobowMounted: fam('nobow').filter((c) => actingOf(c).mounted).length,
  nobowPhalanx: fam('nobow').filter((c) => actingOf(c).phalanx).length,
  nobowFlank: fam('nobow').filter((c) => actingOf(c).attackDirection !== 'front').length,
  ammo2: fam('ammo2').length,
  ammo2SecondFallback: fam('ammo2').filter((c) => c.expect2.trace.includes('fallBackStep')).length,
  ammo2SecondAttack: fam('ammo2').filter((c) => c.expect2.attack).length,
  steady2: fam('steady2').length,
};
console.error(JSON.stringify(stats));
const cavMult = Object.fromEntries(TERRAIN_NAMES.map((n) => [n, cavMultOf(n)]));
const outDir = join(here, 'p6_k5loop_close_vectors');
mkdirSync(outDir, { recursive: true });
const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);
writeFileSync(join(outDir, 'vectors_r4.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats, cases }, nanJson) + '\n');
console.error(`zapisano ${cases.length} wektorow`);

// Lekcja r2 (a): `ru.moveLeft = NaN` dla ucieczki (`flee`, `surround`) i strzelca bez strzelania (`nobow`), w OSOBNYM
// pliku (bez wywolan `rnd`). Preludium `_fleeStep` `moveLeft <= 0` przepuszcza NaN, a callback `ru.moveLeft > 0`
// (`:9895`) konczy, wiec ucieczka robi co najwyzej jeden krok.
const nanCases = [];
for (const c of cases) {
  if (!['flee', 'surround', 'nobow'].includes(c.kind)) continue;
  const { expect: _old, name, kind, ...sc0 } = c;
  const sc = JSON.parse(JSON.stringify(sc0));
  const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
  own[sc.acting.idx].moveLeft = NaN;
  const expect = runCase(sc);
  if (kind !== 'nobow' && expect.steps.length > 1) throw new Error(`${name}: NaN, pin wykonal ${expect.steps.length} krokow`);
  nanCases.push({ ...sc, name: name.replace('close-r4-', 'close-r4-nan-'), kind: `${kind}-nan`, expect });
}
const nanStats = {
  nan: nanCases.length,
  nanFleeMoved: nanCases.filter((c) => c.kind !== 'nobow-nan' && c.expect.steps.length === 1).length,
  nanNobowMoved: nanCases.filter((c) => c.kind === 'nobow-nan' && c.expect.steps.length >= 1).length,
};
console.error(JSON.stringify(nanStats));
writeFileSync(
  join(outDir, 'vectors_r4_nan.json'),
  JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats: nanStats, cases: nanCases }, nanJson) + '\n',
);
console.error(`zapisano ${nanCases.length} wektorow NaN`);
