/**
 * K04 batch 3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1, runda 1): dodawanie do kolejki, przyciski budowy,
 * przeciąganie kolejki budowy.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `addItem` (:6265-6286), `appendBuildActionButtons` (:6296-6345),
 * `bindBuildQueueDragReorder` (:794-853).
 *
 * Reguła P5.13 / zakres K04-Z2: UI nie mutuje kolejki ani pieniędzy. Pin wykonywał lokalnie `deductBuildingStockCostAcrossCities`,
 * `enqueue`, `setProd` i `rerender`; tutaj `addItem` zwraca komendę `enqueue_build` (wykonuje silnik Rust), a bramki
 * (kolejka, już zbudowane, brak surowców) czyta z DTO: `ProductionItemDto.stockMissing` (ZAŁOŻENIE K04B-Z5) zamiast
 * `canAffordBuildingStock(pool, cost)`. Przeciąganie zwraca `(from, to)` do kontrolera (komenda `reorder_build`).
 */
import type { CityId, PlayerId, ProductionItemDto } from '../../viewmodel/types';
import { applyBuildButtonVisualState, el } from './k01b-dom';
import type { StockCostMap } from './k04-stock';

/** Komenda dodania budynku/pozycji do kolejki (wykonanie po stronie Rust: pobór surowców, wpis, postęp). */
export interface EnqueueBuildCommand {
  readonly kind: 'enqueue_build';
  readonly owner: PlayerId;
  readonly city: CityId;
  readonly itemKind: ProductionItemDto['kind'];
  readonly itemId: string;
  readonly upgrade: boolean;
}

/** Stan potrzebny bramkom `addItem`: kolejka miasta (DTO) i id już zbudowanych budynków (DTO). */
export interface AddItemContextK04b {
  readonly queue: readonly ProductionItemDto[];
  /** Pin :6270 `cfg.getBuiltBuildingIds?.(city.id) ?? []`. */
  readonly builtIds?: readonly string[];
}

/**
 * Pin :6265-6286 `addItem`. Zwraca komendę do wysłania albo `null` (pin: `return` przed `enqueue`).
 * Pozycje inne niż budynek i jednostka (pin: cud/ulepszenie) trafiały wprost do `enqueue` — tak samo tutaj.
 * Jednostki nie są budowane za Pracę (P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B) → `null`.
 */
export function addItemCommandK04b(
  owner: PlayerId,
  city: CityId,
  item: ProductionItemDto,
  opts: { upgrade?: boolean } | undefined,
  ctx: AddItemContextK04b,
): EnqueueBuildCommand | null {
  if (item.kind === 'building') {
    if (ctx.queue.some(q => q.kind === 'building' && q.id === item.id)) return null;
    if (!opts?.upgrade && (ctx.builtIds ?? []).includes(item.id)) return null;
    // pin :6275 `canAffordBuildingStock` — brak = niepusty `stockMissing` (ZAŁOŻENIE K04B-Z5).
    if (Object.keys(item.stockMissing).length > 0) return null;
  } else if (item.kind === 'unit') {
    return null;
  }
  return {
    kind: 'enqueue_build',
    owner,
    city,
    itemKind: item.kind,
    itemId: item.id,
    upgrade: opts?.upgrade === true,
  };
}

/** Kontekst przycisków budowy (pin: `cfg` + `skarb` + wynik `requirementsMet`/`showPurchase`). */
export interface BuildActionButtonsCtxK04b {
  /** Pin :6305 `buildingGoldPurchaseCost(item.koszt)` — z DTO `BuildOptionDto.goldCost`. */
  readonly goldKoszt: number;
  /** Pin `skarb` (złoto skarbca); `undefined` = brak danych (pin: przycisk dostępny). */
  readonly skarb: number | undefined;
  /** Pin :6306 `!!cfg.onPurchaseBuilding && !!cfg.getTreasury` — kontroler podaje, czy zakup jest podłączony. */
  readonly purchaseWired: boolean;
  readonly stockLabels: Readonly<Record<string, string>>;
  readonly buildLabel: 'Buduj' | 'Ulepsz';
  readonly upgrade?: boolean;
  readonly opts?: { readonly requirementsMet?: boolean; readonly showPurchase?: boolean };
  /** Pin :6325 `cfg.onPurchaseBuilding?.(city.id, item, goldKoszt)` + rerender. */
  readonly onPurchase: (goldKoszt: number) => void;
  /** Pin :6342 `addItem(city, item, upgrade ? { upgrade: true } : undefined)`. */
  readonly onBuild: (opts: { upgrade: boolean } | undefined) => void;
}

