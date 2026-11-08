export type InitialBattleRole = 'commander' | 'mounted' | 'melee' | 'javelin' | 'archer' | 'slinger' | 'ranged' | 'siege';

export function classifyInitialBattleRole(input: {
  commander?: boolean;
  category?: string;
  name?: string;
  type?: string;
  primaryRanged?: boolean;
}): InitialBattleRole {
  const normalize = (value: string | undefined): string => (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[łŁ]/g, 'l')
    .toLowerCase();
  const category = normalize(input.category);
  const name = normalize(input.name);
  const type = normalize(input.type);
  const haystack = `${category} ${name}`;

  if (input.commander) return 'commander';
  if (category === 'konnica' || category === 'rydwan' ||
      /konnic|jazd|jezdz|kawaler|rydwan|chariot|cavalry|horse/.test(name)) return 'mounted';
  if (type === 'siege' ||
      /taran|katapult|wieza oblezn|battering|catapult|siege tower/.test(name)) return 'siege';
  if (category === 'oszczepnik' || /oszczepnik|javelin|atlatl|estolic/.test(haystack)) return 'javelin';
  if (category === 'lucznik' || /luczn|archer|kusznik|crossbow/.test(haystack)) return 'archer';
  if (category === 'procarz' || /procarz|slinger/.test(haystack)) return 'slinger';
  if (input.primaryRanged) return 'ranged';
  return 'melee';
}


export interface InitialBattleFormation<T> {
  infantry: T[];
  javelins: T[];
  archers: T[];
  slingers: T[];
  ranged: T[];
  mounted: T[];
  siege: T[];
  commanders: T[];
}

export interface InitialBattleSlot<T> { unit: T; row: number; rank: number; }

export function initialBattleSlots<T>(
  formation: InitialBattleFormation<T>,
  bounds: {
    rankWidth: number;
    midRow: number;
    playRow0: number;
    playRow1: number;
    meleeLines?: 1 | 2 | 3;
    archerLines?: 1 | 2 | 3;
  },
): InitialBattleSlot<T>[] {
  const width = Math.max(1, Math.floor(bounds.rankWidth));
  const slots: InitialBattleSlot<T>[] = [];
  let rankBase = 0;
  const linesForBand = (count: number, configuredLines?: 1 | 2 | 3): { per: number; count: number } => {
    if (count === 0) return { per: 0, count: 0 };
    const playableRows = Math.max(1, bounds.playRow1 - bounds.playRow0 - 1);
    const requestedLines = configuredLines ?? Math.ceil(count / width);
    const lineCount = Math.min(count, Math.max(requestedLines, Math.ceil(count / playableRows)));
    const per = Math.ceil(count / lineCount);
    return { per, count: Math.ceil(count / per) };
  };
  const layBand = (units: readonly T[], configuredLines?: 1 | 2 | 3): void => {
    if (units.length === 0) return;
    // The 1/2/3 line option controls depth ranks; width is constrained only by
    // the legal battlefield rows. Do not silently turn a requested single
    // line into two ranks just because the default formation width is smaller.
    const { per, count: actualLineCount } = linesForBand(units.length, configuredLines);
    units.forEach((unit, i) => {
      const rankWithinBand = Math.floor(i / per);
      const indexWithinRank = i % per;
      const rankSize = Math.min(per, units.length - rankWithinBand * per);
      const rowStart = bounds.midRow - Math.floor(rankSize / 2);
      slots.push({ unit, row: rowStart + indexWithinRank, rank: rankBase + rankWithinBand });
    });
    rankBase += actualLineCount;
  };
  layBand(formation.infantry, bounds.meleeLines);
  layBand(formation.javelins, bounds.meleeLines);
  layBand(formation.archers, bounds.archerLines);
  layBand(formation.slingers, bounds.archerLines);
  layBand(formation.ranged, bounds.archerLines);
  layBand(formation.siege);
  layBand(formation.commanders);

  // Keep mounted units on the flanks of the actual main formation. Using the
  // entire free half of the battlefield here spread even a single chariot to
  // the outer map edge. The main band is the widest non-mounted role band;
  // reserve only a few adjacent rows on either side for the wings.
  const mainBandWidth = Math.max(
    linesForBand(formation.infantry.length, bounds.meleeLines).per,
    linesForBand(formation.javelins.length, bounds.meleeLines).per,
    linesForBand(formation.archers.length, bounds.archerLines).per,
    linesForBand(formation.slingers.length, bounds.archerLines).per,
    linesForBand(formation.ranged.length, bounds.archerLines).per,
    linesForBand(formation.siege.length).per,
    linesForBand(formation.commanders.length).per,
  );
  const bandWidth = Math.max(1, mainBandWidth);
  const mainRowStart = bounds.midRow - Math.floor(bandWidth / 2);
  const mainRowEnd = mainRowStart + bandWidth - 1;
  const topWingRowsAvailable = Math.max(0, mainRowStart - (bounds.playRow0 + 1));
  const bottomWingRowsAvailable = Math.max(0, (bounds.playRow1 - 1) - mainRowEnd);
  const wingRowCount = Math.max(1, Math.min(3, topWingRowsAvailable, bottomWingRowsAvailable));
  const topRows = Array.from({ length: wingRowCount }, (_, i) => mainRowStart - 1 - i);
  const bottomRows = Array.from({ length: wingRowCount }, (_, i) => mainRowEnd + 1 + i);
  formation.mounted.forEach((unit, i) => {
    const rows = i % 2 === 0 ? topRows : bottomRows;
    const wingIndex = Math.floor(i / 2);
    slots.push({ unit, row: rows[wingIndex % rows.length]!, rank: Math.floor(wingIndex / rows.length) });
  });
  return slots;
}

/**
 * Split a default deployment into distinct role bands. Keeping role bands
 * separate lets the scene allocate a real depth rank to each, even when a band
 * has fewer units than the normal line width.
 */
export function initialBattleFormation<T>(
  units: readonly T[],
  roleOf: (unit: T) => InitialBattleRole,
): InitialBattleFormation<T> {
  const groups: InitialBattleFormation<T> = {
    infantry: [], javelins: [], archers: [], slingers: [], ranged: [],
    mounted: [], siege: [], commanders: [],
  };
  for (const unit of units) {
    switch (roleOf(unit)) {
      case 'commander': groups.commanders.push(unit); break;
      case 'mounted': groups.mounted.push(unit); break;
      case 'javelin': groups.javelins.push(unit); break;
      case 'archer': groups.archers.push(unit); break;
      case 'slinger': groups.slingers.push(unit); break;
      case 'ranged': groups.ranged.push(unit); break;
      case 'siege': groups.siege.push(unit); break;
      default: groups.infantry.push(unit); break;
    }
  }
  return groups;
}

export function compactLineAllowsAdvance(args: {
  side: 'atk' | 'def';
  candidateCol: number;
  lineReferenceProgress: number;
  previousLineReferenceProgress: number | null;
}): boolean {
  const candidateProgress = args.side === 'atk' ? args.candidateCol : -args.candidateCol;
  const ownLineLimit = args.lineReferenceProgress + 1;
  const limit = args.previousLineReferenceProgress === null
    ? ownLineLimit
    : Math.min(ownLineLimit, args.previousLineReferenceProgress);
  return candidateProgress <= limit;
}
