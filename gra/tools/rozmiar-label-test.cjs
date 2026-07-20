'use strict';
/** node tools/rozmiar-label-test.cjs — regresja mapowania etykiet PL (Duży→duzy) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.rozmiar-label-entry.ts');
const bundle = path.join(__dirname, '.rozmiar-label-bundle.cjs');

fs.writeFileSync(
  entry,
  `export { rozmiarFromMenuLabel, menuLabelToDims, ROZMIAR_MENU_LABELS } from '../src/map/generator';
export { eStartHexDims, eStartMiastaPanstwa } from '../src/data/e-start-params-loader';`,
  'utf8',
);

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

console.log('rozmiar-label-test\n');

assert(M.rozmiarFromMenuLabel('Duży') === 'duzy', 'Duży → klucz duzy');
assert(M.rozmiarFromMenuLabel('Mały') === 'maly', 'Mały → maly');
const duzy = M.menuLabelToDims('Duży');
assert(duzy.w === 240 && duzy.h === 168, 'Duży → 240×168 (' + duzy.w + '×' + duzy.h + ')');
const std = M.menuLabelToDims('Standardowy');
assert(std.w === 168 && std.h === 120, 'Standardowy → 168×120');
assert(duzy.w * duzy.h === 40320, 'Duży → 40320 heksów');

const eDims = M.eStartHexDims('Duży');
assert(eDims && eDims[0] === 240 && eDims[1] === 168, 'Panel-E Duży hex dims');
assert(M.eStartMiastaPanstwa('Duży') === 14, 'Panel-E Duży miasta_panstwa=14');

for (const label of M.ROZMIAR_MENU_LABELS) {
  const key = M.rozmiarFromMenuLabel(label);
  assert(key !== 'standardowy' || label === 'Standardowy', label + ' nie pada na standardowy');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
