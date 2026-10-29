// P5.8 K02 (runda 3, partia 1 z 3): jednostki K02 z gra/src/ui/cityPanel.ts @ edb8fb56 (pin):
//   fillIconElement (6410), makeMiniThumb (6415), createScrollList (6443), appendTabIndicators (4236),
//   appendSurowceGrid (3645), appendIndywidualneToggle (4608).
// Kopie 1:1 tresci; zmiany wymuszone zaleznosciami w gore (ZALOZENIE P5.8-K02-R3-Z1..Z3):
//   Z1: resourceBrandIconHtml (pin:3788, K01/brand) przekazywane jako argument `brandIconHtml` (appendSurowceGrid).
//   Z2: module-level rerender() (pin) przekazywane jako argument `rerender` (appendIndywidualneToggle).
//   Z3: statChip (pin:4222) i stala LIST_ROW_HEIGHT_EM (pin:1773) skopiowane lokalnie (prywatne w pinie i w K01).
// Lokalny `el` bez parametru `html`: wszystkie wywolania w tych jednostkach maja tag i klase (jak w k02-breakdown.ts).
import type { BreakdownLine, TabIndicatorChip } from './types';
import { appendBreakdownLines } from './k02-breakdown';

const LIST_ROW_HEIGHT_EM = 2.75;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function statChip(icon: string, label: string, value: string, cls: string): string {
  const iconPart = icon.startsWith('<')
    ? `<span class="civ-cs-chip-ic-wrap">${icon}</span>`
    : icon;
  const head = iconPart ? `${iconPart}<span>${label}</span>` : label;
  return `<span class="chip"><span class="cl">${head}</span><span class="cv ${cls}">${value}</span></span>`;
}

export function fillIconElement(el: HTMLElement, iconHtml: string): void {
  if (iconHtml.startsWith('<svg')) el.innerHTML = iconHtml;
  else if (iconHtml) el.textContent = iconHtml;
}

export function makeMiniThumb(iconHtml: string): HTMLDivElement {
  const t = el('div', 'mini-thumb');
  fillIconElement(t, iconHtml);
  return t;
}

export function createScrollList(
  className = 'list-scroll',
  opts?: { visible?: number; rowEm?: number; fill?: boolean },
): HTMLDivElement {
  const sc = el('div', className);
  if (opts?.fill) {
    sc.classList.add('list-scroll-fill');
  } else if (opts?.visible != null) {
    const rowH = opts.rowEm ?? LIST_ROW_HEIGHT_EM;
    sc.style.maxHeight = `calc(${opts.visible} * ${rowH}em)`;
    sc.style.overflowY = 'auto';
    sc.style.overflowX = 'hidden';
    sc.style.scrollbarWidth = 'thin';
    sc.style.paddingRight = '0.1em';
  }
  return sc;
}

export function appendTabIndicators(mount: HTMLElement, chips: TabIndicatorChip[]): void {
  if (chips.length === 0) return;
  const row = el('div', 'chip-row civ-tab-indicators');
  row.innerHTML = chips.map(c => {
    const chipHtml = statChip(c.icon, c.label, c.value, c.cls ?? '');
    if (!c.title) return chipHtml;
    return chipHtml.replace('<span class="chip">', `<span class="chip" title="${c.title.replace(/"/g, '&quot;')}">`);
  }).join('');
  mount.appendChild(row);
}

export function appendSurowceGrid(
  parent: HTMLElement,
  labels: string[],
  mode: 'active' | 'potential',
  brandIconHtml: (nazwa: string) => string,
): void {
  if (labels.length === 0) return;
  const grid = el('div', 'civ-w4-surowce-grid');
  for (const nazwa of labels) {
    const row = el('span', `civ-w4-surowce-item ${mode}`);
    row.title = mode === 'active'
      ? `${nazwa} — dostęp aktywny (ulepszenie / bramka spełniona)`
      : `${nazwa} — złoże w zasięgu (potencjał — zbuduj ulepszenie)`;
    row.innerHTML = `${brandIconHtml(nazwa)}<span>${nazwa}</span>`;
    grid.appendChild(row);
  }
  parent.appendChild(grid);
}

