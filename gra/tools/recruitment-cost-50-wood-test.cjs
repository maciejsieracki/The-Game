'use strict';
/**
 * recruitment-cost-50-wood-test.cjs — korekta kosztu jednostek epoki Kamienia.
 *
 * Kontrakt danych (Koszty jednostek=Niski, normalna trudność):
 *   - pola Pieniądz/Surowiec w units.json pozostają wartościami bazowymi;
 *   - koszt rekrutacji z magazynu i utrzymanie Drewna są wartościami
 *     bezpośrednimi w danych;
 *   - utrzymanie Pieniądza przechodzi przez istniejące ×4 FALA1+FALA2;
 *   - tempo kosztu Pieniądza nadal daje Niski ×1, Normalny ×2, Wysoki ×4.
 *
 * Run from gra/: node tools/recruitment-cost-50-wood-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[recruitment-cost-50-wood-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.recruitment-cost-50-wood-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.recruitment-cost-50-wood-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  unitResourceUpkeep,
  unitUpkeep,
  buildUnitUpkeepTable,
} from '../src/game/economy-upkeep';
export { unitStockCost } from '../src/game/building-stock-cost';
export { applyUnitCostPace } from '../src/game/unit-cost-tempo';
export { unitMoneyCost, unitProductionItem } from '../src/game/production';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[recruitment-cost-50-wood-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const units = require('../data/units.json');
const productData = { buildings: [], units };

const EXPECTED = {
  Wojownik: { money: 5, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  Oszczepnik: { money: 3, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  Łucznik: { money: 3, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  Zwiadowca: { money: 4, wood: 0, goldUpkeep: 0, woodUpkeep: 0 },
  'Oszczepnik Zulu (Izijula)': { money: 10, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  'Wojownik z maczugą (Chaska)': { money: 13, wood: 13, goldUpkeep: 2, woodUpkeep: 3 },
  'Oszczepnik (Estólica)': { money: 5, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  'Łucznik egipski': { money: 7, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  'Łucznik sumeryjski': { money: 5, wood: 13, goldUpkeep: 1, woodUpkeep: 3 },
  Taran: { money: 7, wood: 19, goldUpkeep: 1, woodUpkeep: 4 },
};

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error('FAIL:', message);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function deepEq(actual, expected, message) {
  eq(JSON.stringify(actual), JSON.stringify(expected), message);
}
function findUnit(name) {
  const unit = units.find(row => row.Jednostka === name);
  assert(!!unit, `units.json: brak jednostki "${name}"`);
  return unit;
}

const upkeepTable = M.buildUnitUpkeepTable(units);
console.log('\n-- Stone Age recruitment cost correction --');
for (const [name, want] of Object.entries(EXPECTED)) {
  const unit = findUnit(name);
  if (!unit) continue;

  eq(unit['Pieniądz (koszt)'], want.money, `${name}: bazowy Pieniądz (koszt)`);
  eq(unit.Surowiec, want.wood > 0 ? 'Drewno' : null, `${name}: Surowiec`);
  eq(unit['Surowiec (ilość)'], want.wood, `${name}: Surowiec (ilość)`);
  eq(unit['Utrzymanie (Pieniądz/turę)'], want.goldUpkeep, `${name}: bazowe utrzymanie Pieniądza`);
  eq(unit['Utrzymanie surowiec'], want.wood > 0 ? 'Drewno' : null, `${name}: Utrzymanie surowiec`);
  eq(unit['Utrzymanie surowiec (ilość)'], want.woodUpkeep, `${name}: Utrzymanie surowiec (ilość)`);

  const stock = want.wood > 0 ? { drewno: want.wood } : {};
  deepEq(M.unitStockCost(unit), stock, `${name}: koszt magazynowy`);
  const resourceUpkeep = want.woodUpkeep > 0 ? { drewno: want.woodUpkeep } : {};
  deepEq(M.unitResourceUpkeep(unit), resourceUpkeep, `${name}: utrzymanie surowcowe`);
  eq(
    M.unitUpkeep({ typeId: name, category: 'domyslny' }, upkeepTable, 0),
    want.goldUpkeep * 4,
    `${name}: efektywne utrzymanie Pieniądza ×4`,
  );

  eq(
    M.unitMoneyCost(want.money, [], 'niski', 0, 'normal'),
    want.money,
    `${name}: efektywny koszt rekrutacji Niski/normalna`,
  );
  eq(
    M.unitProductionItem(name, productData, [], 'niski', 0, 'normal')?.koszt,
    want.money,
    `${name}: unitProductionItem Niski/normalna`,
  );
  eq(
    M.unitMoneyCost(want.money, [], 'normalny', 0, 'normal'),
    want.money * 2,
    `${name}: koszt rekrutacji Normalny ×2`,
  );
  eq(
    M.unitMoneyCost(want.money, [], 'wysoki', 0, 'normal'),
    want.money * 4,
    `${name}: koszt rekrutacji Wysoki ×4`,
  );
  eq(
    M.unitMoneyCost(want.money, [], 'niski', 0, 'hard'),
    want.money * 2,
    `${name}: koszt rekrutacji Niski/trudna gracz ×2`,
  );
  eq(
    M.unitMoneyCost(want.money, [], 'niski', 1, 'easy'),
    want.money * 2,
    `${name}: koszt rekrutacji Niski/łatwa AI ×2`,
  );

  eq(M.applyUnitCostPace(want.money, 'niski'), want.money, `${name}: tempo Niski ×1`);
  eq(M.applyUnitCostPace(want.money, 'normalny'), want.money * 2, `${name}: tempo Normalny ×2`);
  eq(M.applyUnitCostPace(want.money, 'wysoki'), want.money * 4, `${name}: tempo Wysoki ×4`);
}

console.log(`\nrecruitment-cost-50-wood-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
