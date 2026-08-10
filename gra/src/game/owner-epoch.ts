/**
 * owner-epoch.ts — epoka imperium AI z badań (nie z etykiety Epoka w tech.json).
 *
 * Zasada (miasta-państwa, `computeOwnerEraFromResearch`, NIE ZMIENIONA / EN: unchanged
 * for city-states): epoka startu gry + tylko tech oznaczone jako kończące epokę
 * (isEraAdvanceTech). Awans wcześniejszej epoki wchłonięty przy starcie w Brązie/Żelazie
 * (E1 grantTech).
 *
 * R-EPOKA-CUD-WARUNEK-AWANSU (Maciej 2026-08-09, ECHO A + doprecyzowanie zakresu):
 * cywilizacje GŁÓWNE (nie miasta-państwa) mają OSTRZEJSZĄ bramkę awansu —
 * `computeMainCivEraFromResearch` niżej. Progresja per cywilizacja pozostaje
 * niezależna/asynchroniczna (już dzisiejsze zachowanie tego modułu) — jedna
 * cywilizacja może być w Brązie, gdy inna wciąż w Kamieniu (np. czołgi vs falanga
 * w późniejszych epokach) — to ZAMIERZONE, nie naprawiać. / EN: main civilizations
 * (not city-states) get a stricter era-advance gate below; per-civ async progression
 * is preserved as-is — intentional, not a bug.
 */

import type { TechDef } from '../data/loader';
import { gameEpochIndex } from './civ-entry-epoch';
import { isEraAdvanceTech, epochNumber } from './playerState';
import { techEpochIdFromLabel } from './wonder-civ-tech';
import { getWondersForCiv } from './wonders-data';

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

// ---------------------------------------------------------------------------
// R-EPOKA-CUD-WARUNEK-AWANSU — bramka cywilizacji GŁÓWNYCH (pure logic)
// ---------------------------------------------------------------------------

/** Czy WSZYSTKIE technologie danej epoki (numer 1/2/3, pole `Epoka` w tech.json) są w `done`. */
export function allEraTechsResearched(
  era: number,
  techRows: readonly TechDef[],
  done: ReadonlySet<string>,
): boolean {
  for (const t of techRows) {
    if (epochNumber(t) !== era) continue;
    const name = t.Technologia;
    if (typeof name === 'string' && name.length > 0 && !done.has(name)) return false;
  }
  return true;
}

/** Id cudów wyłącznych (E) przypisanych tej cywilizacji w danej epoce (zwykle 0 lub 1; Chińczycy: 2 w Żelazie). */
export function eraOwnWonderIds(civType: string, era: number): string[] {
  return getWondersForCiv(civType)
    .filter(w => w.dostep === 'E' && w.epokaWejscia === era)
    .map(w => w.id);
}

/**
 * Warunek 2 (cud): spełniony gdy cywilizacja NIE MA cudu E przypisanego tej epoce
 * (warunek nie obowiązuje), LUB gdy przynajmniej jeden z przypisanych cudów jest
 * zbudowany (globalna lista `completedWonderIds` — cud E ma maxNaSwiecie=1, więc
 * "zbudowany" ⇒ przez tę cywilizację, chyba że dwóch ownerów dzieli ten sam civType
 * — patrz uwaga w raporcie Operatora, brzeg świadomie zaakceptowany, nie blokujący).
 * / EN: condition satisfied when no E-wonder is assigned to this civ+era, or at
 * least one assigned wonder id is present in the global completed-wonders list.
 */
export function eraOwnWonderSatisfied(
  civType: string,
  era: number,
  completedWonderIds: ReadonlySet<string> | readonly string[],
): boolean {
  const required = eraOwnWonderIds(civType, era);
  if (required.length === 0) return true;
  const built = completedWonderIds instanceof Set ? completedWonderIds : new Set(completedWonderIds);
  return required.some(id => built.has(id));
}

/** Najwyższa epoka z jakąkolwiek technologią w tech.json (dziś 3: Kamień/Brąz/Żelazo). */
export function maxDefinedEra(techRows: readonly TechDef[]): number {
  let max = 0;
  for (const t of techRows) {
    const e = epochNumber(t);
    if (e != null && e > max) max = e;
  }
  return max;
}

/**
 * Epoka cywilizacji GŁÓWNEJ (gracz lub AI, NIE miasto-państwo) — R-EPOKA-CUD-WARUNEK-AWANSU.
 * Awans z epoki N do N+1 wymaga OBU warunków:
 *  1. Wszystkie technologie epoki N odkryte (`allEraTechsResearched`).
 *  2. Cud wyłączny (E) epoki N — jeśli przypisany tej cywilizacji — zbudowany
 *     (`eraOwnWonderSatisfied`); brak przypisanego cudu = warunek nieaktywny.
 * Progresja per-cywilizacja, niezależna od innych ownerów (parametr `startEra` +
 * `done`/`completedWonderIds` per owner) — NIE globalna.
 * / EN: era N→N+1 requires (1) every era-N tech researched, (2) the civ's own
 * era-N exclusive wonder built IF one is assigned. Fully per-owner (async).
 */
export function computeMainCivEraFromResearch(
  startEra: number,
  done: ReadonlySet<string>,
  techRows: readonly TechDef[],
  civType: string,
  completedWonderIds: ReadonlySet<string> | readonly string[],
): number {
  const s = Math.max(1, Math.min(10, startEra));
  const cap = Math.max(s, maxDefinedEra(techRows));
  let era = s;
  while (era < cap) {
    if (!allEraTechsResearched(era, techRows, done)) break;
    if (!eraOwnWonderSatisfied(civType, era, completedWonderIds)) break;
    era += 1;
  }
  return Math.min(10, era);
}
