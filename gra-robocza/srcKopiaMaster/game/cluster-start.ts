/**
 * cluster-start.ts — orchestracja startu klastra (SILNIK / handoff).
 * Składa MAPA cluster-spawn + CYWILIZACJE civ-names w plan gotowy do main.ts.
 */

import type { CivsData } from '../data/loader';
import type { GameMap } from '../types/map';
import {
  buildClusterSpawnPlan,
  displayLabelForSlot,
  type ClusterSpawnPlan,
  type ClusterSpawnSlot,
  type ForeignTypeClusterGroup,
} from '../map/cluster-spawn';
import { startRelationForPair } from './diplomacy-layers';
import type { Relation } from './diplomacy';

export type { ClusterSpawnSlot, ClusterSpawnPlan, ForeignTypeClusterGroup };

export interface ClusterStartPlan {
  playerStartHex: { q: number; r: number };
  playerStartCityName: string;
  aiStartHexes: Array<{ q: number; r: number; ownerId: number }>;
  spawnCities: Array<{ q: number; r: number; ownerId: number; name: string }>;
  /** Obcy typ → pełny klaster (MAP-P1-01). */
  foreignTypeClusters: ForeignTypeClusterGroup[];
  aiOwnerCivMap: Map<number, string>;
  ownerDisplayName: Map<number, string>;
  simplifiedDiplomacyOwners: Set<number>;
  /** Obcy typ — pełna dyplomacja dopiero po kontakcie (D-START-3A). */
  foreignTypeOwners: Set<number>;
  /** Wszystkie miasta AI z klastra — profil kopia_typu_obronna. */
  typCityCopyOwners: Set<number>;
  startRelations: Map<number, Relation>;
  placement: ClusterSpawnPlan['placement'];
}

export interface BuildClusterStartInput {
  map: GameMap;
  civs: CivsData;
  seed: number;
  playerCivId: string;
  rywaleNaKlaster: number;
  aktywneTypy?: number;
}

/** Pełny plan startu — konsumuje SILNIK w doStartGame(). */
export function buildClusterStartPlan(input: BuildClusterStartInput): ClusterStartPlan {
  const spawnPlan = buildClusterSpawnPlan({
    map: input.map,
    civs: input.civs,
    seed: input.seed,
    playerTyp: input.playerCivId,
    rywaleNaKlaster: input.rywaleNaKlaster,
    aktywneTypy: input.aktywneTypy,
  });

  const aiOwnerCivMap = new Map<number, string>();
  const ownerDisplayName = new Map<number, string>();
  const simplifiedDiplomacyOwners = new Set<number>();
  const foreignTypeOwners = new Set<number>();
  const typCityCopyOwners = new Set<number>();
  const startRelations = new Map<number, Relation>();
  const spawnCities: ClusterStartPlan['spawnCities'] = [];
  const aiStartHexes: ClusterStartPlan['aiStartHexes'] = [];

  for (const slot of spawnPlan.slots) {
    aiOwnerCivMap.set(slot.ownerId, slot.typ);
    ownerDisplayName.set(slot.ownerId, displayLabelForSlot(input.civs, slot));
    if (slot.isSameTypeRival) simplifiedDiplomacyOwners.add(slot.ownerId);
    else foreignTypeOwners.add(slot.ownerId);
    typCityCopyOwners.add(slot.ownerId);
    startRelations.set(slot.ownerId, startRelationForPair(slot.isSameTypeRival));
    spawnCities.push({
      q: slot.q,
      r: slot.r,
      ownerId: slot.ownerId,
      name: slot.nazwaMiasta,
    });
    aiStartHexes.push({ q: slot.q, r: slot.r, ownerId: slot.ownerId });
  }

  return {
    playerStartHex: spawnPlan.playerStartHex,
    playerStartCityName: spawnPlan.playerStartCityName,
    aiStartHexes,
    spawnCities,
    foreignTypeClusters: spawnPlan.foreignTypeClusters,
    aiOwnerCivMap,
    ownerDisplayName,
    simplifiedDiplomacyOwners,
    foreignTypeOwners,
    typCityCopyOwners,
    startRelations,
    placement: spawnPlan.placement,
  };
}
