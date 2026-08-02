'use strict';
/** node tools/capital-sep-pangea-test.cjs — twarda bramka sep stolic różnych civ (≥N hex) */

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.capital-sep-entry.ts');
const bundle = path.join(__dirname, '.capital-sep-bundle.cjs');

fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride } from '../src/map/riverGenSwitch';
export { capitalMinSeparationForMap } from '../src/map/clusters';
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
  const caps = [{ label: 'player', q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
  for (const fcl of plan.foreignTypeClusters) {
    const capPos = fcl.positions[0];
    if (!capPos) continue;
    caps.push({ label: fcl.typ, q: capPos.q, r: capPos.r });
  }
  return caps;
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
  const N = M.capitalMinSeparationForMap(plan.placement.rozmiarMapy, w, h);
  const minObcy = plan.placement.minDystansObcyOdGracza;
  const caps = collectCapitals(plan);
  const violations = [];
  for (let i = 0; i < caps.length; i++) {
    for (let j = i + 1; j < caps.length; j++) {
      const d = M.hexDistanceAxial(caps[i].q, caps[i].r, caps[j].q, caps[j].r);
      if (d < N) {
        violations.push({ kind: 'sep', a: caps[i].label, b: caps[j].label, d, ...caps[i], ...caps[j] });
      }
    }
  }
  const playerCap = caps[0];
  if (playerCap && minObcy > 0) {
    for (let i = 1; i < caps.length; i++) {
      const d = M.hexDistanceAxial(playerCap.q, playerCap.r, caps[i].q, caps[i].r);
      if (d < minObcy) {
        violations.push({ kind: 'obcy', a: 'player', b: caps[i].label, d, minObcy });
      }
    }
  }
  return { seed, N, minObcy, caps: caps.length, violations };
}

const cases = [
  { label: 'Standard Pangea 168×120', w: 168, h: 120, typ: 'pangea', seeds: [4242, 7777], rywale: 6, typy: 8, epoch: 'kamien' },
  { label: 'Duża Pangea 240×168', w: 240, h: 168, typ: 'pangea', seeds: [4242], rywale: 6, typy: 12, epoch: 'zelazo' },
];

let failed = 0;
let passed = 0;

console.log('capital-sep-pangea-test (twardy assert ≥N, zero tolerancji)\n');

for (const c of cases) {
  for (const seed of c.seeds) {
    process.stdout.write(`[${c.label}] seed=${seed} … `);
    const map = M.generateMap(c.w, c.h, seed, c.typ);
    const result = checkPlan(map, seed, c.w, c.h, c.typ, c.rywale, c.typy, c.epoch);
    if (result.violations.length === 0) {
      console.log(`PASS N=${result.N} obcy≥${result.minObcy} caps=${result.caps}`);
      passed++;
    } else {
      console.log(`FAIL N=${result.N} obcy≥${result.minObcy} caps=${result.caps}`);
      for (const v of result.violations) {
        const limit = v.kind === 'obcy' ? v.minObcy : result.N;
        console.error(`  VIOLATION [${v.kind}]: ${v.a} ↔ ${v.b} = ${v.d} hex < ${limit}`);
      }
      failed++;
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
