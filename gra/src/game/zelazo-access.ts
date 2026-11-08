/**
 * zelazo-access.ts — dostęp do żelaza (decyzja właściciela 2026-07-19, korekta 2026-07-30).
 *
 * R-KOPALNIA-UNIWERSALNA-Q1=B: osobne ulepszenie `kopalnia_zelaza` (jak kopalnia_miedzi
 * dla brązu). Stara uniwersalna `kopalnia` migrowana przy load — patrz migrateLegacyKopalniaKey.
 *
 * Dostęp do żelaza (AND):
 *   (a) Kopalnia żelaza POSTAWIONA na heksie ze złożem żelaza (hex.zloze === 'zelazo'),
 *       GDZIEKOLWIEK w imperium gracza — jak empireHasKopalniaMiedzi dla brązu.
 *   (b) budynek Odlewnia żelaza (id 'odlewnia_zelaza') zbudowany w TYM mieście.
 */
import type { GameMap } from '../types/map';
import { migrateLegacyKopalniaKey, normalizeImprovementKey } from './terrain-improvements';

/** Id ulepszenia Kopalnia żelaza (terrain-improvements.json). */
export const KOPALNIA_ZELAZA_KEY = 'kopalnia_zelaza';

/** @deprecated R-KOPALNIA-UNIWERSALNA-Q1=B — użyj KOPALNIA_ZELAZA_KEY. */
export const KOPALNIA_KEY = KOPALNIA_ZELAZA_KEY;

/** Budynek bazowy łańcucha żelaza (nazwa wyświetlana: Odlewnia żelaza). */
export const ODLEWNIA_ZELAZA_BUILDING_ID = 'odlewnia_zelaza';

/** Klucz złoża żelaza na heksie (map/gen-helpers.ts DEPOSIT_RULES id='zelazo'). */
export const ZLOZE_ZELAZO_KEY = 'zelazo';

function improvementKeysOnPlaced(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') {
    const k = normalizeImprovementKey(imp) ?? migrateLegacyKopalniaKey(imp);
    return k ? [k] : [];
  }
  return imp
    .map(k => normalizeImprovementKey(String(k)) ?? migrateLegacyKopalniaKey(String(k)))
    .filter((k): k is string => !!k);
}

/** Minimalny kształt mapy potrzebny tutaj — tylko odczyt `zloze` heksu po kluczu "q,r". */
export interface ZlozeHexMapLike {
  hexes: Record<string, { zloze?: string } | undefined>;
}

function isKopalniaZelazaKey(key: string): boolean {
  return key === KOPALNIA_ZELAZA_KEY;
}

/**
 * Czy imperium ma ukończoną Kopalnię żelaza na heksie ze złożem żelaza — GDZIEKOLWIEK.
 * Akceptuje też legacy `kopalnia` na złożu żelaza (stare save przed migracją).
 */
export function empireHasKopalniaNaZlozuZelaza(
  placedImprovements: ReadonlyMap<string, string | readonly string[]> | null | undefined,
  map: ZlozeHexMapLike | GameMap | null | undefined,
): boolean {
  if (!placedImprovements?.size || !map?.hexes) return false;
  for (const [hexKey, imp] of placedImprovements) {
    const hex = map.hexes[hexKey];
    const zloze = (hex as { zloze?: string } | undefined)?.zloze?.toString().trim().toLowerCase();
    if (zloze !== ZLOZE_ZELAZO_KEY) continue;
    for (const raw of improvementKeysOnPlaced(imp)) {
      if (isKopalniaZelazaKey(raw)) return true;
    }
    if (typeof imp === 'string' && imp === 'kopalnia') return true;
    if (Array.isArray(imp) && imp.some(k => String(k) === 'kopalnia')) return true;
  }
  return false;
}

/**
 * Odlewnia żelaza lub Wielka odlewnia (upgrade łańcucha odlewni — oba produkują żelazo).
 */
export function cityHasOdlewniaZelaza(builtIds: readonly string[]): boolean {
  return builtIds.includes(ODLEWNIA_ZELAZA_BUILDING_ID)
    || builtIds.includes('wielka_odlewnia');
}

/**
 * Pełny dostęp do żelaza — DOSTEP-SUROWCE-Q1: Żelazo w magazynie państwa + odlewnia w mieście.
 */
export function hasZelazoAccess(
  empireStock?: Readonly<Record<string, number>> | boolean | undefined,
  builtIds?: readonly string[],
): boolean {
  const stock = typeof empireStock === 'boolean' || empireStock === undefined
    ? undefined
    : empireStock;
  const hasStock = (stock?.zelazo ?? 0) > 0;
  if (!builtIds) return hasStock;
  return hasStock && cityHasOdlewniaZelaza(builtIds);
}
