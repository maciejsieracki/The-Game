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

// ---------------------------------------------------------------------------
// PYTANIE 77 = A (Maciej 2026-07-25): złoto wchodzi na szlaki handlowe jako
// surowiec DOSTĘPOWY, dokładnie jak koń — szlak handlowy z cywilizacją posiadającą
// złoto odblokowuje budowę Mennicy, BEZ przepływu sztuk do magazynu (złoto nadal
// nigdzie nie jest magazynowane, patrz nagłówek pliku). 'zloto' dołączony do
// TRADE_ROUTE_RESOURCE_KEYS (trade-routes.ts) — CELOWO NIE do
// TRADE_ROUTE_STOCK_FLOW_KEYS (żadnego przepływu ilościowego).
//
// WIRING WYMAGANY W main.ts (POZA ZAKRESEM TEJ ZMIANY — plik zablokowany dla
// równoległego agenta, patrz raport zadania). Dwa miejsca do dopisania, gdy
// main.ts zostanie odblokowany:
//   1. `ownerHasNativeResourceAccess` (main.ts ok. linii 2498-2524) — dopisać
//      gałąź: `if (key === 'zloto') return empireHasKopalniaZlota(ownImprovements);`
//   2. Wszystkie miejsca, gdzie dziś woła się `placedImprovementsWithBrazTradeGrant`
//      (main.ts ok. linii 3182, 3210, 3619, 4127, 10070, 14453, 15126, 15953) —
//      dołożyć analogiczne `placedImprovementsWithZlotoTradeGrant(ownerId, ownImprovements)`
//      (funkcja niżej), z `hasTradeRouteResourceAccess(tradeRouteResourceGrants,
//      ownerId, 'zloto')` jako `hasTradeGrant`. Bez tego kroku Mennica NIE zobaczy
//      dostępu "z trasy" w bramce budowy (production.ts czyta activeLabels z
//      resource-access.ts collectActiveAccess, która skanuje DOKŁADNIE ten
//      placedImprovements, jaki dostanie na wejściu — patrz ta funkcja niżej).
// ---------------------------------------------------------------------------

/**
 * Klucz syntetycznego wpisu do `placedImprovements` — analogiczny do
 * `TRADE_GRANT_BRAZ_SYNTHETIC_KEY` w main.ts (`placedImprovementsWithBrazTradeGrant`).
 * BEZPIECZNY dokładnie z tego samego powodu: `empireHasKopalniaZlota` (wyżej) skanuje
 * WYŁĄCZNIE wartości mapy, nigdy klucza/heksa pod spodem — więc syntetyczny wpis pod
 * nieistniejącym na mapie kluczem poprawnie symuluje "imperium ma dostęp do złota"
 * bez fałszowania żadnego realnego heksa (inne odczyty tej samej mapy filtrują
 * `if (!map.hexes[hexKey]) continue`, patrz resource-access.ts collectActiveAccess —
 * syntetyczny klucz jest tam po prostu pomijany przy skanie hexesInCitySight).
 */
export const TRADE_GRANT_ZLOTO_SYNTHETIC_KEY = '__trasa_zloto__';

/**
 * Kopiuje `placedImprovements` i (gdy `hasTradeGrant` jest true) dokleja syntetyczny
 * wpis 'kopalnia_zlota' pod `TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` — dzięki temu KAŻDY
 * wołający `empireHasKopalniaZlota` na wyniku tej funkcji widzi dostęp "z trasy"
 * dokładnie tak, jakby imperium miało własną Kopalnię złota, bez żadnej zmiany w
 * `empireHasKopalniaZlota` samym (istniejąca sygnatura zachowana co do joty — zero
 * ryzyka regresji dla wołających, którzy jeszcze nie wiedzą o trasach).
 *
 * `hasTradeGrant` liczy WOŁAJĄCY (main.ts — zna `tradeRouteResourceGrants`, ten
 * moduł celowo nie zna stanu tras, tylko placedImprovements — pure logic, jak reszta
 * pliku). Gdy `hasTradeGrant` jest false, zwraca DOKŁADNIE `placedImprovements` bez
 * kopiowania (brak zbędnej alokacji w gorącej ścieżce per-city/per-turę).
 *
 * Funkcja jest PURE i ownerId-agnostyczna (parytet AI, zasada #5 zadania) — wołający
 * decyduje o `hasTradeGrant` PRZED wywołaniem, tu nie ma żadnej gałęzi po ownerId.
 *
 * ZERWANIE SZLAKU (decyzja robocza integratora, DO POTWIERDZENIA przez Macieja —
 * patrz raport zadania): `hasTradeGrant` to migawka BIEŻĄCEGO stanu trasy — gdy
 * szlak zniknie, kolejne wywołanie zwróci mapę BEZ syntetycznego wpisu, więc dostęp
 * do budowy NOWEJ Mennicy znika. Mennica JUŻ ZBUDOWANA nie jest tym dotknięta: bramka
 * (buildingResourceGateMet / production.ts) sprawdza WYŁĄCZNIE listę BUDOWALNYCH
 * pozycji (continue gdy bramka nie spełniona) — nigdy nie usuwa budynku z
 * `builtBuildingIds` już postawionego w mieście (ten sam wzorzec co przy "starym
 * zapisie" bez złota, patrz tools/zloto-test.cjs sekcja H: "bramka dotyczy WYŁĄCZNIE
 * nowego budowania, nie unieważnia istniejącego").
 */
export function placedImprovementsWithZlotoTradeGrant(
  placedImprovements: ReadonlyMap<string, string | readonly string[]>,
  hasTradeGrant: boolean,
): ReadonlyMap<string, string | readonly string[]> {
  if (!hasTradeGrant) return placedImprovements;
  const augmented = new Map(placedImprovements);
  augmented.set(TRADE_GRANT_ZLOTO_SYNTHETIC_KEY, [KOPALNIA_ZLOTA_KEY]);
  return augmented;
}
