/**
 * R-WEB-ARMY-CONSOLIDATION-Q1 (runda 2) -- scalanie armii AI w stolicy w pokoju
 * oraz podzial na tyle armii, ile wojen (funkcja gotowa; wiring wojenny w rundzie 3).
 *
 * Modul jest CZYSTY: zero RNG, zero dostepu do stanu gry. Ruch (firstStep) i
 * rozkazy wykonuje wolajacy (ai.ts). Flaga `enabled` z
 * `gra/data/army-consolidation-params.json`; OFF = wolajacy nie wola modulu
 * (stan bit-identyczny jak w bazie).
 *
 * ZALOZENIA (runda 2): garnizony miast nie sa ruszane (inGarnizon wyklucza z kwalifikacji);
 * "stolica" = `capitalCityId` z main.ts (capitalCityIdForOwner); bez stolicy ->
 * najludniejsze wlasne miasto (fallbackToLargestCity).
 */

import armyConsolidationParamsRaw from '../../data/army-consolidation-params.json';
import { isEligibleForArmyConcentration } from './army-concentration';

export const ARMY_CONSOLIDATION_PARAMS = {
  enabled: armyConsolidationParamsRaw.enabled as boolean,
  minArmyUnits: armyConsolidationParamsRaw.minArmyUnits.wartosc as number,
  fallbackToLargestCity: armyConsolidationParamsRaw.fallbackToLargestCity.wartosc as boolean,
};

let overrideValue: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF niezaleznie od JSON; null = wroc do JSON. */
export function setArmyConsolidationOverride(value: boolean | null): void {
  overrideValue = value;
}

export function isArmyConsolidationEnabled(): boolean {
  return overrideValue !== null ? overrideValue : ARMY_CONSOLIDATION_PARAMS.enabled;
}

export interface ConsolidationHubCity {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  population: number;
}

export interface ConsolidationHub {
  cityId: string;
  q: number;
  r: number;
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Punkt zbiorki w pokoju: stolica wlasciciela (jesli istnieje posrod jego miast),
 * w przeciwnym razie (fallbackToLargestCity) najludniejsze wlasne miasto, przy remisie
 * najnizsze id. Zwraca null, gdy wlasciciel nie ma miasta.
 */
export function pickConsolidationHub(
  ownerId: number,
  cities: readonly ConsolidationHubCity[],
  capitalCityId: string | null | undefined,
  fallbackToLargestCity: boolean = ARMY_CONSOLIDATION_PARAMS.fallbackToLargestCity,
): ConsolidationHub | null {
  const own = cities.filter(c => c.ownerId === ownerId);
  if (own.length === 0) return null;
  const capital = capitalCityId ? own.find(c => c.id === capitalCityId) : undefined;
  if (capital !== undefined) return { cityId: capital.id, q: capital.q, r: capital.r };
  if (!fallbackToLargestCity) return null;
  const largest = [...own].sort((a, b) => b.population - a.population || compareIds(a.id, b.id))[0];
  if (largest === undefined) return null;
  return { cityId: largest.id, q: largest.q, r: largest.r };
}

export interface ConsolidationUnit {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  ruchLeft: number;
  inGarnizon?: boolean;
  oblegaCityId?: string;
  embarked?: boolean;
  seaRaider?: boolean;
  category?: string;
}

export interface CapitalConsolidationPlan {
  hub: ConsolidationHub;
  /** Kwalifikujace sie jednostki poza punktem zbiorki -- wolajacy wydaje im krok w strone hubu. */
  moveUnitIds: readonly string[];
  /** Kwalifikujace sie jednostki juz stojace na hubie -- zostaja tam (scalone w armie). */
  gatheredUnitIds: readonly string[];
}

export interface CapitalConsolidationOptions {
  /** Jednostki wylaczone (obroncy domu, zaangazowane w walke, zwiadowcy, ...). */
  excludedUnitIds?: ReadonlySet<string>;
  minArmyUnits?: number;
}

/**
 * Plan zbiorki w stolicy dla jednej cywilizacji w pokoju. Kwalifikacja = ta sama brama
 * co scalanie polowe (`isEligibleForArmyConcentration`) minus wykluczenia. Zwraca null,
 * gdy kwalifikujacych sie jednostek jest mniej niz `minArmyUnits` (wtedy wolajacy zostaje
 * przy bazowym zachowaniu).
 */
export function planCapitalConsolidation(
  ownerId: number,
  units: readonly ConsolidationUnit[],
  hub: ConsolidationHub,
  options: CapitalConsolidationOptions = {},
): CapitalConsolidationPlan | null {
  const minUnits = options.minArmyUnits ?? ARMY_CONSOLIDATION_PARAMS.minArmyUnits;
  const eligible = units
    .filter(u => !options.excludedUnitIds?.has(u.id))
    .filter(u => isEligibleForArmyConcentration(u as Parameters<typeof isEligibleForArmyConcentration>[0], ownerId))
    .sort((a, b) => compareIds(a.id, b.id));
  if (eligible.length < minUnits) return null;
  const moveUnitIds: string[] = [];
  const gatheredUnitIds: string[] = [];
  for (const u of eligible) {
    if (u.q === hub.q && u.r === hub.r) gatheredUnitIds.push(u.id);
    else moveUnitIds.push(u.id);
  }
  return { hub, moveUnitIds, gatheredUnitIds };
}

export interface WarPartitionUnit {
  id: string;
  q: number;
  r: number;
  /** Sila jednostki (np. moc bojowa). Dodatnia; brak = 1. */
  power?: number;
}

/**
 * Dzieli wojska polowe na k = max(1, min(warCount, liczba jednostek)) armii o zrownowazonej
 * sile (zachlannie: kolejna jednostka trafia do armii o najmniejszej sumie sily, remis ->
 * nizszy indeks). Deterministyczne: sortowanie (sila malejaco, q, r, id). Kazda armia
 * posortowana po id. Brak jednostek -> []. Uzywane przez wiring wojenny (runda 3).
 */
export function partitionArmiesForWars(
  units: readonly WarPartitionUnit[],
  warCount: number,
): string[][] {
  if (units.length === 0) return [];
  const k = Math.max(1, Math.min(Math.floor(warCount), units.length));
  const sorted = [...units].sort((a, b) =>
    (b.power ?? 1) - (a.power ?? 1) || a.q - b.q || a.r - b.r || compareIds(a.id, b.id));
  const groups: { ids: string[]; power: number }[] = Array.from({ length: k }, () => ({ ids: [], power: 0 }));
  for (const u of sorted) {
    let target = groups[0]!;
    for (const g of groups) if (g.power < target.power) target = g;
    target.ids.push(u.id);
    target.power += u.power ?? 1;
  }
  return groups.map(g => [...g.ids].sort(compareIds));
}
