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
import type { City } from './cities';
import { addForeignCityBlocks } from './city-hex-movement';
import type { Hex } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, computePath, keyOf, isWaterTerrain, embarkMoveCost } from '../units/setup';

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
  /**
   * TEMAT #15 (Ludy Morza): obóz nadmorski (heks Wybrzeża / wysepka).
   * Spawnuje jednostki ZAOKRĘTOWANE na sąsiednim heksie wody.
   * Pole opcjonalne — stare save'y bez pola = obóz lądowy (kompatybilne).
   */
  naval?: boolean;
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
  /**
   * TEMAT #15: jednostka Ludów Morza (spawn z obozu nadmorskiego) — prowadzona
   * przez decideSeaPeoplesRaids (rajdy), a nie zwykłą logikę lądową.
   * Utrwalane w save razem z units[] (pole opcjonalne, wstecznie kompatybilne).
   */
  seaRaider?: boolean;
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
  /** TEMAT #15: spawn z obozu nadmorskiego — jednostka startuje ZAOKRĘTOWANA
   *  na heksie wody (silnik ustawia embarked=true i seaRaider=true). */
  embarked?: boolean;
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

/**
 * TEMAT #15: rajd Ludów Morza — wejście na heks (toQ,toR) z wrogim ulepszeniem
 * terenu i ZNISZCZENIE go (silnik: hex.ulepszenie = Brak + przenosi jednostkę).
 */
export interface BarbCmdRaid {
  type: 'raid';
  unitId: string;
  toQ: number;
  toR: number;
}

/** Union of barbarian movement-phase commands. */
export type BarbCommand = BarbCmdMove | BarbCmdAttack | BarbCmdRaid;

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

// ---------------------------------------------------------------------------
// TEMAT #15 — Ludy Morza na morzu: parametry rajdów (wg trudności gry)
// ---------------------------------------------------------------------------

/** Klucz trudności silnika (main.ts `_menuDifficulty`). */
export type SeaRaidDifficulty = 'easy' | 'normal' | 'hard';

/** Parametry obozów nadmorskich i rajdów Ludów Morza. */
export interface SeaBarbParams {
  /** Maksymalna liczba obozów nadmorskich (osobny limit, obok maxCamps lądowych). */
  maxSeaCamps: number;
  /** Zasięg (heksy) szukania celu rajdu: nadmorskie miasto / ulepszenie terenu. */
  raidRadius: number;
  /**
   * Co ile tur rusza „fala rajdów" (1 = co turę). Wg trudności:
   * easy rzadko (6) / normal średnio (3) / hard często (1) — placeholdery
   * w data/ai-params.json (ludy_morza_rajd_okres_*).
   */
  raidPeriod: number;
}

/** Wbudowane domyślne (trudność normal). */
export const FALLBACK_SEA_BARB_PARAMS: SeaBarbParams = {
  maxSeaCamps: 3,
  raidRadius: 8,
  raidPeriod: 3,
};

/**
 * Czyta parametry Ludów Morza z data/ai-params.json (konwencja `wartosc`),
 * z fallbackami. Klucze:
 *   ludy_morza_max_obozy, ludy_morza_rajd_zasieg,
 *   ludy_morza_rajd_okres_latwy / _normalny / _trudny (intensywność wg trudności).
 */
