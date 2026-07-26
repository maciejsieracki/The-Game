/**
 * ai-resource-needs.ts — wykrywanie deficytu surowców per owner (P-AI-011 / proaktywny handel).
 *
 * Źródła potrzeby:
 *   1. zapas < 1 pakietu handlowego (magazyn ilościowy)
 *   2. koszt surowcowy budynków w kolejce produkcji (koszt_surowce)
 *   3. niski zapas żywności w spichlerzu (miasta-państwa częściej szukają handlu)
 *
 * Pure — dane z main.ts (goods, kolejka, buildings catalog).
 */

import type { TradeGoodEntry } from './diplomacy-goods';
import { detectPricedResourceDeficits } from './diplomacy-resource-trade-pick';
import type { BuildingStockCost } from './building-stock-cost';
import { buildingStockCost } from './building-stock-cost';

export interface OwnerResourceNeedState {
  /** Flaga per klucz surowca — true gdy brakuje do budowy/kolejki/magazynu. */
  needsResource: Record<string, boolean>;
  /** Posortowane klucze deficytu (priorytet handlu). */
  deficitKeys: string[];
  /** Krytyczny brak (< ¼ pakietu handlowego lub żywność poniżej progu). */
  urgentKeys: string[];
}

export type BuildingStockCostLookup = (
  buildingId: string,
) => BuildingStockCost | null | undefined;

const FOOD_URGENT_THRESHOLD = 8;

function mergeDeficitKeys(
  stock: readonly string[],
  fromBuild: readonly string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of [...stock, ...fromBuild]) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/** Klucze surowców wymagane przez budynki w kolejce (niepokryte zapasem). */
export function resourceKeysNeededForBuildingQueue(input: {
  queuedBuildingIds: readonly string[];
  goods: readonly TradeGoodEntry[];
  lookupBuildingStockCost: BuildingStockCostLookup;
}): string[] {
  const needed = new Set<string>();
  const stockByKey = new Map(input.goods.map(g => [g.key, g.ilosc ?? 0]));

  for (const buildingId of input.queuedBuildingIds) {
    const cost = buildingStockCost(
      { koszt_surowce: input.lookupBuildingStockCost(buildingId) ?? undefined },
    );
    for (const [key, amount] of Object.entries(cost)) {
      const have = stockByKey.get(key) ?? 0;
      if (have < amount) needed.add(key);
    }
  }
  return [...needed];
}

/**
 * Pełne wykrywanie deficytu dla ownera — magazyn + kolejka budowy + żywność.
 */
export function detectOwnerResourceNeeds(input: {
  goods: readonly TradeGoodEntry[];
  pricedKeys: readonly string[];
  pakietWielkosc: number;
  queuedBuildingIds?: readonly string[];
  lookupBuildingStockCost?: BuildingStockCostLookup;
  /** Zapas żywności państwa (spichlerz) — opcjonalnie dla miast-państw. */
  foodReserve?: number;
  foodUrgentThreshold?: number;
}): OwnerResourceNeedState {
  const pakiet = Math.max(1, input.pakietWielkosc);
  const stockDeficits = detectPricedResourceDeficits(
    input.goods,
    input.pricedKeys,
    pakiet,
  );

  const buildDeficits = input.queuedBuildingIds?.length && input.lookupBuildingStockCost
    ? resourceKeysNeededForBuildingQueue({
      queuedBuildingIds: input.queuedBuildingIds,
      goods: input.goods,
      lookupBuildingStockCost: input.lookupBuildingStockCost,
    })
    : [];

  const deficitKeys = mergeDeficitKeys(stockDeficits, buildDeficits);
  const needsResource: Record<string, boolean> = {};
  for (const k of deficitKeys) needsResource[k] = true;

  const foodThreshold = input.foodUrgentThreshold ?? FOOD_URGENT_THRESHOLD;
  if (input.foodReserve != null && input.foodReserve < foodThreshold) {
    needsResource.zywnosc = true;
    if (!deficitKeys.includes('zywnosc')) deficitKeys.push('zywnosc');
  }

  const urgentKeys: string[] = [];
  for (const key of deficitKeys) {
    if (key === 'zywnosc') {
      if (input.foodReserve != null && input.foodReserve < foodThreshold) {
        urgentKeys.push(key);
      }
      continue;
    }
    const entry = input.goods.find(g => g.key === key);
    const stock = entry?.ilosc ?? 0;
    if (stock < pakiet * 0.25) urgentKeys.push(key);
  }

  return { needsResource, deficitKeys, urgentKeys };
}
