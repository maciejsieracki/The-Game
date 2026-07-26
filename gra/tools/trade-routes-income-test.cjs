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
 *   D. Limit tras na miasto = liczba budynkow handlowych -- po stronie gracza I obcego.
 *   E. Stabilnosc: istniejaca trasa jest utrzymana mimo pojawienia sie blizszego kandydata.
 *   F. Dochod dystansowy (wzor Q7=A + podloga) + kredytowanie OBU miast (Q8=B).
 *   G. +5% Handlu za kazda aktywna trase, kumulatywnie (economy.ts cityYieldPerTurn).
 *   H. Integracja advanceCityEconomy: pieniadzZTras wchodzi do skarbca CZYSTO (bez Wealth),
 *      liczbaAktywnychTrasHandlowych podnosi Handel, obie strony (wlasciciele) zarabiaja.
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
  tradeRouteDistanceIncome, DEFAULT_TRADE_ROUTE_INCOME_PARAMS, loadTradeRouteIncomeParams,
  computeTradeRouteIncomeByCity, computeTradeRouteCountByCity,
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
// C. Wlasne<->wlasne NIGDY nie tworzy trasy (filtr zewnetrzny)
// ---------------------------------------------------------------------------
console.log('\n-- C. refreshTradeRoutes: wlasne<->wlasne nie tworzy trasy --');
const p1c = city('p1c', 0, 30);
const p2c = city('p2c', 0, 35); // rowniez gracz -- brak miasta obcego w tym wywolaniu
const builtC = new Map([['p1c', ['targowisko']], ['p2c', ['targowisko']]]);
const routesC = TR.refreshTradeRoutes([p1c, p2c], [], map, builtC, NO_WAR, HAS_TREATY);
eq(routesC.length, 0, 'C: dwa miasta gracza, brak obcego -> zero tras (own<->own wykluczone)');

// ---------------------------------------------------------------------------
// D. Limit tras na miasto = liczba budynkow handlowych (obie strony)
// ---------------------------------------------------------------------------
console.log('\n-- D. refreshTradeRoutes: limit tras budynkami handlowymi --');

// D1: limit po stronie GRACZA -- pD ma tylko 1 slot (Targowisko), dwaj obcy kandydaci.
const pD  = city('pD', 0, 60);
const fD1 = city('fD1', 1, 63); // dystans 3 -- blizej
const fD2 = city('fD2', 2, 64); // dystans 4 -- dalej
const builtD1 = new Map([
  ['pD',  ['targowisko']],          // limit 1
  ['fD1', ['targowisko']],
  ['fD2', ['targowisko']],
]);
const routesD1 = TR.refreshTradeRoutes([pD, fD1, fD2], [], map, builtD1, NO_WAR, HAS_TREATY);
eq(routesD1.length, 1, 'D1: limit=1 po stronie gracza -> tylko jedna trasa');
eq(routesD1[0].toCityId, 'fD1', 'D1: wygrywa blizszy kandydat (dystans 3 < 4)');

// D1-bis: podniesienie limitu gracza do 2 (Targowisko + Port wielki) -> obie trasy.
const builtD1b = new Map([
  ['pD',  ['targowisko', 'port_wielki']], // limit 2
  ['fD1', ['targowisko']],
  ['fD2', ['targowisko']],
]);
const routesD1b = TR.refreshTradeRoutes([pD, fD1, fD2], [], map, builtD1b, NO_WAR, HAS_TREATY);
eq(routesD1b.length, 2, 'D1-bis: limit=2 po stronie gracza -> obie trasy powstaja');

// D2: limit po stronie OBCEGO miasta -- fD ma tylko 1 slot, dwaj gracze konkuruja.
const fD  = city('fD', 1, 90);
const pF1 = city('pF1', 0, 91); // dystans 1 -- blizej
const pF2 = city('pF2', 0, 88); // dystans 2 -- dalej
const builtD2 = new Map([
  ['fD',  ['targowisko']],  // limit 1 (obce miasto)
  ['pF1', ['targowisko']],
  ['pF2', ['targowisko']],
]);
const routesD2 = TR.refreshTradeRoutes([fD, pF1, pF2], [], map, builtD2, NO_WAR, HAS_TREATY);
eq(routesD2.length, 1, 'D2: limit=1 po stronie obcego -> tylko jedna trasa');
eq(routesD2[0].fromCityId, 'pF1', 'D2: wygrywa blizszy gracz (dystans 1 < 2)');

