/**
 * territory-border.ts — obwód terytorium państwa jako zamknięte pętle (logika MAPA, bez Three.js).
 *
 * Zbiera zewnętrzne krawędzie heksów właściciela, łączy je w kontury i zwraca polyline loops
 * gotowe do renderu pasa (rangeOverlay.ts).
 */
import { axialToWorld, HEX_R } from '../render/hexutil';

const HEX_DIRS: { dq: number; dr: number }[] = [
  { dq: 1, dr: 0 },
  { dq: 1, dr: -1 },
  { dq: 0, dr: -1 },
  { dq: -1, dr: 0 },
  { dq: -1, dr: 1 },
  { dq: 0, dr: 1 },
];

export interface BorderLoopPoint {
  x: number;
  z: number;
}

export interface BorderEdge {
  id: number;
  v0Key: string;
  v1Key: string;
  v0x: number;
  v0z: number;
  v1x: number;
  v1z: number;
}

/**
 * Naprawia asymetrię znaku przy zaokrągleniu do zera: KAŻDA liczba ujemna o
 * module < 0.000005 daje string `"-0.00000"` (spec `toFixed` dopisuje znak
 * gdy `x < 0`; `(-0).toFixed(5)` samo w sobie daje `"0.00000"`, bo `-0 < 0`
 * jest fałszem — to tiny-negative typu `-4.44e-16`, nie dosłowne `-0`, jest
 * źródłem problemu), podczas gdy odpowiadająca im wartość dodatnia/zero daje
 * `"0.00000"` — dwa różne stringi dla tego samego punktu geometrycznego.
 */
function fixNegativeZeroString(v: string): string {
  return v === '-0.00000' ? '0.00000' : v;
}

/**
 * BUG-CYWILIZACJA-BEZ-GRANIC (2026-08-09): przy gęstym osadnictwie (wiele miast
 * blisko siebie, np. 10 miast tej samej cywilizacji) rogi sąsiednich heksów
 * bywają liczone z DWÓCH różnych centrów (hexCornerWorld dla różnych (q,r)) i
 * powinny dać IDENTYCZNY punkt świata, ale drobny szum zmiennoprzecinkowy
 * (rzędu 1e-16, z Math.sin/Math.cos) może dać np. `0` z jednej strony i
 * `-4.44e-16` z drugiej. Obie wartości zaokrąglają się do zera w
 * `toFixed(5)`, ale ze ZNAKIEM zachowanym w stringu ("0.00000" vs
 * "-0.00000") — to samo wierzchołek dostaje DWA różne klucze w grafie
 * sąsiedztwa, `traceTerritoryBoundaryLoops` widzi tam dwa wierzchołki stopnia
 * 1 zamiast jednego stopnia 2, i przerywa pętlę obwodu w tym miejscu
 * (rozdziela ją na kilka NIEDOMKNIĘTYCH fragmentów, z brakującymi
 * krawędziami). Im gęstszy/bardziej symetryczny klaster miast względem
 * początku układu współrzędnych świata, tym więcej wierzchołków ląduje
 * dokładnie na osi zero — stąd bug ujawnia się przy gęstym osadnictwie, a nie
 * przy pojedynczym izolowanym mieście. Zweryfikowane na żywej symulacji i
 * pokryte regresją: gra/tools/territory-border-dense-settlement-test.cjs.
 */
function borderVertexKey(x: number, z: number): string {
  return `${fixNegativeZeroString(x.toFixed(5))},${fixNegativeZeroString(z.toFixed(5))}`;
}

function hexCornerWorld(cx: number, cz: number, cornerIndex: number): BorderLoopPoint {
  const a = (Math.PI / 3) * cornerIndex;
  return {
    x: cx + HEX_R * Math.sin(a),
    z: cz + HEX_R * Math.cos(a),
  };
}

/** Zewnętrzne krawędzie terytorium (sąsiad poza zbiorem lub brak). */
export function collectTerritoryBoundaryEdges(
  hexKeys: Set<string>,
  hexCenter: (q: number, r: number) => { x: number; z: number } | null,
): BorderEdge[] {
  const edges: BorderEdge[] = [];
  let id = 0;

  for (const key of hexKeys) {
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    const center = hexCenter(q, r);
    if (!center) continue;

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      if (hexKeys.has(`${q + dir.dq},${r + dir.dr}`)) continue;

      // Pointy-top: krawędź w kierunku dir = rogi (dir+1) i (dir+2) — jak scene.ts hexEdgeMidpointByDir.
      const va = hexCornerWorld(center.x, center.z, (i + 1) % 6);
      const vb = hexCornerWorld(center.x, center.z, (i + 2) % 6);
      edges.push({
        id: id++,
        v0Key: borderVertexKey(va.x, va.z),
        v1Key: borderVertexKey(vb.x, vb.z),
        v0x: va.x,
        v0z: va.z,
        v1x: vb.x,
        v1z: vb.z,
      });
    }
  }

  return edges;
}

