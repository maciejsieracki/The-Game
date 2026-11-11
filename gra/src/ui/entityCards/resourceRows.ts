/**
 * entityCards/resourceRows.ts — R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1.
 *
 * Zamiana nazw/id surowców z danych (jednostki, technologie, ulepszenia terenu) na typowane
 * `EntityCardRowResource[]`, żeby wspólny renderer rysował ikonę + liczbę zamiast nazwy.
 * Nieznane tokeny (np. „handel" — to nie surowiec magazynu) zostają zwykłym tekstem w `rest`.
 */
import { STOCK_RESOURCE_LABEL } from '../../game/building-stock-cost';
import resourcesJson from '../../../data/resources.json';
import { YIELD_CHIP } from '../resourceAmountChip';
import type { EntityCardRowResource } from './types';

function fold(s: string): string {
  return s.replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
}

/** Odmiany dopełniaczowe i nazwy z danych → id (`Dostęp do drewna`, `trzody`, `krowa/byk`). */
const ALIASES: Readonly<Record<string, string>> = {
  drewna: 'drewno', kamienia: 'kamien', gliny: 'glina', brazu: 'braz', zelaza: 'zelazo', cegly: 'cegla',
  trzody: 'bydlo', trzoda: 'bydlo', 'krowa/byk': 'bydlo', owiec: 'owce', lamy: 'lama', konia: 'kon', koni: 'kon',
  ceramiki: 'ceramika', soli: 'sol', zlota: 'zloto', stali: 'stal', rudy: 'ruda', 'rudy zelaza': 'ruda_zelaza', 'rudy cyny': 'ruda_cyny',
};

const KNOWN: ReadonlySet<string> = (() => {
  const out = new Set<string>(Object.keys(STOCK_RESOURCE_LABEL));
  for (const id of ['bydlo', 'owce', 'lama']) out.add(id);
  for (const r of resourcesJson as unknown as Array<{ Surowiec?: unknown }>) {
    if (typeof r?.Surowiec === 'string') out.add(fold(r.Surowiec).replace(/[^a-z0-9]+/g, '_'));
  }
  // Żywność to strumień plonów (nie pozycja magazynu kosztów/wymagań) — zostaje tekstem.
  out.delete('zywnosc');
  return out;
})();

/** id surowca dla nazwy/id/odmiany z danych albo `null` (to nie surowiec z ikoną). */
export function resourceIdFromName(token: string | null | undefined): string | null {
  const base = fold(String(token ?? '').replace(/\(prereq\)/gi, '')).replace(/^dostep do\s+/, '').trim();
  if (!base) return null;
  if (ALIASES[base]) return ALIASES[base]!;
  const t = base.replace(/[^a-z0-9/]+/g, '_').replace(/^_+|_+$/g, '');
  if (ALIASES[t]) return ALIASES[t]!;
  return KNOWN.has(t) ? t : null;
}

/** Lista „drewno, kamień; trzody, owiec" → chipy + tekst tokenów, które nie są surowcami. */
export function resourcesFromList(
  list: string | null | undefined,
  amount?: string | number,
): { resources: EntityCardRowResource[]; rest: string } {
  const resources: EntityCardRowResource[] = [];
  const rest: string[] = [];
  for (const raw of String(list ?? '').split(/\s*[,;]\s*/)) {
    const tok = raw.replace(/\s*\(prereq\)/gi, '').trim();
    if (!tok) continue;
    const id = resourceIdFromName(tok);
    if (id) {
      if (!resources.some((r) => r.id === id)) resources.push(amount === undefined ? { id } : { id, amount });
    } else rest.push(tok);
  }
  return { resources, rest: rest.join(', ') };
}

/** Słowa poprzedzające nazwę budynku/obiektu, po których „brązu/żelaza/złota" NIE jest surowcem
 * („Odlewnia brązu", „Kuźni żelaza", „Kopalnia złota"). */
