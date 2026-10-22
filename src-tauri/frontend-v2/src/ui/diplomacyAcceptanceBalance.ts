/**
 * diplomacyAcceptanceBalance.ts — panel punktów wymiany (PW) na stole negocjacji.
 * Używa AcceptanceSideBalance z diplomacy-acceptance-points (bez drugiego silnika).
 *
 * P5.2 (P5.13: UI nie liczy reguł gry): wszystkie liczby i decyzje akceptacji przychodzą z Rust
 * w DTO (`viewmodel/types.ts`: `PnBalancePanelDto`, `DiplomacyBasketPreviewDto`,
 * `DiplomacyTreatyBasketPreviewDto`, `RelationDealDto`, `AcceptanceSideBalanceDto`). Moduł tylko składa HTML.
 * Usunięte (reguły → Rust, tabela w `dyspozycje/rust-port/p5/P5-2-PORT-LEVEL0.md`):
 * `pickPrimaryNegotiationRow`, `balancePanelDataFromRow`, `filterActionableNegotiationRows`,
 * `balancePanelDataFromRows`, typ `NegotiationBalanceSource`.
 */
import type {
  AcceptanceSideBalanceDto as AcceptanceSideBalance,
  DiplomacyBasketPreviewDto,
  PnBalancePanelDto,
  DiplomacyTreatyBasketPreviewDto,
  RelationDealDto,
} from '../viewmodel/types';
import { formatLiczbaPl } from './formatPl';

/** P5.2: = `PnBalancePanelDto` (Rust); dawny interfejs web `PnBalancePanelData` (pin `:36-55`). */
export type PnBalancePanelData = PnBalancePanelDto;

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

