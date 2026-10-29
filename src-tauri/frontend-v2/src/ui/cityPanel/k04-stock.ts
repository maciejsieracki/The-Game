/**
 * K04 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04-Q1, runda 1, batch 1/4): koszty surowcowe kolejki i pula magazynu.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `buildingStockCostForItem` (:6093), `unitStockCostForItem` (:6105),
 * `stockCostForQueueItem` (:6112), `cancelQueueItem` (:6125), `ownerSurowcePoolFor` (:6144),
 * `formatResourceUpkeepSummary` (:6720), `buildingStockCostChipsHtml` (:6615).
 *
 * Reguła P5.13: UI nie liczy kosztów. Pin czytał `gameData()` i `buildingStockCost(def)` / `unitStockCost(def)`;
 * tutaj koszt jest polem DTO `ProductionItemDto.stockCost` (wpis kolejki, pobrany przy enqueue przez silnik),
 * a pula państwa `CityPanelInputsDto.stockPool` (ZAŁOŻENIE K04-Z1, patrz `k04-stock` w P5-8-K04.md).
 * Anulowanie: UI tylko wysyła komendę `dequeue_build`; zwrot surowców i postęp po stronie Rust (ZAŁOŻENIE K04-Z2).
 */
import type { CityId, PlayerId, ProductionItemDto } from '../../viewmodel/types';
import { buildingRequirementChipsHtml } from './k01a-fundament';
import type { BuildingReqChip } from './k01a-fundament';

/** Zapis kosztu surowcowego: klucz surowca -> ilość (kolejność kluczy = DTO). */
export type StockCostMap = Readonly<Record<string, number>>;

/** Pin :6093-6097 — koszt surowcowy pozycji typu budynek; pusty dla innych rodzajów. */
export function buildingStockCostForItem(item: ProductionItemDto): StockCostMap {
  if (item.kind !== 'building') return {};
  return item.stockCost;
}

/**
 * Pin :6098-6104 (JEDNOSTKI-SUROWIEC-01): koszt surowcowy jednostki pobierany z puli państwa przy starcie budowy.
 * Pusty dla rodzajów innych niż jednostka.
 */
export function unitStockCostForItem(item: ProductionItemDto): StockCostMap {
  if (item.kind !== 'unit') return {};
  return item.stockCost;
}

/** Pin :6112-6117 — koszt zwracany przy anulowaniu (budynek lub jednostka; reszta bez kosztu). */
export function stockCostForQueueItem(item: ProductionItemDto): StockCostMap {
  if (item.kind === 'building') return buildingStockCostForItem(item);
  if (item.kind === 'unit') return unitStockCostForItem(item);
  return {};
}

/**
 * Pin :6116-6131 `cancelQueueItem`. Pin: sprawdza zakres, zwraca koszt do puli i usuwa pozycję (`dequeue`) + `rerender`.
 * Port: zwraca komendę `dequeue_build` do wysłania przez kontroler, albo `null` przy indeksie poza zakresem
 * (ten sam warunek co pin :6127). Zwrot surowca i postępu wykonuje silnik Rust.
 */
export function cancelQueueItemCommand(
  owner: PlayerId,
  city: CityId,
  queueLength: number,
  index: number,
): { kind: 'dequeue_build'; owner: PlayerId; city: CityId; index: number } | null {
  if (index < 0 || index >= queueLength) return null;
  return { kind: 'dequeue_build', owner, city, index };
}

/**
 * Pin :6138-6147 `ownerSurowcePoolFor` (SUROW-CIV-01): pula magazynu PAŃSTWA (civ-wide).
 * Port: pula z DTO (`panelInputs.stockPool`); brak pola = pusta pula.
 */
export function ownerSurowcePoolFor(stockPool: StockCostMap | undefined): StockCostMap {
  return stockPool ?? {};
}

/**
 * Pin :6720-6724 `formatResourceUpkeepSummary`. Etykiety surowców z DTO (`StaticCatalogDto.stockResourceLabels`,
 * brak klucza = klucz, jak pin `stockResourceLabel`). Format i separator bez zmian.
 */
export function formatResourceUpkeepSummary(
  resources: StockCostMap,
  stockLabels: Readonly<Record<string, string>>,
): string {
  const keys = Object.keys(resources);
  if (keys.length === 0) return '—';
  return keys.map(k => `−${resources[k]} ${stockLabels[k] ?? k}`).join(' · ');
}

/**
 * Pin :6615-6632 `buildingStockCostChipsHtml`. Pin liczył `met` z `pool[k] >= need` i etykietę „(masz N)”.
 * Port: koszt i pula z DTO; `pool` = `undefined` gdy brak kontekstu miasta (jak pin `city !== undefined`).
 */
export function buildingStockCostChipsHtml(
  cost: StockCostMap,
  stockLabels: Readonly<Record<string, string>>,
  pool: StockCostMap | undefined,
): string {
  const keys = Object.keys(cost);
  if (keys.length === 0) return '';
  const chips: BuildingReqChip[] = keys.map(k => {
    const need = cost[k]!;
    const have = pool?.[k] ?? 0;
    const met = pool !== undefined && have >= need;
    const label = stockLabels[k] ?? k;
    return {
      label: pool !== undefined ? `${need} ${label} (masz ${have})` : `${need} ${label}`,
      met,
      kind: 'stock' as const,
    };
  });
  return buildingRequirementChipsHtml(chips);
}
