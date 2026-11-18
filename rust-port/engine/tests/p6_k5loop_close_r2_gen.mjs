// P6 SIEGE K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, DODATEK r2, Operator): generator wektorow dla
// `ProdBody` (rust-port/engine/src/domain/siege_tactics_loop.rs): C-FLANK w `_advanceStep` (`:8204-8235`) oraz
// `_cavalryAction` (`:6372-6412`) z `_cavDirectedManeuverStep` / `_cavManeuverStep` / `_bestChargeStepKey`, kazdy krok
// przez `_doMove` (koszt terenu jazdy, `_updateFacing`).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_close_r2_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_close_vectors/vectors_r2.json. Ziarno 5209. Plik r1 (`vectors.json`) NIE jest
// zmieniany: rodzina `flank-r1` wykonuje te same 120 scenariuszy `flank` z r1 PELNYM tekstem pinu (bez wartownika).
//
// ORAKUL = WYKONANIE TEKSTU PINU (07d2fbd72, git show). Wycinki (straznik: naglowek + koniec + SHA-256 calosci) jak w r1
// plus: FORD_AI_AVOID_PENALTY (998), `_targetPriorities` (2328-2332, inicjalizator pola), _cavPriority (6313),
// _cavalryTarget (6326), _cavAdjacentNonSpear (6351), _cavalryAction (6372), _cavDirectedManeuverStep (6426),
// _cavManeuverStep (6457), _firstStepTowardDirectedAttack (8509), _unitBattleClass (17486), _prefsForUnit (17496),
// _priorityScore (17512), _pickTargetByPriority (17523), _bestChargeStepKey (17736);
// gra/src/game/combat.ts: normTerrain (620), findTerrainEntry (706), cavalryTerrainMultiplier (756);
// dane: gra/data/terrain-combat.json (kolumna "Kawaleria/Rydwan").
//
// STUBY jak w r1, poza: `_cavalryAction`, `_pickTargetByPriority`, `_firstStepTowardDirectedAttack`,
// `cavalryTerrainMultiplier` (teraz tekst pinu). `_doAttack(ru, e, done)`: zapis celu (indeks w liscie strony
// przeciwnej) i `done()` -- sam cios (`_doMeleeAttack`, RNG) jest juz pokryty wektorami `p6_siege_tactics_loop_body_pin`
// i `p6_k5loop_outcome_pin`; tu sprawdzany jest WYBOR celu i brak ruchu przed ciosem. Okrazenie (`_updateMoraleBar`)
// nadal poza zakresem: scenariusz, ktory je wywoluje, jest odrzucany (komunikat stuba), nie liczony.
// Instrumentacja: `_cavalryAction` dopisuje slad `cavalryAction`; `_doMove` zapisuje krok (pozycja, moveLeft, facing,
// czas startu animacji = vNow przed `_raf`, jak `t0` w `_doMove` `:8746`).

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
const SEED = 5209;
const N_FLANK = 220;
const N_CAV = 320;

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
  [983, 983, 'const BROD_RUCH_MULT'],
  [998, 998, 'const FORD_AI_AVOID_PENALTY'],
  [1010, 1011, 'const MOVE_STEP_MS'],
  [1142, 1143, 'const MORALE_SURROUND_HIT'],
  [1161, 1161, 'const FALLBACK_TILES'],
  [1797, 1797, 'function cellKey('],
  [1897, 1899, 'function isFordTile('],
  [1917, 1919, 'function manhattan('],
  [1956, 1960, 'function desiredHitForDirection('],
];
expectLine(SCENE, 1011, 'const STEP_GAP_MS');
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
  [8487, 'private _canStrikeTargetFrom('],
  [8509, 'private _firstStepTowardDirectedAttack('],
  [8565, 'private _firstStepAlongPathToAttack('],
  [8685, 'private _doMove('],
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
const EXPECTED_SHA256 = 'c5a5bc11db1471b17b61da5ce6a73951e34ee8790711386a179ea97bf1153619';
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
  'function canShoot() { return false; }',
  'function isSiegeUnit() { return false; }',
  'function meleeBlockedByWall() { throw new Error("mur poza zakresem"); }',
  'function toCombatUnit() { throw new Error("_checkRout poza zakresem (brak okrazenia)"); }',
  'function terrainDefenseMultiplier() { throw new Error("_checkRout poza zakresem"); }',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1;',
  '    this.wallEverBreached = false; this.occByKey = new Map(); this._groupMeta = new Map(); this._autoBatchPlanning = null;',
  '    this._autoBattleSuspended = false; this.busy = false; this.vNow = 0; this.__q = []; this.__trace = []; this.__inMove = 0;',
  '    this.__advStarted = false; this.__steps = []; this.__facing = []; this.__attack = null; this.terrainMap = null; this.terrainData = [];',
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
  '  _phalanxAction() { throw new Error("falanga poza zakresem"); }',
  '  _rangedAction() { throw new Error("strzelec poza zakresem"); }',
  '  _fallBackStep() { throw new Error("odwrot poza zakresem"); }',
  '  _rangedTargetInRange() { throw new Error("strzelec poza zakresem"); }',
  '  _advanceCoord() { throw new Error("primaryRanged poza zakresem"); }',
  '  _pickAdjacentTargetByPriority() { throw new Error("atak z _advanceStep: galaz nieosiagalna"); }',
  // `_doAttack`: zapis celu (indeks w liscie strony przeciwnej) i czasu; cios poza tym generatorem (patrz naglowek).
  '  _doAttack(ru, e, done) { if (this.__attack) throw new Error("drugi atak"); const list = e.side === "atk" ? this.atk : this.def; this.__attack = { target: list.indexOf(e), t: this.vNow }; done(); }',
  '  _cavalryAction(ru, done) { this.__trace.push("cavalryAction"); return this._cavalryActionPin(ru, done); }',
  '  _updateFacing(ru) { if (!this.__inMove) this.__trace.push("facing"); const f0 = ru.facing; this._updateFacingPin(ru); if (ru.facing !== f0) this.__facing.push({ t: this.vNow, dir: ru.facing }); }',
  '  _advanceStep(ru, done) { if (!this.__advStarted) { this.__advStarted = true; this.__trace.push("advanceStep"); } return this._advanceStepPin(ru, done); }',
  '  _doMove(ru, c, r, done) { const t = this.vNow; this.__inMove += 1; try { this._doMovePin(ru, c, r, done); } finally { this.__inMove -= 1; } this.__steps.push({ col: ru.q, row: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, t }); }',
  ...METHODS.map(([a]) => {
    let t = methodText(a);
    if (a === 8334) t = rename(t, '_updateFacing(', '_updateFacingPin(');
    if (a === 8198) t = rename(t, '_advanceStep(ru: RuntimeBattleUnit', '_advanceStepPin(ru: RuntimeBattleUnit');
    if (a === 8685) t = rename(t, '_doMove(', '_doMovePin(');
    if (a === 6372) t = rename(t, '_cavalryAction(', '_cavalryActionPin(');
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
  const tight = rnd() < (opts.cav ? 0.75 : 0.6);
  const c0 = ri(15, 50);
  const r0 = ri(65, 90);
  const span = tight ? (opts.cav ? 4 : 5) : 12;
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
  if (opts.cav) {
    me.mounted = true;
    me.attackDirection = pick(['front', 'front', 'bok', 'tyl']);
    if (me.moveLeft <= 0 && rnd() < 0.8) me.moveLeft = pick([2, 3, 4, 5]);
  } else {
    me.attackDirection = pick(['bok', 'tyl']);
    if (enemies.some((e) => live(e) && Math.abs(e.q - me.q) + Math.abs(e.r - me.r) <= 1)) return null;
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
    const name = opts.cav ? pick(TERRAIN_NAMES) : DEFAULT_TERRAIN;
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
    surroundApplied: false, neverRout: false, morale: 100, fleeMorale: 0, range: 1, onWallWalkway: false,
    primaryRanged: u.primaryRanged ?? false, rangedBase: u.rangedBase ?? false, mounted: u.mounted ?? false,
    antiCavSpear: u.antiCavSpear ?? false, phalanx: false, shootingEnabled: true,
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
    final: { q: ru.q, r: ru.r, moveLeft: ru.moveLeft, facing: ru.facing, lastAutoMoveFrom: ru.lastAutoMoveFrom ?? null },
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
// Rodzina `flank-r1`: 120 scenariuszy `flank` z r1 (te same wejscia), oczekiwanie z PELNEGO tekstu pinu.
const r1 = JSON.parse(readFileSync(join(here, 'p6_k5loop_close_vectors', 'vectors.json'), 'utf8'));
for (const c of r1.cases.filter((x) => x.kind === 'flank')) {
  const { expect: _old, ...sc } = c;
  const expect = runCase(sc);
  cases.push({ ...sc, name: sc.name.replace('close-flank-', 'close-flank-r1-'), kind: 'flank-r1', expect });
}
// Rodzina `flank-full`: piechota 'bok'/'tyl', wrogowie z klasami (priorytety `_pickTargetByPriority`).
let k = 0;
let nFlank = 0;
while (nFlank < N_FLANK) {
  if (++tries > 100000) throw new Error('za malo scenariuszy flank');
  const sc = makeCase(k++, { cav: false });
  if (!sc) continue;
  const expect = tryRun(sc);
  if (!expect) continue;
  cases.push({ ...sc, name: `close-flank-full-${nFlank}`, kind: 'flank-full', expect });
  nFlank += 1;
}
// Rodzina `cavalry`: jednostka konna, wrogowie z klasami (wlocznicy, jazda, strzelcy), teren walki z mnoznikiem jazdy.
let nCav = 0;
while (nCav < N_CAV) {
  if (++tries > 200000) throw new Error('za malo scenariuszy cavalry');
  const sc = makeCase(k++, { cav: true });
  if (!sc) continue;
  const expect = tryRun(sc);
  if (!expect) continue;
  cases.push({ ...sc, name: `close-cavalry-${nCav}`, kind: 'cavalry', expect });
  nCav += 1;
}
// Rodziny celowane (mutanty, ktore przezyly losowe rodziny): dopisane NA KONCU (rodziny wyzej bez zmian).
// `cavalry-spear`: jedyny sasiad = wlocznik, brak kroku manewru (moveLeft 0 albo pozostale pola zablokowane)
//   -> wymuszony cios we wlocznika (`:6397-6401`).
// `cavalry-adj`: dwoch sasiadow nie-wlocznikow roznych klas/HP/facing -> wybor `_cavAdjacentNonSpear` (`:6351-6370`).
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const N_SPEAR = 40;
const N_ADJ = 60;
const liveU = (u) => !u.dead && !u.fadingOut && !u.routed;
function targeted(kind) {
  for (;;) {
    if (++tries > 400000) throw new Error(`za malo scenariuszy ${kind}`);
    const sc = makeCase(k++, { cav: true });
    if (!sc) continue;
    const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
    const en = sc.acting.side === 'atk' ? sc.def : sc.atk;
    const me = own[sc.acting.idx];
    const occupied = new Set([...sc.atk, ...sc.def].filter((u) => !u.dead && !u.routed).map((u) => u.q + ',' + u.r));
    const free = DIRS.map(([dc, dr]) => [me.q + dc, me.r + dr]).filter(([c, r]) => !occupied.has(c + ',' + r));
    const liveEn = en.filter(liveU);
    const need = kind === 'cavalry-spear' ? 1 : 2;
    if (free.length < need || liveEn.length < need) continue;
    // Wrogowie dotad sasiadujacy odsuwani nie sa: scenariusz z innym sasiadem odrzucany.
    if (liveEn.some((e) => Math.abs(e.q - me.q) + Math.abs(e.r - me.r) <= 1)) continue;
    const picked = liveEn.slice(0, need);
    picked.forEach((e, j) => {
      const [c, r] = free[j];
      occupied.delete(e.q + ',' + e.r);
      e.q = c; e.r = r;
      occupied.add(c + ',' + r);
    });
    if (kind === 'cavalry-spear') {
      const s = picked[0];
      s.antiCavSpear = true; s.mounted = false; s.primaryRanged = false; s.rangedBase = false;
      me.moveLeft = pick([0, 0, 2, 3]);
      if (me.moveLeft > 0) {
        // Pozostale pola sasiednie nieprzejezdne (manewr i szarza bez kroku).
        const blocked = new Set(DIRS.map(([dc, dr]) => (me.q + dc) + ',' + (me.r + dr)));
        sc.tiles = sc.tiles.filter(([c, r]) => !blocked.has(c + ',' + r));
        for (const [dc, dr] of DIRS) {
          const c = me.q + dc; const r = me.r + dr;
          if (c === s.q && r === s.r) continue;
          sc.tiles.push([c, r, false, 1, false, 'Gory']);
        }
      }
    } else {
      for (const e of picked) {
        e.antiCavSpear = false;
        const c = rnd();
        e.mounted = c < 0.35; e.primaryRanged = !e.mounted && c < 0.65; e.rangedBase = e.primaryRanged;
        e.hp = pick([40, 60, 80, 100]);
      }
    }
    const expect = tryRun(sc);
    if (!expect) continue;
    if (!expect.attack) throw new Error(`${kind}: brak ciosu`);
    return { ...sc, kind, expect };
  }
}
for (let i = 0; i < N_SPEAR; i++) cases.push({ ...targeted('cavalry-spear'), name: `close-cavalry-spear-${i}` });
for (let i = 0; i < N_ADJ; i++) cases.push({ ...targeted('cavalry-adj'), name: `close-cavalry-adj-${i}` });
// Mnoznik jazdy per teren (tekst pinu `cavalryTerrainMultiplier` na danych pinu).
const cavMult = Object.fromEntries(TERRAIN_NAMES.map((n) => [n, cavMultOf(n)]));
const isFlank = (c) => c.kind === 'flank-r1' || c.kind === 'flank-full';
const stats = {
  flankR1: cases.filter((c) => c.kind === 'flank-r1').length,
  flankFull: cases.filter((c) => c.kind === 'flank-full').length,
  flankMoved: cases.filter((c) => isFlank(c) && c.expect.steps.length > 0).length,
  flankAlready: cases.filter((c) => isFlank(c) && c.expect.steps.length === 0 && c.expect.duration === 0).length,
  cavalry: cases.filter((c) => c.kind === 'cavalry').length,
  cavAttack: cases.filter((c) => c.kind === 'cavalry' && c.expect.attack).length,
  cavMoved: cases.filter((c) => c.kind === 'cavalry' && c.expect.steps.length > 0).length,
  cavMulti: cases.filter((c) => c.kind === 'cavalry' && c.expect.steps.length >= 2).length,
  cavHold: cases.filter((c) => c.kind === 'cavalry' && !c.expect.attack && c.expect.steps.length === 0).length,
  cavDirected: cases.filter((c) => c.kind === 'cavalry' && c.acting && c.expect.steps.length > 0
    && (c.acting.side === 'atk' ? c.atk : c.def)[c.acting.idx].attackDirection !== 'front').length,
  facingAfterMove: cases.filter((c) => c.expect.facing.some((f) => f.t > 0)).length,
};
console.error(JSON.stringify(stats));
const outDir = join(here, 'p6_k5loop_close_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors_r2.json'), JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats, cases }) + '\n');
console.error(`zapisano ${cases.length} wektorow`);

