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
const ARMY_MERGE_TS = path.join(GRA_DIR, 'src/game/armyMerge.ts');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
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
// R-MOC-TABLICZKA-CO-POKAZYWAC-Q1=B (Maciej 2026-08-07): sekcja 10 bundluje
// armyMerge.ts, zeby przetestowac PRAWDZIWA funkcje, ktora feeduje tabliczke
// nad zetonem (stackFieldPowerM, wolana z main.ts syncUnitsRender przez
// StackVitalsDeps.defOf) -- nie reimplementacje.
const armyMergeMod = bundle(ARMY_MERGE_TS, 'army-merge-bundle-weterani.cjs');
console.log('Bundle OK.\n');

const {
  VETERAN_BONUS_FRAC,
  veteranLevelFromBattles,
  veteranBattlesWon,
  veteranBattlesSurvived,
  veteranStarCount,
  veteranCombatBonusFrac,
  veteranBonusFracForWins,
  veteranBonusFracForLevel,
  registerBattleWon,
  registerBattleSurvived,
  applyVeteranFracToCombatUnit,
  veteranMoraleBazoweUp,
  veteranMoraleUcieczkiDown,
} = veteranMod;
const { resolveCombat, combatUnitFromDef } = combatMod;
const { applyPostBattleMap } = pbmMod;
const { armyFieldPower, armyFieldPowerSplit } = unitPowerMod;
const { sumRosterFieldM, sumRosterFieldMSplit } = autoBattlePowerMod;
const { stackFieldPowerM } = armyMergeMod;

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
check('VETERAN_BONUS_FRAC[0] === 0', VETERAN_BONUS_FRAC[0] === 0);
check('veteranBonusFracForWins(0) === 0', veteranBonusFracForWins(0) === 0);

// applyVeteranFracToCombatUnit z frac=0 zwraca WEJSCIOWY obiekt bez zmian (bit-identyczny).
const lvl1Cu = applyVeteranFracToCombatUnit(baseCu, 0);
check('applyVeteranFracToCombatUnit(cu,0) === cu (ten sam obiekt)', lvl1Cu === baseCu);
console.log('');

// ---------------------------------------------------------------------------
// 2. Po 1 wygranej: poziom premii 2 (+10%), 1 gwiazdka.
// ---------------------------------------------------------------------------
console.log('2. ★ (1 wygrana) -- +10%, 1 gwiazdka');
check('veteranLevelFromBattles(1) === 2', veteranLevelFromBattles(1) === 2);
check('veteranStarCount({ battlesSurvived: 1 }) === 1', veteranStarCount({ battlesSurvived: 1 }) === 1);
const frac1 = veteranBonusFracForWins(1);
check('VETERAN_BONUS_FRAC[1] === 0.10', VETERAN_BONUS_FRAC[1] === 0.10, VETERAN_BONUS_FRAC[1]);
check('veteranBonusFracForWins(1) === 0.10', frac1 === 0.10, frac1);
const lvl1WinCu = applyVeteranFracToCombatUnit(baseCu, frac1);
check('meleeAttack == baza x1.10 (4.4)', approxEq(lvl1WinCu.meleeAttack, 4 * 1.10), lvl1WinCu.meleeAttack);
check('weaponDamage == baza x1.10 (4.4)', approxEq(lvl1WinCu.weaponDamage, 4 * 1.10), lvl1WinCu.weaponDamage);
check('health == baza x1.10 (24.2)', approxEq(lvl1WinCu.health, 22 * 1.10), lvl1WinCu.health);
check('armor BEZ ZMIAN (2)', lvl1WinCu.armor === 2, lvl1WinCu.armor);
check(
  'Prog dezercji == baza x0.90 (0.36) -- ODWROCONE, w DOL',
  approxEq(lvl1WinCu['Prog dezercji (% health)'], 0.4 * 0.90, 1e-6),
  lvl1WinCu['Prog dezercji (% health)'],
);
console.log('');

