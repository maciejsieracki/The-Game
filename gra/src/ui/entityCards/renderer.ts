/**
 * entityCards/renderer.ts — jeden DOM-builder dla wszystkich 4 kinds (plan §1).
 *
 * T1: obsługuje w pełni tryb `dialog` (backdrop + `escapeOverlayStack`, wzorem
 * `unitInfoCard.ts:showUnitInfoCardDialog`). `opts.mode` istnieje już w typach
 * (`inline`/`hover` dochodzą w T5) — patrz `06-dispatch-T1-kontrakt.md`.
 *
 * Zero edycji istniejących kart — ten renderer nie jest jeszcze wołany przez
 * `unitInfoCard.ts`/`cityPanel.ts`/`techDiscoveryNotice.ts` (migracja to T3+).
 */
import { pushOverlay, popOverlay } from '../escapeOverlayStack';
import { attachHoverDetail } from '../hoverDetailDock';
import { resolveBuildingRow, resolveImprovementRow, resolveTechnologyRow, resolveUnitRow } from './registry';
import { unitAdapter } from './unitAdapter';
import { buildingAdapter } from './buildingAdapter';
import { technologyAdapter } from './technologyAdapter';
import { improvementAdapter } from './improvementAdapter';
import type {
  EntityCardData,
  EntityCardCtx,
  EntityKind,
  EntityCardDismiss,
  OpenEntityCardOptions,
} from './types';

let overlaySeq = 0;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Buduje `EntityCardData` per kind, delegując do resolver+adapter. `null` gdy id
 * nie istnieje w danych (adapter nie jest wołany — brak surowego wiersza). */
export function buildEntityCardData(kind: EntityKind, id: string, ctx: EntityCardCtx = {}): EntityCardData | null {
  const data = ((): EntityCardData | null => {
    switch (kind) {
      case 'unit': {
        const row = resolveUnitRow(id);
        return row == null ? null : unitAdapter(row, ctx);
      }
      case 'building': {
        const row = resolveBuildingRow(id);
        return row == null ? null : buildingAdapter(row, ctx);
      }
      case 'technology': {
        const row = resolveTechnologyRow(id);
        return row == null ? null : technologyAdapter(row, ctx);
      }
      case 'improvement': {
        const row = resolveImprovementRow(id);
        return row == null ? null : improvementAdapter(row, ctx);
      }
    }
  })();
  if (data == null) return null;
  // Gwarancja kontraktu: `data.id` jest ZAWSZE dokładnie tym `id`, po którym encja
  // została odnaleziona (resolver) — niezależnie od tego, czy adapter potrafi je
  // wyliczyć samodzielnie z surowego wiersza (np. `improvement` — wiersz w
  // `terrain-improvements.json` nie niesie własnego klucza obiektu, patrz
  // `improvementAdapter.ts`). Zapobiega cichemu rozjazdowi `id` używanego do
  // zapytania od `id` w zwróconych danych.
  return { ...data, id };
}

/** Buduje jeden wiersz 'grid' — label/value zwykłe, plus opcjonalne icon/trailing/badge
 * (T1b). Gdy `row.badge` jest podany, wiersz renderuje się jak `actionItemRow()`
 * (`techDiscoveryNotice.ts:189-191`): badge kolorowy + `row.value` jako tekst obok,
 * `row.label` staje się etykietą badge'a — zamiast siatki label/value. */
function buildGridRowEl(row: EntityCardData['sections'][number]['rows'][number]): HTMLElement {
  if (row.badge) {
    const rowEl = el('div', 'entity-card-row entity-card-row-action');
    const badgeEl = el('span', `entity-card-row-badge entity-card-row-badge--${row.badge.kind}`);
    badgeEl.textContent = row.badge.label;
    const text = el('span', 'entity-card-row-action-text');
    text.textContent = row.value;
    rowEl.append(badgeEl, text);
    return rowEl;
  }
  const rowEl = el('div', row.emphasize ? 'entity-card-row entity-card-row-emphasis' : 'entity-card-row');
  if (row.icon) {
    const iconEl = el('span', 'entity-card-row-icon');
    iconEl.setAttribute('aria-hidden', 'true');
    // SVG wstawiany jako markup (nie .textContent) — wzorem `iconTile()` w
    // `techDiscoveryNotice.ts:148-152` i medalionu karty (`buildMedallionEl` niżej).
    iconEl.innerHTML = row.icon.svg;
    rowEl.appendChild(iconEl);
  }
  const key = el('span', 'entity-card-row-key');
  key.textContent = row.label;
  const val = el(row.linkTo ? 'button' : 'span', 'entity-card-row-value');
  val.textContent = row.value;
  if (row.linkTo) {
    val.setAttribute('data-entity-kind', row.linkTo.kind);
    val.setAttribute('data-entity-id', row.linkTo.id);
  }
  rowEl.append(key, val);
  if (row.trailing) {
    const trailingEl = el('span', 'entity-card-row-trailing');
    trailingEl.textContent = row.trailing;
    rowEl.appendChild(trailingEl);
  }
  return rowEl;
}

