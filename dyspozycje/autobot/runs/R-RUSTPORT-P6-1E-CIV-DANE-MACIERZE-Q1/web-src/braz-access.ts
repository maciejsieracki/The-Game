/**
 * braz-access.ts — łańcuch brązu (ABC-12/13; Maciej 2026-07-09: brąz to STOP miedzi, NIE surowiec).
 * DOSTEP-SUROWCE-Q1 (2026-07-29): dostęp = fizyczny Brąz w magazynie państwa (nie mapa/kopalnia).
 * Odlewnia brązu w mieście nadal wymagana do produkcji konwertera (cityHasPiecHutniczy).
 */
import { normalizeImprovementKey } from './terrain-improvements';

/** Id budynku tier1 łańcucha odlewni (nazwa wyświetlana: Odlewnia brązu). */
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

/** Odlewnia brązu lub dowolny upgrade łańcucha odlewni (produkują brąz). */
export function cityHasPiecHutniczy(builtIds: readonly string[]): boolean {
  return builtIds.includes(PIEC_HUTNICZY_BUILDING_ID)
    || builtIds.includes('odlewnia_zelaza')
    || builtIds.includes('wielka_odlewnia');
}

/** Pełny dostęp do brązu — rekrut, konwerter, panel: Brąz w magazynie + odlewnia w mieście. */
export function hasBrazAccess(
  empireStock?: Readonly<Record<string, number>> | ReadonlyMap<string, string | readonly string[]> | null,
  builtIds?: readonly string[],
): boolean {
  const stock = empireStock instanceof Map ? undefined : (empireStock ?? undefined);
  const hasStock = ((stock as Readonly<Record<string, number>> | undefined)?.braz ?? 0) > 0;
  if (!builtIds) return hasStock;
  return hasStock && cityHasPiecHutniczy(builtIds);
}
