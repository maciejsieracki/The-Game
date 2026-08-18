'use strict';
/**
 * population-growth-v85-bonus-test.cjs — PYTANIE-85 Batch P85-B2 (Q4,Q5,Q8,Q9)
 * Run: cd gra && node tools/population-growth-v85-bonus-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.population-growth-v85-bonus-entry.ts');
const BUNDLE = path.resolve(__dirname, '.population-growth-v85-bonus-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeGrowthPercentV85,
  buildRationParams,
  computeCityRationCost,
} from '../src/game/population-growth-v85';
export {
  spichlerzGrowthBonusPercent,
  spichlerzHealthBonus,
  spichlerzRationFoodCostMultiplier,
  resolveSpichlerzCityBonusState,
} from '../src/game/building-resource-gate';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[population-growth-v85-bonus-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got=' + a + ' want=' + b); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

const rationParams = M.buildRationParams(society, 'normal');

function baseInput(overrides = {}) {
  return {
    population: 4,
    poziomRacji: 4,
    zdrowie: 0,
    szczescieNetto: 0,
    wealthPoziom: 1,
    spichlerzState: {
      ceramikaActive: false,
      solActive: false,
      maSpichlerzPop: false,
      maSpichlerzIIPop: false,
    },
    civKey: null,
    rationParams,
    ...overrides,
  };
}

console.log('\n[population-growth-v85-bonus-test]\n');

// Q4: Spichlerz bez surowca = 0% ze spichlerza
console.log('--- Q4 Spichlerz ---');
{
  const noDrain = M.resolveSpichlerzCityBonusState(['spichlerz'], { ceramikaPaid: false, solPaid: false });
  eq(M.spichlerzGrowthBonusPercent(noDrain), 0, 'Spichlerz bez drain → 0% ze spichlerza');
  const bd = M.computeGrowthPercentV85(baseInput({ spichlerzState: noDrain }));
  eq(bd.spichlerz, 0, 'breakdown.spichlerz = 0 bez drain');
}

// Q4: II + Ceramika only = +1%
{
  const iiCeramika = M.resolveSpichlerzCityBonusState(['spichlerz_ii'], { ceramikaPaid: true, solPaid: false });
  eq(M.spichlerzGrowthBonusPercent(iiCeramika), 1, 'Spichlerz II + Ceramika only → +1%');
  const bd = M.computeGrowthPercentV85(baseInput({ spichlerzState: iiCeramika }));
  eq(bd.spichlerz, 1, 'breakdown.spichlerz = 1 (II ceramika only)');
}

// Q4: pełny II = +2%
{
  const fullII = M.resolveSpichlerzCityBonusState(['spichlerz_ii'], { ceramikaPaid: true, solPaid: true });
  eq(M.spichlerzGrowthBonusPercent(fullII), 2, 'Spichlerz II pełny → +2%');
}

// Q5: Chiny lud_wzrost_proc +0.05 → +5 p.p.
console.log('--- Q5 cywilizacja addytywnie ---');
{
  const bd = M.computeGrowthPercentV85(baseInput({ civKey: 'chinczycy' }));
  eq(bd.cywilizacja, 5, 'Chiny +0.05 → +5 p.p. cywilizacja');
  eq(bd.total, bd.racje + bd.maleMiasto + bd.spichlerz + bd.zdrowie + bd.szczescie + bd.cywilizacja,
    'total = suma składników breakdown');
}

// Q8: brak capa — suma >20% dozwolona
console.log('--- Q8 brak capa ---');
{
  const fullII = M.resolveSpichlerzCityBonusState(['spichlerz_ii'], { ceramikaPaid: true, solPaid: true });
  const bd = M.computeGrowthPercentV85(baseInput({
    population: 1,
    poziomRacji: 6,
    spichlerzState: fullII,
    civKey: 'chinczycy',
    zdrowie: 35,
  }));
  // racje 7 + maleMiasto 5 + spichlerz 2 + zdrowie 3 + cywilizacja 5 = 22
  ok(bd.total > 20, 'suma WZROST% >20% bez capa (got=' + bd.total + ')');
  eq(bd.total, 22, 'total = 22% (7+5+2+3+5)');
}

// Q9: zdrowie 25 → floor(25/10)×1% = +2%
console.log('--- Q9 Zdrowie → wzrost% ---');
{
  const bd = M.computeGrowthPercentV85(baseInput({ zdrowie: 25 }));
  eq(bd.zdrowie, 2, 'zdrowie 25 pkt → +2% wzrostu (floor÷10)');
}

// R-GROWTH-WEALTH-NO-DOUBLE: szczescieNetto już zawiera Wealth (haWealth) — wealthPoziom nie zmienia wzrostu
console.log('--- R-GROWTH-WEALTH-NO-DOUBLE ---');
{
  const shared = baseInput({ szczescieNetto: 20, poziomRacji: 4, population: 4 });
  const lowWealth = M.computeGrowthPercentV85({ ...shared, wealthPoziom: 1 });
  const highWealth = M.computeGrowthPercentV85({ ...shared, wealthPoziom: 100 });
  eq(lowWealth.szczescie, 2, 'szczescieNetto=20 → szczescie=2% (floor÷10)');
  eq(highWealth.szczescie, 2, 'wealthPoziom=100 nie podbija szczescie gdy netto już liczone');
  eq(lowWealth.total, highWealth.total, 'total bez zmian przy tym samym szczescieNetto');
  eq(lowWealth.szczescie, highWealth.szczescie, 'breakdown.szczescie identyczne przy zmianie wealthPoziom');
}

// Składniki nazwane w breakdown
{
  const bd = M.computeGrowthPercentV85(baseInput({ poziomRacji: 4, population: 3 }));
  eq(bd.racje, 4.5, 'Wyżywienie 4 → +4.5%');
  eq(bd.maleMiasto, 3, 'maleMiasto pop=3 → max(0,6-3)=3');
  ok(
    ['total', 'racje', 'maleMiasto', 'spichlerz', 'zdrowie', 'szczescie', 'cywilizacja']
      .every(k => typeof bd[k] === 'number'),
    'GrowthPercentBreakdown ma wszystkie pola nazwane',
  );
}

// P84-SPICHLERZ: Zdrowie + tańsza racja
console.log('--- P84 Spichlerz Zdrowie + racje ---');
{
  const tierI = M.resolveSpichlerzCityBonusState(['spichlerz'], { ceramikaPaid: true, solPaid: false });
  eq(M.spichlerzHealthBonus(tierI), 5, 'Spichlerz I → +5 Zdrowia');
  eq(M.spichlerzGrowthBonusPercent(tierI), 1, 'Spichlerz I → nadal +1% wzrostu');
  eq(M.spichlerzRationFoodCostMultiplier(tierI), 0.75, 'Spichlerz I → koszt racji ×0.75');
  const fullII = M.resolveSpichlerzCityBonusState(['spichlerz_ii'], { ceramikaPaid: true, solPaid: true });
  eq(M.spichlerzHealthBonus(fullII), 10, 'Spichlerz II pełny → +10 Zdrowia');
  eq(M.spichlerzRationFoodCostMultiplier(fullII), 0.5, 'Spichlerz II pełny → koszt racji ×0.5');
  const rationParams = M.buildRationParams({
    ekonomia_miasta: {
      racje_zywnosc_1: { normal: 1 },
      racje_zywnosc_2: { normal: 2 },
      racje_zywnosc_3: { normal: 3 },
      racje_wzrost_proc_1: { normal: 3 },
      racje_wzrost_proc_2: { normal: 5 },
      racje_wzrost_proc_3: { normal: 7 },
    },
  }, 'normal');
  eq(M.computeCityRationCost(10, 3, rationParams, fullII), 15, 'pop 10 racje 3 ×0.5 = 15');
  eq(M.computeCityRationCost(10, 3, rationParams), 30, 'bez Spichlerza = 30');
}

console.log('\n--- wynik: ' + passed + ' pass, ' + failed + ' fail ---\n');
process.exit(failed > 0 ? 1 : 0);
