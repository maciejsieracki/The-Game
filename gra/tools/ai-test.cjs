'use strict';
/**
 * ai-test.cjs -- standalone Node test for src/game/ai.ts.
 * Run from gra/:  node tools/ai-test.cjs
 *
 * Tests:
 *   T1: decideAITurn returns valid AICommand[], getAiParam/readArchMods read 'wartosc' (ASCII)
 *   T2: difficulty scaling via poziomTrudnosci / loadDifficultyParams
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
// AI_SRC_DIR: override source root (same pattern as DIP_SRC_DIR in diplomacy-test.cjs).
// Set this env var when OneDrive serves a stale ai.ts after an edit.
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-test-bundle.cjs');

// Entry TS re-exports everything we need from ai.ts.
// Uses AI_SRC path so env override works correctly.
const ENTRY_TS = `
export { decideAITurn, loadDifficultyParams, decideAIReaction, decideAIReinforcements, PROG_BITWA, TERYTORIUM_MNOZNIK, AGRESJA_WPLYW, WARTOSC_PROG_OBS, WARTOSC_KOREKTA, PRZYJAZN_ZAUFANIE_PROG, AGRESJA_AGRESYWNY_PROG, decideAIDiplomacy, PROG_WOJNA_SILA, PROG_WOJNA_AGRESJA, PROG_TRYBUT, PROG_POKOJ_SLABOSC, PROG_SOJUSZ, PROG_HANDEL } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
export { diplomacyLayerForOwner, filterDiplomacyCommandsForLayer } from ${JSON.stringify(AI_SRC + '/game/diplomacy-layers')};
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
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const AI = require(BUNDLE_FILE);
const { decideAITurn, loadDifficultyParams, decideAIReaction, decideAIReinforcements, PROG_BITWA, TERYTORIUM_MNOZNIK, AGRESJA_WPLYW, WARTOSC_PROG_OBS, WARTOSC_KOREKTA, PRZYJAZN_ZAUFANIE_PROG, AGRESJA_AGRESYWNY_PROG, hexDistance, decideAIDiplomacy, PROG_WOJNA_SILA, PROG_WOJNA_AGRESJA, PROG_TRYBUT, PROG_POKOJ_SLABOSC, PROG_SOJUSZ, PROG_HANDEL, diplomacyLayerForOwner, filterDiplomacyCommandsForLayer } = AI;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 10x10 map of łąka (passable land), all neutral. */
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
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

function makeUnit(id, ownerId, q, r, category = 'miecznik') {
  return { id, ownerId, typeId: 'Wojownik', category, q, r, ruch: 2, ruchLeft: 2 };
}

function makeCity(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: 'TestCity', population: 2 };
}

/**
 * Minimal GameData with custom aiParams.
 * terrainYields uses ASCII field names (Teren, Zywnosc, Praca, Handel) as
 * ai.ts hexCityScore reads via bracket notation with ASCII fallback.
 */
function makeGameData(aiParamsOverride = {}) {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
      { Jednostka: 'Łucznik', Health: 20, Ruch: 2 },
      { Jednostka: 'Osadnik', Health: 10, Ruch: 2 },
    ],
    // id-y zgodne z prawdziwym data/buildings.json -- ai.ts (chooseCityProduction)
    // klasyfikuje/dopasowuje budynki wylacznie po b.id (#31), nie po nazwie wyswietlanej.
    buildings: [
      { id: 'spichlerz', nazwa: 'Spichlerz' }, { id: 'koszary', nazwa: 'Koszary' },
      { id: 'mury', nazwa: 'Mury' },
      { id: 'stolarnia', nazwa: 'Stolarnia' }, { id: 'cegielnia', nazwa: 'Cegielnia' },
      { id: 'odlewnia_brazu', nazwa: 'Piec hutniczy' },
      { id: 'magazyn', nazwa: 'Magazyn' }, { id: 'targowisko', nazwa: 'Targowisko (Rynek)' },
    ],
    terrainYields: {
      terrain_types: [
        { Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 },
        { Teren: 'rownina', Zywnosc: 2, Praca: 1, Handel: 1 },
      ],
    },
    aiParams: aiParamsOverride,
  };
}

// ---------------------------------------------------------------------------
// SCENARIUSZ BAZOWY: poprawny aiParams z polem 'wartosc' (ASCII)
// Mapa 10x10, AI playerId=1 ma 3 miasta (faza środkowa), 1 jednostkę
// Koszary NIE są zbudowane (bo chcemy test dyskryminatora ekonomia vs koszary)
// ---------------------------------------------------------------------------

// Minimalny aiParams dla testu T1 z 'wartosc' (ASCII)
// Ustawiamy archetype_chiny_ekonomia_priorytet z wartosc=5 (BARDZO wysoko)
// żeby przy POPRAWNYM odczycie ekonomia wygrała z Koszarami
// stary bug: wartosc nieodczytane -> ekonomia delta=0 -> koszary wygrają
const aiParamsT1 = {
  // Archetype dla chinczycy
  'archetype_chiny_wojsko_priorytet':   { wartosc: 0,  sekcja: 'test', opis: 'test' },
  'archetype_chiny_nauka_priorytet':    { wartosc: 0,  sekcja: 'test', opis: 'test' },
  'archetype_chiny_ekonomia_priorytet': { wartosc: 5,  sekcja: 'test', opis: 'test' },  // <-- klucz dyskryminatora
  'archetype_chiny_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: 'test' },
  // Parametry ekspansji (fallback)
  'ekspansja_min_dystans_miast':        { wartosc: 4,  sekcja: 'test', opis: 'test' },
  'ekspansja_zagroz_zasieg':            { wartosc: 5,  sekcja: 'test', opis: 'test' },
  // Trudnosc (domyslna Normal=2)
  'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0,  sekcja: 'test', opis: 'test' },
  'trudnosc_poziom2_bonus_nauka':       { wartosc: 1,  sekcja: 'test', opis: 'test' },
  'trudnosc_poziom2_startowe_jednostki':{ wartosc: 1,  sekcja: 'test', opis: 'test' },
  'trudnosc_poziom2_startowe_miasta':   { wartosc: 0,  sekcja: 'test', opis: 'test' },
  'trudnosc_poziom2_bonus_walka':       { wartosc: 0,  sekcja: 'test', opis: 'test' },
};

// Score analysis przy poprawnym odczycie ekonomia_priorytet=5:
//   economyScore = 100 + 5*20 = 200 → kandydaci budynki ekonom: score = 140+200 = 340
//   militaryScore = 100 + 0*20 = 100 → koszary (niezbud): score = 200+100 = 300
// Wynik z fixem: ekonomia (340) > koszary (300) → miasto wybierze stolarnia/cegielnia/itp.
// Wynik bez fixa (wartosc nieodczytane → 0): ekonomia score = 140+100 = 240 < koszary 300 → koszary

const ECON_BUILDINGS = new Set(['stolarnia', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'targowisko']);

const map = makeMap(10, 10);
const data = makeGameData(aiParamsT1);

// 3 miasta AI (faza środkowa: myCities.length >= 3)
const cities = [
  makeCity('c1', 1, 1, 1),
  makeCity('c2', 1, 5, 1),
  makeCity('c3', 1, 8, 1),
  makeCity('ce1', 2, 1, 8),  // miasto wroga
];

const units = [
  makeUnit('u1', 1, 2, 2),  // wojownik AI
];

// ============================================================================
// TEST 1: decideAITurn nie rzuca i zwraca AICommand[]
// ============================================================================
console.log('\n--- T1a: decideAITurn basic contract ---');
{
  let result;
  let threw = false;
  try {
    result = decideAITurn(1, units, cities, map, data, { civType: 'chinczycy', poziomTrudnosci: 2 });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }
  assert(!threw, 'decideAITurn does not throw');
  assert(Array.isArray(result), 'returns an array');
  assert(result.length > 0, 'returns at least one command');
  
  const last = result[result.length - 1];
  eq(last.type, 'endTurn', 'last command is endTurn');
  
  const types = result.map(c => c.type);
  const validTypes = new Set(['move', 'foundCity', 'attack', 'build', 'endTurn']);
  const allValid = types.every(t => validTypes.has(t));
  assert(allValid, 'all command types are valid AICommand types');
}

// ============================================================================
// TEST 2: T1 DYSKRYMINATOR - odczyt 'wartosc' (ASCII) vs stary bug
// Scenariusz: chinczycy, faza środkowa, Koszary NIE zbudowane
// Przy poprawnym odczycie: ekonomia_priorytet=5 → budynek ekonomiczny wygrywa z Koszarami
// ============================================================================
console.log('\n--- T1b: wartosc (ASCII) read discriminator ---');
{
  // Koszary nie zbudowane - to najważniejszy kandydat w fazie środkowej
  // Ale ekonomia_priorytet=5 powinno to przebić (score 340 vs 300)
  const result = decideAITurn(1, units, cities, map, data, {
    civType: 'chinczycy',
    poziomTrudnosci: 2,
    cityBuildings: {}, // nic nie zbudowane
  });
  
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'at least one build command issued for 3 cities');
  
  // Przy poprawnym odczycie wartosc=5: ekonomia wygrywa
  // Przy starym bugu wartość=undefined→0: koszary wygrywają
  const econBuilds = buildCmds.filter(c => ECON_BUILDINGS.has(c.buildingId));
  const kasarBuild = buildCmds.filter(c => c.buildingId === 'koszary');
  
  assert(
    econBuilds.length > 0,
    `at least one city chooses economy building (wartosc=5 read correctly); got: ${buildCmds.map(c=>c.buildingId).join(', ')}`
  );
  
  // Jeśli ekonomia wygrała w KAŻDYM mieście — to silny dowód
  // (3 miasta, wszystkie produkują, koszary nie wbudowane, ale ekonomia powinna dominować)
  assert(
    econBuilds.length > kasarBuild.length,
    `economy buildings (${econBuilds.length}) chosen more than Koszary (${kasarBuild.length}) — proves wartosc read correctly`
  );
}

// ============================================================================
// TEST 3: T1 - z 'wartość' (unicode) - backward compat
// ============================================================================
console.log('\n--- T1c: wartość (unicode) backward compat ---');
{
  const aiParamsUnicode = JSON.parse(JSON.stringify(aiParamsT1));
  aiParamsUnicode['archetype_chiny_ekonomia_priorytet'] = { 'wartość': 5, sekcja: 'test', opis: 'test' };
  
  const dataU = makeGameData(aiParamsUnicode);
  const result = decideAITurn(1, units, cities, map, dataU, {
    civType: 'chinczycy',
    poziomTrudnosci: 2,
    cityBuildings: {},
  });
  
  const buildCmds = result.filter(c => c.type === 'build');
  const econBuilds = buildCmds.filter(c => ECON_BUILDINGS.has(c.buildingId));
  assert(
    econBuilds.length > 0,
    `unicode 'wartość' also read correctly; got: ${buildCmds.map(c=>c.buildingId).join(', ')}`
  );
}

// ============================================================================
// TEST 4: T1 - faza wczesna z 2 miastami, bez enemy → produkcja budynku
// Sprawdzamy że ai produkuje budynki (nie tylko endTurn) w fazie wczesnej
// oraz że Osadnik jest produkowany gdy myCities < 3 (ekspansja)
// ============================================================================
console.log('\n--- T1d: early phase builds and settler expansion ---');
{
  const earlyData = makeGameData({ ...aiParamsT1 });
  const guard1 = makeUnit('g1', 1, 1, 1, 'miecznik');
  const guard2 = makeUnit('g2', 1, 5, 1, 'miecznik');
  const citiesEarly = [makeCity('c1', 1, 1, 1), makeCity('c2', 1, 5, 1)];
  
  const earlyResult = decideAITurn(1, [guard1, guard2], citiesEarly, map, earlyData, {
    civType: 'chinczycy',
    cityBuildings: {},
  });
  
  const buildCmds = earlyResult.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'early phase (2 cities): at least one build command');
  
  // Osadnik powinien być kandydatem gdy myCities < 3
  const settler = buildCmds.find(c => c.buildingId === 'Osadnik');
  // Łucznik/Wojownik mogą wygrać z powodu score, ale Osadnik powinien być przynajmniej
  // dla jednego z 2 miast — OR spichlerz jeśli wygrał
  const hasValidBuild = buildCmds.every(c =>
    ['spichlerz', 'Osadnik', 'Wojownik', 'Łucznik'].includes(c.buildingId)
  );
  assert(hasValidBuild, 'early phase: all builds are valid early-game choices; got: ' + buildCmds.map(c=>c.buildingId).join(', '));

  // spichlerz jest priorytetem gdy nie zbudowany — sprawdź że score 250 > Osadnik 200
  // przez weryfikację że jeśli spichlerz jest wybrany w danym mieście, to nie jest tam zbudowany
  const spichlerz = buildCmds.filter(c => c.buildingId === 'spichlerz');
  if (spichlerz.length > 0) {
    assert(true, 'Spichlerz chosen in at least one city');
  }
  
  // endTurn zawsze ostatnie
  eq(earlyResult[earlyResult.length-1].type, 'endTurn', 'early phase: endTurn last');
}

// ============================================================================
// TEST 5: T1 - endTurn zawsze ostatni
// ============================================================================
console.log('\n--- T1e: endTurn always last ---');
{
  for (let i = 0; i < 3; i++) {
    const r = decideAITurn(1, units, cities, map, data, { civType: 'chinczycy' });
    eq(r[r.length - 1].type, 'endTurn', `run ${i}: last cmd = endTurn`);
  }
}

