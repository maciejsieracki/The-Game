'use strict';
/**
 * emporion-building-test.cjs -- standalone Node test for R-WEB-BUILDING-EMPORION-Q1.
 * Run from gra/:  node tools/emporion-building-test.cjs
 *
 * Covers (dane z gra/data/buildings.json + tech.json, logika z kodu źródłowego):
 *   A. Wpis `emporion` istnieje i ma parametry z decyzji właściciela 2026-11-05:
 *      epokaWejscia 2 (Brąz), techUnlock 'Handel', kategoria/grupa jak Targowisko,
 *      kosztBudowy 50 / przyrostKosztu 20, utrzymanie 2, dajeSzczescie false,
 *      koszt_surowce {drewno 60, kamien 60, cegla 60} (od R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1;
 *      wcześniej {drewno 80, kamien 60}), maksPoziom 1.
 *   B. Porównanie z Targowiskiem: Emporion jest droższy (koszt budowy, utrzymanie,
 *      baza.pieniadz), a przyrost pieniądza jest większy niż Targowiska.
 *   C. Technologia Handel (tech.json) odblokowuje Magazyn ORAZ Emporion.
 *   D. Wymóg miasta: CITY_BUILDING_PREREQ.emporion === 'targowisko'; prereq jest
 *      SPEŁNIONY tylko gdy w tym samym mieście stoi Targowisko (cityBuildingPrereqMet).
 *   E. Sloty tras: 'emporion' w TRADE_BUILDING_IDS; miasto z Targowiskiem + Emporion
 *      ma 2 sloty linii wymiany (tradeRouteLimitForCity) i 3 sloty istnienia
 *      (tradeRouteExistenceLimitForCity = 1 baza + 2); samo Emporion daje 1 slot.
 *   G. Trasy: Targowisko+Emporion = 3 trasy istnienia, 2 z bonusem 5% (per trasa, bez podwojnego liczenia).
 *   H. availableProduction: Emporion dostepny tylko przy Handel + Targowisko w tym samym miescie.
 *   F. Dwa budynki handlowe w jednym mieście nie kasują się nawzajem (liczba slotów
 *      rośnie monotonicznie, bez podwójnego liczenia tego samego id).
 *
 * Mutacja (zrobiona ręcznie przez Operatora, patrz raport): usunięcie 'emporion'
 * z TRADE_BUILDING_IDS czerwieni sekcję E (test slotów).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[emporion-building-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.emporion-building-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.emporion-building-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  TRADE_BUILDING_IDS, tradeRouteLimitForCity, tradeRouteExistenceLimitForCity,
  refreshTradeRoutes, tradeRouteBuildingBonusForRoute, computeTradeRouteBuildingBonusByCity,
  tradeRouteIncomeForRoute, DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
} from '../src/game/trade-routes';
export { availableProduction } from '../src/game/production';
export { CITY_BUILDING_PREREQ, cityBuildingPrereqMet } from '../src/game/building-resource-gate';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) {
  console.error('[emporion-building-test] esbuild failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const buildings = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'buildings.json'), 'utf8'));
const tech      = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'tech.json'), 'utf8'));

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const emp = buildings.find(b => b.id === 'emporion');
const tg  = buildings.find(b => b.id === 'targowisko');

// A. Wpis katalogowy
console.log('\n-- A: wpis emporion w buildings.json --');
ok(!!emp, 'wpis emporion istnieje w buildings.json');
if (emp) {
  eq(emp.epokaWejscia, 2, 'epokaWejscia (Brąz)');
  eq(emp.techUnlock, 'Handel', 'techUnlock');
  eq(emp.kategoria, tg.kategoria, 'kategoria jak Targowisko');
  eq(emp.grupa, tg.grupa, 'grupa jak Targowisko');
  eq(emp.kosztBudowy, 50, 'kosztBudowy');
  eq(emp.przyrostKosztu, 20, 'przyrostKosztu');
  eq(emp.utrzymanie, 2, 'utrzymanie');
  eq(emp.przyrostUtrzymania, 1, 'przyrostUtrzymania');
  eq(emp.maksPoziom, 1, 'maksPoziom');
  eq(emp.dajeSzczescie, false, 'dajeSzczescie');
  eq(JSON.stringify(emp.koszt_surowce), JSON.stringify({ drewno: 60, kamien: 60, cegla: 60 }), 'koszt_surowce (R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1: drewno=kamien=cegla=60)');
  ok(Array.isArray(emp.top3) && emp.top3.length === 3, 'top3 ma 3 pozycje');
  ok(typeof emp.historia === 'string' && emp.historia.length > 50, 'historia niepusta');
  ok(typeof emp.opis === 'string' && emp.opis.length > 0, 'opis niepusty');
}

// B. Porównanie z Targowiskiem
console.log('\n-- B: Emporion większy niż Targowisko --');
if (emp && tg) {
  ok(emp.kosztBudowy > tg.kosztBudowy, 'koszt budowy Emporion > Targowisko');
  ok(emp.utrzymanie > tg.utrzymanie, 'utrzymanie Emporion > Targowisko');
  ok(emp.baza.pieniadz > tg.baza.pieniadz, 'baza.pieniadz Emporion > Targowisko');
  ok(emp.przyrost.pieniadz > tg.przyrost.pieniadz, 'przyrost.pieniadz Emporion > Targowisko');
  ok(emp.epokaWejscia > tg.epokaWejscia, 'Emporion w późniejszej epoce niż Targowisko');
}

// C. Technologia Handel
console.log('\n-- C: tech Handel odblokowuje Magazyn i Emporion --');
{
  // tech.json ma tablice wierszy z kluczem "Technologia"; szukamy wiersza Handel.
  const rows = Object.values(tech).filter(Array.isArray).flat().filter(r => r && r['Technologia'] === 'Handel');
  ok(rows.length >= 1, 'wiersz Handel istnieje w tech.json');
  const row = rows[0];
  if (row) {
    const unlocks = String(row['Odblokowuje budynek'] ?? '').split(';').map(s => s.trim());
    ok(unlocks.includes('Magazyn'), `Handel odblokowuje Magazyn (ma: ${JSON.stringify(unlocks)})`);
    ok(unlocks.includes('Emporion'), `Handel odblokowuje Emporion (ma: ${JSON.stringify(unlocks)})`);
  }
}

// D. Wymóg miasta
console.log('\n-- D: wymóg Targowiska w tym samym mieście --');
eq(M.CITY_BUILDING_PREREQ.emporion, 'targowisko', 'CITY_BUILDING_PREREQ.emporion');
ok(M.cityBuildingPrereqMet(M.CITY_BUILDING_PREREQ.emporion, ['targowisko'], buildings, () => false) === true,
  'Targowisko w mieście spełnia prereq Emporion');
ok(M.cityBuildingPrereqMet(M.CITY_BUILDING_PREREQ.emporion, ['magazyn', 'port'], buildings, () => false) === false,
  'brak Targowiska w mieście blokuje Emporion');
ok(M.cityBuildingPrereqMet(M.CITY_BUILDING_PREREQ.emporion, [], buildings, () => false) === false,
  'pusta lista budynków blokuje Emporion');

// E. Sloty tras
console.log('\n-- E: sloty tras handlowych --');
ok(M.TRADE_BUILDING_IDS.has('emporion'), "TRADE_BUILDING_IDS zawiera 'emporion'");
ok(M.TRADE_BUILDING_IDS.has('targowisko'), "TRADE_BUILDING_IDS zawiera 'targowisko' (kontrola)");
{
  const m = (list) => new Map([['c1', list]]);
  eq(M.tradeRouteLimitForCity('c1', m(['emporion'])), 1, 'samo Emporion = 1 slot wymiany');
  eq(M.tradeRouteLimitForCity('c1', m(['targowisko'])), 1, 'samo Targowisko = 1 slot wymiany (kontrola)');
  eq(M.tradeRouteLimitForCity('c1', m(['targowisko', 'emporion'])), 2, 'Targowisko + Emporion = 2 sloty wymiany');
  eq(M.tradeRouteExistenceLimitForCity('c1', m(['targowisko', 'emporion'])), 3,
    'Targowisko + Emporion = 3 sloty istnienia (1 baza + 2)');
  eq(M.tradeRouteExistenceLimitForCity('c1', m([])), 1, 'miasto bez budynków = 1 slot istnienia (kontrola)');
  eq(M.tradeRouteLimitForCity('c1', m(['magazyn'])), 0, 'Magazyn NIE daje slotu (wykluczony, kontrola)');
}

// F. Monotoniczność i brak podwójnego liczenia
console.log('\n-- F: monotoniczność slotów --');
{
  const m = (list) => new Map([['c1', list]]);
  const a = M.tradeRouteLimitForCity('c1', m(['targowisko']));
  const b = M.tradeRouteLimitForCity('c1', m(['targowisko', 'emporion']));
  const c = M.tradeRouteLimitForCity('c1', m(['targowisko', 'emporion', 'port']));
  ok(a < b && b < c, `sloty rosną z każdym budynkiem handlowym (${a} < ${b} < ${c})`);
}

// G. Kwalifikacja trasy do bonusu 5% (realny refreshTradeRoutes, nie tylko stałe)
// Bonus 5% jest PER TRASA (flaga budynekOdblokowany), NIE per budynek: Emporion
// zwiększa liczbę tras kwalifikowanych do 5% (sloty), ale nie dubluje stawki na tej
// samej trasie. Opis: gra/src/game/trade-routes.ts (TRADE_ROUTE_BUILDING_BONUS_RATE).
console.log('\n-- G: trasy handlowe i bonus 5% (refreshTradeRoutes) --');
{
  const flatMap = (maxQ) => {
    const hexes = {};
    for (let q = 0; q <= maxQ; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
    return { szerokoscQ: maxQ + 1, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
  };
  const city = (id, ownerId, q) => ({ id, ownerId, q, r: 0 });
  const noWar = () => false;
  const treaty = () => true;
  const map = flatMap(40);
  // Miasto p: 3 partnerów (różni właściciele), każdy z Targowiskiem.
  const partners = [city('g-a', 1, 4), city('g-b', 2, 8), city('g-c', 3, 12)];
  const p = city('g-p', 0, 0);
  const builtOnlyTg = new Map([
    ['g-p', ['targowisko']], ['g-a', ['targowisko']], ['g-b', ['targowisko']], ['g-c', ['targowisko']],
  ]);
  const builtTgEmp = new Map([
    ['g-p', ['targowisko', 'emporion']], ['g-a', ['targowisko']], ['g-b', ['targowisko']], ['g-c', ['targowisko']],
  ]);
  // Blokujemy krawędzie między partnerami, żeby zostały tylko trasy z p.
  const touching = (routes) => routes.filter(r => r.fromCityId === p.id || r.toCityId === p.id);
  const warNoPartners = (a, b) => a !== 0 && b !== 0; // blokuje krawedzie partner-partner

  const rTg = touching(M.refreshTradeRoutes([p, ...partners], [], map, builtOnlyTg, warNoPartners, treaty));
  const rTgEmp = touching(M.refreshTradeRoutes([p, ...partners], [], map, builtTgEmp, warNoPartners, treaty));
  eq(rTg.length, 2, 'G: samo Targowisko = 2 trasy istnienia (1 baza + 1)');
  eq(rTgEmp.length, 3, 'G: Targowisko + Emporion = 3 trasy istnienia (1 baza + 2)');
  eq(rTg.filter(r => r.budynekOdblokowany).length, 1, 'G: samo Targowisko = 1 trasa z bonusem 5%');
  eq(rTgEmp.filter(r => r.budynekOdblokowany).length, 2, 'G: Targowisko + Emporion = 2 trasy z bonusem 5% (+1 slot)');

  // Bonus per trasa: suma bonusów miasta p = 0.05 × dochód każdej KWALIFIKOWANEJ trasy, raz.
  const bonusMap = M.computeTradeRouteBuildingBonusByCity(rTgEmp);
  const expected = rTgEmp
    .filter(r => r.budynekOdblokowany)
    .reduce((s, r) => s + 0.05 * M.tradeRouteIncomeForRoute(r, M.DEFAULT_TRADE_ROUTE_INCOME_PARAMS), 0);
  ok(Math.abs((bonusMap.get('g-p') ?? 0) - expected) < 1e-9,
    `G: bonus 5% miasta p liczony per trasa, bez podwójnego liczenia (got ${bonusMap.get('g-p')}, want ${expected})`);
  ok(expected > 0, 'G: bonus 5% dodatni przy dwóch kwalifikowanych trasach');
}

// H. Dostępność w realnym availableProduction (ta sama bramka co gracz)
console.log('\n-- H: availableProduction -- Emporion wymaga Handel i Targowiska w mieście --');
{
  const prodData = { buildings: buildings.map(b => ({ ...b })), units: [] };
  const has = (built, techs) => {
    const items = M.availableProduction(
      { id: 'h-city' }, prodData, techs,
      { epoch: 2, builtBuildingIds: built, ownerId: 1, difficulty: 'normal', productionQueue: [] },
    );
    return items.some(it => JSON.stringify(it).includes('"emporion"'));
  };
  ok(!has([], []), 'H: bez Handel i bez Targowiska -> niedostępny');
  ok(!has([], ['Handel']), 'H: Handel bez Targowiska w mieście -> niedostępny');
  ok(!has(['targowisko'], []), 'H: Targowisko bez badania Handel -> niedostępny');
  ok(has(['targowisko'], ['Handel']), 'H: Targowisko + Handel -> dostępny');
  ok(!has(['magazyn'], ['Handel']), 'H: Magazyn (bez Targowiska) + Handel -> niedostępny');
}

console.log(`\n[emporion-building-test] ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
if (failed > 0) process.exit(1);
