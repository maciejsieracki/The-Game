'use strict';

// Targeted G1 activation checks. Run from gra/: node tools/pr141-g1-combat-activation-test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.join(__dirname, '.pr141-g1-entry.ts');
const bundle = path.join(__dirname, '.pr141-g1-bundle.cjs');
fs.writeFileSync(entry, `
export { civCombatStatMultipliers, civMatrixBonusyForCivKey } from '../src/game/civ-bonuses';
export { resolveCombat } from '../src/game/combat';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' }, outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
  const M = require(bundle);
  const unit = (typNazwa, missileAttack = 0) => ({ typNazwa, rola: missileAttack > 0 ? 'Dystans' : 'Wrecz', missileAttack });
  const calc = (bonuses, u, side = 'attacker') => M.civCombatStatMultipliers(bonuses, u, { side });

  // Captured pre-matrix legacy rows are hostile test inputs only. The live data
  // intentionally no longer contains these retired combat bonuses.
  const capturedLegacyFixtures = {
    roman: [{ typ: 'bonus_walka', cel: 'piechota', wartosc: 0.15,
      opis: 'Legion: +15% ataku i pancerza piechoty szturmowej; dyscyplina bojowa +morale', realizuje: 'walka' }],
    sumer: [
      { typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.2,
        opis: 'Ciężka piechota: +20% obrony i HP ciężkiej piechoty (pancerz brązowy + tarcza)', realizuje: 'walka' },
      { typ: 'bonus_walka', cel: 'rydwany', wartosc: 0.15,
        opis: 'Ciężkie rydwany bojowe: +15% HP i obrony rydwanów (masywna konstrukcja)', realizuje: 'walka' },
    ],
    chinese: [{ typ: 'bonus_walka', cel: 'lukownicy', wartosc: 0.2,
      opis: 'Łucznicy: +20% ataku i zasięgu jednostek dystansowych (przewaga dystansowa)', realizuje: 'walka' }],
  };

  const g1 = ['walka_atak_piechota', 'walka_obrona_piechota', 'walka_pancerz_piechota',
    'walka_dystans_lukownicy', 'walka_hp_piechota', 'walka_hp_rydwany'];
  const sumerMatrix = M.civMatrixBonusyForCivKey('sumer');
  for (const id of g1) assert.ok(sumerMatrix.some(b => b.matrixParamId === id), `G1 marker present, including zero: ${id}`);
  assert.equal(M.civMatrixBonusyForCivKey('unknown-civ').filter(b => g1.includes(b.matrixParamId)).length, 0,
    'missing matrix owner does not fabricate zero overrides');

  // Matrix values are authoritative even when the caller supplies old civs.json rows too.
  const roman = [...capturedLegacyFixtures.roman, ...M.civMatrixBonusyForCivKey('rzymianie')];
  const romanMods = calc(roman, unit('Legionista'));
  assert.equal(romanMods.atk, 0.15, 'Roman matrix attack replaces its overlapping legacy attack once');
  assert.equal(romanMods.pancerz, 0.15, 'Roman matrix armor replaces its overlapping legacy armor once');

  // Sumer infantry gets only current matrix defense/HP values; zero armor stays neutral.
  const sumerInf = [...capturedLegacyFixtures.sumer, ...sumerMatrix];
  const sumerMods = calc(sumerInf, unit('Włócznik sumeryjski'), 'defender');
  assert.equal(sumerMods.obrona, 0.2, 'Sumer defense matrix replaces only legacy defense');
  assert.equal(sumerMods.health, 0.2, 'Sumer HP matrix replaces only legacy HP');
  assert.equal(sumerMods.pancerz, 0, 'zero armor matrix replaces overlapping legacy armor');
  assert.equal(calc(sumerInf, unit('Włócznik sumeryjski'), 'attacker').health, 0,
    'existing defender gate remains for HP/defense bonuses');

  // Sumer chariot HP remains matrix-driven; legacy chariot defense is excluded.
  const sumerChariot = [...capturedLegacyFixtures.sumer, ...sumerMatrix];
  const chariotMods = calc(sumerChariot, unit('Rydwan sumeryjski'), 'defender');
  assert.equal(chariotMods.health, 0.15, 'chariot matrix HP replaces its legacy HP once');
  assert.equal(chariotMods.obrona, 0, 'legacy chariot defense is not combined with matrix-only effects');

  // The matrix archer-distance field affects missile attack; legacy parser semantics are ignored.
  const chinese = [...capturedLegacyFixtures.chinese, ...M.civMatrixBonusyForCivKey('chinczycy')];
  const archerMods = calc(chinese, unit('Łucznik chiński', 10));
  assert.equal(archerMods.atk, 0, 'Chinese legacy archer entry does not create a melee attack effect');
  assert.equal(archerMods.rangedAtk, 0.2, 'matrix archer distance multiplies missileAttack separately');
  const zuluArchers = M.civMatrixBonusyForCivKey('zulusi');
  assert.equal(calc(zuluArchers, unit('Łucznik', 10)).rangedAtk, -0.1, 'negative matrix missile multiplier is active');
  const phoenician = M.civMatrixBonusyForCivKey('fenicjanie');
  assert.equal(calc(phoenician, unit('Piechota'), 'defender').obrona, -0.05, 'negative matrix defense multiplier is active');

  // Matrix zero and source absence are neutral; legacy entries never leak through.
  const custom = [
    { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.3, opis: 'Atak i pancerz', realizuje: 'walka' },
    { typ: 'bonus_walka', cel: 'kawaleria', wartosc: 0.3, opis: 'Atak kawalerii', realizuje: 'walka' },
    { typ: 'bonus_walka', cel: 'piechota', wartosc: 0, opis: 'Matrix:walka_atak_piechota', realizuje: 'walka', matrixParamId: 'walka_atak_piechota' },
  ];
  const customMods = calc(custom, unit('Piechota'));
  assert.equal(customMods.atk, 0, 'zero matrix marker masks legacy attack');
  assert.equal(customMods.pancerz, 0, 'legacy armor clause is not parsed');
  assert.equal(calc(custom, unit('Kawalerzysta')).atk, 0, 'legacy cavalry attack is not parsed without a matrix field');

  const rangedLegacy = [
    { typ: 'bonus_walka', cel: 'lukownicy', wartosc: 0.3, opis: 'Łucznicy dystansowi +30%', realizuje: 'walka' },
    { typ: 'bonus_walka', cel: 'lukownicy', wartosc: 0.2, opis: 'Ataku łuczników +20%', realizuje: 'walka' },
  ];
  const zeroRangedMatrix = { typ: 'bonus_walka', cel: 'lukownicy', wartosc: 0, opis: 'Matrix:walka_dystans_lukownicy',
    realizuje: 'walka', matrixParamId: 'walka_dystans_lukownicy' };
  const zeroRangedMods = calc([...rangedLegacy, zeroRangedMatrix], unit('Łucznik', 10));
  assert.equal(zeroRangedMods.rangedAtk, 0, 'zero G1 marker replaces valid legacy rangedAtk parser branch');
  assert.equal(zeroRangedMods.atk, 0, 'zero ranged field has no legacy melee fallback');
  const nonzeroRangedMatrix = { ...zeroRangedMatrix, wartosc: 0.1 };
  const nonzeroRangedMods = calc([...rangedLegacy, nonzeroRangedMatrix], unit('Łucznik', 10));
  assert.equal(nonzeroRangedMods.rangedAtk, 0.1, 'nonzero matrix rangedAtk replaces valid legacy rangedAtk once');
  assert.equal(nonzeroRangedMods.atk, 0, 'matrix ranged field does not import legacy melee attack');

  // Canonical max HP receives the G1 multiplier once; current HP remains capped to effective max.
  const base = {
    typNazwa: 'test', counterTyp: 'Miecznik', rola: 'Wrecz', meleeAttack: 0, meleeDefence: 100,
    weaponDamage: 0, armor: 0, piercing: 0, chargeBonus: 0, health: 100,
    'Prog dezercji (% health)': null, missileAttack: 0, 'Zasieg ataku (hex)': '—', 'Ilosc pociskow': '—',
    'Ruch w bitwie (heksy)': '—', 'Kara obrony z flanki (%)': '—', 'Kara obrony z tylu (%)': '—', 'Super-jednostka': false,
  };
  const hpBonus = [{ typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.2, opis: 'Matrix:walka_hp_piechota',
    realizuje: 'walka', matrixParamId: 'walka_hp_piechota' }];
  const hpResult = M.resolveCombat(base, { ...base, canonicalEffectiveMaxHp: 100, canonicalCurrentHp: 130 }, {
    defenderCivBonusy: hpBonus, maxRounds: 1, rng: () => 0.99,
  });
  assert.equal(hpResult.defenderHpLeft, 120, 'canonical max HP multiplier is applied once before current/max cap');
  const fallbackHpResult = M.resolveCombat(base, base, {
    defenderCivBonusy: hpBonus, maxRounds: 1, rng: () => 0.99,
  });
  assert.equal(fallbackHpResult.defenderHpLeft, 120, 'fallback max HP multiplier is applied once');

  console.log('PASS: matrix-only G1 effects, zero/missing neutrality, gates, ranged routing, canonical HP');
} finally {
  fs.rmSync(entry, { force: true });
  fs.rmSync(bundle, { force: true });
}
