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
  relationPnModPct,
  relationSignedFromTotal,
  resolveProposalPn,
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

/** PW traktatu dwustronnego do wyświetlenia na obu stronach stołu (effective lub baza). */
export function bilateralTreatyDisplayPw(
  my?: AcceptanceSideBalance,
  their?: AcceptanceSideBalance,
): number | undefined {
  const mode = my?.mode ?? their?.mode;
  if (mode !== 'treaty' && mode !== 'mixed') return undefined;
  const effective = my?.treatyEffectivePn ?? their?.treatyEffectivePn;
  if (effective != null && effective > 0) return effective;
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

function computeSideBalance(
  offerPn: number,
  demandPn: number,
  relTotal: number,
  treatyBasePn: number,
  relRequired: number | undefined,
  mode: AcceptanceSideBalance['mode'],
): AcceptanceSideBalance {
  const relClamped = Math.min(100, Math.max(1, relTotal));
  const fairMinPn = diplomacyFairGivePn(demandPn, relClamped);
  const treatyEffectivePn = effectiveTreatyPnRequired(treatyBasePn, relTotal);
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  const modLabel = formatRelationModLabel(relTotal);
  const balancePn = offerPn - fairMinPn;
  const basketAccepted = pnDealAcceptedByAi(offerPn, demandPn, relTotal);
  const relBalance = relRequired != null ? relTotal - relRequired : undefined;
  const relOk = relRequired == null || relTotal >= relRequired;
  const hasBasketContent = offerPn > 0 || demandPn > 0;
  // Traktat (NAP itd.) opłacany progiem Relacji w evaluateProposal — koszyk to
  // słodzik/wymiana. Nie wymagaj offerPn ≥ bazę PN traktatu (to psuło UI vs silnik:
  // 10¤+NAP wyglądało na bilans 0, a accepted=false). Maciej 2026-07-30.
  const treatyPnOk = treatyEffectivePn === 0
    || !hasBasketContent
    || demandPn > 0
    || offerPn >= treatyEffectivePn;
  const accepted = (hasBasketContent ? basketAccepted : true) && relOk;

  let statusLabel = formatBalanceLabel(balancePn, accepted);
  // Nie strasz „brakuje PW traktatu” przy słodziku/wymianie — traktat idzie progiem Relacji.
  if (treatyEffectivePn > 0 && !treatyPnOk && demandPn <= 0 && offerPn > 0 && offerPn < treatyEffectivePn) {
    // Jednostronna dopłata poniżej bazy: informacyjnie, bez blokady accepted (NAP/sojusz).
    statusLabel = `${statusLabel} · słodzik ${offerPn}/${treatyEffectivePn} PW`;
  } else if (relRequired != null && relBalance != null && relBalance < 0) {
    statusLabel = `Relacja −${Math.abs(relBalance)} (wym. ${relRequired})`;
  } else if (mode === 'gift' && offerPn > 0 && demandPn === 0) {
    statusLabel = `Dar +${offerPn} PW`;
  } else if (treatyEffectivePn > 0 && treatyPnOk && modPct !== 0) {
    statusLabel = `${statusLabel} · ${modLabel}`;
  }

  return {
    offerPn,
    demandPn,
    fairMinPn,
    balancePn,
    treatyBasePn,
    treatyEffectivePn: treatyEffectivePn > 0 ? treatyEffectivePn : undefined,
    relationModPct: treatyBasePn > 0 ? modPct : undefined,
    relationModLabel: treatyBasePn > 0 ? modLabel : undefined,
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
  const pnOpts: ResolveProposalPnOptions = {
    difficulty: opts?.difficulty ?? 'normal',
    proposerOwnerId: opts?.proposerOwnerId ?? (incoming ? undefined : 0),
    playerOwnerId: 0,
    tempoGry: opts?.tempoGry,
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

  const my = computeSideBalance(myOfferPn, myDemandPn, relTotal, incoming ? 0 : treatyBase, adjustedRelRequired, mode);
  const their = computeSideBalance(
    theirOfferPn,
    theirDemandPn,
    relTotal,
    incoming ? treatyBase : 0,
    adjustedRelRequired,
    mode,
  );

  if (isGift) {
    their.accepted = pnDealAcceptedByAi(givePn, receivePn, relTotal);
    my.accepted = true;
    my.statusLabel = 'Nic w zamian';
    their.statusLabel = formatBalanceLabel(their.balancePn, their.accepted);
  }

  return { my, their, isGift };
}

/** Eksport pełnej tabeli konfiguracyjnej (dokumentacja / testy). */
export function acceptancePointsCatalog(): AcceptanceConfig {
  return CONFIG;
}