export function loadSeaBarbParams(
  data: GameData,
  difficulty: SeaRaidDifficulty = 'normal',
): SeaBarbParams {
  const periodKey =
    difficulty === 'easy' ? 'ludy_morza_rajd_okres_latwy'
    : difficulty === 'hard' ? 'ludy_morza_rajd_okres_trudny'
    : 'ludy_morza_rajd_okres_normalny';
  const periodFallback = difficulty === 'easy' ? 6 : difficulty === 'hard' ? 1 : 3;
  return {
    maxSeaCamps: readParam(data, 'ludy_morza_max_obozy',  FALLBACK_SEA_BARB_PARAMS.maxSeaCamps),
    raidRadius:  readParam(data, 'ludy_morza_rajd_zasieg', FALLBACK_SEA_BARB_PARAMS.raidRadius),
    raidPeriod:  Math.max(1, readParam(data, periodKey, periodFallback)),
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

/**
 * Ludy Morza (BACKLOG): w epoce Brąz barbarzyńcy spawnują WYŁĄCZNIE jednostki
 * Ludów Morza (pełne zastąpienie domyślnego 'Wojownik') -- oba typy naprzemiennie,
 * bez zależności od poziomu trudności (decyzja właściciela 2026-07-19).
 * Staty jednostek bez zmian; render po nazwie już wspiera oba modele.
 */
export const LUDY_MORZA_BARB_UNIT_IDS: readonly string[] = ['Wojownik Sherden', 'Wojownik szekelesz'];

/**
 * Wybiera deterministycznie jednostkę Ludów Morza dla danego "ziarna"
 * (np. numeru tury) -- naprzemiennie po parzystości. Bez Math.random.
 */
export function pickBronzeBarbUnit(seed: number): string {
  const idx = ((seed % LUDY_MORZA_BARB_UNIT_IDS.length) + LUDY_MORZA_BARB_UNIT_IDS.length) % LUDY_MORZA_BARB_UNIT_IDS.length;
  return LUDY_MORZA_BARB_UNIT_IDS[idx]!;
}

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
  costFn?: (hex: Hex) => number,
): { q: number; r: number } | null {
  const path = computePath(unit, map, destQ, destR, occupied, costFn);
  if (path.length === 0) return null;
  return path[0] ?? null;
}

// ---------------------------------------------------------------------------
// Camp spawning
// ---------------------------------------------------------------------------

/** A city-like input for spacing / movement blocking. */
export type CityLike = HasQR & { ownerId?: number };

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

/**
 * TEMAT #15 (część B): obozy Ludów Morza na WYBRZEŻU / wysepkach.
 *
 * Kandydat na obóz nadmorski: heks neutralny, który jest
 *   (a) Wybrzeżem (płytka woda przy lądzie — plażowy obóz najeźdźców), albo
 *   (b) przejezdnym lądem-wysepką: ≥ 4 z 6 sąsiadów to woda (Morze/Wybrzeże).
 * Reszta reguł jak spawnCamps: dystans od miast (minDistFromCity), odstęp
 * campSpacing od WSZYSTKICH istniejących obozów (lądowych i morskich) oraz
 * między sobą; deterministyczny shuffle LCG z `seed`.
 *
 * Limit: seaParams.maxSeaCamps liczony TYLKO po obozach naval (osobno od
 * lądowego params.maxCamps — obozy nadmorskie są „obok istniejących lądowych").
 *
 * @returns nowe obozy z naval=true (możliwie pusta tablica).
 *
 * R-LUDY-MORZA-Q1=A: silnik NIE woła tej funkcji w epoce Brązu (era 2).
 * Zostaje dla testów historycznych / ewentualnej opcji C (inny model obozu).
 */
export function spawnSeaCamps(
  map: GameMap,
  existing: BarbCamp[],
  cities: CityLike[],
  params: BarbParams,
  seaParams: SeaBarbParams,
  seed: number,
): BarbCamp[] {
  const existingSea = existing.filter(c => c.naval === true).length;
  const slotsLeft = seaParams.maxSeaCamps - existingSea;
  if (slotsLeft <= 0) return [];

  const candidates: { q: number; r: number }[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (hex.wlasciciel !== null) continue;

    const { q, r } = hex.coords;
    let ok = false;
    if (hex.terenBazowy === TerenBazowy.Wybrzeze) {
      ok = true; // (a) obóz plażowy na płytkiej wodzie
    } else if (!isImpassableTerrain(hex.terenBazowy)) {
      // (b) wysepka: większość sąsiadów to woda
      let waterN = 0;
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const nHex = map.hexes[keyOf(q + dq, r + dr)];
        if (nHex !== undefined && isWaterTerrain(nHex.terenBazowy)) waterN++;
      }
      ok = waterN >= 4;
    }
    if (!ok) continue;

    const tooCloseToCity = cities.some(c => hexDistance(q, r, c.q, c.r) < params.minDistFromCity);
    if (tooCloseToCity) continue;

    candidates.push({ q, r });
  }

  // Deterministyczny Fisher-Yates (LCG) — jak w spawnCamps.
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
      id: `bsc_${seed >>> 0}_${existingSea + result.length}`,
      q: cand.q,
      r: cand.r,
      spawnCooldown: 0,
      naval: true,
    });
  }

  return result;
}

