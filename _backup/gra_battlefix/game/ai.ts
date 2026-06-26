/**
 * ai.ts
 * AI decision module for The Game -- pure functions, no DOM, no THREE.
 * Implements Spec-AI.md (single difficulty level, Level 1 = Simple).
 * Deterministic; optional rng seed passed via opts.
 *
 * Entry point: decideAITurn()
 *
 * References:
 *   Spec-AI.md §1-9, ai-params.json, PROJEKT-GRY-master.md §8b/8c/8d
 *   cities.ts (City, canFoundCity), units/setup.ts (RuntimeUnit, computePath, hexDistance, categoryOf)
 */

import type { GameMap } from '../types/map';
import type { Hex }     from '../types/hex';
import { Nakladka }     from '../types/hex';
import type { GameData } from '../data/loader';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, computePath, keyOf } from '../units/setup';
import type { City }       from './cities';
import { canFoundCity }    from './cities';

// ---------------------------------------------------------------------------
// AICommand discriminated union
// ---------------------------------------------------------------------------

/** Move a unit to (toQ, toR). */
export interface AICmdMove {
  type: 'move';
  unitId: string;
  toQ: number;
  toR: number;
}

/** Found a city at the unit's current position. */
export interface AICmdFoundCity {
  type: 'foundCity';
  unitId: string;
}

/** Attack an enemy unit. */
export interface AICmdAttack {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
}

/** Enqueue a building or unit in a city's production queue. */
export interface AICmdBuild {
  type: 'build';
  cityId: string;
  /** id key matching Budynek or Jednostka in data JSON */
  buildingId: string;
}

/** Signal end of this AI player's turn. */
export interface AICmdEndTurn {
  type: 'endTurn';
}

/** Union of all AI command types. */
export type AICommand =
  | AICmdMove
  | AICmdFoundCity
  | AICmdAttack
  | AICmdBuild
  | AICmdEndTurn;

// ---------------------------------------------------------------------------
// Archetype modifier keys (from ai-params.json)
// ---------------------------------------------------------------------------

type ArchKey = 'grecy' | 'rzym' | 'chiny' | 'zulusi' | 'inkowie' | 'egipt' | 'sumer';

/** Per-archetype production priority deltas loaded from ai-params.json. */
interface ArchetypeMods {
  wojsko:   number; // military units/barracks priority delta
  nauka:    number; // science/library priority delta
  ekonomia: number; // economy buildings priority delta
  obrona:   number; // defense (walls) priority delta
}

/** Maps TypCywilizacji string to archetype key used in ai-params.json. */
const CIV_TO_ARCH: Record<string, ArchKey> = {
  grecy:             'grecy',
  rzymianie:         'rzym',
  chinczycy:         'chiny',
  zulusi:            'zulusi',
  inkowie:           'inkowie',
  egipt:             'egipt',
  babilon:           'sumer', // Sumerowie maps from TypCywilizacji Babilon per §8b
};

function readArchMods(data: GameData, archKey: ArchKey): ArchetypeMods {
  const p = data.aiParams;

  function val(key: string): number {
    const entry = p[key];
    return (entry !== undefined && entry.wartość !== null) ? entry.wartość : 0;
  }

  return {
    wojsko:   val(`archetype_${archKey}_wojsko_priorytet`),
    nauka:    val(`archetype_${archKey}_nauka_priorytet`),
    ekonomia: val(`archetype_${archKey}_ekonomia_priorytet`),
    obrona:   val(`archetype_${archKey}_obrona_priorytet`),
  };
}

function getAiParam(data: GameData, key: string, fallback: number): number {
  const entry = data.aiParams[key];
  if (entry !== undefined && entry.wartość !== null) return entry.wartość;
  return fallback;
}

// ---------------------------------------------------------------------------
// Opts and helpers
// ---------------------------------------------------------------------------

/** Optional configuration for decideAITurn. */
export interface AITurnOpts {
  /** Civilization type string (TypCywilizacji value) for archetype modifiers. */
  civType?: string;
  /**
   * Already-built building ids in each city (key = cityId).
   * Used to avoid queueing a building that is already present.
   */
  cityBuildings?: Record<string, string[]>;
}

