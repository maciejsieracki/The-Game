'use strict';
/**
 * trade-routes-income-test.cjs -- standalone Node test for Handel E3 (dochod z tras).
 * Run from gra/:  node tools/trade-routes-income-test.cjs
 *
 * Self-contained: bundles trade-routes.ts / economy.ts / turn-economy.ts / cities.ts
 * with esbuild (no runtime imports). Covers:
 *   A. Trasa gracz<->obcy w pokoju + Umowa Handlowa -> tworzy sie (refreshTradeRoutes).
 *   A2. C-HANDEL-UMOWA=B (2026-07-23): brak Umowy Handlowej -> zero tras mimo pokoju;
 *      zawarcie traktatu -> trasa powstaje; zerwanie traktatu -> trasa znika (bez wojny).
 *   B. Wojna -> trasa znika (nie zostaje z flaga "zawieszona" -- po prostu znika z listy).
 *   C. Wlasne<->wlasne NIGDY nie tworzy trasy (filtr zewnetrzny).
 *   D. T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, 2026-08-24): limit budynkow handlowych juz
 *      NIE ogranicza ISTNIENIE trasy -- ogranicza wylacznie pole budynekOdblokowany
 *      (priorytet: istniejace trasy po id, potem nowe wg rosnacego dystansu).
 *   E. Stabilnosc: istniejaca trasa (istnienie ORAZ budynekOdblokowany) jest
 *      priorytetowo zachowana mimo pojawienia sie blizszego kandydata.
 *   J. T3: trasa istnieje i daje dochod BEZ zadnego budynku handlowego w miescie
 *      (budynekOdblokowany=false); trasa morska nadal wymaga fizycznego Portu
 *      niezaleznie od budynekOdblokowany.
 *   F. Dochod dystansowy (wzor Q7=A + podloga) + kredytowanie OBU miast (Q8=B).
 *   G. T4 (runda 2, R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4): suma per-trasowych bonusow
 *      0.05*wlasny dochod dystansowy, WYLACZNIE dla tras z budynekOdblokowany=true
 *      (computeTradeRouteBuildingBonusByCity), addytywna do handelBrutto (economy.ts
 *      cityYieldPerTurn) -- ZASTEPUJE stary mnoznik (1+0.05*n) ze WSZYSTKICH tras.
 *   H. Integracja advanceCityEconomy: pieniadzZTras wchodzi do skarbca CZYSTO (bez Wealth),
 *      premiaHandluTrasHandlowych (tylko trasy z budynkiem) podnosi Handel, obie strony
 *      (wlasciciele) zarabiaja.
 *   K. T6 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6): tradeRouteBuildingBonusForRoute -- per-trasowa
 *      wersja premii 5%, ktora konsumuje panel imperium; (a) kwota dla trasy z budynkiem,
 *      (b) 0 dla trasy bez budynku i dla trasy nieaktywnej, (c) SPOJNOSC: agregat T4
 *      zasilajacy economy.ts jest co do bitu suma tych per-trasowych skladnikow.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-routes-income-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.trade-routes-income-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-routes-income-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, tradeRouteId, tradeRouteLimitForCity, TRADE_BUILDING_IDS,
  DEFAULT_TRADE_ROUTE_PARAMS, loadTradeRouteParams,
  tradeRouteDistanceIncome, tradeRouteTotalDistanceIncome, DEFAULT_TRADE_ROUTE_INCOME_PARAMS, loadTradeRouteIncomeParams,
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  tradeRouteBuildingBonusForRoute, TRADE_ROUTE_BUILDING_BONUS_RATE,
} from '../src/game/trade-routes';
export { cityYieldPerTurn } from '../src/game/economy';
export { advanceCityEconomy } from '../src/game/turn-economy';
export { ensureCitySaveDefaults } from '../src/game/cities';
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
  console.error('[trade-routes-income-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const TR = require(BUNDLE_FILE);
const econParamsRaw  = require('../data/econ-params.json');
const civs           = require('../data/civs.json');
const societyParams  = require('../data/society-params.json');
const buildings      = require('../data/buildings.json');
const units          = require('../data/units.json');
const tech           = require('../data/tech.json');
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map: jeden dlugi placki rzad r=0, cala 'rownina' (ladowa, przechodnia).
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 400; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: 401, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();

function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }

const NO_WAR = () => false;
// C-HANDEL-UMOWA=B (2026-07-23): refreshTradeRoutes wymaga teraz jawnego predykatu
// Umowy Handlowej (6. argument, miedzy isAtWar a params). HAS_TREATY = wszystkie pary
// maja zawarta umowe -- uzywany we WSZYSTKICH scenariuszach A/B/C/D/E ponizej, ktore
// testuja geometrie/limit/stabilnosc niezaleznie od traktatu (traktat obecny z gory,
// tak jak przed C-HANDEL-UMOWA=B "pokoj" byl domyslnie wystarczajacy). Gating samego
// traktatu ma dedykowana sekcje A2 nizej.
const HAS_TREATY = () => true;
const NO_TREATY  = () => false;

// ---------------------------------------------------------------------------
// A. Trasa gracz<->obcy w pokoju + Umowa Handlowa -> tworzy sie
// ---------------------------------------------------------------------------
console.log('\n-- A. refreshTradeRoutes: gracz<->obcy w pokoju + Umowa Handlowa tworzy trase --');
const p1 = city('p1', 0, 0);
const f1 = city('f1', 1, 5);
const builtA = new Map([['p1', ['targowisko']], ['f1', ['targowisko']]]);

const routesA = TR.refreshTradeRoutes([p1, f1], [], map, builtA, NO_WAR, HAS_TREATY);
eq(routesA.length, 1, 'A: dokladnie jedna trasa p1<->f1');
const routeA = routesA[0];
eq(routeA.id, TR.tradeRouteId('p1', 'f1', 'lad'), 'A: id trasy deterministyczne');
eq(routeA.fromCityId, 'p1', 'A: fromCityId = miasto gracza');
eq(routeA.toCityId, 'f1', 'A: toCityId = miasto obce');
eq(routeA.ownerId, 0, 'A: ownerId = gracz');
eq(routeA.toOwnerId, 1, 'A: toOwnerId = obca cyw');
eq(routeA.medium, 'lad', 'A: medium lad (brak portow, ale ladem polaczone)');
eq(routeA.dystans, 5, 'A: dystans = 5');
eq(routeA.status, 'polaczony', 'A: status polaczony');

// ---------------------------------------------------------------------------
// A2. C-HANDEL-UMOWA=B: brak Umowy Handlowej -> zero tras mimo pokoju + geometrii OK;
//     zawarcie traktatu -> trasa powstaje; zerwanie traktatu (bez wojny) -> trasa znika.
// ---------------------------------------------------------------------------
console.log('\n-- A2. refreshTradeRoutes: Umowa Handlowa wymagana (C-HANDEL-UMOWA=B) --');
const routesA2_noTreaty = TR.refreshTradeRoutes([p1, f1], [], map, builtA, NO_WAR, NO_TREATY);
eq(routesA2_noTreaty.length, 0, 'A2: pokoj + geometria OK, ale BRAK Umowy Handlowej -> zero tras');

const routesA2_signed = TR.refreshTradeRoutes([p1, f1], routesA2_noTreaty, map, builtA, NO_WAR, HAS_TREATY);
eq(routesA2_signed.length, 1, 'A2: zawarcie Umowy Handlowej -> trasa powstaje');
eq(routesA2_signed[0].id, TR.tradeRouteId('p1', 'f1', 'lad'), 'A2: powstala trasa to p1<->f1');

const routesA2_broken = TR.refreshTradeRoutes([p1, f1], routesA2_signed, map, builtA, NO_WAR, NO_TREATY);
eq(routesA2_broken.length, 0, 'A2: zerwanie Umowy Handlowej (nadal pokoj!) -> trasa znika');

// ---------------------------------------------------------------------------
// B. Wojna -> trasa znika
// ---------------------------------------------------------------------------
console.log('\n-- B. refreshTradeRoutes: wojna zrywa trase (znika z listy) --');
const AT_WAR_0_1 = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 0);
const routesB = TR.refreshTradeRoutes([p1, f1], routesA, map, builtA, AT_WAR_0_1, HAS_TREATY);
eq(routesB.length, 0, 'B: wojna -> lista tras pusta (trasa znika, nie zostaje "zawieszona")');

// Powrot do pokoju odtwarza trase (nie jest trwale skasowana z gry -- po prostu
// nie byla persystowana w stanie wojny). Traktat nadal aktywny (wojna go nie kasuje
// tutaj -- to symulacja czystej funkcji; w main.ts wojna realnie zrywa traktat, ale
// to osobna, redundantna bramka -- patrz breakTreatiesOnWar).
const routesBRestored = TR.refreshTradeRoutes([p1, f1], routesB, map, builtA, NO_WAR, HAS_TREATY);
eq(routesBRestored.length, 1, 'B: powrot do pokoju -> trasa odtworzona');

// ---------------------------------------------------------------------------
// C. R-HANDEL-LIMIT-TRAS-PELNY-Q1 (2026-09-04, GOAL 5) -- ODWROCENIE: wlasne<->
//    wlasne TERAZ TWORZY trase (handel wewnatrz-cywilizacyjny), gdy fizycznie
//    polaczone -- bez traktatu (nie mozna go zawrzec z samym soba) i bez wymogu
//    granicy (irrelewantne dla tego samego wlasciciela). Cytat wyzwalajacy
//    wlasciciela (2026-09-04): "w sytuacji, gdy dana cywilizacja gracza, inna
//    cywilizacja lub panstwo-miasto nie maja zadnej umowy wymiany, moga
//    handlowac pomiedzy swoimi miastami." Dawny test tej sekcji (C: "wlasne<->
//    wlasne NIGDY nie tworzy trasy") zakladal STARA, teraz JAWNIE odwrocona
//    semantyke -- zaktualizowany ponizej zgodnie z KRYTERIUM KONCA #7 dispatchu.
// ---------------------------------------------------------------------------
console.log('\n-- C. refreshTradeRoutes: wlasne<->wlasne TERAZ TWORZY trase (GOAL 5, odwrocenie) --');
const p1c = city('p1c', 0, 30);
const p2c = city('p2c', 0, 35); // ten sam wlasciciel (gracz) -- brak miasta obcego w tym wywolaniu
const builtC = new Map([['p1c', ['targowisko']], ['p2c', ['targowisko']]]);
const routesC = TR.refreshTradeRoutes([p1c, p2c], [], map, builtC, NO_WAR, HAS_TREATY);
eq(routesC.length, 1, 'C: GOAL 5 -- dwa miasta TEGO SAMEGO wlasciciela, fizycznie polaczone -> dokladnie 1 trasa wewnetrzna');
const routeC = routesC[0];
eq(routeC.fromCityId, 'p1c', 'C: fromCityId = p1c (kierunek kanoniczny -- id mniejsze pierwsze)');
eq(routeC.toCityId, 'p2c', 'C: toCityId = p2c');
eq(routeC.ownerId, 0, 'C: ownerId = 0 (wlasny wlasciciel)');
eq(routeC.toOwnerId, 0, 'C: toOwnerId = 0 -- IDENTYCZNY jak ownerId (trasa WEWNETRZNA, nowosc GOAL 5)');
eq(routeC.medium, 'lad', 'C: medium lad (plaski, przechodni teren)');
eq(routeC.dystans, 5, 'C: dystans = 5');
eq(routeC.status, 'polaczony', 'C: status polaczony');
eq(routeC.budynekOdblokowany, true, 'C: oba miasta maja Targowisko (1 slot kazde) -> budynekOdblokowany=true, jedyna trasa wewnetrzna');

// ---------------------------------------------------------------------------
// D. T3 (buildings-only, bez zmian): limit budynkow handlowych NIE ogranicza
//    ISTNIENIE trasy -- wylacznie pole budynekOdblokowany. R-HANDEL-LIMIT-TRAS-
//    PELNY-Q1 (2026-09-04, GOAL 2-3) ZMIENIL jednak kolejnosc priorytetu tego
//    pola: NIE JUZ "najpierw istniejace po id, potem nowe wg rosnacego dystansu"
//    -- od tego tematu kolejnosc to DOCHOD MALEJACO (patrz docstring
//    refreshTradeRoutes) -- fixture'y ponizej maja WIEC celowo DUZA roznice
//    dystansu miedzy kandydatami (nie tylko 1 heks jak dawniej), zeby zaokraglenie
//    /5 (R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1) nie dawalo remisu i test jednoznacznie
//    demonstrowal NOWA regule: dalszy/bardziej dochodowy kandydat wygrywa slot,
//    NIE blizszy jak przed tym tematem (dokladne odwrocenie -- patrz takze
//    kryterium konca #5 dispatchu i sekcja I nizej, ktora testuje analogiczna
//    zmiane dla SAMEGO ISTNIENIA w oddzielnym pliku trade-routes-limit-test.cjs).
//    Fixture'y uzywaja tez SCOPED `isAtWar`, ktory blokuje WYLACZNIE krawedz
//    MIEDZY dwoma konkurujacymi kandydatami (nie dotyczaca centralnego miasta
//    testu) -- inaczej R-HANDEL-LIMIT-TRAS-PELNY-Q1 GOAL 4 (uogolnienie na
//    dowolne pary wlascicieli) wygenerowalby DODATKOWA, nieplanowana trzecia
//    trase miedzy samymi kandydatami (na tej plaskiej, w calosci przechodniej
//    mapie testowej sa oni zawsze fizycznie polaczeni), co zaszumialoby test
//    ponad jego pierwotny, waski cel (limit budynkowy JEDNEGO miasta).
// ---------------------------------------------------------------------------
console.log('\n-- D. refreshTradeRoutes: T3 -- budynki gatuja budynekOdblokowany, NIE istnienie (GOAL 3: priorytet wg dochodu) --');

// D1: pD ma tylko 1 slot budynkowy (Targowisko), dwaj obcy kandydaci (rozne
// wlascicielstwa 1/2) -- OBIE trasy ISTNIEJA (existence baseline=2 kazde: 1+1
// budynek), ale TYLKO bardziej dochodowy (fD2, dystans 8, dalszy) dostaje
// budynekOdblokowany=true -- odwrotnie niz przed tym tematem (dawniej wygrywal
// blizszy fD1). isAtWar blokuje WYLACZNIE fD1<->fD2 (GOAL 4 wygenerowalby tu
// dodatkowa trase miedzy fD1/fD2, nieplanowana dla tego testu).
const WAR_BETWEEN_CANDIDATES_1_2 = (a, b) => (a === 1 && b === 2) || (a === 2 && b === 1);
const pD  = city('pD', 0, 60);
const fD1 = city('fD1', 1, 63); // dystans 3 -- blizej, NIZSZY dochod (patrz ponizej)
const fD2 = city('fD2', 2, 68); // dystans 8 -- dalej, WYZSZY dochod
const builtD1 = new Map([
  ['pD',  ['targowisko']],          // 1 slot budynkowy
  ['fD1', ['targowisko']],
  ['fD2', ['targowisko']],
]);
const routesD1 = TR.refreshTradeRoutes([pD, fD1, fD2], [], map, builtD1, WAR_BETWEEN_CANDIDATES_1_2, HAS_TREATY);
eq(routesD1.length, 2, 'D1: T3 -- limit budynkowy=1 po stronie gracza, ALE obie trasy ISTNIEJA (existence baseline=2 kazde)');
const routeD1_fD1 = routesD1.find(r => r.toCityId === 'fD1');
const routeD1_fD2 = routesD1.find(r => r.toCityId === 'fD2');
assert(
  TR.tradeRouteTotalDistanceIncome(8, 'lad', TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS)
    > TR.tradeRouteTotalDistanceIncome(3, 'lad', TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS),
  'D1: (setup) kontrola -- dystans 8 daje WYZSZY dochod niz dystans 3 (fixture rzeczywiscie testuje priorytet dochodowy, nie przypadkowy remis)',
);
eq(routeD1_fD2.budynekOdblokowany, true, 'D1 (GOAL 3, ODWROCENIE): dalszy, BARDZIEJ DOCHODOWY kandydat (fD2, dystans 8) dostaje wolny slot -> budynekOdblokowany=true');
eq(routeD1_fD1.budynekOdblokowany, false, 'D1 (GOAL 3, ODWROCENIE): blizszy, MNIEJ DOCHODOWY kandydat (fD1, dystans 3) -- brak wolnego slotu -> budynekOdblokowany=false');
assert(routeD1_fD1.dystans === 3 && routeD1_fD1.status === 'polaczony', 'D1: fD1 ma pelny dochod dystansowy mimo dzielonego slotu');
assert(routeD1_fD2.dystans === 8 && routeD1_fD2.status === 'polaczony', 'D1: fD2 (ze slotem) ma dochod dystansowy (T3 -- dochod dostepny od poczatku)');

// D1-bis: podniesienie limitu gracza do 2 (Targowisko + Port wielki) -> obie trasy
// dostaja budynekOdblokowany=true (istnienie bez zmian -- juz bylo 2).
const builtD1b = new Map([
  ['pD',  ['targowisko', 'port_wielki']], // 2 sloty
  ['fD1', ['targowisko']],
  ['fD2', ['targowisko']],
]);
const routesD1b = TR.refreshTradeRoutes([pD, fD1, fD2], [], map, builtD1b, WAR_BETWEEN_CANDIDATES_1_2, HAS_TREATY);
eq(routesD1b.length, 2, 'D1-bis: 2 sloty po stronie gracza -> nadal obie trasy istnieja');
assert(routesD1b.every(r => r.budynekOdblokowany === true), 'D1-bis: 2 sloty -> OBIE trasy dostaja budynekOdblokowany=true');

// D2: limit po stronie OBCEGO miasta (fD) -- fD ma tylko 1 slot budynkowy, DWA
// INNE miasta (wlasciciele 0 i 2 -- rozne, zeby uniknac przypadkowej trasy
// WEWNETRZNEJ miedzy nimi, GOAL 5) konkuruja o jego jedyny slot. isAtWar blokuje
// WYLACZNIE krawedz pF1<->pF2 (analogicznie do D1 -- GOAL 4 wygenerowalby
// nieplanowana trzecia trase miedzy kandydatami).
const WAR_BETWEEN_CANDIDATES_0_2 = (a, b) => (a === 0 && b === 2) || (a === 2 && b === 0);
const fD  = city('fD', 1, 90);
const pF1 = city('pF1', 0, 91); // dystans 1 -- blizej, NIZSZY dochod
const pF2 = city('pF2', 2, 80); // dystans 10 -- dalej, WYZSZY dochod
const builtD2 = new Map([
  ['fD',  ['targowisko']],  // 1 slot (obce miasto)
  ['pF1', ['targowisko']],
  ['pF2', ['targowisko']],
]);
const routesD2 = TR.refreshTradeRoutes([fD, pF1, pF2], [], map, builtD2, WAR_BETWEEN_CANDIDATES_0_2, HAS_TREATY);
eq(routesD2.length, 2, 'D2: T3 -- limit budynkowy=1 po stronie obcego (fD), ALE obie trasy ISTNIEJA');
const routeD2_pF1 = routesD2.find(r => r.fromCityId === 'pF1' || r.toCityId === 'pF1');
const routeD2_pF2 = routesD2.find(r => r.fromCityId === 'pF2' || r.toCityId === 'pF2');
eq(routeD2_pF2.budynekOdblokowany, true, 'D2 (GOAL 3, ODWROCENIE): dalszy, BARDZIEJ DOCHODOWY kandydat (pF2, dystans 10) dostaje wolny slot fD -> budynekOdblokowany=true');
eq(routeD2_pF1.budynekOdblokowany, false, 'D2 (GOAL 3, ODWROCENIE): blizszy, MNIEJ DOCHODOWY kandydat (pF1, dystans 1) -- brak wolnego slotu -> budynekOdblokowany=false');

// ---------------------------------------------------------------------------
// E. Stabilnosc: DWA POZIOMY (T3) -- (1) istnienie trasy z existingRoutes zawsze
//    zachowane gdy nadal spelnia warunki (nie jest juz ograniczone slotami);
//    (2) budynekOdblokowany: istniejaca trasa ma PIERWSZENSTWO do slotu przed
//    nowym, blizszym kandydatem.
// ---------------------------------------------------------------------------
console.log('\n-- E. refreshTradeRoutes: stabilnosc istnienia ORAZ budynekOdblokowany (T3) --');
// fENew ma INNEGO wlasciciela (2) niz fEOld (1) -- gdyby oba byly tym samym
// wlascicielem, R-HANDEL-LIMIT-TRAS-PELNY-Q1 GOAL 5 wygenerowalby DODATKOWA,
// nieplanowana trase WEWNETRZNA miedzy nimi (fizycznie polaczeni na tej plaskiej
// mapie) -- WAR_1_2 blokuje analogicznie do sekcji D wyzej.
const WAR_1_2_FOR_E = (a, b) => (a === 1 && b === 2) || (a === 2 && b === 1);
const pE = city('pE', 0, 120);
const fEOld = city('fEOld', 1, 125); // dystans 5 -- istniejaca trasa, WYZSZY dochod
const fENew = city('fENew', 2, 122); // dystans 2 -- blizszy NOWY kandydat, NIZSZY dochod
const builtE = new Map([
  ['pE',    ['targowisko']], // 1 slot
  ['fEOld', ['targowisko']],
  ['fENew', ['targowisko']],
]);
const existingE = TR.refreshTradeRoutes([pE, fEOld], [], map, builtE, WAR_1_2_FOR_E, HAS_TREATY);
eq(existingE.length, 1, 'E: (setup) trasa poczatkowa pE<->fEOld istnieje');
eq(existingE[0].budynekOdblokowany, true, 'E: (setup) jedyna trasa -> od razu ma budynekOdblokowany=true (1 slot wolny)');

const routesE = TR.refreshTradeRoutes([pE, fEOld, fENew], existingE, map, builtE, WAR_1_2_FOR_E, HAS_TREATY);
eq(routesE.length, 2, 'E: T3 -- OBIE trasy (stara + nowa, blizsza) TERAZ ISTNIEJA (1 slot juz nie ogranicza istnienia)');
const routeE_old = routesE.find(r => r.toCityId === 'fEOld');
const routeE_new = routesE.find(r => r.toCityId === 'fENew');
assert(
  TR.tradeRouteTotalDistanceIncome(5, 'lad', TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS)
    > TR.tradeRouteTotalDistanceIncome(2, 'lad', TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS),
  'E: (setup) kontrola -- fEOld (dystans 5) ma WYZSZY dochod niz fENew (dystans 2), wiec ponizsze PRIORYTETOWO wynika z GOAL 3 (dochod malejaco), nie tylko ze stabilnosci',
);
eq(routeE_old.budynekOdblokowany, true, 'E (GOAL 3): istniejaca trasa fEOld zachowuje budynekOdblokowany=true -- WYZSZY dochod NIZ fENew (dystans 5 > 2), stabilnosc jest tu redundantna z priorytetem dochodowym, nie jedynym powodem');
eq(routeE_new.budynekOdblokowany, false, 'E: nowy, blizszy, MNIEJ DOCHODOWY kandydat fENew NIE dostaje slotu -- zajety przez bardziej dochodowa istniejaca trase');

// ---------------------------------------------------------------------------
// J. T3: dochod dystansowy dostepny BEZ zadnego budynku handlowego; trasa morska
//    nadal wymaga fizycznego Portu (cityHasPort) do samego POLACZENIA, niezaleznie
//    od budynekOdblokowany.
// ---------------------------------------------------------------------------
console.log('\n-- J. refreshTradeRoutes: T3 -- dochod od razu bez budynku; Port nadal wymagany dla morza --');

// J1: LAD, ZERO budynkow handlowych w obu miastach -> trasa mimo to ISTNIEJE,
// ma dochod dystansowy, ale budynekOdblokowany=false.
const pJ = city('pJ', 0, 150);
const fJ = city('fJ', 1, 155);
const builtJEmpty = new Map(); // brak jakichkolwiek budynkow w obu miastach
const routesJ1 = TR.refreshTradeRoutes([pJ, fJ], [], map, builtJEmpty, NO_WAR, HAS_TREATY);
eq(routesJ1.length, 1, 'J1: trasa ISTNIEJE mimo braku jakiegokolwiek budynku handlowego w obu miastach');
eq(routesJ1[0].status, 'polaczony', 'J1: status polaczony');
eq(routesJ1[0].dystans, 5, 'J1: dystans dystansowy liczony normalnie');
eq(routesJ1[0].budynekOdblokowany, false, 'J1: budynekOdblokowany=false -- zero slotow po obu stronach');
assert(TR.tradeRouteDistanceIncome(routesJ1[0].dystans, 'lad', TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS) > 0,
  'J1: dochod dystansowy > 0 mimo budynekOdblokowany=false (T3 -- dostepny od poczatku)');

// J2: MORZE -- Targowisko (budynek handlowy) w obu miastach, ale BRAK fizycznego
// Portu -- polaczenie morskie NIE powstaje wcale (cityHasPort niezmieniony wymog),
// niezaleznie od tego ze budynek handlowy formalnie jest.
function buildIslandMap() {
  const hexes = {};
  for (let q = 0; q <= 30; q++) {
    const isWater = q >= 10 && q <= 20;
    hexes[`${q},200`] = { terenBazowy: isWater ? 'morze' : 'rownina' };
  }
  return { szerokoscQ: 31, wysokoscR: 201, hexes, seed: 1, riverPaths: [] };
}
const mapJ = buildIslandMap();
const pJ2 = city('pJ2', 0, 9); pJ2.r = 200;  // ladowy heks tuz przy wodzie (q=10..20)
const fJ2 = city('fJ2', 1, 21); fJ2.r = 200; // ladowy heks tuz przy wodzie z drugiej strony
const builtJ2NoPort = new Map([
  ['pJ2', ['targowisko']], // budynek handlowy JEST, ale...
  ['fJ2', ['targowisko']], // ...brak fizycznego Portu w obu miastach
]);
const routesJ2NoPort = TR.refreshTradeRoutes([pJ2, fJ2], [], mapJ, builtJ2NoPort, NO_WAR, HAS_TREATY);
eq(routesJ2NoPort.length, 0, 'J2: BRAK trasy -- brak lądu (wyspy) I brak fizycznego Portu, mimo Targowiska (budynku handlowego)');

// J3: te same miasta, teraz Z fizycznym Portem (zamiast Targowiska) -> polaczenie
// morskie powstaje; budynekOdblokowany=false, bo 'port' liczy sie tez jako budynek
// handlowy (TRADE_BUILDING_IDS zawiera 'port') -- WIEC w tym wypadku faktycznie
// budynekOdblokowany=true (Port jest jednoczesnie budynkiem fizycznym I handlowym).
const builtJ3WithPort = new Map([
  ['pJ2', ['port']],
  ['fJ2', ['port']],
]);
const routesJ3 = TR.refreshTradeRoutes([pJ2, fJ2], [], mapJ, builtJ3WithPort, NO_WAR, HAS_TREATY);
eq(routesJ3.length, 1, 'J3: Port w obu miastach -> polaczenie morskie powstaje');
eq(routesJ3[0].medium, 'morze', 'J3: medium=morze (wyspy, brak ladu)');
eq(routesJ3[0].budynekOdblokowany, true, 'J3: Port liczy sie TAKZE jako budynek handlowy (TRADE_BUILDING_IDS) -> budynekOdblokowany=true');

// J4: kontrola rozroznienia -- Port_wielki (fizyczny port) ale przy limicie
// slotow=0 po drugiej stronie -- druga strona ma TYLKO 'port' jeden budynek,
// wiec slot jest, ale pokazuje ze to WCIAZ dwa niezalezne pojecia (limit i port
// fizyczny), nie jeden mechanizm: usuniecie Portu (fizycznego) z jednej strony
// zrywa polaczenie CALKOWICIE, mimo ze budynekOdblokowany nigdy nie byl liczony
// (trasa nie istnieje -> nie ma budynekOdblokowany do sprawdzenia).
const builtJ4OnlyOnePort = new Map([
  ['pJ2', ['port']],       // fizyczny Port -- OK
  ['fJ2', ['targowisko']], // budynek handlowy, ale BRAK fizycznego Portu
]);
const routesJ4 = TR.refreshTradeRoutes([pJ2, fJ2], [], mapJ, builtJ4OnlyOnePort, NO_WAR, HAS_TREATY);
eq(routesJ4.length, 0, 'J4: fizyczny Port wymagany po OBU stronach dla morza -- jedna strona bez Portu -> brak trasy mimo budynku handlowego istniejacego formalnie u drugiej');

// ---------------------------------------------------------------------------
// F. Dochod dystansowy -- PRZEBUDOWA R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 (ECHO Q1 + p.3,
//    2026-08-21, T1): wzor ODWROCONY (rosnie z dystansem), stawki x5, podloga=5,
//    szczyt=40, osobna stawka wzrostu per medium (lad maxDist=12, morze maxDist=20),
//    tak by NAJDALSZA trasa ladowa i NAJDALSZA trasa morska dawaly IDENTYCZNY
//    szczytowy dochod (40) mimo roznych maxDist. + kredytowanie OBU miast (Q8=B,
//    bez zmian z poprzedniej przebudowy).
// ---------------------------------------------------------------------------
console.log('\n-- F. dochod dystansowy: wzor odwrocony x5, osobny per medium, obie strony zarabiaja --');
const incP = TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
eq(incP.dochodPodloga, 5, 'F: (setup) dochodPodloga=5 (stary floor=1 x5)');
eq(incP.dochodSzczyt, 40, 'F: (setup) dochodSzczyt=40 (stary bazowy=8 x5)');
eq(incP.ladMaxDist, 12, 'F: (setup) ladMaxDist=12 (bez zmian)');
eq(incP.morzeMaxDist, 20, 'F: (setup) morzeMaxDist=20 (bez zmian)');

// LAD: stawkaWzrostu = (40-5)/12 = 2.91666...
eq(TR.tradeRouteDistanceIncome(0, 'lad', incP), 5, 'F: LAD dystans=0 -> podloga=5');
eq(TR.tradeRouteDistanceIncome(6, 'lad', incP), Math.floor(5 + (40 - 5) / 12 * 6), 'F: LAD dystans=6 (polowa maxDist) -> floor(5+stawka*6)');
eq(TR.tradeRouteDistanceIncome(12, 'lad', incP), 40, 'F: LAD dystans=12 (=ladMaxDist) -> szczyt=40');
eq(TR.tradeRouteDistanceIncome(1000, 'lad', incP), 40, 'F: LAD dystans poza zakresem -> clamp do szczytu=40, nigdy wiecej');

// MORZE: stawkaWzrostu = (40-5)/20 = 1.75
eq(TR.tradeRouteDistanceIncome(0, 'morze', incP), 5, 'F: MORZE dystans=0 -> podloga=5 (ta sama co lad)');
eq(TR.tradeRouteDistanceIncome(10, 'morze', incP), Math.floor(5 + (40 - 5) / 20 * 10), 'F: MORZE dystans=10 (polowa maxDist) -> floor(5+stawka*10)');
eq(TR.tradeRouteDistanceIncome(20, 'morze', incP), 40, 'F: MORZE dystans=20 (=morzeMaxDist) -> szczyt=40 (IDENTYCZNY jak lad d=12, ECHO Q1)');
eq(TR.tradeRouteDistanceIncome(1000, 'morze', incP), 40, 'F: MORZE dystans poza zakresem -> clamp do szczytu=40, nigdy wiecej');

// T4 (runda 2): budynekOdblokowany dodane do fixture'ow -- routeF1 MA budynek
// (A<->B), routeF2 NIE MA budynku (A<->C), routeF3suspended MA budynek ale jest
// nieaktywna (status brak_polaczenia). computeTradeRouteIncomeByCity (test F
// nizej) ignoruje to pole, wiec dodanie go nie zmienia wynikow sekcji F.
const routeF1 = { id: 'r1', fromCityId: 'A', toCityId: 'B', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 5, status: 'polaczony', budynekOdblokowany: true };
const routeF2 = { id: 'r2', fromCityId: 'A', toCityId: 'C', ownerId: 0, toOwnerId: 2, medium: 'morze', dystans: 10, status: 'polaczony', budynekOdblokowany: false };
const routeF3suspended = { id: 'r3', fromCityId: 'A', toCityId: 'D', ownerId: 0, toOwnerId: 3, medium: 'lad', dystans: 1, status: 'brak_polaczenia', budynekOdblokowany: true };
const incomeByCity = TR.computeTradeRouteIncomeByCity([routeF1, routeF2, routeF3suspended], incP);
const inc5  = TR.tradeRouteDistanceIncome(5, 'lad', incP);
const inc10 = TR.tradeRouteDistanceIncome(10, 'morze', incP);
// R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 T2 (ECHO Q2): computeTradeRouteIncomeByCity liczy teraz
// dochod FINALNY przez tradeRouteTotalDistanceIncome -- trasa morska dostaje bonus x2
// wobec czystej krzywej dystansowej (tradeRouteDistanceIncome, NIEZMIENIONA), lad bez zmian.
// R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1: tradeRouteTotalDistanceIncome dzieli teraz
// dawny wynik finalny (juz PO x2 dla morza) przez 5, round, min 1 -- inc5Total/inc10Total
// licza sie WPROST przez funkcje (nie recznym /5), zeby test sledzil regule zamiast
// duplikowac ja jako osobna stala.
const inc5Total  = TR.tradeRouteTotalDistanceIncome(5, 'lad', incP);
const inc10Total = TR.tradeRouteTotalDistanceIncome(10, 'morze', incP);
eq(incomeByCity.get('A'), inc5Total + inc10Total, 'F: miasto A uczestniczy w 2 trasach (lad+morze x2, po /5) -> suma obu dochodow finalnych');
eq(incomeByCity.get('B'), inc5Total, 'F: miasto B (druga strona trasy 1, lad) dostaje PELNA kwote finalna (po /5)');
eq(incomeByCity.get('C'), inc10Total, 'F: miasto C (druga strona trasy 2, morze) dostaje PELNA kwote FINALNA (x2 morza, po /5)');
eq(incomeByCity.has('D'), false, 'F: trasa ze statusem brak_polaczenia NIE liczy sie do dochodu');

// ---------------------------------------------------------------------------
// F2. tradeRouteTotalDistanceIncome -- nowa funkcja opakowujaca (T2, ECHO Q2):
//     LAD bez zmian (== tradeRouteDistanceIncome), MORZE x2 (SUMUJE SIE z
//     osobnym, niezmienionym PORT_SEA_TRADE_BONUS_PIENIADZ -- nietestowanym tu,
//     patrz trade-routes-test.cjs sekcja l4-l6).
// ---------------------------------------------------------------------------
console.log('\n-- F2. tradeRouteTotalDistanceIncome: lad bez zmian, morze x2, oba /5 (min 1) --');
// R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1: regula = Math.max(1, Math.round(dawny_wynik/5)),
// dawny_wynik = tradeRouteDistanceIncome(...) dla ladu, *2 dla morza (JUZ finalny, przed /5).
for (const d of [0, 6, 12, 1000]) {
  eq(
    TR.tradeRouteTotalDistanceIncome(d, 'lad', incP),
    Math.max(1, Math.round(TR.tradeRouteDistanceIncome(d, 'lad', incP) / 5)),
    `F2: LAD dystans=${d} -> tradeRouteTotalDistanceIncome === max(1, round(tradeRouteDistanceIncome/5))`,
  );
}
for (const d of [0, 10, 20, 1000]) {
  eq(
    TR.tradeRouteTotalDistanceIncome(d, 'morze', incP),
    Math.max(1, Math.round((TR.tradeRouteDistanceIncome(d, 'morze', incP) * 2) / 5)),
    `F2: MORZE dystans=${d} -> tradeRouteTotalDistanceIncome === max(1, round(tradeRouteDistanceIncome*2/5))`,
  );
}
// PRZED/PO (dawny_wynik -> dawny_wynik/5 -> round -> max(.,1) = nowa):
// MORZE dystans=0:   10 -> 2.0   -> 2   -> max(2,1)   = 2
eq(TR.tradeRouteTotalDistanceIncome(0, 'morze', incP), 2, 'F2: MORZE dystans=0 -> dawny=podloga=5 x2=10 -> 10/5=2 -> round=2 -> max(2,1)=2');
// MORZE dystans=20:  80 -> 16.0  -> 16  -> max(16,1)  = 16
eq(TR.tradeRouteTotalDistanceIncome(20, 'morze', incP), 16, 'F2: MORZE dystans=20 (=morzeMaxDist) -> dawny=szczyt=40 x2=80 -> 80/5=16 -> round=16 -> max(16,1)=16');
// LAD dystans=12:    40 -> 8.0   -> 8   -> max(8,1)   = 8
eq(TR.tradeRouteTotalDistanceIncome(12, 'lad', incP), 8, 'F2: LAD dystans=12 (=ladMaxDist) -> dawny=szczyt=40, BEZ mnoznika morza -> 40/5=8 -> round=8 -> max(8,1)=8');

// T4 (runda 2): computeTradeRouteBuildingBonusByCity zastepuje stary
// computeTradeRouteCountByCity -- suma 0.05*wlasny dochod dystansowy WYLACZNIE
// dla tras z budynekOdblokowany=true (routeF1: A<->B ma budynek; routeF2: A<->C
// NIE ma budynku; routeF3suspended: budynek jest, ale trasa nieaktywna).
const routeF4mixed = { id: 'r4', fromCityId: 'A', toCityId: 'E', ownerId: 0, toOwnerId: 4, medium: 'lad', dystans: 8, status: 'polaczony', budynekOdblokowany: true };
const bonusByCity = TR.computeTradeRouteBuildingBonusByCity([routeF1, routeF2, routeF3suspended, routeF4mixed], incP);
const inc8Lad = TR.tradeRouteTotalDistanceIncome(8, 'lad', incP);
eq(bonusByCity.get('B'), 0.05 * inc5Total, 'T4(b): miasto B (trasa Z budynkiem) dostaje dokladnie 0.05*wlasny dochod dystansowy FINALNY (po /5) trasy');
eq(bonusByCity.has('C'), false, 'T4(a): miasto C -- jedyna jego trasa (routeF2) jest BEZ budynku -> ZERO bonusu');
eq(bonusByCity.has('D'), false, 'T4: trasa nieaktywna (status brak_polaczenia) nie liczy sie mimo budynekOdblokowany=true');
eq(bonusByCity.get('E'), 0.05 * inc8Lad, 'T4(b): miasto E (routeF4mixed, budynek) dostaje 0.05*wlasny dochod dystansowy FINALNY (po /5) tej trasy');
eq(bonusByCity.get('A'), 0.05 * inc5Total + 0.05 * inc8Lad,
  'T4(c): miasto A -- MIESZANY przypadek: sumuje TYLKO trasy z budynkiem (r1+r4), routeF2 (bez budynku) i routeF3 (nieaktywna) pomijane -- brak podwojnego liczenia (d)');

// ---------------------------------------------------------------------------
// G. T4 (runda 2): premia addytywna do Handlu -- WYLACZNIE dla tras Z BUDYNKIEM,
//    suma 0.05*wlasny dochod dystansowy per trasa (economy.ts cityYieldPerTurn)
// ---------------------------------------------------------------------------
console.log('\n-- G. cityYieldPerTurn: premia addytywna Handlu z tras Z BUDYNKIEM, osobny czynnik --');
function makeEconCity() {
  return {
    id: 'gc1', ludnosc: 3, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  };
}
function makeCtx(premiaTras) {
  return {
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: false, mennicaMnoznik: 1, walutaOdkryta: false,
    premiaHandluTrasHandlowych: premiaTras,
  };
}
// 40 pol (nie realistyczne dla jednego miasta, ale cityYieldPerTurn przyjmuje
// dowolna tablice WorkedTile -- tu chcemy baseHandel na tyle duzy, zeby premia
// byla widoczna osobno mimo floor() koncowego (Step 5, korupcja=0 tutaj wiec
// bez wplywu). 40 pol daje baseHandel=40.
const gTiles = Array(40).fill({ terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false });
const pParamsForG = { budynekTargowiskoBonusHandlu: 0.5, budynekBibliotekaBonusNauki: 0.5,
  suwaakHandelNaukaDefault: 60, suwaakHandelPieniadz: 30, suwaakHandelLuksus: 10,
  suwaakPracaBudynki: 70, suwaakPracaTeren: 30, budynekMlynMnoznikPracy: 2, budynekMlynBonusPracy: 2,
  budynekCegielniBonusPracy: 0.25, budynekMennicaMnoznik: 1, mennicaMnoznikPoWalucie: 1.5,
  walutaMnoznik: 2, targowiskoPracaMnoznik: 2, progWzrostuWspolczynnik: 16,
  spichlerzZachowaniePoPrzroscie: 0.5, akweduktProgLudnosci: 5, akweduktMaxLudnosci: 15,
  zywnoscZuzytkaPopulacja: 1, zdrowieModyfikatorWspolczynnik: 0.05, korupcjaWspolczynnikDystansu: 2,
  korupcjaWspolczynnikMiast: 1, korupcjaCap: 0.5 };

const yld0 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(0));
const baseHandel = yld0.handelBrutto;
assert(baseHandel > 0, 'G: (setup) baza Handlu > 0 bez tras');

for (const premia of [2, 5, 8.4, 12]) {
  const yldN = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(premia));
  // yield.handelBrutto jest zawsze Math.floor()-owane (economy.ts) -- premia sama
  // moze byc niecalkowita (0.05*dochod dystansowy), stad floor tutaj rowniez.
  const expected = Math.floor(baseHandel + premia);
  eq(yldN.handelBrutto, expected, `G: premia=${premia} -> handelBrutto = floor(base+premia) = ${expected} (addytywne, NIE mnoznikowe)`);
  assert(yldN.pieniadz >= yld0.pieniadz, `G: premia=${premia} -> pieniadz nie maleje wzgledem braku premii`);
}

// Kumulatywnosc: rosnaca premia daje monotonicznie rosnacy handelBrutto.
const yld1 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(2));
const yld2 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(5));
const yld3 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(8));
assert(yld2.handelBrutto > yld1.handelBrutto && yld3.handelBrutto > yld2.handelBrutto,
  'G: handelBrutto rosnie monotonicznie z rosnaca premia tras (2 < 5 < 8)');

// ---------------------------------------------------------------------------
// H. Integracja advanceCityEconomy: pieniadzZTras CZYSTO do skarbca (bez Wealth),
//    obie strony (gracz + obca cyw) zarabiaja z tej samej trasy.
// ---------------------------------------------------------------------------
console.log('\n-- H. advanceCityEconomy: pieniadzZTras w skarbcu, obie strony, bez Wealth --');
function makeRuntimeCity(id, ownerId, q) {
  const c = { id, ownerId, q, r: 0, name: id, population: 4 };
  TR.ensureCitySaveDefaults(c);
  return c;
}

const pH = makeRuntimeCity('pH', 0, 200);
const fH = makeRuntimeCity('fH', 1, 205);
const builtH = new Map([['pH', ['targowisko']], ['fH', ['targowisko']]]);
const playerZbadaneH = new Set();

function runTickH(tradeIncomeByCity, tradeRouteBuildingBonusByCity) {
  const cities = [
    { ...pH, wealthState: { ...pH.wealthState } },
    { ...fH, wealthState: { ...fH.wealthState } },
  ];
  const econ = TR.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtH,
    1, playerZbadaneH, new Map(), new Map(), undefined, undefined, 'wysoki',
    tradeRouteBuildingBonusByCity, tradeIncomeByCity,
  );
  return {
    pH: econ.perCity.find(t => t.cityId === 'pH'),
    fH: econ.perCity.find(t => t.cityId === 'fH'),
  };
}

// H1: baseline bez tras.
const base = runTickH(new Map(), new Map());
eq(base.pH.pieniadzZTras, 0, 'H1: brak tras -> pieniadzZTras=0 (gracz)');
eq(base.fH.pieniadzZTras, 0, 'H1: brak tras -> pieniadzZTras=0 (obca cyw)');

// H2: trasa daje dochod OBU miastom, dodany CZYSTO (nie mnozony przez Wealth).
const TRADE_AMOUNT = 37; // wartosc dowolna, nieokragla wzgledem typowych mnoznikow Wealth
const withTrade = runTickH(
  new Map([['pH', TRADE_AMOUNT], ['fH', TRADE_AMOUNT]]),
  new Map(), // T4: premia z tras Z BUDYNKIEM=0 tutaj -- sprawdzana osobno w H3/H4
);
eq(withTrade.pH.pieniadzZTras, TRADE_AMOUNT, 'H2: pieniadzZTras gracza = kwota trasy');
eq(withTrade.fH.pieniadzZTras, TRADE_AMOUNT, 'H2: pieniadzZTras obcej cyw = kwota trasy (obie strony zarabiaja)');
eq(withTrade.pH.pieniadz - base.pH.pieniadz, TRADE_AMOUNT,
  'H2: pieniadz gracza wzrasta DOKLADNIE o kwote trasy (bez mnoznika Wealth, brak premii tras handlowych w tym wywolaniu)');

// H3: premiaHandluTrasHandlowych>0 w tym samym wywolaniu podnosi tez Handel-z-pol
// (osobny kanal) -- pieniadzBrutto (przed dochodem z tras) powinien byc >= baseline.
const withPremia = runTickH(
  new Map([['pH', TRADE_AMOUNT], ['fH', TRADE_AMOUNT]]),
  new Map([['pH', 5], ['fH', 5]]),
);
assert(withPremia.pH.pieniadzBrutto >= base.pH.pieniadzBrutto,
  'H3: premia Handlu z tras (z budynkiem) nie obniza pieniadzBrutto wzgledem braku tras');

// H4: sama premia (bez kwoty $ z tras) tez podnosi pieniadzBrutto lokalnie, niezaleznie od pieniadzZTras.
const onlyPremia = runTickH(new Map(), new Map([['pH', 5], ['fH', 5]]));
assert(onlyPremia.pH.pieniadzBrutto > base.pH.pieniadzBrutto,
  'H4: premiaHandluTrasHandlowych=5 (bez dochodu $ z tras) podnosi pieniadzBrutto gracza wzgledem 0 premii');
eq(onlyPremia.pH.pieniadzZTras, 0, 'H4: (kontrola) pieniadzZTras=0 gdy tradeIncomeByCity puste');

// ---------------------------------------------------------------------------
// I. Priorytet lądu BEZWARUNKOWY w detectBestConnection (T2, ECHO Q5 finalne
//    doprecyzowanie): gdy ląd I morze są OBA geometrycznie połączone (porty w
//    obu miastach), trasa MA BYĆ lądowa -- morze NIE jest brane pod uwagę jako
//    alternatywa, nawet gdyby (po Zmianie A / bonusie x2) dawało wyższy dochód.
//    Fixture: dwa miasta rozdzielone pasem wody (rzad r=100), ALE z dodatkowym
//    ladowym "objazdem" (rzad r=99, w calosci lad), wiec obie sciezki (lad
//    objazdem, morze wprost przez woda z portami) sa geometrycznie mozliwe.
// ---------------------------------------------------------------------------
console.log('\n-- I. refreshTradeRoutes: priorytet ladu bezwarunkowy (ECHO Q5) mimo mozliwego morza --');
function buildLandDetourMap() {
  const hexes = {};
  // rzad r=100: q=0..10, woda na q=4..6 (szlak morski wprost, z portami)
  for (let q = 0; q <= 10; q++) {
    const isWater = q >= 4 && q <= 6;
    hexes[`${q},100`] = { terenBazowy: isWater ? 'morze' : 'rownina' };
  }
  // rzad r=99: q=0..10, caly lad -- objazd ladowy dookola pasa wody
  for (let q = 0; q <= 10; q++) {
    hexes[`${q},99`] = { terenBazowy: 'rownina' };
  }
  return { szerokoscQ: 11, wysokoscR: 101, hexes, seed: 1, riverPaths: [] };
}
const mapI = buildLandDetourMap();
const pI = city('pI', 0, 3); pI.r = 100;
const fI = city('fI', 1, 7); fI.r = 100;
const builtI = new Map([
  ['pI', ['targowisko', 'port']],
  ['fI', ['targowisko', 'port']],
]);

const routesI = TR.refreshTradeRoutes([pI, fI], [], mapI, builtI, NO_WAR, HAS_TREATY);
eq(routesI.length, 1, 'I: (setup) dokladnie jedna trasa pI<->fI powstaje (oba media geometrycznie mozliwe)');
eq(routesI[0].medium, 'lad', 'I: mimo mozliwego szlaku morskiego (porty + woda), wybrany medium = lad (bezwarunkowy priorytet ladu, ECHO Q5)');
eq(routesI[0].dystans, 4, 'I: (kontrola) dystans = hexDistance(3,100 -> 7,100) = 4, taki sam dla obu mediow');

// ---------------------------------------------------------------------------
// K. T6 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1): tradeRouteBuildingBonusForRoute --
//    per-trasowa wersja premii 5%, ktora konsumuje panel imperium
//    (main.ts::buildEmpireTradeSnap -> EmpireTradeRouteRow.premiaBudynku).
//
//    Ta sekcja pilnuje TRZECH rzeczy naraz:
//      (a) trasa Z budynkiem zwraca DOKLADNIE kwote 5% wlasnego dochodu dystansowego,
//      (b) trasa BEZ budynku (i trasa nieaktywna) zwraca 0 -- to jest to "zero z
//          powodem", ktore UI tlumaczy graczowi slowem "brak budynku",
//      (c) SPOJNOSC: agregat T4 (computeTradeRouteBuildingBonusByCity), ktory realnie
//          zasila silnik (economy.ts::premiaHandluTrasHandlowych), jest co do bitu suma
//          tych per-trasowych skladnikow -- inaczej panel pokazywalby inna liczbe niz
//          ta, ktora gracz faktycznie dostaje. To jest sedno kryterium 2 dispatchu i
//          powod, dla ktorego T6 NIE zaklada wlasnej, czwartej kopii wzoru
//          (precedens P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1).
// ---------------------------------------------------------------------------
console.log('\n-- K. T6: tradeRouteBuildingBonusForRoute (per trasa) + spojnosc z agregatem T4 i economy.ts --');

eq(TR.TRADE_ROUTE_BUILDING_BONUS_RATE, 0.05, 'K0: stawka premii budynkowej to 5% (jedno miejsce prawdy)');

// (a) trasa Z budynkiem -- kwota, nie flaga.
eq(TR.tradeRouteBuildingBonusForRoute(routeF1, incP), 0.05 * TR.tradeRouteTotalDistanceIncome(5, 'lad', incP),
  'K(a): trasa Z budynkiem (routeF1, lad d=5) -> 0.05 * wlasny dochod dystansowy, co do liczby');
eq(TR.tradeRouteBuildingBonusForRoute(routeF4mixed, incP), 0.05 * TR.tradeRouteTotalDistanceIncome(8, 'lad', incP),
  'K(a): trasa Z budynkiem (routeF4mixed, lad d=8) -> 0.05 * wlasny dochod dystansowy');
const routeJsea = { id: 'rJs', fromCityId: 'A', toCityId: 'S', ownerId: 0, toOwnerId: 5, medium: 'morze', dystans: 20, status: 'polaczony', budynekOdblokowany: true };
// PRZED/PO: dystans=20 morze -> dawny=szczyt=40 x2=80 -> 80/5=16 -> round=16 -> max(16,1)=16 -> 0.05*16=0.8
eq(TR.tradeRouteBuildingBonusForRoute(routeJsea, incP), 0.05 * 16,
  'K(a): trasa MORSKA Z budynkiem liczy premie od dochodu PO bonusie morskim x2 (T2) i PO /5 (T-PODZIEL5), czyli 0.05*16 = 0.8');

// (b) trasa BEZ budynku oraz trasa nieaktywna -- twarde 0.
eq(TR.tradeRouteBuildingBonusForRoute(routeF2, incP), 0,
  'K(b): trasa BEZ budynku (routeF2, budynekOdblokowany=false) -> 0 (UI pokazuje "5% - brak budynku", nie kwote)');
eq(TR.tradeRouteBuildingBonusForRoute(routeF3suspended, incP), 0,
  'K(b): trasa nieaktywna (status brak_polaczenia) -> 0 mimo budynekOdblokowany=true');

// (c) SPOJNOSC: agregat T4 == suma per-trasowych skladnikow, dla obu rol miasta.
const routesJ = [routeF1, routeF2, routeF3suspended, routeF4mixed, routeJsea];
const aggJ = TR.computeTradeRouteBuildingBonusByCity(routesJ, incP);
const perRouteSumJ = new Map();
for (const r of routesJ) {
  const b = TR.tradeRouteBuildingBonusForRoute(r, incP);
  if (b === 0) continue; // te same dwa `continue` co w agregacie -- brak wpisow-zer
  perRouteSumJ.set(r.fromCityId, (perRouteSumJ.get(r.fromCityId) ?? 0) + b);
  perRouteSumJ.set(r.toCityId,   (perRouteSumJ.get(r.toCityId)   ?? 0) + b);
}
eq(perRouteSumJ.size, aggJ.size,
  'K(c): agregat T4 i suma per-trasowa maja te same miasta-klucze (zaden wpis-zero nie doszedl ani nie zniknal)');
for (const [cityId, v] of aggJ) {
  eq(perRouteSumJ.get(cityId), v,
    `K(c): miasto ${cityId} -- agregat T4 (zasila economy.ts) == suma skladnikow per trasa pokazywanych w panelu`);
}

// (c-bis) SPOJNOSC KONCOWA z economy.ts: liczba pokazywana w panelu jako suma skladnikow
// 5% miasta A jest DOKLADNIE ta, ktora cityYieldPerTurn dostaje jako premiaHandluTrasHandlowych.
const premiaPanelA = perRouteSumJ.get('A');
const yldJ0 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(0));
const yldJA = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(premiaPanelA));
eq(yldJA.handelBrutto, Math.floor(yldJ0.handelBrutto + premiaPanelA),
  'K(c-bis): premia zsumowana z pol premiaBudynku panelu wchodzi do handelBrutto co do jednostki (economy.ts Step 4, addytywnie)');
eq(premiaPanelA, aggJ.get('A'),
  'K(c-bis): ta sama liczba jest wejsciem silnika -- zero rozjazdu wyswietlanej wartosci od realnego wplywu (kryterium 2 dispatchu T6)');

console.log(`\ntrade-routes-income-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
