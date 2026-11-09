'use strict';
/**
 * super-unit-limit-one-test.cjs -- R-WEB-SUPER-UNIT-LIMIT-ONE-NOT-ENFORCED-Q1.
 * Limit "max 1 Super-jednostka na cywilizacje" musi liczyc CALY stan cywilizacji
 * (zywe + kolejki rekrutacji wszystkich miast) i byc egzekwowany po stronie wykonania.
 * Uruchom z gra/:  node tools/super-unit-limit-one-test.cjs
 *
 * Pure logic (esbuild bundle production.ts + empire-recruit-plan.ts, prawdziwe units.json)
 * + kontrola statyczna main.ts/cityPanel.ts (main.ts jest zbyt duzy/DOM-owy do bundlowania).
 */
const fs = require('fs');
const path = require('path');
const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[super-unit-limit-one-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY = path.resolve(__dirname, '.super-unit-limit-entry.ts');
const BUNDLE = path.resolve(__dirname, '.super-unit-limit-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { availableProduction, availableReplacementsFor, reservedUnitTypeNames, superUnitLimitViolation,
  enqueueRecruitment, SUPER_UNIT_LIMIT_BLOCK_PL } from '../src/game/production';
export { executeEmpireRecruitment } from '../src/game/empire-recruit-plan';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'] });
} catch (e) { console.error('bundling failed:\n', e.message || e); process.exit(1); }
const M = require(BUNDLE);
fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);

const unitsJson = require('../data/units.json');
const DATA = { buildings: [], units: Object.values(unitsJson) };
const SUPER = 'Hieros Lochos (Święty Zastęp)';
const superDef = DATA.units.find(u => u.Jednostka === SUPER);
const plainDef = DATA.units.find(u => u.Jednostka === 'Wojownik mykeński');

let passed = 0, failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + (extra ? ' -- ' + extra : '')); }
}

const GRECJA_CTX = {
  epoch: 3, civUnitNacja: 'Grecja', civBonusy: [],
  builtBuildingIds: ['odlewnia_zelaza', 'koszary'],
  placedImprovements: null, hasKopalniaNaZlozuZelaza: true,
  empireResourceStock: { braz: 50, zelazo: 100, drewno: 50 },
};
const TECHS = ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'];
const CITY = { id: 'c1', ownerId: 0, q: 0, r: 0 };
const idsOf = items => items.map(i => i.id);
const prodWith = (...ids) => ({
  kolejka: [], postep: 0,
  rekrutacja: ids.map(id => ({ kind: 'jednostka', id, nazwa: id, koszt: 1 })),
});

console.log('\n[super-unit-limit-one-test]\n');

console.log('0. Dane: Hieros Lochos to Super-jednostka, Wojownik mykenski nie');
assert(superDef && superDef['Super-jednostka'] === 'TAK', 'Hieros Lochos Super-jednostka=TAK');
assert(plainDef && plainDef['Super-jednostka'] !== 'TAK', 'Wojownik mykenski zwykla');

console.log('\n1. Baseline: bez zywych/kolejki Super jest dostepna w produkcji');
{
  const reserved = M.reservedUnitTypeNames([], [undefined]);
  const items = M.availableProduction(CITY, DATA, TECHS, { ...GRECJA_CTX, ownerId: 0, aliveUnitTypeNames: reserved });
  assert(idsOf(items).includes(SUPER), 'Hieros Lochos na liscie rekrutacji', 'n=' + items.length);
}

