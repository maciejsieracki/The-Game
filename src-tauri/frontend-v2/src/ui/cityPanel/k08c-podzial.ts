/**
 * K08C-2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 2, partia `podzial`): karta „Podział pracy" (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — `renderPodzialPracy` (suwak Budynki/Pula + `appendPodzialPracyInfo` z K06B).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08c-port.mjs --batch podzial` (bloki = pin, `k08c-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08c-copies.mjs`.
 * Stałe i pomocnicze z `k08c-deps.ts` (granice 50..100 z pinu `game/cities.ts:456-457`).
 */

import { cityPanelChipIconWrap, cpInlineIcons } from './k01a-fundament';
import { el } from './k01b-dom';
import { appendIndywidualneToggle, cfg, isMeCity, rerender, HANDEL_PCT_STEP, type City, type GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import { PULA_LBL, PULA_LBL_PELNA } from './k01b-t';
import { appendSectionTitleWithDetails } from './k08b-title';
import { appendPodzialPracyInfo } from './k06b-jednostki';
import { buildPracaDetailCard } from './k08c-praca';
import {
  MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, MAX_PROCENT_PULI_IMPERIUM, MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
  cityPracaSplit, clampPodzialPracyBudynkiPercent, procentPuliImperiumZBudynkow, readPodzialPracy,
} from './k08c-deps';

// ─── Jednostki K08C, partia k08c-podzial.ts (kopie pinu wygenerowane; markery = bramka verify-k08c-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:5112-5188
export function renderPodzialPracy(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  data: GameData | null,
): void {
  if (!cfg.onPodzialPracyChange) return;
  mount.innerHTML = '';
  appendSectionTitleWithDetails(mount, '<span>Podział pracy</span>', () => buildPracaDetailCard(city, view, data));
  const pctCfg = readPodzialPracy(city, data);
  const praca = view ? cityPracaSplit(city, view, data) : null;
  const pctB = praca?.pctBudynki ?? pctCfg.procentBudynki;
  const pctU = praca?.pctPuli ?? procentPuliImperiumZBudynkow(pctB);
  const player = isMeCity(city.ownerId);
  // R-PRACA-JEDEN-PODZIAL-Q1 pkt 5: suwak NIE jest zablokowany. Ustawia lokalna
  // wartosc; gdy rozni sie od globalnej, „Indywidualne" zapala sie SAMO, a powrot do
  // wartosci globalnej je gasi (logika: `applyCityPodzialPracyChange` w main.ts).
  const podzialTip = `Podział przyrostu Pracy tego miasta: Budynki ${MIN_PODZIAL_PRACY_BUDYNKI_PERCENT}–100%, `
    + `${PULA_LBL_PELNA} 0–${MAX_PROCENT_PULI_IMPERIUM}% — zawsze razem 100%. Kroki co ${HANDEL_PCT_STEP}%. `
    + 'Ustawienie inne niż globalne włącza „Indywidualne" samo; powrót do globalnego je gasi.';

  // Sygnał na samej górze: ile z tegorocznego przyrostu Pracy trafia do Ulepszeń.
  const summary = el('div', 'praca-split-summary');
  summary.innerHTML = `${cityPanelChipIconWrap('chip-crate', 16)} ${PULA_LBL_PELNA} <b>${pctU}%</b>`
    // P-PRACA-PANEL-EMOJI-ZAMIAST-IKON-Q1: ten string jest sklejany wprost do `innerHTML`,
    // z pominięciem `cpInlineIcons()` — literalny 🔨 docierał do gracza jako goły glif.
    // Ikona wstawiana tak samo jak w sąsiednich liniach tej samej funkcji (kolumny
    // Budynki/Ulepszenia niżej), żeby nie wprowadzać trzeciego wzorca.
    + (praca ? ` <span class="muted" style="font-weight:400">(+${praca.doPuli} ${cityPanelChipIconWrap('res-work', 13)}/turę)</span>` : '');
  mount.appendChild(summary);

  const sliderWrap = el('div', 'praca-w4-sliders');

  const cols = el('div', 'praca-split-cols');
  const colBud = el('div', 'praca-split-col left');
  colBud.innerHTML = `<div class="praca-split-col-lbl">${cityPanelChipIconWrap('cp-buildings', 13)} Budynki</div>`
    + `<b>${pctB}%${praca ? ` · +${praca.doBudynkow}` : ''}</b>`;
  const colUle = el('div', 'praca-split-col right');
  colUle.innerHTML = `<div class="praca-split-col-lbl">${cityPanelChipIconWrap('chip-crate', 13)} ${PULA_LBL}</div>`
    + `<b>${pctU}%${praca ? ` · +${praca.doPuli}` : ''}</b>`;
  cols.appendChild(colBud);
  cols.appendChild(colUle);
  sliderWrap.appendChild(cols);

  if (player) {
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = String(MIN_PODZIAL_PRACY_BUDYNKI_PERCENT);
    inp.max = String(MAX_PODZIAL_PRACY_BUDYNKI_PERCENT);
    inp.step = String(HANDEL_PCT_STEP);
    inp.value = String(pctB);
    inp.setAttribute('aria-label', 'Podział przyrostu Pracy tego miasta: budynki versus ulepszenia (pula imperium)');
    inp.title = podzialTip;
    inp.addEventListener('input', () => {
      const v = clampPodzialPracyBudynkiPercent(Number(inp.value));
      cfg.onPodzialPracyChange?.(city.id, { procentBudynki: v });
      rerender();
    });
    sliderWrap.appendChild(inp);
  } else {
    const ro = el('div', 'muted');
    ro.style.cssText = 'font-size:0.68em;margin-top:0.06em;';
    ro.textContent = 'Tylko podgląd (miasto rywala).';
    sliderWrap.appendChild(ro);
  }
  if (player && cfg.onPodzialPracyOverrideToggle) {
    appendIndywidualneToggle(
      sliderWrap,
      cfg.getPodzialPracyOverride?.(city.id) === true,
      () => cfg.onPodzialPracyOverrideToggle?.(city.id),
      'indywidualne-row-praca',
    );
  }
  mount.appendChild(sliderWrap);

  appendPodzialPracyInfo(mount, city, view, data);
}
// pin-end