/** Buduje jedną pigułkę w trybie `layout: 'pills'` — wzorem `tdn-req-pill` w
 * `techDiscoveryNotice.ts:435-438` (checkmark trailing, `row.label` jako tekst). */
function buildPillRowEl(row: EntityCardData['sections'][number]['rows'][number]): HTMLElement {
  const pill = el('span', 'entity-card-pill');
  const text = el('span', 'entity-card-pill-text');
  text.textContent = row.label;
  const check = el('b', 'entity-card-pill-check');
  check.textContent = '✓';
  pill.append(text, check);
  return pill;
}

/** Buduje jedną sekcję karty — akordeon (jeśli `collapsible`), layout grid/pills,
 * paginacja `previewLimit`, badge listy płaskiej na dole (bez zmian z T1). `cardEl`
 * jest potrzebny wyłącznie do sprzężenia „Pokaż pozostałe N" z
 * `EntityCardData.compactHeaderOnExpand` (patrz `types.ts`). */
function buildSectionEl(
  section: EntityCardData['sections'][number],
  cardEl: HTMLElement,
  compactHeaderOnExpand: boolean,
): HTMLElement {
  const sectionEl = el('section', 'entity-card-section');
  sectionEl.setAttribute('data-section-key', section.key);
  if (section.highlighted) sectionEl.classList.add('entity-card-section--hi');

  const heading = el('h3', 'entity-card-section-heading');
  const headingLabel = el('span', 'entity-card-section-heading-label');
  headingLabel.textContent = section.title;
  heading.appendChild(headingLabel);

  const layout = section.layout ?? 'grid';
  const grid = el('div', layout === 'pills' ? 'entity-card-section-pills' : 'entity-card-section-grid');
  const previewLimit = section.previewLimit;
  const showAll = previewLimit == null || previewLimit >= section.rows.length;
  const visibleRows = showAll ? section.rows : section.rows.slice(0, Math.max(0, previewLimit));
  const hiddenRows = showAll ? [] : section.rows.slice(Math.max(0, previewLimit));
  for (const row of visibleRows) {
    grid.appendChild(layout === 'pills' ? buildPillRowEl(row) : buildGridRowEl(row));
  }
  let restEl: HTMLElement | null = null;
  let moreBtn: HTMLButtonElement | null = null;
  if (hiddenRows.length > 0) {
    restEl = el('div', layout === 'pills' ? 'entity-card-section-pills' : 'entity-card-section-grid');
    restEl.hidden = true;
    for (const row of hiddenRows) {
      restEl.appendChild(layout === 'pills' ? buildPillRowEl(row) : buildGridRowEl(row));
    }
    moreBtn = el('button', 'entity-card-more');
    moreBtn.type = 'button';
    moreBtn.textContent = `Pokaż pozostałe ${hiddenRows.length}`;
    moreBtn.setAttribute('data-more-section', section.key);
  }

  if (section.collapsible) {
    const open = section.openDefault !== false;
    sectionEl.setAttribute('data-open', open ? '1' : '0');
    const headBtn = el('button', 'entity-card-section-head');
    headBtn.type = 'button';
    headBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    headBtn.appendChild(headingLabel);
    const chevron = el('span', 'entity-card-section-chevron');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = open ? '▾' : '▸';
    headBtn.appendChild(chevron);
    sectionEl.appendChild(headBtn);
    const bodyEl = el('div', 'entity-card-section-body');
    bodyEl.hidden = !open;
    bodyEl.appendChild(grid);
    if (restEl) bodyEl.appendChild(restEl);
    if (moreBtn) bodyEl.appendChild(moreBtn);
    sectionEl.appendChild(bodyEl);
    headBtn.addEventListener('click', () => {
      const nowOpen = sectionEl.getAttribute('data-open') !== '1';
      sectionEl.setAttribute('data-open', nowOpen ? '1' : '0');
      headBtn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      chevron.textContent = nowOpen ? '▾' : '▸';
      bodyEl.hidden = !nowOpen;
    });
  } else {
    sectionEl.appendChild(heading);
    sectionEl.appendChild(grid);
    if (restEl) sectionEl.appendChild(restEl);
    if (moreBtn) sectionEl.appendChild(moreBtn);
  }

  if (moreBtn && restEl) {
    const btn = moreBtn;
    const rest = restEl;
    btn.addEventListener('click', () => {
      rest.hidden = false;
      btn.hidden = true;
      if (compactHeaderOnExpand) cardEl.classList.add('entity-card--compact');
    });
  }

  if (section.badges && section.badges.length > 0) {
    const badgeRow = el('div', 'entity-card-row entity-card-row-badges');
    const badges = el('div', 'entity-card-badges');
    for (const b of section.badges) {
      const badge = el('span', 'entity-card-badge');
      badge.textContent = b;
      badges.appendChild(badge);
    }
    badgeRow.appendChild(badges);
    sectionEl.appendChild(badgeRow);
  }
  return sectionEl;
}

