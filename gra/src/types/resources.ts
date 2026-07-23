/**
 * resources.ts
 * Stan zasobow (surowcow) — globalnie i per-miasto.
 * Lista surowcow pochodzi z data/resources.json.
 *
 * UWAGA: ilosci liczbowe zasobow zaimplementowane od v0.2;
 * w v0.1 dziala model dostepu (masz / nie masz surowca).
 */

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Identyfikatory wszystkich surowcow w grze.
 * Typ surowy: pochodzi bezposrednio z terenu / zloza.
 * Typ przetworzony: wymaga budynku produkcyjnego (tartak, itp.).
 * Typ hodowla: wymaga zloza startowego + pastwiska.
 */
export enum SurowiecId {
  // Surowe
  Zywnosc = 'zywnosc',
  Drewno  = 'drewno',
  Kamien  = 'kamien',
  Glina   = 'glina',
  Ruda    = 'ruda',

  // Hodowlane
  BydloWol = 'bydlo_wol',  // tylko Stary Swiat + dostep z handlu; Rydwan (wolow)
  Owce     = 'owce',       // Stary i Nowy Swiat (Andy); +2 zywnosci gdy przypisane
  Kon      = 'kon',        // Stary Swiat; Konnica i rydwany konne; NIE Inkowie
  Lama     = 'lama',       // TYLKO Inkowie / Ameryka Pd.; substytut bydla

  // Przetworzone
  Deski    = 'deski',      // WYCOFANE (B-SUROW-BUD-03) — nie używać
  // Paliwo USUNIETE calkowicie (decyzja Macieja 2026-07-23): konwertery biora DREWNO 1:1.
  Cegla    = 'cegla',      // Cegielnia: glina + drewno -> cegla
  Ceramika = 'ceramika',   // Garncarnia: glina + drewno -> ceramika (luksus)
  Braz     = 'braz',       // Piec hutniczy: ruda + drewno -> braz
}

// ---------------------------------------------------------------------------
// Interfejsy
// ---------------------------------------------------------------------------

/**
 * Zapas pojedynczego surowca (ilosc + pojemnosc).
 * Uzywany jako wartosc w slownikach ResourceStock.
 */
export interface ZapasJednegoSurowca {
  /** Aktualna ilosc na stanie. */
  ilosc: number;
  /** Maksymalna pojemnosc magazynu (bazowa lub po rozbudowie). */
  pojemnosc: number;
}

/**
 * Pelny stan zasobow cywilizacji — zagregowany ze wszystkich miast.
 * Pieniadz NIE jest tu — jest w Player.skarbiec (globalny skarbiec).
 * Praca i Handel sa lokalne per-miasto (obliczane dynamicznie, nie przechowywane tu).
 */
export interface ResourceStock {
  /**
   * Zasoby per surowiec.
   * Klucz = SurowiecId; wartosc = aktualny zapas i pojemnosc.
   * Surowce nieposiadane moga byc pominiate lub miec ilosc = 0.
   */
  zasoby: Partial<Record<SurowiecId, ZapasJednegoSurowca>>;
}
