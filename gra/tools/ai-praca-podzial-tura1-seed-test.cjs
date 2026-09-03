'use strict';
/**
 * ai-praca-podzial-tura1-seed-test.cjs -- R-AI-PRACA-PODZIAL-STALY-50-50-Q1, RUNDA 1
 * Zarzut 1 Evaluatora (KRYTYCZNY, PRZYJĘTY): świeżo założone miasto ownera AI liczyło
 * TURĘ 1 z procentBudynki=70 (default GRACZA, DEFAULT_PODZIAL_PRACY z cities.ts), bo
 * `advanceCityEconomy` w `triggerPlayerEndTurn` (main.ts ok. 26736) czyta
 * `ownerDefaultPodzialPracy` PRZED pierwszym wywołaniem `decideAIEconomySliders` w
 * `ownerLoop` (main.ts ok. 28505) -- to wywołanie dopiero nadpisuje default na
 * AI_FIXED_PROCENT_BUDYNKI=50, ale za późno na tę samą turę. Naprawa (Runda 1):
 * `initOwnerDefaultCityFields()`/`seedCityOwnerDefaults()` (main.ts) seedują teraz
 * ownerId!==0 (każde AI, w tym miasto-państwo) bezpośrednio na AI_FIXED_PROCENT_BUDYNKI,
 * nie na `freshOwnerDefaultPodzialPracy()` (=70, default gracza).
 *
 * `initOwnerDefaultCityFields`/`seedCityOwnerDefaults` są domknięciami PRYWATNYMI
 * wewnątrz `main()` (main.ts) -- nie do zaimportowania osobno. Ten test odtwarza
 * DOKŁADNIE ich nową gałąź (ownerId!==0 -> {procentBudynki: AI_FIXED_PROCENT_BUDYNKI})
 * jako wejście do PRAWDZIWEGO silnika ekonomii (foundCity, previewCityEconomy,
 * advanceCityEconomy -- bez reimplementacji ich arytmetyki, wzorem
 * praca-global-default-live-test.cjs) i dowodzi: (a) ze starym seedem (70, gałąź
 * sprzed naprawy) tura 1 dawała >50% budynków -- regresja odtworzona żywo; (b) z
 * nowym seedem (AI_FIXED_PROCENT_BUDYNKI=50) tura 1 daje dokładnie 50/50, ZANIM
 * `decideAIEconomySliders` w ogóle się wykona -- okno z Zarzutu 1 zamknięte.
 * Weryfikacja samej gałęzi main.ts (statyczna, że `initOwnerDefaultCityFields` i
 * `seedCityOwnerDefaults` faktycznie zawierają `ownerId === 0 ? ... : { procentBudynki:
 * AI_FIXED_PROCENT_BUDYNKI }`) jest osobnym krokiem w raporcie Operatora (grep na
 * main.ts), bo main.ts sam nie da się tu zbundlować bez uruchamiania UI/DOM.
 *
 * Run from gra/: node tools/ai-praca-podzial-tura1-seed-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-praca-podzial-tura1-seed-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.ai-praca-podzial-tura1-seed-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-praca-podzial-tura1-seed-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName, DEFAULT_PODZIAL_PRACY, AI_FIXED_PROCENT_BUDYNKI } from '../src/game/cities';
import { freshOwnerDefaultPodzialPracy } from '../src/game/empire-city-defaults';
import { loadGameData } from '../src/data/loader';
import { previewCityEconomy, advanceCityEconomy } from '../src/game/turn-economy';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName, DEFAULT_PODZIAL_PRACY, AI_FIXED_PROCENT_BUDYNKI,
  freshOwnerDefaultPodzialPracy,
  loadGameData,
  previewCityEconomy, advanceCityEconomy,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[ai-praca-podzial-tura1-seed-test] Bundling src/ with esbuild...');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle:      true,
    platform:    'node',
    format:      'cjs',
    outfile:     BUNDLE_FILE,
    loader:      { '.json': 'json', '.ts': 'ts' },
    target:      ['node16'],
    logLevel:    'warning',
  });
} catch (e) {
  console.error('[ai-praca-podzial-tura1-seed-test] esbuild failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch {}
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName, DEFAULT_PODZIAL_PRACY, AI_FIXED_PROCENT_BUDYNKI,
  freshOwnerDefaultPodzialPracy,
  loadGameData,
  previewCityEconomy, advanceCityEconomy,
} = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

assert('fixture: DEFAULT_PODZIAL_PRACY.procentBudynki === 70 (default GRACZA)', DEFAULT_PODZIAL_PRACY.procentBudynki === 70);
assert('fixture: AI_FIXED_PROCENT_BUDYNKI === 50', AI_FIXED_PROCENT_BUDYNKI === 50);
assert('fixture: freshOwnerDefaultPodzialPracy() zwraca 70 (to właśnie było błędnie seedowane AI)', freshOwnerDefaultPodzialPracy().procentBudynki === 70);

const data  = loadGameData();
const map   = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 9191);
const start = computeStartPlacements(map, data);

// ownerId=1 -- świeży AI (major LUB miasto-państwo, mechanizm seedowania main.ts
// nie rozróżnia -- oba to ownerId!==0), świeżo założone miasto, BEZ lokalnego override,
// dokładnie jak po `seedCityOwnerDefaults`/`initOwnerDefaultCityFields` (main.ts).
assert('fixture: mapa ma co najmniej 1 start AI', Array.isArray(start.aiStarts) && start.aiStarts.length > 0);
const aiStart = start.aiStarts[0];

const settler = {
  id: 'ai_tura1_seed_test_settler',
  ownerId: 1,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: aiStart.q,
  r: aiStart.r,
  ruch: 2,
  ruchLeft: 2,
};

const city = foundCity(settler, [], map, cityName(1));
assert('fixture: foundCity zwraca miasto AI', city !== null);
if (!city) { console.log(`\n${passed} passed, ${failed} failed`); process.exit(1); }

city.podzialPracyOverride = false;
delete city.podzialPracy;

const cities = [city];
const builtByCity = new Map();

function previewArgs(ownerDefaultPodzialPracyByOwner_) {
  const args = [
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined,
    new Map(),
    ownerDefaultPodzialPracyByOwner_,
  ];
  if (args.length !== 21) throw new Error(`previewArgs: oczekiwano 21, jest ${args.length}`);
  return args;
}

function advanceArgs(ownerDefaultPodzialPracyByOwner_) {
  const args = [
    cities,           //  1 cities
    map,              //  2 map
    data,             //  3 data
    'normal',         //  4 difficulty
    [],               //  5 econUnits
    new Map(),        //  6 growthMultByCity
    builtByCity,      //  7 builtByCity
    1,                //  8 playerEra
    new Set(),        //  9 playerZbadane
    new Map(),        // 10 ownerCivByOwnerId
    new Map(),        // 11 orderMultByCity
    undefined,        // 12 resolveOwnerEra
    undefined,        // 13 resolveOwnerTech
    'wysoki',         // 14 wzrostLudnosciPace
    undefined,        // 15 tradeRouteCountByCity
    undefined,        // 16 tradeIncomeByCity
    undefined,        // 17 cityReligionByCityId
    undefined,        // 18 wonderCityYieldsByOwner
    undefined,        // 19 resolveOwnerZlotoAccess
    undefined,        // 20 resolveOwnerActiveLabels
    undefined,        // 21 resolveOwnerEmpireStock
    new Map(),        // 22 ownerDefaultPodzialHandluByOwner
    undefined,        // 23 manpowerHeal
    ownerDefaultPodzialPracyByOwner_, // 24 ownerDefaultPodzialPracyByOwner
  ];
  if (args.length !== 24) throw new Error(`advanceArgs: oczekiwano 24, jest ${args.length}`);
  return args;
}

// ---------------------------------------------------------------------------
// A. REGRES ODTWORZONY ŻYWO: stary seed (gałąź main.ts SPRZED naprawy Rundy 1 --
//    freshOwnerDefaultPodzialPracy() dla KAŻDEGO ownera, w tym AI) -- tura 1
//    dawała >50% budynków, nie 50%. To DOKŁADNIE Zarzut 1 Evaluatora.
// ---------------------------------------------------------------------------
const seedPrzedNaprawa = new Map([[1, freshOwnerDefaultPodzialPracy()]]); // {procentBudynki:70}
{
  const prev = previewCityEconomy(...previewArgs(seedPrzedNaprawa));
  const tk = prev.perCity.find(t => t.cityId === city.id);
  assert(
    'REGRES (odtworzony żywo, gałąź main.ts SPRZED naprawy): tura 1 AI z seedem 70 -> doBudynkow > doPuli (NIE 50/50) -- dokładnie Zarzut 1',
    !!tk && tk.doBudynkow > tk.doPuli,
    tk ? `doBudynkow=${tk.doBudynkow} doPuli=${tk.doPuli}` : 'brak wpisu perCity',
  );
}

// ---------------------------------------------------------------------------
// B. NAPRAWA: nowa gałąź main.ts (ownerId!==0 -> {procentBudynki: AI_FIXED_PROCENT_
//    BUDYNKI}) -- tura 1 AI, PRZED pierwszym wywołaniem decideAIEconomySliders,
//    musi już liczyć 50/50 w previewCityEconomy ORAZ w realnym advanceCityEconomy.
// ---------------------------------------------------------------------------
const seedPoNaprawie = new Map([[1, { procentBudynki: AI_FIXED_PROCENT_BUDYNKI }]]);

// Tolerancja zaokrąglenia: przy nieparzystej sumie doBudynkow+doPuli, dokładne 50%
// zaokrągla się do różnicy o 1 (np. total=5 -> 3/2), NIE do równości -- to samo
// zjawisko, które Evaluator opisał dla 70% na małych liczbach ("doBudynkow=6
// doPuli=3" ~ 67% zamiast 70% -- zniekształcenie zaokrągleniem). Test sprawdza więc
// odleglosc od 50% (|doBudynkow-doPuli|<=1), NIE równość, i osobno kontrastuje z
// regresem wyżej, gdzie różnica jest wyraźnie większa niż zaokrąglenie o 1 (kierunek
// do 70/30, nie do 50/50).
{
  const prevRegres = previewCityEconomy(...previewArgs(seedPrzedNaprawa));
  const tkRegres = prevRegres.perCity.find(t => t.cityId === city.id);
  const prev = previewCityEconomy(...previewArgs(seedPoNaprawie));
  const tk = prev.perCity.find(t => t.cityId === city.id);
  assert(
    'NAPRAWA: previewCityEconomy tura 1 AI z nowym seedem (50) -> |doBudynkow-doPuli|<=1 (50/50 w granicach zaokraglenia), okno Zarzutu 1 zamknięte',
    !!tk && Math.abs(tk.doBudynkow - tk.doPuli) <= 1,
    tk ? `doBudynkow=${tk.doBudynkow} doPuli=${tk.doPuli}` : 'brak wpisu perCity',
  );
  assert(
    'NAPRAWA vs REGRES: split z nowym seedem (50) wyraźnie bliższy 50/50 niż split ze starym seedem (70) dla tej samej sytuacji',
    !!tk && !!tkRegres && Math.abs(tk.doBudynkow - tk.doPuli) < Math.abs(tkRegres.doBudynkow - tkRegres.doPuli),
    `nowy: doBudynkow=${tk && tk.doBudynkow} doPuli=${tk && tk.doPuli} | stary: doBudynkow=${tkRegres && tkRegres.doBudynkow} doPuli=${tkRegres && tkRegres.doPuli}`,
  );
}

{
  const econ = advanceCityEconomy(...advanceArgs(seedPoNaprawie));
  const tk = econ.perCity.find(t => t.cityId === city.id);
  assert(
    'NAPRAWA: advanceCityEconomy (realny silnik końca tury) tura 1 AI z nowym seedem (50) -> |doBudynkow-doPuli|<=1 (50/50 w granicach zaokraglenia)',
    !!tk && Math.abs(tk.doBudynkow - tk.doPuli) <= 1,
    tk ? `doBudynkow=${tk.doBudynkow} doPuli=${tk.doPuli}` : 'brak wpisu perCity',
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(BUNDLE_FILE); } catch {}
process.exit(failed === 0 ? 0 : 1);
