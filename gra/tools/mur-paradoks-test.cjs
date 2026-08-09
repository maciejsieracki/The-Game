'use strict';
/**
 * mur-paradoks-test.cjs
 *
 * R-MOC-TABLICZKA-VS-CIVPOWER-Q1 (Maciej 2026-08-09) — koryguje zakres
 * R-MOC-DEFINICJA-Q1 (2026-08-08), które zunifikowało WSZYSTKIE wyświetlenia
 * Mocy (tabliczka nad żetonem ORAZ Moc cywilizacji) pod jedną, zbyt wąską
 * regułą "nigdy nie liczy budynków ani terenu". Maciej: to dwie różne liczby.
 *
 *   1. Tabliczka nad żetonem + tooltip jednostki na mapie -- REALNA Moc, ze
 *      WSZYSTKIMI bonusami: teren, fortyfikacja (polowa i garnizonowa),
 *      mur/struktura miasta, weteran. main.ts::combatPowerFullDisplayDefFor(u).
 *   2. Moc cywilizacji (panel rankingu/HUD/Empire) -- WYŁĄCZNIE naturalne
 *      wskaźniki jednostki + premia weterana. BEZ terenu/fortyfikacji/muru
 *      (i BEZ mnożnika trudności AI -- zależy od ownerId, nie od jednostki
 *      samej w sobie). main.ts::sumArmyMForOwnerEffective (przez
 *      veteranScaledDefFor(u)).
 *
 * TEN PLIK to CZĘŚCIOWE PONOWNE WPROWADZENIE R-MOC-MUR-PARADOKS-Q1=A
 * (2026-08-07, commit f94216e), tym razem TRWAŁE — nazwa funkcji
 * combatPowerFullDisplayDefFor(u) zamiast tabliczkaGarnizonScaledDefFor(u),
 * identyczny, już raz zweryfikowany przez Evaluatora wzór (1125 porównań,
 * zero rozbieżności, 2026-08-07).
 *
 * Co sprawdza ten test (bez importu main.ts -- main.ts uruchamia caly silnik
 * gry/DOM, wiec esbuild --bundle go nie rozwiazuje w izolacji; konwencja jak
 * structure-defense-bonus-test.cjs -- bunduje PRAWDZIWE cegielki main.ts
 * faktycznie uzywa, i reimplementuje WZOR main.ts::combatPowerFullDisplayDefFor
 * / sumArmyMForOwnerEffective 1:1 z tych cegielek):
 *
 *   1. Tabliczka W MIEŚCIE Z MUREM (fortify-field wyłączony przez mur, ALE
 *      dolicza bonus struktury) >= tabliczka BEZ ŻADNEGO budynku obronnego
 *      (fortify-field +50% garnizonu) -- paradoks z 2026-08-07 ZAMKNIĘTY.
 *   2. Tabliczka z murem == realna Obrona miasta w bitwie (effectiveDefenderM,
 *      NIETKNIĘTE) dla tego samego, izolowanego (teren płaski, roster
 *      jednoosobowy) scenariusza -- ta sama liczba, tylko policzona osobno.
 *   3. Monotoniczność WRACA: tabliczka z Murami <= Mury+Cytadela <=
 *      Mury+Cytadela+Baszta (więcej budynków obronnych = wyższa Moc tabliczki).
 *   4. Jednostka NIE w garnizonie (w polu) -- tabliczka bez zmian względem
 *      combatPowerScaledDefFor (fortify-field polowe nadal działa, struktura
 *      miasta jej nie dotyczy).
 *   5. Moc cywilizacji (sumArmyMForOwnerEffective/veteranScaledDefFor) jest
 *      STAŁA niezależnie od tego, czy jednostka stoi w garnizonie za murem,
 *      bez muru, czy w polu -- w przeciwieństwie do tabliczki (p.1-4), civ-
 *      power nie liczy fortyfikacji/muru/terenu W OGÓLE.
 *   6. ZRODLO main.ts: literalne asercje tekstowe, ze
 *      (a) defOf tabliczki (syncUnitsRender) wola
 *          combatPowerFullDisplayDefFor(u) (NIE goły combatPowerScaledDefFor) --
 *          lapie cofniecie tej decyzji;
 *      (b) funkcja main.ts::combatPowerFullDisplayDefFor ISTNIEJE w pliku;
 *      (c) combatPowerScaledDefFor() SAMA w sobie NIE dolicza struct/teren
 *          bonusu -- lapie regresje podwojnego liczenia w effectiveDefenderM;
 *      (d) effectiveDefenderM nadal buduje defRoster/atkRoster przez
 *          combatPowerScaledDefFor(u) (NIE combatPowerFullDisplayDefFor) --
 *          realna bitwa NIETKNIĘTA;
 *      (e) sumArmyMForOwnerEffective wola armyFieldPower(veteranScaledDefFor(u))
 *          (NIE combatPowerScaledDefFor/combatPowerFullDisplayDefFor) -- civ-
 *          power bez fortyfikacji/terenu/muru/trudności AI;
 *      (f) P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA (nota N1 Evaluatora
 *          moc-mur-revert, 2026-08-08): sekcje 1-2 wyzej licza
 *          realDefenseWithMur WLASNA REIMPLEMENTACJA wzoru (main.ts nie da sie
 *          zaimportowac w izolacji -- caly silnik/DOM), wiec NIE lapia dryfu
 *          SAMEGO WZORU wewnatrz main.ts::effectiveDefenderM (dowod mutacyjny:
 *          wyzerowanie bonusu muru w REALNEJ bitwie zostawialo caly ten plik
 *          zielonym). Literalna asercja zrodlowa pinuje formule
 *          `combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100`
 *          w galezi isCity produkcyjnej effectiveDefenderM, i ze stosuje sie
 *          ona WYLACZNIE do Obrony (terrAdjDefense), nigdy do Ataku obroncy;
 *      (g) P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA (Evaluator, dowod mutacyjny
 *          2026-08-09, znaleziona przy zamykaniu (f) powyzej): SIOSTRZANA luka
 *          w main.ts::combatPowerFullDisplayDefFor (funkcja PODGLADU tabliczki,
 *          bez efektow ubocznych na bitwe) -- ta sama tekstowo linia
 *          `combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100` istnieje
 *          TAKZE tutaj (patrz komentarz nad funkcja w main.ts), ale zaden test
 *          jej nie pinowal zrodlowo -- dowod mutacyjny: wyzerowanie bonusu
 *          struktury w combatPowerFullDisplayDefFor zostawialo caly ten plik
 *          zielonym (sekcje 1-4 wyzej licza wlasna reimplementacje, nie
 *          importuja main.ts). Literalna asercja zrodlowa nizej pinuje formule
 *          W CIELE combatPowerFullDisplayDefFor -- odrebnym regexem od (f),
 *          rozrozniona PO NAZWIE FUNKCJI (jednoznaczna, main.ts ma tylko jedna
 *          funkcje o tej nazwie) tak samo jak combatPowerScaledDefFor wyzej --
 *          zeby nie zlapac przypadkiem tej samej linii w effectiveDefenderM.
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
// ktorych main.ts::combatPowerScaledDefFor / combatPowerFullDisplayDefFor /
// effectiveDefenderM / sumArmyMForOwnerEffective faktycznie uzywaja).
// ---------------------------------------------------------------------------
const ENTRY = path.join(__dirname, '.mur-paradoks-entry.ts');
const BUNDLE = path.join(__dirname, '.mur-paradoks-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  [
    "export { armyFieldPower, armyFieldPowerSplit } from '../src/game/unit-power';",
    "export { cityWallDefenseBonusPercent, unitGetsFortifyDefenseBonus, fieldFortifyDefenseBonus } from '../src/game/city-defense';",
    "export { cityGatedTerrainMultiplier } from '../src/game/city-defense';",
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
  cityGatedTerrainMultiplier,
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
const FLAT = 'Płaskie (równina/łąka)';

console.log('mur-paradoks-test (R-MOC-TABLICZKA-VS-CIVPOWER-Q1)\n');
console.log('Fixture Konnica: meleeAttack=' + konnica.meleeAttack + ' meleeDefence=' + konnica.meleeDefence
  + ' armor=' + konnica.armor + ' health=' + konnica.health + ' (rekrut, garnizon)\n');

// ---------------------------------------------------------------------------
// Reimplementacja 1:1 main.ts::combatPowerScaledDefFor (BAZA, bez trudnosci
// AI -- test liczy 'normal' domyslny, mnoznik 1.0):
//   base = veteranScaledDefFor(u) (identycznosc dla rekruta, weteran=0) +
//   fortify-field garnizonu TYLKO gdy unitGetsFortifyDefenseBonus zwraca true.
// ---------------------------------------------------------------------------
function combatPowerScaledDef(unitRaw, builtBuildingIds) {
  const getsFortifyField = unitGetsFortifyDefenseBonus({
    ufortyfikowanyWPolu: false,
    inGarnizon: true,
    builtBuildingIds,
    cityDefenseParams: cityDefenseBonusParams,
  });
  const meleeDefenceAfterFortify = getsFortifyField
    ? fieldFortifyDefenseBonus(unitRaw.meleeDefence, true, FORTIFY_OBRONA_PROC_FIELD)
    : unitRaw.meleeDefence;
  const { fieldPower: _stale, ...rawNoCache } = unitRaw;
  return { ...rawNoCache, meleeDefence: meleeDefenceAfterFortify };
}

// ---------------------------------------------------------------------------
// Reimplementacja 1:1 main.ts::combatPowerFullDisplayDefFor -- TABLICZKA,
// zgodnie z R-MOC-TABLICZKA-VS-CIVPOWER-Q1 punkt 1: base + bonus struktury/
// terenu miasta gdy jednostka jest w garnizonie miasta z murem.
// ---------------------------------------------------------------------------
function combatPowerFullDisplayDef(unitRaw, builtBuildingIds, terrain, inGarnizon) {
  const base = combatPowerScaledDef(unitRaw, builtBuildingIds);
  if (!inGarnizon) return base;
  const structBonusPct = cityWallDefenseBonusPercent(builtBuildingIds, cityDefenseBonusParams);
  const hasMur = structBonusPct > 0;
  const cityTerrMult = cityGatedTerrainMultiplier(hasMur, terrain, []);
  const combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100;
  if (combinedDefPct <= 0) return base;
  const mult = 1 + combinedDefPct / 100;
  const scale = (v) => (typeof v === 'number' ? v * mult : v);
  return { ...base, meleeDefence: scale(base.meleeDefence), armor: scale(base.armor), health: scale(base.health) };
}

// ---------------------------------------------------------------------------
// Reimplementacja 1:1 main.ts::veteranScaledDefFor dla rekruta (weteran=0) --
// to jest po prostu unitDefFor(u) goły, BEZ zadnego skalowania (fortify/
// struktura/teren/trudnosc AI). Karmi civ-power (sumArmyMForOwnerEffective).
// ---------------------------------------------------------------------------
function veteranScaledDef(unitRaw) {
  const { fieldPower: _stale, ...rawNoCache } = unitRaw;
  return rawNoCache;
}

// ===========================================================================
// 1-2. Paradoks ZAMKNIĘTY: tabliczka z murem >= tabliczka bez zadnego
// budynku, i == realna Obrona miasta w bitwie (effectiveDefenderM, teren
// plaski -- izolujemy czysty efekt struktury).
// ===========================================================================
console.log('--- 1-2. Paradoks zamkniety (tabliczka z Murami >= bez budynku, == realna Obrona) ---');

const stack = [{ id: 'u1', typeId: 'Konnica', ownerId: 0 }];

const mBezBudynku = stackFieldPowerM(stack, () => combatPowerFullDisplayDef(konnica, [], FLAT, true));
const mMur = stackFieldPowerM(stack, () => combatPowerFullDisplayDef(konnica, ['mury'], FLAT, true));

const mBazowe = armyFieldPower(konnica); // 49 -- z units.json (fieldPower precomputed)
assert(
  Math.abs(mBazowe - 49) < 0.05,
  'Kontrola fixture: M bazowe Konnicy (bez zadnego bonusu) == 49 (' + mBazowe + ')',
);

console.log('    M bez budynku obronnego (fortify-field +50%)         = ' + mBezBudynku);
console.log('    M z Murami (bonus struktury +200%, fortify-field off) = ' + mMur);

assert(
  mMur >= mBezBudynku,
  'PARADOKS ZAMKNIETY: tabliczka garnizonu z Murami (' + mMur + ') >= tabliczka bez zadnego budynku obronnego (' + mBezBudynku + ') -- bonus struktury (+200%) przewaza brak fortify-field (+50%)',
);
assert(
  mMur > mBazowe,
  'M z Murami (' + mMur + ') > M bazowe surowe (' + mBazowe + ') -- tabliczka garnizonu za murem pokazuje PODNIESIONA Moc, nie czysta',
);

const splitBazowy = armyFieldPowerSplit(konnica);
const structPctMur = cityWallDefenseBonusPercent(['mury'], cityDefenseBonusParams);
assert(structPctMur === 200, 'cityWallDefenseBonusPercent(["mury"]) == 200% (miasto-params.json bonus_obrona_mur_proc)');
const realDefenseWithMur = Math.round((splitBazowy.attack + splitBazowy.defense * (1 + structPctMur / 100)) * 10) / 10;

console.log('    Realna Obrona miasta z Murami (effectiveDefenderM, main.ts) = ' + realDefenseWithMur);
console.log('    Tabliczka nad zetonem tej samej jednostki                  = ' + mMur);

assert(
  Math.abs(realDefenseWithMur - mMur) < 0.15,
  'PARADOKS ZAMKNIETY: tabliczka nad zetonem (' + mMur + ') == realna Obrona miasta z Murami w bitwie (' + realDefenseWithMur + ') (tolerancja zaokraglen) -- tabliczka pokazuje TA SAMA liczbe, ktora realnie rozstrzyga bitwe',
);

console.log('');

// ===========================================================================
// 3. Monotonicznosc WRACA: wiecej budynkow obronnych PODNOSI tabliczke.
// ===========================================================================
console.log('--- 3. Monotonicznosc wraca (Mury <= Mury+Cytadela <= Mury+Cytadela+Baszta) ---');

const mMuryCytadela = stackFieldPowerM(stack, () => combatPowerFullDisplayDef(konnica, ['mury', 'fort'], FLAT, true));
const mKomplet = stackFieldPowerM(stack, () => combatPowerFullDisplayDef(konnica, ['mury', 'fort', 'baszta'], FLAT, true));

assert(
  mMur <= mMuryCytadela && mMuryCytadela <= mKomplet,
  'M ROSNIE z kazda warstwa budynku obronnego -- tabliczka monotoniczna wzgledem liczby budynkow (Mury ' + mMur + ' <= Mury+Cytadela ' + mMuryCytadela + ' <= komplet(+Baszta) ' + mKomplet + ')',
);
console.log('');

// ===========================================================================
// 4. Jednostka NIE w garnizonie (w polu) -- bez zmian wzgledem
// combatPowerScaledDefFor (struktura miasta jej nie dotyczy).
// ===========================================================================
console.log('--- 4. Jednostka w polu (nie w garnizonie) -- funkcja no-op wzgledem bazy ---');

const mPoleBaza = stackFieldPowerM(stack, () => combatPowerScaledDef(konnica, ['mury']));
const mPoleDisplay = stackFieldPowerM(stack, () => combatPowerFullDisplayDef(konnica, ['mury'], FLAT, false));
assert(
  Math.abs(mPoleBaza - mPoleDisplay) < 0.05,
  'Jednostka w polu (poza garnizonem): combatPowerFullDisplayDef == combatPowerScaledDef (' + mPoleDisplay + ' == ' + mPoleBaza + ') -- struct bonus miasta NIGDY nie dotyka jednostki poza garnizonem',
);
console.log('');

// ===========================================================================
// 5. Moc cywilizacji (sumArmyMForOwnerEffective/veteranScaledDefFor) STALA
// niezaleznie od garnizonu/muru/pola -- w przeciwienstwie do tabliczki.
// ===========================================================================
console.log('--- 5. Moc cywilizacji STALA niezaleznie od muru/garnizonu (civ-power != tabliczka) ---');

const civPowerBezBudynku = armyFieldPower(veteranScaledDef(konnica));
const civPowerZMurem = armyFieldPower(veteranScaledDef(konnica)); // ownerId-agnostyczne, nie zalezy od pozycji
assert(
  Math.abs(civPowerBezBudynku - civPowerZMurem) < 0.001,
  'Moc cywilizacji (veteranScaledDefFor) IDENTYCZNA niezaleznie od muru/garnizonu (' + civPowerBezBudynku + ' == ' + civPowerZMurem + ') -- civ-power nie przyjmuje pozycji/muru jako wejscia w ogole',
);
assert(
  Math.abs(civPowerBezBudynku - mBazowe) < 0.05,
  'Moc cywilizacji rekruta bez weterana (' + civPowerBezBudynku + ') == Moc bazowa surowa (' + mBazowe + ') -- zero bonusow poza weteranem/ulepszeniami',
);
assert(
  civPowerZMurem < mMur,
  'Moc cywilizacji (' + civPowerZMurem + ') < tabliczka garnizonu za murem (' + mMur + ') -- DWIE ROZNE liczby, civ-power NIZSZA bo nie liczy struktury/terenu',
);
console.log('');

// ===========================================================================
// 6. ZRODLO main.ts -- literalne asercje tekstowe
// ===========================================================================
console.log('--- 6. Zrodlo main.ts ---');

const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

const hasFullDisplayDefOf = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*combatPowerFullDisplayDefFor\(u\)/.test(mainTsSrc);
assert(
  hasFullDisplayDefOf,
  'StackVitalsDeps.defOf (syncUnitsRender) wola combatPowerFullDisplayDefFor(u) -- tabliczka pokazuje PELNA Moc (R-MOC-TABLICZKA-VS-CIVPOWER-Q1)',
);

const hasPlainDefOf = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*combatPowerScaledDefFor\(u\)/.test(mainTsSrc);
assert(
  !hasPlainDefOf,
  'StackVitalsDeps.defOf NIE wola juz golego combatPowerScaledDefFor(u) -- lapie cofniecie do R-MOC-DEFINICJA-Q1 (tabliczka bez struktury)',
);

const hasFullDisplayFnDefinition = /function combatPowerFullDisplayDefFor\(/.test(mainTsSrc);
assert(
  hasFullDisplayFnDefinition,
  'Funkcja main.ts::combatPowerFullDisplayDefFor ISTNIEJE w pliku',
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
// (NIE combatPowerFullDisplayDefFor) -- realna bitwa NIETKNIETA przez ta decyzje.
const defRosterMapMatches = mainTsSrc.match(/defRoster\.map\(u => \(\{ typeId: u\.typeId, def: combatPowerScaledDefFor\(u\) \}\)\)/g) || [];
assert(
  defRosterMapMatches.length >= 1,
  'effectiveDefenderM buduje defRoster przez combatPowerScaledDefFor(u) -- znaleziono ' + defRosterMapMatches.length + ' wystapien -- realna bitwa dolicza struct/teren SAMA, NIETKNIETA przez ta decyzje',
);
const rosterMapMatches = mainTsSrc.match(/roster\.map\(u => \(\{ typeId: u\.typeId, def: combatPowerScaledDefFor\(u\) \}\)\)/g) || [];
assert(
  rosterMapMatches.length >= 1,
  'rosterFieldPowerM (atakujacy) buduje roster przez combatPowerScaledDefFor(u) -- znaleziono ' + rosterMapMatches.length + ' wystapien -- atakujacy NIE dostaje bonusu struktury tabliczki',
);

// sumArmyMForOwnerEffective (civ-power) MUSI woalc veteranScaledDefFor, NIE
// combatPowerScaledDefFor/combatPowerFullDisplayDefFor.
const sumArmyMEffectiveMatch = mainTsSrc.match(
  /function sumArmyMForOwnerEffective\(ownerId: number\): number \{([\s\S]*?)\n {4}\}/,
);
assert(!!sumArmyMEffectiveMatch, 'sumArmyMForOwnerEffective() znaleziona w main.ts');
if (sumArmyMEffectiveMatch) {
  const body = sumArmyMEffectiveMatch[1];
  assert(
    /armyFieldPower\(veteranScaledDefFor\(u\)\)/.test(body),
    'sumArmyMForOwnerEffective() wola armyFieldPower(veteranScaledDefFor(u)) -- civ-power BEZ fortyfikacji/terenu/muru/trudnosci AI',
  );
  assert(
    !/combatPowerScaledDefFor|combatPowerFullDisplayDefFor/.test(body),
    'sumArmyMForOwnerEffective() NIE wola combatPowerScaledDefFor/combatPowerFullDisplayDefFor -- civ-power odseparowana od tabliczki',
  );
}

// P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA (nota N1 Evaluatora
// moc-mur-revert, 2026-08-08): sekcje 1-2 wyzej licza realDefenseWithMur
// WLASNA REIMPLEMENTACJA wzoru (main.ts uruchamia caly silnik gry/DOM, nie da
// sie go zbundlowac w izolacji), wiec NIE lapia dryfu SAMEGO WZORU wewnatrz
// main.ts::effectiveDefenderM -- dowod mutacyjny Evaluatora: wstrzykniecie
// `combinedDefPct = 0 * structBonusPct + (cityTerrMult - 1) * 100` (zerowanie
// bonusu muru w REALNEJ bitwie) zostawialo caly ten plik (i logic-test.cjs,
// combat-test.cjs) w 100% zielone. Literalna asercja zrodlowa pinuje formule
// w galezi isCity produkcyjnej effectiveDefenderM -- wzorem starej (usunietej
// przy R-MOC-TABLICZKA-VS-CIVPOWER-Q1) asercji na scaleField() dla
// tabliczkaGarnizonScaledDefFor.
const effectiveDefenderMMatch = mainTsSrc.match(
  /function effectiveDefenderM\(\s*defRoster: RuntimeUnit\[\],\s*terrain: string,\s*structBonusPct: number,\s*atkLeadDef: Record<string, unknown>,\s*q: number,\s*r: number,\s*\): number \{([\s\S]*?)\n {4}\}/,
);
assert(!!effectiveDefenderMMatch, 'effectiveDefenderM() znaleziona w main.ts (funkcja produkcyjna realnej bitwy)');
if (effectiveDefenderMMatch) {
  const body = effectiveDefenderMMatch[1];
  assert(
    /const combinedDefPct = structBonusPct \+ \(cityTerrMult - 1\) \* 100;/.test(body),
    'effectiveDefenderM() (galaz isCity, REALNA bitwa) liczy combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100 ' +
      '(ADDYTYWNA kombinacja struktury/terenu, C-COMBAT-Q2) -- lapie regresje/wyzerowanie bonusu muru w rozstrzygnieciu bitwy, ' +
      'ktorej sekcje 1-2 wyzej NIE lapia (wlasna reimplementacja)',
  );
  assert(
    /terrAdjDefense = split\.defense \* \(1 \+ combinedDefPct \/ 100\);/.test(body),
    'effectiveDefenderM() stosuje combinedDefPct WYLACZNIE na czesc Obrony (terrAdjDefense = split.defense * (1 + combinedDefPct / 100))',
  );
  assert(
    /terrAdjAttack = split\.attack;/.test(body),
    'effectiveDefenderM() (galaz isCity) NIE dolicza combinedDefPct do Ataku obroncy (terrAdjAttack = split.attack, bez zmian) -- ' +
      'mur/teren "nie chroni" skladowej ofensywnej obroncy w obronie miasta',
  );
}

// P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA (Evaluator, dowod mutacyjny
// 2026-08-09): SIOSTRZANA funkcja main.ts::combatPowerFullDisplayDefFor (tab-
// liczka/tooltip PODGLADU, bez efektow ubocznych na bitwe) liczy TA SAMA
// tekstowo linie `combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100`
// co effectiveDefenderM wyzej, ale zaden test jej nie pinowal zrodlowo --
// wyzerowanie bonusu struktury TUTAJ zostawialo caly ten plik zielonym (sekcje
// 1-4 licza wlasna reimplementacje w JS, nie main.ts). Regex ponizej rozroznia
// sie od bloku effectiveDefenderM wylacznie PO NAZWIE FUNKCJI w sygnaturze
// (main.ts ma dokladnie jedna funkcje o kazdej z tych nazw) -- ten sam wzorzec
// jednoznacznosci co juz uzyty dla combatPowerScaledDefFor wyzej w tym pliku.
const combatPowerFullDisplayDefForMatch = mainTsSrc.match(
  /function combatPowerFullDisplayDefFor\(u: RuntimeUnit\): Record<string, unknown> \{([\s\S]*?)\n {4}\}/,
);
assert(!!combatPowerFullDisplayDefForMatch, 'combatPowerFullDisplayDefFor() znaleziona w main.ts (funkcja PODGLADU tabliczki)');
if (combatPowerFullDisplayDefForMatch) {
  const body = combatPowerFullDisplayDefForMatch[1];
  assert(
    /const combinedDefPct = structBonusPct \+ \(cityTerrMult - 1\) \* 100;/.test(body),
    'combatPowerFullDisplayDefFor() liczy combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100 ' +
      '(ta sama ADDYTYWNA formula co effectiveDefenderM, galaz isCity) -- lapie regresje/wyzerowanie bonusu struktury w PODGLADZIE tabliczki, ' +
      'ktorej sekcje 1-4 wyzej NIE lapia (wlasna reimplementacja w JS)',
  );
  // P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA (Evaluator, dowod mutacyjny): sprawdzanie
  // BRAKU konkretnego literalu "<pole>: scaleField" (czarna lista NAZWY helpera)
  // przepuszcza NIEWYKRYTE skalowanie pola Ataku przez INNY helper (np.
  // "meleeAttack: scaleAtk(...)") albo inline ("meleeAttack: (rest.meleeAttack as
  // number) * mult") -- zaden z tych wariantow nie zawiera literalu "scaleField".
  // BIALA LISTA nizej odczytuje NAPRAWDE blok `return { ... }` funkcji PODGLADU i
  // dla KAZDEJ linii postaci `klucz: wartosc` (pomijajac `...rest,` spread)
  // rozpoznaje "skalowanie" PO KSZTALCIE wartosci (DOWOLNE wywolanie funkcji
  // `identyfikator(` LUB mnozenie `*` po prawej stronie dwukropka), NIE po
  // nazwie konkretnego helpera -- lapie kazda forme skalowania, niezaleznie od
  // tego jak sie nazywa czy czy jest inline.
  const returnBlockMatch = body.match(/return \{([\s\S]*?)\};/);
  assert(
    !!returnBlockMatch,
    'combatPowerFullDisplayDefFor() ma blok return { ... } (obiekt wynikowy funkcji PODGLADU) do przeanalizowania',
  );
  if (returnBlockMatch) {
    const ALLOWED_SCALED_KEYS = ['meleeDefence', 'armor', 'health'];
    const propLineRe = /^([A-Za-z_$][\w$]*)\s*:\s*(.+?),?\s*$/;
    // "skalowanie" = wywolanie DOWOLNEJ funkcji (identyfikator + otwierajacy
    // nawias, np. scaleField(...)/scaleAtk(...)/cokolwiekInnego(...)) LUB
    // mnozenie (*) po prawej stronie dwukropka -- lapie tez inline
    // "(rest.x as number) * mult", ktore nie ma wywolania funkcji w ogole.
    const SCALING_SHAPE_RE = /[A-Za-z_$][\w$]*\s*\(|\*/;
    const scaledKeysFound = [];
    const disallowedScaledLines = [];
    for (const rawLine of returnBlockMatch[1].split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('...')) continue; // pomin spread (`...rest,`)
      const m = line.match(propLineRe);
      if (!m) continue;
      const [, key, value] = m;
      if (!SCALING_SHAPE_RE.test(value)) continue; // pole przepisane bez zmian, nie "skalowanie"
      scaledKeysFound.push(key);
      if (!ALLOWED_SCALED_KEYS.includes(key)) disallowedScaledLines.push(line);
    }
    assert(
      disallowedScaledLines.length === 0,
      'combatPowerFullDisplayDefFor(): BIALA LISTA -- w return{} skalowane (wywolaniem funkcji LUB mnozeniem, ' +
        'dowolna nazwa helpera) jest WYLACZNIE ' + ALLOWED_SCALED_KEYS.join('/') + ' (skladowe Obrony w fieldPower()) -- ' +
        'znaleziono niedozwolone skalowanie: ' + JSON.stringify(disallowedScaledLines),
    );
    assert(
      ALLOWED_SCALED_KEYS.every(k => scaledKeysFound.includes(k)),
      'combatPowerFullDisplayDefFor() stosuje mult (1 + combinedDefPct / 100) na meleeDefence/armor/health -- skladowe Obrony w fieldPower() (' +
        'znalezione skalowane pola: ' + scaledKeysFound.join(', ') + ')',
    );
  }
}

console.log('');
console.log('=== mur-paradoks-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
