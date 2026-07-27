/**
 * zloto-access.ts — Złoto w magazynie państwa (PYTANIE-84-R9, U-13, Maciej 2026-07-27).
 *
 * Kanon:
 *  - Kopalnia złota → Złoto/turę do magazynu państwa (B4: 1/t na kopalnię).
 *  - Mennica (stolica, Waluta + Targowisko): zużywa 1 Złoto/turę ze skarbca, gdy działa
 *    mnożnik handlu→Pieniądz (U-13). UI: „Złoto (surowiec)" ≠ „Pieniądz (skarbiec)".
 *  - Bramka budowy / runtime (R3=B): wystarczy zapas w puli imperium — kopalnia na mapie
 *    nie jest wymagana, jeśli jest stock.
 *  - Szlaki handlowe (U-3): dostarczają sztuki do magazynu państwa (trade-routes.ts),
 *    NIE syntetyczny wpis „dostępu" w placedImprovements.
 *
 * Zastępuje model ACCESS_ONLY (2026-07-25): złoto jest magazynowane w City.surowce.zloto
 * (suma civ-wide — building-stock-cost.ts ownerResourceStockAll).
 */
import { normalizeImprovementKey } from './terrain-improvements';

/** Id dedykowanego ulepszenia „Kopalnia złota" (terrain-improvements.json). */
export const KOPALNIA_ZLOTA_KEY = 'kopalnia_zlota';

/** Klucz ASCII w City.surowce / puli państwa. */
export const ZLOTO_STOCK_KEY = 'zloto';

/** Etykieta PL (bramki budynków, panel surowców). */
export const ZLOTO_LABEL = 'Złoto';

/** Produkcja z jednej Kopalni złota → magazyn państwa (PYTANIE-84-B4). */
export const KOPALNIA_ZLOTA_YIELD_PER_TURN = 1;

/** Zużycie Mennicy przy aktywnym mnożniku Waluta+Mennica (PYTANIE-84-U-13). */
export const MENNICA_ZLOTO_DRAIN_PER_TURN = 1;

function improvementKeysOnPlaced(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp
    .map(k => normalizeImprovementKey(String(k)))
    .filter((k): k is string => !!k);
}

/**
 * Liczba ukończonych Kopalni złota w imperium (źródło produkcji mapowej 1/t każda).
 * Wołający przekazuje mapę placedImprovements przefiltrowaną per owner.
 */
export function countKopalnieZlota(
  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,
): number {
  if (!placedImprovements?.size) return 0;
  let n = 0;
  for (const imp of placedImprovements.values()) {
    for (const key of improvementKeysOnPlaced(imp)) {
      if (key === KOPALNIA_ZLOTA_KEY) n++;
    }
  }
  return n;
}

/**
 * Czy imperium ma co najmniej jedną Kopalnię złota na mapie.
 * Zachowane dla kompatybilności API (resource-access, main.ts) — oznacza aktywne
 * ŹRÓDŁO produkcji, nie sam zapas w skarbcu.
 */
export function empireHasKopalniaZlota(
  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,
): boolean {
  return countKopalnieZlota(placedImprovements) > 0;
}

/** Zapas Złota w magazynie państwa (suma City.surowce.zloto po imperium). */
export function empireZlotoStock(
  empireStock?: Readonly<Record<string, number>> | null,
): number {
  if (!empireStock) return 0;
  const v = empireStock[ZLOTO_STOCK_KEY];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/** Czy w puli państwa jest jakiekolwiek Złoto (R3=B — bramka budowy Mennicy). */
export function ownerHasZlotoStock(
  empireStock?: Readonly<Record<string, number>> | null,
): boolean {
  return empireZlotoStock(empireStock) > 0;
}

/**
 * Czy Mennica może zużyć Złoto w tej turze (mnożnik handlu→Pieniądz).
 * `graceActive` = łaska 1 tury po wyczerpaniu zapasu (mennica-zloto-grace.ts).
 */
export function ownerCanFeedMennica(
  empireStock?: Readonly<Record<string, number>> | null,
  graceActive = false,
): boolean {
  if (graceActive) return true;
  return empireZlotoStock(empireStock) >= MENNICA_ZLOTO_DRAIN_PER_TURN;
}

/**
 * Zastępuje stary resolver „dostępu do złota" (resolveOwnerZlotoAccess w main.ts /
 * turn-economy.ts): true gdy wystarczy zapasu LUB trwa łaska po utracie stocku.
 */
export function resolveOwnerZlotoFromStock(
  ownerId: number,
  empireStock: Readonly<Record<string, number>> | undefined,
  graceResolver?: (ownerId: number) => boolean,
): boolean {
  const grace = graceResolver?.(ownerId) === true;
  return ownerCanFeedMennica(empireStock, grace);
}

/**
 * Pobiera MENNICA_ZLOTO_DRAIN_PER_TURN ze skarbca państwa po turze z aktywnym
 * mnożnikiem. Gdy brak wystarczającego zapasu — zwraca niezmieniony obiekt.
 */
export function deductMennicaZlotoDrain(
  empireStock: Readonly<Record<string, number>>,
): Record<string, number> {
  const current = empireStock[ZLOTO_STOCK_KEY] ?? 0;
  if (current < MENNICA_ZLOTO_DRAIN_PER_TURN) return { ...empireStock };
  return {
    ...empireStock,
    [ZLOTO_STOCK_KEY]: current - MENNICA_ZLOTO_DRAIN_PER_TURN,
  };
}

// ---------------------------------------------------------------------------
// Legacy API (main.ts — do migracji na stock + trade flow w osobnym batchu)
// ---------------------------------------------------------------------------

/**
 * @deprecated PYTANIE-84-U3: szlaki dostarczają stock, nie syntetyczny dostęp.
 * Zachowane dla kompatybilności sygnatury main.ts — zwraca wejście bez zmian.
 */
export const TRADE_GRANT_ZLOTO_SYNTHETIC_KEY = '__trasa_zloto__';

/**
 * @deprecated Patrz TRADE_GRANT_ZLOTO_SYNTHETIC_KEY — no-op do czasu migracji main.ts.
 */
export function placedImprovementsWithZlotoTradeGrant(
  placedImprovements: ReadonlyMap<string, string | readonly string[]>,
  _hasTradeGrant: boolean,
): ReadonlyMap<string, string | readonly string[]> {
  return placedImprovements;
}
