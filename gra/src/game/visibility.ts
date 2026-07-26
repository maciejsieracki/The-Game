/**
 * visibility.ts
 * Fog-of-war visibility computation for the world map.
 *
 * Exports:
 *   DEFAULT_SIGHT        - default line-of-sight radius in hex steps
 *   computeVisible()     - Set of "q,r" keys visible to a player's units
 *   addExplored()        - merge visible set into the persistent explored set
 *   allHexKeys()         - all hex keys on the map (fog-off / reveal-all mode)
 */

import { hexDistance, keyOf } from '../units/setup';
import type { RuntimeUnit } from '../units/setup';
import type { GameMap } from '../types/map';
import type { UnitDef } from '../data/loader';
import { TerenBazowy } from '../types/hex';
import { citySightRadius } from './okolica';
import { mapGenDefaultSight } from '../data/map-gen-params-loader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default sight radius in hex steps (miasto / fallback gdy brak definicji jednostki). Panel-A JSON. */
export const DEFAULT_SIGHT = mapGenDefaultSight();

/**
 * Jasność heksów explored (FoW — poza bieżącym zasięgiem, ale odkrytych).
 * visible = 1.0 · Maciej 2026-07-03: +50% przyciemnienia (było 0.45, dim 55% → dim 82.5%).
 */
export const FOG_EXPLORED_BRIGHTNESS = 0.175;

/** Decyzja Macieja A-FOG-Q1=B (2026-06-27): Widok pola = Ruch; Zwiadowca min. 5. */
export type UnitSightResolver = (unit: RuntimeUnit) => number;

/**
 * Buduje resolver zasięgu mgły z units.json (kolumna „Widok pola").
 * Miasta (typeId === 'city') dostają citySight (domyślnie DEFAULT_SIGHT).
 */
export function buildUnitSightResolver(
  unitDefs: UnitDef[],
  citySight: number = DEFAULT_SIGHT,
): UnitSightResolver {
  const byName = new Map<string, UnitDef>();
  for (const def of unitDefs) byName.set(def.Jednostka, def);
  return (unit: RuntimeUnit) => {
    if (unit.typeId === 'city') return citySight;
    const def = byName.get(unit.typeId);
    const widok = def?.['Widok pola'];
    if (typeof widok === 'number') return widok;
    const ruch = def?.Ruch;
    if (typeof ruch === 'number') return ruch;
    return DEFAULT_SIGHT;
  };
}

// ---------------------------------------------------------------------------
// computeVisibleAt — widok z punktu (start onboarding, miasto później)
// ---------------------------------------------------------------------------

/**
 * Hexy widoczne w promieniu `sight` od punktu (q,r).
 */
export function computeVisibleAt(
  q: number,
  r: number,
  map: GameMap,
  sight: number,
): Set<string> {
  const visible = new Set<string>();
  for (let dq = -sight; dq <= sight; dq++) {
    for (let dr = -sight; dr <= sight; dr++) {
      if (hexDistance(q, r, q + dq, r + dr) <= sight) {
        const k = keyOf(q + dq, r + dr);
        if (k in map.hexes) visible.add(k);
      }
    }
  }
  return visible;
}

// ---------------------------------------------------------------------------
// computeVisible
// ---------------------------------------------------------------------------

/**
 * Returns the Set of "q,r" keys visible to the given player units on the map.
 *
 * For each unit in playerUnits the function marks every hex whose hex-distance
 * from the unit is <= sight as visible, provided the hex key exists in
 * map.hexes.  The unit's own hex is always included.
 *
 * Caller contract: playerUnits must contain only units with ownerId === 0
 * (the human player).  AI units are not passed here.
 *
 * Algorithm: for each unit, iterate dq in [-sight..sight] and, for each dq,
 * dr in [-sight..sight].  Skip the (dq, dr) pair when hexDistance exceeds
 * sight; otherwise build the key and add it if present in map.hexes.
 *
 * @param playerUnits  Array of player units (ownerId === 0).
 * @param map          The current game map.
 * @param sightOrResolver  Stały promień (np. DEFAULT_SIGHT) albo per-jednostka (A-FOG-Q1).
 * @returns            Set of "q,r" string keys that are currently visible.
 */
export function computeVisible(
  playerUnits: RuntimeUnit[],
  map: GameMap,
  sight: number,
): Set<string>;
export function computeVisible(
  playerUnits: RuntimeUnit[],
  map: GameMap,
  resolveSight: UnitSightResolver,
): Set<string>;
export function computeVisible(
  playerUnits: RuntimeUnit[],
  map: GameMap,
  sightOrResolver: number | UnitSightResolver,
): Set<string> {
  const visible = new Set<string>();

  for (const unit of playerUnits) {
    const sight = typeof sightOrResolver === 'function'
      ? sightOrResolver(unit)
      : sightOrResolver;
    for (let dq = -sight; dq <= sight; dq++) {
      for (let dr = -sight; dr <= sight; dr++) {
        if (hexDistance(unit.q, unit.r, unit.q + dq, unit.r + dr) <= sight) {
          const k = keyOf(unit.q + dq, unit.r + dr);
          if (k in map.hexes) {
            visible.add(k);
          }
        }
      }
    }
  }

  return visible;
}

