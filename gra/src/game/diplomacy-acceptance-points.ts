/**
 * diplomacy-acceptance-points.ts — punkty akceptacji stołu negocjacji (Maciej 2026-07-29).
 * Traktaty: stałe PN bazowe z diplomacy-acceptance-points.json.
 * Koszyk: runtime PN z diplomacy-value-catalog / resolveProposalPn.
 */
import acceptanceJson from '../../data/diplomacy-acceptance-points.json';
import type { GameDifficulty } from './difficulty-cost';
import type { ProposalActionId, ProposalPayload } from './diplomacy-proposals';
import { sweetenerEasePoints, treatyDurationPnMultiplier } from './diplomacy-proposals';
import { diplomacyFairGivePn } from './diplomacy-value-catalog';
import {
  effectiveTreatyPnRequired,
  formatRelationModLabel,
  pnDealAcceptedByAi,
  proposalPnTurnsMultiplier,
  relationPnModPct,
  relationSignedFromTotal,
  resolveProposalPn,
  treatyPwForRole,
  type ResolveProposalPnOptions,
} from './diplomacy-pn-engine';
import { splitNegotiationDealPlayerSides } from './diplomacy-display';

export interface TreatyAcceptanceDef {
  punkty: number;
  jednostka: string;
  prog_relacja?: number;
  prog_respekt?: number;
  prog_zaufanie?: number;
  uwaga?: string;
}

export interface AcceptanceSideBalance {
  /** Suma PN oddawana (koszyk). */
  offerPn: number;
  /** Suma PN oczekiwana w zamian (koszyk). */
  demandPn: number;
  /** Minimalna suma PN wymagana @ Relacji (fair min). */
  fairMinPn: number;
  /** Saldo: offerPn − fairMinPn (+ nadwyżka, − brakuje). */
  balancePn: number;
  /** PN bazowe samego traktatu (gdy dotyczy). */
  treatyBasePn: number;
  /** PN traktatu po modyfikatorze Relacji (−90…+90%). */
  treatyEffectivePn?: number;
  /** Modyfikator Relacji % (clamp ±90). */
  relationModPct?: number;
  /** Etykieta UI modyfikatora relacji. */
  relationModLabel?: string;
  /** Próg Relacji wymagany (traktaty). */
  relRequired?: number;
  relCurrent?: number;
  /** relCurrent − relRequired (+ spełnione, − brakuje). */
  relBalance?: number;
  /** gift = jednostronny dar; basket = wymiana PN; treaty = głównie próg relacji. */
  mode: 'gift' | 'basket' | 'treaty' | 'mixed';
  /** Krótki opis dla UI. */
  statusLabel: string;
  accepted: boolean;
}

type AcceptanceConfig = typeof acceptanceJson;

const CONFIG = acceptanceJson as AcceptanceConfig;

export function loadTreatyAcceptanceDef(actionId: string): TreatyAcceptanceDef | undefined {
  const t = CONFIG.traktaty as Record<string, TreatyAcceptanceDef | undefined>;
  return t[actionId];
}

/**
 * R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1: `payload` opcjonalny — gdy podany, baza jest
 * przemnożona przez `treatyDurationPnMultiplier` (helper wspólny z `treatyBasePnFromConfig`
 * w diplomacy-proposals.ts — TA SAMA funkcja, nie duplikat wzoru; efekt realny tylko dla
 * `nap`, jedynego traktatu z selektorem czasu trwania w UI).
 */
export function treatyBaseAcceptancePn(actionId: string, payload?: Pick<ProposalPayload, 'turns'>): number {
  const base = loadTreatyAcceptanceDef(actionId)?.punkty ?? 0;
  return payload ? base * treatyDurationPnMultiplier(actionId, payload) : base;
}

/** PW traktatu po stronie gracza (My) — z moda Relacji. */
export function playerTreatyDisplayPw(side?: AcceptanceSideBalance): number | undefined {
  if (!side) return undefined;
  const pw = side.treatyEffectivePn ?? 0;
  return pw > 0 ? pw : undefined;
}

/** PW traktatu po stronie partnera (Oni) — baza bez moda. */
export function partnerTreatyDisplayPw(side?: AcceptanceSideBalance): number | undefined {
  if (!side) return undefined;
  const base = side.treatyBasePn ?? 0;
  if (base <= 0) return undefined;
  const pw = side.treatyEffectivePn ?? base;
  return pw > 0 ? pw : undefined;
}

/**
 * @deprecated Asymetryczny model — użyj playerTreatyDisplayPw / partnerTreatyDisplayPw.
 * Zwraca PW gracza gdy dostępne, inaczej bazę partnera (kompatybilność wsteczna).
 */
export function bilateralTreatyDisplayPw(
  my?: AcceptanceSideBalance,
  their?: AcceptanceSideBalance,
): number | undefined {
  const mode = my?.mode ?? their?.mode;
  if (mode !== 'treaty' && mode !== 'mixed') return undefined;
  const playerPw = playerTreatyDisplayPw(my);
  if (playerPw != null) return playerPw;
  const partnerPw = partnerTreatyDisplayPw(their);
  if (partnerPw != null) return partnerPw;
  const base = my?.treatyBasePn ?? their?.treatyBasePn;
  return base != null && base > 0 ? base : undefined;
}

