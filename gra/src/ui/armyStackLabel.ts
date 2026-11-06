/**
 * armyStackLabel.ts — etykieta i kolejność jednostek armii (generał/wódz) dla wszystkich
 * list armii: karta stosu w panelu bocznym, panel podziału. Bez zależności od DOM/HUD,
 * żeby każdy panel mógł go użyć bez ciągnięcia całego armyStackHud.
 */

import { isNonCombatTypeName, sortNonCombatLast } from '../game/stack-leader';

export type ArmyCommanderTitle = 'Wódz' | 'Generał';

/**
 * Etykieta karty armii: dla wodza/generała „Generał — Wojownik" (rola + typ),
 * dla zwykłej jednostki sama nazwa typu.
 */
export function armyStackCardLabel(card: { name: string; commanderTitle?: ArmyCommanderTitle }): string {
  return card.commanderTitle ? `${card.commanderTitle} — ${card.name}` : card.name;
}

/**
 * Generałowie/wodzowie na początku listy (stabilnie: reszta zachowuje kolejność).
 * Bez tego dowódca mógł stać w środku długiego stosu i ginąć wśród „Wojowników".
 */
export function sortArmyStackGeneralsFirst<T extends { commanderTitle?: ArmyCommanderTitle; name?: string }>(
  cards: readonly T[],
): T[] {
  // R-WEB-ARMY-SCOUT-NOT-LEADER-Q1: generałowie pierwsi, zwiadowca/cywile na samym końcu.
  const ordered = [
    ...cards.filter(c => c.commanderTitle !== undefined),
    ...cards.filter(c => c.commanderTitle === undefined),
  ];
  return sortNonCombatLast(
    ordered,
    c => c.commanderTitle === undefined && c.name !== undefined && isNonCombatTypeName(c.name),
  );
}