function buildMedallionEl(data: EntityCardData): HTMLElement {
  const slot = el('div', 'entity-card-medallion');
  if (data.medallion.kind === 'icon') {
    slot.innerHTML = data.medallion.svg;
  }
  return slot;
}

/** Jeden DOM-builder dla wszystkich 4 kinds — buduje kartę z `EntityCardData` już
 * gotowego (adapter zebrał dane, renderer wyłącznie buduje DOM, zgodnie z ECHO Q1=B). */
export function renderEntityCard(data: EntityCardData): HTMLElement {
  const card = el('div', `entity-card entity-card-${data.kind}`);
  card.setAttribute('data-entity-kind', data.kind);
  card.setAttribute('data-entity-id', data.id);

  const header = el('div', 'entity-card-header');
  const medallionEl = buildMedallionEl(data);
  header.appendChild(medallionEl);

  const titleWrap = el('div', 'entity-card-title-wrap');
  const titleRow = el('div', 'entity-card-title-row');
  const h2 = el('h2');
  h2.textContent = data.title;
  titleRow.appendChild(h2);
  if (data.statusBadges && data.statusBadges.length > 0) {
    for (const status of data.statusBadges) {
      const badge = el('span', 'entity-card-status-badge');
      badge.textContent = status;
      titleRow.appendChild(badge);
    }
  }
  titleWrap.appendChild(titleRow);
  if (data.subtitle) {
    const sub = el('div', 'entity-card-subtitle');
    sub.textContent = data.subtitle;
    titleWrap.appendChild(sub);
  }
  header.appendChild(titleWrap);
  card.appendChild(header);

  const body = el('div', 'entity-card-body');
  for (const section of data.sections) {
    if (section.rows.length === 0 && (!section.badges || section.badges.length === 0)) continue;
    const sectionEl = buildSectionEl(section, card, data.compactHeaderOnExpand === true);
    body.appendChild(sectionEl);
  }
  card.appendChild(body);

  if (data.civpediaLink) {
    const link = data.civpediaLink;
    const footer = el('div', 'entity-card-footer');
    const btn = el('button', 'entity-card-civpedia-link');
    btn.type = 'button';
    btn.textContent = 'Więcej informacji (Civpedia)';
    btn.setAttribute('data-civpedia-folder', link.folder);
    btn.setAttribute('data-civpedia-slug', link.slug);
    footer.appendChild(btn);
    card.appendChild(footer);
  }

  if (data.actions && data.actions.length > 0) {
    const actionsEl = el('div', 'entity-card-actions');
    for (const action of data.actions) {
      const btn = el('button', `entity-card-action entity-card-action-${action.kind}`);
      btn.type = 'button';
      btn.textContent = action.label;
      btn.setAttribute('data-action-id', action.id);
      btn.addEventListener('click', action.onClick);
      actionsEl.appendChild(btn);
    }
    card.appendChild(actionsEl);
  }

  if (data.medallion.kind === 'unit3d') {
    // Musi być wywołane PO appendChild sekcji medalionu w DOM (patrz plan §7.1 /
    // `unitInfoCard.ts:150-162`) — inaczej Three.js dostaje odłączony element.
    data.medallion.mount(medallionEl);
  }

  return card;
}

