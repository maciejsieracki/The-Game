/**
 * trade-routes.ts — Handel E2/E3: wykrywanie połączeń miast + dochód z tras.
 *
 * Zakres E2 (fundament, patrz STAN-PRACY-HANDOFF.md / epik Handel):
 *   - Typy szlaku handlowego (TradeRoute) — na razie tylko pola potrzebne do detekcji;
 *     dochód, wpięcie w turn-economy.ts i UI to E3+.
 *   - findCityConnection() — GENERYCZNA funkcja: czy dwa dowolne miasta MOGĄ być
 *     połączone danym medium (ląd/morze). R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1
 *     (2026-09-03, jawne ODWRÓCENIE wcześniejszej Q6=B, decyzja właściciela
 *     2026-07-20 — dokładnie tak, jak odwrócenie P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B
 *     w R-PRODUKCJA-POSTEP-PAMIEC-PO-USUNIECIU-Q1, ta sama sesja): dawny model
 *     "connected = dystans (hex) ≤ próg ORAZ istnieje przechodnia ścieżka" miał próg
 *     dystansu jako warunek BLOKUJĄCY (12 heksów ląd / 20 morze) — na dużych mapach
 *     ("superogromny" 672×476) blokował handel między stolicami tej samej,
 *     graniczącej pary cywilizacji tylko dlatego, że miasta leżały daleko od siebie
 *     w LINII PROSTEJ, mimo istnienia realnej, przechodniej ścieżki lądowej/morskiej.
 *     Właściciel uznał to za nielogiczne i zażądał usunięcia progu, nie tylko
 *     wyjaśnienia. Od tego tematu: connected = WYŁĄCZNIE istnieje przechodnia
 *     ścieżka (BFS) bez przeszkody terenowej — bez górnego limitu dystansu (sufit
 *     BFS liczony dynamicznie z wymiarów mapy, patrz komentarz przy dawnym
 *     `BFS_RADIUS_MULT` niżej). Sam próg dystansu ŻYJE DALEJ, ale WYŁĄCZNIE jako
 *     referencyjny dystans SZCZYTU krzywej dochodu (`TradeRouteIncomeParams`,
 *     rozdzielony od connectivity od tego tematu — patrz GOAL 3 dispatchu i
 *     komentarz przy `TradeRouteIncomeParams`/`tradeRouteDistanceIncome` niżej).
 *     NIE budujemy pathfindera po sieci dróg — to nie jest computePath/Dijkstra po
 *     koszcie ruchu jednostki, tylko czysta reachability (każdy krok kosztuje "1",
 *     bez modyfikatorów drogi/rzeki/lasu — te wpływają na ruch JEDNOSTEK, nie na to
 *     czy handel jest możliwy).
 *   - Filtr „obce miasto / pokój" NIE jest tu stosowany na poziomie findCityConnection
 *     — to warstwa E3 (refreshTradeRoutes niżej stosuje ten filtr).
 *
 * Zakres E3 (dochód z tras, decyzje właściciela 2026-07-20 -- Q7=A, Q8=B, Q9):
 *   - refreshTradeRoutes() — ustala/utrzymuje/usuwa trasy handlowe co turę.
 *     R-HANDEL-LIMIT-TRAS-PELNY-Q1 (2026-09-04, patrz docstring funkcji niżej dla
 *     pełnego opisu): odkąd ten temat zintegrowany, trasy powstają MIĘDZY
 *     DOWOLNĄ parą właścicieli (gracz/AI/państwo-miasto, nie tylko gracz<->obcy)
 *     ORAZ WEWNĄTRZ jednego właściciela (miasto<->miasto tej samej cywilizacji,
 *     bez traktatu) — to ODWRACA dawny opis „GRACZ<->OBCA CYWILIZACJA WYŁĄCZNIE"
 *     poniżej, zachowany jako historia: filtr obcy właściciel + pokój (nie wojna)
 *     + AKTYWNA Umowa Szlaków (RodzajTraktatu.UmowaSzlakow, dawniej opisywana tu
 *     mylącą nazwą legacy „Umowa Handlowa" — decyzja właściciela C-HANDEL-UMOWA=B,
 *     2026-07-23: sam pokój już NIE wystarcza, trasa ZEWNĘTRZNA wymaga zawartego
 *     traktatu; trasa WEWNĘTRZNA, nowość tego tematu, nie wymaga traktatu w ogóle).
 *     T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, 2026-08-24): liczba budynków handlowych
 *     (Targowisko/Port/Port wielki) w mieście NIE ogranicza pola
 *     `TradeRoute.budynekOdblokowany` (bonus 5%, T4) inaczej niż dawniej —
 *     R-HANDEL-LIMIT-TRAS-PELNY-Q1 PRZYWRÓCIŁ jednak ograniczenie SAMEGO ISTNIENIA
 *     trasy, przez NOWY, niezależny licznik `tradeRouteExistenceLimitForCity`
 *     (baza=1 slot nawet bez budynków, +1 za budynek) — `tradeRouteLimitForCity`
 *     (T3, buildings-only) zostaje bez zmian i nadal gatinguje wyłącznie
 *     `budynekOdblokowany`. Fizyczny Port jako wymóg samej łączności morskiej
 *     (`cityHasPort`) zostaje bez zmian.
 *   - Dochód = DWA SKŁADNIKI (wpięte oddzielnie):
 *     (1) składnik dystansowy (tradeRouteDistanceIncome / computeTradeRouteIncomeByCity)
 *         — wzór liniowy z podłogą, kredytowany OBU miastom trasy w pełnej kwocie
 *         (Q8=B: obie strony zarabiają), do skarbca CZYSTO (pomija Wealth) — wpięcie
 *         w turn-economy.ts (pieniadzZTras).
 *     (2) +5% Handlu za każde aktywne połączenie miasta (computeTradeRouteCountByCity)
 *         — osobny, jawny mnożnik w economy.ts (cityYieldPerTurn), NIE łączony z
 *         Targowiskiem/civHandelMult, żeby uniknąć podwójnego liczenia.
 *
 * CUDA-HANDEL-01 (Maciej 2026-07-26): bonus cudów świata "handel_procent"
 * (wonders.json, bonusy.specjalne) mnoży WYŁĄCZNIE składnik (1) — dochód
 * dystansowy — nigdy Daninę/Podatek. Patrz sumWonderTradeRouteBonusForOwner
 * w wonders-data.ts (wylicza sumę % per owner/medium) i 3. argument
 * computeTradeRouteIncomeByCity niżej (resolver wstrzyknięty przez main.ts).
 *
 * Pure logic — bez DOM, bez THREE, bez side effects (poza cache'ami w WeakMap,
 * patrz niżej — `__tradeConnectionCache` oraz, od R-HANDEL-SZLAKI-LIMIT-DYSTANSU-
 * USUN-Q1, `__landComponentsCache`/`__seaComponentsCache` dla taniego wstępnego
 * filtra GOAL 2).
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { hexDistance, hexNeighborCoords, keyOf, isWaterTerrain } from '../units/setup';
import type { City } from './cities';
import { territoryOwnerAt, cityTerritoryRadius, type TerritoryNode } from '../map/territory';

export type { TerritoryNode };

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

/** Medium szlaku: ląd (jednostka lądowa) lub morze (przez Port, po wodzie). */
export type TradeRouteMedium = 'lad' | 'morze';

/**
 * Status wykrytego połączenia.
 * E2: tylko wynik geometrycznej detekcji. E3 dołoży 'aktywny'/'zawieszony' po
 * wpięciu w ekonomię (np. zerwanie przy wojnie czy utracie miasta).
 */
export type TradeRouteStatus = 'polaczony' | 'brak_polaczenia';

/**
 * Rekord szlaku handlowego — na E2 tylko pola potrzebne do detekcji + identyfikacji.
 * Reszta (przychód, historia, itp.) dojdzie w E3, bez zmiany kształtu tych pól.
 */
export interface TradeRoute {
  id: string;
  fromCityId: string;
  toCityId: string;
  /** Właściciel miasta źródłowego. */
  ownerId: number;
  /** Właściciel miasta docelowego. */
  toOwnerId: number;
  medium: TradeRouteMedium;
  /** Uproszczony dystans heksowy (hexDistance) między centrami miast. */
  dystans: number;
  status: TradeRouteStatus;
  /**
   * T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1) — czy TA KONKRETNA trasa ma dziś pokrycie
   * budynkowe (Targowisko/Port/Port wielki) po OBU stronach, zgodnie z
   * `tradeRouteLimitForCity`. NIE wpływa na to, czy trasa istnieje (od T3 trasa
   * istnieje i daje dochód dystansowy niezależnie od budynków — cytat właściciela:
   * „Umowa handlowa od początku [...] daje nam pomimo braku wybudowanych budynków
   * już środki samej odległości [...] Natomiast w momencie, gdy budynki staną
   * wybudowane, to dochodzi dodatkowo tych 5% handlu"). Konsumowane dopiero w T4
   * (economy.ts) do naliczenia realnego bonusu 5% — samo w sobie nie niesie żadnej
   * kwoty. Liczba budynkowych „slotów" per miasto pozostaje ograniczona
   * (`tradeRouteLimitForCity`), więc gdy tras jest więcej niż slotów, o tym, KTÓRA
   * trasa dostaje `budynekOdblokowany=true` decyduje mechanizm priorytetu —
   * patrz `refreshTradeRoutes`. R-HANDEL-LIMIT-TRAS-PELNY-Q1 (2026-09-04, GOAL 3)
   * ZMIENIŁ tę kolejność: NIE JUŻ "najpierw istniejące po id, potem nowe wg
   * rosnącego dystansu" (opis T3 powyżej, historyczny) — od tego tematu kolejność
   * to DOCHÓD MALEJĄCO (`tradeRouteTotalDistanceIncome`, ta sama, co gatinguje
   * ISTNIENIE trasy przez `usedExistenceSlots`, patrz `tradeRouteExistenceLimitForCity`),
   * ze stabilnością jako tie-break przy remisie dochodu (istniejąca trasa wygrywa
   * z nową o identycznym dochodzie). Skutek: trasa dalsza (więc bardziej
   * dochodowa, do sufitu krzywej) ma dziś WYŻSZY priorytet do slotu budynkowego
   * niż trasa bliższa — odwrotnie niż przed tym tematem.
   */
  budynekOdblokowany: boolean;
}

/** Minimalny kształt miasta wymagany do detekcji połączenia (podzbiór City). */
export type TradeRouteCityRef = Pick<City, 'id' | 'ownerId' | 'q' | 'r'>;

/**
 * Parametry connectivity (data/econ-params.json, blok "handel_szlaki").
 *
 * R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1 (2026-09-03, GOAL 1 + GOAL 3 dispatchu):
 * `ladMaxDist`/`morzeMaxDist` NIE SĄ JUŻ progiem BLOKUJĄCYM istnienie trasy —
 * connectivity zależy wyłącznie od fizycznej osiągalności (BFS), zob.
 * `computeCityConnection`. Pola zostają w typie WYŁĄCZNIE dla zgodności (kształt
 * struktury threadowany przez `findCityConnection`/`detectBestConnection`/
 * `citiesHaveTradeConnection`/`refreshTradeRoutes` poza allowlistą tego tematu,
 * plus klucz cache w `cacheKeyFor`) — grep całego `gra/src` potwierdza (recon
 * dispatchu) zero innych konsumentów tych dwóch pól poza tym plikiem. Referencyjny
 * dystans szczytu krzywej DOCHODU to od teraz osobny parametr —
 * `TradeRouteIncomeParams.ladMaxDist`/`morzeMaxDist` (patrz niżej) — celowo
 * ROZDZIELONY typowo od tego tu, mimo że oba czytają dziś te same klucze JSON
 * (`lad_max_dystans`/`morze_max_dystans`, patrz `loadTradeRouteParams` i
 * `loadTradeRouteIncomeParams`).
 */
export interface TradeRouteParams {
  /** Nieużywane do blokowania — patrz GOAL 1. Maks. dystans heksowy dla szlaku lądowego (legacy, tylko dla zgodności typów/cache). */
  ladMaxDist: number;
  /** Nieużywane do blokowania — patrz GOAL 1. Maks. dystans heksowy dla szlaku morskiego (legacy, tylko dla zgodności typów/cache). */
  morzeMaxDist: number;
}

/**
 * Wartości domyślne (gdy econ-params.json niedostępny / brak bloku). Wartości
 * zachowane bez zmian (12/20) mimo że od R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1
 * już NIE blokują connectivity (patrz komentarz przy `TradeRouteParams` wyżej) —
 * to te same liczby, którymi domyślnie posługuje się dziś referencyjny dystans
 * szczytu dochodu (`DEFAULT_TRADE_ROUTE_INCOME_PARAMS` niżej), więc zmiana ich tu
 * bez zmiany tamtych rozjechałaby dwa miejsca, które historycznie (i nadal w
 * domyślnym JSON) reprezentują tę samą liczbę geografii/gameplayu.
 */
export const DEFAULT_TRADE_ROUTE_PARAMS: TradeRouteParams = {
  ladMaxDist: 12,
  morzeMaxDist: 20,
};

/** Wynik detekcji połączenia — używany zarówno wewnętrznie, jak i w testach. */
export interface CityConnectionResult {
  connected: boolean;
  /** Uproszczony dystans heksowy (hexDistance) między centrami miast. */
  distance: number;
  /**
   * Heksy trasy (klucze "q,r", od miasta źródłowego do docelowego, WŁĄCZNIE z
   * obydwoma centrami) — do wizualizacji w E7. Puste, gdy connected === false.
   */
  pathHexes: string[];
}

// ---------------------------------------------------------------------------
// Predykaty terenu (lokalne — nie zależą od mutowalnego stanu modułu units/setup.ts,
// żeby detekcja szlaków była w pełni deterministyczna i niezależna od konfiguracji
// ruchu jednostek. Odzwierciedlają main.ts:mapHexPassableForUnit dla lądu oraz
// nową zasadę Wybrzeze+Morze=woda dla morza).
// ---------------------------------------------------------------------------

/** Ląd przechodni dla trasy lądowej: wszystko poza wodą (PlytkieMorze/Morze) i Górami. */
function isLandPassable(tb: TerenBazowy): boolean {
  return !isWaterTerrain(tb) && tb !== TerenBazowy.Gory;
}

/** Woda żeglowna dla trasy morskiej: Morze lub PlytkieMorze (obie klasyfikowane jako woda). */
function isWaterHex(tb: TerenBazowy): boolean {
  return isWaterTerrain(tb);
}

/** Budynki portowe — odblokowują szlak morski (dowolny poziom Portu). */
const PORT_BUILDING_IDS: ReadonlySet<string> = new Set(['port', 'port_wielki']);

/** Czy miasto ma zbudowany Port (dowolny poziom) wg builtByCity. */
function cityHasPort(
  cityId: string,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): boolean {
  const built = builtByCity.get(cityId);
  if (!built) return false;
  return built.some(id => PORT_BUILDING_IDS.has(id));
}

// ---------------------------------------------------------------------------
// Wspólna granica lądowa (R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1, GOAL 1)
// ---------------------------------------------------------------------------

/**
 * Wszystkie heksy w promieniu `radius` od (cq,cr) — pełne koło aksjalne (cube
 * distance ≤ radius), TA SAMA metryka co `axialDistance`/`cityTerritoryRadius`
 * w map/territory.ts. Rząd 3*radius^2 heksów (max promień 15 -> ~675) — zgodnie
 * z szacunkiem kosztu z RECON dispatchu.
 */
function hexesInRadius(cq: number, cr: number, radius: number): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [];
  for (let dq = -radius; dq <= radius; dq++) {
    const rMin = Math.max(-radius, -dq - radius);
    const rMax = Math.min(radius, -dq + radius);
    for (let dr = rMin; dr <= rMax; dr++) {
      out.push({ q: cq + dq, r: cr + dr });
    }
  }
  return out;
}

