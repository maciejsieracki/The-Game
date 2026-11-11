/**
 * R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1 — zbiorcze zamówienie rekrutacji dla całej cywilizacji.
 *
 * Moduł CZYSTY (bez DOM, bez stanu gry): rozdziela N sztuk jednego typu jednostki
 * równomiernie po miastach, które MOGĄ ją teraz produkować. Wykonanie idzie przez wstrzyknięty
 * callback `purchase` (w grze: ta sama `purchaseRecruitmentUnit` co ręczna rekrutacja w mieście),
 * więc koszty/bramki/moment poboru są IDENTYCZNE jak przy ręcznym „Rekrutuj”.
 */

export interface RecruitCityInput {
  cityId: string;
  /** Nazwa do komunikatów (opcjonalnie). */
  name?: string;
  /** Czy miasto może TERAZ przyjąć ten typ (dostępność produkcji + brak blokad). */
  canRecruit: boolean;
  /** Powód odrzucenia, gdy `canRecruit === false` (np. oblężenie, brak koszar). */
  blockedReason?: string;
  /** Ile sztuk TEGO typu już stoi w kolejce rekrutacji miasta. */
  queuedOfType: number;
  /** Długość całej kolejki rekrutacji miasta (rozstrzyga remis). */
  queueLength: number;
  /** Opcjonalny limit nowych wpisów w tym mieście (undefined = bez limitu). */
  maxNewSlots?: number;
}

export interface RecruitAssignment {
  cityId: string;
  count: number;
}

export interface RecruitPlan {
  requested: number;
  assignments: RecruitAssignment[];
  assigned: number;
  unassigned: number;
  rejected: { cityId: string; reason: string }[];
}

