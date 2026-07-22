/**
 * cities.ts
 * City founding logic: validation, creation, and name generation.
 *
 * Pure logic -- no DOM, no THREE, no side effects.
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance } from '../units/setup';
import { freshWealthState, type WealthState } from './wealth';
import { readCityFoodBuffer } from './economy-upkeep';
import type { SiegeMachinesState } from './siegeMachines';
import miastoParams from '../../data/miasto-params.json';
export interface CityPodzialHandlu {
  procentNauka:    number;
  procentPieniadz: number;
  procentLuksus:   number;
}

/** Per-miasto suwak Pracy (Budynki vs teren/pula). */
export interface CityPodzialPracy {
  procentBudynki: number;
}

/** Profile auto-przydziału pól okolicy (B1.4 / #4C). */
export type OkolicaFocus = 'zrownowazone' | 'zywnosc' | 'produkcja' | 'podatki';

/** Tryb przypisania pól: auto (AI) lub ręczna korekta 👤. */
export type OkolicaTryb = 'auto' | 'reczny';

export const DEFAULT_OKOLICA_FOCUS: OkolicaFocus = 'zrownowazone';
export const DEFAULT_OKOLICA_TRYB: OkolicaTryb = 'auto';

/** Profile auto-kolejki budynków (panel Produkcja). */
export type BudowaFocus =
  | 'zrownowazone'
  | 'wzrost'
  | 'wojsko'
  | 'kultura'
  | 'prawo'
  | 'produkcja';

/** auto = AI dobiera budynki wg budowaFocus; reczny = gracz wybiera ręcznie. */
export type BudowaTryb = 'auto' | 'reczny';

export const DEFAULT_BUDOWA_FOCUS: BudowaFocus = 'zrownowazone';
export const DEFAULT_BUDOWA_TRYB: BudowaTryb = 'reczny';

/** Domyslny podzial Handlu — zgodny z buildEconParams / econ-params.json normal (20/70/10). */
export const DEFAULT_PODZIAL_HANDLU: Readonly<CityPodzialHandlu> = {
  procentNauka:    20,
  procentPieniadz: 70,
  procentLuksus:   10,
};

/** Domyslny podzial Pracy — zgodny z buildEconParams (70% budynki). */
export const DEFAULT_PODZIAL_PRACY: Readonly<CityPodzialPracy> = {
  procentBudynki: 70,
};

/** Domyślny suwak żywność→wzrost (reszta idzie do zapasów armii). Zgodny z suwak_zywnosc_rozwoj_domyslnie normal=100. */
export const DEFAULT_PROCENT_ROZWOJ = 100;

/** Suwak podziału handlu — tylko wielokrotności 10 (0, 10, …, 100). */
export const HANDEL_PCT_STEP = 10;

export function snapHandelPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n / HANDEL_PCT_STEP) * HANDEL_PCT_STEP));
}

/** Wymusza kroki 10% i sumę = 100 (naprawa starych zapisów / błędnego UI). */
export function normalizePodzialHandlu(split: CityPodzialHandlu): CityPodzialHandlu {
  let p = snapHandelPct(split.procentPieniadz);
  let n = snapHandelPct(split.procentNauka);
  let l = snapHandelPct(split.procentLuksus);
  let sum = p + n + l;
  if (sum !== 100) {
    l = Math.max(0, Math.min(100, l + (100 - sum)));
    sum = p + n + l;
    if (sum !== 100) {
      n = Math.max(0, Math.min(100, n + (100 - sum)));
    }
  }
  return { procentPieniadz: p, procentNauka: n, procentLuksus: l };
}

function freshCityPodzial(): { podzialHandlu: CityPodzialHandlu; podzialPracy: CityPodzialPracy } {
  return {
    podzialHandlu: { ...DEFAULT_PODZIAL_HANDLU },
    podzialPracy:  { ...DEFAULT_PODZIAL_PRACY },
  };
}

/** Uzupełnia brakujące pola podziału po wczytaniu starszego zapisu (SAVE_VERSION bez migracji). */
export function ensureCityPodzialDefaults(city: City): void {
  if (!city.podzialHandlu) city.podzialHandlu = { ...DEFAULT_PODZIAL_HANDLU };
  else city.podzialHandlu = normalizePodzialHandlu(city.podzialHandlu);
  if (!city.podzialPracy) city.podzialPracy = { ...DEFAULT_PODZIAL_PRACY };
}

