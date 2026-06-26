/**
 * turn.ts
 * Informacja o biezacej turze gry — numer, rok historyczny, faza.
 */

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Faza biezacej tury.
 * Kolejnosc: najpierw faza gracza (decyzje), potem koniec tury globalny,
 * nastepnie AI realizuje swoje ruchy.
 */
export enum FazaTury {
  Gracza = 'gracza',  // gracz wydaje rozkazy
  KoniecTury = 'koniec_tury', // rozliczenie plonow, wzrostu, produkcji, nauki
  AI     = 'ai',      // AI realizuje ruchy (jesli sterowany)
}

// ---------------------------------------------------------------------------
// Glowny interfejs
// ---------------------------------------------------------------------------

/**
 * Tura — globalny zegar gry.
 */
export interface Turn {
  /** Numer tury (liczony od 1). */
  numer: number;

  /**
   * Rok historyczny odpowiadajacy biezacej turze.
   * Ujemny = przed nasza era (np. -4000 = 4000 p.n.e.), dodatni = n.e.
   */
  rok: number;

  /** Biezaca faza tury. */
  faza: FazaTury;

  /**
   * Id gracza, ktory aktualnie wykonuje ruch (w fazie Gracza lub AI).
   * null w fazie KoniecTury (przetwarzanie globalne).
   */
  aktywnyGraczId: string | null;
}
