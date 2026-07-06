/**
 * diplomacy-pn-engine.ts — stan per para + logika PN→Zaufanie (D4-WYMIANA-PN).
 * Pure helpers; mutacja stanu gry w main.ts.
 */
import type { Relation } from './diplomacy';
import {
  diplomacyTradeTrustFromDeal,
  diplomacyGiftTrustFromPn,
  diplomacyDobraWolaFromSurplus,
  diplomacyFairGivePn,
  diplomacyProgDarRelacja,
  diplomacySumPn,
  diplomacyPnZloto,
  type WartoscPozycjaTyp,
} from './diplomacy-value-catalog';

export interface DiploPairMeta {
  trustPnGainedThisTurn: number;
  dobraWolaRemainingTur: number;
}

export interface ZlozeGrant {
  granterOwnerId: number;
  granteeOwnerId: number;
  partnerId: number;
  zlozeId: string;
  hexKey: string;
  active: boolean;
}

export interface BasketItem {
  typ: WartoscPozycjaTyp;
  id: string;
  ilosc?: number;
  hexKey?: string;
  cityId?: string;
}

export function diploPairKey(a: number, b: number): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function freshDiploPairMeta(): DiploPairMeta {
  return { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0 };
}

export function relationTotal(rel: Relation): number {
  return Math.max(0, Math.min(200, (rel.zaufanie ?? 0) + (rel.respekt ?? 0)));
}

/** W4-A: AI akceptuje gdy givePn ≥ fair min @ Relacji. */
export function pnDealAcceptedByAi(
  givePn: number,
  receivePn: number,
  relacja: number,
): boolean {
  if (givePn <= 0 && receivePn <= 0) return false;
  const fairMin = diplomacyFairGivePn(receivePn, relacja);
  return givePn >= fairMin;
}

/** W3-B: czysty dar wymaga Relacji ≥ progDarRelacja. */
export function pnGiftAllowed(relacja: number): boolean {
  return relacja >= diplomacyProgDarRelacja();
}

export function pnFromLegacyGold(goldOnce: number | undefined): number {
  if (goldOnce == null || !Number.isFinite(goldOnce) || goldOnce <= 0) return 0;
  return diplomacyPnZloto(goldOnce);
}

export function resolveProposalPn(
  payload: {
    givePn?: number;
    receivePn?: number;
    goldOnce?: number;
    giveItems?: readonly BasketItem[];
    receiveItems?: readonly BasketItem[];
  },
): { givePn: number; receivePn: number } {
  let givePn = payload.givePn ?? 0;
  let receivePn = payload.receivePn ?? 0;
  if (payload.giveItems?.length) {
    const sum = diplomacySumPn([...payload.giveItems]);
    if (sum != null) givePn = sum;
  }
  if (payload.receiveItems?.length) {
    const sum = diplomacySumPn([...payload.receiveItems]);
    if (sum != null) receivePn = sum;
  }
  if (givePn <= 0 && payload.goldOnce != null && payload.goldOnce > 0) {
    givePn = pnFromLegacyGold(payload.goldOnce);
  }
  return { givePn, receivePn };
}

export interface TrustApplyResult {
  rel: Relation;
  meta: DiploPairMeta;
  deltaZaufanie: number;
  dobraWolaStarted: boolean;
}

/** Zastosuj ΔZaufanie z PN (handel lub dar) + ewentualna dobra wola. */
export function applyPnTrustToRelation(
  rel: Relation,
  meta: DiploPairMeta,
  givePn: number,
  receivePn: number,
  isGift: boolean,
): TrustApplyResult {
  const trustResult = isGift
    ? diplomacyGiftTrustFromPn(givePn, meta.trustPnGainedThisTurn)
    : diplomacyTradeTrustFromDeal(givePn, receivePn, relationTotal(rel), meta.trustPnGainedThisTurn);

  const deltaZaufanie = trustResult.deltaZaufanie;
  const newMeta: DiploPairMeta = {
    trustPnGainedThisTurn: meta.trustPnGainedThisTurn + deltaZaufanie,
    dobraWolaRemainingTur: meta.dobraWolaRemainingTur,
  };

  const dobra = diplomacyDobraWolaFromSurplus(trustResult.surplusPn);
  let dobraWolaStarted = false;
  if (dobra.active && dobra.tur > 0) {
    newMeta.dobraWolaRemainingTur = Math.max(newMeta.dobraWolaRemainingTur, dobra.tur);
    dobraWolaStarted = true;
  }

  const newZaufanie = Math.max(0, Math.min(100, (rel.zaufanie ?? 0) + deltaZaufanie));
  return {
    rel: { ...rel, zaufanie: newZaufanie },
    meta: newMeta,
    deltaZaufanie,
    dobraWolaStarted,
  };
}

/** Tick dobrej woli (+1 Zauf./turę, nie liczy się do limitu 5/turę z PN). */
export function tickDobraWolaOnRelation(
  rel: Relation,
  meta: DiploPairMeta,
): { rel: Relation; meta: DiploPairMeta; gained: number } {
  if (meta.dobraWolaRemainingTur <= 0) {
    return { rel, meta, gained: 0 };
  }
  const newZaufanie = Math.max(0, Math.min(100, (rel.zaufanie ?? 0) + 1));
  return {
    rel: { ...rel, zaufanie: newZaufanie },
    meta: {
      ...meta,
      dobraWolaRemainingTur: meta.dobraWolaRemainingTur - 1,
    },
    gained: 1,
  };
}

export function suspendZlozeGrantsForWar(
  grants: ZlozeGrant[],
  ownerA: number,
  ownerB: number,
): ZlozeGrant[] {
  return grants.map(g => {
    const involves =
      (g.granterOwnerId === ownerA && g.granteeOwnerId === ownerB) ||
      (g.granterOwnerId === ownerB && g.granteeOwnerId === ownerA);
    if (!involves || !g.active) return g;
    return { ...g, active: false };
  });
}
