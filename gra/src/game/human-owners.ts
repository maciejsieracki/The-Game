/**
 * human-owners.ts
 * Hot-seat fundament (Etap 0, R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1) -- pure functions only.
 * No DOM, no THREE, no main.ts. Zero-state module: everything is derived from the
 * `HumanSeats` value passed in by the caller.
 *
 * Kontrakt z docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md §B1. Ten moduł nie ma dziś
 * żadnego konsumenta w main.ts -- pierwszym konsumentem będzie Etap 1
 * (`isAiOwner` zastępujące dzisiejsze `ownerId > 0` w ~31 miejscach main.ts).
 *
 * Sentinele właścicieli AI-wykluczonych z bycia "człowiekiem":
 *   - barbarzyńcy: BARBARIAN_OWNER_ID = -1 (gra/src/game/barbarians.ts)
 *   - rebelianci:  REBEL_FACTION_OWNER_ID = -99 (gra/src/game/society-breakdown.ts)
 * Wartości potwierdzone grepem w kodzie (nie zgadywane) przed napisaniem tego pliku.
 */

import { BARBARIAN_OWNER_ID } from './barbarians';
import { REBEL_FACTION_OWNER_ID } from './society-breakdown';

/** Domyślny/jedyny właściciel-człowiek w trybie single-player. */
export const HUMAN_OWNER_PRIMARY = 0;

/**
 * Stan foteli ludzkich graczy. W single-player: `humanOwnerIds = [0]`,
 * `activeHumanOwnerId = 0`. W hot-seat 2-osobowym: `humanOwnerIds = [0, N]`
 * (N = ownerId drugiego fotela), `activeHumanOwnerId` wskazuje, kto ma teraz turę.
 */
export interface HumanSeats {
  readonly humanOwnerIds: readonly number[];
  readonly activeHumanOwnerId: number;
}

/** Czy `ownerId` jest którymkolwiek z foteli ludzkich (aktywnym lub nie). */
export function isHumanOwner(seats: HumanSeats, ownerId: number): boolean {
  return seats.humanOwnerIds.includes(ownerId);
}

/** Czy `ownerId` jest DOKŁADNIE fotelem aktywnym w tej chwili. */
export function isActiveHuman(seats: HumanSeats, ownerId: number): boolean {
  return ownerId === seats.activeHumanOwnerId;
}

/**
 * Czy `ownerId` jest przeciwnikiem sterowanym przez AI: ani człowiek (żaden fotel),
 * ani barbarzyńca, ani rebeliant.
 */
export function isAiOwner(seats: HumanSeats, ownerId: number): boolean {
  if (isHumanOwner(seats, ownerId)) return false;
  if (ownerId === BARBARIAN_OWNER_ID) return false;
  if (ownerId === REBEL_FACTION_OWNER_ID) return false;
  return true;
}

/**
 * Kolejny fotel ludzki po `activeHumanOwnerId`, cyklicznie po `humanOwnerIds`.
 * Zwraca `null` gdy jest tylko jeden fotel ludzki (nie ma dokąd przełączyć) --
 * także gdy `activeHumanOwnerId` nie jest w ogóle w `humanOwnerIds`.
 */
export function nextHumanSeat(seats: HumanSeats): number | null {
  const { humanOwnerIds, activeHumanOwnerId } = seats;
  if (humanOwnerIds.length <= 1) return null;
  const idx = humanOwnerIds.indexOf(activeHumanOwnerId);
  if (idx === -1) return null;
  const nextIdx = (idx + 1) % humanOwnerIds.length;
  return humanOwnerIds[nextIdx] ?? null;
}

/** Czy ten stan foteli jest hot-seatem (więcej niż jeden fotel ludzki). */
export function isHotSeat(seats: HumanSeats): boolean {
  return seats.humanOwnerIds.length > 1;
}
