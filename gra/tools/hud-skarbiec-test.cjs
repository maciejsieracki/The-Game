'use strict';
/**
 * hud-skarbiec-test.cjs -- standalone Node test guarding the HUD "Skarbiec"
 * chip fix (Maciej 2026-07-26, zgloszenie z playtestu, bundle 2f928932):
 * "Skarbiec chyba nie pokazuje teraz prawdziwej ilosci. Obok jest plus szesc,
 * a dochodzi tylko jedna jednostka."
 *
 * Root cause: the HUD chip's "+N" was wired to the GROSS money income from
 * city yields (playerEcon.pieniadz, sum of Danina/Podatek + budynki + Handel
 * ze szlakow), while the real end-of-turn bank ("Bank treasury" block in
 * main.ts) subtracts building + unit gold upkeep (upkeepBalance, Spec s.6.4)
 * AFTER banking that income. So the chip promised more than the treasury
 * actually gained whenever upkeep was nonzero.
 *
 * This test builds a tiny fixture (1 city, 2 buildings with nonzero
 * `utrzymanie`, 1 unit with nonzero gold upkeep) and asserts that the NET
 * number the HUD is meant to show (gross city income - building upkeep - unit
 * upkeep, computed via previewCityEconomy + previewOwnerUpkeep -- the exact
 * functions main.ts's refreshLiveEmpireRates() calls for the live chip) equals
 * the REAL delta the treasury undergoes after a full advanceCityEconomy tick
 * (the same functions main.ts's end-of-turn "Bank treasury" block uses).
 *
 * Run from gra/:  node tools/hud-skarbiec-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hud-skarbiec-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.hud-skarbiec-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hud-skarbiec-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import {
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
} from '../src/game/turn-economy';
import {
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  computeSeaTradeBonusIncomeByCity, computeSeaTradeRouteCountByCity,
  loadTradeRouteIncomeParams,
} from '../src/game/trade-routes';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  computeSeaTradeBonusIncomeByCity, computeSeaTradeRouteCountByCity,
  loadTradeRouteIncomeParams,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[hud-skarbiec-test] Bundling src/ with esbuild...');
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
  console.error('[hud-skarbiec-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  computeSeaTradeBonusIncomeByCity, computeSeaTradeRouteCountByCity,
  loadTradeRouteIncomeParams,
} = require(BUNDLE_FILE);

// ---------------------------------------------------------------------------
// Assertion harness (same minimal style as the other tools/*-test.cjs files)
// ---------------------------------------------------------------------------
let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

// ---------------------------------------------------------------------------
// Fixture: 1 player city with 2 buildings carrying nonzero `utrzymanie`
// (era 1: "palac" utrzymanie=2, "spichlerz" utrzymanie=1 -- see data/buildings.json)
// + 1 unit with nonzero gold upkeep (category "miecznik" -> fallback 2/ture,
// DEFAULT_UNIT_UPKEEP_BY_CATEGORY in economy-upkeep.ts -- a typeId deliberately
// absent from units.json so the category fallback, not a per-type override, is
// what is exercised here).
// ---------------------------------------------------------------------------
const data  = loadGameData();
const map   = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 4242);
const start = computeStartPlacements(map, data);

const settler = {
  id: 'skarbiec_test_settler',
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

if (city) {
  const cities = [city];
  const builtByCity = new Map([[city.id, ['palac', 'spichlerz']]]);
  const econUnits = [
    { ownerId: 0, typeId: 'skarbiec_test_miecznik', category: 'miecznik', camping: false, onOwnTerritory: true },
  ];

  // --- "Shown" side: the same two calls main.ts's refreshLiveEmpireRates()
  // makes for the live HUD chip BEFORE end of turn (read-only, no mutation). ---
  const preview     = previewCityEconomy(cities, map, data, 'normal', builtByCity);
  const playerEcon  = sumEconomyForPlayerCities(preview, cities);
  const upkeepPrev  = previewOwnerUpkeep(0, cities, data, 'normal', builtByCity, econUnits);

  assert(
    'fixture ma niezerowe utrzymanie (budynki + jednostki)',
    upkeepPrev.utrzymanieRazem > 0,
    `utrzymanieBudynki=${upkeepPrev.utrzymanieBudynki} utrzymanieJednostki=${upkeepPrev.utrzymanieJednostki}`,
  );
  assert('utrzymanie budynkow > 0 (palac + spichlerz)', upkeepPrev.utrzymanieBudynki > 0,
    `got ${upkeepPrev.utrzymanieBudynki}`);
  assert('utrzymanie jednostek > 0 (miecznik fallback)', upkeepPrev.utrzymanieJednostki > 0,
    `got ${upkeepPrev.utrzymanieJednostki}`);

  const shownRate = playerEcon.pieniadz - upkeepPrev.utrzymanieRazem;

  assert(
    'STARY BUG (regresja): "+N" pokazywany na chipie NIE moze byc rownym wplywom brutto, gdy utrzymanie niezerowe',
    shownRate !== playerEcon.pieniadz,
    `shownRate=${shownRate} pieniadzBrutto=${playerEcon.pieniadz} utrzymanieRazem=${upkeepPrev.utrzymanieRazem}`,
  );

  // --- "Real" side: an actual end-of-turn tick, exactly like main.ts's
  // "Bank treasury" block (player.skarbiec += pieniadzGracza; player.skarbiec
  // -= playerBalance.utrzymanieRazem;) -- simulated against a mock treasury. ---
  let mockSkarbiec = 1000;
  const before = mockSkarbiec;

  const econ          = advanceCityEconomy(cities, map, data, 'normal', econUnits, new Map(), builtByCity);
  const realPlayerEcon = sumEconomyForPlayerCities(econ, cities);
  const realBalance    = econ.upkeepByOwner.get(0);

  mockSkarbiec += realPlayerEcon.pieniadz;
  if (realBalance && realBalance.utrzymanieRazem > 0) {
    mockSkarbiec -= realBalance.utrzymanieRazem;
  }
  const realDelta = mockSkarbiec - before;

  assert(
    'kontrolne: real-tick utrzymanieRazem tez niezerowe (fixture spojny miedzy preview i real)',
    !!realBalance && realBalance.utrzymanieRazem > 0,
    `utrzymanieRazem=${realBalance ? realBalance.utrzymanieRazem : 'undefined'}`,
  );

  assert(
    'NAPRAWA HUD-SKARBIEC: liczba pokazywana przy Skarbcu ("+N") == realna zmiana stanu skarbca po turze',
    shownRate === realDelta,
    `shownRate=${shownRate} realDelta=${realDelta}`,
  );

  // -------------------------------------------------------------------------
  // R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1: scenariusz z AKTYWNA trasa handlowa o
  // NIEZEROWYM dochodzie (zgloszenie wlasciciela: panel "Handel" pokazuje
  // "+157 zlota/ture" z tras, ale panel "Skarbiec" liczy handel jako 0).
  // Trasa ladowa, dystans=6, status='polaczony' -- realny, niezerowy dochod
  // (REGULA PRZECIW SAMOOSZUKIWANIU: fixture BEZ tras trywialnie przeszedlby
  // niezaleznie od poprawki, wiec ta trasa MUSI istniec i dawac >0). toCityId
  // celowo NIE jest realnym miastem w `cities` -- druga strona trasy jest poza
  // podgladem gracza (AI/inne miasto), dokladnie jak w realnej rozgrywce z
  // wieloma miastami; liczy sie tylko, czy WLASNE miasto (fromCityId=city.id)
  // dostaje swoj wklad. budynekOdblokowany=false: izoluje test na dochodzie
  // DYSTANSOWYM (pozycja 11, sedno zgloszenia wlasciciela) bez domieszania
  // premii budynkowej 5% (pozycja 10) do arytmetyki netto sprawdzanej nizej --
  // to, ze pozycja 10 dostaje teraz REALNA mape (nie undefined), jest
  // weryfikowane osobno (tsc + brak crasha + niepusta mapa z tradeRouteBuildingBonusByCity).
  const tradeRoutesFixture = [{
    id: 'skarbiec_test_route',
    fromCityId: city.id,
    toCityId: 'skarbiec_test_other_city',
    ownerId: 0,
    toOwnerId: 0,
    medium: 'lad',
    dystans: 6,
    status: 'polaczony',
    budynekOdblokowany: false,
  }];
  const tradeIncomeParamsFixture = loadTradeRouteIncomeParams(data.econParams, 'normal');
  const tradeIncomeByCityFixture = computeTradeRouteIncomeByCity(
    tradeRoutesFixture, tradeIncomeParamsFixture, () => 0,
  );
  const seaBonusByCityFixture = computeSeaTradeBonusIncomeByCity(
    computeSeaTradeRouteCountByCity(tradeRoutesFixture),
  );
  for (const [cid, bonus] of seaBonusByCityFixture) {
    tradeIncomeByCityFixture.set(cid, (tradeIncomeByCityFixture.get(cid) ?? 0) + bonus);
  }
  const tradeBuildingBonusByCityFixture = computeTradeRouteBuildingBonusByCity(
    tradeRoutesFixture, tradeIncomeParamsFixture,
  );

  assert(
    'fixture trasy: trasa daje REALNY, NIEZEROWY dochod dystansowy (nie 0)',
    (tradeIncomeByCityFixture.get(city.id) ?? 0) > 0,
    `dochod=${tradeIncomeByCityFixture.get(city.id)}`,
  );

  // --- pozycja 10 (tradeRouteBuildingBonusByCity): dowod osobny, ze poprawka
  // faktycznie przekazuje TEZ TA mape (nie tylko dochod z pozycji 11) -- trasa
  // Z budynkiem daje niezerowa premie, previewCityEconomy ja przyjmuje bez
  // bledu i wynik pieniadzZTras nie zalezy od niej (premia budynkowa idzie do
  // Handlu/Podatku, nie wprost do pieniadzZTras -- inny kanal, patrz turn-economy.ts).
  const tradeRoutesZBudynkiem = [{ ...tradeRoutesFixture[0], id: 'skarbiec_test_route_bud', budynekOdblokowany: true }];
  const tradeBuildingBonusZBudynkiem = computeTradeRouteBuildingBonusByCity(
    tradeRoutesZBudynkiem, tradeIncomeParamsFixture,
  );
  assert(
    'pozycja 10: trasa Z budynkiem daje niezerowa premie budynkowa (fixture zdolny wykryc regres na tej pozycji)',
    (tradeBuildingBonusZBudynkiem.get(city.id) ?? 0) > 0,
    `premia=${tradeBuildingBonusZBudynkiem.get(city.id)}`,
  );
  const previewZBudynkiem = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined,
    tradeBuildingBonusZBudynkiem, tradeIncomeByCityFixture,
  );
  assert(
    'pozycja 10: previewCityEconomy przyjmuje realna mape tradeRouteBuildingBonusByCity bez bledu',
    !!previewZBudynkiem && previewZBudynkiem.perCity.length > 0,
  );

  // --- "PODGLAD PO POPRAWCE": dokladnie wzorzec main.ts refreshLiveEmpireRatesUnsafe
  // po fix -- previewCityEconomy dostaje REALNIE POLICZONE mapy na pozycjach 12/13. ---
  const previewFixed = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined,
    tradeBuildingBonusByCityFixture, tradeIncomeByCityFixture,
  );
  const playerEconFixed = sumEconomyForPlayerCities(previewFixed, cities);

  assert(
    'NAPRAWA PODGLADU: pieniadzZTras w podgladzie HUD == realny dochod trasy (nie 0)',
    playerEconFixed.pieniadzZTras === tradeIncomeByCityFixture.get(city.id),
    `pieniadzZTras=${playerEconFixed.pieniadzZTras} oczekiwano=${tradeIncomeByCityFixture.get(city.id)}`,
  );

  // --- MUTACJA (dowod nietautologicznosci -- kryterium 4 dispatchu): dokladnie
  // TA SAMA sciezka wywolania, ale z `undefined` na pozycjach 12/13, tak jak
  // przed poprawka w main.ts (BUG-SKARBIEC-HANDEL-PODGLAD-ZERO) -- musi wrocic
  // do 0 mimo REALNEJ, niezerowej trasy. Jesli ktos w main.ts znow poda
  // `undefined` w tym miejscu, ten SAM defekt (podglad=0 mimo aktywnych tras)
  // odtwarza sie tutaj identycznie. ---
  const previewBuggy = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined,
    undefined, undefined,
  );
  const playerEconBuggy = sumEconomyForPlayerCities(previewBuggy, cities);

  assert(
    'REGRESJA (BUG-SKARBIEC-HANDEL-PODGLAD-ZERO odtworzony celowo): undefined na poz. 12/13 daje pieniadzZTras=0 mimo aktywnej trasy',
    playerEconBuggy.pieniadzZTras === 0,
    `pieniadzZTras=${playerEconBuggy.pieniadzZTras}`,
  );
  assert(
    'DOWOD NIETAUTOLOGICZNOSCI: podglad Z poprawka != podglad BEZ poprawki (ta sama trasa, ten sam dochod > 0)',
    playerEconFixed.pieniadzZTras !== playerEconBuggy.pieniadzZTras,
    `fixed=${playerEconFixed.pieniadzZTras} buggy=${playerEconBuggy.pieniadzZTras}`,
  );

  // --- KRYTERIUM 2: "Netto skarbiec" UWZGLEDNIA dochod z tras w calej sumie,
  // nie tylko w oderwanym wierszu "Handel ze szlakow". ---
  const upkeepPrevFixed = previewOwnerUpkeep(0, cities, data, 'normal', builtByCity, econUnits);
  const shownRateFixed = playerEconFixed.pieniadz - upkeepPrevFixed.utrzymanieRazem;
  assert(
    'KRYTERIUM 2: netto skarbiec Z trasa > netto skarbiec BEZ trasy (dochod z tras realnie wchodzi do sumy)',
    shownRateFixed > shownRate,
    `shownRateFixed=${shownRateFixed} shownRate(bez trasy)=${shownRate}`,
  );
  assert(
    'KRYTERIUM 2: cala roznica netto (Z trasa - BEZ trasy) == dochod z trasy (nie tylko wiersz Handlu zmienia sie w oderwaniu)',
    shownRateFixed - shownRate === tradeIncomeByCityFixture.get(city.id),
    `delta=${shownRateFixed - shownRate} oczekiwano=${tradeIncomeByCityFixture.get(city.id)}`,
  );

  // --- KRYTERIUM 3: realny stan skarbca po koncu tury rosnie DOKLADNIE o
  // wartosc pokazana w podgladzie PRZED koncem tury (advanceCityEconomy,
  // TA SAMA sciezka co blok konca tury main.ts:26244-26257, z tymi samymi
  // mapami tras na pozycjach 15/16). ---
  let mockSkarbiecTrasy = 1000;
  const beforeTrasy = mockSkarbiecTrasy;
  const econTrasy = advanceCityEconomy(
    cities, map, data, 'normal', econUnits, new Map(), builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined, 'wysoki',
    tradeBuildingBonusByCityFixture, tradeIncomeByCityFixture,
  );
  const realPlayerEconTrasy = sumEconomyForPlayerCities(econTrasy, cities);
  const realBalanceTrasy = econTrasy.upkeepByOwner.get(0);
  mockSkarbiecTrasy += realPlayerEconTrasy.pieniadz;
  if (realBalanceTrasy && realBalanceTrasy.utrzymanieRazem > 0) {
    mockSkarbiecTrasy -= realBalanceTrasy.utrzymanieRazem;
  }
  const realDeltaTrasy = mockSkarbiecTrasy - beforeTrasy;

  assert(
    'kontrolne: real-tick z trasa tez ksieguje niezerowy dochod z tras (pieniadzZTras w realnym ticku)',
    (realPlayerEconTrasy.pieniadzZTras ?? 0) > 0,
    `pieniadzZTras=${realPlayerEconTrasy.pieniadzZTras}`,
  );
  assert(
    'KRYTERIUM 3: podglad PRZED koncem tury (Z trasa) == realna zmiana skarbca PO koncu tury (Z ta sama trasa)',
    shownRateFixed === realDeltaTrasy,
    `shownRateFixed=${shownRateFixed} realDeltaTrasy=${realDeltaTrasy}`,
  );
}

// ---------------------------------------------------------------------------
console.log('');
console.log(`hud-skarbiec-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
