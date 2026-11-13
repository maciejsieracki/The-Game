'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.trade-routes-ownership-income-entry.ts');
const bundle = path.join(__dirname, '.trade-routes-ownership-income-bundle.cjs');
fs.writeFileSync(entry, `
export {
  DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
  loadTradeRouteIncomeParams,
  tradeRouteIncomeByDistance,
  tradeRouteIncomeForRoute,
  computeTradeRouteIncomeByCity,
  tradeRouteBuildingBonusForRoute,
} from '../src/game/trade-routes';
`, 'utf8');

(async () => {
  try {
    await esbuild.build({ entryPoints: [entry], outfile: bundle, bundle: true, platform: 'node', format: 'cjs' });
    const M = require(bundle);
    const p = M.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
    const raw = require('../data/econ-params.json');
    const loaded = M.loadTradeRouteIncomeParams(raw, 'normal');
    assert.deepStrictEqual([...loaded.dochodyLadowe], [...p.dochodyLadowe]);
    assert.deepStrictEqual([...loaded.dochodyMorskie], [...p.dochodyMorskie]);

    assert.deepStrictEqual([...p.dochodyLadowe], [1, 1, 2, 3, 3, 4, 4, 5, 6, 6, 7, 7, 8]);
    assert.strictEqual(M.tradeRouteIncomeByDistance(5, 'lad', p), 4);
    assert.strictEqual(M.tradeRouteIncomeByDistance(12, 'lad', p), 8);
    assert.strictEqual(M.tradeRouteIncomeByDistance(100, 'lad', p), 8);

    const internal = {
      id: 'internal', fromCityId: 'A', toCityId: 'B', ownerId: 0, toOwnerId: 0,
      medium: 'lad', dystans: 5, status: 'polaczony', budynekOdblokowany: true,
    };
    const international = {
      id: 'international', fromCityId: 'A', toCityId: 'C', ownerId: 0, toOwnerId: 1,
      medium: 'lad', dystans: 5, status: 'polaczony', budynekOdblokowany: true,
    };

    assert.strictEqual(M.tradeRouteIncomeForRoute(internal, p), 2, 'trasa wewnętrzna = ceil(4/2) = 2');
    assert.strictEqual(M.tradeRouteIncomeForRoute(international, p), 4, 'trasa zagraniczna = ceil((4*2)/2) = 4');

    const oddParams = { dochodyLadowe: [1, 3], dochodyMorskie: [1] };
    assert.strictEqual(M.tradeRouteIncomeForRoute({ ...internal, dystans: 1 }, oddParams), 2,
      'trasa wewnętrzna z nieparzystym starym dochodem 3 = ceil(3/2) = 2');
    assert.strictEqual(M.tradeRouteIncomeForRoute({ ...international, dystans: 1 }, oddParams), 3,
      'trasa zagraniczna z nieparzystą bazą: ceil((3*2)/2) = 3');

    const zeroParams = { dochodyLadowe: [0, 0], dochodyMorskie: [0] };
    assert.strictEqual(M.tradeRouteIncomeForRoute({ ...internal, dystans: 1 }, zeroParams), 0,
      'trasa wewnętrzna z zerowym starym dochodem pozostaje równa 0');
    assert.strictEqual(M.tradeRouteIncomeForRoute({ ...international, dystans: 1 }, zeroParams), 0,
      'trasa zagraniczna z zerowym starym dochodem pozostaje równa 0');

    const byCity = M.computeTradeRouteIncomeByCity([internal, international], p);
    assert.strictEqual(byCity.get('A'), 6, 'miasto A dostaje 2 z wewnętrznej + 4 z zagranicznej');
    assert.strictEqual(byCity.get('B'), 2, 'drugie własne miasto dostaje 2');
    assert.strictEqual(byCity.get('C'), 4, 'miasto obcej cywilizacji dostaje 4');

    assert.strictEqual(M.tradeRouteBuildingBonusForRoute(international, p), 0.2,
      '5% liczone od podwojonego, a następnie zmniejszonego dochodu 4');
    assert.strictEqual(M.tradeRouteBuildingBonusForRoute(internal, p), 0.1,
      '5% trasy wewnętrznej liczone od zmniejszonego dochodu 2');

    assert.strictEqual(M.computeTradeRouteIncomeByCity([], p).size, 0,
      'brak trasy nie tworzy żadnego dochodu ani wpisu miasta');

    console.log('trade-routes-ownership-income-test: 18 passed, 0 failed');
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    for (const file of [entry, bundle]) {
      try { fs.unlinkSync(file); } catch (_) { /* already absent */ }
    }
  }
})();