function toCount(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/**
 * Deterministyczny rozkład: każda kolejna sztuka trafia do miasta z najmniejszą liczbą
 * sztuk tego typu (w kolejce + już przydzielonych), remis → krótsza kolejka łączna,
 * remis → mniejsze `cityId` (porównanie ordynalne, bez zależności od locale).
 */
export function planEmpireRecruitment(
  _typ: string,
  ilosc: number,
  miasta: readonly RecruitCityInput[],
): RecruitPlan {
  const requested = toCount(ilosc);
  const rejected: { cityId: string; reason: string }[] = [];
  const pool: { c: RecruitCityInput; added: number; cap: number }[] = [];
  for (const c of miasta) {
    if (!c.canRecruit) {
      rejected.push({ cityId: c.cityId, reason: c.blockedReason ?? 'miasto nie może rekrutować tej jednostki' });
      continue;
    }
    const cap = c.maxNewSlots === undefined ? Number.POSITIVE_INFINITY : toCount(c.maxNewSlots);
    if (cap <= 0) {
      rejected.push({ cityId: c.cityId, reason: 'brak wolnych miejsc w kolejce' });
      continue;
    }
    pool.push({ c, added: 0, cap });
  }
  let assigned = 0;
  if (pool.length > 0) {
    for (let i = 0; i < requested; i++) {
      let best: (typeof pool)[number] | null = null;
      for (const p of pool) {
        if (p.added >= p.cap) continue;
        if (best === null) { best = p; continue; }
        const aT = toCount(p.c.queuedOfType) + p.added;
        const aL = toCount(p.c.queueLength) + p.added;
        const bT = toCount(best.c.queuedOfType) + best.added;
        const bL = toCount(best.c.queueLength) + best.added;
        if (aT < bT || (aT === bT && (aL < bL || (aL === bL && p.c.cityId < best.c.cityId)))) best = p;
      }
      if (best === null) break; // wszystkie miasta wyczerpały limity
      best.added++;
      assigned++;
    }
  }
  const assignments = pool
    .filter(p => p.added > 0)
    .map(p => ({ cityId: p.c.cityId, count: p.added }))
    .sort((x, y) => (x.cityId < y.cityId ? -1 : x.cityId > y.cityId ? 1 : 0));
  return { requested, assignments, assigned, unassigned: requested - assigned, rejected };
}

/** Ile sztuk stać imperium (złoto, rekruci, surowce) — sufit przed rozdziałem. */
export interface RecruitAffordInput {
  gold: number;
  unitGold: number;
  manpower: number;
  unitManpower: number;
  /** Pula surowców państwa i koszt surowcowy jednej sztuki (klucz → ilość). */
  stockPool?: Readonly<Record<string, number>>;
  unitStock?: Readonly<Record<string, number>>;
}

export interface RecruitAffordResult {
  max: number;
  /** Czynnik ograniczający (PL) albo null, gdy nic nie ogranicza. */
  limiter: string | null;
}

/** One selected row in the empire panel's shared-resource basket preview. */
export interface RecruitBasketLine {
  quantity: number;
  unitGold: number;
  unitManpower: number;
  unitStock?: Readonly<Record<string, number>>;
}

/** Live empire balances supplied by the existing recruitment/resource systems. */
export interface RecruitBasketBudget {
  gold: number;
  manpower: number;
  stockPool?: Readonly<Record<string, number>>;
}

export interface RecruitBasketSummary {
  quantity: number;
  goldNeeded: number;
  manpowerNeeded: number;
  stockNeeded: Record<string, number>;
  goldShortfall: number;
  manpowerShortfall: number;
  stockShortfall: Record<string, number>;
  affordable: boolean;
}

/** Sum a planned basket before checking it against each shared empire balance once. */
export function summarizeEmpireRecruitBasket(
  lines: readonly RecruitBasketLine[],
  budget: RecruitBasketBudget,
): RecruitBasketSummary {
  let quantity = 0;
  let goldNeeded = 0;
  let manpowerNeeded = 0;
  const stockNeeded: Record<string, number> = {};
  const safeCost = (n: number): number => Number.isFinite(n) ? Math.max(0, n) : 0;
  for (const line of lines) {
    const count = Number.isFinite(line.quantity) ? Math.max(0, Math.floor(line.quantity)) : 0;
    if (count <= 0) continue;
    quantity += count;
    goldNeeded += safeCost(line.unitGold) * count;
    manpowerNeeded += safeCost(line.unitManpower) * count;
    for (const [key, perUnit] of Object.entries(line.unitStock ?? {})) {
      const needed = safeCost(perUnit) * count;
      if (needed > 0) stockNeeded[key] = (stockNeeded[key] ?? 0) + needed;
    }
  }
  const goldShortfall = Math.max(0, goldNeeded - safeCost(budget.gold));
  const manpowerShortfall = Math.max(0, manpowerNeeded - safeCost(budget.manpower));
  const stockShortfall: Record<string, number> = {};
  for (const [key, needed] of Object.entries(stockNeeded)) {
    const missing = Math.max(0, needed - safeCost(budget.stockPool?.[key] ?? 0));
    if (missing > 0) stockShortfall[key] = missing;
  }
  return {
    quantity,
    goldNeeded,
    manpowerNeeded,
    stockNeeded,
    goldShortfall,
    manpowerShortfall,
    stockShortfall,
    affordable: goldShortfall === 0 && manpowerShortfall === 0 && Object.keys(stockShortfall).length === 0,
  };
}

export function maxAffordableEmpireRecruits(a: RecruitAffordInput): RecruitAffordResult {
  let max = Number.POSITIVE_INFINITY;
  let limiter: string | null = null;
  const take = (n: number, why: string): void => {
    const v = Math.max(0, Math.floor(n));
    if (v < max) { max = v; limiter = why; }
  };
  if (a.unitGold > 0) take(a.gold / a.unitGold, 'za mało złota');
  if (a.unitManpower > 0) take(a.manpower / a.unitManpower, 'za mało rekrutów');
  for (const [k, per] of Object.entries(a.unitStock ?? {})) {
    if (per > 0) take((a.stockPool?.[k] ?? 0) / per, `brakuje surowca: ${k}`);
  }
  return { max, limiter };
}

export interface EmpireRecruitOutcome {
  requested: number;
  accepted: number;
  perCity: RecruitAssignment[];
  /** Komunikat PL dla gracza (zawsze ustawiony). */
  message: string;
  /** True gdy stan gry się zmienił (accepted > 0). */
  changed: boolean;
}

/**
 * Wykonuje zamówienie: ogranicza do stać-nas, planuje rozkład i woła `purchase(cityId, count)`
 * (w grze → purchaseRecruitmentUnit z kwotą `count`). Brak zdolnego miasta → zero zmian.
 */
export function executeEmpireRecruitment(args: {
  typLabel: string;
  ilosc: number;
  miasta: readonly RecruitCityInput[];
  afford?: RecruitAffordResult;
  /** Twardy limit sztuk w jednym zamówieniu (np. 1 dla Super-jednostki). */
  maxTotal?: number;
  maxTotalReason?: string;
  purchase: (cityId: string, count: number) => boolean;
}): EmpireRecruitOutcome {
  const requested = toCount(args.ilosc);
  const none = (message: string): EmpireRecruitOutcome =>
    ({ requested, accepted: 0, perCity: [], message, changed: false });
  if (requested <= 0) return none('Ustaw liczbę większą od zera.');
  const capable = args.miasta.filter(c => c.canRecruit);
  if (capable.length === 0) {
    const why = args.miasta.find(c => c.blockedReason)?.blockedReason;
    return none(`Brak miasta zdolnego do rekrutacji ${args.typLabel}${why ? ` (${why})` : ''}.`);
  }
  const hardCap = args.maxTotal !== undefined ? toCount(args.maxTotal) : Infinity;
  const cap = Math.min(args.afford ? Math.min(requested, args.afford.max) : requested, hardCap);
  if (cap <= 0 && hardCap === 0) return none(args.maxTotalReason ?? 'Limit zamówienia osiągnięty.');
  if (cap <= 0) return none(`Nie można zrekrutować ${args.typLabel}: ${args.afford?.limiter ?? 'brak zasobów'}.`);
  // Jedna runda ponownego planowania: sztuki miast, które silnik odrzucił (np. oblężenie między planem
  // a zakupem), są rozkładane na pozostałe zdolne miasta (odrzucone wykluczone; kolejka przyjętych
  // miast uwzględnia już przyjęte sztuki, więc rozkład pozostaje równomierny).
  // ZAŁOŻENIE: `enqueueRecruitment` (production.ts) nie ma limitu długości kolejki ani garnizonu,
  // więc `maxNewSlots` nie jest przekazywane z main.ts (planer je wspiera, brak źródła limitu).
  const perCityMap = new Map<string, number>();
  let accepted = 0;
  let pending = cap;
  let candidates: RecruitCityInput[] = [...args.miasta];
  for (let round = 0; round < 2 && pending > 0; round++) {
    const plan = planEmpireRecruitment(args.typLabel, pending, candidates);
    if (plan.assignments.length === 0) break;
    const refused = new Set<string>();
    for (const a of plan.assignments) {
      if (args.purchase(a.cityId, a.count)) {
        perCityMap.set(a.cityId, (perCityMap.get(a.cityId) ?? 0) + a.count);
        accepted += a.count;
        pending -= a.count;
      } else refused.add(a.cityId);
    }
    if (refused.size === 0) break;
    candidates = candidates
      .filter(c => !refused.has(c.cityId))
      .map(c => {
        const got = perCityMap.get(c.cityId) ?? 0;
        return got > 0 ? { ...c, queuedOfType: c.queuedOfType + got, queueLength: c.queueLength + got } : c;
      });
  }
  const perCity: RecruitAssignment[] = [...perCityMap.entries()]
    .map(([cityId, count]) => ({ cityId, count }))
    .sort((x, y) => (x.cityId < y.cityId ? -1 : x.cityId > y.cityId ? 1 : 0));
  if (accepted === 0) return none(`Nie przyjęto zamówienia ${args.typLabel} (odmowa silnika).`);
  if (accepted >= requested) {
    return { requested, accepted, perCity, changed: true,
      message: `Zamówiono ${accepted} × ${args.typLabel} w ${perCity.length} ${perCity.length === 1 ? 'mieście' : 'miastach'}.` };
  }
  const reason = cap < requested
    ? (hardCap < requested && hardCap <= (args.afford?.max ?? Infinity) ? (args.maxTotalReason ?? 'limit') : (args.afford?.limiter ?? 'brak zasobów'))
    : 'odmowa miasta';
  return { requested, accepted, perCity, changed: true,
    message: `Przyjęto ${accepted} z ${requested} × ${args.typLabel} (${reason}).` };
}
