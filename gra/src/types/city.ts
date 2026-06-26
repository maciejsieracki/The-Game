/**
 * city.ts
 * Miasto gracza — osrodek produkcji, ludnosci i kultury.
 * Model zgodny z par. 8a, Schemat-dzialania-miasta.md oraz data/buildings.json.
 */

import type { HexCoords } from './hex';

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/** Typ specjalisty, ktory moze zajac miejsce zamiast pracy na polu. */
export enum TypSpecjalisty {
  Uczony  = 'uczony',   // +3 Nauki/ture
  Poborca = 'poborca',  // +2 Pieniadza/ture
  Artysta = 'artysta',  // +2 Kultury/ture
}

// ---------------------------------------------------------------------------
// Interfejsy pomocnicze
// ---------------------------------------------------------------------------

/**
 * Przypisany specjalista — jeden mieszkaniec zamieniony na specjaliste.
 * Mieszkaniec nie obrabia pola (utrata jego plonow).
 */
export interface Specjalista {
  typ: TypSpecjalisty;
}

/**
 * Element kolejki produkcji (budynek lub jednostka oczekujace na zbudowanie).
 * Postep mierzony zebraną Praca (punktami).
 */
export interface ElementKolejki {
  /** Identyfikator budynku lub jednostki (klucz w danych json, np. "tartak", "wojownik"). */
  id: string;
  /** Typ elementu — budynek lub jednostka. */
  typ: 'budynek' | 'jednostka';
  /** Calkowity koszt w punktach Pracy. */
  kosztPracy: number;
  /** Zebrana do tej pory Praca (postep budowy). */
  zebranaPraca: number;
}

/**
 * Magazyn zywnosci miasta.
 * Wzrost populacji wymaga Spichlerza (bez niego nadwyzka przepada).
 */
export interface MagazynZywnosci {
  /** Aktualne zapasy zywnosci w magazynie. */
  aktualny: number;
  /** Maksymalna pojemnosc (bazowa; x5 po wybudowaniu Spichlerza). */
  pojemnosc: number;
  /**
   * Czy miasto posiada Spichlerz.
   * Bez Spichlerza: zapas zeruje sie po wzroscie; ze Spichlerzem: zachowuje 50%.
   */
  maSpichlerz: boolean;
}

/**
 * Magazyn surowcow miasta (per-miasto, lokalne).
 * Kazdy surowiec ma aktualna ilosc i pojemnosc.
 * Po zapelnieniu nadwyzka przepada; utrata miasta = surowce przepadaja.
 */
export interface MagazynSurowcow {
  /** Aktualne ilosci per surowiec. Klucz = id surowca (np. "drewno", "kamien"). */
  zasoby: Record<string, number>;
  /**
   * Pojemnosc per surowiec (zwykle jednolita; x5 po wybudowaniu Magazynu).
   * Klucz = id surowca.
   */
  pojemnosc: Record<string, number>;
  /** Czy miasto posiada Magazyn (odblokowuje x5 pojemnosci). */
  maMagazyn: boolean;
}

/**
 * Suwak podzialu Pracy — gracz ustala % Pracy netto kierowany do budow vs. terenow.
 * Domyslny podzia i zakres do ustalenia w balancie.
 */
export interface PodziałPracy {
  /**
   * Procent Pracy netto kierowany do kolejki produkcji budynkow/jednostek (0–100).
   * Pozostala czesc (100 - budynki) idzie na prace w terenie (ulepszenia heksow).
   */
  procentBudynki: number;
}

/**
 * Suwak podzialu Handlu — Nauka / Pieniadz / Luksus (w %).
 * Suma musi wynosic 100.
 */
export interface PodziałHandlu {
  /** Procent Handlu netto kierowany na Nauke (badania). */
  procentNauka: number;
  /** Procent Handlu netto kierowany do Skarbca (Pieniadz). */
  procentPieniadz: number;
  /** Procent Handlu netto kierowany na Luksus (+Zadowolenie). */
  procentLuksus: number;
}

// ---------------------------------------------------------------------------
// Glowny interfejs
// ---------------------------------------------------------------------------

/**
 * Miasto gracza.
 * Kazde miasto produkuje niezaleznie — wiecej miast = wiecej rownoleglej produkcji.
 */
export interface City {
  /** Unikalny identyfikator miasta. */
  id: string;

  /** Identyfikator gracza-wlasciciela. */
  wlasciciel: string;

  /** Polozenie centrum miasta (wspolrzedne heksa). */
  lokalizacja: HexCoords;

  /** Aktualna liczba mieszkancow (populacja). */
  ludnosc: number;

  /**
   * Czy to stolica cywilizacji.
   * Stolica przechowuje skarbiec; jej utrata zeruje Pieniadz.
   */
  czyStolica: boolean;

  /**
   * Poziom zdrowia miasta (wynik netto czynnikow + i -).
   * >0 = szybszy wzrost; 0 = stagnacja; <0 = spadek populacji.
   * Akwedukt odblokowuje wzrost powyzej 6 mieszkancow.
   */
  zdrowie: number;

  /**
   * Ilosc zadowolonych mieszkancow.
   * Zrodla: Swiatynia, Luksus (suwak Handlu), ceramika, religia dominujaca.
   */
  zadowoleni: number;

  /**
   * Ilosc niezadowolonych mieszkancow.
   * Nadmiar niezadowolonych = koszty utrzymania i ryzyko niestabilnosci.
   */
  niezadowoleni: number;

  /**
   * Laczna skumulowana kultura miasta (rosnie kazdą turą z budynkow i specjalistow).
   * Przy progu rozszerza granice miasta (zasieg).
   */
  kulturaSkumulowana: number;

  /** Kultura generowana przez to miasto na ture. */
  kulturaNaTure: number;

  /**
   * Dominujaca religia w miescie (nazwa lub null gdy brak).
   * Religia rozszerza sie na sasiednie miasta; wspolna = bonus dyplomatyczny.
   */
  religionDominujaca: string | null;

  /** Liczba wyznawcow dominujacej religii (max = ludnosc). */
  wyznawcy: number;

  /** Magazyn zywnosci (wzrost populacji z zapasu). */
  magazynZywnosci: MagazynZywnosci;

  /** Lokalny magazyn surowcow. */
  magazynSurowcow: MagazynSurowcow;

  /** Kolejka produkcji (budynki i jednostki). Pierwsza pozycja = aktualnie budowana. */
  kolejkaProdukcji: ElementKolejki[];

  /**
   * Zasieg terytorium miasta w heksach (promien od centrum).
   * Ep.1 = ~10x10 pol; rosnie o +1 co epoke (maks ~20x20).
   */
  zasiegTerytorium: number;

  /** Lista aktualnie przypisanych specjalistow (jeden mieszkaniec = jeden specjalista). */
  specjalisci: Specjalista[];

  /** Budynki wybudowane w tym miescie (lista id budynkow, np. ["tartak", "spichlerz"]). */
  budynki: string[];

  /**
   * Suwak podzialu Pracy netto (budynki vs. prace w terenie).
   * Sterowany przez gracza; domyslny podzial do ustalenia w balancie.
   */
  podziałPracy: PodziałPracy;

  /**
   * Suwak podzialu Handlu netto (Nauka / Pieniadz / Luksus).
   * Suma procentow musi wynosic 100.
   */
  podziałHandlu: PodziałHandlu;
}
