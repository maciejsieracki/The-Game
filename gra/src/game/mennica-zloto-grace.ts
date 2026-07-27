/**
 * mennica-zloto-grace.ts — 1 tura łaski Mennicy po utracie dostępu do złota.
 *
 * PYTANIE-77-DOP=B (Maciej 2026-07-27): po zerwaniu szlaku / utracie Kopalni
 * złota istniejąca Mennica nadal daje mnożnik Waluta+Mennica przez **1 turę**
 * (łaska), potem pełne uśpienie jak PYTANIE 83=B (natychmiast bez łaski).
 *
 * „Dostęp do złota" (natywny OR grant z trasy) liczy wołający — ten moduł
 * jest pure logic: trzyma licznik per owner + migawkę z poprzedniej tury.
 * Parytet gracz + AI (ownerId-agnostyczny).
 */

/** Liczba tur łaski po utracie dostępu (PYTANIE-77-DOP=B). */
export const MENNICA_ZLOTO_GRACE_TURNS = 1;

export interface MennicaZlotoGraceState {
  /** Pozostałe tury łaski per owner (0 = brak). */
  graceTurnsLeft: Map<number, number>;
  /** Migawka dostępu z końca poprzedniej tury (wykrywanie utraty). */
  hadAccessLastTurn: Map<number, boolean>;
}

export function createMennicaZlotoGraceState(): MennicaZlotoGraceState {
  return { graceTurnsLeft: new Map(), hadAccessLastTurn: new Map() };
}

export function clearMennicaZlotoGraceState(state: MennicaZlotoGraceState): void {
  state.graceTurnsLeft.clear();
  state.hadAccessLastTurn.clear();
}

/**
 * Efektywny dostęp do złota dla bramki Mennicy (mnożnik + etykieta Podatek).
 * Natywny dostęp LUB pozostała łaska.
 */
export function ownerZlotoAccessForMennica(
  ownerId: number,
  state: MennicaZlotoGraceState,
  hasZlotoAccessNow: (ownerId: number) => boolean,
): boolean {
  if (hasZlotoAccessNow(ownerId)) return true;
  return (state.graceTurnsLeft.get(ownerId) ?? 0) > 0;
}

/**
 * Przed tickiem ekonomii (po przeliczeniu grantów handlowych): wykryj utratę
 * dostępu i ustaw łaskę. Zwraca resolver do `resolveOwnerZlotoAccess` w
 * turn-economy.ts (memoizacja po stronie wołającego).
 */
export function prepareMennicaZlotoGraceForTick(
  state: MennicaZlotoGraceState,
  ownerIds: readonly number[],
  hasZlotoAccessNow: (ownerId: number) => boolean,
): (ownerId: number) => boolean {
  for (const ownerId of ownerIds) {
    const now = hasZlotoAccessNow(ownerId);
    if (now) {
      state.graceTurnsLeft.set(ownerId, 0);
    } else if (state.hadAccessLastTurn.get(ownerId) === true) {
      state.graceTurnsLeft.set(ownerId, MENNICA_ZLOTO_GRACE_TURNS);
    }
  }
  return (ownerId: number) => ownerZlotoAccessForMennica(ownerId, state, hasZlotoAccessNow);
}

/**
 * Po ticku ekonomii: migawka dostępu + dekrement łaski.
 */
export function finalizeMennicaZlotoGraceAfterTick(
  state: MennicaZlotoGraceState,
  ownerIds: readonly number[],
  hasZlotoAccessNow: (ownerId: number) => boolean,
): void {
  for (const ownerId of ownerIds) {
    const now = hasZlotoAccessNow(ownerId);
    state.hadAccessLastTurn.set(ownerId, now);
    if (!now) {
      const grace = state.graceTurnsLeft.get(ownerId) ?? 0;
      if (grace > 0) state.graceTurnsLeft.set(ownerId, grace - 1);
    }
  }
}

export interface MennicaZlotoGraceSave {
  graceTurnsLeft: Array<[number, number]>;
  hadAccessLastTurn: Array<[number, boolean]>;
}

export function serializeMennicaZlotoGrace(state: MennicaZlotoGraceState): MennicaZlotoGraceSave {
  return {
    graceTurnsLeft: Array.from(state.graceTurnsLeft.entries()),
    hadAccessLastTurn: Array.from(state.hadAccessLastTurn.entries()),
  };
}

export function restoreMennicaZlotoGrace(
  state: MennicaZlotoGraceState,
  saved: MennicaZlotoGraceSave | undefined | null,
): void {
  clearMennicaZlotoGraceState(state);
  if (!saved) return;
  if (Array.isArray(saved.graceTurnsLeft)) {
    for (const [oid, v] of saved.graceTurnsLeft) state.graceTurnsLeft.set(oid, v);
  }
  if (Array.isArray(saved.hadAccessLastTurn)) {
    for (const [oid, v] of saved.hadAccessLastTurn) state.hadAccessLastTurn.set(oid, v);
  }
}
