'use strict';
/** map-field-battle-test.cjs — F-P1-01 lane C (mapFieldBattle + rosters) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.map-field-battle-entry.ts');
const OUT = path.join(__dirname, '.map-field-battle-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  [
    "export { collectBattleRoster, collectAtkRosterNearCity } from '../src/units/battleRoster';",
    "export { collectCityDefRoster, defenderSideTitle, hasCityDefenders } from '../src/game/siegeDefenders';",
    "export { validateOpenCityFieldBattle, planOpenCityFieldBattle } from '../src/battle/mapFieldBattle';",
    "export { resolveEnemyCityClick } from '../src/map/map-attack-city';",
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
  collectCityDefRoster,
  defenderSideTitle,
  hasCityDefenders,
  validateOpenCityFieldBattle,
  planOpenCityFieldBattle,
  resolveEnemyCityClick,
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
  name: 'Sparta',
  maMur: false,
  population: 10,
  garnizon: 0,
};
const walledCity = { ...openCity, id: 'c-wall', maMur: true };
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
  q: 5,
  r: 1,
  ruchLeft: 2,
  ruch: 2,
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

const stubDef = () => ({
  meleeAttack: 8,
  meleeDefence: 7,
  weaponDamage: 8,
  armor: 4,
  piercing: 2,
  chargeBonus: 4,
  health: 20,
  missileAttack: 0,
  'Rola (linia)': 'Wrecz',
});

console.log('map-field-battle-test');

const atkR = collectBattleRoster(hastati, [hastati, ally, garrison]);
assert(atkR.length === 2 && atkR.every(u => u.ownerId === 0), 'collectBattleRoster: 2 allies dist<=1');

const atkNear = collectAtkRosterNearCity(openCity, hastati, [hastati, ally]);
assert(atkNear.length === 2, 'collectAtkRosterNearCity: adjacent to city');

assert(!hasCityDefenders({ ...openCity, garnizon: 0 }, []), 'empty city no defenders');
assert(hasCityDefenders(openCity, [garrison]), 'garrison unit = defenders');

const emptyDef = collectCityDefRoster({ ...openCity, garnizon: 0 }, []);
assert(emptyDef.roster.length === 0, 'collectCityDefRoster: no garrison no units');

const milDef = collectCityDefRoster({ ...openCity, garnizon: 3 }, []);
assert(milDef.roster.length === 1 && milDef.roster[0].typeId === 'Milicja', 'collectCityDefRoster: militia synth');
assert(milDef.militiaDefs.has('militia-c-open'), 'collectCityDefRoster: militia def map');

const milTitle = defenderSideTitle(openCity, milDef.roster);
assert(milTitle.startsWith('Milicja'), 'defenderSideTitle: militia label');

assert(validateOpenCityFieldBattle(walledCity, hastati) !== null, 'validate: walled rejected');
assert(validateOpenCityFieldBattle(openCity, hastati) === null, 'validate: open OK');

const plan = planOpenCityFieldBattle(
  { attacker: hastati, ctx: { tryb: 'bitwa_polowa', city: openCity, atakujacy: hastati, garnizonUnit: garrison, oblegajacyOwnerId: 0 } },
  openCity,
  hastati,
  [hastati, garrison],
  {
    turn: 3,
    getTerrainAt: () => 'Rownina',
    getStructBonus: () => 0,
    unitDefFor: stubDef,
    unitHealth: d => d.health,
    unitAtak: d => d.meleeAttack,
    civLabelForOwner: id => (id === 0 ? 'Gracz' : 'AI ' + id),
    terrainCombatData: [],
  },
);
assert(plan !== null && plan.preBattle.miejsce === 'Sparta', 'planOpenCityFieldBattle: miejsce = city name');
assert(plan.preBattle.canRetreat === true, 'planOpenCityFieldBattle: canRetreat');
assert(!plan.preBattle.miejsce.includes('mur'), 'planOpenCityFieldBattle: no mur suffix');
assert(plan.defRoster.length === 1, 'planOpenCityFieldBattle: def roster');

const router = resolveEnemyCityClick({
  city: openCity,
  selectedUnit: hastati,
  units: [hastati, garrison],
});
assert(router.kind === 'field_battle', 'router integration: open + defenders → field_battle');

console.log('---', ok, 'ok,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);
