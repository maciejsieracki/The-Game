// P6 SIEGE K5LOOP-SIEGE-ATK-A (dispatch R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1, T2a, Operator r1): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs + siege_tactics_atk.rs): ATAKUJACY przy murze
// (`siegeWallCol >= 0`, `ru.side === 'atk'`) w `_activateUnit` (`battleScene.ts:6048-6299`):
//   - `_trySiegeTowerClimb` (`:8056-8084`, wejscie na korone od wiezy, pierwszy wylom, `occByKey`, `moveLeft = 0`),
//   - `_siegeInfantryToTowerStep` (`:8087-8101`, czekanie albo marsz `_siegeWalkTo` pod wieze),
//   - `_siegeRamTowerStep` (`:8022-8054`, taran: atak bramy / marsz BFS z `prefRow` / `_advanceToward`; wieza: dopisanie
//     wiersza, marsz BFS z callbackiem `arrive`, `_advanceToward` z `arrive`),
//   - `_advanceToward` (`:7892-7916`, katapulta poza zasiegiem muru `:6214-6216` i fallback taranu/wiezy),
//   - `_siegeWalkTo` (`:8006-8019`) z `_bfsFirstStep` (`:7973-8003`) i `_doMove` (`:8685-8776`, bramka
//     `_siegeMoveRefused` `:7963`, koszt `_moveCostForUnit` `:7436`, brod, `_updateFacing` z nowego pola).
// Pozostale galezi atakujacego przy murze (doktryna, cios, strzelec, jazda, falanga, krok, odwrot, atak bramy, ostrzal
// muru, ucieczka) sa ATRAPAMI-ZNACZNIKAMI: generator zapisuje, ktora metoda pinu zostala wywolana, a Rust ma dla niej
// jawny tag (`oblezenie`, `atak-bramy`, `atak-muru`, `ucieczka-oblezenie`).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_siege_atk_a_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_siege_atk_a_vectors/{vectors.json,vectors_nan.json}. Ziarno 7207.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show), straznik SHA-256 calosci wycinkow.
// STUBY (bez logiki gry albo wejscie adaptera): `_applyTerrainRange` (zasieg = wejscie), `isSiegeUnit`/`isSiegeTower`/
// `_isRam`/`_isCatapult` = flagi `bu.__siege/__tower/__ram/__cata` (adapter, KLASY), `_siegeMachineRange(ru)` =
// `bu.__machRange` (adapter), `_startRout` = blad (scenariusze bez routu), `toCombatUnit`/`terrainDefenseMultiplier` =
// mnoznik `bu.__tdm` (jak siege_def), atrapy renderu (`cellToWorld`, `tileTopY`, `easeOut`, `lerp`, `dirYaw`).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SCENE = 'gra/src/battle/battleScene.ts';
const COMBAT = 'gra/src/game/combat.ts';
const FORT = 'gra/src/game/city-fortification.ts';
const PARAMS = 'gra/data/combat-params.json';
const TERRAIN = 'gra/data/terrain-combat.json';
const SEED = 7207;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = { [SCENE]: gitShow(SCENE).split('\n'), [COMBAT]: gitShow(COMBAT).split('\n'), [FORT]: gitShow(FORT).split('\n') };
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