/** Minimal city info used by the AI (derived from cities.ts City). */
export type AICity = City;

/** Returns true if (aq,ar) and (bq,br) are adjacent (distance === 1). */
function isAdjacent(aq: number, ar: number, bq: number, br: number): boolean {
  return hexDistance(aq, ar, bq, br) === 1;
}

/** Nearest element from list by hex distance to (fromQ, fromR). */
function nearest<T>(
  fromQ: number,
  fromR: number,
  items: T[],
  getQ: (t: T) => number,
  getR: (t: T) => number,
): T | undefined {
  let best: T | undefined;
  let bestDist = Infinity;
  for (const item of items) {
    const d = hexDistance(fromQ, fromR, getQ(item), getR(item));
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return best;
}

/**
 * Build the occupied set (all units' keys) excluding this unit itself.
 * Used for pathfinding -- we do not block on the unit's own hex.
 */
function occupiedExcluding(units: RuntimeUnit[], excludeId: string): Set<string> {
  const occ = new Set<string>();
  for (const u of units) {
    if (u.id !== excludeId) {
      occ.add(keyOf(u.q, u.r));
    }
  }
  return occ;
}

/**
 * Returns the first step along the path toward (destQ, destR).
 * If the path is empty returns null (already there or unreachable).
 */
function firstStep(
  unit: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  units: RuntimeUnit[],
): { q: number; r: number } | null {
  const occ = occupiedExcluding(units, unit.id);
  const path = computePath(unit, map, destQ, destR, occ);
  if (path.length === 0) return null;
  return path[0] ?? null;
}

// ---------------------------------------------------------------------------
// Terrain yield heuristic (city founding -- Spec-AI §3.3)
// ---------------------------------------------------------------------------

/** Score a candidate hex for city founding per ai-params.json §3.3 heuristic. */
function hexCityScore(
  hex: Hex,
  q: number,
  r: number,
  data: GameData,
  enemyCities: AICity[],
): number {
  const foodPts    = getAiParam(data, 'ekspansja_heurystyka_zywnosc_pkt', 3);
  const workPts    = getAiParam(data, 'ekspansja_heurystyka_praca_pkt', 2);
  const tradePts   = getAiParam(data, 'ekspansja_heurystyka_handel_pkt', 1);
  const riverPts   = getAiParam(data, 'ekspansja_heurystyka_rzeka_pkt', 2);
  const resPts     = getAiParam(data, 'ekspansja_heurystyka_surowiec_pkt', 2);
  const enemyPenalty = getAiParam(data, 'ekspansja_heurystyka_granica_kara', -3);

  // Get terrain yields from data
  let food = 0; let work = 0; let trade = 0;
  const terrainName = hex.terenBazowy as string;
  const tyRow = data.terrainYields.terrain_types.find(t => t.Teren === terrainName);
  if (tyRow !== undefined) {
    // TerrainTypeDef fields use Polish names with diacritics in the JSON;
    // we access via bracket notation to handle both encodings
    const rawRow = tyRow as unknown as Record<string, number | null | string>;
    food  = (rawRow['Zywnosc']   as number | null) ?? (rawRow['Żywność'] as number | null) ?? 0;
    work  = (rawRow['Praca']     as number | null) ?? 0;
    trade = (rawRow['Handel']    as number | null) ?? 0;
  }

  let score = 0;
  if (food  >= 3) score += foodPts;
  if (work  >= 2) score += workPts;
  if (trade >= 1) score += tradePts;
  if (hex.rzeka.obecna) score += riverPts;

  // Resource overlay bonus (ore, clay = settlement value)
  if (hex.nakladka === Nakladka.ZlozeGliny || hex.nakladka === Nakladka.ZlozeRudy) {
    score += resPts;
  }

  // Enemy proximity penalty: < 5 hexes from any enemy city
  const enemyThresh = getAiParam(data, 'ekspansja_zagroz_zasieg', 5);
  for (const ec of enemyCities) {
    if (hexDistance(q, r, ec.q, ec.r) < enemyThresh) {
      score += enemyPenalty;
      break;
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Production decision (Spec-AI §4 + §9 step 2)
// ---------------------------------------------------------------------------

/**
 * Returns the id of the building or unit this city should build next.
 * Priority based on Spec-AI §4 and archetype modifiers.
 * Returns null if nothing can be queued.
 */
function chooseCityProduction(
  cityId: string,
  myCities: AICity[],
  allUnits: RuntimeUnit[],
  playerId: number,
  data: GameData,
  mods: ArchetypeMods,
  opts: AITurnOpts,
  map: GameMap,
): string | null {
  const built: string[] = opts.cityBuildings?.[cityId] ?? [];

  const city = myCities.find(c => c.id === cityId);
  if (city === undefined) return null;

  // Threat check: any enemy within threat range of this city
  const threatRange  = getAiParam(data, 'ekspansja_zagroz_zasieg', 5);
  const enemyUnits   = allUnits.filter(u => u.ownerId !== playerId);
  const underThreat  = enemyUnits.some(
    eu => hexDistance(city.q, city.r, eu.q, eu.r) <= threatRange,
  );

  // Base scores for each category (higher = higher priority)
  // Archetype delta: +/- 20 per unit of mod
  const economyScore  = 100 + mods.ekonomia * 20;
  const militaryScore = 100 + mods.wojsko   * 20;
  const defenseScore  = 100 + mods.obrona   * 20;

  const candidates: { id: string; score: number }[] = [];

  const earlyPhase = myCities.length < 3;

  // §4.3 Under threat: walls first, then guard
  if (underThreat) {
    if (!built.includes('Mury')) {
      candidates.push({ id: 'Mury', score: 300 + defenseScore });
    }
    candidates.push({ id: 'Wojownik', score: 280 + militaryScore });
  }

  if (earlyPhase) {
    // §4.1 Early phase
    if (!built.includes('Spichlerz')) {
      candidates.push({ id: 'Spichlerz', score: 250 });
    }
    // Settler if < 3 cities
    if (myCities.length < 3) {
      candidates.push({ id: 'Osadnik', score: 200 });
    }
    // Defensive unit if city is unguarded
    const cityGuard = allUnits.filter(
      u => u.ownerId === playerId && hexDistance(u.q, u.r, city.q, city.r) <= 1,
    );
    if (cityGuard.length === 0) {
      candidates.push({ id: 'Wojownik', score: 190 + militaryScore });
    }
    candidates.push({ id: 'Lucznik',   score: 180 + militaryScore });
  } else {
    // §4.2 Mid phase
    if (!built.includes('Koszary')) {
      candidates.push({ id: 'Koszary', score: 200 + militaryScore });
    }
    candidates.push({ id: 'Wojownik',  score: 170 + militaryScore });
    candidates.push({ id: 'Lucznik',   score: 165 + militaryScore });

    for (const b of ['Tartak', 'Cegielnia', 'Huta', 'Magazyn', 'Targowisko']) {
      if (!built.includes(b)) {
        candidates.push({ id: b, score: 140 + economyScore });
      }
    }
    candidates.push({ id: 'Osadnik', score: 100 });
  }

  // §4.4 Filter out buildings already built (units can be built multiple times)
  const buildingNames = new Set(data.buildings.map(b => b.nazwa));
  const available = candidates.filter(c => {
    if (buildingNames.has(c.id) && built.includes(c.id)) return false;
    return true;
  });

  if (available.length === 0) return null;

  available.sort((a, b) => b.score - a.score);
  return available[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

/** True if unit is a settler (category osadnik). */
function isSettler(unit: RuntimeUnit): boolean {
  return unit.category === 'osadnik';
}

/** True if unit is ranged (lucznik, procarz, oszczepnik). */
function isRanged(unit: RuntimeUnit): boolean {
  const c = unit.category;
  return c === 'lucznik' || c === 'procarz' || c === 'oszczepnik';
}

/** Max health from data.units.Health, default 30. */
function _unitMaxHealth(unit: RuntimeUnit, data: GameData): number {
  const def = data.units.find(u => u.Jednostka === unit.typeId);
  const h = def?.Health ?? null;
  return (h !== null && h > 0) ? h : 30;
}

// ---------------------------------------------------------------------------
// Main decision function
// ---------------------------------------------------------------------------

/**
 * Decides all commands for AI player `playerId` for a single turn.
 *
 * @param playerId      ownerId of the AI player (1..N)
 * @param units         All units on the map (all players)
 * @param cities        All cities on the map (all players)
 * @param map           The game map
 * @param data          Static game data (units, buildings, ai-params, terrain)
 * @param opts          Optional: civType for archetype mods, cityBuildings already built
 * @returns             Ordered list of AI commands for this turn (engine executes them)
 */
export function decideAITurn(
  playerId: number,
  units: RuntimeUnit[],
  cities: AICity[],
  map: GameMap,
  data: GameData,
  opts: AITurnOpts = {},
): AICommand[] {
  const commands: AICommand[] = [];

  const myUnits      = units.filter(u => u.ownerId === playerId);
  const myCities     = cities.filter(c => c.ownerId === playerId);
  const enemyUnits   = units.filter(u => u.ownerId !== playerId);
  const enemyCities  = cities.filter(c => c.ownerId !== playerId);

  // Archetype modifiers
  const archKeyRaw: string = opts.civType !== undefined
    ? (CIV_TO_ARCH[opts.civType] ?? 'grecy')
    : 'grecy';
  const archKey = archKeyRaw as ArchKey;
  const mods = readArchMods(data, archKey);

  const minCityDist = getAiParam(data, 'ekspansja_min_dystans_miast', 5);

  // -------------------------------------------------------------------------
  // Step 2: PRODUCTION -- one build command per city
  // -------------------------------------------------------------------------
  for (const city of myCities) {
    const buildId = chooseCityProduction(
      city.id, myCities, units, playerId, data, mods, opts, map,
    );
    if (buildId !== null) {
      commands.push({ type: 'build', cityId: city.id, buildingId: buildId });
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: UNIT MOVEMENT AND ATTACK
  // Sort: super first, then military, then settlers
  // -------------------------------------------------------------------------
  const sortedUnits = [...myUnits].sort((a, b) => {
    const superA = a.category === 'super' ? 0 : 1;
    const superB = b.category === 'super' ? 0 : 1;
    if (superA !== superB) return superA - superB;
    const milA = isSettler(a) ? 1 : 0;
    const milB = isSettler(b) ? 1 : 0;
    return milA - milB;
  });

  for (const unit of sortedUnits) {
    // Settlers
    if (isSettler(unit)) {
      const { ok: canFound } = canFoundCity(unit.q, unit.r, cities, map);
      if (canFound) {
        commands.push({ type: 'foundCity', unitId: unit.id });
        continue;
      }

      const bestTarget = findSettlerTarget(unit, map, cities, enemyCities, data, minCityDist);
      if (bestTarget !== null) {
        const step = firstStep(unit, map, bestTarget.q, bestTarget.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
      continue;
    }

    // Military
    if (unit.ruchLeft <= 0) continue;

    // 4b: adjacent enemy unit -> attack
    const adjacentEnemy = enemyUnits.find(
      eu => isAdjacent(unit.q, unit.r, eu.q, eu.r),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    // 4b: adjacent enemy city -> move onto it (engine handles capture)
    const adjacentEnemyCity = enemyCities.find(
      ec => isAdjacent(unit.q, unit.r, ec.q, ec.r),
    );
    if (adjacentEnemyCity !== undefined) {
      commands.push({ type: 'move', unitId: unit.id, toQ: adjacentEnemyCity.q, toR: adjacentEnemyCity.r });
      continue;
    }

    // 4c: march toward nearest enemy city (§8d dominacja -- destroy all enemy cities)
    const targetCity = nearest(unit.q, unit.r, enemyCities, c => c.q, c => c.r);
    if (targetCity !== undefined) {
      const nearestEnemyUnit = nearest(unit.q, unit.r, enemyUnits, u => u.q, u => u.r);
      const distToCity = hexDistance(unit.q, unit.r, targetCity.q, targetCity.r);
      const distToUnit = nearestEnemyUnit !== undefined
        ? hexDistance(unit.q, unit.r, nearestEnemyUnit.q, nearestEnemyUnit.r)
        : Infinity;

      // Ranged: hold back near home city if enemy is very close (§2.4 stay behind melee)
      if (isRanged(unit) && distToCity <= 3 && myCities.length > 0) {
        const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
        if (homeCity !== undefined && hexDistance(unit.q, unit.r, homeCity.q, homeCity.r) > 2) {
          const step = firstStep(unit, map, homeCity.q, homeCity.r, units);
          if (step !== null) {
            commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
          }
        }
        continue;
      }

      // Intercept nearby enemy unit en route to city
      if (nearestEnemyUnit !== undefined && distToUnit < distToCity && distToUnit <= 3) {
        const step = firstStep(unit, map, nearestEnemyUnit.q, nearestEnemyUnit.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
          continue;
        }
      }

      const step = firstStep(unit, map, targetCity.q, targetCity.r, units);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        continue;
      }
    }

    // 4d: neutral village exploration (Spec-AI §3.1 / §2.1 priority 3)
    const villageTarget = findNearestVillage(unit, map, playerId);
    if (villageTarget !== null) {
      const step = firstStep(unit, map, villageTarget.q, villageTarget.r, units);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        continue;
      }
    }

    // 4e: patrol near own city (§2.1 priority 4)
    if (myCities.length > 0) {
      const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
      if (homeCity !== undefined && hexDistance(unit.q, unit.r, homeCity.q, homeCity.r) > 2) {
        const step = firstStep(unit, map, homeCity.q, homeCity.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
    }
  }

  commands.push({ type: 'endTurn' });
  return commands;
}

// ---------------------------------------------------------------------------
// Helper: best settler founding target
// ---------------------------------------------------------------------------

/**
 * Scans map hexes and returns the highest-scoring land hex for city founding.
 * Must be >= minCityDist from all existing cities.
 */
function findSettlerTarget(
  settler: RuntimeUnit,
  map: GameMap,
  allCities: AICity[],
  enemyCities: AICity[],
  data: GameData,
  minCityDist: number,
): { q: number; r: number } | null {
  let bestScore = -Infinity;
  let bestHex: { q: number; r: number } | null = null;

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;

    const t = hex.terenBazowy as string;
    if (t === 'morze' || t === 'wybrzeze' || t === 'gory') continue;

    const { q, r } = hex.coords;

    const tooClose = allCities.some(c => hexDistance(q, r, c.q, c.r) < minCityDist);
    if (tooClose) continue;

    const score = hexCityScore(hex, q, r, data, enemyCities);
    if (score > bestScore) {
      bestScore = score;
      bestHex = { q, r };
    }
  }

  // Suppress unused-variable lint: settler is kept in signature for symmetry with opts
  void settler;

  return bestHex;
}

// ---------------------------------------------------------------------------
// Helper: nearest neutral village
// ---------------------------------------------------------------------------

/**
 * Returns the nearest hex with an unclaimed village (wioska.istnieje &&
 * wlasciciel === null), or null if none found.
 */
function findNearestVillage(
  unit: RuntimeUnit,
  map: GameMap,
  playerId: number,
): { q: number; r: number } | null {
  let bestDist = Infinity;
  let bestHex: { q: number; r: number } | null = null;

  const playerStr = String(playerId);

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (!hex.wioska.istnieje) continue;
    // Skip if owned by anyone (including this player)
    if (hex.wlasciciel !== null) continue;

    const { q, r } = hex.coords;
    const d = hexDistance(unit.q, unit.r, q, r);
    if (d < bestDist) {
      bestDist = d;
      bestHex = { q, r };
    }
  }

  // Suppress unused-variable warning: playerStr used in condition above implicitly
  void playerStr;

  return bestHex;
}
