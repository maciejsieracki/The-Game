'use strict';
/**
 * brick-cycles-75-100-test.cjs -- R-WEB-BRICK-CYCLES-75-100-Q1 (decyzja wlasciciela 2026-11-11):
 * cykle Cegielni jawnie per epoka wlasciciela: era1 = 50, era2 = 75, era3+ = 100 (carry-forward).
 * Mnoznik WYJSCIA cegly 1 / 1,5 / 2 bez zmian; receptura 2 glina + 1 drewno -> 2 cegly bez zmian.
 * Pelny Braz (150 gliny / 75 drewna) -> 225 cegiel; pelne Zelazo (200 gliny / 100 drewna) -> 400 cegiel.
 * Run from gra/:  node tools/brick-cycles-75-100-test.cjs
 */
const fs = require('fs'), path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.brick-cycles-entry.ts'), BUNDLE = path.resolve(__dirname, '.brick-cycles-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { DEFAULT_CONVERTER_RECIPES, loadThroughput, runConverter, runConverters, converterThroughputEraParamKey,
  converterThroughputsForEra, converterOutputMultiplierForEra, converterProductionDisplayForBuilding,
  CONVERTER_OUTPUT_MULT_KEY_SUFFIX } from '../src/game/converters';
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
const econ = require(path.join(GRA, 'data', 'econ-params.json'));
let passed = 0, failed = 0;
const eq = (a, b, m) => { if (a === b) passed++; else { failed++; console.error(`  FAIL: ${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); } };
const rec = id => M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === id);
const cegielnia = rec('cegielnia');
// Odwzorowanie sciezki silnika (turn-economy.ts / main.ts): baseOf czyta wiersz epoki z econ-params.
const throughputsFor = (era, diff = 'normal') => M.converterThroughputsForEra(
  (r, e) => { const k = M.converterThroughputEraParamKey(r, e); return M.loadThroughput(econ, k ?? r.throughputParamKey, diff, r.throughputFallback); },
  era);

console.log('-- A. dane econ-params: cykle Cegielni per epoka, parytet trudnosci --');
for (const d of ['easy', 'normal', 'hard']) {
  eq(M.loadThroughput(econ, 'budynek_cegielnia_przepustowosc', d, -1), 50, `era1 ${d} = 50`);
  eq(M.loadThroughput(econ, 'budynek_cegielnia_epoka2_przepustowosc', d, -1), 75, `era2 ${d} = 75`);
  eq(M.loadThroughput(econ, 'budynek_cegielnia_epoka3_przepustowosc', d, -1), 100, `era3 ${d} = 100`);
}

console.log('-- B. receptura bez zmian (wejscia, x2 cegly, mnozniki wyjscia) --');
eq(JSON.stringify(cegielnia.inputs), JSON.stringify({ glina: 2, drewno: 1 }), 'wejscia 2 glina + 1 drewno');
eq(cegielnia.outputAmount, 2, 'outputAmount 2');
eq(M.converterOutputMultiplierForEra('cegielnia', 1), 1, 'mnoznik wyjscia era1 = 1');
eq(M.converterOutputMultiplierForEra('cegielnia', 2), 1.5, 'mnoznik wyjscia era2 = 1,5');
eq(M.converterOutputMultiplierForEra('cegielnia', 3), 2, 'mnoznik wyjscia era3 = 2');

console.log('-- C. klucz wiersza epoki (carry-forward ostatniej skonfigurowanej) --');
const keyOf = e => M.converterThroughputEraParamKey(cegielnia, e);
eq(keyOf(1), 'budynek_cegielnia_przepustowosc', 'era1 -> wiersz bazowy');
eq(keyOf(2), 'budynek_cegielnia_epoka2_przepustowosc', 'era2 -> epoka2');
eq(keyOf(3), 'budynek_cegielnia_epoka3_przepustowosc', 'era3 -> epoka3');
eq(keyOf(4), 'budynek_cegielnia_epoka3_przepustowosc', 'era4 carry-forward -> epoka3');
eq(keyOf(0), 'budynek_cegielnia_przepustowosc', 'era0 traktowane jak era1');

console.log('-- D. cykle (throughput) per epoka w mapie silnika --');
eq(throughputsFor(1).cegielnia, 50, 'mapa era1: 50 cykli');
eq(throughputsFor(2).cegielnia, 75, 'mapa era2: 75 cykli');
eq(throughputsFor(3).cegielnia, 100, 'mapa era3: 100 cykli');
eq(throughputsFor(5).cegielnia, 100, 'mapa era5: 100 cykli (carry-forward)');
eq(throughputsFor(2, 'easy').cegielnia, 75, 'mapa era2 easy: 75');
eq(throughputsFor(3, 'hard').cegielnia, 100, 'mapa era3 hard: 100');
eq(throughputsFor(3)['cegielnia' + M.CONVERTER_OUTPUT_MULT_KEY_SUFFIX], 2, 'mapa era3: mnoznik wyjscia 2 nadal obecny');

console.log('-- E. pelne wejscia: Braz 150 glina/75 drewna (era2), Zelazo 200/100 (era3) --');
{
  const r2 = M.runConverter(cegielnia, { glina: 150, drewno: 75 }, 75, 99999, M.converterOutputMultiplierForEra('cegielnia', 2));
  eq(r2.produced, 225, 'era2 pelne wejscia 150/75 -> 225 cegiel');
  eq(r2.consumed.glina, 150, 'era2 zuzycie gliny 150');
  eq(r2.consumed.drewno, 75, 'era2 zuzycie drewna 75');
  const r3 = M.runConverter(cegielnia, { glina: 200, drewno: 100 }, 100, 99999, M.converterOutputMultiplierForEra('cegielnia', 3));
  eq(r3.produced, 400, 'era3 pelne wejscia 200/100 -> 400 cegiel');
  eq(r3.consumed.glina, 200, 'era3 zuzycie gliny 200');
  eq(r3.consumed.drewno, 100, 'era3 zuzycie drewna 100');
  const r1 = M.runConverter(cegielnia, { glina: 9000, drewno: 9000 }, 50, 99999, 1);
  eq(r1.produced, 100, 'era1 50 cykli x 2 = 100 cegiel (bez zmian)');
}

console.log('-- F. limity wejscia i wyjscia nadal dzialaja --');
eq(M.runConverter(cegielnia, { glina: 100, drewno: 9000 }, 75, 99999, 1.5).produced, 150, 'limit gliny 100 -> 50 cykli x 2 x 1,5 = 150');
eq(M.runConverter(cegielnia, { glina: 9000, drewno: 40 }, 75, 99999, 1.5).produced, 120, 'limit drewna 40 -> 40 cykli x 2 x 1,5 = 120');
eq(M.runConverter(cegielnia, { glina: 9000, drewno: 9000 }, 75, 51, 1.5).produced, 51, 'limit wyjscia: wolne 51 -> floor(51/3)=17 cykli x 3 = 51');

console.log('-- G. panel miasta (converterProductionDisplayForBuilding) per epoka --');
const d1 = M.converterProductionDisplayForBuilding('cegielnia', econ, 'normal', 1);
const d2 = M.converterProductionDisplayForBuilding('cegielnia', econ, 'normal', 2);
const d3 = M.converterProductionDisplayForBuilding('cegielnia', econ, 'normal', 3);
eq(d1.produced.cegla, 100, 'panel era1: 100 cegiel (50 x 2)');
eq(d2.produced.cegla, 225, 'panel era2: 225 cegiel (75 x 2 x 1,5)');
eq(d2.consumed.glina, 150, 'panel era2: glina 150');
eq(d2.consumed.drewno, 75, 'panel era2: drewno 75');
eq(d3.produced.cegla, 400, 'panel era3: 400 cegiel (100 x 2 x 2)');
eq(d3.consumed.glina, 200, 'panel era3: glina 200');
eq(d3.consumed.drewno, 100, 'panel era3: drewno 100');

console.log('-- H. pozostale receptury bez zmian (garncarnia/huta) --');
eq(M.loadThroughput(econ, 'budynek_garncarnia_przepustowosc', 'normal', -1), 50, 'garncarnia baza 50');
eq(Math.abs(M.converterThroughputsForEra(r => r.throughputFallback, 2).garncarnia - 55) < 1e-9, true, 'garncarnia era2 +10% bazy (55) bez zmian');
eq(M.converterThroughputsForEra(r => r.throughputFallback, 2).huta, 50, 'huta plaska');

console.log(`\nbrick-cycles-75-100-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(failed ? 1 : 0);
