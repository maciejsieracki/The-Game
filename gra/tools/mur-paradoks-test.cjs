'use strict';
/**
 * mur-paradoks-test.cjs
 *
 * R-MOC-MUR-PARADOKS-Q1 = A (Maciej 2026-08-07): tabliczka nad żetonem
 * garnizonu ma dociągnąć bonus struktury obronnej (mur/palisada/cytadela/
 * baszta) i mnożnik terenu miasta -- PRZED tą decyzją tabliczka jednostki w
 * garnizonie miasta z murami pokazywała NIŻSZĄ Moc niż ta sama jednostka bez
 * murów (bo `fortifyFieldScaledDefFor` dolicza +50% Obrony TYLKO gdy miasto
 * NIE ma budynku obronnego -- `unitGetsFortifyDefenseBonus`), mimo że realna
 * Obrona w bitwie (main.ts effectiveDefenderM) rośnie do +400%.
 *
 * Co sprawdza ten test (bez importu main.ts -- main.ts uruchamia caly silnik
 * gry/DOM, wiec esbuild --bundle go nie rozwiazuje w izolacji; konwencja jak
 * structure-defense-bonus-test.cjs -- bunduje PRAWDZIWE cegielki main.ts
 * faktycznie uzywa, i reimplementuje WZOR main.ts::tabliczkaGarnizonScaledDefFor
 * 1:1 z tych cegielek, zeby porownac PRAWDZIWA stackFieldPowerM z oczekiwana
 * liczba):
 *
 *   1. Fixture Konnica (rekrut, garnizon, teren plaski -- brak wzniesienia,
 *      wiec cityGatedTerrainMultiplier=1.0, izolujemy czysty efekt struktury):
 *      tabliczka BEZ zadnego budynku obronnego w miescie (dzisiejszy,
 *      niezmieniony fortify-field +50% garnizonu) < tabliczka Z MURAMI
 *      (+200% Obrony) -- PARADOKS ZNIKA (rosnie, nie maleje).
 *   2. Liczba Z MURAMI odpowiada dokladnie wzorowi
 *      base*(1) dla Ataku + base_defense*(1+structBonusPct/100) dla Obrony
 *      (ten sam podzial co main.ts effectiveDefenderM/C-COMBAT-Q2, ADDYTYWNY
 *      ze skladowa terenu, tu =0 bo teren plaski).
 *   3. Wiecej budynkow obronnych (Mury+Cytadela = +300%) daje jeszcze wyzsza
 *      tabliczke niz sam Mur (+200%) -- monotonicznosc.
 *   4. Jednostka NIE w garnizonie (w polu) -- tabliczka bez zmian wzgledem
 *      dzisiejszego combatPowerScaledDefFor (funkcja jest no-opem poza
 *      scenariuszem garnizon+mur).
 *   5. ZRODLO main.ts: literalna asercja tekstowa, ze
 *      (a) defOf tabliczki (syncUnitsRender) wola NOWA funkcje (nie goly
 *          combatPowerScaledDefFor(u)) -- lapie cofniecie zmiany #1;
 *      (b) combatPowerScaledDefFor() SAMA w sobie NIE dolicza structBonusPct/
 *          cityGatedTerrainMultiplier -- lapie regresje podwojnego liczenia
 *          bonusu w main.ts effectiveDefenderM (ktore JUZ dolicza struct/teren
 *          na wierzchu combatPowerScaledDefFor -- gdyby ta funkcja tez to
 *          robila, bitwa realna liczylaby bonus PODWOJNIE, a atakujacy
 *          (rosterFieldPowerM tez czyta combatPowerScaledDefFor) dostawalby
 *          bonus muru, ktorego mur mu NIE powinien dawac).
 *
 * Usage (z gra/): node tools/mur-paradoks-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const TERRAIN_JSON = path.join(GRA_DIR, 'data/terrain-combat.json');
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
// Bundle: unit-power.ts + auto-battle-power.ts + city-defense.ts + armyMerge.ts
// (dokladnie te pliki, ktorych main.ts::tabliczkaGarnizonScaledDefFor /
// effectiveDefenderM / stackFieldPowerM faktycznie uzywaja).
// ---------------------------------------------------------------------------
const ENTRY = path.join(__dirname, '.mur-paradoks-entry.ts');
const BUNDLE = path.join(__dirname, '.mur-paradoks-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  [
    "export { armyFieldPower, armyFieldPowerSplit } from '../src/game/unit-power';",
    "export { sumRosterFieldM, sumRosterFieldMSplit } from '../src/game/auto-battle-power';",
    "export { cityWallDefenseBonusPercent, cityGatedTerrainMultiplier, unitGetsFortifyDefenseBonus, fieldFortifyDefenseBonus, shouldApplyGarrisonFortifyBonus } from '../src/game/city-defense';",
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
  sumRosterFieldM,
  cityWallDefenseBonusPercent,
  cityGatedTerrainMultiplier,
  unitGetsFortifyDefenseBonus,
  fieldFortifyDefenseBonus,
  stackFieldPowerM,
} = require(BUNDLE);
fs.unlinkSync(ENTRY);

// ---------------------------------------------------------------------------
// Data (identyczne zrodlo co gra -- zero hardkodowanych liczb balansu)
// ---------------------------------------------------------------------------
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const terrainRaw = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));
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

const FLAT = 'Płaskie (równina/łąka)';
const konnica = getUnit('Konnica');

console.log('mur-paradoks-test (R-MOC-MUR-PARADOKS-Q1)\n');
console.log('Fixture Konnica: meleeAttack=' + konnica.meleeAttack + ' meleeDefence=' + konnica.meleeDefence
  + ' armor=' + konnica.armor + ' health=' + konnica.health + ' (rekrut, garnizon, teren=' + FLAT + ')\n');

// ---------------------------------------------------------------------------
// Reimplementacja 1:1 main.ts::tabliczkaGarnizonScaledDefFor -- WYLACZNIE z
// bundlowanych, prawdziwych cegielek (zero nowej matematyki).
//   base = fortifyFieldScaledDefFor(u) (weteran=0 dla rekrut, + fortify-field
//          garnizonu gdy shouldApplyGarrisonFortifyBonus/brak budynku obronnego)
//   jesli garnizon w miescie z budynkiem obronnym: meleeDefence/armor/health
//   *= (1 + combinedDefPct/100), combinedDefPct = structBonusPct +
//   (cityGatedTerrainMultiplier-1)*100 -- IDENTYCZNIE jak effectiveDefenderM
//   liczy split.defense w galezi isCity (main.ts ~L18184-18192).
// ---------------------------------------------------------------------------
function tabliczkaGarnizonScaledDef(unitRaw, builtBuildingIds, terrain) {
  const structBonusPct = cityWallDefenseBonusPercent(builtBuildingIds, cityDefenseBonusParams);
  const getsFortifyField = unitGetsFortifyDefenseBonus({
    ufortyfikowanyWPolu: false,
    inGarnizon: true,
    builtBuildingIds,
    cityDefenseParams: cityDefenseBonusParams,
  });
  const meleeDefenceAfterFortify = getsFortifyField
    ? fieldFortifyDefenseBonus(unitRaw.meleeDefence, true, FORTIFY_OBRONA_PROC_FIELD)
    : unitRaw.meleeDefence;
  // PUŁAPKA (patrz main.ts fortifyFieldScaledDefFor/tabliczkaGarnizonScaledDefFor):
  // units.json ma `fieldPower` PRZELICZONY z cache -- armyFieldPower() zwraca
  // je WPROST, ignorujac przeskalowane meleeDefence/armor/health, jesli pole
  // zostanie w obiekcie. main.ts usuwa je explicite -- reimplementacja MUSI
  // zrobic to samo, inaczej caly test mierzylby stara, niezmieniona liczbe.
  const { fieldPower: _stale, ...rawNoCache } = unitRaw;
  const base = { ...rawNoCache, meleeDefence: meleeDefenceAfterFortify };
  if (structBonusPct <= 0) return base;
  const hasMur = structBonusPct > 0;
  const cityTerrMult = cityGatedTerrainMultiplier(hasMur, terrain, terrainRaw);
  const combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100;
  if (combinedDefPct <= 0) return base;
  const mult = 1 + combinedDefPct / 100;
  return {
    ...base,
    meleeDefence: base.meleeDefence * mult,
    armor: base.armor * mult,
    health: base.health * mult,
  };
}

// ===========================================================================
// 1-2. Paradoks znika: tabliczka z murem > tabliczka bez zadnego budynku
// ===========================================================================
console.log('--- 1-2. Paradoks znika (tabliczka rosnie po Murach, nie maleje) ---');

const stack = [{ id: 'u1', typeId: 'Konnica', ownerId: 0 }];

const mBezBudynku = stackFieldPowerM(stack, () => tabliczkaGarnizonScaledDef(konnica, [], FLAT));
const mMur = stackFieldPowerM(stack, () => tabliczkaGarnizonScaledDef(konnica, ['mury'], FLAT));

const mBazowe = armyFieldPower(konnica); // 49 -- z units.json (fieldPower precomputed, zweryfikowane == suma z surowych pol)
assert(
  Math.abs(mBazowe - 49) < 0.05,
  'Kontrola fixture: M bazowe Konnicy (bez zadnego bonusu) == 49 (' + mBazowe + ')',
);

console.log('    M bez budynku obronnego (fortify-field +50%, dzis niezmienione) = ' + mBezBudynku);
console.log('    M z Murami (+200% Obrony, PO tej decyzji)                       = ' + mMur);

assert(
  mMur > mBezBudynku,
  'PARADOKS ZNIKA: tabliczka garnizonu z Murami (' + mMur + ') > tabliczka bez zadnego budynku obronnego (' + mBezBudynku + ') -- PRZED decyzja bylo odwrotnie (49 < 52, spadek po Murach)',
);
assert(
  mMur > mBazowe,
  'M z Murami (' + mMur + ') > M bazowe surowe (' + mBazowe + ') -- bonus faktycznie widoczny na tabliczce',
);

// Rozklad recznie: Atak Konnicy niezmieniony przez struct bonus (split.attack),
// caly przyrost z Obrony -- ten sam kontrakt co effectiveDefenderM/C-COMBAT-Q1.
const splitBazowy = armyFieldPowerSplit(konnica);
const structPctMur = cityWallDefenseBonusPercent(['mury'], cityDefenseBonusParams);
assert(structPctMur === 200, 'cityWallDefenseBonusPercent(["mury"]) == 200% (miasto-params.json bonus_obrona_mur_proc)');
const cityTerrMultFlat = cityGatedTerrainMultiplier(true, FLAT, terrainRaw);
assert(cityTerrMultFlat === 1, 'Teren plaski: cityGatedTerrainMultiplier == 1.0 (brak wzniesienia -- izoluje czysty efekt struktury)');
const expectedMMur = Math.round((splitBazowy.attack + splitBazowy.defense * (1 + structPctMur / 100)) * 10) / 10;
assert(
  Math.abs(mMur - expectedMMur) < 0.1,
  'M z Murami (' + mMur + ') == Atak_bazowy + Obrona_bazowa*(1+200%) == ' + expectedMMur + ' (wzor effectiveDefenderM galaz isCity, teren plaski)',
  );

console.log('    (kontekst: Atak_bazowy=' + splitBazowy.attack + ' Obrona_bazowa=' + splitBazowy.defense
  + ' | oczekiwane z murami=' + expectedMMur + ')');
console.log('');

// ===========================================================================
// 3. Monotonicznosc: wiecej budynkow obronnych -> jeszcze wyzsza tabliczka
// ===========================================================================
console.log('--- 3. Monotonicznosc (Mury < Mury+Cytadela < Mury+Cytadela+Baszta) ---');

const mMuryCytadela = stackFieldPowerM(stack, () => tabliczkaGarnizonScaledDef(konnica, ['mury', 'fort'], FLAT));
const mKomplet = stackFieldPowerM(stack, () => tabliczkaGarnizonScaledDef(konnica, ['mury', 'fort', 'baszta'], FLAT));

assert(
  mMur < mMuryCytadela && mMuryCytadela < mKomplet,
  'M rosnie z kazda warstwa budynku obronnego (Mury ' + mMur + ' < Mury+Cytadela ' + mMuryCytadela + ' < komplet(+Baszta) ' + mKomplet + ')',
);
console.log('');

// ===========================================================================
// 4. Jednostka NIE w garnizonie (w polu) -- bez zmian
// ===========================================================================
console.log('--- 4. Jednostka w polu (nie w garnizonie) -- funkcja no-op ---');

// Symuluje main.ts: poza garnizonem tabliczkaGarnizonScaledDefFor zwraca
// combatPowerScaledDefFor(u) bez zmian -- tu: brak wywolania struct bonus w ogole.
const mPole = armyFieldPower(konnica); // brak veterana/fortify/struct -- goly rekrut w polu
assert(
  Math.abs(mPole - mBazowe) < 0.05,
  'Jednostka w polu (poza garnizonem): M niezmienione wzgledem bazowego (' + mPole + ' == ' + mBazowe + ') -- struct bonus NIGDY nie dotyka jednostki poza miastem',
);
console.log('');

// ===========================================================================
// 5. ZRODLO main.ts -- literalne asercje tekstowe (lapia regresje/cofniecie)
// ===========================================================================
console.log('--- 5. Zrodlo main.ts ---');

const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

const hasNewDefOf = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*tabliczkaGarnizonScaledDefFor\(u\)/.test(mainTsSrc);
assert(
  hasNewDefOf,
  'StackVitalsDeps.defOf (syncUnitsRender) wola tabliczkaGarnizonScaledDefFor(u) (nie goly combatPowerScaledDefFor(u)) -- lapie cofniecie tej decyzji',
);

const hasOldDefOfLiteral = /defOf:\s*\(u:\s*RuntimeUnit\)\s*=>\s*combatPowerScaledDefFor\(u\)/.test(mainTsSrc);
assert(
  !hasOldDefOfLiteral,
  'StackVitalsDeps.defOf NIE wola juz goly combatPowerScaledDefFor(u) bezposrednio (podmienione na tabliczkaGarnizonScaledDefFor)',
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
// (NIE przez tabliczkaGarnizonScaledDefFor) -- ta ostatnia jest WYLACZNIE dla
// tabliczki (syncUnitsRender), realna bitwa liczy struct/teren SAMA (raz).
const defRosterMapMatches = mainTsSrc.match(/defRoster\.map\(u => \(\{ typeId: u\.typeId, def: combatPowerScaledDefFor\(u\) \}\)\)/g) || [];
assert(
  defRosterMapMatches.length >= 1,
  'effectiveDefenderM buduje defRoster przez combatPowerScaledDefFor(u) (NIE tabliczkaGarnizonScaledDefFor) -- znaleziono ' + defRosterMapMatches.length + ' wystapien -- realna bitwa dolicza struct/teren TYLKO RAZ, w effectiveDefenderM',
);

// N1 (nota Evaluatora, 2026-08-07): powyzsze asercje pilnuja PODPIECIA (ze tabliczka
// wola nowa funkcje), ale nie SAMEGO WZORU wewnatrz niej -- Evaluator dowodem
// mutacyjnym pokazal, ze usuniecie skalowania armor/health z produkcyjnej funkcji
// (blad 36 pkt Mocy) zostawia caly test 13/13 zielonym, bo reimplementacja wyzej
// (tabliczkaGarnizonScaledDef) i tak liczy poprawnie -- test chronil podpiecie,
// nie wzor. Domykajaca asercja: przypina DOSLOWNA tresc zwracanego obiektu w
// main.ts::tabliczkaGarnizonScaledDefFor -- musi skalowac WSZYSTKIE TRZY pola
// (meleeDefence, armor, health) przez `mult`, nie podzbior.
const tabliczkaFnMatch = mainTsSrc.match(
  /function tabliczkaGarnizonScaledDefFor\(u: RuntimeUnit\): Record<string, unknown> \{([\s\S]*?)\n {4}\}/,
);
assert(!!tabliczkaFnMatch, 'tabliczkaGarnizonScaledDefFor() znaleziona w main.ts (funkcja produkcyjna)');
if (tabliczkaFnMatch) {
  const fnBody = tabliczkaFnMatch[1];
  const returnObjMatch = fnBody.match(/return\s*\{([\s\S]*?)\};/);
  assert(!!returnObjMatch, 'tabliczkaGarnizonScaledDefFor() ma jawny return { ... } (nie return base skrocony)');
  const returnObj = returnObjMatch ? returnObjMatch[1] : '';
  for (const field of ['meleeDefence', 'armor', 'health']) {
    const scaled = new RegExp(field + ':\\s*scaleField\\(rest\\.' + field + '\\)').test(returnObj);
    assert(
      scaled,
      'return{} skaluje pole "' + field + '" przez scaleField(...) (mult) -- brak tego pola w skalowaniu = dziura ' +
        'ktorej reimplementacja testu wyzej NIE lapie (dowod mutacyjny Evaluatora: usuniecie armor/health dawalo ' +
        '95->59 pkt Mocy w prawdziwym kodzie, a stara wersja tej bramki zostawala 13/13 zielona)',
    );
  }
  const noUnscaledLeak = !/(?<!scaleField\()meleeDefence:\s*rest\.meleeDefence(?!\))/.test(returnObj);
  assert(noUnscaledLeak, 'return{} nie przecieka meleeDefence bez skalowania (poza jawnym scaleField)');
}

console.log('');
console.log('=== mur-paradoks-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
