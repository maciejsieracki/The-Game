// P6 RANGED-DAMAGE-NAN (R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1): generator wektorow dla `rangedShotDamage`
// z pinu, wykonywanych z TEKSTU PINU (nie z przepisanej kopii), wlacznie z NaN/Infinity.
//
// Wykonywane (tekst pinu, po zdjeciu typow TypeScript): rangedShotDamage, rangeDamageTw
// z gra/src/game/combat.ts oraz rangedDamageMultFor z gra/src/game/unit-power.ts (PIN 07d2fbd72).
// RANGED_DAMAGE_MULT = wartosc z gra/data/combat-params.json (PIN).
//
// Uruchomienie: node rust-port/engine/tests/p6_ranged_damage_nan_gen.mjs
// Wynik -> p6_ranged_damage_nan_vectors/ranged.json (NaN/Infinity jako napisy).
//
// Straznik: SHA-256 wycietych fragmentow pinu i SHA-256 combat-params.json.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const COMBAT = 'gra/src/game/combat.ts';
const UNIT_POWER = 'gra/src/game/unit-power.ts';
const PARAMS = 'gra/data/combat-params.json';
// Oczekiwane skroty (straznik): wartosci zapisane po pierwszym uruchomieniu na PINIE.
const EXPECT_FRAGMENT_SHA256 = '3a9325c769ab07605a52d4992cf15dfaa3441f15f5bc8b5d36b1fc832b187178';
const EXPECT_PARAMS_SHA256 = '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_ranged_damage_nan_vectors');
const outPath = join(outDir, 'ranged.json');

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
const unitPowerSrc = gitShow(UNIT_POWER);
const fragmentTs = [extractFn(combatSrc, 'rangeDamageTw'), extractFn(combatSrc, 'rangedShotDamage')].join('\n');
const multTs = extractFn(unitPowerSrc, 'rangedDamageMultFor');
const fragmentSha = sha(fragmentTs + '\n' + multTs);
const paramsText = gitShow(PARAMS);
const paramsSha = sha(paramsText);
console.error(`fragment sha256 = ${fragmentSha}`);
console.error(`combat-params sha256 = ${paramsSha}`);
if (fragmentSha !== EXPECT_FRAGMENT_SHA256) {
  throw new Error(`straznik: fragment combat.ts/unit-power.ts w pinie zmieniony (${fragmentSha})`);
}
if (paramsSha !== EXPECT_PARAMS_SHA256) {
  throw new Error('straznik: combat-params.json w pinie zmieniony');
}

const params = JSON.parse(paramsText);
const fragmentJs = stripTypeScriptTypes(fragmentTs);
const multJs = stripTypeScriptTypes(multTs);
const { rangedShotDamage } = new Function(
  'RANGED_DAMAGE_MULT',
  `${multJs}\n${fragmentJs}\nreturn { rangedShotDamage };`,
)(params.ranged_damage_mult);

// Deterministyczny PRNG (mulberry32, ziarno 6602).
let seed = 6602 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randFinite = () => Math.round((rnd() * 240 - 120) * 2) / 2;

const enc = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : x);

const MISSILE = [NaN, Infinity, -Infinity, 0, -0, -1, 0.5, 2.5, 12.25, 40, 75, 1e308, ...Array.from({ length: 3 }, randFinite)];
const ARMOR = [NaN, Infinity, -Infinity, 0, -0, 1, 3.5, 5, 40, 1e308, ...Array.from({ length: 3 }, randFinite)];
const COUNTER = [NaN, Infinity, -Infinity, 0, -0, 0.5, 0.49999999999999994, 1, 1.5, 2.5, 3, -2, 1e308];
// [Typ, Jednostka]; null = brak pola (JS undefined).
const UNITS = [
  [null, null],
  ['Slinger', 'Procarz'],
  [' Slinger ', 'Procarz (Huaracoc)'],
  ['Distance', 'Łucznik'],
  ['Distance', 'łucznik piesi'],
  ['Distance', 'Oszczepnik'],
  ['Mount', 'Łucznik'],
  ['Distance', null],
  [null, 'Łucznik'],
];

const toUnit = (typ, jed) => ({ counterTyp: typ ?? undefined, typNazwa: jed ?? undefined });

const rows = [];
let idx = 0;
for (const [typ, jed] of UNITS) for (const m of MISSILE) for (const a of ARMOR) for (const c of COUNTER) {
  // Probkowanie deterministyczne: co czwarta kombinacja (wartosci brzegowe pokryte przez pelny przebieg nizej).
  idx += 1;
  if (idx % 4 !== 0) continue;
  rows.push({
    typ,
    jednostka: jed,
    missile: enc(m),
    armor: enc(a),
    counter: enc(c),
    expected: enc(rangedShotDamage(toUnit(typ, jed), m, a, c)),
  });
}

// Pelny przeglad par (missile, armor) przy kontrze 1 i przy kazdej kontrze specjalnej dla Procarza.
for (const m of MISSILE) for (const a of ARMOR) for (const c of COUNTER) {
  rows.push({
    typ: 'Slinger',
    jednostka: 'Procarz',
    missile: enc(m),
    armor: enc(a),
    counter: enc(c),
    expected: enc(rangedShotDamage(toUnit('Slinger', 'Procarz'), m, a, c)),
  });
}

const nanCount = rows.filter((r) => r.expected === 'NaN').length;
const infCount = rows.filter((r) => r.expected === 'Infinity').length;
const out = {
  source: { pin: PIN, files: [COMBAT, UNIT_POWER], fragmentSha256: fragmentSha, paramsFile: PARAMS, paramsSha256: paramsSha },
  ranged_damage_mult: params.ranged_damage_mult,
  counts: { rows: rows.length, nanExpected: nanCount, infExpected: infCount },
  rows,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(out) + '\n');
console.error(`zapisano ${outPath}: rows=${rows.length} (NaN=${nanCount}, Infinity=${infCount})`);
