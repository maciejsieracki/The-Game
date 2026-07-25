/**
 * trade-routes.ts — Handel E2/E3: wykrywanie połączeń miast + dochód z tras.
 *
 * Zakres E2 (fundament, patrz STAN-PRACY-HANDOFF.md / epik Handel):
 *   - Typy szlaku handlowego (TradeRoute) — na razie tylko pola potrzebne do detekcji;
 *     dochód, wpięcie w turn-economy.ts i UI to E3+.
 *   - findCityConnection() — GENERYCZNA funkcja: czy dwa dowolne miasta MOGĄ być
 *     połączone danym medium (ląd/morze), przy uproszczonym modelu (Q6=B, decyzja
 *     właściciela 2026-07-20): connected = dystans (hex) ≤ próg ORAZ istnieje
 *     przechodnia ścieżka (BFS) bez przeszkody terenowej. NIE budujemy pathfindera
 *     po sieci dróg — to nie jest computePath/Dijkstra po koszcie ruchu jednostki,
 *     tylko czysta reachability (każdy krok kosztuje "1", bez modyfikatorów drogi/
 *     rzeki/lasu — te wpływają na ruch JEDNOSTEK, nie na to czy handel jest możliwy).
 *   - Filtr „obce miasto / pokój" NIE jest tu stosowany na poziomie findCityConnection
 *     — to warstwa E3 (refreshTradeRoutes niżej stosuje ten filtr).
 *
 * Zakres E3 (dochód z tras, decyzje właściciela 2026-07-20 -- Q7=A, Q8=B, Q9):
 *   - refreshTradeRoutes() — ustala/utrzymuje/usuwa trasy GRACZ<->OBCA CYWILIZACJA
 *     co turę: filtr obcy właściciel + pokój (nie wojna) + AKTYWNA Umowa Handlowa
 *     (RodzajTraktatu.UmowaHandlowa — decyzja właściciela C-HANDEL-UMOWA=B,
 *     2026-07-23: sam pokój już NIE wystarcza, trasa wymaga zawartego traktatu),
 *     limit tras na miasto = liczba budynków handlowych (Targowisko/
 *     Port/Port wielki).
 *   - Dochód = DWA SKŁADNIKI (wpięte oddzielnie):
 *     (1) składnik dystansowy (tradeRouteDistanceIncome / computeTradeRouteIncomeByCity)
 *         — wzór liniowy z podłogą, kredytowany OBU miastom trasy w pełnej kwocie
 *         (Q8=B: obie strony zarabiają), do skarbca CZYSTO (pomija Wealth) — wpięcie
 *         w turn-economy.ts (pieniadzZTras).
 *     (2) +5% Handlu za każde aktywne połączenie miasta (computeTradeRouteCountByCity)
 *         — osobny, jawny mnożnik w economy.ts (cityYieldPerTurn), NIE łączony z
 *         Targowiskiem/civHandelMult, żeby uniknąć podwójnego liczenia.
 *
 * Pure logic — bez DOM, bez THREE, bez side effects (poza cache'em w WeakMap,
 * patrz niżej).
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { hexDistance, hexNeighborCoords, keyOf } from '../units/setup';
import type { City } from './cities';

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
}

/** Minimalny kształt miasta wymagany do detekcji połączenia (podzbiór City). */
export type TradeRouteCityRef = Pick<City, 'id' | 'ownerId' | 'q' | 'r'>;

/** Parametry progów detekcji (data/econ-params.json, blok "handel_szlaki"). */
export interface TradeRouteParams {
  /** Maks. dystans heksowy dla szlaku lądowego. */
  ladMaxDist: number;
  /** Maks. dystans heksowy dla szlaku morskiego. */
  morzeMaxDist: number;
}

