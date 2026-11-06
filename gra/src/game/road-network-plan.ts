/**
 * R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1 — plan sieci drogowej MIEDZY MIASTAMI jednej cywilizacji.
 *
 * Zgloszenie wlasciciela (2026-11-05): „miało być łączenie tylko pomiędzy miastami, a nie robienie jakichś wielokątów”.
 * Dawny wybor heksu pod droge (`isRoadQualified`, map/improvement-build.ts) kwalifikowal KAZDY heks ladu we wlasnym
 * terytorium sasiadujacy z miastem albo z istniejaca droga — fala rozlewala sie po calym terytorium miasta (siatka).
 *
 * ZASADA: droga automatu (AI i auto-ulepszenia gracza) powstaje WYLACZNIE na heksach tego planu:
 *   • zbior krawedzi = minimalne drzewo rozpinajace (MST, Kruskal) po REALNEJ dlugosci sciezki miedzy miastami
 *     (kazde miasto jest wiec polaczone ze swoim najblizszym sasiadem; brak cykli ani odnog bez celu);
 *   • sciezka = najtansza po heksach ladu w zadanym zasiegu (`isTraversable`), istniejace drogi sa tanie (reuse),
 *     kolejne krawedzie MST chetnie wchodza w juz zaplanowany pien (jedna linia, nie rownolegle pasy);
 *   • miasto bez sasiada w zasiegu (brak sciezki) nie dostaje zadnego heksu;
 *   • heksy samych miast nie sa czescia planu (miasto jest wezlem, nie droga).
 *
 * Czysta, deterministyczna funkcja: zero Math.random, remisy po (koszt, q, r) i id miast. Nie zmienia kosztow ani
 * efektu ruchu drog.
 */
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { hexHasRoad } from '../map/road-movement';

export interface RoadPlanCity { id: string; q: number; r: number }

export interface RoadNetworkPlanOpts {
  /** Czy heks wolno uzyc w sciezce (wlasne terytorium + zasieg budowy); domyslnie kazdy heks ladu. Miasta sa zawsze dozwolone. */
  isTraversable?: (q: number, r: number) => boolean;
  /** Heksy z juz postawiona droga spoza `map.hexes[..].ulepszenia` (np. warstwy zaplanowane w tym wywolaniu). */
  extraRoadKeys?: ReadonlySet<string>;
}

export interface RoadNetworkPlan {
  /** Heksy do pokrycia droga (bez heksow miast), posortowane (q, r). */
  hexes: string[];
  /** Wybrane krawedzie MST: id miast i koszt sciezki (liczba krokow z wagami). */
  edges: Array<{ a: string; b: string; cost: number }>;
  /** Pary miast bez sciezki w zasiegu (komponenty rozlaczne). */
  disconnected: number;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const LAND = new Set<string>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.Pustynia,
]);
/** Koszty w setnych kroku (calkowite — remisy bez bledow zmiennoprzecinkowych). */
const COST_BASE = 100;
const COST_HILLS = 150;
const COST_MOUNTAIN = 600;
const COST_ROAD = 10;
const COST_CITY = 1;
const COST_PLANNED = 5;

const kOf = (q: number, r: number): string => `${q},${r}`;

class MinHeap {
  private a: Array<{ c: number; q: number; r: number }> = [];
  get size(): number { return this.a.length; }
  private less(i: number, j: number): boolean {
    const x = this.a[i]!, y = this.a[j]!;
    return x.c !== y.c ? x.c < y.c : x.q !== y.q ? x.q < y.q : x.r < y.r;
  }
  private swap(i: number, j: number): void {
    const t = this.a[i]!; this.a[i] = this.a[j]!; this.a[j] = t;
  }
  push(c: number, q: number, r: number): void {
    const a = this.a; a.push({ c, q, r });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(i, p)) break;
      this.swap(i, p); i = p;
    }
  }
  pop(): { c: number; q: number; r: number } | undefined {
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0]!; const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, rr = l + 1; let m = i;
        if (l < a.length && this.less(l, m)) m = l;
        if (rr < a.length && this.less(rr, m)) m = rr;
        if (m === i) break;
        this.swap(i, m); i = m;
      }
    }
    return top;
  }
}

/**
 * Plan sieci drogowej (MST po dlugosci sciezki) dla miast JEDNEGO wlasciciela.
 * `cities` = wszystkie miasta tego wlasciciela (nie podzbior po profilu) — inaczej MST rozpadnie sie na kawalki.
 */
