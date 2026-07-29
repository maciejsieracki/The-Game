/**
 * diplomacyAcceptanceBalance.ts — panel punktów wymiany (PW) na stole negocjacji.
 * Używa AcceptanceSideBalance z diplomacy-acceptance-points (bez drugiego silnika).
 */
import type { AcceptanceSideBalance } from '../game/diplomacy-acceptance-points';
import { bilateralTreatyDisplayPw, sideDisplayOfferPw } from '../game/diplomacy-acceptance-points';
import { pnDealAcceptedByAi } from '../game/diplomacy-pn-engine';
import { diplomacyFairGivePn } from '../game/diplomacy-value-catalog';

export interface NegotiationBalanceSource {
  id?: string;
  direction: 'own' | 'incoming';
  actionLabel: string;
  acceptanceMy?: AcceptanceSideBalance;
  acceptanceTheir?: AcceptanceSideBalance;
  canAccept?: boolean;
  responderPreview?: { accepted: boolean; reason?: string };
  isGift?: boolean;
  awaitingAiResponse?: boolean;
  canCounter?: boolean;
  uiActionId?: string;
}

export interface PnBalancePanelData {
  actionLabel: string;
  negotiationId?: string;
  direction: 'own' | 'incoming';
  myOfferPn: number;
  theirOfferPn: number;
  theirBalance: AcceptanceSideBalance;
  myBalance?: AcceptanceSideBalance;
  canAccept?: boolean;
  extraOnTable?: number;
  awaitingAiResponse?: boolean;
  responderPreview?: { accepted: boolean; reason?: string };
  canCounter?: boolean;
  uiActionId?: string;
}

/** Tooltip nagłówka PW — D-DYPLO-PW-NAZWA (Maciej 2026-07-29). */
export const PW_EXCHANGE_TOOLTIP =
  'Punkty wymiany (PW) mierzą bilans oferty na stole negocjacji. '
  + '„My oddajemy” vs „Oni oddają” — dodatni bilans oznacza, że możesz coś wyciągnąć lub przyjąć ofertę; '
  + 'ujemny bilans — trzeba dopłacić (surowce, ¤, ustępstwa). '
  + 'To nie jest waluta ¤ ani złoto-surowiec w magazynie.';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pwTipAttr(): string {
  return ' title="' + esc(PW_EXCHANGE_TOOLTIP) + '"';
}

function pwTitleHeadHtml(): string {
  const t = pwTipAttr();
  return (
    '<span class="da-pn-bal-head-titles">'
    + '<span class="da-pn-bal-title"' + t + '>Punkty wymiany</span>'
    + '<abbr class="da-pn-bal-abbr"' + t + '>PW</abbr>'
    + '</span>'
  );
}

function pwAmountHtml(n: number, extraCls = ''): string {
  const cls = 'da-pn-bal-num' + (extraCls ? ' ' + extraCls : '');
  return '<span class="' + cls + '"' + pwTipAttr() + '>' + n + ' PW</span>';
}

/** Wybiera wpis stołu do centralnego panelu PW (priorytet: incoming do decyzji). */
export function pickPrimaryNegotiationRow(
  rows: readonly NegotiationBalanceSource[],
): NegotiationBalanceSource | null {
  if (rows.length === 0) return null;
  const incoming = rows.filter(r => r.direction === 'incoming');
  if (incoming.length > 0) return incoming[0] ?? null;
  const own = rows.filter(r => r.direction === 'own');
  if (own.length > 0) return own[0] ?? null;
  return rows[0] ?? null;
}

export function balancePanelDataFromRow(
  row: NegotiationBalanceSource,
  extraOnTable = 0,
): PnBalancePanelData | null {
  const their = row.acceptanceTheir;
  if (!their) return null;
  const my = row.acceptanceMy;
  const bilateralPw = bilateralTreatyDisplayPw(my, their);
  return {
    actionLabel: row.actionLabel,
    negotiationId: row.id,
    direction: row.direction,
    myOfferPn: sideDisplayOfferPw(my, bilateralPw),
    theirOfferPn: sideDisplayOfferPw(their, bilateralPw),
    theirBalance: their,
    myBalance: my,
    canAccept: row.canAccept,
    extraOnTable,
    awaitingAiResponse: row.awaitingAiResponse,
    responderPreview: row.responderPreview,
    canCounter: row.canCounter,
    uiActionId: row.uiActionId,
  };
}

