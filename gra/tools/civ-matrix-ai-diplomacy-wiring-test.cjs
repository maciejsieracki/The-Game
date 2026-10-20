'use strict';
/**
 * Focused contract test for the two activated AI/diplomacy matrix fields.
 * Run from gra/: node tools/civ-matrix-ai-diplomacy-wiring-test.cjs
 *
 * This test exercises the live consumers and guards the intended boundaries.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const graRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(graRoot, 'src');
const tempRoot = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'civ-matrix-ai-diplomacy-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');

fs.writeFileSync(entry, `
  export {
    civAiProfileFor,
    resolveArchetypeAggression,
    resolveArchetypeTrade,
    nastawienieBazoweZaufanieDelta,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/civ-ai-data'))};
  export {
    loadCivMatrix,
    civMatrixParam,
    civMatrixParamAtDifficulty,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/civ-matrix'))};
  export { aiDiplomacyStance, initialRelation } from ${JSON.stringify(path.join(sourceRoot, 'game/diplomacy'))};
  export { startRelationForMajorPair } from ${JSON.stringify(path.join(sourceRoot, 'game/diplomacy-layers'))};
  export {
    civMatrixConsumerStatus,
    civMatrixConsumerEvidence,
    statusAllowsDefaultVisibility,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/civ-matrix-semantic'))};
`);

let M;
try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: graRoot,
    logLevel: 'silent',
  });
  M = require(bundle);
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
}

const matrix = JSON.parse(fs.readFileSync(path.join(graRoot, 'data/civ-matrix.json'), 'utf8'));
const civAiDataSource = fs.readFileSync(path.join(sourceRoot, 'game/civ-ai-data.ts'), 'utf8');
const diplomacySource = fs.readFileSync(path.join(sourceRoot, 'game/diplomacy.ts'), 'utf8');
const aiSource = fs.readFileSync(path.join(sourceRoot, 'game/ai.ts'), 'utf8');
const clusterStartSource = fs.readFileSync(path.join(sourceRoot, 'game/cluster-start.ts'), 'utf8');
const diplomacyLayersSource = fs.readFileSync(path.join(sourceRoot, 'game/diplomacy-layers.ts'), 'utf8');
const mainSource = fs.readFileSync(path.join(sourceRoot, 'main.ts'), 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}
function equal(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function near(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-9, `${message} (got ${actual}, want ${expected})`);
}

const scopedIds = Object.keys(matrix.paramDefs).filter(id => id.startsWith('ai_') || id.startsWith('dip_'));
const aiIds = scopedIds.filter(id => id.startsWith('ai_'));
const dipIds = scopedIds.filter(id => id.startsWith('dip_'));
const byId = Object.fromEntries(matrix.cywilizacje.map(row => [row.ikonaId, row]));
const unresolvedIds = ['dip_nastawienie_bazowe', 'dip_agresja_archetyp'];

console.log('--- exact scope and 30 unresolved cells ---');
equal(scopedIds.length, 16, 'scope contains exactly 16 AI/diplomacy parameters');
equal(aiIds.length, 8, 'scope contains 8 ai_* parameters');
equal(dipIds.length, 8, 'scope contains 8 dip_* parameters');
equal(matrix.cywilizacje.length, 15, 'matrix contains 15 civilization profiles');
for (const id of unresolvedIds) {
  equal(matrix.cywilizacje.filter(row => Object.prototype.hasOwnProperty.call(row.params, id)).length, 15,
    `${id} has an exact value in all 15 profiles`);
}
equal(matrix.cywilizacje.reduce((n, row) => n + unresolvedIds.filter(id => id in row.params).length, 0), 30,
  'the two unresolved parameters cover exactly 30 source cells');
equal(matrix.paramDefs.dip_nastawienie_bazowe.formula, 'add', 'base-attitude field keeps add formula');
equal(matrix.paramDefs.dip_nastawienie_bazowe.jednostka, 'absolut', 'base-attitude field keeps absolute unit');
equal(matrix.paramDefs.dip_agresja_archetyp.formula, 'mul_abs', 'archetype-aggression field keeps mul_abs formula');
equal(matrix.paramDefs.dip_agresja_archetyp.jednostka, 'ulamek_0_1', 'archetype-aggression field keeps fraction unit');

console.log('--- matrix adapters, precedence, and difficulty boundary ---');
const emptyData = {};
const greek = M.civAiProfileFor(emptyData, 'Grecy', 'normal');
const roman = M.civAiProfileFor(emptyData, 'Rzymianie', 'normal');
const unknown = M.civAiProfileFor(emptyData, 'not-a-civilization', 'normal');
assert(greek && roman && unknown === undefined, 'known profiles resolve from matrix and unknown civ stays undefined');
equal(greek.agresywnosc, byId.grecy.params.ai_agresywnosc, 'Greece AI aggression comes from matrix');
equal(roman.agresywnosc, byId.rzymianie.params.ai_agresywnosc, 'Rome AI aggression comes from matrix');
equal(M.civMatrixParam('not-a-civilization', 'dip_nastawienie_bazowe'), matrix.defaults.dip_nastawienie_bazowe,
  'unknown raw matrix lookup uses the explicit default, never Greece');
equal(M.civMatrixParamAtDifficulty('grecy', 'ai_agresywnosc', 'easy'), 3,
  'scale field changes by -1 at Easy');
equal(M.civMatrixParamAtDifficulty('grecy', 'ai_agresywnosc', 'hard'), 5,
  'scale field changes by +1 at Hard');
equal(M.civMatrixParamAtDifficulty('grecy', 'dip_nastawienie_bazowe', 'easy'), 59,
  'absolute base-attitude field is difficulty-neutral');
near(M.civMatrixParamAtDifficulty('grecy', 'dip_agresja_archetyp', 'easy'), 0.4,
  'fraction archetype-aggression field is difficulty-neutral');
near(M.nastawienieBazoweZaufanieDelta('grecy'), 4.5,
  'base-attitude helper computes half the matrix delta for Greece');
near(M.nastawienieBazoweZaufanieDelta('rzymianie'), -3,
  'base-attitude helper computes half the matrix delta for Rome');

console.log('--- accepted aggression consumer and unresolved aggression guard ---');
near(M.resolveArchetypeAggression('grecy', 0.99, undefined, 'normal'), 0.4,
  'accepted gameplay aggression resolver uses ai_agresywnosc for Greece');
near(M.resolveArchetypeAggression('rzymianie', 0.01, undefined, 'normal'), 0.75,
  'major aggression resolver uses dip_agresja_archetyp for Rome');
near(M.resolveArchetypeAggression('grecy', 0.99, undefined, 'easy'), 0.3,
  'easy retains the normalized -0.1 legacy difficulty offset');
near(M.resolveArchetypeAggression('grecy', 0.99, undefined, 'hard'), 0.5,
  'hard retains the normalized +0.1 legacy difficulty offset');
const relation = { zaufanie: 10, respekt: 80, status: 'neutralni' };
const context = { militaryRatio: 1.2, currentTurn: 10, turnsAtWar: 0, civMatrixDifficulty: 'normal' };
const stanceGreek = M.aiDiplomacyStance({ typCywilizacji: 'grecy' }, { typCywilizacji: 'rzymianie' }, relation, context);
const stanceInca = M.aiDiplomacyStance({ typCywilizacji: 'inkowie' }, { typCywilizacji: 'rzymianie' }, relation, context);
const stanceRoman = M.aiDiplomacyStance({ typCywilizacji: 'rzymianie' }, { typCywilizacji: 'grecy' }, relation, context);
const stanceAssyria = M.aiDiplomacyStance({ typCywilizacji: 'asyria' }, { typCywilizacji: 'grecy' }, relation, context);
assert(stanceGreek.willingnessWar !== stanceInca.willingnessWar,
  'war willingness follows the distinct matrix archetype aggression values');
assert(stanceRoman.willingnessWar !== stanceAssyria.willingnessWar,
  'war willingness follows distinct matrix values for Rome and Assyria');

console.log('--- pure helper versus live start path ---');
const greekRome = M.initialRelation({ typCywilizacji: 'grecy' }, { typCywilizacji: 'rzymianie' });
const greekChina = M.initialRelation({ typCywilizacji: 'grecy' }, { typCywilizacji: 'chinczycy' });
assert(greekRome.zaufanie !== greekChina.zaufanie,
  'pure initialRelation helper differs by matrix profile');
assert(clusterStartSource.includes("import { startRelationForMajorPair, startRelationForPair } from './diplomacy-layers';"),
  'cluster start imports the live startRelationForPair initializer');
assert(clusterStartSource.includes('startRelations.set(acceptedSlot.ownerId, startRelationForPair(acceptedSlot.isSameTypeRival));'),
  'cluster start stores startRelationForPair results, not initialRelation results');
assert(diplomacyLayersSource.includes('export function startRelationForPair(sameType: boolean): Relation'),
  'live start relation function is defined in diplomacy-layers');
assert(diplomacyLayersSource.includes('nastawienieBazoweZaufanieDelta'),
  'live major-pair start relation reads per-civilization base attitude');
assert(!clusterStartSource.includes('initialRelation('),
  'cluster start has no live initialRelation caller');
assert(!mainSource.includes('initialRelation('),
  'main runtime has no live initialRelation caller');
assert((diplomacySource.match(/\bexport function initialRelation\s*\(/g) || []).length === 1,
  'diplomacy source contains only the pure initialRelation definition');

console.log('--- existing trade consumer smoke check ---');
const tradeRelation = { zaufanie: 20, respekt: 80, status: 'neutralni' };
const tradeGreek = M.aiDiplomacyStance(
  { typCywilizacji: 'grecy' },
  { typCywilizacji: 'rzymianie' },
  tradeRelation,
  context,
);
const tradeInca = M.aiDiplomacyStance(
  { typCywilizacji: 'inkowie' },
  { typCywilizacji: 'rzymianie' },
  tradeRelation,
  context,
);
near(tradeGreek.willingnessTrade, 0.65,
  'existing matrix trade consumer keeps Greek runtime willingness');
near(tradeInca.willingnessTrade, 0.35,
  'existing matrix trade consumer keeps Inca runtime willingness');
assert(tradeGreek.willingnessTrade !== tradeInca.willingnessTrade,
  'existing matrix trade profiles remain behaviorally distinct');

console.log('--- live consumer guards ---');
const runtimeConsumerSources = [civAiDataSource, diplomacySource, aiSource, clusterStartSource, diplomacyLayersSource, mainSource];
assert(runtimeConsumerSources.some(source => source.includes('dip_agresja_archetyp')),
  'runtime aggression path consumes dip_agresja_archetyp');
assert(diplomacySource.includes('resolveArchetypeAggression('),
  'diplomacy stance calls the accepted aggression resolver');
assert(mainSource.includes('civAiProfileForTyp(data, aiTyp, difficulty)'),
  'main AI path reads the matrix profile per owner and difficulty');

const greekRomanStart = M.startRelationForMajorPair('grecy', 'rzymianie');
const romanGreekStart = M.startRelationForMajorPair('rzymianie', 'grecy');
equal(greekRomanStart.zaufanie, romanGreekStart.zaufanie,
  'major-pair start trust is symmetric');
equal(greekRomanStart.zaufanie, 20 + (59 - 50) / 2 + (44 - 50) / 2 - 5,
  'major-pair trust applies both matrix deltas and the existing different-type modifier');

console.log(`RESULT: ${passed} passed, ${failed} failed`);
fs.rmSync(tempRoot, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
