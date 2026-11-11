// R-RUSTPORT-P6-TICKDIPLO-GEN-Q1: generator wektorów dla `tickDiplomacy` (web) -> Rust
// `DiplomacyState::tick_pair` / `tick_relation`.
//
// Źródło prawdy: web `gra/src/game/diplomacy.ts` (`tickDiplomacy`) z PINOWANEGO commita
// (domyślnie 07d2fbd72f758705f8e1d59cc4968027ffbafe75). Kod webu NIE jest kopiowany do repo:
// generator wypakowuje `gra/src gra/data` poza repo (`git archive <pin> gra/src gra/data | tar -x -C <work>/web`),
// bundluje przez esbuild (poza repo) i wywołuje `tickDiplomacy` na deterministycznej siatce
// (ziarno PRNG stałe). Wejście: RelacjaDyplomatyczna (bez `stanWojny`, status slim) + TickCtx.
// Wyjście: { rdip_in, ctx, want: { zaufanie, respekt } }.
//
// Pominięte celowo (NIE_ZMIERZONO w Rust, brak pól w modelu Rust): `urazyHistoryczne` (zanik co
// 20 tur), `traktaty` (wygasanie), `relacjaOgolna` (pochodna), `stanWojny` (tylko slim status).
//
// Użycie (z katalogu głównego repo):
//   node rust-port/engine/tests/p6_tickdiplo_gen.mjs \
//     --web <work>/web/gra/src --esbuild <work>/esb/node_modules/esbuild \
//     --work <work>/bundle --pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75 \
//     --out rust-port/engine/tests/p6_tickdiplo_vectors/tick.json

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const webSrc = resolve(arg('--web', ''));
const esbuildDir = resolve(arg('--esbuild', ''));
const workDir = resolve(arg('--work', ''));
const pin = arg('--pin', '07d2fbd72f758705f8e1d59cc4968027ffbafe75');
const outFile = resolve(arg('--out', 'rust-port/engine/tests/p6_tickdiplo_vectors/tick.json'));
const ROWS = Number(arg('--rows', '2000'));

if (!webSrc || !esbuildDir || !workDir || !existsSync(join(webSrc, 'game', 'diplomacy.ts'))) {
  console.error('Brak --web/--esbuild/--work albo brak diplomacy.ts pod --web.');
  process.exit(2);
}

const require = createRequire(import.meta.url);
const esbuild = require(esbuildDir);

