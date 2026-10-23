/**
 * warAllInCapital.ts -- TYMCZASOWA, prosta zasada wojny (R-WEB-WAR-ALLIN-CAPITAL-Q1,
 * zgloszenie wlasciciela 2026-10-23: "w wypadku wojny praktycznie nic sie nie dzieje").
 *
 * ZASADA: w stanie wojny KAZDA cywilizacja sterujaca sie automatycznie (AI, takze
 * miasta-panstwa idace sciezka decideAITurn; oraz barbarzyncy) wysyla WSZYSTKIE swoje
 * jednostki bojowe (nie cywilne, nie zwiadowcow) na AKTUALNA STOLICE przeciwnika:
 *  - AI -> najblizsza (od polozenia grupy) stolica wsrod cywilizacji, z ktorymi jest w wojnie,
 *  - barbarzyncy -> najblizsza stolica wsrod cywilizacji, z ktorymi sa w wojnie.
 * Po drodze jednostki laczy sie w jak najwieksze grupy (rendezvous), ale cala armia idzie
 * na stolice -- zero jednostek bezczynnych.
 *
 * GRACZ (czlowiek) NIE dostaje zadnych automatycznych rozkazow (poprawka wlasciciela):
 * modul jest wolany WYLACZNIE z decideAITurn (AI) i decideBarbarianMoves (barbarzyncy);
 * gracz moze byc tylko CELEM (jego stolica w `targets`).
 *
 * FLAGA WYLACZENIA: `WAR_ALLIN_CAPITAL_ENABLED = false` przywraca dotychczasowe zachowanie
 * (main.ts nie buduje wtedy kontekstu `warAllIn`, a ai.ts / barbarians.ts nie wolaja
 * modulu -- bit-identyczny stan jak w bazie 75f53d58). Test/diagnostyka moga ja nadpisac
 * przez `setWarAllInCapitalOverride`.
 *
 * Modul jest CZYSTY i deterministyczny: zero RNG, zero dostepu do stanu gry; trasy liczy
 * wspolne pole odleglosci per cel (distanceField), a wolajacy podaje zbior zablokowanych heksow.
 */

import type { GameMap } from '../types/map';
import { hexDistance, hexNeighborCoords, keyOf, terrainMoveCost } from '../units/setup';

/** GLOWNA FLAGA (tymczasowa zasada -- latwa do wylaczenia jedna zmiana). */
export const WAR_ALLIN_CAPITAL_ENABLED = true;

let overrideValue: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF niezaleznie od stalej; null = wroc do stalej. */
export function setWarAllInCapitalOverride(value: boolean | null): void {
  overrideValue = value;
}

export function isWarAllInCapitalEnabled(): boolean {
  return overrideValue !== null ? overrideValue : WAR_ALLIN_CAPITAL_ENABLED;
}

/** Cel: AKTUALNA stolica cywilizacji, z ktora jestesmy w wojnie. */
export interface WarCapitalTarget {
  ownerId: number;
  cityId: string;
  q: number;
  r: number;
}

/** Kontekst przekazywany z main.ts do ai.ts / barbarians.ts (tylko gdy flaga ON). */
export interface WarAllInContext {
  targets: readonly WarCapitalTarget[];
}

/**
 * Nawigacja: JEDNO pole odleglosci (Dijkstra od celu) na cel, wspolne dla wszystkich
 * jednostek idacych do tego celu -- zamiast osobnego computePath na jednostke (koszt
 * N_jednostek x Dijkstra). Pole liczone wstecz: D[v] = koszt dojscia z v do celu, gdzie
 * wejscie na heks x kosztuje terrainMoveCost(x) (cel zawsze wchodzalny, koszt 1 gdy
 * nieskonczony -- jak computePath). Heksy w `blocked` (jednostki, obce miasta) nie sa
 * heksami tranzytowymi. Zatrzymanie, gdy wszystkie heksy startowe sa ustalone.
 */
export interface WarAllInNav {
  map: GameMap;
  /** Heksy niedostepne jako tranzyt/krok: zajete przez jednostki + obce miasta. */
  blocked: ReadonlySet<string>;
}

