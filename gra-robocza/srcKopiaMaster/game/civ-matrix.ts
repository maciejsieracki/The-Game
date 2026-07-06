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
): number {
  const val = civMatrixParam(civKey, paramId);
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
      return base * (1 + val);
  }
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
