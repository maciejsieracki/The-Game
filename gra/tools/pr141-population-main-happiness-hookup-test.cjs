'use strict';

// Executes selected, exact TypeScript statements from main.ts in a bounded fixture.
// This does not boot the game, start Vite, or run the historical end-turn harness.
// Run from gra/: node tools/pr141-population-main-happiness-hookup-test.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ts = require(path.resolve(__dirname, '..', 'node_modules', 'typescript'));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-pop-main-'));
const SHIM = path.join(TEMP, 'civ-matrix-fixture.ts');
const ENTRY = path.join(TEMP, 'entry.ts');
const BUNDLE = path.join(TEMP, 'bundle.cjs');
const mainPath = path.join(SRC, 'main.ts');
const mainText = fs.readFileSync(mainPath, 'utf8');
const mainAst = ts.createSourceFile(mainPath, mainText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const matrixPath = path.join(ROOT, 'data/civ-matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const society = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/society-params.json'), 'utf8'));

fs.writeFileSync(SHIM, `
import actual from ${JSON.stringify(matrixPath)};
// This fixture shim supplies the current generic matrix adapter expected by economy.ts.
// It keeps matrix values fixture-aware, while using the real param definition formula;
// this test injects no F04 values, so its route stays neutral for the society matrix.
export function civMatrixParam(civ: string, id: string): number {
  const fixture = (globalThis as any).__pr141Profiles?.[civ];
  if (fixture && Object.prototype.hasOwnProperty.call(fixture, id)) return fixture[id];
  const row = actual.cywilizacje.find((r: any) => r.ikonaId === civ || r.typCywilizacji === civ || r.Cywilizacja === civ);
  return row?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
export function civMatrixParamDef(id: string) { return actual.paramDefs?.[id]; }
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  switch (civMatrixParamDef(id)?.formula ?? 'mul_proc') {
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
export { evaluateOrderFromBreakdown, applyCivMatrixHappinessModifier } from ${JSON.stringify(path.join(SRC, 'game/society-breakdown'))};
export { civMatrixParam } from ${JSON.stringify(path.join(SRC, 'game/civ-matrix'))};
export { loadOrderParams } from ${JSON.stringify(path.join(SRC, 'game/order'))};
`, 'utf8');

function walk(node, fn) {
  fn(node);
  ts.forEachChild(node, child => walk(child, fn));
}
const nodes = [];
walk(mainAst, node => nodes.push(node));
function varStatement(name, after = 0, before = Number.MAX_SAFE_INTEGER) {
  return nodes.find(node => ts.isVariableStatement(node)
    && node.getStart(mainAst) >= after && node.getStart(mainAst) < before
    && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === name));
}
function forOfStatement(expressionText, after = 0, before = Number.MAX_SAFE_INTEGER) {
  return nodes.find(node => ts.isForOfStatement(node)
    && node.getStart(mainAst) >= after && node.getStart(mainAst) < before
    && node.expression.getText(mainAst) === expressionText);
}
function exact(node, label) {
  if (!node) throw new Error(`could not extract current main.ts node: ${label}`);
  return node.getText(mainAst);
}
function transpileStatements(body, fileName = 'main-fragment.ts') {
  return ts.transpile(body, {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.None,
    fileName,
  });
}

// Extract the actual owner-map construction, including the production fallback and AI merge.
const matrixOwnerDecl = varStatement('populationMatrixByOwnerId');
const ownerMapDecl = nodes.filter(node => ts.isVariableStatement(node)
  && matrixOwnerDecl && node.getStart(mainAst) < matrixOwnerDecl.getStart(mainAst)
  && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === 'ownerCivMap'))
  .at(-1);
const matrixOwnerLoop = forOfStatement('ownerCivMap', matrixOwnerDecl?.getStart(mainAst));
if (!ownerMapDecl || !matrixOwnerDecl || !matrixOwnerLoop) throw new Error('main owner map setup not found');
const ownerBindingSource = mainText.slice(ownerMapDecl.getStart(mainAst), matrixOwnerLoop.end);

// Extract exact production declarations/statements for the city state, happiness input,
// order result, cityOrderState write, happiness projection, and final central growth call.
const orderMarker = mainText.indexOf('// SZCZĘŚCIE (+1 per budynek + resolved Matrix base bonus)');
if (orderMarker < 0) throw new Error('main happiness section marker not found');
const cityLoopMarker = mainText.indexOf('// Plony tej tury', mainText.indexOf('const populationMatrixByOwnerId'));
const cityOrderSet = nodes.find(node => ts.isExpressionStatement(node)
  && node.getStart(mainAst) >= orderMarker
  && node.getText(mainAst).startsWith('cityOrderState.set(cid, {'));
