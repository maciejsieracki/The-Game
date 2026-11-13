'use strict';
/**
 * Focused gameplay contract for the resolved population Matrix fields.
 * Run from gra/: node tools/population-civ-matrix-wiring-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.resolve(GRA_ROOT, 'src');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'population-civ-matrix-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');
fs.writeFileSync(entry, `
  export {
    applyHungerPenaltyV85,
    applyPostCentralPopulationGrowth,
    applyFractionalGrowthV85,
    computeGrowthPercentV85,
    resolvePopulationMatrixForCiv,
  } from ${JSON.stringify(path.join(SOURCE_ROOT, 'game/population-growth-v85'))};
  export {
    cityPopulationCap,
    populationGrowth,
    resolvePopulationCapMatrixDelta,
  } from ${JSON.stringify(path.join(SOURCE_ROOT, 'game/economy'))};
  export { toEconomyCity } from ${JSON.stringify(path.join(SOURCE_ROOT, 'game/turn-economy'))};
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  M = require(bundle);
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
}

let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) passed++;
  else { failed++; console.error('FAIL:', message); }
}
function equal(actual, expected, message) {
  ok(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function near(actual, expected, message) {
  ok(Math.abs(actual - expected) < 1e-9, `${message} (got ${actual}, want ${expected})`);
}

const matrix = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data/civ-matrix.json'), 'utf8'));
const rationParams = {
  racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
  racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
};
const noSpichlerz = {
  ceramikaActive: false, solActive: false,
  maSpichlerzPop: false, maSpichlerzIIPop: false,
};
function growthInput(overrides = {}) {
  return {
    population: 5, poziomRacji: 1.5, zdrowie: 20, szczescieNetto: 0,
    wealthPoziom: 1, spichlerzState: noSpichlerz, civKey: null,
    difficulty: 'normal', rationParams, ...overrides,
  };
}

console.log('--- all 15 profiles and neutral resolved values ---');
equal(matrix.cywilizacje.length, 15, 'matrix has all 15 civilization profiles');
const approvedCapDeltas = {
  grecy: 1, rzymianie: 2, chinczycy: 2, inkowie: 1, zulusi: -1,
  egipt: 2, sumer: 1, celtowie: 0, germanie: 0, harappa: 2,
  hetyci: 1, slowianie: 0, babilonia: 1, asyria: 1, fenicjanie: 1,
};
for (const row of matrix.cywilizacje) {
  const resolved = M.resolvePopulationMatrixForCiv(row.ikonaId);
  equal(resolved.hungerLossMultiplier, 1, `${row.ikonaId}: zero hunger bonus is neutral`);
  equal(resolved.healthGrowthMultiplier, 1, `${row.ikonaId}: zero health bonus is neutral`);
  equal(resolved.happinessBase, row.params.lud_zadowolenie_bazowe ?? matrix.defaults.lud_zadowolenie_bazowe, `${row.ikonaId}: happiness resolves from owner profile`);
  equal(row.params.lud_limit_populacji, approvedCapDeltas[row.ikonaId], `${row.ikonaId}: owner-approved Matrix cap delta is exact`);
  equal(resolved.populationCapDelta, approvedCapDeltas[row.ikonaId], `${row.ikonaId}: cap delta resolves from the owner civ key`);
}
const unknown = M.resolvePopulationMatrixForCiv(null);
equal(unknown.hungerLossMultiplier, 1, 'missing owner civ keeps hunger neutral');
equal(unknown.healthGrowthMultiplier, 1, 'missing owner civ keeps health neutral');
equal(unknown.happinessBase, 0, 'missing owner civ keeps happiness neutral');
equal(unknown.populationCapDelta, 0, 'missing owner civ keeps population cap neutral');

console.log('--- resolved cap ladder and both population consumers ---');
const capParams = { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 };
equal(M.cityPopulationCap(false, false, capParams, 0), 5, 'zero delta preserves base cap 5');
equal(M.cityPopulationCap(false, true, capParams, 0), 8, 'zero delta preserves Spichlerz cap 8');
equal(M.cityPopulationCap(true, true, capParams, 0), 12, 'zero delta preserves Akwedukt cap 12');
equal(M.cityPopulationCap(false, false, capParams, -1), 4, '-1 delta lowers the base cap to 4');
equal(M.cityPopulationCap(false, false, capParams, 1), 6, '+1 delta raises the base cap to 6');
equal(M.cityPopulationCap(false, false, capParams, 2), 7, '+2 delta raises the base cap to 7');
equal(M.cityPopulationCap(true, true, capParams, 2), 14, '+2 delta is bounded by the maximum cap 14');
equal(M.resolvePopulationCapMatrixDelta('legacy-placeholder'), 0, 'invalid or old placeholder values never become +10');
equal(M.applyFractionalGrowthV85({ population: 5, wzrostUlamkowy: 0 }, 20, true, false, capParams, false, 1).nowaLudnosc, 6, 'central growth reaches the +1-adjusted cap');
equal(M.applyFractionalGrowthV85({ population: 5, wzrostUlamkowy: 0 }, 20, true, false, capParams, false, -1).nowaLudnosc, 5, 'central growth does not cross the -1-adjusted cap');

const legacyParams = {
  progWzrostuWspolczynnik: 16,
  spichlerzZachowaniePoPrzroscie: 0.5,
  akweduktProgLudnosci: 5,
  spichlerzProgLudnosci: 8,
  akweduktMaxLudnosci: 12,
  zywnoscZuzytkaPopulacja: 1,
  zdrowieModyfikatorWspolczynnik: 0.05,
};
function legacyCity(civKey, ludnosc, buildings = {}) {
  return {
    id: `legacy-${civKey}-${ludnosc}`, ludnosc, civKey, zdrowie: 0, czyStolica: true,
    maSpichlerz: !!buildings.maSpichlerz, maSpichlerzII: false, maAkwedukt: !!buildings.maAkwedukt,
    magazynZywnosci: 0, specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 60, procentPieniadz: 30, procentLuksus: 10 },
    podziałPracy: { procentBudynki: 70 },
  };
}
equal(M.populationGrowth(legacyCity('grecy', 5), 1000, legacyParams).nowaLudnosc, 6, 'legacy population applies +1 delta');
equal(M.populationGrowth(legacyCity('zulusi', 5), 1000, legacyParams).nowaLudnosc, 5, 'legacy population applies -1 delta');
equal(M.populationGrowth(legacyCity('rzymianie', 13, { maAkwedukt: true }), 1000, legacyParams).nowaLudnosc, 14, 'legacy population reaches max 14 with +2 delta');
const savedLegacy = JSON.parse(JSON.stringify(legacyCity('rzymianie', 13, { maAkwedukt: true })));
equal(M.populationGrowth(savedLegacy, 1000, legacyParams).nowaLudnosc, 14, 'save/load preserves deterministic cap derivation from civKey');

console.log('--- runtime adapter preserves owner civ key for legacy growth ---');
const runtimeCity = {
  id: 'runtime-grecy', ownerId: 7, q: 0, r: 0, name: 'Runtime Grecy', population: 5,
  magazynZywnosci: 0,
};
const adaptedRuntimeCity = M.toEconomyCity(
  runtimeCity,
  legacyParams,
  true,
  0,
  {},
  undefined,
  undefined,
  'grecy',
);
equal(adaptedRuntimeCity.civKey, 'grecy', 'runtime adapter carries owner civ key into EconomyCity');
equal(M.populationGrowth(adaptedRuntimeCity, 1000, legacyParams).nowaLudnosc, 6, 'adapter-to-legacy growth applies the owner +1 cap delta');
const neutralRuntimeCity = M.toEconomyCity(runtimeCity, legacyParams, true);
equal(neutralRuntimeCity.civKey, null, 'runtime adapter remains neutral without owner civ key');
equal(M.populationGrowth(neutralRuntimeCity, 1000, legacyParams).nowaLudnosc, 5, 'neutral adapter preserves the base cap at population 5');

function centralCapFixture(ownerId, civKey, population, builtIds = []) {
  const city = {
    id: `central-cap-${ownerId}`, ownerId, q: ownerId, r: 0, name: civKey,
    population, poziomRacji: 4.5, rationMigratedV114: true,
    wzrostUlamkowy: 0.8, turyBezDoplaty: 0, hungerLossUlamkowy: 0,
  };
  const efResult = {
    perOwner: [{
      perCityRows: [{ cityId: city.id }],
      fedByCityId: new Map([[city.id, true]]),
    }],
  };
  const econ = {
    perCity: [{ cityId: city.id, ownerId, oblegany: false, zdrowie: 0 }],
    growth: 0, starved: 0,
  };
  M.applyPostCentralPopulationGrowth({
    cities: [city], econ, efResult, map: {}, territoryNodes: [],
    econParams: capParams,
    rationParams,
    ownerCivByOwnerId: new Map([[ownerId, civKey]]),
    populationMatrixByOwnerId: new Map([[ownerId, M.resolvePopulationMatrixForCiv(civKey)]]),
    builtByCity: new Map([[city.id, builtIds]]),
  });
  return city.population;
}
equal(centralCapFixture(0, 'zulusi', 5), 5, 'player central path honors -1 cap delta');
equal(centralCapFixture(7, 'grecy', 5), 6, 'major AI central path honors +1 cap delta');
equal(centralCapFixture(9, 'rzymianie', 13, ['akwedukt']), 14, 'city-state central path honors +2 and max 14');

console.log('--- central hunger and health gameplay effects ---');
const hungerNeutral = M.applyHungerPenaltyV85(4, false, 0, 1, 0);
const hungerDouble = M.applyHungerPenaltyV85(4, false, 0, 2, 0);
equal(hungerNeutral.nowaLudnosc, 3, 'neutral hunger preserves the existing -1 loss');
equal(hungerDouble.nowaLudnosc, 2, 'nonzero hunger Matrix value changes the real population loss');
equal(hungerDouble.ubytek, true, 'nonzero hunger value reports a real loss');
const hungerHalf1 = M.applyHungerPenaltyV85(4, false, 0, 0.5, 0);
const hungerHalf2 = M.applyHungerPenaltyV85(4, false, 0, 0.5, hungerHalf1.hungerLossUlamkowy);
equal(hungerHalf1.nowaLudnosc, 4, 'fractional hunger loss keeps the first partial debt');
equal(hungerHalf2.nowaLudnosc, 3, 'fractional hunger debt deterministically becomes one population loss');
equal(M.applyHungerPenaltyV85(1, false, 0, 3, 0).nowaLudnosc, 1, 'hunger never violates the minimum population');
const centralHungerCity = {
  id: 'central-hunger-city', ownerId: 0, q: 0, r: 0, name: 'Central Hunger',
  population: 4, poziomRacji: 1.5, rationMigratedV114: true,
  wzrostUlamkowy: 0, turyBezDoplaty: 0, hungerLossUlamkowy: 0,
};
M.applyPostCentralPopulationGrowth({
  cities: [centralHungerCity],
  econ: {
    perCity: [{ cityId: centralHungerCity.id, ownerId: 0, oblegany: false, zdrowie: 20 }],
    growth: 0, starved: 0,
  },
  efResult: { perOwner: [{
    perCityRows: [{ cityId: centralHungerCity.id }],
    fedByCityId: new Map([[centralHungerCity.id, false]]),
  }] },
  map: {}, territoryNodes: [],
  econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 },
  rationParams,
  ownerCivByOwnerId: new Map([[0, 'fixture-central-hunger']]),
  populationMatrixByOwnerId: new Map([[0, { hungerLossMultiplier: 2, healthGrowthMultiplier: 1, happinessBase: 0, populationCapDelta: 0 }]]),
});
equal(centralHungerCity.population, 2, 'central hunger path applies the resolved nonzero loss to real city population');
const healthNeutral = M.computeGrowthPercentV85(growthInput({ populationMatrix: {
  hungerLossMultiplier: 1, healthGrowthMultiplier: 1, happinessBase: 0, populationCapDelta: 0,
} }));
const healthDouble = M.computeGrowthPercentV85(growthInput({ populationMatrix: {
  hungerLossMultiplier: 1, healthGrowthMultiplier: 2, happinessBase: 0, populationCapDelta: 0,
} }));
equal(healthNeutral.zdrowie, 2, 'neutral health keeps the existing floor health contribution');
equal(healthDouble.zdrowie, 4, 'nonzero health Matrix value scales the central health contribution once');
equal(healthDouble.total - healthNeutral.total, 2, 'health scaling changes growthPct by exactly the scaled contribution');

console.log('--- player / major AI / city-state share one central resolver ---');
const owners = [0, 7, 9];
const cities = owners.map((ownerId, index) => ({
  id: `city-${ownerId}`, ownerId, q: index, r: 0, name: `City ${ownerId}`,
  population: 1, poziomRacji: 1.5, rationMigratedV114: true,
  wzrostUlamkowy: 0, turyBezDoplaty: 0, hungerLossUlamkowy: 0,
}));
const matrixOverride = { hungerLossMultiplier: 1, healthGrowthMultiplier: 2, happinessBase: 10, populationCapDelta: 0 };
const populationMatrixByOwnerId = new Map(owners.map(ownerId => [ownerId, matrixOverride]));
const efResult = {
  perOwner: owners.map((ownerId) => ({
    perCityRows: [{ cityId: `city-${ownerId}` }],
    fedByCityId: new Map([[`city-${ownerId}`, true]]),
  })),
};
const econ = {
  perCity: owners.map(ownerId => ({ cityId: `city-${ownerId}`, ownerId, oblegany: false, zdrowie: 20 })),
  growth: 0, starved: 0,
};
M.applyPostCentralPopulationGrowth({
  cities, econ, efResult, map: {}, territoryNodes: [],
  econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 },
  rationParams, ownerCivByOwnerId: new Map(owners.map(ownerId => [ownerId, `fixture-${ownerId}`])),
  populationMatrixByOwnerId,
});
for (const ownerId of owners) {
  const row = efResult.perOwner.find(t => t.perCityRows[0].cityId === `city-${ownerId}`).perCityRows[0];
  equal(row.breakdown.zdrowie, 4, `owner ${ownerId} uses the same central health path`);
}

console.log('--- main wiring and no legacy duplicate ---');
const mainSource = fs.readFileSync(path.join(SOURCE_ROOT, 'main.ts'), 'utf8');
const turnEconomySource = fs.readFileSync(path.join(SOURCE_ROOT, 'game/turn-economy.ts'), 'utf8');
ok(mainSource.includes('for (const [oid, civ] of _menuCivIdByOwner)'), 'ownerCivMap includes human owner provenance');
ok(mainSource.includes('for (const [oid, civ] of aiOwnerCivMap)'), 'ownerCivMap includes AI/city-state provenance');
ok(mainSource.includes('populationMatrixByOwnerId'), 'one resolved population Matrix map is passed to central growth');
ok(mainSource.includes('resolvePopulationMatrixForCiv(ownerCivMap.get(city.ownerId))'), 'same owner-resolved helper is used in the live city loop');
ok(mainSource.includes(') + populationMatrix.happinessBase;'), 'resolved happiness bonus feeds the order/revolt channel');
ok(turnEconomySource.includes('const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);'), 'legacy path resolves civ key from ownerCivMap');
ok(turnEconomySource.includes('ownerDefaultPodzialPracy,\n      ownerCivKey,'), 'legacy adapter receives the resolved owner civ key');
ok(!mainSource.includes("civMatrixParam(city.ownerId"), 'no owner id is used as a civ key');

fs.rmSync(tempRoot, { recursive: true, force: true });
console.log(`population Matrix wiring: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
