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
import { Nakladka, TerenBazowy } from '../types/hex';
import { hexDistance } from '../units/setup';
import { tileYield } from './economy';
import { foodPotentialForHex, improvementKeysForHex } from './terrain-improvements';
import miastoParams from '../../data/miasto-params.json';
import { cityBorderRadius } from './culture-religion';
import type { City, OkolicaFocus, OkolicaTryb } from './cities';
import { DEFAULT_OKOLICA_FOCUS, DEFAULT_OKOLICA_TRYB } from './cities';
import {
  isTerritoryHexOwnedBy,
  makeTerritoryWorkableFilter,
  type TerritoryNode,
} from '../map/territory-work';
export {
  buildTerritoryNodesFromCities,
  reconcileWorkedTilesForOwner,
  reconcileAllWorkedTiles,
  isTerritoryHexOwnedBy,
} from '../map/territory-work';

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


/**
 * Predykat terenu: pole nadaje się do obsadzenia robotnikiem (nie Morze, nie Gory).
 * P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA (2026-08-09): WSPÓLNE źródło prawdy dla
 * overlay renderowania (`main.ts::okolicaHexWorkable` deleguje tutaj), silnika ekonomii
 * (`turn-economy.ts::cityWorkedTilesForEconomy`/`workedHexCoordsForCity`) i wszystkich
 * ścieżek zapisu trybu ręcznego w tym module (`seedReczneFromAuto`,
 * `rebalanceWorkersAfterPopulationChange`, `toggleTileWorker`, `adjustTileWorker`).
 * Brak heksu (poza mapą) -> nieobsadzalne.
 */
export function isLandWorkableHex(map: GameMap, q: number, r: number): boolean {
  const hex = map.hexes[`${q},${r}`];
  if (!hex) return false;
  const t = hex.terenBazowy;
  return t !== TerenBazowy.Morze && t !== TerenBazowy.Gory;
}

/**
 * Zbiór kluczy "q,r" centrów WSZYSTKICH miast (dowolny właściciel) na podstawie
 * węzłów terytorium. Posterunki/forty (`isOutpost`/`isFort`) NIE są centrum miasta —
 * pomijane. `undefined` gdy brak węzłów (żadnej zmiany zachowania bez danych).
 * P-HEKS-CENTRUM-OBCEGO-MIASTA (2026-08-13): jedno źródło prawdy dla BEZWARUNKOWEGO
 * wykluczenia centrum KAŻDEGO miasta z puli pól do obróbki — `territoryNodes` w
 * każdym realnym wywołaniu w tym repo to już pełna lista miast na mapie
 * (`buildAllTerritoryNodes`/`buildTerritoryNodesFromCities` w main.ts/turn-economy.ts
 * zawsze mapują 1:1 z tablicą `cities`), więc nie trzeba osobnego parametru `cities` —
 * to uniknięcie duplikowania punktu wejścia (mniejszy diff, jeden hak zamiast wielu).
 * EN: set of "q,r" keys for EVERY city centre on the map (any owner), derived from
 * territory nodes already threaded everywhere in this codebase — used to
 * unconditionally exclude any city's centre hex from any OTHER city's worked pool.
 */
function cityCenterKeysFromTerritoryNodes(
  territoryNodes: readonly TerritoryNode[] | undefined,
): ReadonlySet<string> | undefined {
  if (!territoryNodes || territoryNodes.length === 0) return undefined;
  const out = new Set<string>();
  for (const n of territoryNodes) {
    if (n.isOutpost || n.isFort) continue;
    out.add(`${n.q},${n.r}`);
  }
  return out.size > 0 ? out : undefined;
}

/**
 * Filtr terenu (Morze/Gory) połączony z opcjonalną własnością terytorium miasta,
 * bezwarunkowym wykluczeniem centrum KAŻDEGO miasta (P-HEKS-CENTRUM-OBCEGO-MIASTA)
 * i opcjonalnym `excludeHexKeys` (P-HEKS-SPOR-SASIAD: heksy przegrane na rzecz bliższego
 * miasta tego samego właściciela — patrz `computeLostToNearerSiblingByCity`).
 */
