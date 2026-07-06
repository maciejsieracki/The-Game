'use strict';
/**
 * siege-ai-test.cjs — C3-Q2 AI siege stance (3 tiers)
 * Run from gra/: node tools/siege-ai-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.siege-ai-entry.ts');
const BUNDLE = path.resolve(__dirname, '.siege-ai-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `
export {
  decideAISiegeStance,
  evaluateSiegeAiAction,
  estimateArmyStrength,
  estimateDefenderStrength,
  siegeStrengthRatio,
  SIEGE_AI_T1_ASSAULT_RATIO,
  SIEGE_AI_T2_BUILD_MIN_RATIO,
  SIEGE_AI_T3_STARVE_MIN_RATIO,
  EMPTY_SIEGE_AI_STATE,
} from '../src/game/siegeAi';
`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const M = require(BUNDLE);

let ok = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    console.log('  [OK]', msg);
    ok++;
  } else {
    console.error('  [FAIL]', msg);
    fail++;
  }
}

function warrior(hp = 17) {
  return {
    typNazwa: 'Wojownik',
    rola: 'Wrecz',
    Atak: 4,
    Obrona: 4,
    Uderzenie: 2,
    Pancerz: 2,
    Przebicie: 1,
    weaponDamage: 4,
    Health: hp,
  };
}

function strongUnit() {
  return {
    typNazwa: 'Legionista',
    rola: 'Wrecz',
    Atak: 18,
    Obrona: 14,
    Uderzenie: 8,
    Pancerz: 8,
    Przebicie: 2,
    weaponDamage: 18,
    Health: 80,
  };
}

function makeCity(overrides = {}) {
  return {
    id: 'c1',
    ownerId: 1,
    q: 5,
    r: 5,
    wallLevel: 0,
    garrison: [],
    population: 0,
    ...overrides,
  };
}

/** Pin thresholds so fixture ratio lands in desired tier band. */
function tierParams(army, city, tier) {
  const ratio = M.siegeStrengthRatio(army, city);
  if (tier === 'T1') {
    return { t1AssaultRatio: ratio - 0.01, t2BuildMinRatio: 0.5, t3StarveMinRatio: 0.5 };
  }
  if (tier === 'T2') {
    return {
      t1AssaultRatio: ratio + 0.5,
      t2BuildMinRatio: ratio - 0.01,
      t3StarveMinRatio: ratio - 1.0,
    };
  }
  if (tier === 'T3') {
    return {
      t1AssaultRatio: ratio + 0.5,
      t2BuildMinRatio: ratio + 0.1,
      t3StarveMinRatio: ratio - 0.01,
    };
  }
  // unsafe
  return {
    t1AssaultRatio: 99,
    t2BuildMinRatio: 99,
    t3StarveMinRatio: ratio + 0.01,
  };
}

console.log('siege-ai-test (C3-Q2)');

// --- T1: very strong army -> assault immediately ---
{
  const army = Array.from({ length: 8 }, () => strongUnit());
  const city = makeCity({ garrison: [warrior(5)] });
  const p = tierParams(army, city, 'T1');
  const d = M.decideAISiegeStance(army, city, M.EMPTY_SIEGE_AI_STATE, p);
  assert(d.tier === 'T1', 'T1 tier for overwhelming army');
  assert(d.stance === 'assault', 'T1 -> assault');
  assert(
    M.evaluateSiegeAiAction(army, city, M.EMPTY_SIEGE_AI_STATE, p) === 'assault',
    'evaluateSiegeAiAction alias returns assault for T1',
  );
}

// --- T2: medium army -> siege_build initially ---
{
  const army = [strongUnit(), warrior(30)];
  const city = makeCity({ garrison: [warrior(25)], wallLevel: 2, population: 5 });
  const p = tierParams(army, city, 'T2');
  const d0 = M.decideAISiegeStance(army, city, { siegeTurn: 0, machinesReady: 0 }, p);
  assert(d0.tier === 'T2', 'T2 tier');
  assert(d0.stance === 'siege_build', 'T2 initial -> siege_build');
}

