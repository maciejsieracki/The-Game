/**
 * scout-auto-explore-test.cjs — logika auto-zwiedzania zwiadowców.
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const bundlePath = path.join(__dirname, '.scout-auto-explore-bundle.cjs');

execSync(
  `npx esbuild src/game/scout-auto-explore.ts --bundle --platform=node --format=cjs --outfile=${JSON.stringify(bundlePath)}`,
  { cwd: root, stdio: 'pipe' },
);

const mod = require(bundlePath);
const {
  isScoutUnit,
  scoreHexForExplore,
  pickScoutExploreTarget,
  advanceScoutAutoExplore,
  runScoutsAutoExplore,
} = mod;

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

function makeMap() {
  const hexes = {};
  for (let q = 0; q < 8; q++) {
    for (let r = 0; r < 8; r++) {
      const key = `${q},${r}`;
      hexes[key] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: null,
        rzeka: { obecna: false },
      };
    }
  }
  return { szerokoscQ: 8, wysokoscR: 8, hexes };
}

function scout(q, r, ruchLeft = 3) {
  return {
    id: 'scout-1',
    ownerId: 0,
    typeId: 'Zwiadowca',
    category: 'zwiadowca',
    q,
    r,
    ruch: 3,
    ruchLeft,
  };
}

console.log('scout-auto-explore-test');

assert(isScoutUnit(scout(0, 0)), 'zwiadowca rozpoznawany');
assert(!isScoutUnit({ ...scout(0, 0), category: 'miecznik' }), 'wojownik nie jest zwiadowcą');

const map = makeMap();
const explored = new Set(['0,0', '1,0', '0,1']);
const sight = 2;

const edgeScore = scoreHexForExplore(2, 2, explored, map, sight);
const innerScore = scoreHexForExplore(1, 1, explored, map, sight);
assert(edgeScore > innerScore, 'heks przy mgle ma wyższy wynik niż w centrum odkrytym');

const unit = scout(1, 1, 3);
const target = pickScoutExploreTarget(unit, map, explored, new Set(), sight, () => 0.5);
assert(target !== null, 'wybiera cel w zasięgu');

const beforeQ = unit.q;
const beforeR = unit.r;
let stepCalls = 0;
const res = advanceScoutAutoExplore(
  unit,
  map,
  explored,
  [unit],
  sight,
  () => 0.42,
  () => { stepCalls++; },
);
assert(res.moved && (unit.q !== beforeQ || unit.r !== beforeR), 'zwiadowca zmienia pozycję');
assert(unit.ruchLeft < 3, 'zużywa punkty ruchu');
assert(stepCalls > 0 && stepCalls === res.steps, 'onAfterStep wywoływany po każdym kroku');

const u2 = scout(3, 3, 0);
assert(!advanceScoutAutoExplore(u2, map, explored, [u2], sight).moved, 'brak ruchu = brak ruchu');

const batch = runScoutsAutoExplore(
  [scout(1, 1, 2), { ...scout(4, 4, 2), id: 'scout-2', ownerId: 1 }],
  map,
  explored,
  0,
  () => 2,
  () => 0.33,
);
assert(batch.movedUnitIds.length >= 1, 'runScoutsAutoExplore porusza zwiadowcę gracza');
assert(batch.movedUnitIds.every(id => id !== 'scout-2'), 'nie rusza obcych zwiadowców');

console.log(`\nWynik: ${passed} OK, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
