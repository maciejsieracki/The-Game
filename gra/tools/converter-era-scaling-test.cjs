'use strict';
/**
 * converter-era-scaling-test.cjs -- standalone Node test for
 * P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12):
 *
 *   "Cegielnia przepustowość 10 plus 10% możliwość awansu i ulepszenia co
 *   każdą epokę. To samo Garncarnia, przepustowość 10 plus 10% co każdą
 *   epokę. Odlewnia brązu przepustowość 5, odlewnia żelaza przepustowość 5,
 *   wielka odlewnia przepustowość 5."
 *
 * Pokrywa:
 *   A. Wartości bazowe (throughputFallback) w DEFAULT_CONVERTER_RECIPES.
 *   B. Wartości bazowe w REALNYM econ-params.json (wszystkie trudności, real
 *      data, nie mock) -- ten sam plik, który czyta silnik.
 *   C. converterThroughputForEra (funkcja czysta) -- Cegielnia/Garncarnia
 *      +10% bazy ADDYTYWNIE/epokę; Odlewnie: cykle x m(e) = 1/1,5/2/2,5/3
 *      (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1); Huta płaska; brzegi (era<1, era=NaN,
 *      baza niecałkowita + interakcja z Math.floor w runConverter).
 *   D. Regresja: reprodukcja starego bledu (throughput niedoskalowany dla
 *      Cegielni/Garncarni po awansie epoki) na WŁASNYM, minimalnym dowodzie
 *      -- asercja, która PADŁABY na kodzie sprzed tej zmiany.
 *   E. Integracja PEŁNA (esbuild-bundle-real-source, advanceCityEconomy):
 *      PARYTET AI -- gracz (ownerId=0, era 1) i AI (ownerId=7, era 3) w
 *      JEDNYM wywołaniu advanceCityEconomy, Cegielnia/Garncarnia skalują się
 *      per-owner, Odlewnia_brazu skaluje cykle m(e) PER-OWNER dla OBU
 *      (gracz era1 = 50, AI era3 = 100; ta sama funkcja, inny owner-era --
 *      dowód parytetu w realnym silniku, nie tylko w izolowanej funkcji czystej).
 *
 * Save/load: mechanizm NIE dodaje żadnego nowego trwałego pola stanu --
 * przepustowość jest przeliczana co turę z (a) econ-params.json [PT] i (b)
 * epoki właściciela, która JUŻ jest zapisywana/wczytywana w main.ts
 * (`ownerEraByOwner` w buildSaveGameSnapshot/restoreGameFromSave, sprzed tej
 * zmiany) -- brak nowej luki save/load do pokrycia tutaj.
 *
 * Run from gra/:  node tools/converter-era-scaling-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[converter-era-scaling-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.conv-era-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.conv-era-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_CONVERTER_RECIPES, loadThroughput, runConverter, runConverters,
  converterThroughputForEra, CONVERTER_ERA_SCALING_RECIPE_IDS, CONVERTER_ERA_SCALING_PCT, CONVERTER_FOUNDRY_ERA_RECIPE_IDS,
  CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE, converterOutputMultiplierForEra, converterThroughputsForEra,
  CONVERTER_OUTPUT_MULT_KEY_SUFFIX,
} from '../src/game/converters';
export { advanceCityEconomy } from '../src/game/turn-economy';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { generateMap } from '../src/map/generator';
`, 'utf8');

try {
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
} catch (e) {
  console.error('[converter-era-scaling-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function recipe(id) {
  const r = M.DEFAULT_CONVERTER_RECIPES.find(x => x.id === id);
  if (!r) throw new Error(`recipe not found in bundle: ${id}`);
  return r;
}

// ===========================================================================
// A. Wartości bazowe (throughputFallback) -- P-KONWERTERY-PRZEPUSTOWOSC-Q1
// ===========================================================================
console.log('\n-- A. throughputFallback bazowe (DEFAULT_CONVERTER_RECIPES) --');
eq(recipe('cegielnia').throughputFallback, 50, 'cegielnia: fallback 50 (bylo 10, R-EKONOMIA-SUROWCE-SKALA-5X-Q1; R-WEB-BRICK-PRODUCTION-X2: bez zmian)');
eq(recipe('cegielnia').outputAmount, 2, 'cegielnia: outputAmount 2 (R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1, bylo 1)');
eq(recipe('garncarnia').outputAmount, 1, 'garncarnia: outputAmount 1 (bez zmian)');
eq(recipe('garncarnia').throughputFallback, 50, 'garncarnia: fallback 50 (bylo 10, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('huta').throughputFallback, 50, 'huta: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');
eq(recipe('odlewnia_brazu').throughputFallback, 50, 'odlewnia_brazu: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');
eq(recipe('odlewnia_zelaza__braz').throughputFallback, 50, 'odlewnia_zelaza__braz: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');
eq(recipe('odlewnia_zelaza__zelazo').throughputFallback, 50, 'odlewnia_zelaza__zelazo: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');
eq(recipe('wielka_odlewnia__braz').throughputFallback, 50, 'wielka_odlewnia__braz: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');
eq(recipe('wielka_odlewnia__zelazo').throughputFallback, 50, 'wielka_odlewnia__zelazo: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');
eq(recipe('wielka_odlewnia__stal').throughputFallback, 50, 'wielka_odlewnia__stal: fallback 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)');

// ===========================================================================
// B. Wartości bazowe w REALNYM econ-params.json (wszystkie trudności)
// ===========================================================================
console.log('\n-- B. econ-params.json: wartosci realne, wszystkie trudnosci --');
for (const diff of ['easy', 'normal', 'hard']) {
  eq(M.loadThroughput(econParamsRaw, 'budynek_cegielnia_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_cegielnia_przepustowosc.${diff} = 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_garncarnia_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_garncarnia_przepustowosc.${diff} = 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_huta_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_huta_przepustowosc.${diff} = 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_huta_braz_epoka2_przepustowosc', diff, -1), 25,
    `bronze explicit era2 ${diff}=25`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_huta_braz_epoka3_przepustowosc', diff, -1), 50,
    `bronze explicit era3 ${diff}=50`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_odlewnia_zelaza_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_odlewnia_zelaza_przepustowosc.${diff} = 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_wielka_odlewnia_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_wielka_odlewnia_przepustowosc.${diff} = 50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1, bylo 25)`);
}

// ===========================================================================
// C. converterThroughputForEra -- funkcja czysta: skalowanie + brzegi
// ===========================================================================
console.log('\n-- C. converterThroughputForEra: Cegielnia/Garncarnia, jawny Brąz, mnożnik tylko Żelazo/Stal --');

// C1. Zakres skalowania: DOKLADNIE cegielnia+garncarnia, nic wiecej (guard przed
// przypadkowym rozszerzeniem/zwezeniem zbioru w przyszlej zmianie).
eq(M.CONVERTER_ERA_SCALING_RECIPE_IDS.size, 1, 'CONVERTER_ERA_SCALING_RECIPE_IDS: dokladnie 1 wpis (cykle; Cegielnia skaluje WYJSCIE, BRICK-X2 opcja C)');
assert(!M.CONVERTER_ERA_SCALING_RECIPE_IDS.has('cegielnia'), 'scaling set: NIE ma cegielni (cykle plaskie; mnoznik na wyjsciu)');
assert(M.CONVERTER_ERA_SCALING_RECIPE_IDS.has('garncarnia'), 'scaling set: ma garncarnia');
for (const id of ['odlewnia_zelaza__zelazo', 'wielka_odlewnia__zelazo', 'wielka_odlewnia__stal']) {
  assert(M.CONVERTER_FOUNDRY_ERA_RECIPE_IDS.has(id), `foundry set: ${id} skaluje cykle m(e) (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1)`);
  assert(!M.CONVERTER_ERA_SCALING_RECIPE_IDS.has(id), `garncarnia-scaling set: NIE ma ${id}`);
}
for (const id of ['odlewnia_brazu', 'odlewnia_zelaza__braz', 'wielka_odlewnia__braz']) {
  assert(!M.CONVERTER_FOUNDRY_ERA_RECIPE_IDS.has(id), `bronze recipe ${id} uses explicit per-era data, not global foundry multiplier`);
  const recipe = M.DEFAULT_CONVERTER_RECIPES.find(r => r.id === id);
  assert(!!recipe.throughputEraParamKeys, `bronze recipe ${id} has explicit era parameter keys`);
}
for (const id of ['huta']) {
  assert(!M.CONVERTER_ERA_SCALING_RECIPE_IDS.has(id), `scaling set: NIE ma ${id} (plaska)`);
}
eq(M.CONVERTER_ERA_SCALING_PCT, 0.10, 'CONVERTER_ERA_SCALING_PCT = 0.10 (10%)');

// C2. Cegielnia/Garncarnia: baza 10, ADDYTYWNIE +10%/epoke -- epoka1=10, epoka2=11, epoka3=12.
// R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1: Garncarnia zostaje przy +10%/epoke, Cegielnia ma +50%/epoke (blok nizej).
for (const id of ['garncarnia']) {
  eq(M.converterThroughputForEra(id, 10, 1), 10, `${id}: era1 -> 10 (baza, bez bonusu)`);
  eq(M.converterThroughputForEra(id, 10, 2), 11, `${id}: era2 -> 11 (+10% bazy)`);
  eq(M.converterThroughputForEra(id, 10, 3), 12, `${id}: era3 -> 12 (+20% bazy)`);
  // Ekstrapolacja poza dzisiejsze 3 epoki gry (Kamien/Braz/Zelazo) -- formula ADDYTYWNA,
  // NIE compound: era4 -> 10 + 10*0.10*3 = 13 (compound dalby 10*1.1^3=13,31 -- rozne).
  eq(M.converterThroughputForEra(id, 10, 4), 13, `${id}: era4 -> 13 (addytywnie, NIE compound=13,31)`);
}
// Cegielnia (BRICK-X2 opcja C): CYKLE plaskie, +50% BAZY/epoke na WYJSCIU -> mnoznik 1/1,5/2/2,5/3.
{
  const mults = [1, 1.5, 2, 2.5, 3];
  for (let e = 1; e <= 5; e++) {
    eq(M.converterThroughputForEra('cegielnia', 50, e), 50, `cegielnia: era${e} -> 50 cykli (plaskie)`);
    eq(M.converterOutputMultiplierForEra('cegielnia', e), mults[e - 1], `cegielnia: era${e} mnoznik wyjscia x${mults[e - 1]}`);
    eq(M.converterOutputMultiplierForEra('garncarnia', e), 1, `garncarnia: era${e} mnoznik wyjscia 1`);
    eq(M.converterOutputMultiplierForEra('huta', e), 1, `huta: era${e} mnoznik wyjscia 1`);
  }
  eq(M.CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE.cegielnia, 0.5, 'CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE.cegielnia = 0.5');
  eq(M.converterOutputMultiplierForEra('cegielnia', 0), 1, 'cegielnia: era0 -> mnoznik 1');
  eq(M.converterOutputMultiplierForEra('cegielnia', NaN), 1, 'cegielnia: NaN -> mnoznik 1');
  const t3 = M.converterThroughputsForEra(r => r.throughputFallback, 3);
  eq(t3.cegielnia, 50, 'converterThroughputsForEra: cegielnia 50 cykli');
  eq(t3['cegielnia' + M.CONVERTER_OUTPUT_MULT_KEY_SUFFIX], 2, 'converterThroughputsForEra: cegielnia#outMult = 2 w erze 3');
  eq(t3['huta' + M.CONVERTER_OUTPUT_MULT_KEY_SUFFIX], undefined, 'converterThroughputsForEra: huta bez mnoznika');
  eq(M.converterThroughputsForEra(r => r.throughputFallback, 1)['cegielnia' + M.CONVERTER_OUTPUT_MULT_KEY_SUFFIX], undefined, 'era1: brak klucza mnoznika');
}

// C3. Żelazo/stal: m(e) = 1/1,5/2/2,5/3 na cykle (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1; baza 5 w tym
// tescie = tylko wartosc arytmetyczna). Huta: PLASKA.
for (const id of ['odlewnia_zelaza__zelazo', 'wielka_odlewnia__zelazo', 'wielka_odlewnia__stal']) {
  eq(M.converterThroughputForEra(id, 5, 1), 5, `${id}: era1 -> 5 (m=1)`);
  eq(M.converterThroughputForEra(id, 5, 2), 7.5, `${id}: era2 -> 7,5 (m=1,5)`);
  eq(M.converterThroughputForEra(id, 5, 3), 10, `${id}: era3 -> 10 (m=2)`);
  eq(M.converterThroughputForEra(id, 5, 10), 27.5, `${id}: era10 -> 27,5 (m=5,5 liniowo)`);
}
for (const id of ['huta']) {
  eq(M.converterThroughputForEra(id, 5, 1), 5, `${id}: era1 -> 5 (plaskie)`);
  eq(M.converterThroughputForEra(id, 5, 2), 5, `${id}: era2 -> 5 (plaskie)`);
  eq(M.converterThroughputForEra(id, 5, 3), 5, `${id}: era3 -> 5 (plaskie)`);
  eq(M.converterThroughputForEra(id, 5, 10), 5, `${id}: era10 -> 5 (plaskie)`);
}

// C4. Brzegi era<1 / NaN -- traktowane jak era1 (brak ujemnego/undefined mnoznika).
eq(M.converterThroughputForEra('cegielnia', 10, 0), 10, 'cegielnia: era=0 -> traktowane jak era1 (=10)');
eq(M.converterThroughputForEra('cegielnia', 10, -5), 10, 'cegielnia: era=-5 -> traktowane jak era1 (=10)');
eq(M.converterThroughputForEra('cegielnia', 10, NaN), 10, 'cegielnia: era=NaN -> traktowane jak era1 (=10)');

// C5. Baza NIE rowna 10 (dowod, ze formula liczy naprawde, nie ma zaszytej stalej 10) +
// interakcja z Math.floor w runConverter (throughput musi byc floorowany przed uzyciem).
eq(M.converterThroughputForEra('garncarnia', 7, 3), 8.4, 'garncarnia: baza=7, era3 -> 7 + 7*0.10*2 = 8,4 (formula ogolna)');
eq(M.converterThroughputForEra('cegielnia', 7, 3), 7, 'cegielnia: baza=7, era3 -> 7 (cykle plaskie)');
{
  const garncarniaRecipe = recipe('garncarnia');
  const scaledFractional = M.converterThroughputForEra('garncarnia', 7, 3); // 8.4
  const r = M.runConverter(garncarniaRecipe, { glina: 100, drewno: 100 }, scaledFractional, 500);
  eq(r.produced, 8, 'runConverter: throughput 8,4 -> Math.floor -> 8 ceramiki (nie 8,4 ani 9)');
}

// ===========================================================================
// D. Regresja -- reprodukcja bledu sprzed P-KONWERTERY-PRZEPUSTOWOSC-Q1
// ===========================================================================
console.log('\n-- D. Regresja: dowod, ze scaling realnie zmienia produkcje wzgledem bazy --');
{
  const cegielniaRecipe = recipe('cegielnia');
  const baseThroughput = M.loadThroughput(econParamsRaw, cegielniaRecipe.throughputParamKey, 'normal', cegielniaRecipe.throughputFallback);
  eq(baseThroughput, 50, 'baseThroughput (normal, real econ-params.json) = 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');

  const era1Throughput = M.converterThroughputForEra('cegielnia', baseThroughput, 1);
  const era3Throughput = M.converterThroughputForEra('cegielnia', baseThroughput, 3);
  eq(era3Throughput, era1Throughput, 'cegielnia: cykle plaskie (epoka skaluje WYJSCIE)');

  const r1 = M.runConverter(cegielniaRecipe, { glina: 500, drewno: 500 }, era1Throughput, 500, M.converterOutputMultiplierForEra('cegielnia', 1));
  const r3 = M.runConverter(cegielniaRecipe, { glina: 5000, drewno: 5000 }, era3Throughput, 5000, M.converterOutputMultiplierForEra('cegielnia', 3));
  eq(r1.produced, 100, 'produkcja realna epoka1: 100 cegiel/ture = 50 cykli x 2 (R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1, bylo 50)');
  eq(r1.consumed.glina, 100, 'epoka1: zuzycie gliny 100 (50 cykli x 2, BEZ zmiany wzgledem starego)');
  eq(r1.consumed.drewno, 50, 'epoka1: zuzycie drewna 50 (50 cykli x 1, BEZ zmiany wzgledem starego)');
  eq(r3.produced, 200, 'produkcja realna epoka3: 200 cegiel/ture = 50 cykli x 2 x mnoznik 2 (+100% bazy wzgledem epoki1; bylo 60)');
  eq(r3.consumed.glina, 100, 'epoka3: zuzycie gliny 100 (cykle plaskie, wejscia NIE rosna z epoka)');
  eq(r3.consumed.drewno, 50, 'epoka3: zuzycie drewna 50');
}

// ===========================================================================
// E. Integracja PELNA (advanceCityEconomy): PARYTET AI, gracz era1 vs AI era3,
//    JEDNO wywolanie, Odlewnia_brazu plaska dla OBU.
// ===========================================================================
console.log('\n-- E. advanceCityEconomy: PARYTET AI (gracz era2, AI era3), jawny Brąz, skala Cegielni/Garncarni --');
{
  const map = M.generateMap(40, 40, 7331, 'kontynenty');
  const data = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

  function landHexes(n, minDist) {
    const all = [];
    for (const h of Object.values(map.hexes)) {
      const c = { q: h.coords.q, r: h.coords.r };
      if (M.canFoundCity(c.q, c.r, [], map).ok) all.push(c);
    }
    const picked = [];
    for (const c of all) {
      if (picked.every(p => (Math.abs(c.q - p.q) + Math.abs(c.q + c.r - p.q - p.r) + Math.abs(c.r - p.r)) / 2 >= minDist)) {
        picked.push(c);
        if (picked.length >= n) break;
      }
    }
    return picked;
  }

  const spots = landHexes(2, 6);
  if (spots.length < 2) {
    console.error('FAIL: brak wystarczajaco ladu do zalozenia 2 miast testowych (sekcja E pominieta)');
    failed++;
  } else {
    const cities = [];
    const cPlayer = M.foundCityAt(spots[0].q, spots[0].r, 0, cities, map, 'PlayerCity'); cities.push(cPlayer);
    const cAi     = M.foundCityAt(spots[1].q, spots[1].r, 7, cities, map, 'AiCity');     cities.push(cAi);

    // Zapas wejsciowy hojny (>> potrzeba throughput-owa) -- produkcja limitowana
    // WYLACZNIE przepustowoscia, nie brakiem gliny/drewna/rudy (odporne na szum
    // z plonow terenu w Fazie 1). R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej 2026-08-13):
    // zapas podniesiony 1000->5000, żeby zostać komfortowo ponad nowy throughput ×5
    // (Cegielnia era3 = 60/ture, wymaga glina=120/ture przy recepturze 2:1).
    cPlayer.surowce = { glina: 5000, drewno: 5000, ruda: 5000, ruda_cyny: 5000 };
    cAi.surowce     = { glina: 5000, drewno: 5000, ruda: 5000, ruda_cyny: 5000 };

    const builtByCity = new Map([
      [cPlayer.id, ['cegielnia', 'garncarnia', 'odlewnia_brazu']],
      [cAi.id,     ['cegielnia', 'garncarnia', 'odlewnia_brazu']],
    ]);

    // PARYTET AI: JEDEN resolver, zero galezi w kodzie produkcyjnym -- owner 0 -> era 2,
    // owner 7 (AI) -> era 3. Sam resolver zyje TYLKO w teście (jak w main.ts
    // empireEpochForOwner); advanceCityEconomy/converterThroughputForEra go tylko WOLAJA.
    const resolveOwnerEra = (ownerId) => (ownerId === 0 ? 2 : 3);

    const econ = M.advanceCityEconomy(
      cities, map, data, 'normal', [], new Map(), builtByCity,
      1, new Set(), new Map(), new Map(),
      resolveOwnerEra,
    );
    assert(!!econ, 'advanceCityEconomy nie rzuca wyjatku (2 ownerow, era1 vs era3)');

    eq(cPlayer.surowce.cegla, 150, 'gracz (era2): 150 cegiel/ture (50 cykli x 2 x mnoznik wyjscia 1.5)');
    eq(cPlayer.surowce.ceramika, 55, 'gracz (era2): 55 ceramiki/ture (+10% bazy)');
    eq(cAi.surowce.cegla, 200, 'AI (era3): 200 cegiel/ture (50 cykli x 2 x mnoznik wyjscia 2 -- MECHANIZM DZIALA DLA AI; bylo 60)');
    eq(cAi.surowce.ceramika, 60, 'AI (era3): 60 ceramiki/ture (+20% bazy -- MECHANIZM DZIALA DLA AI; R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 12)');

    // Brąz korzysta z jawnych parametrów throughput per-era: owner era2 = 25, era3 = 50.
    eq(cPlayer.surowce.braz, 25, 'gracz (era2): 25 brazu/ture z jawnego wiersza epoki wlasciciela');
    eq(cAi.surowce.braz, 50, 'AI (era3): 50 brazu/ture z jawnego wiersza epoki wlasciciela');
  }
}

// --- summary ---------------------------------------------------------------
console.log(`\nconverter-era-scaling-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
