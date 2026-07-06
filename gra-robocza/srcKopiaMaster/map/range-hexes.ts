/**
 * range-hexes.ts — heksy zasięgu kultury i religii (logika MAPA, bez Three.js).
 */
import type { GameMap } from '../types/map';
import { axialDistance, cityTerritoryRadius, type CityNode } from './territory';
import { citySightRadius } from '../game/okolica';
import {
  dominantReligion,
  type ReligionParams,
  type ReligionState,
} from '../game/culture-religion';

export interface RangeCityInput {
  id: string;
  q: number;
  r: number;
  ownerId: number;
  population: number;
  kultura: number;
  isOutpost?: boolean;
  isFort?: boolean;
}

/** Zasięg kultury imperium: ∪ heksów w promieniu okolica + pierścienie kultury. */
export function collectCultureRangeHexKeys(
  map: GameMap,
  cities: RangeCityInput[],
  ownerId = 0,
): Set<string> {
  const out = new Set<string>();
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    const sight = citySightRadius(c.population, c.kultura);
    if (sight <= 0) continue;
    for (const key of Object.keys(map.hexes)) {
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
      if (axialDistance(q, r, c.q, c.r) <= sight) out.add(key);
    }
  }
  return out;
}

/** Zasięg religii państwa: terytorium miast gracza + promień szerzenia wiary. */
export function collectReligionRangeHexKeys(
  map: GameMap,
  cities: RangeCityInput[],
  cityRelig: Map<string, ReligionState>,
  stateReligion: string | null,
  params: ReligionParams,
  ownerId = 0,
): Set<string> {
  const out = new Set<string>();
  const spreadExtra = Math.max(0, Math.floor(params.szerzenieMaxDystans ?? 0));
  const state = stateReligion?.trim() || null;

  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    const rel = cityRelig.get(c.id) ?? { counts: {} };
    const dom = dominantReligion(rel, params);
    const hasState = !!(state && (rel.counts[state] ?? 0) > 0);
    const isDom = !!(state && dom.religion === state && dom.status === 'dominant');
    if (state && !hasState && !isDom && Object.keys(rel.counts).length > 0) continue;

    const node: CityNode = {
      q: c.q,
      r: c.r,
      pop: c.population,
      level: 1,
      isOutpost: c.isOutpost,
      isFort: c.isFort,
    };
    const rangeR = cityTerritoryRadius(node) + spreadExtra;
    if (rangeR <= 0) continue;

    for (const key of Object.keys(map.hexes)) {
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
      if (axialDistance(q, r, c.q, c.r) <= rangeR) out.add(key);
    }
  }
  return out;
}