const TOP = [
  [315, 320, 'export const enum Dir {'],
  [326, 331, 'const DIR_DELTA'],
  [337, 337, 'const DIRS4'],
  [661, 662, 'const BF_COLS'],
  [983, 983, 'const BROD_RUCH_MULT'],
  [1010, 1013, 'const MOVE_STEP_MS'],
  [1142, 1143, 'const MORALE_SURROUND_HIT'],
  [1161, 1161, 'const FALLBACK_TILES'],
  [1457, 1459, 'function canShoot('],
  [1797, 1797, 'function cellKey('],
  [1897, 1899, 'function isFordTile('],
  [1917, 1919, 'function manhattan('],
  [1956, 1960, 'function desiredHitForDirection('],
];
expectLine(SCENE, 1011, 'const STEP_GAP_MS');
expectLine(SCENE, 1143, 'const MORALE_TERRAIN_RESIST');
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
  [6537, 'private _advanceCoord('],
  [7041, 'private _rangedTargetInRange('],
  [7436, 'private _moveCostForUnit('],
  [7446, 'private _passableForUnit('],
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
  [8291, 'private _enemiesOf('],
  [8296, 'private _nearestEnemy('],
  [8334, 'private _updateFacing('],
  [8361, 'private _meleeBlockedByWall('],
  [8373, 'private _targetInRange('],
  [8685, 'private _doMove('],
  [9783, 'private _checkRout('],
  [17586, 'private _ensureGroupMeta('],
  [17612, 'private _getEffectiveDoctrine('],
  [17621, 'private _isUnitDoctrineAuto('],
];
for (const [a, , head] of TOP) expectLine(SCENE, a, head);
for (const [a, head] of TOP_FN) expectLine(SCENE, a, head);
for (const [a, head] of COMBAT_FN) expectLine(COMBAT, a, head);
for (const [a, head] of METHODS) expectLine(SCENE, a, head);
const ENDS = {
  6048: 6299, 7892: 7916, 7924: 7937, 7939: 7943, 7951: 7960, 7963: 7970, 7973: 8003, 8006: 8019, 8022: 8053,
  8056: 8084, 8087: 8101, 8685: 8776,
};
for (const [a, e] of Object.entries(ENDS)) {
  const got = methodEnd(Number(a));
  if (got !== e) throw new Error(`koniec metody ${a}: ${got} != ${e}`);
}
expectLine(FORT, 76, 'export function meleeBlockedByWall(');
expectLine(FORT, 96, 'export function attackerWallEntryIsBreach(');
const fortParts = [L(FORT, 76, fnEnd(FORT, 76)), L(FORT, 96, fnEnd(FORT, 96))];

const parts = [
  ...TOP.map(([a, b]) => L(SCENE, a, b)),
  ...TOP_FN.map(([a]) => L(SCENE, a, fnEnd(SCENE, a))),
  ...COMBAT_FN.map(([a]) => L(COMBAT, a, fnEnd(COMBAT, a))),
  ...METHODS.map(([a]) => L(SCENE, a, methodEnd(a))),
  ...fortParts,
];
const PIN_SHA256 = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
console.error(`sha256 wycinkow pinu = ${PIN_SHA256}`);
const EXPECTED_SHA256 = 'c3ec239034bcf0351fc4da09ce073e2e727e9e56805e878a2d54a03642b87325';
if (EXPECTED_SHA256 !== PIN_SHA256) throw new Error(`SHA wycinkow pinu zmieniony: ${PIN_SHA256}`);

const stripExport = (t) => t.replace(/^export /gm, '');
const priv = (t) => t.replace(/^(\s*)private /, '$1');
const methodText = (a) => priv(L(SCENE, a, methodEnd(a)));
const rename = (t, from, to) => {
  if (!t.includes(from)) throw new Error(`brak ${from}`);
  return t.replace(from, to);
};

