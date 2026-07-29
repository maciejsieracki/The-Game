/**
 * battle-loot.ts — łup po wygranej bitwie = koszt rekrutacji zniszczonych jednostek wroga.
 * Pure — bez DOM; wołane z main.ts (mapa auto+ręczna) i battleScene (podgląd łupu).
 */

import combatParams from '../../data/combat-params.json';
import unitsJson from '../../data/units.json';
import type { UnitDef } from '../data/loader';
import {
  stockResourceLabel,
  unitStockCost,
  type UnitStockCostSource,
} from './building-stock-cost';
import { itemCost, type ProductionData } from './production';

export interface BattleLootUnitRef {
  id: string | number;
  typeId: string;
}

export interface BattleLoot {
  gold: number;
  resources: Record<string, number>;
  killedCount: number;
}

const PRODUCTION_DATA: ProductionData = {
  buildings: [],
  units: unitsJson as UnitDef[],
};

/** % kosztu rekrutacji przechodzącego na zwycięzcę (combat-params.json). */
export function battleLootRecruitCostPct(): number {
  const row = (combatParams as { battle_loot?: { recruit_cost_pct?: number } }).battle_loot;
  const pct = row?.recruit_cost_pct;
  return typeof pct === 'number' && Number.isFinite(pct) && pct >= 0 ? pct : 100;
}

/** Jednostki wroga usunięte z mapy po bitwie (auto: martwe; ręczna: cały pokonany skład). */
export function collectRemovedEnemyTypeIds(
  enemyRoster: readonly BattleLootUnitRef[],
  unitsAfter: readonly { id: string | number }[],
): string[] {
  const live = new Set(unitsAfter.map(u => String(u.id)));
  const out: string[] = [];
  for (const u of enemyRoster) {
    if (!live.has(String(u.id))) out.push(u.typeId);
  }
  return out;
}

/** Suma łupu z listy typeId zniszczonych jednostek (bazowy koszt z units.json). */
export function computeBattleLoot(
  killedTypeIds: readonly string[],
  pct = battleLootRecruitCostPct(),
): BattleLoot {
  const mult = Math.max(0, pct) / 100;
  const resources: Record<string, number> = {};
  let gold = 0;

  for (const typeId of killedTypeIds) {
    if (!typeId) continue;
    const baseGold = itemCost('jednostka', typeId, PRODUCTION_DATA, 1);
    gold += Math.round(baseGold * mult);

    const def = PRODUCTION_DATA.units.find(u => u.Jednostka === typeId);
    const stock = unitStockCost(def as UnitStockCostSource | undefined);
    for (const [key, raw] of Object.entries(stock)) {
      const add = Math.round(raw * mult);
      if (add > 0) resources[key] = (resources[key] ?? 0) + add;
    }
  }

  return { gold, resources, killedCount: killedTypeIds.length };
}

export function battleLootIsEmpty(loot: BattleLoot): boolean {
  if (loot.gold > 0) return false;
  return !Object.values(loot.resources).some(v => v > 0);
}

/** Krótki opis do HUD / ekranu końca bitwy / podsumowania mapy. */
export function formatBattleLootNote(loot: BattleLoot): string {
  if (battleLootIsEmpty(loot)) return 'brak łupów';
  const parts: string[] = [];
  if (loot.gold > 0) parts.push('+' + loot.gold + ' Pieniądz');
  const keys = Object.keys(loot.resources).sort();
  for (const key of keys) {
    const amt = loot.resources[key] ?? 0;
    if (amt > 0) parts.push('+' + amt + ' ' + stockResourceLabel(key));
  }
  return parts.join(', ');
}
