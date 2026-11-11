/**
 * text-names.ts — JEDEN resolver nazw wyświetlanych dla tekstu gracza (R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1).
 *
 * Identyfikator z danych (snake_case / ASCII, np. `lowie_rybackie`, `laka`, `rzeka_sasiad`) NIGDY nie
 * trafia do tekstu dla gracza wprost. Kolejność źródeł:
 *   1. data/terrain-improvements.json → pole `nazwa` (ulepszenia terenu),
 *   2. tabela terenów / warunków z cudów (poniżej; polskie znaki),
 *   3. fallback: `_` → spacja, pierwsza litera wielka (nieznany id nie jest surowym snake_case).
 *
 * Nazwy cywilizacji: data/wonders.json → `panstwa[id].nazwa`, fallback jak wyżej.
 */
import improvementsJson from '../../data/terrain-improvements.json';
import wondersJson from '../../data/wonders.json';
import resourcesJson from '../../data/resources.json';

/** Terreny (bazowe i z cudów), warunki sąsiedztwa i wymagania. Klucze = id z danych. */
const NAZWY_TERENOW_I_WARUNKOW: Readonly<Record<string, string>> = {
  laka: 'Łąka',
  rownina: 'Równina',
  wzgorze: 'Wzgórze',
  wzgorza: 'Wzgórza',
  gory: 'Góry',
  pustynia: 'Pustynia',
  plytkie_morze: 'Płytkie morze',
  wybrzeze: 'Wybrzeże',
  morze: 'Morze',
  polarny: 'Polarny',
  tropiki: 'Tropiki',
  las: 'Las',
  lowie_rybackie: 'Łowiska rybackie',
  rzeka_mala: 'Mała rzeka',
  rzeka_sasiad: 'Rzeka w sąsiedztwie',
  przy_miescie: 'Przy mieście',
  trudny_teren: 'Trudny teren',
  plaski_teren: 'Płaski teren',
  hex_sasiad_rzeka: 'Sąsiedztwo rzeki',
};

type ImprovementRow = { nazwa?: unknown };
const IMPROVEMENT_NAMES: Readonly<Record<string, ImprovementRow>> =
  improvementsJson as unknown as Record<string, ImprovementRow>;

/** Nazwy surowcÃ³w z resources.json (kolumna âSurowiecâ), klucz = slug (ASCII, bez diakrytyki): âRuda Å¼elazaâ â ruda_zelaza. */
function slugSurowca(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
const NAZWY_SUROWCOW: Readonly<Record<string, string>> = (() => {
  const out: Record<string, string> = {};
  for (const row of resourcesJson as unknown as Array<{ Surowiec?: unknown }>) {
    const n = typeof row?.Surowiec === 'string' ? row.Surowiec.trim() : '';
    const slug = n ? slugSurowca(n) : '';
    if (slug && !Object.prototype.hasOwnProperty.call(out, slug)) out[slug] = n;
  }
  return out;
})();

type PanstwoRow = { nazwa?: unknown };
const PANSTWA: Readonly<Record<string, PanstwoRow>> =
  (wondersJson as unknown as { panstwa?: Record<string, PanstwoRow> }).panstwa ?? {};

/** Fallback dla nieznanego id: „jakis_id" → „Jakis id". Nigdy nie zwraca snake_case. */
export function humanizeId(id: string): string {
  const s = String(id ?? '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.charAt(0).toLocaleUpperCase('pl-PL') + s.slice(1);
}

/** Nazwa wyświetlana terenu / ulepszenia / warunku po id z danych. */
export function nazwaWyswietlana(id: string | null | undefined): string {
  const key = String(id ?? '').trim();
  if (!key) return '';
  const impNazwa = IMPROVEMENT_NAMES[key]?.nazwa;
  if (typeof impNazwa === 'string' && impNazwa.trim() !== '') return impNazwa.trim();
  const tabela = NAZWY_TERENOW_I_WARUNKOW[key];
  if (tabela) return tabela;
  return NAZWY_SUROWCOW[key] ?? humanizeId(key);
}

/**
 * Lista nazw rozdzielona przecinkami/średnikami, w której część pozycji to surowe id (`bydlo`, `ruda_cyny`):
 * pozycje wyglądające jak id (`[a-z0-9_]+`) idą przez `nazwaWyswietlana`; pozostałe (np. `krowa/byk`) bez zmian.
 */
export function nazwyZListyId(lista: string | null | undefined): string {
  const src = String(lista ?? '');
  if (!src.trim()) return '';
  return src.split(/\s*([,;])\s*/).map((tok, i) => {
    if (i % 2 === 1) return tok === ',' ? ', ' : '; ';
    return /^[a-z0-9_]+$/.test(tok) ? nazwaWyswietlana(tok) : tok;
  }).join('').trim();
}

/** Nazwa wyświetlana cywilizacji po jej kluczu (np. `egipt` → nazwa z panstwa). */
export function nazwaCywilizacji(id: string | null | undefined): string {
  const key = String(id ?? '').trim();
  if (!key) return '';
  const nazwa = PANSTWA[key]?.nazwa;
  if (typeof nazwa === 'string' && nazwa.trim() !== '') return nazwa.trim();
  return humanizeId(key);
}

/** true, gdy id ma jawną nazwę (tabela NAZWY_TERENOW_I_WARUNKOW albo terrain-improvements.json); false = wyłącznie fallback humanizeId. */
export function maJawnaNazwe(id: string | null | undefined): boolean {
  const key = String(id ?? '').trim();
  if (!key) return false;
  const impNazwa = IMPROVEMENT_NAMES[key]?.nazwa;
  if (typeof impNazwa === 'string' && impNazwa.trim() !== '') return true;
  return Object.prototype.hasOwnProperty.call(NAZWY_TERENOW_I_WARUNKOW, key)
    || Object.prototype.hasOwnProperty.call(NAZWY_SUROWCOW, key);
}

/**
 * Pełny widok hasła encyklopedii (`full`) zaczyna się tabelą metadanych (`id`, `poradnik_ref`, `json_ref`,
 * `status_v1`, ścieżki plików) kończoną linią `---` — to dane redakcyjne, nie tekst dla gracza.
 * Zwraca treść od pierwszej sekcji po tej tabeli; hasło bez takiej tabeli zwraca bez zmian.
 */
export function stripEncyMetadata(full: string): string {
  const src = String(full ?? '');
  const head = src.slice(0, 1500);
  if (!/\|\s*\*{0,2}id\*{0,2}\s*\|/.test(head)) return src;
  const m = /\n---[ \t]*\n/.exec(src);
  if (!m || m.index > 1500) return src;
  return src.slice(m.index + m[0].length).replace(/^\s+/, '');
}

/** Wzorzec surowego identyfikatora snake_case (dla testów strażników). */
export const SNAKE_CASE_ID_RE = /\b[a-z]+_[a-z_]+\b/;
