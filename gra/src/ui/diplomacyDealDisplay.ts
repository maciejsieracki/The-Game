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

function renderBasketItemValueHtml(item: BasketItem, ctx: BasketItemFormatCtx): string {
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
      return `${resourceIconHtml(label, 16)}<span class="da-deal-amt">dostęp: ${esc(label)}</span>`;
    }
    case 'praca':
      return `<span class="da-deal-amt">${item.ilosc ?? 0} Pracy${perTurn ? ' na turę' : ' (jednorazowo)'}</span>`;
    case 'zywnosc':
      return `<span class="da-deal-amt">${item.ilosc ?? 0} Żywności${perTurn ? ' na turę' : ' (jednorazowo)'}</span>`;
    default:
      return `<span class="da-deal-amt">${esc(item.id ?? item.typ)}</span>`;
  }
}

function renderBasketListHtml(items: readonly BasketItem[] | undefined, ctx: BasketItemFormatCtx): string {
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