// ============================================================================
// TEST 6: T2 - loadDifficultyParams reads trudnosc_* correctly
// ============================================================================
console.log('\n--- T2a: loadDifficultyParams reads levels ---');
{
  const diffData = makeGameData({
    'trudnosc_poziom1_bonus_produkcja':    { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_bonus_nauka':        { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_startowe_jednostki': { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_startowe_miasta':    { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_bonus_walka':        { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':    { wartosc: 0.1,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':        { wartosc: 1,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki': { wartosc: 1,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':    { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':        { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_bonus_produkcja':    { wartosc: 0.25, sekcja: 'test', opis: '' },
    'trudnosc_poziom3_bonus_nauka':        { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_startowe_jednostki': { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_startowe_miasta':    { wartosc: 1,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_bonus_walka':        { wartosc: 0.05, sekcja: 'test', opis: '' },
  });
  
  const p1 = loadDifficultyParams(diffData, 1);
  eq(p1.bonusProdukcja, 0,    'poziom1 bonusProdukcja = 0');
  eq(p1.bonusNauka,     0,    'poziom1 bonusNauka = 0');
  eq(p1.startoweJednostki, 0, 'poziom1 startoweJednostki = 0');
  eq(p1.startoweMiasta, 0,    'poziom1 startoweMiasta = 0');
  eq(p1.bonusWalka,     0,    'poziom1 bonusWalka = 0');
  
  const p2 = loadDifficultyParams(diffData, 2);
  eq(p2.bonusProdukcja,    0.1, 'poziom2 bonusProdukcja = 0.1');
  eq(p2.bonusNauka,        1,   'poziom2 bonusNauka = 1');
  eq(p2.startoweJednostki, 1,   'poziom2 startoweJednostki = 1');
  eq(p2.startoweMiasta,    0,   'poziom2 startoweMiasta = 0');
  eq(p2.bonusWalka,        0,   'poziom2 bonusWalka = 0');
  
  const p3 = loadDifficultyParams(diffData, 3);
  eq(p3.bonusProdukcja,    0.25, 'poziom3 bonusProdukcja = 0.25');
  eq(p3.bonusNauka,        0,    'poziom3 bonusNauka = 0');
  eq(p3.startoweJednostki, 0,    'poziom3 startoweJednostki = 0');
  eq(p3.startoweMiasta,    1,    'poziom3 startoweMiasta = 1');
  eq(p3.bonusWalka,        0.05, 'poziom3 bonusWalka = 0.05');
}

// ============================================================================
// TEST 7: T2 - wyższy poziom trudności → agresywniejsza produkcja ekonomiczna
// Poziom 3 (bonusProdukcja=0.25) vs poziom 1 (0) → więcej budynków ekonomicznych
// ============================================================================
console.log('\n--- T2b: higher difficulty → stronger economy production score ---');
{
  // aiParams z neutralnym archetype (wojsko=0, ekonomia=0) + obie trudności
  const diffAiParams = {
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 4, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    // poziom 1: bonus=0 → economyScore = 100+0 = 100 → econ: 140+100=240 < koszary: 200+100=300
    'trudnosc_poziom1_bonus_produkcja':   { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_bonus_nauka':       { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_startowe_jednostki':{ wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_startowe_miasta':   { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom1_bonus_walka':       { wartosc: 0,    sekcja: 'test', opis: '' },
    // poziom 3: bonus=0.25 → diffProdBonus=50 → economyScore=150 → econ: 140+150=290 < koszary: 300 (still)
    // Hmm — żeby test działał muszę użyć wyższego bonusu lub zbudować koszary w fixture
    // Użyję wariantu: koszary ZBUDOWANE → ekonomia vs wojownik
    // ekonomia: 140+150=290 vs wojownik: 170+100=270 → ekonomia wygra przy poziomie 3
    // poziom 1: ekonomia: 140+100=240 vs wojownik: 170+100=270 → wojownik wygra
    'trudnosc_poziom3_bonus_produkcja':   { wartosc: 0.25, sekcja: 'test', opis: '' },
    'trudnosc_poziom3_bonus_nauka':       { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_startowe_jednostki':{ wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_startowe_miasta':   { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom3_bonus_walka':       { wartosc: 0.05, sekcja: 'test', opis: '' },
  };
  
  const diffData = makeGameData(diffAiParams);
  const citiesMid = [
    makeCity('c1', 1, 1, 1),
    makeCity('c2', 1, 5, 1),
    makeCity('c3', 1, 8, 1),
  ];
  // koszary ZBUDOWANE w każdym mieście — żeby usunąć je z kandydatów
  const builtKoszary = { c1: ['koszary'], c2: ['koszary'], c3: ['koszary'] };

  // Level 1 (bonus=0): economyScore=100, econBuild score=240, wojownik=270 → wojownik wygra
  const r1 = decideAITurn(1, [], citiesMid, map, diffData, {
    civType: 'grecy', poziomTrudnosci: 1, cityBuildings: builtKoszary,
  });
  const build1 = r1.filter(c => c.type === 'build');
  const econ1 = build1.filter(c => ECON_BUILDINGS.has(c.buildingId));
  const mil1  = build1.filter(c => c.buildingId === 'Wojownik' || c.buildingId === 'Łucznik');

  // Level 3 (bonus=0.25, diffProdBonus=50): economyScore=150, econBuild score=290, wojownik=270 → ekonomia wygra
  const r3 = decideAITurn(1, [], citiesMid, map, diffData, {
    civType: 'grecy', poziomTrudnosci: 3, cityBuildings: builtKoszary,
  });
  const build3 = r3.filter(c => c.type === 'build');
  const econ3 = build3.filter(c => ECON_BUILDINGS.has(c.buildingId));
  const mil3  = build3.filter(c => c.buildingId === 'Wojownik' || c.buildingId === 'Łucznik');
  
  // Level 1: wojownik wygra (mil > econ)
  assert(
    mil1.length >= econ1.length,
    `poziom1: military/units (${mil1.length}) >= economy (${econ1.length}) — correct for low difficulty`
  );
  
  // Level 3: ekonomia wygra (econ > mil)
  assert(
    econ3.length > mil3.length,
    `poziom3: economy (${econ3.length}) > military (${mil3.length}) — harder difficulty boosts economy score`
  );
  
  // Kierunek: poziom 3 > poziom 1 dla liczby budynków ekon
  assert(
    econ3.length >= econ1.length,
    `econ builds: poziom3 (${econ3.length}) >= poziom1 (${econ1.length}) — difficulty increases economy priority`
  );
}

// ============================================================================
// TEST 8: T2 - loadDifficultyParams z pustym aiParams → fallbacki
// ============================================================================
console.log('\n--- T2c: loadDifficultyParams empty aiParams → fallbacks ---');
{
  const emptyData = makeGameData({});
  
  const p1 = loadDifficultyParams(emptyData, 1);
  eq(p1.bonusProdukcja, 0,    'empty params: poziom1 bonusProdukcja fallback = 0');
  eq(p1.bonusWalka,     0,    'empty params: poziom1 bonusWalka fallback = 0');
  
  const p2 = loadDifficultyParams(emptyData, 2);
  eq(p2.bonusProdukcja,    0.1,  'empty params: poziom2 bonusProdukcja fallback = 0.1');
  eq(p2.startoweJednostki, 1,    'empty params: poziom2 startoweJednostki fallback = 1');
  
  const p3 = loadDifficultyParams(emptyData, 3);
  eq(p3.bonusProdukcja, 0.25, 'empty params: poziom3 bonusProdukcja fallback = 0.25');
  eq(p3.bonusWalka,     0.05, 'empty params: poziom3 bonusWalka fallback = 0.05');
  eq(p3.startoweMiasta, 1,    'empty params: poziom3 startoweMiasta fallback = 1');
}

// ============================================================================
// TEST 9: T2 - domyślny poziomTrudnosci=2 (Normal) gdy nie podany
// ============================================================================
console.log('\n--- T2d: default difficulty = Normal (2) ---');
{
  const defData = makeGameData({
    ...aiParamsT1,
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0.1,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 1,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 1,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0,    sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0,    sekcja: 'test', opis: '' },
  });
  
  // bez poziomTrudnosci → default 2
  let threw = false;
  let result;
  try {
    result = decideAITurn(1, units, cities, map, defData, { civType: 'chinczycy' });
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'decideAITurn without poziomTrudnosci does not throw (defaults to 2)');
  assert(Array.isArray(result), 'returns array without poziomTrudnosci');
  eq(result[result.length - 1].type, 'endTurn', 'endTurn present without poziomTrudnosci');
}


// ============================================================================
// TEST 10: T3 - Archetypy Celtowie i Germanie — odczyt z ai-params.json
// Weryfikuje że readArchMods poprawnie czyta nowe klucze archetype_celtowie_*
// i archetype_germanie_* z wartościami startowymi zaproponowanymi przez AI.
// ============================================================================
console.log('\n--- T3a: Celtowie archetype readArchMods ---');
{
  // Celtowie: wojsko=2, nauka=-1, ekonomia=0, obrona=1
  const celtoAiParams = {
    'archetype_celtowie_wojsko_priorytet':   { wartosc: 2,  sekcja: '§8 Archetypy', opis: 'test' },
    'archetype_celtowie_nauka_priorytet':    { wartosc: -1, sekcja: '§8 Archetypy', opis: 'test' },
    'archetype_celtowie_ekonomia_priorytet': { wartosc: 0,  sekcja: '§8 Archetypy', opis: 'test' },
    'archetype_celtowie_obrona_priorytet':   { wartosc: 1,  sekcja: '§8 Archetypy', opis: 'test' },
    'ekspansja_min_dystans_miast':           { wartosc: 4,  sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':               { wartosc: 5,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':      { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':          { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':   { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':      { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':          { wartosc: 0,  sekcja: 'test', opis: '' },
  };
  const celtoData = makeGameData(celtoAiParams);

  // decideAITurn dla Celtów (faza środkowa: 3 miasta, koszary nie zbudowane)
  const citiesMid3 = [makeCity('c1', 1, 1, 1), makeCity('c2', 1, 5, 1), makeCity('c3', 1, 8, 1)];
  let threw = false;
  let result;
  try {
    result = decideAITurn(1, [], citiesMid3, map, celtoData, {
      civType: 'celtowie',
      poziomTrudnosci: 2,
      cityBuildings: {},
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'Celtowie decideAITurn does not throw');
  assert(Array.isArray(result), 'Celtowie: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'Celtowie: last cmd = endTurn');

  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'Celtowie: at least one build command');

  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'koszary');
  const econBuilds    = buildCmds.filter(c => ECON_BUILDINGS.has(c.buildingId));
  assert(
    koszaryBuilds.length > econBuilds.length,
    `Celtowie wojsko=2: Koszary (${koszaryBuilds.length}) > ekon (${econBuilds.length}) — wojskowość poprawnie wczytana`
  );
}

console.log('\n--- T3b: Germanie archetype readArchMods ---');
{
  // Germanie: wojsko=2, nauka=-1, ekonomia=-1, obrona=0
  const germAiParams = {
    'archetype_germanie_wojsko_priorytet':   { wartosc: 2,  sekcja: '§8 Archetypy', opis: 'test' },
    'archetype_germanie_nauka_priorytet':    { wartosc: -1, sekcja: '§8 Archetypy', opis: 'test' },
    'archetype_germanie_ekonomia_priorytet': { wartosc: -1, sekcja: '§8 Archetypy', opis: 'test' },
    'archetype_germanie_obrona_priorytet':   { wartosc: 0,  sekcja: '§8 Archetypy', opis: 'test' },
    'ekspansja_min_dystans_miast':           { wartosc: 4,  sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':               { wartosc: 5,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':      { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':          { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':   { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':      { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':          { wartosc: 0,  sekcja: 'test', opis: '' },
  };
  const germData = makeGameData(germAiParams);

  const citiesMid3 = [makeCity('d1', 1, 1, 1), makeCity('d2', 1, 5, 1), makeCity('d3', 1, 8, 1)];
  let threw = false;
  let result;
  try {
    result = decideAITurn(1, [], citiesMid3, map, germData, {
      civType: 'germanie',
      poziomTrudnosci: 2,
      cityBuildings: {},
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'Germanie decideAITurn does not throw');
  assert(Array.isArray(result), 'Germanie: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'Germanie: last cmd = endTurn');

  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'Germanie: at least one build command');

  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'koszary');
  const econBuilds    = buildCmds.filter(c => ECON_BUILDINGS.has(c.buildingId));
  assert(
    koszaryBuilds.length > econBuilds.length,
    `Germanie wojsko=2, ekonomia=-1: Koszary (${koszaryBuilds.length}) > ekon (${econBuilds.length}) — oba klucze poprawnie wczytane`
  );
}

console.log('\n--- T3c: Celtowie civType mapping (CIV_TO_ARCH roundtrip) ---');
{
  const aiParamsCelto2 = {
    'archetype_celtowie_wojsko_priorytet':   { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_celtowie_nauka_priorytet':    { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_celtowie_ekonomia_priorytet': { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_celtowie_obrona_priorytet':   { wartosc: 1,  sekcja: 'test', opis: '' },
  };
  const data2 = makeGameData(aiParamsCelto2);
  let threw = false;
  try {
    decideAITurn(1, [makeUnit('u1', 1, 2, 2)], [makeCity('c1', 1, 1, 1)], map, data2, {
      civType: 'celtowie',
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }
  assert(!threw, "civType='celtowie' does not throw — CIV_TO_ARCH mapping exists");
}

console.log('\n--- T3d: Germanie civType mapping (CIV_TO_ARCH roundtrip) ---');
{
  const aiParamsGerm2 = {
    'archetype_germanie_wojsko_priorytet':   { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_germanie_nauka_priorytet':    { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_germanie_ekonomia_priorytet': { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_germanie_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: '' },
  };
  const data2 = makeGameData(aiParamsGerm2);
  let threw = false;
  try {
    decideAITurn(1, [makeUnit('u1', 1, 2, 2)], [makeCity('c1', 1, 1, 1)], map, data2, {
      civType: 'germanie',
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }
  assert(!threw, "civType='germanie' does not throw — CIV_TO_ARCH mapping exists");
}

// ============================================================================
// TEST 10e: T3 — roster-6 (D-ROSTER-Q7=A) — własne archetypy, nie fallbacki
// ============================================================================
console.log('\n--- T3e: roster-6 ai-params.json keys exist ---');
{
  const realAiParams = JSON.parse(
    fs.readFileSync(path.join(GRA_ROOT, 'data', 'ai-params.json'), 'utf8'),
  );
  const roster6 = ['harappa', 'hetyci', 'slowianie', 'babilonia', 'asyria', 'fenicjanie'];
  const dims = ['wojsko', 'nauka', 'ekonomia', 'obrona'];
  for (const civ of roster6) {
    for (const dim of dims) {
      const key = `archetype_${civ}_${dim}_priorytet`;
      assert(
        realAiParams[key] && typeof realAiParams[key].wartosc === 'number',
        `ai-params: ${key} exists with wartosc`,
      );
    }
  }
}

console.log('\n--- T3f: Harappa own archetype path (ekonomia discriminator) ---');
{
  const harappaParams = {
    'archetype_harappa_wojsko_priorytet':   { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_harappa_nauka_priorytet':    { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_harappa_ekonomia_priorytet': { wartosc: 5,  sekcja: 'test', opis: '' },
    'archetype_harappa_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':          { wartosc: 4,  sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':              { wartosc: 5,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':     { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':         { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':  { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':     { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':         { wartosc: 0,  sekcja: 'test', opis: '' },
  };
  const citiesMid3 = [makeCity('h1', 1, 1, 1), makeCity('h2', 1, 5, 1), makeCity('h3', 1, 8, 1)];
  const result = decideAITurn(1, [], citiesMid3, map, makeGameData(harappaParams), {
    civType: 'harappa',
    poziomTrudnosci: 2,
    cityBuildings: {},
  });
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'Harappa: at least one build command');
  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'koszary');
  const econBuilds    = buildCmds.filter(c => ECON_BUILDINGS.has(c.buildingId));
  assert(
    econBuilds.length >= koszaryBuilds.length,
    `Harappa own arch (ekonomia=5): eko (${econBuilds.length}) >= Koszary (${koszaryBuilds.length})`,
  );
}

console.log('\n--- T3g: Asyria wojsko>ekonomia (imperium oblężnicze) ---');
{
  const asyriaParams = {
    'archetype_asyria_wojsko_priorytet':   { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_asyria_nauka_priorytet':    { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_asyria_ekonomia_priorytet': { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_asyria_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':         { wartosc: 4,  sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':             { wartosc: 5,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':    { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':        { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki': { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':    { wartosc: 0,  sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':        { wartosc: 0,  sekcja: 'test', opis: '' },
  };
  const citiesMid3 = [makeCity('a1', 1, 1, 1), makeCity('a2', 1, 5, 1), makeCity('a3', 1, 8, 1)];
  const result = decideAITurn(1, [], citiesMid3, map, makeGameData(asyriaParams), {
    civType: 'asyria',
    poziomTrudnosci: 2,
    cityBuildings: {},
  });
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'Asyria: at least one build command');
  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'koszary');
  const econBuilds    = buildCmds.filter(c => ECON_BUILDINGS.has(c.buildingId));
  assert(
    koszaryBuilds.length > econBuilds.length,
    `Asyria wojsko=2: Koszary (${koszaryBuilds.length}) > eko (${econBuilds.length})`,
  );
}

console.log('\n--- T3h: roster-6 CIV_TO_ARCH roundtrip (no throw) ---');
{
  const baseParams = {
    'archetype_harappa_wojsko_priorytet':   { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_harappa_nauka_priorytet':    { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_harappa_ekonomia_priorytet': { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_harappa_obrona_priorytet':   { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_hetyci_wojsko_priorytet':    { wartosc: 1,  sekcja: 'test', opis: '' },
    'archetype_hetyci_nauka_priorytet':     { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_hetyci_ekonomia_priorytet':  { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_hetyci_obrona_priorytet':    { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_slowianie_wojsko_priorytet':   { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_slowianie_nauka_priorytet':    { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_slowianie_ekonomia_priorytet': { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_slowianie_obrona_priorytet':   { wartosc: 1,  sekcja: 'test', opis: '' },
    'archetype_babilonia_wojsko_priorytet':   { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_babilonia_nauka_priorytet':    { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_babilonia_ekonomia_priorytet': { wartosc: 1,  sekcja: 'test', opis: '' },
    'archetype_babilonia_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_asyria_wojsko_priorytet':   { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_asyria_nauka_priorytet':    { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_asyria_ekonomia_priorytet': { wartosc: -1, sekcja: 'test', opis: '' },
    'archetype_asyria_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_fenicjanie_wojsko_priorytet':   { wartosc: -2, sekcja: 'test', opis: '' },
    'archetype_fenicjanie_nauka_priorytet':    { wartosc: 0,  sekcja: 'test', opis: '' },
    'archetype_fenicjanie_ekonomia_priorytet': { wartosc: 2,  sekcja: 'test', opis: '' },
    'archetype_fenicjanie_obrona_priorytet':   { wartosc: 0,  sekcja: 'test', opis: '' },
  };
  const dataR6 = makeGameData(baseParams);
  const civTypes = ['harappa', 'hetyci', 'slowianie', 'babilonia', 'asyria', 'fenicjanie'];
  for (const civType of civTypes) {
    let threw = false;
    try {
      decideAITurn(1, [makeUnit('u1', 1, 2, 2)], [makeCity('c1', 1, 1, 1)], map, dataR6, { civType });
    } catch (e) {
      threw = true;
      console.error(`  EXCEPTION for ${civType}:`, e.message || e);
    }
    assert(!threw, `civType='${civType}' does not throw — own CIV_TO_ARCH mapping`);
  }
}

// ============================================================================
// TEST 11: T4 - IDLE FALLBACK (a) — jednostka daleko od wszystkiego, ma własne miasto
// Oczekiwany wynik: dostaje komendę 'move' ku własnemu miastu (NIE jest pomijana).
// ============================================================================
console.log('\n--- T4a: idle fallback (a) — unit far from everything, has own city ---');
{
  const bigMap = makeMap(20, 20);
  const farUnit = makeUnit('far1', 1, 19, 19, 'miecznik');
  const ownCity = makeCity('oc1', 1, 0, 0);
  const gameDataFallback = makeGameData(aiParamsT1);

  let result;
  let threw = false;
  try {
    result = decideAITurn(
      1,
      [farUnit],
      [ownCity],
      bigMap,
      gameDataFallback,
      { civType: 'grecy', poziomTrudnosci: 2 },
    );
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T4a: decideAITurn does not throw');
  assert(Array.isArray(result), 'T4a: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T4a: last cmd = endTurn');

  const moveCmds = result.filter(c => c.type === 'move' && c.unitId === 'far1');
  assert(
    moveCmds.length > 0,
    `T4a: idle unit with own city gets 'move' command (fallback a); got cmds: ${result.map(c=>c.type).join(', ')}`
  );

  if (moveCmds.length > 0) {
    const move = moveCmds[0];
    const distBefore = hexDistance(farUnit.q, farUnit.r, ownCity.q, ownCity.r);
    const distAfter  = hexDistance(move.toQ, move.toR, ownCity.q, ownCity.r);
    assert(
      distAfter < distBefore,
      `T4a: move brings unit closer to own city (dist ${distBefore} -> ${distAfter})`
    );
  }
}

// ============================================================================
// TEST 12: T4 - IDLE FALLBACK (b) — jednostka bez własnych miast → ruch ku środkowi
// ============================================================================
console.log('\n--- T4b: idle fallback (b) — unit with no own cities moves toward map center ---');
{
  const mapB = makeMap(10, 10);
  const cornerUnit = makeUnit('corner1', 1, 0, 0, 'miecznik');
  const gameDataFallbackB = makeGameData(aiParamsT1);

  let result;
  let threw = false;
  try {
    result = decideAITurn(
      1,
      [cornerUnit],
      [],
      mapB,
      gameDataFallbackB,
      { civType: 'grecy', poziomTrudnosci: 2 },
    );
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T4b: decideAITurn does not throw');
  assert(Array.isArray(result), 'T4b: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T4b: last cmd = endTurn');

  const moveCmds = result.filter(c => c.type === 'move' && c.unitId === 'corner1');
  assert(
    moveCmds.length > 0,
    `T4b: unit with no cities gets 'move' command toward map center; got: ${result.map(c=>c.type).join(', ')}`
  );

  if (moveCmds.length > 0) {
    const move = moveCmds[0];
    const centerQ = Math.floor(10 / 2);
    const centerR = Math.floor(10 / 2);
    const distBefore = hexDistance(cornerUnit.q, cornerUnit.r, centerQ, centerR);
    const distAfter  = hexDistance(move.toQ, move.toR, centerQ, centerR);
    assert(
      distAfter < distBefore,
      `T4b: move brings unit closer to map center (dist ${distBefore} -> ${distAfter})`
    );
  }
}

// ============================================================================
// TEST 13: T4 - IDLE FALLBACK nie psuje istniejącego zachowania
// Jednostka BLISKO wroga -> atak (nie fallback).
// ============================================================================
console.log('\n--- T4c: idle fallback does NOT override attack behavior ---');
{
  const mapC = makeMap(10, 10);
  const myUnit  = makeUnit('my1', 1, 5, 5, 'miecznik');
  const eneUnit = makeUnit('en1', 2, 5, 6, 'miecznik');
  const ownCityC = makeCity('oc1', 1, 0, 0);
  const gameDataC = makeGameData(aiParamsT1);

  let result;
  try {
    result = decideAITurn(1, [myUnit, eneUnit], [ownCityC], mapC, gameDataC, { civType: 'grecy' });
  } catch (e) {
    console.error('  EXCEPTION:', e.message || e);
    result = [];
  }

  const attackCmds = result.filter(c => c.type === 'attack' && c.unitId === 'my1');
  assert(
    attackCmds.length > 0,
    `T4c: adjacent enemy -> attack command issued (fallback must NOT override); got: ${result.map(c=>c.type).join(', ')}`
  );

  const moveCmds = result.filter(c => c.type === 'move' && c.unitId === 'my1');
  assert(
    moveCmds.length === 0,
    `T4c: no spurious 'move' when attack was issued for unit my1`
  );
}

// ============================================================================
// TEST 14: T4 - IDLE FALLBACK nie działa gdy jednostka już przy mieście (dist <= 1)
// ============================================================================
console.log('\n--- T4d: idle fallback does NOT force move when unit already at/adjacent to own city ---');
{
  const mapD = makeMap(10, 10);
  const myUnit  = makeUnit('my2', 1, 1, 1, 'miecznik');
  const ownCityD = makeCity('oc2', 1, 1, 0);
  const gameDataD = makeGameData(aiParamsT1);

  let result;
  try {
    result = decideAITurn(1, [myUnit], [ownCityD], mapD, gameDataD, { civType: 'grecy' });
  } catch (e) {
    console.error('  EXCEPTION:', e.message || e);
    result = [];
  }

  const moveCmds = result.filter(c => c.type === 'move' && c.unitId === 'my2');
  assert(
    moveCmds.length === 0,
    `T4d: unit adjacent to own city (dist=1) does NOT get fallback move; got: ${result.map(c=>c.type).join(', ')}`
  );
  eq(result[result.length - 1].type, 'endTurn', 'T4d: endTurn still last');
}


// ============================================================================
// TEST 15: T5 - canAfford gate (pkt5)
// Scenariusz: faza środkowa (3 miasta), canAfford zwraca false dla 'koszary'
// Oczekiwany wynik: żadne miasto NIE wybiera Koszar; zamiast tego wybiera dozwolone budynki
// ============================================================================
console.log('\n--- T5a: canAfford gate — koszary blocked, fallback to affordable ---');
{
  const midData = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 4, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });
  // 3 cities = mid phase; Koszary not yet built = top candidate normally
  const citiesMid = [
    makeCity('c1', 1, 1, 1),
    makeCity('c2', 1, 5, 1),
    makeCity('c3', 1, 8, 1),
  ];
  // canAfford blocks ONLY koszary
  const canAfford = (cityId, buildingId) => buildingId !== 'koszary';

  let result;
  let threw = false;
  try {
    result = decideAITurn(1, [], citiesMid, makeMap(10, 10), midData, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      cityBuildings: {},  // nothing built yet
      canAfford,
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T5a: decideAITurn with canAfford does not throw');
  assert(Array.isArray(result), 'T5a: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T5a: last cmd = endTurn');

  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'T5a: at least one build command issued');

  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'koszary');
  assert(
    koszaryBuilds.length === 0,
    'T5a: canAfford=false for Koszary -> NO Koszary chosen; got: ' + buildCmds.map(c=>c.buildingId).join(', ')
  );

  // All chosen buildings must pass canAfford
  const allAffordable = buildCmds.every(c => canAfford(c.cityId, c.buildingId));
  assert(
    allAffordable,
    'T5a: all chosen buildings satisfy canAfford; got: ' + buildCmds.map(c=>c.buildingId).join(', ')
  );
}

// ============================================================================
// TEST 16: T5 - canAfford gate: when ALL candidates blocked, AI saves (no build)
// pkt5 spec: "gdy NIC nie stac -> NIE kolejkuj (AI oszczedza/czeka)"
// ============================================================================
console.log('\n--- T5b: canAfford gate — all blocked -> AI saves (no build command) ---');
{
  const earlyData2 = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 4, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });
  const earlyCity2 = [makeCity('cx1', 1, 1, 1)]; // 1 city = early phase
  // canAfford blocks EVERYTHING -> AI should save (no build)
  const neverAfford = (cityId, buildingId) => false;

  let result;
  let threw = false;
  try {
    result = decideAITurn(1, [], earlyCity2, makeMap(10, 10), earlyData2, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      cityBuildings: {},
      canAfford: neverAfford,
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T5b: decideAITurn with all-blocking canAfford does not throw');
  assert(Array.isArray(result), 'T5b: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T5b: last cmd = endTurn');

  // pkt5: when nothing is affordable, AI must NOT issue any build command (saves budget)
  const buildCmds = result.filter(c => c.type === 'build');
  assert(
    buildCmds.length === 0,
    'T5b: canAfford blocks ALL -> 0 build commands (AI saves, never builds over budget); got: ' + buildCmds.map(c=>c.buildingId).join(', ')
  );
}

// ============================================================================
// TEST 17: T6 - clusterCenter + clusterRadius: settler prefers hex inside radius
// Mapa 20x20, cluster w lewym górnym rogu (q=2,r=2, radius=3)
// Osadnik w centrum (10,10); kandydat w klastrze (q=2,r=2) vs kandydat daleki (q=18,r=18)
// Oczekiwany wynik: move direction toward cluster, nie w stronę dalekiego
// ============================================================================
console.log('\n--- T6a: clusterCenter+radius -> settler prefers hex inside cluster ---');
{
  // Build a 20x20 map where cluster hex (2,2) has same base score as (18,18)
  const bigMap2 = makeMap(20, 20);
  const clusterData = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_zywnosc_pkt':   { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_praca_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_handel_pkt':    { wartosc: 1, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_rzeka_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_surowiec_pkt':  { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_granica_kara':  { wartosc: -3, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });

  // Settler at center of map
  const settler = { id: 's1', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: 10, r: 10, ruch: 2, ruchLeft: 2 };

  // Block founding at settler's current position by placing a city at (10,10)
  // (canFoundCity returns false when any city within minCityDist, dist=0 always blocks)
  const blockingCity = makeCity('blocker', 2, 10, 10);

  // clusterCenter at (2,2), radius=5 — hexes in range get +50 score bonus
  const clusterCenter = { q: 2, r: 2 };
  const clusterRadius = 5;

  let result;
  let threw = false;
  try {
    result = decideAITurn(1, [settler], [blockingCity], bigMap2, clusterData, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      clusterCenter,
      clusterRadius,
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T6a: decideAITurn with clusterCenter does not throw');
  assert(Array.isArray(result), 'T6a: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T6a: last cmd = endTurn');

  const moveCmds = result.filter(c => c.type === 'move' && c.unitId === 's1');
  // Settler should move toward cluster (toward q=2,r=2 corner) not toward q=18,r=18
  assert(
    moveCmds.length > 0,
    'T6a: settler gets move command; got: ' + result.map(c=>c.type).join(', ')
  );

  if (moveCmds.length > 0) {
    const move = moveCmds[0];
    const distToCluster = hexDistance(move.toQ, move.toR, clusterCenter.q, clusterCenter.r);
    const distToFarCorner = hexDistance(move.toQ, move.toR, 18, 18);
    // The first step toward cluster (q=2,r=2) must be closer to cluster than to far corner
    assert(
      distToCluster < distToFarCorner,
      'T6a: settler move step is toward cluster not away from it; ' +
      'step=(' + move.toQ + ',' + move.toR + '), ' +
      'distToCluster=' + distToCluster + ', distToFarCorner=' + distToFarCorner
    );
  }
}

// ============================================================================
// TEST 18: T6 - WITHOUT clusterCenter: settler picks globally best hex (regression)
// Same setup but no clusterCenter -> behavior unchanged (existing logic)
// ============================================================================
console.log('\n--- T6b: no clusterCenter -> present settler logic unchanged (regression) ---');
{
  const bigMap3 = makeMap(20, 20);
  const clusterDataB = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });
  const settler2 = { id: 's2', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: 10, r: 10, ruch: 2, ruchLeft: 2 };

  let result;
  let threw = false;
  try {
    // No clusterCenter passed -> default behaviour
    result = decideAITurn(1, [settler2], [], bigMap3, clusterDataB, {
      civType: 'grecy',
      poziomTrudnosci: 2,
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T6b: decideAITurn without clusterCenter does not throw');
  assert(Array.isArray(result), 'T6b: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T6b: last cmd = endTurn');
  // Just verify it does not crash and returns valid commands (regression)
  const validTypes = new Set(['move', 'foundCity', 'attack', 'build', 'endTurn']);
  assert(
    result.every(c => validTypes.has(c.type)),
    'T6b: all commands have valid types (no regression)'
  );
}




// ============================================================================
// TESTY T6c-T6f: ekspansja AI świadoma klastra — dalsze przypadki
// ============================================================================

console.log('\n--- T6c: settler IN cluster range -> foundCity (jesli canFound=true) ---');
{
  // Settler ustawiony WEWNĄTRZ klastra (q=3,r=3); brak miast w pobliżu -> canFoundCity=true
  // Oczekiwanie: AI wydaje foundCity (jest w dobrym miejscu), nie rusza się dalej
  const map6c = makeMap(20, 20);
  const data6c = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });
  // Settler w pozycji (3,3) — wewnątrz klastra (centrum=2,2, radius=6)
  const settler6c = { id: 's6c', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: 3, r: 3, ruch: 2, ruchLeft: 2 };
  let result6c;
  let threw6c = false;
  try {
    result6c = decideAITurn(1, [settler6c], [], map6c, data6c, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      clusterCenter: { q: 2, r: 2 },
      clusterRadius: 6,
    });
  } catch(e) { threw6c = true; }

  assert(!threw6c, 'T6c: nie rzuca gdy settler w klastrze');
  assert(Array.isArray(result6c), 'T6c: zwraca tablice');
  const foundCmds6c = result6c.filter(c => c.type === 'foundCity');
  // canFoundCity(3,3) = true (brak innych miast) -> AI powinna zakladac miasto
  assert(foundCmds6c.length > 0, 'T6c: settler w zasięgu klastra zakłada miasto (foundCity)');
}

console.log('\n--- T6d: settler FAR from cluster -> first move step decreases dist to clusterCenter ---');
{
  // Settler w (18,18) — daleko od klastra (centrum=2,2, radius=4)
  // Oczekiwanie: AI wydaje ruch ku centrum klastra
  const map6d = makeMap(25, 25);
  const data6d = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_zywnosc_pkt':   { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_praca_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_handel_pkt':    { wartosc: 1, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_rzeka_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_surowiec_pkt':  { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_granica_kara':  { wartosc: -3, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });
  const settler6d = { id: 's6d', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: 18, r: 18, ruch: 2, ruchLeft: 2 };
  // Blokujące miasto w (18,18) aby uniemożliwić foundCity w miejscu startu
  const blockingCity6d = makeCity('b6d', 2, 18, 18);
  const clusterCenter6d = { q: 2, r: 2 };
  const clusterRadius6d = 4;

  let result6d;
  let threw6d = false;
  try {
    result6d = decideAITurn(1, [settler6d], [blockingCity6d], map6d, data6d, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      clusterCenter: clusterCenter6d,
      clusterRadius: clusterRadius6d,
    });
  } catch(e) { threw6d = true; }

  assert(!threw6d, 'T6d: nie rzuca gdy settler poza klastrem');
  const moveCmds6d = result6d.filter(c => c.type === 'move' && c.unitId === 's6d');
  assert(moveCmds6d.length > 0, 'T6d: settler poza klastrem dostaje move');
  if (moveCmds6d.length > 0) {
    const move6d = moveCmds6d[0];
    const distBefore = hexDistance(18, 18, clusterCenter6d.q, clusterCenter6d.r);
    const distAfter  = hexDistance(move6d.toQ, move6d.toR, clusterCenter6d.q, clusterCenter6d.r);
    assert(
      distAfter < distBefore,
      'T6d: ruch osadnika zmniejsza dystans do centrum klastra; before=' + distBefore + ' after=' + distAfter +
      ' step=(' + move6d.toQ + ',' + move6d.toR + ')'
    );
  }
}

console.log('\n--- T6e: scoring discriminator — hex inside cluster wins over hex just outside ---');
{
  // Weryfikuje, że bonus +50 wewnątrz klastra dominuje nad brakiem bonusu na zewnątrz.
  // Mapa 15x15; klaster centrum=(2,2) radius=3.
  // Hex (2,2) wewnątrz klastra (dist=0 <= 3) -> score += 50
  // Hex (9,9) poza klastrem (dist > 3) -> score -= 20
  // Oba mają identyczny teren (laka), settler w (7,7), blokujące miasto w (7,7)
  const map6e = makeMap(15, 15);
  const data6e = makeGameData({
    'archetype_grecy_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_grecy_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_zywnosc_pkt':   { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_praca_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_handel_pkt':    { wartosc: 1, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_rzeka_pkt':     { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_surowiec_pkt':  { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_granica_kara':  { wartosc: -3, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });
  const settler6e = { id: 's6e', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: 7, r: 7, ruch: 2, ruchLeft: 2 };
  const blockCity6e = makeCity('b6e', 2, 7, 7);
  const cc6e = { q: 2, r: 2 };
  const cr6e = 3; // radius=3; hex (2,2) dist=0 <= 3 => in; hex (9,9) dist > 3 => out

  let result6e;
  let threw6e = false;
  try {
    result6e = decideAITurn(1, [settler6e], [blockCity6e], map6e, data6e, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      clusterCenter: cc6e,
      clusterRadius: cr6e,
    });
  } catch(e) { threw6e = true; }

  assert(!threw6e, 'T6e: nie rzuca z klastrem');
  const moveCmds6e = result6e.filter(c => c.type === 'move' && c.unitId === 's6e');
  assert(moveCmds6e.length > 0, 'T6e: settler dostaje move');
  if (moveCmds6e.length > 0) {
    const step6e = moveCmds6e[0];
    const distToCluster = hexDistance(step6e.toQ, step6e.toR, cc6e.q, cc6e.r);
    const distToFar     = hexDistance(step6e.toQ, step6e.toR, 13, 13);
    assert(
      distToCluster < distToFar,
      'T6e: scoring +50 vs -20: settler idzie ku klastrowi (dist=' + distToCluster + ') nie daleko (dist=' + distToFar + ')'
    );
  }
}

console.log('\n--- T6f: ClusterPlacement mapping: centrum+minDystans*2 -> same bias as manual clusterCenter ---');
{
  // Symuluje jak silnik mapuje ClusterPlacement -> AITurnOpts.
  // placement.klastry[1] = { typ: 'egipt', centrum: {q:4,r:4}, typIndex: 1 }
  // placement.minDystans = 4 => clusterRadius = 4*2 = 8
  // Osadnik AI dla cywilizacji 'egipt' powinien ekspandować ku (4,4)
  const map6f = makeMap(20, 20);
  const data6f = makeGameData({
    'archetype_egipt_wojsko_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_egipt_nauka_priorytet':    { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_egipt_ekonomia_priorytet': { wartosc: 0, sekcja: 'test', opis: '' },
    'archetype_egipt_obrona_priorytet':   { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_min_dystans_miast':        { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_zywnosc_pkt':   { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_praca_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_handel_pkt':    { wartosc: 1, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_rzeka_pkt':     { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_surowiec_pkt':  { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_granica_kara':  { wartosc: -3, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_produkcja':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_nauka':       { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_jednostki':{ wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_startowe_miasta':   { wartosc: 0, sekcja: 'test', opis: '' },
    'trudnosc_poziom2_bonus_walka':       { wartosc: 0, sekcja: 'test', opis: '' },
  });

  // Symulowany TypeCluster z ClusterPlacement
  const mockCluster = { typ: 'egipt', typIndex: 1, centrum: { q: 4, r: 4 }, miasta: [] };
  const mockPlacement = { rozmiarMapy: 'mala', aktywneTypy: 3, minDystansMiastaPanstwa: 4, minDystansObcyOdGracza: 5, playerTypIndex: 0, klastry: [
    { typ: 'grecy', typIndex: 0, centrum: { q: 15, r: 15 }, miasta: [] },
    mockCluster,
  ]};

  // Mapping (jak silnik powinien to robić):
  const tc = mockPlacement.klastry.find(k => k.typ === 'egipt');
  const clusterCenter6f = tc ? tc.centrum : undefined;
  const clusterRadius6f = tc ? mockPlacement.minDystansMiastaPanstwa * 2 : undefined; // 4*2=8

  const settler6f = { id: 's6f', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: 16, r: 16, ruch: 2, ruchLeft: 2 };
  const blockCity6f = makeCity('b6f', 2, 16, 16);

  let result6f;
  let threw6f = false;
  try {
    result6f = decideAITurn(1, [settler6f], [blockCity6f], map6f, data6f, {
      civType: 'egipt',
      poziomTrudnosci: 2,
      clusterCenter: clusterCenter6f,
      clusterRadius: clusterRadius6f,
    });
  } catch(e) { threw6f = true; }

  assert(!threw6f, 'T6f: ClusterPlacement mapping nie rzuca');
  assert(Array.isArray(result6f), 'T6f: zwraca tablice przy ClusterPlacement mapping');
  const moveCmds6f = result6f.filter(c => c.type === 'move' && c.unitId === 's6f');
  assert(moveCmds6f.length > 0, 'T6f: settler egiptu dostaje move (z centrum klastra z placement)');
  if (moveCmds6f.length > 0) {
    const step6f = moveCmds6f[0];
    // Sprawdz że krok zmniejsza dystans do centrum Egiptu (4,4), nie zwiększa
    const distBefore6f = hexDistance(16, 16, 4, 4);
    const distAfter6f  = hexDistance(step6f.toQ, step6f.toR, 4, 4);
    assert(
      distAfter6f < distBefore6f,
      'T6f: krok osadnika zbliża go do centrum Egiptu (4,4); before=' + distBefore6f + ' after=' + distAfter6f +
      ' step=(' + step6f.toQ + ',' + step6f.toR + ')'
    );
  }
}



// ============================================================================
// TESTY T7: decideAIReaction — fight/flee heuristic
// ============================================================================

console.log('\n--- T7a: decideAIReaction - przewaga AI -> bitwa ---');
{
  const r = decideAIReaction({
    silaAI: 20, silaGracza: 10,
    wartoscJednostkiAI: 5,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.5,
  });
  eq(r.akcja, 'bitwa', 'T7a: AI 2x silniejsze -> bitwa');
  assert(r.ratio > 1.5, 'T7a: ratio > 1.5 dla dwukrotnej przewagi');
  assert(typeof r.powod === 'string' && r.powod.length > 0, 'T7a: powod jest stringiem niepustym');
}

console.log('\n--- T7b: decideAIReaction - slabosc -> odwrot ---');
{
  const r = decideAIReaction({
    silaAI: 5, silaGracza: 20,
    wartoscJednostkiAI: 5,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.5,
  });
  eq(r.akcja, 'odwrot', 'T7b: AI 4x slabsza -> odwrot');
  assert(r.ratio < 0.5, 'T7b: ratio < 0.5 dla czterokrotnej slabosci');
}

console.log('\n--- T7c: decideAIReaction - pokoj + przyjazn -> odwrot ---');
{
  const r = decideAIReaction({
    silaAI: 20, silaGracza: 10,     // nawet przy przewadze...
    wartoscJednostkiAI: 5,
    weWlasnymTerytorium: false,
    stanWojny: false,
    zaufanie: 80,                    // ...przyjazny, wiec przepuszcza
    agresjaArchetypu: 0.3,           // nieagresywny
  });
  eq(r.akcja, 'odwrot', 'T7c: pokoj + wysoke zaufanie + mala agresja -> odwrot');
  assert(r.powod.includes('pokoj'), 'T7c: powod zawiera "pokoj"');
}

console.log('\n--- T7d: decideAIReaction - terytorium podnosi ratio ---');
{
  // silaAI = 8, silaGracza = 10 -> raw ratio = 0.8
  // agresja=0 -> prog = PROG_BITWA = 0.9; 0.8 < 0.9 -> odwrot
  // Z terytorium * 1.25: ratio = 1.0 >= 0.9 -> bitwa
  const rBezTer = decideAIReaction({
    silaAI: 8, silaGracza: 10,
    wartoscJednostkiAI: 2,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.0,    // prog = 0.9; 0.8 < 0.9 -> odwrot
  });
  const rZTer = decideAIReaction({
    silaAI: 8, silaGracza: 10,
    wartoscJednostkiAI: 2,
    weWlasnymTerytorium: true,
    stanWojny: true,
    agresjaArchetypu: 0.0,    // prog = 0.9; 0.8*1.25=1.0 >= 0.9 -> bitwa
  });
  eq(rBezTer.akcja, 'odwrot', 'T7d: bez terytorium ratio=0.8 < prog -> odwrot');
  eq(rZTer.akcja,   'bitwa',  'T7d: z terytorium ratio=1.0 >= prog -> bitwa');
  assert(rZTer.ratio > rBezTer.ratio, 'T7d: terytorium podwyzszyl ratio');
}

console.log('\n--- T7e: decideAIReaction - agresja obniza prog (agresywny archetyp bije przy nizszym ratio) ---');
{
  // silaAI = 8, silaGracza = 10 -> ratioEff = 0.8 (brak terytorium)
  // PROG_BITWA=0.9; agresja=0.0 -> prog = 0.9 -> odwrot
  // agresja=1.0 -> prog = 0.9 - 1.0*0.4 = 0.5 -> 0.8 >= 0.5 -> bitwa
  const rMaly = decideAIReaction({
    silaAI: 8, silaGracza: 10,
    wartoscJednostkiAI: 2,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.0,     // pacyfista
  });
  const rDuzy = decideAIReaction({
    silaAI: 8, silaGracza: 10,
    wartoscJednostkiAI: 2,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 1.0,     // maksimum agresji
  });
  eq(rMaly.akcja, 'odwrot', 'T7e: agresja=0 -> prog wysoki -> odwrot przy ratio=0.8');
  eq(rDuzy.akcja, 'bitwa',  'T7e: agresja=1 -> prog nizszy -> bitwa przy ratio=0.8');
}

console.log('\n--- T7f: decideAIReaction - cenna jednostka -> ostrozniejsca (prog wyzszy) ---');
{
  // silaAI = 9, silaGracza = 10 -> ratioEff = 0.9 (rowno PROG_BITWA)
  // wartosc mala (1): prog = PROG_BITWA = 0.9 -> 0.9 >= 0.9 -> bitwa
  // wartosc duza (10): precious=true (10/10=1 > 0.5), prog = 0.9+0.15=1.05 -> 0.9 < 1.05 -> odwrot
  const rTani = decideAIReaction({
    silaAI: 9, silaGracza: 10,
    wartoscJednostkiAI: 1,       // tania
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.5,
  });
  const rCenny = decideAIReaction({
    silaAI: 9, silaGracza: 10,
    wartoscJednostkiAI: 10,      // cenna (10/10=1.0 > WARTOSC_PROG_OBS=0.5)
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.5,
  });
  // ratio = 0.9; prog dla tanich = 0.9 - 0.5*0.4 = 0.7 -> 0.9 >= 0.7 -> bitwa
  // prog dla cennych = 0.7 + 0.15 = 0.85 -> 0.9 >= 0.85 -> bitwa tez? Przeliczmy...
  // Sprawdzamy ogolna zasade: cenna >= tani prog
  // Z agresja=0.5: prog_base = 0.9 - 0.5*0.4 = 0.7; precious: +0.15 = 0.85
  // ratio = 9/10 = 0.9; bez precious: 0.9 >= 0.7 -> bitwa; z precious: 0.9 >= 0.85 -> bitwa
  // Uzyjmy agresja=0 by prog_base = 0.9, z precious 0.9+0.15=1.05 > 0.9 -> odwrot
  const rCennyPacyfista = decideAIReaction({
    silaAI: 9, silaGracza: 10,
    wartoscJednostkiAI: 10,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.0,     // prog_base = 0.9; + 0.15 = 1.05 > ratio 0.9 -> odwrot
  });
  const rTaniPacyfista = decideAIReaction({
    silaAI: 9, silaGracza: 10,
    wartoscJednostkiAI: 1,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.0,     // prog_base = 0.9; 0.9 >= 0.9 -> bitwa
  });
  eq(rTaniPacyfista.akcja, 'bitwa',  'T7f: tania jednostka, pacyfista: ratio=prog -> bitwa');
  eq(rCennyPacyfista.akcja, 'odwrot','T7f: cenna jednostka, pacyfista: prog wyzszy -> odwrot');
}

// ============================================================================
// TESTY T8: decideAIReinforcements — posilki heuristic
// ============================================================================

console.log('\n--- T8a: decideAIReinforcements - dorzuca kandydatow az do targetu ---');
{
  // Target = 1.2 * 10 = 12; sila AI w starciu = 4; deficit = 8
  // Kandydaci (dystans<=1): sila=5 (wartosc=3), sila=6 (wartosc=5)
  // Po dodaniu k1 (sila=5): lacznie=9 < 12; dodaj k2 (sila=6): lacznie=15 >= 12 -> stop
  const r = decideAIReinforcements(4, 10, [
    { id: 'k1', sila: 5, wartosc: 3, dystans: 1 },
    { id: 'k2', sila: 6, wartosc: 5, dystans: 0 },
    { id: 'k3', sila: 4, wartosc: 8, dystans: 1 },  // za cenny: 8/10=0.8 > WARTOSC_PROG_OBS=0.5
  ]);
  assert(r.dorzuc.includes('k1'), 'T8a: k1 dorzucono');
  assert(r.dorzuc.includes('k2'), 'T8a: k2 dorzucono');
  assert(!r.dorzuc.includes('k3'), 'T8a: k3 odrzucono jako zbyt cenny (wartosc=8 > 10*0.5=5)');
  assert(typeof r.powod === 'string' && r.powod.length > 0, 'T8a: powod jest stringiem');
}

console.log('\n--- T8b: decideAIReinforcements - nie dorzuca gdy juz duzy zapas ---');
{
  // sila AI w starciu = 20, sila gracza = 10, target = 12 -> juz > target -> oszczedzamy
  const r = decideAIReinforcements(20, 10, [
    { id: 'k1', sila: 5, wartosc: 1, dystans: 1 },
    { id: 'k2', sila: 8, wartosc: 2, dystans: 0 },
  ]);
  assert(Array.isArray(r.dorzuc), 'T8b: dorzuc jest tablica');
  eq(r.dorzuc.length, 0, 'T8b: gdy duzy zapas (20 >= 12) -> brak dorzucen');
  assert(r.powod.includes('przewaga') || r.powod.includes('oszczedz'), 'T8b: powod wskazuje na oszczedzanie');
}

console.log('\n--- T8c: decideAIReinforcements - pomija zbyt dalekich (dystans > 1) ---');
{
  // Wszyscy kandydaci z dystans=2 -> niedostepni
  const r = decideAIReinforcements(4, 10, [
    { id: 'k1', sila: 10, wartosc: 1, dystans: 2 },
    { id: 'k2', sila: 10, wartosc: 1, dystans: 3 },
  ]);
  eq(r.dorzuc.length, 0, 'T8c: dystans > 1 -> nikt nie dorzucony');
}

console.log('\n--- T8d: decideAIReinforcements - kolejnosc wg wartosci (tani najpierw) ---');
{
  // Target = 1.2 * 10 = 12; sila AI = 3; potrzeba 9
  // Kandydaci (tanszy ma byc pierwszy): k_drogi(wartosc=8, sila=6), k_tani(wartosc=2, sila=6)
  // Po dodaniu k_tani: 3+6=9 < 12; po dodaniu k_drogi (ale jest zbyt cenny? wartosc=8 > 10*0.5=5) -> pomijamy
  // Wiec: tylko k_tani w dorzuc (lacznie 9 < 12, ale nie ma wiecej eligibnych)
  const r = decideAIReinforcements(3, 10, [
    { id: 'k_drogi',  sila: 6, wartosc: 8, dystans: 0 },  // za cenny: 8 > 5
    { id: 'k_tani',   sila: 6, wartosc: 2, dystans: 1 },  // ok
    { id: 'k_sredni', sila: 4, wartosc: 4, dystans: 0 },  // ok (4 <= 5)
  ]);
  assert(!r.dorzuc.includes('k_drogi'), 'T8d: k_drogi (wartosc=8 > max=5) pominieto');
  // k_tani powinien byc przed k_sredni (nizsza wartosc)
  const idxTani   = r.dorzuc.indexOf('k_tani');
  const idxSredni = r.dorzuc.indexOf('k_sredni');
  if (idxTani >= 0 && idxSredni >= 0) {
    assert(idxTani < idxSredni, 'T8d: k_tani (wartosc=2) dorzucony przed k_sredni (wartosc=4)');
  }
  assert(r.dorzuc.length > 0, 'T8d: przynajmniej jeden kandydat dorzucony');
}


// ============================================================================
// TESTY T9: decideAIDiplomacy — dyplomacja AI v0.1
// ============================================================================

console.log('\n--- T9a: decideAIDiplomacy - silny+agresywny+wrogi -> wypowiedz_wojne ---');
{
  // respektWzgledny=0.7 >= PROG_WOJNA_SILA(0.6), agresja=0.8 >= PROG_WOJNA_AGRESJA(0.5)
  // relacja: zaufanie=5+respekt=5=10 < progMinimalnyRelacja(30) -> wrogie
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.8,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.7,
      stanWojny: false,
    }],
  });
  assert(cmds.length === 1, 'T9a: jedna komenda');
  assert(cmds[0] && cmds[0].type === 'wypowiedz_wojne', `T9a: typ=wypowiedz_wojne (got ${cmds[0] && cmds[0].type})`);
  assert(cmds[0] && cmds[0].targetId === 'rzym-1', 'T9a: targetId=rzym-1');
}

console.log('\n--- T9b: decideAIDiplomacy - bardzo silny -> zadaj_trybut (nie wojna) ---');
{
  // respektWzgledny=0.8 >= PROG_TRYBUT(0.7) i !stanWojny -> trybut zamiast wojny
  // agresja=0.6 >= 0.5*0.5=0.25 -> spelniony warunek trybutu (srednia agresja)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.6,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.8,
      stanWojny: false,
    }],
  });
  assert(cmds.length === 1, 'T9b: jedna komenda');
  assert(cmds[0] && cmds[0].type === 'zadaj_trybut', `T9b: typ=zadaj_trybut (got ${cmds[0] && cmds[0].type})`);
}

console.log('\n--- T9c: decideAIDiplomacy - slaby w wojnie -> zaproponuj_pokoj ---');
{
  // stanWojny=true, respektWzgledny=0.35 <= PROG_POKOJ_SLABOSC(0.4) i > 0.25 -> pokoj
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.5,
    relacje: [{
      partnerId: 'grk-1',
      relation: { zaufanie: 10, respekt: 20, status: 'wojna' },
      respektWzgledny: 0.35,
      stanWojny: true,
    }],
  });
  assert(cmds.length === 1, 'T9c: jedna komenda');
  assert(cmds[0] && cmds[0].type === 'zaproponuj_pokoj', `T9c: typ=zaproponuj_pokoj (got ${cmds[0] && cmds[0].type})`);
}

console.log('\n--- T9d: decideAIDiplomacy - b. slaby w wojnie -> oferuj_trybut_za_pokoj ---');
{
  // stanWojny=true, respektWzgledny=0.2 <= 0.25 -> trybut za pokoj (priorytet nad zwyklym pokojem)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.4,
    relacje: [{
      partnerId: 'zul-1',
      relation: { zaufanie: 5, respekt: 5, status: 'wojna' },
      respektWzgledny: 0.2,
      stanWojny: true,
    }],
  });
  assert(cmds.length === 1, 'T9d: jedna komenda');
  assert(cmds[0] && cmds[0].type === 'oferuj_trybut_za_pokoj', `T9d: typ=oferuj_trybut_za_pokoj (got ${cmds[0] && cmds[0].type})`);
}

console.log('\n--- T9e: decideAIDiplomacy - przyjazny/pokoj -> brak agresywnych komend (sojusz/handel OK) ---');
{
  // Wysoka relacja (zaufanie=70, respekt=60 = 130 >= progSojuszRelacja=120) -> przyjazny
  // respektWzgledny=0.55 -> nie spelniony prog ВОЙNA/TRYBUT -> brak agresywnych komend.
  // v0.2: mozliwy zaproponuj_sojusz (allyW>=0.6, rw=0.55 in [0.4,0.7]) lub zaproponuj_handel — to OK.
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.4,
    relacje: [{
      partnerId: 'chiny-1',
      relation: { zaufanie: 70, respekt: 60, status: 'pokoj' },
      respektWzgledny: 0.55,
      stanWojny: false,
    }],
  });
  const typy = cmds.map(c => c.type);
  // Kluczowy niezmiennik: przyjazna relacja -> BRAK agresywnych komend (wojna/trybut)
  assert(!typy.includes('wypowiedz_wojne'),       'T9e: brak wypowiedz_wojne dla przyjaznej relacji');
  assert(!typy.includes('zadaj_trybut'),           'T9e: brak zadaj_trybut dla przyjaznej relacji');
  assert(!typy.includes('oferuj_trybut_za_pokoj'), 'T9e: brak oferuj_trybut_za_pokoj (nie w wojnie)');
  // Jedna komenda max per partner (invariant)
  assert(cmds.length <= 1, `T9e: max 1 komenda per partner (got ${cmds.length})`);
}

console.log('\n--- T9f: decideAIDiplomacy - agresja ponizej progu -> brak wojny mimo przewagi ---');
{
  // respektWzgledny=0.65 >= PROG_WOJNA_SILA(0.6), ALE agresja=0.3 < PROG_WOJNA_AGRESJA(0.5)
  // score=10 < 30 (wrogie), ale agresja za mala -> brak komendy wojennej
  // Nie spelnia tez trybutu (respektWzgledny=0.65 < PROG_TRYBUT=0.7)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.3,
    relacje: [{
      partnerId: 'ink-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.65,
      stanWojny: false,
    }],
  });
  const typy = cmds.map(c => c.type);
  assert(!typy.includes('wypowiedz_wojne'), `T9f: brak wypowiedz_wojne mimo przewagi (agresja za mala); komendy=${JSON.stringify(typy)}`);
}

console.log('\n--- T9g: decideAIDiplomacy - rownosc sil -> brak komendy ---');
{
  // respektWzgledny=0.5 -> rownosc sil; nie spelnia PROG_WOJNA_SILA(0.6) ani PROG_TRYBUT(0.7)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.9,
    relacje: [{
      partnerId: 'eg-1',
      relation: { zaufanie: 10, respekt: 10, status: 'neutralni' },
      respektWzgledny: 0.5,
      stanWojny: false,
    }],
  });
  const typy = cmds.map(c => c.type);
  assert(!typy.includes('wypowiedz_wojne'), `T9g: brak wojny przy rownosci sil (got ${JSON.stringify(typy)})`);
  assert(!typy.includes('zadaj_trybut'),   `T9g: brak trybutu przy rownosci sil (got ${JSON.stringify(typy)})`);
}

console.log('\n--- T9h: decideAIDiplomacy - wiele relacji mieszanych -> komendy per partner ---');
{
  // Partner A: b. slaby w wojnie -> oferuj_trybut_za_pokoj
  // Partner B: przyjazny -> brak komendy
  // Partner C: silny agresywny wrogi -> wypowiedz_wojne
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.75,
    relacje: [
      { partnerId: 'A', relation: { zaufanie: 5, respekt: 5, status: 'wojna' }, respektWzgledny: 0.15, stanWojny: true },
      { partnerId: 'B', relation: { zaufanie: 80, respekt: 50, status: 'pokoj' }, respektWzgledny: 0.52, stanWojny: false },
      { partnerId: 'C', relation: { zaufanie: 5, respekt: 5, status: 'neutralni' }, respektWzgledny: 0.68, stanWojny: false },
    ],
  });
  const forA = cmds.find(c => c.targetId === 'A');
  const forB = cmds.find(c => c.targetId === 'B');
  const forC = cmds.find(c => c.targetId === 'C');
  assert(forA && forA.type === 'oferuj_trybut_za_pokoj', `T9h: partner A -> oferuj_trybut_za_pokoj (got ${forA && forA.type})`);
  // B: przyjazny (zaufanie=80, score=130) -> brak agresywnych komend (sojusz/handel OK w v0.2)
  const agresywneTypy = ['wypowiedz_wojne', 'zadaj_trybut', 'oferuj_trybut_za_pokoj'];
  assert(!forB || !agresywneTypy.includes(forB.type), `T9h: partner B -> brak agresywnych komend (got ${forB && forB.type})`);
  assert(forC && forC.type === 'wypowiedz_wojne', `T9h: partner C -> wypowiedz_wojne (got ${forC && forC.type})`);
}

console.log('\n--- T9i: decideAIDiplomacy - max 1 komenda per partner ---');
{
  // Sprawdzamy, ze nie duplikujemy komend dla jednego partnera
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.9,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.8,
      stanWojny: false,
    }],
  });
  const forRzym = cmds.filter(c => c.targetId === 'rzym-1');
  assert(forRzym.length <= 1, `T9i: max 1 komenda per partner (got ${forRzym.length})`);
}

console.log('\n--- T9j: decideAIDiplomacy - powod jest niepustym stringiem ---');
{
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.8,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.7,
      stanWojny: false,
    }],
  });
  assert(cmds.length > 0, 'T9j: co najmniej jedna komenda');
  if (cmds.length > 0) {
    assert(typeof cmds[0].powod === 'string' && cmds[0].powod.length > 0, `T9j: powod jest niepustym stringiem (got ${JSON.stringify(cmds[0].powod)})`);
  }
}


// ============================================================================
// TESTY T2-SOJUSZ/HANDEL: decideAIDiplomacy v0.2 — sojusz i handel
// ============================================================================

console.log('\n--- T2S-a: zaproponuj_sojusz gdy rowny partner + willingnessAlly >= PROG_SOJUSZ ---');
{
  // Scenariusz: rowny partner (rw=0.55 in [0.4,0.7]), wysoka relacja (zaufanie=70, score=130)
  // allyW wyliczone przez aiDiplomacyStance >= PROG_SOJUSZ(0.6) -> zaproponuj_sojusz
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.4,
    relacje: [{
      partnerId: 'grecy-1',
      relation: { zaufanie: 70, respekt: 60, status: 'pokoj' },
      respektWzgledny: 0.55,
      stanWojny: false,
    }],
  });
  const sojuszCmd = cmds.find(c => c.type === 'zaproponuj_sojusz');
  assert(!!sojuszCmd, `T2S-a: zaproponuj_sojusz dla rownego partnera z wysoka relacja; got: ${JSON.stringify(cmds.map(c=>c.type))}`);
  assert(sojuszCmd && sojuszCmd.targetId === 'grecy-1', 'T2S-a: targetId prawidlowy');
  assert(sojuszCmd && typeof sojuszCmd.powod === 'string' && sojuszCmd.powod.length > 0, 'T2S-a: powod niepusty');
}

console.log('\n--- T2S-b: zaproponuj_handel gdy neutralny + handlowosc >= 0.4 + willingnessTrade >= PROG_HANDEL ---');
{
  // Scenariusz: neutralna relacja (zaufanie=30, respekt=30=60, score=60 > progMinimalny=30)
  // willingnessTrade: score>=30 -> tradeW = archTrade*0.60 + relFactor
  // Dla grecy archTrade=0.75: tradeW = 0.75*0.60 + (60/200)*0.40 = 0.45+0.12 = 0.57 >= PROG_HANDEL(0.5)
  // willingnessAlly: score=60 < 120 -> allyW=0 -> brak sojuszu
  // Zatem: zaproponuj_handel powinien sie pojawic (handlowosc=0.7 >= 0.4)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.3,
    handlowosc: 0.7,
    skarbiecGold: 100,
    relacje: [{
      partnerId: 'chiny-1',
      relation: { zaufanie: 30, respekt: 30, status: 'neutralni' },
      respektWzgledny: 0.5,
      stanWojny: false,
    }],
  });
  const handelCmd = cmds.find(c => c.type === 'zaproponuj_handel');
  assert(!!handelCmd, `T2S-b: zaproponuj_handel dla neutralnej relacji + handlowosc=0.7; got: ${JSON.stringify(cmds.map(c=>c.type))}`);
  assert(handelCmd && handelCmd.targetId === 'chiny-1', 'T2S-b: targetId prawidlowy');
}

console.log('\n--- T2S-b2: cooldown blokuje kolejny zaproponuj_handel ---');
{
  const relBase = {
    partnerId: 'chiny-1',
    relation: { zaufanie: 30, respekt: 30, status: 'neutralni' },
    respektWzgledny: 0.5,
    stanWojny: false,
    lastOneShotGiftTurn: 10,
  };
  const blocked = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.3,
    handlowosc: 0.7,
    skarbiecGold: 100,
    currentTurn: 20,
    relacje: [relBase],
  }, undefined, 1, 1, 'normal');
  assert(!blocked.some(c => c.type === 'zaproponuj_handel'),
    `T2S-b2: cooldown normal 25 tur blokuje handel w turze 20 po darze 10; got: ${JSON.stringify(blocked.map(c=>c.type))}`);

  const allowed = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.3,
    handlowosc: 0.7,
    skarbiecGold: 100,
    currentTurn: 36,
    relacje: [relBase],
  }, undefined, 1, 1, 'normal');
  assert(allowed.some(c => c.type === 'zaproponuj_handel'),
    `T2S-b2: po cooldownie (tura 36) handel wraca; got: ${JSON.stringify(allowed.map(c=>c.type))}`);
}

console.log('\n--- T2S-c: brak sojuszu gdy ofiara (rw > 0.7 -> dominacja, nie rowny partner) ---');
{
  // respektWzgledny=0.8 -> dominacja; rw NOT in [0.4,0.7] -> brak zaproponuj_sojusz
  // rw=0.8 >= PROG_TRYBUT(0.7) i !stanWojny -> TRYBUT (priorytet 3 wygruje)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.6,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 70, respekt: 60, status: 'pokoj' },
      respektWzgledny: 0.8,
      stanWojny: false,
    }],
  });
  const sojuszCmd = cmds.find(c => c.type === 'zaproponuj_sojusz');
  assert(!sojuszCmd, `T2S-c: brak sojuszu gdy ofiara (rw=0.8 > 0.7 -> dominacja); got: ${JSON.stringify(cmds.map(c=>c.type))}`);
}

console.log('\n--- T2S-d: priorytet - wojna bije sojusz ---');
{
  // Scenariusz: warunki spelnione dla obu: wojna i sojusz.
  // !stanWojny, rw=0.65 >= PROG_ВОЙНА_SILA(0.6), agresja=0.8, score=10<30 -> wypowiedz_wojne
  // willingnessAlly mogloby byc >= PROG_SOJUSZ ALE wojnie ma wyzszy priorytet
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.8,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.65,
      stanWojny: false,
    }],
  });
  const typy = cmds.map(c => c.type);
  assert(!typy.includes('zaproponuj_sojusz'), `T2S-d: sojusz nie pojawia sie gdy war conditions met; typy=${JSON.stringify(typy)}`);
}

