'use strict';
/**
 * okolica-multi-city-overlap-test.cjs
 *
 * Dwa powiazane, ale ODREBNE naprawy tego samego bugu zgloszonego przez wlasciciela:
 * dwa miasta TEGO SAMEGO wlasciciela z zachodzacymi promieniami okolicy moga wybrac
 * te same heksy do obrobki, podwojnie liczac plon.
 *
 * SEKCJA 1 (P-HEKS-CENTRUM-OBCEGO-MIASTA, 2026-08-13): centrum miasta jest
 * BEZWARUNKOWO niedostepne jako pole do obrobki dla KAZDEGO INNEGO miasta (tej samej
 * lub obcej cywilizacji) -- zero regul priorytetu/score. Mechanizm:
 * `cityCenterKeysFromTerritoryNodes` wpiety w `effectiveIsWorkable`/
 * `terrainAndTerritoryFilter` w src/game/okolica.ts.
 *
 * SEKCJA 2 (P-HEKS-SPOR-SASIAD, 2026-08-13): spor o ZWYKLY (nie-centralny) heks miedzy
 * dwoma miastami TEGO SAMEGO wlasciciela -- najblizsze miasto wygrywa (hexDistance),
 * remis -> pierwsze miasto w tablicy `cities`. Mechanizm:
 * `computeLostToNearerSiblingByCity` w src/game/okolica.ts, wpiety jako `excludeHexKeys`
 * do `cityWorkedTilesForEconomy`/`workedHexCoordsForCity` (turn-economy.ts) i do
 * `resolveWorkedTiles`/`assignWorkedTiles`/`toggleTileWorker`/`adjustTileWorker`
 * (okolica.ts).
 *
 * Obie sekcje sa mechanizmami ROZLACZNYMI -- SEKCJA 1 nigdy nie przekazuje
 * `excludeHexKeys`, SEKCJA 2 nigdy nie testuje na hexach bedacych centrum miasta --
 * cofniecie jednej naprawy NIE powinno psuc drugiej sekcji (zweryfikowane recznie,
 * patrz raport w PR/handoff).
 *
 * Run from gra/: node tools/okolica-multi-city-overlap-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[okolica-multi-city-overlap-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.okolica-multi-city-overlap-entry.ts');
const BUNDLE = path.join(__dirname, '.okolica-multi-city-overlap-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  assignWorkedTiles,
  resolveWorkedTiles,
  toggleTileWorker,
  adjustTileWorker,
  buildTerritoryNodesFromCities,
  cityRangeForPopulation,
  computeLostToNearerSiblingByCity,
  reconcileWorkedTilesForOwner,
  reconcileAllWorkedTiles,
} from '../src/game/okolica';
export {
  cityWorkedTilesForEconomy,
  workedHexCoordsForCity,
} from '../src/game/turn-economy';
export {
  applyPostCentralPopulationGrowth,
} from '../src/game/population-growth-v85';
export {
  advanceEmpireFood,
} from '../src/game/empire-food';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[okolica-multi-city-overlap-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  assignWorkedTiles, resolveWorkedTiles, toggleTileWorker, adjustTileWorker,
  buildTerritoryNodesFromCities, cityRangeForPopulation, computeLostToNearerSiblingByCity,
  reconcileWorkedTilesForOwner, reconcileAllWorkedTiles,
  cityWorkedTilesForEconomy, workedHexCoordsForCity,
  applyPostCentralPopulationGrowth,
  advanceEmpireFood,
} = require(BUNDLE);

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// --- fixtures ------------------------------------------------------------------
/** Rownina wszedzie w [qMin,qMax]x[rMin,rMax] -- teren jednorodny (isLandWorkable=true wszedzie). */
function buildPlainsMap(qMin, qMax, rMin, rMax) {
  const hexes = {};
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      hexes[`${q},${r}`] = { terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', rzeka: null };
    }
  }
  return { szerokoscQ: qMax - qMin + 1, wysokoscR: rMax - rMin + 1, seed: 1, hexes };
}

