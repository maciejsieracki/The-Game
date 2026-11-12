// P6 SIEGE-TAKTYKA ROUNDCAP (K5d): generator wektorow przez WYKONANIE tekstu pinu (gra/src/battle/battleScene.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_roundcap_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu (po numerach linii, z asercja tresci granic):
//  * 1125            FF_MAX_ROUNDS
//  * 5631-5636       _beginTurn (sufit przed roundNo++, kolejnosc jak w pinie)
//  * 9449-9464       _roundCapVerdict
//  * 9485-9497       _ffRoundCapResult (przewijanie: rozstrzygniecie po werdykcie)
//  * blok 10199-10206 (`if (aliveA && aliveD) {...}` z _checkEnd: bramka sufitu tur AUTO/recznej)
// Stuby (wylacznie efekty sceny, bez logiki decyzji): _armyMoraleRatio, _finishDraw, _showEndScreen,
// _battleUnitsForMapExport, _updateStallWatch (K5b). Pominiete: blok stall 10172-10188 (K5b/K5c)
// i reszta _checkEnd 10208-10240 (zwyciezca z zywych flag, K5c). Harness _checkEnd = bramka + ten sam zwrot.
//
// Straznik zrodla: SHA-256 wyciętych fragmentow (ROUNDCAP_FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const ROUNDCAP_FRAGMENT_SHA256 = 'c57676d0eee520e6498964f6c062ac92bada687d8db78dfb18d0990af87f2a88';
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

// Granice wycietych fragmentow (asercje tresci).
expectLine(1125, /^const FF_MAX_ROUNDS = 400;/);
expectLine(5631, /private _beginTurn\(\): void \{/);
expectLine(5632, /^    if \(this\.finished\) return;$/);
expectLine(5633, /^    if \(this\._battleAwaitingOrders\) return;$/);
expectLine(5634, /^    this\._updateStallWatch\(\);$/);
expectLine(5635, /^    if \(this\._checkEnd\(\)\) return;$/);
expectLine(5636, /^    this\.roundNo\+\+;$/);
expectLine(9449, /private _roundCapVerdict\(\)/);
expectLine(9464, /^  \}$/);
expectLine(9485, /private _ffRoundCapResult\(\): void \{/);
expectLine(9497, /^  \}$/);

// Blok bramki sufitu w _checkEnd: od `if (aliveA && aliveD) {` do zamykajacej klamry na 4 spacjach.
let gateStart = -1;
for (let n = 10195; n <= 10205; n++) {
  if (/^\s*if \(aliveA && aliveD\) \{$/.test(LINE(n))) { gateStart = n; break; }
}
if (gateStart < 0) throw new Error('brak bloku bramki sufitu w _checkEnd (10195-10205)');
let gateEnd = -1;
for (let n = gateStart + 1; n <= gateStart + 12; n++) {
  if (/^    \}$/.test(LINE(n))) { gateEnd = n; break; }
}
if (gateEnd < 0) throw new Error('brak konca bloku bramki');

const fragments = [L(1125, 1125), L(5631, 5636), L(9449, 9464), L(9485, 9497), L(gateStart, gateEnd)];
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (ROUNDCAP_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== ROUNDCAP_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest, 'gate', gateStart, gateEnd);

// Metody wyciete z pinu. Bramka: blok 10199-10206 osadzony w metodzie z lokalnymi aliveA/aliveD.
const gateBlock = L(gateStart, gateEnd);
const classSrc = [
  LINE(1125),
  'class Harness {',
  '  constructor() {',
  '    this.atk = []; this.def = []; this.siegeWallCol = -1; this.wallEverBreached = false;',
  '    this.roundNo = 0; this.siegeNoBreachMaxRounds = 150; this.finished = false; this.log = [];',
  '    this._battleAwaitingOrders = false; this._ffActive = false; this._ffQueue = [];',
  '    this._endWinner = null; this._endSurvivors = null; this.__ratio = { atk: 1, def: 1 };',
  '    this.__draw = null; this.__shown = null; this.__aliveA = true; this.__aliveD = true;',
  '    this.__winner = null;',
  '  }',
  '  _armyMoraleRatio(side) { return this.__ratio[side]; }',
  '  _finishDraw(reason, cap) { this.__draw = { reason, cap }; this.finished = true; this._ffActive = false; this._ffQueue = []; this._endWinner = "remis"; }',
  '  _showEndScreen(w) { this.__shown = w; }',
  '  _battleUnitsForMapExport(arr) { return arr.slice(); }',
  '  _updateStallWatch() { /* K5b: poza zakresem tego klocka */ }',
  L(9449, 9464),
  L(9485, 9497),
  // Bramka sufitu z _checkEnd, wykonana na lokalnych aliveA/aliveD. Zwraca obiekt; `return true` z pinu
  // (remis) jest przechwytywane przez wrapper ponizej.
  '  _gateRun(a0, d0) {',
  '    let aliveA = a0, aliveD = d0;',
  '    const r = (() => {',
  gateBlock,
  '      return undefined;',
  '    })();',
  '    return { aliveA, aliveD, draw: r === true };',
  '  }',
  // Glue: _checkEnd (tylko bramka sufitu; reszta poza zakresem), wg pinu 10199-10206 i 10208.
  '  _checkEnd() {',
  '    const g = this._gateRun(this.__aliveA, this.__aliveD);',
  '    if (g.draw) { this.__winner = "remis"; return true; }',
  '    this.__aliveA = g.aliveA; this.__aliveD = g.aliveD;',
  '    if (g.aliveA && g.aliveD) return false;',
  '    this.__winner = g.aliveA ? "atakujacy" : "obronca";',
  '    return true;',
  '  }',
  // _beginTurn z pinu 5631-5636 (bez 5631 i klamry obejmujacej: wstawiona jako metoda).
  L(5631, 5636).replace('private _beginTurn(): void {', '_beginTurn() {') + '\n  }',
  '}',
].join('\n');