function openDialog(data: EntityCardData): EntityCardDismiss {
  const overlayId = `entity-card-${data.kind}-${data.id}-${overlaySeq++}`;
  const backdrop = el('div', 'entity-card-backdrop');
  const dialog = el('div', 'entity-card-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-label', data.title);
  let closed = false;
  const dismiss = (): void => {
    if (closed) return;
    closed = true;
    popOverlay(overlayId);
    backdrop.remove();
  };
  const card = renderEntityCard(data);
  dialog.appendChild(card);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) dismiss();
  });
  pushOverlay(overlayId, dismiss);
  return dismiss;
}

function openInline(data: EntityCardData, container: HTMLElement): EntityCardDismiss {
  const card = renderEntityCard(data);
  container.appendChild(card);
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    card.remove();
  };
}

/**
 * Tryb `hover` (T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA) — doczepia się do
 * `attachHoverDetail(anchor, buildContent, 220, 'left')` (`hoverDetailDock.ts`) zamiast
 * backdropu (`dialog`) czy natychmiastowego appendChild (`inline`). `opts.container` jest
 * tu REUŻYTY jako punkt zaczepienia hover (anchor — np. wiersz listy budynków), NIE jako
 * cel natychmiastowego montażu — `EntityCardCtx`/`OpenEntityCardOptions` (`types.ts`) nie
 * mają osobnego pola `anchor`, a `types.ts` jest poza allowlistą T5; `container` już
 * istnieje w kontrakcie i pasuje semantycznie („element HTML powiązany z otwarciem karty").
 *
 * KRYTYCZNE dla wydajności hover (wymóg dispatchu T5): `buildEntityCardData`/
 * `renderEntityCard` są wołane DOPIERO wewnątrz callbacku `attachHoverDetail` — czyli
 * DOPIERO gdy użytkownik faktycznie najedzie (po `delayMs`), identycznie jak dzisiejsze
 * `attachHoverDetail(row, () => buildXDetailCard(...), ...)` w `cityPanel.ts` — zero
 * kosztu przy samym wywołaniu `openEntityCard(..., {mode:'hover'})` (tylko rejestracja
 * listenerów mouseenter/mouseleave).
 */
function openHover(kind: EntityKind, id: string, ctx: EntityCardCtx, anchor: HTMLElement): EntityCardDismiss {
  attachHoverDetail(anchor, () => {
    const data = buildEntityCardData(kind, id, ctx);
    if (data == null) {
      // eslint-disable-next-line no-console
      console.warn(`[entityCards] openEntityCard(hover): brak encji ${kind}/${id}`);
      return el('div', 'entity-card-hover-empty');
    }
    return renderEntityCard(data);
  }, 220, 'left');
  // `attachHoverDetail` nie oferuje dziś odłączenia własnych listenerów (ten sam brak co
  // wszystkie dzisiejsze wywołania w `cityPanel.ts`) — dismiss() jest tu no-op, spójnie z
  // resztą kodu bazowego, nie regresja wprowadzona przez `openEntityCard`.
  return () => {};
}

/**
 * `openEntityCard(kind, id, opts)` — punkt wejścia publiczny. `dialog`/`inline` w pełni
 * zaimplementowane od T1; `hover` dochodzi w T5 (patrz `openHover` wyżej).
 * Zwraca `dismiss()`. Zwraca funkcję no-op jeśli encja nie istnieje (resolver null) —
 * WYJĄTEK: w trybie `hover` istnienie encji jest sprawdzane DOPIERO przy faktycznym
 * hoverze (patrz `openHover`), więc ta wczesna gałąź go nie dotyczy.
 */
export function openEntityCard(kind: EntityKind, id: string, opts: OpenEntityCardOptions = {}): EntityCardDismiss {
  const mode = opts.mode ?? 'dialog';
  if (mode === 'hover') {
    if (!opts.container) {
      throw new Error('openEntityCard: mode "hover" wymaga opts.container jako punktu zaczepienia (anchor)');
    }
    return openHover(kind, id, opts.ctx ?? {}, opts.container);
  }
  const data = buildEntityCardData(kind, id, opts.ctx ?? {});
  if (data == null) {
    // eslint-disable-next-line no-console
    console.warn(`[entityCards] openEntityCard: brak encji ${kind}/${id}`);
    return () => {};
  }
  if (mode === 'inline') {
    if (!opts.container) throw new Error('openEntityCard: mode "inline" wymaga opts.container');
    return openInline(data, opts.container);
  }
  return openDialog(data);
}