/**
 * Wartości domyślne (gdy econ-params.json niedostępny / brak bloku).
 * Dobrane tak, by pokryć typowy dystans między sąsiednimi miastami tego samego
 * kontynentu (mapa "srednia" ~60 heksów szerokości) bez łączenia całych imperiów:
 *   ląd  12 heksów  — kilka miast w promieniu, nie cała mapa.
 *   morze 20 heksów — szlaki międzykontynentalne po wybrzeżu, szerzej niż ląd
 *                     (statek nie zna gór/lasów, ale wciąż ograniczony).
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

/** Ląd przechodni dla trasy lądowej: wszystko poza wodą (Wybrzeże/Morze) i Górami. */
function isLandPassable(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze && tb !== TerenBazowy.Gory;
}

/** Woda żeglowna dla trasy morskiej: Morze lub Wybrzeże (obie klasyfikowane jako woda). */
function isWaterHex(tb: TerenBazowy): boolean {
  return tb === TerenBazowy.Morze || tb === TerenBazowy.Wybrzeze;
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
): string {
  // Klucz symetryczny nie jest potrzebny — kierunek nie zmienia wyniku detekcji,
  // ale dla prostoty i determinizmu zapisujemy dokładnie parę tak, jak wywołana.
  return `${fromCity.q},${fromCity.r}|${toCity.q},${toCity.r}|${medium}|` +
    `${params.ladMaxDist}|${params.morzeMaxDist}|${hasPortFrom ? 1 : 0}|${hasPortTo ? 1 : 0}`;
}

// ---------------------------------------------------------------------------
// BFS reachability (bez kosztu ruchu — czysta przechodniość, ograniczona promieniem)
// ---------------------------------------------------------------------------

/**
 * Mnożnik promienia BFS względem progu dystansu — pozwala znaleźć rozsądny objazd
 * (np. wokół gór/zatoki) bez skanowania całej mapy. Ograniczenie kosztu: liczba
 * heksów w promieniu R to ~3R²+3R+1, więc dla R rzędu kilkudziesięciu to wciąż
 * tania operacja, niezależna od rozmiaru mapy.
 */
const BFS_RADIUS_MULT = 2;

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
 */
