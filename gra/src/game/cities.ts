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
import miastoParams from '../../data/miasto-params.json';

export interface City {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  name: string;
  population: number;
  magazynZywnosci?: number;
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
}

export const MIN_CITY_DISTANCE = (miastoParams.min_dystans_miast?.wartosc as number) ?? 5;

export function canFoundCity(
  q: number,
  r: number,
  cities: City[],
  map: GameMap,
  opts?: { withinTerritory?: (q: number, r: number) => boolean },
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
    if (hexDistance(q, r, city.q, city.r) < MIN_CITY_DISTANCE) {
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

  return {
    id: 'city' + cities.length,
    ownerId: settler.ownerId,
    q: settler.q,
    r: settler.r,
    name,
    population: 1,
  };
}

export function foundCityAt(
  q: number,
  r: number,
  ownerId: number,
  cities: City[],
  map: GameMap,
  name: string,
): City | null {
  const { ok } = canFoundCity(q, r, cities, map);
  if (!ok) {
    return null;
  }

  return {
    id: 'city' + cities.length,
    ownerId,
    q,
    r,
    name,
    population: 1,
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
