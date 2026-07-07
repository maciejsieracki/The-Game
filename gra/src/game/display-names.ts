/**
 * display-names.ts — etykiety państw vs miast-państw klastra (Maciej 2026-07-07).
 *
 * Pełna cywilizacja / imperium: sama nazwa (np. „Ateny”, „Rzym”).
 * Miasto-państwo z klastra startowego: „Sparta · miasto-państwo”.
 */

export const CITY_STATE_LABEL = 'miasto-państwo';
export const CITY_STATE_SEPARATOR = ' · ';

export interface EntityDisplayCtx {
  baseName: string;
  isCityState?: boolean;
}

/** Etykieta UI z opcjonalnym dopiskiem miasta-państwa. */
export function formatEntityDisplayName(ctx: EntityDisplayCtx): string {
  const base = (ctx.baseName ?? '').trim();
  if (!base) return '';
  if (ctx.isCityState) {
    return `${base}${CITY_STATE_SEPARATOR}${CITY_STATE_LABEL}`;
  }
  return base;
}

/** Usuwa dopisek z legacy zapisów / podwójnego formatowania. */
export function stripCityStateSuffix(name: string): string {
  const suffix = `${CITY_STATE_SEPARATOR}${CITY_STATE_LABEL}`;
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/** Slot spawnu klastra — rywale tego samego typu + kopie obcego typu (nie stolica). */
export function isClusterCityStateSlot(slot: {
  isSameTypeRival?: boolean;
  isClusterCapital?: boolean;
  isPlayerCapital?: boolean;
}): boolean {
  if (slot.isPlayerCapital) return false;
  if (slot.isSameTypeRival) return true;
  return !slot.isClusterCapital;
}

/** Czy owner to miasto-państwo klastra (nie pełne imperium). ownerId 0 = gracz → zawsze false. */
export function isOwnerClusterCityState(
  ownerId: number,
  opts?: {
    simplifiedOwners?: ReadonlySet<number>;
    typCopyOwners?: ReadonlySet<number>;
    cities?: ReadonlyArray<{ ownerId: number; startCityState?: boolean }>;
  },
): boolean {
  if (ownerId <= 0) return false;
  if (opts?.simplifiedOwners?.has(ownerId)) return true;
  if (opts?.typCopyOwners?.has(ownerId)) return true;
  if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;
  return false;
}

/** Etykieta miasta na mapie / tooltipie. */
export function formatCityMapLabel(city: {
  name: string;
  ownerId: number;
  startCityState?: boolean;
}): string {
  return formatEntityDisplayName({
    baseName: city.name,
    isCityState: city.ownerId !== 0 && !!city.startCityState,
  });
}

/** Etykieta dyplomacji / HUD dla ownera AI. */
export function formatOwnerDiploLabel(
  baseName: string,
  ownerId: number,
  opts?: Parameters<typeof isOwnerClusterCityState>[1],
): string {
  return formatEntityDisplayName({
    baseName: stripCityStateSuffix(baseName),
    isCityState: isOwnerClusterCityState(ownerId, opts),
  });
}
