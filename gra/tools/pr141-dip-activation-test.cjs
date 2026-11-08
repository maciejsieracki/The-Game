'use strict';
/** node tools/pr141-dip-activation-test.cjs — owner-approved DIP activation */
const assert = require('assert');
const esbuild = require('esbuild');
const fs = require('fs');
const os = require('os');
const path = require('path');

const gra = path.resolve(__dirname, '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-dip-activation-'));
const entry = path.join(scratch, 'entry.ts');
const bundle = path.join(scratch, 'bundle.cjs');
fs.writeFileSync(entry, `
  export { buildClusterStartPlan } from ${JSON.stringify(path.join(gra, 'src/game/cluster-start'))};
  export { buildSameTypeRivalSlots } from ${JSON.stringify(path.join(gra, 'src/game/cluster-start'))};
  export { generateMap } from ${JSON.stringify(path.join(gra, 'src/map/generator'))};
  export { startRelationForMajorPair, startRelationForPair, majorPairStartTrust } from ${JSON.stringify(path.join(gra, 'src/game/diplomacy-layers'))};
  export { applyWiarygodnoscD4ToRelation } from ${JSON.stringify(path.join(gra, 'src/game/diplomacy-layers'))};
  export { resolveArchetypeAggression, resolveArchetypeAggressionWithDifficulty } from ${JSON.stringify(path.join(gra, 'src/game/civ-ai-data'))};
`);
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' },
    outfile: bundle, absWorkingDir: gra, logLevel: 'silent',
  });
  const M = require(bundle);
  const civs = require(path.join(gra, 'data/civs.json'));
  const cityNamesPools = require(path.join(gra, 'data/city-names-pools.json'));
  const matrix = require(path.join(gra, 'data/civ-matrix.json'));
  const byCiv = new Map(matrix.cywilizacje.map(row => [row.ikonaId, row.params.dip_nastawienie_bazowe]));
  const base = require(path.join(gra, 'data/diplomacy.json')).params;

  const pairTrust = (a, b) => {
    const sameType = a === b;
    const modifier = sameType ? base.rywalizacjaTenSamTyp_zaufanie : base.roznicaKulturowa_zaufanie;
    return M.startRelationForMajorPair(a, b).zaufanie;
  };
  const expected = (a, b) => Math.max(0, Math.min(100,
    base.startZaufanie + (byCiv.get(a) - 50) / 2 + (byCiv.get(b) - 50) / 2 +
    (a === b ? base.rywalizacjaTenSamTyp_zaufanie : base.roznicaKulturowa_zaufanie)));
  assert.equal(pairTrust('grecy', 'rzymianie'), expected('grecy', 'rzymianie'), 'different-type pair applies both matrix deltas and current modifier');
  assert.equal(pairTrust('grecy', 'rzymianie'), pairTrust('rzymianie', 'grecy'), 'pair formula is symmetric');
  assert.equal(pairTrust('zulusi', 'zulusi'), expected('zulusi', 'zulusi'), 'same-type pair uses the current rivalry modifier');
  assert.equal(M.startRelationForMajorPair('zulusi', 'zulusi').zaufanie, 0, 'low same-type inputs clamp at zero');
  assert.equal(M.majorPairStartTrust(base.startZaufanie, 75, 75, -5), 100,
    'high pair inputs clamp at one hundred');

  const map = M.generateMap(50, 50, 4242, 'kontynenty');
  const plan = M.buildClusterStartPlan({
    map, civs, seed: 4242,
    playerCivId: 'grecy', secondHumanCivId: 'rzymianie', humanDistanceMode: 'losowo',
    rywaleNaKlaster: 2, aktywneTypy: 5, cityNamesPools,
  });
  assert(plan.secondPlayerOwnerId !== null, 'second human seat is present in the plan');
  const majors = new Map([[0, 'grecy'], [plan.secondPlayerOwnerId, 'rzymianie']]);
  for (const ownerId of plan.clusterCapitalOwnerIds) majors.set(ownerId, plan.aiOwnerCivMap.get(ownerId));
  const expectedPairKeys = new Set();
  const key = (a, b) => a < b ? `${a}_${b}` : `${b}_${a}`;
  const ids = [...majors.keys()];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) expectedPairKeys.add(key(ids[i], ids[j]));
  const actualPairKeys = new Set(plan.majorPairStartRelations.map(pair => key(pair.ownerA, pair.ownerB)));
  assert.deepEqual(actualPairKeys, expectedPairKeys, 'live cluster plan contains every major-owner pair exactly once');
  assert(plan.majorPairStartRelations.some(pair => pair.ownerA !== 0 && pair.ownerA !== plan.secondPlayerOwnerId && pair.ownerB !== 0 && pair.ownerB !== plan.secondPlayerOwnerId),
    'plan includes at least one AI-to-AI pair');
  assert(plan.majorPairStartRelations.some(pair => pair.ownerA === plan.secondPlayerOwnerId || pair.ownerB === plan.secondPlayerOwnerId),
    'plan includes second-human-seat pairs');
  assert(plan.typCityCopyOwners.size > 0, 'deterministic plan includes a concrete foreign-type city-state copy');
  for (const pair of plan.majorPairStartRelations) {
    assert(!plan.simplifiedDiplomacyOwners.has(pair.ownerA) && !plan.simplifiedDiplomacyOwners.has(pair.ownerB), 'city-state/minor owners are excluded');
    assert(!plan.typCityCopyOwners.has(pair.ownerA) && !plan.typCityCopyOwners.has(pair.ownerB), 'non-capital city copies are excluded');
    const actual = pair.relation.zaufanie;
    assert.equal(actual, expected(majors.get(pair.ownerA), majors.get(pair.ownerB)), 'planned pair uses its two civ values and current type modifier');
  }
  // Same-type city-states are deferred by buildClusterStartPlan until after
  // world initialization. Materialize one using the production slot builder
  // and register it as the real deferred-spawn path does, so the fixture has
  // a concrete nonempty simplified/minor owner set as well as type copies.
  assert(plan.pendingSameTypeRivalOwnerIds.length > 0 && plan.pendingSameTypeRivalHexes.length > 0,
    'deterministic plan reserves a deferred same-type city-state slot');
  const cityStateSlot = M.buildSameTypeRivalSlots(
    map, civs, plan.playerStartHex, 'grecy', 1, 4242,
    plan.pendingSameTypeRivalOwnerIds[0], cityNamesPools,
  )[0];
  assert(cityStateSlot, 'production builder materializes the deferred city-state fixture');
  const cityStateOwner = cityStateSlot.ownerId;
  plan.simplifiedDiplomacyOwners.add(cityStateOwner);
  plan.aiOwnerCivMap.set(cityStateOwner, cityStateSlot.typ);
  plan.startRelations.set(cityStateOwner, M.startRelationForPair(true));
  assert(plan.simplifiedDiplomacyOwners.has(cityStateOwner), 'fixture contains an explicit real city-state/minor owner');
  const cityCopyOwner = [...plan.typCityCopyOwners][0];
  assert(cityCopyOwner !== undefined, 'fixture contains a separate foreign-type copy owner');
  assert(!plan.majorPairStartRelations.some(pair => pair.ownerA === cityStateOwner || pair.ownerB === cityStateOwner),
    'deferred city-state owner has no major-pair entry');
  assert(!plan.majorPairStartRelations.some(pair => pair.ownerA === cityCopyOwner || pair.ownerB === cityCopyOwner),
    'foreign-type copy owner has no major-pair entry');

  // Execute the exact bounded initialization loop extracted from main.ts. The
  // fixture setter models only the existing symmetric store boundary; D4 itself
  // is the production helper, so this covers the live consumer without booting
  // the world or invoking renderer/UI behavior.
  const mainSource = fs.readFileSync(path.join(gra, 'src/main.ts'), 'utf8');
  const marker = '// R-PR141-CODEX-DIP-ACTIVATION-Q2: overwrite/extend the legacy';
  const markerAt = mainSource.indexOf(marker);
  const loopAt = mainSource.indexOf('for (const pair of plan.majorPairStartRelations)', markerAt);
  const loopEnd = mainSource.indexOf('\n      // Model B (Maciej 2026-07-09)', loopAt);
  assert(markerAt >= 0 && loopAt > markerAt && loopEnd > loopAt, 'main pair initializer source is extractable');
  const executeMainPairInitializer = new Function(
    'plan', 'setDiploRelation', 'applyWiarygodnoscD4ToRelation', 'getWiarygodnosc',
    mainSource.slice(loopAt, loopEnd),
  );
  const pairStore = new Map();
  const setterCalls = [];
  const d4Calls = [];
  const storeKey = (a, b) => a < b ? `${a}_${b}` : `${b}_${a}`;
  const seededMajor = plan.clusterCapitalOwnerIds[0];
  assert(seededMajor !== undefined, 'fixture has a major owner');
  pairStore.set(storeKey(0, seededMajor), { zaufanie: 99, respekt: 77, status: 'neutralni' });
  pairStore.set(storeKey(0, cityStateOwner), { zaufanie: 73, respekt: 66, status: 'pokoj' });
  pairStore.set(storeKey(0, cityCopyOwner), { zaufanie: 62, respekt: 54, status: 'neutralni' });
  const setFixtureRelation = (a, b, relation) => {
    const key = storeKey(a, b);
    setterCalls.push({ a, b, key, relation });
    pairStore.set(key, relation);
  };
  const credibilityByOwner = new Map([...majors.keys()].map(ownerId => [ownerId, 20]));
  const applyD4 = (relation, credA, credB) => {
    d4Calls.push({ relation, credA, credB });
    return M.applyWiarygodnoscD4ToRelation(relation, credA, credB);
  };
  executeMainPairInitializer(
    plan,
    setFixtureRelation,
    applyD4,
    ownerId => credibilityByOwner.get(ownerId) ?? 20,
  );
  assert.equal(setterCalls.length, expectedPairKeys.size, 'actual main loop writes every major pair exactly once');
  assert.equal(d4Calls.length, expectedPairKeys.size, 'actual main loop applies D4 exactly once per pair');
  assert.deepEqual(new Set(setterCalls.map(call => call.key)), expectedPairKeys, 'actual main loop uses the canonical pair store keys');
  for (const pair of plan.majorPairStartRelations) {
    const expectedRelation = M.applyWiarygodnoscD4ToRelation(pair.relation, 20, 20);
    const actualRelation = pairStore.get(storeKey(pair.ownerA, pair.ownerB));
    assert.deepEqual(actualRelation, expectedRelation, 'actual store value uses fresh pair base plus one production D4 application');
  }
  assert.notEqual(pairStore.get(storeKey(0, seededMajor)).zaufanie, 99, 'fresh major-pair initialization replaces the old primary-only seed');
  assert.deepEqual(pairStore.get(storeKey(0, cityStateOwner)), { zaufanie: 73, respekt: 66, status: 'pokoj' },
    'actual major-pair loop does not clobber the concrete same-type city-state relation');
  assert.deepEqual(pairStore.get(storeKey(0, cityCopyOwner)), { zaufanie: 62, respekt: 54, status: 'neutralni' },
    'actual major-pair loop does not clobber a separate foreign-type city-state copy relation');

  const aggression = (civ, difficulty) => M.resolveArchetypeAggression(civ, 0.42, undefined, difficulty);
  const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 1e-9, `${label}: got ${actual}, expected ${expected}`);
  near(aggression('grecy', 'easy'), 0.3, 'Easy transfers normalized -0.1 difficulty delta to archetype base');
  near(aggression('grecy', 'normal'), 0.4, 'Normal uses archetype base unchanged');
  near(aggression('grecy', 'hard'), 0.5, 'Hard transfers normalized +0.1 difficulty delta to archetype base');
  assert.equal(aggression('zulusi', 'hard'), 1, 'aggression clamps upper bound after difficulty offset');
  for (const [baseValue, expectedValues] of [[0, [0, 0, 0.1]], [0.4, [0.3, 0.4, 0.5]], [1, [0.9, 1, 1]]]) {
    const observed = [3, 4, 5].map(value => M.resolveArchetypeAggressionWithDifficulty(baseValue, 4, value));
    observed.forEach((value, index) => near(value, expectedValues[index],
      `difficulty offsets and clamps cover archetype base ${baseValue}, slot ${index}`));
  }
  assert.equal(aggression('grecy', 'normal'), 0.4, 'caller fallback does not replace a major matrix row');
  assert.equal(aggression('not-a-civ', 'normal'), 0.42, 'missing/non-major row preserves caller fallback');
  console.log('PASS: PR141 DIP activation consumer and all-major-pairs contract');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
