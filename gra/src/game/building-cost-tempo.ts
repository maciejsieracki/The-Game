/**
 * building-cost-tempo.ts
 * Globalny mnoznik kosztow budynkow (Praca) wybrany w kreatorze nowej gry.
 *
 * Uzywanie:
 *   Gracz wybiera Koszty budynkow (Niski/Normalny/Wysoki) w zaawansowanych opcjach.
 *   Wartosc zapisuje sie w stanie gry (player.buildingCostPace).
 *   production.ts wywoluje applyBuildingCostPace() po ulgach cywilizacji.
 *   NIE zmienia kosztow w buildings.json — to tryb Niski (x1.0).
 *
 * Maciej 2026-07-07: wartosci z buildings.json = Niski; Normalny x2, Wysoki x4.
 *
 * Przyklad (Swiatynia, bazowy koszt 25 Pracy):
 *   applyBuildingCostPace(25, 'niski')     // => 25
 *   applyBuildingCostPace(25, 'normalny')  // => 50
 *   applyBuildingCostPace(25, 'wysoki')    // => 100
 */

export const KOSZT_BUDYNKOW_PACE = {
  niski: 1.0,
  normalny: 2.0,
  wysoki: 4.0,
} as const;

export type BuildingCostPace = keyof typeof KOSZT_BUDYNKOW_PACE;

/**
 * Zwraca koszt Pracy budynku po zastosowaniu mnoznika tempa kosztow.
 *
 * @param bazowyKoszt  Koszt po itemCost() i ewentualnej ulgi cywilizacji.
 * @param pace         Klucz BuildingCostPace lub mnoznik liczbowy.
 */
export function applyBuildingCostPace(
  bazowyKoszt: number,
  pace: BuildingCostPace | number,
): number {
  const mnoznik = typeof pace === 'number' ? pace : KOSZT_BUDYNKOW_PACE[pace];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}
