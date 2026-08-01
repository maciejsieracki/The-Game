'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.battle-roster-entry.ts');
const OUT = path.join(os.tmpdir(), 'battle-roster-bundle-test.cjs');

fs.writeFileSync(
  ENTRY,
  [
    "export { collectBattleRoster, collectAtkRosterNearCity, shouldIncludeInBattleRoster } from '../src/units/battleRoster';",
    "export { collectCityDefRoster } from '../src/game/siegeDefenders';",
  ].join('\n'),
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  collectBattleRoster,
  collectAtkRosterNearCity,
  shouldIncludeInBattleRoster,
  collectCityDefRoster,
} = require(OUT);

let ok = 0;
let fail = 0;

function assert(c, msg) {
  if (c) {
    console.log('  [OK]', msg);
    ok++;
  } else {
    console.error('  [FAIL]', msg);
    fail++;
  }
}

const openCity = {
  id: 'c-open',
  ownerId: 1,
  q: 6,
  r: 0,
  name: 'Teby',
  maMur: false,
  population: 10,
  garnizon: 0,
};

const hastati = {
  id: 'u0',
  ownerId: 0,
  typeId: 'Hastati',
  category: 'miecznik',
  q: 5,
  r: 0,
  ruchLeft: 2,
  ruch: 2,
};
const ally = {
  id: 'u2',
  ownerId: 0,
  typeId: 'Lucznik',
  category: 'lucznik',
  q: 7,
  r: 0,
  ruchLeft: 2,
  ruch: 2,
};
const scoutNeighbor = {
  id: 'u-scout',
  ownerId: 0,
  typeId: 'Zwiadowca',
  category: 'zwiadowca',
  q: 6,
  r: 1,
  ruchLeft: 2,
  ruch: 3,
};
const garrison = {
  id: 'u1',
  ownerId: 1,
  typeId: 'Falanga',
  category: 'wlocznik',
  q: 6,
  r: 0,
  ruchLeft: 0,
  ruch: 2,
};

console.log('battle-roster-test (temp bundle)');

const fieldAlly = { ...ally, q: 4, r: 0 };
const fieldScout = { ...scoutNeighbor, q: 5, r: 1 };
const atkWithScout = collectBattleRoster(hastati, [hastati, fieldAlly, fieldScout], 'attacker');
assert(
  atkWithScout.length === 2 && !atkWithScout.some(u => u.typeId === 'Zwiadowca'),
  'atk roster: army 2 + adjacent scout excluded',
);

const atkNear = collectAtkRosterNearCity(openCity, hastati, [hastati, ally, scoutNeighbor]);
assert(
  atkNear.length === 2 && !atkNear.some(u => u.typeId === 'Zwiadowca'),
  'city atk roster: army 2 + adjacent scout excluded',
);

const cityScoutDef = {
  id: 'u-scout-def',
  ownerId: 1,
  typeId: 'Zwiadowca',
  category: 'zwiadowca',
  q: 6,
  r: 1,
  ruchLeft: 2,
  ruch: 3,
};
const defNearCity = collectCityDefRoster(openCity, [garrison, cityScoutDef]);
assert(
  defNearCity.roster.length === 1 && defNearCity.roster[0].typeId === 'Falanga',
  'def roster: adjacent defender scout excluded',
);

const defOnCityScout = { ...cityScoutDef, id: 'u-scout-city', q: 6, r: 0 };
const defCityScout = collectCityDefRoster(openCity, [garrison, defOnCityScout]);
assert(
  defCityScout.roster.length === 2,
  'def roster: scout ON city hex included',
);

assert(
  shouldIncludeInBattleRoster(scoutNeighbor, {
    side: 'attacker',
    anchor: hastati,
    battleHex: { q: 6, r: 0 },
  }) === false,
  'shouldInclude: neighbor scout not in atk battle',
);

const scoutWrongCat = {
  id: 'u-scout-badcat',
  ownerId: 0,
  typeId: 'Zwiadowca',
  category: 'domyslny',
  q: 6,
  r: 1,
  ruchLeft: 2,
  ruch: 3,
};
const atkBadCat = collectAtkRosterNearCity(openCity, hastati, [hastati, ally, scoutWrongCat]);
assert(
  atkBadCat.length === 2 && !atkBadCat.some(u => u.typeId === 'Zwiadowca'),
  'city atk roster: scout excluded even with wrong category (typeId fallback)',
);
assert(atkBadCat[0].id === hastati.id, 'city atk roster: anchor is always first');

console.log('---', ok, 'ok,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);
