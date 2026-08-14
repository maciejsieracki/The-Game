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
  treatyPwForRole,
} from '../game/diplomacy-pn-engine';
import { diplomacyFairGivePn } from '../game/diplomacy-value-catalog';
import { formatLiczbaPl } from './formatPl';

export interface NegotiationBalanceSource {
  id?: string;
  direction: 'own' | 'incoming';
  actionLabel: string;
  acceptanceMy?: AcceptanceSideBalance;
  acceptanceTheir?: AcceptanceSideBalance;
  canAccept?: boolean;
  /**
   * `pwBalance` (P-DYPLO-BILANS-GATE-NIESPOJNY, Maciej 2026-08-14): JEDNA liczba PW z TEJ
   * SAMEJ bramki, która policzyła `accepted` — patrz ProposalEvalResult w
   * diplomacy-proposals.ts. `undefined` gdy akcja nie ma numerycznej bramki PW.
   */
  responderPreview?: { accepted: boolean; reason?: string; pwBalance?: number };
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
  /**
   * `pwBalance` (P-DYPLO-BILANS-GATE-NIESPOJNY, Maciej 2026-08-14): JEDNA liczba PW z TEJ
   * SAMEJ bramki, która policzyła `accepted` — patrz ProposalEvalResult w
   * diplomacy-proposals.ts. `undefined` gdy akcja nie ma numerycznej bramki PW.
   */
  responderPreview?: { accepted: boolean; reason?: string; pwBalance?: number };
  canCounter?: boolean;
  uiActionId?: string;
}

/** Tooltip nagłówka PW — D-DYPLO-PW-NAZWA (Maciej 2026-07-29). */
export const PW_EXCHANGE_TOOLTIP =
  'Punkty wymiany (PW) mierzą bilans oferty na stole negocjacji. '
  + '„My oddajemy” vs „Oni oddają” — dodatni bilans oznacza, że możesz coś wyciągnąć lub przyjąć ofertę; '
  + 'ujemny bilans — trzeba dopłacić (surowce, ¤, ustępstwa). '
  + 'To nie jest waluta ¤ ani złoto-surowiec w magazynie.';

/** Tooltip wiersza wpływu Relacji na deal (Maciej 2026-08-04). */
export const RELATION_DEAL_TOOLTIP =
  'Relacja = Zaufanie + Respekt. Modyfikuje siłę PW tylko po Twojej stronie (max ±90%). '
  + 'Niska Relacja = niższe PW Twojej strony — trzeba dopłacić do bilansu. '
  + 'Partner zawsze na bazie traktatu.';

type RelationDealContext = 'treaty' | 'trade';

function formatModPctSigned(modPct: number): string {
  if (modPct === 0) return '0%';
  const pct = formatLiczbaPl(Math.abs(modPct));
  return modPct > 0 ? '+' + pct + '%' : '−' + pct + '%';
}

function relationModTone(modPct: number): 'better' | 'worse' | 'neutral' {
  if (modPct > 0) return 'better';
  if (modPct < 0) return 'worse';
  return 'neutral';
}

