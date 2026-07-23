/**
 * building-stock-cost.ts
 * TEMAT #6 (2026-07-23): konsument magazynu surowców przetworzonych (cegła/ceramika,
 * produkty Cegielni/Garncarni — game/converters.ts) — dziś kumulują się w
 * City.surowce (game/cities.ts) BEZ żadnego odbiorcy.
 *
 * Opcjonalne pole `koszt_surowce` w buildings.json (np. { "cegla": 12 }): dodatkowy
 * koszt budynku pobierany z magazynu MIASTA (City.surowce) — NIEZALEŻNY od kosztu
 * Pracy (production.ts itemCost/buildingWorkCost). Pobierany RAZ, przy starcie
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
  const raw = building?.koszt_surowce;
  const out: Record<string, number> = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}

/** Ile brakuje w magazynie miasta dla każdego surowca kosztu (0 lub brak wpisu = wystarcza). */
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

/** Czy magazyn miasta pokrywa cały koszt surowcowy budynku (pusty koszt => zawsze true). */
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
  cegla: 'Cegła',
  ceramika: 'Ceramika',
  braz: 'Brąz',
  zelazo: 'Żelazo',
  stal: 'Stal',
};

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