function distanceField(
  nav: WarAllInNav,
  destQ: number,
  destR: number,
  startKeys: ReadonlySet<string>,
): Map<string, number> {
  const dist = new Map<string, number>();
  const destKey = keyOf(destQ, destR);
  if (!(destKey in nav.map.hexes)) return dist;
  type Entry = [number, number, number];
  const heap: Entry[] = [[0, destQ, destR]];
  dist.set(destKey, 0);
  const settled = new Set<string>();
  let remaining = startKeys.size;
  const push = (e: Entry): void => {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (heap[par]![0] <= heap[i]![0]) break;
      const t = heap[par]!; heap[par] = heap[i]!; heap[i] = t;
      i = par;
    }
  };
  const pop = (): Entry | undefined => {
    if (heap.length === 0) return undefined;
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1; const rr = 2 * i + 2;
        let sm = i;
        if (l < heap.length && heap[l]![0] < heap[sm]![0]) sm = l;
        if (rr < heap.length && heap[rr]![0] < heap[sm]![0]) sm = rr;
        if (sm === i) break;
        const t = heap[i]!; heap[i] = heap[sm]!; heap[sm] = t;
        i = sm;
      }
    }
    return top;
  };
  while (heap.length > 0) {
    const [cost, cq, cr] = pop()!;
    const ck = keyOf(cq, cr);
    if (settled.has(ck)) continue;
    if (cost > (dist.get(ck) ?? Infinity)) continue;
    settled.add(ck);
    if (startKeys.has(ck)) {
      remaining--;
      if (remaining <= 0) break;
    }
    // Heks zablokowany / nieprzechodni (poza celem) nie jest tranzytem dla innych.
    const hex = nav.map.hexes[ck];
    if (ck !== destKey) {
      if (hex === undefined || terrainMoveCost(hex) === Infinity) continue;
      if (nav.blocked.has(ck)) continue;
    }
    const enter = ck === destKey
      ? (terrainMoveCost(hex!) === Infinity ? 1 : terrainMoveCost(hex!))
      : terrainMoveCost(hex!);
    for (const n of hexNeighborCoords(cq, cr)) {
      const nk = keyOf(n.q, n.r);
      if (!(nk in nav.map.hexes) || settled.has(nk)) continue;
      const nd = cost + enter;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        push([nd, n.q, n.r]);
      }
    }
  }
  return dist;
}

/** Najlepszy pierwszy krok jednostki wedlug pola odleglosci (null = brak sciezki). */
function stepFromField(
  nav: WarAllInNav,
  field: Map<string, number>,
  destKey: string,
  u: { q: number; r: number },
): { q: number; r: number } | null {
  if (keyOf(u.q, u.r) === destKey) return null;
  if (!field.has(keyOf(u.q, u.r))) return null;
  let best: { q: number; r: number } | null = null;
  let bestCost = Infinity;
  for (const n of hexNeighborCoords(u.q, u.r)) {
    const nk = keyOf(n.q, n.r);
    const dn = field.get(nk);
    if (dn === undefined) continue;
    const hex = nav.map.hexes[nk];
    if (hex === undefined) continue;
    let enter: number;
    if (nk === destKey) {
      enter = terrainMoveCost(hex) === Infinity ? 1 : terrainMoveCost(hex);
    } else {
      enter = terrainMoveCost(hex);
      if (enter === Infinity || nav.blocked.has(nk)) continue;
    }
    const total = enter + dn;
    if (total < bestCost || (total === bestCost && best !== null && (n.q < best.q || (n.q === best.q && n.r < best.r)))) {
      bestCost = total;
      best = { q: n.q, r: n.r };
    }
  }
  return best;
}

export interface WarAllInUnit {
  id: string;
  q: number;
  r: number;
}

export interface WarAllInOrder {
  unitId: string;
  /** Pierwszy krok trasy (jak w pozostalych komendach `move` AI). */
  step: { q: number; r: number };
  targetCityId: string;
  targetOwnerId: number;
  /** 'capital' -- marsz na stolice; 'rendezvous' -- dolaczanie do wiekszej grupy po drodze. */
  mode: 'capital' | 'rendezvous';
}

