'use strict';
/**
 * ai-production-priority-test.cjs — P-AI-007=A (Panel D priorytety produkcji).
 * Run from gra/: node tools/ai-production-priority-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-production-priority-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-production-priority-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-production-priority-bundle.cjs');

const ENTRY_TS = `
export { chooseCityProduction, loadDifficultyParams } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { aiPanelPriorityDelta, aiProductionScoreBoosts } from ${JSON.stringify(AI_SRC + '/game/ai-production-priorities')};
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
  console.error('[ai-production-priority-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  chooseCityProduction,
  loadDifficultyParams,
  aiPanelPriorityDelta,
  aiProductionScoreBoosts,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

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
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

function makeGameData() {
  return {
    units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }, { Jednostka: 'Łucznik', Health: 20, Ruch: 2 }],
    buildings: [
      { id: 'spichlerz', nazwa: 'Spichlerz' },
      { id: 'koszary', nazwa: 'Koszary' },
      { id: 'mury', nazwa: 'Mury' },
      { id: 'stolarnia', nazwa: 'Stolarnia' },
      { id: 'cegielnia', nazwa: 'Cegielnia' },
      { id: 'odlewnia_brazu', nazwa: 'Odlewnia' },
      { id: 'magazyn', nazwa: 'Magazyn' },
      { id: 'targowisko', nazwa: 'Targowisko' },
      { id: 'biblioteka', nazwa: 'Biblioteka' },
      { id: 'akademia', nazwa: 'Akademia' },
    ],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
    aiParams: {
      ekspansja_zagroz_zasieg: { wartosc: 5, sekcja: 't', opis: '' },
      trudnosc_poziom2_bonus_produkcja: { wartosc: 0, sekcja: 't', opis: '' },
    },
  };
}

const ZERO_MODS = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map = makeMap(10, 10);
const data = makeGameData();
const diff = loadDifficultyParams(data, 2);

const midCities = [
  { id: 'c1', ownerId: 1, q: 2, r: 2, population: 5, name: 'A' },
  { id: 'c2', ownerId: 1, q: 5, r: 2, population: 5, name: 'B' },
  { id: 'c3', ownerId: 1, q: 8, r: 2, population: 5, name: 'C' },
];
const units = [{ id: 'u1', ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q: 3, r: 2, ruch: 2, ruchLeft: 2 }];

console.log('\n--- P7a: aiPanelPriorityDelta ---');
{
  eq(aiPanelPriorityDelta(5), 0, 'neutral 5 -> 0');
  eq(aiPanelPriorityDelta(8), 45, '8 -> +45');
  eq(aiPanelPriorityDelta(2), -45, '2 -> -45');
}

console.log('\n--- P7b: wysoki priorytetNauka -> Biblioteka (mid-game) ---');
{
  const id = chooseCityProduction(
    'c1', midCities, units, 1, data, ZERO_MODS,
    {
      cityBuildings: {
        c1: ['koszary', 'mury', 'spichlerz', 'stolarnia'],
        c2: ['koszary', 'mury', 'spichlerz', 'stolarnia'],
        c3: ['koszary', 'mury', 'spichlerz', 'stolarnia'],
      },
      currentTurn: 100,
      civAiProfile: {
        ekspansywnosc: 0,
        sklonnoscDoPodboju: 0,
        priorytetMilitarny: 5,
        priorytetEkonomia: 5,
        priorytetNauka: 8,
      },
    },
    map,
    diff,
  );
  eq(id, 'biblioteka', 'priorytetNauka 8 wybiera Bibliotekę');
}

console.log('\n--- P7c: wysoki priorytetMilitarny -> Koszary (mid, bez koszar) ---');
{
  const id = chooseCityProduction(
    'c1', midCities, units, 1, data, ZERO_MODS,
    {
      cityBuildings: { c1: [] },
      civAiProfile: {
        ekspansywnosc: 0,
        sklonnoscDoPodboju: 0,
        priorytetMilitarny: 8,
        priorytetEkonomia: 2,
        priorytetNauka: 5,
      },
    },
    map,
    diff,
  );
  eq(id, 'koszary', 'priorytetMilitarny 8 wybiera Koszary');
}

console.log('\n--- P7d: Biblioteka zbudowana + wysoka nauka -> Akademia ---');
{
  const id = chooseCityProduction(
    'c1', midCities, units, 1, data, ZERO_MODS,
    {
      cityBuildings: {
        c1: ['koszary', 'biblioteka', 'mury', 'spichlerz'],
        c2: ['koszary', 'mury', 'spichlerz', 'stolarnia'],
        c3: ['koszary', 'mury', 'spichlerz', 'stolarnia'],
      },
      currentTurn: 100,
      civAiProfile: {
        ekspansywnosc: 0,
        sklonnoscDoPodboju: 0,
        priorytetMilitarny: 5,
        priorytetEkonomia: 5,
        priorytetNauka: 8,
      },
    },
    map,
    diff,
  );
  eq(id, 'akademia', 'po Bibliotece wybiera Akademię');
}

console.log('\n--- P7e: archetyp + Panel D sumują się ---');
{
  const boosts = aiProductionScoreBoosts({ priorytetMilitarny: 6, priorytetEkonomia: 4, priorytetNauka: 5 });
  eq(boosts.military, 15, 'mil 6 -> +15');
  eq(boosts.economy, -15, 'eko 4 -> -15');
  eq(boosts.science, 0, 'nauka 5 -> 0');
}

console.log('\n========================================');
console.log(`ai-production-priority-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
