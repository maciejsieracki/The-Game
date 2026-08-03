/**
 * triumph-city-state-test.cjs — triumf po zjednoczeniu miast-państw (P-TRIUMPH-CS-Q1=B).
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const bundlePath = path.join(__dirname, '.triumph-city-state-bundle.cjs');

execSync(
  `npx esbuild src/game/triumph-city-state.ts --bundle --platform=node --format=cjs --outfile=${JSON.stringify(bundlePath)}`,
  { cwd: root, stdio: 'pipe' },
);

const {
  countCitiesForOwner,
  shouldShowPlayerTriumphCityStateUnification,
  buildTriumphCityStateUnificationMessage,
  TRIUMPH_CS_HINT_MS,
} = require(bundlePath);

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  OK:', msg);
  } else {
    failed++;
    console.error('  FAIL:', msg);
  }
}

const typCopy = new Set([2, 3, 5]);
const civMap = new Map([
  [2, 'grecy'],
  [3, 'grecy'],
  [5, 'rzymianie'],
]);

function baseInput(overrides = {}) {
  return {
    newOwner: 0,
    oldOwner: 2,
    playerCivKey: 'grecy',
    typCityCopyOwners: typCopy,
    aiOwnerCivMap: civMap,
    cities: [
      { ownerId: 0 },
      { ownerId: 0 },
    ],
    ...overrides,
  };
}

assert(countCitiesForOwner(0, [{ ownerId: 0 }, { ownerId: 0 }, { ownerId: 1 }]) === 2, 'countCitiesForOwner');

assert(
  shouldShowPlayerTriumphCityStateUnification(baseInput()),
  'triumf gdy ostatnie greckie MP padło, siostra 3 bez miast',
);

assert(
  !shouldShowPlayerTriumphCityStateUnification(baseInput({ newOwner: 1 })),
  'brak triumfu gdy zdobywca nie gracz',
);

assert(
  !shouldShowPlayerTriumphCityStateUnification(baseInput({ oldOwner: 9 })),
  'brak triumfu gdy oldOwner nie typ-copy',
);

assert(
  !shouldShowPlayerTriumphCityStateUnification(baseInput({
    oldOwner: 5,
    cities: [{ ownerId: 0 }],
  })),
  'brak triumfu gdy inna cywilizacja (rzymianie)',
);

assert(
  !shouldShowPlayerTriumphCityStateUnification(baseInput({
    cities: [{ ownerId: 0 }, { ownerId: 3 }],
  })),
  'brak triumfu gdy siostra 3 nadal ma miasto',
);

const msg = buildTriumphCityStateUnificationMessage('Grecy', 'Sparta');
assert(msg.includes('TRIUMF'), 'komunikat zawiera TRIUMF');
assert(msg.includes('Sparta'), 'komunikat zawiera nazwę miasta');
assert(msg.includes('Grecy'), 'komunikat zawiera etykietę cywilizacji');
assert(TRIUMPH_CS_HINT_MS >= 9000 && TRIUMPH_CS_HINT_MS <= 10000, 'czas hintu 9–10 s');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