/** Id „wirtualnego" obozu dla spawnów Ludów Morza bez obozu naval (Q1=A). */
export const SEA_WAVE_CAMP_ID = 'sea_wave';

/**
 * R-LUDY-MORZA-Q1=A: usuwa obozy nadmorskie (naval) z save — Brąz bez obozów na wodzie.
 */
export function purgeNavalCamps(camps: BarbCamp[]): BarbCamp[] {
  return camps.filter(c => c.naval !== true);
}

/** Woda przy lądzie (≥1 sąsiad nie-woda). */
function isWaterAdjacentToLand(map: GameMap, q: number, r: number): boolean {
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const hex = map.hexes[keyOf(q + dq, r + dr)];
    if (hex !== undefined && !isWaterTerrain(hex.terenBazowy)) return true;
  }
  return false;
}

/** Woda w zasięgu rajdu od nadmorskiego miasta. */
function isWaterNearCoastalCity(
  map: GameMap,
  q: number,
  r: number,
  cities: CityLike[],
  raidRadius: number,
): boolean {
  for (const c of cities) {
    if (!isCoastalCity(map, c)) continue;
    if (hexDistance(q, r, c.q, c.r) <= raidRadius) return true;
  }
  return false;
}

/**
 * R-LUDY-MORZA-Q1=A: spawn zaokrętowanych rajderów Ludów Morza na wodzie (bez obozów naval).
 *
 * Caller filtruje erę (Brąz). Zwraca 0 lub 1 spawn na wywołanie:
 *   - limit żywych: seaParams.maxSeaCamps × params.unitsPerCamp (rajderzy seaRaider/embarked);
 *   - częstotliwość: co params.spawnInterval tur (liczone od startTurn);
 *   - heks: woda (Morze/Wybrzeże), minDistFromCity od miast, wolny, przy lądzie LUB w raidRadius
 *     od nadmorskiego miasta; deterministyczny LCG z `seed`.
 */
