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
