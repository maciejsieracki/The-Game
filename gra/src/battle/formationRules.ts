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
  bounds: { rankWidth: number; midRow: number; playRow0: number; playRow1: number },
): InitialBattleSlot<T>[] {
  const width = Math.max(1, Math.floor(bounds.rankWidth));
  const slots: InitialBattleSlot<T>[] = [];
  let rankBase = 0;
  const layBand = (units: readonly T[]): void => {
    if (units.length === 0) return;
    const per = Math.min(units.length, width);
    const rowStart = bounds.midRow - Math.floor(per / 2);
    units.forEach((unit, i) => slots.push({
      unit, row: rowStart + i % per, rank: rankBase + Math.floor(i / per),
    }));
    rankBase += Math.ceil(units.length / per);
  };
  layBand(formation.infantry);
  layBand(formation.javelins);
  layBand(formation.archers);
  layBand(formation.slingers);
  layBand(formation.ranged);
  layBand(formation.siege);
  layBand(formation.commanders);

  const halfLine = Math.ceil(width / 2);
  const topRows = Array.from(
    { length: Math.max(1, bounds.midRow - bounds.playRow0 - halfLine - 2) },
    (_, i) => bounds.playRow0 + 1 + i,
  );
  const bottomRows = Array.from(
    { length: Math.max(1, bounds.playRow1 - bounds.midRow - halfLine - 1) },
    (_, i) => bounds.playRow1 - 1 - i,
  );
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
