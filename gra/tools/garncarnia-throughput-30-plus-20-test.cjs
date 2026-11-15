'use strict';
/**
 * garncarnia-throughput-30-plus-20-test.cjs -- R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1
 * (decyzja właściciela 2026-11-14, ABC A): przepustowość Garncarni = 30 / 50 / 70 / 90 / 110
 * cykli/turę dla epok właściciela 1-5 (liniowo +20 na epokę), ta sama dla gracza i AI.
 *
 * Bundluje PRAWDZIWE converters.ts (esbuild) i czyta PRAWDZIWY econ-params.json.
 * Pokrywa: (a) wartości per era 1-5 i brzegi era<1/NaN, trudności easy/normal/hard identyczne;
 * (c) wykonanie: 200 gliny + 200 drewna w epoce 3 -> 70 ceramiki, zużycie 70 gliny + 70 drewna;
 * (d) parytet: ta sama ścieżka (baseOf z wierszem epoki + runConverters) dla ownera gracza
 *     i AI przy tej samej epoce daje identyczny wynik.
 * Mutacja (powrót do 50 +10%/epokę) czerwieni asercje z tabeli EXPECTED.
 *
 * Run from gra/:  node tools/garncarnia-throughput-30-plus-20-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.garncarnia-era-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.garncarnia-era-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_CONVERTER_RECIPES, loadThroughput, runConverters,
  converterThroughputEraParamKey, converterThroughputForEra, converterThroughputsForEra,
} from '../src/game/converters';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE_FILE);
const econ = require('../data/econ-params.json');

let passed = 0, failed = 0;
function eq(a, b, msg) {
  if (a === b) passed++;
  else { failed++; console.error(`  FAIL: ${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}

const garncarnia = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'garncarnia');
const EXPECTED = [30, 50, 70, 90, 110]; // epoka 1..5

// Dokładnie ta sama baseOf co turn-economy.ts (throughputsForOwner): wiersz epoki, potem baza.
function baseOfFor(raw, diff) {
  return (recipe, era) => {
    const eraParamKey = M.converterThroughputEraParamKey(recipe, era);
    return M.loadThroughput(raw, eraParamKey ?? recipe.throughputParamKey, diff, recipe.throughputFallback);
  };
}

console.log('\n-- (a) przepustowosc per epoka 1-5, trudnosci, brzegi --');
for (const diff of ['easy', 'normal', 'hard']) {
  for (let e = 1; e <= 5; e++) {
    const tp = M.converterThroughputsForEra(baseOfFor(econ, diff), e);
    eq(tp.garncarnia, EXPECTED[e - 1], `${diff} era${e}: przepustowosc Garncarni = ${EXPECTED[e - 1]}`);
  }
}
eq(garncarnia.throughputFallback, 30, 'throughputFallback Garncarni = 30');
for (const e of [0, -3, NaN]) {
  const tp = M.converterThroughputsForEra(baseOfFor(econ, 'normal'), e);
  eq(tp.garncarnia, 30, `era=${e} traktowane jak era 1 (30)`);
}
eq(M.converterThroughputForEra('garncarnia', 30, 4), 30, 'converterThroughputForEra nie skaluje Garncarni (wiersze per era)');

console.log('\n-- (c) wykonanie: era 3, 200 gliny + 200 drewna -> 70 ceramiki, zuzycie 70+70 --');
{
  const tp = M.converterThroughputsForEra(baseOfFor(econ, 'normal'), 3);
  const res = M.runConverters([garncarnia], { glina: 200, drewno: 200 }, tp, () => 1e9);
  const pb = res.perBuilding.garncarnia;
  eq(pb.produced, 70, 'produkcja ceramiki w epoce 3 = 70');
  eq(pb.consumed.glina, 70, 'zuzycie gliny = 70');
  eq(pb.consumed.drewno, 70, 'zuzycie drewna = 70');
  eq(res.stores.ceramika, 70, 'magazyn ceramiki = +70');
  eq(res.stores.glina, 130, 'magazyn gliny = 200-70');
  eq(res.stores.drewno, 130, 'magazyn drewna = 200-70');
}

// UWAGA: sekcja (d) sprawdza wyłącznie DETERMINIZM tej samej funkcji przy identycznych wejściach
// (jeden owner-era = 3 dla obu stron). Realny parytet gracz/AI (dwa różne ownery, różne epoki
// w jednym wywołaniu advanceCityEconomy) pokrywa converter-era-scaling-test.cjs, sekcja E.
console.log('\n-- (d) determinizm: ta sama sciezka, identyczne wejscia (era 3, hard) -> identyczny wynik --');
{
  const tpPlayer = M.converterThroughputsForEra(baseOfFor(econ, 'hard'), 3);
  const tpAi     = M.converterThroughputsForEra(baseOfFor(econ, 'hard'), 3);
  const a = M.runConverters([garncarnia], { glina: 500, drewno: 500 }, tpPlayer, () => 1e9);
  const b = M.runConverters([garncarnia], { glina: 500, drewno: 500 }, tpAi, () => 1e9);
  eq(a.perBuilding.garncarnia.produced, b.perBuilding.garncarnia.produced, 'gracz vs AI produkcja (hard, era 3)');
  eq(a.perBuilding.garncarnia.produced, 70, 'hard era 3 = 70 (ta sama wartosc co normal)');
}

console.log(`\ngarncarnia-throughput-30-plus-20-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
