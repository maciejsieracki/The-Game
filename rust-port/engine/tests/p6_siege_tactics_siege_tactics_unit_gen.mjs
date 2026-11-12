// P6 SIEGE-TAKTYKA K5a: generator wektorow modelu jednostki boju przez WYKONANIE tekstu pinu
// (gra/src/battle/battleScene.ts, pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_siege_tactics_unit_gen.mjs
// (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane linie pinu: MORALE_TERRAIN_RESIST (1143), alive (5617), aliveA/aliveD (10159-10160), totalDead (w 10153-10200),
// out (10263), _checkRout (9783-9797). Stuby dotycza wylacznie efektow sceny: terrainMap, toCombatUnit,
// terrainDefenseMultiplier (sterowany wynik), _startRout (rejestruje wywolanie i ustawia routed jak web).
// Straznik zrodla: SHA-256 wycietych fragmentow (UNIT_FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const UNIT_FRAGMENT_SHA256 = 'efd9637c4dbe3c3aade4e88999050cf56ec161282e2442d4ff3068e526f16713';
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

// Granice wycinanych fragmentow (asercje tresci).
expectLine(1143, /^const MORALE_TERRAIN_RESIST\s+= 5;/);
expectLine(5617, /^\s*const alive = \(ru: RuntimeBattleUnit\) => !ru\.dead && !ru\.fadingOut && !ru\.removed;/);
expectLine(10159, /^\s*let aliveA = this\.atk\.some\(u => !u\.dead && !u\.fadingOut && !u\.routed\);/);
expectLine(10160, /^\s*let aliveD = this\.def\.some\(u => !u\.dead && !u\.fadingOut && !u\.routed\);/);
expectLine(10263, /^\s*const out = u\.dead \|\| u\.routed;/);
expectLine(9783, /private _checkRout\(ru: RuntimeBattleUnit\): void \{/);
expectLine(9797, /^  \}$/);
const totalDeadLine = findLine(10153, 10200, /^\s*const totalDead = /);

