// P6 SIEGE K5DOC-T8 (dispatch R-RUSTPORT-P6-K5DOC-T8-Q1, #264, Operator r1): generator wektorow kroku doktryny grupy
// `_executeGroupDoctrineStep` (`battleScene.ts:17966-18084`) z `_executeSkirmishDoctrineStep` (`:18087-18124`) i
// `_doctrineMoveDest` (`:17931-17963`), wolanego z `_activateUnit` (`:6087-6099`), dla `ProdBody`
// (rust-port/engine/src/domain/siege_tactics_loop.rs + siege_tactics_doctrine_step.rs):
// 1. domyslna doktryna `steady` z `autoPlay = true` (bez grupy, grupa bez wpisu `_groupMeta`, grupa `steady`/auto):
//    jazda (`_cavalryAction`), strzelec w zasiegu (`_pickRangedTargetByPriority` -> `_doAttack`), strzelec poza
//    zasiegiem (`_rangedAction`), piechota (`_advanceStep`, takze cios `_pickAdjacentTargetByPriority` `:8241-8245`),
//    strzelec z `shootingEnabled = false` (`_advanceStep` z zasiegiem strzalu);
// 2. `defensive`, `aggressive`, `skirmish` (z `ru.rangedKite = true` i rozkazem ruchu `_performPlayerOrder`);
// 3. bramki `siegeDefenderNeverDoctrine` / `siegeMachineNeverDoctrine` (`:6087-6092`, osobny plik `vectors_gate.json`);
// 4. `ru.moveLeft = NaN` (osobny plik `vectors_nan.json`, bez wywolan `rnd`).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t8_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5doc_t8_vectors/{vectors.json,vectors_nan.json,vectors_gate.json}. Ziarno 5408.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show). Wycinki r4 (`p6_k5loop_close_r4_gen.mjs`) plus: inicjalizator
// `_generalSettings` (2335-2339), _moveTargetForUnit (11442), _pickAdjacentTargetByPriority (17545),
// _pickRangedTargetByPriority (17571), _destAllowedByBlockade (17809), _doctrineMoveDest (17931),
// _executeGroupDoctrineStep (17966), _executeSkirmishDoctrineStep (18087); strażnik SHA-256 calosci.
//
// STUBY jak w r4 (bez logiki gry albo poza zakresem), poza portowanymi wyzej (teraz tekst pinu). `_performPlayerOrder`
// (`:18280-18352`, K5EXEC-T3) wolany z kroku doktryny: zapis celu rozkazu (`ru.playerOrder`) i `done()` (w Rust jawny tag
// `doktryna-rozkaz-ruchu`); poza krokiem doktryny: blad. `_refreshQueuedOrderVisuals`: UI. `_attackFormationRallyPoint`
// i `_chargeMoveDest` NIE sa wklejone: wywolanie (nieosiagalne wg K5DOC-T3) = TypeError generatora. `isSiegeUnit`:
// flaga wejscia `bu.__siege` (rodzina bramek). Rodzina bramek: `_updateFacing` (pierwsze wywolanie po bramce doktryny,
// `:6123`) przerywa aktywacje znacznikiem `GATE_PASSED`, a krok doktryny konczy `done()` (sama bramka).

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
const SEED = 5408;

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
// Inicjalizator `_generalSettings` (`:2335-2339`): blokada linii wylaczona na starcie bitwy.
expectLine(SCENE, 2335, 'private _generalSettings: GeneralSettings = {');
expectLine(SCENE, 2337, 'blockadeActive: false,');
expectLine(SCENE, 2339, '};');
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
  [11442, 'private _moveTargetForUnit('],
  [17486, 'private _unitBattleClass('],
  [17496, 'private _prefsForUnit('],
  [17512, 'private _priorityScore('],
  [17523, 'private _pickTargetByPriority('],
  [17545, 'private _pickAdjacentTargetByPriority('],
  [17571, 'private _pickRangedTargetByPriority('],
  [17586, 'private _ensureGroupMeta('],
  [17612, 'private _getEffectiveDoctrine('],
  [17621, 'private _isUnitDoctrineAuto('],
  [17633, 'private _effectiveMetaForUnit('],
  [17736, 'private _bestChargeStepKey('],
  [17809, 'private _destAllowedByBlockade('],
  [17931, 'private _doctrineMoveDest('],
  [17966, 'private _executeGroupDoctrineStep('],
  [18087, 'private _executeSkirmishDoctrineStep('],
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
if (methodEnd(17966) !== 18084) throw new Error('koniec _executeGroupDoctrineStep != 18084');
if (methodEnd(18087) !== 18124) throw new Error('koniec _executeSkirmishDoctrineStep != 18124');
if (methodEnd(17931) !== 17963) throw new Error('koniec _doctrineMoveDest != 17963');
const formStart = findLine(FORM, 'export function compactLineAllowsAdvance(');

