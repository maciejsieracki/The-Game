/**
 * unit-card-stats.ts — efektywne staty bojowe na karcie jednostki (C-UNIT-CARD-Q1–Q3).
 *
 * Źródło bonusów: RuntimeUnit.parametryBonusProc / pancerzBonusProc (budynki)
 * + veteranCombatBonusFrac (weteran). Ten sam układ co walka dla warstwy
 * jednostkowej (bez bonusów cywilizacji — te są osobną warstwą w combat.ts).
 */
import { applyMultiplier } from './civ-bonuses';
import {
  unitPancerzBonusFrac,
  unitParametryBonusFrac,
  type UnitBuildingProgress,
} from './unit-building-bonuses';
import { veteranCombatBonusFrac, type VeteranProgress } from './veteran';

export interface UnitCardCombatBases {
  atak: number;
  obrona: number;
  hpMax: number;
  pancerz: number;
}

export interface UnitCardCombatDisplay {
  atakBase: number;
  atakEffective: number;
  obronaBase: number;
  obronaEffective: number;
  hpMaxBase: number;
  hpMaxEffective: number;
  pancerzBase: number;
  pancerzEffective: number;
}

function roundCardStat(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n * 10) / 10;
  return Math.abs(r - Math.round(r)) < 1e-6 ? Math.round(r) : r;
}

/** Efektywne staty karty z baz JSON + pól progresu jednostki. */
export function unitCardCombatDisplay(
  bases: UnitCardCombatBases,
  unit: (UnitBuildingProgress & VeteranProgress) | null | undefined,
): UnitCardCombatDisplay {
  const softFrac = unitParametryBonusFrac(unit) + veteranCombatBonusFrac(unit);
  const armorFrac = unitPancerzBonusFrac(unit);
  return {
    atakBase: bases.atak,
    atakEffective: roundCardStat(applyMultiplier(bases.atak, softFrac)),
    obronaBase: bases.obrona,
    obronaEffective: roundCardStat(applyMultiplier(bases.obrona, softFrac)),
    hpMaxBase: bases.hpMax,
    hpMaxEffective: roundCardStat(applyMultiplier(bases.hpMax, softFrac)),
    pancerzBase: bases.pancerz,
    pancerzEffective: roundCardStat(applyMultiplier(bases.pancerz, armorFrac)),
  };
}
