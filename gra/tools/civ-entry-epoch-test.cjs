'use strict';
/** node tools/civ-entry-epoch-test.cjs — kaskada epokaWejscia (D-CYW-EPOKA-WEJSCIA) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-entry-epoch-entry.ts');
const bundle = path.join(__dirname, '.civ-entry-epoch-bundle.cjs');

fs.writeFileSync(entry, `
export {
  isCivAvailableAtGameEpoch,
  civIdsAvailableAtGameEpoch,
  getCivEpokaWejscia,
} from '../src/game/civ-entry-epoch';
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
const civs = require('../data/civs.json').cywilizacje;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-entry-epoch-test (kaskada)\n');

const kamien = M.civIdsAvailableAtGameEpoch(civs, 'kamien');
assert(kamien.length === 8, 'Kamień: 8 typów (bez Brązu/Żelaza-only)');
assert(kamien.includes('grecy') && kamien.includes('harappa'), 'Kamień: Grecy + Harappa');
assert(!kamien.includes('hetyci') && !kamien.includes('slowianie'), 'Kamień: bez Hetytów i Słowian');

const braz = M.civIdsAvailableAtGameEpoch(civs, 'braz');
assert(braz.length === 14, 'Brąz: 14 typów (8 kamien + 6 braz)');
assert(braz.includes('hetyci') && braz.includes('celtowie'), 'Brąz: Hetyci + Celtowie');
assert(braz.includes('inkowie') && braz.includes('fenicjanie'), 'Brąz: Inkowie + Fenicjanie (kaskada)');
assert(!braz.includes('slowianie'), 'Brąz: bez Słowian (Żelazo-only)');

const zelazo = M.civIdsAvailableAtGameEpoch(civs, 'zelazo');
assert(zelazo.length === 15, 'Żelazo: wszystkie 15 typów');
assert(zelazo.includes('slowianie') && zelazo.includes('fenicjanie'), 'Żelazo: Słowianie + Fenicjanie');

const ink = civs.find(c => c.ikonaId === 'inkowie');
assert(M.getCivEpokaWejscia(ink) === 'kamien', 'Inkowie epokaWejscia = kamien');
assert(M.isCivAvailableAtGameEpoch(ink, 'zelazo'), 'Inkowie dostępni od Żelaza (kaskada)');

console.log('\nciv-entry-epoch-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
