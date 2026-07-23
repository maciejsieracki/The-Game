/**
 * leaderPortraits.ts — portrety władców w medalionach dowódców (bitwa/preBattle/dyplomacja).
 * Wdrożenie wg docs/ux/claude-design/_dist/PORTRETY-WLADCOW-2026-07-23/DYSPOZYCJA-WDROZENIE.md (KROK 2).
 *
 * Assety: gra/src/assets/portrety/portrait-{civId}-{epoka}.jpg (256×256, 15 cywilizacji ×
 * epoki kamien/braz — zelazo NIE istnieje jeszcze, patrz KROK 1 dyspozycji). `import.meta.glob`
 * z `eager: true` — vite.config.ts ma assetsInlineLimit ustawiony bardzo wysoko (single-file
 * build), więc każdy jpg trafia do bundla jako data-URI, tak samo jak inne assety w tym repo.
 *
 * civId = ikonaId z gra/data/civs.json — nazwy plików już 1:1 z ikonaId (zweryfikowane
 * `ls gra/src/assets/portrety/` + grep ikonaId civs.json), więc żadnego jawnego mapowania
 * nazw nie trzeba (nie ma np. "sumer" vs "sumerowie" — civs.json ma "sumer").
 */

type EpochKey = 'kamien' | 'braz' | 'zelazo';

/** Kolejność epok gry: 1=kamien, 2=braz, 3=zelazo (patrz main.ts ERA_ID_TO_NUM). */
const EPOCH_BY_ERA: readonly EpochKey[] = ['kamien', 'braz', 'zelazo'];

// eager: true -> moduł od razu ma { default: <data-URI string> } (nie Promise) dla każdego pliku.
const PORTRAIT_MODULES = import.meta.glob('../assets/portrety/*.jpg', { eager: true, import: 'default' }) as Record<string, string>;

/** civId -> epoka -> data-URI (tylko epoki, dla których faktycznie istnieje plik). */
const PORTRAIT_MAP: Record<string, Partial<Record<EpochKey, string>>> = {};

const FILE_RE = /portrait-([a-z0-9]+)-(kamien|braz|zelazo)\.jpg$/i;

for (const [path, url] of Object.entries(PORTRAIT_MODULES)) {
  const m = FILE_RE.exec(path);
  if (!m) continue;
  const civId = m[1]!.toLowerCase();
  const epoch = m[2]!.toLowerCase() as EpochKey;
  (PORTRAIT_MAP[civId] ??= {})[epoch] = url;
}

/**
 * URL (data-URI) portretu władca danej cywilizacji w danej epoce, albo `null` gdy brak
 * (civId nieznany LUB brak pliku dla tej i wszystkich wcześniejszych epok — wtedy wołający
 * ma zostawić dotychczasowy medalion/ikonę bez zmian, patrz dyspozycja KROK 2 pkt 2).
 *
 * Epoka: era 1=kamien, 2=braz, 3=zelazo. Brak portretu danej epoki (np. Żelazo — jeszcze
 * nie narysowane) -> bierz najbliższą WCZEŚNIEJSZĄ (zelazo→braz→kamien).
 */
export function leaderPortraitUrl(civId: string | null | undefined, era: number): string | null {
  const key = String(civId ?? '').trim().toLowerCase();
  if (!key) return null;
  const byEpoch = PORTRAIT_MAP[key];
  if (!byEpoch) return null;

  const startIdx = Math.max(0, Math.min(EPOCH_BY_ERA.length - 1, Math.round(era) - 1));
  for (let i = startIdx; i >= 0; i--) {
    const url = byEpoch[EPOCH_BY_ERA[i]!];
    if (url) return url;
  }
  return null;
}