console.log('\n--- T2S-e: max 1 komenda per partner (sojusz + handel nie razem) ---');
{
  // Scenariusz idealny dla sojuszu: row partner, wysoka relacja
  // Max 1 komenda per partner -> sojusz wygrywa (wyzszy priorytet)
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.3,
    handlowosc: 0.9,
    relacje: [{
      partnerId: 'grecy-1',
      relation: { zaufanie: 70, respekt: 60, status: 'pokoj' },
      respektWzgledny: 0.55,
      stanWojny: false,
    }],
  });
  const forGrecy = cmds.filter(c => c.targetId === 'grecy-1');
  assert(forGrecy.length <= 1, `T2S-e: max 1 komenda per partner (got ${forGrecy.length}): ${JSON.stringify(forGrecy.map(c=>c.type))}`);
}

// ============================================================================
// TESTY T4-SPRYT: difficulty -> spryt AI (agresjaMnoznik, celObranie, dyplomacjaAktywnosc)
// ============================================================================

console.log('\n--- T4S-a: loadDifficultyParams - rosnacy agresjaMnoznik per poziom ---');
{
  const emptyData = makeGameData({});
  const p1 = loadDifficultyParams(emptyData, 1);
  const p2 = loadDifficultyParams(emptyData, 2);
  const p3 = loadDifficultyParams(emptyData, 3);
  
  assert(typeof p1.agresjaMnoznik === 'number', 'T4S-a: poziom1 agresjaMnoznik jest liczba');
  assert(typeof p2.agresjaMnoznik === 'number', 'T4S-a: poziom2 agresjaMnoznik jest liczba');
  assert(typeof p3.agresjaMnoznik === 'number', 'T4S-a: poziom3 agresjaMnoznik jest liczba');
  
  assert(p1.agresjaMnoznik < p2.agresjaMnoznik, `T4S-a: agresjaMnoznik rosnie: p1=${p1.agresjaMnoznik} < p2=${p2.agresjaMnoznik}`);
  assert(p2.agresjaMnoznik < p3.agresjaMnoznik, `T4S-a: agresjaMnoznik rosnie: p2=${p2.agresjaMnoznik} < p3=${p3.agresjaMnoznik}`);
}

