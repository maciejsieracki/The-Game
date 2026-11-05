/**
 * stack-leader.ts — tożsamość stosu/armii (R-WEB-ARMY-SCOUT-NOT-LEADER-Q1).
 * PURE: bez DOM, bez THREE.
 *
 * Zasada: armia zachowuje się jak jej NAJSILNIEJSZA jednostka bojowa. Jednostki
 * niebojowe (zwiadowca/osadnik/robotnik) nigdy nie są liderem stosu, dopóki w stosie
 * jest choć jedna jednostka bojowa; zwiadowca w armii jedynie poszerza widoczność
 * (każda jednostka liczy własny zasięg widzenia, więc zasięg armii = max).
 */

import type { RuntimeUnit } from '../units/setup';
import { CIVILIAN_TYPE_IDS, isCivilianUnit } from '../units/setup';

/** Jednostka niebojowa (zwiadowca/osadnik/robotnik) — nigdy nie reprezentuje armii z bojowymi. */
export function isNonCombatStackMember(u: Pick<RuntimeUnit, 'category' | 'typeId'>): boolean {
  return isCivilianUnit(u);
}

/** Wariant po samej nazwie typu (karty UI niosą tylko `name` = typeId). */
export function isNonCombatTypeName(typeName: string): boolean {
  return CIVILIAN_TYPE_IDS.has(typeName);
}

/**
 * Lider stosu: najsilniejsza jednostka BOJOWA wg `strengthOf` (malejąco), remis → mniejsze id.
 * Stos złożony wyłącznie z niebojowych → reguła na całym stosie (dotychczasowe zachowanie).
 */
export function pickStackLeader<T extends Pick<RuntimeUnit, 'id' | 'category' | 'typeId'>>(
  stack: readonly T[],
  strengthOf: (u: T) => number,
): T {
  if (stack.length === 0) throw new Error('pickStackLeader: pusty stos');
  const combat = stack.filter(u => !isNonCombatStackMember(u));
  const pool = combat.length > 0 ? combat : stack;
  return pool.reduce((best, u) => {
    const a = strengthOf(u);
    const b = strengthOf(best);
    if (a !== b) return a > b ? u : best;
    return u.id < best.id ? u : best;
  });
}

/** Stabilnie: jednostki niebojowe (zwiadowca) na koniec listy. */
export function sortNonCombatLast<T>(items: readonly T[], isNonCombat: (x: T) => boolean): T[] {
  return [...items.filter(x => !isNonCombat(x)), ...items.filter(isNonCombat)];
}
