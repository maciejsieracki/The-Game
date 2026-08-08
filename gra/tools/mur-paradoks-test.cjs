'use strict';
/**
 * mur-paradoks-test.cjs
 *
 * R-MOC-DEFINICJA-Q1 (Maciej 2026-08-08): "Moc" WYŚWIETLANA graczowi (tabliczka
 * nad żetonem, tooltip, panel rankingu, HUD, Empire) NIGDY nie liczy budynków
 * ani terenu -- tylko własne wskaźniki jednostki + premia weterana. Rzeczywiste
 * rozstrzygnięcie bitwy (effectiveDefenderM, gałąź isCity) nadal liczy PEŁNY
 * bonus struktury obronnej (mur/Palisada/Cytadela/Baszta) i mnożnik terenu --
 * TEGO test nie rusza.
 *
 * Ten plik to CZĘŚCIOWE COFNIĘCIE R-MOC-MUR-PARADOKS-Q1=A (2026-08-07,
 * commit f94216e), na mocy R-MOC-DEFINICJA-Q1 (2026-08-08): funkcja
 * main.ts::tabliczkaGarnizonScaledDefFor(), która dla garnizonu za murem
 * dociągała bonus struktury/terenu NA TABLICZKĘ, została USUNIĘTA. Tabliczka
 * znów woła gołe combatPowerScaledDefFor(u) (weteran + trudność AI, BEZ
 * muru/terenu) -- dokładnie jak przed R-MOC-MUR-PARADOKS-Q1=A.
 *
 * Skutek -- PARADOKS WRACA, ale jest teraz ŚWIADOMY i ZAAKCEPTOWANY (nie błąd
 * do naprawienia): tabliczka garnizonu W MIEŚCIE Z MUREM pokazuje TĘ SAMĄ
 * (a wręcz NIŻSZĄ, patrz p. 1-2 niżej) Moc co garnizon w mieście BEZ ŻADNEGO
 * budynku obronnego, mimo że realna Obrona TEGO miasta w bitwie
 * (effectiveDefenderM, main.ts, NIETKNIĘTE) rośnie do +400%. Powód spadku:
 * fortifyFieldScaledDefFor dolicza własny +50% Obrony garnizonu TYLKO gdy
 * miasto NIE ma budynku obronnego (unitGetsFortifyDefenseBonus zwraca false,
 * gdy jest mur) -- skoro tabliczka już nie dokłada kompensującego bonusu
 * struktury, ten -50% "dziurę" znów widać na tabliczce. To jest teraz
 * ZAMIERZONE: tabliczka ma pokazywać WYŁĄCZNIE własne wskaźniki jednostki +
 * weterana, bez względu na to, co to oznacza dla monotoniczności względem
 * budynków miasta.
 *
 * Co sprawdza ten test (bez importu main.ts -- main.ts uruchamia caly silnik
 * gry/DOM, wiec esbuild --bundle go nie rozwiazuje w izolacji; konwencja jak
 * structure-defense-bonus-test.cjs -- bunduje PRAWDZIWE cegielki main.ts
 * faktycznie uzywa, i reimplementuje WZOR main.ts::combatPowerScaledDefFor
 * 1:1 z tych cegielek, zeby porownac PRAWDZIWA stackFieldPowerM z oczekiwana
 * liczba):
 *
 *   1. Fixture Konnica (rekrut, garnizon, teren plaski -- brak wzniesienia,
 *      wiec cityGatedTerrainMultiplier=1.0, izolujemy czysty efekt struktury):
 *      tabliczka W MIEŚCIE Z MUREM (bez fortify-field, BEZ bonusu struktury
 *      -- decyzja R-MOC-DEFINICJA-Q1) <= tabliczka BEZ ŻADNEGO budynku
 *      obronnego (dzisiejszy, niezmieniony fortify-field +50% garnizonu).
 *   2. Tabliczka z murem == Moc bazowa surowa (żaden bonus jej nie dotyka --
 *      ani fortify-field, bo mur go wyłącza, ani struktura, bo tabliczka jej
 *      już nie dolicza).
 *   3. Monotoniczność ZNIKA (świadomie): tabliczka z Murami == tabliczka z
 *      Murami+Cytadela == tabliczka z Murami+Cytadela+Baszta -- więcej
 *      budynków obronnych NIE zmienia tabliczki (nigdy nie dociąga struktury).
 *   4. Jednostka NIE w garnizonie (w polu) -- tabliczka bez zmian względem
 *      dzisiejszego combatPowerScaledDefFor (zachowanie sprzed i po decyzji
 *      identyczne, bez zmian).
 *   5. Realna Obrona (effectiveDefenderM, main.ts, NIETKNIĘTE) tego samego
 *      garnizonu za murem JEST WYŻSZA niż wartość na tabliczce -- to jest
 *      ŚWIADOMY, udokumentowany paradoks (R-MOC-DEFINICJA-Q1), nie błąd.
 *   6. ZRODLO main.ts: literalna asercja tekstowa, ze
 *      (a) defOf tabliczki (syncUnitsRender) wola goly combatPowerScaledDefFor(u)
 *          (NIE tabliczkaGarnizonScaledDefFor) -- lapie cofniecie tej decyzji;
 *      (b) funkcja main.ts::tabliczkaGarnizonScaledDefFor NIE ISTNIEJE już w
 *          pliku (martwy kod usunięty razem z jedynym wywołującym);
 *      (c) combatPowerScaledDefFor() SAMA w sobie NIE dolicza structBonusPct/
 *          cityGatedTerrainMultiplier -- lapie regresje podwojnego liczenia
 *          bonusu w main.ts effectiveDefenderM;
 *      (d) effectiveDefenderM nadal buduje defRoster przez
 *          combatPowerScaledDefFor(u) -- realna bitwa NIETKNIĘTA.
 *
 * Usage (z gra/): node tools/mur-paradoks-test.cjs
 */