const BUILDING_MODIFIER_PREV: ReadonlySet<string> = new Set([
  'odlewnia', 'odlewni', 'odlewnie', 'kuznia', 'kuzni', 'kuznie', 'kopalnia', 'kopalni', 'kopalnie',
  // nazwy epok („epoki Żelaza", „budynki brązu", „epoka Brązu") — to nie surowiec magazynu
  'epoki', 'epoka', 'epoce', 'epoke', 'budynki', 'wojska',
].map(fold));

/** Notatki deweloperskie w nawiasach (`(TYP 1 — bez desek, B-SUROW-BUD-03)`, `(hex.zloze=sol)`,
 * `(econ-params.json:397-402)`, `(src/game/zloto-access.ts:6)`) — nie dla gracza. */
const DEV_NOTE_RE =
  /\s*\((?=[^)]*(?:\bTYP\s*\d|\bB-[A-Z]+-[A-Z0-9-]+|hex\.zloze|\.(?:json|ts|cjs)\b))[^)]*\)/g;

/** Część wiersza: zwykły tekst albo surowiec (sama ikona; nazwa trafia do title/aria-label). */
export type EntityCardValuePart = string | EntityCardRowResource;

/**
 * Proza z nazwami surowców („Dostęp do Kamienia w imperium”, „glina → cegła”) → części:
 * tekst + `{id}` dla każdej nazwy z ikoną. Dwuwyrazowe nazwy („ruda żelaza”) mają pierwszeństwo;
 * „Odlewnia brązu”/„Kopalnia złota” zostają tekstem (to budynki). Zwraca `null`, gdy tekst nie
 * zawiera żadnego surowca (wtedy wiersz zostaje zwykłym `value`).
 */
/** Słowa-plony (po `fold`) rozpoznawane w prozie wierszy bonusów/warunków, gdy `yields = true`. */
const YIELD_WORDS: Readonly<Record<string, string>> = {
  zywnosc: 'zywnosc', praca: 'praca', pracy: 'praca', podatek: 'podatek', podatku: 'podatek',
  pieniadz: 'pieniadz', pieniadze: 'pieniadz', pieniadza: 'pieniadz', pieniedzy: 'pieniadz',
};

export function resourceTextParts(text: string | null | undefined, yields = false): EntityCardValuePart[] | null {
  const src = String(text ?? '').replace(DEV_NOTE_RE, '');
  const wordRe = /[\p{L}\p{N}]+/gu;
  const words: Array<{ w: string; start: number; end: number }> = [];
  for (let m = wordRe.exec(src); m; m = wordRe.exec(src)) {
    words.push({ w: m[0], start: m.index, end: m.index + m[0].length });
  }
  const parts: EntityCardValuePart[] = [];
  let cursor = 0;
  let found = false;
  const modChain = new Set<number>();
  for (let i = 0; i < words.length; i++) {
    const cur = words[i]!;
    const nxt = words[i + 1];
    const prev = words[i - 1];
    // Fragmenty techniczne (`hex.zloze=sol`, `zloto-access.ts`) — zostają tekstem.
    const before = src[cur.start - 1] ?? '';
    const after = src[cur.end] ?? '';
    if (before === '=' || before === '.' || after === '-' || (after === '.' && /\p{L}/u.test(src[cur.end + 1] ?? ''))) continue;
    if (prev && BUILDING_MODIFIER_PREV.has(fold(prev.w))) { modChain.add(i); continue; }
    // „Odlewnia brązu/żelaza": drugi człon po „/" to nadal nazwa budynku, nie surowiec.
    if (prev && modChain.has(i - 1) && src.slice(prev.end, cur.start).trim() === '/') { modChain.add(i); continue; }
    let id: string | null = null;
    let endIdx = i;
    if (nxt && /^\s+$/.test(src.slice(cur.end, nxt.start))) {
      id = resourceIdFromName(`${cur.w} ${nxt.w}`);
      if (id) endIdx = i + 1;
    }
    if (!id) id = resourceIdFromName(cur.w);
    if (!id && yields) id = YIELD_WORDS[fold(cur.w)] ?? null;
    if (!id) continue;
    if (cur.start > cursor) parts.push(src.slice(cursor, cur.start));
    parts.push({ id });
    cursor = words[endIdx]!.end;
    i = endIdx;
    found = true;
  }
  if (!found) return null;
  if (cursor < src.length) parts.push(src.slice(cursor));
  return parts;
}

