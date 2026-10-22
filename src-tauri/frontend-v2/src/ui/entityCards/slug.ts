/**
 * entityCards/slug.ts — slugify NIEZALEŻNY od dwóch istniejących implementacji.
 *
 * ECHO właściciela (Pytanie 5, `docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md`) = C:
 * ten plik implementuje WŁASNY, poprawny algorytm slugify (pełna tabela `PL_DIACRITICS`,
 * wzorem `gra/src/game/research.ts:199`) i jest używany WYŁĄCZNIE przez nowy system kart
 * (`entityCards/**`). NIE zastępuje i NIE jest zastępowany przez:
 *   - `slugify()` prywatne w `gra/src/ui/sciencePicker.ts:99` (NFD-strip — dzisiejsze
 *     drzewko technologii, `TECH_MAP`/`techToSlug`/`techNameFromSlug`, zostaje nietknięte).
 *   - `slugifyImprovementLabel()` w `gra/src/game/research.ts:199` (jawna tabela — dzisiejszy
 *     gating budowy ulepszeń `improvementGateMet`, zostaje nietknięty).
 *
 * Powód: polskie „ł" (U+0142) NIE jest kompozycją bazowej litery + znak diakrytyczny w
 * sensie Unicode — NFD go nie rozkłada, więc NFD-strip w `sciencePicker.ts` go gubi
 * (`Łucznik` → `ucznik`, nie `lucznik`). Zweryfikowany dowód dryfu na 131 realnych polskich
 * nazwach z `gra/data/{tech,units,terrain-improvements}.json`: 14 rozbieżnych, wszystkie
 * z „ł" — patrz `07-operator-T1.md` dla pełnej tabeli. Ten plik unika obu wariantów przez
 * jawną, kompletną tabelę transliteracji zamiast normalizacji Unicode.
 *
 * Konsekwencja resolverów w `registry.ts` (patrz plan §2 i `08-dispatch-T1-wznowienie.md`):
 *   - `technology`: resolver REUŻYWA `TECH_MAP`/`techNameFromSlug` z `sciencePicker.ts`
 *     (WARIANT A, NFD-strip) — NIE ten `slugify()` — bo drzewko technologii musi dostać
 *     te same slugi co dziś.
 *   - `unit`: dla jednostek nie ma dziś ŻADNEGO istniejącego sluga do zachowania
 *     kompatybilności wstecznej, więc resolver buduje WŁASNĄ `Map<slug, UnitDef>` przy
 *     starcie, używając TEGO pliku (WARIANT C, nowy, poprawny).
 */

/** Pełna tabela polskich znaków diakrytycznych → ASCII, wzorem `research.ts:194-197`. */
const PL_DIACRITICS: Readonly<Record<string, string>> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n',
  ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

/**
 * Normalizuje dowolną nazwę (polską lub nie) do sluga: lowercase, polskie diakrytyki
 * przez jawną tabelę (bez utraty liter, w przeciwieństwie do NFD-strip), spacje/
 * interpunkcja → `_`, bez wiodących/końcowych podkreśleń.
 *
 * `slugify('Łucznik')` → `'lucznik'`; `slugify('Rydwan (woły)')` → `'rydwan_woly'`.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL_DIACRITICS[c] ?? c)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