/**
 * Czy terytoria (wg `territoryOwnerAt`, ten sam model radialny co reszta gry —
 * WYŁĄCZNIE reużyty, zero zmian) ownera A i ownera B FAKTYCZNIE się stykają
 * (GOAL 1 dispatchu, zgłoszenie właściciela 2026-09-03: "nasza granica opiera
 * się na ich granicy").
 *
 * Definicja "stykają się": istnieje heks należący do A, którego przynajmniej
 * jeden sąsiad (`hexNeighborCoords`) należy do B (symetryczne — kolejność
 * ownerA/ownerB nie ma znaczenia).
 *
 * Przypadek brzegowy (dispatch GOAL 1): `territoryOwnerAt` NIE filtruje terenu —
 * przypisuje właściciela heksom wodnym w promieniu miasta tak samo jak lądowym
 * (np. wybrzeże blisko miasta). Żeby granica WYŁĄCZNIE przez wodę (dwie wyspy
 * blisko siebie, KRYTERIUM KOŃCA #4) nie liczyła się jako granica LĄDOWA, i
 * heks-właściciel, i jego sąsiad muszą być lądem (`isLandPassable`, ta sama
 * definicja co BFS trasy lądowej niżej — spójność z resztą pliku).
 *
 * Czysta funkcja, zero zależności od stanu modułu. Koszt: suma promieni miast
 * ownera A (setki heksów, patrz `hexesInRadius`) — NIE cała mapa. Wołający
 * (computeCityConnection) MUSI memoizować wynik per PARA WŁAŚCICIELI (nie per
 * para miast) — patrz `landBorderShared` niżej — funkcja sama tego nie robi.
 */
export function ownersHaveSharedLandBorder(
  ownerA: number,
  ownerB: number,
  territoryNodes: readonly TerritoryNode[],
  map: GameMap,
): boolean {
  if (ownerA === ownerB) return false;
  const nodesA = territoryNodes.filter(n => n.ownerId === ownerA);
  if (nodesA.length === 0) return false;
  if (!territoryNodes.some(n => n.ownerId === ownerB)) return false;

  for (const node of nodesA) {
    const radius = cityTerritoryRadius(node);
    for (const hex of hexesInRadius(node.q, node.r, radius)) {
      const hexData = map.hexes[keyOf(hex.q, hex.r)];
      if (!hexData || !isLandPassable(hexData.terenBazowy)) continue;
      if (territoryOwnerAt(hex.q, hex.r, territoryNodes) !== ownerA) continue;

      for (const n of hexNeighborCoords(hex.q, hex.r)) {
        const nHexData = map.hexes[keyOf(n.q, n.r)];
        if (!nHexData || !isLandPassable(nHexData.terenBazowy)) continue;
        if (territoryOwnerAt(n.q, n.r, territoryNodes) === ownerB) return true;
      }
    }
  }
  return false;
}

/**
 * Memoizowana wersja `ownersHaveSharedLandBorder`, kluczowana per PARA
 * WŁAŚCICIELI (posortowane id, symetryczny klucz) — GOAL 4 dispatchu: adjacency
 * liczone RAZ na wywołanie refreshTradeRoutes (albo innej funkcji górnego
 * poziomu tego łańcucha), NIE osobno per para miast. `cache` jest opcjonalny —
 * wołający bez własnej mapy (np. pojedyncze, izolowane wywołanie
 * `findCityConnection`) po prostu liczy świeżo za każdym razem (poprawne, tylko
 * bez korzyści z memoizacji wielokrotnych wywołań).
 *
 * `territoryNodes === undefined` -> WYŁĄCZONY wymóg granicy (patrz komentarz
 * przy `findCityConnection`/`computeCityConnection`: wsteczna zgodność dla
 * wywołujących spoza allowlisty tego tematu, które nie przekazują dziś danych
 * terytorium — np. `gra/tools/{trade-routes-income,trade-ilosc,trade-grant,
 * zloto-szlak,mennica-uspienie}-test.cjs`, poza allowlistą R-HANDEL-SZLAKI-
 * WYMOG-GRANICY-LADOWEJ-Q1 — muszą zostać zielone bez zmian, patrz GOAL 7 vs
 * ALLOWLISTA dispatchu). Realne wywołania z main.ts ZAWSZE przekazują
 * `buildAllTerritoryNodes()` (nigdy undefined) — więc w grze wymóg granicy jest
 * zawsze wyegzekwowany; wyłączenie dotyczy WYŁĄCZNIE testów, które testują inny
 * wymiar (dochód, umowy, wojna) i nie budują fikstur terytorium.
 */
function landBorderShared(
  ownerA: number,
  ownerB: number,
  territoryNodes: readonly TerritoryNode[] | undefined,
  map: GameMap,
  cache: Map<string, boolean> | undefined,
): boolean {
  if (territoryNodes === undefined) return true;
  const key = ownerA < ownerB ? `${ownerA}|${ownerB}` : `${ownerB}|${ownerA}`;
  if (cache) {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
  }
  const result = ownersHaveSharedLandBorder(ownerA, ownerB, territoryNodes, map);
  if (cache) cache.set(key, result);
  return result;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/**
 * Cache wyników detekcji per mapa (WeakMap<GameMap, ...>) — auto-inwaliduje się,
 * gdy generujemy nową mapę (nowy obiekt GameMap = inny wpis, stary GC'owany).
 * Klucz wewnętrzny koduje WSZYSTKIE wejścia, które wpływają na wynik (obie
 * pozycje miast, medium, progi param. i — dla morza — czy oba miasta mają Port
 * TERAZ). Dzięki temu cache nigdy nie zwróci nieaktualnego wyniku: jeśli gracz
 * dobuduje Port, klucz się zmienia i wpis liczy się na nowo — nie trzeba ręcznie
 * inwalidować co turę, tylko gdy realnie zmienia się wejście (miasta/granice/porty).
 * Wzorowane na __riverHexSetCache w game/turn-economy.ts.
 */
const __tradeConnectionCache = new WeakMap<GameMap, Map<string, CityConnectionResult>>();

function cacheKeyFor(
  fromCity: TradeRouteCityRef,
  toCity: TradeRouteCityRef,
  medium: TradeRouteMedium,
  params: TradeRouteParams,
  hasPortFrom: boolean,
  hasPortTo: boolean,
  landBorderTag: string,
  needPath: boolean,
): string {
  // Klucz symetryczny nie jest potrzebny — kierunek nie zmienia wyniku detekcji,
  // ale dla prostoty i determinizmu zapisujemy dokładnie parę tak, jak wywołana.
  // landBorderTag ('x' brak wymogu / '1' granica / '0' brak granicy) — GOAL 4:
  // terytoria zmieniają się co turę (podobnie jak Porty wyżej), więc wynik MUSI
  // wejść do klucza, inaczej WeakMap<GameMap,...> (trwały między turami) zwracałby
  // przeterminowany wynik connectivity po zmianie terytorium bez zmiany pozycji miast.
  // `needPath` (R-HANDEL-LIMIT-TRAS-PELNY-Q1, GOAL 6) — MUSI wejść do klucza:
  // wynik z `needPath=false` (patrz komentarz przy `computeCityConnection`) ma
  // celowo puste `pathHexes` mimo `connected=true`, więc nie wolno mu dzielić
  // wpisu z wynikiem `needPath=true` (pełna ścieżka) dla TEJ SAMEJ pary/stanu —
  // inaczej wołający, który faktycznie potrzebuje `pathHexes` (np. przyszłe E7),
  // mógłby dostać z cache'a skrócony wynik zapisany wcześniej przez
  // refreshTradeRoutes (który nigdy nie czyta `pathHexes`, patrz GOAL 6 w
  // docstringu `findCityConnection`).
  return `${fromCity.q},${fromCity.r}|${toCity.q},${toCity.r}|${medium}|` +
    `${params.ladMaxDist}|${params.morzeMaxDist}|${hasPortFrom ? 1 : 0}|${hasPortTo ? 1 : 0}|${landBorderTag}|${needPath ? 1 : 0}`;
}

// ---------------------------------------------------------------------------
// BFS reachability (bez kosztu ruchu — czysta przechodniość, ograniczona promieniem)
// ---------------------------------------------------------------------------

/**
 * R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1 (2026-09-03, decyzja właściciela — jawne
 * odwrócenie wcześniejszej Q6=B, patrz komentarz przy `DEFAULT_TRADE_ROUTE_PARAMS`
 * niżej): usunięty dawny `BFS_RADIUS_MULT` (mnożnik progu dystansu blokującego —
 * `params.ladMaxDist/morzeMaxDist * 2`). Sufit BFS (`maxSteps`) liczony jest teraz
 * DYNAMICZNIE z wymiarów AKTUALNEJ mapy w `computeCityConnection`
 * (`map.szerokoscQ + map.wysokoscR`) — bezpieczna górna granica z nierówności
 * trójkąta dla hexDistance (odległość między dwoma dowolnymi heksami mapy W×H
 * nie przekracza (W-1)+(H-1) ≤ W+H), niezależna od progu connectivity (który od
 * tego tematu już nie istnieje — patrz GOAL 1) i odporna na przyszłe, jeszcze
 * większe mapy niż dzisiejsze "superogromny" (672×476).
 */

/**
 * Tani wstępny filtr przed pełnym BFS (GOAL 2 dispatchu, uzasadnienie w raporcie
 * Operatora): po usunięciu progu dystansu (GOAL 1) i podniesieniu sufitu BFS do
 * skali całej mapy, para miast na RÓŻNYCH, fizycznie niepołączonych kontynentach/
 * wyspach wywoływałaby dziś pełny BFS aż do wyczerpania CAŁEGO osiągalnego obszaru
 * danego medium (potencjalnie dziesiątki tysięcy heksów na "superogromny") zamiast
 * taniego odsiewu O(1) sprzed tej zmiany. Rozwiązanie: komponenty spójności
 * (flood fill) per medium, liczone RAZ na mapę (O(liczby heksów), cache'owane w
 * WeakMap — analogicznie do `__tradeConnectionCache` niżej, auto-inwalidacja przy
 * nowej mapie) — potem sprawdzenie "czy te dwa miasta mogą być połączone" to O(1)
 * porównanie identyfikatorów komponentu. Filtr jest WYŁĄCZNIE NEGATYWNY i
 * bezpieczny: różne komponenty ⇒ DOWIEDZIONA fizyczna nieosiągalność (żadna
 * ścieżka po heksach przechodnich nie może istnieć między różnymi komponentami
 * spójności z definicji) ⇒ wolno zwrócić NOT_CONNECTED bez uruchamiania BFS. Ten
 * sam komponent NIE gwarantuje connected=true (BFS nadal wymagany — dopiero on
 * buduje faktyczną `pathHexes` do wizualizacji i respektuje `maxSteps`), więc
 * filtr nigdy nie może wygenerować fałszywego NOT_CONNECTED — brak ryzyka
 * zablokowania realnego połączenia (odrzucone jako zbyt ryzykowne: dowolna
 * heurystyka bez pełnej informacji o spójności terenu, np. bounding-box, mogłaby
 * błędnie odciąć istniejące połączenie na mapie z wąskimi przesmykami/zatokami).
 */
function computeConnectivityComponents(
  map: GameMap,
  passable: (tb: TerenBazowy) => boolean,
): Map<string, number> {
  const comp = new Map<string, number>();
  let nextId = 0;
  for (const key of Object.keys(map.hexes)) {
    if (comp.has(key)) continue;
    const hex = map.hexes[key];
    if (!hex || !passable(hex.terenBazowy)) continue;

    const id = nextId++;
    comp.set(key, id);
    let frontier: string[] = [key];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const curKey of frontier) {
        const [cq, cr] = curKey.split(',').map(Number) as [number, number];
        for (const n of hexNeighborCoords(cq, cr)) {
          const nKey = keyOf(n.q, n.r);
          if (comp.has(nKey)) continue;
          const nHex = map.hexes[nKey];
          if (!nHex || !passable(nHex.terenBazowy)) continue;
          comp.set(nKey, id);
          next.push(nKey);
        }
      }
      frontier = next;
    }
  }
  return comp;
}

const __landComponentsCache = new WeakMap<GameMap, Map<string, number>>();
const __seaComponentsCache = new WeakMap<GameMap, Map<string, number>>();

function getLandComponents(map: GameMap): Map<string, number> {
  let c = __landComponentsCache.get(map);
  if (!c) {
    c = computeConnectivityComponents(map, isLandPassable);
    __landComponentsCache.set(map, c);
  }
  return c;
}

function getSeaComponents(map: GameMap): Map<string, number> {
  let c = __seaComponentsCache.get(map);
  if (!c) {
    c = computeConnectivityComponents(map, isWaterHex);
    __seaComponentsCache.set(map, c);
  }
  return c;
}

/**
 * Czy para miast MOŻE być połączona lądem — negatywny filtr O(1) po jednorazowym
 * O(heksów) per mapa (patrz komentarz `computeConnectivityComponents` wyżej).
 * distance<=1 pomija filtr i zawsze zwraca true: miasto sąsiadujące/to samo miasto
 * jest zawsze dozwolonym celem BFS niezależnie od przechodniości terenu (patrz
 * `multiSourceBfs` — start/cel są zawsze dozwolone), więc komponent terenu
 * miasta samego w sobie nie rozstrzyga (np. miasto portowe na przesmyku).
 */
function landComponentsMayConnect(
  map: GameMap,
  fromCity: TradeRouteCityRef,
  toCity: TradeRouteCityRef,
  distance: number,
): boolean {
  if (distance <= 1) return true;
  const comps = getLandComponents(map);
  const idsOf = (city: TradeRouteCityRef): Set<number> => {
    const ids = new Set<number>();
    const ownId = comps.get(keyOf(city.q, city.r));
    if (ownId !== undefined) ids.add(ownId);
    for (const n of hexNeighborCoords(city.q, city.r)) {
      const id = comps.get(keyOf(n.q, n.r));
      if (id !== undefined) ids.add(id);
    }
    return ids;
  };
  const fromIds = idsOf(fromCity);
  if (fromIds.size === 0) return false;
  for (const id of idsOf(toCity)) if (fromIds.has(id)) return true;
  return false;
}

/**
 * Czy para wejść morskich (sąsiadujące heksy wodne dwóch miast, patrz
 * `coastalWaterNeighbors`) MOŻE być połączona wodą — analogiczny negatywny filtr
 * O(1) jak `landComponentsMayConnect`, patrz komentarz `computeConnectivityComponents`.
 */
function waterComponentsMayConnect(
  map: GameMap,
  fromWater: ReadonlyArray<{ q: number; r: number }>,
  toWater: ReadonlyArray<{ q: number; r: number }>,
): boolean {
  const comps = getSeaComponents(map);
  const fromIds = new Set<number>();
  for (const h of fromWater) {
    const id = comps.get(keyOf(h.q, h.r));
    if (id !== undefined) fromIds.add(id);
  }
  if (fromIds.size === 0) return false;
  for (const h of toWater) {
    const id = comps.get(keyOf(h.q, h.r));
    if (id !== undefined && fromIds.has(id)) return true;
  }
  return false;
}

/**
 * BFS z wielu źródeł do wielu celów po heksach spełniających `passable`, z
 * wyjątkiem punktów startowych/końcowych, które są zawsze dozwolone (miasto może
 * stać na heksie, który dla danego medium jest "nieprzechodni" — np. centrum
 * miasta portowego stoi na lądzie, nie na wodzie). Zwraca najkrótszą ścieżkę
 * (klucze "q,r") między KTÓRYMKOLWIEK startem a KTÓRYMKOLWIEK celem, albo null.
 *
 * maxSteps ogranicza liczbę kroków BFS (promień), żeby nigdy nie skanować całej
 * mapy przy braku połączenia.
 */
