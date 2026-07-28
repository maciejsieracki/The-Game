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

import civsRaw from '../../data/civs.json';
import type { CivsData } from '../data/loader';

type EpochKey = 'kamien' | 'braz' | 'zelazo' | 'antyk';

/**
 * Kolejność epok gry: 1=kamien, 2=braz, 3=zelazo, 4=antyk (na zapas — gra dziś kończy na
 * Żelazie; portrety mają pliki tylko dla kamien/braz/zelazo, więc era 4 zawsze spada przez
 * fallback do zelazo/braz/kamien w leaderPortraitUrl; leaderName ma faktyczne imiona "antyk"
 * w civs.json).
 */
const EPOCH_BY_ERA: readonly EpochKey[] = ['kamien', 'braz', 'zelazo', 'antyk'];

/** civId (ikonaId) -> wodzowie{kamien/braz/zelazo/antyk}, zbudowane raz z civs.json (loader.ts wczytuje ten sam plik). */
const LEADER_MAP: Record<string, Partial<Record<EpochKey, string>>> = {};
for (const civ of (civsRaw as CivsData).cywilizacje) {
  if (civ.ikonaId && civ.wodzowie) {
    LEADER_MAP[civ.ikonaId.toLowerCase()] = civ.wodzowie;
  }
}

/**
 * civId (ikonaId) -> pula imion władców (wodzowiePula w civs.json).
 * C-BITWA-WLADCA=B (Maciej 2026-07-25): każda cywilizacja ma pulę 10 imion, a KAŻDY
 * właściciel tej samej kultury (państwo LUB miasto-państwo) dostaje OSOBNE imię z puli.
 */
const LEADER_POOL_MAP: Record<string, readonly string[]> = {};
for (const civ of (civsRaw as CivsData).cywilizacje) {
  const pula = (civ as { wodzowiePula?: readonly string[] }).wodzowiePula;
  if (civ.ikonaId && Array.isArray(pula) && pula.length > 0) {
    LEADER_POOL_MAP[civ.ikonaId.toLowerCase()] = pula;
  }
}

/**
 * Imię władcy z puli wg indeksu właściciela (C-BITWA-WLADCA=B). Każdy właściciel tej
 * samej cywilizacji dostaje inne imię (indeks = pozycja wśród właścicieli tej kultury).
 * Fallback: gdy brak puli dla danej cywilizacji — imię per-epoka (leaderName).
 */
export function leaderNameFromPool(
  civId: string | null | undefined,
  ownerIndex: number,
  era = 1,
): string | null {
  if (!civId) return null;
  const pool = LEADER_POOL_MAP[civId.toLowerCase()];
  if (pool && pool.length > 0) {
    const i = ((ownerIndex % pool.length) + pool.length) % pool.length;
    return pool[i]!;
  }
  return leaderName(civId, era);
}

/**
 * Usuwa polskie znaki diakrytyczne (NFD + odrzucenie combining marks; Ł/ł nie
 * dekomponuje się w NFD, więc mapowane jawnie) i sprowadza do lowercase —
 * ten sam wzorzec co normName()/normalizeForMatch() w innych miejscach
 * silnika bitwy, żeby "Chińczycy"/"Słowianie" dały się dopasować bez akcentów.
 */
function foldDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
}

/**
 * civId (ikonaId) -> lista kluczy dopasowania (ikonaId + nazwa Cywilizacja,
 * oba bez polskich znaków), zbudowana raz z civs.json — źródło prawdy dla
 * WSZYSTKICH 15 cywilizacji (nie tylko Rzym/Grecja).
 */
const CIV_MATCH_CANDIDATES: readonly { icon: string; keys: readonly string[] }[] =
  (civsRaw as CivsData).cywilizacje
    .filter(c => c.ikonaId)
    .map(c => ({
      icon: c.ikonaId!.toLowerCase(),
      keys: [c.ikonaId, c.Cywilizacja]
        .filter((s): s is string => !!s)
        .map(foldDiacritics),
    }));

/** ikonaId (lowercase) → kanoniczna nazwa wyświetlana (Cywilizacja z civs.json). */
const CIV_DISPLAY_NAME_BY_ICON: Record<string, string> = {};
for (const civ of (civsRaw as CivsData).cywilizacje) {
  if (civ.ikonaId && civ.Cywilizacja) {
    CIV_DISPLAY_NAME_BY_ICON[civ.ikonaId.toLowerCase()] = civ.Cywilizacja;
  }
}

