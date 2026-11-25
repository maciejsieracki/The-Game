'use strict';
// R5: monotonia gęstości świata — metryki i sumy jak w gra/tools/world-density-test.cjs (linie 48-72, 104-142).
// Sumy po 5 ziarnach dla tierów low/medium/high: złoża, rzeki, pustynia, las, góry+wzgórza.
const M = require('./bundle.cjs')('r5', `
export { generujSwiat } from '../src/map/generator';
export { resolveWorldGenNumbers, DEFAULT_WORLD_DENSITY } from '../src/map/newGameMapDefaults';
export { mapGenResourceMult } from '../src/data/map-gen-params-loader';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`);
const preset = (resources, rivers, desert, forest, relief = 'medium') => ({ resources, rivers, desert, forest, relief });
const genOpts = (p) => ({ worldDensity: p, mapSizeMenuLabel: 'Mały' });
// Definicje zgodne z gra/tools/world-density-test.cjs (countDeposits/countForest/countTerrain, linie 48-72):
// złoże = pole `zloze` albo nakładka inna niż Brak i Las; las = NAKŁADKA Las (nie typ terenu).
const countDeposits = (m) => Object.values(m.hexes).filter((h) => h.zloze || (h.nakladka !== M.Nakladka.Brak && h.nakladka !== M.Nakladka.Las)).length;
const countRiverPaths = (m) => (m.riverPaths ?? []).length;
const countTerrain = (m, t) => Object.values(m.hexes).filter((h) => h.terenBazowy === t).length;
const countForest = (m) => Object.values(m.hexes).filter((h) => h.nakladka === M.Nakladka.Las).length;
const seeds = [1, 7, 42, 99, 2026];
const S = { depLow: 0, depMed: 0, depHigh: 0, rivLow: 0, rivMed: 0, rivHigh: 0, desLow: 0, desMed: 0, desHigh: 0, forLow: 0, forMed: 0, forHigh: 0, mtnLow: 0, mtnMed: 0, mtnHigh: 0 };
const perSeed = [];
for (const seed of seeds) {
  const low = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('low', 'low', 'low', 'low', 'medium')));
  const med = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('medium', 'medium', 'medium', 'medium', 'medium')));
  const high = M.generujSwiat(seed, 'maly', 'kontynenty', genOpts(preset('high', 'high', 'high', 'high', 'medium')));
  const row = {
    seed,
    dep: [countDeposits(low), countDeposits(med), countDeposits(high)],
    riv: [countRiverPaths(low), countRiverPaths(med), countRiverPaths(high)],
    des: [countTerrain(low, M.TerenBazowy.Pustynia), countTerrain(med, M.TerenBazowy.Pustynia), countTerrain(high, M.TerenBazowy.Pustynia)],
    for: [countForest(low), countForest(med), countForest(high)],
  };
  perSeed.push(row);
  S.depLow += row.dep[0]; S.depMed += row.dep[1]; S.depHigh += row.dep[2];
  S.rivLow += row.riv[0]; S.rivMed += row.riv[1]; S.rivHigh += row.riv[2];
  S.desLow += row.des[0]; S.desMed += row.des[1]; S.desHigh += row.des[2];
  S.forLow += row.for[0]; S.forMed += row.for[1]; S.forHigh += row.for[2];
}
const monoRiv = S.rivLow <= S.rivMed && S.rivMed <= S.rivHigh;
const monoDes = S.desLow <= S.desMed && S.desMed <= S.desHigh;
const monoDep = S.depLow <= S.depMed && S.depMed <= S.depHigh;
const monoFor = S.forLow <= S.forMed && S.forMed <= S.forHigh;
console.log(JSON.stringify({ perSeed }));
console.log(JSON.stringify({ S, monoDep, monoRiv, monoDes, monoFor }));
