/**
 * K06B-2: karty jednostek, budynków i kolejka rekrutacji (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 1).
 *
 * Ciała jednostek są kopiami z pinu edb8fb56 (`gra/src/ui/cityPanel.ts`); każda kopia ma znacznik `// pin edb8fb56 …:A-B`.
 * Zależności: `dep(…)` / `valueProxy(…)` / `constStr(…)` z `k06b-deps.ts` (K06B-Z2, Z4), stałe literalne (K06B-Z3),
 * typy pinu jako `any` (K06B-Z5), stan K06A przez akcesory (K06B-Z6), odłożone 3D/MAPA jako placeholdery (K06B-Z7).
 */

import { getK06aState } from './k06a-fundament';
import { constStr, dep, valueProxy } from './k06b-deps';
import { appendOwnedBuildingRow } from './k06b-kolejki';

// ─── K06B-Z5: typy pinu (alias any; zgodność z viewmodel/types.ts NIE_ZMIERZONO) ─────────────────────────────
type City = any;
type CityView = any;
type EntityCardData = any;
type GameData = any;
type ProductionItem = any;
type UnitDef = any;

// ─── K06B-Z3: stałe literalne z pinu ───────────────────────────────────────────────────────────────────────────
const PULA_LBL = 'Ulepszenia (pula)';
const QUEUE_ROW_EM = 2.75;
const RECRUIT_QUEUE_VISIBLE = 5;

// ─── K06B-Z2/Z4: delegaty funkcji i wartości ───────────────────────────────────────────────────────────────────
const _legacyBuildUnitDetailCard = (...args: any[]): any => dep('_legacyBuildUnitDetailCard')(...args);
const appendDetailSection = (...args: any[]): any => dep('appendDetailSection')(...args);
const appendTechDetailBlock = (...args: any[]): any => dep('appendTechDetailBlock')(...args);
const attachHoverDetail = (...args: any[]): any => dep('attachHoverDetail')(...args);
const beginBuildingDetailTile = (...args: any[]): any => dep('beginBuildingDetailTile')(...args);
const bindRecruitQueueDragReorder = (...args: any[]): any => dep('bindRecruitQueueDragReorder')(...args);
const buildUnitRecruitCard = (...args: any[]): any => dep('buildUnitRecruitCard')(...args);
const cityPanelChipIconWrap = (...args: any[]): any => dep('cityPanelChipIconWrap')(...args);
const cityPracaSplit = (...args: any[]): any => dep('cityPracaSplit')(...args);
const createScrollList = (...args: any[]): any => dep('createScrollList')(...args);
const defaultOwnerColor = (...args: any[]): any => dep('defaultOwnerColor')(...args);
const dequeueRecruitment = (...args: any[]): any => dep('dequeueRecruitment')(...args);
const el = (...args: any[]): any => dep('el')(...args);
const empireRekruciAffordable = (...args: any[]): any => dep('empireRekruciAffordable')(...args);
const empireRekruciTotal = (...args: any[]): any => dep('empireRekruciTotal')(...args);
const ensureEntityCardBuildingStyles = (...args: any[]): any => dep('ensureEntityCardBuildingStyles')(...args);
const etaTurns = (...args: any[]): any => dep('etaTurns')(...args);
const fillIconElement = (...args: any[]): any => dep('fillIconElement')(...args);
const findUnitDef = (...args: any[]): any => dep('findUnitDef')(...args);
const formatBuildingUpkeepTotalHtml = (...args: any[]): any => dep('formatBuildingUpkeepTotalHtml')(...args);
const formatManpower = (...args: any[]): any => dep('formatManpower')(...args);
const frontItem = (...args: any[]): any => dep('frontItem')(...args);
const gameData = (...args: any[]): any => dep('gameData')(...args);
const getProd = (...args: any[]): any => dep('getProd')(...args);
const groupBuiltBuildingIds = (...args: any[]): any => dep('groupBuiltBuildingIds')(...args);
const maxAffordableRecruitQuantity = (...args: any[]): any => dep('maxAffordableRecruitQuantity')(...args);
const missingStockFor = (...args: any[]): any => dep('missingStockFor')(...args);
const moveRecruitQueueItem = (...args: any[]): any => dep('moveRecruitQueueItem')(...args);
const ownerSurowcePoolFor = (...args: any[]): any => dep('ownerSurowcePoolFor')(...args);
const productionQueueIconSpan = (...args: any[]): any => dep('productionQueueIconSpan')(...args);
const psiRowLabel = (...args: any[]): any => dep('psiRowLabel')(...args);
const recruitManpowerCost = (...args: any[]): any => dep('recruitManpowerCost')(...args);
const recruitUnit = (...args: any[]): any => dep('recruitUnit')(...args);
const renderEntityCard = (...args: any[]): any => dep('renderEntityCard')(...args);
const rerender = (...args: any[]): any => dep('rerender')(...args);
const resolveEmpireSnap = (...args: any[]): any => dep('resolveEmpireSnap')(...args);
const resourceTextClass = (...args: any[]): any => dep('resourceTextClass')(...args);
const setProd = (...args: any[]): any => dep('setProd')(...args);
const signed = (...args: any[]): any => dep('signed')(...args);
const statChipBrand = (...args: any[]): any => dep('statChipBrand')(...args);
const stockResourceLabel = (...args: any[]): any => dep('stockResourceLabel')(...args);
const sumOwnedBuildingsResourceUpkeep = (...args: any[]): any => dep('sumOwnedBuildingsResourceUpkeep')(...args);
const sumOwnedBuildingsUpkeep = (...args: any[]): any => dep('sumOwnedBuildingsUpkeep')(...args);
const tury = (...args: any[]): any => dep('tury')(...args);
const unitAdapter = (...args: any[]): any => dep('unitAdapter')(...args);
const unitIconHtml = (...args: any[]): any => dep('unitIconHtml')(...args);
const unitResourceUpkeepChipsHtml = (...args: any[]): any => dep('unitResourceUpkeepChipsHtml')(...args);
const unitStockCost = (...args: any[]): any => dep('unitStockCost')(...args);
const unitStockCostChipsHtml = (...args: any[]): any => dep('unitStockCostChipsHtml')(...args);
const cfg: any = valueProxy('cfg');

