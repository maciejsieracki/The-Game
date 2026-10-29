/**
 * K08D-4a (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 4, partia `wealth-pasek`): pasek zamożności „W" i jego tooltip
 * z pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) — `appendWealthCompactStrip` (:4247-4304) i `buildWealthCompactTooltipCard`
 * (:4307-4350). Czysto prezentacyjne: wszystkie liczby wchodzą w `opts` (liczy je karta/renderer z delegatów K08D).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08d-port.mjs --batch wealth-pasek` (bloki = pin, `k08d-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08d-copies.mjs`.
 */

import { el, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import { cityPanelChipIconWrap, tury } from './k01a-fundament';
import { attachHoverDetail } from '../hoverDetailDock';

// ─── Jednostki K08D, partia k08d-wealth-pasek.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:4247-4304
export function appendWealthCompactStrip(
  mount: HTMLElement,
  opts: {
    poziom: number;
    atCap: boolean;
    cap: number;
    epoch: number;
    mnoz: number;
    szBonus: number;
    pula: number;
    prog: number;
    pct: number;
    etaW: number | null;
    zamIn: number;
    daninaLblGen: string;
  },
): void {
  const wrap = el('div', 'wealth-compact-wrap');
  const badges = el('div', 'wealth-compact-badges');
  const mkStat = (html: string, cls: string) => {
    const s = el('span', `wealth-compact-stat ${cls}`.trim());
    s.innerHTML = html;
    return s;
  };
  const nextW = opts.poziom + 1;
  const mnozTxt = opts.mnoz.toFixed(2).replace('.', ',');

  badges.appendChild(mkStat(`<b>W${opts.poziom}</b>`, 'wealth-w'));
  badges.appendChild(mkStat(
    `${cityPanelChipIconWrap('res-treasury', 14)}<b>×${mnozTxt}</b>`,
    'wealth-mnoz',
  ));
  const szStat = mkStat(cityPanelChipIconWrap('chip-happiness', 14), 'wealth-happy');
  szStat.setAttribute('aria-label', `Szczęście z zamożności ${opts.szBonus >= 0 ? '+' : ''}${Math.round(opts.szBonus)}`);
  badges.appendChild(szStat);
  wrap.appendChild(badges);

  const track = el('div', 'food-grow-track wealth-compact-bar');
  const barLabel = opts.atCap ? `W${opts.poziom} — MAX` : `${Math.round(opts.pula)} / ${Math.round(opts.prog)}`;
  track.innerHTML =
    `<div class="food-grow-fill" style="width:${opts.pct}%"></div>` +
    `<span class="fbtxt">${barLabel}</span>`;
  wrap.appendChild(track);

  if (!opts.atCap && opts.etaW != null) {
    const eta = el('div', 'wealth-compact-eta ok');
    eta.textContent = `Kolejny W${nextW} za ok. ${opts.etaW} ${tury(opts.etaW)}.`;
    wrap.appendChild(eta);
  }

  mount.appendChild(wrap);
  attachHoverDetail(
    wrap,
    () => buildWealthCompactTooltipCard(opts),
    220,
    'left',
  );
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:4307-4350
export function buildWealthCompactTooltipCard(opts: {
  poziom: number;
  atCap: boolean;
  cap: number;
  epoch: number;
  mnoz: number;
  szBonus: number;
  pula: number;
  prog: number;
  etaW: number | null;
  zamIn: number;
  daninaLblGen: string;
}): HTMLDivElement {
  const nextW = opts.poziom + 1;
  const mnozTxt = opts.mnoz.toFixed(2).replace('.', ',');

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Zamożność — szczegóły</span>'));
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Poziom W', opts.atCap
    ? `W${opts.poziom} — maksimum w epoce ${opts.epoch} (limit W${opts.cap})`
    : `W${opts.poziom} (limit W${opts.cap} w epoce ${opts.epoch})`);
  gridDetailRow(g, 'Pula', opts.atCap
    ? 'Pełna — brak kolejnego poziomu w tej epoce'
    : `${Math.round(opts.pula)} / ${Math.round(opts.prog)} 💰 do W${nextW}`);
  gridDetailRow(g, 'Mnożnik skarbca', `×${mnozTxt}${opts.poziom <= 1 ? ' (W1 = bez bonusu)' : ''}`);
  gridDetailRow(g, 'Szczęście', `${opts.szBonus >= 0 ? '+' : ''}${Math.round(opts.szBonus)} (co 10 poziomów W +1)`);

  const note = el('div', 'dc-note');
  if (opts.atCap) {
    note.textContent = `Osiągnięto najwyższą zamożność W${opts.poziom} w epoce ${opts.epoch}.`;
  } else if (opts.zamIn <= 0) {
    note.textContent =
      `Brak wpływu do puli — przesuń suwak „Zamożność” w podziale ${opts.daninaLblGen}, żeby rosnąć do W${nextW}.`;
  } else if (opts.etaW != null) {
    note.textContent =
      `Postęp do W${nextW}: ≈ +${opts.zamIn} 💰/turę trafia do puli z udziału „Zamożność” w ${opts.daninaLblGen}. ` +
      'Nadwyżka puli zostaje po awansie.';
  } else {
    note.textContent = `Cel: W${nextW} — potrzeba ${Math.round(opts.prog)} 💰 w puli.`;
  }
  card.appendChild(note);
  return card;
}
// pin-end
