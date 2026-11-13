// R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — cienki selektor do panelu dyplomacji (PURE, bez DOM i bez stanu gry).
//
// Dla jednej wojny (para a↔b) zwraca, co panel ma pokazać każdej stronie:
//  - strona WYGRYWAJĄCA (siła militarna, reguła compareMilitaryStrength z progiem przewagi) → zmęczenie wojną;
//  - strona PRZEGRYWAJĄCA → desperacja (loserDespair, ta sama formuła co w war-weariness.ts);
//  - REMIS (brak przewagi wg progu parytetu) → obie strony pokazują zmęczenie.
// Wartości NIE są kopiowane: czytane z warWearinessLevel / loserDespair (war-weariness.ts) i parametrów JSON.
//
// Wejścia podaje main.ts (stan gry: tury wojny, utracone miasta, siła militarna). Ten plik tylko je układa.
// Dwa tryby zgodności z ticiem (WarWearinessReference):
//  - 'tick' — para AI↔AI, jak runWarWearinessTick: poziom = szczyt pary, udział przycięty do udzialWyraznie;
//  - 'ai'   — para gracz↔AI, jak ai.ts: poziom = bieżący, udział nieprzycięty, desperacja tylko przy isWarWeary.

import {
  isWarWeary,
  loserDespair,
  warWearinessLevel,
  WAR_WEARINESS_PARAMS,
  wearinessMilitaryShare,
  type WarWearinessParams,
} from './war-weariness';
import { compareMilitaryStrength, type MilitarySide } from './diplomacy-military-strength';

/** Rola strony w wojnie wg siły militarnej (remis = w progu parytetu). */
export type WarWearinessRole = 'wygrywa' | 'przegrywa' | 'rowny';

/** Który tick odwzorowujemy: 'tick' = AI↔AI (runWarWearinessTick), 'ai' = gracz↔AI (ai.ts). */
export type WarWearinessReference = 'tick' | 'ai';

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
  /**
   * Szczyt zmęczenia pary = `warWearinessByPairKey.get(key).peak` (stepPairState), tylko dla wojny bieżącej
   * (peakForCurrentWar). Używany w trybie 'tick' — runWarWearinessTick bierze szczyt do decyzji i loserDespair.
   * Tryb 'ai' ignoruje go (ai.ts liczy z bieżącego poziomu).
   */
  peak?: number;
  /** Domyślnie 'tick'. */
  reference?: WarWearinessReference;
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
  /** Id strony a i b (jak podane na wejściu) — do rozstrzygnięcia, która strona to która. */
  aId: string;
  bId: string;
  a: WarWearinessView;
  b: WarWearinessView;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Widok obu stron wojny pary. Czysta funkcja; parametry domyślnie z war-weariness-params.json. */
export function warWearinessPairView(
  inp: WarWearinessPairInput,
  P: WarWearinessParams = WAR_WEARINESS_PARAMS,
): WarWearinessPairView {
  const ref: WarWearinessReference = inp.reference ?? 'tick';
  const current = clamp01(warWearinessLevel(
    {
      turnsAtWar: inp.turnsAtWar,
      lostCitiesTotal: Math.max(0, inp.a.lostCities) + Math.max(0, inp.b.lostCities),
      turnsSinceCityChange: inp.turnsSinceCityChange,
    },
    P,
  ));
  // Tick AI↔AI: lvl = st.peak (szczyt, gdy podany). ai.ts (gracz↔AI): zawsze bieżący poziom.
  const level = ref === 'tick' && inp.peak !== undefined ? clamp01(inp.peak) : current;

  const sideA: MilitarySide = { id: inp.a.id, sila: inp.a.sila, armiaPkt: inp.a.armiaPkt };
  const sideB: MilitarySide = { id: inp.b.id, sila: inp.b.sila, armiaPkt: inp.b.armiaPkt };
  const cmp = compareMilitaryStrength(sideA, sideB);

  if (cmp.przewaga === 'brak') {
    return {
      level, aId: inp.a.id, bId: inp.b.id,
      a: { rola: 'rowny', zmeczenie: level }, b: { rola: 'rowny', zmeczenie: level },
    };
  }

  const aWins = cmp.przewaga === 'A';
  const loser = aWins ? inp.b : inp.a;
  const shareA = wearinessMilitaryShare(inp.a.sila, inp.b.sila);
  const loserShare = aWins ? 1 - shareA : shareA;
  let despair: number;
  if (ref === 'ai') {
    // ai.ts: wearyShare nieprzycięty; desperacja liczona tylko gdy isWarWeary(wearyLevel), inaczej 0.
    despair = isWarWeary(level, P)
      ? loserDespair({ level, share: loserShare, lostCities: loser.lostCities }, P)
      : 0;
  } else {
    // runWarWearinessTick: udział przycięty do „wyraźnie" (remis nie wypada z desperacji).
    const shareForDespair = Math.min(loserShare, P.przegrywajacy.udzialWyraznie);
    despair = loserDespair({ level, share: shareForDespair, lostCities: loser.lostCities }, P);
  }
  despair = clamp01(despair);

  const winnerView: WarWearinessView = { rola: 'wygrywa', zmeczenie: level };
  const loserView: WarWearinessView = { rola: 'przegrywa', desperacja: despair };
  return aWins
    ? { level, aId: inp.a.id, bId: inp.b.id, a: winnerView, b: loserView }
    : { level, aId: inp.a.id, bId: inp.b.id, a: loserView, b: winnerView };
}

/**
 * Szczyt pary z warWearinessByPairKey, TYLKO gdy stan dotyczy bieżącej wojny (warStart zgodny z tickiem).
 * Brak stanu albo stary stan → undefined (wtedy widok liczy z bieżącego poziomu).
 */
export function peakForCurrentWar(
  st: { warStart: number; peak: number } | undefined,
  warStart: number,
): number | undefined {
  return st !== undefined && st.warStart === warStart ? st.peak : undefined;
}

/**
 * Strona widoku o podanym id („own") i druga strona („rival"). Rozstrzyga po id, nie po kolejności a/b —
 * dzięki temu wartości rozmówcy nie mogą trafić na stronę gracza (i odwrotnie).
 */
export function warWearinessSideView(
  view: WarWearinessPairView,
  ownId: string,
): { own: WarWearinessView; rival: WarWearinessView } {
  if (view.aId === ownId) return { own: view.a, rival: view.b };
  if (view.bId === ownId) return { own: view.b, rival: view.a };
  throw new Error(`warWearinessSideView: brak strony o id ${ownId}`);
}
