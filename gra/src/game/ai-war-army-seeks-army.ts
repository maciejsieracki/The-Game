/**
 * R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1 -- AI w wojnie: NAJWIEKSZA armia wlasna idzie
 * w pierwszej kolejnosci na NAJWIEKSZA (widoczna) armie przeciwnika, zeby stoczyc bitwe w polu,
 * zamiast mijac ja i zdobywac miasta.
 *
 * Czysty modul (bez DOM/THREE, deterministyczny: sortowanie po id). Parametry w data/ai-params.json:
 *  - ai_wojna_armia_szuka_armii_wlaczone      (1/0, domyslnie 1)
 *  - ai_wojna_armia_szuka_armii_zasieg_ruchow (N tur marszu najwolniejszej jednostki armii, domyslnie 3)
 *  - ai_wojna_armia_szuka_armii_promien_skupiska (laczenie jednostek w armie, heksy, domyslnie 3)
 *  - ai_wojna_armia_szuka_armii_zapas_zasiegu    (heksy dodawane do N*ruch w zasiegu, domyslnie 1)
 *  - ai_wojna_armia_szuka_armii_ruch_domyslny    (ruch jednostki bez pola ruch, domyslnie 2)
 *  - ai_wojna_armia_szuka_armii_prog_sil      (sila wlasna / sila wroga >= prog, domyslnie 0.8 -- ten sam
 *    stosunek 10:8 co atak ostatniej woli i obrona domu, zatwierdzony ABC 2026-11-04)
 *
 * ZALOZENIA (raport): "armia" = skupisko jednostek bojowych (laczenie <= 3 heksy); garnizon (najslabsza
 * jednostka na heksie wlasnego miasta) nie jest armia; wrog widziany tylko przez mgle AI (visibleHexes);
 * pierwszenstwo obrony domu: gdy wrog bojowy jest przy wlasnym miescie, nakladka nie dziala (rzadzi obrona).
 */

export const ARMY_SEEKS_ARMY_DEFAULTS = {
  enabled: 1, reachMoves: 3, minRatio: 0.8, clusterLink: 3, reachSlack: 1, defaultMove: 2,
} as const;

let overrideValue: boolean | null = null;
/** Tylko testy: wymusza ON/OFF niezaleznie od parametru; null = parametr. */
export function setArmySeeksArmyOverride(value: boolean | null): void {
  overrideValue = value;
}
export function isArmySeeksArmyEnabled(paramEnabled: number): boolean {
  return overrideValue !== null ? overrideValue : paramEnabled >= 1;
}

export interface SeekUnit {
  id: string;
  q: number;
  r: number;
  ownerId: number;
  ruch: number;
}

export interface SeekParams { reachMoves: number; minRatio: number; clusterLink: number; reachSlack: number }

export interface SeekInput {
  /** Jednostki bojowe wlasne BEZ garnizonow miast. */
  myArmyUnits: readonly SeekUnit[];
  /** Widoczne wrogie jednostki bojowe (wojna + kontakt, bez barbarzyncow). */
  enemyUnits: readonly SeekUnit[];
  /** Jednostki z juz wydanym atakiem w tej turze -- nie ruszane. */
  lockedUnitIds: ReadonlySet<string>;
  strengthOf: (u: SeekUnit) => number;
  distance: (aq: number, ar: number, bq: number, br: number) => number;
  /** Czy `u` moze teraz uderzyc w `e` (zasieg ataku jednostki). */
  inAttackRange: (u: SeekUnit, e: SeekUnit) => boolean;
  params: SeekParams;
}

export type SeekOrder =
  | { kind: 'attack'; unitId: string; targetUnitId: string }
  | { kind: 'approach'; unitId: string; toQ: number; toR: number };

export interface SeekPlan {
  orders: SeekOrder[];
  /** Diagnostyka: powod braku zlecen lub dane decyzji. */
  reason: 'ok' | 'no-own' | 'no-enemy' | 'out-of-reach' | 'too-weak';
  ownStrength: number;
  enemyStrength: number;
  distance: number;
}

