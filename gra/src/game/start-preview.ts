/**
 * start-preview.ts — podgląd startu klastra (kreator nowej gry → SILNIK).
 * Pure functions: CYWILIZACJE (nazwy) + MAPA (skala menu).
 * Decyzje: D-START-klaster-nazwy, D-START-miasta-kopie-typu.
 */

import type { CivsData } from '../data/loader';
import {
  playerStartCityName,
  clusterRivalCityName,
  civDisplayName,
} from './civ-names';
import {
  defaultCivTypesFromMapLabel,
  defaultMiastaPanstwaFromMapLabel,
} from '../map/newGameMapDefaults';

/** Kontrakt przekazywany w NewGameParams.startPreview → weryfikacja w SILNIK. */
export interface StartPreview {
  playerCivId: string;
  /** N-1A: nazwyKlastra[0] */
  playerCapitalName: string;
  /** N-3A: nazwyKlastra[1..N] */
  sameTypeRivalNames: readonly string[];
  /** D-START-1B: liczba rywali tego samego typu w klastrze gracza */
  sameTypeRivalCount: number;
  /** Aktywne typy na mapie (3/5/7/9) */
  activeTypesOnMap: number;
  /** Obcy typy poza klastrem gracza */
  foreignTypesCount: number;
  /** Skrót modelu dla UI (1 linia) */
  modelLine: string;
  /** Dłuższy opis modelu miast-kopii (panel kreatora) */
  modelDetail: string;
}

export interface BuildStartPreviewInput {
  civs: CivsData;
  playerCivId: string;
  /** Etykieta menu np. Standardowy — opcjonalna przed krokiem Ustawienia */
  mapSizeMenuLabel?: string;
  /** Nadpisanie liczby miast-państw z suwaka kreatora */
  cityStatesCount?: number;
  /** Nadpisanie liczby typów cywilizacji na mapie */
  activeTypesCount?: number;
  /** @deprecated użyj cityStatesCount */
  rivalsCount?: number;
}

/**
 * Buduje podgląd startu — używany w kreatorze (krok Cywilizacja / Ustawienia / Generowanie)
 * i opcjonalnie w SILNIK do logów weryfikacyjnych.
 */
export function buildStartPreview(input: BuildStartPreviewInput): StartPreview {
  const { civs, playerCivId, mapSizeMenuLabel, cityStatesCount, activeTypesCount, rivalsCount } = input;
  const mapLabel = mapSizeMenuLabel ?? 'Standardowy';
  const rivalN = cityStatesCount ?? rivalsCount ?? defaultMiastaPanstwaFromMapLabel(mapLabel);
  const activeTypes = activeTypesCount ?? defaultCivTypesFromMapLabel(mapLabel);
  const foreignTypes = Math.max(0, activeTypes - 1);

  const playerCapitalName = playerStartCityName(civs, playerCivId);
  const sameTypeRivalNames: string[] = [];
  for (let i = 1; i <= rivalN; i++) {
    sameTypeRivalNames.push(clusterRivalCityName(civs, playerCivId, i));
  }

  const civLabel = civDisplayName(civs, playerCivId);
  const rivalsShort = sameTypeRivalNames.slice(0, 3).join(', ')
    + (sameTypeRivalNames.length > 3 ? '…' : '');

  const modelLine =
    `Klaster ${civLabel}: stolica ${playerCapitalName}, `
    + `${rivalN} rywali tego typu`
    + (foreignTypes > 0 ? ` · ${foreignTypes} obcych typów na mapie` : '');

  const modelDetail =
    'Start w klastrze twojego typu: pierwsze miasto = '
    + playerCapitalName
    + '. Wokół ciebie miasta-kopie tego samego typu ('
    + rivalsShort
    + ') — do pokonania. '
    + (foreignTypes > 0
      ? `Na mapie także ${foreignTypes} obcych typów (własne klastry miast-kopii) — do podbicia; pełna dyplomacja po kontakcie.`
      : '');

  return {
    playerCivId,
    playerCapitalName,
    sameTypeRivalNames,
    sameTypeRivalCount: rivalN,
    activeTypesOnMap: activeTypes,
    foreignTypesCount: foreignTypes,
    modelLine,
    modelDetail,
  };
}

/** Wiersze podsumowania na ekranie Generowanie (kreator). */
export function startPreviewSummaryRows(p: StartPreview): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['Stolica (start)', p.playerCapitalName],
    ['Rywale tego typu', String(p.sameTypeRivalCount) + ' miast-państw · ' + p.sameTypeRivalNames.slice(0, 4).join(', ') + (p.sameTypeRivalNames.length > 4 ? '…' : '')],
    ['Typy na mapie', String(p.activeTypesOnMap) + ' (obce: ' + String(p.foreignTypesCount) + ')'],
    ['Model startu', 'Klaster + miasta-kopie typu'],
  ];
  return rows;
}