/** Migracja zapisu v0.1 — podział Handlu/Pracy + Wealth po load. */
export function ensureCitySaveDefaults(city: City): void {
  ensureCityPodzialDefaults(city);
  if (!city.wealthState) city.wealthState = freshWealthState();
  if (!city.okolicaFocus) city.okolicaFocus = DEFAULT_OKOLICA_FOCUS;
  if (!city.okolicaTryb) city.okolicaTryb = DEFAULT_OKOLICA_TRYB;
  if (!city.budowaFocus) city.budowaFocus = DEFAULT_BUDOWA_FOCUS;
  if (!city.budowaTryb) city.budowaTryb = DEFAULT_BUDOWA_TRYB;
  const buf = readCityFoodBuffer(city.magazynZywnosci);
  if (city.magazynZywnosci !== buf) city.magazynZywnosci = buf;
  // E1 Zadanie 2: magazyn surowcow logistycznych (drewno/kamien/glina/ruda) -- pole
  // addytywne, opcjonalne; brak bumpu SAVE_VERSION. Stary zapis (bez pola) dostaje
  // pusty magazyn.
  if (!city.surowce) city.surowce = {};
}

export interface City {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  name: string;
  population: number;
  magazynZywnosci?: number;
  /**
   * E1 Zadanie 2: magazyn PER-MIASTO surowcow logistycznych zasilajacych converters
   * (game/converters.ts): drewno/kamien (dzis zbierane), docelowo glina/ruda.
   * Klucze ASCII zgodne z DEFAULT_CONVERTER_RECIPES (drewno/kamien/paliwo/glina/
   * ruda/deski/cegla/braz/ceramika). Pole addytywne/opcjonalne -- brak w starym
   * zapisie = {} (ensureCitySaveDefaults). NIE myl z civ-wide bramkami braz/zelazo/
   * hodowla (zelazo-access.ts / braz-access.ts / livestock-unlock.ts) -- te zostaja
   * bez zmian, to osobny mechanizm (boolean dostep, nie ilosc).
   */
  surowce?: Record<string, number>;
  /** Ustawiane po zbudowaniu budynku 'mury'; +200% obrony liczy UNITS/silnik. */
  maMur?: boolean;
  /**
   * Czy miasto jest aktualnie oblegane (flaga ustawiana przez UNITS/SILNIK).
   * Gdy true: turn-economy nie nalicza dochodu zywnosci z pol;
   * magazyn maleje o (population + garnizon) na ture.
   */
  oblegane?: boolean;
  /**
   * Liczba jednostek garnizonu w oblezonym miescie.
   * Kazda jednostka zuzywia 1 zywnosc/ture podczas oblezenia.
   * Domyslnie 0 (brak garnizonu / miasto nie oblegane).
   */
  garnizon?: number;
  /** C3: kto oblega (ownerId atakującego) — zapis w save przez cities[]. */
  oblegajacyOwnerId?: number;
  /** C3-Q3=B: zapasy=0 — kapitulacja następnej turze oblężenia / końca tury gracza. */
  siegeCapitulationPending?: boolean;
  /** OBL-S5: kolejka machin oblężniczych (Taran / Wieża). */
  siegeMachines?: SiegeMachinesState;
  /** Per-miasto suwak Handlu; brak = global default w toEconomyCity. */
  podzialHandlu?: CityPodzialHandlu;
  /** Per-miasto suwak Pracy; brak = global default w toEconomyCity. */
  podzialPracy?: CityPodzialPracy;
  /**
   * Per-miasto suwak podziału świeżej żywności: % na wzrost ludności (bufor 🍞).
   * Reszta (100 − procentRozwoj) idzie do zapasów armii państwa. Brak w starym zapisie
   * → migrateCityFoodSplits w silniku (legacy empireFoodStates.procentRozwoj).
   */
  procentRozwoj?: number;
  /** Profil skupienia pól okolicy (auto-assign). */
  okolicaFocus?: OkolicaFocus;
  /** auto | reczny — ręczne 👤 na heksach. */
  okolicaTryb?: OkolicaTryb;
  /** Ręczne przypisanie: "q,r" → liczba 👤 (0|1). */
  okolicaReczne?: Record<string, number>;
  /** Profil auto-kolejki budynków (panel Produkcja). */
  budowaFocus?: BudowaFocus;
  /** auto | reczny — ręczny wybór budynków w kolejce. */
  budowaTryb?: BudowaTryb;
  /** B2-Q12=C: tury grace przed rebelią AI (null = brak). */
  revoltGraceRemaining?: number | null;
  /** Miasto pod kontrolą rebeliantów. */
  rebelState?: boolean;
  /** Stan Wealth per miasto (D3). */
  wealthState?: WealthState;
  /** Skumulowana kultura miasta (UI / playtest). */
  kulturaSkumulowana?: number;
  /** Udział kultury właściciela [0..1]; brak = 1 (miasto założone). Po podboju = 0. */
  ownCultureShare?: number;
  /** D16-A: pozostałe tury immunitetu przed spadkiem poziomu W (start 5). */
  wealthImmunityRemaining?: number;
  /** Tura założenia miasta (opcjonalnie; immunitet W liczy też wealthImmunityRemaining). */
  foundedTurn?: number;
  /**
   * Pula Manpower (siła rekrutacyjna miasta). Brak = przy pierwszym odczycie równa manpowerMax.
   * Koszt jednostki: manpowerNaJednostke[epoka] — patrz gra/src/game/manpower.ts.
   */
  manpower?: number;
  /** F-CITY-HEX: plony centrum sprzed wyczyszczenia hexu (nakładka/ulepszenie/złoże). */
  centerWorkedTile?: import('./economy').WorkedTile;
  /** Startowe miasto-państwo (Sparta/Kapua) — founding: min 3 hex; UI: dopisek „· miasto-państwo”. */
  startCityState?: boolean;
}

