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
 *      +10% bazy ADDYTYWNIE/epokę; Odlewnie płaskie; brzegi (era<1, era=NaN,
 *      baza niecałkowita + interakcja z Math.floor w runConverter).
 *   D. Regresja: reprodukcja starego bledu (throughput niedoskalowany dla
 *      Cegielni/Garncarni po awansie epoki) na WŁASNYM, minimalnym dowodzie
 *      -- asercja, która PADŁABY na kodzie sprzed tej zmiany.
 *   E. Integracja PEŁNA (esbuild-bundle-real-source, advanceCityEconomy):
 *      PARYTET AI -- gracz (ownerId=0, era 1) i AI (ownerId=7, era 3) w
 *      JEDNYM wywołaniu advanceCityEconomy, Cegielnia/Garncarnia skalują się
 *      per-owner, Odlewnia_brazu zostaje płaska dla OBU (dowód, że "Odlewnie
 *      NIE skalują się" trzyma się w realnym silniku, nie tylko w izolowanej
 *      funkcji czystej).
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
  converterThroughputForEra, CONVERTER_ERA_SCALING_RECIPE_IDS, CONVERTER_ERA_SCALING_PCT,
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
eq(recipe('cegielnia').throughputFallback, 50, 'cegielnia: fallback 50 (bylo 10, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('garncarnia').throughputFallback, 50, 'garncarnia: fallback 50 (bylo 10, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('huta').throughputFallback, 25, 'huta: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('odlewnia_brazu').throughputFallback, 25, 'odlewnia_brazu: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('odlewnia_zelaza__braz').throughputFallback, 25, 'odlewnia_zelaza__braz: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('odlewnia_zelaza__zelazo').throughputFallback, 25, 'odlewnia_zelaza__zelazo: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('wielka_odlewnia__braz').throughputFallback, 25, 'wielka_odlewnia__braz: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('wielka_odlewnia__zelazo').throughputFallback, 25, 'wielka_odlewnia__zelazo: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');
eq(recipe('wielka_odlewnia__stal').throughputFallback, 25, 'wielka_odlewnia__stal: fallback 25 (bylo 5, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');

// ===========================================================================
// B. Wartości bazowe w REALNYM econ-params.json (wszystkie trudności)
// ===========================================================================
console.log('\n-- B. econ-params.json: wartosci realne, wszystkie trudnosci --');
for (const diff of ['easy', 'normal', 'hard']) {
  eq(M.loadThroughput(econParamsRaw, 'budynek_cegielnia_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_cegielnia_przepustowosc.${diff} = 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_garncarnia_przepustowosc', diff, -1), 50,
    `econ-params.json budynek_garncarnia_przepustowosc.${diff} = 50 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_huta_przepustowosc', diff, -1), 25,
    `econ-params.json budynek_huta_przepustowosc.${diff} = 25 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 5)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_odlewnia_zelaza_przepustowosc', diff, -1), 25,
    `econ-params.json budynek_odlewnia_zelaza_przepustowosc.${diff} = 25 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 5)`);
  eq(M.loadThroughput(econParamsRaw, 'budynek_wielka_odlewnia_przepustowosc', diff, -1), 25,
    `econ-params.json budynek_wielka_odlewnia_przepustowosc.${diff} = 25 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 5)`);
}

// ===========================================================================
// C. converterThroughputForEra -- funkcja czysta: skalowanie + brzegi
// ===========================================================================
console.log('\n-- C. converterThroughputForEra: skalowanie Cegielnia/Garncarnia, Odlewnie plaskie, brzegi --');

// C1. Zakres skalowania: DOKLADNIE cegielnia+garncarnia, nic wiecej (guard przed
// przypadkowym rozszerzeniem/zwezeniem zbioru w przyszlej zmianie).
eq(M.CONVERTER_ERA_SCALING_RECIPE_IDS.size, 2, 'CONVERTER_ERA_SCALING_RECIPE_IDS: dokladnie 2 wpisy');
assert(M.CONVERTER_ERA_SCALING_RECIPE_IDS.has('cegielnia'), 'scaling set: ma cegielnia');
assert(M.CONVERTER_ERA_SCALING_RECIPE_IDS.has('garncarnia'), 'scaling set: ma garncarnia');
for (const id of ['huta', 'odlewnia_brazu', 'odlewnia_zelaza__braz', 'odlewnia_zelaza__zelazo', 'wielka_odlewnia__braz', 'wielka_odlewnia__zelazo', 'wielka_odlewnia__stal']) {
  assert(!M.CONVERTER_ERA_SCALING_RECIPE_IDS.has(id), `scaling set: NIE ma ${id} (Odlewnie plaskie)`);
}
eq(M.CONVERTER_ERA_SCALING_PCT, 0.10, 'CONVERTER_ERA_SCALING_PCT = 0.10 (10%)');

// C2. Cegielnia/Garncarnia: baza 10, ADDYTYWNIE +10%/epoke -- epoka1=10, epoka2=11, epoka3=12.
for (const id of ['cegielnia', 'garncarnia']) {
  eq(M.converterThroughputForEra(id, 10, 1), 10, `${id}: era1 -> 10 (baza, bez bonusu)`);
  eq(M.converterThroughputForEra(id, 10, 2), 11, `${id}: era2 -> 11 (+10% bazy)`);
  eq(M.converterThroughputForEra(id, 10, 3), 12, `${id}: era3 -> 12 (+20% bazy)`);
  // Ekstrapolacja poza dzisiejsze 3 epoki gry (Kamien/Braz/Zelazo) -- formula ADDYTYWNA,
  // NIE compound: era4 -> 10 + 10*0.10*3 = 13 (compound dalby 10*1.1^3=13,31 -- rozne).
  eq(M.converterThroughputForEra(id, 10, 4), 13, `${id}: era4 -> 13 (addytywnie, NIE compound=13,31)`);
}

// C3. Odlewnie: baza 5, PLASKIE -- era nie zmienia wyniku (era1/2/3/10 identyczne).
for (const id of ['huta', 'odlewnia_brazu', 'odlewnia_zelaza__braz', 'odlewnia_zelaza__zelazo', 'wielka_odlewnia__braz', 'wielka_odlewnia__zelazo', 'wielka_odlewnia__stal']) {
  eq(M.converterThroughputForEra(id, 5, 1), 5, `${id}: era1 -> 5 (plaskie)`);
  eq(M.converterThroughputForEra(id, 5, 2), 5, `${id}: era2 -> 5 (plaskie, BEZ +10%)`);
  eq(M.converterThroughputForEra(id, 5, 3), 5, `${id}: era3 -> 5 (plaskie, BEZ +20%)`);
  eq(M.converterThroughputForEra(id, 5, 10), 5, `${id}: era10 -> 5 (plaskie nawet przy duzej epoce)`);
}

// C4. Brzegi era<1 / NaN -- traktowane jak era1 (brak ujemnego/undefined mnoznika).
eq(M.converterThroughputForEra('cegielnia', 10, 0), 10, 'cegielnia: era=0 -> traktowane jak era1 (=10)');
eq(M.converterThroughputForEra('cegielnia', 10, -5), 10, 'cegielnia: era=-5 -> traktowane jak era1 (=10)');
eq(M.converterThroughputForEra('cegielnia', 10, NaN), 10, 'cegielnia: era=NaN -> traktowane jak era1 (=10)');

// C5. Baza NIE rowna 10 (dowod, ze formula liczy naprawde, nie ma zaszytej stalej 10) +
// interakcja z Math.floor w runConverter (throughput musi byc floorowany przed uzyciem).
eq(M.converterThroughputForEra('cegielnia', 7, 3), 8.4, 'cegielnia: baza=7, era3 -> 7 + 7*0.10*2 = 8,4 (formula ogolna)');
{
  const cegielniaRecipe = recipe('cegielnia');
  const scaledFractional = M.converterThroughputForEra('cegielnia', 7, 3); // 8.4
  const r = M.runConverter(cegielniaRecipe, { glina: 100, drewno: 100 }, scaledFractional, 500);
  eq(r.produced, 8, 'runConverter: throughput 8,4 -> Math.floor -> 8 cegiel (nie 8,4 ani 9)');
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
  assert(era3Throughput > era1Throughput,
    `regresja: przepustowosc epoka3 (${era3Throughput}) MUSI byc wieksza niz epoka1 (${era1Throughput}) -- na starym kodzie (brak skalowania) byloby rowne`);

  const r1 = M.runConverter(cegielniaRecipe, { glina: 500, drewno: 500 }, era1Throughput, 500);
  const r3 = M.runConverter(cegielniaRecipe, { glina: 500, drewno: 500 }, era3Throughput, 500);
  eq(r1.produced, 50, 'produkcja realna epoka1: 50 cegiel/ture (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
  eq(r3.produced, 60, 'produkcja realna epoka3: 60 cegiel/ture (+20% wzgledem epoki1, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 12)');
}

// ===========================================================================
// E. Integracja PELNA (advanceCityEconomy): PARYTET AI, gracz era1 vs AI era3,
//    JEDNO wywolanie, Odlewnia_brazu plaska dla OBU.
// ===========================================================================
console.log('\n-- E. advanceCityEconomy: PARYTET AI (gracz era1, AI era3), Cegielnia/Garncarnia skaluja, Odlewnia plaska --');
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

    // PARYTET AI: JEDEN resolver, zero galezi w kodzie produkcyjnym -- owner 0 -> era 1,
    // owner 7 (AI) -> era 3. Sam resolver zyje TYLKO w teście (jak w main.ts
    // empireEpochForOwner); advanceCityEconomy/converterThroughputForEra go tylko WOLAJA.
    const resolveOwnerEra = (ownerId) => (ownerId === 0 ? 1 : 3);

    const econ = M.advanceCityEconomy(
      cities, map, data, 'normal', [], new Map(), builtByCity,
      1, new Set(), new Map(), new Map(),
      resolveOwnerEra,
    );
    assert(!!econ, 'advanceCityEconomy nie rzuca wyjatku (2 ownerow, era1 vs era3)');

    eq(cPlayer.surowce.cegla, 50, 'gracz (era1): 50 cegiel/ture (baza, bez bonusu epoki, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
    eq(cPlayer.surowce.ceramika, 50, 'gracz (era1): 50 ceramiki/ture (baza, bez bonusu epoki, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10)');
    eq(cAi.surowce.cegla, 60, 'AI (era3): 60 cegiel/ture (+20% bazy -- MECHANIZM DZIALA DLA AI; R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 12)');
    eq(cAi.surowce.ceramika, 60, 'AI (era3): 60 ceramiki/ture (+20% bazy -- MECHANIZM DZIALA DLA AI; R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 12)');

    // Odlewnia_brazu: PLASKA dla OBU ownerow mimo roznych epok -- to jest sedno
    // "Odlewnie NIE skaluja sie" zweryfikowane w REALNYM silniku, nie tylko w
    // izolowanej funkcji czystej (sekcja C wyzej).
    eq(cPlayer.surowce.braz, 25, 'gracz (era1): 25 brazu/ture (Odlewnia plaska, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 5)');
    eq(cAi.surowce.braz, 25, 'AI (era3): 25 brazu/ture (Odlewnia plaska -- BEZ bonusu mimo epoki3; R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 5)');
  }
}

// --- summary ---------------------------------------------------------------
console.log(`\nconverter-era-scaling-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