const classSrc = [
  `const BROD = ${JSON.stringify(params.brod)};`,
  ...TOP.map(([a, b]) => stripExport(L(SCENE, a, b))),
  ...TOP_FN.map(([a]) => stripExport(L(SCENE, a, fnEnd(SCENE, a)))),
  ...COMBAT_FN.map(([a]) => stripExport(L(COMBAT, a, fnEnd(COMBAT, a)))),
  ...fortParts.map(stripExport),
  'const BTerrain = { Ford: "Ford" };',
  'const HPBAR_Y = 0;',
  'function cellToWorld(c, r) { return { x: c, z: r }; }',
  'function tileTopY() { return 0; }',
  'function easeOut(p) { return p; }',
  'function lerp(a, b, t) { return a + (b - a) * t; }',
  'function dirYaw() { return 0; }',
  'function isSiegeUnit(bu) { return !!bu.__siege; }',
  'function isSiegeTower(bu) { return !!bu.__tower; }',
  'function toCombatUnit(bu) { return { rola: bu.__tdm }; }',
  'function terrainDefenseMultiplier(_terr, rola) { return rola; }',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1;',
  '    this.siegeGateCol = -1; this.siegeGateRow = -1; this.gateOpen = false; this.wallTileHp = new Map(); this.siegeWallTilesInit = 0;',
  '    this.towerAtWallRows = new Set(); this.siegeTowers = []; this.towerRange = 0;',
  '    this.wallEverBreached = false; this.occByKey = new Map(); this._groupMeta = new Map(); this._autoBatchPlanning = null;',
  '    this._autoBattleSuspended = false; this.busy = false; this.vNow = 0; this.__q = []; this.__trace = []; this.__inMove = 0;',
  '    this.__steps = []; this.__facing = []; this.__marker = null; this.__climb = null; this.terrainMap = null; this.terrainData = [];',
  '    this.log = []; }',
  '  _now() { return this.vNow; }',
  '  _raf(cb) { this.__q.push({ kind: "raf", cb }); }',
  '  _schedule(ms, cb) { this.__q.push({ kind: "sched", ms, cb }); }',
  '  _applyTerrainRange(ru) { this.__trace.push("terrainRange"); }',
  '  _isPlayerSide(side) { return false; }',
  '  _performPlayerOrder() { throw new Error("tryb reczny poza zakresem"); }',
  '  _updateMoraleBar() {}',
  '  _startRout() { throw new Error("rout poza scenariuszami"); }',
  '  __mark(m, extra) { if (this.__marker) throw new Error("drugi znacznik " + m); this.__marker = { kind: m, ...(extra ?? {}) }; this.__trace.push(m); }',
  '  _executeGroupDoctrineStep(ru, meta, done) { this.__mark("doctrine"); done(); return true; }',
  '  _fleeStep(ru, done) { this.__mark("flee"); done(); }',
  '  _doAttack(ru, e, done) { const list = e.side === "atk" ? this.atk : this.def; this.__mark("attack", { target: list.indexOf(e) }); done(); }',
  '  _attackWallTile(ru, row, done) { this.__mark("attackWallTile", { row }); done(); }',
  '  _attackGate(ru, done) { this.__mark("attackGate"); done(); }',
  '  _rangedAction(ru, done) { this.__mark("rangedAction"); done(); }',
  '  _cavalryAction(ru, done) { this.__mark("cavalryAction"); done(); }',
  '  _phalanxAction(ru, done) { this.__mark("phalanxAction"); done(); }',
  '  _advanceStep(ru, done) { this.__mark("advanceStep"); done(); }',
  '  _fallBackStep(ru, done) { this.__mark("fallBackStep"); done(); }',
  // `_effectiveMetaForUnit` (`:17633-17655`): `_activateUnit` czyta z niego wylacznie `meta.doctrine` (`:6096`), rowne
  // `_getEffectiveDoctrine(ru)` (`:17640`); punkt zbiorki (`_forwardCol`) czyta tylko krok doktryny (atrapa-znacznik).
  // Scenariusze bez `groupId` (brak skutku `_ensureGroupMeta`).
  '  _effectiveMetaForUnit(ru) { if (ru.groupId) throw new Error("groupId poza scenariuszami"); return { doctrine: this._getEffectiveDoctrine(ru) }; }',
  '  _isRam(bu) { return !!bu.__ram; }',
  '  _isCatapult(bu) { return !!bu.__cata; }',
  '  _siegeMachineRange(ru) { return ru.bu.__machRange; }',
  '  _trySiegeTowerClimb(ru, done) { const q0 = ru.q, r0 = ru.r; const ok = this._trySiegeTowerClimbPin(ru, done); this.__trace.push("towerClimb:" + ok); if (ok) this.__climb = { from: [q0, r0], to: [ru.q, ru.r], t: this.vNow }; return ok; }',
  '  _siegeInfantryToTowerStep(ru, done) { this.__trace.push("infToTower"); const ok = this._siegeInfantryToTowerStepPin(ru, done); this.__trace.push("infToTower:" + ok); return ok; }',
  '  _siegeRamTowerStep(ru, done) { this.__trace.push("ramTower"); const ok = this._siegeRamTowerStepPin(ru, done); this.__trace.push("ramTower:" + ok); return ok; }',
  '  _advanceToward(ru, c, r, done) { this.__trace.push("advanceToward:" + c + "," + r); return this._advanceTowardPin(ru, c, r, done); }',
  '  _updateFacing(ru) { if (!this.__inMove) this.__trace.push("facing"); const f0 = ru.facing; this._updateFacingPin(ru); if (ru.facing !== f0) this.__facing.push({ t: this.vNow, dir: ru.facing }); }',
  '  _doMove(ru, c, r, done) { const t = this.vNow; this.__inMove += 1; try { this._doMovePin(ru, c, r, done); } finally { this.__inMove -= 1; } this.__steps.push({ col: ru.q, row: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, t }); }',
  ...METHODS.map(([a]) => {
    let t = methodText(a);
    if (a === 8334) t = rename(t, '_updateFacing(', '_updateFacingPin(');
    if (a === 8685) t = rename(t, '_doMove(', '_doMovePin(');
    if (a === 8056) t = rename(t, '_trySiegeTowerClimb(ru: RuntimeBattleUnit', '_trySiegeTowerClimbPin(ru: RuntimeBattleUnit');
    if (a === 8087) t = rename(t, '_siegeInfantryToTowerStep(ru: RuntimeBattleUnit', '_siegeInfantryToTowerStepPin(ru: RuntimeBattleUnit');
    if (a === 8022) t = rename(t, '_siegeRamTowerStep(ru: RuntimeBattleUnit', '_siegeRamTowerStepPin(ru: RuntimeBattleUnit');
    if (a === 7892) t = rename(t, '_advanceToward(ru: RuntimeBattleUnit', '_advanceTowardPin(ru: RuntimeBattleUnit');
    return t;
  }),
  '}',
  'const BattleScene = Harness;',
  'module.exports.Harness = Harness;',
].join('\n');