/** Mapa "rzadka" -- tylko wskazane klucze istnieja (kontrola dokladnie ktore hexy sa kandydatami). */
function buildSparseMap(keys) {
  const hexes = {};
  for (const k of keys) hexes[k] = { terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', rzeka: null };
  return { szerokoscQ: 999, wysokoscR: 999, seed: 1, hexes };
}

function uniformYield(_q, _r) { return { zywnosc: 1, praca: 1, handel: 1 }; }

console.log('\n================ SEKCJA 1: P-HEKS-CENTRUM-OBCEGO-MIASTA (ZADANIE 1) ================\n');

// 1.1 assignWorkedTiles -- centrum miasta B (ten sam wlasciciel) NIGDY nie trafia na
// liste A, mimo ze ma NAJWYZSZY score w promieniu (bait) -- bezwarunkowe, nie
// priorytetowe wykluczenie.
console.log('1.1 assignWorkedTiles: centrum B (sam wlasciciel) wykluczone mimo najwyzszego score');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = { id: 'cityA', ownerId: 0, q: 0, r: 0, population: 9 };
  const cityB = { id: 'cityB', ownerId: 0, q: 8, r: 0, population: 9 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);

  function baitYield(q, r) {
    if (q === 8 && r === 0) return { zywnosc: 999, praca: 999, handel: 999 };
    return uniformYield(q, r);
  }

  const workedA = assignWorkedTiles(cityA.q, cityA.r, cityA.population, map, baitYield, {
    radius: 9, territoryNodes: nodes, ownerId: cityA.ownerId,
  });
  eq(workedA.length, 9, 'A dostaje pelna kwote (9) mimo wykluczenia centrum B (dosc innych legalnych pol)');
  ok(!workedA.some(t => t.key === '8,0'), 'centrum miasta B (8,0) NIE trafia na liste A mimo score=999');

  // Kontrola czulosci: BEZ territoryNodes (brak jakiejkolwiek wiedzy o innych miastach)
  // ten sam bait WYGRYWA -- dowod ze test odroznia "z wykluczeniem" od "bez".
  const workedNoNodes = assignWorkedTiles(cityA.q, cityA.r, cityA.population, map, baitYield, { radius: 9 });
  ok(workedNoNodes.some(t => t.key === '8,0'), 'kontrola: BEZ territoryNodes bait (8,0) WYGRYWA -- test czuly na regresje');
}

// 1.2 resolveWorkedTiles (API wysokiego poziomu, tryb auto) -- to samo.
console.log('\n1.2 resolveWorkedTiles (auto): centrum B wykluczone');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = { id: 'cityA', ownerId: 0, q: 0, r: 0, population: 9, okolicaTryb: 'auto' };
  const cityB = { id: 'cityB', ownerId: 0, q: 8, r: 0, population: 9 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);
  function baitYield(q, r) {
    if (q === 8 && r === 0) return { zywnosc: 999, praca: 999, handel: 999 };
    return uniformYield(q, r);
  }
  const worked = resolveWorkedTiles(cityA, map, baitYield, {
    radius: 9, territoryNodes: nodes, ownerId: cityA.ownerId,
  });
  ok(!worked.some(t => t.key === '8,0'), 'resolveWorkedTiles: centrum B (8,0) nieobecne mimo bait score');
}

// 1.3 Tryb reczny (klik / +1) -- gracz nie moze recznie posadzic 👤 na centrum
// INNEGO miasta (tej samej cywilizacji).
console.log('\n1.3 toggleTileWorker / adjustTileWorker: klik na centrum B odrzucony');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = {
    id: 'cityA', ownerId: 0, q: 0, r: 0, population: 9,
    okolicaTryb: 'reczny', okolicaReczne: {},
  };
  const cityB = { id: 'cityB', ownerId: 0, q: 8, r: 0, population: 9 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);

  const toggleRes = toggleTileWorker(cityA, map, 8, 0, undefined, nodes);
  eq(toggleRes.ok, false, 'toggleTileWorker: klik na centrum B odrzucony');

  const adjustRes = adjustTileWorker(cityA, map, 8, 0, 1, undefined, nodes);
  eq(adjustRes.ok, false, 'adjustTileWorker(+1): dodanie 👤 na centrum B odrzucone');
}

// 1.4 Silnik ekonomii (turn-economy.ts::workedHexCoordsForCity) -- ten sam realny
// entry point co advanceCityEconomy. Mapa RZADKA + kwota populacji dokladnie
// wysycajaca legalne pola -- centrum B NIGDY nie wypelnia kwoty, mimo ze bez
// wykluczenia bylby dokladnie trzecim (ostatnim potrzebnym) kandydatem.
console.log('\n1.4 workedHexCoordsForCity (silnik): centrum B nigdy nie wypelnia kwoty populacji');
{
  const map = buildSparseMap(['0,0', '1,0', '2,0', '5,0']);
  const cityA = { id: 'cityA-eng', ownerId: 0, q: 0, r: 0, population: 3 };
  const cityB = { id: 'cityB-eng', ownerId: 0, q: 5, r: 0, population: 1 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);

  const coords = workedHexCoordsForCity(cityA, map, nodes);
  // Bez wykluczenia: 3 legalne kandydatury {(1,0),(2,0),(5,0)} dla kwoty=3 -> wszystkie 3.
  // Z wykluczeniem: tylko {(1,0),(2,0)} -- kwota NIE zostaje w pelni wysycona (2 < 3).
  eq(coords.length, 2, 'kwota=3, ale tylko 2 legalne pola (centrum B wykluczone, brak substytutu w tej rzadkiej mapie)');
  ok(!coords.some(c => c.q === 5 && c.r === 0), 'centrum B (5,0) nieobecne w wyniku silnika');
  ok(coords.some(c => c.q === 1 && c.r === 0) && coords.some(c => c.q === 2 && c.r === 0),
    'oba legalne pola (1,0) i (2,0) obecne');
}

