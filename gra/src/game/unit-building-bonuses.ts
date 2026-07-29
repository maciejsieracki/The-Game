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
 *   miescie. Awans budynku PODMIENIA id na liscie miasta (production.ts
 *   applyCompletedBuildingIds -- upgradeFrom), wiec poprzednik znika z
 *   `cityBuilt` -- ALE (decyzja wlasciciela 2026-07-25, druga tura) budynek-
 *   nastepca wnosi SWOJ WLASNY % + % calego lancucha poprzednikow (rekurencyjnie
 *   po `upgradeFrom`, patrz `sumMnoznikForPresentBuildings`/`chainMnoznikContribution`
 *   nizej). Efekt: kuznia+kuznia_zelaza=+30%, a po awansie na Wielka Kuznia
 *   (miasto ma kuznia+wielka_kuznia) = 15(kuznia)+15(wielka_kuznia wlasny)+
 *   15(kuznia_zelaza, doliczone z lancucha) = +45%, dokladnie liczba zalozona
 *   przez wlasciciela w zadaniu.
 *     kuznia          -> buildings.json baza.mnoznik (15)
 *     kuznia_zelaza   -> buildings.json baza.mnoznik (15)
 *     wielka_kuznia   -> buildings.json baza.mnoznik (15) [epoka 4, PARKOWANE, upgradeFrom=kuznia_zelaza]
 *
 * SCIEZKA B -- PARAMETRY MIEKKIE (wszystko POZA Pancerzem: atak, obrona,
 *   atak dystansowy, zdrowie, uderzenie/szarza): budynki szkoleniowe,
 *   analogicznie kumulatywne wg budynkow realnie obecnych + suma lancucha
 *   upgradeFrom (patrz Sciezka A powyzej). GRUPY-BUDYNKOW (Maciej 2026-07-25,
 *   likwidacja "awansu bocznego"): Akademia wojskowa NIE zastepuje juz Koszar
 *   (upgradeFrom usuniety z buildings.json) -- oba budynki stoja w miescie
 *   OSOBNO i licza sie WPROST (nie przez lancuch), z Warsztatem oblezniczym
 *   obecnym w miescie wychodzi (20+20)+10=+50%, dokladnie jak przed zmiana.
 *     koszary             -> buildings.json baza.mnoznik (20)
 *     akademia_wojskowa   -> buildings.json baza.mnoznik (20) [niezalezny budynek od 2026-07-25]
 *     warsztat_oblezniczy -> buildings.json baza.mnoznik (10)
 *
 * Jednostka PAMIETA najlepszy % kiedykolwiek osiagniety na kazdej sciezce
 * (RuntimeUnit.pancerzBonusProc / parametryBonusProc, patrz units/setup.ts) --
 * bonus jest TRWALY: nie znika po wyjsciu z miasta, nie znika przy zburzeniu
 * budynku. Aktualizowane w dwoch miejscach (main.ts):
 *   (a) przy wyprodukowaniu jednostki w miescie (applyProductionCompleted /
 *       recruitment-queue completion) -- jednostka od razu dostaje poziom
 *       miasta, w ktorym powstala;
 *   (b) przy WEJSCIU na heks WLASNEGO miasta w trakcie ruchu (kazdy heks
 *       sciezki marszu -- main.ts applyCityVisitBonusesAlongPath) + komunikat
 *       dla gracza gdy cos nowego zostalo zdobyte; PARYTET AI bez UI.
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
  /** id budynku-poprzednika w lancuchu awansu (patrz production.ts applyCompletedBuildingIds). */
  upgradeFrom?: string | null;
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
 * Twardy limit glebokosci lancucha upgradeFrom -- zabezpieczenie przed
 * cyklem w danych (blad w buildings.json nie moze zawiesic gry). W praktyce
 * lancuchy maja 2-3 poziomy; 32 to hojny margines bez ryzyka petli.
 */
const MAX_UPGRADE_CHAIN_DEPTH = 32;

