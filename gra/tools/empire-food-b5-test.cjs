'use strict';
/**
 * empire-food-b5-test.cjs — PYTANIE-85 centralny magazyn żywności
 * Run: node tools/empire-food-b5-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-food-b5-entry.ts');
const BUNDLE = path.resolve(__dirname, '.empire-food-b5-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams,
  bindEmpireFoodRuntime, getEmpireFoodMaxCap, isArmyStarving, isArmyHungry,
  clearLastEmpireFoodTicks,
  autoBalanceRationsToSolvency, isEmpireCityFoodSolvent, simulateCityFoodCentralPool,
} from '../src/game/empire-food';
export { advanceCityEconomy, recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
export { applyArmyStarvationHpLoss } from '../src/game/army-starvation';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };
const params = M.buildEmpireFoodParams({
  ekonomia_miasta: {
    magazyn_centralny_baza_zywnosc: { normal: 500 },
    magazyn_centralny_bonus_zywnosc_na_budynek: { normal: 100 },
    glod_wojska_hp_frac: { normal: 0.08 },
    glod_wojska_karencja_tur: { normal: 3 },
  },
});

// Nadwyżka lokalna → centrala
{
  const states = new Map([[0, M.freshEmpireFoodState()]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 12, kosztRacji: 6, bilansLokalny: 6, zywnoscNetto: 6,
    }],
  };
  const ef = M.advanceEmpireFood(econ, [], states, upkeep, params);
  const t = ef.byOwner.get(0);
  ok(t.uprawaHodowla === 12, 'uprawa i hodowla = suma brutto');
  ok(t.wyzwienieLudnosci === 6, 'wyżywienie = suma racji');
  ok(t.nadwyzka === 6, 'nadwyżka = produkcja − wyżywienie');
  ok(states.get(0).zapasyPanstwa === 6, 'surplus trafia do centrali');
  ok(t.fedByCityId.get('c1') === true, 'miasto na plusie jest nakarmione');
}

// Deficyt pokryty z centrali
{
  const states = new Map([[0, { zapasyPanstwa: 20, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 4, kosztRacji: 10, bilansLokalny: -6, zywnoscNetto: -6,
    }],
  };
  const ef = M.advanceEmpireFood(econ, [], states, upkeep, params);
  const t = ef.byOwner.get(0);
  ok(t.pomocMiastom === 6, 'pomoc miastom = 6');
  ok(states.get(0).zapasyPanstwa === 14, 'centrala po dopłacie: 20−6=14');
  ok(t.fedByCityId.get('c1') === true, 'deficyt w pełni pokryty');
}

// Q2: miasta przed wojskiem
{
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 20, kosztRacji: 4, bilansLokalny: 16, zywnoscNetto: 16,
    }],
  };
  const units = [{ ownerId: 0, typeId: 'woj', camping: false }];
  const ef = M.advanceEmpireFood(econ, units, states, upkeep, params);
  const t = ef.byOwner.get(0);
  ok(t.spichlerzStolicy === 16, 'pula przed wojskiem = 16');
  ok(t.wojsko === 2, 'koszt wojska = 2 (×2 R-STAWKI)');
  ok(states.get(0).zapasyPanstwa === 14, 'po wojsku zostaje 14');
}

// Q6: cap 500 + Spichlerz I (epoka 1) -- P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej
// 2026-08-12) podniosło SPICHLERZ_EMPIRE_CAP_I 100->1000 (era1, brak resolveOwnerEra
// w tym wywołaniu -> era domyślnie 1, mnożnik ×1) -- cap = 500 + 1000 = 1500.
// Wartości wejściowe podniesione proporcjonalnie (1560+50), żeby test dalej
// realnie ćwiczył OBCINANIE nadwyżki ponad cap, nie tylko nową liczbę.
{
  const states = new Map([[0, { zapasyPanstwa: 1560, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false, maSpichlerz: true,
      zywnoscBrutto: 50, kosztRacji: 0, bilansLokalny: 50, zywnoscNetto: 50,
    }],
  };
  M.advanceEmpireFood(econ, [], states, upkeep, params);
  ok(states.get(0).zapasyPanstwa === 1500, 'cap 1500 — nadwyżka obcięta (1560+50)');
  ok(M.getEmpireFoodMaxCap(0) === 1500, 'max cap = 500 + 1000 spichlerz (epoka 1)');
}

// Głód wojska przy niedoborze żywności (Q4=A: zapasy clamp ≥ 0)
{
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  const units20 = Array.from({ length: 20 }, () => ({ ownerId: 0, typeId: 'woj', camping: false }));
  const ef = M.advanceEmpireFood(
    { perCity: [{ cityId: 'c1', ownerId: 0, oblegany: false, zywnoscBrutto: 5, kosztRacji: 0, bilansLokalny: 5, zywnoscNetto: 5 }] },
    units20, states, upkeep, params,
  );
  ok(ef.byOwner.get(0).glodWojska === true, 'głód wojska przy niedoborze w turze');
  ok(states.get(0).zapasyPanstwa === 0, 'zapasy clamp ≥ 0 (Q4=A)');
}

// Army starvation HP
const starvUnits = [{ id: 'u1', ownerId: 0, typeId: 'woj', hp: 100, hpMax: 100 }];
M.applyArmyStarvationHpLoss(starvUnits, 0, 0.08, () => 100);
ok(starvUnits[0].hp === 92, 'starvation -8% max HP');

// City net food unchanged by army units (B5 wire)
const MINIMAL_DATA = { econParams: { ekonomia_miasta: {}, budynki: {} }, units: [], societyParams: {} };
function makeMap() {
  return { hexes: { '0,0': { terenBazowy: 1, nakladka: 0, rzeka: null } } };
}
function makeCity() {
  return { id: 'c0', ownerId: 0, q: 0, r: 0, name: 'T', population: 3, poziomRacji: 2, wzrostUlamkowy: 0 };
}
M.bindEmpireFoodRuntime(new Map([[0, M.freshEmpireFoodState()]]));
const noArmy = M.advanceCityEconomy([makeCity()], makeMap(), MINIMAL_DATA, 'normal', []);
const withArmy = M.advanceCityEconomy([makeCity()], makeMap(), MINIMAL_DATA, 'normal', [
  { ownerId: 0, typeId: 'woj', camping: false },
]);
ok(
  noArmy.perCity[0].bilansLokalny === withArmy.perCity[0].bilansLokalny,
  'bilans lokalny nie zależy od armii',
);

// Barbarzyńcy (ownerId=-1) pomijani w advanceEmpireFood — brak głodu wojska
{
  const BARBARIAN_OWNER_ID = -1;
  const states = new Map([[BARBARIAN_OWNER_ID, M.freshEmpireFoodState()]]);
  const barbUnits = [{ ownerId: BARBARIAN_OWNER_ID, typeId: 'woj', camping: false }];
  const ef = M.advanceEmpireFood({ perCity: [] }, barbUnits, states, upkeep, params);
  ok(!ef.byOwner.has(BARBARIAN_OWNER_ID), 'barbarians skipped in empire food tick');
  ok(M.isArmyStarving(BARBARIAN_OWNER_ID) === false, 'barbarians never army-starving');
}

// SPICH-AUTO-Q1: deficyt przy stock=0 — miasto nie „nakarmione”
{
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 4, kosztRacji: 10, bilansLokalny: -6, zywnoscNetto: -6,
    }],
  };
  const ef = M.advanceEmpireFood(econ, [], states, upkeep, params);
  ok(ef.byOwner.get(0).fedByCityId.get('c1') === false, 'deficyt przy stock=0: nie nakarmione');
  ok(!M.isEmpireCityFoodSolvent(0, econ.perCity, 0), 'nadwyżka+stock < 0 → niewypłacalne przed auto-racją');
}

// SPICH-AUTO-Q1: auto-obniżenie racji do bilansu >= 0 (przed wojskiem)
{
  const cities = [
    { id: 'c1', ownerId: 0, name: 'Ateny', population: 3, poziomRacji: 4, wzrostUlamkowy: 0, rationMigratedV114: true },
  ];
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 12, kosztRacji: 24, bilansLokalny: -12, zywnoscNetto: -12,
      maSpichlerz: false,
    }],
  };
  const auto = M.autoBalanceRationsToSolvency({
    ownerId: 0,
    cities,
    econ,
    zapasyPrzed: 0,
    rationParams: params.rationParams,
  });
  ok(auto.adjusted === true, 'auto-racja: wykryto korektę');
  ok(cities[0].poziomRacji < 4, 'auto-racja: obniżono poziomRacji');
  ok(M.isEmpireCityFoodSolvent(0, econ.perCity, 0), 'auto-racja: solvent po korekcie');
  const ef = M.advanceEmpireFood(econ, [], new Map([[0, M.freshEmpireFoodState()]]), upkeep, params);
  ok(ef.byOwner.get(0).spichlerzStolicy >= 0, 'auto-racja: Spichlerz nie ujemny od miast');
}

// SPICH-AUTO-Q1: wojsko może głodować osobno — EOT bez blokady
{
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  const units = [{ ownerId: 0, typeId: 'woj', camping: false }];
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 10, kosztRacji: 4, bilansLokalny: 6, zywnoscNetto: 6,
    }],
  };
  const ef = M.advanceEmpireFood(econ, units, states, upkeep, params);
  ok(ef.byOwner.get(0).spichlerzStolicy === 6, 'miasta zasilają centralę przed wojskiem');
  ok(states.get(0).zapasyPanstwa === 4, 'wojsko zjada po miastach — 6-2=4');
  ok(ef.byOwner.get(0).glodWojska === false, 'wojsko nie głoduje gdy zapasy po armii >= 0');
}

console.log('empire-food-b5-test: ' + passed + ' pass, ' + failed + ' fail');
process.exit(failed > 0 ? 1 : 0);
