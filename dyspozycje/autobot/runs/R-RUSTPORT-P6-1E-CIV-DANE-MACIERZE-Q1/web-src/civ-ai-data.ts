/**
 * civ-ai-data.ts — odczyt per-nacja z civ-ai.json / civ-params.json (Excel 5A).
 */
import civsRaw from '../../data/civs.json';
import civAiRaw from '../../data/civ-ai.json';
import diplomacyRaw from '../../data/diplomacy.json';
import type { GameData } from '../data/loader';
import { TypCywilizacji } from '../types/player';
import {
  civMatrixParamAtDifficulty,
  civMatrixParamsAtDifficulty,
  loadCivMatrix,
  type CivMatrixDifficulty,
} from './civ-matrix';

export interface CivAiProfile {
  Cywilizacja: string;
  agresywnosc: number;
  ekspansywnosc: number;
  priorytetMilitarny: number;
  priorytetEkonomia: number;
  priorytetNauka: number;
  tolerancjaRyzyka: number;
  sklonnoscDoPodboju: number;
  profilMapy: string;
  uwagi?: string;
}

export interface CivParamsProfile {
  Cywilizacja: string;
  preferowaneBudynki: string;
  preferowaneJednostki: string;
  modWzrostu: number;
  modEkonomii: number;
  uwagi?: string;
}

/** Agresja 0..1 z macierzy (fallback: civ-ai.json → ARCHETYPE). */
export function civAiAggressionNorm(
  data: GameData,
  civName: string,
  difficulty: CivMatrixDifficulty = 'normal',
): number | undefined {
  const matrix = loadCivMatrix();
  const hasMatrixRow = matrix.cywilizacje.some(c =>
    c.Cywilizacja === civName || c.ikonaId === civName || c.typCywilizacji === civName,
  );
  if (hasMatrixRow) {
    return Math.max(0, Math.min(1, civMatrixParamAtDifficulty(civName, 'ai_agresywnosc', difficulty) / 10));
  }
  const row = data.civAi?.cywilizacje?.find(c => c.Cywilizacja === civName);
  if (!row || row.agresywnosc == null) return undefined;
  return Math.max(0, Math.min(1, row.agresywnosc / 10));
}

export function civAiProfilMapy(
  data: GameData,
  civName: string,
  difficulty: CivMatrixDifficulty = 'normal',
): string | undefined {
  const matrix = loadCivMatrix();
  const matrixRow = matrix.cywilizacje.find(c =>
    c.Cywilizacja === civName || c.ikonaId === civName || c.typCywilizacji === civName,
  );
  if (matrixRow) {
    return civMatrixParamAtDifficulty(matrixRow.ikonaId, 'ai_profil_obronna', difficulty) === 1
      ? 'kopia_typu_obronna'
      : 'standardowa';
  }
  const row = data.civAi?.cywilizacje?.find(c => c.Cywilizacja === civName);
  return row?.profilMapy?.trim() || undefined;
}

/** Pełny profil AI z macierzy; civ-ai.json pozostaje adapterem pól opisowych. */
export function civAiProfileFor(
  data: GameData,
  civName: string,
  difficulty: CivMatrixDifficulty = 'normal',
): CivAiProfile | undefined {
  const legacy = data.civAi?.cywilizacje?.find(c => c.Cywilizacja === civName);
  const matrix = loadCivMatrix();
  const matrixRow = matrix.cywilizacje.find(c =>
    c.Cywilizacja === civName || c.ikonaId === civName || c.typCywilizacji === civName,
  );
  if (!legacy && !matrixRow) return undefined;
  if (!matrixRow) return legacy;

  const values = civMatrixParamsAtDifficulty(matrixRow.ikonaId, difficulty);
  return {
    Cywilizacja: legacy?.Cywilizacja ?? matrixRow.Cywilizacja,
    agresywnosc: values.ai_agresywnosc ?? 5,
    ekspansywnosc: values.ai_ekspansywnosc ?? 5,
    priorytetMilitarny: values.ai_priorytet_militarny ?? 5,
    priorytetEkonomia: values.ai_priorytet_ekonomia ?? 5,
    priorytetNauka: values.ai_priorytet_nauka ?? 5,
    tolerancjaRyzyka: values.ai_tolerancja_ryzyka ?? 5,
    sklonnoscDoPodboju: values.ai_sklonnosc_podboju ?? 5,
    // `ai_profil_obronna` is a flag in the matrix; do not silently keep a
    // conflicting legacy profile when the matrix explicitly says 0.
    profilMapy: values.ai_profil_obronna === 1 ? 'kopia_typu_obronna' : 'standardowa',
    uwagi: legacy?.uwagi,
  };
}

/** Profil po TypCywilizacji (ikonaId w civs.json). */
export function civAiProfileForTyp(
  data: GameData,
  typ: TypCywilizacji,
  difficulty: CivMatrixDifficulty = 'normal',
): CivAiProfile | undefined {
  const name = civExcelNameFromTyp(typ);
  return name ? civAiProfileFor(data, name, difficulty) : undefined;
}

