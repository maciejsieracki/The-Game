'use strict';
/** node tools/cluster-start-test.cjs — D-START klaster + spawn */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.cluster-start-entry.ts');
const bundle = path.join(__dirname, '.cluster-start-bundle.cjs');

fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { buildClusterSpawnPlan, buildSameTypeRivalSlots, groupForeignTypeClusters } from '../src/map/cluster-spawn';
export { generateMap } from '../src/map/generator';
export { MIN_DIST_START_CITY_STATE, MIN_DIST_FOREIGN_FROM_PLAYER, MIN_DIST_FOREIGN_IN_CLUSTER, clusterPackRadius } from '../src/map/clusters';
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
const foreignCount = plan.placement.klastry.length - 1;
assert(plan.typCityCopyOwners.size === plan.spawnCities.length - plan.clusterCapitalOwnerIds.length,
  'typCityCopyOwners = państwa bez stolic klastrów');
assert(plan.clusterCapitalOwnerIds.length === foreignCount,
  'każdy obcy typ ma stolicę klastra (ekspansyjna AI)');
assert(plan.pendingSameTypeRivalHexes.length === plan.pendingSameTypeRivals,
  'pre-planowane hexy państw gracza');

// Symulacja: gracz założył miasto → spawn państw z pre-planu klastra
const deferredHexes = plan.pendingSameTypeRivalHexes;
assert(deferredHexes.length === 4, '4 deferred same-type po founding');
const sameType = deferredHexes.map((h, i) => ({ q: h.q, r: h.r, name: 'mp' + (i + 1), ownerId: i + 1 }));
for (const oid of [1, 2, 3, 4]) {
  assert(!plan.simplifiedDiplomacyOwners.has(oid), `deferred owner ${oid} spoza startu`);
}

assert(plan.foreignTypeClusters.length === foreignCount, `${foreignCount} obcych typów (klastry na mapie)`);
for (const fc of plan.foreignTypeClusters) {
  assert(fc.positions.length >= 2, `obcy typ ${fc.typ}: ≥2 miasta (${fc.positions.length})`);
  assert(fc.ownerIds.length === fc.positions.length, `obcy typ ${fc.typ}: ownerIds = positions`);
  for (const oid of fc.ownerIds) {
    assert(plan.aiOwnerCivMap.get(oid) === fc.typ, `owner ${oid} → typ ${fc.typ}`);
  }
}

const chinczycy = plan.foreignTypeClusters.find(fc => fc.typ === 'chinczycy');
if (chinczycy) {
  const chinskie = plan.spawnCities.filter(c => chinczycy.ownerIds.includes(c.ownerId));
  assert(chinskie.length >= 2, 'Chińczycy: ≥2 chińskie miasta AI');
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

// Maciej 2026-07-04 / 2026-07-07: odległości startu + ciasny klaster
const playerCap = plan.playerStartHex;
const packR = M.clusterPackRadius(5, M.MIN_DIST_START_CITY_STATE);
for (let i = 0; i < sameType.length; i++) {
  for (let j = i + 1; j < sameType.length; j++) {
    const d = M.hexDistanceAxial(sameType[i].q, sameType[i].r, sameType[j].q, sameType[j].r);
    assert(d >= M.MIN_DIST_START_CITY_STATE, `miasta-panstwa >= ${M.MIN_DIST_START_CITY_STATE} hex (${d})`);
  }
  const dCore = M.hexDistanceAxial(sameType[i].q, sameType[i].r, playerCap.q, playerCap.r);
  assert(dCore <= packR + M.MIN_DIST_START_CITY_STATE, `rywal w packRadius od rdzenia (${dCore} <= ${packR + M.MIN_DIST_START_CITY_STATE})`);
}
const foreignCities = plan.spawnCities.filter(c => plan.foreignTypeOwners.has(c.ownerId));
for (const fc of foreignCities) {
  const d = M.hexDistanceAxial(fc.q, fc.r, playerCap.q, playerCap.r);
  assert(d >= M.MIN_DIST_FOREIGN_FROM_PLAYER, `obcy typ >= ${M.MIN_DIST_FOREIGN_FROM_PLAYER} hex od stolicy gracza (${d})`);
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
        dc <= fPackR + M.MIN_DIST_FOREIGN_IN_CLUSTER,
        `obcy ${fcl.typ} w packRadius centrum (${dc})`,
      );
    }
  }
}
assert(plan.placement.minDystansMiastaPanstwa === 3, 'placement minDystansMiastaPanstwa=3');
assert(plan.placement.minDystansObcyOdGracza === 12, 'placement minDystansObcyOdGracza=12');
assert(M.MIN_DIST_FOREIGN_IN_CLUSTER === 3, 'MIN_DIST_FOREIGN_IN_CLUSTER=3');

// Stolica gracza na krawędzi klastra (dalej od centrum niż średnie państwo)
const playerKlaster = plan.placement.klastry.find(k => k.typ === 'grecy');
if (playerKlaster && sameType.length > 0) {
  const capD = M.hexDistanceAxial(
    plan.playerStartHex.q, plan.playerStartHex.r,
    playerKlaster.centrum.q, playerKlaster.centrum.r,
  );
  const avgStateD = sameType.reduce((s, st) =>
    s + M.hexDistanceAxial(st.q, st.r, playerKlaster.centrum.q, playerKlaster.centrum.r), 0,
  ) / sameType.length;
  assert(capD >= avgStateD - 1, `stolica gracza na obwodzie klastra (cap=${capD} avgState=${avgStateD})`);
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
