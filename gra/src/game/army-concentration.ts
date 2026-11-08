/**
 * Owner-agnostic concentration gate for active field armies.
 *
 * This module only chooses a real rally hex and the units that must wait for
 * the physical stack. Movement itself remains the caller's existing
 * pathfinding/executor path; no position or power is mutated here.
 */

import type { RuntimeUnit } from '../units/setup';
import { hexDistance, isCivilianUnit } from '../units/setup';
import { assignSharedStackGroupId } from './armyMerge';
import { WAR_ALLIN_MERGE_RADIUS } from './warAllInCapital';

export const ARMY_CONCENTRATION_MIN_UNITS = 3;
export const ARMY_CONCENTRATION_RADIUS = 4;

export interface ArmyConcentrationPlan {
  ownerId: number;
  rallyPoint: { q: number; r: number };
  unitIds: readonly string[];
  moveUnitIds: readonly string[];
  deferredUnitIds: readonly string[];
}

export interface ArmyConcentrationOptions {
  excludedUnitIds?: ReadonlySet<string>;
}

/**
 * Front separation radius (R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1, GOAL pkt 1).
 * Reused, not new: this is the SAME distance `ARMY_CONCENTRATION_RADIUS` already
 * uses to decide "these units count as one army" on the owner's side. Applying it
 * symmetrically to enemy positions keeps the definition consistent — an enemy
 * grouping our own mechanism would treat as one army is, by the same rule, one
 * front — instead of inventing a second, unrelated threshold.
 */
export const ARMY_FRONT_SEPARATION_RADIUS = ARMY_CONCENTRATION_RADIUS;

type ConcentrationUnit = RuntimeUnit & { seaRaider?: boolean };

interface ProximityUnit {
  id: string;
  q: number;
  r: number;
}

function compareProximity(a: ProximityUnit, b: ProximityUnit): number {
  return a.q - b.q || a.r - b.r || a.id.localeCompare(b.id);
}

/**
 * Partition `items` into connected components under the "within `radius`"
 * relation (single-linkage / BFS over hex distance). Deterministic: seed order
 * and traversal are stable-sorted by (q, r, id), and each returned group is
 * sorted the same way. Owner-agnostic and side-agnostic — used both for the
 * AI's own unit clusters and for grouping enemy units into threat fronts.
 */
