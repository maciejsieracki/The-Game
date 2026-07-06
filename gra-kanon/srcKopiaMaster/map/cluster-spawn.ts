/**
 * cluster-spawn.ts — API spawnu miast z klastra (lane MAPA).
 * Mapuje wynik computeClusters() na sloty z nazwami (czyta civ-names).
 */

import type { CivsData } from '../data/loader';
import type { GameMap } from '../types/map';
import {
  clusterRivalCityName,
  foreignCapitalCityName,
  playerStartCityName,
} from '../game/civ-names';
import { computeClusters, type ClusterPlacement, type TypeCluster } from './clusters';

/** Slot startowy — kontrakt dla SILNIK (D-START). */
export interface ClusterSpawnSlot {
  ownerId: number;
  q: number;
  r: number;
  nazwaMiasta: string;
  typ: string;
  isSameTypeRival: boolean;
  isPlayerCapital: boolean;
}

/** Pełny klaster obcego typu — kontrakt dla SILNIK (MAP-P1-01). */
export interface ForeignTypeClusterGroup {
  typ: string;
  ownerIds: number[];
  positions: Array<{ q: number; r: number }>;
}

export interface ClusterSpawnPlan {
  playerStartHex: { q: number; r: number };
  playerStartCityName: string;
  slots: ClusterSpawnSlot[];
  /** Obcy typ → wszystkie miasta klastra (nie tylko stolica). */
  foreignTypeClusters: ForeignTypeClusterGroup[];
  placement: ClusterPlacement;
}

export interface BuildClusterSpawnInput {
  map: GameMap;
  civs: CivsData;
  seed: number;
  playerTyp: string;
  rywaleNaKlaster: number;
  aktywneTypy?: number;
}

function capitalOf(klaster: TypeCluster): { q: number; r: number } | null {
  const cap = klaster.miasta.find(m => m.isCapital) ?? klaster.miasta[0];
  return cap ? { q: cap.q, r: cap.r } : null;
}

/** Grupuje sloty obcych typów wg `typ` (kolejność: stolica → rywale). */
export function groupForeignTypeClusters(slots: ClusterSpawnSlot[]): ForeignTypeClusterGroup[] {
  const byTyp = new Map<string, ForeignTypeClusterGroup>();
  for (const slot of slots) {
    if (slot.isSameTypeRival) continue;
    let group = byTyp.get(slot.typ);
    if (!group) {
      group = { typ: slot.typ, ownerIds: [], positions: [] };
      byTyp.set(slot.typ, group);
    }
    group.ownerIds.push(slot.ownerId);
    group.positions.push({ q: slot.q, r: slot.r });
  }
  return [...byTyp.values()];
}

/**
 * Rozmieszcza klastry i przypisuje nazwy + ownerId (deterministycznie).
 * Gracz (owner 0): tylko hex stolicy — miasto zakłada gracz ręcznie (N-1A).
 * Rywale klastra 1..N: ten sam typ, nazwy [1..N], uproszczona dyplomacja.
 * Obcy typ: pełny klaster miast-kopii (stolica + rywale), pełna dyplomacja po kontakcie.
 */
export function buildClusterSpawnPlan(input: BuildClusterSpawnInput): ClusterSpawnPlan {
  const {
    map, civs, seed, playerTyp, rywaleNaKlaster, aktywneTypy,
  } = input;

  const placement = computeClusters(map, {
    seed,
    playerTyp,
    rywaleNaKlaster,
    aktywneTypy,
  });

  const playerCluster = placement.klastry[placement.playerTypIndex];
  const fallbackHex = { q: 0, r: 0 };
  if (!playerCluster || playerCluster.miasta.length === 0) {
    return {
      playerStartHex: fallbackHex,
      playerStartCityName: playerStartCityName(civs, playerTyp),
      slots: [],
      foreignTypeClusters: [],
      placement,
    };
  }

  const capPos = capitalOf(playerCluster) ?? fallbackHex;
  const slots: ClusterSpawnSlot[] = [];
  let nextOwnerId = 1;

  const rivalHexes = playerCluster.miasta.filter(m => !m.isCapital).slice(0, rywaleNaKlaster);
  rivalHexes.forEach((m, idx) => {
    const ownerId = nextOwnerId++;
    const nazwa = clusterRivalCityName(civs, playerTyp, idx + 1);
    slots.push({
      ownerId,
      q: m.q,
      r: m.r,
      nazwaMiasta: nazwa,
      typ: playerTyp,
      isSameTypeRival: true,
      isPlayerCapital: false,
    });
  });

  // Obcy typ: pełny klaster miast-kopii (symetria z klasterem gracza — D-START-miasta-kopie-typu)
  for (const klaster of placement.klastry) {
    if (klaster.typIndex === placement.playerTypIndex) continue;
    let rivalIdx = 0;
    for (const m of klaster.miasta) {
      const ownerId = nextOwnerId++;
      let nazwa: string;
      if (m.isCapital) {
        nazwa = foreignCapitalCityName(civs, klaster.typ);
      } else {
        rivalIdx += 1;
        nazwa = clusterRivalCityName(civs, klaster.typ, rivalIdx);
      }
      slots.push({
        ownerId,
        q: m.q,
        r: m.r,
        nazwaMiasta: nazwa,
        typ: klaster.typ,
        isSameTypeRival: false,
        isPlayerCapital: false,
      });
    }
  }

  return {
    playerStartHex: capPos,
    playerStartCityName: playerStartCityName(civs, playerTyp),
    slots,
    foreignTypeClusters: groupForeignTypeClusters(slots),
    placement,
  };
}

/** Etykieta UI dla ownera AI (N-2A: zawsze nazwa miasta z nazwyKlastra). */
export function displayLabelForSlot(
  _civs: CivsData,
  slot: ClusterSpawnSlot,
): string {
  return slot.nazwaMiasta;
}
