'use strict';
/**
 * brick-production-x2-test.cjs -- R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1 (decyzja
 * wlasciciela 2026-11-05): produkcja cegly x2 przez outputAmount 1->2 (pomiar: Cegielnie
 * ogranicza WEJSCIE/drewno, nie przepustowosc) + Cegielnia +50% BAZY WYJSCIA za kazda epoke (opcja C)
 * wlasciciela (mnoznik 1/1,5/2/2,5/3). Tylko Cegielnia.
 * Run from gra/:  node tools/brick-production-x2-test.cjs
 */
const fs = require('fs'), path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.brick-x2-entry.ts'), BUNDLE = path.resolve(__dirname, '.brick-x2-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { DEFAULT_CONVERTER_RECIPES, loadThroughput, runConverter, converterThroughputForEra,
  converterOutputMultiplierForEra, converterThroughputsForEra, CONVERTER_OUTPUT_MULT_KEY_SUFFIX, runConverters,
  converterProductionDisplayForBuilding } from '../src/game/converters';
export { advanceCityEconomy } from '../src/game/turn-economy';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { generateMap } from '../src/map/generator';
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
const D = f => require(path.join(GRA, 'data', f));
const econ = D('econ-params.json');
let passed = 0, failed = 0;
const eq = (a, b, m) => { if (a === b) passed++; else { failed++; console.error(`  FAIL: ${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); } };
const rec = id => M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === id);

console.log('-- A. dane: baza cykli bez zmian (50), wyjscie x2, wejscia na cykl bez zmian --');
for (const d of ['easy', 'normal', 'hard']) eq(M.loadThroughput(econ, 'budynek_cegielnia_przepustowosc', d, -1), 50, `econ cegielnia ${d} = 50 (bez zmian)`);
eq(rec('cegielnia').throughputFallback, 50, 'fallback 50');
eq(JSON.stringify(rec('cegielnia').inputs), JSON.stringify({ glina: 2, drewno: 1 }), 'receptura wejsc bez zmian');
eq(rec('cegielnia').outputAmount, 2, 'outputAmount 2 (x2 cegly)');
eq(rec('garncarnia').throughputFallback, 50, 'garncarnia baza bez zmian (50)');
eq(M.loadThroughput(econ, 'budynek_garncarnia_przepustowosc', 'normal', -1), 50, 'garncarnia econ bez zmian');

console.log('-- B. wzor epoki: mnoznik WYJSCIA 1/1,5/2/2,5/3 tylko Cegielnia, cykle plaskie --');
const mult = [1, 1.5, 2, 2.5, 3];
for (let e = 1; e <= 5; e++) {
  eq(M.converterThroughputForEra('cegielnia', 50, e), 50, `cegielnia era${e} cykle plaskie`);
  eq(M.converterOutputMultiplierForEra('cegielnia', e), mult[e - 1], `cegielnia era${e} mnoznik wyjscia`);
  eq(M.converterOutputMultiplierForEra('garncarnia', e), 1, `garncarnia era${e} bez mnoznika wyjscia`);
  eq(M.converterThroughputForEra('garncarnia', 50, e), 50 * (1 + 0.1 * (e - 1)), `garncarnia era${e} nadal +10% cykli`);
  eq(M.converterThroughputForEra('huta', 25, e), 25, `huta plaska era${e}`);
  eq(M.converterOutputMultiplierForEra('odlewnia_zelaza__zelazo', e), 1, `odlewnia zelaza bez mnoznika era${e}`);
}
eq(M.converterOutputMultiplierForEra('cegielnia', 3) / M.converterOutputMultiplierForEra('cegielnia', 1), 2, 'era3 = 2x era1 (wyjscie)');
eq(M.converterOutputMultiplierForEra('cegielnia', 2) / M.converterOutputMultiplierForEra('cegielnia', 1), 1.5, 'era2 = 1,5x era1 (wyjscie)');
// MUTACJE (te asercje padlyby na starym kodzie)
const stare = (b, e) => b * (1 + 0.10 * (e - 1));
eq(stare(50, 2) === M.converterThroughputForEra('cegielnia', 50, 2), false, 'mutacja: stary wzor cykli (+10%) != nowy w epoce 2');
eq(M.converterOutputMultiplierForEra('cegielnia', 2) === 1, false, 'mutacja: brak mnoznika wyjscia (stary kod) != nowy w epoce 2');

console.log('-- C. runConverter: wejscia zuzyte zgodnie z receptura, bonus epoki dziala takze gdy ogranicza drewno --');
for (const e of [1, 2, 3]) {
  const t = M.converterThroughputForEra('cegielnia', 50, e);
  const r = M.runConverter(rec('cegielnia'), { glina: 9000, drewno: 9000 }, t, 50000, mult[e - 1]);
  eq(r.produced, 100 * mult[e - 1], `era${e}: produkcja (cykle x2 x mnoznik)`);
  eq(r.consumed.glina, 100, `era${e}: glina 100 (zuzycie NIE rosnie z epoka)`);
  eq(r.consumed.drewno, 50, `era${e}: drewno 50 (zuzycie NIE rosnie z epoka)`);
}
// Reżim ograniczony WEJSCIEM (wynik pomiaru w grze: drewno): x2 oraz bonus epoki PRZY TYM SAMYM wejsciu.
{
  const stary = { ...rec('cegielnia'), outputAmount: 1 };
  const w = { glina: 9000, drewno: 5 };
  eq(M.runConverter(stary, w, 50, 50000).produced, 5, 'stary kod: 5 drewna -> 5 cegiel');
  eq(M.runConverter(rec('cegielnia'), w, 50, 50000, 1).produced, 10, 'era1: 5 drewna -> 10 cegiel (x2 takze gdy ogranicza drewno)');
  const n2 = M.runConverter(rec('cegielnia'), w, 50, 50000, 1.5);
  eq(n2.produced, 15, 'era2: 5 drewna -> 15 cegiel (bonus epoki ZYJE w rezimie drewna -- opcja C)');
  eq(n2.consumed.drewno, 5, 'zuzycie drewna bez zmian (5)');
  eq(n2.consumed.glina, 10, 'zuzycie gliny bez zmian (10)');
  eq(M.runConverter(rec('cegielnia'), w, 50, 50000, 3).produced, 30, 'era5: 5 drewna -> 30 cegiel');
}
eq(M.runConverter(rec('cegielnia'), { glina: 100, drewno: 9000 }, 100, 50000).produced, 100, 'limit gliny: 100 gliny -> 50 cykli -> 100 cegiel');
eq(M.runConverter(rec('cegielnia'), { glina: 9000, drewno: 40 }, 100, 50000).produced, 80, 'limit drewna: 40 -> 40 cykli -> 80 cegiel');
eq(M.runConverter(rec('cegielnia'), { glina: 9000, drewno: 9000 }, 100, 51).produced, 50, 'limit wyjscia: wolne 51 -> 25 cykli -> 50 cegiel (outputAmount uwzgledniony w capie)');
eq(M.runConverter(rec('cegielnia'), { glina: 9000, drewno: 9000 }, 100, 51, 3).produced, 48, 'limit wyjscia z mnoznikiem x3: wolne 51 -> floor(51/6)=8 cykli -> 48 cegiel');
// runConverters czyta mnoznik z klucza '<id>#outMult'
{
  const th = M.converterThroughputsForEra(r => r.throughputFallback, 2);
  const res = M.runConverters([rec('cegielnia')], { glina: 9000, drewno: 5 }, th, () => 50000);
  eq(res.perBuilding.cegielnia.produced, 15, 'runConverters (era2, drewno 5): 15 cegiel przez klucz #outMult');
}

console.log('-- D. silnik advanceCityEconomy: gracz era2 i AI era3 (parytet) --');
const data = { civs: D('civs.json'), econParams: econ, societyParams: D('society-params.json'), buildings: D('buildings.json'), units: D('units.json'), tech: D('tech.json') };
const map = M.generateMap(40, 40, 7331, 'kontynenty');
const spots = [];
for (const h of Object.values(map.hexes)) {
  const c = h.coords;
  if (M.canFoundCity(c.q, c.r, [], map).ok && spots.every(p => (Math.abs(c.q - p.q) + Math.abs(c.q + c.r - p.q - p.r) + Math.abs(c.r - p.r)) / 2 >= 6)) { spots.push(c); if (spots.length >= 2) break; }
}
const cities = [];
const cP = M.foundCityAt(spots[0].q, spots[0].r, 0, cities, map, 'P'); cities.push(cP);
const cA = M.foundCityAt(spots[1].q, spots[1].r, 7, cities, map, 'A'); cities.push(cA);
cP.surowce = { glina: 9000, drewno: 9000, cegla: 0 };
cA.surowce = { glina: 9000, drewno: 9000, cegla: 0 };
M.advanceCityEconomy(cities, map, data, 'normal', [], new Map(), new Map([[cP.id, ['cegielnia']], [cA.id, ['cegielnia']]]),
  2, new Set(), new Map(), new Map(), o => (o === 0 ? 2 : 3));
eq(cP.surowce.cegla, 150, 'gracz era2: 150 cegiel/ture');
eq(cA.surowce.cegla, 200, 'AI era3: 200 cegiel/ture');

// Reżim ograniczony DREWNEM w realnym silniku: ta sama sytuacja, era1 vs era3 -> wyjscie x2 przy tym samym zuzyciu drewna.
{
  const run = era => {
    const cs = [cP]; cP.surowce = { glina: 90000, drewno: 20, cegla: 0 };
    M.advanceCityEconomy(cs, map, data, 'normal', [], new Map(), new Map([[cP.id, ['cegielnia']]]),
      era, new Set(), new Map(), new Map(), () => era);
    return cP.surowce.cegla;
  };
  const e1 = run(1), e3 = run(3);
  eq(e1 > 0 && e1 < 100, true, `silnik era1, drewno-limit: cegla ${e1} < 100 (cykle ograniczone drewnem)`);
  eq(e3, 2 * e1, `silnik era3, drewno-limit: ${e3} = 2 x era1 (${e1}) -- bonus epoki dziala przy braku drewna`);
}

console.log('-- E. wyswietlanie (panel miasta) czyta ta sama funkcje --');
const disp = M.converterProductionDisplayForBuilding('cegielnia', econ, 'normal', 2);
eq(disp.produced.cegla, 150, 'panel: cegla era2 = 150 (50 cykli x 2 x 1,5)');
eq(disp.consumed.glina, 100, 'panel: glina era2 = 100 (50 cykli x 2, bez wzrostu)');
eq(disp.consumed.drewno, 50, 'panel: drewno era2 = 50');

console.log(`\nbrick-production-x2-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(failed ? 1 : 0);
