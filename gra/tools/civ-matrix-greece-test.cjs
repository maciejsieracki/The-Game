'use strict';
/**
 * Greece 113-column matrix contract and runtime adapter tests.
 * Run from gra/: node tools/civ-matrix-greece-test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const sourceRoot = path.resolve(__dirname, '..', 'src');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-matrix-greece-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');
fs.writeFileSync(entry, `
  export {
    loadCivMatrix,
    civMatrixParam,
    civMatrixParamAtDifficulty,
    civMatrixParamsAtDifficulty,
  } from ${JSON.stringify(sourceRoot + '/game/civ-matrix')};
  export {
    civAiProfileFor,
    civAiProfilMapy,
    resolveArchetypeAggression,
    resolveArchetypeTrade,
    nastawienieBazoweZaufanieDelta,
  } from ${JSON.stringify(sourceRoot + '/game/civ-ai-data')};
  export { aiDiplomacyStance } from ${JSON.stringify(sourceRoot + '/game/diplomacy')};
  export {
    chooseCityProduction,
    decideAIDiplomacy,
    loadDifficultyParams,
  } from ${JSON.stringify(sourceRoot + '/game/ai')};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
  });
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  process.exit(1);
}

const {
  loadCivMatrix,
  civMatrixParam,
  civMatrixParamAtDifficulty,
  civMatrixParamsAtDifficulty,
  civAiProfileFor,
  civAiProfilMapy,
  resolveArchetypeAggression,
  resolveArchetypeTrade,
  nastawienieBazoweZaufanieDelta,
  aiDiplomacyStance,
  chooseCityProduction,
  decideAIDiplomacy,
  loadDifficultyParams,
} = require(bundle);

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error('FAIL:', message);
  }
}
function equal(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

const matrix = loadCivMatrix();
const greece = matrix.cywilizacje.find(row => row.ikonaId === 'grecy');
const difficulties = ['easy', 'normal', 'hard'];
const mainSource = fs.readFileSync(path.resolve(sourceRoot, 'main.ts'), 'utf8');

console.log('--- matrix shape and complete 113-column snapshots ---');
equal(matrix._meta.kolumny, 113, 'matrix declares 113 columns');
equal(matrix.paramDefs && Object.keys(matrix.paramDefs).length, 113, '113 parameter definitions');
equal(greece && Object.keys(greece.params).length, 113, 'Greece has 113 flat values');
for (const difficulty of difficulties) {
  const snapshot = civMatrixParamsAtDifficulty('grecy', difficulty);
  equal(Object.keys(snapshot).length, 113, `Greece ${difficulty} snapshot has all parameters`);
  for (const id of Object.keys(matrix.paramDefs)) {
    assert(Object.prototype.hasOwnProperty.call(snapshot, id), `${difficulty} snapshot includes ${id}`);
  }
}

console.log('--- difficulty policy ---');
equal(civMatrixParamAtDifficulty('grecy', 'ai_agresywnosc', 'easy'), 3, 'Easy scales aggression 4 -> 3');
equal(civMatrixParamAtDifficulty('grecy', 'ai_agresywnosc', 'normal'), 4, 'Normal keeps aggression 4');
equal(civMatrixParamAtDifficulty('grecy', 'ai_agresywnosc', 'hard'), 5, 'Hard scales aggression 4 -> 5');
equal(civMatrixParamAtDifficulty('grecy', 'ai_ekspansywnosc', 'easy'), 2, 'Easy scales expansion 3 -> 2');
equal(civMatrixParamAtDifficulty('grecy', 'ai_ekspansywnosc', 'hard'), 4, 'Hard scales expansion 3 -> 4');
equal(civMatrixParamAtDifficulty('grecy', 'walka_obrona_piechota', 'easy'), 0.2, 'combat trait stays neutral on Easy');
equal(civMatrixParamAtDifficulty('grecy', 'walka_obrona_piechota', 'hard'), 0.2, 'combat trait stays neutral on Hard');
equal(civMatrixParamAtDifficulty('grecy', 'spec_Obrona', 'hard'), 100, 'special-unit stat stays neutral on Hard');
equal(civMatrixParam('unknown-civ', 'ai_agresywnosc'), 5, 'unknown civ uses matrix default');
for (const difficulty of difficulties) {
  const expected = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 5 : 6;
  equal(
    civMatrixParamAtDifficulty('grecy', 'ai_priorytet_militarny', difficulty),
    expected,
    `military priority is ${expected} on ${difficulty}`,
  );
  equal(
    civMatrixParamAtDifficulty('grecy', 'ai_priorytet_ekonomia', difficulty),
    expected,
    `economy priority is ${expected} on ${difficulty}`,
  );
}

console.log('--- AI adapter uses matrix values and all eight fields ---');
const conflictingData = {
  civAi: { cywilizacje: [{
    Cywilizacja: 'Grecy', agresywnosc: 99, ekspansywnosc: 99,
    priorytetMilitarny: 99, priorytetEkonomia: 99, priorytetNauka: 99,
    tolerancjaRyzyka: 99, sklonnoscDoPodboju: 99, profilMapy: 'legacy',
  }] },
};
const easyProfile = civAiProfileFor(conflictingData, 'Grecy', 'easy');
const normalProfile = civAiProfileFor(conflictingData, 'Grecy', 'normal');
const hardProfile = civAiProfileFor(conflictingData, 'Grecy', 'hard');
equal(easyProfile.agresywnosc, 3, 'profile aggression comes from matrix on Easy');
equal(easyProfile.ekspansywnosc, 2, 'profile expansion comes from matrix on Easy');
equal(easyProfile.priorytetMilitarny, 4, 'profile military priority comes from matrix on Easy');
equal(normalProfile.priorytetMilitarny, 5, 'profile military priority comes from matrix on Normal');
equal(hardProfile.priorytetMilitarny, 6, 'profile military priority comes from matrix on Hard');
equal(easyProfile.priorytetEkonomia, 4, 'profile economy priority comes from matrix on Easy');
equal(normalProfile.priorytetEkonomia, 5, 'profile economy priority comes from matrix on Normal');
equal(hardProfile.priorytetEkonomia, 6, 'profile economy priority comes from matrix on Hard');
equal(easyProfile.priorytetNauka, 5, 'profile science priority comes from matrix on Easy');
equal(normalProfile.tolerancjaRyzyka, 4, 'profile risk comes from matrix on Normal');
equal(hardProfile.sklonnoscDoPodboju, 3, 'profile conquest comes from matrix on Hard');
equal(normalProfile.profilMapy, 'kopia_typu_obronna', 'profile map flag is resolved from matrix');
equal(civAiProfilMapy(conflictingData, 'Grecy'), 'kopia_typu_obronna', 'Greece map profile adapter reads matrix flag');
equal(civAiProfilMapy(conflictingData, 'Babilonia'), 'standardowa', 'zero map flag is explicit standard profile');
const mapRolePath = mainSource.match(
  /if \(civAiProfilMapy\(data, rivalCivId\) === 'kopia_typu_obronna'\) \{\s*typCityCopyOwners\.add\(ownerId\);\s*\}/,
);
assert(mapRolePath !== null, 'live main.ts map-profile role path is present');
if (mapRolePath !== null) {
  const applyLiveMapRole = new Function(
    'civAiProfilMapy', 'data', 'rivalCivId', 'typCityCopyOwners', 'ownerId',
    mapRolePath[0],
  );
  const defensiveOwners = new Set();
  applyLiveMapRole(civAiProfilMapy, conflictingData, 'grecy', defensiveOwners, 101);
  assert(defensiveOwners.has(101), 'live main.ts path marks defensive profile as typCityCopyOwner');
  const standardOwners = new Set();
  applyLiveMapRole(civAiProfilMapy, conflictingData, 'babilonia', standardOwners, 102);
  assert(!standardOwners.has(102), 'live main.ts path leaves standard profile outside typCityCopyOwners');
}
equal(resolveArchetypeAggression('grecy', 0.99, conflictingData, 'hard'), 0.5, 'diplomacy aggression uses Hard matrix value');
equal(resolveArchetypeTrade('grecy', 0, 'normal'), 0.75, 'trade archetype uses matrix value');
equal(nastawienieBazoweZaufanieDelta('grecy'), 4.5, 'base attitude helper reads matrix value (pure adapter; live init is not claimed)');
equal(civMatrixParamAtDifficulty('rzymianie', 'dip_agresja_archetyp', 'normal'), 0.75, 'Roman dip_agresja_archetyp remains a separate matrix field');
equal(resolveArchetypeAggression('rzymianie', 0, conflictingData, 'normal'), 0.8, 'Roman gameplay aggression resolver uses ai_agresywnosc, not dip_agresja_archetyp');
assert(
  civMatrixParamAtDifficulty('rzymianie', 'dip_agresja_archetyp', 'normal')
    !== resolveArchetypeAggression('rzymianie', 0, conflictingData, 'normal'),
  'duplicate Roman aggression fields are distinguishable (0.75 vs 0.8)',
);

console.log('--- production-priority decision consumes military/economy fields ---');
const productionData = {
  units: [{ Jednostka: 'Wojownik' }, { Jednostka: 'Łucznik' }],
  buildings: [
    { id: 'economic-choice', grupa: 'Handel i pieniądz', kosztBudowy: 0 },
    { id: 'military-choice', grupa: 'Wojsko i obrona', kosztBudowy: 0 },
  ],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4 }] },
  aiParams: {},
};
const productionMap = { szerokoscQ: 4, wysokoscR: 4, hexes: {}, seed: 1, riverPaths: [] };
const productionCities = [
  { id: 'prod-a', ownerId: 1, q: 1, r: 1, population: 3, name: 'A' },
  { id: 'prod-b', ownerId: 1, q: 3, r: 1, population: 3, name: 'B' },
  { id: 'prod-c', ownerId: 1, q: 1, r: 3, population: 3, name: 'C' },
];
const productionUnits = [{
  id: 'prod-scout', ownerId: 1, typeId: 'Zwiadowca', category: 'zwiadowca',
  q: 1, r: 1, ruch: 2, ruchLeft: 2,
}];
const productionAllowed = (_cityId, id) => id === 'economic-choice' || id === 'military-choice';
const productionDifficulty = loadDifficultyParams(productionData, 2);
const militaryFirst = chooseCityProduction(
  'prod-a',
  productionCities,
  productionUnits,
  1,
  productionData,
  { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
  {
    cityBuildings: { 'prod-a': [], 'prod-b': [], 'prod-c': [] },
    currentTurn: 100,
    defensiveCopy: false,
    civAiProfile: { ...easyProfile, priorytetMilitarny: 10, priorytetEkonomia: 1 },
    isProductionAllowed: productionAllowed,
  },
  productionMap,
  productionDifficulty,
);
const economyFirst = chooseCityProduction(
  'prod-a',
  productionCities,
  productionUnits,
  1,
  productionData,
  { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 },
  {
    cityBuildings: { 'prod-a': [], 'prod-b': [], 'prod-c': [] },
    currentTurn: 100,
    defensiveCopy: false,
    civAiProfile: { ...easyProfile, priorytetMilitarny: 1, priorytetEkonomia: 10 },
    isProductionAllowed: productionAllowed,
  },
  productionMap,
  productionDifficulty,
);
equal(militaryFirst, 'military-choice', 'production path prefers military building when military priority is higher');
equal(economyFirst, 'economic-choice', 'production path prefers economy building when economy priority is higher');

console.log('--- diplomacy stance receives matrix difficulty ---');
const relation = { zaufanie: 0, respekt: 80, status: 'pokoj' };
const common = { isMinorCiv: false, militaryRatio: 2, currentTurn: 1, turnsAtWar: 0 };
const easyStance = aiDiplomacyStance({ typCywilizacji: 'grecy' }, { typCywilizacji: 'rzymianie' }, relation, { ...common, civMatrixDifficulty: 'easy' });
const normalStance = aiDiplomacyStance({ typCywilizacji: 'grecy' }, { typCywilizacji: 'rzymianie' }, relation, { ...common, civMatrixDifficulty: 'normal' });
const hardStance = aiDiplomacyStance({ typCywilizacji: 'grecy' }, { typCywilizacji: 'rzymianie' }, relation, { ...common, civMatrixDifficulty: 'hard' });
assert(easyStance.willingnessWar < normalStance.willingnessWar && normalStance.willingnessWar < hardStance.willingnessWar, 'Easy/Normal/Hard matrix aggression orders pure stance war willingness');

const decisionInput = {
  myPlayerId: '1',
  relacje: [{
    partnerId: '2',
    relation: { zaufanie: 0, respekt: 10, status: 'pokoj' },
    respektWzgledny: 0.65,
    stanWojny: false,
    partnerTypCywilizacji: 'rzymianie',
  }],
  agresja: 1,
  handlowosc: 0.4,
  currentTurn: 100,
  myTypCywilizacji: 'grecy',
  agresywnoscRaw: 8,
  tolerancjaRyzyka: 5,
  fullDiplomacyLayer: false,
};
const decisionByDifficulty = Object.fromEntries(difficulties.map(difficulty => [
  difficulty,
  decideAIDiplomacy(decisionInput, undefined, 1, 1, difficulty),
]));
for (const difficulty of difficulties) {
  equal(decisionByDifficulty[difficulty][0]?.type, 'wypowiedz_wojne', `decideAIDiplomacy returns the war decision on ${difficulty}`);
}
assert(
  decisionByDifficulty.easy[0]?.powod.includes('willingnessWar=0.37')
    && decisionByDifficulty.normal[0]?.powod.includes('willingnessWar=0.42')
    && decisionByDifficulty.hard[0]?.powod.includes('willingnessWar=0.47'),
  'decideAIDiplomacy forwards Easy/Normal/Hard to the stance decision path',
);

// Optional durable evidence for the Operator handoff. The report is built
// from the live 113 definitions, rather than a hand-maintained sample.
if (process.env.CIV_MATRIX_REPORT) {
  const gameplay = new Map([
    ['lud_wzrost_proc', 'population-growth-v85.ts:207'],
    ['dip_handlowosc_archetyp', 'civ-ai-data.ts:171; main.ts diplomacy trade decisions'],
    ['ai_agresywnosc', 'civ-ai-data.ts:143; main.ts + aiDiplomacyStance'],
    ['ai_ekspansywnosc', 'civ-ai-data.ts:62; ai.ts founding/hex selection'],
    ['ai_priorytet_militarny', 'civ-ai-data.ts:62; ai-production-priorities.ts:18'],
    ['ai_priorytet_ekonomia', 'civ-ai-data.ts:62; ai-production-priorities.ts:18'],
    ['ai_priorytet_nauka', 'civ-ai-data.ts:62; ai-production-priorities.ts:18'],
    ['ai_tolerancja_ryzyka', 'civ-ai-data.ts:62; ai.ts resolveDiplomacyCivBias'],
    ['ai_sklonnosc_podboju', 'civ-ai-data.ts:62; ai.ts conquest/patrol decisions'],
    ['ai_profil_obronna', 'civ-ai-data.ts:56; main.ts:8934 city-state map role'],
  ]);
  const unwiredNotes = new Map([
    ['dip_nastawienie_bazowe', 'live relation initializer not wired; apply matrix delta once in main.ts'],
    ['dip_agresja_archetyp', 'duplicate with ai_agresywnosc; reconcile/deprecate before wiring gameplay'],
  ]);
  const uiOnly = new Map([
    ['dip_otwartosc_handel', 'diplomacy-display.ts:46'],
    ['dip_sklonnosc_sojusze', 'diplomacy-display.ts:55'],
    ['dip_lojalnosc', 'diplomacy-display.ts:64'],
    ['dip_prog_wojny', 'diplomacy-display.ts:73'],
    ['dip_pamietliwosc', 'diplomacy-display.ts:82'],
  ]);
  const lines = [
    '# Greece 113 matrix coverage (generated from civ-matrix.json)',
    `definitions=${Object.keys(matrix.paramDefs).length}`,
    'status\tparameter\tconsumer\tnext action',
  ];
  const counts = { REAL_GAMEPLAY: 0, UI_ONLY: 0, UNWIRED: 0, BLOCKED: 0 };
  for (const id of Object.keys(matrix.paramDefs)) {
    let status = 'UNWIRED';
    let consumer = 'none confirmed';
    let next = unwiredNotes.get(id) ?? `wire declared module ${matrix.paramDefs[id].modul}`;
    if (gameplay.has(id)) {
      status = 'REAL_GAMEPLAY';
      consumer = gameplay.get(id);
      next = 'retain focused regression coverage';
    } else if (uiOnly.has(id)) {
      status = 'UI_ONLY';
      consumer = uiOnly.get(id);
      next = 'keep separate from gameplay coverage';
    }
    counts[status]++;
    lines.push(`${status}\t${id}\t${consumer}\t${next}`);
  }
  lines.splice(1, 0, `counts=${JSON.stringify(counts)}`);
  lines.push('additional profiles: AI 8 REAL_GAMEPLAY; civ-params 4 UNWIRED; diplomacy perNacja 3 REAL_GAMEPLAY + 5 UI_ONLY');
  fs.writeFileSync(process.env.CIV_MATRIX_REPORT, `${lines.join('\n')}\n`, 'utf8');
}

fs.rmSync(tempRoot, { recursive: true, force: true });
console.log(`PASS ${passed}; FAIL ${failed}`);
if (failed) process.exit(1);
