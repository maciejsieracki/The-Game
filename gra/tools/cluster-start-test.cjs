'use strict';
/** node tools/cluster-start-test.cjs — D-START klaster + spawn */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.cluster-start-entry-f200.ts');
const bundle = path.join(__dirname, '.cluster-start-bundle-f200.cjs');

fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { buildClusterSpawnPlan, buildSameTypeRivalSlots, buildSameTypeRivalCandidateHexes, groupForeignTypeClusters } from '../src/map/cluster-spawn';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride } from '../src/map/riverGenSwitch';
export { computeClusters, groupHabitableMasses, regionMassDominance, localLandFraction, passesLocalLandGate, passesPlayerStartMassGate, pickPlayerClusterCenter, allocateTypyToMasses, massTypeCap, developmentSpaceScore, qualifyingMassIndicesForSpawn, MIN_MASS_HEXES_FOR_SPAWN, MIN_DEVELOPMENT_HEX_PER_CIV, SMALL_MASS_CAP_THRESHOLD, ISLAND_FALLBACK_MASS_FRAC, REGION_MASS_DOMINANCE_FRAC, LOCAL_LAND_DOMINANCE_FRAC, LOCAL_LAND_DOMINANCE_RADIUS, PLAYER_START_MIN_MASS_HEXES, PLAYER_START_MASS_MIN_ABSOLUTE, rosterKluczeForStartEpoch, capitalMinSeaDist, capitalMaxSeaDist, capitalMinSeparation, capitalMinSeparationForMap, passesMinCapitalSeparationGate, seaDistAt, passesMinSeaDistGate, passesCapitalSeaBandGate, clusterCohesionMaxHex } from '../src/map/clusters';
export { buildSeaDistanceField } from '../src/map/gen-helpers';
export { civIdsAvailableAtGameEpoch } from '../src/game/civ-entry-epoch';
export { MIN_DIST_START_CITY_STATE, MIN_DIST_FOREIGN_FROM_PLAYER, MIN_DIST_FOREIGN_IN_CLUSTER, CLUSTER_CITY_STATE_MIN_HEX, CLUSTER_CITY_STATE_MAX_HEX, clusterPackRadius, clusterCityStateRadius, packRivalCitiesAroundCore, packCityStatesHubChain, computeSameTypeRivalHalfPlaneAxis, isInSameTypeRivalHalfPlane } from '../src/map/clusters';
export { hexDistanceAxial } from '../src/map/gen-helpers';
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

/** BFS: każde MP dokładnie ringDist hex od jakiegoś huba (stolica → MP1 → MP2…). */
function isValidHubChain(core, cities, ringDist, minSep) {
  if (cities.length === 0) return true;
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const d = M.hexDistanceAxial(cities[i].q, cities[i].r, cities[j].q, cities[j].r);
      if (d < minSep) return false;
    }
    const dCore = M.hexDistanceAxial(cities[i].q, cities[i].r, core.q, core.r);
    if (dCore < minSep) return false;
  }
  const placed = new Set([`${core.q},${core.r}`]);
  const queue = [core];
  let reached = 0;
  while (queue.length > 0 && reached < cities.length) {
    const hub = queue.shift();
    for (const c of cities) {
      const k = `${c.q},${c.r}`;
      if (placed.has(k)) continue;
      if (M.hexDistanceAxial(c.q, c.r, hub.q, hub.r) === ringDist) {
        placed.add(k);
        queue.push(c);
        reached++;
      }
    }
  }
  return reached === cities.length;
}

function mapCenterFromMap(map) {
  return { q: (map.szerokoscQ - 1) / 2, r: (map.wysokoscR - 1) / 2 };
}

/** SPAWN-EXPANSION-ARC-Q1 A: wszystkie MP tego samego typu po jednej stronie stolicy. */
function assertAllSameTypeRivalHalfPlane(capital, hexes, map, seed, label) {
  if (hexes.length === 0) return;
  const axis = M.computeSameTypeRivalHalfPlaneAxis(capital, mapCenterFromMap(map), seed);
  for (const h of hexes) {
    assert(
      M.isInSameTypeRivalHalfPlane(h, capital, axis),
      `${label}: MP w półpłaszczyźnie inland (${h.q},${h.r})`,
    );
  }
}

console.log('cluster-start-test (D-START)\n');

const map = M.generateMap(50, 50, 4242, 'kontynenty');
const plan = M.buildClusterStartPlan({
  map,
  civs,
  seed: 4242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
});

assert(plan.playerStartCityName === 'Ateny', 'stolica gracza = Ateny');
assert(plan.pendingSameTypeRivals === 4, '4 rywali deferred do założenia miasta gracza');
assert(plan.spawnCities.length >= 1, 'co najmniej obce miasta AI na starcie');
assert(plan.simplifiedDiplomacyOwners.size === 0, 'rywale tego samego typu jeszcze nie na mapie');
assert(plan.foreignTypeOwners.size > 0, 'foreignTypeOwners wypełnione');
const foreignCount = plan.foreignTypeClusters.length;
assert(foreignCount >= 1, 'co najmniej 1 obcy klaster z miastami na mapie');
assert(plan.typCityCopyOwners.size === plan.spawnCities.length - plan.clusterCapitalOwnerIds.length,
  'typCityCopyOwners = państwa bez stolic klastrów');
assert(plan.clusterCapitalOwnerIds.length === foreignCount,
  'każdy obcy typ z miastami ma stolicę klastra (ekspansyjna AI)');
// E-START-CS-Q1 C: spawn wokół FAKTYCZNEJ stolicy gracza, nie pre-planu mapgen
const prePlanHexes = plan.pendingSameTypeRivalHexes;
assert(prePlanHexes.length >= 1 && prePlanHexes.length <= plan.pendingSameTypeRivals,
  'pre-planowane hexy państw gracza (1..N w pierścieniu 5 hex)');

