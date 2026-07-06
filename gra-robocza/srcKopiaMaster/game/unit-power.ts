/**
 * unit-power.ts — moc jednostki (pole vs oblężenie), TW v3.
 *
 * Decyzja Maciej 2026-06-30 (2A):
 *   Pole:      A = AP + Obraż + Przeb + Szarża/k1 + AD/k2 ; O = OBR + Panc + HP/k3
 *              Oblężnicze (Rola=Oblężnicza) nie wchodzą do sumy armii na polu.
 *   Oblężenie: A = wallAttack + AD ; O = OBR + Panc + HP/k4
 *
 * Współczynniki: gra/data/combat-params.json → unit_power (Panel-C Stale-moc).
 */

import combatParams from '../../data/combat-params.json';

export interface UnitPowerCoeffs {
  chargeDivisor: number;
  missileDivisor: number;
  hpFieldDivisor: number;
  hpSiegeDivisor: number;
}

export interface UnitPowerInput {
  meleeAttack?: number;
  meleeDefence?: number;
  weaponDamage?: number;
  piercing?: number;
  armor?: number;
  chargeBonus?: number;
  health?: number;
  missileAttack?: number;
  wallAttack?: number;
  fieldPower?: number;
  siegePower?: number;
  'Rola (linia)'?: string;
}

export interface PowerBreakdown {
  attack: number;
  defense: number;
  total: number;
}

type ParamsFile = {
  unit_power?: {
    charge_divisor?: number;
    missile_divisor?: number;
    hp_field_divisor?: number;
    hp_siege_divisor?: number;
  };
};

const DEFAULT_COEFF: UnitPowerCoeffs = {
  chargeDivisor: 2,
  missileDivisor: 2,
  hpFieldDivisor: 2,
  hpSiegeDivisor: 10,
};

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '' || v === '—') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function loadUnitPowerCoeffs(
  raw: ParamsFile = combatParams as ParamsFile,
): UnitPowerCoeffs {
  const u = raw.unit_power ?? {};
  type UnitPowerKey = 'charge_divisor' | 'missile_divisor' | 'hp_field_divisor' | 'hp_siege_divisor';
  const pick = (k: UnitPowerKey, d: number) => {
    const v = u[k];
    return typeof v === 'number' && v > 0 ? v : d;
  };
  return {
    chargeDivisor: pick('charge_divisor', DEFAULT_COEFF.chargeDivisor),
    missileDivisor: pick('missile_divisor', DEFAULT_COEFF.missileDivisor),
    hpFieldDivisor: pick('hp_field_divisor', DEFAULT_COEFF.hpFieldDivisor),
    hpSiegeDivisor: pick('hp_siege_divisor', DEFAULT_COEFF.hpSiegeDivisor),
  };
}

export function isSiegeUnit(u: UnitPowerInput): boolean {
  return (u['Rola (linia)'] ?? '') === 'Oblężnicza';
}

/** Moc na polu — wszystkie jednostki bojowe (w tym oblężnicze, do rankingu). */
export function fieldPower(
  u: UnitPowerInput,
  coeff: UnitPowerCoeffs = loadUnitPowerCoeffs(),
): PowerBreakdown {
  const attack =
    num(u.meleeAttack) +
    num(u.weaponDamage) +
    num(u.piercing) +
    num(u.chargeBonus) / coeff.chargeDivisor +
    num(u.missileAttack) / coeff.missileDivisor;
  const defense =
    num(u.meleeDefence) +
    num(u.armor) +
    num(u.health) / coeff.hpFieldDivisor;
  return {
    attack: round1(attack),
    defense: round1(defense),
    total: round1(attack + defense),
  };
}

/** Moc przy oblężeniu umocnień — nie używać na polu (armia vs armia). */
export function siegePower(
  u: UnitPowerInput,
  coeff: UnitPowerCoeffs = loadUnitPowerCoeffs(),
): PowerBreakdown {
  const attack = num(u.wallAttack) + num(u.missileAttack);
  const defense =
    num(u.meleeDefence) +
    num(u.armor) +
    num(u.health) / coeff.hpSiegeDivisor;
  return {
    attack: round1(attack),
    defense: round1(defense),
    total: round1(attack + defense),
  };
}

/** M_pole do sumy armii — oblężnicze = 0 (decyzja 2A). */
export function armyFieldPower(
  u: UnitPowerInput,
  coeff?: UnitPowerCoeffs,
): number {
  if (isSiegeUnit(u)) return 0;
  if (typeof u.fieldPower === 'number' && Number.isFinite(u.fieldPower)) {
    return u.fieldPower;
  }
  return fieldPower(u, coeff).total;
}

/** Suma M armii na mapie (bez oblężniczych). */
export function sumArmyFieldPower(
  units: ReadonlyArray<UnitPowerInput & { count?: number }>,
  coeff?: UnitPowerCoeffs,
): number {
  let sum = 0;
  for (const u of units) {
    const n = Math.max(1, u.count ?? 1);
    sum += armyFieldPower(u, coeff) * n;
  }
  return round1(sum);
}
