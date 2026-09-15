'use strict';
/** Focused regression test: rejected cluster slots must not consume names. */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = '/tmp/cluster-plan-name-entry-q1.ts';
const bundle = '/tmp/cluster-plan-name-bundle-q1.cjs';
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '${GRA}/src/game/cluster-start';
export { buildClusterSpawnPlan } from '${GRA}/src/map/cluster-spawn';
export { generateMap } from '${GRA}/src/map/generator';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');
const pools = require('../data/city-names-pools.json');
const seed = 202;
const map = M.generateMap(50, 50, seed, 'kontynenty');
const raw = M.buildClusterSpawnPlan({
  map,
  civs,
  seed,
  playerTyp: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
  cityNamesPools: pools,
});
const plan = M.buildClusterStartPlan({
  map,
  civs,
  seed,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
  cityNamesPools: pools,
});

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`PASS: ${message}`);
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

for (const typ of ['rzymianie', 'inkowie']) {
  const rawSlots = raw.slots.filter(slot => slot.typ === typ);
  const liveIds = new Set(
    plan.aiStartHexes
      .filter(start => plan.aiOwnerCivMap.get(start.ownerId) === typ)
      .map(start => start.ownerId),
  );
  const rejected = rawSlots.filter(slot => !liveIds.has(slot.ownerId));
  const liveNames = plan.spawnCities
    .filter(city => liveIds.has(city.ownerId))
    .map(city => city.name);
  const expected = pools[typ].miasta_cywilizacji.slice(0, liveNames.length);
  const legacyNames = rawSlots
    .filter(slot => liveIds.has(slot.ownerId))
    .map(slot => slot.nazwaMiasta);

  assert(rejected.length > 0, `${typ}: seed ${seed} has a rejected slot`);
  assert(
    JSON.stringify(legacyNames) !== JSON.stringify(expected),
    `${typ}: regression reproducer differs before post-filter allocation`,
  );
  assert(
    JSON.stringify(liveNames) === JSON.stringify(expected),
    `${typ}: accepted slots consume common[0..] after collision filtering`,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
