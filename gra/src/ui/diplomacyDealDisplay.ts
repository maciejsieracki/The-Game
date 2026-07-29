/**
 * diplomacyDealDisplay.ts — czytelny HTML ofert handlowych (ikony surowców + rozpiska).
 * Stół negocjacji: lewa kolumna „Oferujemy", prawa „Oferują" (perspektywa gracza).
 */
import type { BasketItem } from '../game/diplomacy-pn-engine';
import type { ProposalPayload } from '../game/diplomacy-proposals';
import {
  resourceDisplayLabel,
  splitNegotiationDealPlayerSides,
  type BasketItemFormatCtx,
} from '../game/diplomacy-display';
import { diplomacyHandelSurowcePakietWielkosc } from '../game/diplomacy-value-catalog';
import { brandIconSvg, mapResourceIconSvg } from './icons/brandAssets';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resourceIconHtml(label: string, size = 16): string {
  const mapSvg = mapResourceIconSvg(label, size);
  if (mapSvg) return `<span class="da-deal-res-ic">${mapSvg}</span>`;
  const brandSvg = brandIconSvg('chip-crate', size);
  if (brandSvg) return `<span class="da-deal-res-ic">${brandSvg}</span>`;
  return '';
}

function goldIconHtml(size = 16): string {
  const svg = mapResourceIconSvg('Złoto', size) || mapResourceIconSvg('zloto', size);
  return svg ? `<span class="da-deal-res-ic">${svg}</span>` : '';
}

export function renderBasketItemValueHtml(item: BasketItem, ctx: BasketItemFormatCtx): string {
  const perTurn = ctx.perTurn === true;
  const turns = ctx.turns;

  switch (item.typ) {
    case 'zloto': {
      const amt = item.ilosc ?? 0;
      const ic = goldIconHtml(16);
      if (perTurn) {
        const main = `${ic}<span class="da-deal-amt">${amt} ¤</span><span class="da-deal-per">na turę</span>`;
        if (turns != null && turns > 0) {
          return (
            main
            + `<span class="da-deal-total">łącznie ${amt * turns} ¤ przez ${turns} tur</span>`
          );
        }
        return main;
      }
      return `${ic}<span class="da-deal-amt">${amt} ¤</span><span class="da-deal-once">jednorazowo</span>`;
    }
    case 'surowiec_ilosc': {
      const pakietSize = diplomacyHandelSurowcePakietWielkosc();
      const pakiety = item.ilosc ?? 1;
      const szt = pakiety * pakietSize;
      const label = resourceDisplayLabel(item.id);
      const ic = resourceIconHtml(label, 16);
      if (perTurn) {
        const main = `${ic}<span class="da-deal-amt">${szt} ${esc(label)}</span><span class="da-deal-per">na turę</span>`;
        if (turns != null && turns > 0) {
          return (
            main
            + `<span class="da-deal-total">łącznie ${szt * turns} ${esc(label)} przez ${turns} tur</span>`
          );
        }
        return main;
      }
      return `${ic}<span class="da-deal-amt">${szt} ${esc(label)}</span><span class="da-deal-once">jednorazowo</span>`;
    }
    case 'surowiec_boolean': {
      const label = resourceDisplayLabel(item.id);
      return `${resourceIconHtml(label, 16)}<span class="da-deal-amt">dostęp: ${esc(label)}</span><span class="da-deal-once">(nieaktualne)</span>`;
    }
    case 'zloze':
      return `<span class="da-deal-amt">dostęp do złoża: ${esc(item.id)}</span><span class="da-deal-once">(nieaktualne)</span>`;
    case 'praca':
      return `<span class="da-deal-amt">${item.ilosc ?? 0} Pracy${perTurn ? ' na turę' : ' (jednorazowo)'}</span>`;
    case 'zywnosc':
      return `<span class="da-deal-amt">${item.ilosc ?? 0} Żywności${perTurn ? ' na turę' : ' (jednorazowo)'}</span>`;
    default:
      return `<span class="da-deal-amt">${esc(item.id ?? item.typ)}</span>`;
  }
}

