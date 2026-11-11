/**
 * entityCards/resourceRows.ts — R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1.
 *
 * Zamiana nazw/id surowców z danych (jednostki, technologie, ulepszenia terenu) na typowane
 * `EntityCardRowResource[]`, żeby wspólny renderer rysował ikonę + liczbę zamiast nazwy.
 * Nieznane tokeny (np. „handel" — to nie surowiec magazynu) zostają zwykłym tekstem w `rest`.
 */
import { STOCK_RESOURCE_LABEL } from '../../game/building-stock-cost';
import resourcesJson from '../../../data/resources.json';
import type { EntityCardRowResource } from './types';

function fold(s: string): string {
  return s.replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
}

/** Odmiany dopełniaczowe i nazwy z danych → id (`Dostęp do drewna`, `trzody`, `krowa/byk`). */
const ALIASES: Readonly<Record<string, string>> = {
  drewna: 'drewno', kamienia: 'kamien', gliny: 'glina', brazu: 'braz', zelaza: 'zelazo', cegly: 'cegla',
  trzody: 'bydlo', trzoda: 'bydlo', 'krowa/byk': 'bydlo', owiec: 'owce', lamy: 'lama', konia: 'kon', koni: 'kon',
  soli: 'sol', zlota: 'zloto', stali: 'stal', rudy: 'ruda', 'rudy zelaza': 'ruda_zelaza', 'rudy cyny': 'ruda_cyny',
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
