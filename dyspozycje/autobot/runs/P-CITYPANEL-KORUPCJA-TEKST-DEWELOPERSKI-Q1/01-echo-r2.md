ECHO (orkiestrator), runda 2, w odpowiedzi na DECISION_REQUIRED zgłoszone
niezależnie przez Operatora i Evaluatora rundy 1:

Sprzeczność potwierdzona: Kryterium 1 (zero słowa "placeholder" w
renderowanym DOM, poza nazwą stałej w kodzie) jest niespełnialne przy
allowlistcie rundy 1, która zakazywała ruszania `appendDetailFormula`/
`appendDetailAlgo` — a dwie linie w tych właśnie wywołaniach zawierają
dosłowne słowo "placeholder":
- linia ~10480: `` `strataKorupcji = handelBrutto × ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% (placeholder UI)` ``
- linia ~10498: `` `Odejmij korupcję (placeholder ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto; docelowo: dystans, miasta, cap) → handelNetto.` ``

DECYZJA: Kryterium 1 zostaje w PIERWOTNYM brzmieniu (zero "placeholder" w
całym renderowanym DOM karty). Allowlista rundy 1 zostaje ROZSZERZONA
WYŁĄCZNIE o te dwie konkretne linie, WYŁĄCZNIE na poziomie słowa — usuń
literalny ciąg "placeholder" z ich treści, zachowując w 100% nietkniętą
resztę: samą strukturę wzoru/formuły, wszystkie zmienne, `${HANDEL_KORUPCJA_PCT_PLACEHOLDER}`
jako identyfikator (NIE zmieniaj nazwy tej stałej — to osobna sprawa poza
zakresem), kolejność kroków algorytmu, wszystkie pozostałe linie
`appendDetailFormula`/`appendDetailAlgo`. Przykład minimalnej, akceptowalnej
zmiany (nie kopiuj dosłownie — dopasuj do zdania):
- `(placeholder UI)` → `(dziś: stały %)` albo `(uproszczony model)`
- `(placeholder X% brutto; docelowo: ...)` → `(dziś: stały X% brutto; docelowo: ...)`

Zero innych zmian w tych dwóch funkcjach dozwolone. Cała reszta dispatchu
(00-dispatch.md) — GOAL, RECON, Kryteria 2-5, pozostała ALLOWLISTA, IZOLACJA,
REGUŁA PRZECIW SAMOOSZUKIWANIU, PROCEDURA NAPRAWCZA, GRANICE, OBIEG — bez
zmian, w mocy jak w rundzie 1.

Baza tej rundy: commit `8bdc9581` (już zawiera poprawne, zweryfikowane przez
Evaluatora rundy 1, 4 fragmenty z RECON — NIE cofaj tej pracy, buduj na niej).
Zaktualizuj istniejący test `gra/tools/korupcja-tekst-gracz-real-render-test.cjs`
(NIE twórz nowego pliku) o dodatkową asercję: żywy DOM całej karty (nie tylko
naprawionego w rundzie 1 obszaru) nie zawiera już ŻADNEGO wystąpienia słowa
"placeholder"/"Placeholder".
