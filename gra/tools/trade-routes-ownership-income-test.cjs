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

    assert.strictEqual(M.tradeRouteIncomeForRoute(internal, p), 4, 'trasa wewnętrzna = faktyczna baza 4');
    assert.strictEqual(M.tradeRouteIncomeForRoute(international, p), 8, 'trasa zagraniczna = +100%: 8');

    const byCity = M.computeTradeRouteIncomeByCity([internal, international], p);
    assert.strictEqual(byCity.get('A'), 12, 'miasto A dostaje 4 z wewnętrznej + 8 z zagranicznej');
    assert.strictEqual(byCity.get('B'), 4, 'drugie własne miasto dostaje 4');
    assert.strictEqual(byCity.get('C'), 8, 'miasto obcej cywilizacji dostaje 8');

    assert.strictEqual(M.tradeRouteBuildingBonusForRoute(international, p), 0.4,
      '5% liczone od podwojonego dochodu 8');
    assert.strictEqual(M.tradeRouteBuildingBonusForRoute(internal, p), 0.2,
      '5% trasy wewnętrznej liczone od 4');

    console.log('trade-routes-ownership-income-test: 10 passed, 0 failed');
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    for (const file of [entry, bundle]) {
      try { fs.unlinkSync(file); } catch (_) { /* already absent */ }
    }
  }
})();
