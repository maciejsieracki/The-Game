/**
 * armyStackLabel.ts — etykieta i kolejność jednostek armii (generał/wódz) dla wszystkich
 * list armii: karta stosu w panelu bocznym, panel podziału. Bez zależności od DOM/HUD,
 * żeby każdy panel mógł go użyć bez ciągnięcia całego armyStackHud.
 */

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
export function sortArmyStackGeneralsFirst<T extends { commanderTitle?: ArmyCommanderTitle }>(
  cards: readonly T[],
): T[] {
  return [
    ...cards.filter(c => c.commanderTitle !== undefined),
    ...cards.filter(c => c.commanderTitle === undefined),
  ];
}
