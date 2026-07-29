/**
 * wonder-map-build.ts — budowa cudów na heksie mapy (nie kolejka miasta).
 * Kanon: wonders.json _meta.budowa = hex w terytorium; koszt = Praca z puli imperium.
 */

/** Cud w trakcie budowy na wskazanym heksie. */
export interface WonderBuildSite {
  wonderId: string;
  q: number;
  r: number;
  ownerId: number;
  /** Skumulowana Praca (0 … kosztBudowy). */
  postep: number;
}

export interface WonderBuildAdvanceResult {
  sites: WonderBuildSite[];
  pracaUsed: number;
  completed: WonderBuildSite[];
}

/**
 * Wlewa dostępną Pracę do aktywnych placów budowy ownera.
 * Zwraca zaktualizowane placówki, zużytą Pracę i ukończone (postep >= koszt).
 */
export function advanceWonderMapBuilds(
  sites: readonly WonderBuildSite[],
  ownerId: number,
  pracaAvailable: number,
  kosztFn: (wonderId: string) => number,
): WonderBuildAdvanceResult {
  let remaining = Math.max(0, pracaAvailable);
  const next: WonderBuildSite[] = sites.map(s => ({ ...s }));
  const completed: WonderBuildSite[] = [];
  let pracaUsed = 0;

  for (const site of next) {
    if (site.ownerId !== ownerId) continue;
    const koszt = kosztFn(site.wonderId);
    if (koszt <= 0 || site.postep >= koszt) continue;
    const need = koszt - site.postep;
    const pour = Math.min(need, remaining);
    if (pour <= 0) continue;
    site.postep += pour;
    remaining -= pour;
    pracaUsed += pour;
    if (site.postep >= koszt) {
      completed.push({ ...site });
    }
  }

  const active = next.filter(s => {
    const koszt = kosztFn(s.wonderId);
    return s.postep < koszt;
  });

  return { sites: active, pracaUsed, completed };
}

/** Czy owner ma już plac budowy dla danego cudu (max 1 naraz). */
export function ownerHasWonderBuildInProgress(
  sites: readonly WonderBuildSite[],
  ownerId: number,
  wonderId?: string,
): boolean {
  return sites.some(s =>
    s.ownerId === ownerId && (wonderId == null || s.wonderId === wonderId),
  );
}
