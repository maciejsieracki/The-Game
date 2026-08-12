/**
 * era-gate-ui.ts — R-EPOKA-CUD-ZAKRES-Q1=B: informacja UI "co brakuje do awansu epoki".
 *
 * Czysta logika (bez DOM), złożona WYŁĄCZNIE z odczytów już istniejących funkcji
 * `owner-epoch.ts` (`allEraTechsResearched`, `eraOwnWonderIds`, `eraOwnWonderSatisfied`,
 * `maxDefinedEra`) — TA BRAMKA NIE JEST TU ZMIENIANA, tylko opisywana graczowi. Dotyczy
 * WYŁĄCZNIE cywilizacji GŁÓWNYCH (`computeMainCivEraFromResearch`), nie miast-państw.
 * / EN: pure logic (no DOM) describing to the player WHY the current era is blocked —
 * composed entirely from existing owner-epoch.ts reads, the gate itself is untouched.
 * Main civs only (not city-states).
 */

import type { TechDef } from '../data/loader';
import { epochNumber } from './playerState';
import {
  allEraTechsResearched,
  eraOwnWonderIds,
  eraOwnWonderSatisfied,
  maxDefinedEra,
} from './owner-epoch';
import { getWonderById } from './wonders-data';

/** Krótkie etykiety epok zgodne z polem `Epoka` w tech.json (jak EPOCH_ORDER w sciencePicker.ts). */
const ERA_LABELS: readonly string[] = ['Kamień', 'Brąz', 'Żelazo'];

/** Etykieta epoki (1=Kamień, 2=Brąz, 3=Żelazo…) — poza znany zakres fallback na numer. */
export function eraLabelForNumber(era: number): string {
  const idx = Math.round(era) - 1;
  if (idx >= 0 && idx < ERA_LABELS.length) return ERA_LABELS[idx]!;
  return 'Epoka ' + era;
}

export interface EraGateMissingTech {
  id: string;
  name: string;
}

export interface EraGateWonderStatus {
  id: string;
  name: string;
  built: boolean;
  /** Zakolejkowany w produkcji którejś kolwiek stolicy/miasta cywilizacji, jeszcze nie ukończony. */
  inProgress: boolean;
}

export interface EraGateInfo {
  era: number;
  eraLabel: string;
  /** Etykieta epoki DOCELOWEJ (era+1) — do komunikatu "awans do X zablokowany". */
  nextEraLabel: string;
  /** Najwyższa epoka zdefiniowana w tech.json (dziś 3) — brak epoki wyżej = nic do zbadania. */
  maxEra: number;
  /** Cywilizacja jest już w najwyższej zdefiniowanej epoce — nie ma "następnej" do zablokowania. */
  isMaxEra: boolean;
  missingTechs: EraGateMissingTech[];
  techsComplete: boolean;
  /** Czy cywilizacja ma w ogóle przypisany cud wyłączny (E) tej epoce. */
  wonderRequired: boolean;
  /** Wszystkie cuda E przypisane tej cywilizacji+epoce (zwykle 0-1, Chińczycy Żelazo: 2). */
  wonders: EraGateWonderStatus[];
  /** eraOwnWonderSatisfied — spełnione gdy brak wymogu LUB przynajmniej jeden z `wonders` zbudowany. */
  wonderSatisfied: boolean;
  /** Oba warunki spełnione i jest gdzie awansować (silnik przeliczy erę automatycznie tę samą turę). */
  canAdvance: boolean;
  /** !isMaxEra && !canAdvance — jedyny stan, w którym warto pokazać graczowi panel/tooltip. */
  blocked: boolean;
}

export interface ComputeEraGateInfoParams {
  /** Bieżąca epoka cywilizacji (już przeliczona przez computeMainCivEraFromResearch). */
  era: number;
  techRows: readonly TechDef[];
  done: ReadonlySet<string>;
  civType: string;
  completedWonderIds: ReadonlySet<string> | readonly string[];
  /** Id cudów aktualnie zakolejkowanych w produkcji (dowolne miasto tej cywilizacji), opcjonalne. */
  inProgressWonderIds?: ReadonlySet<string> | readonly string[];
}

/** Buduje pełny opis stanu bramki awansu epoki dla UI (Science Hub + tooltip HUD). */
export function computeEraGateInfo(params: ComputeEraGateInfoParams): EraGateInfo {
  const { era, techRows, done, civType, completedWonderIds } = params;
  const inProgressRaw = params.inProgressWonderIds ?? [];
  const inProgressSet = inProgressRaw instanceof Set ? inProgressRaw : new Set(inProgressRaw);
  const builtSet = completedWonderIds instanceof Set ? completedWonderIds : new Set(completedWonderIds);

  const maxEra = maxDefinedEra(techRows);
  const isMaxEra = era >= maxEra;

  const missingTechs: EraGateMissingTech[] = [];
  for (const t of techRows) {
    if (epochNumber(t) !== era) continue;
    const name = t.Technologia;
    if (typeof name !== 'string' || name.length === 0) continue;
    if (!done.has(name)) missingTechs.push({ id: name, name });
  }
  missingTechs.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  const techsComplete = allEraTechsResearched(era, techRows, done);

  const wonderIds = eraOwnWonderIds(civType, era);
  const wonderRequired = wonderIds.length > 0;
  const wonders: EraGateWonderStatus[] = wonderIds.map(id => {
    const built = builtSet.has(id);
    return {
      id,
      name: getWonderById(id)?.nazwa ?? id,
      built,
      inProgress: !built && inProgressSet.has(id),
    };
  });
  const wonderSatisfied = eraOwnWonderSatisfied(civType, era, builtSet);

  const canAdvance = !isMaxEra && techsComplete && wonderSatisfied;
  const blocked = !isMaxEra && !(techsComplete && wonderSatisfied);

  return {
    era,
    eraLabel: eraLabelForNumber(era),
    nextEraLabel: eraLabelForNumber(era + 1),
    maxEra,
    isMaxEra,
    missingTechs,
    techsComplete,
    wonderRequired,
    wonders,
    wonderSatisfied,
    canAdvance,
    blocked,
  };
}

/**
 * Jedna linijka dla tooltipu HUD (panel Moc, `.p-epoch`) — `null` gdy nic nie blokuje
 * (max epoka LUB warunki spełnione), żeby tooltip nie zaśmiecał UI poza stanem blokady.
 */
export function formatEraGateSummary(info: EraGateInfo): string | null {
  if (!info.blocked) return null;
  const parts: string[] = [];
  if (!info.techsComplete) {
    parts.push('brakuje ' + info.missingTechs.length + ' technologii epoki ' + info.eraLabel);
  }
  if (info.wonderRequired && !info.wonderSatisfied) {
    const names = info.wonders.map(w => w.name).join(' / ');
    parts.push('niezbudowany cud epoki (' + names + ')');
  }
  return 'Awans do epoki ' + info.nextEraLabel + ' zablokowany: ' + parts.join('; ');
}
