/**
 * R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1 -- odsiecz obleganego miasta AI.
 *
 * Zgloszenie wlasciciela (2026-11-18): gdy miasto AI jest oblegane przez mniej wojsk, a AI ma przewage
 * sil w poblizu, AI ma zaatakowac armie oblegajaca (a nie czekac, az oblezenie minie).
 * Decyzja wlasciciela (ABC 2026-11-18, A): prog przewagi = 20% -> ratio >= 1 + minAdvantage.
 *
 * Regula (czysty planer, bez DOM/stanu globalnego):
 *  - cel: wrogie jednostki bojowe na heksie miasta albo w pierscieniu (dystans <= 1 od miasta), widoczne,
 *    od wlasciciela, z ktorym AI jest w stanie wojny i kontaktu (canEngageOwner + hasContactWith);
 *  - sila wlasna: jednostki AI w zasiegu ruchu do ktoregokolwiek oblegajacego (dystans - 1 <= ruchLeft),
 *    bez garnizonu miasta (wszystkie jednostki na heksie miasta), bez zablokowanych (juz maja atak),
 *    bez zanurzonych; sila = ta sama miara co przy ocenie bitew (strengthOf);
 *  - warunek: siła_własna >= (1 + minAdvantage) * siła_oblegających;
 *  - wybor: jedna grupa na ture -- miasto z najlepszym ratio; ratio ex aequo -> mniejsze id miasta;
 *  - rozkazy: jednostka przylegajaca do oblegajacego -> atak; reszta -> krok w strone oblegajacego.
 *
 * Parametr minAdvantage pochodzi z gra/data/ai-params.json (`siege_relief_min_advantage`).
 */

/** Domyslna wartosc progu przewagi (fallback; autorytatywna wartosc w ai-params.json). */
export const SIEGE_RELIEF_DEFAULT_MIN_ADVANTAGE = 0.2;

export interface SiegeReliefUnit {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  ruchLeft: number;
  embarked?: boolean;
}

export interface SiegeReliefCity {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  oblegane?: boolean;
}

export interface SiegeReliefInput {
  ownerId: number;
  /** Jednostki bojowe AI (pole, bez cywilnych i zwiadowcow). */
  myUnits: ReadonlyArray<SiegeReliefUnit>;
  /** Widoczne wrogie jednostki bojowe. */
  enemyUnits: ReadonlyArray<SiegeReliefUnit>;
  /** Miasta AI (sprawdzane tylko oblegane). */
  myCities: ReadonlyArray<SiegeReliefCity>;
  canEngageOwner: (ownerId: number) => boolean;
  hasContactWith: (ownerId: number) => boolean;
  /** Jednostki z juz wydanym atakiem w tej turze (nie wchodza do odsieczy). */
  lockedUnitIds: ReadonlySet<string>;
  strengthOf: (u: SiegeReliefUnit) => number;
  distance: (q1: number, r1: number, q2: number, r2: number) => number;
  minAdvantage: number;
}

export type SiegeReliefOrder =
  | { unitId: string; kind: 'attack'; targetUnitId: string }
  | { unitId: string; kind: 'approach'; targetQ: number; targetR: number };

export interface SiegeReliefPlan {
  cityId: string | null;
  ratio: number;
  orders: SiegeReliefOrder[];
}

const NO_PLAN: SiegeReliefPlan = { cityId: null, ratio: 0, orders: [] };

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Czysty planer odsieczy: zwraca rozkazy dla jednej grupy (najlepsze ratio) albo pusty plan. */
export function planSiegeRelief(inp: SiegeReliefInput): SiegeReliefPlan {
  let best: { city: SiegeReliefCity; ratio: number; besiegers: SiegeReliefUnit[]; participants: SiegeReliefUnit[] } | null = null;
  for (const city of [...inp.myCities].sort((a, b) => cmpStr(a.id, b.id))) {
    if (city.oblegane !== true || city.ownerId !== inp.ownerId) continue;
    const besiegers = inp.enemyUnits
      .filter(e => e.embarked !== true && inp.canEngageOwner(e.ownerId) && inp.hasContactWith(e.ownerId)
        && inp.distance(e.q, e.r, city.q, city.r) <= 1)
      .sort((a, b) => cmpStr(a.id, b.id));
    if (besiegers.length === 0) continue;
    const besiegeStrength = besiegers.reduce((s, b) => s + inp.strengthOf(b), 0);
    if (besiegeStrength <= 0) continue;
    const participants = inp.myUnits
      .filter(u => u.ownerId === inp.ownerId && u.embarked !== true && u.ruchLeft > 0
        && !inp.lockedUnitIds.has(u.id)
        && !(u.q === city.q && u.r === city.r)
        && besiegers.some(b => inp.distance(u.q, u.r, b.q, b.r) - 1 <= u.ruchLeft))
      .sort((a, b) => cmpStr(a.id, b.id));
    if (participants.length === 0) continue;
    const ownStrength = participants.reduce((s, u) => s + inp.strengthOf(u), 0);
    const ratio = ownStrength / besiegeStrength;
    if (ratio < 1 + inp.minAdvantage) continue;
    if (best === null || ratio > best.ratio) best = { city, ratio, besiegers, participants };
  }
  if (best === null) return NO_PLAN;

  const orders: SiegeReliefOrder[] = [];
  for (const u of best.participants) {
    const adjacent = best.besiegers
      .filter(b => inp.distance(u.q, u.r, b.q, b.r) === 1)
      .sort((a, b) => cmpStr(a.id, b.id));
    if (adjacent.length > 0) {
      orders.push({ unitId: u.id, kind: 'attack', targetUnitId: adjacent[0]!.id });
      continue;
    }
    const nearest = best.besiegers
      .slice()
      .sort((a, b) => inp.distance(u.q, u.r, a.q, a.r) - inp.distance(u.q, u.r, b.q, b.r) || cmpStr(a.id, b.id))[0]!;
    orders.push({ unitId: u.id, kind: 'approach', targetQ: nearest.q, targetR: nearest.r });
  }
  return { cityId: best.city.id, ratio: best.ratio, orders };
}
