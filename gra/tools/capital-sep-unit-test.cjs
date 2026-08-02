'use strict';
/** node tools/capital-sep-unit-test.cjs — szybki test N i bramki (bez pełnej Pangea) */

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.capital-sep-unit-entry.ts');
const bundle = path.join(__dirname, '.capital-sep-unit-bundle.cjs');

fs.writeFileSync(entry, `
export {
  capitalMinSeaDist,
  capitalMinSeaDistForMap,
  capitalMinSeparation,
  capitalMinSeparationForMap,
  passesMinCapitalSeparationGate,
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

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

// Tabela bazowa — seaDist (Standard=10) vs sep stolic (FALA 182: Standard=14, floor 12)
assert(M.capitalMinSeaDist('duza') === 10, 'seaDist Standard/duza = 10');
assert(M.capitalMinSeparation('duza') === 14, 'sep stolic Standard = 14');
assert(M.capitalMinSeparation('mala') === 12, 'sep Mała = 12');
assert(M.capitalMinSeparation('srednia') === 12, 'sep Średnia = 12');
assert(M.capitalMinSeparation('ogromna') === 16, 'sep Duża/ogromna = 16');
assert(M.capitalMinSeparation('super') === 19, 'sep Super = 19');

// FALA 176/179: brak ścinania dimCap short/12
assert(M.capitalMinSeaDistForMap('duza', 168, 120) === 10, 'sea ForMap 168×120 → 10');
assert(M.capitalMinSeparationForMap('duza', 168, 120) === 14, 'sep ForMap 168×120 → 14');
assert(M.capitalMinSeaDistForMap('duza', 120, 100) === 10, 'sea ForMap 120×100 → 10');
assert(M.capitalMinSeparationForMap('duza', 120, 100) === 14, 'sep ForMap 120×100 → 14');
assert(M.capitalMinSeaDistForMap('duza', 50, 50) === 0, 'sea ForMap 50×50 → 0 (harness)');
assert(M.capitalMinSeparationForMap('duza', 50, 50) === 0, 'sep ForMap 50×50 → 0 (harness)');

assert(M.capitalMinSeaDistForMap('ogromna', 240, 168) === 12, 'sea Duża = 12');
assert(M.capitalMinSeparationForMap('ogromna', 240, 168) === 16, 'sep Duża = 16');

// Bramka
const priors = [{ q: 0, r: 0 }];
assert(M.passesMinCapitalSeparationGate({ q: 14, r: 0 }, priors, 14) === true, 'd=14 → OK');
assert(M.passesMinCapitalSeparationGate({ q: 13, r: 0 }, priors, 14) === false, 'd=13 → FAIL');
assert(M.passesMinCapitalSeparationGate({ q: 0, r: 0 }, [], 14) === true, 'brak prior → OK');

// FALA 182: tabela sep spójna — Mała/Średnia 12, Standard 14, Duża 16, Super 19
assert(M.capitalMinSeparation('duza') === 14, 'FALA182: Standard (duza) sep=14');
assert(M.capitalMinSeparation('ogromna') === 16, 'FALA182: Duża (ogromna) sep=16');
assert(M.capitalMinSeparationForMap('ogromna', 240, 168) === 16, 'FALA182: Duża map sep=16');
// minDystObcyOdGracza = max(12 floor, minDystKlastrow) → na Dużej 16, nie hardcode 12
assert(Math.max(12, M.capitalMinSeparationForMap('ogromna', 240, 168)) === 16,
  'FALA182: obcy od gracza na Dużej ≥16 (nie 12)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
