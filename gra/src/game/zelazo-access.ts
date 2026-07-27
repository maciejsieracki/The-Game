/**
 * zelazo-access.ts — dostęp do żelaza (decyzja właściciela 2026-07-19).
 *
 * Model „jedna, ogólna Kopalnia — to, czego jest kopalnią, wynika ze złoża pod nią"
 * (improvement-build.ts, depositAllowsPlayerImprovement/canPlaceImprovement, case 'kopalnia':
 * na Górach dopuszcza zloze==='zelazo' LUB 'wegiel' LUB nakladka ZlozeRudy). Świadomie
 * NIE tworzymy osobnego ulepszenia „kopalnia_zelaza" — inaczej niż miedź/brąz (kopalnia_miedzi
 * to odrębne ulepszenie, TYLKO zloze==='miedz'). Ta różnica jest zamierzona i NIE ujednolica
 * łańcucha brązu — braz-access.ts / kopalnia_miedzi zostają bez zmian (osobny, wcześniejszy temat).
 *
 * Dostęp do żelaza (AND):
 *   (a) Kopalnia POSTAWIONA na heksie ze złożem żelaza (hex.zloze === 'zelazo'), GDZIEKOLWIEK
 *       w imperium gracza — jak empireHasKopalniaMiedzi dla brązu (braz-access.ts): skanuje
 *       WSZYSTKIE placedImprovements, nie tylko zasięg jednego miasta.
 *   (b) budynek Odlewnia żelaza (id 'odlewnia_zelaza') zbudowany w TYM mieście.
 *
 * (a) wymaga odczytu zloze pod spodem — placedImprovements niesie tylko klucz ulepszenia,
 * nie surowiec heksa, więc trzeba skrzyżować z mapą (hexKey "q,r" -> map.hexes, patrz
 * resource-access.ts / gen-helpers.ts hexKey()). production.ts jest pure-logic i nie zna
 * mapy (dokumentacja modułu: "no DOM, no THREE, no I/O, no global state") — dlatego (a) jest
 * liczone przez wołającego (main.ts, gdzie `map` i `placedImprovements` już są w scope) i
 * przekazywane do production.ts jako gotowy boolean w AvailabilityContext.
 */
import type { GameMap } from '../types/map';
import { normalizeImprovementKey } from './terrain-improvements';

/** Id ogólnego ulepszenia „Kopalnia" (terrain-improvements.json) — jedna kopalnia, typ surowca
 *  wynika ze złoża heksa pod nią (improvement-build.ts case 'kopalnia'). */
export const KOPALNIA_KEY = 'kopalnia';

/** Budynek bazowy łańcucha żelaza (nazwa wyświetlana: Odlewnia żelaza). */
export const ODLEWNIA_ZELAZA_BUILDING_ID = 'odlewnia_zelaza';

/** Klucz złoża żelaza na heksie (map/gen-helpers.ts DEPOSIT_RULES id='zelazo'; deposit-era.ts). */
export const ZLOZE_ZELAZO_KEY = 'zelazo';

function improvementKeysOnPlaced(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp
    .map(k => normalizeImprovementKey(String(k)))
    .filter((k): k is string => !!k);
}

/** Minimalny kształt mapy potrzebny tutaj — tylko odczyt `zloze` heksu po kluczu "q,r"
 *  (ten sam key space co GameMap.hexes / placedImprovements — patrz resource-access.ts). */
export interface ZlozeHexMapLike {
  hexes: Record<string, { zloze?: string } | undefined>;
}

/**
 * Czy imperium ma ukończoną Kopalnię postawioną na heksie ze złożem żelaza — GDZIEKOLWIEK
 * (jak empireHasKopalniaMiedzi dla brązu: NIE filtrujemy po zasięgu jednego miasta).
 */
export function empireHasKopalniaNaZlozuZelaza(
  placedImprovements: ReadonlyMap<string, string | readonly string[]> | null | undefined,
  map: ZlozeHexMapLike | GameMap | null | undefined,
): boolean {
  if (!placedImprovements?.size || !map?.hexes) return false;
  for (const [hexKey, imp] of placedImprovements) {
    if (!improvementKeysOnPlaced(imp).includes(KOPALNIA_KEY)) continue;
    const hex = map.hexes[hexKey];
    if (!hex) continue;
    const zloze = (hex as { zloze?: string }).zloze?.toString().trim().toLowerCase();
    if (zloze === ZLOZE_ZELAZO_KEY) return true;
  }
  return false;
}

/**
 * Odlewnia żelaza lub Wielka odlewnia (upgrade łańcucha odlewni — oba produkują żelazo).
 * Niezależny łańcuch kuźni (kuznia → kuznia_zelaza → wielka_kuznia) = tylko Pancerz, bez żelaza.
 */
export function cityHasOdlewniaZelaza(builtIds: readonly string[]): boolean {
  return builtIds.includes(ODLEWNIA_ZELAZA_BUILDING_ID)
    || builtIds.includes('wielka_odlewnia');
}

/**
 * Pełny dostęp do żelaza — wołane z production.ts z JUŻ WYLICZONĄ przez wołającego flagą
 * "Kopalnia na złożu żelaza gdziekolwiek w imperium" (production.ts nie zna mapy) + listą
 * budynków TEGO miasta.
 */
export function hasZelazoAccess(
  hasKopalniaNaZlozuZelaza: boolean | undefined,
  builtIds: readonly string[],
): boolean {
  return !!hasKopalniaNaZlozuZelaza && cityHasOdlewniaZelaza(builtIds);
}