/** Suma PW widoczna na karcie stołu: koszyk + wartość traktatu (dwustronny lub po stronie proponenta). */
export function sideDisplayOfferPw(
  side: AcceptanceSideBalance | undefined,
  bilateralTreatyPw?: number,
): number {
  if (!side) return bilateralTreatyPw ?? 0;
  const basket = side.offerPn;
  const ownTreaty = side.treatyEffectivePn ?? 0;
  if (ownTreaty > 0) return basket + ownTreaty;
  if (
    (side.mode === 'treaty' || side.mode === 'mixed')
    && bilateralTreatyPw != null
    && bilateralTreatyPw > 0
  ) {
    return basket + bilateralTreatyPw;
  }
  return basket;
}

/** Czy po stronie gracza (My) jest realna treść oferty — nie pusty „—". */
export function playerSideHasBasketOffer(payload: ProposalPayload, incoming: boolean): boolean {
  const split = splitNegotiationDealPlayerSides(payload, incoming);
  if (!split) return false;
  return split.weOffer.length > 0;
}

/** Jednostronny dar od drugiej strony (My puste, Oni coś dają). */
export function isPlayerIncomingGift(payload: ProposalPayload): boolean {
  const split = splitNegotiationDealPlayerSides(payload, true);
  if (!split) return false;
  return split.weOffer.length === 0 && split.theyOffer.length > 0;
}

/**
 * U2 (Evaluator, Maciej): akcje, dla których baza PW traktatu jest REALNYM wymogiem gdy
 * GRACZ jest proponentem (own) — czyli mirror `treatyBaseFairnessGap` w diplomacy-proposals.ts,
 * wołane tam WYŁĄCZNIE `if (proposerIsPlayer/proposerIsTreatyPlayer)` wewnątrz case'ów
 * `umowa_handlowa`/`umowa_szlakow` ('pokoj' ma analogiczną, ale ODDZIELNĄ bramkę realizowaną
 * przez computePeaceAcceptanceSides, więc tu nie występuje). Case'y `nap`/`sojusz_defensywny`/
 * `sojusz_pelny`/`wasal`/`granice` w evaluateProposal NIE mają ŻADNEGO PW-fairness gate —
 * niezależnie od tego, kto jest proponentem — mają wyłącznie własne progi Relacji/Zaufania/
 * Respektu (progNapRelacja/progSojuszRelacja/progWasalizacjaRespekt/progGraniceRelacja).
 * Przed naprawą kod niżej stosował gate `asymBalance >= 0` do WSZYSTKICH traktatów z
 * treatyBase>0 gdy proponentem był gracz — dawało to fałszywe „Brakuje N PW — zawrzyj osobną
 * umowę" (accepted=false) na w pełni akceptowalnych przez silnik propozycjach (np. NAP @ Rel
 * 61/200: baza gracza po rabacie Relacji 122, partner na stałej bazie 200 → sztuczny deficyt
 * −78 PW, mimo że evaluateProposal dla tej samej propozycji zwraca accepted:true — case 'nap'
 * sprawdza tylko `score < napThreshold`, progNapRelacja=110, 61≥50).
 * / EN: actions where the treaty base PW is a REAL requirement when the PLAYER proposes
 * (own) — mirrors `treatyBaseFairnessGap` in diplomacy-proposals.ts, called there ONLY
 * `if (proposerIsPlayer/proposerIsTreatyPlayer)` inside the `umowa_handlowa`/`umowa_szlakow`
 * cases ('pokoj' has an analogous but SEPARATE gate via computePeaceAcceptanceSides, so it
 * never reaches here). The `nap`/`sojusz_defensywny`/`sojusz_pelny`/`wasal`/`granice` cases in
 * evaluateProposal have NO PW-fairness gate at all, for either proposer — only their own
 * Relation/Trust/Respect thresholds. Before the fix, the code below applied the
 * `asymBalance >= 0` gate to EVERY treaty with treatyBase>0 whenever the player proposed,
 * producing a false "Missing N PW" (accepted=false) on offers the engine fully accepts (e.g.
 * NAP @ Relation 61/200: player base after the Relation discount is 122, partner stays at the
 * fixed base 200 → artificial −78 PW deficit, even though evaluateProposal accepts the same
 * proposal — the 'nap' case only checks `score < napThreshold`, progNapRelacja=110, 61≥50).
 */
const OWN_PROPOSER_TREATY_PW_GATE_ACTIONS: ReadonlySet<string> = new Set<string>([
  'umowa_handlowa',
  'umowa_szlakow',
]);

function formatBalanceLabel(balancePn: number, accepted: boolean): string {
  if (accepted && balancePn > 0) return `Nadwyżka +${balancePn} PW`;
  if (accepted && balancePn === 0) return 'Spełnia warunki (0 PW)';
  if (balancePn < 0) return `Brakuje ${Math.abs(balancePn)} PW`;
  return `Saldo ${balancePn} PW`;
}

/**
 * Pokój: asymetryczny PW traktatu (gracz @ Relacji, partner = baza) + słodzik netto.
 */
