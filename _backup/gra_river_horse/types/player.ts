/**
 * player.ts
 * Gracz (czlowiek lub AI) — tożsamosc, zasoby globalne, stan wiedzy.
 */

import type { TechState } from './tech';

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Typ cywilizacji gracza.
 * 7 glownych typow zgodnych z par. 8b/8c; pozostale = DrobnaCywilizacja.
 */
export enum TypCywilizacji {
  Grecy            = 'grecy',
  Rzymianie        = 'rzymianie',
  Chinczycy        = 'chinczycy',
  Inkowie          = 'inkowie',
  Zulusi           = 'zulusi',
  Egipt            = 'egipt',
  Babilon          = 'babilon',
  DrobnaCywilizacja = 'drobna_cywilizacja',
}

// ---------------------------------------------------------------------------
// Interfejsy
// ---------------------------------------------------------------------------

/**
 * Skarbiec gracza — Pieniadz jest globalny (zbierany centralnie w stolicy).
 * Utrata stolicy zeruje skarbiec; podboj stolicy = przejecie skarbca przez zwyciezce.
 */
export interface Skarbiec {
  /** Aktualna ilosc Pieniadza (waluta globalna, unlockowana przez tech Waluta). */
  pieniadz: number;
}

/**
 * Stan nauki gracza — scisle powiazany z TechState, ale przechowuje tez
 * globalne punkty nauki zebrane w tej turze (przed przydzialem do biezacej tech).
 */
export interface NaukaGracza {
  /** Skumulowane punkty nauki dostepne do przydzialu w tej turze. */
  punktyNauki: number;
  /** Szczegolowy stan drzewka technologicznego. */
  tech: TechState;
}

/**
 * Globalne punkty kultury gracza (suma ze wszystkich miast).
 * Odblokowanie ustrojow/polityk na poziomie panstwa.
 */
export interface KulturaGracza {
  /** Laczna skumulowana kultura panstwa (suma ze wszystkich tur i miast). */
  laczna: number;
  /** Kultura generowana przez panstwo na ture (suma ze wszystkich miast). */
  naTure: number;
}

/**
 * Gracz (czlowiek lub AI).
 */
export interface Player {
  /** Unikalny identyfikator gracza (np. UUID lub "player_0", "ai_3"). */
  id: string;

  /** Typ cywilizacji — determinuje jednostki specjalne i bonusy. */
  typCywilizacji: TypCywilizacji;

  /** Globalny skarbiec Pieniadza (scentralizowany w stolicy). */
  skarbiec: Skarbiec;

  /** Stan nauki i drzewka technologicznego. */
  nauka: NaukaGracza;

  /** Globalna kultura panstwa. */
  kultura: KulturaGracza;

  /**
   * Identyfikatory graczy, z ktorymi ten gracz utrzymuje relacje dyplomatyczne.
   * Klucz = partnerId; wartosci przechowywane sa w DiplomacyState.
   */
  relacjeDyplomacjiIds: string[];

  /** Czy ten gracz jest sterowany przez AI. */
  isAI: boolean;

  /**
   * Czy gracz nadal zyje (ma co najmniej jedno miasto).
   * false = wyeliminowany z gry.
   */
  isAlive: boolean;
}
