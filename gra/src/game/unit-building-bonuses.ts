/**
 * unit-building-bonuses.ts
 *
 * Dwie NIEZALEZNE sciezki trwalego ulepszania jednostek przez budynki miasta
 * (decyzja wlasciciela 2026-07-25 -- zastepuje martwy/blednie policzony
 * "mnoznik -> % do Pracy", patrz dyspozycje/AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md
 * i komentarz "Step 5" w game/economy.ts).
 *
 * SCIEZKA A -- PANCERZ (Armor): budynki kuznicze, kazdy +baza.mnoznik% do
 *   Pancerza jednostki, kumulatywnie za KAZDY budynek REALNIE obecny w
 *   miescie (nie "kiedykolwiek zbudowany" -- awans budynku PODMIENIA id,
 *   patrz production.ts applyCompletedBuildingIds: miasto z Wielka Kuznia
 *   nie ma juz 'kuznia_zelaza' na liscie, bo Wielka Kuznia je zastapila
 *   (upgradeFrom). Dlatego realny max dzis to kuznia+kuznia_zelaza=+30%, a
 *   "wszystkie trzy=+45%" z opisu zadania jest teoretyczne/nieosiagalne --
 *   patrz raport koncowy.
 *     kuznia          -> buildings.json baza.mnoznik (15)
 *     kuznia_zelaza   -> buildings.json baza.mnoznik (15)
 *     wielka_kuznia   -> buildings.json baza.mnoznik (15) [epoka 4, PARKOWANE]
 *
 * SCIEZKA B -- PARAMETRY MIEKKIE (wszystko POZA Pancerzem: atak, obrona,
 *   atak dystansowy, zdrowie, uderzenie/szarza): budynki szkoleniowe,
 *   analogicznie kumulatywne wg budynkow realnie obecnych. Akademia wojskowa
 *   zastepuje Koszary (upgradeFrom) -- ten sam mechanizm/zastrzezenie jak wyzej.
 *     koszary             -> buildings.json baza.mnoznik (20)
 *     akademia_wojskowa   -> buildings.json baza.mnoznik (20)
 *     warsztat_oblezniczy -> buildings.json baza.mnoznik (10)
 *
 * Jednostka PAMIETA najlepszy % kiedykolwiek osiagniety na kazdej sciezce
 * (RuntimeUnit.pancerzBonusProc / parametryBonusProc, patrz units/setup.ts) --
 * bonus jest TRWALY: nie znika po wyjsciu z miasta, nie znika przy zburzeniu
 * budynku. Aktualizowane w dwoch miejscach (main.ts):
 *   (a) przy wyprodukowaniu jednostki w miescie (applyProductionCompleted /
 *       recruitment-queue completion) -- jednostka od razu dostaje poziom
 *       miasta, w ktorym powstala;
 *   (b) raz na koniec kazdej tury, dla KAZDEJ jednostki stojacej na heksie
 *       WLASNEGO miasta (applyCityVisitBuildingBonuses w main.ts, wolane po
 *       wakeSentryUnitsOnEnemyContact() -- pozycje wszystkich jednostek,
 *       gracz+AI+miasta-panstwa, sa juz finalne dla tej tury).
 * Obie sciezki oraz oba haki sa CALKOWICIE ownerId-agnostyczne -- PARYTET AI.
 *
 * Kompatybilnosc wsteczna: stare zapisy bez tych pol -> pole `undefined` po
 * JSON.parse -> kazda funkcja ponizej normalizuje brak/NaN/ujemna wartosc do 0
 * (brak bonusu), bez wyjatku.
 */

// ---------------------------------------------------------------------------
// Building lookup (minimalny ksztalt -- unikamy importu data/loader.ts, zeby
// nie tworzyc cyklu z buildings.json-adjacent modulami; economy.ts/production.ts
// robia to samo z wlasnymi lokalnymi typami BuildingRecord/BuildingDef).
// ---------------------------------------------------------------------------

export interface MnoznikBuildingLookup {
  id: string;
  baza?: { mnoznik?: number } | null;
}

/** Sciezka A: budynki kuznicze -> % do Pancerza (rozpoznanie PO id, nie nazwie/kategorii). */
export const ARMOR_BUILDING_IDS: readonly string[] = ['kuznia', 'kuznia_zelaza', 'wielka_kuznia'];

/** Sciezka B: budynki szkoleniowe -> % do wszystkich staty bojowych poza Pancerzem. */
export const SOFT_STAT_BUILDING_IDS: readonly string[] = ['koszary', 'akademia_wojskowa', 'warsztat_oblezniczy'];