function computePeaceAcceptanceSides(
  givePn: number,
  receivePn: number,
  relTotal: number,
  treatyBase: number,
  incoming: boolean,
  mode: 'treaty' | 'mixed',
): { my: AcceptanceSideBalance; their: AcceptanceSideBalance } {
  const playerTreatyPw = treatyPwForRole(treatyBase, relTotal, 'player');
  const partnerTreatyPw = treatyPwForRole(treatyBase, relTotal, 'partner');
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  const modLabel = formatRelationModLabel(relTotal);
  const proposerIsPlayer = !incoming;
  const proposerTreatyPw = proposerIsPlayer ? playerTreatyPw : partnerTreatyPw;
  const proposerGive = incoming ? receivePn : givePn;
  const proposerReceive = incoming ? givePn : receivePn;
  const basketNet = Math.max(0, proposerGive - proposerReceive);
  const proposerOfferPn = proposerTreatyPw + basketNet;
  const peaceAccepted = proposerOfferPn >= proposerTreatyPw;
  const surplusPn = proposerOfferPn - proposerTreatyPw;

  const myBasketOffer = incoming ? receivePn : givePn;
  const myBasketDemand = incoming ? givePn : receivePn;
  const theirBasketOffer = incoming ? givePn : receivePn;
  const theirBasketDemand = incoming ? receivePn : givePn;

  const myDisplayPw = playerTreatyPw + myBasketOffer;
  const theirDisplayPw = partnerTreatyPw + theirBasketOffer;
  const asymBalance = myDisplayPw - theirDisplayPw;
  const hasBasket = myBasketOffer > 0 || theirBasketOffer > 0;

  // KOREKTA 2026-08-10 (P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA, poprzedni komentarz z dziś rano
  // 5a93f5aa był nieaktualny — patrz PYTANIA-OTWARTE.md): `hasBasket` tutaj to NIE
  // własność FORMULARZA pokoju („ten typ traktatu nie ma koszyka") — koszyk
  // `diplomacyTradeBasket` dla pokoju (aid '10') działa już end-to-end: jest w
  // `TRADE_BASKET_ACTION_IDS` i formularz traktatu renderuje kolumny „My
  // oddajemy/Oni oddają (opcjonalnie)" w TYM SAMYM oknie negocjacji (patrz
  // treatySummaryHtml w diplomacyTradeBasket.ts, które woła tę funkcję z realnym
  // stanem koszyka gracza). `hasBasket=false` znaczy tylko, że w TEJ KONKRETNEJ
  // negocjacji obie strony nic jeszcze nie dołożyły do dostępnego koszyka
  // (myBasketOffer=0 i theirBasketOffer=0) — nie że koszyka nie ma. Stąd rozróżnienie
  // niżej: hasBasket=true → „dopłać" (koszyk już zawiera coś, dopłata w tym formularzu
  // sensowna); hasBasket=false → „zawrzyj osobną umowę" (koszyk pusty, nic do
  // podbicia bez dodania pozycji od nowa).
  // Część C R-DYP-STOL-A (koszyk dla WSZYSTKICH traktatów) jest dziś w praktyce
  // niemal domknięta — obejmuje sojusz/pakt/wasal/pokój (4 z 5 typów z pierwotnego
  // zgłoszenia). Jedyna realna luka to wojna (aid '11') — a to kategorialnie inny
  // temat: wypowiedzenie wojny to jednostronna akcja gracza (showWarConsentModal)
  // bez negocjacji/akceptacji AI, 'wojna' nie ma nawet wpisu w ProposalActionId —
  // ten system propozycji/koszyka jej po prostu nie dotyczy.
  // EN: `hasBasket` here is a property of THIS negotiation attempt (did either side
  // enter a nonzero give/receive amount), NOT of the peace treaty FORM — the basket
  // already works end-to-end for peace (and alliance/pact/vassal), rendered in the
  // same modal. `false` only means nothing was added yet in this attempt. R-DYP-STOL-A
  // part C is effectively done for these 4 types; the only real gap is war, which is a
  // unilateral action outside this proposal/basket system entirely.
  const buildPlayerSide = (): AcceptanceSideBalance => ({
    offerPn: myBasketOffer,
    demandPn: myBasketDemand,
    fairMinPn: playerTreatyPw,
    balancePn: asymBalance,
    treatyBasePn: treatyBase,
    treatyEffectivePn: playerTreatyPw,
    relationModPct: modPct,
    relationModLabel: modLabel,
    mode,
    accepted: peaceAccepted && asymBalance >= 0,
    statusLabel: asymBalance < 0
      ? (hasBasket
        ? `Brakuje ${Math.abs(asymBalance)} PW — dopłać`
        : `Brakuje ${Math.abs(asymBalance)} PW — zawrzyj osobną umowę`)
      : asymBalance > 0 && hasBasket
        ? `Nadwyżka +${asymBalance} PW`
        : formatBalanceLabel(surplusPn, peaceAccepted),
  });

  const buildPartnerSide = (): AcceptanceSideBalance => ({
    offerPn: theirBasketOffer,
    demandPn: theirBasketDemand,
    fairMinPn: partnerTreatyPw,
    balancePn: asymBalance,
    treatyBasePn: treatyBase,
    treatyEffectivePn: partnerTreatyPw,
    mode,
    accepted: peaceAccepted && asymBalance >= 0,
    statusLabel: asymBalance < 0
      ? (hasBasket
        ? `Brakuje ${Math.abs(asymBalance)} PW — dopłać`
        : `Brakuje ${Math.abs(asymBalance)} PW — zawrzyj osobną umowę`)
      : hasBasket && asymBalance > 0
        ? `Przewaga u Ciebie +${asymBalance} PW`
        : 'Równo — spełnia',
  });

  return {
    my: buildPlayerSide(),
    their: buildPartnerSide(),
  };
}

