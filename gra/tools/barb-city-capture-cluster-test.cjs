'use strict';
/**
 * barb-city-capture-cluster-test.cjs -- standalone Node test for the SKOORDYNOWANY BATCH
 * tematów 7-10 (P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B, P-BARBARZYNCY-ELIMINACJA-
 * CYWILIZACJI-Q1=A, P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B,
 * P-BARBARZYNCY-ONSPLIT-KOSZT-RUCHU-Q1=B), rozdispatchowanych razem bo dotykają tych
 * samych plików (gra/src/game/barbarians.ts, gra/src/main.ts) w obszarze przejęcia
 * miast/pościgu.
 * Run from gra/:  node tools/barb-city-capture-cluster-test.cjs
 *
 * main.ts NIE jest bundlowany tu (monolityczny plik z zależnościami DOM/THREE -- ten
 * sam ograniczenie co barb-camp-destruction-test.cjs / barb-city-behavior-test.cjs).
 * Zmiany w main.ts (bramka `move` dla tematu 7, wpięcie tickBarbarianCityGarrisons dla
 * tematu 8, koszt ruchu onSplit dla tematu 10) są więc dowodzone DWIEMA warstwami:
 *   (i)  REALNE WYKONANIE bundla barbarians.ts/siegeDefenders.ts/units/setup.ts/
 *        armyMerge.ts -- odtwarza DOKŁADNIE tę samą formułę/te same funkcje, które
 *        main.ts woła, i dowodzi że formuła daje poprawny wynik;
 *   (ii) statyczna weryfikacja źródła main.ts (marker + okno znaków, ten sam wzorzec
 *        CALL_SITES co barb-camp-destruction-test.cjs) -- dowodzi że main.ts FAKTYCZNIE
 *        woła tę formułę w odpowiednim miejscu, a nie tylko że formuła sama w sobie
 *        działa. Usunięcie/cofnięcie okablowania w main.ts psuje (ii) nawet gdyby (i)
 *        dalej przechodziło -- to jest dowód mutacyjny dla warstwy main.ts.
 * Tematy 8 i 9 mają DODATKOWO pełny dowód mutacyjny przez REALNE WYKONANIE (nie tylko
 * source-text), bo ich logika żyje całkowicie w barbarians.ts (bundlowalne).
 *
 * Sekcje:
 *   1. TEMAT 7 -- puste miasto + hard -> przejęcie; easy/normal -> BRAK (regresja-guard).
 *   2. TEMAT 8 -- tickBarbarianCityGarrisons: miasto barbarzyńskie produkuje WYŁĄCZNIE
 *      jednostki (nigdy budynki -- przez konstrukcję typu zwrotnego, nie filtr).
 *   3. TEMAT 9 -- limit tur pościgu osieroconej jednostki: przed limitem nieograniczony,
 *      po limicie wraca do aggroRadius (nie 0).
 *   4. TEMAT 10 -- koszt ruchu onSplit-na-obóz === koszt ruchu normalny-ruch-na-obóz.
 */

const fs   = require('fs');
const path = require('path');

