// P6 SIEGE-TAKTYKA K5i-2a2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A2-Q1): generator wektorow czystych funkcji pozycji/brodu/trudnosci
// WYKONUJACY tekst pinu (pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_inputs_pos_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_inputs_pos_vectors/vectors.json. Ziarno PRNG 4217 (mulberry32).
//
// Wykonywane zakresy pinu (linie 1-based, wlacznie), kazdy przez `new Function` po zdjeciu typow TS:
//   * battleScene.ts 347-353 facingToward, 370-372 oppositeDir, 385-400 relativeHit (jeden zakres funkcji, wolaja sie nawzajem);
//   * battleScene.ts 326-331 DIR_DELTA, 1897-1899 isFordTile, 1907-1914 isShoreAdjacentToFord;
//   * battle-terrain.ts 37-46 enum BTerrain (wartosci wczytane z tekstu pinu);
//   * battle-unit-context.ts 9-14 battleUnitDifficultyCombatMult;
//   * combat.ts 589-606 flankRearDefensePenalty (przeniesiona tu z siege_tactics_blow_inputs).
// Nic nie jest przepisywane recznie. Straznik: SHA-256 zlaczonych fragmentow + straznik struktury (pierwsza/ostatnia linia).
//
// Kodowanie wartosci JS (wejscia tekstowe!): {k:'num',v:'<String(x)>'} | {k:'str',v:'..'} | {k:'null'} | {k:'undef'}.
// `facing` (obroncy / fallback) i `dCol`/`dRow` sa generowane jako liczby ORAZ jako teksty ("1", " 2 ", "", "abc", "0x1"),
// bo JS wykonuje na nich koercje (`"1" + 2 === "12"`, `"3" >= 0`, `"0" === 0` falszywe).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = {
  scene: 'gra/src/battle/battleScene.ts',
  terrain: 'gra/src/battle/battle-terrain.ts',
  unitCtx: 'gra/src/battle/battle-unit-context.ts',
  combat: 'gra/src/game/combat.ts',
};
// [plik, od, do, pierwsza linia zawiera, ostatnia linia (trim)]
const R = {
  dirDelta: ['scene', 326, 331, 'const DIR_DELTA', '];'],
  facingToward: ['scene', 347, 353, 'export function facingToward(', '}'],
  oppositeDir: ['scene', 370, 372, 'export function oppositeDir(', '}'],
  relativeHit: ['scene', 385, 400, 'export function relativeHit(', '}'],
  isFordTile: ['scene', 1897, 1899, 'function isFordTile(', '}'],
  isShore: ['scene', 1907, 1914, 'function isShoreAdjacentToFord(', '}'],
  bTerrain: ['terrain', 37, 46, 'export const enum BTerrain', '}'],
  difficulty: ['unitCtx', 9, 14, 'export function battleUnitDifficultyCombatMult(', '}'],
  flankRear: ['combat', 589, 606, 'export function flankRearDefensePenalty(', '}'],
};
const FRAGMENT_SHA256 = 'eca0a8248dd6d47d14834331fb0f13c181736fcfa3750f3d2c2dda1e8c771ada';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, gitShow(p).split('\n')]));
const frag = {};
for (const [name, [file, a, b, first, last]] of Object.entries(R)) {
  const ls = lines[file].slice(a - 1, b);
  if (!ls[0].includes(first)) throw new Error(`pin: ${name} poczatek nie na ${a}: ${ls[0]}`);
  if (ls[ls.length - 1].trim() !== last) throw new Error(`pin: ${name} koniec nie na ${b}: ${ls[ls.length - 1]}`);
  frag[name] = ls.join('\n');
}
const digest = createHash('sha256')
  .update(Object.keys(frag).map((n) => `${n}\n${frag[n]}`).join('\n---\n'))
  .digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && digest !== FRAGMENT_SHA256) {
  throw new Error(`SHA-256 fragmentow pinu zmieniony: ${digest}`);
}
console.error(`fragment sha256 = ${digest}`);

// --- funkcje z tekstu pinu ---
const strip = (s) => stripTypeScriptTypes(s.replace(/^export /gm, ''));
const Dir = { N: 0, E: 1, S: 2, W: 3 }; // enum Dir z pinu (battleScene.ts:315-320), sprawdzany ponizej
const dirEnumText = lines.scene.slice(314, 320).join('\n');
for (const [k, v] of Object.entries(Dir)) {
  if (!new RegExp(`${k}\\s*=\\s*${v},`).test(dirEnumText)) throw new Error(`pin: Dir.${k} != ${v}`);
}
const BTerrain = {};
for (const m of frag.bTerrain.matchAll(/^\s*(\w+)\s*=\s*(\d+),/gm)) BTerrain[m[1]] = Number(m[2]);
const dirDeltaSrc = strip(frag.dirDelta);
const posFns = new Function('Dir', `${strip(frag.facingToward)}\n${strip(frag.oppositeDir)}\n${strip(frag.relativeHit)}\nreturn { facingToward, oppositeDir, relativeHit };`)(Dir);
const fordFns = new Function('BTerrain', `${dirDeltaSrc}\n${strip(frag.isFordTile)}\n${strip(frag.isShore)}\nreturn { isFordTile, isShoreAdjacentToFord };`)(BTerrain);
const difficultyFn = new Function(`${strip(frag.difficulty)}\nreturn battleUnitDifficultyCombatMult;`)();
const flankRearFn = new Function(`${strip(frag.flankRear)}\nreturn flankRearDefensePenalty;`)();

