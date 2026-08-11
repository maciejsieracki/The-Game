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
 *  - brak / niepoprawny KSZTALT mapSnapshot (stary zapis sprzed tej naprawy,
 *    brakujace pole, zla struktura -- `isValidMapSnapshot` zwraca false) ->
 *    dokladnie dzisiejsze zachowanie: `genFn()` regeneruje mape z
 *    `saved.seed` -- zero zmian dla starych zapisow (wsteczna kompatybilnosc).
 *    Ta sciezka NIE ulega zmianie ponizsza decyzja.
 *  - mapSnapshot przechodzi `isValidMapSnapshot` (ksztalt/typy OK), ale
 *    `buildGameMapFromSnapshot` mimo to rzuca (np. uszkodzony/niespojny
 *    indeks do `dict`) -> TWARDY BLAD: wyjatek propaguje sie NIEZLAPANY do
 *    wywolujacego (main.ts::regenerateWorldForLoad, ktory go lapie i woła
 *    `diagError('load', ...)`, przerywajac wczytywanie z czytelnym
 *    komunikatem i wracajac do menu). Brak fallbacku na generator w tym
 *    przypadku -- decyzja wlasciciela (Maciej, 2026-08-11, N1), przywraca
 *    zachowanie sprzed rundy 3: cichy fallback na inna mape (bez ulepszen/
 *    wlascicieli/wiosek/widocznosci zbudowanych w trakcie gry, zero
 *    komunikatu dla gracza) uznano za gorsze niz twardy blad.
 * / EN: shape-invalid/missing snapshot still falls back to the generator
 * (unchanged, backward compatible). A shape-VALID snapshot whose build still
 * throws is now a hard error -- the exception propagates unhandled to the
 * caller (main.ts::regenerateWorldForLoad, which catches it and calls
 * diagError('load', ...), aborting the load with a readable message and
 * returning to the main menu) instead of silently falling back to a
 * regenerated, different map. Owner decision (Maciej, 2026-08-11, N1):
 * restores pre-round-3 behavior.
 */
export async function loadMapForSave<TMap extends GameMap>(
  saved: SaveGame,
  genFn: () => Promise<TMap>,
): Promise<LoadMapSourceResult<TMap>> {
  if (isValidMapSnapshot(saved.mapSnapshot)) {
    return { map: buildGameMapFromSnapshot(saved.mapSnapshot) as TMap, usedSnapshot: true };
  }
  return { map: await genFn(), usedSnapshot: false };
}
