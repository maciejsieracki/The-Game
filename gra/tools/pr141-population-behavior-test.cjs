'use strict';

// Focused end-of-turn population behavior receipt for the five lud_* fields.
// Run from gra/: node tools/pr141-population-behavior-test.cjs
// Synthetic fixture profiles perturb one raw field at a time; production data is read-only.
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-population-'));
const ENTRY = path.join(TEMP, 'entry.ts');
const SHIM = path.join(TEMP, 'civ-matrix-fixture.ts');
const BUNDLE = path.join(TEMP, 'bundle.cjs');
const realMatrixPath = path.join(ROOT, 'data/civ-matrix.json');

fs.writeFileSync(SHIM, `
import actual from ${JSON.stringify(realMatrixPath)};
export function civMatrixParam(civ: string, id: string): number {
  const fixture = (globalThis as any).__pr141Profiles?.[civ];
  if (fixture && Object.prototype.hasOwnProperty.call(fixture, id)) return fixture[id];
  const row = actual.cywilizacje.find((r: any) => r.ikonaId === civ || r.typCywilizacji === civ || r.Cywilizacja === civ);
  return row?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
// Keep the fixture override at the raw matrix lookup boundary while preserving
// civ-matrix.ts's real apply formula contract for the imported economy module.
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  const formula = actual.paramDefs?.[id]?.formula ?? 'mul_proc';
  switch (formula) {
    case 'mul_abs': return base * value;
    case 'add': return base + value;
    case 'flag':
    case 'skala':
    case 'stat_abs': return value;
    case 'mul_proc':
    default: return base * (1 + value);
  }
}
export function loadCivMatrix() { return actual; }
export function civMatrixParamAtDifficulty(civ: string, id: string) { return civMatrixParam(civ, id); }
export function civMatrixParamsAtDifficulty(civ: string) {
  const row = actual.cywilizacje.find((r: any) => r.ikonaId === civ || r.typCywilizacji === civ || r.Cywilizacja === civ);
  return Object.fromEntries(Object.keys(actual.paramDefs).map((id: string) => [id, row?.params?.[id] ?? actual.defaults?.[id] ?? 0]));
}
`, 'utf8');
fs.writeFileSync(ENTRY, `
export { applyPostCentralPopulationGrowth, resolvePopulationMatrixForCiv } from ${JSON.stringify(path.join(SRC, 'game/population-growth-v85'))};
export { evaluateOrderFromBreakdown } from ${JSON.stringify(path.join(SRC, 'game/society-breakdown'))};
`, 'utf8');

(async () => {
let M;
try {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, logLevel: 'silent',
    plugins: [{
      name: 'fixture-civ-matrix',
      setup(build) {
        build.onResolve({ filter: /\/civ-matrix$/ }, () => ({ path: SHIM }));
      },
    }],
  });
  M = require(BUNDLE);
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  fs.rmSync(TEMP, { recursive: true, force: true });
  process.exit(1);
}

const matrix = JSON.parse(fs.readFileSync(realMatrixPath, 'utf8'));
const society = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/society-params.json'), 'utf8'));
const rationParams = {
  racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
  racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
};
const fields = [
  'lud_wzrost_proc', 'lud_spadek_proc', 'lud_zdrowie_proc',
  'lud_zadowolenie_bazowe', 'lud_limit_populacji',
];
let passed = 0;
let failed = 0;
function check(condition, label, actual) {
  if (condition) passed++;
  else { failed++; console.error(`FAIL: ${label}; got ${JSON.stringify(actual)}`); }
}
function equal(actual, expected, label) {
  check(Object.is(actual, expected), label, { actual, expected });
}

const defaults = Object.fromEntries(fields.map(k => [k, matrix.defaults[k] ?? 0]));
function city(id, ownerId, setup = {}) {
  return {
    id, ownerId, q: ownerId, r: 0, name: id,
    population: 6, poziomRacji: 4.5, rationMigratedV114: true,
    wzrostUlamkowy: 0, turyBezDoplaty: 0, hungerLossUlamkowy: 0,
    ...setup,
  };
}