export const MIN_CITY_DISTANCE = (miastoParams.min_dystans_miast?.wartosc as number) ?? 5;
/** Min dystans od startowych miast-państw przy zakładaniu nowych miast (Maciej 2026-07-04). */
export const MIN_CITY_DISTANCE_START_CITY_STATE = 3;

export function canFoundCity(
  q: number,
  r: number,
  cities: City[],
  map: GameMap,
  opts?: { withinTerritory?: (q: number, r: number) => boolean; foundingCityState?: boolean },
): { ok: boolean; reason: string } {
  const key = `${q},${r}`;

  if (!(key in map.hexes)) {
    return { ok: false, reason: 'poza mapa' };
  }

  const hex = map.hexes[key];
  if (hex !== undefined) {
    if (hex.terenBazowy === TerenBazowy.Morze ||
        hex.terenBazowy === TerenBazowy.Wybrzeze) {
      return { ok: false, reason: 'morze' };
    }
    if (hex.terenBazowy === TerenBazowy.Gory) {
      return { ok: false, reason: 'gory' };
    }
  }

  for (const city of cities) {
    // Próg 3 obowiązuje gdy ALBO istniejące miasto jest państwem-miastem,
    // ALBO zakładane miasto jest państwem-miastem (kopia typu). Wcześniej brano
    // pod uwagę tylko flagę istniejącego miasta — a stolice (gracza i klastrów)
    // nie mają startCityState, więc państwa-miasta pakowane 3 hex od stolicy były
    // odrzucane przez próg 5 i "znikały" (15 żądanych → ~1 na mapie).
    const minDist = (opts?.foundingCityState || city.startCityState)
      ? MIN_CITY_DISTANCE_START_CITY_STATE
      : MIN_CITY_DISTANCE;
    if (hexDistance(q, r, city.q, city.r) < minDist) {
      return { ok: false, reason: 'za blisko innego miasta' };
    }
  }

  if (opts?.withinTerritory && !opts.withinTerritory(q, r)) {
    return { ok: false, reason: 'poza terytorium' };
  }

  return { ok: true, reason: '' };
}

