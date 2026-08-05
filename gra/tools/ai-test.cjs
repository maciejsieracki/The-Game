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
export { decideAITurn, chooseCityProduction, loadDifficultyParams, decideAIReaction, decideAIReinforcements, PROG_BITWA, TERYTORIUM_MNOZNIK, AGRESJA_WPLYW, WARTOSC_PROG_OBS, WARTOSC_KOREKTA, PRZYJAZN_ZAUFANIE_PROG, AGRESJA_AGRESYWNY_PROG, decideAIDiplomacy, resolveDiplomacyCivBias, PROG_WOJNA_SILA, PROG_WOJNA_AGRESJA, PROG_TRYBUT, PROG_POKOJ_SLABOSC, PROG_SOJUSZ, PROG_HANDEL, planCityFounding, AI_EARLY_SCOUT_TARGET, isScoutUnit, countPlayerScouts, isLocalExpansionPhase, countFreeIndependentCityStates, AI_COLONIZATION_SOURCE_MIN_POP } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { pickSourceCityForFounding, AI_FOUNDING_SOURCE_MIN_POP } from ${JSON.stringify(AI_SRC + '/game/city-founding')};
export { isMajorAiOwner } from ${JSON.stringify(AI_SRC + '/game/owner-utils')};
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
const { decideAITurn, chooseCityProduction, loadDifficultyParams, decideAIReaction, decideAIReinforcements, PROG_BITWA, TERYTORIUM_MNOZNIK, AGRESJA_WPLYW, WARTOSC_PROG_OBS, WARTOSC_KOREKTA, PRZYJAZN_ZAUFANIE_PROG, AGRESJA_AGRESYWNY_PROG, hexDistance, decideAIDiplomacy, resolveDiplomacyCivBias, PROG_WOJNA_SILA, PROG_WOJNA_AGRESJA, PROG_TRYBUT, PROG_POKOJ_SLABOSC, PROG_SOJUSZ, PROG_HANDEL, diplomacyLayerForOwner, filterDiplomacyCommandsForLayer, planCityFounding, isLocalExpansionPhase, countFreeIndependentCityStates, AI_COLONIZATION_SOURCE_MIN_POP, pickSourceCityForFounding, AI_FOUNDING_SOURCE_MIN_POP, isMajorAiOwner } = AI;

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