function multiSourceBfs(
  map: GameMap,
  starts: ReadonlyArray<{ q: number; r: number }>,
  goalKeys: ReadonlySet<string>,
  passable: (tb: TerenBazowy) => boolean,
  maxSteps: number,
): string[] | null {
  if (starts.length === 0 || goalKeys.size === 0) return null;

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  let frontier: string[] = [];

  for (const s of starts) {
    const k = keyOf(s.q, s.r);
    if (!visited.has(k)) {
      visited.add(k);
      frontier.push(k);
      if (goalKeys.has(k)) {
        return [k];
      }
    }
  }

  for (let step = 0; step < maxSteps && frontier.length > 0; step++) {
    const next: string[] = [];
    for (const curKey of frontier) {
      const [cq, cr] = curKey.split(',').map(Number) as [number, number];
      for (const n of hexNeighborCoords(cq, cr)) {
        const nKey = keyOf(n.q, n.r);
        if (visited.has(nKey)) continue;

        const isGoal = goalKeys.has(nKey);
        if (!isGoal) {
          const hex = map.hexes[nKey];
          if (!hex || !passable(hex.terenBazowy)) continue;
        }

        visited.add(nKey);
        parent.set(nKey, curKey);

        if (isGoal) {
          // Rekonstrukcja ścieżki.
          const path: string[] = [nKey];
          let cur = nKey;
          while (parent.has(cur)) {
            cur = parent.get(cur)!;
            path.push(cur);
          }
          path.reverse();
          return path;
        }

        next.push(nKey);
      }
    }
    frontier = next;
  }

  return null;
}

/** Heksy sąsiadujące z danym miastem, które są wodą (potencjalne wyjście w morze). */
function coastalWaterNeighbors(map: GameMap, city: TradeRouteCityRef): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [];
  for (const n of hexNeighborCoords(city.q, city.r)) {
    const hex = map.hexes[keyOf(n.q, n.r)];
    if (hex && isWaterHex(hex.terenBazowy)) out.push(n);
  }
  return out;
}

// ---------------------------------------------------------------------------
// findCityConnection — API główne
// ---------------------------------------------------------------------------

/**
 * Czy dwa miasta MOGĄ być połączone danym medium (ląd/morze), przy uproszczonym
 * modelu dystansu (Q6=B): connected = dystans ≤ próg ORAZ istnieje przechodnia
 * ścieżka bez przeszkody terenowej. Generyczna — nie zakłada, czyje są miasta ani
 * czy jest między nimi pokój (filtr obcy/pokój dochodzi w E3/E6).
 *
 * medium='lad': ścieżka po heksach przejezdnych dla jednostki lądowej (wszystko
 *   poza Morze/Wybrzeze/Gory); centra miast zawsze dozwolone jako start/cel.
 * medium='morze': WYMAGA Portu (builtByCity) w OBU miastach, plus ścieżki po
 *   wodzie (Morze ∪ Wybrzeze) łączącej heks wodny przyległy do jednego miasta
 *   z heksem wodnym przyległym do drugiego.
 *
 * Wynik jest cache'owany per mapa (zob. __tradeConnectionCache) — kolejne
 * wywołania dla tej samej pary/parametrów/stanu Portów są praktycznie darmowe.
 *
 * GOAL 1-4 (R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1, 2026-09-03): medium='lad'
 * dodatkowo wymaga WSPÓLNEJ GRANICY LĄDOWEJ między ownerami obu miast
 * (`ownersHaveSharedLandBorder`) — zgłoszenie właściciela: "handel powinien być
 * możliwy tylko wtedy, kiedy graniczymy". `territoryNodes` niesie dane
 * terytorium (reużycie `territoryOwnerAt`/`cityTerritoryRadius`, model
 * terytorium BEZ ZMIAN). `territoryNodes === undefined` (domyślne, wsteczna
 * zgodność) WYŁĄCZA ten wymóg — patrz komentarz przy `landBorderShared` wyżej:
 * dotyczy WYŁĄCZNIE wywołujących spoza allowlisty tego tematu (testy innego
 * wymiaru — dochód/umowy/wojna — bez fikstur terytorium). Realne wywołania z
 * main.ts ZAWSZE przekazują `buildAllTerritoryNodes()`. Gałąź medium='morze'
 * BEZ ZMIAN (druga zasada właściciela: brak granicy nadal pozwala handlować
 * przez Port).
 * `landBorderCache` — opcjonalna memoizacja per-para-właścicieli (GOAL 4:
 * "raz na wywołanie refreshTradeRoutes, nie per para miast") — wołający robiący
 * wiele wywołań dla tej samej pary właścicieli (refreshTradeRoutes,
 * citiesHaveTradeConnection) powinien przekazać WSPÓLNĄ instancję `Map`.
 *
 * `needPath` (R-HANDEL-LIMIT-TRAS-PELNY-Q1, GOAL 6, domyślnie `true` — WSTECZNA
 * ZGODNOŚĆ pełna dla każdego istniejącego wywołującego): gdy `false`, wynik
 * `connected`/`distance` jest identyczny, ale `pathHexes` jest CELOWO puste — w
 * zamian, gdy tania negatywna komponenta spójności (`landComponentsMayConnect`/
 * `waterComponentsMayConnect`, dowód patrz `computeCityConnection`) już
 * POZYTYWNIE dowodzi istnienia ścieżki, funkcja pomija drogi `multiSourceBfs`
 * (rekonstrukcję samej ścieżki) i zwraca `connected:true` od razu. Użyj
 * WYŁĄCZNIE, gdy wołający naprawdę nie czyta `pathHexes` (dziś: WYŁĄCZNIE
 * wewnętrzne wywołania `refreshTradeRoutes` — candidate-generation potrzebuje
 * tylko `connected`+`distance`; `refreshTradeRoutesOverlay`, main.ts, rysuje
 * łuki wprost ze współrzędnych miast, nie z `pathHexes` — grep całego
 * `gra/src`/`gra/tools` potwierdza zero innych konsumentów `CityConnectionResult
 * .pathHexes` poza tym plikiem i jego testami). Żywy pomiar wydajności (GOAL 6):
 * `gra/tools/trade-routes-limit-test.cjs`, sekcja "Kryterium 9".
 */
export function findCityConnection(
  fromCity: TradeRouteCityRef,
  toCity: TradeRouteCityRef,
  map: GameMap,
  medium: TradeRouteMedium,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
  builtByCity: ReadonlyMap<string, readonly string[]> = new Map(),
  territoryNodes?: readonly TerritoryNode[],
  landBorderCache?: Map<string, boolean>,
  needPath: boolean = true,
): CityConnectionResult {
  const distance = hexDistance(fromCity.q, fromCity.r, toCity.q, toCity.r);

  const hasPortFrom = medium === 'morze' ? cityHasPort(fromCity.id, builtByCity) : false;
  const hasPortTo   = medium === 'morze' ? cityHasPort(toCity.id, builtByCity) : false;

  // GOAL 4: sprawdzenie granicy TYLKO dla lądu — wołane przez cache wołającego
  // (jeśli podany), więc dla wielu miast tej samej pary właścicieli liczone raz.
  const sharedBorder = medium === 'lad'
    ? landBorderShared(fromCity.ownerId, toCity.ownerId, territoryNodes, map, landBorderCache)
    : true;
  const borderTag = medium !== 'lad' ? 'x' : territoryNodes === undefined ? 'x' : sharedBorder ? '1' : '0';

  let mapCache = __tradeConnectionCache.get(map);
  if (!mapCache) {
    mapCache = new Map<string, CityConnectionResult>();
    __tradeConnectionCache.set(map, mapCache);
  }

  const cacheKey = cacheKeyFor(fromCity, toCity, medium, params, hasPortFrom, hasPortTo, borderTag, needPath);
  const cached = mapCache.get(cacheKey);
  if (cached) return cached;

  const result = computeCityConnection(
    fromCity, toCity, map, medium, params, distance, hasPortFrom, hasPortTo, sharedBorder, needPath,
  );
  mapCache.set(cacheKey, result);
  return result;
}

function computeCityConnection(
  fromCity: TradeRouteCityRef,
  toCity: TradeRouteCityRef,
  map: GameMap,
  medium: TradeRouteMedium,
  params: TradeRouteParams,
  distance: number,
  hasPortFrom: boolean,
  hasPortTo: boolean,
  sharedLandBorder: boolean,
  needPath: boolean,
): CityConnectionResult {
  const NOT_CONNECTED: CityConnectionResult = { connected: false, distance, pathHexes: [] };
  // GOAL 2 (R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1): sufit BFS liczony DYNAMICZNIE
  // z wymiarów AKTUALNEJ mapy — patrz komentarz przy dawnym `BFS_RADIUS_MULT` wyżej.
  const maxSteps = Math.max(1, map.szerokoscQ + map.wysokoscR);

  if (medium === 'lad') {
    // GOAL 1: usunięty dawny twardy próg `if (distance > params.ladMaxDist) return
    // NOT_CONNECTED` — connectivity lądowa zależy WYŁĄCZNIE od fizycznej
    // osiągalności (BFS po terenie przechodnim), zob. docstring findCityConnection
    // i `DEFAULT_TRADE_ROUTE_PARAMS` niżej (params.ladMaxDist pozostaje w typie
    // wyłącznie jako parametr SZCZYTU krzywej dochodu, patrz GOAL 3 / TradeRouteIncomeParams).
    const startKey = keyOf(fromCity.q, fromCity.r);
    const goalKey = keyOf(toCity.q, toCity.r);
    if (startKey === goalKey) return { connected: true, distance, pathHexes: [startKey] };

    // R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1 GOAL 2: tani check PRZED drogim
    // BFS (early-exit) — brak wspólnej granicy lądowej blokuje trasę NIEZALEŻNIE
    // od wyniku BFS (nawet gdy fizyczna ścieżka istnieje, np. przez pas ziemi
    // niczyjej). Koszt (suma promieni terytorium, setki heksów) jest zwykle
    // znacząco niższy niż koszt BFS w najgorszym przypadku (skala całej mapy).
    if (!sharedLandBorder) return NOT_CONNECTED;

    if (!landComponentsMayConnect(map, fromCity, toCity, distance)) return NOT_CONNECTED;

    // R-HANDEL-LIMIT-TRAS-PELNY-Q1 (GOAL 6): `landComponentsMayConnect` powyżej
    // to nie tylko negatywny filtr — jego wynik POZYTYWNY (`true`) jest z
    // definicji flood-fillu (`computeConnectivityComponents`, IDENTYCZNY
    // predykat `isLandPassable` co poniższy `multiSourceBfs`) dowodem, że
    // ścieżka MIĘDZY tymi dwoma heksami FAKTYCZNIE istnieje (ten sam komponent
    // spójności ⇒ osiągalne przez flood-fill bez ograniczenia liczby kroków).
    // Gdy wołający nie potrzebuje `pathHexes` (`needPath=false`), pomijamy więc
    // drogą rekonstrukcję samej ścieżki — `connected` i `distance` są identyczne
    // z pełnym wynikiem, `pathHexes` jest po prostu puste zamiast policzone.
    if (!needPath) return { connected: true, distance, pathHexes: [] };

    const path = multiSourceBfs(
      map,
      [{ q: fromCity.q, r: fromCity.r }],
      new Set([goalKey]),
      isLandPassable,
      maxSteps,
    );
    if (!path) return NOT_CONNECTED;
    return { connected: true, distance, pathHexes: path };
  }

  // medium === 'morze'
  if (!hasPortFrom || !hasPortTo) return NOT_CONNECTED;
  // GOAL 1: usunięty dawny twardy próg `if (distance > params.morzeMaxDist) return
  // NOT_CONNECTED` — patrz uzasadnienie wyżej (analogicznie do lądu).

  const fromWater = coastalWaterNeighbors(map, fromCity);
  const toWater = coastalWaterNeighbors(map, toCity);
  if (fromWater.length === 0 || toWater.length === 0) return NOT_CONNECTED;

  if (!waterComponentsMayConnect(map, fromWater, toWater)) return NOT_CONNECTED;

  // GOAL 6 (analogicznie do lądu wyżej): pozytywny wynik `waterComponentsMayConnect`
  // dowodzi istnienia ścieżki wodnej — pomiń BFS, gdy `pathHexes` niepotrzebne.
  if (!needPath) return { connected: true, distance, pathHexes: [] };

  const goalKeys = new Set(toWater.map(h => keyOf(h.q, h.r)));
  const waterPath = multiSourceBfs(
    map,
    fromWater,
    goalKeys,
    isWaterHex,
    maxSteps,
  );
  if (!waterPath) return NOT_CONNECTED;

  // Ścieżka pełna do wizualizacji: centrum źródłowe -> (woda...) -> centrum docelowe.
  const pathHexes = [
    keyOf(fromCity.q, fromCity.r),
    ...waterPath,
    keyOf(toCity.q, toCity.r),
  ];
  return { connected: true, distance, pathHexes };
}

// ---------------------------------------------------------------------------
// TradeRoute — konstruktor rekordu (typy na E2; brak wpięcia w stan gry)
// ---------------------------------------------------------------------------

/** Deterministyczne id szlaku — para miast + medium (kierunek from->to zachowany). */
export function tradeRouteId(fromCityId: string, toCityId: string, medium: TradeRouteMedium): string {
  return `${fromCityId}->${toCityId}:${medium}`;
}

/**
 * R-HANDEL-LIMIT-TRAS-PELNY-Q1, runda 2 (zarzut 1 Evaluatora): BEZKIERUNKOWY,
 * BEZ-MEDIALNY klucz PARY MIAST — jedyna poprawna tożsamość szlaku przy dedupie
 * w `refreshTradeRoutes`.
 *
 * DLACZEGO NIE `tradeRouteId`: id niesie kierunek (`from->to`) i medium, więc dwa
 * rekordy opisujące TĘ SAMĄ parę miast mają RÓŻNE id, gdy tylko zmieni się
 * kierunek kanoniczny albo medium. Do rundy 1 było to nieszkodliwe, bo generator
 * dopuszczał wyłącznie pary gracz->obcy i kierunek nie mógł się odwrócić bez
 * zniknięcia trasy. Po generalizacji (GOAL 4-5) kierunek kanoniczny wynika z
 * ownerId (zewnętrzne: ownerA<ownerB) lub z id miast (wewnętrzne) — więc ZMIANA
 * WŁAŚCICIELA MIASTA (podbój) odwraca kierunek: trasa przeżywa jako kontynuacja w
 * STARYM kierunku, a generator dokłada jej BLIŹNIAKA w NOWYM. Ta sama para miast
 * liczona dwa razy = podwojony dochód i podwójnie zużyte existence-sloty, czyli
 * dokładnie inflacja handlu, przeciw której powstał ten temat.
 *
 * Medium jest POZA kluczem celowo: `detectBestConnection` z definicji zwraca
 * JEDNO, najlepsze połączenie na parę miast (ląd przed morzem), więc dwa szlaki
 * między tymi samymi miastami różniące się wyłącznie medium to również duplikat —
 * osiągalny, gdy trasa morska przetrwa jako kontynuacja, a nowo powstała wspólna
 * granica lądowa odblokuje wariant lądowy tej samej pary.
 */
export function tradeRoutePairKey(cityIdA: string, cityIdB: string): string {
  return cityIdA < cityIdB ? `${cityIdA}~${cityIdB}` : `${cityIdB}~${cityIdA}`;
}

/**
 * Buduje rekord TradeRoute na podstawie wyniku detekcji. Czysta funkcja — NIE
 * zapisuje niczego w stanie gry (brak listy tras, brak wpięcia w turn-economy).
 * Do użycia przez UI/ekonomię dopiero w E3+.
 */
export function createTradeRoute(
  fromCity: TradeRouteCityRef,
  toCity: TradeRouteCityRef,
  map: GameMap,
  medium: TradeRouteMedium,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
  builtByCity: ReadonlyMap<string, readonly string[]> = new Map(),
): TradeRoute {
  const { connected, dystans } = ((): { connected: boolean; dystans: number } => {
    const r = findCityConnection(fromCity, toCity, map, medium, params, builtByCity);
    return { connected: r.connected, dystans: r.distance };
  })();
  // T3: standalone constructor, poza mechanizmem priorytetu wielu tras z
  // refreshTradeRoutes (nie zna innych tras/slotów) — pokrycie budynkowe liczone
  // wprost z obu miast tej jednej trasy, bez rywalizacji o slot.
  const budynekOdblokowany =
    tradeRouteLimitForCity(fromCity.id, builtByCity) > 0 &&
    tradeRouteLimitForCity(toCity.id, builtByCity) > 0;

  return {
    id: tradeRouteId(fromCity.id, toCity.id, medium),
    fromCityId: fromCity.id,
    toCityId: toCity.id,
    ownerId: fromCity.ownerId,
    toOwnerId: toCity.ownerId,
    medium,
    dystans,
    status: connected ? 'polaczony' : 'brak_polaczenia',
    budynekOdblokowany,
  };
}

