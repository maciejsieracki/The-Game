// R-WEB-ECONOMY-ERA-REBALANCE-FLAG-Q1 -- rebalans ekonomii wg epok ZA FLAGA.
// Flaga OFF (domyslnie) = zachowanie gry bit-w-bit jak dotad. Parametry: gra/data/econ-era-rebalance-params.json.
//
// Gdy flaga ON (decyzje wlasciciela 2026-11-19):
//  R1 przychody ulepszen terenu (zywnosc/praca/handel/pieniadz) i produkcja surowcow ulepszen
//     = wartosci bazowe epoki 1 we WSZYSTKICH epokach (bez wzrostu co epoke).
//  R2 zywnosc jednostek wojska = baza x skala^(epoka_jednostki - 1) (domyslnie x3/epoke: 4/12/36 po x4 R_STAWKI).
//  R3 mnoznik racji obywateli m(e) = mnoznik^(e - 1) (domyslnie x2/epoke: 1/2/4/8/16).
// Konwertery/budynki/cuda/utrzymanie Pracy/koszty rekrutacji NIE sa tu zmieniane.

import rebalanceParamsJson from '../../data/econ-era-rebalance-params.json';
import { epochCostMultiplier } from './building-stock-cost';

export interface EraRebalanceParams {
  eraRebalansAktywny: boolean;
  przychodyUlepszenStałeEpoka1: boolean;
  zywnoscWojskaSkalaNaEpoke: number;
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

/** R1: czy przychody ulepszen sa stale na poziomie epoki 1 (flaga ON + parametr). */
export function isEraRebalanceImprovementFlat(): boolean {
  return isEraRebalanceEnabled() && ERA_REBALANCE_PARAMS.przychodyUlepszenStałeEpoka1 === true;
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
 * (wtedy wywolujacy zostaje przy wartosci z tabeli). `direct` = units.json „zywnosc/ture”.
 */
export function rebalancedUnitFoodBase(
  direct: number,
  epoch: number | string | null | undefined,
): number | null {
  if (!isEraRebalanceEnabled()) return null;
  if (!Number.isFinite(direct) || direct <= 0) return 0;
  const skala = ERA_REBALANCE_PARAMS.zywnoscWojskaSkalaNaEpoke;
  const step = Number.isFinite(skala) && skala > 0 ? skala : 3;
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