// ---------------------------------------------------------------------------
// 2b. Po 2 wygranych: ★★ (+15%).
// ---------------------------------------------------------------------------
console.log('2b. ★★ (2 wygrane) -- +15%, 2 gwiazdki');
check('veteranLevelFromBattles(2) === 2 (etykieta Doświadczony)', veteranLevelFromBattles(2) === 2);
check('veteranStarCount({ battlesSurvived: 2 }) === 2', veteranStarCount({ battlesSurvived: 2 }) === 2);
const frac2 = veteranBonusFracForWins(2);
check('VETERAN_BONUS_FRAC[2] === 0.15', VETERAN_BONUS_FRAC[2] === 0.15, frac2);
check('veteranBonusFracForWins(2) === 0.15', frac2 === 0.15, frac2);
const lvl2Cu = applyVeteranFracToCombatUnit(baseCu, frac2);
check('meleeAttack == baza x1.15 (4.6)', approxEq(lvl2Cu.meleeAttack, 4 * 1.15), lvl2Cu.meleeAttack);
check('weaponDamage == baza x1.15 (4.6)', approxEq(lvl2Cu.weaponDamage, 4 * 1.15), lvl2Cu.weaponDamage);
check('health == baza x1.15 (25.3)', approxEq(lvl2Cu.health, 22 * 1.15), lvl2Cu.health);
check('armor BEZ ZMIAN (2)', lvl2Cu.armor === 2, lvl2Cu.armor);
check(
  'Prog dezercji == baza x0.85 (0.34) -- ODWROCONE, w DOL',
  approxEq(lvl2Cu['Prog dezercji (% health)'], 0.4 * 0.85, 1e-6),
  lvl2Cu['Prog dezercji (% health)'],
);
console.log('');

// ---------------------------------------------------------------------------
// 3. Po 3 wygranych: poziom premii 3, atak wrecz = baza x1.20 (NIE x1.30/x1.32).
// ---------------------------------------------------------------------------
console.log('3. ★★★ (3 wygrane, Weteran) -- +20%, BEZ KUMULACJI');
check('veteranLevelFromBattles(3) === 3', veteranLevelFromBattles(3) === 3);
check('veteranStarCount({ battlesSurvived: 3 }) === 3', veteranStarCount({ battlesSurvived: 3 }) === 3);
const frac3 = veteranBonusFracForWins(3);
check('VETERAN_BONUS_FRAC[3] === 0.20', VETERAN_BONUS_FRAC[3] === 0.20, frac3);
check('veteranBonusFracForWins(3) === 0.20', frac3 === 0.20, frac3);
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
// 4. Po 4. wygranej: nadal poziom 3, nadal x1.20 -- sufit dziala.
// ---------------------------------------------------------------------------
console.log('4. Sufit poziomu 3 -- dalsze wygrane nic nie zmieniaja');
check('veteranLevelFromBattles(4) === 3', veteranLevelFromBattles(4) === 3);
check('veteranLevelFromBattles(5) === 3', veteranLevelFromBattles(5) === 3);
let battles = 0;
for (let i = 0; i < 5; i++) battles = registerBattleWon({ battlesSurvived: battles });
check('registerBattleWon x5 caps battlesSurvived at 3', battles === 3, battles);
check('poziom po 5 rejestracjach === 3', veteranLevelFromBattles(battles) === 3);
const lvl3After4 = applyVeteranFracToCombatUnit(baseCu, veteranBonusFracForWins(battles));
check('meleeAttack po 4. bitwie nadal == baza x1.20 (4.8)', approxEq(lvl3After4.meleeAttack, 4 * 1.20), lvl3After4.meleeAttack);
console.log('');

// ---------------------------------------------------------------------------
// 5 + 6. Integracja applyPostBattleMap -- tylko zwyciezcy awansuja, parytet AI.
// ---------------------------------------------------------------------------
console.log('5+6. Integracja applyPostBattleMap -- tylko wygrani, parytet AI');

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

check('gracz: atakujacy (wygral) battlesSurvived === 1', veteranBattlesWon(player.atk) === 1, player.atk.battlesSurvived);
check('gracz: obronca przezyly (przegral) NIE awansuje', veteranBattlesWon(player.units.find(u => u.id === 'def-1')) === 0);
check('gracz: obronca zabity ("def-2") usuniety z units', !player.units.find(u => u.id === 'def-2'));

