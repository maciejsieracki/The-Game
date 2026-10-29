/**
 * K08B-2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 2, partia `title`): nagłówek sekcji z przyciskiem
 * „i szczegóły" (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`): helper `resolveDetailSideHint` + `appendSectionTitleWithDetails`.
 * Jednostki DOM: 1 (`appendSectionTitleWithDetails`, blok 7 w `dyspozycje/rust-port/p5/P5-8-K08B.md` §3).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08b-port.mjs --batch title` (bloki = pin + `k08b-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08b-copies.mjs --batch title`.
 * Zależności: `attachInteractiveDetail` z `ui/hoverDetailDock` (warstwa UI); `el` z `k01b-dom`.
 */

import { attachInteractiveDetail } from '../hoverDetailDock';
import { el } from './k01b-dom';

// ─── Jednostki K08B, partia k08b-title.ts (kopie pinu wygenerowane; markery = bramka verify-k08b-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:11512-11516
export function resolveDetailSideHint(mount: HTMLElement): 'left' | 'right' | 'auto' {
  if (mount.closest('.civ-ux-left')) return 'left';
  if (mount.closest('.civ-ux-right')) return 'right';
  return 'auto';
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11518-11537
export function appendSectionTitleWithDetails(
  mount: HTMLElement,
  titleHtml: string,
  buildDetail: () => HTMLElement,
): void {
  const head = el('div', 'ptitle');
  const left = el('span', '');
  left.innerHTML = titleHtml;
  head.appendChild(left);
  const infoLink = el('button', 'okolica-info-link civ-w4-panel-detail gold');
  infoLink.type = 'button';
  infoLink.textContent = 'i szczegóły';
  infoLink.setAttribute('aria-label', 'Pokaż szczegóły sekcji');
  head.appendChild(infoLink);
  mount.appendChild(head);
  attachInteractiveDetail(infoLink, buildDetail, {
    delayMs: 220,
    sideHint: resolveDetailSideHint(mount),
  });
}
// pin-end
