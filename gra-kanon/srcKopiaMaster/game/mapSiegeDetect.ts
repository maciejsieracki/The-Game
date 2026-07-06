/**
 * mapSiegeDetect.ts — klasyfikacja starcia przy ataku miasta z mapy (C1/C3).
 * PURE: bez DOM, bez THREE.
 */

import type { City } from './cities';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance } from '../units/setup';

export type MapStarcieTryb = 'oblezenie' | 'zdobycie_z_marszu' | 'bitwa_polowa';

export interface MapSiegeContext {
  tryb: MapStarcieTryb;
  city: City;
  atakujacy: RuntimeUnit;
  /** Jednostka wroga na heksie miasta (garnizon), jeśli jest. */
  garnizonUnit: RuntimeUnit | null;
  oblegajacyOwnerId: number;
}

export function cityAtHex(cities: City[], q: number, r: number): City | null {
  return cities.find(c => c.q === q && c.r === r) ?? null;
}

export function isAdjacentToHex(q: number, r: number, tq: number, tr: number): boolean {
  return hexDistance(q, r, tq, tr) === 1;
}

/** Jednostki wroga w promieniu 1 heksa od miasta (obóz oblężniczy). */
export function besiegersAdjacentToCity(
  city: City,
  units: RuntimeUnit[],
  besiegerOwnerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === besiegerOwnerId &&
      hexDistance(u.q, u.r, city.q, city.r) === 1,
  );
}

/**
 * Klasyfikuje atak na miasto (C1-Q1):
 * - mur + wrogi atakujący → oblężenie (bez preBattle)
 * - brak muru → zdobycie z marszu / bitwa polowa
 */
export function classifyCityAttack(
  atakujacy: RuntimeUnit,
  city: City,
  units: RuntimeUnit[],
): MapSiegeContext {
  const garnizonUnit = units.find(
    u => u.ownerId === city.ownerId && u.q === city.q && u.r === city.r,
  ) ?? null;

  let tryb: MapStarcieTryb;
  if (city.maMur) {
    tryb = 'oblezenie';
  } else if (garnizonUnit) {
    tryb = 'zdobycie_z_marszu';
  } else {
    tryb = 'bitwa_polowa';
  }

  return {
    tryb,
    city,
    atakujacy,
    garnizonUnit,
    oblegajacyOwnerId: atakujacy.ownerId,
  };
}

/** Czy atakujący może rozpocząć oblężenie (obok miasta, wroga frakcja). */
export function canInitiateSiege(
  atakujacy: RuntimeUnit,
  city: City,
): boolean {
  if (atakujacy.ownerId === city.ownerId) return false;
  if (!city.maMur) return false;
  return isAdjacentToHex(atakujacy.q, atakujacy.r, city.q, city.r);
}

/** Auto-oblężenie: wróg stoi obok miasta gracza z murem. */
export function detectAutoSiegeOnCity(
  city: City,
  units: RuntimeUnit[],
): MapSiegeContext | null {
  if (!city.maMur) return null;
  for (const u of units) {
    if (u.ownerId === city.ownerId) continue;
    if (!isAdjacentToHex(u.q, u.r, city.q, city.r)) continue;
    return classifyCityAttack(u, city, units);
  }
  return null;
}
