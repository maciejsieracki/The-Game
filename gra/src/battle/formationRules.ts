export type InitialBattleRole = 'commander' | 'mounted' | 'ranged' | 'melee' | 'siege';

/**
 * Build the default front-to-rear deployment order. Shooters and foot melee
 * share the first line; mounted units occupy its outer slots; siege engines
 * stay behind the fighting line. The role callback keeps this helper independent
 * of BattleScene's runtime representation so the ordering can be verified alone.
 */
export function initialBattleLineOrder<T>(
  units: readonly T[],
  roleOf: (unit: T) => InitialBattleRole,
  rankWidth = 12,
): T[] {
  const mounted = units.filter(unit => roleOf(unit) === 'mounted');
  const commanders = units.filter(unit => roleOf(unit) === 'commander');
  const ranged = units.filter(unit => roleOf(unit) === 'ranged');
  const melee = units.filter(unit => roleOf(unit) === 'melee');
  const siege = units.filter(unit => roleOf(unit) === 'siege');
  const width = Math.max(1, Math.floor(rankWidth));
  const wingCapacity = Math.floor(width / 2);
  const top = mounted.slice(0, Math.min(Math.ceil(mounted.length / 2), wingCapacity));
  const bottom = mounted.slice(top.length, top.length + wingCapacity);
  const extra = mounted.slice(top.length + bottom.length);
  const centreBudget = Math.max(0, width - top.length - bottom.length);
  const footOrder = [...commanders, ...ranged, ...melee, ...extra];
  const frontCentre = footOrder.slice(0, centreBudget);
  const front = [...top, ...frontCentre, ...bottom];
  const frontSet = new Set(front);
  const overflow = footOrder.filter(unit => !frontSet.has(unit));
  // The first rank is filled to its width before any foot overflow, ensuring
  // both wing mounts stay in rank zero even in shooter-heavy armies.
  return [...front, ...overflow, ...siege];
}

export function compactLineAllowsAdvance(args: {
  side: 'atk' | 'def';
  candidateCol: number;
  lineMinimumProgress: number;
  previousLineMinimumProgress: number | null;
}): boolean {
  const candidateProgress = args.side === 'atk' ? args.candidateCol : -args.candidateCol;
  const ownLineLimit = args.lineMinimumProgress + 1;
  const limit = args.previousLineMinimumProgress === null
    ? ownLineLimit
    : Math.min(ownLineLimit, args.previousLineMinimumProgress);
  return candidateProgress <= limit;
}