function relationDealText(relation: RelationDealDto, context: RelationDealContext): string {
  const modPct = relation.modPct;
  if (context === 'trade') {
    if (relation.tradeParity) return 'parytet 1:1 przy uczciwej wymianie';
    const mult = formatLiczbaPl(relation.tradeFairMult);
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
  relation: RelationDealDto,
  context: RelationDealContext = 'treaty',
): string {
  const relTotal = relation.total;
  const modPct = relation.modPct;
  const tone = context === 'trade'
    ? (relation.tradeParity ? 'neutral' : 'worse')
    : relationModTone(modPct);
  const dealText = relationDealText(relation, context);
  const relDisplay = context === 'trade' && relation.tradeParity
    ? 'Relacja ≥100'
    : `Relacja ${formatLiczbaPl(relTotal)}`;
  const pctBadge = modPct !== 0
    ? '<span class="da-pn-rel-mod-pct">' + esc(formatModPctSigned(modPct)) + '</span>'
    : '';
  const balanceNote = context === 'treaty' && modPct !== 0
    ? ' <span class="da-pn-rel-mod-balance">(punkt balansu: 100)</span>'
    : '';
  const tip = ' title="' + esc(RELATION_DEAL_TOOLTIP + ' ' + relation.modLabel) + '"';

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
  relation: RelationDealDto,
): string {
  return renderRelationDealModRowHtml(relation, resolveRelationPanelContext(side));
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

/**
 * Netto PW: dodatnie = gracz oddaje więcej (przewaga partnera).
 *
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1 (GOAL a): czyta `data.theirBalance.balancePn` — TĘ SAMĄ
 * liczbę, którą `balancePanelDataFromRows` już zapisuje jako `unifiedPwBalance` (min po
 * `responderPreview.pwBalance` z evaluateProposal, gdy dostępny; surowe myOfferPn−theirOfferPn
 * TYLKO gdy żadna aktywna pozycja nie niesie numerycznego pwBalance) — zamiast osobno liczonej
 * różnicy myOfferPn−theirOfferPn, która dla pakietu wielopozycyjnego mogła się rozjechać z
 * bramką akceptacji (ta sama wartość, ten sam WZÓR co `canAccept` — patrz komentarz w
 * `balancePanelDataFromRows`). Dla pojedynczej pozycji liczby są bit-identyczne (fallback
 * `myOfferPn−theirOfferPn` uruchamia się w obu miejscach tym samym warunkiem), więc to nie
 * zmienia dziś wyświetlanej liczby w prostym przypadku — hartuje przeciw rozjazdowi w
 * pakiecie/koszyku wielopozycyjnym (kryterium 1 dispatchu).
 */
export function incomingTradeNetBalancePw(data: PnBalancePanelData): number {
  return data.theirBalance.balancePn;
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
  const relTotal = data.relation.total;
  const modPct = myBal?.relationModPct;
  const treatyNote = playerTreatyPw > 0 || partnerTreatyPw > 0
    ? treatyMetaHtml(playerTreatyPw, partnerTreatyPw, relTotal, 'Traktat', treatyBase)
    : '';

  const relModRow = relationRowFromBalance(their, data.relation);

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
  preview: Pick<DiplomacyBasketPreviewDto, 'givePn' | 'receivePn' | 'fairMinPn' | 'balancePn' | 'accepted' | 'relation'>,
  actionLabel = 'Wymiana',
): string {
  const givePn = preview.givePn;
  const receivePn = preview.receivePn;
  const relTotal = preview.relation.total;
  if (givePn == null || receivePn == null) {
    return (
      '<div class="da-pn-balance-bar idle da-pn-balance-bar--basket">'
      + '<div class="da-pn-bal-head">' + pwTitleHeadHtml() + '</div>'
      + '<div class="da-pn-bal-empty">Uzupełnij koszyk — wartości PW pojawią się tutaj.</div>'
      + '</div>'
    );
  }
  // P5.2: bilans, próg „fair min” i akceptacja z `DiplomacyBasketPreviewDto` — liczone w Rust TĄ SAMĄ
  // bramką co przyjęcie propozycji (P5-0 §6.6); web liczył tu `diplomacyFairGivePn`/`pnDealAcceptedByAi`.
  const balancePn = preview.balancePn;
  const previewFairMin = preview.fairMinPn;
  const accepted = preview.accepted;
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
    : 'Poniżej progu fair min (' + previewFairMin + ' PW) — ryzyko odrzucenia';

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
    + renderRelationDealModRowHtml(preview.relation, 'trade')
    // P-DYPLO-BILANS-GATE-NIESPOJNY (Maciej 2026-08-14): usunięta osobna linia "PW surowe
    // (bez Relacji) ... bilans +N" — pokazywała DRUGĄ, sprzeczną liczbę "bilans" tuż obok
    // powyższego, prawdziwego Bilansu (Oni) @ Relacji, dokładnie ten wzorzec zamieszania,
    // który zgłosił Maciej. Jedna liczba "Bilans" na panelu — ta @ Relacji, poniżej.
    + '<div class="da-pn-bal-meta">PW @ Rel ' + formatLiczbaPl(relTotal) + ': fair min ' + previewFairMin + ' · bilans '
    + (balancePn >= 0 ? '+' : '') + balancePn + '</div>'
    + '<div class="da-pn-bal-verdict ' + (accepted ? 'ok' : 'no') + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/**
 * Koszyk traktatu — asymetryczny PW (gracz @ Relacji, partner = baza) + koszyk.
 */
export function renderPnBalancePanelForTreaty(
  preview: DiplomacyTreatyBasketPreviewDto,
  actionLabel: string,
  treatyMetaLabel = 'Traktat',
): string {
  // P5.2: PW gracza/partnera @ Relacji, koszyk netto, bilans asymetryczny, bramka koszyka
  // (`treatyPnGate`) i akceptacja — wszystko z `DiplomacyBasketPreviewDto` dla `mode: 'treaty'`
  // (P5-0 §6.6: `treatyPw`, `givePn`/`receivePn`, `balancePn`, `accepted`; + `treatyGate`, Z9) liczone
  // w Rust; web liczył to tu (`treatyPwForRole`, `relationPnModPct`, `diplomacyFairGivePn`, `pnDealAcceptedByAi`).
  const gate = preview.treatyGate;
  const base = preview.treatyPw.base;
  const partnerPw = preview.treatyPw.their;
  const playerPw = preview.treatyPw.my;
  const relTotal = preview.relation.total;
  const modPct = preview.relation.modPct;
  const basketGivePn = preview.givePn ?? 0;
  const basketReceivePn = preview.receivePn ?? 0;
  const basketNet = gate.basketNet;
  const myDisplay = gate.myDisplayPw;
  const theirDisplay = gate.theirDisplayPw;
  const relRequired = gate.relRequired ?? undefined;
  const relOk = gate.relOk;
  const basketFair = gate.basketFair;
  const accepted = preview.accepted;
  const balancePn = preview.balancePn;
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
    + renderRelationDealModRowHtml(preview.relation, 'treaty')
    + treatyMetaHtml(playerPw, partnerPw, relTotal, treatyMetaLabel, base, basketNet)
    + relNote
    + '<div class="da-pn-bal-verdict ' + balCls + '">' + esc(verdict) + '</div>'
    + '</div>'
  );
}

/** @deprecated alias — użyj renderPnBalancePanelForTreaty */
export function renderPnBalancePanelForPeace(
  preview: DiplomacyTreatyBasketPreviewDto,
  actionLabel = 'Propozycja pokoju',
): string {
  // P5.2: web przekazywał `partnerTreatyPw = treatyBasePw` — teraz ta wartość jest w `preview.treatyPw.their` (Rust).
  return renderPnBalancePanelForTreaty(preview, actionLabel, 'Traktat pokoju');
}

/** Jednolinijkowy podgląd na karcie (gdy jest wiele propozycji na stole). */
export function renderAcceptanceCompactHtml(
  side: AcceptanceSideBalance | undefined,
  prefix: string,
  displayOfferPw: number,
): string {
  if (!side) return '';
  const cls = side.accepted ? 'ok' : 'no';
  // P5.2: suma PW karty (web: `sideDisplayOfferPw(side, bilateralPw)`) policzona w Rust.
  const displayPw = displayOfferPw;
  return (
    '<div class="da-accept-compact ' + cls + '">'
    + esc(prefix) + ': ' + displayPw + ' PW · saldo '
    + (side.balancePn >= 0 ? '+' + side.balancePn : String(side.balancePn))
    + ' · ' + esc(side.statusLabel)
    + '</div>'
  );
}
