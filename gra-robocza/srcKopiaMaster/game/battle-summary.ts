/**
 * battle-summary.ts — dane podsumowania po bitwie (mapa / szturm).
 */

export type BattleSummaryWinner = 'atakujacy' | 'obronca' | 'remis';

export interface BattleUnitBeforeSnap {
  id: string;
  typeId: string;
  kategoria: string;
  hp: number;
  maxHp: number;
}

/** Jedna karta jednostki (jak w preBattle — per sztuka w składzie). */
export interface BattleSummaryUnitCard {
  typeId: string;
  kategoria: string;
  hpBefore: number;
  hpAfter: number;
  maxHp: number;
  hpBeforePct: number;
  hpAfterPct: number;
  /** Ile % max HP utracono (0–100). */
  lossPct: number;
  dead: boolean;
}

export interface BattleSummarySide {
  label: string;
  civLabel?: string;
  units: BattleSummaryUnitCard[];
  totalBefore: number;
  totalAfter: number;
  totalDead: number;
}

export interface PostBattleSummaryData {
  title: string;
  subtitle?: string;
  teren?: string;
  winner: BattleSummaryWinner;
  winnerLabel: string;
  mode: 'auto' | 'manual' | 'szturm';
  atakujacy: BattleSummarySide;
  obronca: BattleSummarySide;
}

export interface BuildBattleSummaryInput {
  winner: BattleSummaryWinner;
  atkLabel: string;
  defLabel: string;
  atkCivLabel?: string;
  defCivLabel?: string;
  teren?: string;
  placeLabel?: string;
  mode: 'auto' | 'manual' | 'szturm';
  atkBefore: BattleUnitBeforeSnap[];
  defBefore: BattleUnitBeforeSnap[];
  lookupHp: (id: string) => number | null;
}

function pct(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
}

function buildSideUnits(
  before: BattleUnitBeforeSnap[],
  lookupHp: (id: string) => number | null,
): Omit<BattleSummarySide, 'label' | 'civLabel'> {
  const units: BattleSummaryUnitCard[] = [];

  for (const snap of before) {
    const afterRaw = lookupHp(snap.id);
    const dead = afterRaw === null || afterRaw <= 0;
    const hpAfter = dead ? 0 : afterRaw;
    const hpBeforePct = pct(snap.hp, snap.maxHp);
    const hpAfterPct = dead ? 0 : pct(hpAfter, snap.maxHp);
    const lossPct = dead
      ? 100
      : Math.max(0, Math.min(100, pct(snap.hp - hpAfter, snap.maxHp)));

    units.push({
      typeId: snap.typeId,
      kategoria: snap.kategoria,
      hpBefore: snap.hp,
      hpAfter,
      maxHp: snap.maxHp,
      hpBeforePct,
      hpAfterPct,
      lossPct,
      dead,
    });
  }

  let totalDead = 0;
  for (const u of units) {
    if (u.dead) totalDead += 1;
  }

  return {
    units,
    totalBefore: units.length,
    totalAfter: units.length - totalDead,
    totalDead,
  };
}

export function buildPostBattleSummary(input: BuildBattleSummaryInput): PostBattleSummaryData {
  const atkBase = buildSideUnits(input.atkBefore, input.lookupHp);
  const defBase = buildSideUnits(input.defBefore, input.lookupHp);

  const atkSide: BattleSummarySide = {
    ...atkBase,
    label: input.atkLabel,
    civLabel: input.atkCivLabel,
  };
  const defSide: BattleSummarySide = {
    ...defBase,
    label: input.defLabel,
    civLabel: input.defCivLabel,
  };

  let winnerLabel: string;
  if (input.winner === 'remis') winnerLabel = 'Remis';
  else if (input.winner === 'atakujacy') winnerLabel = input.atkLabel + ' wygrywa';
  else winnerLabel = input.defLabel + ' wygrywa';

  const modeTitle =
    input.mode === 'szturm' ? 'Wynik szturmu'
      : input.mode === 'manual' ? 'Wynik bitwy'
        : 'Wynik bitwy';

  return {
    title: modeTitle,
    subtitle: input.placeLabel,
    teren: input.teren,
    winner: input.winner,
    winnerLabel,
    mode: input.mode,
    atakujacy: atkSide,
    obronca: defSide,
  };
}