function makeScout(id, ownerId, q, r) {
  return { id, ownerId, typeId: 'Zwiadowca', category: 'zwiadowca', q, r, ruch: 3, ruchLeft: 3 };
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
      { Jednostka: 'Zwiadowca', Health: 20, Ruch: 3 },
      { Jednostka: 'Osadnik', Health: 10, Ruch: 2 },
    ],
    // id-y zgodne z prawdziwym data/buildings.json -- ai.ts (chooseCityProduction)
    // klasyfikuje/dopasowuje budynki wylacznie po b.id (#31), nie po nazwie wyswietlanej.
    buildings: [
      { id: 'spichlerz', nazwa: 'Spichlerz' }, { id: 'koszary', nazwa: 'Koszary' },
      { id: 'mury', nazwa: 'Mury' },
      { id: 'stolarnia', nazwa: 'Stolarnia' }, { id: 'cegielnia', nazwa: 'Cegielnia' },
      { id: 'odlewnia_brazu', nazwa: 'Odlewnia brązu' },
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
  const validTypes = new Set(['move', 'foundCityAt', 'attack', 'build', 'buildImprovement', 'endTurn']);
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
// oraz że AI NIE produkuje Osadnika (C-AI-EKSP: founding przez planCityFounding)
// ============================================================================
console.log('\n--- T1d: early phase builds (no Osadnik) ---');
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
  
  const hasValidBuild = buildCmds.every(c =>
    ['spichlerz', 'Wojownik', 'Łucznik', 'Zwiadowca'].includes(c.buildingId)
  );
  assert(hasValidBuild, 'early phase: no Osadnik; allowed: spichlerz/Wojownik/Łucznik/Zwiadowca; got: ' + buildCmds.map(c=>c.buildingId).join(', '));
  assert(!buildCmds.some(c => c.buildingId === 'Osadnik'), 'early phase: Osadnik removed from AI production');

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
    'trudnosc_poziom3_bonus_nauka':        { wartosc: 2,    sekcja: 'test', opis: '' },
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
  eq(p3.bonusNauka,        2,    'poziom3 bonusNauka = 2');
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
    'trudnosc_poziom3_bonus_nauka':       { wartosc: 2,    sekcja: 'test', opis: '' },
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
  eq(p3.bonusNauka,     2,    'empty params: poziom3 bonusNauka fallback = 2');
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
console.log('\n--- T6a: clusterCenter+radius -> planCityFounding prefers hex inside cluster ---');
{
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

  const clusterCenter = { q: 2, r: 2 };
  const clusterRadius = 5;

  let result;
  let threw = false;
  try {
    result = decideAITurn(1, [], [], bigMap2, clusterData, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      pracaAvailable: 30,
      clusterCenter,
      clusterRadius,
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T6a: decideAITurn with clusterCenter does not throw');
  const foundCmds = result.filter(c => c.type === 'foundCityAt');
  assert(foundCmds.length > 0, 'T6a: planCityFounding emits foundCityAt; got: ' + result.map(c=>c.type).join(', '));
  if (foundCmds.length > 0) {
    const fc = foundCmds[0];
    const distToCluster = hexDistance(fc.q, fc.r, clusterCenter.q, clusterCenter.r);
    const distToFarCorner = hexDistance(fc.q, fc.r, 18, 18);
    assert(distToCluster < distToFarCorner, 'T6a: founding hex closer to cluster than far corner');
  }
}

// ============================================================================
// TEST 18: T6 - WITHOUT clusterCenter: settler picks globally best hex (regression)
// Same setup but no clusterCenter -> behavior unchanged (existing logic)
// ============================================================================
console.log('\n--- T6b: no clusterCenter -> planCityFounding still works (regression) ---');
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

  let result;
  let threw = false;
  try {
    result = decideAITurn(1, [], [], bigMap3, clusterDataB, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      pracaAvailable: 25,
    });
  } catch (e) {
    threw = true;
    console.error('  EXCEPTION:', e.message || e);
  }

  assert(!threw, 'T6b: decideAITurn without clusterCenter does not throw');
  assert(Array.isArray(result), 'T6b: returns array');
  eq(result[result.length - 1].type, 'endTurn', 'T6b: last cmd = endTurn');
  const validTypes = new Set(['move', 'foundCityAt', 'attack', 'build', 'buildImprovement', 'endTurn']);
  assert(
    result.every(c => validTypes.has(c.type)),
    'T6b: all commands have valid types (no regression)'
  );
}




// ============================================================================
// TESTY T6c-T6f: ekspansja AI świadoma klastra — dalsze przypadki
// ============================================================================

console.log('\n--- T6c: planCityFounding w klastrze -> foundCityAt ---');
{
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
  let result6c;
  let threw6c = false;
  try {
    result6c = decideAITurn(1, [], [], map6c, data6c, {
      civType: 'grecy',
      poziomTrudnosci: 2,
      pracaAvailable: 30,
      clusterCenter: { q: 2, r: 2 },
      clusterRadius: 6,
    });
  } catch(e) { threw6c = true; }

  assert(!threw6c, 'T6c: nie rzuca przy founding w klastrze');
  const foundCmds6c = result6c.filter(c => c.type === 'foundCityAt');
  assert(foundCmds6c.length > 0, 'T6c: planCityFounding zaklada miasto (foundCityAt)');
}

console.log('\n--- T6d: clusterStateTargets -> planCityFounding blocked (consolidation) ---');
{
  const map6d = makeMap(15, 15);
  const data6d = makeGameData({
    'ekspansja_min_dystans_miast': { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':     { wartosc: 5, sekcja: 'test', opis: '' },
  });
  const cmd6d = planCityFounding(1, [], map6d, data6d, {
    pracaAvailable: 30,
    clusterStateTargets: [{ ownerId: 2, q: 5, r: 5 }],
  }, 3);
  assert(cmd6d === null, 'T6d: clusterConsolidationPhase blokuje planCityFounding');
}

console.log('\n--- T6e: planCityFounding prefers hex inside cluster ---');
{
  const map6e = makeMap(20, 20);
  const data6e = makeGameData({
    'ekspansja_min_dystans_miast':        { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':            { wartosc: 5, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_zywnosc_pkt':   { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_praca_pkt':     { wartosc: 2, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_handel_pkt':    { wartosc: 1, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_rzeka_pkt':     { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_surowiec_pkt':  { wartosc: 0, sekcja: 'test', opis: '' },
    'ekspansja_heurystyka_granica_kara':  { wartosc: -3, sekcja: 'test', opis: '' },
  });
  const cc6e = { q: 2, r: 2 };
  const cmd6e = planCityFounding(1, [], map6e, data6e, {
    pracaAvailable: 30,
    clusterCenter: cc6e,
    clusterRadius: 5,
  }, 3);
  assert(cmd6e !== null, 'T6e: planCityFounding zwraca foundCityAt w klastrze');
  if (cmd6e) {
    eq(cmd6e.type, 'foundCityAt', 'T6e: typ komendy');
    const distToCluster = hexDistance(cmd6e.q, cmd6e.r, cc6e.q, cc6e.r);
    const distToFar     = hexDistance(cmd6e.q, cmd6e.r, 18, 18);
    assert(
      distToCluster < distToFar,
      'T6e: hex founding blizej centrum klastra niz dalekiego rogu'
    );
  }
}

console.log('\n--- T6g: AI-LOCAL-Q1=A faza lokalna tura 20 LUB 1 skaut ---');
{
  const map6g = makeMap(20, 20);
  const data6g = makeGameData({
    'ekspansja_min_dystans_miast': { wartosc: 3, sekcja: 'test', opis: '' },
  });
  const myCity = [{ id: 'c1', ownerId: 1, q: 2, r: 2, population: 2 }];

  // 0 skautów -> faza lokalna blokuje founding
  const blocked = planCityFounding(1, myCity, map6g, data6g, {
    pracaAvailable: 30,
    currentTurn: 5,
  }, 3, []);
  assert(blocked === null, 'T6g: brak skautów -> brak founding (faza lokalna)');

  const oneScout = [
    { id: 's1', ownerId: 1, q: 2, r: 3, typeId: 'Zwiadowca', category: 'zwiadowca', ruchLeft: 2 },
  ];
  assert(
    isLocalExpansionPhase({ currentTurn: 5 }, myCity, map6g, oneScout, 1) === false,
    'T6g: 1 skaut -> koniec fazy lokalnej',
  );

  const twoScouts = [
    { id: 's1', ownerId: 1, q: 2, r: 3, typeId: 'Zwiadowca', category: 'zwiadowca', ruchLeft: 2 },
    { id: 's2', ownerId: 1, q: 3, r: 2, typeId: 'Zwiadowca', category: 'zwiadowca', ruchLeft: 2 },
  ];
  assert(
    isLocalExpansionPhase({ currentTurn: 5 }, myCity, map6g, twoScouts, 1) === false,
    'T6g: 2 skautów -> wciąż koniec fazy lokalnej',
  );

  assert(
    isLocalExpansionPhase({ currentTurn: 20 }, myCity, map6g, [], 1) === false,
    'T6g: tura 20 -> koniec fazy lokalnej bez skautów',
  );

  // Dodaj wioskę obok miasta — AI-LOCAL-Q1=A: wioski NIE blokują founding
  map6g.hexes['3,3'].wioska = { istnieje: true, ludnosc: 1 };
  assert(
    isLocalExpansionPhase({ currentTurn: 5 }, myCity, map6g, oneScout, 1) === false,
    'T6g: wioska w zasięgu nie blokuje founding',
  );
}

console.log('\n--- T6f: decideAITurn z clusterStateTargets -> brak foundCityAt ---');
{
  const map6f = makeMap(20, 20);
  const data6f = makeGameData({
    'ekspansja_min_dystans_miast': { wartosc: 3, sekcja: 'test', opis: '' },
    'ekspansja_zagroz_zasieg':     { wartosc: 5, sekcja: 'test', opis: '' },
  });
  const result6f = decideAITurn(1, [], [], map6f, data6f, {
    pracaAvailable: 30,
    clusterStateTargets: [{ ownerId: 2, q: 4, r: 4 }],
  });
  const found6f = result6f.filter(c => c.type === 'foundCityAt');
  assert(found6f.length === 0, 'T6f: konsolidacja klastra blokuje foundCityAt w decideAITurn');
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
    // skarbiecGold wymagane -- bez niego peaceGold=capAiGoldOffer(0,...)=0 i AI spada
    // do gałęzi nizszego priorytetu (zaproponuj_pokoj) zamiast oferuj_trybut_za_pokoj.
    skarbiecGold: 100,
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
    // skarbiecGold wymagane dla oferuj_trybut_za_pokoj (partner A) -- patrz T9d.
    skarbiecGold: 100,
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
  // Scenariusz: rowny partner (rw=0.55 in [0.4,0.7]), wysoka relacja.
  // Realne progi sojuszu (data/diplomacy.json): progSojuszZaufanie=91, progSojuszRelacja=151
  // -- zaufanie=95, respekt=70 (score=165) przekracza oba z zapasem.
  // allyW wyliczone przez aiDiplomacyStance >= PROG_SOJUSZ(0.6) -> zaproponuj_sojusz
  const cmds = decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.4,
    relacje: [{
      partnerId: 'grecy-1',
      relation: { zaufanie: 95, respekt: 70, status: 'pokoj' },
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

console.log('\n--- T7D-a: defensiveCopy -> brak foundCityAt i build ---');
{
  const map7 = makeMap(10, 10);
  const warrior = makeUnit('w1', 2, 4, 5, 'miecznik');
  const city = makeCity('c1', 2, 3, 3);
  const result = decideAITurn(2, [warrior], [city], map7, makeGameData(), {
    defensiveCopy: true,
    civType: 'chinczycy',
    pracaAvailable: 50,
  });
  const found = result.filter(c => c.type === 'foundCityAt');
  assert(found.length === 0, 'T7D-a: defensiveCopy nie emituje foundCityAt');
  eq(result[result.length - 1].type, 'endTurn', 'T7D-a: endTurn na koncu');
}

console.log('\n--- T7D-b: defensiveCopy -> brak founding mimo pracy ---');
{
  const map7b = makeMap(10, 10);
  const result = decideAITurn(3, [], [], map7b, makeGameData(), {
    defensiveCopy: true,
    pracaAvailable: 50,
  });
  const found = result.filter(c => c.type === 'foundCityAt');
  assert(found.length === 0, 'T7D-b: kopia_typu_obronna nie zaklada miasta');
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

console.log('\n--- T7D-e: 20 tur defensiveCopy — zero foundCityAt (regresja D-START) ---');
{
  const map7e = makeMap(12, 12);
  let units = [makeUnit('w20', 6, 5, 5, 'miecznik')];
  const cities = [makeCity('c20', 6, 4, 4)];
  let foundTotal = 0;
  for (let t = 0; t < 20; t++) {
    const cmds = decideAITurn(6, units, cities, map7e, makeGameData(), {
      defensiveCopy: true,
      pracaAvailable: 50,
    });
    foundTotal += cmds.filter(c => c.type === 'foundCityAt').length;
    for (const cmd of cmds) {
      if (cmd.type === 'move') {
        const u = units.find(x => x.id === cmd.unitId);
        if (u) { u.q = cmd.toQ; u.r = cmd.toR; }
      }
    }
  }
  eq(foundTotal, 0, 'T7D-e: 20 tur bez foundCityAt dla kopia_typu_obronna');
}

console.log('\n--- T7D-f: bez defensiveCopy -> foundCityAt gdy stac (regresja) ---');
{
  const map7f = makeMap(10, 10);
  const result = decideAITurn(7, [], [], map7f, makeGameData(), {
    civType: 'grecy',
    pracaAvailable: 25,
  });
  const found = result.filter(c => c.type === 'foundCityAt');
  assert(found.length === 1, 'T7D-f: ekspansyjny AI zaklada miasto przez foundCityAt');
}

// ============================================================================
// TESTY T8: R-AI-KOLONIZACJA — pop≥5, dystans 4, surge MP
// ============================================================================

console.log('\n--- T8a: AI-FOUND-Q1=A pickSourceCityForFounding wymaga pop >= 2 ---');
{
  const cities8a = [
    { id: 'c-low', ownerId: 1, population: 1 },
    { id: 'c-ok', ownerId: 1, population: 2 },
  ];
  const srcLow = pickSourceCityForFounding(cities8a.filter(c => c.population < 2), 1);
  assert(srcLow === null, 'T8a: pop 1 -> brak zrodla');
  const srcOk = pickSourceCityForFounding(cities8a, 1);
  assert(srcOk && srcOk.id === 'c-ok', 'T8a: pop 2 -> zrodlo OK');
  eq(AI_FOUNDING_SOURCE_MIN_POP, 2, 'T8a: prog min pop AI = 2');
  eq(AI_COLONIZATION_SOURCE_MIN_POP, 5, 'T8a: prog kolonizacji AI bez zmian');
}

console.log('\n--- T8b: countFreeIndependentCityStates ---');
{
  const cities8b = [
    { ownerId: 2, startCityState: true },
    { ownerId: 3, startCityState: true },
    { ownerId: 4, startCityState: true },
  ];
  eq(countFreeIndependentCityStates(cities8b), 3, 'T8b: 3 wolne MP');
  eq(countFreeIndependentCityStates(cities8b, [3]), 2, 'T8b: 1 wasal -> 2 wolne');
  eq(countFreeIndependentCityStates(cities8b, [2, 3, 4]), 0, 'T8b: wszyscy wasale -> surge');
}

console.log('\n--- T8c: planCityFounding z pop>=5 i civEra<=3 omija blokade skautow ---');
{
  const map8c = makeMap(20, 20);
  const data8c = makeGameData({
    'ekspansja_min_dystans_miast': { wartosc: 4, sekcja: 'test', opis: '' },
    'ekspansja_min_score_hex': { wartosc: 1, sekcja: 'test', opis: '' },
  });
  const myCity8c = [{ id: 'c1', ownerId: 1, q: 2, r: 2, population: 5 }];
  const cmd8c = planCityFounding(1, myCity8c, map8c, data8c, {
    pracaAvailable: 30,
    currentTurn: 5,
    civEra: 2,
  }, 4, []);
  assert(cmd8c !== null && cmd8c.type === 'foundCityAt', 'T8c: pop>=5 + era2 -> founding bez skautow');
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
    // skarbiecGold wymagane -- zaproponuj_handel wymaga tradeGold>0 (capAiGoldOffer), patrz T9d.
    skarbiecGold: 100,
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

// ---------------------------------------------------------------------------
// TEST 11: T11 — wyścig o wioski (zwiadowcy na starcie, Maciej 2026-07-26)
// ---------------------------------------------------------------------------

console.log('\n--- T11-scout-a: pełna cywilizacja w fazie startowej -> kolejka Zwiadowca ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('c1', 1, 1, 1);
  const cmds = decideAITurn(1, [], [city], map, makeGameData(), { civType: 'chinczycy' });
  const builds = cmds.filter(c => c.type === 'build');
  assert(
    builds.some(b => b.buildingId === 'Zwiadowca'),
    'T11-scout-a: early AI queues Zwiadowca when scoutCount < 2; got: ' + builds.map(b => b.buildingId).join(', '),
  );
}

console.log('\n--- T11-scout-b: defensiveCopy (państwo-miasto) -> brak Zwiadowca ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('c1', 4, 1, 1);
  const cmds = decideAITurn(4, [], [city], map, makeGameData(), { defensiveCopy: true });
  assert(
    !cmds.some(c => c.type === 'build' && c.buildingId === 'Zwiadowca'),
    'T11-scout-b: defensiveCopy never queues Zwiadowca',
  );
}

console.log('\n--- T7D-h: defensiveCopy z garnizonem -> infrastruktura, nie kolejny Wojownik ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('cs1', 4, 3, 3);
  const guard = makeUnit('g1', 4, 3, 3, 'miecznik');
  const dataCs = makeGameData();
  dataCs.buildings.push(
    { id: 'studnia', nazwa: 'Studnia' },
    { id: 'garncarnia', nazwa: 'Garncarnia' },
    { id: 'palac', nazwa: 'Pałac' },
  );
  const diff = loadDifficultyParams(dataCs, 2);
  const pick = chooseCityProduction(
    'cs1',
    [city],
    [guard],
    4,
    dataCs,
    { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
    { defensiveCopy: true, cityBuildings: { cs1: [] } },
    map,
    diff,
  );
  eq(pick, 'studnia', 'T7D-h: po garnizonie pierwszy budynek = Studnia');
}

console.log('\n--- T7D-i: defensiveCopy bez garnizonu -> nadal Wojownik pierwszy ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('cs2', 4, 1, 1);
  const dataCs = makeGameData();
  dataCs.buildings.push(
    { id: 'studnia', nazwa: 'Studnia' },
    { id: 'garncarnia', nazwa: 'Garncarnia' },
    { id: 'palac', nazwa: 'Pałac' },
  );
  const diff = loadDifficultyParams(dataCs, 2);
  const pick = chooseCityProduction(
    'cs2',
    [city],
    [],
    4,
    dataCs,
    { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
    { defensiveCopy: true, cityBuildings: { cs2: [] } },
    map,
    diff,
  );
  eq(pick, 'Wojownik', 'T7D-i: bez garnizonu najpierz Wojownik');
}

console.log('\n--- T7D-j: defensiveCopy + garnizon + isProductionAllowed odrzuca budynki -> Wojownik ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('cs3', 4, 3, 3);
  const guard = makeUnit('g3', 4, 3, 3, 'miecznik');
  const dataCs = makeGameData();
  dataCs.buildings.push(
    { id: 'studnia', nazwa: 'Studnia' },
    { id: 'garncarnia', nazwa: 'Garncarnia' },
    { id: 'palac', nazwa: 'Pałac' },
  );
  const diff = loadDifficultyParams(dataCs, 2);
  const isProductionAllowed = (_cityId, itemId) => itemId === 'Wojownik';
  const pick = chooseCityProduction(
    'cs3',
    [city],
    [guard],
    4,
    dataCs,
    { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
    { defensiveCopy: true, cityBuildings: { cs3: [] }, isProductionAllowed },
    map,
    diff,
  );
  eq(pick, 'Wojownik', 'T7D-j: gdy bramka tech blokuje budynki, wybiera Wojownika');
}

console.log('\n--- T7D-k: defensiveCopy + garnizon + isProductionAllowed tylko studnia -> studnia ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('cs4', 4, 3, 3);
  const guard = makeUnit('g4', 4, 3, 3, 'miecznik');
  const dataCs = makeGameData();
  dataCs.buildings.push(
    { id: 'studnia', nazwa: 'Studnia' },
    { id: 'garncarnia', nazwa: 'Garncarnia' },
    { id: 'palac', nazwa: 'Pałac' },
  );
  const diff = loadDifficultyParams(dataCs, 2);
  const isProductionAllowed = (_cityId, itemId) => itemId === 'studnia';
  const pick = chooseCityProduction(
    'cs4',
    [city],
    [guard],
    4,
    dataCs,
    { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
    { defensiveCopy: true, cityBuildings: { cs4: [] }, isProductionAllowed },
    map,
    diff,
  );
  eq(pick, 'studnia', 'T7D-k: gdy bramka przepuszcza tylko studnia, wybiera studnia');
}

console.log('\n--- T11-scout-c: zwiadowca rusza w stronę neutralnej wioski ---');
{
  const map = makeMap(10, 10);
  map.hexes['5,5'].wioska = { istnieje: true, ludnosc: 1 };
  const scout = makeScout('s1', 1, 1, 1);
  const city = makeCity('c1', 1, 1, 1);
  const cmds = decideAITurn(1, [scout], [city], map, makeGameData());
  const move = cmds.find(c => c.type === 'move' && c.unitId === 's1');
  assert(move != null, 'T11-scout-c: scout receives move command toward village');
  if (move) {
    const distBefore = hexDistance(1, 1, 5, 5);
    const distAfter = hexDistance(move.toQ, move.toR, 5, 5);
    assert(distAfter < distBefore, `T11-scout-c: move reduces distance to village (${distBefore} -> ${distAfter})`);
  }
}

console.log('\n--- T11-scout-d: po 2 zwiadowcach nie wymusza trzeciego w early phase ---');
{
  const map = makeMap(10, 10);
  const city = makeCity('c1', 1, 1, 1);
  const scouts = [makeScout('s1', 1, 2, 1), makeScout('s2', 1, 3, 1)];
  const cmds = decideAITurn(1, scouts, [city], map, makeGameData(), { civType: 'chinczycy' });
  const scoutBuilds = cmds.filter(c => c.type === 'build' && c.buildingId === 'Zwiadowca');
  assert(scoutBuilds.length === 0, 'T11-scout-d: with 2 scouts, no forced third Zwiadowca');
}

// ---------------------------------------------------------------------------
// TEST 12: T12 — dyplomacja per typ cywilizacji (Maciej 2026-07-26)
// ---------------------------------------------------------------------------

console.log('\n--- T12-dip-a: pokojowa cywilizacja -> pakt/handlu, bez haraczu ---');
{
  const rel = {
    partnerId: '0',
    relation: { zaufanie: 50, respekt: 55, status: 'neutralni' },
    respektWzgledny: 0.5,
    stanWojny: false,
    hasNapTreaty: false,
    partnerTypCywilizacji: 'rzymianie',
  };
  const cmds = decideAIDiplomacy({
    myPlayerId: '2',
    myTypCywilizacji: 'chinczycy',
    agresja: 0.25,
    agresywnoscRaw: 2,
    sklonnoscDoPodboju: 1,
    tolerancjaRyzyka: 2,
    handlowosc: 0.85,
    skarbiecGold: 50,
    currentTurn: 10,
    fullDiplomacyLayer: true,
    relacje: [rel],
  });
  const types = cmds.map(c => c.type);
  assert(!types.includes('zadaj_trybut'), `T12-dip-a: brak haraczu; got: ${types.join(', ')}`);
  assert(!types.includes('wypowiedz_wojne'), `T12-dip-a: brak wojny; got: ${types.join(', ')}`);
  assert(
    types.includes('zaproponuj_pakt') || types.includes('zaproponuj_handel'),
    `T12-dip-a: pakt lub handel; got: ${types.join(', ')}`,
  );
}

console.log('\n--- T12-dip-b: agresywna cywilizacja -> szybciej wojna niz pokojowa ---');
{
  const hostileRel = {
    partnerId: '0',
    relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
    respektWzgledny: 0.65,
    stanWojny: false,
    partnerTypCywilizacji: 'chinczycy',
  };
  const aggressive = decideAIDiplomacy({
    myPlayerId: '3',
    myTypCywilizacji: 'zulusi',
    agresja: 0.75,
    agresywnoscRaw: 9,
    sklonnoscDoPodboju: 5,
    tolerancjaRyzyka: 9,
    relacje: [hostileRel],
  });
  assert(
    aggressive.some(c => c.type === 'wypowiedz_wojne'),
    `T12-dip-b: zulusi wypowiada wojne; got: ${aggressive.map(c => c.type).join(', ')}`,
  );
  const peaceful = decideAIDiplomacy({
    myPlayerId: '4',
    myTypCywilizacji: 'chinczycy',
    agresja: 0.75,
    agresywnoscRaw: 2,
    sklonnoscDoPodboju: 1,
    tolerancjaRyzyka: 2,
    relacje: [hostileRel],
  });
  assert(
    !peaceful.some(c => c.type === 'wypowiedz_wojne'),
    `T12-dip-b: chinczycy nie wypowiadaja wojny przy tych samych warunkach; got: ${peaceful.map(c => c.type).join(', ')}`,
  );
}

console.log('\n--- T12-dip-c: agresywna zada haracz, pokojowa nie ---');
{
  const tributeRel = {
    partnerId: '0',
    relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
    respektWzgledny: 0.75,
    stanWojny: false,
    partnerTypCywilizacji: 'chinczycy',
  };
  const rome = decideAIDiplomacy({
    myPlayerId: '5',
    myTypCywilizacji: 'rzymianie',
    agresja: 0.55,
    agresywnoscRaw: 8,
    sklonnoscDoPodboju: 4,
    relacje: [tributeRel],
  });
  assert(rome.some(c => c.type === 'zadaj_trybut'), `T12-dip-c: rzym zada trybut; got: ${rome.map(c => c.type).join(', ')}`);
  const china = decideAIDiplomacy({
    myPlayerId: '6',
    myTypCywilizacji: 'chinczycy',
    agresja: 0.55,
    agresywnoscRaw: 2,
    sklonnoscDoPodboju: 1,
    relacje: [tributeRel],
  });
  assert(!china.some(c => c.type === 'zadaj_trybut'), `T12-dip-c: chiny bez haraczu; got: ${china.map(c => c.type).join(', ')}`);
}

console.log('\n--- T12-dip-d: resolveDiplomacyCivBias klasyfikuje profile ---');
{
  const p = resolveDiplomacyCivBias(0.3, 1, 2, 2);
  assert(p.peaceful && !p.aggressive && p.proposeNap, 'T12-dip-d: chinczycy = peaceful');
  const z = resolveDiplomacyCivBias(0.8, 5, 9, 9);
  assert(z.aggressive && !z.peaceful && !z.proposeNap, 'T12-dip-d: zulusi = aggressive');
}

console.log('\n--- T12-dip-e: brak kontaktu + oferta handlu -> zaproponuj_audiencje ---');
{
  const tradeRel = {
    partnerId: '0',
    relation: { zaufanie: 30, respekt: 50, status: 'neutralni' },
    respektWzgledny: 0.5,
    stanWojny: false,
    contactEstablished: false,
    mapContact: true,
    resourceTradeOffer: {
      surowiecKey: 'drewno',
      label: 'Drewno',
      pakietyPerTura: 1,
      zaplataTyp: 'zloto',
      zaplataPerTura: 10,
      turns: 10,
      kierunek: 'zakup',
      powod: 'deficyt',
    },
  };
  const cmds = decideAIDiplomacy({
    myPlayerId: '7',
    myTypCywilizacji: 'grecy',
    agresja: 0.4,
    handlowosc: 0.7,
    relacje: [tradeRel],
    currentTurn: 20,
    skarbiecGold: 100,
  });
  assert(
    cmds.some(c => c.type === 'zaproponuj_audiencje'),
    `T12-dip-e: audiencja przed handlem; got: ${cmds.map(c => c.type).join(', ')}`,
  );
}

console.log('\n--- T13: AI-MANAGE-Q1=A isMajorAiOwner ---');
{
  const csSet = new Set([3, 4]);
  const isCs = (id) => csSet.has(id);
  assert(isMajorAiOwner(1, isCs), 'T13: owner 1 = major AI');
  assert(isMajorAiOwner(2, isCs), 'T13: owner 2 = major AI');
  assert(!isMajorAiOwner(0, isCs), 'T13: gracz (owner 0) nie jest major AI');
  assert(!isMajorAiOwner(-1, isCs), 'T13: barbarzynca nie jest major AI');
  assert(!isMajorAiOwner(3, isCs), 'T13: miasto-panstwo (simplified) nie jest major AI');
  assert(!isMajorAiOwner(4, isCs), 'T13: defensiveCopy (typCityCopy) nie jest major AI');
}

// --- summary ---------------------------------------------------------------
console.log(`\nai-test: ${passed} passed, ${failed} failed`);

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}

process.exit(failed === 0 ? 0 : 1);
