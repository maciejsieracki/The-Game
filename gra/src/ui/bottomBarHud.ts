/**
 * bottomBarHud.ts — dolny pasek [I]/[I2]: WYKONAJ + Koniec tury (A1-Q9=A, A1-Q10).
 * WYKONAJ = pierwsze oczekujące wydarzenie; koniec tury zawsze dostępny (Maciej 2026-07-06).
 *
 * R-TRZY-KARTY-WDROZENIE-Q1 runda 2, Karta 3 (2026-08-20): ECHO właściciela pkt 1 — karty
 * decyzyjne NIE blokują „Zakończ turę". canEndTurn()/klikalność end-turn NIE dostają
 * getBlockingCount() > 0 (ani odpowiednika) — patrz render() niżej: showBlockSignal steruje
 * WYŁĄCZNIE wyglądem (rant przerywany + ikona, pasek nad HUD, tooltip) i nigdy klikalnością.
 * data-end zachowuje dokładnie tę samą logikę kliknięcia co przed tą rundą.
 */

import { brandIconSvg } from './icons/brandAssets';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import {
  BOTTOM_BAR_END_TURN_H_PX,
  BOTTOM_BAR_WYKONAJ_H_PX,
  HUD_EDGE_PX,
  HUD_GAP_PX,
  HUD_ZOOM_EDGE_PX,
} from './hudLayout';

export interface BottomBarHudConfig {
  getTurn: () => number;
  getYearLabel?: () => string;
  onExecutePending?: () => void;
  onEndTurn?: () => void;
  /** false tylko gdy playtest / game over (domyślnie true). */
  canEndTurn?: () => boolean;
  /** Liczba oczekujących wydarzeń (do stanu WYKONAJ). */
  getBlockingCount?: () => number;
  /** Ukryj przycisk końca tury (playtest walki). */
  hideEndTurn?: () => boolean;
  /** Nazwy kart blokujących bieżącej tury, w kolejności kolejki (do paska nad HUD i tooltipa).
   * Opcjonalne — bez tego pola pasek/tooltip pokazują liczbę zamiast nazw (patrz
   * blockingHintText/blockingTooltipRows niżej), reszta sygnalizacji działa bez zmian. */
  getBlockingTitles?: () => string[];
}

