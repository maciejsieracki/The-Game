/**
 * techUnlockParse.ts
 *
 * Wspólny parser pola `tech.json`'s „Odblokowuje budynek": rozdziela osadzony
 * segment „Jednostki: A, B, ..." od właściwych nazw budynków — oraz dostarcza
 * PRAWDZIWĄ, kompletną listę jednostek odblokowywanych przez technologię, z
 * `units.json`'s pola `Tech` (jedyne źródło, którym bramkuje się budowa
 * jednostek w silniku — `research.ts::unlocksFor`, `production.ts::availableProduction`
 * — patrz `entityCards/technologyAdapter.ts:100`, wzorzec).
 *
 * Wydzielone do osobnego modułu (zamiast duplikacji), bo `techTreeView.ts`
 * importuje z `sciencePicker.ts` (`techToSlug`) — import w drugą stronę
 * utworzyłby cykl. R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1.
 *
 * UWAGA: `jednostki` zwracane przez `parseUnlockBuildings()` to WCIĄŻ ten sam
 * przestarzały, niekompletny tekst z `tech.json` — zwracane WYŁĄCZNIE po to,
 * by konsumenci mogli go odrzucić przy budowie listy budynków. NIE używaj go
 * do wyświetlania listy jednostek graczowi — do tego służy `unitsUnlockedByTech()`.
 */
import unitsData from '../../data/units.json';

export function splitList(raw: string | null | undefined, sep: RegExp): string[] {
  return (raw ?? '').split(sep).map(s => s.trim()).filter(s => s !== '' && s !== '—' && s !== '-');
}

/** „Odblokowuje budynek" → budynki (właściwe) + jednostki (osadzony, przestarzały
 * tekst — do ODRZUCENIA, nie do wyświetlenia; patrz `unitsUnlockedByTech()`). */
export function parseUnlockBuildings(raw: string | null | undefined): { budynki: string[]; jednostki: string[] } {
  const budynki: string[] = [];
  const jednostki: string[] = [];
  for (const part of splitList(raw, /;/)) {
    const m = /^Jednostki:\s*(.*)$/i.exec(part);
    if (m) jednostki.push(...splitList(m[1] ?? '', /,/));
    else budynki.push(part);
  }
  return { budynki, jednostki };
}

interface UnitRow {
  Jednostka: string;
  Tech?: string | null;
}

/** Kompletna lista nazw jednostek odblokowywanych przez technologię —
 * z `units.json`'s pola `Tech` (jedyne poprawne, kompletne źródło; patrz
 * nagłówek modułu). `techName` to nazwa kanoniczna z `tech.json`'s pola
 * „Technologia" (NIE slug). */
export function unitsUnlockedByTech(techName: string): string[] {
  return (unitsData as UnitRow[])
    .filter(u => u.Tech === techName)
    .map(u => u.Jednostka);
}
