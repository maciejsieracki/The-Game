'use strict';

// Bounded matrix-only tests for direct helper callers and the generated matrix adapter.
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');

const built = esbuild.buildSync({
  stdin: { contents: `
    export {
      civCombatStatMultipliers, civCombatBonusProjection, isCombatModifierBonus,
      civMatrixBonusyForCivKey, civMovementMultiplier, civEmbarkationMovementMultiplier,
      civAttackRangeMultiplier, civSiegeAttackMultiplier, civWallDefenseMultiplier,
    } from './src/game/civ-bonuses';
    export { resolveCombat } from './src/game/combat';
    export { civRecruitmentDiscount } from './src/game/production';
  `, resolveDir: root, loader: 'ts' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  write: false,
  logLevel: 'silent',
});
const bundleModule = { exports: {} };
new Function('require', 'module', 'exports', built.outputFiles[0].text)(require, bundleModule, bundleModule.exports);
const M = bundleModule.exports;

let checks = 0;
function eq(actual, expected, label) {
  assert.equal(actual, expected, label);
  checks++;
}
function near(actual, expected, label) {
  assert(Math.abs(actual - expected) < 1e-9, `${label}: got ${actual}, expected ${expected}`);
  checks++;
}
function ok(value, label) {
  assert.ok(value, label);
  checks++;
}

const legacyInfantry = [
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.3, opis: 'Legacy attack/armor', realizuje: 'walka' },
  { typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.3, opis: 'Legacy defense and HP', realizuje: 'walka' },
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.4, opis: 'Legacy charge impact', realizuje: 'walka' },
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.4, opis: 'Legacy movement', realizuje: 'walka' },
];
const infantry = { typNazwa: 'Legionista', rola: 'piechota' };
const roman = M.civMatrixBonusyForCivKey('rzymianie');
const romanCombined = [...legacyInfantry, ...roman];
const romanMods = M.civCombatStatMultipliers(romanCombined, infantry, { side: 'attacker' });
near(romanMods.atk, 0.15, 'recognized matrix attack applies once despite legacy attack');
near(romanMods.pancerz, 0.15, 'recognized matrix armor applies once despite legacy armor');
near(romanMods.obrona, 0, 'legacy defense is rejected for attacker');
near(romanMods.uderzenie, 0, 'legacy charge effect is rejected');
near(M.civMovementMultiplier(romanCombined, infantry), 1, 'legacy tactical movement is rejected');

const greek = M.civMatrixBonusyForCivKey('grecy');
const greekDefense = M.civCombatStatMultipliers([
  ...legacyInfantry,
  ...greek,
], infantry, { side: 'defender', terrain: 'Rownina' });
near(greekDefense.obrona, 0.2, 'Greek matrix defense is preserved and legacy defense is not summed');
near(greekDefense.health, 0, 'legacy HP prose is not parsed as a matrix stat');

const invalidMatrixEntries = [
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.5, opis: 'fabricated id', realizuje: 'walka', matrixParamId: 'walka_atak_fabrykowany' },
  { typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.5, opis: 'wrong type for attack id', realizuje: 'walka', matrixParamId: 'walka_atak_piechota' },
  { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.5, opis: 'wrong domain', realizuje: 'ekonomia', matrixParamId: 'walka_atak_piechota' },
];
const invalidMods = M.civCombatStatMultipliers(invalidMatrixEntries, infantry, { side: 'attacker' });
near(invalidMods.atk, 0, 'fabricated, malformed, and wrong-domain matrix entries are neutral');
eq(M.civCombatBonusProjection(invalidMatrixEntries, infantry, { side: 'attacker' }).length, 0,
  'malformed matrix entries do not appear in combat projection');
for (const b of [...legacyInfantry, ...invalidMatrixEntries]) {
  eq(M.isCombatModifierBonus(b), false, 'legacy or malformed entry is not a visible combat modifier');
}

const zulu = M.civMatrixBonusyForCivKey('zulusi');
const zuluImpact = M.civCombatStatMultipliers(zulu, infantry, { side: 'attacker', isChargeRound: true });
near(zuluImpact.uderzenie, 0.15, 'Zulu matrix impact remains active');
const impiMatrix = zulu.find(b => b.matrixParamId === 'walka_koszt_rekrutacji_proc');
ok(impiMatrix, 'Zulu G11 recruitment discount is generated from matrix');
eq(impiMatrix.realizuje, 'ekonomia', 'Zulu G11 retains the economics domain');
near(M.civRecruitmentDiscount([impiMatrix], 'Impi'), 0.1, 'matrix G11 still discounts Impi');
near(M.civRecruitmentDiscount([impiMatrix], 'Wojownik'), 0, 'matrix G11 remains Impi-scoped');

