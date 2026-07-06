/**
 * diplomacy-border-march.ts — kara za nieautoryzowany przemarsz (D3-BORD, P5).
 * Pure: traktaty / wojna / typ jednostki → delta Zaufania u pary intruz→właściciel.
 * Wykrywanie heksów: UNITS+MAPA (`border-march-scan.ts`); hook endTurn: Integrator F.
 */
import diplomacyData from '../../data/diplomacy.json';
import { RodzajTraktatu } from '../types/diplomacy';
import type { Relation } from './diplomacy';
import {
  type ActiveDeal,
  hasTreaty,
  normalizeTreatyKind,
} from './diplomacy-treaties';
import { diploPairKey } from './diplomacy-pn-engine';

/** Para intruz → właściciel terytorium (dedupe w jednej turze). */
export interface BorderMarchPair {
  intruderOwnerId: number;
  territoryOwnerId: number;
  /** true gdy choć jedna jednostka wojskowa na parze (domyślnie false). */
  isMilitary?: boolean;
}

/** Kontekst autoryzacji przemarszu dla jednej pary. */
export interface BorderMarchCheckContext {
  treaties: readonly ActiveDeal[];
  isMilitary: boolean;
  /** Opcjonalnie — status wojny = brak kary. */
  relation?: Relation;
}

export interface BorderMarchParams {
  karaPrzemarszNieautoryzowany_zaufanie_perTura: number;
}

export interface BorderMarchPenaltyResult {
  relations: Map<string, Relation>;
  /** Liczba par, którym nałożono karę w tej turze. */
  penalizedPairs: number;
}

const DEFAULT_KARA = 5;

function clampZaufanie(z: number): number {
  return Math.max(0, Math.min(100, z));
}

function pairDedupeKey(pair: BorderMarchPair): string {
  return `${pair.intruderOwnerId}->${pair.territoryOwnerId}`;
}

function isAllianceTreaty(state: readonly ActiveDeal[], a: number, b: number): boolean {
  const deals = [...state];
  return (
    hasTreaty(deals, a, b, RodzajTraktatu.SojuszWojskowy)
    || hasTreaty(deals, a, b, 'sojusz_defensywny')
    || hasTreaty(deals, a, b, 'sojusz_pelny')
  );
}

/** Wasal (payer) u suzerena (receiver) — prawo przemarszu (akcja 12). */
function hasWasalMarchRights(
  treaties: readonly ActiveDeal[],
  intruderOwnerId: number,
  territoryOwnerId: number,
): boolean {
  for (const deal of treaties) {
    if (normalizeTreatyKind(deal.rodzaj) !== RodzajTraktatu.Wasalizacja) continue;
    const sides =
      deal.strony[0] === intruderOwnerId || deal.strony[1] === intruderOwnerId;
    const sidesOwner =
      deal.strony[0] === territoryOwnerId || deal.strony[1] === territoryOwnerId;
    if (!sides || !sidesOwner) continue;
    const eco = deal.ekonomia;
    if (
      eco?.payerOwnerId === intruderOwnerId
      && eco?.receiverOwnerId === territoryOwnerId
    ) {
      return true;
    }
  }
  return false;
}

/** Parametr kary z diplomacy.json (Panel-D export). */
export function loadBorderMarchParams(json: unknown = diplomacyData): BorderMarchParams {
  const def = DEFAULT_KARA;
  if (!json || typeof json !== 'object') {
    return { karaPrzemarszNieautoryzowany_zaufanie_perTura: def };
  }
  const params = (json as { params?: Record<string, unknown> }).params;
  const raw = params?.karaPrzemarszNieautoryzowany_zaufanie_perTura;
  const kara =
    typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : def;
  return { karaPrzemarszNieautoryzowany_zaufanie_perTura: kara };
}

/**
 * Czy intruz ma ważne uprawnienie do obecności na terytorium właściciela.
 * Wojna → true (brak kary reputacyjnej). Sojusz / traktaty graniczne / wasal.
 */
export function hasAuthorizedBorderCrossing(
  intruderOwnerId: number,
  territoryOwnerId: number,
  ctx: BorderMarchCheckContext,
): boolean {
  if (intruderOwnerId === territoryOwnerId) return true;
  if (ctx.relation?.status === 'wojna') return true;

  const { treaties, isMilitary } = ctx;

  if (isAllianceTreaty(treaties, intruderOwnerId, territoryOwnerId)) {
    return true;
  }
  if (hasWasalMarchRights(treaties, intruderOwnerId, territoryOwnerId)) {
    return true;
  }

  if (isMilitary) {
    return hasTreaty(
      [...treaties],
      intruderOwnerId,
      territoryOwnerId,
      RodzajTraktatu.PrawoWojskowePrzemarszu,
    );
  }

  return hasTreaty(
    [...treaties],
    intruderOwnerId,
    territoryOwnerId,
    RodzajTraktatu.OtwartGranice,
  );
}

/**
 * Nakłada −kara Zaufania na pary bez autoryzacji.
 * Dedupe: wiele jednostek tej samej pary → jedna kara.
 * Relacja kluczowana `diploPairKey(intruder, owner)`.
 */
export function applyUnauthorizedBorderPenalties(
  pairs: readonly BorderMarchPair[],
  relations: ReadonlyMap<string, Relation>,
  params: BorderMarchParams,
  resolveCtx: (pair: BorderMarchPair) => BorderMarchCheckContext,
): BorderMarchPenaltyResult {
  const kara = params.karaPrzemarszNieautoryzowany_zaufanie_perTura;
  const next = new Map(relations);
  const seen = new Set<string>();
  let penalizedPairs = 0;

  for (const pair of pairs) {
    const dedupe = pairDedupeKey(pair);
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const ctx = resolveCtx(pair);
    if (hasAuthorizedBorderCrossing(pair.intruderOwnerId, pair.territoryOwnerId, ctx)) {
      continue;
    }

    const key = diploPairKey(pair.intruderOwnerId, pair.territoryOwnerId);
    const rel = next.get(key) ?? { zaufanie: 20, respekt: 30, status: 'neutralni' as const };
    next.set(key, {
      ...rel,
      zaufanie: clampZaufanie(rel.zaufanie - kara),
    });
    penalizedPairs += 1;
  }

  return { relations: next, penalizedPairs };
}

/** Dedupe par intruz→owner (UNITS może wołać przed apply). */
export function dedupeBorderMarchPairs(pairs: readonly BorderMarchPair[]): BorderMarchPair[] {
  const map = new Map<string, BorderMarchPair>();
  for (const pair of pairs) {
    const key = pairDedupeKey(pair);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...pair });
      continue;
    }
    map.set(key, {
      ...prev,
      isMilitary: prev.isMilitary || pair.isMilitary === true,
    });
  }
  return [...map.values()];
}
