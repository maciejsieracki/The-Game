/**
 * weterani-test.cjs
 * Test harness dla TRZECIEGO systemu ulepszen jednostek: doswiadczenie
 * bojowe / weterani (src/game/veteran.ts, decyzja wlasciciela 2026-07-25).
 *
 * Konwencja jak tools/combat-test.cjs:
 *   1. esbuild bundluje src/game/veteran.ts, src/game/combat.ts (importuje
 *      veteran.ts -- inlinowane) i src/game/post-battle-map.ts (jedyny wspolny
 *      hak zliczajacy przezyte bitwy) do CJS w os.tmpdir().
 *   2. require() kazdego bundla.
 *   3. Laduje data/units.json, buduje CombatUnit z jednego rzeczywistego
 *      wiersza (Wojownik) tak samo jak combat-test.cjs (adaptUnit()).
 *   4. Asercje 1-7 z zadania + korekta wlasciciela (Morale bazowe/ucieczki).
 *
 * Usage (z gra/): node tools/weterani-test.cjs
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const VETERAN_TS = path.join(GRA_DIR, 'src/game/veteran.ts');
const COMBAT_TS = path.join(GRA_DIR, 'src/game/combat.ts');
const PBM_TS = path.join(GRA_DIR, 'src/game/post-battle-map.ts');
const UNIT_POWER_TS = path.join(GRA_DIR, 'src/game/unit-power.ts');
const AUTO_BATTLE_POWER_TS = path.join(GRA_DIR, 'src/game/auto-battle-power.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');

function bundle(entry, outName) {
  const outfile = path.join(os.tmpdir(), outName);
  execSync(
    '"' + ESBUILD_BIN + '" "' + entry + '" --bundle --platform=node --format=cjs --outfile="' + outfile + '"',
    { stdio: 'inherit' },
  );
  return require(outfile);
}

console.log('Bundling veteran.ts, combat.ts, post-battle-map.ts, unit-power.ts, auto-battle-power.ts with esbuild...');
const veteranMod = bundle(VETERAN_TS, 'veteran-bundle.cjs');
const combatMod = bundle(COMBAT_TS, 'combat-bundle-weterani.cjs');
const pbmMod = bundle(PBM_TS, 'pbm-bundle-weterani.cjs');
// Audyt 2026-07-26 (C-COMBAT-Q1, fala 2): sciezka Auto-walka moca
// (unit-power.ts + auto-battle-power.ts) nie miala ZADNEJ asercji weteranskiej
// -- to wlasnie dlatego luka (main.ts czytal unitDefFor() bez skalowania)
// przezyla poprzedni audyt. Sekcja 9 ponizej pokrywa te sciezke.
const unitPowerMod = bundle(UNIT_POWER_TS, 'unit-power-bundle-weterani.cjs');
const autoBattlePowerMod = bundle(AUTO_BATTLE_POWER_TS, 'auto-battle-power-bundle-weterani.cjs');
console.log('Bundle OK.\n');

const {
  VETERAN_BONUS_FRAC,
  veteranLevelFromBattles,
  veteranBattlesSurvived,
  veteranCombatBonusFrac,
  registerBattleSurvived,
  applyVeteranFracToCombatUnit,
  veteranMoraleBazoweUp,
  veteranMoraleUcieczkiDown,
} = veteranMod;
const { resolveCombat, combatUnitFromDef } = combatMod;
const { applyPostBattleMap } = pbmMod;
const { armyFieldPower, armyFieldPowerSplit } = unitPowerMod;
const { sumRosterFieldM, sumRosterFieldMSplit } = autoBattlePowerMod;

let passCount = 0;
let failCount = 0;

function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

function approxEq(a, b, eps) {
  eps = eps === undefined ? 1e-9 : eps;
  return Math.abs(a - b) < eps;
}

// ---------------------------------------------------------------------------
// Fixture: Wojownik (units.json) -- meleeAttack=4, weaponDamage=4, health=22,
// armor=2, "Prog dezercji (% health)"=0.4, "Morale bazowe"=50, "Morale ucieczki"=22.
// ---------------------------------------------------------------------------
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const wojownikRaw = unitsRaw.find(u => u['Jednostka'] === 'Wojownik');
if (!wojownikRaw) { console.error('Fixture unit "Wojownik" not found in units.json'); process.exit(1); }

const baseCu = combatUnitFromDef(wojownikRaw, { typNazwa: 'Wojownik' });

console.log('========================================================================');
console.log('WETERANI TEST HARNESS -- trzeci system (doswiadczenie bojowe)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. Nowo wyprodukowana jednostka = statystyki DOKLADNIE jak w units.json.
// ---------------------------------------------------------------------------
console.log('1. Poziom 1 (Rekrut) -- zero premii');
check('meleeAttack == baza (4)', baseCu.meleeAttack === 4, baseCu.meleeAttack);
check('weaponDamage == baza (4)', baseCu.weaponDamage === 4, baseCu.weaponDamage);
check('health == baza (22)', baseCu.health === 22, baseCu.health);
check('armor == baza (2)', baseCu.armor === 2, baseCu.armor);
check('Prog dezercji == baza (0.4)', baseCu['Prog dezercji (% health)'] === 0.4, baseCu['Prog dezercji (% health)']);
check('veteranLevelFromBattles(0) === 1', veteranLevelFromBattles(0) === 1);
check('VETERAN_BONUS_FRAC[1] === 0', VETERAN_BONUS_FRAC[1] === 0);

// applyVeteranFracToCombatUnit z frac=0 zwraca WEJSCIOWY obiekt bez zmian (bit-identyczny).
const lvl1Cu = applyVeteranFracToCombatUnit(baseCu, 0);
check('applyVeteranFracToCombatUnit(cu,0) === cu (ten sam obiekt)', lvl1Cu === baseCu);
console.log('');

// ---------------------------------------------------------------------------
// 2. Po 1 przezytej bitwie: poziom 2, atak wrecz = baza x1.10, pancerz bez zmian.
// ---------------------------------------------------------------------------
console.log('2. Poziom 2 (1 przezyta bitwa) -- +10%');
check('veteranLevelFromBattles(1) === 2', veteranLevelFromBattles(1) === 2);
const frac2 = VETERAN_BONUS_FRAC[2];
check('VETERAN_BONUS_FRAC[2] === 0.10', frac2 === 0.10, frac2);
const lvl2Cu = applyVeteranFracToCombatUnit(baseCu, frac2);
check('meleeAttack == baza x1.10 (4.4)', approxEq(lvl2Cu.meleeAttack, 4 * 1.10), lvl2Cu.meleeAttack);
check('weaponDamage == baza x1.10 (4.4)', approxEq(lvl2Cu.weaponDamage, 4 * 1.10), lvl2Cu.weaponDamage);
check('health == baza x1.10 (24.2)', approxEq(lvl2Cu.health, 22 * 1.10), lvl2Cu.health);
check('armor BEZ ZMIAN (2)', lvl2Cu.armor === 2, lvl2Cu.armor);
check(
  'Prog dezercji == baza x0.90 (0.36) -- ODWROCONE, w DOL',
  approxEq(lvl2Cu['Prog dezercji (% health)'], 0.4 * 0.90, 1e-6),
  lvl2Cu['Prog dezercji (% health)'],
);
console.log('');

// ---------------------------------------------------------------------------
// 3. Po 2 przezytych bitwach: poziom 3, atak wrecz = baza x1.20 (NIE x1.30/x1.32).
// ---------------------------------------------------------------------------
console.log('3. Poziom 3 (Weteran, 2 przezyte bitwy) -- +20%, BEZ KUMULACJI');
check('veteranLevelFromBattles(2) === 3', veteranLevelFromBattles(2) === 3);
const frac3 = VETERAN_BONUS_FRAC[3];
check('VETERAN_BONUS_FRAC[3] === 0.20', frac3 === 0.20, frac3);
const lvl3Cu = applyVeteranFracToCombatUnit(baseCu, frac3);
check('meleeAttack == baza x1.20 (4.8)', approxEq(lvl3Cu.meleeAttack, 4 * 1.20), lvl3Cu.meleeAttack);
check('meleeAttack != baza x1.30 (5.2) -- brak kumulacji', !approxEq(lvl3Cu.meleeAttack, 4 * 1.30));
check('meleeAttack != baza x1.32 (5.28) -- brak kumulacji 1.10*1.20', !approxEq(lvl3Cu.meleeAttack, 4 * 1.10 * 1.20));
check('armor BEZ ZMIAN (2)', lvl3Cu.armor === 2, lvl3Cu.armor);
check(
  'Prog dezercji == baza x0.80 (0.32)',
  approxEq(lvl3Cu['Prog dezercji (% health)'], 0.4 * 0.80, 1e-6),
  lvl3Cu['Prog dezercji (% health)'],
);
console.log('');

// ---------------------------------------------------------------------------
// 4. Po 3. i 4. bitwie: nadal poziom 3, nadal x1.20 -- sufit dziala.
// ---------------------------------------------------------------------------
console.log('4. Sufit poziomu 3 -- dalsze bitwy nic nie zmieniaja');
check('veteranLevelFromBattles(3) === 3', veteranLevelFromBattles(3) === 3);
check('veteranLevelFromBattles(4) === 3', veteranLevelFromBattles(4) === 3);
let battles = 0;
for (let i = 0; i < 4; i++) battles = registerBattleSurvived({ battlesSurvived: battles });
check('registerBattleSurvived x4 caps battlesSurvived at 2', battles === 2, battles);
check('poziom po 4 rejestracjach === 3', veteranLevelFromBattles(battles) === 3);
const lvl3After4 = applyVeteranFracToCombatUnit(baseCu, VETERAN_BONUS_FRAC[veteranLevelFromBattles(battles)]);
check('meleeAttack po 4. bitwie nadal == baza x1.20 (4.8)', approxEq(lvl3After4.meleeAttack, 4 * 1.20), lvl3After4.meleeAttack);
console.log('');

// ---------------------------------------------------------------------------
// 5 + 6. Integracja: applyPostBattleMap (post-battle-map.ts) -- jedyny wspolny
// hak zliczania przezytej bitwy. Testujemy: zabita jednostka NIE awansuje,
// a gracz (ownerId=0) i AI (ownerId=1) awansuja IDENTYCZNIE (parytet).
// ---------------------------------------------------------------------------
console.log('5+6. Integracja applyPostBattleMap -- smierc nie awansuje, parytet AI');

function makeUnit(id, ownerId, q, r) {
  return {
    id, ownerId, typeId: 'Wojownik', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2,
  };
}

function runOneBattle(ownerAtk, ownerDef) {
  const atk = makeUnit('atk-1', ownerAtk, 0, 0);
  const def = makeUnit('def-1', ownerDef, 1, 0);
  const defDies = makeUnit('def-2', ownerDef, 1, 1);
  const units = [atk, def, defDies];

  const input = {
    units,
    map: {},
    cities: [],
    battleQ: 0,
    battleR: 0,
    atkAnchor: atk,
    atkRoster: [atk],
    defRoster: [def, defDies],
    atkStart: new Map([[atk.id, { q: atk.q, r: atk.r }]]),
    winner: 'atakujacy',
    // manualSurvivors: TYLKO 'def-1' przezywa; 'def-2' ginie (nie ma go na liscie).
    manualSurvivors: [
      { id: 'atk-1', hp: 20 },
      { id: 'def-1', hp: 5 },
    ],
    getDef: () => ({}),
    maxHpOf: () => 22,
    isPassableHex: () => true,
    isUnitAt: () => false,
  };

  applyPostBattleMap(input);
  return { units, atk, def, defDies };
}

const player = runOneBattle(0, 1); // gracz atakuje AI
const ai = runOneBattle(1, 0); // AI atakuje gracza (role odwrocone, ownerId zamienione)

check('gracz: atakujacy (przezyl) battlesSurvived === 1', veteranBattlesSurvived(player.atk) === 1, player.atk.battlesSurvived);
check('gracz: obronca przezyly battlesSurvived === 1', player.units.find(u => u.id === 'def-1').battlesSurvived === 1);
check('gracz: obronca zabity ("def-2") usuniety z units (nie awansuje)', !player.units.find(u => u.id === 'def-2'));

check('AI: atakujacy (przezyl) battlesSurvived === 1', ai.atk.battlesSurvived === 1, ai.atk.battlesSurvived);
check('AI: obronca przezyly battlesSurvived === 1', ai.units.find(u => u.id === 'def-1').battlesSurvived === 1);
check('AI: obronca zabity usuniety z units (nie awansuje)', !ai.units.find(u => u.id === 'def-2'));

check(
  'PARYTET: wynik identyczny niezaleznie od ownerId (gracz vs AI)',
  veteranBattlesSurvived(player.atk) === veteranBattlesSurvived(ai.atk)
  && player.units.find(u => u.id === 'def-1').battlesSurvived === ai.units.find(u => u.id === 'def-1').battlesSurvived,
);
console.log('');

// ---------------------------------------------------------------------------
// 7. Zapis/wczytanie: pole przetrwa JSON round-trip; brak pola = poziom 1.
// ---------------------------------------------------------------------------
console.log('7. Zapis gry -- round-trip + kompatybilnosc wsteczna');
const savedUnit = { id: 'x', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 0, r: 0, ruch: 2, ruchLeft: 2, battlesSurvived: 2 };
const roundTripped = JSON.parse(JSON.stringify(savedUnit));
check('battlesSurvived przetrwal JSON round-trip (2)', roundTripped.battlesSurvived === 2, roundTripped.battlesSurvived);
check('poziom po round-tripie === 3', veteranLevelFromBattles(veteranBattlesSurvived(roundTripped)) === 3);

const oldSaveUnit = { id: 'y', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 0, r: 0, ruch: 2, ruchLeft: 2 };
// brak pola battlesSurvived (stary zapis) -- nie moze wysypac gry, ma dac poziom 1.
check('stary zapis bez pola -> veteranBattlesSurvived === 0 (brak wyjatku)', veteranBattlesSurvived(oldSaveUnit) === 0);
check('stary zapis bez pola -> poziom 1', veteranLevelFromBattles(veteranBattlesSurvived(oldSaveUnit)) === 1);
check('undefined caly obiekt -> poziom 1 (brak wyjatku)', veteranLevelFromBattles(veteranBattlesSurvived(undefined)) === 1);
console.log('');

// ---------------------------------------------------------------------------
// Korekta wlasciciela (2026-07-25 wieczorem): Morale bazowe w gore, Morale
// ucieczki w dol, z zabezpieczeniem podlogi dla malych wartosci.
// ---------------------------------------------------------------------------
console.log('8. Korekta: Morale bazowe (w gore) / Morale ucieczki (w dol)');
check('Morale bazowe (50) poziom2 == ceil(50*1.10)=55', veteranMoraleBazoweUp(50, 0.10) === 55, veteranMoraleBazoweUp(50, 0.10));
check('Morale bazowe (50) poziom3 == ceil(50*1.20)=60', veteranMoraleBazoweUp(50, 0.20) === 60, veteranMoraleBazoweUp(50, 0.20));
check('Morale ucieczki (22) poziom2 == floor(22*0.90)=19', veteranMoraleUcieczkiDown(22, 0.10) === 19, veteranMoraleUcieczkiDown(22, 0.10));
check('Morale ucieczki (22) poziom3 == floor(22*0.80)=17', veteranMoraleUcieczkiDown(22, 0.20) === 17, veteranMoraleUcieczkiDown(22, 0.20));
check('Morale ucieczki poziom3 < poziom2 < baza (17 < 19 < 22)', 17 < 19 && 19 < 22);

// Zabezpieczenie: najnizsza wartosc "Morale ucieczki" w units.json to 5
// (Berserker germanski) -- floor(5*0.9)=4, floor(5*0.8)=4 (remis na tej samej
// wartosci dla obu poziomow przy tak malej bazie, ale ZAWSZE < baza=5).
check('podloga: Morale ucieczki=5, poziom2 == floor(4.5)=4 (< baza)', veteranMoraleUcieczkiDown(5, 0.10) === 4);
check('podloga: Morale ucieczki=5, poziom3 == floor(4.0)=4 (< baza)', veteranMoraleUcieczkiDown(5, 0.20) === 4);

// Zabezpieczenie: najnizsza wartosc "Prog dezercji" w units.json to 0.1 (kilka
// jednostek elitarnych) -- x0.9=0.09, x0.8=0.08, oba dodatnie, z zapasem.
const progLowCu = applyVeteranFracToCombatUnit(
  { ...baseCu, 'Prog dezercji (% health)': 0.1 }, 0.20,
);
check('podloga: Prog dezercji=0.1, poziom3 == 0.08 (dodatnie, z zapasem)', approxEq(progLowCu['Prog dezercji (% health)'], 0.08, 1e-6), progLowCu['Prog dezercji (% health)']);
console.log('');

// ---------------------------------------------------------------------------
// 9. Sciezka Auto-walka moca (main.ts effectiveDefenderM/rosterFieldPowerM,
// mapFieldBattle.ts duplikat) -- audyt 2026-07-26 (C-COMBAT-Q1, fala 2):
// resolveAutoBattleByPower budowal M ataku/obrony z unitDefFor() CZYSTO z
// units.json, bez zadnego skalowania weteranskiego -- kazda auto-walka
// (kliknij "Auto" ORAZ kazda bitwa AI-vs-AI) ignorowala poziom weterana obu
// stron. Naprawa: main.ts veteranScaledDefFor() / mapFieldBattle.ts
// veteranScaledDef() wolaja TA SAMA applyVeteranFracToCombatUnit() z
// veteran.ts (zero drugiej implementacji) PRZED policzeniem M przez
// unit-power.ts fieldPower/armyFieldPower. Ten test odtwarza dokladnie ten
// przeplyw (unitRow -> applyVeteranFracToCombatUnit -> armyFieldPower/
// sumRosterFieldM) i dowodzi, ze premia faktycznie wchodzi do M.
// ---------------------------------------------------------------------------
console.log('9. Sciezka Auto-moc (M) -- premia weterana musi wejsc do M ataku/obrony');

// Konnica: Atak(26)/Obrona(23) wyraznie rozne skladowe (patrz raport zadania
// -- ten sam fixture co structure-defense-bonus-test.cjs Czesc A).
const konnicaRaw = unitsRaw.find(u => u['Jednostka'] === 'Konnica');
if (!konnicaRaw) { console.error('Fixture unit "Konnica" not found in units.json'); process.exit(1); }

/**
 * Reimplementuje main.ts veteranScaledDefFor()/mapFieldBattle.ts
 * veteranScaledDef() 1:1: unitDefFor(u) (tu: surowy wiersz units.json) +
 * premia z veteranCombatBonusFrac({battlesSurvived}) -> ta sama
 * applyVeteranFracToCombatUnit() jak w produkcyjnym kodzie i jak sekcje 1-8
 * powyzej.
 */
