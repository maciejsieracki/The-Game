// R-WEB-ECONOMY-ERA-REBALANCE-FLAG-Q1 -- rebalans ekonomii wg epok ZA FLAGA.
// Flaga OFF (domyslnie) = zachowanie gry bit-w-bit jak dotad. Parametry: gra/data/econ-era-rebalance-params.json.
//
// Gdy flaga ON (decyzje wlasciciela 2026-11-19):
//  R1 przychody ulepszen terenu (zywnosc/praca/handel/pieniadz) i produkcja surowcow ulepszen
//     = wartosci bazowe epoki 1 we WSZYSTKICH epokach (bez wzrostu co epoke).
//  R2 utrzymanie jednostek (Pieniadz, surowce, zywnosc/ture) = baza x mnoznik epoki JEDNOSTKI
//     (Kamien x1 / Braz x2 / Zelazo x4, jednostkiUtrzymanieMnoznikEpoki; decyzja 2026-11-19). Helper: unitUpkeepScaleByEpoch.
//  R3 mnoznik racji obywateli m(e) = mnoznik^(e - 1) (domyslnie x2/epoke: 1/2/4/8/16).
// Konwertery/budynki/cuda/utrzymanie Pracy/koszty rekrutacji NIE sa tu zmieniane.

import rebalanceParamsJson from '../../data/econ-era-rebalance-params.json';
import { epochCostMultiplier } from './building-stock-cost';

export interface EraRebalanceParams {
  eraRebalansAktywny: boolean;
  przychodyUlepszenStałeEpoka1: boolean;
  jednostkiUtrzymanieMnoznikEpoki: { kamien: number; braz: number; zelazo: number };
  racjeObywateliMnoznikNaEpoke: number;
}

export const ERA_REBALANCE_PARAMS: EraRebalanceParams = rebalanceParamsJson as EraRebalanceParams;

/** Flaga domyslna: OFF. Nie wlaczac bez decyzji wlasciciela po pomiarze (ABC). */
export const ERA_REBALANCE_ENABLED_DEFAULT = false;

let flagOverride: boolean | null = null;

/** Tylko testy/diagnostyka (hak civTest, NIE z UI). null = wartosc z danych. */
export function setEraRebalanceEnabledForTest(value: boolean | null): void {
  flagOverride = value;
}

export function isEraRebalanceEnabled(): boolean {
  if (flagOverride !== null) return flagOverride;
  return (ERA_REBALANCE_PARAMS.eraRebalansAktywny ?? ERA_REBALANCE_ENABLED_DEFAULT) === true;
}

/**
 * R-WEB-ECONOMY-IMPROVEMENT-GROWTH-WITH-ERA-NEWGAME-TOGGLE-Q1 (decyzja wlasciciela 2026-11-19):
 * ustawienie nowej gry „Wzrost surowców z epoką". WYŁ. (domyślnie) = wartości z Kamienia w każdej
 * epoce (stałe, jak dziś przy rebalansie ON); WŁ. = dawny wzrost ulepszeń z epoką (jak przy flagach
 * rebalansu OFF dla ulepszeń). Dotyczy plonów pola ulepszenia i produkcji surowców ulepszeń.
 * Stan aktywny ustawiany przy starcie/wczytaniu gry (main.ts); domyślnie false (WYŁ.).
 */
let wzrostSurowcowZEpokaActive = false;

/** Normalizacja pola z kreatora/zapisu: brak, null, zła wartość = false (WYŁ., stare zapisy). */
export function normalizeWzrostSurowcowZEpoka(raw: unknown): boolean {
  return raw === true;
}

export function setWzrostSurowcowZEpoka(value: boolean | undefined): void {
  wzrostSurowcowZEpokaActive = normalizeWzrostSurowcowZEpoka(value);
}

export function getWzrostSurowcowZEpoka(): boolean {
  return wzrostSurowcowZEpokaActive;
}

/**
 * R1: czy przychody ulepszen sa stale na poziomie epoki 1 (flaga ON + parametr + ustawienie WYŁ.).
 * Ustawienie WŁ. wylacza stałość ulepszeń (dawny wzrost z epoką); flaga rebalansu OFF = bez zmian.
 */
export function isEraRebalanceImprovementFlat(): boolean {
  return isEraRebalanceEnabled()
    && ERA_REBALANCE_PARAMS.przychodyUlepszenStałeEpoka1 === true
    && !wzrostSurowcowZEpokaActive;
}

/** Porzadkowy numer epoki (1..) dla danych units.json: liczba, tekst-liczba lub nazwa epoki. */
export function eraOrdinal(epoch: number | string | null | undefined): number {
  if (typeof epoch === 'number' && Number.isFinite(epoch)) return Math.max(1, Math.floor(epoch));
  if (typeof epoch === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(epoch)) return Math.max(1, Math.floor(Number(epoch)));
  const m = epochCostMultiplier(epoch);
  return m >= 4 ? 3 : m >= 2 ? 2 : 1;
}

/**
 * R2 (jedno miejsce): utrzymanie jednostki (Pieniadz, surowce, zywnosc/ture) skalowane epoka JEDNOSTKI
 * (units.json Epoka). Flaga ON -> mnoznik z jednostkiUtrzymanieMnoznikEpoki (domyslnie x1/x2/x4).
 * Flaga OFF -> legacy epochCostMultiplier (ten sam wynik przy domyslnych danych).
 * Zero i zle dane -> 0 (jak scaleCostByEpoch).
 */
export function unitUpkeepScaleByEpoch(
  value: number,
  epoch: number | string | null | undefined,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  let mult = epochCostMultiplier(epoch);
  if (isEraRebalanceEnabled()) {
    const m = ERA_REBALANCE_PARAMS.jednostkiUtrzymanieMnoznikEpoki;
    const ord = eraOrdinal(epoch);
    const fromData = ord >= 3 ? m?.zelazo : ord === 2 ? m?.braz : m?.kamien;
    if (typeof fromData === 'number' && Number.isFinite(fromData) && fromData > 0) mult = fromData;
  }
  return Math.max(1, Math.round(value * mult));
}

/**
 * R2: zywnosc jednostki (przed mnozeniem R_STAWKI) po rebalansie, albo null gdy flaga OFF
 * (wtedy wywolujacy zostaje przy wartosci z tabeli). `direct` = units.json „zywnosc/ture”.
 * Flaga ON: ta sama skala epoki jednostki co pieniadz i surowce (x1/x2/x4).
 */
export function rebalancedUnitFoodBase(
  direct: number,
  epoch: number | string | null | undefined,
): number | null {
  if (!isEraRebalanceEnabled()) return null;
  if (!Number.isFinite(direct) || direct <= 0) return 0;
  return unitUpkeepScaleByEpoch(direct, epoch);
}

/**
 * R3: mnoznik racji obywateli m(e) po rebalansie, albo null gdy flaga OFF.
 * era < 1 / NaN -> 1 (jak dotad).
 */
export function rebalancedCitizenConsumptionMult(era: number | null | undefined): number | null {
  if (!isEraRebalanceEnabled()) return null;
  if (typeof era !== 'number' || !Number.isFinite(era) || era < 1) return 1;
  const step = ERA_REBALANCE_PARAMS.racjeObywateliMnoznikNaEpoke;
  const mult = Number.isFinite(step) && step > 0 ? step : 2;
  return Math.pow(mult, Math.floor(era) - 1);
}