// 1.5 Obca cywilizacja -- bezwarunkowe wykluczenie dziala TAKZE miedzy roznymi
// wlascicielami (nie tylko sam wlasciciel z SEKCJI 1.1-1.4).
console.log('\n1.5 obca cywilizacja: centrum miasta AI (ownerId=1) wykluczone z listy gracza (ownerId=0)');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityPlayer = { id: 'cityPlayer', ownerId: 0, q: 0, r: 0, population: 9 };
  const cityAi = { id: 'cityAi', ownerId: 1, q: 8, r: 0, population: 9 };
  const nodes = buildTerritoryNodesFromCities([cityPlayer, cityAi]);
  function baitYield(q, r) {
    if (q === 8 && r === 0) return { zywnosc: 999, praca: 999, handel: 999 };
    return uniformYield(q, r);
  }
  // Bez ownerId w opts -- filtr wlasnosci terytorium NIE dziala (celowo), zeby
  // izolowac WYLACZNIE mechanizm centrow (nie mieszac z filtrem wlasnosci, ktory
  // i tak juz chronilby ten scenariusz od strony terytorium).
  const worked = assignWorkedTiles(cityPlayer.q, cityPlayer.r, cityPlayer.population, map, baitYield, {
    radius: 9, territoryNodes: nodes,
  });
  ok(!worked.some(t => t.key === '8,0'), 'centrum AI (8,0) wykluczone z listy gracza (bez udzialu filtra wlasnosci)');
}

// 1.6 Defensywne sprzatanie starych recznych zapisow sprzed naprawy
// (reconcileWorkedTilesForOwner, map/territory-work.ts).
console.log('\n1.6 reconcileWorkedTilesForOwner: usuwa stary wpis okolicaReczne na centrum innego miasta');
{
  const cityA = {
    id: 'cityA', ownerId: 0, q: 0, r: 0, population: 9,
    okolicaTryb: 'reczny',
    // Symulacja zapisu SPRZED naprawy: wpis na centrum B (8,0) + jeden legalny (1,0).
    okolicaReczne: { '8,0': 1, '1,0': 1 },
  };
  const cityB = { id: 'cityB', ownerId: 0, q: 8, r: 0, population: 9 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);

  const changed = reconcileWorkedTilesForOwner([cityA, cityB], nodes, 0);
  eq(changed, true, 'reconcile zglasza zmiane (usunieto nielegalny wpis)');
  eq(Object.keys(cityA.okolicaReczne).length, 1, 'tylko legalny wpis (1,0) zostal');
  ok(!('8,0' in cityA.okolicaReczne), 'wpis na centrum B usuniety');
  ok('1,0' in cityA.okolicaReczne, 'legalny wpis (1,0) nietkniety');
}

console.log('\n================ SEKCJA 2: P-HEKS-SPOR-SASIAD (ZADANIE 2) ================\n');

// 2.1 computeLostToNearerSiblingByCity -- jednostkowy test geometrii sporu.
console.log('2.1 computeLostToNearerSiblingByCity: blizsze miasto wygrywa, dalsze przegrywa dokladnie ten heks');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = { id: 'cityA', ownerId: 0, q: 0, r: 0, population: 8 };
  const cityB = { id: 'cityB', ownerId: 0, q: 10, r: 0, population: 6 };
  const lost = computeLostToNearerSiblingByCity([cityA, cityB], map);

  const lostA = lost.get('cityA') ?? new Set();
  const lostB = lost.get('cityB') ?? new Set();
  // T=(6,0): distA=6 (<=8), distB=4 (<=6) -- B blizej -> A przegrywa T.
  ok(lostA.has('6,0'), 'A przegrywa sporny heks (6,0) na rzecz blizszego B');
  ok(!lostB.has('6,0'), 'B NIE przegrywa (6,0) -- to B jest blizej');
  // Heks daleko poza zasiegiem B (np. (1,0), distA=1 distB=9>radiusB=6) -- niesporny, A go nie traci.
  ok(!lostA.has('1,0'), 'niesporny heks (1,0), poza zasiegiem B -- A go nie traci');
}

