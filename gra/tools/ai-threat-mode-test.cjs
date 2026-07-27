'use strict';
/**
 * ai-threat-mode-test.cjs — P-AI-008=C (zagrożenie AI: 7 hex + wyjątek Mocy).
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
export { chooseCityProduction, loadDifficultyParams } from ${JSON.stringify(AI_SRC + '/game/ai')};
export {
  AI_THREAT_RANGE_DEFAULT,
  aiThreatPrioritizeWalls,
  aiThreatWallProductionScore,
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
  AI_THREAT_RANGE_DEFAULT,
  aiThreatPrioritizeWalls,
  aiThreatWallProductionScore,
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

console.log('\n--- T8b: aiThreatPrioritizeWalls ---');
{
  eq(aiThreatPrioritizeWalls(1), true, 'rank 1 -> mury pierwsze');
  eq(aiThreatPrioritizeWalls(2), false, 'rank 2 -> bez murów pierwszych');
  eq(aiThreatWallProductionScore(100, 2), null, 'rank 2 -> null score mury');
  eq(aiThreatWallProductionScore(100, 1), 400, 'rank 1 -> 300+100');
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

console.log('\n--- T8d: lider Mocy + wrog blisko -> Mury ---');
{
  const data = makeData(7);
  const enemy = { id: 'e2', ownerId: 2, typeId: 'Wojownik', category: 'miecznik', q: 6, r: 5, ruch: 2, ruchLeft: 2 };
  const id = chooseCityProduction('c1', midCities, [enemy], 1, data, ZERO, {
    cityBuildings: { c1: [] },
    powerRank: 1,
  }, map, loadDifficultyParams(data, 2));
  eq(id, 'mury', 'rank 1 + zagrozenie -> Mury');
}

console.log('\n--- T8e: nie #1 Mocy + zagrozenie -> bez Murów (rozwoj dozwolony) ---');
{
  const data = makeData(7);
  const enemy = { id: 'e3', ownerId: 2, typeId: 'Wojownik', category: 'miecznik', q: 6, r: 5, ruch: 2, ruchLeft: 2 };
  const id = chooseCityProduction('c1', midCities, [enemy], 1, data, ZERO, {
    cityBuildings: { c1: [] },
    powerRank: 3,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0, priorytetMilitarny: 5, priorytetEkonomia: 5, priorytetNauka: 5 },
  }, map, loadDifficultyParams(data, 2));
  assert(id !== 'mury', 'rank 3 + zagrozenie -> nie Mury (P-AI-008=C)');
}

console.log('\n========================================');
console.log(`ai-threat-mode-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
