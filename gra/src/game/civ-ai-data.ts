/**
 * civ-ai-data.ts — odczyt per-nacja z civ-ai.json / civ-params.json (Excel 5A).
 */
import civsRaw from '../../data/civs.json';
import civAiRaw from '../../data/civ-ai.json';
import diplomacyRaw from '../../data/diplomacy.json';
import type { GameData } from '../data/loader';
import { TypCywilizacji } from '../types/player';

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

/** Agresja 0..1 z civ-ai (fallback: undefined → użyj ARCHETYPE w diplomacy.ts). */
export function civAiAggressionNorm(data: GameData, civName: string): number | undefined {
  const row = data.civAi?.cywilizacje?.find(c => c.Cywilizacja === civName);
  if (!row || row.agresywnosc == null) return undefined;
  return Math.max(0, Math.min(1, row.agresywnosc / 10));
}

export function civAiProfilMapy(data: GameData, civName: string): string | undefined {
  const row = data.civAi?.cywilizacje?.find(c => c.Cywilizacja === civName);
  return row?.profilMapy?.trim() || undefined;
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
): number {
  const civName = civExcelNameFromTyp(typ);
  if (!civName) return fallback;
  const fromData = data
    ? civAiAggressionNorm(data, civName)
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
export function resolveArchetypeTrade(typ: TypCywilizacji, fallback: number): number {
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
export function nastawienieBazoweZaufanieDelta(typ: TypCywilizacji, baseTotal = 50): number {
  const row = diplomacyPerNacjaForTyp(typ);
  if (row?.nastawienieBazowe == null) return 0;
  return (row.nastawienieBazowe - baseTotal) / 2;
}
