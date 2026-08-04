'use strict';
/**
 * ai-mp-military-cap-test.cjs — cap wojska MP wg _menuDifficulty
 * Run from gra/: node tools/ai-mp-military-cap-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-mp-military-cap-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-mp-military-cap-bundle.cjs');

const ENTRY_TS = `
export { chooseCityProduction, loadDifficultyParams, countOwnerMilitaryUnits } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { cityStateMilitaryProductionCap } from ${JSON.stringify(AI_SRC + '/game/city-state-difficulty')};
export { aiCsAbsorptionParams, rollAiCsAccept } from ${JSON.stringify(AI_SRC + '/game/ai-cs-absorption')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

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

const {
  chooseCityProduction,
  loadDifficultyParams,
  countOwnerMilitaryUnits,
  cityStateMilitaryProductionCap,
  aiCsAbsorptionParams,
  rollAiCsAccept,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        q, r, terenBazowy: 'Równina', nakladka: 0,
        rzeka: { obecna: false }, droga: { obecna: false },
      };
    }
  }
  return { width: w, height: h, hexes };
}

function makeCity(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: id, population: 3 };
}

function makeUnit(id, ownerId, q, r, typeId) {
  return {
    id, ownerId, q, r, typeId,
    category: typeId === 'Zwiadowca' ? 'zwiadowca' : 'miecznik',
    hp: 10, ruchLeft: 2, ruchMax: 2,
  };
}

function makeGameData() {
  return {
    buildings: [
      { id: 'mury', nazwa: 'Mury' },
      { id: 'spichlerz', nazwa: 'Spichlerz' },
      { id: 'studnia', nazwa: 'Studnia' },
      { id: 'koszary', nazwa: 'Koszary' },
    ],
    units: [],
    terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
    aiParams: {},
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map = makeMap(10, 10);
const data = makeGameData();
const diff = loadDifficultyParams(data, 2);

console.log('--- T1: cityStateMilitaryProductionCap ---');
eq(cityStateMilitaryProductionCap('easy'), null, 'T1a: easy = no cap');
eq(cityStateMilitaryProductionCap('normal'), 1, 'T1b: normal = 1');
eq(cityStateMilitaryProductionCap('hard'), 0, 'T1c: hard = 0');

console.log('\n--- T2: hard MP bez garnizonu → nie Wojownik ---');
{
  const city = makeCity('cs_h', 4, 3, 3);
  const pick = chooseCityProduction(
    'cs_h', [city], [], 4, data, ZERO,
    { defensiveCopy: true, menuDifficulty: 'hard', cityBuildings: { cs_h: [] } },
    map, diff,
  );
  assert(pick !== 'Wojownik' && pick !== 'Łucznik', `T2a: hard no military pick (got ${pick})`);
}

console.log('\n--- T3: hard MP z garnizonem → nie dokup wojska ---');
{
  const city = makeCity('cs_h2', 4, 3, 3);
  const guard = makeUnit('g1', 4, 3, 3, 'Wojownik');
  const pick = chooseCityProduction(
    'cs_h2', [city], [guard], 4, data, ZERO,
    { defensiveCopy: true, menuDifficulty: 'hard', cityBuildings: { cs_h2: ['mury'] } },
    map, diff,
  );
  assert(pick !== 'Wojownik' && pick !== 'Łucznik', `T3a: hard with guard no more military (got ${pick})`);
  eq(countOwnerMilitaryUnits([guard], 4), 1, 'T3b: guard counts as military');
}

console.log('\n--- T4: normal MP max 1 wojskowa ---');
{
  const city = makeCity('cs_n', 4, 3, 3);
  const guard = makeUnit('g2', 4, 3, 3, 'Wojownik');
  const pick = chooseCityProduction(
    'cs_n', [city], [guard], 4, data, ZERO,
    { defensiveCopy: true, menuDifficulty: 'normal', cityBuildings: { cs_n: [] } },
    map, diff,
  );
  assert(pick !== 'Wojownik' && pick !== 'Łucznik', `T4a: normal at cap no military (got ${pick})`);
}

console.log('\n--- T5: normal MP bez wojska → może Wojownik ---');
{
  const city = makeCity('cs_n2', 4, 3, 3);
  const pick = chooseCityProduction(
    'cs_n2', [city], [], 4, data, ZERO,
    { defensiveCopy: true, menuDifficulty: 'normal', cityBuildings: { cs_n2: [] } },
    map, diff,
  );
  eq(pick, 'Wojownik', 'T5a: normal 0 military → Wojownik');
}

console.log('\n--- T6: easy vs hard pod zagrożeniem (easy może wojsko, hard nie) ---');
{
  const city = makeCity('cs_e', 4, 5, 5);
  const enemy = makeUnit('en', 0, 6, 5, 'Wojownik');
  const u1 = makeUnit('e1', 4, 5, 5, 'Wojownik');
  const u2 = makeUnit('e2', 4, 4, 5, 'Łucznik');
  const built = ['mury', 'koszary', 'spichlerz', 'studnia', 'garncarnia', 'stolarnia', 'targowisko'];
  const units = [enemy, u1, u2];
  const pickEasy = chooseCityProduction(
    'cs_e', [city], units, 4, data, ZERO,
    { defensiveCopy: true, menuDifficulty: 'easy', cityBuildings: { cs_e: built } },
    map, diff,
  );
  const pickHard = chooseCityProduction(
    'cs_e', [city], units, 4, data, ZERO,
    { defensiveCopy: true, menuDifficulty: 'hard', cityBuildings: { cs_e: built } },
    map, diff,
  );
  const easyMil = pickEasy === 'Wojownik' || pickEasy === 'Łucznik';
  assert(easyMil, `T6a: easy under threat may queue military (got ${pickEasy})`);
  assert(pickHard !== 'Wojownik' && pickHard !== 'Łucznik',
    `T6b: hard under threat still no military (got ${pickHard})`);
}

console.log('\n--- T7: absorption params easy/normal/hard ---');
const easyP = aiCsAbsorptionParams('easy');
const normalP = aiCsAbsorptionParams('normal');
const hardP = aiCsAbsorptionParams('hard');
assert(hardP.trybutAccept >= 0.99, `T7a: hard trybutAccept≥0.99 (${hardP.trybutAccept})`);
assert(hardP.wasalAccept >= 0.99, `T7b: hard wasalAccept≥0.99 (${hardP.wasalAccept})`);
assert(normalP.trybutAccept > easyP.trybutAccept && normalP.trybutAccept < hardP.trybutAccept,
  'T7c: normal trybut between easy and hard');
assert(normalP.minTurn > hardP.minTurn && normalP.minTurn < easyP.minTurn,
  'T7d: normal minTurn between hard and easy');
assert(rollAiCsAccept('trybut', hardP, () => 0.98), 'T7e: hard accept at rng 0.98');
assert(!rollAiCsAccept('trybut', easyP, () => 0.99), 'T7f: easy reject at rng 0.99');

console.log(`\n=== ai-mp-military-cap-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