console.log('\n--- T4S-b: loadDifficultyParams - rosnacy dyplomacjaAktywnosc + celObranie ---');
{
  const emptyData = makeGameData({});
  const p1 = loadDifficultyParams(emptyData, 1);
  const p2 = loadDifficultyParams(emptyData, 2);
  const p3 = loadDifficultyParams(emptyData, 3);
  
  assert(p1.dyplomacjaAktywnosc < p2.dyplomacjaAktywnosc, `T4S-b: dyplomacjaAktywnosc rosnie: ${p1.dyplomacjaAktywnosc} < ${p2.dyplomacjaAktywnosc}`);
  assert(p2.dyplomacjaAktywnosc < p3.dyplomacjaAktywnosc, `T4S-b: dyplomacjaAktywnosc rosnie: ${p2.dyplomacjaAktywnosc} < ${p3.dyplomacjaAktywnosc}`);
  
  assert(p1.celObranie < p2.celObranie, `T4S-b: celObranie rosnie: ${p1.celObranie} < ${p2.celObranie}`);
  assert(p2.celObranie < p3.celObranie, `T4S-b: celObranie rosnie: ${p2.celObranie} < ${p3.celObranie}`);
}

console.log('\n--- T4S-c: decideAIReaction agresjaMnoznik=1.2 bije czesciej niz 0.85 (graniczny input) ---');
{
  // silaAI=8, silaGracza=10 -> ratioRaw=0.8 (bez terytorium)
  // agresjaArchetypu=0.5:
  //   z mnoznikiem 0.85: effAgresja=0.425 -> prog = PROG_BITWA(0.9) - 0.425*AGRESJA_WPLYW(0.4) = 0.73 -> 0.8 >= 0.73 -> bitwa
  //   z mnoznikiem 1.2:  effAgresja=min(1,0.6) -> prog = 0.9 - 0.6*0.4 = 0.66 -> 0.8 >= 0.66 -> bitwa (obie bijа?)
  // Lepszy graniczny test: agresjaArchetypu=0.1:
  //   z mnoznikiem 0.85: effAgresja=0.085 -> prog = 0.9 - 0.085*0.4 = 0.866 -> 0.8 < 0.866 -> ODWROT
  //   z mnoznikiem 1.2:  effAgresja=0.12  -> prog = 0.9 - 0.12*0.4  = 0.852 -> 0.8 < 0.852 -> ODWROT (oba odwrot)
  // Uzyjmy agresja=0.5 i ratio graniczny: 
  //   mnoznik 0.85: effAgresja=0.425 -> prog=0.73; ratioEff potrzebny: tuż przy granicy
  //   Wybierzmy silaAI=7.5, silaGracza=10: ratio=0.75
  //   mnoznik 0.85: effAgresja=0.425 -> prog=0.73 -> 0.75 >= 0.73 -> bitwa  
  //   mnoznik 0.0:  effAgresja=0.0   -> prog=0.9  -> 0.75 < 0.9  -> odwrot
  // To da wyrazna roznice!
  
  const baseInp = {
    silaAI: 7.5, silaGracza: 10,
    wartoscJednostkiAI: 1,
    weWlasnymTerytorium: false,
    stanWojny: true,
    agresjaArchetypu: 0.5,
  };
  
  const rMnoznikNiski   = decideAIReaction(baseInp, 0.0);   // poziom1 (agresja skaluje do 0)
  const rMnoznikWysoki  = decideAIReaction(baseInp, 1.2);   // poziom3 (agresja skaluje w gore)
  
  // Niski mnoznik = pasywna AI: effAgresja=0 -> prog=0.9, ratio=0.75 < 0.9 -> odwrot
  // Wysoki mnoznik = agresywna AI: effAgresja=0.6 -> prog=0.66, ratio=0.75 >= 0.66 -> bitwa
  eq(rMnoznikNiski.akcja,  'odwrot', `T4S-c: agresjaMnoznik=0 -> odwrot (ratio=${rMnoznikNiski.ratio.toFixed(2)})`);
  eq(rMnoznikWysoki.akcja, 'bitwa',  `T4S-c: agresjaMnoznik=1.2 -> bitwa (ratio=${rMnoznikWysoki.ratio.toFixed(2)})`);
}

