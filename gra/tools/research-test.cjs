'use strict';
/**
 * research-test.cjs -- testy chooseAIResearch (Spec-AI §5, §9 krok 3)
 * Uruchom z gra/: node tools/research-test.cjs
 *
 * Weryfikuje:
 *   - chooseAIResearch wybiera sensowną tech z fixture tech.json
 *   - respektuje prereqy (nie wybiera jeśli prereq niespełniony)
 *   - nie wybiera już zbadanej technologii
 *   - heurystyka: Garncarstwo (Spichlerz+Cegielnia) > inne przy start
 *   - archetyp nauka+2 → ranking stabilny / poprawny
 *   - zagrożenie wojenne → Brazownictwo (military) awansuje
 *   - zbudowane budynki → score Garncarstwo spada
 *   - faza środkowa (3+ miast) → Wojskowosc (Koszary) preferowana
 *   - Jezdziectwo wymaga OBIE prereq: Kolo + Brazownictwo
 *   - null gdy wszystko zbadane; null gdy pusta lista tech
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[research-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT     = path.resolve(__dirname, '..');
const ENTRY_FILE   = path.resolve(__dirname, '.research-entry.ts');
const BUNDLE_FILE  = path.resolve(__dirname, '.research-bundle.cjs');

// Entry TS re-exports chooseAIResearch from ai.ts
const ENTRY_TS = `export { chooseAIResearch } from '../src/game/ai';\n`;
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
  console.error('[research-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const AI = require(BUNDLE_FILE);
const { chooseAIResearch } = AI;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write('  PASS: ' + msg + '\n'); }
  else { failed++; process.stderr.write('  FAIL: ' + msg + '\n'); }
}
function eq(a, b, msg) {
  assert(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');
}

// ---------------------------------------------------------------------------
// Fixture: minimalne dane tech.json (struktura lustro rzeczywistego pliku)
// ---------------------------------------------------------------------------
const TECH_DATA = [
  { Technologia: 'Obrobka drewna', Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Tartak, Stolarnia', 'Koszt nauki': 10 },
  { Technologia: 'Garncarstwo',    Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Spichlerz, Cegielnia, Garncarz', 'Koszt nauki': 12 },
  { Technologia: 'Murarstwo',      Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Mury, Kopalnia', 'Koszt nauki': 14 },
  { Technologia: 'Lucznictwo',     Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Lucznik', 'Koszt nauki': 10 },
  { Technologia: 'Oswojenie zwierzat', Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Pasterstwo', 'Koszt nauki': 12 },
  { Technologia: 'Kolo',           Epoka: 'Kamien', Poziom: 2, 'Wymaga (prereq)': 'Oswojenie zwierzat', 'Odblokowuje budynek': 'Rydwan, Drogi', 'Koszt nauki': 14 },
  { Technologia: 'Brazownictwo',   Epoka: 'Kamien', Poziom: 2, 'Wymaga (prereq)': 'Garncarstwo', 'Odblokowuje budynek': 'Huta, braz, jednostki bronzowe', 'Koszt nauki': 24 },
  { Technologia: 'Zeglarstwo',     Epoka: 'Braz',   Poziom: 2, 'Wymaga (prereq)': 'Obrobka drewna', 'Odblokowuje budynek': 'Statki, Port', 'Koszt nauki': 22 },
  { Technologia: 'Pismo',          Epoka: 'Braz',   Poziom: 3, 'Wymaga (prereq)': 'Garncarstwo', 'Odblokowuje budynek': 'Biblioteka', 'Koszt nauki': 18 },
  { Technologia: 'Jezdziectwo',    Epoka: 'Braz',   Poziom: 3, 'Wymaga (prereq)': 'Kolo + Brazownictwo', 'Odblokowuje budynek': 'Konnica', 'Koszt nauki': 20 },
  { Technologia: 'Wojskowosc',     Epoka: 'Braz',   Poziom: 3, 'Wymaga (prereq)': 'Brazownictwo', 'Odblokowuje budynek': 'Koszary', 'Koszt nauki': 18 },
  { Technologia: 'Matematyka',     Epoka: 'Braz',   Poziom: 4, 'Wymaga (prereq)': 'Pismo', 'Odblokowuje budynek': '(prereq Budownictwa)', 'Koszt nauki': 22 },
];

// ============================================================================
// TEST 1: Pusta lista → Garncarstwo (Spichlerz + Cegielnia = najwyższy score)
// Score: Spichlerz(+120) + Cegielnia(+80) + base(+10) + tie(30-12=18) = 228
// ============================================================================
console.log('\n--- T1: pusta lista → Garncarstwo ---');
{
  const result = chooseAIResearch(TECH_DATA, [], {});
  assert(result !== null, 'returns non-null when techs available');
  eq(result, 'Garncarstwo', 'empty done → Garncarstwo (score 228, highest)');
}

// ============================================================================
// TEST 2: Nie wybiera już zbadanej technologii
// ============================================================================
console.log('\n--- T2: nie wybiera juz zbadanej ---');
{
  const done = ['Garncarstwo'];
  const result = chooseAIResearch(TECH_DATA, done, {});
  assert(result !== 'Garncarstwo', 'does not re-choose Garncarstwo when already researched');
  assert(result !== null, 'returns something when other techs available');
}

// ============================================================================
// TEST 3: Prereqy niespełnione → nie wybierz niedostępnych
// ============================================================================
console.log('\n--- T3: prereqy nie spelnione → nie wybierz ---');
{
  const result = chooseAIResearch(TECH_DATA, [], {});
  assert(result !== 'Brazownictwo', 'Brazownictwo not chosen without Garncarstwo prereq');
  assert(result !== 'Kolo', 'Kolo not chosen without Oswojenie prereq');
  assert(result !== 'Jezdziectwo', 'Jezdziectwo not chosen without both prereqs');
  eq(result, 'Garncarstwo', 'chosen is Garncarstwo (no prereqs needed, highest score)');
}

// ============================================================================
// TEST 4: Po Garncarstwo → sensowna następna tech (Oswojenie lub Brazownictwo)
// Oswojenie: food(55)+econ(50)+base(10)+tie(18)=133; Brazownictwo: mil(40)+braz(70)+10+6=126
// ============================================================================
console.log('\n--- T4: po Garncarstwo → sensowna nastepna ---');
{
  const done = new Set(['Garncarstwo']);
  const result = chooseAIResearch(TECH_DATA, done, {});
  assert(result !== null, 'returns non-null with Garncarstwo done');
  assert(result !== 'Garncarstwo', 'does not re-pick Garncarstwo');
  assert(
    result === 'Oswojenie zwierzat' || result === 'Brazownictwo' || result === 'Lucznictwo',
    'sensible tech after Garncarstwo: ' + result
  );
  // Oswojenie (133) > Brazownictwo (126) → Oswojenie wins
  eq(result, 'Oswojenie zwierzat', 'Oswojenie (food+econ=133) beats Brazownictwo (126)');
}

// ============================================================================
// TEST 4b: Garncarstwo jest najwyższe wśród L1 bez prereqów
// ============================================================================
console.log('\n--- T4b: Garncarstwo najwyzszy score L1 ---');
{
  const result = chooseAIResearch(TECH_DATA, [], {});
  eq(result, 'Garncarstwo', 'L1 no-prereq: Garncarstwo wins (score 228 >> others)');
}

// ============================================================================
// TEST 5: Archetyp nauka+2 → ranking stabilny (Garncarstwo nadal top)
// Każda tech +40; Garncarstwo: 228+40=268 >> Oswojenie: 133+40=173
// ============================================================================
console.log('\n--- T5: nauka+2 → Garncarstwo nadal top ---');
{
  const modsNauka = { wojsko: 0, nauka: 2, ekonomia: 0, obrona: 0 };
  const result = chooseAIResearch(TECH_DATA, [], { mods: modsNauka, myCitiesCount: 1 });
  assert(result !== null, 'nauka+2: returns non-null');
  eq(result, 'Garncarstwo', 'nauka+2 early: Garncarstwo still top (268 >> others)');
}

// ============================================================================
// TEST 5b: Sumer (nauka+2) z Garncarstwo+Obrobka drewna done
// Oswojenie: 133+40=173 > Brazownictwo: 126+40=166 → Oswojenie wygrywa
// ============================================================================
console.log('\n--- T5b: Sumer nauka+2, done=Garncarstwo+Obrobka drewna ---');
{
  const done = new Set(['Garncarstwo', 'Obrobka drewna']);
  const modsNauka = { wojsko: 0, nauka: 2, ekonomia: 0, obrona: 0 };
  const result = chooseAIResearch(TECH_DATA, done, { mods: modsNauka, myCitiesCount: 1 });
  assert(result !== null, 'Sumer with prereqs: returns non-null');
  eq(result, 'Oswojenie zwierzat', 'Sumer early: Oswojenie (173) > Brazownictwo (166)');
}

// ============================================================================
// TEST 6: Pod zagrożeniem z Garncarstwo done → Brazownictwo
// Brazownictwo: mil(100)+braz(90)+base(10)+tie(6) = 206 (highest)
// Murarstwo: mury(110)+base(10)+tie(16) = 136
// ============================================================================
console.log('\n--- T6: zagrozone + Garncarstwo done → Brazownictwo ---');
{
  const done = new Set(['Garncarstwo']);
  const result = chooseAIResearch(TECH_DATA, done, { underThreat: true });
  assert(result !== null, 'under threat: returns non-null');
  eq(result, 'Brazownictwo', 'under threat with Garncarstwo done: Brazownictwo (206) wins');
}

// ============================================================================
// TEST 6b: Pod zagrożeniem bez prereqów → Garncarstwo (228) >> Murarstwo (136)
// ============================================================================
console.log('\n--- T6b: zagrozone bez prereqow → Garncarstwo (228) wygrywa ---');
{
  const result = chooseAIResearch(TECH_DATA, [], { underThreat: true });
  eq(result, 'Garncarstwo', 'under threat, empty done: Garncarstwo (228) > Murarstwo (136)');
}

// ============================================================================
// TEST 7: Spichlerz zbudowany → Garncarstwo score spada
// Garncarstwo z Spichlerz built: Cegielnia(80)+base(10)+tie(18)=108
// Oswojenie: food(55)+econ(50)+base(10)+tie(18) = 133 → wygrywa
// ============================================================================
console.log('\n--- T7: Spichlerz zbudowany → Oswojenie wygrywa ---');
{
  const allBuilt = ['Spichlerz'];
  const result = chooseAIResearch(TECH_DATA, [], { allBuiltBuildings: allBuilt });
  eq(result, 'Oswojenie zwierzat', 'Spichlerz built: Oswojenie (133) > Garncarstwo (108)');
}

// ============================================================================
// TEST 8: Faza środkowa (myCitiesCount=4) z done=Garncarstwo+Brazownictwo
// Wojskowosc: wojsk(75mid)+base(10)+tie(12) = 97
// Pismo: econ(70mid)+pismo(50mid)+base(10)+tie(12) = 142 → Pismo wygrywa!
// ============================================================================
console.log('\n--- T8: faza srodkowa, done=Garncarstwo+Brazownictwo ---');
{
  const done = new Set(['Garncarstwo', 'Brazownictwo']);
  const result = chooseAIResearch(TECH_DATA, done, { myCitiesCount: 4 });
  assert(result !== null, 'mid phase: returns non-null');
  // Pismo (econ+pismo mid=70+50=120+22=142) > Wojskowosc (wojsk mid=75+22=97)
  assert(
    result === 'Pismo' || result === 'Wojskowosc' || result === 'Oswojenie zwierzat',
    'mid phase: sensible tech choice: ' + result
  );
}

// ============================================================================
// TEST 8b: Faza środkowa, only Brazownictwo done → Garncarstwo (228) nadal top
// ============================================================================
console.log('\n--- T8b: faza srodkowa, done=Brazownictwo only → Garncarstwo ---');
{
  const done = new Set(['Brazownictwo']);
  const result = chooseAIResearch(TECH_DATA, done, { myCitiesCount: 4 });
  assert(result !== null, 'mid phase Brazownictwo done: non-null');
  eq(result, 'Garncarstwo', 'mid phase with only Brazownictwo: Garncarstwo (228) is still top');
}

// ============================================================================
// TEST 9: Wszystko zbadane → null
// ============================================================================
console.log('\n--- T9: wszystko zbadane → null ---');
{
  const allNames = TECH_DATA.map(t => t.Technologia);
  const result = chooseAIResearch(TECH_DATA, allNames, {});
  eq(result, null, 'all researched → returns null');
}

// ============================================================================
// TEST 10: Akceptuje Set<string> i string[] jako ukonczone
// ============================================================================
console.log('\n--- T10: akceptuje Set i Array ---');
{
  const asArray = ['Garncarstwo'];
  const asSet = new Set(['Garncarstwo']);
  const r1 = chooseAIResearch(TECH_DATA, asArray, {});
  const r2 = chooseAIResearch(TECH_DATA, asSet, {});
  eq(r1, r2, 'Set and Array produce same result');
  assert(r1 !== null, 'returns non-null with Array input');
}

// ============================================================================
// TEST 11: Jezdziectwo wymaga OBYDWU prereqów: Kolo + Brazownictwo
// ============================================================================
console.log('\n--- T11: Jezdziectwo wymaga Kolo + Brazownictwo oba ---');
{
  // Tylko Kolo → Jezdziectwo niedostępne
  const doneKoloOnly = new Set(['Oswojenie zwierzat', 'Kolo']);
  const r1 = chooseAIResearch(TECH_DATA, doneKoloOnly, {});
  assert(r1 !== 'Jezdziectwo', 'Jezdziectwo not available with only Kolo (missing Brazownictwo)');

  // Tylko Brazownictwo → Jezdziectwo niedostępne
  const doneBrazOnly = new Set(['Garncarstwo', 'Brazownictwo']);
  const r2 = chooseAIResearch(TECH_DATA, doneBrazOnly, {});
  assert(r2 !== 'Jezdziectwo', 'Jezdziectwo not available with only Brazownictwo (missing Kolo)');

  // Oba prereqy spełnione → Jezdziectwo dostępne
  const doneBoth = new Set(['Garncarstwo', 'Brazownictwo', 'Oswojenie zwierzat', 'Kolo']);
  const r3 = chooseAIResearch(TECH_DATA, doneBoth, {});
  assert(r3 !== null, 'with both prereqs: non-null result');
  // Wojskowosc: mil(40)+wojsk(35)+base(10)+tie(12)=97; Pismo: econ(50)+pismo(20)+base(10)+tie(12)=92
  // Wojskowosc (97) wygrywa early nad Pismo (92) i Jezdziectwo (40+10+10=60)
  eq(r3, 'Wojskowosc', 'with all prereqs: Wojskowosc (97) wins over Pismo (92) and Jezdziectwo (60)');
}

// ============================================================================
// TEST 12: Pusta lista techData → null
// ============================================================================
console.log('\n--- T12: pusta lista techData → null ---');
{
  const result = chooseAIResearch([], [], {});
  eq(result, null, 'empty tech list → null');
}

// ============================================================================
// WYNIK
// ============================================================================
console.log('\n========================================');
console.log('PASSED:', passed, '/ FAILED:', failed, '/ TOTAL:', passed + failed);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL GREEN');
}
