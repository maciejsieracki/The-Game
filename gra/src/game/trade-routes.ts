/**
 * trade-routes.ts — Handel E2: wykrywanie połączeń miast (fundament, bez dochodu).
 *
 * Zakres E2 (patrz STAN-PRACY-HANDOFF.md / epik Handel):
 *   - Typy szlaku handlowego (TradeRoute) — na razie tylko pola potrzebne do detekcji;
 *     dochód, wpięcie w turn-economy.ts i UI to E3+.
 *   - findCityConnection() — GENERYCZNA funkcja: czy dwa dowolne miasta MOGĄ być
 *     połączone danym medium (ląd/morze), przy uproszczonym modelu (Q6=B, decyzja
 *     właściciela 2026-07-20): connected = dystans (hex) ≤ próg ORAZ istnieje
 *     przechodnia ścieżka (BFS) bez przeszkody terenowej. NIE budujemy pathfindera
 *     po sieci dróg — to nie jest computePath/Dijkstra po koszcie ruchu jednostki,
 *     tylko czysta reachability (każdy krok kosztuje "1", bez modyfikatorów drogi/
 *     rzeki/lasu — te wpływają na ruch JEDNOSTEK, nie na to czy handel jest możliwy).
 *   - Filtr „obce miasto / pokój" NIE jest tu stosowany — to warstwa E3/E6
 *     (dyplomacja). Ta funkcja odpowiada wyłącznie na pytanie geograficzne.
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