function computeSideBalance(
  offerPn: number,
  demandPn: number,
  relTotal: number,
  treatyBasePn: number,
  relRequired: number | undefined,
  mode: AcceptanceSideBalance['mode'],
  treatyRole: 'player' | 'partner' | 'none',
): AcceptanceSideBalance {
  const relClamped = Math.min(100, Math.max(1, relTotal));
  const fairMinPn = diplomacyFairGivePn(demandPn, relClamped);
  const treatyEffectivePn = treatyRole === 'none'
    ? 0
    : treatyPwForRole(treatyBasePn, relTotal, treatyRole);
  const modPct = treatyRole === 'player'
    ? relationPnModPct(relationSignedFromTotal(relTotal))
    : undefined;
  const modLabel = treatyRole === 'player' ? formatRelationModLabel(relTotal) : undefined;
  const balancePn = offerPn - fairMinPn;
  const basketAccepted = pnDealAcceptedByAi(offerPn, demandPn, relTotal);
  const relBalance = relRequired != null ? relTotal - relRequired : undefined;
  const relOk = relRequired == null || relTotal >= relRequired;
  const hasBasketContent = offerPn > 0 || demandPn > 0;
  const treatyPnOk = treatyEffectivePn === 0
    || !hasBasketContent
    || demandPn > 0
    || offerPn >= treatyEffectivePn;
  const accepted = (hasBasketContent ? basketAccepted : true) && relOk;

  let statusLabel = formatBalanceLabel(balancePn, accepted);
  if (treatyEffectivePn > 0 && !treatyPnOk && demandPn <= 0 && offerPn > 0 && offerPn < treatyEffectivePn) {
    statusLabel = `${statusLabel} · słodzik ${offerPn}/${treatyEffectivePn} PW`;
  } else if (relRequired != null && relBalance != null && relBalance < 0) {
    statusLabel = `Relacja −${Math.abs(relBalance)} (wym. ${relRequired})`;
  } else if (mode === 'gift' && offerPn > 0 && demandPn === 0) {
    statusLabel = `Dar +${offerPn} PW`;
  } else if (treatyEffectivePn > 0 && treatyPnOk && modPct != null && modPct !== 0) {
    statusLabel = `${statusLabel} · ${modLabel}`;
  }

  return {
    offerPn,
    demandPn,
    fairMinPn,
    balancePn,
    treatyBasePn: treatyBasePn > 0 ? treatyBasePn : 0,
    treatyEffectivePn: treatyEffectivePn > 0 ? treatyEffectivePn : undefined,
    relationModPct: modPct,
    relationModLabel: modLabel,
    relRequired,
    relCurrent: relTotal,
    relBalance,
    mode,
    statusLabel,
    accepted,
  };
}

/**
 * Saldo akceptacji z perspektywy GRACZA (My / Oni) dla wpisu stołu.
 * @param incoming — propozycja od AI (gracz = respondent).
 */
