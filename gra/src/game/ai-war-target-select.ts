// R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (A) — cele marszu AI w wojnie (czysta funkcja, wołana z main.ts).
//
// Decyzja właściciela (2026-11-03): cel ataku AI w wojnie z INNĄ AI = NAJBLIŻSZE miasto wroga (nie stolica).
// „Najbliższe" liczy planWarAllInCapital od kotwicy grupy wojsk (nearestTarget, odległość heksowa); remis:
// słabiej broniowane (pole `defenders`), potem niższe id. Stolica pozostaje celem tylko jeśli jest najbliższym miastem.
// R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1 (2026-11-08, zgłoszenie właściciela): ta sama zasada obowiązuje
// także, gdy AI atakuje GRACZA: cel = NAJBLIŻSZE miasto gracza (nie jego stolica). Barbarzyńcy jako atakujący
// -- bez zmian (tylko stolica); barbarzyńcy nie są celem w tej liście (engage/ownerIds ich wykluczają).

import type { WarCapitalTarget } from './warAllInCapital';

export interface WarTargetCity {
  id: string;
  ownerId: number;
  q: number;
  r: number;
}

export interface WarTargetUnit {
  ownerId: number;
  q: number;
  r: number;
}

export interface BuildWarTargetsInput {
  selfOwnerId: number;
  /** Właściciele miast kandydujący na wrogów (bez `selfOwnerId`, barbarzyńców i wyeliminowanych), posortowani. */
  enemyOwnerIds: readonly number[];
  engage: (targetOwnerId: number) => boolean;
  cities: readonly WarTargetCity[];
  /** Jednostki BOJOWE (bez cywilów i zwiadowców) -- liczone jako obrońcy miasta stojący na jego heksie. */
  combatUnits: readonly WarTargetUnit[];
  isHuman: (ownerId: number) => boolean;
  isBarbarian: (ownerId: number) => boolean;
  capitalCityIdForOwner: (ownerId: number) => string | null;
}

/** Para (atakujący AI -> cel: AI lub GRACZ) objęta zasadą „najbliższe miasto". Barbarzyńca jako atakujący lub cel -- poza zasadą. */
export function isNearestCityWarPair(
  selfOwnerId: number,
  targetOwnerId: number,
  isHuman: (ownerId: number) => boolean,
  isBarbarian: (ownerId: number) => boolean,
): boolean {
  return !isHuman(selfOwnerId) && !isBarbarian(selfOwnerId) && !isBarbarian(targetOwnerId);
}

/** Lista celów dla planWarAllInCapital: AI->(AI lub gracz) wszystkie miasta wroga (planer wybiera najbliższe), inaczej stolica. */
export function buildWarCityTargets(inp: BuildWarTargetsInput): WarCapitalTarget[] {
  const targets: WarCapitalTarget[] = [];
  for (const o of inp.enemyOwnerIds) {
    if (!inp.engage(o)) continue;
    if (isNearestCityWarPair(inp.selfOwnerId, o, inp.isHuman, inp.isBarbarian)) {
      for (const c of inp.cities) {
        if (c.ownerId !== o) continue;
        let defenders = 0;
        for (const u of inp.combatUnits) {
          if (u.ownerId === o && u.q === c.q && u.r === c.r) defenders++;
        }
        targets.push({ ownerId: o, cityId: c.id, q: c.q, r: c.r, defenders });
      }
      continue;
    }
    const capId = inp.capitalCityIdForOwner(o);
    const cap = capId ? inp.cities.find(c => c.id === capId && c.ownerId === o) : undefined;
    if (cap) targets.push({ ownerId: o, cityId: cap.id, q: cap.q, r: cap.r });
  }
  return targets;
}
