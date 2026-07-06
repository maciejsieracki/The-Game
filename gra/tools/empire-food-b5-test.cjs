'use strict';
/**
 * empire-food-b5-test.cjs — regresja B5 (hybryda żywności imperium)
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
  bindEmpireFoodRuntime, getEmpireFoodSplit, getEmpireFoodMaxCap, isArmyStarving,
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
  suwak_zywnosc_rozwoj_domyslnie: { normal: 70 },
  glod_wojska_hp_frac: { normal: 0.08 },
  spichlerz_pojemnosc_zapasow_panstwa: { normal: 100 },
});

// --- advanceEmpireFood ---
const states = new Map([[0, M.freshEmpireFoodState(70)]]);
const econ = { perCity: [{ ownerId: 0, zywnoscNetto: 100, oblegany: false }] };
const units1 = [{ ownerId: 0, typeId: 'woj', camping: false }];
const ef = M.advanceEmpireFood(econ, units1, states, upkeep, params);
const t0 = ef.byOwner.get(0);
ok(t0.doPanstwa === 30, 'split 30% to state reserves');
ok(states.get(0).zapasyPanstwa === 0, 'bez Spichlerza: nadwyżka wojska nie kumuluje (B5)');

const statesSp = new Map([[0, M.freshEmpireFoodState(70)]]);
const econSp = { perCity: [{ ownerId: 0, zywnoscNetto: 100, oblegany: false, maSpichlerz: true }] };
const efSp = M.advanceEmpireFood(econSp, units1, statesSp, upkeep, params);
ok(statesSp.get(0).zapasyPanstwa === 29, 'ze Spichlerzem: reserve after army cost 1');

const states2 = new Map([[0, M.freshEmpireFoodState(70)]]);
const econ2 = {
  perCity: [
    { ownerId: 0, zywnoscNetto: 50, oblegany: false },
    { ownerId: 0, zywnoscNetto: 50, oblegany: false },
  ],
};
const ef2 = M.advanceEmpireFood(econ2, [], states2, upkeep, params);
ok(ef2.byOwner.get(0).zywnoscBrutto === 100, 'brutto sums cities');
ok(ef2.byOwner.get(0).doPanstwa === 30, '30% of 100 to state');

const states3 = new Map([[0, { zapasyPanstwa: 0, procentRozwoj: 70 }]]);
const units20 = Array.from({ length: 20 }, () => ({ ownerId: 0, typeId: 'woj', camping: false }));
const ef3 = M.advanceEmpireFood(
  { perCity: [{ ownerId: 0, zywnoscNetto: 5, oblegany: false }] },
  units20, states3, upkeep, params,
);
ok(ef3.byOwner.get(0).glodWojska === true, 'starvation when reserves negative');
ok(ef3.byOwner.get(0).zapasyPo < 0, 'reserves may go below zero');

// --- army starvation ---
const starvUnits = [{ id: 'u1', ownerId: 0, typeId: 'woj', hp: 100, hpMax: 100 }];
M.applyArmyStarvationHpLoss(starvUnits, 0, 0.08, () => 100);
ok(starvUnits[0].hp === 92, 'starvation -8% max HP');

// --- WIRE 5: turn-economy — army NOT from city net ---
const MINIMAL_DATA = { econParams: { ekonomia_miasta: {}, budynki: {} }, units: [], societyParams: {} };
function makeMap() {
  return { hexes: { '0,0': { terenBazowy: 1, nakladka: 0, rzeka: null } } };
}
function makeCity() {
  return { id: 'c0', ownerId: 0, q: 0, r: 0, name: 'T', population: 3, magazynZywnosci: 0 };
}
M.bindEmpireFoodRuntime(new Map([[0, M.freshEmpireFoodState(70)]]));
const noArmy = M.advanceCityEconomy([makeCity()], makeMap(), MINIMAL_DATA, 'normal', []);
const withArmy = M.advanceCityEconomy([makeCity()], makeMap(), MINIMAL_DATA, 'normal', [
  { ownerId: 0, typeId: 'woj', camping: false },
  { ownerId: 0, typeId: 'woj', camping: false },
  { ownerId: 0, typeId: 'woj', camping: false },
]);
ok(
  noArmy.perCity[0].zywnoscNetto === withArmy.perCity[0].zywnoscNetto,
  'B5 WIRE5: city net food unchanged by army units',
);

M.bindEmpireFoodRuntime(new Map([[0, { zapasyPanstwa: 0, procentRozwoj: 50 }]]));
ok(M.getEmpireFoodSplit(0) === 50, 'runtime split from bound state');

// --- B5-SP cap (100 × Spichlerze) ---
const statesCap = new Map([[0, { zapasyPanstwa: 80, procentRozwoj: 70 }]]);
M.advanceEmpireFood(
  { perCity: [{ ownerId: 0, zywnoscNetto: 100, oblegany: false, maSpichlerz: true }] },
  [], statesCap, upkeep, params,
);
ok(statesCap.get(0).zapasyPanstwa === 100, '1 Spichlerz: cap 100, overflow przepada (80+30)');

const statesCap2 = new Map([[0, { zapasyPanstwa: 150, procentRozwoj: 70 }]]);
M.advanceEmpireFood(
  { perCity: [
    { ownerId: 0, zywnoscNetto: 100, oblegany: false, maSpichlerz: true },
    { ownerId: 0, zywnoscNetto: 100, oblegany: false, maSpichlerz: true },
  ] },
  [], statesCap2, upkeep, params,
);
ok(statesCap2.get(0).zapasyPanstwa === 200, '2 Spichlerze: cap 200');
ok(M.getEmpireFoodMaxCap(0) === 200, 'getEmpireFoodMaxCap reflects 2 Spichlerze');

// 1 Spichlerz, +50/t netto armii (100 brutto × 30% split, 0 koszt): 2 tury → cap 100
const states2t = new Map([[0, { zapasyPanstwa: 0, procentRozwoj: 70 }]]);
const econ50 = { perCity: [{ ownerId: 0, zywnoscNetto: 100, oblegany: false, maSpichlerz: true }] };
M.advanceEmpireFood(econ50, [], states2t, upkeep, params);
ok(states2t.get(0).zapasyPanstwa === 30, 'tura 1: +30 do zapasów');
M.advanceEmpireFood(econ50, [], states2t, upkeep, params);
ok(states2t.get(0).zapasyPanstwa === 60, 'tura 2: +30 (łącznie 60)');
M.advanceEmpireFood(econ50, [], states2t, upkeep, params);
M.advanceEmpireFood(econ50, [], states2t, upkeep, params);
ok(states2t.get(0).zapasyPanstwa === 100, 'tura 4+: cap 100, overflow przepada');

console.log('empire-food-b5-test: ' + passed + ' pass, ' + failed + ' fail');
process.exit(failed > 0 ? 1 : 0);