function hexDist(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

// --- esbuild -----------------------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[barb-city-capture-cluster-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.barb-city-capture-cluster-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.barb-city-capture-cluster-bundle.cjs');

const ENTRY_TS = `
export {
  BARBARIAN_OWNER_ID, isBarbarian, FALLBACK_BARB_PARAMS, decideBarbarianMoves,
  shouldAllowBarbCityCapture, tickBarbarianCityGarrisons,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/barbarians'))};
export {
  canCaptureCityWithoutBattle, hasCityDefenders,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/siegeDefenders'))};
export {
  computePath, pathCost, terrainMoveCost, configureTerrainMovement,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/units/setup'))};
export {
  deductStackRuchLeft, stackRuchLeft,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/armyMerge'))};
export {
  serializeGame, deserializeGame,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/save'))};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[barb-city-capture-cluster-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const {
  BARBARIAN_OWNER_ID, isBarbarian, FALLBACK_BARB_PARAMS, decideBarbarianMoves,
  shouldAllowBarbCityCapture, tickBarbarianCityGarrisons,
  canCaptureCityWithoutBattle, hasCityDefenders,
  computePath, pathCost, terrainMoveCost, configureTerrainMovement,
  deductStackRuchLeft, stackRuchLeft,
  serializeGame, deserializeGame,
} = B;

// --- tiny assertion framework --------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- fixtures --------------------------------------------------------------------------------
function makeMap(w, h, terrainOf) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: terrainOf ? terrainOf(q, r) : 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
function barb(id, q, r, extra = {}) {
  return Object.assign({
    id, ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2,
  }, extra);
}
function playerUnit(id, q, r, extra = {}) {
  return Object.assign({
    id, ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2,
  }, extra);
}
function city(id, q, r, ownerId, extra = {}) {
  return Object.assign({ id, name: id, q, r, ownerId, population: 3, garnizon: 0 }, extra);
}

const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');
const citiesTsPath = path.join(GRA_ROOT, 'src/game/cities.ts');
const citiesTs = fs.readFileSync(citiesTsPath, 'utf8');

// ============================================================================================
// SEKCJA 1 -- TEMAT 7 (P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B)
// (a) puste miasto + hard -> przejęcie działa
// (b) puste miasto + easy/normal -> BRAK przejęcia (regresja-guard)
// ============================================================================================
{
  // 1a. shouldAllowBarbCityCapture -- suwak trudności (redundantne z innymi plikami, ale
  // ten plik ma być samowystarczalny dla całego batcha per zlecenie).
  eq(shouldAllowBarbCityCapture('hard'), true, '1a: hard -> capture dozwolony');
  eq(shouldAllowBarbCityCapture('normal'), false, '1a: normal -> capture NIEdozwolony');
  eq(shouldAllowBarbCityCapture('easy'), false, '1a: easy -> capture NIEdozwolony');

  // 1b. canCaptureCityWithoutBattle -- czyste zachowanie (siegeDefenders.ts), podstawa
  // formuły `barbCanWalkIntoEmptyCity` w main.ts.
  const emptyCity = city('c1', 5, 5, 0);
  eq(canCaptureCityWithoutBattle(emptyCity, []), true,
    '1b: miasto bez garnizonu i bez jednostek w promieniu 1 -> możliwe przejęcie bez bitwy');
  const garrisonedCity = city('c2', 5, 5, 0, { garnizon: 3 });
  eq(canCaptureCityWithoutBattle(garrisonedCity, []), false,
    '1b: garnizon>0 -> NIE można przejąć bez bitwy');
  const defendedCity = city('c3', 5, 5, 0);
  const defender = playerUnit('def1', 5, 5, {});
  eq(canCaptureCityWithoutBattle(defendedCity, [defender]), false,
    '1b: jednostka obrońcy na heksie miasta -> NIE można przejąć bez bitwy');

  // 1c. Formuła DOKŁADNIE odtwarzająca `barbCanWalkIntoEmptyCity` z main.ts (bcmd.type
  // ==='move' handler) -- (destCity!==undefined) && shouldAllowBarbCityCapture(difficulty)
  // && canCaptureCityWithoutBattle(destCity, units). Testuje SAMĄ FORMUŁĘ wykonaniem
  // realnych funkcji -- warstwa main.ts (czy main.ts faktycznie tej formuły używa) jest
  // sprawdzona osobno w 1d/1e/1f (static).
  function barbCanWalkIntoEmptyCity(destCity, difficulty, units) {
    return destCity !== undefined
      && shouldAllowBarbCityCapture(difficulty)
      && canCaptureCityWithoutBattle(destCity, units);
  }
  eq(barbCanWalkIntoEmptyCity(emptyCity, 'hard', []), true,
    '1c: hard + miasto puste -> formuła zwraca true (przejęcie dozwolone)');
  eq(barbCanWalkIntoEmptyCity(emptyCity, 'normal', []), false,
    '1c (regresja-guard): normal + miasto puste -> formuła zwraca false (BEZ zmian vs dziś)');
  eq(barbCanWalkIntoEmptyCity(emptyCity, 'easy', []), false,
    '1c (regresja-guard): easy + miasto puste -> formuła zwraca false (BEZ zmian vs dziś)');
  eq(barbCanWalkIntoEmptyCity(garrisonedCity, 'hard', []), false,
    '1c: hard ALE miasto BRONIONE (garnizon) -> formuła zwraca false (walka nadal przez attack)');
  eq(barbCanWalkIntoEmptyCity(undefined, 'hard', []), false,
    '1c: brak miasta na heksie docelowym -> formuła zwraca false (zwykły ruch, bez zmian)');

  // 1d. STATIC: main.ts move-branch faktycznie zawiera tę formułę (nie tylko izolowana
  // funkcja w tym pliku testowym) -- marker unikalny + wymagane podciągi w rozsądnym oknie.
  const marker1d = 'P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1';
  const idx1d = mainTs.indexOf(marker1d);
  assert(idx1d !== -1, '1d: main.ts zawiera marker P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1');
  const window1d = mainTs.slice(idx1d, idx1d + 4000);
  assert(window1d.includes('barbCanWalkIntoEmptyCity'),
    '1d: okno wokół markera zawiera zmienną barbCanWalkIntoEmptyCity');
  assert(window1d.includes('canCaptureCityWithoutBattle(moveDestCity, units)'),
    '1d: okno zawiera wywołanie canCaptureCityWithoutBattle(moveDestCity, units)');
  assert(window1d.includes('shouldAllowBarbCityCapture(_menuDifficulty)'),
    '1d: okno zawiera wywołanie shouldAllowBarbCityCapture(_menuDifficulty)');
  assert(window1d.includes("tryAutoCaptureEmptyCityAt(bcmd.toQ, bcmd.toR, [bu])"),
    '1d: okno zawiera wywołanie tryAutoCaptureEmptyCityAt(bcmd.toQ, bcmd.toR, [bu]) -- '
    + 'FAKTYCZNE przejęcie, nie tylko sprawdzenie formuły');

  // 1e. STATIC mutation-guard: bramka canUnitOccupyCityHex, która blokuje easy/normal
  // (bo barbCanWalkIntoEmptyCity jest tam zawsze false), MUSI wciąż istnieć -- gdyby ktoś
  // usunął całą bramkę zamiast dodać wyjątek, easy/normal zaczęłoby przepuszczać ruch na
  // KAŻDE obce miasto (katastrofalna regresja bezpieczeństwa ruchu, nie tylko capture).
  assert(window1d.includes(
    '!barbCanWalkIntoEmptyCity\n                      && !canUnitOccupyCityHex(bu.ownerId, bcmd.toQ, bcmd.toR, cities)) continue;'),
    '1e (regresja-guard): bramka `!barbCanWalkIntoEmptyCity && !canUnitOccupyCityHex(...)) continue;` '
    + 'nadal obecna -- easy/normal (barbCanWalkIntoEmptyCity zawsze false) nadal blokuje wejście '
    + 'na KAŻDE obce miasto, dokładnie jak przed tą rundą');

  // 1f. STATIC: capture jest WARUNKOWE na barbCanWalkIntoEmptyCity (nie bezwarunkowe wołanie
  // po każdym ruchu -- to zepsułoby też przypadek "miasto barbarzyńców wchodzi na WŁASNE
  // miasto", choć tryAutoCaptureEmptyCityAt sam no-opuje ten przypadek jako druga linia obrony).
  assert(/if\s*\(\s*barbCanWalkIntoEmptyCity\s*\)\s*\{\s*[\s\S]{0,300}?tryAutoCaptureEmptyCityAt/.test(window1d),
    '1f: tryAutoCaptureEmptyCityAt wołane WEWNĄTRZ `if (barbCanWalkIntoEmptyCity)`, nie bezwarunkowo');
}

// ============================================================================================
// SEKCJA 2 -- TEMAT 8 (P-BARBARZYNCY-ELIMINACJA-CYWILIZACJI-Q1=A)
// (c) miasto barbarzyńskie produkuje wyłącznie jednostki, nigdy budynki (kilka tur symulacji)
// ============================================================================================
{
  const P = FALLBACK_BARB_PARAMS;

  // 2a. Miasto świeżo przejęte (brak pola barbGarrisonSpawnCooldown) -- gotowe do spawnu
  // NATYCHMIAST (ten sam konwent co nowy BarbCamp.spawnCooldown=0).
  {
    const map = makeMap(10, 10);
    const barbCity = city('bcity1', 5, 5, BARBARIAN_OWNER_ID);
    const res = tickBarbarianCityGarrisons([barbCity], [], [], map, P);
    eq(res.spawns.length, 1, '2a: miasto świeżo przejęte (bez pola cooldown) spawnuje NATYCHMIAST');
    eq(res.spawns[0].cityId, 'bcity1', '2a: spawn wskazuje na właściwe miasto (cityId)');
    eq(res.spawns[0].typeId, P.unitTypeId, '2a: spawn używa params.unitTypeId (Wojownik domyślnie)');
    assert(hexDist(res.spawns[0].q, res.spawns[0].r, 5, 5) === 1,
      '2a: spawn na heksie SĄSIEDNIM do miasta (nie na samym mieście)');
    eq(res.cooldowns.get('bcity1'), P.spawnInterval,
      '2a: po spawnie cooldown zresetowany do params.spawnInterval');
  }

  // 2b. Cooldown odlicza w dół, spawn dopiero gdy osiągnie 0.
  {
    const map = makeMap(10, 10);
    const barbCity = city('bcity2', 5, 5, BARBARIAN_OWNER_ID, { barbGarrisonSpawnCooldown: 3 });
    const res1 = tickBarbarianCityGarrisons([barbCity], [], [], map, P);
    eq(res1.spawns.length, 0, '2b/tura1: cooldown=3->2, brak spawnu');
    eq(res1.cooldowns.get('bcity2'), 2, '2b/tura1: cooldown zdekrementowany do 2');
    barbCity.barbGarrisonSpawnCooldown = res1.cooldowns.get('bcity2');
    const res2 = tickBarbarianCityGarrisons([barbCity], [], [], map, P);
    eq(res2.cooldowns.get('bcity2'), 1, '2b/tura2: cooldown zdekrementowany do 1');
    barbCity.barbGarrisonSpawnCooldown = res2.cooldowns.get('bcity2');
    const res3 = tickBarbarianCityGarrisons([barbCity], [], [], map, P);
    eq(res3.spawns.length, 1, '2b/tura3: cooldown osiągnął 0 -> spawn');
  }

  // 2c. Limit unitsPerCamp w promieniu campControlRadius -- przy limicie: BRAK spawnu,
  // cooldown trzymany na 0 (gotowy natychmiast po zwolnieniu slotu).
  {
    const map = makeMap(10, 10);
    const barbCity = city('bcity3', 5, 5, BARBARIAN_OWNER_ID);
    const nearbyBarbs = [];
    for (let i = 0; i < P.unitsPerCamp; i++) {
      nearbyBarbs.push(barb('near' + i, 5, 5 + (i % 2), {}));
    }
    const res = tickBarbarianCityGarrisons([barbCity], nearbyBarbs, nearbyBarbs, map, P);
    eq(res.spawns.length, 0, '2c: unitsPerCamp już osiągnięty w promieniu -> brak spawnu');
    eq(res.cooldowns.get('bcity3'), 0, '2c: cooldown trzymany na 0 (gotowy, gdy zwolni się slot)');
  }

  // 2d. Kilka tur symulacji (punkt zadania (c)): miasto barbarzyńskie produkuje WYŁĄCZNIE
  // jednostki -- struktura zwrotna (`BarbCityGarrisonSpawn`) nie ma ŻADNEGO pojęcia
  // budynku/kolejki Pracy (brak pola `kind`, brak odwołania do cityProd) -- "nigdy
  // budynki" jest spełnione PRZEZ KONSTRUKCJĘ typu, nie przez filtr. Symulacja 12 tur.
  {
    const map = makeMap(15, 15);
    const barbCity = city('bcity4', 7, 7, BARBARIAN_OWNER_ID);
    let barbUnits = [];
    let totalSpawns = 0;
    for (let t = 0; t < 12; t++) {
      const res = tickBarbarianCityGarrisons([barbCity], barbUnits, barbUnits, map, P);
      barbCity.barbGarrisonSpawnCooldown = res.cooldowns.get('bcity4');
      for (const sp of res.spawns) {
        totalSpawns++;
        // Strukturalny dowód "tylko jednostki": jedyne pola to cityId/q/r/typeId --
        // brak 'kind'/'kategoria budynku'/jakiegokolwiek pojęcia budynku w kształcie.
        const keys = Object.keys(sp).sort();
        eq(JSON.stringify(keys), JSON.stringify(['cityId', 'q', 'r', 'typeId']),
          `2d/tura${t}: spawn ma WYŁĄCZNIE pola {cityId,q,r,typeId} -- brak pojęcia budynku w kształcie`);
        barbUnits = barbUnits.concat([barb('u_' + t + '_' + totalSpawns, sp.q, sp.r, {})]);
      }
    }
    assert(totalSpawns >= 2,
      `2d: w 12 turach (spawnInterval=${P.spawnInterval}) miasto wyprodukowało >=2 jednostki (got ${totalSpawns})`);
  }

  // 2e. Czystość (PURE): tickBarbarianCityGarrisons nie mutuje wejściowych obiektów.
  {
    const map = makeMap(10, 10);
    const barbCity = city('bcity5', 3, 3, BARBARIAN_OWNER_ID, { barbGarrisonSpawnCooldown: 2 });
    const snapshotBefore = JSON.stringify(barbCity);
    tickBarbarianCityGarrisons([barbCity], [], [], map, P);
    eq(JSON.stringify(barbCity), snapshotBefore,
      '2e: tickBarbarianCityGarrisons NIE mutuje obiekt City przekazany jako input (PURE)');
  }

  // 2f. STATIC: main.ts faktycznie woła tickBarbarianCityGarrisons w ticku barbarzyńców,
  // aplikuje cooldowns do city.barbGarrisonSpawnCooldown, i w tym samym oknie NIE odwołuje
  // się do cityProd/enqueue (dowód, że mechanizm jest CELOWO odseparowany od kolejki Pracy).
  const marker2f = 'P-BARBARZYNCY-ELIMINACJA-CYWILIZACJI-Q1';
  const idx2f = mainTs.indexOf(marker2f);
  assert(idx2f !== -1, '2f: main.ts zawiera marker P-BARBARZYNCY-ELIMINACJA-CYWILIZACJI-Q1');
  const window2f = mainTs.slice(idx2f, idx2f + 3200);
  assert(window2f.includes('tickBarbarianCityGarrisons('),
    '2f: okno zawiera wywołanie tickBarbarianCityGarrisons(...)');
  assert(window2f.includes('gc.barbGarrisonSpawnCooldown = cd'),
    '2f: okno aplikuje cooldowns do city.barbGarrisonSpawnCooldown');
  // Sprawdzamy FUNKCJONALNE użycie (cityProd.get/.set/enqueue(...)), nie samo słowo
  // "cityProd" -- ten komentarz w main.ts SAM wspomina "cityProd" w prozie (wyjaśniając,
  // czego mechanizm CELOWO nie robi), więc naiwny .includes('cityProd') dawałby fałszywy
  // negatyw na WŁASNYM, poprawnym kodzie.
  assert(!window2f.includes('cityProd.get(') && !window2f.includes('cityProd.set(')
    && !window2f.includes('enqueue('),
    '2f: okno wpięcia NIE zawiera FUNKCJONALNEGO użycia cityProd.get/.set ani enqueue(...) -- '
    + 'mechanizm celowo odseparowany od kolejki Pracy/budynków (patrz komentarz przy '
    + 'City.barbGarrisonSpawnCooldown)');

  // 2g. STATIC: City interface (cities.ts) deklaruje pole barbGarrisonSpawnCooldown
  // (tsc --noEmit gate już to sprawdza na poziomie typów -- to jest lekki snapshot-lock
  // przeciwko przypadkowemu usunięciu pola z dokumentacją nietkniętą).
  assert(citiesTs.includes('barbGarrisonSpawnCooldown?: number;'),
    '2g: City interface (cities.ts) deklaruje barbGarrisonSpawnCooldown?: number');

  // 2h. STATIC (luka domknięta w TEJ rundzie): applyCityCaptureToMap czyści kolejkę
  // budowy (cityProd) przy przejęciu barbarzyńskim -- inaczej budynek W TOKU odziedziczony
  // po ofierze (front kolejki, np. "Świątynia" 60% ukończona) dokończyłby się pod
  // barbarzyńską flagą na kolejnych tickach ekonomii (advanceCityEconomy liczy Praca/
  // doBudynkow identycznie dla KAŻDEGO miasta, advanceProduction odejmuje ją od frontu
  // kolejki bez sprawdzania właściciela) -- bez tego resetu "nigdy budynki" (temat 8)
  // byłoby prawdziwe TYLKO dla nowej produkcji, nie dla odziedziczonej.
  const idxApplyCapture = mainTs.indexOf('function applyCityCaptureToMap(');
  assert(idxApplyCapture !== -1, '2h: main.ts definiuje applyCityCaptureToMap');
  const windowApplyCapture = mainTs.slice(idxApplyCapture, idxApplyCapture + 4000);
  assert(
    /if\s*\(\s*isBarbarian\(atkOwner\)\s*\)\s*\{\s*[\s\S]{0,200}?cityProd\.set\(city\.id,\s*\{\s*kolejka:\s*\[\],\s*postep:\s*0\s*\}\);/.test(windowApplyCapture),
    '2h: applyCityCaptureToMap czyści cityProd (kolejka:[], postep:0) WEWNĄTRZ '
    + '`if (isBarbarian(atkOwner))` -- kolejka budowy ofiary NIE przeżywa przejęcia '
    + 'barbarzyńskiego (zamyka lukę: budynek w toku dokończony pod barbarzyńcami)');
  // Regresja-guard: reset MUSI być warunkowy na isBarbarian -- bezwarunkowe czyszczenie
  // skasowałoby też legalną, w toku będącą budowę gracza/AI przy zwykłym podboju
  // (poza zakresem tego zlecenia -- właściciel nie prosił o zmianę zachowania dla
  // podbojów gracz<->AI, tylko o gwarancję "nigdy budynki" dla barbarzyńców).
  assert(
    !/cityProd\.set\(city\.id,\s*\{\s*kolejka:\s*\[\],\s*postep:\s*0\s*\}\);/.test(
      windowApplyCapture.replace(
        /if\s*\(\s*isBarbarian\(atkOwner\)\s*\)\s*\{\s*[\s\S]{0,200}?cityProd\.set\(city\.id,\s*\{\s*kolejka:\s*\[\],\s*postep:\s*0\s*\}\);\s*\}/,
        '',
      ),
    ),
    '2h (regresja-guard): PO usunięciu jedynego znanego wystąpienia wewnątrz '
    + '`if (isBarbarian(atkOwner))` nie zostaje żadne DRUGIE, bezwarunkowe wystąpienie '
    + 'cityProd.set(city.id, {kolejka:[],postep:0}) -- reset dotyczy WYŁĄCZNIE '
    + 'przejęcia barbarzyńskiego, nie każdego podboju');
}

// ============================================================================================
// SEKCJA 3 -- TEMAT 9 (P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B)
// (d) osierocona jednostka po przekroczeniu limitu wraca do aggroRadius, PRZED limitem
//     ma nieograniczony zasięg (dokładnie jak dziś)
// ============================================================================================
{
  const P = FALLBACK_BARB_PARAMS; // orphanedChaseTurnLimit = 10, aggroRadius = 6

  // 3a/3b. Symulacja: jednostka osierocona na turze T=100. Cel odległy o 20 heksów
  // (>> aggroRadius=6). PRZED limitem (tury 100..109): pościg NIEOGRANICZONY (cmd wydane,
  // krok W STRONĘ celu). PO limicie (tura 110 = 100+orphanedChaseTurnLimit): pościg
  // WYGASA -- target.d(20) > chaseRadius(aggroRadius=6) -> krok 3 pomija cel; krok 4
  // "drift do domu" też nic nie robi (camps=[] -> homeCampIdle=undefined) -> commands=[].
  // TO JEST DOWÓD MUTACYJNY: cofnięcie naprawy (orphaned zawsze -> chaseRadius=Infinity,
  // bez limitu) sprawiłoby, że asercja 3b (cmds.length===0) byłaby FAŁSZYWA -- jednostka
  // wciąż wydawałaby komendę pościgu na turze 110, dokładnie jak na turze 100.
  {
    const map = makeMap(25, 5);
    const orphan = barb('orphan-limit', 2, 2, { campId: 'destroyed-camp' });
    const farEnemy = playerUnit('far1', 22, 2, {});
    assert(hexDist(orphan.q, orphan.r, farEnemy.q, farEnemy.r) > P.aggroRadius,
      '3-setup: cel POZA aggroRadius (sanity check fixture)');

    for (let turnNum = 100; turnNum < 100 + P.orphanedChaseTurnLimit; turnNum++) {
      const cmds = decideBarbarianMoves(
        [orphan], [farEnemy], /* cities */ [], /* camps */ [], map, P, undefined, undefined, turnNum,
      );
      const cmd = cmds.find(c => c.unitId === 'orphan-limit');
      assert(cmd !== undefined && cmd.type === 'move',
        `3a/tura${turnNum}: PRZED limitem (${turnNum} < 100+${P.orphanedChaseTurnLimit}) jednostka `
        + 'nadal ściga cel odległy (chaseRadius=Infinity)');
      if (cmd) { orphan.q = cmd.toQ; orphan.r = cmd.toR; }
      orphan.ruchLeft = orphan.ruch; // reset ruchu na potrzeby symulacji kolejnej tury
    }
    eq(orphan.orphanedAtTurn, 100,
      '3a: orphanedAtTurn ustawione RAZ na turę pierwszego wykrycia (100), nie nadpisywane później');

    // Jednostka zdążyła się przybliżyć w 10 turach -- odśwież pozycję daleko od celu na
    // potrzeby czystej asercji wygaśnięcia (żeby target.d na pewno > aggroRadius).
    orphan.q = 2; orphan.r = 2; orphan.ruchLeft = orphan.ruch;
    const cmdsAtLimit = decideBarbarianMoves(
      [orphan], [farEnemy], [], [], map, P, undefined, undefined, 100 + P.orphanedChaseTurnLimit,
    );
    eq(cmdsAtLimit.length, 0,
      '3b: PO limicie (turn=orphanedAtTurn+orphanedChaseTurnLimit) pościg na cel odległy '
      + 'WYGASA -- chaseRadius wraca do aggroRadius(6) < d(20) -> ŻADNA komenda (nie freeze '
      + 'na zawsze, po prostu brak celu w zasięgu tej tury)');
  }

  // 3c. Regresja: PO limicie jednostka NIE jest "zamrożona" -- cel W ZASIĘGU aggroRadius
  // nadal jest ścigany. Dowodzi "wraca do aggroRadius", NIE "0"/martwa jednostka.
  {
    const map = makeMap(25, 5);
    const orphan2 = barb('orphan-limit2', 2, 2, { campId: 'destroyed-camp', orphanedAtTurn: 0 });
    const nearEnemy = playerUnit('near1', 6, 2, {}); // dystans 4 <= aggroRadius(6)
    assert(hexDist(orphan2.q, orphan2.r, nearEnemy.q, nearEnemy.r) <= P.aggroRadius,
      '3c-setup: cel W ZASIĘGU aggroRadius (sanity check fixture)');
    const cmdsPastLimitNear = decideBarbarianMoves(
      [orphan2], [nearEnemy], [], [], map, P, undefined, undefined, P.orphanedChaseTurnLimit + 5,
    );
    const cmdNear = cmdsPastLimitNear.find(c => c.unitId === 'orphan-limit2');
    assert(cmdNear !== undefined && cmdNear.type === 'move',
      '3c: PO limicie, cel W ZASIĘGU aggroRadius nadal ściga -- jednostka NIE zamiera na '
      + 'stałe, po prostu chaseRadius=aggroRadius zamiast Infinity');
  }

  // 3d. Legacy: wołający pomijający `turn` (wszystkie istniejące testy/callery) -> pościg
  // pozostaje NIEOGRANICZONY NA ZAWSZE, bit-identyczne z zachowaniem sprzed tej rundy.
  {
    const map = makeMap(25, 5);
    const orphanLegacy = barb('orphan-legacy', 2, 2, { campId: 'destroyed-camp' });
    const farEnemyLegacy = playerUnit('far2', 22, 2, {});
    for (let i = 0; i < 15; i++) {
      const cmds = decideBarbarianMoves([orphanLegacy], [farEnemyLegacy], [], [], map, P);
      assert(cmds.length > 0,
        `3d/wywołanie${i}: wołający BEZ parametru turn -> pościg NIGDY nie wygasa `
        + '(turn domyślnie 0 za każdym razem, orphanedAtTurn ustawiane raz na 0, '
        + '0-0=0 nigdy nie osiąga limitu)');
    }
  }

  // 3e. Save/load: orphanedAtTurn (BarbUnit) i barbGarrisonSpawnCooldown (City) przechodzą
  // round-trip serializeGame->deserializeGame identycznie jak istniejące pola (campId/
  // clearedCityIds/postCaptureLawTurnsRemaining) -- zwykłe pola prymitywne, JSON.stringify
  // wprost, bez specjalnej obsługi w save.ts.
  {
    const barbWithOrphanMemory = {
      id: 'raider-orphan-save', ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik',
      category: 'miecznik', q: 7, r: 3, ruch: 2, ruchLeft: 1,
      campId: 'destroyed-camp', orphanedAtTurn: 42,
    };
    const barbCityFixture = city('savecity1', 9, 9, BARBARIAN_OWNER_ID, { barbGarrisonSpawnCooldown: 4 });
    const saveGame = {
      wersja: 2, tura: 50, seed: 999,
      units: [barbWithOrphanMemory],
      cities: [barbCityFixture],
      explored: [],
    };
    const loaded = deserializeGame(serializeGame(saveGame));
    const loadedUnit = loaded.units.find(u => u.id === 'raider-orphan-save');
    const loadedCity = loaded.cities.find(c => c.id === 'savecity1');
    assert(loadedUnit !== undefined, '3e: jednostka osierocona odnaleziona po round-tripie');
    eq(loadedUnit && loadedUnit.orphanedAtTurn, 42,
      '3e: orphanedAtTurn (BarbUnit) PRZETRWAŁ round-trip serializeGame->deserializeGame');
    assert(loadedCity !== undefined, '3e: miasto barbarzyńskie odnalezione po round-tripie');
    eq(loadedCity && loadedCity.barbGarrisonSpawnCooldown, 4,
      '3e: barbGarrisonSpawnCooldown (City) PRZETRWAŁ round-trip serializeGame->deserializeGame');
  }
}

// ============================================================================================
// SEKCJA 4 -- TEMAT 10 (P-BARBARZYNCY-ONSPLIT-KOSZT-RUCHU-Q1=B)
// (e) koszt ruchu onSplit-na-obóz === koszt ruchu normalny-atak-na-obóz
// ============================================================================================
{
  // Teren: origin (2,2)='rownina' (koszt 1), destination (3,2)='wzgorza' (koszt 2) --
  // celowo RÓŻNE koszty, żeby test odróżnił "prawdziwy koszt terenu" od przypadkowego
  // zbiegu okoliczności (np. gdyby ruch jednostki akurat = kosztowi terenu).
  configureTerrainMovement({}, 1); // reset do domyślnych kosztów (rownina=1, wzgorza=2)
  const map = makeMap(10, 10, (q, r) => (q === 3 && r === 2 ? 'wzgorza' : 'rownina'));

  // 4a. Formuła DOKŁADNIE odtwarzająca `splitCampMoveCost` z onSplit (main.ts):
  // computePath + pathCost przez tę samą maszynerię co beginMoveSelectedUnitTo (normalny
  // ruch gracza). Jednostka ruch=3 (celowo != kosztowi terenu=2), żeby wynik po odjęciu
  // NIE mógł być pomylony z "przypadkowo wyszło 0" ani z pełnym ruch.
  {
    const mover = { id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 2, r: 2, ruch: 3, ruchLeft: 3 };
    const stack = [mover];
    const occ = new Set(); // occupiedForMove -- brak innych jednostek na mapie testowej
    const path = computePath(mover, map, 3, 2, occ, undefined);
    eq(path.length, 1, '4a: ścieżka do sąsiedniego heksu (3,2) ma dokładnie 1 krok');
    const cost = pathCost(path, map, undefined);
    eq(cost, 2, '4a: koszt terenu docelowego (wzgorza) = 2 (NIE 0, NIE pełny ruch=3)');

    deductStackRuchLeft(stack, cost);
    eq(mover.ruchLeft, 1,
      '4a: po odjęciu REALNEGO kosztu terenu (2) z ruch=3 zostaje ruchLeft=1 -- '
      + 'DOWÓD że onSplit-na-obóz (ta sama formuła) NIE zeruje bezwarunkowo do 0');
  }

  // 4b. Parytet z "normalnym ruchem": DOKŁADNIE ta sama formuła (computePath+pathCost+
  // deductStackRuchLeft) użyta niezależnie dla symulowanego "normalnego ruchu/ataku na
  // obóz" -- identyczny wynik jak 4a przez KONSTRUKCJĘ (main.ts's beginMoveSelectedUnitTo
  // używa dokładnie tych samych trzech prymitywów, patrz weryfikacja statyczna 4d).
  {
    const mover2 = { id: 'u2', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 2, r: 2, ruch: 3, ruchLeft: 3 };
    const occ2 = new Set();
    const normalMovePath = computePath(mover2, map, 3, 2, occ2, undefined);
    const normalMoveCost = pathCost(normalMovePath, map, undefined);
    deductStackRuchLeft([mover2], normalMoveCost);
    eq(mover2.ruchLeft, 1,
      '4b: "normalny ruch" (formuła beginMoveSelectedUnitTo) na ten sam heks daje '
      + 'IDENTYCZNY ruchLeft=1 -- parytet onSplit-na-obóz === normalny-ruch-na-obóz');
  }

  // 4c. STATIC: onSplit w main.ts liczy koszt PRZED przesunięciem (q,r) -- ordering-sensitive
  // (destQ/destR muszą być użyte do computePath Z ORYGINALNEJ pozycji, nie z już-przesuniętej).
  const marker4 = 'P-BARBARZYNCY-ONSPLIT-KOSZT-RUCHU-Q1';
  const idx4 = mainTs.indexOf(marker4);
  assert(idx4 !== -1, '4c: main.ts zawiera marker P-BARBARZYNCY-ONSPLIT-KOSZT-RUCHU-Q1');
  const window4 = mainTs.slice(idx4, idx4 + 2600);
  assert(window4.includes('const destHasLivingCamp = barbCamps.some('),
    '4c: onSplit sprawdza destHasLivingCamp (czy cel to heks żywego obozu)');
  const idxComputePath = window4.indexOf('computePath(splitMover, map, destQ, destR');
  const idxMutateQR = window4.indexOf('u.q = destQ;\n            u.r = destR;');
  assert(idxComputePath !== -1, '4c: onSplit woła computePath(splitMover, map, destQ, destR, ...)');
  assert(idxMutateQR !== -1, '4c: onSplit wciąż przesuwa jednostki na (destQ,destR)');
  assert(idxComputePath !== -1 && idxMutateQR !== -1 && idxComputePath < idxMutateQR,
    '4c (ordering-sensitive): computePath woła się PRZED przesunięciem (q,r) -- inaczej '
    + 'origin w computePath byłby już (destQ,destR), dając ścieżkę pustą/błędny koszt');
  assert(window4.includes('deductStackRuchLeft(splitArrivals, splitCampMoveCost)'),
    '4c: onSplit odejmuje REALNY koszt przez deductStackRuchLeft, nie ustawia ruchLeft=0 wprost');

  // 4d. STATIC: parytet z beginMoveSelectedUnitTo -- normalny ruch gracza używa DOKŁADNIE
  // tych samych trzech prymitywów (computePath/pathCost/deductStackRuchLeft poprzez
  // startAnimatedMove->deductStackRuchLeft(stack, anim.cost)), więc formuła 4a/4b nie jest
  // odosobnioną kopią, tylko ta sama maszyneria co main.ts już używa gdzie indziej.
  const idxBeginMove = mainTs.indexOf('function beginMoveSelectedUnitTo(');
  assert(idxBeginMove !== -1, '4d: main.ts definiuje beginMoveSelectedUnitTo');
  const windowBeginMove = mainTs.slice(idxBeginMove, idxBeginMove + 1800);
  assert(windowBeginMove.includes('computePath(mover, map, destQ, destR, occ, moveCostFn)'),
    '4d: beginMoveSelectedUnitTo (normalny ruch gracza) woła computePath -- ta sama funkcja co onSplit');
  assert(windowBeginMove.includes('cost = pathCost(path, map, moveCostFn)'),
    '4d: beginMoveSelectedUnitTo woła pathCost -- ta sama funkcja co onSplit');

  // 4e. Regresja: split na heks BEZ żywego obozu zachowuje dotychczasowe ruchLeft=0
  // bezwarunkowo (poza zakresem tego zlecenia -- właściciel prosił WYŁĄCZNIE o zniszczenie
  // obozu, nie o ogólną mechanikę splitu).
  assert(window4.includes('for (const u of splitArrivals) u.ruchLeft = 0;'),
    '4e (regresja-guard): split na heks BEZ obozu nadal zeruje ruchLeft bezwarunkowo -- '
    + 'zachowanie POZA zakresem tego zlecenia zostało nietknięte');
}

console.log(`\nbarb-city-capture-cluster-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
