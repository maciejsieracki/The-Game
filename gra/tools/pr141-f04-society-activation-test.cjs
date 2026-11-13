'use strict';

// Bounded synthetic-facility test for the six F04 society adapters.
// Run from gra/: node tools/pr141-f04-society-activation-test.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-f04-society-'));
const SHIM = path.join(TEMP, 'civ-matrix.ts');
const ENTRY = path.join(TEMP, 'entry.ts');
const BUNDLE = path.join(TEMP, 'bundle.cjs');
const MATRIX_PATH = path.join(ROOT, 'data/civ-matrix.json');
const MATRIX = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
const WORKBOOK_PATH = path.join(ROOT, '../panele-sterowania/Cyw-macierz-REVIEW.xlsx');
const FIELDS = [
  'wealth_cap_proc',
  'kultura_naplyw_proc',
  'porzadek_kultura_proc',
  'porzadek_nauka_proc',
  'porzadek_produkcja_proc',
  'porzadek_wzrost_proc',
];

let passed = 0;
let failed = 0;
function check(condition, label, details) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${label}${details === undefined ? '' : ` (${JSON.stringify(details)})`}`);
  }
}
function equal(actual, expected, label) {
  check(Object.is(actual, expected), label, { actual, expected });
}
function near(actual, expected, label, tolerance = 1e-9) {
  check(Math.abs(actual - expected) <= tolerance, label, { actual, expected });
}

if (crypto.createHash('sha256').update(fs.readFileSync(WORKBOOK_PATH)).digest('hex')
  !== 'c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32') {
  throw new Error('approved F04 workbook hash changed');
}
check(MATRIX.cywilizacje.length === 15, 'production matrix has fifteen civilization rows');
for (const id of FIELDS) {
  check(MATRIX.cywilizacje.every(row => row.params[id] === 0), `${id} production readback is neutral for all 15 civs`);
}

fs.writeFileSync(SHIM, `
import actual from ${JSON.stringify(MATRIX_PATH)};
function rowFor(civ: string): any {
  return actual.cywilizacje.find((r: any) => r.ikonaId === civ || r.typCywilizacji === civ || r.Cywilizacja === civ);
}
export function civMatrixParam(civ: string, id: string): number {
  const fixtures = (globalThis as any).__pr141F04Society ?? {};
  const row = fixtures[civ];
  if (row && Object.prototype.hasOwnProperty.call(row, id)) return row[id];
  return rowFor(civ)?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
export function civMatrixParamDef(id: string): any { return actual.paramDefs?.[id]; }
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  const formula = civMatrixParamDef(id)?.formula ?? 'mul_proc';
  if (formula === 'add') return base + value;
  if (formula === 'mul_abs') return base * value;
  if (formula === 'flag' || formula === 'skala' || formula === 'stat_abs') return value;
  return base * (1 + value);
}
export function civMatrixParamAtDifficulty(civ: string, id: string) { return civMatrixParam(civ, id); }
export function civMatrixParamsAtDifficulty(civ: string) {
  return Object.fromEntries(Object.keys(actual.paramDefs).map((id: string) => [id, civMatrixParam(civ, id)]));
}
export function loadCivMatrix() { return actual; }
`, 'utf8');

fs.writeFileSync(ENTRY, `
export { wealthCap, FALLBACK_WEALTH_PARAMS, wealthParamsWithCapModifier } from ${JSON.stringify(path.join(SRC, 'game/wealth'))};
export { cultureAccrualWithModifier, accumulateCulture, FALLBACK_CULTURE_PARAMS } from ${JSON.stringify(path.join(SRC, 'game/culture-religion'))};
export { orderEffects, orderEffectsWithCivMatrix, orderEffectsToYieldMults } from ${JSON.stringify(path.join(SRC, 'game/order'))};
export { applyOrderYieldMults } from ${JSON.stringify(path.join(SRC, 'game/turn-economy'))};
export { applyPostCentralPopulationGrowth } from ${JSON.stringify(path.join(SRC, 'game/population-growth-v85'))};
`);

(async () => {
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, logLevel: 'silent',
      plugins: [{
        name: 'synthetic-civ-matrix',
        setup(build) {
          build.onResolve({ filter: /(?:^|\/)civ-matrix$/ }, () => ({ path: SHIM }));
        },
      }],
    });
  } catch (error) {
    console.error('esbuild failed:', error.message || error);
    fs.rmSync(TEMP, { recursive: true, force: true });
    process.exit(1);
  }

  try {
    const M = require(BUNDLE);
    globalThis.__pr141F04Society = {
      'fixture-a': {
        wealth_cap_proc: 0.2,
        kultura_naplyw_proc: 0.25,
        porzadek_produkcja_proc: 0.1,
        porzadek_nauka_proc: 0.2,
        porzadek_kultura_proc: 0.3,
        porzadek_wzrost_proc: 0.2,
      },
      'fixture-b': Object.fromEntries(FIELDS.map(id => [id, 0])),
    };

    const baseWealth = { ...M.FALLBACK_WEALTH_PARAMS, capNaEpoke: 10 };
    equal(M.wealthCap(2, M.wealthParamsWithCapModifier(baseWealth, 0)), 20, 'zero cap modifier keeps base cap');
    equal(M.wealthCap(2, M.wealthParamsWithCapModifier(baseWealth, 0.2)), 24, 'synthetic cap modifier reaches actual Wealth cap formula');

    const cultureGain = M.cultureAccrualWithModifier(8, 0.25);
    near(cultureGain, 10, 'synthetic inflow modifier scales incoming culture once');
    const accrued = M.accumulateCulture({ kulturaSkumulowana: 5 }, cultureGain, M.FALLBACK_CULTURE_PARAMS);
    near(accrued.kulturaSkumulowana, 15, 'adjusted incoming culture reaches accumulation consumer');
    near(M.cultureAccrualWithModifier(8, 0), 8, 'zero inflow modifier preserves input');

    const baseEffects = {
      productionMult: 0.8, pieniadzMult: 1, naukaMult: 0.9,
      kulturaMult: 0.7, growthMult: 1.2, tradeMult: 1, revoltRisk: 0.1,
    };
    const effectA = M.orderEffectsWithCivMatrix(baseEffects, {
      porzadek_produkcja_proc: 0.1,
      porzadek_nauka_proc: 0.2,
      porzadek_kultura_proc: 0.3,
      porzadek_wzrost_proc: 0.2,
    });
    const effectB = M.orderEffectsWithCivMatrix(baseEffects, {
      porzadek_produkcja_proc: 0,
      porzadek_nauka_proc: 0,
      porzadek_kultura_proc: 0,
      porzadek_wzrost_proc: 0,
    });
    near(effectA.productionMult, 0.88, 'production field composes with existing Order multiplier once');
    near(effectA.naukaMult, 1.08, 'science field composes with existing Order multiplier once');
    near(effectA.kulturaMult, 0.91, 'Order culture field composes with existing Order multiplier once');
    near(effectA.growthMult, 1.44, 'growth field composes with existing non-neutral Order multiplier once');
    equal(effectA.revoltRisk, baseEffects.revoltRisk, 'selected modifiers preserve unrelated revolt risk');
    equal(effectB.productionMult, baseEffects.productionMult, 'second owner receives only own zero production field');
    equal(effectB.naukaMult, baseEffects.naukaMult, 'second owner receives only own zero science field');

    const yieldMults = M.orderEffectsToYieldMults('unrest', effectA);
    const yld = { praca: 100, pieniadz: 20, nauka: 50, kultura: 40 };
    M.applyOrderYieldMults(yld, yieldMults);
    near(yld.praca, 88, 'Order production reaches actual turn-economy yield consumer');
    near(yld.nauka, 54, 'Order science reaches actual turn-economy yield consumer');
    near(yld.kultura, 36.4, 'Order culture reaches actual turn-economy yield consumer');
    near(M.orderEffectsWithCivMatrix(M.orderEffects('neutral'), {
      porzadek_wzrost_proc: 0,
    }).growthMult, 1, 'neutral Order plus zero F04 remains neutral');

    function runGrowthFixture({ orderMult, fed = true, population = 1, ration = 2 }) {
      const city = {
        id: 'city-a', ownerId: 11, name: 'city-a', population,
        poziomRacji: ration, rationMigratedV114: true,
        wzrostUlamkowy: 0, turyBezDoplaty: 0, hungerLossUlamkowy: 0,
      };
      const econ = { perCity: [{ cityId: city.id, ownerId: city.ownerId, oblegany: false, zdrowie: 0 }], growth: 0, starved: 0 };
      const efResult = { perOwner: [{ perCityRows: [{ cityId: city.id }], fedByCityId: new Map([[city.id, fed]]) }] };
      M.applyPostCentralPopulationGrowth({
        cities: [city], econ, efResult, map: {}, territoryNodes: [],
        econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 5 },
        rationParams: { racjeZywnosc1: 0, racjeZywnosc2: 0, racjeZywnosc3: 0, racjeWzrostProc1: 0, racjeWzrostProc2: 0, racjeWzrostProc3: 0 },
        ownerCivByOwnerId: new Map([[11, 'fixture-a']]),
        populationMatrixByOwnerId: new Map([[11, { hungerLossMultiplier: 1, healthGrowthMultiplier: 1, happinessBase: 0, populationCapDelta: 0 }]]),
        orderGrowthMultByCity: new Map([[city.id, orderMult]]),
        builtByCity: new Map([[city.id, []]]),
        happinessByCityId: new Map(),
        ownerEraByOwner: new Map([[11, 1]]),
        manpowerMaxMultByOwnerId: new Map([[11, 1]]),
      });
      return { city, tick: econ.perCity[0] };
    }

    const neutral = runGrowthFixture({ orderMult: 1 });
    const orderPositive = runGrowthFixture({ orderMult: 1.2 });
    check(orderPositive.city.wzrostUlamkowy > neutral.city.wzrostUlamkowy, 'existing 1.2 Order multiplier changes positive v85 fractional growth');
    near(orderPositive.tick.wzrostProcent, neutral.tick.wzrostProcent * 1.2, 'Order growth multiplier scales computed growth percent exactly once');
    const orderAndF04 = runGrowthFixture({ orderMult: effectA.growthMult });
    near(orderAndF04.tick.wzrostProcent, neutral.tick.wzrostProcent * 1.44, 'existing Order growth and synthetic F04 growth compose once at v85 consumer');
    const hungry = runGrowthFixture({ orderMult: 1.44, fed: false });
    equal(hungry.city.wzrostUlamkowy, 0, 'Order growth multiplier does not bypass feeding gate');
    equal(hungry.city.turyBezDoplaty, 1, 'Order growth multiplier does not bypass hunger accounting');
    const zeroGrowth = runGrowthFixture({ orderMult: 1.44, population: 6, ration: 1.5 });
    equal(zeroGrowth.tick.wzrostProcent, 0, 'Order growth multiplier does not create growth from a zero base percent');

    const mainSource = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
    check(mainSource.includes('const orderCivKey = ownerCivMap.get(city.ownerId);\n              const orderEff = orderEffectsWithCivMatrix(ordPct.effects, orderCivKey ? {'), 'actual owner profile reaches post-capture-resolved Order effects');
    check(mainSource.includes('cultureAccrualWithModifier(kulturaTick, cultureModifier)'), 'actual city culture accrual uses the owner-specific incoming modifier');
    check(mainSource.includes('orderGrowthMultByCity: growthMultMap'), 'actual central-growth call receives the per-city Order growth map');
    const turnSource = fs.readFileSync(path.join(SRC, 'game/turn-economy.ts'), 'utf8');
    check(turnSource.includes('applyOrderYieldMults(yld, orderMult)'), 'preview and tick use the Order yield consumer');
    check(turnSource.includes("civMatrixParam(wealthCivKey, 'wealth_cap_proc')"), 'Wealth cap adapter uses the actual city owner key');

    console.log(`F04 society bounded activation: ${passed} passed, ${failed} failed`);
    process.exitCode = failed === 0 ? 0 : 1;
  } finally {
    delete globalThis.__pr141F04Society;
    fs.rmSync(TEMP, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error.stack || error);
  fs.rmSync(TEMP, { recursive: true, force: true });
  process.exit(1);
});
