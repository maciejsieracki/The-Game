// SLICE verbatim: gra/src/game/economy.ts @91dc998a, linie 703-762 i 781-786 (bez zmian tresci).
// Jedyna zmiana: specyfikator importu civ-matrix z rozszerzeniem .ts (wymog node strip-types) i
// lokalne aliasy typow (typy nie wplywaja na wykonanie).
import { applyCivMatrixParam, civMatrixParam, loadCivMatrix } from './civ-matrix.ts';
type Difficulty = 'easy' | 'normal' | 'hard';
type CivMnoznikRow = any;
type CivEconomyBonus = any;

/** Compatibility API: matrix value, or the supplied generic system fallback. */
export function mnoznikHandelPieniadzForCiv(
  civKey: string | null | undefined,
  _civs: { cywilizacje?: CivMnoznikRow[] } | null | undefined,
  fallback = 1,
): number {
  const matrixValue = civMatrixMnoznikHandelPieniadzRaw(civKey);
  return matrixValue === undefined ? fallback : matrixValue;
}

/**
 * Canonical matrix source for a known civilization. Raw zero is a matrix value
 * and must not reactivate the retired civs.json multiplier.
 */
function civMatrixMnoznikHandelPieniadzRaw(civKey: string | null | undefined): number | undefined {
  if (!civKey) return undefined;
  const key = civKey.toLowerCase();
  const known = loadCivMatrix().cywilizacje.some((row) => [
    row.ikonaId,
    row.typCywilizacji,
    row.Cywilizacja,
  ].some((id) => id.toLowerCase() === key));
  if (!known) return undefined;
  const value = civMatrixParam(civKey, 'meta_mnoznik_waluta');
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Difficulty delta applied on top of the canonical civ-matrix.json
 * meta_mnoznik_waluta value (decyzja Maciej 2026-07-25, pytanie 69 --
 * "mnoznik cywilizacyjny skalowany poziomem trudnosci"): "Zostawmy go jako
 * obowiazujacy dla poziomu normal. Wersja easy bedzie miala pol punktu wiecej
 * [...] wersja hard pol punktu mniej." The matrix number IS the normal-difficulty
 * value; we never edit source data here -- the +0.5 / -0.5 scaling lives only here.
 */
const MNOZNIK_HANDEL_TRUDNOSC_DELTA: Record<Difficulty, number> = {
  easy:   0.5,
  normal: 0,
  hard:   -0.5,
};

/**
 * Matrix multiplier with the established difficulty delta. The civs.json
 * numerical field is never read. `fallbackScaled` is the generic difficulty
 * baseline for owners without a resolving matrix key.
 *
 * `fallbackScaled` already includes generic difficulty behavior and is not
 * adjusted a second time. Known matrix raw zero remains authoritative and
 * receives the existing difficulty delta like any other matrix value.
 */
export function mnoznikHandelPieniadzForCivByDifficulty(
  civKey: string | null | undefined,
  _civs: { cywilizacje?: CivMnoznikRow[] } | null | undefined,
  difficulty: Difficulty,
  fallbackScaled: number,
): number {
  const raw = civMatrixMnoznikHandelPieniadzRaw(civKey);
  if (raw === undefined) return fallbackScaled;
  return raw + (MNOZNIK_HANDEL_TRUDNOSC_DELTA[difficulty] ?? 0);
}
/** Legacy civs.json yield bonuses are no longer numerical consumer inputs. */
export function civEconomyYieldMultipliers(
  _bonusy: readonly CivEconomyBonus[] | undefined,
): { handel: number; nauka: number } {
  return { handel: 1, nauka: 1 };
}