// ---------------------------------------------------------------------------
// Parametry z econ-params.json (blok "handel_szlaki")
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'normal' | 'hard';

type RawParamRow = Record<string, number | string | undefined>;

interface RawEconParamsJsonTradeRoutes {
  handel_szlaki?: Record<string, RawParamRow>;
}

/**
 * Wczytaj TradeRouteParams z surowego econ-params.json (grupa "handel_szlaki").
 * Odporne na braki: brakująca/niepoprawna wartość -> domyślna (DEFAULT_TRADE_ROUTE_PARAMS).
 *
 *   import rawEconJson from '../../data/econ-params.json';
 *   const params = loadTradeRouteParams(rawEconJson, 'normal');
 */
export function loadTradeRouteParams(
  raw: RawEconParamsJsonTradeRoutes,
  difficulty: Difficulty,
): TradeRouteParams {
  const grp = raw.handel_szlaki ?? {};
  const read = (key: string, fallback: number): number => {
    const row = grp[key];
    const v = row ? row[difficulty] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  return {
    ladMaxDist: read('lad_max_dystans', DEFAULT_TRADE_ROUTE_PARAMS.ladMaxDist),
    morzeMaxDist: read('morze_max_dystans', DEFAULT_TRADE_ROUTE_PARAMS.morzeMaxDist),
  };
}

// ---------------------------------------------------------------------------
// E3: limit tras na miasto (Q9) — liczba budynków handlowych
// ---------------------------------------------------------------------------

/**
 * Budynki handlowe, których obecność w mieście daje +1 do limitu tras (Q9).
 * Port/Port wielki to upgrade tej samej linii (upgradeFrom w buildings.json) —
 * builtByCity zawiera po upgrade WYŁĄCZNIE 'port_wielki', więc nie ma ryzyka
 * podwójnego liczenia tego samego budynku.
 *
 * Karawanseraj usunięty z gry (decyzja właściciela 2026-07-25, odpowiedź „15b" —
 * anachronizm, budynek średniowieczny błędnie stał w epoce Brązu). Limit tras
 * nadal działa: Targowisko/Port/Port wielki zostają.
 */
export const TRADE_BUILDING_IDS: ReadonlySet<string> = new Set([
  'targowisko', 'port', 'port_wielki',
]);

/** Limit tras handlowych danego miasta = liczba zbudowanych budynków handlowych. */
export function tradeRouteLimitForCity(
  cityId: string,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): number {
  const built = builtByCity.get(cityId);
  if (!built) return 0;
  let n = 0;
  for (const id of built) if (TRADE_BUILDING_IDS.has(id)) n++;
  return n;
}

/**
 * R-HANDEL-LIMIT-TRAS-PELNY-Q1 (GOAL 1, 2026-09-04) — limit ISTNIENIA tras
 * handlowych danego miasta: 1 slot bazowy (nawet BEZ żadnego budynku handlowego)
 * + 1 dodatkowy slot za KAŻDY zbudowany budynek z `TRADE_BUILDING_IDS`
 * (Targowisko/Port/Port wielki — ten sam, NIEZMIENIONY zbiór, Magazyn/Mennica
 * WYKLUCZONE, ECHO właściciela). To NOWY, NIEZALEŻNY tor od `tradeRouteLimitForCity`
 * (który zostaje BEZ ZMIAN — dalej liczy WYŁĄCZNIE pokrycie budynkowe, zero
 * baseline, konsumowane wyłącznie przez `TradeRoute.budynekOdblokowany`/bonus 5%).
 *
 * Cytat wyzwalający właściciela (2026-09-04): „miasto bez budynków miało tylko
 * jedną drogę handlową i mogło handlować z jednym miastem. Kolejne budynki, takie
 * jak rynek, umożliwiałyby kolejne drogi handlowe. Za każdy kolejny budynek
 * powinna być kolejna droga dostępna." — stąd `1 + tradeRouteLimitForCity(...)`,
 * nie sam `tradeRouteLimitForCity(...)` (który dałby 0 slotów miastu bez
 * budynków, sprzecznie z "miasto bez budynków miało JEDNĄ drogę").
 *
 * Konsumowane w `refreshTradeRoutes` przez OSOBNY tor `usedExistenceSlots` —
 * decyduje, czy dana trasa w ogóle TRAFIA do wyniku (`kept[]`), nie tylko czy
 * dostaje bonus 5%. Patrz GOAL 2 dispatchu R-HANDEL-LIMIT-TRAS-PELNY-Q1.
 */
export function tradeRouteExistenceLimitForCity(
  cityId: string,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): number {
  return 1 + tradeRouteLimitForCity(cityId, builtByCity);
}

// ---------------------------------------------------------------------------
// E3: refreshTradeRoutes — ustalanie/utrzymanie/usuwanie tras co turę
// ---------------------------------------------------------------------------

/**
 * Jeden kandydat trasy (para miast + medium wybrane przez detectBestConnection).
 * R-HANDEL-LIMIT-TRAS-PELNY-Q1 (GOAL 3): `isExisting` — czy ten kandydat
 * KONTYNUUJE trasę z `existingRoutes` poprzedniej tury (tie-break stabilności
 * przy remisie dochodu w połączonym sortowaniu, patrz `refreshTradeRoutes`).
 */
interface TradeRouteCandidate {
  from: TradeRouteCityRef;
  to: TradeRouteCityRef;
  medium: TradeRouteMedium;
  distance: number;
  id: string;
  isExisting: boolean;
}

/**
 * Wybiera medium (ląd/morze) dla pary miast: LĄD MA BEZWARUNKOWE PIERWSZEŃSTWO,
 * gdy fizycznie istnieje — nawet jeśli morze dawałoby wyższy dochód (np. po
 * bonusie ×2, patrz tradeRouteTotalDistanceIncome). Morze jest sprawdzane
 * WYŁĄCZNIE jako fallback, gdy `findCityConnection` dla lądu zwraca
 * connected=false (inny kontynent/wyspa) — nie jako alternatywa dochodowa.
 * (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, ECHO Q5 — "Korekta punktu błędnie
 * sklasyfikowanego jako bez ABC": poprzednia zasada "krótszy dystans wygrywa,
 * remis na korzyść lądu" jest NIEAKTUALNA.)
 * Zwraca null, gdy żadne medium nie łączy miast.
 */
function detectBestConnection(
  a: TradeRouteCityRef,
  b: TradeRouteCityRef,
  map: GameMap,
  params: TradeRouteParams,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  territoryNodes?: readonly TerritoryNode[],
  landBorderCache?: Map<string, boolean>,
  needPath: boolean = true,
): { medium: TradeRouteMedium; distance: number } | null {
  const land = findCityConnection(a, b, map, 'lad', params, builtByCity, territoryNodes, landBorderCache, needPath);
  if (land.connected) return { medium: 'lad', distance: land.distance };
  const sea = findCityConnection(a, b, map, 'morze', params, builtByCity, territoryNodes, landBorderCache, needPath);
  if (sea.connected) return { medium: 'morze', distance: sea.distance };
  return null;
}

/**
 * E6 (2026-07-23) — czy istnieje geometrycznie MOŻLIWE połączenie tras handlowych
 * (ląd LUB morze, zgodnie z findCityConnection) między KTÓRĄKOLWIEK parą miast z
 * `citiesA` i `citiesB`. Używane przez AI↔gracz/AI↔AI proaktywne propozycje Umowy
 * Handlowej (decideAIDiplomacy) — bramka "połączenie możliwe", NIE "trasa aktywna
 * dziś": ignoruje limit slotów z tradeRouteLimitForCity (budynki handlowe), bo ten
 * limit dotyczy przepustowości istniejących tras, nie tego, czy fizyczne
 * połączenie w ogóle istnieje. Wymóg Portu dla morza pozostaje (wbudowany w
 * findCityConnection).
 *
 * Czysta, zwraca na pierwszym trafieniu (short-circuit) — tanie dla typowej
 * liczby miast per cywilizacja.
 */
export function citiesHaveTradeConnection(
  citiesA: readonly TradeRouteCityRef[],
  citiesB: readonly TradeRouteCityRef[],
  map: GameMap,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
  territoryNodes?: readonly TerritoryNode[],
): boolean {
  // GOAL 4: memoizacja per-para-właścicieli lokalna dla TEGO wywołania — citiesA/
  // citiesB to zwykle wszystkie miasta dwóch konkretnych cywilizacji, więc bez
  // tego granica liczyłaby się ponownie dla każdej pary miast zamiast raz.
  const landBorderCache = new Map<string, boolean>();
  for (const a of citiesA) {
    for (const b of citiesB) {
      if (findCityConnection(a, b, map, 'lad', params, builtByCity, territoryNodes, landBorderCache).connected) return true;
      if (findCityConnection(a, b, map, 'morze', params, builtByCity, territoryNodes, landBorderCache).connected) return true;
    }
  }
  return false;
}

/**
 * Diagnoza, dlaczego między graczem a partnerem nie ma aktywnej trasy handlowej
 * mimo zawartej Umowy Handlowej (panel imperium → Aktywne umowy handlowe).
 * Zwraca komunikat PL lub null, gdy połączenie geometryczne jest możliwe (wtedy
 * trasa PODJĘŁA już istnieć — patrz T3 niżej — i brak jej w danych to kwestia
 * odświeżenia, nie blokady terytorialnej ani budynkowej).
 *
 * T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, 2026-08-24): PRZED T3 ta funkcja filtrowała
 * miasta po `tradeRouteLimitForCity(...) > 0` (budynek handlowy), bo bez niego
 * trasa faktycznie nie mogła istnieć — stąd komunikaty „brak Targowiska/Portu"
 * i „brak wolnego slotu trasy". Od T3 budynek handlowy JUŻ NIE warunkuje
 * istnienia trasy (tylko `TradeRoute.budynekOdblokowany`, konsumowane w T4) —
 * te dwa komunikaty są więc nieaktualne jako powód BRAKU trasy i zostały
 * usunięte; diagnoza sprawdza teraz geometrię/wojnę bezpośrednio na WSZYSTKICH
 * miastach (fizyczny wymóg Portu na morze pozostaje bez zmian, wewnątrz
 * `findCityConnection`/`citiesHaveTradeConnection`).
 *
 * GOAL 5 (R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1, 2026-09-03): dawny branch
 * „za daleko (N heks.)" był oparty na `hexDistance > params.ladMaxDist` — dystans
 * w LINII PROSTEJ jako powód BRAKU trasy lądowej. Od GOAL 1 dystans już NIE
 * blokuje connectivity lądowej (ani morskiej), więc ten branch jest MARTWY: skoro
 * `citiesHaveTradeConnection` niżej zwróciła false, oznacza to, że KAŻDA para
 * miast gracz↔partner jest fizycznie nieosiągalna (BFS) zarówno lądem, jak i
 * morzem — powód nigdy już nie jest „za daleko w linii prostej", tylko realna
 * geografia (różne kontynenty/wyspy bez portu) — dokładnie to, co właściciel
 * wprost zaakceptował jako warunek pozostający bez zmian (GOAL 6 dispatchu).
 * Komunikat morski („wymagany Port") zostaje — TO nadal bywa faktyczną,
 * osobną przyczyną (fizyczna ścieżka wodna istnieje, ale żadne miasto nie ma
 * Portu) — rozróżniona teraz jawnie od czysto geograficznej nieosiągalności.
 *
 * GOAL 5 (R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1, 2026-09-03): nowa gałąź
 * odróżnia "brak wspólnej granicy lądowej" (terytoria fizycznie osiągalne
 * lądem — BFS by się powiódł — ale żadna para miast gracz↔partner nie ma
 * stykających się terytoriów) od "brak fizycznego połączenia" (żadna ścieżka
 * lądowa nie istnieje niezależnie od granic, np. inny kontynent). Wykrywane
 * przez ponowne sprawdzenie `citiesHaveTradeConnection` z `territoryNodes`
 * jawnie `undefined` — to WYŁĄCZA wymóg granicy (patrz `landBorderShared`),
 * więc różnica wyniku między "z territoryNodes" i "bez" izoluje dokładnie ten
 * jeden warunek (medium='morze' jest identyczne w obu przypadkach — granica go
 * nie dotyczy — więc jeśli druga próba się powiedzie, to wyłącznie dzięki
 * lądowi bez wymogu granicy).
 */
export function diagnoseMissingTradeRouteForPartner(
  playerOwnerId: number,
  partnerOwnerId: number,
  cities: readonly TradeRouteCityRef[],
  map: GameMap,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  isAtWar: (ownerA: number, ownerB: number) => boolean,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
  partnerLabel?: string,
  territoryNodes?: readonly TerritoryNode[],
): string | null {
  if (isAtWar(playerOwnerId, partnerOwnerId)) {
    return 'wojna — szlaki zawieszone';
  }

  const label = partnerLabel ?? `cywilizacja ${partnerOwnerId}`;
  const playerCities = cities.filter(c => c.ownerId === playerOwnerId);
  const partnerCities = cities.filter(c => c.ownerId === partnerOwnerId);

  if (playerCities.length === 0 || partnerCities.length === 0) {
    return 'brak miast do handlu';
  }

  if (citiesHaveTradeConnection(playerCities, partnerCities, map, builtByCity, params, territoryNodes)) {
    return null; // T3: geometria połączona + traktat aktywny + brak wojny => trasa istnieje, nic do zdiagnozowania.
  }

  // GOAL 5: fizycznie osiągalne lądem (BFS by się powiódł), ale zadna para
  // terytoriów sie nie styka -- jedyny brakujacy warunek to wspolna granica.
  if (
    territoryNodes !== undefined &&
    citiesHaveTradeConnection(playerCities, partnerCities, map, builtByCity, params, undefined)
  ) {
    return `brak wspólnej granicy lądowej z ${label}`;
  }

  // GOAL 5 (dziedziczone z R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1): brak
  // połączenia (lądem ANI morzem, sprawdzone wyżej dla WSZYSTKICH par miast) —
  // rozróżnij "brak Portu" (fizyczna przyczyna łatwa do naprawienia przez
  // gracza, budując Port) od czysto geograficznej nieosiągalności (różne
  // kontynenty/wyspy — nic do zbudowania, to realna geografia mapy).
  const anyPlayerPort = playerCities.some(c => cityHasPort(c.id, builtByCity));
  const anyPartnerPort = partnerCities.some(c => cityHasPort(c.id, builtByCity));
  if (!anyPlayerPort || !anyPartnerPort) {
    return `brak fizycznego połączenia lądowego z ${label} i brak Portu do szlaku morskiego`;
  }

  return `brak fizycznego połączenia (lądowego ani morskiego) z ${label} — różne kontynenty/wyspy`;
}

/**
 * R-HANDEL-WYMIANA-TECH-GATE-Q1: slug technologii (tech.json „Technologia")
 * wymaganej, by właściciel prowadził JAKIKOLWIEK handel szlakowy — zewnętrzny
 * (traktatowy) LUB wewnątrz-cywilizacyjny. Wzorzec `EMBARK_TECH`
 * (embarkation.ts) — stała nazwy techu żyje w module `game/`, sam predykat
 * per-owner (`hasTradeTech` niżej) jest wstrzykiwany przez main.ts (ten moduł
 * jest czysty, nie zna `player.zbadane`/`aiResearchDone`).
 */
export const TRADE_TECH = 'Wymiana';

/**
 * refreshTradeRoutes — E3: ustala aktywne trasy handlowe wszystkich cywilizacji
 * (gracz + AI + państwa-miasta) na tę turę.
 *
 * R-HANDEL-LIMIT-TRAS-PELNY-Q1 (2026-09-04) — ODWRÓCENIE trzech wcześniejszych
 * decyzji, na wyraźne zgłoszenie właściciela (limit tras + uogólnienie na
 * wszystkie cywilizacje + handel wewnątrz-cywilizacyjny — patrz dispatch GOAL
 * 1-5). Historyczny kontekst KAŻDEJ odwróconej decyzji zostaje niżej (czemu
 * poprzedni temat zrobił to co zrobił), z jawnym dopiskiem, że został świadomie
 * odwrócony:
 *
 *   (1) TYLKO ZEWNĘTRZNY (odwrócone, patrz GOAL 5): przed tym tematem trasa
 *       łączyła WYŁĄCZNIE miasto GRACZA (ownerId===0) z miastem OBCEJ cywilizacji
 *       (ownerId!==0) — „Własne<->własne NIGDY nie tworzy trasy". Cytat
 *       wyzwalający właściciela (2026-09-04): „w sytuacji, gdy dana cywilizacja
 *       gracza, inna cywilizacja lub państwo-miasto nie mają żadnej umowy wymiany,
 *       mogą handlować pomiędzy swoimi miastami". Od tego tematu: KAŻDY właściciel
 *       (gracz, każde AI, każde państwo-miasto) z 2+ miastami handluje też
 *       WEWNĄTRZ siebie — bez traktatu (nie można mieć traktatu z samym sobą) i
 *       bez wymogu wspólnej granicy (irrelewantne dla tego samego właściciela),
 *       ALE z tym samym wymogiem fizycznej łączności BFS i tym samym wymogiem
 *       Portu dla morza. Te kandydatury wchodzą do TEGO SAMEGO poola co
 *       kandydatury zewnętrzne (patrz niżej), konkurując o te same existence-
 *       -sloty na równych zasadach.
 *   (2) TYLKO GRACZ<->OBCY, nie dowolne pary (odwrócone, patrz GOAL 4): przed tym
 *       tematem candidate-generation iterowała WYŁĄCZNIE `playerCities` (ownerId
 *       ===0) × `foreignCities` (ownerId!==0) — AI<->AI i AI<->państwo-miasto były
 *       ignorowane, mimo że `formAiAiTradeAgreementsIfEligible` (main.ts) od dawna
 *       zawiera dla nich realne traktaty. Od tego tematu: iteracja po WSZYSTKICH
 *       unikalnych parach WŁAŚCICIELI obecnych w `cities` (grupowanie po
 *       ownerId, para w kierunku kanonicznym ownerId rosnąco) — ten sam filtr
 *       isAtWar/hasTradeTreaty co dawniej, tylko już nie zawężony do gracza.
 *   (3) T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, 2026-08-24, częściowo odwrócone —
 *       patrz GOAL 1-2): T3 zniósł limit LICZBY tras per miasto całkowicie
 *       („Umowa handlowa od początku [...] daje nam pomimo braku wybudowanych
 *       budynków już środki samej odległości [...] Natomiast w momencie, gdy
 *       budynki staną wybudowane, to dochodzi dodatkowo tych 5% handlu") —
 *       budynki handlowe od T3 gatingowały WYŁĄCZNIE `budynekOdblokowany`
 *       (bonus 5%), nie samo istnienie. Cytat wyzwalający właściciela
 *       (2026-09-04): „miasto bez budynków miało tylko jedną drogę handlową
 *       [...] Kolejne budynki [...] umożliwiałyby kolejne drogi handlowe." — od
 *       tego tematu ISTNIENIE trasy jest znów ograniczone, ale przez NOWY,
 *       NIEZALEŻNY licznik `tradeRouteExistenceLimitForCity` (baza=1 slot NAWET
 *       bez budynków, +1 za każdy budynek handlowy) — `tradeRouteLimitForCity`
 *       (T3, buildings-only, zero baseline) zostaje BEZ ZMIAN i nadal gatinguje
 *       WYŁĄCZNIE `budynekOdblokowany`/bonus 5%, na przetrwałej (existence-
 *       -gated) liście tras. Te DWA tory (existence i bonus) są w pełni
 *       niezależne — miasto może mieć wolny existence-slot, ale zero bonusowych
 *       (Magazyn/Mennica nie liczą się do żadnego z nich, ECHO właściciela).
 *
 * Reguły BEZ ZMIAN w tym temacie:
 *   - Filtr pokoju: isAtWar(ownerA, ownerB) === true -> para wykluczona (wojna
 *     zrywa/blokuje trasę zewnętrzną; NIE dotyczy handlu wewnętrznego — właściciel
 *     nie może być w stanie wojny sam ze sobą).
 *   - Filtr traktatu (C-HANDEL-UMOWA=B, 2026-07-23): hasTradeTreaty(ownerA,
 *     ownerB) === false -> para zewnętrzna wykluczona. Handel WEWNĘTRZNY nie
 *     wymaga traktatu (nie można go zawrzeć z samym sobą, GOAL 5).
 *   - Wymóg wspólnej granicy lądowej dla LAD (R-HANDEL-SZLAKI-WYMOG-GRANICY-
 *     LADOWEJ-Q1) — WYŁĄCZNIE dla par ZEWNĘTRZNYCH; handel wewnętrzny (GOAL 5)
 *     jawnie POMIJA ten wymóg (przekazuje `territoryNodes=undefined` do
 *     `findCityConnection`/`detectBestConnection` WYŁĄCZNIE dla kandydatur tego
 *     samego właściciela — `landBorderShared` z `territoryNodes===undefined`
 *     zwraca `true` NIEZALEŻNIE od par ownerId, czyli dokładnie "wymóg
 *     wyłączony" — zero zmian w samej `findCityConnection`/`ownersHaveSharedLandBorder`).
 *     Fizyczny wymóg Portu dla morza BEZ ZMIAN, dla obu rodzajów par.
 *
 * PRIORYTET KANDYDATÓW (GOAL 3, ZMIENIONY w tym temacie — dotyczy OBU torów,
 * existence i bonus, ujednoliconych na tę samą kolejność): dawniej (T3) —
 * najpierw istniejące trasy z poprzedniej tury (`existingRoutes`, sortowane po
 * id), DOPIERO POTEM nowe kandydatury wg ROSNĄCEGO dystansu ("najbliższe
 * wygrywają", dwa odrębne przebiegi Pass1-then-Pass2). Cytat wyzwalający
 * właściciela: „każde miasto zawsze wybiera drogę najbardziej lukratywną, czyli
 * najdalszą, ale jeżeli już jest niedostępna, to potem dobiera drogi bliższe."
 * Od tego tematu: WSZYSTKIE kandydatury (kontynuujące ORAZ nowe) są połączone w
 * JEDNĄ listę i posortowane razem wg MALEJĄCEGO dochodu
 * (`tradeRouteTotalDistanceIncome` — dochód WPROST, nie surowy dystans, żeby
 * uwzględnić bonus morski ×2 w porównaniach ląd/morze), z tie-breakiem
 * stabilności (kandydatura kontynuująca wygrywa przy DOKŁADNYM remisie dochodu)
 * i wreszcie po `id` dla pełnego determinizmu. Kandydaci są następnie
 * przetwarzani w TYM POJEDYNCZYM porządku — pierwszy napotkany dla danej pary
 * miast, dla którego OBIE strony mają wolny slot, zajmuje go.
 *
 * DECYZJA (dokumentacja żywego testu, patrz GOAL 3 dispatchu): POŁĄCZONE
 * sortowanie (nie oddzielne przebiegi Pass1-then-Pass2 z priorytetem
 * bezwarunkowym dla istniejących) było KONIECZNE, nie tylko możliwe — dowód:
 * scenariusz „stopniowego wypierania" (kryterium końca #5, drugi test) —
 * miasto z 1 slotem ma aktywną trasę WEWNĘTRZNĄ (niski dochód, kontynuowaną z
 * poprzedniej tury); po zawarciu Umowy Szlaków pojawia się kandydatura
 * ZEWNĘTRZNA o WYŻSZYM dochodzie. Gdyby istniejące trasy nadal miały
 * bezwarunkowe pierwszeństwo (dawny Pass 1 zawsze przed Pass 2), trasa
 * wewnętrzna zajęłaby jedyny slot miasta PRZED wygenerowaniem/rozważeniem nowej
 * kandydatury zewnętrznej, która nigdy nie dostałaby szansy wyparcia jej —
 * sprzeczne z kryterium „trasa wewnętrzna znika, zastąpiona zewnętrzną, BEZ
 * specjalnej logiki warunkowej". Połączone sortowanie po dochodzie naprawia to
 * z definicji: kandydatura o wyższym dochodzie (zewnętrzna) jest przetwarzana
 * PIERWSZA niezależnie od tego, czy jest "nowa" czy "kontynuująca" — usuwa
 * potrzebę jakiejkolwiek dodatkowej gałęzi "czy jest traktat". Żywy test:
 * patrz `gra/tools/trade-routes-limit-test.cjs`, sekcja "wypieranie".
 *
 * Czysta funkcja — nie mutuje `existingRoutes`; zwraca nową listę (wyłącznie
 * trasy aktualnie połączone => wszystkie mają status 'polaczony'; trasa, która
 * przestała spełniać warunki — geometrii, wojny, traktatu ALBO existence-slotu —
 * po prostu znika z wyniku zamiast dostawać status 'zawieszony').
 *
 * @param cities        WSZYSTKIE miasta biorące udział w handlu (gracz + AI +
 *                       państwa-miasta kwalifikujące się do handlu, GOAL 4-5:
 *                       generyczne po ownerId, nie tylko gracz+obcy). Wykluczenie
 *                       barbarzyńców / niekwalifikujących się właścicieli to
 *                       odpowiedzialność wywołującego (main.ts) — ten moduł nie
 *                       zna pojęcia "barbarzyńca".
 * @param existingRoutes trasy z poprzedniej tury (dla ciągłości/stabilności).
 * @param map           mapa świata (do findCityConnection).
 * @param builtByCity   cityId -> zbudowane budynki (bonus `budynekOdblokowany`
 *                       + baseline `tradeRouteExistenceLimitForCity` + niezmieniony
 *                       wymóg fizycznego Portu na morzu).
 * @param isAtWar       (ownerA, ownerB) => czy strony są w stanie wojny (pomijane
 *                       dla par WEWNĘTRZNYCH, GOAL 5 — właściciel nie może być w
 *                       stanie wojny sam ze sobą).
 * @param hasTradeTreaty (ownerA, ownerB) => czy strony mają AKTYWNĄ Umowę Szlaków
 *                       (RodzajTraktatu.UmowaSzlakow — NIE „UmowaHandlowa", nazwa
 *                       legacy w tej prozie/komentarzach, ani `UmowaWymiany`,
 *                       koszyk PN — patrz RECON część D dispatchu). Wstrzyknięte
 *                       przez wywołującego (main.ts, z realnych traktatów
 *                       diplomacy-treaties) — ten moduł CELOWO nie zna stanu
 *                       dyplomacji, tak samo jak isAtWar. Pomijane dla par
 *                       WEWNĘTRZNYCH (GOAL 5 — nie można zawrzeć traktatu z samym
 *                       sobą).
 * @param params        progi dystansu (handel_szlaki, patrz loadTradeRouteParams) —
 *                       WYŁĄCZNIE referencyjne dla connectivity legacy (GOAL 1 w
 *                       poprzednim temacie); realny szczyt krzywej DOCHODU (do
 *                       sortowania priorytetu, ten temat) czyta `incomeParams`.
 * @param territoryNodes R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1: węzły terytorium
 *                       WSZYSTKICH właścicieli (reużycie main.ts:buildAllTerritoryNodes()/
 *                       map/territory.ts:territoryOwnerAt — model terytorium BEZ
 *                       ZMIAN), do wymogu wspólnej granicy lądowej między ownerami
 *                       PAR ZEWNĘTRZNYCH (`ownersHaveSharedLandBorder`) — GOAL 5
 *                       tego tematu: pary WEWNĘTRZNE zawsze pomijają ten wymóg,
 *                       niezależnie od tego argumentu. `undefined` (domyślne) =
 *                       WSTECZNA ZGODNOŚĆ, wymóg wyłączony dla WSZYSTKICH par —
 *                       WYŁĄCZNIE dla wywołujących spoza allowlisty tego tematu
 *                       (testy innego wymiaru bez fikstur terytorium, patrz
 *                       komentarz przy `landBorderShared`); main.ts ZAWSZE
 *                       przekazuje realne dane.
 * @param incomeParams  R-HANDEL-LIMIT-TRAS-PELNY-Q1 (GOAL 3): parametry dochodu
 *                       (`loadTradeRouteIncomeParams`) użyte WYŁĄCZNIE do
 *                       wyliczenia klucza sortowania priorytetu kandydatów
 *                       (`tradeRouteTotalDistanceIncome`) — nie zmienia SAMEGO
 *                       dochodu żadnej trasy (ten liczy się osobno, w
 *                       `computeTradeRouteIncomeByCity`, z własnym `incomeParams`
 *                       przekazanym przez main.ts w tamtym wywołaniu). Domyślne
 *                       `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` dla wywołujących spoza
 *                       allowlisty tego tematu, którzy nie przekazują tego
 *                       argumentu — main.ts ZAWSZE przekazuje realne dane
 *                       (`loadTradeRouteIncomeParams` z econ-params.json).
 * @param hasTradeTech  R-HANDEL-WYMIANA-TECH-GATE-Q1: (ownerId) => czy właściciel
 *                       zbadał `TRADE_TECH` ("Wymiana"). Bramuje candidate-
 *                       generation (kandydat bez techu w ogóle NIE POWSTAJE —
 *                       nie zajmuje existence-slotu ani miejsca w priorytetyzacji),
 *                       para zewnętrzna wymaga `hasTradeTech` PO OBU stronach,
 *                       para wewnętrzna (ten sam właściciel) wymaga go raz. Ta
 *                       sama reguła obowiązuje kandydatów KONTYNUUJĄCYCH
 *                       (`existingRoutes`) — trasa, której właściciel przestał
 *                       spełniać warunek, znika z wyniku tak samo jak przy
 *                       utracie traktatu/geometrii. Domyślne `() => true` =
 *                       WSTECZNA ZGODNOŚĆ dla wywołujących spoza allowlisty tego
 *                       tematu; main.ts ZAWSZE przekazuje realny predykat oparty
 *                       o `unlockedTechSetForOwner`/`ownerResearchedTechs`.
 */
export function refreshTradeRoutes(
  cities: readonly TradeRouteCityRef[],
  existingRoutes: readonly TradeRoute[],
  map: GameMap,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  isAtWar: (ownerA: number, ownerB: number) => boolean,
  hasTradeTreaty: (ownerA: number, ownerB: number) => boolean,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
  territoryNodes?: readonly TerritoryNode[],
  incomeParams: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
  hasTradeTech: (ownerId: number) => boolean = () => true,
): TradeRoute[] {
  if (cities.length === 0) return [];

  const cityById = new Map<string, TradeRouteCityRef>();
  for (const c of cities) cityById.set(c.id, c);

  // GOAL 4: grupowanie po właścicielu — candidate-generation iteruje WSZYSTKIE
  // unikalne pary właścicieli obecnych w `cities` (kierunek kanoniczny: ownerId
  // rosnąco), nie tylko gracz(0)<->obcy.
  const citiesByOwner = new Map<number, TradeRouteCityRef[]>();
  for (const c of cities) {
    const arr = citiesByOwner.get(c.ownerId);
    if (arr) arr.push(c); else citiesByOwner.set(c.ownerId, [c]);
  }
  const ownerIds = Array.from(citiesByOwner.keys()).sort((a, b) => a - b);

  // GOAL 4: adjacency liczone RAZ na to wywołanie refreshTradeRoutes (lokalna
  // Map<string,boolean> per-para-właścicieli, NIE per-para-miast — patrz
  // `landBorderShared`), przekazywana w dół do wszystkich findCityConnection/
  // detectBestConnection poniżej (kandydaci kontynuujący + nowi, zewnętrzni +
  // wewnętrzni). Wywołania WEWNĘTRZNE (GOAL 5) przekazują `territoryNodes=undefined`
  // jawnie zamiast tego cache'a wprost — `landBorderShared` zwraca `true` na
  // samym początku, gdy `territoryNodes===undefined`, WCZEŚNIEJ niż jakikolwiek
  // odczyt/zapis cache'a (patrz jej definicja wyżej), więc dzielenie tego samego
  // obiektu Map między wywołaniami zewnętrznymi i wewnętrznymi jest bezpieczne —
  // wywołania wewnętrzne nigdy go nie dotykają.
  const landBorderCache = new Map<string, boolean>();

  // GOAL 1-2: NOWY, NIEZALEŻNY tor existence-slotów — decyduje, czy trasa w
  // ogóle TRAFIA do wyniku (`kept[]`). Baza=1 slot nawet bez budynków (patrz
  // `tradeRouteExistenceLimitForCity`).
  const usedExistenceSlots = new Map<string, number>();
  const existenceLimitOf = (cityId: string): number =>
    tradeRouteExistenceLimitForCity(cityId, builtByCity);
  const hasExistenceRoom = (cityId: string): boolean =>
    (usedExistenceSlots.get(cityId) ?? 0) < existenceLimitOf(cityId);
  const useExistenceSlot = (cityId: string): void => {
    usedExistenceSlots.set(cityId, (usedExistenceSlots.get(cityId) ?? 0) + 1);
  };

  // T3 (bez zmian w tym torze — zero baseline, buildings-only): sloty budynkowe
  // decydują WYŁĄCZNIE o polu `budynekOdblokowany`, na liście PRZETRWAŁEJ
  // existence-gatingu (GOAL 2 — "bez zmian algorytmu, tylko mniej kandydatów na
  // wejściu").
  const usedSlots = new Map<string, number>();
  const limitOf  = (cityId: string): number => tradeRouteLimitForCity(cityId, builtByCity);
  const hasRoom  = (cityId: string): boolean => (usedSlots.get(cityId) ?? 0) < limitOf(cityId);
  const useSlot  = (cityId: string): void => {
    usedSlots.set(cityId, (usedSlots.get(cityId) ?? 0) + 1);
  };
  // Trasa dostaje budynekOdblokowany=true tylko gdy OBIE strony mają wolny slot —
  // jeśli tylko jedna strona ma slot, żadna nie jest zużywana (analogicznie do
  // starego hasRoom(from)&&hasRoom(to) przed konsumpcją, żeby nie "psuć" slotu
  // jednej strony na trasę, która i tak nie dostanie flagi).
  const grantBuilding = (fromId: string, toId: string): boolean => {
    if (!hasRoom(fromId) || !hasRoom(toId)) return false;
    useSlot(fromId);
    useSlot(toId);
    return true;
  };

  const incomeOf = (distance: number, medium: TradeRouteMedium): number =>
    tradeRouteTotalDistanceIncome(distance, medium, incomeParams);

  // --- Kandydaci KONTYNUUJĄCY: trasy z `existingRoutes`, które nadal spełniają
  //     warunki (geometria/wojna/traktat — GENERYCZNE, zewnętrzne LUB wewnętrzne
  //     wg aktualnego ownerId obu miast, NIE wg zapamiętanych pól trasy — miasto
  //     mogło zmienić właściciela). Existence-gating dzieje się DOPIERO w
  //     połączonym sortowaniu niżej — tu tylko ustalamy, co jest GEOMETRYCZNIE/
  //     TRAKTATOWO nadal ważne. ---
  const stillValid: TradeRouteCandidate[] = [];
  for (const route of existingRoutes) {
    const from = cityById.get(route.fromCityId);
    const to   = cityById.get(route.toCityId);
    if (!from || !to) continue;
    const wewnetrzna = from.ownerId === to.ownerId;
    if (wewnetrzna) {
      if (!hasTradeTech(from.ownerId)) continue; // R-HANDEL-WYMIANA-TECH-GATE-Q1: brak techu -> trasa wewnetrzna znika
    } else {
      if (isAtWar(from.ownerId, to.ownerId)) continue;
      if (!hasTradeTreaty(from.ownerId, to.ownerId)) continue; // C-HANDEL-UMOWA=B: brak/zerwana Umowa Szlaków -> trasa znika
      if (!hasTradeTech(from.ownerId) || !hasTradeTech(to.ownerId)) continue; // R-HANDEL-WYMIANA-TECH-GATE-Q1: brak techu po ktorejkolwiek stronie -> trasa zewnetrzna znika
    }
    const conn = findCityConnection(
      from, to, map, route.medium, params, builtByCity,
      wewnetrzna ? undefined : territoryNodes, // GOAL 5: wewnętrzna pomija wymóg granicy
      landBorderCache,
      false, // GOAL 6: candidate-generation nie czyta pathHexes -- pomiń rekonstrukcję ścieżki
    );
    if (!conn.connected) continue; // dla morza wciąż wymaga fizycznego Portu w obu miastach; dla lądu zewnętrznego dodatkowo wymaga wspólnej granicy
    stillValid.push({ from, to, medium: route.medium, distance: conn.distance, id: route.id, isExisting: true });
  }
  // Runda 2 / zarzut 1: dedup po BEZKIERUNKOWEJ parze miast, nie po id (patrz
  // `tradeRoutePairKey`). `stillValid` dedupujemy TAKŻE wobec siebie — zapis gry
  // sporządzony przed tą poprawką może już nieść bliźniaka, a wczytanie takiego
  // stanu nie może go utrwalać.
  const stillValidPairs = new Set<string>();
  const stillValidUnique: TradeRouteCandidate[] = [];
  for (const cand of stillValid) {
    const key = tradeRoutePairKey(cand.from.id, cand.to.id);
    if (stillValidPairs.has(key)) continue; // zachowujemy PIERWSZE wystąpienie (kolejność `existingRoutes`)
    stillValidPairs.add(key);
    stillValidUnique.push(cand);
  }

  // --- Kandydaci NOWI: (a) ZEWNĘTRZNI — każda unikalna para WŁAŚCICIELI (GOAL 4),
  //     (b) WEWNĘTRZNI — pary miast TEGO SAMEGO właściciela (GOAL 5). ---
  const fresh: TradeRouteCandidate[] = [];

  // (a) Zewnętrzni: kierunek kanoniczny ownerA<ownerB (ownerIds posortowane
  //     rosnąco) — jedna, deterministyczna trasa na parę miast, bez duplikatu
  //     odwrotnego kierunku (income/gating są symetryczne, patrz
  //     `computeTradeRouteIncomeByCity`).
  for (let i = 0; i < ownerIds.length; i++) {
    for (let j = i + 1; j < ownerIds.length; j++) {
      const ownerA = ownerIds[i]!;
      const ownerB = ownerIds[j]!;
      if (isAtWar(ownerA, ownerB)) continue;
      if (!hasTradeTreaty(ownerA, ownerB)) continue; // C-HANDEL-UMOWA=B: bez Umowy Szlaków para wykluczona
      if (!hasTradeTech(ownerA) || !hasTradeTech(ownerB)) continue; // R-HANDEL-WYMIANA-TECH-GATE-Q1: brak techu po ktorejkolwiek stronie -> para wykluczona z candidate-generation
      const citiesA = citiesByOwner.get(ownerA)!;
      const citiesB = citiesByOwner.get(ownerB)!;
      for (const a of citiesA) {
        for (const b of citiesB) {
          // GOAL 6: needPath=false -- candidate-generation nie czyta pathHexes.
          const best = detectBestConnection(a, b, map, params, builtByCity, territoryNodes, landBorderCache, false);
          if (!best) continue; // dla morza nadal wymaga Portu w obu miastach; dla lądu dodatkowo wymaga wspólnej granicy
          const id = tradeRouteId(a.id, b.id, best.medium);
          if (stillValidPairs.has(tradeRoutePairKey(a.id, b.id))) continue; // ta PARA MIAST już policzona jako kontynuacja (dedup bezkierunkowy, patrz `tradeRoutePairKey`)
          fresh.push({ from: a, to: b, medium: best.medium, distance: best.distance, id, isExisting: false });
        }
      }
    }
  }

  // (b) Wewnętrzni (GOAL 5): pary miast TEGO SAMEGO właściciela, bez traktatu/
  //     granicy, z fizyczną łącznością BFS (territoryNodes=undefined jawnie —
  //     wyłącza wymóg granicy niezależnie od tego, co main.ts przekazał dla par
  //     zewnętrznych). Kierunek kanoniczny: miasta posortowane po id, i<j.
  for (const ownerId of ownerIds) {
    const ownerCities = citiesByOwner.get(ownerId)!;
    if (ownerCities.length < 2) continue;
    if (!hasTradeTech(ownerId)) continue; // R-HANDEL-WYMIANA-TECH-GATE-Q1: brak techu -> zero kandydatur wewnetrznych dla tego wlasciciela
    const sorted = ownerCities.slice().sort((x, y) => x.id.localeCompare(y.id));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        // GOAL 6: needPath=false -- candidate-generation nie czyta pathHexes.
        const best = detectBestConnection(a, b, map, params, builtByCity, undefined, landBorderCache, false);
        if (!best) continue;
        const id = tradeRouteId(a.id, b.id, best.medium);
        if (stillValidPairs.has(tradeRoutePairKey(a.id, b.id))) continue; // jw. — dedup po PARZE MIAST, nie po kierunkowym id
        fresh.push({ from: a, to: b, medium: best.medium, distance: best.distance, id, isExisting: false });
      }
    }
  }

  // --- Połączone sortowanie (GOAL 3, patrz DECYZJA w docstringu wyżej): dochód
  //     malejąco, tie-break stabilności (kontynuujący wygrywa remis), potem id. ---
  const combined: TradeRouteCandidate[] = [...stillValidUnique, ...fresh];
  combined.sort((x, y) => {
    const incomeX = incomeOf(x.distance, x.medium);
    const incomeY = incomeOf(y.distance, y.medium);
    if (incomeY !== incomeX) return incomeY - incomeX;
    if (x.isExisting !== y.isExisting) return x.isExisting ? -1 : 1;
    return x.id.localeCompare(y.id);
  });

  // --- Przetwarzanie w kolejności priorytetu: existence-gating decyduje, czy
  //     trasa w ogóle wchodzi do wyniku; budynkowy bonus (grantBuilding) działa
  //     PO tym gatingu, na tej samej, przetrwałej liście, w TEJ SAMEJ kolejności
  //     (GOAL 2-3 — "bez zmian algorytmu bonusu, tylko mniej kandydatów na wejściu,
  //     ta sama kolejność"). ---
  const kept: TradeRoute[] = [];
  // Runda 2 / zarzut 1: OSTATECZNY, autorytatywny inwariant wyniku — co najwyżej
  // JEDEN szlak na parę miast, niezależnie od kierunku i medium. Filtry przy
  // generacji kandydatów wyżej są optymalizacją (nie produkuj tego, co i tak
  // odpadnie); TA pętla jest miejscem, które gwarantuje inwariant, więc żadna
  // przyszła ścieżka kandydatów nie może go obejść po cichu.
  const keptPairs = new Set<string>();
  for (const cand of combined) {
    const pairKey = tradeRoutePairKey(cand.from.id, cand.to.id);
    if (keptPairs.has(pairKey)) continue; // duplikat tej samej pary miast (odwrócony kierunek / inne medium)
    if (!hasExistenceRoom(cand.from.id) || !hasExistenceRoom(cand.to.id)) continue; // brak wolnego slotu istnienia -> trasa POMIJANA CAŁKOWICIE
    keptPairs.add(pairKey);
    useExistenceSlot(cand.from.id);
    useExistenceSlot(cand.to.id);
    kept.push({
      id: cand.id,
      fromCityId: cand.from.id,
      toCityId: cand.to.id,
      ownerId: cand.from.ownerId,
      toOwnerId: cand.to.ownerId,
      medium: cand.medium,
      dystans: cand.distance,
      status: 'polaczony',
      budynekOdblokowany: grantBuilding(cand.from.id, cand.to.id),
    });
  }

  return kept;
}