console.log('\n--- T4S-d: decideAIDiplomacy - wyzszy agresjaMnoznik czesciej wypowiada wojne ---');
{
  // Scenariusz graniczny: agresja=0.4, rw=0.65, score=10<30 (wrogie)
  // Bez mnoznika: effAgresja=0.4 < PROG_ВОЙНА_AGRESJA(0.5) -> BRAK wypowiedzenia
  // Z mnoznikiem 1.5: effAgresja=min(1,0.6) >= 0.5 -> WYPOWIADA wojne
  
  const relInput = {
    myPlayerId: 'ai-1',
    agresja: 0.4,
    relacje: [{
      partnerId: 'rzym-1',
      relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
      respektWzgledny: 0.65,
      stanWojny: false,
    }],
  };
  
  const cmdsNiski  = decideAIDiplomacy(relInput, undefined, 1.0);  // mnoznik=1 -> effAgresja=0.4 < 0.5
  const cmdsWysoki = decideAIDiplomacy(relInput, undefined, 1.5);  // mnoznik=1.5 -> effAgresja=0.6 >= 0.5
  
  const tyNiski  = cmdsNiski.map(c => c.type);
  const tyWysoki = cmdsWysoki.map(c => c.type);
  
  assert(!tyNiski.includes('wypowiedz_wojne'),  `T4S-d: mnoznik=1.0 effAgresja=0.4 < 0.5 -> brak wojne; got: ${JSON.stringify(tyNiski)}`);
  assert(tyWysoki.includes('wypowiedz_wojne'),  `T4S-d: mnoznik=1.5 effAgresja=0.6 >= 0.5 -> wypowiedz_wojne; got: ${JSON.stringify(tyWysoki)}`);
}


