import { scaleStockCostRecord } from './r-stawki-strojenie';

/**
 * building-stock-cost.ts
 * TEMAT #6 (2026-07-23): konsument magazynu surowców przetworzonych (cegła/ceramika,
 * produkty Cegielni/Garncarni — game/converters.ts) — dziś kumulują się w
 * City.surowce (game/cities.ts) BEZ żadnego odbiorcy.
 *
 * Opcjonalne pole `koszt_surowce` w buildings.json (np. { "cegla": 12 }): dodatkowy
 * koszt budynku pobierany z MAGAZYNU PAŃSTWA (suma City.surowce — PYTANIE-84 D3/R3),
 * NIEZALEŻNY od kosztu Pracy (production.ts itemCost/buildingWorkCost). Pobierany RAZ, przy starcie
 * budowy (enqueue do kolejki produkcji), nie przy ukończeniu — patrz wołający:
 *   - gracz : ui/cityPanel.ts addItem()
 *   - AI    : main.ts (cmd.type === 'build' handler) + opcjonalny pre-filtr
 *             ai.ts chooseCityProduction (opts.canAfford)
 *
 * Pure -- bez DOM, bez mutacji wejść; zawsze zwraca świeże obiekty.
 */

/** Kształt pola `koszt_surowce` w buildings.json — klucze ASCII zgodne z City.surowce. */
export type BuildingStockCost = Partial<Record<string, number>>;

/** Znormalizowany koszt: tylko klucze z liczbą skończoną > 0 (odporne na dane śmieciowe). */
export function buildingStockCost(
  building: { koszt_surowce?: BuildingStockCost | null } | null | undefined,
): Record<string, number> {
  // R-NADMIAR-POOLS FALA2: koszt_surowce ×2 — UI/AI afford/deduct widzą skalowany koszt
  return scaleStockCostRecord(building?.koszt_surowce);
}

/** Ile brakuje w puli państwa dla każdego surowca kosztu (0 lub brak wpisu = wystarcza). */
export function missingStockFor(
  citySurowce: Record<string, number> | undefined,
  cost: Record<string, number>,
): Record<string, number> {
  const have = citySurowce ?? {};
  const missing: Record<string, number> = {};
  for (const [k, need] of Object.entries(cost)) {
    const brak = need - (have[k] ?? 0);
    if (brak > 0) missing[k] = brak;
  }
  return missing;
}

/** Czy pula państwa pokrywa cały koszt surowcowy budynku (pusty koszt => zawsze true). */
export function canAffordBuildingStock(
  citySurowce: Record<string, number> | undefined,
  cost: Record<string, number>,
): boolean {
  const have = citySurowce ?? {};
  for (const [k, need] of Object.entries(cost)) {
    if ((have[k] ?? 0) < need) return false;
  }
  return true;
}

/**
 * Pobiera koszt z magazynu miasta (zwraca NOWY obiekt — caller podmienia City.surowce).
 * Zakłada, że canAffordBuildingStock() już przeszło (nie cofa poniżej 0, ale nie
 * powinno się to zdarzyć przy poprawnym wywołaniu).
 */
export function deductBuildingStockCost(
  citySurowce: Record<string, number> | undefined,
  cost: Record<string, number>,
): Record<string, number> {
  const next: Record<string, number> = { ...(citySurowce ?? {}) };
  for (const [k, need] of Object.entries(cost)) {
    next[k] = Math.max(0, (next[k] ?? 0) - need);
  }
  return next;
}

/** Etykiety PL do UI (chip + komunikat "czego brakuje"). Klucze ASCII zgodne z City.surowce. */
export const STOCK_RESOURCE_LABEL: Readonly<Record<string, string>> = {
  drewno: 'Drewno',
  kamien: 'Kamień',
  glina: 'Glina',
  ruda: 'Ruda',
  ruda_zelaza: 'Ruda żelaza',
  ruda_cyny: 'Ruda cyny',
  cegla: 'Cegła',
  ceramika: 'Ceramika',
  braz: 'Brąz',
  zelazo: 'Żelazo',
  stal: 'Stal',
  sol: 'Sól',
  zloto: 'Złoto (surowiec)',
  wegiel: 'Węgiel',
  kon: 'Koń',
};

