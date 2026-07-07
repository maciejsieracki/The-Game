/**
 * owner-epoch.ts — epoka imperium AI z badań (nie z etykiety Epoka w tech.json).
 *
 * Zasada: epoka startu gry + tylko tech oznaczone jako kończące epokę (isEraAdvanceTech).
 * Awans wcześniejszej epoki wchłonięty przy starcie w Brązie/Żelazie (E1 grantTech).
 */

import type { TechDef } from '../data/loader';
import { gameEpochIndex } from './civ-entry-epoch';
import { isEraAdvanceTech } from './playerState';
import { techEpochIdFromLabel } from './wonder-civ-tech';

export function computeOwnerEraFromResearch(
  startEra: number,
  done: ReadonlySet<string>,
  techRows: readonly TechDef[],
): number {
  const s = Math.max(1, Math.min(10, startEra));
  if (!done.size) return s;
  let era = s;
  for (const tname of done) {
    const t = techRows.find(row => row.Technologia === tname);
    if (!t || !isEraAdvanceTech(t)) continue;
    const techEpIdx = gameEpochIndex(
      techEpochIdFromLabel(String(t.Epoka ?? 'Kamień')),
    );
    // Tech kończący epokę techEpIdx → wejście w (techEpIdx+2). Już w startEra — pomiń.
    if (techEpIdx + 2 <= s) continue;
    era = Math.min(10, era + 1);
  }
  return era;
}
