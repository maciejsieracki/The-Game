/**
 * R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1 -- ostrzeżenie w oknie przed bitwą
 * (preBattle) o osłabieniu jednostek strony przez głód wojska i/lub deficyt Złota.
 *
 * TYLKO WYŚWIETLANIE. Kara (×mnożnik na staty bojowe bez pancerza) jest nakładana
 * przez silnik (combat.ts, runtimeToBattleUnit); ta funkcja jedynie składa tekst
 * z tych samych wartości, które silnik dostaje z econ-params:
 *   - glodWojskaMult  = buildEmpireFoodParams(...).glodWojskaStatMult
 *   - zlotoDeficytMult = buildGoldDeficitParams(...).zlotoDeficytStatMult
 * Żadnej liczby nie wpisujemy na sztywno -- procent liczony z mnożnika.
 *
 * Czysta funkcja (bez DOM/main.ts), testowalna przez gra/tools/prebattle-weakened-warning-test.cjs.
 */

export interface WeakenedNoteInput {
  /** Strona ma co najmniej jedną walczącą (nie-cywilną) jednostkę i głód wojska (isArmyHungry). */
  hungry: boolean;
  /** Strona ma co najmniej jedną walczącą jednostkę i deficyt Złota (isGoldDeficit). */
  goldDeficit: boolean;
  /** Mnożnik statów bojowych (bez pancerza) przy głodzie -- econ-params glod_wojska_stat_mult. */
  glodWojskaMult: number;
  /** Mnożnik statów bojowych (bez pancerza) przy deficycie -- econ-params zloto_deficyt_stat_mult. */
  zlotoDeficytMult: number;
  /** Barbarzyńcy nigdy nie są osłabiani tą karą (ochrona także po stronie wywołującego). */
  barbarian: boolean;
}

/** Wynik dla okna preBattle: tylko aktywne kary (undefined = brak ostrzeżenia). */
export interface WeakenedNote {
  glodWojskaMult?: number;
  zlotoDeficytMult?: number;
}

/** Zwraca notatkę tylko wtedy, gdy strona faktycznie ma którąkolwiek karę. */
export function buildWeakenedNote(input: WeakenedNoteInput): WeakenedNote | undefined {
  if (input.barbarian) return undefined;
  const hungry = input.hungry && isValidMult(input.glodWojskaMult);
  const deficit = input.goldDeficit && isValidMult(input.zlotoDeficytMult);
  if (!hungry && !deficit) return undefined;
  return {
    glodWojskaMult: hungry ? input.glodWojskaMult : undefined,
    zlotoDeficytMult: deficit ? input.zlotoDeficytMult : undefined,
  };
}

/** Procent kary z mnożnika: 0,75 -> 25. */
export function weakenedPercent(mult: number): number {
  return Math.round((1 - mult) * 100);
}

/**
 * Tekst ostrzeżenia po polsku, bez surowych ID, np.
 * "Osłabieni: głód wojska −25% (poza pancerzem)" lub
 * "Osłabieni: głód wojska −25%, deficyt złota −25% (poza pancerzem)".
 * Brak kary -> pusty string (okno nie pokazuje nic).
 */
export function weakenedNoteText(note: WeakenedNote | undefined): string {
  if (!note) return '';
  const parts: string[] = [];
  if (note.glodWojskaMult !== undefined) {
    parts.push('głód wojska −' + String(weakenedPercent(note.glodWojskaMult)) + '%');
  }
  if (note.zlotoDeficytMult !== undefined) {
    parts.push('deficyt złota −' + String(weakenedPercent(note.zlotoDeficytMult)) + '%');
  }
  if (!parts.length) return '';
  return 'Osłabieni: ' + parts.join(', ') + ' (poza pancerzem)';
}

function isValidMult(m: number): boolean {
  return typeof m === 'number' && Number.isFinite(m) && m > 0 && m < 1;
}
