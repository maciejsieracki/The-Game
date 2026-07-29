'use strict';
/** node tools/wonder-map-build-test.cjs — cuda na heksie mapy (nie kolejka miasta) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-map-build-entry.ts');
const bundle = path.join(__dirname, '.wonder-map-build-bundle.cjs');

fs.writeFileSync(entry, `
export {
  advanceWonderMapBuilds,
  ownerHasWonderBuildInProgress,
} from '../src/game/wonder-map-build';
export {
  listQualifyingWonderHexesForCity,
  listQualifyingWonderHexesForOwner,
} from '../src/map/wonder-placement';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('wonder-map-build-test\n');

// advanceWonderMapBuilds — postęp z puli Pracy
{
  const sites = [{ wonderId: 'kolos', q: 1, r: 2, ownerId: 0, postep: 0 }];
  const r1 = M.advanceWonderMapBuilds(sites, 0, 50, () => 100);
  assert(r1.pracaUsed === 50 && r1.sites[0].postep === 50, 'pour partial praca');
  const r2 = M.advanceWonderMapBuilds(r1.sites, 0, 60, () => 100);
  assert(r2.completed.length === 1 && r2.sites.length === 0, 'complete when postep >= koszt');
}

assert(
  M.ownerHasWonderBuildInProgress([{ wonderId: 'a', q: 0, r: 0, ownerId: 0, postep: 1 }], 0),
  'ownerHasWonderBuildInProgress true',
);
assert(
  !M.ownerHasWonderBuildInProgress([], 0, 'kolos'),
  'ownerHasWonderBuildInProgress false when empty',
);

// qualifying hexes — minimal map stub
{
  const map = {
    hexes: {
      '1,0': { coords: { q: 1, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak' },
      '2,0': { coords: { q: 2, r: 0 }, terenBazowy: 'morze', nakladka: 'brak' },
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak' },
    },
  };
  const hexes = M.listQualifyingWonderHexesForCity({
    map,
    city: { q: 0, r: 0, population: 5 },
    occupiedWonderHexes: [],
    cityHexes: [{ q: 0, r: 0 }],
  });
  assert(hexes.length === 1 && hexes[0].q === 1, 'qualifying hex adjacent land, not city center');
  assert(hexes.every(h => h.q !== 2), 'sea hex excluded');
}

console.log(`\n${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
