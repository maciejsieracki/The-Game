/**
 * ruch-swiata-tempo.ts
 * Globalny mnoznik zasiegu ruchu jednostek NA MAPIE SWIATA (kreator nowej gry).
 *
 * Uzywanie:
 *   Gracz wybiera Zasieg ruchu (Krotki/Normalny/Dlugi) w zaawansowanych opcjach kreatora.
 *   Wartosc zapisuje sie w stanie gry (player.ruchSwiataPace).
 *   Mnoznik aplikowany do pola "Ruch" z units.json WYLACZNIE PRZY TWORZENIU jednostki
 *   (spawn) — RuntimeUnit.ruch niesie juz przemnozona wartosc, wiec reset tury
 *   (ruchLeft = ruch), planowanie trasy i HUD dziedzicza mnoznik bez dodatkowej logiki.
 *   NIE dotyka pola "Ruch w bitwie" ani gra/src/battle/mapFieldBattle.ts — to osobny
 *   system (ruch wewnatrz sceny bitwy), celowo nietkniety.
 *
 * Maciej 2026-08-13: Krotki x1 (bez zmian, domyslny — kompatybilnosc wsteczna ze
 * starymi zapisami bez tego pola), Normalny x3, Dlugi x6.
 *
 * Przyklad (Hastati, bazowy "Ruch" z units.json = 2):
 *   applyRuchSwiataPace(2, 'krotki')     // => 2
 *   applyRuchSwiataPace(2, 'normalny')   // => 6
 *   applyRuchSwiataPace(2, 'dlugi')      // => 12
 */

export const RUCH_SWIATA_PACE = {
  krotki: 1,
  normalny: 3,
  dlugi: 6,
} as const;

export type RuchSwiataPace = keyof typeof RUCH_SWIATA_PACE;

/**
 * Zwraca zasieg ruchu jednostki na mapie swiata po zastosowaniu mnoznika tempa z kreatora.
 *
 * @param bazowyRuch  Wartosc pola "Ruch" z units.json (juz po normFieldVal, przed mnoznikiem).
 * @param pace         Klucz RuchSwiataPace lub mnoznik liczbowy.
 */
export function applyRuchSwiataPace(
  bazowyRuch: number,
  pace: RuchSwiataPace | number,
): number {
  const mnoznik = typeof pace === 'number' ? pace : RUCH_SWIATA_PACE[pace];
  return Math.max(1, Math.round(bazowyRuch * mnoznik));
}
