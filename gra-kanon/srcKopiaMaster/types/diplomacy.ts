/**
 * diplomacy.ts
 * Stan dyplomacji — relacje miedzy parami graczy.
 * Model oparty na data/diplomacy.json (akcje, parametry Zaufania i Respektu,
 * progi akcji, panel sterowania A–E).
 */

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Aktywne traktaty dyplomatyczne miedzy para graczy.
 * Odpowiada akcjom z data/diplomacy.json.akcje_dyplomatyczne.
 */
export enum RodzajTraktatu {
  PaktNieagresji    = 'pakt_nieagresji',    // NAP; lamiąc: -30 Relacja, -20 Zaufanie
  SojuszWojskowy    = 'sojusz_wojskowy',    // legacy → mapuj na sojusz_pelny (v1.1)
  SojuszDefensywny  = 'sojusz_defensywny',  // v1.1 T2: atak na sojusznika → obaj w walce
  SojuszPelny       = 'sojusz_pelny',       // v1.1 T2: wojna sojusznika → auto-dołączenie
  OtwartGranice     = 'otwarte_granice',    // prawo przemarszu cywilnego
  PrawoWojskowePrzemarszu = 'prawo_wojskowe_przemarszu',
  UmowaHandlowa     = 'umowa_handlowa',     // regularne transfery surowcow/Pieniadza
  Wasalizacja       = 'wasalizacja',        // trybut + ochrona; zakaz sojuszy bez zgody
  Rozejm            = 'rozejm',             // tymczasowe zawieszenie broni (5–15 tur)
}

/**
 * Stan stosunkow wojennych miedzy para graczy.
 */
export enum StanWojny {
  Pokoj        = 'pokoj',
  Rozejm       = 'rozejm',  // aktywny rozejm (czas w osobnym polu)
  Wojna        = 'wojna',
  CasusBelli   = 'casus_belli', // wypowiedzenie z przyczyna — mniejsza kara reputacyjna
}

// ---------------------------------------------------------------------------
// Interfejsy
// ---------------------------------------------------------------------------

/**
 * Aktywny traktat z czasem trwania.
 */
export interface AktywnyTraktat {
  rodzaj: RodzajTraktatu;
  /**
   * Tura, w ktorej traktat wygasa.
   * null = bezterminowy (np. sojusz wojskowy).
   */
  wygasaTura: number | null;
}

/**
 * Relacja dyplomatyczna miedzy PARA graczy (A <-> B).
 * Przechowywana per para (np. pod kluczem "playerId_A:playerId_B").
 * Relacja ogolna = Zaufanie + Respekt (zakres 0–200).
 */
export interface RelacjaDyplomatyczna {
  /** Id pierwszego gracza w parze. */
  graczA: string;
  /** Id drugiego gracza w parze. */
  graczB: string;

  /**
   * Zaufanie (soft power / goodwill) — zakres 0–100, start = 20.
   * Zmienia sie od akcji: pakty, handel, podarunki (+), zdrada, ekspansja (-).
   * Rywale tego samego typu startuja z -20 korektą (data: "Rywalizacja tego samego typu").
   */
  zaufanie: number;

  /**
   * Respekt / Strach (hard power) — zakres 0–100, start = 30.
   * Zalezy wylacznie od sily militarnej, bitew i potegi cywilizacji.
   * Obliczany wzglednie wobec partnera.
   */
  respekt: number;

  /**
   * Relacja ogolna = Zaufanie + Respekt (0–200).
   * Ponizej 30: dyplomacja prawie niemozliwa; powyzej 120: sojusze osiagalne.
   * Pole pochodne — moze byc wyliczane dynamicznie (zaufanie + respekt).
   */
  relacjaOgolna: number;

  /** Aktywne traktaty miedzy tą para graczy. */
  traktaty: AktywnyTraktat[];

  /** Aktualny stan stosunkow wojennych. */
  stanWojny: StanWojny;

  /**
   * Czy kontakt miedzy graczami zostal nawiazany.
   * Bez kontaktu zadne dalsze akcje dyplomatyczne nie sa mozliwe.
   */
  kontaktNawiazany: boolean;

  /**
   * Skumulowane urazy historyczne (np. po ataku, aneksji).
   * Maleja powoli co 20 tur (silnik odpowiada za redukcje).
   */
  urazyHistoryczne: number;
}

/**
 * Globalne stale konfiguracyjne dyplomacji — wczytywane z data/diplomacy.json
 * "panel_sterowania" (sekcje B, C, D, E).
 * Przechowywane w GameState.config, nie modyfikowane w trakcie gry.
 */
export interface DiplomacyConfig {
  // --- Wartosci startowe ---
  /** Startowe Zaufanie miedzy parami graczy (domyslnie 20). */
  startZaufanie: number;
  /** Startowy Respekt miedzy parami graczy (domyslnie 30). */
  startRespekt: number;

  // --- Progi akcji (sekcja C) ---
  /** Prog Zaufania odblokujacy Sojusz wojskowy (domyslnie 60). */
  progSojuszZaufanie: number;
  /** Prog Zaufania odblokujacy Wymiane technologii (domyslnie 70). */
  progWymianaTechZaufanie: number;
  /** Prog Respektu odblokujacy zadanie Wasalizacji (domyslnie 70). */
  progWasalizacjaRespekt: number;
  /** Prog Respektu odblokujacy zadanie Wchloniecia (domyslnie 90). */
  progWchloniecieRespekt: number;
  /** Prog Relacji ogolnej, ponizej ktorego dyplomacja jest prawie niemozliwa (domyslnie 30). */
  progMinimalnyRelacja: number;
  /** Prog Relacji ogolnej, od ktorego sojusze sa realistyczne (domyslnie 120). */
  progSojuszRelacja: number;

  // --- Globalne mnozniki (sekcja E) ---
  /** Mnoznik globalny Zaufania (domyslnie 1.0). */
  mnoznikZaufania: number;
  /** Mnoznik globalny Respektu (domyslnie 1.0). */
  mnoznikRespektu: number;
  /** Mnoznik wplywu podarunkow (domyslnie 1.0; 1.5 = +50% wplywu). */
  mnoznikPodarunku: number;
  /** Ile tur utrzymuje sie efekt dobrej woli po podarunku (domyslnie 5). */
  turyEfektuPodarunku: number;
}

/**
 * Pelny stan dyplomacji gry.
 * Zawiera relacje miedzy wszystkimi parami graczy.
 */
export interface DiplomacyState {
  /**
   * Relacje per para graczy.
   * Klucz = "${idA}:${idB}" (id leksykograficznie mniejszy zawsze pierwszy).
   */
  relacje: Record<string, RelacjaDyplomatyczna>;
}
