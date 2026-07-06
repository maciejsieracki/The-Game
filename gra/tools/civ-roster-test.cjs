'use strict';
/** node tools/civ-roster-test.cjs — E1-D-Q1=A roster startowy */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-roster-entry.ts');
const bundle = path.join(__dirname, '.civ-roster-bundle.cjs');

fs.writeFileSync(entry, `
export {
  assignAiCivTypes,
  pickActiveCivPool,
  civIdsFromRoster,
  civIdsAvailableAtGameEpoch,
} from '../src/game/civ-roster';
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
const civs = require('../data/civs.json');
const ALL = M.civIdsFromRoster(civs.cywilizacje);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-roster-test (E1-D-Q1=A)\n');

assert(ALL.length === 15, 'roster ma 15 ikonaId');

const poolSmall = M.pickActiveCivPool(ALL, 'rzymianie', 3, 2, 42);
assert(poolSmall.length === 3, 'mala: 3 typy (gracz+2 AI cap)');
assert(poolSmall.includes('rzymianie'), 'mala: zawiera nacje gracza');
assert(new Set(poolSmall).size === poolSmall.length, 'mala: unikalne typy');

const poolStd = M.pickActiveCivPool(ALL, 'grecy', 7, 6, 99);
assert(poolStd.length === 7, 'standard: 7 typow przy 6 AI');
assert(new Set(poolStd).size === 7, 'standard: 7 unikalnych');

const map1 = M.assignAiCivTypes({
  allCivIds: ALL,
  playerCivId: 'rzymianie',
  aiOwnerIds: [1, 2, 3, 4, 5, 6],
  aktywneTypy: 7,
  seed: 12345,
});
const map2 = M.assignAiCivTypes({
  allCivIds: ALL,
  playerCivId: 'rzymianie',
  aiOwnerIds: [1, 2, 3, 4, 5, 6],
  aktywneTypy: 7,
  seed: 12345,
});
assert(JSON.stringify([...map1]) === JSON.stringify([...map2]), 'deterministyczny seed');

const assigned = [...map1.values()];
assert(!assigned.includes('rzymianie'), 'AI nie dostaje typu gracza');
assert(new Set(assigned).size === assigned.length, 'AI: unikalne typy');

const mapFew = M.assignAiCivTypes({
  allCivIds: ALL,
  playerCivId: 'inkowie',
  aiOwnerIds: [1, 2],
  aktywneTypy: 7,
  seed: 7,
});
assert(mapFew.size === 2, '2 AI -> 2 wpisy');
const poolFew = M.pickActiveCivPool(ALL, 'inkowie', 7, 2, 7);
assert(poolFew.length === 3, '4 AI slotow ale tylko 2 AI -> 3 typy na mapie');

const kamienPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'kamien');
const mapKamien = M.assignAiCivTypes({
  allCivIds: kamienPool,
  playerCivId: 'egipt',
  aiOwnerIds: [1, 2, 3],
  aktywneTypy: 4,
  seed: 555,
});
for (const id of mapKamien.values()) {
  assert(kamienPool.includes(id), 'AI roster filtrowany po epoce Kamienia: ' + id);
}

console.log('\nciv-roster-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
