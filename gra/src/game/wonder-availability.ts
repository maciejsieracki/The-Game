/**
 * wonder-availability.ts — bramka dostępności budowy cudu (pure logic).
 *
 * Warstwy (wszystkie AND):
 * 1. epoka imperium >= wonder.epokaWejscia
 * 2. wszystkie techUnlock odkryte
 * 3. E only: techUnlock >= epokaWejscia państwa (D-CUD-TECH-WEJSCIA)
 * 4. E: typ państwa na liście cywilizacje[]
 * 5. maxNaSwiecie: brak ukończonego egzemplarza na mapie
 */

import type { CivEntryEpochRow } from './civ-entry-epoch';
import type { WonderDef } from './wonders-data';
import {
  buildTechEpochMap,
  type TechEpochMap,
  wonderTechValidForCivEntry,
} from './wonder-civ-tech';

export type WonderBlockReason =
  | 'civ_not_exclusive'
  | 'era_too_early'
  | 'tech_missing'
  | 'tech_before_civ_entry'
  | 'already_built_world';

export interface WonderBuildGateInput {
  wonder: Pick<
    WonderDef,
    'id' | 'dostep' | 'cywilizacje' | 'techUnlock' | 'epokaWejscia' | 'maxNaSwiecie'
  >;
  civType: string;
  civRow: CivEntryEpochRow;
  playerEra: number;
  unlockedTechs: ReadonlySet<string> | readonly string[];
  /** id cudów już ukończonych na mapie (globalnie). */
  completedWonderIds: readonly string[];
  techMap?: TechEpochMap;
}

export interface WonderBuildGateResult {
  ok: boolean;
  reasons: WonderBlockReason[];
  missingTech: string[];
}

function asTechSet(unlocked: ReadonlySet<string> | readonly string[]): Set<string> {
  return unlocked instanceof Set ? unlocked : new Set(unlocked);
}

/** Czy cud E/R może być budowany przez dane państwo w tej turze/epoce. */
export function evaluateWonderBuildGate(input: WonderBuildGateInput): WonderBuildGateResult {
  const {
    wonder,
    civType,
    civRow,
    playerEra,
    unlockedTechs,
    completedWonderIds,
    techMap,
  } = input;

  const reasons: WonderBlockReason[] = [];
  const missingTech: string[] = [];
  const techs = wonder.techUnlock ?? [];
  const unlocked = asTechSet(unlockedTechs);
  const map = techMap ?? new Map<string, string>();

  if (wonder.dostep === 'E' && !wonder.cywilizacje.includes(civType)) {
    reasons.push('civ_not_exclusive');
  }

  if (playerEra < wonder.epokaWejscia) {
    reasons.push('era_too_early');
  }

  for (const t of techs) {
    if (!unlocked.has(t)) missingTech.push(t);
  }
  if (missingTech.length > 0) reasons.push('tech_missing');

  if (wonder.dostep === 'E' && map.size > 0 && !wonderTechValidForCivEntry(civRow, techs, map)) {
    reasons.push('tech_before_civ_entry');
  }

  const max = wonder.maxNaSwiecie ?? 1;
  const builtCount = completedWonderIds.filter((id) => id === wonder.id).length;
  if (builtCount >= max) reasons.push('already_built_world');

  return {
    ok: reasons.length === 0,
    reasons,
    missingTech,
  };
}

/** Lista cudów z indeksu państwa, które przechodzą bramkę (kolejność z panstwa). */
export function listBuildableWondersForCiv(
  wonders: readonly WonderDef[],
  civType: string,
  civRow: CivEntryEpochRow,
  playerEra: number,
  unlockedTechs: ReadonlySet<string> | readonly string[],
  completedWonderIds: readonly string[],
  techMap?: TechEpochMap,
): WonderDef[] {
  return wonders.filter((w) =>
    evaluateWonderBuildGate({
      wonder: w,
      civType,
      civRow,
      playerEra,
      unlockedTechs,
      completedWonderIds,
      techMap,
    }).ok,
  );
}

export { buildTechEpochMap };
