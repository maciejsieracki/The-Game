/**
 * cyna-access.ts — dostęp do Rudy cyny (nowy surowiec, Maciej 2026-08-13). Wzorem
 * zelazo-access.ts (dostęp do żelaza).
 * / EN: access to tin ore (new resource), modeled on zelazo-access.ts (iron access).
 *
 * Dostęp do Rudy cyny (AND):
 *   (a) Kopalnia cyny POSTAWIONA na heksie ze złożem cyny (hex.zloze === 'cyna'),
 *       GDZIEKOLWIEK w imperium gracza — jak empireHasKopalniaNaZlozuZelaza dla żelaza.
 *   (b) budynek Odlewnia brązu LUB dowolny upgrade łańcucha (Odlewnia żelaza / Wielka
 *       odlewnia) zbudowany w TYM mieście — WSZYSTKIE trzy tiery mają równoległy konwerter
 *       Brązu, który od R-CYNA-BRAZ (2026-08-13) wymaga Rudy cyny jako trzeciego inputu.
 *
 * Ten gate zasila WYŁĄCZNIE widoczność/dostępność SUROWCA (etykieta UI/dyplomacja) — NIE
 * jest osobnym gate'em na jednostki. Dostęp do Brązu jako takiego zostaje bramkowany
 * WYŁĄCZNIE przez istniejący braz-access.ts (empireStock.braz > 0 + budynek), niezależnie
 * od tego, jak Brąz powstał — Cyna wchodzi tylko jako input konwertera (converters.ts),
 * nie zmienia gate'u produktu końcowego.
 */
import type { GameMap } from '../types/map';
import { migrateLegacyKopalniaKey, normalizeImprovementKey } from './terrain-improvements';

/** Id ulepszenia Kopalnia cyny (terrain-improvements.json). */
export const KOPALNIA_CYNY_KEY = 'kopalnia_cyny';

/** Klucz złoża cyny na heksie (map/gen-helpers.ts DEPOSIT_RULES id='cyna'). */
export const ZLOZE_CYNY_KEY = 'cyna';

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

function isKopalniaCynyKey(key: string): boolean {
  return key === KOPALNIA_CYNY_KEY;
}

/**
 * Czy imperium ma ukończoną Kopalnię cyny na heksie ze złożem cyny — GDZIEKOLWIEK.
 */
export function empireHasKopalniaNaZlozuCyny(
  placedImprovements: ReadonlyMap<string, string | readonly string[]> | null | undefined,
  map: ZlozeHexMapLike | GameMap | null | undefined,
): boolean {
  if (!placedImprovements?.size || !map?.hexes) return false;
  for (const [hexKey, imp] of placedImprovements) {
    const hex = map.hexes[hexKey];
    const zloze = (hex as { zloze?: string } | undefined)?.zloze?.toString().trim().toLowerCase();
    if (zloze !== ZLOZE_CYNY_KEY) continue;
    for (const raw of improvementKeysOnPlaced(imp)) {
      if (isKopalniaCynyKey(raw)) return true;
    }
  }
  return false;
}

/**
 * Odlewnia brązu lub dowolny upgrade łańcucha (wszystkie trzy tiery mają konwerter Brązu,
 * który wymaga Rudy cyny) — odpowiednik cityHasOdlewniaZelaza/cityHasPiecHutniczy.
 */
export function cityHasOdlewniaForCyna(builtIds: readonly string[]): boolean {
  return builtIds.includes('odlewnia_brazu')
    || builtIds.includes('odlewnia_zelaza')
    || builtIds.includes('wielka_odlewnia');
}

/**
 * Pełny dostęp do Rudy cyny — magazyn państwa (ruda_cyny w magazynie) + odlewnia w mieście.
 */
export function hasCynaAccess(
  empireStock?: Readonly<Record<string, number>> | boolean | undefined,
  builtIds?: readonly string[],
): boolean {
  const stock = typeof empireStock === 'boolean' || empireStock === undefined
    ? undefined
    : empireStock;
  const hasStock = (stock?.ruda_cyny ?? 0) > 0;
  if (!builtIds) return hasStock;
  return hasStock && cityHasOdlewniaForCyna(builtIds);
}