console.log('\n2. (a) Kolejka rekrutacji: zakolejkowana (nie zywa) Super rezerwuje limit');
{
  const reserved = M.reservedUnitTypeNames([], [prodWith(SUPER)]);
  assert(reserved.has(SUPER), 'reserved zawiera Super z kolejki rekrutacji');
  const items = M.availableProduction(CITY, DATA, TECHS, { ...GRECJA_CTX, ownerId: 0, aliveUnitTypeNames: reserved });
  assert(!idsOf(items).includes(SUPER), 'Super znika z listy rekrutacji gdy jest w kolejce');
  const msg = M.superUnitLimitViolation(superDef, SUPER, reserved, 1);
  assert(msg === M.SUPER_UNIT_LIMIT_BLOCK_PL && /Super-jednostki/.test(msg), 'druga sztuka odrzucona z komunikatem PL', msg);
  // kolejka przez enqueueRecruitment (realna sciezka) tez liczona
  const p = M.enqueueRecruitment({ kolejka: [], postep: 0 }, { kind: 'jednostka', id: SUPER, nazwa: SUPER, koszt: 1 });
  assert(M.reservedUnitTypeNames([], [p]).has(SUPER), 'enqueueRecruitment -> rezerwacja widoczna');
}

console.log('\n3. (b) Ilosc > 1 w jednej partii (panel miasta / zbiorczy / RECRUIT-ALL)');
{
  assert(M.superUnitLimitViolation(superDef, SUPER, new Set(), 1) === null, 'ilosc 1 przy pustym stanie: OK');
  assert(M.superUnitLimitViolation(superDef, SUPER, new Set(), 2) !== null, 'ilosc 2 odrzucona nawet bez zywych');
  assert(M.superUnitLimitViolation(plainDef, plainDef.Jednostka, new Set([plainDef.Jednostka]), 5) === null, 'zwykla jednostka bez limitu');
}

console.log('\n4. (b) Dwa miasta: kolejka w miescie A blokuje miasto B (limit na cywilizacje)');
{
  const reserved = M.reservedUnitTypeNames([], [prodWith(SUPER), undefined, { kolejka: [], postep: 0 }]);
  const itemsB = M.availableProduction({ id: 'c2' }, DATA, TECHS, { ...GRECJA_CTX, ownerId: 0, aliveUnitTypeNames: reserved });
  assert(!idsOf(itemsB).includes(SUPER), 'miasto B nie widzi Super gdy miasto A ma ja w kolejce');
  assert(M.superUnitLimitViolation(superDef, SUPER, reserved, 1) !== null, 'zakup w miescie B odrzucony w wykonaniu');
}

console.log('\n5. (c) Zastap: zywa Super blokuje zamiane Wojownik mykenski -> Hieros Lochos');
{
  const free = M.availableReplacementsFor('Wojownik mykeński', DATA, TECHS, { ...GRECJA_CTX, ownerId: 0, aliveUnitTypeNames: new Set() });
  assert(idsOf(free).includes(SUPER), 'bez Super: Zastap oferuje Hieros Lochos', JSON.stringify(idsOf(free)));
  const aliveReserved = M.reservedUnitTypeNames([SUPER, 'Wojownik mykeński'], []);
  const blocked = M.availableReplacementsFor('Wojownik mykeński', DATA, TECHS, { ...GRECJA_CTX, ownerId: 0, aliveUnitTypeNames: aliveReserved });
  assert(!idsOf(blocked).includes(SUPER), 'z zywa Super: Zastap nie oferuje drugiej');
  const queuedReserved = M.reservedUnitTypeNames(['Wojownik mykeński'], [prodWith(SUPER)]);
  const blocked2 = M.availableReplacementsFor('Wojownik mykeński', DATA, TECHS, { ...GRECJA_CTX, ownerId: 0, aliveUnitTypeNames: queuedReserved });
  assert(!idsOf(blocked2).includes(SUPER), 'z Super w kolejce rekrutacji: Zastap jej nie oferuje');
  assert(M.superUnitLimitViolation(superDef, SUPER, aliveReserved, 1) !== null, 'wykonanie zamiany (performUnitReplace) odrzuci druga sztuke');
  // zamiana wielu jednostek naraz: po pierwszej zamianie zywa Super blokuje kolejne
  const afterFirst = M.reservedUnitTypeNames([SUPER, 'Wojownik mykeński'], []);
  assert(M.superUnitLimitViolation(superDef, SUPER, afterFirst, 1) !== null, 'druga zamiana z rzedu odrzucona');
}