function formatBalanceDelta(balancePn: number, accepted: boolean): string {
  if (accepted && balancePn > 0) return `+${balancePn}`;
  if (accepted && balancePn === 0) return '0';
  if (balancePn < 0) return `${balancePn}`;
  return String(balancePn);
}

function balanceHint(balance: AcceptanceSideBalance): string {
  if (balance.accepted && balance.balancePn > 0) {
    return `Nadwyżka ${balance.balancePn} PW`;
  }
  if (balance.accepted && balance.balancePn === 0) {
    return 'Równo — spełnia';
  }
  if (balance.balancePn < 0) {
    return `Brakuje ${Math.abs(balance.balancePn)} PW`;
  }
  return balance.statusLabel;
}

function verdictHtml(data: PnBalancePanelData): { html: string; tone: 'ok' | 'no' | 'wait' } {
  const their = data.theirBalance;
  if (data.direction === 'incoming') {
    if (data.canAccept) {
      return {
        tone: 'ok',
        html: 'Spełnia warunki — możesz przyjąć (Przyjmij aktywne)',
      };
    }
    if (data.myBalance && !data.myBalance.accepted) {
      return { tone: 'no', html: 'Twoje warunki: ' + data.myBalance.statusLabel };
    }
    if (!their.accepted) {
      return { tone: 'no', html: 'Oni nie spełniają progu: ' + their.statusLabel };
    }
    return { tone: 'wait', html: 'Oceń ofertę lub kontruj, aby osiągnąć bilans' };
  }
  if (data.awaitingAiResponse) {
    const prev = data.responderPreview;
    if (prev?.accepted) {
      return {
        tone: 'ok',
        html: 'Spełnia warunki — użyj Przyjmij, aby wysłać propozycję do partnera',
      };
    }
    if (prev && !prev.accepted) {
      return { tone: 'no', html: 'Nie spełnia warunków: ' + (prev.reason ?? 'warunki niespełnione') };
    }
    return { tone: 'wait', html: 'Propozycja na stole — użyj Przyjmij, aby poprosić o odpowiedź' };
  }
  if (their.accepted) {
    return {
      tone: 'ok',
      html: data.theirBalance.balancePn > 0
        ? 'Drugą stronę można przyjąć — nadwyżka ' + data.theirBalance.balancePn + ' PW'
        : 'Równo — druga strona spełnia oczekiwania',
    };
  }
  return { tone: 'no', html: 'Brakuje u nich: ' + their.statusLabel };
}

/** Główny panel PW — widoczny między kolumnami My / Oni na stole. */
export function renderPnBalancePanelHtml(data: PnBalancePanelData | null): string {
  if (!data) {
    return (
      '<div class="da-pn-balance-bar idle">'
      + '<div class="da-pn-bal-head">' + pwTitleHeadHtml() + '</div>'
      + '<div class="da-pn-bal-empty">Brak aktywnej propozycji na stole — wyślij ofertę lub poczekaj na odpowiedź.</div>'
      + '</div>'
    );
  }

  const their = data.theirBalance;
  const balCls = their.accepted ? 'ok' : 'no';
  const delta = formatBalanceDelta(their.balancePn, their.accepted);
  const deltaCls = their.balancePn >= 0 ? 'pos' : 'neg';
  const verdict = verdictHtml(data);
  const extraNote = (data.extraOnTable ?? 0) > 0
    ? '<span class="da-pn-bal-more">+' + data.extraOnTable + ' inna na stole</span>'
    : '';

  const treatyNote = their.treatyEffectivePn != null && their.treatyEffectivePn > 0
    ? '<div class="da-pn-bal-meta">Traktat: wym. '
      + their.treatyEffectivePn + ' PW'
      + (their.relationModLabel ? ' · ' + esc(their.relationModLabel) : '')
      + '</div>'
    : '';

  const relNote = their.relRequired != null && their.relBalance != null && their.relBalance < 0
    ? '<div class="da-pn-bal-meta warn">Relacja ' + (their.relCurrent ?? 0)
      + ' — wym. ' + their.relRequired + '</div>'
    : '';

  return (
    '<div class="da-pn-balance-bar ' + balCls + '"'
    + (data.negotiationId ? ' data-negot-id="' + esc(data.negotiationId) + '"' : '')
    + '>'
    + '<div class="da-pn-bal-head">'
    + pwTitleHeadHtml()
    + '<span class="da-pn-bal-deal">' + esc(data.actionLabel) + extraNote + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cols">'
    + '<div class="da-pn-bal-cell my">'
    + '<span class="da-pn-bal-lbl">My oddajemy</span>'
    + pwAmountHtml(data.myOfferPn)
    + '</div>'
    + '<div class="da-pn-bal-cell center ' + balCls + '">'
    + '<span class="da-pn-bal-lbl">Bilans (Oni)</span>'
    + '<span class="da-pn-bal-num ' + deltaCls + '"' + pwTipAttr() + '>' + esc(delta) + '</span>'
    + '<span class="da-pn-bal-hint">' + esc(balanceHint(their)) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cell they">'
    + '<span class="da-pn-bal-lbl">Oni oddają</span>'
    + pwAmountHtml(data.theirOfferPn)
    + '</div>'
    + '</div>'
    + treatyNote + relNote
    + '<div class="da-pn-bal-verdict ' + verdict.tone + '">' + esc(verdict.html) + '</div>'
    + '</div>'
  );
}