export interface BottomBarHudApi {
  el: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-bottom-bar-hud-css-w3-block-signal';

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-bottom-bar-hud-css')?.remove();
  document.getElementById('civ-bottom-bar-hud-css-w2')?.remove();
  document.getElementById('civ-bottom-bar-hud-css-w2b')?.remove();
  document.getElementById('civ-bottom-bar-hud-css-w2full')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-bottom-bar{position:fixed;bottom:${HUD_EDGE_PX}px;right:${HUD_EDGE_PX}px;z-index:310;width:200px;height:auto;
  ${CIV_BRAND_SCOPE_VARS}
  background:transparent;border:none;display:flex;flex-direction:column;align-items:stretch;
  padding:0;gap:${HUD_GAP_PX}px;font:12px var(--civ-font-ui);}
html.civ-ui-zoom-active .civ-bottom-bar{bottom:${HUD_ZOOM_EDGE_PX}px;right:${HUD_ZOOM_EDGE_PX}px;}
.civ-bottom-bar .spacer{display:none}
.civ-bottom-bar .wykonaj{height:${BOTTOM_BAR_WYKONAJ_H_PX}px;padding:0 18px;border-radius:9px;font-size:13px;font-weight:600;
  letter-spacing:.16em;text-transform:uppercase;cursor:pointer;width:100%;
  display:flex;align-items:center;justify-content:center;gap:8px;
  border:2px solid rgba(232,216,138,.4);color:var(--civ-gold-primary);
  background:linear-gradient(180deg,#161c28,#0a0d14);font-family:var(--civ-font-ui);}
.civ-bottom-bar .wykonaj.on{animation:civ-wyk-glow 1.5s infinite;border-color:rgba(240,160,64,.75);
  color:#ffc080;background:rgba(208,128,48,.08);border-color:rgba(208,128,48,.55);}
.civ-bottom-bar .wykonaj:disabled{opacity:.35;cursor:not-allowed;pointer-events:none;border-color:rgba(255,255,255,.12);color:var(--civ-text-muted);}
.civ-bottom-bar .wykonaj:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:3px;}
.civ-bottom-bar .wyk-badge{font-size:11px;font-weight:700;letter-spacing:0;color:#0c1018;
  background:linear-gradient(180deg,#ffe08a,#e0b24a);border-radius:999px;padding:1px 7px;line-height:1.5;}
.civ-bottom-bar .et-wrap{position:relative;width:100%;}
.civ-bottom-bar .end-turn{min-width:0;width:100%;height:${BOTTOM_BAR_END_TURN_H_PX}px;padding:5px 18px;
  display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;
  background:linear-gradient(180deg,#f0dc88,#b99a28);
  border:1px solid #6a5212;border-top-color:#f8eea8;border-radius:9px;cursor:pointer;color:#2e2708;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.22);font-family:var(--civ-font-ui);}
.civ-bottom-bar .end-turn:hover:not(:disabled){filter:brightness(1.04);}
.civ-bottom-bar .end-turn:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:3px;}
.civ-bottom-bar .end-turn.is-disabled{opacity:.38;cursor:not-allowed;filter:grayscale(.5);box-shadow:none;}
.civ-bottom-bar .end-turn:disabled{opacity:.38;cursor:not-allowed;filter:grayscale(.5);box-shadow:none;}
/* R-TRZY-KARTY-WDROZENIE-Q1: sygnalizacja WYŁĄCZNIE wizualna — nigdy razem z is-disabled
   (render() gwarantuje showBlockSignal = blocking>0 && !hideEnd && !endVisuallyDisabled),
   więc te dwa stany nie mieszają znaczeń. Przycisk zostaje w pełni klikalny. */
.civ-bottom-bar .end-turn.et-signal{border-style:dashed;border-width:2px;border-color:rgba(208,128,48,.7);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 0 16px rgba(208,128,48,.4);}
.civ-bottom-bar .et-meta{display:none;}
.civ-bottom-bar .et-action{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;
  text-transform:uppercase;letter-spacing:.14em;color:#2e2708;}
.civ-bottom-bar .et-turn-lbl{text-align:center;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8a8070;margin-top:2px;}
@keyframes civ-wyk-glow{0%,100%{box-shadow:none}50%{box-shadow:0 0 16px rgba(208,128,48,.5)}}

/* Warstwa 2 — pasek nad HUD nazywający blokady. Siedzi TAM, gdzie kod trzyma panel
   wydarzeń (nad stosem WYKONAJ/Zakończ turę), więc nie wchodzi w sam stos ani nie
   przesuwa jego przycisków (position:absolute, bottom:100% względem .civ-bottom-bar). */
.civ-bottom-bar .et-hint{position:absolute;left:0;right:0;bottom:calc(100% + ${HUD_GAP_PX}px);
  display:flex;align-items:flex-start;gap:8px;padding:9px 10px;border-radius:9px;
  border:2px solid rgba(208,128,48,.55);background:rgba(208,128,48,.12);
  box-shadow:0 6px 18px rgba(0,0,0,.45);transition:opacity .12s ease;pointer-events:auto;}
.civ-bottom-bar:hover .et-hint{opacity:0;pointer-events:none;}
.civ-bottom-bar .et-hint-ic{flex:none;width:15px;height:15px;margin-top:1px;color:var(--tg-orange);}
.civ-bottom-bar .et-hint-ic svg{width:100%;height:100%;display:block;}
.civ-bottom-bar .et-hint-text{flex:1;min-width:0;font-size:11.5px;color:#f0dcb8;line-height:1.45;}
.civ-bottom-bar .et-hint-show{display:inline-block;margin-top:5px;font-size:11px;color:#ffc080;font-weight:700;
  text-decoration:underline;text-underline-offset:3px;cursor:pointer;background:transparent;border:0;
  font-family:inherit;padding:0;}
.civ-bottom-bar .et-hint-show:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}

/* Warstwa 3 — tooltip na hover, numerowana lista; zajmuje to samo miejsce co pasek
   (bez nakładania — pasek gaśnie na hover całego widżetu, patrz .civ-bottom-bar:hover wyżej). */
.civ-bottom-bar .et-tooltip{position:absolute;left:0;right:0;bottom:calc(100% + ${HUD_GAP_PX}px);
  padding:11px 12px;border:2px solid rgba(232,216,138,.45);border-radius:9px;
  background:linear-gradient(180deg,rgba(26,32,44,.99),rgba(10,13,19,.99));
  box-shadow:0 10px 26px rgba(0,0,0,.65);opacity:0;pointer-events:none;transition:opacity .12s ease;}
.civ-bottom-bar:hover .et-tooltip{opacity:1;pointer-events:auto;}
.civ-bottom-bar .et-tooltip-head{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#d7c77e;
  font-weight:700;margin-bottom:7px;}
.civ-bottom-bar .et-tooltip-row{display:flex;align-items:baseline;gap:8px;padding:4px 0;
  border-bottom:1px solid rgba(232,216,138,.1);}
.civ-bottom-bar .et-tooltip-row:last-of-type{border-bottom:0;}
.civ-bottom-bar .et-tooltip-num{color:var(--tg-gold-primary);font-weight:700;flex:none;}
.civ-bottom-bar .et-tooltip-label{flex:1;min-width:0;font-size:12px;color:#e0d4b8;line-height:1.4;}
.civ-bottom-bar .et-tooltip-foot{font-size:10.5px;color:#8a8070;margin-top:8px;padding-top:7px;
  border-top:1px solid rgba(232,216,138,.1);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

/** Klasyczny fallback bez konkretnych nazw: „{n} karta/karty/kart wymaga/wymagają decyzji." */
function blockingCountPhrase(count: number): string {
  const noun = count === 1 ? 'karta' : (count >= 2 && count <= 4 ? 'karty' : 'kart');
  const verb = count === 1 ? 'wymaga' : 'wymagają';
  return count + ' ' + noun + ' ' + verb + ' decyzji.';
}

/** Copy paska nad HUD (DYSPOZYCJA-WDROZENIE.md §4: „Nie możesz zakończyć tury: {nazwa}
 * i {nazwa} czekają na decyzję." / przy 3+: „{nazwa} i {n} inne czekają na decyzję."). Bez
 * tytułów (getBlockingTitles niepodane) — degraduje do liczby, patrz blockingCountPhrase. */
function blockingHintText(titles: string[] | undefined, count: number): string {
  if (!titles || titles.length === 0) return blockingCountPhrase(count);
  if (titles.length === 1) return 'Nie możesz zakończyć tury: ' + titles[0] + ' czeka na decyzję.';
  if (titles.length === 2) {
    return 'Nie możesz zakończyć tury: ' + titles[0] + ' i ' + titles[1] + ' czekają na decyzję.';
  }
  return 'Nie możesz zakończyć tury: ' + titles[0] + ' i ' + (titles.length - 1) + ' inne czekają na decyzję.';
}

function blockingTooltipRowsHtml(titles: string[] | undefined, count: number): string {
  if (!titles || titles.length === 0) {
    return '<div class="et-tooltip-foot">' + blockingCountPhrase(count) + ' Kliknij Wykonaj, aby przejść do pierwszej.</div>';
  }
  let rows = '';
  titles.forEach((title, i) => {
    rows += '<div class="et-tooltip-row"><span class="et-tooltip-num">' + (i + 1) + '.</span>'
      + '<span class="et-tooltip-label">' + title + '</span></div>';
  });
  return rows + '<div class="et-tooltip-foot">Kliknij, aby przejść do pierwszej.</div>';
}

/** Dolny pasek akcji tury (D1B strefa I). */
export function createBottomBarHud(config: BottomBarHudConfig): BottomBarHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-bottom-bar';

  function render(): void {
    const blocking = config.getBlockingCount?.() ?? 0;
    const hideEnd = config.hideEndTurn?.() ?? false;
    const canEnd = !hideEnd && (config.canEndTurn?.() ?? true);
    const wykOn = blocking > 0;
    const turn = config.getTurn();
    const year = config.getYearLabel?.() ?? '';

    const endArrow = brandIconSvg('ui-end-turn', 24) || brandIconSvg('ui-play', 24) || '';
    const arrowHtml = endArrow
      ? endArrow.replace(/\swidth="[^"]*"/, ' width="18"').replace(/\sheight="[^"]*"/, ' height="18"')
      : '<span aria-hidden="true">▶</span>';
    const warnIcon = brandIconSvg('chip-warning', 18) || '';
    const warnArrowHtml = warnIcon
      ? warnIcon.replace(/\swidth="[^"]*"/, ' width="18"').replace(/\sheight="[^"]*"/, ' height="18"')
      : arrowHtml;

    const endVisuallyDisabled = hideEnd || !canEnd;
    // R-TRZY-KARTY-WDROZENIE-Q1: sygnał TYLKO gdy przycisk faktycznie klikalny i aktywny —
    // nigdy mieszany ze stanem is-disabled (playtest/game over), żeby nie nakładać dwóch
    // różnych znaczeń na ten sam wygląd. Klikalność end-turn (poniżej, data-end) jest od
    // tego całkowicie niezależna i pozostaje bez zmian.
    const showBlockSignal = !hideEnd && !endVisuallyDisabled && wykOn;
    const titles = showBlockSignal ? config.getBlockingTitles?.() : undefined;

    const hintHtml = showBlockSignal
      ? '<div class="et-hint" data-et-hint>'
        + '<span class="et-hint-ic">' + warnIcon + '</span>'
        + '<span class="et-hint-text">' + blockingHintText(titles, blocking)
        + ' <button type="button" class="et-hint-show" data-et-show>Pokaż →</button></span>'
        + '</div>'
      : '';
    const tooltipHtml = showBlockSignal
      ? '<div class="et-tooltip" data-et-tooltip>'
        + '<div class="et-tooltip-head">Blokują zakończenie tury</div>'
        + blockingTooltipRowsHtml(titles, blocking)
        + '</div>'
      : '';

    el.innerHTML = '<button type="button" class="wykonaj' + (wykOn ? ' on' : '') + '" data-wykonaj'
      + (wykOn ? '' : ' disabled') + '>Wykonaj'
      + (wykOn ? '<span class="wyk-badge">' + blocking + '</span>' : '')
      + '</button>'
      + (hideEnd ? '' : (
        '<div class="et-wrap">'
        + hintHtml
        + tooltipHtml
        + '<button type="button" class="end-turn'
        + (endVisuallyDisabled ? ' is-disabled' : '')
        + (showBlockSignal ? ' et-signal' : '')
        + '" data-end aria-disabled="' + (endVisuallyDisabled ? 'true' : 'false') + '">'
        + '<span class="et-action">' + (showBlockSignal ? warnArrowHtml : arrowHtml) + '<span>Zakończ turę</span></span></button>'
        + '</div>'
      ))
      + '<div class="et-turn-lbl">Tura ' + turn + (year ? ' · ' + year : '') + '</div>';

    el.querySelector('[data-wykonaj]')?.addEventListener('click', () => {
      if (wykOn) config.onExecutePending?.();
    });
    // R-TRZY-KARTY-WDROZENIE-Q1 TWARDY ZAKAZ tej rundy: klik na „Zakończ turę" NIE sprawdza
    // blocking/showBlockSignal/getBlockingCount() — dokładnie ten sam warunek co przed tą
    // rundą (tylko hideEndTurn). Zakończenie tury pozostaje zawsze dostępne (Maciej 2026-07-06).
    el.querySelector('[data-end]')?.addEventListener('click', () => {
      if (config.hideEndTurn?.()) return;
      config.onEndTurn?.();
    });
    // „Pokaż →" (pasek) i tooltip: idą do pierwszej blokującej karty — reużywają DOKŁADNIE
    // ten sam mechanizm co „Wykonaj" (config.onExecutePending, main.ts: executeFirstBlockingEvent).
    el.querySelector('[data-et-show]')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      if (wykOn) config.onExecutePending?.();
    });
    el.querySelector('[data-et-tooltip]')?.addEventListener('click', () => {
      if (wykOn) config.onExecutePending?.();
    });
  }

  document.body.appendChild(el);
  render();
  return { el, update: render, destroy: () => el.remove() };
}
