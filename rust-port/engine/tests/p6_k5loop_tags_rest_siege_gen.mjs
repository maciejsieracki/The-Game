// P6 K5LOOP-TAGS-REST (dispatch R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1, T4, Operator r1): generator wektorow rodziny `siege`
// dla `ProdBody`: UCIECZKA PRZY MURZE (dawny tag `ucieczka-oblezenie`, dlug M19 z T2b). Jednostka rozbita (`ru.routed`,
// `_activateUnit` `:6055`) albo rozbita okrazeniem w tej aktywacji (`:6101-6117`) wykonuje `_fleeStep` (`:9845-9897`), ktorego
// kazdy krok idzie przez `_doMove` z bramka `siegeWallCol >= 0 && _siegeMoveRefused` (`:8689`, `_siegeApproachRestricted`
// `:7951-7960` zwraca `false` dla `ru.routed`, `_siegeShooterThreats` `:7924-7937`, `_threatSlack` `:7939`).
// Rodziny: `flee-atk` (atakujacy rozbity na starcie), `flee-def` (obronca rozbity na starcie, takze na koronie muru i przed
// murem), `surround` (atakujacy rozbity okrazeniem przy murze), `m19` i `m19-surround` (krok ukosny `dr = +2` W GLAB
// zasiegu strzelca na koronie: bez `ru.routed` w `_siegeApproachRestricted` krok bylby odrzucony; pin go wykonuje).
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_tags_rest_siege_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_tags_rest_vectors/{vectors_siege.json,vectors_siege_nan.json,vectors_siege_edge.json}.
// Ziarno 6411.
//
// HARNESS = harness `p6_k5loop_siege_atk_b_gen.mjs` (te same wycinki pinu i ten sam straznik SHA-256 calosci, stala
// `EXPECTED_SHA256`), z jedna zmiana: jednostka dzialajaca moze byc po stronie obroncy (`sc.acting.side`). Ponizej
// komentarz naglowkowy oryginalu (STUBY bez zmian).
//
// P6 SIEGE K5LOOP-SIEGE-ATK-B (dispatch R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1, T2b, Operator r1): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs + siege_tactics_atk_b.rs): ATAKUJACY przy murze
// (`siegeWallCol >= 0`, `ru.side === 'atk'`) w `_activateUnit` (`battleScene.ts:6048-6299`), czesc B:
//   - katapulta: `_attackWallTile` (`:7540-7568`) z trafieniem `_schedule(700)` i `_breachWallTile` (`:7638-7750`:
//     kafel `Plains`, `wallTileHp.delete`, `wallEverBreached`, `_destroyTowerAtRow` `:4194-4200`, odwrot obroncow z
//     korony, katapulta obroncy `_startFade` `:9927-9938`, morale `MORALE_WALL_BREACH` + `_checkRout`);
//     `_advanceToward` poza zasiegiem; brak zywych kafli = dalsze galezie (`_rangedAction`);
//   - taran: `_attackGate` (`:7310-7335`, `_siegeStructureDamage` `:7505-7513`) i `_breachGate` (`:7757-7811`: `gateOpen`,
//     kafle bramy `Plains`, morale `MORALE_GATE_BREACH` + `_checkRout`);
//   - pozostale galezie atakujacego przy murze: krok doktryny (`_executeGroupDoctrineStep` `:17966-18084`), cios
//     (`_doAttack`), strzelec (`_rangedAction`), jazda (`_cavalryAction`), falanga (`_phalanxAction`), krok
//     (`_advanceStep`), odwrot (`_fallBackStep`) z bramka `_doMove` `siegeWallCol >= 0 && _siegeMoveRefused`
//     (`:8689`, `_siegeShooterThreats` `:7924-7937`) i filtrem `_meleeBlockedByWall` (`:8361-8371`) w `_canAttackFrom`,
//     `_makeCanAttackFromTest`, `_canStrikeTargetFrom`, `_targetInRange`.
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_siege_atk_b_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_siege_atk_b_vectors/{vectors.json,vectors_nan.json,vectors_edge.json}.
// Ziarno 7311.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show), straznik SHA-256 calosci wycinkow. Harness = harness K5DOC-T8
// (`p6_k5doc_t8_gen.mjs`) + metody T2a (`p6_k5loop_siege_atk_a_gen.mjs`) + metody muru/bramy T2b (tekst pinu).
// STUBY (bez logiki gry albo wejscie adaptera): `_applyTerrainRange` (zasieg = wejscie), `isSiegeUnit`/`isSiegeTower`/
// `_isRam`/`_isCatapult` = flagi `bu.__siege/__tower/__ram/__cata` (KLASY), `_siegeMachineRange(ru)` = `bu.__machRange`,
// `toCombatUnit`/`terrainDefenseMultiplier` = mnoznik `bu.__tdm`, `_singleBlow` = zapis trafienia i 0 obrazen (jak T8),
// `_doMeleeAttack` = zapis celu (jak T8), `_performPlayerOrder` z kroku doktryny = zapis celu rozkazu (jak T8), atrapy
// renderu/dzwieku/HUD (`cellToWorld`, `tileTopY`, `_animateRam`, `_spawnCatapultBoulder`, `_spawnWallLabel`,
// `_updateSiegeHud`, `_sfx*`) z zapisem chwili wywolania. Teren: `terrainMap.tiles` z kolumna muru (`BTerrain.Wall`,
// brama `BTerrain.Gate`; brama otwarta = `Plains`), kafle specjalne (przechodniosc, koszt, brod) poza kolumna muru.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SCENE = 'gra/src/battle/battleScene.ts';
const FORM = 'gra/src/battle/formationRules.ts';
const COMBAT = 'gra/src/game/combat.ts';
const FORT = 'gra/src/game/city-fortification.ts';
const PARAMS = 'gra/data/combat-params.json';
const TERRAIN = 'gra/data/terrain-combat.json';
const SEED = 6411;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = {
  [SCENE]: gitShow(SCENE).split('\n'), [FORM]: gitShow(FORM).split('\n'), [COMBAT]: gitShow(COMBAT).split('\n'),
  [FORT]: gitShow(FORT).split('\n'),
};
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
  [1147, 1148, 'const MORALE_GATE_BREACH'],
  [1161, 1161, 'const FALLBACK_TILES'],
  [1168, 1168, 'const PHALANX_LEAD_TOLERANCE'],
  [1457, 1459, 'function canShoot('],
  [1797, 1797, 'function cellKey('],
  [1897, 1899, 'function isFordTile('],
  [1917, 1919, 'function manhattan('],
  [1956, 1960, 'function desiredHitForDirection('],
];
expectLine(SCENE, 1011, 'const STEP_GAP_MS');
expectLine(SCENE, 1148, 'const MORALE_WALL_BREACH');
expectLine(SCENE, 2328, 'private _targetPriorities: Record<BattleUnitClass, BattleUnitClass[]> = {');
expectLine(SCENE, 2332, '};');
expectLine(SCENE, 2335, 'private _generalSettings: GeneralSettings = {');
expectLine(SCENE, 2339, '};');
const TOP_FN = [
  [347, 'export function facingToward('],
  [359, 'export function facingFromTo('],
  [370, 'export function oppositeDir('],
  [385, 'export function relativeHit('],
];
const COMBAT_FN = [
  [148, 'export function combatNormField('],
  [158, 'export function unitRowStat('],
  [620, 'export function normTerrain('],
  [706, 'function findTerrainEntry('],
  [756, 'export function cavalryTerrainMultiplier('],
];
const METHODS = [
  [4194, 'private _destroyTowerAtRow('],
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
  [7310, 'private _attackGate('],
  [7436, 'private _moveCostForUnit('],
  [7446, 'private _passableForUnit('],
  [7505, 'private _siegeStructureDamage('],
  [7540, 'private _attackWallTile('],
  [7638, 'private _breachWallTile('],
  [7757, 'private _breachGate('],
  [7892, 'private _advanceToward('],
  [7924, 'private _siegeShooterThreats('],
  [7939, 'private static _threatSlack('],
  [7951, 'private _siegeApproachRestricted('],
  [7963, 'private _siegeMoveRefused('],
  [7973, 'private _bfsFirstStep('],
  [8006, 'private _siegeWalkTo('],
  [8022, 'private _siegeRamTowerStep('],
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
  [9695, 'private _gainMorale('],
  [9707, 'private _boostEnemiesOnBreak('],
  [9743, 'private _shakeAlliesOnLoss('],
  [9761, 'private _checkMeleeScreenLost('],
  [9783, 'private _checkRout('],
  [9799, 'private _startRout('],
  [9845, 'private _fleeStep('],
  [9910, 'private _removeUnitFromScene('],
  [9927, 'private _startFade('],
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
// Konce metod T2b (dispatch: `_breachWallTile` `:7697-7750`, `_breachGate` `:7804-7810` = petle odwrotu/morale).
const ENDS = {
  4194: 4200, 6048: 6299, 7310: 7336, 7505: 7513, 7540: 7568, 7638: 7752, 7757: 7811, 7892: 7916, 7963: 7970,
  8022: 8053, 8685: 8776, 9927: 9938, 17966: 18084,
};
for (const [a, e] of Object.entries(ENDS)) {
  const got = methodEnd(Number(a));
  if (got !== e) throw new Error(`koniec metody ${a}: ${got} != ${e}`);
}
expectLine(SCENE, 7697, '// ZMIANA 5: obrońca na wyburzonym kaflu cofa się o 1 pole (nie ginie).');
expectLine(SCENE, 7745, '// Morale: wyłom muru wstrząsa wszystkimi żywymi obrońcami');
expectLine(SCENE, 7805, 'for (const u of this.def) {');
expectLine(SCENE, 7807, 'u.morale = Math.max(0, u.morale - MORALE_GATE_BREACH);');
expectLine(SCENE, 7555, 'this._schedule(700, () => {');
expectLine(FORT, 76, 'export function meleeBlockedByWall(');
expectLine(FORT, 96, 'export function attackerWallEntryIsBreach(');
const fortParts = [L(FORT, 76, fnEnd(FORT, 76)), L(FORT, 96, fnEnd(FORT, 96))];
const formStart = findLine(FORM, 'export function compactLineAllowsAdvance(');

const parts = [
  ...TOP.map(([a, b]) => L(SCENE, a, b)),
  L(SCENE, 2328, 2332),
  L(SCENE, 2335, 2339),
  ...TOP_FN.map(([a]) => L(SCENE, a, fnEnd(SCENE, a))),
  ...COMBAT_FN.map(([a]) => L(COMBAT, a, fnEnd(COMBAT, a))),
  L(FORM, formStart, fnEnd(FORM, formStart)),
  ...METHODS.map(([a]) => L(SCENE, a, methodEnd(a))),
  ...fortParts,
];
const PIN_SHA256 = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
console.error(`sha256 wycinkow pinu = ${PIN_SHA256}`);
const EXPECTED_SHA256 = '489ddf8ec4d902b13ccd8e83109506ef34d3659b0657aef924f821661d441699';
if (EXPECTED_SHA256 !== PIN_SHA256) throw new Error(`SHA wycinkow pinu zmieniony: ${PIN_SHA256}`);

const stripExport = (t) => t.replace(/^export /gm, '');
const priv = (t) => t.replace(/^(\s*)private /, '$1');
const methodText = (a) => priv(L(SCENE, a, methodEnd(a)));
const rename = (t, from, to) => {
  if (!t.includes(from)) throw new Error(`brak ${from}`);
  return t.replace(from, to);
};
const prioInit = L(SCENE, 2329, 2331);
const generalInit = L(SCENE, 2336, 2338);

const RENAMED = {
  4194: ['_destroyTowerAtRow(wallRow: number', '_destroyTowerAtRowPin(wallRow: number'],
  6372: ['_cavalryAction(', '_cavalryActionPin('],
  6546: ['_phalanxAction(ru: RuntimeBattleUnit', '_phalanxActionPin(ru: RuntimeBattleUnit'],
  6656: ['_rangedAction(ru: RuntimeBattleUnit', '_rangedActionPin(ru: RuntimeBattleUnit'],
  7228: ['_fallBackStep(ru: RuntimeBattleUnit', '_fallBackStepPin(ru: RuntimeBattleUnit'],
  7310: ['_attackGate(ru: RuntimeBattleUnit', '_attackGatePin(ru: RuntimeBattleUnit'],
  7540: ['_attackWallTile(ru: RuntimeBattleUnit', '_attackWallTilePin(ru: RuntimeBattleUnit'],
  7892: ['_advanceToward(ru: RuntimeBattleUnit', '_advanceTowardPin(ru: RuntimeBattleUnit'],
  8022: ['_siegeRamTowerStep(ru: RuntimeBattleUnit', '_siegeRamTowerStepPin(ru: RuntimeBattleUnit'],
  8056: ['_trySiegeTowerClimb(ru: RuntimeBattleUnit', '_trySiegeTowerClimbPin(ru: RuntimeBattleUnit'],
  8087: ['_siegeInfantryToTowerStep(ru: RuntimeBattleUnit', '_siegeInfantryToTowerStepPin(ru: RuntimeBattleUnit'],
  8198: ['_advanceStep(ru: RuntimeBattleUnit', '_advanceStepPin(ru: RuntimeBattleUnit'],
  8334: ['_updateFacing(', '_updateFacingPin('],
  8685: ['_doMove(', '_doMovePin('],
  9743: ['_shakeAlliesOnLoss(fallen: RuntimeBattleUnit', '_shakeAlliesOnLossPin(fallen: RuntimeBattleUnit'],
  9761: ["_checkMeleeScreenLost(side: 'atk' | 'def'", "_checkMeleeScreenLostPin(side: 'atk' | 'def'"],
  9783: ['_checkRout(ru: RuntimeBattleUnit', '_checkRoutPin(ru: RuntimeBattleUnit'],
  9799: ['_startRout(ru: RuntimeBattleUnit', '_startRoutPin(ru: RuntimeBattleUnit'],
  9845: ['_fleeStep(ru: RuntimeBattleUnit', '_fleeStepPin(ru: RuntimeBattleUnit'],
  9910: ['_removeUnitFromScene(ru: RuntimeBattleUnit', '_removeUnitFromScenePin(ru: RuntimeBattleUnit'],
  9927: ['_startFade(ru: RuntimeBattleUnit', '_startFadePin(ru: RuntimeBattleUnit'],
  17966: ['_executeGroupDoctrineStep(ru: RuntimeBattleUnit', '_executeGroupDoctrineStepPin(ru: RuntimeBattleUnit'],
};

const classSrc = [
  `const BROD = ${JSON.stringify(params.brod)};`,
  ...TOP.map(([a, b]) => stripExport(L(SCENE, a, b))),
  ...TOP_FN.map(([a]) => stripExport(L(SCENE, a, fnEnd(SCENE, a)))),
  ...COMBAT_FN.map(([a]) => stripExport(L(COMBAT, a, fnEnd(COMBAT, a)))),
  stripExport(L(FORM, formStart, fnEnd(FORM, formStart))),
  ...fortParts.map(stripExport),
  // `BTerrain` (`battle-terrain.ts:37-46`, `const enum`): wartosci liczbowe pinu.
  'const BTerrain = { Plains: 0, Forest: 1, Hills: 2, River: 3, Ford: 4, Rocks: 5, Wall: 6, Gate: 7 };',
  'const HPBAR_Y = 0;',
  'const TILE_S = 1;',
  'function cellToWorld(c, r) { return { x: c, z: r }; }',
  'function tileTopY() { return 0; }',
  'function easeOut(p) { return p; }',
  'function lerp(a, b, t) { return a + (b - a) * t; }',
  'function dirYaw() { return 0; }',
  'function isSiegeUnit(bu) { return !!(bu && bu.__siege); }',
  'function isSiegeTower(bu) { return !!(bu && bu.__tower); }',
  'function toCombatUnit(bu) { return { rola: bu.__tdm }; }',
  'function terrainDefenseMultiplier(_terr, rola) { return rola; }',
  'class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }',
  '  subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; } lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; } normalize() { return this; } }',
  'const THREE = { Vector3: V3, Quaternion: class { setFromUnitVectors() { return this; } } };',
  'function projectileKind() { return "arrow"; }',
  'function makeProjectileMesh() { return { group: { position: new V3(), quaternion: { copy() {} } }, geos: [], mats: [] }; }',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1;',
  '    this.siegeGateCol = -1; this.siegeGateRow = -1; this.gateOpen = false; this.gateHp = 0; this.wallTileHp = new Map(); this.siegeWallTilesInit = 0;',
  '    this.towerAtWallRows = new Set(); this.siegeTowers = []; this.towerRange = 2; this.lastAttackedWallRow = -1; this.siegeWallGroup = null;',
  '    this.wallEverBreached = false; this.occByKey = new Map(); this._groupMeta = new Map(); this._autoBatchPlanning = null;',
  '    this._autoBattleSuspended = false; this.busy = false; this.vNow = 0; this.__q = []; this.__trace = []; this.__inMove = 0;',
  '    this.__advStarted = false; this.__steps = []; this.__facing = []; this.__attack = null; this.terrainMap = null; this.terrainData = [];',
  '    this.__blows = []; this.__rangedStarted = false; this.__fbStarted = false; this.__phStarted = false; this.__inPhalanx = 0; this.__phalanxAdvance = false;',
  '    this.projectiles = []; this.scene = { add() {}, remove() {} }; this.log = []; this.routedUnits = [];',
  '    this.__shakeDirect = null; this.__shaken = []; this.__routs = []; this.__leaves = []; this.__order = []; this.__fleeStarted = false;',
  '    this.__inDoctrine = 0; this.__orderDest = null; this.__meta = null; this.__acting = null; this.__inRam = 0; this.__inFade = 0;',
  '    this.__kills = []; this.__refused = []; this.__rams = []; this.__boulders = []; this.__labels = []; this.__gateHits = []; this.__climb = null;',
  `    this._generalSettings = {\n${generalInit}\n    };`,
  `    this._targetPriorities = {\n${prioInit}\n    }; }`,
  '  _now() { return this.vNow; }',
  '  _raf(cb) { this.__q.push({ kind: "raf", cb }); }',
  '  _schedule(ms, cb) { this.__q.push({ kind: "sched", ms, cb }); }',
  // `_applyTerrainRange` (`:7477`): zasieg = wejscie adaptera; slad tylko dla jednostki dzialajacej (`_activateUnit`
  // `:6063`), nie dla obroncow czytanych przez `_siegeShooterThreats` (`:7929`) ani schodzacych z muru (`:7740`).
  '  _applyTerrainRange(ru) { if (ru === this.__acting) this.__trace.push("terrainRange"); }',
  '  _isPlayerSide(side) { return false; }',
  '  _performPlayerOrder(ru, done) { if (!this.__inDoctrine) throw new Error("tryb reczny poza zakresem"); this.__trace.push("playerOrder"); this.__orderDest = { col: ru.playerOrder.col, row: ru.playerOrder.row }; done(); return true; }',
  '  _refreshQueuedOrderVisuals() {}',
  '  _executeGroupDoctrineStep(ru, meta, done) { this.__trace.push("doctrine"); this.__meta = meta.doctrine; this.__inDoctrine += 1; try { return this._executeGroupDoctrineStepPin(ru, meta, done); } finally { this.__inDoctrine -= 1; } }',
  '  __tag(ru) { return ru.side + (ru.side === "atk" ? this.atk : this.def).indexOf(ru); }',
  '  _updateMoraleBar(ru) { if (this.__shakeDirect) { this.__shaken.push({ unit: this.__tag(ru), fallen: this.__shakeDirect, morale: ru.morale, t: this.vNow }); this.__order.push("S:" + this.__tag(ru)); } }',
  '  _shakeAlliesOnLoss(f) { const s = this.__shakeDirect; this.__shakeDirect = this.__tag(f); try { return this._shakeAlliesOnLossPin(f); } finally { this.__shakeDirect = s; } }',
  '  _checkRout(ru) { const s = this.__shakeDirect; this.__shakeDirect = null; try { return this._checkRoutPin(ru); } finally { this.__shakeDirect = s; } }',
  '  _checkMeleeScreenLost(side) { const s = this.__shakeDirect; this.__shakeDirect = null; try { return this._checkMeleeScreenLostPin(side); } finally { this.__shakeDirect = s; } }',
  '  _startRout(ru) { if (!(ru.routed || ru.dead || ru.fadingOut)) { this.__routs.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("R:" + this.__tag(ru)); } const s = this.__shakeDirect; this.__shakeDirect = null; try { this._startRoutPin(ru); } finally { this.__shakeDirect = s; } }',
  '  _removeUnitFromScene(ru) { const was = ru.removed; this._removeUnitFromScenePin(ru); if (!was && !this.__inFade) { this.__leaves.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("L:" + this.__tag(ru)); } }',
  // `_startFade` (`:9927-9938`): zabicie (katapulta obroncy na wyburzonym kaflu, `:7703`) = akcja `Kill`.
  '  _startFade(ru) { if (!(ru.fadingOut || ru.dead || ru.removed)) { this.__kills.push({ unit: this.__tag(ru), t: this.vNow }); this.__order.push("K:" + this.__tag(ru)); } this.__inFade += 1; try { this._startFadePin(ru); } finally { this.__inFade -= 1; } }',
  '  _sfxDeath() {}',
  '  _fleeStep(ru, done) { if (!this.__fleeStarted) { this.__fleeStarted = true; this.__trace.push("flee"); } return this._fleeStepPin(ru, done); }',
  '  _sfxRout() {}',
  '  _sfxShot() {}',
  '  _sfxRamImpact() {}',
  '  _updateAmmoBar() {}',
  '  _updateSiegeHud() {}',
  '  _animateRam() { this.__rams.push({ t: this.vNow }); this.__order.push("RAM"); }',
  '  _spawnCatapultBoulder() { this.__boulders.push({ t: this.vNow }); this.__order.push("BOULDER"); }',
  '  _spawnWallLabel(c, r, text) { this.__labels.push({ col: c, row: r, text, t: this.vNow }); this.__order.push("LABEL:" + r); }',
  '  _destroyTowerAtRow(row) { const t = this.siegeTowers.find((x) => x.row === row && !x.destroyed); this._destroyTowerAtRowPin(row); if (t) this.__order.push("TOWER:" + row); }',
  '  _spawnDamageLabel() { throw new Error("etykieta: _singleBlow atrapa zwraca 0"); }',
  '  _singleBlow(a, d, ranged) { const list = d.side === "atk" ? this.atk : this.def; this.__blows.push({ target: list.indexOf(d), ranged, t: this.vNow, hitArc: relativeHit(d.facing, a.q, a.r, d.q, d.r), facing: a.facing }); return 0; }',
  '  _phalanxAction(ru, done) { if (!this.__phStarted) { this.__phStarted = true; this.__trace.push("phalanxAction"); } this.__inPhalanx += 1; try { return this._phalanxActionPin(ru, done); } finally { this.__inPhalanx -= 1; } }',
  '  _rangedAction(ru, done) { if (!this.__rangedStarted) { this.__rangedStarted = true; this.__trace.push("rangedAction"); } return this._rangedActionPin(ru, done); }',
  '  _fallBackStep(ru, done) { if (!this.__fbStarted) { this.__fbStarted = true; this.__trace.push("fallBackStep"); } return this._fallBackStepPin(ru, done); }',
  '  _doMeleeAttack(ru, e, done) { if (this.__attack) throw new Error("drugi atak"); const list = e.side === "atk" ? this.atk : this.def; this.__attack = { target: list.indexOf(e), t: this.vNow }; done(); }',
  '  _cavalryAction(ru, done) { this.__trace.push("cavalryAction"); return this._cavalryActionPin(ru, done); }',
  '  _updateFacing(ru) { if (!this.__inMove) this.__trace.push("facing"); const f0 = ru.facing; this._updateFacingPin(ru); if (ru.facing !== f0) this.__facing.push({ t: this.vNow, dir: ru.facing }); }',
  '  _advanceStep(ru, done) { if (this.__inPhalanx || this.__phalanxAdvance) this.__phalanxAdvance = true; else if (!this.__advStarted) { this.__advStarted = true; this.__trace.push("advanceStep"); } return this._advanceStepPin(ru, done); }',
  // `_doMove`: krok (pole sie zmienia) albo odmowa bramki muru (`:8689-8692`: pole bez zmian, `moveLeft = 0`).
  '  _doMove(ru, c, r, done) { const t = this.vNow; const q0 = ru.q, r0 = ru.r; this.__inMove += 1; try { this._doMovePin(ru, c, r, done); } finally { this.__inMove -= 1; } if (ru.q === q0 && ru.r === r0) this.__refused.push({ col: c, row: r, t }); else this.__steps.push({ col: ru.q, row: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, t }); }',
  '  _isRam(bu) { return !!bu.__ram; }',
  '  _isCatapult(bu) { return !!bu.__cata; }',
  '  _siegeMachineRange(ru) { return ru.bu.__machRange; }',
  '  _trySiegeTowerClimb(ru, done) { this.__trace.push("towerClimb"); const q0 = ru.q, r0 = ru.r; const ok = this._trySiegeTowerClimbPin(ru, done); if (ok) this.__climb = { from: [q0, r0], to: [ru.q, ru.r], t: this.vNow }; return ok; }',
  '  _siegeInfantryToTowerStep(ru, done) { this.__trace.push("infToTower"); return this._siegeInfantryToTowerStepPin(ru, done); }',
  '  _siegeRamTowerStep(ru, done) { this.__trace.push("ramTower"); this.__inRam += 1; try { return this._siegeRamTowerStepPin(ru, done); } finally { this.__inRam -= 1; } }',
  '  _advanceToward(ru, c, r, done) { if (!this.__inRam) this.__trace.push("advanceToward:" + c + "," + r); return this._advanceTowardPin(ru, c, r, done); }',
  '  _attackWallTile(ru, row, done) { this.__trace.push("attackWallTile:" + row); return this._attackWallTilePin(ru, row, done); }',
  '  _attackGate(ru, done) { this.__gateHits.push({ t: this.vNow }); return this._attackGatePin(ru, done); }',
  ...METHODS.map(([a]) => {
    let t = methodText(a);
    if (RENAMED[a]) t = rename(t, RENAMED[a][0], RENAMED[a][1]);
    return t;
  }),
  '}',
  'const BattleScene = Harness;',
  'module.exports.Harness = Harness; module.exports.cavalryTerrainMultiplier = cavalryTerrainMultiplier; module.exports.unitRowStat = unitRowStat;',
].join('\n');

const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(mod, mod.exports, createRequire(import.meta.url));
const { Harness, cavalryTerrainMultiplier, unitRowStat } = mod.exports;

const DEFAULT_TERRAIN = 'Plaskie (rownina/laka)';
const cavMult = cavalryTerrainMultiplier(DEFAULT_TERRAIN, terrainData);
if (cavMult !== 1) throw new Error(`mnoznik jazdy terenu domyslnego ${cavMult}`);

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
const BF_COLS = 68;
const BF_ROWS = 156;
const DOCTRINES = ['steady', 'aggressive', 'defensive', 'skirmish', 'manual'];

// Teren pola: kolumna muru `W` (`Wall`, brama `Gate` w `gateRow - 1 .. gateRow`; brama otwarta = `Plains`), kafle
// specjalne poza kolumna muru. `passable` / `moveCost` / `at` jak `createBattleTerrainMap` (`battle-terrain.ts:781-797`)
// z tablicy `tiles` (wyburzony kafel = `Plains`, przechodni, koszt 1).
function terrainMapOf(t) {
  const tiles = new Array(BF_COLS * BF_ROWS).fill(0);
  for (let r = 0; r < BF_ROWS; r++) {
    const gate = r === t.gateRow - 1 || r === t.gateRow;
    tiles[r * BF_COLS + t.wallCol] = gate ? (t.gateOpen ? 0 : 7) : 6;
  }
  const special = new Map(t.tiles.map((x) => [x.c + ',' + x.r, x]));
  const tileAt = (c, r) => (c < 0 || c >= BF_COLS || r < 0 || r >= BF_ROWS ? 0 : tiles[r * BF_COLS + c]);
  return {
    tiles,
    passable: (c, r) => { const k = tileAt(c, r); return k !== 3 && k !== 6 && k !== 7 && (special.get(c + ',' + r)?.pass ?? true); },
    moveCost: (c, r) => special.get(c + ',' + r)?.cost ?? 1,
    at: (c, r) => (special.get(c + ',' + r)?.ford ? 4 : tileAt(c, r)),
    combatTerrainName: () => DEFAULT_TERRAIN,
  };
}

function baseUnit(side, idx, q, r) {
  return {
    side, idx, q, r, facing: ri(0, 3), moveLeft: pick([1, 2, 2, 3, 4, 6, 1.5]), dead: false, fadingOut: false, routed: false,
    unitDoctrine: 'manual', groupId: null, hp: pick([40, 60, 80, 100]), mounted: false, primaryRanged: false,
    rangedBase: false, phalanx: false, antiCavSpear: false, morale: 100, fleeMorale: 0, moraleMax: 100, neverRout: false,
    tdm: 1, onWall: false, siege: false, ram: false, tower: false, cata: false, machRange: 1, range: 1, ammoLeft: 0,
    formationRank: null, stats: null,
  };
}

// Statystyki `ru.bu.stats` (wiersz `units.json`): wartosci liczbowe, napisy, `'---'`, `null` (rozwija je `unitRowStat`).
function statsOf(kind) {
  const v = (xs) => pick(xs);
  if (kind === 'cata') {
    return { wallAttack: v([16, 16, 0, '---', null, 'Infinity', 40]), missileAttack: v([0, 5, '3', 2.5, null]), weaponDamage: v([8, 3, 0.2, null, 640]), chargeBonus: v([null, 4]) };
  }
  if (kind === 'ram') {
    return { wallAttack: v([14, 14, 0, null, '---', 'Infinity', 400]), missileAttack: v([0, 0, 3, null]), chargeBonus: v([null, 3, 7.5, 9, 120]), weaponDamage: v([8, 20, null]), Uderzenie: v([undefined, 6]) };
  }
  return null;
}
const statNum = (x) => (x === 'Infinity' ? Infinity : x);
function resolvedStats(s) {
  if (!s) return null;
  const row = Object.fromEntries(Object.entries(s).filter(([, x]) => x !== undefined).map(([k, x]) => [k, statNum(x)]));
  return {
    wallAttack: unitRowStat(row, 'wallAttack', undefined, 0),
    missileAttack: unitRowStat(row, 'missileAttack', 'Atak dystansowy', 0),
    impact: unitRowStat(row, 'chargeBonus', 'Uderzenie', unitRowStat(row, 'weaponDamage', 'Atak', 8)),
    weaponDamage: unitRowStat(row, 'weaponDamage', 'Atak', 8),
  };
}

function makeCase(kind, variant) {
  const edge = variant === 'edge';
  const W = edge ? pick([BF_COLS - 2, BF_COLS - 1, 1, 2]) : ri(20, 58);
  const gateRow = edge ? pick([1, BF_ROWS - 1, ri(6, 150)]) : ri(10, 145);
  const gateOpen = kind === 'ram' ? rnd() < 0.08 : rnd() < 0.2;
  const r0 = kind === 'ram' ? Math.max(2, Math.min(153, gateRow + ri(-1, 0))) : (edge ? pick([0, 1, 154, 155, ri(5, 150)]) : ri(6, 149));
  const used = new Set();
  const free = (q, r) => q >= 0 && q < BF_COLS && r >= 0 && r < BF_ROWS && !used.has(q + ',' + r);
  const take = (q, r) => { used.add(q + ',' + r); return [q, r]; };
  const placeIn = (q0, q1, rc, span) => {
    for (let t = 0; t < 300; t++) {
      const q = ri(Math.max(0, q0), Math.min(BF_COLS - 1, q1));
      const r = Math.max(0, Math.min(BF_ROWS - 1, rc + ri(-span, span)));
      if (free(q, r)) return take(q, r);
    }
    return null;
  };
  const wallRows = [];
  for (let r = Math.max(0, r0 - 20); r <= Math.min(BF_ROWS - 1, r0 + 20); r++) {
    if (r === gateRow - 1 || r === gateRow) continue;
    if (rnd() < 0.92) wallRows.push([r, pick([640, 40, 16, 10, 5, 1, 1, 0])]);
  }
  const atk = [];
  const def = [];
  let me;
  const wallBase = W - 1;
  if (kind === 'cata') {
    const at = placeIn(W - 14, wallBase, r0, 6);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    me.siege = true; me.cata = true; me.rangedBase = true; me.ammoLeft = pick(['Infinity', 3]);
    me.range = pick([4, 6]); me.machRange = pick([3, 6, 8, 14]);
    me.moveLeft = pick([1, 2, 0, 0.5]);
    me.stats = statsOf('cata');
    // Kafle przy katapulcie: czesc juz zburzona (`hp <= 0`, klucz zostaje), czesc tuz przed wyburzeniem.
    if (variant === 'all-broken') for (const w of wallRows) w[1] = pick([0, -0, 0]);
    if (variant === 'no-tiles') wallRows.length = 0;
  } else if (kind === 'ram') {
    const near = rnd() < 0.85;
    const at = near ? (free(wallBase, r0) ? take(wallBase, r0) : null) : placeIn(W - 8, wallBase, gateRow, 5);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    me.siege = true; me.ram = true; me.moveLeft = pick([1, 2, 0]);
    me.stats = statsOf('ram');
  } else {
    const onWall = variant === 'on-wall';
    const at = onWall ? (free(W, r0) ? take(W, r0) : null) : placeIn(W - 7, wallBase, r0, 5);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    if (onWall) me.onWall = true;
    const x = rnd();
    if (kind === 'cav') me.mounted = true;
    else if (kind === 'shoot') { me.rangedBase = true; me.primaryRanged = rnd() < 0.5; me.ammoLeft = pick(['Infinity', 2, 5]); me.range = ri(2, 5); if (rnd() < 0.25) me.shootingEnabled = false; }
    else if (kind === 'dry') { me.rangedBase = true; me.primaryRanged = true; me.ammoLeft = 0; if (rnd() < 0.5) me.dryCol = me.q + ri(0, 4); }
    else if (kind === 'phalanx') me.phalanx = true;
    else if (x < 0.2) me.antiCavSpear = true;
    me.moveLeft = pick([1, 2, 3, 4, 6, 1.5]);
    if (rnd() < 0.3) me.attackDirection = pick(['bok', 'tyl']);
    me.unitDoctrine = pick(['manual', 'manual', null, 'steady', 'aggressive', 'defensive', 'skirmish']);
  }
  me.surroundApplied = true;
  atk.push(me);
  // Obroncy: na koronie (q = W, `onWallWalkway`), w miescie (q > W), przed murem; strzelcy na koronie (zagrozenia
  // `_siegeShooterThreats`), katapulty obroncy na koronie (`_startFade` przy wyburzeniu).
  const nDef = ri(2, 9);
  for (let i = 0; i < nDef; i++) {
    const y = rnd();
    const at = y < 0.6 ? placeIn(W, W, r0, kind === 'cata' ? 8 : 6) : (y < 0.85 ? placeIn(W + 1, W + 4, r0, 6) : placeIn(W - 5, wallBase, r0, 4));
    if (!at) continue;
    const u = baseUnit('def', def.length, ...at);
    if (u.q === W) u.onWall = true;
    const z = rnd();
    if (z < 0.35) { u.rangedBase = true; u.ammoLeft = pick(['Infinity', 4, 0]); u.range = ri(2, 6); u.primaryRanged = rnd() < 0.6; }
    else if (z < 0.45 && u.onWall) { u.cata = true; u.siege = true; u.rangedBase = true; u.ammoLeft = 'Infinity'; u.range = 6; }
    else if (z < 0.55) u.mounted = !u.onWall;
    u.morale = pick([100, 100, 60, 8, 4, 3, 0]);
    u.fleeMorale = pick([0, 0, 5, 30]);
    u.tdm = pick([1, 1, 1, 1.5]);
    u.neverRout = rnd() < 0.08;
    const d = rnd();
    if (d < 0.04) u.dead = true; else if (d < 0.08) u.routed = true;
    def.push(u);
  }
  // Sojusznicy atakujacego (przeszkody, rout/morale `_boostEnemiesOnBreak`).
  const nAtk = ri(0, 5);
  for (let i = 0; i < nAtk; i++) {
    const at = placeIn(W - 8, wallBase, r0, 6);
    if (!at) continue;
    const u = baseUnit('atk', atk.length, ...at);
    if (rnd() < 0.3) { u.mounted = true; } else if (rnd() < 0.3) { u.rangedBase = true; u.primaryRanged = true; u.ammoLeft = 3; u.range = 3; }
    atk.push(u);
  }
  // Blokady pol odwrotu (`retreatCol` i petla `dc/dr`, `:7706-7735`).
  if (rnd() < 0.4) for (let k = 0; k < ri(1, 8); k++) { const at = placeIn(W + 1, W + 3, r0, 3); if (at) def.push(baseUnit('def', def.length, ...at)); }
  if (def.filter((u) => !u.dead).length === 0) return null;
  // Teren: kafle specjalne poza kolumna muru (takze po stronie obroncy: odwrot `terrainMap.passable`).
  const tilesSp = [];
  const seen = new Set();
  for (let i = 0; i < ri(0, 24); i++) {
    const c = ri(Math.max(0, W - 12), Math.min(BF_COLS - 1, W + 3));
    const r = Math.max(0, Math.min(BF_ROWS - 1, r0 + ri(-8, 8)));
    const k = c + ',' + r;
    if (c === W || seen.has(k)) continue;
    seen.add(k);
    const x = rnd();
    if (x < 0.3) tilesSp.push({ c, r, pass: false, cost: 1, ford: false });
    else if (x < 0.5) tilesSp.push({ c, r, pass: true, cost: 3, ford: true });
    else if (x < 0.55 && variant === 'nan') tilesSp.push({ c, r, pass: true, cost: NaN, ford: false });
    else tilesSp.push({ c, r, pass: true, cost: pick([2, 3, 0.5]), ford: false });
  }
  for (const u of [...atk, ...def]) {
    if (tilesSp.some((t) => t.c === u.q && t.r === u.r && !t.pass)) return null;
  }
  const towers = [];
  for (const [r] of wallRows) if (rnd() < 0.12) towers.push({ row: r, destroyed: rnd() < 0.15 });
  if (kind === 'cata' && rnd() < 0.5 && wallRows.length > 0) towers.push({ row: pick(wallRows)[0], destroyed: false });
  const towerAtWallRows = [];
  if (rnd() < 0.2) towerAtWallRows.push(Math.max(0, Math.min(BF_ROWS - 1, r0 + ri(-4, 4))));
  return {
    acting: { side: 'atk', idx: 0 }, atk, def, groupMeta: [], wallCol: W, gateCol: kind === 'ram' && rnd() < 0.06 ? -1 : W,
    gateRow, gateOpen, gateHp: kind === 'ram' ? pick([400, 30, 14, 12, 5, 1, 0]) : pick([400, 0]),
    wallTiles: wallRows, wallTilesInit: wallRows.length + ri(0, 3), towers, towerRange: ri(2, 6),
    towerAtWallRows: [...new Set(towerAtWallRows)], wallEverBreached: rnd() < 0.25,
    terrain: { wallCol: W, gateRow, gateOpen, tiles: tilesSp },
  };
}

function newHarness(sc) {
  const h = new Harness();
  h.terrainData = terrainData;
  h.siegeWallCol = sc.wallCol;
  h.siegeGateCol = sc.gateCol;
  h.siegeGateRow = sc.gateRow;
  h.gateOpen = sc.gateOpen;
  h.gateHp = sc.gateHp;
  for (const [r, hp] of sc.wallTiles) h.wallTileHp.set(r, hp);
  h.siegeWallTilesInit = sc.wallTilesInit;
  for (const r of sc.towerAtWallRows) h.towerAtWallRows.add(r);
  h.siegeTowers = sc.towers.map((t) => ({ row: t.row, mesh: null, destroyed: t.destroyed }));
  h.towerRange = sc.towerRange;
  h.wallEverBreached = sc.wallEverBreached;
  h.terrainMap = terrainMapOf(sc.terrain);
  for (const [id, doctrine, autoPlay] of sc.groupMeta) h._groupMeta.set(id, { doctrine, autoPlay });
  const mk = (u) => ({
    bu: {
      id: u.side + u.idx, nazwa: u.side + u.idx, hp: u.hp ?? 100, maxHp: 100, __tdm: u.tdm ?? 1,
      __cata: !!u.cata, __siege: !!u.siege, __ram: !!u.ram, __tower: !!u.tower, __machRange: u.machRange ?? 1,
      stats: u.stats ? Object.fromEntries(Object.entries(u.stats).filter(([, x]) => x !== undefined).map(([k, x]) => [k, statNum(x)])) : {},
    },
    side: u.side, q: u.q, r: u.r,
    facing: u.facing, moveLeft: u.moveLeft, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.dead,
    surroundApplied: !!u.surroundApplied, neverRout: u.neverRout ?? false, morale: u.morale ?? 100, fleeMorale: u.fleeMorale ?? 0,
    moraleMax: u.moraleMax ?? 100, screenLostApplied: false, fleeStuck: 0,
    range: u.range ?? 1, rangeBase: u.rangedBase ? (u.range ?? 1) : 0, onWallWalkway: !!u.onWall,
    primaryRanged: u.primaryRanged ?? false, rangedBase: u.rangedBase ?? false, mounted: u.mounted ?? false,
    antiCavSpear: u.antiCavSpear ?? false, phalanx: u.phalanx ?? false, shootingEnabled: u.shootingEnabled ?? true,
    ammoLeft: u.ammoLeft === 'Infinity' ? Infinity : (u.ammoLeft ?? 0), ammoMax: 5,
    dryCol: u.dryCol ?? -1, heldAfterFallback: false,
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

// Jedna aktywacja `_activateUnit` atakujacego od chwili 0, potem odroczone wywolania (`_schedule`, kamien katapulty).
function activate(sc) {
  const h = newHarness(sc);
  const ru = (sc.acting.side === 'def' ? h.def : h.atk)[sc.acting.idx];
  h.__acting = ru;
  const tiles0 = h.terrainMap.tiles.slice();
  const doctrineAuto = h._isUnitDoctrineAuto(ru);
  let doneAt = null;
  h._activateUnit(ru, () => { if (doneAt !== null) throw new Error('done() dwa razy'); doneAt = h.vNow; });
  let guard = 0;
  while (h.__q.length > 0) {
    if (++guard > 20000) throw new Error('petla kolejki');
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
  const plains = [];
  for (let i = 0; i < tiles0.length; i++) {
    if (tiles0[i] !== h.terrainMap.tiles[i]) plains.push([i % BF_COLS, Math.floor(i / BF_COLS), h.terrainMap.tiles[i]]);
  }
  const unitsOut = [...h.atk, ...h.def].map((u) => ({
    unit: tagOf(u), q: u.q, r: u.r, onWall: !!u.onWallWalkway, morale: u.morale, routed: !!u.routed, dead: !!u.dead,
    removed: !!u.removed, facing: u.facing,
  }));
  return {
    doctrineAuto,
    meta: h.__meta,
    trace: h.__trace,
    steps: h.__steps,
    refused: h.__refused,
    facing: h.__facing,
    attack: h.__attack,
    orderDest: h.__orderDest,
    duration: doneAt,
    final: {
      q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, lastAutoMoveFrom: ru.lastAutoMoveFrom ?? null,
      dryCol: ru.dryCol, heldAfterFallback: ru.heldAfterFallback,
      ammoLeft: Number.isFinite(ru.ammoLeft) ? ru.ammoLeft : 'Infinity',
      rangedKite: ru.rangedKite !== false, onWall: !!ru.onWallWalkway,
    },
    groupMeta: [...h._groupMeta.entries()].map(([id, m]) => [id, m.doctrine, m.autoPlay]).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    blows: h.__blows,
    phalanxAdvance: h.__phalanxAdvance,
    occ,
    climb: h.__climb,
    units: unitsOut,
    wallTileHp: [...h.wallTileHp.entries()],
    gateHp: h.gateHp,
    gateOpen: h.gateOpen,
    wallEverBreached: h.wallEverBreached,
    lastAttackedWallRow: h.lastAttackedWallRow,
    towersDestroyed: h.siegeTowers.map((t) => t.destroyed),
    towerAtWallRows: [...h.towerAtWallRows].sort((a, b) => a - b),
    log: h.log.filter((l) => l.startsWith('Wieza strzelnicza w wy')),
    rams: h.__rams,
    gateHits: h.__gateHits,
    boulders: h.__boulders,
    labels: h.__labels,
    routs: h.__routs,
    kills: h.__kills,
    leaves: h.__leaves,
    shaken: h.__shaken,
    order: h.__order,
    plains,
  };
}

// Galaz pinu (licznik pokrycia; nazwa = to, co sie wydarzylo).
function branchOf(sc, e) {
  const t = e.trace;
  const wallShot = t.find((x) => x.startsWith('attackWallTile:'));
  if (wallShot) {
    const breach = e.labels.some((l) => l.text === 'MUR WYBURZONY!');
    if (!breach) return e.labels.length > 0 ? 'wall-hit' : 'wall-shot';
    return 'wall-breach';
  }
  if (e.gateHits.length > 0) {
    if (e.rams.length === 0) return 'gate-guard';
    return e.gateOpen && !sc.gateOpen ? 'gate-breach' : 'gate-hit';
  }
  if (t.includes('ramTower')) return 'ram-move';
  if (t.some((x) => x.startsWith('advanceToward:'))) return 'cata-toward';
  if (e.climb) return 'climb';
  const refused = e.refused.length > 0;
  const tag = t.includes('doctrine') ? 'doc-' : '';
  if (t.includes('cavalryAction')) return tag + (refused ? 'cav-refused' : 'cav');
  if (t.includes('rangedAction')) return tag + (e.blows.length > 0 ? 'ranged-shot' : (refused ? 'ranged-refused' : 'ranged-move'));
  if (t.includes('fallBackStep')) return tag + 'fallback';
  if (t.includes('phalanxAction')) return tag + (e.attack ? 'phalanx-attack' : (refused ? 'phalanx-refused' : 'phalanx'));
  if (t.includes('advanceStep')) return tag + (e.attack ? 'advance-attack' : (refused ? 'advance-refused' : (e.steps.length > 0 ? 'advance-move' : 'advance-none')));
  if (t.includes('playerOrder')) return 'doc-order';
  if (e.attack) return tag + 'attack';
  if (e.blows.length > 0) return tag + 'shot';
  return tag + 'hold';
}

const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : (v === Infinity ? 'Infinity' : (v === -Infinity ? '-Infinity' : v)));

function finalize(sc, expect, name, kind) {
  for (const u of [...sc.atk, ...sc.def]) u.resolvedStats = resolvedStats(u.stats);
  expect.branch = branchOf(sc, expect);
  return { ...sc, name, kind, expect };
}


// ---------------------------------------------------------------------------------------------------------------------
// K5LOOP-TAGS-REST: scenariusze ucieczki przy murze (pin wykonany przez `activate`).
const MOVES = [1, 2, 3, 4, 6, 1.5, 0.5];
const fleeBranch = (sc, e) => {
  if (!e.trace.includes('flee')) return 'no-flee';
  const left = e.leaves.length > 0;
  if (left) return e.steps.length > 0 ? 'flee-steps-left' : 'flee-left';
  if (e.refused.length > 0) return 'flee-refused';
  return e.steps.length > 0 ? 'flee-steps' : 'flee-stuck';
};
const finalizeFlee = (sc, e, name, kind) => {
  for (const u of [...sc.atk, ...sc.def]) u.resolvedStats = resolvedStats(u.stats);
  e.branch = fleeBranch(sc, e);
  return { ...sc, name, kind, expect: e };
};

function fleeAtkCase(variant) {
  for (let t = 0; t < 200000; t++) {
    const sc = makeCase(pick(['inf', 'inf', 'cav', 'shoot', 'phalanx']), variant === 'edge' ? 'edge' : null);
    if (!sc) continue;
    const me = sc.atk[0];
    Object.assign(me, { routed: true, moveLeft: variant === 'movenan' ? NaN : pick(MOVES) });
    return sc;
  }
  throw new Error('flee-atk');
}

function fleeDefCase(variant) {
  for (let t = 0; t < 200000; t++) {
    const sc = makeCase(pick(['inf', 'cav', 'shoot', 'cata']), variant === 'edge' ? 'edge' : null);
    if (!sc) continue;
    const alive = sc.def.map((u, i) => [u, i]).filter(([u]) => !u.dead && !u.routed);
    if (alive.length === 0) continue;
    const [u, i] = pick(alive);
    Object.assign(u, { routed: true, moveLeft: variant === 'movenan' ? NaN : pick(MOVES) });
    sc.acting = { side: 'def', idx: i };
    return sc;
  }
  throw new Error('flee-def');
}

const tileBlocked = (sc, q, r) => sc.terrain.tiles.some((x) => x.c === q && x.r === r && !x.pass);
const unitAt = (sc, q, r) => [...sc.atk, ...sc.def].find((u) => u.q === q && u.r === r);

function surroundCase(variant) {
  for (let t = 0; t < 400000; t++) {
    const sc = makeCase('inf', variant === 'edge' ? 'edge' : null);
    if (!sc) continue;
    const me = sc.atk[0];
    if (me.onWall) continue;
    const ring = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dq, dr]) => [me.q + dq, me.r + dr])
      .filter(([q, r]) => q >= 0 && q < BF_COLS && r >= 0 && r < BF_ROWS && q !== sc.wallCol && !tileBlocked(sc, q, r));
    let n = 0;
    for (const [q, r] of ring) {
      const there = unitAt(sc, q, r);
      if (there && there.side === 'atk') continue;
      if (there) { Object.assign(there, { dead: false, routed: false, fadingOut: false }); n += 1; continue; }
      if (n >= 3 && rnd() < 0.5) continue;
      sc.def.push(baseUnit('def', sc.def.length, q, r));
      n += 1;
    }
    if (n < 3) continue;
    Object.assign(me, {
      surroundApplied: false, neverRout: false, unitDoctrine: 'manual', morale: pick([5, 8, 10, 14, 20]),
      fleeMorale: pick([0, 5, 10, 25]), moveLeft: variant === 'movenan' ? NaN : pick(MOVES), tdm: 1,
    });
    return sc;
  }
  throw new Error('surround');
}

// M19 (dlug T2b): rozbity atakujacy w zasiegu strzelca na koronie; pola ucieczki `dr = 0, +1, -1` zajete przez
// sojusznikow, wolne tylko `dr = +2` (`_fleeStep` `:9867`), ktore ZMNIEJSZA `_threatSlack` (`to < from`, `to <= 0`).
// Bez warunku `ru.routed` w `_siegeApproachRestricted` (`:7953`) krok bylby odrzucony; pin go wykonuje.
function m19Case(surround) {
  for (let t = 0; t < 200000; t++) {
    const W = ri(12, 60);
    const r0 = ri(8, 140);
    const x = W - 2;
    const me = baseUnit('atk', 0, x, r0);
    Object.assign(me, { moveLeft: pick([1, 2, 1.5]), unitDoctrine: 'manual', mounted: false, facing: ri(0, 3) });
    if (surround) Object.assign(me, { surroundApplied: false, neverRout: false, morale: pick([5, 8, 10]), fleeMorale: pick([0, 5]) });
    else Object.assign(me, { routed: true, surroundApplied: true });
    const atk = [me];
    for (const dr of [0, 1, -1]) atk.push(baseUnit('atk', atk.length, x - 1, r0 + dr));
    const def = [];
    const shooter = baseUnit('def', 0, W, r0 + 3);
    Object.assign(shooter, { onWall: true, rangedBase: true, ammoLeft: 'Infinity', range: 6, primaryRanged: true });
    def.push(shooter);
    if (surround) {
      for (const [q, r] of [[x + 1, r0], [x, r0 + 1], [x, r0 - 1]]) def.push(baseUnit('def', def.length, q, r));
    }
    const wallRows = [];
    for (let r = Math.max(0, r0 - 10); r <= Math.min(BF_ROWS - 1, r0 + 10); r++) wallRows.push([r, 40]);
    const gateRow = r0 + 30 < BF_ROWS - 1 ? r0 + 30 : r0 - 30;
    const sc = {
      acting: { side: 'atk', idx: 0 }, atk, def, groupMeta: [], wallCol: W, gateCol: W, gateRow, gateOpen: false,
      gateHp: 400, wallTiles: wallRows.filter(([r]) => r !== gateRow - 1 && r !== gateRow), wallTilesInit: wallRows.length,
      towers: [], towerRange: 2, towerAtWallRows: [], wallEverBreached: false,
      terrain: { wallCol: W, gateRow, gateOpen: false, tiles: [] },
    };
    return sc;
  }
  throw new Error('m19');
}

const nanJsonFlee = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : (v === Infinity ? 'Infinity' : (v === -Infinity ? '-Infinity' : v)));

