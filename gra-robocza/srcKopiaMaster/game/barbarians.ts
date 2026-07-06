/**
 * barbarians.ts
 * Neutral hostile faction ("barbarzyncy") for The Game -- pure functions only.
 * No DOM, no THREE, no main.ts. Deterministic (all randomness via a seed).
 *
 * Scope (BACKLOG C4): camp spawning, a per-camp unit cap, simple aggression,
 * and movement toward the nearest player unit / city. The engine (SILNIK) wires
 * the returned commands into the turn loop later; this module never mutates
 * shared game state itself -- it returns plain data the caller applies.
 *
 * Owner model:
 *   RuntimeUnit.ownerId 0 = human, 1..N = AI rivals (see units/setup.ts).
 *   Barbarians use a dedicated sentinel owner id BARBARIAN_OWNER_ID (= -1)
 *   so they are never confused with a real player.
 *
 * Geometry / pathing are reused from units/setup.ts (hexDistance, computePath,
 * keyOf) so barbarians move on exactly the same terrain rules as everyone else.
 *
 * Tunable coefficients live in BarbParams. Defaults are in FALLBACK_BARB_PARAMS;
 * loadBarbParams() reads optional overrides from data/ai-params.json (the
 * "barbarzyncy_*" keys). NOTE for DANE/SILNIK: those keys must be added to
 * AI-parametry.xlsx for the panel; until then the fallbacks apply.
 *
 * References:
 *   Spec-AI.md §2.3 (retreat at low HP), §6b (camp = rest/regen),
 *   PROJEKT-GRY-master.md (neutral villages / hostile camps),
 *   units/setup.ts (RuntimeUnit, hexDistance, computePath, keyOf).
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, computePath, keyOf } from '../units/setup';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Sentinel owner id for the barbarian faction.
 * Distinct from human (0) and AI rivals (1..N). Negative by design so any
 * `ownerId >= 0` test treats barbarians as "not a real player".
 */
export const BARBARIAN_OWNER_ID = -1;

/** Returns true when an owner id belongs to the barbarian faction. */
export function isBarbarian(ownerId: number): boolean {
  return ownerId === BARBARIAN_OWNER_ID;
}

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

/**
 * A barbarian camp on the world map.
 * Camps are stationary spawn points. They are neutral terrain features the
 * engine renders; barbarians retreat to and regenerate at their camp (§6b).
 */
export interface BarbCamp {
  /** Unique id (suggested by spawnCamps; engine may reassign). */
  id: string;
  /** Axial hex coordinates of the camp. */
  q: number;
  r: number;
  /**
   * Turns remaining until this camp may spawn its next unit.
   * Decremented by tickCamps(); a spawn happens when it reaches 0.
   */
  spawnCooldown: number;
}

/**
 * A barbarian unit on the map.
 * Extends the shared RuntimeUnit so the engine can pass plain RuntimeUnit[]
 * (then `healthFrac` / `campId` are simply undefined). Barbarian-specific,
 * optional fields let this module reason about retreat and camp ownership
 * without requiring the runtime layer to carry health.
 */
export interface BarbUnit extends RuntimeUnit {
  /**
   * Current health as a fraction of max (0..1). When below
   * params.retreatHpFrac the unit retreats to its nearest camp (§2.3).
   * Omit when HP is not tracked -- the unit then always advances.
   */
  healthFrac?: number;
  /** Id of the camp this unit was spawned from (informational; optional). */
  campId?: string;
}

/**
 * A pending unit spawn produced by tickCamps().
 * The engine turns this into a real RuntimeUnit (resolving stats from
 * units.json) with ownerId = BARBARIAN_OWNER_ID.
 */
export interface BarbSpawn {
  /** Camp that produced the spawn. */
  campId: string;
  /** Spawn location (a free passable land hex next to the camp). */
  q: number;
  r: number;
  /** units.json "Jednostka" key for the spawned barbarian. */
  typeId: string;
}

/** Move a barbarian unit one step toward (toQ, toR). */
export interface BarbCmdMove {
  type: 'move';
  unitId: string;
  toQ: number;
  toR: number;
}

/** Attack an adjacent player/AI unit (engine resolves via combat.ts). */
export interface BarbCmdAttack {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
}

/** Union of barbarian movement-phase commands. */
export type BarbCommand = BarbCmdMove | BarbCmdAttack;

// ---------------------------------------------------------------------------
// Tunable parameters
// ---------------------------------------------------------------------------