export function appendIndywidualneToggle(
  mount: HTMLElement,
  overrideOn: boolean,
  onToggle: () => void,
  rowCls: string,
  rerender: () => void,
): void {
  const row = el('div', 'slider-row ' + rowCls);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hbtn indywidualne-btn';
  btn.textContent = 'Indywidualne';
  btn.classList.add(overrideOn ? 'active' : 'off');
  btn.dataset.stan = overrideOn ? 'wl' : 'wyl';
  btn.setAttribute('aria-pressed', String(overrideOn));
  btn.title = overrideOn
    ? 'WŁ: to miasto ma własne ustawienie — ignoruje zmiany globalne z panelu cywilizacji (mapa świata).'
    : 'WYŁ: to miasto dziedziczy globalne ustawienie imperium (panel cywilizacji na mapie świata, np. „Grecy").';
  row.appendChild(btn);
  btn.addEventListener('click', () => {
    onToggle();
    rerender();
  });
  mount.appendChild(row);
}

// --- P5.8 K02 r3, partia 2 (pin:4560, 4538, 6415-6442) ---
// Z4: funkcje ikon (buildingIconHtml / productionItemIconHtml, pin:6400+) przyjmuja gotowy iconHtml
//     zamiast definicji/danych (wywolujacy liczy ikone; zaleznosc w gore jako dana, ZALOZENIE P5.8-K02-R3-Z4).
// Z5: appendCitizenUpkeepBlock przyjmuje wyliczone wiersze i podpis (citizenUpkeepDisplayLines,
//     stockResourceLabel, pctSubheadHtml sa zalezne od K01/brand); `hasRequired` = !!upkeep && required.length>0.

/** Pasek procentowy W4 v2 (pin:4560) — kopia 1:1; appendBreakdownLines z ./k02-breakdown. */
export function appendW4PctMetricBlock(
  mount: HTMLElement,
  titleHtml: string,
  pct: number | undefined,
  barGradient: string,
  lines: BreakdownLine[] | undefined,
  emptyHint: string,
  afterBar?: (block: HTMLElement) => void,
  pointsLabel?: string,
): void {
  const block = el('div', 'civ-breakdown-block civ-w4-metric');
  const sub = el('div', 'civ-w4-subhd');
  if (pct != null) {
    const ptsHtml = pointsLabel
      ? `<span class="civ-w4-subhd-pts">${pointsLabel}</span>`
      : '';
    sub.innerHTML = `${titleHtml}<span class="civ-w4-subhd-pct">${Math.round(pct)}%${ptsHtml}</span>`;
  } else if (titleHtml.includes('<')) {
    sub.innerHTML = titleHtml;
  } else {
    sub.textContent = titleHtml;
  }
  block.appendChild(sub);
  if (pct != null) {
    const barWrap = el('div', 'civ-w4-pct-bar');
    const fill = el('div', 'civ-w4-pct-fill');
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    fill.style.background = barGradient;
    barWrap.appendChild(fill);
    block.appendChild(barWrap);
  }
  if ((lines && lines.length > 0) || emptyHint) {
    appendBreakdownLines(block, lines, emptyHint);
  }
  if (afterBar) afterBar(block);
  mount.appendChild(block);
}

/** Blok „Zaopatrzenie obywateli" (pin:4538) — wiersze i podpis policzone przez wywolujacego (Z5). */
export function appendCitizenUpkeepBlock(
  mount: HTMLElement,
  hasRequired: boolean,
  lines: BreakdownLine[],
  subheadHtml: string,
): void {
  if (!hasRequired) return;
  appendW4PctMetricBlock(
    mount,
    subheadHtml,
    undefined,
    'linear-gradient(90deg,#3a8a5a,#7ad0a0)',
    lines,
    'Brak surowców wymaganych przez obywateli w tej epoce.',
  );
}

export function makeBuildingThumb(iconHtml: string): HTMLDivElement {
  return makeMiniThumb(iconHtml);
}

export function appendBuildingInlineIcon(parent: HTMLElement, iconHtml: string): void {
  const bi = el('span', 'bi');
  fillIconElement(bi, iconHtml);
  parent.appendChild(bi);
}

export function appendProductionPicon(parent: HTMLElement, iconHtml: string): void {
  const iconEl = el('div', 'picon');
  fillIconElement(iconEl, iconHtml);
  parent.appendChild(iconEl);
}

export function productionQueueIconSpan(iconHtml: string): HTMLElement {
  const s = el('span');
  fillIconElement(s, iconHtml);
  return s;
}
