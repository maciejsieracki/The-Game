// P6 SIEGE-TAKTYKA: generator wektorow z kodu weba (pin 07d2fbd72, gra/src/battle/battleScene.ts).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_gen.mjs
// Wycieta logika (bez typow TS, bez `this.`): blok _checkEnd 10184-10186 oraz 10208-10220.
// Wejscia: deterministyczny PRNG (mulberry32, ziarno 217). Wynik -> p6_siege_tactics_vectors/vectors.json.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- wycieta z battleScene.ts:10184-10186 ---
function repelsAttack(isSiege, wallEverBreached) {
  // if (isSiege && !this.wallEverBreached) { ...; aliveA = false; }
  return isSiege && !wallEverBreached;
}

// --- wycieta z battleScene.ts:10208-10220 (zwraca 'atakujacy' | 'obronca' | null = `return false`) ---
function winnerOf(aliveA, aliveD, units) {
  if (aliveA && aliveD) return null;
  let winner;
  if (aliveA && !aliveD) winner = 'atakujacy';
  else if (aliveD && !aliveA) winner = 'obronca';
  else {
    const hpA = units.atk.reduce((s, hp) => s + Math.max(0, hp), 0);
    const hpD = units.def.reduce((s, hp) => s + Math.max(0, hp), 0);
    winner = hpA >= hpD ? 'atakujacy' : 'obronca';
  }
  return winner;
}

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
const HP_POOL = [0, 0, 1, 5, 12.5, 40, 99, 100, -3, -0.5];

function randomHpList(maxLen) {
  const n = Math.floor(rnd() * (maxLen + 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    const pick = rnd();
    out.push(pick < 0.3 ? HP_POOL[Math.floor(rnd() * HP_POOL.length)] : Math.round(rnd() * 200) / 2);
  }
  return out;
}

const repelCases = [];
for (const isSiege of [false, true]) {
  for (const wallEverBreached of [false, true]) {
    repelCases.push({ isSiege, wallEverBreached, expect: repelsAttack(isSiege, wallEverBreached) });
  }
}

const winnerCases = [];
// Siatka flag zycia x przypadki HP (kluczowe: remis HP -> atakujacy, ujemne HP obcinane do 0, pusta lista).
const fixedHp = [
  { atk: [], def: [] },
  { atk: [0], def: [0] },
  { atk: [10], def: [10] },
  { atk: [10, 0], def: [9, 1] },
  { atk: [-5, 3], def: [2] },
  { atk: [-5], def: [-7] },
  { atk: [0.5, 0.25], def: [0.75] },
  { atk: [100, 50], def: [99.5, 50.5] },
];
for (const aliveA of [false, true]) {
  for (const aliveD of [false, true]) {
    for (const units of fixedHp) {
      winnerCases.push({ aliveA, aliveD, atk: units.atk, def: units.def, expect: winnerOf(aliveA, aliveD, units) });
    }
  }
}
// Losowe przypadki (seed 217), tylko gdy obie strony nie zyja lub jedna strona zyje.
for (let k = 0; k < 400; k++) {
  const aliveA = rnd() < 0.5;
  const aliveD = rnd() < 0.5;
  const units = { atk: randomHpList(6), def: randomHpList(6) };
  winnerCases.push({ aliveA, aliveD, atk: units.atk, def: units.def, expect: winnerOf(aliveA, aliveD, units) });
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75, linie 10184-10186 i 10208-10220',
  generator: 'rust-port/engine/tests/p6_siege_tactics_gen.mjs (node ' + process.version + ', seed 217)',
  repels: repelCases,
  winner: winnerCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, null, 1) + '\n');
console.log('repels', repelCases.length, 'winner', winnerCases.length);
