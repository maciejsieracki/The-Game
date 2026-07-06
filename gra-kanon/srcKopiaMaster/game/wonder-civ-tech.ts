/**
 * wonder-civ-tech.ts — reguła techUnlock cudów E vs epokaWejscia państwa.
 *
 * Kanon Maciej 2026-07-03:
 * - Cud wyłączny (E) państwa: każdy tech w techUnlock musi być z epoki >= epokaWejscia
 * - Późniejsze epoki dozwolone (Brąz może mieć tech Żelaza; Kamień — Brąz i Żelazo)
 * - Zakaz: tech z epoki WCZEŚNIEJSZEJ niż debiut państwa
 */

import { gameEpochIndex, getCivEpokaWejscia, type CivEntryEpochRow } from './civ-entry-epoch';

/** Mapowanie nazwy tech (tech.json → Technologia) na epokę gry. */
export type TechEpochMap = ReadonlyMap<string, string>;

const EPOCH_LABEL_TO_ID: Record<string, string> = {
  Kamień: 'kamien',
  'Kamien': 'kamien',
  Brąz: 'braz',
  Braz: 'braz',
  Żelazo: 'zelazo',
  Zelazo: 'zelazo',
};

export function techEpochIdFromLabel(epokaLabel: string): string {
  return EPOCH_LABEL_TO_ID[epokaLabel] ?? 'kamien';
}

/** Buduje mapę nazwa technologii → kamien|braz|zelazo z tech.json. */
export function buildTechEpochMap(
  technologie: readonly { Technologia?: string; Epoka?: string }[],
): TechEpochMap {
  const out = new Map<string, string>();
  for (const t of technologie) {
    const name = t.Technologia;
    const ep = t.Epoka;
    if (typeof name === 'string' && name.length > 0 && typeof ep === 'string') {
      out.set(name, techEpochIdFromLabel(ep));
    }
  }
  return out;
}

export function techEpochIndex(techName: string, techMap: TechEpochMap): number {
  const epochId = techMap.get(techName);
  return epochId != null ? gameEpochIndex(epochId) : -1;
}

/** Czy wszystkie tech spełniają regułę >= epokaWejscia państwa. */
export function wonderTechValidForCivEntry(
  civ: CivEntryEpochRow,
  techUnlock: readonly string[],
  techMap: TechEpochMap,
): boolean {
  if (techUnlock.length === 0) return true;
  const minIdx = gameEpochIndex(getCivEpokaWejscia(civ));
  return techUnlock.every((tech) => {
    const tIdx = techEpochIndex(tech, techMap);
    return tIdx >= 0 && tIdx >= minIdx;
  });
}

export interface WonderTechViolation {
  wonderId: string;
  civId: string;
  civEntryEpoch: string;
  invalidTech: string;
  techEpoch: string;
}

/** Walidacja cudów E przypisanych do państw (test / CI). */
export function findExclusiveWonderTechViolations(
  cuda: readonly {
    id?: string;
    dostep?: string;
    cywilizacje?: string[];
    techUnlock?: string[];
  }[],
  cywilizacje: readonly CivEntryEpochRow[],
  techMap: TechEpochMap,
): WonderTechViolation[] {
  const civById = new Map(
    cywilizacje.filter((c) => c.ikonaId).map((c) => [c.ikonaId!, c]),
  );
  const out: WonderTechViolation[] = [];

  for (const w of cuda) {
    if (w.dostep !== 'E' || !w.id) continue;
    const techs = w.techUnlock ?? [];
    for (const civId of w.cywilizacje ?? []) {
      const civ = civById.get(civId);
      if (!civ) continue;
      const entry = getCivEpokaWejscia(civ);
      const minIdx = gameEpochIndex(entry);
      for (const tech of techs) {
        const tEpoch = techMap.get(tech);
        const tIdx = tEpoch != null ? gameEpochIndex(tEpoch) : -1;
        if (tIdx < minIdx) {
          out.push({
            wonderId: w.id,
            civId,
            civEntryEpoch: entry,
            invalidTech: tech,
            techEpoch: tEpoch ?? '?',
          });
        }
      }
    }
  }
  return out;
}
