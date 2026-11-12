// P6 JS-MAX0 (R-RUSTPORT-P6-JS-MAX0-HARDENING-Q1): generator wektorow dla `Math.max(0, x)`
// uzywanego w modulach oblezenia (siege_tactics_{breach,end,endcheck,unit,activate}.rs).
//
// Wektory powstaja przez WYKONANIE wbudowanego `Math.max(0, x)` (silnik JS). Straznik: SHA-256 tekstu pinu
// `gra/src/game/combat.ts` (ta sama wartosc co w p6_js_max_sign_gen.mjs) oraz obecnosc `Math.max(` w pinie.
//
// Uruchomienie: node rust-port/engine/tests/p6_js_max0_gen.mjs
// Wynik -> p6_js_max0_vectors/max0.json
// Kodowanie: NaN, Infinity, -Infinity i -0 jako napisy (JSON nie zachowuje znaku zera).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SRC = 'gra/src/game/combat.ts';
const EXPECT_SRC_SHA256 = '1de2bc6f1ceb86f116e3ea650b34939acca04eaad8f78e218ffc464facb20bce';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_js_max0_vectors');
const outPath = join(outDir, 'max0.json');

const src = execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${SRC}`], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const srcSha = createHash('sha256').update(src).digest('hex');
console.error(`combat.ts sha256 = ${srcSha}`);
if (srcSha !== EXPECT_SRC_SHA256) {
  throw new Error('straznik: combat.ts w pinie zmieniony');
}
if (!/Math\.max\(/.test(src)) {
  throw new Error('straznik: pin nie wola Math.max');
}

// Deterministyczny PRNG (mulberry32, ziarno 9127).
let seed = 9127 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FRAC = () => Math.round((rnd() * 400 - 200) * 8) / 8;
const SPECIAL = [NaN, Infinity, -Infinity, 0, -0, 1, -1, 0.5, -0.5, 1e308, -1e308, -5e-324, 5e-324];
const VALS = [...SPECIAL, ...Array.from({ length: 40 }, FRAC)];

const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  return x;
};

const rows = [];
for (const x of VALS) {
  rows.push({ x: enc(x), max0: enc(Math.max(0, x)) });
}
// Losowe wartosci z przewaga zer, -0, NaN i nieskonczonosci (ponad siatke).
const pick = () => {
  const r = rnd();
  if (r < 0.2) return 0;
  if (r < 0.4) return -0;
  if (r < 0.45) return NaN;
  if (r < 0.48) return Infinity;
  if (r < 0.51) return -Infinity;
  return FRAC();
};
for (let i = 0; i < 200; i++) {
  const x = pick();
  rows.push({ x: enc(x), max0: enc(Math.max(0, x)) });
}

const negZero = rows.filter((r) => r.x === '-0').length;
const nan = rows.filter((r) => r.x === 'NaN').length;
const inf = rows.filter((r) => r.x === 'Infinity' || r.x === '-Infinity').length;
if (rows.length < 100 || negZero < 10 || nan < 5 || inf < 5) {
  throw new Error(`za malo wektorow: ${rows.length} (-0: ${negZero}, NaN: ${nan}, Inf: ${inf})`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify({ pin: PIN, src_sha256: srcSha, count: rows.length, rows }, null, 1) + '\n');
console.error(`zapisano ${rows.length} przypadkow (-0: ${negZero}, NaN: ${nan}, Inf: ${inf}) -> ${outPath}`);