export interface WarAllInPlan {
  orders: WarAllInOrder[];
  /** Jednostki bez sciezki do zadnej stolicy (morze) -- zostaja na miejscu. */
  noPath: string[];
  /** Diagnostyka: liczba grup per cel (cityId -> rozmiary grup). */
  groupsByTarget: Record<string, number[]>;
}

/** Jednostki w tym dystansie (lancuchowo) tworza jedna grupe. */
export const WAR_ALLIN_LINK_RADIUS = 3;
/** Grupa dolacza do wiekszej/wczesniejszej grupy tego samego celu, jesli jest nie dalej. */
export const WAR_ALLIN_MERGE_RADIUS = 8;
/** Blisko stolicy nie zbieramy sie -- natarcie. */
export const WAR_ALLIN_NO_MERGE_NEAR_CAPITAL = 3;

interface Cluster {
  members: WarAllInUnit[];
  anchor: WarAllInUnit;
  target: WarCapitalTarget;
  distToTarget: number;
  minId: string;
}

function cmpTarget(a: WarCapitalTarget, b: WarCapitalTarget): number {
  return a.q - b.q || a.r - b.r || (a.cityId < b.cityId ? -1 : a.cityId > b.cityId ? 1 : 0);
}

function nearestTarget(
  q: number,
  r: number,
  targets: readonly WarCapitalTarget[],
): WarCapitalTarget | undefined {
  let best: WarCapitalTarget | undefined;
  let bestD = Infinity;
  for (const t of targets) {
    const d = hexDistance(q, r, t.q, t.r);
    if (d < bestD || (d === bestD && best !== undefined && cmpTarget(t, best) < 0)) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

/**
 * Planuje rozkazy "cala armia na stolice". `units` = jednostki bojowe ktore maja dostac
 * rozkaz (wolajacy filtruje: bez cywilow/zwiadowcow, z ruchLeft > 0). `nav.blocked` = heksy
 * zajete przez jednostki + obce miasta (nie sa tranzytem; rendezvous nie wchodzi na zajety heks).
 */
export function planWarAllInCapital(
  units: readonly WarAllInUnit[],
  targets: readonly WarCapitalTarget[],
  nav: WarAllInNav,
): WarAllInPlan {
  const allStartKeys = new Set(units.map(u => keyOf(u.q, u.r)));
  const fieldCache = new Map<string, Map<string, number>>();
  /** Pierwszy krok `u` do stolicy `t` (pole odleglosci wspolne dla wszystkich jednostek). */
  const stepToTarget = (u: WarAllInUnit, t: WarCapitalTarget): { q: number; r: number } | null => {
    const dk = keyOf(t.q, t.r);
    let f = fieldCache.get(dk);
    if (f === undefined) {
      f = distanceField(nav, t.q, t.r, allStartKeys);
      fieldCache.set(dk, f);
    }
    return stepFromField(nav, f, dk, u);
  };
  const rendezvousFields = new Map<Cluster, Map<string, number>>();
  /** Pierwszy krok `u` (z grupy `from`) ku kotwicy wiekszej grupy `to`. */
  const stepToCluster = (u: WarAllInUnit, from: Cluster, to: Cluster): { q: number; r: number } | null => {
    let f = rendezvousFields.get(from);
    const dk = keyOf(to.anchor.q, to.anchor.r);
    if (f === undefined) {
      f = distanceField(nav, to.anchor.q, to.anchor.r, new Set(from.members.map(m => keyOf(m.q, m.r))));
      rendezvousFields.set(from, f);
    }
    return stepFromField(nav, f, dk, u);
  };
  const plan: WarAllInPlan = { orders: [], noPath: [], groupsByTarget: {} };
  if (units.length === 0 || targets.length === 0) return plan;

  const sorted = [...units].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // 1) Grupy: skladowe spojnosci (lancuch odleglosci <= LINK_RADIUS).
  const parent = sorted.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (hexDistance(a.q, a.r, b.q, b.r) <= WAR_ALLIN_LINK_RADIUS) {
        const ra = find(i);
        const rb = find(j);
        if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
      }
    }
  }
  const byRoot = new Map<number, WarAllInUnit[]>();
  sorted.forEach((u, i) => {
    const root = find(i);
    let arr = byRoot.get(root);
    if (arr === undefined) {
      arr = [];
      byRoot.set(root, arr);
    }
    arr.push(u);
  });

  // 2) Dla kazdej grupy: kotwica (najblizej sredniej) i cel (najblizsza stolica od kotwicy).
  const clusters: Cluster[] = [];
  for (const members of byRoot.values()) {
    let sq = 0;
    let sr = 0;
    for (const m of members) {
      sq += m.q;
      sr += m.r;
    }
    const mq = sq / members.length;
    const mr = sr / members.length;
    let anchor = members[0]!;
    let bestD = Infinity;
    for (const m of members) {
      const d = Math.abs(m.q - mq) + Math.abs(m.r - mr);
      if (d < bestD) {
        bestD = d;
        anchor = m; // members posortowane po id => remis wygrywa mniejsze id
      }
    }
    const target = nearestTarget(anchor.q, anchor.r, targets)!;
    clusters.push({
      members,
      anchor,
      target,
      distToTarget: hexDistance(anchor.q, anchor.r, target.q, target.r),
      minId: members[0]!.id,
    });
  }

  // 3) Per cel: calkowity porzadek grup (rozmiar malejaco, blizej celu, id) i rendezvous
  //    do najblizszej grupy ktora stoi WCZESNIEJ w porzadku (head idzie na stolice).
  const clustersByTarget = new Map<string, Cluster[]>();
  for (const c of clusters) {
    let arr = clustersByTarget.get(c.target.cityId);
    if (arr === undefined) {
      arr = [];
      clustersByTarget.set(c.target.cityId, arr);
    }
    arr.push(c);
  }
  const targetKeys = [...clustersByTarget.keys()].sort();
  for (const tk of targetKeys) {
    const list = clustersByTarget.get(tk)!;
    list.sort((a, b) =>
      b.members.length - a.members.length
      || a.distToTarget - b.distToTarget
      || (a.minId < b.minId ? -1 : a.minId > b.minId ? 1 : 0));
    plan.groupsByTarget[tk] = list.map(c => c.members.length);
    for (let ci = 0; ci < list.length; ci++) {
      const c = list[ci]!;
      let rendezvous: Cluster | undefined;
      if (ci > 0 && c.distToTarget > WAR_ALLIN_NO_MERGE_NEAR_CAPITAL) {
        let bestD = Infinity;
        for (let pi = 0; pi < ci; pi++) {
          const p = list[pi]!;
          const d = hexDistance(c.anchor.q, c.anchor.r, p.anchor.q, p.anchor.r);
          if (d <= WAR_ALLIN_MERGE_RADIUS && d < bestD) {
            bestD = d;
            rendezvous = p;
          }
        }
      }
      for (const u of c.members) {
        let step: { q: number; r: number } | null = null;
        let mode: WarAllInOrder['mode'] = 'capital';
        if (rendezvous !== undefined) {
          // Cel zbiorki = kotwica wiekszej grupy (krok na zajety heks odpada -> marsz na stolice).
          const s = stepToCluster(u, c, rendezvous);
          if (s !== null && !nav.blocked.has(keyOf(s.q, s.r))) {
            step = s;
            mode = 'rendezvous';
          }
        }
        if (step === null) {
          const s = stepToTarget(u, c.target);
          if (s !== null) {
            step = s;
            mode = 'capital';
          } else {
            // Brak sciezki do najblizszej stolicy -- probuj pozostale (deterministycznie od najblizszej).
            const others = [...targets]
              .filter(t => t.cityId !== c.target.cityId)
              .sort((a, b) =>
                hexDistance(u.q, u.r, a.q, a.r) - hexDistance(u.q, u.r, b.q, b.r) || cmpTarget(a, b));
            for (const t of others) {
              const s2 = stepToTarget(u, t);
              if (s2 !== null) {
                step = s2;
                plan.orders.push({
                  unitId: u.id, step: s2, targetCityId: t.cityId, targetOwnerId: t.ownerId, mode: 'capital',
                });
                break;
              }
            }
            if (step === null) plan.noPath.push(u.id);
            continue;
          }
        }
        plan.orders.push({
          unitId: u.id,
          step,
          targetCityId: c.target.cityId,
          targetOwnerId: c.target.ownerId,
          mode,
        });
      }
    }
  }
  return plan;
}
