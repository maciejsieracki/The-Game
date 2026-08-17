/**
 * game-state.ts
 * Korzen stanu gry — pojedynczy obiekt zawierajacy caly stan rozgrywki.
 * Serializowalny do JSON (save/load).
 */

import type { GameMap }        from './map';
import type { Player }         from './player';
import type { City }           from './city';
import type { Unit }           from './unit';
import type { Army }           from './army';
import type { Turn }           from './turn';
import type { DiplomacyState, DiplomacyConfig } from './diplomacy';
import type { ResourceStock }  from './resources';

// ---------------------------------------------------------------------------
// Konfiguracja gry
// ---------------------------------------------------------------------------

/**
 * Rozmiar mapy — predefiniowane warianty.
 */
export enum RozmiarMapy {
  Maly   = 'maly',    // ~40x30 heksow
  Sredni = 'sredni',  // ~60x45 heksow
  Duzy   = 'duzy',    // ~80x60 heksow
}

/**
 * Warunek zwyciestwa gry.
 * V0.1: wyeliminuj wszystkich rywali (dominacja); pozostale — do implementacji.
 */
export enum WarunekZwyciestwa {
  Dominacja  = 'dominacja',  // wyeliminuj wszystkich rywali (zdobadz ich stolice)
  Nauka      = 'nauka',      // osiagnij okreslona epoke/technologie jako pierwszy
  Kultura    = 'kultura',    // zdobadz N punktow kultury
  Ekonomia   = 'ekonomia',   // zgromadz N Pieniadza
}

/**
 * Konfiguracja statyczna gry — ustalona przy starcie, niezmienialna w trakcie rozgrywki.
 */
export interface GameConfig {
  /** Rozmiar mapy. */
  rozmiarMapy: RozmiarMapy;

  /** Liczba cywilizacji AI na mapie (standardowo ~49 AI + 1 gracz = ~50 lacznie). */
  liczbaRywali: number;

  /** Seed generatora mapy (do replikacji rozgrywki). */
  seed: number;

  /** Aktywne warunki zwyciestwa (mozna wiecej niz jeden). */
  warunkiZwyciestwa: WarunekZwyciestwa[];

  /** Konfiguracja stalych dyplomacji (progi, mnozniki, wartosci startowe). */
  dyplomacjaConfig: DiplomacyConfig;

  /** Bazowy limit miast per cywilizacja (domyślnie 10); limit per epoka = base + (era-1)*5. / EN: base city limit per civilization (default 10); per-era limit = base + (era-1)*5. */
  cityLimitBase: number;
}

// ---------------------------------------------------------------------------
// Glowny interfejs stanu gry
// ---------------------------------------------------------------------------

/**
 * GameState — korzen calego stanu rozgrywki.
 * Jeden obiekt opisuje pelny snapshot gry w dowolnym momencie;
 * moze byc serializowany (save) i odtworzony (load).
 */
export interface GameState {
  /** Mapa swiata — wszystkie heksy. */
  map: GameMap;

  /**
   * Wszyscy gracze (czlowiek + AI).
   * Gracze wyeliminowani maja isAlive = false, ale pozostaja w tablicy.
   */
  players: Player[];

  /** Wszystkie miasta na mapie (aktywne i potencjalnie zdobyte). */
  cities: City[];

  /**
   * Wszystkie jednostki na mapie (samodzielne i nalezace do armii).
   * Jednostki w armii maja armiaId != null.
   */
  units: Unit[];

  /**
   * Wszystkie armie na mapie (stosy jednostek).
   * Armia bez jednostek powinna byc usunieta przez silnik.
   */
  armies: Army[];

  /** Globalny stan zasobow — zagregowany ze wszystkich miast i graczy (snapshot). */
  globalneZasoby: ResourceStock;

  /** Biezaca tura gry. */
  turn: Turn;

  /** Stan dyplomacji — relacje miedzy wszystkimi parami graczy. */
  dyplomacja: DiplomacyState;

  /** Statyczna konfiguracja gry (ustalona przy starcie). */
  config: GameConfig;
}
