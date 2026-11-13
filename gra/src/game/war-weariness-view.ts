// R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — cienki selektor do panelu dyplomacji (PURE, bez DOM i bez stanu gry).
//
// Dla jednej wojny (para a↔b) zwraca, co panel ma pokazać każdej stronie:
//  - strona WYGRYWAJĄCA (siła militarna, reguła compareMilitaryStrength z progiem przewagi) → zmęczenie wojną;
//  - strona PRZEGRYWAJĄCA → desperacja (loserDespair, ta sama formuła i ta sama konstrukcja co w ticku AI↔AI
//    w war-weariness.ts: udział siły przycięty do udzialWyraznie);
//  - REMIS (brak przewagi wg progu parytetu) → obie strony pokazują zmęczenie.
// Wartości NIE są kopiowane: czytane z warWearinessLevel / loserDespair (war-weariness.ts) i parametrów JSON.
//
// Wejścia podaje main.ts (stan gry: tury wojny, utracone miasta, siła militarna). Ten plik tylko je układa.

import {
  loserDespair,
  warWearinessLevel,
  WAR_WEARINESS_PARAMS,
  wearinessMilitaryShare,
  type WarWearinessParams,
} from './war-weariness';
import { compareMilitaryStrength, type MilitarySide } from './diplomacy-military-strength';

/** Rola strony w wojnie wg siły militarnej (remis = w progu parytetu). */
export type WarWearinessRole = 'wygrywa' | 'przegrywa' | 'rowny';

/** Dane jednej strony pary. `id` służy wyłącznie do rozstrzygnięcia remisu siły (jak w compareMilitaryStrength). */
export interface WarWearinessSideInput {
  id: string;
  /** Siła militarna strony (diplomacy-military-strength.ts, computeMilitaryStrength). */
  sila: number;
  /** Składnik armii z Power (do rozstrzygnięcia remisu siły). */
  armiaPkt: number;
  /** Miasta utracone przez TĘ stronę w tej wojnie. */
  lostCities: number;
}

export interface WarWearinessPairInput {
  /** Tury trwania wojny pary (warInfo.turnsAtWar w main.ts). */
  turnsAtWar: number;
  /** Tury od ostatniej zmiany posiadania miast (undefined = od początku wojny). */
  turnsSinceCityChange?: number;
  a: WarWearinessSideInput;
  b: WarWearinessSideInput;
}

/** Widok jednej strony. `zmeczenie` dla 'wygrywa' i 'rowny'; `desperacja` dla 'przegrywa'. Wszystko 0..1. */
export interface WarWearinessView {
  rola: WarWearinessRole;
  zmeczenie?: number;
  desperacja?: number;
}

export interface WarWearinessPairView {
  /** Wspólny poziom zmęczenia wojną pary (0..1). */
  level: number;
  a: WarWearinessView;
  b: WarWearinessView;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Widok obu stron wojny pary. Czysta funkcja; parametry domyślnie z war-weariness-params.json. */
export function warWearinessPairView(
  inp: WarWearinessPairInput,
  P: WarWearinessParams = WAR_WEARINESS_PARAMS,
): WarWearinessPairView {
  const level = clamp01(warWearinessLevel(
    {
      turnsAtWar: inp.turnsAtWar,
      lostCitiesTotal: Math.max(0, inp.a.lostCities) + Math.max(0, inp.b.lostCities),
      turnsSinceCityChange: inp.turnsSinceCityChange,
    },
    P,
  ));

  const sideA: MilitarySide = { id: inp.a.id, sila: inp.a.sila, armiaPkt: inp.a.armiaPkt };
  const sideB: MilitarySide = { id: inp.b.id, sila: inp.b.sila, armiaPkt: inp.b.armiaPkt };
  const cmp = compareMilitaryStrength(sideA, sideB);

  if (cmp.przewaga === 'brak') {
    return { level, a: { rola: 'rowny', zmeczenie: level }, b: { rola: 'rowny', zmeczenie: level } };
  }

  const aWins = cmp.przewaga === 'A';
  const loser = aWins ? inp.b : inp.a;
  const loserShare = aWins
    ? 1 - wearinessMilitaryShare(inp.a.sila, inp.b.sila)
    : wearinessMilitaryShare(inp.a.sila, inp.b.sila);
  // Ta sama konstrukcja co runWarWearinessTick: udział przycięty do „wyraźnie" (remis nie wypada z desperacji).
  const shareForDespair = Math.min(loserShare, P.przegrywajacy.udzialWyraznie);
  const despair = clamp01(loserDespair({ level, share: shareForDespair, lostCities: loser.lostCities }, P));

  const winnerView: WarWearinessView = { rola: 'wygrywa', zmeczenie: level };
  const loserView: WarWearinessView = { rola: 'przegrywa', desperacja: despair };
  return aWins
    ? { level, a: winnerView, b: loserView }
    : { level, a: loserView, b: winnerView };
}