/**
 * All barbarian coefficients. Loaded via loadBarbParams() from ai-params.json
 * with FALLBACK_BARB_PARAMS as defaults.
 */
export interface BarbParams {
  /** First turn on which barbarians are active (no spawns/moves before it). */
  startTurn: number;
  /** Maximum number of camps allowed on the map at once. */
  maxCamps: number;
  /** A new camp must be at least this many hexes from any player city. */
  minDistFromCity: number;
  /** A new camp must be at least this many hexes from any existing camp. */
  campSpacing: number;
  /** Turns between unit spawns at a camp (reset after a successful spawn). */
  spawnInterval: number;
  /** Max living barbarian units counted within campControlRadius of a camp. */
  unitsPerCamp: number;
  /** Radius (hexes) used to count a camp's "owned" units for the cap. */
  campControlRadius: number;
  /** Chase targets within this many hexes; otherwise idle near the camp. */
  aggroRadius: number;
  /** Health fraction (0..1) below which a unit retreats to its camp. */
  retreatHpFrac: number;
  /** units.json "Jednostka" key used for spawned barbarians. */
  unitTypeId: string;
}

/** Built-in defaults; correct even if ai-params.json carries no barbarian keys. */
export const FALLBACK_BARB_PARAMS: BarbParams = {
  startTurn: 5,
  maxCamps: 6,
  minDistFromCity: 5,
  campSpacing: 6,
  spawnInterval: 6,
  unitsPerCamp: 2,
  campControlRadius: 3,
  aggroRadius: 6,
  retreatHpFrac: 0.3,
  unitTypeId: 'Wojownik',
};

/**
 * Reads barbarian overrides from data.aiParams, falling back to
 * FALLBACK_BARB_PARAMS for any missing key.
 *
 * Tolerant of both `wartosc` (ASCII) and `wartość` (diacritic) value fields,
 * because the JSON encoding has drifted between exports.
 *
 * Recognised keys (add these to AI-parametry.xlsx):
 *   barbarzyncy_start_tura, barbarzyncy_max_obozy, barbarzyncy_min_dystans_miasto,
 *   barbarzyncy_odstep_obozow, barbarzyncy_interwal_spawnu, barbarzyncy_jednostek_na_oboz,
 *   barbarzyncy_zasieg_kontroli, barbarzyncy_zasieg_agresji, barbarzyncy_prog_odwrotu_hp.
 */
export function loadBarbParams(data: GameData): BarbParams {
  return {
    startTurn:         readParam(data, 'barbarzyncy_start_tura',         FALLBACK_BARB_PARAMS.startTurn),
    maxCamps:          readParam(data, 'barbarzyncy_max_obozy',          FALLBACK_BARB_PARAMS.maxCamps),
    minDistFromCity:   readParam(data, 'barbarzyncy_min_dystans_miasto', FALLBACK_BARB_PARAMS.minDistFromCity),
    campSpacing:       readParam(data, 'barbarzyncy_odstep_obozow',      FALLBACK_BARB_PARAMS.campSpacing),
    spawnInterval:     readParam(data, 'barbarzyncy_interwal_spawnu',    FALLBACK_BARB_PARAMS.spawnInterval),
    unitsPerCamp:      readParam(data, 'barbarzyncy_jednostek_na_oboz',  FALLBACK_BARB_PARAMS.unitsPerCamp),
    campControlRadius: readParam(data, 'barbarzyncy_zasieg_kontroli',    FALLBACK_BARB_PARAMS.campControlRadius),
    aggroRadius:       readParam(data, 'barbarzyncy_zasieg_agresji',     FALLBACK_BARB_PARAMS.aggroRadius),
    retreatHpFrac:     readParam(data, 'barbarzyncy_prog_odwrotu_hp',    FALLBACK_BARB_PARAMS.retreatHpFrac),
    unitTypeId:        FALLBACK_BARB_PARAMS.unitTypeId,
  };
}

/** Poziom z kreatora (Maciej 2026-07-04). */
export type BarbariansLevel = 'wielu' | 'nieliczni' | 'wylaczeni';

export function barbariansEnabledForLevel(level: BarbariansLevel | undefined): boolean {
  return level !== 'wylaczeni';
}

/** Skala obozów/spawnu dla „Nieliczni”; „Wielu” = parametry z JSON. */
export function scaleBarbParamsForLevel(
  params: BarbParams,
  level: BarbariansLevel | undefined,
): BarbParams {
  if (!level || level === 'wielu') return params;
  if (level === 'wylaczeni') return { ...params, maxCamps: 0 };
  return {
    ...params,
    maxCamps: Math.max(1, Math.ceil(params.maxCamps * 0.45)),
    spawnInterval: Math.ceil(params.spawnInterval * 1.5),
    unitsPerCamp: Math.max(1, params.unitsPerCamp - 1),
  };
}