// 2.2 assignWorkedTiles + excludeHexKeys -- dalsze miasto NIE dostaje spornego pola
// (mimo najwyzszego score/bait), dostaje w zamian nastepne w rankingu; blizsze
// miasto dostaje sporne pole normalnie.
console.log('\n2.2 assignWorkedTiles + excludeHexKeys: dalsze miasto traci sporne pole, blizsze je dostaje');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = { id: 'cityA', ownerId: 0, q: 0, r: 0, population: 8 };
  const cityB = { id: 'cityB', ownerId: 0, q: 10, r: 0, population: 6 };
  const lost = computeLostToNearerSiblingByCity([cityA, cityB], map);

  function baitYield(q, r) {
    if (q === 6 && r === 0) return { zywnosc: 999, praca: 999, handel: 999 };
    return uniformYield(q, r);
  }

  const workedA = assignWorkedTiles(cityA.q, cityA.r, cityA.population, map, baitYield, {
    radius: 8, excludeHexKeys: lost.get('cityA'),
  });
  eq(workedA.length, 8, 'A mimo utraty (6,0) i tak dostaje pelna kwote 8 (substytut z rankingu)');
  ok(!workedA.some(t => t.key === '6,0'), 'A (dalsze miasto) NIE dostaje spornego pola (6,0) mimo bait score');

  const workedB = assignWorkedTiles(cityB.q, cityB.r, cityB.population, map, baitYield, {
    radius: 6, excludeHexKeys: lost.get('cityB'),
  });
  ok(workedB.some(t => t.key === '6,0'), 'B (blizsze miasto) DOSTAJE sporne pole (6,0)');

  // Kontrola czulosci: BEZ excludeHexKeys A i B WSPOLNIE licza (6,0) -- podwojne
  // liczenie plonu, dokladnie ten bug ktory ZADANIE 2 naprawia.
  const workedANoExclude = assignWorkedTiles(cityA.q, cityA.r, cityA.population, map, baitYield, { radius: 8 });
  ok(workedANoExclude.some(t => t.key === '6,0'), 'kontrola: BEZ excludeHexKeys A TEZ dostaje (6,0) -- podwojne liczenie, test czuly na regresje');
}

// 2.3 Remis odleglosci -- pierwsze miasto w tablicy `cities` wygrywa.
console.log('\n2.3 remis odleglosci: pierwsze miasto w tablicy cities wygrywa');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = { id: 'cityA', ownerId: 0, q: 0, r: 0, population: 8 };
  const cityC = { id: 'cityC', ownerId: 0, q: 8, r: 0, population: 8 };
  // T=(4,0): distA=4, distC=4 -- remis. cityA jest PIERWSZE w tablicy -> A wygrywa.
  const lost = computeLostToNearerSiblingByCity([cityA, cityC], map);
  ok(!(lost.get('cityA') ?? new Set()).has('4,0'), 'A (pierwsze w tablicy) wygrywa remis -- nie traci (4,0)');
  ok((lost.get('cityC') ?? new Set()).has('4,0'), 'C (drugie w tablicy) przegrywa remis -- traci (4,0)');

  // Odwrocona kolejnosc w tablicy -> odwrocony wynik remisu (dowod ze to KOLEJNOSC
  // w tablicy rozstrzyga, nie jakas wlasciwosc samych miast).
  const lostReversed = computeLostToNearerSiblingByCity([cityC, cityA], map);
  ok((lostReversed.get('cityA') ?? new Set()).has('4,0'), 'kolejnosc odwrocona: teraz to A (drugie) przegrywa remis');
  ok(!(lostReversed.get('cityC') ?? new Set()).has('4,0'), 'kolejnosc odwrocona: C (pierwsze) wygrywa remis');
}

// 2.4 Silnik ekonomii (cityWorkedTilesForEconomy / workedHexCoordsForCity) --
// integracja end-to-end, dokladnie jak advanceCityEconomy wiaze
// computeLostToNearerSiblingByCity -> excludeHexKeys per-city.
console.log('\n2.4 workedHexCoordsForCity (silnik) + computeLostToNearerSiblingByCity: integracja end-to-end');
{
  const map = buildSparseMap(['0,0', '1,0', '2,0', '3,0', '4,0']);
  const cityA = { id: 'cityA-eng2', ownerId: 0, q: 0, r: 0, population: 3 };
  const cityB = { id: 'cityB-eng2', ownerId: 0, q: 4, r: 0, population: 1 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);
  const lost = computeLostToNearerSiblingByCity([cityA, cityB], map);

  const coordsA = workedHexCoordsForCity(cityA, map, nodes, lost.get(cityA.id));
  const coordsB = workedHexCoordsForCity(cityB, map, nodes, lost.get(cityB.id));

  // T=(3,0): distA=3, distB=1 -- B blizej, B wygrywa. A ma kwote=3, ale legalne pola
  // to tylko {(1,0),(2,0)} (T przegrany, centrum B (4,0) wykluczone bezwarunkowo
  // przez SEKCJE 1 niezaleznie) -> lista A krotsza niz kwota.
  eq(coordsA.length, 2, 'A: kwota=3, tylko 2 legalne pola (T przegrany na rzecz B, centrum B wykluczone przez SEKCJE 1)');
  ok(!coordsA.some(c => c.q === 3 && c.r === 0), 'A NIE dostaje spornego (3,0)');
  ok(coordsB.some(c => c.q === 3 && c.r === 0), 'B (blizsze, kwota=1) DOSTAJE (3,0) jako jedyne/najlepsze pole');
}

