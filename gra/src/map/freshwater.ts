/**
 * freshwater.ts — R-WEB-FRESHWATER-ACCESS-LAKE-Q1 (decyzja właściciela 2026-11-02).
 *
 * „Dostęp do wody” = WYŁĄCZNIE słodka woda na lądzie: RZEKA albo JEZIORO.
 * Morze / ocean NIE liczą się nigdy.
 *
 * JEZIORO = heks wodny (Morze / PlytkieMorze), który NIE jest połączony wodą (przez sąsiedztwo
 * heksów wodnych) z żadnym heksem wodnym przy krawędzi mapy. Ocean = składowa wody dotykająca
 * krawędzi mapy (heks wodny, który ma sąsiada poza siatką). Gdy żadna woda nie dotyka krawędzi (ląd na całym
 * obwodzie), oceanem jest największa składowa wody; mniejsze zamknięte składowe pozostają jeziorami. Generator nie ma osobnego terenu
 * „jezioro” — jezioro to zwykłe Morze/PlytkieMorze zamknięte w lądzie (gen-helpers.ts: „zamknięte
 * jezioro-morze”, „morze otoczone lądem = jezioro/zatoka”), więc rozpoznajemy je topologią.
 *
 * Moduł jest czysty (bez DOM, bez importu z `game/`), cache per referencja (WeakMap, D6 — Super Huge).
 */
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];

const EMPTY_SET: ReadonlySet<string> = new Set<string>();

/** D6: zbiór heksów leżących na ścieżkach rzek, per referencja `riverPaths` (auto-inwalidacja przy nowej tablicy). */
const __riverHexSetCache = new WeakMap<object, Set<string>>();

/** D6: zbiór heksów jeziora, per referencja `map.hexes` (nowa mapa = nowy wpis). */
const __lakeHexSetCache = new WeakMap<object, ReadonlySet<string>>();

/** Zbiór kluczy „q,r” heksów leżących na ścieżkach rzek (`map.riverPaths`). Pusty, gdy brak rzek. */
export function getRiverPathHexSet(map: Pick<GameMap, 'riverPaths'>): ReadonlySet<string> {
  const paths = map.riverPaths;
  if (!paths || paths.length === 0) return EMPTY_SET;
  let s = __riverHexSetCache.get(paths as object);
  if (!s) {
    s = new Set<string>();
    for (const path of paths) {
      for (const h of path) s.add(`${h.q},${h.r}`);
    }
    __riverHexSetCache.set(paths as object, s);
  }
  return s;
}

function isWaterHex(terenBazowy: TerenBazowy | undefined): boolean {
  return terenBazowy === TerenBazowy.Morze || terenBazowy === TerenBazowy.PlytkieMorze;
}

/**
 * Zbiór kluczy „q,r” heksów JEZIORA: woda niepołączona z oceanem przy krawędzi mapy.
 * Liczone raz per `map.hexes`. Gdy test mutuje teren w miejscu, wołaj `invalidateFreshwaterCache`.
 */
export function getLakeHexSet(map: Pick<GameMap, 'hexes'>): ReadonlySet<string> {
  const cached = __lakeHexSetCache.get(map.hexes as object);
  if (cached) return cached;

  const hexes = map.hexes;
  const water = new Set<string>();
  for (const key in hexes) {
    if (isWaterHex(hexes[key]?.terenBazowy)) water.add(key);
  }

  // Ocean: flood od heksów wodnych leżących przy krawędzi mapy (brak któregoś z 6 sąsiadów w siatce).
  const ocean = new Set<string>();
  const stack: string[] = [];
  for (const key of water) {
    const [q, r] = key.split(',').map(Number) as [number, number];
    for (const [dq, dr] of NEIGHBORS) {
      if (hexes[`${q + dq},${r + dr}`] === undefined) { ocean.add(key); stack.push(key); break; }
    }
  }
  while (stack.length > 0) {
    const key = stack.pop() as string;
    const [q, r] = key.split(',').map(Number) as [number, number];
    for (const [dq, dr] of NEIGHBORS) {
      const nk = `${q + dq},${r + dr}`;
      if (water.has(nk) && !ocean.has(nk)) { ocean.add(nk); stack.push(nk); }
    }
  }

  // Zabezpieczenie (zarzut Evaluatora R1 #3): mapa z lądem na CAŁYM obwodzie (albo wczytana z zapisu bez
  // wody przy krawędzi) nie ma składowej dotykającej krawędzi → bez tego CAŁY ocean byłby „jeziorem”.
  // Wtedy za ocean uznajemy NAJWIĘKSZĄ składową wody; mniejsze zamknięte składowe zostają jeziorami.
  if (ocean.size === 0 && water.size > 0) {
    const seen = new Set<string>();
    let largest: string[] = [];
    for (const start of water) {
      if (seen.has(start)) continue;
      const comp: string[] = [start];
      seen.add(start);
      for (let i = 0; i < comp.length; i++) {
        const [q, r] = (comp[i] as string).split(',').map(Number) as [number, number];
        for (const [dq, dr] of NEIGHBORS) {
          const nk = `${q + dq},${r + dr}`;
          if (water.has(nk) && !seen.has(nk)) { seen.add(nk); comp.push(nk); }
        }
      }
      if (comp.length > largest.length) largest = comp;
    }
    for (const key of largest) ocean.add(key);
  }
  const lake = new Set<string>();
  for (const key of water) if (!ocean.has(key)) lake.add(key);
  const result: ReadonlySet<string> = lake.size === 0 ? EMPTY_SET : lake;
  __lakeHexSetCache.set(hexes as object, result);
  return result;
}