const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020, preserveConstEnums: true },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(mod, mod.exports, createRequire(import.meta.url));
const { Harness } = mod.exports;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const N_KIND = { climb: 220, inf: 260, ram: 220, tower: 220, cata: 160, other: 160 };

function baseUnit(side, idx, q, r) {
  return {
    side, idx, q, r, facing: ri(0, 3), moveLeft: pick([1, 2, 3, 4, 6, 8]), dead: false, fadingOut: false, routed: false,
    unitDoctrine: null, groupId: null, hp: pick([20, 40, 60, 80, 100]), mounted: false, primaryRanged: false,
    rangedBase: false, phalanx: false, morale: 100, fleeMorale: 0, neverRout: false, tdm: 1, onWall: false,
    siege: false, ram: false, tower: false, cata: false, machRange: 1, range: 1, surroundApplied: true,
  };
}

// Teren: mur w kolumnie W (nieprzechodni poza brama otwarta: wiersze gLo/gHi), kafle specjalne (koszt, brod,
// nieprzechodnie). Ta sama regula w tescie Rust (`MoveTerrain` z wektora).
function makeTerrain(W, gateRow, gateOpen, r0, nanCost) {
  const tiles = [];
  const seen = new Set();
  const n = ri(0, 14);
  for (let i = 0; i < n; i++) {
    const c = ri(Math.max(0, W - 14), W - 1);
    const r = Math.max(0, Math.min(155, r0 + ri(-8, 8)));
    const k = c + ',' + r;
    if (seen.has(k)) continue;
    seen.add(k);
    const x = rnd();
    if (x < 0.3) tiles.push({ c, r, pass: false, cost: 1, ford: false });
    else if (x < 0.55) tiles.push({ c, r, pass: true, cost: 1, ford: true });
    else if (x < 0.6 && nanCost) tiles.push({ c, r, pass: true, cost: NaN, ford: false });
    else tiles.push({ c, r, pass: true, cost: pick([2, 3, 0.5, 120]), ford: false });
  }
  return { wallCol: W, gateRow, gateOpen, tiles };
}

function terrainMapOf(t) {
  const special = new Map(t.tiles.map((x) => [x.c + ',' + x.r, x]));
  const wallBlocked = (c, r) => c === t.wallCol && !(t.gateOpen && (r === t.gateRow - 1 || r === t.gateRow));
  return {
    passable: (c, r) => !wallBlocked(c, r) && (special.get(c + ',' + r)?.pass ?? true),
    moveCost: (c, r) => special.get(c + ',' + r)?.cost ?? 1,
    at: (c, r) => (special.get(c + ',' + r)?.ford ? 'Ford' : 'Plain'),
    combatTerrainName: () => 'Plaskie (rownina/laka)',
  };
}