const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const MIASTO_PARAMS_JSON = path.join(GRA_DIR, 'data/miasto-params.json');
const COMBAT_PARAMS_JSON = path.join(GRA_DIR, 'data/combat-params.json');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

// ---------------------------------------------------------------------------
// Bundle: unit-power.ts + city-defense.ts + armyMerge.ts (dokladnie te pliki,
// ktorych main.ts::combatPowerScaledDefFor / effectiveDefenderM faktycznie
// uzywaja dla skladowej garnizon+fortify-field+struktura).
// ---------------------------------------------------------------------------
const ENTRY = path.join(__dirname, '.mur-paradoks-entry.ts');
const BUNDLE = path.join(__dirname, '.mur-paradoks-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  [
    "export { armyFieldPower, armyFieldPowerSplit } from '../src/game/unit-power';",
    "export { cityWallDefenseBonusPercent, unitGetsFortifyDefenseBonus, fieldFortifyDefenseBonus } from '../src/game/city-defense';",
    "export { stackFieldPowerM } from '../src/game/armyMerge';",
  ].join('\n'),
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: GRA_DIR,
  logLevel: 'silent',
});
const {
  armyFieldPower,
  armyFieldPowerSplit,
  cityWallDefenseBonusPercent,
  unitGetsFortifyDefenseBonus,
  fieldFortifyDefenseBonus,
  stackFieldPowerM,
} = require(BUNDLE);
fs.unlinkSync(ENTRY);

// ---------------------------------------------------------------------------
// Data (identyczne zrodlo co gra -- zero hardkodowanych liczb balansu)
// ---------------------------------------------------------------------------
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const miastoParams = JSON.parse(fs.readFileSync(MIASTO_PARAMS_JSON, 'utf8'));
const combatParams = JSON.parse(fs.readFileSync(COMBAT_PARAMS_JSON, 'utf8'));

const cityDefenseBonusParams = {
  mur: miastoParams.bonus_obrona_mur_proc.wartosc,
  cytadela: miastoParams.bonus_obrona_cytadela_proc.wartosc,
  baszta: miastoParams.bonus_obrona_baszta_proc.wartosc,
  palisada: miastoParams.bonus_obrona_palisada_proc.wartosc,
};
const FORTIFY_OBRONA_PROC_FIELD = combatParams['oblężenie'].fortify_obrona_proc;