function terrainAndTerritoryFilter(
  map: GameMap,
  territoryNodes: readonly TerritoryNode[] | undefined,
  ownerId: number,
  excludeHexKeys?: ReadonlySet<string>,
): (q: number, r: number) => boolean {
  const terrainOnly = (q: number, r: number) => isLandWorkableHex(map, q, r);
  const withTerritory = territoryNodes
    ? makeTerritoryWorkableFilter(territoryNodes, ownerId, terrainOnly)
    : terrainOnly;
  const centers = cityCenterKeysFromTerritoryNodes(territoryNodes);
  if (!centers && !excludeHexKeys) return withTerritory;
  return (q, r) => {
    const key = `${q},${r}`;
    if (centers && centers.has(key)) return false;
    if (excludeHexKeys && excludeHexKeys.has(key)) return false;
    return withTerritory(q, r);
  };
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

/** Score pola do rankingu auto-okolicy (plony × wagi + opcjonalny potencjał żywności). */
export function tileAssignScore(
  y: TileYield,
  wagi?: { zywnosc?: number; praca?: number; handel?: number },
  foodPotential = 0,
): number {
  return tileScore(y, wagi) + foodPotential;
}

export interface AssignOptions {
  radius?: number;
  isWorkable?: (q: number, r: number) => boolean;
  wagi?: { zywnosc?: number; praca?: number; handel?: number };
  focus?: OkolicaFocus;
  /** Bonus potencjału żywności (fokus żywność) — dodawany do score przed sortowaniem. */
  potentialOf?: (q: number, r: number) => number;
  /** Gdy podane z ownerId — tylko heksy należące do tego państwa (overlap → najbliższe miasto). */
  territoryNodes?: readonly TerritoryNode[];
  ownerId?: number;
  /**
   * P-HEKS-SPOR-SASIAD (Maciej 2026-08-13): heksy w promieniu TEGO miasta przegrane na rzecz
   * bliższego miasta TEGO SAMEGO właściciela (spór o zwykły, nie-centralny heks —
   * patrz `computeLostToNearerSiblingByCity`). Centrum miasta jest wykluczone osobno,
   * bezwarunkowo, patrz `cityCenterKeysFromTerritoryNodes`.
   */
  excludeHexKeys?: ReadonlySet<string>;
}

type ScoredOkolicaTile = {
  t: OkolicaTile;
  s: number;
  y: TileYield;
  potential: number;
};

function compareScoredOkolicaTiles(a: ScoredOkolicaTile, b: ScoredOkolicaTile, focus?: OkolicaFocus): number {
  if (b.s !== a.s) return b.s - a.s;
  if (focus === 'zywnosc') {
    const az = a.y.zywnosc ?? 0;
    const bz = b.y.zywnosc ?? 0;
    if (bz !== az) return bz - az;
    if (b.potential !== a.potential) return b.potential - a.potential;
  }
  if (a.t.dist !== b.t.dist) return a.t.dist - b.t.dist;
  return a.t.key.localeCompare(b.t.key);
}

function scoreOkolicaTile(
  t: OkolicaTile,
  yieldOf: (q: number, r: number) => TileYield,
  opts: AssignOptions,
): ScoredOkolicaTile {
  const y = yieldOf(t.q, t.r);
  const potential = opts.potentialOf?.(t.q, t.r) ?? 0;
  return { t, s: tileAssignScore(y, opts.wagi, potential), y, potential };
}

/**
 * Potencjał żywności heksu mapy (fokus żywność w auto-okolicy).
 * P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA (2026-08-09): musi czytać WSZYSTKIE
 * warstwy ulepszeń (`hex.ulepszenia`) przez `improvementKeysForHex`, tak jak
 * `yieldOfMapHex` wyżej i silnik (`hexToWorkedTile`) — nie tylko legacy pojedyncze
 * pole `hex.ulepszenie` (ostatnia postawiona warstwa). Inaczej heks z farmą
 * postawioną NA dodatkowej warstwie (np. `['glinianka','farma']`, legacy
 * `hex.ulepszenie` wskazujące na coś innego) dalej dostaje nienależny bonus
 * potencjału, mimo że `FOOD_IMPROVEMENT_KEYS` powinno go wyzerować.
 */
export function foodPotentialOfMapHex(map: GameMap, q: number, r: number): number {
  const h = map.hexes[`${q},${r}`];
  if (!h) return 0;
  const keys = improvementKeysForHex(h);
  return foodPotentialForHex(h.terenBazowy, h.nakladka ?? Nakladka.Brak, keys);
}

function assignOptionsForFocus(
  base: AssignOptions,
  focus: OkolicaFocus,
  map: GameMap,
): AssignOptions {
  if (focus !== 'zywnosc') return base;
  return {
    ...base,
    focus,
    potentialOf: (q, r) => foodPotentialOfMapHex(map, q, r),
  };
}

function effectiveIsWorkable(opts: AssignOptions): ((q: number, r: number) => boolean) | undefined {
  const { territoryNodes, ownerId, isWorkable, excludeHexKeys } = opts;
  let base = isWorkable;
  if (territoryNodes != null && ownerId != null) {
    base = makeTerritoryWorkableFilter(territoryNodes, ownerId, isWorkable);
  }
  // P-HEKS-CENTRUM-OBCEGO-MIASTA: centrum KAŻDEGO miasta jest bezwarunkowo
  // wykluczone, niezależnie od tego, czy ownerId/isWorkable są w ogóle podane —
  // P-HEKS-SPOR-SASIAD: excludeHexKeys (spór o zwykły heks) dokłada się do tego samego hooka.
  const centers = cityCenterKeysFromTerritoryNodes(territoryNodes);
  if (!centers && !excludeHexKeys) return base;
  return (q, r) => {
    const key = `${q},${r}`;
    if (centers && centers.has(key)) return false;
    if (excludeHexKeys && excludeHexKeys.has(key)) return false;
    return base ? base(q, r) : true;
  };
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
  const tiles = okolicaTiles(centerQ, centerR, radius, map, effectiveIsWorkable(opts));
  const scored = tiles.map(t => scoreOkolicaTile(t, yieldOf, opts));
  scored.sort((a, b) => compareScoredOkolicaTiles(a, b, opts.focus));
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
    case 'zywnosc':    return { zywnosc: 10, praca: 0, handel: 0 };
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
  territoryNodes?: readonly TerritoryNode[];
  ownerId?: number;
  /** P-HEKS-SPOR-SASIAD: patrz `AssignOptions.excludeHexKeys` — ten sam kontrakt. */
  excludeHexKeys?: ReadonlySet<string>;
}

/** Auto lub ręczne przypisanie pól — jedno źródło prawdy dla ekonomii i UI. */
export function resolveWorkedTiles(
  city: Pick<City, 'q' | 'r' | 'population' | 'okolicaFocus' | 'okolicaTryb' | 'okolicaReczne' | 'ownerId'>,
  map: GameMap,
  yieldOf: (q: number, r: number) => TileYield,
  opts: ResolveWorkedTilesOpts = {},
): OkolicaTile[] {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const radius = opts.radius ?? cityRangeForPopulation(pop);
  const tryb = opts.tryb ?? city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;
  const focus = opts.focus ?? city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const workFilter = effectiveIsWorkable(opts);

  if (tryb === 'reczny') {
    const reczne = opts.reczne ?? city.okolicaReczne ?? {};
    const tiles = okolicaTiles(city.q, city.r, radius, map, workFilter);
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

  return assignWorkedTiles(city.q, city.r, pop, map, yieldOf, assignOptionsForFocus({
    radius,
    isWorkable: opts.isWorkable,
    territoryNodes: opts.territoryNodes,
    ownerId: opts.ownerId ?? city.ownerId,
    excludeHexKeys: opts.excludeHexKeys,
    wagi: wagiForFocus(focus),
  }, focus, map));
}

/**
 * Plony heksu do rankingu auto (spójne z turn-economy / cityPanel).
 * P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE (2026-08-08/09): musi czytać WSZYSTKIE
 * warstwy ulepszeń (`hex.ulepszenia`), tak jak silnik (`hexToWorkedTile` →
 * `improvementKeysForHex`) — nie tylko legacy pojedyncze pole `hex.ulepszenie`
 * (które trzyma jedynie OSTATNIĄ postawioną warstwę, i to tylko dla części typów
 * ulepszeń — patrz main.ts `improvementKeyToUlepszenie`).
 */
export function yieldOfMapHex(map: GameMap, q: number, r: number): TileYield {
  const h = map.hexes[`${q},${r}`];
  if (!h) return {};
  const ulepszeniaKeys = improvementKeysForHex(h);
  const y = tileYield({
    terenBazowy: h.terenBazowy,
    nakladka: h.nakladka ?? Nakladka.Brak,
    maRzeke: !!(h.rzeka && h.rzeka.obecna),
    zloze: (h as { zloze?: string }).zloze,
    ulepszenieKey: ulepszeniaKeys[0],
    ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : undefined,
  });
  return { zywnosc: y.zywnosc, praca: y.praca, handel: y.handel };
}

/** Pierwsze wejście w tryb ręczny — kopia bieżącego auto-przydziału (nie reset do 1 pola). */
export function seedReczneFromAuto(
  city: Pick<City, 'q' | 'r' | 'population' | 'okolicaFocus' | 'ownerId'>,
  map: GameMap,
  territoryNodes?: readonly TerritoryNode[],
  /** P-HEKS-SPOR-SASIAD: patrz `AssignOptions.excludeHexKeys`. */
  excludeHexKeys?: ReadonlySet<string>,
): Record<string, number> {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return {};
  const radius = cityRangeForPopulation(pop);
  const focus = city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const tiles = assignWorkedTiles(city.q, city.r, pop, map, (q, r) => yieldOfMapHex(map, q, r), assignOptionsForFocus({
    radius,
    territoryNodes,
    ownerId: city.ownerId,
    isWorkable: (q, r) => isLandWorkableHex(map, q, r),
    excludeHexKeys,
    wagi: wagiForFocus(focus),
  }, focus, map));
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
  territoryNodes?: readonly TerritoryNode[],
  /**
   * P-HEKS-SPOR-SASIAD: patrz `AssignOptions.excludeHexKeys`. Nie jest jeszcze wpięte z
   * `population-growth-v85.ts` (poza zakresem tej zmiany — plik nieobjęty listą
   * dozwolonych do edycji) — bez tego wołania rebalans po wzroście populacji
   * dalej może (rzadko) posadzić 👤 na spornym heksie do czasu osobnej naprawy.
   */
  excludeHexKeys?: ReadonlySet<string>,
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
  const workFilter = terrainAndTerritoryFilter(map, territoryNodes, city.ownerId, excludeHexKeys);
  const tiles = okolicaTiles(city.q, city.r, radius, map, workFilter);
  const yieldOf = (q: number, r: number) => yieldOfMapHex(map, q, r);

  let reczne: Record<string, number> = { ...(city.okolicaReczne ?? {}) };

  if (popAfter > popBefore) {
    if (countAssignedWorkers(reczne) === 0 && pop > 0) {
      city.okolicaReczne = seedReczneFromAuto({ ...city, population: pop }, map, territoryNodes, excludeHexKeys);
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
      // B3 (runda 4, Evaluator rundy 3): wpis nielegalny/poza-zasiegiem (np. stary
      // zapis na Gorach/Morzu sprzed filtra terenu, albo pole utracone przy zmianie
      // granic) NIE jest usuwany automatycznie tutaj -- nie liczy sie do produkcji,
      // wiec jest zawsze "najgorszym" kandydatem (score=-Infinity), ale usuwa go
      // WYLACZNIE ponizsza wspolna logika worstKey, dokladnie jeden wpis na iteracje
      // petli while. Dawna wersja usuwala KAZDY nielegalny wpis natychmiast w tym
      // miejscu (bez wzgledu na budzet excess) I DODATKOWO usuwala worstKey na koncu
      // -- przy excess=1 i 2 nielegalnych wpisach kasowala 3 wpisy zamiast 1 (w tym
      // legalny, produkcyjny), czyli cicha auto-naprawa/utrata danych ponad budzet
      // zakazana przez R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1. Teraz znika DOKLADNIE
      // `excess` wpisow niezaleznie od tego czy sa legalne czy nielegalne; nielegalne
      // wpisy ponad budzet excess zostaja w danych nietkniete.
      for (const key of keys) {
        const t = tiles.find(x => x.key === key);
        let s: number;
        let dist: number;
        if (!t) {
          s = -Infinity;
          const parts = key.split(',');
          dist = hexDistance(city.q, city.r, Number(parts[0]), Number(parts[1]));
        } else {
          const potential = focus === 'zywnosc' ? foodPotentialOfMapHex(map, t.q, t.r) : 0;
          s = tileAssignScore(yieldOf(t.q, t.r), wagi, potential);
          dist = t.dist;
        }
        if (s < worstScore || (s === worstScore && dist > worstDist)) {
          worstScore = s;
          worstDist = dist;
          worstKey = key;
        }
      }
      if (worstKey) delete reczne[worstKey];
      excess--;
    }
    city.okolicaReczne = reczne;
  }
}

/**
 * Walidowany delta 👤 na heksie (SILNIK/UI woła przy kliku) — kierunkowy, NIE toggle:
 *   - delta=+1: spróbuj DODAĆ 👤. Pole już obsadzone -> odmowa (`juz_obsadzone`), BEZ
 *     efektu ubocznego zdjęcia; brak wolnych obywateli -> `limit_populacji`; teren/
 *     terytorium -> `poza_zasiegiem`/`obce_terytorium`.
 *   - delta=-1: spróbuj ZDJĄĆ 👤. Pole bez 👤 -> odmowa (`brak_robotnika`), BEZ efektu
 *     ubocznego dodania.
 * Kontrakt (P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA, naprawione): +1 i -1 muszą dawać
 * SYMETRYCZNE odmowy na przeciwnym krańcu stanu (0 lub 1 👤 na pole) — żaden kierunek
 * nie ma prawa wykonać operacji przeciwnej do zażądanej. Toggle (klik zmienia stan
 * w obie strony niezależnie od kierunku) to `toggleTileWorker`, osobna funkcja niżej —
 * to tutaj jest CELOWO inny kontrakt, więc nie kopiuj jej logiki „zdejmij gdy zajęte".
 * EN: directional, NOT a toggle — +1 always tries to add (refuses, no side effect, if
 * already occupied), -1 always tries to remove (refuses, no side effect, if empty).
 * Toggle behavior lives in `toggleTileWorker` only.
 */
export function adjustTileWorker(
  city: Pick<City, 'population' | 'okolicaReczne' | 'okolicaTryb' | 'okolicaFocus' | 'q' | 'r' | 'ownerId'>,
  map: GameMap,
  q: number,
  r: number,
  delta: 1 | -1,
  radius?: number,
  territoryNodes?: readonly TerritoryNode[],
  /** P-HEKS-SPOR-SASIAD: patrz `AssignOptions.excludeHexKeys`. */
  excludeHexKeys?: ReadonlySet<string>,
): { ok: boolean; reczne: Record<string, number>; reason?: string } {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const rad = radius ?? cityRangeForPopulation(pop);
  const key = `${q},${r}`;
  let reczne = { ...(city.okolicaReczne ?? {}) };
  if ((city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB) !== 'reczny') {
    reczne = seedReczneFromAuto(city, map, territoryNodes, excludeHexKeys);
  }
  const current = reczne[key] ?? 0;
  const assigned = Object.values(reczne).reduce((s, n) => s + (n > 0 ? 1 : 0), 0);

  // P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA (naprawione): delta=+1 na JUZ obsadzonym
  // polu to ODMOWA (nie robi nic), NIGDY zdjecie -- zdjecie to wylacznie delta=-1
  // (galaz nizej). Przed naprawa +1 na zajetym polu kopiowalo logike toggle z
  // `toggleTileWorker` ("klik na zajety heks -> zabierz") i po cichu ZDEJMOWALO
  // robotnika, czyli +1 i -1 robily DOKLADNIE to samo na zajetym polu -- kierunek
  // przestawal miec znaczenie, co przeczy wlasnemu kontraktowi funkcji (typ
  // `delta: 1 | -1`). Symetria z galezia -1 nizej (ktora rowniez tylko odmawia,
  // `brak_robotnika`, gdy pole puste, bez efektu ubocznego dodania) byla juz
  // poprawna -- teraz +1 dziala tak samo konsekwentnie.
  // EN: +1 on an already-occupied tile now REFUSES (no-op), mirroring how -1 already
  // refused on an empty tile. Previously +1 silently removed (toggle copy-paste from
  // `toggleTileWorker`), making +1 and -1 behave identically once a tile was occupied.
  if (delta === 1) {
    if (current >= 1) {
      return { ok: false, reczne, reason: 'juz_obsadzone' };
    }
    if (assigned >= pop) return { ok: false, reczne, reason: 'limit_populacji' };
    const workFilter = terrainAndTerritoryFilter(map, territoryNodes, city.ownerId, excludeHexKeys);
    const tiles = okolicaTiles(city.q, city.r, rad, map, workFilter);
    if (!tiles.some(t => t.key === key)) {
      // P-HEKS-SPOR-SASIAD: heks przegrany na rzecz bliższego miasta tego samego właściciela —
      // odróżnij od "obce_terytorium"/"poza_zasiegiem", żeby UI mógł pokazać trafny komunikat.
      if (excludeHexKeys && excludeHexKeys.has(key)) {
        return { ok: false, reczne, reason: 'zajete_przez_inne_miasto' };
      }
      if (territoryNodes && !isTerritoryHexOwnedBy(q, r, city.ownerId, territoryNodes)) {
        return { ok: false, reczne, reason: 'obce_terytorium' };
      }
      return { ok: false, reczne, reason: 'poza_zasiegiem' };
    }
    reczne[key] = 1;
    return { ok: true, reczne };
  }

  // delta=-1: zdejmowanie juz obsadzonego pola NIGDY nie przechodzi przez filtr
  // terenu/terytorium -- robotnik juz FIZYCZNIE stoi w danych (legalnie, albo jako
  // stary zapis sprzed tej naprawy), a zdjecie nigdy nie tworzy nielegalnego stanu.
  // Filtr stosuje sie WYLACZNIE do proby DODANIA nowego robotnika (wyzej).
  // Patrz R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1: mechanizm zdejmowania zostaje bez zmian
  // funkcjonalnych, takze dla nielegalnych wpisow sprzed filtra terenu.
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
  city: Pick<City, 'population' | 'okolicaReczne' | 'okolicaTryb' | 'okolicaFocus' | 'q' | 'r' | 'ownerId'>,
  map: GameMap,
  q: number,
  r: number,
  radius?: number,
  territoryNodes?: readonly TerritoryNode[],
  /** P-HEKS-SPOR-SASIAD: patrz `AssignOptions.excludeHexKeys`. */
  excludeHexKeys?: ReadonlySet<string>,
): { ok: boolean; reczne: Record<string, number>; reason?: string } {
  const pop = surroundingWorkerCap(city.population);
  if (pop <= 0) return { ok: false, reczne: {}, reason: 'brak_ludnosci' };
  if (q === city.q && r === city.r) return { ok: false, reczne: city.okolicaReczne ?? {}, reason: 'centrum_miasta' };

  const rad = radius ?? cityRangeForPopulation(Math.max(1, pop));
  const key = `${q},${r}`;
  let reczne = { ...(city.okolicaReczne ?? {}) };
  const tryb = city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;

  if (tryb !== 'reczny') {
    const autoReczne = seedReczneFromAuto(city, map, territoryNodes, excludeHexKeys);
    if ((autoReczne[key] ?? 0) >= 1) {
      reczne = autoReczne;
    } else {
      // Klik wolne pole z auto: nie kopiuj auto na innych heksach — gracz wybiera to pole.
      reczne = {};
    }
  }

  // B1 (runda 3, Evaluator rundy 2): zdejmowanie juz obsadzonego pola MUSI wykonac
  // sie PRZED jakimkolwiek sprawdzeniem filtra terenu/terytorium -- inaczej stary
  // zapis z robotnikiem na Gorach/Morzu (legalny przed ta naprawa, bo tryb reczny
  // nigdy wczesniej nie mial filtra terenu) zakleszcza sie: gracz nie moze go zdjac
  // klikiem, mimo ze zdjecie nigdy nie tworzy nielegalnego stanu. Filtr terenu
  // stosuje sie WYLACZNIE do galezi "pole wolne -> sprobuj dodac" ponizej.
  // Patrz R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1: mechanizm zostaje bez zmian
  // funkcjonalnych, decyzja dotyczy WYLACZNIE danych w starych zapisach.
  const current = reczne[key] ?? 0;
  if (current >= 1) {
    delete reczne[key];
    return { ok: true, reczne };
  }

  const workFilter = terrainAndTerritoryFilter(map, territoryNodes, city.ownerId, excludeHexKeys);
  const inRange = okolicaTiles(city.q, city.r, rad, map, workFilter).some(t => t.key === key);
  if (!inRange) {
    // P-HEKS-SPOR-SASIAD: patrz komentarz analogiczny w adjustTileWorker powyżej.
    if (excludeHexKeys && excludeHexKeys.has(key)) {
      return { ok: false, reczne, reason: 'zajete_przez_inne_miasto' };
    }
    if (territoryNodes && !isTerritoryHexOwnedBy(q, r, city.ownerId, territoryNodes)) {
      return { ok: false, reczne, reason: 'obce_terytorium' };
    }
    return { ok: false, reczne, reason: 'poza_zasiegiem' };
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
  cities: Array<Pick<City, 'id' | 'q' | 'r' | 'population' | 'okolicaFocus' | 'okolicaTryb' | 'okolicaReczne' | 'ownerId'>>,
  map: GameMap,
  ownerId: number,
  opts: {
    isWorkable?: (q: number, r: number) => boolean;
    territoryNodes?: readonly TerritoryNode[];
  } = {},
): Set<string> {
  const keys = new Set<string>();
  const yieldOf = (q: number, r: number) => yieldOfMapHex(map, q, r);
  // P-HEKS-SPOR-SASIAD: liczone RAZ dla całej listy miast (nie per-city), jak w advanceCityEconomy.
  const lostToSiblingByCity = computeLostToNearerSiblingByCity(cities, map);
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    const worked = resolveWorkedTiles(city, map, yieldOf, {
      isWorkable: opts.isWorkable,
      territoryNodes: opts.territoryNodes,
      ownerId,
      excludeHexKeys: lostToSiblingByCity.get(city.id),
    });
    for (const t of worked) keys.add(t.key);
  }
  return keys;
}

/** Wszystkie heksy z robotnikiem — hexKey → ownerId miasta (wszystkie cywilizacje na mapie). */
export function collectWorkedHexOwnerMap(
  cities: Array<Pick<City, 'id' | 'q' | 'r' | 'population' | 'okolicaFocus' | 'okolicaTryb' | 'okolicaReczne' | 'ownerId'>>,
  map: GameMap,
  opts: {
    isWorkable?: (q: number, r: number) => boolean;
    territoryNodes?: readonly TerritoryNode[];
  } = {},
): Map<string, number> {
  const byKey = new Map<string, number>();
  const yieldOf = (q: number, r: number) => yieldOfMapHex(map, q, r);
  // P-HEKS-SPOR-SASIAD: liczone RAZ dla całej listy miast (nie per-city), jak w advanceCityEconomy.
  const lostToSiblingByCity = computeLostToNearerSiblingByCity(cities, map);
  for (const city of cities) {
    const worked = resolveWorkedTiles(city, map, yieldOf, {
      isWorkable: opts.isWorkable,
      territoryNodes: opts.territoryNodes,
      ownerId: city.ownerId,
      excludeHexKeys: lostToSiblingByCity.get(city.id),
    });
    for (const t of worked) byKey.set(t.key, city.ownerId);
  }
  return byKey;
}

/**
 * P-HEKS-SPOR-SASIAD (Maciej 2026-08-13): rozstrzygnięcie sporu o ZWYKŁY heks (nie centrum —
 * patrz `cityCenterKeysFromTerritoryNodes`, które działa niezależnie i bezwarunkowo)
 * między dwoma+ miastami TEGO SAMEGO właściciela, których promienie okolicy się
 * zachodzą — najbliższe miasto wygrywa (`hexDistance` do centrum), remis → pierwsze
 * miasto w tablicy `cities` (ten sam wzorzec co `nearestOwnerCityId` w
 * turn-economy.ts::computeTerritoryResourceYieldByCity).
 *
 * Zwraca: cityId → Set<hexKey> heksów W JEGO WŁASNYM promieniu okolicy, które TO
 * miasto PRZEGRAŁO na rzecz bliższego sąsiada tego samego właściciela — do wpięcia
 * jako `excludeHexKeys` w `resolveWorkedTiles`/`cityWorkedTilesForEconomy` dla TEGO
 * miasta (sąsiad i tak wylicza ten heks sam, we WŁASNYM promieniu, wygrywając spór —
 * nie trzeba nic "dokładać" do listy sąsiada).
 *
 * Wydajność: dla każdego miasta A sprawdzani są TYLKO sąsiedzi tego samego właściciela
 * w odległości <= radiusA + radiusSąsiada (nierówność trójkąta: sąsiad dalej niż to
 * NIGDY nie może objąć żadnego heksu z promienia A) — przy MIN_CITY_DISTANCE=4-5 i
 * cap promienia=15 to zwykle 0-2 sąsiadów na miasto, nie cały zbiór miast właściciela.
 * EN: geometry-only (population/position), independent of yields/score — resolves
 * ordinary contested tiles between same-owner cities, nearest city wins, first-in-array
 * tiebreak; bounded to nearby siblings only via the triangle-inequality radius check.
 */
export function computeLostToNearerSiblingByCity(
  cities: ReadonlyArray<Pick<City, 'id' | 'q' | 'r' | 'population' | 'ownerId'>>,
  map: GameMap,
): ReadonlyMap<string, ReadonlySet<string>> {
  const out = new Map<string, Set<string>>();
  const cityIndex = new Map<string, number>();
  cities.forEach((c, i) => cityIndex.set(c.id, i));

  const byOwner = new Map<number, Array<{ id: string; q: number; r: number; radius: number }>>();
  for (const c of cities) {
    const radius = cityRangeForPopulation(Math.max(0, Math.floor(c.population ?? 0)));
    if (radius <= 0) continue;
    const list = byOwner.get(c.ownerId) ?? [];
    list.push({ id: c.id, q: c.q, r: c.r, radius });
    byOwner.set(c.ownerId, list);
  }

  for (const ownerCities of byOwner.values()) {
    if (ownerCities.length < 2) continue;
    for (const cityA of ownerCities) {
      const nearSiblings = ownerCities.filter(o =>
        o.id !== cityA.id && hexDistance(cityA.q, cityA.r, o.q, o.r) <= cityA.radius + o.radius,
      );
      if (nearSiblings.length === 0) continue;

      const candidateTiles = okolicaTiles(cityA.q, cityA.r, cityA.radius, map);
      const lost = new Set<string>();
      for (const t of candidateTiles) {
        let winnerId = cityA.id;
        let winnerDist = t.dist;
        let winnerIndex = cityIndex.get(cityA.id) ?? Infinity;
        for (const sib of nearSiblings) {
          const d = hexDistance(t.q, t.r, sib.q, sib.r);
          if (d > sib.radius) continue;
          const sibIndex = cityIndex.get(sib.id) ?? Infinity;
          if (d < winnerDist || (d === winnerDist && sibIndex < winnerIndex)) {
            winnerDist = d;
            winnerId = sib.id;
            winnerIndex = sibIndex;
          }
        }
        if (winnerId !== cityA.id) lost.add(t.key);
      }
      if (lost.size > 0) out.set(cityA.id, lost);
    }
  }

  return out;
}
