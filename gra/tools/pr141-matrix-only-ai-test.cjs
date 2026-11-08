'use strict';

/**
 * Matrix-only AI category scoring at the real chooseCityProduction selector.
 * Run from gra/: node tools/pr141-matrix-only-ai-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const sourceRoot = path.resolve(__dirname, '..', 'src');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-matrix-only-ai-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');
fs.writeFileSync(entry, `
  export { chooseCityProduction, loadDifficultyParams, decideAIDiplomacy } from ${JSON.stringify(sourceRoot + '/game/ai')};
  export {
    civAiProfileFor, civAiAggressionNorm, civAiProfilMapy,
    resolveArchetypeAggression, resolveArchetypeTrade, nastawienieBazoweZaufanieDelta,
  } from ${JSON.stringify(sourceRoot + '/game/civ-ai-data')};
  export { civMatrixParamAtDifficulty } from ${JSON.stringify(sourceRoot + '/game/civ-matrix')};
  export { aiBypassClusterConsolidation, aiPowerGoalFoundingInterval, aiTreasuryPracaForFounding } from ${JSON.stringify(sourceRoot + '/game/ai-expansion')};
  export { resolveDiplomacyCivBias } from ${JSON.stringify(sourceRoot + '/game/ai')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent',
});
const {
  chooseCityProduction, loadDifficultyParams, decideAIDiplomacy, civAiProfileFor,
  civAiAggressionNorm, civAiProfilMapy, resolveArchetypeAggression,
  resolveArchetypeTrade, nastawienieBazoweZaufanieDelta, civMatrixParamAtDifficulty,
  aiBypassClusterConsolidation, aiPowerGoalFoundingInterval, aiTreasuryPracaForFounding,
  resolveDiplomacyCivBias,
} = require(bundle);
let passed = 0;
let failed = 0;
function assert(ok, message) {
  if (ok) passed++;
  else { failed++; console.error(`FAIL: ${message}`); }
}
function equal(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
}

const data = {
  units: [{ Jednostka: 'Wojownik' }, { Jednostka: 'Łucznik' }],
  buildings: [
    { id: 'military-choice', grupa: 'Wojsko i obrona', kosztBudowy: 0 },
    { id: 'economy-choice', grupa: 'Handel i pieniądz', kosztBudowy: 0 },
    { id: 'science-choice', grupa: 'Nauka i kultura', kosztBudowy: 0 },
  ],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4 }] },
  aiParams: {},
};
const map = { szerokoscQ: 4, wysokoscR: 4, hexes: {}, seed: 141, riverPaths: [] };
const cities = [
  { id: 'pr141-a', ownerId: 1, q: 1, r: 1, population: 3, name: 'A' },
  { id: 'pr141-b', ownerId: 1, q: 3, r: 1, population: 3, name: 'B' },
  { id: 'pr141-c', ownerId: 1, q: 1, r: 3, population: 3, name: 'C' },
];
const units = [{ id: 'pr141-scout', ownerId: 1, typeId: 'Zwiadowca', category: 'zwiadowca', q: 1, r: 1, ruch: 2, ruchLeft: 2 }];
const allowed = (_cityId, id) => ['military-choice', 'economy-choice', 'science-choice'].includes(id);
const optsFor = (profile, isProductionAllowed = allowed) => ({
  cityBuildings: { 'pr141-a': [], 'pr141-b': [], 'pr141-c': [] },
  currentTurn: 100,
  defensiveCopy: false,
  civAiProfile: profile,
  isProductionAllowed,
});
const neutralLegacy = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
function select(profile, legacy = neutralLegacy, difficulty = 2, canBuild = allowed, productionBonusOverride) {
  const difficultyParams = loadDifficultyParams(data, difficulty);
  if (productionBonusOverride !== undefined) difficultyParams.bonusProdukcja = productionBonusOverride;
  return chooseCityProduction(
    'pr141-a', cities, units, 1, data, legacy, optsFor(profile, canBuild), map,
    difficultyParams,
  );
}

const matrixProfile = civAiProfileFor({ civAi: { cywilizacje: [] } }, 'Rzymianie', 'normal');
assert(matrixProfile, 'recognized owner resolves its current matrix-backed AI profile');
const baseProfile = {
  ...matrixProfile,
  priorytetMilitarny: 5,
  priorytetEkonomia: 5,
  priorytetNauka: 5,
};
const baseline = select(baseProfile);
equal(baseline, 'economy-choice', 'neutral matrix priorities preserve deterministic generic baseline');

console.log('--- approved matrix profile categories move actual production selection ---');
for (const [field, expected] of [
  ['priorytetMilitarny', 'military-choice'],
  ['priorytetEkonomia', 'economy-choice'],
  ['priorytetNauka', 'science-choice'],
]) {
  equal(select({ ...baseProfile, [field]: 10 }), expected, `${field}=10 selects its matching actual candidate`);
}

console.log('--- old archetype numeric bonuses neither replace nor stack with matrix values ---');
const conflictingLegacy = { wojsko: 9, nauka: 8, ekonomia: -9, obrona: 7 };
equal(select(baseProfile, conflictingLegacy), baseline,
  'legacy military/science/defense/economy values alone cannot change a neutral matrix result');
equal(select({ ...baseProfile, priorytetMilitarny: 10 }, { ...conflictingLegacy, wojsko: -9 }), 'military-choice',
  'positive matrix military priority wins despite opposite legacy military/economy values');
equal(select({ ...baseProfile, priorytetEkonomia: 10 }, { ...conflictingLegacy, ekonomia: -9, wojsko: 9 }), 'economy-choice',
  'positive matrix economy priority wins without old military/economy composition bias');
equal(select({ ...baseProfile, priorytetNauka: 10 }, { ...conflictingLegacy, nauka: -9 }), 'science-choice',
  'positive matrix science production priority wins despite opposite legacy science value');
equal(select(undefined, conflictingLegacy), baseline,
  'missing matrix profile is neutral and cannot inherit old archetype numeric values');

console.log('--- generic difficulty and production eligibility remain active ---');
const easy = select(baseProfile, neutralLegacy, 1);
const hard = select(baseProfile, neutralLegacy, 3);
const easyProductionBonus = loadDifficultyParams(data, 1).bonusProdukcja;
const hardProductionBonus = loadDifficultyParams(data, 3).bonusProdukcja;
assert(easyProductionBonus !== hardProductionBonus,
  `generic difficulty production parameter remains distinct (${easyProductionBonus} vs ${hardProductionBonus})`);
assert(typeof easy === 'string' && typeof hard === 'string',
  `real selector remains callable at both generic difficulty levels (${easy} / ${hard})`);
const lowGenericProduction = select(baseProfile, neutralLegacy, 2, allowed, -5);
const highGenericProduction = select(baseProfile, neutralLegacy, 2, allowed, 5);
assert(lowGenericProduction !== highGenericProduction,
  `generic production parameter remains live in category scoring (${lowGenericProduction} vs ${highGenericProduction})`);
const restricted = (_cityId, id) => id === 'economy-choice' || id === 'science-choice';
equal(select({ ...baseProfile, priorytetMilitarny: 10 }, neutralLegacy, 2, restricted),
  select(baseProfile, neutralLegacy, 2, restricted),
  'matrix priority cannot bypass ordinary production-eligibility callback');

console.log('--- unknown or missing diplomacy owner does not borrow Greek matrix behavior ---');
const unknownDiplomacy = {
  myPlayerId: 'ai-1', agresja: 0.8, currentTurn: 30,
  relacje: [{
    partnerId: 'rival-1',
    relation: { zaufanie: 5, respekt: 5, status: 'neutralni' },
    respektWzgledny: 0.7,
    stanWojny: false,
  }],
};
const absentTypeCommands = decideAIDiplomacy({ ...unknownDiplomacy });
const unknownTypeCommands = decideAIDiplomacy({ ...unknownDiplomacy, myTypCywilizacji: 'unmapped-civ-key' });
const greekTypeCommands = decideAIDiplomacy({
  ...unknownDiplomacy,
  myTypCywilizacji: 'grecy',
  relacje: [{ ...unknownDiplomacy.relacje[0], partnerTypCywilizacji: 'rzymianie' }],
});
equal(JSON.stringify(absentTypeCommands), JSON.stringify(unknownTypeCommands),
  'missing and unknown civilization keys take the same generic diplomacy path');
assert(!absentTypeCommands.some(command => command.type === 'wypowiedz_wojne'),
  'missing civilization type does not inherit Greek matrix willingness-to-war');
assert(greekTypeCommands.some(command => command.type === 'wypowiedz_wojne'),
  'recognized Greek matrix row remains active when explicitly supplied');
const recognizedActor = { ...unknownDiplomacy, myTypCywilizacji: 'grecy' };
const absentPartnerCommands = decideAIDiplomacy({ ...recognizedActor });
const unknownPartnerCommands = decideAIDiplomacy({
  ...recognizedActor,
  relacje: [{ ...recognizedActor.relacje[0], partnerTypCywilizacji: 'unmapped-rival-key' }],
});
const romanPartnerCommands = decideAIDiplomacy({
  ...recognizedActor,
  relacje: [{ ...recognizedActor.relacje[0], partnerTypCywilizacji: 'rzymianie' }],
});
equal(JSON.stringify(absentPartnerCommands), JSON.stringify(unknownPartnerCommands),
  'missing and unknown partner keys take the same generic diplomacy path');
assert(!absentPartnerCommands.some(command => command.type === 'wypowiedz_wojne'),
  'missing partner type does not borrow the Roman matrix row');
assert(romanPartnerCommands.some(command => command.type === 'wypowiedz_wojne'),
  'recognized Roman partner remains available when explicitly supplied');

console.log('--- unmatched civ-ai/diplomacy rows cannot restore legacy numeric modifiers ---');
const poisonedLegacyData = {
  civAi: { cywilizacje: [{
    Cywilizacja: 'Unmapped Test Civilization',
    agresywnosc: 10,
    ekspansywnosc: 10,
    priorytetMilitarny: 10,
    priorytetEkonomia: 1,
    priorytetNauka: 10,
    tolerancjaRyzyka: 1,
    sklonnoscDoPodboju: 10,
    profilMapy: 'kopia_typu_obronna',
    uwagi: 'display-label-preserved',
  }] },
};
const unmatchedProfile = civAiProfileFor(poisonedLegacyData, 'Unmapped Test Civilization', 'hard');
equal(unmatchedProfile, undefined, 'legacy-only civilization row does not produce a behavior profile without a matrix row');
equal(civAiAggressionNorm(poisonedLegacyData, 'Unmapped Test Civilization', 'hard'), undefined,
  'normalized aggression helper does not import unmatched legacy aggression');
equal(civAiProfilMapy(poisonedLegacyData, 'Unmapped Test Civilization', 'hard'), undefined,
  'map-profile helper does not import unmatched legacy defensive-copy setting');
equal(resolveArchetypeAggression('Unmapped Test Civilization', 0.95, poisonedLegacyData, 'hard'), 0.5,
  'unmatched aggression resolver ignores both legacy data and archetype fallback');
equal(resolveArchetypeTrade('unmapped-test-civ', 0.95, 'hard'), 0.5,
  'unmatched trade resolver is neutral instead of borrowing per-nation data/fallback');
equal(nastawienieBazoweZaufanieDelta('unmapped-test-civ', 50, 'hard'), 0,
  'unmatched starting-trust modifier stays at generic base');
const expansionWithoutMatrix = unmatchedProfile?.ekspansywnosc ?? 0;
equal(aiPowerGoalFoundingInterval(expansionWithoutMatrix), 4,
  'missing profile follows actual generic founding interval instead of legacy value 5 interval 2');
equal(aiBypassClusterConsolidation(expansionWithoutMatrix), false,
  'missing profile follows actual cluster gate default instead of legacy expansion bypass');
equal(aiTreasuryPracaForFounding(20, expansionWithoutMatrix), 10,
  'missing profile follows actual generic founding reserve instead of legacy no-reserve value 5');
const conquestWithoutMatrix = unmatchedProfile?.sklonnoscDoPodboju ?? 2;
equal(resolveDiplomacyCivBias(0.5, conquestWithoutMatrix).aggressive, false,
  'missing profile follows actual generic conquest bias instead of legacy threshold-activating value 5');
const conflictingKnownData = {
  civAi: { cywilizacje: [{
    Cywilizacja: 'Grecy', agresywnosc: 10, ekspansywnosc: 1,
    priorytetMilitarny: 10, priorytetEkonomia: 1, priorytetNauka: 10,
    tolerancjaRyzyka: 1, sklonnoscDoPodboju: 10, profilMapy: 'kopia_typu_obronna',
  }] },
};
const knownMatrixProfile = civAiProfileFor(conflictingKnownData, 'Grecy', 'normal');
for (const [profileField, matrixField] of [
  ['agresywnosc', 'ai_agresywnosc'],
  ['ekspansywnosc', 'ai_ekspansywnosc'],
  ['priorytetMilitarny', 'ai_priorytet_militarny'],
  ['priorytetEkonomia', 'ai_priorytet_ekonomia'],
  ['priorytetNauka', 'ai_priorytet_nauka'],
  ['tolerancjaRyzyka', 'ai_tolerancja_ryzyka'],
  ['sklonnoscDoPodboju', 'ai_sklonnosc_podboju'],
]) equal(knownMatrixProfile[profileField], civMatrixParamAtDifficulty('grecy', matrixField, 'normal'),
  `recognized matrix ${matrixField} stays authoritative over legacy row`);
equal(knownMatrixProfile.profilMapy,
  civMatrixParamAtDifficulty('grecy', 'ai_profil_obronna', 'normal') === 1 ? 'kopia_typu_obronna' : 'standardowa',
  'recognized matrix map profile stays authoritative over legacy row');
equal(resolveArchetypeAggression('grecy', 0, poisonedLegacyData, 'normal'),
  resolveArchetypeAggression('grecy', 0, undefined, 'normal'),
  'recognized matrix aggression remains authoritative over conflicting legacy data');
equal(resolveArchetypeTrade('grecy', 0, 'normal'),
  civMatrixParamAtDifficulty('grecy', 'dip_handlowosc_archetyp', 'normal'),
  'recognized matrix trade field remains active');

fs.rmSync(tempRoot, { recursive: true, force: true });
if (failed > 0) {
  console.error(`pr141-matrix-only-ai-test: ${passed} passed, ${failed} failed`);
  process.exitCode = 1;
} else {
  console.log(`pr141-matrix-only-ai-test: ${passed} passed, ${failed} failed`);
}