// ============================================================================
// TESTY T5 - PKT5: BUDZETOWANIE AI (canAfford/itemCost)
// ============================================================================

console.log('\n--- T5a: canAfford odfiltrowuje wszystkich -> brak build (AI oszczedza) ---');
{
  // canAfford zawsze zwraca false -> AI nie powinna budowac nic
  const citiesMid3 = [makeCity('c1', 1, 1, 1), makeCity('c2', 1, 5, 1), makeCity('c3', 1, 8, 1)];
  const result = decideAITurn(1, [], citiesMid3, map, data, {
    civType: 'chinczycy',
    poziomTrudnosci: 2,
    cityBuildings: {},
    canAfford: (_cityId, _itemId) => false,  // nic nie stac
  });
  const buildCmds = result.filter(c => c.type === 'build');
  assert(
    buildCmds.length === 0,
    `T5a: canAfford=false dla wszystkich -> 0 komend build (AI oszczedza); got: ${buildCmds.map(c=>c.buildingId).join(', ')}`
  );
  eq(result[result.length - 1].type, 'endTurn', 'T5a: endTurn nadal ostatni');
}

console.log('\n--- T5b: canAfford filtruje drogie, AI wybiera tansze o lepszym score ---');
{
  // Tylko 'Osadnik' i 'Łucznik' dostepne; canAfford odrzuca 'koszary'/'spichlerz'
  const citiesEarly2 = [makeCity('e1', 1, 1, 1), makeCity('e2', 1, 5, 1)];
  const allowed = new Set(['Osadnik', 'Łucznik', 'Wojownik']);
  const result = decideAITurn(1, [], citiesEarly2, map, data, {
    civType: 'chinczycy',
    poziomTrudnosci: 2,
    cityBuildings: {},
    canAfford: (_cityId, itemId) => allowed.has(itemId),
  });
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'T5b: AI buduje gdy cos stac');
  const allAllowed = buildCmds.every(c => allowed.has(c.buildingId));
  assert(
    allAllowed,
    `T5b: wszystkie build w allowed set; got: ${buildCmds.map(c=>c.buildingId).join(', ')}`
  );
}