// 2.5 Wydajnosc -- lancuch wielu zachodzacych miast tego samego wlasciciela nie
// wprowadza zauwazalnej regresji (smoke bound, nie scisly benchmark).
console.log('\n2.5 wydajnosc: 50 zachodzacych miast tego samego wlasciciela, smoke bound czasu');
{
  const N = 50;
  const spacing = 4; // = MIN_CITY_DISTANCE
  const pop = 10; // radius=10 -> nachodzace sasiedztwo przy spacing=4
  const qMin = -10, qMax = (N - 1) * spacing + 10, rMin = -10, rMax = 10;
  const map = buildPlainsMap(qMin, qMax, rMin, rMax);
  const cities = [];
  for (let i = 0; i < N; i++) {
    cities.push({ id: `city${i}`, ownerId: 0, q: i * spacing, r: 0, population: pop });
  }
  const t0 = Date.now();
  const lost = computeLostToNearerSiblingByCity(cities, map);
  const elapsedMs = Date.now() - t0;
  ok(elapsedMs < 5000, `computeLostToNearerSiblingByCity(50 miast nachodzacych) < 5000ms (got ${elapsedMs}ms)`);
  ok(lost.size > 0, 'przy spacing=4 < 2*radius=20 realnie istnieja sporne heksy (mechanizm sie uruchamia)');
}

console.log('\n================ SEKCJA 3: RUNDA 2 NOTA A -- panel miasta liczy jak silnik ================\n');

// Evaluator rundy 1 zmierzyl rozjazd: silnik (cityWorkedTilesForEconomy z excludeHexKeys)
// liczyl A=3/B=2 pol, panel miasta (cityPanel.ts computeView/resolveCityHealth, wolal
// cityWorkedTilesForEconomy BEZ excludeHexKeys) liczyl A=4/B=2 -- panel ignorowal regule
// "najblizsze miasto wygrywa". Naprawa: nowy hak `cfg.getExcludeHexKeys` w CityPanelConfig,
// wpiety w main.ts (siblingClaimedHexKeysForCity, ten sam mechanizm co juz istniejacy
// getWorkedTiles/getCityHealth) i uzyty w OBU miejscach cityPanel.ts ktore licza worked
// tiles (computeView + fallback resolveCityHealth). cityPanel.ts importuje DOM/THREE (nie
// da sie go zbundlowac standalone w node bez jsdom) -- test tekstowy na zrodle, wzorem
// juz istniejacego tools/spichlerz-cap-citypanel-wiring-test.cjs w tym repo. Liczby A=3
// vs A=4 sa juz dowiedzione behawioralnie w SEKCJI 2.2/2.4 wyzej (cityWorkedTilesForEconomy/
// assignWorkedTiles z i bez excludeHexKeys) -- tu weryfikujemy WYLACZNIE ze panel faktycznie
// PRZEKAZUJE ten sam zestaw do TEJ SAMEJ funkcji silnika, nie ze reimplementuje formule.
const CITY_PANEL_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'cityPanel.ts'), 'utf8');
const MAIN_TS_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

console.log('3.1 CityPanelConfig deklaruje hook getExcludeHexKeys');
{
  ok(/getExcludeHexKeys\?:\s*\(cityId: string\) => ReadonlySet<string> \| undefined;/.test(CITY_PANEL_SRC),
    'CityPanelConfig ma pole getExcludeHexKeys?: (cityId: string) => ReadonlySet<string> | undefined');
}

console.log('\n3.2 computeView(...): worked tiles licza z cfg.getExcludeHexKeys?.(city.id)');
{
  const fnStartMarker = 'function computeView(city: City, map: GameMap, data: GameData): CityView | null {';
  const fnStart = CITY_PANEL_SRC.indexOf(fnStartMarker);
  ok(fnStart >= 0, 'znaleziono computeView(...) w cityPanel.ts');
  const fnEndIdx = fnStart >= 0 ? CITY_PANEL_SRC.indexOf('\nfunction ', fnStart + fnStartMarker.length) : -1;
  ok(fnEndIdx > fnStart, 'znaleziono koniec computeView(...) (kolejna top-level function)');
  const fnBody = fnStart >= 0 && fnEndIdx > fnStart ? CITY_PANEL_SRC.slice(fnStart, fnEndIdx) : '';
  const workedMatch = fnBody.match(/const worked = cityWorkedTilesForEconomy\(([^;]+)\);/);
  ok(!!workedMatch, 'znaleziono wiersz `const worked = cityWorkedTilesForEconomy(...)` w computeView(...)');
  const workedExpr = workedMatch ? workedMatch[1] : '';
  ok(/cfg\.getExcludeHexKeys\?\.\(city\.id\)/.test(workedExpr),
    `RUNDA 2 NOTA A: computeView przekazuje cfg.getExcludeHexKeys?.(city.id) -- wywolanie: "${workedExpr}"`);
}

