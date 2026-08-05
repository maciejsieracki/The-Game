/**
 * wiarygodnosc-types.ts — Etap 0: typy i struktury Wiarygodności (bez logiki tick / bez Dźwigni 1).
 *
 * Spec: `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §1–§2 (jednorazowe zdarzenia).
 * Obliczenia, strumień S1–S4 i dźwignie: `game/diplomacy-credibility.ts` (Etap 1+).
 * Save/load i haki zdarzeń: `main.ts` (poza zakresem Etapu 0).
 */

/** Skala globalnej Wiarygodności per cywilizacja (−100…+100, §1). */
export const WIARYGODNOSC_SKALA_MIN = -100;
export const WIARYGODNOSC_SKALA_MAX = 100;

/** Wartość Wiarygodności na skali −100…+100. */
export type WiarygodnoscValue = number;

/** Cztery pasma etykiet UI (§1). Zero = brak historii — prezentacja UI, nie to pasmo. */
export type WiarygodnoscBand = 'wiarolomny' | 'chwiejny' | 'uczciwy' | 'wzor_cnoty';

/** Znak zdarzenia jednorazowego — decyduje o krzywej zapominania (§4). */
export type WiarygodnoscEventSign = 'kara' | 'nagroda';

/**
 * Typy zdarzeń JEDNORAZOWYCH (kary N1–N7 + nagrody FINISZ/CZYNY, §2/§3).
 * Zdarzenia STRUMIENIA (S1–S4, Dźwignia 1) — poza Etapem 0; patrz `CredibilityStreamEvent`
 * w `diplomacy-credibility.ts`.
 */
export type WiarygodnoscEventTyp =
  // kary N1–N7 (§2)
  | 'wypowiedzenie_wojny_bez_ostrzezenia'
  | 'zlamanie_paktu_nap'
  | 'zlamanie_paktu_sojusz'
  | 'atak_w_oknie_karencji'
  | 'odmowa_obowiazku_sojuszu'
  | 'zerwanie_dobrowolne_traktat'
  | 'zerwanie_dobrowolne_handel'
  | 'niedotrzymanie_handlu_cyklicznego'
  | 'nieautoryzowany_przemarsz'
  // nagrody FINISZ (§3 tabela B)
  | 'dotrwanie_sojuszu'
  | 'dotrwanie_nap'
  | 'dotrwanie_handlu'
  | 'splata_handlu_cyklicznego'
  // nagrody CZYNY (§3 tabela C)
  | 'wieloletni_pokoj'
  | 'pomoc_sojusznikowi_realna';

/**
 * Zapis pojedynczego zdarzenia jednorazowego w rejestrze ownera (§7, Etap 0 shape).
 * Bez logiki wygaszania — tylko struktura danych.
 */
export interface WiarygodnoscEventRecord {
  typ: WiarygodnoscEventTyp;
  /** Waga pierwotna z §2/§3 (ujemna kara / dodatnia nagroda). */
  wartoscPierwotna: number;
  /** Numer tury wystąpienia. */
  turaWystapienia: number;
  znak: WiarygodnoscEventSign;
}