const parts = [
  ...TOP.map(([a, b]) => L(SCENE, a, b)),
  L(SCENE, 2328, 2332),
  L(SCENE, 2335, 2339),
  ...TOP_FN.map(([a]) => L(SCENE, a, fnEnd(SCENE, a))),
  ...COMBAT_FN.map(([a]) => L(COMBAT, a, fnEnd(COMBAT, a))),
  L(FORM, formStart, fnEnd(FORM, formStart)),
  ...METHODS.map(([a]) => L(SCENE, a, methodEnd(a))),
];
const PIN_SHA256 = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
console.error(`sha256 wycinkow pinu = ${PIN_SHA256}`);
const EXPECTED_SHA256 = 'c8e6b605b20c855812a7ce372ba3681c896e88144aa86426787e4cc62bc56004';
if (EXPECTED_SHA256 !== PIN_SHA256) throw new Error('SHA wycinkow pinu zmieniony');

const stripExport = (t) => t.replace(/^export /gm, '');
const priv = (t) => t.replace(/^(\s*)private /, '$1');
const methodText = (a) => priv(L(SCENE, a, methodEnd(a)));
const rename = (t, from, to) => {
  if (!t.includes(from)) throw new Error(`brak ${from}`);
  return t.replace(from, to);
};
const prioInit = L(SCENE, 2329, 2331);
const generalInit = L(SCENE, 2336, 2338);

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
  'function isSiegeUnit(bu) { return !!(bu && bu.__siege); }',
  'const GATE_PASSED = { gate: true };',
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
  '    this.__inDoctrine = 0; this.__gateProbe = false; this.__orderDest = null; this.__meta = null;',
  `    this._generalSettings = {\n${generalInit}\n    };`,
  `    this._targetPriorities = {\n${prioInit}\n    }; }`,
  '  _now() { return this.vNow; }',
  '  _raf(cb) { this.__q.push({ kind: "raf", cb }); }',
  '  _schedule(ms, cb) { this.__q.push({ kind: "sched", ms, cb }); }',
  '  _applyTerrainRange(ru) { this.__trace.push("terrainRange"); }',
  '  _isPlayerSide(side) { return false; }',
  // `_performPlayerOrder` z kroku doktryny (rozkaz ruchu, K5EXEC-T3): zapis celu rozkazu i `done()`.
  '  _performPlayerOrder(ru, done) { if (!this.__inDoctrine) throw new Error("tryb reczny poza zakresem"); this.__trace.push("playerOrder"); this.__orderDest = { col: ru.playerOrder.col, row: ru.playerOrder.row }; done(); return true; }',
  '  _refreshQueuedOrderVisuals() {}',
  '  _executeGroupDoctrineStep(ru, meta, done) { this.__trace.push("doctrine"); this.__meta = meta.doctrine; if (this.__gateProbe) { done(); return true; } this.__inDoctrine += 1; try { return this._executeGroupDoctrineStepPin(ru, meta, done); } finally { this.__inDoctrine -= 1; } }',
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
  // `_doMeleeAttack`: zapis celu (indeks w liscie strony przeciwnej) i czasu; cios w zwarciu poza tym generatorem.
  '  _doMeleeAttack(ru, e, done) { if (this.__attack) throw new Error("drugi atak"); const list = e.side === "atk" ? this.atk : this.def; this.__attack = { target: list.indexOf(e), t: this.vNow }; done(); }',
  '  _cavalryAction(ru, done) { this.__trace.push("cavalryAction"); return this._cavalryActionPin(ru, done); }',
  '  _updateFacing(ru) { if (this.__gateProbe) throw GATE_PASSED; if (!this.__inMove) this.__trace.push("facing"); const f0 = ru.facing; this._updateFacingPin(ru); if (ru.facing !== f0) this.__facing.push({ t: this.vNow, dir: ru.facing }); }',
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
    if (a === 17966) t = rename(t, '_executeGroupDoctrineStep(ru: RuntimeBattleUnit', '_executeGroupDoctrineStepPin(ru: RuntimeBattleUnit');
    return t;
  }),
  '}',
  'module.exports.Harness = Harness; module.exports.cavalryTerrainMultiplier = cavalryTerrainMultiplier; module.exports.GATE_PASSED = GATE_PASSED;',
].join('\n');

