'use strict';
/**
 * Focused regression gate for R-MIASTA-KOLONIA-NAZWA-POOL-Q1.
 * Run from gra/: node tools/difficulty-bonus-city-name-test.cjs
 *
 * The source assertions pin the exact hard-AI bonus-city wiring; the allocator
 * assertions exercise the same first-free pool helper used by that wiring.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const bonusStart = mainTs.indexOf('function grantDifficultyStartBonusesForMajorCapital');
const bonusEnd = mainTs.indexOf('function spawnPendingForeignClusters', bonusStart);
if (bonusStart < 0 || bonusEnd < 0) {
  throw new Error('bonus-city function boundary not found');
}
const bonusBlock = mainTs.slice(bonusStart, bonusEnd);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'difficulty-bonus-city-name-'));
const entry = path.join(tempDir, 'entry.ts');
const bundle = path.join(tempDir, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAiFoundCityName } from ${JSON.stringify(path.join(GRA, 'src', 'game', 'city-names-pool.ts'))};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
const { pickAiFoundCityName } = require(bundle);
const pools = require(path.join(GRA, 'data', 'city-names-pools.json'));
const grecy = pools.grecy.miasta_cywilizacji;

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('PASS:', message);
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}

console.log('difficulty-bonus-city-name-test\n');

assert(
  /const extraName = pickAiFoundCityName\(/.test(bonusBlock),
  'hard-AI bonus city takes its name through pickAiFoundCityName',
);
assert(
  !/capitalName\s*\+\s*['"]\s*— kolonia/.test(bonusBlock),
  'bonus call site does not construct the old capital — kolonia label',
);
assert(
  !/extra\.nameSuffix/.test(bonusBlock),
  'bonus call site does not append the legacy special suffix',
);

const civTypeForOwner = (ownerId) => ownerId === 7 ? 'grecy' : 'rzymianie';
const cities = [{ ownerId: 7, name: grecy[0] }];
const firstBonusName = pickAiFoundCityName(
  pools,
  'grecy',
  cities,
  civTypeForOwner,
  7,
);
assert(firstBonusName === grecy[1], `first unused regular name = ${grecy[1]}`);

cities.push({ ownerId: 7, name: firstBonusName });
const secondBonusName = pickAiFoundCityName(
  pools,
  'grecy',
  cities,
  civTypeForOwner,
  7,
);
assert(secondBonusName === grecy[2], `second bonus city advances to ${grecy[2]}`);
assert(new Set([grecy[0], firstBonusName, secondBonusName]).size === 3, 'successive bonus names are unique');

const exhausted = pickAiFoundCityName(
  pools,
  'grecy',
  grecy.map(name => ({ ownerId: 7, name })),
  civTypeForOwner,
  7,
);
assert(exhausted === `${grecy[0]} II`, `pool exhaustion uses regular suffix fallback = ${exhausted}`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
