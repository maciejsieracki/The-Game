// P6 SIEGE K5LOOP-SIEGE-DEF (dispatch R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1, Operator r1): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs):
// 1. obronca w oblezeniu (`siegeWallCol >= 0`, `ru.side === 'def'`) w `_activateUnit` (`battleScene.ts:6048-6299`):
//    bramka `siegeDefenderNeverDoctrine` (`:6087`), okrazenie (`:6105-6118`), `_updateFacing` (`:6123`), gałąź
//    `onWallWalkway` (`:6129-6172`: strzelec `_rangedTargetInRange`, kontrbateria katapulty `bestCata`, cios sasiada
//    `_targetInRange`, trzymanie muru), `_trySiegeTowerClimb`/`_siegeInfantryToTowerStep` (`:6179-6180`, dla obroncy
//    `return false`), SIEGE DEFENDER HOLD (`:6225-6236`); `_doAttack` -> `_doRangedAttack`/`_doMeleeAttack`;
//    `_targetInRange` z `_meleeBlockedByWall` (`:8361-8371`, `meleeBlockedByWall` z city-fortification.ts:76-79);
// 2. K5LOOP-KILL-RIPPLE (D-INT-2): zabicie w `_resolveBlowOutcome` (`:9019-9069`: `_startFade` `:9927`,
//    `_shakeAlliesOnLoss` `:9743` (wywolanie `:9048`), `_boostEnemiesOnBreak`, `_gainMorale`) z kaskadami
//    `_checkRout`/`_startRout`/`_checkMeleeScreenLost`.
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_siege_def_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_siege_def_vectors/{vectors.json,vectors_nan.json}. Ziarno 5501.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show). Wycinki r4 (`p6_k5loop_close_r4_gen.mjs`) plus:
// MORALE_HIT_LOSS_SCALE (1115), MORALE_KILL_GAIN (1140), _trySiegeTowerClimb (8056), _siegeInfantryToTowerStep (8087),
// _resolveBlowOutcome (9019), _startFade (9927), meleeBlockedByWall (city-fortification.ts:76); strażnik SHA-256 calosci.
//
// STUBY (bez logiki gry albo wejscie adaptera, jak w r4): `_applyTerrainRange` (zasieg = wejscie adaptera `range`,
// w tym x2 korony muru `_isWallCrownShooter`), `_isCatapult(bu)` = flaga `bu.__cata` (adapter `is_catapult`),
// `isSiegeUnit(bu)` = flaga `bu.__siege`, `_executeGroupDoctrineStep` = blad (obronca przy murze nigdy nie wola
// doktryny), `_fleeStep` = zapis `flee` i `done()` (przy murze `_doMove` czyta `_siegeMoveRefused`; w Rust jawny tag
// `ucieczka-oblezenie`), `_doMeleeAttack` = zapis celu i czasu (cios pokrywa rodzina `ripple`), `_singleBlow` = zapis
// trafienia, 0 obrazen (jak r4), `_pushClash`/`_sfxDeath`/log = atrapy. `_applyMoraleDamage` NIE jest wklejony:
// rodzina `ripple` wola `_resolveBlowOutcome` z `defender.bu.hp = 0` (galaz zabicia `:9044-9056`), wiec wywolanie
// galezi morale = TypeError generatora.

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
const SEED = 5501;
const FORT = 'gra/src/game/city-fortification.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = { [SCENE]: gitShow(SCENE).split('\n'), [FORM]: gitShow(FORM).split('\n'), [COMBAT]: gitShow(COMBAT).split('\n'), [FORT]: gitShow(FORT).split('\n') };
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
  [1115, 1115, 'const MORALE_HIT_LOSS_SCALE'],
  [1118, 1118, 'const MORALE_ALLY_DEATH_LOSS'],
  [1129, 1129, 'const MORALE_DEATH_RADIUS'],
  [1140, 1140, 'const MORALE_KILL_GAIN'],
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
  [8056, 'private _trySiegeTowerClimb('],
  [8087, 'private _siegeInfantryToTowerStep('],
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
  [9019, 'private _resolveBlowOutcome('],
  [9695, 'private _gainMorale('],
  [9707, 'private _boostEnemiesOnBreak('],
  [9743, 'private _shakeAlliesOnLoss('],
  [9761, 'private _checkMeleeScreenLost('],
  [9783, 'private _checkRout('],
  [9799, 'private _startRout('],
  [9845, 'private _fleeStep('],
  [9910, 'private _removeUnitFromScene('],
  [9927, 'private _startFade('],
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
if (methodEnd(9019) !== 9069) throw new Error('koniec _resolveBlowOutcome != 9069');
if (methodEnd(8056) !== 8084) throw new Error('koniec _trySiegeTowerClimb != 8084');
if (methodEnd(8087) !== 8101) throw new Error('koniec _siegeInfantryToTowerStep != 8101');
if (methodEnd(9927) !== 9938) throw new Error('koniec _startFade != 9938');
expectLine(FORT, 76, 'export function meleeBlockedByWall(');
const fortEnd = fnEnd(FORT, 76);
if (fortEnd !== 79) throw new Error('koniec meleeBlockedByWall != 79');
const formStart = findLine(FORM, 'export function compactLineAllowsAdvance(');

