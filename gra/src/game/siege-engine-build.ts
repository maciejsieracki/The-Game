import params from '../../data/siege-engine-params.json';
import { unitStockCost } from './building-stock-cost';
import type { UnitDef } from '../data/loader';
import type { RuntimeUnit } from '../units/setup';

export const SIEGE_ENGINE_UNITS_PER_MACHINE = params.unitsPerSiegeEngine;

export type SiegeEngineBuildBlock =
  | 'not_siege'
  | 'not_at_war'
  | 'not_besieger'
  | 'no_qualifying_army'
  | 'too_few_units'
  | 'turn_limit_reached'
  | 'technology_locked'
  | 'insufficient_money'
  | 'insufficient_resources';

export interface SiegeEngineTurnState {
  turn: number;
  count: number;
}

export interface SiegeEngineBuildContext {
  activeSiege: boolean;
  atWar: boolean;
  ownerId: number;
  turn: number;
  army: readonly RuntimeUnit[];
  turnState?: SiegeEngineTurnState;
  unlockedTechs: ReadonlySet<string>;
  treasury: number;
  stock: Readonly<Record<string, number>>;
}

export interface SiegeEngineBuildOption {
  unit: UnitDef;
  costMoney: number;
  costStock: Record<string, number>;
  allowed: boolean;
  reason?: SiegeEngineBuildBlock;
  quota: number;
  builtThisTurn: number;
  qualifyingArmyCount: number;
}

export function isSiegeEngineDef(unit: Pick<UnitDef, 'Typ'> | undefined): boolean {
  return unit?.Typ?.trim() === 'Siege';
}

export function qualifyingSiegeArmyCount(army: readonly RuntimeUnit[]): number {
  return army.filter(unit => unit.category !== 'obleznicza').length;
}

export function siegeEngineQuota(army: readonly RuntimeUnit[]): number {
  return Math.floor(qualifyingSiegeArmyCount(army) / SIEGE_ENGINE_UNITS_PER_MACHINE);
}

export function siegeEngineBuildOption(
  unit: UnitDef,
  context: SiegeEngineBuildContext,
  costMoney: number,
): SiegeEngineBuildOption {
  const count = qualifyingSiegeArmyCount(context.army);
  const quota = Math.floor(count / SIEGE_ENGINE_UNITS_PER_MACHINE);
  const builtThisTurn = context.turnState?.turn === context.turn
    ? Math.max(0, Math.floor(context.turnState.count))
    : 0;
  const costStock = unitStockCost(unit);
  let reason: SiegeEngineBuildBlock | undefined;
  if (!isSiegeEngineDef(unit)) reason = 'technology_locked';
  else if (!context.activeSiege) reason = 'not_siege';
  else if (!context.atWar) reason = 'not_at_war';
  else if (!context.army.some(u => u.ownerId === context.ownerId)) reason = 'no_qualifying_army';
  else if (count === 0) reason = 'no_qualifying_army';
  else if (count < SIEGE_ENGINE_UNITS_PER_MACHINE) reason = 'too_few_units';
  else if (builtThisTurn >= quota) reason = 'turn_limit_reached';
  else if (unit.Tech?.trim() && unit.Tech !== '-' && unit.Tech !== '—'
    && !context.unlockedTechs.has(unit.Tech.trim())) reason = 'technology_locked';
  else if (context.treasury < costMoney) reason = 'insufficient_money';
  else if (Object.entries(costStock).some(([key, amount]) => (context.stock[key] ?? 0) < amount)) {
    reason = 'insufficient_resources';
  }
  return {
    unit,
    costMoney,
    costStock,
    allowed: reason === undefined,
    reason,
    quota,
    builtThisTurn,
    qualifyingArmyCount: count,
  };
}

export function siegeEngineBuildReasonPl(reason?: SiegeEngineBuildBlock): string | undefined {
  switch (reason) {
    case 'not_siege': return 'Można budować wyłącznie podczas oblężenia.';
    case 'not_at_war': return 'Oblężenie wymaga stanu wojny.';
    case 'not_besieger': return 'Machinę może zbudować oblegająca armia.';
    case 'no_qualifying_army': return 'Brak jednostek oblegającej armii.';
    case 'too_few_units': return 'Potrzeba co najmniej 10 jednostek armii bez machin.';
    case 'turn_limit_reached': return 'Limit machin na tę turę został wykorzystany.';
    case 'technology_locked': return 'Brak wymaganej technologii.';
    case 'insufficient_money': return 'Za mało pieniędzy.';
    case 'insufficient_resources': return 'Brak surowca w magazynie państwa.';
    default: return undefined;
  }
}