// ---------------------------------------------------------------------------
// E. Stabilnosc: istniejaca trasa utrzymana mimo blizszego nowego kandydata
// ---------------------------------------------------------------------------
console.log('\n-- E. refreshTradeRoutes: stabilnosc (utrzymaj istniejaca trase) --');
const pE = city('pE', 0, 120);
const fEOld = city('fEOld', 1, 125); // dystans 5 -- istniejaca trasa
const fENew = city('fENew', 1, 122); // dystans 2 -- blizszy NOWY kandydat
const builtE = new Map([
  ['pE',    ['targowisko']], // limit 1
  ['fEOld', ['targowisko']],
  ['fENew', ['targowisko']],
]);
const existingE = TR.refreshTradeRoutes([pE, fEOld], [], map, builtE, NO_WAR, HAS_TREATY);
eq(existingE.length, 1, 'E: (setup) trasa poczatkowa pE<->fEOld istnieje');
const routesE = TR.refreshTradeRoutes([pE, fEOld, fENew], existingE, map, builtE, NO_WAR, HAS_TREATY);
eq(routesE.length, 1, 'E: limit=1 -> nadal tylko jedna trasa');
eq(routesE[0].toCityId, 'fEOld', 'E: istniejaca trasa PRIORYTETOWO zachowana mimo blizszego fENew');

// ---------------------------------------------------------------------------
// F. Dochod dystansowy (Q7=A) + kredytowanie OBU miast (Q8=B)
// ---------------------------------------------------------------------------
console.log('\n-- F. dochod dystansowy: wzor + podloga + obie strony zarabiaja --');
const incP = TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
eq(incP.dochodBazowy > 0 && incP.dochodNaDystans > 0 && incP.dochodPodloga > 0, true,
  'F: parametry domyslne dodatnie');

eq(TR.tradeRouteDistanceIncome(0, incP), incP.dochodBazowy, 'F: dystans=0 -> pelny dochod bazowy');
eq(TR.tradeRouteDistanceIncome(5, incP), Math.max(incP.dochodPodloga, Math.floor(incP.dochodBazowy - 5 * incP.dochodNaDystans)),
  'F: dystans=5 -> wzor liniowy bazowy-dystans*wspolczynnik');
eq(TR.tradeRouteDistanceIncome(1000, incP), incP.dochodPodloga, 'F: dystans ekstremalny -> podloga, nigdy 0/ujemne');

const routeF1 = { id: 'r1', fromCityId: 'A', toCityId: 'B', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 5, status: 'polaczony' };
const routeF2 = { id: 'r2', fromCityId: 'A', toCityId: 'C', ownerId: 0, toOwnerId: 2, medium: 'lad', dystans: 10, status: 'polaczony' };
const routeF3suspended = { id: 'r3', fromCityId: 'A', toCityId: 'D', ownerId: 0, toOwnerId: 3, medium: 'lad', dystans: 1, status: 'brak_polaczenia' };
const incomeByCity = TR.computeTradeRouteIncomeByCity([routeF1, routeF2, routeF3suspended], incP);
const inc5  = TR.tradeRouteDistanceIncome(5, incP);
const inc10 = TR.tradeRouteDistanceIncome(10, incP);
eq(incomeByCity.get('A'), inc5 + inc10, 'F: miasto A uczestniczy w 2 trasach -> suma obu dochodow');
eq(incomeByCity.get('B'), inc5, 'F: miasto B (druga strona trasy 1) dostaje PELNA kwote (Q8=B, nie polowe)');
eq(incomeByCity.get('C'), inc10, 'F: miasto C (druga strona trasy 2) dostaje PELNA kwote');
eq(incomeByCity.has('D'), false, 'F: trasa ze statusem brak_polaczenia NIE liczy sie do dochodu');

const countByCity = TR.computeTradeRouteCountByCity([routeF1, routeF2, routeF3suspended]);
eq(countByCity.get('A'), 2, 'F: licznik tras miasta A = 2 (obie aktywne trasy)');
eq(countByCity.get('B'), 1, 'F: licznik tras miasta B = 1');
eq(countByCity.has('D'), false, 'F: trasa nieaktywna nie liczy sie do licznika');