const parts = [
  ...TOP.map(([a, b]) => L(SCENE, a, b)),
  L(SCENE, 2328, 2332),
  ...TOP_FN.map(([a]) => L(SCENE, a, fnEnd(SCENE, a))),
  ...COMBAT_FN.map(([a]) => L(COMBAT, a, fnEnd(COMBAT, a))),
  L(FORM, formStart, fnEnd(FORM, formStart)),
  ...METHODS.map(([a]) => L(SCENE, a, methodEnd(a))),
  L(FORT, 76, fortEnd),
];
const PIN_SHA256 = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
console.error(`sha256 wycinkow pinu = ${PIN_SHA256}`);
const EXPECTED_SHA256 = 'e8e86aec589637a83159e765eab68f09198932326f7505d03b97cde7468a9deb';
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
  'function isSiegeUnit(bu) { return !!bu.__siege; }',
  stripExport(L(FORT, 76, fortEnd)),
  'function attackerWallEntryIsBreach() { throw new Error("wejscie na mur poza zakresem (strona atk)"); }',
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
  '  _executeGroupDoctrineStep() { throw new Error("obronca przy murze nie wola doktryny (:6087)"); }',
  '  __tag(ru) { return ru.side + (ru.side === "atk" ? this.atk : this.def).indexOf(ru); }',
  // Pasek morale (THREE): bez logiki gry. Wywolanie bezposrednio z petli `_shakeAlliesOnLoss` (`:9749`) = akcja `Shaken`.
  '  _updateMoraleBar(ru) { if (this.__shakeDirect) { this.__shaken.push({ unit: this.__tag(ru), fallen: this.__shakeDirect, morale: ru.morale, t: this.vNow }); this.__order.push("S:" + this.__tag(ru)); } }',
  '  _shakeAlliesOnLoss(f) { const s = this.__shakeDirect; this.__shakeDirect = this.__tag(f); try { return this._shakeAlliesOnLossPin(f); } finally { this.__shakeDirect = s; } }',
  '  _checkRout(ru) { const s = this.__shakeDirect; this.__shakeDirect = null; try { return this._checkRoutPin(ru); } finally { this.__shakeDirect = s; } }',
  '  _checkMeleeScreenLost(side) { const s = this.__shakeDirect; this.__shakeDirect = null; try { return this._checkMeleeScreenLostPin(side); } finally { this.__shakeDirect = s; } }',
  // Zapis routu w chwili `_sfxRout()` (`:9801`, poczatek `_startRout`, przed kaskada oslony wrecz), jak akcja `Rout`.
  '  _startRout(ru) { if (!(ru.routed || ru.dead || ru.fadingOut)) { this.__routs.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("R:" + this.__tag(ru)); } const s = this.__shakeDirect; this.__shakeDirect = null; try { this._startRoutPin(ru); } finally { this.__shakeDirect = s; } }',
  '  _removeUnitFromScene(ru) { const was = ru.removed; this._removeUnitFromScenePin(ru); if (!was) { if (this.__killing === ru) { this.__order.push("K:" + this.__tag(ru)); } else { this.__leaves.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("L:" + this.__tag(ru)); } } }',
  '  _fleeStep(ru, done) { if (this.siegeWallCol >= 0) { this.__trace.push("flee"); done(); return; } if (!this.__fleeStarted) { this.__fleeStarted = true; this.__trace.push("flee"); } return this._fleeStepPin(ru, done); }',
  '  _sfxDeath() {}',
  '  _pushClash() {}',
  '  _sfxRout() {}',
  '  _trySiegeTowerClimb(ru, done) { this.__trace.push("towerClimb"); return this._trySiegeTowerClimbPin(ru, done); }',
  '  _siegeInfantryToTowerStep(ru, done) { this.__trace.push("infToTower"); return this._siegeInfantryToTowerStepPin(ru, done); }',
  '  _siegeRamTowerStep() { throw new Error("taran poza zakresem"); }',
  '  _isCatapult(bu) { return !!bu.__cata; }',
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
    if (a === 8056) t = rename(t, '_trySiegeTowerClimb(ru: RuntimeBattleUnit', '_trySiegeTowerClimbPin(ru: RuntimeBattleUnit');
    if (a === 8087) t = rename(t, '_siegeInfantryToTowerStep(ru: RuntimeBattleUnit', '_siegeInfantryToTowerStepPin(ru: RuntimeBattleUnit');
    return t;
  }),
  '}',
  'module.exports.Harness = Harness; module.exports.cavalryTerrainMultiplier = cavalryTerrainMultiplier; module.exports.facingFromTo = facingFromTo;',
].join('\n');