/**
 * Klucze magazynu państwa (City.surowce, suma civ-wide) — PYTANIE-84 R4/R6/R9/R10, U-20.
 */
export const EMPIRE_STOCK_RESOURCE_KEYS: readonly string[] = [
  'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny',
  'cegla', 'ceramika', 'braz', 'zelazo', 'stal',
  'sol', 'zloto', 'wegiel', 'kon',
] as const;

export function stockResourceLabel(key: string): string {
  return STOCK_RESOURCE_LABEL[key] ?? key;
}

// ---------------------------------------------------------------------------
// SUROW-CIV-01 (decyzja Macieja 2026-07-24): magazyn surowcow = pula PANSTWA
// (civ-wide, per owner), nie per-miasto. Poniewaz produkcja/konwertery ZOSTAJA
// lokalne (city.surowce), afordancja/pobor kosztu surowcowego budynku (koszt_surowce)
// musi teraz patrzec na SUME po wszystkich miastach ownera, nie tylko lokalne
// City.surowce -- to naprawia "surowiec jest, ale nie w tym miescie".
//
// OWNERID-AGNOSTIC (twarda zasada Macieja): dziala identycznie dla gracza (ownerId=0)
// i kazdej cywilizacji AI -- ownerId jest zwyklym parametrem, zero specjalnej sciezki.
//
// canAffordBuildingStock / missingStockFor POWYZEJ juz przyjmuja dowolny
// Record<string, number> -- wywolujacy przekazuje ownerResourceStockAll(...) zamiast
// city.surowce i dostaje civ-wide afordancje BEZ zmiany tych funkcji.
// ---------------------------------------------------------------------------

/** Minimalny ksztalt miasta potrzebny do puli ownera (bez importu pelnego City). */
export interface StockCitySource {
  id:       string;
  ownerId:  number;
  surowce?: Record<string, number>;
}

/**
 * Suma City.surowce po WSZYSTKICH miastach ownera, per typ surowca (pula PANSTWA).
 * Pure -- nie mutuje `cities`.
 */
export function ownerResourceStockAll(
  cities: ReadonlyArray<StockCitySource>,
  ownerId: number,
): Record<string, number> {
  const pool: Record<string, number> = {};
  for (const c of cities) {
    if (c.ownerId !== ownerId || !c.surowce) continue;
    for (const [k, v] of Object.entries(c.surowce)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        pool[k] = (pool[k] ?? 0) + v;
      }
    }
  }
  return pool;
}

/** Zapas ownera dla JEDNEGO typu surowca (suma po miastach) -- getter dla dyplomacji/handlu. */
export function ownerResourceStock(
  cities: ReadonlyArray<StockCitySource>,
  ownerId: number,
  key: string,
): number {
  let total = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    total += c.surowce?.[key] ?? 0;
  }
  return total;
}

/**
 * Zwraca koszt surowcowy do puli państwa (symetria deductBuildingStockCostAcrossCities).
 * Używane przy anulowaniu pozycji w kolejce budowy — bez capPerType (to zwrot, nie produkcja).
 */
export function refundBuildingStockCostAcrossCities<T extends StockCitySource>(
  cities: ReadonlyArray<T>,
  ownerId: number,
  cost: Record<string, number>,
): void {
  for (const [key, amount] of Object.entries(cost)) {
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      creditOwnerResourceStock(cities, ownerId, key, amount);
    }
  }
}

/**
 * Pobiera koszt budynku Z PULI PANSTWA: rozklada pobor po miastach ownera, biorac
 * NAJPIERW z miast o NAJWIEKSZYM zapasie danego surowca (deterministycznie -- stabilne
 * sortowanie malejaco po ilosci, remis rozstrzyga id miasta rosnaco), az koszt pokryty.
 * Zaklada, ze ownerResourceStockAll(...) (lub canAffordBuildingStock na tej sumie) juz
 * potwierdzil pokrycie -- nie cofa ponizej 0. Mutuje city.surowce na przekazanych
 * obiektach (ten sam kontrakt co deductBuildingStockCost, tylko rozproszony po miastach).
 */