export function spawnSeaPeoplesRaiders(
  map: GameMap,
  cities: CityLike[],
  barbUnits: BarbUnit[],
  allUnits: RuntimeUnit[],
  params: BarbParams,
  seaParams: SeaBarbParams,
  turn: number,
  seed: number,
): BarbSpawn[] {
  const alive = barbUnits.filter(u => u.seaRaider === true || u.embarked === true).length;
  const maxAlive = seaParams.maxSeaCamps * params.unitsPerCamp;
  if (alive >= maxAlive) return [];

  if (turn < params.startTurn) return [];
  const turnsSinceStart = turn - params.startTurn;
  if (turnsSinceStart <= 0 || turnsSinceStart % params.spawnInterval !== 0) return [];

  const occupied = new Set<string>();
  for (const u of allUnits) occupied.add(keyOf(u.q, u.r));

  const candidates: { q: number; r: number }[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (hex.wlasciciel !== null) continue;
    if (!isWaterTerrain(hex.terenBazowy)) continue;

    const { q, r } = hex.coords;
    if (occupied.has(key)) continue;

    const tooCloseToCity = cities.some(c => hexDistance(q, r, c.q, c.r) < params.minDistFromCity);
    if (tooCloseToCity) continue;

    const nearCoast = isWaterAdjacentToLand(map, q, r)
      || isWaterNearCoastalCity(map, q, r, cities, seaParams.raidRadius);
    if (!nearCoast) continue;

    candidates.push({ q, r });
  }

  if (candidates.length === 0) return [];

  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd: number;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  const spot = candidates[0]!;
  return [{
    campId: SEA_WAVE_CAMP_ID,
    q: spot.q,
    r: spot.r,
    typeId: pickBronzeBarbUnit(turn),
    embarked: true,
  }];
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

    // TEMAT #15: obóz nadmorski spawnuje na sąsiedniej WODZIE (jednostka
    // zaokrętowana). Gdy brak wolnej wody — fallback na ląd (niezaokrętowana).
    let spot: { q: number; r: number } | null = null;
    let embarked = false;
    if (camp.naval === true) {
      spot = freeAdjacentWaterHex(camp.q, camp.r, map, occupied);
      if (spot !== null) embarked = true;
    }
    if (spot === null) spot = freeAdjacentHex(camp.q, camp.r, map, occupied);
    if (spot === null) {
      outCamps.push({ ...camp, spawnCooldown: 0 });
      continue;
    }

    // Spawn one unit and reserve its hex so two camps cannot share it.
    occupied.add(keyOf(spot.q, spot.r));
    spawns.push({
      campId: camp.id,
      q: spot.q,
      r: spot.r,
      typeId: params.unitTypeId,
      ...(embarked ? { embarked: true } : {}),
    });
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

/** TEMAT #15: najbliższy wolny heks WODY przy (q,r): ring-1, potem ring-2, lub null. */
function freeAdjacentWaterHex(
  q: number,
  r: number,
  map: GameMap,
  occupied: Set<string>,
): { q: number; r: number } | null {
  const isFreeWater = (nq: number, nr: number): boolean => {
    const k = keyOf(nq, nr);
    const hex = map.hexes[k];
    if (hex === undefined || occupied.has(k)) return false;
    return isWaterTerrain(hex.terenBazowy);
  };
  for (const [dq, dr] of HEX_NEIGHBORS) {
    if (isFreeWater(q + dq, r + dr)) return { q: q + dq, r: r + dr };
  }
  const seen = new Set<string>();
  const ring2: { q: number; r: number }[] = [];
  for (const [dq, dr] of HEX_NEIGHBORS) {
    for (const [dq2, dr2] of HEX_NEIGHBORS) {
      const nq = q + dq + dq2;
      const nr = r + dr + dr2;
      const k = keyOf(nq, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      if (nq === q && nr === r) continue;
      if (isFreeWater(nq, nr)) ring2.push({ q: nq, r: nr });
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

/**
 * Liczba żyjących jednostek barbarzyńskich w zasięgu kontroli obozu
 * (ten sam promień co tickCamps — campControlRadius).
 */
function countCampGarrison(
  camp: BarbCamp,
  barbUnits: BarbUnit[],
  campControlRadius: number,
): number {
  return barbUnits.filter(
    u => hexDistance(u.q, u.r, camp.q, camp.r) <= campControlRadius,
  ).length;
}

/**
 * Obóz „gotowy do rajdu": ma pełny kontyngent bojowników.
 * „Dwie jednostki" (Maciej 2026-08-02) = unitsPerCamp (domyślnie 2) żywych
 * wojowników w promieniu campControlRadius — nie osadnicy, nie rajderzy morscy
 * (ci mają decideSeaPeoplesRaids).
 */
export function isCampRaidReady(
  camp: BarbCamp,
  barbUnits: BarbUnit[],
  params: BarbParams,
): boolean {
  const landUnits = barbUnits.filter(
    u => u.seaRaider !== true && u.embarked !== true,
  );
  return countCampGarrison(camp, landUnits, params.campControlRadius) >= params.unitsPerCamp;
}

/** Obóz macierzysty jednostki: campId albo najbliższy obóz w zasięgu kontroli. */
function homeCampForUnit(
  unit: BarbUnit,
  camps: BarbCamp[],
  campControlRadius: number,
): BarbCamp | undefined {
  if (unit.campId) {
    const byId = camps.find(c => c.id === unit.campId);
    if (byId !== undefined) return byId;
  }
  let best: BarbCamp | undefined;
  let bestDist = Infinity;
  for (const c of camps) {
    const d = hexDistance(unit.q, unit.r, c.q, c.r);
    if (d <= campControlRadius && d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1 (odpowiedź właściciela, 2026-08-12): obóz
 * jest niszczony przez WEJŚCIE (najechanie) jednostki -- gracza LUB AI -- na
 * jego heks. To ZASTĘPUJE poprzednią mechanikę (`pruneEmptyCampsAfterCombat`,
 * wyzwalacz = zliczanie garnizonu w promieniu po walce) -- Evaluator znalazł w
 * niej realną regresję (asymetria identyfikacji vs decyzji), a właściciel
 * ustalił wprost, że to była w ogóle zła mechanika, nie do poprawki parametru.
 * Analogia: wioski neutralne w main.ts (`checkVillageRewardAt`) -- pierwsze
 * wejście na heks = trwały efekt na heksie. Różnica: bez nagrody, i dotyczy
 * KAŻDEJ cywilizacji (nie tylko gracza) -- wołający (main.ts) musi sam
 * wykluczyć jednostki barbarzyńskie, ta funkcja tego nie robi (przyjmuje samo
 * (q, r), bez informacji o właścicielu wchodzącej jednostki).
 *
 * Zniszczenie obozu NIE dotyka jednostek barbarzyńskich już zaspawnowanych na
 * mapie (`units`) -- te walczą dalej normalnie, niezależnie od losu obozu po
 * zaspawnowaniu. Jedyny efekt: obóz znika z `camps`, więc tickCamps()
 * przestaje z niego spawnować NOWE jednostki.
 *
 * Czysta funkcja: nie mutuje `camps`, zwraca nową listę.
 * / EN: a camp is destroyed by a unit -- player OR AI -- ENTERING its hex.
 * This REPLACES the previous mechanic (`pruneEmptyCampsAfterCombat`, trigger =
 * garrison count within a radius after combat) -- the Evaluator found a real
 * regression in it (identification vs. decision asymmetry), and the owner
 * determined outright that it was simply the wrong mechanic, not a parameter
 * to tune. Mirrors neutral villages in main.ts (`checkVillageRewardAt`): first
 * entry onto the hex = a permanent effect. Difference: no reward, and it
 * applies to every civilization (not just the player) -- the caller (main.ts)
 * must exclude barbarian-owned movers itself; this function takes only (q, r)
 * and has no notion of who is entering.
 *
 * Destroying a camp never touches barbarian units already spawned on the map
 * (`units`) -- they keep fighting normally, independent of their home camp's
 * fate after spawning. The only effect: the camp disappears from `camps`, so
 * tickCamps() stops spawning NEW units from it. Pure: does not mutate `camps`.
 *
 * @param camps  Obozy PRZED usunięciem.
 * @param q, r   Heks, na który właśnie weszła (dokończyła ruch) jednostka.
 * @returns nowa lista obozów (bez zniszczonego, jeśli jakiś tam był) + id zniszczonego obozu (albo null).
 */
export function destroyCampAt(
  camps: BarbCamp[],
  q: number,
  r: number,
): { camps: BarbCamp[]; destroyedCampId: string | null } {
  const idx = camps.findIndex(c => c.q === q && c.r === r);
  if (idx === -1) return { camps: camps.slice(), destroyedCampId: null };
  const destroyedCampId = camps[idx]!.id;
  const kept = camps.slice(0, idx).concat(camps.slice(idx + 1));
  return { camps: kept, destroyedCampId };
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
 *   3. A target (enemy unit or city) within params.aggroRadius — OR, when the
 *      unit's home camp is raid-ready (>= unitsPerCamp living land warriors in
 *      campControlRadius), ANY distance to the nearest civilization target:
 *      step toward the nearest enemy unit or city.
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
 * @param canEngageOwner
 *   C-BARB-Q1/Q2 (Maciej 2026-07-26): war-state gate for the ATTACK decision --
 *   same bramka as ai.ts's aiCanEngageOwner (main.ts wires it to
 *   getDiploRelation(BARBARIAN_OWNER_ID, targetOwnerId).status === 'wojna').
 *   Barbarians are always at war with every non-barbarian owner (see main.ts
 *   getDiploRelation), so this is a rule, not a hard-coded exception -- omitted
 *   (tests, legacy callers) it defaults to "always engageable", identical to
 *   the previous unconditional behaviour.
 * @param difficulty
 *   P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1=A (Maciej 2026-08-12): ECHO -- trzy
 *   poziomy trudności = ISTNIEJĄCY suwak gry (_menuDifficulty), NIE nowe
 *   ustawienie. `undefined` (wszyscy istniejący wołający/testy) = LEGACY
 *   zachowanie, bit-identyczne z easy -- żadna nowa gałąź kodu się nie
 *   uruchamia (gwarancja "easy bez zmian"). 'normal'/'hard': miasto BEZ
 *   żadnej jednostki broniącej na jego heksie (sprawdzone przez `playerUnits`)
 *   przestaje być celem "chase" (krok 3) -- po oczyszczeniu miasta z obrońców
 *   jednostka celuje w NASTĘPNE najbliższe miasto/jednostkę, zamiast tkwić
 *   przy tym samym (właściciel: "na średnim poziomie jeżeli jedno miasto
 *   udaje mi się zniszczyć jednostki idą do kolejnego miasta"). Dla 'hard' to
 *   dodatkowo za darmo wyklucza WŁASNE (już przejęte) miasto barbarzyńców --
 *   `civCities` już filtruje `isBarbarian(c.ownerId)` niezależnie od tego pola.
 *   / EN: three difficulty levels = the EXISTING game slider (_menuDifficulty),
 *   not a new setting. `undefined` (all pre-existing callers/tests) = LEGACY
 *   behaviour, bit-identical to easy -- no new code path runs (guarantees
 *   "easy unchanged"). 'normal'/'hard': a city with NO defending unit on its
 *   hex (checked via `playerUnits`) stops being a chase target (step 3) -- once
 *   cleared of defenders the unit heads for the next-nearest city/unit instead
 *   of camping the same one.
 */
export function decideBarbarianMoves(
  barbUnits: BarbUnit[],
  playerUnits: RuntimeUnit[],
  cities: CityLike[],
  camps: BarbCamp[],
  map: GameMap,
  params: BarbParams,
  canEngageOwner?: (targetOwnerId: number) => boolean,
  difficulty?: SeaRaidDifficulty,
): BarbCommand[] {
  const commands: BarbCommand[] = [];
  const engageOk = canEngageOwner ?? ((_targetOwnerId: number) => true);
  const skipDefenselessCities = difficulty === 'normal' || difficulty === 'hard';

  // Only real players are valid targets.
  const enemies = playerUnits.filter(u => !isBarbarian(u.ownerId));

  // All units occupy hexes for pathing (barbs + players).
  const allUnits: RuntimeUnit[] = [...barbUnits, ...enemies];

  for (const unit of barbUnits) {
    if (unit.ruchLeft <= 0) continue;
    // TEMAT #15: jednostki Ludów Morza (rajderzy / zaokrętowane) prowadzi
    // decideSeaPeoplesRaids — logika lądowa ich nie rusza.
    if (unit.embarked === true || unit.seaRaider === true) continue;

    const occ = addForeignCityBlocks(
      occupiedExcluding(allUnits, unit.id),
      unit.ownerId,
      cities as Pick<City, 'q' | 'r' | 'ownerId'>[],
    );

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

    // 2. Attack an adjacent enemy unit -- gated by the same war-state rule as
    // the rest of the engine (canEngageOwner), not a hard-coded !isBarbarian
    // bypass (C-BARB-Q1/Q2). Barbarians are always at war with everyone, so in
    // practice this changes nothing observable -- it routes through the rule
    // instead of around it.
    const adjacentEnemy = enemies.find(
      e => hexDistance(unit.q, unit.r, e.q, e.r) === 1 && engageOk(e.ownerId),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    // 3. Chase the nearest civilization target (unit or city).
    const nearestEnemyUnit = nearest(unit.q, unit.r, enemies);
    const civCities = cities.filter(c => {
      if (c.ownerId !== undefined && isBarbarian(c.ownerId)) return false;
      // P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1=A (normal/hard): miasto bez ŻADNEJ
      // jednostki broniącej na jego heksie nie jest już "chase" celem -- patrz
      // komentarz `difficulty` przy sygnaturze funkcji.
      if (skipDefenselessCities && !enemies.some(e => e.q === c.q && e.r === c.r)) return false;
      return true;
    });
    const nearestCity = nearest(unit.q, unit.r, civCities);
    const targets: { q: number; r: number; d: number }[] = [];
    if (nearestEnemyUnit !== undefined) {
      targets.push({ q: nearestEnemyUnit.q, r: nearestEnemyUnit.r, d: hexDistance(unit.q, unit.r, nearestEnemyUnit.q, nearestEnemyUnit.r) });
    }
    if (nearestCity !== undefined) {
      targets.push({ q: nearestCity.q, r: nearestCity.r, d: hexDistance(unit.q, unit.r, nearestCity.q, nearestCity.r) });
    }
    targets.sort((a, b) => a.d - b.d);
    const target = targets[0];
    const homeCamp = homeCampForUnit(unit, camps, params.campControlRadius);
    const raidReady = homeCamp !== undefined && isCampRaidReady(homeCamp, barbUnits, params);
    const chaseRadius = raidReady ? Infinity : params.aggroRadius;
    if (target !== undefined && target.d <= chaseRadius) {
      const step = firstStep(unit, map, target.q, target.r, occ);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        continue;
      }
    }

    // 4. Idle: drift back toward the home camp (tylko gdy obóz nie wysłał rajdu).
    if (raidReady) continue;
    const homeCampIdle = homeCamp ?? nearest(unit.q, unit.r, camps);
    if (homeCampIdle !== undefined && hexDistance(unit.q, unit.r, homeCampIdle.q, homeCampIdle.r) > 1) {
      const step = firstStep(unit, map, homeCampIdle.q, homeCampIdle.r, occ);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
      }
    }
  }

  return commands;
}

// ---------------------------------------------------------------------------
// TEMAT #15 (część C) — rajdy Ludów Morza
// ---------------------------------------------------------------------------

/** Cel rajdu: heks z wrogim (posiadanym) ulepszeniem terenu. */
export interface SeaRaidTarget {
  q: number;
  r: number;
}

/**
 * Zbiera cele rajdów: heksy z ulepszeniem terenu innym niż 'brak'.
 * Ulepszenia budują wyłącznie gracz/AI (barbarzyńcy nie budują), więc każde
 * zbudowane ulepszenie jest prawomocnym celem — bez potrzeby śledzenia
 * właściciela heksa. Kolejność deterministyczna (iteracja po kluczach mapy).
 */
export function collectSeaRaidTargets(map: GameMap): SeaRaidTarget[] {
  const out: SeaRaidTarget[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    const ul = (hex as { ulepszenie?: unknown }).ulepszenie;
    if (typeof ul === 'string' && ul !== 'brak') {
      out.push({ q: hex.coords.q, r: hex.coords.r });
    }
  }
  return out;
}

/** Miasto nadmorskie = heks miasta ma ≥1 sąsiada-wodę (cel podejścia rajdu). */
export function isCoastalCity(map: GameMap, city: HasQR): boolean {
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const hex = map.hexes[keyOf(city.q + dq, city.r + dr)];
    if (hex !== undefined && isWaterTerrain(hex.terenBazowy)) return true;
  }
  return false;
}

/** Najbliższy heks wody na mapie względem (q,r) — powrót rajdera w morze. */
function nearestWaterHexOnMap(map: GameMap, q: number, r: number): { q: number; r: number } | undefined {
  let best: { q: number; r: number } | undefined;
  let bestDist = Infinity;
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined || !isWaterTerrain(hex.terenBazowy)) continue;
    const d = hexDistance(q, r, hex.coords.q, hex.coords.r);
    if (d < bestDist) { bestDist = d; best = { q: hex.coords.q, r: hex.coords.r }; }
  }
  return best;
}

/**
 * Decyzje rajdowe Ludów Morza — jedna komenda na jednostkę seaRaider.
 * Deterministyczne (żadnego Math.random; wybory przez nearest / kolejność wejścia).
 *
 * Stan wynika z terenu (embarked utrzymuje silnik — applyEmbarkStateAfterMove):
 *
 * NA WODZIE (embarked):
 *   1. „Fala rajdów" tylko co seaParams.raidPeriod tur (intensywność wg
 *      trudności; 1 = co turę). Poza falą — jednostka dryfuje (brak komendy).
 *   2. Cel = najbliższe wrogie ulepszenie terenu LUB nadmorskie miasto w
 *      promieniu raidRadius. Ulepszenie sąsiednie → komenda 'raid' (wejście
 *      + zniszczenie + auto-zejście na ląd). Inaczej krok ku celowi po wodzie
 *      (koszt embarkMoveCost); wejście na ląd = automatyczny desant.
 *   3. Brak celu → brak komendy (czeka na morzu).
 *
 * NA LĄDZIE (desant po rajdzie):
 *   1. Wróg obok → atak (jak barbarzyńcy).
 *   2. Wrogie ulepszenie w zasięgu → 'raid' (sąsiednie) albo krok ku niemu.
 *   3. Nic do złupienia („po zniszczeniu ulepszenia / nieudanym szturmie") →
 *      krok z powrotem ku najbliższej wodzie (auto-zaokrętowanie na wodzie).
 */
export function decideSeaPeoplesRaids(
  seaUnits: BarbUnit[],
  playerUnits: RuntimeUnit[],
  cities: CityLike[],
  raidTargets: SeaRaidTarget[],
  map: GameMap,
  seaParams: SeaBarbParams,
  turn: number,
  // C-BARB-Q1/Q2 (Maciej 2026-07-26): war-state gate for the ashore ATTACK
  // decision -- see decideBarbarianMoves for the full rationale. Optional so
  // existing callers/tests keep the previous "always engageable" behaviour.
  canEngageOwner?: (targetOwnerId: number) => boolean,
): BarbCommand[] {
  const commands: BarbCommand[] = [];
  const engageOk = canEngageOwner ?? ((_targetOwnerId: number) => true);
  const enemies = playerUnits.filter(u => !isBarbarian(u.ownerId));
  const allUnits: RuntimeUnit[] = [...seaUnits, ...enemies];
  const raidWave = seaParams.raidPeriod <= 1 || turn % seaParams.raidPeriod === 0;
  const coastalCities = cities.filter(c => isCoastalCity(map, c));

  for (const unit of seaUnits) {
    if (unit.ruchLeft <= 0) continue;

    const occ = addForeignCityBlocks(
      occupiedExcluding(allUnits, unit.id),
      unit.ownerId,
      cities as Pick<City, 'q' | 'r' | 'ownerId'>[],
    );

    const nearestImpr = nearest(unit.q, unit.r, raidTargets);
    const imprDist = nearestImpr !== undefined
      ? hexDistance(unit.q, unit.r, nearestImpr.q, nearestImpr.r)
      : Infinity;

    if (unit.embarked === true) {
      // --- NA WODZIE ---
      if (!raidWave) continue;

      const nearestCity = nearest(unit.q, unit.r, coastalCities);
      const cityDist = nearestCity !== undefined
        ? hexDistance(unit.q, unit.r, nearestCity.q, nearestCity.r)
        : Infinity;

      // Sąsiednie ulepszenie → rajd (desant + zniszczenie).
      if (nearestImpr !== undefined && imprDist === 1 && !occ.has(keyOf(nearestImpr.q, nearestImpr.r))) {
        commands.push({ type: 'raid', unitId: unit.id, toQ: nearestImpr.q, toR: nearestImpr.r });
        continue;
      }

      // Najbliższy cel w zasięgu rajdu → krok (po wodzie; ląd = desant).
      const targets: { q: number; r: number; d: number }[] = [];
      if (nearestImpr !== undefined && imprDist <= seaParams.raidRadius) {
        targets.push({ q: nearestImpr.q, r: nearestImpr.r, d: imprDist });
      }
      if (nearestCity !== undefined && cityDist <= seaParams.raidRadius) {
        targets.push({ q: nearestCity.q, r: nearestCity.r, d: cityDist });
      }
      targets.sort((a, b) => a.d - b.d);
      const target = targets[0];
      if (target !== undefined) {
        const step = firstStep(unit, map, target.q, target.r, occ, embarkMoveCost);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
      continue;
    }

    // --- NA LĄDZIE (desant) ---
    // 1. Atak na wroga obok (jak barbarzyńcy lądowi) -- ta sama bramka canEngageOwner.
    const adjacentEnemy = enemies.find(
      e => hexDistance(unit.q, unit.r, e.q, e.r) === 1 && engageOk(e.ownerId),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    // 2. Wrogie ulepszenie w zasięgu → rajd lub krok ku niemu.
    if (nearestImpr !== undefined && imprDist <= seaParams.raidRadius) {
      if (imprDist === 1 && !occ.has(keyOf(nearestImpr.q, nearestImpr.r))) {
        commands.push({ type: 'raid', unitId: unit.id, toQ: nearestImpr.q, toR: nearestImpr.r });
        continue;
      }
      const step = firstStep(unit, map, nearestImpr.q, nearestImpr.r, occ, embarkMoveCost);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        continue;
      }
    }

    // 3. Powrót w morze (auto-zaokrętowanie po wejściu na wodę).
    const water = nearestWaterHexOnMap(map, unit.q, unit.r);
    if (water !== undefined) {
      const step = firstStep(unit, map, water.q, water.r, occ, embarkMoveCost);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
      }
    }
  }

  return commands;
}
