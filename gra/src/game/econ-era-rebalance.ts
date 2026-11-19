// R-WEB-ECONOMY-ERA-REBALANCE-FLAG-Q1 -- rebalans ekonomii wg epok ZA FLAGA.
// Flaga OFF (domyslnie) = zachowanie gry bit-w-bit jak dotad. Parametry: gra/data/econ-era-rebalance-params.json.
//
// Gdy flaga ON (decyzje wlasciciela 2026-11-19):
//  R1 przychody ulepszen terenu (zywnosc/praca/handel/pieniadz) i produkcja surowcow ulepszen
//     = wartosci bazowe epoki 1 we WSZYSTKICH epokach (bez wzrostu co epoke).
//  R2 zywnosc jednostek wojska = baza x skala^(epoka JEDNOSTKI - 1) (jednostkiZywnoscMnoznikNaEpoke = 4:
//     Kamien x1 / Braz x4 / Zelazo x16 przed R_STAWKI; po x4 R_STAWKI: 4/16/64). Decyzja wlasciciela 2026-11-19
//     (fala 875 x1/x2/x4 ANULOWANA; geometria przywrocona, wspolczynnik 3 -> 4 na epoke).
//     Pieniadz i surowce utrzymania jednostek NIE sa tu zmieniane (legacy scaleCostByEpoch x1/x2/x4, economy-upkeep.ts).
//  R3 mnoznik racji obywateli m(e) = mnoznik^(e - 1) (domyslnie x2/epoke: 1/2/4/8/16).
// Konwertery/budynki/cuda/utrzymanie Pracy/koszty rekrutacji NIE sa tu zmieniane.

import rebalanceParamsJson from '../../data/econ-era-rebalance-params.json';
import { epochCostMultiplier } from './building-stock-cost';

export interface EraRebalanceParams {
  eraRebalansAktywny: boolean;
  przychodyUlepszenStałeEpoka1: boolean;
  jednostkiZywnoscMnoznikNaEpoke: number;
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
 * R2: zywnosc jednostki (przed mnozeniem R_STAWKI) po rebalansie, albo null gdy flaga OFF
 * (wtedy wywolujacy zostaje przy legacy scaleCostByEpoch). `direct` = units.json „zywnosc/ture”.
 * Flaga ON: direct x jednostkiZywnoscMnoznikNaEpoke^(epoka JEDNOSTKI - 1), min 1 (dla direct > 0).
 * Zero i zle dane -> 0.
 */
export function rebalancedUnitFoodBase(
  direct: number,
  epoch: number | string | null | undefined,
): number | null {
  if (!isEraRebalanceEnabled()) return null;
  if (!Number.isFinite(direct) || direct <= 0) return 0;
  const skala = ERA_REBALANCE_PARAMS.jednostkiZywnoscMnoznikNaEpoke;
  const step = Number.isFinite(skala) && skala > 0 ? skala : 4;
  return Math.max(1, Math.round(direct * Math.pow(step, eraOrdinal(epoch) - 1)));
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
