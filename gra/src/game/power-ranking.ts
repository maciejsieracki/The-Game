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

const EMPTY_DISCOVERED: ReadonlySet<number> = new Set<number>();

export interface AbsolutePowerRank {
  /** Miejsce ownera wśród WSZYSTKICH pełnych cywilizacji (1 = najsilniejszy). */
  rank: number;
  /** Liczba wszystkich pełnych cywilizacji branych pod uwagę (żywe, bez miast-państw). */
  total: number;
}

/**
 * R-RANKING-MOC (Maciej 2026-07-24): pozycja ownera wśród WSZYSTKICH żyjących pełnych
 * cywilizacji — niezależnie od mgły wojny / odkrycia. Gracz ma znać swoje KONKRETNE
 * miejsce (np. „jesteś 5. z 12"), nawet nie znając tożsamości/mocy rywali.
 *
 * Celowo NIE filtruje po odkryciu (showAllCivs zawsze true) — to warstwa liczenia
 * pozycji, nie prezentacji; UI decyduje ile z tego ujawnić wprost.
 */
export function computeAbsolutePowerRank(
  ownerId: number,
  allOwnerIds: Iterable<number>,
  powerOf: (ownerId: number) => number,
  opts: { cityStateOpts?: PowerRankingFilterOpts['cityStateOpts'] } = {},
): AbsolutePowerRank {
  const eligible = filterOwnersForPowerRanking(allOwnerIds, {
    cityStateOpts: opts.cityStateOpts,
    discoveredOwners: EMPTY_DISCOVERED,
    showAllCivs: true,
  });
  const powers = eligible.map(oid => ({ oid, power: powerOf(oid) }));
  const mine = powers.find(p => p.oid === ownerId)?.power ?? powerOf(ownerId);
  const better = powers.filter(p => p.oid !== ownerId && p.power > mine).length;
  return { rank: better + 1, total: powers.length };
}
