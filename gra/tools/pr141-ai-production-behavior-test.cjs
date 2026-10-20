'use strict';

/**
 * PR141 AI production behavior evidence: one matrix-profile field at a time
 * must change the building selected by the real chooseCityProduction consumer.
 * Run from gra/: node tools/pr141-ai-production-behavior-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const sourceRoot = path.resolve(__dirname, '..', 'src');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-ai-production-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');
fs.writeFileSync(entry, `
  export { chooseCityProduction, loadDifficultyParams } from ${JSON.stringify(sourceRoot + '/game/ai')};
  export { aiDiplomacyStance } from ${JSON.stringify(sourceRoot + '/game/diplomacy')};
  export { civAiProfileFor, resolveArchetypeAggression } from ${JSON.stringify(sourceRoot + '/game/civ-ai-data')};
  export { civMatrixParamAtDifficulty } from ${JSON.stringify(sourceRoot + '/game/civ-matrix')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent',
});
const {
  chooseCityProduction, loadDifficultyParams, aiDiplomacyStance,
  civAiProfileFor, civMatrixParamAtDifficulty, resolveArchetypeAggression,
} = require(bundle);

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else { failed++; console.error(`FAIL: ${message}`); }
}
function equal(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

// Fixed game state, turn and map seed. The three candidates are real building
// candidates consumed by chooseCityProduction and differ only by production group.
const state = {
  data: {
    units: [{ Jednostka: 'Wojownik' }, { Jednostka: 'Łucznik' }],
    buildings: [
      { id: 'military-choice', grupa: 'Wojsko i obrona', kosztBudowy: 0 },
      { id: 'economy-choice', grupa: 'Handel i pieniądz', kosztBudowy: 0 },
      { id: 'science-choice', grupa: 'Nauka i kultura', kosztBudowy: 0 },
    ],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4 }] },
    aiParams: {},
  },
  map: { szerokoscQ: 4, wysokoscR: 4, hexes: {}, seed: 141, riverPaths: [] },
  cities: [
    { id: 'pr141-a', ownerId: 1, q: 1, r: 1, population: 3, name: 'A' },
    { id: 'pr141-b', ownerId: 1, q: 3, r: 1, population: 3, name: 'B' },
    { id: 'pr141-c', ownerId: 1, q: 1, r: 3, population: 3, name: 'C' },
    { id: 'pr141-r', ownerId: 2, q: 3, r: 3, population: 3, name: 'R' },
  ],
  units: [{ id: 'pr141-scout', ownerId: 1, typeId: 'Zwiadowca', category: 'zwiadowca', q: 1, r: 1, ruch: 2, ruchLeft: 2 }],
  allowed: (_cityId, id) => ['military-choice', 'economy-choice', 'science-choice'].includes(id),
  difficulty: null,
};
state.difficulty = loadDifficultyParams(state.data, 2);
const baseProfile = { priorytetMilitarny: 5, priorytetEkonomia: 5, priorytetNauka: 5 };
function select(
  profile, cityId = 'pr141-a', ownerId = 1,
  cities = state.cities.filter(city => city.ownerId === ownerId),
  allowed = state.allowed,
  data = state.data,
) {
  return chooseCityProduction(
    cityId, cities, state.units, ownerId, data,
    { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
    {
      cityBuildings: { 'pr141-a': [], 'pr141-b': [], 'pr141-c': [] },
      currentTurn: 100, defensiveCopy: false, civAiProfile: profile,
      isProductionAllowed: allowed,
    },
    state.map, loadDifficultyParams(data, 2),
  );
}

console.log('--- fresh baseline: fixed state/seed, all priorities neutral ---');
const baseline = select(baseProfile);
equal(baseline, 'economy-choice', 'neutral deterministic candidate-order baseline');
console.log(`baseline choice=${baseline}; turn=100; map.seed=141; owner=1; profile=5/5/5`);

console.log('--- isolated positive perturbations: selected production target ---');
const cases = [
  ['military', 'priorytetMilitarny', 'military-choice'],
  ['economy', 'priorytetEkonomia', 'economy-choice'],
  ['science', 'priorytetNauka', 'science-choice'],
];
for (const [label, field, expected] of cases) {
  const profile = { ...baseProfile, [field]: 10 };
  const chosen = select(profile);
  equal(chosen, expected, `${label}: only ${field} 5->10 selects its matching production target`);
  console.log(`${label}: ${field}=10, other fields=5 => ${chosen}`);
}

console.log('--- negative controls ---');
equal(select(baseProfile), baseline, 'neutral/default profile repeats unchanged baseline');

console.log('--- matrix -> owner profile -> final selector: virtual single-field perturbations ---');
const profileData = {};
const ownerCiv = { 1: 'Grecy', 2: 'Rzymianie' };
const ownerCities = Object.fromEntries(Object.keys(ownerCiv).map(ownerId => [
  ownerId, state.cities.filter(city => city.ownerId === Number(ownerId)),
]));
const ownerProfiles = Object.fromEntries(Object.entries(ownerCiv).map(([ownerId, civName]) => [
  ownerId, civAiProfileFor(profileData, civName, 'normal'),
]));
for (const [ownerId, civName] of Object.entries(ownerCiv)) {
  const profile = ownerProfiles[ownerId];
  assert(profile, `${civName} owner profile is resolved from the real civilization matrix`);
  for (const [field, matrixKey] of [
    ['priorytetMilitarny', 'ai_priorytet_militarny'],
    ['priorytetEkonomia', 'ai_priorytet_ekonomia'],
    ['priorytetNauka', 'ai_priorytet_nauka'],
  ]) {
    equal(profile[field], civMatrixParamAtDifficulty(civName, matrixKey, 'normal'),
      `${civName} owner profile ${field} matches raw matrix ${matrixKey}`);
  }
}
const greekMatrixProfile = ownerProfiles[1];
const romanMatrixProfile = ownerProfiles[2];
console.log(`owner profile values: Greece=${greekMatrixProfile.priorytetMilitarny}/${greekMatrixProfile.priorytetEkonomia}/${greekMatrixProfile.priorytetNauka}; Rome=${romanMatrixProfile.priorytetMilitarny}/${romanMatrixProfile.priorytetEkonomia}/${romanMatrixProfile.priorytetNauka}`);
// Calibrate only fixture building cost so Greece's actual matrix profile has a
// competitive baseline; production data and AI implementation remain untouched.
const matrixScenarioData = {
  ...state.data,
  buildings: state.data.buildings.map(building => building.id === 'economy-choice'
    ? { ...building, kosztBudowy: 50 }
    : building),
};
const greekMatrixBaseline = select(greekMatrixProfile, 'pr141-a', 1, ownerCities[1], state.allowed, matrixScenarioData);
const romanMatrixBaseline = select(romanMatrixProfile, 'pr141-r', 2, ownerCities[2], state.allowed, matrixScenarioData);
console.log(`matrix-backed baseline: Greece=${greekMatrixBaseline}; Rome=${romanMatrixBaseline}`);
const matrixPerturbations = [
  ['priorytetMilitarny', 'military-choice', 10, 'ai_priorytet_militarny'],
  ['priorytetEkonomia', 'economy-choice', 10, 'ai_priorytet_ekonomia'],
  ['priorytetNauka', 'science-choice', 10, 'ai_priorytet_nauka'],
];
for (const [field, expected, virtualValue, matrixKey] of matrixPerturbations) {
  const perturbation = { ...greekMatrixProfile, [field]: virtualValue };
  const actual = select(perturbation, 'pr141-a', 1, ownerCities[1], state.allowed, matrixScenarioData);
  equal(actual, expected,
    `Greeks raw ${matrixKey}->civAiProfileFor; virtual ${field}=${virtualValue} changes final selection`);
  equal(select(romanMatrixProfile, 'pr141-r', 2, ownerCities[2], state.allowed, matrixScenarioData), romanMatrixBaseline,
    `Greek ${matrixKey} perturbation leaves actual Roman owner's production unchanged`);
  console.log(`Greece ${matrixKey}: ${greekMatrixProfile[field]}->${virtualValue} => ${actual}; Rome remains ${romanMatrixBaseline}`);
}
const excludedAllowed = (_cityId, id) => id === 'economy-choice' || id === 'science-choice';
equal(select({ ...greekMatrixProfile, priorytetMilitarny: 10 }, 'pr141-a', 1, ownerCities[1], excludedAllowed, matrixScenarioData),
  select(greekMatrixProfile, 'pr141-a', 1, ownerCities[1], excludedAllowed, matrixScenarioData),
  'military priority perturbation does not change a choice among unrelated economy/science targets');

console.log('--- shared aggression consumer: fixed owner/state, difficulty changes diplomacy war willingness ---');
const relation = { zaufanie: 0, respekt: 80, status: 'pokoj' };
const diplomacyState = { isMinorCiv: false, militaryRatio: 2, currentTurn: 1, turnsAtWar: 0 };
function warWillingness(ownerType, difficulty) {
  return aiDiplomacyStance(
    { typCywilizacji: ownerType }, { typCywilizacji: 'rzymianie' }, relation,
    { ...diplomacyState, civMatrixDifficulty: difficulty },
  ).willingnessWar;
}
const greekAggression = ['easy', 'normal', 'hard'].map(d => resolveArchetypeAggression('grecy', 0, state.data, d));
const greekWillingness = ['easy', 'normal', 'hard'].map(d => warWillingness('grecy', d));
console.log(`Greek aggression=${greekAggression.join('/')}; final war willingness=${greekWillingness.join('/')}; Rome/Normal=${warWillingness('rzymianie', 'normal')}`);
assert(greekAggression[0] < greekAggression[1] && greekAggression[1] < greekAggression[2],
  `Greek ai_agresywnosc follows difficulty: ${greekAggression.join(' < ')}`);
assert(greekWillingness[0] < greekWillingness[1] && greekWillingness[1] < greekWillingness[2],
  `Greek final diplomacy willingness follows ai_agresywnosc difficulty: ${greekWillingness.join(' < ')}`);
assert(warWillingness('grecy', 'normal') !== warWillingness('rzymianie', 'normal'),
  'same-state/same-difficulty final diplomacy result differs by owning civilization aggression');

if (failed > 0) {
  console.error(`pr141-ai-production-behavior-test: ${passed} passed, ${failed} failed`);
  process.exitCode = 1;
} else {
  console.log(`pr141-ai-production-behavior-test: ${passed} passed, ${failed} failed`);
}
fs.rmSync(tempRoot, { recursive: true, force: true });