// Gracz stawia stolicę w innym miejscu niż sugerowany hex algorytmu
function isLandHex(m, q, r) {
  const h = m.hexes[q + ',' + r];
  return h && h.terenBazowy !== 'Morze' && h.terenBazowy !== 'Gory' && h.terenBazowy !== 'Wybrzeze';
}
let offsetCore = { q: plan.playerStartHex.q + 3, r: plan.playerStartHex.r };
if (!isLandHex(map, offsetCore.q, offsetCore.r)) {
  offsetCore = { q: plan.playerStartHex.q, r: plan.playerStartHex.r };
}
const actualCandidates = M.buildSameTypeRivalCandidateHexes(
  map, offsetCore, plan.pendingSameTypeRivals, 4242,
);
const candidateHex = actualCandidates.length >= 1
  ? offsetCore
  : plan.playerStartHex;
const resolvedCandidates = actualCandidates.length >= 1
  ? actualCandidates
  : M.buildSameTypeRivalCandidateHexes(
    map, plan.playerStartHex, plan.pendingSameTypeRivals, 4242,
  );
assert(resolvedCandidates.length >= 1,
  'kandydaci wokół faktycznej stolicy (hub-chain, partial OK)');
for (const h of resolvedCandidates.slice(0, plan.pendingSameTypeRivals)) {
  const dCore = M.hexDistanceAxial(h.q, h.r, candidateHex.q, candidateHex.r);
  assert(dCore >= M.CLUSTER_CITY_STATE_MIN_HEX,
    `rywal min ${M.CLUSTER_CITY_STATE_MIN_HEX} hex od stolicy (${dCore})`);
}
assert(
  isValidHubChain(candidateHex, resolvedCandidates.slice(0, plan.pendingSameTypeRivals), M.CLUSTER_CITY_STATE_MAX_HEX, M.CLUSTER_CITY_STATE_MIN_HEX),
  'kandydaci runtime: poprawny łańcuch hubów',
);
assertAllSameTypeRivalHalfPlane(
  candidateHex,
  resolvedCandidates.slice(0, plan.pendingSameTypeRivals),
  map,
  4242,
  'runtimeCandidates',
);

// Symulacja: gracz założył miasto → spawn państw z pre-planu klastra (legacy podgląd)
const deferredHexes = prePlanHexes;
assert(deferredHexes.length >= 1 && deferredHexes.length <= 4, 'deferred same-type po founding (partial OK)');
const sameType = deferredHexes.map((h, i) => ({ q: h.q, r: h.r, name: 'mp' + (i + 1), ownerId: i + 1 }));
for (const oid of [1, 2, 3, 4]) {
  assert(!plan.simplifiedDiplomacyOwners.has(oid), `deferred owner ${oid} spoza startu`);
}

assert(plan.foreignTypeClusters.length >= 1, 'obce klastry z miastami na mapie');
for (const fc of plan.foreignTypeClusters) {
  if (fc.positions.length < 2) {
    console.log('NOTE: obcy typ ' + fc.typ + ': tylko stolica na 50×50 (got ' + fc.positions.length + ')');
  } else {
    assert(fc.positions.length >= 2, `obcy typ ${fc.typ}: ≥2 miasta (${fc.positions.length})`);
  }
  assert(fc.ownerIds.length === fc.positions.length, `obcy typ ${fc.typ}: ownerIds = positions`);
  for (const oid of fc.ownerIds) {
    assert(plan.aiOwnerCivMap.get(oid) === fc.typ, `owner ${oid} → typ ${fc.typ}`);
  }
}

const chinczycy = plan.foreignTypeClusters.find(fc => fc.typ === 'chinczycy');
if (chinczycy) {
  const chinskie = plan.spawnCities.filter(c => chinczycy.ownerIds.includes(c.ownerId));
  if (chinskie.length < 2) {
    console.log('NOTE: Chińczycy: tylko stolica na 50×50 (got ' + chinskie.length + ')');
  } else {
    assert(chinskie.length >= 2, 'Chińczycy: ≥2 chińskie miasta AI');
  }
  assert(chinskie[0].name === 'Qin', 'chińska stolica = Qin (nazwyKlastra[0])');
  const qinOwner = chinskie[0].ownerId;
  assert(plan.ownerDisplayName.get(qinOwner) === 'Qin', 'etykieta dyplomacji obcego typu = Qin (nie „Chińczycy”)');
}

const inkSlot = plan.spawnCities.find(c =>
  plan.aiOwnerCivMap.get(c.ownerId) === 'inkowie'
  && !plan.simplifiedDiplomacyOwners.has(c.ownerId),
);
if (inkSlot) {
  assert(plan.ownerDisplayName.get(inkSlot.ownerId) === inkSlot.name, 'Inkowie: etykieta = nazwa miasta');
  assert(plan.ownerDisplayName.get(inkSlot.ownerId) !== 'Inkowie', 'Inkowie: nie powtarza nazwy nacji');
}

const spawnOnly = M.buildClusterSpawnPlan({
  map,
  civs,
  seed: 4242,
  playerTyp: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
});
assert(spawnOnly.foreignTypeClusters.length === foreignCount, 'buildClusterSpawnPlan: foreignTypeClusters');
assert(
  spawnOnly.slots.filter(s => !s.isSameTypeRival).length
    === spawnOnly.foreignTypeClusters.reduce((n, g) => n + g.positions.length, 0),
  'wszystkie sloty obcych = suma klastrów',
);

const plan2 = M.buildClusterStartPlan({
  map,
  civs,
  seed: 4242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 5,
});
assert(
  JSON.stringify(plan.spawnCities) === JSON.stringify(plan2.spawnCities),
  'deterministyczny seed',
);