/**
 * Ktora sciezke reprezentuje `baza.mnoznik` DANEGO budynku (rozpoznanie po id).
 * Uzywane przez UI (cityPanel.ts), zeby chip/wiersz "mnoznik" w karcie budynku
 * pokazywal PRAWDZIWY efekt (Pancerz / Parametry), zamiast martwej ogolnej
 * etykiety "x N mnoznik" sprzed usuniecia "mnoznik -> Praca" (Step 5,
 * economy.ts). Budynki spoza obu list (Targowisko/Akademia/
 * Pretorium) maja dzis w danych mnoznik z HISTORYCZNYCH powodow (kiedys szedl
 * do Pracy) -- ich mnoznik jest odtad CALKOWICIE martwy (swiadoma decyzja
 * wlasciciela: tylko 6 budynkow wojskowych dostaje nowa mechanike), wiec
 * zwracamy null dla nich -- UI powinno przestac pokazywac ten chip.
 */
export function mnoznikRoleForBuildingId(id: string): 'pancerz' | 'parametry' | null {
  if (ARMOR_BUILDING_IDS.includes(id)) return 'pancerz';
  if (SOFT_STAT_BUILDING_IDS.includes(id)) return 'parametry';
  return null;
}

function mnoznikOf(b: MnoznikBuildingLookup | undefined): number {
  const v = b?.baza?.mnoznik;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/**
 * Suma baza.mnoznik budynkow z `ids`, ktore sa REALNIE obecne w
 * `builtBuildingIds` tego miasta (city.cityBuilt -- lista PO podmianach
 * upgrade'owych, patrz komentarz modulu). Zwraca % (np. 30 = +30%), nie ulamek.
 */
function sumMnoznikForPresentBuildings(
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
  ids: readonly string[],
): number {
  if (!builtBuildingIds?.length || !buildings?.length) return 0;
  const built = new Set(builtBuildingIds);
  let total = 0;
  for (const id of ids) {
    if (!built.has(id)) continue;
    const b = buildings.find(x => x.id === id);
    total += mnoznikOf(b);
  }
  return total;
}

/** Sciezka A: % Pancerz aktualnie oferowany przez to miasto (suma budynkow obecnych, max +45% teoretycznie / +30% realnie dzis). */
export function cityArmorBonusPercent(
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): number {
  return sumMnoznikForPresentBuildings(builtBuildingIds, buildings, ARMOR_BUILDING_IDS);
}

/** Sciezka B: % parametry miekkie aktualnie oferowany przez to miasto (max +50% teoretycznie / +30% realnie dzis). */
export function citySoftStatBonusPercent(
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): number {
  return sumMnoznikForPresentBuildings(builtBuildingIds, buildings, SOFT_STAT_BUILDING_IDS);
}

// ---------------------------------------------------------------------------
// Stan trwaly jednostki (podzbior pol RuntimeUnit -- unikamy importu
// units/setup.ts, zeby ten modul zostal pure/bez zaleznosci na runtime typy).
// ---------------------------------------------------------------------------

export interface UnitBuildingProgress {
  pancerzBonusProc?: number;
  parametryBonusProc?: number;
}

/** Odczyt z defaultem 0 -- stare zapisy bez pola / NaN / ujemne = brak bonusu. */
export function unitPancerzBonusProc(unit: UnitBuildingProgress | null | undefined): number {
  const v = unit?.pancerzBonusProc;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

export function unitParametryBonusProc(unit: UnitBuildingProgress | null | undefined): number {
  const v = unit?.parametryBonusProc;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/** Ulamek (0.15 = +15%) gotowy do bezposredniego mnozenia staty bojowej. */
export function unitPancerzBonusFrac(unit: UnitBuildingProgress | null | undefined): number {
  return unitPancerzBonusProc(unit) / 100;
}

/** Ulamek (0.20 = +20%) dla wszystkich staty bojowych POZA Pancerzem. */
export function unitParametryBonusFrac(unit: UnitBuildingProgress | null | undefined): number {
  return unitParametryBonusProc(unit) / 100;
}

/**
 * Wariant A wlasciciela: jednostka dostaje bonus rowniez przy WEJSCIU do
 * miasta (nie tylko przy produkcji); liczy sie NAJLEPSZE miasto kiedykolwiek
 * odwiedzone -- max(dotychczasowy %, % aktualnie oferowany przez to miasto).
 * Sciezki sa niezalezne (kazda liczona/max-owana osobno).
 *
 * Zwraca NOWY obiekt (nie mutuje `unit`) -- wywolujacy przypisuje pola
 * z powrotem na RuntimeUnit. Jesli obie wartosci sa niezmienione wzgledem
 * wejscia, wywolujacy moze pominac zapis (przydatne np. do unikania
 * niepotrzebnego "dirty" flagowania stanu gry).
 */
export function bestBuildingProgressAfterCityVisit(
  unit: UnitBuildingProgress | null | undefined,
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): { pancerzBonusProc: number; parametryBonusProc: number } {
  const cityArmor = cityArmorBonusPercent(builtBuildingIds, buildings);
  const citySoft  = citySoftStatBonusPercent(builtBuildingIds, buildings);
  return {
    pancerzBonusProc:   Math.max(unitPancerzBonusProc(unit), cityArmor),
    parametryBonusProc: Math.max(unitParametryBonusProc(unit), citySoft),
  };
}

/** True gdy `bestBuildingProgressAfterCityVisit` zmieniloby ktorakolwiek wartosc (do "dirty" skrotow). */
export function buildingProgressWouldChange(
  unit: UnitBuildingProgress | null | undefined,
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): boolean {
  const next = bestBuildingProgressAfterCityVisit(unit, builtBuildingIds, buildings);
  return next.pancerzBonusProc !== unitPancerzBonusProc(unit)
    || next.parametryBonusProc !== unitParametryBonusProc(unit);
}

/** Etykieta do tooltipu/karty jednostki, np. "Pancerz +30% \xb7 Parametry +20%". Pusty string gdy brak obu bonusow. */
export function unitBuildingBonusLabel(unit: UnitBuildingProgress | null | undefined): string {
  const armor = unitPancerzBonusProc(unit);
  const soft  = unitParametryBonusProc(unit);
  const parts: string[] = [];
  if (armor > 0) parts.push(`Pancerz +${armor}%`);
  if (soft > 0) parts.push(`Parametry +${soft}%`);
  return parts.join(' · ');
}

// ---------------------------------------------------------------------------
// Wpiecie w silnik walki (game/combat.ts + battle/battleScene.ts).
//
// civCombatStatMultipliers (civ-bonuses.ts) juz produkuje dokladnie ten sam
// ksztalt -- addytywne ulamki { atk, obrona, pancerz, uderzenie, rangedAtk,
// health } mnozace bazowe staty przez applyMultiplier(). Bonus budynkow
// dokladamy do TEGO SAMEGO obiektu (zamiast np. mnozyc staty jednostki raz
// wczesniej w combatUnitFromDef) -- to jedyny bezpieczny sposob, bo w
// battleScene.ts (computeInstantResult, tryb "pomin animacje") CombatUnit.health
// bywa nadpisywany surowym aktualnym HP PO zbudowaniu (cu_a.health = a.hp) i
// dopiero potem skalowany przez atkBaseMods.health w resolveCombat -- gdyby
// bonus byl juz "wpieczony" w CombatUnit.health, ta nadpisanka by go
// bezpowrotnie kasowala (zero efektu Sciezki B na HP w trybie pomin-animacje).
// Scalajac na poziomie mnoznikow, bonus przezywa kazde miejsce, w ktorym civ
// bonusy juz dzialaja poprawnie (te same testy/te sama architektura).
// ---------------------------------------------------------------------------

/** Ulamkowy bonus budynkow gotowy do scalenia z CivStatMultipliers. */
export interface BuildingCombatBonus {
  /** Sciezka A -- dodaje sie do mods.pancerz. */
  pancerz: number;
  /** Sciezka B -- dodaje sie do WSZYSTKICH pozostalych pol mods (atk/obrona/uderzenie/rangedAtk/health). */
  other: number;
}

export const ZERO_BUILDING_COMBAT_BONUS: BuildingCombatBonus = { pancerz: 0, other: 0 };

/** Bonus budynkow tej konkretnej jednostki, gotowy do przekazania jako ResolveCombatOpts.attacker/defenderBuildingBonus. */
export function buildingCombatBonusForUnit(unit: UnitBuildingProgress | null | undefined): BuildingCombatBonus {
  return { pancerz: unitPancerzBonusFrac(unit), other: unitParametryBonusFrac(unit) };
}

/**
 * Minimalny ksztalt CivStatMultipliers (civ-bonuses.ts) -- zduplikowany tu
 * jako strukturalny typ (nie import), zeby unikac zaleznosci tego modulu na
 * kod walki; civ-bonuses.ts/combat.ts przekazuja swoj wlasny obiekt, ktory
 * strukturalnie pasuje.
 */
export interface StatMultipliersLike {
  atk: number;
  obrona: number;
  pancerz: number;
  uderzenie: number;
  rangedAtk: number;
  health: number;
}

/**
 * Scala bonus budynkow w istniejacy obiekt mnoznikow (mutuje `mods` w
 * miejscu i zwraca go, dla wygody wywolania w jednej linii). Pancerz idzie
 * WYLACZNIE do `mods.pancerz`; `other` idzie do wszystkich pozostalych piec
 * pol -- odzwierciedla podzial "Pancerz vs wszystko inne" z zadania.
 */
export function mergeBuildingBonusIntoStatMultipliers<T extends StatMultipliersLike>(
  mods: T,
  bonus: BuildingCombatBonus | null | undefined,
): T {
  if (!bonus) return mods;
  if (bonus.pancerz) mods.pancerz += bonus.pancerz;
  if (bonus.other) {
    mods.atk += bonus.other;
    mods.obrona += bonus.other;
    mods.uderzenie += bonus.other;
    mods.rangedAtk += bonus.other;
    mods.health += bonus.other;
  }
  return mods;
}
