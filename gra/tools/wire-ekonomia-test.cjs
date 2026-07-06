'use strict';
/**
 * wire-ekonomia-test.cjs -- testy wiec EKONOMIA (WIRE 1/2/3) w turn-economy.ts
 * Uruchom z gra/:  node tools/wire-ekonomia-test.cjs
 *
 * Testuje:
 *   WIRE 1: computeCityHealth (zdrowie != 0 gdy brak wody)
 *   WIRE 2: splitPraca (doBudynkow + doPuli == praca)
 *   WIRE 3: Luksus->Wealth (mnoznik > 1 przy zadowalajacym poziomie Wealth)
 *   Backward compat: toEconomyCity bez zdrowie param = 0
 *   Per-city: podzialHandlu luksus 30% -> wyzszy strumien luksus
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); } catch (e) { console.error('esbuild not found'); process.exit(1); }
})();

const GRA_ROOT   = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.wire-ekonomia-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wire-ekonomia-bundle.cjs');

const ENTRY_TS = `
export { toEconomyCity, buildEconParams, cityHasWaterAccess, computeCityHealthBreakdown } from '../src/game/turn-economy';
export { cityYieldPerTurn } from '../src/game/economy';
export { splitPraca } from '../src/game/production';
export { advanceWealth, freshWealthState, loadWealthParams, wealthMnoznik, FALLBACK_WEALTH_PARAMS } from '../src/game/wealth';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[wire-ekonomia-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

// --- tiny framework ---
let passed = 0; let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + ' (' + a + ' === ' + b + ')'); }
function near(a, b, eps, label) { ok(Math.abs(a - b) < eps, label + ' (' + a + ' ~= ' + b + ')'); }

function makeTestParams(overrides) {
  return Object.assign({
    progWzrostuWspolczynnik: 8, spichlerzZachowaniePoPrzroscie: 0.5,
    akweduktProgLudnosci: 6, zywnoscZuzytkaPopulacja: 1,
    zdrowieModyfikatorWspolczynnik: 0.05, korupcjaWspolczynnikDystansu: 2,
    korupcjaWspolczynnikMiast: 1, korupcjaCap: 0.5,
    budynekMlynMnoznikPracy: 2, budynekMlynBonusPracy: 2,
    budynekCegielniBonusPracy: 0.25, budynekTargowiskoBonusHandlu: 0.5,
    budynekBibliotekaBonusNauki: 0.5, budynekMennicaMnoznik: 1,
    walutaMnoznik: 2, targowiskoPracaMnoznik: 2,
    suwaakHandelNaukaDefault: 20, suwaakHandelPieniadz: 70,
    suwaakHandelLuksus: 10, suwaakPracaBudynki: 70, suwaakPracaTeren: 30,
  }, overrides);
}

// --- WIRE 2: splitPraca ---
console.log('\nWIRE 2: splitPraca');
{
  const r = M.splitPraca(20, 0.7);
  near(r.doBudynkow, 14, 0.001, 'doBudynkow=14 dla praca=20 udzial=0.7');
  near(r.doPuli,      6, 0.001, 'doPuli=6 dla praca=20 udzial=0.7');
  ok(Math.abs(r.doBudynkow + r.doPuli - 20) < 0.001, 'suma = cityPraca');
}
{
  const r = M.splitPraca(0, 0.7);
  eq(r.doBudynkow, 0, 'praca=0 -> doBudynkow=0');
  eq(r.doPuli, 0, 'praca=0 -> doPuli=0');
}
{
  const r = M.splitPraca(10, 1.0);
  eq(r.doBudynkow, 10, 'udzial=1.0 -> wszystko budynki');
  eq(r.doPuli, 0, 'udzial=1.0 -> doPuli=0');
}

// --- WIRE 3: Wealth ---
console.log('\nWIRE 3: advanceWealth');
{
  const p = M.FALLBACK_WEALTH_PARAMS;
  // Start fresh (poziom=1), zadny spoleczMoney -> Wealth powinno spasc lub stac
  const state = M.freshWealthState(); // {poziom:1, pula:0}
  eq(state.poziom, 1, 'freshWealthState.poziom=1');
  eq(state.pula, 0, 'freshWealthState.pula=0');

  // Mnoznik dla poziomu 1 = 1 + (1-1)*k = 1.0
  near(M.wealthMnoznik(1, p), 1.0, 0.0001, 'wealthMnoznik(1)=1.0');

  // Advance z spoleczMoney=5, miastoMoney=20, epoka=1
  const r = M.advanceWealth(state, 5, 20, 1, p);
  ok(typeof r.mnoznik === 'number', 'mnoznik is number');
  ok(typeof r.zadowolenie === 'number', 'zadowolenie is number');
  ok(r.mnoznik >= 1.0, 'mnoznik >= 1.0 (nigdy < x1)');
  ok(Number.isFinite(r.poziom), 'poziom is finite');
  ok(r.poziom >= 0, 'poziom >= 0');

  // Advance z duzym spoleczMoney -> Wealth powinno rosnac
  const r2 = M.advanceWealth({ poziom: 1, pula: 0 }, 100, 10, 1, p);
  ok(r2.awans >= 0, 'awans >= 0');
  ok(r2.poziom >= 1, 'poziom nie spada przy duzym spoleczMoney');
}
{
  // Test mnoznika: poziom=10 -> 1 + 9*0.15 = 2.35
  const p = M.FALLBACK_WEALTH_PARAMS;
  near(M.wealthMnoznik(10, p), 2.35, 0.001, 'wealthMnoznik(10)=2.35 (1+9*0.15)');
  // poziom=0 -> min x1
  near(M.wealthMnoznik(0, p), 1.0, 0.0001, 'wealthMnoznik(0)=1.0 (min)');
}

// --- WIRE 1: toEconomyCity backward compat (zdrowie domyslnie 0) ---
console.log('\nWIRE 1: toEconomyCity backward compat');
{
  const params = makeTestParams();
  const city = { id: 'c1', ownerId: 0, q: 0, r: 0, name: 'Test', population: 3 };
  const ec = M.toEconomyCity(city, params, true);
  eq(ec.zdrowie, 0, 'toEconomyCity bez zdrowie param -> zdrowie=0 (backward compat)');
  eq(ec.id, 'c1', 'id poprawne');
  eq(ec.ludnosc, 3, 'ludnosc poprawna');
  eq(ec.podziałHandlu.procentLuksus, 10, 'brak podzialHandlu -> params default luksus 10%');

  const ec2 = M.toEconomyCity(city, params, true, 4);
  eq(ec2.zdrowie, 4, 'toEconomyCity z zdrowie=4 -> zdrowie=4');
}

// --- Per-city podzialHandlu: luksus 30% ---
console.log('\nPer-city podzialHandlu: luksus 30%');
{
  const params = makeTestParams();
  const cityBase = {
    id: 'c1', ownerId: 0, q: 0, r: 0, name: 'Base', population: 1,
    podzialHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
  };
  const cityLux30 = {
    id: 'c2', ownerId: 0, q: 1, r: 0, name: 'Lux', population: 1,
    podzialHandlu: { procentNauka: 20, procentPieniadz: 50, procentLuksus: 30 },
  };

  const ecBase = M.toEconomyCity(cityBase, params, true);
  const ecLux30 = M.toEconomyCity(cityLux30, params, true);
  eq(ecBase.podziałHandlu.procentLuksus, 10, 'miasto z podzialHandlu luksus=10%');
  eq(ecLux30.podziałHandlu.procentLuksus, 30, 'miasto z podzialHandlu luksus=30%');

  const ROWNINA = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
  const worked10 = Array(10).fill(ROWNINA);
  const ctx = {
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false,
    maBiblioteka: false, maMennica: false, mennicaMnoznik: 1, walutaOdkryta: false,
  };
  const yldBase = M.cityYieldPerTurn(ecBase, worked10, [], params, ctx);
  const yldLux30 = M.cityYieldPerTurn(ecLux30, worked10, [], params, ctx);
  eq(yldBase.luksus, 1, 'handel=10, luksus 10% -> luksus=1');
  eq(yldLux30.luksus, 3, 'handel=10, luksus 30% -> luksus=3');
  ok(yldLux30.luksus > yldBase.luksus, 'per-city luksus 30% > default 10%');
}

// --- WIRE 1 D17-A: cityHasWaterAccess (rzeka sąsiad vs brak wody) ---
console.log('\nWIRE 1 D17-A: cityHasWaterAccess');
{
  const mapRiver = {
    hexes: {
      '0,0': { terenBazowy: 'rownina', nakladka: 'brak' },
      '1,0': { terenBazowy: 'rownina', nakladka: 'brak' },
      '5,0': { terenBazowy: 'piasek', nakladka: 'brak' },
    },
    riverPaths: [[{ q: 1, r: 0 }]],
    szerokoscQ: 6,
    wysokoscR: 1,
    seed: 1,
  };
  const cityNearRiver = { id: 'c1', ownerId: 0, q: 0, r: 0, name: 'R', population: 1 };
  const cityDesert = { id: 'c2', ownerId: 0, q: 5, r: 0, name: 'D', population: 1 };
  ok(M.cityHasWaterAccess(cityNearRiver, mapRiver), 'sąsiad riverPaths -> dostęp do wody');
  ok(!M.cityHasWaterAccess(cityDesert, mapRiver), 'pustynia bez wody -> brak dostępu');

  const brNear = M.computeCityHealthBreakdown(1, [], [], {}, 'normal', { city: cityNearRiver, map: mapRiver });
  ok(brNear.total >= 1, 'nad rzeką total >= +1 (rzeka + małe miasto)');
  ok(!brNear.lines.some(l => l.label === 'Brak wody'), 'nad rzeką brak linii Brak wody');

  const brDesert = M.computeCityHealthBreakdown(1, [], [], {}, 'normal', { city: cityDesert, map: mapRiver });
  ok(brDesert.lines.some(l => l.label === 'Brak wody'), 'pustynia bez wody -> kara Brak wody');
}

// --- Podsumowanie ---
console.log('\nwire-ekonomia-test: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