function makeCase(kind, nan) {
  const W = ri(18, 50);
  const gateRow = ri(10, 140);
  const gateOpen = kind === 'ram' ? rnd() < 0.12 : rnd() < 0.2;
  const r0 = kind === 'ram' ? Math.max(2, Math.min(150, gateRow + ri(-10, 10))) : ri(6, 148);
  const used = new Set();
  const free = (q, r) => q >= 0 && q <= 67 && r >= 0 && r <= 155 && !used.has(q + ',' + r);
  const take = (q, r) => { used.add(q + ',' + r); return [q, r]; };
  const placeIn = (q0, q1, rc, span) => {
    for (let t = 0; t < 400; t++) {
      const q = ri(q0, q1);
      const r = Math.max(0, Math.min(155, rc + ri(-span, span)));
      if (free(q, r)) return take(q, r);
    }
    return null;
  };
  const wallRows = [];
  const blockers = [];
  for (let r = Math.max(0, r0 - 30); r <= Math.min(155, r0 + 30); r++) {
    if (r === gateRow - 1 || r === gateRow) continue;
    if (rnd() < 0.9) wallRows.push([r, pick([40, 40, 25, 10, 0])]);
  }
  const towerRows = [];
  let me;
  const wallBase = W - 1;
  if (kind === 'climb') {
    const at = rnd() < 0.8 ? [wallBase, r0] : [wallBase - ri(1, 2), r0];
    if (!free(...at)) return null;
    me = baseUnit('atk', 0, ...take(...at));
    for (const dr of [-1, 0, 1]) if (rnd() < 0.45) towerRows.push(r0 + dr);
    if (rnd() < 0.15) towerRows.push(r0 + ri(3, 8));
    const x = rnd();
    if (x < 0.08) me.mounted = true;
    else if (x < 0.14) { me.siege = true; }
    else if (x < 0.2) me.onWall = true;
  } else if (kind === 'inf') {
    // Czesc scenariuszy: jednostka na polu celu marszu pod wieze. Uwaga: w kolejnosci `_activateUnit` wejscie na mur
    // (`:6179`) poprzedza marsz (`:6180`), a warunki celu (`:8093-8096`) implikuja `canClimb` i wolna korone tego
    // samego wiersza (`:8060-8066`), wiec galaz `goal(ru.q, ru.r) -> done()` (`:8097`) jest w AUTO nieosiagalna; te
    // scenariusze koncza sie wejsciem na mur (pokrycie `climb`).
    const waiting = rnd() < 0.2;
    const at = waiting
      ? (rnd() < 0.5 ? (free(wallBase - 1, r0) ? take(wallBase - 1, r0) : null) : (free(wallBase, r0) ? take(wallBase, r0) : null))
      : placeIn(Math.max(0, W - 12), wallBase, r0, 6);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    if (waiting) towerRows.push(me.q === wallBase ? r0 + pick([-1, 1]) : r0);
    const nT = ri(waiting ? 0 : 1, 3);
    for (let i = 0; i < nT; i++) towerRows.push(Math.max(0, Math.min(155, r0 + ri(-8, 8))));
    const x = rnd();
    if (x < 0.1) { me.primaryRanged = true; me.rangedBase = true; me.ammoLeft = pick([3, 'Infinity']); me.range = 3; }
    else if (x < 0.16) { me.primaryRanged = true; me.rangedBase = true; me.ammoLeft = 0; }
    else if (x < 0.22) me.mounted = true;
    else if (x < 0.3) me.phalanx = true;
  } else if (kind === 'ram' || kind === 'tower') {
    const near = rnd() < (kind === 'ram' ? 0.3 : 0.2);
    const at = near
      ? placeIn(Math.max(0, W - 2), wallBase, gateRow, 2)
      : placeIn(Math.max(0, W - 16), wallBase, r0, 8);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    me.siege = true;
    if (kind === 'ram') me.ram = true; else me.tower = true;
    me.moveLeft = pick([1, 1, 2, 3, 0, 0.5]);
    if (kind === 'tower' && rnd() < 0.3) for (let i = 0; i < ri(1, 3); i++) towerRows.push(r0 + ri(-6, 6));
    // BFS bez celu: wieza bez kafli muru (cel `wallTileHp.has(r)` nieosiagalny) albo taran z zajetymi polami przed brama;
    // wtedy `_advanceToward` (`:8035`, `:8049`).
    if (kind === 'tower' && rnd() < 0.15) wallRows.length = 0;
    if (kind === 'ram' && rnd() < 0.2) {
      for (const gr of [gateRow - 1, gateRow]) if (free(wallBase, gr)) take(wallBase, gr) && blockers.push([wallBase, gr]);
    }
  } else if (kind === 'cata') {
    const at = placeIn(Math.max(0, W - 16), wallBase, r0, 8);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    me.siege = true; me.cata = true; me.rangedBase = true; me.ammoLeft = pick(['Infinity', 3]);
    me.range = pick([4, 6]); me.machRange = pick([1, 3, 6, 8]);
    me.moveLeft = pick([1, 2, 0, 0.5]);
  } else {
    const at = placeIn(Math.max(0, W - 6), W, r0, 6);
    if (!at) return null;
    me = baseUnit('atk', 0, ...at);
    if (me.q === W) me.onWall = true;
    const x = rnd();
    if (x < 0.2) me.mounted = true;
    else if (x < 0.35) { me.rangedBase = true; me.ammoLeft = 'Infinity'; me.range = pick([2, 4]); }
    else if (x < 0.45) { me.rangedBase = true; me.primaryRanged = true; me.ammoLeft = 0; }
    else if (x < 0.55) me.phalanx = true;
  }
  // Doktryna: `manual` (bramka `_isUnitDoctrineAuto` = false, galezie wiez osiagalne) albo domyslna (krok doktryny).
  if (kind === 'other') me.unitDoctrine = pick([null, null, 'manual', 'steady']);
  else me.unitDoctrine = rnd() < 0.88 ? 'manual' : null;
  // Okrazenie: czesc scenariuszy z nieuzytym `surroundApplied` (cios morale bez routu: morale 100, prog 0).
  me.surroundApplied = rnd() < 0.8;
  if (nan === 'moveLeft-nan') me.moveLeft = NaN;
  const atk = [me];
  const def = [];
  // Obroncy na koronie (q = W) i w miescie (q > W), czasem martwi/uciekajacy.
  const nDef = ri(1, 6);
  for (let i = 0; i < nDef; i++) {
    const x = rnd();
    const at = x < 0.6 ? placeIn(W, W, r0, 6) : placeIn(W + 1, Math.min(67, W + 4), r0, 6);
    if (!at) continue;
    const u = baseUnit('def', def.length, ...at);
    if (u.q === W) u.onWall = true;
    const y = rnd();
    if (y < 0.06) u.dead = true; else if (y < 0.1) u.routed = true;
    def.push(u);
  }
  // Sojusznicy atakujacego (przeszkody marszu) i wrog przed murem.
  const nAtk = ri(0, 5);
  for (let i = 0; i < nAtk; i++) {
    const at = placeIn(Math.max(0, W - 8), wallBase, r0, 6);
    if (!at) continue;
    atk.push(baseUnit('atk', atk.length, ...at));
  }
  if (rnd() < 0.25) {
    const at = placeIn(Math.max(0, W - 6), wallBase, r0, 4);
    if (at) def.push(baseUnit('def', def.length, ...at));
  }
  for (const [q, r] of blockers) atk.push(baseUnit('atk', atk.length, q, r));
  // Okrazenie: wrogowie na sasiednich polach.
  if (!me.surroundApplied && rnd() < 0.5) {
    for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (free(me.q + dq, me.r + dr) && me.q + dq !== W) def.push(baseUnit('def', def.length, ...take(me.q + dq, me.r + dr)));
    }
  }
  if (def.length === 0) return null;
  const terrain = makeTerrain(W, gateRow, gateOpen, r0, nan === 'cost-nan');
  // Koszt NaN na polu sasiednim (wschod, w strone muru): `_advanceToward` go NIE odrzuca (`=== Infinity`), BFS tak.
  if (nan === 'cost-nan' && rnd() < 0.6) {
    terrain.tiles = terrain.tiles.filter((t) => !(t.c === me.q + 1 && t.r === me.r));
    terrain.tiles.push({ c: me.q + 1, r: me.r, pass: true, cost: NaN, ford: false });
  }
  for (const u of [...atk, ...def]) {
    if (terrain.tiles.some((t) => t.c === u.q && t.r === u.r && !t.pass)) return null;
  }
  return {
    acting: { side: 'atk', idx: 0 }, atk, def, groupMeta: [], wallCol: W, gateCol: W, gateRow, gateOpen,
    wallTiles: wallRows, wallTilesInit: wallRows.length + 2, towerRows: [...new Set(towerRows)].filter((r) => r >= 0 && r <= 155),
    wallEverBreached: rnd() < 0.2, terrain,
  };
}

