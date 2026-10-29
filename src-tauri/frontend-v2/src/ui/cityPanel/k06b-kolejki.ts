/**
 * K06B-3: kolejka budowy i lista produkcji (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 1).
 *
 * Ciała jednostek są kopiami z pinu edb8fb56 (`gra/src/ui/cityPanel.ts`); każda kopia ma znacznik `// pin edb8fb56 …:A-B`.
 * Zależności: `dep(…)` / `valueProxy(…)` / `constStr(…)` z `k06b-deps.ts` (K06B-Z2, Z4), stałe literalne (K06B-Z3),
 * typy pinu jako `any` (K06B-Z5), stan K06A przez akcesory (K06B-Z6), odłożone 3D/MAPA jako placeholdery (K06B-Z7).
 */

import { constStr, dep, valueProxy } from './k06b-deps';

// ─── K06B-Z5: typy pinu (alias any; zgodność z viewmodel/types.ts NIE_ZMIERZONO) ─────────────────────────────
type AvailabilityContext = any;
type BuildingCatalogEntry = any;
type BuildingDef = any;
type City = any;
type CityProduction = any;
type CityView = any;
type EPOCH_NUMBER_TO_NAME = any;
type GameData = any;
type ProductionItem = any;

// ─── K06B-Z3: stałe literalne z pinu ───────────────────────────────────────────────────────────────────────────
const BUILD_QUEUE_VISIBLE = 4;
const LIST_ROW_HEIGHT_COMPACT = 2.35;
const QUEUE_ROW_EM = 2.75;

