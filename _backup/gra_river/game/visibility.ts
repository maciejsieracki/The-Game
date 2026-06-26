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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default sight radius in hex steps for a unit. */
export const DEFAULT_SIGHT = 3;

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
 * @param sight        Sight radius (inclusive).  Pass DEFAULT_SIGHT normally.
 * @returns            Set of "q,r" string keys that are currently visible.
 */
export function computeVisible(
  playerUnits: RuntimeUnit[],
  map: GameMap,
  sight: number,
): Set<string> {
  const visible = new Set<string>();

  for (const unit of playerUnits) {
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