export function clusterUnitsByProximity<T extends ProximityUnit>(
  items: readonly T[],
  radius: number,
): T[][] {
  const sorted = [...items].sort(compareProximity);
  const n = sorted.length;
  const visited = new Array<boolean>(n).fill(false);
  const clusters: T[][] = [];
  for (let i = 0; i < n; i++) {
    if (visited[i] === true) continue;
    const group: T[] = [];
    const queue: number[] = [i];
    visited[i] = true;
    while (queue.length > 0) {
      const idx = queue.shift();
      if (idx === undefined) break;
      const current = sorted[idx];
      if (current === undefined) continue;
      group.push(current);
      for (let j = 0; j < n; j++) {
        if (visited[j] === true) continue;
        const candidate = sorted[j];
        if (candidate === undefined) continue;
        if (hexDistance(current.q, current.r, candidate.q, candidate.r) <= radius) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }
    group.sort(compareProximity);
    clusters.push(group);
  }
  return clusters;
}

/** Contract predicate for an active land combat unit. */
export function isEligibleForArmyConcentration(
  unit: ConcentrationUnit,
  ownerId?: number,
): boolean {
  if (ownerId !== undefined && unit.ownerId !== ownerId) return false;
  if (unit.ruchLeft <= 0) return false;
  if (isCivilianUnit(unit)) return false;
  if (unit.inGarnizon === true) return false;
  if (unit.oblegaCityId !== undefined) return false;
  if (unit.embarked === true || unit.seaRaider === true) return false;
  // Naval units are combat units but not land units. A land unit on water is
  // already excluded above by `embarked`; category is the canonical runtime
  // discriminator for a native naval unit.
  if (unit.category === 'galera') return false;
  return true;
}

function compareUnits(a: ConcentrationUnit, b: ConcentrationUnit): number {
  return a.q - b.q || a.r - b.r || a.id.localeCompare(b.id);
}

/**
 * Find the active field roster that a newly completed AI unit may join on its
 * birth hex.  This is deliberately narrower than a general merge prompt:
 * owner `0` (the human player) is never accepted, every member must pass the
 * same land-combat eligibility gate as army concentration, and the roster is
 * limited to the physical birth hex.  The function only selects references;
 * it does not change positions, power/cost data, ownership, or stack identity.
 */
export function findAiRecruitmentMergeStack(
  ownerId: number,
  recruitedUnitId: string,
  units: readonly RuntimeUnit[],
): RuntimeUnit[] {
  if (ownerId <= 0) return [];
  const recruited = units.find(u => u.id === recruitedUnitId);
  if (
    recruited === undefined
    || recruited.ownerId !== ownerId
    || !isEligibleForArmyConcentration(recruited, ownerId)
  ) {
    return [];
  }
  return units
    .filter(u =>
      u.q === recruited.q
      && u.r === recruited.r
      && isEligibleForArmyConcentration(u, ownerId),
    )
    .sort(compareUnits);
}

/**
 * Complete the narrow AI recruitment-to-army handoff at the production
 * completion boundary.  The caller supplies the canonical owner classifier so
 * every human hot-seat owner remains a no-op; this function only changes the
 * existing stack identity after the completed unit is in `units`.
 */
export function mergeCompletedAiRecruitment(
  ownerId: number,
  recruitedUnitId: string,
  units: readonly RuntimeUnit[],
  isAiOwner: (ownerId: number) => boolean,
): boolean {
  if (ownerId <= 0 || !isAiOwner(ownerId)) return false;
  const stack = findAiRecruitmentMergeStack(ownerId, recruitedUnitId, units);
  if (stack.length < 2) return false;
  assignSharedStackGroupId(stack);
  return true;
}

/**
 * Select one deterministic local army and its physical rally point.
 *
 * A candidate is the current hex of one eligible unit. The winning candidate
 * maximizes the number of eligible units in radius 4, then minimizes the
 * distance sum, then uses q/r/id as stable tie-breakers. The point is always
 * an occupied real hex, so the caller can move units there with normal
 * pathfinding and obtain a real same-hex roster.
 */
export function planArmyConcentration(
  ownerId: number,
  units: readonly ConcentrationUnit[],
  options: ArmyConcentrationOptions = {},
): ArmyConcentrationPlan | null {
  const eligible = units
    .filter(u => !options.excludedUnitIds?.has(u.id))
    .filter(u => isEligibleForArmyConcentration(u, ownerId))
    .sort(compareUnits);
  if (eligible.length < ARMY_CONCENTRATION_MIN_UNITS) return null;

  let best: { anchor: ConcentrationUnit; group: ConcentrationUnit[]; sum: number } | null = null;
  for (const anchor of eligible) {
    const group = eligible.filter(u =>
      hexDistance(anchor.q, anchor.r, u.q, u.r) <= ARMY_CONCENTRATION_RADIUS,
    );
    if (group.length < ARMY_CONCENTRATION_MIN_UNITS) continue;
    const sum = group.reduce(
      (total, u) => total + hexDistance(anchor.q, anchor.r, u.q, u.r),
      0,
    );
    if (
      best === null
      || group.length > best.group.length
      || (group.length === best.group.length && sum < best.sum)
      || (group.length === best.group.length && sum === best.sum && compareUnits(anchor, best.anchor) < 0)
    ) {
      best = { anchor, group, sum };
    }
  }
  if (best === null) return null;

  const unitIds = best.group.map(u => u.id);
  const gathered = best.group.every(u => u.q === best.anchor.q && u.r === best.anchor.r);
  return {
    ownerId,
    rallyPoint: { q: best.anchor.q, r: best.anchor.r },
    unitIds,
    moveUnitIds: gathered
      ? []
      : best.group.filter(u => u.id !== best.anchor.id).map(u => u.id),
    deferredUnitIds: gathered ? [] : unitIds,
  };
}

function centroidOf(group: readonly ConcentrationUnit[]): { q: number; r: number } {
  const q = group.reduce((sum, u) => sum + u.q, 0) / group.length;
  const r = group.reduce((sum, u) => sum + u.r, 0) / group.length;
  return { q: Math.round(q), r: Math.round(r) };
}

/** A stable, already-known concentration hub the caller wants merges to prefer —
 *  e.g. the roster `planArmyConcentration` already selected this same turn.
 *  It has weight (size) and a position, but no movable unit list of its own. */
export interface ArmyFrontAnchorHint {
  q: number;
  r: number;
  weight: number;
}

export interface ArmyFrontMergeOptions {
  /** Units to leave out entirely — home defenders, units already claimed by
   *  `planArmyConcentration` this turn, units already committed to combat. */
  excludedUnitIds?: ReadonlySet<string>;
  /** Docelowa liczba klastrów własnych jednostek (GOAL pkt 1 — liczba
   *  rozpoznanych frontów zagrożenia, co najmniej 1). */
  targetClusterCount: number;
  /** Already-known stable hubs (e.g. this turn's `planArmyConcentration` pick)
   *  that should count as candidate merge targets even though their units are
   *  not part of `units` passed here. */
  preferredAnchors?: readonly ArmyFrontAnchorHint[];
}

export interface ArmyFrontMergeOrder {
  unitId: string;
  towardQ: number;
  towardR: number;
}

export interface ArmyFrontMergePlan {
  ownerId: number;
  moveOrders: readonly ArmyFrontMergeOrder[];
  deferredUnitIds: readonly string[];
}

interface FrontMergeEntry {
  q: number;
  r: number;
  weight: number;
  unitIds: readonly string[];
}

/**
 * When the AI has more separate unit clusters than the recognized number of
 * threat fronts warrants, march the smaller/excess clusters toward the
 * nearest bigger (or already-known preferred) cluster — the GOAL-pkt-2
 * counterpart to `planArmyConcentration`'s local, single-cluster gather.
 *
 * Clusters are the same connected-components grouping used for threat fronts
 * (`clusterUnitsByProximity`, radius `ARMY_CONCENTRATION_RADIUS`). The
 * `targetClusterCount` biggest clusters/anchors are kept as-is; every other
 * cluster's eligible units get one march order toward the nearest kept
 * anchor's position. Returns null when there is nothing to merge (already at
 * or below the target, or no eligible units at all).
 */
export function planArmyFrontMerge(
  ownerId: number,
  units: readonly ConcentrationUnit[],
  options: ArmyFrontMergeOptions,
): ArmyFrontMergePlan | null {
  const eligible = units
    .filter(u => !options.excludedUnitIds?.has(u.id))
    .filter(u => isEligibleForArmyConcentration(u, ownerId))
    .sort(compareUnits);

  const movableClusters = eligible.length > 0
    ? clusterUnitsByProximity(eligible, ARMY_CONCENTRATION_RADIUS)
    : [];

  const entries: FrontMergeEntry[] = movableClusters.map(group => {
    const c = centroidOf(group);
    return { q: c.q, r: c.r, weight: group.length, unitIds: group.map(u => u.id) };
  });
  for (const anchor of options.preferredAnchors ?? []) {
    entries.push({ q: anchor.q, r: anchor.r, weight: anchor.weight, unitIds: [] });
  }

  const target = Math.max(1, options.targetClusterCount);
  if (entries.length <= target) return null;

  const ranked = [...entries].sort((a, b) => b.weight - a.weight || a.q - b.q || a.r - b.r);
  const anchors = ranked.slice(0, target);
  const excess = ranked.slice(target).filter(e => e.unitIds.length > 0);
  if (excess.length === 0) return null;

  const firstAnchor = anchors[0];
  if (firstAnchor === undefined) return null; // unreachable: target >= 1 and anchors.length === target here

  const moveOrders: ArmyFrontMergeOrder[] = [];
  const deferredUnitIds: string[] = [];
  for (const ex of excess) {
    let bestAnchor = firstAnchor;
    let bestDist = hexDistance(ex.q, ex.r, firstAnchor.q, firstAnchor.r);
    for (const anchor of anchors) {
      const d = hexDistance(ex.q, ex.r, anchor.q, anchor.r);
      const better = d < bestDist
        || (d === bestDist && (anchor.q < bestAnchor.q
          || (anchor.q === bestAnchor.q && anchor.r < bestAnchor.r)));
      if (better) {
        bestDist = d;
        bestAnchor = anchor;
      }
    }
    for (const unitId of ex.unitIds) {
      moveOrders.push({ unitId, towardQ: bestAnchor.q, towardR: bestAnchor.r });
      deferredUnitIds.push(unitId);
    }
  }
  return { ownerId, moveOrders, deferredUnitIds };
}

// ---------------------------------------------------------------------------
// R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1 -- armia zastepcza w wojnie.
//
// Przyczyna (zmierzona, tools/ai-army-replacement-sim.cjs): w wojnie `planWarAllInCapital`
// grupuje jednostki lancuchowo (link 3) i wysyla KAZDA grupe -- takze 1-2 swiezo zrekrutowane
// jednostki po zniszczeniu glownej armii -- samodzielnie na cel. Nowe jednostki rekrutowane w
// roznych miastach nie maja wspolnego punktu zbiorki, wiec "trickluja" na front pojedynczo.
// Regula: jednostka spoza zadnego skupiska >= ARMY_CONCENTRATION_MIN_UNITS (w promieniu
// ARMY_CONCENTRATION_RADIUS) NIE maszeruje na cel, tylko zbiera sie w JEDNYM miescie
// zbiorki (wlasne miasto najblizsze celow wojny). Gdy zbierze sie prog -- skupisko staje sie
// nowa armia glowna i normalnie rusza (progi i promien: te same stale co planArmyConcentration).
// ---------------------------------------------------------------------------

/**
 * Limity zastoju. Luzna jednostka przestaje czekac i rusza na cel jak przed bramka, gdy:
 *  - przez MAX_WAIT_TURNS tur WSZYSTKIE luzne jednostki stoja juz w miescie zbiorki (nikt nie
 *    dociera, a prog nadal niezebrany), albo
 *  - jest luzna dluzej niz MAX_LOOSE_TURNS tur lacznie (np. petla w tranzycie).
 * Zwolnienie jest lepkie, dopoki jednostka nie dolaczy do skupiska >= MIN albo zginie.
 * Zalozenie: bramka dziala tez przy < MIN jednostek lacznie (kolejne rekruty maja szanse dolaczyc);
 * koszt to jednorazowe opoznienie <= MAX_WAIT_TURNS, nie trwaly zastoj.
 */
export const WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS = 6;
export const WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS = 30;

interface RallyWaitEntry { lastTurn: number; waited: number; age: number }
const rallyWaitState = new Map<string, RallyWaitEntry>();
/** Czysci stan oczekiwania (nowa gra / testy). */
export function resetReplacementRallyState(): void { rallyWaitState.clear(); }

export interface ReplacementRallyOptions {
  ownerId: number | string;
  currentTurn?: number;
  maxWaitTurns?: number;
}

export interface ReplacementRallyCity {
  id: string;
  q: number;
  r: number;
}

export interface ReplacementRallyTarget {
  q: number;
  r: number;
}

export interface ReplacementRallyPlan {
  rallyCity: ReplacementRallyCity;
  /** Jednostki, ktore NIE maja marszu na cel w tej turze (zbieraja sie / czekaja na punkcie). */
  looseUnitIds: readonly string[];
  /** Podzbior `looseUnitIds`, ktore musza jeszcze dojsc na punkt zbiorki. */
  moveUnitIds: readonly string[];
}

/** Punkt zbiorki zastepczej: wlasne miasto najblizsze ktoregokolwiek celu wojny (stabilny remis: id). */
export function pickReplacementRallyCity<C extends ReplacementRallyCity>(
  ownCities: readonly C[],
  targets: readonly ReplacementRallyTarget[],
): C | undefined {
  let best: C | undefined;
  let bestDist = Infinity;
  for (const c of ownCities) {
    let d = Infinity;
    for (const t of targets) d = Math.min(d, hexDistance(c.q, c.r, t.q, t.r));
    if (d < bestDist || (d === bestDist && best !== undefined && c.id < best.id)) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Rozdziela jednostki wojenne na "armie" (skupiska >= MIN w promieniu RADIUS -- ruszaja jak
 * dotad) i "luzne" (reszta -- zbieraja sie w miescie zbiorki). `candidateUnits` = jednostki,
 * ktorymi wolno kierowac; `contextUnits` = dodatkowe wlasne jednostki bojowe liczone do
 * skupisk (np. juz walczace), ale nigdy nie przekierowywane. Zwraca null, gdy nie ma luznych
 * jednostek albo brak miasta/celu (zachowanie dotychczasowe).
 */
export function planWarReplacementRally(
  candidateUnits: readonly ConcentrationUnit[],
  contextUnits: readonly ConcentrationUnit[],
  ownCities: readonly ReplacementRallyCity[],
  targets: readonly ReplacementRallyTarget[],
  options?: ReplacementRallyOptions,
): ReplacementRallyPlan | null {
  if (candidateUnits.length === 0 || ownCities.length === 0 || targets.length === 0) return null;
  const candidateIds = new Set(candidateUnits.map(u => u.id));
  const all = [
    ...candidateUnits,
    ...contextUnits.filter(u => !candidateIds.has(u.id)),
  ];
  const loose = new Set<string>();
  for (const group of clusterUnitsByProximity(all, ARMY_CONCENTRATION_RADIUS)) {
    if (group.length >= ARMY_CONCENTRATION_MIN_UNITS) continue;
    for (const u of group) if (candidateIds.has(u.id)) loose.add(u.id);
  }
  const rally = pickReplacementRallyCity(ownCities, targets);
  // Stan oczekiwania: wpisy tego wlasciciela, ktore juz nie sa luzne, sa kasowane.
  const prefix = options !== undefined ? `${options.ownerId}:` : null;
  if (prefix !== null) {
    for (const key of [...rallyWaitState.keys()]) {
      if (key.startsWith(prefix) && !loose.has(key.slice(prefix.length))) rallyWaitState.delete(key);
    }
  }
  if (loose.size === 0 || rally === undefined) return null;
  if (prefix !== null && options !== undefined) {
    const maxWait = options.maxWaitTurns ?? WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS;
    const looseUnitsNow = candidateUnits.filter(u => loose.has(u.id));
    const allAtRally = looseUnitsNow.every(u => u.q === rally.q && u.r === rally.r);
    for (const u of looseUnitsNow) {
      const key = prefix + u.id;
      let entry = rallyWaitState.get(key);
      if (entry === undefined) { entry = { lastTurn: -1, waited: 0, age: 0 }; rallyWaitState.set(key, entry); }
      const newTurn = options.currentTurn === undefined || entry.lastTurn !== options.currentTurn;
      if (newTurn) {
        entry.age++;
        // Czekanie liczy sie tylko, gdy nikt juz nie jest w drodze (reszta tez stoi w miescie zbiorki).
        if (allAtRally && entry.waited < maxWait) entry.waited++;
      }
      entry.lastTurn = options.currentTurn ?? entry.lastTurn;
      // Limit wyczerpany: zwolniona (lepko) -- rusza na cel jak przed bramka.
      if (entry.waited >= maxWait || entry.age > WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS) loose.delete(u.id);
    }
    if (loose.size === 0) return null;
  }
  const looseUnits = candidateUnits.filter(u => loose.has(u.id)).sort(compareUnits);
  return {
    rallyCity: { id: rally.id, q: rally.q, r: rally.r },
    looseUnitIds: looseUnits.map(u => u.id),
    moveUnitIds: looseUnits.filter(u => u.q !== rally.q || u.r !== rally.r).map(u => u.id),
  };
}

// ---------------------------------------------------------------------------
// R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1 -- skupisko na ROZNYCH heksach to jeszcze nie armia.
//
// Przyczyna (zmierzona: tools/ai-army-scattered-merge-test.cjs + live tools/ai-army-live-measure.cjs):
// bramka zastepcza (wyzej) liczy "armie" jako skupisko >= MIN w promieniu RADIUS, a planer marszu
// wojny (`planWarAllInCapital`, rezerwacja heksu koncowego: "zero dwoch jednostek na jednym heksie")
// ustawia kazda jednostke skupiska na OSOBNYM heksie koncowym i nigdy ich nie laczy -- stos powstaje
// tylko, gdy jednostki STARTUJA z jednego heksu (wspolny krok + allowFriendlyStack). Skupisko
// rozstawione po heksach (rekrutacja w roznych miastach, rozbicie stosu przy wielu wojnach, kolumna
// po utracie stosu) maszeruje wiec cala wojne jako chmura jednoosobowych armii (zrzuty 37/38).
// Regula: zanim skupisko >= 2 jednostek na roznych heksach (promien RADIUS od heksu-kotwicy) ruszy
// na cel, schodzi sie na JEDEN heks (kotwica = heks z najwieksza liczba jednostek w promieniu) i
// scala sie (allowFriendlyStack -> assignSharedStackGroupId w main.ts); stos rusza jak dotad.
// ---------------------------------------------------------------------------

/**
 * Limit zastoju zbiorki na heksie: jednostka, ktora zbiera sie dluzej niz tyle KOLEJNYCH tur
 * (np. petla / blokada trasy), przestaje byc zbierana i rusza z marszem (lepko, do przerwy w zbieraniu).
 */
export const WAR_STACK_GATHER_MAX_TURNS = 6;

interface GatherEntry { lastTurn: number; turns: number }
const stackGatherState = new Map<string, GatherEntry>();
/**
 * Ostatnia tura planowania zbiorki per wlasciciel. Stan modulowy nie wchodzi do zapisu gry, a main.ts go nie
 * resetuje, wiec wykrywamy "cofniecie czasu" (nowa gra / wczytanie wczesniejszego zapisu w tej samej karcie):
 * tura mniejsza niz ostatnio widziana dla wlasciciela => jego wpisy sa z innej gry i sa kasowane.
 */
const stackGatherLastTurn = new Map<string, number>();
/** Czysci stan limitu zastoju (nowa gra / testy). */
export function resetStackGatherState(): void { stackGatherState.clear(); stackGatherLastTurn.clear(); }

function dropStaleOwnerGatherState(ownerKey: string, turn: number | undefined): void {
  if (turn === undefined) return;
  const prev = stackGatherLastTurn.get(ownerKey);
  if (prev !== undefined && turn < prev) {
    const prefix = `${ownerKey}:`;
    for (const key of [...stackGatherState.keys()]) if (key.startsWith(prefix)) stackGatherState.delete(key);
  }
  stackGatherLastTurn.set(ownerKey, turn);
}

export interface StackGatherOptions {
  ownerId: number | string;
  currentTurn?: number;
  /** Zbior heksow (klucz "q,r") zakazanych jako kotwica, np. blisko wrogiej armii -- grupa tam nie zbiera sie. */
  isGroupBlocked?: (anchor: { q: number; r: number }, members: readonly ConcentrationUnit[]) => boolean;
}

export interface StackGatherGroup {
  anchor: { q: number; r: number };
  /** Jednostki, ktore musza dojsc na heks kotwicy. */
  moveUnitIds: readonly string[];
  /** Jednostki juz stojace na heksie kotwicy -- czekaja bez ruchu. */
  stayUnitIds: readonly string[];
}

export interface StackGatherPlan {
  groups: readonly StackGatherGroup[];
}

/**
 * Dzieli jednostki polowe wlasciciela na grupy-zbiorki (kazda <= RADIUS od swojej kotwicy) i zwraca
 * te, w ktorych jednostki stoja na >= 2 roznych heksach. Grupa juz stojaca na jednym heksie (stos)
 * jest pomijana -- rusza jak dotad. Deterministyczne (kolejnosc q, r, id); czyste poza limitem zastoju.
 */
export function planFieldStackGather(
  candidateUnits: readonly ConcentrationUnit[],
  options: StackGatherOptions,
): StackGatherPlan | null {
  const prefix = `${options.ownerId}:`;
  const turn = options.currentTurn;
  dropStaleOwnerGatherState(String(options.ownerId), turn);
  // Limit zastoju: wpisy bez ciaglosci tur sa kasowane, a jednostki z wyczerpanym limitem pomijane.
  for (const key of [...stackGatherState.keys()]) {
    if (!key.startsWith(prefix)) continue;
    const e = stackGatherState.get(key)!;
    if (turn !== undefined && e.lastTurn < turn - 1) stackGatherState.delete(key);
  }
  // Wyczerpany limit jest lepki (wpis odswiezany co tura), dopoki jednostka nie stanie na heksie z towarzyszem.
  const exhausted = (u: ConcentrationUnit): boolean => {
    const key = prefix + u.id;
    const e = stackGatherState.get(key);
    if (e === undefined || e.turns < WAR_STACK_GATHER_MAX_TURNS) return false;
    if (candidateUnits.some(o => o.id !== u.id && o.q === u.q && o.r === u.r)) {
      stackGatherState.delete(key);
      return false;
    }
    if (turn !== undefined) e.lastTurn = turn;
    return true;
  };
  let remaining = candidateUnits.filter(u => !exhausted(u)).sort(compareUnits);
  const built: Array<{ anchor: { q: number; r: number }; move: string[]; stay: string[] }> = [];
  while (remaining.length >= 2) {
    // Kotwice = rozne heksy zajete przez jednostki (stos 100 jednostek to JEDEN kandydat, nie 100).
    const buckets = new Map<string, ConcentrationUnit[]>();
    for (const u of remaining) {
      const k = `${u.q},${u.r}`;
      let arr = buckets.get(k);
      if (arr === undefined) buckets.set(k, arr = []);
      arr.push(u);
    }
    const hexList = [...buckets.values()];
    let best: { anchor: ConcentrationUnit; members: ConcentrationUnit[]; onHex: number; sum: number } | null = null;
    for (const anchorBucket of hexList) {
      const anchor = anchorBucket[0]!;
      let count = 0;
      let sum = 0;
      for (const bkt of hexList) {
        const d = hexDistance(anchor.q, anchor.r, bkt[0]!.q, bkt[0]!.r);
        if (d <= ARMY_CONCENTRATION_RADIUS) { count += bkt.length; sum += d * bkt.length; }
      }
      const onHex = anchorBucket.length;
      if (
        best === null
        || count > best.members.length
        || (count === best.members.length && onHex > best.onHex)
        || (count === best.members.length && onHex === best.onHex && sum < best.sum)
        || (count === best.members.length && onHex === best.onHex && sum === best.sum && compareUnits(anchor, best.anchor) < 0)
      ) {
        // `members` zbudowane leniwie nizej tylko dla zwyciezcy (tu wazna jest sama liczebnosc).
        best = { anchor, members: new Array<ConcentrationUnit>(count), onHex, sum };
      }
    }
    if (best !== null) {
      const win = best.anchor;
      best.members = remaining.filter(u => hexDistance(win.q, win.r, u.q, u.r) <= ARMY_CONCENTRATION_RADIUS);
    }
    if (best === null || best.members.length < 2) break;
    const memberIds = new Set(best.members.map(u => u.id));
    remaining = remaining.filter(u => !memberIds.has(u.id));
    const stay = best.members.filter(u => u.q === best!.anchor.q && u.r === best!.anchor.r);
    const move = best.members.filter(u => u.q !== best!.anchor.q || u.r !== best!.anchor.r);
    if (options.isGroupBlocked?.({ q: best.anchor.q, r: best.anchor.r }, best.members) === true) continue;
    built.push({
      anchor: { q: best.anchor.q, r: best.anchor.r },
      move: move.map(u => u.id),
      stay: stay.map(u => u.id),
    });
  }
  // Maruderzy (pojedyncze jednostki bez pary w promieniu RADIUS) dolaczaja do najblizszej grupy/stosu,
  // jesli sa nie dalej niz WAR_ALLIN_MERGE_RADIUS od jej kotwicy -- inaczej szliby na cel przed
  // stosem, a potem wracali do miasta zbiorki jako luzni.
  for (const u of remaining) {
    let bestG: (typeof built)[number] | null = null;
    let bestD = Infinity;
    for (const g of built) {
      const d = hexDistance(u.q, u.r, g.anchor.q, g.anchor.r);
      if (d <= WAR_ALLIN_MERGE_RADIUS && d < bestD) { bestD = d; bestG = g; }
    }
    if (bestG !== null) bestG.move.push(u.id);
  }
  const groups: StackGatherGroup[] = built
    .filter(g => g.move.length > 0)
    .map(g => ({ anchor: g.anchor, moveUnitIds: g.move, stayUnitIds: g.stay }));
  if (groups.length === 0) return null;
  return { groups };
}

/** Odnotowuje, ze jednostki faktycznie zbieraly sie w tej turze (limit zastoju liczy kolejne tury). */
export function noteStackGatherTurn(ownerId: number | string, unitIds: readonly string[], currentTurn?: number): void {
  const prefix = `${ownerId}:`;
  for (const id of unitIds) {
    const key = prefix + id;
    const e = stackGatherState.get(key);
    if (e === undefined) { stackGatherState.set(key, { lastTurn: currentTurn ?? 0, turns: 1 }); continue; }
    if (currentTurn === undefined || e.lastTurn !== currentTurn) e.turns++;
    e.lastTurn = currentTurn ?? e.lastTurn;
  }
}

// ---------------------------------------------------------------------------
// R-WEB-ARMY-TO-NEAREST-LEADER-Q1 -- jednostki zbieraja sie u NAJBLIZSZEGO dostepnego wodza.
//
// Przyczyna (przed tematem): wybor wodza byl "pierwszy": main.ts planSpawnedUnitFollowGeneral
// brala units.find(isGeneral) (pierwszy na liscie), kampania AI wybierala wodza sort(id)[0]
// (main.ts prepareAiGeneralWarCampaign), a zbiorka AI szla do JEDNEGO wodza kampanii niezaleznie
// od odleglosci (ai.ts appendAiGeneralCampaignOrders). Pozostale sciezki gracza liczyly odleglosc
// w linii prostej (generals.ts nearestLivingGeneral), ignorujac brak sciezki.
// Regula: odleglosc = dlugosc realnej sciezki ruchu (null = wodz niedostepny, pomijany);
// wodz na wyprawie (w marszu na cel) jest celem tylko gdy nie ma zadnego dostepnego zbierajacego;
// remis -> wieksza armia, potem id.
// ---------------------------------------------------------------------------

export interface LeaderCandidate {
  id: string;
  q: number;
  r: number;
  /** Liczba jednostek przy wodzu (remis -> wieksza armia). */
  armySize?: number;
  /** Wodz w marszu na cel (wyprawa) -- nie jest punktem zbiorki, gdy jest dostepny zbierajacy. */
  onExpedition?: boolean;
}

/** Dlugosc realnej sciezki ruchu (liczba krokow) albo null, gdy cel jest nieosiagalny. */
export type LeaderPathLength = (
  from: { q: number; r: number },
  to: { q: number; r: number },
) => number | null;

export interface NearestLeaderChoice<T extends LeaderCandidate> {
  leader: T;
  distance: number;
}

export function pickNearestAvailableLeader<T extends LeaderCandidate>(
  from: { q: number; r: number },
  leaders: readonly T[],
  pathLength: LeaderPathLength,
): NearestLeaderChoice<T> | null {
  // Dwie fazy: najpierw wodzowie zbierajacy, wodzowie na wyprawie tylko gdy zaden zbierajacy nie jest dostepny.
  const gathering = leaders.filter(l => l.onExpedition !== true);
  const expedition = leaders.filter(l => l.onExpedition === true);
  const best = bestByPath(from, gathering, pathLength) ?? bestByPath(from, expedition, pathLength);
  return best;
}

/**
 * Liczba krokow trasy >= odleglosc heksowa, wiec wodzow przegladamy rosnaco wg linii prostej i konczymy,
 * gdy linia prosta kolejnego jest WIEKSZA niz najlepsza znaleziona trasa (remisy sprawdzane do konca).
 * Dzieki temu kosztowne liczenie trasy dotyczy zwykle 1-2 wodzow, nie wszystkich.
 */
function bestByPath<T extends LeaderCandidate>(
  from: { q: number; r: number },
  leaders: readonly T[],
  pathLength: LeaderPathLength,
): NearestLeaderChoice<T> | null {
  const ordered = leaders
    .map(leader => ({ leader, straight: hexDistance(from.q, from.r, leader.q, leader.r) }))
    .sort((a, b) => a.straight - b.straight);
  let best: NearestLeaderChoice<T> | null = null;
  for (const { leader, straight } of ordered) {
    if (best !== null && straight > best.distance) break;
    const distance = straight === 0 ? 0 : pathLength(from, { q: leader.q, r: leader.r });
    if (distance === null || !Number.isFinite(distance)) continue;
    if (best === null || distance < best.distance
      || (distance === best.distance && (
        (leader.armySize ?? 0) > (best.leader.armySize ?? 0)
        || ((leader.armySize ?? 0) === (best.leader.armySize ?? 0) && leader.id.localeCompare(best.leader.id) < 0)))) {
      best = { leader, distance };
    }
  }
  return best;
}

/** Pola jednostki potrzebne do wyboru wodza (zgodne z GeneralFollowCandidate z generals.ts). */
export interface LeaderRosterUnit {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  isGeneral?: boolean;
  hp?: number;
  dead?: boolean;
  removed?: boolean;
  routed?: boolean;
}

/**
 * Kandydaci na wodza dla `unit` (ten sam filtr zywych wodzow co nearestLivingGeneral:
 * nie dead/removed/routed, hp > 0, ten wlasciciel, nie sama jednostka). Wodz nie szuka wodza.
 */
export function collectLeaderCandidates<T extends LeaderRosterUnit>(
  unit: LeaderRosterUnit,
  roster: readonly T[],
  isOnExpedition: (leaderId: string) => boolean,
): Array<LeaderCandidate & { unit: T }> {
  if (unit.isGeneral === true || unit.dead === true || unit.removed === true || unit.routed === true) return [];
  return roster
    .filter(c => c.id !== unit.id && c.ownerId === unit.ownerId && c.isGeneral === true
      && c.dead !== true && c.removed !== true && c.routed !== true
      && (c.hp == null || c.hp > 0))
    .map(c => ({
      unit: c, id: c.id, q: c.q, r: c.r,
      armySize: roster.filter(m => m.ownerId === c.ownerId && m.q === c.q && m.r === c.r
        && m.dead !== true && m.removed !== true).length,
      onExpedition: isOnExpedition(c.id),
    }));
}

/** Najblizszy dostepny wodz (jednostka z rostera) dla `unit` -- sciezka gracza w main.ts. */
export function pickNearestLeaderUnit<T extends LeaderRosterUnit>(
  unit: LeaderRosterUnit,
  roster: readonly T[],
  isOnExpedition: (leaderId: string) => boolean,
  pathLength: LeaderPathLength,
): T | undefined {
  const leaders = collectLeaderCandidates(unit, roster, isOnExpedition);
  if (leaders.length === 0) return undefined;
  return pickNearestAvailableLeader(unit, leaders, pathLength)?.leader.unit;
}