const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(mod, mod.exports, createRequire(import.meta.url));
const { Harness, cavalryTerrainMultiplier, facingFromTo } = mod.exports;

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
const N_DEF = { 'walk-shoot': 160, 'walk-cata': 140, 'walk-melee': 160, 'hold-shoot': 140, 'hold-melee': 200, surround: 80 };
const N_RIPPLE = 320;

// Jednostka scenariusza (format jak r4 + pola muru: `onWall`, `cata`, `siege`).
function baseUnit(side, idx, q, r) {
  return {
    side, idx, q, r, facing: ri(0, 3), moveLeft: pick([0, 1, 2, 3]), dead: false, fadingOut: false, routed: false,
    unitDoctrine: null, groupId: null, formationRank: null, hp: pick([1, 20, 40, 40, 60, 80, 100, 100, 120]),
    mounted: false, primaryRanged: false, rangedBase: false, antiCavSpear: false, morale: 100, fleeMorale: 0,
    moraleMax: 100, neverRout: false, tdm: 1, onWall: false, cata: false, siege: false, range: 1,
  };
}

function randomizeState(u) {
  const x = rnd();
  if (x < 0.07) u.dead = true;
  else if (x < 0.14) u.routed = true;
  else if (x < 0.18) u.fadingOut = true;
}