const unitsByName = {};
for (const u of unitsRaw) unitsByName[u['Jednostka']] = u;
function getUnit(name) {
  const u = unitsByName[name];
  if (!u) throw new Error('Unit not found: "' + name + '"');
  return u;
}

const konnica = getUnit('Konnica');

console.log('mur-paradoks-test (R-MOC-DEFINICJA-Q1, cofniecie R-MOC-MUR-PARADOKS-Q1=A)\n');
console.log('Fixture Konnica: meleeAttack=' + konnica.meleeAttack + ' meleeDefence=' + konnica.meleeDefence
  + ' armor=' + konnica.armor + ' health=' + konnica.health + ' (rekrut, garnizon)\n');

// ---------------------------------------------------------------------------
// Reimplementacja 1:1 main.ts::combatPowerScaledDefFor -- WYLACZNIE z
// bundlowanych, prawdziwych cegielek (zero nowej matematyki). Trudnosc AI
// (applyDifficultyCombatToUnitDef) pominieta -- test liczy 'normal' domyslny
// (mnoznik 1.0), tak jak robil to test sprzed cofniecia.
//   base = veteranScaledDefFor(u) (identycznosc dla rekruta, weteran=0) +
//   fortify-field garnizonu TYLKO gdy unitGetsFortifyDefenseBonus zwraca true
//   (czyli miasto BEZ zadnego budynku obronnego -- z murem/cytadela/baszta
//   ZWRACA false, wiec garnizon za murem NIE dostaje juz zadnego bonusu na
//   tabliczce -- ani fortify-field, ani struktury).
// ---------------------------------------------------------------------------
function tabliczkaScaledDef(unitRaw, builtBuildingIds) {
  const getsFortifyField = unitGetsFortifyDefenseBonus({
    ufortyfikowanyWPolu: false,
    inGarnizon: true,
    builtBuildingIds,
    cityDefenseParams: cityDefenseBonusParams,
  });
  const meleeDefenceAfterFortify = getsFortifyField
    ? fieldFortifyDefenseBonus(unitRaw.meleeDefence, true, FORTIFY_OBRONA_PROC_FIELD)
    : unitRaw.meleeDefence;
  // units.json ma `fieldPower` PRZELICZONY z cache -- armyFieldPower() zwraca
  // je WPROST, ignorujac przeskalowane meleeDefence, jesli pole zostanie w
  // obiekcie. main.ts usuwa je explicite -- reimplementacja MUSI zrobic to
  // samo, inaczej test mierzylby stara, niezmieniona liczbe.
  const { fieldPower: _stale, ...rawNoCache } = unitRaw;
  return { ...rawNoCache, meleeDefence: meleeDefenceAfterFortify };
}

// ===========================================================================
// 1-2. Paradoks WRACA (swiadomie, R-MOC-DEFINICJA-Q1): tabliczka z murem <=
// tabliczka bez zadnego budynku, i tabliczka z murem == Moc bazowa surowa
// (zaden bonus jej juz nie dotyka).
// ===========================================================================
console.log('--- 1-2. Paradoks wraca (tabliczka z Murami == Moc bazowa, bez zadnego bonusu) ---');

const stack = [{ id: 'u1', typeId: 'Konnica', ownerId: 0 }];

const mBezBudynku = stackFieldPowerM(stack, () => tabliczkaScaledDef(konnica, []));
const mMur = stackFieldPowerM(stack, () => tabliczkaScaledDef(konnica, ['mury']));

const mBazowe = armyFieldPower(konnica); // 49 -- z units.json (fieldPower precomputed, zweryfikowane == suma z surowych pol)
assert(
  Math.abs(mBazowe - 49) < 0.05,
  'Kontrola fixture: M bazowe Konnicy (bez zadnego bonusu) == 49 (' + mBazowe + ')',
);

console.log('    M bez budynku obronnego (fortify-field +50%, niezmienione)      = ' + mBezBudynku);
console.log('    M z Murami (BEZ fortify-field, BEZ bonusu struktury -- decyzja) = ' + mMur);