// Mini-funkcja PAT-owa nie jest potrzebna: wszystkie wyjscia z pinu sa w klasie.
const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' });
const Harness = new Function(jsSrc + '\nreturn Harness;')();

// Wykonanie _ffRoundCapResult/_roundCapVerdict bezposrednio z pinu (ten sam obiekt).
function runFf(h) {
  // pin 9424: if (this._roundCapVerdict()) { this._ffRoundCapResult(); return; }
  if (h._roundCapVerdict()) { h._ffRoundCapResult(); return true; }
  return false;
}

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
const ROUND_POOL = [0, 1, 2, 149, 150, 151, 399, 400, 401, 500];
const CAP_POOL = [1, 2, 150, 400, 500, 1000];
const RATIO_POOL = [0, 0.1, 0.25, 0.5, 0.75, 1, 1.5, NaN, Infinity, -Infinity, -0];
const ratioVal = () => (rnd() < 0.4 ? pick(RATIO_POOL) : Math.round(rnd() * 1000) / 1000);
const roundVal = () => (rnd() < 0.5 ? pick(ROUND_POOL) : Math.floor(rnd() * 501));

function randomState() {
  return {
    roundNo: roundVal(),
    noBreachCap: pick(CAP_POOL),
    wallPresent: rnd() < 0.5,
    wallEverBreached: rnd() < 0.4,
  };
}
function applyState(h, s) {
  h.roundNo = s.roundNo;
  h.siegeNoBreachMaxRounds = s.noBreachCap;
  h.siegeWallCol = s.wallPresent ? 3 : -1;
  h.wallEverBreached = s.wallEverBreached;
}

// --- Bramka sufitu (_checkEnd 10199-10206): alive-both wymusza werdykt; inne -> pominiete ---
const gateCases = [];
for (let k = 0; k < 600; k++) {
  const h = new Harness();
  const state = randomState();
  applyState(h, state);
  const aliveA = rnd() < 0.8;
  const aliveD = rnd() < 0.8;
  const ratioA = ratioVal();
  const ratioD = ratioVal();
  h.__ratio = { atk: ratioA, def: ratioD };
  const g = h._gateRun(aliveA, aliveD);
  let expect;
  if (g.draw) expect = 'remis';
  // Pin: obronca -> aliveA = false (przegrywa atakujacy), atakujacy -> aliveD = false.
  else if (aliveA && aliveD) expect = g.aliveA && g.aliveD ? 'continue' : g.aliveA ? 'atakujacy' : 'obronca';
  else expect = 'continue';
  // Gdy bramka nie stosuje sie (flagi nie obie zywe), pin nie zmienia flag: expect continue.
  if (!(aliveA && aliveD)) expect = 'continue';
  gateCases.push({ state, aliveA, aliveD, ratioA, ratioD, expect });
}

// --- Poczatek tury (_beginTurn 5631-5636), tylko obie strony zywe (poza bramka: K5c) ---
const beginCases = [];
for (let k = 0; k < 400; k++) {
  const h = new Harness();
  const state = randomState();
  applyState(h, state);
  h.__ratio = { atk: ratioVal(), def: ratioVal() };
  h.__aliveA = true;
  h.__aliveD = true;
  h._beginTurn();
  const ended = h.finished || h.__winner !== null;
  let expect;
  if (h.__draw) expect = 'remis';
  else if (ended) expect = h.__winner;
  else expect = 'continue';
  beginCases.push({
    state,
    ratioA: h.__ratio.atk,
    ratioD: h.__ratio.def,
    expect,
    roundNoAfter: h.roundNo,
  });
}

// --- Przewijanie (_runFastForward 9424 + _ffRoundCapResult 9485-9497): bez bramki zywych ---
const ffCases = [];
for (let k = 0; k < 500; k++) {
  const h = new Harness();
  const state = randomState();
  applyState(h, state);
  const ratioA = ratioVal();
  const ratioD = ratioVal();
  h.__ratio = { atk: ratioA, def: ratioD };
  const ended = runFf(h);
  let expect;
  if (!ended) expect = 'continue';
  else if (h.__draw) expect = 'remis';
  else expect = h._endWinner;
  ffCases.push({ state, ratioA, ratioD, expect });
}

// JSON bez NaN/Infinity: wartosci nieskonczone jako napisy. Minus zero jako "-0" (JSON.stringify(-0) === "0"
// gubi znak; bez tego wektory nie zawieraja -0 mimo puli RATIO_POOL).
const jsonReplacer = (_k, v) => {
  if (typeof v !== 'number') return v;
  if (Object.is(v, -0)) return '-0';
  return Number.isFinite(v) ? v : String(v);
};

const counts = { gate: gateCases.length, begin: beginCases.length, ff: ffCases.length };
const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_roundcap_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: FF_MAX_ROUNDS 1125, _beginTurn 5631-5636, _roundCapVerdict 9449-9464, _ffRoundCapResult 9485-9497, bramka sufitu _checkEnd ' + gateStart + '-' + gateEnd + ' (wykonanie tekstu pinu, stuby efektow sceny)',
  generator: 'rust-port/engine/tests/p6_siege_tactics_roundcap_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigest,
  counts,
  gate: gateCases,
  beginTurn: beginCases,
  ff: ffCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
console.log('gate', counts.gate, 'begin', counts.begin, 'ff', counts.ff);