const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(mod, mod.exports, createRequire(import.meta.url));
const { Harness, cavalryTerrainMultiplier, GATE_PASSED } = mod.exports;

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

function newHarness(sc) {
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
    bu: { id: u.side + u.idx, nazwa: u.side + u.idx, hp: u.hp ?? 100, __tdm: u.tdm ?? 1, __siege: u.siege ?? false }, side: u.side, q: u.q, r: u.r,
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
  if (sc.wallCol !== undefined) h.siegeWallCol = sc.wallCol;
  return h;
}

const ATTACK_DIRS = ['front', 'front', 'front', 'bok', 'tyl'];

// Doktryna jednostki dzialajacej. `steady` (domyslna): bez grupy i bez `unitDoctrine` (sciezka `'steady'` z
// `_getEffectiveDoctrine`, `:17618`), grupa bez wpisu `_groupMeta` (`_ensureGroupMeta` tworzy `{steady, true}`, `:17589`),
// grupa `steady` z `autoPlay = true` albo `unitDoctrine = 'steady'`. Pozostale: `unitDoctrine` albo grupa z doktryna i
// `autoPlay = true` (takze `unitDoctrine` przykrywajaca inna doktryne grupy).
function assignDoctrine(me, doctrine, groupMeta) {
  const x = rnd();
  if (doctrine === 'steady') {
    if (x < 0.4) return 'default';
    if (x < 0.6) { me.groupId = 'gN'; return 'group-ensure'; }
    if (x < 0.8) { me.groupId = 'gS'; groupMeta.push(['gS', 'steady', true]); return 'group'; }
    me.unitDoctrine = 'steady';
    return 'unit';
  }
  if (x < 0.4) { me.unitDoctrine = doctrine; return 'unit'; }
  if (x < 0.8) { me.groupId = 'gD'; groupMeta.push(['gD', doctrine, true]); return 'group'; }
  me.unitDoctrine = doctrine;
  me.groupId = 'gO';
  groupMeta.push(['gO', pick(DOCTRINES.filter((d) => d !== doctrine)), rnd() < 0.5]);
  return 'unit-over-group';
}