/**
 * Przechodzi lancuchem `upgradeFrom` w gore od `startId` (wlacznie) i sumuje
 * `baza.mnoznik` KAZDEGO ogniwa nalezacego do `allowed` (sciezka A lub B),
 * pomijajac (wnoszac 0, ale NIE przerywajac przejscia) ogniwa spoza obu list.
 * `countedGlobal` jest dzielone miedzy wywolaniami dla wszystkich budynkow
 * jednego miasta -- kazdy `id` moze wniesc swoj % NAJWYZEJ RAZ do sumy
 * calego miasta, nawet jesli lancuch dwoch roznych obecnych budynkow by go
 * ponownie napotkal (zabezpieczenie przed podwojnym liczeniem, patrz
 * `sumMnoznikForPresentBuildings`). Cykl w `upgradeFrom` zatrzymuje sie na
 * lokalnym `visited` (ogniwo juz odwiedzone W TYM przejsciu) + twardym
 * limicie glebokosci -- co pierwsze.
 */
function chainMnoznikContribution(
  startId: string,
  byId: ReadonlyMap<string, MnoznikBuildingLookup>,
  allowed: ReadonlySet<string>,
  countedGlobal: Set<string>,
): number {
  let total = 0;
  let cur: string | undefined = startId;
  let depth = 0;
  const visitedThisChain = new Set<string>();
  while (cur && depth < MAX_UPGRADE_CHAIN_DEPTH && !visitedThisChain.has(cur)) {
    visitedThisChain.add(cur);
    const b = byId.get(cur);
    if (!b) break;
    if (allowed.has(cur) && !countedGlobal.has(cur)) {
      countedGlobal.add(cur);
      total += mnoznikOf(b);
    }
    const from = typeof b.upgradeFrom === 'string' ? b.upgradeFrom.trim() : '';
    cur = from || undefined;
    depth++;
  }
  return total;
}

/**
 * Suma baza.mnoznik budynkow z `ids`, ktore sa REALNIE obecne w
 * `builtBuildingIds` tego miasta (city.cityBuilt -- lista PO podmianach
 * upgrade'owych, patrz komentarz modulu) -- DOLICZAJAC do kazdego obecnego
 * budynku caly jego lancuch poprzednikow `upgradeFrom` (decyzja wlasciciela
 * 2026-07-25: awans ma pokazywac SUME, nie tylko wlasny procent). Zwraca %
 * (np. 45 = +45%), nie ulamek.
 *
 * Kazdy `id` (obecny budynek LUB jego poprzednik w lancuchu) liczy sie
 * najwyzej raz w calej sumie miasta -- gdyby miasto mialo jednoczesnie
 * poprzednika i nastepce na liscie (stan patologiczny/blad danych), poprzednik
 * nie zostanie doliczony podwojnie (raz jako "obecny budynek", raz jako
 * "ogniwo lancucha nastepcy").
 */
function sumMnoznikForPresentBuildings(
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
  ids: readonly string[],
): number {
  if (!builtBuildingIds?.length || !buildings?.length) return 0;
  const built = new Set(builtBuildingIds);
  const byId = new Map(buildings.map(b => [b.id, b] as const));
  const allowed = new Set(ids);
  const counted = new Set<string>();
  let total = 0;
  for (const id of ids) {
    if (!built.has(id)) continue;
    total += chainMnoznikContribution(id, byId, allowed, counted);
  }
  return total;
}

/** Sciezka A: % Pancerz aktualnie oferowany przez to miasto (suma budynkow obecnych + ich lancuchow upgradeFrom, max +45%). */
export function cityArmorBonusPercent(
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): number {
  return sumMnoznikForPresentBuildings(builtBuildingIds, buildings, ARMOR_BUILDING_IDS);
}

/** Sciezka B: % parametry miekkie aktualnie oferowany przez to miasto (suma budynkow obecnych + ich lancuchow upgradeFrom, max +50%). */
export function citySoftStatBonusPercent(
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): number {
  return sumMnoznikForPresentBuildings(builtBuildingIds, buildings, SOFT_STAT_BUILDING_IDS);
}

