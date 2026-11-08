'use strict';
/**
 * foundry-throughput-x2-era-mult-test.cjs -- R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1
 * (decyzja wlasciciela 2026-11-05): przepustowosc bazowa odlewni brazu / zelaza / wielkiej
 * odlewni 25 -> 50 cykli/ture + mnoznik epoki WLASCICIELA m(e) = 1 + 0,5 x (e - 1)
 * (1 / 1,5 / 2 / 2,5 / 3) stosowany do PRZEPUSTOWOSCI (cykli). Receptury i koszty bez zmian.
 * Huta (bez budynku) zostaje plaska. Wzor epoki = `citizenConsumptionEraMultiplier` (jedna definicja).
 * Run from gra/:  node tools/foundry-throughput-x2-era-mult-test.cjs
 */
const fs = require('fs'), path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.foundry-x2-entry.ts'), BUNDLE = path.resolve(__dirname, '.foundry-x2-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { DEFAULT_CONVERTER_RECIPES, loadThroughput, runConverter, converterThroughputForEra,
  converterOutputMultiplierForEra, converterThroughputsForEra, CONVERTER_OUTPUT_MULT_KEY_SUFFIX, runConverters,
  converterProductionDisplayForBuilding } from '../src/game/converters';
export { citizenConsumptionEraMultiplier } from '../src/game/citizen-consumption-era';
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
const D = f => require(path.join(GRA, 'data', f));
const econ = D('econ-params.json');
let passed = 0, failed = 0;
const eq = (a, b, m) => { if (a === b) passed++; else { failed++; console.error(`  FAIL: ${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); } };
const near = (a, b, m) => eq(Math.abs(a - b) < 1e-9, true, `${m} (got ${a}, want ${b})`);
const rec = id => M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === id);

const FOUNDRY_IDS = ['odlewnia_brazu', 'odlewnia_zelaza__braz', 'odlewnia_zelaza__zelazo',
  'wielka_odlewnia__braz', 'wielka_odlewnia__zelazo', 'wielka_odlewnia__stal'];
const KEYS = ['budynek_huta_przepustowosc', 'budynek_odlewnia_zelaza_przepustowosc', 'budynek_wielka_odlewnia_przepustowosc'];
const mult = [1, 1.5, 2, 2.5, 3];

console.log('-- A. dane: baza 25 -> 50 (3 klucze x 3 trudnosci), fallbacki receptur, wejscia/wyjscia bez zmian --');
for (const k of KEYS) for (const d of ['easy', 'normal', 'hard']) eq(M.loadThroughput(econ, k, d, -1), 50, `econ ${k} ${d} = 50`);
for (const id of FOUNDRY_IDS) eq(rec(id).throughputFallback, 50, `fallback ${id} = 50`);
eq(rec('huta').throughputFallback, 50, 'fallback huta = 50 (wspolny klucz, bez budynku)');
eq(JSON.stringify(rec('odlewnia_brazu').inputs), JSON.stringify({ ruda: 1, drewno: 1, ruda_cyny: 0.1 }), 'odlewnia brazu: wejscia bez zmian');
eq(JSON.stringify(rec('odlewnia_zelaza__zelazo').inputs), JSON.stringify({ ruda_zelaza: 1, drewno: 1 }), 'odlewnia zelaza: wejscia bez zmian');
eq(JSON.stringify(rec('wielka_odlewnia__stal').inputs), JSON.stringify({ zelazo: 1, drewno: 1 }), 'wielka odlewnia stal: wejscia bez zmian');
for (const id of FOUNDRY_IDS) eq(rec(id).outputAmount, 1, `${id}: outputAmount 1 bez zmian`);

console.log('-- B. wzor epoki: m(e) = citizenConsumptionEraMultiplier, stosowany do cykli odlewni --');
for (let e = 1; e <= 5; e++) {
  eq(M.citizenConsumptionEraMultiplier(e), mult[e - 1], `wspolna funkcja m(${e})`);
  for (const id of FOUNDRY_IDS) {
    near(M.converterThroughputForEra(id, 50, e), 50 * mult[e - 1], `${id} era${e}: cykle = 50 x m`);
    eq(M.converterOutputMultiplierForEra(id, e), 1, `${id} era${e}: brak mnoznika wyjscia`);
  }
  eq(M.converterThroughputForEra('huta', 50, e), 50, `huta era${e}: plaska`);
  eq(M.converterThroughputForEra('cegielnia', 50, e), 50, `cegielnia era${e}: cykle plaskie (BRICK)`);
  near(M.converterOutputMultiplierForEra('cegielnia', e), mult[e - 1], `cegielnia era${e}: mnoznik wyjscia 1/1,5/2/2,5/3 (BRICK)`);
  near(M.converterThroughputForEra('garncarnia', 50, e), 50 * (1 + 0.1 * (e - 1)), `garncarnia era${e}: nadal +10% cykli`);
}
eq(M.converterThroughputForEra('odlewnia_brazu', 50, 0), 50, 'era 0 -> m=1');
eq(M.converterThroughputForEra('odlewnia_brazu', 50, NaN), 50, 'era NaN -> m=1');
eq(M.converterThroughputForEra('odlewnia_brazu', 50, undefined), 50, 'era undefined -> m=1');

console.log('-- C. mapa dla runConverters (parytet gracz/AI): klucze odlewni z epoka wlasciciela --');
for (const e of [1, 2, 3, 4, 5]) {
  const map = M.converterThroughputsForEra(r => (FOUNDRY_IDS.includes(r.id) ? 50 : 25), e);
  near(map['odlewnia_zelaza__zelazo'], 50 * mult[e - 1], `mapa era${e}: zelazo odlewni = 50 x m`);
  near(map['wielka_odlewnia__stal'], 50 * mult[e - 1], `mapa era${e}: stal wielkiej = 50 x m`);
  eq(map['huta'], 25, `mapa era${e}: huta plaska`);
}

console.log('-- D. runConverter: produkcja = cykle x m, wejscia zuzyte wg receptury (zuzycie NIE rosnie z epoka) --');
for (const e of [1, 2, 3, 4]) {
  const t = M.converterThroughputForEra('odlewnia_brazu', 50, e);
  const r = M.runConverter(rec('odlewnia_brazu'), { ruda: 9000, drewno: 9000, ruda_cyny: 9000 }, t, 50000, 1);
  near(r.produced, 50 * mult[e - 1], `era${e}: brak cyny/rudy ograniczen -> produkcja brazu = 50 x m`);
  near(r.consumed.ruda, 50 * mult[e - 1], `era${e}: ruda = cykle (rosnie z cyklami)`);
  near(r.consumed.ruda_cyny, 0.1 * 50 * mult[e - 1], `era${e}: ruda cyny 0,1/cykl`);
}
{
  // Ograniczenie WEJSCIEM: 30 rudy -> produkcja 30 w kazdej epoce (przepustowosc nie jest waskim gardlem).
  const t = M.converterThroughputForEra('odlewnia_zelaza__zelazo', 50, 3);
  const r = M.runConverter(rec('odlewnia_zelaza__zelazo'), { ruda_zelaza: 30, drewno: 9000 }, t, 50000, 1);
  eq(r.produced, 30, 'era3, ruda_zelaza 30 -> produkcja 30 (wejscie ogranicza, nie cykle 100)');
}

console.log('-- E. wyswietlanie panelu (ta sama funkcja) --');
for (const [bid, out] of [['odlewnia_brazu', 'braz'], ['odlewnia_zelaza', 'zelazo'], ['wielka_odlewnia', 'stal']]) {
  for (const e of [1, 2, 3]) {
    const disp = M.converterProductionDisplayForBuilding(bid, econ, 'normal', e);
    near(disp.produced[out] ?? 0, 50 * mult[e - 1], `panel ${bid} era${e}: ${out} = 50 x m`);
  }
}

console.log('-- F. mutacje (asercje padlyby na starym kodzie: baza 25, plaskie odlewnie) --');
eq(M.converterThroughputForEra('odlewnia_brazu', 50, 2) === 50, false, 'mutacja: odlewnia plaska w epoce 2 != nowy wzor');
eq(M.converterThroughputForEra('odlewnia_brazu', 50, 2) === 75, true, 'odlewnia brazu epoka 2 = 75 cykli (50 x 1,5)');
eq(econ.budynki.budynek_huta_przepustowosc.normal === 25, false, 'mutacja: stara baza 25 w econ-params nie obowiazuje');

console.log(`\nfoundry-throughput-x2-era-mult-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(failed ? 1 : 0);
