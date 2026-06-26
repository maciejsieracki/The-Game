/**
 * army.ts
 * Armia — stos jednostek polaczonych komenda "Polącz" (merge).
 * Na jednym polu stoi maksymalnie 1 zeton armii danej nacji (par. 6b).
 */

import type { HexCoords } from './hex';

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Formacja armii — wplyw na taktyczne ustawienie na polu bitwy.
 * Wartosci wstepne; do rozszerzenia wraz z implementacja modelu bitwy (par. 5l).
 */
export enum Formacja {
  Standardowa  = 'standardowa',   // domyslne ustawienie — linia
  Defensywna   = 'defensywna',    // zwarte szeregi, +Obrona, -Ruch
  Forsownyzmarsz = 'forsowny_marsz', // zwiekszony ruch, -Obrona
  Oboz         = 'oboz',          // 1 tura odpoczynku: uzupelnia Health do max; polowa zuzycia zywnosci
}

// ---------------------------------------------------------------------------
// Glowny interfejs
// ---------------------------------------------------------------------------

/**
 * Armia (stos / zeton na mapie swiata).
 * Po wejsciu jednostki do armii przestaje byc ona osobnym zetonem na mapie —
 * liczy sie wylacznie jako czesc stosu.
 */
export interface Army {
  /** Unikalny identyfikator armii. */
  id: string;

  /** Identyfikator gracza-wlasciciela. */
  wlasciciel: string;

  /** Polozenie armii na mapie swiata (jeden heks = jeden zeton nacji). */
  lokalizacja: HexCoords;

  /**
   * Lista identyfikatorow jednostek nalezacych do tej armii.
   * Kolejnosc moze byc uzyta do ustalenia priorytetu w walce.
   */
  jednostkiIds: string[];

  /**
   * Formacja armii — wplywa na zachowanie w walce i ruchu.
   * Zmieniana przez gracza; Oboz aktywuje mechanike odpoczynku.
   */
  formacja: Formacja;
}
