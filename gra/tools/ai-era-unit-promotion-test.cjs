'use strict';
/** Focused live-data integration check for AI same-role era promotion. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.ai-era-promotion-entry.ts');
const bundle = path.resolve(__dirname, '.ai-era-promotion-bundle.cjs');
fs.writeFileSync(entry, `
export { promoteAiUnitForEra } from '../src/game/ai-era-unit-promotion';
export { availableReplacementsFor, newestAvailableSameTypeUnit, unitProductionItem, epochNumber } from '../src/game/production';
export { unitResourceUpkeep } from '../src/game/economy-upkeep';
export { unitStockCost } from '../src/game/building-stock-cost';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
const M = require(bundle);
const units = require('../data/units.json');
const data = { units, buildings: [] };
const mainSource = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
let passed = 0;
let failed = 0;
function assert(ok, label) {
  if (ok) { passed++; console.log('  [OK] ' + label); }
  else { failed++; console.error('  [FAIL] ' + label); }
}

// Protect the production wiring: an isolated helper test would keep passing if the AI turn
// stopped invoking the promotion path. Resume guards matter because a resumed command list
// must not run this once-per-owner-turn operation twice.
assert(/ensureAiOwnerStartEra\(ownerId\);\s*if\s*\(!isCommandResume\)\s*upgradeAiUnitsForEra\(ownerId\);/.test(mainSource), 'AI owner-turn path invokes era promotion once on fresh turns, not command resumes');
const promotionBodyStart = mainSource.indexOf('function upgradeAiUnitsForEra(ownerId: number): void {');
const promotionBodyEnd = mainSource.indexOf('function bestGeneralUnitForOwner(ownerId: number)', promotionBodyStart);
assert(promotionBodyStart >= 0 && promotionBodyEnd > promotionBodyStart
  && mainSource.slice(promotionBodyStart, promotionBodyEnd).includes('promoteAiUnitForEra(u, {'),
'main.ts delegates each eligible AI unit to the tested promotion helper');

// Ox metadata declares the user-approved late-Stone Wheel unit and wood costs/upkeep.
const ox = units.find(unit => unit.Jednostka === 'Rydwan (woły)');
assert(ox?.Epoka === 'Kamień' && ox?.['Dostępna w epokach'] === 'Kamień' && ox?.Tech === 'Koło', 'Ox Chariot availability metadata consistently says Stone / Wheel');
assert(ox?.Surowiec === 'Drewno' && ox?.['Utrzymanie surowiec'] === 'Drewno' && ox?.['Utrzymanie surowiec (ilość)'] === 5, 'Ox Chariot recruitment and resource upkeep use wood, not bronze');
assert(JSON.stringify(M.unitResourceUpkeep(ox)) === JSON.stringify({ drewno: 5 }), 'runtime upkeep resolver reads Ox Chariot wood upkeep');

// Real availability and unit cost functions: Bronze tech, barracks, and bronze stock unlocked.
const ctx = {
  epoch: 2, civUnitNacja: '', civBonusy: [], builtBuildingIds: ['koszary'],
  empireResourceStock: { drewno: 100, braz: 100 }, kosztJednostekPace: 'niski', difficulty: 'normal',
};
let treasury = 200;
let pool = { drewno: 100, braz: 100 };
const unit = { ownerId: 7, typeId: 'Wojownik', category: 'Wrecz', hp: 11, hpMax: 22, ruchLeft: 1, replaceUsedThisTurn: false };
function deps() {
  return {
    oldDefinition: value => units.find(def => def.Jednostka === value.typeId),
    candidates: value => M.availableReplacementsFor(value.typeId, data, ['Brązownictwo'], ctx)
      .map(item => units.find(def => def.Jednostka === item.id)).filter(Boolean),
    newestSameRole: (value, candidates) => M.newestAvailableSameTypeUnit(value.typeId, candidates.map(def => def.Jednostka), units),
    epochNumber: M.epochNumber,
    unitCost: id => M.unitProductionItem(id, data, [], 'niski', 7, 'normal')?.koszt ?? 0,
    // D1 = C (2026-11-09): pelny koszt rekrutacji nowej jednostki = Pieniadz + Surowiec z puli panstwa.
    stockCost: target => M.unitStockCost(target),
    canPayStock: cost => Object.entries(cost).every(([k, v]) => (pool[k] ?? 0) >= v),
    payStock: cost => { for (const [k, v] of Object.entries(cost)) pool[k] = (pool[k] ?? 0) - v; },
    currentTreasury: () => treasury,
    setTreasury: next => { treasury = next; },
    oldMaxHp: (_value, def) => Number(def.health ?? def.Health ?? 60),
    newMaxHp: target => Number(target.health ?? target.Health ?? 60),
    category: target => String(target['Rola (linia)'] ?? ''),
  };
}
const candidates = deps().candidates(unit);
assert(candidates.some(def => def.Jednostka === 'Wojownik z mieczem i tarczą'), 'production availability exposes Bronze same-role replacement with its real gates');
const originalTreasury = treasury;
const expectedMoney = deps().unitCost('Wojownik z mieczem i tarczą', unit);
const expectedStock = M.unitStockCost(units.find(d => d.Jednostka === 'Wojownik z mieczem i tarczą'));
const poolBefore = { ...pool };
assert(expectedMoney > 0 && (expectedStock.braz ?? 0) > 0, 'target has a real money AND bronze stock recruitment cost');
assert(M.promoteAiUnitForEra(unit, deps()), 'AI unit promotes after Bronze replacement becomes available');
assert(unit.typeId === 'Wojownik z mieczem i tarczą' && unit.replaceUsedThisTurn && unit.ruchLeft === 0, 'promotion updates type, consumes this-turn replacement, and ends movement');
assert(unit.hpMax === 28 && unit.hp === 14, 'promotion keeps the old unit health percentage');
const afterPromotionTreasury = treasury;
assert(afterPromotionTreasury === originalTreasury - expectedMoney, 'promotion charges the FULL recruitment money cost of the new unit once (not the difference)');
assert(pool.braz === poolBefore.braz - expectedStock.braz, 'promotion takes the FULL recruitment resource stock (bronze) from the state pool');
const loadedUnit = JSON.parse(JSON.stringify(unit));
assert(!M.promoteAiUnitForEra(loadedUnit, deps()) && treasury === afterPromotionTreasury, 'save/load repeat is idempotent and does not charge again');
loadedUnit.replaceUsedThisTurn = false; // next turn: there is no later-era eligible same-role unit
assert(!M.promoteAiUnitForEra(loadedUnit, deps()) && treasury === afterPromotionTreasury, 'next-turn repeat does not promote or charge without a later era target');

// Brak zasobow = pominiecie bez mutacji (Pieniadz albo surowiec).
{
  const poor = { ownerId: 7, typeId: 'Wojownik', category: 'Wrecz', hp: 20, hpMax: 20, ruchLeft: 1, replaceUsedThisTurn: false, battlesSurvived: 3 };
  const t0 = treasury; const p0 = { ...pool };
  pool = { drewno: 100, braz: expectedStock.braz - 1 };
  assert(!M.promoteAiUnitForEra(poor, deps()) && poor.typeId === 'Wojownik' && treasury === t0, 'AI skips replacement when the state pool lacks the full resource cost (no money taken)');
  pool = p0;
  treasury = expectedMoney - 1;
  assert(!M.promoteAiUnitForEra(poor, deps()) && poor.typeId === 'Wojownik' && pool.braz === p0.braz, 'AI skips replacement when treasury < full money cost (no stock taken)');
  treasury = 1000;
  assert(M.promoteAiUnitForEra(poor, deps()) && poor.battlesSurvived === 3, 'promotion keeps unit experience (battlesSurvived) when paid in full');
}

console.log(`\nAI era promotion + Ox metadata: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
if (failed) process.exit(1);
