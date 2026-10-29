/**
 * K03 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K03-Q1, runda 1): prymitywy kart szczegolow (sekcja B/R pinu),
 * 1:1 z `gra/src/ui/cityPanel.ts` (pin edb8fb56): `beginBuildingDetailTile` (:7349), `appendDetailGridIn`
 * (:7360), `appendDetailGrid` (:7366), `appendDetailFormula` (:7391). Zero zmian logiki (czysta prezentacja).
 */
import { el } from './k01b-dom';
import { cpInlineIcons } from './k01a-fundament';

/** Pin :7349-7358. Zwraca kontener `bd` karty kafla. */
export function beginBuildingDetailTile(card: HTMLElement, title: string): HTMLElement {
  const tile = el('div', 'bld-detail-tile');
  const hd = el('div', 'bld-detail-tile-hd');
  hd.innerHTML = cpInlineIcons(title);
  tile.appendChild(hd);
  const bd = el('div', 'bld-detail-tile-bd');
  tile.appendChild(bd);
  card.appendChild(tile);
  return bd;
}

/** Pin :7360-7364. */
export function appendDetailGridIn(parent: HTMLElement): HTMLDivElement {
  const g = el('div', 'dc-grid');
  parent.appendChild(g);
  return g;
}

/** Pin :7366-7370. */
export function appendDetailGrid(card: HTMLElement): HTMLDivElement {
  const g = el('div', 'dc-grid');
  card.appendChild(g);
  return g;
}

/** Pin :7391-7395. */
export function appendDetailFormula(card: HTMLElement, text: string): void {
  const f = el('div', 'dc-formula');
  f.innerHTML = cpInlineIcons(text);
  card.appendChild(f);
}