/**
 * Skumulowany % (wlasny + caly lancuch poprzednikow `upgradeFrom`) DANEGO
 * budynku, niezaleznie od tego, czy jest fizycznie "obecny" w jakims miescie
 * -- do wyswietlania w UI (karta budynku, panel "Statystyki (silnik)"), gdzie
 * pytanie brzmi "ile % daje TEN budynek", a nie "ile % daje TO miasto".
 * Jedna funkcja uzywana wszedzie (cityPanel.ts, building-upgrades.ts), zeby
 * wzor sumowania lancucha nie byl kopiowany. Zwraca 0 dla budynkow spoza obu
 * list (`mnoznikRoleForBuildingId` = null) oraz przy braku danych.
 */
export function cumulativeMnoznikForBuildingId(
  buildingId: string,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): number {
  if (!buildings?.length) return 0;
  const role = mnoznikRoleForBuildingId(buildingId);
  if (!role) return 0;
  const ids = role === 'pancerz' ? ARMOR_BUILDING_IDS : SOFT_STAT_BUILDING_IDS;
  const byId = new Map(buildings.map(b => [b.id, b] as const));
  return chainMnoznikContribution(buildingId, byId, new Set(ids), new Set());
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

// ---------------------------------------------------------------------------
// POZIOMY ODZNAK PER SCIEZKA (0-3) -- zrodlo prawdy dla render/unitUpgradeBadges.ts
//
// C-OBCE-JEDN-Q2 (Maciej, 2026-07-29): zeton jednostki na mapie pokazuje odtad
// DWIE OSOBNE odznaki (ikona Koszar po lewej od gwiazdek weterana, ikona Kuzni
// po prawej), a NIE jedna wspolna odznake z SUMY obu sciezek. Poziom kazdej
// sciezki liczy sie WYLACZNIE z jej wlasnych punktow procentowych.
//
// == WYPROWADZENIE PROGOW (z danych gry, nie zgadywane) =====================
// Metoda jest ta sama, ktora byla juz udokumentowana dla sumy obu sciezek
// (render/unitUpgradeBadges.ts): rowne TERCJE maksimum osiagalnego w grze,
// granice zaokraglone w dol do pelnych punktow procentowych.
//
//   prog_1 = floor(maksimum_sciezki / 3)
//   prog_2 = floor(2 * maksimum_sciezki / 3)
//   poziom = 0 gdy premia = 0 pp; 1 gdy 0 < premia <= prog_1;
//            2 gdy prog_1 < premia <= prog_2; 3 gdy premia > prog_2
//
// SCIEZKA A -- premia Pancerza (RuntimeUnit.pancerzBonusProc), jednostka: pp
//   maksimum = premia Pancerza z Kuzni:            +15 pp
//            + premia Pancerza z Kuzni zelaza:     +15 pp
//            + premia Pancerza z Wielkiej Kuzni:   +15 pp
//            = 45 pp  (ARMOR_BUILDING_IDS, buildings.json baza.mnoznik)
//   prog_1 = floor(45/3)   = 15 pp
//   prog_2 = floor(2*45/3) = 30 pp
//
// SCIEZKA B -- premia Parametrow (RuntimeUnit.parametryBonusProc), jednostka: pp
//   (Parametry = atak, obrona, atak dystansowy, zdrowie, uderzenie/szarza --
//    wszystko POZA Pancerzem)
//   maksimum = premia Parametrow z Koszar:              +20 pp
//            + premia Parametrow z Akademii wojskowej:  +20 pp
//            + premia Parametrow z Warsztatu oblezniczego: +10 pp
//            = 50 pp  (SOFT_STAT_BUILDING_IDS, buildings.json baza.mnoznik)
//   prog_1 = floor(50/3)   = 16 pp
//   prog_2 = floor(2*50/3) = 33 pp
//
// == TABELA KONTROLNA -- REALNE KOMBINACJE BUDYNKOW =========================
// Sprawdzenie, ze progi sie NIE degeneruja (kazdy z trzech poziomow jest
// osiagalny, najmniejszy pojedynczy budynek sciezki daje poziom 1, komplet
// budynkow sciezki daje poziom 3):
//
//   SCIEZKA A -- premia Pancerza (pp)                      -> poziom odznaki Kuzni
//   ---------------------------------------------------------------------------
//   brak budynkow kuzniczych                     0 pp      -> 0 (brak ikony)
//   kuznia                                      15 pp      -> 1 (braz)
//   kuznia + kuznia_zelaza                      30 pp      -> 2 (srebro)
//   kuznia + wielka_kuznia (lancuch upgradeFrom)45 pp      -> 3 (zloto)   [komplet]
//
//   SCIEZKA B -- premia Parametrow (pp)                    -> poziom odznaki Koszar
//   ---------------------------------------------------------------------------
//   brak budynkow szkoleniowych                  0 pp      -> 0 (brak ikony)
//   warsztat_oblezniczy                         10 pp      -> 1 (braz)    [najmniejszy budynek sciezki]
//   koszary                                     20 pp      -> 2 (srebro)
//   koszary + warsztat_oblezniczy               30 pp      -> 2 (srebro)
//   koszary + akademia_wojskowa                 40 pp      -> 3 (zloto)
//   koszary + akademia_wojskowa + warsztat      50 pp      -> 3 (zloto)   [komplet]
//
// Uwaga do sciezki B: pojedyncze Koszary (20 pp) daja od razu poziom 2, bo
// 20 pp to 40% maksimum tej sciezki (50 pp) -- nie jest to blad progu, tylko
// skutek tego, ze Koszary sa DWUKROTNIE mocniejsze od Warsztatu oblezniczego
// (20 pp vs 10 pp). Zaden poziom nie jest pusty i zaden nie zjada calej skali.
// ---------------------------------------------------------------------------

/** Poziom odznaki JEDNEJ sciezki na zetonie: 0 = brak ikony, 1-3 = braz/srebro/zloto. */
export type UnitPathBadgeLevel = 0 | 1 | 2 | 3;

/** Maksimum sciezki A (Pancerz) w pp: Kuznia 15 + Kuznia zelaza 15 + Wielka Kuznia 15. */
export const ARMOR_PATH_MAX_PP = 45;
/** Maksimum sciezki B (Parametry) w pp: Koszary 20 + Akademia wojskowa 20 + Warsztat oblezniczy 10. */
export const SOFT_PATH_MAX_PP = 50;

/** Gorne granice tercji sciezki A w pp: [15, 30] (patrz wyprowadzenie wyzej). */
export const ARMOR_PATH_LEVEL_MAX_PP: readonly [number, number] = [
  Math.floor(ARMOR_PATH_MAX_PP / 3),
  Math.floor((ARMOR_PATH_MAX_PP * 2) / 3),
];

/** Gorne granice tercji sciezki B w pp: [16, 33] (patrz wyprowadzenie wyzej). */
export const SOFT_PATH_LEVEL_MAX_PP: readonly [number, number] = [
  Math.floor(SOFT_PATH_MAX_PP / 3),
  Math.floor((SOFT_PATH_MAX_PP * 2) / 3),
];

/** Wspolna funkcja progowa: premia w pp + granice tercji -> poziom odznaki 0-3. */
function pathBadgeLevelFromPp(pp: number, bounds: readonly [number, number]): UnitPathBadgeLevel {
  if (!Number.isFinite(pp) || pp <= 0) return 0;
  if (pp <= bounds[0]) return 1;
  if (pp <= bounds[1]) return 2;
  return 3;
}

/**
 * SCIEZKA A -- poziom odznaki Kuzni (0-3) z premii Pancerza jednostki w pp.
 * Odczyt idzie przez unitPancerzBonusProc() (normalizacja undefined/NaN/ujemnych
 * ze starych zapisow do 0 pp), zeby mapa i tooltip nie mogly sie rozjechac.
 * PARYTET AI: brak jakiegokolwiek warunku na ownerId.
 */
export function armorPathBadgeLevel(unit: UnitBuildingProgress | null | undefined): UnitPathBadgeLevel {
  return pathBadgeLevelFromPp(unitPancerzBonusProc(unit), ARMOR_PATH_LEVEL_MAX_PP);
}

/**
 * SCIEZKA B -- poziom odznaki Koszar (0-3) z premii Parametrow jednostki w pp.
 * Odczyt idzie przez unitParametryBonusProc() (jak wyzej).
 * PARYTET AI: brak jakiegokolwiek warunku na ownerId.
 */
export function softPathBadgeLevel(unit: UnitBuildingProgress | null | undefined): UnitPathBadgeLevel {
  return pathBadgeLevelFromPp(unitParametryBonusProc(unit), SOFT_PATH_LEVEL_MAX_PP);
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

/** Wynik jednorazowego nabycia bonusu po wizycie w miescie (heks sciezki ruchu). */
export interface BuildingBonusGain {
  changed: boolean;
  armorGained: number;
  softGained: number;
  armorTotal: number;
  softTotal: number;
}

/**
 * Stosuje bonus miasta na jednostce (mutuje pola procentowe). Zwraca przyrost
 * wzgledem stanu sprzed wizyty -- do komunikatu UI i testow.
 */
export function applyCityVisitBonusGain(
  unit: UnitBuildingProgress,
  builtBuildingIds: readonly string[] | null | undefined,
  buildings: readonly MnoznikBuildingLookup[] | null | undefined,
): BuildingBonusGain {
  const prevArmor = unitPancerzBonusProc(unit);
  const prevSoft = unitParametryBonusProc(unit);
  const next = bestBuildingProgressAfterCityVisit(unit, builtBuildingIds, buildings);
  const armorGained = Math.max(0, next.pancerzBonusProc - prevArmor);
  const softGained = Math.max(0, next.parametryBonusProc - prevSoft);
  const changed = armorGained > 0 || softGained > 0;
  if (changed) {
    unit.pancerzBonusProc = next.pancerzBonusProc;
    unit.parametryBonusProc = next.parametryBonusProc;
  }
  return {
    changed,
    armorGained,
    softGained,
    armorTotal: next.pancerzBonusProc,
    softTotal: next.parametryBonusProc,
  };
}

/** Komunikat po zdobyciu bonusu (gracz) -- puste gdy brak przyrostu. */
export function formatBuildingBonusGainHint(
  unitLabel: string,
  cityName: string,
  gain: Pick<BuildingBonusGain, 'armorGained' | 'softGained' | 'armorTotal' | 'softTotal'>,
): string {
  const parts: string[] = [];
  if (gain.armorGained > 0) {
    parts.push(`Kuźnia +${gain.armorGained}% pancerza (razem +${gain.armorTotal}%)`);
  }
  if (gain.softGained > 0) {
    parts.push(`Koszary +${gain.softGained}% parametrów (razem +${gain.softTotal}%)`);
  }
  if (parts.length === 0) return '';
  return `${unitLabel} — ${cityName}: ${parts.join(' · ')}`;
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

/**
 * Aliasy zgodnosci dla karty jednostki (ui/unitCardStatus.ts, C-OBCE-JEDN-KARTA).
 * Definicja progow zyje WYLACZNIE wyzej (ARMOR_PATH_LEVEL_MAX_PP / SOFT_PATH_LEVEL_MAX_PP)
 * -- FALA 43 miala wlasny, rownolegly komplet o IDENTYCZNYCH wartosciach
 * (floor(max/3), floor(2*max/3) -> Pancerz 15/30 pp, Parametry 16/33 pp);
 * scalone w jedno zrodlo, zeby zeton na mapie i karta nie mogly sie rozjechac.
 */
export type PathBadgeLevel = UnitPathBadgeLevel;
/** Maksimum sciezki A (Pancerz) w pp -- alias ARMOR_PATH_MAX_PP. */
export const PATH_A_MAX_PP = ARMOR_PATH_MAX_PP;
/** Maksimum sciezki B (Parametry) w pp -- alias SOFT_PATH_MAX_PP. */
export const PATH_B_MAX_PP = SOFT_PATH_MAX_PP;
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
