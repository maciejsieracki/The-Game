/**
 * relief-preserving-improvements.ts — ulepszenia terenu, które NIE spłaszczają wzgórza/góry
 * pod sobą; model wtapia się w istniejący relief (kopiec/szczyt) zamiast siadać na
 * wypłaszczonym heksie. Wydzielone z main.ts (był tam PRESERVES_HILL_RELIEF_KEYS +
 * preservesHillRelief), żeby predykat dało się objąć testem regresji bez ładowania
 * całego main.ts (który ma zależności DOM/WebGL i nie nadaje się do bundlowania w Node).
 *
 * Jawne wyjątki BEZ wspólnego prefiksu: hodowla solo (bydło/owce/lama — stoją na kopcu)
 * + kamieniołom (Maciej 2026-07-24, R-KAMIEN-RELIEF: kamieniołom ma być wkomponowany w
 * istniejące wzgórze/górę, model siada na reliefie przy ściance heksa
 * (elevatedTerrainEdgeSurfaceY), a nie je spłaszczać).
 *
 * PREFIKS "kopalnia" / "kopalnia_*" (decyzja właściciela R-KAMIEN-FUTURE-Q1=C, 2026-08-06,
 * doprecyzowanie decyzji nadrzędnej R-KAMIEN-RELIEF-FOLLOWUP-Q1):
 * każdy KLUCZ ulepszenia zaczynający się od prefiksu "kopalnia" (dziś: kopalnia_miedzi,
 * kopalnia_zelaza, kopalnia_zlota, legacy "kopalnia"; w przyszłości np. kopalnia_wegla)
 * ma AUTOMATYCZNIE zachowywać relief wzgórza/góry pod sobą — bez konieczności osobnej
 * decyzji ABC za każdym nowym typem kopalni. To PREFIKS, nie dopasowanie substringu:
 * 'niekopalnia' i 'kopalniany' NIE mają się łapać, bo nie zaczynają się od "kopalnia".
 * Uwaga: to obejmuje WYŁĄCZNIE zachowanie reliefu; nowy typ kopalni i tak wymaga osobno
 * wpisu w unii ImprovementKey, case'u bryły 3D i wpisu w SUROWIEC_KEYS (render/improvements.ts).
 */

/** Jawne klucze BEZ prefiksu "kopalnia" — hodowla solo + kamieniołom (inny model niż kopalnie). */
const PRESERVES_HILL_RELIEF_EXPLICIT_KEYS = new Set(['bydlo', 'owce', 'lama', 'kamieniolom']);

const KOPALNIA_PREFIX = 'kopalnia_';
/** Legacy uniwersalna "kopalnia" (stare zapisy/migracje, bez sufiksu surowca). */
const KOPALNIA_LEGACY_KEY = 'kopalnia';

/**
 * Czy POJEDYNCZY klucz ulepszenia zachowuje relief wzgórza/góry pod sobą.
 * Prefiks "kopalnia"/"kopalnia_*" łapie też przyszłe typy kopalni bez zmiany kodu
 * (R-KAMIEN-FUTURE-Q1=C).
 */
export function preservesHillReliefKey(key: string): boolean {
  if (PRESERVES_HILL_RELIEF_EXPLICIT_KEYS.has(key)) return true;
  return key === KOPALNIA_LEGACY_KEY || key.startsWith(KOPALNIA_PREFIX);
}

/** Czy WSZYSTKIE warstwy ulepszeń na heksie zachowują relief (pusta lista warstw = nie). */
export function preservesHillRelief(layers: readonly string[]): boolean {
  return layers.length > 0 && layers.every(preservesHillReliefKey);
}