const fragments = [L(1143, 1143), L(5617, 5617), L(10159, 10160), LINE(totalDeadLine), L(10263, 10263), L(9783, 9797)];
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (UNIT_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== UNIT_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

// Wykonanie: alive (arrow z typami -> strip).
const aliveFn = new Function(stripTypeScriptTypes(LINE(5617), { mode: 'strip' }) + '\nreturn alive;')();
// Wykonanie: aliveA/aliveD i totalDead z this.atk/this.def.
const sideFn = new Function(LINE(10159) + '\n' + LINE(10160) + '\nreturn [aliveA, aliveD];');
const totalDeadFn = new Function(LINE(totalDeadLine) + '\nreturn totalDead;');
// Wykonanie: out.
const outFn = new Function('u', LINE(10263) + '\nreturn out;');

// Klasa z wycietym _checkRout (9783-9797) i stalymi (1143). Stuby: terrainMap, toCombatUnit,
// terrainDefenseMultiplier (wynik z globalThis.__terrMult), _startRout (liczy wywolania, ustawia routed).
const classSrc = [
  'const terrainDefenseMultiplier = (_t, _r, _d) => { globalThis.__terrCalls++; return globalThis.__terrMult; };',
  'const toCombatUnit = (_bu, _h, _a, _g) => ({ rola: "r" });',
  L(1143, 1143),
  'class Harness {',
  '  constructor() {',
  '    this.terrainMap = { combatTerrainName: (_q, _r) => "t" };',
  '    this.terrainData = {}; this.armyHungerStatMult = 1; this.goldDeficitStatMult = 1;',
  '    this.__startRoutCalls = 0;',
  '  }',
  '  _startRout(ru) { this.__startRoutCalls++; ru.routed = true; }',
  L(9783, 9797),
  '}',
].join('\n');
const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' });
const Harness = new Function(jsSrc + '\nreturn Harness;')();

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
const MORALE_POOL = [0, 0.5, 4.9, 5, 5.1, 19.9, 20, 20.1, 50, 100, 150, -1, -0, NaN, Infinity, -Infinity];
const FLEE_POOL = [0, 1, 4.9, 5, 6, 20, 50, 100, NaN, Infinity, -Infinity, -2];
const TERR_POOL = [0, 0.5, 1, 1.0000001, 1.5, 2, NaN, Infinity, -Infinity];
const moraleVal = () => (rnd() < 0.5 ? pick(MORALE_POOL) : Math.round(rnd() * 2000) / 20 - 10);
const fleeVal = () => (rnd() < 0.5 ? pick(FLEE_POOL) : Math.round(rnd() * 1000) / 20);

const flagsUnit = () => ({
  dead: rnd() < 0.25,
  fadingOut: rnd() < 0.2,
  removed: rnd() < 0.2,
  routed: rnd() < 0.25,
});

// --- alive / out: pojedyncze jednostki (pelne 2^4 kombinacje + losowe) ---
const aliveCases = [];
const outCases = [];
for (let k = 0; k < 600; k++) {
  const f = k < 16
    ? { dead: !!(k & 1), fadingOut: !!(k & 2), removed: !!(k & 4), routed: !!(k & 8) }
    : flagsUnit();
  const u = { bu: { hp: 1 }, ...f };
  aliveCases.push({ ...f, expect: aliveFn(u) });
}
for (let k = 0; k < 400; k++) {
  const f = k < 4 ? { dead: !!(k & 1), routed: !!(k & 2) } : flagsUnit();
  outCases.push({ dead: f.dead, routed: f.routed, expect: outFn(f) });
}

// --- aliveA/aliveD i totalDead: listy 0..4 jednostek po stronie ---
const sideCases = [];
for (let k = 0; k < 400; k++) {
  const nA = Math.floor(rnd() * 5);
  const nD = Math.floor(rnd() * 5);
  const atk = Array.from({ length: nA }, () => ({ bu: { hp: 1 }, ...flagsUnit() }));
  const def = Array.from({ length: nD }, () => ({ bu: { hp: 1 }, ...flagsUnit() }));
  const [aA, aD] = sideFn.call({ atk, def });
  const tD = totalDeadFn.call({ atk, def });
  sideCases.push({
    atk: atk.map((u) => ({ dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.removed })),
    def: def.map((u) => ({ dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.removed })),
    expectAliveA: aA,
    expectAliveD: aD,
    expectTotalDead: tD,
  });
}

// --- _checkRout (bramka rozbicia) z obrona terenowa ---
const routeCases = [];
for (let k = 0; k < 900; k++) {
  const h = new Harness();
  const ru = {
    q: 0,
    r: 0,
    bu: { hp: 1 },
    morale: moraleVal(),
    fleeMorale: fleeVal(),
    neverRout: rnd() < 0.15,
    dead: rnd() < 0.15,
    fadingOut: rnd() < 0.1,
    routed: rnd() < 0.15,
  };
  const terrMult = rnd() < 0.1 ? 1.5 : pick(TERR_POOL);
  globalThis.__terrMult = terrMult;
  globalThis.__terrCalls = 0;
  const input = {
    morale: ru.morale,
    fleeMorale: ru.fleeMorale,
    neverRout: ru.neverRout,
    dead: ru.dead,
    fadingOut: ru.fadingOut,
    routed: ru.routed,
  };
  h._checkRout(ru);
  const terrCalled = globalThis.__terrCalls > 0;
  const startRout = h.__startRoutCalls > 0;
  let tag;
  if (!terrCalled) tag = 'early_return';
  else tag = (terrMult > 1 ? 'terrain_gt1' : 'terrain_le1') + (startRout ? '_rout' : '_hold');
  if (terrCalled && Number.isNaN(input.morale)) tag += '_nan_morale';
  routeCases.push({ ...input, terrMult, expectRout: startRout, tag });
}

// JSON bez NaN/Infinity: wartosci nieskonczone jako napisy.
// JSON.stringify(-0) daje "0", wiec -0 kodujemy jawnie jako napis "-0" (Rust num() parsuje go do -0.0).
const jsonReplacer = (_k, v) => {
  if (typeof v !== 'number') return v;
  if (Object.is(v, -0)) return '-0';
  return Number.isFinite(v) ? v : String(v);
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_siege_tactics_unit_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: MORALE_TERRAIN_RESIST 1143, alive 5617, aliveA/aliveD 10159-10160, totalDead (10153-10200), out 10263, _checkRout 9783-9797 (wykonanie tekstu pinu, stuby efektow sceny)',
  generator: 'rust-port/engine/tests/p6_siege_tactics_siege_tactics_unit_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigest,
  alive: aliveCases,
  out: outCases,
  sides: sideCases,
  rout: routeCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
console.log('alive', aliveCases.length, 'out', outCases.length, 'sides', sideCases.length, 'rout', routeCases.length);