function runTurn(profileByOwner, setupByOwner = {}, fedByOwner = {}) {
  globalThis.__pr141Profiles = profileByOwner;
  const owners = [11, 22];
  const cities = owners.map(owner => city(`city-${owner}`, owner, setupByOwner[owner]));
  const efResult = {
    perOwner: owners.map(owner => ({
      perCityRows: [{ cityId: `city-${owner}` }],
      fedByCityId: new Map([[`city-${owner}`, fedByOwner[owner] ?? true]]),
    })),
  };
  const econ = {
    perCity: owners.map(owner => ({ cityId: `city-${owner}`, ownerId: owner, oblegany: false, zdrowie: 20 })),
    growth: 0, starved: 0,
  };
  const ownerCivByOwnerId = new Map([[11, 'fixture-target'], [22, 'fixture-control']]);

  // This composes the two production APIs in the same order used by main.ts.
  // It does not execute or assert main.ts's map/cityOrderState wiring.
  const happinessByCityId = new Map();
  const orderNettoByCityId = new Map();
  for (const owner of owners) {
    const matrixResolved = M.resolvePopulationMatrixForCiv(ownerCivByOwnerId.get(owner));
    const order = M.evaluateOrderFromBreakdown({
      difficulty: 'normal', era: 1, population: cities.find(c => c.ownerId === owner).population,
      buildingZadowolenie: matrixResolved.happinessBase,
      ownCultureShare: 0.5, ownReligionShare: 0.5,
      podzialHandlu: { procentNauka: 60, procentPieniadz: 30, procentLuksus: 10 },
    }, {
      difficulty: 'normal', era: 1,
      population: cities.find(c => c.ownerId === owner).population,
      garnizonCount: 0,
    }, society, 'normal');
    happinessByCityId.set(`city-${owner}`, Math.round(order.sz.netto * 10) / 10);
    orderNettoByCityId.set(`city-${owner}`, order.sz.netto);
  }
  M.applyPostCentralPopulationGrowth({
    cities, econ, efResult, map: {}, territoryNodes: [],
    econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 },
    rationParams, ownerCivByOwnerId, happinessByCityId,
    builtByCity: new Map(owners.map(owner => [
      `city-${owner}`, setupByOwner[owner]?.builtIds ?? [],
    ])),
  });
  return Object.fromEntries(cities.map(c => [c.ownerId, {
    population: c.population, frac: c.wzrostUlamkowy,
    hungerDebt: c.hungerLossUlamkowy, happiness: orderNettoByCityId.get(c.id),
  }]));
}

function oneFieldProfile(field, value) {
  return { ...defaults, [field]: value };
}

// Fresh baseline on the unchanged shared checkout, before interpreting perturbations.
console.log('baseline HEAD=edb8fb56115e9dec0a58614dfb23ca6173d60c9a (confirmed by operator shell)');
const baseline = runTurn({
  'fixture-target': { ...defaults },
  'fixture-control': { ...defaults },
});
equal(baseline[11].population, 6, 'neutral target baseline population');
equal(baseline[11].frac, baseline[22].frac, 'neutral target/control baseline state parity');

