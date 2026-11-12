// P6 SIEGE-TAKTYKA K5h: generator wektorow `_activateUnit` przez WYKONANIE tekstu pinu (battleScene.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_activate_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wykonywane doslownie: _activateUnit 6048-6299, _checkRout 9783-9797, _enemiesOf 8291-8294 (po usunieciu typow TS).
// Jedyna ingerencja w tekst: wstawienie znacznikow `__b('tag');` (sledzenie galezi) w miejscach wskazanych dokladnie
// raz (asercja); znaczniki nie zmieniaja przeplywu sterowania. Straznik SHA-256 jest liczony na tekscie PRZED wstawkami.
// Stuby (efekty / delegaty poza portem maszyny): _fleeStep, _applyTerrainRange, _performPlayerOrder, _isPlayerSide,
//   _isUnitDoctrineAuto, _effectiveMetaForUnit, _executeGroupDoctrineStep, _updateMoraleBar, _updateFacing,
//   _trySiegeTowerClimb, _siegeInfantryToTowerStep, _siegeRamTowerStep, _doAttack, _attackWallTile, _advanceToward,
//   _rangedAction, _fallBackStep, _cavalryAction, _phalanxAction, _advanceStep, _rangedTargetInRange, _targetInRange,
//   _advanceCoord, _nearestEnemy, _isCatapult, _isRam, _siegeMachineRange, _startRout; globalne canShoot/isSiegeUnit/isSiegeTower.
// Wynik: p6_siege_tactics_activate_vectors/vectors.json (sekwencje aktywacji jednej jednostki ze stanem przenoszonym).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const FRAGMENT_SHA256 = '3be85ac2fba725bf618b61c817c891c1d994d2b7df3615d01552c6c2774ddb00';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n');
const LINE = (n) => pinLines[n - 1];
const L = (a, b) => pinLines.slice(a - 1, b).join('\n');
function expectLine(n, re) { if (!re.test(LINE(n))) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${LINE(n)}`); }
function methodEnd(start) {
  for (let n = start + 1; n < start + 400; n++) if (/^  \}$/.test(LINE(n))) return n;
  throw new Error(`brak konca metody od ${start}`);
}
expectLine(6048, /^  private _activateUnit\(ru: RuntimeBattleUnit, done: \(\) => void\): void \{$/);
expectLine(9783, /^  private _checkRout\(ru: RuntimeBattleUnit\): void \{$/);
expectLine(8291, /^  private _enemiesOf\(ru: RuntimeBattleUnit\): RuntimeBattleUnit\[\] \{$/);
expectLine(1142, /^const MORALE_SURROUND_HIT\s+= 10;/);
expectLine(1143, /^const MORALE_TERRAIN_RESIST\s+= 5;/);
expectLine(1161, /^const FALLBACK_TILES = 3;$/);
expectLine(1917, /^function manhattan\(ac: number, ar: number, bc: number, br: number\): number \{$/);
if (methodEnd(6048) !== 6299) throw new Error('koniec _activateUnit != 6299');
const parts = [L(1142, 1143), L(1161, 1161), L(1917, 1919), L(6048, 6299), L(9783, methodEnd(9783)), L(8291, 8294)];
const digest = createHash('sha256').update(parts.join('\n---\n')).digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && digest !== FRAGMENT_SHA256) throw new Error(`fragmenty pinu: ${digest}`);
console.error('fragment sha256', digest);

// --- znaczniki galezi (kazda zamiana dokladnie raz) ---
let act = L(6048, 6299);
function rep(from, to) {
  const n = act.split(from).length - 1;
  if (n !== 1) throw new Error(`zamiana oczekiwana 1x, jest ${n}x: ${from}`);
  act = act.replace(from, () => to);
}
rep('if (this.finished) { done(); return; }', "if (this.finished) { __b('U7.0-finished'); done(); return; }");
rep('if (ru.dead || ru.fadingOut) { done(); return; }', "if (ru.dead || ru.fadingOut) { __b('U7.0-dead'); done(); return; }");
rep('\n    if (ru.routed) { this._fleeStep(ru, done); return; }', "\n    if (ru.routed) { __b('U7.0-flee'); this._fleeStep(ru, done); return; }");
rep('if (this._performPlayerOrder(ru, done)) return;', "if (this._performPlayerOrder(ru, done)) { __b('U7.0-manual'); return; }");
rep('if (this._executeGroupDoctrineStep(ru, meta, done)) return;', "if (this._executeGroupDoctrineStep(ru, meta, done)) { __b('U7.0-doctrine'); return; }");
rep('        ru.surroundApplied = true;', "        __b('U7.0-surround'); ru.surroundApplied = true;");
rep('        if (ru.routed) { this._fleeStep(ru, done); return; }', "        if (ru.routed) { __b('U7.0-surround-flee'); this._fleeStep(ru, done); return; }");
rep('    if (ru.onWallWalkway) {', "    if (ru.onWallWalkway) { __b('U7.1-walkway');");
rep('          tgt = bestCata ?? this._rangedTargetInRange(ru);', "          __b('U7.1-cata'); tgt = bestCata ?? this._rangedTargetInRange(ru);");
rep('\n          tgt = this._rangedTargetInRange(ru);', "\n          __b('U7.1-shoot-std'); tgt = this._rangedTargetInRange(ru);");
rep('ru.range = origRange; // restore before doAttack reads it', "__b('U7.1-shoot-attack'); ru.range = origRange; // restore before doAttack reads it");
rep('        // No target in range (wall range bonus already applied) -> hold.', "        __b('U7.1-shoot-hold');");
rep('      if (adj) { this._doAttack(ru, adj, done); return; }', "      if (adj) { __b('U7.1-melee-attack'); this._doAttack(ru, adj, done); return; }");
rep('      // Nothing to do this turn -> hold position on the wall.', "      __b('U7.1-melee-hold');");
rep('if (this._trySiegeTowerClimb(ru, done)) return;', "if (this._trySiegeTowerClimb(ru, done)) { __b('U7.2-climb'); return; }");
rep('if (this._siegeInfantryToTowerStep(ru, done)) return;', "if (this._siegeInfantryToTowerStep(ru, done)) { __b('U7.2-inf'); return; }");
rep('if (this._siegeRamTowerStep(ru, done)) return;', "if (this._siegeRamTowerStep(ru, done)) { __b('U7.3-ramtower'); return; }");
rep('          this._attackWallTile(ru, bestRow, done);', "          __b('U7.3-cata-fire'); this._attackWallTile(ru, bestRow, done);");
rep('          this._advanceToward(ru, approachCol, bestRow, done);', "          __b('U7.3-cata-advance'); this._advanceToward(ru, approachCol, bestRow, done);");
rep("    if (ru.side === 'def' && this.siegeWallCol >= 0) {\n      if (canShoot(ru)) {", "    if (ru.side === 'def' && this.siegeWallCol >= 0) { __b('U7.4-hold');\n      if (canShoot(ru)) {");
rep('        if (tgt) { this._doAttack(ru, tgt, done); }\n        else { done(); }', "        if (tgt) { __b('U7.4-shoot'); this._doAttack(ru, tgt, done); }\n        else { __b('U7.4-shoot-hold'); done(); }");
rep('        if (adj) { this._doAttack(ru, adj, done); }\n        else { done(); }', "        if (adj) { __b('U7.4-melee'); this._doAttack(ru, adj, done); }\n        else { __b('U7.4-melee-hold'); done(); }");
rep('{ this._rangedAction(ru, done); return; }', "{ __b('U7.5-ranged'); this._rangedAction(ru, done); return; }");
rep('    if (ru.primaryRanged) {', "    if (ru.primaryRanged) { __b('U7.6-primary');");
rep('if (ru.dryCol < 0) ru.dryCol = this._advanceCoord(ru);', "if (ru.dryCol < 0) { __b('U7.6-dry-record'); ru.dryCol = this._advanceCoord(ru); }");
rep('        // An enemy has reached it -> it FIGHTS', "        __b('U7.6-adj-attack');\n        // An enemy has reached it -> it FIGHTS");
rep('        ru.heldAfterFallback = true;', "        __b('U7.6-set-held'); ru.heldAfterFallback = true;");
rep('        // HOLD: no enemy adjacent (handled above) -> stand still this turn.', "        __b('U7.6-hold');");
rep('      this._fallBackStep(ru, done);', "      __b('U7.6-fallback'); this._fallBackStep(ru, done);");
rep('if (ru.mounted) { this._cavalryAction(ru, done); return; }', "if (ru.mounted) { __b('U7.7-cavalry'); this._cavalryAction(ru, done); return; }");
rep('if (ru.phalanx) { this._phalanxAction(ru, done); return; }', "if (ru.phalanx) { __b('U7.8-phalanx'); this._phalanxAction(ru, done); return; }");
rep('    if (target0) {', "    if (target0) { __b('U7.9-attack');");
rep('    this._advanceStep(ru, done);\n  }', "    __b('U7.9-advance'); this._advanceStep(ru, done);\n  }");

const classSrc = [
  L(1142, 1143), L(1161, 1161), L(1917, 1919),
  'let __terrMult = 1;',
  'const terrainDefenseMultiplier = () => __terrMult;',
  'const toCombatUnit = () => ({ rola: "x" });',
  'const canShoot = (ru) => ru.__canShoot;',
  'const isSiegeUnit = (bu) => bu.__siege;',
  'const isSiegeTower = (bu) => bu.__tower;',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1; this.gateOpen = false;',
  '    this.wallTileHp = new Map(); this.terrainMap = { combatTerrainName: () => "t" }; this.armyHungerStatMult = 1; this.goldDeficitStatMult = 1; this.terrainData = {};',
  '    this.__trace = []; this.__s = {}; }',
  '  _fleeStep(ru, done) { this.__trace.push("flee"); }',
  '  _applyTerrainRange(ru) { this.__trace.push("terrainRange"); ru.range = this.__s.rangeAfter; }',
  '  _performPlayerOrder(ru, done) { this.__trace.push("playerOrder"); return this.__s.playerOrder; }',
  '  _isPlayerSide(side) { return this.__s.playerSide; }',
  '  _isUnitDoctrineAuto(ru) { return ru.__doctrineAuto; }',
  '  _effectiveMetaForUnit(ru) { return { doctrine: ru.__doctrineManual ? "manual" : "steady" }; }',
  '  _executeGroupDoctrineStep(ru, meta, done) { this.__trace.push("doctrineStep"); return this.__s.doctrineStep; }',
  '  _updateMoraleBar(ru) { this.__trace.push("moraleBar"); }',
  '  _startRout(ru) { if (ru.routed || ru.dead || ru.fadingOut) return; ru.routed = true; this.__trace.push("startRout"); }',
  '  _updateFacing(ru) { this.__trace.push("facing"); }',
  '  _trySiegeTowerClimb(ru, done) { this.__trace.push("towerClimb"); return this.__s.towerClimb; }',
  '  _siegeInfantryToTowerStep(ru, done) { this.__trace.push("infToTower"); return this.__s.infToTower; }',
  '  _siegeRamTowerStep(ru, done) { this.__trace.push("ramTower"); return this.__s.ramTower; }',
  '  _isCatapult(bu) { return bu.__cata; }',
  '  _isRam(bu) { return bu.__ram; }',
  '  _siegeMachineRange(ru) { return this.__s.machineRange; }',
  '  _doAttack(ru, tgt, done) { this.__trace.push("attack:" + tgt.__i); }',
  '  _attackWallTile(ru, row, done) { this.__trace.push("attackWall:" + row); }',
  '  _advanceToward(ru, col, row, done) { this.__trace.push("advanceToward:" + col + "," + row); }',
  '  _rangedAction(ru, done) { this.__trace.push("rangedAction"); }',
  '  _fallBackStep(ru, done) { this.__trace.push("fallBack"); }',
  '  _cavalryAction(ru, done) { this.__trace.push("cavalry"); }',
  '  _phalanxAction(ru, done) { this.__trace.push("phalanx"); }',
  '  _advanceStep(ru, done) { this.__trace.push("advanceStep"); }',
  '  _rangedTargetInRange(ru) { const i = this.__s.rangedTarget; return i === null ? null : this.__enemies[i]; }',
  '  _targetInRange(ru) { const i = this.__s.targetInRange; return i === null ? null : this.__enemies[i]; }',
  '  _advanceCoord(ru) { return this.__s.advanceCoord; }',
  '  _nearestEnemy(ru) { const i = this.__s.nearest; return i === null ? null : this.__enemies[i]; }',
  act.replace('private _activateUnit', '_activateUnit'),
  L(9783, methodEnd(9783)).replace('private _checkRout', '_checkRout'),
  L(8291, 8294).replace('private _enemiesOf', '_enemiesOf'),
  '}',
  'export const __r = 1;',
].join('\n');
let br = null;
const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' })
  .replace(/export const __r = 1;/, 'return { Harness, setTerr: (v) => { __terrMult = v; } };');
const { Harness, setTerr } = new Function('__b', jsSrc)((t) => br.push(t));

// --- PRNG mulberry32, ziarno 217 ---
function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(217);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const ENC = (x) => (typeof x === 'number' && Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : x);
const DEC = (x) => (x === 'NaN' ? NaN : x === 'Infinity' ? Infinity : x === '-Infinity' ? -Infinity : x);
const wild = (normal) => (chance(0.04) ? pick([NaN, Infinity, -Infinity]) : normal());

function genCase(idx) {
  const atk = chance(0.5);
  const wallCol = chance(0.55) ? int(10, 30) : -1;
  const unit = {
    sideAtk: atk, q: int(0, 40), r: int(0, 20), dead: chance(0.03), fadingOut: chance(0.03), routed: chance(0.06),
    neverRout: chance(0.1), surroundApplied: chance(0.15), morale: wild(() => int(0, 60)), fleeMorale: wild(() => int(5, 40)),
    terrainDefenceMult: wild(() => pick([0.8, 1, 1, 1.5])), range: wild(() => int(1, 8)),
    onWallWalkway: wallCol >= 0 && chance(0.25), primaryRanged: chance(0.3), mounted: chance(0.12), phalanx: chance(0.12),
    shootingDisabled: chance(0.1), dryCol: chance(0.5) ? -1 : int(0, 40), heldAfterFallback: chance(0.15), playerOrderNone: chance(0.6),
    canShoot: chance(0.4), isSiegeUnit: false, isSiegeTower: false, isRam: false, isCatapult: false,
    doctrineAuto: chance(0.5), doctrineManual: chance(0.2),
  };
  if (wallCol >= 0 && chance(0.4)) {
    unit.isSiegeUnit = true;
    const k = pick(['ram', 'cata', 'tower']);
    unit.isRam = k === 'ram'; unit.isCatapult = k === 'cata'; unit.isSiegeTower = k === 'tower';
    if (!atk && k === 'cata' && chance(0.7)) unit.canShoot = true;
  } else if (chance(0.08)) { unit.isCatapult = true; unit.canShoot = chance(0.8); }
  const nEn = int(0, 7);
  const enemies = [];
  for (let i = 0; i < nEn; i++) {
    const near = chance(0.5);
    enemies.push({
      q: near ? unit.q + pick([-1, 0, 1, 2, -2]) : int(0, 40), r: near ? unit.r + pick([-1, 0, 1, 1, -1]) : int(0, 20),
      dead: chance(0.1), fadingOut: chance(0.07), routed: chance(0.1), isCatapult: chance(0.3),
    });
  }
  const wallRows = chance(0.8) ? int(0, 5) : 0;
  const wallTileHp = [];
  const used = new Set();
  for (let i = 0; i < wallRows; i++) { const row = int(0, 20); if (used.has(row)) continue; used.add(row); wallTileHp.push([row, wild(() => pick([0, 5, 20, 40, -3]))]); }
  const scene = { finished: chance(0.03), manualMode: chance(0.2), wallCol, gateOpen: chance(0.3), wallTileHp };
  const mode = pick(['free', 'free', 'free', 'surround', 'dry', 'cata']);
  if (mode === 'surround') {
    unit.dead = false; unit.fadingOut = false; unit.routed = false; unit.neverRout = false; unit.surroundApplied = false;
    unit.morale = pick([5, 10, 15, 30, 60]); scene.finished = false; unit.onWallWalkway = false;
    for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1]]) enemies.push({ q: unit.q + dq, r: unit.r + dr, dead: false, fadingOut: false, routed: false, isCatapult: false });
  } else if (mode === 'cata') {
    unit.sideAtk = true; unit.dead = false; unit.fadingOut = false; unit.routed = false; unit.onWallWalkway = false; unit.surroundApplied = true;
    scene.finished = false; scene.manualMode = false; if (scene.wallCol < 0) scene.wallCol = int(10, 30);
    unit.isSiegeUnit = true; unit.isCatapult = true; unit.isRam = false; unit.isSiegeTower = false; unit.doctrineAuto = false;
    scene.wallTileHp = [[int(0, 20), pick([0, 5, 40])], [int(0, 20), pick([5, 40, 'NaN'])]];
  } else if (mode === 'dry') {
    unit.dead = false; unit.fadingOut = false; unit.routed = false; unit.onWallWalkway = false; unit.primaryRanged = true; unit.canShoot = false;
    unit.isSiegeUnit = false; unit.isSiegeTower = false; unit.isRam = false; unit.isCatapult = false; unit.heldAfterFallback = false;
    unit.surroundApplied = true; scene.finished = false; scene.manualMode = false; scene.wallCol = chance(0.5) ? -1 : (unit.sideAtk ? scene.wallCol : -1);
    enemies.push({ q: unit.q + 2, r: unit.r, dead: false, fadingOut: false, routed: false, isCatapult: false });
  }
  if (mode === 'dry') { unit.doctrineAuto = false; }
  const nAct = int(1, 4);
  const acts = [];
  for (let a = 0; a < nAct; a++) {
    const pickIdx = () => (enemies.length && chance(0.7) ? int(0, enemies.length - 1) : null);
    acts.push({
      q: a === 0 ? unit.q : int(0, 40), r: a === 0 ? unit.r : int(0, 20),
      script: {
        rangeAfter: wild(() => int(1, 9)), playerOrder: chance(0.4), playerSide: chance(0.5), doctrineStep: chance(0.4),
        towerClimb: chance(0.12), infToTower: chance(0.12), ramTower: chance(0.4), machineRange: mode === 'cata' ? pick([1, 3, 6, 12, 30, 'NaN']) : wild(() => int(1, 12)),
        rangedTarget: pickIdx(), targetInRange: mode === 'dry' ? null : pickIdx(), advanceCoord: mode === 'dry' ? int(unit.dryCol >= 0 ? unit.dryCol - 3 : 0, unit.dryCol >= 0 ? unit.dryCol + 1 : 5) : wild(() => int(0, 40)), nearest: mode === 'dry' ? enemies.length - 1 : pickIdx(),
      },
      finished: a > 0 ? chance(0.02) && mode !== 'dry' : scene.finished, manualMode: scene.manualMode,
    });
  }
  return { id: idx, unit, scene, enemies, acts };
}

function runCase(c) {
  const h = new Harness();
  const ru = {
    side: c.unit.sideAtk ? 'atk' : 'def', q: c.unit.q, r: c.unit.r, dead: c.unit.dead, fadingOut: c.unit.fadingOut, routed: c.unit.routed,
    neverRout: c.unit.neverRout, surroundApplied: c.unit.surroundApplied, morale: DEC(c.unit.morale), fleeMorale: DEC(c.unit.fleeMorale),
    range: DEC(c.unit.range), onWallWalkway: c.unit.onWallWalkway, primaryRanged: c.unit.primaryRanged, mounted: c.unit.mounted,
    phalanx: c.unit.phalanx, shootingEnabled: c.unit.shootingDisabled ? false : true, dryCol: c.unit.dryCol, heldAfterFallback: c.unit.heldAfterFallback,
    playerOrder: { type: c.unit.playerOrderNone ? 'none' : 'move' },
    __canShoot: c.unit.canShoot, __doctrineAuto: c.unit.doctrineAuto, __doctrineManual: c.unit.doctrineManual,
    bu: { __siege: c.unit.isSiegeUnit, __tower: c.unit.isSiegeTower, __ram: c.unit.isRam, __cata: c.unit.isCatapult },
  };
  const enemies = c.enemies.map((e, i) => ({ q: e.q, r: e.r, dead: e.dead, fadingOut: e.fadingOut, routed: e.routed, bu: { __cata: e.isCatapult }, __i: i }));
  if (ru.side === 'atk') { h.atk = [ru]; h.def = enemies; } else { h.def = [ru]; h.atk = enemies; }
  h.__enemies = enemies;
  h.siegeWallCol = c.scene.wallCol; h.gateOpen = c.scene.gateOpen;
  h.wallTileHp = new Map(c.scene.wallTileHp.map(([r, hp]) => [r, DEC(hp)]));
  setTerr(DEC(c.unit.terrainDefenceMult));
  const out = [];
  for (const a of c.acts) {
    h.__trace = []; br = []; h.finished = a.finished; h._manualMode = a.manualMode;
    ru.q = a.q; ru.r = a.r;
    h.__s = Object.fromEntries(Object.entries(a.script).map(([k, v]) => [k, DEC(v)]));
    h._activateUnit(ru, () => h.__trace.push('done'));
    out.push({
      trace: h.__trace.slice(), branches: br.slice(),
      unit: { routed: ru.routed, surroundApplied: ru.surroundApplied, morale: ENC(ru.morale), range: ENC(ru.range), dryCol: ENC(ru.dryCol), heldAfterFallback: ru.heldAfterFallback, playerOrderNone: ru.playerOrder.type === 'none' },
    });
  }
  return out;
}

const encCase = (c) => JSON.parse(JSON.stringify(c, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? ENC(v) : v)));

const N = 700;
const cases = [];
const branchCounts = {};
const traceCounts = {};
let nanCases = 0;
for (let i = 0; i < N; i++) {
  const ec = encCase(genCase(i));
  const exp = runCase(ec);
  const txt = JSON.stringify(ec);
  if (txt.includes('"NaN"') || txt.includes('Infinity')) nanCases++;
  for (const x of exp) {
    for (const b of x.branches) branchCounts[b] = (branchCounts[b] || 0) + 1;
    for (const t of x.trace) { const k = t.split(':')[0]; traceCounts[k] = (traceCounts[k] || 0) + 1; }
  }
  cases.push({ ...ec, expect: exp });
}
const dir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_activate_vectors');
mkdirSync(dir, { recursive: true });
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort());
writeFileSync(join(dir, 'vectors.json'), JSON.stringify({
  meta: { pin: PIN, fragmentSha256: digest, seed: 217, sequences: N, activations: cases.reduce((s, c) => s + c.acts.length, 0), nanCases, branchCounts: sortObj(branchCounts), traceCounts: sortObj(traceCounts) },
  cases,
}));
console.error('cases', N, 'nanCases', nanCases);
console.error(JSON.stringify(sortObj(branchCounts), null, 1));