// Obronca w oblezeniu. Mur w kolumnie W; atakujacy na zachod od muru (q < W) albo na koronie po wiezy (q = W,
// `onWallWalkway`); obroncy na koronie (q = W) albo za murem (q > W), czasem w bramie (q = W bez korony).
function makeDefCase(kind) {
  const W = ri(20, 50);
  const r0 = ri(4, 150);
  const used = new Set();
  const free = (q, r) => q >= 0 && q <= 67 && r >= 0 && r <= 155 && !used.has(q + ',' + r);
  const take = (q, r) => { used.add(q + ',' + r); return [q, r]; };
  const placeIn = (q0, q1, span) => {
    for (let t = 0; t < 400; t++) {
      const q = ri(q0, q1);
      const r = Math.max(0, Math.min(155, r0 + ri(-span, span)));
      if (free(q, r)) return take(q, r);
    }
    return null;
  };
  const walk = kind.startsWith('walk');
  let meQ;
  if (walk) meQ = W;
  else if (kind === 'surround') meQ = pick([W, W + 1, W + 2]);
  else meQ = rnd() < 0.15 ? W : ri(W + 1, Math.min(67, W + 5));
  const me = baseUnit('def', 0, ...take(meQ, r0));
  me.onWall = walk || (kind === 'surround' && meQ === W && rnd() < 0.5);
  if (kind === 'walk-shoot' || kind === 'hold-shoot') {
    me.rangedBase = true;
    me.primaryRanged = rnd() < 0.7;
    me.ammoLeft = pick(['Infinity', 'Infinity', 1, 3]);
    me.range = pick([1, 2, 3, 4, 5, 6, 8, 12]);
  } else if (kind === 'walk-cata') {
    me.rangedBase = true;
    me.cata = true;
    me.siege = true;
    me.ammoLeft = pick(['Infinity', 2]);
    me.range = pick([6, 6, 6, 4, 8]);
  } else if (kind === 'walk-melee' || kind === 'hold-melee') {
    const x = rnd();
    if (x < 0.15) me.mounted = true;
    else if (x < 0.3) me.phalanx = true;
    else if (x < 0.4) { me.primaryRanged = true; me.rangedBase = true; me.ammoLeft = 0; }
  } else if (kind === 'surround') {
    me.morale = pick([5, 8, 10, 12, 15, 18, 20]);
    me.fleeMorale = pick([0, 3, 5, 8, 10]);
    me.tdm = rnd() < 0.25 ? 1.5 : 1;
    if (rnd() < 0.3) { me.rangedBase = true; me.ammoLeft = 'Infinity'; me.range = 3; }
  }
  me.attackDirection = pick(['front', 'front', 'bok', 'tyl']);
  // Doktryna obroncy (bramka `siegeDefenderNeverDoctrine`, `:6087`): czesc scenariuszy z `autoPlay = true`.
  const groupMeta = [];
  const dmode = ri(0, 3);
  if (dmode === 1) { me.groupId = 'g1'; groupMeta.push(['g1', pick(['steady', 'aggressive', 'skirmish']), true]); }
  else if (dmode === 2) me.unitDoctrine = pick(['steady', 'defensive']);
  const atk = [];
  const def = [me];
  const nAtk = ri(1, 7);
  if (kind === 'surround') {
    const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dq, dr]) => [me.q + dq, me.r + dr]).filter(([q, r]) => free(q, r));
    if (nbrs.length < 3) return null;
    const k = Math.min(nbrs.length, ri(3, 4));
    for (const [q, r] of nbrs.slice(0, k)) atk.push(baseUnit('atk', atk.length, ...take(q, r)));
  }
  for (let i = atk.length; i < nAtk; i++) {
    const x = rnd();
    let at;
    if (x < 0.3) at = placeIn(Math.max(0, W - 2), W - 1, 3);
    else if (x < 0.45) at = placeIn(W, W, 3);
    else if (x < 0.55) at = placeIn(W + 1, Math.min(67, W + 3), 3);
    else at = placeIn(Math.max(0, W - 12), Math.max(0, W - 3), 8);
    if (!at) continue;
    const u = baseUnit('atk', atk.length, ...at);
    if (u.q === W) u.onWall = true;
    randomizeState(u);
    if (rnd() < 0.25) { u.cata = true; u.siege = true; }
    else if (rnd() < 0.2) { u.primaryRanged = true; u.rangedBase = true; }
    atk.push(u);
  }
  // Pokrycie ciosu sasiada (`_targetInRange`, `dd === 0 || dd === 1`) i filtra muru (`_meleeBlockedByWall`): wrog na
  // polu sasiednim (na koronie po wiezy, pod murem albo w miescie po wylomie).
  if ((kind === 'walk-melee' || kind === 'hold-melee') && rnd() < 0.75) {
    const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dq, dr]) => [me.q + dq, me.r + dr]).filter(([q, r]) => free(q, r));
    const k = Math.min(nbrs.length, ri(1, 2));
    for (let j = 0; j < k; j++) {
      const [q, r] = nbrs[(j + ri(0, 3)) % nbrs.length];
      if (!free(q, r)) continue;
      const u = baseUnit('atk', atk.length, ...take(q, r));
      if (u.q === W) u.onWall = rnd() < 0.8;
      if (rnd() < 0.15) randomizeState(u);
      atk.push(u);
    }
  }
  // Pokrycie kontrbaterii: katapulta wroga w zasiegu katapulty obroncy.
  if (kind === 'walk-cata' && rnd() < 0.7) {
    const at = placeIn(Math.max(0, W - me.range), W - 1, 3);
    if (at) { const u = baseUnit('atk', atk.length, ...at); u.cata = true; u.siege = true; atk.push(u); }
  }
  const nDef = ri(0, 4);
  for (let i = 0; i < nDef; i++) {
    const at = placeIn(W, Math.min(67, W + 4), 4);
    if (!at) continue;
    const u = baseUnit('def', def.length, ...at);
    if (u.q === W && rnd() < 0.7) u.onWall = true;
    randomizeState(u);
    def.push(u);
  }
  return {
    acting: { side: 'def', idx: 0 }, atk, def, groupMeta, tiles: [], wallCol: W, wallEverBreached: rnd() < 0.3,
  };
}

