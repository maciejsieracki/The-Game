/**
 * musicPrefs.ts — preferencje gracza dla muzyki proceduralnej (muzyka-antyczna.ts),
 * zapisywane w localStorage jak inne preferencje (patrz perf/hardwareProfile.ts).
 * Cicho odpuszcza, gdy localStorage jest niedostępny (tryb prywatny / file://).
 * Muzyka domyślnie WŁĄCZONA (DYSPOZYCJA-MUZYKA.md §2 pkt 4).
 */

const STORAGE_KEY = 'civ-music-prefs-v1';

export interface MusicPrefs {
  enabled: boolean;
  /** 0..1 */
  volume: number;
}

const DEFAULT_PREFS: MusicPrefs = { enabled: true, volume: 0.7 };

/** Odczyt zapisanych preferencji (lub domyślne: WŁ, 0.7). Waliduje defensywnie. */
export function loadMusicPrefs(): MusicPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<MusicPrefs> | null;
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
export function saveMusicPrefs(prefs: MusicPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}
