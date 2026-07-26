'use strict';
/**
 * cuda-handel-test.cjs — CUDA-HANDEL-01 (Maciej 2026-07-26, decyzja dosłowna:
 * "3 handel nie daninę"): ożywienie bonusu cudów świata bonusy.specjalne[].typ
 * === "handel_procent" (Petra, Kamień Ha'amonga, Kolos Rodyjski, Brama wszystkich
 * narodów, Pałac Weiyang) — do tej pory czysta martwa obietnica w wonders.json.
 *
 * Sprawdza (patrz raport zadania):
 *   1. Właściciel BEZ cudu -> dochód z tras handlowych bez zmian (baza).
 *   2. Właściciel Z cudem -> dochód podniesiony o zadany %, konkretne liczby.
 *   3. Dwa cuda tego typu -> kumulacja ADDYTYWNA (rekomendacja właściciela),
 *      NIE mnożna.
 *   4. Bonus NIE dotyka Daniny (handelBrutto/pieniadzBrutto miasta identyczne
 *      z cudem i bez niego) -- SEDNO decyzji właściciela, najważniejsza asercja.
 *   5. Parytet AI: cud należący do AI daje AI dokładnie ten sam bonus (zero
 *      gałęzi po ownerId).
 *
 * Run from gra/:  node tools/cuda-handel-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[cuda-handel-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.cuda-handel-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.cuda-handel-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  computeTradeRouteIncomeByCity, tradeRouteDistanceIncome,
  DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
} from '../src/game/trade-routes';
export {
  sumWonderTradeRouteBonusForOwner, getWonderById,
} from '../src/game/wonders-data';
export { advanceCityEconomy } from '../src/game/turn-economy';
export { ensureCitySaveDefaults } from '../src/game/cities';
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
  console.error('[cuda-handel-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw  = require('../data/econ-params.json');
const civs           = require('../data/civs.json');
const societyParams  = require('../data/society-params.json');
const buildings      = require('../data/buildings.json');
const units          = require('../data/units.json');
const tech           = require('../data/tech.json');
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

console.log('cuda-handel-test (CUDA-HANDEL-01)\n');

// ---------------------------------------------------------------------------
// Sanity: cuda z bonusem handel_procent istnieja i maja oczekiwane wartosci.
// ---------------------------------------------------------------------------
const petra = M.getWonderById('petra');
const bramaNarodow = M.getWonderById('brama_narodow');
const palacWeiyang = M.getWonderById('palac_weiyang');
const hamonga = M.getWonderById('hamonga');
assert(!!petra && !!bramaNarodow && !!palacWeiyang && !!hamonga, 'sanity: 4 z 5 cudow handel_procent obecne w wonders.json');

const petraBonus = (petra.bonusy.specjalne || []).find(s => s.typ === 'handel_procent');
eq(petraBonus.cel, 'handel', 'sanity: Petra cel=handel (dowolne medium)');
eq(petraBonus.wartosc, 0.15, 'sanity: Petra wartosc=0.15');
const hamongaBonus = (hamonga.bonusy.specjalne || []).find(s => s.typ === 'handel_procent');
eq(hamongaBonus.cel, 'handel_morski', 'sanity: Hamonga cel=handel_morski');

// ---------------------------------------------------------------------------
// 1. Wlasciciel BEZ cudu -> dochod bez zmian (resolver zero-value domyslny).
// ---------------------------------------------------------------------------
console.log('\n-- 1. bez cudu: dochod z tras bez zmian --');
const incP = M.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
const routeNoWonder = { id: 'r1', fromCityId: 'A', toCityId: 'B', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 0, status: 'polaczony' };
const baseIncome = M.tradeRouteDistanceIncome(0, incP);
eq(baseIncome, incP.dochodBazowy, '(setup) dystans=0 -> dochod bazowy pelny');

const incomeNoWonder = M.computeTradeRouteIncomeByCity([routeNoWonder], incP);
eq(incomeNoWonder.get('A'), baseIncome, '1: brak cudu -> miasto A dostaje dokladnie dochod bazowy');
eq(incomeNoWonder.get('B'), baseIncome, '1: brak cudu -> miasto B (obca cyw) dostaje dokladnie dochod bazowy');

// Wywolanie BEZ 3. argumentu (stary kontrakt, kompatybilnosc wsteczna) -> identyczne.
const incomeNoResolverArg = M.computeTradeRouteIncomeByCity([routeNoWonder], incP);
eq(incomeNoResolverArg.get('A'), baseIncome, '1b: wywolanie bez resolvera (stary kontrakt) -> bez zmian');

// ---------------------------------------------------------------------------
// 2. Wlasciciel Z cudem (Petra, +15%, cel=handel) -> dochod podniesiony.
// ---------------------------------------------------------------------------
console.log('\n-- 2. z cudem (Petra +15%, cel=handel): dochod podniesiony --');
function resolverFor(ownerWondersByOwner, era) {
  return (ownerId, medium) => M.sumWonderTradeRouteBonusForOwner(ownerWondersByOwner.get(ownerId) || [], era, medium);
}
const resolverOwner0Petra = resolverFor(new Map([[0, ['petra']]]), 1);
const income2 = M.computeTradeRouteIncomeByCity([routeNoWonder], incP, resolverOwner0Petra);
const expected2A = Math.floor(baseIncome * 1.15);
eq(baseIncome, 8, '(setup) dochod bazowy domyslny = 8 (dystans 0)');
eq(expected2A, 9, '(setup) floor(8*1.15) = 9 -- widoczna roznica vs baza 8');
eq(income2.get('A'), expected2A, `2: miasto A (owner 0, wlasciciel Petry) -> ${expected2A} (bylo ${baseIncome}, +15%)`);
eq(income2.get('B'), baseIncome, '2: miasto B (owner 1, obca cyw BEZ cudu) -> bez zmian, cud nie jest jej');

// ---------------------------------------------------------------------------
// 3. Dwa cuda tego typu (Petra 0.15 + Palac Weiyang 0.15, oba cel=handel)
//    -> kumulacja ADDYTYWNA (0.30), NIE mnozna (co dalyby 1.15*1.15-1=0.3225).
// ---------------------------------------------------------------------------
console.log('\n-- 3. dwa cuda: kumulacja ADDYTYWNA (nie mnozna) --');
const sumTwoWonders = M.sumWonderTradeRouteBonusForOwner(['petra', 'palac_weiyang'], 1, 'lad');
assert(Math.abs(sumTwoWonders - 0.30) < 1e-9, `3: Petra+Palac Weiyang = 0.15+0.15=0.30 addytywnie (got ${sumTwoWonders})`);
assert(Math.abs(sumTwoWonders - (1.15 * 1.15 - 1)) > 1e-6, '3: (kontrola) suma NIE rowna sie wynikowi mnoznemu (0.3225)');

const resolverOwner0TwoWonders = resolverFor(new Map([[0, ['petra', 'palac_weiyang']]]), 1);
const income3 = M.computeTradeRouteIncomeByCity([routeNoWonder], incP, resolverOwner0TwoWonders);
const expected3A = Math.floor(baseIncome * 1.30);
eq(expected3A, 10, '(setup) floor(8*1.30) = 10');
eq(income3.get('A'), expected3A, `3: dwa cuda -> mnoznik 1.30 (addytywnie) -> ${expected3A}`);

// Kontrola gatowania medium: Hamonga (cel=handel_morski) NIE dziala na trase LADOWA.
const bonusHamongaLad = M.sumWonderTradeRouteBonusForOwner(['hamonga'], 1, 'lad');
const bonusHamongaMorze = M.sumWonderTradeRouteBonusForOwner(['hamonga'], 1, 'morze');
eq(bonusHamongaLad, 0, '3b: Hamonga (handel_morski) na trasie LADOWEJ -> 0 (nie dolicza sie)');
assert(Math.abs(bonusHamongaMorze - 0.15) < 1e-9, `3b: Hamonga (handel_morski) na trasie MORSKIEJ -> 0.15 (got ${bonusHamongaMorze})`);

// Bramka absolut: po koncu Sredniowiecza (era 7) bonus wygasa jak kazdy inny bonus cudu.
const bonusPetraEra7 = M.sumWonderTradeRouteBonusForOwner(['petra'], 7, 'lad');
eq(bonusPetraEra7, 0, '3c: Petra po absolut (era 7) -> bonus wygasl (0)');

// ---------------------------------------------------------------------------
// 4. SEDNO: bonus NIE dotyka Daniny (handelBrutto/pieniadzBrutto miasta) --
//    identyczne z cudem i bez niego. To jest najwazniejsza asercja tego testu.
// ---------------------------------------------------------------------------
console.log('\n-- 4. SEDNO: Danina (pieniadzBrutto) identyczna z cudem i bez cudu --');

function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 20; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: 21, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map4 = buildMap();
function makeRuntimeCity(id, ownerId, q) {
  const c = { id, ownerId, q, r: 0, name: id, population: 4 };
  M.ensureCitySaveDefaults(c);
  return c;
}
const p4 = makeRuntimeCity('p4', 0, 2);
const f4 = makeRuntimeCity('f4', 1, 7);
const built4 = new Map([['p4', ['targowisko']], ['f4', ['targowisko']]]);

function runTick4(tradeIncomeByCity) {
  const cities = [
    { ...p4, wealthState: { ...p4.wealthState } },
    { ...f4, wealthState: { ...f4.wealthState } },
  ];
  const econ = M.advanceCityEconomy(
    cities, map4, gameData, 'normal', [], new Map(), built4,
    1, new Set(), new Map(), new Map(), undefined, undefined, 'wysoki',
    new Map(), tradeIncomeByCity,
  );
  return { p4: econ.perCity.find(t => t.cityId === 'p4'), f4: econ.perCity.find(t => t.cityId === 'f4') };
}

// Bez cudu (tradeIncomeByCity puste) vs z cudem (dochod z tras podniesiony, symulujac
// wynik computeTradeRouteIncomeByCity z resolverem Petry -- 9 zamiast 8 dla miasta p4).
const tick4Base = runTick4(new Map([['p4', 8], ['f4', 8]]));
const tick4WithWonder = runTick4(new Map([['p4', 9], ['f4', 8]])); // TYLKO p4 (owner Petry) dostaje +1

eq(tick4Base.p4.pieniadzBrutto, tick4WithWonder.p4.pieniadzBrutto,
  '4: SEDNO -- pieniadzBrutto (Danina, PRZED dochodem z tras) miasta p4 IDENTYCZNE z cudem i bez niego');
eq(tick4Base.f4.pieniadzBrutto, tick4WithWonder.f4.pieniadzBrutto,
  '4: pieniadzBrutto miasta f4 (obca cyw, bez zmiany dochodu) rowniez identyczne (kontrola)');

// A dochod z tras (pieniadzZTras) i finalny pieniadz -- ROZNE, dokladnie o +1 (9 vs 8).
eq(tick4WithWonder.p4.pieniadzZTras - tick4Base.p4.pieniadzZTras, 1,
  '4: pieniadzZTras miasta p4 wyzszy o dokladnie +1 (8->9, efekt cudu) -- to jedyna roznica');
eq(tick4WithWonder.p4.pieniadz - tick4Base.p4.pieniadz, 1,
  '4: pieniadz koncowy (skarbiec) wyzszy o dokladnie +1 -- caly efekt idzie do Handlu, zero do Daniny');

// ---------------------------------------------------------------------------
// 5. PARYTET AI: cud nalezacy do AI (ownerId != 0) daje AI DOKLADNIE ten sam bonus.
// ---------------------------------------------------------------------------
console.log('\n-- 5. Parytet AI: cud AI daje AI ten sam bonus --');
const bonusPlayer0 = M.sumWonderTradeRouteBonusForOwner(['petra'], 1, 'lad'); // gracz, ownerId=0
const bonusAiOwner5 = M.sumWonderTradeRouteBonusForOwner(['petra'], 1, 'lad'); // AI, ownerId dowolny -- funkcja nie przyjmuje ownerId
eq(bonusPlayer0, bonusAiOwner5, '5: sumWonderTradeRouteBonusForOwner ownerId-agnostyczna (bierze tylko liste cudow)');

// Test integracyjny: trasa gracz(0)<->AI(1), ale tym razem AI (toOwnerId=1) jest wlascicielem
// Petry, gracz (ownerId=0) nie ma zadnego cudu -- AI powinno dostac +15%, gracz bez zmian.
const routeAiOwnsWonder = { id: 'r2', fromCityId: 'P', toCityId: 'AI', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 0, status: 'polaczony' };
const resolverAiHasPetra = resolverFor(new Map([[1, ['petra']]]), 1); // TYLKO owner 1 (AI) ma cud
const income5 = M.computeTradeRouteIncomeByCity([routeAiOwnsWonder], incP, resolverAiHasPetra);
eq(income5.get('P'), baseIncome, '5: gracz (bez cudu) -> dochod bazowy bez zmian');
eq(income5.get('AI'), expected2A, `5: AI (wlasciciel Petry) -> ${expected2A} (identyczny wzor jak dla gracza w scenariuszu 2 -- zero galezi po ownerId)`);

console.log(`\ncuda-handel-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
