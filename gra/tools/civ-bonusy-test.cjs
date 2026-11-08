'use strict';
/**
 * civ-bonusy-test.cjs -- RDY-01: bonusy cywilizacji w economy.ts + production.ts
 * Run from gra/:  node tools/civ-bonusy-test.cjs
 *
 * Asercje:
 *   Legacy civs.json yield bonuses are neutral; explicit city yield multipliers remain supported.
 *   Zulusi  -10% rekrutacja (civRecruitmentDiscount + unitPurchaseCost)
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[civ-bonusy-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.civ-bonusy-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.civ-bonusy-bundle.cjs');

const ENTRY_TS = `
export {
  civBonusyForCivKey,
  civEconomyYieldMultipliers,
  cityYieldPerTurn,
  loadEconParams,
} from '../src/game/economy';
export {
  civRecruitmentDiscount,
  unitPurchaseCost,
} from '../src/game/production';
export { civProductionCostBonusyForCivKey } from '../src/game/production';
export {
  civBuildingCostDiscount,
  buildingCostAfterCivDiscount,
  civCombatStatMultipliers,
  civCombatUnitShapeFromCategory,
  civCombatBonusProjection,
  effectiveCombatBonusChipTexts,
  unitCombatCategory,
  applyMultiplier,
  isCombatModifierBonus,
  civMatrixBonusyForCivKey,
} from '../src/game/civ-bonuses';
export { resolveCombat } from '../src/game/combat';
export { categoryOf } from '../src/units/setup';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[civ-bonusy-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const civBonusyForCivKey = (key, civs) => [
  ...M.civBonusyForCivKey(key, civs),
  ...M.civMatrixBonusyForCivKey(key),
];
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else       { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function near(a, b, eps, msg) {
  assert(Math.abs(a - b) < eps, `${msg} (got ${a}, want ~${b})`);
}

// ---------------------------------------------------------------------------
// Fixtures from civs.json
// ---------------------------------------------------------------------------
const grecyBonusy   = civBonusyForCivKey('grecy', civs);
const inkowieBonusy = civBonusyForCivKey('inkowie', civs);
const zulusiBonusy  = civBonusyForCivKey('zulusi', civs);

assert(grecyBonusy.length >= 1,   'civBonusyForCivKey: Grecy ma bonusy');
assert(inkowieBonusy.length >= 1, 'civBonusyForCivKey: Inkowie ma bonusy');
assert(zulusiBonusy.length >= 1,  'civBonusyForCivKey: Zulusi ma bonusy');

// ---------------------------------------------------------------------------
// A. civEconomyYieldMultipliers (legacy civs.json source is matrix-only neutral)
// ---------------------------------------------------------------------------
console.log('\nA. civEconomyYieldMultipliers');
{
  const g = M.civEconomyYieldMultipliers(grecyBonusy);
  near(g.handel, 1.0,  1e-9, 'Grecy legacy handel mult = 1.0 (matrix-only)');
  near(g.nauka,  1.0,  1e-9, 'Grecy nauka mult = 1.0 (brak bonusu nauki)');
}
{
  const i = M.civEconomyYieldMultipliers(inkowieBonusy);
  near(i.handel, 1.0,  1e-9, 'Inkowie handel mult = 1.0');
  near(i.nauka,  1.0,  1e-9, 'Inkowie legacy nauka mult = 1.0 (matrix-only)');
}
{
  const z = M.civEconomyYieldMultipliers(zulusiBonusy);
  near(z.handel, 1.0, 1e-9, 'Zulusi handel mult = 1.0 (rekrutacja osobno)');
  near(z.nauka,  1.0, 1e-9, 'Zulusi nauka mult = 1.0');
}
{
  const empty = M.civEconomyYieldMultipliers([]);
  near(empty.handel, 1.0, 1e-9, 'brak bonusow -> handel 1.0');
  near(empty.nauka,  1.0, 1e-9, 'brak bonusow -> nauka 1.0');
}

// ---------------------------------------------------------------------------
// B. Explicit cityYieldPerTurn context multiplier remains supported by the generic yield helper.
// ---------------------------------------------------------------------------
console.log('\nB. explicit trade multiplier in cityYieldPerTurn');
const params = M.loadEconParams({ ekonomia_miasta: {}, budynki: {} }, 'normal');
const city = {
  id: 'c1', ludnosc: 3,
  podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
  podziałPracy:  { procentBudynki: 70, procentTeren: 30 },
  specjalisci: [],
};
const workedHandel = Array.from({ length: 10 }, () => ({
  terenBazowy: M.TerenBazowy.Rownina,
  nakladka: M.Nakladka.Brak,
  maRzeke: false,
}));
const baseCtx = {
  wojskoZuzycieZywnosci: 0, strataFraction: 0,
  maMlyn: false, maCegielnia: false, maTargowisko: false,
  maMennica: false, mennicaMnoznik: 1, maBiblioteka: false,
  walutaOdkryta: false,
};
const yldBase  = M.cityYieldPerTurn(city, workedHandel, [], params, baseCtx);
const yldGrecy = M.cityYieldPerTurn(city, workedHandel, [], params, { ...baseCtx, civHandelMult: 1.15 });
eq(yldGrecy.handelBrutto, Math.floor(10 * 1.15), 'explicit context: handelBrutto = floor(10*1.15) = 11');
assert(yldGrecy.pieniadz > yldBase.pieniadz,
  'explicit context: pieniadz z handlu wyzszy niz bez mnoznika');

// ---------------------------------------------------------------------------
// C. Explicit cityYieldPerTurn science multiplier remains supported by the generic yield helper.
// ---------------------------------------------------------------------------
console.log('\nC. explicit science multiplier in cityYieldPerTurn');
const workedMixed = Array.from({ length: 10 }, () => ({
  terenBazowy: M.TerenBazowy.Rownina,
  nakladka: M.Nakladka.Brak,
  maRzeke: false,
}));
const mockBiblioteka = [{
  record: {
    id: 'biblioteka', nazwa: 'Biblioteka', kategoria: 'Nauka', epokaWejscia: 1, maksPoziom: 3,
    baza:   { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 10, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
    przyrost:{ praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
    kosztBudowy: 80, przyrostKosztu: 0, utrzymanie: 2, przyrostUtrzymania: 0, techUnlock: '',
  },
  level: 1,
}];
const ctxInkBase = { ...baseCtx, maBiblioteka: false };
const ctxInkBonus = { ...baseCtx, maBiblioteka: false, civNaukaMult: 1.15 };
const yldInkBase  = M.cityYieldPerTurn(city, workedMixed, mockBiblioteka, params, ctxInkBase);
const yldInkBonus = M.cityYieldPerTurn(city, workedMixed, mockBiblioteka, params, ctxInkBonus);
// nauka = floor((naukaZHandlu + 10) * civNaukaMult); handel 10 * 20% = 2 + 10 budynek = 12 raw -> *1.15 = 13
eq(yldInkBonus.nauka, Math.floor(yldInkBase.nauka * 1.15),
  'explicit context: nauka = floor(baza * 1.15)');

// ---------------------------------------------------------------------------
// D. Zulusi -10% rekrutacja (production.ts)
// ---------------------------------------------------------------------------
console.log('\nD. Zulusi -10% rekrutacja');
{
  const disc = M.civRecruitmentDiscount(zulusiBonusy, 'Impi');
  near(disc, 0.1, 1e-9, 'Zulusi civRecruitmentDiscount = 0.1 (10%)');
}
{
  const discNone = M.civRecruitmentDiscount(grecyBonusy);
  near(discNone, 0, 1e-9, 'Grecy civRecruitmentDiscount = 0');
}
{
  const def10 = { Jednostka: 'Impi', 'Pieniądz (koszt)': 10 };
  eq(M.unitPurchaseCost(def10), 10, 'Impi koszt 10 bez bonusu');
  eq(M.unitPurchaseCost(def10, zulusiBonusy), 9, 'Zulusi: floor(10*0.9) = 9');
}
{
  const def25 = { Jednostka: 'Impi', 'Pieniądz (koszt)': 25 };
  eq(M.unitPurchaseCost(def25, zulusiBonusy), 22, 'Zulusi: floor(25*0.9) = 22');
}
{
  const def1 = { Jednostka: 'Impi', 'Pieniądz (koszt)': 1 };
  eq(M.unitPurchaseCost(def1, zulusiBonusy), 1, 'Zulusi: min koszt = 1 (floor(0.9)=0 -> max(1,...))');
}

{
  eq(M.civRecruitmentDiscount(zulusiBonusy), 0, 'Scoped Impi discount requires unit identity');
  eq(M.civRecruitmentDiscount(zulusiBonusy, 'Wojownik'), 0, 'Zulu discount excludes non-Impi');
  eq(M.unitPurchaseCost({ Jednostka: 'Wojownik', 'Pieniądz (koszt)': 25 }, zulusiBonusy),
    25, 'Zulu non-Impi cost stays unchanged');
}

// ---------------------------------------------------------------------------
// E. Rzymianie -20% koszt budynkow (koszt_redukcja)
// ---------------------------------------------------------------------------
console.log('\nE. Rzymianie -20% budynki');
{
  const rzymLegacyBonusy = M.civBonusyForCivKey('rzymianie', civs);
  eq(M.civBuildingCostDiscount(rzymLegacyBonusy), 0, 'retired Roman legacy building discount is neutral');
  eq(M.buildingCostAfterCivDiscount(100, rzymLegacyBonusy), 100, 'legacy-only Rome building cost stays 100');
  const rzymMatrixBonusy = M.civProductionCostBonusyForCivKey('rzymianie');
  near(M.civBuildingCostDiscount(rzymMatrixBonusy), 0.2, 1e-9, 'canonical Roman matrix building discount = 0.2');
  eq(M.buildingCostAfterCivDiscount(100, rzymMatrixBonusy), 80, 'matrix Rome: floor(100*0.8) = 80');
  eq(M.buildingCostAfterCivDiscount(100, grecyBonusy), 100, 'Grecy: brak ulgi budynkow');
}

// ---------------------------------------------------------------------------
// F. Bonusy walki — Grecy obrona piechoty, Celtowie szarza
// ---------------------------------------------------------------------------
console.log('\nF. Bonusy walki (civCombatStatMultipliers)');
{
  const hoplita = { typNazwa: 'Falanga', rola: 'Wrecz', 'Atak dystansowy': 0 };
  eq(M.unitCombatCategory(hoplita), 'piechota', 'Falanga = piechota');
  const gMods = M.civCombatStatMultipliers(grecyBonusy, hoplita, {
    side: 'defender', terrain: 'Rownina', isChargeRound: false,
  });
  near(gMods.obrona, 0.2, 1e-9, 'Grecy Falanga: +20% obrona (defender)');
  const gAtk = M.civCombatStatMultipliers(grecyBonusy, hoplita, {
    side: 'attacker', terrain: 'Rownina', isChargeRound: false,
  });
  near(gAtk.obrona, 0, 1e-9, 'Grecy bonus_obrona nie na ataku');
}
{
  const celtyBonusy = civBonusyForCivKey('celtowie', civs);
  const miecznik = { typNazwa: 'Wojownik', rola: 'Wrecz', 'Atak dystansowy': 0 };
  const charge = M.civCombatStatMultipliers(celtyBonusy, miecznik, {
    side: 'attacker', terrain: 'Rownina', isChargeRound: true,
  });
  near(charge.atk, 0.25, 1e-9, 'Celtowie szarza R1: +25% atk');
  near(charge.uderzenie, 0.4, 1e-9, 'Celtowie szarza: +40% uderzenie');
}
{
  const inkBonusy = civBonusyForCivKey('inkowie', civs);
  const piech = { typNazwa: 'Wojownik', rola: 'Wrecz', 'Atak dystansowy': 0 };
  const las = M.civCombatStatMultipliers(inkBonusy, piech, {
    side: 'attacker', terrain: 'Las', isChargeRound: false,
  });
  near(las.atk, 0.2, 1e-9, 'Inkowie w lesie: +20% atk');
  const rown = M.civCombatStatMultipliers(inkBonusy, piech, {
    side: 'attacker', terrain: 'Rownina', isChargeRound: false,
  });
  near(rown.atk, 0, 1e-9, 'Inkowie na rowninie: brak bonusu terenowego');
}
{
  const galera = { typNazwa: 'Galera', rola: 'Morska', counterTyp: 'Naval', 'Atak dystansowy': 0 };
  eq(M.unitCombatCategory(galera), 'morska', 'Galera = morska');
  const galeraAtk = M.civCombatStatMultipliers(grecyBonusy, galera, {
    side: 'attacker', terrain: 'GlebokaWoda', isChargeRound: false,
  });
  near(galeraAtk.atk, 0.5, 1e-9, 'Grecy Galera: +50% atak morski');
  const galeraDef = M.civCombatStatMultipliers(grecyBonusy, galera, {
    side: 'defender', terrain: 'GlebokaWoda', isChargeRound: false,
  });
  near(galeraDef.obrona, 0.5, 1e-9, 'Grecy Galera: +50% obrona morska');
}

// ---------------------------------------------------------------------------
// G. PreBattle — tylko modyfikatory bojowe (bez flavor / ekonomii)
// ---------------------------------------------------------------------------
console.log('\nG. isCombatModifierBonus (preBattle filter)');
{
  const rzymBonusy = civBonusyForCivKey('rzymianie', civs);
  const walka = rzymBonusy.filter(b => M.isCombatModifierBonus(b));
  assert(!walka.some(b => (b.opis ?? '').startsWith('Legion:')),
    'combat modifier filter rejects the legacy Roman entry');
  const romanChips = M.effectiveCombatBonusChipTexts(rzymBonusy,
    [{ typNazwa: 'Legionista', rola: 'Wrecz' }], { side: 'attacker' });
  assert(!romanChips.some(text => text.startsWith('Legion:')),
    'PreBattle omits Roman legacy attack/armor text');
  assert(romanChips.includes('Matrix:walka_atak_piechota') && romanChips.includes('Matrix:walka_pancerz_piechota'),
    'PreBattle shows both effective Roman matrix effects');

  const grecyWalka = grecyBonusy.filter(b => M.isCombatModifierBonus(b));
  assert(!grecyWalka.some(b => (b.opis ?? '').startsWith('Falanga:')),
    'combat modifier filter rejects the legacy Greek entry');
  const greekChips = M.effectiveCombatBonusChipTexts(grecyBonusy,
    [{ typNazwa: 'Falanga', rola: 'Wrecz' }], { side: 'defender' });
  assert(!greekChips.some(text => text.startsWith('Falanga:')),
    'PreBattle omits Greek legacy defense text');
  assert(greekChips.includes('Matrix:walka_obrona_piechota'), 'PreBattle shows effective Greek matrix defense');

  const sumerBonusy = civBonusyForCivKey('sumer', civs);
  const sumerInfantryChips = M.effectiveCombatBonusChipTexts(sumerBonusy,
    [{ typNazwa: 'Włócznik sumeryjski', rola: 'Wrecz' }], { side: 'defender' });
  assert(!sumerInfantryChips.some(text => text.startsWith('Ciężka piechota:')),
    'PreBattle omits Sumer infantry legacy defense/HP/armor entry');
  assert(sumerInfantryChips.includes('Matrix:walka_obrona_piechota')
    && sumerInfantryChips.includes('Matrix:walka_hp_piechota'),
  'PreBattle shows effective Sumer defense and HP matrix effects');

  const sumerChariotChips = M.effectiveCombatBonusChipTexts(sumerBonusy,
    [{ typNazwa: 'Rydwan sumeryjski', rola: 'Wrecz' }], { side: 'defender' });
  assert(!sumerChariotChips.some(text => text.includes('Ciężkie rydwany bojowe:')),
    'PreBattle omits Sumer legacy chariot defense as well as legacy HP');
  assert(sumerChariotChips.includes('Matrix:walka_hp_rydwany')
    && !sumerChariotChips.some(text => text.includes('Ciężkie rydwany bojowe:')),
    'PreBattle shows chariot matrix HP without legacy chariot claims');

  const galeraShape = { typNazwa: 'Galera', rola: 'galera' };
  eq(M.categoryOf('Galera', 'Morska', false), 'galera', 'runtime class constructor input for Galera is `galera`');
  eq(M.unitCombatCategory(galeraShape), 'morska', 'PreBattle runtime category galera maps to naval combat category');
  const preBattleGaleraShape = M.civCombatUnitShapeFromCategory('Galera', 'galera');
  eq(preBattleGaleraShape.rola, 'Morska', 'PreBattle categoryOf galera translates to canonical naval role');
  eq(M.unitCombatCategory(preBattleGaleraShape), 'morska', 'translated PreBattle Galera remains naval');
  const galeraChips = M.effectiveCombatBonusChipTexts(grecyBonusy, [preBattleGaleraShape], { side: 'defender' });
  assert(!galeraChips.includes('Matrix:walka_obrona_piechota'),
    'Greek infantry defense matrix does not leak onto a Galera roster');
  assert(galeraChips.includes('Matrix:walka_atak_morska'),
    'applicable Greek naval matrix bonus remains visible on a Galera');
  const otherShip = M.civCombatUnitShapeFromCategory('Okręt patrolowy', 'galera');
  const shipOnlyBonuses = [
    { typ: 'bonus_walka', cel: 'morska', wartosc: 0.1, opis: 'Legacy naval attack', realizuje: 'walka' },
    { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.15, opis: 'Matrix:walka_atak_piechota', realizuje: 'walka', matrixParamId: 'walka_atak_piechota' },
    { typ: 'bonus_obrona', cel: 'piechota', wartosc: 0.15, opis: 'Matrix:walka_obrona_piechota', realizuje: 'walka', matrixParamId: 'walka_obrona_piechota' },
    { typ: 'bonus_walka', cel: 'lukownicy', wartosc: 0.15, opis: 'Matrix:walka_dystans_lukownicy', realizuje: 'walka', matrixParamId: 'walka_dystans_lukownicy' },
    { typ: 'bonus_obrona', cel: 'rydwany', wartosc: 0.15, opis: 'Matrix:walka_hp_rydwany', realizuje: 'walka', matrixParamId: 'walka_hp_rydwany' },
    { typ: 'bonus_walka', cel: 'morska', wartosc: 0.2, opis: 'Matrix:walka_atak_morska', realizuje: 'walka', matrixParamId: 'walka_atak_morska' },
  ];
  const otherShipChips = M.effectiveCombatBonusChipTexts(shipOnlyBonuses, [otherShip], { side: 'defender' });
  assert(!otherShipChips.includes('Legacy naval attack') && otherShipChips.includes('Matrix:walka_atak_morska'),
    'other naval role rejects legacy attack and retains applicable sea matrix bonus');
  assert(!otherShipChips.some(text => /walka_(atak_piechota|obrona_piechota|dystans_lukownicy|hp_rydwany)/.test(text)),
    'Galera blocks infantry, archer and chariot G1 bonus leakage');
}

// --- summary ---------------------------------------------------------------
console.log('\nciv-bonusy-test: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