export function civParamsFor(data: GameData, civName: string): CivParamsProfile | undefined {
  return data.civParams?.cywilizacje?.find(c => c.Cywilizacja === civName);
}

/** Czy owner to kopia typu (D-START) wg profilu Excel. */
export function isKopiaTypuObronna(data: GameData, civName: string): boolean {
  const p = civAiProfilMapy(data, civName);
  return p === 'kopia_typu_obronna';
}

export interface DiplomacyPerNacjaRow {
  Cywilizacja: string;
  sklonnoscSojusze?: number;
  lojalnosc?: number;
  progWojny?: number;
  pamietliwosc?: number;
  otwartoscHandel?: number;
  nastawienieBazowe?: number;
  uwagi?: string;
}

/** Nazwa z Excela (Cywilizacja) z enum TypCywilizacji — przez civs.json ikonaId. */
export function civExcelNameFromTyp(typ: TypCywilizacji): string | undefined {
  if (typ === TypCywilizacji.DrobnaCywilizacja) return undefined;
  const row = civsRaw.cywilizacje.find(c => c.ikonaId === typ);
  return row?.Cywilizacja;
}

export function diplomacyPerNacjaRow(civName: string): DiplomacyPerNacjaRow | undefined {
  const rows = (diplomacyRaw as { perNacja?: DiplomacyPerNacjaRow[] }).perNacja;
  return rows?.find(r => r.Cywilizacja === civName);
}

export function diplomacyPerNacjaForTyp(typ: TypCywilizacji): DiplomacyPerNacjaRow | undefined {
  const name = civExcelNameFromTyp(typ);
  return name ? diplomacyPerNacjaRow(name) : undefined;
}

/**
 * Agresja 0..1: civ-ai.json (Excel 5A) gdy wpis istnieje, inaczej fallback (ARCHETYPE_AGGRESSION).
 */
export function resolveArchetypeAggression(
  typ: TypCywilizacji,
  fallback: number,
  data?: GameData,
  difficulty: CivMatrixDifficulty = 'normal',
): number {
  const civName = civExcelNameFromTyp(typ);
  if (!civName) return fallback;
  const matrix = loadCivMatrix();
  const matrixRow = matrix.cywilizacje.find(c =>
    c.Cywilizacja === civName || c.ikonaId === typ || c.typCywilizacji === typ,
  );
  if (matrixRow) {
    return Math.max(0, Math.min(1, civMatrixParamAtDifficulty(typ, 'ai_agresywnosc', difficulty) / 10));
  }
  const fromData = data
    ? civAiAggressionNorm(data, civName, difficulty)
    : (() => {
        const row = civAiRaw.cywilizacje?.find(c => c.Cywilizacja === civName);
        if (!row || row.agresywnosc == null) return undefined;
        return Math.max(0, Math.min(1, row.agresywnosc / 10));
      })();
  return fromData ?? fallback;
}

/**
 * Skłonność do handlu 0..1: diplomacy.perNacja.otwartoscHandel / 10, inaczej fallback.
 */
export function resolveArchetypeTrade(
  typ: TypCywilizacji,
  fallback: number,
  difficulty: CivMatrixDifficulty = 'normal',
): number {
  const matrix = loadCivMatrix();
  const matrixRow = matrix.cywilizacje.find(c => c.ikonaId === typ || c.typCywilizacji === typ);
  if (matrixRow) {
    return Math.max(0, Math.min(1, civMatrixParamAtDifficulty(typ, 'dip_handlowosc_archetyp', difficulty)));
  }
  const row = diplomacyPerNacjaForTyp(typ);
  if (row?.otwartoscHandel != null) {
    return Math.max(0, Math.min(1, row.otwartoscHandel / 10));
  }
  return fallback;
}

/**
 * Korekta startZaufanie z perNacja.nastawienieBazowe (59 = +9 vs domyślne 50 łącznie).
 * Połowa delty per strona — para Grecy+Rzym dostaje sumaryczną korektę obu nacji.
 */
export function nastawienieBazoweZaufanieDelta(
  typ: TypCywilizacji,
  baseTotal = 50,
  difficulty: CivMatrixDifficulty = 'normal',
): number {
  const matrix = loadCivMatrix();
  const matrixRow = matrix.cywilizacje.find(c => c.ikonaId === typ || c.typCywilizacji === typ);
  if (matrixRow) {
    return (civMatrixParamAtDifficulty(typ, 'dip_nastawienie_bazowe', difficulty) - baseTotal) / 2;
  }
  const row = diplomacyPerNacjaForTyp(typ);
  if (row?.nastawienieBazowe == null) return 0;
  return (row.nastawienieBazowe - baseTotal) / 2;
}