check('AI: atakujacy (wygral) battlesSurvived === 1', veteranBattlesWon(ai.atk) === 1, ai.atk.battlesSurvived);
check('AI: obronca przezyly (przegral) NIE awansuje', veteranBattlesWon(ai.units.find(u => u.id === 'def-1')) === 0);
check('AI: obronca zabity usuniety z units', !ai.units.find(u => u.id === 'def-2'));

check(
  'PARYTET: zwyciezca identyczny niezaleznie od ownerId (gracz vs AI)',
  veteranBattlesWon(player.atk) === veteranBattlesWon(ai.atk),
);

function runDefenderWinBattle(ownerAtk, ownerDef) {
  const atk = makeUnit('atk-1', ownerAtk, 0, 0);
  const def = makeUnit('def-1', ownerDef, 1, 0);
  const units = [atk, def];
  const input = {
    units,
    map: {},
    cities: [],
    battleQ: 0,
    battleR: 0,
    atkAnchor: atk,
    atkRoster: [atk],
    defRoster: [def],
    atkStart: new Map([[atk.id, { q: atk.q, r: atk.r }]]),
    winner: 'obronca',
    manualSurvivors: [
      { id: 'atk-1', hp: 5 },
      { id: 'def-1', hp: 20 },
    ],
    getDef: () => ({}),
    maxHpOf: () => 22,
    isPassableHex: () => true,
    isUnitAt: () => false,
  };
  applyPostBattleMap(input);
  return { atk, def };
}

const defWin = runDefenderWinBattle(0, 1);
check('wygrana obroncy: obronca +1 wygrana', veteranBattlesWon(defWin.def) === 1, defWin.def.battlesSurvived);
check('wygrana obroncy: atakujacy (przegral) bez przyrostu', veteranBattlesWon(defWin.atk) === 0);
console.log('');

// ---------------------------------------------------------------------------
// 7. Zapis/wczytanie: pole przetrwa JSON round-trip; brak pola = poziom 1.
// ---------------------------------------------------------------------------
console.log('7. Zapis gry -- round-trip + kompatybilnosc wsteczna');
const savedUnit = { id: 'x', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 0, r: 0, ruch: 2, ruchLeft: 2, battlesSurvived: 3 };
const roundTripped = JSON.parse(JSON.stringify(savedUnit));
check('battlesSurvived przetrwal JSON round-trip (3)', roundTripped.battlesSurvived === 3, roundTripped.battlesSurvived);
check('poziom po round-tripie === 3 (Weteran)', veteranLevelFromBattles(veteranBattlesWon(roundTripped)) === 3);

const oldSaveUnit = { id: 'y', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 0, r: 0, ruch: 2, ruchLeft: 2 };
// brak pola battlesSurvived (stary zapis) -- nie moze wysypac gry, ma dac poziom 1.
check('stary zapis bez pola -> veteranBattlesWon === 0 (brak wyjatku)', veteranBattlesWon(oldSaveUnit) === 0);
check('stary zapis bez pola -> poziom 1', veteranLevelFromBattles(veteranBattlesWon(oldSaveUnit)) === 1);
check('undefined caly obiekt -> poziom 1 (brak wyjatku)', veteranLevelFromBattles(veteranBattlesWon(undefined)) === 1);
console.log('');