// --- PRNG ---
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
const rnd = mulberry32(4217);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;

// --- kodowanie wartosci JS ---
const encNum = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : Object.is(x, -0) ? '-0' : String(x));
const encVal = (x) => {
  if (x === undefined) return { k: 'undef' };
  if (x === null) return { k: 'null' };
  if (typeof x === 'number') return { k: 'num', v: encNum(x) };
  if (typeof x === 'string') return { k: 'str', v: x };
  throw new Error('nieobslugiwany typ');
};
const NUMS = [0, -0, 1, -1, 2, 3, 5, -7, 0.5, 2.5, 1e9, NaN, Infinity, -Infinity];
const STRS = ['0', '1', '2', '3', '-1', ' 2 ', '', '  ', 'abc', '0x1', '0x3', '1e1', '1.5', '-0', 'Infinity', '-Infinity', 'N', '1 2', '+2', '.5', '5.', '\t3\n'];
const jsNumOrStr = (pStr) => (chance(pStr) ? pick(STRS) : pick(NUMS));
const dirOrWeird = () => {
  const r = rnd();
  if (r < 0.55) return int(0, 3);
  if (r < 0.7) return pick(['0', '1', '2', '3', ' 1 ']);
  if (r < 0.8) return pick(['', 'abc', '0x1', '1.5', '-2']);
  if (r < 0.9) return pick([4, 5, -1, 1.5, 7]);
  if (r < 0.95) return pick([NaN, Infinity, -Infinity]);
  return pick([2e9, -3, 0.5]);
};
const smallInt = () => int(-4, 4);
const delta = () => (chance(0.25) ? jsNumOrStr(0.4) : smallInt());

const cases = [];
const push = (fn, input, expect) => cases.push({ id: `${fn}-${String(cases.length).padStart(4, '0')}`, fn, input, expect });
const encOut = (x) => encVal(x);

// facingToward (+ oppositeDir, relativeHit): 3 x ~220
for (let i = 0; i < 230; i++) {
  const dCol = delta();
  const dRow = delta();
  const fallback = chance(0.15) ? undefined : dirOrWeird();
  // fallback `undefined` -> parametr domyslny Dir.E (JS default param)
  const got = posFns.facingToward(dCol, dRow, fallback);
  push('facingToward', { dCol: encVal(dCol), dRow: encVal(dRow), fallback: encVal(fallback) }, { dir: encOut(got) });
}
for (let i = 0; i < 160; i++) {
  const d = dirOrWeird();
  push('oppositeDir', { d: encVal(d) }, { dir: encOut(posFns.oppositeDir(d)) });
}
for (let i = 0; i < 280; i++) {
  const facing = dirOrWeird();
  const same = chance(0.12);
  const ac = chance(0.05) ? pick(NUMS) : int(-3, 3);
  const ar = chance(0.05) ? pick(NUMS) : int(-3, 3);
  const dc = same && typeof ac === 'number' ? ac : chance(0.05) ? pick(NUMS) : int(-3, 3);
  const dr = same && typeof ar === 'number' ? ar : chance(0.05) ? pick(NUMS) : int(-3, 3);
  push('relativeHit', { facing: encVal(facing), ac: encVal(ac), ar: encVal(ar), dc: encVal(dc), dr: encVal(dr) }, { hit: posFns.relativeHit(facing, ac, ar, dc, dr) });
}
// relativeHit: kontrola kazdej gałęzi z kazdym kierunkiem (pelna tabela 4 zwrotow x 4 kierunkow + zero)
for (let f = 0; f < 4; f++) {
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0], [3, 3], [-3, 3], [2, -5]]) {
    push('relativeHit', { facing: encVal(f), ac: encVal(dc), ar: encVal(dr), dc: encVal(0), dr: encVal(0) }, { hit: posFns.relativeHit(f, dc, dr, 0, 0) });
  }
}

