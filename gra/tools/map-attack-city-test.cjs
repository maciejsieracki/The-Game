'use strict';
/** map-attack-city-test.cjs — routing F-P1-01 (map-attack-city.ts) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.map-attack-city-entry.ts');
const OUT = path.join(__dirname, '.map-attack-city-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { resolveEnemyCityClick } from '../src/map/map-attack-city';\n`,
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

const { resolveEnemyCityClick } = require(OUT);
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

const walledEnemy = {
  id: 'c1',
  ownerId: 1,
  q: 5,
  r: 0,
  name: 'Ateny',
  maMur: true,
  population: 3,
};
const openEnemy = {
  id: 'c2',
  ownerId: 1,
  q: 6,
  r: 0,
  name: 'Sparta',
  maMur: false,
  population: 2,
};
const playerCity = {
  id: 'c0',
  ownerId: 0,
  q: 0,
  r: 0,
  name: 'Rzym',
  maMur: true,
  population: 3,
};
const hastati = {
  id: 'u0',
  ownerId: 0,
  typeId: 'Hastati',
  q: 4,
  r: 0,
  ruchLeft: 2,
  ruch: 2,
};
const archer = {
  id: 'u2',
  ownerId: 0,
  typeId: 'Lucznik',
  q: 4,
  r: 1,
  ruchLeft: 2,
  ruch: 2,
};
const garrison = {
  id: 'u1',
  ownerId: 1,
  typeId: 'Falanga',
  q: 5,
  r: 0,
  ruchLeft: 0,
  ruch: 2,
};

console.log('map-attack-city-test');

const own = resolveEnemyCityClick({
  city: playerCity,
  selectedUnit: null,
  units: [hastati],
});
assert(own.kind === 'not_enemy', 'own city → not_enemy');

const walledChoice = resolveEnemyCityClick({
  city: walledEnemy,
  selectedUnit: hastati,
  units: [hastati, garrison],
});
assert(walledChoice.kind === 'attack_choice', 'walled + adjacent sel → attack_choice');

const hiddenCity = resolveEnemyCityClick({
  city: walledEnemy,
  selectedUnit: hastati,
  units: [hastati, garrison],
  isCityVisible: () => false,
});
assert(
  hiddenCity.kind === 'hint_city_not_visible',
  'hidden enemy city + adjacent sel → no attack/siege action',
);

const walledAuto = resolveEnemyCityClick({
  city: walledEnemy,
  selectedUnit: null,
  units: [hastati, garrison],
});
assert(walledAuto.kind === 'attack_choice', 'walled + single adjacent → attack_choice');

const walledHint = resolveEnemyCityClick({
  city: walledEnemy,
  selectedUnit: null,
  units: [hastati, archer, garrison],
});
assert(walledHint.kind === 'hint_pick_attacker', 'walled + 2 adjacent → hint_pick_attacker');

const noAdj = resolveEnemyCityClick({
  city: walledEnemy,
  selectedUnit: null,
  units: [{ ...hastati, q: 2, r: 0 }],
});
assert(noAdj.kind === 'hint_no_adjacent', 'no adjacent → hint_no_adjacent');

const openEmpty = resolveEnemyCityClick({
  city: { ...openEnemy, q: 7, r: 0 },
  selectedUnit: { ...hastati, q: 6, r: 0 },
  units: [{ ...hastati, q: 6, r: 0 }],
});
assert(openEmpty.kind === 'capture_empty', 'open city no defenders → capture_empty');

const openBattle = resolveEnemyCityClick({
  city: openEnemy,
  selectedUnit: { ...hastati, q: 5, r: 0 },
  units: [
    { ...hastati, q: 5, r: 0 },
    { ...garrison, q: 6, r: 0 },
  ],
});
assert(openBattle.kind === 'field_battle', 'open city + defenders → field_battle');

const siegePanel = resolveEnemyCityClick({
  city: { ...walledEnemy, oblegane: true },
  selectedUnit: null,
  units: [hastati, garrison],
});
assert(siegePanel.kind === 'siege_panel', 'oblegane → siege_panel');

console.log('---', ok, 'ok,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);
