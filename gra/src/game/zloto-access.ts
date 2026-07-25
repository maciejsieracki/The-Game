/**
 * zloto-access.ts — dostęp do złota (decyzja właściciela 2026-07-25).
 *
 * Maciej: „Mennica będzie potrzebować surowca w terenie — złoto (...) złoto potraktujemy
 * jako surowiec, do którego wystarczy tylko dostęp — nie trzeba budować wielu kopalni, nie
 * będzie składowane jako oddzielny surowiec. Po prostu jest dostęp, więc możemy bić monety."
 *
 * Model — najbliższy wzorzec to brąz (braz-access.ts / empireHasKopalniaMiedzi): SKANUJEMY
 * WSZYSTKIE placedImprovements imperium (gdziekolwiek w cywilizacji, nie tylko zasięg jednego
 * miasta) i sprawdzamy, czy jest wśród nich ukończona Kopalnia złota. W przeciwieństwie do
 * brązu, złoto NIE wymaga dodatkowego budynku „hutniczego" w mieście (Piec hutniczy) — sama
 * Kopalnia gdziekolwiek w imperium wystarcza („wystarczy tylko dostęp"). Dlatego to prostszy
 * przypadek niż brąz i bliższy niż żelazo (zelazo-access.ts): 'kopalnia_zlota' to DEDYKOWANE
 * ulepszenie (jak 'kopalnia_miedzi' — depositAllowsPlayerImprovement dopuszcza je WYŁĄCZNIE
 * na hex.zloze==='zloto', map/improvement-build.ts), więc sama obecność klucza ulepszenia w
 * placedImprovements wystarcza — bez potrzeby odczytu złoża pod spodem (inaczej niż przy
 * generycznej 'kopalnia', która obsługuje i żelazo, i węgiel, i zwykłą rudę).
 *
 * Złoto NIE jest magazynowane — brak jakiegokolwiek pola w City.surowce / ownerResourceStockAll
 * / kosztach budowy. Jedyny efekt dostępu: etykieta „Złoto" w aktywnych surowcach imperium
 * (game/resource-access.ts collectActiveAccess, analogicznie do hasBrazAccess) → bramka
 * budynku Mennica (DEPOSIT_LINKED_BUILDING_LABELS w building-resource-gate.ts).
 */
import { normalizeImprovementKey } from './terrain-improvements';

/** Id dedykowanego ulepszenia „Kopalnia złota" (terrain-improvements.json). */
export const KOPALNIA_ZLOTA_KEY = 'kopalnia_zlota';

function improvementKeysOnPlaced(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp
    .map(k => normalizeImprovementKey(String(k)))
    .filter((k): k is string => !!k);
}

/**
 * Czy imperium ma ukończoną Kopalnię złota GDZIEKOLWIEK na mapie (jak empireHasKopalniaMiedzi
 * dla brązu — braz-access.ts) — NIE filtrujemy po zasięgu jednego miasta. Wołający (main.ts /
 * resource-access.ts) przekazuje już przefiltrowaną per-owner mapę (placedImprovementsForOwner),
 * więc ta funkcja jest ownerId-agnostyczna z założenia (parytet AI).
 */
export function empireHasKopalniaZlota(
  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,
): boolean {
  if (!placedImprovements?.size) return false;
  for (const imp of placedImprovements.values()) {
    for (const key of improvementKeysOnPlaced(imp)) {
      if (key === KOPALNIA_ZLOTA_KEY) return true;
    }
  }
  return false;
}
