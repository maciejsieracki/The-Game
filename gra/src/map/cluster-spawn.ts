/**
 * cluster-spawn.ts — API spawnu miast z klastra (lane MAPA).
 * Mapuje wynik computeClusters() na sloty z nazwami (czyta civ-names).
 */

import type { CivsData } from '../data/loader';
import type { GameMap } from '../types/map';
import type { CityNamesPoolsData } from '../game/city-names-pool';
import {
  clusterRivalCityName,
  foreignCapitalCityName,
  playerStartCityName,
} from '../game/civ-names';
import { computeClusters, packRivalCitiesAroundCore, MIN_DIST_START_CITY_STATE, type ClusterPlacement, type TypeCluster } from './clusters';
import { TerenBazowy } from '../types/hex';

/** Slot startowy — kontrakt dla SILNIK (D-START). */
export interface ClusterSpawnSlot {
  ownerId: number;
  q: number;
  r: number;
  nazwaMiasta: string;
  typ: string;
  isSameTypeRival: boolean;
  isPlayerCapital: boolean;
  /** Stolica klastra na krawędzi — ekspansyjna AI (nie kopia_typu_obronna). */
  isClusterCapital?: boolean;
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
  /** Rywale tego samego typu — spawn dopiero po założeniu pierwszego miasta gracza. */
  pendingSameTypeRivals: number;
  /** Pre-planowane pozycje państw gracza (Maciej 2026-07-07 — klaster na mapgen). */
  pendingSameTypeRivalHexes: Array<{ q: number; r: number }>;
  /** Ownerzy stolic klastrów — ekspansyjna AI (faza 1 konsolidacji). */
  clusterCapitalOwnerIds: number[];
}

function landHexesFromMap(map: GameMap): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [];
  for (const h of Object.values(map.hexes)) {
    if (h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Gory ||
        h.terenBazowy === TerenBazowy.Wybrzeze) continue;
    out.push({ q: h.coords.q, r: h.coords.r });
  }
  return out;
}

/**
 * Po wyborze miejsca stolicy gracza — ciasne miasta-państwa wokół rdzenia (min 3 hex).
 */
export function buildSameTypeRivalSlots(
  map: GameMap,
  civs: CivsData,
  core: { q: number; r: number },
  playerTyp: string,
  rivalCount: number,
  seed: number,
  firstOwnerId: number,
  pools?: CityNamesPoolsData,
): ClusterSpawnSlot[] {
  if (rivalCount <= 0) return [];
  const positions = packRivalCitiesAroundCore(
    landHexesFromMap(map),
    core,
    rivalCount,
    MIN_DIST_START_CITY_STATE,
    seed,
  );
  const slots: ClusterSpawnSlot[] = [];
  let ownerId = firstOwnerId;
  positions.forEach((pos, idx) => {
    slots.push({
      ownerId: ownerId++,
      q: pos.q,
      r: pos.r,
      nazwaMiasta: clusterRivalCityName(civs, playerTyp, idx + 1, pools),
      typ: playerTyp,
      isSameTypeRival: true,
      isPlayerCapital: false,
    });
  });
  return slots;
}

/**
 * Rozszerzona pula kandydatów na państwa-miasta wokół FAKTYCZNEJ stolicy gracza.
 * Pre-plan z mapgen = podgląd; spawn używa rdzenia gracza + backfill (E-START-CS-Q1 C).
 */
export function buildSameTypeRivalCandidateHexes(
  map: GameMap,
  core: { q: number; r: number },
  rivalCount: number,
  seed: number,
): Array<{ q: number; r: number }> {
  if (rivalCount <= 0) return [];
  const land = landHexesFromMap(map);
  const poolSize = Math.max(rivalCount * 3, rivalCount + 4);
  const seen = new Set<string>();
  const out: Array<{ q: number; r: number }> = [];
  const coreKey = `${core.q},${core.r}`;

  function mergePass(extraSeed: number): void {
    const hexes = packRivalCitiesAroundCore(
      land,
      core,
      poolSize,
      MIN_DIST_START_CITY_STATE,
      extraSeed,
    );
    for (const h of hexes) {
      const k = `${h.q},${h.r}`;
      if (k === coreKey || seen.has(k)) continue;
      seen.add(k);
      out.push(h);
    }
  }

  mergePass((seed ^ 0x9e3779b9) >>> 0);
  mergePass((seed + 0x517cc1b7) >>> 0);
  mergePass((seed + 0x85ebca6b) >>> 0);
  return out;
}

export interface BuildClusterSpawnInput {
  map: GameMap;
  civs: CivsData;
  seed: number;
  playerTyp: string;
  rywaleNaKlaster: number;
  aktywneTypy?: number;
  cityNamesPools?: CityNamesPoolsData;
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
    map, civs, seed, playerTyp, rywaleNaKlaster, aktywneTypy, cityNamesPools,
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
      playerStartCityName: playerStartCityName(civs, playerTyp, cityNamesPools),
      slots: [],
      foreignTypeClusters: [],
      placement,
      pendingSameTypeRivals: rywaleNaKlaster,
      pendingSameTypeRivalHexes: [],
      clusterCapitalOwnerIds: [],
    };
  }

  const capPos = capitalOf(playerCluster) ?? fallbackHex;
  const slots: ClusterSpawnSlot[] = [];
  const clusterCapitalOwnerIds: number[] = [];
  let nextOwnerId = 1;

  // Miasta-państwa tego samego typu — dopiero po założeniu miasta gracza (Maciej 2026-07-07).
  const pendingSameTypeRivals = rywaleNaKlaster;
  const pendingSameTypeRivalHexes = playerCluster.pendingStateSlots?.slice() ?? [];

  // Obcy typ: pełny klaster miast-kopii (symetria z klasterem gracza — D-START-miasta-kopie-typu)
  for (const klaster of placement.klastry) {
    if (klaster.typIndex === placement.playerTypIndex) continue;
    let rivalIdx = 0;
    for (const m of klaster.miasta) {
      const ownerId = nextOwnerId++;
      let nazwa: string;
      if (m.isCapital) {
        nazwa = foreignCapitalCityName(civs, klaster.typ, cityNamesPools);
        clusterCapitalOwnerIds.push(ownerId);
      } else {
        rivalIdx += 1;
        nazwa = clusterRivalCityName(civs, klaster.typ, rivalIdx, cityNamesPools);
      }
      slots.push({
        ownerId,
        q: m.q,
        r: m.r,
        nazwaMiasta: nazwa,
        typ: klaster.typ,
        isSameTypeRival: false,
        isPlayerCapital: false,
        isClusterCapital: m.isCapital,
      });
    }
  }

  return {
    playerStartHex: capPos,
    playerStartCityName: playerStartCityName(civs, playerTyp, cityNamesPools),
    slots,
    foreignTypeClusters: groupForeignTypeClusters(slots),
    placement,
    pendingSameTypeRivals,
    pendingSameTypeRivalHexes,
    clusterCapitalOwnerIds,
  };
}

/** Etykieta bazowa ownera AI (N-2A: nazwa miasta z puli klastra; dopisek → display-names przy UI). */
export function displayLabelForSlot(
  _civs: CivsData,
  slot: ClusterSpawnSlot,
): string {
  return slot.nazwaMiasta;
}
