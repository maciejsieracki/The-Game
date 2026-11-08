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
  /**
   * BUG-TOOLTIP-MOC-NIEPELNA (2026-08-08): pozostałe 4 składowe wzoru
   * kanonicznego fieldPower() (unit-power.ts) — bez nich tooltip liczył
   * "Moc pola" tylko z 4 z 8 pól (patrz komentarz przy unitCardCombatDisplay
   * niżej). WYMAGANE (nie opcjonalne) celowo: to jest siatka bezpieczeństwa
   * kompilatora — jeśli wywołujący (main.ts::unitCardCombatFor) pominie
   * jedno z tych pól w literale przekazywanym do unitCardCombatDisplay(),
   * `tsc --noEmit` ma się na tym wywalić, zamiast po cichu podstawiać 0
   * (tak jak zrobiła to mutacja Evaluatora przy N3, gdy pola były opcjonalne).
   */
  weaponDamage: number;
  piercing: number;
  chargeBonus: number;
  missileAttack: number;
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
  /**
   * BUG-TOOLTIP-MOC-BUDYNKI-Q1 = A (Maciej, decyzja po turnieju ABC, zweryfikowana
   * przez Sędziego w kodzie): weaponDamage/piercing skalowane WYŁĄCZNIE premią
   * weterana (veteranCombatBonusFrac), NIE pełnym softFrac (weteran+budynki) —
   * silnik walki (unit-building-bonuses.ts:512-527) faktycznie stosuje premię
   * budynkową do atk/obrona/pancerz/uderzenie/rangedAtk/health, ale NIE do
   * weaponDamage/piercing, więc tooltip pokazujący pełny softFrac na tych
   * dwóch polach kłamał o realnym wpływie budynków. chargeBonus/missileAttack
   * ZOSTAJĄ na pełnym softFrac — dla nich premia budynkowa faktycznie działa. */
  weaponDamageBase: number;
  weaponDamageEffective: number;
  piercingBase: number;
  piercingEffective: number;
  chargeBonusBase: number;
  chargeBonusEffective: number;
  missileAttackBase: number;
  missileAttackEffective: number;
}

function roundCardStat(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n * 10) / 10;
  return Math.abs(r - Math.round(r)) < 1e-6 ? Math.round(r) : r;
}

/**
 * Canonical effective maximum HP resolver.
 *
 * Building-path and veteran health bonuses are additive percentage points on
 * the base HP. They must be combined before the single multiplier is applied;
 * multiplying the already boosted value again would make the same bonus count
 * twice (for example 22 -> 26.4, not 22 -> 27.72).
 */
export function effectiveMaxHp(
  baseHp: number,
  parametryBonusFrac = 0,
  veteranBonusFrac = 0,
): number {
  return roundCardStat(applyMultiplier(
    baseHp,
    parametryBonusFrac + veteranBonusFrac,
  ));
}

/** Efektywne staty karty z baz JSON + pól progresu jednostki. */
export function unitCardCombatDisplay(
  bases: UnitCardCombatBases,
  unit: (UnitBuildingProgress & VeteranProgress) | null | undefined,
): UnitCardCombatDisplay {
  const veteranFrac = veteranCombatBonusFrac(unit);
  const softFrac = unitParametryBonusFrac(unit) + veteranFrac;
  const armorFrac = unitPancerzBonusFrac(unit);
  const weaponDamage = bases.weaponDamage ?? 0;
  const piercing = bases.piercing ?? 0;
  const chargeBonus = bases.chargeBonus ?? 0;
  const missileAttack = bases.missileAttack ?? 0;
  return {
    atakBase: bases.atak,
    atakEffective: roundCardStat(applyMultiplier(bases.atak, softFrac)),
    obronaBase: bases.obrona,
    obronaEffective: roundCardStat(applyMultiplier(bases.obrona, softFrac)),
    hpMaxBase: bases.hpMax,
    hpMaxEffective: effectiveMaxHp(bases.hpMax, unitParametryBonusFrac(unit), veteranFrac),
    pancerzBase: bases.pancerz,
    pancerzEffective: roundCardStat(applyMultiplier(bases.pancerz, armorFrac)),
    weaponDamageBase: weaponDamage,
    // BUG-TOOLTIP-MOC-BUDYNKI-Q1=A: WYŁĄCZNIE veteranFrac, NIE softFrac (patrz komentarz przy polu).
    weaponDamageEffective: roundCardStat(applyMultiplier(weaponDamage, veteranFrac)),
    piercingBase: piercing,
    piercingEffective: roundCardStat(applyMultiplier(piercing, veteranFrac)),
    chargeBonusBase: chargeBonus,
    chargeBonusEffective: roundCardStat(applyMultiplier(chargeBonus, softFrac)),
    missileAttackBase: missileAttack,
    missileAttackEffective: roundCardStat(applyMultiplier(missileAttack, softFrac)),
  };
}