console.log('\n3.3 resolveCityHealth(...) fallback: tiles licza z cfg.getExcludeHexKeys?.(city.id)');
{
  const fnStartMarker = 'function resolveCityHealth(city: City, map: GameMap, data: GameData): { total: number; lines: CityHealthLine[]; fromEngine: boolean } {';
  const fnStart = CITY_PANEL_SRC.indexOf(fnStartMarker);
  ok(fnStart >= 0, 'znaleziono resolveCityHealth(...) w cityPanel.ts');
  const fnEndIdx = fnStart >= 0 ? CITY_PANEL_SRC.indexOf('\nfunction ', fnStart + fnStartMarker.length) : -1;
  ok(fnEndIdx > fnStart, 'znaleziono koniec resolveCityHealth(...) (kolejna top-level function)');
  const fnBody = fnStart >= 0 && fnEndIdx > fnStart ? CITY_PANEL_SRC.slice(fnStart, fnEndIdx) : '';
  const tilesMatch = fnBody.match(/const tiles = cityWorkedTilesForEconomy\(([^;]+)\);/);
  ok(!!tilesMatch, 'znaleziono wiersz `const tiles = cityWorkedTilesForEconomy(...)` w resolveCityHealth(...) (fallback, gdy cfg.getCityHealth nie odpowiedzial)');
  const tilesExpr = tilesMatch ? tilesMatch[1] : '';
  ok(/cfg\.getExcludeHexKeys\?\.\(city\.id\)/.test(tilesExpr),
    `RUNDA 2 NOTA A: resolveCityHealth fallback przekazuje cfg.getExcludeHexKeys?.(city.id) -- wywolanie: "${tilesExpr}"`);
}

