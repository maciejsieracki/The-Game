/**
 * armyStackLabel.ts — etykieta i kolejność jednostek armii (generał/wódz) dla wszystkich
 * list armii: karta stosu w panelu bocznym, panel podziału. Bez zależności od DOM/HUD,
 * żeby każdy panel mógł go użyć bez ciągnięcia całego armyStackHud.
 */

// REPIN UI-3 (R-RUSTPORT-REPIN-WEB-UI-3-Q1): ADAPTER — jedyna różnica względem weba `9b019a7d8` to brak importu
// `../game/stack-leader` (logika gry, zakaz `check-no-logic-imports`). Dwie czyste funkcje i stała typów cywilnych
// skopiowane bajtowo z weba (markery: źródło:linie); weryfikuje `tools/verify-repin-ui3-copies.mjs` (ADAPTER).
// pin-adapter 9b019a7d8 gra/src/units/setup.ts:198-198
const CIVILIAN_TYPE_IDS = new Set(['Zwiadowca', 'Osadnik', 'Robotnik']);

// pin-adapter 9b019a7d8 gra/src/game/stack-leader.ts:19-22
/** Wariant po samej nazwie typu (karty UI niosą tylko `name` = typeId). */
function isNonCombatTypeName(typeName: string): boolean {
  return CIVILIAN_TYPE_IDS.has(typeName);
}

// pin-adapter 9b019a7d8 gra/src/game/stack-leader.ts:43-46
/** Stabilnie: jednostki niebojowe (zwiadowca) na koniec listy. */
function sortNonCombatLast<T>(items: readonly T[], isNonCombat: (x: T) => boolean): T[] {
  return [...items.filter(x => !isNonCombat(x)), ...items.filter(isNonCombat)];
}

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