const orderEnd = cityOrderSet?.end ?? Number.MAX_SAFE_INTEGER;
const mainOrder = [
  varStatement('econTick', cityLoopMarker, orderMarker),
  varStatement('builtIds', cityLoopMarker, orderMarker),
  varStatement('populationMatrix', orderMarker, orderEnd),
  varStatement('haBuildings', orderMarker, orderEnd),
  varStatement('ordPctEvaluated', orderMarker, orderEnd),
  varStatement('happinessCivKey', orderMarker, orderEnd),
  varStatement('ordPctRaw', orderMarker, orderEnd),
  varStatement('postCaptureLawActive', orderMarker, orderEnd),
  varStatement('ordPct', orderMarker, orderEnd),
  cityOrderSet,
].map((node, i) => exact(node, `order statement ${i + 1}`)).join('\n');
const cityOrderStateDecl = exact(varStatement('cityOrderState'), 'cityOrderState declaration');
const happinessDecl = varStatement('happinessByCityId', cityOrderSet?.end ?? 0);
const happinessLoop = forOfStatement('cityOrderState', happinessDecl?.getStart(mainAst));
const happinessProjection = `${exact(happinessDecl, 'happinessByCityId declaration')}\n${exact(happinessLoop, 'happinessByCityId projection')}`;
const populationTick = nodes.find(node => ts.isExpressionStatement(node)
  && node.getStart(mainAst) > (happinessLoop?.end ?? 0)
  && node.getText(mainAst).startsWith('applyPostCentralPopulationGrowth({'));
const populationTickSource = exact(populationTick, 'central growth call');

