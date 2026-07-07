'use strict';
/** node gra/tools/law-garrison-test.cjs */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.law-garrison-entry.ts');
const BUNDLE = path.join(__dirname, '.law-garrison-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { countLawGarrisonOnCityHex } from '../src/game/armyMerge';
export { countLawGarrisonOnCityHex };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { countLawGarrisonOnCityHex } = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

const units = [
  { id: 'a', ownerId: 0, q: 3, r: 4, inGarnizon: false, oblegaCityId: undefined },
  { id: 'b', ownerId: 0, q: 3, r: 4, inGarnizon: true, oblegaCityId: undefined },
  { id: 'c', ownerId: 0, q: 3, r: 4, inGarnizon: false, oblegaCityId: 'x' },
  { id: 'd', ownerId: 1, q: 3, r: 4, inGarnizon: false },
  { id: 'e', ownerId: 0, q: 5, r: 5, inGarnizon: false },
];

assert(countLawGarrisonOnCityHex(units, 3, 4, 0) === 2, 'standing + hidden on city hex');
assert(countLawGarrisonOnCityHex(units, 3, 4, 0) !== 3, 'oblega excluded');
assert(countLawGarrisonOnCityHex(units, 5, 5, 0) === 1, 'single unit elsewhere');

console.log('law-garrison-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
