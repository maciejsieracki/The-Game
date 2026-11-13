/**
 * recruit-list-order.ts — kolejność listy jednostek do rekrutacji (UI).
 * R-WEB-RECRUIT-LIST-ORDER-BY-ERA-Q1 (zgłoszenie właściciela 2026-11-03).
 *
 * Reguła (jedyny komparator, współdzielony przez panel miasta i panel Armia —
 * oba renderują `cityPanel.recruitPanelPurchasableUnits`):
 *   1. EPOKA malejąco (najnowsza na górze); brak/nieznana epoka = najstarsza.
 *   2. W epoce SIŁA malejąco — `fieldPower(...).total` (unit-power.ts), ta sama miara co
 *      dotychczasowy `sortByUnitPowerDescending`.
 *   3. Remis: koszt złota malejąco (`Pieniądz (koszt)`), potem nazwa (pl), potem indeks źródłowy.
 * Jednostka bez definicji → na końcu listy (jak w sortByUnitPowerDescending).
 * Czysto prezentacyjne: nie filtruje, nie zmienia kosztów, statystyk ani dostępności.
 */

import { fieldPower, loadUnitPowerCoeffs, type UnitPowerCoeffs, type UnitPowerInput } from './unit-power';

/** Kolejność epok od najstarszej (jak EPOCH_ORDER w techTreeView.ts / scienceHubSnapshotLogic.ts). */
export const RECRUIT_ERA_ORDER: readonly string[] = ['Kamień', 'Brąz', 'Żelazo'];

/** Pola definicji jednostki istotne dla kolejności (units.json). */
export type RecruitOrderInput = UnitPowerInput & {
  Epoka?: unknown;
  Jednostka?: unknown;
  'Pieniądz (koszt)'?: unknown;
};

/** Ranga epoki: 0 = najstarsza (także brak/nieznana), wyżej = nowsza. */
export function recruitEraRank(epoka: unknown): number {
  const name = typeof epoka === 'string' ? epoka.trim() : '';
  const i = RECRUIT_ERA_ORDER.indexOf(name);
  return i >= 0 ? i : 0;
}

function goldCost(u: RecruitOrderInput): number {
  const n = Number(u['Pieniądz (koszt)']);
  return Number.isFinite(n) ? n : 0;
}

/** Komparator dwóch DEFINICJI jednostek (ujemny = a wyżej na liście). */
export function compareRecruitUnitDefs(
  a: RecruitOrderInput,
  b: RecruitOrderInput,
  coeff: UnitPowerCoeffs = loadUnitPowerCoeffs(),
): number {
  const era = recruitEraRank(b.Epoka) - recruitEraRank(a.Epoka);
  if (era !== 0) return era;
  const power = fieldPower(b, coeff).total - fieldPower(a, coeff).total;
  if (power !== 0) return power;
  const cost = goldCost(b) - goldCost(a);
  if (cost !== 0) return cost;
  return String(a.Jednostka ?? '').localeCompare(String(b.Jednostka ?? ''), 'pl');
}

/** Stabilna, niemutująca sortowanie listy rekrutacji wg reguły powyżej. */
export function sortRecruitListByEra<T>(
  items: readonly T[],
  getUnit: (item: T) => RecruitOrderInput | null | undefined,
  coeff: UnitPowerCoeffs = loadUnitPowerCoeffs(),
): T[] {
  return items
    .map((item, index) => ({ item, index, unit: getUnit(item) }))
    .sort((x, y) => {
      if (!x.unit && !y.unit) return x.index - y.index;
      if (!x.unit) return 1;
      if (!y.unit) return -1;
      return compareRecruitUnitDefs(x.unit, y.unit, coeff) || x.index - y.index;
    })
    .map(e => e.item);
}
