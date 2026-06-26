/**
 * okolica.ts
 * Wybor obrabianych pol miasta -- czysta logika (bez DOM/THREE/I/O).
 * Automat (styl Civ VII): miasto o populacji N obrabia N NAJLEPSZYCH pol w
 * promieniu okolicy wokol centrum, rankowanych po wyniku plonow.
 * Plony pola sa WSTRZYKIWANE (yieldOf) -- ten modul robi tylko WYBOR.
 *
 * MODEL ZASIĘGU (2026-06-25, decyzja Naster):
 *   cityRangeForPopulation(pop) = min(pop, cap)
 *   gdzie cap = zasieg_okolicy_max z miasto-params.json (default 15).
 *   Zastępuje stary schodkowy (pop<5->5 / >=5->10 / >=10->15).
 */
import type { GameMap } from '../types/map';
import { hexDistance } from '../units/setup';
import miastoParams from '../../data/miasto-params.json';

export const OKOLICA_RADIUS = (miastoParams.zasieg_okolicy_miasta?.wartosc as number) ?? 5;

/**
 * Promien okolicy miasta = populacja (liniowo), ograniczony do cap.
 * cap = zasieg_okolicy_max z miasto-params.json (default 15).
 * Przyklad: pop 5->5, 10->10, 15->15, 20->15 (cap), 0->0.
 * Tunowalne: zmien zasieg_okolicy_max w miasto-params.json.
 *
 * Legacy pola zasieg_okolicy_baza / zasieg_okolicy_pop5 / zasieg_okolicy_pop10
 * zostają w miasto-params.json jako readonly (nie są tu czytane).
 */
export function cityRangeForPopulation(population: number): number {
  const pop = Number.isFinite(population) ? Math.floor(population) : 0;
  const cap = (miastoParams.zasieg_okolicy_max?.wartosc as number) ?? 15;
  return Math.min(Math.max(0, pop), Math.max(0, cap));
}


export interface TileYield { zywnosc?: number; praca?: number; handel?: number; }
export interface OkolicaTile { q: number; r: number; key: string; dist: number; }

/** Pola w promieniu `radius` (hexDistance <= radius) od centrum, istniejace w mapie, bez centrum. */
export function okolicaTiles(
  centerQ: number,
  centerR: number,
  radius: number,
  map: GameMap,
  isWorkable?: (q: number, r: number) => boolean,
): OkolicaTile[] {
  const out: OkolicaTile[] = [];
  const rad = Number.isFinite(radius) && radius > 0 ? Math.floor(radius) : 1;
  for (const key of Object.keys(map.hexes)) {
    const parts = key.split(',');
    const q = Number(parts[0]);
    const rr = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(rr)) continue;
    if (q === centerQ && rr === centerR) continue;
    const d = hexDistance(centerQ, centerR, q, rr);
    if (d > rad) continue;
    if (isWorkable && !isWorkable(q, rr)) continue;
    out.push({ q, r: rr, key, dist: d });
  }
  return out;
}

/** Domyslny wynik pola = wazona suma plonow (domyslnie 1/1/1). */
export function tileScore(y: TileYield, wagi?: { zywnosc?: number; praca?: number; handel?: number }): number {
  const wz = wagi?.zywnosc ?? 1;
  const wp = wagi?.praca ?? 1;
  const wh = wagi?.handel ?? 1;
  return (y.zywnosc ?? 0) * wz + (y.praca ?? 0) * wp + (y.handel ?? 0) * wh;
}

export interface AssignOptions {
  radius?: number;
  isWorkable?: (q: number, r: number) => boolean;
  wagi?: { zywnosc?: number; praca?: number; handel?: number };
}

/**
 * Automat: zwraca `population` NAJLEPSZYCH pol okolicy (score malejaco).
 * Tie-break deterministyczny: wyzszy score; remis -> blizej centrum (dist); remis -> klucz alfabetycznie.
 * Clamp do liczby dostepnych pol; population<=0 -> [].
 */
export function assignWorkedTiles(
  centerQ: number,
  centerR: number,
  population: number,
  map: GameMap,
  yieldOf: (q: number, r: number) => TileYield,
  opts: AssignOptions = {},
): OkolicaTile[] {
  const radius = opts.radius ?? cityRangeForPopulation(population);
  const tiles = okolicaTiles(centerQ, centerR, radius, map, opts.isWorkable);
  const scored = tiles.map(t => ({ t, s: tileScore(yieldOf(t.q, t.r), opts.wagi) }));
  scored.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    if (a.t.dist !== b.t.dist) return a.t.dist - b.t.dist;
    return a.t.key.localeCompare(b.t.key);
  });
  const n = Math.max(0, Math.min(Math.floor(Number.isFinite(population) ? population : 0), scored.length));
  return scored.slice(0, n).map(x => x.t);
}