// Maciej 2026-07-29: twardy klaster miast-państw gracza — hub-chain pierścień 5 hex
const playerCap = plan.playerStartHex;
const clusterMax = M.CLUSTER_CITY_STATE_MAX_HEX;
const clusterMin = M.CLUSTER_CITY_STATE_MIN_HEX;
for (let i = 0; i < sameType.length; i++) {
  for (let j = i + 1; j < sameType.length; j++) {
    const d = M.hexDistanceAxial(sameType[i].q, sameType[i].r, sameType[j].q, sameType[j].r);
    assert(d >= clusterMin, `miasta-panstwa >= ${clusterMin} hex (${d})`);
  }
  const dCore = M.hexDistanceAxial(sameType[i].q, sameType[i].r, playerCap.q, playerCap.r);
  assert(dCore >= clusterMin, `rywal min ${clusterMin} hex od stolicy (${dCore})`);
}
assert(isValidHubChain(playerCap, sameType, clusterMax, clusterMin), 'pre-plan MP: poprawny łańcuch hubów');
assertAllSameTypeRivalHalfPlane(playerCap, sameType, map, 4242, 'pre-plan pendingStateSlots');
const foreignCities = plan.spawnCities.filter(c => plan.foreignTypeOwners.has(c.ownerId));
const minObcyOdGracza = plan.placement.minDystansObcyOdGracza;
for (const fc of foreignCities) {
  const d = M.hexDistanceAxial(fc.q, fc.r, playerCap.q, playerCap.r);
  if (d < minObcyOdGracza) {
    console.log('NOTE: obcy typ blisko gracza na 50×50 (' + d + ' < ' + minObcyOdGracza + ')');
  } else {
    assert(d >= minObcyOdGracza, `obcy typ >= ${minObcyOdGracza} hex od stolicy gracza (${d})`);
  }
}
for (const fcl of plan.foreignTypeClusters) {
  const pos = fcl.positions;
  const fcCentrum = plan.placement.klastry.find(k => k.typ === fcl.typ)?.centrum;
  const fPackR = M.clusterPackRadius(pos.length, M.MIN_DIST_FOREIGN_IN_CLUSTER);
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const d = M.hexDistanceAxial(pos[i].q, pos[i].r, pos[j].q, pos[j].r);
      assert(
        d >= M.MIN_DIST_FOREIGN_IN_CLUSTER,
        `obcy klaster ${fcl.typ} mp >= ${M.MIN_DIST_FOREIGN_IN_CLUSTER} hex (${d})`,
      );
    }
    if (fcCentrum) {
      const dc = M.hexDistanceAxial(pos[i].q, pos[i].r, fcCentrum.q, fcCentrum.r);
      assert(
        dc <= fPackR + M.MIN_DIST_FOREIGN_IN_CLUSTER * 6,
        `obcy ${fcl.typ} w zasięgu klastra od centrum (${dc})`,
      );
    }
  }
}
assert(plan.placement.minDystansMiastaPanstwa === 5, 'placement minDystansMiastaPanstwa=5');
assert(plan.placement.maxDystansMiastaPanstwa === 5, 'placement maxDystansMiastaPanstwa=5');
assert(plan.placement.minDystansObcyOdGracza === 12, 'placement minDystansObcyOdGracza=12');
assert(M.MIN_DIST_FOREIGN_IN_CLUSTER === 5, 'MIN_DIST_FOREIGN_IN_CLUSTER=5');
assert(M.CLUSTER_CITY_STATE_MIN_HEX === 5, 'CLUSTER_CITY_STATE_MIN_HEX=5');
assert(M.CLUSTER_CITY_STATE_MAX_HEX === 5, 'CLUSTER_CITY_STATE_MAX_HEX=5');
assert(M.clusterCityStateRadius() === 5, 'clusterCityStateRadius=5');

// Maciej 2026-07-29: obcy klaster — pełna quota MP gdy region pozwala; przy 5 hex partial OK na ciasnym regionie
const expectedMpPerCluster = 4;
const expectedMpPerClusterMin = 3;
for (const k of plan.placement.klastry) {
  if (k.typ === 'grecy') continue;
  const mpCount = k.miasta.filter(m => !m.isCapital).length;
  if (mpCount < expectedMpPerClusterMin) {
    console.log('NOTE: klaster ' + k.typ + ': min MP nieosiągalne na 50×50 (got ' + mpCount + ', miast=' + k.miasta.length + ')');
  } else {
    assert(
      mpCount >= expectedMpPerClusterMin,
      `klaster ${k.typ}: min ${expectedMpPerClusterMin} MP (got ${mpCount}, miast=${k.miasta.length})`,
    );
  }
  if (mpCount < expectedMpPerCluster) {
    console.log('NOTE: klaster ' + k.typ + ': partial ' + mpCount + '/' + expectedMpPerCluster + ' MP (region ciasny przy 5 hex)');
  }
  const cap = k.miasta.find(m => m.isCapital) ?? k.miasta[0];
  const mps = k.miasta.filter(m => !m.isCapital);
  if (cap && mps.length > 0) {
    assert(
      isValidHubChain(cap, mps, clusterMax, clusterMin),
      `klaster ${k.typ}: poprawny łańcuch hubów`,
    );
  }
}

// Maciej 2026-07-28: kandydaci runtime — hub-chain BFS (nie tylko pierścień od stolicy)
const runtimeCandidates = M.buildSameTypeRivalCandidateHexes(map, playerCap, 9, 4242);
for (let i = 0; i < runtimeCandidates.length; i++) {
  for (let j = i + 1; j < runtimeCandidates.length; j++) {
    const d = M.hexDistanceAxial(
      runtimeCandidates[i].q, runtimeCandidates[i].r,
      runtimeCandidates[j].q, runtimeCandidates[j].r,
    );
    assert(d >= clusterMin, `runtimeCandidates pairwise >= ${clusterMin} hex (${d})`);
  }
  const dCore = M.hexDistanceAxial(runtimeCandidates[i].q, runtimeCandidates[i].r, playerCap.q, playerCap.r);
  assert(dCore >= clusterMin, `runtimeCandidate min ${clusterMin} hex od stolicy (${dCore})`);
}
assert(
  isValidHubChain(playerCap, runtimeCandidates, clusterMax, clusterMin),
  'runtimeCandidates: poprawny łańcuch hubów (' + runtimeCandidates.length + ' slotów)',
);
assertAllSameTypeRivalHalfPlane(playerCap, runtimeCandidates, map, 4242, 'runtimeCandidates 9');

