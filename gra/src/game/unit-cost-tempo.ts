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

/**
 * R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1 (decyzja właściciela 2026-11-19):
 * mnożnik tempa „Koszty jednostek” dla UTRZYMANIA jednostek (Pieniądz, surowce,
 * żywność). Ten sam współczynnik co dla rekrutacji (KOSZT_JEDNOSTEK_PACE), bez
 * zaokrąglania — wołający stosuje go jako ostatni czynnik łańcucha.
 * Brak / nieznana wartość = Niski (×1), czyli dawne liczby (stare zapisy).
 */
export function mnoznikUtrzymaniaJednostek(
  pace: KosztJednostekPace | number | null | undefined,
): number {
  if (typeof pace === 'number') return Number.isFinite(pace) && pace > 0 ? pace : 1;
  if (pace === 'niski' || pace === 'normalny' || pace === 'wysoki') return KOSZT_JEDNOSTEK_PACE[pace];
  return KOSZT_JEDNOSTEK_PACE.niski;
}

/**
 * Źródło tempa „Koszty jednostek" dla warstwy UI i AI (karty, HUD, planowanie).
 * main.ts rejestruje getter stanu gry (player.kosztJednostekPace) raz po starcie;
 * brak rejestracji = Niski (×1), czyli dawne liczby. Wyjątki getter-a są połykane.
 */
let _kosztJednostekPaceResolver: (() => KosztJednostekPace | undefined) | null = null;

export function setKosztJednostekPaceResolver(
  resolver: (() => KosztJednostekPace | undefined) | null,
): void {
  _kosztJednostekPaceResolver = resolver;
}

export function biezacyKosztJednostekPace(): KosztJednostekPace {
  try {
    const p = _kosztJednostekPaceResolver?.();
    return p === 'niski' || p === 'normalny' || p === 'wysoki' ? p : 'niski';
  } catch {
    return 'niski';
  }
}