// ---------------------------------------------------------------------------
// E3: dochód z tras — składnik dystansowy (Q7=A) + agregaty per-miasto
// ---------------------------------------------------------------------------

/**
 * Parametry dochodu dystansowego (data/econ-params.json, blok "handel_szlaki").
 *
 * R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1 (2026-09-03, GOAL 3 dispatchu): od tego
 * tematu `ladMaxDist`/`morzeMaxDist` TUTAJ (w odróżnieniu od tych samych nazw pól
 * w `TradeRouteParams` wyżej — patrz komentarz tam) to WYŁĄCZNIE referencyjny
 * dystans SZCZYTU krzywej dochodu (nigdy próg blokujący connectivity — ten zniknął,
 * patrz GOAL 1/`computeCityConnection`). Rozdzielenie od `TradeRouteParams` jest
 * celowe: connectivity mogła w przyszłości dostać inny sposób strojenia bez
 * przypadkowego spłaszczenia krzywej dochodu (i odwrotnie) — mimo że OBA typy dziś
 * czytają z JSON te same klucze `lad_max_dystans`/`morze_max_dystans`
 * (`loadTradeRouteParams` vs `loadTradeRouteIncomeParams`), są to dwa NIEZALEŻNE
 * pola w dwóch NIEZALEŻNYCH strukturach.
 */