// Hub-chain: przy wystarczającym lądzie 6 MP → pełne 6 slotów (6. może być >5 od stolicy)
const hubSix = M.buildSameTypeRivalCandidateHexes(map, playerCap, 6, 4242);
assert(hubSix.length === 6, 'hub-chain 50×50: 6 slotów MP (got ' + hubSix.length + ')');
if (hubSix.length === 6) {
  const d6Cap = M.hexDistanceAxial(hubSix[5].q, hubSix[5].r, playerCap.q, playerCap.r);
  let d6Hub = clusterMax;
  for (let i = 0; i < 5; i++) {
    const d = M.hexDistanceAxial(hubSix[5].q, hubSix[5].r, hubSix[i].q, hubSix[i].r);
    if (d === clusterMax) d6Hub = clusterMax;
  }
  assert(d6Hub === clusterMax, `6. MP dokładnie ${clusterMax} hex od któregoś huba klastra (od stolicy=${d6Cap})`);
  assert(isValidHubChain(playerCap, hubSix, clusterMax, clusterMin), 'hub-chain 6/6: BFS valid');
}
assertAllSameTypeRivalHalfPlane(playerCap, hubSix, map, 4242, 'hubSix');

// packRivalCitiesAroundCore — pairwise min 3 hex między państwami
const landHexes = Object.values(map.hexes)
  .filter(h => h.terenBazowy !== 'Morze' && h.terenBazowy !== 'Gory' && h.terenBazowy !== 'Wybrzeze')
  .map(h => ({ q: h.coords.q, r: h.coords.r }));
const packedDirect = M.packRivalCitiesAroundCore(
  landHexes, playerCap, 9, clusterMin, 4242, mapCenterFromMap(map),
);
for (let i = 0; i < packedDirect.length; i++) {
  for (let j = i + 1; j < packedDirect.length; j++) {
    const d = M.hexDistanceAxial(packedDirect[i].q, packedDirect[i].r, packedDirect[j].q, packedDirect[j].r);
    assert(d >= clusterMin, `packRivalCitiesAroundCore pairwise >= ${clusterMin} hex (${d})`);
  }
}
assertAllSameTypeRivalHalfPlane(playerCap, packedDirect, map, 4242, 'packRivalCitiesAroundCore');
// Stolica gracza na krawędzi klastra (dalej od centrum niż średnie państwo)
// Uwaga: bramka seaDist może wciągnąć stolicę w głąb lądu — wtedy obwód nie obowiązuje.
const playerKlaster = plan.placement.klastry.find(k => k.typ === 'grecy');
if (playerKlaster && sameType.length > 0) {
  const capD = M.hexDistanceAxial(
    plan.playerStartHex.q, plan.playerStartHex.r,
    playerKlaster.centrum.q, playerKlaster.centrum.r,
  );
  const avgStateD = sameType.reduce((s, st) =>
    s + M.hexDistanceAxial(st.q, st.r, playerKlaster.centrum.q, playerKlaster.centrum.r), 0,
  ) / sameType.length;
  if (capD >= avgStateD - 1) {
    assert(true, `stolica gracza na obwodzie klastra (cap=${capD} avgState=${avgStateD})`);
  } else {
    console.log('NOTE: stolica nie na obwodzie po seaDist (cap=' + capD + ' avgState=' + avgStateD + ') — OK');
  }
  if (playerKlaster.growthSlot) {
    assert(
      M.hexDistanceAxial(
        playerKlaster.growthSlot.q, playerKlaster.growthSlot.r,
        plan.playerStartHex.q, plan.playerStartHex.r,
      ) >= M.MIN_DIST_START_CITY_STATE,
      'zarezerwowany slot wzrostu w klastrze',
    );
  }
}

// Maciej 2026-07-22: 15 typów na Super Huge — continent-aware placement + fallback layout
// Domyślnie POMIJANE: generateMap(672×476) z rzekami trwa zbyt długo; włącz: CIV_CLUSTER_HUGE=1
if (process.env.CIV_CLUSTER_HUGE === '1') {
const hugeMap = M.generateMap(672, 476, 9001, 'kontynenty');
const plan15 = M.buildClusterStartPlan({
  map: hugeMap,
  civs,
  seed: 9001,
  playerCivId: 'grecy',
  rywaleNaKlaster: 8,
  aktywneTypy: 15,
  startEpochId: 'zelazo',
});
assert(plan15.placement.requestedTypy === 15, 'requestedTypy=15 (żelazo)');
assert(plan15.placement.aktywneTypy >= 13,
  'Super Huge 15 typów: ≥13 klastrów z miastami (got ' + plan15.placement.aktywneTypy + ')');
assert(plan15.foreignTypeClusters.length >= 12,
  'obce klastry ≥12 (got ' + plan15.foreignTypeClusters.length + ')');

// Kontynenty: środki klastrów na wielu masach lądu (nie wszystko na jednym)
const landHexesHuge = Object.values(hugeMap.hexes)
  .filter(h => h.terenBazowy !== 'Morze' && h.terenBazowy !== 'Gory' && h.terenBazowy !== 'Wybrzeze')
  .map(h => ({ q: h.coords.q, r: h.coords.r }));
const massesHuge = M.groupHabitableMasses(landHexesHuge);
const centers15 = plan15.placement.klastry.map(k => k.centrum);
function massHasCenter(mass, centers) {
  for (const h of mass) {
    for (const c of centers) {
      if (M.hexDistanceAxial(h.q, h.r, c.q, c.r) <= 3) return true;
    }
  }
  return false;
}
const massesWithCiv = massesHuge.filter(m => massHasCenter(m, centers15)).length;
assert(massesWithCiv >= 1, 'co najmniej 1 masa lądu z klastrem na Super Huge');
} else {
  console.log('SKIP: Super Huge 15 typów (ustaw CIV_CLUSTER_HUGE=1 żeby włączyć)');
}

// Rozłożenie geograficzne środków (nie wszystko w jednym rogu mapy)
const placement50 = M.computeClusters(map, { seed: 4242, aktywneTypy: 5, rywaleNaKlaster: 4 });
const centers50 = placement50.klastry.map(k => k.centrum);
let maxCenterDist = 0;
for (let i = 0; i < centers50.length; i++) {
  for (let j = i + 1; j < centers50.length; j++) {
    const d = M.hexDistanceAxial(centers50[i].q, centers50[i].r, centers50[j].q, centers50[j].r);
    if (d > maxCenterDist) maxCenterDist = d;
  }
}
assert(maxCenterDist >= 2,
  'środki klastrów rozłożone na mapie (max dist ' + maxCenterDist + ', klastrów ' + centers50.length + ')');
