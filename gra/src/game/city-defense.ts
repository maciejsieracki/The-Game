/**
 * city-defense.ts
 *
 * Bonus procentowy Obrony miasta z budowli obronnych (Mury, Cytadela, Baszta)
 * -- WYLACZNIE procentowy, data-driven z miasto-params.json (Maciej 2026-07-25,
 * decyzja 41B -- Baszta jako trzeci, niezalezny budynek obronny).
 *
 * Trzy warstwy, ADDYTYWNE (nie mnozone), zadna nie zastepuje pozostalych
 * (upgradeFrom brak dla wszystkich trzech -- "w bok", nie "w gore"):
 *   Mury     +bonus_obrona_mur_proc%      -- baza, odblokowana przez KAZDA
 *                                            z trzech budowli obronnych (Mury,
 *                                            Cytadela lub Baszta) obecna w miescie
 *   Cytadela +bonus_obrona_cytadela_proc%  -- dodatkowo, gdy budynek 'fort' obecny
 *   Baszta   +bonus_obrona_baszta_proc%    -- dodatkowo, gdy budynek 'baszta' obecny
 *
 * Miasto z Murami+Cytadela+Baszta = 200+100+100 = 400%. Miasto z SAMA Baszta
 * (bez Murow/Cytadeli -- Baszta nie ma wymogu budowy innej budowli obronnej,
 * patrz buildings.json "baszta".wymagania) dostaje WYLACZNIE swoj wlasny
 * bonus_obrona_baszta_proc (baza "mur" NIE aktywuje sie bez realnych Murow lub
 * Cytadeli -- inaczej Baszta bylaby "tanszym Murem", co nie bylo intencja).
 *
 * Jedna czysta funkcja (bez zaleznosci od City/mapy/silnika) uzywana przez
 * main.ts (structureDefenseBonusFor -- instant/auto-battle na mapie swiata)
 * ORAZ battle/battleScene.ts (onWallWalkway -- interaktywna bitwa/oblezenie),
 * zeby oba tryby liczyly identyczna liczbe (PARYTET, ownerId-agnostyczne).
 * Przed Baszta ta sama arytmetyka byla PRZEPISANA osobno w obu miejscach --
 * trzecia warstwa byla dobrym momentem na scalenie w jeden, testowalny modul.
 */

export interface CityDefenseBonusParams {
  /** bonus_obrona_mur_proc (miasto-params.json) -- baza, zwykle 200. */
  mur: number;
  /** bonus_obrona_cytadela_proc (miasto-params.json) -- dodatkowo z Cytadela, zwykle 100. */
  cytadela: number;
  /** bonus_obrona_baszta_proc (miasto-params.json) -- dodatkowo z Baszta, zwykle 100. */
  baszta: number;
}

/**
 * `builtBuildingIds` to lista budynkow FIZYCZNIE obecnych w miescie
 * (City.cityBuilt, PO podmianach upgrade'owych) -- id, nie nazwy. Zwraca %
 * (np. 400 = +400%), nie ulamek. Puste/brakujace dane => 0 (bez wyjatku --
 * bezpieczne dla starych zapisow gry sprzed Baszty/Cytadeli).
 */
export function cityWallDefenseBonusPercent(
  builtBuildingIds: readonly string[] | null | undefined,
  params: CityDefenseBonusParams,
): number {
  const built = builtBuildingIds ?? [];
  const hasMury = built.includes('mury');
  const hasFort = built.includes('fort');
  const hasBaszta = built.includes('baszta');

  let total = 0;
  if (hasMury || hasFort) {
    total += params.mur;
    if (hasFort) total += params.cytadela;
  }
  if (hasBaszta) total += params.baszta;
  return total;
}