function veteranScaledUnitRow(raw, battlesSurvived) {
  const frac = veteranCombatBonusFrac({ battlesSurvived });
  if (!frac) return raw;
  const scaled = applyVeteranFracToCombatUnit(raw, frac);
  // PUŁAPKA (patrz main.ts veteranScaledDefFor): armyFieldPower() zwraca
  // WPROST scaled.fieldPower (cache eksportu units.json) jesli jest liczba,
  // ignorujac przeskalowane pola -- usuwamy je, zeby wymusic przeliczenie.
  const { fieldPower, ...rest } = scaled;
  return rest;
}

const mRekrut = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 0)); // poziom 1 (Rekrut), 0 przezytych bitew
const mDoswiadczony = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 1)); // poziom 2, +10%
const mWeteran = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 2)); // poziom 3 (Weteran, sufit), +20%

check(
  'Auto-moc: M rosnie z kazdym poziomem weterana (rekrut ' + mRekrut + ' < doswiadczony ' + mDoswiadczony + ' < weteran ' + mWeteran + ')',
  mRekrut < mDoswiadczony && mDoswiadczony < mWeteran,
);
// M bazowe*1.20 NIE jest wprost oczekiwana wartosc: Pancerz jest wylaczony z
// premii weterana (veteran.ts), a Pancerz WCHODZI do M (fieldPower() defense =
// meleeDefence+armor+health/2) -- wiec poprawny wzor to M_bazowe*(1+frac) -
// armor_bazowy*frac (odejmujemy premie, ktorej Pancerz NIE dostaje). Konnica:
// armor=4, wiec 49*1.20 - 4*0.20 = 58.8 - 0.8 = 58.0.
const konnicaArmor = konnicaRaw.armor;
const expectedMWeteran = Math.round((mRekrut * 1.20 - konnicaArmor * 0.20) * 10) / 10;
check(
  'Auto-moc: M poziomu 3 == M bazowe*1.20 minus premia NIE-doliczona do Pancerza (ta sama premia co bitwa ogladana/"Pomin", zero nowej matematyki)',
  approxEq(mWeteran, expectedMWeteran, 0.05),
  mWeteran + ' vs oczekiwane ' + expectedMWeteran,
);
check(
  'Auto-moc: brak kumulacji -- M poziomu 3 != M poziomu2 dalsze +20% (' + mWeteran + ' != ' + Math.round((mDoswiadczony * 1.20 - konnicaArmor * 0.20) * 10) / 10 + ')',
  Math.abs(mWeteran - Math.round((mDoswiadczony * 1.20 - konnicaArmor * 0.20) * 10) / 10) > 0.01,
);