// ---------------------------------------------------------------------------
// Korekta wlasciciela (2026-07-25 wieczorem): Morale bazowe w gore, Morale
// ucieczki w dol, z zabezpieczeniem podlogi dla malych wartosci.
// ---------------------------------------------------------------------------
console.log('8. Korekta: Morale bazowe (w gore) / Morale ucieczki (w dol)');
check('Morale bazowe (50) ★ == ceil(50*1.10)=55', veteranMoraleBazoweUp(50, 0.10) === 55, veteranMoraleBazoweUp(50, 0.10));
check('Morale bazowe (50) ★★ == ceil(50*1.15)=58', veteranMoraleBazoweUp(50, 0.15) === 58, veteranMoraleBazoweUp(50, 0.15));
check('Morale bazowe (50) ★★★ == ceil(50*1.20)=60', veteranMoraleBazoweUp(50, 0.20) === 60, veteranMoraleBazoweUp(50, 0.20));
check('Morale ucieczki (22) ★ == floor(22*0.90)=19', veteranMoraleUcieczkiDown(22, 0.10) === 19, veteranMoraleUcieczkiDown(22, 0.10));
check('Morale ucieczki (22) ★★ == floor(22*0.85)=18', veteranMoraleUcieczkiDown(22, 0.15) === 18, veteranMoraleUcieczkiDown(22, 0.15));
check('Morale ucieczki (22) ★★★ == floor(22*0.80)=17', veteranMoraleUcieczkiDown(22, 0.20) === 17, veteranMoraleUcieczkiDown(22, 0.20));
check('Morale ucieczki maleje: 17 < 18 < 19 < 22', 17 < 18 && 18 < 19 && 19 < 22);

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

const mRekrut = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 0)); // 0 wygranych
const m1Win = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 1)); // ★ +10%
const m2Wins = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 2)); // ★★ +15%
const mWeteran = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 3)); // ★★★ +20%

check(
  'Auto-moc: M rosnie z kazda gwiazdka (rekrut ' + mRekrut + ' < ★ ' + m1Win + ' < ★★ ' + m2Wins + ' < ★★★ ' + mWeteran + ')',
  mRekrut < m1Win && m1Win < m2Wins && m2Wins < mWeteran,
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
  'Auto-moc: brak kumulacji -- M ★★★ != M ★★ dalsze +20% (' + mWeteran + ' != ' + Math.round((m2Wins * 1.20 - konnicaArmor * 0.20) * 10) / 10 + ')',
  Math.abs(mWeteran - Math.round((m2Wins * 1.20 - konnicaArmor * 0.20) * 10) / 10) > 0.01,
);

// Rozbicie Atak/Obrona (unit-power.ts armyFieldPowerSplit): premia weterana
// (w odroznieniu od bonusu murow/terenu C-COMBAT-Q1, ktory dotyka WYLACZNIE
// Obrony) ma prawo podniesc OBIE skladowe -- to inny, niezalezny system
// (patrz veteran.ts naglowek: "W GORE -- meleeAttack, meleeDefence, ...").
const splitRekrut = armyFieldPowerSplit(veteranScaledUnitRow(konnicaRaw, 0));
const splitWeteran = armyFieldPowerSplit(veteranScaledUnitRow(konnicaRaw, 3));
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
const mWeteranCopyA = armyFieldPower(veteranScaledUnitRow({ ...konnicaRaw }, 3));
const mWeteranCopyB = armyFieldPower(veteranScaledUnitRow({ ...konnicaRaw }, 3));
check(
  'PARYTET AI: veteranCombatBonusFrac/armyFieldPower nie zalezy od ownerId (brak parametru ownerId w ogole) -- M identyczne (' + mWeteranCopyA + ' == ' + mWeteranCopyB + ')',
  mWeteranCopyA === mWeteranCopyB,
);