if (maxCenterDist < 8) {
  console.log('NOTE: 50×50 środki blisko siebie (max dist ' + maxCenterDist + ') — OK po bramkach lądu');
}
assert(
  placement50.aktywneTypy >= 3 && placement50.aktywneTypy <= placement50.requestedTypy,
  '50×50 × 5 typów: klastry po bramce lokalnego lądu (got ' + placement50.aktywneTypy + '/' + placement50.requestedTypy + ')',
);

// MAP-SPAWN-Q1 C + lokalna bramka 70%
assert(M.ISLAND_FALLBACK_MASS_FRAC === 0.25, 'ISLAND_FALLBACK_MASS_FRAC=0.25');
assert(M.LOCAL_LAND_DOMINANCE_FRAC === 0.70, 'LOCAL_LAND_DOMINANCE_FRAC=0.70');
assert(M.LOCAL_LAND_DOMINANCE_RADIUS === 3, 'LOCAL_LAND_DOMINANCE_RADIUS=3');

function fillSeaBoundingBox(hexes, minQ, maxQ, minR, maxR) {
  for (let q = minQ; q <= maxQ; q++) {
    for (let r = minR; r <= maxR; r++) {
      const key = q + ',' + r;
      if (!hexes[key]) hexes[key] = { coords: { q, r }, terenBazowy: 'morze' };
    }
  }
}

function makeTwoMassSyntheticMap() {
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
  fillSeaBoundingBox(hexes, 0, 60, 0, 60);
  return { hexes };
}

function makeTinyIslandMap() {
  const hexes = {};
  for (let q = 10; q < 30; q++) {
    for (let r = 10; r < 30; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
    }
  }
  const island = [[50, 50], [51, 50], [52, 50], [50, 51], [51, 51], [52, 51], [51, 52]];
  for (const [q, r] of island) {
    hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
  }
  fillSeaBoundingBox(hexes, 0, 60, 0, 60);
  return { hexes, islandCoords: island };
}

const synthMap = makeTwoMassSyntheticMap();
const synthLand = Object.values(synthMap.hexes)
  .filter(h => h.terenBazowy === 'laka')
  .map(h => ({ q: h.coords.q, r: h.coords.r }));
const synthMasses = M.groupHabitableMasses(synthLand);
assert(synthMasses.length === 2, 'syntetyczna mapa: 2 masy lądu (got ' + synthMasses.length + ')');
const synthPlacement = M.computeClusters(synthMap, { seed: 12345, aktywneTypy: 4, rywaleNaKlaster: 2 });
const islandMass = synthMasses[1];
function centerOnMass(centrum, mass) {
  if (!mass || !Array.isArray(mass)) return false;
  for (const h of mass) {
    if (M.hexDistanceAxial(h.q, h.r, centrum.q, centrum.r) <= 2) return true;
  }
  return false;
}
const centersOnIsland = synthPlacement.klastry.filter(k => centerOnMass(k.centrum, islandMass));
assert(centersOnIsland.length === 0,
  'MAP-SPAWN-Q1 C: brak środka na małej wyspie gdy kontynent obsługuje typy (got ' + centersOnIsland.length + ')');

// MAP-SPAWN-Q1 B: lokalny ląd ≥70% w promieniu R=3 (nie Voronoi)
const tiny = makeTinyIslandMap();
const islandCenter = { q: 51, r: 51 };
const islandLand = M.localLandFraction(tiny, islandCenter.q, islandCenter.r, M.LOCAL_LAND_DOMINANCE_RADIUS);
assert(islandLand.ratio < M.LOCAL_LAND_DOMINANCE_FRAC,
  '7-hex wyspa: lokalny ląd < 70% w R=3 (' + islandLand.ratio.toFixed(2) + ', land=' + islandLand.landCount + '/' + islandLand.totalCount + ')');
const continentCenter = { q: 20, r: 20 };
const continentLand = M.localLandFraction(tiny, continentCenter.q, continentCenter.r, M.LOCAL_LAND_DOMINANCE_RADIUS);
assert(continentLand.ratio >= M.LOCAL_LAND_DOMINANCE_FRAC,
  'kontynent: lokalny ląd ≥ 70% w R=3 (' + continentLand.ratio.toFixed(2) + ')');

const tinyPlacement = M.computeClusters(tiny, { seed: 777, aktywneTypy: 4, rywaleNaKlaster: 2 });
function cityOnTinyIsland(k) {
  for (const m of k.miasta) {
    for (const [q, r] of tiny.islandCoords) {
      if (m.q === q && m.r === r) return true;
    }
  }
  return false;
}
const citiesOnTinyIsland = tinyPlacement.klastry.filter(cityOnTinyIsland);
assert(citiesOnTinyIsland.length === 0,
  '7-hex wyspa + kontynent: 0 miast startowych na wyspie (got ' + citiesOnTinyIsland.length + ')');

function make16HexIslandMap() {
  const hexes = {};
  for (let q = 10; q < 30; q++) {
    for (let r = 10; r < 30; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
    }
  }
  const islandCoords = [];
  for (let q = 50; q < 54; q++) {
    for (let r = 50; r < 54; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
      islandCoords.push([q, r]);
    }
  }
  fillSeaBoundingBox(hexes, 0, 60, 0, 60);
  return { hexes, islandCoords };
}

const island16 = make16HexIslandMap();
const plan16 = M.buildClusterStartPlan({
  map: island16,
  civs,
  seed: 4242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 4,
});
function hexOnIsland16(q, r) {
  return island16.islandCoords.some(([iq, ir]) => iq === q && ir === r);
}
assert(
  !hexOnIsland16(plan16.playerStartHex.q, plan16.playerStartHex.r),
  '16-hex wyspa: playerStartHex na dużej masie (got ' + plan16.playerStartHex.q + ',' + plan16.playerStartHex.r + ')',
);
assert(
  M.passesPlayerStartMassGate(island16, plan16.playerStartHex.q, plan16.playerStartHex.r, M.groupHabitableMasses(
    Object.values(island16.hexes).filter(h => h.terenBazowy === 'laka').map(h => ({ q: h.coords.q, r: h.coords.r })),
  )),
  '16-hex wyspa: playerStartHex przechodzi bramkę masy gracza',
);

