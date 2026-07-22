/**
 * power-ranking.ts — lista państw widocznych w rankingu Mocy (panel imperium + overlay).
 *
 * PRODUKCJA (mgła wojny włączona):
 * - tylko pełne cywilizacje (bez miast-państw klastra),
 * - tylko odkryte w mgle wojny (+ gracz ownerId 0 zawsze).
 *
 * DEV / test (mgła wojny wyłączona — F / baton minimapy):
 * - wszystkie pełne cywilizacje niezależnie od odkrycia (miasta-państwa nadal ukryte).
 */

import { isOwnerClusterCityState } from './display-names';

export interface PowerRankingFilterOpts {
  cityStateOpts?: Parameters<typeof isOwnerClusterCityState>[1];
  discoveredOwners: ReadonlySet<number>;
  /** Gdy true (FoW wyłączony) — wszystkie pełne cywilizacje, bez filtra odkrycia. */
  showAllCivs?: boolean;
}

/** Państwa kwalifikujące się do rankingu Mocy (kolejność wejściowa zachowana). */
export function filterOwnersForPowerRanking(
  ownerIds: Iterable<number>,
  opts: PowerRankingFilterOpts,
): number[] {
  const showAll = opts.showAllCivs ?? false;
  const out: number[] = [];
  for (const oid of ownerIds) {
    if (oid === 0) {
      out.push(0);
      continue;
    }
    if (isOwnerClusterCityState(oid, opts.cityStateOpts)) continue;
    if (!showAll && !opts.discoveredOwners.has(oid)) continue;
    out.push(oid);
  }
  return out;
}
