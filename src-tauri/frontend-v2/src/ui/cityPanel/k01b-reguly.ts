/**
 * K01B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1): port reguł gry dla jednostek R.
 *
 * Reguła P5.13: UI nie liczy reguł. Jednostki, które w pinie importowały wartości logiki
 * (`etaTurns`, `buildingEffectAtLevel`, `stockResourceLabel`, `rationGrowthPercent`, …),
 * wołają wyłącznie ten port. Port wstrzykuje kontroler (zapytania do silnika Rust/TS),
 * a nie ten moduł. Brak wstrzyknięcia = błąd jawny (nie cicha wartość domyślna).
 */
import type {
  BuildingDefK,
  OrderBandK,
  PoziomRacjiK,
  RationParamsK,
} from './k01b-dto';

export interface CityPanelRulesPort {
  /** Pin: `etaTurns` (game/production.ts). */
  etaTurns(koszt: number, postep: number, praca: number): number | null;
  /** Pin: `buildingEffectAtLevel` (game/production.ts). */
  buildingEffectAtLevel(baza: number, przyrost: number, level: number): number;
  /** Pin: `stockResourceLabel` (game/building-stock-cost.ts). */
  stockResourceLabel(key: string): string;
  /** Pin: `buildingUpkeep` (game/buildings*.ts) — koszt zlota / tura. */
  buildingUpkeep(def: BuildingDefK, level: number): number;
  /** Pin: `buildingResourceUpkeep` (game/building-stock-cost.ts). */
  buildingResourceUpkeep(def: BuildingDefK): Record<string, number>;
  /** Pin: `addResourceCosts` — sumuje do `target` (mutacja jak w pinie). */
  addResourceCosts(target: Record<string, number>, add: Readonly<Record<string, number>>): void;
  /** Pin: `mnoznikRoleForBuildingId`. */
  mnoznikRoleForBuildingId(id: string): 'pancerz' | 'parametry' | null;
  /** Pin: `cumulativeMnoznikForBuildingId`. */
  cumulativeMnoznikForBuildingId(id: string, buildings: readonly BuildingDefK[]): number;
  /** Pin: `buildingStructuralDefenseBonusPercent`. */
  buildingStructuralDefenseBonusPercent(id: string): number | null;
  /** Pin: `buildRationParams` (population-growth-v85.ts). */
  buildRationParams(): RationParamsK;
  /** Pin: `rationGrowthPercent`. */
  rationGrowthPercent(level: PoziomRacjiK, params?: RationParamsK): number;
  /** Pin: `rationFoodCostPerPop`. */
  rationFoodCostPerPop(level: PoziomRacjiK, params?: RationParamsK): number;
  /** Pin: `growthGainPerTurnSlots`. */
  growthGainPerTurnSlots(population: number, growthPct: number, fed: boolean, atPopCap: boolean): number;
  /** Pin: `turnsUntilNextCitizen`. */
  turnsUntilNextCitizen(wzrostUlamkowy: number, gainPerTurn: number): number | null;
}

let portReguł: CityPanelRulesPort | null = null;

/** Wstrzykuje port reguł (wywołuje kontroler przy starcie panelu miasta). */
export function ustawRegulyKontrolera(port: CityPanelRulesPort): void {
  portReguł = port;
}

/** Zwraca port; rzuca, gdy kontroler nie wstrzyknął reguł (brak cichego fallbacku). */
export function reguly(): CityPanelRulesPort {
  if (portReguł === null) {
    throw new Error('k01b: port reguł nie został wstrzyknięty (ustawRegulyKontrolera)');
  }
  return portReguł;
}

/** Pasmo porządku jako wartość DTO (bez przeliczania w UI). */
export type { OrderBandK };
