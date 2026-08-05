'use strict';
/**
 * surowce-dostep-test.cjs — R-SUROWCE-DOSTEP GAP: wiersze dostępu mają cap null.
 * Run: node tools/surowce-dostep-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.surowce-dostep-entry.ts');
const BUNDLE = path.resolve(__dirname, '.surowce-dostep-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  EMPIRE_ACCESS_RESOURCE_IDS,
  isEmpireAccessResource,
  partitionEmpireResourceRows,
} from '../src/game/empire-resource-access.ts';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  EMPIRE_ACCESS_RESOURCE_IDS,
  isEmpireAccessResource,
  partitionEmpireResourceRows,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

ok(EMPIRE_ACCESS_RESOURCE_IDS.has('ceramika'), 'ceramika w zestawie dostępu');
ok(EMPIRE_ACCESS_RESOURCE_IDS.has('sol'), 'sól w zestawie dostępu');
ok(EMPIRE_ACCESS_RESOURCE_IDS.has('kon'), 'koń w zestawie dostępu');
ok(EMPIRE_ACCESS_RESOURCE_IDS.has('zloto'), 'złoto w zestawie dostępu');
ok(EMPIRE_ACCESS_RESOURCE_IDS.size === 4, 'dokładnie 4 surowce dostępu');

ok(isEmpireAccessResource('zloto'), 'isEmpireAccessResource(zloto)');
ok(!isEmpireAccessResource('drewno'), 'drewno nie jest dostępem');
ok(!isEmpireAccessResource('kamien'), 'kamień nie jest dostępem');

const mockRows = [
  { id: 'drewno', cap: 200, dostep: true },
  { id: 'ceramika', cap: undefined, dostep: false },
  { id: 'sol', cap: undefined, dostep: true },
  { id: 'kon', cap: undefined, dostep: false },
  { id: 'zloto', cap: undefined, dostep: false },
  { id: 'kamien', cap: 200, dostep: true },
];

const { stored, access } = partitionEmpireResourceRows(mockRows);
ok(stored.length === 2 && stored.every(r => r.cap != null), 'magazynowane: drewno + kamień');
ok(access.length === 4, 'dostęp: ceramika + sól + koń + złoto');
ok(access.some(r => r.id === 'zloto'), 'złoto w podsekcji dostępu');
ok(access.every(r => r.cap == null), 'wszystkie wiersze dostępu mają cap null');

const gapRow = { id: 'zloto', cap: 200, dostep: false };
const gapPart = partitionEmpireResourceRows([gapRow]);
ok(gapPart.access.length === 1 && gapPart.stored.length === 0,
  'zloto z cap=200 i tak trafia do access (id w EMPIRE_ACCESS_RESOURCE_IDS)');

console.log(`\nsurowce-dostep: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