export function computePlayerAcceptanceSides(
  actionId: ProposalActionId,
  payload: ProposalPayload,
  relTotal: number,
  incoming: boolean,
  opts?: { difficulty?: GameDifficulty; proposerOwnerId?: number; tempoGry?: import('./tech-tempo').TempoGry | number },
): { my: AcceptanceSideBalance; their: AcceptanceSideBalance; isGift: boolean } {
  const turnsOpts = proposalPnTurnsMultiplier(payload);
  const pnOpts: ResolveProposalPnOptions = {
    difficulty: opts?.difficulty ?? 'normal',
    proposerOwnerId: opts?.proposerOwnerId ?? (incoming ? undefined : 0),
    playerOwnerId: 0,
    tempoGry: opts?.tempoGry,
    ...turnsOpts,
  };
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const treatyDef = loadTreatyAcceptanceDef(actionId);
  const treatyBase = treatyBaseAcceptancePn(actionId, payload);
  const relRequired = treatyDef?.prog_relacja;
  const isGift = incoming && isPlayerIncomingGift(payload);

  const myOfferPn = incoming ? receivePn : givePn;
  const myDemandPn = incoming ? givePn : receivePn;
  const theirOfferPn = incoming ? givePn : receivePn;
  const theirDemandPn = incoming ? receivePn : givePn;

  const hasBasket = myOfferPn > 0 || myDemandPn > 0 || theirOfferPn > 0 || theirDemandPn > 0;
  let mode: AcceptanceSideBalance['mode'] = 'treaty';
  if (isGift) mode = 'gift';
  else if (hasBasket && treatyBase > 0) mode = 'mixed';
  else if (hasBasket) mode = 'basket';

  const ease = sweetenerEasePoints(payload);
  const adjustedRelRequired = relRequired != null ? Math.max(0, relRequired - ease) : undefined;

  if (actionId === 'pokoj' && treatyBase > 0) {
    const peaceMode: 'treaty' | 'mixed' = hasBasket ? 'mixed' : 'treaty';
    const peace = computePeaceAcceptanceSides(givePn, receivePn, relTotal, treatyBase, incoming, peaceMode);
    if (isGift) {
      peace.their.accepted = pnDealAcceptedByAi(givePn, receivePn, relTotal);
      peace.my.accepted = true;
      peace.my.statusLabel = 'Nic w zamian';
      peace.their.statusLabel = formatBalanceLabel(peace.their.balancePn, peace.their.accepted);
    }
    return { my: peace.my, their: peace.their, isGift };
  }

  const my = computeSideBalance(
    myOfferPn,
    myDemandPn,
    relTotal,
    treatyBase,
    adjustedRelRequired,
    mode,
    treatyBase > 0 ? 'player' : 'none',
  );
  const their = computeSideBalance(
    theirOfferPn,
    theirDemandPn,
    relTotal,
    treatyBase,
    adjustedRelRequired,
    mode,
    treatyBase > 0 ? 'partner' : 'none',
  );

  if (treatyBase > 0 && (mode === 'treaty' || mode === 'mixed')) {
    const myDisplay = (my.treatyEffectivePn ?? 0) + my.offerPn;
    const theirDisplay = (their.treatyEffectivePn ?? 0) + their.offerPn;
    const asymBalance = myDisplay - theirDisplay;
    const relOk = adjustedRelRequired == null || relTotal >= adjustedRelRequired;
    // P-DYPLOMACJA-AI-OFERTY-STRUKTURALNIE-NIEUCZCIWE (Maciej, zrzuty ekranu): baza wartości
    // traktatu po stronie gracza (myDisplay, obniżona Relacją <100) jest realnym wymogiem
    // WYŁĄCZNIE gdy GRACZ jest proponentem — mirror evaluateProposal (treatyBaseFairnessGap
    // w diplomacy-proposals.ts wołane wyłącznie `if (proposerIsPlayer/proposerIsTreatyPlayer)`;
    // żaden case AI-proponenta — nap/sojusz_*/wasal/umowa_handlowa/umowa_szlakow — nie gate'uje
    // PW, gdy to AI proponuje). Bez tego gracz widział „Brakuje N PW — zawrzyj osobną umowę"
    // na w pełni poprawnej, przychodzącej propozycji AI (np. NAP @ Relacji 61/200 → baza 200 →
    // wyświetlana wymagana 122, partner stały 200 → sztuczny deficyt −78), a dla umowa_handlowa/
    // umowa_szlakow ten sam deficyt realnie BLOKOWAŁ przycisk Przyjmij (patrz
    // computeIncomingPlayerAcceptNetPw niżej). Gdy AI proponuje (incoming=true), baza traktatu
    // zostaje wartością INFORMACYJNĄ (treatyEffectivePn/treatyBasePn nadal w AcceptanceSideBalance),
    // ale przestaje blokować `accepted`.
    // EN: the player-side treaty base (myDisplay, discounted by Relation <100) is a real
    // requirement ONLY when the PLAYER is the proposer — mirrors evaluateProposal's own gate
    // (treatyBaseFairnessGap fires only `if (proposerIsPlayer)`; every AI-proposer case — nap/
    // alliance/vassal/trade agreement — never gates PW). Without this the player saw "Missing
    // N PW" on a fully valid incoming AI offer, and for the trade-agreement types the same gap
    // actually BLOCKED the Accept button. When AI proposes, the treaty base stays an
    // informational display value but no longer blocks `accepted`.
    const proposerIsPlayer = !incoming;
    // U2 (Evaluator, Maciej): bramka `asymBalance >= 0` po stronie gracza-proponenta (own)
    // dotyczy WYŁĄCZNIE akcji z OWN_PROPOSER_TREATY_PW_GATE_ACTIONS (dziś: umowa_handlowa/
    // umowa_szlakow) — mirror realnej bramki treatyBaseFairnessGap w evaluateProposal. Dla
    // pozostałych traktatów z treatyBase>0 (nap/sojusz_defensywny/sojusz_pelny/wasal/granice)
    // silnik NIE ma żadnego PW-fairness gate w ŻADNYM kierunku — sam warunek `proposerIsPlayer`
    // (bez sprawdzenia actionId) dawał fałszywe „Brakuje N PW" na w pełni akceptowalnych przez
    // silnik propozycjach gracza (zob. komentarz przy definicji stałej wyżej).
    // / EN: the `asymBalance >= 0` gate on the player-as-proposer (own) side applies ONLY to
    // actions in OWN_PROPOSER_TREATY_PW_GATE_ACTIONS (today: umowa_handlowa/umowa_szlakow) —
    // mirroring the real treatyBaseFairnessGap gate in evaluateProposal. For the remaining
    // treaties with treatyBase>0 (nap/sojusz_defensywny/sojusz_pelny/wasal/granice) the engine
    // has NO PW-fairness gate in either direction — gating on `proposerIsPlayer` alone (without
    // checking actionId) produced a false "Missing N PW" on player proposals the engine fully
    // accepts (see the comment on the constant's definition above).
    const ownPwGateApplies = proposerIsPlayer && OWN_PROPOSER_TREATY_PW_GATE_ACTIONS.has(actionId);
    const balanceOk = ownPwGateApplies ? asymBalance >= 0 : true;
    my.balancePn = asymBalance;
    their.balancePn = asymBalance;
    // KOREKTA 2026-08-10 (P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA, poprzedni komentarz z dziś
    // rano 5a93f5aa był nieaktualny — patrz PYTANIA-OTWARTE.md): to jest gałąź
    // WSPÓLNA dla wszystkich traktatów spoza pokoju, które trafiają tutaj z
    // treatyBase>0 — dziś realnie sojusz (aid '3'), pakt (aid '2'), wasal (aid '12')
    // i wchłonięcie (aid '15'). Wszystkie cztery MAJĄ koszyk w
    // `TRADE_BASKET_ACTION_IDS` i renderują kolumny „My oddajemy/Oni oddają
    // (opcjonalnie)" w tym samym formularzu (patrz treatySummaryHtml w
    // diplomacyTradeBasket.ts, które woła computePlayerAcceptanceSides z realnym
    // stanem koszyka gracza). `!hasBasket` NIE znaczy „ten traktat nie ma koszyka" —
    // znaczy, że w TEJ KONKRETNEJ negocjacji obie strony nic jeszcze nie dołożyły do
    // dostępnego koszyka (mode zostaje 'treaty' zamiast 'mixed'). Dopóki koszyk jest
    // pusty, w tym stanie oceny nie ma z czego wyliczyć dopłaty w miejscu, więc
    // komunikat kieruje do zawarcia osobnej umowy zamiast dopłaty tu i teraz.
    // Część C R-DYP-STOL-A jest dziś w praktyce niemal domknięta (4 z 5 typów z
    // pierwotnego zgłoszenia); jedyna realna luka to wojna (aid '11') — kategorialnie
    // inny temat, jednostronna akcja (showWarConsentModal) bez negocjacji/akceptacji
    // AI, 'wojna' nie ma nawet wpisu w ProposalActionId.
    // EN: this is the SHARED branch for every non-peace treaty reaching here with
    // treatyBase>0 — today alliance/pact/vassal/absorption, all four already have a
    // basket (TRADE_BASKET_ACTION_IDS) rendered in the same form. `!hasBasket` means
    // nothing was added to THIS negotiation's basket yet, not that the type lacks
    // one. R-DYP-STOL-A part C is effectively done for these types; the only real gap
    // is war, a unilateral action outside this proposal system.
    // Etykieta „zawrzyj osobną umowę" ma sens tylko gdy deficyt REALNIE blokuje (gracz jako
    // proponent); dla incoming (AI proponuje) asymBalance<0 pozostaje jako liczba informacyjna
    // (baza traktatu partnera stała, gracza obniżona Relacją), ale nie jest brakiem do spłaty.
    // / EN: the "close a separate deal" hint only makes sense when the gap actually blocks
    // (player as proposer); for incoming (AI proposes) a negative asymBalance stays purely
    // informational (partner's base is fixed, player's is relation-discounted) — not a debt.
    // KOREKTA U1 (Evaluator 76514613, Maciej): etykieta „możesz przyjąć bez dopłaty" była
    // kluczowana wyłącznie na `incoming && asymBalance<0`, ignorując `relOk` — pokazywała się
    // nawet gdy realne `accepted = relOk && balanceOk` odrzucało ofertę z powodu Relacji (nie
    // Salda). Dodano `&& relOk`, żeby etykieta pokazywała się WYŁĄCZNIE gdy oferta faktycznie
    // zostałaby zaakceptowana z powodu salda.
    // / EN: the "you can accept without topping up" label was keyed solely on
    // `incoming && asymBalance<0`, ignoring `relOk` — it showed up even when the real
    // `accepted = relOk && balanceOk` rejected the offer for a Relation shortfall (not a
    // balance one). Added `&& relOk` so the label only appears when the offer would actually
    // be accepted on balance grounds.
    if (mode === 'treaty' && !hasBasket) {
      my.accepted = relOk && balanceOk;
      their.accepted = relOk && balanceOk;
      // U2 (Evaluator, Maciej): `!ownPwGateApplies` zastępuje dawne `incoming` poniżej — dla
      // incoming ownPwGateApplies jest zawsze false (proposerIsPlayer=false), więc zachowanie
      // incoming jest BEZ ZMIAN (zweryfikowane przez porównanie ze stanem sprzed naprawy na
      // siatce akcje×Relacje — 0 różnic); own zyskuje analogiczną, przyjazną etykietę dla akcji
      // spoza bramki PW (nap/sojusz/wasal/granice), zamiast mylącego „Spełnia warunki (0 PW)"
      // przy realnym niezerowym (ale nieblokującym) asymBalance.
      // Gałąź `!incoming && !relOk` NIŻEJ (relDeficit) naprawia efekt uboczny tej samej zmiany:
      // dla akcji spoza bramki PW `balanceOk` jest teraz zawsze true, więc bez niej Relacja
      // poniżej progu (np. NAP @ rel 40 < próg 50, own) wpadałaby w domyślne „Spełnia warunki
      // (0 PW)" MIMO accepted=false. ŚWIADOMIE ograniczone do `!incoming` — dla incoming
      // identyczna sprzeczność już istnieje DZIŚ niezależnie od tej naprawy (balanceOk po
      // stronie incoming był `true` bezwarunkowo już PRZED U1/U2, zweryfikowane na kodzie
      // sprzed naprawy) — to osobna, pre-istniejąca usterka incoming, poza zakresem tego
      // zlecenia („NIE dotykaj kierunku incoming"); zapisana osobno w PYTANIA-OTWARTE.md.
      // / EN: `!ownPwGateApplies` replaces the old `incoming` below — for incoming
      // ownPwGateApplies is always false (proposerIsPlayer=false), so incoming behavior is
      // UNCHANGED (verified by diffing against the pre-fix code across an actions×Relations
      // grid — 0 differences); own gets an analogous friendly label for actions outside the PW
      // gate, instead of the misleading "Meets requirements (0 PW)" on a real nonzero
      // (non-blocking) asymBalance.
      // The `!incoming && !relOk` branch BELOW (relDeficit) fixes a side effect of the same
      // change: for ungated actions `balanceOk` is now always true, so without it a Relation
      // shortfall (e.g. NAP @ rel 40 < threshold 50, own) would fall through to "Meets
      // requirements (0 PW)" despite accepted=false. DELIBERATELY scoped to `!incoming` — for
      // incoming the identical contradiction already exists TODAY regardless of this fix
      // (incoming's balanceOk was unconditionally `true` already BEFORE U1/U2, verified on the
      // pre-fix code) — a separate, pre-existing incoming defect, out of scope here ("don't
      // touch incoming"); logged separately in PYTANIA-OTWARTE.md.
      const relDeficit = adjustedRelRequired != null ? Math.max(0, adjustedRelRequired - relTotal) : 0;
      my.statusLabel = (!incoming && !relOk)
        ? `Relacja −${relDeficit} (wym. ${adjustedRelRequired})`
        : !balanceOk
          ? `Brakuje ${Math.abs(asymBalance)} PW — zawrzyj osobną umowę`
          : asymBalance > 0
            ? `Ty ${myDisplay} PW · Oni ${theirDisplay} PW (Relacja +${asymBalance})`
            // `&& relOk` tu NIEZBĘDNE (nie skreślać jako „zbędne po branchu !relOk wyżej") —
            // ten branch dla incoming NIE przechodzi przez branch `!incoming && !relOk` (bo
            // incoming=true), więc relOk może tu wciąż być false; bez tego warunku ta gałąź
            // pokazywałaby przyjazny tekst „możesz przyjąć bez dopłaty" nawet gdy Relacja
            // realnie blokuje — dokładnie usterka, którą naprawiał U1.
            // / EN: `&& relOk` here is REQUIRED (don't drop it as "redundant after the !relOk
            // branch above") — for incoming this branch does NOT go through the
            // `!incoming && !relOk` branch (since incoming=true), so relOk can still be false
            // here; without this check the branch would show the friendly "you can accept
            // without topping up" text even when Relation actually blocks — exactly the defect
            // U1 fixed.
            : !ownPwGateApplies && asymBalance < 0 && relOk
              ? (incoming
                ? 'Propozycja partnera — możesz przyjąć bez dopłaty'
                : 'Twoja propozycja — baza traktatu nie wymaga dopłaty PW')
              : 'Spełnia warunki (0 PW)';
      their.statusLabel = (!incoming && !relOk)
        ? `Relacja −${relDeficit} (wym. ${adjustedRelRequired})`
        : !balanceOk
          ? `Brakuje ${Math.abs(asymBalance)} PW — zawrzyj osobną umowę`
          : asymBalance > 0
            ? `Oni ${theirDisplay} PW · Ty ${myDisplay} PW`
            : !ownPwGateApplies && asymBalance < 0 && relOk
              ? (incoming
                ? 'Propozycja partnera — bez dopłaty'
                : 'Twoja propozycja — bez wymogu dopłaty PW')
              : 'Równo — spełnia';
    } else if (mode === 'mixed') {
      my.accepted = my.accepted && relOk && balanceOk;
      their.accepted = their.accepted && relOk && balanceOk;
      if (!balanceOk) {
        my.statusLabel = `Brakuje ${Math.abs(asymBalance)} PW — dopłać`;
        their.statusLabel = my.statusLabel;
      }
    }
  }

  if (isGift) {
    their.accepted = pnDealAcceptedByAi(givePn, receivePn, relTotal);
    my.accepted = true;
    my.statusLabel = 'Nic w zamian';
    their.statusLabel = formatBalanceLabel(their.balancePn, their.accepted);
  }

  // Wychodząca wymiana PN: UI „prawdopodobnie przyjmie" musi zgadzać się z evaluateProposal
  // (bilateral net + pnDealAcceptedByAi), nie z pnDealAcceptedByAi odwróconej perspektywy partnera.
  if (!incoming && !isGift && (mode === 'basket' || mode === 'mixed')) {
    const bilateralPw = bilateralTreatyDisplayPw(my, their);
    const proposerDisplay = sideDisplayOfferPw(my, bilateralPw);
    const responderDisplay = sideDisplayOfferPw(their, bilateralPw);
    const bilateralNet = proposerDisplay - responderDisplay;
    const basketFairOk = pnDealAcceptedByAi(givePn, receivePn, relTotal);
    their.accepted = bilateralNet >= 0 && basketFairOk;
    if (!their.accepted) {
      if (bilateralNet < 0) {
        their.statusLabel = `Przewaga u Ciebie — oferta nieuczciwa dla partnera (${Math.abs(bilateralNet)} PW)`;
      } else if (!basketFairOk) {
        their.statusLabel = formatBalanceLabel(their.balancePn, false);
      }
    }
  }

  // Przychodząca wymiana PN: gracz może przyjąć niekorzystny deal; bilans UI = netto
  // (nie fair-min respondenta — to dawało fałszywe „Brakuje PW" przy Przyjmij).
  if (incoming && !isGift && (mode === 'basket' || mode === 'mixed')) {
    my.accepted = true;
    my.statusLabel = 'Twoja decyzja — możesz przyjąć';
    const netTheirAdvantage = myOfferPn - theirOfferPn;
    their.balancePn = netTheirAdvantage;
    their.accepted = netTheirAdvantage >= 0;
    their.statusLabel = netTheirAdvantage > 0
      ? `Przewaga u nich +${netTheirAdvantage} PW`
      : netTheirAdvantage < 0
        ? `Przewaga u Ciebie +${-netTheirAdvantage} PW`
        : 'Równo — wymiana symetryczna';
  }

  return { my, their, isGift };
}

