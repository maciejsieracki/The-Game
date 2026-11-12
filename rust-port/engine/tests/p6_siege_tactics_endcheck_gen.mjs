// P6 SIEGE-TAKTYKA ENDCHECK: generator wektorow przez WYKONANIE tekstu pinu (gra/src/battle/battleScene.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_endcheck_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Nie ma tu recznej kopii logiki: metody `_updateStallWatch`, `_roundCapVerdict`, `_checkEnd`, `_battleUnitsForMapExport`
// oraz stale (`STALL_TURN_LIMIT`, `FF_MAX_ROUNDS`, `ARMY_MORALE_LOSS_THRESHOLD`) sa wycinane z pinu po numerach linii
// (z asercja tresci granic) i wykonywane po usunieciu typow TS. Stubs dotycza wylacznie efektow sceny
// (`_startRout`, `_finishDraw`, `_showEndScreen`, `_armyMoraleRatio`, `commandersToWithdrawAfterArmyBreak`).
// Wejscia `aliveA/aliveD`, `totalDead`, `isSiege` tez pochodza z wykonania wyciętych linii pinu.
//
// Straznik zrodla: hash SHA-256 wycietych fragmentow (ENDCHECK_FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const ENDCHECK_FRAGMENT_SHA256 = '1637958008e4ba03ef72fb164139d3ec11199649948cbaddfcf9b3564abac3e9';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const L = (a, b) => pinLines.slice(a - 1, b).join('\n');
const LINE = (n) => pinLines[n - 1];

