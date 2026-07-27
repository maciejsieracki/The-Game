'use strict';
/**
 * unit-building-bonuses-test.cjs -- standalone Node test dla dwoch sciezek
 * ulepszania jednostek przez budynki miasta (decyzja Macieja 2026-07-25,
 * zastepuje martwy/blednie policzony "mnoznik -> % do Pracy" -- patrz
 * dyspozycje/AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md i game/economy.ts "Step 5").
 *
 * Run from gra/:  node tools/unit-building-bonuses-test.cjs
 *
 * Wzorowany na tools/unit-stock-cost-test.cjs (ten sam sposob budowania
 * bundla esbuild + styl asercji + sekcja PARYTET AI).
 *
 * Pokrywa (wymagania z zadania):
 *   A. Kumulacja obu sciezek z danych realnych (buildings.json) -- Kuznia +
 *      Kuznia zelaza = suma; Koszary + Warsztat oblezniczy = suma.
 *   B. Trwalosc bonusu po WYJSCIU z miasta (odwiedzenie slabszego/pustego
 *      miasta nie obniza wczesniej zdobytego %).
 *   C. Zapamietanie NAJLEPSZEGO miasta kiedykolwiek odwiedzonego (monotoniczny
 *      wzrost -- kolejne, lepsze miasto podnosi %, gorsze nie cofa).
 *   D. Niezaleznosc sciezek: Sciezka B (parametry miekkie) NIE wplywa na
 *      Pancerz, ani na odwrot -- zarowno na poziomie samego stanu jednostki,
 *      jak i na poziomie mergeBuildingBonusIntoStatMultipliers (uzywanego
 *      bezposrednio w resolveCombat).
 *   E. PARYTET AI (zasada nadrzedna): identyczny wynik dla jednostki gracza
 *      (ownerId=0) i AI (ownerId!=0) przy tym samym scenariuszu miasta --
 *      zero galezi "tylko gracz" w bestBuildingProgressAfterCityVisit.
 *   F. Awans budynku (upgradeFrom) -- decyzja wlasciciela 2026-07-25 (druga
 *      tura): budynek-nastepca WNOSI SUME wlasnego % i % calego lancucha
 *      poprzednikow (Kuznia+Kuznia zelaza+Wielka Kuznia = 45%). GRUPY-BUDYNKOW
 *      (Maciej 2026-07-25, likwidacja "awansu bocznego", TA SAMA data): Koszary
 *      i Akademia wojskowa NIE sa juz w relacji upgradeFrom -- stoja w miescie
 *      OSOBNO i licza sie WPROST (oba id na builtBuildingIds), z Warsztatem
 *      oblezniczym nadal 40%/50% co do liczby, ale bez udzialu lancucha.
 *   G. Kompatybilnosc wsteczna -- jednostka bez pol (stary zapis) = 0% na
 *      obu sciezkach, bez wyjatku.
 *   I. Cykl w danych `upgradeFrom` nie zawiesza funkcji (twardy limit
 *      glebokosci + zbior odwiedzonych id).
 *   J. Ten sam budynek nie jest liczony dwa razy, nawet gdy miasto ma
 *      jednoczesnie poprzednika i nastepce na liscie (stan patologiczny).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[unit-building-bonuses-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.unit-building-bonuses-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-building-bonuses-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  ARMOR_BUILDING_IDS, SOFT_STAT_BUILDING_IDS,
  cityArmorBonusPercent, citySoftStatBonusPercent,
  unitPancerzBonusProc, unitParametryBonusProc,
  unitPancerzBonusFrac, unitParametryBonusFrac,
  bestBuildingProgressAfterCityVisit, buildingProgressWouldChange,
  applyCityVisitBonusGain, formatBuildingBonusGainHint,
  unitBuildingBonusLabel, mnoznikRoleForBuildingId,
  mergeBuildingBonusIntoStatMultipliers, buildingCombatBonusForUnit,
  cumulativeMnoznikForBuildingId,
} from '../src/game/unit-building-bonuses';
export { resolveCombat, combatUnitFromDef } from '../src/game/combat';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[unit-building-bonuses-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const buildingsData = require('../data/buildings.json');
const BUILDINGS = buildingsData.budynki || buildingsData;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function mnoznikOf(id) {
  const b = BUILDINGS.find(x => x.id === id);
  return b && b.baza ? (b.baza.mnoznik || 0) : 0;
}

const KUZNIA          = mnoznikOf('kuznia');
const KUZNIA_ZELAZA    = mnoznikOf('kuznia_zelaza');
const WIELKA_KUZNIA    = mnoznikOf('wielka_kuznia');
const KOSZARY          = mnoznikOf('koszary');
const AKADEMIA_WOJSK   = mnoznikOf('akademia_wojskowa');
const WARSZTAT_OBLEZ   = mnoznikOf('warsztat_oblezniczy');

console.log('-- Wartosci z buildings.json --');
console.log(`kuznia=${KUZNIA} kuznia_zelaza=${KUZNIA_ZELAZA} wielka_kuznia=${WIELKA_KUZNIA} koszary=${KOSZARY} akademia_wojskowa=${AKADEMIA_WOJSK} warsztat_oblezniczy=${WARSZTAT_OBLEZ}`);
assert(KUZNIA > 0 && KUZNIA_ZELAZA > 0 && WIELKA_KUZNIA > 0, 'sciezka A ma niezerowe wartosci w danych');
assert(KOSZARY > 0 && AKADEMIA_WOJSK > 0 && WARSZTAT_OBLEZ > 0, 'sciezka B ma niezerowe wartosci w danych');

// ===========================================================================
// A. Kumulacja obu sciezek (budynki REALNIE obecne w miescie)
// ===========================================================================
console.log('\n-- A. Kumulacja sciezek --');
{
  eq(M.cityArmorBonusPercent(['kuznia'], BUILDINGS), KUZNIA, 'Pancerz: tylko Kuznia');
  eq(
    M.cityArmorBonusPercent(['kuznia', 'kuznia_zelaza'], BUILDINGS),
    KUZNIA + KUZNIA_ZELAZA,
    'Pancerz: Kuznia + Kuznia zelaza sumuja sie',
  );
  eq(
    M.citySoftStatBonusPercent(['koszary', 'warsztat_oblezniczy'], BUILDINGS),
    KOSZARY + WARSZTAT_OBLEZ,
    'Parametry: Koszary + Warsztat oblezniczy sumuja sie',
  );
  eq(M.cityArmorBonusPercent([], BUILDINGS), 0, 'Pancerz: miasto bez budynkow kuzniczych = 0');
  eq(M.cityArmorBonusPercent(['ratusz', 'targowisko'], BUILDINGS), 0, 'Pancerz: budynki spoza listy nie licza sie');
}

// ===========================================================================
// D. Niezaleznosc sciezek (na poziomie stanu miasta/jednostki)
// ===========================================================================
console.log('\n-- D. Niezaleznosc sciezek (miasto/jednostka) --');
{
  // Miasto z SAMYMI budynkami kuzniczymi -> Parametry=0, mimo niezerowego Pancerza.
  const onlyForge = ['kuznia', 'kuznia_zelaza'];
  assert(M.cityArmorBonusPercent(onlyForge, BUILDINGS) > 0, 'sanity: miasto kuznicze ma Pancerz>0');
  eq(M.citySoftStatBonusPercent(onlyForge, BUILDINGS), 0, 'miasto TYLKO kuznicze: Parametry=0 (brak wplywu Sciezki A na B)');

  // Miasto z SAMYMI budynkami szkoleniowymi -> Pancerz=0.
  const onlyTraining = ['koszary', 'warsztat_oblezniczy'];
  assert(M.citySoftStatBonusPercent(onlyTraining, BUILDINGS) > 0, 'sanity: miasto szkoleniowe ma Parametry>0');
  eq(M.cityArmorBonusPercent(onlyTraining, BUILDINGS), 0, 'miasto TYLKO szkoleniowe: Pancerz=0 (brak wplywu Sciezki B na A)');
}

// ===========================================================================
// D (cd.). Niezaleznosc na poziomie mergeBuildingBonusIntoStatMultipliers
//          -- dokladnie ta funkcja jest wolana wewnatrz resolveCombat.
// ===========================================================================
console.log('\n-- D (cd). mergeBuildingBonusIntoStatMultipliers: Pancerz vs reszta --');
{
  const ZERO = { atk: 0, obrona: 0, pancerz: 0, uderzenie: 0, rangedAtk: 0, health: 0 };

  const onlyArmor = M.mergeBuildingBonusIntoStatMultipliers({ ...ZERO }, { pancerz: 0.30, other: 0 });
  eq(onlyArmor.pancerz, 0.30, 'sam bonus Pancerza: mods.pancerz = 0.30');
  eq(onlyArmor.atk, 0, 'sam bonus Pancerza: mods.atk NIETKNIETY (=0)');
  eq(onlyArmor.obrona, 0, 'sam bonus Pancerza: mods.obrona NIETKNIETY (=0)');
  eq(onlyArmor.health, 0, 'sam bonus Pancerza: mods.health NIETKNIETY (=0)');
  eq(onlyArmor.uderzenie, 0, 'sam bonus Pancerza: mods.uderzenie NIETKNIETY (=0)');
  eq(onlyArmor.rangedAtk, 0, 'sam bonus Pancerza: mods.rangedAtk NIETKNIETY (=0)');

  const onlyOther = M.mergeBuildingBonusIntoStatMultipliers({ ...ZERO }, { pancerz: 0, other: 0.20 });
  eq(onlyOther.pancerz, 0, 'sam bonus parametrow: mods.pancerz NIETKNIETY (=0) -- BRAK WPLYWU SCIEZKI B NA ARMOR');
  eq(onlyOther.atk, 0.20, 'sam bonus parametrow: mods.atk = 0.20');
  eq(onlyOther.obrona, 0.20, 'sam bonus parametrow: mods.obrona = 0.20');
  eq(onlyOther.health, 0.20, 'sam bonus parametrow: mods.health = 0.20');
  eq(onlyOther.uderzenie, 0.20, 'sam bonus parametrow: mods.uderzenie = 0.20');
  eq(onlyOther.rangedAtk, 0.20, 'sam bonus parametrow: mods.rangedAtk = 0.20');

  const both = M.mergeBuildingBonusIntoStatMultipliers({ ...ZERO }, { pancerz: 0.30, other: 0.20 });
  eq(both.pancerz, 0.30, 'oba bonusy razem: mods.pancerz = 0.30 (tylko od Sciezki A)');
  eq(both.atk, 0.20, 'oba bonusy razem: mods.atk = 0.20 (tylko od Sciezki B)');

  eq(M.mergeBuildingBonusIntoStatMultipliers({ ...ZERO }, undefined).pancerz, 0, 'brak bonusu (undefined) = mods niezmienione');
}

// ===========================================================================
// B + C. Trwalosc po wyjsciu z miasta + zapamietanie NAJLEPSZEGO miasta
// ===========================================================================
console.log('\n-- B + C. Trwalosc + zapamietanie najlepszego miasta --');
{
  // Jednostka nowa (bez wczesniejszego postepu) wchodzi do miasta z Kuznia.
  let unit = {};
  let next = M.bestBuildingProgressAfterCityVisit(unit, ['kuznia'], BUILDINGS);
  eq(next.pancerzBonusProc, KUZNIA, 'nowa jednostka + miasto z Kuznia -> Pancerz = wartosc Kuzni');
  eq(next.parametryBonusProc, 0, 'to samo miasto bez budynkow szkoleniowych -> Parametry = 0');
  unit = { ...unit, ...next };

  // Jednostka WYCHODZI i wchodzi do miasta BEZ zadnego z budynkow (0%, 0%).
  next = M.bestBuildingProgressAfterCityVisit(unit, [], BUILDINGS);
  eq(next.pancerzBonusProc, KUZNIA, 'TRWALOSC: wizyta w miescie bez budynkow NIE obniza wczesniej zdobytego Pancerza');
  unit = { ...unit, ...next };

  // Jednostka wchodzi do LEPSZEGO miasta (Kuznia + Kuznia zelaza) -> % rosnie.
  next = M.bestBuildingProgressAfterCityVisit(unit, ['kuznia', 'kuznia_zelaza'], BUILDINGS);
  eq(next.pancerzBonusProc, KUZNIA + KUZNIA_ZELAZA, 'ZAPAMIETANIE NAJLEPSZEGO: lepsze miasto podnosi Pancerz');
  unit = { ...unit, ...next };

  // Jednostka wraca do PIERWSZEGO (slabszego) miasta -> % NIE spada (max, nie ostatnia wizyta).
  next = M.bestBuildingProgressAfterCityVisit(unit, ['kuznia'], BUILDINGS);
  eq(
    next.pancerzBonusProc, KUZNIA + KUZNIA_ZELAZA,
    'ZAPAMIETANIE NAJLEPSZEGO: powrot do slabszego miasta NIE cofa postepu (max, nie last-visited)',
  );

  // buildingProgressWouldChange -- zgodne z powyzszym: false gdy nic by sie nie zmienilo.
  assert(
    M.buildingProgressWouldChange(unit, ['kuznia'], BUILDINGS) === false,
    'buildingProgressWouldChange=false gdy wizyta w slabszym miescie niczego by nie zmienila',
  );
  assert(
    M.buildingProgressWouldChange(unit, ['kuznia', 'kuznia_zelaza', 'koszary'], BUILDINGS) === true,
    'buildingProgressWouldChange=true gdy miasto oferuje wyzszy % (tu: nowa Sciezka B)',
  );
}

// ===========================================================================
// F. Awans budynku (upgradeFrom) -- suma wlasnego % + calego lancucha
//    poprzednikow (decyzja wlasciciela 2026-07-25, druga tura)
// ===========================================================================
console.log('\n-- F. Awans budynku (upgradeFrom) -- suma lancucha --');
{
  const kuzniaZelazaDef = BUILDINGS.find(b => b.id === 'kuznia_zelaza');
  const wielkaKuzniaDef = BUILDINGS.find(b => b.id === 'wielka_kuznia');
  const akademiaDef     = BUILDINGS.find(b => b.id === 'akademia_wojskowa');
  eq(wielkaKuzniaDef.upgradeFrom, 'kuznia_zelaza', 'sanity: Wielka Kuznia zastepuje Kuznia zelaza (upgradeFrom)');
  // KOSZTY-SUROWCOWE (Maciej 2026-07-25, ZADANIE 3): ogniwo naprawione -- Kuznia
  // zelaza TERAZ zastepuje Kuznia (upgradeFrom='kuznia'), tak jak Palac.
  eq(kuzniaZelazaDef.upgradeFrom, 'kuznia', 'sanity: Kuznia zelaza zastepuje Kuznia (upgradeFrom naprawiony)');
  // GRUPY-BUDYNKOW (Maciej 2026-07-25, likwidacja "awansu bocznego"): Akademia wojskowa
  // NIE zastepuje juz Koszar -- upgradeFrom usuniety, oba stoja w miescie osobno.
  eq(akademiaDef.upgradeFrom, undefined, 'sanity: Akademia wojskowa NIE zastepuje juz Koszar (upgradeFrom usuniety)');

  // Miasto z Kuznia + Kuznia zelaza (bez awansu) -> 30% Pancerza.
  eq(
    M.cityArmorBonusPercent(['kuznia', 'kuznia_zelaza'], BUILDINGS),
    30,
    'Kuznia + Kuznia zelaza -> 30% Pancerza',
  );

  // Miasto PO awansie: 'kuznia_zelaza' zniknal z listy (podmieniony na 'wielka_kuznia'),
  // 'kuznia' (osobny budynek, NIE upgradeFrom) zostaje. Wielka Kuznia wnosi SUME:
  // wlasny % (15) + lancuch poprzednikow (kuznia_zelaza=15) = 30, plus kuznia osobno (15) = 45.
  const afterUpgrade = M.cityArmorBonusPercent(['kuznia', 'wielka_kuznia'], BUILDINGS);
  eq(afterUpgrade, 45, 'po awansie do Wielkiej Kuzni (kuznia+wielka_kuznia): suma lancucha = 45%');
  eq(afterUpgrade, KUZNIA + KUZNIA_ZELAZA + WIELKA_KUZNIA, 'sanity: 45% = suma wszystkich trzech mnoznikow z danych');

  // Miasto z Koszarami + Warsztatem (bez Akademii wojskowej) -> 30% parametrow.
  eq(
    M.citySoftStatBonusPercent(['koszary', 'warsztat_oblezniczy'], BUILDINGS),
    30,
    'Koszary + Warsztat oblezniczy -> 30% parametrow',
  );

  // GRUPY-BUDYNKOW: Koszary i Akademia wojskowa TERAZ stoja w miescie OSOBNO (oba id
  // realnie obecne w builtBuildingIds, zaden lancuch upgradeFrom) -- kazdy wnosi WPROST
  // swoj wlasny % (20+20=40), plus Warsztat oblezniczy osobno (10) = 50. Dokladnie taki
  // sam wynik liczbowy jak przed zmiana (Maciej: "zweryfikuj testem, ze nadal wychodzi
  // 40%, a razem z Warsztatem oblezniczym 50%"), ale scenariusz musi teraz zawierac
  // OBA id jednoczesnie, bo przeplyw juz nie idzie przez lancuch.
  const afterAkademia = M.citySoftStatBonusPercent(['koszary', 'akademia_wojskowa', 'warsztat_oblezniczy'], BUILDINGS);
  eq(afterAkademia, 50, 'Koszary+Akademia wojskowa+Warsztat oblezniczy (oba osobno w miescie) = 50%');
  eq(afterAkademia, AKADEMIA_WOJSK + KOSZARY + WARSZTAT_OBLEZ, 'sanity: 50% = suma wszystkich trzech mnoznikow z danych');

  // Koszary + Akademia wojskowa (bez Warsztatu), oba osobno w miescie -> 40%.
  const koszaryPlusAkademia = M.citySoftStatBonusPercent(['koszary', 'akademia_wojskowa'], BUILDINGS);
  eq(koszaryPlusAkademia, 40, 'Koszary + Akademia wojskowa (oba osobno w miescie, bez Warsztatu) -> 40%');

  // Sama Akademia wojskowa (bez Koszar, bez Warsztatu) -> TYLKO jej wlasny % = 20%
  // (nie 40 -- lancuch do Koszar juz nie istnieje, upgradeFrom usuniety).
  eq(M.citySoftStatBonusPercent(['akademia_wojskowa'], BUILDINGS), AKADEMIA_WOJSK, 'sama Akademia wojskowa (bez Koszar) -> tylko wlasny % (20%)');

  // cumulativeMnoznikForBuildingId -- ta sama funkcja uzywana przez UI (karta budynku,
  // panel "Statystyki (silnik)"): pyta o SAM budynek, niezaleznie od stanu miasta.
  eq(M.cumulativeMnoznikForBuildingId('kuznia', BUILDINGS), KUZNIA, 'UI: Kuznia (bez poprzednikow) = 15%');
  // KOSZTY-SUROWCOWE (Maciej 2026-07-25, ZADANIE 3): ogniwo naprawione -- Kuznia
  // zelaza teraz ZASTEPUJE Kuznia (upgradeFrom='kuznia'), wiec jej karta w UI
  // pokazuje SKUMULOWANY % (wlasny 15 + Kuznia 15 = 30), tak jak Kuznia zelaza
  // powinna zachowywac sie "jak Palac" (decyzja wlasciciela).
  eq(M.cumulativeMnoznikForBuildingId('kuznia_zelaza', BUILDINGS), KUZNIA_ZELAZA + KUZNIA, 'UI: Kuznia zelaza = 30% (wlasny+Kuznia, lancuch naprawiony)');
  eq(M.cumulativeMnoznikForBuildingId('wielka_kuznia', BUILDINGS), 45, 'UI: Wielka Kuznia = 45% (wlasny+kuznia_zelaza+kuznia, pelny lancuch)');
  eq(M.cumulativeMnoznikForBuildingId('koszary', BUILDINGS), KOSZARY, 'UI: Koszary (bez poprzednikow) = 20%');
  // GRUPY-BUDYNKOW: Akademia wojskowa juz NIE jest nastepca Koszar w upgradeFrom, wiec jej
  // karta w UI pokazuje TYLKO wlasny % (20), nie skumulowane 40 -- Koszary maja swoja
  // WLASNA karte z wlasnym 20%, oba budynki stoja obok siebie w panelu miasta.
  eq(M.cumulativeMnoznikForBuildingId('akademia_wojskowa', BUILDINGS), AKADEMIA_WOJSK, 'UI: Akademia wojskowa = tylko wlasny % (20%), Koszary NIE doliczane (niezalezny budynek)');
  eq(M.cumulativeMnoznikForBuildingId('warsztat_oblezniczy', BUILDINGS), WARSZTAT_OBLEZ, 'UI: Warsztat oblezniczy (bez poprzednikow) = 10%');
  eq(M.cumulativeMnoznikForBuildingId('ratusz', BUILDINGS), 0, 'UI: budynek spoza obu list -> 0');
  eq(M.cumulativeMnoznikForBuildingId('nieznany_id_xyz', BUILDINGS), 0, 'UI: nieznany id -> 0, bez wyjatku');
}

// ===========================================================================
// I. Cykl w danych upgradeFrom nie zawiesza funkcji
// ===========================================================================
console.log('\n-- I. Cykl w upgradeFrom -- nie zawiesza funkcji --');
{
  // Dane spreparowane: 'a' <-> 'b' cyklicznie wskazuja na siebie przez upgradeFrom.
  // Oba w ARMOR_BUILDING_IDS, zeby wejsc w sciezke sumowania.
  const cyclicBuildings = [
    { id: 'kuznia', baza: { mnoznik: 15 }, upgradeFrom: 'kuznia_zelaza' },
    { id: 'kuznia_zelaza', baza: { mnoznik: 15 }, upgradeFrom: 'kuznia' },
    { id: 'wielka_kuznia', baza: { mnoznik: 15 }, upgradeFrom: undefined },
  ];
  const start = Date.now();
  const result = M.cityArmorBonusPercent(['kuznia', 'kuznia_zelaza'], cyclicBuildings);
  const elapsedMs = Date.now() - start;
  assert(elapsedMs < 1000, `cykl w danych: funkcja wraca szybko (nie zawiesza sie), ${elapsedMs}ms`);
  assert(Number.isFinite(result) && result >= 0, `cykl w danych: zwraca skonczona nieujemna liczbe (got ${result})`);
  eq(result, 30, 'cykl w danych: kazde ogniwo policzone raz mimo cyklu (kuznia+kuznia_zelaza=30, bez petli w nieskonczonosc)');

  // To samo dla cumulativeMnoznikForBuildingId (sciezka pojedynczego budynku w UI).
  const startSingle = Date.now();
  const single = M.cumulativeMnoznikForBuildingId('kuznia', cyclicBuildings);
  assert(Date.now() - startSingle < 1000, 'cykl w danych: cumulativeMnoznikForBuildingId tez wraca szybko');
  assert(Number.isFinite(single) && single >= 0, `cykl w danych (pojedynczy budynek): skonczona nieujemna liczba (got ${single})`);
}

// ===========================================================================
// J. Ten sam budynek nie jest liczony dwa razy (miasto z jednoczesnie
//    poprzednikiem i nastepca na liscie -- stan patologiczny/blad danych)
// ===========================================================================
console.log('\n-- J. Podwojne liczenie -- kazdy budynek policzony najwyzej raz --');
{
  // Miasto ma jednoczesnie 'kuznia_zelaza' I 'wielka_kuznia' (nie powinno sie zdarzyc
  // w normalnej rozgrywce -- awans PODMIENIA id -- ale funkcja musi byc odporna).
  // KOSZTY-SUROWCOWE (Maciej 2026-07-25, ZADANIE 3): od naprawy ogniwa
  // kuznia_zelaza->kuznia lancuch ma TRZY prawdziwe ogniwa (kuznia, kuznia_zelaza,
  // wielka_kuznia), a 'kuznia' samo nie jest na liscie -- doliczane wylacznie
  // przez lancuch 'kuznia_zelaza'. Kazde z trzech ogniw liczy sie NAJWYZEJ RAZ:
  // 'kuznia_zelaza' (15, doliczajac tez 'kuznia'=15 -> 30) + 'wielka_kuznia'
  // (wlasny 15, BEZ powtorki kuznia_zelaza/kuznia, juz policzonych) = 45.
  // Naiwne podwojne liczenie dalyby 60 (2x kuznia_zelaza + 2x kuznia).
  const pathological = M.cityArmorBonusPercent(['kuznia_zelaza', 'wielka_kuznia'], BUILDINGS);
  eq(pathological, 45, 'kuznia_zelaza obecny jednoczesnie z wielka_kuznia: kazde ogniwo (kuznia/kuznia_zelaza/wielka_kuznia) liczone najwyzej raz -> 45%, nie 60%');

  // GRUPY-BUDYNKOW (Maciej 2026-07-25): 'koszary' + 'akademia_wojskowa' razem w miescie
  // to juz NIE stan patologiczny -- to teraz NORMALNY stan gry (upgradeFrom usuniety,
  // oba budynki niezalezne). Zostaje tu jako regresja: dedup po `countedGlobal` w
  // sumMnoznikForPresentBuildings nadal chroni przed podwojnym liczeniem, gdyby kiedys
  // wrocil lancuch (np. inna para budynkow) -- prosta suma dwoch ODREBNYCH id = 40%.
  const koszaryAkademiaTogether = M.citySoftStatBonusPercent(['koszary', 'akademia_wojskowa'], BUILDINGS);
  eq(koszaryAkademiaTogether, 40, 'koszary + akademia_wojskowa razem w miescie (stan normalny): 40%, nie 60%');
}

// ===========================================================================
// G. Kompatybilnosc wsteczna
// ===========================================================================
console.log('\n-- G. Kompatybilnosc wsteczna (stary zapis bez pol) --');
{
  eq(M.unitPancerzBonusProc(undefined), 0, 'undefined -> 0');
  eq(M.unitPancerzBonusProc(null), 0, 'null -> 0');
  eq(M.unitPancerzBonusProc({}), 0, '{} (stary zapis bez pola) -> 0');
  eq(M.unitPancerzBonusProc({ pancerzBonusProc: undefined }), 0, 'pole=undefined -> 0');
  eq(M.unitParametryBonusProc({}), 0, 'Parametry: stary zapis bez pola -> 0');
  eq(M.unitPancerzBonusFrac({}), 0, 'ulamek: stary zapis -> 0 (nie NaN)');
  eq(M.unitBuildingBonusLabel({}), '', 'etykieta pusta gdy brak obu bonusow');
  eq(M.unitBuildingBonusLabel({ pancerzBonusProc: 15 }), 'Pancerz +15%', 'etykieta: tylko Pancerz');
  assert(
    M.unitBuildingBonusLabel({ pancerzBonusProc: 15, parametryBonusProc: 20 }).includes('Pancerz +15%')
    && M.unitBuildingBonusLabel({ pancerzBonusProc: 15, parametryBonusProc: 20 }).includes('Parametry +20%'),
    'etykieta: oba bonusy obecne',
  );
}

// ===========================================================================
// E. PARYTET AI -- identyczny wynik dla gracza (ownerId=0) i AI (ownerId!=0)
// ===========================================================================
console.log('\n-- E. PARYTET AI --');
{
  const cityBuiltIds = ['koszary', 'warsztat_oblezniczy', 'kuznia'];

  // bestBuildingProgressAfterCityVisit nie przyjmuje w ogole ownerId -- jedyna
  // roznica miedzy "jednostka gracza" a "jednostka AI" to pole ownerId na
  // obiekcie jednostki, ktorego ta funkcja NIGDY nie czyta. Test pilnuje, zeby
  // przyszla zmiana nie wprowadzila przypadkiem galezi "tylko gracz".
  const playerUnit = { id: 'u1', ownerId: 0, pancerzBonusProc: 0, parametryBonusProc: 0 };
  const aiUnit      = { id: 'u2', ownerId: 7, pancerzBonusProc: 0, parametryBonusProc: 0 };

  const playerNext = M.bestBuildingProgressAfterCityVisit(playerUnit, cityBuiltIds, BUILDINGS);
  const aiNext      = M.bestBuildingProgressAfterCityVisit(aiUnit, cityBuiltIds, BUILDINGS);
  eq(playerNext.pancerzBonusProc, aiNext.pancerzBonusProc, 'PARYTET: Pancerz identyczny gracz vs AI (ten sam scenariusz miasta)');
  eq(playerNext.parametryBonusProc, aiNext.parametryBonusProc, 'PARYTET: Parametry identyczne gracz vs AI');
  eq(playerNext.pancerzBonusProc, KUZNIA, 'PARYTET: wartosc sensowna (=Kuznia)');
  eq(playerNext.parametryBonusProc, KOSZARY + WARSZTAT_OBLEZ, 'PARYTET: wartosc sensowna (=Koszary+Warsztat)');

  // Ten sam bonus na jednostce -> identyczne mnozniki walki niezaleznie od ownerId.
  const playerBonus = M.buildingCombatBonusForUnit({ ...playerUnit, ...playerNext });
  const aiBonus      = M.buildingCombatBonusForUnit({ ...aiUnit, ...aiNext });
  eq(playerBonus.pancerz, aiBonus.pancerz, 'PARYTET: buildingCombatBonusForUnit.pancerz identyczny gracz vs AI');
  eq(playerBonus.other, aiBonus.other, 'PARYTET: buildingCombatBonusForUnit.other identyczny gracz vs AI');
}

// ===========================================================================
// F. applyCityVisitBonusGain + komunikat (przejscie przez miasto)
// ===========================================================================
console.log('\n-- F. Nabycie bonusu przy wizycie w miescie --');
{
  const unit = { pancerzBonusProc: 0, parametryBonusProc: 0 };
  const gain = M.applyCityVisitBonusGain(unit, ['kuznia', 'koszary'], BUILDINGS);
  assert(gain.changed, 'applyCityVisitBonusGain: pierwsza wizyta zmienia stan');
  eq(gain.armorGained, KUZNIA, 'przyrost Pancerza = Kuznia');
  eq(gain.softGained, KOSZARY, 'przyrost Parametrow = Koszary');
  eq(unit.pancerzBonusProc, KUZNIA, 'jednostka ma zapisany Pancerz');
  const again = M.applyCityVisitBonusGain(unit, ['kuznia'], BUILDINGS);
  assert(!again.changed, 'druga wizyta w slabszym miescie nic nie daje');
  const hint = M.formatBuildingBonusGainHint('Wojownik', 'Ateny', gain);
  assert(hint.includes('Wojownik') && hint.includes('Ateny') && hint.includes('Kuźnia'),
    'formatBuildingBonusGainHint: tresc komunikatu');
}

//    nie wplywaja na redukcje pancerza. Deterministyczny rng (zawsze trafia).
// ===========================================================================
console.log('\n-- H. Integracja resolveCombat: Pancerz redukuje dmg, Sciezka B go nie rusza --');
{
  const attackerDef = {
    'Jednostka': 'TestAtk', 'Typ': 'TestAtk', 'Rola (linia)': 'Wrecz',
    meleeAttack: 50, meleeDefence: 5, weaponDamage: 20, armor: 0, piercing: 0,
    chargeBonus: 0, health: 50, missileAttack: 0,
    'Prog dezercji (% health)': 0,
  };
  const defenderBaseDef = {
    'Jednostka': 'TestDef', 'Typ': 'TestDef', 'Rola (linia)': 'Wrecz',
    meleeAttack: 0, meleeDefence: -50, weaponDamage: 0, armor: 10, piercing: 0,
    chargeBonus: 0, health: 1000, missileAttack: 0,
    'Prog dezercji (% health)': 0,
  };
  const rngAlwaysHit = () => 0; // roll=0 < hitPct zawsze (garantowane trafienie)

  function firstHitDamage(defenderArmorBonusFrac, defenderOtherBonusFrac) {
    const atk = M.combatUnitFromDef(attackerDef, { typNazwa: 'TestAtk' });
    const def = M.combatUnitFromDef(defenderBaseDef, { typNazwa: 'TestDef' });
    const res = M.resolveCombat(atk, def, {
      maxRounds: 1,
      rng: rngAlwaysHit,
      defenderBuildingBonus: { pancerz: defenderArmorBonusFrac, other: defenderOtherBonusFrac },
    });
    // Sciezka B (other) skaluje TEZ health (mods.health, jak civ bonusy) -- wiec HP
    // poczatkowe (hpDefStart) rosnie razem z bonusem "other". Zeby wyizolowac SAM
    // dmg-per-hit (ktory zalezy WYLACZNIE od Pancerza), odtwarzamy hpDefStart
    // dokladnie tak, jak liczy to resolveCombat (Math.round(health*(1+other))),
    // i porownujemy go do defenderHpLeft.
    const hpDefStart = Math.round(def.health * (1 + defenderOtherBonusFrac));
    return hpDefStart - res.defenderHpLeft;
  }

  // Porownujemy PIERWSZY cios (round=1) bez bonusu vs z bonusem Pancerza -- obrazenia MUSZA spasc.
  const dmgNoBonus   = firstHitDamage(0, 0);
  const dmgArmorOnly = firstHitDamage(0.5, 0);       // +50% Pancerza (Sciezka A)
  const dmgOtherOnly = firstHitDamage(0, 0.5);       // +50% parametry miekkie (Sciezka B), Pancerz NIETKNIETY

  assert(dmgArmorOnly < dmgNoBonus, `bonus Pancerza redukuje obrazenia zadane obroncy (${dmgArmorOnly} < ${dmgNoBonus})`);
  eq(dmgOtherOnly, dmgNoBonus, `bonus Sciezki B (parametry) NIE zmienia obrazen zwiazanych z Pancerzem (${dmgOtherOnly} === ${dmgNoBonus})`);
}

// --- summary ---------------------------------------------------------------
console.log(`\nunit-building-bonuses-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
