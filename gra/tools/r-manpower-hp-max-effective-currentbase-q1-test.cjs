'use strict';

/**
 * Regression for R-MANPOWER-HP-MAX-EFFECTIVE-CURRENTBASE-Q1.
 * Run from gra/: node tools/r-manpower-hp-max-effective-currentbase-q1-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const entryName = '.r-manpower-hp-max-effective-currentbase-entry.ts';
const bundleName = '.r-manpower-hp-max-effective-currentbase-bundle.cjs';
const entry = path.join(__dirname, entryName);
const bundle = path.join(__dirname, bundleName);
fs.writeFileSync(entry, `
import { tickManpowerUnitReplenishment } from '../src/game/manpower';
import { syncLiveUnitHp, tickManpowerUnitReplenishment as tickManpowerUnitReplenishmentAgain } from '../src/game/manpower';
import { effectiveMaxHp, unitCardCombatDisplay } from '../src/game/unit-card-stats';
import { combatUnitFromDef, resolveCombat } from '../src/game/combat';
import { deserializeGame, serializeGame } from '../src/game/save';
module.exports = { tickManpowerUnitReplenishment, tickManpowerUnitReplenishmentAgain, syncLiveUnitHp, effectiveMaxHp, unitCardCombatDisplay, combatUnitFromDef, resolveCombat, deserializeGame, serializeGame };
`, 'utf8');
esbuild.buildSync({
  entryPoints: [`./${entryName}`],
  absWorkingDir: __dirname,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: bundleName,
  logLevel: 'silent',
});
const {
  tickManpowerUnitReplenishment,
  tickManpowerUnitReplenishmentAgain,
  syncLiveUnitHp,
  effectiveMaxHp,
  unitCardCombatDisplay,
  combatUnitFromDef,
  resolveCombat,
  deserializeGame,
  serializeGame,
} = require(bundle);

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) { pass += 1; console.log(`OK ${message}`); }
  else { fail += 1; console.error(`FAIL ${message}`); }
}
function close(actual, expected, message) {
  ok(Math.abs(actual - expected) < 1e-9, `${message} (got ${actual}, expected ${expected})`);
}

close(effectiveMaxHp(22, 0.2, 0), 26.4, 'building bonus raises the canonical max HP');
close(effectiveMaxHp(22, 0.2, 0.1), 28.6, 'building and veteran bonuses combine additively once');
close(effectiveMaxHp(22, 0, 0.1), 24.2, 'veteran bonus raises the canonical max HP');
const card = unitCardCombatDisplay({
  atak: 1, obrona: 1, hpMax: 22, pancerz: 1,
  weaponDamage: 1, piercing: 1, chargeBonus: 1, missileAttack: 1,
}, { parametryBonusProc: 20 });
close(card.hpMaxEffective, 26.4, 'unit UI card uses the canonical effective max HP');

const city = { id: 'c1', ownerId: 0, population: 10, manpower: 5000, q: 0, r: 0, oblegane: false };
const liveUnit = {
  id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik',
  q: 3, r: 3, hp: 22, hpMax: 22, parametryBonusProc: 20,
};
const getMaxHp = (_typeId, unit) => effectiveMaxHp(22, (unit?.parametryBonusProc ?? 0) / 100, 0);
const result = tickManpowerUnitReplenishment(
  [city], [liveUnit], 'normal', () => 1, () => [], getMaxHp,
);
ok(result.healedCount === 1, 'manpower tick heals a unit below effective max HP');
close(liveUnit.hpMax, 26.4, 'manpower backfills stale hpMax with effective max HP');
close(liveUnit.hp, 26.4, 'manpower heals current HP up to effective max HP');
syncLiveUnitHp([liveUnit], liveUnit.id, liveUnit.hp, liveUnit.hpMax);
close(liveUnit.hpMax, 26.4, 'live HP callback synchronizes the effective max cache');

const oldSave = {
  wersja: 3, tura: 1, units: [{ ...liveUnit }], cities: [],
  exploredByHuman: [], gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0,
};
const roundTripped = deserializeGame(serializeGame(oldSave));
close(roundTripped.units[0].hpMax ?? NaN, 26.4, 'save/load preserves the effective max cache');
const clampedLegacy = { ...roundTripped.units[0], hp: 99, hpMax: undefined };
const clampResult = tickManpowerUnitReplenishmentAgain(
  [{ ...city }], [clampedLegacy], 'normal', () => 1, () => [], getMaxHp,
);
ok(clampResult.healedCount === 0 && clampedLegacy.hp === 26.4,
  'old/missing hpMax state is clamped to the effective max before healing');

const majorAiCity = { ...city, id: 'c-major-ai', ownerId: 1, manpower: 5000 };
const majorAiUnit = { ...liveUnit, id: 'u-major-ai', ownerId: 1, hp: 22, hpMax: 22 };
const majorAiEraCalls = [];
const majorAiBonusCalls = [];
const majorAiResult = tickManpowerUnitReplenishment(
  [majorAiCity], [majorAiUnit], 'normal',
  (ownerId) => { majorAiEraCalls.push(ownerId); return 1; },
  (ownerId) => { majorAiBonusCalls.push(ownerId); return []; },
  getMaxHp,
);
const humanOutcome = {
  hp: liveUnit.hp,
  hpMax: liveUnit.hpMax,
  manpower: city.manpower,
  healedCount: result.healedCount,
  totalMpSpent: result.totalMpSpent,
};
const majorAiOutcome = {
  hp: majorAiUnit.hp,
  hpMax: majorAiUnit.hpMax,
  manpower: majorAiCity.manpower,
  healedCount: majorAiResult.healedCount,
  totalMpSpent: majorAiResult.totalMpSpent,
};
console.log(`[owner-parity] ownerId=0 human ${JSON.stringify(humanOutcome)} vs ownerId=1 major-AI ${JSON.stringify(majorAiOutcome)}`);
ok(majorAiEraCalls.length === 1 && majorAiEraCalls[0] === 1,
  'effective-max path calls the owner era resolver for major-AI ownerId=1');
ok(majorAiBonusCalls.length === 1 && majorAiBonusCalls[0] === 1,
  'effective-max path calls the owner bonus resolver for major-AI ownerId=1');
ok(majorAiUnit.hpMax === liveUnit.hpMax && majorAiUnit.hp === liveUnit.hp,
  'effective max HP and healed HP match ownerId=0 for major-AI ownerId=1');
ok(JSON.stringify(majorAiOutcome) === JSON.stringify(humanOutcome),
  'effective-max Manpower result is identical for ownerId=0 and major-AI ownerId=1');

const def = {
  Jednostka: 'Test',
  'Rola (linia)': 'Wrecz',
  health: 11,
  meleeAttack: 0,
  meleeDefence: 0,
  weaponDamage: 0,
  armor: 0,
  piercing: 0,
  chargeBonus: 0,
  missileAttack: 0,
  'Prog dezercji (% health)': 0,
};
const atk = combatUnitFromDef(def, { typNazwa: 'Test', hp: 11 });
const defender = combatUnitFromDef({ ...def, Jednostka: 'Def' }, { typNazwa: 'Def', hp: 11 });
const combat = resolveCombat(atk, defender, {
  maxRounds: 0,
  attackerBuildingBonus: { pancerz: 0, other: 0.2 },
  attackerVeteranBonusFrac: 0.1,
});
ok(combat.attackerHpLeft === 14, 'combat uses the same additive max-HP resolver without duplicate scaling');

try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
console.log(`[r-manpower-hp-max-effective-currentbase-q1-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
