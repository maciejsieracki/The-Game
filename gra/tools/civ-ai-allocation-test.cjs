'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const out = path.join(os.tmpdir(), `the-game-civ-ai-allocation-${process.pid}.cjs`);
const entry = path.join(os.tmpdir(), `the-game-civ-ai-entry-${process.pid}.ts`);
fs.writeFileSync(entry, `
export {
  civAiAllocationFor,
  civAiImprovementAutomationPercentForOwner,
  improvementBudgetFromCumulativePool,
  isValidCivAiAllocationProfile,
} from ${JSON.stringify(path.resolve(__dirname, '..', 'src', 'game', 'civ-ai-allocation.ts'))};
export { pickAutoImprovements } from ${JSON.stringify(path.resolve(__dirname, '..', 'src', 'game', 'auto-improvements.ts'))};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  logLevel: 'silent',
});

let pass = 0;
let fail = 0;
function check(label, fn) {
  try {
    fn();
    pass += 1;
    console.log(`PASS: ${label}`);
  } catch (err) {
    fail += 1;
    console.error(`FAIL: ${label}: ${err.message}`);
  }
}

const api = require(out);
for (const difficulty of ['easy', 'normal', 'hard']) {
  check(`Grecy profile ${difficulty}`, () => {
    const profile = api.civAiAllocationFor('grecy', difficulty);
    assert.ok(profile);
    assert.equal(profile.workBuildingsPercent, 50);
    assert.equal(profile.workEmpirePoolPercent, 50);
    assert.equal(profile.sciencePercent, 60);
    assert.equal(profile.moneyPercent, 20);
    assert.equal(profile.wealthPercent, 20);
    assert.equal(profile.improvementAutomationPercent, 100);
    assert.equal(api.isValidCivAiAllocationProfile(profile), true);
  });
}

check('profile resolves the display-name alias', () => {
  assert.deepEqual(api.civAiAllocationFor('Grecy', 'normal'), api.civAiAllocationFor('grecy', 'normal'));
});
check('non-pilot civilization keeps its existing policy', () => {
  assert.equal(api.civAiAllocationFor('rzymianie', 'normal'), undefined);
  assert.equal(api.civAiAllocationFor(undefined, 'normal'), undefined);
});
for (const difficulty of ['easy', 'normal', 'hard']) {
  check(`AI owner roles use the full cumulative improvement pool on ${difficulty}`, () => {
    for (const ownerKind of ['major-ai', 'city-state', 'defensive-copy']) {
      assert.equal(
        api.civAiImprovementAutomationPercentForOwner(ownerKind, 'grecy', difficulty),
        100,
      );
    }
  });
}

check('player and hotseat owners keep the 33% automation policy', () => {
  assert.equal(api.civAiImprovementAutomationPercentForOwner('player', 'grecy', 'normal'), 33);
  assert.equal(api.civAiImprovementAutomationPercentForOwner('hotseat', 'grecy', 'normal'), 33);
  assert.equal(api.civAiImprovementAutomationPercentForOwner('major-ai', 'rzymianie', 'normal'), 100);
});

check('automation budget is calculated from the cumulative pool', () => {
  assert.equal(api.improvementBudgetFromCumulativePool(1000, 100), 1000);
  assert.equal(api.improvementBudgetFromCumulativePool(1000, 33), 330);
  assert.equal(api.improvementBudgetFromCumulativePool(999, 33), 329);
});

function makeFlatMap(width, height) {
  const hexes = {};
  for (let q = 0; q < width; q += 1) {
    for (let r = 0; r < height; r += 1) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: width, wysokoscR: height, hexes, seed: 42, riverPaths: [] };
}

check('picker consumes the owner envelope from the cumulative pool', () => {
  const map = makeFlatMap(20, 20);
  const city = { id: 'owner-city', ownerId: 7, q: 10, r: 10, population: 1 };
  const base = {
    cities: [city],
    ownerId: city.ownerId,
    map,
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }],
    placedImprovements: new Map(),
    pracaAvailable: 200,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
    maxItemsPerCity: 10,
  };
  const full = api.pickAutoImprovements({
    ...base,
    improvementBudgetCap: api.improvementBudgetFromCumulativePool(200, 100),
  });
  const playerEnvelope = api.pickAutoImprovements({
    ...base,
    improvementBudgetCap: api.improvementBudgetFromCumulativePool(200, 33),
  });
  const fullSpent = full.reduce((sum, pick) => sum + pick.kosztPraca, 0);
  const playerSpent = playerEnvelope.reduce((sum, pick) => sum + pick.kosztPraca, 0);
  assert(fullSpent > playerSpent, `100% owner envelope spends more than 33% (${fullSpent} > ${playerSpent})`);
  assert(fullSpent <= 200, `100% owner envelope stays within cumulative pool (${fullSpent} <= 200)`);
  assert(playerSpent <= 66, `33% player envelope stays within cumulative pool (${playerSpent} <= 66)`);
});

try { fs.unlinkSync(out); } catch (_) { /* best effort */ }
try { fs.unlinkSync(entry); } catch (_) { /* best effort */ }
if (fail > 0) {
  console.error(`FAILED: ${pass} passed, ${fail} failed`);
  process.exit(1);
}
console.log(`\n${pass}/${pass + fail} PASS`);
