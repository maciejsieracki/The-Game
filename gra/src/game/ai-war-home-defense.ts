/**
 * R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1 -- AI wojna: obrona WLASNEGO terenu i odbijanie
 * utraconych miast PRZED zdobywaniem cudzych (koniec symetrycznej "wymiany miast").
 *
 * Zgloszenie wlasciciela (2026-11-04, zrzut 39.webp): "jesli wojska przeciwnika, z ktorym walcza,
 * sa na terenie ich cywilizacji, wycofuja sie, by bronic swojego terenu, a nie atakowac inne miasto.
 * Obecnie jedna cywilizacja zajmuje miasta przeciwnika, a przeciwnik zajmuje jej miasta."
 *
 * DECYZJE (ABC 2026-11-04): (1) A -- najpierw wrogie wojsko na wlasnym terenie, potem cel;
 * wracamy i ZWALCZAMY (realny atak/blokada), nie tylko cofamy do miasta. (2) A -- odzyskiwanie
 * ma pierwszenstwo przed zdobywaniem: P1 odbicie wlasnych utraconych miast, P2 zwalczenie wrogiej
 * armii na wlasnym terenie, P3 zdobywanie cudzych (dotychczasowa logika, bez zmian).
 *
 * ZALOZENIA (bez pytan ABC; sa tez w raporcie):
 *  - Kolejnosc przydzialu jednostek: P2 (wrog NA WLASNYM TERENIE, pilne) przed P1 (odbicie), obie
 *    przed P3. Oba wygrywaja z P3 -- to jest sedno decyzji 2A.
 *  - "Wlasny teren" = heks z terytorium AI (opts.territoryNodes / promien miast+fortow).
 *  - Ocena sily: wspolna funkcja z atakiem ostatniej woli (siegeAi.estimateUnitCombatStrength).
 *    ATAK gdy sila WLASNYCH jednostek w poblizu >= 80% sily najezdzcow (10:8, jak ostatnia wola);
 *    ponizej -- obrona w miescie (zbiorka), bez samobojczego wypadu.
 *  - Histereza: tryb atak/obrona trzymany min. 3 tury; wejscie w atak od 80%, zejscie dopiero
 *    ponizej 60% (pasmo). Obrona w miescie max 12 tur na wroga, potem zwolnienie (brak zawieszenia AI).
 *  - Armia dowodzona/kampania kontynuuje atak, gdy zagrozenie MALE: sila najezdzcow <= 25% sily calej
 *    armii polowej -- wtedy odrywany jest tylko oddzial (najblizsze jednostki do 125% sily najezdzcow).
 *    Zagrozenie duze -> wszystkie jednostki polowe wracaja (poza tymi, ktore w tej turze atakuja
 *    albo wchodza na wrogie miasto).
 *  - Czysty modul: bez DOM/THREE; deterministyczny (sortowanie po id); pamiec histerezy w module
 *    (jak army-concentration), kluczowana wlascicielem; reset przy cofnieciu licznika tury.
 *  - Zero zmian balansu: tylko wybor celow/rozkazow.
 */

import type { RuntimeUnit } from '../units/setup';
import { isCityLostOf } from './cities';

// ---------------------------------------------------------------------------
// Stale (dokumentowane progi)
// ---------------------------------------------------------------------------

/** Wejscie w atak: sila wlasna / sila najezdzcow >= 0.8 (jak atak ostatniej woli, 10:8). */
export const HOME_WAR_ATTACK_RATIO_ENTER = 0.8;
/** Zejscie z ataku do obrony dopiero ponizej 0.6 (histereza). */
export const HOME_WAR_ATTACK_RATIO_LEAVE = 0.6;
/** Minimalna liczba tur trzymania wybranego trybu/celu (anty ping-pong). */
export const HOME_WAR_MIN_COMMIT_TURNS = 3;
/** Maksymalna liczba tur obrony w miescie przeciw jednemu wrogowi, potem zwolnienie. */
export const HOME_WAR_MAX_HOLD_TURNS = 12;
/** Zagrozenie MALE: sila najezdzcow <= 25% sily calej armii polowej. */
export const HOME_WAR_SMALL_THREAT_SHARE = 0.25;
/** Odrywany oddzial: sila >= 125% sily najezdzcow. */
export const HOME_WAR_DETACH_MARGIN = 1.25;
/** Promien "w poblizu" do oceny sily obecnej przy zagrozeniu. */
export const HOME_WAR_PRESENT_RADIUS = 8;
/** Najezdzcy w odleglosci <= tyle od siebie tworza jedno skupisko. */
export const HOME_WAR_CLUSTER_LINK = 3;
/** (Nieuzywane od R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1: odbicie bez limitu odleglosci; stala zachowana.) */
export const HOME_WAR_RECAPTURE_RADIUS = 16;
/** Odbijane miasto: po tylu turach od pierwszego zauwazenia utraty przestaje byc "swieze". */
export const HOME_WAR_RECAPTURE_MAX_AGE = 60;
/** Odbicie: sila / obrona miasta >= 1.0 (mury faworyzuja obronce), zejscie ponizej 0.8. */
export const HOME_WAR_RECAPTURE_RATIO_ENTER = 1.0;
export const HOME_WAR_RECAPTURE_RATIO_LEAVE = 0.8;

