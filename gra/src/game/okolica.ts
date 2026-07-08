/**
 * okolica.ts
 * Wybor obrabianych pol miasta -- czysta logika (bez DOM/THREE/I/O).
 * Automat (styl Civ VII): miasto o populacji N obrabia N NAJLEPSZYCH pol w
 * promieniu okolicy wokol centrum, rankowanych po wyniku plonow.
 * Plony pola sa WSTRZYKIWANE (yieldOf) -- ten modul robi tylko WYBOR.
 *
 * MODEL ZASIĘGU (Maciej 2026-06-27):
 *   cityRangeForPopulation(pop) = max(minStart, min(pop, cap))
 *   minStart = zasieg_okolicy_baza (default 5), cap = zasieg_okolicy_max (default 15).
 *   Przykład: pop 1->5, pop 9->9, pop 15->15, pop 20->15 (cap), 0->0.
 */
import type { GameMap } from '../types/map';
import { Nakladka } from '../types/hex';
import { hexDistance } from '../units/setup';
import { tileYield } from './economy';
import { normalizeImprovementKey } from './terrain-improvements';
import miastoParams from '../../data/miasto-params.json';
import { cityBorderRadius } from './culture-religion';
import type { City, OkolicaFocus, OkolicaTryb } from './cities';
import { DEFAULT_OKOLICA_FOCUS, DEFAULT_OKOLICA_TRYB } from './cities';

export const OKOLICA_RADIUS = (miastoParams.zasieg_okolicy_miasta?.wartosc as number) ?? 5;

/** Minimalny promień okolicy (start miasta). */
export const CITY_RANGE_MIN = (miastoParams.zasieg_okolicy_baza?.wartosc as number) ?? 5;

/** Cap promienia okolicy / terytorium. */
export const CITY_RANGE_CAP = (miastoParams.zasieg_okolicy_max?.wartosc as number) ?? 15;

/**
 * Promień okolicy miasta: start minStart (5), rośnie 1:1 z pop, cap 15.
 * pop 0 -> 0 (brak miasta / wyjątek).
 */
export function cityRangeForPopulation(population: number): number {
  const pop = Number.isFinite(population) ? Math.floor(population) : 0;
  if (pop <= 0) return 0;
  return Math.min(Math.max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP);
}

/**
 * Zasięg widzenia mgły z miasta (B-zasieg-miasta-fog): okolica + pierścienie kultury.
 * SILNIK: computeVisibleAt(q, r, map, citySightRadius(pop, kultura)).
 */
export function citySightRadius(population: number, kulturaSkumulowana = 0): number {
  const base = cityRangeForPopulation(population);
  if (base <= 0) return 0;
  return base + cityBorderRadius(kulturaSkumulowana);
}

/**
 * D1: lokalna enumeracja heksów w promieniu `rad` (bez skanu całej mapy) — O(rad²).
 * Zwraca klucze istniejących heksów w dysku hex wokół (cq,cr); równoważne filtrowi hexDistance<=rad.
 */
