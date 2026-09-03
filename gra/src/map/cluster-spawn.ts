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
import {
  computeClusters,
  computeSameTypeRivalHalfPlaneAxis,
  packRivalCitiesAroundCore,
  packCityStatesAroundCapital,
  MIN_DIST_START_CITY_STATE,
  CLUSTER_CITY_STATE_MAX_HEX,
  createMassLandCache,
  passesLocalLandGate,
  pickSpawnHexWithCapitalGates,
  capitalMinSeaDistForMap,
  capitalMinSeparationForMap,
  passesMinCapitalSeparationGate,
  type ClusterPlacement,
  type TypeCluster,
} from './clusters';
import { hexDistanceAxial, mulberry32 } from './gen-helpers';
import { TerenBazowy } from '../types/hex';
import { isWaterTerrain } from '../units/setup';

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
  /** Zarezerwowane ownerId dla deferred same-type rivals (po obcych slotach). */
  pendingSameTypeRivalOwnerIds: number[];
}

function landHexesFromMap(map: GameMap): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [];
  for (const h of Object.values(map.hexes)) {
    if (isWaterTerrain(h.terenBazowy) || h.terenBazowy === TerenBazowy.Gory ||
        h.terenBazowy === TerenBazowy.Polarny) continue;
    out.push({ q: h.coords.q, r: h.coords.r });
  }
  return out;
}

