'use strict';
/**
 * fort-strazniaca-zasieg-zakladania-test.cjs
 * R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA krok 2 (Maciej 2026-08-09,
 * ECHO Q1=B/Q2=B/Q3=A). Pokrywa:
 *   Sekcja A — game/fort-territory.ts (PURE): foundingNodesForOwner,
 *     isHexReservedByRivalFort (regula 1/3 kontestacja), applyFortTakeoverOnCityFounded
 *     (regula 4 przejecie), findEvacuationHexOutsideCity (regula 5/Q3=A ewakuacja).
 *   Sekcja B — map/improvement-build.ts: buildImprovementQualifier dla fort/posterunek
 *     (Q1=B: dozwolone poza wlasnym terytorium pod warunkiem braku cudzej-miasta-
 *     terytorium ORAZ wlasnej jednostki na hexie; wewnatrz wlasnego terytorium bez
 *     zmiany zachowania sprzed kroku 2).
 *   Sekcja C — game/ai.ts: planCityFounding z fortNodes (parytet AI) — domyslne
 *     zachowanie (fortNodes=[]) NIETKNIETE (regresja kroku 1), fort AI rozszerza
 *     zasieg zakladania identycznie jak dla gracza.
 *
 * Run from gra/:  node tools/fort-strazniaca-zasieg-zakladania-test.cjs
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[fort-strazniaca-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.fort-strazniaca-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.fort-strazniaca-bundle.cjs');

const ENTRY_TS = `
export {
  fortNodeAsCityNode,
  isHexReservedByRivalFort,
  foundingNodesForOwner,
  applyFortTakeoverOnCityFounded,
  findEvacuationHexOutsideCity,
} from ${JSON.stringify(SRC + '/game/fort-territory')};
export { isInTerritory, cityTerritoryRadius, axialDistance } from ${JSON.stringify(SRC + '/map/territory')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { canUnitOccupyCityHex } from ${JSON.stringify(SRC + '/game/city-hex-movement')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { planCityFounding, planExpansionFortBuilding } from ${JSON.stringify(SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(SRC + '/units/setup')};
export { MIN_CITY_DISTANCE } from ${JSON.stringify(SRC + '/game/cities')};
export { AI_FOUNDING_SOURCE_MIN_POP } from ${JSON.stringify(SRC + '/game/city-founding')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[fort-strazniaca-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  fortNodeAsCityNode,
  isHexReservedByRivalFort,
  foundingNodesForOwner,
  applyFortTakeoverOnCityFounded,
  findEvacuationHexOutsideCity,
  isInTerritory,
  cityTerritoryRadius,
  buildImprovementQualifier,
  canUnitOccupyCityHex,
  TerenBazowy,
  Nakladka,
  planCityFounding,
  planExpansionFortBuilding,
  hexDistance,
  MIN_CITY_DISTANCE,
  AI_FOUNDING_SOURCE_MIN_POP,
} = M;

// ============================================================================
// SEKCJA A — game/fort-territory.ts (PURE)
// ============================================================================

console.log('\n--- A1: fortNodeAsCityNode + cityTerritoryRadius (fort=10, posterunek=5) ---');
{
  const fort = fortNodeAsCityNode({ q: 0, r: 0, type: 'fort' });
  const post = fortNodeAsCityNode({ q: 0, r: 0, type: 'posterunek' });
  eq(cityTerritoryRadius(fort), 10, 'A1a: fort radius = 10');
  eq(cityTerritoryRadius(post), 5, 'A1b: posterunek radius = 5');
}

console.log('\n--- A2: foundingNodesForOwner — wlasne miasta + wlasne, nie-skontestowane forty ---');
{
  const ownCities = [{ q: 0, r: 0, pop: 1, level: 1 }];
  const forts = [
    { q: 20, r: 0, ownerId: 1, type: 'fort' },              // wlasny (owner=1)
    { q: 30, r: 0, ownerId: 2, type: 'fort' },               // cudzy (owner=2)
    { q: 40, r: 0, ownerId: 1, type: 'fort', contestedUseless: true }, // wlasny ale skontestowany
  ];
  const nodes = foundingNodesForOwner(1, ownCities, forts);
  eq(nodes.length, 2, 'A2a: 1 wlasne miasto + 1 wlasny nie-skontestowany fort = 2 wezly');
  assert(nodes.some(n => n.q === 20 && n.r === 0), 'A2b: wlasny fort wchodzi do listy');
  assert(!nodes.some(n => n.q === 30), 'A2c: cudzy fort NIE wchodzi');
  assert(!nodes.some(n => n.q === 40), 'A2d: skontestowany wlasny fort NIE wchodzi');
}

console.log('\n--- A3: isHexReservedByRivalFort — regula 1/3 kontestacja ---');
{
  const existing = [{ q: 0, r: 0, ownerId: 1, type: 'fort' }]; // promien 10
  assert(isHexReservedByRivalFort(5, 0, 2, existing),
    'A3a: hex w promieniu (5,0) cudzego fortu (owner=1) jest zarezerwowany DLA INNEGO budowniczego (owner=2)');
  assert(!isHexReservedByRivalFort(5, 0, 1, existing),
    'A3b: WLASNY fort (ten sam owner=1) nie rezerwuje przeciw sobie samemu');
  assert(!isHexReservedByRivalFort(50, 0, 2, existing),
    'A3c: hex POZA promieniem (50,0) nie jest zarezerwowany');
  const contestedExisting = [{ q: 0, r: 0, ownerId: 1, type: 'fort', contestedUseless: true }];
  assert(!isHexReservedByRivalFort(5, 0, 2, contestedExisting),
    'A3d: skontestowany (bezuzyteczny) fort NIE rezerwuje niczego dla nikogo');
}

console.log('\n--- A4: applyFortTakeoverOnCityFounded — regula 4 przejecie ---');
{
  const forts = [
    { q: 3, r: 0, ownerId: 1, type: 'posterunek', contestedUseless: true },
    { q: 50, r: 0, ownerId: 1, type: 'fort' }, // za daleko od nowego miasta
    { q: 2, r: 0, ownerId: 2, type: 'fort' },  // juz nalezy do przejmujacego -- pomijany
  ];
  const events = applyFortTakeoverOnCityFounded({ q: 0, r: 0, ownerId: 2, population: 10 }, forts);
  eq(events.length, 1, 'A4a: dokladnie 1 przejecie (hex (3,0) w promieniu nowego miasta pop=10)');
  if (events.length === 1) {
    eq(events[0].q, 3, 'A4b: przejety hex q');
    eq(events[0].prevOwnerId, 1, 'A4c: poprzedni wlasciciel = 1');
    eq(events[0].newOwnerId, 2, 'A4d: nowy wlasciciel = 2');
  }
  const transferred = forts.find(f => f.q === 3 && f.r === 0);
  eq(transferred.ownerId, 2, 'A4e: fortNodes zmutowane in-place -- ownerId faktycznie zmieniony');
  eq(transferred.contestedUseless, false, 'A4f: przejecie ZAWSZE resetuje contestedUseless (skuteczne niezaleznie od stanu kontestacji)');
  const untouched = forts.find(f => f.q === 50);
  eq(untouched.ownerId, 1, 'A4g: fort poza zasiegiem NIE przejety');
}

console.log('\n--- A4b: applyFortTakeoverOnCityFounded (F1) — fort DOKLADNIE na hexie nowego miasta znika CALKOWICIE ---');
{
  // Przypadek WLASNY: miasto zakladane na hexie WLASNEGO fortu -- przed F1 ten
  // fort byl calkowicie pomijany przez glowna petle (f.ownerId === newCity.ownerId
  // -> continue) i zostawal jako wezel-widmo NA ZAWSZE.
  const fortsOwn = [{ q: 0, r: 0, ownerId: 2, type: 'posterunek' }];
  const eventsOwn = applyFortTakeoverOnCityFounded({ q: 0, r: 0, ownerId: 2, population: 10 }, fortsOwn);
  eq(eventsOwn.length, 0, 'A4b-own-1: brak zdarzenia ewakuacji (wlasny fort, brak "obcego" wlasciciela)');
  eq(fortsOwn.length, 0, 'A4b-own-2: fortNodes NIE zawiera juz wpisu na hexie miasta (wlasny fort)');

  // Przypadek CUDZY: miasto zakladane na hexie CUDZEGO fortu -- przed F1
  // ownerId byl przepisywany na nowego wlasciciela (fort "przejety" i
  // fizycznie ZOSTAWAL w rejestrze), mimo ze improvement zostal fizycznie
  // skasowany z mapy (Macierz B, main.ts finalizeCityFounding).
  const fortsRival = [{ q: 0, r: 0, ownerId: 1, type: 'fort' }];
  const eventsRival = applyFortTakeoverOnCityFounded({ q: 0, r: 0, ownerId: 2, population: 10 }, fortsRival);
  eq(eventsRival.length, 1, 'A4b-rival-1: zdarzenie ewakuacji WCIAZ generowane (cudzy fort mial jednostki do ewakuacji)');
  if (eventsRival.length === 1) {
    eq(eventsRival[0].prevOwnerId, 1, 'A4b-rival-2: poprzedni wlasciciel poprawny w zdarzeniu');
    eq(eventsRival[0].newOwnerId, 2, 'A4b-rival-3: nowy wlasciciel poprawny w zdarzeniu');
  }
  eq(fortsRival.length, 0, 'A4b-rival-4: fortNodes NIE zawiera juz wpisu na hexie miasta (cudzy fort, mimo zdarzenia przejecia)');

  // Sasiedni fort (NIE na hexie miasta, ale w promieniu) zachowuje sie jak
  // dotychczas -- przejety (ownerId przepisany), NIE usuniety z rejestru.
  const fortsMixed = [
    { q: 0, r: 0, ownerId: 1, type: 'fort' },   // na hexie miasta -> znika
    { q: 3, r: 0, ownerId: 1, type: 'fort' },   // w promieniu, INNY hex -> przejety, zostaje
  ];
  const eventsMixed = applyFortTakeoverOnCityFounded({ q: 0, r: 0, ownerId: 2, population: 10 }, fortsMixed);
  eq(eventsMixed.length, 2, 'A4b-mixed-1: 2 zdarzenia (oba forty mialy obcego wlasciciela)');
  eq(fortsMixed.length, 1, 'A4b-mixed-2: TYLKO fort na hexie miasta usuniety -- sasiedni zostaje w rejestrze');
  if (fortsMixed.length === 1) {
    eq(fortsMixed[0].q, 3, 'A4b-mixed-3: pozostaly wezel to ten POZA hexem miasta');
    eq(fortsMixed[0].ownerId, 2, 'A4b-mixed-4: pozostaly wezel MA przejetego wlasciciela (regula 4 normalna)');
  }
}

console.log('\n--- A5: findEvacuationHexOutsideCity — regula 5/Q3=A ewakuacja ---');
{
  const w = 40, h = 40;
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) hexes[`${q},${r}`] = { coords: { q, r } };
  const map = { hexes };
  const newCityNode = { q: 20, r: 20, pop: 10, level: 1 }; // radius wg cityTerritoryRadius(pop=10)
  const radius = cityTerritoryRadius(newCityNode);
  const fortQ = 20, fortR = 20 + radius; // fort NA granicy zasiegu nowego miasta
  const dest = findEvacuationHexOutsideCity(fortQ, fortR, newCityNode, map, () => true);
  assert(dest !== null, 'A5a: znaleziono cel ewakuacji');
  if (dest) {
    const dist = hexDistance(dest.q, dest.r, 20, 20);
    assert(dist > radius, `A5b: cel ewakuacji (${dest.q},${dest.r}) POZA promieniem nowego miasta (dist=${dist} > ${radius})`);
  }
  const destBlocked = findEvacuationHexOutsideCity(fortQ, fortR, newCityNode, map, () => false, 3);
  eq(destBlocked, null, 'A5c: brak wolnych heksow (isFree zawsze false) -> null (jednostka zostaje)');
}

console.log('\n--- A5b: findEvacuationHexOutsideCity + canUnitOccupyCityHex (F2a) -- ewakuacja NIE lqduje na hexie CUDZEGO miasta ---');
{
  // newCityNode celowo BARDZO daleko od fortu -- kazdy hex kandydujacy w poblizu
  // fortu jest z definicji "poza promieniem nowego miasta" (axialDistance ogromny),
  // wiec JEDYNYM czynnikiem rozstrzygajacym wybor w tym tescie jest predykat isFree
  // -- dokladnie ta kompozycja co main.ts applyFortTakeoverAndEvacuation.
  const w = 60, h = 60;
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) hexes[`${q},${r}`] = { coords: { q, r } };
  const map = { hexes };
  const fortQ = 20, fortR = 20;
  const distantCityNode = { q: 1000, r: 1000, pop: 10, level: 1 };
  const evacuatedUnitOwnerId = 1; // wlasciciel ewakuowanej jednostki (byly wlasciciel fortu)
  const thirdCivOwnerId = 3;      // trzecia cywilizacja, WLASCICIEL miasta w poblizu

  // Krok 1: baseline BEZ zadnej bramki miejskiej -- ustal, ktory hex algorytm
  // wybralby "naturalnie" (najblizszy wolny) -- deterministyczne wg tie-breaku
  // findEvacuationHexOutsideCity, niezalezne od wewnetrznej implementacji hexKeysWithinRadius.
  const baselineDest = findEvacuationHexOutsideCity(
    fortQ, fortR, distantCityNode, map, () => true,
  );
  assert(baselineDest !== null, 'A5b-sanity: baseline znajduje jakis hex (mapa nie jest pusta)');

  const citiesWithThirdCivAtBaseline = baselineDest
    ? [{ q: baselineDest.q, r: baselineDest.r, ownerId: thirdCivOwnerId }]
    : [];

  // Krok 2: PRZED F2 -- isFree byl `isHexPassableForUnit && brak innej jednostki`,
  // BEZ canUnitOccupyCityHex -- odtwarzamy dokladnie ten stary predykat. Musi
  // wciaz wyladowac na hexie trzeciej cywilizacji (reprodukuje defekt F2a).
  const oldStyleIsFree = () => true; // "isHexPassableForUnit && brak jednostki", tu zawsze true
  const destOldBug = findEvacuationHexOutsideCity(
    fortQ, fortR, distantCityNode, map, oldStyleIsFree,
  );
  eq(destOldBug?.q, baselineDest?.q, 'A5b-repro-q: STARY predykat (bez canUnitOccupyCityHex) ladowalby na hexie miasta trzeciej cywilizacji (q)');
  eq(destOldBug?.r, baselineDest?.r, 'A5b-repro-r: to samo (r) -- reprodukcja defektu F2a przed poprawka');

  // Krok 3: PO F2 -- main.ts komponuje isFree jako
  // `isHexPassableForUnit(...) && canUnitOccupyCityHex(u.ownerId, ...) && brak jednostki`.
  // Odtwarzamy TA SAMA kompozycje z prawdziwym, eksportowanym canUnitOccupyCityHex.
  const newStyleIsFree = (nq, nr) =>
    canUnitOccupyCityHex(evacuatedUnitOwnerId, nq, nr, citiesWithThirdCivAtBaseline);
  const destFixed = findEvacuationHexOutsideCity(
    fortQ, fortR, distantCityNode, map, newStyleIsFree,
  );
  assert(destFixed !== null, 'A5b-fixed-sanity: wciaz istnieje jakis legalny hex ewakuacji poza zablokowanym');
  if (destFixed && baselineDest) {
    const landedOnForeignCity = destFixed.q === baselineDest.q && destFixed.r === baselineDest.r;
    assert(!landedOnForeignCity, 'A5b: F2a fix -- ewakuacja z canUnitOccupyCityHex NIE laduje na hexie miasta trzeciej cywilizacji');
  }
}

// ============================================================================
// SEKCJA B — map/improvement-build.ts: buildImprovementQualifier dla fort/posterunek
// ============================================================================

function mkHex(q, r, teren, nakladka = Nakladka.Brak) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
}

function mkMapAround(cells) {
  const hexes = {};
  for (const [q, r] of cells) hexes[`${q},${r}`] = mkHex(q, r, TerenBazowy.Rownina);
  return { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
}

console.log('\n--- B1: fort/posterunek POZA wlasnym terytorium -- wymog wlasnej jednostki (Q1=B) ---');
{
  const ownCity = { q: 0, r: 0, pop: 1, level: 1 }; // radius 5
  const farHex = { q: 20, r: 0 }; // daleko poza radius 5, poza wszystkim
  const map = mkMapAround([[0, 0], [20, 0]]);

  const qualNoUnit = buildImprovementQualifier({
    map,
    cityNodes: [ownCity],
    territoryNodes: [{ ...ownCity, ownerId: 0 }],
    playerOwnerIdNum: 0,
    researchedTechs: new Set(),
    ownUnitHexKeys: new Set(), // brak jednostki tam
  });
  assert(!qualNoUnit('fort', farHex.q, farHex.r), 'B1a: BEZ wlasnej jednostki na hexie -- fort NIE kwalifikuje sie poza terytorium');
  assert(!qualNoUnit('posterunek', farHex.q, farHex.r), 'B1b: to samo dla posterunka');

  const qualWithUnit = buildImprovementQualifier({
    map,
    cityNodes: [ownCity],
    territoryNodes: [{ ...ownCity, ownerId: 0 }],
    playerOwnerIdNum: 0,
    researchedTechs: new Set(),
    ownUnitHexKeys: new Set([`${farHex.q},${farHex.r}`]), // jednostka STOI tam
  });
  assert(qualWithUnit('fort', farHex.q, farHex.r), 'B1c: Z wlasna jednostka na hexie -- fort kwalifikuje sie poza terytorium');
  assert(qualWithUnit('posterunek', farHex.q, farHex.r), 'B1d: to samo dla posterunka');
}

console.log('\n--- B2: fort/posterunek na terenie CUDZEGO miasta -- zawsze zablokowane (regula 1) ---');
{
  const map = mkMapAround([[0, 0], [3, 0]]);
  const rivalCityHex = { q: 3, r: 0 }; // w promieniu 5 cudzego miasta (owner=99)
  const qual = buildImprovementQualifier({
    map,
    cityNodes: [],
    territoryNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 99 }],
    playerOwnerIdNum: 0,
    researchedTechs: new Set(),
    ownUnitHexKeys: new Set([`${rivalCityHex.q},${rivalCityHex.r}`]), // jednostka tam stoi -- i tak zablokowane
  });
  assert(!qual('fort', rivalCityHex.q, rivalCityHex.r), 'B2a: fort na terenie cudzego miasta zablokowany MIMO wlasnej jednostki');
  assert(!qual('posterunek', rivalCityHex.q, rivalCityHex.r), 'B2b: to samo dla posterunka');
}

console.log('\n--- B3: fort/posterunek WEWNATRZ wlasnego terytorium -- BEZ wymogu jednostki (regresja auto-ulepszen) ---');
{
  const ownCity = { q: 0, r: 0, pop: 10, level: 1 }; // radius 10
  const insideHex = { q: 3, r: 0 }; // w promieniu wlasnego miasta
  const map = mkMapAround([[0, 0], [3, 0]]);
  const qual = buildImprovementQualifier({
    map,
    cityNodes: [ownCity],
    territoryNodes: [{ ...ownCity, ownerId: 0 }],
    playerOwnerIdNum: 0,
    researchedTechs: new Set(),
    ownUnitHexKeys: new Set(), // BRAK jednostki -- musi mimo to przejsc
  });
  assert(qual('fort', insideHex.q, insideHex.r), 'B3a: fort WEWNATRZ wlasnego terytorium kwalifikuje sie BEZ jednostki (zachowanie sprzed kroku 2)');
  assert(qual('posterunek', insideHex.q, insideHex.r), 'B3b: to samo dla posterunka');
}

console.log('\n--- B4: fort/posterunek na terenie NIECZYIM (poza kazdym terytorium), z jednostka -- kwalifikuje ---');
{
  const map = mkMapAround([[20, 20]]);
  const qual = buildImprovementQualifier({
    map,
    cityNodes: [],
    territoryNodes: [],
    playerOwnerIdNum: 0,
    researchedTechs: new Set(),
    ownUnitHexKeys: new Set(['20,20']),
  });
  assert(qual('fort', 20, 20), 'B4: teren niczyj + wlasna jednostka -- fort kwalifikuje sie (regula 1)');
}

// ============================================================================
// SEKCJA C — game/ai.ts: planCityFounding z fortNodes (parytet AI)
// ============================================================================

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}
function makeCity(id, ownerId, q, r, pop) { return { id, ownerId, q, r, population: pop, name: id }; }
function makeGameData(aiParamsOverride = {}) {
  return {
    units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
    buildings: [],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
    aiParams: aiParamsOverride,
  };
}
const baseOpts = { currentTurn: 20, pracaAvailable: 200 };

console.log('\n--- C1: planCityFounding BEZ fortNodes (domyslne []) -- zachowanie IDENTYCZNE jak krok 1 (regresja) ---');
{
  const map = makeMap(40, 40);
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 20, 20, srcPop);
  const radius = cityTerritoryRadius({ q: 20, r: 20, pop: srcPop, level: 1 });
  const farQ = 20, farR = 20 + radius + 10;
  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
  });
  // Wywolanie DOKLADNIE jak w tescie kroku 1 -- bez 9. argumentu (fortNodes).
  const cmd = planCityFounding(1, [city], map, data, baseOpts, MIN_CITY_DISTANCE);
  assert(cmd !== null && cmd.type === 'foundCityAt', 'C1a: founding zwraca komende');
  if (cmd) {
    const dist = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(dist <= radius, `C1b: hex nadal w promieniu WYLACZNIE wlasnego miasta (dist=${dist} <= ${radius})`);
  }
}

console.log('\n--- C2: planCityFounding Z wlasnym fortem AI -- rozszerza zasieg zakladania (parytet z graczem) ---');
{
  const map = makeMap(60, 60);
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 30, 30, srcPop);
  const cityRadius = cityTerritoryRadius({ q: 30, r: 30, pop: srcPop, level: 1 });
  // Fort AI daleko poza zasiegiem miasta -- otwiera nowy klaster zakladania.
  const fortQ = 30, fortR = 30 + cityRadius + 8;
  const fortRadius = 10; // fort=10
  assert(hexDistance(fortQ, fortR, city.q, city.r) > cityRadius,
    'C2-sanity: fort faktycznie POZA zasiegiem samego miasta');

  // Hex kwalifikujacy DOKLADNIE w zasiegu fortu, ale POZA zasiegiem miasta.
  const targetQ = fortQ, targetR = fortR + fortRadius - 1;
  assert(hexDistance(targetQ, targetR, city.q, city.r) > cityRadius,
    'C2-sanity2: cel POZA zasiegiem miasta');
  assert(hexDistance(targetQ, targetR, fortQ, fortR) <= fortRadius,
    'C2-sanity3: cel W zasiegu fortu');

  map.hexes[`${targetQ},${targetR}`].rzeka.obecna = true; // przynęta (najwyzszy score)

  const fortNodes = [{ q: fortQ, r: fortR, ownerId: 1, type: 'fort' }];
  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
    ekspansja_heurystyka_rzeka_pkt: { wartosc: 50, sekcja: 'test', opis: '' },
  });
  const cmd = planCityFounding(
    1, [city], map, data, baseOpts, MIN_CITY_DISTANCE, [], [], fortNodes,
  );
  assert(cmd !== null, 'C2a: founding zwraca komende (fort otworzyl nowy legalny hex)');
  if (cmd) {
    const distToFort = hexDistance(cmd.q, cmd.r, fortQ, fortR);
    const distToCity = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(distToFort <= fortRadius, `C2b: wybrany hex w zasiegu fortu (dist=${distToFort} <= ${fortRadius})`);
    assert(distToCity > cityRadius, `C2c: wybrany hex byl POZA zasiegiem samego miasta (dist=${distToCity} > ${cityRadius}) -- fort realnie rozszerzyl zasieg`);
  }
}

console.log('\n--- C3: planCityFounding -- CUDZY (kontestowany) fort AI NIE liczy sie do zasiegu ---');
{
  const map = makeMap(60, 60);
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP;
  const city = makeCity('c1', 1, 30, 30, srcPop);
  const cityRadius = cityTerritoryRadius({ q: 30, r: 30, pop: srcPop, level: 1 });
  const fortQ = 30, fortR = 30 + cityRadius + 8;
  // Fort NALEZY DO INNEGO wlasciciela (2) -- nie powinien rozszerzac zasiegu gracza AI=1.
  const fortNodesRival = [{ q: fortQ, r: fortR, ownerId: 2, type: 'fort' }];
  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: MIN_CITY_DISTANCE, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
  });
  // Bez bajty -- teren jednolity 'laka' identyczny jak w C1, ktory na tym samym
  // gridzie/MIN_CITY_DISTANCE/progu wyniku GWARANTUJE cmd !== null (patrz C1a).
  // Zamiast tolerowac "brak hexu" jako rownie akceptowalny wynik (co maskowaloby
  // regresje: gdyby cudzy/skontestowany fort ZACZAL bezprawnie rozszerzac zasieg,
  // test dalej przechodzilby przez galaz "brak legalnego hexu"), wymagamy
  // twardo cmd !== null i tylko wtedy weryfikujemy promien -- realnie
  // rozrozniajaca asercja zamiast samo-zaliczajacej sie galezi.
  // / EN: no bait needed -- uniform 'laka' terrain, identical to C1, GUARANTEES
  // cmd !== null on this same grid/MIN_CITY_DISTANCE/score threshold (see C1a).
  // Instead of tolerating "no hex found" as an equally acceptable outcome
  // (which would mask a regression: if a rival/contested fort started
  // illegally extending reach, the test would still pass via the "no hex"
  // branch), hard-require cmd !== null and only then check the radius -- a
  // genuinely discriminating assertion instead of a self-passing branch.
  const cmd = planCityFounding(
    1, [city], map, data, baseOpts, MIN_CITY_DISTANCE, [], [], fortNodesRival,
  );
  assert(cmd !== null, 'C3-sanity: founding zwraca komende (identyczny grid jak C1, ktory tez zawsze zwraca)');
  if (cmd) {
    const dist = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(dist <= cityRadius, `C3: cudzy fort NIE rozszerza zasiegu -- wybrany hex nadal w promieniu WLASNEGO miasta (dist=${dist} <= ${cityRadius})`);
  }

  // Wlasny, ale SKONTESTOWANY fort (contestedUseless) rowniez nie powinien liczyc sie.
  const fortNodesContested = [{ q: fortQ, r: fortR, ownerId: 1, type: 'fort', contestedUseless: true }];
  const cmd2 = planCityFounding(
    1, [city], map, data, baseOpts, MIN_CITY_DISTANCE, [], [], fortNodesContested,
  );
  assert(cmd2 !== null, 'C3b-sanity: founding zwraca komende (identyczny grid jak C1)');
  if (cmd2) {
    const dist2 = hexDistance(cmd2.q, cmd2.r, city.q, city.r);
    assert(dist2 <= cityRadius, `C3b: wlasny SKONTESTOWANY fort NIE rozszerza zasiegu (dist=${dist2} <= ${cityRadius})`);
  }
}

console.log('\n--- C4: planExpansionFortBuilding (F3) -- heks z JUZ postawionym fortem/posterunkiem odrzucony, ale AI probuje KOLEJNA jednostke ---');
{
  const map = makeMap(60, 60);
  const city = makeCity('c1', 5, 0, 0, 10); // radius 10 (pop>=10)
  const occupiedHexKey = '40,40'; // daleko poza zasiegiem miasta, juz ma posterunek
  const cleanHexKey = '45,45';    // rowniez daleko, czysty
  const unitOnOccupied = { id: 'u1', ownerId: 5, q: 40, r: 40, inGarnizon: false };
  const unitOnClean = { id: 'u2', ownerId: 5, q: 45, r: 45, inGarnizon: false };
  const opts = {
    ...baseOpts,
    pracaAvailable: 1000,
    improvementTechs: new Set(['Obróbka drewna', 'Murarstwo']),
    placedImprovements: new Map([[occupiedHexKey, 'posterunek']]),
  };
  const cmd = planExpansionFortBuilding(5, [city], [unitOnOccupied, unitOnClean], map, opts);
  assert(cmd !== null, 'C4a: AI wciaz znajduje komende (kolejna jednostka), mimo ze pierwsza odrzucona');
  if (cmd) {
    eq(cmd.q, 45, 'C4b: wybrany hex to CZYSTY hex drugiej jednostki (q)');
    eq(cmd.r, 45, 'C4c: wybrany hex to CZYSTY hex drugiej jednostki (r)');
    assert(!(cmd.q === 40 && cmd.r === 40), 'C4d: odrzucony hex (juz ma posterunek) NIE zostal wybrany');
  }

  // Kontrola: gdy WSZYSTKIE kandydackie hexy juz maja fort/posterunek -- null, nie awaria.
  const optsAllOccupied = {
    ...opts,
    placedImprovements: new Map([[occupiedHexKey, 'posterunek'], [cleanHexKey, ['fort']]]),
  };
  const cmdNone = planExpansionFortBuilding(5, [city], [unitOnOccupied, unitOnClean], map, optsAllOccupied);
  eq(cmdNone, null, 'C4e: wszystkie kandydackie hexy juz zajete -- brak komendy (nie crash, nie odrzucona-ale-wyslana)');
}

console.log('\n--- C5: planExpansionFortBuilding (F4) -- Miasto-Panstwo (opts.defensiveCopy) NIE buduje fortow ekspansyjnych ---');
{
  const map = makeMap(60, 60);
  const city = makeCity('c1', 7, 0, 0, 10); // radius 10
  const unit = { id: 'u1', ownerId: 7, q: 40, r: 40, inGarnizon: false }; // poza zasiegiem, teren czysty
  const baseTestOpts = {
    ...baseOpts,
    pracaAvailable: 1000,
    improvementTechs: new Set(['Obróbka drewna', 'Murarstwo']),
  };

  // Kontrola pozytywna: DOKLADNIE ta sama sytuacja BEZ defensiveCopy -- MUSI zwrocic
  // komende (dowod, ze setup faktycznie wyzwala budowe, gdyby bramka F4 zniknela --
  // asercja C5b nizej realnie by lapala regresje, a nie przechodzila przez przypadek).
  const cmdNormal = planExpansionFortBuilding(7, [city], [unit], map, baseTestOpts);
  assert(cmdNormal !== null, 'C5a-sanity: BEZ defensiveCopy AI normalnie buduje fort ekspansyjny w tym samym setupie');

  // Wlasciwy przypadek: Miasto-Panstwo (opts.defensiveCopy=true) -- MUSI byc null.
  const cmdCityState = planExpansionFortBuilding(7, [city], [unit], map, { ...baseTestOpts, defensiveCopy: true });
  eq(cmdCityState, null, 'C5b: opts.defensiveCopy=true -> planExpansionFortBuilding zwraca null (parytet z planCityFounding)');
}

// ============================================================================
// SEKCJA D — main.ts strażniki tekstowe (F2b: checkBarbCampDestroyedAt).
// applyFortTakeoverAndEvacuation zyje w domknieciu main.ts (dostep do `units`,
// `map`, `cities`, `syncUnitsRender` calej gry) -- NIE da sie jej wyeksportowac
// do izolowanego bundla jak reszty tego testu bez odtwarzania calego silnika.
// Sekcje A/A5b powyzej pokrywaja jednostkowo prawdziwa logike decyzyjna
// (findEvacuationHexOutsideCity + canUnitOccupyCityHex, F2a) na PRAWDZIWYCH,
// eksportowanych funkcjach -- ten straznik domyka WYLACZNIE F2b (wywolanie
// checkBarbCampDestroyedAt), ktorego nie da sie odizolowac tak samo.
// / EN: applyFortTakeoverAndEvacuation lives inside main.ts's closure (access
// to `units`, `map`, `cities`, `syncUnitsRender` of the whole game) -- cannot
// be exported into an isolated bundle like the rest of this test without
// recreating the whole engine. Sections A/A5b above unit-test the real
// decision logic (findEvacuationHexOutsideCity + canUnitOccupyCityHex, F2a) on
// REAL, exported functions -- this guard closes ONLY the F2b gap (the
// checkBarbCampDestroyedAt call), which cannot be isolated the same way.
// ============================================================================
console.log('\n--- D1: main.ts applyFortTakeoverAndEvacuation (F2) -- straznik tekstowy dla obu zabezpieczen ---');
{
  const mainTsSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const fnStart = mainTsSrc.indexOf('function applyFortTakeoverAndEvacuation(');
  assert(fnStart !== -1, 'D1-sanity: applyFortTakeoverAndEvacuation nadal istnieje w main.ts');
  // Koniec funkcji: nastepna deklaracja `function ` na poziomie wciecia funkcji
  // (heurystyka wystarczajaca -- funkcje w tym pliku nie sa zagniezdzone w
  // funkcjach lokalnych na tym poziomie).
  const nextFnRel = mainTsSrc.indexOf('\n    function ', fnStart + 40);
  const fnBody = fnStart !== -1
    ? mainTsSrc.slice(fnStart, nextFnRel !== -1 ? nextFnRel : fnStart + 4000)
    : '';
  assert(fnBody.includes('canUnitOccupyCityHex('), 'D1a (F2, zabezpieczenie a): applyFortTakeoverAndEvacuation woła canUnitOccupyCityHex (blokada ladowania na hexie CUDZEGO miasta)');
  assert(fnBody.includes('checkBarbCampDestroyedAt('), 'D1b (F2, zabezpieczenie b): applyFortTakeoverAndEvacuation woła checkBarbCampDestroyedAt (rozliczenie wejscia na oboz barbarzynski)');
  assert(fnBody.includes('isBarbarian('), 'D1c: wywolanie checkBarbCampDestroyedAt jest bramkowane !isBarbarian(u.ownerId), tak jak we wzorcu evictForeignUnitsFromCityHexes');
}

// ============================================================================
// D2/D3 (runda 3, werdykt Evaluatora rundy 2 -- FAIL): dyspozycja rundy 2 mowila
// "strazniki tekstowe main.ts dla 3 newralgicznych miejsc", wykonano 1/3 (D1
// wyzej, F2). BRAKOWALO 2: (a) main.ts:8578 (wowczas), wewnatrz
// foundingTerritoryOpts -- literalne wywolanie foundingNodesForOwner(ownerId,
// nodes, fortNodes) (F1, "fort rozszerza zasieg zakladania"); (b) main.ts:10487
// (wowczas), literalne uzycie isHexReservedByRivalFort (F3, "kontestacja cudzym
// fortem w chwili budowy"). Luka byla krytyczna: mutacja rundy 1
// (main.ts:8578 -> `const extendedNodes = nodes;`, czyli wylaczenie realnego
// rozszerzenia zasiegu przez forty na poziomie wpiecia) przechodzila WSZYSTKIE
// 67 ondczesnych asercji tego pliku bez ani jednej czerwonej -- Sekcje A-C
// wyzej testuja jednostkowo PRAWDZIWA logike (foundingNodesForOwner,
// isHexReservedByRivalFort jako czyste, eksportowane funkcje z game/*.ts) i
// planCityFounding AI na wyizolowanym gridzie, ale ZADNA z nich nie sprawdza,
// czy main.ts faktycznie WOLA te funkcje we wpieciu produkcyjnym -- dokladnie
// ta sama klasa luki, ktora D1 juz domyka dla F2.
// / EN: round-2 dispatch said "text guards in main.ts for 3 critical spots",
// only 1/3 was done (D1 above, F2). Missing 2: (a) main.ts:8578 (at the time),
// inside foundingTerritoryOpts -- literal call to foundingNodesForOwner(ownerId,
// nodes, fortNodes) (F1, "fort extends founding range"); (b) main.ts:10487 (at
// the time), literal use of isHexReservedByRivalFort (F3, "contestation by a
// rival fort at build time"). The gap was critical: the round-1 mutation
// (main.ts:8578 -> `const extendedNodes = nodes;`, i.e. disabling the real
// range extension by forts at the wiring level) passed ALL 67 assertions of
// this file at the time without a single red one -- Sections A-C above unit-
// test the REAL logic (foundingNodesForOwner, isHexReservedByRivalFort as
// pure, exported functions from game/*.ts) and AI's planCityFounding on an
// isolated grid, but NONE of them checks whether main.ts actually CALLS these
// functions in the production wiring -- the exact same class of gap D1
// already closes for F2.
// ============================================================================
console.log('\n--- D2: main.ts foundingTerritoryOpts (F1) -- straznik tekstowy dla wpiecia realnego rozszerzenia zasiegu przez forty ---');
{
  const mainTsSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const fnMarker = 'function foundingTerritoryOpts(ownerId: number)';
  const fnStart = mainTsSrc.indexOf(fnMarker);
  assert(fnStart !== -1, 'D2-sanity: foundingTerritoryOpts nadal istnieje w main.ts');
  const nextFnRel = fnStart !== -1 ? mainTsSrc.indexOf('\n    function ', fnStart + fnMarker.length) : -1;
  const fnBody = fnStart !== -1
    ? mainTsSrc.slice(fnStart, nextFnRel !== -1 ? nextFnRel : fnStart + 1200)
    : '';

  // Pozytyw: musi istniec realne przypisanie extendedNodes z foundingNodesForOwner,
  // z fortNodes jako argumentem (nie tylko wywolanie gdziekolwiek w pliku -- MUSI
  // byc to WEWNATRZ ciala foundingTerritoryOpts, zeby faktycznie zasilac
  // withinTerritory zwracane z tej funkcji).
  const guardedAssignRe = /const\s+extendedNodes\s*=\s*foundingNodesForOwner\([^;]*fortNodes[^;]*\)\s*;/;
  assert(guardedAssignRe.test(fnBody),
    'D2a (F1): foundingTerritoryOpts musi przypisywac extendedNodes = foundingNodesForOwner(ownerId, nodes, fortNodes) -- realne rozszerzenie zasiegu zakladania przez wlasne, nie-skontestowane forty/posterunki');

  // Negatyw celowany: dokladnie mutacja rundy 1 (Evaluator rundy 2, FAIL) --
  // gole przypisanie extendedNodes = nodes (bez przejscia przez
  // foundingNodesForOwner) wylacza fort na poziomie wpiecia, a mimo to
  // withinTerritory nadal dziala (dla nodes bez rozszerzenia) -- stad brak
  // jakiejkolwiek czerwonej asercji gdziekolwiek indziej w tym pliku.
  const bareAssignRe = /const\s+extendedNodes\s*=\s*nodes\s*;/;
  assert(!bareAssignRe.test(fnBody),
    'D2b (F1): foundingTerritoryOpts NIE MOZE zawierac golego `const extendedNodes = nodes;` (dokladnie mutacja rundy 1 -- wylacza realne rozszerzenie zasiegu przez forty, mimo poprawnej logiki w game/fort-territory.ts)');
}

console.log('\n--- D3: main.ts registerFortNodeIfNeeded (F3) -- straznik tekstowy dla kontestacji cudzym fortem w chwili budowy ---');
{
  const mainTsSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const fnMarker = 'function registerFortNodeIfNeeded(';
  const fnStart = mainTsSrc.indexOf(fnMarker);
  assert(fnStart !== -1, 'D3-sanity: registerFortNodeIfNeeded nadal istnieje w main.ts');
  const nextFnRel = fnStart !== -1 ? mainTsSrc.indexOf('\n    function ', fnStart + fnMarker.length) : -1;
  const fnBody = fnStart !== -1
    ? mainTsSrc.slice(fnStart, nextFnRel !== -1 ? nextFnRel : fnStart + 1200)
    : '';

  // Pozytyw: contestedUseless musi pochodzic z realnego wywolania
  // isHexReservedByRivalFort(q, r, ownerId, fortNodes) -- ustalane RAZ, w chwili
  // budowy (komentarz "Regula 1/3" w main.ts), nie np. na sztywno `false`.
  const guardedCallRe = /isHexReservedByRivalFort\(\s*q\s*,\s*r\s*,\s*ownerId\s*,\s*fortNodes\s*\)/;
  assert(guardedCallRe.test(fnBody),
    'D3a (F3): registerFortNodeIfNeeded musi wolac isHexReservedByRivalFort(q, r, ownerId, fortNodes) do ustalenia contestedUseless w chwili budowy (fort fizycznie stoi, ale kontestowany nie liczy sie do WLASNEGO zasiegu zakladania)');

  // Negatyw celowany: gole `false` zamiast realnego wywolania dawaloby zawsze
  // "nie skontestowany", niezaleznie od stanu rywalizujacych fortow na mapie.
  const bareFalseRe = /const\s+contestedUseless\s*=\s*false\s*;/;
  assert(!bareFalseRe.test(fnBody),
    'D3b (F3): registerFortNodeIfNeeded NIE MOZE zawierac golego `const contestedUseless = false;` (wylaczaloby kontestacje cudzym fortem)');
}

try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* noop */ }

console.log(`\n=== fort-strazniaca-zasieg-zakladania-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