// Zabicie (`_resolveBlowOutcome`, galaz `:9044-9056`): sojusznicy poleglego w promieniu ripple, roznorodne morale.
function makeRippleCase() {
  const actSide = rnd() < 0.5 ? 'atk' : 'def';
  const vicSide = actSide === 'atk' ? 'def' : 'atk';
  const q0 = ri(5, 60);
  const r0 = ri(5, 150);
  const used = new Set();
  const free = (q, r) => q >= 0 && q <= 67 && r >= 0 && r <= 155 && !used.has(q + ',' + r);
  const take = (q, r) => { used.add(q + ',' + r); return [q, r]; };
  const near = (cq, cr, span) => {
    for (let t = 0; t < 400; t++) {
      const q = cq + ri(-span, span);
      const r = cr + ri(-span, span);
      if (free(q, r)) return take(q, r);
    }
    return null;
  };
  const dq = actSide === 'atk' ? 1 : -1;
  const own = [];
  const enemies = [];
  const nOwn = ri(1, 5);
  const nVic = ri(1, 7);
  const actIdx = ri(0, nOwn - 1);
  const vicIdx = ri(0, nVic - 1);
  const aPos = take(q0, r0);
  const vPos = take(q0 + dq, r0);
  for (let i = 0; i < nOwn; i++) {
    const at = i === actIdx ? aPos : near(q0, r0, 4);
    if (!at) return null;
    const u = baseUnit(actSide, i, ...at);
    if (i !== actIdx) {
      randomizeState(u);
      u.morale = pick([100, 90, 60, 40, 95]);
      u.moraleMax = pick([100, 100, 95]);
    } else {
      u.morale = pick([100, 80, 50, 96, 30]);
      u.surroundApplied = true;
    }
    own.push(u);
  }
  for (let i = 0; i < nVic; i++) {
    const at = i === vicIdx ? vPos : near(vPos[0], vPos[1], rnd() < 0.8 ? 3 : 6);
    if (!at) return null;
    const u = baseUnit(vicSide, i, ...at);
    if (i === vicIdx) {
      u.hp = 1;
      u.primaryRanged = rnd() < 0.25;
      u.rangedBase = u.primaryRanged;
      u.neverRout = rnd() < 0.1;
    } else {
      randomizeState(u);
      u.morale = pick([100, 100, 60, 40, 30, 25, 20, 15, 12, 10, 8, 0]);
      u.fleeMorale = pick([0, 0, 5, 10, 15, 20, 30]);
      u.neverRout = rnd() < 0.08;
      u.tdm = rnd() < 0.2 ? 1.5 : 1;
      if (rnd() < 0.35) { u.primaryRanged = true; u.rangedBase = true; }
    }
    enemies.push(u);
  }
  const atk = actSide === 'atk' ? own : enemies;
  const def = actSide === 'atk' ? enemies : own;
  return {
    acting: { side: actSide, idx: actIdx }, victim: { side: vicSide, idx: vicIdx }, atk, def, groupMeta: [], tiles: [],
    wallCol: -1, wallEverBreached: false,
  };
}

