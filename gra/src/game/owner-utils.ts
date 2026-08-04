/**
 * owner-utils.ts
 * Proste predykaty własności ownerów — bez DOM, bez stanu globalnego.
 */
import { isBarbarian } from './barbarians';

/**
 * AI-MANAGE-Q1=A: major AI to ownerId > 0, nie barbarzyńca, nie miasto-państwo.
 * `isCityState` powinien zwracać true dla właścicieli z `simplifiedDiplomacyOwners`
 * lub `typCityCopyOwners` (oraz dla defensiveCopy jeśli kiedykolwiek byłby ownerId).
 */
export function isMajorAiOwner(
  ownerId: number,
  isCityState: (id: number) => boolean,
): boolean {
  return ownerId > 0 && !isBarbarian(ownerId) && !isCityState(ownerId);
}
