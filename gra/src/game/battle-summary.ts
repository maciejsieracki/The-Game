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
  /** civIconId (symbol kultury/cywilizacji) -- dobór ikony medalionu w postBattleSummary. */
  civIconId?: string;
  isCityState?: boolean;
  isBarbarian?: boolean;
  /** Epoka (1/2/3) -- dobór portretu władcy (leaderPortraits.ts), gdy dostępny. */
  era?: number;
  units: BattleSummaryUnitCard[];
  totalBefore: number;
  totalAfter: number;
  totalDead: number;
}

/**
 * LINIA-UNICESTWIENIE (R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1): osobna linia podsumowania,
 * gdy czwarty odwrot w turze (wyczerpany limit odwrotów) niszczy armię. Nie miesza się ze stratami.
 */
export interface BattleSummaryAnnihilation {
  /** Strona, której armia została unicestwiona (dla gracza i AI tak samo). */
  side: 'atakujacy' | 'obronca';
  /** Etykieta strony (cywilizacja / wódz) po polsku. */
  label: string;
  /** Ile jednostek zginęło przez unicestwienie (>= 1). */
  units: number;
  /** Powód po polsku. */
  reason: string;
}

export const ANNIHILATION_REASON_RETREAT_LIMIT =
  'wyczerpany limit odwrotów (trzy odwroty w tej turze)';

export interface PostBattleSummaryData {
  title: string;
  subtitle?: string;
  teren?: string;
  winner: BattleSummaryWinner;
  winnerLabel: string;
  mode: 'auto' | 'manual' | 'szturm';
  atakujacy: BattleSummarySide;
  obronca: BattleSummarySide;
  /** Strona gracza sterowana przez UI; role pozostają opisem przebiegu walki. */
  playerSide?: 'atk' | 'def';
  /** Krótki opis łupu (np. „+16 Pieniądz, +2 Brąz”) — tylko gdy gracz wygrał. */
  lootNote?: string;
  /** Linia „Unicestwienie” — tylko gdy limit odwrotów zniszczył armię tej bitwy. */
  annihilation?: BattleSummaryAnnihilation;
}

export interface BuildBattleSummaryInput {
  winner: BattleSummaryWinner;
  atkLabel: string;
  defLabel: string;
  atkCivLabel?: string;
  defCivLabel?: string;
  atkCivIconId?: string;
  defCivIconId?: string;
  atkIsCityState?: boolean;
  defIsCityState?: boolean;
  atkIsBarbarian?: boolean;
  defIsBarbarian?: boolean;
  atkEra?: number;
  defEra?: number;
  teren?: string;
  placeLabel?: string;
  mode: 'auto' | 'manual' | 'szturm';
  atkBefore: BattleUnitBeforeSnap[];
  defBefore: BattleUnitBeforeSnap[];
  lookupHp: (id: string) => number | null;
  playerSide?: 'atk' | 'def';
  /** LINIA-UNICESTWIENIE: wynik applyPostBattleMap (liczniki > 0 = unicestwienie tej strony). */
  annihilatedAtkUnits?: number;
  annihilatedDefUnits?: number;
}

/**
 * Buduje linię unicestwienia z liczników applyPostBattleMap. Zwraca undefined, gdy żadna
 * strona nie została unicestwiona przez limit odwrotów (brak linii).
 * Obrona ma pierwszeństwo tylko gdyby obie strony miały licznik > 0 (w praktyce niemożliwe).
 */
export function buildAnnihilationNote(
  atkUnits: number | undefined,
  defUnits: number | undefined,
  atkLabel: string,
  defLabel: string,
): BattleSummaryAnnihilation | undefined {
  if (defUnits && defUnits > 0) {
    return { side: 'obronca', label: defLabel, units: defUnits, reason: ANNIHILATION_REASON_RETREAT_LIMIT };
  }
  if (atkUnits && atkUnits > 0) {
    return { side: 'atakujacy', label: atkLabel, units: atkUnits, reason: ANNIHILATION_REASON_RETREAT_LIMIT };
  }
  return undefined;
}

/** Tekst linii unicestwienia (po polsku), używany w UI i w testach. */
export function formatAnnihilationLine(a: BattleSummaryAnnihilation): string {
  return 'Unicestwienie: ' + a.label + ' \u2014 ' + a.units + ' ' + unitsPhrasePl(a.units)
    + '; pow\u00f3d: ' + a.reason + '.';
}

/**
 * Rzeczownik + imiesłów zgodnie z polską odmianą (jednostka = rodzaj żeński):
 * 1, 21, 31 → „jednostka zniszczona”; 2–4, 22–24 (nie 12–14) → „jednostki zniszczone”;
 * reszta (0, 5–21, 25–30) → „jednostek zniszczonych”. Liczbę dopisuje wywołujący.
 */
function unitsPhrasePl(n: number): string {
  const last = n % 10;
  const last2 = n % 100;
  if (last === 1 && last2 !== 11) return 'jednostka zniszczona';
  if (last >= 2 && last <= 4 && (last2 < 12 || last2 > 14)) return 'jednostki zniszczone';
  return 'jednostek zniszczonych';
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
    civIconId: input.atkCivIconId,
    isCityState: input.atkIsCityState,
    isBarbarian: input.atkIsBarbarian,
    era: input.atkEra,
  };
  const defSide: BattleSummarySide = {
    ...defBase,
    label: input.defLabel,
    civLabel: input.defCivLabel,
    civIconId: input.defCivIconId,
    isCityState: input.defIsCityState,
    isBarbarian: input.defIsBarbarian,
    era: input.defEra,
  };

  let winnerLabel: string;
  if (input.winner === 'remis') winnerLabel = 'Remis';
  else if (input.winner === 'atakujacy') winnerLabel = input.atkLabel + ' wygrywa';
  else winnerLabel = input.defLabel + ' wygrywa';

  const modeTitle =
    input.mode === 'szturm' ? 'Wynik szturmu'
      : input.mode === 'manual' ? 'Wynik bitwy'
        : 'Wynik bitwy';

  const annihilation = buildAnnihilationNote(
    input.annihilatedAtkUnits,
    input.annihilatedDefUnits,
    input.atkLabel,
    input.defLabel,
  );

  return {
    title: modeTitle,
    subtitle: input.placeLabel,
    teren: input.teren,
    winner: input.winner,
    winnerLabel,
    mode: input.mode,
    atakujacy: atkSide,
    obronca: defSide,
    playerSide: input.playerSide ?? 'atk',
    ...(annihilation ? { annihilation } : {}),
  };
}
