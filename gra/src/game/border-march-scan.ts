/**
 * border-march-scan.ts — P5: wykrycie par intruz→właściciel terytorium (koniec tury).
 * Pure scan; kary relacji w diplomacy-border-march.ts (CYWILIZACJE).
 */
import type { TerritoryNode } from '../map/territory';
import { territoryOwnerAt } from '../map/territory';
import type { RuntimeUnit } from '../units/setup';

export interface BorderMarchPair {
  intruderOwnerId: number;
  territoryOwnerId: number;
}

export type IsMilitaryUnitFn = (unit: RuntimeUnit) => boolean;

function pairKey(intruder: number, owner: number): string {
  return `${intruder}->${owner}`;
}

/**
 * Zbiera unikalne pary (intruderOwnerId, territoryOwnerId) na koniec tury.
 * Jednostka na obcym terytorium (ownerAt != null && ownerAt !== unit.ownerId).
 * Dedupe: wiele jednostek tej samej pary → jeden wpis.
 *
 * `isMilitaryUnit` — przekazywane dla kompatybilności z CYW (autoryzacja wojsko/cywil);
 * skan obejmuje **wszystkie** jednostki na cudzym terytorium.
 */
export function collectUnauthorizedBorderPairs(
  units: readonly RuntimeUnit[],
  allCityNodesByOwner: readonly TerritoryNode[],
  _isMilitaryUnit: IsMilitaryUnitFn,
): BorderMarchPair[] {
  const seen = new Set<string>();
  const out: BorderMarchPair[] = [];

  for (const unit of units) {
    if (unit.inGarnizon) continue;

    const ownerAt = territoryOwnerAt(unit.q, unit.r, allCityNodesByOwner);
    if (ownerAt == null || ownerAt === unit.ownerId) continue;

    const key = pairKey(unit.ownerId, ownerAt);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ intruderOwnerId: unit.ownerId, territoryOwnerId: ownerAt });
  }

  return out;
}

/** Domyślny helper: wojsko = wszystko poza osadnikiem (Integrator / testy). */
export function defaultIsMilitaryUnit(unit: RuntimeUnit): boolean {
  return unit.category !== 'osadnik';
}
