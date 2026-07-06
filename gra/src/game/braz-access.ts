/**
 * braz-access.ts — łańcuch brązu (ABC-12/13, Maciej 2026-07-04).
 * Dostęp do brązu = Popalnia brązu (mapa, imperium) AND Piec hutniczy (miasto).
 * Sama ruda / złoże w zasięgu ≠ brąz.
 */
import { normalizeImprovementKey } from './terrain-improvements';

/** Id budynku w JSON (nazwa wyświetlana: Piec hutniczy). */
export const PIEC_HUTNICZY_BUILDING_ID = 'odlewnia_brazu';

export const POPALNIA_BRAZU_KEY = 'popalnia_brazu';

function improvementKeysOnPlaced(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp
    .map(k => normalizeImprovementKey(String(k)))
    .filter((k): k is string => !!k);
}

/** Czy imperium ma ukończoną Popalnię brązu na mapie. */
export function empireHasPopalniaBrazu(
  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,
): boolean {
  if (!placedImprovements?.size) return false;
  for (const imp of placedImprovements.values()) {
    for (const key of improvementKeysOnPlaced(imp)) {
      if (key === POPALNIA_BRAZU_KEY) return true;
    }
  }
  return false;
}

/** Piec hutniczy lub jego upgrade (Odlewnia żelaza). */
export function cityHasPiecHutniczy(builtIds: readonly string[]): boolean {
  return builtIds.includes(PIEC_HUTNICZY_BUILDING_ID)
    || builtIds.includes('odlewnia_zelaza');
}

/** Pełny dostęp do brązu — rekrut, konwerter, panel (gdy wired). */
export function hasBrazAccess(
  placedImprovements: ReadonlyMap<string, string | readonly string[]> | null | undefined,
  builtIds: readonly string[],
): boolean {
  return empireHasPopalniaBrazu(placedImprovements) && cityHasPiecHutniczy(builtIds);
}
