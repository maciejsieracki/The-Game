'use strict';
/** P6 — diplomacy-unit-transfer.ts */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-unit-transfer-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-unit-transfer-bundle.cjs');
const UNITS_JSON = path.resolve(__dirname, '..', 'data', 'units.json');

fs.writeFileSync(ENTRY, `
export { spawnTransferredUnit } from '../src/game/diplomacy-unit-transfer';
export { diplomacyPnJednostka } from '../src/game/diplomacy-value-catalog';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
const unitsData = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeCtx(overrides = {}) {
  let seq = 0;
  const capital = new Map([[1, { q: 5, r: 5 }]]);
  return {
    units: [],
    capitalHexByOwner: capital,
    allocateUnitId: () => `xfer-${++seq}`,
    getUnitDef: (typeId) => unitsData.find(u => u.Jednostka === typeId),
    ...overrides,
  };
}

eq(D.diplomacyPnJednostka('Wojownik'), 10, 'PN cost Wojownik');

// spawn at capital
const ctx1 = makeCtx();
const r1 = D.spawnTransferredUnit('Wojownik', 1, null, ctx1);
ok(r1.ok, 'spawn ok');
eq(r1.pnCost, 10, 'pnCost');
eq(r1.unit.ownerId, 1, 'owner');
eq(r1.unit.typeId, 'Wojownik', 'typeId');
eq(r1.unit.q, 5, 'capital q');
eq(r1.unit.r, 5, 'capital r');
eq(r1.units.length, 1, 'units length');

// spawn at nearHex
const ctx2 = makeCtx();
const r2 = D.spawnTransferredUnit('Wojownik', 1, { q: 9, r: 9 }, ctx2);
ok(r2.ok, 'nearHex ok');
eq(r2.unit.q, 9, 'near q');
eq(r2.unit.r, 9, 'near r');

// unknown type
const ctx3 = makeCtx();
const r3 = D.spawnTransferredUnit('NieIstniejeXYZ', 1, null, ctx3);
ok(!r3.ok && r3.reason === 'unknown_type', 'unknown type fail');

// no capital
const ctx4 = makeCtx({ capitalHexByOwner: new Map() });
const r4 = D.spawnTransferredUnit('Wojownik', 1, null, ctx4);
ok(!r4.ok && r4.reason === 'no_capital', 'no capital fail');

console.log(`diplomacy-unit-transfer-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