export function renderBasketListHtml(items: readonly BasketItem[] | undefined, ctx: BasketItemFormatCtx): string {
  if (!items?.length) return '<span class="da-deal-empty">—</span>';
  return items.map(i => `<div class="da-deal-item">${renderBasketItemValueHtml(i, ctx)}</div>`).join('');
}

/**
 * HTML bloku warunków oferty — dwie kolumny stołu (Oferujemy | Oferują).
 * @param incoming — true gdy propozycja przychodzi od drugiej strony.
 */
export function renderNegotiationDealHtml(
  payload: ProposalPayload,
  opts: { incoming?: boolean } = {},
): string {
  const split = splitNegotiationDealPlayerSides(payload, opts.incoming === true);
  if (!split) return '';

  const ctx: BasketItemFormatCtx = {
    perTurn: payload.resourceTradeMode === 'per_turn',
    turns: payload.turns,
  };

  let html = '<div class="da-deal-table">';
  html += '<div class="da-deal-col da-deal-col-we">';
  html += '<div class="da-deal-col-head">Oferujemy</div>';
  html += `<div class="da-deal-col-body">${renderBasketListHtml(split.weOffer, ctx)}</div>`;
  html += '</div>';
  html += '<div class="da-deal-col da-deal-col-they">';
  html += '<div class="da-deal-col-head">Oferują</div>';
  html += `<div class="da-deal-col-body">${renderBasketListHtml(split.theyOffer, ctx)}</div>`;
  html += '</div>';
  html += '</div>';
  if (split.schedule) {
    html += `<div class="da-deal-sched-foot">${esc(split.schedule)}</div>`;
  }
  return html;
}

/** Wpis traktatu dwustronnego — gdy koszyk pusty, obie strony stołu pokazują tę samą etykietę. */
export function renderTreatyDealItemHtml(label: string): string {
  return `<div class="da-deal-item da-deal-treaty"><span class="da-deal-amt">${esc(label)}</span></div>`;
}

/**
 * Jedna strona stołu negocjacji — tylko pozycje dealu (bez ocen PN).
 * Gdy koszyk pusty a `treatyFallbackLabel` podany (traktat dwustronny), pokazuje etykietę traktatu.
 */
export function renderNegotiationTableDealSideHtml(
  payload: ProposalPayload,
  focus: 'we' | 'they',
  incoming: boolean,
  treatyFallbackLabel?: string,
): string {
  const split = splitNegotiationDealPlayerSides(payload, incoming);
  const items = split ? (focus === 'we' ? split.weOffer : split.theyOffer) : [];

  if (items.length > 0) {
    return renderNegotiationDealSideOnlyHtml(payload, focus, incoming);
  }

  if (treatyFallbackLabel) {
    const colCls = focus === 'we' ? 'da-deal-col-we' : 'da-deal-col-they';
    const headLabel = focus === 'we' ? 'Oferujemy' : 'Oferują';
    return (
      '<div class="da-deal-single da-deal-side-only">'
      + `<div class="da-deal-col ${colCls}">`
      + `<div class="da-deal-col-head">${headLabel}</div>`
      + `<div class="da-deal-col-body">${renderTreatyDealItemHtml(treatyFallbackLabel)}</div>`
      + '</div></div>'
    );
  }

  return '<div class="da-deal-single da-deal-side-only"><span class="da-deal-empty">—</span></div>';
}

/** Jedna kolumna stołu (bez kontekstu drugiej strony) — do linked pending split. */
export function renderNegotiationDealSideOnlyHtml(
  payload: ProposalPayload,
  focus: 'we' | 'they',
  incoming: boolean,
): string {
  const split = splitNegotiationDealPlayerSides(payload, incoming);
  if (!split) return '';

  const ctx: BasketItemFormatCtx = {
    perTurn: payload.resourceTradeMode === 'per_turn',
    turns: payload.turns,
  };

  const items = focus === 'we' ? split.weOffer : split.theyOffer;
  const label = focus === 'we' ? 'Oferujemy' : 'Oferują';
  const colCls = focus === 'we' ? 'da-deal-col-we' : 'da-deal-col-they';

  let html = '<div class="da-deal-single da-deal-side-only">';
  html += `<div class="da-deal-col ${colCls}">`;
  html += `<div class="da-deal-col-head">${label}</div>`;
  html += `<div class="da-deal-col-body">${renderBasketListHtml(items, ctx)}</div>`;
  html += '</div></div>';
  if (focus === 'they' && split.schedule) {
    html += `<div class="da-deal-sched-foot">${esc(split.schedule)}</div>`;
  }
  return html;
}

