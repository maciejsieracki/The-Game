/**
 * next-active-unit.ts — R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1.
 *
 * Czysta funkcja kolejki Spacji: „następna aktywna jednostka gracza". Rozszerza regułę
 * `army-cycle.ts` (ruch > 0, nie uśpiona / ufortyfikowana / zwiedzająca / w garnizonie) o jednostki
 * zaangażowane w OBLĘŻENIE, które wymagają decyzji gracza mimo braku ruchu:
 *  - OBLEGAJĄCA: `oblegaCityId` wskazuje miasto z `oblegane === true` (ruch zablokowany do szturmu);
 *  - OBLEGANA: jednostka gracza stojąca (też w garnizonie) w WŁASNYM mieście z `oblegane === true`.
 * Uśpione / ufortyfikowane w polu / auto-eksplorujące pozostają pominięte także w oblężeniu.
 * Bez stanu globalnego — wszystko przez argumenty (testowalne na sztucznych RuntimeUnit-ach).
 *
 * EN: pure Space-queue function. Extends army-cycle.ts eligibility with siege-involved units
 * (besieging / besieged), which need a player decision despite having no moves left.
 */
import type { RuntimeUnit } from '../units/setup';
import { stackRenderKey } from './armyMerge';
import { resolveAdjacentPlayerUnitCycle } from './army-cycle';

export interface NextActiveUnitCtx {
  /** Miasta (wystarczą pola id/q/r/ownerId/oblegane). */
  cities: ReadonlyArray<{ id: string; q: number; r: number; ownerId: number; oblegane?: boolean }>;
  /** Czy jednostka należy do aktualnego fotela (hot-seat). */
  isMe: (u: RuntimeUnit) => boolean;
  /** Czy stos jednostki ma ruch w tej turze (iniekcja z main.ts: stackCanMove). */
  canMove: (u: RuntimeUnit) => boolean;
}

/** Jednostka bez rozkazu automatycznego/postojowego (kryteria wspólne z army-cycle, bez garnizonu). */
function hasNoStandingOrder(u: RuntimeUnit): boolean {
  return u.sentry !== true && u.autoExplore !== true && u.ufortyfikowanyWPolu !== true;
}

/** Oblegająca (miasto oblegane) albo oblegana (własne miasto oblegane). */
export function isUnitSiegeInvolved(u: RuntimeUnit, ctx: Pick<NextActiveUnitCtx, 'cities'>): boolean {
  if (u.oblegaCityId) {
    const c = ctx.cities.find(x => x.id === u.oblegaCityId);
    if (c?.oblegane === true) return true;
  }
  return ctx.cities.some(
    c => c.oblegane === true && c.ownerId === u.ownerId && c.q === u.q && c.r === u.r,
  );
}

/** Kolejka Spacji: 1 wiodąca jednostka na stos, kolejność przestrzenna jak w army-cycle. */
export function activeUnitQueue(units: ReadonlyArray<RuntimeUnit>, ctx: NextActiveUnitCtx): RuntimeUnit[] {
  const eligible = units.filter(u => {
    if (!ctx.isMe(u) || !hasNoStandingOrder(u)) return false;
    if (isUnitSiegeInvolved(u, ctx)) return true;
    return u.inGarnizon !== true && ctx.canMove(u);
  });
  const stacks = new Map<string, RuntimeUnit>();
  for (const u of eligible) {
    const k = stackRenderKey(u);
    if (!stacks.has(k)) stacks.set(k, u);
  }
  return [...stacks.values()].sort((a, b) => {
    const sa = a.q + a.r;
    const sb = b.q + b.r;
    if (sa !== sb) return sa - sb;
    if (a.q !== b.q) return a.q - b.q;
    return a.r - b.r;
  });
}

/** Id następnej aktywnej jednostki po `currentId` (cyklicznie) albo null, gdy kolejka pusta. */
export function nextActiveUnit(
  units: ReadonlyArray<RuntimeUnit>,
  currentId: string | null,
  ctx: NextActiveUnitCtx,
): string | null {
  return resolveAdjacentPlayerUnitCycle(units, activeUnitQueue(units, ctx), currentId, 1);
}
