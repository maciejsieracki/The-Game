/**
 * army-starvation.ts — głód wojska (B5-Q1 / PYTANIE-85):
 *   • isArmyHungry (empire-food) → osłabienie statów bojowych (applyArmyHungerStatMultToCombatUnit)
 *   • isArmyStarving (empire-food) → atrycja HP (applyArmyStarvationHpLoss)
 * Jednostki cywilne są pomijane przy atrycji HP.
 */
import { isCivilianUnit } from '../units/setup';
import type { CombatUnit } from './combat';

export interface StarvationUnit {
  id: string;
  ownerId: number;
  typeId: string;
  category: string;
  hp?: number;
  hpMax?: number;
}

export interface StarvationResult {
  /** id jednostek zniszczonych (hp <= 0 po ticku). */
  destroyedIds: string[];
  /** Liczba jednostek, którym zmniejszono HP. */
  damagedCount: number;
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

/**
 * Osłabia staty bojowe jednostki głodnej armii (mult < 1).
 * Skaluje te same pola co weteran (w górę), bez armor.
 * Prog dezercji — odwrotnie (wyższy = dezercja wcześniej): ×(2 − mult).
 */
export function applyArmyHungerStatMultToCombatUnit(cu: CombatUnit, mult: number): CombatUnit {
  if (mult >= 1 || mult <= 0) return cu;
  const progRaw = cu['Prog dezercji (% health)'];
  const progScaled = progRaw === null || progRaw === undefined
    ? progRaw
    : round4(progRaw * (2 - mult));
  return {
    ...cu,
    meleeAttack: cu.meleeAttack * mult,
    meleeDefence: cu.meleeDefence * mult,
    weaponDamage: cu.weaponDamage * mult,
    piercing: cu.piercing * mult,
    chargeBonus: cu.chargeBonus * mult,
    health: cu.health * mult,
    missileAttack: cu.missileAttack * mult,
    'Prog dezercji (% health)': progScaled,
  };
}

/**
 * Stosuje stratę HP na jednostkach właściciela. Inicjalizuje hp/hpMax z getMaxHp gdy brak.
 * @returns destroyedIds — SILNIK usuwa te jednostki z tablicy units.
 */
export function applyArmyStarvationHpLoss(
  units: StarvationUnit[],
  ownerId: number,
  hpFrac: number,
  getMaxHp: (typeId: string) => number,
): StarvationResult {
  const frac = Math.max(0, Math.min(1, hpFrac));
  if (frac <= 0) return { destroyedIds: [], damagedCount: 0 };

  const destroyedIds: string[] = [];
  let damagedCount = 0;

  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    if (isCivilianUnit(u)) continue;
    const maxHp = u.hpMax ?? getMaxHp(u.typeId);
    if (maxHp <= 0) continue;

    if (u.hpMax == null) u.hpMax = maxHp;
    if (u.hp == null) u.hp = maxHp;

    const loss = Math.max(1, Math.floor(maxHp * frac));
    u.hp = Math.max(0, u.hp - loss);
    damagedCount++;

    if (u.hp <= 0) destroyedIds.push(u.id);
  }

  return { destroyedIds, damagedCount };
}