// ─── Jednostki K06B (kopie pinu) ───────────────────────────────────────────────────────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:5028-5111
export function appendPodzialPracyInfo(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  data: GameData | null,
): void {
  const praca = view ? cityPracaSplit(city, view, data) : null;
  const empire = resolveEmpireSnap(city, getK06aState().activeMap, data);
  const pool = Math.round(empire.pracaPool ?? empire.pracaRate ?? 0);
  const skarb = Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0);
  const skarbDelta = view ? Math.round(view.pieniadz) : 0;
  const prod = getProd(city.id);
  const front = frontItem(prod);
  const rq = prod.rekrutacja ?? [];

  const chips = el('div', 'chip-row praca-split-chips');
  chips.innerHTML =
    statChipBrand('res-work', 'Miasto', praca ? signed(praca.total) : '—', resourceTextClass('praca')) +
    statChipBrand('cp-buildings', 'Budynki', praca ? `+${praca.doBudynkow}` : '—', 'gold') +
    statChipBrand('chip-crate', PULA_LBL, praca ? `+${praca.doPuli}` : '—', 'blue');
  mount.appendChild(chips);

  const info = el('div', 'praca-split-info');

  const rowTotal = el('div', 'psi-row');
  rowTotal.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('res-work', 'Praca w mieście')}</span>` +
    `<span class="psi-val ${resourceTextClass('praca')}">${praca ? signed(praca.total) + cityPanelChipIconWrap('res-work', 16) : '—'}</span>`;
  info.appendChild(rowTotal);

  const rowBud = el('div', 'psi-row');
  let budVal = praca ? `${signed(praca.doBudynkow)} (${praca.pctBudynki}%)` : '—';
  let budSub = '';
  if (front && praca) {
    const paused = prod.wstrzymana === true;
    const eta = paused ? null : etaTurns(front.koszt, prod.postep, praca.doBudynkow);
    budSub =
      `${front.nazwa}: ${prod.postep}/${front.koszt}${cityPanelChipIconWrap('res-work', 14)}` +
      (paused ? ' · wstrzymana' : eta != null ? ` · ~${eta} ${tury(eta)}` : praca.doBudynkow > 0 ? '' : ' · brak pracy');
  }
  const budLbl = psiRowLabel(
    'cp-buildings',
    'Kolejka budowy',
    front ? undefined : 'Kolejka budowy pusta — wybierz Buduj w lewym railu',
  );
  rowBud.innerHTML =
    `<span class="psi-lbl">${budLbl}</span>` +
    `<span class="psi-val gold">${budVal}${budSub ? `<div class="psi-sub">${budSub}</div>` : ''}</span>`;
  info.appendChild(rowBud);

  const rowPool = el('div', 'psi-row');
  const poolTip = `${constStr('PODZIAL_PRACY_PULA_TIP')} Zapas całej cywilizacji: ${pool} Pracy.`;
  rowPool.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('chip-crate', constStr('PODZIAL_PRACY_PULA_LBL_PELNA'), poolTip)}</span>` +
    `<span class="psi-val blue">${praca ? `${signed(praca.doPuli)} (${praca.pctPuli}%)` : '—'}` +
    `<div class="psi-sub">Zapas Pracy na ulepszenia pól: ${pool}${cityPanelChipIconWrap('res-work', 14)} · farma, kamieniołom, projekty mapy</div></span>`;
  info.appendChild(rowPool);

  const rowSkarb = el('div', 'psi-row');
  const rqSub = rq.length > 0 ? `Kolejka rekrutacji: ${rq.length} · opłacone złotem` : '';
  const skarbTip = rq.length > 0
    ? undefined
    : 'Jednostki kupujesz za złoto ze skarbca (zakładka Rekrut.)';
  rowSkarb.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('res-treasury', 'Skarbiec', skarbTip)}</span>` +
    `<span class="psi-val ${resourceTextClass('skarbiec')}">${skarb}${skarbDelta !== 0 ? ` (${signed(skarbDelta)})` : ''}` +
    `${rqSub ? `<div class="psi-sub">${rqSub}</div>` : ''}</span>`;
  info.appendChild(rowSkarb);

  mount.appendChild(info);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7806-7860
export function buildOwnedBuildingsDetailCard(city: City, data: GameData | null): HTMLDivElement {
  const card = el('div', 'detail-card');
  const built = cfg.getBuiltBuildingIds?.(city.id);
  card.appendChild(el('div', 'dc-h',
    `<span>Budynki w mieście${built ? ' (' + built.length + ')' : ''}</span>`));
  if (!data) {
    card.appendChild(el('div', 'dc-note', 'Brak danych gry'));
    return card;
  }
  if (!built || built.length === 0) {
    card.appendChild(el('div', 'dc-note', '(brak — zbuduj pierwszy)'));
    return card;
  }
  const totalUpkeep = sumOwnedBuildingsUpkeep(built, data, city);
  const totalResUpkeep = sumOwnedBuildingsResourceUpkeep(built, data);
  const summary = el('div', 'bld-owned-summary');
  summary.innerHTML =
    formatBuildingUpkeepTotalHtml(totalUpkeep, totalResUpkeep) +
  ` · kliknij budynek — pełne szczegóły`;
  card.appendChild(summary);
  const groups = groupBuiltBuildingIds(built, data.buildings);
  for (const { grupa, ids } of groups) {
    if (ids.length === 0) continue;
    appendDetailSection(card, grupa);
    const list = el('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:0.1em;margin-bottom:0.28em;';
    for (const id of ids) appendOwnedBuildingRow(list, id, data, city);
    card.appendChild(list);
  }
  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7861-7884

/**
 * Karta szczegółów jednostki w panelu miasta/rekrutacji (T6 MIGRACJA-KARTA-JEDNOSTKI-
 * PANEL-MIASTA). Buduje treść przez WSPÓLNY `unitAdapter` (`entityCards/unitAdapter.ts`)
 * — TEN SAM adapter co karta jednostki na mapie (`unitInfoCard.ts`, T4) — i renderuje
 * przez wspólny `renderEntityCard`, zamiast własnego DOM-buildera — wzorem T3/T4/T5.
 * Stara implementacja zostaje pod prywatną nazwą (`_legacyBuildUnitDetailCard`) jako
 * fallback, dopóki Final Control nie potwierdzi parytetu (wzorem T5).
 *
 * Sekcje „Technologie"/„Uwagi" dopełnione TU (host), NIE w adapterze — 1:1 z tym, jak
 * `buildBuildingDetailCardViaEntityCard` dopełnia te same dwie sekcje dla budynków
 * (`appendTechDetailBlock` świadomie NIE migrowane w tym kroku, plan architektury §3
 * krok 2/§7 pkt 2) — więc pozostają WYŁĄCZNIE w karcie rekrutacji, karta mapy
 * (`unitInfoCard.ts`, poza allowlistą T6) ich nie dostaje; udokumentowane w tabeli
 * porównawczej raportu T6 jako świadoma, uzasadniona różnica (dziedziczona z T5, nie
 * nowa w T6).
 *
 * Pola „Charakterystyka"/dodatkowe wiersze „Statystyki bojowe" (Obrażenia broni, Bonus
 * szarży, Ruch w bitwie, Pociski, Widok pola, Kara flanki, Kara od tyłu, Próg dezercji,
 * Morale bazowe/ucieczki, Linia, Klasa) — dotąd TYLKO w tej karcie — zostały w T6
 * DOPISANE do wspólnego `unitAdapter.ts` (patrz nagłówek tego pliku), więc karta mapy
 * zaczyna je też pokazywać. To świadoma decyzja Operatora T6 (bez ABC): czysto
 * addytywne wzbogacenie, zero utraconej treści po żadnej stronie.
 */
export function buildUnitDetailCardViaEntityCard(u: UnitDef, data: GameData): HTMLDivElement {
  ensureEntityCardBuildingStyles();
  const built = unitAdapter(u, {});
  // Podgląd 3D w medalionie nagłówka — wzorem `unitInfoCard.ts::buildUnitInfoCardViaEntityCard`
  // (ten sam mechanizm `mountUnitMiniPreview`/`defaultOwnerColor`, R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1).
  const cardData: EntityCardData = {
    ...built,
    medallion: {
      kind: 'unit3d',
      mount: (slot: HTMLElement) =>
        ((): undefined => { /* 3D odłożone: K06B-Z7 */ return undefined; })(),
    },
  };
  const card = renderEntityCard(cardData) as HTMLDivElement;
  card.classList.add('unit-detail-card', 'bld-detail-card');

  const techBody = beginBuildingDetailTile(card, 'Technologie');
  appendTechDetailBlock(techBody, data, u.Tech);

  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7885-7896

/** Publiczna sygnatura BEZ ZMIAN. Próbuje ścieżkę entityCards (T6), fallback do starej
 * implementacji (`_legacyBuildUnitDetailCard`) w razie wyjątku — wzorem T3/T4/T5. */
export function buildUnitDetailCard(u: UnitDef, data: GameData): HTMLDivElement {
  try {
    return buildUnitDetailCardViaEntityCard(u, data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cityPanel] buildUnitDetailCard: błąd ścieżki entityCards, fallback do starej implementacji:', err);
    return _legacyBuildUnitDetailCard(u, data);
  }
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7976-7996
export function attachUnitRowThumb(
  row: HTMLElement,
  udef: UnitDef | undefined,
  id: string,
  data: GameData | null,
  ownerId: number,
): void {
  const thumb = el('div', 'item-thumb unit-row-thumb');
  thumb.style.cssText = 'width:2.6em;height:2.6em;flex-shrink:0;overflow:hidden;border-radius:4px;';
  row.appendChild(thumb);
  if (udef && data) {
    const color = cfg.getOwnerColor?.(ownerId) ?? defaultOwnerColor();
    void color; /* miniatura 3D odłożona: K06B-Z7 */
    attachHoverDetail(thumb, () => buildUnitDetailCard(udef, data), 180);
  } else {
    const fallback = el('div', 'mini-thumb');
    fillIconElement(fallback, unitIconHtml(udef, id));
    thumb.appendChild(fallback);
  }
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:8137-8182
export function appendUnitRecruitCompactRow(
  scroll: HTMLElement,
  city: City,
  item: ProductionItem,
  data: GameData,
  skarb: number | undefined,
): void {
  const udef = findUnitDef(data, item.id);
  if (!udef) return;
  const mpCost = recruitManpowerCost(city, item.id);
  const mpAvailable = empireRekruciTotal(city);
  const canMp = empireRekruciAffordable(city, mpCost, mpAvailable);
  const mpMissing = mpAvailable == null ? undefined : Math.max(0, mpCost - mpAvailable);
  // JEDNOSTKI-SUROWIEC-01 + R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1: bramka na puli
  // państwa liczy WYŁĄCZNIE jednorazowy koszt zakupu; utrzymanie idzie w następnej turze.
  const stockCost = unitStockCost(udef);
  const stockMissing = missingStockFor(ownerSurowcePoolFor(city), stockCost);
  const recruitOk = Object.keys(stockMissing).length === 0;
  const row = buildUnitRecruitCard({
    udef,
    item,
    data,
    skarb,
    canPurchase: !!cfg.onPurchaseUnit && canMp && recruitOk,
    treasuryIconHtml: cityPanelChipIconWrap('res-treasury', 14),
    mpCost,
    mpCostLabel: formatManpower(mpCost),
    maxQuantity: maxAffordableRecruitQuantity(city, item, mpCost, skarb, stockCost),
    manpowerAvailable: mpAvailable,
    manpowerRequired: mpCost,
    stockChipsHtml: unitStockCostChipsHtml(udef, city),
    resourceUpkeepChipsHtml: unitResourceUpkeepChipsHtml(udef),
    stockMissingLabel: !recruitOk
      ? 'Brakuje w magazynie: ' + Object.entries(stockMissing)
        .map(([k, v]) => `${v} ${stockResourceLabel(k)}`)
        .join(', ')
      : undefined,
    manpowerMissingLabel: mpMissing != null && mpMissing > 0
      ? `Brakuje rekrutów: ${formatManpower(mpMissing)}`
      : undefined,
    onRecruit: (quantity: any) => recruitUnit(city, item, quantity),
  });
  attachHoverDetail(row, () => buildUnitDetailCard(udef, data), 220, 'left');
  scroll.appendChild(row);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:8210-8299
export function appendRecruitmentQueue(mount: HTMLElement, city: City, player: boolean, opts?: { w4?: boolean }): void {
  const prod = getProd(city.id);
  const rq = prod.rekrutacja ?? [];
  if (rq.length === 0) return;
  const data = gameData();
  const wrap = el('div');
  wrap.style.cssText = opts?.w4
    ? 'margin-bottom:0.45em;padding-bottom:0.35em;border-bottom:1px solid rgba(232,216,138,.12);'
    : 'margin-top:0.5em;border-top:1px solid var(--border);padding-top:0.35em;';
  const qh = el('div', opts?.w4 ? 'civ-w4-section-hd' : 'gold');
  if (opts?.w4) {
    qh.textContent = 'Kolejka rekrutacji';
  } else {
    qh.textContent = 'Kolejka rekrutacji:';
    qh.style.cssText = 'font-size:0.78em;font-weight:700;margin-bottom:0.22em;';
  }
  wrap.appendChild(qh);
  {
    const sc = createScrollList('recruit-queue-scroll', {
      visible: RECRUIT_QUEUE_VISIBLE,
      rowEm: QUEUE_ROW_EM,
    });
    if (opts?.w4) sc.classList.add('list-scroll-fill');
    for (let i = 0; i < rq.length; i++) {
      const it = rq[i]!;
      const udef = data ? findUnitDef(data, it.id) : undefined;
      const qi = el('div', 'qitem');
      qi.style.marginBottom = '0.15em';
      qi.dataset.recruitIdx = String(i);
      if (player) qi.classList.add('qitem-draggable');
      if (player) {
        const grip = el('span', 'qitem-grip', '⋮⋮');
        grip.title = 'Przeciągnij, aby zmienić kolejność';
        qi.appendChild(grip);
      }
      const iconSpan = productionQueueIconSpan(data, it);
      iconSpan.classList.add('qitem-ic');
      if (udef && data) {
        attachHoverDetail(iconSpan, () => buildUnitDetailCard(udef, data), 180);
      }
      qi.appendChild(iconSpan);
      const qLabel = el('span');
      qLabel.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      qLabel.textContent = it.nazwa;
      qi.appendChild(qLabel);
      const costEl = el('span', 'qitem-cost');
      costEl.innerHTML = `${it.koszt} ${cityPanelChipIconWrap('res-treasury', 14)}`;
      costEl.title = `Opłacone ze skarbca: ${it.koszt}`;
      qi.appendChild(costEl);
      const etaTurns = i + 1;
      const etaEl = el('span', 'qitem-eta');
      etaEl.textContent = etaTurns === 1 ? 'nast. tura' : `~${etaTurns} ${tury(etaTurns)}`;
      etaEl.title = `Szacunek: ${etaTurns} ${tury(etaTurns)} (1 jednostka na turę)`;
      qi.appendChild(etaEl);
      if (player) {
        const up = el('button', 'btn btn-sm', '↑');
        up.style.cssText = 'padding:0 0.35em;';
        (up as HTMLButtonElement).disabled = i <= 0;
        up.addEventListener('click', () => {
          setProd(city.id, moveRecruitQueueItem(getProd(city.id), i, -1));
          rerender();
        });
        const down = el('button', 'btn btn-sm', '↓');
        down.style.cssText = 'padding:0 0.35em;';
        (down as HTMLButtonElement).disabled = i >= rq.length - 1;
        down.addEventListener('click', () => {
          setProd(city.id, moveRecruitQueueItem(getProd(city.id), i, 1));
          rerender();
        });
        const x = el('button', 'btn btn-sm', '✕');
        x.style.cssText = 'padding:0 0.35em;';
        x.title = 'Usuń z kolejki (zwrot opłaty do skarbca)';
        x.addEventListener('click', () => {
          cfg.onCancelRecruitment?.(city.id, it.id, it.koszt);
          setProd(city.id, dequeueRecruitment(getProd(city.id), i));
          rerender();
        });
        qi.appendChild(up);
        qi.appendChild(down);
        qi.appendChild(x);
      }
      sc.appendChild(qi);
    }
    if (player) bindRecruitQueueDragReorder(sc, city);
    wrap.appendChild(sc);
  }
  mount.appendChild(wrap);
}

// pin-end
