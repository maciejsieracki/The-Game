'use strict';
/**
 * All-record recruitment/resource-cost balance gate.
 * Run from gra/: node tools/rekrutacja-koszty-polowa-all-test.cjs
 *
 * The expected table is derived from the clean dispatch base, never hand-written.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const BASE_COMMIT = '329db81ff1622360699fdbb7fc56f2c721121c86';
const repoRoot = path.resolve(__dirname, '..');
const unitsPath = path.join(repoRoot, 'data', 'units.json');
const currentUnits = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
const baseUnits = JSON.parse(execFileSync(
  'git',
  ['show', `${BASE_COMMIT}:gra/data/units.json`],
  { cwd: repoRoot, encoding: 'utf8' },
));

const runtimeEntry = path.join(__dirname, '.rekrutacja-koszty-polowa-all-entry.ts');
const runtimeBundle = path.join(__dirname, '.rekrutacja-koszty-polowa-all-bundle.cjs');
fs.writeFileSync(runtimeEntry, `
export {
  unitStockCost,
  unitRequiresMountHorseStock,
  MOUNT_UNIT_HORSE_STOCK_COST,
  canAffordBuildingStock,
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
  creditOwnerResourceStock,
} from '../src/game/building-stock-cost';
export { unitResourceUpkeep, totalUnitResourceUpkeep } from '../src/game/economy-upkeep';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [runtimeEntry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: runtimeBundle,
    absWorkingDir: repoRoot,
    logLevel: 'silent',
  });
} catch (error) {
  console.error('[rekrutacja-koszty-polowa-all-test] runtime bundle failed:', error.message || error);
  process.exit(1);
}
const runtime = require(runtimeBundle);

const MONEY_COST = 'Pieniądz (koszt)';
const RESOURCE_COST = 'Surowiec (ilość)';
const MONEY_UPKEEP = 'Utrzymanie (Pieniądz/turę)';
const RESOURCE_UPKEEP = 'Utrzymanie surowiec (ilość)';
const HALVED_FIELDS = [MONEY_COST, RESOURCE_COST, RESOURCE_UPKEEP];
const PROTECTED_FIELDS = ['żywność/turę', 'Ludność', 'Manpower'];

assert(Array.isArray(baseUnits), 'clean base units.json must be an array');
assert(Array.isArray(currentUnits), 'current units.json must be an array');
assert.strictEqual(currentUnits.length, baseUnits.length, 'unit record count changed');

function ceilHalf(value) {
  assert(Number.isInteger(value) && value >= 0, `expected non-negative integer, got ${value}`);
  return Math.ceil(value / 2);
}

function resourceKey(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function withoutCostFields(record) {
  return Object.fromEntries(Object.entries(record).filter(
    ([key]) => !HALVED_FIELDS.includes(key),
  ));
}

let changedFields = 0;
let protectedChecks = 0;
console.log(`[rekrutacja-koszty-polowa-all-test] baza ${BASE_COMMIT}`);
console.log(`[rekrutacja-koszty-polowa-all-test] rekordów: ${currentUnits.length}`);

for (let index = 0; index < baseUnits.length; index += 1) {
  const before = baseUnits[index];
  const after = currentUnits[index];
  assert.strictEqual(after.Jednostka, before.Jednostka, `record ${index + 1} identity changed`);

  // Every non-target field, including food and any Manpower field, is unchanged.
  assert.deepStrictEqual(
    withoutCostFields(after),
    withoutCostFields(before),
    `${after.Jednostka}: unrelated fields changed`,
  );
  for (const field of PROTECTED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(before, field)) {
      protectedChecks += 1;
      assert.deepStrictEqual(after[field], before[field], `${after.Jednostka}: ${field} changed`);
    }
  }

  const expected = {};
  for (const field of HALVED_FIELDS) {
    expected[field] = ceilHalf(before[field]);
    assert.strictEqual(after[field], expected[field], `${after.Jednostka}: ${field}`);
    assert(Number.isInteger(after[field]), `${after.Jednostka}: ${field} is fractional`);
    if (after[field] !== before[field]) changedFields += 1;
  }

  // Prove the changed JSON values reach the live resource-cost helpers.
  const stockCost = runtime.unitStockCost(after);
  if (after.Surowiec && after.Surowiec !== '-' && after[RESOURCE_COST] > 0) {
    assert.strictEqual(
      stockCost[resourceKey(after.Surowiec)],
      after[RESOURCE_COST],
      `${after.Jednostka}: runtime recruitment resource cost`,
    );
  } else {
    assert.strictEqual(Object.keys(stockCost).length, 0, `${after.Jednostka}: no runtime base resource cost`);
  }
  if (runtime.unitRequiresMountHorseStock(after)) {
    assert.strictEqual(
      stockCost.kon,
      runtime.MOUNT_UNIT_HORSE_STOCK_COST,
      `${after.Jednostka}: unchanged mount-horse supplement`,
    );
  }
  const upkeep = runtime.unitResourceUpkeep(after);
  const expectedUpkeep = after['Utrzymanie surowiec'] && after[RESOURCE_UPKEEP] > 0
    ? { [resourceKey(after['Utrzymanie surowiec'])]: after[RESOURCE_UPKEEP] }
    : {};
  assert.deepStrictEqual(upkeep, expectedUpkeep, `${after.Jednostka}: runtime resource upkeep`);
  assert.strictEqual(
    after[MONEY_UPKEEP],
    before[MONEY_UPKEEP],
    `${after.Jednostka}: money upkeep changed`,
  );
  assert(Number.isInteger(after[MONEY_UPKEEP]), `${after.Jednostka}: money upkeep is fractional`);

  console.log(
    `${String(index + 1).padStart(2, '0')}/${baseUnits.length} ${after.Jednostka}: `
      + `money ${before[MONEY_COST]} -> ${after[MONEY_COST]}; `
      + `resource ${before[RESOURCE_COST]} -> ${after[RESOURCE_COST]}; `
      + `resource upkeep ${before[RESOURCE_UPKEEP]} -> ${after[RESOURCE_UPKEEP]}; `
      + `money upkeep ${before[MONEY_UPKEEP]} -> ${after[MONEY_UPKEEP]}`,
  );
}

// Representative end-to-end resource path: purchase, refund and upkeep stay
// owner-agnostic for player, AI and city-state owners.
const representative = currentUnits.find(unit => unit.Jednostka === 'Wojownik');
const representativeCost = runtime.unitStockCost(representative);
for (const ownerId of [0, 7, 31]) {
  const cities = [
    { id: `a-${ownerId}`, ownerId, surowce: { drewno: 8 } },
    { id: `b-${ownerId}`, ownerId, surowce: { drewno: 8 } },
    { id: `other-${ownerId}`, ownerId: 99, surowce: { drewno: 1000 } },
  ];
  const before = runtime.ownerResourceStockAll(cities, ownerId).drewno;
  assert.strictEqual(before, 16, `owner ${ownerId}: purchase pool`);
  assert(runtime.canAffordBuildingStock(
    runtime.ownerResourceStockAll(cities, ownerId),
    representativeCost,
  ), `owner ${ownerId}: purchase is affordable`);
  runtime.deductBuildingStockCostAcrossCities(cities, ownerId, representativeCost);
  assert.strictEqual(
    runtime.ownerResourceStockAll(cities, ownerId).drewno,
    3,
    `owner ${ownerId}: purchase deducts 13 Drewna`,
  );
  runtime.creditOwnerResourceStock(cities, ownerId, 'drewno', representativeCost.drewno);
  assert.strictEqual(
    runtime.ownerResourceStockAll(cities, ownerId).drewno,
    before,
    `owner ${ownerId}: refund restores purchase pool`,
  );
  assert.deepStrictEqual(
    runtime.totalUnitResourceUpkeep(
      [{ typeId: 'Wojownik' }, { typeId: 'Wojownik' }],
      typeId => currentUnits.find(unit => unit.Jednostka === typeId),
    ),
    { drewno: 6 },
    `owner ${ownerId}: upkeep tick for two units`,
  );
}

console.log(`[rekrutacja-koszty-polowa-all-test] changed target fields: ${changedFields}`);
console.log(`[rekrutacja-koszty-polowa-all-test] protected field checks: ${protectedChecks}`);
console.log('[rekrutacja-koszty-polowa-all-test] PASS');
try { fs.unlinkSync(runtimeEntry); } catch (error) { /* ignore cleanup */ }
try { fs.unlinkSync(runtimeBundle); } catch (error) { /* ignore cleanup */ }