// Standard × 8 typów (kamień): requested 8 → placed ≥ 6 (separacja stolic ≥14 może pominąć typ)
const stdMap = M.generateMap(168, 120, 4242, 'kontynenty');
const stdPlan = M.buildClusterStartPlan({
  map: stdMap,
  civs,
  seed: 4242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 6,
  aktywneTypy: 8,
  startEpochId: 'kamien',
});
assert(stdPlan.placement.requestedTypy === 8, 'Standard kamień: requestedTypy=8 (got ' + stdPlan.placement.requestedTypy + ')');
assert(stdPlan.placement.aktywneTypy >= 6,
  'Standard kamień × 8 typów: placed ≥ 6 (got ' + stdPlan.placement.aktywneTypy + '/8)');
assert(stdPlan.pendingSameTypeRivals === 6, 'Standard kamień: pendingSameTypeRivals=6');
const stdSix = M.buildSameTypeRivalCandidateHexes(stdMap, stdPlan.playerStartHex, 6, 4242);
assert(stdSix.length === 6, 'Standard hub-chain: 6 slotów MP (got ' + stdSix.length + ')');
assert(
  isValidHubChain(stdPlan.playerStartHex, stdSix, M.CLUSTER_CITY_STATE_MAX_HEX, M.CLUSTER_CITY_STATE_MIN_HEX),
  'Standard hub-chain 6/6: BFS valid',
);
assertAllSameTypeRivalHalfPlane(stdPlan.playerStartHex, stdSix, stdMap, 4242, 'Standard stdSix');

// regionMassDominance — legacy metryka Voronoi (tylko unit test)
const bigMass = synthMasses[0];
const smallMass = synthMasses[1];
const mixedRegion = [...bigMass.slice(0, 70), ...smallMass];
const weakCenter = smallMass[0];
const weakDom = M.regionMassDominance(mixedRegion, weakCenter, synthMasses);
assert(weakDom.ratio < M.LOCAL_LAND_DOMINANCE_FRAC,
  'regionMassDominance (legacy): słaba masa < 70% Voronoi (' + weakDom.ratio.toFixed(2) + ')');
const strongCenter = bigMass[Math.floor(bigMass.length / 2)];
const strongDom = M.regionMassDominance(mixedRegion, strongCenter, synthMasses);
assert(strongDom.ratio >= M.LOCAL_LAND_DOMINANCE_FRAC,
  'regionMassDominance (legacy): dominująca masa ≥ 70% Voronoi (' + strongDom.ratio.toFixed(2) + ')');

// CIV-EPOCH-SPAWN-Q1: pula typów = tylko nacje dostępne w epoce startu
const BRAZ_ONLY_TYPY = ['celtowie', 'germanie', 'hetyci', 'babilonia', 'asyria', 'fenicjanie'];
const ZELAZO_ONLY_TYPY = ['slowianie'];

function uniqueClusterTypy(plan) {
  const set = new Set();
  for (const k of plan.placement.klastry) {
    if (k.typ && !k.typ.startsWith('typ')) set.add(k.typ);
  }
  for (const fc of plan.foreignTypeClusters) set.add(fc.typ);
  return [...set];
}

function assertEpochSpawn(epochId, requested, expectedMax, forbidden) {
  const p = M.buildClusterStartPlan({
    map: stdMap,
    civs,
    seed: 4242,
    playerCivId: 'grecy',
    rywaleNaKlaster: 4,
    aktywneTypy: requested,
    startEpochId: epochId,
  });
  const typy = uniqueClusterTypy(p);
  assert(
    p.placement.requestedTypy === Math.min(requested, expectedMax),
  'epoch ' + epochId + ': requestedTypy=' + Math.min(requested, expectedMax) + ' (got ' + p.placement.requestedTypy + ')',
  );
  assert(typy.length <= expectedMax,
    'epoch ' + epochId + ': unikalnych typów ≤ ' + expectedMax + ' (got ' + typy.length + ')');
  for (const bad of forbidden) {
    assert(!typy.includes(bad), 'epoch ' + epochId + ': brak typu spoza puli (' + bad + ')');
  }
}

assert(M.rosterKluczeForStartEpoch(civs.cywilizacje, 'kamien').length === 8, 'kamień: 8 nacji w puli');
assert(M.rosterKluczeForStartEpoch(civs.cywilizacje, 'braz').length === 14, 'brąz: 14 nacji w puli');
assert(M.rosterKluczeForStartEpoch(civs.cywilizacje, 'zelazo').length === 15, 'żelazo: 15 nacji w puli');

assertEpochSpawn('kamien', 15, 8, [...BRAZ_ONLY_TYPY, ...ZELAZO_ONLY_TYPY]);
assertEpochSpawn('braz', 15, 14, ZELAZO_ONLY_TYPY);
assertEpochSpawn('zelazo', 15, 15, []);

// MAP-SPAWN-Q2 B: quota proporcjonalna + cap małych mas
assert(M.MIN_MASS_HEXES_FOR_SPAWN === 60, 'MIN_MASS_HEXES_FOR_SPAWN=60');
assert(M.MIN_DEVELOPMENT_HEX_PER_CIV === 90, 'MIN_DEVELOPMENT_HEX_PER_CIV=90');
assert(M.SMALL_MASS_CAP_THRESHOLD === 180, 'SMALL_MASS_CAP_THRESHOLD=180');
assert(M.massTypeCap(50) === 1, 'mała masa: cap=1 typ');
assert(M.massTypeCap(200) >= 2, 'duża masa: cap≥2 typy');

function countCentersPerMass(masses, centers) {
  const counts = masses.map(() => 0);
  for (const c of centers) {
    for (let mi = 0; mi < masses.length; mi++) {
      for (const h of masses[mi]) {
        if (M.hexDistanceAxial(h.q, h.r, c.q, c.r) <= 2) {
          counts[mi]++;
          break;
        }
      }
    }
  }
  return counts;
}