console.log('\n3.4 main.ts wpina getExcludeHexKeys w OBU configureCityPanel(...) przez siblingClaimedHexKeysForCity');
{
  const occurrences = MAIN_TS_SRC.split('getExcludeHexKeys: (cityId: string) => {').length - 1;
  eq(occurrences, 2, 'main.ts definiuje getExcludeHexKeys DWA razy (jedna definicja na configureCityPanel(...) wywolanie)');
  const wiredToSibling = (MAIN_TS_SRC.match(
    /getExcludeHexKeys: \(cityId: string\) => \{[\s\S]{0,200}?siblingClaimedHexKeysForCity\(city\)/g,
  ) || []).length;
  eq(wiredToSibling, 2, 'obie definicje getExcludeHexKeys zwracaja siblingClaimedHexKeysForCity(city) -- ten sam mechanizm co getWorkedTiles/getCityHealth');
}

console.log('\n================ SEKCJA 4: RUNDA 2 NOTA B -- rebalans po wzroscie populacji ================\n');

// NOTA B Evaluatora rundy 1: population-growth-v85.ts wolal
// rebalanceWorkersAfterPopulationChange(...) BEZ excludeHexKeys -- auto-rebalans w trybie
// recznym po wzroscie populacji mogl (rzadko) posadzic 👤 na spornym polu. Odczyt silnika
// jest fail-closed (bez podwojnego liczenia), ale slot robotnika marnowal sie po cichu.
// Naprawa: nowy opcjonalny `excludeHexKeysByCity` w PostCentralGrowthOpts, wpiety w main.ts
// z computeLostToNearerSiblingByCity(cities, map) (ten sam mechanizm co silnik tury).
// Test behawioralny (nie tekstowy) -- population-growth-v85.ts jest czysta logika (bez
// DOM), bundlowalna standalone identycznie jak w tools/population-growth-v85-test.cjs.
console.log('4.1 applyPostCentralPopulationGrowth + excludeHexKeysByCity: reczny rebalans NIE sadza 👤 na spornym polu');
{
  // Mapa rzadka: tylko '3,0' (sporne, jedyny legalny kandydat w promieniu cityA obok
  // wlasnego centrum '0,0'), plus centrum cityB '5,0' (wykluczone bezwarunkowo przez
  // SEKCJE 1, niezaleznie). Geometria identyczna jak SEKCJA 2.4: distA(3,0)=3 <= radiusA(5),
  // distB(3,0)=2 <= radiusB(6) -- B blizej, A traci (3,0).
  const map = buildSparseMap(['0,0', '3,0', '5,0']);
  const cityA = {
    id: 'cityA-pg', ownerId: 0, q: 0, r: 0, population: 2,
    okolicaTryb: 'reczny', okolicaReczne: {},
    poziomRacji: 4, wzrostUlamkowy: 0.95, turyBezDoplaty: 0, rationMigratedV114: true,
  };
  const cityB = { id: 'cityB-pg', ownerId: 0, q: 5, r: 0, population: 6 };
  const territoryNodes = buildTerritoryNodesFromCities([cityA, cityB]);
  const lost = computeLostToNearerSiblingByCity([cityA, cityB], map);
  ok((lost.get('cityA-pg') ?? new Set()).has('3,0'), 'kontrola geometrii: cityA-pg traci sporne (3,0) na rzecz blizszego cityB-pg');

  const econ = {
    perCity: [{
      cityId: 'cityA-pg', ownerId: 0, oblegany: false,
      zywnoscBrutto: 10, kosztRacji: 6, bilansLokalny: 4,
      zdrowie: 0, ludnoscPrzed: 2, ludnoscPo: 2,
    }],
    growth: 0, starved: 0,
  };
  const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };
  const efParams = {
    centralCapBaza: 500, centralCapBonusMagazyn: 100,
    glodWojskaHpFrac: 0.08, glodWojskaKarencjaTur: 3, glodWojskaStatMult: 0.75,
    rationParams: { racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6, racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7 },
  };
  const econParams = { akweduktProgLudnosci: 4, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 };
  const states = new Map();
  const ef = advanceEmpireFood(econ, [], states, upkeep, efParams);

  const popBefore = cityA.population;
  applyPostCentralPopulationGrowth({
    cities: [cityA, cityB],
    econ,
    efResult: ef,
    map,
    territoryNodes,
    econParams,
    rationParams: efParams.rationParams,
    builtByCity: new Map([['cityA-pg', []]]),
    excludeHexKeysByCity: lost,
  });
  // Sanity NIEwacuowa -- jesli populacja nie urosla, rebalanceWorkersAfterPopulationChange
  // nigdy sie nie wywoluje i asercja ponizej przeszlaby "za darmo" (bez realnej weryfikacji).
  eq(cityA.population, popBefore + 1, 'precondition: cityA-pg faktycznie urosla o 1 w tym ticku (inaczej rebalans sie nie odpala)');
  ok(!('3,0' in (cityA.okolicaReczne ?? {})), 'RUNDA 2 NOTA B: reczny rebalans z excludeHexKeysByCity NIE sadza 👤 na spornym (3,0)');

  // Kontrola czulosci: BEZ excludeHexKeysByCity ten sam scenariusz SADZA 👤 na (3,0)
  // (jedyny legalny kandydat w tej rzadkiej mapie) -- dowod ze test jest czuly na regresje,
  // nie ze (3,0) jest po prostu nigdy nie wybierane z innego powodu.
  const cityANoExclude = {
    id: 'cityA-pg2', ownerId: 0, q: 0, r: 0, population: 2,
    okolicaTryb: 'reczny', okolicaReczne: {},
    poziomRacji: 4, wzrostUlamkowy: 0.95, turyBezDoplaty: 0, rationMigratedV114: true,
  };
  const econNoExclude = {
    perCity: [{
      cityId: 'cityA-pg2', ownerId: 0, oblegany: false,
      zywnoscBrutto: 10, kosztRacji: 6, bilansLokalny: 4,
      zdrowie: 0, ludnoscPrzed: 2, ludnoscPo: 2,
    }],
    growth: 0, starved: 0,
  };
  const statesNoExclude = new Map();
  const efNoExclude = advanceEmpireFood(econNoExclude, [], statesNoExclude, upkeep, efParams);
  applyPostCentralPopulationGrowth({
    cities: [cityANoExclude, cityB],
    econ: econNoExclude,
    efResult: efNoExclude,
    map,
    territoryNodes,
    econParams,
    rationParams: efParams.rationParams,
    builtByCity: new Map([['cityA-pg2', []]]),
    // celowo BRAK excludeHexKeysByCity
  });
  eq(cityANoExclude.population, popBefore + 1, 'kontrola: rowniez tu populacja urosla o 1 (ten sam scenariusz bazowy)');
  ok('3,0' in (cityANoExclude.okolicaReczne ?? {}),
    'kontrola czulosci: BEZ excludeHexKeysByCity rebalans TEZ sadza 👤 na (3,0) -- dokladnie bug ktory NOTA B naprawia');
}

console.log('\n================ SEKCJA 5: RUNDA 2 NOTA D -- reconcile czysci kolizje wewnatrz-wlascicielskie ================\n');