function newHarness(sc) {
  const h = new Harness();
  h.terrainData = terrainData;
  h.siegeWallCol = sc.wallCol;
  h.siegeGateCol = sc.gateCol;
  h.siegeGateRow = sc.gateRow;
  h.gateOpen = sc.gateOpen;
  for (const [r, hp] of sc.wallTiles) h.wallTileHp.set(r, hp);
  h.siegeWallTilesInit = sc.wallTilesInit;
  for (const r of sc.towerRows) h.towerAtWallRows.add(r);
  h.wallEverBreached = sc.wallEverBreached;
  h.terrainMap = terrainMapOf(sc.terrain);
  for (const [id, doctrine, autoPlay] of sc.groupMeta) h._groupMeta.set(id, { doctrine, autoPlay });
  const mk = (u) => ({
    bu: {
      id: u.side + u.idx, nazwa: u.side + u.idx, hp: u.hp ?? 100, maxHp: 100, __tdm: u.tdm ?? 1,
      __cata: !!u.cata, __siege: !!u.siege, __ram: !!u.ram, __tower: !!u.tower, __machRange: u.machRange ?? 1,
    },
    side: u.side, q: u.q, r: u.r,
    facing: u.facing, moveLeft: u.moveLeft, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.dead,
    surroundApplied: !!u.surroundApplied, neverRout: u.neverRout ?? false, morale: u.morale ?? 100,
    fleeMorale: u.fleeMorale ?? 0, range: u.range ?? 1, rangeBase: u.rangedBase ? (u.range ?? 1) : 0, onWallWalkway: !!u.onWall,
    primaryRanged: u.primaryRanged ?? false, rangedBase: u.rangedBase ?? false, mounted: u.mounted ?? false,
    phalanx: u.phalanx ?? false, shootingEnabled: true,
    ammoLeft: u.ammoLeft === 'Infinity' ? Infinity : (u.ammoLeft ?? 0),
    dryCol: -1, heldAfterFallback: false,
    playerOrder: { type: 'none' }, unitDoctrine: u.unitDoctrine ?? null, groupId: u.groupId ?? null,
    group: { position: { set() {} }, rotation: { y: 0 }, visible: true }, hpBarGroup: { position: { set() {} }, visible: true },
  });
  h.atk = sc.atk.map(mk);
  h.def = sc.def.map(mk);
  for (const ru of [...h.atk, ...h.def]) {
    if (!ru.removed && !ru.routed) h.occByKey.set(ru.q + ',' + ru.r, ru);
  }
  return h;
}