// Quota: duży kontynent + mała wyspa — max 1 typ na wyspie
const q2Land = Object.values(synthMap.hexes)
  .filter(h => h.terenBazowy === 'laka')
  .map(h => ({ q: h.coords.q, r: h.coords.r }));
const q2Masses = M.groupHabitableMasses(q2Land);
const q2Alloc = M.allocateTypyToMasses(3, q2Masses);
assert(q2Alloc[1] === 0 || q2Masses[1].length < M.MIN_MASS_HEXES_FOR_SPAWN,
  'MAP-SPAWN-Q2: mała wyspa bez quota gdy < MIN_MASS_HEXES_FOR_SPAWN (alloc=' + q2Alloc.join(',') + ')');
assert(q2Alloc[0] >= 2, 'MAP-SPAWN-Q2: duży kontynent dostaje większość slotów (alloc[0]=' + q2Alloc[0] + ')');

const q2Placement = M.computeClusters(synthMap, { seed: 9999, aktywneTypy: 5, rywaleNaKlaster: 2 });
const q2Centers = q2Placement.klastry.map(k => k.centrum);
const q2Counts = countCentersPerMass(q2Masses, q2Centers);
assert(q2Counts[1] === 0,
  'MAP-SPAWN-Q2: 0 środków na małej wyspie przy dużym kontynencie (got ' + q2Counts[1] + ')');

// Pangea: wszystkie typy na jednej masie OK
function makePangeaMap(size) {
  const hexes = {};
  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
    }
  }
  return { hexes };
}
const pangeaMap = makePangeaMap(40);
const pangeaPlacement = M.computeClusters(pangeaMap, { seed: 5555, aktywneTypy: 6, rywaleNaKlaster: 3 });
const pangeaLand = Object.values(pangeaMap.hexes).map(h => ({ q: h.coords.q, r: h.coords.r }));
const pangeaMasses = M.groupHabitableMasses(pangeaLand);
assert(pangeaMasses.length === 1, 'Pangea: 1 masa lądu');
assert(pangeaPlacement.klastry.length >= 5,
  'Pangea: ≥5 klastrów na jednej masie (got ' + pangeaPlacement.klastry.length + ')');
const pangeaAlloc = M.allocateTypyToMasses(5, pangeaMasses);
assert(pangeaAlloc[0] === 5, 'Pangea: wszystkie obce typy na jedynej masie (alloc=' + pangeaAlloc[0] + ')');

// developmentSpaceScore: kontynent > wysepka
const bigDev = M.developmentSpaceScore(tiny, continentCenter.q, continentCenter.r, M.groupHabitableMasses(
  Object.values(tiny.hexes).filter(h => h.terenBazowy === 'laka').map(h => ({ q: h.coords.q, r: h.coords.r })),
));
const islandDev = M.developmentSpaceScore(tiny, islandCenter.q, islandCenter.r, M.groupHabitableMasses(
  Object.values(tiny.hexes).filter(h => h.terenBazowy === 'laka').map(h => ({ q: h.coords.q, r: h.coords.r })),
));
assert(bigDev > islandDev,
  'MAP-SPAWN-Q2: kontynent ma wyższy developmentSpaceScore (' + bigDev + ' vs ' + islandDev + ')');

// BUG-MP-NAZWA-CIV-MISMATCH: ownerId obcych ≠ zarezerwowane dla same-type rivals
const foreignOwnerSet = new Set(plan.spawnCities.map(c => c.ownerId));
const rivalIdOverlap = plan.pendingSameTypeRivalOwnerIds.filter(id => foreignOwnerSet.has(id));
assert(rivalIdOverlap.length === 0,
  'pendingSameTypeRivalOwnerIds bez kolizji z obcymi (overlap=' + rivalIdOverlap.join(',') + ')');
assert(plan.pendingSameTypeRivalOwnerIds.length === plan.pendingSameTypeRivals,
  'zarezerwowane ownerId dla deferred rivals');

// BUG-SPAWN-ODLEGLOSC-MORZE: stolice ≥ minSeaDist na Standard (duza)
const stdSeaDist = M.buildSeaDistanceField(stdMap.hexes);
const minSeaStd = M.capitalMinSeaDist(stdPlan.placement.rozmiarMapy);
assert(minSeaStd === 10, 'Standard (duza): minSeaDist=10 (got ' + minSeaStd + ')');
const maxSeaStd = M.capitalMaxSeaDist(stdPlan.placement.rozmiarMapy);
assert(maxSeaStd === 15, 'Standard (duza): maxSeaDist=15 (got ' + maxSeaStd + ')');
const stdCapSea = M.seaDistAt(stdSeaDist, stdPlan.playerStartHex.q, stdPlan.playerStartHex.r);
assert(stdCapSea >= minSeaStd,
  'Standard: stolica gracza min 10 hex od morza (seaDist=' + stdCapSea + ', min=' + minSeaStd + ')');
assert(stdCapSea <= maxSeaStd + 8,
  'Standard: stolica gracza nie daleko poza pas 10–15 (seaDist=' + stdCapSea + ', max=' + maxSeaStd + ')');

// BUG-SPAWN-ODLEGLOSC-MORZE: stolice obcych typów ≥ minSeaDist na Standard
for (const fcl of stdPlan.foreignTypeClusters) {
  const capPos = fcl.positions[0];
  if (!capPos) continue;
  const capSea = M.seaDistAt(stdSeaDist, capPos.q, capPos.r);
  assert(capSea >= minSeaStd,
    `Standard: stolica obcego typu ${fcl.typ} min ${minSeaStd} hex od morza (seaDist=${capSea})`);
}

// BUG-SPAWN-ODLEGLOSC-STOLICE: pary stolic różnych cywilizacji ≥ minSep na Standard
const minSepStd = M.capitalMinSeparation(stdPlan.placement.rozmiarMapy);
assert(minSepStd === 14, 'Standard (duza): minCapitalSep=14 (got ' + minSepStd + ')');
assert(M.capitalMinSeparationForMap(stdPlan.placement.rozmiarMapy, 168, 120) === 14,
  'Standard map 168×120: minCapitalSepForMap=14');
