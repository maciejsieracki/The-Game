'use strict';
/**
 * population-growth-v85-test.cjs — PYTANIE-85 P85-B1 (Q1, Q2, Q6, Q7)
 * Run: node tools/population-growth-v85-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.population-growth-v85-entry.ts');
const BUNDLE = path.resolve(__dirname, '.population-growth-v85-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  applyPostCentralPopulationGrowth,
  applyFractionalGrowthV85,
  applyHungerPenaltyV85,
  buildRationParams,
  computeGrowthPercentV85,
  getCityRationLevel,
  growthGainPerTurnSlots,
  turnsUntilNextCitizen,
  rationFoodCostPerPop,
  rationGrowthPercent,
  clampPoziomRacji,
  WYZYWIENIE_GROWTH_PCT,
  migrateLegacyRationLevel,
} from '../src/game/population-growth-v85';
export {
  advanceEmpireFood,
  buildEmpireFoodParams,
  freshEmpireFoodState,
} from '../src/game/empire-food';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const rationParams = M.buildRationParams({
  ekonomia_miasta: {
    racje_zywnosc_1: { normal: 1 },
    racje_zywnosc_2: { normal: 2 },
    racje_zywnosc_3: { normal: 3 },
    racje_wzrost_proc_1: { normal: 3 },
    racje_wzrost_proc_2: { normal: 5 },
    racje_wzrost_proc_3: { normal: 7 },
  },
});
const efParams = M.buildEmpireFoodParams({
  ekonomia_miasta: {
    magazyn_centralny_baza_zywnosc: { normal: 500 },
    magazyn_centralny_bonus_zywnosc_na_budynek: { normal: 100 },
  },
});
const econParams = { akweduktProgLudnosci: 4, akweduktMaxLudnosci: 12 };
const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };

// --- Q1: nie nakarmione → wzrost 0 ---
{
  const city = {
    id: 'c1', ownerId: 0, q: 0, r: 0, name: 'Test', population: 5,
    poziomRacji: 4, wzrostUlamkowy: 0, turyBezDoplaty: 0, rationMigratedV114: true,
  };
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 0, kosztRacji: 10, bilansLokalny: -10,
      zdrowie: 0, ludnoscPrzed: 5, ludnoscPo: 5,
    }],
    growth: 0,
    starved: 0,
  };
  const states = new Map([[0, M.freshEmpireFoodState()]]);
  const ef = M.advanceEmpireFood(econ, [], states, upkeep, efParams);
  const popBefore = city.population;
  const fracBefore = city.wzrostUlamkowy;
  M.applyPostCentralPopulationGrowth({
    cities: [city],
    econ,
    efResult: ef,
    map: { hexes: {} },
    territoryNodes: [],
    econParams,
    rationParams,
    builtByCity: new Map([['c1', []]]),
  });
  ok(city.population === popBefore - 1, 'Q1/Q7: unfed → hunger -1 pop');
  ok(city.wzrostUlamkowy === fracBefore, 'Q1: unfed → no fractional growth');
  ok(!ef.byOwner.get(0).fedByCityId.get('c1'), 'Q1: city not fed');
}

// --- Q7: 1 tura bez dopłaty → −1 pop (explicit) ---
{
  const hunger = M.applyHungerPenaltyV85(4, false, 0);
  ok(hunger.ubytek && hunger.nowaLudnosc === 3, 'Q7: hunger penalty -1 pop');
}

// --- Q2: surplus do centrali przed wojskiem ---
{
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 20, kosztRacji: 4, bilansLokalny: 16,
      zywnoscNetto: 16,
    }],
  };
  const units = [{ ownerId: 0, typeId: 'woj', camping: false }];
  const ef = M.advanceEmpireFood(econ, units, states, upkeep, efParams);
  const t = ef.byOwner.get(0);
  ok(t.spichlerzStolicy === 16, 'Q2: surplus 16 in central before army');
  ok(t.wojsko === 1, 'Q2: army costs 1 after central pool');
  ok(states.get(0).zapasyPanstwa === 15, 'Q2: central ends at 15 (16-1 army)');
}

// --- Q6: cap 500 + magazyn +100 ---
{
  const states = new Map([[0, { zapasyPanstwa: 450, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 200, kosztRacji: 0, bilansLokalny: 200,
      zywnoscNetto: 200,
    }],
  };
  const builtByCity = new Map([['c1', ['magazyn']]]);
  const ef = M.advanceEmpireFood(econ, [], states, upkeep, efParams, {}, builtByCity);
  ok(ef.byOwner.get(0).maxCap === 600, 'Q6: cap 500 + 100 magazyn');
  ok(states.get(0).zapasyPanstwa === 600, 'Q6: clamped at 600 (450+200 overflow dropped)');
}

// --- fed city accumulates fractional growth ---
{
  const city = {
    id: 'c2', ownerId: 0, q: 0, r: 0, name: 'Fed', population: 3,
    poziomRacji: 4, wzrostUlamkowy: 0, turyBezDoplaty: 0, rationMigratedV114: true,
  };
  const econ = {
    perCity: [{
      cityId: 'c2', ownerId: 0, oblegany: false,
      zywnoscBrutto: 10, kosztRacji: 6, bilansLokalny: 4,
      zdrowie: 0, ludnoscPrzed: 3, ludnoscPo: 3,
    }],
    growth: 0,
    starved: 0,
  };
  const states = new Map([[0, M.freshEmpireFoodState()]]);
  const ef = M.advanceEmpireFood(econ, [], states, upkeep, efParams);
  M.applyPostCentralPopulationGrowth({
    cities: [city],
    econ,
    efResult: ef,
    map: { hexes: {} },
    territoryNodes: [],
    econParams,
    rationParams,
    builtByCity: new Map([['c2', []]]),
  });
  ok(city.wzrostUlamkowy > 0, 'fed: fractional growth accumulates (3 × 4.5% ≈ 0.135)');
  ok(city.population === 3, 'fed: no whole pop yet below 1.0 frac');
}

// --- Wyżywienie: tabela wzrostu 2026-07-30 ---
{
  const table = [
    [0, -10], [0.5, -6], [1, -2], [1.5, 0], [2, 1.5], [2.5, 3],
    [3, 3.5], [3.5, 4], [4, 4.5], [4.5, 5], [5, 5.5], [5.5, 6], [6, 7],
  ];
  for (const [level, pct] of table) {
    ok(M.rationGrowthPercent(level, rationParams) === pct, `Wyżywienie ${level} → ${pct}%`);
    ok(M.rationFoodCostPerPop(level, rationParams) === level, `koszt żywności ${level} = ${level}`);
  }
  ok(M.migrateLegacyRationLevel(1) === 2, 'migracja stara racja 1 → Wyżywienie 2');
  ok(M.migrateLegacyRationLevel(2) === 4, 'migracja stara racja 2 → Wyżywienie 4');
  ok(M.migrateLegacyRationLevel(3) === 6, 'migracja stara racja 3 → Wyżywienie 6');
}

{
  ok(M.growthGainPerTurnSlots(1, 13, true, false) === 0.13, 'gainPerTurn: 1 pop × 13% = 0.13');
  ok(M.growthGainPerTurnSlots(1, 13, false, false) === 0, 'gainPerTurn: unfed → 0');
  ok(M.growthGainPerTurnSlots(1, 13, true, true) === 0, 'gainPerTurn: at cap → 0');
  ok(M.turnsUntilNextCitizen(0.26, 0.13) === 6, 'ETA: ceil((1-0.26)/0.13) = 6');
  ok(M.turnsUntilNextCitizen(0.9, 0.13) === 1, 'ETA: ceil((1-0.9)/0.13) = 1');
  ok(M.turnsUntilNextCitizen(1.0, 0.13) === 0, 'ETA: frac >= 1 → 0 turns');
  ok(M.turnsUntilNextCitizen(0.5, 0) === null, 'ETA: zero gain → null');
}

console.log(`population-growth-v85-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
