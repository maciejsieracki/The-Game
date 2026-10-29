/**
 * K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 1): warstwa wejść dla jednostek K05 z DOM.
 *
 * Jednostki K05B (`k05b-podzial.ts`, `k05b-widgety.ts`) są kopiami linii pinu `edb8fb56` (bramka
 * `tools/dom-harness/verify-k05b-copies.mjs`). Wołają one nazwy, które w pinie są deklarowane w blokach K03/K04/K09
 * (`cfg`, `readPodzialHandlu`, `isMeCity`, `rerender`, `adjustHandelSplit`, `freshWealthState`, `daninaLabelGenitive`)
 * albo są adapterami o innej sygnaturze w już zaportowanych kawałkach (`appendIndywidualneToggle`,
 * `formatResourceUpkeepSummary`, `daninaLabelForCity`). Ten moduł daje te nazwy o SYGNATURACH PINU.
 *
 * Zasady (P5.13): nic tu nie liczy reguł gry. Wartości przychodzą przez `setK05bHost` (wiring z kontrolera,
 * NIE_ZMIERZONO w tym temacie); `adjustHandelSplit` i `readPodzialHandlu` są delegatorami do silnika.
 *
 * Zakotwiczenia pinu (przy stałych i adapterach): K05B-Z1 (delegatory), K05B-Z2 (stałe), K05B-Z5 (lokalny typ City),
 * K05B-Z7 (adaptery sygnatur).
 */
import type { CityMoneySnap, CityView } from './k01b-t';
import { daninaLabelForCity as daninaLabelForCityK01B } from './k01b-t';
import type { PodzialHandluSplit } from './k01a-fundament';
import type { GameData } from './k05a-fundament';
import { appendIndywidualneToggle as appendIndywidualneToggleK02 } from './k02-units';
import { formatResourceUpkeepSummary as formatResourceUpkeepSummaryK04 } from './k04-stock';

export type { CityView };

/** K05B-Z5: lokalna kopia typu `City` z pinu — tylko pola używane przez jednostki K05B batch 1. */
export interface City {
  readonly id: number;
  readonly ownerId: number;
  readonly wealthState?: { readonly poziom: number };
}

/** K05B-Z1: metody `cfg` pinu używane przez jednostki K05B batch 1; wartości z DTO/silnika (wiring poza zakresem). */
export interface K05bCfg {
  getTreasury?: (ownerId: number) => number | undefined;
  getCityMoneySnap?: (cityId: number) => CityMoneySnap | undefined;
  getPodzialHandluOverride?: (cityId: number) => boolean | undefined;
  onPodzialHandluChange?: (cityId: number, split: PodzialHandluSplit) => void;
  onPodzialHandluOverrideToggle?: (cityId: number) => void;
  onLeaveGarrison?: (unitId: string) => void;
  getUnlockedTechs?: (ownerId: number) => readonly string[] | undefined;
}

/** K05B-Z1: wejścia logiki o sygnaturach pinu; implementacja po stronie kontrolera/silnika. */
export interface K05bHost {
  readonly cfg: K05bCfg;
  readPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit;
  isMeCity(ownerId: number): boolean;
  adjustHandelSplit(split: PodzialHandluSplit, key: keyof PodzialHandluSplit, value: number): PodzialHandluSplit;
  freshWealthState(): { readonly poziom: number };
  stockResourceLabel(key: string): string;
  rerender(): void;
}

let host: K05bHost | null = null;

/** Wejście K05B (wiring z kontrolera poza zakresem K05B batch 1 — NIE_ZMIERZONO). */
export function setK05bHost(next: K05bHost): void {
  host = next;
}

function h(): K05bHost {
  if (host === null) throw new Error('K05B: brak wejść hosta (setK05bHost)');
  return host;
}

/** K05B-Z1: `cfg` pinu jako widok na `host.cfg` (odczyt przy każdym wywołaniu, jak `let cfg` w pinie). */
export const cfg: K05bCfg = new Proxy({} as K05bCfg, {
  get: (_t, k) => h().cfg[k as keyof K05bCfg],
});

/** K05B-Z1: pin `rerender` (blok K09, cięcie P5.8-Z1) — przez host. */
export function rerender(): void {
  h().rerender();
}

/** K05B-Z1: pin `readPodzialHandlu` (blok K03) — przez host. */
export function readPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit {
  return h().readPodzialHandlu(city, data);
}

/** K05B-Z1: pin `isMeCity` (blok K03) — przez host. */
export function isMeCity(ownerId: number): boolean {
  return h().isMeCity(ownerId);
}

/** K05B-Z1: pin `adjustHandelSplit` (game/cities) — reguła silnika, przez host. */
export function adjustHandelSplit(split: PodzialHandluSplit, key: keyof PodzialHandluSplit, value: number): PodzialHandluSplit {
  return h().adjustHandelSplit(split, key, value);
}

/** K05B-Z1: pin `freshWealthState` (game/wealth) — przez host. */
export function freshWealthState(): { readonly poziom: number } {
  return h().freshWealthState();
}

/**
 * K05B-Z2: pin `daninaLabelGenitive` (game/danina-nazwa.ts:11-13) — stała etykieta, zawsze `podatku`
 * (decyzja 2026-07-27); nie jest regułą gry, więc nie idzie przez host. Harness: pin-owa definicja z danina-nazwa.ts.
 */
export function daninaLabelGenitive(_label?: string): 'podatku' {
  return 'podatku';
}

/** K05B-Z7: adapter sygnatury pinu `daninaLabelForCity(city)`; etykieta stała (K01B: `daninaLabelForCity`). */
export function daninaLabelForCity(city: City): string {
  void city;
  return daninaLabelForCityK01B({});
}

/** K05B-Z7: adapter sygnatury pinu `formatResourceUpkeepSummary(resources)`; etykiety z hosta (`stockResourceLabel`). */
export function formatResourceUpkeepSummary(resources: Readonly<Record<string, number>>): string {
  const labels = new Proxy({} as Record<string, string>, {
    get: (_t, k) => (typeof k === 'string' ? h().stockResourceLabel(k) : undefined),
  });
  return formatResourceUpkeepSummaryK04(resources, labels);
}

/** K05B-Z7: adapter sygnatury pinu `appendIndywidualneToggle(mount, on, onToggle, rowCls)`; odświeżenie z hosta. */
export function appendIndywidualneToggle(
  mount: HTMLElement,
  overrideOn: boolean,
  onToggle: () => void,
  rowCls: string,
): void {
  appendIndywidualneToggleK02(mount, overrideOn, onToggle, rowCls, rerender);
}

/** K05B-Z2: stała pinu `game/cities.ts:578` (`export const HANDEL_PCT_STEP = 10;`), bramka verify-k05b-copies. */
export const HANDEL_PCT_STEP = 10;
/** K05B-Z2: stała pinu `game/cities.ts:581` (`export const MAX_PROCENT_NAUKA = 60;`), bramka verify-k05b-copies. */
export const MAX_PROCENT_NAUKA = 60;
