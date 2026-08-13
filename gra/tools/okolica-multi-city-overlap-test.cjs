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
} from '../src/game/okolica';
export {
  cityWorkedTilesForEconomy,
  workedHexCoordsForCity,
} from '../src/game/turn-economy';
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
  reconcileWorkedTilesForOwner,
  cityWorkedTilesForEconomy, workedHexCoordsForCity,
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
