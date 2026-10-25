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
import warAllInParamsRaw from '../../data/war-allin-params.json';
import { hexDistance, hexNeighborCoords, keyOf, terrainMoveCost } from '../units/setup';
import {
  allocateGroupsToEnemies,
  pickEngagementArmy,
  type EngageArmyHex,
  type EnemyStrengthRef,
} from './war-rules-multiwar';

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
  /**
   * R-WEB-WAR-RULES-MULTIWAR-Q1 (tylko gdy flaga WAR_RULES_MULTIWAR_ENABLED ON; brak = baza):
   * armie wrogów w wojnie z wołającym (W1), promień zaangażowania (W1), siła przeciwników (W2).
   */
  enemyArmies?: readonly EngageArmyHex[];
  engageRadius?: number;
  enemyStrength?: readonly EnemyStrengthRef[];
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
  /** Heksy STATYCZNIE nietranzytowe (pole odleglosci je omija): obce miasta. */
  blocked: ReadonlySet<string>;
  /**
   * Heksy zajete przez jednostki. NIE wchodza do pola odleglosci (trasa nie zalezy od chwilowych
   * pozycji -> brak krokow wstecz), tylko ograniczaja wybor kroku: jednostka nie wchodzi na heks
   * zajety lub zarezerwowany przez inna jednostke planu, chyba ze jego wlasciciel odchodzi
   * wczesniej w kolejnosci rozkazow (`plan.orders` sa wykonywane w tej kolejnosci).
   */
  occupied?: ReadonlySet<string>;
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
  // Tylko ustalone (settled) wartosci sa ostateczne -- wczesne wyjscie zostawia tentatywne.
  const out = new Map<string, number>();
  for (const k of settled) out.set(k, dist.get(k)!);
  return out;
}

export interface WarAllInUnit {
  id: string;
  q: number;
  r: number;
  /**
   * R-WEB-AI-MOVE-RANGE-Q1: budżet ruchu w tej turze. Brak pola = 1 heks (dawne
   * zachowanie); wołający z jednostkami gry przekazuje `ruchLeft`.
   */
  ruchLeft?: number;
}

export interface WarAllInOrder {
  unitId: string;
  /** Pierwszy krok trasy (jak w pozostalych komendach `move` AI). */
  step: { q: number; r: number };
  targetCityId: string;
  targetOwnerId: number;
  /**
   * 'capital' -- marsz na stolice; 'rendezvous' -- dolaczanie do wiekszej grupy po drodze;
   * 'engage' -- (R-WEB-WAR-RULES-MULTIWAR-Q1, W1) marsz na najblizsza wroga armie w promieniu.
   */
  mode: 'capital' | 'rendezvous' | 'engage';
}

/**
 * R-WEB-WAR-RULES-MULTIWAR-Q1: opcjonalne dane reguł wielu wojen. Brak pola / pusta tablica
 * = dotychczasowe zachowanie (flaga OFF nie przekazuje nic). Patrz `war-rules-multiwar.ts`.
 */
export interface WarAllInPlanOpts {
  /** W1: armie wrogich cywilizacji (w stanie wojny z wołającym), heksy + właściciel. */
  enemyArmies?: ReadonlyArray<EngageArmyHex>;
  /** W1: promień zaangażowania w heksach (od kotwicy grupy). */
  engageRadius?: number;
  /** W2: siła militarna przeciwników (do proporcjonalnego przydziału całych grup). */
  enemyStrength?: ReadonlyArray<EnemyStrengthRef>;
}

export interface WarAllInPlan {
  /** Rozkazy W KOLEJNOSCI WYKONANIA (przod kolumny pierwszy -- zwalnia heksy tylnym). */
  orders: WarAllInOrder[];
  /** Jednostki bez sciezki do zadnej stolicy (morze) -- zostaja na miejscu. */
  noPath: string[];
  /**
   * Jednostki ktore swiadomie stoja w tej turze (to NIE jest "brak lądu"): zablokowane przez
   * wlasne jednostki / bez kroku "do przodu", doszly na stolice, albo grupa czekajaca na
   * doganiajaca ja mniejsza grupe (zbiorka).
   */
  held: string[];
  /** Diagnostyka: liczba grup per cel (cityId -> rozmiary grup). */
  groupsByTarget: Record<string, number[]>;
}