/** Akcje przychodzącej wymiany PN — bramka Przyjmij wg netto (R-PW-ACCEPT-OVERPAY-Q1=A). */
const INCOMING_NET_PW_ACTIONS = new Set<ProposalActionId>([
  'handel',
  'umowa_handlowa',
  'umowa_szlakow',
]);

export function usesIncomingPlayerNetPwGate(actionId: ProposalActionId): boolean {
  return INCOMING_NET_PW_ACTIONS.has(actionId);
}

export type IncomingPlayerAcceptNetPw = {
  netPw: number;
  myOfferPn: number;
  theirOfferPn: number;
};

/**
 * Netto PW przy przyjmowaniu oferty AI: myOffer − theirOffer (jak UI / incomingTradeNetBalancePw).
 * Zwraca null gdy akcja nie podlega tej bramce lub brak koszyka (handel / umowa_szlakow /
 * umowa_handlowa bez realnej treści koszyka).
 *
 * P-DYPLOMACJA-AI-OFERTY-STRUKTURALNIE-NIEUCZCIWE (Maciej, zrzuty ekranu): netto liczone
 * WYŁĄCZNIE z realnego koszyka (`acceptance.my/their.offerPn`, wartości PRZED doliczeniem bazy
 * traktatu) — dawna wersja doliczała bazę traktatu (treatyBasePn, np. 80 PW dla umowa_handlowa/
 * umowa_szlakow, 200 PW dla NAP) przez `bilateralTreatyDisplayPw`/`sideDisplayOfferPw`, i
 * WYŁĄCZNIE dla `actionId === 'umowa_handlowa'` wymuszała tę bramkę nawet przy PUSTYM koszyku
 * (mode 'treaty', spójny bliźniak 'umowa_szlakow' poprawnie zwracał null w tym samym stanie —
 * niespójność między dwoma akcjami z identyczną konfiguracją bazy). Baza traktatu po stronie
 * gracza jest obniżana Relacją <100 (`playerTreatyEffectivePn`), a partnera trzymana na stałej
 * bazie — to samo źródło asymetrii co w `evaluateProposal` (`treatyBaseFairnessGap`), ALE tam
 * gate'owane WYŁĄCZNIE `if (proposerIsTreatyPlayer)` (gracz jako proponent). Ta funkcja jest
 * wołana tylko dla `incoming` (AI proponuje) — więc baza traktatu nigdy nie powinna być tu
 * wymogiem: dawny kod blokował przycisk Przyjmij komunikatem „Przewaga u Ciebie — oferta
 * nieuczciwa dla partnera (N PW)" na w pełni poprawnych, przychodzących ofertach AI (np. 31 PW
 * przy Relacji 61/200, baza 80 PW umowa_handlowa — zweryfikowane: `evaluateProposal` dla tej
 * samej propozycji zwraca `accepted:true`). Cel bramki (R-PW-ACCEPT-OVERPAY-Q1=A — chronić AI
 * przed koszykiem, w którym gracz oddaje mniej niż dostaje) zostaje w pełni zachowany — liczy
 * WYŁĄCZNIE realne pozycje koszyka (surowce/¤/Praca), tak jak już robił 'handel' (treatyBase=0,
 * bez zmiany zachowania — `offerPn` tam i tak nigdy nie zawierał bazy traktatu).
 *
 * EN: net computed from the REAL basket ONLY (`acceptance.my/their.offerPn`, values BEFORE the
 * treaty base is folded in) — the previous version added the treaty base (e.g. 80 PW for trade
 * agreements, 200 PW for NAP) via `bilateralTreatyDisplayPw`/`sideDisplayOfferPw`, and forced
 * this gate even on an EMPTY basket only for `actionId === 'umowa_handlowa'` (its sibling
 * 'umowa_szlakow' correctly returned null in the identical state — an inconsistency between two
 * actions sharing the same base config). The treaty base's player side is relation-discounted
 * while the partner side stays fixed — the same asymmetry `evaluateProposal` uses, but gated
 * there ONLY `if (proposerIsTreatyPlayer)` (player-as-proposer). This function only ever runs
 * for `incoming` (AI proposes), so the treaty base should never be a requirement here: the old
 * code blocked the Accept button with a false "unfair to partner" message on fully valid
 * incoming AI offers. The original gate's purpose (protect the AI from a basket where the
 * player gives less than they get) is fully preserved — it now compares only real basket items,
 * exactly as 'handel' (treatyBase=0) already did.
 */
