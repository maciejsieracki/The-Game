'use strict';
/**
 * H-TARTAK-DREWNO-PRODUKCJA-Q1
 * Real resolver path: computeTerritoryResourceYieldByCity -> terrain-improvements.
 * Tartak: 200 / 300 / 450 Drewna per turn in owner eras 1 / 2 / 3.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entry = path.resolve(__dirname, '.tartak-drewno-epoka-entry.ts');
const bundle = path.resolve(__dirname, '.tartak-drewno-epoka-bundle.cjs');
fs.writeFileSync(entry, `
export { computeTerritoryResourceYieldByCity } from '../src/game/turn-economy';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const { computeTerritoryResourceYieldByCity } = require(bundle);

let passed = 0;
let failed = 0;
function eq(actual, expected, message) {
  if (actual === expected) { passed += 1; console.log(`  [OK] ${message}`); }
  else { failed += 1; console.error(`  [FAIL] ${message}: got=${actual}, want=${expected}`); }
}
function makeMap(tartakCount, includeQuarry = false) {
  const hexes = {};
  for (let i = 0; i < tartakCount; i += 1) {
    hexes[`${i + 1},0`] = { coords: { q: i + 1, r: 0 }, ulepszenia: ['tartak'] };
  }
  if (includeQuarry) {
    hexes['9,0'] = { coords: { q: 9, r: 0 }, ulepszenia: ['kamieniolom'] };
  }
  return { hexes };
}
const cities = [{ id: 'c1', q: 0, r: 0, ownerId: 7 }];
const territoryNodes = [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 7 }];
function wood(tartakCount, era, includeQuarry = false) {
  const result = computeTerritoryResourceYieldByCity(
    cities,
    makeMap(tartakCount, includeQuarry),
    territoryNodes,
    ownerId => ownerId === 7 ? era : 1,
  );
  return result.get('c1')?.drewno ?? 0;
}

console.log('\n[H-TARTAK-DREWNO-PRODUKCJA-Q1]');
for (const era of [1, 2, 3]) {
  eq(wood(0, era), 0, `era ${era}: 0 Tartaków = 0 Drewna`);
  eq(wood(1, era), [200, 300, 450][era - 1], `era ${era}: 1 Tartak = ${[200, 300, 450][era - 1]} Drewna`);
  eq(wood(2, era), [400, 600, 900][era - 1], `era ${era}: 2 Tartaki = ${[400, 600, 900][era - 1]} Drewna`);
}
// Mutation-red test: adding a real second improvement changes the same resolver result.
const mutated = makeMap(1);
const before = computeTerritoryResourceYieldByCity(cities, mutated, territoryNodes, () => 3)
  .get('c1')?.drewno ?? 0;
mutated.hexes['2,0'] = { coords: { q: 2, r: 0 }, ulepszenia: ['tartak'] };
const after = computeTerritoryResourceYieldByCity(cities, mutated, territoryNodes, () => 3)
  .get('c1')?.drewno ?? 0;
eq(before, 450, 'mutacja przed: 1 Tartak w epoce 3 = 450');
eq(after, 900, 'mutacja po: dodanie 2. Tartaku w epoce 3 = 900');
// Non-target regression guard: quarry remains 50/t and is not multiplied by Tartak era scaling.
const withQuarry = computeTerritoryResourceYieldByCity(cities, makeMap(1, true), territoryNodes, () => 3)
  .get('c1') || {};
eq(withQuarry.kamien, 50, 'brak regresji: Kamieniołom pozostaje 50 Kamienia/turę');

if (failed) {
  console.error(`\nFAILED: ${failed} assertion(s), passed=${passed}`);
  process.exit(1);
}
console.log(`\nPASS: ${passed} assertions`);
