'use strict';
/** node gra/tools/terrain-hill-movement-test.cjs — wzgórza przejezdne, MIN-MOVE na trasie */
const esbuild = require('esbuild');
const nodePath = require('path');

const BUNDLE = nodePath.join(__dirname, '.terrain-hill-movement-bundle.cjs');

esbuild.buildSync({
  entryPoints: [nodePath.join(__dirname, '.terrain-hill-movement-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  terrainMoveCost,
  configureTerrainMovement,
  computeReachable,
  computePath,
  pathCost,
  truncatePathToBudget,
  executeMarchStep,
  TerenBazowy,
  Nakladka,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

const hill = { terenBazowy: TerenBazowy.Wzgorza, nakladka: Nakladka.Brak };
const hillForest = { terenBazowy: TerenBazowy.Wzgorza, nakladka: Nakladka.Las };
const mountain = { terenBazowy: TerenBazowy.Gory, nakladka: Nakladka.Brak };
const plain = { terenBazowy: TerenBazowy.Rownina, nakladka: Nakladka.Brak };

ok(terrainMoveCost(hill) === 2, 'wzgórze koszt 2');
ok(terrainMoveCost(hillForest) === 3, 'wzgórze+las koszt 3 (2+1)');
ok(terrainMoveCost(mountain) === Infinity, 'góry nieprzejezdne');

configureTerrainMovement(
  { Laka: 1, Wzgorza: 2, Gory: 99, Morse: 99 },
  1,
);
ok(terrainMoveCost(hill) === 2, 'configureTerrainMovement: Wzgorza z JSON');
ok(terrainMoveCost(mountain) === Infinity, 'configureTerrainMovement: Gory=99 → Infinity');

const map = {
  hexes: {
    '0,0': plain,
    '1,0': hillForest,
    '2,0': plain,
    '3,0': plain,
  },
};

const unit = {
  id: 'u1',
  ownerId: 0,
  q: 0,
  r: 0,
  ruch: 2,
  ruchLeft: 2,
  typeId: 'zwiadowca',
  category: 'zwiadowca',
};

const occ = new Set();
const reach = computeReachable(unit, map, occ);
ok(reach.has('1,0'), 'MIN-MOVE: wzgórze+las w zasięgu przy 2 MP');

const route = computePath(unit, map, 2, 0, occ);
ok(route.length === 2, 'trasa przez wzgórze istnieje');

const truncated = truncatePathToBudget(route, 2, map);
ok(truncated.length === 1 && truncated[0].q === 1, 'truncate MIN-MOVE: 1. hex wzgórza przy budżet 2');

const step = executeMarchStep(
  unit,
  { destQ: 2, destR: 0 },
  map,
  occ,
  2,
  () => true,
  2,
);
ok(step.ok && step.movePath.length === 1 && step.movePath[0].q === 1,
  'executeMarchStep: segment na wzgórze+las przy 2 MP');

const mountainMap = {
  hexes: {
    '0,0': plain,
    '1,0': mountain,
    '2,0': plain,
  },
};
const mPath = computePath(unit, mountainMap, 2, 0, occ);
ok(mPath.length === 0, 'góry na trasie blokują pathfinding (nie cel)');

console.log('terrain-hill-movement-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
