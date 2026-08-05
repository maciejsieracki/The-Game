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
} from ${JSON.stringify(SRC + '/game/ai')};
export {
  qualifiesForMajorAiDifficultyBonus,
  difficultyCombatMultiplier,
  difficultyScienceBonusPerTurn,
  planMajorAiDifficultyStartBonuses,
  pickBonusCityHex,
  applyDifficultyCombatToUnitDef,
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
  qualifiesForMajorAiDifficultyBonus,
  difficultyCombatMultiplier,
  difficultyScienceBonusPerTurn,
  planMajorAiDifficultyStartBonuses,
  pickBonusCityHex,
  applyDifficultyCombatToUnitDef,
  isBarbarian,
  BARBARIAN_OWNER_ID,
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

console.log('\n--- T-DB-b: mnozniki walki i nauki ---');
{
  eq(difficultyCombatMultiplier(0.05), 1.05, 'bonusWalka 5%');
  eq(difficultyCombatMultiplier(0), 1, 'bonusWalka 0');
  eq(difficultyScienceBonusPerTurn(1), 1, 'bonusNauka +1');
  eq(difficultyScienceBonusPerTurn(-2), 0, 'bonusNauka ujemny -> 0');
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

console.log('\n========================================');
console.log(`ai-difficulty-bonus-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