// ─── K06B-Z2/Z4: delegaty funkcji i wartości ───────────────────────────────────────────────────────────────────
const appendBuildActionButtons = (...args: any[]): any => dep('appendBuildActionButtons')(...args);
const appendBuildingInlineIcon = (...args: any[]): any => dep('appendBuildingInlineIcon')(...args);
const appendCityResourceStockStrip = (...args: any[]): any => dep('appendCityResourceStockStrip')(...args);
const appendDisabledBuildActionButtons = (...args: any[]): any => dep('appendDisabledBuildActionButtons')(...args);
const attachHoverDetail = (...args: any[]): any => dep('attachHoverDetail')(...args);
const attachInteractiveDetail = (...args: any[]): any => dep('attachInteractiveDetail')(...args);
const bindBuildQueueDragReorder = (...args: any[]): any => dep('bindBuildQueueDragReorder')(...args);
const buildBuildingBuildTabDetailCard = (...args: any[]): any => dep('buildBuildingBuildTabDetailCard')(...args);
const buildBuildingDetailCard = (...args: any[]): any => dep('buildBuildingDetailCard')(...args);
const buildUpgradeBonusDetailCard = (...args: any[]): any => dep('buildUpgradeBonusDetailCard')(...args);
const buildableProduction = (...args: any[]): any => dep('buildableProduction')(...args);
const buildingCanBuildNow = (...args: any[]): any => dep('buildingCanBuildNow')(...args);
const buildingConverterProductionDisplay = (...args: any[]): any => dep('buildingConverterProductionDisplay')(...args);
const buildingIconHtml = (...args: any[]): any => dep('buildingIconHtml')(...args);
const buildingLevelForEpoch = (...args: any[]): any => dep('buildingLevelForEpoch')(...args);
const buildingOwnedBonusCompactHtml = (...args: any[]): any => dep('buildingOwnedBonusCompactHtml')(...args);
const buildingOwnedLevel = (...args: any[]): any => dep('buildingOwnedLevel')(...args);
const buildingProductionItem = (...args: any[]): any => dep('buildingProductionItem')(...args);
const buildingTypeQueued = (...args: any[]): any => dep('buildingTypeQueued')(...args);
const buildingUpkeepDisplay = (...args: any[]): any => dep('buildingUpkeepDisplay')(...args);
const cancelQueueItem = (...args: any[]): any => dep('cancelQueueItem')(...args);
const collectEraPreviewEntries = (...args: any[]): any => dep('collectEraPreviewEntries')(...args);
const createScrollList = (...args: any[]): any => dep('createScrollList')(...args);
const el = (...args: any[]): any => dep('el')(...args);
const fillIconElement = (...args: any[]): any => dep('fillIconElement')(...args);
const filterRuntimeActiveBuiltIds = (...args: any[]): any => dep('filterRuntimeActiveBuiltIds')(...args);
const findBuildingDef = (...args: any[]): any => dep('findBuildingDef')(...args);
const formatBuildingCatalogLockHint = (...args: any[]): any => dep('formatBuildingCatalogLockHint')(...args);
const formatBuildingPreviewHint = (...args: any[]): any => dep('formatBuildingPreviewHint')(...args);
const formatBuildingUpkeepRowHtml = (...args: any[]): any => dep('formatBuildingUpkeepRowHtml')(...args);
const formatConverterProductionRowHtml = (...args: any[]): any => dep('formatConverterProductionRowHtml')(...args);
const gameData = (...args: any[]): any => dep('gameData')(...args);
const getProd = (...args: any[]): any => dep('getProd')(...args);
const getShowEraBuildingPreview = (...args: any[]): any => dep('getShowEraBuildingPreview')(...args);
const isMeCity = (...args: any[]): any => dep('isMeCity')(...args);
const moveQueueItem = (...args: any[]): any => dep('moveQueueItem')(...args);
const productionCtxForCity = (...args: any[]): any => dep('productionCtxForCity')(...args);
const productionQueueIconSpan = (...args: any[]): any => dep('productionQueueIconSpan')(...args);
const promoteToFront = (...args: any[]): any => dep('promoteToFront')(...args);
const queueItemCumulativeEta = (...args: any[]): any => dep('queueItemCumulativeEta')(...args);
const queueItemOwnEta = (...args: any[]): any => dep('queueItemOwnEta')(...args);
const rerender = (...args: any[]): any => dep('rerender')(...args);
const resolveOwnedBuildingInactiveStatus = (...args: any[]): any => dep('resolveOwnedBuildingInactiveStatus')(...args);
const setProd = (...args: any[]): any => dep('setProd')(...args);
const setShowEraBuildingPreview = (...args: any[]): any => dep('setShowEraBuildingPreview')(...args);
const showHoverDetailNow = (...args: any[]): any => dep('showHoverDetailNow')(...args);
const sortProductionItemsByBuildability = (...args: any[]): any => dep('sortProductionItemsByBuildability')(...args);
const tury = (...args: any[]): any => dep('tury')(...args);
const upgradeChainSteps = (...args: any[]): any => dep('upgradeChainSteps')(...args);
const EPOCH_NUMBER_TO_NAME: any = valueProxy('EPOCH_NUMBER_TO_NAME');
const cfg: any = valueProxy('cfg');

