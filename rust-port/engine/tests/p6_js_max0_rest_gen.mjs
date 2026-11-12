// P6 JS-MAX0-REST (R-RUSTPORT-P6-JS-MAX0-REST-Q1): generator wektorow dla `Math.max(0, Math.floor(x))`
// z `gra/src/game/okolica.ts` (pin 07d2fbd72): funkcja `js_floor_nonneg` w rust-port/engine/src/domain/okolica.rs
// i jej uzycie w turn_economy_loop.rs (pole `population` miasta).
//
// Wektory powstaja przez WYKONANIE wbudowanego `Math.max(0, Math.floor(x))` (silnik JS). Straznik: SHA-256 tekstu pinu
// `gra/src/game/okolica.ts` oraz obecnosc `Math.max(0, Math.floor(` w pinie.
//
// Uruchomienie: node rust-port/engine/tests/p6_js_max0_rest_gen.mjs
// Wynik -> p6_js_max0_rest_vectors/max0_rest.json
// Kodowanie: NaN, Infinity, -Infinity i -0 jako napisy (JSON nie zachowuje znaku zera).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SRC = 'gra/src/game/okolica.ts';
const EXPECT_SRC_SHA256 = '6cb21115ecb6cd39e0a000acae4e610b753803b70801a159a816404a8a3cfb62';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_js_max0_rest_vectors');
const outPath = join(outDir, 'max0_rest.json');

const src = execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${SRC}`], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const srcSha = createHash('sha256').update(src).digest('hex');
console.error(`okolica.ts sha256 = ${srcSha}`);
if (srcSha !== EXPECT_SRC_SHA256) {
  throw new Error('straznik: okolica.ts w pinie zmieniony');
}
if (!/Math\.max\(0, Math\.floor\(/.test(src)) {
  throw new Error('straznik: pin nie wola Math.max(0, Math.floor(');
}

// Deterministyczny PRNG (mulberry32, ziarno 4421).
let seed = 4421 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FRAC = () => Math.round((rnd() * 400 - 200) * 8) / 8;
const SPECIAL = [NaN, Infinity, -Infinity, 0, -0, 1, -1, 0.5, -0.5, 0.99, -0.99, -0.0001, 1e308, -1e308, -5e-324, 5e-324];
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
  rows.push({ x: enc(x), floor_max0: enc(Math.max(0, Math.floor(x))) });
}
// Losowe wartosci z przewaga zer, -0, ulamkow ujemnych blisko zera, NaN i nieskonczonosci.
const pick = () => {
  const r = rnd();
  if (r < 0.2) return 0;
  if (r < 0.4) return -0;
  if (r < 0.5) return -rnd() * 0.999;
  if (r < 0.55) return NaN;
  if (r < 0.58) return Infinity;
  if (r < 0.61) return -Infinity;
  return FRAC();
};
for (let i = 0; i < 200; i++) {
  const x = pick();
  rows.push({ x: enc(x), floor_max0: enc(Math.max(0, Math.floor(x))) });
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