// isFordTile / isShoreAdjacentToFord: mapa = rzadki slownik kafli; poza slownikiem Plains (jak `at` w pinie).
const TERR = [0, 1, 2, 3, 4, 5, 6, 7];
function genTm() {
  const cells = {};
  const col = int(-2, 3);
  const row = int(-2, 3);
  const put = (c, r, v) => { cells[`${c},${r}`] = v; };
  const weights = chance(0.5) ? [0, 1, 2, 3, 4, 5, 6, 7] : [4, 4, 0, 3, 0, 5];
  put(col, row, chance(0.1) ? 99 : pick(weights));
  for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    if (chance(0.8)) put(col + dc, row + dr, chance(0.04) ? 99 : pick(chance(0.5) ? TERR : [4, 4, 4, 0, 3]));
  }
  // diagonale (nie powinny wplywac na wynik 4-kierunkowy)
  if (chance(0.5)) put(col + 1, row + 1, 4);
  if (chance(0.3)) put(col - 1, row - 1, 4);
  return { col, row, cells };
}
const tmStub = (cells) => ({ at: (c, r) => (Object.prototype.hasOwnProperty.call(cells, `${c},${r}`) ? cells[`${c},${r}`] : BTerrain.Plains) });
for (let i = 0; i < 160; i++) {
  const { col, row, cells } = genTm();
  push('isFordTile', { col, row, cells }, { v: fordFns.isFordTile(tmStub(cells), col, row) });
}
for (let i = 0; i < 260; i++) {
  const { col, row, cells } = genTm();
  push('isShoreAdjacentToFord', { col, row, cells }, { v: fordFns.isShoreAdjacentToFord(tmStub(cells), col, row) });
}
// brzeg: wszystkie 4 sasiedztwa po kolei ford (kazda strona osobno), oraz wlasny kafel River/Ford z fordem obok
for (const own of [0, 1, 2, 3, 4, 5, 6, 7]) {
  for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1]]) {
    const cells = { '0,0': own, [`${dc},${dr}`]: 4 };
    push('isShoreAdjacentToFord', { col: 0, row: 0, cells }, { v: fordFns.isShoreAdjacentToFord(tmStub(cells), 0, 0) });
  }
}

// battleUnitDifficultyCombatMult: unit.difficultyCombatMult ?? sideFallback (null/undefined -> fallback)
for (let i = 0; i < 120; i++) {
  const r = rnd();
  const fieldVal = r < 0.2 ? undefined : r < 0.3 ? null : r < 0.7 ? pick([0, -0, 0.5, 1, 1.25, 2, 0.01, NaN, Infinity, -1]) : pick(['', '1', '1.5', 'abc', '0']);
  const unit = fieldVal === undefined && chance(0.5) ? {} : { difficultyCombatMult: fieldVal };
  const fallback = pick([1, 0.8, 1.2, 0, NaN, Infinity, 2.5]);
  push('battleUnitDifficultyCombatMult', { unit: Object.hasOwn(unit, 'difficultyCombatMult') ? { has: true, v: encVal(unit.difficultyCombatMult) } : { has: false }, fallback: encVal(fallback) }, { v: encOut(difficultyFn(unit, fallback)) });
}

// flankRearDefensePenalty: pola jednostki jako tekst/liczba/null/undefined/'---'/''
const RAW = [undefined, null, '---', '', ' ', '50', ' 30.5abc', 'abc', '1e2', '.5', '-Infinity', 'Infinity', '0x10', '25%', 0, 50, 30, 100, -10, 12.5, NaN, Infinity, '0', ' 50'];
for (let i = 0; i < 260; i++) {
  const flank = pick(RAW);
  const rear = pick(RAW);
  const position = chance(0.08) ? pick(['x', '', 'Flank']) : pick(['front', 'flank', 'rear']);
  const unit = {};
  if (flank !== undefined || chance(0.5)) unit['Kara obrony z flanki (%)'] = flank;
  if (rear !== undefined || chance(0.5)) unit['Kara obrony z tylu (%)'] = rear;
  push('flankRearDefensePenalty', {
    flank: encVal(unit['Kara obrony z flanki (%)']), rear: encVal(unit['Kara obrony z tylu (%)']), position,
  }, { v: encOut(flankRearFn(unit, position)) });
}

const out = {
  pin: PIN,
  fragmentSha256: digest,
  ranges: Object.fromEntries(Object.entries(R).map(([k, v]) => [k, v.slice(0, 3)])),
  note: 'Wektory generowane wykonaniem tekstu pinu; wartosci JS kodowane tagami k (num/str/null/undef).',
  count: cases.length,
  cases,
};
const dir = join(here, 'p6_siege_tactics_inputs_pos_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const byFn = {};
for (const c of cases) byFn[c.fn] = (byFn[c.fn] ?? 0) + 1;
console.error(`wrote ${cases.length} cases`, JSON.stringify(byFn));