// Scenariusz: format r4 (pozycje, teren, stan jednostek) + doktryna jednostki dzialajacej.
function makeCase(kind) {
  const actSide = rnd() < 0.5 ? 'atk' : 'def';
  const enemySide = actSide === 'atk' ? 'def' : 'atk';
  const nOwn = ri(1, 6);
  const nEnemy = ri(1, 6);
  const tight = rnd() < 0.75;
  const c0 = ri(12, 55);
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
  const mkUnit = (side, i, acting) => {
    const [q, r] = place();
    const u = {
      side, idx: i, q, r, facing: ri(0, 3), moveLeft: pick(MOVE_LEFTS), dead: false, fadingOut: false, routed: false,
      unitDoctrine: null, groupId: null, formationRank: rnd() < 0.35 ? null : ri(0, 3),
      hp: pick([40, 60, 60, 80, 100, 100, 120]), mounted: false, primaryRanged: false, rangedBase: false,
      antiCavSpear: false, morale: 100, fleeMorale: 0, moraleMax: 100, neverRout: false, tdm: 1,
    };
    if (!acting) {
      const x = rnd();
      if (x < 0.06) u.dead = true;
      else if (x < 0.12) u.routed = true;
      else if (x < 0.15) u.fadingOut = true;
      const c = rnd();
      if (c < 0.2) u.mounted = true;
      else if (c < 0.35) { u.primaryRanged = true; u.rangedBase = true; }
      else if (c < 0.42) u.rangedBase = true;
      else if (c < 0.7) u.antiCavSpear = true;
      if (!u.mounted && !u.rangedBase && rnd() < 0.1) u.phalanx = true;
    }
    return u;
  };
  const own = [];
  const actIdx = ri(0, nOwn - 1);
  const enemies = [];
  for (let i = 0; i < nOwn; i++) own.push(mkUnit(actSide, i, i === actIdx));
  for (let i = 0; i < nEnemy; i++) enemies.push(mkUnit(enemySide, i, false));
  const me = own[actIdx];
  // Wrog na polu sasiednim (cios `_pickAdjacentTargetByPriority`) w czesci scenariuszy.
  if (rnd() < 0.45) {
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dq, dr]) => [me.q + dq, me.r + dr]).filter(([q, r]) => free(q, r));
    if (nb.length > 0) {
      const [q, r] = pick(nb);
      const e = enemies[ri(0, nEnemy - 1)];
      used.delete(e.q + ',' + e.r);
      used.add(q + ',' + r);
      e.q = q; e.r = r;
    }
  }
  if (rnd() < 0.3) me.moveLeft = pick([3, 4, 6, 8]);
  me.attackDirection = pick(ATTACK_DIRS);
  const shooter = (primaryP) => {
    me.rangedBase = true;
    me.primaryRanged = rnd() < primaryP;
    me.ammoLeft = pick(['Infinity', 'Infinity', 1, 2, 5]);
    me.range = ri(2, 6);
    if (rnd() < 0.25) me.rangedKite = false;
  };
  let doctrine;
  if (kind === 'steady-cav') { doctrine = 'steady'; me.mounted = true; if (rnd() < 0.15) me.antiCavSpear = true; }
  else if (kind === 'steady-shoot-in' || kind === 'steady-shoot-out') { doctrine = 'steady'; shooter(0.7); }
  else if (kind === 'steady-inf') {
    doctrine = 'steady';
    const x = rnd();
    if (x < 0.15) me.phalanx = true;
    else if (x < 0.4) me.antiCavSpear = true;
    else if (x < 0.5) { me.primaryRanged = true; me.rangedBase = true; me.ammoLeft = 0; }
  } else if (kind === 'steady-nobow') { doctrine = 'steady'; shooter(0.5); me.shootingEnabled = false; }
  else {
    doctrine = kind;
    const x = rnd();
    if (x < 0.22) me.mounted = true;
    else if (x < 0.55) shooter(0.6);
    else if (x < 0.62) { shooter(0.6); me.ammoLeft = 0; }
    else if (x < 0.68) { shooter(0.6); me.shootingEnabled = false; }
    else if (x < 0.76) me.phalanx = true;
  }
  me.doctrineMode = assignDoctrine(me, doctrine, groupMeta);
  if (kind === 'aggressive' && rnd() < 0.12) me.moveLeft = 0;
  const tiles = [];
  const tileSeen = new Set();
  const nTiles = ri(0, 120);
  for (let t = 0; t < nTiles; t++) {
    const c = Math.max(0, Math.min(67, c0 + ri(-span - 4, span + 4)));
    const r = Math.max(0, Math.min(155, r0 + ri(-span - 4, span + 4)));
    const key = c + ',' + r;
    if (tileSeen.has(key) || key === me.q + ',' + me.r) continue;
    tileSeen.add(key);
    const x = rnd();
    const name = pick(TERRAIN_NAMES);
    if (x < 0.15) tiles.push([c, r, false, 1, false, name]);
    else if (x < 0.5) tiles.push([c, r, true, pick([2, 3]), false, name]);
    else if (x < 0.7) tiles.push([c, r, true, pick([1, 2, 3]), true, name]);
    else tiles.push([c, r, true, pick([1, 99, 150, 0.5]), false, name]);
  }
  const atk = actSide === 'atk' ? own : enemies;
  const def = actSide === 'atk' ? enemies : own;
  return { acting: { side: actSide, idx: actIdx }, atk, def, groupMeta, tiles, doctrine };
}

