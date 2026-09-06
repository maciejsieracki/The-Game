'use strict';
/**
 * ai-mp-military-cap-test.cjs — cap wojska MP wg osi PM-vs-GRACZ
 * (_menuCityStateDifficultyVsPlayer, opts.cityStateDifficultyVsPlayer).
 *
 * C-025/C-026 (2026-08-10) / R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04=B:
 * przed tą aktualizacją T3/T6 przypinały STARĄ oś (opts.menuDifficulty, trudność gry
 * AI-facing) i STARY cap('hard')=0 -- PM na Trudnym nigdy nie mogło zrekrutować nawet
 * pierwszego garnizonu. Dziś oś to opts.cityStateDifficultyVsPlayer (gracz-facing,
 * wprost z trudności gry).
 *
 * RUNDA 3 (2026-08-10, Evaluator FAIL na commit 7e753db2): cap('hard') podniesiony z 3
 * (= CS_WAVE_ATTACK_MIN_STACK) na 4 (= CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong']
 * .minGuard) -- cap=3 nigdy nie osiągał realny próg bramki wyjścia z domu w ai.ts
 * (totalMilitary < minFieldArmyBeforeSend + minGuardToSend = 3 + 1 = 4), więc PM
 * rekrutowało do 3 i tam utykało w mieście, fala ofensywna nigdy nie wyruszała.
 * Trudna gra → PM MOŻE dokupywać wojsko, do 4 jednostek na mapie.
 *
 * Run from gra/: node tools/ai-mp-military-cap-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-mp-military-cap-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-mp-military-cap-bundle.cjs');

const ENTRY_TS = `
export { chooseCityProduction, loadDifficultyParams, countOwnerMilitaryUnits } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { cityStateMilitaryProductionCap } from ${JSON.stringify(AI_SRC + '/game/city-state-difficulty')};
export { aiCsAbsorptionParams, rollAiCsAccept } from ${JSON.stringify(AI_SRC + '/game/ai-cs-absorption')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const {
  chooseCityProduction,
  loadDifficultyParams,
  countOwnerMilitaryUnits,
  cityStateMilitaryProductionCap,
  aiCsAbsorptionParams,
  rollAiCsAccept,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        q, r, terenBazowy: 'Równina', nakladka: 0,
        rzeka: { obecna: false }, droga: { obecna: false },
      };
    }
  }
  return { width: w, height: h, hexes };
}

function makeCity(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: id, population: 3 };
}

function makeUnit(id, ownerId, q, r, typeId) {
  return {
    id, ownerId, q, r, typeId,
    category: typeId === 'Zwiadowca' ? 'zwiadowca' : 'miecznik',
    hp: 10, ruchLeft: 2, ruchMax: 2,
  };
}

function makeGameData() {
  return {
    // grupa/kosztBudowy: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 -- chooseCityProduction
    // punktuje teraz kandydatów-budynki po BuildingDef.grupa (nie po id), więc fixture
    // musi nieść te pola tak jak realny buildings.json (wartości 1:1 z katalogu).
    buildings: [
      { id: 'mury', nazwa: 'Mury', grupa: 'Wojsko i obrona', kosztBudowy: 35 },
      { id: 'spichlerz', nazwa: 'Spichlerz', grupa: 'Żywność', kosztBudowy: 20 },
      { id: 'studnia', nazwa: 'Studnia', grupa: 'Zdrowie', kosztBudowy: 15 },
      { id: 'koszary', nazwa: 'Koszary', grupa: 'Wojsko i obrona', kosztBudowy: 25 },
    ],
    units: [],
    terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
    aiParams: {},
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map = makeMap(10, 10);
const data = makeGameData();
const diff = loadDifficultyParams(data, 2);

console.log('--- T1: cityStateMilitaryProductionCap ---');
// R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 (2026-09-03): normal 1→3, hard 4→7 -- WYZWALACZ
// właściciela "PM nie są w ogóle wyzwaniem" + KRYTERIUM: hard nie może być NIŻSZY niż normal
// (7>=3 spełnione). Uzasadnienie liczb w city-state-difficulty.ts (garnizon docelowy +
// bufor na falę ofensywną hard); 'easy' celowo nietknięte, poza jawnym zakresem tego tematu.
eq(cityStateMilitaryProductionCap('easy'), null, 'T1a: easy = no cap');
eq(cityStateMilitaryProductionCap('normal'), 3,
  'T1b: normal = 3 (docelowy garnizon wczesnej fazy 2 + bufor 1, R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1)');
eq(cityStateMilitaryProductionCap('hard'), 7,
  'T1c: hard = 7 (docelowy garnizon wczesnej fazy 3 + CS_WAVE_ATTACK_MIN_STACK 3 + '
    + 'RESUP_TIERS[\'strong\'].minGuard 1, R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 -- dawne cap=4 '
    + 'nie mieściło jednocześnie garnizonu i progu bramki wyjścia z domu, patrz '
    + 'cs-military-cap-wiring-test.cjs sekcja 3)');

console.log('\n--- T2: hard MP bez garnizonu → MOŻE Wojownik (pierwszy garnizon, 0 < cap 4) ---');
{
  const city = makeCity('cs_h', 4, 3, 3);
  const pick = chooseCityProduction(
    'cs_h', [city], [], 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'hard', cityBuildings: { cs_h: [] } },
    map, diff,
  );
  // Regresja naprawiona: cap('hard')=0 (stare) blokowało NAWET pierwszy garnizon --
  // PM startowałoby bez obrony na Trudnym. Z cap=4 pierwszy Wojownik (0 < 4) przechodzi.
  eq(pick, 'Wojownik', `T2a: hard 0 military → może pierwszy garnizon (got ${pick})`);
}

console.log('\n--- T3: hard MP z 1 jednostką (< próg garnizonu 3) → wciąż priorytet wojsko/obrona ---');
{
  const city = makeCity('cs_h2', 4, 3, 3);
  const guard = makeUnit('g1', 4, 3, 3, 'Wojownik');
  const pick = chooseCityProduction(
    'cs_h2', [city], [guard], 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'hard', cityBuildings: { cs_h2: ['mury'] } },
    map, diff,
  );
  // R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 (GOAL 2): próg bootstrap infrastruktury podniesiony
  // z "dowolna 1 jednostka" na CS_EARLY_GARRISON_TARGET['hard']=3 -- przy 1/3 garnizonu blok
  // infraBootstrap w ogóle NIE triggeruje (dawniej triggerował już przy 1), więc studnia i
  // reszta infraOrder nie są nawet dodane jako kandydaci. Zamiast tego wygrywa 'koszary'
  // (mid-phase, nieukończone -- mury już zbudowane w tym scenariuszu, więc Palisada nie
  // wchodzi do puli) -- priorytet wojsko/obrona utrzymany aż do progu, zgodnie z GOAL 2.
  // 1 jednostka < cap 7 -- filtr capu z GOAL 1 też nie odcina (dowód capu = T8 niżej).
  eq(pick, 'koszary', `T3a: hard 1/3 garnizonu -- priorytet wojsko/obrona (koszary), nie ekonomia (got ${pick})`);
  eq(countOwnerMilitaryUnits([guard], 4), 1, 'T3b: guard counts as military');
}

console.log('\n--- T4: normal MP po progu garnizonu (2) → wojsko wypada na rzecz obrony/ekonomii ---');
{
  // R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1: próg to teraz CS_EARLY_GARRISON_TARGET['normal']=2
  // (nie "1 dowolna jednostka" jak dawniej) -- stąd DWIE jednostki [guard, guard2].
  const city = makeCity('cs_n', 4, 3, 3);
  const guard = makeUnit('g2', 4, 3, 3, 'Wojownik');
  const guard2 = makeUnit('g2b', 4, 3, 3, 'Wojownik');
  const pick = chooseCityProduction(
    'cs_n', [city], [guard, guard2], 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'normal', cityBuildings: { cs_n: [] } },
    map, diff,
  );
  assert(pick !== 'Wojownik' && pick !== 'Łucznik',
    `T4a: normal at garrison target (2) no more military (got ${pick})`);
}

console.log('\n--- T5: normal MP bez wojska → może Wojownik (bez zmian) ---');
{
  const city = makeCity('cs_n2', 4, 3, 3);
  const pick = chooseCityProduction(
    'cs_n2', [city], [], 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'normal', cityBuildings: { cs_n2: [] } },
    map, diff,
  );
  eq(pick, 'Wojownik', 'T5a: normal 0 military → Wojownik');
}

console.log('\n--- T6: easy vs hard pod zagrożeniem (OBA mogą wojsko -- hard capem 4, 2 < 4) ---');
{
  const city = makeCity('cs_e', 4, 5, 5);
  const enemy = makeUnit('en', 0, 6, 5, 'Wojownik');
  const u1 = makeUnit('e1', 4, 5, 5, 'Wojownik');
  const u2 = makeUnit('e2', 4, 4, 5, 'Łucznik');
  const built = ['mury', 'koszary', 'spichlerz', 'studnia', 'garncarnia', 'stolarnia', 'targowisko'];
  const units = [enemy, u1, u2];
  const pickEasy = chooseCityProduction(
    'cs_e', [city], units, 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'easy', cityBuildings: { cs_e: built } },
    map, diff,
  );
  const pickHard = chooseCityProduction(
    'cs_e', [city], units, 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'hard', cityBuildings: { cs_e: built } },
    map, diff,
  );
  const easyMil = pickEasy === 'Wojownik' || pickEasy === 'Łucznik';
  const hardMil = pickHard === 'Wojownik' || pickHard === 'Łucznik';
  assert(easyMil, `T6a: easy under threat may queue military (got ${pickEasy})`);
  // C-025/C-026: Trudna gra → PM MOŻE dokupywać wojsko wobec gracza (dawniej blokowane
  // przez cap('hard')=0 -- regresja naprawiona). Tu 2 jednostki własne < cap 4, więc
  // filtr capu NIE odcina wojska; pod zagrożeniem (underThreat) hard też może budować.
  assert(hardMil, `T6b: hard under threat MOŻE teraz budować wojsko, do capu 4 (got ${pickHard})`);
}

console.log('\n--- T8: hard MP przy capie (7 jednostek, R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1) → nie dokup 8. ---');
{
  // Cap podniesiony 4→7 (patrz T1c) -- boundary-test musi użyć NOWEGO capu, inaczej
  // przy starych 4 jednostkach (< nowy cap 7) filtr capu wcale by nie zadziałał i test
  // przechodziłby przypadkiem dzięki scoringowi ekonomii/koszar, nie dzięki capowi
  // (dowód nietautologiczności: bez tej poprawki 4 jednostki nie testują już capu).
  const city = makeCity('cs_h3', 4, 3, 3);
  const units = [
    makeUnit('h1', 4, 3, 3, 'Wojownik'),
    makeUnit('h2', 4, 2, 3, 'Wojownik'),
    makeUnit('h3', 4, 2, 2, 'Wojownik'),
    makeUnit('h4', 4, 3, 2, 'Wojownik'),
    makeUnit('h5', 4, 3, 4, 'Wojownik'),
    makeUnit('h6', 4, 4, 3, 'Wojownik'),
    makeUnit('h7', 4, 4, 2, 'Wojownik'),
  ];
  const pick = chooseCityProduction(
    'cs_h3', [city], units, 4, data, ZERO,
    { defensiveCopy: true, cityStateDifficultyVsPlayer: 'hard', cityBuildings: { cs_h3: ['mury'] } },
    map, diff,
  );
  eq(countOwnerMilitaryUnits(units, 4), 7, 'T8a: 7 units counted as military');
  assert(pick !== 'Wojownik' && pick !== 'Łucznik',
    `T8b: hard at cap (7) no more military (got ${pick})`);
}

console.log('\n--- T7: absorption params easy/normal/hard ---');
const easyP = aiCsAbsorptionParams('easy');
const normalP = aiCsAbsorptionParams('normal');
const hardP = aiCsAbsorptionParams('hard');
assert(hardP.trybutAccept >= 0.99, `T7a: hard trybutAccept≥0.99 (${hardP.trybutAccept})`);
assert(hardP.wasalAccept >= 0.99, `T7b: hard wasalAccept≥0.99 (${hardP.wasalAccept})`);
assert(normalP.trybutAccept > easyP.trybutAccept && normalP.trybutAccept < hardP.trybutAccept,
  'T7c: normal trybut between easy and hard');
assert(normalP.minTurn > hardP.minTurn && normalP.minTurn < easyP.minTurn,
  'T7d: normal minTurn between hard and easy');
assert(rollAiCsAccept('trybut', hardP, () => 0.98), 'T7e: hard accept at rng 0.98');
assert(!rollAiCsAccept('trybut', easyP, () => 0.99), 'T7f: easy reject at rng 0.99');

console.log(`\n=== ai-mp-military-cap-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
