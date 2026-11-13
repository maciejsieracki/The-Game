'use strict';
/**
 * civ-matrix-difficulty-test.cjs — Q1 real consumer regression.
 * Run: cd gra && node tools/civ-matrix-difficulty-test.cjs
 *
 * Verifies the only matrix row currently classified REAL_GAMEPLAY:
 * `lud_wzrost_proc` in population-growth-v85.ts. The test covers both the
 * pure breakdown and the post-central production path that mutates the live
 * city/tick state. UI-only/dead matrix fields are intentionally not imported.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.civ-matrix-difficulty-entry.ts');
const BUNDLE = path.resolve(__dirname, '.civ-matrix-difficulty-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  applyPostCentralPopulationGrowth,
  buildRationParams,
  computeGrowthPercentV85,
  CIV_MATRIX_GROWTH_DIFFICULTY_MULT,
} from '../src/game/population-growth-v85';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[civ-matrix-difficulty-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');
const rationParams = M.buildRationParams(society, 'normal');
let passed = 0;
let failed = 0;

function eq(got, want, msg) {
  if (got === want) {
    passed++;
    console.log('PASS:', msg);
  } else {
    failed++;
    console.error('FAIL:', msg, 'got=' + got, 'want=' + want);
  }
}
function ok(condition, msg) {
  if (condition) {
    passed++;
    console.log('PASS:', msg);
  } else {
    failed++;
    console.error('FAIL:', msg);
  }
}
function growthBreakdown(civKey, difficulty) {
  return M.computeGrowthPercentV85({
    population: 3,
    poziomRacji: 4,
    zdrowie: 0,
    szczescieNetto: 0,
    wealthPoziom: 1,
    spichlerzState: {
      ceramikaActive: false,
      solActive: false,
      maSpichlerzPop: false,
      maSpichlerzIIPop: false,
    },
    civKey,
    difficulty,
    rationParams,
  });
}

console.log('\n[civ-matrix-difficulty-test]\n');
console.log('--- declared consumer scale ---');
eq(M.CIV_MATRIX_GROWTH_DIFFICULTY_MULT.easy, 0.5, 'Easy coefficient is ×0.50');
eq(M.CIV_MATRIX_GROWTH_DIFFICULTY_MULT.normal, 1, 'Normal coefficient is ×1.00');
eq(M.CIV_MATRIX_GROWTH_DIFFICULTY_MULT.hard, 1.5, 'Hard coefficient is ×1.50');

console.log('--- pure REAL_GAMEPLAY consumer ---');
const easy = growthBreakdown('chinczycy', 'easy');
const normal = growthBreakdown('chinczycy', 'normal');
const hard = growthBreakdown('chinczycy', 'hard');
eq(easy.cywilizacja, 3, 'Easy: China +0.05 becomes +3 p.p.');
eq(normal.cywilizacja, 5, 'Normal: China +0.05 remains +5 p.p.');
eq(hard.cywilizacja, 8, 'Hard: China +0.05 becomes +8 p.p.');
ok(easy.cywilizacja < normal.cywilizacja && normal.cywilizacja < hard.cywilizacja,
  'positive matrix contribution is monotonic Easy < Normal < Hard');
const negativeEasy = growthBreakdown('zulusi', 'easy');
const negativeNormal = growthBreakdown('zulusi', 'normal');
const negativeHard = growthBreakdown('zulusi', 'hard');
ok(negativeEasy.cywilizacja > negativeNormal.cywilizacja
  && negativeNormal.cywilizacja > negativeHard.cywilizacja,
'negative matrix contribution is monotonic in gameplay direction');
const neutralEasy = growthBreakdown('grecy', 'easy');
const neutralNormal = growthBreakdown('grecy', 'normal');
const neutralHard = growthBreakdown('grecy', 'hard');
eq(neutralEasy.cywilizacja, 0, 'Greece neutral row remains 0 p.p. on Easy');
eq(neutralNormal.cywilizacja, 0, 'Greece neutral row remains 0 p.p. on Normal');
eq(neutralHard.cywilizacja, 0, 'Greece neutral row remains 0 p.p. on Hard');

console.log('--- post-central production path ---');
function runPostCentral(difficulty) {
  const city = {
    id: 'difficulty-city', ownerId: 0, q: 0, r: 0, name: 'Difficulty',
    population: 3, poziomRacji: 4, wzrostUlamkowy: 0,
  };
  const tick = {
    cityId: city.id, ownerId: 0, oblegany: false, zdrowie: 0,
    spichlerzCeramika: false, spichlerzSol: false,
  };
  const efResult = {
    perOwner: [{
      ownerId: 0,
      perCityRows: [{ cityId: city.id, ownerId: 0 }],
      fedByCityId: new Map([[city.id, true]]),
    }],
  };
  M.applyPostCentralPopulationGrowth({
    cities: [city],
    econ: { perCity: [tick], growth: 0, starved: 0 },
    efResult,
    map: { hexes: {} },
    territoryNodes: [],
    econParams: {
      akweduktProgLudnosci: 4,
      spichlerzProgLudnosci: 8,
      akweduktMaxLudnosci: 12,
    },
    rationParams,
    difficulty,
    ownerCivByOwnerId: new Map([[0, 'chinczycy']]),
    builtByCity: new Map([[city.id, []]]),
  });
  return { growth: tick.wzrostProcent, fractional: city.wzrostUlamkowy };
}
const postEasy = runPostCentral('easy');
const postNormal = runPostCentral('normal');
const postHard = runPostCentral('hard');
eq(postEasy.growth, 10.5, 'production Easy applies +3 p.p. matrix contribution');
eq(postNormal.growth, 12.5, 'production Normal applies +5 p.p. matrix contribution');
eq(postHard.growth, 15.5, 'production Hard applies +8 p.p. matrix contribution');
ok(postEasy.fractional < postNormal.fractional && postNormal.fractional < postHard.fractional,
  'production fractional growth is monotonic Easy < Normal < Hard');

const equivalent = postNormal.growth === normal.total;
ok(equivalent, 'production Normal total equals pure consumer total');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);