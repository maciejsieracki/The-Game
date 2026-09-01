/**
 * diplomacy-pair-summary.ts — R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA.
 *
 * Czyste funkcje agregujące partnerów WOJNY / SOJUSZU / HANDLU danego `ownerId`,
 * używane przez pop-up podsumowania pary dyplomatycznej (ui/diplomacyPanel.ts,
 * `showDiploPairSummary`) — krok pośredni pokazywany PRZED otwarciem pełnej
 * audiencji (Maciej 2026-08-09).
 *
 * PL: Silnik (main.ts) decyduje o WIDOCZNOŚCI partnera (kontakt dyplomatyczny /
 * eliminacja) przez opcjonalny `isVisiblePartner` — ten moduł nic nie wie o
 * mgle wojny, tylko wykonuje przekazany predykat. Trzyma to testowalne w
 * izolacji (bez bootowania main.ts).
 * EN: The caller (main.ts) owns fog-of-war visibility via the optional
 * `isVisiblePartner` predicate — this module stays engine-agnostic and unit
 * testable without booting main.ts.
 */
import { isBarbarian } from './barbarians';
import { normalizeTreatyKind, type ActiveDeal, type TreatyKind } from './diplomacy-treaties';
import { RodzajTraktatu } from '../types/diplomacy';

/** Minimalny kształt relacji potrzebny tu — patrz game/diplomacy.ts `Relation`. */
export interface DiploRelationLike {
  status?: string;
}

const ALLIANCE_KINDS: ReadonlySet<TreatyKind> = new Set<TreatyKind>([
  RodzajTraktatu.SojuszWojskowy,
  'sojusz_defensywny',
  'sojusz_pelny',
]);

const TRADE_KINDS: ReadonlySet<TreatyKind> = new Set<TreatyKind>([
  RodzajTraktatu.UmowaHandlowa,
  RodzajTraktatu.UmowaSzlakow,
  RodzajTraktatu.UmowaWymiany,
]);

/**
 * R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1: pakt o nieagresji JEST reprezentowany
 * jako ActiveDeal (RodzajTraktatu.PaktNieagresji = 'pakt_nieagresji', patrz
 * types/diplomacy.ts) — analogiczny kanał do ALLIANCE_KINDS/TRADE_KINDS,
 * osobna trzecia kategoria 'nap' w DealPartnerKind.
 */
const NAP_KINDS: ReadonlySet<TreatyKind> = new Set<TreatyKind>([
  RodzajTraktatu.PaktNieagresji,
]);

/**
 * Partnerzy wojny danego `ownerId` — skanuje CAŁĄ mapę relacji (klucz
 * "mniejszyId_wiekszyId"), nie tylko pary z graczem (pop-up pokazuje wojny
 * KLIKNIĘTEJ cywilizacji z kimkolwiek, nie tylko z nami).
 *
 * B1 (Evaluator, runda 1 FAIL): barbarzyńcy (BARBARIAN_OWNER_ID=-1) są w
 * relacji "wojna" ze WSZYSTKIMI niebarbarzyńcami z założenia silnika (patrz
 * main.ts `getDiploRelation`, komentarz "C-BARB-Q1") — WYKLUCZAMY jawnie
 * przez `isBarbarian()`, analogicznie do udokumentowanego precedensu
 * main.ts (~25798, "C-BARB-Q1/Q2: defensywny filtr -- wykluczamy jawnie
 * zamiast zakładać").
 */
export function warPartnerIdsForOwner(
  relations: ReadonlyMap<string, DiploRelationLike>,
  ownerId: number,
  isVisiblePartner?: (id: number) => boolean,
): number[] {
  const out: number[] = [];
  if (isBarbarian(ownerId)) return out;
  for (const [key, rel] of relations) {
    if (rel.status !== 'wojna') continue;
    const parts = key.split('_').map(Number);
    if (parts.length !== 2) continue;
    const a = parts[0]!;
    const b = parts[1]!;
    if (a !== ownerId && b !== ownerId) continue;
    const other = a === ownerId ? b : a;
    if (isBarbarian(other)) continue; // B1
    if (isVisiblePartner && !isVisiblePartner(other)) continue; // B2 — mgła wojny / eliminacja
    out.push(other);
  }
  return out;
}

export type DealPartnerKind = 'sojusz' | 'handel' | 'nap';

/**
 * Partnerzy aktywnych traktatów danego `ownerId`, filtrowani po rodzaju:
 *   - 'sojusz' = SojuszWojskowy (legacy) / sojusz_defensywny / sojusz_pelny
 *   - 'handel' = UmowaHandlowa (legacy) / UmowaSzlakow / UmowaWymiany
 * Deduplikuje (jedna para może mieć kilka traktatów tego samego rodzaju
 * teoretycznie nie wystąpi, ale dla bezpieczeństwa nie dubluje wpisu).
 */
export function dealPartnerIdsForOwner(
  deals: readonly ActiveDeal[],
  ownerId: number,
  kind: DealPartnerKind,
  isVisiblePartner?: (id: number) => boolean,
): number[] {
  const out: number[] = [];
  if (isBarbarian(ownerId)) return out;
  const kindSet = kind === 'sojusz' ? ALLIANCE_KINDS : kind === 'handel' ? TRADE_KINDS : NAP_KINDS;
  const seen = new Set<number>();
  for (const deal of deals) {
    const [a, b] = deal.strony;
    if (a !== ownerId && b !== ownerId) continue;
    if (!kindSet.has(normalizeTreatyKind(deal.rodzaj))) continue;
    const other = a === ownerId ? b : a;
    if (isBarbarian(other)) continue; // B1 (symetrycznie do wojen)
    if (isVisiblePartner && !isVisiblePartner(other)) continue; // B2
    if (seen.has(other)) continue;
    seen.add(other);
    out.push(other);
  }
  return out;
}
