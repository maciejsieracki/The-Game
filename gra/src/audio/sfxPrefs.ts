/**
 * sfxPrefs.ts — preferencje gracza dla CZWARTEGO, niezależnego kanału audio:
 * efekty dźwiękowe jednostek (marsz — muzyka-antyczna.ts, sekcja "SFX
 * JEDNOSTEK"). Zapisywane w localStorage OSOBNO od muzyki (musicPrefs.ts) i
 * odgłosów natury (ambiencePrefs.ts) — pod własnym kluczem
 * 'civ-sfx-prefs-v1', żeby nie dotykać formatu/wartości już zapisanych
 * preferencji tamtych dwóch kanałów. Struktura i defensywna walidacja
 * identyczne jak w ambiencePrefs.ts/musicPrefs.ts — celowo, to ta sama
 * rodzina "prosty przełącznik + suwak w localStorage".
 * Cicho odpuszcza, gdy localStorage jest niedostępny (tryb prywatny / file://).
 *
 * Domyślna głośność jest CELOWO niższa niż muzyki/natury (0.7) — marsz ma być
 * tłem ruchu, nie wydarzeniem (patrz komentarz przy marchVolume w
 * muzyka-antyczna.ts).
 *
 * Pole `enabled` NIE JEST trwałe — ten sam wzorzec co C-AUD-Q5=A
 * (musicPrefs.ts) i TEMAT #9 (ambiencePrefs.ts): wyciszenie przełącznikiem w
 * menu pauzy W TRAKCIE rozgrywki ma dotyczyć WYŁĄCZNIE tej jednej rozgrywki.
 * Wyciszenie jest ULOTNE: żyje tylko jako zmienna sesyjna `sfxUnitsEnabled` w
 * main.ts, resetowana do WŁ. w startGameMusic() — nigdy nie trafia tu do
 * localStorage. Ten moduł zapisuje/odczytuje TYLKO `volume` (suwak — to
 * zostaje trwałe).
 */

const STORAGE_KEY = 'civ-sfx-prefs-v1';

export interface SfxPrefs {
  /** 0..1 */
  volume: number;
}

const DEFAULT_PREFS: SfxPrefs = { volume: 0.35 };

/** Odczyt zapisanej głośności (lub domyślna: 0.35). Waliduje defensywnie. */
export function loadSfxPrefs(): SfxPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<SfxPrefs> | null;
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
export function saveSfxPrefs(prefs: SfxPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}