const cases = [
  { field: 'lud_wzrost_proc', value: 0.10, setup: { population: 6, builtIds: ['akwedukt'] }, fed: { 11: true } },
  { field: 'lud_spadek_proc', value: 1, setup: { population: 4, poziomRacji: 1.5 }, fed: { 11: false } },
  { field: 'lud_zdrowie_proc', value: 1, setup: { population: 6, builtIds: ['akwedukt'] }, fed: { 11: true } },
  { field: 'lud_zadowolenie_bazowe', value: 20, setup: { population: 6, builtIds: ['akwedukt'] }, fed: { 11: true } },
  { field: 'lud_limit_populacji', value: 1, setup: { population: 5, wzrostUlamkowy: 0.8 }, fed: { 11: true } },
];
const observed = {};
for (const item of cases) {
  const targetProfile = oneFieldProfile(item.field, item.value);
  const result = runTurn({
    'fixture-target': targetProfile,
    'fixture-control': { ...defaults },
  }, { 11: item.setup, 22: item.setup }, item.fed);
  const targetBaseline = runTurn({
    'fixture-target': { ...defaults }, 'fixture-control': { ...defaults },
  }, { 11: item.setup, 22: item.setup }, item.fed);
  observed[item.field] = { baseline: targetBaseline[11], perturbed: result[11], control: result[22] };
  const targetChanged = result[11].population !== targetBaseline[11].population
    || result[11].frac !== targetBaseline[11].frac
    || result[11].hungerDebt !== targetBaseline[11].hungerDebt;
  check(targetChanged, `${item.field}: single-field perturbation changes target end-of-turn population state`, observed[item.field]);
  equal(result[22].population, targetBaseline[22].population, `${item.field}: other owner's final population unchanged`);
  equal(result[22].frac, targetBaseline[22].frac, `${item.field}: other owner's fractional growth unchanged`);
}

// Owner binding and default/rounding/floor/cap boundaries are exercised through end-turn state.
equal(runTurn({ 'fixture-target': { ...defaults }, 'fixture-control': { ...defaults } })[11].hungerDebt, 0,
  'zero/default hunger leaves no fractional loss debt while fed');
const halfHunger = runTurn({
  'fixture-target': { ...defaults, lud_spadek_proc: -0.5 }, 'fixture-control': { ...defaults },
}, { 11: { population: 4 }, 22: { population: 4 } }, { 11: false, 22: false });
equal(halfHunger[11].population, 4, 'half-rate hunger remains fractional for first unfed turn');
equal(halfHunger[11].hungerDebt, 0.5, 'half-rate hunger retains exact fractional debt');
const lowFloor = runTurn({
  'fixture-target': { ...defaults, lud_spadek_proc: 2 }, 'fixture-control': { ...defaults },
}, { 11: { population: 1, poziomRacji: 1.5 }, 22: { population: 1, poziomRacji: 1.5 } }, { 11: false, 22: false });
equal(lowFloor[11].population, 1, 'hunger loss preserves minimum population one');
const growthRoundingLow = runTurn({
  'fixture-target': { ...defaults, lud_wzrost_proc: 0.004 }, 'fixture-control': { ...defaults },
}, { 11: { population: 6, wzrostUlamkowy: 0, builtIds: ['akwedukt'] }, 22: { population: 6, wzrostUlamkowy: 0, builtIds: ['akwedukt'] } });
const growthRoundingHalf = runTurn({
  'fixture-target': { ...defaults, lud_wzrost_proc: 0.005 }, 'fixture-control': { ...defaults },
}, { 11: { population: 6, wzrostUlamkowy: 0, builtIds: ['akwedukt'] }, 22: { population: 6, wzrostUlamkowy: 0, builtIds: ['akwedukt'] } });
equal(Number((growthRoundingHalf[11].frac - growthRoundingLow[11].frac).toFixed(8)), 0.06,
  'growth contribution rounds at the half percentage-point boundary (0.5 p.p. -> 1 p.p.)');
const hardCap = runTurn({
  'fixture-target': Object.fromEntries(fields.map(k => [
    k, matrix.cywilizacje.find(r => r.ikonaId === 'chinczycy')?.params[k] ?? matrix.defaults[k] ?? 0,
  ])),
  'fixture-control': { ...defaults },
}, {
  11: { population: 13, wzrostUlamkowy: 0.8, poziomRacji: 6, builtIds: ['akwedukt'] },
  22: { population: 13, wzrostUlamkowy: 0.8, poziomRacji: 6, builtIds: ['akwedukt'] },
});
equal(hardCap[11].population, 14, 'Chinese +2 delta and Aqueduct cap stop attempted 13-to-15 growth at 14');
check(hardCap[11].frac >= 1, '14 cap prevents consuming the remaining attempted growth beyond 14', hardCap[11]);

fs.rmSync(TEMP, { recursive: true, force: true });
console.log('per-field final state:', JSON.stringify(observed));
console.log(`population behavior: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
})();
