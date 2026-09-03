'use strict';
/**
 * ai-difficulty-bonus-test.cjs — P-AI-MOC-BONUS=A (martwe pola DifficultyParams).
 * Run from gra/: node tools/ai-difficulty-bonus-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[ai-difficulty-bonus-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.ai-difficulty-bonus-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-difficulty-bonus-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  loadDifficultyParams,
  chooseCityProduction,
  chooseAIResearch,
} from ${JSON.stringify(SRC + '/game/ai')};
export {
  qualifiesForMajorAiDifficultyBonus,
  difficultyCombatMultiplier,
  difficultyProductionMultiplier,
  difficultyScienceBonusPerTurn,
  planMajorAiDifficultyStartBonuses,
  pickBonusCityHex,
  applyDifficultyCombatToUnitDef,
  cityStateStartUnitCount,
  AI_DIFFICULTY_BONUS_UNIT_TYPE,
} from ${JSON.stringify(SRC + '/game/ai-difficulty-bonus')};
export { isBarbarian, BARBARIAN_OWNER_ID } from ${JSON.stringify(SRC + '/game/barbarians')};
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
  console.error('[ai-difficulty-bonus-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  loadDifficultyParams,
  chooseAIResearch,
  qualifiesForMajorAiDifficultyBonus,
  difficultyCombatMultiplier,
  difficultyProductionMultiplier,
  difficultyScienceBonusPerTurn,
  planMajorAiDifficultyStartBonuses,
  pickBonusCityHex,
  applyDifficultyCombatToUnitDef,
  isBarbarian,
  BARBARIAN_OWNER_ID,
  cityStateStartUnitCount,
  AI_DIFFICULTY_BONUS_UNIT_TYPE,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

console.log('\n--- T-DB-a: qualifiesForMajorAiDifficultyBonus ---');
{
  eq(qualifiesForMajorAiDifficultyBonus(2, false), true, 'owner 2 major');
  eq(qualifiesForMajorAiDifficultyBonus(0, false), false, 'gracz wykluczony');
  eq(qualifiesForMajorAiDifficultyBonus(3, true), false, 'miasto-panstwo wykluczone');
  eq(qualifiesForMajorAiDifficultyBonus(BARBARIAN_OWNER_ID, false), false, 'barbarzynca wykluczony');
  eq(isBarbarian(BARBARIAN_OWNER_ID), true, 'BARBARIAN_OWNER_ID jest barbarzynca');
}

console.log('\n--- T-DB-b: mnozniki walki, nauki i produkcji ---');
{
  eq(difficultyCombatMultiplier(0.05), 1.05, 'bonusWalka 5%');
  eq(difficultyCombatMultiplier(0), 1, 'bonusWalka 0');
  eq(difficultyScienceBonusPerTurn(1), 1, 'bonusNauka +1');
  eq(difficultyScienceBonusPerTurn(-2), 0, 'bonusNauka ujemny -> 0');
  eq(difficultyProductionMultiplier(0), 1, 'bonusProdukcja L1 -> x1.0');
  eq(difficultyProductionMultiplier(0.1), 1.1, 'bonusProdukcja L2 -> x1.1');
  eq(difficultyProductionMultiplier(0.25), 1.25, 'bonusProdukcja L3 -> x1.25');
}

console.log('\n--- T-DB-c: applyDifficultyCombatToUnitDef ---');
{
  const scaled = applyDifficultyCombatToUnitDef({ meleeAttack: 10, meleeDefence: 8, armor: 5 }, 1.1);
  eq(scaled.meleeAttack, 11, 'atak *1.1');
  eq(scaled.meleeDefence, 8.8, 'obrona *1.1');
  eq(scaled.armor, 5, 'pancerz bez zmian');
}

function makeMap() {
  const hexes = {};
  for (let q = 0; q < 8; q++) {
    for (let r = 0; r < 8; r++) {
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
  return { szerokoscQ: 8, wysokoscR: 8, hexes, seed: 1, riverPaths: [] };
}

console.log('\n--- T-DB-d: plan startoweJednostki + startoweMiasta ---');
{
  const data = {
    aiParams: {
      trudnosc_poziom3_startowe_jednostki: { wartosc: 0, sekcja: 't', opis: '' },
      trudnosc_poziom3_startowe_miasta: { wartosc: 1, sekcja: 't', opis: '' },
      trudnosc_poziom3_bonus_walka: { wartosc: 0.05, sekcja: 't', opis: '' },
      trudnosc_poziom3_bonus_nauka: { wartosc: 0, sekcja: 't', opis: '' },
      trudnosc_poziom3_bonus_produkcja: { wartosc: 0.25, sekcja: 't', opis: '' },
    },
  };
  const params = loadDifficultyParams(data, 3);
  const map = makeMap();
  const cities = [{ id: 'c0', ownerId: 2, q: 4, r: 4, population: 3, name: 'Cap' }];
  const plan = planMajorAiDifficultyStartBonuses(4, 4, params, map, cities, true);
  eq(plan.units.length, 0, 'poziom3 startoweJednostki=0');
  eq(plan.cities.length, 1, 'poziom3 startoweMiasta=1 -> 1 hex');
  const hex = pickBonusCityHex(map, cities, 4, 4);
  assert(hex !== null, 'sasiad stolicy nadaje sie na miasto');
}

console.log('\n--- T-DB-e: BLOK miasta -> jednostki ---');
{
  const data = { aiParams: {} };
  const params = loadDifficultyParams(data, 3);
  const map = makeMap();
  // Sąsiedzi stolicy = morze/góry — brak legalnego heksu (clusterStartSlot omija dystans, nie teren).
  for (const n of [[5, 4], [3, 4], [4, 5], [4, 3], [5, 3], [3, 5]]) {
    const k = `${n[0]},${n[1]}`;
    if (map.hexes[k]) map.hexes[k].terenBazowy = 'morze';
  }
  const cities = [{ id: 'c0', ownerId: 2, q: 4, r: 4, population: 3, name: 'Cap' }];
  const plan = planMajorAiDifficultyStartBonuses(4, 4, params, map, cities, true);
  eq(plan.extraCitiesBlocked, true, 'BLOK miasta');
  eq(plan.units.length, 1, '1 jednostka zamiast miasta');
  eq(plan.cities.length, 0, 'brak miast bonusowych');
}

console.log('\n--- T-DB-f: loadDifficultyParams L3 bonusNauka=2 (P0-3) ---');
{
  const dataPath = path.resolve(GRA_ROOT, 'data', 'ai-params.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const data = { aiParams: raw };
  const p3 = loadDifficultyParams(data, 3);
  eq(p3.bonusNauka, 2, 'poziom3 bonusNauka z ai-params.json = 2');
  const empty = loadDifficultyParams({ aiParams: {} }, 3);
  eq(empty.bonusNauka, 2, 'poziom3 bonusNauka fallback = 2');
}

const SPRYT_FALLBACKS = {
  1: { agresjaMnoznik: 0.85, dyplomacjaAktywnosc: 0.8, celObranie: 0.0 },
  2: { agresjaMnoznik: 1.0, dyplomacjaAktywnosc: 1.0, celObranie: 0.5 },
  3: { agresjaMnoznik: 1.2, dyplomacjaAktywnosc: 1.25, celObranie: 1.0 },
};

console.log('\n--- T-DB-h: loadDifficultyParams Spryt AI (P1-3) ---');
{
  const dataPath = path.resolve(GRA_ROOT, 'data', 'ai-params.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const data = { aiParams: raw };

  for (const level of [1, 2, 3]) {
    const keys = [
      `trudnosc_poziom${level}_agresja_mnoznik`,
      `trudnosc_poziom${level}_dyplomacja_aktywnosc`,
      `trudnosc_poziom${level}_cel_obranie`,
    ];
    for (const k of keys) {
      assert(raw[k] != null, `ai-params.json ma klucz ${k}`);
    }
    const fb = SPRYT_FALLBACKS[level];
    eq(raw[`trudnosc_poziom${level}_agresja_mnoznik`].wartosc, fb.agresjaMnoznik, `JSON L${level} agresja wartosc`);
    eq(raw[`trudnosc_poziom${level}_dyplomacja_aktywnosc`].wartosc, fb.dyplomacjaAktywnosc, `JSON L${level} dyplomacja wartosc`);
    eq(raw[`trudnosc_poziom${level}_cel_obranie`].wartosc, fb.celObranie, `JSON L${level} cel wartosc`);

    const p = loadDifficultyParams(data, level);
    eq(p.agresjaMnoznik, fb.agresjaMnoznik, `poziom${level} agresjaMnoznik z JSON`);
    eq(p.dyplomacjaAktywnosc, fb.dyplomacjaAktywnosc, `poziom${level} dyplomacjaAktywnosc z JSON`);
    eq(p.celObranie, fb.celObranie, `poziom${level} celObranie z JSON`);
  }

  const custom = {
    aiParams: {
      trudnosc_poziom2_agresja_mnoznik: { wartosc: 0.9, sekcja: 't', opis: '' },
      trudnosc_poziom2_dyplomacja_aktywnosc: { wartosc: 1.1, sekcja: 't', opis: '' },
      trudnosc_poziom2_cel_obranie: { wartosc: 0.7, sekcja: 't', opis: '' },
    },
  };
  const p2custom = loadDifficultyParams(custom, 2);
  eq(p2custom.agresjaMnoznik, 0.9, 'fixture agresja override');
  eq(p2custom.dyplomacjaAktywnosc, 1.1, 'fixture dyplomacja override');
  eq(p2custom.celObranie, 0.7, 'fixture cel override');

  for (const level of [1, 2, 3]) {
    const p = loadDifficultyParams({ aiParams: {} }, level);
    const fb = SPRYT_FALLBACKS[level];
    eq(p.agresjaMnoznik, fb.agresjaMnoznik, `poziom${level} agresja fallback`);
    eq(p.dyplomacjaAktywnosc, fb.dyplomacjaAktywnosc, `poziom${level} dyplomacja fallback`);
    eq(p.celObranie, fb.celObranie, `poziom${level} cel fallback`);
  }
}

const RESEARCH_FIXTURE = [
  { Technologia: 'Garncarstwo', Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Spichlerz, Cegielnia, Garncarz', 'Koszt nauki': 12 },
  { Technologia: 'Oswojenie zwierzat', Epoka: 'Kamien', Poziom: 1, 'Wymaga (prereq)': '—', 'Odblokowuje budynek': 'Tartak', 'Koszt nauki': 10 },
];

console.log('\n--- T-DB-g: chooseAIResearch lowercase spichlerz id (P0-2) ---');
{
  const pickBoth = chooseAIResearch(RESEARCH_FIXTURE, [], { allBuiltBuildings: ['spichlerz', 'cegielnia'] });
  eq(pickBoth, 'Oswojenie zwierzat', 'spichlerz+cegielnia (lowercase ids): brak +120/+80 -> Oswojenie');
  const pickLowerOnly = chooseAIResearch(RESEARCH_FIXTURE, [], { allBuiltBuildings: ['spichlerz'] });
  const pickUpperOnly = chooseAIResearch(RESEARCH_FIXTURE, [], { allBuiltBuildings: ['Spichlerz'] });
  eq(pickLowerOnly, pickUpperOnly, 'spichlerz lowercase == Spichlerz uppercase (dual-check)');
}

console.log('\n--- T-DB-i: cityStateStartUnitCount (R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1) ---');
{
  eq(cityStateStartUnitCount('easy'), 0, 'easy -> 0 jednostek (zero regresji domyslnej)');
  eq(cityStateStartUnitCount('normal'), 1, 'normal -> 1 jednostka');
  eq(cityStateStartUnitCount('hard'), 2, 'hard -> 2 jednostki');
  eq(AI_DIFFICULTY_BONUS_UNIT_TYPE, 'Wojownik', 'typ jednostki startowej = ten sam wzorzec co major AI (Wojownik)');
}

console.log('\n========================================');
console.log(`ai-difficulty-bonus-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
