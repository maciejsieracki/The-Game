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
} from '../src/game/empire-food';
export { advanceCityEconomy } from '../src/game/turn-economy';
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

// Q6: cap 500 + Spichlerz +100
{
  const states = new Map([[0, { zapasyPanstwa: 560, turyUjemnychZapasow: 0 }]]);
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false, maSpichlerz: true,
      zywnoscBrutto: 50, kosztRacji: 0, bilansLokalny: 50, zywnoscNetto: 50,
    }],
  };
  M.advanceEmpireFood(econ, [], states, upkeep, params);
  ok(states.get(0).zapasyPanstwa === 600, 'cap 600 — nadwyżka obcięta (560+50)');
  ok(M.getEmpireFoodMaxCap(0) === 600, 'max cap = 500 + 100 spichlerz');
}

// Głód wojska przy ujemnych zapasach
{
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  const units20 = Array.from({ length: 20 }, () => ({ ownerId: 0, typeId: 'woj', camping: false }));
  const ef = M.advanceEmpireFood(
    { perCity: [{ cityId: 'c1', ownerId: 0, oblegany: false, zywnoscBrutto: 5, kosztRacji: 0, bilansLokalny: 5, zywnoscNetto: 5 }] },
    units20, states, upkeep, params,
  );
  ok(ef.byOwner.get(0).glodWojska === true, 'głód wojska przy ujemnych zapasach');
  ok(states.get(0).zapasyPanstwa < 0, 'zapasy mogą być ujemne');
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

console.log('empire-food-b5-test: ' + passed + ' pass, ' + failed + ' fail');
process.exit(failed > 0 ? 1 : 0);