assert(
  mMur < mBezBudynku,
  'PARADOKS WRACA (swiadomie): tabliczka garnizonu z Murami (' + mMur + ') < tabliczka bez zadnego budynku obronnego (' + mBezBudynku + ') -- fortify-field wylaczony przez mur, a tabliczka juz NIE kompensuje bonusem struktury (R-MOC-DEFINICJA-Q1)',
);
assert(
  Math.abs(mMur - mBazowe) < 0.05,
  'M z Murami (' + mMur + ') == M bazowe surowe (' + mBazowe + ') -- tabliczka garnizonu za murem to CZYSTA Moc jednostki, zaden bonus (ani fortify-field, ani struktury) jej nie dotyka',
);

console.log('');

// ===========================================================================
// 3. Monotonicznosc ZNIKA (swiadomie): wiecej budynkow obronnych NIE zmienia
// juz tabliczki -- nigdy nie dociaga struktury.
// ===========================================================================
console.log('--- 3. Monotonicznosc znika (Mury == Mury+Cytadela == Mury+Cytadela+Baszta) ---');

const mMuryCytadela = stackFieldPowerM(stack, () => tabliczkaScaledDef(konnica, ['mury', 'fort']));
const mKomplet = stackFieldPowerM(stack, () => tabliczkaScaledDef(konnica, ['mury', 'fort', 'baszta']));

assert(
  Math.abs(mMur - mMuryCytadela) < 0.05 && Math.abs(mMuryCytadela - mKomplet) < 0.05,
  'M NIE rosnie z kazda warstwa budynku obronnego -- tabliczka stala niezaleznie od liczby budynkow (Mury ' + mMur + ' == Mury+Cytadela ' + mMuryCytadela + ' == komplet(+Baszta) ' + mKomplet + ')',
);
console.log('');

// ===========================================================================
// 4. Jednostka NIE w garnizonie (w polu) -- bez zmian
// ===========================================================================
console.log('--- 4. Jednostka w polu (nie w garnizonie) -- funkcja no-op ---');

const mPole = armyFieldPower(konnica); // brak veterana/fortify/struct -- goly rekrut w polu
assert(
  Math.abs(mPole - mBazowe) < 0.05,
  'Jednostka w polu (poza garnizonem): M niezmienione wzgledem bazowego (' + mPole + ' == ' + mBazowe + ') -- struct bonus NIGDY nie dotyka jednostki poza miastem (bez zmian przez cofniecie)',
);
console.log('');

// ===========================================================================
// 5. Realna Obrona (effectiveDefenderM, main.ts, NIETKNIETE) tego samego
// garnizonu za murem JEST WYZSZA niz to, co pokazuje tabliczka -- paradoks
// jest teraz udokumentowanym, akceptowanym stanem (R-MOC-DEFINICJA-Q1), nie
// bledem do naprawienia.
// ===========================================================================
console.log('--- 5. Realna Obrona miasta (effectiveDefenderM, main.ts) > tabliczka ---');

const FLAT = 'Płaskie (równina/łąka)';
const splitBazowy = armyFieldPowerSplit(konnica);
const structPctMur = cityWallDefenseBonusPercent(['mury'], cityDefenseBonusParams);
assert(structPctMur === 200, 'cityWallDefenseBonusPercent(["mury"]) == 200% (miasto-params.json bonus_obrona_mur_proc)');
// Wzor effectiveDefenderM galaz isCity, teren plaski (cityGatedTerrainMultiplier=1.0,
// izolujemy czysty efekt struktury): Atak_bazowy + Obrona_bazowa*(1+structPct/100).
const realDefenseWithMur = Math.round((splitBazowy.attack + splitBazowy.defense * (1 + structPctMur / 100)) * 10) / 10;

console.log('    Realna Obrona miasta z Murami (effectiveDefenderM, main.ts) = ' + realDefenseWithMur);
console.log('    Tabliczka nad zetonem tej samej jednostki (po cofnieciu)    = ' + mMur);