/**
 * Kanoniczna nazwa cywilizacji z civs.json dla ikonaId / typCywilizacji / samej nazwy.
 * Zwraca `null`, gdy klucz nie pasuje do żadnej z 15 cywilizacji.
 */
export function civDisplayNameFromKey(civKey: string | null | undefined): string | null {
  const raw = String(civKey ?? '').trim();
  if (!raw) return null;
  const folded = foldDiacritics(raw);
  const byIcon = CIV_DISPLAY_NAME_BY_ICON[folded];
  if (byIcon) return byIcon;
  for (const cand of CIV_MATCH_CANDIDATES) {
    if (cand.keys.includes(folded)) return CIV_DISPLAY_NAME_BY_ICON[cand.icon] ?? null;
  }
  return null;
}

/**
 * Etykieta na karcie dyplomacji: zachowuje złożone etykiety (miasto-państwo),
 * a techniczny klucz (np. „grecy") zamienia na Cywilizacja z JSON.
 */
export function civCardDisplayName(label: string, ikonaId?: string | null): string {
  const trimmed = (label ?? '').trim();
  const canonicalFromIcon = civDisplayNameFromKey(ikonaId);
  if (!trimmed) return canonicalFromIcon ?? '';
  if (trimmed.includes('·')) return trimmed;
  const canonicalFromLabel = civDisplayNameFromKey(trimmed);
  if (canonicalFromLabel && foldDiacritics(trimmed) === foldDiacritics(canonicalFromLabel)) {
    return canonicalFromLabel;
  }
  if (canonicalFromIcon && foldDiacritics(trimmed) === foldDiacritics(ikonaId ?? '')) {
    return canonicalFromIcon;
  }
  return trimmed;
}

/**
 * civId (ikonaId) dla dowolnej etykiety cywilizacji/państwa, albo `null` gdy
 * żadna z 15 cywilizacji civs.json nie pasuje.
 *
 * BŁĄD D (właściciel, 2026-07-24): battleScene.civIconIdFromLabel() rozpoznawał
 * jawnie tylko Rzym/Grecję (substring 'rzym'/'grec'), a WSZYSTKO inne (13 z 15
 * cywilizacji) spadało przez fallback na 'grecy' — bo tablica civRows, po
 * którą sięgał (opts.data.cywilizacje), nigdy nie jest wypełniana przez
 * żadnego wołającego (main.ts/mapFieldBattle.ts), więc pętla dopasowania
 * zawsze była pusta. Efekt: KAŻDA bitwa poza Rzymem pokazywała grecki
 * portret + "Minos" jako władcę, po OBU stronach, niezależnie od realnej
 * cywilizacji gracza/AI/miasta-państwa.
 *
 * Dopasowanie: (1) DOKŁADNE — etykieta to czysty ikonaId lub nazwa Cywilizacja
 * (typowe dla gracza: player.civType = ikonaId, np. "grecy"/"egipt"); (2)
 * CZĘŚCIOWE (includes) — etykiety miast-państw są złożone, np.
 * "Teby · Egipt · miasto-państwo" (patrz resolveOwnerBaseName/
 * formatOwnerDiploLabel w game/display-names.ts), więc szukamy nazwy
 * cywilizacji jako podciągu. Klucze <=2 znaki pomijane w trybie (2), żeby
 * uniknąć przypadkowych trafień.
 */
export function civIconIdFromCivLabel(label: string | null | undefined): string | null {
  const key = foldDiacritics(String(label ?? '').trim());
  if (!key) return null;
  for (const cand of CIV_MATCH_CANDIDATES) {
    if (cand.keys.includes(key)) return cand.icon;
  }
  for (const cand of CIV_MATCH_CANDIDATES) {
    if (cand.keys.some(k => k.length > 2 && key.includes(k))) return cand.icon;
  }
  return null;
}

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

/**
 * Imię władcy danej cywilizacji w danej epoce, albo `null` gdy civId nieznany lub brak
 * wpisu `wodzowie` w civs.json. Fallback epoki jak przy portretach (antyk→zelazo→braz→kamien).
 */
export function leaderName(civId: string | null | undefined, era: number): string | null {
  const key = String(civId ?? '').trim().toLowerCase();
  if (!key) return null;
  const byEpoch = LEADER_MAP[key];
  if (!byEpoch) return null;

  const startIdx = Math.max(0, Math.min(EPOCH_BY_ERA.length - 1, Math.round(era) - 1));
  for (let i = startIdx; i >= 0; i--) {
    const name = byEpoch[EPOCH_BY_ERA[i]!];
    if (name) return name;
  }
  return null;
}