export function foundCity(
  settler: RuntimeUnit,
  cities: City[],
  map: GameMap,
  name: string,
  opts?: { withinTerritory?: (q: number, r: number) => boolean },
): City | null {
  const { ok } = canFoundCity(settler.q, settler.r, cities, map, opts);
  if (!ok) {
    return null;
  }

  const podzial = freshCityPodzial();
  return {
    id: 'city' + cities.length,
    ownerId: settler.ownerId,
    q: settler.q,
    r: settler.r,
    name,
    population: 1,
    wealthState: freshWealthState(),
    wealthImmunityRemaining: 5,
    podzialHandlu: podzial.podzialHandlu,
    podzialPracy:  podzial.podzialPracy,
    procentRozwoj: DEFAULT_PROCENT_ROZWOJ,
  };
}

export function foundCityAt(
  q: number,
  r: number,
  ownerId: number,
  cities: City[],
  map: GameMap,
  name: string,
  foundingCityState = false,
): City | null {
  const { ok } = canFoundCity(q, r, cities, map, { foundingCityState });
  if (!ok) {
    return null;
  }

  const podzial = freshCityPodzial();
  return {
    id: 'city' + cities.length,
    ownerId,
    q,
    r,
    name,
    population: 1,
    wealthState: freshWealthState(),
    wealthImmunityRemaining: 5,
    podzialHandlu: podzial.podzialHandlu,
    podzialPracy:  podzial.podzialPracy,
    procentRozwoj: DEFAULT_PROCENT_ROZWOJ,
  };
}

const CITY_NAMES: readonly string[] = [
  'Akropol',
  'Memfis',
  'Ur',
  'Teby',
  'Korynt',
  'Sparta',
  'Niniwa',
  'Ateny',
  'Knossos',
  'Mykeny',
  'Babilon',
  'Tyr',
];

/**
 * @deprecated Użyj pickNextRegularCityName / suggestPlayerFoundCityName z civ-names.
 * Zachowane dla foundCityFromVillage — suffix generyczny.
 */
export function cityName(index: number): string {
  if (index >= 0 && index < CITY_NAMES.length) {
    return CITY_NAMES[index] as string;
  }
  return 'Miasto ' + (index + 1);
}


// ---------------------------------------------------------------------------
// foundCityFromVillage -- konwersja wioski w miasto (ready-to-wire, ADDYTYWNE)
// ---------------------------------------------------------------------------

/**
 * Opcje dla foundCityFromVillage, zgodne z foundCityAt/canFoundCity.
 */
export interface FoundFromVillageOpts {
  /** Jak w canFoundCity: opcjonalna funkcja weryfikacji terytorium. */
  withinTerritory?: (q: number, r: number) => boolean;
}

/**
 * Wynik foundCityFromVillage: sukces lub blad z powodem.
 */
export type FoundFromVillageResult =
  | ({ ok: true } & City)
  | { ok: false; reason: string };

/**
 * Cienki helper konwersji wioski w miasto na heksie (q, r).
 *
 * Waliduje przez canFoundCity (ten sam dystans, teren, terytorium).
 * Zwraca nowe miasto (jak foundCityAt) LUB { ok: false, reason }.
 *
 * ready-to-wire; aktywacja = decyzja master/Maciej;
 * MAPA usuwa wioske po sukcesie (po zwroceniu { ok: true }).
 *
 * NIE usuwa wioski -- stan wioski trzyma MAPA, wywolujacy usuwa ja po sukcesie.
 * NIE zmienia istniejacych sygnatur.
 *
 * @param q      - kolumna heksu wioski
 * @param r      - rzad heksu wioski
 * @param cities - aktualna lista miast (do sprawdzenia dystansu)
 * @param map    - mapa globalna (GameMap)
 * @param opts   - opcjonalne: withinTerritory
 * @returns nowe City (ok:true) lub obiekt bledu (ok:false)
 */
export function foundCityFromVillage(
  q: number,
  r: number,
  cities: City[],
  map: GameMap,
  opts?: FoundFromVillageOpts,
): FoundFromVillageResult {
  const check = canFoundCity(q, r, cities, map, opts);
  if (!check.ok) {
    return { ok: false, reason: check.reason };
  }

  const city = foundCityAt(q, r, 0 /* ownerId: wywolujacy ustawi */, cities, map, cityName(cities.length));
  if (city === null) {
    // canFoundCity przeszedl, ale foundCityAt zwrocil null -- nie powinno sie zdarzyc
    return { ok: false, reason: 'foundCityAt zwrocil null (niespodziewane)' };
  }

  return { ok: true, ...city };
}
