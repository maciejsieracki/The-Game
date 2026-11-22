/**
 * ai-free-unit-upkeep.ts
 * R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1 (decyzja właściciela 2026-11-22).
 *
 * Cywilizacje AI NIE płacą utrzymania jednostek wojskowych w turach 1..tury (domyślnie 1..40)
 * włącznie: złoto, surowce i żywność. Od tury tury+1 płacą pełny koszt („Koszty jednostek”).
 * Rekrutacja (koszt zakupu) NIE jest darmowa. Gracz-człowiek: zero zmian.
 *
 * Mechanika: utrzymanie = bazowa tabela × mnożnik tempa. Dla właściciela AI w oknie
 * darmowym tempo zastępowane jest zerem (`paceUtrzymaniaWlasciciela` zwraca 0), więc
 * istniejące ścieżki liczenia utrzymania dają 0 bez kopiowania logiki.
 *
 * Konfiguracja: data/ai-free-unit-upkeep-params.json (wlaczone=false = zero wpływu).
 */

import type { KosztJednostekPace } from './unit-cost-tempo';

export interface AiFreeUnitUpkeepParams {
  /** false = mechanika wyłączona (zero wpływu, identycznie jak przed zmianą). */
  wlaczone: boolean;
  /** Ostatnia tura (włącznie), w której AI nie płaci utrzymania jednostek. */
  tury: number;
}

/**
 * Czysta funkcja: czy właściciel ma w tej turze zerowe utrzymanie jednostek.
 * turn = numer tury gry liczony od 1. Gracz-człowiek (isHumanOwner=true) -> zawsze false.
 */
export function aiFreeUnitUpkeepActive(
  ownerId: number,
  turn: number,
  isHumanOwner: boolean,
  params: AiFreeUnitUpkeepParams | null | undefined,
): boolean {
  void ownerId; // właściciel rozstrzygany przez isHumanOwner (wołający zna fotele)
  if (!params || params.wlaczone !== true) return false;
  if (isHumanOwner) return false;
  if (!Number.isFinite(turn) || !Number.isFinite(params.tury)) return false;
  return turn >= 1 && turn <= params.tury;
}

/** Kontekst instalowany raz przez main.ts (tura bieżąca, fotele ludzkie, parametry). */
export interface AiFreeUnitUpkeepContext {
  getTurn: () => number;
  isHumanOwner: (ownerId: number) => boolean;
  params: AiFreeUnitUpkeepParams;
}

let _ctx: AiFreeUnitUpkeepContext | null = null;

/** Ustawia (lub czyści przez null) kontekst. Bez kontekstu tempo zwracane jest bez zmian. */
export function setAiFreeUnitUpkeepContext(ctx: AiFreeUnitUpkeepContext | null): void {
  _ctx = ctx;
}

/**
 * Tempo utrzymania dla właściciela: 0 gdy okno darmowe AI jest aktywne, inaczej `pace` bez zmian.
 * Jedyny punkt wejścia dla ścieżek liczących utrzymanie per właściciel.
 */
export function paceUtrzymaniaWlasciciela<P extends KosztJednostekPace | number | null | undefined>(
  ownerId: number,
  pace: P,
): P | 0 {
  const c = _ctx;
  if (!c) return pace;
  try {
    return aiFreeUnitUpkeepActive(ownerId, c.getTurn(), c.isHumanOwner(ownerId), c.params) ? 0 : pace;
  } catch {
    return pace;
  }
}