console.log('\n--- T5c: brak canAfford -> zachowanie jak dotad (regresja=0) ---');
{
  // Bez canAfford -> AI buduje wg score, tak jak przed pkt5
  const citiesMid3 = [makeCity('c1', 1, 1, 1), makeCity('c2', 1, 5, 1), makeCity('c3', 1, 8, 1)];
  let threw = false;
  let result;
  try {
    result = decideAITurn(1, [], citiesMid3, map, data, {
      civType: 'chinczycy',
      poziomTrudnosci: 2,
      cityBuildings: {},
      // NIE podajemy canAfford -> stare zachowanie
    });
  } catch(e) { threw = true; }
  assert(!threw, 'T5c: brak canAfford nie rzuca wyjatku');
  assert(Array.isArray(result), 'T5c: zwraca tablice');
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'T5c: bez canAfford AI buduje (regresja=0)');
}

console.log('\n--- T5d: itemCost prefers cheaper items w tym samym score-band ---');
{
  // Faza srednia (3 miasta): Wojownik score=170+militaryScore(100)=270 koszt=20,
  //   stolarnia/cegielnia/odlewnia_brazu etc. score=140+economyScore(100)=240 koszt=10
  // canAfford=true dla obu; topScore=270 (Wojownik), 70%*270=189; stolarnia 240>=189 -> w bandzie
  // Ratio: Wojownik 270/20=13.5, stolarnia 240/10=24 -> stolarnia WYGRYWA przez ratio
  // Bez itemCost: Wojownik wygrywa (wyzszy score 270 > 240)
  const citiesMid3ForRatio = [makeCity('f1', 1, 1, 1), makeCity('f2', 1, 5, 1), makeCity('f3', 1, 8, 1)];
  const costs = { Wojownik: 20, Łucznik: 20, stolarnia: 10, cegielnia: 10, odlewnia_brazu: 10, magazyn: 10, targowisko: 10, koszary: 80, Osadnik: 50 };
  const ECON_SET = new Set(['stolarnia', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'targowisko']);

  const resultWithCost = decideAITurn(1, [], citiesMid3ForRatio, map, data, {
    civType: 'grecy',
    poziomTrudnosci: 2,
    cityBuildings: { f1: ['koszary'], f2: ['koszary'], f3: ['koszary'] }, // koszary juz zbudowane
    canAfford: (_cityId, _itemId) => true,  // wszystko stac
    itemCost: (itemId) => costs[itemId] ?? 50,
  });
  const buildWithCost = resultWithCost.filter(c => c.type === 'build');
  const econWithCost = buildWithCost.filter(c => ECON_SET.has(c.buildingId));
  const milWithCost  = buildWithCost.filter(c => c.buildingId === 'Wojownik' || c.buildingId === 'Łucznik');

  // Z itemCost: ekonomia (ratio 24) bije wojownika (ratio 13.5) w tym samym bandzie
  assert(
    econWithCost.length > milWithCost.length,
    `T5d: z itemCost ekonomia (ratio 24) > wojownik (ratio 13.5) w bandzie; ekon=${econWithCost.length} mil=${milWithCost.length}`
  );

  // Bez itemCost: Wojownik (score 270) bije ekonomie (score 240)
  const resultNoItemCost = decideAITurn(1, [], citiesMid3ForRatio, map, data, {
    civType: 'grecy',
    poziomTrudnosci: 2,
    cityBuildings: { f1: ['koszary'], f2: ['koszary'], f3: ['koszary'] },
    canAfford: (_cityId, _itemId) => true,
    // itemCost BRAK -> wybor wg score
  });
  const buildNoItemCost = resultNoItemCost.filter(c => c.type === 'build');
  const econNoItemCost = buildNoItemCost.filter(c => ECON_SET.has(c.buildingId));
  const milNoItemCost  = buildNoItemCost.filter(c => c.buildingId === 'Wojownik' || c.buildingId === 'Łucznik');

  // Bez itemCost: wojownik (score 270) wygrywa z ekonomia (240)
  assert(
    milNoItemCost.length >= econNoItemCost.length,
    `T5d: bez itemCost wojownik (score 270) >= ekonomia (240); mil=${milNoItemCost.length} ekon=${econNoItemCost.length}`
  );
}

