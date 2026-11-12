/**
 * hit-mode.ts — ustawienie „Trafienia: losowe / pewne” (R-WEB-BATTLE-HIT-MODE-SETTING-Q1).
 *
 * - 'losowe' (domyślne dla starych zapisów i brak pola): zachowanie dokładnie jak dotąd
 *   (rzut na każde uderzenie, upset 20% w AUTO przy stosunku sił < 1,15).
 * - 'pewne' (domyślne dla NOWYCH gier z kreatora): każde uderzenie trafia bez rzutu,
 *   obrona działa wyłącznie przez pancerz w obrażeniach; w AUTO brak upsetu.
 *
 * Wartości progów (UPSET_R_THRESHOLD, UPSET_CHANCE, progi trafienia) są NIEZMIENNE.
 * Stan aktywny jest ustawiany przy starcie/wczytaniu gry (main.ts); domyślnie 'losowe',
 * więc testy i ścieżki bez gry zachowują dotychczasowe zachowanie.
 */

export type HitMode = 'losowe' | 'pewne';

/** Normalizacja pola z zapisu/kreatora: brak lub nieznana wartość = 'losowe'. */
export function normalizeHitMode(raw: unknown): HitMode {
  return raw === 'pewne' ? 'pewne' : 'losowe';
}

let activeHitMode: HitMode = 'losowe';

export function setActiveHitMode(mode: HitMode | undefined): void {
  activeHitMode = normalizeHitMode(mode);
}

export function getActiveHitMode(): HitMode {
  return activeHitMode;
}

/** true = trafienia pewne (bez rzutu, brak upsetu w AUTO). */
export function isCertainHitMode(): boolean {
  return activeHitMode === 'pewne';
}
