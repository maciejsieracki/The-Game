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
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { planCityFounding } from ${JSON.stringify(SRC + '/game/ai')};
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
  TerenBazowy,
  Nakladka,
  planCityFounding,
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
  const cmd = planCityFounding(
    1, [city], map, data, baseOpts, MIN_CITY_DISTANCE, [], [], fortNodesRival,
  );
  if (cmd) {
    const dist = hexDistance(cmd.q, cmd.r, city.q, city.r);
    assert(dist <= cityRadius, `C3: cudzy fort NIE rozszerza zasiegu -- wybrany hex nadal w promieniu WLASNEGO miasta (dist=${dist} <= ${cityRadius})`);
  } else {
    assert(true, 'C3: (brak legalnego hexu w ogole tez akceptowalne -- cudzy fort na pewno nie zostal uzyty)');
  }

  // Wlasny, ale SKONTESTOWANY fort (contestedUseless) rowniez nie powinien liczyc sie.
  const fortNodesContested = [{ q: fortQ, r: fortR, ownerId: 1, type: 'fort', contestedUseless: true }];
  const cmd2 = planCityFounding(
    1, [city], map, data, baseOpts, MIN_CITY_DISTANCE, [], [], fortNodesContested,
  );
  if (cmd2) {
    const dist2 = hexDistance(cmd2.q, cmd2.r, city.q, city.r);
    assert(dist2 <= cityRadius, `C3b: wlasny SKONTESTOWANY fort NIE rozszerza zasiegu (dist=${dist2} <= ${cityRadius})`);
  } else {
    assert(true, 'C3b: (brak legalnego hexu tez akceptowalne)');
  }
}

try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* noop */ }

console.log(`\n=== fort-strazniaca-zasieg-zakladania-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