export function deductBuildingStockCostAcrossCities<T extends StockCitySource>(
  cities: ReadonlyArray<T>,
  ownerId: number,
  cost: Record<string, number>,
): void {
  const ownerCities = cities.filter(c => c.ownerId === ownerId);
  for (const [key, needRaw] of Object.entries(cost)) {
    let need = needRaw;
    if (!(need > 0)) continue;

    const holders = ownerCities
      .filter(c => (c.surowce?.[key] ?? 0) > 0)
      .sort((a, b) => {
        const diff = (b.surowce?.[key] ?? 0) - (a.surowce?.[key] ?? 0);
        if (diff !== 0) return diff;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

    for (const c of holders) {
      if (need <= 0) break;
      const have = c.surowce?.[key] ?? 0;
      const take = Math.min(have, need);
      if (!c.surowce) c.surowce = {};
      c.surowce[key] = have - take;
      need -= take;
    }
  }
}

/**
 * Dodaje surowiec do puli ownera (np. handel/dyplomacja) -- trafia do miasta o
 * NAJMNIEJSZYM biezacym zapasie tego typu (deterministycznie: sortowanie rosnaco po
 * ilosci, remis rozstrzyga id miasta rosnaco), zeby wyrownywac zapasy zamiast piętrzyć
 * je w jednym miescie. Brak miast ownera -> no-op (nie ma gdzie dodac). Opcjonalny
 * `capPerType`: gdy podany, dodatek jest przycinany tak, by SUMA ownera nie przekroczyla
 * capu (nadwyzka nie trafia do magazynu -- spojne z reconcileOwnerResourceCaps).
 */
export function creditOwnerResourceStock<T extends StockCitySource>(
  cities: ReadonlyArray<T>,
  ownerId: number,
  key: string,
  amount: number,
  capPerType?: number,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const ownerCities = cities.filter(c => c.ownerId === ownerId);
  if (ownerCities.length === 0) return 0;

  let toAdd = amount;
  if (typeof capPerType === 'number' && Number.isFinite(capPerType)) {
    const current = ownerResourceStock(cities, ownerId, key);
    toAdd = Math.max(0, Math.min(toAdd, capPerType - current));
  }
  if (toAdd <= 0) return 0;

  const target = [...ownerCities].sort((a, b) => {
    const diff = (a.surowce?.[key] ?? 0) - (b.surowce?.[key] ?? 0);
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0]!;
  if (!target.surowce) target.surowce = {};
  target.surowce[key] = (target.surowce[key] ?? 0) + toAdd;
  return toAdd;
}

/**
 * PYTANIE-84 R1: zapisuje pulę państwa (jeden skarbiec) z powrotem do City.surowce.
 * Zeruje zapasy ownera, potem rozdziela `pool` przez creditOwnerResourceStock (najmniejsze
 * miasto pierwsze — spójne z resztą API magazynu państwa).
 */
export function assignOwnerResourceStockFromPool<T extends StockCitySource>(
  cities: ReadonlyArray<T>,
  ownerId: number,
  pool: Readonly<Record<string, number>>,
): void {
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    if (!c.surowce) continue;
    for (const k of Object.keys(c.surowce)) {
      delete c.surowce[k];
    }
  }
  for (const [key, amount] of Object.entries(pool)) {
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      creditOwnerResourceStock(cities, ownerId, key, amount);
    }
  }
}

// ---------------------------------------------------------------------------
// JEDNOSTKI-SUROWIEC-01 (decyzja Macieja 2026-07-24): jednostki z units.json
// (pola `Surowiec` / `Surowiec (ilość)`) konsumuja PULE PANSTWA identycznie jak
// koszt_surowce budynkow powyzej -- ta sama afordancja (canAffordBuildingStock)
// i ten sam pobor rozproszony po miastach ownera (deductBuildingStockCostAcrossCities),
// tylko liczony z innego pola zrodlowego danych (units.json zamiast buildings.json).
//
// PULAPKA DIAKRYTYKOW: `Surowiec` w units.json to nazwa PL z diakrytykami ('Brąz',
// 'Żelazo') -- City.surowce uzywa kluczy ASCII ('braz', 'zelazo'). Trzeba je zmapowac
// przez usuniecie znakow diakrytycznych (NFD + wyciecie combining marks), NIE samym
// .toLowerCase() (production.ts:751 robi tak i to jest OSOBNY pre-istniejacy bug
// bramki dostepu do Brazu/Zelaza -- NIE powielac go tutaj).
// ---------------------------------------------------------------------------

/** Usuwa znaki diakrytyczne (NFD + wyciecie combining marks) i normalizuje do lowercase. */
function stripDiacriticsLower(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** PYTANIE-84 U-15 / R10: koszt Koni ze skarbca państwa przy rekrucie jednostek jezdnych.
 *  R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej 2026-08-13): ×5, było 5 — koszt surowcowy
 *  rekrutacji jednostek (Koń to surowiec fizyczny), spójnie z units.json „Surowiec (ilość)”
 *  przeskalowanym w tym samym zadaniu. / EN: ×5, was 5 — unit recruit resource cost
 *  (Koń/horse is a physical resource), consistent with units.json "Surowiec (ilość)"
 *  scaled in the same task. */
export const MOUNT_UNIT_HORSE_STOCK_COST = 25;
export const MOUNT_UNIT_HORSE_STOCK_KEY = 'kon';
/** Jednostka wyłączona z kosztu Koni (rydwan na wołach, nie konie). */
export const MOUNT_HORSE_EXEMPT_UNIT = 'Rydwan (woły)';

/** Minimalny kształt jednostki dla kosztu magazynowego (units.json). */
export interface UnitStockCostSource {
  Jednostka?: string | null;
  Typ?: string | null;
  Surowiec?: string | null;
  'Surowiec (ilość)'?: number | null;
}

/** Czy jednostka wymaga +5 Koni ze skarbca państwa (Typ Mount, oprócz Rydwan woły). */
export function unitRequiresMountHorseStock(
  unit: UnitStockCostSource | null | undefined,
): boolean {
  if (!unit) return false;
  if ((unit.Typ ?? '').toString().trim() !== 'Mount') return false;
  const name = (unit.Jednostka ?? '').toString().trim();
  return name !== MOUNT_HORSE_EXEMPT_UNIT;
}

/**
 * Koszt surowcowy jednostki (units.json `Surowiec` / `Surowiec (ilość)`), zmapowany
 * na klucz ASCII zgodny z City.surowce (np. 'Brąz' -> 'braz', 'Żelazo' -> 'zelazo').
 * Zwraca {} gdy Surowiec pusty/'-'/null lub ilość <= 0 (brak kosztu -- zachowanie
 * zero-regresji dla jednostek bez surowca, np. Osadnik/Robotnik).
 *
 * PYTANIE-84 U-15: jednostki `Typ: Mount` (oprócz Rydwan woły) dostają dodatkowo
 * +5 Koni (`kon`) ze skarbca państwa obok kosztu Surowiec z units.json.
 * Pure -- bez DOM.
 */
export function unitStockCost(
  unit: UnitStockCostSource | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!unit) return out;
  const rawName = (unit.Surowiec ?? '').toString().trim();
  if (rawName && rawName !== '-') {
    const ilosc = unit['Surowiec (ilość)'];
    if (typeof ilosc === 'number' && Number.isFinite(ilosc) && ilosc > 0) {
      const key = stripDiacriticsLower(rawName);
      if (key) out[key] = ilosc;
    }
  }
  if (unitRequiresMountHorseStock(unit)) {
    out[MOUNT_UNIT_HORSE_STOCK_KEY] =
      (out[MOUNT_UNIT_HORSE_STOCK_KEY] ?? 0) + MOUNT_UNIT_HORSE_STOCK_COST;
  }
  return out;
}