export function findCityConnection(
  fromCity: TradeRouteCityRef,
  toCity: TradeRouteCityRef,
  map: GameMap,
  medium: TradeRouteMedium,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
  builtByCity: ReadonlyMap<string, readonly string[]> = new Map(),
): CityConnectionResult {
  const distance = hexDistance(fromCity.q, fromCity.r, toCity.q, toCity.r);

  const hasPortFrom = medium === 'morze' ? cityHasPort(fromCity.id, builtByCity) : false;
  const hasPortTo   = medium === 'morze' ? cityHasPort(toCity.id, builtByCity) : false;

  let mapCache = __tradeConnectionCache.get(map);
  if (!mapCache) {
    mapCache = new Map<string, CityConnectionResult>();
    __tradeConnectionCache.set(map, mapCache);
  }

  const cacheKey = cacheKeyFor(fromCity, toCity, medium, params, hasPortFrom, hasPortTo);
  const cached = mapCache.get(cacheKey);
  if (cached) return cached;

  const result = computeCityConnection(
    fromCity, toCity, map, medium, params, distance, hasPortFrom, hasPortTo,
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
): CityConnectionResult {
  const NOT_CONNECTED: CityConnectionResult = { connected: false, distance, pathHexes: [] };

  if (medium === 'lad') {
    if (distance > params.ladMaxDist) return NOT_CONNECTED;

    const startKey = keyOf(fromCity.q, fromCity.r);
    const goalKey = keyOf(toCity.q, toCity.r);
    if (startKey === goalKey) return { connected: true, distance, pathHexes: [startKey] };

    const path = multiSourceBfs(
      map,
      [{ q: fromCity.q, r: fromCity.r }],
      new Set([goalKey]),
      isLandPassable,
      Math.max(1, params.ladMaxDist * BFS_RADIUS_MULT),
    );
    if (!path) return NOT_CONNECTED;
    return { connected: true, distance, pathHexes: path };
  }

  // medium === 'morze'
  if (!hasPortFrom || !hasPortTo) return NOT_CONNECTED;
  if (distance > params.morzeMaxDist) return NOT_CONNECTED;

  const fromWater = coastalWaterNeighbors(map, fromCity);
  const toWater = coastalWaterNeighbors(map, toCity);
  if (fromWater.length === 0 || toWater.length === 0) return NOT_CONNECTED;

  const goalKeys = new Set(toWater.map(h => keyOf(h.q, h.r)));
  const waterPath = multiSourceBfs(
    map,
    fromWater,
    goalKeys,
    isWaterHex,
    Math.max(1, params.morzeMaxDist * BFS_RADIUS_MULT),
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

  return {
    id: tradeRouteId(fromCity.id, toCity.id, medium),
    fromCityId: fromCity.id,
    toCityId: toCity.id,
    ownerId: fromCity.ownerId,
    toOwnerId: toCity.ownerId,
    medium,
    dystans,
    status: connected ? 'polaczony' : 'brak_polaczenia',
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

// ---------------------------------------------------------------------------
// E3: refreshTradeRoutes — ustalanie/utrzymanie/usuwanie tras co turę
// ---------------------------------------------------------------------------

/** Jeden kandydat trasy (para miast + medium wybrane przez detectBestConnection). */
interface TradeRouteCandidate {
  from: TradeRouteCityRef;
  to: TradeRouteCityRef;
  medium: TradeRouteMedium;
  distance: number;
  id: string;
}

/**
 * Wybiera lepsze medium (ląd/morze) dla pary miast: krótszy dystans spośród
 * połączonych; remis rozstrzyga na korzyść lądu (deterministyczne, tańsze).
 * Zwraca null, gdy żadne medium nie łączy miast.
 */
function detectBestConnection(
  a: TradeRouteCityRef,
  b: TradeRouteCityRef,
  map: GameMap,
  params: TradeRouteParams,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): { medium: TradeRouteMedium; distance: number } | null {
  const land = findCityConnection(a, b, map, 'lad', params, builtByCity);
  const sea  = findCityConnection(a, b, map, 'morze', params, builtByCity);
  if (land.connected && sea.connected) {
    return land.distance <= sea.distance
      ? { medium: 'lad', distance: land.distance }
      : { medium: 'morze', distance: sea.distance };
  }
  if (land.connected) return { medium: 'lad', distance: land.distance };
  if (sea.connected)  return { medium: 'morze', distance: sea.distance };
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
): boolean {
  for (const a of citiesA) {
    for (const b of citiesB) {
      if (findCityConnection(a, b, map, 'lad', params, builtByCity).connected) return true;
      if (findCityConnection(a, b, map, 'morze', params, builtByCity).connected) return true;
    }
  }
  return false;
}

/**
 * refreshTradeRoutes — E3: ustala aktywne trasy handlowe gracza na tę turę.
 *
 * Reguły (decyzje właściciela, patrz STAN-PRACY-HANDOFF.md, epik Handel):
 *   - TYLKO ZEWNĘTRZNY: trasa łączy miasto GRACZA (ownerId === 0) z miastem
 *     OBCEJ cywilizacji (ownerId !== 0). Własne<->własne NIGDY nie tworzy trasy.
 *   - Filtr pokoju: isAtWar(ownerA, ownerB) === true -> para wykluczona (wojna
 *     zrywa/blokuje trasę). Wszystko poza wojną liczy się jako "pokój" (w tym
 *     neutralni/sojusz) — zgodnie z „filtr: obcy właściciel + pokój (nie wojna)".
 *   - Filtr traktatu (C-HANDEL-UMOWA=B, decyzja właściciela 2026-07-23 — ZMIENIA
 *     wcześniejszą HANDEL-Q1/Q8): hasTradeTreaty(ownerA, ownerB) === false -> para
 *     wykluczona. Sam pokój już NIE wystarcza — trasa wymaga AKTYWNEJ Umowy
 *     Handlowej (RodzajTraktatu.UmowaHandlowa) między stronami. Wojna nadal zrywa
 *     trasę niezależnie od traktatu (traktat i tak pada przy wypowiedzeniu wojny,
 *     patrz breakTreatiesOnWar w main.ts — to tylko druga, redundantna bramka).
 *   - Limit tras NA MIASTO, po OBU stronach (tradeRouteLimitForCity) = liczba
 *     zbudowanych budynków handlowych w TYM mieście. Miasto bez żadnego z nich
 *     ma limit 0 -> nie może uczestniczyć w żadnej trasie.
 *   - Stabilność między turami: trasy z `existingRoutes`, które nadal spełniają
 *     wszystkie warunki i mieszczą się w (odświeżonym) limicie, są PRIORYTETOWO
 *     zachowywane. Nowe kandydatury wypełniają dopiero pozostałe sloty, w
 *     kolejności rosnącego dystansu (deterministyczny tie-break: id trasy) —
 *     „najbliższe wygrywają", zgodnie ze wskazówką z zadania.
 *
 * Czysta funkcja — nie mutuje `existingRoutes`; zwraca nową listę (wyłącznie
 * trasy aktualnie połączone => wszystkie mają status 'polaczony'; trasa, która
 * przestała spełniać warunki, po prostu znika z wyniku zamiast dostawać status
 * 'zawieszony' — najprostsze rozwiązanie spełniające wymaganie „trasa znika
 * przy wojnie").
 *
 * @param cities        WSZYSTKIE miasta biorące udział w handlu (gracz + obce
 *                       cywilizacje kwalifikujące się do handlu). Wykluczenie
 *                       barbarzyńców / niekwalifikujących się właścicieli to
 *                       odpowiedzialność wywołującego (main.ts) — ten moduł nie
 *                       zna pojęcia "barbarzyńca".
 * @param existingRoutes trasy z poprzedniej tury (dla ciągłości/stabilności).
 * @param map           mapa świata (do findCityConnection).
 * @param builtByCity   cityId -> zbudowane budynki (limit tras + wymóg Portu na morzu).
 * @param isAtWar       (ownerA, ownerB) => czy strony są w stanie wojny.
 * @param hasTradeTreaty (ownerA, ownerB) => czy strony mają AKTYWNĄ Umowę Handlową
 *                       (RodzajTraktatu.UmowaHandlowa). Wstrzyknięte przez wywołującego
 *                       (main.ts, z realnych traktatów diplomacy-treaties) — ten moduł
 *                       CELOWO nie zna stanu dyplomacji, tak samo jak isAtWar.
 * @param params        progi dystansu (handel_szlaki, patrz loadTradeRouteParams).
 */
export function refreshTradeRoutes(
  cities: readonly TradeRouteCityRef[],
  existingRoutes: readonly TradeRoute[],
  map: GameMap,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  isAtWar: (ownerA: number, ownerB: number) => boolean,
  hasTradeTreaty: (ownerA: number, ownerB: number) => boolean,
  params: TradeRouteParams = DEFAULT_TRADE_ROUTE_PARAMS,
): TradeRoute[] {
  const cityById = new Map<string, TradeRouteCityRef>();
  for (const c of cities) cityById.set(c.id, c);

  const playerCities  = cities.filter(c => c.ownerId === 0);
  const foreignCities = cities.filter(c => c.ownerId !== 0);
  if (playerCities.length === 0 || foreignCities.length === 0) return [];

  const usedSlots = new Map<string, number>();
  const limitOf  = (cityId: string): number => tradeRouteLimitForCity(cityId, builtByCity);
  const hasRoom  = (cityId: string): boolean => (usedSlots.get(cityId) ?? 0) < limitOf(cityId);
  const useSlot  = (cityId: string): void => {
    usedSlots.set(cityId, (usedSlots.get(cityId) ?? 0) + 1);
  };

  const kept: TradeRoute[] = [];
  const keptIds = new Set<string>();

  // --- Pass 1: zachowaj istniejące trasy, które nadal spełniają warunki ---
  const stillValid: TradeRouteCandidate[] = [];
  for (const route of existingRoutes) {
    const from = cityById.get(route.fromCityId);
    const to   = cityById.get(route.toCityId);
    if (!from || !to) continue;
    if (from.ownerId !== 0 || to.ownerId === 0) continue; // musi być nadal gracz->obcy
    if (isAtWar(from.ownerId, to.ownerId)) continue;
    if (!hasTradeTreaty(from.ownerId, to.ownerId)) continue; // C-HANDEL-UMOWA=B: brak/zerwana Umowa Handlowa -> trasa znika
    const conn = findCityConnection(from, to, map, route.medium, params, builtByCity);
    if (!conn.connected) continue;
    stillValid.push({ from, to, medium: route.medium, distance: conn.distance, id: route.id });
  }
  stillValid.sort((x, y) => x.id.localeCompare(y.id));
  for (const cand of stillValid) {
    if (!hasRoom(cand.from.id) || !hasRoom(cand.to.id)) continue;
    useSlot(cand.from.id);
    useSlot(cand.to.id);
    keptIds.add(cand.id);
    kept.push({
      id: cand.id,
      fromCityId: cand.from.id,
      toCityId: cand.to.id,
      ownerId: cand.from.ownerId,
      toOwnerId: cand.to.ownerId,
      medium: cand.medium,
      dystans: cand.distance,
      status: 'polaczony',
    });
  }

  // --- Pass 2: nowe kandydatury wypełniają pozostałe sloty (najbliższe pierwsze) ---
  const fresh: TradeRouteCandidate[] = [];
  for (const p of playerCities) {
    for (const f of foreignCities) {
      if (isAtWar(p.ownerId, f.ownerId)) continue;
      if (!hasTradeTreaty(p.ownerId, f.ownerId)) continue; // C-HANDEL-UMOWA=B: bez Umowy Handlowej trasa nie powstaje
      const best = detectBestConnection(p, f, map, params, builtByCity);
      if (!best) continue;
      const id = tradeRouteId(p.id, f.id, best.medium);
      if (keptIds.has(id)) continue;
      fresh.push({ from: p, to: f, medium: best.medium, distance: best.distance, id });
    }
  }
  fresh.sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));

  for (const cand of fresh) {
    if (!hasRoom(cand.from.id) || !hasRoom(cand.to.id)) continue;
    useSlot(cand.from.id);
    useSlot(cand.to.id);
    kept.push({
      id: cand.id,
      fromCityId: cand.from.id,
      toCityId: cand.to.id,
      ownerId: cand.from.ownerId,
      toOwnerId: cand.to.ownerId,
      medium: cand.medium,
      dystans: cand.distance,
      status: 'polaczony',
    });
  }

  return kept;
}

// ---------------------------------------------------------------------------
// E3: dochód z tras — składnik dystansowy (Q7=A) + agregaty per-miasto
// ---------------------------------------------------------------------------

/** Parametry dochodu dystansowego (data/econ-params.json, blok "handel_szlaki"). */
export interface TradeRouteIncomeParams {
  /** Dochód (pieniądz) trasy przy dystansie 0. */
  dochodBazowy: number;
  /** Ile pieniędzy odejmujemy za każdy heks dystansu. */
  dochodNaDystans: number;
  /** Podłoga dochodu — aktywna trasa nigdy nie daje mniej niż to. */
  dochodPodloga: number;
}

/**
 * Wartości domyślne (gdy econ-params.json niedostępny / brak kluczy) — dobrane
 * ostrożnie: przy typowym dystansie sąsiednich miast (kilka-kilkanaście heksów)
 * dochód jest zauważalny, ale niedominujący względem Handlu z pól/budynków;
 * właściciel dostroi w panelu Excel (gen-panel-*.py), to placeholder startowy.
 */
export const DEFAULT_TRADE_ROUTE_INCOME_PARAMS: TradeRouteIncomeParams = {
  dochodBazowy: 8,
  dochodNaDystans: 0.4,
  dochodPodloga: 1,
};

/** Wzór dystansowy (Q7=A, decyzja właściciela 2026-07-20): bazowy − dystans×wspolczynnik, z podłogą. */
export function tradeRouteDistanceIncome(
  dystans: number,
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
): number {
  const raw = params.dochodBazowy - dystans * params.dochodNaDystans;
  return Math.max(params.dochodPodloga, Math.floor(raw));
}

interface RawEconParamsJsonTradeIncome {
  handel_szlaki?: Record<string, RawParamRow>;
}

/**
 * Wczytaj TradeRouteIncomeParams z surowego econ-params.json (grupa "handel_szlaki",
 * te same trzy klucze na wszystkich poziomach trudności — to parametr geografii/
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
    dochodBazowy:    read('dochod_bazowy', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.dochodBazowy),
    dochodNaDystans: read('dochod_na_dystans', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.dochodNaDystans),
    dochodPodloga:   read('dochod_podloga', DEFAULT_TRADE_ROUTE_INCOME_PARAMS.dochodPodloga),
  };
}

/**
 * Dochód dystansowy per-miasto: KAŻDA aktywna trasa kredytuje OBU miastom
 * (fromCityId i toCityId) pełną kwotę tradeRouteDistanceIncome(dystans) —
 * Q8=B, obie strony zarabiają, bez podziału. Miasto uczestniczące w wielu
 * trasach sumuje wkłady. Do wpięcia w turn-economy.ts jako "pieniadzZTras"
 * (dochód czysto do skarbca, pomija Wealth — patrz advanceCityEconomy).
 */
export function computeTradeRouteIncomeByCity(
  routes: readonly TradeRoute[],
  params: TradeRouteIncomeParams = DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const route of routes) {
    if (route.status !== 'polaczony') continue;
    const income = tradeRouteDistanceIncome(route.dystans, params);
    out.set(route.fromCityId, (out.get(route.fromCityId) ?? 0) + income);
    out.set(route.toCityId,   (out.get(route.toCityId)   ?? 0) + income);
  }
  return out;
}

/**
 * Liczba aktywnych tras dotykających danego miasta (licząc obie role — from
 * i to). Wejście do mnożnika Handlu (1 + 0.05×liczbaTras) w economy.ts
 * (CityYieldContext.liczbaAktywnychTrasHandlowych).
 */
export function computeTradeRouteCountByCity(
  routes: readonly TradeRoute[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const route of routes) {
    if (route.status !== 'polaczony') continue;
    out.set(route.fromCityId, (out.get(route.fromCityId) ?? 0) + 1);
    out.set(route.toCityId,   (out.get(route.toCityId)   ?? 0) + 1);
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
 * Odpowiadają czterem silnikowym bramkom dostępu: braz-access.ts (hasBrazAccess),
 * zelazo-access.ts (hasZelazoAccess), livestock-unlock.ts (computeEmpireLivestockUnlocks
 * — tylko 'kon', jedyny surowiec hodowlany z civ-wide odblokowaniem, Model B) oraz
 * 'cegla' (decyzja właściciela 40=B, 2026-07-25): Cegielnia wymaga Gliny, a złoże Gliny
 * występuje wyłącznie na lądzie z rzeką — cywilizacja bez takiego terenu była trwale
 * odcięta od epoki Żelaza (dziewięć budynków tej epoki kosztuje Cegłę), bez żadnego
 * środka poza jednorazową transakcją dyplomatyczną. Dostęp natywny do 'cegla' liczy
 * wołający (main.ts, ownerHasNativeResourceAccess) tym samym wzorcem AND co brąz:
 * empire-wide źródło Gliny (Glinianka na złożu Gliny, gdziekolwiek w imperium) ORAZ
 * Cegielnia zbudowana w KTÓRYMKOLWIEK mieście tego właściciela.
 */
export type TradeRouteResourceKey = 'braz' | 'zelazo' | 'kon' | 'cegla';

export const TRADE_ROUTE_RESOURCE_KEYS: readonly TradeRouteResourceKey[] = ['braz', 'zelazo', 'kon', 'cegla'];

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
