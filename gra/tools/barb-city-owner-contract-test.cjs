'use strict';

/** R-BARB-ZDOBYCIE-MIAST-Q1 — realny kontrakt ownera po zdobyciu miasta. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.barb-city-owner-contract-entry.ts');
const bundle = path.join(__dirname, '.barb-city-owner-contract-bundle.cjs');
fs.writeFileSync(entry, `
export { BARBARIAN_OWNER_ID } from ${JSON.stringify(path.join(root, 'src/game/barbarians'))};
export { applyCityCaptureAfterBattle } from ${JSON.stringify(path.join(root, 'src/game/post-battle-map'))};
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
} catch (error) {
  console.error('[barb-city-owner-contract-test] bundle failed:', error.message || error);
  process.exit(1);
}

const { BARBARIAN_OWNER_ID, applyCityCaptureAfterBattle } = require(bundle);
let passed = 0;
function eq(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
  passed++;
}

const captured = { id: 'city-barb', ownerId: 2, q: 1, r: 1, name: 'Miasto' };
const barb = { id: 'barb', ownerId: BARBARIAN_OWNER_ID, q: 1, r: 1, ruchLeft: 1 };
applyCityCaptureAfterBattle(captured, [barb], BARBARIAN_OWNER_ID, [barb], barb.id);
eq(BARBARIAN_OWNER_ID, -1, 'sentinel barbarzyńców');
eq(captured.ownerId, BARBARIAN_OWNER_ID, 'zdobyte miasto dostaje ownera barbarzyńców');

const recaptured = { id: 'city-recapture', ownerId: BARBARIAN_OWNER_ID, q: 2, r: 2, name: 'Odbite' };
const ai = { id: 'ai', ownerId: 3, q: 2, r: 2, ruchLeft: 1 };
applyCityCaptureAfterBattle(recaptured, [ai], 3, [ai], ai.id);
eq(recaptured.ownerId, 3, 'miasto barbarzyńskie pozostaje odbijalne przez AI');

console.log(`[barb-city-owner-contract-test] ${passed}/${passed} PASS`);