// ---------------------------------------------------------------------------
// addExplored
// ---------------------------------------------------------------------------

/**
 * Merges every key from visible into explored (mutates explored in place).
 *
 * The explored set accumulates all hexes the player has ever seen.  Call this
 * once per turn after computeVisible to keep the persistent fog-of-war record
 * up to date.
 *
 * @param explored  Persistent set of all previously and currently seen keys.
 * @param visible   Keys visible this turn (from computeVisible).
 */
export function addExplored(explored: Set<string>, visible: Set<string>): void {
  for (const key of visible) {
    explored.add(key);
  }
}

// ---------------------------------------------------------------------------
// allHexKeys
// ---------------------------------------------------------------------------

/**
 * Returns every "q,r" key present in map.hexes as a plain array.
 *
 * Use this for "reveal all" / fog-off debug mode: pass the result directly to
 * whatever rendering layer expects the full explored/visible set.
 *
 * @param map  The current game map.
 * @returns    Array of all hex keys in the map (order is insertion order of
 *             the underlying Record, i.e. typically row-major).
 */
export function allHexKeys(map: GameMap): string[] {
  return Object.keys(map.hexes);
}

/** Ląd + wybrzeże (bez Morza) — skrót M: odkryty ląd, ocean nadal ukryty. */
export function isRevealLandTeren(t: TerenBazowy): boolean {
  return t !== TerenBazowy.Morze;
}

export function allRevealLandKeys(map: GameMap): string[] {
  const out: string[] = [];
  for (const [key, hex] of Object.entries(map.hexes)) {
    if (isRevealLandTeren(hex.terenBazowy)) out.push(key);
  }
  return out;
}

/** Ląd bez Morze/Wybrzeże — ekonomia / generator. */
export function isDryLandTeren(t: TerenBazowy): boolean {
  return t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze;
}

export function allDryLandKeys(map: GameMap): string[] {
  const out: string[] = [];
  for (const [key, hex] of Object.entries(map.hexes)) {
    if (isDryLandTeren(hex.terenBazowy)) out.push(key);
  }
  return out;
}

/** Render-only: cały ląd jako explored; persistent `explored` bez zmian. */
export function exploredSetForRender(
  explored: Set<string>,
  allLandKeys: Set<string>,
  revealAllLand: boolean,
): Set<string> {
  if (!revealAllLand) return explored;
  const merged = new Set(explored);
  for (const k of allLandKeys) merged.add(k);
  return merged;
}

// ---------------------------------------------------------------------------
// computePlayerVisibility — union jednostki + miasta + start hex (B-zasieg-miasta-fog)
// ---------------------------------------------------------------------------

export interface PlayerVisibilityCity {
  q: number;
  r: number;
  population: number;
  kultura?: number;
}

export interface ComputePlayerVisibilityOptions {
  map: GameMap;
  playerUnits: RuntimeUnit[];
  playerCities: PlayerVisibilityCity[];
  unitSight: UnitSightResolver;
  /** Przed pierwszym miastem/jednostką — krąg startu (domyślnie r=5). */
  startHex?: { q: number; r: number } | null;
  startRevealRadius?: number;
}

/**
 * Widoczne heksy gracza: ∪ zasięg jednostek + ∪ zasięg miast (pop + kultura).
 * Gdy brak źródeł — krąg startRevealRadius wokół startHex (onboarding A-START-01).
 */
export function computePlayerVisibility(opts: ComputePlayerVisibilityOptions): Set<string> {
  const {
    map,
    playerUnits,
    playerCities,
    unitSight,
    startHex = null,
    startRevealRadius = 5,
  } = opts;

  const visible = new Set<string>();

  for (const u of playerUnits) {
    const sight = unitSight(u);
    for (const k of computeVisibleAt(u.q, u.r, map, sight)) visible.add(k);
  }

  for (const c of playerCities) {
    const sight = citySightRadius(c.population, c.kultura ?? 0);
    if (sight <= 0) continue;
    for (const k of computeVisibleAt(c.q, c.r, map, sight)) visible.add(k);
  }

  if (visible.size > 0) return visible;
  if (startHex !== null) {
    return computeVisibleAt(startHex.q, startHex.r, map, startRevealRadius);
  }
  return visible;
}

export { citySightRadius } from './okolica';

// ---------------------------------------------------------------------------
// unitsVisibleOnMap — które tokeny jednostek rysować (FoW)
// ---------------------------------------------------------------------------

/**
 * Jednostki widoczne na mapie świata przy włączonej mgle:
 * - gracz (playerOwnerId) zawsze,
 * - obcy tylko gdy heks jest w bieżącym zasięgu widzenia (nie w explored/shroud),
 * - garnizon wroga — niewidoczny; garnizon gracza — token na heksie miasta (koszary).
 */
export function unitsVisibleOnMap(
  units: readonly RuntimeUnit[],
  visibleHexes: ReadonlySet<string>,
  playerOwnerId = 0,
): RuntimeUnit[] {
  return units.filter(u => {
    if (u.inGarnizon === true) return u.ownerId === playerOwnerId;
    return u.ownerId === playerOwnerId || visibleHexes.has(keyOf(u.q, u.r));
  });
}
