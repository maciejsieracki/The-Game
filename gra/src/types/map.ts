/**
 * map.ts
 * Struktura calej mapy swiata: wymiary, siatka heksow, seed generatora.
 */

import type { Hex } from './hex';

/**
 * Mapa swiata gry.
 * Heksy przechowywane sa jako plaska tablica indeksowana przez (q, r)
 * lub jako mapa klucz="q,r" -> Hex (wybor reprezentacji nalezy do engine'u).
 */
export interface GameMap {
  /**
   * Szerokosc mapy w heksach (os q).
   * Orientacyjne wartosci: mala = 40, srednia = 60, duza = 80.
   */
  szerokoscQ: number;

  /**
   * Wysokosc mapy w heksach (os r).
   */
  wysokoscR: number;

  /**
   * Siatka heksow — mapa klucz `"q,r"` → Hex.
   * Klucz generowany jako `${q},${r}`.
   */
  hexes: Record<string, Hex>;

  /**
   * Seed uzywany przez generator mapy (pseudolosowy).
   * Pozwala odtworzyc identyczna mape.
   */
  seed: number;

  /**
   * Uporzadkowane sciezki rzek jako sekwencje wspolrzednych heksow.
   * Kazdy wpis to jedna rzeka: tablica {q, r} od zrodla do ujscia.
   * Wypelniane przez generator mapy; logika gry moze je czytac.
   * Trasa opisuje bieg wzdłuż krawędzi (hex.rzeka.krawedzie), nie środek pola.
   */
  riverPaths: { q: number; r: number }[][];

  /**
   * main = nurt do morza (grubsza); medium/short/tributary = dopływy (cieńsze).
   * Równoległy do riverPaths — ten sam indeks.
   */
  riverPathKinds?: ('main' | 'medium' | 'short' | 'tributary')[];
}
