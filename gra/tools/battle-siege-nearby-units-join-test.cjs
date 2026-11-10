'use strict';

/** R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 — coalition eligibility + siege roster wiring. */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const gra = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'battle-siege-nearby-'));
const entry = path.join(work, 'entry.ts');
const bundle = path.join(work, 'bundle.cjs');
fs.writeFileSync(entry, `
export { siegeBattleSideOwners } from ${JSON.stringify(path.join(gra, 'src/game/diplomacy-siege-war-gate'))};
export { collectAtkRosterNearCity } from ${JSON.stringify(path.join(gra, 'src/units/battleRoster'))};
export { collectCityDefRoster } from ${JSON.stringify(path.join(gra, 'src/game/siegeDefenders'))};
export { battleReserveNotice } from ${JSON.stringify(path.join(gra, 'src/game/post-battle-map'))};
export { buildBattleEventLog } from ${JSON.stringify(path.join(gra, 'src/units/battleRoster'))};
export { battleUnitCivBonusy, battleUnitDifficultyCombatMult } from ${JSON.stringify(path.join(gra, 'src/battle/battle-unit-context'))};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: gra, logLevel: 'silent',
});
const api = require(bundle);
const main = fs.readFileSync(path.join(gra, 'src/main.ts'), 'utf8');
const battleScene = fs.readFileSync(path.join(gra, 'src/battle/battleScene.ts'), 'utf8');
let pass = 0;
const check = (name, fn) => { fn(); pass += 1; console.log('[OK]', name); };
const unit = (id, ownerId, q, r, typeId = 'Wojownik', category = 'miecznik') => ({
  id, ownerId, q, r, typeId, category, ruch: 2, ruchLeft: 2,
});
const city = { id: 'siege-city', ownerId: 2, q: 0, r: 0, population: 0, garnizon: 0 };
const relations = new Set(['1|2', '1|4', '2|3', '1|5', '2|6', '1|7', '2|7']);
const areEnemies = (a, b) => a !== b && (a === -1 || b === -1 || relations.has(`${Math.min(a, b)}|${Math.max(a, b)}`));
const alliances = new Set(['1|3', '2|4', '1|7', '2|7']);
const hasAlliance = (a, b) => alliances.has(`${Math.min(a, b)}|${Math.max(a, b)}`);
const sideOwners = api.siegeBattleSideOwners(1, 2, [1, 2, 3, 4, 5, 6, 7, -1], areEnemies, hasAlliance);

check('side membership: principals and formal allies already in this war join the correct side', () => {
  assert.deepStrictEqual([...sideOwners.attacker].sort((a, b) => a - b), [1, 3]);
  assert.deepStrictEqual([...sideOwners.defender].sort((a, b) => a - b), [2, 4]);
});
check('side membership: enemy-of-city without alliance, peaceful ally, and barbarian hostile to both stay out', () => {
  for (const id of [5, 6, 7, -1]) {
    assert.strictEqual(sideOwners.attacker.has(id), false, `owner ${id} not attacker`);
    assert.strictEqual(sideOwners.defender.has(id), false, `owner ${id} not defender`);
  }
});
check('side membership: no siege war means no participants on either side', () => {
  const none = api.siegeBattleSideOwners(1, 2, [1, 2, 3], () => false, () => true);
  assert.strictEqual(none.attacker.size, 0);
  assert.strictEqual(none.defender.size, 0);
});
check('side membership: contradictory dual-alliance third owner is not duplicated', () => {
  const both = api.siegeBattleSideOwners(1, 2, [1, 2, 8], areEnemies, () => true);
  assert.strictEqual(both.attacker.has(8), false);
  assert.strictEqual(both.defender.has(8), false);
});

const units = [
  unit('atk-anchor', 1, 1, 0),
  unit('atk-ally', 3, -1, 1),
  unit('atk-own-neighbor', 1, 0, 1),
  unit('atk-independent-enemy', 5, 1, -1),
  unit('atk-peaceful-ally', 6, -1, 0),
  unit('def-ally', 4, 0, -1),
  unit('def-garrison', 2, 0, 0),
  unit('def-neighbor', 2, -1, 0),
  unit('neutral', 9, 1, 1),
  unit('too-far', 3, 2, 0),
  unit('adjacent-civilian', 3, 1, 1, 'Osadnik', 'osadnik'),
  unit('city-civilian', 2, 0, 0, 'Robotnik', 'robotnik'),
];
const atk = api.collectAtkRosterNearCity(city, units[0], units, sideOwners.attacker);
const def = api.collectCityDefRoster(city, units, { allowedOwnerIds: sideOwners.defender }).roster;
check('attacker roster contains eligible principal and ally units at city+six neighbors; anchor first', () => {
  assert.deepStrictEqual(atk.map(u => u.id), ['atk-anchor', 'atk-own-neighbor', 'atk-ally']);
});
check('defender roster contains eligible principal and ally units, city-center civilian only', () => {
  assert.deepStrictEqual(def.map(u => u.id), ['def-garrison', 'def-neighbor', 'city-civilian', 'def-ally']);
});
check('both rosters exclude neutral, independent enemy, distance 2, and adjacent civilian units', () => {
  const included = new Set([...atk, ...def].map(u => u.id));
  for (const id of ['atk-independent-enemy', 'atk-peaceful-ally', 'neutral', 'too-far', 'adjacent-civilian']) {
    assert.strictEqual(included.has(id), false, `${id} excluded`);
  }
});

check('manual reserve notice uses current 500 limit and reports the player coalition reserve', () => {
  assert.match(battleScene, /const MAX_PER_SIDE = 500;/);
  assert.match(api.battleReserveNotice(503, 502, 500, 'atk'), /3 jednostek w rezerwie/);
});
check('manual scene event IDs are the only participants counted for reserve losses and victory progress', () => {
  const log = api.buildBattleEventLog(atk.slice(0, 2), def.slice(0, 2));
  assert.deepStrictEqual(log.attackerUnitIds, ['atk-anchor', 'atk-own-neighbor']);
  assert.deepStrictEqual(log.defenderUnitIds, ['def-garrison', 'def-neighbor']);
  const postBattle = fs.readFileSync(path.join(gra, 'src/game/post-battle-map.ts'), 'utf8');
  assert.match(postBattle, /if \(logged && !logged\.has\(String\(ref\.id\)\)\) continue;/);
  assert.match(main, /battleEventLog: res\.eventLog \?\? buildBattleEventLog\(atkRoster, defRoster\)/);
  assert.match(main, /m\.set\(u\.ownerId, \(m\.get\(u\.ownerId\) \?\? 0\) \+ 1\)/);
  assert.match(main, /deadByOwnerOf\(atkRoster\), deadByOwnerOf\(defRoster\)/);
});
check('siege manual/auto/silent and AI stance consumers share the coalition roster builders', () => {
  assert.match(main, /function collectSiegeAtkRoster\(city: City, anchor: RuntimeUnit\): RuntimeUnit\[\]/);
  assert.match(main, /function collectSiegeDefRoster\(city: City, besiegerOwnerId: number\): RuntimeUnit\[\]/);
  assert.match(main, /const defRoster = collectSiegeDefRoster\(city, anchor\.ownerId\);/);
  assert.match(main, /const siegeArmy = atkUnits\.map\(runtimeUnitToSiegeUnit\);/);
  assert.match(main, /battleReserveNotice\(\s*atkRosterRef\.length, defRosterRef\.length, BATTLE_MAX_PER_SIDE, playerSide/s);
});
check('owner civilization/difficulty and commander context are attached per siege BattleUnit', () => {
  assert.match(main, /civBonusy: civBonusyForOwnerId\(u\.ownerId\)/);
  assert.match(main, /difficultyCombatMult: difficultyCombatMultForOwner\(u\.ownerId\)/);
  assert.match(main, /ownerHasCommander\.get\(u\.ownerId\) === true/);
  assert.match(battleScene, /battleUnitCivBonusy\(\s*attacker\.bu/);
  assert.match(battleScene, /battleUnitDifficultyCombatMult\(\s*attacker\.bu/);
  assert.match(battleScene, /battleUnitCivBonusy\(a\.ru\.bu/);
  assert.match(battleScene, /battleUnitDifficultyCombatMult\(a\.ru\.bu/);
});
check('tactical combat resolves each allied unit context with side fallback for legacy units', () => {
  const principalBonus = [{ typ: 'principal' }];
  const allyBonus = [{ typ: 'ally' }];
  assert.strictEqual(api.battleUnitCivBonusy({ civBonusy: allyBonus }, principalBonus), allyBonus);
  assert.strictEqual(api.battleUnitCivBonusy({}, principalBonus), principalBonus);
  assert.strictEqual(api.battleUnitDifficultyCombatMult({ difficultyCombatMult: 1.2 }, 1.1), 1.2);
  assert.strictEqual(api.battleUnitDifficultyCombatMult({}, 1.1), 1.1);
});
check('siege prebattle defender bonus breakdown is grouped by each unit owner', () => {
  assert.match(main, /function cityDefenseBreakdownFor\([\s\S]*?perOwner = false/);
  assert.match(main, /const ownerIds = perOwner\s*\? \[\.\.\.new Set\(defRoster\.map\(u => u\.ownerId\)\)\]/);
  assert.match(main, /warunki: cityDefenseBreakdownFor\(defRoster, dTeren, true\)/);
});
check('sortie and open-city battle remain on their separate normal battle routes', () => {
  assert.match(main, /function lastStandSortieCmdsForOwner\(/);
  assert.match(main, /collectBarbarianAwareBattleRoster\(atkUnit, defUnit, 'attacker'\)/);
  assert.match(main, /collectAtkRosterNearCity\(action\.ctx\.city, action\.attacker, units\)/);
});

console.log(`battle-siege-nearby-units-join-test: PASS=${pass} FAIL=0`);