function genFlee(label, counts, variant) {
  const cases = [];
  for (const [kind, n] of Object.entries(counts)) {
    let got = 0;
    let tries = 0;
    while (got < n) {
      if (++tries > 200000) throw new Error(`za malo scenariuszy ${kind}`);
      const sc = kind === 'flee-atk' ? fleeAtkCase(variant) : kind === 'flee-def' ? fleeDefCase(variant)
        : kind === 'surround' ? surroundCase(variant) : m19Case(kind === 'm19-surround');
      const e = activate(structuredClone(sc));
      if (!e.trace.includes('flee')) continue;
      if (kind.startsWith('m19') && (e.steps.length === 0 || e.steps[0].row !== sc.atk[0].r + 2)) {
        throw new Error(`${kind}: pin nie wykonal kroku dr=+2 (${JSON.stringify(e.steps)})`);
      }
      cases.push(finalizeFlee(sc, e, `tags-rest-${label}-${kind}-${got}`, kind));
      got += 1;
    }
  }
  return cases;
}

const fleeStats = (cases) => {
  const byBranch = {};
  const byKind = {};
  for (const c of cases) {
    byBranch[c.expect.branch] = (byBranch[c.expect.branch] ?? 0) + 1;
    byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
  }
  return {
    cases: cases.length,
    byBranch,
    byKind,
    multiStep: cases.filter((c) => c.expect.steps.length >= 2).length,
    left: cases.filter((c) => c.expect.leaves.length > 0).length,
    shaken: cases.filter((c) => c.expect.shaken.length > 0).length,
    cascadeRout: cases.filter((c) => c.expect.routs.length > (c.kind === 'surround' || c.kind === 'm19-surround' ? 1 : 0)).length,
    stuck: cases.filter((c) => c.expect.branch === 'flee-stuck').length,
    onWallDef: cases.filter((c) => c.kind === 'flee-def' && c.def[c.acting.idx].onWall).length,
    diagonalIntoThreat: cases.filter((c) => c.kind.startsWith('m19')).length,
  };
};

const outDirFlee = join(here, 'p6_k5loop_tags_rest_vectors');
mkdirSync(outDirFlee, { recursive: true });
const writeFlee = (file, cases, seed) => {
  const stats = fleeStats(cases);
  console.error(file, JSON.stringify(stats));
  writeFileSync(join(outDirFlee, file), JSON.stringify({ pin: PIN, seed, pinSha256: PIN_SHA256, stats, cases }, nanJsonFlee) + '\n');
};

writeFlee('vectors_siege.json', genFlee('base', { 'flee-atk': 220, 'flee-def': 220, surround: 140, m19: 40, 'm19-surround': 40 }, null), SEED);
rnd = mulberry32(SEED + 1);
writeFlee('vectors_siege_nan.json', genFlee('nan', { 'flee-atk': 60, 'flee-def': 60, surround: 40 }, 'movenan'), SEED + 1);
rnd = mulberry32(SEED + 2);
writeFlee('vectors_siege_edge.json', genFlee('edge', { 'flee-atk': 80, 'flee-def': 80, surround: 40 }, 'edge'), SEED + 2);