type AdjEntry = { edgeId: number; toKey: string; tox: number; toz: number };

function buildAdjacency(edges: BorderEdge[]): Map<string, AdjEntry[]> {
  const adj = new Map<string, AdjEntry[]>();
  const push = (fromKey: string, entry: AdjEntry) => {
    let list = adj.get(fromKey);
    if (!list) {
      list = [];
      adj.set(fromKey, list);
    }
    list.push(entry);
  };

  for (const e of edges) {
    push(e.v0Key, { edgeId: e.id, toKey: e.v1Key, tox: e.v1x, toz: e.v1z });
    push(e.v1Key, { edgeId: e.id, toKey: e.v0Key, tox: e.v0x, toz: e.v0z });
  }
  return adj;
}

function pickNextEdge(
  adj: Map<string, AdjEntry[]>,
  atKey: string,
  fromKey: string,
  vx: number,
  vz: number,
  prevx: number,
  prevz: number,
  used: Set<number>,
): AdjEntry | null {
  const options = (adj.get(atKey) ?? []).filter(o => !used.has(o.edgeId) && o.toKey !== fromKey);
  if (options.length === 0) return null;
  if (options.length === 1) return options[0]!;

  const inx = vx - prevx;
  const inz = vz - prevz;

  let best: AdjEntry | null = null;
  let bestCross = -Infinity;

  for (const o of options) {
    const outx = o.tox - vx;
    const outz = o.toz - vz;
    const cross = inx * outz - inz * outx;
    // Obwód CCW: terytorium po lewej → najmniejszy dodatni skręt (najbliższa krawędź w lewo).
    if (cross > 1e-8 && (best === null || cross < bestCross || bestCross <= 1e-8)) {
      best = o;
      bestCross = cross;
    }
  }

  if (best) return best;

  // Wklęsły narożnik — weź największy skręt w lewo (najmniej ujemny cross).
  for (const o of options) {
    const outx = o.tox - vx;
    const outz = o.toz - vz;
    const cross = inx * outz - inz * outx;
    if (best === null || cross > bestCross) {
      best = o;
      bestCross = cross;
    }
  }
  return best;
}

/** Łączy krawędzie w zamknięte pętle obwodu (jedna lub więcej wysp). */
export function traceTerritoryBoundaryLoops(edges: BorderEdge[]): BorderLoopPoint[][] {
  if (edges.length === 0) return [];
  const adj = buildAdjacency(edges);
  const used = new Set<number>();
  const loops: BorderLoopPoint[][] = [];

  for (const start of edges) {
    if (used.has(start.id)) continue;

    const loop: BorderLoopPoint[] = [{ x: start.v0x, z: start.v0z }];
    let fromKey = start.v0Key;
    let prevx = start.v0x;
    let prevz = start.v0z;
    let atKey = start.v1Key;
    let atx = start.v1x;
    let atz = start.v1z;
    used.add(start.id);

    const maxSteps = edges.length + 2;
    for (let step = 0; step < maxSteps; step++) {
      loop.push({ x: atx, z: atz });
      if (atKey === start.v0Key && loop.length > 2) break;

      const next = pickNextEdge(adj, atKey, fromKey, atx, atz, prevx, prevz, used);
      if (!next) break;

      used.add(next.edgeId);
      fromKey = atKey;
      prevx = atx;
      prevz = atz;
      atKey = next.toKey;
      atx = next.tox;
      atz = next.toz;
    }

    if (loop.length >= 4) {
      const last = loop[loop.length - 1]!;
      const first = loop[0]!;
      if (Math.hypot(last.x - first.x, last.z - first.z) < 1e-4) loop.pop();
      if (loop.length >= 3) loops.push(loop);
    }
  }

  return loops;
}

/** Obwód terytorium w world XZ — pętle gotowe do pasa renderu. */
export function computeTerritoryBorderLoops(
  hexKeys: Set<string>,
  hexCenter: (q: number, r: number) => { x: number; z: number } | null,
): BorderLoopPoint[][] {
  const edges = collectTerritoryBoundaryEdges(hexKeys, hexCenter);
  return traceTerritoryBoundaryLoops(edges);
}

/** Pomocnicze: środki heksów z mapy (bez Three.js). */
export function makeAxialHexCenterFn(): (q: number, r: number) => { x: number; z: number } {
  return (q, r) => axialToWorld(q, r, HEX_R);
}