/** Wartosci balansowe sa w `gra/data/war-allin-params.json` (nie w kodzie). Jednostki w tym dystansie (lancuchowo) tworza jedna grupe. */
export const WAR_ALLIN_LINK_RADIUS: number = warAllInParamsRaw.link_radius.wartosc;
/**
 * Grupa dolacza do wiekszej/wczesniejszej grupy tego samego celu, jesli jest nie dalej.
 * Wieksza grupa CZEKA na miejscu, dopoki doganiajaca ja grupa faktycznie sie zbliza (inaczej
 * obie szlyby 1 heks/ture i odstep nigdy by sie nie zmniejszyl) -- zbiorka trwa najwyzej tyle
 * tur, ile heksow dzieli grupy.
 */
export const WAR_ALLIN_MERGE_RADIUS: number = warAllInParamsRaw.merge_radius.wartosc;
/** Blisko stolicy nie zbieramy sie -- natarcie. */
export const WAR_ALLIN_NO_MERGE_NEAR_CAPITAL: number = warAllInParamsRaw.no_merge_near_capital.wartosc;

interface Cluster {
  members: WarAllInUnit[];
  anchor: WarAllInUnit;
  target: WarCapitalTarget;
  distToTarget: number;
  minId: string;
  /** Wieksza grupa tego samego celu, do ktorej ta dolacza (undefined = glowa/maszeruje). */
  rendezvous?: Cluster;
  /** W1: najbliższa wroga armia w promieniu zaangażowania (undefined = brak -> marsz na stolicę). */
  engage?: EngageArmyHex;
}

