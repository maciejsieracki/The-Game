export const BARBARIAN_OWNER_ID = -1;

/** Returns true when an owner id belongs to the barbarian faction. */
export function isBarbarian(ownerId: number): boolean {
  return ownerId === BARBARIAN_OWNER_ID;
}