/**
 * Pin :6296-6345 `appendBuildActionButtons`. Brakujące surowce: pin liczył `missingStockFor(pool, buildingStockCostForItem(item))`;
 * tu `item.stockMissing` z DTO dla budynków (dla innych rodzajów pin dawał pusty koszt → brak braków).
 */
export function appendBuildActionButtonsK04b(
  btnWrap: HTMLElement,
  item: ProductionItemDto,
  ctx: BuildActionButtonsCtxK04b,
): void {
  const goldKoszt = ctx.goldKoszt;
  const purchaseHook = ctx.purchaseWired;
  const stac = ctx.skarb === undefined ? true : ctx.skarb >= goldKoszt;
  const missing: StockCostMap = item.kind === 'building' ? item.stockMissing : {};
  const stockOk = Object.keys(missing).length === 0;
  const canBuild = ctx.opts?.requirementsMet ?? stockOk;
  const showPurchase = ctx.opts?.showPurchase !== false;

  if (showPurchase) {
    const bBuy = el('button', 'btn btn-sm btn-g', 'Kup') as HTMLButtonElement;
    const canBuy = !!(purchaseHook && stac && canBuild);
    let buyTitle: string;
    if (!purchaseHook) buyTitle = 'Wymaga wpiecia onPurchaseBuilding przez silnik';
    else if (!canBuild) buyTitle = 'Najpierw spełnij wymagania budowy';
    else if (!stac) buyTitle = `Za malo zlota (${ctx.skarb ?? 0}/${goldKoszt})`;
    else buyTitle = `Kup natychmiast za ${goldKoszt} złota (×2 kosztu Pracy)`;
    applyBuildButtonVisualState(bBuy, canBuy, buyTitle);
    bBuy.addEventListener('click', () => {
      if (!canBuy) return;
      ctx.onPurchase(goldKoszt);
    });
    btnWrap.appendChild(bBuy);
  }

  const bBuild = el('button', 'btn btn-sm btn-b', ctx.buildLabel) as HTMLButtonElement;
  const buildTitle = canBuild
    ? `Dodaj do kolejki · ${item.koszt} pracy`
    : (!stockOk
      ? 'Brakuje w magazynie: ' + Object.entries(missing)
        .map(([k, v]) => `${v} ${ctx.stockLabels[k] ?? k}`)
        .join(', ')
      : 'Nie spełniono wymagań budowy — najedź po szczegóły');
  applyBuildButtonVisualState(bBuild, canBuild, buildTitle);
  bBuild.addEventListener('click', () => {
    if (!canBuild) return;
    ctx.onBuild(ctx.upgrade ? { upgrade: true } : undefined);
  });
  btnWrap.appendChild(bBuild);
}

/**
 * Pin :794-853 `bindBuildQueueDragReorder`. Pin: `setProd(city.id, reorderQueueItem(...))` + `rerender()`;
 * port: `onReorder(from, to)` (kontroler wysyła `reorder_build`). Zachowana logika zdarzeń i znaczników.
 */
export function bindBuildQueueDragReorderK04b(
  sc: HTMLElement,
  onReorder: (fromIndex: number, toIndex: number) => void,
): void {
  let dragFromIndex: number | null = null;

  const clearDropMarks = (): void => {
    sc.querySelectorAll('.qitem.is-drop-target').forEach(node => node.classList.remove('is-drop-target'));
    sc.querySelectorAll('.qitem.is-dragging').forEach(node => node.classList.remove('is-dragging'));
  };

  sc.querySelectorAll<HTMLElement>('.qitem[data-queue-idx]').forEach(row => {
    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', (e) => {
      if ((e.target as HTMLElement).closest('button')) {
        e.preventDefault();
        return;
      }
      const idx = Number(row.dataset.queueIdx);
      if (!Number.isFinite(idx)) return;
      dragFromIndex = idx;
      row.classList.add('is-dragging');
      e.dataTransfer?.setData('text/plain', String(idx));
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.dropEffect = 'move';
      }
    });

    row.addEventListener('dragend', () => {
      dragFromIndex = null;
      clearDropMarks();
    });
  });

  sc.addEventListener('dragover', (e) => {
    if (dragFromIndex === null) return;
    e.preventDefault();
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-queue-idx]');
    clearDropMarks();
    if (row) row.classList.add('is-drop-target');
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  });

  sc.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragFromIndex === null) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-queue-idx]');
    if (!row) {
      clearDropMarks();
      return;
    }
    const toIndex = Number(row.dataset.queueIdx);
    if (!Number.isFinite(toIndex) || toIndex === dragFromIndex) {
      clearDropMarks();
      return;
    }
    const fromIndex = dragFromIndex;
    dragFromIndex = null;
    clearDropMarks();
    onReorder(fromIndex, toIndex);
  });
}
