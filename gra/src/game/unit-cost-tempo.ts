/**
 * unit-cost-tempo.ts
 * Globalny mnoznik kosztow rekrutacji jednostek (Pieniadz) wybrany w kreatorze.
 *
 * Uzywanie:
 *   Gracz wybiera Koszty jednostek (Niski/Normalny/Wysoki) w zaawansowanych opcjach.
 *   Wartosc zapisuje sie w stanie gry (player.kosztJednostekPace).
 *   production.ts wywoluje applyUnitCostPace() po ulgach cywilizacji.
 *   NIE zmienia kosztow w units.json — to tryb Niski (x1.0).
 *
 * Maciej 2026-07-07: wartosci z units.json = Niski; Normalny x2, Wysoki x4.
 *
 * Przyklad (Wojownik, bazowy koszt 10 zlota):
 *   applyUnitCostPace(10, 'niski')     // => 10
 *   applyUnitCostPace(10, 'normalny')  // => 20
 *   applyUnitCostPace(10, 'wysoki')    // => 40
 */

export const KOSZT_JEDNOSTEK_PACE = {
  niski: 1.0,
  normalny: 2.0,
  wysoki: 4.0,
} as const;

export type KosztJednostekPace = keyof typeof KOSZT_JEDNOSTEK_PACE;

/**
 * Zwraca koszt rekrutacji jednostki po zastosowaniu mnoznika tempa kosztow.
 *
 * @param bazowyKoszt  Koszt po ulgach cywilizacji (lub bazowy z units.json).
 * @param pace         Klucz KosztJednostekPace lub mnoznik liczbowy.
 */
export function applyUnitCostPace(
  bazowyKoszt: number,
  pace: KosztJednostekPace | number,
): number {
  const mnoznik = typeof pace === 'number' ? pace : KOSZT_JEDNOSTEK_PACE[pace];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}
