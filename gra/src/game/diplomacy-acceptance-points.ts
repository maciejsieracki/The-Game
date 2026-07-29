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
  if (accepted && balancePn > 0) return `Nadwyżka +${balancePn} PN`;
  if (accepted && balancePn === 0) return 'Spełnia warunki (0 PN)';
  if (balancePn < 0) return `Brakuje ${Math.abs(balancePn)} PN`;
  return `Saldo ${balancePn} PN`;
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
  const treatyPnOk = !hasBasketContent || treatyEffectivePn === 0 || offerPn >= treatyEffectivePn;
  const accepted = basketAccepted && relOk && treatyPnOk;

  let statusLabel = formatBalanceLabel(balancePn, accepted);
  if (treatyEffectivePn > 0 && !treatyPnOk) {
    statusLabel = `Brakuje ${treatyEffectivePn - offerPn} PN traktatu (wym. ${treatyEffectivePn})`;
  } else if (relRequired != null && relBalance != null && relBalance < 0) {
    statusLabel = `Relacja −${Math.abs(relBalance)} (wym. ${relRequired})`;
  } else if (mode === 'gift' && offerPn > 0 && demandPn === 0) {
    statusLabel = `Dar +${offerPn} PN`;
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
