/**
 * diplomacy-acceptance-points.ts — punkty akceptacji stołu negocjacji (Maciej 2026-07-29).
 * Traktaty: stałe PN bazowe z diplomacy-acceptance-points.json.
 * Koszyk: runtime PN z diplomacy-value-catalog / resolveProposalPn.
 */
import acceptanceJson from '../../data/diplomacy-acceptance-points.json';
import type { GameDifficulty } from './difficulty-cost';
import type { ProposalActionId, ProposalPayload } from './diplomacy-proposals';
import { sweetenerEasePoints } from './diplomacy-proposals';
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

export function treatyBaseAcceptancePn(actionId: string): number {
  return loadTreatyAcceptanceDef(actionId)?.punkty ?? 0;
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
    accepted: peaceAccepted && (!hasBasket || asymBalance >= 0),
    statusLabel: hasBasket && asymBalance < 0
      ? `Brakuje ${Math.abs(asymBalance)} PW (Relacja)`
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
    accepted: peaceAccepted && (!hasBasket || asymBalance >= 0),
    statusLabel: hasBasket && asymBalance > 0
      ? `Przewaga u Ciebie +${asymBalance} PW`
      : hasBasket && asymBalance < 0
        ? `Brakuje ${Math.abs(asymBalance)} PW`
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
  const treatyBase = treatyDef?.punkty ?? 0;
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
    my.balancePn = asymBalance;
    their.balancePn = asymBalance;
    if (mode === 'treaty' && !hasBasket) {
      my.accepted = relOk;
      their.accepted = relOk;
      my.statusLabel = asymBalance > 0
        ? `Ty ${myDisplay} PW · Oni ${theirDisplay} PW (Relacja +${asymBalance})`
        : asymBalance < 0
          ? `Ty ${myDisplay} PW · Oni ${theirDisplay} PW`
          : 'Spełnia warunki (0 PW)';
      their.statusLabel = asymBalance > 0
        ? `Oni ${theirDisplay} PW · Ty ${myDisplay} PW`
        : 'Równo — spełnia';
    }
  }

  if (isGift) {
    their.accepted = pnDealAcceptedByAi(givePn, receivePn, relTotal);
    my.accepted = true;
    my.statusLabel = 'Nic w zamian';
    their.statusLabel = formatBalanceLabel(their.balancePn, their.accepted);
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
 * Zwraca null gdy akcja nie podlega tej bramce lub brak koszyka (handel / umowa_szlakow).
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
  if (actionId !== 'umowa_handlowa' && mode !== 'basket' && mode !== 'mixed') {
    return null;
  }
  const bilateralPw = bilateralTreatyDisplayPw(acceptance.my, acceptance.their);
  const myOfferPn = sideDisplayOfferPw(acceptance.my, bilateralPw);
  const theirOfferPn = sideDisplayOfferPw(acceptance.their, bilateralPw);
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
