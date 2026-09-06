'use strict';
/**
 * ai-produkcja-pokrycie-katalogu-test.cjs — R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1.
 *
 * Kryterium 2 dispatchu: "Pokrycie 41/41" (stan na dziś: 42/42 -- RECON dispatchu
 * mylił się o jeden budynek, patrz raport Operatora) -- bramka wylicza liczbę
 * budynków z DANYCH (buildings.json), NIGDY z zaszytego licznika (`grupy-budynkow-
 * test.cjs` jest w tym repo żywym przykładem, jak taki licznik gnije: zaszyte
 * 40 przy 41 budynkach, czerwone od lipca -- kryterium 2 wprost tego zabrania).
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (tryb pierwszy): ta bramka mierzy POKRYCIE
 * KATALOGU (ile różnych budynków AI może w ogóle wybrać), NIE fakt posiadania
 * jakiegokolwiek budynku -- `ai-buduje-budynki-test.cjs` (42/0 zielony nawet
 * PRZED tym tematem) mierzy inną, węższą wielkość i nie widzi tego defektu.
 *
 * Metoda: symulacja "tylko budynki" -- chooseCityProduction wołane wielokrotnie
 * z canAfford, który ODRZUCA każdą jednostkę (zwraca false dla id-ów z units.json)
 * i AKCEPTUJE każdy budynek -- w ten sposób AI zawsze wybiera najlepiej
 * punktowany JESZCZE-NIE-ZBUDOWANY budynek (jeśli jakikolwiek jest dostępny),
 * a jednostki nigdy nie zaśmiecają wyniku. Po każdym wyborze budynek trafia do
 * `built` (jakby ukończony natychmiast -- ta bramka mierzy DOSTĘPNOŚĆ, nie tempo
 * budowy) i pętla powtarza się, aż `chooseCityProduction` zwróci null (żaden
 * budynek już niedostępny) albo osiągnięty zostanie twardy limit iteracji.
 * Bez `opts.isProductionAllowed` (żadnej bramki tech/epoka/lokalizacja) --
 * kryterium 2 mierzy "ile budynków AI może w ogóle wybrać PRZY SPEŁNIONYCH
 * warunkach tech/epoki/lokalizacji", czyli zakłada, że te warunki są spełnione;
 * jedyne bramki, które NADAL działają, są generyczne i data-driven (upgradeFrom,
 * CITY_BUILDING_PREREQ z building-resource-gate.ts) -- dokładnie tak jak w
 * prawdziwym `availableProduction()`.
 *
 * Run from gra/: node tools/ai-produkcja-pokrycie-katalogu-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.ai-produkcja-pokrycie-katalogu-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-produkcja-pokrycie-katalogu-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { chooseCityProduction, loadDifficultyParams } from ${JSON.stringify(GRA + '/src/game/ai')};
`, 'utf8');

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

const { chooseCityProduction, loadDifficultyParams } = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}

const J = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const buildingsRaw = J('buildings.json');
const buildings = Array.isArray(buildingsRaw) ? buildingsRaw : buildingsRaw.buildings;
const unitsRaw = J('units.json');
const units = Array.isArray(unitsRaw) ? unitsRaw : unitsRaw.units;
const unitNames = new Set(units.map(u => u.Jednostka));

// Liczba budynków w katalogu -- Z DANYCH, nigdy zaszyta (kryterium 2, tryb
// drugi reguły przeciw samooszukiwaniu: "ZASZYTY LICZNIK ZAMIAST ODCZYTU Z
// DANYCH" -- dokładnie ten błąd, który psuje `grupy-budynkow-test.cjs`).
const TOTAL_BUILDINGS = buildings.length;

const ZERO_MODS = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };

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
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

const map = makeMap(20, 20);
const dataFull = { buildings, units, terrainYields: J('terrain-yields.json'), aiParams: J('ai-params.json') };
const diff = loadDifficultyParams(dataFull, 2);

/**
 * canAfford, który odrzuca WYŁĄCZNIE jednostki -- pozwala chooseCityProduction
 * zawsze wybierać najlepiej punktowany budynek jeszcze niezbudowany, bez
 * zaśmiecania wyniku jednostkami (Wojownik/Łucznik/Zwiadowca itd.).
 */
function onlyBuildingsCanAfford(_cityId, itemId) {
  return !unitNames.has(itemId);
}

/**
 * Symuluje jedno "AI", zwracając Set odwiedzonych id budynków -- powtarza
 * chooseCityProduction, budując natychmiast (mierzymy DOSTĘPNOŚĆ, nie tempo)
 * aż zwróci null albo osiągnie twardy limit (katalog + margines).
 */