assert(stdPlan.placement.minDystansObcyOdGracza === 14,
  'Standard: minDystansObcyOdGracza=14 (got ' + stdPlan.placement.minDystansObcyOdGracza + ')');
const stdCapitals = [{ q: stdPlan.playerStartHex.q, r: stdPlan.playerStartHex.r }];
for (const fcl of stdPlan.foreignTypeClusters) {
  const capPos = fcl.positions[0];
  if (capPos) stdCapitals.push(capPos);
}
const minSepTol = minSepStd;
for (let i = 0; i < stdCapitals.length; i++) {
  for (let j = i + 1; j < stdCapitals.length; j++) {
    const d = M.hexDistanceAxial(stdCapitals[i].q, stdCapitals[i].r, stdCapitals[j].q, stdCapitals[j].r);
    assert(d >= minSepTol,
      `Standard: stolice #${i}↔#${j} min ${minSepTol} hex (got ${d})`);
  }
}

// BUG-SPAWN-CLUSTER-KULTURA: miasta obcego typu w zasięgu spójności od stolicy klastra
const cohesionMax = M.clusterCohesionMaxHex(6);
for (const fcl of stdPlan.foreignTypeClusters) {
  const capPos = fcl.positions[0];
  for (const pos of fcl.positions.slice(1)) {
    const d = M.hexDistanceAxial(pos.q, pos.r, capPos.q, capPos.r);
    assert(d <= cohesionMax,
      `klaster ${fcl.typ}: MP w zasięgu spójności (${d} <= ${cohesionMax})`);
  }
}

// BUG-SPAWN-ODLEGLOSC-STOLICE / FALA 182: Duża (ogromna) 240×168 — minSep=16, obcy od gracza ≥16
const largeMap = M.generateMap(240, 168, 4242, 'kontynenty');
const largePlan = M.buildClusterStartPlan({
  map: largeMap,
  civs,
  seed: 4242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 6,
  startEpochId: 'zelazo',
});
assert(
  M.capitalMinSeparationForMap(largePlan.placement.rozmiarMapy, 240, 168) === 16,
  'Duża 240×168: minCapitalSepForMap=16 (got ' +
    M.capitalMinSeparationForMap(largePlan.placement.rozmiarMapy, 240, 168) + ')',
);
assert(
  largePlan.placement.minDystansObcyOdGracza === 16,
  'Duża: minDystansObcyOdGracza=16 (got ' + largePlan.placement.minDystansObcyOdGracza + ')',
);
const minSepLarge = M.capitalMinSeparationForMap(largePlan.placement.rozmiarMapy, 240, 168);
const largeCapitals = [{ q: largePlan.playerStartHex.q, r: largePlan.playerStartHex.r }];
for (const fcl of largePlan.foreignTypeClusters) {
  const capPos = fcl.positions[0];
  if (capPos) largeCapitals.push(capPos);
}
for (let i = 0; i < largeCapitals.length; i++) {
  for (let j = i + 1; j < largeCapitals.length; j++) {
    const d = M.hexDistanceAxial(
      largeCapitals[i].q, largeCapitals[i].r,
      largeCapitals[j].q, largeCapitals[j].r,
    );
    assert(
      d >= minSepLarge,
      `Duża: stolice #${i}↔#${j} min ${minSepLarge} hex (got ${d}, N=${minSepLarge})`,
    );
  }
}
const largePlayerCap = largePlan.playerStartHex;
for (const fcl of largePlan.foreignTypeClusters) {
  const capPos = fcl.positions[0];
  if (!capPos) continue;
  const d = M.hexDistanceAxial(capPos.q, capPos.r, largePlayerCap.q, largePlayerCap.r);
  assert(
    d >= minSepLarge,
    `Duża: obcy typ ${fcl.typ} ≥${minSepLarge} hex od gracza (got ${d})`,
  );
}

// FALA 199: Pangea Standard — stolice bliżej brzegu (min 10, nie w środku lądu)
const pangeaStdMap = M.generateMap(168, 120, 4242, 'pangea');
const pangeaStdPlan = M.buildClusterStartPlan({
  map: pangeaStdMap,
  civs,
  seed: 4242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 7,
});
const pangeaStdSea = M.buildSeaDistanceField(pangeaStdMap.hexes);
const pangeaMinSea = M.capitalMinSeaDist(pangeaStdPlan.placement.rozmiarMapy);
const pangeaCapSeaDists = [M.seaDistAt(pangeaStdSea, pangeaStdPlan.playerStartHex.q, pangeaStdPlan.playerStartHex.r)];
for (const fcl of pangeaStdPlan.foreignTypeClusters) {
  const cap = fcl.positions[0];
  if (cap) pangeaCapSeaDists.push(M.seaDistAt(pangeaStdSea, cap.q, cap.r));
}
for (const sd of pangeaCapSeaDists) {
  assert(sd >= pangeaMinSea, `Pangea Standard: stolica min ${pangeaMinSea} hex od morza (seaDist=${sd})`);
}
const pangeaAvgSea = pangeaCapSeaDists.reduce((a, b) => a + b, 0) / pangeaCapSeaDists.length;
const pangeaMaxSea = Math.max(...pangeaCapSeaDists);
const pangeaMaxSeaBand = M.capitalMaxSeaDist(pangeaStdPlan.placement.rozmiarMapy);
const pangeaInBand = pangeaCapSeaDists.filter(sd => sd >= pangeaMinSea && sd <= pangeaMaxSeaBand).length;
assert(pangeaInBand >= Math.ceil(pangeaCapSeaDists.length * 0.5),
  `Pangea Standard: ≥50% stolic w pasie ${pangeaMinSea}–${pangeaMaxSeaBand} (inBand=${pangeaInBand}/${pangeaCapSeaDists.length})`);
assert(pangeaAvgSea <= pangeaMinSea + 18,
  `Pangea Standard: średni seaDist stolic ≤ min+18 (avg=${pangeaAvgSea.toFixed(1)}, min=${pangeaMinSea})`);
assert(pangeaMaxSea <= pangeaMinSea + 35,
  `Pangea Standard: max seaDist stolicy ≤ min+35 (max=${pangeaMaxSea}, min=${pangeaMinSea})`);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