/** Czy heks (q,r) jest heksem jeziora (woda zamknięta w lądzie)? Morze/ocean → false. */
export function isLakeHex(map: Pick<GameMap, 'hexes'>, q: number, r: number): boolean {
  return getLakeHexSet(map).has(`${q},${r}`);
}

/** Czy heks (q,r) leży NA heksie jeziora albo SĄSIADUJE z heksem jeziora? */
export function isLakeAdjacent(map: Pick<GameMap, 'hexes'>, q: number, r: number): boolean {
  const lake = getLakeHexSet(map);
  if (lake.size === 0) return false;
  if (lake.has(`${q},${r}`)) return true;
  for (const [dq, dr] of NEIGHBORS) {
    if (lake.has(`${q + dq},${r + dr}`)) return true;
  }
  return false;
}

/** Samo RZEKA wg dotychczasowej definicji zdrowia (D17-A): `rzeka.obecna` na heksie LUB `riverPaths` na heksie/sąsiedzie. */
export function hasRiverWaterAccess(map: Pick<GameMap, 'hexes' | 'riverPaths'>, q: number, r: number): boolean {
  if (map.hexes[`${q},${r}`]?.rzeka?.obecna) return true;
  const riverHexSet = getRiverPathHexSet(map);
  if (riverHexSet.size === 0) return false;
  if (riverHexSet.has(`${q},${r}`)) return true;
  for (const [dq, dr] of NEIGHBORS) {
    if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;
  }
  return false;
}

/**
 * DOSTĘP DO SŁODKIEJ WODY (jedna definicja dla gry): rzeka na heksie/sąsiedzie LUB jezioro na
 * heksie/sąsiedzie. Morze/ocean → NIE (ujście rzeki do morza daje TAK wyłącznie przez rzekę).
 * Dla map bez jezior wynik jest IDENTYCZNY z dawnym `cityHasWaterAccess` (rzeka-only).
 */
export function hasFreshwaterAccess(
  pos: { q: number; r: number },
  map: Pick<GameMap, 'hexes' | 'riverPaths'>,
): boolean {
  return hasRiverWaterAccess(map, pos.q, pos.r) || isLakeAdjacent(map, pos.q, pos.r);
}

/**
 * REZERWACJA POD ŻYWNOŚĆ (decyzja właściciela 2026-11-02: „wszystkie miejsca przy rzece i na rzece są
 * przeznaczone na żywność”): heks NA słodkiej wodzie lub z nią sąsiadujący — rzeka (`riverPaths`, własne
 * `rzeka.obecna` na heksie LUB na sąsiedzie) albo jezioro (ZAŁOŻENIE do akceptacji: jezioro jak rzeka).
 * Szersza niż `hasFreshwaterAccess` o sąsiada z samym `rzeka.obecna` (rzeka widoczna na mapie bez wpisu
 * w `riverPaths`) — świadomie, bo zdrowie ma pozostać bajt-w-bajt jak przed zmianą.
 */
export function isFreshwaterReservedHex(
  map: Pick<GameMap, 'hexes' | 'riverPaths'>,
  q: number,
  r: number,
): boolean {
  if (hasFreshwaterAccess({ q, r }, map)) return true;
  for (const [dq, dr] of NEIGHBORS) {
    if (map.hexes[`${q + dq},${r + dr}`]?.rzeka?.obecna === true) return true;
  }
  return false;
}

/** Testy / fixtures mutujące teren w miejscu: unieważnia cache jezior dla tej mapy. */
export function invalidateFreshwaterCache(map: Pick<GameMap, 'hexes'>): void {
  __lakeHexSetCache.delete(map.hexes as object);
}
