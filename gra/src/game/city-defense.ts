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
 * Miasto z Murami+Cytadela+Baszta = 200+100+100 = 400%. DECYZJA 54a (Maciej
 * 2026-07-25): Baszta wymaga wybudowanych Murow W TYM SAMYM MIESCIE, zanim da
 * sie ja postawic -- prerekwyzyt KOLEJNOSCI BUDOWY, egzekwowany w
 * CITY_BUILDING_PREREQ (building-resource-gate.ts) / production.ts, NIE w tej
 * funkcji. Ta funkcja liczy WYLACZNIE bonus procentowy z budynkow juz stojacych
 * w miescie -- skoro Baszta nie moglaby dzis stac bez Murow, kombinacja "sama
 * Baszta bez Murow" jest juz nieosiagalna przez budowanie, ale funkcja zostaje
 * odporna na stare zapisy (patrz `builtBuildingIds` nizej): gdyby w danych
 * zapisu Baszta byla obecna bez Murow, dostaje WYLACZNIE swoj wlasny
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

import { normTerrain, terrainDefenseMultiplier } from './combat';
import type { TerrainEntry } from './combat';

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

/**
 * cityGatedTerrainMultiplier (C-COMBAT-Q2, Maciej 2026-07-26 -- decyzja
 * "bonus terenu przy obronie MIASTA dolicza sie WYLACZNIE gdy miasto ma mur"):
 *
 * Zwraca mnoznik terenu dla obrony MIASTA, gated na dwa warunki jednoczesnie:
 *   1. Miasto MUSI miec budynek obronny (Mury / Cytadela / Baszta) -- `hasMur`
 *      (dowolny z trzech, patrz cityWallDefenseBonusPercent powyzej > 0).
 *      Miasto BEZ zadnego z nich -> zawsze 1.0 (brak bonusu), niezaleznie od
 *      terenu -- uzasadnienie wlasciciela: jednostki miasta bez murow wychodza
 *      w pole i biją sie na plaskim gruncie, wiec wzgorze pod miastem nie ma
 *      czego chronic.
 *   2. Z terenow liczy sie WYLACZNIE wzniesienie (Wzgorza; teoretycznie Gory,
 *      choc miasta nie da sie na nich zalozyc) -- Las, Rzeka i pozostale
 *      tereny NIE dodaja nic do obrony miasta, nawet z murem. Wartosc dla
 *      wzniesienia to DOKLADNIE terrainDefenseMultiplier() (1.5 Wzgorza /
 *      1.75 Gory) -- ta sama liczba co bitwa w polu, tylko GATED (patrz #1)
 *      i zawezona do elewacji (patrz #2).
 *
 * WAZNE -- kombinacja z bonusem strukturalnym (mur/Cytadela/Baszta) jest
 * ADDYTYWNA w punktach procentowych (Razem = Bonus_strukturalny% +
 * Bonus_terenu%), NIE mnozona -- patrz tabela w zadaniu (Mury+wzgorze:
 * 200%+50%=250%, NIE 200%*150%=350%). Wywolujacy MUSI wiec kombinowac wynik
 * tej funkcji jako `(cityGatedTerrainMultiplier(...) - 1) * 100` procentowych
 * punktow DODANYCH do structBonusPct -- NIE jako dodatkowy mnoznik obok
 * structMult (tak jak dzieje sie to dzis dla bitwy w polu, ktora zostaje BEZ
 * ZMIAN -- tam teren i struktura (fort/posterunek) nadal MNOZA sie, patrz
 * main.ts effectiveDefenderM galaz "bitwa w polu").
 *
 * Bitwy w polu (poza miastem) NIE wolaja tej funkcji w ogole -- zachowuja
 * pelny, niegated terrainDefenseMultiplier() (las/wzgorze/brod dzialaja jak
 * dzis). Ta funkcja jest wolana WYLACZNIE ze sciezek obrony MIASTA (Auto --
 * main.ts effectiveDefenderM + mapFieldBattle.ts duplikat; taktyczna --
 * battleScene.ts _singleBlow; "Pomin" -- battleScene.ts computeInstantResult).
 *
 * PARYTET AI: czysta funkcja bez ownerId -- identyczna dla gracza i AI.
 */
export function cityGatedTerrainMultiplier(
  hasMur: boolean,
  terrain: string,
  terrainData: readonly TerrainEntry[],
): number {
  if (!hasMur) return 1.0;
  const terrNorm = normTerrain(terrain);
  const isElevation = terrNorm.includes('wzg') || terrNorm.includes('gor');
  if (!isElevation) return 1.0;
  return terrainDefenseMultiplier(terrain, '', terrainData as TerrainEntry[]);
}

/**
 * fieldFortifyDefenseBonus (Maciej 2026-07-26, dyspozycja "oblężenie +
 * fortyfikacja w polu"): dolicza flat bonus Obrony (combat-params.json
 * "oblężenie".fortify_obrona_bonus, dziś 2 pkt Obrony) do jednostce oznaczonej
 * RuntimeUnit.ufortyfikowanyWPolu=true -- OSOBNE od garnizonu miasta/muru
 * (powyżej w tym pliku), ożywia parametr dotąd czytany WYŁĄCZNIE przez
 * siegeAi.ts do oceny siły AI, nigdy w realnej walce (patrz raport zadania).
 *
 * Zwraca Obronę PO dodaniu bonusu, PRZED mnożnikiem terenu/muru -- wołający
 * MUSI pomnożyć wynik przez własny mnożnik terenu osobno (dokładnie tak jak
 * game/siege.ts cityDefenseBonus/applyCityBonus robi to dla garnizonu miasta:
 * `(Obrona + obronaBonus) * terrainMult` -- ZERO nowej matematyki, ten sam
 * wzorzec: bonus fortyfikacji SKALUJE się razem z terenem, tak jak baza Obrony).
 * Działa WYŁĄCZNIE na Obronie (nigdy Atak) -- jak bonus muru (C-COMBAT-Q1).
 *
 * Wołane z TRZECH miejsc (parytet ze wzorem muru/cityGatedTerrainMultiplier
 * powyżej): main.ts effectiveDefenderM (Auto-walka mocą), battleScene.ts
 * _singleBlow (bitwa taktyczna), battleScene.ts computeInstantResult ("Pomiń").
 *
 * PARYTET AI: czysta funkcja, ownerId-agnostyczna -- identyczny bonus dla
 * gracza i AI, gdy tylko flaga jest ustawiona (choć AI dziś NIE PODEJMUJE
 * decyzji o wejściu w ten stan -- brak logiki w ai.ts/siegeAi.ts, patrz raport).
 */
export function fieldFortifyDefenseBonus(
  baseObrona: number,
  isFortifiedInField: boolean,
  fortifyObronaBonus: number,
): number {
  return isFortifiedInField ? baseObrona + fortifyObronaBonus : baseObrona;
}