/**
 * Jednostronny podgląd oferty — akcent na „we" lub „they" + opcjonalny kontekst drugiej strony
 * (kolumny „My oferujemy" / „Oni oferują" stołu negocjacji).
 */
export function renderNegotiationDealOneSideHtml(
  payload: ProposalPayload,
  focus: 'we' | 'they',
  opts: { incoming?: boolean; showContext?: boolean } = {},
): string {
  if (opts.showContext === false) {
    return renderNegotiationDealSideOnlyHtml(payload, focus, opts.incoming === true);
  }
  const split = splitNegotiationDealPlayerSides(payload, opts.incoming === true);
  if (!split) return '';

  const ctx: BasketItemFormatCtx = {
    perTurn: payload.resourceTradeMode === 'per_turn',
    turns: payload.turns,
  };

  const primary = focus === 'we' ? split.weOffer : split.theyOffer;
  const secondary = focus === 'we' ? split.theyOffer : split.weOffer;
  const primaryLabel = focus === 'we' ? 'Oferujemy' : 'Oferują';
  const contextLabel = focus === 'we' ? 'Chcemy w zamian' : 'W zamian proszą';
  const colCls = focus === 'we' ? 'da-deal-col-we' : 'da-deal-col-they';

  let html = '<div class="da-deal-single">';
  html += `<div class="da-deal-col ${colCls}">`;
  html += `<div class="da-deal-col-head">${primaryLabel}</div>`;
  html += `<div class="da-deal-col-body">${renderBasketListHtml(primary, ctx)}</div>`;
  html += '</div>';
  if (secondary.length > 0) {
    html += '<div class="da-deal-context">';
    html += `<div class="da-deal-ctx-label">${contextLabel}</div>`;
    html += `<div class="da-deal-ctx-body">${renderBasketListHtml(secondary, ctx)}</div>`;
    html += '</div>';
  }
  html += '</div>';
  if (split.schedule) {
    html += `<div class="da-deal-sched-foot">${esc(split.schedule)}</div>`;
  }
  return html;
}

/** Podgląd oferty w koszyku handlu — ten sam układ co w „Oczekujące propozycje". */
export function renderTradeBasketDealPreviewHtml(
  weOffer: readonly BasketItem[],
  theyOffer: readonly BasketItem[],
  opts: { resourceTradeMode?: 'once' | 'per_turn'; turns?: number } = {},
): string {
  const ctx: BasketItemFormatCtx = {
    perTurn: opts.resourceTradeMode === 'per_turn',
    turns: opts.turns,
  };
  let html = '<div class="da-deal-table">';
  html += '<div class="da-deal-col da-deal-col-we">';
  html += '<div class="da-deal-col-head">Oferujemy</div>';
  html += `<div class="da-deal-col-body">${renderBasketListHtml(weOffer, ctx)}</div>`;
  html += '</div>';
  html += '<div class="da-deal-col da-deal-col-they">';
  html += '<div class="da-deal-col-head">Oferują</div>';
  html += `<div class="da-deal-col-body">${renderBasketListHtml(theyOffer, ctx)}</div>`;
  html += '</div>';
  html += '</div>';
  const turns = opts.turns;
  if (opts.resourceTradeMode === 'per_turn') {
    if (turns != null && turns > 0) {
      html += `<div class="da-deal-sched-foot">Wymiana co turę przez ${turns} tur</div>`;
    } else {
      html += '<div class="da-deal-sched-foot">Wymiana co turę</div>';
    }
  }
  return html;
}