export function computeIncomingPlayerAcceptNetPw(
  actionId: ProposalActionId,
  payload: ProposalPayload,
  relTotal: number,
  opts?: { difficulty?: GameDifficulty; proposerOwnerId?: number; tempoGry?: import('./tech-tempo').TempoGry | number },
): IncomingPlayerAcceptNetPw | null {
  if (!usesIncomingPlayerNetPwGate(actionId)) return null;
  const acceptance = computePlayerAcceptanceSides(actionId, payload, relTotal, true, opts);
  const mode = acceptance.my.mode;
  if (mode !== 'basket' && mode !== 'mixed') {
    return null;
  }
  const myOfferPn = acceptance.my.offerPn;
  const theirOfferPn = acceptance.their.offerPn;
  return { netPw: myOfferPn - theirOfferPn, myOfferPn, theirOfferPn };
}

/** Podgląd Przyjmij dla gracza-respondenta — net ≥ 0 (bez pnDealAcceptedByAi). */
export function previewIncomingPlayerAccept(
  actionId: ProposalActionId,
  payload: ProposalPayload,
  relTotal: number,
  opts?: { difficulty?: GameDifficulty; proposerOwnerId?: number; tempoGry?: import('./tech-tempo').TempoGry | number },
): { accepted: boolean; reason?: string } | null {
  const net = computeIncomingPlayerAcceptNetPw(actionId, payload, relTotal, opts);
  if (!net) return null;
  if (net.netPw >= 0) {
    return { accepted: true };
  }
  return {
    accepted: false,
    reason: `Przewaga u Ciebie — oferta nieuczciwa dla partnera (${Math.abs(net.netPw)} PW)`,
  };
}

/** Eksport pełnej tabeli konfiguracyjnej (dokumentacja / testy). */
export function acceptancePointsCatalog(): AcceptanceConfig {
  return CONFIG;
}