// Roster-poziom: sumRosterFieldM/sumRosterFieldMSplit -- funkcje, ktorych
// FAKTYCZNIE uzywa main.ts rosterFieldPowerM/effectiveDefenderM po naprawie
// (patrz main.ts ~L12177-12182, ~L12220-12222).
const rosterRekrut = [{ typeId: 'Konnica', def: veteranScaledUnitRow(konnicaRaw, 0) }];
const rosterWeteran = [{ typeId: 'Konnica', def: veteranScaledUnitRow(konnicaRaw, 3) }];
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
// 10. R-MOC-TABLICZKA-CO-POKAZYWAC-Q1=B (Maciej 2026-08-07): tabliczka nad
// zetonem (i panel pre-battle) maja pokazywac Moc EFEKTYWNA, nie nominalna.
// Wdrozenie: game/armyMerge.ts::stackFieldPowerM sam sie NIE zmienil -- to
// wciaz sumRosterFieldM(stack.map(u => ({typeId, def: defOf(u)}))). Zmienilo
// sie WYLACZNIE `defOf` wstrzykiwane z main.ts (syncUnitsRender), ktore od tej
// decyzji przekazuje combatPowerScaledDefFor(u) zamiast surowego lookupUnitDef.
// Ten test wola PRAWDZIWA stackFieldPowerM() (nie reimplementacje) z DWOMA
// wariantami defOf -- nominalnym (stary main.ts::defForUnit) i weteransko-
// przeskalowanym (main.ts::combatPowerScaledDefFor dla gracza, jednostka NIE
// ufortyfikowana -- wtedy combatPowerScaledDefFor == veteranScaledDefFor,
// patrz main.ts fortifyFieldScaledDefFor/combatPowerScaledDefFor) -- i dowodzi,
// ze podmiana defOf faktycznie zmienia liczbe na tabliczce z 49 na 58.0,
// dokladnie jak w sekcji 9 (auto-bitwa) -- ZERO ROZJAZDU miedzy tabliczka a
// wynikiem auto-walki dla tego samego skladu.
// ---------------------------------------------------------------------------
console.log('10. Tabliczka/pre-battle (armyMerge.ts::stackFieldPowerM) -- Moc EFEKTYWNA');

const stackKonnicaWeteran = [{ id: 'u1', typeId: 'Konnica', ownerId: 0 }];

const mTabliczkaNominalna = stackFieldPowerM(stackKonnicaWeteran, (u) => konnicaRaw);
check(
  'PRZED (nominalna, C-MOC-Q1=A): stackFieldPowerM(Konnica gwiazdki=3, defOf=nominalny) == 49',
  approxEq(mTabliczkaNominalna, 49, 0.05),
  mTabliczkaNominalna,
);

const mTabliczkaEfektywna = stackFieldPowerM(
  stackKonnicaWeteran,
  (u) => veteranScaledUnitRow(konnicaRaw, 3), // battlesSurvived=3 -> ★★★, frac=0.20
);
check(
  'PO (efektywna, R-MOC-TABLICZKA-CO-POKAZYWAC-Q1=B): stackFieldPowerM(Konnica gwiazdki=3, defOf=weteran-przeskalowany) == 58.0',
  approxEq(mTabliczkaEfektywna, expectedMWeteran, 0.05),
  mTabliczkaEfektywna + ' vs oczekiwane ' + expectedMWeteran,
);
check(
  'Tabliczka PO == Auto-moc (M) sekcji 9 dla identycznego skladu (58.0 == 58.0, zero rozjazdu)',
  approxEq(mTabliczkaEfektywna, mWeteran, 0.05),
  mTabliczkaEfektywna + ' vs ' + mWeteran,
);
check(
  'Tabliczka PO (58) > tabliczka PRZED (49) -- premia weterana teraz WIDOCZNA na tokenie',
  mTabliczkaEfektywna > mTabliczkaNominalna,
);

// Sekcje 9-10 wyzej dowodza tylko, ze WSTRZYKNIETA przeskalowana definicja daje
// 58 -- nie dowodza, ze main.ts FAKTYCZNIE wstrzykuje ja do tabliczki. Cofniecie
// jedynej istotnej linii (main.ts::syncUnitsRender, StackVitalsDeps.defOf)
// zostawiloby powyzsze testy zielonymi. Asercja zrodlowa lapie wlasnie to
// (Evaluator, nota N7, 2026-08-07): czyta main.ts jako tekst (wzor jak w
// tools/plony-budynkow-test.cjs) i sprawdza literalne wstrzykniecie.
const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');
const hasCombatPowerScaledDefOf = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*combatPowerScaledDefFor\(u\)/.test(mainTsSrc);
check(
  'ZRODLO main.ts: StackVitalsDeps.defOf wstrzykuje combatPowerScaledDefFor(u) (nie surowy defForUnit/lookupUnitDef) -- lapie cofniecie zmiany #1',
  hasCombatPowerScaledDefOf,
  hasCombatPowerScaledDefOf ? 'OK' : 'wzorzec "defOf: (u: RuntimeUnit) => combatPowerScaledDefFor(u)" NIE znaleziony w main.ts',
);
console.log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');
if (failCount > 0) process.exit(1);
