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
export type HasFormalAllianceFn = (ownerA: number, ownerB: number) => boolean;

export interface SiegeBattleSideOwners {
  attacker: ReadonlySet<number>;
  defender: ReadonlySet<number>;
}

/**
 * Owners represented in a two-sided siege battle. A side contains its principal
 * and formal active allies that are already at war with the opposing principal.
 * An unrelated third party that happens to be at war with the city is not a
 * member of the besieger's side; barbarians hostile to both sides are likewise
 * not assigned to either side unless one is the siege principal.
 */
export function siegeBattleSideOwners(
  besiegerOwnerId: number,
  cityOwnerId: number,
  candidateOwnerIds: Iterable<number>,
  areEnemies: AreEnemyOwnersFn,
  hasFormalAlliance: HasFormalAllianceFn,
): SiegeBattleSideOwners {
  const attackers = new Set<number>();
  const defenders = new Set<number>();
  if (!siegeAllowedBetween(besiegerOwnerId, cityOwnerId, areEnemies)) {
    return { attacker: attackers, defender: defenders };
  }

  attackers.add(besiegerOwnerId);
  defenders.add(cityOwnerId);
  for (const ownerId of candidateOwnerIds) {
    if (ownerId !== besiegerOwnerId && hasFormalAlliance(ownerId, besiegerOwnerId)
      && siegeAllowedBetween(ownerId, cityOwnerId, areEnemies)) {
      attackers.add(ownerId);
    }
    if (ownerId !== cityOwnerId && hasFormalAlliance(ownerId, cityOwnerId)
      && siegeAllowedBetween(ownerId, besiegerOwnerId, areEnemies)) {
      defenders.add(ownerId);
    }
  }

  // A contradictory/stale pair of alliances cannot be represented as two
  // battle units at once. Keep both principals; omit a third owner that would
  // otherwise be duplicated across the opposing rosters.
  for (const ownerId of attackers) {
    if (ownerId !== besiegerOwnerId && ownerId !== cityOwnerId && defenders.has(ownerId)) {
      attackers.delete(ownerId);
      defenders.delete(ownerId);
    }
  }
  return { attacker: attackers, defender: defenders };
}

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

/**
 * R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (C): czy auto-oblężenie po turze AI wolno założyć na miasto `cityOwnerId`
 * z kotwicą `besiegerOwnerId`. Dotąd (OBL-MAP-01) skanowano WYŁĄCZNIE miasta gracza (`ownerId === 0`), więc AI nigdy
 * nie oblegało obwarowanych miast innej AI (wejście na heks miasta z murem jest zablokowane, a bez oblężenia i machin
 * nie ma szturmu) -- AI niszczyły armię wroga i stały pod murami bez zdobycia miasta.
 * Reguła: miasto człowieka -- jak dotąd (każdy wróg w wojnie); miasto innego właściciela -- tylko oblegający
 * główny AI (nie człowiek, nie barbarzyńca) i miasto nie należące do barbarzyńców (barbarzyńcy zdobywają inaczej).
 */
export function aiAutoSiegeAllowed(
  cityOwnerId: number,
  besiegerOwnerId: number,
  isHumanOwner: (ownerId: number) => boolean,
  isBarbarianOwner: (ownerId: number) => boolean,
): boolean {
  if (isHumanOwner(cityOwnerId)) return true;
  if (isHumanOwner(besiegerOwnerId)) return false;
  if (isBarbarianOwner(cityOwnerId) || isBarbarianOwner(besiegerOwnerId)) return false;
  return cityOwnerId !== besiegerOwnerId;
}

/**
 * Kandydat na auto-oblężenie w skanie po turze AI (scanAutoSiegesAfterAiTurn): miasto z murem, jeszcze nie oblegane,
 * z wrogą jednostką przy murze, spełniające `aiAutoSiegeAllowed`. Miasta INNYCH foteli człowieka (ownerId != 0) pominięte
 * jak dotąd (hotseat bez zmian). Zwraca kontekst oblężenia albo null. Wydzielone z main.ts, by test uruchamiał tę samą logikę.
 */
export function autoSiegeCandidateForScan(
  city: City,
  units: RuntimeUnit[],
  areEnemies: AreEnemyOwnersFn,
  isHumanOwner: (ownerId: number) => boolean,
  isBarbarianOwner: (ownerId: number) => boolean,
): MapSiegeContext | null {
  if (city.oblegane || !city.maMur) return null;
  const auto = detectWarAutoSiegeOnCity(city, units, areEnemies);
  if (!auto) return null;
  if (city.ownerId !== 0 && isHumanOwner(city.ownerId)) return null;
  if (!aiAutoSiegeAllowed(city.ownerId, auto.oblegajacyOwnerId, isHumanOwner, isBarbarianOwner)) return null;
  return auto;
}
