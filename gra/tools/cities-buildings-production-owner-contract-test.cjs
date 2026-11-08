'use strict';

/**
 * Deterministic owner-contract regression for Cities/Buildings/Production.
 *
 * Run from gra/: node tools/cities-buildings-production-owner-contract-test.cjs
 * The bundle imports the real game modules; source assertions pin the two
 * integration seams that cannot be exercised without the browser shell.
 */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.cities-buildings-production-owner-contract-entry.ts');
const BUNDLE = path.resolve(__dirname, '.cities-buildings-production-owner-contract-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  itemCost,
  buildingProductionItem,
  availableProduction,
  buildableProduction,
  buildingWorkCost,
  enqueue,
  dequeue,
  advanceProduction,
  applyCompletedBuildingIds,
  rushCost,
} from ${JSON.stringify(ROOT + '/src/game/production')};
export {
  buildingStockCost,
  canAffordBuildingStock,
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
  refundBuildingStockCostAcrossCities,
} from ${JSON.stringify(ROOT + '/src/game/building-stock-cost')};
export {
  buildingResourceUpkeep,
  totalBuildingResourceUpkeep,
  buildingUpkeep,
  totalBuildingUpkeep,
} from ${JSON.stringify(ROOT + '/src/game/economy-upkeep')};
export { pickAutoBuildItem } from ${JSON.stringify(ROOT + '/src/game/auto-manage')};
export { serializeGame, deserializeGame } from ${JSON.stringify(ROOT + '/src/game/save')};
` , 'utf8');

let api;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: ROOT,
    logLevel: 'silent',
  });
  api = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch { /* cleanup */ }
}

const panelSource = fs.readFileSync(path.join(ROOT, 'src/ui/cityPanel.ts'), 'utf8');
const mainSource = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
const turnEconomySource = fs.readFileSync(path.join(ROOT, 'src/game/turn-economy.ts'), 'utf8');
const uiParams = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ui-params.json'), 'utf8'));

let passed = 0;
let failed = 0;
function check(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${message}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}
function equal(actual, expected, message) {
  try {
    assert.deepEqual(actual, expected);
    passed += 1;
    console.log(`PASS: ${message}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${message}\n  got:  ${JSON.stringify(actual)}\n  want: ${JSON.stringify(expected)}`);
  }
}
function negative(label, fn) {
  try {
    fn();
    failed += 1;
    console.error(`FAIL: negative control ${label} unexpectedly passed`);
  } catch {
    passed += 1;
    console.log(`PASS: negative control ${label} rejected the mutation`);
  }
}

const {
  itemCost,
  buildingProductionItem,
  availableProduction,
  buildableProduction,
  buildingWorkCost,
  enqueue,
  dequeue,
  advanceProduction,
  applyCompletedBuildingIds,
  rushCost,
  buildingStockCost,
  canAffordBuildingStock,
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
  refundBuildingStockCostAcrossCities,
  buildingResourceUpkeep,
  totalBuildingResourceUpkeep,
  buildingUpkeep,
  totalBuildingUpkeep,
  pickAutoBuildItem,
  serializeGame,
  deserializeGame,
} = api;

function building(id, era, work, stock, category = 'Zywnosc') {
  return {
    id,
    nazwa: id,
    kategoria: category,
    grupa: 'test',
    epokaWejscia: era,
    maksPoziom: 2,
    kosztBudowy: work,
    przyrostKosztu: 0,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    koszt_surowce: stock,
    techUnlock: '-',
    lokalizacja: '',
    baza: { praca: 1, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
    przyrost: { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
    wymagania: '',
  };
}

const rows = [
  { id: 'stone-house', era: 1, base: 20, rawStock: 3, work: 20, stock: 6 },
  { id: 'bronze-house', era: 2, base: 20, rawStock: 3, work: 40, stock: 12 },
  { id: 'iron-house', era: 3, base: 20, rawStock: 3, work: 80, stock: 24 },
];
const data = {
  buildings: rows.map(row => building(row.id, row.era, row.base, { drewno: row.rawStock })),
  units: [],
};
const city = {
  id: 'city-1',
  name: 'Contract City',
  ownerId: 7,
  q: 0,
  r: 0,
  population: 5,
  surowce: { drewno: 100 },
  budowaTryb: 'priorytet',
  budowaFocus: 'zrownowazone',
  budowaPriorytetTypow: ['zrownowazone'],
};
const availability = {
  epoch: 3,
  buildingLevel: 1,
  builtBuildingIds: [],
  productionQueue: [],
  ownerId: 7,
  empireResourceStock: { drewno: 100 },
};

// 1. Table: catalog/display, queued item, Work basis, and stock basis agree.
for (const row of rows) {
  const def = data.buildings.find(b => b.id === row.id);
  const queuedItem = buildingProductionItem(row.id, data, 1);
  const catalog = availableProduction(city, data, [], availability).find(item => item.id === row.id);
  check(queuedItem !== null, `${row.id}: production item exists`);
  check(catalog !== undefined, `${row.id}: catalog item exists`);
  if (queuedItem && catalog) {
    equal(queuedItem.koszt, row.work, `${row.id}: effective Work cost table`);
    equal(catalog.koszt, queuedItem.koszt, `${row.id}: catalog cost equals queued cost`);
    equal(itemCost('budynek', row.id, data, 1), row.work, `${row.id}: itemCost uses one era multiplier`);
    equal(buildingStockCost(def), { drewno: row.stock }, `${row.id}: stock cost table`);
  }
}

// A disconnected catalog/queue cost must be caught by the same parity assertion.
const stoneItem = buildingProductionItem('stone-house', data, 1);
const catalogStone = availableProduction(city, data, [], availability).find(item => item.id === 'stone-house');
negative('catalog/queue cost link', () => assert.equal(catalogStone.koszt + 1, stoneItem.koszt));

// 2. Queue keeps the item cost and active progress on the same basis.
let prod = { kolejka: [], postep: 0 };
prod = enqueue(prod, stoneItem);
const half = stoneItem.koszt / 2;
const partial = advanceProduction(prod, half);
equal(partial.prod.postep, half, 'partial production stores active progress');
equal(partial.prod.kolejka[0].koszt, stoneItem.koszt, 'partial production keeps queued cost');
const completed = advanceProduction(partial.prod, half);
check(completed.completed?.id === 'stone-house', 'completion returns exactly the front building');
equal(completed.prod.kolejka, [], 'completion removes exactly one completed item');

// Completion mutates the city-building state once, including idempotent replay.
let built = applyCompletedBuildingIds([], 'stone-house', data.buildings);
built = applyCompletedBuildingIds(built, 'stone-house', data.buildings);
equal(built, ['stone-house'], 'completion adds one built id, replay does not duplicate it');

// 3. The same stock amount is deducted once at enqueue and refunded once at cancel.
const stockCities = [
  { id: 'a', ownerId: 7, surowce: { drewno: 4 } },
  { id: 'b', ownerId: 7, surowce: { drewno: 10 } },
  { id: 'other', ownerId: 8, surowce: { drewno: 99 } },
];
const cost = buildingStockCost(data.buildings[0]);
const beforePool = ownerResourceStockAll(stockCities, 7);
check(canAffordBuildingStock(beforePool, cost), 'owner pool can afford the queued building');
deductBuildingStockCostAcrossCities(stockCities, 7, cost);
equal(ownerResourceStockAll(stockCities, 7), { drewno: 8 }, 'enqueue deduction occurs exactly once across owner cities');
refundBuildingStockCostAcrossCities(stockCities, 7, cost);
equal(ownerResourceStockAll(stockCities, 7), beforePool, 'cancellation refunds exactly the deducted stock cost');
equal(ownerResourceStockAll(stockCities, 8), { drewno: 99 }, 'other owner stock is untouched');

// Cancellation also preserves the per-building progress memory contract.
const cancelCity = { ...city };
const cancelProd = advanceProduction(enqueue({ kolejka: [], postep: 0 }, stoneItem), 5).prod;
const afterCancel = dequeue(cancelProd, 0, cancelCity);
equal(afterCancel.kolejka, [], 'cancellation removes the queued item');
equal(cancelCity.postepBudynkowUsuniete, { 'stone-house': 5 }, 'cancellation banks only that item progress');

// 4. Upkeep starts only from the completed-building state and is charged once.
const def = data.buildings[0];
equal(buildingResourceUpkeep(def), { drewno: 5 }, 'queued/build definition resource upkeep basis');
equal(totalBuildingResourceUpkeep([]), {}, 'queued item has no built upkeep');
equal(totalBuildingResourceUpkeep([{ record: def, level: 1 }]), { drewno: 5 }, 'completed building has one resource upkeep');
equal(totalBuildingResourceUpkeep([{ record: def, level: 1 }, { record: def, level: 1 }]), { drewno: 10 }, 'upkeep aggregation is explicit per built instance');
equal(buildingUpkeep(def, 1), 2, 'completed building gold upkeep uses canonical value');
equal(totalBuildingUpkeep([{ record: def, level: 1 }]), 2, 'gold upkeep is charged once for one built instance');

// 5. AI preview selects an item whose displayed/charged cost is the same item cost.
const aiCity = { ...city, budowaFocus: 'zrownowazone', budowaTryb: 'zrownowazone' };
const aiItem = pickAutoBuildItem(aiCity, { kolejka: [], postep: 0 }, { buildings: [def], units: [] }, {
  unlockedTechs: [],
  ctx: { epoch: 1, builtBuildingIds: [], ownerId: 7, empireResourceStock: { drewno: 100 } },
  ownerSurowcePool: { drewno: 100 },
});
check(aiItem?.id === def.id, 'AI preview selects the available building');
if (aiItem) {
  equal(aiItem.koszt, buildingProductionItem(def.id, { buildings: [def], units: [] }, 1).koszt, 'AI preview Work cost equals queued cost');
  equal(buildingStockCost(def), cost, 'AI charge uses the same stock cost definition');
}

// 6. Save/load round trip preserves active progress, queue item, and built state.
const savedProd = advanceProduction(enqueue({ kolejka: [], postep: 0 }, stoneItem), 7).prod;
const saveJson = serializeGame({
  wersja: 3,
  tura: 4,
  units: [],
  cities: [city],
  exploredByHuman: [],
  gracze: [],
  humanOwnerIds: [0],
  activeHumanOwnerId: 0,
  cityProd: { [city.id]: savedProd },
  cityBuilt: { [city.id]: ['stone-house'] },
});
const loaded = deserializeGame(saveJson);
equal(
  JSON.parse(JSON.stringify(loaded.cityProd[city.id])),
  JSON.parse(JSON.stringify(savedProd)),
  'save/load preserves queue progress and cost',
);
equal(loaded.cityBuilt[city.id], ['stone-house'], 'save/load preserves completed building state');
equal(
  totalBuildingResourceUpkeep(
    loaded.cityBuilt[city.id].map(id => ({
      record: data.buildings.find(item => item.id === id),
      level: 1,
    })),
  ),
  { drewno: 5 },
  'save/load preserves the completed building upkeep basis',
);
negative('save/load disconnected queue progress', () => assert.equal(loaded.cityProd[city.id].postep, savedProd.postep + 1));

// 7. Integration seams: UI rush display/charge and turn upkeep must use engine state.
check(panelSource.includes('rushCost'), 'city panel imports/uses engine rushCost');
check(/const koszt = rushCost\(prod\);/.test(panelSource), 'city panel displays the canonical rush cost');
check(!/Math\.ceil\([^;]*UI_PARAMS\.panel_miasta\.rush_cost_mnoznik/.test(panelSource), 'city panel has no divergent rush multiplier');
const rushProd = { kolejka: [{ ...stoneItem }], postep: 7 };
equal(rushCost(rushProd), stoneItem.koszt - 7, 'engine rush cost table');
negative('rush UI multiplier disconnected from engine', () => {
  const uiCost = Math.ceil((stoneItem.koszt - rushProd.postep) * uiParams.panel_miasta.rush_cost_mnoznik);
  assert.equal(uiCost, rushCost(rushProd));
});
check(mainSource.includes('cityProdSave[cid] = prod'), 'save snapshot carries the full city production object');
check(mainSource.includes('cityProd.set(cid, prod as CityProduction)'), 'load restores the full city production object');
const loadProductionBlock = mainSource.slice(
  mainSource.indexOf('cityProd.clear()'),
  mainSource.indexOf('completedWorldWonders =', mainSource.indexOf('cityProd.clear()')),
);
check(
  !loadProductionBlock.includes('deductBuildingStockCostAcrossCities'),
  'load restores production without charging the stock cost again',
);
check(turnEconomySource.includes('totalBuildingResourceUpkeep('), 'turn economy computes building upkeep from built instances');
check(turnEconomySource.includes('const builtIds = builtByCity.get(city.id) ?? [];'), 'turn economy sources upkeep from completed building ids');

try { fs.unlinkSync(BUNDLE); } catch { /* cleanup */ }

console.log(`\nPASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
}
console.log('ALL GREEN');