function newHarness(sc) {
  const h = new Harness();
  h.terrainData = terrainData;
  h.siegeWallCol = sc.wallCol;
  h.wallEverBreached = sc.wallEverBreached;
  h.towerAtWallRows = new Set();
  h.terrainMap = {
    passable: () => true,
    moveCost: () => 1,
    at: () => 'Plain',
    combatTerrainName: () => DEFAULT_TERRAIN,
  };
  for (const [id, doctrine, autoPlay] of sc.groupMeta) h._groupMeta.set(id, { doctrine, autoPlay });
  const mk = (u) => ({
    bu: {
      id: u.side + u.idx, nazwa: u.side + u.idx, hp: u.hp ?? 100, maxHp: 100, __tdm: u.tdm ?? 1,
      __cata: !!u.cata, __siege: !!u.siege,
    },
    side: u.side, q: u.q, r: u.r,
    facing: u.facing, moveLeft: u.moveLeft, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.dead,
    surroundApplied: !!u.surroundApplied, neverRout: u.neverRout ?? false, morale: u.morale ?? 100,
    fleeMorale: u.fleeMorale ?? 0, moraleMax: u.moraleMax ?? 100, screenLostApplied: false, fleeStuck: 0,
    range: u.range ?? 1, onWallWalkway: !!u.onWall,
    primaryRanged: u.primaryRanged ?? false, rangedBase: u.rangedBase ?? false, mounted: u.mounted ?? false,
    antiCavSpear: u.antiCavSpear ?? false, phalanx: u.phalanx ?? false, shootingEnabled: true,
    ammoLeft: u.ammoLeft === 'Infinity' ? Infinity : (u.ammoLeft ?? 0), ammoMax: 5,
    dryCol: -1, heldAfterFallback: false,
    playerOrder: { type: 'none' }, unitDoctrine: u.unitDoctrine ?? null, groupId: u.groupId ?? null,
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

function snapshot(h, ru, doneAt) {
  const tagOf = (u) => u.side + (u.side === 'atk' ? h.atk : h.def).indexOf(u);
  const occ = [...h.occByKey.entries()].map(([k, u]) => {
    const [c, r] = k.split(',').map(Number);
    return [c, r, tagOf(u)];
  }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return {
    trace: h.__trace,
    facing: h.__facing,
    attack: h.__attack,
    duration: doneAt,
    final: {
      q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing,
      ammoLeft: Number.isFinite(ru.ammoLeft) ? ru.ammoLeft : 'Infinity',
    },
    blows: h.__blows,
    occ,
    shaken: h.__shaken,
    routs: h.__routs,
    order: h.__order,
    units: [...h.atk, ...h.def].map((u) => ({
      tag: tagOf(u), morale: u.morale, routed: !!u.routed, dead: !!u.dead, removed: !!u.removed,
      fadingOut: !!u.fadingOut, acted: !!u.acted, facing: u.facing, screenLostApplied: !!u.screenLostApplied,
    })),
  };
}

function resetRec(h) {
  h.vNow = 0;
  h.__trace = []; h.__steps = []; h.__facing = []; h.__attack = null; h.__blows = []; h.__shaken = []; h.__routs = [];
  h.__leaves = []; h.__order = [];
}

function drain(h) {
  let guard = 0;
  while (h.__q.length > 0) {
    if (++guard > 10000) throw new Error('petla kolejki');
    const job = h.__q.shift();
    if (job.kind === 'raf') h.vNow += 240; else h.vNow += job.ms;
    job.cb();
  }
}

// Jedna aktywacja `_activateUnit` obroncy od chwili 0.
function runDef(sc) {
  const h = newHarness(sc);
  const ru = h.def[sc.acting.idx];
  // `_isUnitDoctrineAuto(ru)` (`:17621-17630`, tekst pinu) = wejscie adaptera `activate.doctrine_auto` (D-T8-N1).
  const doctrineAuto = h._isUnitDoctrineAuto(ru);
  resetRec(h);
  let doneAt = null;
  h._activateUnit(ru, () => { doneAt = h.vNow; });
  drain(h);
  if (doneAt === null) throw new Error('done() nie wywolane');
  return { ...snapshot(h, ru, doneAt), doctrineAuto };
}

// Zabicie: `_updateFacing` (`:6123`) i zwrot `_doMeleeAttack` (`:9104`) atakujacego, potem `_singleBlow` z HP celu
// sprowadzonym do 0 (`:8990`) -> `_resolveBlowOutcome` (`:9011`) tekstem pinu.
function runRipple(sc) {
  const h = newHarness(sc);
  const A = (sc.acting.side === 'atk' ? h.atk : h.def)[sc.acting.idx];
  const V = (sc.victim.side === 'atk' ? h.atk : h.def)[sc.victim.idx];
  resetRec(h);
  h._updateFacing(A);
  A.facing = facingFromTo(A.q, A.r, V.q, V.r, A.facing);
  V.bu.hp = 0;
  h.__killing = V;
  h._resolveBlowOutcome(A, V, 5, 0);
  h.__killing = null;
  drain(h);
  return snapshot(h, A, 0);
}

// Klasyfikacja galezi z tekstu pinu (dla licznikow pokrycia).
function branchOf(sc, e) {
  const me = sc.def[sc.acting.idx];
  if (e.trace.includes('flee')) return 'surround-flee';
  const canShoot = me.rangedBase && (me.ammoLeft === 'Infinity' || (me.ammoLeft ?? 0) > 0);
  const shot = e.blows.length > 0;
  const melee = e.attack !== null;
  if (me.onWall) {
    if (canShoot) {
      if (me.cata) {
        if (!shot) return 'walk-cata-hold';
        const t = sc.atk[e.blows[0].target];
        return t.cata ? 'walk-cata-counterbattery' : 'walk-cata-fallback';
      }
      return shot ? 'walk-shoot' : 'walk-shoot-hold';
    }
    return melee ? 'walk-melee' : 'walk-melee-hold';
  }
  if (canShoot) return shot ? 'hold-shoot' : 'hold-shoot-hold';
  return melee ? 'hold-melee' : 'hold-melee-hold';
}

const cases = [];
let tries = 0;
for (const [kind, n] of Object.entries(N_DEF)) {
  let got = 0;
  while (got < n) {
    if (++tries > 2000000) throw new Error(`za malo scenariuszy ${kind}`);
    const sc = makeDefCase(kind);
    if (!sc || sc.atk.length === 0) continue;
    const expect = runDef(sc);
    if (kind === 'surround' && !expect.trace.includes('flee')) continue;
    if (kind !== 'surround' && expect.trace.includes('flee')) continue;
    expect.branch = branchOf(sc, expect);
    cases.push({ ...sc, name: `siege-def-${kind}-${got}`, kind, expect });
    got += 1;
  }
}
{
  let got = 0;
  while (got < N_RIPPLE) {
    if (++tries > 2000000) throw new Error('za malo scenariuszy ripple');
    const sc = makeRippleCase();
    if (!sc) continue;
    const expect = runRipple(sc);
    cases.push({ ...sc, name: `kill-ripple-${got}`, kind: 'ripple', expect });
    got += 1;
  }
}

const count = (f) => cases.filter(f).length;
const byBranch = {};
for (const c of cases) if (c.expect.branch) byBranch[c.expect.branch] = (byBranch[c.expect.branch] ?? 0) + 1;
const stats = {
  cases: cases.length,
  byBranch,
  doctrineAutoDef: count((c) => c.kind !== 'ripple' && c.expect.doctrineAuto),
  meleeBlockedSeen: count((c) => c.kind === 'hold-melee' && c.atk.some((u) => u.onWall && !u.dead && !u.routed && !u.fadingOut
    && Math.abs(u.q - c.def[0].q) + Math.abs(u.r - c.def[0].r) <= 1)),
  rippleShaken: count((c) => c.kind === 'ripple' && c.expect.shaken.length > 0),
  rippleCascadeRout: count((c) => c.kind === 'ripple' && c.expect.routs.length > 0),
  rippleScreenLost: count((c) => c.kind === 'ripple' && c.expect.units.some((u) => u.screenLostApplied)),
};
console.error(JSON.stringify(stats));
const outDir = join(here, 'p6_k5loop_siege_def_vectors');
mkdirSync(outDir, { recursive: true });
const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : (v === Infinity ? 'Infinity' : (v === -Infinity ? '-Infinity' : v)));
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, stats, cases }, nanJson) + '\n');
console.error(`zapisano ${cases.length} wektorow`);

