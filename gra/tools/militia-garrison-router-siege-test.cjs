'use strict';
/**
 * militia-garrison-router-siege-test.cjs — R-MILITIA-GARRISON-Q1.
 * Focused integration contract for the map router and low-level siege gate.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'militia-garrison-router-siege-'));
const entry = path.join(tempDir, 'entry.ts');
const bundle = path.join(tempDir, 'bundle.cjs');
const routerSource = path.resolve(__dirname, '../src/map/map-attack-city').replace(/\\/g, '/');
const siegeSource = path.resolve(__dirname, '../src/game/siege').replace(/\\/g, '/');

fs.writeFileSync(
  entry,
  [
    `export { resolveEnemyCityClick } from '${routerSource}';`,
    `export { effectiveGarrison, resolveSiegeAttack } from '${siegeSource}';`,
  ].join('\n'),
  'utf8',
);

let ok = 0;
let fail = 0;
function assert(condition, message) {
  if (condition) {
    console.log('  [OK]', message);
    ok++;
  } else {
    console.error('  [FAIL]', message);
    fail++;
  }
}

function mapAttacker(city) {
  return {
    id: 'attacker',
    ownerId: 0,
    typeId: 'Wojownik',
    category: 'miecznik',
    q: city.q - 1,
    r: city.r,
    ruch: 2,
    ruchLeft: 1,
  };
}

function siegeAttacker() {
  return {
    typNazwa: 'Wojownik',
    rola: 'Wrecz',
    Atak: 4,
    Obrona: 4,
    Uderzenie: 2,
    Pancerz: 2,
    Przebicie: 1,
    weaponDamage: 4,
    Health: 17,
    progDezercji: 0.4,
  };
}

function siegeCity(overrides = {}) {
  return {
    id: 'city-siege',
    ownerId: 1,
    q: 4,
    r: 7,
    wallLevel: 0,
    garrison: [],
    population: 9,
    ...overrides,
  };
}

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: bundle,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
  });

  const M = require(bundle);
  const city = {
    id: 'city-router',
    ownerId: 1,
    q: 4,
    r: 7,
    name: 'Miasto',
    maMur: false,
    population: 9,
    garnizon: 0,
  };
  const attacker = mapAttacker(city);
  const baseRouterInput = {
    city,
    selectedUnit: attacker,
    units: [attacker],
    playerOwnerId: 0,
  };

  console.log('militia-garrison-router-siege-test');

  const completedAction = M.resolveEnemyCityClick({
    ...baseRouterInput,
    getCompletedBuildingIds: () => ['garnizon'],
  });
  assert(
    completedAction.kind === 'field_battle',
    'router + completed Garnizon -> virtual-militia battle, not capture_empty',
  );

  const noBuildingAction = M.resolveEnemyCityClick({
    ...baseRouterInput,
    getCompletedBuildingIds: () => [],
  });
  assert(
    noBuildingAction.kind === 'capture_empty',
    'router + no completed building -> capture_empty',
  );

  const queuedAction = M.resolveEnemyCityClick({
    ...baseRouterInput,
    city: { ...city, queuedBuildingIds: ['garnizon'] },
    getCompletedBuildingIds: () => [],
  });
  assert(
    queuedAction.kind === 'capture_empty',
    'router + queued-only Garnizon -> capture_empty',
  );

  const noBuildingCity = siegeCity({ completedBuildingIds: [], queuedBuildingIds: ['garnizon'] });
  const noBuildingGarrison = M.effectiveGarrison(noBuildingCity);
  assert(
    noBuildingGarrison.length === 0,
    'low-level effectiveGarrison + no/queued Garnizon -> no virtual militia',
  );

  const noBuildingResult = M.resolveSiegeAttack(
    siegeAttacker(),
    noBuildingCity,
    { rng: () => 0.99 },
  );
  assert(
    noBuildingResult.engagedDefender === null && noBuildingResult.rounds === 0,
    'low-level resolver + no/queued Garnizon -> immediate undefended result',
  );

  const completedCity = siegeCity({ completedBuildingIds: ['garnizon'] });
  const completedGarrison = M.effectiveGarrison(completedCity);
  assert(
    completedGarrison.length === 1
      && completedGarrison[0].isMilitia === true
      && completedGarrison[0].militiaCount === 1,
    'low-level effectiveGarrison + completed Garnizon -> snapshot militia',
  );

  const completedResult = M.resolveSiegeAttack(
    siegeAttacker(),
    completedCity,
    { rng: () => 0.99 },
  );
  assert(
    completedResult.engagedDefender?.isMilitia === true
      && completedResult.engagedDefender.militiaCount === 1
      && completedResult.rounds > 0,
    'low-level resolver + completed Garnizon -> engages virtual militia',
  );

  const overrideResult = M.resolveSiegeAttack(
    siegeAttacker(),
    siegeCity(),
    { completedBuildingIds: ['garnizon'], rng: () => 0.99 },
  );
  assert(
    overrideResult.engagedDefender?.isMilitia === true,
    'low-level resolver accepts completed-building adapter override',
  );

  console.log('---', ok, 'ok,', fail, 'fail');
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
