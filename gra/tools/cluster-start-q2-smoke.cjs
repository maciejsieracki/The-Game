'use strict';
/** MAP-SPAWN-Q2 smoke — rdzeń + nowe scenariusze (bez Super Huge). */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.cluster-start-q2-smoke-entry.ts');
const bundle = path.join(__dirname, '.cluster-start-q2-smoke-bundle.cjs');

fs.writeFileSync(entry, `
export { computeClusters, groupHabitableMasses, allocateTypyToMasses, massTypeCap, developmentSpaceScore, MIN_MASS_HEXES_FOR_SPAWN, MIN_DEVELOPMENT_HEX_PER_CIV, SMALL_MASS_CAP_THRESHOLD } from '../src/map/clusters';
export { hexDistanceAxial } from '../src/map/gen-helpers';
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
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

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

function fillSea(hexes, minQ, maxQ, minR, maxR) {
  for (let q = minQ; q <= maxQ; q++) {
    for (let r = minR; r <= maxR; r++) {
      const k = q + ',' + r;
      if (!hexes[k]) hexes[k] = { coords: { q, r }, terenBazowy: 'morze' };
    }
  }
}

function makeTwoMass() {
  const hexes = {};
  for (let q = 10; q < 30; q++) {
    for (let r = 10; r < 30; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
    }
  }
  for (let q = 50; q < 53; q++) {
    for (let r = 50; r < 55; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
    }
  }
  fillSea(hexes, 0, 60, 0, 60);
  return { hexes };
}

console.log('cluster-start-q2-smoke\n');

assert(M.MIN_MASS_HEXES_FOR_SPAWN === 60, 'MIN_MASS_HEXES_FOR_SPAWN=60');
assert(M.massTypeCap(50) === 1, 'cap małej masy=1');

const synth = makeTwoMass();
const land = Object.values(synth.hexes)
  .filter(h => h.terenBazowy === 'laka')
  .map(h => ({ q: h.coords.q, r: h.coords.r }));
const masses = M.groupHabitableMasses(land);
const alloc = M.allocateTypyToMasses(3, masses);
assert(alloc[1] === 0, 'mała wyspa alloc=0');
assert(alloc[0] >= 2, 'kontynent alloc>=2');

const pl = M.computeClusters(synth, { seed: 9999, aktywneTypy: 5, rywaleNaKlaster: 2 });
function countOnMass(mi, centers) {
  let n = 0;
  for (const c of centers) {
    for (const h of masses[mi]) {
      if (M.hexDistanceAxial(h.q, h.r, c.q, c.r) <= 2) { n++; break; }
    }
  }
  return n;
}
assert(countOnMass(1, pl.klastry.map(k => k.centrum)) === 0, '0 środków na wyspie');

const pangea = { hexes: {} };
for (let q = 0; q < 40; q++) {
  for (let r = 0; r < 40; r++) {
    pangea.hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
  }
}
const pm = M.computeClusters(pangea, { seed: 5555, aktywneTypy: 6, rywaleNaKlaster: 3 });
assert(pm.klastry.length >= 5, 'Pangea >=5 klastrów');

const map = M.generateMap(50, 50, 4242, 'kontynenty');
const plan = M.buildClusterStartPlan({
  map, civs, seed: 4242, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5,
});
assert(plan.playerStartCityName === 'Ateny', 'stolica gracza Ateny');
assert(plan.foreignTypeClusters.length >= 1, 'obce klastry');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
