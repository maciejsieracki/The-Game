'use strict';
/** node tools/start-preview-test.cjs */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.start-preview-entry.ts');
const bundle = path.join(__dirname, '.start-preview-bundle.cjs');

fs.writeFileSync(entry, `
export { buildStartPreview, startPreviewSummaryRows } from '../src/game/start-preview';
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

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

const p = M.buildStartPreview({
  civs,
  playerCivId: 'grecy',
  mapSizeMenuLabel: 'Standardowy',
});

assert(p.playerCapitalName === 'Ateny', 'stolica Grecy');
assert(p.sameTypeRivalCount === 12, '12 rywali standard (balans ×2, 2026-07-20)');
assert(p.sameTypeRivalNames[0] === 'Sparta', 'rywal [1] Sparta');
assert(p.activeTypesOnMap === 12, '12 typow standard (balans ×2, 2026-07-20)');
assert(p.foreignTypesCount === 11, '11 obcych typow');
assert(M.startPreviewSummaryRows(p).length === 4, '4 wiersze UI');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
