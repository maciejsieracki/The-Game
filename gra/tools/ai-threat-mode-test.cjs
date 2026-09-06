'use strict';
/**
 * ai-threat-mode-test.cjs — tryb zagrożenia major AI (jednostki+rozwój+Mury).
 * P-AI-008 ("major AI nigdy nie buduje Murów") USUNIĘTA rundą 2 tematu
 * R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 (Maciej, ratyfikacja 2026-09-06) --
 * Mury/Fort/Baszta dostają teraz podniesiony priorytet pod zagrożeniem i w
 * miastach przygranicznych (patrz `ai.ts`, `MAJOR_FORTIFICATION_IDS`). T8d/T8e
 * niżej odwrócone na nowy kontrakt; T8b/T8c/T8f/T8g nietknięte (nie dotyczą
 * usuniętej reguły). T8h DODANY Obroną rundy 2 (zarzut #2 Evaluatora) --
 * scenariusz konkurencyjny jak T8d, ale dla bonusu GRANICZNEGO (bez zagrożenia).
 * Run from gra/: node tools/ai-threat-mode-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[ai-threat-mode-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.ai-threat-mode-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-threat-mode-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { chooseCityProduction, loadDifficultyParams, chooseAIResearch } from ${JSON.stringify(AI_SRC + '/game/ai')};
export {
  AI_THREAT_RANGE_DEFAULT,
  aiThreatPrioritizeWalls,
  aiThreatWallProductionScore,
  aiThreatMajorUnitScores,
} from ${JSON.stringify(AI_SRC + '/game/ai-threat-mode')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-threat-mode-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  chooseCityProduction,
  loadDifficultyParams,
  chooseAIResearch,
  AI_THREAT_RANGE_DEFAULT,
  aiThreatPrioritizeWalls,
  aiThreatWallProductionScore,
  aiThreatMajorUnitScores,
  hexDistance,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeMap() {
  const hexes = {};
  for (let q = 0; q < 12; q++) {
    for (let r = 0; r < 12; r++) {
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
  return { szerokoscQ: 12, wysokoscR: 12, hexes, seed: 1, riverPaths: [] };
}

function makeData(threatRange) {
  return {
    units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
    buildings: [
      { id: 'mury', nazwa: 'Mury' },
      { id: 'koszary', nazwa: 'Koszary' },
      { id: 'stolarnia', nazwa: 'Stolarnia' },
      { id: 'spichlerz', nazwa: 'Spichlerz' },
    ],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
    aiParams: {
      ekspansja_zagroz_zasieg: { wartosc: threatRange, sekcja: 't', opis: '' },
      trudnosc_poziom2_bonus_produkcja: { wartosc: 0, sekcja: 't', opis: '' },
    },
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const midCities = [
  { id: 'c1', ownerId: 1, q: 5, r: 5, population: 5, name: 'A' },
  { id: 'c2', ownerId: 1, q: 8, r: 5, population: 5, name: 'B' },
  { id: 'c3', ownerId: 1, q: 2, r: 5, population: 5, name: 'C' },
];
const map = makeMap();

console.log('\n--- T8a: domyślny zasięg zagrożenia = 7 ---');
eq(AI_THREAT_RANGE_DEFAULT, 7, 'default 7 hex');

console.log('\n--- T8b: aiThreatPrioritizeWalls / wall score major vs MP ---');
{
  eq(aiThreatPrioritizeWalls(1), false, 'major AI: bez murów pod zagrożeniem');
  eq(aiThreatWallProductionScore(100, 1, false), null, 'major: null score mury');
  eq(aiThreatWallProductionScore(100, 1, true), 400, 'defensiveCopy: 300+100');
  const scores = aiThreatMajorUnitScores(100);
  assert(scores.wojownik > 380, 'major unit score boost');
}

console.log('\n--- T8c: wrog w 6 hex przy zasiegu 5 -> brak zagrozenia ---');
{
  const dist = hexDistance(5, 5, 11, 5);
  assert(dist === 6, `dist scout=6 (got ${dist})`);
  const data = makeData(5);
  const enemy = { id: 'e1', ownerId: 2, typeId: 'Zwiadowca', category: 'zwiadowca', q: 11, r: 5, ruch: 2, ruchLeft: 2 };
  const id = chooseCityProduction('c1', midCities, [enemy], 1, data, ZERO, {
    cityBuildings: { c1: [] },
    powerRank: 1,
  }, map, loadDifficultyParams(data, 2));
  assert(id !== 'mury', 'zasieg 5 + wrog 6 hex -> nie Mury z trybu zagrozenia');
}

console.log('\n--- T8d: major AI lider Mocy + zagrozenie -> Mury (P-AI-008 USUNIĘTA rundą 2) ---');
{
  // R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 runda 2 (Maciej, ratyfikacja 2026-09-06):
  // P-AI-008 ("major AI nigdy nie buduje Murów pod zagrożeniem") USUNIĘTA na
  // WPROST życzenie właściciela ("AI powinno budować mury, zwłaszcza kiedy jest
  // zagrożone"). Ten test wcześniej sprawdzał DOKŁADNIE tę usuniętą regułę --
  // odwrócona asercja (Mury TERAZ wygrywają) jest zamierzonym skutkiem, nie
  // regresją. powerRank (lider Mocy) nie jest częścią nowej reguły (nowe sygnały
  // to wyłącznie underThreat i isBorderCity, patrz ai.ts) -- nie zmienia wyniku.
  const data = makeData(7);
  const enemy = { id: 'e2', ownerId: 2, typeId: 'Wojownik', category: 'miecznik', q: 6, r: 5, ruch: 2, ruchLeft: 2 };
  const id = chooseCityProduction('c1', midCities, [enemy], 1, data, ZERO, {
    cityBuildings: { c1: [] },
    powerRank: 1,
  }, map, loadDifficultyParams(data, 2));
  assert(id === 'mury', 'runda 2: rank 1 + zagrozenie -> Mury (priorytet podniesiony, P-AI-008 usunięta)');
}

console.log('\n--- T8e: major AI rank 3 + zagrozenie -> Mury (P-AI-008 USUNIĘTA rundą 2) ---');
{
  const data = makeData(7);
  const enemy = { id: 'e3', ownerId: 2, typeId: 'Wojownik', category: 'miecznik', q: 6, r: 5, ruch: 2, ruchLeft: 2 };
  const id = chooseCityProduction('c1', midCities, [enemy], 1, data, ZERO, {
    cityBuildings: { c1: [] },
    powerRank: 3,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0, priorytetMilitarny: 5, priorytetEkonomia: 5, priorytetNauka: 5 },
  }, map, loadDifficultyParams(data, 2));
  assert(id === 'mury', 'runda 2: rank 3 + zagrozenie -> Mury (priorytet podniesiony, powerRank bez wpływu)');
}

console.log('\n--- T8h: border-only (BEZ zagrozenia) w scenariuszu konkurencyjnym jak T8d -> Mury ---');
{
  // Obrona rundy 2 (zarzut #2 Evaluatora, PRZYJĘTY z dowodem): asercje (a)/(a2) w
  // ai-produkcja-pokrycie-katalogu-test.cjs są DEGENERACKIE (39/42 zbudowane, mury
  // jedyny afordowalny kandydat niezależnie od bonusu) -- nie strzegą mechanizmu.
  // Ten test odtwarza DOKŁADNIE scenariusz T8d (świeże miasto, katalog konkurencyjny
  // mury/koszary/stolarnia/spichlerz, brak innych budynków) ale zamiast wroga w
  // zasięgu podaje TYLKO `territoryNodes` obcego właściciela (border, zero threat)
  // -- ten sam mechanizm co isBorderCity/D-IMPROVEMENTS. Wartość bonusu podniesiona
  // tą rundą z 60 na 120 (patrz komentarz przy AI_MAJOR_WALL_BORDER_BONUS w ai.ts) --
  // bisekcja niezależna: próg przełamania bazy grupy "Wojsko i obrona" (90+militaryScore)
  // przez bazę "Produkcja surowców"/"Prawo i administracja" leży między 100 a 110 w
  // tym dokładnym scenariuszu; 60 (wartość sprzed tej rundy) NIE wystarczał.
  const data = makeData(7);
  const borderNodes = [{ q: 6, r: 5, pop: 5, level: 1, ownerId: 2 }];
  const id = chooseCityProduction('c1', midCities, [], 1, data, ZERO, {
    cityBuildings: { c1: [] },
    powerRank: 1,
    territoryNodes: borderNodes,
  }, map, loadDifficultyParams(data, 2));
  assert(id === 'mury', 'runda 2 Obrony: miasto przygraniczne BEZ zagrozenia, katalog konkurencyjny -> Mury (bonus 120)');
}

console.log('\n--- T8f: defensiveCopy + zagrozenie + garnizon -> Palisada (fortyfikacja, po bootstrap) ---');
{
  // R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 (2026-09-03, GOAL 2): recon potwierdził Palisada
  // istnieje jako tańsza/wcześniejsza pozycja niż Mury (buildings.json: epoka 1 vs 2, koszt
  // 22 vs 35) -- ai.ts dodaje ją teraz jako PIERWSZY wybór obronny MP (score > mury), dopóki
  // Mury nie są zbudowane. Bez opts.isProductionAllowed w tym scenariuszu (brak bramki
  // tech/epoki) Palisada wygrywa nad Murami -- zamierzone zachowanie, nie regresja; dawniej
  // (przed tym tematem) MP w ogóle nie znało Palisady jako kandydata.
  const data = makeData(7);
  const enemy = { id: 'e4', ownerId: 2, typeId: 'Wojownik', category: 'miecznik', q: 6, r: 5, ruch: 2, ruchLeft: 2 };
  const guard = { id: 'g1', ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 4, ruch: 2, ruchLeft: 2 };
  const id = chooseCityProduction('c1', midCities, [enemy, guard], 1, data, ZERO, {
    cityBuildings: {
      c1: ['studnia', 'garncarnia', 'stolarnia', 'spichlerz', 'targowisko', 'palac'],
    },
    powerRank: 1,
    defensiveCopy: true,
  }, map, loadDifficultyParams(data, 2));
  eq(id, 'palisada', 'defensiveCopy + garnizon + zagrozenie -> Palisada (fortyfikacja tania/wczesna)');
}

console.log('\n--- T8g: P-AI-008 chooseAIResearch underThreat -> nie Murarstwo (military/rozwój) ---');
{
  const techData = [
    { Technologia: 'Garncarstwo', Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Spichlerz, Cegielnia', 'Koszt nauki': 12 },
    { Technologia: 'Murarstwo', Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Mury, Kopalnia', 'Koszt nauki': 14 },
    { Technologia: 'Brazownictwo', Epoka: 'Kamien', Poziom: 2, 'Wymaga (prereq)': 'Garncarstwo', 'Odblokowuje budynek': 'Huta, jednostki bronzowe', 'Koszt nauki': 24 },
  ];
  const done = new Set(['Garncarstwo']);
  const pick = chooseAIResearch(techData, done, { underThreat: true });
  eq(pick, 'Brazownictwo', 'underThreat + Garncarstwo done -> Brazownictwo, nie Murarstwo');
}

console.log('\n========================================');
console.log(`ai-threat-mode-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
