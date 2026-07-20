/**
 * musicPrefs.ts — preferencje gracza dla muzyki proceduralnej (muzyka-antyczna.ts),
 * zapisywane w localStorage jak inne preferencje (patrz perf/hardwareProfile.ts).
 * Cicho odpuszcza, gdy localStorage jest niedostępny (tryb prywatny / file://).
 * Muzyka domyślnie WŁĄCZONA (DYSPOZYCJA-MUZYKA.md §2 pkt 4).
 *
 * UWAGA (C-AUD-Q5=A, zgłoszenie właściciela): pole `enabled` NIE JEST już
 * trwałe. Błąd: wyciszenie muzyki przełącznikiem w menu pauzy W TRAKCIE
 * rozgrywki zapisywało się tutaj i blokowało muzykę na stałe — także w
 * nowych grach i w intro — mimo że miało dotyczyć WYŁĄCZNIE tej jednej
 * rozgrywki. Wyciszenie jest teraz ULOTNE: żyje tylko jako zmienna sesyjna
 * `musicEnabled` w main.ts, resetowana do WŁ. w startGameMusic() (i w
 * analogicznym bezpośrednim starcie bitwy-presetu) — nigdy nie trafia tu do
 * localStorage. Ten moduł zapisuje/odczytuje już TYLKO `volume` (suwak —
 * to zostaje trwałe, właściciel tego nie zgłaszał). Stare zapisy z poprzedniej
 * wersji ({enabled:false, volume:...}) są przy odczycie bezpieczne: pole
 * `enabled` po prostu nie jest już częścią typu MusicPrefs, więc jest
 * ignorowane — nie blokuje startu muzyki (wsteczna kompatybilność bez
 * migracji/czyszczenia klucza).
 */

const STORAGE_KEY = 'civ-music-prefs-v1';

export interface MusicPrefs {
  /** 0..1 */
  volume: number;
}

const DEFAULT_PREFS: MusicPrefs = { volume: 0.7 };

/** Odczyt zapisanej głośności (lub domyślna: 0.7). Waliduje defensywnie.
 *  Ewentualne stare pole `enabled` w zapisanym JSON-ie jest ignorowane —
 *  patrz komentarz na górze pliku. */
export function loadMusicPrefs(): MusicPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<MusicPrefs> | null;
    const volume = typeof parsed?.volume === 'number' && Number.isFinite(parsed.volume)
      ? Math.max(0, Math.min(1, parsed.volume))
      : DEFAULT_PREFS.volume;
    return { volume };
  } catch {
    /* prywatny tryb / brak localStorage */
    return { ...DEFAULT_PREFS };
  }
}

/** Zapis głośności. Cicho ignoruje brak localStorage. */
export function saveMusicPrefs(prefs: MusicPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}
