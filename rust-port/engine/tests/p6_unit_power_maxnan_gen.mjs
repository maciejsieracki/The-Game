// P6 UNIT-POWER-MAXNAN (R-RUSTPORT-P6-UNIT-POWER-MAXNAN-Q1): generator wektorow NaN/Inf dla funkcji
// `Math.max`/`Math.min` z pinu, wykonywanych z TEKSTU PINU (nie z przepisanej kopii).
//
// Wykonywane (tekst pinu, po zdjeciu typow TypeScript): hitChanceTw, rangeDamageTw, rangedShotAccuracy
// z gra/src/game/combat.ts (PIN 07d2fbd72), TW = tw_v3 z gra/data/combat-params.json (PIN).
//
// Uruchomienie: node rust-port/engine/tests/p6_unit_power_maxnan_gen.mjs
// Wynik -> p6_unit_power_maxnan_vectors/maxnan.json (wartosci NaN/Infinity jako napisy, bo JSON ich nie zna).
//
// Straznik: SHA-256 wycietych fragmentow pinu i SHA-256 combat-params.json. Zmiana pinu -> blad zamiast cichych wektorow.
//
// Nie generowane: rangedShotDamage (pin combat.ts:485) zwraca liczbe calkowita (Rust: i64), wiec wynik NaN
// nie ma reprezentacji w typie; wektory tej funkcji pokrywaja wylacznie wartosci skonczone (istniejace testy).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const COMBAT = 'gra/src/game/combat.ts';
const PARAMS = 'gra/data/combat-params.json';
// Oczekiwane skroty (straznik): wartosci zapisane po pierwszym uruchomieniu na PINIE.
const EXPECT_FRAGMENT_SHA256 = '3f57e2ba744179a2620e2e352770ee81db077458ad7f130294758d4e4f97ad0e';
const EXPECT_PARAMS_SHA256 = '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_unit_power_maxnan_vectors');
const outPath = join(outDir, 'maxnan.json');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const gitShow = (path) =>
  execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function extractFn(src, name) {
  const m = new RegExp(`export function ${name}\\(`).exec(src);
  if (!m) throw new Error(`brak ${name} w pinie ${PIN}`);
  const end = src.indexOf('\n}\n', m.index);
  if (end < 0) throw new Error(`nie znaleziono konca ${name}`);
  return src.slice(m.index, end + 3).replace(/^export /, '');
}

const combatSrc = gitShow(COMBAT);
const fragmentTs = ['hitChanceTw', 'rangeDamageTw', 'rangedShotAccuracy'].map((n) => extractFn(combatSrc, n)).join('\n');
const fragmentSha = sha(fragmentTs);
const paramsText = gitShow(PARAMS);
const paramsSha = sha(paramsText);
console.error(`fragment sha256 = ${fragmentSha}`);
console.error(`combat-params sha256 = ${paramsSha}`);
if (fragmentSha !== EXPECT_FRAGMENT_SHA256) {
  throw new Error('straznik: fragment combat.ts w pinie zmieniony');
}
if (paramsSha !== EXPECT_PARAMS_SHA256) {
  throw new Error('straznik: combat-params.json w pinie zmieniony');
}

const tw = JSON.parse(paramsText).tw_v3;
const fragmentJs = stripTypeScriptTypes(fragmentTs);
const { hitChanceTw, rangeDamageTw, rangedShotAccuracy } = new Function(
  'TW',
  `${fragmentJs}\nreturn { hitChanceTw, rangeDamageTw, rangedShotAccuracy };`,
)(tw);

// Deterministyczny PRNG (mulberry32, ziarno 6601).
let seed = 6601 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randFinite = () => Math.round((rnd() * 240 - 120) * 2) / 2;

const SPECIAL = [NaN, Infinity, -Infinity, 0, -0, -1, 2.5, 40, 75, 1e308]; // -0: Math.max(-0,+0)=+0, Math.min(+0,-0)=-0 (K5I2b2)
const VALS = [...SPECIAL, ...Array.from({ length: 6 }, randFinite)];
const BONUS = [0, -0, NaN, Infinity, -Infinity, 7.5];

// -0 jako napis '-0' (JSON.stringify(-0) === '0' gubi znak).
const enc = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : Object.is(x, -0) ? '-0' : x);

const acc = [];
for (const melee of VALS) for (const missile of VALS) {
  acc.push({ melee: enc(melee), missile: enc(missile), expected: enc(rangedShotAccuracy(melee, missile)) });
}
const hits = [];
for (const atk of VALS) for (const def of VALS) for (const bonus of BONUS) {
  hits.push({ atk: enc(atk), def: enc(def), bonus: enc(bonus), expected: enc(hitChanceTw(atk, def, bonus)) });
}
const ranges = [];
for (const missile of VALS) for (const armor of VALS) {
  ranges.push({ missile: enc(missile), armor: enc(armor), expected: enc(rangeDamageTw(missile, armor)) });
}

const nanCount = (rows, key) => rows.filter((r) => r[key] === 'NaN').length;
const out = {
  source: { pin: PIN, file: COMBAT, fragmentSha256: fragmentSha, paramsFile: PARAMS, paramsSha256: paramsSha },
  tw_v3: tw,
  counts: { acc: acc.length, hits: hits.length, ranges: ranges.length },
  acc,
  hits,
  ranges,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.error(
  `zapisano ${outPath}: acc=${acc.length} (NaN w expected=${nanCount(acc, 'expected')}), ` +
    `hits=${hits.length} (NaN=${nanCount(hits, 'expected')}), ranges=${ranges.length} (NaN=${nanCount(ranges, 'expected')})`,
);