function expectLine(n, re) {
  if (!re.test(LINE(n))) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${LINE(n)}`);
}
function findLine(a, b, re) {
  const hits = [];
  for (let n = a; n <= b; n++) if (re.test(LINE(n))) hits.push(n);
  if (hits.length !== 1) throw new Error(`pin ${a}-${b}: ${re} trafien ${hits.length}`);
  return hits[0];
}

// Granice wycietych fragmentow (asercje tresci).
expectLine(1119, /^const STALL_TURN_LIMIT = 6;/);
expectLine(1125, /^const FF_MAX_ROUNDS = 400;/);
expectLine(1157, /^const ARMY_MORALE_LOSS_THRESHOLD = 0\.25;/);
expectLine(5568, /private _updateStallWatch\(\): void \{/);
expectLine(5581, /^  \}$/);
expectLine(9449, /private _roundCapVerdict\(\)/);
expectLine(9464, /^  \}$/);
expectLine(10153, /private _checkEnd\(\): boolean \{/);
expectLine(10240, /^  \}$/);
expectLine(10246, /private _battleUnitsForMapExport\(/);
expectLine(10250, /^  \}$/);

const aliveALine = findLine(10153, 10180, /^\s*let aliveA = this\.atk\.some\(/);
const aliveDLine = findLine(10153, 10180, /^\s*let aliveD = this\.def\.some\(/);
const isSiegeLine = findLine(10153, 10200, /^\s*const isSiege = this\.siegeWallCol >= 0;/);
const totalDeadLine = findLine(10153, 10200, /^\s*const totalDead = /);
const patLine = findLine(10153, 10200, /^\s*if \(ratioA <= ratioD\) aliveA = false; else aliveD = false;/);

const fragments = [
  L(1119, 1119), L(1125, 1125), L(1157, 1157), L(5568, 5581), L(9449, 9464), L(10153, 10240), L(10246, 10250),
];
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (ENDCHECK_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== ENDCHECK_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

const methodSrc = [
  L(5568, 5581), L(9449, 9464), L(10153, 10240), L(10246, 10250),
].join('\n');
// Mini-metody wyciete z tych samych linii pinu (flagi zycia, totalDead, isSiege, PAT).
const derivedSrc = [
  '  _aliveFlags() {',
  LINE(aliveALine),
  LINE(aliveDLine),
  '    return [aliveA, aliveD];',
  '  }',
  '  _isSiegeFlag() {',
  LINE(isSiegeLine),
  '    return isSiege;',
  '  }',
  '  _totalDeadCount() {',
  LINE(totalDeadLine),
  '    return totalDead;',
  '  }',
].join('\n');

const classSrc = [
  L(1119, 1119),
  L(1125, 1125),
  L(1157, 1157),
  'function commandersToWithdrawAfterArmyBreak(arr) { return arr.filter(u => u.__withdraw); }',
  'class Harness {',
  '  constructor() {',
  '    this.atk = []; this.def = []; this.siegeWallCol = -1; this.wallEverBreached = false;',
  '    this.roundNo = 1; this.siegeNoBreachMaxRounds = 150; this.finished = false; this.log = [];',
  '    this._stallSig = ""; this._stallTurns = 0; this._stalled = false;',
  '    this._endWinner = null; this._endSurvivors = null; this.__ratio = { atk: 1, def: 1 };',
  '    this.__ratioAfterRout = { atk: 1, def: 1 }; this.__draw = null; this.__shown = null;',
  '  }',
  '  _armyMoraleRatio(side) { return this.__ratio[side]; }',
  '  _startRout(ru) { this.__ratio = { ...this.__ratioAfterRout }; }',
  '  _finishDraw(reason, cap) { this.__draw = { reason, cap }; }',
  '  _showEndScreen(w) { this.__shown = w; }',
  methodSrc,
  derivedSrc,
  '}',
].join('\n');

const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' });
const Harness = new Function(jsSrc + '\nreturn Harness;')();

// Stała: wykonanie patu z pinu (linia patLine) jako osobna funkcja.
const patFn = new Function(
  'ratioA',
  'ratioD',
  'let aliveA = true, aliveD = true;\n' + stripTypeScriptTypes(LINE(patLine), { mode: 'strip' }) +
    '\nreturn aliveA ? "obronca" : "atakujacy";',
);

// --- PRNG (mulberry32, ziarno 217) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(217);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const HP_POOL = [0, 0, 1, 5, 12.5, 40, 99, 100, -3, -0.5, 0.5, 2.5, 1e21, NaN, Infinity, -Infinity];
const RATIO_POOL = [0, 0.1, 0.24999, 0.25, 0.3, 0.5, 0.75, 1, 1.5, NaN, Infinity, -Infinity, -0];
const hpVal = () => (rnd() < 0.35 ? pick(HP_POOL) : Math.round(rnd() * 200) / 2);
const ratioVal = () => (rnd() < 0.4 ? pick(RATIO_POOL) : Math.round(rnd() * 1000) / 1000);

function randomUnit() {
  return {
    bu: { hp: hpVal() },
    dead: rnd() < 0.2,
    fadingOut: rnd() < 0.1,
    routed: rnd() < 0.15,
    morale: hpVal(),
    __withdraw: rnd() < 0.2,
  };
}
function randomUnits(maxLen) {
  const n = Math.floor(rnd() * (maxLen + 1));
  return Array.from({ length: n }, randomUnit);
}

// --- Watchdog: sekwencje krokow ---
const stallCases = [];
for (let k = 0; k < 500; k++) {
  const h = new Harness();
  const initial = {
    sig: rnd() < 0.5 ? '' : 'x',
    turns: Math.floor(rnd() * 8),
    stalled: rnd() < 0.2,
  };
  h._stallSig = initial.sig;
  h._stallTurns = initial.turns;
  h._stalled = initial.stalled;
  // Krok powtarzany z tymi samymi jednostkami, by wymusic dopasowanie sygnatury.
  const steps = [];
  const baseUnits = randomUnits(5);
  let lastUnits = baseUnits;
  const nSteps = 1 + Math.floor(rnd() * 9);
  for (let s = 0; s < nSteps; s++) {
    const isSiege = rnd() < 0.3;
    const repeat = rnd() < 0.6 && steps.length > 0;
    const units = repeat ? lastUnits : (rnd() < 0.5 ? baseUnits : randomUnits(5));
    lastUnits = units;
    h.siegeWallCol = isSiege ? 2 : -1;
    h.atk = units.filter((_, i) => i % 2 === 0);
    h.def = units.filter((_, i) => i % 2 === 1);
    h._updateStallWatch();
    // Kolejnosc jak w webie: [...this.atk, ...this.def].
    steps.push({
      isSiege,
      units: [...h.atk, ...h.def].map((u) => ({ hp: u.bu.hp, morale: u.morale, out: u.dead || u.routed })),
      expect: { sig: h._stallSig, turns: h._stallTurns, stalled: h._stalled },
    });
  }
  stallCases.push({ initial, steps });
}

// --- PAT: wycinek pinu ---
const patCases = [];
for (let k = 0; k < 300; k++) {
  const ratioA = ratioVal();
  const ratioD = ratioVal();
  patCases.push({ ratioA, ratioD, expect: patFn(ratioA, ratioD) });
}

// --- Kolejnosc konca: _checkEnd z pinu ---
const endCases = [];
const ROUND_POOL = [1, 2, 149, 150, 151, 399, 400, 401, 500];
// (pula tur: patrz nizej)
const CAP_POOL = [1, 2, 150, 400, 500];
for (let k = 0; k < 1200; k++) {
  const h = new Harness();
  h.atk = randomUnits(4);
  h.def = randomUnits(4);
  // Czesc przypadkow: wszystkie jednostki zyja (pokrycie gałęzi sufitu tur i kontynuacji).
  if (rnd() < 0.5) for (const u of [...h.atk, ...h.def]) { if (rnd() < 0.9) { u.dead = false; u.fadingOut = false; u.routed = false; } }
  h.siegeWallCol = rnd() < 0.5 ? -1 : 3;
  h.wallEverBreached = rnd() < 0.4;
  h.roundNo = rnd() < 0.5 ? pick(ROUND_POOL) : Math.floor(rnd() * 501);
  if (rnd() < 0.3) h.siegeNoBreachMaxRounds = h.roundNo; // granica sufitu tur bez wylomu
  h.siegeNoBreachMaxRounds = pick(CAP_POOL);
  h._stalled = rnd() < 0.6;
  h.__ratio = { atk: ratioVal(), def: ratioVal() };
  h.__ratioAfterRout = { atk: ratioVal(), def: ratioVal() };
  if (rnd() < 0.3) h.atk.forEach((u) => (u.__withdraw = true));
  const ratioBefore = { ...h.__ratio };
  const alive = h._aliveFlags();
  const isSiege = h._isSiegeFlag();
  const totalDead = h._totalDeadCount();
  const stalled = h._stalled;
  const hpA = h.atk.map((u) => u.bu.hp);
  const hpD = h.def.map((u) => u.bu.hp);
  h.finished = false;
  const ret = h._checkEnd();
  // Ratio z kroku 10197 (_roundCapVerdict) = wartosc po ewentualnym _startRout.
  const ratioAtCap = { ...h.__ratio };
  let outcome;
  if (!ret) outcome = 'continue';
  else if (h.__draw) outcome = 'draw';
  else outcome = h._endWinner;
  endCases.push({
    stalled,
    aliveA: alive[0],
    aliveD: alive[1],
    isSiege,
    wallEverBreached: h.wallEverBreached,
    totalDead,
    ratioA: ratioBefore.atk,
    ratioD: ratioBefore.def,
    ratioAAtCap: ratioAtCap.atk,
    ratioDAtCap: ratioAtCap.def,
    roundNo: h.roundNo,
    noBreachCap: h.siegeNoBreachMaxRounds,
    hpA,
    hpD,
    expect: outcome,
  });
}

// JSON bez NaN/Infinity: wartosci nieskonczone jako napisy.
const jsonReplacer = (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v);

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_endcheck_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: _updateStallWatch 5568-5581, _roundCapVerdict 9449-9464, _checkEnd 10153-10240, _battleUnitsForMapExport 10246-10250, stale 1119/1125/1157, PAT 10178-10182 (wykonanie tekstu pinu, stuby efektow sceny)',
  generator: 'rust-port/engine/tests/p6_siege_tactics_endcheck_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigest,
  stall: stallCases,
  pat: patCases,
  endCheck: endCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
console.log('stall', stallCases.length, 'pat', patCases.length, 'endCheck', endCases.length);
