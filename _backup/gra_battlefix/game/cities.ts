/**
 * cities.ts
 * City founding logic: validation, creation, and name generation.
 *
 * Pure logic -- no DOM, no THREE, no side effects.
 *
 * Exports:
 *   City                 - city instance shape
 *   MIN_CITY_DISTANCE    - minimum hex distance between any two cities
 *   canFoundCity()       - validate settler position before founding
 *   foundCity()          - create a City from a settler unit
 *   cityName()           - deterministic Polish/ancient city name by index
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance } from '../units/setup';

// ---------------------------------------------------------------------------
// City interface
// ---------------------------------------------------------------------------

/** An active city on the world map. */
export interface City {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  name: string;
  population: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum hex distance (exclusive) between any two cities. */
export const MIN_CITY_DISTANCE = 5;

// ---------------------------------------------------------------------------
// canFoundCity
// ---------------------------------------------------------------------------

/**
 * Validates whether a city can be founded at (q, r).
 *
 * Checks in order:
 *   1. The hex exists in the map          -> reason 'poza mapa'
 *   2. The hex is not Morze or Wybrzeze   -> reason 'morze'
 *   3. The hex is not Gory                -> reason 'gory'
 *   4. No existing city is closer than MIN_CITY_DISTANCE -> reason 'za blisko innego miasta'
 *
 * Returns { ok: true, reason: '' } when all checks pass.
 */
export function canFoundCity(
  q: number,
  r: number,
  cities: City[],
  map: GameMap,
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

  return { ok: true, reason: '' };
}

// ---------------------------------------------------------------------------
// foundCity
// ---------------------------------------------------------------------------

/**
 * Attempts to found a city at the settler's current position.
 *
 * Calls canFoundCity() first; returns null when the position is invalid.
 * On success returns a new City object.  Does NOT mutate cities or units --
 * the caller is responsible for pushing the new city and removing the settler.
 */
export function foundCity(
  settler: RuntimeUnit,
  cities: City[],
  map: GameMap,
  name: string,
): City | null {
  const { ok } = canFoundCity(settler.q, settler.r, cities, map);
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

// ---------------------------------------------------------------------------
// cityName
// ---------------------------------------------------------------------------

/** Polish and ancient city names, ASCII-only (no diacritics). */
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
 * Returns a deterministic city name for the given founding index.
 * Falls back to 'Miasto <index+1>' when the index exceeds the name list.
 */
export function cityName(index: number): string {
  if (index >= 0 && index < CITY_NAMES.length) {
    return CITY_NAMES[index] as string;
  }
  return 'Miasto ' + (index + 1);
}