function relationDealText(relTotal: number, context: RelationDealContext): string {
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  if (context === 'trade') {
    if (relTotal >= 100) return 'parytet 1:1 przy uczciwej wymianie';
    const mult = formatLiczbaPl(100 / Math.max(1, relTotal));
    return `musisz dać więcej (×${mult} PW), by oferta była uczciwa`;
  }
  if (modPct === 0) return 'balans (0% — Ty i oni na bazie)';
  if (modPct > 0) return `Twoja strona silniejsza (${formatModPctSigned(modPct)} PW); oni: baza`;
  return `Twoja strona słabsza (${formatModPctSigned(modPct)} PW); oni: baza`;
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
    : `Relacja ${formatLiczbaPl(relTotal)}`;
  const pctBadge = modPct !== 0
    ? '<span class="da-pn-rel-mod-pct">' + esc(formatModPctSigned(modPct)) + '</span>'
    : '';
  const balanceNote = context === 'treaty' && modPct !== 0
    ? ' <span class="da-pn-rel-mod-balance">(punkt balansu: 100)</span>'
    : '';
  const tip = ' title="' + esc(RELATION_DEAL_TOOLTIP + ' ' + formatRelationModLabel(relTotal)) + '"';

  return (
    '<div class="da-pn-rel-mod ' + tone + '"' + tip + '>'
    + '<span class="da-pn-rel-mod-label">Wpływ Relacji na deal</span>'
    + pctBadge
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

function pwAmountWithBaseHtml(pw: number, basePw?: number, modPct?: number, extraCls = ''): string {
  const cls = 'da-pn-bal-num' + (extraCls ? ' ' + extraCls : '');
  const pwLine = '<span class="da-pn-bal-pw"' + pwTipAttr() + '>' + pw + ' PW</span>';
  if (basePw != null && basePw > 0 && basePw !== pw) {
    const modHint = modPct != null && modPct !== 0
      ? `, Relacja ${formatModPctSigned(modPct)} siła`
      : '';
    return '<span class="' + cls + '">'
      + pwLine
      + '<span class="da-pn-bal-base" title="Baza traktatu">(baza ' + basePw + modHint + ')</span>'
      + '</span>';
  }
  return '<span class="' + cls + '"' + pwTipAttr() + '>' + pw + ' PW</span>';
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

/** Wiersze wymagające decyzji gracza na stole (pakiet Przyjmij/Odrzuć). */
export function filterActionableNegotiationRows(
  rows: readonly NegotiationBalanceSource[],
): NegotiationBalanceSource[] {
  return rows.filter(
    r => r.direction === 'incoming' || (r.direction === 'own' && r.awaitingAiResponse),
  );
}

/** R-DYPLO-STOL-PW-SUM + R-DYPLO-STOL-ACCEPT-Q1=A — suma PW pakietu + jedna decyzja. */
export function balancePanelDataFromRows(
  rows: readonly NegotiationBalanceSource[],
): PnBalancePanelData | null {
  const actionable = filterActionableNegotiationRows(rows);
  if (actionable.length === 0) {
    const primary = pickPrimaryNegotiationRow(rows);
    return primary ? balancePanelDataFromRow(primary, Math.max(0, rows.length - 1)) : null;
  }
  const primary = pickPrimaryNegotiationRow(actionable) ?? actionable[0]!;
  const base = balancePanelDataFromRow(primary, Math.max(0, actionable.length - 1));
  if (!base) return null;

  let myOfferPn = 0;
  let theirOfferPn = 0;
  let blockReason: string | undefined;
  // P-DYPLO-BILANS-GATE-NIESPOJNY (Maciej 2026-08-14): gdy jest DOKŁADNIE jedna pozycja
  // aktualna (typowy przypadek — pojedynczy "Traktat handlowy"/"Umowa wymiany" bez pakietu,
  // patrz dyspozycje/PYTANIA-OTWARTE.md) i jej bramka ma numeryczny próg PW
  // (responderPreview.pwBalance z evaluateProposal), użyj TEJ liczby jako JEDYNEGO
  // wyświetlanego "Bilans" — zamiast osobno liczonej, surowej różnicy givePn-receivePn
  // (`net` niżej), która ignorowała relację/mnożnik chęci partnera i dawała np. "+30" mimo
  // że ta sama bramka odrzucała ofertę jako "wymagane ≥ 73 PW".
  //
  // RUNDA 2 (N4, Evaluator FAIL c94de5c8): dla pakietu >1 pozycji SUMA pwBalance NIE
  // wystarcza jako kryterium — zmierzony przykład: 213 + (−77) = +136 ≥ 0 (zielone), mimo
  // że druga pozycja z osobna jest nieuczciwa i realna bramka (canAccept, per-pozycja)
  // blokuje pakiet. Jedna słaba pozycja nie może zostać "wyprana" nadwyżką innej — każda
  // pozycja pakietu musi być uczciwa z osobna. `unifiedPwBalance` dla pakietu to teraz
  // MIN po wszystkich pozycjach z numerycznym pwBalance (spójne z tym, że pakiet i tak
  // jest odrzucany przez blockReason, gdy KTÓRAKOLWIEK pozycja ma accepted=false — to
  // wyświetlany "Bilans" dogania rzeczywistą bramkę, a nie odwrotnie). Gdy choć jedna
  // aktywna pozycja nie ma numerycznego pwBalance (np. nap/sojusz bez bramki PW), min nie
  // ma sensu — zostaje dawny surowy `net` (myOfferPn−theirOfferPn), jak przed tą rundą.
  let unifiedPwBalance: number | undefined;
  let minPwBalance: number | undefined;
  let allActionableHavePwBalance = true;

  for (const row of actionable) {
    const d = balancePanelDataFromRow(row, 0);
    if (!d) continue;
    myOfferPn += d.myOfferPn;
    theirOfferPn += d.theirOfferPn;
    // R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A: responderPreview (evaluateProposal, package-aware
    // od Q2 dla umowa_szlakow/umowa_handlowa — patrz main.ts previewNegotiationEntry) jest
    // JEDYNYM źródłem prawdy, tym samym, którego użyje backend przy realnym wysłaniu
    // (handleRequestAiNegotiationResponse → resolveNegotiationEntryAt → ta sama
    // evaluateProposal). `acceptanceTheir.accepted` (computePlayerAcceptanceSides) to
    // RÓWNOLEGŁA, nie-package-aware kalkulacja wyświetlania — poleganie na niej TU dawało
    // false negative: traktat bez własnego koszyka pokryty sąsiadem na stole (panel sumuje
    // PW poprawnie — patrz net niżej) i tak blokował Przyjmij, bo jego WŁASNY (nie-pakietowy)
    // bilans wciąż wychodził ujemny (BUG-PAKIET-BILANS-DODATNI-BLOKADA).
    //
    // BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA: ten sam responderPreview bramkuje TAKŻE
    // wiersze incoming (nie tylko `own` powyżej) — to dokładnie ta sama funkcja
    // (previewNegotiationEntry), którą realne wykonanie woła PER POZYCJA
    // (main.ts handleNegotiationAcceptPackage → handleNegotiationAccept → previewNegotiationEntry).
    // Wcześniej incoming było bramkowane wyłącznie SUMĄ PW całego stołu (`net >= 0` niżej) —
    // suma dodatnia z jedną pozycją, która sama nie przechodzi swojej bramki (np. czysty
    // traktat bez koszyka, gdzie `computeIncomingPlayerAcceptNetPw` zwraca null i
    // `row.canAccept` jest zawsze `true`), aktywowała przycisk „Przyjmij pakiet"; kliknięcie
    // wykonywało pakiet CZĘŚCIOWO — ta jedna pozycja odrzucana osobno, z toastem, reszta
    // wykonana. `net` niżej zostaje jako WYŚWIETLANY bilans (opis), nie jako bramka.
    // P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN: brak responderPreview (pole opcjonalne w typie) NIE
    // może domyślnie dawać canAccept=true (fail-open) — fail-closed, jak każda inna bramka
    // bezpieczeństwa. Dziś main.ts zawsze ustawia preview (previewNegotiationEntry wołane
    // bezwarunkowo w buildPendingNegotiationRows), więc nieosiągalne w praktyce, ale funkcja
    // nie może na tym polegać (defensywnie, nie z założenia "zawsze ustawione").
    const isActionableDirection = row.direction === 'incoming'
      || (row.direction === 'own' && row.awaitingAiResponse);
    if (isActionableDirection) {
      if (row.responderPreview == null) {
        blockReason = 'Brak podglądu odpowiedzi (responderPreview) — nie można potwierdzić akceptacji';
      } else if (row.responderPreview.accepted === false) {
        blockReason = row.responderPreview.reason
          ?? (row.direction === 'incoming' ? 'Warunki niespełnione' : 'Oferta nieuczciwa dla partnera');
      }
      if (row.responderPreview?.pwBalance != null) {
        minPwBalance = minPwBalance == null
          ? row.responderPreview.pwBalance
          : Math.min(minPwBalance, row.responderPreview.pwBalance);
      } else {
        allActionableHavePwBalance = false;
      }
    }
  }
  // Gdy actionable.length === 1, min po jednej wartości = ta wartość — zachowuje się
  // dokładnie jak dawne `unifiedPwBalance` dla pojedynczej pozycji (bez zmiany).
  unifiedPwBalance = allActionableHavePwBalance ? minPwBalance : undefined;

  const net = unifiedPwBalance ?? (myOfferPn - theirOfferPn);
  const canAccept = blockReason == null;

  const statusLabel = net > 0
    ? `Nadwyżka +${net} PW`
    : net === 0
      ? 'Spełnia warunki (0 PW)'
      : `Brakuje ${Math.abs(net)} PW`;

  const theirBalance = {
    ...base.theirBalance,
    balancePn: net,
    accepted: net >= 0,
    statusLabel,
  };
  const myBalance = base.myBalance
    ? { ...base.myBalance, balancePn: net, accepted: net >= 0, statusLabel }
    : undefined;

  return {
    ...base,
    actionLabel: actionable.length > 1
      ? `Pakiet na stole (${actionable.length} umów)`
      : base.actionLabel,
    myOfferPn,
    theirOfferPn,
    theirBalance,
    myBalance,
    canAccept,
    extraOnTable: 0,
    responderPreview: canAccept ? base.responderPreview : { accepted: false, reason: blockReason },
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
    if (isIncomingBasketTradePanel(data) && data.canAccept === false) {
      const net = incomingTradeNetBalancePw(data);
      return {
        tone: 'no',
        html: net < 0
          ? `Przewaga u Ciebie — oferta nieuczciwa dla partnera (${Math.abs(net)} PW)`
          : 'Nie można przyjąć — warunki niespełnione',
      };
    }
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

function treatyMetaHtml(
  playerTreatyPw: number,
  partnerTreatyPw: number,
  relTotal: number,
  treatyMetaLabel: string,
  treatyBasePw?: number,
  basketNet?: number,
): string {
  const base = treatyBasePw ?? partnerTreatyPw;
  const playerPart = base > 0 && playerTreatyPw !== base
    ? 'Ty: baza ' + base + ' → ' + playerTreatyPw + ' PW'
    : 'Ty: ' + playerTreatyPw + ' PW';
  const partnerPart = ' · Oni: ' + partnerTreatyPw + ' PW (baza)';
  const basketPart = basketNet != null && (basketNet > 0 || (basketNet === 0 && base > 0))
    ? ' · koszyk netto ' + (basketNet > 0 ? '+' + basketNet : '0') + ' PW'
    : '';
  return '<div class="da-pn-bal-meta">' + esc(treatyMetaLabel) + ': ' + playerPart + partnerPart
    + ' @ Rel ' + formatLiczbaPl(relTotal) + basketPart + '</div>';
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
  const myBal = data.myBalance;
  const incomingTrade = isIncomingBasketTradePanel(data);
  const isTreatyMode = (myBal?.mode === 'treaty' || myBal?.mode === 'mixed'
    || their.mode === 'treaty' || their.mode === 'mixed')
    && !incomingTrade;
  // P-DYPLO-BILANS-GATE-NIESPOJNY runda 2 (N2, Evaluator FAIL c94de5c8): tryb traktatu
  // dawniej liczył netPw jako SUROWĄ różnicę myOfferPn−theirOfferPn zamiast czytać
  // `their.balancePn` — pole, do którego balancePanelDataFromRows zapisuje JEDNĄ,
  // spójną z bramką liczbę (unifiedPwBalance z evaluateProposal, gdy dostępna).
  // Renderer dla traktatów nigdy tego pola nie odczytywał, więc naprawa rundy 1
  // (dopisanie pwBalance do ProposalEvalResult) nie miała jak dotrzeć do ekranu
  // „Traktat handlowy". Teraz oba tryby (traktat / handel) czytają to samo źródło.
  // EN: treaty mode used to recompute a raw myOfferPn−theirOfferPn difference instead
  // of reading `their.balancePn` — the field balancePanelDataFromRows writes the one
  // gate-consistent number into. This renderer never read it, so round 1's fix
  // (adding pwBalance to ProposalEvalResult) never reached the "Traktat handlowy"
  // screen. Both modes now read the same source.
  const netPw = incomingTrade
    ? incomingTradeNetBalancePw(data)
    : their.balancePn;
  const treatyAccepted = myBal?.accepted ?? their.accepted;
  // P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC-VS-CANACCEPT: w trybie traktatu kolor i hint muszą iść
  // za data.canAccept (ten sam responderPreview per-pozycja, który bramkuje przycisk Przyjmij
  // w balancePanelDataFromRows), NIE za surowym znakiem netPw — inaczej panel pokazuje "no"
  // (czerwony) + hint "Brakuje...dopłać" mimo aktywnego przycisku (net ujemny, ale
  // canAccept=true, bo per-pozycja przechodzi), albo odwrotnie "ok" mimo zablokowanego
  // przycisku (net dodatni, ale canAccept=false — oryginalny
  // BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA). Gdy canAccept jest undefined (jedyny fallback:
  // pojedynczy wiersz 'own' nie-awaitingAiResponse, poza pakietem — patrz
  // balancePanelDataFromRow), zostaje stare zachowanie oparte na myBal/their.accepted. netPw
  // (liczba w `delta` niżej) zostaje niezmieniony — wyłącznie wyświetlany bilans informacyjny.
  const treatyModeAccepted = data.canAccept != null ? data.canAccept : treatyAccepted;
  const balCls = incomingTrade
    ? (data.canAccept !== false ? 'ok' : 'no')
    : isTreatyMode
      ? (treatyModeAccepted ? 'ok' : 'no')
      : (treatyAccepted ? 'ok' : 'no');
  const delta = incomingTrade || isTreatyMode
    ? (netPw > 0 ? `+${netPw}` : String(netPw))
    : formatBalanceDelta(their.balancePn, their.accepted);
  const deltaCls = netPw >= 0 ? 'pos' : 'neg';
  const centerLabel = incomingTrade || isTreatyMode ? 'Bilans (netto)' : 'Bilans (Oni)';
  const hint = incomingTrade
    ? incomingTradeBalanceHint(netPw)
    : isTreatyMode
      ? (!treatyModeAccepted
        ? (data.responderPreview?.reason ?? their.statusLabel ?? 'Nie spełnia warunków')
        : netPw < 0
          ? `Spełnia warunki (bilans ${netPw} PW)`
          : netPw > 0
            ? `Nadwyżka +${netPw} PW`
            : 'Równo — spełnia')
      : balanceHint(their);
  const verdict = verdictHtml(data);
  const extraNote = (data.extraOnTable ?? 0) > 0
    ? '<span class="da-pn-bal-more">+' + data.extraOnTable + ' inna na stole</span>'
    : '';

  const playerTreatyPw = myBal?.treatyEffectivePn ?? 0;
  const partnerTreatyPw = their.treatyEffectivePn ?? their.treatyBasePn ?? 0;
  const treatyBase = myBal?.treatyBasePn ?? their.treatyBasePn ?? 0;
  const relTotal = their.relCurrent ?? myBal?.relCurrent ?? 100;
  const modPct = myBal?.relationModPct;
  const treatyNote = playerTreatyPw > 0 || partnerTreatyPw > 0
    ? treatyMetaHtml(playerTreatyPw, partnerTreatyPw, relTotal, 'Traktat', treatyBase)
    : '';

  const relModRow = relationRowFromBalance(their, data.myBalance);

  const relNote = their.relRequired != null && their.relBalance != null && their.relBalance < 0
    ? '<div class="da-pn-bal-meta warn">Relacja ' + formatLiczbaPl(their.relCurrent ?? 0)
      + ' — wym. ' + formatLiczbaPl(their.relRequired) + '</div>'
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
    + (playerTreatyPw > 0
      ? pwAmountWithBaseHtml(data.myOfferPn, treatyBase, modPct)
      : pwAmountHtml(data.myOfferPn))
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
    // P-DYPLO-BILANS-GATE-NIESPOJNY (Maciej 2026-08-14): usunięta osobna linia "PW surowe
    // (bez Relacji) ... bilans +N" — pokazywała DRUGĄ, sprzeczną liczbę "bilans" tuż obok
    // powyższego, prawdziwego Bilansu (Oni) @ Relacji, dokładnie ten wzorzec zamieszania,
    // który zgłosił Maciej. Jedna liczba "Bilans" na panelu — ta @ Relacji, poniżej.
    + '<div class="da-pn-bal-meta">PW @ Rel ' + formatLiczbaPl(relTotal) + ': fair min ' + fairMin + ' · bilans '
    + (balancePn >= 0 ? '+' : '') + balancePn + '</div>'
    + '<div class="da-pn-bal-verdict ' + (accepted ? 'ok' : 'no') + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/**
 * Koszyk traktatu — asymetryczny PW (gracz @ Relacji, partner = baza) + koszyk.
 */
export function renderPnBalancePanelForTreaty(
  playerTreatyPw: number,
  basketGivePn: number,
  basketReceivePn: number,
  relTotal: number,
  actionLabel: string,
  relRequired?: number,
  treatyMetaLabel = 'Traktat',
  treatyBasePw?: number,
  partnerTreatyPw?: number,
): string {
  const base = treatyBasePw ?? partnerTreatyPw ?? playerTreatyPw;
  const partnerPw = partnerTreatyPw ?? treatyPwForRole(base, relTotal, 'partner');
  const playerPw = playerTreatyPw > 0 ? playerTreatyPw : treatyPwForRole(base, relTotal, 'player');
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  const basketNet = Math.max(0, basketGivePn - basketReceivePn);
  const myDisplay = playerPw + basketGivePn;
  const theirDisplay = partnerPw + basketReceivePn;
  const asymBalance = myDisplay - theirDisplay;
  const relOk = relRequired == null || relTotal >= relRequired;
  // P-DYPLO-BILANS-GATE-NIESPOJNY runda 2 (N5, Evaluator FAIL c94de5c8): ten live-podgląd
  // liczył WYŁĄCZNIE asymBalance (baza traktatu @ Relacji + koszyk) — pomijał, że
  // treatyPnGate w silniku odrzuca DODATKOWO każdy koszyk z basketReceivePn>0, który sam
  // z siebie nie przechodzi pnDealAcceptedByAi @ Relacji, NIEZALEŻNIE od tego, czy suma z
  // bazą traktatu wychodzi na plus. Zmierzone (110 PW vs 50 PW @ Relacja 27,8): podgląd
  // pokazywał "Bilans +2" (zielone), a realna bramka wymagała aż 180 PW — rozjazd 70 PW
  // (39% progu), bo brakowało dokładnie tego sprawdzenia. `basketFairMin`/`basketFair` to
  // TA SAMA matematyka co treatyPnGate (diplomacyFairGivePn + pnDealAcceptedByAi) — ta
  // funkcja nadal nie ma dostępu do mnożnika chęci AI per-akcja (udokumentowany,
  // mniejszy pozostały gap, patrz PYTANIA-OTWARTE.md), ale już nie pomija samą bramkę.
  // EN: this live preview only summed the treaty-base-adjusted asymBalance — it ignored
  // that the engine's treatyPnGate additionally rejects any basket with
  // basketReceivePn>0 that fails pnDealAcceptedByAi @ Relation on its own, regardless of
  // the treaty-base sum. Measured gap: preview showed a green "+2" while the real gate
  // required up to 180 PW. `basketFairMin`/`basketFair` mirror treatyPnGate's exact math;
  // the AI-willingness-multiplier gap remains a separate, smaller, documented residual.
  const basketFairMin = basketReceivePn > 0
    ? diplomacyFairGivePn(basketReceivePn, Math.min(100, relTotal))
    : 0;
  const basketFair = basketReceivePn <= 0
    || pnDealAcceptedByAi(basketGivePn, basketReceivePn, relTotal);
  const accepted = relOk && asymBalance >= 0 && basketFair;
  const balancePn = basketFair ? asymBalance : (basketGivePn - basketFairMin);
  const balCls = accepted ? 'ok' : 'no';
  const delta = formatBalanceDelta(balancePn, accepted);
  const deltaCls = balancePn >= 0 ? 'pos' : 'neg';
  // KOREKTA 2026-08-10 (P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA, poprzedni komentarz z dziś rano
  // 5a93f5aa był nieaktualny — patrz PYTANIA-OTWARTE.md): ta funkcja to WSPÓLNY
  // renderer dla wszystkich typów traktatu z koszykiem (sojusz/pakt/wasal/pokój/
  // wchłonięcie — wołana z treatySummaryHtml w diplomacyTradeBasket.ts z
  // basketGivePn/basketReceivePn policzonymi z REALNYCH giveItems/receiveItems, które
  // gracz właśnie edytuje w TYM SAMYM formularzu, w kolumnach „My oddajemy/Oni oddają
  // (opcjonalnie)"). Formularz koszyk MA — to nie jest „traktat bez koszyka". Warunek
  // `balancePn < 0` niżej po prostu znaczy: przy aktualnej treści koszyka (może być
  // pusta, jeśli gracz jeszcze nic nie dołożył) bilans jest ujemny, więc komunikat
  // kieruje do zawarcia osobnej umowy zamiast sugerować dopłatę „na już" w pustym
  // koszyku. Część C R-DYP-STOL-A (koszyk dla WSZYSTKICH traktatów) jest dziś w
  // praktyce niemal domknięta (4 z 5 typów z pierwotnego zgłoszenia); jedyna realna
  // luka to wojna (aid '11') — kategorialnie inny temat, jednostronna akcja gracza bez
  // negocjacji/akceptacji AI, poza tym systemem propozycji w ogóle.
  // EN: shared renderer for every basket-enabled treaty type (alliance/pact/vassal/
  // peace/absorption), called with the LIVE basket contents the player is editing in
  // this exact form — the form already has a basket. `balancePn < 0` just means the
  // current (possibly still-empty) basket doesn't close the gap, so the message
  // points to a separate deal rather than "top up" an empty basket. R-DYP-STOL-A part
  // C is effectively done for these types; the only real gap is war, outside this
  // proposal system entirely.
  const hint = !relOk
    ? `Relacja ${formatLiczbaPl(relTotal)} — wym. ${formatLiczbaPl(relRequired!)}`
    : !basketFair
      ? `Brakuje ${Math.abs(balancePn)} PW w koszyku @ Relacji`
      : (balancePn < 0
        ? `Brakuje ${Math.abs(balancePn)} PW — zawrzyj osobną umowę`
        : balancePn > 0
          ? `Nadwyżka ${balancePn} PW`
          : 'Równo — spełnia');
  const verdict = !relOk
    ? `Relacja ${formatLiczbaPl(relTotal)} — wymagane ≥ ${formatLiczbaPl(relRequired!)}`
    : !basketFair
      ? `Oferta nieuczciwa dla partnera — poniżej wartości PW @ Relacji (masz ${basketGivePn} PW, potrzeba więcej wobec ${basketReceivePn} PW od partnera)`
      : (balancePn < 0
        ? `Zawrzyj osobną umowę na ${Math.abs(balancePn)} PW (Twoja strona słabsza przy tej Relacji)`
        : balancePn > 0
          ? 'Partner prawdopodobnie przyjmie — nadwyżka ' + balancePn + ' PW'
          : treatyMetaLabel + ': Ty ' + playerPw + ' PW · Oni ' + partnerPw + ' PW — spełnione');

  const relNote = !relOk
    ? '<div class="da-pn-bal-meta warn">Relacja ' + formatLiczbaPl(relTotal)
      + ' — wym. ' + formatLiczbaPl(relRequired!) + '</div>'
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
    + pwAmountWithBaseHtml(myDisplay, base, modPct)
    + '</div>'
    + '<div class="da-pn-bal-cell center ' + balCls + '">'
    + '<span class="da-pn-bal-lbl">Bilans (netto)</span>'
    + '<span class="da-pn-bal-num ' + deltaCls + '"' + pwTipAttr() + '>' + esc(delta) + '</span>'
    + '<span class="da-pn-bal-hint">' + esc(hint) + '</span>'
    + '</div>'
    + '<div class="da-pn-bal-cell they">'
    + '<span class="da-pn-bal-lbl">Oni oddają</span>'
    + pwAmountHtml(theirDisplay)
    + '</div>'
    + '</div>'
    + renderRelationDealModRowHtml(relTotal, 'treaty')
    + treatyMetaHtml(playerPw, partnerPw, relTotal, treatyMetaLabel, base, basketNet)
    + relNote
    + '<div class="da-pn-bal-verdict ' + balCls + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/** @deprecated alias — użyj renderPnBalancePanelForTreaty */
export function renderPnBalancePanelForPeace(
  playerTreatyPw: number,
  basketGivePn: number,
  basketReceivePn: number,
  relTotal: number,
  actionLabel = 'Propozycja pokoju',
  treatyBasePw?: number,
): string {
  return renderPnBalancePanelForTreaty(
    playerTreatyPw,
    basketGivePn,
    basketReceivePn,
    relTotal,
    actionLabel,
    undefined,
    'Traktat pokoju',
    treatyBasePw,
    treatyBasePw != null ? treatyBasePw : undefined,
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
