/**
 * range-hexes.ts — heksy zasięgu kultury i religii (logika MAPA, bez Three.js).
 */
import type { GameMap } from '../types/map';
import { axialDistance, cityTerritoryRadius, territoryOwnerAt, territoryOwnerLookup, type CityNode, type TerritoryNode } from './territory';
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

/**
 * Heksy terytorium państw (territoryOwnerAt) pogrupowane po ownerId.
 * Opcjonalny filterHex — np. mgła: gracz zawsze, AI tylko visible/explored.
 */
export function collectTerritoryHexKeysByOwner(
  map: GameMap,
  territoryNodes: readonly TerritoryNode[],
  filterHex?: (key: string, ownerId: number) => boolean,
): Map<number, Set<string>> {
  const byOwner = new Map<number, Set<string>>();
  // R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R6): ta sama pętla co dawniej (klucze w kolejności Object.keys, ta sama reguła
  // własności `territoryOwnerAt`), ale współrzędne heksów są rozbierane z kluczy RAZ na obiekt `map.hexes`, a właściciel
  // czytany z indeksu (territoryOwnerLookup) zamiast pętli po wszystkich węzłach dla każdego heksu.
  const parsed = parsedHexKeysOf(map);
  const ownerAt = territoryOwnerLookup(territoryNodes);
  const { keys, qs, rs } = parsed;
  for (let i = 0; i < keys.length; i++) {
    const owner = ownerAt(qs[i]!, rs[i]!);
    if (owner == null) continue;
    const key = keys[i]!;
    if (filterHex && !filterHex(key, owner)) continue;
    let set = byOwner.get(owner);
    if (!set) {
      set = new Set<string>();
      byOwner.set(owner, set);
    }
    set.add(key);
  }
  return byOwner;
}

interface ParsedHexKeys { keys: string[]; qs: number[]; rs: number[]; }
const parsedHexKeysCache = new WeakMap<object, ParsedHexKeys>();
/**
 * Klucze heksów (kolejność Object.keys) z rozebranymi współrzędnymi; pomija klucze nieliczbowe jak dawna pętla.
 * Zbiór kluczy mapy jest po wygenerowaniu/wczytaniu stały (patrz okolica.ts: hexKeysWithinRadius), a pamięć jest
 * kluczowana tożsamością obiektu `map.hexes`.
 */
function parsedHexKeysOf(map: GameMap): ParsedHexKeys {
  let p = parsedHexKeysCache.get(map.hexes);
  if (!p) {
    p = { keys: [], qs: [], rs: [] };
    for (const key of Object.keys(map.hexes)) {
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
      p.keys.push(key); p.qs.push(q); p.rs.push(r);
    }
    parsedHexKeysCache.set(map.hexes, p);
  }
  return p;
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
