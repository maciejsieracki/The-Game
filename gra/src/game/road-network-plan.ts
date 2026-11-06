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

/** Liczba geometrycznie najblizszych sasiadow, z ktorymi liczone sa kandydackie krawedzie MST (reszta polaczen: faza uzupelniajaca). */
const NEAREST_K = 5;

const axialDist = (aq: number, ar: number, bq: number, br: number): number => {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};

/**
 * Plan sieci drogowej (MST po dlugosci sciezki) dla miast JEDNEGO wlasciciela.
 * `cities` = wszystkie miasta tego wlasciciela (nie podzbior po profilu) — inaczej MST rozpadnie sie na kawalki.
 *
 * Wydajnosc: kandydackie krawedzie tylko miedzy `NEAREST_K` najblizszymi sasiadami (Dijkstra z wczesnym stopem i limitem
 * kosztu), potem faza uzupelniajaca laczy rozlaczne skladowe najblizsza para (jedna proba na pare skladowych).
 * Koszt kroku heksa liczony raz na wywolanie (pamiec).
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
  const keyOfCity = sorted.map(c => kOf(c.q, c.r));
  const extra = opts.extraRoadKeys;
  const planned = new Set<string>();

  const baseCostMemo = new Map<string, number>();
  const baseCost = (q: number, r: number, key: string): number => {
    const hit = baseCostMemo.get(key);
    if (hit !== undefined) return hit;
    let v: number;
    if (cityAt.has(key)) v = COST_CITY;
    else {
      const hex = map.hexes[key];
      if (!hex || !LAND.has(String(hex.terenBazowy))) v = -1;
      else if (opts.isTraversable && !opts.isTraversable(q, r)) v = -1;
      else if (extra?.has(key) || hexHasRoad(hex)) v = COST_ROAD;
      else if (hex.terenBazowy === TerenBazowy.Gory) v = COST_MOUNTAIN;
      else if (hex.terenBazowy === TerenBazowy.Wzgorza) v = COST_HILLS;
      else v = COST_BASE;
    }
    baseCostMemo.set(key, v);
    return v;
  };

  /** Dijkstra z miasta `from`; konczy, gdy wszystkie `targets` (klucze heksow) sa rozliczone; `cap` ucina za drogie sciezki. */
  const dijkstra = (from: number, targets: ReadonlySet<string> | null, usePlanned: boolean, cap: number) => {
    const dist = new Map<string, number>();
    const parent = new Map<string, string>();
    const done = new Set<string>();
    const src = sorted[from]!;
    const heap = new MinHeap();
    dist.set(keyOfCity[from]!, 0); heap.push(0, src.q, src.r);
    let left = targets ? targets.size : -1;
    for (;;) {
      const cur = heap.pop();
      if (!cur) break;
      const ck = kOf(cur.q, cur.r);
      if (done.has(ck)) continue;
      done.add(ck);
      if (targets && targets.has(ck) && --left <= 0) break;
      for (const d of DIRS) {
        const nq = cur.q + d[0], nr = cur.r + d[1];
        const nk = kOf(nq, nr);
        if (done.has(nk)) continue;
        let w = baseCost(nq, nr, nk);
        if (w < 0) continue;
        if (usePlanned && planned.has(nk) && w > COST_PLANNED) w = COST_PLANNED;
        const nd = cur.c + w;
        if (nd > cap) continue;
        const old = dist.get(nk);
        if (old === undefined || nd < old) {
          dist.set(nk, nd); parent.set(nk, ck); heap.push(nd, nq, nr);
        }
      }
    }
    return { dist, parent };
  };

  // 1) kandydackie krawedzie: kazde miasto z NEAREST_K geometrycznie najblizszymi (limit kosztu = 3x odleglosc do K-tego).
  const edgeSeen = new Set<number>();
  const edges: Array<{ i: number; j: number; cost: number }> = [];
  const pushEdge = (i: number, j: number, cost: number): void => {
    const a = Math.min(i, j), b = Math.max(i, j);
    const id = a * n + b;
    if (edgeSeen.has(id)) return;
    edgeSeen.add(id); edges.push({ i: a, j: b, cost });
  };
  for (let i = 0; i < n; i++) {
    const near: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < n; j++) if (j !== i) near.push({ j, d: axialDist(sorted[i]!.q, sorted[i]!.r, sorted[j]!.q, sorted[j]!.r) });
    near.sort((x, y) => (x.d - y.d) || (x.j - y.j));
    const top = near.slice(0, NEAREST_K);
    const targets = new Set(top.map(t => keyOfCity[t.j]!));
    const cap = COST_BASE * 3 * (top[top.length - 1]?.d ?? 1) + COST_MOUNTAIN;
    const { dist } = dijkstra(i, targets, false, cap);
    for (const t of top) {
      const d = dist.get(keyOfCity[t.j]!);
      if (d !== undefined) pushEdge(i, t.j, d);
    }
  }
  edges.sort((x, y) => (x.cost - y.cost) || (x.i - y.i) || (x.j - y.j));

  // 2) Kruskal (MST / las rozpinajacy).
  const uf = sorted.map((_, i) => i);
  const find = (x: number): number => { while (uf[x]! !== x) { uf[x] = uf[uf[x]!]!; x = uf[x]!; } return x; };
  const chosen: Array<{ i: number; j: number; cost: number }> = [];
  for (const e of edges) {
    const a = find(e.i), b = find(e.j);
    if (a === b) continue;
    uf[a] = b; chosen.push(e);
  }

  // 2b) uzupelnienie: rozlaczne skladowe lacz najblizsza para miast (jedna proba na pare skladowych; brak sciezki = zostaja rozlaczne).
  const tried = new Set<string>();
  for (;;) {
    const comps = new Map<number, number[]>();
    for (let i = 0; i < n; i++) { const r = find(i); const arr = comps.get(r); if (arr) arr.push(i); else comps.set(r, [i]); }
    if (comps.size <= 1) break;
    let best: { i: number; j: number; d: number; pk: string } | null = null;
    const roots = [...comps.keys()].sort((a, b) => a - b);
    for (let x = 0; x < roots.length; x++) for (let y = x + 1; y < roots.length; y++) {
      const pk = `${roots[x]}|${roots[y]}`;
      if (tried.has(pk)) continue;
      for (const i of comps.get(roots[x]!)!) for (const j of comps.get(roots[y]!)!) {
        const d = axialDist(sorted[i]!.q, sorted[i]!.r, sorted[j]!.q, sorted[j]!.r);
        if (!best || d < best.d || (d === best.d && (i < best.i || (i === best.i && j < best.j)))) best = { i, j, d, pk };
      }
    }
    if (!best) break;
    tried.add(best.pk);
    const { dist } = dijkstra(best.i, new Set([keyOfCity[best.j]!]), false, Infinity);
    const d = dist.get(keyOfCity[best.j]!);
    if (d === undefined) continue;
    const a = find(best.i), b = find(best.j);
    if (a !== b) { uf[a] = b; chosen.push({ i: Math.min(best.i, best.j), j: Math.max(best.i, best.j), cost: d }); }
  }
  const disconnected = new Set(sorted.map((_, i) => find(i))).size - 1;

  // 3) sciezki wybranych krawedzi: kolejne wchodza chetnie w juz zaplanowany pien (brak rownoleglych pasow).
  for (const e of chosen) {
    const { parent } = dijkstra(e.i, new Set([keyOfCity[e.j]!]), true, Infinity);
    let k = keyOfCity[e.j]!;
    const startKey = keyOfCity[e.i]!;
    while (k !== startKey) {
      if (!cityAt.has(k)) planned.add(k);
      const p = parent.get(k);
      if (p === undefined) break;
      k = p;
    }
  }

  // 4) wygladzenie: heks w trojkacie (3 wzajemnie sasiadujace wezly sieci) jest zbedny, gdy jego sasiedzi pozostaja
  //    polaczeni bez niego — usuwa „zygzaki” dajace drobne wielokaty. Deterministycznie (kolejnosc q, r).
  const net = new Set<string>([...planned, ...keyOfCity]);
  const nbsInNet = (k: string): string[] => {
    const [q = 0, r = 0] = k.split(',').map(Number);
    return DIRS.map(d => kOf(q + d[0], r + d[1])).filter(x => net.has(x));
  };
  const adjacent = (a: string, b: string): boolean => {
    const [aq = 0, ar = 0] = a.split(',').map(Number); const [bq = 0, br = 0] = b.split(',').map(Number);
    return axialDist(aq, ar, bq, br) === 1;
  };
  const byQR = (a: string, b: string): number => {
    const [aq = 0, ar = 0] = a.split(',').map(Number); const [bq = 0, br = 0] = b.split(',').map(Number);
    return aq - bq || ar - br;
  };
  for (const h of [...planned].sort(byQR)) {
    const nb = nbsInNet(h);
    let inTriangle = false;
    for (let i = 0; i < nb.length && !inTriangle; i++) for (let j = i + 1; j < nb.length; j++) {
      if (adjacent(nb[i]!, nb[j]!)) { inTriangle = true; break; }
    }
    if (!inTriangle) continue;
    net.delete(h);
    // sasiedzi h musza zostac w jednej skladowej po usunieciu h
    const seen = new Set<string>([nb[0]!]); const st = [nb[0]!];
    while (st.length) { const x = st.pop()!; for (const y of nbsInNet(x)) if (!seen.has(y)) { seen.add(y); st.push(y); } }
    if (nb.every(x => seen.has(x))) planned.delete(h); else net.add(h);
  }

  return {
    hexes: [...planned].sort(byQR),
    edges: chosen.map(e => ({ a: sorted[e.i]!.id, b: sorted[e.j]!.id, cost: e.cost })),
    disconnected,
  };
}