function simulateCoverage(opts, cities, allUnits, ownerId) {
  const built = [];
  const visited = new Set();
  const cap = TOTAL_BUILDINGS + 15;
  for (let i = 0; i < cap; i++) {
    const cityBuildings = { [cities[0].id]: built };
    const pick = chooseCityProduction(
      cities[0].id, cities, allUnits, ownerId, dataFull, ZERO_MODS,
      { ...opts, cityBuildings, canAfford: onlyBuildingsCanAfford },
      map, diff,
    );
    if (pick === null) break;
    if (unitNames.has(pick)) break; // nie powinno się zdarzyć (canAfford odrzuca jednostki)
    if (built.includes(pick)) break; // brak postępu -- zapętlenie, przerwij
    built.push(pick);
    visited.add(pick);
  }
  return visited;
}

// ===========================================================================
// A. Major AI (pełna cywilizacja) -- mid-phase, 3 miasta, bez zagrożenia.
// ===========================================================================
console.log('\n--- A. Major AI: pokrycie katalogu budynków ---');
const majorCities = [
  { id: 'c1', ownerId: 1, q: 5, r: 5, population: 5, name: 'A' },
  { id: 'c2', ownerId: 1, q: 10, r: 5, population: 5, name: 'B' },
  { id: 'c3', ownerId: 1, q: 15, r: 5, population: 5, name: 'C' },
];
const majorVisited = simulateCoverage({ currentTurn: 100 }, majorCities, [], 1);

// WYJĄTEK udokumentowany w raporcie Operatora (P-AI-008, ai-threat-mode.ts):
// major AI (pełne cywilizacje) NIGDY nie buduje Murów -- fortyfikacja zostaje
// dla miast-państw. Fort/Baszta wymagają Murów w mieście (CITY_BUILDING_PREREQ),
// więc są dla major AI TRWALE nieosiągalne, dopóki ta decyzja nie zostanie
// zawężona przez właściciela (DECISION_REQUIRED w raporcie Operatora).
const MAJOR_AI_UNREACHABLE = new Set(['mury', 'fort', 'baszta']);
const majorExpected = buildings
  .map(b => b.id)
  .filter(id => !MAJOR_AI_UNREACHABLE.has(id));

console.log(`    Major AI: ${majorVisited.size + MAJOR_AI_UNREACHABLE.size} / ${TOTAL_BUILDINGS} (katalog pełny),`
  + ` ${majorVisited.size} / ${majorExpected.length} (bez wyjątku P-AI-008 mury/fort/baszta)`);

const missingForMajor = majorExpected.filter(id => !majorVisited.has(id));
if (missingForMajor.length > 0) {
  console.log('    BRAKUJĄCE (major AI, poza udokumentowanym wyjątkiem):', missingForMajor.join(', '));
}
assert(
  missingForMajor.length === 0,
  `Major AI osiąga wszystkie ${majorExpected.length} budynków poza udokumentowanym wyjątkiem P-AI-008 (brakuje: ${missingForMajor.join(', ') || 'brak'})`,
);

// ===========================================================================
// B. Miasto-państwo (defensiveCopy) -- garnizon dopełniony (bootstrap odblokowany).
// ===========================================================================
console.log('\n--- B. Miasto-państwo (defensiveCopy): pokrycie katalogu budynków ---');
const csCity = { id: 'cs1', ownerId: 4, q: 3, r: 3, population: 3, name: 'CS' };
const csGuards = [
  { id: 'g1', ownerId: 4, q: 3, r: 3, typeId: 'miecznik', category: 'miecznik', ruch: 2, ruchLeft: 2 },
  { id: 'g2', ownerId: 4, q: 3, r: 3, typeId: 'miecznik', category: 'miecznik', ruch: 2, ruchLeft: 2 },
];
const csVisited = simulateCoverage(
  { defensiveCopy: true, cityStateDifficultyVsPlayer: 'normal' },
  [csCity], csGuards, 4,
);
console.log(`    Miasto-państwo: ${csVisited.size} / ${TOTAL_BUILDINGS}`);
// Kryterium 5 (dispatch): miasta-państwa mają WĘŻSZĄ, celowo ograniczoną gałąź
// (żadna asercja liczbowa tutaj -- to NIE jest luka pokrycia, to zamierzone
// ograniczenie miast-państw, osobno dowiedzione przez ai-mp-*-test.cjs).

// ===========================================================================
// C. Grupa budynków (BuildingDef.grupa) -- jedyny dopuszczalny wyjątek od
//    zakazu literałów budynków (kryterium 1) to NAZWY GRUP. Wypisz je.
// ===========================================================================
console.log('\n--- C. Nazwy grup użyte w scoringu (jedyny dopuszczalny wyjątek, kryterium 1) ---');
const groupsInData = new Set(buildings.map(b => b.grupa).filter(g => g !== undefined));
console.log('    Grupy w danych:', [...groupsInData].join(', '));

console.log('\n========================================');
console.log(`ai-produkcja-pokrycie-katalogu-test: ${passed} passed, ${failed} failed`);
console.log(`Katalog: ${TOTAL_BUILDINGS} budynków (z danych, nie zaszyte).`);
if (failed > 0) process.exit(1);