let M;
(async () => {
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

  function runExactMainFragments(targetBonus) {
    globalThis.__pr141Profiles = {
      'fixture-target': { lud_wzrost_proc: 0, lud_spadek_proc: 0, lud_zdrowie_proc: 0, lud_zadowolenie_bazowe: targetBonus, lud_limit_populacji: 0 },
      'fixture-control': { lud_wzrost_proc: 0, lud_spadek_proc: 0, lud_zdrowie_proc: 0, lud_zadowolenie_bazowe: 0, lud_limit_populacji: 0 },
    };
    const cities = [11, 22].map(ownerId => ({
      id: `city-${ownerId}`, ownerId, q: ownerId, r: 0, name: `city-${ownerId}`,
      population: 6, poziomRacji: 4.5, rationMigratedV114: true,
      wzrostUlamkowy: 0.42, turyBezDoplaty: 0, hungerLossUlamkowy: 0,
    }));
    const ownerFixture = {
      _menuCivIdByOwner: new Map([[11, 'fixture-target']]),
      HUMAN_OWNER_PRIMARY: 11,
      player: { civType: 'fixture-target' },
      aiOwnerCivMap: new Map([[22, 'fixture-control']]),
      resolvePopulationMatrixForCiv: M.resolvePopulationMatrixForCiv,
    };
    const ownerSetupBody = transpileStatements(`
      ${ownerBindingSource}
      return { ownerCivMap, populationMatrixByOwnerId };
    `);
    const ownerSetup = new Function(...Object.keys(ownerFixture), ownerSetupBody);
    const { ownerCivMap, populationMatrixByOwnerId } = ownerSetup(...Object.values(ownerFixture));

    const rationParams = {
      racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
      racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
    };
    const data = { societyParams: society, buildings: [] };
    const cityBuilt = new Map(cities.map(city => [city.id, ['akwedukt']]));
    const econ = {
      perCity: cities.map(city => ({ cityId: city.id, ownerId: city.ownerId, oblegany: false, zdrowie: 20 })),
      growth: 0, starved: 0,
    };
    const lastEfTickResult = { perOwner: cities.map(city => ({
      perCityRows: [{ cityId: city.id }], fedByCityId: new Map([[city.id, true]]),
    })) };
    const cityStateSetup = new Function(transpileStatements(`${cityOrderStateDecl}; return cityOrderState;`));
    const cityOrderState = cityStateSetup();
    const op = M.loadOrderParams(society, 'normal');
    for (const city of cities) {
      const cid = city.id;
      const cityContext = {
        city, cid, cities, cityOrderState, populationMatrixByOwnerId, ownerCivMap,
        data, econ, cityBuilt, difficulty: 'normal', ownerEraForUpkeep: 1,
        sumBuildingHappinessFromBuiltIds: () => 0,
        buildingLevelForEpoch: () => 1,
        empireEpochForOwner: () => 1,
        unlockedTechSetForOwner: () => new Set(),
        evaluateOrderFromBreakdown: M.evaluateOrderFromBreakdown,
        applyCivMatrixHappinessModifier: M.applyCivMatrixHappinessModifier,
        civMatrixParam: M.civMatrixParam,
        shouldSuppressRevoltDuringPostCaptureLaw: () => false,
        applyPostCaptureLawOverride: value => value,
        haKult: 0, haRel: 0, haWealth: 0, haCuda: 0,
        podzial: { procentNauka: 60, procentPieniadz: 30, procentLuksus: 10 },
        ownerAtWar: false, cultureMixActive: false, ownCultureShare: 1,
        foreignReligionDominant: false, conquestUnstablePen: 0, stolicaBonus: 0,
        citizenUpkeep: { happinessDelta: 0, growthPctDelta: 0 },
        gCountLaw: 0, cityPalacTier: () => 0, conquestNoGarPen: 0,
        op, buntFlag: false, graceUpd: { graceTurnsLeft: null, revoltWarning: false },
      };
      const orderStep = new Function(...Object.keys(cityContext), transpileStatements(mainOrder));
      orderStep(...Object.values(cityContext));
    }

    const happinessContext = { cityOrderState };
    const happinessStepBody = transpileStatements(`${happinessProjection}; return happinessByCityId;`);
    const happinessStep = new Function(...Object.keys(happinessContext), happinessStepBody);
    const happinessByCityId = happinessStep(...Object.values(happinessContext));
    const tickContext = {
      applyPostCentralPopulationGrowth: M.applyPostCentralPopulationGrowth,
      cities, econ, lastEfTickResult, map: {}, territoryNodesForFood: [],
      excludeHexKeysByCityForGrowth: new Map(),
      buildEconParams: () => ({ akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 }),
      data, _menuDifficulty: 'normal', efParamsGrowth: { rationParams },
      ownerCivMap, manpowerMaxMultByOwnerId: new Map(), populationMatrixByOwnerId,
      // This happiness-focused fixture keeps the newly extracted Order growth input neutral.
      growthMultMap: new Map(cities.map(city => [city.id, 1])),
      spichlerzByCity: new Map(), happinessByCityId,
      citizenGrowthPctByCityId: new Map(), cityBuilt,
      empireEpochForOwner: () => 1, grownCityIdsForLiveRation: new Set(),
    };
    const tickStep = new Function(...Object.keys(tickContext), transpileStatements(populationTickSource));
    tickStep(...Object.values(tickContext));
    return {
      happinessByCityId: Object.fromEntries(happinessByCityId),
      orderByCityId: Object.fromEntries([...cityOrderState].map(([id, state]) => [id, state.szczescie])),
      cityByOwner: Object.fromEntries(cities.map(city => [city.ownerId, {
        population: city.population, frac: city.wzrostUlamkowy,
      }])),
    };
  }

  const baseline = runExactMainFragments(0);
  const perturbed = runExactMainFragments(20);
  let passed = 0;
  let failed = 0;
  function equal(actual, expected, message) {
    if (Object.is(actual, expected)) passed++;
    else { failed++; console.error(`FAIL: ${message}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
  }
  function check(condition, message, detail) {
    if (condition) passed++;
    else { failed++; console.error(`FAIL: ${message}: ${JSON.stringify(detail)}`); }
  }

  equal(baseline.orderByCityId['city-11'], baseline.happinessByCityId['city-11'], 'main order write equals main happiness projection for baseline target');
  equal(perturbed.orderByCityId['city-11'], perturbed.happinessByCityId['city-11'], 'main order write equals main happiness projection for perturbed target');
  check(perturbed.happinessByCityId['city-11'] > baseline.happinessByCityId['city-11'], 'target owner bonus reaches main happinessByCityId', { baseline, perturbed });
  check(perturbed.cityByOwner[11].frac !== baseline.cityByOwner[11].frac, 'target owner final population buffer changes after the exact main hookup and tick', { baseline, perturbed });
  equal(perturbed.happinessByCityId['city-22'], baseline.happinessByCityId['city-22'], 'foreign owner happiness projection is unchanged');
  equal(perturbed.cityByOwner[22].population, baseline.cityByOwner[22].population, 'foreign owner final population is unchanged');
  equal(perturbed.cityByOwner[22].frac, baseline.cityByOwner[22].frac, 'foreign owner final growth buffer is unchanged');

  fs.rmSync(TEMP, { recursive: true, force: true });
  console.log('main.ts extracted statements: owner mapping, order calculation, cityOrderState write, happiness projection, central tick');
  console.log('baseline/perturbed:', JSON.stringify({ baseline, perturbed }));
  console.log(`main happiness hookup: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch(error => {
  console.error(error.stack || error);
  fs.rmSync(TEMP, { recursive: true, force: true });
  process.exit(1);
});