function mapCenterFromGameMap(map: GameMap): { q: number; r: number } {
  return {
    q: (map.szerokoscQ - 1) / 2,
    r: (map.wysokoscR - 1) / 2,
  };
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
    mapCenterFromGameMap(map),
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
 * Pre-plan z mapgen = podgląd; spawn używa rdzenia gracza + łańcuch hubów (E-START-CS-Q1 C).
 */
export function buildSameTypeRivalCandidateHexes(
  map: GameMap,
  core: { q: number; r: number },
  rivalCount: number,
  seed: number,
): Array<{ q: number; r: number }> {
  if (rivalCount <= 0) return [];
  const land = landHexesFromMap(map);
  const minDist = MIN_DIST_START_CITY_STATE;

  const mapCenter = mapCenterFromGameMap(map);
  const { stateCities } = packCityStatesAroundCapital(
    land,
    land,
    core,
    rivalCount,
    minDist,
    seed,
    {
      excludeHex: core,
      growthReserve: 0,
      halfPlaneAxis: computeSameTypeRivalHalfPlaneAxis(core, mapCenter, seed),
    },
  );
  return stateCities;
}

export interface BuildClusterSpawnInput {
  map: GameMap;
  civs: CivsData;
  seed: number;
  playerTyp: string;
  rywaleNaKlaster: number;
  aktywneTypy?: number;
  /** Epoka startu — filtr puli typów na mapie (kamien | braz | zelazo). */
  startEpochId?: string;
  cityNamesPools?: CityNamesPoolsData;
  /**
   * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA runda 2: typy AI wybrane przez
   * gracza w kreatorze, w kolejności zaznaczenia — przekazane wprost do
   * computeClusters(). Puste/undefined = zachowanie bez zmian (dzisiejszy
   * deterministyczny ROSTER_KLUCZE).
   * / EN: AI types chosen by the player in the wizard, in selection order —
   * passed straight through to computeClusters(). Empty/undefined = unchanged
   * behaviour (today's deterministic ROSTER_KLUCZE).
   */
  preferredCivIds?: readonly string[];
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
    startEpochId, cityNamesPools, preferredCivIds,
  } = input;

  const placement = computeClusters(map, {
    seed,
    playerTyp,
    rywaleNaKlaster,
    aktywneTypy,
    startEpochId,
    civRoster: civs.cywilizacje,
    preferredCivIds,
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
      pendingSameTypeRivalOwnerIds: [],
    };
  }

  const capPosRaw = capitalOf(playerCluster) ?? fallbackHex;
  const spawnCache = placement.spawnCache;
  const landCache = spawnCache?.landCache ?? createMassLandCache(landHexesFromMap(map));
  const seaDist = spawnCache?.seaDist;
  const minSeaDist = capitalMinSeaDistForMap(
    placement.rozmiarMapy,
    map.szerokoscQ,
    map.wysokoscR,
  );
  const minCapitalSep = capitalMinSeparationForMap(
    placement.rozmiarMapy,
    map.szerokoscQ,
    map.wysokoscR,
  );

  /** Stolice obcych typów z computeClusters — do bramki sep przy relokacji gracza. */
  const plannedForeignCapitals: Array<{ q: number; r: number }> = [];
  for (const klaster of placement.klastry) {
    if (klaster.typIndex === placement.playerTypIndex) continue;
    const fc = klaster.miasta.find(m => m.isCapital) ?? klaster.miasta[0];
    if (fc) plannedForeignCapitals.push({ q: fc.q, r: fc.r });
  }

  let capPos = capPosRaw;
  const mapCenter = {
    q: (map.szerokoscQ - 1) / 2,
    r: (map.wysokoscR - 1) / 2,
  };
  const landPool = spawnCache?.ladowe ?? landHexesFromMap(map);

  const resolvedPlayerCap = pickSpawnHexWithCapitalGates(
    map,
    landPool,
    landCache,
    mapCenter,
    mulberry32(seed ^ 0xca041a01),
    {
      seaDist,
      minSeaDist,
      priorCapitals: plannedForeignCapitals,
      minCapitalSep,
      requirePlayerMassGate: true,
      requireLocalLand: true,
      preferred: capPos,
    },
  );
  if (resolvedPlayerCap) {
    capPos = resolvedPlayerCap;
  } else {
    // FALA 176: zero soft-fail — drugi rzut bez preferred; ostatecznie hard apply
    // i tak dropnie obce stolice kolidujące z graczem (nie zostawiamy świadomie pary <N).
    const retryPlayerCap = pickSpawnHexWithCapitalGates(
      map,
      landPool,
      landCache,
      mapCenter,
      mulberry32(seed ^ 0xca041a02),
      {
        seaDist,
        minSeaDist,
        priorCapitals: plannedForeignCapitals,
        minCapitalSep,
        requirePlayerMassGate: true,
        requireLocalLand: true,
      },
    );
    if (retryPlayerCap) {
      capPos = retryPlayerCap;
    } else if (
      minCapitalSep > 0
      && !passesMinCapitalSeparationGate(capPos, plannedForeignCapitals, minCapitalSep)
    ) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[cluster-spawn] HARD: brak legalnego hexu gracza ≥${minCapitalSep} — hard apply dropnie kolidujące obce typy`,
        );
      }
    }
  }

  /** MAP-SPAWN-Q2 B: walidacja stolic obcych typów — lokalny ląd ≥70% (jak gracz). */
  function validateForeignCapital(q: number, r: number): boolean {
    return passesLocalLandGate(map, q, r);
  }
  const slots: ClusterSpawnSlot[] = [];
  const clusterCapitalOwnerIds: number[] = [];
  let nextOwnerId = 1;
  const placedCapitals: Array<{ q: number; r: number }> = [{ q: capPos.q, r: capPos.r }];

  // Miasta-państwa tego samego typu — dopiero po założeniu miasta gracza (Maciej 2026-07-07).
  const pendingSameTypeRivals = rywaleNaKlaster;
  const pendingSameTypeRivalHexes = playerCluster.pendingStateSlots?.slice() ?? [];

  // Obcy typ: pełny klaster miast-kopii (symetria z klasterem gracza — D-START-miasta-kopie-typu)
  for (const klaster of placement.klastry) {
    if (klaster.typIndex === placement.playerTypIndex) continue;
    const cap = klaster.miasta.find(m => m.isCapital) ?? klaster.miasta[0];
    if (!cap) continue;
    if (!validateForeignCapital(cap.q, cap.r)) continue;
    if (!passesMinCapitalSeparationGate(
      { q: cap.q, r: cap.r },
      placedCapitals,
      minCapitalSep,
    )) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[cluster-spawn] Pominięto typ '${klaster.typ}' — stolica zbyt blisko innej (minSep=${minCapitalSep})`,
        );
      }
      continue;
    }
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
    placedCapitals.push({ q: cap.q, r: cap.r });
  }

  // Zarezerwuj ownerId dla deferred same-type rivals PO obcych slotach (BUG-MP-NAZWA-CIV-MISMATCH).
  const pendingSameTypeRivalOwnerIds: number[] = [];
  for (let i = 0; i < pendingSameTypeRivals; i++) {
    pendingSameTypeRivalOwnerIds.push(nextOwnerId++);
  }

  // HARD final gate apply: stolice różnych civ ≥ minCapitalSep (zero fail-open).
  const hardPlacedCapitals: Array<{ q: number; r: number }> = [{ q: capPos.q, r: capPos.r }];
  const hardAcceptedSlots: ClusterSpawnSlot[] = [];
  const droppedForeignTyps = new Set<string>();
  for (const slot of slots) {
    if (slot.isClusterCapital) {
      if (!passesMinCapitalSeparationGate(
        { q: slot.q, r: slot.r },
        hardPlacedCapitals,
        minCapitalSep,
      )) {
        droppedForeignTyps.add(slot.typ);
        if (typeof console !== 'undefined') {
          console.warn(
            `[cluster-spawn] HARD apply: pominięto typ '${slot.typ}' — stolica (${slot.q},${slot.r}) < ${minCapitalSep} hex od innej stolicy`,
          );
        }
        continue;
      }
      hardPlacedCapitals.push({ q: slot.q, r: slot.r });
    }
    if (droppedForeignTyps.has(slot.typ)) continue;
    hardAcceptedSlots.push(slot);
  }
  const hardClusterCapitalOwnerIds = hardAcceptedSlots
    .filter(s => s.isClusterCapital)
    .map(s => s.ownerId);

  return {
    playerStartHex: capPos,
    playerStartCityName: playerStartCityName(civs, playerTyp, cityNamesPools),
    slots: hardAcceptedSlots,
    foreignTypeClusters: groupForeignTypeClusters(hardAcceptedSlots),
    placement,
    pendingSameTypeRivals,
    pendingSameTypeRivalHexes,
    clusterCapitalOwnerIds: hardClusterCapitalOwnerIds,
    pendingSameTypeRivalOwnerIds,
  };
}

/** Etykieta bazowa ownera AI (N-2A: nazwa miasta z puli klastra; dopisek → display-names przy UI). */
export function displayLabelForSlot(
  _civs: CivsData,
  slot: ClusterSpawnSlot,
): string {
  return slot.nazwaMiasta;
}