/** Koszyk handlu — ten sam układ 3 kolumn, live podgląd podczas budowania oferty. */
export function renderPnBalancePanelFromBasket(
  givePn: number | null,
  receivePn: number | null,
  relTotal: number,
  actionLabel = 'Wymiana',
): string {
  if (givePn == null || receivePn == null) {
    return (
      '<div class="da-pn-balance-bar idle da-pn-balance-bar--basket">'
      + '<div class="da-pn-bal-head">' + pwTitleHeadHtml() + '</div>'
      + '<div class="da-pn-bal-empty">Uzupełnij koszyk — wartości PW pojawią się tutaj.</div>'
      + '</div>'
    );
  }
  const fairMin = diplomacyFairGivePn(receivePn, Math.min(100, relTotal));
  const balancePn = givePn - fairMin;
  const accepted = pnDealAcceptedByAi(givePn, receivePn, relTotal);
  const balCls = accepted ? 'ok' : 'no';
  const delta = formatBalanceDelta(balancePn, accepted);
  const deltaCls = balancePn >= 0 ? 'pos' : 'neg';
  const hint = accepted
    ? (balancePn > 0 ? `Nadwyżka ${balancePn} PW` : 'Równo — spełnia')
    : `Brakuje ${Math.abs(balancePn)} PW`;
  const verdict = accepted
    ? (balancePn > 0
      ? 'Partner prawdopodobnie przyjmie — nadwyżka ' + balancePn + ' PW'
      : 'Równo — partner spełnia oczekiwania przy tej Relacji')
    : 'Poniżej progu fair min (' + fairMin + ' PW) — ryzyko odrzucenia';

  return (
    '<div class="da-pn-balance-bar ' + balCls + ' da-pn-balance-bar--basket">'
    + '<div class="da-pn-bal-head">'
    + pwTitleHeadHtml()
    + '<span class="da-pn-bal-deal">' + esc(actionLabel) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cols">'
    + '<div class="da-pn-bal-cell my">'
    + '<span class="da-pn-bal-lbl">My oddajemy</span>'
    + pwAmountHtml(givePn)
    + '</div>'
    + '<div class="da-pn-bal-cell center ' + balCls + '">'
    + '<span class="da-pn-bal-lbl">Bilans (Oni)</span>'
    + '<span class="da-pn-bal-num ' + deltaCls + '"' + pwTipAttr() + '>' + esc(delta) + '</span>'
    + '<span class="da-pn-bal-hint">' + esc(hint) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cell they">'
    + '<span class="da-pn-bal-lbl">Oni oddają</span>'
    + pwAmountHtml(receivePn)
    + '</div>'
    + '</div>'
    + '<div class="da-pn-bal-meta">Fair min @ Rel ' + relTotal + ': ' + fairMin + ' PW</div>'
    + '<div class="da-pn-bal-verdict ' + (accepted ? 'ok' : 'no') + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/** Jednolinijkowy podgląd na karcie (gdy jest wiele propozycji na stole). */
export function renderAcceptanceCompactHtml(
  side: AcceptanceSideBalance | undefined,
  prefix: string,
  bilateralPw?: number,
): string {
  if (!side) return '';
  const cls = side.accepted ? 'ok' : 'no';
  const displayPw = sideDisplayOfferPw(side, bilateralPw);
  return (
    '<div class="da-accept-compact ' + cls + '">'
    + esc(prefix) + ': ' + displayPw + ' PW · saldo '
    + (side.balancePn >= 0 ? '+' + side.balancePn : String(side.balancePn))
    + ' · ' + esc(side.statusLabel)
    + '</div>'
  );
}