/** Tekst bez notatek deweloperskich (pole `value` jako rezerwowy zwykły tekst). */
export function stripDevNotes(text: string): string {
  return text.replace(DEV_NOTE_RE, '');
}

/** Pola wiersza dla prozy z nazwami surowców: `value` = tekst zwykły, `valueParts` = ikony w tekście. */
export function proseRowFields(text: string, yields = false): { value: string; valueParts?: EntityCardValuePart[] } {
  const clean = stripDevNotes(text);
  const parts = resourceTextParts(clean, yields);
  return parts ? { value: clean, valueParts: parts } : { value: clean };
}

// ---------------------------------------------------------------------------------------------
// R-WEB-UI-RESOURCE-ICONS-YIELDS-WONDERS-Q1 — plony i bonusy (Żywność, Praca, Kultura, Nauka, Wiara,
// Podatek, Pieniądz + surowce typu Kamień/Drewno) jako DANE wiersza → chip „liczba + ikona".
// Celowo OSOBNE od `resourceIdFromName`/`resourceTextParts` (proza): „Praca"/„Kultura" w opisach
// prozą zostają tekstem, ikony dostają tylko wiersze, które adapter wskazuje jako plon/bonus.
// ---------------------------------------------------------------------------------------------

/** Klucz danych (`zywnosc`, `handel`, `kamien`) lub nazwa → id chipa (plon z ikoną marki albo surowiec) / `null`. */
export function yieldChipIdFromKey(key: string | null | undefined): string | null {
  const k = fold(String(key ?? '')).replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!k) return null;
  if (k === 'handel') return 'podatek'; // strumień podatku (terminologia C)
  if (YIELD_CHIP[k]) return k;
  const res = resourceIdFromName(k);
  return res ?? null;
}

/** Liczba ze znakiem na początku tekstu: `+2 pkt/turę (…)` → `{ amount: '+2', rest: ' pkt/turę (…)' }`. */
const LEADING_AMOUNT_RE = /^\s*([+\-−]?\d+(?:[.,]\d+)?%?)(.*)$/s;

/**
 * Wiersz „[plon] liczba reszta": `value` zostaje pełnym tekstem rezerwowym, `valueParts` niesie
 * chip z kwotą i resztę tekstu. Gdy tekst nie zaczyna się liczbą — chip bez kwoty + cały tekst.
 */
export function yieldValueFields(id: string, valueText: string): { value: string; valueParts: EntityCardValuePart[] } {
  const m = LEADING_AMOUNT_RE.exec(valueText);
  if (m) {
    const rest = m[2] ?? '';
    return { value: valueText, valueParts: rest ? [{ id, amount: m[1]! }, rest] : [{ id, amount: m[1]! }] };
  }
  return { value: valueText, valueParts: [{ id }, ` ${valueText}`] };
}

/** Lista wpisów `{ key, amount }` (np. bonusy cudu/efekty technologii) → części „+2 [ikona], +2 [ikona]".
 * Wpis bez ikony (np. Zadowolenie) zostaje tekstem `Nazwa +N`. `value` = tekst rezerwowy. */
export function yieldEntryParts(
  entries: ReadonlyArray<{ key: string; label: string; amount: number }>,
  separator = ', ',
): { value: string; valueParts: EntityCardValuePart[] } {
  const parts: EntityCardValuePart[] = [];
  const plain: string[] = [];
  entries.forEach((e, i) => {
    const sign = e.amount > 0 ? '+' : '';
    const amount = `${sign}${e.amount}`;
    if (i > 0) parts.push(separator);
    const id = yieldChipIdFromKey(e.key);
    if (id) parts.push({ id, amount });
    else parts.push(`${amount} ${e.label}`);
    plain.push(`${amount} ${e.label}`);
  });
  return { value: plain.join(separator), valueParts: parts };
}
