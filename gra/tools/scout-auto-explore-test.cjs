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
  clearScoutAutoExplore,
  scoreHexForExplore,
  scoreMarginalReveal,
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

function makeMap(extraHexes = {}) {
  const hexes = {};
  for (let q = 0; q < 8; q++) {
    for (let r = 0; r < 8; r++) {
      const key = `${q},${r}`;
      hexes[key] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: null,
        rzeka: { obecna: false },
        wioska: { istnieje: false, ludnosc: 0 },
        wlasciciel: null,
        ...extraHexes[key],
      };
    }
  }
  return { szerokoscQ: 8, wysokoscR: 8, hexes };
}

function scout(q, r, ruchLeft = 3, extra = {}) {
  return {
    id: 'scout-1',
    ownerId: 0,
    typeId: 'Zwiadowca',
    category: 'zwiadowca',
    q,
    r,
    ruch: 3,
    ruchLeft,
    ...extra,
  };
}

console.log('scout-auto-explore-test');

assert(isScoutUnit(scout(0, 0)), 'zwiadowca rozpoznawany');
assert(!isScoutUnit({ ...scout(0, 0), category: 'miecznik', typeId: 'Wojownik' }), 'wojownik nie jest zwiadowcą');
assert(
  isScoutUnit({ ...scout(0, 0), category: 'miecznik', typeId: 'Zwiadowca' }),
  'isScoutUnit po typeId Zwiadowca',
);

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

// runScoutsAutoExplore: tylko autoExplore=true
const offScout = scout(1, 1, 2, { id: 'scout-off', autoExplore: false });
const onScout = scout(4, 4, 2, { id: 'scout-on', autoExplore: true });
const foreign = { ...scout(5, 5, 2), id: 'scout-2', ownerId: 1, autoExplore: true };
const batch = runScoutsAutoExplore(
  [offScout, onScout, foreign],
  map,
  explored,
  0,
  () => 2,
  () => 0.33,
);
assert(batch.movedUnitIds.length >= 1, 'runScoutsAutoExplore porusza zwiadowcę gracza');
assert(batch.movedUnitIds.includes('scout-on'), 'rusza tylko autoExplore=true');
assert(!batch.movedUnitIds.includes('scout-off'), 'nie rusza bez autoExplore');
assert(batch.movedUnitIds.every(id => id !== 'scout-2'), 'nie rusza obcych zwiadowców');

// sentry pomijany w runScoutsAutoExplore
const sentryScout = scout(2, 2, 2, { id: 'scout-sentry', autoExplore: true, sentry: true });
const batchSentry = runScoutsAutoExplore(
  [sentryScout],
  map,
  explored,
  0,
  () => 2,
  () => 0.33,
);
assert(batchSentry.movedUnitIds.length === 0, 'sentry=true pomijany mimo autoExplore');

// clearScoutAutoExplore — po wyłączeniu jednostka nie w puli runScoutsAutoExplore
const autoScout = scout(2, 2, 2, { id: 'scout-clear', autoExplore: true });
assert(clearScoutAutoExplore(autoScout) === true, 'clearScoutAutoExplore zwraca true gdy było włączone');
assert(autoScout.autoExplore === false, 'clearScoutAutoExplore ustawia autoExplore=false');
assert(clearScoutAutoExplore(autoScout) === false, 'clearScoutAutoExplore idempotentne');
const batchAfterClear = runScoutsAutoExplore(
  [autoScout],
  map,
  explored,
  0,
  () => 2,
  () => 0.33,
);
assert(batchAfterClear.movedUnitIds.length === 0, 'po clearScoutAutoExplore brak w puli auto-explore');
assert(!clearScoutAutoExplore({ ...scout(0, 0), category: 'miecznik', typeId: 'Wojownik', autoExplore: true }),
  'clearScoutAutoExplore ignoruje nie-zwiadowca');

// widoczna wioska wygrywa z samym fog score
const villageMap = makeMap({
  '3,1': {
    wioska: { istnieje: true, ludnosc: 1 },
    wlasciciel: null,
  },
});
const villageScout = scout(1, 1, 3);
const villageExplored = new Set(['0,0', '1,0', '0,1', '1,1', '2,1', '3,1']);
const villageTarget = pickScoutExploreTarget(
  villageScout,
  villageMap,
  villageExplored,
  new Set(),
  3,
  () => 0,
);
assert(villageTarget !== null && villageTarget.q === 3 && villageTarget.r === 1,
  'odkryta wioska wygrywa z fog score');

// znana chatka poza widokiem i poza zasięgiem MP — NIE priorytet (R-SCOUT-BLACK-MAX Q2=A)
const farVillageMap = makeMap({
  '6,1': {
    wioska: { istnieje: true, ludnosc: 1 },
    wlasciciel: null,
  },
});
const farScout = scout(1, 1, 2);
const farExplored = new Set();
for (let q = 0; q < 8; q++) {
  for (let r = 0; r < 8; r++) farExplored.add(`${q},${r}`);
}
const farTarget = pickScoutExploreTarget(
  farScout,
  farVillageMap,
  farExplored,
  new Set(),
  1,
  () => 0,
);
assert(
  farTarget === null || farTarget.q !== 6 || farTarget.r !== 1,
  'odkryta chatka poza widokiem i MP nie jest celem',
);

// chatka na krawędzi mgły: odkryta, poza sight i poza MP — nie cel
const edgeVillageMap = makeMap({
  '5,5': {
    wioska: { istnieje: true, ludnosc: 1 },
    wlasciciel: null,
  },
});
const edgeScout = scout(1, 1, 3);
const edgeExplored = new Set(['0,0', '1,0', '0,1', '1,1', '2,1', '5,5']);
const edgeTarget = pickScoutExploreTarget(
  edgeScout,
  edgeVillageMap,
  edgeExplored,
  new Set(),
  2,
  () => 0,
);
assert(
  edgeTarget === null || edgeTarget.q !== 5 || edgeTarget.r !== 5,
  'odkryta chatka poza sight i MP nie wygrywa z eksploracją czerni',
);

// marginal reveal: krok do przodu ujawnia więcej czerni niż do tyłu
const forwardMap = makeMap();
const forwardExplored = new Set(['1,1', '0,1', '1,0', '2,1', '1,2']);
const forwardScout = scout(1, 1, 1);
const forwardGain = scoreMarginalReveal(1, 1, 2, 1, forwardExplored, forwardMap, 2);
const backwardGain = scoreMarginalReveal(1, 1, 0, 1, forwardExplored, forwardMap, 2);
assert(forwardGain > 0 && backwardGain === 0, 'marginal reveal: przód > 0, tył = 0');
const forwardPick = pickScoutExploreTarget(
  forwardScout,
  forwardMap,
  forwardExplored,
  new Set(),
  2,
  () => 0,
);
assert(
  forwardPick !== null && forwardPick.q === 2 && forwardPick.r === 1,
  'krok z max nowych czarnych wybiera przód (2,1) zamiast tyłu',
);

// po zebraniu chatki — wraca do max czerni
const postHutMap = makeMap({
  '2,1': {
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  },
});
const postHutExplored = new Set(['1,1', '0,1', '1,0', '2,1']);
const postHutScout = scout(1, 1, 1);
const postHutTarget = pickScoutExploreTarget(
  postHutScout,
  postHutMap,
  postHutExplored,
  new Set(),
  2,
  () => 0,
);
assert(
  postHutTarget !== null && postHutTarget.q === 2 && postHutTarget.r === 1,
  'po zebranej chatce wraca do max nowych czarnych',
);

console.log(`\nWynik: ${passed} OK, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
