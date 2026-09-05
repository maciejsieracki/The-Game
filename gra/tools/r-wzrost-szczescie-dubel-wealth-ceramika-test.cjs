'use strict';
/**
 * R-WZROST-SZCZESCIE-DUBEL-WEALTH-I-CERAMIKA-Q1
 * Niezależny test przekrojowy: kanały Happiness/Wealth/Ceramika nie dublują się.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

// Explicit three-file scope for this regression lane.
const TOPIC_ARTIFACTS = Object.freeze([
  'src/game/turn-economy.ts',
  'src/game/growth-happiness.ts',
  'tools/r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs',
]);

const entry = path.resolve(__dirname, '.r-wzrost-szczescie-dubel-entry.ts');
const bundle = path.resolve(__dirname, '.r-wzrost-szczescie-dubel-bundle.cjs');
fs.writeFileSync(entry, `
export { computeGrowthPercentV85 } from '../src/game/population-growth-v85';
export { computeHappinessBreakdown } from '../src/game/society-breakdown';
export { ceramikaHappinessBonus } from '../src/game/converters';
export { computeGrowthHappinessNetto } from '../src/game/growth-happiness';
export { previewCityEconomy, advanceCityEconomy } from '../src/game/turn-economy';
export { computeTerritoryResourceYieldByCity } from '../src/game/turn-economy';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    // Keep esbuild's paths relative to the project root. This is portable on
    // Windows workspaces whose absolute OneDrive path is not readable by the
    // sandboxed resolver.
    absWorkingDir: __dirname,
    entryPoints: ['./.r-wzrost-szczescie-dubel-entry.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: './.r-wzrost-szczescie-dubel-bundle.cjs',
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[r-wzrost-szczescie-dubel] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(bundle);
let passed = 0;
let failed = 0;
function eq(actual, expected, message) {
  if (actual === expected) {
    passed += 1;
    console.log('  [OK] ' + message);
  } else {
    failed += 1;
    console.error(`  [FAIL] ${message} got=${actual} want=${expected}`);
  }
}

console.log('\n[r-wzrost-szczescie-dubel]\n');

const happiness = M.computeHappinessBreakdown({
  population: 4,
  era: 2,
  buildingZadowolenie: 0,
  ceramikaZadowolenie: 1,
  spichlerzZadowolenie: 1,
  haWealth: 10,
}, null);
eq(happiness.lines.find(line => line.id === 'wealth')?.value, 10,
  'Wealth jest jedną, jawną linią +10');
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G3 (wlasciciel 2026-09-05): wiersze „Ceramika (dostep)" +1
// i „Spichlerz (dzialajacy)" +1 ZOSTALY USUNIETE z rozpiski Szczescia jako DUBLE — ceramika
// liczy sie teraz jako zwykly surowiec zaopatrzenia (linia `zaopatrzenie_obywateli`, +-2 na
// surowiec), a Spichlerz jako budynek szczesciodajny (+5 lacznie, G2).
//
// Tego wlasnie pilnowal ten temat (R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1): zeby bonus
// per miasto NIE byl mnozony przez liczbe miast ownera — objaw „111". Wlasciwosc zostaje,
// tylko po drugiej stronie: pola `ceramikaZadowolenie` / `spichlerzZadowolenie` sa teraz
// IGNOROWANE, wiec zadne wejscie (1, 111, cokolwiek) nie moze juz wniesc ani punktu.
// To jest MOCNIEJSZA bramka niz poprzednia: chroni przed przywroceniem dubla w ogole.
eq(happiness.lines.find(line => line.id === 'ceramika')?.value, undefined,
  'Ceramika NIE jest juz osobna linia rozpiski (G3 — liczy sie jako surowiec zaopatrzenia)');
eq(happiness.lines.find(line => line.id === 'spichlerz')?.value, undefined,
  'Spichlerz NIE jest juz osobna linia rozpiski (G3 — liczy sie jako budynek, +5)');
eq(
  happiness.lines
    .filter(line => ['wealth', 'ceramika', 'spichlerz'].includes(line.id))
    .reduce((sum, line) => sum + line.value, 0),
  10,
  'kontrolowane kanaly = sam Wealth 10; Ceramika i Spichlerz nie dokladaja sie drugi raz',
);
// Kontrola „111" po nowemu: wejscie 111 na obu polach ma zmienic netto o DOKLADNIE 0
// wzgledem tego samego miasta bez tych pol. Gdyby ktos przywrocil wiersze, netto skoczy.
{
  const bezDubli = M.computeHappinessBreakdown({
    population: 4, era: 2, buildingZadowolenie: 0, haWealth: 10,
  }, null);
  const z111 = M.computeHappinessBreakdown({
    population: 4, era: 2, buildingZadowolenie: 0, haWealth: 10,
    ceramikaZadowolenie: 111, spichlerzZadowolenie: 111,
  }, null);
  eq(z111.netto, bezDubli.netto,
    'regula 111 po G3: ceramikaZadowolenie/spichlerzZadowolenie = 111 nie zmienia netto ani o punkt');
  eq(z111.lines.length, bezDubli.lines.length,
    'regula 111 po G3: liczba wierszy rozpiski bez zmian (zaden dubel nie wraca)');
}

const shared = {
  population: 4,
  poziomRacji: 4,
  zdrowie: 0,
  szczescieNetto: 12,
  wealthPoziom: 0,
  spichlerzState: {},
  civKey: null,
  rationParams: { wzrostProc: { 4: 4 }, foodCost: { 4: 1 } },
};
const lowWealth = M.computeGrowthPercentV85({ ...shared, wealthPoziom: 0 });
const highWealth = M.computeGrowthPercentV85({ ...shared, wealthPoziom: 100 });
eq(lowWealth.szczescie, 1, 'Szczęście netto 12 daje +1% wzrostu');
eq(highWealth.szczescie, 1, 'Wealth 100 nie podbija drugi raz wzrostu');
eq(highWealth.total, lowWealth.total, 'zmiana wealthPoziom nie zmienia total przy stałym netto');
eq(M.ceramikaHappinessBonus(1, true), 1, 'Ceramika +1 po uzyskaniu dostępu');
eq(M.ceramikaHappinessBonus(1000, true), 1, 'Ceramika pozostaje binarna, bez skalowania zapasem');
eq(M.ceramikaHappinessBonus(111, true), 1, 'reguła 111: dokładnie +1 dla 111 sztuk Ceramiki');
eq(M.ceramikaHappinessBonus(111, false), 0, 'reguła 111: bez dostępu brak bonusu');
eq(M.ceramikaHappinessBonus(0, true), 0, 'reguła 111: zerowy zapas nie jest dostępem');
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G3 + ratyfikacja R3-D (2026-09-05): podglad wzrostu
// PRZESTAL doliczac Ceramike +1 i Spichlerz +1. Rozpiska Szczescia przestala je liczyc
// juz w rundzie 1 (ceramika = zwykly surowiec zaopatrzenia +-2, Spichlerz = budynek +5),
// a ten drugi tor zostal wtedy przeoczony i rozjezdzal sie z silnikiem o 2 punkty.
// Sprawdzana WLASCIWOSC tego tematu — „bonus per miasto nie moze byc mnozony przez liczbe
// miast" (objaw 111) — nie znika, tylko jest teraz pilnowana MOCNIEJ: skoro oba kanaly
// wnosza zero, zadne wejscie nie moze wniesc ani punktu, wiec dubel nie moze wrocic.
eq(M.computeGrowthHappinessNetto(10, true, true), 10,
  'Podglad wzrostu niesie SAM Wealth 10 (G3/R3-D: Ceramika i Spichlerz juz sie nie dolicza)');
eq(M.computeGrowthHappinessNetto(10, false, true), 10,
  'Dzialajacy Spichlerz nie dodaje juz osobnego +1 do podgladu wzrostu (liczy sie jako budynek, G2)');
eq(M.computeGrowthHappinessNetto(10, false, false), 10,
  'Brak Ceramiki i dzialajacego Spichlerza — punkt odniesienia, ten sam wynik');
// ASERCJA NEGATYWNA (dokladnie jak po stronie rozpiski, „regula 111" wyzej): podanie tych
// pol na wejsciu nie zmienia wyniku w ZADNEJ kombinacji flag.
for (const [maCeramike, maSpichlerz] of [[true, true], [true, false], [false, true], [false, false]]) {
  eq(M.computeGrowthHappinessNetto(10, maCeramike, maSpichlerz),
    M.computeGrowthHappinessNetto(10, false, false),
    `R3-D: ceramika=${maCeramike} / spichlerz=${maSpichlerz} nie zmienia netto podgladu wzrostu`);
}
// Ten sam dowod na innej wartosci Wealth — zeby zgodnosc nie wynikala z jednej fixtury.
eq(M.computeGrowthHappinessNetto(0, true, true), 0,
  'R3-D: przy Wealth 0 flagi Ceramiki i Spichlerza tez wnosza dokladnie 0');

// Scope guard: the helper is a committed part of this exact regression lane.
eq(typeof M.computeGrowthHappinessNetto, 'function',
  'zakres tematu: growth-happiness.ts jest dołączony do testu');
eq(TOPIC_ARTIFACTS.includes('src/game/growth-happiness.ts')
  && fs.existsSync(path.resolve(__dirname, '..', 'src/game/growth-happiness.ts')), true,
  'zakres tematu: growth-happiness.ts istnieje i pozostaje zachowany');

// Integracja: oba publiczne tory ekonomii muszą używać tego samego, ograniczonego
// kontraktu. Uruchamiamy je dla gracza i AI, nie tylko testujemy helper.
const econParams = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');
const gameData = { econParams, civs, societyParams, buildings, units, tech };

// Surowce terytorialne: preview musi dostać ten sam pełny zestaw wejściowy co
// runtime, w tym Sól oraz wszystkie rudy.
const resourceMap = M.generateMap(12, 12, 9191, 'pangea');
const resourceCity = {
  id: 'resource-city', ownerId: 0, q: 0, r: 0, name: 'Resources', population: 1,
};
const resourceHex = resourceMap.hexes['1,0'];
if (!resourceHex) throw new Error('zasoby: brak heksu fixture');
resourceHex.ulepszenia = ['warzelnia_soli', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny'];
const resourceYield = M.computeTerritoryResourceYieldByCity(
  [resourceCity], resourceMap, [{ q: 0, r: 0, pop: 1, level: 1, ownerId: 0 }],
).get(resourceCity.id);
eq(resourceYield?.sol > 0, true, 'zasoby: preview pipeline ma wejście Sól');
eq(resourceYield?.ruda > 0, true, 'zasoby: preview pipeline ma wejście ruda miedzi');
eq(resourceYield?.ruda_zelaza > 0, true, 'zasoby: preview pipeline ma wejście ruda żelaza');
eq(resourceYield?.ruda_cyny > 0, true, 'zasoby: preview pipeline ma wejście ruda cyny');

function saltAndOreParityTick(ownerId) {
  const saltMap = M.generateMap(20, 20, 9900 + ownerId, 'pangea');
  const cities = [];
  let spot = null;
  for (const hex of Object.values(saltMap.hexes)) {
    if (M.canFoundCity(hex.coords.q, hex.coords.r, [], saltMap).ok) {
      spot = hex.coords;
      break;
    }
  }
  if (!spot) throw new Error(`sól/rudy: brak heksu owner=${ownerId}`);
  const city = M.foundCityAt(spot.q, spot.r, ownerId, cities, saltMap, 'Salt');
  if (!city) throw new Error(`sól/rudy: nie można założyć miasta owner=${ownerId}`);
  const saltHex = saltMap.hexes[`${spot.q + 1},${spot.r}`];
  if (!saltHex) throw new Error(`sól/rudy: brak heksu obok owner=${ownerId}`);
  saltHex.ulepszenia = ['warzelnia_soli'];
  city.surowce = { ceramika: 25 };
  cities.push(city);
  const built = new Map([[city.id, ['spichlerz_ii']]]);
  const preview = M.previewCityEconomy(
    cities, saltMap, gameData, 'normal', built, 2, new Set(),
    new Map(), new Map(), () => 2, () => new Set(),
  ).perCity[0];
  const runtime = M.advanceCityEconomy(
    cities, saltMap, gameData, 'normal', [], new Map(), built,
    2, new Set(), new Map(), new Map(), () => 2, () => new Set(),
  ).perCity[0];
  return { preview, runtime };
}

const saltPlayer = saltAndOreParityTick(0);
eq(saltPlayer.preview.spichlerzSol, true,
  'Sól owner=0: preview Spichlerz II aktywny');
eq(saltPlayer.runtime.spichlerzSol, true,
  'Sól owner=0: runtime Spichlerz II aktywny');
eq(saltPlayer.preview.wzrostProcent, saltPlayer.runtime.wzrostProcent,
  'Sól owner=0: preview/runtime wzrost parytet');

const saltAi = saltAndOreParityTick(7);
eq(saltAi.preview.spichlerzSol, true,
  'Sól owner=7: preview Spichlerz II aktywny');
eq(saltAi.runtime.spichlerzSol, true,
  'Sól owner=7: runtime Spichlerz II aktywny');
eq(saltAi.preview.wzrostProcent, saltAi.runtime.wzrostProcent,
  'Sól owner=7: preview/runtime wzrost parytet');
const map = M.generateMap(30, 30, 4242, 'kontynenty');
let spot = null;
for (const hex of Object.values(map.hexes)) {
  if (M.canFoundCity(hex.coords.q, hex.coords.r, [], map).ok) {
    spot = hex.coords;
    break;
  }
}
if (!spot) throw new Error('integracja: brak heksu do założenia miasta');

function integrationTick(ownerId) {
  const cities = [];
  const city = M.foundCityAt(spot.q, spot.r, ownerId, cities, map, 'Parity');
  if (!city) throw new Error(`integracja: nie można założyć miasta owner=${ownerId}`);
  city.population = 4;
  city.poziomRacji = 4;
  // Deterministically give the currently worked neighborhood enough river-clay
  // inflow to exercise the start-stock=20 edge. This models current worked-tile
  // yields; it is not a data/econ-params override.
  for (const [dq, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
    const hex = map.hexes[`${spot.q + dq},${spot.r + dr}`];
    if (hex) {
      hex.rzeka = { obecna: true };
      hex.nakladka = 'las';
    }
  }
  // Same-turn edge case: the Spichlerz drains 25 Ceramiki, while Garncarnia
  // produces one from the available Glina+Drewno in this very tick.  Preview
  // must use the post-production snapshot just like runtime.
  city.surowce = { ceramika: 20, glina: 1, drewno: 1 };
  cities.push(city);
  const builtByCity = new Map([[city.id, ['garncarnia', 'spichlerz']]]);
  const ownerEra = () => 2;
  const ownerTech = () => new Set();
  const preview = M.previewCityEconomy(
    cities, map, gameData, 'normal', builtByCity, 2, new Set(),
    new Map(), new Map(), ownerEra, ownerTech,
  ).perCity[0];
  const runtime = M.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtByCity,
    2, new Set(), new Map(), new Map(), ownerEra, ownerTech,
  ).perCity[0];
  return { preview, runtime };
}

const playerTick = integrationTick(0);
const aiTick = integrationTick(7);
eq(playerTick.preview.wzrostProcent, playerTick.runtime.wzrostProcent,
  'preview/runtime: identyczny wzrost% dla gracza');
eq(aiTick.preview.wzrostProcent, aiTick.runtime.wzrostProcent,
  'preview/runtime: identyczny wzrost% dla AI');
eq(aiTick.runtime.wzrostProcent, playerTick.runtime.wzrostProcent,
  'owner parity: AI i gracz mają identyczny wzrost%');
eq(playerTick.preview.garncarniaSurplusZadowolenie, 1,
  'preview: Ceramika dokładnie +1');
eq(playerTick.runtime.garncarniaSurplusZadowolenie, 1,
  'runtime: Ceramika dokładnie +1');
eq(playerTick.preview.maSpichlerz, true,
  'preview: Spichlerz aktywny');
eq(playerTick.runtime.maSpichlerz, true,
  'runtime: Spichlerz aktywny');
eq(playerTick.preview.wzrostProcent, playerTick.runtime.wzrostProcent,
  'same-turn production: preview/runtime pozostają zgodne po produkcji Ceramiki');
eq(playerTick.preview.garncarniaSurplusZadowolenie, playerTick.runtime.garncarniaSurplusZadowolenie,
  'same-turn production: preview/runtime mają identyczny stan Ceramiki po plonach/worked tiles');
eq(playerTick.preview.garncarniaSurplusZadowolenie, 1,
  'same-turn production: Ceramika z Garncarni podtrzymuje dokładnie +1');
eq(playerTick.runtime.garncarniaSurplusZadowolenie, 1,
  'same-turn production: runtime podtrzymuje dokładnie +1');
eq(aiTick.preview.garncarniaSurplusZadowolenie, 1,
  'same-turn production AI: Ceramika podtrzymuje dokładnie +1');
eq(aiTick.runtime.garncarniaSurplusZadowolenie, 1,
  'same-turn production AI: runtime podtrzymuje dokładnie +1');

// Edge: one owner with two Spichlerze must consume the shared Ceramika pool
// once per building. With exactly one payment available, preview and runtime
// must activate only the first city (for both player and AI owners).
function multiSpichlerzTick(ownerId) {
  const multiMap = M.generateMap(30, 30, 8800 + ownerId, 'kontynenty');
  const cities = [];
  let firstSpot = null;
  let secondSpot = null;
  for (const hex of Object.values(multiMap.hexes)) {
    if (M.canFoundCity(hex.coords.q, hex.coords.r, cities, multiMap).ok) {
      firstSpot = hex.coords;
      break;
    }
  }
  if (!firstSpot) throw new Error(`multi-spichlerz: brak pierwszego heksu owner=${ownerId}`);
  const first = M.foundCityAt(firstSpot.q, firstSpot.r, ownerId, cities, multiMap, 'First');
  if (first) cities.push(first);
  for (const hex of Object.values(multiMap.hexes)) {
    if (M.canFoundCity(hex.coords.q, hex.coords.r, cities, multiMap).ok) {
      secondSpot = hex.coords;
      break;
    }
  }
  const second = secondSpot
    ? M.foundCityAt(secondSpot.q, secondSpot.r, ownerId, cities, multiMap, 'Second')
    : null;
  if (second) cities.push(second);
  if (!first || !second) throw new Error(`multi-spichlerz: nie można założyć miast owner=${ownerId}`);
  first.surowce = { ceramika: 25 };
  second.surowce = {};
  const built = new Map([
    [first.id, ['spichlerz']],
    [second.id, ['spichlerz']],
  ]);
  const preview = M.previewCityEconomy(
    cities, multiMap, gameData, 'normal', built, 2, new Set(),
    new Map(), new Map(), () => 2, () => new Set(),
  ).perCity;
  const runtime = M.advanceCityEconomy(
    cities, multiMap, gameData, 'normal', [], new Map(), built,
    2, new Set(), new Map(), new Map(), () => 2, () => new Set(),
  ).perCity;
  return { preview, runtime };
}

const multiPlayer = multiSpichlerzTick(0);
eq(multiPlayer.preview[0].maSpichlerz, true,
  'wiele Spichlerzy owner=0: preview pierwszy drain/bonus aktywny');
eq(multiPlayer.preview[1].maSpichlerz, false,
  'wiele Spichlerzy owner=0: preview drugi nie pobiera dubla');
eq(multiPlayer.runtime[0].maSpichlerz, true,
  'wiele Spichlerzy owner=0: runtime pierwszy drain/bonus aktywny');
eq(multiPlayer.runtime[1].maSpichlerz, false,
  'wiele Spichlerzy owner=0: runtime drugi nie pobiera dubla');
eq(multiPlayer.preview[0].wzrostProcent, multiPlayer.runtime[0].wzrostProcent,
  'wiele Spichlerzy owner=0: preview/runtime pierwszy parytet');
eq(multiPlayer.preview[1].wzrostProcent, multiPlayer.runtime[1].wzrostProcent,
  'wiele Spichlerzy owner=0: preview/runtime drugi parytet');

const multiAi = multiSpichlerzTick(7);
eq(multiAi.preview[0].maSpichlerz, true,
  'wiele Spichlerzy owner=7: preview pierwszy drain/bonus aktywny');
eq(multiAi.preview[1].maSpichlerz, false,
  'wiele Spichlerzy owner=7: preview drugi nie pobiera dubla');
eq(multiAi.runtime[0].maSpichlerz, true,
  'wiele Spichlerzy owner=7: runtime pierwszy drain/bonus aktywny');
eq(multiAi.runtime[1].maSpichlerz, false,
  'wiele Spichlerzy owner=7: runtime drugi nie pobiera dubla');
eq(multiAi.preview[0].wzrostProcent, multiAi.runtime[0].wzrostProcent,
  'wiele Spichlerzy owner=7: preview/runtime pierwszy parytet');
eq(multiAi.preview[1].wzrostProcent, multiAi.runtime[1].wzrostProcent,
  'wiele Spichlerzy owner=7: preview/runtime drugi parytet');

console.log(`\n[r-wzrost-szczescie-dubel] ${passed} pass, ${failed} fail\n`);
process.exit(failed > 0 ? 1 : 0);