export interface TradeRouteIncomeParams {
  /** Dochód (pieniądz) trasy przy dystansie 0 — dolna podłoga wzoru. */
  dochodPodloga: number;
  /** Dochód (pieniądz) trasy przy dystansie = maxDist DLA DANEGO MEDIUM — szczyt wzoru. */
  dochodSzczyt: number;
  /** Referencyjny dystans heksowy SZCZYTU krzywej dochodu dla szlaku lądowego (NIE próg connectivity — patrz komentarz interfejsu wyżej). */
  ladMaxDist: number;
  /** Referencyjny dystans heksowy SZCZYTU krzywej dochodu dla szlaku morskiego (NIE próg connectivity — patrz komentarz interfejsu wyżej). */
  morzeMaxDist: number;
}

/**
 * Wartości domyślne (gdy econ-params.json niedostępny / brak kluczy).
 *
 * PRZEBUDOWA R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, ECHO właściciela 2026-08-21:
 * zasada odwrócona (dochód ROŚNIE z dystansem, nie maleje) + stawki ×5.
 * Derywacja (patrz T1 w docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md):
 *   - stary floor=1 ×5 -> nowa PODŁOGA=5 (dystans=0).
 *   - stary bazowy=8 ×5 -> nowy SZCZYT=40 (dystans=maxDist DLA DANEGO MEDIUM).
 *   - Q1: zakres odwrócenia OSOBNY per medium — najdalsza trasa lądowa
 *     (ladMaxDist=12) i najdalsza trasa morska (morzeMaxDist=20) dają
 *     IDENTYCZNY szczytowy dochód (40), mimo różnych maxDist -> stawka
 *     wzrostu per heks jest inna dla lądu ((40-5)/12) i morza ((40-5)/20).
 */
export const DEFAULT_TRADE_ROUTE_INCOME_PARAMS: TradeRouteIncomeParams = {
  dochodPodloga: 5,
  dochodSzczyt: 40,
  ladMaxDist: 12,
  morzeMaxDist: 20,
};

/**
 * Wzór dystansowy (przebudowa ECHO Q1 + p.3, 2026-08-21): dochód ROŚNIE liniowo
 * z dystansem, od dochodPodloga (dystans=0) do dochodSzczyt (dystans=maxDist
 * WŁAŚCIWEGO DLA TEGO MEDIUM — ląd vs morze mają osobne maxDist, ale ten sam
 * szczyt).
 *
 * R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1 (2026-09-03, GOAL 3 dispatchu): odkąd
 * connectivity (GOAL 1) już NIE ogranicza `dystans` do [0, maxDist] — trasa może
 * dziś fizycznie mieć setki heksów na dużej mapie — wejście do wzoru liniowego jest
 * JAWNIE przycięte do `Math.min(dystans, maxDist)` PRZED podstawieniem, żeby
 * istniejące, bliskie trasy (≤maxDist) zarabiały DOKŁADNIE tyle co dziś (zero
 * zmiany balansu, kryterium końca #2 dispatchu), a każda trasa DALSZA niż
 * referencyjny dystans szczytu dostawała dochód RÓWNY szczytowi — nigdy więcej,
 * nigdy ekstrapolowany powyżej (kryterium końca #3). Wynik dodatkowo przycięty do
 * [dochodPodloga, dochodSzczyt] (clamp na wyjściu) jako druga, niezależna linia
 * obrony przed zaokrągleniem (Math.floor) — z samym przycięciem wejścia te dwa
 * zabezpieczenia dają identyczny wynik dla dystansu w [0, maxDist], więc druga
 * warstwa jest tu redundantna, ale tania i nieszkodliwa.
 */