/** Cel kroku: pole odleglosci + heks docelowy. */
interface Goal {
  field: Map<string, number>;
  destKey: string;
  destQ: number;
  destR: number;
  target: WarCapitalTarget;
  mode: WarAllInOrder['mode'];
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

type StepResult =
  | { kind: 'step'; q: number; r: number }
  | { kind: 'hold' }
  | { kind: 'nopath' };

interface StepState {
  occupied: Set<string>;
  claimed: Set<string>;
  vacated: Set<string>;
}

/**
 * Pierwszy krok jednostki wg pola odleglosci. Nigdy nie cofa: wybiera sasiada STRICTE blizszego
 * celu w polu (dn < D[u]); gdy wolnych brak (zablokowany przez wlasne jednostki) -- krok boczny
 * (rowne pole, dystans heksowy do celu nie rosnie); inaczej 'hold' (stoi; to nie "brak lądu").
 */
function isFreeFor(nav: WarAllInNav, g: Goal, st: StepState, nk: string): boolean {
  if (st.claimed.has(nk)) return false;
  if (nk !== g.destKey && nav.blocked.has(nk)) return false;
  if (st.occupied.has(nk) && !st.vacated.has(nk)) return false;
  return true;
}

/**
 * R-WEB-AI-MOVE-RANGE-Q1: od pierwszego kroku `first` jednostka idzie dalej po
 * polu odległości (wyłącznie krokami ZBLIŻAJĄCYMI, dn < poprzednie) tak długo, jak
 * mieści się w `budget` (koszt terenu jak w computeReachable). Heks docelowy jest
 * dopuszczalny jak u gracza (wejście w tej samej turze), o ile jest wolny i nie jest
 * obcym miastem (`nav.blocked`); obcego miasta/zajętego celu nie wchodzi (atak/przejęcie
 * zostaje w istniejącej logice). Nie wchodzi na heksy zajęte/zarezerwowane.
 * Zwraca pełną listę heksów trasy (pierwszy = `first`); ostatni = rozkaz `step`.
 */
function extendWalk(
  nav: WarAllInNav,
  g: Goal,
  st: StepState,
  first: { q: number; r: number },
  budget: number,
): Array<{ q: number; r: number }> {
  const walk: Array<{ q: number; r: number }> = [first];
  const firstHex = nav.map.hexes[keyOf(first.q, first.r)];
  if (firstHex === undefined) return walk;
  let spent = terrainMoveCost(firstHex);
  const firstKey = keyOf(first.q, first.r);
  let curDist = g.field.get(firstKey);
  if (!(budget > 1) || firstKey === g.destKey || spent === Infinity || curDist === undefined) return walk;
  let cur = first;
  for (;;) {
    let best: { q: number; r: number; dn: number; enter: number } | null = null;
    for (const n of hexNeighborCoords(cur.q, cur.r)) {
      const nk = keyOf(n.q, n.r);
      if (nk === g.destKey && nav.blocked.has(nk)) continue;
      const dn = g.field.get(nk);
      if (dn === undefined || dn >= (curDist as number)) continue;
      const hex = nav.map.hexes[nk];
      if (hex === undefined) continue;
      const enter = terrainMoveCost(hex);
      if (enter === Infinity || spent + enter > budget) continue;
      if (!isFreeFor(nav, g, st, nk)) continue;
      if (best === null || dn < best.dn
        || (dn === best.dn && (n.q < best.q || (n.q === best.q && n.r < best.r)))) {
        best = { q: n.q, r: n.r, dn, enter };
      }
    }
    if (best === null) break;
    walk.push({ q: best.q, r: best.r });
    spent += best.enter;
    curDist = best.dn;
    cur = best;
  }
  return walk;
}

function chooseStep(
  nav: WarAllInNav,
  g: Goal,
  u: WarAllInUnit,
  st: StepState,
): StepResult {
  const uk = keyOf(u.q, u.r);
  if (uk === g.destKey) return { kind: 'hold' };
  const du = g.field.get(uk);
  if (du === undefined) return { kind: 'nopath' };
  const isFree = (nk: string): boolean => isFreeFor(nav, g, st, nk);
  const uDist = hexDistance(u.q, u.r, g.destQ, g.destR);
  let prog: { q: number; r: number } | null = null;
  let progCost = Infinity;
  let side: { q: number; r: number } | null = null;
  let sideDist = Infinity;
  for (const n of hexNeighborCoords(u.q, u.r)) {
    const nk = keyOf(n.q, n.r);
    const dn = g.field.get(nk);
    if (dn === undefined) continue;
    const hex = nav.map.hexes[nk];
    if (hex === undefined) continue;
    let enter: number;
    if (nk === g.destKey) {
      enter = terrainMoveCost(hex) === Infinity ? 1 : terrainMoveCost(hex);
    } else {
      enter = terrainMoveCost(hex);
      if (enter === Infinity) continue;
    }
    if (!isFree(nk)) continue;
    if (dn < du) {
      const total = enter + dn;
      if (total < progCost || (total === progCost && prog !== null && (n.q < prog.q || (n.q === prog.q && n.r < prog.r)))) {
        progCost = total;
        prog = { q: n.q, r: n.r };
      }
    } else if (dn === du) {
      const hd = hexDistance(n.q, n.r, g.destQ, g.destR);
      if (hd <= uDist && (hd < sideDist || (hd === sideDist && side !== null && (n.q < side.q || (n.q === side.q && n.r < side.r))))) {
        sideDist = hd;
        side = { q: n.q, r: n.r };
      }
    }
  }
  const pick = prog ?? side;
  return pick !== null ? { kind: 'step', q: pick.q, r: pick.r } : { kind: 'hold' };
}

/**
 * Planuje rozkazy "cala armia na stolice". `units` = jednostki bojowe ktore maja dostac
 * rozkaz (wolajacy filtruje: bez cywilow/zwiadowcow, z ruchLeft > 0). `nav.blocked` = obce
 * miasta (statyczne); `nav.occupied` = heksy zajete przez jednostki (tez te spoza `units`).
 * Wolajacy MUSI wykonywac `plan.orders` w zwroconej kolejnosci.
 */
export function planWarAllInCapital(
  units: readonly WarAllInUnit[],
  targets: readonly WarCapitalTarget[],
  nav: WarAllInNav,
  opts: WarAllInPlanOpts = {},
): WarAllInPlan {
  const allStartKeys = new Set(units.map(u => keyOf(u.q, u.r)));
  const fieldCache = new Map<string, Map<string, number>>();
  const targetGoal = (t: WarCapitalTarget): Goal => {
    const dk = keyOf(t.q, t.r);
    let f = fieldCache.get(dk);
    if (f === undefined) {
      f = distanceField(nav, t.q, t.r, allStartKeys);
      fieldCache.set(dk, f);
    }
    return { field: f, destKey: dk, destQ: t.q, destR: t.r, target: t, mode: 'capital' };
  };
  const engageGoal = (c: Cluster, hex: EngageArmyHex): Goal => ({
    field: distanceField(nav, hex.q, hex.r, new Set(c.members.map(m => keyOf(m.q, m.r)))),
    destKey: keyOf(hex.q, hex.r),
    destQ: hex.q,
    destR: hex.r,
    target: c.target,
    mode: 'engage',
  });
  const clusterGoal = (from: Cluster, to: Cluster): Goal => ({
    field: distanceField(nav, to.anchor.q, to.anchor.r, new Set(from.members.map(m => keyOf(m.q, m.r)))),
    destKey: keyOf(to.anchor.q, to.anchor.r),
    destQ: to.anchor.q,
    destR: to.anchor.r,
    target: from.target,
    mode: 'rendezvous',
  });
  const plan: WarAllInPlan = { orders: [], noPath: [], held: [], groupsByTarget: {} };
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

  // 2a) R-WEB-WAR-RULES-MULTIWAR-Q1, W2: przydział CAŁYCH grup do wrogów proporcjonalnie do
  //     siły (przy k>1 wojnach). Grupy nie są dzielone; cel grupy = najbliższa stolica przydzielonego wroga.
  if (opts.enemyStrength !== undefined && opts.enemyStrength.length > 0) {
    const enemyOwners = new Set(targets.map(t => t.ownerId));
    const enemies = opts.enemyStrength.filter(e => enemyOwners.has(e.ownerId));
    if (enemies.length > 0) {
      const alloc = allocateGroupsToEnemies(
        clusters.map(c => ({ id: c.minId, size: c.members.length })),
        enemies,
      );
      for (const c of clusters) {
        const owner = alloc.get(c.minId);
        if (owner === undefined) continue;
        const own = targets.filter(t => t.ownerId === owner);
        if (own.length === 0) continue;
        c.target = nearestTarget(c.anchor.q, c.anchor.r, own)!;
        c.distToTarget = hexDistance(c.anchor.q, c.anchor.r, c.target.q, c.target.r);
      }
    }
  }
  // 2b) R-WEB-WAR-RULES-MULTIWAR-Q1, W1: grupa z wrogą armią w promieniu zaangażowania najpierw
  //     z nią walczy (marsz do niej, zatrzymanie przy kontakcie); bez takiej armii -> stolica.
  if (opts.enemyArmies !== undefined && opts.enemyArmies.length > 0) {
    const radius = opts.engageRadius ?? 0;
    for (const c of clusters) {
      const hit = pickEngagementArmy(c.anchor, opts.enemyArmies, hexDistance, radius);
      if (hit !== null) c.engage = hit;
    }
  }
  // 3) Per cel: calkowity porzadek grup (rozmiar malejaco, blizej celu, id); kazda grupa poza
  //    pierwsza dolacza do najblizszej grupy stojacej WCZESNIEJ w porzadku (glowa maszeruje).
  const clustersByTarget = new Map<string, Cluster[]>();
  for (const c of clusters) {
    let arr = clustersByTarget.get(c.target.cityId);
    if (arr === undefined) {
      arr = [];
      clustersByTarget.set(c.target.cityId, arr);
    }
    arr.push(c);
  }
  for (const tk of [...clustersByTarget.keys()].sort()) {
    const list = clustersByTarget.get(tk)!;
    list.sort((a, b) =>
      b.members.length - a.members.length
      || a.distToTarget - b.distToTarget
      || (a.minId < b.minId ? -1 : a.minId > b.minId ? 1 : 0));
    plan.groupsByTarget[tk] = list.map(c => c.members.length);
    for (let ci = 1; ci < list.length; ci++) {
      const c = list[ci]!;
      if (c.distToTarget <= WAR_ALLIN_NO_MERGE_NEAR_CAPITAL) continue;
      if (c.engage !== undefined) continue;
      let bestD = Infinity;
      for (let pi = 0; pi < ci; pi++) {
        const p = list[pi]!;
        if (p.engage !== undefined) continue;
        const d = hexDistance(c.anchor.q, c.anchor.r, p.anchor.q, p.anchor.r);
        if (d <= WAR_ALLIN_MERGE_RADIUS && d < bestD) {
          bestD = d;
          c.rendezvous = p;
        }
      }
    }
  }

  // 4) Rozstrzyganie krokow. Kolejnosc: front kolumny pierwszy (najmniejsza odleglosc w polu
  //    celu), wiec jednostki z tylu moga wejsc na heksy zwolnione przez przednie; kazdy
  //    wybrany heks jest rezerwowany (zero dwoch jednostek na tym samym heksie docelowym).
  const st: StepState = {
    occupied: new Set(nav.occupied ?? []),
    claimed: new Set(),
    vacated: new Set(),
  };
  for (const u of units) st.occupied.add(keyOf(u.q, u.r));
  const emit = (u: WarAllInUnit, g: Goal, walk: ReadonlyArray<{ q: number; r: number }>): void => {
    for (const h of walk) st.claimed.add(keyOf(h.q, h.r));
    st.vacated.add(keyOf(u.q, u.r));
    const end = walk[walk.length - 1]!;
    plan.orders.push({
      unitId: u.id, step: { q: end.q, r: end.r }, targetCityId: g.target.cityId, targetOwnerId: g.target.ownerId, mode: g.mode,
    });
  };
  /**
   * Cele po kolei: krok -> rozkaz; 'hold' zbiorki -> sprobuj natarcia; 'hold' natarcia -> stoi;
   * 'nopath' -> nastepny cel; wszystkie 'nopath' => noPath (np. morze).
   */
  const resolve = (u: WarAllInUnit, c: Cluster, first: Goal | undefined): Goal | undefined => {
    let sawHold = false;
    const tryGoal = (g: Goal): 'step' | 'stop' | 'next' => {
      const res = chooseStep(nav, g, u, st);
      if (res.kind === 'step') {
        emit(u, g, extendWalk(nav, g, st, res, u.ruchLeft ?? 1));
        return 'step';
      }
      if (res.kind === 'hold') {
        sawHold = true;
        // 'engage': zatrzymanie przy kontakcie z wrogą armią (walkę prowadzi logika ataku AI).
        return g.mode === 'capital' || g.mode === 'engage' ? 'stop' : 'next';
      }
      return 'next';
    };
    if (first !== undefined) {
      const r = tryGoal(first);
      if (r === 'step') return first;
      if (r === 'stop') { plan.held.push(u.id); return undefined; }
    }
    const rc = tryGoal(targetGoal(c.target));
    if (rc === 'step') return targetGoal(c.target);
    if (rc === 'stop') { plan.held.push(u.id); return undefined; }
    const others = [...targets]
      .filter(t => t.cityId !== c.target.cityId)
      .sort((a, b) => hexDistance(u.q, u.r, a.q, a.r) - hexDistance(u.q, u.r, b.q, b.r) || cmpTarget(a, b));
    for (const t of others) {
      const g = targetGoal(t);
      const r = tryGoal(g);
      if (r === 'step') return g;
      if (r === 'stop') { plan.held.push(u.id); return undefined; }
    }
    if (sawHold) plan.held.push(u.id);
    else plan.noPath.push(u.id);
    return undefined;
  };
  /** Jeden przebieg po grupach; zwraca grupy, ktore w tym przebiegu faktycznie dolaczaja (rendezvous). */
  const runPass = (pass: Cluster[]): Set<Cluster> => {
    const entries: Array<{ u: WarAllInUnit; c: Cluster; first: Goal | undefined; key: number }> = [];
    for (const c of pass) {
      const first = c.rendezvous !== undefined
        ? clusterGoal(c, c.rendezvous)
        : c.engage !== undefined ? engageGoal(c, c.engage) : undefined;
      const primary = first ?? targetGoal(c.target);
      for (const u of c.members) {
        entries.push({ u, c, first, key: primary.field.get(keyOf(u.q, u.r)) ?? Infinity });
      }
    }
    entries.sort((a, b) => a.key - b.key || (a.u.id < b.u.id ? -1 : a.u.id > b.u.id ? 1 : 0));
    const joining = new Set<Cluster>();
    for (const e of entries) {
      const g = resolve(e.u, e.c, e.first);
      if (g !== undefined && g.mode === 'rendezvous') joining.add(e.c);
    }
    return joining;
  };
  const joiningFollowers = runPass(clusters.filter(c => c.rendezvous !== undefined));
  // Glowa czeka na miejscu, gdy doganiajaca ja grupa FAKTYCZNIE sie zbliza w tej turze
  // (inaczej obie szlyby ta sama predkoscia i odstep nigdy by sie nie zmniejszyl).
  const waiting = new Set<Cluster>();
  for (const f of joiningFollowers) {
    const p = f.rendezvous!;
    if (p.rendezvous === undefined && p.distToTarget > WAR_ALLIN_NO_MERGE_NEAR_CAPITAL) waiting.add(p);
  }
  const marching: Cluster[] = [];
  for (const h of clusters.filter(c => c.rendezvous === undefined)) {
    if (waiting.has(h)) for (const m of h.members) plan.held.push(m.id);
    else marching.push(h);
  }
  runPass(marching);
  return plan;
}
