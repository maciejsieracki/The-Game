/**
 * ai-upkeep-gate.ts — R-WEB-AI-ARMY-UPKEEP-Q1: bramka rekrutacji AI świadoma ZAPASU
 * utrzymania (Skarbiec złota + Spichlerz żywności), za flagą AI_UPKEEP_AWARE_RECRUITMENT_ENABLED.
 *
 * Zasada właściciela (2026-10-25): NIE chodzi o bilans przychód − koszt, tylko o zapas.
 * Cywilizacja MOŻE korzystać ze swoich zapasów (utrzymywać armię na deficycie bieżącego
 * przychodu), pod warunkiem że zapas wystarcza na pokrycie utrzymania: nowa jednostka
 * dopuszczona, gdy zapas złota i zapas żywności (po zakupie, po utrzymaniu istniejącej armii
 * + nowej jednostki, z przychodem netto ze znakiem i marginesem) wystarczają na co najmniej
 * `runwayTurns` tur BEZ zejścia zapasu do zera.
 *
 * Funkcje czyste (bez stanu gry). Wiring: main.ts (blok rekrutacji AI), tylko AI.
 * Flaga OFF = zachowanie bazowe (bramka nie wywoływana; hash jak baza).
 */
import upkeepParamsRaw from '../../data/ai-upkeep-params.json';

/** GŁÓWNA FLAGA. Domyślnie OFF — włączenie dopiero po pomiarze przed/po (R-WEB-AI-ARMY-UPKEEP-Q1). */
export const AI_UPKEEP_AWARE_RECRUITMENT_ENABLED = false;

let overrideValue: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF niezależnie od stałej; null = wróć do stałej. */
export function setAiUpkeepAwareRecruitmentOverride(value: boolean | null): void {
  overrideValue = value;
}

export function isAiUpkeepAwareRecruitmentEnabled(): boolean {
  return overrideValue !== null ? overrideValue : AI_UPKEEP_AWARE_RECRUITMENT_ENABLED;
}

export interface AiUpkeepParams {
  /** Horyzont zapasu w turach (złoto). */
  runwayTurnsGold: number;
  /** Horyzont zapasu w turach (żywność). */
  runwayTurnsFood: number;
  /** Narzut bezpieczeństwa na utrzymanie nowej jednostki (ułamek). */
  marginFrac: number;
  /** Minimalna rezerwa złota po zakupie w turach łącznego utrzymania złotem (0 = wyłączona). */
  minReserveTurns: number;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Parametry z data/ai-upkeep-params.json z bezpiecznymi wartościami domyślnymi. */
export function loadAiUpkeepParams(raw: Record<string, unknown> = upkeepParamsRaw as Record<string, unknown>): AiUpkeepParams {
  return {
    runwayTurnsGold: Math.max(0, num(raw.runwayTurnsGold, 15)),
    runwayTurnsFood: Math.max(0, num(raw.runwayTurnsFood, 15)),
    marginFrac: Math.max(0, num(raw.marginFrac, 0.1)),
    minReserveTurns: Math.max(0, num(raw.minReserveTurns, 1)),
  };
}

/** Parametry bramki załadowane raz (JSON jest stały w buildzie). */
export const AI_UPKEEP_PARAMS: AiUpkeepParams = loadAiUpkeepParams();

export interface AiUpkeepGateInput {
  /** Skarbiec złota AI (zapas, może być ujemny przy deficycie). */
  treasury: number;
  /** Saldo złota ostatniej tury PRZED rekrutacją (przychód − utrzymanie budynków − utrzymanie jednostek), ze znakiem. */
  goldNetPerTurn: number;
  /** Jednorazowy koszt złota zakupu nowej jednostki (goldCost). */
  goldUnitCost: number;
  /** Utrzymanie złota nowej jednostki na turę (0 gdy brak). */
  newUnitGoldUpkeep: number;
  /** Zapas żywności państwa (Spichlerz), >= 0. */
  foodReserve: number;
  /** Przyrost zapasu żywności ostatniej tury PRZED rekrutacją (produkcja − wyżywienie − armia), ze znakiem. */
  foodNetPerTurn: number;
  /** Utrzymanie żywności nowej jednostki na turę (0 gdy brak). */
  newUnitFoodUpkeep: number;
}

export type AiUpkeepGateReason =
  | 'ok'
  | 'gold-stock-short'
  | 'gold-reserve'
  | 'gold-runway'
  | 'food-runway';

export interface AiUpkeepGateDecision {
  allowed: boolean;
  reason: AiUpkeepGateReason;
  /** Tury, na jakie wystarczy zapas złota po zakupie (Infinity gdy bilans >= 0). */
  goldRunway: number;
  /** Tury, na jakie wystarczy zapas żywności (Infinity gdy bilans >= 0). */
  foodRunway: number;
}

/**
 * Tury, na jakie wystarcza zapas przy danym (po-zakupowym) przepływie netto.
 * Bilans >= 0 → Infinity (zapas nie maleje). Zapas <= 0 przy deficycie → 0.
 */
export function runwayTurns(stock: number, netPerTurn: number): number {
  if (!Number.isFinite(netPerTurn) || netPerTurn >= 0) return Infinity;
  if (!Number.isFinite(stock) || stock <= 0) return 0;
  return stock / -netPerTurn;
}

/**
 * CZYSTA decyzja bramki: czy AI może zrekrutować jednostkę przy danym ZAPASIE.
 * Kolejność: (1) skarbiec po zakupie nie może być ujemny; (2) rezerwa złota po zakupie
 * (minReserveTurns × łączne utrzymanie złotem); (3) runway złota >= runwayTurnsGold;
 * (4) runway żywności >= runwayTurnsFood. Ujemny bilans bieżący sam w sobie NIE blokuje.
 */
export function decideAiUpkeepRecruitment(
  inp: AiUpkeepGateInput,
  p: AiUpkeepParams,
): AiUpkeepGateDecision {
  const goldUpkeepNew = Math.max(0, inp.newUnitGoldUpkeep) * (1 + p.marginFrac);
  const foodUpkeepNew = Math.max(0, inp.newUnitFoodUpkeep) * (1 + p.marginFrac);
  const stockAfter = inp.treasury - Math.max(0, inp.goldUnitCost);
  const goldNetAfter = inp.goldNetPerTurn - goldUpkeepNew;
  const foodNetAfter = inp.foodNetPerTurn - foodUpkeepNew;
  const goldRunway = runwayTurns(stockAfter, goldNetAfter);
  const foodRunway = runwayTurns(inp.foodReserve, foodNetAfter);

  if (stockAfter < 0) {
    return { allowed: false, reason: 'gold-stock-short', goldRunway, foodRunway };
  }
  const deficitPerTurn = Math.max(0, -goldNetAfter);
  if (p.minReserveTurns > 0 && deficitPerTurn > 0 && stockAfter < p.minReserveTurns * deficitPerTurn) {
    return { allowed: false, reason: 'gold-reserve', goldRunway, foodRunway };
  }
  if (goldRunway < p.runwayTurnsGold) {
    return { allowed: false, reason: 'gold-runway', goldRunway, foodRunway };
  }
  if (foodRunway < p.runwayTurnsFood) {
    return { allowed: false, reason: 'food-runway', goldRunway, foodRunway };
  }
  return { allowed: true, reason: 'ok', goldRunway, foodRunway };
}
