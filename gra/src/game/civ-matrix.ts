/**
 * civ-matrix.ts — odczyt mnoznikow cywilizacji z civ-matrix.json (Panel Cyw-macierz).
 *
 * Kontrakt dla modulow:
 *   const m = civMatrixParam('grecy', 'walka_obrona_piechota');
 *   stat *= (1 + m);  // formula mul_proc
 *
 * Eksport: panele-sterowania/export-cyw-macierz.py
 */
import matrixRaw from '../../data/civ-matrix.json';

export type CivMatrixFormula = 'mul_proc' | 'mul_abs' | 'add' | 'flag' | 'skala' | 'stat_abs';

/** Trzy poziomy trudności używane przez profile cywilizacji. */
export type CivMatrixDifficulty = 'easy' | 'normal' | 'hard';

export interface CivMatrixParamDef {
  domena: string;
  jednostka: string;
  modul: string;
  formula: CivMatrixFormula;
}

export interface CivMatrixRow {
  Cywilizacja: string;
  typCywilizacji: string;
  ikonaId: string;
  tier: number;
  params: Record<string, number>;
}

/** Injectable lookup used by pure consumers and focused tests. */
export type CivMatrixParamResolver = (civKey: string, paramId: string) => number;

export interface CivMatrixData {
  _meta: Record<string, unknown>;
  paramDefs: Record<string, CivMatrixParamDef>;
  defaults: Record<string, number>;
  cywilizacje: CivMatrixRow[];
}

const DATA = matrixRaw as CivMatrixData;

/** Pelna macierz (testy / debug). */
export function loadCivMatrix(): CivMatrixData {
  return DATA;
}

function resolveRow(civKey: string): CivMatrixRow | undefined {
  const key = civKey.toLowerCase();
  return DATA.cywilizacje.find(c =>
    c.ikonaId.toLowerCase() === key ||
    c.typCywilizacji.toLowerCase() === key ||
    c.Cywilizacja.toLowerCase() === key,
  );
}

/** Surowa wartosc parametru (0 = brak efektu dla mul_proc). */
export function civMatrixParam(civKey: string, paramId: string): number {
  const row = resolveRow(civKey);
  if (!row) return DATA.defaults[paramId] ?? 0;
  return row.params[paramId] ?? DATA.defaults[paramId] ?? 0;
}

/**
 * Wartość parametru dla poziomu trudności.
 *
 * Wartość płaska w `params` jest kanoniczną wartością Normal. Tylko pola
 * oznaczone w definicji jako `skala` są skalowane przez trudność (Normal - 1
 * na Easy, Normal + 1 na Hard, z ograniczeniem 1..10). Flagi, bonusy i
 * statystyki cywilizacji pozostają cechą nację i nie są po cichu wzmacniane
 * poziomem trudności.
 */
export function civMatrixParamAtDifficulty(
  civKey: string,
  paramId: string,
  difficulty: CivMatrixDifficulty = 'normal',
): number {
  const normal = civMatrixParam(civKey, paramId);
  if (difficulty === 'normal' || civMatrixParamDef(paramId)?.formula !== 'skala') return normal;
  const delta = difficulty === 'easy' ? -1 : 1;
  return Math.max(1, Math.min(10, normal + delta));
}

/**
 * Pełny, jawny snapshot 113 parametrów dla poziomu trudności.
 * Klucze pochodzą z `paramDefs`, więc brak parametru nie może zniknąć z
 * raportu pokrycia ani z adaptera konsumenta.
 */
export function civMatrixParamsAtDifficulty(
  civKey: string,
  difficulty: CivMatrixDifficulty = 'normal',
): Record<string, number> {
  return Object.fromEntries(
    Object.keys(DATA.paramDefs).map(paramId => [
      paramId,
      civMatrixParamAtDifficulty(civKey, paramId, difficulty),
    ]),
  );
}

/** Definicja parametru (modul docelowy, formula). */
export function civMatrixParamDef(paramId: string): CivMatrixParamDef | undefined {
  return DATA.paramDefs[paramId];
}

/**
 * Zastosuj formula z macierzy.
 * mul_proc: baza * (1 + val)
 * mul_abs:  baza * val
 * add:      baza + val
 */
export function applyCivMatrixParam(
  base: number,
  civKey: string,
  paramId: string,
  resolve: CivMatrixParamResolver = civMatrixParam,
): number {
  const val = resolve(civKey, paramId);
  const def = civMatrixParamDef(paramId);
  const formula = def?.formula ?? 'mul_proc';
  switch (formula) {
    case 'mul_abs':
      return base * val;
    case 'add':
      return base + val;
    case 'flag':
    case 'skala':
    case 'stat_abs':
      return val;
    case 'mul_proc':
    default:
      return applyCivMatrixMulProc(base, val);
  }
}

/** Apply a fractional multiplier; 0.10 means +10%, -0.10 means -10%. */
export function applyCivMatrixMulProc(base: number, delta: number): number {
  const safeBase = Number.isFinite(base) ? base : 0;
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  return safeBase * (1 + safeDelta);
}

/**
 * Cost fields use the same `mul_proc` value as the rest of the matrix, but a
 * positive value is a discount: 0.1 means base × (1 − 0.1).
 */
export function applyCivMatrixCostReduction(
  base: number,
  civKey: string,
  paramId: string,
  resolve: CivMatrixParamResolver = civMatrixParam,
): number {
  const value = resolve(civKey, paramId);
  return Math.max(0, base * (1 - value));
}

/** Sumuje kilka parametrow tej samej formuly mul_proc (walka: wiecej kolumn). */
export function civMatrixProcSum(civKey: string, paramIds: readonly string[]): number {
  let sum = 0;
  for (const id of paramIds) sum += civMatrixParam(civKey, id);
  return sum;
}

export function civMatrixApplyProc(base: number, civKey: string, paramIds: readonly string[]): number {
  return base * (1 + civMatrixProcSum(civKey, paramIds));
}