export function hexKeysWithinRadius(cq: number, cr: number, rad: number, map: GameMap): string[] {
  const out: string[] = [];
  const r = Number.isFinite(rad) && rad > 0 ? Math.floor(rad) : 0;
  for (let dq = -r; dq <= r; dq++) {
    const lo = Math.max(-r, -dq - r), hi = Math.min(r, -dq + r);
    for (let dr = lo; dr <= hi; dr++) {
      const key = `${cq + dq},${cr + dr}`;
      if (map.hexes[key]) out.push(key);
    }
  }
  return out;
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
  for (const key of hexKeysWithinRadius(centerQ, centerR, rad, map)) {
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

/** Wagi rankingu pól wg profilu skupienia (B1.4 #4C). */
export function wagiForFocus(focus: OkolicaFocus = DEFAULT_OKOLICA_FOCUS): {
  zywnosc: number;
  praca: number;
  handel: number;
} {
  switch (focus) {
    case 'zywnosc':    return { zywnosc: 3, praca: 0.5, handel: 0.5 };
    case 'produkcja':  return { zywnosc: 0.5, praca: 3, handel: 0.5 };
    case 'podatki':    return { zywnosc: 0.5, praca: 0.5, handel: 3 };
    case 'zrownowazone':
    default:           return { zywnosc: 1, praca: 1, handel: 1 };
  }
}

export interface ResolveWorkedTilesOpts {
  focus?: OkolicaFocus;
  tryb?: OkolicaTryb;
  reczne?: Record<string, number>;
  radius?: number;
  isWorkable?: (q: number, r: number) => boolean;
}

/** Auto lub ręczne przypisanie pól — jedno źródło prawdy dla ekonomii i UI. */
export function resolveWorkedTiles(
  city: Pick<City, 'q' | 'r' | 'population' | 'okolicaFocus' | 'okolicaTryb' | 'okolicaReczne'>,
  map: GameMap,
  yieldOf: (q: number, r: number) => TileYield,
  opts: ResolveWorkedTilesOpts = {},
): OkolicaTile[] {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const radius = opts.radius ?? cityRangeForPopulation(pop);
  const tryb = opts.tryb ?? city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;
  const focus = opts.focus ?? city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const isWorkable = opts.isWorkable;

  if (tryb === 'reczny') {
    const reczne = opts.reczne ?? city.okolicaReczne ?? {};
    const tiles = okolicaTiles(city.q, city.r, radius, map, isWorkable);
    const tileMap = new Map(tiles.map(t => [t.key, t]));
    const out: OkolicaTile[] = [];
    for (const [key, count] of Object.entries(reczne)) {
      if (!count || count <= 0) continue;
      const t = tileMap.get(key);
      if (t) out.push(t);
    }
    if (out.length > pop) return out.slice(0, pop);
    return out;
  }

  return assignWorkedTiles(city.q, city.r, pop, map, yieldOf, {
    radius,
    isWorkable,
    wagi: wagiForFocus(focus),
  });
}

/** Plony heksu do rankingu auto (spójne z turn-economy / cityPanel). */
export function yieldOfMapHex(map: GameMap, q: number, r: number): TileYield {
  const h = map.hexes[`${q},${r}`];
  if (!h) return {};
  const y = tileYield({
    terenBazowy: h.terenBazowy,
    nakladka: h.nakladka ?? Nakladka.Brak,
    maRzeke: !!(h.rzeka && h.rzeka.obecna),
    ulepszenieKey: normalizeImprovementKey(String(h.ulepszenie ?? 'brak')),
  });
  return { zywnosc: y.zywnosc, praca: y.praca, handel: y.handel };
}

/** Pierwsze wejście w tryb ręczny — kopia bieżącego auto-przydziału (nie reset do 1 pola). */
export function seedReczneFromAuto(
  city: Pick<City, 'q' | 'r' | 'population' | 'okolicaFocus'>,
  map: GameMap,
): Record<string, number> {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return {};
  const radius = cityRangeForPopulation(pop);
  const focus = city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const tiles = assignWorkedTiles(city.q, city.r, pop, map, (q, r) => yieldOfMapHex(map, q, r), {
    radius,
    wagi: wagiForFocus(focus),
  });
  const reczne: Record<string, number> = {};
  for (const t of tiles) reczne[t.key] = 1;
  return reczne;
}

function countAssignedWorkers(reczne: Record<string, number>): number {
  return Object.values(reczne).filter(n => n > 0).length;
}

/** Deterministyczny „los” — stabilny w testach, różny per miasto/turę. */
function pickDeterministicIndex(seed: number, length: number): number {
  if (length <= 0) return 0;
  return ((seed % length) + length) % length;
}

/**
 * Po wzroście/spadku populacji — uzupełnij lub zdejmij 👤 na polach okolicy.
 * Auto: resolveWorkedTiles i tak liczy N pól co turę (bez zapisu reczne).
 * Ręczny: nowy mieszkaniec → losowe wolne pole w zasięgu; spadek → zdejmij ze słabszych pól.
 */
export function rebalanceWorkersAfterPopulationChange(
  city: City,
  map: GameMap,
  popBefore: number,
  popAfter: number,
): void {
  const tryb = city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;
  const pop = Math.max(0, Math.floor(popAfter));
  if (popBefore === popAfter) return;

  if (tryb !== 'reczny') {
    return;
  }

  const radius = cityRangeForPopulation(pop);
  const focus = city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const wagi = wagiForFocus(focus);
  const tiles = okolicaTiles(city.q, city.r, radius, map);
  const yieldOf = (q: number, r: number) => yieldOfMapHex(map, q, r);

  let reczne: Record<string, number> = { ...(city.okolicaReczne ?? {}) };

  if (popAfter > popBefore) {
    if (countAssignedWorkers(reczne) === 0 && pop > 0) {
      city.okolicaReczne = seedReczneFromAuto({ ...city, population: pop }, map);
      return;
    }
    let need = pop - countAssignedWorkers(reczne);
    let salt = 0;
    while (need > 0) {
      const free = tiles.filter(t => (reczne[t.key] ?? 0) < 1);
      if (free.length === 0) break;
      const idx = pickDeterministicIndex(city.q * 997 + city.r * 991 + pop * 17 + salt, free.length);
      reczne[free[idx]!.key] = 1;
      need--;
      salt++;
    }
    city.okolicaReczne = reczne;
    return;
  }

  if (popAfter < popBefore) {
    let excess = countAssignedWorkers(reczne) - pop;
    while (excess > 0) {
      const keys = Object.keys(reczne).filter(k => (reczne[k] ?? 0) > 0);
      if (keys.length === 0) break;
      let worstKey: string | null = null;
      let worstScore = Infinity;
      let worstDist = -1;
      for (const key of keys) {
        const t = tiles.find(x => x.key === key);
        if (!t) {
          delete reczne[key];
          excess--;
          continue;
        }
        const s = tileScore(yieldOf(t.q, t.r), wagi);
        if (s < worstScore || (s === worstScore && t.dist > worstDist)) {
          worstScore = s;
          worstDist = t.dist;
          worstKey = key;
        }
      }
      if (worstKey) delete reczne[worstKey];
      excess--;
    }
    city.okolicaReczne = reczne;
  }
}

/** Walidowany delta 👤 na heksie (SILNIK/UI woła przy kliku). */
export function adjustTileWorker(
  city: Pick<City, 'population' | 'okolicaReczne' | 'okolicaTryb' | 'okolicaFocus' | 'q' | 'r'>,
  map: GameMap,
  q: number,
  r: number,
  delta: 1 | -1,
  radius?: number,
): { ok: boolean; reczne: Record<string, number>; reason?: string } {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const rad = radius ?? cityRangeForPopulation(pop);
  const key = `${q},${r}`;
  let reczne = { ...(city.okolicaReczne ?? {}) };
  if ((city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB) !== 'reczny') {
    reczne = seedReczneFromAuto(city, map);
  }
  const current = reczne[key] ?? 0;
  const assigned = Object.values(reczne).reduce((s, n) => s + (n > 0 ? 1 : 0), 0);

  if (delta === 1) {
    if (current >= 1) {
      delete reczne[key];
      return { ok: true, reczne };
    }
    if (assigned >= pop) return { ok: false, reczne, reason: 'limit_populacji' };
    const tiles = okolicaTiles(city.q, city.r, rad, map);
    if (!tiles.some(t => t.key === key)) return { ok: false, reczne, reason: 'poza_zasiegiem' };
    reczne[key] = 1;
    return { ok: true, reczne };
  }

  if (current <= 0) return { ok: false, reczne, reason: 'brak_robotnika' };
  delete reczne[key];
  return { ok: true, reczne };
}

/** Max 👤 na heksach okolicy (bez centrum). Centrum = osobno, zawsze aktywne. */
export function surroundingWorkerCap(population: number): number {
  return Math.max(0, Math.floor(population ?? 0));
}

/**
 * Toggle 👤 na heksie (UI / mapa 3D):
 *   - klik na zajęty heks → zabierz 👤
 *   - klik na wolny heks, wolne sloty → dodaj 👤
 *   - klik na wolny heks, pełna pula → odmowa (najpierw zabierz z innego pola)
 * Centrum miasta (q,r miasta) jest zawsze odrzucane.
 * Pula = population (N 👤 obok); centrum daje plony bez 👤 (Maciej B1 / 4C).
 */
export function toggleTileWorker(
  city: Pick<City, 'population' | 'okolicaReczne' | 'okolicaTryb' | 'okolicaFocus' | 'q' | 'r'>,
  map: GameMap,
  q: number,
  r: number,
  radius?: number,
): { ok: boolean; reczne: Record<string, number>; reason?: string } {
  const pop = surroundingWorkerCap(city.population);
  if (pop <= 0) return { ok: false, reczne: {}, reason: 'brak_ludnosci' };
  if (q === city.q && r === city.r) return { ok: false, reczne: city.okolicaReczne ?? {}, reason: 'centrum_miasta' };

  const rad = radius ?? cityRangeForPopulation(Math.max(1, pop));
  const key = `${q},${r}`;
  let reczne = { ...(city.okolicaReczne ?? {}) };
  const tryb = city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;

  if (tryb !== 'reczny') {
    const autoReczne = seedReczneFromAuto(city, map);
    if ((autoReczne[key] ?? 0) >= 1) {
      reczne = autoReczne;
    } else {
      // Klik wolne pole z auto: nie kopiuj auto na innych heksach — gracz wybiera to pole.
      reczne = {};
    }
  }

  const inRange = okolicaTiles(city.q, city.r, rad, map).some(t => t.key === key);
  if (!inRange) return { ok: false, reczne, reason: 'poza_zasiegiem' };

  const current = reczne[key] ?? 0;
  if (current >= 1) {
    delete reczne[key];
    return { ok: true, reczne };
  }

  const assigned = Object.values(reczne).reduce((s, n) => s + (n > 0 ? 1 : 0), 0);
  if (assigned < pop) {
    reczne[key] = 1;
    return { ok: true, reczne };
  }

  return { ok: false, reczne, reason: 'limit_populacji' };
}

/** Wszystkie heksy z przypisanym 👤 dla miast danego ownerId (E-WORKER-1=A: ownerId 0). */
export function collectWorkedHexKeysForOwner(
  cities: Array<Pick<City, 'q' | 'r' | 'population' | 'okolicaFocus' | 'okolicaTryb' | 'okolicaReczne' | 'ownerId'>>,
  map: GameMap,
  ownerId: number,
  opts: { isWorkable?: (q: number, r: number) => boolean } = {},
): Set<string> {
  const keys = new Set<string>();
  const yieldOf = (q: number, r: number) => yieldOfMapHex(map, q, r);
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    const worked = resolveWorkedTiles(city, map, yieldOf, { isWorkable: opts.isWorkable });
    for (const t of worked) keys.add(t.key);
  }
  return keys;
}