// --- T2 ongoing: assault when >=1 machine ready ---
{
  const army = [strongUnit(), warrior(30)];
  const city = makeCity({ garrison: [warrior(25)], wallLevel: 2 });
  const p = tierParams(army, city, 'T2');
  const d1 = M.decideAISiegeStance(army, city, { siegeTurn: 2, machinesReady: 1 }, p);
  assert(d1.stance === 'assault', 'T2 with machine ready -> assault');
}

// --- T2 ongoing: assault after max wait turns ---
{
  const army = [strongUnit(), warrior(30)];
  const city = makeCity({ garrison: [warrior(25)], wallLevel: 2 });
  const p = tierParams(army, city, 'T2');
  const d2 = M.decideAISiegeStance(army, city, { siegeTurn: 99, machinesReady: 0 }, p);
  assert(d2.stance === 'assault', 'T2 timeout -> assault');
}

// --- T3: weak but safe -> siege_starve only (never assault with machines) ---
{
  const army = [warrior(30), warrior(30)];
  const city = makeCity({ garrison: [strongUnit(), strongUnit()], wallLevel: 3, population: 10 });
  const p = tierParams(army, city, 'T3');
  const d0 = M.decideAISiegeStance(army, city, { siegeTurn: 0, machinesReady: 0 }, p);
  assert(d0.tier === 'T3', 'T3 tier');
  assert(d0.stance === 'siege_starve', 'T3 initial -> siege_starve');
  const d1 = M.decideAISiegeStance(army, city, { siegeTurn: 10, machinesReady: 3 }, p);
  assert(d1.stance === 'siege_starve', 'T3 never assaults even with machines');
}

// --- unsafe: retreat below min safe ratio ---
{
  const army = [warrior(5)];
  const city = makeCity({ garrison: [strongUnit(), strongUnit(), strongUnit()], wallLevel: 5 });
  const p = tierParams(army, city, 'unsafe');
  const d = M.decideAISiegeStance(army, city, M.EMPTY_SIEGE_AI_STATE, p);
  assert(d.tier === 'unsafe', 'unsafe tier when too weak');
  assert(d.stance === 'retreat', 'unsafe -> retreat');
}

// --- default thresholds: documented constants ---
{
  assert(M.SIEGE_AI_T1_ASSAULT_RATIO === 1.8, 'T1 default 180%');
  assert(M.SIEGE_AI_T2_BUILD_MIN_RATIO === 1.4, 'T2 default 140%');
  assert(M.SIEGE_AI_T3_STARVE_MIN_RATIO === 1.1, 'T3 default 110%');
}

// --- C3-Q8 hint: machinesPerTurn scales with army size ---
{
  const small = M.decideAISiegeStance([warrior()], makeCity(), M.EMPTY_SIEGE_AI_STATE);
  const bigArmy = Array.from({ length: 25 }, () => warrior());
  const big = M.decideAISiegeStance(bigArmy, makeCity(), M.EMPTY_SIEGE_AI_STATE);
  assert(big.machinesPerTurn > small.machinesPerTurn, 'machinesPerTurn scales with army count');
}

// --- determinism ---
{
  const army = [strongUnit(), strongUnit()];
  const city = makeCity({ garrison: [warrior()] });
  const a = M.decideAISiegeStance(army, city);
  const b = M.decideAISiegeStance(army, city);
  assert(
    a.stance === b.stance && a.tier === b.tier && a.ratio === b.ratio,
    'same inputs -> identical decision',
  );
}

console.log('---', ok, 'ok,', fail, 'fail');
try {
  fs.unlinkSync(ENTRY);
} catch (e) {}
try {
  fs.unlinkSync(BUNDLE);
} catch (e) {}
process.exit(fail > 0 ? 1 : 0);
