'use strict';
/**
 * civ-bonusy-test.cjs -- RDY-01: bonusy cywilizacji w economy.ts + production.ts
 * Run from gra/:  node tools/civ-bonusy-test.cjs
 *
 * Asercje:
 *   Grecy   +15% handel  (bonus_zloto, realizuje=ekonomia)
 *   Inkowie +15% nauka   (bonus_nauka, realizuje=ekonomia)
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
export {
  civBuildingCostDiscount,
  buildingCostAfterCivDiscount,
  civCombatStatMultipliers,
  unitCombatCategory,
  applyMultiplier,
  isCombatModifierBonus,
} from '../src/game/civ-bonuses';
export { resolveCombat } from '../src/game/combat';
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
const grecyBonusy   = M.civBonusyForCivKey('grecy', civs);
const inkowieBonusy = M.civBonusyForCivKey('inkowie', civs);
const zulusiBonusy  = M.civBonusyForCivKey('zulusi', civs);

assert(grecyBonusy.length >= 1,   'civBonusyForCivKey: Grecy ma bonusy');
assert(inkowieBonusy.length >= 1, 'civBonusyForCivKey: Inkowie ma bonusy');
assert(zulusiBonusy.length >= 1,  'civBonusyForCivKey: Zulusi ma bonusy');

// ---------------------------------------------------------------------------
// A. civEconomyYieldMultipliers
// ---------------------------------------------------------------------------
console.log('\nA. civEconomyYieldMultipliers');
{
  const g = M.civEconomyYieldMultipliers(grecyBonusy);
  near(g.handel, 1.15, 1e-9, 'Grecy handel mult = 1.15 (+15%)');
  near(g.nauka,  1.0,  1e-9, 'Grecy nauka mult = 1.0 (brak bonusu nauki)');
}
{
  const i = M.civEconomyYieldMultipliers(inkowieBonusy);
  near(i.handel, 1.0,  1e-9, 'Inkowie handel mult = 1.0');
  near(i.nauka,  1.15, 1e-9, 'Inkowie nauka mult = 1.15 (+15%)');
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
// B. Grecy +15% handel w cityYieldPerTurn (ctx.civHandelMult)
// ---------------------------------------------------------------------------
console.log('\nB. Grecy +15% handel (cityYieldPerTurn)');
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
eq(yldGrecy.handelBrutto, Math.floor(10 * 1.15), 'Grecy: handelBrutto = floor(10*1.15) = 11');
assert(yldGrecy.pieniadz > yldBase.pieniadz,
  'Grecy: pieniadz z handlu wyzszy niz bez bonusu (+15% handelBrutto)');

// ---------------------------------------------------------------------------
// C. Inkowie +15% nauka w cityYieldPerTurn (ctx.civNaukaMult)
// ---------------------------------------------------------------------------
console.log('\nC. Inkowie +15% nauka (cityYieldPerTurn)');
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
  'Inkowie: nauka = floor(baza * 1.15)');

// ---------------------------------------------------------------------------
// D. Zulusi -10% rekrutacja (production.ts)
// ---------------------------------------------------------------------------
console.log('\nD. Zulusi -10% rekrutacja');
{
  const disc = M.civRecruitmentDiscount(zulusiBonusy);
  near(disc, 0.1, 1e-9, 'Zulusi civRecruitmentDiscount = 0.1 (10%)');
}
{
  const discNone = M.civRecruitmentDiscount(grecyBonusy);
  near(discNone, 0, 1e-9, 'Grecy civRecruitmentDiscount = 0');
}
{
  const def10 = { 'Pieniądz (koszt)': 10 };
  eq(M.unitPurchaseCost(def10), 10, 'Wojownik koszt 10 bez bonusu');
  eq(M.unitPurchaseCost(def10, zulusiBonusy), 9, 'Zulusi: floor(10*0.9) = 9');
}
{
  const def25 = { 'Pieniądz (koszt)': 25 };
  eq(M.unitPurchaseCost(def25, zulusiBonusy), 22, 'Zulusi: floor(25*0.9) = 22');
}
{
  const def1 = { 'Pieniądz (koszt)': 1 };
  eq(M.unitPurchaseCost(def1, zulusiBonusy), 1, 'Zulusi: min koszt = 1 (floor(0.9)=0 -> max(1,...))');
}

// ---------------------------------------------------------------------------
// E. Rzymianie -20% koszt budynkow (koszt_redukcja)
// ---------------------------------------------------------------------------
console.log('\nE. Rzymianie -20% budynki');
{
  const rzymBonusy = M.civBonusyForCivKey('rzymianie', civs);
  near(M.civBuildingCostDiscount(rzymBonusy), 0.2, 1e-9, 'Rzymianie building discount = 0.2');
  eq(M.buildingCostAfterCivDiscount(100, rzymBonusy), 80, 'floor(100*0.8) = 80');
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
  const celtyBonusy = M.civBonusyForCivKey('celtowie', civs);
  const miecznik = { typNazwa: 'Wojownik', rola: 'Wrecz', 'Atak dystansowy': 0 };
  const charge = M.civCombatStatMultipliers(celtyBonusy, miecznik, {
    side: 'attacker', terrain: 'Rownina', isChargeRound: true,
  });
  near(charge.atk, 0.25, 1e-9, 'Celtowie szarza R1: +25% atk');
  near(charge.uderzenie, 0.15, 1e-9, 'Celtowie szarza: +15% uderzenie');
}
{
  const inkBonusy = M.civBonusyForCivKey('inkowie', civs);
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

// ---------------------------------------------------------------------------
// G. PreBattle — tylko modyfikatory bojowe (bez flavor / ekonomii)
// ---------------------------------------------------------------------------
console.log('\nG. isCombatModifierBonus (preBattle filter)');
{
  const rzymBonusy = M.civBonusyForCivKey('rzymianie', civs);
  const walka = rzymBonusy.filter(b => M.isCombatModifierBonus(b));
  eq(walka.length, 1, 'Rzymianie preBattle: 1 bonus (Legion)');
  eq(walka[0].typ, 'bonus_walka', 'Rzymianie: bonus_walka');
  const grecyWalka = grecyBonusy.filter(b => M.isCombatModifierBonus(b));
  eq(grecyWalka.length, 1, 'Grecy preBattle: 1 bonus (Falanga)');
}

// --- summary ---------------------------------------------------------------
console.log('\nciv-bonusy-test: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
