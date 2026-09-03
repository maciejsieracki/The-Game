/**
 * wonder-placement.ts — wybór heksa na cud świata w terytorium miasta (MAPA).
 * Kanon: budowa na hexie terytorium, nie w slocie miasta.
 */
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialDistance, cityTerritoryRadius, type CityNode } from './territory';
import { isWaterTerrain } from '../units/setup';

export interface WonderPlacementCity {
  q: number;
  r: number;
  population: number;
  isOutpost?: boolean;
  isFort?: boolean;
}

export interface PickWonderHexInput {
  map: GameMap;
  city: WonderPlacementCity;
  /** Heksy już zajęte przez inne cuda (q,r). */
  occupiedWonderHexes: ReadonlyArray<{ q: number; r: number }>;
  /** Heksy miast — cuda nie stoją na centrum miasta. */
  cityHexes: ReadonlyArray<{ q: number; r: number }>;
}

function hexAt(map: GameMap, q: number, r: number): Hex | undefined {
  return map.hexes[`${q},${r}`];
}

function isLandBuildable(hex: Hex): boolean {
  const t = hex.terenBazowy;
  return !isWaterTerrain(t) && t !== TerenBazowy.Gory;
}

function isOccupied(
  q: number,
  r: number,
  wonders: ReadonlyArray<{ q: number; r: number }>,
  cityHexes: ReadonlyArray<{ q: number; r: number }>,
): boolean {
  for (const w of wonders) {
    if (w.q === q && w.r === r) return true;
  }
  for (const c of cityHexes) {
    if (c.q === q && c.r === r) return true;
  }
  return false;
}

/** Wszystkie wolne heksy lądowe w terytorium jednego miasta (pod wybór gracza / AI). */
export function listQualifyingWonderHexesForCity(
  input: PickWonderHexInput,
): Array<{ q: number; r: number }> {
  const { map, city, occupiedWonderHexes, cityHexes } = input;
  const node: CityNode = {
    q: city.q,
    r: city.r,
    pop: city.population,
    isOutpost: city.isOutpost,
    isFort: city.isFort,
    level: 1,
  };
  const radius = cityTerritoryRadius(node);
  const candidates: Array<{ q: number; r: number; dist: number }> = [];

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const dist = axialDistance(q, r, city.q, city.r);
    if (dist > radius || dist === 0) continue;
    if (!isLandBuildable(hex)) continue;
    if (isOccupied(q, r, occupiedWonderHexes, cityHexes)) continue;
    candidates.push({ q, r, dist });
  }

  candidates.sort((a, b) => a.dist - b.dist || a.q - b.q || a.r - b.r);
  return candidates.map(c => ({ q: c.q, r: c.r }));
}

export interface WonderMapPlacementInput {
  map: GameMap;
  playerCities: WonderPlacementCity[];
  occupiedWonderHexes: ReadonlyArray<{ q: number; r: number }>;
  /** Heksy z cudami w budowie (nieukończone). */
  buildingWonderHexes: ReadonlyArray<{ q: number; r: number }>;
  cityHexes: ReadonlyArray<{ q: number; r: number }>;
}

/** Suma kwalifikujących heksów we wszystkich terytoriach gracza (deduplikacja). */
export function listQualifyingWonderHexesForOwner(
  input: WonderMapPlacementInput,
): Array<{ q: number; r: number }> {
  const occupied = [...input.occupiedWonderHexes, ...input.buildingWonderHexes];
  const seen = new Map<string, { q: number; r: number }>();
  for (const city of input.playerCities) {
    const hexes = listQualifyingWonderHexesForCity({
      map: input.map,
      city,
      occupiedWonderHexes: occupied,
      cityHexes: input.cityHexes,
    });
    for (const h of hexes) {
      seen.set(`${h.q},${h.r}`, h);
    }
  }
  return [...seen.values()];
}

/**
 * Wybiera heks w terytorium miasta budującego cud.
 * Preferuje najbliższe wolne pole lądowe (dist 1, potem 2…).
 */
export function pickWonderHexForCity(input: PickWonderHexInput): { q: number; r: number } | null {
  const candidates = listQualifyingWonderHexesForCity(input);
  return candidates[0] ?? null;
}
