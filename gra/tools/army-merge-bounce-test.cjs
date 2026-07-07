'use strict';
/** node gra/tools/army-merge-bounce-test.cjs */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.army-merge-bounce-entry.ts');
const BUNDLE = path.join(__dirname, '.army-merge-bounce-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { findBounceHexFromOrigin, assignBounceHexesForUnits } from '../src/game/armyMerge';
export { findBounceHexFromOrigin, assignBounceHexesForUnits };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { findBounceHexFromOrigin, assignBounceHexesForUnits } = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

const units = [
  { id: 'stay', ownerId: 0, q: 5, r: 5 },
  { id: 'move', ownerId: 0, q: 5, r: 5 },
];

const land = new Set(['4,5', '5,5', '6,5', '5,4']);
const isLand = (q, r) => land.has(q + ',' + r);

// Origin wolny, ląd OK
let b = findBounceHexFromOrigin(units, 4, 5, 'move', isLand);
assert(b && b.q === 4 && b.r === 5, 'bounce to free origin on land');

// Origin zajęty — tylko jeden sąsiad lądu (4,5); morze/wybrzeże poza zbiorem
const land2 = new Set(['4,5', '5,5']);
const isLand2 = (q, r) => land2.has(q + ',' + r);
b = findBounceHexFromOrigin(units, 5, 5, 'move', isLand2);
assert(b && b.q === 4 && b.r === 5, 'bounce to only land neighbor, got ' + (b ? b.q + ',' + b.r : 'null'));

const multi = assignBounceHexesForUnits(
  [
    { id: 'a', ownerId: 0, q: 5, r: 5 },
    { id: 'b', ownerId: 0, q: 5, r: 5 },
    { id: 'stay', ownerId: 0, q: 5, r: 5 },
  ],
  4,
  5,
  ['a', 'b'],
  isLand,
);
const bSpot = multi.get('b');
assert(multi.get('a')?.q === 4 && multi.get('a')?.r === 5, 'multi bounce a -> 4,5');
assert(bSpot != null && !(bSpot.q === 4 && bSpot.r === 5), 'multi bounce b -> inny heks');

console.log('army-merge-bounce-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