// Jedna aktywacja `_activateUnit` od chwili 0 (czasy wzgledne), z zapisem sladu i efektow.
function activate(h, sc) {
  const ru = (sc.acting.side === 'atk' ? h.atk : h.def)[sc.acting.idx];
  h.vNow = 0;
  h.__trace = []; h.__steps = []; h.__facing = []; h.__attack = null; h.__blows = []; h.__shaken = []; h.__routs = [];
  h.__leaves = []; h.__order = []; h.__advStarted = false; h.__rangedStarted = false; h.__fbStarted = false; h.__phStarted = false;
  h.__phalanxAdvance = false; h.__fleeStarted = false; h.__orderDest = null; h.__meta = null;
  // `_isUnitDoctrineAuto(ru)` (`:17621-17630`) przed aktywacja: wejscie adaptera `activate.doctrine_auto` w Rust.
  const doctrineAuto = h._isUnitDoctrineAuto(ru);
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
    doctrineAuto,
    meta: h.__meta,
    trace: h.__trace,
    steps: h.__steps,
    facing: h.__facing,
    attack: h.__attack,
    orderDest: h.__orderDest,
    duration: doneAt,
    final: {
      q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, lastAutoMoveFrom: ru.lastAutoMoveFrom ?? null,
      dryCol: ru.dryCol, heldAfterFallback: ru.heldAfterFallback,
      ammoLeft: Number.isFinite(ru.ammoLeft) ? ru.ammoLeft : 'Infinity',
      rangedKite: ru.rangedKite !== false,
    },
    groupMeta: [...h._groupMeta.entries()].map(([id, m]) => [id, m.doctrine, m.autoPlay]).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    blows: h.__blows,
    phalanxAdvance: h.__phalanxAdvance,
    occ,
  };
}

const runCase = (sc) => activate(newHarness(sc), sc);

// Galaz wykonana przez krok doktryny (z sladu i efektow pinu); `none` = `done()` bez akcji.
function branchOf(e) {
  const t = e.trace;
  if (t[1] !== 'doctrine') return 'no-doctrine';
  if (t.includes('playerOrder')) return 'order';
  if (t.includes('cavalryAction')) return 'cav';
  if (t.includes('rangedAction')) return e.blows.length > 0 ? 'ranged-shot' : 'ranged-move';
  if (t.includes('advanceStep')) {
    if (e.attack || e.blows.length > 0) return 'advance-attack';
    return e.steps.length > 0 ? 'advance-move' : 'advance-none';
  }
  if (e.blows.length > 0) return 'shot';
  if (e.attack) return 'melee';
  return 'none';
}

