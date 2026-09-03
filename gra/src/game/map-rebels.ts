/**
 * map-rebels.ts — buntownicy mapowi od epoki Średniowiecze (ABC 11=C*).
 * Lane CYWILIZACJE · pure · bez DOM.
 *
 * v0.1 (Kamień–Żelazo): moduł gotowy, spawn nieaktywny (max era = 3).
 * SILNIK: woła mapRebelsActive(maxEra) + opcjonalnie trySpawnMapRebel w pętli tury.
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { hexDistance, isWaterTerrain } from '../units/setup';

/** Indeks epoki gracza: Średniowiecze = 4 (Kamień=1, Brąz=2, Żelazo=3). */
export const EPOKA_SREDNIOWIECZE = 4;

/** Buntownicy mapowi zastępują barbarzyńców od tej epoki w górę. */
export function mapRebelsActive(maxPlayerEra: number): boolean {
  return maxPlayerEra >= EPOKA_SREDNIOWIECZE;
}

export interface MapRebelSpawnRequest {
  turn: number;
  maxPlayerEra: number;
  rngSeed: number;
  map: GameMap;
  occupied: ReadonlySet<string>;
  /** Pozycje miast (SILNIK podaje z tablicy cities). */
  cityCoords?: ReadonlyArray<{ q: number; r: number }>;
  minDistFromCity?: number;
}

export interface MapRebelSpawn {
  q: number;
  r: number;
  typeId: string;
}

const DEFAULT_REBEL_UNIT = 'Wojownik';

function lcgNext(state: number): [number, number] {
  const next = (state * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

function isPassableLand(map: GameMap, q: number, r: number): boolean {
  const h = map.hexes[`${q},${r}`];
  if (!h) return false;
  const t = h.terenBazowy as TerenBazowy;
  return !isWaterTerrain(t) && t !== TerenBazowy.Gory;
}

/**
 * Minimalny spawn buntownika mapowego (v1.0 stub).
 * Zwraca pozycję gdy epoka ≥ Średniowiecze; inaczej null.
 * SILNIK tworzy jednostkę z ownerId rebeliantów (society-breakdown).
 */
export function trySpawnMapRebel(req: MapRebelSpawnRequest): MapRebelSpawn | null {
  if (!mapRebelsActive(req.maxPlayerEra)) return null;

  const minDist = req.minDistFromCity ?? 4;
  const cities = req.cityCoords ?? [];
  const candidates: Array<{ q: number; r: number }> = [];

  for (const h of Object.values(req.map.hexes)) {
    const q = h.coords.q;
    const r = h.coords.r;
    const key = `${q},${r}`;
    if (req.occupied.has(key)) continue;
    if (!isPassableLand(req.map, q, r)) continue;
    let ok = true;
    for (const c of cities) {
      if (hexDistance(q, r, c.q, c.r) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) candidates.push({ q, r });
  }

  if (candidates.length === 0) return null;

  let seed = req.rngSeed >>> 0;
  let pick = 0;
  for (let i = 0; i < 3; i++) {
    let f: number;
    [seed, f] = lcgNext(seed);
    pick = Math.floor(f * candidates.length);
  }
  const cell = candidates[pick]!;
  return { q: cell.q, r: cell.r, typeId: DEFAULT_REBEL_UNIT };
}