// Rozbicie Atak/Obrona (unit-power.ts armyFieldPowerSplit): premia weterana
// (w odroznieniu od bonusu murow/terenu C-COMBAT-Q1, ktory dotyka WYLACZNIE
// Obrony) ma prawo podniesc OBIE skladowe -- to inny, niezalezny system
// (patrz veteran.ts naglowek: "W GORE -- meleeAttack, meleeDefence, ...").
const splitRekrut = armyFieldPowerSplit(veteranScaledUnitRow(konnicaRaw, 0));
const splitWeteran = armyFieldPowerSplit(veteranScaledUnitRow(konnicaRaw, 2));
check(
  'Auto-moc: weteran podnosi skladowa Ataku (' + splitRekrut.attack + ' -> ' + splitWeteran.attack + ')',
  splitWeteran.attack > splitRekrut.attack,
);
check(
  'Auto-moc: weteran podnosi skladowa Obrony (' + splitRekrut.defense + ' -> ' + splitWeteran.defense + ')',
  splitWeteran.defense > splitRekrut.defense,
);

// PARYTET AI: veteranCombatBonusFrac()/applyVeteranFracToCombatUnit() nie
// odwoluja sie do ownerId -- ta sama jednostka (ten sam battlesSurvived) musi
// dac IDENTYCZNE M niezaleznie od tego, czy "nalezy" do gracza czy do AI (tu
// symulowane przez dwie oddzielne kopie tego samego wiersza -- funkcje testowane
// nie przyjmuja ownerId w ogole, wiec identycznosc jest gwarantowana STRUKTURALNIE,
// nie przez przypadek fixture'u).
const mWeteranCopyA = armyFieldPower(veteranScaledUnitRow({ ...konnicaRaw }, 2));
const mWeteranCopyB = armyFieldPower(veteranScaledUnitRow({ ...konnicaRaw }, 2));
check(
  'PARYTET AI: veteranCombatBonusFrac/armyFieldPower nie zalezy od ownerId (brak parametru ownerId w ogole) -- M identyczne (' + mWeteranCopyA + ' == ' + mWeteranCopyB + ')',
  mWeteranCopyA === mWeteranCopyB,
);

