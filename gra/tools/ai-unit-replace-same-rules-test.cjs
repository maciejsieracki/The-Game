'use strict';
/**
 * ai-unit-replace-same-rules-test.cjs -- R-WEB-AI-UNIT-REPLACE-SAME-RULES-AS-PLAYER-Q1
 * AI zamienia (ulepsza) jednostki wg TYCH SAMYCH regul co gracz: jeden wspolny modul wykonania
 * (executeUnitReplace), PELNY koszt (Pieniadz + surowce), 1 zamiana/jednostke/ture, limit Super-jednostki,
 * rola wodza, limit zamian na ture (<=10% armii), bez ruszania jednostek w bitwie/oblezeniu/zagrozeniu,
 * zachowanie klasy armii (wrecz/dystans/konnica).
 * Run z gra/:  node tools/ai-unit-replace-same-rules-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.ai-unit-replace-same-rules-entry.ts');
const bundle = path.resolve(__dirname, '.ai-unit-replace-same-rules-bundle.cjs');
fs.writeFileSync(entry, `
export { executeUnitReplace } from '../src/game/unit-replace-execute';
export { promoteAiUnitForEra } from '../src/game/ai-era-unit-promotion';
export { aiUnitReplaceCap, planAiUnitReplaceOrder, aiReplaceKeepsArmyClass, AI_UNIT_REPLACE_MAX_FRACTION } from '../src/game/ai-unit-replace-plan';
export { unitReplaceFullCost, canAffordUnitReplace, mergeStockPaid } from '../src/game/unit-replace-cost';
export { availableReplacementsFor, newestAvailableSameTypeUnit, unitProductionItem, epochNumber } from '../src/game/production';
export { unitStockCost } from '../src/game/building-stock-cost';
export { superUnitLimitViolation } from '../src/game/production';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const M = require(bundle);
const units = require('../data/units.json');
const data = { units, buildings: [] };
const def = n => units.find(u => u.Jednostka === n);
let passed = 0; let failed = 0;
function assert(ok, label) { if (ok) { passed++; console.log('  [OK] ' + label); } else { failed++; console.error('  [FAIL] ' + label); } }

const OLD = 'Wojownik';
const NEW = 'Wojownik z mieczem i tarczą';
const moneyOf = id => M.unitProductionItem(id, data, [], 'niski', 7, 'normal').koszt;
const newMoney = moneyOf(NEW);
const needStock = M.unitStockCost(def(NEW));
const mk = (extra) => Object.assign({ ownerId: 7, typeId: OLD, category: 'Wrecz', hp: 10, hpMax: 20, ruchLeft: 1, replaceUsedThisTurn: false }, extra || {});

let treasury; let pool;
function execDeps(over) {
  return Object.assign({
    gateReason: () => null,
    moneyCost: id => moneyOf(id),
    stockCost: id => M.unitStockCost(def(id)),
    canPayStock: c => M.canAffordUnitReplace({ money: 0, stock: c }, 0, pool),
    payStock: (c, u) => { for (const [k, v] of Object.entries(c)) pool[k] -= v; u.stockPaid = M.mergeStockPaid(u.stockPaid, c); },
    currentTreasury: () => treasury, setTreasury: v => { treasury = v; },
    oldMaxHp: () => 20, newMaxHp: () => 28, category: () => 'Wrecz',
  }, over || {});
}

console.log('\n== A. wspolny executeUnitReplace: pelny koszt Pieniadz + surowce ==');
treasury = 10000; pool = { drewno: 500, braz: 500 };
const t0 = treasury; const p0 = { ...pool };
const u1 = mk({ battlesSurvived: 3, pancerzBonusProc: 12, parametryBonusProc: 7, isGeneral: true, stackGroupId: 'g1' });
const r1 = M.executeUnitReplace(u1, NEW, execDeps({ syncHpMax: true }));
assert(r1.ok && u1.typeId === NEW, 'zamiana wykonana przez wspolny modul');
assert(t0 - treasury === newMoney && newMoney > 0, `zaplacono PELNY Pieniadz nowej jednostki (${newMoney})`);
assert(Object.keys(needStock).length > 0 && Object.entries(needStock).every(([k, v]) => p0[k] - pool[k] === v), 'pobrano PELNE surowce z puli: ' + JSON.stringify(needStock));
assert(u1.isGeneral === true && u1.stackGroupId === 'g1', 'rola wodza (isGeneral) i armia (stackGroupId) zachowane');
assert(u1.battlesSurvived === 3 && u1.pancerzBonusProc === 12 && u1.parametryBonusProc === 7, 'wyszkolenie/bonusy zachowane');
assert(u1.hp === 14 && u1.hpMax === 28 && u1.ruchLeft === 0 && u1.replaceUsedThisTurn === true, 'HP% zachowane, ruch zuzyty, flaga tury ustawiona');

console.log('\n== B. brak zasobow = brak zamiany (zero mutacji) ==');
{
  treasury = 10000; pool = { drewno: 500, braz: (needStock.braz ?? 1) - 1 };
  const u = mk(); const r = M.executeUnitReplace(u, NEW, execDeps());
  assert(!r.ok && r.reason === 'stock' && u.typeId === OLD && treasury === 10000 && pool.braz === (needStock.braz ?? 1) - 1 && !u.replaceUsedThisTurn, 'brak surowca -> bez zamiany i bez pobrania');
  treasury = newMoney - 1; pool = { drewno: 500, braz: 500 };
  const u2 = mk(); const r2 = M.executeUnitReplace(u2, NEW, execDeps());
  assert(!r2.ok && r2.reason === 'money' && u2.typeId === OLD && pool.braz === 500 && treasury === newMoney - 1, 'brak Pieniadza -> bez zamiany i bez pobrania surowca');
}

console.log('\n== C. 1 zamiana na jednostke na ture ==');
{
  treasury = 100000; pool = { drewno: 5000, braz: 5000 };
  const u = mk();
  assert(M.executeUnitReplace(u, NEW, execDeps()).ok, 'pierwsza zamiana OK');
  const t1 = treasury;
  const r = M.executeUnitReplace(u, 'Wojownik z mieczem i tarczą', execDeps());
  assert(!r.ok && r.reason === 'used' && treasury === t1, 'druga w tej samej turze odrzucona, nic nie pobrano');
}

console.log('\n== D. limit Super-jednostki (brama wspolna) ==');
{
  treasury = 100000; pool = { drewno: 5000, braz: 5000 };
  const u = mk();
  const r = M.executeUnitReplace(u, NEW, execDeps({ gateReason: () => 'Zastąp: limit Super-jednostki' }));
  assert(!r.ok && r.reason === 'gate' && u.typeId === OLD && treasury === 100000, 'brama (Super max 1) blokuje przed kosztem');
  const sup = units.find(x => x['Super-jednostka'] === 'TAK');
  if (sup) {
    const v = M.superUnitLimitViolation(sup, sup.Jednostka, new Set([sup.Jednostka]), 1);
    assert(!!v, 'superUnitLimitViolation: druga sztuka Super zablokowana (' + sup.Jednostka + ')');
  } else assert(true, 'brak Super-jednostek w danych (NIE_ZMIERZONO)');
}

console.log('\n== E. AI: promoteAiUnitForEra deleguje do wspolnego modulu ==');
{
  const ctx = { epoch: 2, civUnitNacja: '', civBonusy: [], builtBuildingIds: ['koszary'], empireResourceStock: { drewno: 500, braz: 500 }, kosztJednostekPace: 'niski', difficulty: 'normal', ownerId: 7 };
  treasury = 10000; pool = { drewno: 500, braz: 500 };
  const aiDeps = (gate) => ({
    oldDefinition: v => def(v.typeId),
    candidates: v => M.availableReplacementsFor(v.typeId, data, ['Brązownictwo'], ctx).map(i => def(i.id)).filter(Boolean),
    newestSameRole: (v, cs) => M.newestAvailableSameTypeUnit(v.typeId, cs.map(d => d.Jednostka), units),
    epochNumber: M.epochNumber,
    gateReason: gate,
    unitCost: id => moneyOf(id),
    stockCost: t => M.unitStockCost(def(t.Jednostka)),
    canPayStock: c => M.canAffordUnitReplace({ money: 0, stock: c }, 0, pool),
    payStock: (c, u) => { for (const [k, v] of Object.entries(c)) pool[k] -= v; },
    currentTreasury: () => treasury, setTreasury: v => { treasury = v; },
    oldMaxHp: () => 20, newMaxHp: () => 28, category: () => 'Wrecz',
  });
  const a = mk();
  assert(M.promoteAiUnitForEra(a, aiDeps()) && a.typeId === NEW && treasury === 10000 - newMoney, 'AI: zamiana za pelny koszt');
  assert(!M.promoteAiUnitForEra(a, aiDeps()), 'AI: 1 zamiana/jednostke/ture');
  const g = mk(); const tg = treasury;
  assert(!M.promoteAiUnitForEra(g, aiDeps(() => 'limit')) && g.typeId === OLD && treasury === tg, 'AI: brama (limit Super) blokuje zamiane');
  pool = { drewno: 500, braz: 0 }; const tp = treasury;
  assert(!M.promoteAiUnitForEra(mk(), aiDeps()) && treasury === tp, 'AI: bez surowca -> brak zamiany, skarbiec nietkniety');
}

console.log('\n== F. limit zamian na ture i kolejnosc (najstarsze/najslabsze najpierw) ==');
assert(M.aiUnitReplaceCap(0) === 0 && M.aiUnitReplaceCap(5) === 1 && M.aiUnitReplaceCap(10) === 1 && M.aiUnitReplaceCap(35) === 3 && M.aiUnitReplaceCap(100) === 10, 'cap = max(1, floor(10% armii)): 0->0, 5->1, 35->3, 100->10');
assert(M.AI_UNIT_REPLACE_MAX_FRACTION <= 0.1, 'parametr udzialu <= 10%');
{
  const list = [
    { id: 'a', e: 2, p: 10, b: false }, { id: 'b', e: 1, p: 9, b: false }, { id: 'c', e: 1, p: 4, b: false },
    { id: 'd', e: 1, p: 1, b: true }, { id: 'e', e: 3, p: 1, b: false },
  ];
  const order = M.planAiUnitReplaceOrder(list, x => ({ epoch: x.e, power: x.p, blocked: x.b })).map(x => x.id);
  assert(order.join('') === 'cbae', 'kolejnosc: epoka rosnaco, potem sila rosnaco: ' + order.join(''));
  assert(!order.includes('d'), 'zablokowana (bitwa/oblezenie/zagrozenie/poza terytorium) pominieta');
}

console.log('\n== G. klasa armii zachowana (wrecz/dystans/konnica) ==');
assert(M.aiReplaceKeepsArmyClass({ Typ: 'Swordsman' }, { Typ: 'Swordsman' }), 'wrecz -> wrecz dozwolone');
{
  const melee = units.find(x => /sword|spear/i.test(String(x.Typ ?? '')));
  const ranged = units.find(x => /archer|ranged|sling|crossbow/i.test(String(x.Typ ?? '')));
  const mount = units.find(x => /mount|cav/i.test(String(x.Typ ?? '')));
  if (melee && ranged) assert(!M.aiReplaceKeepsArmyClass(melee, ranged), `wrecz (${melee.Typ}) -> dystans (${ranged.Typ}) ODRZUCONE`);
  else assert(true, 'brak pary wrecz/dystans w danych (NIE_ZMIERZONO)');
  if (melee && mount) assert(!M.aiReplaceKeepsArmyClass(melee, mount), `wrecz -> konnica (${mount.Typ}) ODRZUCONE`);
  else assert(true, 'brak pary wrecz/konnica w danych (NIE_ZMIERZONO)');
}

console.log('\n== H. okablowanie w main.ts (zrodlo) ==');
const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const slice = (a, b) => main.slice(main.indexOf(a), main.indexOf(b, main.indexOf(a)));
const ai = slice('function upgradeAiUnitsForEra(', 'function bestGeneralUnitForOwner');
const perform = slice('function performUnitReplace(', 'function buildPlayerCityListEntries');
assert(/executeUnitReplace\(u, newTypeId, unitReplaceExecuteDeps\(u\.ownerId, true\)\)/.test(perform), 'gracz: performUnitReplace -> executeUnitReplace (wspolny modul)');
assert(/unitReplaceExecuteDeps\(ownerId, false\)/.test(ai) && /gateReason: \(unit, newTypeId\) => execDeps\.gateReason/.test(ai) && /execDeps\.moneyCost/.test(ai) && /execDeps\.payStock/.test(ai), 'AI: te same zaleznosci (brama Super, koszt, platnosc) co gracz');
assert(/aiUnitReplaceCap\(/.test(ai) && /planAiUnitReplaceOrder\(/.test(ai) && /done >= cap/.test(ai), 'AI: limit zamian na ture + kolejnosc najstarsze/najslabsze');
assert(/isPlayerTerritoryHex\(u\.q, u\.r, \[\], territoryNodes, ownerId\)/.test(ai), 'AI: tylko na wlasnym terytorium (jak gracz)');
assert(/oblegaCityId/.test(ai) && /hostilePositions/.test(ai), 'AI: nie rusza jednostek w oblezeniu ani pod bezposrednim zagrozeniem');
assert(/aiReplaceKeepsArmyClass/.test(ai), 'AI: zachowanie klasy armii');
assert(/ensureAiOwnerStartEra\(ownerId\);\s*if\s*\(!isCommandResume\)\s*upgradeAiUnitsForEra\(ownerId\);/.test(main), 'AI: raz na ture wlasciciela, nie przy wznowieniu komend');
assert(!/effectiveGameDifficultyForOwner\(ownerId\)[^;]{0,60}\* *1\./.test(ai), 'AI: brak mnoznika uprzywilejowania trudnosci w zamianie');

console.log(`\nai-unit-replace-same-rules: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