function drain(h) {
  let guard = 0;
  while (h.__q.length > 0) {
    if (++guard > 20000) throw new Error('petla kolejki');
    const job = h.__q.shift();
    if (job.kind === 'raf') h.vNow += 240; else h.vNow += job.ms;
    job.cb();
  }
}

// Jedna aktywacja `_activateUnit` atakujacego od chwili 0.
function runAtk(sc) {
  const h = newHarness(sc);
  const ru = h.atk[sc.acting.idx];
  const doctrineAuto = h._isUnitDoctrineAuto(ru);
  let doneAt = null;
  h._activateUnit(ru, () => { if (doneAt !== null) throw new Error('done() dwa razy'); doneAt = h.vNow; });
  drain(h);
  if (doneAt === null) throw new Error('done() nie wywolane');
  const tagOf = (u) => u.side + (u.side === 'atk' ? h.atk : h.def).indexOf(u);
  const occ = [...h.occByKey.entries()].map(([k, u]) => {
    const [c, r] = k.split(',').map(Number);
    return [c, r, tagOf(u)];
  }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return {
    doctrineAuto,
    trace: h.__trace,
    marker: h.__marker,
    climb: h.__climb,
    steps: h.__steps,
    facing: h.__facing,
    duration: doneAt,
    final: { q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, onWall: ru.onWallWalkway, morale: ru.morale },
    towerRows: [...h.towerAtWallRows].sort((a, b) => a - b),
    wallEverBreached: h.wallEverBreached,
    log: h.log,
    occ,
  };
}

// Galaz pinu (licznik pokrycia; nazwa = to, co sie wydarzylo).
function branchOf(sc, e) {
  if (e.marker) return 'tag-' + e.marker.kind;
  if (e.climb) return 'climb';
  const tr = e.trace;
  const me = sc.atk[sc.acting.idx];
  if (tr.includes('infToTower:true')) return e.steps.length > 0 ? 'inf-walk' : 'inf-walk-idle';
  if (tr.includes('ramTower:true')) {
    if (tr.some((t) => t.startsWith('advanceToward'))) return e.steps.length > 0 ? 'ramtower-toward-step' : 'ramtower-toward-idle';
    // Wieza na `wallBase` albo dalej (`:8040`): dopisanie wiersza bez marszu.
    if (me.tower && me.q >= sc.wallCol - 1) return 'tower-atwall';
    return e.steps.length > 0 ? 'ramtower-walk' : 'ramtower-walk-idle';
  }
  if (tr.some((t) => t.startsWith('advanceToward'))) return e.steps.length > 0 ? 'cata-toward-step' : 'cata-toward-idle';
  return 'hold';
}

const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : (v === Infinity ? 'Infinity' : (v === -Infinity ? '-Infinity' : v)));