// Roster-poziom: sumRosterFieldM/sumRosterFieldMSplit -- funkcje, ktorych
// FAKTYCZNIE uzywa main.ts rosterFieldPowerM/effectiveDefenderM po naprawie
// (patrz main.ts ~L12177-12182, ~L12220-12222).
const rosterRekrut = [{ typeId: 'Konnica', def: veteranScaledUnitRow(konnicaRaw, 0) }];
const rosterWeteran = [{ typeId: 'Konnica', def: veteranScaledUnitRow(konnicaRaw, 2) }];
check(
  'sumRosterFieldM: roster z jednostka-weteranem (poziom 3) daje WYZSZE M niz identyczny sklad z rekrutem (' + sumRosterFieldM(rosterRekrut) + ' -> ' + sumRosterFieldM(rosterWeteran) + ')',
  sumRosterFieldM(rosterWeteran) > sumRosterFieldM(rosterRekrut),
);
const rosterSplitWeteran = sumRosterFieldMSplit(rosterWeteran);
check(
  'sumRosterFieldMSplit: attack+defense == sumRosterFieldM rowniez PO doliczeniu weterana (zgodnosc z rankingiem Mocy)',
  approxEq(rosterSplitWeteran.attack + rosterSplitWeteran.defense, sumRosterFieldM(rosterWeteran), 0.05),
  (rosterSplitWeteran.attack + rosterSplitWeteran.defense) + ' vs ' + sumRosterFieldM(rosterWeteran),
);
console.log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');
if (failCount > 0) process.exit(1);
