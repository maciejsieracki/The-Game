'use strict';

/**
 * R-FULL-EPOCH-COSTS-Q1 -- unit-side epoch scaling regression matrix.
 *
 * Run from gra/: node tools/unit-epoch-cost-test.cjs
 *
 * The current building path is intentionally asserted in the same harness as a
 * green control. Unit assertions are the reproducer: Stone x1, Bronze x2,
 * Iron+ x4, with existing FALA/base layers preserved.
 */

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.unit-epoch-cost-entry.ts');
const BUNDLE = path.join(__dirname, '.unit-epoch-cost-bundle.cjs');

fs.writeFileSync(ENTRY, `
import unitsData from '../data/units.json';
import buildingsData from '../data/buildings.json';
import * as buildingStockCostModule from '../src/game/building-stock-cost';

// The current-base replay intentionally runs this test before the candidate
// helper exists.  Keep the shared-helper assertions executable there, while
// leaving every unit path bound to the real base/candidate implementation.
function referenceEpochCostMultiplier(epoch) {
  if (typeof epoch === 'number' && Number.isFinite(epoch)) {
    const ordinal = Math.floor(epoch);
    if (ordinal >= 3) return 4;
    if (ordinal >= 2) return 2;
    return 1;
  }
  if (typeof epoch !== 'string') return 1;
  const normalized = epoch
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (/^\\d+(?:\\.\\d+)?$/.test(normalized)) {
    return referenceEpochCostMultiplier(Number(normalized));
  }
  if (normalized === 'kamien' || normalized === 'stone' || normalized === '1') return 1;
  if (normalized === 'braz' || normalized === 'bronze' || normalized === '2') return 2;
  if (
    normalized === 'zelazo' ||
    normalized === 'zelazo+' ||
    normalized === 'iron' ||
    normalized === 'iron+' ||
    normalized === 'iron plus' ||
    normalized === 'steel' ||
    normalized === 'stal'
  ) return 4;
  return 1;
}

function referenceScaleCostByEpoch(cost, epoch) {
  if (!Number.isFinite(cost) || cost < 0) return 0;
  if (cost === 0) return 0;
  return Math.max(1, Math.round(cost * referenceEpochCostMultiplier(epoch)));
}

const stockExports = buildingStockCostModule;
export const epochCostMultiplier = typeof stockExports.epochCostMultiplier === 'function'
  ? stockExports.epochCostMultiplier
  : referenceEpochCostMultiplier;
export const scaleCostByEpoch = typeof stockExports.scaleCostByEpoch === 'function'
  ? stockExports.scaleCostByEpoch
  : referenceScaleCostByEpoch;

export const units = unitsData;
export const buildings = buildingsData;
export {
  itemCost,
  unitProductionItem,
  unitPurchaseCost,
  unitMoneyCost,
  buildingProductionItem,
} from '../src/game/production';
export {
  buildingStockCost,
  buildingEraCostMultiplier,
  unitStockCost,
  unitRequiresMountHorseStock,
  MOUNT_UNIT_HORSE_STOCK_COST,
} from '../src/game/building-stock-cost';
export {
  DEFAULT_UPKEEP_PARAMS,
  buildingUpkeep,
  unitResourceUpkeep,
  buildUnitUpkeepTable,
  unitUpkeep,
  buildUnitFoodTable,
  unitFoodPerTurn,
} from '../src/game/economy-upkeep';
export { serializeGame, deserializeGame } from '../src/game/save';
`, 'utf8');

function buildBundle() {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
}

