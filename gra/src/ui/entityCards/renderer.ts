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
    const sectionEl = el('section', 'entity-card-section');
    sectionEl.setAttribute('data-section-key', section.key);
    const heading = el('h3');
    heading.textContent = section.title;
    sectionEl.appendChild(heading);

    const grid = el('div', 'entity-card-section-grid');
    for (const row of section.rows) {
      const rowEl = el('div', row.emphasize ? 'entity-card-row entity-card-row-emphasis' : 'entity-card-row');
      const key = el('span', 'entity-card-row-key');
      key.textContent = row.label;
      const val = el(row.linkTo ? 'button' : 'span', 'entity-card-row-value');
      val.textContent = row.value;
      if (row.linkTo) {
        val.setAttribute('data-entity-kind', row.linkTo.kind);
        val.setAttribute('data-entity-id', row.linkTo.id);
      }
      rowEl.append(key, val);
      grid.appendChild(rowEl);
    }
    sectionEl.appendChild(grid);

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
 * `openEntityCard(kind, id, opts)` — punkt wejścia publiczny. T1: `dialog` w pełni
 * zaimplementowany; `inline` zaimplementowany minimalnie (bez hover-timera, T5
 * dopełnia); `hover` — rzuca (jeszcze nieobsłużony, patrz T5).
 * Zwraca `dismiss()`. Zwraca funkcję no-op jeśli encja nie istnieje (resolver null).
 */
export function openEntityCard(kind: EntityKind, id: string, opts: OpenEntityCardOptions = {}): EntityCardDismiss {
  const mode = opts.mode ?? 'dialog';
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
  if (mode === 'hover') {
    throw new Error('openEntityCard: mode "hover" nie jest jeszcze obsługiwany (T5)');
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
.entity-card-footer{padding:8px 14px;border-top:1px solid rgba(232,216,138,.18);}
.entity-card-actions{display:flex;gap:8px;padding:10px 14px;border-top:1px solid rgba(232,216,138,.18);}
`;