function clusters(units: readonly SeekUnit[], dist: SeekInput['distance'], link: number): SeekUnit[][] {
  const sorted = [...units].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const seen = new Set<string>();
  const out: SeekUnit[][] = [];
  for (const s of sorted) {
    if (seen.has(s.id)) continue;
    const comp: SeekUnit[] = [];
    const stack = [s];
    seen.add(s.id);
    while (stack.length > 0) {
      const cur = stack.pop()!;
      comp.push(cur);
      for (const o of sorted) {
        if (!seen.has(o.id) && dist(cur.q, cur.r, o.q, o.r) <= link) {
          seen.add(o.id);
          stack.push(o);
        }
      }
    }
    out.push(comp);
  }
  return out;
}

function minId(c: readonly SeekUnit[]): string {
  return c.reduce((m, u) => (u.id < m ? u.id : m), c[0]!.id);
}

/** Najsilniejsze skupisko (remis: nizsze minimalne id). */
function strongest(cl: SeekUnit[][], strengthOf: (u: SeekUnit) => number): { c: SeekUnit[]; s: number } | null {
  let best: { c: SeekUnit[]; s: number } | null = null;
  for (const c of cl) {
    const s = c.reduce((a, u) => a + strengthOf(u), 0);
    if (best === null || s > best.s + 1e-9 || (Math.abs(s - best.s) <= 1e-9 && minId(c) < minId(best.c))) best = { c, s };
  }
  return best;
}

export function planArmySeeksArmy(inp: SeekInput): SeekPlan {
  const empty = (reason: SeekPlan['reason'], own = 0, en = 0, d = 0): SeekPlan =>
    ({ orders: [], reason, ownStrength: own, enemyStrength: en, distance: d });
  const mine = strongest(clusters(inp.myArmyUnits, inp.distance, inp.params.clusterLink), inp.strengthOf);
  if (mine === null) return empty('no-own');
  const foe = strongest(clusters(inp.enemyUnits, inp.distance, inp.params.clusterLink), inp.strengthOf);
  if (foe === null) return empty('no-enemy', mine.s);
  let dmin = Infinity;
  for (const u of mine.c) for (const e of foe.c) dmin = Math.min(dmin, inp.distance(u.q, u.r, e.q, e.r));
  const slowest = Math.max(1, Math.min(...mine.c.map(u => Math.max(1, u.ruch))));
  if (dmin > inp.params.reachMoves * slowest + inp.params.reachSlack) return empty('out-of-reach', mine.s, foe.s, dmin);
  if (foe.s <= 0 || mine.s / foe.s < inp.params.minRatio) return empty('too-weak', mine.s, foe.s, dmin);

  const orders: SeekOrder[] = [];
  const mineSorted = [...mine.c].sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const u of mineSorted) {
    if (inp.lockedUnitIds.has(u.id)) continue;
    // Cel ataku: wrog w zasiegu o najnizszej sile (potem id); inaczej zblizanie do najblizszego wroga armii.
    const inRange = foe.c.filter(e => inp.inAttackRange(u, e))
      .sort((a, b) => inp.strengthOf(a) - inp.strengthOf(b) || (a.id < b.id ? -1 : 1));
    if (inRange.length > 0) {
      orders.push({ kind: 'attack', unitId: u.id, targetUnitId: inRange[0]!.id });
      continue;
    }
    const near = [...foe.c].sort((a, b) =>
      inp.distance(u.q, u.r, a.q, a.r) - inp.distance(u.q, u.r, b.q, b.r) || (a.id < b.id ? -1 : 1))[0]!;
    orders.push({ kind: 'approach', unitId: u.id, toQ: near.q, toR: near.r });
  }
  return { orders, reason: 'ok', ownStrength: mine.s, enemyStrength: foe.s, distance: dmin };
}