export function planRoadNetwork(
  cities: readonly RoadPlanCity[],
  map: GameMap,
  opts: RoadNetworkPlanOpts = {},
): RoadNetworkPlan {
  const sorted = [...cities].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const n = sorted.length;
  const empty: RoadNetworkPlan = { hexes: [], edges: [], disconnected: 0 };
  if (n < 2) return empty;
  const cityAt = new Map<string, number>();
  sorted.forEach((c, i) => cityAt.set(kOf(c.q, c.r), i));
  const extra = opts.extraRoadKeys;
  const planned = new Set<string>();

  const stepCost = (q: number, r: number, usePlanned: boolean): number => {
    const key = kOf(q, r);
    if (cityAt.has(key)) return COST_CITY;
    const hex = map.hexes[key];
    if (!hex || !LAND.has(String(hex.terenBazowy))) return -1;
    if (opts.isTraversable && !opts.isTraversable(q, r)) return -1;
    if (usePlanned && planned.has(key)) return COST_PLANNED;
    if (extra?.has(key) || hexHasRoad(hex)) return COST_ROAD;
    if (hex.terenBazowy === TerenBazowy.Gory) return COST_MOUNTAIN;
    if (hex.terenBazowy === TerenBazowy.Wzgorza) return COST_HILLS;
    return COST_BASE;
  };

  /** Dijkstra z miasta `from`; `to` >= 0 konczy wczesniej. Zwraca dist/parent. */
  const dijkstra = (from: number, to: number, usePlanned: boolean) => {
    const dist = new Map<string, number>();
    const parent = new Map<string, string>();
    const done = new Set<string>();
    const src = sorted[from]!;
    const heap = new MinHeap();
    const sk = kOf(src.q, src.r);
    dist.set(sk, 0); heap.push(0, src.q, src.r);
    const targetKey = to >= 0 ? kOf(sorted[to]!.q, sorted[to]!.r) : null;
    for (;;) {
      const cur = heap.pop();
      if (!cur) break;
      const ck = kOf(cur.q, cur.r);
      if (done.has(ck)) continue;
      done.add(ck);
      if (targetKey && ck === targetKey) break;
      for (const d of DIRS) {
        const nq = cur.q + d[0], nr = cur.r + d[1];
        const nk = kOf(nq, nr);
        if (done.has(nk)) continue;
        const w = stepCost(nq, nr, usePlanned);
        if (w < 0) continue;
        const nd = cur.c + w;
        const old = dist.get(nk);
        if (old === undefined || nd < old) {
          dist.set(nk, nd); parent.set(nk, ck); heap.push(nd, nq, nr);
        }
      }
    }
    return { dist, parent };
  };

  // 1) odleglosci miedzy parami miast (Dijkstra z kazdego miasta).
  const edges: Array<{ i: number; j: number; cost: number }> = [];
  for (let i = 0; i < n; i++) {
    const { dist } = dijkstra(i, -1, false);
    for (let j = i + 1; j < n; j++) {
      const d = dist.get(kOf(sorted[j]!.q, sorted[j]!.r));
      if (d !== undefined) edges.push({ i, j, cost: d });
    }
  }
  edges.sort((x, y) => (x.cost - y.cost) || (x.i - y.i) || (x.j - y.j));

  // 2) Kruskal (MST / las rozpinajacy dla komponentow rozlacznych).
  const uf = sorted.map((_, i) => i);
  const find = (x: number): number => { while (uf[x]! !== x) { uf[x] = uf[uf[x]!]!; x = uf[x]!; } return x; };
  const chosen: Array<{ i: number; j: number; cost: number }> = [];
  for (const e of edges) {
    const a = find(e.i), b = find(e.j);
    if (a === b) continue;
    uf[a] = b; chosen.push(e);
  }
  const roots = new Set(sorted.map((_, i) => find(i)));
  const disconnected = roots.size - 1;

  // 3) sciezki wybranych krawedzi: kolejne wchodza chetnie w juz zaplanowany pien (brak rownoleglych pasow).
  for (const e of chosen) {
    const { parent } = dijkstra(e.i, e.j, true);
    let k = kOf(sorted[e.j]!.q, sorted[e.j]!.r);
    const startKey = kOf(sorted[e.i]!.q, sorted[e.i]!.r);
    while (k !== startKey) {
      if (!cityAt.has(k)) planned.add(k);
      const p = parent.get(k);
      if (p === undefined) break;
      k = p;
    }
  }

  // 4) wygladzenie: heks w trojkacie (3 wzajemnie sasiadujace wezly sieci) jest zbedny, gdy jego sasiedzi pozostaja
  //    polaczeni bez niego — usuwa „zygzaki” dajace drobne wielokaty. Deterministycznie (kolejnosc q, r).
  const adjacent = (a: string, b: string): boolean => {
    const [aq = 0, ar = 0] = a.split(',').map(Number); const [bq = 0, br = 0] = b.split(',').map(Number);
    return DIRS.some(d => aq + d[0] === bq && ar + d[1] === br);
  };
  const nbsInNet = (k: string, net: ReadonlySet<string>): string[] => {
    const [q = 0, r = 0] = k.split(',').map(Number);
    return DIRS.map(d => kOf(q + d[0], r + d[1])).filter(x => net.has(x));
  };
  const cityKeySet = new Set(cityAt.keys());
  const order = [...planned].sort((a, b) => {
    const [aq = 0, ar = 0] = a.split(',').map(Number); const [bq = 0, br = 0] = b.split(',').map(Number);
    return aq - bq || ar - br;
  });
  for (const h of order) {
    const net = new Set<string>([...planned, ...cityKeySet]);
    const nb = nbsInNet(h, net);
    let inTriangle = false;
    for (let i = 0; i < nb.length && !inTriangle; i++) for (let j = i + 1; j < nb.length; j++) {
      if (adjacent(nb[i]!, nb[j]!)) { inTriangle = true; break; }
    }
    if (!inTriangle) continue;
    net.delete(h);
    // sasiedzi h musza zostac w jednej skladowej po usunieciu h
    const seen = new Set<string>([nb[0]!]); const st = [nb[0]!];
    while (st.length) { const x = st.pop()!; for (const y of nbsInNet(x, net)) if (!seen.has(y)) { seen.add(y); st.push(y); } }
    if (nb.every(x => seen.has(x))) planned.delete(h);
  }

  const hexes = [...planned].sort((a, b) => {
    const [aq = 0, ar = 0] = a.split(",").map(Number); const [bq = 0, br = 0] = b.split(",").map(Number);
    return aq - bq || ar - br;
  });
  return {
    hexes,
    edges: chosen.map(e => ({ a: sorted[e.i]!.id, b: sorted[e.j]!.id, cost: e.cost })),
    disconnected,
  };
}
