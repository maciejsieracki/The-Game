/**
 * K04C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1, batch 4a): adaptery wejsc kart szczegolow.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `religiaSzPunkty` (:3050), `resolveEmpireSnap` (:1637),
 * `resolveCityHealth` (:3281), `__cityPanelOrderStateLocalForTest` (:3274), `formatWyzwienieLabel`
 * (`game/population-growth-v85.ts:170`, kopia 1:1 jak w `empireDetailPanel.ts:83`).
 *
 * Reguła P5.13: UI nie liczy reguł gry. Modul nie importuje logiki gry; wartosci przychodza z `CityPanelDto`.
 *
 * ZALOZENIA K04C (rozstrzygniete w P5-8-K04C.md, nie pytania):
 * - K04C-Z6: `resolveEmpireSnap` (pin :1637-1676, suma po miastach) -> `resolveEmpireSnapK(engineSnap, zloto)`:
 *   snapshot imperium zawsze z silnika (`getEmpireHud`); brak = tylko skarbiec. Lokalna suma miast USUNIETA.
 * - K04C-Z3: `religiaSzPunkty` (pin :3050, `proporcjonalneSzczescie` + skala epoki) -> `religiaSzPunktyK(raw)`:
 *   punkty surowe z silnika (`religion.wplywSzczescieSzPkt`), UI tylko zaokragla prezentacyjnie (`szPktDisplay`).
 * - K04C-Z7: `__cityPanelOrderStateLocalForTest` (pin :3274 -> `computeOrderStateLocal`) — lokalny stan porzadku
 *   USUNIETY (K03-Z3); hook testowy zwraca stan z DTO (`resolveOrderStateFromDto`). Rownowaznosc z pinem NIE
 *   jest mierzona (pin liczy lokalnie, v2 nie) — NIE_ZMIERZONO.
 */
import type { CityPanelDto, CityPanelK04CDto } from '../../viewmodel/types';
import { szPktDisplay, type EmpireHudSnap } from './k01a-fundament';
import { resolveOrderStateFromDto, type OrderStateK } from './k03-model';

/** Pin :3050-3059 `religiaSzPunkty` — punkty Szczescia wplywu religii do wyswietlenia (z silnika, K04C-Z3). */
export function religiaSzPunktyK(wplywSzczescieSzPkt: number): number {
  return szPktDisplay(wplywSzczescieSzPkt);
}

/** Pin :1637-1676 `resolveEmpireSnap` (K04C-Z6) — snapshot imperium z silnika; brak = same zloto (pin: `{ zloto: treasury }`). */
export function resolveEmpireSnapK(engineSnap: EmpireHudSnap | null | undefined, zloto: number | undefined): EmpireHudSnap {
  return engineSnap ?? { zloto };
}

/** Pin :3281-3293 `resolveCityHealth` — zdrowie miasta z DTO (silnik zawsze podaje `health`); `fromEngine` zawsze `true`. */
export function resolveCityHealthK(health: { total: number; lines: readonly { label: string; value: number }[] }): {
  total: number;
  lines: readonly { label: string; value: number }[];
  fromEngine: true;
} {
  return { total: health.total, lines: health.lines, fromEngine: true };
}

/** Pin :3274-3279 `__cityPanelOrderStateLocalForTest` (K04C-Z7) — po K03-Z3 zwraca stan porzadku z DTO (bez lokalnego przeliczenia). */
export function cityPanelOrderStateLocalForTestK(dto: CityPanelDto): { state: OrderStateK; fromEngine: true } {
  return { state: resolveOrderStateFromDto(dto), fromEngine: true };
}

/** Pin `population-growth-v85.ts:27-44` (WYZYWIENIE_MIN/MAX/STEP) — te same stale co `staticCatalog.constants`. */
export const WYZYWIENIE_SKALA = { min: 0, max: 6, step: 0.5 } as const;

/** Pin `population-growth-v85.ts:170-173` `formatWyzwienieLabel` (z `clampPoziomRacji` :135). Kopia 1:1. */
export function formatWyzwienieLabelK(level: number, skala: { min: number; max: number; step: number } = WYZYWIENIE_SKALA): string {
  const clamped = Math.min(skala.max, Math.max(skala.min, level));
  const v = Math.round(clamped / skala.step) * skala.step;
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
}

/** Typ wejscia K04C (uzyteczny dla adapterow `k04c-*`). */
export type CityPanelK04CInput = CityPanelK04CDto;