/** True when barbarians are active on the given turn number. */
export function barbariansActive(
  turn: number,
  params: BarbParams,
  maxPlayerEra: number = 1,
  level: BarbariansLevel | undefined = 'wielu',
): boolean {
  if (!barbariansEnabledForLevel(level)) return false;
  if (maxPlayerEra >= EPOKA_SREDNIOWIECZE_BARBARZY) return false;
  return turn >= params.startTurn;
}

/** Od epoki Średniowiecze (4) barbarzyńcy wyłączeni — buntownicy mapowi (11=C*). */
export const EPOKA_SREDNIOWIECZE_BARBARZY = 4;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Reads a numeric ai-param value tolerant of the wartosc/wartość drift. */
function readParam(data: GameData, key: string, fallback: number): number {
  const entry = data.aiParams[key] as unknown as Record<string, unknown> | undefined;
  if (entry === undefined || entry === null) return fallback;
  const v = entry['wartość'] ?? entry['wartosc'];
  return typeof v === 'number' ? v : fallback;
}

/** Numerical Recipes 32-bit LCG: returns [nextState, float in [0,1)]. */
function lcgNext(state: number): [number, number] {
  const next = (state * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

/** Terrain that barbarians (land units / camps) can never occupy. */
function isImpassableTerrain(t: TerenBazowy): boolean {
  return t === TerenBazowy.Morze || t === TerenBazowy.Wybrzeze || t === TerenBazowy.Gory;
}

/** Pointy-top axial hex neighbours (matches units/setup.ts). */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0], [-1, 0], [0, +1], [0, -1], [+1, -1], [-1, +1],
] as const;

/** A minimal "has q/r" shape for nearest-target search. */
interface HasQR { q: number; r: number; }

/** Nearest item to (q,r) by hex distance, or undefined when the list is empty. */
function nearest<T extends HasQR>(q: number, r: number, items: T[]): T | undefined {
  let best: T | undefined;
  let bestDist = Infinity;
  for (const it of items) {
    const d = hexDistance(q, r, it.q, it.r);
    if (d < bestDist) { bestDist = d; best = it; }
  }
  return best;
}

/** Set of "q,r" keys occupied by units other than `excludeId` (for pathing). */
function occupiedExcluding(units: RuntimeUnit[], excludeId: string): Set<string> {
  const occ = new Set<string>();
  for (const u of units) {
    if (u.id !== excludeId) occ.add(keyOf(u.q, u.r));
  }
  return occ;
}

/** First hex along the least-cost path toward (destQ,destR), or null. */
function firstStep(
  unit: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  occupied: Set<string>,
): { q: number; r: number } | null {
  const path = computePath(unit, map, destQ, destR, occupied);
  if (path.length === 0) return null;
  return path[0] ?? null;
}

// ---------------------------------------------------------------------------
// Camp spawning
// ---------------------------------------------------------------------------

/** A city-like input: only its hex position matters for spacing. */
export type CityLike = HasQR;

/**
 * Picks NEW camp sites and returns them (does not include `existing`).
 *
 * A site is valid when it is: a hex that exists in the map, passable land
 * (not sea/coast/mountain), neutral (wlasciciel === null), at least
 * params.minDistFromCity from every city, and at least params.campSpacing
 * from every existing camp and every other newly-picked site.
 *
 * Candidate order is shuffled deterministically from `seed` (LCG Fisher-Yates),
 * so the same inputs always yield the same camps. New camps start with
 * spawnCooldown = 0 (eligible to spawn on the next tickCamps call).
 *
 * Stops once total camp count would reach params.maxCamps.
 *
 * @returns array of new BarbCamp to append to `existing` (possibly empty).
 */
