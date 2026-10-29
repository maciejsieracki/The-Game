// P5.8 K02 (runda 3, partia 1 z 3): jednostki K02 z gra/src/ui/cityPanel.ts @ edb8fb56 (pin):
//   fillIconElement (6410), makeMiniThumb (6415), createScrollList (6443), appendTabIndicators (4236),
//   appendSurowceGrid (3645), appendIndywidualneToggle (4608).
// Kopie 1:1 tresci; zmiany wymuszone zaleznosciami w gore (ZALOZENIE P5.8-K02-R3-Z1..Z3):
//   Z1: resourceBrandIconHtml (pin:3788, K01/brand) przekazywane jako argument `brandIconHtml` (appendSurowceGrid).
//   Z2: module-level rerender() (pin) przekazywane jako argument `rerender` (appendIndywidualneToggle).
//   Z3: statChip (pin:4222) i stala LIST_ROW_HEIGHT_EM (pin:1773) skopiowane lokalnie (prywatne w pinie i w K01).
// Lokalny `el` bez parametru `html`: wszystkie wywolania w tych jednostkach maja tag i klase (jak w k02-breakdown.ts).
import type { TabIndicatorChip } from './types';

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
