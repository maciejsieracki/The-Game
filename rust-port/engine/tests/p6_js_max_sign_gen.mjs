// P6 JS-MAX-SIGN (R-RUSTPORT-P6-JS-MAX-SIGN-Q1): generator wektorow dla wspolnych helperow
// `js_max` / `js_min` (siege_tactics_blow.rs) ze znakiem zera.
//
// Wektory powstaja przez WYKONANIE wbudowanych `Math.max` / `Math.min` (silnik JS, ta sama semantyka
// co w pinie 07d2fbd72, gdzie wolane sa te funkcje). Straznik: SHA-256 tekstu pinu pliku
// `gra/src/game/combat.ts` oraz sprawdzenie, ze pin wola Math.max / Math.min.
//
// Uruchomienie: node rust-port/engine/tests/p6_js_max_sign_gen.mjs
// Wynik -> p6_js_max_sign_vectors/signed.json
// Kodowanie: NaN, Infinity, -Infinity i -0 jako napisy (JSON nie zachowuje znaku zera: JSON.stringify(-0) === "0").

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SRC = 'gra/src/game/combat.ts';
// Oczekiwany skrot tekstu pinu (straznik); wartosc zapisana po pierwszym uruchomieniu na PINIE.
const EXPECT_SRC_SHA256 = '1de2bc6f1ceb86f116e3ea650b34939acca04eaad8f78e218ffc464facb20bce';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_js_max_sign_vectors');
const outPath = join(outDir, 'signed.json');

const src = execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${SRC}`], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const srcSha = createHash('sha256').update(src).digest('hex');
console.error(`combat.ts sha256 = ${srcSha}`);
if (srcSha !== EXPECT_SRC_SHA256) {
  throw new Error('straznik: combat.ts w pinie zmieniony');
}
if (!/Math\.max\(/.test(src) || !/Math\.min\(/.test(src)) {
  throw new Error('straznik: pin nie wola Math.max / Math.min');
}

// Deterministyczny PRNG (mulberry32, ziarno 7741).
let seed = 7741 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FRAC = () => Math.round((rnd() * 200 - 100) * 8) / 8; // ulamki w kwantach 1/8
const SPECIAL = [NaN, Infinity, -Infinity, 0, -0, 1, -1, 0.5, -0.5, 2.25, 1e308, -5e-324];
const VALS = [...SPECIAL, ...Array.from({ length: 8 }, FRAC)];

const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  return x;
};

const rows = [];
for (const a of VALS) {
  for (const b of VALS) {
    rows.push({ a: enc(a), b: enc(b), max: enc(Math.max(a, b)), min: enc(Math.min(a, b)) });
  }
}
// Losowe pary z przewaga zer, -0 i NaN (ponad siatke).
const pick = () => {
  const r = rnd();
  if (r < 0.15) return 0;
  if (r < 0.3) return -0;
  if (r < 0.35) return NaN;
  return FRAC();
};
for (let i = 0; i < 120; i++) {
  const a = pick();
  const b = pick();
  rows.push({ a: enc(a), b: enc(b), max: enc(Math.max(a, b)), min: enc(Math.min(a, b)) });
}

const signedZeroRows = rows.filter((r) => r.a === '-0' || r.b === '-0').length;
if (rows.length < 200 || signedZeroRows < 20) {
  throw new Error(`za malo wektorow: ${rows.length}/${signedZeroRows}`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify({ pin: PIN, src_sha256: srcSha, count: rows.length, rows }, null, 1) + '\n');
console.error(`zapisano ${rows.length} przypadkow (z -0: ${signedZeroRows}) -> ${outPath}`);
