// R-RUSTPORT-P6-W6S-LOCKS-Q1: generator wektorów dla `resolve_diplomacy_action_lock` (Rust).
//
// Źródło prawdy: web `gra/src/game/diplomacy-locks.ts` z PINOWANEGO commita (domyślnie
// 07d2fbd72f758705f8e1d59cc4968027ffbafe75). Kod webu NIE jest kopiowany do repo: generator
// wypakowuje go poza repo (`git archive <pin> gra/src gra/data | tar -x -C <work>/web`),
// bundluje przez esbuild (poza repo) i wywołuje `resolveDiplomacyActionLock` na deterministycznej
// siatce kontekstów (ziarno PRNG stałe, wartości progowe ±1 wokół progów, NaN/Infinity, pola `?:`
// nieobecne).
//
// Użycie (z katalogu głównego repo):
//   node rust-port/engine/tests/p6_w6s_locks_gen.mjs \
//     --web <work>/web/gra/src --esbuild <work>/esb/node_modules/esbuild \
//     --work <work>/bundle --out rust-port/engine/tests/p6_w6s_locks_vectors/locks.json
//
// Format wiersza: { "ctx": {...}, "want": {locked, note, active, requirement|null} }.
// Liczby NaN/Infinity/-Infinity jako stringi. Pole web nieobecne => brak klucza w `ctx`
// (Rust: None / false) albo `null` w `requirement`.

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const webSrc = resolve(arg('--web', ''));
const esbuildDir = resolve(arg('--esbuild', ''));
const workDir = resolve(arg('--work', ''));
const outFile = resolve(arg('--out', 'rust-port/engine/tests/p6_w6s_locks_vectors/locks.json'));
const ROWS = Number(arg('--rows', '3000'));

if (!webSrc || !esbuildDir || !workDir || !existsSync(join(webSrc, 'game', 'diplomacy-locks.ts'))) {
  console.error('Brak --web/--esbuild/--work albo brak diplomacy-locks.ts pod --web.');
  process.exit(2);
}

const require = createRequire(import.meta.url);
const esbuild = require(esbuildDir);

mkdirSync(workDir, { recursive: true });
const bundlePath = join(workDir, 'diplomacy-locks.bundle.mjs');
await esbuild.build({
  entryPoints: [join(webSrc, 'game', 'diplomacy-locks.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: bundlePath,
  logLevel: 'error',
});
const { resolveDiplomacyActionLock } = await import(pathToFileURL(bundlePath).href);

// PRNG mulberry32 (deterministyczny).
let seed = 0x6a09e667;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const chance = (p) => rnd() < p;

const ACTION_IDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
const OTHER_IDS = ['1', '16', '0', '', 'x'];

const PROG_NAMES = [
  'progNapRelacja', 'progHandelRelacja', 'progSojuszRelacja', 'progSojuszZaufanie',
  'progGraniceRelacja', 'progGraniceZaufanie', 'progWymianaTechZaufanie',
  'progNamowWojneZaufanie', 'progWasalizacjaRespekt', 'progTrybutZadanieMinRespekt',
  'progDarRelacja',
];

// Wartość liczbowa: zwykle 0..120, czasem wokół progu (±1), rzadko NaN/Infinity.
function num(near) {
  if (chance(0.01)) return NaN;
  if (chance(0.005)) return chance(0.5) ? Infinity : -Infinity;
  if (near !== undefined && chance(0.35)) {
    return near + pick([-1, 0, 1]);
  }
  return Math.floor(rnd() * 121);
}

function randomCtx(i) {
  const actionId = i % 25 < 20 ? pick(ACTION_IDS) : pick(OTHER_IDS);
  const prog = {};
  for (const p of PROG_NAMES) prog[p] = 10 + Math.floor(rnd() * 80);
  const rel = num(prog.progHandelRelacja);
  const zauf = num(prog.progSojuszZaufanie);
  const ctx = {
    actionId,
    contact: chance(0.8),
    atWar: chance(0.3),
    relTotal: rel,
    zaufanie: zauf,
    respekt: num(prog.progTrybutZadanieMinRespekt),
    hasNap: chance(0.3),
    hasHandel: chance(0.2),
    hasTradeConnection: chance(0.8),
    hasSojusz: chance(0.1),
    sellableTechCount: pick([0, 0, 1, 3]),
    buyableTechCount: pick([0, 0, 2]),
    knownRivalsCount: pick([0, 1, 2]),
    ...prog,
    karaWspolnaGranica: chance(0.2),
    napAgresorAktywny: chance(0.1),
    isCityStatePartner: chance(0.2),
    hasWasal: chance(0.2),
  };
  // Pola opcjonalne web: raz obecne, raz nieobecne (undefined => brak klucza).
  if (chance(0.7)) ctx.hasTradeTechSelf = chance(0.7);
  if (chance(0.7)) ctx.hasTradeTechOther = chance(0.7);
  if (chance(0.5)) ctx.hasWymiana = chance(0.4);
  if (chance(0.5)) ctx.hasGranice = chance(0.4);
  if (chance(0.15)) ctx.breaksTreatyLabel = pick(['Paktu o nieagresji', 'Sojusz']);
  if (chance(0.6)) ctx.progNapZaufanie = pick([20, 30, 40]);
  if (chance(0.6)) ctx.progWchloniecieRespekt = pick([80, 90, 95]);
  if (chance(0.6)) ctx.wasalAgeTurns = pick([0, 5, 9, 10, 11, 25]);
  if (chance(0.6)) ctx.graczWchlonieciePoWasaluTur = pick([5, 10, 12]);
  // Wartości progowe lekko przesuwane, by trafić w bramki „dokładnie na progu".
  if (ctx.progNapZaufanie === undefined && chance(0.3)) ctx.zaufanie = 30 + pick([-1, 0, 1]);
  return ctx;
}

// Kodowanie do JSON: NaN/Infinity jako stringi (spójnie z parserem w teście Rust).
function enc(v) {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    return v;
  }
  return v;
}

function encCtx(ctx) {
  const out = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v === undefined) continue;
    out[k] = enc(v);
  }
  return out;
}

const rows = [];
for (let i = 0; i < ROWS; i++) {
  const ctx = randomCtx(i);
  const res = resolveDiplomacyActionLock(ctx);
  rows.push({
    ctx: encCtx(ctx),
    want: {
      locked: res.locked === true,
      note: String(res.note ?? ''),
      active: res.active === true,
      requirement: res.requirement
        ? { kind: res.requirement.kind, prog: enc(res.requirement.prog), masz: enc(res.requirement.masz) }
        : null,
    },
  });
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(rows) + '\n');
const locked = rows.filter((r) => r.want.locked).length;
const active = rows.filter((r) => r.want.active).length;
console.log(`rows=${rows.length} locked=${locked} active=${active} out=${outFile}`);