const cases = [];
let tries = 0;
// Kwoty galezi w rodzinie (minimum); reszta dopelniona dowolna galezia do `n`.
function family(kind, n, quota) {
  const got = Object.fromEntries(Object.keys(quota).map((k) => [k, 0]));
  let total = 0;
  const need = () => Object.keys(quota).reduce((s, k) => s + Math.max(0, quota[k] - got[k]), 0);
  while (total < n) {
    if (++tries > 3000000) throw new Error(`za malo scenariuszy ${kind}: ${JSON.stringify(got)}`);
    const sc = makeCase(kind);
    const expect = runCase(sc);
    if (!expect.doctrineAuto || expect.trace[1] !== 'doctrine') throw new Error(`${kind}: brak kroku doktryny ${expect.trace}`);
    const br = branchOf(expect);
    const want = quota[br] !== undefined && got[br] < quota[br];
    if (!want && n - total <= need()) continue;
    if (quota[br] !== undefined) got[br] += 1;
    cases.push({ ...sc, name: `t8-${kind}-${total}`, kind, branch: br, expect });
    total += 1;
  }
  console.error(`${kind}: ${JSON.stringify(got)} (proby ${tries})`);
}
family('steady-cav', 160, { cav: 150 });
family('steady-shoot-in', 160, { shot: 150 });
family('steady-shoot-out', 160, { 'ranged-move': 80, 'ranged-shot': 50 });
family('steady-inf', 240, { 'advance-attack': 80, 'advance-move': 100, 'advance-none': 20 });
family('steady-nobow', 120, { 'advance-attack': 30, 'advance-move': 40 });
family('defensive', 200, { shot: 50, melee: 50, none: 50 });
family('aggressive', 240, { cav: 40, shot: 40, melee: 40, 'advance-move': 40, none: 15 });
family('skirmish', 240, { 'ranged-shot': 30, 'ranged-move': 30, melee: 30, order: 40, none: 20 });
// `skirmish` na krawedzi planszy (mutant M13 r1): piechota bez grupy, punkt zbiorki `_forwardCol(side, q, 2)` (`:17645`)
// po clampie (`:6749`) = wlasne pole, wiec `_executeSkirmishDoctrineStep` konczy `done()` na warunku
// `dest.col === ru.q && dest.row === ru.r` (`:18104`). Dopisane po rodzinach (wczesniejsze rzuty `rnd` bez zmian).
{
  let got = 0;
  while (got < 20) {
    if (++tries > 3000000) throw new Error('za malo scenariuszy skirmish-edge');
    const sc = makeCase('skirmish');
    const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
    const me = own[sc.acting.idx];
    const edge = sc.acting.side === 'atk' ? 67 : 0;
    if ([...sc.atk, ...sc.def].some((u) => u !== me && u.q === edge && u.r === me.r)) continue;
    me.q = edge;
    me.mounted = rnd() < 0.3;
    me.rangedBase = false; me.primaryRanged = false; me.ammoLeft = 0; me.range = 1;
    me.unitDoctrine = 'skirmish'; me.groupId = null; me.doctrineMode = 'unit-edge';
    sc.groupMeta = [];
    sc.tiles = sc.tiles.filter(([c, r]) => !(c === me.q && r === me.r));
    const expect = runCase(sc);
    const br = branchOf(expect);
    if (br !== 'none') throw new Error(`skirmish-edge: ${br}`);
    cases.push({ ...sc, name: `t8-skirmish-edge-${got}`, kind: 'skirmish-edge', branch: br, expect });
    got += 1;
  }
}
// Obrona r1, zarzut Z2 (mutant E12): jazda strzelajaca (`mounted` + `canShoot` + `shootingEnabled !== false`) w `steady`
// i `aggressive`. Pin kieruje ja do `_cavalryAction` PRZED strzalem (`:17992-17995` steady, `:18028-18031` aggressive).
// Realne jednostki pinu (`units.json`, `Typ: Mount`, zasieg >= 2): Rydwan egipski (3), Konnica lucznicza asyryjska (2),
// Jezdziec z oszczepami (2). `rangedAtStart` = `_pickRangedTargetByPriority(ru)` (`:17571`) przed aktywacja na osobnej
// uprzezy (bez `rnd`): cel strzalu w zasiegu istnieje, wiec mutant „strzal przed jazda” daje inne zdarzenia.
// Dopisane po wszystkich rodzinach: wczesniejsze rzuty `rnd` i wektory bez zmian.
function rangedAtStart(sc) {
  const h = newHarness(sc);
  const ru = (sc.acting.side === 'atk' ? h.atk : h.def)[sc.acting.idx];
  return !!h._pickRangedTargetByPriority(ru);
}
for (const [kind, base, n, inRange] of [['steady-cav-shoot', 'steady-cav', 120, 60], ['aggressive-cav-shoot', 'aggressive', 120, 60]]) {
  let got = 0;
  let gotIn = 0;
  while (got < n) {
    if (++tries > 3000000) throw new Error(`za malo scenariuszy ${kind}`);
    const sc = makeCase(base);
    const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
    const me = own[sc.acting.idx];
    me.mounted = true;
    me.phalanx = false;
    me.rangedBase = true;
    me.primaryRanged = rnd() < 0.5;
    me.ammoLeft = pick(['Infinity', 1, 2, 5]);
    me.range = ri(2, 3);
    delete me.shootingEnabled;
    if (kind === 'aggressive-cav-shoot' && me.moveLeft === 0) me.moveLeft = pick([1, 2, 3]);
    const inR = rangedAtStart(sc);
    if (!inR && n - got <= inRange - gotIn) continue;
    const expect = runCase(sc);
    if (!expect.doctrineAuto || expect.trace[1] !== 'doctrine') throw new Error(`${kind}: brak kroku doktryny ${expect.trace}`);
    const br = branchOf(expect);
    if (br !== 'cav') throw new Error(`${kind}: galaz ${br} zamiast cav`);
    cases.push({ ...sc, name: `t8-${kind}-${got}`, kind, branch: br, rangedAtStart: inR, expect });
    got += 1;
    if (inR) gotIn += 1;
  }
  console.error(`${kind}: ${got} (z celem strzalu w zasiegu ${gotIn})`);
}
// Obrona r1, uwaga N2 (mutant E13): `unitDoctrine` w {defensive, aggressive, skirmish} + grupa BEZ wpisu `_groupMeta`
// i krok konczy `done()` bez akcji. `_effectiveMetaForUnit` (`:17636-17638`) i tak wola `_ensureGroupMeta` (`:17586`),
// wiec po aktywacji `_groupMeta` ma wpis `{steady, true}` — pominiecie go przy `Done` jest wykrywalne.
for (const doctrine of ['defensive', 'aggressive', 'skirmish']) {
  let got = 0;
  while (got < 20) {
    if (++tries > 3000000) throw new Error(`za malo scenariuszy ensure-done ${doctrine}`);
    const sc = makeCase(doctrine);
    const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
    const me = own[sc.acting.idx];
    me.unitDoctrine = doctrine;
    me.groupId = 'gE';
    me.doctrineMode = 'unit-group-ensure';
    sc.groupMeta = [];
    const expect = runCase(sc);
    const br = branchOf(expect);
    if (br !== 'none') continue;
    if (!expect.groupMeta.some(([id]) => id === 'gE')) throw new Error('ensure-done: brak wpisu gE');
    cases.push({ ...sc, name: `t8-ensure-done-${doctrine}-${got}`, kind: `ensure-done-${doctrine}`, branch: br, expect });
    got += 1;
  }
}

