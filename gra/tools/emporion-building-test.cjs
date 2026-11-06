'use strict';
/**
 * emporion-building-test.cjs -- standalone Node test for R-WEB-BUILDING-EMPORION-Q1.
 * Run from gra/:  node tools/emporion-building-test.cjs
 *
 * Covers (dane z gra/data/buildings.json + tech.json, logika z kodu źródłowego):
 *   A. Wpis `emporion` istnieje i ma parametry z decyzji właściciela 2026-11-05:
 *      epokaWejscia 2 (Brąz), techUnlock 'Handel', kategoria/grupa jak Targowisko,
 *      kosztBudowy 50 / przyrostKosztu 20, utrzymanie 2, dajeSzczescie false,
 *      koszt_surowce {drewno 80, kamien 60}, maksPoziom 1.
 *   B. Porównanie z Targowiskiem: Emporion jest droższy (koszt budowy, utrzymanie,
 *      baza.pieniadz), a przyrost pieniądza jest większy niż Targowiska.
 *   C. Technologia Handel (tech.json) odblokowuje Magazyn ORAZ Emporion.
 *   D. Wymóg miasta: CITY_BUILDING_PREREQ.emporion === 'targowisko'; prereq jest
 *      SPEŁNIONY tylko gdy w tym samym mieście stoi Targowisko (cityBuildingPrereqMet).
 *   E. Sloty tras: 'emporion' w TRADE_BUILDING_IDS; miasto z Targowiskiem + Emporion
 *      ma 2 sloty linii wymiany (tradeRouteLimitForCity) i 3 sloty istnienia
 *      (tradeRouteExistenceLimitForCity = 1 baza + 2); samo Emporion daje 1 slot.
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
} from '../src/game/trade-routes';
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
  eq(JSON.stringify(emp.koszt_surowce), JSON.stringify({ drewno: 80, kamien: 60 }), 'koszt_surowce');
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

console.log(`\n[emporion-building-test] ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
if (failed > 0) process.exit(1);