export function tradeRouteDistanceIncome(
  dystans: number,
  medium: TradeRouteMedium,
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
): number {
  const maxDist = medium === 'lad' ? params.ladMaxDist : params.morzeMaxDist;
  const dystansPrzyciety = Math.min(dystans, maxDist);
  const stawkaWzrostu = (params.dochodSzczyt - params.dochodPodloga) / maxDist;
  const raw = params.dochodPodloga + dystansPrzyciety * stawkaWzrostu;
  return Math.min(params.dochodSzczyt, Math.max(params.dochodPodloga, Math.floor(raw)));
}

/**
 * Dochód FINALNY (dystansowy) z trasy — przebudowa ECHO Q2, 2026-08-21: trasa
 * morska dostaje bonus ×2 wobec czystej krzywej dystansowej
 * (tradeRouteDistanceIncome), trasa lądowa zostaje bez zmian. Ten bonus SUMUJE
 * SIĘ z istniejącym, osobnym mechanizmem PORT_SEA_TRADE_BONUS_PIENIADZ
 * (+1 Pieniądza/turę za trasę morską ponad pierwszą, computeSeaTradeBonusIncomeByCity)
 * — oba działają równolegle, żadne z nich nie zastępuje drugiego.
 *
 * Wszyscy wywołujący, którzy dziś liczą FINALNY dochód trasy (nie samą krzywą
 * dystansową) mają używać TEJ funkcji zamiast tradeRouteDistanceIncome —
 * m.in. computeTradeRouteIncomeByCity niżej (ścieżka realnego wpisu do
 * skarbca przez turn-economy.ts) oraz main.ts (panel Handlu, chip HUD,
 * event log nowej trasy).
 */
export function tradeRouteTotalDistanceIncome(
  dystans: number,
  medium: TradeRouteMedium,
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
): number {
  const base = tradeRouteDistanceIncome(dystans, medium, params);
  const dawnyWynik = medium === 'morze' ? base * 2 : base;
  return Math.max(1, Math.round(dawnyWynik / 5));
}

interface RawEconParamsJsonTradeIncome {
  handel_szlaki?: Record<string, RawParamRow>;
}

/**
 * Wczytaj TradeRouteIncomeParams z surowego econ-params.json (grupa "handel_szlaki",
 * te same klucze na wszystkich poziomach trudności — to parametr geografii/
 * gameplayu jak lad_max_dystans/morze_max_dystans, nie skalowanie trudności).
 */
export function loadTradeRouteIncomeParams(
  raw: RawEconParamsJsonTradeIncome,
  difficulty: Difficulty,
): TradeRouteIncomeParams {
  const grp = raw.handel_szlaki ?? {};
  const read = (key: string, fallback: number): number => {
    const row = grp[key];
    const v = row ? row[difficulty] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  return {
    dochodPodloga: read('dochod_podloga', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.dochodPodloga),
    dochodSzczyt:  read('dochod_szczyt', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.dochodSzczyt),
    ladMaxDist:    read('lad_max_dystans', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.ladMaxDist),
    morzeMaxDist:  read('morze_max_dystans', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.morzeMaxDist),
  };
}

/**
 * Dochód dystansowy per-miasto: KAŻDA aktywna trasa kredytuje OBU miastom
 * (fromCityId i toCityId) pełną kwotę tradeRouteDistanceIncome(dystans) —
 * Q8=B, obie strony zarabiają, bez podziału. Miasto uczestniczące w wielu
 * trasach sumuje wkłady. Do wpięcia w turn-economy.ts jako "pieniadzZTras"
 * (dochód czysto do skarbca, pomija Wealth — patrz advanceCityEconomy).
 *
 * CUDA-HANDEL-01 (Maciej 2026-07-26): `wonderTradeBonusForOwner` — resolver
 * wstrzyknięty przez wołającego (main.ts, sumWonderTradeRouteBonusForOwner z
 * wonders-data.ts), ten sam wzorzec co resolveOwnerEra/resolveOwnerZlotoAccess
 * gdzie indziej w projekcie — ten moduł CELOWO nie zna wonders-data.ts (uniknięcie
 * zależności cyklicznej i zachowanie trade-routes.ts jako pure logic bez wiedzy
 * o cudach). Zwraca sumę % bonusu "handel_procent" (addytywna kumulacja, patrz
 * wonders-data.ts) dla danego ownera i medium tej KONKRETNEJ trasy — liczony
 * OSOBNO dla każdej strony (fromCityId wg route.ownerId, toCityId wg
 * route.toOwnerId), bo obaj właściciele mogą mieć różne cuda. Domyślnie 0 (brak
 * bonusu) — zachowuje dokładnie dawne zachowanie dla wywołań bez 3. argumentu.
 */
export function computeTradeRouteIncomeByCity(
  routes: readonly TradeRoute[],
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
  wonderTradeBonusForOwner: (ownerId: number, medium: TradeRouteMedium) => number = () => 0,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const route of routes) {
    if (route.status !== 'polaczony') continue;
    const baseIncome = tradeRouteTotalDistanceIncome(route.dystans, route.medium, params);
    const fromMult = 1 + wonderTradeBonusForOwner(route.ownerId, route.medium);
    const toMult   = 1 + wonderTradeBonusForOwner(route.toOwnerId, route.medium);
    const fromIncome = fromMult === 1 ? baseIncome : Math.floor(baseIncome * fromMult);
    const toIncome   = toMult === 1 ? baseIncome : Math.floor(baseIncome * toMult);
    out.set(route.fromCityId, (out.get(route.fromCityId) ?? 0) + fromIncome);
    out.set(route.toCityId,   (out.get(route.toCityId)   ?? 0) + toIncome);
  }
  return out;
}

/**
 * T4 (ECHO Q3 Wariant C): stawka per-trasowego bonusu Handlu za budynek handlowy
 * — 5% własnego dochodu dystansowego trasy. Jedno miejsce prawdy dla tej liczby
 * (dawniej literał `0.05` w ciele computeTradeRouteBuildingBonusByCity).
 */
export const TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05;

/**
 * T6 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1): bonus 5% JEDNEJ, KONKRETNEJ trasy — dokładnie
 * ten sam składnik, który `computeTradeRouteBuildingBonusByCity()` (T4, niżej) sumuje
 * per miasto. To CZYSTA EKSTRAKCJA ciała pętli tamtej funkcji, wprowadzona wyłącznie
 * po to, by warstwa prezentacji (main.ts::buildEmpireTradeSnap → panel imperium,
 * zakładka Handel) pokazywała rozkład dochodu per trasa z TEJ SAMEJ formuły, a nie
 * z czwartej, własnej kopii wzoru — precedens `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`
 * (trzy rozjechane kopie wzoru dystansowego, zamknięte przy T2). ŻADNEJ zmiany
 * logiki liczenia: agregat niżej woła tę funkcję, więc obie ścieżki są z definicji
 * bit-identyczne (pilnuje tego sekcja K w tools/trade-routes-income-test.cjs).
 *
 * Zwraca `0` dla trasy niepołączonej ORAZ dla trasy bez pokrycia budynkowego
 * (`budynekOdblokowany === false`) — dokładnie te dwa `continue` z pętli agregatu.
 * BEZ mnożnika bonusu cudów (CUDA-HANDEL-01) — osobny, niepowiązany mechanizm,
 * tak samo jak w T4.
 */
export function tradeRouteBuildingBonusForRoute(
  route: TradeRoute,
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
): number {
  if (route.status !== 'polaczony') return 0;
  if (!route.budynekOdblokowany) return 0;
  return TRADE_ROUTE_BUILDING_BONUS_RATE
    * tradeRouteTotalDistanceIncome(route.dystans, route.medium, params);
}

/**
 * T4 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, ECHO Q3 Wariant C, runda 2): suma
 * per-trasowych bonusów Handlu — dla każdej trasy TEGO miasta (obie role —
 * from i to) z `budynekOdblokowany===true`, dolicz `0.05 × własny dochód
 * dystansowy tej strony trasy` (tradeRouteTotalDistanceIncome — T1+T2, ląd
 * bez mnożnika, morze ×2 — CELOWO BEZ mnożnika bonusu cudów CUDA-HANDEL-01,
 * osobny niepowiązany mechanizm; recon rundy 1, decision-abc.md). Trasa BEZ
 * budynku (budynekOdblokowany=false) nie wnosi nic — zamyka ryzyko znalezione
 * przez Final Control T3 (stary computeTradeRouteCountByCity liczył WSZYSTKIE
 * połączone trasy niezależnie od budynku). Wejście do addytywnego składnika
 * Handlu w economy.ts (CityYieldContext.premiaHandluTrasHandlowych),
 * ZASTĘPUJE stary computeTradeRouteCountByCity/mnożnik (1+0.05×n).
 */
export function computeTradeRouteBuildingBonusByCity(
  routes: readonly TradeRoute[],
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const route of routes) {
    // T6: te dwa `continue` ZOSTAJĄ tutaj (mimo że tradeRouteBuildingBonusForRoute
    // zwróciłoby dla nich 0) — inaczej mapa dostawałaby wpisy o wartości 0 dla miast,
    // które dziś nie mają w niej klucza w ogóle. Wszyscy konsumenci czytają przez
    // `?? 0`, więc arytmetyka byłaby ta sama, ale `map.size`/`has()` już nie — a to
    // obserwowalna zmiana kontraktu T4, której T6 (warstwa prezentacji) nie robi.
    if (route.status !== 'polaczony') continue;
    if (!route.budynekOdblokowany) continue;
    const bonus = tradeRouteBuildingBonusForRoute(route, params);
    out.set(route.fromCityId, (out.get(route.fromCityId) ?? 0) + bonus);
    out.set(route.toCityId,   (out.get(route.toCityId)   ?? 0) + bonus);
  }
  return out;
}

/**
 * R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (Maciej 2026-08-09, decyzja C, część A —
 * ekonomia): to samo co computeTradeRouteCountByCity, ale liczy WYŁĄCZNIE trasy
 * `medium === 'morze'` (szlaki morskie). Trasa morska WYMAGA Portu w obu miastach
 * (findCityConnection wyżej), więc ta liczba jest z definicji zerowa dla miast bez
 * Portu — nie trzeba osobno sprawdzać builtByCity tutaj.
 */
export function computeSeaTradeRouteCountByCity(
  routes: readonly TradeRoute[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const route of routes) {
    if (route.status !== 'polaczony') continue;
    if (route.medium !== 'morze') continue;
    out.set(route.fromCityId, (out.get(route.fromCityId) ?? 0) + 1);
    out.set(route.toCityId,   (out.get(route.toCityId)   ?? 0) + 1);
  }
  return out;
}

/**
 * R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (Maciej 2026-08-09, część A): bonus Pieniądza
 * (pkt Pieniądza/turę) za KAŻDY aktywny szlak handlowy MORSKI miasta PONAD PIERWSZY.
 *
 * Dlaczego "ponad pierwszy": Sędzia turnieju znalazł, że ożywienie martwego pola
 * `przyrost` Portu (buildings.json) łamałoby PYTANIE 25=B (2026-07-25) — budynek z
 * następcą w łańcuchu (Port → Port wielki) ma wartość STAŁĄ, rośnie wyłącznie przez
 * awans. Ten bonus jest więc mechanizmem NIEZALEŻNYM od pola `przyrost`: pierwszy
 * szlak morski miasta jest już "opłacony" zwykłym dochodem dystansowym
 * (computeTradeRouteIncomeByCity) i zwykłym mnożnikiem Handlu +5%/trasa
 * (CityYieldContext.liczbaAktywnychTrasHandlowych, economy.ts) — ten dodatkowy
 * bonus nagradza WYŁĄCZNIE rozbudowę sieci PONAD jedno połączenie.
 *
 * Wartość stałej (1 pkt Pieniądza/turę na trasę): rząd wielkości spójny z bazowym
 * bonusem Portu handlowego (`baza.pieniadz` = 5 pkt Pieniądza/turę, buildings.json,
 * epoka Brąz) — 1/5 tej wartości per DODATKOWY szlak jest zauważalne, ale nie
 * przyćmiewa bazowego bonusu budynku ani nie skaluje się bez ograniczeń (miasto
 * z 4 szlakami morskimi dostaje +3 Pieniądza/turę, wciąż mniej niż sam Port).
 */
export const PORT_SEA_TRADE_BONUS_PIENIADZ = 1;

export function computeSeaTradeBonusIncomeByCity(
  seaTradeRouteCountByCity: ReadonlyMap<string, number>,
  bonusPerRoutePieniadz: number = PORT_SEA_TRADE_BONUS_PIENIADZ,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [cityId, count] of seaTradeRouteCountByCity) {
    const extraRoutes = Math.max(0, count - 1);
    if (extraRoutes > 0) out.set(cityId, extraRoutes * bonusPerRoutePieniadz);
  }
  return out;
}

// ---------------------------------------------------------------------------
// TEMAT #5: powiadomienia o powstaniu/zniknieciu trasy handlowej.
// ---------------------------------------------------------------------------

/**
 * Wynik porownania dwoch kolejnych wywolan refreshTradeRoutes (tura N-1 vs N):
 * ktore trasy sa nowe (powstaly), a ktore zniknely (zerwane/utracone). Trasa
 * jest tozsama po `id` (para miast + medium, zob. tradeRouteId) -- zmiana
 * medium dla tej samej pary miast liczy sie jako zerwanie starej + nowa trasa,
 * co jest poprawne semantycznie (inny szlak, inny dochod).
 *
 * Czysta funkcja, deterministyczna (kolejnosc = kolejnosc wejsciowych list,
 * ktora jest juz deterministyczna dzieki refreshTradeRoutes). Wolanie tej
 * funkcji wielokrotnie dla tych samych dwoch list zawsze daje ten sam wynik
 * -- wywolujacy (main.ts) odpowiada za to, by porownywac stan SPRZED i PO
 * jednym przeliczeniu na ture (nie wolac diff ponownie bez nowego refreshu),
 * co eliminuje duplikaty zdarzen w tej samej turze.
 */
export interface TradeRouteDiff {
  /** Trasy obecne w `nextRoutes`, ktorych nie bylo w `prevRoutes` (wg id). */
  added: TradeRoute[];
  /** Trasy obecne w `prevRoutes`, ktorych zabraklo w `nextRoutes` (wg id). */
  removed: TradeRoute[];
}

export function diffTradeRoutes(
  prevRoutes: readonly TradeRoute[],
  nextRoutes: readonly TradeRoute[],
): TradeRouteDiff {
  const prevIds = new Set(prevRoutes.map(r => r.id));
  const nextIds = new Set(nextRoutes.map(r => r.id));
  return {
    added: nextRoutes.filter(r => !prevIds.has(r.id)),
    removed: prevRoutes.filter(r => !nextIds.has(r.id)),
  };
}

// ---------------------------------------------------------------------------
// E3b: dostęp do surowca civ-wide przez trasę handlową (temat #4, HANDEL-Q11=B —
// boolean grant) + cofanie przy wojnie/zerwaniu.
//
// Wzorowane na grantSurowiecBooleanAccess/hasSurowiecBooleanAccess z koszyka PN
// (diplomacy-basket-transfer.ts) i na cyklu życia ZlozeGrant (diplomacy-pn-engine.ts:
// suspendZlozeGrantsForWar / deactivateZlozeGrantsForDeal), ALE bez ich osobnego
// stanu `active`/save i osobnej funkcji cofającej: grant "z trasy" jest CZYSTĄ
// POCHODNĄ aktualnej listy `routes` (tej samej, którą co turę przelicza
// refreshTradeRoutes — a ta już sama usuwa trasę przy wojnie/zerwaniu/utracie
// połączenia, patrz komentarz nad refreshTradeRoutes). Wywołujący (main.ts) ma
// więc RECOMPUTOWAĆ tę listę zaraz po każdym refreshTradeRoutes(), zamiast
// persystować ją w save — gdy trasa zniknie z `routes`, jej grant po prostu nie
// pojawi się w kolejnym wyniku (brak stanu osieroconego, brak osobnej "dezaktywacji").
// ---------------------------------------------------------------------------