export const HOME_WAR_DEFENSE_ENABLED = true;
let overrideValue: boolean | null = null;
/** Tylko testy/pomiary: wymusza ON/OFF niezaleznie od stalej; null = wroc do stalej. */
export function setHomeWarDefenseOverride(value: boolean | null): void {
  overrideValue = value;
}
export function isHomeWarDefenseEnabled(): boolean {
  return overrideValue !== null ? overrideValue : HOME_WAR_DEFENSE_ENABLED;
}

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

export interface HomeWarCity {
  id: string;
  q: number;
  r: number;
  ownerId: number;
  capturedFromOwnerId?: number;
  /** R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1: twórca miasta (patrz cities.ts: cityFounderId). */
  foundedBy?: number;
  foundedByOwner?: boolean;
}

export type HomeWarOrder =
  | { unitId: string; kind: 'attack'; targetUnitId: string; task: 'p2' }
  | { unitId: string; kind: 'approach'; toQ: number; toR: number; task: 'p1' | 'p2'; targetCityId?: string }
  | { unitId: string; kind: 'hold'; toQ: number; toR: number; cityId: string; task: 'p1' | 'p2' };

export interface HomeWarInput {
  ownerId: number;
  /** undefined = bez pamieci histerezy (stateless). */
  currentTurn: number | undefined;
  /** Wszystkie jednostki gry (do liczenia obrony odbijanego miasta). */
  allUnits: readonly RuntimeUnit[];
  /** Jednostki wlasne (cala lista; filtr pola bitwy robi isFieldUnit). */
  myUnits: readonly RuntimeUnit[];
  myCities: readonly HomeWarCity[];
  /** Wszystkie miasta gry (kandydaci na utracone: ownerId != ownerId i capturedFromOwnerId == ownerId). */
  allCities: readonly HomeWarCity[];
  /** Jednostki cywilizacji w wojnie z wolajacym (juz przefiltrowane: wrog, nie barbarzynca). */
  enemyUnits: readonly RuntimeUnit[];
  /** Wlasciciel jest w wojnie z (bramka walki AI). */
  canEngageOwner: (ownerId: number) => boolean;
  /** Jednostki, ktore w tej turze juz atakuja / wchodza na wrogie miasto -- nie ruszane. */
  lockedUnitIds: ReadonlySet<string>;
  isOwnTerritory: (q: number, r: number) => boolean;
  /**
   * R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1: czy oblężenie miasta `cityId` kończy zagrożenie
   * (miasto utracone albo należy do cywilizacji zagrażającej mojemu terytorium) -- takie oblężenie
   * zostaje (wyjątek od odwołania). Inne oblężenia (cudze miasto z boku) są odwoływane do obrony.
   * undefined = każde oblężenie zostaje (zachowanie sprzed tematu).
   */
  isRelevantSiege?: (cityId: string) => boolean;
  strengthOf: (u: RuntimeUnit) => number;
  /** Jednostka bojowa (nie cywil, nie zwiadowca). */
  isFieldUnit: (u: RuntimeUnit) => boolean;
  distance: (aq: number, ar: number, bq: number, br: number) => number;
}

export interface HomeWarClusterInfo {
  anchorId: string;
  enemyOwnerId: number;
  size: number;
  strength: number;
  presentStrength: number;
  ratio: number;
  small: boolean;
  mode: 'attack' | 'hold' | 'released';
  assigned: number;
}

export interface HomeWarPlan {
  orders: HomeWarOrder[];
  clusters: HomeWarClusterInfo[];
  recapture: { cityId: string; mode: 'go' | 'wait'; ratio: number; assigned: number } | null;
}

