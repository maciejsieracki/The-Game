'use strict';
/**
 * unit-replace-full-cost-test.cjs -- R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1
 * (decyzja wlasciciela 2026-11-09: "Zastap" = PELNY koszt rekrutacji nowej jednostki: Pieniadz + surowiec,
 * dla gracza I AI; jednostka zachowuje doswiadczenie; Koszary jak w polu -- unia po miastach panstwa).
 * Run z gra/:  node tools/unit-replace-full-cost-test.cjs
 * Pure logic + kontrola okablowania w zrodle (main.ts nie da sie zbundlowac bez DOM).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.unit-replace-fullcost-entry.ts');
const bundle = path.resolve(__dirname, '.unit-replace-fullcost-bundle.cjs');
fs.writeFileSync(entry, `
export { unitReplaceFullCost, canAffordUnitReplace, unitReplaceStockMissing, unitReplaceStockMissingLabel, unitReplaceStockText, mergeStockPaid } from '../src/game/unit-replace-cost';
export { promoteAiUnitForEra } from '../src/game/ai-era-unit-promotion';
export { availableReplacementsFor, newestAvailableSameTypeUnit, unitProductionItem, epochNumber } from '../src/game/production';
export { unitStockCost, ownerResourceStockAll, deductBuildingStockCostAcrossCities, disbandStockRefund, stockPaidOf } from '../src/game/building-stock-cost';
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
const moneyOf = (id, owner) => M.unitProductionItem(id, data, [], 'niski', owner ?? 0, 'normal').koszt;

// --- A. funkcja kosztu -------------------------------------------------------
console.log('\n== A. koszt = pelna rekrutacja nowej jednostki ==');
const newMoney = moneyOf(NEW); const oldMoney = moneyOf(OLD);
const cost = M.unitReplaceFullCost(def(NEW), newMoney);
const recruitStock = M.unitStockCost(def(NEW));
assert(cost.money === newMoney && cost.money > oldMoney, `Pieniadz = pelny koszt nowej (${cost.money}), NIE roznica ${newMoney - oldMoney}`);
assert(JSON.stringify(cost.stock) === JSON.stringify(recruitStock) && (cost.stock.braz ?? 0) > 0, `surowiec = pelny koszt rekrutacji nowej: ${JSON.stringify(cost.stock)}`);
assert(M.unitReplaceFullCost(def(NEW), 0).money === 0, 'koszt 0 Pieniadza nie jest ujemny/NaN');
// sidegrade/downgrade tez kosztuje pelna cene (brak "max(0, nowa-stara)")
const downCost = M.unitReplaceFullCost(def(OLD), oldMoney);
assert(downCost.money === oldMoney && oldMoney > 0, 'zamiana na tansza/rowna jednostke tez kosztuje jej pelna cene (bez zwrotu starej)');
// Mount: +Konie jak w rekrutacji
const mount = M.unitReplaceFullCost(def('Konnica'), moneyOf('Konnica'));
assert((mount.stock.kon ?? 0) > 0, 'Typ Mount: koszt zamiany zawiera Konie jak rekrutacja ' + JSON.stringify(mount.stock));

// --- B. dostepnosc / powody po polsku ---------------------------------------
console.log('\n== B. dostepnosc ==');
const rich = { drewno: 500, braz: 500, kon: 500 };
assert(M.canAffordUnitReplace(cost, newMoney, rich), 'stac na pelny koszt -> dostepna');
assert(!M.canAffordUnitReplace(cost, newMoney - 1, rich), 'Pieniadz o 1 za maly -> niedostepna');
const lowBraz = { braz: (cost.stock.braz ?? 0) - 1 };
assert(!M.canAffordUnitReplace(cost, newMoney, lowBraz), 'surowiec o 1 za maly -> niedostepna (nie wystarcza samo ">0")');
assert(M.canAffordUnitReplace(cost, newMoney, { braz: cost.stock.braz }), 'dokladnie tyle surowca -> dostepna');
const lbl = M.unitReplaceStockMissingLabel(cost, lowBraz);
assert(/Brakuje w magazynie państwa: 1 Br/.test(lbl || ''), 'powod po polsku z brakujaca iloscia: ' + lbl);
assert(M.unitReplaceStockMissingLabel(cost, rich) === null, 'brak powodu gdy stac');
assert(/^\d+ Br/.test(M.unitReplaceStockText(cost)), 'tekst kosztu surowca do UI: ' + M.unitReplaceStockText(cost));

// --- C. AI i gracz: ta sama funkcja kosztu ----------------------------------
console.log('\n== C. AI: pelny koszt z puli panstwa, doswiadczenie zachowane ==');
const ctx = { epoch: 2, civUnitNacja: '', civBonusy: [], builtBuildingIds: ['koszary'], empireResourceStock: { drewno: 500, braz: 500 }, kosztJednostekPace: 'niski', difficulty: 'normal', ownerId: 7 };
let treasury = 10000; let pool = { drewno: 500, braz: 500 };
function aiDeps(poolRef) {
  return {
    oldDefinition: v => def(v.typeId),
    candidates: v => M.availableReplacementsFor(v.typeId, data, ['Brązownictwo'], ctx).map(i => def(i.id)).filter(Boolean),
    newestSameRole: (v, cs) => M.newestAvailableSameTypeUnit(v.typeId, cs.map(d => d.Jednostka), units),
    epochNumber: M.epochNumber,
    unitCost: id => moneyOf(id, 7),
    stockCost: t => M.unitStockCost(def(t.Jednostka)),
    canPayStock: c => M.canAffordUnitReplace({ money: 0, stock: c }, 0, pool),
    payStock: (c, u) => { for (const [k, v] of Object.entries(c)) pool[k] -= v; u.stockPaid = M.mergeStockPaid(u.stockPaid, c); },
    currentTreasury: () => treasury, setTreasury: v => { treasury = v; },
    oldMaxHp: () => 20, newMaxHp: () => 28, category: t => String(t['Rola (linia)'] ?? ''),
  };
}
const mk = (extra) => Object.assign({ ownerId: 7, typeId: OLD, category: 'Wrecz', hp: 10, hpMax: 20, ruchLeft: 1, replaceUsedThisTurn: false }, extra || {});
const vet = mk({ battlesSurvived: 3, pancerzBonusProc: 12, parametryBonusProc: 7, isGeneral: false, followGeneral: true, stackGroupId: 'g1', stockPaid: { drewno: 13 } });
const t0 = treasury; const p0 = { ...pool };
assert(M.promoteAiUnitForEra(vet, aiDeps()), 'AI zamienia Wojownika (stac na pelny koszt)');
assert(treasury === t0 - newMoney, `AI zaplacil PELNY Pieniadz nowej (${newMoney}), nie roznice`);
assert(pool.braz === p0.braz - recruitStock.braz, `AI zuzyl PELNY Braz z puli panstwa (${recruitStock.braz})`);
// symetria: AI pobiera DOKLADNIE to, co zwraca ta sama funkcja, ktorej uzywa gracz (performUnitReplace)
const pcFull = M.unitReplaceFullCost(def(NEW), newMoney);
assert(t0 - treasury === pcFull.money && Object.keys(pcFull.stock).every(k => p0[k] - pool[k] === pcFull.stock[k]),
  'symetria gracz/AI: AI pobral dokladnie unitReplaceFullCost (Pieniadz + kazdy surowiec)');
assert(vet.battlesSurvived === 3 && vet.pancerzBonusProc === 12 && vet.parametryBonusProc === 7 && vet.followGeneral === true && vet.stackGroupId === 'g1',
  'doswiadczenie/weteran/bonusy pancerza i parametrow/armia ZACHOWANE po zamianie');
assert(vet.hp === 14 && vet.hpMax === 28, 'HP% zachowane (50%)');
assert(vet.stockPaid.drewno === 13 && vet.stockPaid.braz === recruitStock.braz, 'stockPaid = stary slad + zuzycie zamiany (zwrot 100% przy rozwiazaniu pozostaje spojny)');
const refund = M.disbandStockRefund(M.stockPaidOf(vet));
assert(refund.braz === recruitStock.braz && refund.drewno === 13, 'rozwiazanie zamienionej jednostki zwraca 100% zuzytych surowcow');
// brak surowca / pieniedzy
const poorStock = mk(); pool = { drewno: 500, braz: recruitStock.braz - 1 }; treasury = 10000;
assert(!M.promoteAiUnitForEra(poorStock, aiDeps()) && poorStock.typeId === OLD && treasury === 10000, 'AI: brak pelnego surowca -> pomija, nic nie pobrano');
const poorMoney = mk(); pool = { drewno: 500, braz: 500 }; treasury = newMoney - 1;
assert(!M.promoteAiUnitForEra(poorMoney, aiDeps()) && poorMoney.typeId === OLD && pool.braz === 500, 'AI: brak Pieniadza -> pomija, nic nie pobrano');
// D2 = A: brak limitu na ture, naturalnie ograniczone surowcem
pool = { drewno: 500, braz: recruitStock.braz * 5 + 3 }; treasury = 1e9;
const army = Array.from({ length: 12 }, () => mk());
const done = army.filter(u => M.promoteAiUnitForEra(u, aiDeps())).length;
assert(done === 5, `D2=A: bez limitu na ture -- zamiana ograniczona wylacznie zasobami (5 z 12, bylo ${done})`);

// --- D. okablowanie w main.ts / UI ------------------------------------------
console.log('\n== D. okablowanie (zrodlo) ==');
const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const slice = (a, b) => main.slice(main.indexOf(a), main.indexOf(b, main.indexOf(a)));
const perform = slice('function performUnitReplace(', 'function buildPlayerCityListEntries');
// R-WEB-AI-UNIT-REPLACE-SAME-RULES-AS-PLAYER-Q1: mutacja i koszt zyja we WSPOLNYM module (executeUnitReplace),
// wolanym i przez gracza (performUnitReplace), i przez AI (promoteAiUnitForEra).
const execSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'unit-replace-execute.ts'), 'utf8');
const execDepsSrc = slice('function unitReplaceExecuteDeps(', 'function performUnitReplace(');
assert(/executeUnitReplace\(u, newTypeId, unitReplaceExecuteDeps\(u\.ownerId, true\)\)/.test(perform) && /deductBuildingStockCostAcrossCities\(cities, ownerId, cost\)/.test(execDepsSrc) && /player\.skarbiec = value/.test(execDepsSrc),
  'performUnitReplace (gracz): pobiera PELNY Pieniadz + surowiec z puli panstwa (wspolny executeUnitReplace)');
assert(!/Math\.max\(0, replaceUnitMoneyCost/.test(perform) && !/dopłat/i.test(perform), 'performUnitReplace: brak starej logiki "dopłaty"');
assert(!/manpower|Manpower|UNIT_POPULATION_COST/.test(perform), 'performUnitReplace: nie dotyka Manpower/Ludnosci');
{
  const iStockGate = execSrc.indexOf("reason: 'stock'");
  const iMoneyGate = execSrc.indexOf("reason: 'money'");
  const iMutMoney = execSrc.indexOf('deps.setTreasury(treasury - money)');
  const iMutStock = execSrc.indexOf('deps.payStock(stock, unit)');
  assert(iStockGate > -1 && iMoneyGate > -1 && iStockGate < iMutMoney && iMoneyGate < iMutMoney && iMutMoney < iMutStock,
    'performUnitReplace: bramki surowca i Pieniadza PRZED jakakolwiek mutacja (kolejnosc w zrodle)');
}
assert(!/battlesSurvived\s*=|pancerzBonusProc\s*=|parametryBonusProc\s*=/.test(perform), 'performUnitReplace: nie zeruje doswiadczenia/bonusow');
const ai = slice('function upgradeAiUnitsForEra(', 'function bestGeneralUnitForOwner');
assert(/stockCost: target =>/.test(ai) && /canPayStock: cost =>/.test(ai) && /payStock: \(cost, unit\) =>/.test(ai), 'upgradeAiUnitsForEra: hooki surowcowe podane (wymagane przez promoteAiUnitForEra)');
const promoSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'ai-era-unit-promotion.ts'), 'utf8');
assert(!/deps\.(stockCost|canPayStock|payStock)\?\./.test(promoSrc) && !/stockCost\?\(|canPayStock\?\(|payStock\?\(/.test(promoSrc),
  'promoteAiUnitForEra: hooki surowcowe WYMAGANE (brak ?.-wywolan, ktore po cichu pomijaja koszt surowca)');
assert(/stockCost:/.test(ai) && /canPayStock:/.test(ai) && /payStock:/.test(ai) && /unitReplaceExecuteDeps\(ownerId, false\)/.test(ai) && /deductBuildingStockCostAcrossCities/.test(execDepsSrc), 'upgradeAiUnitsForEra: ta sama funkcja kosztu (Pieniadz + surowiec z puli) co gracz');
assert(/Zastąp specjalnie/.test(ai), 'AI: awans miedzy typami tylko wg tabeli "Zastąp specjalnie" (D3 = C)');
const picker = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'ui', 'unitReplacePicker.ts'), 'utf8');
assert(/Koszt = pełna rekrutacja nowej jednostki; zachowuje doświadczenie/.test(picker) && !/Dopłata = koszt nowej/.test(picker), 'UI: opis "Koszt = pełna rekrutacja nowej jednostki; zachowuje doświadczenie"');
assert(/moneyCost/.test(picker) && !/surcharge/.test(picker), 'UI: karta pokazuje pelny koszt (Pieniadz + surowiec), bez "surcharge"');
const openPicker = slice('function openUnitReplacePicker(', 'function performUnitReplace(');
assert(/unitReplaceStockMissingLabel\(fullCost, ownerPool\)/.test(openPicker), 'UI: brak pelnej ilosci surowca -> wyszarzone z powodem po polsku');

// --- E. Koszary: jedna regula (unia po miastach panstwa) ---------------------
console.log('\n== E. Koszary: garnizon = pole ==');
const ctxFn = slice('function unitReplaceCtx(', 'function computeUnitReplacements(');
assert(/replaceAvailabilityCtxEmpireWide\(u\.ownerId\)/.test(ctxFn) && !/replaceAvailabilityCtxForCity/.test(main),
  'unitReplaceCtx zawsze uzywa unii po miastach (zadnej galezi per-miasto garnizonu)');
{
  const base = { epoch: 2, civUnitNacja: 'Grecja', civBonusy: [], empireResourceStock: { drewno: 99, braz: 99 }, kosztJednostekPace: 'niski', difficulty: 'normal', ownerId: 0 };
  const garrisonCityOnly = M.availableReplacementsFor(OLD, data, ['Brązownictwo'], { ...base, builtBuildingIds: [] }).length;
  const empireUnion = M.availableReplacementsFor(OLD, data, ['Brązownictwo'], { ...base, builtBuildingIds: ['koszary'] }).length;
  assert(garrisonCityOnly === 0 && empireUnion > 0, 'regula dostepnosci: Koszary w DOWOLNYM miescie odblokowuja zamienniki (miasto bez Koszar nie blokuje)');
}

// --- F0. Taran okuty -> Katapulta (Zelazo) dla wszystkich nacji (audyt Dodatku 2) ----
console.log('\n== F0. Taran okuty -> Katapulta w Zelazie, 16 nacji ==');
{
  const nations = [...new Set(units.map(u => u.Nacja).filter(Boolean))];
  const techsIron = [...new Set(units.map(u => u.Tech).filter(t => t && t !== '-' && t !== '—'))];
  const missing = nations.filter(nat => !M.availableReplacementsFor('Taran okuty', data, techsIron, {
    epoch: 3, civUnitNacja: nat, civBonusy: [], builtBuildingIds: ['koszary', 'stajnia', 'warsztat', 'cegielnia', 'kuznia'],
    empireResourceStock: { drewno: 9999, braz: 9999, zelazo: 9999, kon: 9999, kamien: 9999 }, kosztJednostekPace: 'niski',
    difficulty: 'normal', ownerId: 0, aliveUnitTypeNames: new Set(), cityHasCoastOrRiver: true, cityHasRiver: true,
  }).some(i => i.id === 'Katapulta'));
  assert(nations.length === 16 && missing.length === 0, 'Taran okuty ma zamiennik Katapulta w Zelazie u 16/16 nacji' + (missing.length ? ' (brak: ' + missing.join(', ') + ')' : ''));
}

// --- F. D3 = C: awans miedzy typami przez "Zastąp specjalnie" -----------------
console.log('\n== F. awans miedzy typami (tabela = pole "Zastąp specjalnie") ==');
const rzym = { epoch: 3, civUnitNacja: 'Rzym', civBonusy: [], builtBuildingIds: ['koszary'], empireResourceStock: { zelazo: 50, braz: 50, drewno: 50 }, kosztJednostekPace: 'niski', difficulty: 'normal', ownerId: 0 };
const techsAll = [...new Set(units.map(u => u.Tech).filter(t => t && t !== '-' && t !== '—'))];
const tyr = M.availableReplacementsFor('Wojownik tyrreński', data, techsAll, rzym).map(i => i.id);
assert(tyr.includes('Evocati'), 'Wojownik tyrreński (Offensive) -> Evocati (Swordsman) przez "Zastąp specjalnie" (inny Typ)');
const rzymBez = M.availableReplacementsFor('Wojownik tyrreński', data, techsAll, { ...rzym, epoch: 2 }).map(i => i.id);
assert(!rzymBez.includes('Evocati'), 'Evocati niedostepny w epoce Brazu -> brak awansu (bramki epoki)');

console.log(`\nunit-replace pelny koszt: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
if (failed) process.exit(1);