/**
 * Surowce civ-wide, których dostęp może "przeciekać" przez aktywną trasę handlową.
 * Odpowiadają pięciu silnikowym bramkom dostępu: braz-access.ts (hasBrazAccess),
 * zelazo-access.ts (hasZelazoAccess), livestock-unlock.ts (computeEmpireLivestockUnlocks
 * — tylko 'kon', jedyny surowiec hodowlany z civ-wide odblokowaniem, Model B), 'cegla'
 * (decyzja właściciela 40=B, 2026-07-25): Cegielnia wymaga Gliny, a złoże Gliny
 * występuje wyłącznie na lądzie z rzeką — cywilizacja bez takiego terenu była trwale
 * odcięta od epoki Żelaza (dziewięć budynków tej epoki kosztuje Cegłę), bez żadnego
 * środka poza jednorazową transakcją dyplomatyczną. Dostęp natywny do 'cegla' liczy
 * wołający (main.ts, ownerHasNativeResourceAccess) tym samym wzorcem AND co brąz:
 * empire-wide źródło Gliny (Glinianka na złożu Gliny, gdziekolwiek w imperium) ORAZ
 * Cegielnia zbudowana w KTÓRYMKOLWIEK mieście tego właściciela.
 *
 * 'zloto' (PYTANIE-84-R4=A, U-3=A, U-13): Złoto w magazynie państwa; szlaki
 * dostarczają sztuki/turę (TRADE_ROUTE_STOCK_FLOW_KEYS) — wysoka wartość wymiany.
 * Boolean-grant nadal odblokowuje natywny dostęp (empireHasKopalniaZlota), gdy
 * partner ma kopalnię, a odbiorca nie.
 *
 * 'sol' (PYTANIE-84-R4=A, U-3=A): Sól w magazynie państwa — przepływ ilościowy
 * przez TRADE_ROUTE_STOCK_FLOW_KEYS (boolean-grant: dopięcie w main.ts osobno).
 */
export type TradeRouteResourceKey = 'braz' | 'zelazo' | 'kon' | 'cegla' | 'zloto';

export const TRADE_ROUTE_RESOURCE_KEYS: readonly TradeRouteResourceKey[] =
  ['braz', 'zelazo', 'kon', 'cegla', 'zloto'];

/**
 * Jeden przyznany dostęp "z trasy": `ownerId` (odbiorca) korzysta z dostępu, jaki
 * `viaOwnerId` (partner handlowy) ma WE WŁASNYM imperium do `resourceKey`, dzięki
 * aktywnej trasie `routeId`. `viaCityId` = koniec trasy należący do ODBIORCY (do
 * wyświetlenia w panelu TEGO miasta "źródło: szlak handlowy z <partner>").
 */
export interface TradeRouteResourceGrant {
  ownerId: number;
  resourceKey: TradeRouteResourceKey;
  viaOwnerId: number;
  viaCityId: string;
  routeId: string;
}

/**
 * Przelicza granty "z trasy" NA BIEŻĄCO z aktualnej listy `routes` — patrz nagłówek
 * sekcji: żadnego zapisu/dezaktywacji, tylko czysta funkcja wejście→wyjście. Trasa
 * bez statusu 'polaczony' nie daje żadnego grantu. Symetryczne: gdy OBIE strony mają
 * u siebie ten sam surowiec, żadna nie dostaje grantu (ownerHasNativeAccess już true
 * u niej), ale mogą jednocześnie wymieniać RÓŻNE surowce w obie strony jedną trasą.
 *
 * @param ownerHasNativeAccess czy WŁASNE imperium ownera ma już dostęp do resourceKey
 *   bez handlu (empireHasKopalniaMiedzi+piec hutniczy / empireHasKopalniaNaZlozuZelaza+
 *   odlewnia / computeEmpireLivestockUnlocks 'kon') — liczone przez wołającego
 *   (main.ts), bo wymaga mapy/placedImprovements, których ten moduł celowo nie zna.
 */
export function computeTradeRouteResourceGrants(
  routes: readonly TradeRoute[],
  ownerHasNativeAccess: (ownerId: number, resourceKey: TradeRouteResourceKey) => boolean,
  resourceKeys: readonly TradeRouteResourceKey[] = TRADE_ROUTE_RESOURCE_KEYS,
): TradeRouteResourceGrant[] {
  const grants: TradeRouteResourceGrant[] = [];
  for (const route of routes) {
    if (route.status !== 'polaczony') continue;
    for (const key of resourceKeys) {
      // Grant idzie do route.toOwnerId TYLKO gdy (a) route.ownerId ma dostęp natywnie
      // i (b) route.toOwnerId GO JESZCZE NIE MA natywnie — inaczej dwie cywilizacje,
      // które obie mają np. własną Kopalnię miedzi, dostałyby sobie nawzajem zbędny
      // (choć nieszkodliwy) grant na surowiec, który już mają wprost.
      if (ownerHasNativeAccess(route.ownerId, key) && !ownerHasNativeAccess(route.toOwnerId, key)) {
        grants.push({
          ownerId: route.toOwnerId,
          resourceKey: key,
          viaOwnerId: route.ownerId,
          viaCityId: route.toCityId,
          routeId: route.id,
        });
      }
      if (ownerHasNativeAccess(route.toOwnerId, key) && !ownerHasNativeAccess(route.ownerId, key)) {
        grants.push({
          ownerId: route.ownerId,
          resourceKey: key,
          viaOwnerId: route.toOwnerId,
          viaCityId: route.fromCityId,
          routeId: route.id,
        });
      }
    }
  }
  return grants;
}

/** Czy `ownerId` ma (dowolny) grant "z trasy" na `resourceKey`. */
export function hasTradeRouteResourceAccess(
  grants: readonly TradeRouteResourceGrant[],
  ownerId: number,
  resourceKey: TradeRouteResourceKey,
): boolean {
  return grants.some(g => g.ownerId === ownerId && g.resourceKey === resourceKey);
}

/**
 * Pierwszy grant (deterministyczny — sortowany po routeId) dla pary owner+surowiec —
 * do UI ("źródło dostępu: szlak handlowy z <partner>"). `undefined` gdy brak grantu.
 */
export function firstTradeRouteResourceGrant(
  grants: readonly TradeRouteResourceGrant[],
  ownerId: number,
  resourceKey: TradeRouteResourceKey,
): TradeRouteResourceGrant | undefined {
  return grants
    .filter(g => g.ownerId === ownerId && g.resourceKey === resourceKey)
    .sort((a, b) => a.routeId.localeCompare(b.routeId))[0];
}

// ---------------------------------------------------------------------------
// E3c: przepływ ILOŚCIOWY surowca przez trasę handlową (PYTANIE-84-U3=A,
// U-16: bez limitu przepustowości trasy).
//
// Kontekst: computeTradeRouteResourceGrants (wyżej) daje dostęp TAK/NIE —
// bramka produkcji jednostek (Brąz/Żelazo/Koń). Ta sekcja transferuje sztuki
// do magazynu państwa (w tym Złoto, Sól, Koń, Cegła, Brąz, Żelazo).
//
// ROZPOZNANIE PRZED KODOWANIEM (wymagane zadaniem): magazyn surowców jest JUŻ
// pulą PAŃSTWA (SUROW-CIV-01, Maciej 2026-07-24, patrz building-stock-cost.ts
// ownerResourceStockAll — suma City.surowce po WSZYSTKICH miastach jednego
// ownera). Oznacza to, że WEWNĄTRZ jednej cywilizacji przepływ przez trasę nie
// ma żadnego efektu: surowiec miasta A tej samej cywilizacji jest już
// identycznie dostępny miastu B (ta sama pula). Przepływ ilościowy ma sens
// WYŁĄCZNIE MIĘDZY RÓŻNYMI cywilizacjami.
//
// R-HANDEL-LIMIT-TRAS-PELNY-Q1 (2026-09-04): od tego tematu refreshTradeRoutes
// TWORZY TAKŻE trasy wewnątrz-cywilizacyjne (ownerId===toOwnerId, GOAL 5 —
// dawny opis „refreshTradeRoutes tworzy WYŁĄCZNIE pary gracz<->obca cywilizacja"
// jest tu NIEAKTUALNY, patrz docstring refreshTradeRoutes). Funkcja niżej NIE
// wymaga żadnej zmiany — dla route.ownerId===route.toOwnerId
// `ownerStockNow === toOwnerStockNow` jest trywialnie prawdziwe (ten sam klucz
// ledgera), więc `if (ownerStockNow === toOwnerStockNow) continue;` (patrz
// pętla niżej) poprawnie pomija każdą trasę wewnętrzną bez żadnego transferu —
// dokładnie zachowanie, jakiego oczekuje ten komentarz (przepływ tylko
// międzycywilizacyjny), teraz osiągnięte przez ogólny warunek, nie przez
// nieistnienie tras wewnętrznych. Zero gałęzi po ownerId (parytet AI) —
// zachowanie identyczne, gdyby trasy AI<->AI istniały (i od tego tematu
// istnieją, patrz GOAL 4).
// ---------------------------------------------------------------------------

/**
 * Surowce z przepływem ILOŚCIOWYM przez szlak do magazynu państwa (PYTANIE-84-U3=A,
 * U-16: bez osobnego limitu przepustowości trasy — tylko nadwyżka ponad minStockReserve).
 * W tym Złoto, Sól, Koń (R4=A) oraz Brąz, Żelazo, Cegła. 'sol' tylko tutaj (stock),
 * nie w TRADE_ROUTE_RESOURCE_KEYS — etykieta grantu w main.ts do osobnego wdrożenia.
 */
export type TradeRouteStockFlowResourceKey = TradeRouteResourceKey | 'sol';

export const TRADE_ROUTE_STOCK_FLOW_KEYS: readonly TradeRouteStockFlowResourceKey[] =
  ['braz', 'zelazo', 'kon', 'cegla', 'zloto', 'sol'];

/** Parametry przepływu ilościowego (data/econ-params.json — patrz loader niżej). */
export interface TradeRouteResourceFlowParams {
  /**
   * Minimalny zapas surowca (per właściciel, per surowiec), który NIGDY nie jest
   * eksportowany — właściciel oddaje przez trasę wyłącznie nadwyżkę PONAD ten
   * próg. Odpowiada kluczowi econ-params.json →
   * ekonomia_miasta.handel_surowiec_min_stock (ABC-15).
   *
   * PYTANIE-84-U16: brak osobnej „przepustowości szlaków" (usunięte
   * capacityPerRoutePerTurn) — transfer = cała nadwyżka ponad rezerwę, bez
   * limitu na trasę; ogranicza tylko produkcja z mapy/budynków partnera.
   */
  minStockReserve: number;
}

/** Wartości domyślne (fallback gdy dane brakują/są uszkodzone). */
export const DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS: TradeRouteResourceFlowParams = {
  minStockReserve: 2,
};

interface RawEconParamsJsonMinStock {
  ekonomia_miasta?: Record<string, RawParamRow>;
  handel_szlaki?: Record<string, RawParamRow>;
}

/**
 * Wczytaj minStockReserve z econ-params.json (ekonomia_miasta.handel_surowiec_min_stock,
 * ABC-15) — czytany PER difficulty na wypadek przyszłego dostrojenia.
 * PYTANIE-84-U16: handel_ilosc_na_ture_na_szlak usunięty — brak limitu trasy.
 */
export function loadTradeRouteResourceFlowParams(
  raw: RawEconParamsJsonMinStock,
  difficulty: Difficulty,
): TradeRouteResourceFlowParams {
  const grp = raw.ekonomia_miasta ?? {};
  const row = grp['handel_surowiec_min_stock'];
  const v = row ? row[difficulty] : undefined;
  const minStockReserve = typeof v === 'number' && Number.isFinite(v)
    ? v
    : DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS.minStockReserve;

  return { minStockReserve };
}

/**
 * Jeden przyznany transfer ilościowy — `amount` (zawsze > 0, liczba całkowita)
 * ma zostać ODJĘTY z puli państwa `fromOwnerId` (nadawca — ma nadwyżkę) i
 * DODANY do puli państwa `toOwnerId` (odbiorca), przez wywołującego (main.ts)
 * — ten moduł tylko WYLICZA, nigdy nie mutuje żadnego stanu gry (spójne z resztą
 * pliku: pure logic, bez side effects poza cache'em detekcji).
 */
export interface TradeRouteResourceFlow {
  routeId: string;
  resourceKey: TradeRouteStockFlowResourceKey;
  /** Właściciel, któremu surowiec REALNIE UBYWA z puli państwa. */
  fromOwnerId: number;
  /** Właściciel, któremu surowiec REALNIE PRZYBYWA w puli państwa. */
  toOwnerId: number;
  /** Ilość (szt., liczba całkowita > 0). */
  amount: number;
}

/**
 * Wylicza transfery ilościowe surowca dla wszystkich aktywnych tras. Model:
 * dla KAŻDEJ trasy `status === 'polaczony'` i KAŻDEGO surowca z
 * TRADE_ROUTE_STOCK_FLOW_KEYS, strona z WIĘKSZYM zapasem (wg `ownerStock`,
 * civ-wide) eksportuje CAŁĄ nadwyżkę PONAD `params.minStockReserve` do strony
 * z mniejszym zapasem (PYTANIE-84-U16: bez limitu przepustowości trasy).
 *
 * `ownerStock` to WEJŚCIOWY snapshot (główny wołający liczy go z
 * ownerResourceStockAll, building-stock-cost.ts) — ale funkcja utrzymuje
 * WEWNĘTRZNY ledger aktualizowany PO KAŻDYM przyznanym transferze, żeby jeden
 * właściciel z wieloma trasami do różnych partnerów nigdy nie "wyeksportował"
 * więcej niż realnie ma nadwyżki w jednej turze (surowiec realnie ubywa —
 * zasada #2 zadania). Kolejność przetwarzania tras jest deterministyczna
 * (sort po `id`), więc wynik jest powtarzalny przy tym samym wejściu — w tym
 * IDENTYCZNY niezależnie od tego, który `ownerId` jest "graczem" (parytet AI,
 * zasada #4 zadania: zero gałęzi po ownerId).
 *
 * Zwraca tylko transfery z `amount > 0` (Math.floor — surowiec liczy się w
 * sztukach całkowitych, zgodnie z resztą City.surowce).
 */
export function computeTradeRouteResourceFlow(
  routes: readonly TradeRoute[],
  ownerStock: (ownerId: number, key: TradeRouteStockFlowResourceKey) => number,
  params: TradeRouteResourceFlowParams = DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS,
  resourceKeys: readonly TradeRouteStockFlowResourceKey[] = TRADE_ROUTE_STOCK_FLOW_KEYS,
): TradeRouteResourceFlow[] {
  const flows: TradeRouteResourceFlow[] = [];

  const ledger = new Map<string, number>();
  const ledgerKey = (ownerId: number, key: TradeRouteStockFlowResourceKey): string => `${ownerId}|${key}`;
  const stockOf = (ownerId: number, key: TradeRouteStockFlowResourceKey): number => {
    const lk = ledgerKey(ownerId, key);
    if (!ledger.has(lk)) ledger.set(lk, ownerStock(ownerId, key));
    return ledger.get(lk)!;
  };
  const applyDelta = (ownerId: number, key: TradeRouteStockFlowResourceKey, delta: number): void => {
    ledger.set(ledgerKey(ownerId, key), stockOf(ownerId, key) + delta);
  };

  const sortedRoutes = routes
    .filter(r => r.status === 'polaczony')
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const route of sortedRoutes) {
    for (const key of resourceKeys) {
      const ownerStockNow = stockOf(route.ownerId, key);
      const toOwnerStockNow = stockOf(route.toOwnerId, key);
      if (ownerStockNow === toOwnerStockNow) continue;

      const fromOwnerId = ownerStockNow > toOwnerStockNow ? route.ownerId : route.toOwnerId;
      const toOwnerId   = fromOwnerId === route.ownerId ? route.toOwnerId : route.ownerId;
      const donorStock  = Math.max(ownerStockNow, toOwnerStockNow);

      const surplus = donorStock - params.minStockReserve;
      if (surplus <= 0) continue;

      const amount = Math.floor(surplus);
      if (amount <= 0) continue;

      applyDelta(fromOwnerId, key, -amount);
      applyDelta(toOwnerId, key, amount);
      flows.push({ routeId: route.id, resourceKey: key, fromOwnerId, toOwnerId, amount });
    }
  }

  return flows;
}