// ─── Jednostki K06B (kopie pinu) ───────────────────────────────────────────────────────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:7997-8049
export function appendBuildableItemRow(
  scroll: HTMLElement,
  city: City,
  item: ProductionItem,
  data: GameData,
  opts: { praca: number; skarb: number | undefined; buildLabel: 'Buduj' | 'Ulepsz'; upgrade?: boolean },
): void {
  const def = findBuildingDef(data, item.id);
  if (!def) {
    const row = el('div', 'item-row');
    row.textContent = item.nazwa;
    scroll.appendChild(row);
    return;
  }

  const prodCtx = productionCtxForCity(city);
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const canBuild = buildingCanBuildNow(def, city, data, prodCtx, techs);

  const row = el('div', `bld-compact-row${canBuild ? ' can-build-row' : ' cannot-build-row'}`);
  const ic = el('div', 'bld-compact-ic');
  fillIconElement(ic, buildingIconHtml(def));
  row.appendChild(ic);
  const name = el('span', 'bld-compact-name');
  name.textContent = def.nazwa;
  row.appendChild(name);

  const actions = el('div', 'bld-compact-actions');
  appendBuildActionButtons(actions, city, item, opts.skarb, opts.buildLabel, opts.upgrade, {
    requirementsMet: canBuild,
  });
  actions.querySelectorAll('button').forEach((btn: any) => {
    btn.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
  });
  row.appendChild(actions);

  attachHoverDetail(
    row,
    () => buildBuildingBuildTabDetailCard(def, data, city, {
      item,
      praca: opts.praca,
      skarb: opts.skarb,
      buildLabel: opts.buildLabel,
      upgrade: opts.upgrade,
      ctx: prodCtx,
      techs,
    }),
    220,
    'left',
  );
  scroll.appendChild(row);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:8300-8428

/** Kolejka budynków (pozycje 2+ w kolejce produkcji). */
export function appendBuildQueueSection(
  mount: HTMLElement,
  city: City,
  player: boolean,
  prod: CityProduction,
  pracaBudynki: number,
): void {
  if (prod.kolejka.length <= 1) return;
  const data = gameData();
  // P-PRODUKCJA-BRAK-PROMOCJI-NA-GORE-KOLEJKI: front do zamiany przyciskiem "⇈"/strzałką ↑ na 1. pozycji.
  // / EN: front item, used by the "⇈"/first-row ↑ swap-with-front button below.
  const front = prod.kolejka[0] as ProductionItem;
  const qWrap = el('div');
  qWrap.style.cssText = 'margin-top:0.5em;padding-top:0.35em;border-top:1px solid var(--border);';
  const qh = el('div', 'gold', 'Kolejka budowy:');
  qh.style.cssText = 'font-size:0.78em;font-weight:700;margin-bottom:0.22em;';
  qWrap.appendChild(qh);
  {
    const sc = createScrollList('build-queue-scroll', {
      visible: BUILD_QUEUE_VISIBLE,
      rowEm: QUEUE_ROW_EM,
    });
    for (let i = 1; i < prod.kolejka.length; i++) {
      const it = prod.kolejka[i] as ProductionItem;
      const qi = el('div', 'qitem');
      qi.style.marginBottom = '0.15em';
      qi.dataset.queueIdx = String(i);
      if (player) qi.classList.add('qitem-draggable');
      if (player) {
        const grip = el('span', 'qitem-grip', '⋮⋮');
        grip.title = 'Przeciągnij, aby zmienić kolejność';
        qi.appendChild(grip);
      }
      const queueIcon = productionQueueIconSpan(data, it);
      qi.appendChild(queueIcon);
      if (data && it.kind === 'budynek') {
        const queueDef = findBuildingDef(data, it.id);
        if (queueDef) {
          // Read-only karta kolejki: celowo bez `item`, aby karta nie dostała
          // przycisków budowy/usunięcia ani żadnego callbacku mutującego kolejkę.
          attachInteractiveDetail(
            queueIcon,
            () => buildBuildingBuildTabDetailCard(queueDef, data, city, {
              ctx: productionCtxForCity(city),
              techs: cfg.getUnlockedTechs?.(city.ownerId) ?? [],
            }),
            { delayMs: 260, sideHint: 'auto' },
          );
        }
      }
      const qLabel = el('span');
      qLabel.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      qLabel.textContent = it.nazwa;
      qi.appendChild(qLabel);
      const cumEta = queueItemCumulativeEta(prod, i, pracaBudynki);
      const ownEta = queueItemOwnEta(it.koszt, pracaBudynki);
      const etaEl = el('span', 'qitem-eta');
      if (cumEta !== null) {
        etaEl.textContent = `gotowy za ~${cumEta} ${tury(cumEta)}`;
        etaEl.title =
          `Szacunek przy +${pracaBudynki} Pracy/turę do budynków` +
          (ownEta !== null && ownEta !== cumEta ? ` · sam budynek: ~${ownEta} ${tury(ownEta)}` : '');
      } else if (ownEta !== null) {
        etaEl.textContent = `~${ownEta} ${tury(ownEta)}`;
        etaEl.classList.add('muted-eta');
        etaEl.title =
          prod.wstrzymana === true
            ? `Budynek: ~${ownEta} ${tury(ownEta)} po wznowieniu (kolejka wstrzymana)`
            : `Sam budynek: ~${ownEta} ${tury(ownEta)} przy +${pracaBudynki} Pracy/turę`;
      } else {
        etaEl.textContent = 'brak Pracy';
        etaEl.classList.add('muted-eta');
        etaEl.title = 'Brak Pracy skierowanej do budynków — ustaw suwak „Budynki”';
      }
      qi.appendChild(etaEl);
      const idx = i;
      // P-PRODUKCJA-BRAK-PROMOCJI-NA-GORE-KOLEJKI (Maciej): dotąd ↑↓ przesuwały pozycję
      // WYŁĄCZNIE wewnątrz kolejki oczekujących -- nie dało się "wciągnąć" żadnej pozycji na
      // sam szczyt (zamieniając ją z aktualnie budowanym elementem). "⇈" zamienia od razu z
      // frontem z dowolnej pozycji; na 1. pozycji kolejki (idx===1) robi to teraz też ↑ -- była
      // martwa (zawsze disabled, i<=1), więc "utykała na granicy" zamiast dokończyć ruch.
      // P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B (Maciej 2026-08-13): postęp Pracy frontu
      // (prod.postep) NIE resetuje się już do 0 przy zamianie -- jest bankowany NA itemie,
      // który schodzi z frontu (patrz promoteToFront() -- pole ProductionItem.postep), i wraca
      // do niego w całości, gdy ten wróci na front. RUNDA 2 (naprawa B1, dropFrontItem):
      // powrót na front działa TAKŻE przy naturalnym dokończeniu poprzedzającego elementu
      // (advanceProduction) i przy wykupie (rushProduction), nie tylko przy ponownej ręcznej
      // zamianie -- tooltip niżej odzwierciedla wszystkie trzy ścieżki.
      // / EN: the front's Praca progress (prod.postep) no longer resets to 0 on swap -- it is
      // banked ON the item leaving the front (see promoteToFront() -- ProductionItem.postep)
      // and returns to it in full once it becomes the front again. ROUND 2 (B1 fix,
      // dropFrontItem): the return also happens on the preceding item's natural completion
      // (advanceProduction) and on rush-buy (rushProduction), not only on a manual re-swap --
      // the tooltip below reflects all three paths.
      const promote = el('button', 'btn btn-sm', '⇈');
      promote.style.cssText = 'padding:0 0.35em;';
      promote.title =
        `Ustaw jako aktualnie budowane — zamienia miejscami z „${front.nazwa}" ` +
        `(zebrana Praca „${front.nazwa}": ${Math.round(prod.postep)}/${front.koszt} — zostanie zachowana i wróci na front, ` +
        `gdy ten element ponownie stanie się aktualnie budowanym — czy to przez kolejną zamianę, czy przez naturalne dokończenie poprzedzającego elementu)`;
      promote.addEventListener('click', () => { setProd(city.id, promoteToFront(getProd(city.id), idx)); rerender(); });
      const up = el('button', 'btn btn-sm', '↑');
      up.style.cssText = 'padding:0 0.35em;';
      (up as HTMLButtonElement).disabled = false;
      up.title = idx === 1
        ? `Ustaw jako aktualnie budowane — zamienia miejscami z „${front.nazwa}"`
        : 'Przesuń w górę kolejki oczekujących';
      up.addEventListener('click', () => {
        if (idx === 1) { setProd(city.id, promoteToFront(getProd(city.id), idx)); }
        else { setProd(city.id, moveQueueItem(getProd(city.id), idx, -1)); }
        rerender();
      });
      const down = el('button', 'btn btn-sm', '↓');
      down.style.cssText = 'padding:0 0.35em;';
      (down as HTMLButtonElement).disabled = i >= prod.kolejka.length - 1;
      down.addEventListener('click', () => { setProd(city.id, moveQueueItem(getProd(city.id), idx, 1)); rerender(); });
      const x = el('button', 'btn btn-sm', '✕');
      x.style.cssText = 'padding:0 0.35em;';
      x.title = 'Usuń z kolejki (zwrot surowców do puli państwa)';
      x.addEventListener('click', () => { cancelQueueItem(city, idx); });
      if (player) { qi.appendChild(promote); qi.appendChild(up); qi.appendChild(down); qi.appendChild(x); }
      sc.appendChild(qi);
    }
    if (player) bindBuildQueueDragReorder(sc, city);
    qWrap.appendChild(sc);
  }
  mount.appendChild(qWrap);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:8682-8733
export function appendCatalogBuildingRow(
  scroll: HTMLElement,
  entry: BuildingCatalogEntry,
  def: BuildingDef | undefined,
  data: GameData,
  city: City,
  prodCtx: AvailabilityContext,
  techs: readonly string[],
  lockHint: string,
  opts?: { forceLocked?: boolean },
): void {
  const previewLocked = opts?.forceLocked === true;
  if (!def) {
    const row = el('div', 'item-row');
    row.textContent = entry.nazwa;
    scroll.appendChild(row);
    return;
  }

  const row = el('div', 'bld-compact-row is-locked cannot-build-row');
  const ic = el('div', 'bld-compact-ic');
  fillIconElement(ic, buildingIconHtml(def));
  row.appendChild(ic);
  const name = el('span', 'bld-compact-name');
  name.textContent = def.nazwa;
  row.appendChild(name);

  const actions = el('div', 'bld-compact-actions');
  appendDisabledBuildActionButtons(actions, 'Buduj', lockHint);
  row.appendChild(actions);

  if (!previewLocked && entry.status === 'ready') {
    const tag = el('span', 'bld-catalog-ready-tag');
    tag.style.fontSize = '0.62em';
    tag.textContent = 'Można budować';
    actions.insertBefore(tag, actions.firstChild);
  }

  attachHoverDetail(
    row,
    () => buildBuildingBuildTabDetailCard(def, data, city, {
      locked: previewLocked || entry.status === 'locked',
      lockHint: previewLocked || entry.status === 'locked' ? lockHint : undefined,
      ctx: prodCtx,
      techs,
    }),
    220,
    'left',
  );
  scroll.appendChild(row);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:8734-8860
export function renderBuildList(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  view: CityView | null,
  opts?: { visibleRows?: number; scrollFill?: boolean },
): void {
  mount.innerHTML = '';
  const titleRow = el('div');
  titleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.35em;flex-wrap:wrap;margin-bottom:0.12em;';
  titleRow.appendChild(el('div', 'ptitle', '<span>Dostępne do budowy</span>'));
  const previewLbl = el('label');
  previewLbl.style.cssText = 'display:flex;align-items:center;gap:0.28em;font-size:0.68em;color:var(--muted);cursor:pointer;user-select:none;white-space:nowrap;';
  const previewChk = document.createElement('input');
  previewChk.type = 'checkbox';
  previewChk.checked = getShowEraBuildingPreview();
  previewChk.setAttribute('aria-label', 'Podgląd badań — cała epoka na dole listy');
  previewChk.addEventListener('change', () => {
    setShowEraBuildingPreview(previewChk.checked);
    rerender();
  });
  previewLbl.appendChild(previewChk);
  previewLbl.appendChild(document.createTextNode('Podgląd badań'));
  titleRow.appendChild(previewLbl);
  mount.appendChild(titleRow);
  if (!data) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  if (!isMeCity(city.ownerId)) { mount.appendChild(el('div', 'muted', 'Miasto rywala — budowa niedostępna (podgląd).')); return; }
  // SUROW-UI-B1: pasek „ikona + ilość" surowców magazynowanych (Total War-style),
  // nad listą budowy — patrz mockup „Surowce magazyn i formy v1" KLATKA B kontekst 2.
  appendCityResourceStockStrip(mount, city);
  const praca = view ? view.praca : 0;
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const civBonusy = cfg.getCivBonusy?.(city.ownerId) ?? [];
  const prodState = getProd(city.id);
  const prodCtx = productionCtxForCity(city);
  const items = sortProductionItemsByBuildability(
    buildableProduction(city, data, techs, prodCtx),
    city,
    data,
    prodCtx,
    techs,
  );

  const skarb = cfg.getTreasury?.(city.ownerId);

  const ups: ProductionItem[] = [];
  if (built.length > 0) {
    const seenUpgrade = new Set<string>();
    for (const id of built) {
      if (seenUpgrade.has(id)) continue;
      seenUpgrade.add(id);
      const def = data.buildings.find((b: any) => b.id === id);
      if (!def || def.maksPoziom <= 1) continue;
      if (buildingTypeQueued(id, prodState.kolejka)) continue;
      const targetLevel = buildingLevelForEpoch(def.epokaWejscia, epoch, def.maksPoziom, def.poziomTechGate, techs);
      if (targetLevel <= 1) continue;
      const item = buildingProductionItem(
        id,
        data,
        targetLevel,
        civBonusy,
        cfg.getBuildingCostPace?.() ?? 'niski',
        city.ownerId,
        cfg.getDifficulty?.() ?? 'normal',
      );
      if (!item) continue;
      const nazwaPoziom: string = (def.nazwyPoziomow[targetLevel - 1] ?? '');
      const levelLabel = nazwaPoziom.length > 0
        ? `${def.nazwa} → poz. ${targetLevel} (${nazwaPoziom})`
        : `${def.nazwa} → poziom ${targetLevel}`;
      ups.push({ ...item, nazwa: levelLabel });
    }
  }

  const eraName = EPOCH_NUMBER_TO_NAME[epoch] ?? `Epoka ${epoch}`;
  const fullEraPreview = getShowEraBuildingPreview();
  const previewEntries = collectEraPreviewEntries(data, techs, prodCtx, fullEraPreview);

  const sortedUps = sortProductionItemsByBuildability(ups, city, data, prodCtx, techs);

  if (items.length === 0 && sortedUps.length === 0 && previewEntries.length === 0) {
    mount.appendChild(el('div', 'muted', '(brak budynków — zbadaj technologie)'));
    return;
  }

  const scroll = createScrollList(
    'list-scroll',
    opts?.scrollFill
      ? { fill: true }
      : opts?.visibleRows != null
        ? { visible: opts.visibleRows, rowEm: LIST_ROW_HEIGHT_COMPACT }
        : undefined,
  );
  for (const it of items) {
    appendBuildableItemRow(scroll, city, it, data, { praca, skarb, buildLabel: 'Buduj' });
  }
  if (sortedUps.length > 0) {
    const h = el('div', 'muted');
    h.style.cssText = 'font-size:0.72em;margin:0.35em 0 0.2em;padding-top:0.25em;border-top:1px solid var(--border);';
    h.textContent = 'Ulepsz';
    scroll.appendChild(h);
    for (const u of sortedUps) {
      appendBuildableItemRow(scroll, city, u, data, { praca, skarb, buildLabel: 'Ulepsz', upgrade: true });
    }
  }
  if (previewEntries.length > 0) {
    const h = el('div', 'muted');
    h.style.cssText = 'font-size:0.72em;margin:0.35em 0 0.2em;padding-top:0.25em;border-top:1px solid var(--border);';
    h.textContent = fullEraPreview
      ? `Podgląd epoki ${eraName} (badania)`
      : `Jeszcze zablokowane (epoka ${eraName})`;
    scroll.appendChild(h);
    for (const entry of previewEntries) {
      const def = findBuildingDef(data, entry.id);
      const lockHint = fullEraPreview && def
        ? formatBuildingPreviewHint(def, data, techs)
        : formatBuildingCatalogLockHint(entry, data, techs);
      appendCatalogBuildingRow(scroll, entry, def, data, city, prodCtx, techs, lockHint, {
        forceLocked: fullEraPreview || entry.status === 'locked',
      });
    }
  }
  mount.appendChild(scroll);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:9033-9183
export function appendOwnedBuildingRow(
  target: HTMLElement,
  id: string,
  data: GameData,
  city?: City,
  opts?: { compact?: boolean; detailSide?: 'left' | 'right' },
): void {
  const compact = opts?.compact === true;
  // P-PRODUKCJA-BUDYNKI-WYBUDOWANE-PRAWA-KOLUMNA, znalezisko Evaluatora (2026-08-12): karty
  // szczegółów muszą dokować po TEJ SAMEJ stronie co lista, która je wywołuje -- '`left'
  // zahardkodowane tu było poprawne, gdy lista żyła wyłącznie w lewej kolumnie (legacy
  // #cs-owned), ale po przeniesieniu do prawej kolumny wymuszało dok po przeciwnej stronie
  // ekranu niż kliknięcie/hover.
  // / EN: detail cards must dock on the SAME side as the list that triggers them --
  // hardcoded 'left' was correct while the list only lived in the left column (legacy
  // #cs-owned), but after moving to the right column it forced the dock to the wrong side.
  const detailSide: 'left' | 'right' = opts?.detailSide ?? 'left';
  const def = data.buildings.find((b: any) => b.id === id);
  const row = el('div', compact ? 'bld-owned-row bld-owned-row--tight' : 'bld-owned-row');
  const hd = el('div', 'bld-owned-hd');
  appendBuildingInlineIcon(hd, def);
  const bn = el('span', 'bld-owned-name');
  bn.textContent = def ? def.nazwa : id;
  let upgradeChainTitle = '';
  if (def && (def.upgradeFrom ?? '').trim().length > 0) {
    upgradeChainTitle = upgradeChainSteps(def.id, data.buildings).map((c: any) => c.nazwa).join(' → ');
  }
  // N2 (werdykt Evaluatora, runda 1): hoisted na zasięg całej funkcji -- wiersz
  // produkcji konwertera (dalej niżej) MUSI wiedzieć, czy budynek jest
  // runtime-nieaktywny, i NIE liczyć tego drugi raz. / EN: hoisted to function
  // scope -- the converter production row (further below) needs to know
  // whether the building is runtime-inactive, without recomputing it.
  let inactiveStatus: ReturnType<typeof resolveOwnedBuildingInactiveStatus> | undefined;
  if (def && city) {
    const builtIds = cfg.getBuiltBuildingIds?.(city.id) ?? [];
    const allCities = cfg.getCities?.() ?? [];
    const empireStock = cfg.getEmpireStock?.(city.ownerId);
    let empireBuiltIds = cfg.getEmpireBuiltIds?.(city.ownerId);
    if (!empireBuiltIds) {
      const collected: string[] = [];
      for (const c of allCities) {
        if (c.ownerId !== city.ownerId) continue;
        collected.push(...(cfg.getBuiltBuildingIds?.(c.id) ?? []));
      }
      empireBuiltIds = collected;
    }
    const activeLabels = cfg.getEmpireResourceAccess?.(city.ownerId) ?? [];
    const runtimeActiveBuiltIds = filterRuntimeActiveBuiltIds(
      empireBuiltIds,
      activeLabels,
      empireStock,
      { ownerId: city.ownerId, resolveOwnerZlotoAccess: cfg.getOwnerHasZlotoAccess },
    );
    inactiveStatus = resolveOwnedBuildingInactiveStatus(id, {
      builtIds,
      allCities,
      ownerId: city.ownerId,
      runtimeActiveBuiltIds,
      empireStock,
      building: def,
      resolveOwnerZlotoAccess: cfg.getOwnerHasZlotoAccess,
    });
    if (inactiveStatus.inactive) {
      bn.classList.add('bld-owned-name--inactive');
      bn.title = inactiveStatus.tooltip
        + (upgradeChainTitle ? '\n' + upgradeChainTitle : '');
    } else if (upgradeChainTitle) {
      bn.title = upgradeChainTitle;
    }
  } else if (upgradeChainTitle) {
    bn.title = upgradeChainTitle;
  }
  hd.appendChild(bn);
  if (def && city) {
    const level = buildingOwnedLevel(def, city);
    if (!compact && (level > 1 || def.maksPoziom > 1)) {
      const lv = el('span', 'bld-owned-lvl');
      lv.textContent = `L${level}`;
      lv.title = `Poziom ${level}${def.nazwyPoziomow[level - 1] ? ' · ' + def.nazwyPoziomow[level - 1] : ''}`;
      hd.appendChild(lv);
    } else if (compact && level > 1) {
      bn.textContent = `${def.nazwa} L${level}`;
    }
  }
  if (def && (def.upgradeFrom ?? '').trim().length > 0) {
    const upBtn = el('button', 'bld-upg');
    upBtn.type = 'button';
    upBtn.textContent = '↗';
    upBtn.title = 'Skład bonusów upgrade';
    upBtn.setAttribute('aria-label', `Skład bonusów ${def.nazwa}`);
    attachInteractiveDetail(upBtn, () => buildUpgradeBonusDetailCard(def, data, city), { delayMs: 260, sideHint: detailSide });
    hd.appendChild(upBtn);
  }
  row.appendChild(hd);

  if (def && city) {
    const level = buildingOwnedLevel(def, city);
    const tail = el('div', 'bld-owned-tail');
    const upkeepDisplay = buildingUpkeepDisplay(def, level);
    const upSpan = el('span', 'bld-owned-upkeep' + (upkeepDisplay.gold === 0 && Object.keys(upkeepDisplay.resources).length === 0 ? ' muted' : ''));
    upSpan.innerHTML = formatBuildingUpkeepRowHtml(upkeepDisplay, compact);
    tail.appendChild(upSpan);
    const bonusHtml = buildingOwnedBonusCompactHtml(def, level, data.buildings, { compact });
    if (bonusHtml) {
      const bon = el('span', 'bld-owned-bonus');
      bon.innerHTML = bonusHtml;
      tail.appendChild(bon);
    }
    if (tail.childElementCount > 0) row.appendChild(tail);
    // P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE: DRUGA linia, oddzielona od
    // `tail` (koszt utrzymania) -- bilans produkcji konwertera (Garncarnia i in.).
    // / EN: SECOND line, kept separate from `tail` (upkeep) -- converter
    // production balance (Pottery and other converter buildings).
    const convDisplay = buildingConverterProductionDisplay(def, city, data);
    if (convDisplay) {
      const convHtml = formatConverterProductionRowHtml(convDisplay, compact);
      if (convHtml) {
        // N2 (werdykt Evaluatora, runda 1): budynek runtime-nieaktywny nie
        // wykonuje konwersji -- wyszarz linię produkcji zamiast pokazywać ją
        // jakby budynek działał; `inactiveStatus` już policzone wyżej (hoisted),
        // bez ponownego liczenia. / EN: a runtime-inactive building performs no
        // conversion -- grey out the production row instead of showing it as
        // if the building were active; `inactiveStatus` already computed above
        // (hoisted), not recomputed.
        const convInactive = inactiveStatus?.inactive === true;
        const convRow = el('div', 'bld-owned-conv-row' + (convInactive ? ' bld-owned-conv-row--inactive' : ''));
        convRow.innerHTML = convHtml;
        if (convInactive && inactiveStatus?.tooltip) convRow.title = inactiveStatus.tooltip;
        row.appendChild(convRow);
      }
    }
    attachHoverDetail(row, () => buildBuildingDetailCard(def, data, city), 280, detailSide);
    row.addEventListener('click', (e: any) => {
      if ((e.target as HTMLElement).closest('.bld-upg')) return;
      e.stopPropagation();
      showHoverDetailNow(row, () => buildBuildingDetailCard(def, data, city), detailSide);
    });
  }

  target.appendChild(row);
}

// pin-end