export function spawnCamps(
  map: GameMap,
  existing: BarbCamp[],
  cities: CityLike[],
  params: BarbParams,
  seed: number,
): BarbCamp[] {
  const slotsLeft = params.maxCamps - existing.length;
  if (slotsLeft <= 0) return [];

  // Collect neutral, passable land candidates that clear the city distance.
  const candidates: { q: number; r: number }[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (hex.wlasciciel !== null) continue;
    if (isImpassableTerrain(hex.terenBazowy)) continue;

    const { q, r } = hex.coords;
    const tooCloseToCity = cities.some(c => hexDistance(q, r, c.q, c.r) < params.minDistFromCity);
    if (tooCloseToCity) continue;

    candidates.push({ q, r });
  }

  // Deterministic Fisher-Yates shuffle seeded by `seed`.
  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd: number;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  const placed: { q: number; r: number }[] = existing.map(c => ({ q: c.q, r: c.r }));
  const result: BarbCamp[] = [];

  for (const cand of candidates) {
    if (result.length >= slotsLeft) break;
    const tooClose = placed.some(p => hexDistance(cand.q, cand.r, p.q, p.r) < params.campSpacing);
    if (tooClose) continue;
    placed.push(cand);
    result.push({
      id: `bc_${seed >>> 0}_${existing.length + result.length}`,
      q: cand.q,
      r: cand.r,
      spawnCooldown: 0,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Camp ticking / unit spawning
// ---------------------------------------------------------------------------

/** Result of advancing all camps one turn. */
export interface TickResult {
  /** Updated camps (new objects; input is not mutated). */
  camps: BarbCamp[];
  /** Units to create this turn (engine instantiates them). */
  spawns: BarbSpawn[];
}

/**
 * Advances every camp one turn:
 *   - decrements spawnCooldown (floored at 0);
 *   - when a camp's cooldown is 0 AND it controls fewer than
 *     params.unitsPerCamp living barbarian units within campControlRadius,
 *     emits one BarbSpawn on a free passable land hex next to the camp and
 *     resets the cooldown to params.spawnInterval;
 *   - if the cooldown is 0 but the cap is reached or no free adjacent hex
 *     exists, the cooldown stays at 0 (the camp retries next turn).
 *
 * Pure: returns new camp objects and a spawn list; never mutates inputs.
 *
 * @param camps      Current camps.
 * @param barbUnits  All living barbarian units (for the per-camp cap).
 * @param allUnits   All units on the map (to avoid spawning onto an occupied hex).
 * @param map        Game map (terrain / hex existence).
 * @param params     Tunable coefficients.
 */
export function tickCamps(
  camps: BarbCamp[],
  barbUnits: BarbUnit[],
  allUnits: RuntimeUnit[],
  map: GameMap,
  params: BarbParams,
): TickResult {
  const occupied = new Set<string>();
  for (const u of allUnits) occupied.add(keyOf(u.q, u.r));

  const outCamps: BarbCamp[] = [];
  const spawns: BarbSpawn[] = [];

  for (const camp of camps) {
    const cd = Math.max(0, camp.spawnCooldown - 1);

    if (cd > 0) {
      outCamps.push({ ...camp, spawnCooldown: cd });
      continue;
    }

    // Cooldown ready: check the per-camp cap.
    const owned = barbUnits.filter(
      u => hexDistance(u.q, u.r, camp.q, camp.r) <= params.campControlRadius,
    ).length;

    if (owned >= params.unitsPerCamp) {
      // At cap -- hold at 0 so it spawns as soon as a slot frees up.
      outCamps.push({ ...camp, spawnCooldown: 0 });
      continue;
    }

    const spot = freeAdjacentHex(camp.q, camp.r, map, occupied);
    if (spot === null) {
      outCamps.push({ ...camp, spawnCooldown: 0 });
      continue;
    }

    // Spawn one unit and reserve its hex so two camps cannot share it.
    occupied.add(keyOf(spot.q, spot.r));
    spawns.push({ campId: camp.id, q: spot.q, r: spot.r, typeId: params.unitTypeId });
    outCamps.push({ ...camp, spawnCooldown: params.spawnInterval });
  }

  return { camps: outCamps, spawns };
}

/** Nearest free passable land hex adjacent to (q,r): ring-1 then ring-2, or null. */
function freeAdjacentHex(
  q: number,
  r: number,
  map: GameMap,
  occupied: Set<string>,
): { q: number; r: number } | null {
  // Ring 1.
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nq = q + dq;
    const nr = r + dr;
    if (isFreeLand(nq, nr, map, occupied)) return { q: nq, r: nr };
  }
  // Ring 2 (deduped), nearest-first by distance to the camp.
  const seen = new Set<string>();
  const ring2: { q: number; r: number }[] = [];
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const mq = q + dq;
    const mr = r + dr;
    for (const [dq2, dr2] of HEX_NEIGHBORS) {
      const nq = mq + dq2;
      const nr = mr + dr2;
      const k = keyOf(nq, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      if (nq === q && nr === r) continue;
      if (isFreeLand(nq, nr, map, occupied)) ring2.push({ q: nq, r: nr });
    }
  }
  ring2.sort((a, b) => hexDistance(a.q, a.r, q, r) - hexDistance(b.q, b.r, q, r));
  return ring2[0] ?? null;
}

/** True when (q,r) exists, is passable land, and is not occupied. */
function isFreeLand(q: number, r: number, map: GameMap, occupied: Set<string>): boolean {
  const k = keyOf(q, r);
  const hex = map.hexes[k];
  if (hex === undefined) return false;
  if (occupied.has(k)) return false;
  return !isImpassableTerrain(hex.terenBazowy);
}

// ---------------------------------------------------------------------------
// Aggression / movement
// ---------------------------------------------------------------------------

/**
 * Decides one command per barbarian unit for the movement phase.
 *
 * Per unit, in priority order:
 *   1. Low HP (healthFrac < params.retreatHpFrac): step toward the nearest
 *      camp (§2.3 retreat to regenerate). If already adjacent, no command.
 *   2. Adjacent enemy (player/AI) unit: attack it.
 *   3. A target (enemy unit or city) within params.aggroRadius: step toward
 *      the nearest such target. Moving onto / next to a city is a raid the
 *      engine resolves.
 *   4. Otherwise idle: if more than 1 hex from the home camp, step back toward
 *      it; if no camps exist, no command.
 *
 * Units with ruchLeft <= 0 are skipped. Enemy targets are any non-barbarian
 * unit; barbarians never target each other. Pure -- returns commands only.
 *
 * @param barbUnits   Barbarian units to move.
 * @param playerUnits All non-barbarian units (targets). Barbarians are filtered out.
 * @param cities      All cities (targets / raid objectives).
 * @param camps       Barbarian camps (retreat / idle anchors).
 * @param map         Game map for pathing.
 * @param params      Tunable coefficients.
 */
export function decideBarbarianMoves(
  barbUnits: BarbUnit[],
  playerUnits: RuntimeUnit[],
  cities: CityLike[],
  camps: BarbCamp[],
  map: GameMap,
  params: BarbParams,
): BarbCommand[] {
  const commands: BarbCommand[] = [];

  // Only real players are valid targets.
  const enemies = playerUnits.filter(u => !isBarbarian(u.ownerId));

  // All units occupy hexes for pathing (barbs + players).
  const allUnits: RuntimeUnit[] = [...barbUnits, ...enemies];

  for (const unit of barbUnits) {
    if (unit.ruchLeft <= 0) continue;

    const occ = occupiedExcluding(allUnits, unit.id);

    // 1. Retreat when wounded.
    if (unit.healthFrac !== undefined && unit.healthFrac < params.retreatHpFrac) {
      const camp = nearest(unit.q, unit.r, camps);
      if (camp !== undefined && hexDistance(unit.q, unit.r, camp.q, camp.r) > 1) {
        const step = firstStep(unit, map, camp.q, camp.r, occ);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
      continue;
    }

    // 2. Attack an adjacent enemy unit.
    const adjacentEnemy = enemies.find(e => hexDistance(unit.q, unit.r, e.q, e.r) === 1);
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    // 3. Chase the nearest target (unit or city) inside the aggro radius.
    const nearestEnemyUnit = nearest(unit.q, unit.r, enemies);
    const nearestCity = nearest(unit.q, unit.r, cities);
    const targets: { q: number; r: number; d: number }[] = [];
    if (nearestEnemyUnit !== undefined) {
      targets.push({ q: nearestEnemyUnit.q, r: nearestEnemyUnit.r, d: hexDistance(unit.q, unit.r, nearestEnemyUnit.q, nearestEnemyUnit.r) });
    }
    if (nearestCity !== undefined) {
      targets.push({ q: nearestCity.q, r: nearestCity.r, d: hexDistance(unit.q, unit.r, nearestCity.q, nearestCity.r) });
    }
    targets.sort((a, b) => a.d - b.d);
    const target = targets[0];
    if (target !== undefined && target.d <= params.aggroRadius) {
      const step = firstStep(unit, map, target.q, target.r, occ);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        continue;
      }
    }

    // 4. Idle: drift back toward the home camp.
    const homeCamp = nearest(unit.q, unit.r, camps);
    if (homeCamp !== undefined && hexDistance(unit.q, unit.r, homeCamp.q, homeCamp.r) > 1) {
      const step = firstStep(unit, map, homeCamp.q, homeCamp.r, occ);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
      }
    }
  }

  return commands;
}