// Obrona r2 (zarzut Z1): rodzina `cavalry-nan` w OSOBNYM pliku `vectors_r2_nan.json` (plik `vectors_r2.json` bajt w bajt
// bez zmian, zapisany wyzej przed ta sekcja; bez dodatkowych wywolan `rnd`). Wejscia = kopie WSZYSTKICH scenariuszy
// `cavalry` z `ru.moveLeft = NaN` jednostki dzialajacej; oczekiwanie z tekstu pinu. Pin w callbacku `_doMove`
// (`battleScene.ts:6439`, `:6496`) kontynuuje manewr tylko przy `ru.moveLeft > 0`, a szarza (`:6403-6409`) wymaga
// `ru.moveLeft > 0`, wiec dla NaN jazda wykonuje co najwyzej jeden krok manewru. NaN w JSON = napis "NaN".
const nanCases = [];
for (const c of cases.filter((x) => x.kind === 'cavalry')) {
  const { expect: _old, name, kind: _k, ...sc0 } = c;
  const sc = JSON.parse(JSON.stringify(sc0));
  const own = sc.acting.side === 'atk' ? sc.atk : sc.def;
  own[sc.acting.idx].moveLeft = NaN;
  const expect = runCase(sc);
  if (expect.steps.length > 1) throw new Error(`${name}: NaN, pin wykonal ${expect.steps.length} krokow`);
  nanCases.push({ ...sc, name: name.replace('close-cavalry-', 'close-cavalry-nan-'), kind: 'cavalry-nan', expect });
}
const nanStats = {
  cavalryNan: nanCases.length,
  nanMoved: nanCases.filter((c) => c.expect.steps.length === 1).length,
  nanAttack: nanCases.filter((c) => c.expect.attack).length,
  nanHold: nanCases.filter((c) => !c.expect.attack && c.expect.steps.length === 0).length,
};
console.error(JSON.stringify(nanStats));
const nanJson = (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);
writeFileSync(
  join(outDir, 'vectors_r2_nan.json'),
  JSON.stringify({ pin: PIN, seed: SEED, pinSha256: PIN_SHA256, cavMult, stats: nanStats, cases: nanCases }, nanJson) + '\n',
);
console.error(`zapisano ${nanCases.length} wektorow NaN`);
