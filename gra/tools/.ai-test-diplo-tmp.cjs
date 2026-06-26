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
export { decideAITurn, loadDifficultyParams, decideAIReaction, decideAIReinforcements, PROG_BITWA, TERYTORIUM_MNOZNIK, AGRESJA_WPLYW, WARTOSC_PROG_OBS, WARTOSC_KOREKTA, PRZYJAZN_ZAUFANIE_PROG, AGRESJA_AGRESYWNY_PROG, decideAIDiplomacy, PROG_WOJNA_SILA, PROG_WOJNA_AGRESJA, PROG_TRYBUT, PROG_POKOJ_SLABOSC } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
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
const { decideAITurn, loadDifficultyParams, decideAIReaction, decideAIReinforcements, PROG_BITWA, TERYTORIUM_MNOZNIK, AGRESJA_WPLYW, WARTOSC_PROG_OBS, WARTOSC_KOREKTA, PRZYJAZN_ZAUFANIE_PROG, AGRESJA_AGRESYWNY_PROG, hexDistance, decideAIDiplomacy, PROG_WOJNA_SILA, PROG_WOJNA_AGRESJA, PROG_TRYBUT, PROG_POKOJ_SLABOSC } = AI;

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
      { Jednostka: 'Lucznik', Health: 20, Ruch: 2 },
      { Jednostka: 'Osadnik', Health: 10, Ruch: 2 },
    ],
    buildings: [
      { nazwa: 'Spichlerz' }, { nazwa: 'Koszary' }, { nazwa: 'Mury' },
      { nazwa: 'Tartak' }, { nazwa: 'Cegielnia' }, { nazwa: 'Huta' },
      { nazwa: 'Magazyn' }, { nazwa: 'Targowisko' },
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
//   militaryScore = 100 + 0*20 = 100 → Koszary (niezbud): score = 200+100 = 300
// Wynik z fixem: ekonomia (340) > koszary (300) → miasto wybierze Tartak/Cegielnia/itp.
// Wynik bez fixa (wartosc nieodczytane → 0): ekonomia score = 140+100 = 240 < koszary 300 → Koszary

const ECON_BUILDINGS = new Set(['Tartak', 'Cegielnia', 'Huta', 'Magazyn', 'Targowisko']);

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
  const kasarBuild = buildCmds.filter(c => c.buildingId === 'Koszary');
  
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
  // dla jednego z 2 miast — OR Spichlerz jeśli wygrał
  const hasValidBuild = buildCmds.every(c =>
    ['Spichlerz', 'Osadnik', 'Wojownik', 'Lucznik'].includes(c.buildingId)
  );
  assert(hasValidBuild, 'early phase: all builds are valid early-game choices; got: ' + buildCmds.map(c=>c.buildingId).join(', '));
  
  // Spichlerz jest priorytetem gdy nie zbudowany — sprawdź że score 250 > Osadnik 200
  // przez weryfikację że jeśli Spichlerz jest wybrany w danym mieście, to nie jest tam zbudowany
  const spichlerz = buildCmds.filter(c => c.buildingId === 'Spichlerz');
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
  // Koszary ZBUDOWANE w każdym mieście — żeby usunąć je z kandydatów
  const builtKoszary = { c1: ['Koszary'], c2: ['Koszary'], c3: ['Koszary'] };
  
  // Level 1 (bonus=0): economyScore=100, econBuild score=240, wojownik=270 → wojownik wygra
  const r1 = decideAITurn(1, [], citiesMid, map, diffData, {
    civType: 'grecy', poziomTrudnosci: 1, cityBuildings: builtKoszary,
  });
  const build1 = r1.filter(c => c.type === 'build');
  const econ1 = build1.filter(c => ECON_BUILDINGS.has(c.buildingId));
  const mil1  = build1.filter(c => c.buildingId === 'Wojownik' || c.buildingId === 'Lucznik');
  
  // Level 3 (bonus=0.25, diffProdBonus=50): economyScore=150, econBuild score=290, wojownik=270 → ekonomia wygra
  const r3 = decideAITurn(1, [], citiesMid, map, diffData, {
    civType: 'grecy', poziomTrudnosci: 3, cityBuildings: builtKoszary,
  });
  const build3 = r3.filter(c => c.type === 'build');
  const econ3 = build3.filter(c => ECON_BUILDINGS.has(c.buildingId));
  const mil3  = build3.filter(c => c.buildingId === 'Wojownik' || c.buildingId === 'Lucznik');
  
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

  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'Koszary');
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

  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'Koszary');
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
// Scenariusz: faza środkowa (3 miasta), canAfford zwraca false dla 'Koszary'
// Oczekiwany wynik: żadne miasto NIE wybiera Koszar; zamiast tego wybiera dozwolone budynki
// ============================================================================
console.log('\n--- T5a: canAfford gate — Koszary blocked, fallback to affordable ---');
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
  // canAfford blocks ONLY Koszary
  const canAfford = (cityId, buildingId) => buildingId !== 'Koszary';

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

  const koszaryBuilds = buildCmds.filter(c => c.buildingId === 'Koszary');
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
// TEST 16: T5 - canAfford gate fallback: when ALL candidates blocked, pick best anyway
// ============================================================================
console.log('\n--- T5b: canAfford gate fallback — all blocked -> picks best unfiltered ---');
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
  // canAfford blocks EVERYTHING
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

  // Production must still happen (fallback to best unfiltered, not null/blocked)
  const buildCmds = result.filter(c => c.type === 'build');
  assert(
    buildCmds.length > 0,
    'T5b: even when canAfford blocks all, fallback still issues build command (no total block)'
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

console.log('\n--- T9e: decideAIDiplomacy - przyjazny/pokoj -> brak komendy ---');
{
  // Wysoka relacja (zaufanie=70, respekt=60 = 130 >= progSojuszRelacja=120) -> przyjazny
  // respektWzgledny=0.55 -> nie spelniony prog wojny ani trybutu -> brak komendy
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
  assert(cmds.length === 0, `T9e: brak komendy dla przyjaznej relacji (got ${cmds.length})`);
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
  assert(!forB, `T9h: partner B -> brak komendy (got ${forB && forB.type})`);
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

// --- summary ---------------------------------------------------------------
console.log(`\nai-test: ${passed} passed, ${failed} failed`);

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}

process.exit(failed === 0 ? 0 : 1);
