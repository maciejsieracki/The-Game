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
 *
 * UWAGA (TEMAT #9, ten sam błąd co C-AUD-Q5=A w musicPrefs.ts): pole
 * `enabled` NIE JEST już trwałe. Błąd: wyciszenie odgłosów natury
 * przełącznikiem w menu pauzy W TRAKCIE rozgrywki zapisywało się tutaj i
 * blokowało odgłosy na stałe — także w nowych grach — mimo że miało
 * dotyczyć WYŁĄCZNIE tej jednej rozgrywki. Wyciszenie jest teraz ULOTNE:
 * żyje tylko jako zmienna sesyjna `ambienceEnabled` w main.ts, resetowana
 * do WŁ. w startGameMusic() — nigdy nie trafia tu do localStorage. Ten
 * moduł zapisuje/odczytuje już TYLKO `volume` (suwak — to zostaje trwałe,
 * właściciel tego nie zgłaszał). Stare zapisy z poprzedniej wersji
 * ({enabled:false, volume:...}) są przy odczycie bezpieczne: pole `enabled`
 * po prostu nie jest już częścią typu AmbiencePrefs, więc jest ignorowane —
 * nie blokuje startu odgłosów natury (wsteczna kompatybilność bez
 * migracji/czyszczenia klucza).
 */

const STORAGE_KEY = 'civ-ambience-prefs-v1';

export interface AmbiencePrefs {
  /** 0..1 */
  volume: number;
}

const DEFAULT_PREFS: AmbiencePrefs = { volume: 0.7 };

/** Odczyt zapisanej głośności (lub domyślna: 0.7). Waliduje defensywnie.
 *  Ewentualne stare pole `enabled` w zapisanym JSON-ie jest ignorowane —
 *  patrz komentarz na górze pliku. */
export function loadAmbiencePrefs(): AmbiencePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<AmbiencePrefs> | null;
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
export function saveAmbiencePrefs(prefs: AmbiencePrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}
