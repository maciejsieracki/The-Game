// P6 SIEGE K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, runda 1, Operator): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs): galaz `ActivateEvent::AdvanceStep` (`_advanceStep`)
// wykonywana w ciele oraz `_updateFacing` po kazdym kroku `_doMove`.
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_close_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_close_vectors/vectors.json. Ziarno 5207.
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show, bez checkoutu). Wycinki (straznik: naglowek + koniec + SHA-256
// calosci) sa transpilowane przez TypeScript i WYKONYWANE bez wstawek w logice:
//   battleScene.ts: const enum Dir (315-320), DIR_DELTA/DIRS4 (326-331, 337), facingToward/facingFromTo/oppositeDir/
//   relativeHit (347+, 359+, 370+, 385+), BF_COLS/BF_ROWS (661-662), BROD_RUCH_MULT (983), MOVE_STEP_MS/STEP_GAP_MS
//   (1010-1011), MORALE_SURROUND_HIT/MORALE_TERRAIN_RESIST (1142-1143), FALLBACK_TILES (1161), cellKey (1797),
//   isFordTile (1897-1899), manhattan (1917-1919), desiredHitForDirection (1956-1960),
//   _activateUnit (6048-6299), _advanceDir (6743), _forwardCol (6748), _moveCostForUnit (7436-7443),
//   _passableForUnit (7446-7448), _compactAttackAllowsStep (8139-8172), _shouldAvoidAutoBacktrack (8191-8196),
//   _advanceStep (8198-8285), _enemiesOf (8291-8294), _nearestEnemy (8296), _updateFacing (8334-8341),
//   _meleeBlockedByWall (8361), _targetInRange (8373), _stepToward (8413-8427), _canAttackFrom (8436-8444),
//   _makeCanAttackFromTest (8454), _canStrikeTargetFrom, _firstStepAlongPathToAttack (8565-8622), _doMove (8685-8776),
//   _checkRout (9783), _ensureGroupMeta (17586), _getEffectiveDoctrine (17612), _isUnitDoctrineAuto (17621),
//   _effectiveMetaForUnit (17633);
//   formationRules.ts: compactLineAllowsAdvance.
//
// STUBY (poza zakresem ciala albo render; jawnie):
//   render/animacja: cellToWorld, tileTopY, easeOut, lerp, dirYaw, HPBAR_Y, group/hpBarGroup (bez wplywu na stan).
//   zegar: `_now()` = vNow; `_raf(cb)` i `_schedule(ms, cb)` = kolejka FIFO; `_raf` przesuwa vNow o MOVE_STEP_MS
//     (krok konczy sie przy p = 1, nominalnie jak w ciele Rust), `_schedule` o `ms`.
//   klasy: canShoot = false, isSiegeUnit = false (zakres ciala: strazniki `strzelec` i `oblezenie`).
//   _applyTerrainRange, _trySiegeTowerClimb, _siegeInfantryToTowerStep: slad + `false` (pin bez muru: `return false`).
//   _isPlayerSide = false (AUTO). Galezie, ktore scenariusze wykluczaja z konstrukcji (rzucaja, gdy osiagniete):
//   _performPlayerOrder, _executeGroupDoctrineStep, _fleeStep, _updateMoraleBar, _startRout, _cavalryAction,
//   _phalanxAction, _rangedAction, _fallBackStep, _doAttack, _pickAdjacentTargetByPriority, _pickTargetByPriority,
//   _firstStepTowardDirectedAttack, meleeBlockedByWall, cavalryTerrainMultiplier, toCombatUnit, terrainDefenseMultiplier.
//   Instrumentacja (nie logika): `_updateFacing` dopisuje slad `facing` tylko z aktywacji (nie z `_doMove`) i zapisuje
//   zmiane facing z czasem; `_doMove` zapisuje stan po czesci synchronicznej; `_advanceStep` slad `advanceStep` raz.
//
// Zakres scenariuszy: AUTO bez muru, jednostka piesza (nie mounted/phalanx/strzelec), `_isUnitDoctrineAuto` = false
// (doktryna 'manual' albo grupa z autoPlay=false / doktryna 'manual'), brak zywego wroga w zasiegu ciosu na starcie
// (wtedy `_targetInRange` = null i `_activateUnit` wybiera `_advanceStep`).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SCENE = 'gra/src/battle/battleScene.ts';
const FORM = 'gra/src/battle/formationRules.ts';
const PARAMS = 'gra/data/combat-params.json';
const SEED = 5207;
const N_CASES = 420;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (p) => execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = { [SCENE]: gitShow(SCENE).split('\n'), [FORM]: gitShow(FORM).split('\n') };
const params = JSON.parse(gitShow(PARAMS));
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

// ---- wycinki pinu z naglowkami (straznik linii) ----
const TOP = [
  [315, 320, 'export const enum Dir {'],
  [326, 331, 'const DIR_DELTA'],
  [337, 337, 'const DIRS4'],
  [661, 662, 'const BF_COLS'],
  [983, 983, 'const BROD_RUCH_MULT'],
  [1010, 1011, 'const MOVE_STEP_MS'],
  [1142, 1143, 'const MORALE_SURROUND_HIT'],
  [1161, 1161, 'const FALLBACK_TILES'],
  [1797, 1797, 'function cellKey('],
  [1897, 1899, 'function isFordTile('],
  [1917, 1919, 'function manhattan('],
  [1956, 1960, 'function desiredHitForDirection('],
];
expectLine(SCENE, 1011, 'const STEP_GAP_MS');
const TOP_FN = [
  [347, 'export function facingToward('],
  [359, 'export function facingFromTo('],
  [370, 'export function oppositeDir('],
  [385, 'export function relativeHit('],
];
const METHODS = [
  [6048, 'private _activateUnit(ru: RuntimeBattleUnit, done: () => void): void {'],
  [6743, 'private _advanceDir('],
  [6748, 'private _forwardCol('],
  [7436, 'private _moveCostForUnit('],
  [7446, 'private _passableForUnit('],
  [8139, 'private _compactAttackAllowsStep('],
  [8191, 'private _shouldAvoidAutoBacktrack('],
  [8198, 'private _advanceStep('],
  [8291, 'private _enemiesOf('],
  [8296, 'private _nearestEnemy('],
  [8334, 'private _updateFacing('],
  [8361, 'private _meleeBlockedByWall('],
  [8373, 'private _targetInRange('],
  [8413, 'private _stepToward('],
  [8436, 'private _canAttackFrom('],
  [8454, 'private _makeCanAttackFromTest('],
  [findLine(SCENE, '  private _canStrikeTargetFrom('), 'private _canStrikeTargetFrom('],
  [8565, 'private _firstStepAlongPathToAttack('],
  [8685, 'private _doMove('],
  [9783, 'private _checkRout('],
  [17586, 'private _ensureGroupMeta('],
  [17612, 'private _getEffectiveDoctrine('],
  [17621, 'private _isUnitDoctrineAuto('],
  [17633, 'private _effectiveMetaForUnit('],
];
for (const [a, , head] of TOP) expectLine(SCENE, a, head);
for (const [a, head] of TOP_FN) expectLine(SCENE, a, head);
for (const [a, head] of METHODS) expectLine(SCENE, a, head);
if (methodEnd(6048) !== 6299) throw new Error('koniec _activateUnit != 6299');
if (methodEnd(8198) !== 8285) throw new Error('koniec _advanceStep != 8285');
if (methodEnd(8685) !== 8776) throw new Error('koniec _doMove != 8776');
const formStart = findLine(FORM, 'export function compactLineAllowsAdvance(');

const parts = [
  ...TOP.map(([a, b]) => L(SCENE, a, b)),
  ...TOP_FN.map(([a]) => L(SCENE, a, fnEnd(SCENE, a))),
  L(FORM, formStart, fnEnd(FORM, formStart)),
  ...METHODS.map(([a]) => L(SCENE, a, methodEnd(a))),
];
const PIN_SHA256 = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
console.error(`sha256 wycinkow pinu = ${PIN_SHA256}`);
const EXPECTED_SHA256 = 'bdc91c510d5aa71824eb536ba08b982a390dc83bd3435ce59255f7a85ca5559c';
if (EXPECTED_SHA256 !== PIN_SHA256) throw new Error('SHA wycinkow pinu zmieniony');

// ---- skladanie klasy Harness ----
const stripExport = (t) => t.replace(/^export /gm, '');
const priv = (t) => t.replace(/^(\s*)private /, '$1');
const methodText = (a) => priv(L(SCENE, a, methodEnd(a)));
const rename = (t, from, to) => {
  if (!t.includes(from)) throw new Error(`brak ${from}`);
  return t.replace(from, to);
};

const classSrc = [
  // Dane: BROD z combat-params.json pinu (linia 982 czyta combatParamsData.brod).
  `const BROD = ${JSON.stringify(params.brod)};`,
  ...TOP.map(([a, b]) => stripExport(L(SCENE, a, b))),
  ...TOP_FN.map(([a]) => stripExport(L(SCENE, a, fnEnd(SCENE, a)))),
  stripExport(L(FORM, formStart, fnEnd(FORM, formStart))),
  // Stuby (patrz naglowek).
  'const BTerrain = { Ford: "Ford" };',
  'const HPBAR_Y = 0;',
  'function cellToWorld(c, r) { return { x: c, z: r }; }',
  'function tileTopY() { return 0; }',
  'function easeOut(p) { return p; }',
  'function lerp(a, b, t) { return a + (b - a) * t; }',
  'function dirYaw() { return 0; }',
  'function canShoot() { return false; }',
  'function isSiegeUnit() { return false; }',
  'function meleeBlockedByWall() { throw new Error("mur poza zakresem"); }',
  'function cavalryTerrainMultiplier() { throw new Error("kawaleria poza zakresem"); }',
  'function toCombatUnit() { throw new Error("_checkRout poza zakresem (brak okrazenia)"); }',
  'function terrainDefenseMultiplier() { throw new Error("_checkRout poza zakresem"); }',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1;',
  '    this.wallEverBreached = false; this.occByKey = new Map(); this._groupMeta = new Map(); this._autoBatchPlanning = null;',
  '    this._autoBattleSuspended = false; this.busy = false; this.vNow = 0; this.__q = []; this.__trace = []; this.__inMove = 0;',
  '    this.__advStarted = false; this.__steps = []; this.__facing = []; this.terrainMap = null; this.terrainData = {}; }',
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
  '  _cavalryAction() { throw new Error("kawaleria poza zakresem"); }',
  '  _phalanxAction() { throw new Error("falanga poza zakresem"); }',
  '  _rangedAction() { throw new Error("strzelec poza zakresem"); }',
  '  _fallBackStep() { throw new Error("odwrot poza zakresem"); }',
  '  _rangedTargetInRange() { throw new Error("strzelec poza zakresem"); }',
  '  _advanceCoord() { throw new Error("primaryRanged poza zakresem"); }',
  '  _doAttack() { throw new Error("atak z _advanceStep: galaz nieosiagalna z _activateUnit"); }',
  '  _pickAdjacentTargetByPriority() { throw new Error("atak z _advanceStep: galaz nieosiagalna"); }',
  '  _pickTargetByPriority() { throw new Error("C-FLANK poza zakresem (attackDirection front)"); }',
  '  _firstStepTowardDirectedAttack() { throw new Error("C-FLANK poza zakresem"); }',
  // Instrumentacja (nie logika): slad + wywolanie tekstu pinu.
  '  _updateFacing(ru) { if (!this.__inMove) this.__trace.push("facing"); const f0 = ru.facing; this._updateFacingPin(ru); if (ru.facing !== f0) this.__facing.push({ t: this.vNow, dir: ru.facing }); }',
  '  _advanceStep(ru, done) { if (!this.__advStarted) { this.__advStarted = true; this.__trace.push("advanceStep"); } return this._advanceStepPin(ru, done); }',
  '  _doMove(ru, c, r, done) { this.__inMove += 1; try { this._doMovePin(ru, c, r, done); } finally { this.__inMove -= 1; } this.__steps.push({ col: ru.q, row: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, t: this.vNow }); }',
  ...METHODS.map(([a]) => {
    let t = methodText(a);
    if (a === 8334) t = rename(t, '_updateFacing(', '_updateFacingPin(');
    if (a === 8198) t = rename(t, '_advanceStep(ru: RuntimeBattleUnit', '_advanceStepPin(ru: RuntimeBattleUnit');
    if (a === 8685) t = rename(t, '_doMove(', '_doMovePin(');
    return t;
  }),
  '}',
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

// ---- generator scenariuszy ----
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
const MOVE_LEFTS = [0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 1.5, 2.5];
const DOCTRINES = ['steady', 'aggressive', 'defensive', 'skirmish', 'manual'];

function makeCase(k) {
  const actSide = rnd() < 0.5 ? 'atk' : 'def';
  const enemySide = actSide === 'atk' ? 'def' : 'atk';
  const nOwn = ri(1, 5);
  const nEnemy = ri(1, 5);
  // Plotne skupisko (odleglosci 2..12) albo rozproszenie po szerokim oknie.
  const tight = rnd() < 0.6;
  const c0 = ri(15, 50);
  const r0 = ri(65, 90);
  const span = tight ? 5 : 14;
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
  const mkUnit = (side, i, acting) => {
    const [q, r] = place();
    const u = {
      side, idx: i, q, r, facing: ri(0, 3), moveLeft: pick(MOVE_LEFTS), dead: false, fadingOut: false, routed: false,
      unitDoctrine: null, groupId: null, formationRank: rnd() < 0.35 ? null : ri(0, 3),
    };
    if (!acting) {
      const x = rnd();
      if (x < 0.1) u.dead = true;
      else if (x < 0.2) u.routed = true;
      else if (x < 0.25) u.fadingOut = true;
    }
    return u;
  };
  const own = [];
  const actIdx = ri(0, nOwn - 1);
  for (let i = 0; i < nOwn; i++) own.push(mkUnit(actSide, i, i === actIdx));
  const enemies = [];
  for (let i = 0; i < nEnemy; i++) enemies.push(mkUnit(enemySide, i, false));
  // Doktryna jednostki dzialajacej: `_isUnitDoctrineAuto` = false.
  const me = own[actIdx];
  const mode = ri(0, 3);
  if (mode === 0) {
    me.unitDoctrine = 'manual';
  } else if (mode === 1) {
    me.groupId = 'g1';
    groupMeta.push(['g1', 'steady', false]);
  } else if (mode === 2) {
    me.groupId = 'g2';
    groupMeta.push(['g2', pick(DOCTRINES), false]);
  } else {
    me.groupId = 'g3';
    groupMeta.push(['g3', 'manual', rnd() < 0.5]);
  }
  if (rnd() < 0.25) me.moveLeft = pick([3, 4, 6, 8]);
  // Brak zywego wroga w zasiegu ciosu na starcie (dd 0/1): inaczej `_targetInRange` wybiera cios.
  const live = (u) => !u.dead && !u.fadingOut && !u.routed;
  if (enemies.some((e) => live(e) && Math.abs(e.q - me.q) + Math.abs(e.r - me.r) <= 1)) return null;
  // Teren: losowe kafelki w oknie; poza oknem rownina koszt 1.
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
    if (x < 0.3) tiles.push([c, r, false, 1, false]);
    else if (x < 0.65) tiles.push([c, r, true, pick([2, 3]), false]);
    else if (x < 0.85) tiles.push([c, r, true, pick([1, 2, 3]), true]);
    else tiles.push([c, r, true, pick([1, 99, 150, 0.5]), false]);
  }
  const atk = actSide === 'atk' ? own : enemies;
  const def = actSide === 'atk' ? enemies : own;
  return { name: `close-${k}`, acting: { side: actSide, idx: actIdx }, atk, def, groupMeta, tiles };
}

function runCase(sc) {
  const h = new Harness();
  const tmap = new Map(sc.tiles.map(([c, r, passable, cost, ford]) => [c + ',' + r, { passable, cost, ford }]));
  const tile = (c, r) => tmap.get(c + ',' + r) ?? { passable: true, cost: 1, ford: false };
  h.terrainMap = {
    passable: (c, r) => tile(c, r).passable,
    moveCost: (c, r) => tile(c, r).cost,
    at: (c, r) => (tile(c, r).ford ? 'Ford' : 'Plain'),
    combatTerrainName: () => { throw new Error('combatTerrainName poza zakresem (piechota)'); },
  };
  for (const [id, doctrine, autoPlay] of sc.groupMeta) h._groupMeta.set(id, { doctrine, autoPlay });
  const mk = (u) => ({
    bu: { id: u.side + u.idx, nazwa: u.side + u.idx }, side: u.side, q: u.q, r: u.r, facing: u.facing,
    moveLeft: u.moveLeft, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.dead,
    surroundApplied: false, neverRout: false, morale: 100, fleeMorale: 0, range: 1, onWallWalkway: false,
    primaryRanged: false, rangedBase: false, mounted: false, phalanx: false, shootingEnabled: true,
    playerOrder: { type: 'none' }, unitDoctrine: u.unitDoctrine ?? null, groupId: u.groupId ?? null,
    ...(u.formationRank === null ? {} : { formationRank: u.formationRank }),
    group: { position: { set() {} }, rotation: { y: 0 } }, hpBarGroup: { position: { set() {} } },
  });
  h.atk = sc.atk.map(mk);
  h.def = sc.def.map(mk);
  for (const ru of [...h.atk, ...h.def]) {
    // Pin: pole zwalniaja `_startRout` (:9812) i `_removeUnitFromScene` (:9915).
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
    duration: doneAt,
    final: { q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, lastAutoMoveFrom: ru.lastAutoMoveFrom ?? null },
    occ,
  };
}

const cases = [];
let k = 0;
let tries = 0;
while (cases.length < N_CASES) {
  if (++tries > 20000) throw new Error('za malo scenariuszy');
  const sc = makeCase(k++);
  if (!sc) continue;
  const expect = runCase(sc);
  cases.push({ ...sc, expect });
}
const stats = {
  moved: cases.filter((c) => c.expect.steps.length > 0).length,
  multiStep: cases.filter((c) => c.expect.steps.length >= 2).length,
  facingAfterMove: cases.filter((c) => c.expect.facing.some((f) => f.t > 0)).length,
  noMove: cases.filter((c) => c.expect.steps.length === 0).length,
  ford: cases.filter((c) => c.tiles.some((t) => t[4])).length,
};
console.error(JSON.stringify(stats));
const outDir = join(here, 'p6_k5loop_close_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, stats, cases }) + '\n');
console.error(`zapisano ${cases.length} wektorow`);
