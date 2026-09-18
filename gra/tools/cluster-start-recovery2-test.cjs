'use strict';
/**
 * R-START-CIVILIZATION-CITYSTATES-Q1 recovery2 — focused contract gate.
 * Narrow RED/GREEN fixture for city-state distance, ring/nearest selection,
 * sequential acceptance order and owner/metadata cleanliness.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(os.tmpdir(), 'cluster-start-recovery2-entry.ts');
const BUNDLE = path.join(os.tmpdir(), 'cluster-start-recovery2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildClusterStartPlan } from ${JSON.stringify(path.join(GRA, 'src/game/cluster-start.ts'))};
export {
  buildClusterSpawnPlan,
  buildSameTypeRivalCandidateHexes,
} from ${JSON.stringify(path.join(GRA, 'src/map/cluster-spawn.ts'))};
export {
  packCityStatesAroundCapital,
  packCityStatesHubChain,
  computeSameTypeRivalHalfPlaneAxis,
  isInSameTypeRivalHalfPlane,
  CLUSTER_CITY_STATE_MIN_HEX,
  CLUSTER_CITY_STATE_MAX_HEX,
} from ${JSON.stringify(path.join(GRA, 'src/map/clusters.ts'))};
export { generateMap } from ${JSON.stringify(path.join(GRA, 'src/map/generator.ts'))};
export { hexDistanceAxial } from ${JSON.stringify(path.join(GRA, 'src/map/gen-helpers.ts'))};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const civs = require(path.join(GRA, 'data/civs.json'));
const cityNamesPools = require(path.join(GRA, 'data/city-names-pools.json'));

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log('PASS:', message);
  } else {
    failed += 1;
    console.error('FAIL:', message);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function posKey(pos) {
  return `${pos.q},${pos.r}`;
}
function distance(a, b) {
  return M.hexDistanceAxial(a.q, a.r, b.q, b.r);
}
function disk(radius) {
  const out = [];
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      if (distance({ q, r }, { q: 0, r: 0 }) <= radius) out.push({ q, r });
    }
  }
  return out;
}
function allPairwiseAtLeast(points, minDist, core) {
  for (const point of points) {
    if (core && distance(point, core) < minDist) return false;
  }
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (distance(points[i], points[j]) < minDist) return false;
    }
  }
  return true;
}
function ringOrNearestHubChain(core, points, ringDist, minDist) {
  if (!allPairwiseAtLeast(points, minDist, core)) return false;
  const hubs = [core];
  let nearestFallbackStarted = false;
  for (const point of points) {
    const ringConnected = hubs.some(hub => distance(point, hub) === ringDist);
    if (!nearestFallbackStarted && ringConnected) {
      hubs.push(point);
      continue;
    }
    nearestFallbackStarted = true;
    const placedCities = hubs.slice(1);
    if (placedCities.length > 0) {
      const nearestPlaced = Math.min(...placedCities.map(city => distance(point, city)));
      if (nearestPlaced > distance(point, core)) return false;
    }
    hubs.push(point);
  }
  return true;
}
function isMapLand(map, point) {
  const hex = map.hexes[posKey(point)];
  return Boolean(hex)
    && hex.terenBazowy !== 'morze'
    && hex.terenBazowy !== 'plytkie_morze'
    && hex.terenBazowy !== 'gory';
}
function slotIsCityState(slot) {
  return slot.isSameTypeRival || !slot.isClusterCapital;
}
function sequentialAcceptedSlots(rawSlots, playerStartHex) {
  const placed = [{ ...playerStartHex, isCityState: false }];
  const accepted = [];
  for (const slot of rawSlots) {
    const minDist = slotIsCityState(slot) ? 3 : 5;
    const collides = placed.some(previous => {
      const pairMin = previous.isCityState || slotIsCityState(slot) ? 3 : minDist;
      return distance(slot, previous) < pairMin;
    });
    if (collides) continue;
    accepted.push(slot);
    placed.push({ q: slot.q, r: slot.r, isCityState: slotIsCityState(slot) });
  }
  return accepted;
}
function planMetadataIsClean(plan) {
  const cityIds = new Set(plan.spawnCities.map(city => city.ownerId));
  const maps = [plan.aiOwnerCivMap, plan.ownerDisplayName, plan.startRelations];
  for (const map of maps) {
    for (const ownerId of map.keys()) {
      if (!cityIds.has(ownerId)) return false;
    }
  }
  for (const ownerId of plan.simplifiedDiplomacyOwners) {
    if (!cityIds.has(ownerId)) return false;
  }
  for (const ownerId of plan.foreignTypeOwners) {
    if (!cityIds.has(ownerId)) return false;
  }
  for (const ownerId of plan.typCityCopyOwners) {
    if (!cityIds.has(ownerId)) return false;
  }
  for (const group of plan.foreignTypeClusters) {
    if (group.ownerIds.length !== group.positions.length) return false;
    for (const ownerId of group.ownerIds) {
      if (!cityIds.has(ownerId)) return false;
      if (plan.aiOwnerCivMap.get(ownerId) !== group.typ) return false;
    }
  }
  return plan.clusterCapitalOwnerIds.every(ownerId => cityIds.has(ownerId));
}
function planOrder(plan, expected) {
  const actual = plan.spawnCities.map(city => `${city.ownerId}:${city.q},${city.r}`);
  const want = expected.map(slot => `${slot.ownerId}:${slot.q},${slot.r}`);
  return JSON.stringify(actual) === JSON.stringify(want);
}
function clonePlanWithGhost(plan) {
  const ghost = 999999;
  const copy = {
    ...plan,
    spawnCities: plan.spawnCities.slice(),
    aiOwnerCivMap: new Map(plan.aiOwnerCivMap),
    ownerDisplayName: new Map(plan.ownerDisplayName),
    startRelations: new Map(plan.startRelations),
    simplifiedDiplomacyOwners: new Set(plan.simplifiedDiplomacyOwners),
    foreignTypeOwners: new Set(plan.foreignTypeOwners),
    typCityCopyOwners: new Set(plan.typCityCopyOwners),
  };
  copy.aiOwnerCivMap.set(ghost, 'ghost');
  return copy;
}

console.log('cluster-start-recovery2-test\n');

// Narrow deterministic map seam: same-type candidates must keep the hard 5-hex contract.
const seed = 4242;
const map = M.generateMap(50, 50, seed, 'kontynenty');
const plan = M.buildClusterStartPlan({
  map,
  civs,
  seed,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
  cityNamesPools,
});
const candidateHexes = M.buildSameTypeRivalCandidateHexes(map, plan.playerStartHex, 9, seed);
const clusterMin = M.CLUSTER_CITY_STATE_MIN_HEX;
const clusterMax = M.CLUSTER_CITY_STATE_MAX_HEX;
assert(candidateHexes.length >= 5, `runtime candidates are bounded but non-empty (${candidateHexes.length})`);
assert(candidateHexes.every(point => isMapLand(map, point)), 'runtime candidates never use water or mountains');
assert(allPairwiseAtLeast(candidateHexes, clusterMin, plan.playerStartHex),
  'runtime candidates preserve minimum distance from capital and each other');
assert(ringOrNearestHubChain(plan.playerStartHex, candidateHexes, clusterMax, clusterMin),
  'runtime candidates preserve ring-then-nearest hub-chain order');

// Direct seam: the reserved growth slot is held to the same minimum as accepted slots.
const wideLand = disk(20);
const playerAxis = M.computeSameTypeRivalHalfPlaneAxis({ q: 0, r: 0 }, { q: 10, r: 0 }, 123);
const packed = M.packCityStatesAroundCapital(
  wideLand,
  wideLand,
  { q: 0, r: 0 },
  4,
  clusterMin,
  123,
  { growthReserve: 1, halfPlaneAxis: playerAxis },
);
const packedWithGrowth = packed.growthSlot
  ? [...packed.stateCities, packed.growthSlot]
  : packed.stateCities;
eq(packed.stateCities.length, 4, 'batch pack accepts requested city-state count on wide land');
assert(packed.growthSlot !== null, 'batch pack reserves one growth slot');
assert(allPairwiseAtLeast(packedWithGrowth, clusterMin, { q: 0, r: 0 }),
  'accepted city-states and reserved growth slot share the hard minimum');
assert(new Set(packedWithGrowth.map(posKey)).size === packedWithGrowth.length,
  'accepted batch has no duplicate positions');

// Sparse seam: if the exact ring is blocked, choose nearest legal land instead of returning a ghost slot.
const sparseCore = { q: 0, r: 0 };
const sparseLand = [
  sparseCore,
  { q: 6, r: 0 },
  { q: 12, r: 0 },
  { q: 18, r: 0 },
];
const sparse = M.packCityStatesAroundCapital(
  sparseLand,
  sparseLand,
  sparseCore,
  2,
  clusterMin,
  31,
  { growthReserve: 0 },
);
eq(sparse.stateCities.length, 2, 'nearest-legal fallback fills a sparse legal-land chain');
assert(Boolean(sparse.stateCities[0]), 'nearest-legal fallback returns a first legal land slot');
if (sparse.stateCities[0]) {
  eq(distance(sparse.stateCities[0], sparseCore), 6, 'nearest-legal fallback chooses the closest legal land first');
}
assert(allPairwiseAtLeast(sparse.stateCities, clusterMin, sparseCore),
  'nearest-legal fallback keeps minimum distance');

const shortRingLand = [sparseCore, { q: 2, r: 0 }, { q: 6, r: 0 }];
const shortRing = M.packCityStatesAroundCapital(
  shortRingLand,
  shortRingLand,
  sparseCore,
  1,
  clusterMin,
  31,
  { growthReserve: 0, ringDistances: [2] },
);
eq(shortRing.stateCities.length, 1, 'short rescue ring falls back to a legal slot');
if (shortRing.stateCities[0]) {
  eq(distance(shortRing.stateCities[0], sparseCore), 6,
    'short rescue ring never weakens the minimum distance contract');
}

// Real plan seam: batch plan and sequential accepted placement must agree in order.
const spawn = M.buildClusterSpawnPlan({
  map,
  civs,
  seed,
  playerTyp: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
  cityNamesPools,
});
const expectedAccepted = sequentialAcceptedSlots(spawn.slots, spawn.playerStartHex);
assert(planOrder(plan, expectedAccepted), 'batch plan order equals sequential accepted order');
assert(planMetadataIsClean(plan), 'rejected slots leave no owner or metadata ghost');
for (const group of plan.foreignTypeClusters) {
  const firstIndex = plan.spawnCities.findIndex(city => group.ownerIds.includes(city.ownerId));
  assert(firstIndex >= 0, `major-first group ${group.typ} has an accepted capital`);
  const groupIndices = group.ownerIds.map(ownerId =>
    plan.spawnCities.findIndex(city => city.ownerId === ownerId));
  assert(groupIndices.every((index, i) => i === 0 || index > groupIndices[i - 1]),
    `civilization ${group.typ} preserves capital-then-city-state order`);
}

// Mutation controls: each named invariant must actually turn red under a targeted mutation.
const swapped = expectedAccepted.slice();
if (swapped.length >= 2) {
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
}
assert(!planOrder(plan, swapped), 'mutation control catches swapped accepted order');
const water = Object.values(map.hexes).find(hex =>
  hex.terenBazowy === 'morze' || hex.terenBazowy === 'plytkie_morze');
assert(water !== undefined, 'fixture includes water for the placement mutation control');
if (water) {
  const waterMutation = [{ q: water.coords.q, r: water.coords.r }, ...candidateHexes.slice(1)];
  assert(!waterMutation.every(point => isMapLand(map, point)),
    'mutation control catches water placement');
}
assert(!planMetadataIsClean(clonePlanWithGhost(plan)),
  'mutation control catches ghost owner metadata');
const nonEquivalentBatch = expectedAccepted.slice().reverse();
assert(!planOrder(plan, nonEquivalentBatch), 'mutation control catches non-equivalent batch order');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