interface ModeMemory { mode: 'attack' | 'hold' | 'released'; since: number }
interface HomeWarMemory {
  lastTurn: number;
  /** Tryb obrony per wrog (ownerId wroga). */
  p2: Map<number, ModeMemory>;
  /** Wybrany cel odbicia + tryb. */
  p1: { cityId: string; mode: 'go' | 'wait'; since: number } | null;
  /** Pierwsze zauwazenie utraty miasta (do starzenia). */
  lostSeen: Map<string, number>;
}

const memoryByOwner = new Map<number, HomeWarMemory>();

/** Czyszczenie pamieci histerezy (testy, nowa gra). */
export function resetHomeWarMemory(): void {
  memoryByOwner.clear();
}

function memoryFor(ownerId: number, turn: number): HomeWarMemory {
  let m = memoryByOwner.get(ownerId);
  if (m === undefined || turn < m.lastTurn) {
    m = { lastTurn: turn, p2: new Map(), p1: null, lostSeen: new Map() };
    memoryByOwner.set(ownerId, m);
  }
  m.lastTurn = turn;
  return m;
}

// ---------------------------------------------------------------------------
// Pomocnicze
// ---------------------------------------------------------------------------

function cmpId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

interface Cluster {
  members: RuntimeUnit[];
  anchor: RuntimeUnit;
  anchorCityDist: number;
  strength: number;
  enemyOwnerId: number;
}

function buildClusters(inv: RuntimeUnit[], input: HomeWarInput): Cluster[] {
  const sorted = [...inv].sort(cmpId);
  const parent = sorted.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]!; }
    return i;
  };
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (a.ownerId !== b.ownerId) continue;
      if (input.distance(a.q, a.r, b.q, b.r) <= HOME_WAR_CLUSTER_LINK) {
        const ra = find(i); const rb = find(j);
        if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
      }
    }
  }
  const groups = new Map<number, RuntimeUnit[]>();
  sorted.forEach((u, i) => {
    const k = find(i);
    const arr = groups.get(k);
    if (arr === undefined) groups.set(k, [u]); else arr.push(u);
  });
  const out: Cluster[] = [];
  for (const members of groups.values()) {
    let anchor = members[0]!;
    let best = Infinity;
    for (const m of members) {
      const d = Math.min(...input.myCities.map(c => input.distance(m.q, m.r, c.q, c.r)));
      if (d < best) { best = d; anchor = m; }
    }
    out.push({
      members, anchor, anchorCityDist: best,
      strength: members.reduce((s, m) => s + input.strengthOf(m), 0),
      enemyOwnerId: anchor.ownerId,
    });
  }
  out.sort((a, b) => a.anchorCityDist - b.anchorCityDist || cmpId(a.anchor, b.anchor));
  return out;
}

/** Tryb z histereza: pasmo 0.8/0.6 + min. 3 tury trzymania. */
function decideMode(
  prev: ModeMemory | undefined,
  ratio: number,
  turn: number | undefined,
  enter: number,
  leave: number,
): 'attack' | 'hold' {
  if (prev !== undefined && prev.mode !== 'released' && turn !== undefined) {
    const held = turn - prev.since;
    if (held < HOME_WAR_MIN_COMMIT_TURNS) return prev.mode;
    if (prev.mode === 'attack') return ratio >= leave ? 'attack' : 'hold';
    return ratio >= enter ? 'attack' : 'hold';
  }
  return ratio >= enter ? 'attack' : 'hold';
}

// ---------------------------------------------------------------------------
// Planer
// ---------------------------------------------------------------------------