const fam = (kind) => cases.filter((c) => c.kind === kind);
const count = (kind, br) => fam(kind).filter((c) => c.branch === br).length;
const actingOf = (c) => (c.acting.side === 'atk' ? c.atk : c.def)[c.acting.idx];
const stats = {};
for (const kind of [...new Set(cases.map((c) => c.kind))]) {
  stats[kind] = Object.fromEntries([...new Set(fam(kind).map((c) => c.branch))].sort().map((b) => [b, count(kind, b)]));
}
stats.ensured = cases.filter((c) => actingOf(c).doctrineMode === 'group-ensure').length;
stats.skirmishKiteSet = fam('skirmish').filter((c) => actingOf(c).rangedKite === false && c.expect.final.rangedKite).length;
console.error(JSON.stringify(stats));
const cavMult = Object.fromEntries(TERRAIN_NAMES.map((n) => [n, cavMultOf(n)]));
const outDir = join(here, 'p6_k5doc_t8_vectors');
mkdirSync(outDir, { recursive: true });
const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats, cases }, nanJson) + '\n');
console.error(`zapisano ${cases.length} wektorow`);

// `ru.moveLeft = NaN` (osobny plik, bez wywolan `rnd`): `aggressive` (`ru.moveLeft <= 0` falszywe dla NaN, `:18044`),
// piechota i jazda `steady`, `skirmish`.
const nanCases = [];
for (const c of cases) {
  if (!['aggressive', 'steady-inf', 'steady-cav', 'skirmish'].includes(c.kind)) continue;
  const { expect: _old, name, kind, branch: _b, ...sc0 } = c;
  const sc = JSON.parse(JSON.stringify(sc0));
  const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
  own[sc.acting.idx].moveLeft = NaN;
  const expect = runCase(sc);
  nanCases.push({ ...sc, name: name.replace('t8-', 't8-nan-'), kind: `${kind}-nan`, branch: branchOf(expect), expect });
}
const nanStats = {
  nan: nanCases.length,
  nanMoved: nanCases.filter((c) => c.expect.steps.length >= 1).length,
  nanMultiStep: nanCases.filter((c) => c.expect.steps.length >= 2).length,
  nanAggressiveAdvance: nanCases.filter((c) => c.kind === 'aggressive-nan' && c.expect.trace.includes('advanceStep')).length,
};
console.error(JSON.stringify(nanStats));
writeFileSync(join(outDir, 'vectors_nan.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats: nanStats, cases: nanCases }, nanJson) + '\n');
console.error(`zapisano ${nanCases.length} wektorow NaN`);

// Bramki `siegeDefenderNeverDoctrine` / `siegeMachineNeverDoctrine` (`:6087-6092`): mur `siegeWallCol >= 0` (albo brak),
// strona, `isSiegeUnit(ru.bu)`, `_isUnitDoctrineAuto`. Oczekiwanie: czy `_executeGroupDoctrineStep` zostal wywolany.
// Wrogowie daleko (bez okrazenia, `:6105-6118`). Osobne ziarno (wektory powyzej bez zmian).
rnd = mulberry32(SEED + 1);
const gateCases = [];
for (let i = 0; i < 240; i++) {
  const actSide = i % 2 === 0 ? 'atk' : 'def';
  const wallCol = pick([-1, 0, 30, 30, 45]);
  const siege = rnd() < 0.5;
  const mode = ri(0, 4);
  const me = { side: actSide, idx: 0, q: 20, r: 40, facing: 0, moveLeft: 2, dead: false, fadingOut: false, routed: false,
    unitDoctrine: null, groupId: null, formationRank: null, hp: 100, siege, morale: 100, fleeMorale: 0, moraleMax: 100 };
  const groupMeta = [];
  if (mode === 1) me.unitDoctrine = pick(DOCTRINES);
  else if (mode === 2) { me.groupId = 'g1'; groupMeta.push(['g1', pick(DOCTRINES), rnd() < 0.6]); }
  else if (mode === 3) me.groupId = 'g2';
  const enemy = { side: actSide === 'atk' ? 'def' : 'atk', idx: 0, q: 60, r: 120, facing: 0, moveLeft: 2, dead: false,
    fadingOut: false, routed: false, unitDoctrine: null, groupId: null, formationRank: null, hp: 100 };
  const sc = { acting: { side: actSide, idx: 0 }, atk: actSide === 'atk' ? [me] : [enemy],
    def: actSide === 'atk' ? [enemy] : [me], groupMeta, tiles: [], wallCol };
  const h = newHarness(sc);
  h.__gateProbe = true;
  const ru = (actSide === 'atk' ? h.atk : h.def)[0];
  const doctrineAuto = h._isUnitDoctrineAuto(ru);
  h.__trace = [];
  let passed = false;
  try { h._activateUnit(ru, () => {}); } catch (e) { if (e !== GATE_PASSED) throw e; passed = true; }
  const doctrine = h.__trace.includes('doctrine');
  if (doctrine === passed) throw new Error('bramka: doktryna i dalsza galaz jednoczesnie');
  gateCases.push({ ...sc, name: `t8-gate-${i}`, kind: 'gate', expect: { doctrineAuto, doctrine, meta: h.__meta } });
}
const gateStats = {
  gate: gateCases.length,
  defWallBlocked: gateCases.filter((c) => c.acting.side === 'def' && c.wallCol >= 0 && c.expect.doctrineAuto).length,
  atkSiegeWallBlocked: gateCases.filter((c) => c.acting.side === 'atk' && c.wallCol >= 0 && c.atk[0].siege && c.expect.doctrineAuto).length,
  atkWallDoctrine: gateCases.filter((c) => c.acting.side === 'atk' && c.wallCol >= 0 && c.expect.doctrine).length,
  noWallDoctrine: gateCases.filter((c) => c.wallCol < 0 && c.expect.doctrine).length,
  noWallSiegeDoctrine: gateCases.filter((c) => c.wallCol < 0 && c.expect.doctrine && (c.acting.side === 'atk' ? c.atk : c.def)[0].siege).length,
};
console.error(JSON.stringify(gateStats));
writeFileSync(join(outDir, 'vectors_gate.json'), JSON.stringify({ pin: PIN, seed: SEED + 1, pinSha256: PIN_SHA256, stats: gateStats, cases: gateCases }) + '\n');
console.error(`zapisano ${gateCases.length} wektorow bramek`);
