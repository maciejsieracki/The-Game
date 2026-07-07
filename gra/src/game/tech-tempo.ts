/**
 * tech-tempo.ts
 * Globalny mnoznik tempa gry dla kosztow badan technologicznych.
 *
 * Uzywanie:
 *   SILNIK: przy starcie gry gracz wybiera tempo (szybka/standardowa/dluga).
 *   Wybrane tempo zapisuje sie w stanie gry (np. GameData.tempoGry: TempoGry).
 *   UI/SILNIK wywoluja applyTempoKoszt(tech.koszt, gameData.tempoGry) dla KAZDEJ
 *   technologii przed wyswietleniem kosztu i przed sprawdzeniem, czy badanie jest
 *   skonczoe. NIE zmienia to bazowych kosztow w tech.json — to tryb szybki (x1.0).
 *
 * Maciej 2026-07-07: wartosci z tech.json = tempo szybkie; normalne x2, dlugie x4.
 *
 * Przyklad (Obróbka drewna, bazowy koszt 12 PN):
 *   applyTempoKoszt(12, 'szybka')      // => 12  (round(12 * 1.0))
 *   applyTempoKoszt(12, 'standardowa') // => 24  (round(12 * 2.0))
 *   applyTempoKoszt(12, 'dluga')       // => 48  (round(12 * 4.0))
 *   applyTempoKoszt(1, 'dluga')        // => 4   (min 1 po zaokragleniu)
 *   applyTempoKoszt(50, 2.5)           // => 125  (mnoznik liczbowy)
 */

export const TEMPO_GRY = {
  szybka: 1.0,
  standardowa: 2.0,
  dluga: 4.0,
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
