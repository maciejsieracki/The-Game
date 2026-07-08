/**
 * civ-entry-epoch.ts — epoka PIERWSZEGO wejścia cywilizacji (kaskada w górę).
 *
 * Kanon Maciej 2026-07-03:
 * - epokaWejscia = pierwsza epoka, w której typ jest dostępny w kreatorze i na mapie
 * - wchodzi w X → dostępna w X i każdej późniejszej (Kamień → Brąz → Żelazo)
 * - bez wyjątków
 */

export const GAME_EPOCH_ORDER = ['kamien', 'braz', 'zelazo'] as const;
export type GameEpochId = (typeof GAME_EPOCH_ORDER)[number];

export interface CivEntryEpochRow {
  ikonaId?: string;
  /** Pierwsza epoka wejścia (kanon). */
  epokaWejscia?: string;
  /** Legacy — min(tablica) = epokaWejscia, jeśli brak pola epokaWejscia. */
  epokiStartowe?: string[];
}

export function gameEpochIndex(epochId: string): number {
  const i = GAME_EPOCH_ORDER.indexOf(epochId as GameEpochId);
  return i >= 0 ? i : GAME_EPOCH_ORDER.length;
}

/** Pierwsza epoka wejścia typu (kamien | braz | zelazo). */
export function getCivEpokaWejscia(civ: CivEntryEpochRow): GameEpochId {
  const direct = civ.epokaWejscia;
  if (direct && GAME_EPOCH_ORDER.includes(direct as GameEpochId)) {
    return direct as GameEpochId;
  }
  const legacy = civ.epokiStartowe;
  if (legacy && legacy.length > 0) {
    const indices = legacy
      .map((e) => gameEpochIndex(e))
      .filter((i) => i < GAME_EPOCH_ORDER.length);
    if (indices.length > 0) {
      const min = Math.min(...indices);
      return GAME_EPOCH_ORDER[min]!;
    }
  }
  return 'kamien';
}

/**
 * Czy typ cywilizacji może być wybrany / wylosowany przy starcie w danej epoce gry.
 */
export function isCivAvailableAtGameEpoch(civ: CivEntryEpochRow, gameEpochId: string): boolean {
  const entryIdx = gameEpochIndex(getCivEpokaWejscia(civ));
  const gameIdx = gameEpochIndex(gameEpochId);
  return entryIdx <= gameIdx;
}

/** ikonaId typów dostępnych w epoce startu gry. */
export function civIdsAvailableAtGameEpoch(
  cywilizacje: readonly CivEntryEpochRow[],
  gameEpochId: string,
): string[] {
  return cywilizacje
    .filter((c) => c.ikonaId && isCivAvailableAtGameEpoch(c, gameEpochId))
    .map((c) => c.ikonaId!);
}

/** Etykieta UI: „Wejście: Brąz · dostępne: Brąz, Żelazo”. */
export function formatCivEntryEpochLabel(civ: CivEntryEpochRow): string {
  const entry = getCivEpokaWejscia(civ);
  const entryIdx = gameEpochIndex(entry);
  const available = GAME_EPOCH_ORDER.filter((e, i) => i >= entryIdx);
  const names: Record<GameEpochId, string> = {
    kamien: 'Kamień',
    braz: 'Brąz',
    zelazo: 'Żelazo',
  };
  return `Wejście: ${names[entry]} · dostępne: ${available.map((e) => names[e]).join(', ')}`;
}

/** Etykieta epoki na HUD mapy (panel Moc) — z indeksu gry 1=Kamień… */
const EPOCH_HUD_LABELS: Record<GameEpochId, string> = {
  kamien: 'Epoka kamienia',
  braz: 'Epoka brązu',
  zelazo: 'Epoka żelaza',
};

export function gameEpochHudLabel(eraIndex: number): string {
  const idx = Math.max(1, Math.min(GAME_EPOCH_ORDER.length, Math.round(eraIndex))) - 1;
  const id = GAME_EPOCH_ORDER[idx] ?? 'kamien';
  return EPOCH_HUD_LABELS[id] ?? `Epoka ${eraIndex}`;
}
