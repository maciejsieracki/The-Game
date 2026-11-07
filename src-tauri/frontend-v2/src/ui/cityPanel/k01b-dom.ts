/**
 * K01B partia DOM (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 1): 10 jednostek pinu
 * gra/src/ui/cityPanel.ts (edb8fb56) operujacych na elementach DOM (`document`, `HTMLElement`).
 * Tresc = pin po normalizacji (verify-k01b-copies.mjs); import `attachInteractiveDetail` z ui/hoverDetailDock.ts (warstwa UI).
 */
import type { BrandIconSize } from '../icons/brandAssets';
import { attachInteractiveDetail } from '../hoverDetailDock';
import {
  CP_EMOJI_DETECT,
  cpInlineIcons,
  isEmptyDataVal,
  okolicaProfileIconHtml,
} from './k01a-fundament';
import type { CityRefK } from './k01b-dto';

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:922-929
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) {
    n.innerHTML = (cls?.includes('dc-h') || CP_EMOJI_DETECT.test(html)) ? cpInlineIcons(html) : html;
  }
  return n;
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:1934-1938
export function setNoteHtml(note: HTMLElement, html: string): void {
  note.style.fontStyle = 'normal';
  note.innerHTML = cpInlineIcons(html);
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:2017-2024
export function setOkolicaProfileButtonContent(btn: HTMLButtonElement, iconId: string, label: string): void {
  btn.classList.add('okolica-profile-btn');
  const ic = okolicaProfileIconHtml(iconId, 24);
  btn.innerHTML = ic
    ? `<span class="okolica-profile-glyph">${ic}</span><span class="okolica-profile-lbl">${label}</span>`
    : label;
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:2025-2030
export function setOkolicaProfileButtonIconOnly(btn: HTMLButtonElement, iconId: string, size: BrandIconSize = 20): void {
  btn.classList.add('okolica-profile-btn', 'okolica-profile-btn-ic-only');
  const ic = okolicaProfileIconHtml(iconId, size);
  btn.innerHTML = ic ? `<span class="okolica-profile-glyph">${ic}</span>` : '?';
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:3901-3904
export function renderImperiumZywnosc(mount: HTMLElement, _city: CityRefK): void {
  mount.innerHTML = '';
  mount.style.display = 'none';
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:6141-6149
export function attachTopBarStat(
  mount: HTMLElement,
  statId: string,
  build: () => HTMLElement,
  sideHint: 'left' | 'right' = 'right',
): void {
  const node = mount.querySelector(`[data-res-stat="${statId}"]`) as HTMLElement | null;
  if (node) attachInteractiveDetail(node, build, { delayMs: 220, sideHint });
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:6388-6394
export function applyBuildButtonVisualState(btn: HTMLButtonElement, canAct: boolean, title: string): void {
  btn.disabled = !canAct;
  btn.title = title;
  btn.classList.remove('can-build', 'cannot-build');
  btn.classList.add(canAct ? 'can-build' : 'cannot-build');
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:7451-7456
export function appendDetailSection(card: HTMLElement, title: string): void {
  const s = el('div', 'dc-section');
  s.innerHTML = cpInlineIcons(title);
  card.appendChild(s);
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:7481-7489
export function gridDetailRow(grid: HTMLElement, label: string, val: string | null | undefined): void {
  if (!val || isEmptyDataVal(val)) return;
  const lEl = el('span', 'dc-l');
  lEl.innerHTML = cpInlineIcons(label);
  grid.appendChild(lEl);
  const vEl = el('span', 'dc-v');
  vEl.innerHTML = cpInlineIcons(val);
  grid.appendChild(vEl);
}

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:7491-7498
export function appendDetailAlgo(card: HTMLElement, title: string, steps: string[]): void {
  appendDetailSection(card, title);
  for (let i = 0; i < steps.length; i++) {
    const line = el('div', 'dc-algo-step');
    line.innerHTML = cpInlineIcons(`${i + 1}. ${steps[i]}`);
    card.appendChild(line);
  }
}
