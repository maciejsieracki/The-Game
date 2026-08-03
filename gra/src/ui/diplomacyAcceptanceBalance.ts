/**
 * diplomacyAcceptanceBalance.ts — panel punktów wymiany (PW) na stole negocjacji.
 * Używa AcceptanceSideBalance z diplomacy-acceptance-points (bez drugiego silnika).
 */
import type { AcceptanceSideBalance } from '../game/diplomacy-acceptance-points';
import { bilateralTreatyDisplayPw, sideDisplayOfferPw } from '../game/diplomacy-acceptance-points';
import {
  formatRelationModLabel,
  pnDealAcceptedByAi,
  relationPnModPct,
  relationSignedFromTotal,
} from '../game/diplomacy-pn-engine';
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

/** Tooltip wiersza wpływu Relacji na deal (Maciej 2026-08-03). */
export const RELATION_DEAL_TOOLTIP =
  'Relacja = Zaufanie + Respekt. Powyżej 100 obniża wymagane PW traktatu (max −90%), '
  + 'poniżej podnosi (max +90%).';

type RelationDealContext = 'treaty' | 'trade';

function relationModTone(modPct: number): 'better' | 'worse' | 'neutral' {
  if (modPct > 0) return 'better';
  if (modPct < 0) return 'worse';
  return 'neutral';
}

function relationDealText(relTotal: number, context: RelationDealContext): string {
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  if (context === 'trade') {
    if (relTotal >= 100) return 'parytet 1:1 przy uczciwej wymianie';
    const mult = (100 / Math.max(1, relTotal)).toFixed(1).replace(/\.0$/, '');
    return `musisz dać więcej (×${mult} PW), by oferta była uczciwa`;
  }
  if (modPct === 0) return 'balans (0% — cena bazowa)';
  if (modPct > 0) return `deal tańszy o ${modPct}%`;
  return `deal droższy o ${Math.abs(modPct)}%`;
}

function resolveRelationPanelContext(side: AcceptanceSideBalance): RelationDealContext {
  const hasTreaty = (side.treatyBasePn ?? 0) > 0 || (side.treatyEffectivePn ?? 0) > 0;
  if (hasTreaty || side.mode === 'treaty') return 'treaty';
  return 'trade';
}

/** Widoczny wiersz „Wpływ Relacji na deal” — wszystkie warianty panelu PW. */
export function renderRelationDealModRowHtml(
  relTotal: number,
  context: RelationDealContext = 'treaty',
): string {
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  const tone = context === 'trade'
    ? (relTotal >= 100 ? 'neutral' : 'worse')
    : relationModTone(modPct);
  const dealText = relationDealText(relTotal, context);
  const relDisplay = context === 'trade' && relTotal >= 100
    ? 'Relacja ≥100'
    : `Relacja ${relTotal}`;
  const balanceNote = context === 'treaty' && modPct !== 0
    ? ' <span class="da-pn-rel-mod-balance">(punkt balansu: 100)</span>'
    : '';
  const tip = ' title="' + esc(RELATION_DEAL_TOOLTIP + ' ' + formatRelationModLabel(relTotal)) + '"';

  return (
    '<div class="da-pn-rel-mod ' + tone + '"' + tip + '>'
    + '<span class="da-pn-rel-mod-label">Wpływ Relacji na deal</span>'
    + '<span class="da-pn-rel-mod-text">'
    + '<strong>' + esc(relDisplay) + '</strong>'
    + ' · <span class="da-pn-rel-mod-deal">' + esc(dealText) + '</span>'
    + balanceNote
    + '</span>'
    + '</div>'
  );
}

function relationRowFromBalance(
  side: AcceptanceSideBalance,
  my?: AcceptanceSideBalance,
): string {
  const relTotal = side.relCurrent ?? my?.relCurrent ?? 100;
  return renderRelationDealModRowHtml(relTotal, resolveRelationPanelContext(side));
}

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

/** Przychodząca wymiana PN — panel netto (nie fair-min AI). */
export function isIncomingBasketTradePanel(data: PnBalancePanelData): boolean {
  if (data.direction !== 'incoming') return false;
  const mode = data.myBalance?.mode ?? data.theirBalance.mode;
  return mode === 'basket' || mode === 'mixed';
}

