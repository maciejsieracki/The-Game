'use strict';
/**
 * praca-global-default-live-test.cjs -- znalezisko B (Maciej 2026-08-10, panel „Grecy" vs
 * panel miasta „Podział Pracy"): „powinno być plus sześć, a było plus dwa".
 *
 * RZECZYWISTA PRZYCZYNA (nie cache/live staleness -- formuła): commit 8692b61b
 * (R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A) poprawnie wpiął resolveCityPodzialPracy()
 * do toEconomyCity() (econCity.podziałPracy), ALE zapomniał przepiąć na niego arytmetykę
 * splitu Pracy w previewCityEconomy()/advanceCityEconomy() (turn-economy.ts) -- ta nadal
 * czytała `city.podzialPracy?.procentBudynki ?? params.suwaakPracaBudynki` wprost. Pole
 * `city.podzialPracy` jest wypełnione WYŁĄCZNIE gdy miasto ma aktywny lokalny override
 * (podzialPracyOverride=true) -- bez override jest `undefined`, więc split cicho spadał
 * na statyczny domyślny procent z JSON-a (`suwak_praca_budynki_domyslnie`, 70), CAŁKOWICIE
 * ignorując globalny suwak Pracy gracza (ownerDefaultPodzialPracy), mimo że panel miasta
 * (cityPanel.ts, effectivePodzialPracy -> ten sam resolveCityPodzialPracy) liczy poprawnie.
 *
 * Ten test odtwarza DOKŁADNIE zgłoszony scenariusz: 1 miasto BEZ lokalnego override,
 * globalny suwak Pracy zmieniony na "100% do puli" (procentBudynki=0) -> previewCityEconomy
 * (podgląd HUD/panel cywilizacji na żywo) ORAZ advanceCityEconomy (realny silnik końca tury)
 * MUSZĄ pokazać nowy split, nie statyczny domyślny.
 *
 * Run from gra/: node tools/praca-global-default-live-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-global-default-live-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.praca-global-default-live-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-global-default-live-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { previewCityEconomy, advanceCityEconomy } from '../src/game/turn-economy';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, advanceCityEconomy,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[praca-global-default-live-test] Bundling src/ with esbuild...');
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
  console.error('[praca-global-default-live-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, advanceCityEconomy,
} = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

const data  = loadGameData();
const map   = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 4242);
const start = computeStartPlacements(map, data);

const settler = {
  id: 'praca_global_test_settler',
  ownerId: 0,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: start.playerStart.q,
  r: start.playerStart.r,
  ruch: 2,
  ruchLeft: 2,
};

const city = foundCity(settler, [], map, cityName(0));
assert('fixture: foundCity zwraca miasto gracza', city !== null);
if (!city) { console.log(`\n${passed} passed, ${failed} failed`); process.exit(1); }

// BEZ lokalnego override -- dokładnie stan miasta świeżo założonego/bez pinu
// (seedCityOwnerDefaults w main.ts robi `delete c.podzialPracy` w tym przypadku).
city.podzialPracyOverride = false;
delete city.podzialPracy;

const cities = [city];
const builtByCity = new Map();

// ---------------------------------------------------------------------------
// 1. Sanity: bez ownerDefault w ogóle (Map pusta) -- musi spaść na statyczny
//    domyślny param (70/30 z data/econ-params.json), STARE zachowanie zachowane
//    dla wywołań, które (jak wiele testów w tools/) nie znają nowego mechanizmu.
// ---------------------------------------------------------------------------
{
  const previewNoMap = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
  );
  const tk = previewNoMap.perCity.find(t => t.cityId === city.id);
  assert(
    'bez ownerDefaultPodzialPracyByOwner (param pominięty): split = statyczny domyślny (70/30) -- bez regresji dla starych callerów',
    tk && tk.doBudynkow > tk.doPuli,
    tk ? `doBudynkow=${tk.doBudynkow} doPuli=${tk.doPuli}` : 'brak wpisu perCity',
  );
}

// ---------------------------------------------------------------------------
// Wywołania z JAWNIE POLICZONYMI, ponumerowanymi pozycjami argumentów (21 dla
// previewCityEconomy, 24 dla advanceCityEconomy) -- z asercją długości tablicy
// w runtime, żeby błąd przesunięcia pozycji (regresja tego samego rodzaju co
// bug B: cichy fallback na zły parametr) wywalił test od razu, a nie po cichu
// przekazał wartość w złe miejsce.
// ---------------------------------------------------------------------------
function previewArgs(cities_, map_, data_, builtByCity_, ownerDefaultPodzialPracyByOwner_) {
  const args = [
    cities_,          //  1 cities
    map_,             //  2 map
    data_,            //  3 data
    'normal',         //  4 difficulty
    builtByCity_,     //  5 builtByCity
    1,                //  6 playerEra
    new Set(),        //  7 playerZbadane
    new Map(),        //  8 ownerCivByOwnerId
    new Map(),        //  9 orderMultByCity
    undefined,        // 10 resolveOwnerEra
    undefined,        // 11 resolveOwnerTech
    undefined,        // 12 tradeRouteCountByCity
    undefined,        // 13 tradeIncomeByCity
    undefined,        // 14 territoryNodes
    undefined,        // 15 cityReligionByCityId
    undefined,        // 16 wonderCityYieldsByOwner
    undefined,        // 17 resolveOwnerZlotoAccess
    undefined,        // 18 resolveOwnerActiveLabels
    undefined,        // 19 resolveOwnerEmpireStock
    new Map(),        // 20 ownerDefaultPodzialHandluByOwner
    ownerDefaultPodzialPracyByOwner_, // 21 ownerDefaultPodzialPracyByOwner
  ];
  if (args.length !== 21) throw new Error(`previewArgs: oczekiwano 21 argumentów, jest ${args.length}`);
  return args;
}

function advanceArgs(cities_, map_, data_, builtByCity_, ownerDefaultPodzialPracyByOwner_) {
  const args = [
    cities_,          //  1 cities
    map_,             //  2 map
    data_,            //  3 data
    'normal',         //  4 difficulty
    [],               //  5 econUnits
    new Map(),        //  6 growthMultByCity
    builtByCity_,     //  7 builtByCity
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
  if (args.length !== 24) throw new Error(`advanceArgs: oczekiwano 24 argumentów, jest ${args.length}`);
  return args;
}

// ---------------------------------------------------------------------------
// 2. SEDNO ZNALEZISKA B: globalny suwak Pracy (ownerDefaultPodzialPracyByOwner)
//    ustawiony na "100% do puli" (procentBudynki=0) dla ownera 0. Miasto NIE ma
//    lokalnego override -- MUSI dziedziczyć globalną wartość, nie statyczny default.
// ---------------------------------------------------------------------------
const ownerDefaultPodzialPracy100Puli = new Map([[0, { procentBudynki: 0 }]]);

const previewGlobal = previewCityEconomy(...previewArgs(
  cities, map, data, builtByCity, ownerDefaultPodzialPracy100Puli,
));
const tkGlobal = previewGlobal.perCity.find(t => t.cityId === city.id);
assert(
  'previewCityEconomy: miasto BEZ override dziedziczy globalny suwak 100% do puli (doPuli == cała Praca, doBudynkow == 0)',
  !!tkGlobal && tkGlobal.doBudynkow === 0 && tkGlobal.doPuli > 0,
  tkGlobal ? `doBudynkow=${tkGlobal.doBudynkow} doPuli=${tkGlobal.doPuli}` : 'brak wpisu perCity',
);

// STARY BUG (regresja, gdyby ktoś cofnął naprawę): przy globalnym 100% do puli,
// stary kod nadal pokazywałby doBudynkow > 0 (70% statycznego defaultu z JSON-a).
assert(
  'STARY BUG (regresja, gdyby cofnięto naprawę): NIE wolno pokazać nadal 70/30 statycznego defaultu mimo globalnej zmiany na 100% do puli',
  !(tkGlobal && tkGlobal.doBudynkow > 0),
  tkGlobal ? `doBudynkow=${tkGlobal.doBudynkow} (chciano 0)` : 'brak wpisu perCity',
);

// ---------------------------------------------------------------------------
// 3. Ten sam globalny suwak MUSI też działać w REALNYM silniku końca tury
//    (advanceCityEconomy) -- to jest realny tick, nie tylko podgląd HUD. Gdyby
//    naprawiono tylko previewCityEconomy, gra i tak liczyłaby błędnie po End Turn.
// ---------------------------------------------------------------------------
const econGlobal = advanceCityEconomy(...advanceArgs(
  cities, map, data, builtByCity, ownerDefaultPodzialPracy100Puli,
));
const tkEcon = econGlobal.perCity.find(t => t.cityId === city.id);
assert(
  'advanceCityEconomy (silnik realnego końca tury): TAKŻE respektuje globalny suwak 100% do puli, nie tylko podgląd',
  !!tkEcon && tkEcon.doBudynkow === 0 && tkEcon.doPuli > 0,
  tkEcon ? `doBudynkow=${tkEcon.doBudynkow} doPuli=${tkEcon.doPuli}` : 'brak wpisu perCity',
);

// ---------------------------------------------------------------------------
// 4. Parytet: previewCityEconomy (podgląd HUD) i advanceCityEconomy (realny tick)
//    MUSZĄ zgadzać się co do liczb -- to jest cel oryginalnego zgłoszenia Macieja
//    (żeby panel nie kłamał względem tego, co silnik faktycznie policzy).
// ---------------------------------------------------------------------------
assert(
  'PARYTET podgląd/silnik: doPuli identyczne w previewCityEconomy i advanceCityEconomy (ten sam split globalny)',
  !!tkGlobal && !!tkEcon && tkGlobal.doPuli === tkEcon.doPuli,
  tkGlobal && tkEcon ? `preview.doPuli=${tkGlobal.doPuli} econ.doPuli=${tkEcon.doPuli}` : 'brak jednego z wpisów',
);

// ---------------------------------------------------------------------------
// 5. Lokalny override MUSI nadal działać poprawnie (miasto z override IGNORUJE
//    zmianę globalnego suwaka) -- fix nie może złamać istniejący mechanizm pinu.
// ---------------------------------------------------------------------------
city.podzialPracyOverride = true;
city.podzialPracy = { procentBudynki: 40 };

// globalna nadal "100% do puli" -- override musi to zignorować
const previewOverride = previewCityEconomy(...previewArgs(
  cities, map, data, builtByCity, ownerDefaultPodzialPracy100Puli,
));
const tkOverride = previewOverride.perCity.find(t => t.cityId === city.id);
const totalPraca = tkOverride ? tkOverride.doBudynkow + tkOverride.doPuli : 0;
const expectedDoBudynkow = Math.round(totalPraca * 0.40);
assert(
  'override lokalny (40% do budynków) NIE dziedziczy globalnego 100% do puli -- pin działa mimo naprawy',
  !!tkOverride && tkOverride.doBudynkow === expectedDoBudynkow,
  tkOverride ? `doBudynkow=${tkOverride.doBudynkow} chciano round(${totalPraca}*0.40)=${expectedDoBudynkow}` : 'brak wpisu perCity',
);

console.log('');
console.log(`praca-global-default-live-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
