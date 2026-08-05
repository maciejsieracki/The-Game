'use strict';
/**
 * ai-colonization-pop-test.cjs — AI-BALANS-STEP1: próg pop źródła kolonii major AI per trudność.
 * Run from gra/: node tools/ai-colonization-pop-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-colonization-pop-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-colonization-pop-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-colonization-pop-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  hasColonizationSource,
  colonizationSourceMinPop,
  AI_COLONIZATION_SOURCE_MIN_POP,
  AI_COLONIZATION_SOURCE_MIN_POP_L3,
  planCityFounding,
  isLocalExpansionPhase,
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
  console.error('[ai-colonization-pop-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  hasColonizationSource,
  colonizationSourceMinPop,
  AI_COLONIZATION_SOURCE_MIN_POP,
  AI_COLONIZATION_SOURCE_MIN_POP_L3,
  planCityFounding,
  isLocalExpansionPhase,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const citiesPop4 = [{ id: 'c1', ownerId: 1, q: 2, r: 2, population: 4 }];
const citiesPop3 = [{ id: 'c1', ownerId: 1, q: 2, r: 2, population: 3 }];
const citiesPop5 = [{ id: 'c1', ownerId: 1, q: 2, r: 2, population: 5 }];

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
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeGameData(aiParamsOverride = {}) {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
      { Jednostka: 'Zwiadowca', Health: 20, Ruch: 3 },
    ],
    buildings: [],
    terrainYields: {
      terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }],
    },
    aiParams: aiParamsOverride,
  };
}

console.log('--- T1: colonizationSourceMinPop per poziom ---');
eq(colonizationSourceMinPop(1), AI_COLONIZATION_SOURCE_MIN_POP, 'T1a: L1 -> 5');
eq(colonizationSourceMinPop(2), AI_COLONIZATION_SOURCE_MIN_POP, 'T1b: L2 -> 5');
eq(colonizationSourceMinPop(3), AI_COLONIZATION_SOURCE_MIN_POP_L3, 'T1c: L3 -> 4');
eq(AI_COLONIZATION_SOURCE_MIN_POP, 5, 'T1d: stała L1/L2 = 5');
eq(AI_COLONIZATION_SOURCE_MIN_POP_L3, 4, 'T1e: stała L3 = 4');

console.log('\n--- T2: hasColonizationSource — progi pop ---');
eq(hasColonizationSource(citiesPop4, 3), true, 'T2a: L3 + pop 4 -> gotowe');
eq(hasColonizationSource(citiesPop4, 2), false, 'T2b: L2 + pop 4 -> brak');
eq(hasColonizationSource(citiesPop3, 3), false, 'T2c: L3 + pop 3 -> brak');
eq(hasColonizationSource(citiesPop5, 1), true, 'T2d: L1 + pop 5 -> OK');

console.log('\n--- T3: isLocalExpansionPhase — L3 pop 4 nie blokuje samym progiem ---');
{
  const map = makeMap(20, 20);
  const optsL3 = {
    poziomTrudnosci: 3,
    civEra: 2,
    currentTurn: 5,
    pracaAvailable: 30,
  };
  const blocked = isLocalExpansionPhase(optsL3, citiesPop4, map, [], 1, citiesPop4);
  assert(!blocked, 'T3a: L3 pop 4 — faza lokalna OFF (kolonizacja gotowa)');
  const optsL2 = { ...optsL3, poziomTrudnosci: 2 };
  const blockedL2 = isLocalExpansionPhase(optsL2, citiesPop4, map, [], 1, citiesPop4);
  assert(blockedL2, 'T3b: L2 pop 4 — faza lokalna ON (brak progu kolonizacji)');
}

console.log('\n--- T4: planCityFounding — L3 pop 4 founding bez skautów ---');
{
  const map = makeMap(20, 20);
  const data = makeGameData({
    ekspansja_min_dystans_miast: { wartosc: 4, sekcja: 'test', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
  });
  const cmd = planCityFounding(1, citiesPop4, map, data, {
    poziomTrudnosci: 3,
    pracaAvailable: 30,
    currentTurn: 5,
    civEra: 2,
  }, 4, []);
  assert(cmd !== null && cmd.type === 'foundCityAt', 'T4a: L3 pop 4 -> foundCityAt');
  const cmdL2 = planCityFounding(1, citiesPop4, map, data, {
    poziomTrudnosci: 2,
    pracaAvailable: 30,
    currentTurn: 5,
    civEra: 2,
  }, 4, []);
  assert(cmdL2 === null, 'T4b: L2 pop 4 bez skautów -> brak founding');
}

console.log(`\n=== ai-colonization-pop-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
