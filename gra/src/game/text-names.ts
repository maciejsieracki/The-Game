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
  return NAZWY_TERENOW_I_WARUNKOW[key] ?? humanizeId(key);
}

/** Nazwa wyświetlana cywilizacji po jej kluczu (np. `egipt` → nazwa z panstwa). */
export function nazwaCywilizacji(id: string | null | undefined): string {
  const key = String(id ?? '').trim();
  if (!key) return '';
  const nazwa = PANSTWA[key]?.nazwa;
  if (typeof nazwa === 'string' && nazwa.trim() !== '') return nazwa.trim();
  return humanizeId(key);
}

/** Wzorzec surowego identyfikatora snake_case (dla testów strażników). */
export const SNAKE_CASE_ID_RE = /\b[a-z]+_[a-z_]+\b/;
