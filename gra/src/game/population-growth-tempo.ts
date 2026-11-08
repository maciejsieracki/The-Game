/**
 * population-growth-tempo.ts
 * Globalny mnoznik progu wzrostu ludnosci (zywnosc w buforze na +1 mieszkanca).
 *
 * Uzywanie:
 *   Gracz wybiera Wzrost ludnosci (Wysoki/Normalny/Wolny) w zaawansowanych opcjach kreatora.
 *   Wartosc zapisuje sie w stanie gry (player.wzrostLudnosciPace).
 *   economy.ts / turn-economy.ts wywoluja applyGrowthThresholdPace() na progu 20 + N × wsp.
 *   NIE dotyka cap Akweduktu (5/15) — tylko koszt wzrostu w buforze zywnosci.
 *
 * Maciej 2026-07-07: bazowy prog (Wysoki) = x1; Normalny x2; Wolny x4.
 * Dotyczy wszystkich graczy rowno (globalne tempo rozgrywki).
 *
 * Przyklad (pop 3 → 4, normal difficulty, wsp=16):
 *   bazowy prog = 20 + 3×16 = 68
 *   applyGrowthThresholdPace(68, 'wysoki')    // => 68
 *   applyGrowthThresholdPace(68, 'normalny')   // => 136
 *   applyGrowthThresholdPace(68, 'wolny')      // => 272
 */

export const WZROST_LUDNOSCI_PACE = {
  wysoki: 1.0,
  normalny: 2.0,
  wolny: 4.0,
} as const;

export type WzrostLudnosciPace = keyof typeof WZROST_LUDNOSCI_PACE;

/**
 * Zwraca prog bufora wzrostu po zastosowaniu tempa z kreatora.
 *
 * @param bazowyProg  20 + N × progWzrostuWspolczynnik (bez mnoznika tempa).
 * @param pace        Klucz WzrostLudnosciPace lub mnoznik liczbowy.
 */
export function applyGrowthThresholdPace(
  bazowyProg: number,
  pace: WzrostLudnosciPace | number,
): number {
  const mnoznik = typeof pace === 'number' ? pace : WZROST_LUDNOSCI_PACE[pace];
  return Math.max(1, Math.round(bazowyProg * mnoznik));
}
