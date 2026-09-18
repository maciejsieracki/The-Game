'use strict';
/**
 * militia-garrison-contract-test.cjs — R-MILITIA-GARRISON-Q1.
 * Bounded real-helper RED/GREEN contract for completed Garnizon militia.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'militia-garrison-contract-'));
const entry = path.join(tempDir, 'entry.ts');
const bundle = path.join(tempDir, 'bundle.cjs');

fs.writeFileSync(entry, `
export {
  MILITIA_POP_FRACTION,
  makeMilitia,
} from '${path.resolve(__dirname, '../src/game/siege').replace(/\\/g, '/')}';
export {
  canCaptureCityWithoutBattle,
  collectCityDefRoster,
  hasCityDefenders,
} from '${path.resolve(__dirname, '../src/game/siegeDefenders').replace(/\\/g, '/')}';
export {
  SAVE_VERSION,
  deserializeGame,
  serializeGame,
} from '${path.resolve(__dirname, '../src/game/save').replace(/\\/g, '/')}';
`, 'utf8');

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
  const completed = { completedBuildingIds: ['garnizon'], queuedBuildingIds: [] };
  const queued = { completedBuildingIds: [], queuedBuildingIds: ['garnizon'] };
  const city = {
    id: 'city-militia',
    ownerId: 1,
    q: 4,
    r: 7,
    name: 'Miasto',
    maMur: false,
    population: 9,
    garnizon: 0,
  };
  const regular = {
    id: 'regular-defender',
    ownerId: 1,
    typeId: 'Wojownik',
    category: 'miecznik',
    q: city.q,
    r: city.r,
    ruch: 2,
    ruchLeft: 0,
  };

  console.log('militia-garrison-contract-test');

  assert(
    !M.hasCityDefenders(city, [], { completedBuildingIds: [] }),
    'no Garnizon + population only -> no defenders',
  );
  assert(
    !M.hasCityDefenders(city, [], queued),
    'queued Garnizon alone -> no defenders',
  );
  assert(
    M.canCaptureCityWithoutBattle(city, [], queued),
    'queued Garnizon does not block empty-city capture',
  );

  const noMilitia = M.collectCityDefRoster(city, [], { completedBuildingIds: [] });
  assert(noMilitia.roster.length === 0, 'no completed Garnizon -> no virtual roster');

  const queuedRoster = M.collectCityDefRoster(city, [], queued);
  assert(queuedRoster.roster.length === 0, 'queued Garnizon -> no virtual roster');

  const completedRoster = M.collectCityDefRoster(city, [], completed);
  const virtual = completedRoster.roster[0];
  assert(
    completedRoster.roster.length === 1
      && virtual?.typeId === 'Milicja'
      && virtual?.isMilitia === true
      && virtual?.militiaCount === 1,
    'completed Garnizon -> one virtual Milicja with snapshot count and marker',
  );
  assert(
    completedRoster.militiaDefs.get('militia-city-militia')?.militiaCount === 1,
    'militia definition carries the same snapshot count',
  );
  assert(
    M.hasCityDefenders(city, [], completed)
      && !M.canCaptureCityWithoutBattle(city, [], completed),
    'completed Garnizon + eligible population blocks empty-city capture',
  );
  assert(city.population === 9, 'roster creation does not mutate population');

  const additionalRoster = M.collectCityDefRoster(city, [regular], completed);
  assert(
    additionalRoster.roster.length === 2
      && additionalRoster.roster[0].id === regular.id
      && additionalRoster.roster[1].isMilitia === true,
    'militia is additional to regular defenders',
  );

  const oldHealth = completedRoster.militiaDefs.get('militia-city-militia').health;
  city.population = 19;
  assert(
    completedRoster.militiaDefs.get('militia-city-militia').health === oldHealth
      && completedRoster.roster[0].militiaCount === 1,
    'existing battle snapshot stays stable after population changes',
  );
  const newRoster = M.collectCityDefRoster(city, [], completed);
  assert(newRoster.roster[0].militiaCount === 3, 'new roster takes a new population snapshot');

  const oddWarrior = {
    Atak: 5,
    Obrona: 3,
    Uderzenie: 1,
    Pancerz: 5,
    Przebicie: 3,
    weaponDamage: 7,
    Health: 5,
  };
  const oddMilitia = M.makeMilitia(15, 0.2, 0.5, oddWarrior);
  assert(oddMilitia?.militiaCount === 3, 'odd population uses floor(population × 20%)');
  assert(
    oddMilitia
      && oddMilitia.Atak === 3
      && oddMilitia.Obrona === 2
      && oddMilitia.Uderzenie === 1
      && oddMilitia.Pancerz === 3
      && oddMilitia.Przebicie === 2
      && oddMilitia.weaponDamage === 4
      && oddMilitia.Health === 9,
    'every Warrior combat parameter uses round-half-up at 50%',
  );
  assert(M.makeMilitia(0) === null, 'zero population produces no militia');

  const save = {
    wersja: M.SAVE_VERSION,
    tura: 11,
    seed: 7,
    units: [],
    cities: [{ ...city, population: 19, garnizon: 0 }],
    exploredByHuman: [],
    gracze: [],
    humanOwnerIds: [0],
    activeHumanOwnerId: 0,
    cityBuilt: { 'city-militia': ['garnizon'] },
    meta: { battleResult: { winner: 'obronca', militiaCount: 3 } },
  };
  const loaded = M.deserializeGame(M.serializeGame(save));
  assert(
    loaded.cities[0].population === 19
      && loaded.cityBuilt['city-militia'][0] === 'garnizon'
      && loaded.meta.battleResult.militiaCount === 3,
    'save/load preserves Garnizon, population, and battle state',
  );

  console.log('---', ok, 'ok,', fail, 'fail');
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