// Lekcja NaN (r2 a): kluczowe wejscia NaN/Inf w OSOBNYM pliku (bez wywolan `rnd`). Strzelec obroncy: `ru.range` = NaN
// (`dd > NaN` falszywe: kazdy wrog z `dd >= 1` w zasiegu; kontrbateria `dd <= NaN` falszywe) i +Infinity; okrazenie:
// `ru.morale` = NaN (`Math.max(0, NaN - 10)` = NaN, `_checkRout` `ru.morale > flee` falszywe = rout); HP celu NaN
// (remis odleglosci `e.bu.hp < best.bu.hp` falszywe).
const nanCases = [];
for (const c of cases) {
  if (c.kind === 'ripple') continue;
  const variants = [];
  const me0 = c.def[c.acting.idx];
  const shooter = me0.rangedBase && (me0.ammoLeft === 'Infinity' || (me0.ammoLeft ?? 0) > 0);
  if (shooter) variants.push(['range-nan', (s) => { s.def[s.acting.idx].range = NaN; }]);
  if (shooter && nanCases.length % 3 === 0) variants.push(['range-inf', (s) => { s.def[s.acting.idx].range = Infinity; }]);
  if (c.kind === 'surround') variants.push(['morale-nan', (s) => { s.def[s.acting.idx].morale = NaN; }]);
  if (shooter && c.atk.length >= 2) variants.push(['hp-nan', (s) => { s.atk[0].hp = NaN; }]);
  for (const [tag, mut] of variants) {
    const { expect: _old, name, kind, ...sc0 } = c;
    const sc = JSON.parse(JSON.stringify(sc0, nanJson), (_k, v) => (v === 'NaN' ? NaN : v));
    mut(sc);
    const expect = runDef(sc);
    expect.branch = branchOf(sc, expect);
    nanCases.push({ ...sc, name: `${name}-${tag}`, kind: `${kind}-nan`, nan: tag, expect });
  }
}
const nanStats = {
  cases: nanCases.length,
  rangeNan: nanCases.filter((c) => c.nan === 'range-nan').length,
  rangeNanShot: nanCases.filter((c) => c.nan === 'range-nan' && c.expect.blows.length > 0).length,
  rangeInf: nanCases.filter((c) => c.nan === 'range-inf').length,
  moraleNan: nanCases.filter((c) => c.nan === 'morale-nan').length,
  hpNan: nanCases.filter((c) => c.nan === 'hp-nan').length,
};
console.error(JSON.stringify(nanStats));
writeFileSync(
  join(outDir, 'vectors_nan.json'),
  JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, stats: nanStats, cases: nanCases }, nanJson) + '\n',
);
console.error(`zapisano ${nanCases.length} wektorow NaN`);
