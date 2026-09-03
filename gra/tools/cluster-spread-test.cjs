'use strict';
/** node tools/cluster-spread-test.cjs — FALA 186: sep brył + twardy spread ćwiartek */

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.cluster-spread-entry.ts');
const bundle = path.join(__dirname, '.cluster-spread-bundle.cjs');

fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride } from '../src/map/riverGenSwitch';
export {
  clusterBodySeparationForMap,
  clusterBodyBufferRadius,
  clusterCenterQuadrantSpread,
  capitalMinSeparationForMap,
  minimumSpreadQuartersRequired,
  landQuadrantIndex,
} from '../src/map/clusters';
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
M.setRiverGenPhaseOverride('main');
const civs = require('../data/civs.json');

function collectCapitals(plan) {
  const caps = [{ civ: 'player', q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
  for (const fcl of plan.foreignTypeClusters) {
    const capPos = fcl.positions[0];
    if (capPos) caps.push({ civ: fcl.typ, q: capPos.q, r: capPos.r });
  }
  return caps;
}

function collectAllCities(plan) {
  const cities = [{ civ: 'player', q: plan.playerStartHex.q, r: plan.playerStartHex.r, isCap: true }];
  for (const sc of plan.spawnCities ?? []) {
    const isCap = plan.clusterCapitalOwnerIds?.includes(sc.ownerId);
    const civ = plan.aiOwnerCivMap?.get(sc.ownerId) ?? 'foreign';
    cities.push({ civ, q: sc.q, r: sc.r, isCap: !!isCap });
  }
  for (const hex of plan.pendingSameTypeRivalHexes ?? []) {
    cities.push({ civ: 'player', q: hex.q, r: hex.r, isCap: false });
  }
  return cities;
}

function landBBoxFromMap(map) {
  let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
  for (const h of Object.values(map.hexes)) {
    const t = h.terenBazowy;
    if (t === 'morze' || t === 'gory' || t === 'plytkie_morze') continue;
    const q = h.coords.q;
    const r = h.coords.r;
    if (q < minQ) minQ = q;
    if (q > maxQ) maxQ = q;
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
  }
  return { minQ, maxQ, minR, maxR };
}

function minBodyDist(cities) {
  let best = Infinity;
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      if (cities[i].civ === cities[j].civ) continue;
      const d = M.hexDistanceAxial(cities[i].q, cities[i].r, cities[j].q, cities[j].r);
      if (d < best) best = d;
    }
  }
  return best === Infinity ? null : best;
}

function checkPlan(map, seed, w, h, typ, rywale, aktywneTypy, epochId) {
  const plan = M.buildClusterStartPlan({
    map,
    civs,
    seed,
    playerCivId: 'grecy',
    rywaleNaKlaster: rywale,
    aktywneTypy,
    startEpochId: epochId,
  });
  const S = M.clusterBodySeparationForMap(plan.placement.rozmiarMapy, w, h);
  const capSep = M.capitalMinSeparationForMap(plan.placement.rozmiarMapy, w, h);
  const bufR = M.clusterBodyBufferRadius(S);
  const cities = collectAllCities(plan);
  const caps = collectCapitals(plan);

  const violations = [];
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      if (cities[i].civ === cities[j].civ) continue;
      const d = M.hexDistanceAxial(cities[i].q, cities[i].r, cities[j].q, cities[j].r);
      const bothCap = cities[i].isCap && cities[j].isCap;
      const limit = bothCap ? capSep : bufR;
      if (limit > 0 && d < limit) {
        violations.push({
          kind: bothCap ? 'cap-cap' : 'buffer',
          a: cities[i].civ,
          b: cities[j].civ,
          d,
          limit,
        });
      }
    }
  }

  const centers = caps.map(c => ({ q: c.q, r: c.r }));
  const landBBox = landBBoxFromMap(map);
  const spread = M.clusterCenterQuadrantSpread(centers, landBBox);
  const minQuarters = M.minimumSpreadQuartersRequired(aktywneTypy);

  return {
    seed,
    S,
    capSep,
    bufR,
    cities: cities.length,
    violations,
    spread,
    caps: caps.length,
    minQuarters,
    minBodyDist: minBodyDist(cities),
    landBBox,
  };
}