export const ENTITY_CARD_CSS = `
.entity-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:center;
  justify-content:center;padding:16px;background:rgba(0,0,0,.62);}
.entity-card-dialog{position:relative;max-height:calc(100vh - 32px);overflow:auto;}
.entity-card{width:min(434px,calc(100vw - 32px));border:1px solid rgba(232,216,138,.45);
  border-radius:12px;background:linear-gradient(180deg,rgba(20,26,34,.99),rgba(8,10,16,.99));
  color:#e8e0c8;box-shadow:0 10px 28px rgba(0,0,0,.65);overflow:hidden;
  font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);}
.entity-card-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;
  background:rgba(232,216,138,.06);border-bottom:1px solid rgba(232,216,138,.18);}
.entity-card-medallion{width:34px;height:34px;flex:none;}
.entity-card-title-wrap{min-width:0;flex:1;}
.entity-card-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.entity-card h2{margin:0;font:600 17px/1.15 Georgia,'Times New Roman',serif;}
.entity-card-subtitle{opacity:.75;font-size:12px;margin-top:2px;}
.entity-card-body{padding:10px 14px;}
.entity-card-section{margin-bottom:10px;}
.entity-card-section h3{margin:0 0 4px;font-size:13px;opacity:.8;}
.entity-card-row{display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:2px 0;}
.entity-card-row-emphasis{font-weight:600;}
.entity-card-row-icon{width:15px;height:15px;flex:none;display:flex;align-items:center;
  justify-content:center;opacity:.9;}
.entity-card-row-trailing{opacity:.7;font-size:12px;}
.entity-card-row-action{display:flex;align-items:center;gap:8px;font-size:13px;padding:2px 0;}
.entity-card-row-action-text{flex:1;}
.entity-card-row-badge{border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;
  flex:none;}
.entity-card-row-badge--ok{background:rgba(120,200,120,.18);color:#9fe39f;}
.entity-card-row-badge--warn{background:rgba(230,180,90,.18);color:#e6c07a;}
.entity-card-row-badge--muted{background:rgba(180,180,180,.14);color:#b8b8b8;}
/* R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 T4 runda 2: brakujący styl dla section.badges
   (kontener .entity-card-badges + pojedyncza .entity-card-badge) — istniał od T1, ale zero
   kart do tej pory renderowało >=2 odznak na raz, więc luka pozostawała niewidoczna aż do
   karty jednostki (sekcja „Statusy"), gdzie odznaki bez tego stylu sklejały się w jeden
   nieczytelny ciąg tekstu bez odstępu. Ta sama, neutralna pigułka co .entity-card-row-badge
   (bez wariantu koloru — section.badges to zwykłe stringi, nie {kind,label}). */
.entity-card-badges{display:flex;flex-wrap:wrap;gap:6px;}
.entity-card-badge{border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;
  flex:none;background:rgba(232,216,138,.14);color:#e0d4a0;}
.entity-card-section--hi{background:rgba(232,216,138,.07);border-radius:8px;padding:6px 8px;
  margin-left:-8px;margin-right:-8px;}
.entity-card-section-head{display:flex;align-items:center;gap:6px;width:100%;
  background:none;border:0;padding:0;margin:0 0 4px;color:inherit;font:inherit;
  cursor:pointer;text-align:left;}
.entity-card-section-heading{margin:0 0 4px;font-size:13px;opacity:.8;}
.entity-card-section-heading-label{flex:1;}
.entity-card-section-chevron{opacity:.7;}
.entity-card-section-body{}
.entity-card-section-pills{display:flex;flex-wrap:wrap;gap:6px;}
.entity-card-pill{display:inline-flex;align-items:center;gap:4px;border-radius:999px;
  padding:2px 10px;font-size:12px;background:rgba(232,216,138,.1);
  border:1px solid rgba(232,216,138,.25);}
.entity-card-pill-check{color:#9fe39f;}
.entity-card-more{display:block;width:100%;text-align:left;background:none;border:0;
  color:inherit;font:inherit;opacity:.8;cursor:pointer;padding:2px 0;}
.entity-card--compact .entity-card-medallion{width:24px;height:24px;}
.entity-card-footer{padding:8px 14px;border-top:1px solid rgba(232,216,138,.18);}
.entity-card-actions{display:flex;gap:8px;padding:10px 14px;border-top:1px solid rgba(232,216,138,.18);}
`;
