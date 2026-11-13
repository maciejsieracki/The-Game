/**
 * fog-reveal-key-f.ts — R-WEB-SETTINGS-FOG-REVEAL-KEY-F-OPTION-Q1 (właściciel).
 *
 * Opcja nowej gry „Odkrywanie mapy klawiszem F (tryb testowy)”. Klawisz F
 * (pełne odkrycie / wyłączenie mgły wojny) działa WYŁĄCZNIE gdy opcja jest
 * włączona. DOMYŚLNIE WYŁĄCZONA (funkcja testowa; sama obecność opcji w
 * ustawieniach = zgoda gracza). Opcja dotyczy wyłącznie skrótu klawiatury
 * i NIE wpływa na AI ani na mechanikę tury.
 *
 * Zgodność wsteczna: nowa gra bez pola = wyłączona; zapis bez pola = wyłączona.
 * / EN: "Reveal map with F (test mode)" new-game option; default OFF; affects
 * only the F keyboard shortcut, never the AI or turn mechanics.
 */

/** Wartość domyślna opcji (nowa gra, zapis bez pola). */
export const FOG_REVEAL_KEY_F_DEFAULT = false;

/** Odczyt z parametrów nowej gry: brak pola / nie-boolean = wyłączona. */
export function fogRevealKeyFFromNewGameParam(raw: unknown): boolean {
  return typeof raw === 'boolean' ? raw : FOG_REVEAL_KEY_F_DEFAULT;
}

/** Odczyt z meta zapisu: brak pola / nie-boolean = wyłączona. */
export function fogRevealKeyFFromSaveMeta(raw: unknown): boolean {
  return raw === true;
}

/** Czy klawisz F ma odkrywać/wyłączać mgłę. Opcja wyłączona => klawisz nic nie robi. */
export function isFogRevealKeyFActive(enabled: boolean): boolean {
  return enabled === true;
}