const sumer = M.civMatrixBonusyForCivKey('sumer');
const sumerHp = M.civCombatStatMultipliers(sumer, infantry, { side: 'defender' });
near(sumerHp.health, 0.2, 'Sumer matrix HP remains active');
const baseUnit = {
  typNazwa: 'Test', counterTyp: 'Miecznik', rola: 'Wrecz', meleeAttack: 0, meleeDefence: 100,
  weaponDamage: 0, armor: 0, piercing: 0, chargeBonus: 0, health: 100,
  'Prog dezercji (% health)': null, missileAttack: 0, 'Zasieg ataku (hex)': '—', 'Ilosc pociskow': '—',
  'Ruch w bitwie (heksy)': '—', 'Kara obrony z flanki (%)': '—', 'Kara obrony z tylu (%)': '—', 'Super-jednostka': false,
};
const hpResult = M.resolveCombat(baseUnit, { ...baseUnit, canonicalEffectiveMaxHp: 100, canonicalCurrentHp: 130 }, {
  defenderCivBonusy: [...legacyInfantry, ...sumer], maxRounds: 1, rng: () => 0.99,
});
eq(hpResult.defenderHpLeft, 120, 'combat HP uses matrix value and ignores legacy HP clause');

const egypt = M.civMatrixBonusyForCivKey('egipt');
const chariot = { typNazwa: 'Rydwan egipski', rola: 'kawaleria' };
near(M.civMovementMultiplier(egypt, chariot), 1.15, 'Egyptian chariot-specific matrix movement applies once (1B)');
near(M.civMovementMultiplier(egypt, infantry), 1, 'Egyptian movement does not leak to infantry');
near(M.civEmbarkationMovementMultiplier(egypt, chariot), 1, 'Egyptian tactical movement does not alter strategic embarkation (4B)');
near(M.civMovementMultiplier([...egypt, ...legacyInfantry], chariot), 1.15,
  'legacy movement cannot be added to Egyptian matrix movement');
near(M.civMovementMultiplier(greek, infantry, 'Plains', true), 1.5,
  'Greek shallow-sea matrix movement remains active');

const egyptRange = M.civAttackRangeMultiplier(egypt, chariot);
near(egyptRange, 1.15, 'Egyptian chariot matrix range remains active');
near(M.civAttackRangeMultiplier([
  { typ: 'bonus_walka', cel: 'rydwany', wartosc: 0.8, opis: 'Legacy range', realizuje: 'walka' },
  ...egypt,
], chariot), 1.15, 'legacy range cannot be added to matrix range');

const assyria = M.civMatrixBonusyForCivKey('asyria');
const siege = { typNazwa: 'Katapulta', rola: 'Oblężnicza', counterTyp: 'siege' };
near(M.civCombatStatMultipliers(assyria, siege, { side: 'attacker' }).atk, 0.15,
  'Assyrian siege-category matrix attack remains active');
near(M.civCombatStatMultipliers([
  { typ: 'bonus_walka', cel: 'obleczenie', wartosc: 0.8, opis: 'Legacy siege', realizuje: 'walka' },
  ...assyria,
], siege, { side: 'attacker' }).atk, 0.15, 'legacy siege bonus is not summed with matrix');
near(M.civSiegeAttackMultiplier([
  { typ: 'bonus_walka', cel: 'wszystko', wartosc: 0.8, opis: 'Legacy siege', realizuje: 'walka' },
], siege), 1, 'dedicated siege helper rejects legacy entries');

const hittite = M.civMatrixBonusyForCivKey('hetyci');
near(M.civWallDefenseMultiplier(hittite, infantry), 1.15, 'Hittite matrix wall defense remains active');
near(M.civWallDefenseMultiplier([
  { typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.8, opis: 'Legacy wall defense', realizuje: 'walka' },
  ...hittite,
], infantry), 1.15, 'legacy wall defense is not summed with matrix');

eq(M.civMatrixBonusyForCivKey('unknown-civ').length, 0, 'missing matrix owner produces no synthetic effects');
console.log(`pr141-matrix-only-combat-test: ${checks} passed, 0 failed`);