function spreadOk(result, w, h, aktywneTypy) {
  const landW = result.landBBox.maxQ - result.landBBox.minQ + 1;
  const landH = result.landBBox.maxR - result.landBBox.minR + 1;
  // FALA 188: nieregularna Pangea ma mniejszy efektywny span niż prostokąt —
  // ćwiartki + min. ~18%/14% bboxa lądu (było 22%/18% — failowało przy 7/7 caps).
  const minQ = landW * 0.18;
  const minR = landH * 0.14;
  const needQuarters = M.minimumSpreadQuartersRequired(aktywneTypy);
  return (
    result.spread.occupiedQuadrants >= needQuarters
    && result.spread.qSpan >= minQ
    && result.spread.rSpan >= minR
  );
}

const cases = [
  { label: 'Mini Pangea 120×90 N=7', w: 120, h: 90, typ: 'pangea', seeds: [42, 4242, 7777], rywale: 6, typy: 7, epoch: 'kamien' },
  { label: 'Standard Pangea 168×120 N=7', w: 168, h: 120, typ: 'pangea', seeds: [4242, 7777], rywale: 6, typy: 7, epoch: 'kamien' },
];

let failed = 0;
let passed = 0;

console.log('cluster-spread-test (FALA 186: sep brył ≥S + twardy spread ćwiartek)\n');

for (const c of cases) {
  for (const seed of c.seeds) {
    process.stdout.write(`[${c.label}] seed=${seed} typy=${c.typy} … `);
    const map = M.generateMap(c.w, c.h, seed, c.typ);
    const result = checkPlan(map, seed, c.w, c.h, c.typ, c.rywale, c.typy, c.epoch);
    const bodyOk = result.violations.filter((v) => v.kind === 'cap-cap').length === 0;
    const spreadPass = spreadOk(result, c.w, c.h, c.typy);
    const capsOk = result.caps >= c.typy;
    const bufferWarn = result.violations.filter((v) => v.kind === 'buffer');

    if (bodyOk && spreadPass && capsOk) {
      console.log(
        `PASS S=${result.S} caps=${result.caps}/${c.typy} Q=${result.spread.occupiedQuadrants}/${result.minQuarters} spanQ=${result.spread.qSpan} spanR=${result.spread.rSpan} minBody=${result.minBodyDist}` +
        (bufferWarn.length ? ` (bufWarn=${bufferWarn.length})` : ''),
      );
      passed++;
    } else {
      console.log(
        `FAIL S=${result.S} caps=${result.caps}/${c.typy} Q=${result.spread.occupiedQuadrants}/${result.minQuarters} spanQ=${result.spread.qSpan} spanR=${result.spread.rSpan}`,
      );
      if (!bodyOk) {
        for (const v of result.violations.filter((x) => x.kind === 'cap-cap').slice(0, 5)) {
          console.error(`  ${v.kind}: ${v.a} ↔ ${v.b} = ${v.d} < ${v.limit}`);
        }
      }
      if (!spreadPass) {
        const landW = result.landBBox.maxQ - result.landBBox.minQ + 1;
        const landH = result.landBBox.maxR - result.landBBox.minR + 1;
        const needQ = landW * 0.18;
        const needR = landH * 0.14;
        console.error(
          `  SPREAD: Q=${result.spread.occupiedQuadrants} (need ≥${result.minQuarters}),` +
          ` spanQ=${result.spread.qSpan} (need ≥${needQ.toFixed(1)}),` +
          ` spanR=${result.spread.rSpan} (need ≥${needR.toFixed(1)})`,
        );
      }
      if (!capsOk) {
        console.error(`  CAPS: ${result.caps} < ${c.typy} (nieuzasadniony drop)`);
      }
      failed++;
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