mkdirSync(workDir, { recursive: true });
const bundlePath = join(workDir, 'diplomacy.bundle.mjs');
await esbuild.build({
  entryPoints: [join(webSrc, 'game', 'diplomacy.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: bundlePath,
  logLevel: 'error',
});
const { tickDiplomacy, sharedBorderPenaltyForEpochs } = await import(pathToFileURL(bundlePath).href);

// PRNG mulberry32 (deterministyczny).
let seed = 0x3c6ef372;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const chance = (p) => rnd() < p;

// Wartość 0..100 z krokiem 0,1; czasem granice (0, 100) i tuż przy nich.
function trust() {
  if (chance(0.12)) return pick([0, 0.1, 0.5, 99.5, 99.9, 100]);
  return Math.round(rnd() * 1000) / 10;
}
// Wiarygodność: zwykle −100..100, czasem poza skalą (klamrowanie), czasem granice.
function cred() {
  if (chance(0.1)) return pick([-150, -100, -100.5, -1, 0, 0.5, 100, 100.5, 150]);
  return Math.round((rnd() * 240 - 120) * 10) / 10;
}

const STATUSES = ['wojna', 'pokoj', 'sojusz', 'neutralni'];
const TIERS = ['sojusz', 'nap', 'pokoj'];

const rows = [];
const cover = {
  war: 0, peace: 0, warPositiveDelta: 0,
  tier: { sojusz: 0, nap: 0, pokoj: 0, none: 0, deprecatedPakt: 0 },
  credUndef: 0, credSet: 0,
  border: { default: 0, bronze: 0, iron: 0 },
};

for (let i = 0; i < ROWS; i++) {
  const atWar = i % 4 === 0 || chance(0.2);
  const status = atWar ? 'wojna' : pick(STATUSES.filter((s) => s !== 'wojna'));
  const rdip = { status, zaufanie: trust(), respekt: trust() };

  const ctx = { turn: Math.floor(rnd() * 400) };
  if (chance(0.5)) ctx.aktywnyHandel = chance(0.5);
  // Tier pokoju: nowe pole; `aktywnyPakt` tylko gdy tier nieobecny (wariant deprecated).
  if (chance(0.5)) {
    ctx.pokojTrustTier = pick(TIERS);
  } else if (chance(0.25)) {
    ctx.aktywnyPakt = chance(0.5);
  }
  if (chance(0.5)) ctx.dobraWolaAktywna = chance(0.5);
  if (chance(0.5)) ctx.wspolnyWrog = chance(0.5);
  if (chance(0.5)) ctx.wspolnaReligia = chance(0.5);
  if (chance(0.5)) ctx.odmiennaReligia = chance(0.5);
  if (chance(0.5)) ctx.karaWspolnaGranica = chance(0.5);
  // Kara graniczna wg epoki pary (web: `karaWspolnaGranicaDelta` = sharedBorderPenaltyForEpochs).
  // Epoki 0..4 (0/1 -> -2, 2 -> Brąz -3, 3..4 -> Żelazo -4). Część wierszy bez delty (domyślna = epoka 1).
  if (ctx.karaWspolnaGranica && chance(0.7)) {
    ctx.epokaA = pick([0, 1, 2, 3, 4]);
    ctx.epokaB = pick([0, 1, 2, 3, 4]);
    ctx.karaWspolnaGranicaDelta = sharedBorderPenaltyForEpochs(ctx.epokaA, ctx.epokaB);
  }
  if (chance(0.6)) ctx.wiarygodnoscSelf = cred();

  const out = tickDiplomacy(
    { graczA: 'a', graczB: 'b', zaufanie: rdip.zaufanie, respekt: rdip.respekt,
      relacjaOgolna: rdip.zaufanie + rdip.respekt, traktaty: [], urazyHistoryczne: 0,
      kontaktNawiazany: true, status: rdip.status },
    ctx,
  );

  // Pokrycie (liczniki do raportu).
  if (atWar) cover.war++; else cover.peace++;
  const tier = ctx.pokojTrustTier ?? (ctx.aktywnyPakt ? 'nap' : undefined);
  if (ctx.pokojTrustTier === undefined && ctx.aktywnyPakt !== undefined) cover.tier.deprecatedPakt++;
  if (tier === undefined) cover.tier.none++; else cover.tier[tier]++;
  if (ctx.wiarygodnoscSelf === undefined) cover.credUndef++; else cover.credSet++;
  if (ctx.karaWspolnaGranica) {
    if (ctx.karaWspolnaGranicaDelta === undefined) cover.border.default++;
    else if (ctx.karaWspolnaGranicaDelta === -3) cover.border.bronze++;
    else if (ctx.karaWspolnaGranicaDelta === -4) cover.border.iron++;
  }
  if (atWar && out.zaufanie > rdip.zaufanie) cover.warPositiveDelta++;

  // Liczby ułamkowe jako stringi (JS `String(x)` = najkrótszy zapis round-trip): serde_json
  // bez feature `float_roundtrip` parsuje floaty nieprecyzyjnie (1 ULP), a Rust `str::parse`
  // jest poprawnie zaokrąglony. Wartość w teście = `"…".parse::<f64>()`.
  const ctxOut = { ...ctx };
  if (ctxOut.wiarygodnoscSelf !== undefined) ctxOut.wiarygodnoscSelf = String(ctx.wiarygodnoscSelf);
  if (ctxOut.karaWspolnaGranicaDelta !== undefined) ctxOut.karaWspolnaGranicaDelta = String(ctx.karaWspolnaGranicaDelta);
  rows.push({
    rel: { zaufanie: String(rdip.zaufanie), respekt: String(rdip.respekt), status: rdip.status },
    ctx: ctxOut,
    want: { zaufanie: String(out.zaufanie), respekt: String(out.respekt) },
  });
}

mkdirSync(join(outFile, '..'), { recursive: true });
const doc = { pin, generator: 'rust-port/engine/tests/p6_tickdiplo_gen.mjs', rows };
writeFileSync(outFile, JSON.stringify(doc, null, 1) + '\n');

console.log(`wiersze: ${rows.length} -> ${outFile}`);
console.log(`pokrycie: ${JSON.stringify(cover)}`);