assert(
  realDefenseWithMur > mMur,
  'PARADOKS UDOKUMENTOWANY (R-MOC-DEFINICJA-Q1): realna Obrona miasta z Murami w bitwie (' + realDefenseWithMur + ') > wartosc na tabliczce nad zetonem tej samej jednostki (' + mMur + ') -- tabliczka SWIADOMIE nie pokazuje bonusu struktury/terenu, mimo ze realne rozstrzygniecie bitwy go liczy w pelni',
);
console.log('');

// ===========================================================================
// 6. ZRODLO main.ts -- literalne asercje tekstowe (lapia regresje/cofniecie
// tego cofniecia, czyli powrot do stanu R-MOC-MUR-PARADOKS-Q1=A)
// ===========================================================================
console.log('--- 6. Zrodlo main.ts ---');

const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

const hasPlainDefOf = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*combatPowerScaledDefFor\(u\)/.test(mainTsSrc);
assert(
  hasPlainDefOf,
  'StackVitalsDeps.defOf (syncUnitsRender) wola goly combatPowerScaledDefFor(u) (nie tabliczkaGarnizonScaledDefFor) -- R-MOC-DEFINICJA-Q1, tabliczka bez bonusu struktury',
);

const hasTabliczkaDefOfLiteral = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*tabliczkaGarnizonScaledDefFor\(u\)/.test(mainTsSrc);
assert(
  !hasTabliczkaDefOfLiteral,
  'StackVitalsDeps.defOf NIE wola juz tabliczkaGarnizonScaledDefFor(u) -- lapie cofniecie tego cofniecia (powrot do R-MOC-MUR-PARADOKS-Q1=A)',
);

const hasTabliczkaFnDefinition = /function tabliczkaGarnizonScaledDefFor\(/.test(mainTsSrc);
assert(
  !hasTabliczkaFnDefinition,
  'Funkcja tabliczkaGarnizonScaledDefFor() NIE ISTNIEJE juz w main.ts -- martwy kod usuniety razem z jedynym wywolujacym (R-MOC-DEFINICJA-Q1)',
);

// combatPowerScaledDefFor() sama w sobie MUSI zostac fortifyFieldScaledDefFor +
// applyDifficultyCombatToUnitDef -- BEZ dotykania structureDefenseBonusFor/
// cityGatedTerrainMultiplier -- inaczej effectiveDefenderM (ktore JUZ dolicza
// te bonusy na wierzchu combatPowerScaledDefFor) policzylby je PODWOJNIE, a
// rosterFieldPowerM (M ATAKUJACEGO) zaczaloby dawac atakujacemu bonus muru.
const combatPowerScaledDefForMatch = mainTsSrc.match(
  /function combatPowerScaledDefFor\(u: RuntimeUnit\): Record<string, unknown> \{([\s\S]*?)\n {4}\}/,
);
assert(!!combatPowerScaledDefForMatch, 'combatPowerScaledDefFor() znaleziona w main.ts');
if (combatPowerScaledDefForMatch) {
  const body = combatPowerScaledDefForMatch[1];
  assert(
    !/structureDefenseBonusFor|cityGatedTerrainMultiplier|cityWallStatusAtHex/.test(body),
    'combatPowerScaledDefFor() NIE dolicza struct/teren bonusu w sobie (zapobiega PODWOJNEMU liczeniu w effectiveDefenderM i wyciekowi bonusu do rosterFieldPowerM atakujacego) -- cialo: ' + JSON.stringify(body.trim()),
  );
}

// effectiveDefenderM MUSI nadal budowac defRoster przez combatPowerScaledDefFor
// -- realna bitwa NIETKNIETA przez cofniecie tabliczki.
const defRosterMapMatches = mainTsSrc.match(/defRoster\.map\(u => \(\{ typeId: u\.typeId, def: combatPowerScaledDefFor\(u\) \}\)\)/g) || [];
assert(
  defRosterMapMatches.length >= 1,
  'effectiveDefenderM buduje defRoster przez combatPowerScaledDefFor(u) -- znaleziono ' + defRosterMapMatches.length + ' wystapien -- realna bitwa dolicza struct/teren SAMA, NIETKNIETA przez cofniecie tabliczki',
);

console.log('');
console.log('=== mur-paradoks-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
