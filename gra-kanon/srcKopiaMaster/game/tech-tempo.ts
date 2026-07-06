/**
 * tech-tempo.ts
 * Globalny mnoznik tempa gry dla kosztow badan technologicznych.
 *
 * Uzywanie:
 *   SILNIK: przy starcie gry gracz wybiera tempo (szybka/standardowa/dluga).
 *   Wybrane tempo zapisuje sie w stanie gry (np. GameData.tempoGry: TempoGry).
 *   UI/SILNIK wywoluja applyTempoKoszt(tech.koszt, gameData.tempoGry) dla KAZDEJ
 *   technologii przed wyswietleniem kosztu i przed sprawdzeniem, czy badanie jest
 *   skonczoe. NIE zmienia to bazowych kosztow w tech.json -- te sluza jako punkt
 *   odniesienia dla trybu "standardowa" (x1.0).
 *
 * Przyklad:
 *   applyTempoKoszt(100, 'szybka')     // => 20   (round(100 * 0.2))
 *   applyTempoKoszt(100, 'standardowa')// => 100  (round(100 * 1.0))
 *   applyTempoKoszt(100, 'dluga')      // => 500  (round(100 * 5.0))
 *   applyTempoKoszt(3, 'szybka')       // => 1    (round(3 * 0.2) = 1; min 1)
 *   applyTempoKoszt(50, 2.5)           // => 125  (mnoznik liczbowy)
 */

export const TEMPO_GRY = {
  szybka: 0.2,
  standardowa: 1.0,
  dluga: 5.0,
} as const;

export type TempoGry = keyof typeof TEMPO_GRY;

/**
 * Zwraca rzeczywisty koszt badan po zastosowaniu mnoznika tempa gry.
 *
 * @param bazowyKoszt  Pole "Koszt nauki" z tech.json (bazowe, dla trybu standardowego).
 * @param tempo        Klucz TempoGry ('szybka'|'standardowa'|'dluga') lub mnoznik liczbowy.
 * @returns            Math.round(bazowyKoszt * mnoznik), minimum 1.
 */
export function applyTempoKoszt(bazowyKoszt: number, tempo: TempoGry | number): number {
  const mnoznik = typeof tempo === 'number' ? tempo : TEMPO_GRY[tempo];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}
