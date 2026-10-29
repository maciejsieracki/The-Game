/**
 * K04 batch 3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1, runda 1): paski surowców miasta i rekrutacji.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `appendCityResourceStockStrip` (:6173-6193),
 * `appendRecruitMilitaryResourceStrip` (:6206-6256).
 *
 * Reguła P5.13: pula państwa i etykiety z DTO (`CityPanelInputsDto.stockPool`, `StaticCatalogDto.stockResourceLabels`);
 * koszt i utrzymanie jednostek z DTO (`ProductionItemDto.stockCost`, `CityPanelInputsDto.unitResourceUpkeepById`);
 * epoka z DTO (`recruitPool.epoka`, ZAŁOŻENIE K04B-Z4). Ikony surowców wstrzykiwane (`mapIcon`), jak w K02.
 */
import { CS_RES_STRIP_CORE, CS_RES_STRIP_ICON_PX, CS_RES_STRIP_ORDER, EPOCH_LABEL } from './k01a-fundament';
import { el } from './k01b-dom';
import type { StockCostMap } from './k04-stock';

/** Ikona surowca (pin: `mapResourceIconSvg(label, px)`); wstrzykiwana przez kontroler/harness. */
export type MapResourceIconFn = (label: string, px: number) => string;

/** Pin :6174-6177: wpisy paska budowy — kolejność CS_RES_STRIP_ORDER, zero tylko dla rdzenia. */
export function cityResourceStripEntriesK04b(pool: StockCostMap): { k: string; v: number }[] {
  return CS_RES_STRIP_ORDER
    .map(k => ({ k, v: Math.floor(pool[k] ?? 0) }))
    .filter(e => e.v > 0 || CS_RES_STRIP_CORE.has(e.k));
}

/** Pin :6173-6193 `appendCityResourceStockStrip`. */
export function appendCityResourceStockStripK04b(
  mount: HTMLElement,
  pool: StockCostMap,
  stockLabels: Readonly<Record<string, string>>,
  mapIcon: MapResourceIconFn,
): void {
  const entries = cityResourceStripEntriesK04b(pool);
  if (entries.length === 0) return;
  const strip = el('div', 'civ-cs-res-strip');
  for (const e of entries) {
    const label = stockLabels[e.k] ?? e.k;
    const chip = el('span', 'civ-cs-res-chip');
    chip.title = label;
    const ic = el('span', 'civ-cs-res-chip-ic');
    ic.innerHTML = mapIcon(label, CS_RES_STRIP_ICON_PX);
    chip.appendChild(ic);
    const val = el('b');
    val.textContent = String(e.v);
    chip.appendChild(val);
    strip.appendChild(chip);
  }
  mount.appendChild(strip);
}

/** Wejście rekrutacji: pozycja kolejki rekrutacji (kind 'unit' w DTO) + klucze kosztu/utrzymania. */
export interface RecruitStripUnitK04b {
  readonly kind: string;
  readonly id: string;
  /** Pin `unitStockCost(udef)` = `ProductionItemDto.stockCost` (ZAŁOŻENIE K04B-Z2). */
  readonly stockCost: StockCostMap;
}

export interface RecruitStripInputK04b {
  /** Pin :6212 `cfg.getEpoch?.(ownerId) ?? 1` — z DTO `recruitPool.epoka` (ZAŁOŻENIE K04B-Z4). */
  readonly epoch: number;
  readonly units: readonly RecruitStripUnitK04b[];
  /** Pin `unitResourceUpkeep(udef)` po id jednostki — z DTO `unitResourceUpkeepById` (brak = {}). */
  readonly upkeepById: Readonly<Record<string, StockCostMap>>;
  readonly pool: StockCostMap;
  readonly stockLabels: Readonly<Record<string, string>>;
  readonly mapIcon: MapResourceIconFn;
}

/**
 * Pin :6206-6256 `appendRecruitMilitaryResourceStrip`. Surowce wszystkich jednostek rekrutacji (koszt + utrzymanie),
 * kolejność: najpierw CS_RES_STRIP_ORDER, potem pozostałe klucze w kolejności napotkania.
 */
export function appendRecruitMilitaryResourceStripK04b(mount: HTMLElement, input: RecruitStripInputK04b): void {
  const keysInOrder: string[] = [];
  const seen = new Set<string>();
  for (const item of input.units) {
    if (item.kind !== 'unit') continue;
    const cost = item.stockCost;
    const upkeep = input.upkeepById[item.id] ?? {};
    for (const k of [...Object.keys(cost), ...Object.keys(upkeep)]) {
      if (!seen.has(k)) {
        seen.add(k);
        keysInOrder.push(k);
      }
    }
  }
  if (keysInOrder.length === 0) return;
  const ordered = [
    ...CS_RES_STRIP_ORDER.filter(k => seen.has(k)),
    ...keysInOrder.filter(k => !(CS_RES_STRIP_ORDER as readonly string[]).includes(k)),
  ];
  const eraName = (EPOCH_LABEL[input.epoch] as string | undefined) ?? `Epoka ${input.epoch}`;
  const strip = el('div', 'civ-cs-res-strip civ-cs-mil-strip');
  const eraTag = el('span', 'civ-cs-mil-era');
  eraTag.textContent = `Epoka ${eraName}`;
  strip.appendChild(eraTag);
  for (const key of ordered) {
    const qty = Math.floor(input.pool[key] ?? 0);
    const label = input.stockLabels[key] ?? key;
    const chip = el('span', 'civ-cs-res-chip');
    chip.title = `${label} — pula państwa`;
    const ic = el('span', 'civ-cs-res-chip-ic');
    ic.innerHTML = input.mapIcon(label, CS_RES_STRIP_ICON_PX);
    chip.appendChild(ic);
    const val = el('b');
    val.textContent = String(qty);
    chip.appendChild(val);
    strip.appendChild(chip);
  }
  mount.appendChild(strip);
}