// ---------------------------------------------------------------------------
// G. +5% Handlu za kazda aktywna trase, kumulatywnie (economy.ts)
// ---------------------------------------------------------------------------
console.log('\n-- G. cityYieldPerTurn: +5%/trase na Handel, kumulatywnie, osobny czynnik --');
function makeEconCity() {
  return {
    id: 'gc1', ludnosc: 3, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  };
}
function makeCtx(liczbaTras) {
  return {
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: false, mennicaMnoznik: 1, walutaOdkryta: false,
    liczbaAktywnychTrasHandlowych: liczbaTras,
  };
}
// 40 pol (nie realistyczne dla jednego miasta, ale cityYieldPerTurn przyjmuje
// dowolna tablice WorkedTile -- tu chcemy baseHandel na tyle duzy, zeby kazdy
// krok +5% byl widoczny osobno mimo floor() (przy malej bazie kolejne floor()
// moga dac te sama wartosc dla n i n+1, co nie znaczy braku efektu -- tylko
// zbyt gruboziarnisty test; 40 pol daje baseHandel=40, krok 5%=2/trase).
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

for (const n of [1, 2, 3, 4]) {
  const yldN = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(n));
  const expected = Math.floor(baseHandel * (1 + 0.05 * n));
  eq(yldN.handelBrutto, expected, `G: n=${n} trasy -> handelBrutto = floor(base*(1+0.05*${n})) = ${expected}`);
  assert(yldN.pieniadz >= yld0.pieniadz, `G: n=${n} trasy -> pieniadz nie maleje wzgledem braku tras`);
}

// Kumulatywnosc: n=2 daje dokladnie posrodku miedzy n=1 a n=3 skali (liniowo w n).
const yld1 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(1));
const yld2 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(2));
const yld3 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(3));
assert(yld2.handelBrutto > yld1.handelBrutto && yld3.handelBrutto > yld2.handelBrutto,
  'G: kumulatywnie rosnie z kazda kolejna trasa (1 < 2 < 3)');

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

function runTickH(tradeIncomeByCity, tradeRouteCountByCity) {
  const cities = [
    { ...pH, wealthState: { ...pH.wealthState } },
    { ...fH, wealthState: { ...fH.wealthState } },
  ];
  const econ = TR.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtH,
    1, playerZbadaneH, new Map(), new Map(), undefined, undefined, 'wysoki',
    tradeRouteCountByCity, tradeIncomeByCity,
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
  new Map([['pH', 1], ['fH', 1]]),
);
eq(withTrade.pH.pieniadzZTras, TRADE_AMOUNT, 'H2: pieniadzZTras gracza = kwota trasy');
eq(withTrade.fH.pieniadzZTras, TRADE_AMOUNT, 'H2: pieniadzZTras obcej cyw = kwota trasy (obie strony zarabiaja)');
eq(withTrade.pH.pieniadz - base.pH.pieniadz, TRADE_AMOUNT,
  'H2: pieniadz gracza wzrasta DOKLADNIE o kwote trasy (bez mnoznika Wealth, +5% Handlu tu wylaczone -- count=1 ale sprawdzane osobno w H3)');

// H3: liczbaAktywnychTrasHandlowych=1 w tym samym wywolaniu podnosi tez Handel-z-pol
// (osobny kanal) -- pieniadzBrutto (przed dochodem z tras) powinien byc >= baseline.
assert(withTrade.pH.pieniadzBrutto >= base.pH.pieniadzBrutto,
  'H3: +5% Handlu (1 trasa) nie obniza pieniadzBrutto wzgledem braku tras');

// H4: sam count (bez kwoty $) tez podnosi pieniadzBrutto lokalnie, niezaleznie od pieniadzZTras.
const onlyCount = runTickH(new Map(), new Map([['pH', 3], ['fH', 3]]));
assert(onlyCount.pH.pieniadzBrutto > base.pH.pieniadzBrutto,
  'H4: liczbaAktywnychTrasHandlowych=3 (bez dochodu $) podnosi pieniadzBrutto gracza wzgledem 0 tras');
eq(onlyCount.pH.pieniadzZTras, 0, 'H4: (kontrola) pieniadzZTras=0 gdy tradeIncomeByCity puste');

console.log(`\ntrade-routes-income-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
