/**
 * diplomacy-siege-war-gate.ts — R-WEB-AI-SIEGE-WITHOUT-WAR-Q1.
 *
 * JEDEN wspólny predykat „strony są w wojnie" dla oblężenia miasta na mapie.
 * Oblężenie / szturm / auto-oblężenie wolno ustanowić (i utrzymać) WYŁĄCZNIE między
 * stronami, które są wrogami. `areEnemies` to `areEnemyOwners` z main.ts:
 * barbarzyńcy = zawsze wrogowie; reszta = relacja dyplomatyczna `status === 'wojna'`
 * (wojna wymuszona i wojny państw-miast też są zapisane jako 'wojna').
 *
 * PURE: bez DOM/THREE. Reuse `classifyCityAttack` z mapSiegeDetect.
 */

import type { City } from './cities';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance } from '../units/setup';
import { classifyCityAttack, type MapSiegeContext } from './mapSiegeDetect';

export type AreEnemyOwnersFn = (ownerA: number, ownerB: number) => boolean;

/** Czy strona `besiegerOwnerId` może oblegać/atakować miasto `defenderOwnerId` (wojna). */
export function siegeAllowedBetween(
  besiegerOwnerId: number,
  defenderOwnerId: number,
  areEnemies: AreEnemyOwnersFn,
): boolean {
  if (besiegerOwnerId === defenderOwnerId) return false;
  return areEnemies(besiegerOwnerId, defenderOwnerId);
}

/** Jednostki przy murach (dystans 1) należące do strony będącej w wojnie z właścicielem miasta. */
export function enemyUnitsAdjacentToCity(
  city: City,
  units: RuntimeUnit[],
  areEnemies: AreEnemyOwnersFn,
): RuntimeUnit[] {
  return units.filter(
    u => hexDistance(u.q, u.r, city.q, city.r) === 1
      && siegeAllowedBetween(u.ownerId, city.ownerId, areEnemies),
  );
}

/**
 * Auto-oblężenie z bramką wojny: jak `detectAutoSiegeOnCity`, ale kotwicą może być
 * wyłącznie jednostka WROGA (w stanie wojny z właścicielem miasta). Obca jednostka
 * w pokoju / rozejmie / NAP / sojuszu stojąca przy murze NIE zakłada oblężenia.
 */
export function detectWarAutoSiegeOnCity(
  city: City,
  units: RuntimeUnit[],
  areEnemies: AreEnemyOwnersFn,
): MapSiegeContext | null {
  if (!city.maMur) return null;
  const anchor = enemyUnitsAdjacentToCity(city, units, areEnemies)[0];
  return anchor ? classifyCityAttack(anchor, city, units) : null;
}

/**
 * Czy trwające oblężenie nadal jest ważne: oblegający stoi przy murze ORAZ nadal jest
 * w wojnie z właścicielem miasta (po pokoju/rozejmie/NAP/sojuszu — oblężenie spada).
 */
export function isSiegeStillValid(
  city: City,
  besiegerOwnerId: number,
  units: RuntimeUnit[],
  areEnemies: AreEnemyOwnersFn,
): boolean {
  if (!siegeAllowedBetween(besiegerOwnerId, city.ownerId, areEnemies)) return false;
  return units.some(
    u => u.ownerId === besiegerOwnerId && hexDistance(u.q, u.r, city.q, city.r) === 1,
  );
}