export function planHomeWar(input: HomeWarInput): HomeWarPlan {
  const plan: HomeWarPlan = { orders: [], clusters: [], recapture: null };
  const turn = input.currentTurn;
  const mem = turn !== undefined ? memoryFor(input.ownerId, turn) : null;

  const field = input.myUnits.filter(u => input.isFieldUnit(u) && u.embarked !== true);
  const fieldStrengthTotal = field.reduce((s, u) => s + input.strengthOf(u), 0);
  const pool = new Map<string, RuntimeUnit>();
  for (const u of [...field].sort(cmpId)) {
    const holdsRelevantSiege = u.oblegaCityId !== undefined
      && (input.isRelevantSiege === undefined || input.isRelevantSiege(u.oblegaCityId));
    if (u.ruchLeft > 0 && !input.lockedUnitIds.has(u.id) && !holdsRelevantSiege) pool.set(u.id, u);
  }

  const initialPoolIds = new Set(pool.keys());

  // ---- P2: wrog NA WLASNYM TERENIE ----
  const invaders = input.enemyUnits.filter(
    u => input.isFieldUnit(u) && u.embarked !== true && input.isOwnTerritory(u.q, u.r),
  );
  const clusters = invaders.length > 0 && input.myCities.length > 0 ? buildClusters(invaders, input) : [];
  const seenEnemies = new Set<number>();
  for (const cl of clusters) {
    seenEnemies.add(cl.enemyOwnerId);
    const present = field.filter(u =>
      cl.members.some(m => input.distance(u.q, u.r, m.q, m.r) <= HOME_WAR_PRESENT_RADIUS),
    );
    const presentStrength = present.reduce((s, u) => s + input.strengthOf(u), 0);
    const small = cl.strength <= HOME_WAR_SMALL_THREAT_SHARE * fieldStrengthTotal;
    // Sila obecna, ktorej nie da sie przydzielic (zablokowana/bez ruchu/oblegajaca), liczy sie do potrzeby.
    const fixedStrength = present.filter(u => !initialPoolIds.has(u.id)).reduce((x, u) => x + input.strengthOf(u), 0);
    const cands = [...pool.values()].sort((a, b) =>
      input.distance(a.q, a.r, cl.anchor.q, cl.anchor.r) - input.distance(b.q, b.r, cl.anchor.q, cl.anchor.r)
      || cmpId(a, b));
    const chosen: RuntimeUnit[] = [];
    let chosenStrength = 0;
    if (small) {
      let cum = fixedStrength;
      for (const u of cands) {
        if (cum >= HOME_WAR_DETACH_MARGIN * cl.strength) break;
        const st = input.strengthOf(u);
        chosen.push(u); cum += st; chosenStrength += st;
      }
    } else {
      for (const u of cands) { chosen.push(u); chosenStrength += input.strengthOf(u); }
    }
    // Ocena szans: cala sila, ktora wezmie udzial (przydzielone jednostki + nieprzydzielalna obecna).
    const ratio = cl.strength > 0 ? (chosenStrength + fixedStrength) / cl.strength : Infinity;
    const prev = mem?.p2.get(cl.enemyOwnerId);
    let mode: 'attack' | 'hold' | 'released';
    if (prev?.mode === 'released') {
      mode = 'released';
    } else if (prev?.mode === 'hold' && turn !== undefined && turn - prev.since >= HOME_WAR_MAX_HOLD_TURNS) {
      mode = 'released';
      mem!.p2.set(cl.enemyOwnerId, { mode, since: turn });
    } else {
      mode = decideMode(prev, ratio, turn, HOME_WAR_ATTACK_RATIO_ENTER, HOME_WAR_ATTACK_RATIO_LEAVE);
      if (mem && turn !== undefined && (prev === undefined || prev.mode !== mode)) {
        mem.p2.set(cl.enemyOwnerId, { mode, since: turn });
      }
    }
    const info: HomeWarClusterInfo = {
      anchorId: cl.anchor.id, enemyOwnerId: cl.enemyOwnerId, size: cl.members.length,
      strength: cl.strength, presentStrength, ratio, small, mode, assigned: 0,
    };
    plan.clusters.push(info);
    if (mode === 'released') continue;
    if (chosen.length === 0) continue;
    info.assigned = chosen.length;

    if (mode === 'attack') {
      for (const u of chosen) {
        pool.delete(u.id);
        const adj = cl.members
          .filter(m => input.distance(u.q, u.r, m.q, m.r) === 1)
          .sort(cmpId)[0];
        if (adj !== undefined) {
          plan.orders.push({ unitId: u.id, kind: 'attack', targetUnitId: adj.id, task: 'p2' });
          continue;
        }
        let tgt = cl.members[0]!;
        let td = Infinity;
        for (const m of cl.members) {
          const d = input.distance(u.q, u.r, m.q, m.r);
          if (d < td) { td = d; tgt = m; }
        }
        plan.orders.push({ unitId: u.id, kind: 'approach', toQ: tgt.q, toR: tgt.r, task: 'p2' });
      }
    } else {
      // Obrona w miescie najblizszym najezdzcy (zbiorka) -- bez samobojczego wypadu.
      let city = input.myCities[0]!;
      let cd = Infinity;
      for (const c of input.myCities) {
        const d = input.distance(cl.anchor.q, cl.anchor.r, c.q, c.r);
        if (d < cd || (d === cd && c.id < city.id)) { cd = d; city = c; }
      }
      for (const u of chosen) {
        pool.delete(u.id);
        plan.orders.push({ unitId: u.id, kind: 'hold', toQ: city.q, toR: city.r, cityId: city.id, task: 'p2' });
      }
    }
  }
  if (mem) {
    for (const k of [...mem.p2.keys()]) if (!seenEnemies.has(k)) mem.p2.delete(k);
  }

  // ---- P1: odbicie wlasnych utraconych miast ----
  // "Utracone" = miasto ZALOZONE przeze mnie (twórca), dziś cudze -- także po wielu zmianach właściciela;
  // zdobyte cudze miasto NIE jest "moje" (cities.ts: isCityLostOf).
  const lostAll = input.allCities.filter(c =>
    isCityLostOf(c, input.ownerId) && input.canEngageOwner(c.ownerId));
  const lostIds = new Set(lostAll.map(c => c.id));
  if (mem && turn !== undefined) {
    for (const c of lostAll) if (!mem.lostSeen.has(c.id)) mem.lostSeen.set(c.id, turn);
    for (const k of [...mem.lostSeen.keys()]) if (!lostIds.has(k)) mem.lostSeen.delete(k);
  }
  // Bez limitu odleglosci (spec. wlasciciela 2026-11-08: WSZYSTKIE armie wracaja, takze te daleko w marszu).
  const lost = lostAll.filter(c => {
    if (mem && turn !== undefined) {
      const seen = mem.lostSeen.get(c.id) ?? turn;
      if (turn - seen > HOME_WAR_RECAPTURE_MAX_AGE) return false;
    }
    return true;
  });
  if (lost.length > 0 && pool.size > 0) {
    const nearOwnCity = (c: HomeWarCity): number => input.myCities.length === 0 ? 0
      : Math.min(...input.myCities.map(m => input.distance(c.q, c.r, m.q, m.r)));
    lost.sort((a, b) => nearOwnCity(a) - nearOwnCity(b) || (a.id < b.id ? -1 : 1));
    let target = lost[0]!;
    if (mem?.p1 && lost.some(c => c.id === mem.p1!.cityId)) {
      target = lost.find(c => c.id === mem.p1!.cityId)!;
    }
    const defenders = input.allUnits.filter(u =>
      u.ownerId === target.ownerId && input.isFieldUnit(u)
      && input.distance(u.q, u.r, target.q, target.r) <= 1);
    const defStrength = defenders.reduce((s, u) => s + input.strengthOf(u), 0);
    const nearForce = field;
    const nearStrength = nearForce.reduce((s, u) => s + input.strengthOf(u), 0);
    const ratio = defStrength > 0 ? nearStrength / defStrength : Infinity;
    const prev: ModeMemory | undefined = mem?.p1 && mem.p1.cityId === target.id
      ? { mode: mem.p1.mode === 'go' ? 'attack' : 'hold', since: mem.p1.since } : undefined;
    const m = decideMode(prev, ratio, turn, HOME_WAR_RECAPTURE_RATIO_ENTER, HOME_WAR_RECAPTURE_RATIO_LEAVE);
    const go = m === 'attack';
    if (mem && (mem.p1 === null || mem.p1.cityId !== target.id || (mem.p1.mode === 'go') !== go)) {
      mem.p1 = { cityId: target.id, mode: go ? 'go' : 'wait', since: turn ?? 0 };
    }
    const rec = { cityId: target.id, mode: (go ? 'go' : 'wait') as 'go' | 'wait', ratio, assigned: 0 };
    plan.recapture = rec;
    if (go) {
      const cands = [...pool.values()]
        .sort((a, b) =>
          input.distance(a.q, a.r, target.q, target.r) - input.distance(b.q, b.r, target.q, target.r)
          || cmpId(a, b));
      for (const u of cands) {
        pool.delete(u.id);
        plan.orders.push({
          unitId: u.id, kind: 'approach', toQ: target.q, toR: target.r, task: 'p1', targetCityId: target.id,
        });
        rec.assigned++;
      }
    } else if (input.myCities.length > 0) {
      // Za slabi na odbicie: zbiorka w wlasnym miescie najblizszym utraconemu (bez ofensywy w tle).
      let city = input.myCities[0]!;
      let cd = Infinity;
      for (const c of input.myCities) {
        const d = input.distance(target.q, target.r, c.q, c.r);
        if (d < cd || (d === cd && c.id < city.id)) { cd = d; city = c; }
      }
      for (const u of [...pool.values()]) {
        pool.delete(u.id);
        plan.orders.push({ unitId: u.id, kind: 'hold', toQ: city.q, toR: city.r, cityId: city.id, task: 'p1' });
        rec.assigned++;
      }
    }
  } else if (mem && lost.length === 0) {
    mem.p1 = null;
  }
  return plan;
}
