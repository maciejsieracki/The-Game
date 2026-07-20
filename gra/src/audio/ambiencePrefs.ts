/**
 * ambiencePrefs.ts — preferencje gracza dla TRZECIEGO, niezależnego kanału
 * audio: odgłosy natury (ambience.ts). Zapisywane w localStorage OSOBNO od
 * muzyki (musicPrefs.ts, klucz 'civ-music-prefs-v1') — pod własnym kluczem
 * 'civ-ambience-prefs-v1', żeby nie dotykać ani formatu, ani wartości już
 * zapisanych preferencji muzyki u graczy (wsteczna kompatybilność).
 * Struktura i defensywna walidacja identyczne jak w musicPrefs.ts — celowo,
 * to ta sama rodzina "prosty przełącznik + suwak w localStorage".
 * Cicho odpuszcza, gdy localStorage jest niedostępny (tryb prywatny / file://).
 * Odgłosy natury domyślnie WŁĄCZONE (spójność z domyślnym stanem muzyki) —
 * katalog utwory/natura/ i tak startuje pusty, więc efektywnie cisza, dopóki
 * właściciel nie doda plików.
 */

const STORAGE_KEY = 'civ-ambience-prefs-v1';

export interface AmbiencePrefs {
  enabled: boolean;
  /** 0..1 */
  volume: number;
}

const DEFAULT_PREFS: AmbiencePrefs = { enabled: true, volume: 0.7 };

/** Odczyt zapisanych preferencji (lub domyślne: WŁ, 0.7). Waliduje defensywnie. */
export function loadAmbiencePrefs(): AmbiencePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<AmbiencePrefs> | null;
    const enabled = typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_PREFS.enabled;
    const volume = typeof parsed?.volume === 'number' && Number.isFinite(parsed.volume)
      ? Math.max(0, Math.min(1, parsed.volume))
      : DEFAULT_PREFS.volume;
    return { enabled, volume };
  } catch {
    /* prywatny tryb / brak localStorage */
    return { ...DEFAULT_PREFS };
  }
}

/** Zapis preferencji. Cicho ignoruje brak localStorage. */
export function saveAmbiencePrefs(prefs: AmbiencePrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}
