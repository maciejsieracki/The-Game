/**
 * unit.ts
 * Jednostka wojskowa lub cywilna na mapie swiata.
 * Staty bazowe per typ przechowywane sa w data/units.json;
 * tutaj trzymamy stan instancji jednostki w grze.
 */

import type { HexCoords } from './hex';

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Rola jednostki w formacji armii / jej typ taktyczny.
 * Odpowiada kolumnie "Rola (linia)" w units.json.
 */
export enum RolaJednostki {
  Wrecz   = 'wrecz',    // piechota walczaca w zwarciu (melee)
  Dystans  = 'dystans',  // lukownicy, procarze, oszczepnicy
  Flanka   = 'flanka',   // kawaleria i rydwany
  Wsparcie = 'wsparcie', // osadnicy, robotnicy, zwiadowcy
  Morska   = 'morska',   // galery i statki
}

/**
 * Stan operacyjny jednostki na mapie swiata.
 */
export enum StanJednostki {
  Gotowy    = 'gotowy',    // moze sie ruszyc i atakowac w tej turze
  Poruszyla = 'poruszyla', // wykorzystala ruch, moze jeszcze atakowac (melee)
  Obozuje   = 'obozuje',   // odpoczywa 1 ture — uzupelnia HP do max; zuzywa pol zywnosci
  Wyczerpana = 'wyczerpana', // wykorzystala ruch i atak; tura skonczyla sie
}

// ---------------------------------------------------------------------------
// Glowny interfejs
// ---------------------------------------------------------------------------

/**
 * Instancja jednostki w grze.
 * Staty bazowe (Atak, Obrona, Health max itp.) sa wczytywane z data/units.json
 * na podstawie pola `typNazwa`; tu przechowujemy aktualny stan modyfikowany przez gre.
 */
export interface Unit {
  /** Unikalny identyfikator tej instancji jednostki. */
  id: string;

  /** Identyfikator gracza-wlasciciela. */
  wlasciciel: string;

  /**
   * Klucz typu jednostki z data/units.json (pole "Jednostka"),
   * np. "Wojownik", "Falanga", "Krolęwska Gwardia".
   * Uzywa sie go do wczytania statow bazowych.
   */
  typNazwa: string;

  /** Polozenie na mapie swiata (jesli nie jest w armii). */
  lokalizacja: HexCoords;

  /**
   * Aktualne punkty zycia (Health).
   * Wartosci z units.json: Wojownik max=30, Wlocznik max=80, itp.
   */
  health: number;

  /**
   * Aktualne morale jednostki (procent max Health jako wartosc referencyjna).
   * Gdy morale spadnie ponizej progu dezercji (Prog dezercji w units.json),
   * jednostka ucieka z pola bitwy (rout).
   */
  morale: number;

  /**
   * Aktualna ilosc pociskow (dla jednostek dystansowych).
   * Zerowana po kazdej bitwie; uzupelniana automatycznie w nastepnej turze.
   * Jednostki melee = 0.
   */
  amunicja: number;

  /** Stan operacyjny jednostki w biezacej turze. */
  stan: StanJednostki;

  /**
   * Identyfikator armii, do ktorej nalezy ta jednostka.
   * null = jednostka samodzielna na mapie (nie w stosie armii).
   */
  armiaId: string | null;

  /** Rola taktyczna jednostki (Wrecz / Dystans / Flanka / Wsparcie / Morska). */
  rola: RolaJednostki;

  /**
   * Czy to super-jednostka cywilizacji (max 1 szt., bezplatna, respawn w stolicy).
   * Dane z kolumny "Super-jednostka" w units.json.
   */
  isSuperJednostka: boolean;
}
