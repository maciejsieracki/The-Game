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
  canBarbarianWalkIntoEmptyCity, splitCampMoveCost,
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
export {
  advanceProduction,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/production'))};
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
  canBarbarianWalkIntoEmptyCity, splitCampMoveCost,
  canCaptureCityWithoutBattle, hasCityDefenders,
  computePath, pathCost, terrainMoveCost, configureTerrainMovement,
  deductStackRuchLeft, stackRuchLeft,
  serializeGame, deserializeGame,
  advanceProduction,
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

  // 1c. RUNDA 3 (naprawa U1, Evaluator A): `barbCanWalkIntoEmptyCity` z main.ts
  // (bcmd.type ==='move' handler) woła TERAZ bezpośrednio wyeksportowaną, czystą
  // canBarbarianWalkIntoEmptyCity (barbarians.ts) -- ten blok importuje i wykonuje
  // TĘ SAMĄ funkcję co main.ts (z bundla, nie kopię formuły zdefiniowaną w tym
  // pliku testowym jak przed RUNDĄ 3), więc mutacja WEWNĄTRZ niej (np. usunięcie
  // `&& shouldAllowBarbCityCapture(difficulty)`) jest łapana przez REALNE wykonanie
  // poniższych asercji na produkcyjnym kodzie, nie przez porównanie kopii z kopią.
  eq(canBarbarianWalkIntoEmptyCity(emptyCity, [], 'hard'), true,
    '1c: hard + miasto puste -> canBarbarianWalkIntoEmptyCity zwraca true (przejęcie dozwolone)');
  eq(canBarbarianWalkIntoEmptyCity(emptyCity, [], 'normal'), false,
    '1c (regresja-guard/mutacja bramki trudności): normal + miasto puste -> false (BEZ zmian vs dziś)');
  eq(canBarbarianWalkIntoEmptyCity(emptyCity, [], 'easy'), false,
    '1c (regresja-guard/mutacja bramki trudności): easy + miasto puste -> false (BEZ zmian vs dziś)');
  eq(canBarbarianWalkIntoEmptyCity(garrisonedCity, [], 'hard'), false,
    '1c: hard ALE miasto BRONIONE (garnizon) -> false (walka nadal przez attack)');
  eq(canBarbarianWalkIntoEmptyCity(undefined, [], 'hard'), false,
    '1c: brak miasta na heksie docelowym -> false (zwykły ruch, bez zmian)');

  // 1d. STATIC: main.ts move-branch faktycznie WOŁA canBarbarianWalkIntoEmptyCity w
  // miejscu użycia (nie składa koniunkcję inline) -- marker unikalny + wymagane
  // podciągi w rozsądnym oknie. Skoro 1c wykonuje TĘ SAMĄ funkcję realnie, 1d musi
  // tylko dowieść, że main.ts faktycznie ją woła z właściwymi argumentami -- nie musi
  // już osobno dopasowywać shouldAllowBarbCityCapture/canCaptureCityWithoutBattle
  // (te żyją teraz WEWNĄTRZ funkcji, chronione przez 1c).
  const marker1d = 'P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1';
  const idx1d = mainTs.indexOf(marker1d);
  assert(idx1d !== -1, '1d: main.ts zawiera marker P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1');
  const window1d = mainTs.slice(idx1d, idx1d + 4000);
  assert(window1d.includes('barbCanWalkIntoEmptyCity'),
    '1d: okno wokół markera zawiera zmienną barbCanWalkIntoEmptyCity');
  assert(window1d.includes('canBarbarianWalkIntoEmptyCity(moveDestCity, units, _menuDifficulty)'),
    '1d: okno zawiera wywołanie canBarbarianWalkIntoEmptyCity(moveDestCity, units, _menuDifficulty) -- '
    + 'CAŁA koniunkcja (włącznie z bramką trudności) idzie przez funkcję z 1c, nie inline');
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

  // 2h-static. RUNDA 3 (naprawiona etykieta, Evaluator A/C): to jest SNAPSHOT-LOCK na
  // TEKŚCIE ŹRÓDŁOWYM main.ts, NIE dowód mutacyjny/behawioralny -- main.ts nie jest
  // bundlowany w tym harnessie (patrz nagłówek pliku), więc applyCityCaptureToMap nie
  // może zostać WYKONANY tutaj. Sonda cofająca naprawę, ale zostawiająca dopasowywany
  // string nietknięty (np. w komentarzu albo w martwym kodzie) przechodzi ten blok --
  // dlatego 2h-behavioral niżej dowodzi DEKLAROWANEJ KONSEKWENCJI reset (kolejka:[],
  // postep:0) przez REALNE wykonanie silnika produkcji (advanceProduction, bundlowalny
  // z production.ts), niezależnie od tego bloku. Dodatkowa asercja "nie w komentarzu"
  // niżej zawęża (ale NIE eliminuje) klasę sond tekstowych, którym ten blok ulega.
  // luka domknięta w RUNDZIE 2: applyCityCaptureToMap czyści kolejkę budowy (cityProd)
  // przy przejęciu barbarzyńskim -- inaczej budynek W TOKU odziedziczony po ofierze
  // (front kolejki, np. "Świątynia" 60% ukończona) dokończyłby się pod barbarzyńską
  // flagą na kolejnych tickach ekonomii (advanceCityEconomy liczy Praca/doBudynkow
  // identycznie dla KAŻDEGO miasta, advanceProduction odejmuje ją od frontu kolejki
  // bez sprawdzania właściciela) -- bez tego resetu "nigdy budynki" (temat 8) byłoby
  // prawdziwe TYLKO dla nowej produkcji, nie dla odziedziczonej.
  const idxApplyCapture = mainTs.indexOf('function applyCityCaptureToMap(');
  assert(idxApplyCapture !== -1, '2h-static: main.ts definiuje applyCityCaptureToMap');
  const windowApplyCapture = mainTs.slice(idxApplyCapture, idxApplyCapture + 4000);
  const resetRe =
    /if\s*\(\s*isBarbarian\(atkOwner\)\s*\)\s*\{\s*[\s\S]{0,200}?cityProd\.set\(city\.id,\s*\{\s*kolejka:\s*\[\],\s*postep:\s*0\s*\}\);/;
  const resetMatch = resetRe.exec(windowApplyCapture);
  assert(resetMatch !== null,
    '2h-static (snapshot-lock, NIE dowód behawioralny): applyCityCaptureToMap zawiera '
    + 'tekstowo cityProd.set (kolejka:[], postep:0) WEWNĄTRZ `if (isBarbarian(atkOwner))`');
  if (resetMatch) {
    // Anty-komentarz: linia zawierająca DOKŁADNIE `if (isBarbarian(atkOwner))` i linia
    // zawierająca DOKŁADNIE `cityProd.set(city.id,` (znalezione precyzyjnie, nie "ostatnie
    // N linii przed dopasowaniem" -- ta duża funkcja ma nad `if` wielojęzyczny blok
    // komentarza `//`, więc naiwne "kilka linii wstecz" łapałoby TEN komentarz i dawało
    // fałszywy negatyw na poprawnym, nietkniętym kodzie) nie zaczynają się (po trim) od
    // `//` -- zawęża sondę "zakomentuj naprawę, zostaw dopasowywany string w martwym
    // komentarzu" (nie eliminuje w 100%: nie parsujemy JS, więc blokowe /* */ albo string
    // w środku linii kodu nie są łapane).
    const ifLineStart = windowApplyCapture.lastIndexOf('\n', resetMatch.index) + 1;
    const ifLineEndIdx = windowApplyCapture.indexOf('\n', resetMatch.index);
    const ifLine = windowApplyCapture.slice(ifLineStart, ifLineEndIdx === -1 ? undefined : ifLineEndIdx);

    const cityProdIdx = windowApplyCapture.indexOf('cityProd.set(city.id,', resetMatch.index);
    const cpLineStart = windowApplyCapture.lastIndexOf('\n', cityProdIdx) + 1;
    const cpLineEndIdx = windowApplyCapture.indexOf('\n', cityProdIdx);
    const cpLine = windowApplyCapture.slice(cpLineStart, cpLineEndIdx === -1 ? undefined : cpLineEndIdx);

    assert(!ifLine.trim().startsWith('//') && !cpLine.trim().startsWith('//'),
      '2h-static (anty-komentarz): ani linia `if (isBarbarian(atkOwner))` ('
      + JSON.stringify(ifLine.trim()) + '), ani linia cityProd.set(...) ('
      + JSON.stringify(cpLine.trim()) + ') nie są zakomentowane (trim() nie zaczyna się od `//`)');
  }
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
    '2h-static (regresja-guard): PO usunięciu jedynego znanego wystąpienia wewnątrz '
    + '`if (isBarbarian(atkOwner))` nie zostaje żadne DRUGIE, bezwarunkowe wystąpienie '
    + 'cityProd.set(city.id, {kolejka:[],postep:0}) -- reset dotyczy WYŁĄCZNIE '
    + 'przejęcia barbarzyńskiego, nie każdego podboju');

  // 2h-behavioral. DOWÓD BEHAWIORALNY DEKLAROWANEJ KONSEKWENCJI (Zadanie 3, Operator
  // RUNDA 3): main.ts nie jest bundlowany (2h-static wyżej tłumaczy dlaczego), więc nie
  // wołamy applyCityCaptureToMap wprost -- zamiast tego odtwarzamy JEGO DWA MOŻLIWE
  // ZACHOWANIA (reset zastosowany / reset pominięty, czyli PRZED naprawą z RUNDY 2) i
  // przepuszczamy KAŻDE z nich przez PRAWDZIWY, bundlowalny silnik produkcji
  // (advanceProduction, production.ts) -- ten sam silnik, którego używa main.ts na
  // każdym ticku ekonomii (main.ts ok. 24403). To dowodzi KONSEKWENCJI ("budynek NIE
  // kończy się pod barbarzyńską flagą"), nie tylko obecności tekstu w main.ts.
  {
    const inheritedBuilding = { kind: 'budynek', id: 'Swiatynia', nazwa: 'Świątynia', koszt: 100 };
    const victimProdAt60 = { kolejka: [inheritedBuilding], postep: 60 }; // 60% ukończona
    const pracaNastepnejTury = 40; // dokładnie tyle, ile brakuje do 100% (100-60)

    // "PO naprawie" (RUNDA 2): applyCityCaptureToMap wykonuje
    // cityProd.set(city.id, { kolejka: [], postep: 0 }) -- odtwarzamy TEN SAM efekt.
    const afterFixProd = { kolejka: [], postep: 0 };
    const afterFixTick = advanceProduction(afterFixProd, pracaNastepnejTury);
    eq(afterFixTick.completed, null,
      '2h-behavioral: PO naprawie (kolejka wyzerowana przy przejęciu) budynek '
      + 'odziedziczony po ofierze NIE kończy się na kolejnym ticku ekonomii mimo '
      + 'wystarczającej Pracy (40) -- "nigdy budynki" prawdziwe TAKŻE dla produkcji '
      + 'odziedziczonej, nie tylko nowej');
    eq(afterFixTick.overflowToPool, pracaNastepnejTury,
      '2h-behavioral: cała Praca tej tury (40) trafia do overflowToPool (pusta kolejka) '
      + '-- żadna jej część nie dokończyła cudzego budynku');

    // "PRZED naprawą" (stan sprzed RUNDY 2, odtworzony TUTAJ jako punkt odniesienia --
    // main.ts się dziś NIE zachowuje w ten sposób, sekcja 2h-static wyżej to chroni):
    // kolejka ofiary PRZEŻYWA przejęcie nietknięta.
    const beforeFixTick = advanceProduction(victimProdAt60, pracaNastepnejTury);
    assert(beforeFixTick.completed !== null && beforeFixTick.completed.id === 'Swiatynia',
      '2h-behavioral (punkt odniesienia PRZED naprawą): BEZ resetu kolejki, ten sam '
      + 'budynek odziedziczony (60/100) + ta sama Praca (40) KOŃCZY się -- dokładnie '
      + 'luka, którą RUNDA 2 zamknęła (dowód, że reset ma realny efekt, nie tylko '
      + 'kosmetyczny zapis)');
    eq(beforeFixTick.prod.kolejka.length, 0,
      '2h-behavioral (punkt odniesienia PRZED naprawą): kolejka pusta PO ukończeniu '
      + '(budynek był jedyną pozycją) -- budynek naprawdę "wszedł do gry" pod '
      + 'barbarzyńcami w tym kontrfaktycznym scenariuszu');
  }
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
  // Teren: origin (2,2)='rownina' (koszt 1), (3,2)='wzgorza' (koszt 2), (2,3)='pustynia'
  // (koszt SKONFIGUROWANY na 3, żeby być RÓŻNY od wzgorza) -- TRZY różne koszty, żeby
  // 4a/4b odróżniły "prawdziwy koszt terenu, czytany PER heks" od stałej/przypadkowego
  // zbiegu okoliczności (np. gdyby ruch jednostki akurat = kosztowi terenu, albo gdyby
  // implementacja hardkodowała jedną wartość zamiast czytać teren -- patrz M10.3,
  // Evaluator C: `pathCost(splitPath, map, splitMoveCostFn)` zastąpione stałą `1` dawało
  // 89/89 zielone na starej wersji testu, bo 4a/4b liczyły TĘ SAMĄ formułę dwa razy).
  configureTerrainMovement({ Wzgorza: 2, Pustynia: 3 }, 1);
  const map = makeMap(10, 10, (q, r) => {
    if (q === 3 && r === 2) return 'wzgorza';
    if (q === 2 && r === 3) return 'pustynia';
    return 'rownina';
  });

  // 4a. RUNDA 3 (naprawa M10.3, Evaluator C): wywołuje BEZPOŚREDNIO wyeksportowaną,
  // czystą splitCampMoveCost (barbarians.ts) -- TĘ SAMĄ funkcję, którą main.ts woła w
  // onSplit (patrz 4c-static niżej). Jednostka ruch=3 (celowo != kosztowi terenu=2),
  // żeby wynik po odjęciu NIE mógł być pomylony z "przypadkowo wyszło 0" ani z pełnym
  // ruch.
  {
    const mover = { id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 2, r: 2, ruch: 3, ruchLeft: 3 };
    const occ = new Set(); // occupiedForMove -- brak innych jednostek na mapie testowej
    const cost = splitCampMoveCost(mover, map, 3, 2, occ, undefined);
    eq(cost, 2, '4a: koszt terenu docelowego (wzgorza) = 2 (NIE 0, NIE pełny ruch=3, NIE stała)');

    deductStackRuchLeft([mover], cost);
    eq(mover.ruchLeft, 1,
      '4a: po odjęciu REALNEGO kosztu terenu (2) z ruch=3 zostaje ruchLeft=1 -- '
      + 'DOWÓD że onSplit-na-obóz (ta sama funkcja) NIE zeruje bezwarunkowo do 0');
  }

  // 4b. RUNDA 3 (zastąpienie tautologii, Evaluator C): DRUGI, RÓŻNY typ terenu z INNYM
  // skonfigurowanym kosztem (pustynia=3 vs wzgorza=2 z 4a) -- dowodzi że
  // splitCampMoveCost czyta REALNY koszt PER heks (nie stałą, nie kopiuje 4a) na DWÓCH
  // niezależnych scenariuszach wykonania. Stara wersja 4b liczyła DOKŁADNIE tę samą
  // parę computePath/pathCost na TYM SAMYM heksie (3,2)='wzgorza' co 4a pod innymi
  // nazwami zmiennych -- porównanie kopii z kopią, tautologia analogiczna do 1c/1d
  // sprzed RUNDY 3 (mutacja "zastąp wywołanie stałą 1" dawała 89/89 zielone).
  {
    const mover2 = { id: 'u2', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 2, r: 2, ruch: 5, ruchLeft: 5 };
    const occ2 = new Set();
    const costPustynia = splitCampMoveCost(mover2, map, 2, 3, occ2, undefined);
    eq(costPustynia, 3,
      '4b: koszt terenu docelowego (pustynia, skonfigurowana na 3) = 3 -- czytany PER '
      + 'heks, nie skopiowany z 4a');
    assert(costPustynia !== 2,
      '4b (mutation-guard M10.3): koszt pustyni(3) != koszt wzgórz(2) z 4a -- gdyby '
      + 'splitCampMoveCost ignorowała teren i zwracała stałą, OBA scenariusze dałyby '
      + 'TEN SAM wynik zamiast dwóch różnych wartości terenowych');

    deductStackRuchLeft([mover2], costPustynia);
    eq(mover2.ruchLeft, 2,
      '4b: po odjęciu REALNEGO kosztu pustyni (3) z ruch=5 zostaje ruchLeft=2');
  }

  // 4c. STATIC: onSplit w main.ts woła splitCampMoveCost (barbarians.ts) PRZED
  // przesunięciem (q,r) -- ordering-sensitive (destQ/destR muszą trafić do
  // splitCampMoveCost Z ORYGINALNEJ pozycji jednostki, nie z już-przesuniętej -- inaczej
  // origin w computePath wewnątrz splitCampMoveCost byłby już (destQ,destR)).
  const marker4 = 'P-BARBARZYNCY-ONSPLIT-KOSZT-RUCHU-Q1';
  const idx4 = mainTs.indexOf(marker4);
  assert(idx4 !== -1, '4c: main.ts zawiera marker P-BARBARZYNCY-ONSPLIT-KOSZT-RUCHU-Q1');
  const window4 = mainTs.slice(idx4, idx4 + 3200);
  assert(window4.includes('const destHasLivingCamp = barbCamps.some('),
    '4c: onSplit sprawdza destHasLivingCamp (czy cel to heks żywego obozu)');
  const idxSplitCampMoveCostCall = window4.indexOf(
    'splitMoveCostValue = splitCampMoveCost(splitMover, map, destQ, destR, splitOcc, splitMoveCostFn)');
  const idxMutateQR = window4.indexOf('u.q = destQ;\n            u.r = destR;');
  assert(idxSplitCampMoveCostCall !== -1,
    '4c: onSplit woła splitCampMoveCost(splitMover, map, destQ, destR, splitOcc, splitMoveCostFn) '
    + '-- funkcja z 4a/4b, nie computePath/pathCost inline');
  assert(idxMutateQR !== -1, '4c: onSplit wciąż przesuwa jednostki na (destQ,destR)');
  assert(idxSplitCampMoveCostCall !== -1 && idxMutateQR !== -1 && idxSplitCampMoveCostCall < idxMutateQR,
    '4c (ordering-sensitive): splitCampMoveCost woła się PRZED przesunięciem (q,r) -- inaczej '
    + 'origin wewnątrz niej byłby już (destQ,destR), dając ścieżkę pustą/błędny koszt');
  assert(window4.includes('deductStackRuchLeft(splitArrivals, splitMoveCostValue)'),
    '4c: onSplit odejmuje REALNY koszt (wynik splitCampMoveCost) przez deductStackRuchLeft, '
    + 'nie ustawia ruchLeft=0 wprost');

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