console.log('\n6. (d) Wczytany zapis / jednostki spoza widoku tury: liczy caly roster przekazany przez wolajacego');
{
  // Roster z 6 sztukami (stary zapis) -> reserved nadal zawiera Super => nowe sztuki blokowane, jednostek nie ruszamy.
  const legacy = M.reservedUnitTypeNames(Array(6).fill(SUPER), []);
  assert(legacy.has(SUPER) && M.superUnitLimitViolation(superDef, SUPER, legacy, 1) !== null, 'zapis z 6 sztukami: nowe blokowane');
  // legacy kolejka produkcji (przed migracja) tez liczona
  const legacyQ = M.reservedUnitTypeNames([], [{ kolejka: [{ kind: 'jednostka', id: SUPER, nazwa: SUPER, koszt: 1 }], postep: 0 }]);
  assert(legacyQ.has(SUPER), 'jednostka w legacy kolejka[] tez rezerwuje');
}

console.log('\n7. (b) Zbiorczy panel imperium: maxTotal=1 ucina zamowienie 4 sztuk do 1');
{
  const calls = [];
  const miasta = ['a', 'b', 'c', 'd'].map(id => ({ cityId: id, canRecruit: true, queuedOfType: 0, queueLength: 0 }));
  const out = M.executeEmpireRecruitment({
    typLabel: SUPER, ilosc: 4, miasta, maxTotal: 1, maxTotalReason: M.SUPER_UNIT_LIMIT_BLOCK_PL,
    purchase: (cityId, count) => { calls.push([cityId, count]); return true; },
  });
  const total = calls.reduce((s, c) => s + c[1], 0);
  assert(total === 1 && out.accepted === 1, 'zamowiono lacznie 1 sztuke', JSON.stringify(calls));
  assert(/Super-jednostki/.test(out.message), 'komunikat PL zawiera przyczyne limitu', out.message);
  const out2 = M.executeEmpireRecruitment({ typLabel: 'X', ilosc: 3, miasta, purchase: () => true });
  assert(out2.accepted === 3, 'bez maxTotal: zachowanie bez zmian (3)');
}

console.log('\n8. Kontrola statyczna wpiecia w main.ts / cityPanel.ts (egzekucja, AI, wszystkie ctx)');
{
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const panel = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'ui', 'cityPanel.ts'), 'utf8');
  const legacyAlive = (main.match(/aliveUnitTypeNames:\s*new Set\(/g) || []).length;
  assert(legacyAlive === 0, 'zadne ctx nie liczy juz tylko zywych (new Set(units...))', 'pozostalo=' + legacyAlive);
  const viaHelper = (main.match(/aliveUnitTypeNames:\s*reservedUnitTypeNamesForOwner\(/g) || []).length;
  assert(viaHelper === 4, '4 ctx (Zastap, panel, produkcja AI, AI build) uzywaja rezerwacji calej cywilizacji', 'n=' + viaHelper);
  assert(/getAliveUnitTypeNames:\s*\(ownerId: number\) => reservedUnitTypeNamesForOwner\(ownerId\)/.test(main), 'getAliveUnitTypeNames (panel miasta) = rezerwacja');
  const guards = (main.match(/superUnitLimitViolation\(/g) || []).length;
  assert(guards >= 3, 'guard w purchaseRecruitmentUnit, purchaseRecruitmentUnits i performUnitReplace', 'n=' + guards);
  assert(/maxTotal:\s*unitDef\?\.\['Super-jednostka'\] === 'TAK' \? 1/.test(main), 'zbiorczy panel: maxTotal=1 dla Super');
  assert(/udef\['Super-jednostka'\] === 'TAK' \? 1 : maxAffordableRecruitQuantity/.test(panel), 'licznik panelu miasta: max 1 dla Super');
}

console.log(`\n[super-unit-limit-one-test] ${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
