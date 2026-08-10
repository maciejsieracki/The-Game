/**
 * load-map-source.ts
 * Decyzja "wołać generator, czy zbudować mapę ze snapshotu zapisu" — wydzielona
 * jako czysta funkcja (bez DOM/THREE), żeby dało się ją przetestować w
 * izolacji (main.ts nie da się zbundlować samodzielnie — cały silnik gry/DOM).
 * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Maciej, ECHO A).
 * / EN: pure decision "call the generator, or build the map from the save's
 * snapshot" — extracted so it is unit-testable without DOM/THREE (main.ts
 * cannot be bundled standalone).
 */
import type { GameMap } from '../types/map';
import type { SaveGame } from './save';
import { buildGameMapFromSnapshot, isValidMapSnapshot } from '../map/mapSnapshot';

export interface LoadMapSourceResult<TMap extends GameMap> {
  map: TMap;
  /** true = mapa odtworzona ze snapshotu zapisu (generator NIE zostal wywolany). */
  usedSnapshot: boolean;
}

/**
 * Zwraca mape do wczytania zapisu.
 *  - saved.mapSnapshot poprawny (nowy format, SAVE z pelna siatka) -> buduje
 *    mape wprost ze snapshotu; `genFn` (generujSwiatAsync) NIE jest wolane.
 *  - brak / niepoprawny mapSnapshot (stary zapis sprzed tej naprawy) ->
 *    dokladnie dzisiejsze zachowanie: `genFn()` regeneruje mape z
 *    `saved.seed` -- zero zmian dla starych zapisow (wsteczna kompatybilnosc).
 *  - mapSnapshot przechodzi `isValidMapSnapshot` (ksztalt/typy OK), ale
 *    `buildGameMapFromSnapshot` mimo to rzuca (np. uszkodzony/niespojny
 *    indeks do `dict`, runda 3, Evaluator) -> traktujemy identycznie jak
 *    niepoprawny snapshot: fallback na `genFn()`, `usedSnapshot: false`.
 *    Bez tego wyjatek z budowania mapy leciałby nieobsluzony do wywolujacego
 *    zamiast spasc na generator.
 * / EN: same fallback contract, now also covering the case where the
 * snapshot passes shape validation but `buildGameMapFromSnapshot` still
 * throws (corrupted/inconsistent dict index) -- caught and treated exactly
 * like an invalid snapshot instead of propagating unhandled.
 */
export async function loadMapForSave<TMap extends GameMap>(
  saved: SaveGame,
  genFn: () => Promise<TMap>,
): Promise<LoadMapSourceResult<TMap>> {
  if (isValidMapSnapshot(saved.mapSnapshot)) {
    try {
      return { map: buildGameMapFromSnapshot(saved.mapSnapshot) as TMap, usedSnapshot: true };
    } catch {
      /* uszkodzony snapshot mimo poprawnego ksztaltu -- spadamy na generator,
         jak przy braku/niepoprawnym mapSnapshot / corrupted snapshot despite
         valid shape -- fall through to the generator, same as a missing or
         invalid mapSnapshot */
    }
  }
  return { map: await genFn(), usedSnapshot: false };
}
