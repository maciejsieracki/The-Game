/**
 * wonder-placement.ts — wybór heksa na cud świata w terytorium miasta (MAPA).
 * Kanon: budowa na hexie terytorium, nie w slocie miasta.
 */
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialDistance, cityTerritoryRadius, type CityNode } from './territory';

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
  return t !== TerenBazowy.Morze
    && t !== TerenBazowy.Gory
    && t !== TerenBazowy.Wybrzeze;
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

/**
 * Wybiera heks w terytorium miasta budującego cud.
 * Preferuje najbliższe wolne pole lądowe (dist 1, potem 2…).
 */
export function pickWonderHexForCity(input: PickWonderHexInput): { q: number; r: number } | null {
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
  const best = candidates[0];
  return best ? { q: best.q, r: best.r } : null;
}
