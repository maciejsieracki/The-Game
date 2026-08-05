'use strict';
/**
 * ai-balans-step2-test.cjs — AI-BALANS-STEP2 / R-AI-TRUDNOSC C.3 Ś2
 * L3 + pokój: kara −40 score Wojownika w chooseCityProduction major AI.
 * Run from gra/: node tools/ai-balans-step2-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-balans-step2-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-balans-step2-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-balans-step2-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  chooseCityProduction,
  loadDifficultyParams,
  applyL3PeaceWarriorPenalty,
  AI_L3_PEACE_WARRIOR_SCORE_PENALTY,
} from '../src/game/ai';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-balans-step2-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  chooseCityProduction,
  loadDifficultyParams,
  applyL3PeaceWarriorPenalty,
  AI_L3_PEACE_WARRIOR_SCORE_PENALTY,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

eq(AI_L3_PEACE_WARRIOR_SCORE_PENALTY, 40, 'T0: stała kara = 40');

console.log('\n--- T1: applyL3PeaceWarriorPenalty — bezpośrednio ---');
{
  const candidates = [{ id: 'Wojownik', score: 200 }, { id: 'stolarnia', score: 190 }];
  applyL3PeaceWarriorPenalty(candidates, { poziomTrudnosci: 3, defensiveCopy: false }, false);
  eq(candidates[0].score, 160, 'T1a: L3 + pokój → Wojownik −40');
  eq(candidates[1].score, 190, 'T1b: stolarnia bez zmian');

  const c2 = [{ id: 'Wojownik', score: 200 }];
  applyL3PeaceWarriorPenalty(c2, { poziomTrudnosci: 2, defensiveCopy: false }, false);
  eq(c2[0].score, 200, 'T1c: L2 + pokój → brak kary');

  const c3 = [{ id: 'Wojownik', score: 200 }];
  applyL3PeaceWarriorPenalty(c3, { poziomTrudnosci: 3, defensiveCopy: false }, true);
  eq(c3[0].score, 200, 'T1d: L3 + underThreat → brak kary');

  const c4 = [{ id: 'Wojownik', score: 200 }];
  applyL3PeaceWarriorPenalty(c4, { poziomTrudnosci: 3, defensiveCopy: true }, false);
  eq(c4[0].score, 200, 'T1e: MP defensiveCopy L3 → brak kary');
}

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

function makeData() {
  return {
    units: [{ Jednostka: 'Wojownik' }, { Jednostka: 'Łucznik' }],
    buildings: [
      { id: 'mury' }, { id: 'koszary' }, { id: 'spichlerz' },
      { id: 'stolarnia' }, { id: 'cegielnia' }, { id: 'magazyn' },
    ],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4 }] },
    aiParams: {
      ekspansja_zagroz_zasieg: { wartosc: 7 },
      trudnosc_poziom2_bonus_produkcja: { wartosc: 0 },
      trudnosc_poziom3_bonus_produkcja: { wartosc: 0 },
    },
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map = makeMap();
const data = makeData();
const midCities = [
  { id: 'c1', ownerId: 1, q: 5, r: 5, population: 6, name: 'A' },
  { id: 'c2', ownerId: 1, q: 8, r: 5, population: 6, name: 'B' },
  { id: 'c3', ownerId: 1, q: 2, r: 5, population: 6, name: 'C' },
];
const builtMid = ['koszary', 'spichlerz', 'cegielnia', 'magazyn'];
const cityBuildings = {
  c1: [...builtMid],
  c2: [...builtMid],
  c3: [...builtMid],
};
const baseOpts = {
  cityBuildings,
  currentTurn: 50,
  defensiveCopy: false,
  civAiProfile: {
    priorytetMilitarny: 5,
    priorytetEkonomia: 5,
    priorytetNauka: 5,
    ekspansywnosc: 0,
    sklonnoscDoPodboju: 0,
  },
};

console.log('\n--- T2: chooseCityProduction — L3 pokój vs L2 (major mid-game) ---');
{
  const pickL2 = chooseCityProduction(
    'c1', midCities, [], 1, data, ZERO,
    { ...baseOpts, poziomTrudnosci: 2 },
    map,
    loadDifficultyParams(data, 2),
  );
  const pickL3 = chooseCityProduction(
    'c1', midCities, [], 1, data, ZERO,
    { ...baseOpts, poziomTrudnosci: 3 },
    map,
    loadDifficultyParams(data, 3),
  );
  eq(pickL2, 'Wojownik', 'T2a: L2 pokój → Wojownik (270 > stolarnia 240)');
  eq(pickL3, 'Łucznik', 'T2b: L3 pokój → Łucznik (Wojownik 230 po −40 < Łucznik 265)');
}

console.log('\n--- T3: L3 + underThreat → kara nie stosuje się (wojsko wygrywa) ---');
{
  const enemy = {
    id: 'e1', ownerId: 2, typeId: 'Wojownik', q: 6, r: 5, ruch: 2, ruchLeft: 2,
  };
  const pick = chooseCityProduction(
    'c1', midCities, [enemy], 1, data, ZERO,
    { ...baseOpts, poziomTrudnosci: 3 },
    map,
    loadDifficultyParams(data, 3),
  );
  eq(pick, 'Wojownik', 'T3a: L3 underThreat → Wojownik (threat score, bez kary pokoju)');
}

console.log(`\n=== ai-balans-step2-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