/** Netto PW: dodatnie = gracz oddaje więcej (przewaga partnera). */
export function incomingTradeNetBalancePw(data: PnBalancePanelData): number {
  return data.myOfferPn - data.theirOfferPn;
}

function incomingTradeBalanceHint(netPw: number): string {
  if (netPw > 0) return `Przewaga u nich: +${netPw} PW`;
  if (netPw < 0) return `Przewaga u Ciebie: +${Math.abs(netPw)} PW`;
  return 'Równo — symetryczna wymiana';
}

function verdictHtml(data: PnBalancePanelData): { html: string; tone: 'ok' | 'no' | 'wait' } {
  const their = data.theirBalance;
  if (data.direction === 'incoming') {
    if (data.canAccept !== false) {
      if (isIncomingBasketTradePanel(data)) {
        const net = incomingTradeNetBalancePw(data);
        const html = net > 0
          ? `Możesz przyjąć — oddajesz więcej o ${net} PW (korzyść partnera)`
          : net < 0
            ? `Możesz przyjąć — przewaga u Ciebie o ${Math.abs(net)} PW`
            : 'Możesz przyjąć — wymiana symetryczna';
        return { tone: 'ok', html };
      }
      return {
        tone: 'ok',
        html: 'Spełnia warunki — możesz przyjąć (Przyjmij aktywne)',
      };
    }
    if (data.myBalance && !data.myBalance.accepted) {
      return { tone: 'no', html: 'Twoje warunki: ' + data.myBalance.statusLabel };
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
  const incomingTrade = isIncomingBasketTradePanel(data);
  const netPw = incomingTrade ? incomingTradeNetBalancePw(data) : their.balancePn;
  const balCls = incomingTrade
    ? (data.canAccept !== false ? 'ok' : 'no')
    : (their.accepted ? 'ok' : 'no');
  const delta = incomingTrade
    ? (netPw > 0 ? `+${netPw}` : String(netPw))
    : formatBalanceDelta(their.balancePn, their.accepted);
  const deltaCls = netPw >= 0 ? 'pos' : 'neg';
  const centerLabel = incomingTrade ? 'Bilans (netto)' : 'Bilans (Oni)';
  const hint = incomingTrade
    ? incomingTradeBalanceHint(netPw)
    : balanceHint(their);
  const verdict = verdictHtml(data);
  const extraNote = (data.extraOnTable ?? 0) > 0
    ? '<span class="da-pn-bal-more">+' + data.extraOnTable + ' inna na stole</span>'
    : '';

  const treatyNote = their.treatyEffectivePn != null && their.treatyEffectivePn > 0
    ? '<div class="da-pn-bal-meta">Traktat: wym. '
      + their.treatyEffectivePn + ' PW'
      + '</div>'
    : '';

  const relModRow = relationRowFromBalance(their, data.myBalance);

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
    + '<span class="da-pn-bal-lbl">' + esc(centerLabel) + '</span>'
    + '<span class="da-pn-bal-num ' + deltaCls + '"' + pwTipAttr() + '>' + esc(delta) + '</span>'
    + '<span class="da-pn-bal-hint">' + esc(hint) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cell they">'
    + '<span class="da-pn-bal-lbl">Oni oddają</span>'
    + pwAmountHtml(data.theirOfferPn)
    + '</div>'
    + '</div>'
    + relModRow
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
  const rawBalancePn = givePn - receivePn;
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
    + renderRelationDealModRowHtml(relTotal, 'trade')
    + '<div class="da-pn-bal-meta">PW surowe (bez Relacji): oddajemy ' + givePn + ' · oni ' + receivePn
    + ' · bilans ' + (rawBalancePn >= 0 ? '+' : '') + rawBalancePn + '</div>'
    + '<div class="da-pn-bal-meta">PW @ Rel ' + relTotal + ': fair min ' + fairMin + ' · bilans '
    + (balancePn >= 0 ? '+' : '') + balancePn + '</div>'
    + '<div class="da-pn-bal-verdict ' + (accepted ? 'ok' : 'no') + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/**
 * Koszyk traktatu (pokój, NAP, sojusz, …) — PN traktatu @ Relacji + koszyk osobno.
 * NIE stosuje diplomacyFairGivePn na dwustronnej wartości traktatu (fałszywe „Brakuje PW").
 * Bilans = słodzik netto proponenta max(0, give−receive), jak peaceProposalOfferPn w silniku.
 */
export function renderPnBalancePanelForTreaty(
  treatyEffectivePw: number,
  basketGivePn: number,
  basketReceivePn: number,
  relTotal: number,
  actionLabel: string,
  relRequired?: number,
  treatyMetaLabel = 'Traktat',
): string {
  const basketNet = Math.max(0, basketGivePn - basketReceivePn);
  const myDisplay = treatyEffectivePw + basketGivePn;
  const theirDisplay = treatyEffectivePw + basketReceivePn;
  const relOk = relRequired == null || relTotal >= relRequired;
  const accepted = relOk;
  const balancePn = basketNet;
  const balCls = accepted ? 'ok' : 'no';
  const delta = formatBalanceDelta(balancePn, accepted);
  const deltaCls = balancePn >= 0 ? 'pos' : 'neg';
  const hint = !relOk
    ? `Relacja ${relTotal} — wym. ${relRequired}`
    : (balancePn > 0 ? `Nadwyżka ${balancePn} PW` : 'Równo — spełnia');
  const verdict = !relOk
    ? `Relacja ${relTotal} — wymagane ≥ ${relRequired} (nie progu fair-min handlu)`
    : (balancePn > 0
      ? 'Partner prawdopodobnie przyjmie — nadwyżka ' + balancePn + ' PW'
      : treatyMetaLabel + ': ' + treatyEffectivePw + ' PW @ Rel ' + relTotal + ' — spełnione');

  const relNote = !relOk
    ? '<div class="da-pn-bal-meta warn">Relacja ' + relTotal
      + ' — wym. ' + relRequired + '</div>'
    : '';

  return (
    '<div class="da-pn-balance-bar ' + balCls + ' da-pn-balance-bar--basket da-pn-balance-bar--treaty">'
    + '<div class="da-pn-bal-head">'
    + pwTitleHeadHtml()
    + '<span class="da-pn-bal-deal">' + esc(actionLabel) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cols">'
    + '<div class="da-pn-bal-cell my">'
    + '<span class="da-pn-bal-lbl">My oddajemy</span>'
    + pwAmountHtml(myDisplay)
    + '</div>'
    + '<div class="da-pn-bal-cell center ' + balCls + '">'
    + '<span class="da-pn-bal-lbl">Bilans (Oni)</span>'
    + '<span class="da-pn-bal-num ' + deltaCls + '"' + pwTipAttr() + '>' + esc(delta) + '</span>'
    + '<span class="da-pn-bal-hint">' + esc(hint) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cell they">'
    + '<span class="da-pn-bal-lbl">Oni oddają</span>'
    + pwAmountHtml(theirDisplay)
    + '</div>'
    + '</div>'
    + renderRelationDealModRowHtml(relTotal, 'treaty')
    + '<div class="da-pn-bal-meta">' + esc(treatyMetaLabel) + ': ' + treatyEffectivePw + ' PW @ Rel ' + relTotal
    + (basketGivePn > 0 || basketReceivePn > 0
      ? ' · koszyk netto ' + (basketNet > 0 ? '+' + basketNet : '0') + ' PW'
      : '')
    + '</div>'
    + relNote
    + '<div class="da-pn-bal-verdict ' + balCls + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/** @deprecated alias — użyj renderPnBalancePanelForTreaty */
export function renderPnBalancePanelForPeace(
  treatyEffectivePw: number,
  basketGivePn: number,
  basketReceivePn: number,
  relTotal: number,
  actionLabel = 'Propozycja pokoju',
): string {
  return renderPnBalancePanelForTreaty(
    treatyEffectivePw,
    basketGivePn,
    basketReceivePn,
    relTotal,
    actionLabel,
    undefined,
    'Traktat pokoju',
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
