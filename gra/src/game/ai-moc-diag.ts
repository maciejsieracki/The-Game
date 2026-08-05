/**
 * ai-moc-diag.ts — metryki diagnostyczne Mocy AI (AI-MOC-NEXT-Q1=B).
 * Pure helper: wiersze per major owner (gracz + major AI), bez miast-państw.
 * STRICT-SAVE: tylko runtime — zero pól sejwu.
 */

import { isMajorAiOwner } from './owner-utils';

export interface AiMocDiagCity {
  ownerId: number;
  cityId: string;
}

export interface AiMocDiagInput {
  /** Kandydaci ownerId (np. z cities + aiStartHexes). */
  ownerIds: readonly number[];
  labelForOwner: (ownerId: number) => string;
  mocForOwner: (ownerId: number) => number;
  /** Pula Pracy imperium ownera — stan bieżący (nie /turę). */
  pracaPoolForOwner: (ownerId: number) => number;
  cities: readonly AiMocDiagCity[];
  /** Liczba elementów w kolejce produkcji miasta (0 = pusta kolejka). */
  productionQueueLength: (cityId: string) => number;
  /** true = wyklucz owner (miasto-państwo / cluster CS). */
  isCityStateOwner: (ownerId: number) => boolean;
}

export interface AiMocDiagRow {
  ownerId: number;
  label: string;
  moc: number;
  miasta: number;
  /** Pula Pracy imperium — stan bieżący. */
  pracaPool: number;
  /** Miasta bez frontu produkcji (pusta kolejka). */
  kolejkaPuste: number;
  /** Miasta z aktywnym frontem (kolejka niepusta). */
  kolejkaAktywne: number;
}

/** Buduje wiersze diag dla gracza (ownerId=0) i major AI — bez miast-państw. */
export function buildAiMocDiagRows(input: AiMocDiagInput): AiMocDiagRow[] {
  const {
    ownerIds,
    labelForOwner,
    mocForOwner,
    pracaPoolForOwner,
    cities,
    productionQueueLength,
    isCityStateOwner,
  } = input;

  const citiesByOwner = new Map<number, string[]>();
  for (const c of cities) {
    const list = citiesByOwner.get(c.ownerId);
    if (list) list.push(c.cityId);
    else citiesByOwner.set(c.ownerId, [c.cityId]);
  }

  const rows: AiMocDiagRow[] = [];
  const seen = new Set<number>();

  for (const ownerId of ownerIds) {
    if (seen.has(ownerId)) continue;
    seen.add(ownerId);
    if (isCityStateOwner(ownerId)) continue;
    if (ownerId !== 0 && !isMajorAiOwner(ownerId, isCityStateOwner)) continue;

    const cityIds = citiesByOwner.get(ownerId) ?? [];
    let kolejkaPuste = 0;
    let kolejkaAktywne = 0;
    for (const cityId of cityIds) {
      if (productionQueueLength(cityId) > 0) kolejkaAktywne++;
      else kolejkaPuste++;
    }

    rows.push({
      ownerId,
      label: labelForOwner(ownerId),
      moc: mocForOwner(ownerId),
      miasta: cityIds.length,
      pracaPool: pracaPoolForOwner(ownerId),
      kolejkaPuste,
      kolejkaAktywne,
    });
  }

  rows.sort((a, b) => b.moc - a.moc);
  return rows;
}