function gen(nan, counts) {
  const cases = [];
  let tries = 0;
  for (const [kind, n] of Object.entries(counts)) {
    let got = 0;
    while (got < n) {
      if (++tries > 2000000) throw new Error(`za malo scenariuszy ${kind}`);
      const sc = makeCase(kind, nan);
      if (!sc) continue;
      let expect;
      try { expect = runAtk(sc); } catch (err) {
        if (String(err.message).includes('rout poza scenariuszami')) continue;
        throw err;
      }
      if (expect.marker && expect.marker.kind === 'flee') continue;
      expect.branch = branchOf(sc, expect);
      cases.push({ ...sc, name: `siege-atk-${nan ?? 'base'}-${kind}-${got}`, kind, expect });
      got += 1;
    }
  }
  return cases;
}

const cases = gen(null, N_KIND);
const byBranch = {};
for (const c of cases) byBranch[c.expect.branch] = (byBranch[c.expect.branch] ?? 0) + 1;
const stats = {
  cases: cases.length,
  byBranch,
  breachLogged: cases.filter((c) => c.expect.log.length > 0).length,
  surroundHit: cases.filter((c) => c.expect.final.morale !== 100).length,
  facingChanged: cases.filter((c) => c.expect.facing.length > 0).length,
  fordSteps: cases.filter((c) => c.expect.steps.some((s) => c.terrain.tiles.some((t) => t.ford && t.c === s.col && t.r === s.row))).length,
  multiStep: cases.filter((c) => c.expect.steps.length >= 2).length,
};
console.error(JSON.stringify(stats));
const outDir = join(here, 'p6_k5loop_siege_atk_a_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, stats, cases }, nanJson) + '\n');
console.error(`zapisano ${cases.length} wektorow`);

// Lekcja NaN: `moveLeft = NaN` (`ru.moveLeft <= 0` falszywe: marsz nie konczy sie z braku ruchu, tylko u celu albo bez
// kroku BFS; `Math.max(0, NaN - koszt)` = NaN) i koszt terenu NaN (`_passableForUnit` = `isFinite` falszywe: BFS omija;
// `_advanceToward` odrzuca tylko `=== Infinity`, wiec NaN JEST kandydatem; `_doMove`: `Math.max(1, Math.min(NaN, 99))` =
// NaN, `moveLeft` = NaN).
const nanCases = [
  ...gen('moveLeft-nan', { inf: 60, ram: 60, tower: 60, cata: 40 }),
  ...gen('cost-nan', { inf: 60, ram: 60, tower: 60, cata: 60 }),
];
const nanStats = {
  cases: nanCases.length,
  moveLeftNan: nanCases.filter((c) => c.name.includes('moveLeft-nan')).length,
  moveLeftNanMultiStep: nanCases.filter((c) => c.name.includes('moveLeft-nan') && c.expect.steps.length >= 2).length,
  costNanStep: nanCases.filter((c) => c.expect.steps.some((s) => c.terrain.tiles.some((t) => Number.isNaN(t.cost) && t.c === s.col && t.r === s.row))).length,
};
console.error(JSON.stringify(nanStats));
writeFileSync(join(outDir, 'vectors_nan.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, stats: nanStats, cases: nanCases }, nanJson) + '\n');
console.error(`zapisano ${nanCases.length} wektorow NaN`);
