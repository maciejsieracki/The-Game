/**
 * braz-access.ts — łańcuch brązu (ABC-12/13; Maciej 2026-07-09: brąz to STOP miedzi, NIE surowiec).
 * Dostęp do brązu = Kopalnia miedzi (mapa, imperium — źródło miedzi) AND Piec hutniczy (miasto).
 * Sama ruda / złoże w zasięgu ≠ brąz.
 */
import { normalizeImprovementKey } from './terrain-improvements';

/** Id budynku w JSON (nazwa wyświetlana: Piec hutniczy). */
export const PIEC_HUTNICZY_BUILDING_ID = 'odlewnia_brazu';

/** Ulepszenie-źródło miedzi (dawniej „Popalnia brązu"). */
export const KOPALNIA_MIEDZI_KEY = 'kopalnia_miedzi';

function improvementKeysOnPlaced(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp
    .map(k => normalizeImprovementKey(String(k)))
    .filter((k): k is string => !!k);
}

/** Czy imperium ma ukończoną Kopalnię miedzi na mapie (źródło miedzi do brązu). */
export function empireHasKopalniaMiedzi(
  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,
): boolean {
  if (!placedImprovements?.size) return false;
  for (const imp of placedImprovements.values()) {
    for (const key of improvementKeysOnPlaced(imp)) {
      if (key === KOPALNIA_MIEDZI_KEY) return true;
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
  return empireHasKopalniaMiedzi(placedImprovements) && cityHasPiecHutniczy(builtIds);
}
