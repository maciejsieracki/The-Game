'use strict';
/**
 * ai-nauka-podzial-tura1-seed-test.cjs -- P-AI-BADANIA-ZACOFANIE-Q1, RUNDA 2 (Obrona
 * Rundy 1, Zarzut 1, PRZYJĘTE): świeżo założone/spawnowane miasto ownera AI liczyło
 * TURĘ 1 z procentNauka=20 (default GRACZA, `DEFAULT_PODZIAL_HANDLU` z cities.ts), bo
 * `advanceCityEconomy`/`previewCityEconomy` (game/turn-economy.ts) czytają
 * `ownerDefaultPodzialHandlu` PRZED pierwszym wywołaniem `decideAIEconomySliders` w
 * `ownerLoop` (main.ts) -- to wywołanie dopiero nadpisuje wartość na
 * `AI_FIXED_PROCENT_NAUKA`=60, ale za późno na tę samą turę. Naprawa (Runda 2):
 * `initOwnerDefaultPodzialHandlu()`/`seedCityOwnerDefaults()` i dwa analogiczne seedy
 * (main.ts) seedują teraz ownerId!==0 (każde AI, w tym miasto-państwo świeżo spawnowane
 * w trakcie gry) bezpośrednio na `AI_FIXED_PROCENT_NAUKA`, nie na
 * `freshOwnerDefaultPodzialHandlu()` (=20, default gracza).
 *
 * Wzorowany 1:1 na `ai-praca-podzial-tura1-seed-test.cjs` (ten sam styl: foundCity +
 * previewCityEconomy/advanceCityEconomy PRAWDZIWEGO silnika, bez reimplementacji jego
 * arytmetyki). `initOwnerDefaultPodzialHandlu`/`seedCityOwnerDefaults` są domknięciami
 * PRYWATNYMI wewnątrz `main()` (main.ts) -- nie do zaimportowania osobno, więc ten test
 * odtwarza DOKŁADNIE ich nową gałąź (ownerId!==0 -> {...DEFAULT_PODZIAL_HANDLU,
 * procentNauka: AI_FIXED_PROCENT_NAUKA}) jako wejście `ownerDefaultPodzialHandluByOwner`
 * do previewCityEconomy/advanceCityEconomy. Weryfikacja samej gałęzi main.ts (statyczna)
 * jest osobnym krokiem w raporcie Operatora (grep na main.ts).
 *
 * Run from gra/: node tools/ai-nauka-podzial-tura1-seed-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-nauka-podzial-tura1-seed-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.ai-nauka-podzial-tura1-seed-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-nauka-podzial-tura1-seed-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName, DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA } from '../src/game/cities';
import { freshOwnerDefaultPodzialHandlu } from '../src/game/empire-handel-split';
import { loadGameData } from '../src/data/loader';
import { previewCityEconomy, advanceCityEconomy } from '../src/game/turn-economy';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName, DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA,
  freshOwnerDefaultPodzialHandlu,
  loadGameData,
  previewCityEconomy, advanceCityEconomy,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[ai-nauka-podzial-tura1-seed-test] Bundling src/ with esbuild...');
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
  console.error('[ai-nauka-podzial-tura1-seed-test] esbuild failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch {}
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName, DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA,
  freshOwnerDefaultPodzialHandlu,
  loadGameData,
  previewCityEconomy, advanceCityEconomy,
} = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

assert('fixture: DEFAULT_PODZIAL_HANDLU.procentNauka === 20 (default GRACZA)', DEFAULT_PODZIAL_HANDLU.procentNauka === 20);
assert('fixture: AI_FIXED_PROCENT_NAUKA === 60', AI_FIXED_PROCENT_NAUKA === 60);
assert('fixture: freshOwnerDefaultPodzialHandlu() zwraca procentNauka=20 (to właśnie było błędnie seedowane AI)', freshOwnerDefaultPodzialHandlu().procentNauka === 20);

const data  = loadGameData();
const map   = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 9191);
const start = computeStartPlacements(map, data);

// ownerId=1 -- świeży AI (major LUB miasto-państwo, mechanizm seedowania main.ts nie
// rozróżnia -- oba to ownerId!==0), świeżo założone miasto, brak wpisu w
// aiSliderStateByOwner (parytet ze scenariuszem z dispatchu: "tura 1, świeży owner AI,
// brak wpisu w aiSliderStateByOwner").
assert('fixture: mapa ma co najmniej 1 start AI', Array.isArray(start.aiStarts) && start.aiStarts.length > 0);
const aiStart = start.aiStarts[0];

const settler = {
  id: 'ai_tura1_nauka_seed_test_settler',
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

city.podzialHandluOverride = false;
delete city.podzialHandlu;

const cities = [city];
const builtByCity = new Map();

function previewArgs(ownerDefaultPodzialHandluByOwner_) {
  const args = [
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined,
    ownerDefaultPodzialHandluByOwner_,
    new Map(),
  ];
  if (args.length !== 21) throw new Error(`previewArgs: oczekiwano 21, jest ${args.length}`);
  return args;
}

function advanceArgs(ownerDefaultPodzialHandluByOwner_) {
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
    ownerDefaultPodzialHandluByOwner_, // 22 ownerDefaultPodzialHandluByOwner
    undefined,        // 23 manpowerHeal
    new Map(),        // 24 ownerDefaultPodzialPracyByOwner
  ];
  if (args.length !== 24) throw new Error(`advanceArgs: oczekiwano 24, jest ${args.length}`);
  return args;
}

// ---------------------------------------------------------------------------
// A. REGRES ODTWORZONY ŻYWO: stary seed (gałąź main.ts SPRZED naprawy Rundy 2 --
//    freshOwnerDefaultPodzialHandlu() dla KAŻDEGO ownera, w tym AI) -- tura 1 dawała
//    procentNauka=20, nie 60. To DOKŁADNIE Zarzut 1 z Obrony Rundy 1.
// ---------------------------------------------------------------------------
const seedPrzedNaprawa = new Map([[1, freshOwnerDefaultPodzialHandlu()]]); // {procentNauka:20,...}
let naukaRegres;
{
  const prev = previewCityEconomy(...previewArgs(seedPrzedNaprawa));
  const tk = prev.perCity.find(t => t.cityId === city.id);
  naukaRegres = tk ? tk.nauka : undefined;
  assert(
    'REGRES (odtworzony żywo, gałąź main.ts SPRZED naprawy Rundy 2): tura 1 AI z seedem procentNauka=20 -> nauka policzona z 20%, NIE z 60% -- dokładnie Zarzut 1 Obrony',
    !!tk,
    tk ? `nauka=${tk.nauka}` : 'brak wpisu perCity',
  );
}

// ---------------------------------------------------------------------------
// B. NAPRAWA: nowa gałąź main.ts (ownerId!==0 -> {...DEFAULT_PODZIAL_HANDLU,
//    procentNauka: AI_FIXED_PROCENT_NAUKA}) -- tura 1 AI, PRZED pierwszym wywołaniem
//    decideAIEconomySliders, musi już liczyć z procentNauka=60 w previewCityEconomy
//    ORAZ w realnym advanceCityEconomy.
// ---------------------------------------------------------------------------
const seedPoNaprawie = new Map([[1, { ...DEFAULT_PODZIAL_HANDLU, procentNauka: AI_FIXED_PROCENT_NAUKA }]]);

{
  const prev = previewCityEconomy(...previewArgs(seedPoNaprawie));
  const tk = prev.perCity.find(t => t.cityId === city.id);
  assert(
    'NAPRAWA: previewCityEconomy tura 1 AI z nowym seedem (procentNauka=60) -> nauka wyraźnie wyższa niż z regresu (20%), okno Zarzutu 1 zamknięte',
    !!tk && naukaRegres !== undefined && tk.nauka > naukaRegres,
    tk ? `nauka(60%)=${tk.nauka} vs nauka(20%,regres)=${naukaRegres}` : 'brak wpisu perCity',
  );
}

{
  const econ = advanceCityEconomy(...advanceArgs(seedPoNaprawie));
  const tk = econ.perCity.find(t => t.cityId === city.id);
  const econRegres = advanceCityEconomy(...advanceArgs(seedPrzedNaprawa));
  const tkRegres = econRegres.perCity.find(t => t.cityId === city.id);
  assert(
    'NAPRAWA: advanceCityEconomy (realny silnik końca tury) tura 1 AI z nowym seedem (60%) -> nauka > nauka ze starym seedem (20%), zanim decideAIEconomySliders w ogóle się wykonała',
    !!tk && !!tkRegres && tk.nauka > tkRegres.nauka,
    `nowy: nauka=${tk && tk.nauka} | stary: nauka=${tkRegres && tkRegres.nauka}`,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(BUNDLE_FILE); } catch {}
process.exit(failed === 0 ? 0 : 1);