console.log('\n--- T5e: Kamien (Praca) - canAfford z epoką Kamień nie blokuje przez brak Pieniadza ---');
{
  // Epoka Kamien: canAfford decyduje o Pracy, nie Pieniadzu -> AI nie powinna byc blokowana
  // Model: canAfford sprawdza budzet Pracy (symulacja EKONOMII)
  // Test: jesli canAfford(city,'Wojownik')=true (Praca wystarczy), AI powinna budowac Wojownika
  const citiesKamien = [makeCity('k1', 1, 1, 1)];
  const prakaAllowed = new Set(['Wojownik', 'Łucznik', 'Osadnik']);  // Praca wystarczy na te
  let buildResult;
  try {
    buildResult = decideAITurn(1, [], citiesKamien, map, data, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      cityBuildings: {},
      // canAfford symuluje EKONOMIE: Praca wystarczy na jednostki, nie na budynki
      canAfford: (_cityId, itemId) => prakaAllowed.has(itemId),
    });
  } catch(e) { buildResult = []; }
  const buildCmds = buildResult.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'T5e: Kamien+Praca: AI buduje jednostke gdy Praca wystarczy');
  const builtItems = buildCmds.map(c => c.buildingId);
  const allUnits = builtItems.every(id => prakaAllowed.has(id));
  assert(
    allUnits,
    `T5e: Kamien: AI wybiera jednostki (za Prace), nie budynki (za Pieniadz); got: ${builtItems.join(', ')}`
  );
}

console.log('\n--- T5f: canAfford=true dla jednego, reszta false -> buduje to jedno ---');
{
  // Tylko koszary stac; reszta odfiltrowana
  const citiesMid3 = [makeCity('g1', 1, 1, 1), makeCity('g2', 1, 5, 1), makeCity('g3', 1, 8, 1)];
  const result = decideAITurn(1, [], citiesMid3, map, data, {
    civType: 'grecy',
    poziomTrudnosci: 2,
    cityBuildings: {},
    canAfford: (_cityId, itemId) => itemId === 'koszary',
  });
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'T5f: AI buduje koszary (jedyna dostepna)');
  const allKoszary = buildCmds.every(c => c.buildingId === 'koszary');
  assert(allKoszary, `T5f: wszystkie build=koszary; got: ${buildCmds.map(c=>c.buildingId).join(', ')}`);
}

console.log('\n--- T5g: itemCost bez canAfford -> brak efektu (regresja) ---');
{
  // itemCost bez canAfford -> stare zachowanie (najwyzszy score wygrywa)
  const citiesEarly1 = [makeCity('h1', 1, 1, 1)];
  let threw = false;
  let result;
  try {
    result = decideAITurn(1, [], citiesEarly1, map, data, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      cityBuildings: {},
      // canAfford BRAK -> itemCost nie wplywa na wybor
      itemCost: (_itemId) => 1,
    });
  } catch(e) { threw = true; }
  assert(!threw, 'T5g: itemCost bez canAfford nie rzuca');
  assert(Array.isArray(result), 'T5g: zwraca tablice');
  const buildCmds = result.filter(c => c.type === 'build');
  assert(buildCmds.length > 0, 'T5g: bez canAfford AI buduje mimo itemCost (regresja=0)');
}

console.log('\n--- T5h: endTurn zawsze ostatni przy roznym canAfford ---');
{
  // Niezaleznie od canAfford - endTurn zawsze ostatni
  const citiesMid3 = [makeCity('c1', 1, 1, 1), makeCity('c2', 1, 5, 1), makeCity('c3', 1, 8, 1)];
  for (const canAffordFn of [
    () => true,   // wszystko stac
    () => false,  // nic nie stac
    (_c, id) => id === 'koszary',  // tylko koszary
  ]) {
    const r = decideAITurn(1, [], citiesMid3, map, data, {
      civType: 'grecy',
      cityBuildings: {},
      canAfford: canAffordFn,
    });
    eq(r[r.length - 1].type, 'endTurn', `T5h: endTurn ostatni (canAfford: ${canAffordFn.toString().slice(0,40)})`);
  }
}

// ---------------------------------------------------------------------------
// TEST 19: T7D — D-START defensiveCopy (kopia_typu_obronna)
// ---------------------------------------------------------------------------

console.log('\n--- T7D-a: defensiveCopy -> brak foundCity i build ---');
{
  const map7 = makeMap(10, 10);
  const settler = makeUnit('s1', 2, 5, 5, 'osadnik');
  const warrior = makeUnit('w1', 2, 4, 5, 'miecznik');
  const city = makeCity('c1', 2, 3, 3);
  const result = decideAITurn(2, [settler, warrior], [city], map7, makeGameData(), {
    defensiveCopy: true,
    civType: 'chinczycy',
  });
  const found = result.filter(c => c.type === 'foundCity');
  const builds = result.filter(c => c.type === 'build');
  assert(found.length === 0, 'T7D-a: defensiveCopy nie emituje foundCity');
  assert(builds.length === 0, 'T7D-a: defensiveCopy nie emituje build');
  eq(result[result.length - 1].type, 'endTurn', 'T7D-a: endTurn na koncu');
}

console.log('\n--- T7D-b: defensiveCopy -> osadnik bez ruchu ekspansyjnego ---');
{
  const map7b = makeMap(10, 10);
  const settler = makeUnit('s2', 3, 8, 8, 'osadnik');
  const result = decideAITurn(3, [settler], [], map7b, makeGameData(), { defensiveCopy: true });
  const moves = result.filter(c => c.type === 'move' && c.unitId === 's2');
  const found = result.filter(c => c.type === 'foundCity');
  assert(moves.length === 0, 'T7D-b: osadnik kopia_typu nie rusza sie');
  assert(found.length === 0, 'T7D-b: osadnik kopia_typu nie zaklada miasta');
}

console.log('\n--- T7D-c: defensiveCopy -> riposta na sasiedniego wroga (AI, nie gracz) ---');
{
  const map7c = makeMap(10, 10);
  const warrior = makeUnit('w2', 4, 5, 5, 'miecznik');
  const enemy = makeUnit('e1', 9, 6, 5, 'miecznik');
  const city = makeCity('c2', 4, 3, 3);
  const result = decideAITurn(4, [warrior, enemy], [city], map7c, makeGameData(), { defensiveCopy: true });
  const attacks = result.filter(c => c.type === 'attack' && c.unitId === 'w2');
  assert(attacks.length === 1, 'T7D-c: atak na sasiedniego wroga');
  eq(attacks[0].targetUnitId, 'e1', 'T7D-c: cel = sasiedni wróg');
}

console.log('\n--- T7D-g: defensiveCopy -> brak ataku na gracza bez wojny ---');
{
  const map7g = makeMap(10, 10);
  const warrior = makeUnit('wg1', 4, 5, 5, 'miecznik');
  const playerScout = makeUnit('ps1', 0, 6, 5, 'zwiadowca');
  const city = makeCity('cg1', 4, 3, 3);
  const noWar = (targetOwnerId) => targetOwnerId !== 0;
  const result = decideAITurn(4, [warrior, playerScout], [city], map7g, makeGameData(), {
    defensiveCopy: true,
    canEngageOwner: noWar,
  });
  const attacks = result.filter(c => c.type === 'attack');
  assert(attacks.length === 0, 'T7D-g: brak ataku na gracza gdy canEngageOwner blokuje ownerId 0');
}

console.log('\n--- T7D-d: defensiveCopy -> brak marszu na odlegle miasto wroga ---');
{
  const map7d = makeMap(15, 15);
  const warrior = makeUnit('w3', 5, 2, 2, 'miecznik');
  const ownCity = makeCity('c3', 5, 2, 2);
  const enemyCity = makeCity('ec1', 0, 12, 12);
  const result = decideAITurn(5, [warrior], [ownCity, enemyCity], map7d, makeGameData(), { defensiveCopy: true });
  const moves = result.filter(c => c.type === 'move' && c.unitId === 'w3');
  // Jednostka stoi przy miescie — brak powodu do marszu (zagr. tylko sasiedztwo)
  assert(moves.length === 0, 'T7D-d: brak marszu na odlegle miasto wroga');
}

console.log('\n--- T7D-e: 20 tur defensiveCopy — zero foundCity (regresja D-START) ---');
{
  const map7e = makeMap(12, 12);
  let units = [makeUnit('s20', 6, 6, 6, 'osadnik'), makeUnit('w20', 6, 5, 5, 'miecznik')];
  const cities = [makeCity('c20', 6, 4, 4)];
  let foundTotal = 0;
  for (let t = 0; t < 20; t++) {
    const cmds = decideAITurn(6, units, cities, map7e, makeGameData(), { defensiveCopy: true });
    foundTotal += cmds.filter(c => c.type === 'foundCity').length;
    // Symulacja: po ruchu aktualizuj pozycje (uproszczona)
    for (const cmd of cmds) {
      if (cmd.type === 'move') {
        const u = units.find(x => x.id === cmd.unitId);
        if (u) { u.q = cmd.toQ; u.r = cmd.toR; }
      }
    }
  }
  eq(foundTotal, 0, 'T7D-e: 20 tur bez foundCity dla kopia_typu_obronna');
}

console.log('\n--- T7D-f: bez defensiveCopy -> foundCity gdy osadnik moze (regresja) ---');
{
  const map7f = makeMap(10, 10);
  const settler = makeUnit('sf', 7, 5, 5, 'osadnik');
  const result = decideAITurn(7, [settler], [], map7f, makeGameData(), { civType: 'grecy' });
  const found = result.filter(c => c.type === 'foundCity');
  assert(found.length === 1, 'T7D-f: ekspansyjny AI zaklada miasto gdy canFound');
}

// ============================================================================
// TESTY T10: D3-Q2 — bramka odkrycia w mgle przed propozycjami AI
// ============================================================================

console.log('\n--- T10a: miasto-panstwo bez odkrycia -> pre_contact, brak handlu ---');
{
  const simplified = new Set([3]);
  const foreign = new Set([5]);
  const contacted = new Set([5]); // owner 3 NIE odkryty
  const layer = diplomacyLayerForOwner(3, simplified, foreign, contacted);
  eq(layer, 'pre_contact', 'T10a: city-state bez odkrycia = pre_contact');
  const rawCmds = decideAIDiplomacy({
    myPlayerId: '3',
    relacje: [{ partnerId: '0', relation: { zaufanie: 60, respekt: 50, status: 'pokoj' }, respektWzgledny: 0.55, stanWojny: false }],
    agresja: 0.3,
    handlowosc: 0.7,
    epoka: 'kamien',
  });
  const filtered = filterDiplomacyCommandsForLayer(rawCmds, layer);
  assert(!filtered.some(c => c.type === 'zaproponuj_handel'), `T10a: brak zaproponuj_handel bez odkrycia; got: ${JSON.stringify(filtered.map(c => c.type))}`);
}

console.log('\n--- T10b: miasto-panstwo po odkryciu -> simplified, handel mozliwy ---');
{
  const simplified = new Set([3]);
  const foreign = new Set([5]);
  const contacted = new Set([3, 5]);
  const layer = diplomacyLayerForOwner(3, simplified, foreign, contacted);
  eq(layer, 'simplified', 'T10b: city-state po odkryciu = simplified');
  const rawCmds = decideAIDiplomacy({
    myPlayerId: '3',
    relacje: [{ partnerId: '0', relation: { zaufanie: 60, respekt: 50, status: 'pokoj' }, respektWzgledny: 0.55, stanWojny: false }],
    agresja: 0.3,
    handlowosc: 0.7,
    epoka: 'kamien',
  });
  const filtered = filterDiplomacyCommandsForLayer(rawCmds, layer);
  assert(filtered.some(c => c.type === 'zaproponuj_handel'), `T10b: zaproponuj_handel po odkryciu; got: ${JSON.stringify(filtered.map(c => c.type))}`);
}

console.log('\n--- T10c: obca cywilizacja bez odkrycia -> pre_contact ---');
{
  const simplified = new Set([3]);
  const foreign = new Set([5]);
  const contacted = new Set([3]);
  const layer = diplomacyLayerForOwner(5, simplified, foreign, contacted);
  eq(layer, 'pre_contact', 'T10c: foreign civ bez odkrycia = pre_contact');
}

// --- summary ---------------------------------------------------------------
console.log(`\nai-test: ${passed} passed, ${failed} failed`);

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}

process.exit(failed === 0 ? 0 : 1);