let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}
function eq(actual, expected, message) {
  ok(Object.is(actual, expected), `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function deepEq(actual, expected, message) {
  try {
    assert.deepEqual(actual, expected);
    passed += 1;
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
  }
}
function byName(rows, key, value) {
  const row = rows.find((entry) => entry[key] === value);
  assert.ok(row, `missing ${key}=${value}`);
  return row;
}

try {
  buildBundle();
  const M = require(BUNDLE);
  const data = { units: M.units, buildings: M.buildings };

  const stoneUnit = byName(M.units, 'Jednostka', 'Wojownik');
  const bronzeUnit = byName(M.units, 'Jednostka', 'Procarz');
  const ironUnit = byName(M.units, 'Jednostka', 'Falanga');
  const mountUnit = byName(M.units, 'Jednostka', 'Konnica');
  const stoneBuilding = byName(M.buildings, 'id', 'stolarnia');
  const bronzeBuilding = byName(M.buildings, 'id', 'kuznia');
  const ironBuilding = byName(M.buildings, 'id', 'odlewnia_zelaza');

  // Shared rule and malformed-input controls.
  eq(M.epochCostMultiplier('Kamień'), 1, 'shared Stone epoch multiplier');
  eq(M.epochCostMultiplier('Brąz'), 2, 'shared Bronze epoch multiplier');
  eq(M.epochCostMultiplier('Żelazo'), 4, 'shared Iron epoch multiplier');
  eq(M.epochCostMultiplier('Iron+'), 4, 'later Iron epoch multiplier');
  eq(M.epochCostMultiplier(9), 4, 'later numeric epoch is capped at x4');
  eq(M.epochCostMultiplier('malformed'), 1, 'malformed epoch defaults to Stone');
  eq(M.epochCostMultiplier(null), 1, 'missing epoch defaults to Stone');
  eq(M.scaleCostByEpoch(0, 'Żelazo'), 0, 'shared zero cost stays zero');

  // Green controls: current building Work/stock/gold paths stay unchanged.
  eq(M.buildingEraCostMultiplier(1), 1, 'building Stone multiplier remains x1');
  eq(M.buildingEraCostMultiplier(2), 2, 'building Bronze multiplier remains x2');
  eq(M.buildingEraCostMultiplier(3), 4, 'building Iron multiplier remains x4');
  eq(M.itemCost('budynek', stoneBuilding.id, data, 1), 20, 'Stone building Work control');
  eq(M.itemCost('budynek', bronzeBuilding.id, data, 1), 60, 'Bronze building Work control');
  eq(M.itemCost('budynek', ironBuilding.id, data, 1), 140, 'Iron building Work control');
  deepEq(M.buildingStockCost(stoneBuilding), { drewno: 50 }, 'Stone building stock control');
  deepEq(M.buildingStockCost(bronzeBuilding), { drewno: 120, kamien: 120 }, 'Bronze building stock control');
  deepEq(M.buildingStockCost(ironBuilding), { drewno: 320, cegla: 400 }, 'Iron building stock control');
  eq(M.buildingUpkeep(stoneBuilding, 1), 2, 'Stone building gold upkeep control');
  eq(M.buildingUpkeep(bronzeBuilding, 1), 8, 'Bronze building gold upkeep control');
  eq(M.buildingUpkeep(ironBuilding, 1), 24, 'Iron building gold upkeep control');
  eq(M.buildingProductionItem(bronzeBuilding.id, data, 1)?.koszt, 60, 'Bronze queue Work control');

  // RED unit money/catalogue/production-card path.
  eq(M.itemCost('jednostka', stoneUnit.Jednostka, data, 1), 5, 'Stone unit catalog money');
  eq(M.itemCost('jednostka', bronzeUnit.Jednostka, data, 1), 8, 'Bronze unit catalog money');
  eq(M.itemCost('jednostka', ironUnit.Jednostka, data, 1), 36, 'Iron unit catalog money');
  eq(M.unitPurchaseCost(stoneUnit), 5, 'Stone unit purchase money');
  eq(M.unitPurchaseCost(bronzeUnit), 8, 'Bronze unit purchase money');
  eq(M.unitPurchaseCost(ironUnit), 36, 'Iron unit purchase money');
  eq(M.unitProductionItem(bronzeUnit.Jednostka, data)?.koszt, 8, 'Bronze recruitment card money');
  eq(M.unitProductionItem(ironUnit.Jednostka, data)?.koszt, 36, 'Iron recruitment card money');

  // Existing layers must receive the epoch-scaled base exactly once.
  const recruitmentDiscount = [{
    realizuje: 'ekonomia',
    opis: '10% zniżki na koszt rekrutacji',
    wartosc: 0.1,
  }];
  const layeredPlayer = M.unitPurchaseCost(bronzeUnit, recruitmentDiscount, 'wysoki', 0, 'hard');
  const layeredAi = M.unitPurchaseCost(bronzeUnit, recruitmentDiscount, 'wysoki', 7, 'easy');
  eq(layeredPlayer, 56, 'unit epoch scaling precedes civ/pace/hard layers');
  eq(layeredAi, 56, 'unit epoch scaling preserves equivalent easy-AI layering');
  eq(M.unitProductionItem(bronzeUnit.Jednostka, data, recruitmentDiscount, 'wysoki', 0, 'hard')?.koszt, 56,
    'production card preserves the same layered unit cost');
  eq(M.unitProductionItem(bronzeUnit.Jednostka, data, undefined, undefined, 0, 'normal')?.koszt,
    M.unitProductionItem(bronzeUnit.Jednostka, data, undefined, undefined, 7, 'normal')?.koszt,
    'normal player/AI unit cost parity');
  eq(M.unitMoneyCost(0, undefined, 'wysoki', 0, 'hard'), 0, 'zero unit money stays zero');

  // One-time stock: resource field and mount supplement use the same epoch.
  deepEq(M.unitStockCost(stoneUnit), { drewno: 13 }, 'Stone unit recruitment stock');
  deepEq(M.unitStockCost(bronzeUnit), { drewno: 50 }, 'Bronze unit recruitment stock');
  deepEq(M.unitStockCost(ironUnit), { zelazo: 100 }, 'Iron unit recruitment stock');
  deepEq(M.unitStockCost(mountUnit), { braz: 50, kon: 50 }, 'Bronze mount stock + horse supplement scales once');
  deepEq(M.unitStockCost({ Epoka: 'Żelazo', Typ: 'Mount', Jednostka: 'fixture', Surowiec: 'Drewno', 'Surowiec (ilość)': 7 }),
    { drewno: 28, kon: M.MOUNT_UNIT_HORSE_STOCK_COST * 4 },
    'Iron mount fixture scales resource and horse supplement');
  deepEq(M.unitStockCost({ Surowiec: 'Drewno', 'Surowiec (ilość)': 7 }),
    { drewno: 7 },
    'missing epoch defaults unit stock to Stone');
  deepEq(M.unitStockCost({ Epoka: 'not-an-epoch', Surowiec: 'Drewno', 'Surowiec (ilość)': 7 }),
    { drewno: 7 },
    'malformed epoch defaults unit stock to Stone');
  deepEq(M.unitStockCost({ Epoka: 'Żelazo', Surowiec: 'Drewno', 'Surowiec (ilość)': 0 }),
    {},
    'zero unit stock stays absent');

  // Per-turn resource upkeep follows the unit epoch, not the building path.
  deepEq(M.unitResourceUpkeep(stoneUnit), { drewno: 3 }, 'Stone unit resource upkeep');
  deepEq(M.unitResourceUpkeep(bronzeUnit), { drewno: 10 }, 'Bronze unit resource upkeep');
  deepEq(M.unitResourceUpkeep(ironUnit), { zelazo: 20 }, 'Iron unit resource upkeep');
  deepEq(M.unitResourceUpkeep({ Epoka: 'Żelazo', 'Utrzymanie surowiec': 'Drewno', 'Utrzymanie surowiec (ilość)': 0 }),
    {},
    'zero unit resource upkeep stays absent');

  // Gold upkeep table and food table are pre-scaled once, before shared FALA layers.
  const upkeepRows = M.buildUnitUpkeepTable([stoneUnit, bronzeUnit, ironUnit]);
  eq(M.unitUpkeep({ typeId: stoneUnit.Jednostka, category: 'miecznik' }, upkeepRows, 1), 4, 'Stone unit gold upkeep');
  eq(M.unitUpkeep({ typeId: bronzeUnit.Jednostka, category: 'procarz' }, upkeepRows, 1), 8, 'Bronze unit gold upkeep');
  eq(M.unitUpkeep({ typeId: ironUnit.Jednostka, category: 'falanga' }, upkeepRows, 1), 32, 'Iron unit gold upkeep');
  const foodRows = M.buildUnitFoodTable([stoneUnit, bronzeUnit, ironUnit]);
  eq(M.unitFoodPerTurn({ typeId: stoneUnit.Jednostka, camping: false }, M.DEFAULT_UPKEEP_PARAMS, foodRows), 4, 'Stone unit food upkeep');
  eq(M.unitFoodPerTurn({ typeId: bronzeUnit.Jednostka, camping: false }, M.DEFAULT_UPKEEP_PARAMS, foodRows), 8, 'Bronze unit food upkeep');
  eq(M.unitFoodPerTurn({ typeId: ironUnit.Jednostka, camping: false }, M.DEFAULT_UPKEEP_PARAMS, foodRows), 16, 'Iron unit food upkeep');
  const missingEpochRows = M.buildUnitUpkeepTable([
    { Jednostka: 'missing-epoch', 'Utrzymanie (Pieniadz/ture)': 2 },
  ]);
  eq(missingEpochRows['missing-epoch'], 2, 'missing epoch gold upkeep defaults to Stone before FALA');
  const malformedFoodRows = M.buildUnitFoodTable([
    { Jednostka: 'malformed-epoch', Epoka: '???', 'żywność/turę': 2 },
  ]);
  eq(M.unitFoodPerTurn({ typeId: 'malformed-epoch', camping: false }, M.DEFAULT_UPKEEP_PARAMS, malformedFoodRows), 8,
    'malformed epoch food upkeep defaults to Stone before FALA');

  // Save/load preserves already-effective queue and resource values; no second scale.
  const queued = M.unitProductionItem(bronzeUnit.Jednostka, data);
  const saved = {
    wersja: 3,
    tura: 7,
    units: [],
    cities: [{ id: 'c1', ownerId: 0, surowce: { drewno: 10 } }],
    exploredByHuman: [],
    gracze: [],
    humanOwnerIds: [0],
    activeHumanOwnerId: 0,
    cityProd: { c1: { kolejka: [queued], postep: 3 } },
  };
  const loaded = M.deserializeGame(M.serializeGame(saved));
  eq(loaded.cityProd.c1.kolejka[0].koszt, 8, 'save/load preserves effective Bronze queue cost');
  eq(loaded.cities[0].surowce.drewno, 10, 'save/load preserves settled resource stock');

  // Mutation control: removing epoch multiplication from the shared unit
  // helper must make this same matrix fail while building controls stay intact.
  if (!process.env.UNIT_EPOCH_MUTANT) {
    const sourcePath = path.join(GRA_ROOT, 'src', 'game', 'building-stock-cost.ts');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const needle = 'return Math.max(1, Math.round(cost * epochCostMultiplier(epoch)));';
    const mutant = 'return Math.max(1, Math.round(cost));';
    if (!source.includes(needle)) {
      console.log('unit-epoch-cost-test: mutation control skipped (base has no candidate epoch helper)');
    } else {
      fs.writeFileSync(sourcePath, source.replace(needle, mutant), 'utf8');
      try {
        const mutationRun = spawnSync(process.execPath, [__filename], {
          cwd: GRA_ROOT,
          env: { ...process.env, UNIT_EPOCH_MUTANT: '1' },
          encoding: 'utf8',
        });
        ok(mutationRun.status !== 0, 'mutant removing unit epoch scaling goes red');
        if (mutationRun.status === 0) {
          console.error(mutationRun.stdout);
        }
      } finally {
        fs.writeFileSync(sourcePath, source, 'utf8');
      }
    }
  }

  console.log(`unit-epoch-cost-test: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
} finally {
  for (const file of [ENTRY, BUNDLE]) {
    try { fs.unlinkSync(file); } catch (_) {}
  }
}