// NOTA D Evaluatora rundy 1: zakres ECHO A wymagal tez czyszczenia starych wpisow
// okolicaReczne wskazujacych na zwykle (nie-centralne) pole, ktore regula "najblizsze
// miasto wygrywa" przypisala INNEMU miastu tego samego wlasciciela -- runda 1 domknela
// tylko warstwe centrow. Naprawa: reconcileWorkedTilesForOwner/reconcileAllWorkedTiles
// przyjmuja teraz opcjonalny `lostToSiblingByCity` (computeLostToNearerSiblingByCity) i
// usuwaja tez te wpisy.
console.log('5.1 reconcileWorkedTilesForOwner: usuwa stary wpis okolicaReczne na spornym (nie-centralnym) polu przegranym na rzecz blizszego miasta');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = {
    id: 'cityA-r5', ownerId: 0, q: 0, r: 0, population: 8,
    okolicaTryb: 'reczny',
    // Symulacja zapisu SPRZED naprawy: wpis na (6,0) -- sporne pole, dzis przegrane na
    // rzecz blizszego cityB -- plus jeden bezsporny legalny wpis (1,0).
    okolicaReczne: { '6,0': 1, '1,0': 1 },
  };
  const cityB = { id: 'cityB-r5', ownerId: 0, q: 10, r: 0, population: 6 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);
  const lost = computeLostToNearerSiblingByCity([cityA, cityB], map);
  ok((lost.get('cityA-r5') ?? new Set()).has('6,0'), 'kontrola geometrii: cityA-r5 traci sporne (6,0) na rzecz blizszego cityB-r5 (ten sam scenariusz co SEKCJA 2.1)');

  const changed = reconcileWorkedTilesForOwner([cityA, cityB], nodes, 0, lost);
  eq(changed, true, 'reconcile zglasza zmiane (usunieto sporny wpis)');
  eq(Object.keys(cityA.okolicaReczne).length, 1, 'tylko bezsporny wpis (1,0) zostal');
  ok(!('6,0' in cityA.okolicaReczne), 'sporny wpis (6,0), przegrany na rzecz cityB-r5, zostal usuniety');
  ok('1,0' in cityA.okolicaReczne, 'bezsporny wpis (1,0) nietkniety');
}

console.log('\n5.2 kontrola czulosci: BEZ lostToSiblingByCity sporny wpis NIE jest usuwany (dowod ze SEKCJA 5.1 testuje realny mechanizm, nie efekt uboczny warstwy centrow)');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = {
    id: 'cityA-r5b', ownerId: 0, q: 0, r: 0, population: 8,
    okolicaTryb: 'reczny',
    okolicaReczne: { '6,0': 1, '1,0': 1 },
  };
  const cityB = { id: 'cityB-r5b', ownerId: 0, q: 10, r: 0, population: 6 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);
  const changed = reconcileWorkedTilesForOwner([cityA, cityB], nodes, 0); // bez 4. argumentu
  eq(changed, false, 'kontrola: bez lostToSiblingByCity reconcile nie zglasza zmiany (sporny wpis nie jest wykrywany bez tej warstwy)');
  ok('6,0' in cityA.okolicaReczne, 'kontrola: sporny wpis (6,0) POZOSTAJE bez lostToSiblingByCity -- dowod czulosci na regresje');
}

console.log('\n5.3 reconcileAllWorkedTiles: przekazuje lostToSiblingByCity dalej do reconcileWorkedTilesForOwner');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const cityA = {
    id: 'cityA-r5c', ownerId: 0, q: 0, r: 0, population: 8,
    okolicaTryb: 'reczny',
    okolicaReczne: { '6,0': 1, '1,0': 1 },
  };
  const cityB = { id: 'cityB-r5c', ownerId: 0, q: 10, r: 0, population: 6 };
  const nodes = buildTerritoryNodesFromCities([cityA, cityB]);
  const lost = computeLostToNearerSiblingByCity([cityA, cityB], map);
  reconcileAllWorkedTiles([cityA, cityB], nodes, lost);
  ok(!('6,0' in cityA.okolicaReczne), 'reconcileAllWorkedTiles(..., lostToSiblingByCity) usuwa sporny wpis przez cala funkcje zbiorcza');
  ok('1,0' in cityA.okolicaReczne, 'bezsporny wpis (1,0) nietkniety przez reconcileAllWorkedTiles');
}

// --- summary -------------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log(`\nOKOLICA-MULTI-CITY-OVERLAP OK (${passed}/${total})`);
} else {
  console.log(`\nOKOLICA-MULTI-CITY-OVERLAP FAIL (${passed}/${total} passed, ${failed} failed)`);
}

try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

process.exit(failed === 0 ? 0 : 1);
