/**
 * diplomacyTipText.ts — wspólny helper planszy dyplomacji (R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1).
 *
 * Zasada: na planszy zostają tylko liczby decyzyjne, pozycje koszyka, przyciski i jednolinijkowy
 * werdykt. Wyjaśnienia, wyliczenia i opisy trybów NIE są usuwane — trafiają do atrybutu `title`
 * elementu, którego dotyczą (ten sam mechanizm dymka co reszta gry, patrz hudTitleTooltip.ts,
 * scope `.civ-diplo-aud` / `.civ-diplo-basket`).
 *
 * EN: shared helper for the diplomacy boards. Only decision numbers, basket rows, buttons and a
 * one-line verdict stay visible; explanations are moved (not deleted) into the `title` of the
 * element they describe.
 */

/** Escape dla wartości atrybutu HTML (w tym cudzysłowów i nowych linii w title). */
export function escTipAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Zamienia kawałek HTML na zwykły tekst (do tooltipa) — bez tagów, z odkodowanymi encjami. */
export function plainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Buduje ` title="…"` z listy części tooltipa (puste części pomijane, rozdzielone nową linią).
 * Zwraca pusty string, gdy nie ma czego pokazać.
 */
export function detailTipAttr(parts: ReadonlyArray<string | null | undefined | false>): string {
  const txt = parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map(p => p.trim())
    .join('\n');
  return txt ? ' title="' + escTipAttr(txt) + '"' : '';
}

/**
 * Tekst fragmentu HTML z zachowaniem treści atrybutów `title` (dymki zagnieżdżone w fragmencie).
 * Sama `plainTextFromHtml` gubi tekst `title`, a wyjaśnienie ma zostać w tooltipie, nie zniknąć
 * (R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1).
 */
export function plainTextWithTitles(html: string): string {
  const main = plainTextFromHtml(html);
  // Tytuł już zawarty w tekście elementu (np. <div title="X">X</div>) nie jest dokładany drugi raz
  // (R-WEB-UI-DIPLO-TOOLTIP-DUPLICATE-ROWS-Q1); duplikaty tytułów też są pomijane.
  const titles = Array.from(new Set(
    Array.from(html.matchAll(/ title="([^"]*)"/g))
      .map(m => plainTextFromHtml(m[1] ?? ''))
      .filter(t => t.length > 0 && !main.includes(t)),
  ));
  return [main, ...titles].filter(t => t.length > 0).join(' · ');
}
